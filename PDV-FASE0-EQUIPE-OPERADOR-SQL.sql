-- ============================================================================
-- AXIOMA — PDV Fase 0: Convite / Multi-usuário (dono + operador)
-- Pré-requisitos já rodados antes: MIGRACAO-MULTITENANT.sql, SQL-EMPRESA-PADRAO.sql,
-- CONVITE-EQUIPE-SQL.sql.
--
-- REVISÃO 2 — a v1 bloqueava o operador numa LISTA FIXA de 46 tabelas
-- digitadas à mão. Uma lista fixa esquece tabela (esqueceu Estoque inteiro,
-- documentos_fiscais, mei_precos_salvos e outras) e vai esquecer de novo toda
-- vez que uma tabela nova for criada. Trocado por DESCOBERTA DINÂMICA: o
-- próprio Postgres decide, na hora de rodar, quais tabelas bloquear —
-- qualquer tabela nova com empresa_id fica protegida automaticamente, sem
-- precisar lembrar de atualizar este arquivo.
--
-- O QUE FAZ:
--   0) PASSO 0 (no topo, fora do BEGIN/COMMIT) — consulta só de LEITURA que
--      mostra exatamente quais tabelas vão ser afetadas, calculado do banco
--      real. Rode isso sozinho primeiro e confira a lista antes de continuar.
--   1) Novo papel 'operador' (balconista) + CHECK constraint em empresa_usuarios
--      e empresa_equipe pra nunca aceitar um valor de papel digitado errado.
--   2) meu_papel(empresa_id) — RPC POR EMPRESA (nunca global): devolve o papel
--      do usuário logado NAQUELA empresa específica. A mesma pessoa pode ser
--      dono da própria empresa e operador na empresa de outra ao mesmo tempo —
--      por isso a função sempre recebe empresa_id e nunca responde "de forma
--      geral" sobre o usuário.
--   3) empresas_do_usuario_operacional() — igual a empresas_do_usuario(), só
--      que exclui, POR VÍNCULO (empresa_id + user_id), as linhas onde o papel
--      NAQUELE vínculo é 'operador'. Se a pessoa é operador na empresa A e
--      dono na empresa B, ela continua enxergando tudo da empresa B — só a
--      empresa A some da lista.
--   4) DESCOBERTA DINÂMICA: acha TODA tabela em public com coluna empresa_id,
--      exceto a lista de exceções abaixo. Habilita RLS onde não tiver e troca
--      a política de empresas_do_usuario() para empresas_do_usuario_operacional()
--      — bloqueio TOTAL do operador nelas (negar por padrão).
--
--      LISTA DE EXCEÇÕES (permanente — NUNCA remover uma tabela desta lista
--      sem decisão explícita nova, mesmo que pareça "sobrar"):
--        - empresa_usuarios, empresa_equipe: política própria no item 5.
--        - empresas: o operador precisa ler a própria empresa — nome, CNPJ
--          etc., dado cadastral, não financeiro.
--        - caixa, turno_caixa, venda, item_venda (PDV Fase 3, Etapa 1 —
--          PDV-FASE3-ETAPA1-VENDAS-SQL.sql): é o TRABALHO do operador abrir o
--          próprio caixa e registrar as próprias vendas — bloqueá-lo aqui
--          quebraria o PDV pra quem mais usa. Fixado nesta lista de propósito:
--          se este arquivo rodar de novo no futuro, ele NUNCA pode sobrescrever
--          a política destas 4 tabelas — a Etapa 1 também reforça a política
--          correta nelas de forma incondicional (não só "se não existir"),
--          então mesmo que uma dessas 4 tabelas saia desta lista por engano
--          algum dia, rodar a Etapa 1 de novo depois conserta. As duas pontas
--          seguram uma a outra, mas esta lista é a principal — mantenha-a.
--   5) empresa_usuarios e empresa_equipe ficam com política PRÓPRIA (fora da
--      descoberta dinâmica): qualquer pessoa continua enxergando SÓ a própria
--      linha em empresa_usuarios (senão obterEmpresaAtiva() quebra pra todo
--      mundo que não é dono); ver/gerenciar as linhas de OUTRAS pessoas
--      (equipe inteira) fica só para quem é 'dono' NAQUELA empresa.
--   6) listar_equipe(empresa_id) — RPC que devolve a lista unificada (ativos +
--      convites pendentes) só pra quem é dono. Sem essa trava DENTRO da função,
--      o SECURITY DEFINER dela ignoraria a RLS e vazaria a equipe inteira pra
--      qualquer usuário logado — a checagem é o que impede isso.
--   7) expira_em em empresa_equipe (7 dias) + aceitar_convite() passa a
--      recusar convite expirado.
--   8) Gatilho protege_ultimo_dono(): impede excluir ou rebaixar o único
--      papel 'dono' de uma empresa (senão a empresa fica órfã).
--   9) Todos os erros novos usam um código próprio (AX0xx) em vez de só texto
--      em português — é o que permite a tela traduzir a mensagem certa em
--      PT/EN/ES sem depender do texto que o Postgres devolve (que é sempre em
--      português, não daria pra traduzir olhando só a mensagem).
--
-- SOBRE RECURSÃO EM empresa_usuarios (conferido explicitamente, não é
-- suposição): a política empresa_usuarios_select chama meu_papel(empresa_id),
-- que por sua vez consulta a própria empresa_usuarios por dentro. Isso NÃO
-- causa loop porque meu_papel() é SECURITY DEFINER — a consulta INTERNA dela
-- roda com o privilégio de quem CRIOU a função (o dono da função, que também
-- é o dono da tabela nesse projeto), e o dono de uma tabela ignora a RLS dela
-- por padrão, a menos que FORCE ROW LEVEL SECURITY esteja ligado. Conferido:
-- nenhum FORCE ROW LEVEL SECURITY existe em nenhum SQL deste projeto (busca
-- feita no repositório inteiro antes de escrever este arquivo). É exatamente
-- o mesmo mecanismo que empresas_do_usuario() já usa em produção há semanas
-- pra consultar empresa_usuarios de dentro de uma política EM empresa_usuarios
-- — não é padrão novo, é o padrão já testado do projeto, só reaplicado.
--
-- Idempotente — pode rodar mais de uma vez com segurança.
-- ============================================================================


