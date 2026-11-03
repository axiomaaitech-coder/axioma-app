-- Segurança — Camada 1 (banco inteiro), 2026-11-03. Rodar bloco a bloco no SQL Editor; cada bloco tem o seu DESFAZER.
-- Base: auditoria de 2026-11-03 (RLS já ligado em toda tabela e toda função com empresa confere o membro).
-- Objetivo: fechar tudo para quem não fez login, tirar da mão do usuário o que só o banco deve chamar,
-- travar o endereço de busca das funções e garantir que LEITOR nunca grava em nada.

-- ═══ BLOCO A — quem não fez login (anon) não toca em nenhuma tabela; tabelas novas já nascem fechadas ═══
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
-- DESFAZER A: grant select, insert, update, delete on all tables in schema public to anon;
--             alter default privileges in schema public grant all on tables to anon;
-- ═══ FIM BLOCO A ═══

-- ═══ BLOCO B — funções com poder de dono (security definer): fora de quem não fez login ═══
-- Fica aberta só obter_convite_por_token (a página do convite abre antes do login).
-- Funções de gatilho saem também do usuário logado: só o banco chama (gatilho dispara sem precisar dessa permissão).
-- ATENÇÃO (lição de 2026-11-03): o laço só pode DAR permissão ao usuário logado para quem já tinha; as exclusivas do servidor ficam na lista abaixo.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as fn, p.proname, t.typname
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type t on t.oid = p.prorettype
           where n.nspname = 'public' and p.prosecdef loop
    if f.proname = 'obter_convite_por_token' then continue; end if;
    execute format('revoke execute on function %s from public, anon', f.fn);
    -- gatilhos e funções exclusivas do servidor (recarga de IA pelo pagamento, suspensão pela rotina da Equipe) nunca ficam com o usuário
    if f.typname = 'trigger' or f.proname in ('ia_creditar_recarga', 'equipe_suspender') then
      execute format('revoke execute on function %s from authenticated', f.fn);
    else
      execute format('grant execute on function %s to authenticated', f.fn);
    end if;
    execute format('grant execute on function %s to service_role', f.fn);
  end loop;
end $$;
alter default privileges in schema public revoke execute on functions from public, anon;
-- DESFAZER B: grant execute on all functions in schema public to anon, authenticated;
--             alter default privileges in schema public grant execute on functions to anon;
-- ═══ FIM BLOCO B ═══

-- ═══ BLOCO B2 — os 3 recálculos (estoque, lote, venda) passam a conferir a Empresa de quem chama ═══
-- Os gatilhos de venda e estoque chamam estas funções em nome do usuário, então elas continuam abertas ao
-- usuário logado, mas só agem em registro de uma Empresa dele (o banco/serviço, sem usuário, segue livre).
-- O cálculo em si não muda: só a linha de conferência no começo.
do $$
declare f text; d text;
begin
  foreach f in array array['fn_estoque_recalcular_produto(uuid)|produtos|p_produto_id', 'fn_lote_recalcular(uuid)|estoque_lotes|p_lote_id', 'fn_venda_recalcular_total(uuid)|venda|p_venda_id'] loop
    d := pg_get_functiondef(('public.' || split_part(f, '|', 1))::regprocedure);
    if position('AX_CONFERE_EMPRESA' in d) > 0 then continue; end if;
    d := regexp_replace(d, '\mBEGIN\M', 'BEGIN' || chr(10) || '  -- AX_CONFERE_EMPRESA' || chr(10) || '  IF auth.uid() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ' || split_part(f, '|', 2)
      || ' WHERE id = ' || split_part(f, '|', 3) || ' AND empresa_id IN (SELECT public.empresas_do_usuario())) THEN RETURN; END IF;', 'i');
    if position('AX_CONFERE_EMPRESA' in d) = 0 then raise exception 'não achei o BEGIN de %', f; end if;
    execute d;
  end loop;
end $$;
-- DESFAZER B2: para cada uma das 3: execute regexp_replace(pg_get_functiondef('public.<função>(uuid)'::regprocedure), E'\n  -- AX_CONFERE_EMPRESA\n[^\n]*', '');
-- ═══ FIM BLOCO B2 ═══

-- ═══ BLOCO C — endereço de busca fixo nas funções que ainda não tinham ═══
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as fn from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind = 'f'
             and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
             and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') loop
    execute format('alter function %s set search_path = public', f.fn);
  end loop;
end $$;
-- DESFAZER C: alter function <nome>(<args>) reset search_path;  (uma por função, se alguma reclamar)
-- ═══ FIM BLOCO C ═══

-- ═══ BLOCO D — LEITOR nunca grava, altera ou apaga em nenhuma tabela de Empresa ═══
-- Regra RESTRITIVA: soma-se às regras de cada tabela (não substitui nenhuma). Quem não é membro continua
-- barrado pelas regras de Empresa de sempre; esta só acrescenta "se for leitor, não".
create or replace function public.nao_e_leitor(p_empresa uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.meu_papel(p_empresa), '') <> 'leitor' $$;
revoke execute on function public.nao_e_leitor(uuid) from public, anon;
grant execute on function public.nao_e_leitor(uuid) to authenticated, service_role;
do $$
declare t record;
begin
  for t in select c.table_name from information_schema.columns c join pg_class k on k.relname = c.table_name
           join pg_namespace n on n.oid = k.relnamespace and n.nspname = 'public'
           where c.table_schema = 'public' and c.column_name = 'empresa_id' and k.relkind = 'r'
             -- consulta do próprio leitor (conversas com a IA, simulações, relatórios que ele gera, foto diária da previsão)
             and c.table_name not in ('chat_ia', 'ia_conversa', 'ia_conversa_mensagem', 'ia_financeira_historico', 'ia_tributaria_historico',
                                      'ia_consumo', 'simulacoes', 'nexus_simulation', 'relatorios', 'vencido_previsao') loop
    execute format('drop policy if exists leitor_nao_insere on public.%I', t.table_name);
    execute format('drop policy if exists leitor_nao_altera on public.%I', t.table_name);
    execute format('drop policy if exists leitor_nao_apaga on public.%I', t.table_name);
    execute format('create policy leitor_nao_insere on public.%I as restrictive for insert to authenticated with check (public.nao_e_leitor(empresa_id))', t.table_name);
    execute format('create policy leitor_nao_altera on public.%I as restrictive for update to authenticated using (public.nao_e_leitor(empresa_id)) with check (public.nao_e_leitor(empresa_id))', t.table_name);
    execute format('create policy leitor_nao_apaga on public.%I as restrictive for delete to authenticated using (public.nao_e_leitor(empresa_id))', t.table_name);
  end loop;
end $$;
-- DESFAZER D: rodar o mesmo laço só com os 3 "drop policy if exists" (tira as regras novas).
-- ═══ FIM BLOCO D ═══

-- ═══ BLOCO E — conferência (só leitura) ═══
select
  (select count(*) from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public') as anon_privilegios_tabela,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'EXECUTE')) as funcoes_dono_abertas_sem_login,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%') and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')) as funcoes_sem_endereco_fixo,
  (select count(distinct tablename) from pg_policies where schemaname = 'public' and policyname = 'leitor_nao_insere') as tabelas_com_trava_leitor;
-- ═══ FIM BLOCO E ═══
