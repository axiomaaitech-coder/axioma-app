-- Teste das permissões v2 do RH. Rodar DEPOIS de RH-6-PERMISSOES-V2-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH6 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';   -- usuário que NÃO é membro da Empresa de teste
  DONO uuid;
  acoes text[] := array['ver','editar','pessoais','salario','saude','gerir'];
  esperado jsonb := '{
    "dono":       [true, true, true, true, true, true],
    "admin":      [true, true, true, true, true, true],
    "financeiro": [false,false,false,false,false,false],
    "contabil":   [false,false,false,false,false,false],
    "leitor":     [false,false,false,false,false,false],
    "operador":   [false,false,false,false,false,false],
    "fora":       [false,false,false,false,false,false]
  }';
  papel text; i int; got boolean; n int := 0; falhas text := ''; ok boolean;
begin
  select user_id into DONO from empresas where id = ALVO;
  if exists (select 1 from empresa_usuarios where empresa_id = ALVO and user_id = U) then
    raise exception 'o usuário de teste já é membro da Empresa de teste — escolha outro';
  end if;

  -- 1) matriz: só Proprietário/CEO/Sócio/Admin têm acesso; os demais, nada
  for papel in select jsonb_object_keys(esperado) loop
    execute 'reset role';
    delete from empresa_usuarios where empresa_id = ALVO and user_id = U;
    if papel <> 'fora' then insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, papel); end if;
    perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    for i in 1 .. array_length(acoes, 1) loop
      got := public.rh_pode(ALVO, acoes[i]);
      if got is distinct from (esperado->papel->>(i - 1))::boolean then n := n + 1; falhas := falhas || format(' %s/%s=%s', papel, acoes[i], got); end if;
    end loop;
  end loop;

  -- 2) o dono libera para um contador: só ver + salário. Dados pessoais e saúde continuam fechados.
  execute 'reset role';
  delete from empresa_usuarios where empresa_id = ALVO and user_id = U;
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'contabil');
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into rh_permissoes (empresa_id, user_id, ver, ver_salario) values (ALVO, U, true, true);
  if (select concedido_por from rh_permissoes where empresa_id = ALVO and user_id = U) is distinct from DONO then n := n + 1; falhas := falhas || ' sem_concedido_por'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  if not rh_pode(ALVO, 'ver') or not rh_pode(ALVO, 'salario') then n := n + 1; falhas := falhas || ' liberado_sem_acesso'; end if;
  if rh_pode(ALVO, 'pessoais') or rh_pode(ALVO, 'saude') or rh_pode(ALVO, 'editar') or rh_pode(ALVO, 'gerir') then n := n + 1; falhas := falhas || ' acesso_alem_do_liberado'; end if;

  -- 3) quem foi liberado não muda a própria liberação nem libera para outros
  ok := false;
  begin update rh_permissoes set ver_saude = true where empresa_id = ALVO and user_id = U;
        get diagnostics i = row_count; ok := (i = 0);
  exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' se_autoliberou'; end if;
  ok := false;
  begin insert into rh_permissoes (empresa_id, user_id, ver) values (ALVO, DONO, true);
  exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' nao_gestor_liberou'; end if;

  -- 4) admin libera para outra pessoa, mas não para si
  execute 'reset role';
  update empresa_usuarios set papel = 'admin' where empresa_id = ALVO and user_id = U;
  delete from rh_permissoes where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  ok := false;
  begin insert into rh_permissoes (empresa_id, user_id, ver) values (ALVO, U, true);
  exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' admin_liberou_para_si'; end if;

  -- 5) membro suspenso perde tudo
  execute 'reset role';
  update empresa_usuarios set suspenso_em = now() where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  if rh_pode(ALVO, 'ver') then n := n + 1; falhas := falhas || ' suspenso_ve'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH6 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