-- ============================================================================
-- PASSO 0 — RODE SOZINHO PRIMEIRO, ANTES DE QUALQUER OUTRA COISA DESTE ARQUIVO.
-- Só leitura, não muda nada no banco. Mostra a lista real de tabelas que serão
-- bloqueadas pro operador (calculada do seu banco, não digitada à mão).
-- Confira a lista — se faltar ou sobrar alguma tabela que você não esperava,
-- PARE aqui e me avise antes de continuar pro bloco principal.
-- ============================================================================
SELECT c.table_name AS tabela_que_sera_bloqueada_pro_operador
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE c.table_schema = 'public'
  AND c.column_name = 'empresa_id'
  AND t.table_type = 'BASE TABLE'
  AND c.table_name NOT IN ('empresa_usuarios', 'empresa_equipe', 'empresas',
                            'caixa', 'turno_caixa', 'venda', 'item_venda')
ORDER BY c.table_name;


BEGIN;

-- ============================================================================
-- 1) PAPEL 'operador' + CHECK constraint
-- ============================================================================
ALTER TABLE public.empresa_usuarios DROP CONSTRAINT IF EXISTS empresa_usuarios_papel_check;
ALTER TABLE public.empresa_usuarios ADD CONSTRAINT empresa_usuarios_papel_check
  CHECK (papel IN ('dono','admin','financeiro','contabil','leitor','operador'));

ALTER TABLE public.empresa_equipe DROP CONSTRAINT IF EXISTS empresa_equipe_papel_check;
ALTER TABLE public.empresa_equipe ADD CONSTRAINT empresa_equipe_papel_check
  CHECK (papel IN ('admin','financeiro','contabil','leitor','operador'));

