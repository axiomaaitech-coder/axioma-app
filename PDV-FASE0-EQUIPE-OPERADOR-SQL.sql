-- ============================================================================
-- AXIOMA — PDV Fase 0: Convite / Multi-usuário (dono + operador)
-- Pré-requisitos já rodados antes: MIGRACAO-MULTITENANT.sql, SQL-EMPRESA-PADRAO.sql,
-- CONVITE-EQUIPE-SQL.sql.
--
-- O QUE FAZ:
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
--   4) Troca a política das 46 tabelas de negócio (lista completa abaixo, pra
--      conferência) de empresas_do_usuario() para empresas_do_usuario_operacional()
--      — bloqueio TOTAL do operador nessas tabelas (negar por padrão).
--   5) empresa_usuarios e empresa_equipe ficam com política PRÓPRIA (não estão
--      nas 46 acima): qualquer pessoa continua enxergando SÓ a própria linha em
--      empresa_usuarios (senão obterEmpresaAtiva() quebra pra todo mundo que não
--      é dono — isso foi conferido linha a linha no código antes de escrever
--      esta política); ver/gerenciar as linhas de OUTRAS pessoas (equipe
--      inteira) fica só para quem é 'dono' NAQUELA empresa.
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
-- TABELAS AFETADAS PELA TROCA DE POLÍTICA (item 4 acima) — 46 no total,
-- confira antes de rodar:
--   dre_historico, ia_tributaria_historico, ia_financeira_historico,
--   fornecedor_contatos, fornecedor_documentos, fornecedor_contratos,
--   fornecedor_produtos, fornecedor_interacoes,
--   cobranca_interacoes, cobranca_compromissos, cobranca_regua_etapas,
--   centro_custo_plano_acao, centro_custo_rateio, centro_custo_orcamento,
--   centro_custo_auditoria, centros_custo, lancamentos_centro,
--   concorrentes, decisoes_precificacao,
--   open_finance, of_transacoes,
--   mei_dados, mei_declaracoes, mei_obrigacoes,
--   receitas, custos_fixos, custos_variaveis, contas_pagar, contas_receber, fluxo_caixa,
--   clientes, fornecedores, metas, investimentos, precificacao, dividas,
--   importacoes, importacao_linhas, importacao_templates,
--   empresa_obrigacoes, empresa_socios, empresa_documentos, empresa_auditoria,
--   endividamento, inadimplencia,
--   assinaturas
-- (empresa_usuarios e empresa_equipe NÃO estão nesta lista — recebem política
-- própria no item 5, diferente das outras 46.)
--
-- Idempotente — pode rodar mais de uma vez com segurança.
-- ============================================================================

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
-- 4) TROCA DE POLÍTICA nas 46 tabelas de negócio (bloqueio total do operador)
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
  v_tabelas text[] := ARRAY[
    'dre_historico','ia_tributaria_historico','ia_financeira_historico',
    'fornecedor_contatos','fornecedor_documentos','fornecedor_contratos','fornecedor_produtos','fornecedor_interacoes',
    'cobranca_interacoes','cobranca_compromissos','cobranca_regua_etapas',
    'centro_custo_plano_acao','centro_custo_rateio','centro_custo_orcamento','centro_custo_auditoria',
    'centros_custo','lancamentos_centro',
    'concorrentes','decisoes_precificacao',
    'open_finance','of_transacoes',
    'mei_dados','mei_declaracoes','mei_obrigacoes',
    'receitas','custos_fixos','custos_variaveis','contas_pagar','contas_receber','fluxo_caixa',
    'clientes','fornecedores','metas','investimentos','precificacao','dividas',
    'importacoes','importacao_linhas','importacao_templates',
    'empresa_obrigacoes','empresa_socios','empresa_documentos','empresa_auditoria',
    'endividamento','inadimplencia',
    'assinaturas'
  ];
BEGIN
  FOREACH v_tabela IN ARRAY v_tabelas LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_tabela);
    PERFORM pg_temp.axioma_drop_todas_politicas(v_tabela);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (empresa_id IN (SELECT public.empresas_do_usuario_operacional())) WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario_operacional()))',
      v_tabela || '_multi_tenant', v_tabela
    );
  END LOOP;
END $$;

-- ============================================================================
-- 5) empresa_usuarios e empresa_equipe — política PRÓPRIA (fora das 46 acima)
-- ============================================================================

-- empresa_usuarios: a PRÓPRIA linha sempre visível pra qualquer papel (é o
-- que obterEmpresaAtiva() usa pra descobrir a empresa de quem foi convidado —
-- restringir isso a só dono quebraria login de admin/financeiro/contabil/
-- leitor/operador). Ver/gerenciar linhas de OUTRAS pessoas fica só pra dono.
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
-- 9) Verificação (só leitura)
-- ============================================================================
SELECT proname FROM pg_proc WHERE proname IN
  ('meu_papel','empresas_do_usuario_operacional','listar_equipe','aceitar_convite','protege_ultimo_dono');

COMMIT;

-- ============================================================================
-- NOTA PARA A PRÓXIMA FASE (NÃO IMPLEMENTADO AGORA):
-- Quando o PDV ganhar tabelas próprias (produtos, vendas, caixa...), cada
-- tabela nova recebe SUA PRÓPRIA política — nunca herdar automaticamente de
-- empresas_do_usuario_operacional() sem decisão explícita nova. Em especial:
-- o operador vai precisar LER produtos pra vender (preço de venda = ok expor),
-- mas custo, CMV e margem são dados sensíveis do dono — decidir explicitamente
-- (provavelmente coluna separada ou view sem esses campos) antes de liberar
-- leitura de produtos pro operador. Não decidir isso sozinho quando chegar a
-- hora.
-- ============================================================================


-- ============================================================================
-- ROLLBACK — SÓ RODAR SE ALGO QUEBRAR DEPOIS DE APLICAR O BLOCO ACIMA.
-- Devolve as 46 tabelas + empresa_usuarios + empresa_equipe para a política
-- antiga (empresas_do_usuario(), sem distinção de papel — como estava antes
-- desta migração). Não apaga as funções novas (meu_papel, listar_equipe etc.)
-- por segurança — elas ficam inertes se nada mais as chamar. Descomente e
-- rode como um bloco único.
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
--   v_tabelas text[] := ARRAY[
--     'dre_historico','ia_tributaria_historico','ia_financeira_historico',
--     'fornecedor_contatos','fornecedor_documentos','fornecedor_contratos','fornecedor_produtos','fornecedor_interacoes',
--     'cobranca_interacoes','cobranca_compromissos','cobranca_regua_etapas',
--     'centro_custo_plano_acao','centro_custo_rateio','centro_custo_orcamento','centro_custo_auditoria',
--     'centros_custo','lancamentos_centro',
--     'concorrentes','decisoes_precificacao',
--     'open_finance','of_transacoes',
--     'mei_dados','mei_declaracoes','mei_obrigacoes',
--     'receitas','custos_fixos','custos_variaveis','contas_pagar','contas_receber','fluxo_caixa',
--     'clientes','fornecedores','metas','investimentos','precificacao','dividas',
--     'importacoes','importacao_linhas','importacao_templates',
--     'empresa_obrigacoes','empresa_socios','empresa_documentos','empresa_auditoria','empresa_equipe',
--     'endividamento','inadimplencia',
--     'assinaturas','empresa_usuarios'
--   ];
-- BEGIN
--   FOREACH v_tabela IN ARRAY v_tabelas LOOP
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
