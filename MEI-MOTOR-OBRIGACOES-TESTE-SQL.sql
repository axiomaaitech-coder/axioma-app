-- ============================================================================
-- TESTE da Rodada 1 (motor de obrigações MEI). Rode DEPOIS dos blocos A–D.
-- Roda tudo dentro de uma transação e DESFAZ no final (rollback): nada fica gravado.
-- Entra como o usuário dono da empresa de teste "Horizonte (EXEMPLO)".
-- Resultado esperado: a última mensagem é "TODOS OS TESTES PASSARAM". Qualquer falha
-- para na hora com "FALHOU Tn: ...".
-- ============================================================================
begin;
select set_config('request.jwt.claims', '{"sub":"d6db18e3-7ff6-43db-bf8b-b7783079be6b","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  e constant uuid := 'a0000000-0000-4000-8000-00000000e001';   -- Horizonte (EXEMPLO), do usuário acima
  outra constant uuid := '2bcb0184-6e52-4bde-a4e2-12d70dd2e87d'; -- empresa de OUTRO usuário
  v_n int; v_ok boolean; v_r jsonb; v_r2 jsonb; v_id uuid; v_id2 uuid; v_pag uuid; v_val numeric; v_sit text; v_cp uuid;
begin
  -- preparo: dados MEI da empresa de teste (Serviços = INSS + ISS)
  insert into mei_dados (user_id, empresa_id, categoria_mei, dia_vencimento_das) values (auth.uid(), e, 'Serviços', 20)
  on conflict (empresa_id) do update set categoria_mei = 'Serviços', dia_vencimento_das = 20, data_abertura = null;

  -- T1: 12 períodos de 2026 (pelo vencimento), sem duplicar os 10 que já existiam
  perform mei_gerar_periodos_das(e, 2026);
  select count(*) into v_n from mei_obrigacoes where empresa_id = e and tipo = 'DAS' and extract(year from data_vencimento) = 2026;
  if v_n <> 12 then raise exception 'FALHOU T1: % períodos em 2026 (esperado 12)', v_n; end if;
  raise notice 'ok T1 — 12 períodos em 2026';

  -- T2: rodar de novo não duplica
  perform mei_gerar_periodos_das(e, 2026);
  perform mei_gerar_periodos_das(e, 2026);
  select count(*) into v_n from mei_obrigacoes where empresa_id = e and tipo = 'DAS' and extract(year from data_vencimento) = 2026;
  if v_n <> 12 then raise exception 'FALHOU T2: % períodos após reexecutar', v_n; end if;
  raise notice 'ok T2 — reexecução idempotente';

  -- T3: regra pela COMPETÊNCIA (dez/25 usa SM 2025; jan/26 usa SM 2026)
  select valor_esperado into v_val from mei_obrigacoes where empresa_id = e and tipo = 'DAS' and competencia = '2025-12';
  if v_val <> 80.90 then raise exception 'FALHOU T3: ref 12/2025 = % (esperado 80,90)', v_val; end if;
  select valor_esperado into v_val from mei_obrigacoes where empresa_id = e and tipo = 'DAS' and competencia = '2026-01';
  if v_val <> 86.05 then raise exception 'FALHOU T3: ref 01/2026 = % (esperado 86,05)', v_val; end if;
  raise notice 'ok T3 — valor pela regra da competência';

  -- T4: competência ≠ vencimento (ref 10/2026 vence 20/11/2026)
  select count(*) into v_n from mei_obrigacoes where empresa_id = e and competencia = '2026-10' and data_vencimento = '2026-11-20';
  if v_n <> 1 then raise exception 'FALHOU T4: competência/vencimento misturados'; end if;
  raise notice 'ok T4 — competência e vencimento separados';

  -- T5: 2027 tem 12 meses; sem regra oficial vira PROJEÇÃO (ref 12/2026 ainda é oficial)
  perform mei_gerar_periodos_das(e, 2027);
  select count(*) into v_n from mei_obrigacoes where empresa_id = e and tipo = 'DAS' and extract(year from data_vencimento) = 2027;
  if v_n <> 12 then raise exception 'FALHOU T5: % períodos em 2027', v_n; end if;
  select count(*) into v_n from mei_obrigacoes where empresa_id = e and extract(year from data_vencimento) = 2027 and natureza = 'projecao' and situacao = 'previsto';
  if v_n <> 11 then raise exception 'FALHOU T5: % projeções em 2027 (esperado 11)', v_n; end if;
  raise notice 'ok T5 — 2027 com 12 meses (11 projeções + ref 12/2026 oficial)';

  -- T6: baixa integral
  select id into v_id from mei_obrigacoes where empresa_id = e and competencia = '2026-10';
  v_r := mei_registrar_pagamento(e, 86.05, '2026-10-09', 'pix', 'manual', 'teste-chave-0001', jsonb_build_array(jsonb_build_object('obrigacao_id', v_id, 'valor', 86.05)));
  v_pag := (v_r->>'pagamento_id')::uuid;
  if mei_situacao_obrigacao(v_id) <> 'pago' then raise exception 'FALHOU T6: situação % após baixa integral', mei_situacao_obrigacao(v_id); end if;
  raise notice 'ok T6 — baixa integral = pago';

  -- T7: mesma chave (clique repetido) devolve o mesmo pagamento, não grava 2x
  v_r2 := mei_registrar_pagamento(e, 86.05, '2026-10-09', 'pix', 'manual', 'teste-chave-0001', jsonb_build_array(jsonb_build_object('obrigacao_id', v_id, 'valor', 86.05)));
  if (v_r2->>'ja_existia')::boolean is not true or (v_r2->>'pagamento_id')::uuid <> v_pag then raise exception 'FALHOU T7: clique repetido gerou outro pagamento'; end if;
  select count(*) into v_n from pagamento_alocacoes where obrigacao_id = v_id;
  if v_n <> 1 then raise exception 'FALHOU T7: % alocações (esperado 1)', v_n; end if;
  raise notice 'ok T7 — clique repetido não duplica';

  -- T8: pagamento parcial mantém saldo; o 2º completa
  select id into v_id2 from mei_obrigacoes where empresa_id = e and competencia = '2026-11';
  v_r := mei_registrar_pagamento(e, 40, '2026-10-09', 'boleto', 'manual', 'teste-chave-0002', jsonb_build_array(jsonb_build_object('obrigacao_id', v_id2, 'valor', 40)));
  if mei_situacao_obrigacao(v_id2) <> 'parcial' or (v_r->'alocacoes'->0->>'saldo')::numeric <> 46.05 then raise exception 'FALHOU T8: parcial errado %', v_r; end if;
  perform mei_registrar_pagamento(e, 46.05, '2026-10-09', 'boleto', 'manual', 'teste-chave-0003', jsonb_build_array(jsonb_build_object('obrigacao_id', v_id2, 'valor', 46.05)));
  if mei_situacao_obrigacao(v_id2) <> 'pago' then raise exception 'FALHOU T8: não quitou após completar'; end if;
  raise notice 'ok T8 — parcial e complemento';

  -- T9: pagar acima do devido sem dizer que é multa/juros é recusado
  select id into v_id2 from mei_obrigacoes where empresa_id = e and competencia = '2026-09';
  begin
    perform mei_registrar_pagamento(e, 100, '2026-10-09', 'pix', 'manual', 'teste-chave-0004', jsonb_build_array(jsonb_build_object('obrigacao_id', v_id2, 'valor', 100)));
    v_ok := false;
  exception when others then v_ok := sqlerrm like 'excede_saldo%';
  end;
  if not v_ok then raise exception 'FALHOU T9: excesso não foi recusado'; end if;
  -- …mas com multa/juros informados à parte, passa (legado "aguardando conciliação" vira pago)
  perform mei_registrar_pagamento(e, 91.05, '2026-10-09', 'pix', 'manual', 'teste-chave-0005', jsonb_build_array(jsonb_build_object('obrigacao_id', v_id2, 'valor', 86.05, 'encargos', 5)));
  if mei_situacao_obrigacao(v_id2) <> 'pago' then raise exception 'FALHOU T9: legado não conciliou'; end if;
  raise notice 'ok T9 — excesso recusado; encargos à parte aceitos';

  -- T10: projeção não pode ser paga; soma das alocações tem de bater
  select id into v_id2 from mei_obrigacoes where empresa_id = e and competencia = '2027-05';
  begin
    perform mei_registrar_pagamento(e, 86.05, '2026-10-09', 'pix', 'manual', 'teste-chave-0006', jsonb_build_array(jsonb_build_object('obrigacao_id', v_id2, 'valor', 86.05)));
    v_ok := false;
  exception when others then v_ok := sqlerrm like '%obrigacao_projecao%';
  end;
  if not v_ok then raise exception 'FALHOU T10: pagou uma projeção'; end if;
  select id into v_id2 from mei_obrigacoes where empresa_id = e and competencia = '2026-08';
  begin
    perform mei_registrar_pagamento(e, 50, '2026-10-09', 'pix', 'manual', 'teste-chave-0007', jsonb_build_array(jsonb_build_object('obrigacao_id', v_id2, 'valor', 40)));
    v_ok := false;
  exception when others then v_ok := sqlerrm like '%alocacao_nao_bate%';
  end;
  if not v_ok then raise exception 'FALHOU T10: alocação que não bate foi aceita'; end if;
  raise notice 'ok T10 — projeção e alocação inválida recusadas';

  -- T11: estorno cria linha nova, mantém o original e volta a situação
  v_r := mei_estornar_pagamento(e, v_pag, 'teste de estorno');
  if mei_situacao_obrigacao(v_id) <> 'pendente' then raise exception 'FALHOU T11: situação após estorno = %', mei_situacao_obrigacao(v_id); end if;
  select count(*) into v_n from pagamentos_obrigacao where id = v_pag and estornado_em is not null;
  if v_n <> 1 then raise exception 'FALHOU T11: original sumiu ou não foi marcado'; end if;
  begin
    perform mei_estornar_pagamento(e, v_pag, 'segundo estorno');
    v_ok := false;
  exception when others then v_ok := sqlerrm like '%ja_estornado%';
  end;
  if not v_ok then raise exception 'FALHOU T11: estornou 2 vezes'; end if;
  raise notice 'ok T11 — estorno com trilha, sem duplicar';

  -- T12: totais do ano = soma dos pagamentos válidos (estorno fora); projeção não entra em 2026
  select sum(valor_pago) into v_val from mei_resumo_obrigacoes(e, 2026);
  if v_val <> 40 + 46.05 + 86.05 then raise exception 'FALHOU T12: pago 2026 = % (esperado 172,10)', v_val; end if;
  select coalesce(sum(valor_esperado), 0) into v_val from mei_resumo_obrigacoes(e, 2026) where natureza = 'projecao';
  if v_val <> 0 then raise exception 'FALHOU T12: projeção somada em 2026'; end if;
  select coalesce(sum(saldo_vencido), 0) into v_val from mei_resumo_obrigacoes(e, 2027);
  if v_val <> 0 then raise exception 'FALHOU T12: projeção de 2027 contada como vencida'; end if;
  raise notice 'ok T12 — totais batem, previsto ≠ realizado';

  -- T13: isolamento entre empresas
  begin
    perform mei_gerar_periodos_das(outra, 2026);
    v_ok := false;
  exception when others then v_ok := sqlerrm like '%sem_permissao%';
  end;
  if not v_ok then raise exception 'FALHOU T13: mexeu na empresa de outro usuário'; end if;
  select count(*) into v_n from mei_resumo_obrigacoes(outra, 2026);
  if v_n <> 0 then raise exception 'FALHOU T13: leu resumo de outra empresa'; end if;
  raise notice 'ok T13 — uma empresa não acessa a outra';

  -- T14: pagamento não se cria/altera direto pelo navegador (sem política de escrita)
  update pagamentos_obrigacao set valor = 1 where id = v_pag;
  select valor into v_val from pagamentos_obrigacao where id = v_pag;
  if v_val <> 86.05 then raise exception 'FALHOU T14: pagamento alterado por fora do motor'; end if;
  begin
    insert into pagamentos_obrigacao (empresa_id, valor, data_pagamento, metodo, origem, chave_idempotencia) values (e, 1, '2026-10-09', 'pix', 'manual', 'teste-direto-0001');
    v_ok := false;
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'FALHOU T14: inseriu pagamento direto'; end if;
  raise notice 'ok T14 — escrita direta bloqueada';

  -- T15: conta a pagar de DAS não recebe baixa por fora do motor
  select id into v_id2 from mei_obrigacoes where empresa_id = e and competencia = '2026-07';
  insert into contas_pagar (user_id, empresa_id, descricao, categoria, valor_total, valor_pago, data_vencimento, status, mei_obrigacao_id)
  values (auth.uid(), e, 'DAS-MEI — teste', 'Impostos', 86.05, 0, '2026-08-20', 'vencido', v_id2) returning id into v_cp;
  begin
    update contas_pagar set valor_pago = 86.05, status = 'pago' where id = v_cp;
    v_ok := false;
  exception when others then v_ok := sqlerrm like '%conta_do_das%';
  end;
  if not v_ok then raise exception 'FALHOU T15: baixa por fora passou'; end if;
  -- …e pelo motor, a conta acompanha
  perform mei_registrar_pagamento(e, 86.05, '2026-10-09', 'pix', 'manual', 'teste-chave-0008', jsonb_build_array(jsonb_build_object('obrigacao_id', v_id2, 'valor', 86.05)));
  select valor_pago, status into v_val, v_sit from contas_pagar where id = v_cp;
  if v_val <> 86.05 or v_sit <> 'pago' then raise exception 'FALHOU T15: conta não acompanhou (% / %)', v_val, v_sit; end if;
  raise notice 'ok T15 — conta a pagar do DAS só muda pelo motor';

  -- T16: histórico de toda mudança na obrigação
  select count(*) into v_n from mei_obrigacoes_historico where obrigacao_id = v_id;
  if v_n < 2 then raise exception 'FALHOU T16: histórico com % registros', v_n; end if;
  raise notice 'ok T16 — histórico gravado';

  raise notice 'TODOS OS TESTES PASSARAM';
end $$;

rollback;   -- desfaz tudo: o banco fica exatamente como estava
