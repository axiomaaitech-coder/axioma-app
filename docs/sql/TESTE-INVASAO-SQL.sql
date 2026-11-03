-- Teste de invasão automático (Camada 4 de segurança, 2026-11-03). Rodar no SQL Editor sempre que o banco mudar.
-- Finge ser o dono de OUTRA Empresa e, em TODA tabela/visão com empresa_id (e nas com só user_id), tenta:
--   ler linhas que não são das Empresas dele · alterar/apagar linhas da Empresa alvo · inserir em nome da Empresa alvo
--   (cópia de uma linha real dela). Termina com erro de propósito: o banco DESFAZ tudo e mostra o resultado.
-- Esperado: "RESULTADO_INVASAO falhas=0". Qualquer tabela em detalhes é porta aberta; em outros, a inserção foi recusada
-- por outro motivo (gatilho, dado repetido) antes da trava — conferir à mão.
-- Ajuste só as 2 linhas de baixo (Empresa alvo e um usuário que NÃO é membro dela).
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';   -- Empresa atacada (teste)
  INV  uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';   -- usuário de outra Empresa (invasor)
  t record; n int; linha jsonb; tem_id boolean; falhas text := ''; nfalhas int := 0; ntab int := 0; insert_ok int := 0; insert_sem_linha int := 0; outros text := '';
begin
  if exists (select 1 from empresa_usuarios where empresa_id = ALVO and user_id = INV) or exists (select 1 from empresas where id = ALVO and user_id = INV) then
    raise exception 'o invasor escolhido é membro da Empresa alvo — escolha outro usuário';
  end if;
  for t in
    select c.relname as tab, c.relkind,
      exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'empresa_id' and not a.attisdropped) as tem_empresa,
      exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'user_id' and not a.attisdropped) as tem_user
    from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'public' and c.relkind in ('r', 'v', 'm')
    order by 1
  loop
    if not t.tem_empresa and not t.tem_user then continue; end if;
    ntab := ntab + 1;
    linha := null;
    if t.relkind = 'r' and t.tem_empresa then
      execute format('select to_jsonb(x) from public.%I x where empresa_id = $1 limit 1', t.tab) into linha using ALVO;
    end if;
    tem_id := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t.tab and column_name = 'id' and data_type = 'uuid');

    perform set_config('request.jwt.claims', json_build_object('sub', INV, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    begin
      -- 1) leitura: nada que não seja das Empresas do invasor (ou, sem empresa_id, que não seja dele)
      if t.tem_empresa then
        execute format('select count(*) from public.%I where coalesce(empresa_id::text, ''sem'') not in (select e::text from public.empresas_do_usuario() e)', t.tab) into n;
      else
        execute format('select count(*) from public.%I where user_id is distinct from $1', t.tab) into n using INV;
      end if;
      if n > 0 then nfalhas := nfalhas + 1; falhas := falhas || ' ' || t.tab || ':le' || n; end if;
      -- 2) alterar e 3) apagar dados da Empresa alvo
      if t.relkind = 'r' and t.tem_empresa then
        execute format('update public.%I set empresa_id = empresa_id where empresa_id = $1', t.tab) using ALVO; get diagnostics n = row_count;
        if n > 0 then nfalhas := nfalhas + 1; falhas := falhas || ' ' || t.tab || ':altera' || n; end if;
        execute format('delete from public.%I where empresa_id = $1', t.tab) using ALVO; get diagnostics n = row_count;
        if n > 0 then nfalhas := nfalhas + 1; falhas := falhas || ' ' || t.tab || ':apaga' || n; end if;
      end if;
    exception when insufficient_privilege then null;  -- sem privilégio nenhum = bloqueado (certo)
    end;
    -- 4) inserir em nome da Empresa alvo (cópia de uma linha real dela, com id novo)
    if linha is not null then
      if tem_id then linha := jsonb_set(linha, '{id}', to_jsonb(gen_random_uuid())); end if;
      begin
        execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)', t.tab, t.tab) using linha;
        nfalhas := nfalhas + 1; falhas := falhas || ' ' || t.tab || ':insere';
      exception
        when insufficient_privilege then insert_ok := insert_ok + 1;          -- RLS recusou (certo)
        when others then outros := outros || ' ' || t.tab || ':' || sqlstate;   -- recusou por OUTRO motivo: conferir à mão
      end;
    elsif t.relkind = 'r' and t.tem_empresa then insert_sem_linha := insert_sem_linha + 1;
    end if;
    execute 'reset role';
  end loop;
  raise exception 'RESULTADO_INVASAO falhas=% tabelas=% insercoes_recusadas_pela_trava=% sem_linha_para_copiar=% detalhes=[%] outros=[%]', nfalhas, ntab, insert_ok, insert_sem_linha, falhas, outros;
end $$;
