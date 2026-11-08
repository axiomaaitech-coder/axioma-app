-- Teste do histórico do RH. Rodar DEPOIS de RH-11-HISTORICO-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH11 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';
  DONO uuid; C1 uuid; K1 uuid; c int; n int := 0; falhas text := ''; ok boolean; r record;
begin
  select user_id into DONO from empresas where id = ALVO;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into rh_colaboradores (empresa_id, nome) values (ALVO, 'Maria Exemplo') returning id into C1;
  insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, qtd_hrs_sem, tp_jornada)
    values (ALVO, C1, 'T-001', '101', '2026-11-03', 1, 44, 4) returning id into K1;
  insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento) values (C1, ALVO, '52998224725', '1990-01-01');
  insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (ALVO, K1, '2026-11-03', 5, 3000, 'admissao');
  insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, situacao) values (ALVO, C1, 'exame', 'aso_admissional', 'pendente');
  update rh_contratos set qtd_hrs_sem = 40 where id = K1;
  update rh_colaborador_pessoal set telefone = '11999990000' where colaborador_id = C1;
  update rh_colaboradores set nome = 'Maria Exemplo' where id = C1;            -- nada mudou: não grava
  update rh_colaboradores set excluido_em = now() where id = C1;
  update rh_colaboradores set excluido_em = null where id = C1;

  select count(*) into c from rh_historico where colaborador_id = C1; if c <> 9 then n := n + 1; falhas := falhas || ' total=' || c; end if;
  select * into r from rh_historico where colaborador_id = C1 and parte = 'contrato' and acao = 'alterou';
  if r.campos <> array['qtd_hrs_sem'] or (r.depois->>'qtd_hrs_sem')::numeric <> 40 or r.por <> DONO then n := n + 1; falhas := falhas || ' contrato_diff'; end if;
  select * into r from rh_historico where colaborador_id = C1 and parte = 'pessoal' and acao = 'alterou';
  if r.campos <> array['telefone'] or r.antes is not null or r.depois is not null then n := n + 1; falhas := falhas || ' pessoal_vazou_valor'; end if;
  if exists (select 1 from rh_historico where colaborador_id = C1 and parte = 'salario' and (antes is not null or depois is not null)) then n := n + 1; falhas := falhas || ' salario_vazou_valor'; end if;
  if not exists (select 1 from rh_historico where colaborador_id = C1 and acao = 'lixeira') or not exists (select 1 from rh_historico where colaborador_id = C1 and acao = 'recuperou') then n := n + 1; falhas := falhas || ' lixeira_sem_registro'; end if;
  -- ninguém altera nem apaga histórico (nem o dono)
  update rh_historico set campos = '{}' where colaborador_id = C1; get diagnostics c = row_count; if c <> 0 then n := n + 1; falhas := falhas || ' dono_alterou'; end if;
  delete from rh_historico where colaborador_id = C1; get diagnostics c = row_count; if c <> 0 then n := n + 1; falhas := falhas || ' dono_apagou'; end if;
  ok := false; begin insert into rh_historico (empresa_id, colaborador_id, parte, acao) values (ALVO, C1, 'cadastro', 'criou'); exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' inseriu_a_mao'; end if;

  -- só "ver": vê cadastro e contrato; não vê pessoal, salário nem exame
  execute 'reset role';
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'contabil');
  insert into rh_permissoes (empresa_id, user_id, ver) values (ALVO, U, true);
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into c from rh_historico where colaborador_id = C1 and parte in ('pessoal','salario','exame'); if c <> 0 then n := n + 1; falhas := falhas || ' ver_viu_sensivel=' || c; end if;
  select count(*) into c from rh_historico where colaborador_id = C1 and parte in ('cadastro','contrato'); if c < 5 then n := n + 1; falhas := falhas || ' ver_nao_viu=' || c; end if;
  -- sem nenhuma liberação: nada
  execute 'reset role';
  delete from rh_permissoes where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into c from rh_historico where colaborador_id = C1; if c <> 0 then n := n + 1; falhas := falhas || ' sem_acesso_viu'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH11 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
