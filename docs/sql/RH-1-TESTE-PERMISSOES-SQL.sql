-- Teste da Subfase 1 do RH (permissões). Rodar DEPOIS de RH-1-FUNDACAO-PERMISSOES-SQL.sql.
-- Põe um usuário de teste em cada papel na Empresa de teste, confere rh_pode() contra a tabela esperada
-- e tenta as autoconcessões proibidas. Termina com erro DE PROPÓSITO: o banco desfaz tudo.
-- Esperado: "RESULTADO_RH_PERMISSOES falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';   -- Empresa de teste
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';   -- usuário que NÃO é membro dela
  DONO uuid;
  esperado jsonb := '{
    "dono":       {"ver":true, "editar":true, "salario":true, "saude":true},
    "admin":      {"ver":true, "editar":true, "salario":true, "saude":false},
    "financeiro": {"ver":true, "editar":false,"salario":true, "saude":false},
    "contabil":   {"ver":true, "editar":false,"salario":true, "saude":false},
    "leitor":     {"ver":false,"editar":false,"salario":false,"saude":false},
    "operador":   {"ver":false,"editar":false,"salario":false,"saude":false},
    "fora":       {"ver":false,"editar":false,"salario":false,"saude":false}
  }';
  papel text; acao text; got boolean; falhas text := ''; n int := 0; ok boolean;
begin
  select user_id into DONO from empresas where id = ALVO;
  if exists (select 1 from empresa_usuarios where empresa_id = ALVO and user_id = U) then
    raise exception 'o usuário de teste já é membro da Empresa de teste — escolha outro';
  end if;

  -- 1) matriz de papéis
  for papel in select jsonb_object_keys(esperado) loop
    execute 'reset role';
    delete from empresa_usuarios where empresa_id = ALVO and user_id = U;
    if papel <> 'fora' then
      insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, papel);
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    for acao in select unnest(array['ver','editar','salario','saude']) loop
      got := public.rh_pode(ALVO, acao);
      if got is distinct from (esperado->papel->>acao)::boolean then
        n := n + 1; falhas := falhas || format(' %s/%s=%s', papel, acao, got);
      end if;
    end loop;
  end loop;

  -- 2) permissão extra: leitor com saúde liberada pelo dono passa a ver saúde (e só saúde)
  execute 'reset role';
  delete from empresa_usuarios where empresa_id = ALVO and user_id = U;
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'leitor');
  insert into rh_permissoes (empresa_id, user_id, ver_saude, concedido_por) values (ALVO, U, true, DONO);
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if not public.rh_pode(ALVO, 'saude') then n := n + 1; falhas := falhas || ' extra/saude=false'; end if;
  if public.rh_pode(ALVO, 'salario') then n := n + 1; falhas := falhas || ' extra/salario=true'; end if;

  -- 3) admin não pode se autoconceder nada nem liberar saúde para outro
  execute 'reset role';
  delete from rh_permissoes where empresa_id = ALVO and user_id = U;
  update empresa_usuarios set papel = 'admin' where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  ok := false;
  begin insert into rh_permissoes (empresa_id, user_id, ver_saude) values (ALVO, U, true);
  exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' admin_se_concede_saude'; end if;
  ok := false;
  begin insert into rh_permissoes (empresa_id, user_id, ver_saude) values (ALVO, DONO, true);
  exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' admin_libera_saude_outro'; end if;
  -- admin pode dar "ver" para outra pessoa (permitido)
  begin insert into rh_permissoes (empresa_id, user_id, ver) values (ALVO, DONO, true);
  exception when others then n := n + 1; falhas := falhas || ' admin_nao_consegue_dar_ver:' || sqlstate; end;

  -- 4) quem é de fora não lê permissões da Empresa
  execute 'reset role';
  delete from empresa_usuarios where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if exists (select 1 from rh_permissoes where empresa_id = ALVO) then n := n + 1; falhas := falhas || ' fora_le_permissoes'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH_PERMISSOES falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