-- ============================================================================
-- 2) meu_papel(empresa_id) — SEMPRE por empresa, nunca global
-- ============================================================================
create or replace function public.meu_papel(p_empresa_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select papel from empresa_usuarios where empresa_id = p_empresa_id and user_id = (select auth.uid()) limit 1),
    (select 'dono' from empresas where id = p_empresa_id and user_id = (select auth.uid()) limit 1)
  )
$$;

revoke all on function public.meu_papel(uuid) from public;
grant execute on function public.meu_papel(uuid) to authenticated;

-- ============================================================================
-- 3) empresas_do_usuario_operacional() — exclui só o VÍNCULO 'operador',
--    nunca o usuário inteiro
-- ============================================================================
create or replace function public.empresas_do_usuario_operacional()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from empresas where user_id = (select auth.uid())
  union
  select empresa_id from empresa_usuarios where user_id = (select auth.uid()) and papel <> 'operador'
$$;

revoke all on function public.empresas_do_usuario_operacional() from public;
grant execute on function public.empresas_do_usuario_operacional() to authenticated;

-- ============================================================================
-- 4) DESCOBERTA DINÂMICA — bloqueio total do operador em TODA tabela com
--    empresa_id, exceto as 3 exceções (política própria / tratamento à parte)
-- ============================================================================
CREATE OR REPLACE FUNCTION pg_temp.axioma_drop_todas_politicas(p_tabela text) RETURNS void AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = p_tabela LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, p_tabela);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  v_tabela text;
BEGIN
  FOR v_tabela IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'empresa_id'
      AND t.table_type = 'BASE TABLE'
      AND c.table_name NOT IN ('empresa_usuarios', 'empresa_equipe', 'empresas',
                                'caixa', 'turno_caixa', 'venda', 'item_venda')
    ORDER BY c.table_name
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_tabela);
    PERFORM pg_temp.axioma_drop_todas_politicas(v_tabela);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (empresa_id IN (SELECT public.empresas_do_usuario_operacional())) WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario_operacional()))',
      v_tabela || '_multi_tenant', v_tabela
    );
  END LOOP;
END $$;

-- ============================================================================
-- 5) empresa_usuarios e empresa_equipe — política PRÓPRIA (fora da descoberta
--    dinâmica acima)
-- ============================================================================

-- empresa_usuarios: a PRÓPRIA linha sempre visível pra qualquer papel (é o
-- que obterEmpresaAtiva() usa pra descobrir a empresa de quem foi convidado —
-- restringir isso a só dono quebraria login de admin/financeiro/contabil/
-- leitor/operador). Ver/gerenciar linhas de OUTRAS pessoas fica só pra dono.
-- (Sobre a chamada a meu_papel() aqui não causar recursão: ver nota extensa
-- no cabeçalho do arquivo — mesmo mecanismo que empresas_do_usuario() já usa
-- em produção pra essa mesma tabela.)
SELECT pg_temp.axioma_drop_todas_politicas('empresa_usuarios');
ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;

create policy empresa_usuarios_select on public.empresa_usuarios
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.meu_papel(empresa_id) = 'dono'
  );

create policy empresa_usuarios_insert on public.empresa_usuarios
  for insert to authenticated
  with check (public.meu_papel(empresa_id) = 'dono');

create policy empresa_usuarios_update on public.empresa_usuarios
  for update to authenticated
  using (public.meu_papel(empresa_id) = 'dono')
  with check (public.meu_papel(empresa_id) = 'dono');

create policy empresa_usuarios_delete on public.empresa_usuarios
  for delete to authenticated
  using (public.meu_papel(empresa_id) = 'dono');

-- empresa_equipe: convites (quem convidou, e-mail, papel oferecido) só o dono
-- vê e gerencia. As RPCs obter_convite_por_token/aceitar_convite continuam
-- funcionando pra QUALQUER pessoa porque são SECURITY DEFINER (ignoram esta
-- política de propósito).
SELECT pg_temp.axioma_drop_todas_politicas('empresa_equipe');
ALTER TABLE public.empresa_equipe ENABLE ROW LEVEL SECURITY;

create policy empresa_equipe_dono on public.empresa_equipe
  for all to authenticated
  using (public.meu_papel(empresa_id) = 'dono')
  with check (public.meu_papel(empresa_id) = 'dono');

