-- RH-20 · teste das regras de corrigir/lixeira (usa a Carla e a Ana de exemplo da Horizonte). NADA FICA GRAVADO: o bloco termina
-- com um erro de propósito que desfaz tudo. O resultado aparece na própria mensagem: "RESULTADO_RH20 falhas=0" = tudo certo.
do $$
declare
  KC constant uuid := '69755123-6efa-4b98-b763-616ee486b0ed';  -- contrato da Carla (enviado ao eSocial)
  CC constant uuid := '9e84c554-4057-4662-9921-c05682bdd42b';
  KA constant uuid := '4c94f740-491c-4358-9a32-f21fe4d3f260';  -- contrato da Ana (enviado)
  E uuid; L1 uuid; ok boolean; n int := 0; falhas text := ''; b boolean;
begin
  select empresa_id into E from rh_contratos where id = KC;
  update rh_contratos set alt_contratual_pendente = false where id = KC;
  -- 1) corrigir um salário (lápis) depois do envio marca S-2206
  insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (E, KC, '2026-12-01', 5, 3000, 'merito') returning id into L1;
  update rh_contratos set alt_contratual_pendente = false where id = KC;
  update rh_remuneracoes set valor = 3100 where id = L1;
  select alt_contratual_pendente into b from rh_contratos where id = KC; if not b then n := n + 1; falhas := falhas || ' correcao_nao_marcou_2206'; end if;
  -- 2) linha na lixeira libera a mesma data para um lançamento novo
  update rh_remuneracoes set excluido_em = now() where id = L1;
  ok := true; begin insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (E, KC, '2026-12-01', 5, 3050, 'merito'); exception when unique_violation then ok := false; end;
  if not ok then n := n + 1; falhas := falhas || ' lixeira_prende_data'; end if;
  -- 3) duas linhas ativas na mesma data continuam proibidas
  ok := false; begin insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (E, KC, '2026-12-01', 5, 3060, 'merito'); exception when unique_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' duplicou_data'; end if;
  -- 4) salário da admissão não muda de data
  ok := false; begin update rh_remuneracoes set vigencia_inicio = vigencia_inicio + 1 where contrato_id = KC and motivo = 'admissao'; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' admissao_mudou_data'; end if;
  -- 5) quem foi ao eSocial não vai para a lixeira…
  ok := false; begin update rh_colaboradores set excluido_em = now() where id = CC; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' lixeira_sem_cancelar'; end if;
  -- 6) …a não ser com a admissão cancelada (não chegou a trabalhar), sem marcar S-2206
  update rh_contratos set alt_contratual_pendente = false where id = KC;
  update rh_contratos set admissao_cancelada = true where id = KC;
  select alt_contratual_pendente into b from rh_contratos where id = KC; if b then n := n + 1; falhas := falhas || ' cancelar_marcou_2206'; end if;
  ok := true; begin update rh_colaboradores set excluido_em = now() where id = CC; exception when check_violation then ok := false; end;
  if not ok then n := n + 1; falhas := falhas || ' cancelada_nao_foi_lixeira'; end if;
  -- 7) com desligamento, a admissão não é cancelada (quem trabalhou é desligado)
  update rh_contratos set data_desligamento = '2026-11-01' where id = KA;
  ok := false; begin update rh_contratos set admissao_cancelada = true where id = KA; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' cancelou_desligado'; end if;
  raise exception 'RESULTADO_RH20 falhas=% %', n, falhas;
end $$;
