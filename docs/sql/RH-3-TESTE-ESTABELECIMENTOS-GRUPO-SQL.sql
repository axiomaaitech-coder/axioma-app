-- Teste da Subfase 3 do RH. Rodar DEPOIS de RH-3-ESTABELECIMENTOS-GRUPO-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH3 falhas=0".
-- CNPJs/CPF abaixo são números de exemplo com dígitos válidos (não são empresas reais do Axioma).
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';
  DONO uuid; OUTRO_CC uuid; G uuid;
  n int := 0; falhas text := ''; c int; ok boolean; i int;
  base text := $q$insert into rh_estabelecimentos (empresa_id,nome,tp_insc,nr_insc,ini_valid,cnae_prep$q$;
  ruins text[][] := array[
    ['cnpj_digito_errado', $q$,'X','1','11222333000180','2026-01','4711302')$q$],
    ['outra_raiz',         $q$,'X','1','11444777000161','2026-01','4711302')$q$],
    ['cno_tamanho',        $q$,'X','4','12345678901','2026-01','4711302')$q$],
    ['cnae_curto',         $q$,'X','1','11222333000262','2026-02','471130')$q$]
  ];
begin
  select user_id into DONO from empresas where id = ALVO;
  select id into OUTRO_CC from centros_custo where empresa_id <> ALVO limit 1;

  -- funções de dígito
  if not rh_cnpj_valido('11222333000181') or rh_cnpj_valido('11222333000180') or rh_cnpj_valido('11111111111111') then
    n := n + 1; falhas := falhas || ' funcao_cnpj'; end if;
  if not rh_cpf_valido('52998224725') or rh_cpf_valido('52998224724') or rh_cpf_valido('11111111111') then
    n := n + 1; falhas := falhas || ' funcao_cpf'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 1) estabelecimento sem empregador cadastrado: recusado
  ok := false;
  begin execute base || $q$) values ('a0000000-0000-4000-8000-00000000e001','Matriz',1,'11222333000181','2026-01','4711302')$q$;
  exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' estab_sem_empregador'; end if;

  -- 2) válidos: empregador (raiz) + matriz + filial
  begin
    insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr) values (ALVO,1,'11222333','2026-01','01',0,0);
    insert into rh_estabelecimentos (empresa_id,nome,tp_insc,nr_insc,ini_valid,cnae_prep) values (ALVO,'Matriz',1,'11222333000181','2026-01','4711302');
    insert into rh_estabelecimentos (empresa_id,nome,tp_insc,nr_insc,ini_valid,cnae_prep) values (ALVO,'Filial',1,'11222333000262','2026-01','4711302');
  exception when others then n := n + 1; falhas := falhas || ' valido_recusado:' || sqlerrm; end;

  -- 3) inválidos
  for i in 1 .. array_length(ruins, 1) loop
    ok := false;
    begin execute base || $q$) values ('a0000000-0000-4000-8000-00000000e001'$q$ || ruins[i][2];
    exception when check_violation or foreign_key_violation then ok := true; end;
    if not ok then n := n + 1; falhas := falhas || ' aceitou:' || ruins[i][1]; end if;
  end loop;
  ok := false;   -- PCD só na matriz
  begin insert into rh_estabelecimentos (empresa_id,nome,tp_insc,nr_insc,ini_valid,cnae_prep,pcd_nr_proc_jud)
        values (ALVO,'X',1,'11222333000262','2026-03','4711302','12345678901234567890');
  exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou:pcd_na_filial'; end if;
  ok := false;   -- entidade educativa da mesma raiz
  begin insert into rh_estabelecimentos (empresa_id,nome,tp_insc,nr_insc,ini_valid,cnae_prep,apr_entidades_educ)
        values (ALVO,'X',1,'11222333000181','2026-03','4711302',array['11222333000262']);
  exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou:entidade_mesma_raiz'; end if;
  ok := false;   -- CAEPF em estabelecimento CNPJ
  begin insert into rh_estabelecimentos (empresa_id,nome,tp_insc,nr_insc,ini_valid,cnae_prep,tp_caepf)
        values (ALVO,'X',1,'11222333000181','2026-04','4711302',1);
  exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou:caepf_em_cnpj'; end if;
  if OUTRO_CC is not null then   -- centro de custo de outra Empresa
    ok := false;
    begin insert into rh_estabelecimentos (empresa_id,nome,tp_insc,nr_insc,ini_valid,cnae_prep,centro_custo_id)
          values (ALVO,'X',1,'11222333000181','2026-05','4711302',OUTRO_CC);
    exception when check_violation or insufficient_privilege or foreign_key_violation then ok := true; end;
    if not ok then n := n + 1; falhas := falhas || ' aceitou:centro_de_outra_empresa'; end if;
  end if;
  ok := false;   -- empregador com CPF de dígito errado
  begin insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib) values (ALVO,2,'52998224724','2025-06','21');
  exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou:cpf_digito'; end if;

  -- 4) grupo: o dono cria e põe a Empresa dele
  begin
    insert into grupos_empresariais (nome) values ('Grupo Teste') returning id into G;
    insert into grupo_empresas (grupo_id, empresa_id) values (G, ALVO);
  exception when others then n := n + 1; falhas := falhas || ' grupo_dono:' || sqlerrm; end;

  -- 5) financeiro: lê os 2 estabelecimentos, não grava
  execute 'reset role';
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'financeiro');
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into c from rh_estabelecimentos where empresa_id = ALVO;
  if c <> 2 then n := n + 1; falhas := falhas || ' financeiro_le=' || c; end if;
  ok := false;
  begin insert into rh_estabelecimentos (empresa_id,nome,tp_insc,nr_insc,ini_valid,cnae_prep) values (ALVO,'X',1,'11222333000181','2026-06','4711302');
  exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' financeiro_gravou'; end if;
  -- financeiro não é dono: não põe a Empresa num grupo dele nem vê o grupo do dono
  ok := false;
  begin
    insert into grupos_empresariais (nome) values ('Grupo do invasor') returning id into G;
    insert into grupo_empresas (grupo_id, empresa_id) values (G, ALVO);
  exception when insufficient_privilege or unique_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' nao_dono_agrupou'; end if;
  if exists (select 1 from grupos_empresariais where nome = 'Grupo Teste') then n := n + 1; falhas := falhas || ' ve_grupo_alheio'; end if;

  -- 6) de fora: não vê nada
  execute 'reset role';
  delete from empresa_usuarios where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select (select count(*) from rh_estabelecimentos) + (select count(*) from grupo_empresas where empresa_id = ALVO) into c;
  if c <> 0 then n := n + 1; falhas := falhas || ' fora_le=' || c; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH3 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