-- ============================================================================
-- 6) listar_equipe(empresa_id) — lista unificada (ativos + convites), só dono
-- ============================================================================
create or replace function public.listar_equipe(p_empresa_id uuid)
returns table (
  id uuid,
  origem text,
  user_id uuid,
  email text,
  nome text,
  cargo text,
  papel text,
  token_convite text,
  expira_em timestamptz,
  criado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.meu_papel(p_empresa_id) <> 'dono' then
    raise exception 'Apenas o proprietário pode ver a equipe.' using errcode = 'AX006';
  end if;

  return query
    select eu.id, 'ativo'::text, eu.user_id, u.email::text,
           coalesce(eq.nome, '')::text, coalesce(eq.cargo, '')::text, eu.papel,
           null::text, null::timestamptz, eu.created_at
    from empresa_usuarios eu
    join auth.users u on u.id = eu.user_id
    left join empresa_equipe eq on eq.user_id_convidado = eu.user_id and eq.empresa_id = eu.empresa_id
    where eu.empresa_id = p_empresa_id
    union all
    select eq2.id, 'convite'::text, null::uuid, eq2.email_convidado,
           coalesce(eq2.nome, '')::text, coalesce(eq2.cargo, '')::text, eq2.papel,
           eq2.token_convite, eq2.expira_em, eq2.created_at
    from empresa_equipe eq2
    where eq2.empresa_id = p_empresa_id and not coalesce(eq2.convite_aceito, false)
    order by criado_em desc;
end;
$$;

revoke all on function public.listar_equipe(uuid) from public;
grant execute on function public.listar_equipe(uuid) to authenticated;

-- ============================================================================
-- 7) expira_em (7 dias) + aceitar_convite() recusa convite expirado
-- ============================================================================
ALTER TABLE public.empresa_equipe
  ADD COLUMN IF NOT EXISTS expira_em timestamptz NOT NULL DEFAULT (now() + interval '7 days');

create or replace function public.aceitar_convite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_convite record;
begin
  if v_user_id is null then
    raise exception 'Você precisa estar logado para aceitar um convite' using errcode = 'AX007';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  select * into v_convite
  from empresa_equipe
  where token_convite = p_token
  limit 1;

  if v_convite is null then
    raise exception 'Convite não encontrado' using errcode = 'AX002';
  end if;

  if coalesce(v_convite.convite_aceito, false) then
    raise exception 'Este convite já foi utilizado' using errcode = 'AX003';
  end if;

  if v_convite.expira_em < now() then
    raise exception 'Este convite expirou' using errcode = 'AX004';
  end if;

  if lower(v_convite.email_convidado) <> lower(v_user_email) then
    raise exception 'Este convite foi enviado para outro e-mail (%). Entre com a conta correta.', v_convite.email_convidado using errcode = 'AX005';
  end if;

  insert into empresa_usuarios (empresa_id, user_id, papel)
  values (v_convite.empresa_id, v_user_id, coalesce(v_convite.papel, 'leitor'))
  on conflict (empresa_id, user_id) do nothing;

  update empresa_equipe
  set convite_aceito = true, aceito_em = now(), user_id_convidado = v_user_id
  where id = v_convite.id;

  return v_convite.empresa_id;
end;
$$;

revoke all on function public.aceitar_convite(text) from public;
grant execute on function public.aceitar_convite(text) to authenticated;

-- ============================================================================
-- 8) Gatilho: nunca remover/rebaixar o único 'dono' de uma empresa
-- ============================================================================
create or replace function public.protege_ultimo_dono()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_restantes int;
begin
  v_empresa_id := coalesce(old.empresa_id, new.empresa_id);

  if (tg_op = 'DELETE' and old.papel = 'dono')
     or (tg_op = 'UPDATE' and old.papel = 'dono' and new.papel <> 'dono') then
    select count(*) into v_restantes
    from empresa_usuarios
    where empresa_id = v_empresa_id and papel = 'dono' and id <> old.id;

    if v_restantes = 0 then
      raise exception 'Não é possível remover ou rebaixar o único proprietário da empresa' using errcode = 'AX001';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists trg_protege_ultimo_dono on public.empresa_usuarios;
