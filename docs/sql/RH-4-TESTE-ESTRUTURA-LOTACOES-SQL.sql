-- Teste da Subfase 4 do RH. Rodar DEPOIS de RH-4-ESTRUTURA-LOTACOES-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH4 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';
  DONO uuid; OUTRO_CC uuid; A uuid; B uuid; TP_PROIBIDO text;
  n int := 0; falhas text := ''; c int; ok boolean;
  procedure_falha text;
begin
  select user_id into DONO from empresas where id = ALVO;
  select id into OUTRO_CC from centros_custo where empresa_id <> ALVO limit 1;
  select tp_lotacao into TP_PROIBIDO from esocial_tab12_lotacao_class_trib where class_trib = '01' and not permitido limit 1;
  if (select count(distinct fpas) from esocial_tab04_fpas) <> 26 then n := n + 1; falhas := falhas || ' tab04'; end if;
  if (select count(*) from esocial_tab10_tipo_lotacao) <> 15 then n := n + 1; falhas := falhas || ' tab10'; end if;
  if (select count(*) from esocial_tab12_lotacao_class_trib) <> 270 then n := n + 1; falhas := falhas || ' tab12'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- empregador: Simples (01) a partir de 2026-01 e Lucro Presumido/Real (99) a partir de 2026-06
  insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,fim_valid,class_trib,ind_coop,ind_constr) values (ALVO,1,'11222333','2026-01','2026-05','01',0,0);
  insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr) values (ALVO,1,'11222333','2026-06','99',0,0);

  -- 1) lotações válidas
  begin
    insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,fpas,cod_tercs) values (ALVO,'Loja','L1','2026-01','01','515','0000');
    insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,fpas,cod_tercs) values (ALVO,'Loja','L1','2026-07','01','515','0115');
    insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,fpas,cod_tercs) values (ALVO,'Loja convênio','L2','2026-07','01','515','0051');
  exception when others then n := n + 1; falhas := falhas || ' lotacao_valida:' || sqlerrm; end;

  -- 2) lotações inválidas (todas devem ser recusadas)
  ok := false; begin insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,fpas,cod_tercs) values (ALVO,'x','X1','2026-02','01','515','0115');
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' simples_com_terceiros'; end if;
  ok := false; begin insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,fpas,cod_tercs) values (ALVO,'x','X2','2026-07','01','999','0000');
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' fpas_inexistente'; end if;
  ok := false; begin insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,fpas,cod_tercs) values (ALVO,'x','X3','2026-07','01','515','0079');
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' terceiros_fora_do_fpas'; end if;
  ok := false; begin insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,tp_insc,nr_insc,fpas,cod_tercs) values (ALVO,'x','X4','2026-07','01',1,'11222333000181','515','0115');
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' tipo01_com_inscricao'; end if;
  ok := false; begin insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,fpas,cod_tercs) values (ALVO,'x','X5','2026-07','04','515','0115');
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' tipo04_sem_cnpj'; end if;
  ok := false; begin insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,fpas,cod_tercs) values (ALVO,'x','X6','2025-01','01','515','0000');
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' sem_empregador_no_mes'; end if;
  if TP_PROIBIDO is not null then
    ok := false; begin insert into rh_lotacoes (empresa_id,nome,cod_lotacao,ini_valid,tp_lotacao,fpas,cod_tercs) values (ALVO,'x','X7','2026-01',TP_PROIBIDO,'515','0000');
    exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' tab12_proibido_' || TP_PROIBIDO; end if;
  end if;

  -- 3) departamentos: árvore sem ciclo, centro de custo só da mesma Empresa
  insert into rh_departamentos (empresa_id, nome) values (ALVO, 'Comercial') returning id into A;
  insert into rh_departamentos (empresa_id, nome, pai_id) values (ALVO, 'Vendas Loja', A) returning id into B;
  ok := false; begin update rh_departamentos set pai_id = B where id = A;
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' ciclo_aceito'; end if;
  if OUTRO_CC is not null then
    ok := false; begin insert into rh_departamentos (empresa_id, nome, centro_custo_id) values (ALVO, 'X', OUTRO_CC);
    exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' cc_outra_empresa'; end if;
  end if;

  -- 4) cargos: CBO 6 dígitos e competências bem formadas
  begin
    insert into rh_cargos (empresa_id, nome, cbo, departamento_id, competencias) values (ALVO, 'Vendedor', '521110', B,
      '[{"nome":"Atendimento ao cliente","tipo":"comportamental","obrigatoria":true,"nivel":4},{"nome":"Excel","tipo":"tecnica","obrigatoria":false}]');
  exception when others then n := n + 1; falhas := falhas || ' cargo_valido:' || sqlerrm; end;
  ok := false; begin insert into rh_cargos (empresa_id, nome, cbo) values (ALVO, 'X1', '52111');
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' cbo_curto'; end if;
  ok := false; begin insert into rh_cargos (empresa_id, nome, cbo, competencias) values (ALVO, 'X2', '521110', '[{"nome":"Excel","tipo":"outra","obrigatoria":true}]');
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' competencia_tipo'; end if;
  ok := false; begin insert into rh_cargos (empresa_id, nome, cbo, competencias) values (ALVO, 'X3', '521110', '[{"nome":"Excel","tipo":"tecnica","obrigatoria":true,"nivel":9}]');
  exception when check_violation then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' competencia_nivel'; end if;

  -- 5) financeiro lê, não grava
  execute 'reset role';
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'financeiro');
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select (select count(*) from rh_lotacoes where empresa_id = ALVO) + (select count(*) from rh_departamentos where empresa_id = ALVO)
       + (select count(*) from rh_cargos where empresa_id = ALVO) into c;
  if c <> 6 then n := n + 1; falhas := falhas || ' financeiro_le=' || c; end if;
  ok := false; begin insert into rh_cargos (empresa_id, nome, cbo) values (ALVO, 'Invasor', '521110');
  exception when insufficient_privilege then ok := true; end; if not ok then n := n + 1; falhas := falhas || ' financeiro_gravou'; end if;

  -- 6) de fora: nada
  execute 'reset role';
  delete from empresa_usuarios where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select (select count(*) from rh_lotacoes) + (select count(*) from rh_departamentos) + (select count(*) from rh_cargos) into c;
  if c <> 0 then n := n + 1; falhas := falhas || ' fora_le=' || c; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH4 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