create trigger trg_protege_ultimo_dono
  before update or delete on public.empresa_usuarios
  for each row execute function public.protege_ultimo_dono();

-- ============================================================================
-- 9) Verificação (só leitura) — confirma que as funções foram criadas e
--    mostra em quais tabelas a política de bloqueio do operador ficou ativa
--    (deve bater com a lista do PASSO 0, no topo do arquivo).
-- ============================================================================
SELECT proname FROM pg_proc WHERE proname IN
  ('meu_papel','empresas_do_usuario_operacional','listar_equipe','aceitar_convite','protege_ultimo_dono');

SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public' AND policyname LIKE '%\_multi_tenant' ESCAPE '\'
ORDER BY tablename;

COMMIT;

-- ============================================================================
-- NOTA PARA A PRÓXIMA FASE (ATUALIZADA — produtos e vendas já resolvidos):
-- - produtos: resolvido em PDV-FASE3-ETAPA0-OPERADOR-PRODUTOS-SQL.sql (view
--   vw_produtos_seguro, sem custo/margem/impostos).
-- - caixa/turno_caixa/venda/item_venda: resolvido em PDV-FASE3-ETAPA1-VENDAS-
--   SQL.sql, já refletido na lista de exceções do item 4 acima.
-- Qualquer tabela NOVA além destas continua a regra original: nunca herdar
-- automaticamente de empresas_do_usuario_operacional() sem decisão explícita
-- — se a descoberta dinâmica do item 4 não for o que se quer pra uma tabela
-- nova, ela entra na lista de exceções do item 4/5 antes de rodar este
-- arquivo de novo. Não decidir isso sozinho quando chegar a hora.
-- ============================================================================


-- ============================================================================
-- ROLLBACK — SÓ RODAR SE ALGO QUEBRAR DEPOIS DE APLICAR O BLOCO ACIMA.
-- Usa a MESMA descoberta dinâmica, então cobre exatamente as mesmas tabelas
-- que o bloco principal alterou (incluindo empresa_usuarios e empresa_equipe,
-- que ANTES desta migração tinham a mesma política uniforme de todas as
-- outras — conferido em MIGRACAO-MULTITENANT.sql, que aplicava
-- "empresa_id IN (SELECT empresas_do_usuario())" nelas junto com as demais
-- 46 tabelas — por isso o rollback devolve as DUAS pra esse mesmo estado, não
-- só as 46). "empresas" fica de fora do rollback também, porque nunca foi
-- tocada por este arquivo (mantém sua política própria o tempo todo).
-- Não apaga as funções novas (meu_papel, listar_equipe etc.) por segurança —
-- elas ficam inertes se nada mais as chamar. Descomente e rode como um bloco
-- único.
-- ============================================================================

-- BEGIN;
--
-- CREATE OR REPLACE FUNCTION pg_temp.axioma_drop_todas_politicas(p_tabela text) RETURNS void AS $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = p_tabela LOOP
--     EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, p_tabela);
--   END LOOP;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- DO $$
-- DECLARE
--   v_tabela text;
-- BEGIN
--   FOR v_tabela IN
--     SELECT c.table_name
--     FROM information_schema.columns c
--     JOIN information_schema.tables t
--       ON t.table_schema = c.table_schema AND t.table_name = c.table_name
--     WHERE c.table_schema = 'public'
--       AND c.column_name = 'empresa_id'
--       AND t.table_type = 'BASE TABLE'
--       AND c.table_name <> 'empresas'
--     ORDER BY c.table_name
--   LOOP
--     PERFORM pg_temp.axioma_drop_todas_politicas(v_tabela);
--     EXECUTE format(
--       'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (empresa_id IN (SELECT public.empresas_do_usuario())) WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()))',
--       v_tabela || '_multi_tenant', v_tabela
--     );
--   END LOOP;
-- END $$;
--
-- drop trigger if exists trg_protege_ultimo_dono on public.empresa_usuarios;
--
-- COMMIT;
-- ============================================================================
