-- ============================================================================
-- AXIOMA — MIGRAÇÃO MULTI-TENANT + RLS OTIMIZADA + ÍNDICES
-- Decidida com Elias em 2026-07-23. Rodar UMA VEZ no SQL Editor do Supabase.
--
-- ORDEM DE EXECUÇÃO (não misturar, é o motivo do arquivo ser uma única transação):
--   PARTE 1 — função de acesso (empresas_do_usuario) + seed de empresa_usuarios
--   PARTE 2 — adicionar empresa_id (IF NOT EXISTS) nas tabelas que ainda não têm
--   PARTE 3 — backfill + VERIFICAÇÃO (aborta tudo se sobrar NULL) + NOT NULL
--   PARTE 4 — reescrever as políticas RLS (multi-tenant + subselect otimizado)
--   PARTE 5 — índices compostos e de chave estrangeira
--   PARTE 6 — validação final (leitura, confirma o resultado pro relatório)
--
-- Todo o arquivo roda dentro de BEGIN/COMMIT: se a verificação da Parte 3 achar
-- QUALQUER linha sem empresa_id, a transação inteira é abortada (nada é
-- commitado, nem as colunas novas) — corrija os dados e rode de novo. O arquivo
-- é idempotente (IF NOT EXISTS / DROP IF EXISTS em tudo), pode rodar mais de
-- uma vez com segurança.
--
-- IMPORTANTE — risco operacional que fica registrado aqui: assim que este
-- arquivo for commitado, TODA gravação (insert/update) feita pelo código atual
-- do app vai parar de aparecer pra quem gravou (RLS passa a exigir empresa_id,
-- e o código hoje não grava essa coluna nas 24 tabelas novas nem em parte das
-- que já tinham a coluna). Isso é esperado — a Parte 6 (ajuste de código,
-- próxima etapa, fora deste arquivo) precisa ser feita logo em seguida. Como a
-- base é só de teste, a janela de "gravação não aparece" não afeta cliente
-- real, mas avise se quiser que eu comece o ajuste de código imediatamente
-- depois de você rodar isto.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1 — FUNÇÃO DE ACESSO (base de tudo)
-- ============================================================================
-- STABLE + SECURITY DEFINER + search_path fixo: além de deixar o Postgres
-- avaliar uma vez por consulta (STABLE), o SECURITY DEFINER é o que evita
-- recursão infinita — quando uma política em empresa_usuarios chamar esta
-- função, a consulta INTERNA que a função faz em "empresas"/"empresa_usuarios"
-- roda com o privilégio de quem criou a função (que ignora RLS), não do
-- usuário logado. Sem isso, a política de empresa_usuarios chamaria a função,
-- que consultaria empresa_usuarios de novo, que chamaria a política nela
-- mesma — loop infinito.
create or replace function public.empresas_do_usuario()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from empresas where user_id = (select auth.uid())
  union
  select empresa_id from empresa_usuarios where user_id = (select auth.uid())
$$;

revoke all on function public.empresas_do_usuario() from public;
grant execute on function public.empresas_do_usuario() to authenticated;

-- Garante 1 linha em empresa_usuarios pro DONO de cada empresa (papel 'dono').
-- Hoje a tabela existe mas nunca foi escrita pelo app — a posse do dono é
-- garantida pelo primeiro ramo do UNION acima (empresas.user_id), então isto
-- não é estritamente necessário pra função funcionar, mas deixa
-- empresa_usuarios como fonte única e completa de "quem tem acesso a quê"
-- desde já, pra qualquer tela futura que precise listar isso direto da tabela.
insert into empresa_usuarios (empresa_id, user_id, papel)
select e.id, e.user_id, 'dono'
from empresas e
where not exists (
  select 1 from empresa_usuarios eu where eu.empresa_id = e.id and eu.user_id = e.user_id
);

-- Evita duplicidade de vínculo (empresa, usuário) daqui pra frente.
create unique index if not exists idx_empresa_usuarios_unico on empresa_usuarios(empresa_id, user_id);
create index if not exists idx_empresa_usuarios_user on empresa_usuarios(user_id);
create index if not exists idx_empresa_usuarios_empresa on empresa_usuarios(empresa_id);

-- ============================================================================
-- PARTE 2 — ADICIONAR empresa_id nas 24 tabelas que só têm user_id
-- (nas tabelas que já têm a coluna, o IF NOT EXISTS é um no-op seguro)
-- ============================================================================
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
    'mei_dados','mei_declaracoes','mei_obrigacoes'
  ];
BEGIN
  FOREACH v_tabela IN ARRAY v_tabelas LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE', v_tabela);
  END LOOP;
END $$;

-- ============================================================================
-- PARTE 3 — BACKFILL + VERIFICAÇÃO + NOT NULL
-- ============================================================================

-- Mapa determinístico usuário → empresa: a empresa ATIVA mais ANTIGA do dono
-- (mesma regra que lib/empresaHelpers.ts já usa hoje pra "achar a empresa do
-- usuário"). Confirmado com Elias: nenhum usuário de teste tem mais de uma
-- empresa, então este mapa é 1:1 na prática atual.
DROP TABLE IF EXISTS pg_temp.mapa_empresa_por_usuario;
CREATE TEMP TABLE mapa_empresa_por_usuario AS
SELECT DISTINCT ON (user_id) user_id, id AS empresa_id
FROM empresas
WHERE ativo = true
ORDER BY user_id, created_at ASC;

-- Backfill: as 24 tabelas da Parte 2 + as 22 que já tinham empresa_id mas
-- podem ter linha antiga sem valor (achado real: os builders de Contas a
-- Pagar/Contas a Receber em lib/importarHelpers.ts gravam sem empresa_id
-- mesmo a coluna já existindo — por isso essas 22 entram no mesmo backfill,
-- não só as 24 novas).
DO $$
DECLARE
  v_tabela text;
  v_tabelas text[] := ARRAY[
    -- 24 novas (Parte 2)
    'dre_historico','ia_tributaria_historico','ia_financeira_historico',
    'fornecedor_contatos','fornecedor_documentos','fornecedor_contratos','fornecedor_produtos','fornecedor_interacoes',
    'cobranca_interacoes','cobranca_compromissos','cobranca_regua_etapas',
    'centro_custo_plano_acao','centro_custo_rateio','centro_custo_orcamento','centro_custo_auditoria',
    'centros_custo','lancamentos_centro',
    'concorrentes','decisoes_precificacao',
    'open_finance','of_transacoes',
    'mei_dados','mei_declaracoes','mei_obrigacoes',
    -- 22 que já tinham a coluna (defensivo — ver comentário acima)
    'receitas','custos_fixos','custos_variaveis','contas_pagar','contas_receber','fluxo_caixa',
    'clientes','fornecedores','metas','investimentos','precificacao','dividas',
    'importacoes','importacao_linhas','importacao_templates',
    'empresa_obrigacoes','empresa_socios','empresa_documentos','empresa_auditoria','empresa_equipe',
    'endividamento','inadimplencia'
  ];
BEGIN
  FOREACH v_tabela IN ARRAY v_tabelas LOOP
    EXECUTE format(
      'UPDATE public.%I t SET empresa_id = m.empresa_id FROM mapa_empresa_por_usuario m WHERE t.user_id = m.user_id AND t.empresa_id IS NULL',
      v_tabela
    );
  END LOOP;
END $$;

-- Relatório legível — rode e olhe esta tabela antes de confiar no resultado.
-- "assinaturas" está aqui só de forma informativa: ela nunca teve user_id
-- (nasceu correta, só com empresa_id), então não entra no backfill acima —
-- se aparecer > 0 nulos nela, é preciso resolver manualmente (não tenho de
-- onde derivar automaticamente) antes de rodar este arquivo de novo.
SELECT tabela, nulos FROM (
  SELECT 'dre_historico' AS tabela, count(*) FILTER (WHERE empresa_id IS NULL) AS nulos FROM dre_historico
  UNION ALL SELECT 'ia_tributaria_historico', count(*) FILTER (WHERE empresa_id IS NULL) FROM ia_tributaria_historico
  UNION ALL SELECT 'ia_financeira_historico', count(*) FILTER (WHERE empresa_id IS NULL) FROM ia_financeira_historico
  UNION ALL SELECT 'fornecedor_contatos', count(*) FILTER (WHERE empresa_id IS NULL) FROM fornecedor_contatos
  UNION ALL SELECT 'fornecedor_documentos', count(*) FILTER (WHERE empresa_id IS NULL) FROM fornecedor_documentos
  UNION ALL SELECT 'fornecedor_contratos', count(*) FILTER (WHERE empresa_id IS NULL) FROM fornecedor_contratos
  UNION ALL SELECT 'fornecedor_produtos', count(*) FILTER (WHERE empresa_id IS NULL) FROM fornecedor_produtos
  UNION ALL SELECT 'fornecedor_interacoes', count(*) FILTER (WHERE empresa_id IS NULL) FROM fornecedor_interacoes
  UNION ALL SELECT 'cobranca_interacoes', count(*) FILTER (WHERE empresa_id IS NULL) FROM cobranca_interacoes
  UNION ALL SELECT 'cobranca_compromissos', count(*) FILTER (WHERE empresa_id IS NULL) FROM cobranca_compromissos
  UNION ALL SELECT 'cobranca_regua_etapas', count(*) FILTER (WHERE empresa_id IS NULL) FROM cobranca_regua_etapas
  UNION ALL SELECT 'centro_custo_plano_acao', count(*) FILTER (WHERE empresa_id IS NULL) FROM centro_custo_plano_acao
  UNION ALL SELECT 'centro_custo_rateio', count(*) FILTER (WHERE empresa_id IS NULL) FROM centro_custo_rateio
  UNION ALL SELECT 'centro_custo_orcamento', count(*) FILTER (WHERE empresa_id IS NULL) FROM centro_custo_orcamento
  UNION ALL SELECT 'centro_custo_auditoria', count(*) FILTER (WHERE empresa_id IS NULL) FROM centro_custo_auditoria
  UNION ALL SELECT 'centros_custo', count(*) FILTER (WHERE empresa_id IS NULL) FROM centros_custo
  UNION ALL SELECT 'lancamentos_centro', count(*) FILTER (WHERE empresa_id IS NULL) FROM lancamentos_centro
  UNION ALL SELECT 'concorrentes', count(*) FILTER (WHERE empresa_id IS NULL) FROM concorrentes
  UNION ALL SELECT 'decisoes_precificacao', count(*) FILTER (WHERE empresa_id IS NULL) FROM decisoes_precificacao
  UNION ALL SELECT 'open_finance', count(*) FILTER (WHERE empresa_id IS NULL) FROM open_finance
  UNION ALL SELECT 'of_transacoes', count(*) FILTER (WHERE empresa_id IS NULL) FROM of_transacoes
  UNION ALL SELECT 'mei_dados', count(*) FILTER (WHERE empresa_id IS NULL) FROM mei_dados
  UNION ALL SELECT 'mei_declaracoes', count(*) FILTER (WHERE empresa_id IS NULL) FROM mei_declaracoes
  UNION ALL SELECT 'mei_obrigacoes', count(*) FILTER (WHERE empresa_id IS NULL) FROM mei_obrigacoes
  UNION ALL SELECT 'receitas', count(*) FILTER (WHERE empresa_id IS NULL) FROM receitas
  UNION ALL SELECT 'custos_fixos', count(*) FILTER (WHERE empresa_id IS NULL) FROM custos_fixos
  UNION ALL SELECT 'custos_variaveis', count(*) FILTER (WHERE empresa_id IS NULL) FROM custos_variaveis
  UNION ALL SELECT 'contas_pagar', count(*) FILTER (WHERE empresa_id IS NULL) FROM contas_pagar
  UNION ALL SELECT 'contas_receber', count(*) FILTER (WHERE empresa_id IS NULL) FROM contas_receber
  UNION ALL SELECT 'fluxo_caixa', count(*) FILTER (WHERE empresa_id IS NULL) FROM fluxo_caixa
  UNION ALL SELECT 'clientes', count(*) FILTER (WHERE empresa_id IS NULL) FROM clientes
  UNION ALL SELECT 'fornecedores', count(*) FILTER (WHERE empresa_id IS NULL) FROM fornecedores
  UNION ALL SELECT 'metas', count(*) FILTER (WHERE empresa_id IS NULL) FROM metas
  UNION ALL SELECT 'investimentos', count(*) FILTER (WHERE empresa_id IS NULL) FROM investimentos
  UNION ALL SELECT 'precificacao', count(*) FILTER (WHERE empresa_id IS NULL) FROM precificacao
  UNION ALL SELECT 'dividas', count(*) FILTER (WHERE empresa_id IS NULL) FROM dividas
  UNION ALL SELECT 'importacoes', count(*) FILTER (WHERE empresa_id IS NULL) FROM importacoes
  UNION ALL SELECT 'importacao_linhas', count(*) FILTER (WHERE empresa_id IS NULL) FROM importacao_linhas
  UNION ALL SELECT 'importacao_templates', count(*) FILTER (WHERE empresa_id IS NULL) FROM importacao_templates
  UNION ALL SELECT 'empresa_obrigacoes', count(*) FILTER (WHERE empresa_id IS NULL) FROM empresa_obrigacoes
  UNION ALL SELECT 'empresa_socios', count(*) FILTER (WHERE empresa_id IS NULL) FROM empresa_socios
  UNION ALL SELECT 'empresa_documentos', count(*) FILTER (WHERE empresa_id IS NULL) FROM empresa_documentos
  UNION ALL SELECT 'empresa_auditoria', count(*) FILTER (WHERE empresa_id IS NULL) FROM empresa_auditoria
  UNION ALL SELECT 'empresa_equipe', count(*) FILTER (WHERE empresa_id IS NULL) FROM empresa_equipe
  UNION ALL SELECT 'endividamento', count(*) FILTER (WHERE empresa_id IS NULL) FROM endividamento
  UNION ALL SELECT 'inadimplencia', count(*) FILTER (WHERE empresa_id IS NULL) FROM inadimplencia
  UNION ALL SELECT 'assinaturas', count(*) FILTER (WHERE empresa_id IS NULL) FROM assinaturas
) r
ORDER BY nulos DESC, tabela;

-- Portão de segurança: se QUALQUER uma das linhas acima tiver nulos > 0,
-- aborta a transação inteira ANTES de mexer em RLS ou aplicar NOT NULL.
-- As mensagens RAISE NOTICE abaixo aparecem no painel de mensagens do SQL
-- Editor mesmo que a transação seja abortada em seguida (NOTICE é enviado ao
-- cliente na hora, não é desfeito pelo rollback).
DO $$
DECLARE
  v_tabela text;
  v_nulos bigint;
  v_total bigint := 0;
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
    'empresa_obrigacoes','empresa_socios','empresa_documentos','empresa_auditoria','empresa_equipe',
    'endividamento','inadimplencia','assinaturas'
  ];
BEGIN
  FOREACH v_tabela IN ARRAY v_tabelas LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', v_tabela) INTO v_nulos;
    IF v_nulos > 0 THEN
      RAISE NOTICE 'PENDENTE: % tem % linha(s) sem empresa_id', v_tabela, v_nulos;
    END IF;
    v_total := v_total + v_nulos;
  END LOOP;

  IF v_total > 0 THEN
    RAISE EXCEPTION 'BACKFILL INCOMPLETO: % linha(s) no total ainda sem empresa_id (vide NOTICEs acima). RLS e NOT NULL NÃO foram aplicados — corrija os dados e rode o arquivo de novo.', v_total;
  ELSE
    RAISE NOTICE 'OK: zero linhas sem empresa_id em todas as tabelas verificadas.';
  END IF;
END $$;

-- Só chega aqui se o portão acima passou (zero nulos). Agora é seguro travar
-- a coluna como obrigatória em todas as 46 tabelas.
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
    'empresa_obrigacoes','empresa_socios','empresa_documentos','empresa_auditoria','empresa_equipe',
    'endividamento','inadimplencia'
  ];
BEGIN
  FOREACH v_tabela IN ARRAY v_tabelas LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN empresa_id SET NOT NULL', v_tabela);
  END LOOP;
END $$;

-- mei_dados: checagem específica pedida antes de criar o índice único —
-- confirma que o backfill não gerou 2 linhas pra mesma empresa (matematicamente
-- não deveria, já que era único por user_id e 1 usuário = 1 empresa hoje, mas
-- confirmando de verdade em vez de assumir).
DO $$
DECLARE v_dup bigint;
BEGIN
  SELECT count(*) INTO v_dup FROM (
    SELECT empresa_id FROM mei_dados GROUP BY empresa_id HAVING count(*) > 1
  ) d;
  IF v_dup > 0 THEN
    RAISE EXCEPTION 'mei_dados: % empresa(s) com mais de 1 linha — NÃO crio o índice único até isso ser resolvido manualmente.', v_dup;
  ELSE
    RAISE NOTICE 'OK: mei_dados sem duplicidade por empresa_id — pode aplicar o índice único.';
  END IF;
END $$;

-- ============================================================================
-- PARTE 4 — REESCREVER AS POLÍTICAS RLS
-- ============================================================================

-- Helper de sessão: apaga TODA política existente de uma tabela, pelo nome
-- real (consultado em pg_policies), não por um nome chutado. É o ponto mais
-- crítico do arquivo inteiro — políticas permissivas se somam com OU, então
-- uma política antiga esquecida (baseada só em user_id) continuaria valendo
-- em paralelo com a nova e anularia a migração inteira, sem erro nenhum.
CREATE OR REPLACE FUNCTION pg_temp.axioma_drop_todas_politicas(p_tabela text) RETURNS void AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = p_tabela LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, p_tabela);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4.1 — as 46 tabelas de negócio + assinaturas + empresa_usuarios (48 no
-- total): 1 política única FOR ALL por tabela, filtrando por empresa e usando
-- (select auth.uid()) em subselect (forma otimizada).
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
    'empresa_obrigacoes','empresa_socios','empresa_documentos','empresa_auditoria','empresa_equipe',
    'endividamento','inadimplencia',
    'assinaturas','empresa_usuarios'
  ];
BEGIN
  FOREACH v_tabela IN ARRAY v_tabelas LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_tabela);
    PERFORM pg_temp.axioma_drop_todas_politicas(v_tabela);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (empresa_id IN (SELECT public.empresas_do_usuario())) WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()))',
      v_tabela || '_multi_tenant', v_tabela
    );
  END LOOP;
END $$;

-- 4.2 — perfis e empresas: continuam com dono = usuário (decisão explícita do
-- Elias), só reescritas na forma otimizada com subselect.
DO $$
BEGIN
  PERFORM pg_temp.axioma_drop_todas_politicas('perfis');
  EXECUTE 'CREATE POLICY perfis_own ON public.perfis FOR ALL TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()))';

  PERFORM pg_temp.axioma_drop_todas_politicas('empresas');
  EXECUTE 'CREATE POLICY empresas_own ON public.empresas FOR ALL TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()))';
END $$;

-- 4.3 — tabelas de referência pública: leitura liberada pra quem está
-- logado, escrita bloqueada pra todo mundo (nenhuma política de
-- insert/update/delete é criada — com RLS ligada e zero política pra essas
-- operações, elas ficam automaticamente negadas).
DO $$
DECLARE
  v_tabela text;
  v_tabelas text[] := ARRAY['planos','benchmarks_setoriais','simples_nacional_faixas'];
BEGIN
  FOREACH v_tabela IN ARRAY v_tabelas LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_tabela);
    PERFORM pg_temp.axioma_drop_todas_politicas(v_tabela);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', v_tabela || '_leitura', v_tabela);
  END LOOP;
END $$;

-- ============================================================================
-- PARTE 5 — ÍNDICES COMPOSTOS E DE CHAVE ESTRANGEIRA
-- ============================================================================
DO $$
DECLARE
  idx record;
  v_nome text;
BEGIN
  FOR idx IN
    SELECT * FROM (VALUES
      -- === composto (empresa_id, data-relevante) ===
      ('dre_historico', ARRAY['empresa_id','periodo_fim']),
      ('ia_tributaria_historico', ARRAY['empresa_id','created_at']),
      ('ia_financeira_historico', ARRAY['empresa_id','created_at']),
      ('fornecedor_contatos', ARRAY['empresa_id','created_at']),
      ('fornecedor_documentos', ARRAY['empresa_id','data_validade']),
      ('fornecedor_contratos', ARRAY['empresa_id','data_fim']),
      ('fornecedor_produtos', ARRAY['empresa_id','created_at']),
      ('fornecedor_interacoes', ARRAY['empresa_id','data']),
      ('cobranca_interacoes', ARRAY['empresa_id','data']),
      ('cobranca_compromissos', ARRAY['empresa_id','data_compromissada']),
      ('cobranca_regua_etapas', ARRAY['empresa_id']),
      ('centro_custo_plano_acao', ARRAY['empresa_id','created_at']),
      ('centro_custo_rateio', ARRAY['empresa_id','created_at']),
      ('centro_custo_orcamento', ARRAY['empresa_id','periodo']),
      ('centro_custo_auditoria', ARRAY['empresa_id','created_at']),
      ('centros_custo', ARRAY['empresa_id','created_at']),
      ('lancamentos_centro', ARRAY['empresa_id','data']),
      ('concorrentes', ARRAY['empresa_id','created_at']),
      ('decisoes_precificacao', ARRAY['empresa_id','created_at']),
      ('open_finance', ARRAY['empresa_id']),
      ('of_transacoes', ARRAY['empresa_id','data']),
      ('mei_declaracoes', ARRAY['empresa_id','ano']),
      ('mei_obrigacoes', ARRAY['empresa_id','prazo']),
      ('mei_obrigacoes', ARRAY['empresa_id','ano_referencia','mes_referencia']),
      ('receitas', ARRAY['empresa_id','data']),
      ('custos_fixos', ARRAY['empresa_id','data_renovacao']),
      ('custos_variaveis', ARRAY['empresa_id','data']),
      ('contas_pagar', ARRAY['empresa_id','data_vencimento']),
      ('contas_receber', ARRAY['empresa_id','data_vencimento']),
      ('fluxo_caixa', ARRAY['empresa_id','data']),
      ('clientes', ARRAY['empresa_id','created_at']),
      ('fornecedores', ARRAY['empresa_id','created_at']),
      ('metas', ARRAY['empresa_id','data_inicio']),
      ('investimentos', ARRAY['empresa_id','data_vencimento']),
      ('precificacao', ARRAY['empresa_id','created_at']),
      ('dividas', ARRAY['empresa_id','created_at']),
      ('importacoes', ARRAY['empresa_id','created_at']),
      ('importacao_linhas', ARRAY['empresa_id','data_lancamento']),
      ('importacao_templates', ARRAY['empresa_id','created_at']),
      ('empresa_obrigacoes', ARRAY['empresa_id','data_vencimento']),
      ('empresa_socios', ARRAY['empresa_id','created_at']),
      ('empresa_documentos', ARRAY['empresa_id','data_validade']),
      ('empresa_auditoria', ARRAY['empresa_id','created_at']),
      ('empresa_equipe', ARRAY['empresa_id','created_at']),
      ('endividamento', ARRAY['empresa_id','created_at']),
      ('inadimplencia', ARRAY['empresa_id','created_at']),
      ('assinaturas', ARRAY['empresa_id']),
      -- === chaves estrangeiras usadas em join ===
      ('fornecedor_contatos', ARRAY['fornecedor_id']),
      ('fornecedor_documentos', ARRAY['fornecedor_id']),
      ('fornecedor_contratos', ARRAY['fornecedor_id']),
      ('fornecedor_produtos', ARRAY['fornecedor_id']),
      ('fornecedor_interacoes', ARRAY['fornecedor_id']),
      ('cobranca_interacoes', ARRAY['conta_id']),
      ('cobranca_interacoes', ARRAY['cliente_id']),
      ('cobranca_compromissos', ARRAY['conta_id']),
      ('cobranca_compromissos', ARRAY['cliente_id']),
      ('lancamentos_centro', ARRAY['centro_custo_id']),
      ('concorrentes', ARRAY['produto_id']),
      ('decisoes_precificacao', ARRAY['produto_id']),
      ('of_transacoes', ARRAY['item_id']),
      -- receitas/custos_fixos/custos_variaveis/contas_pagar.centro_custo_id já têm
      -- índice (CENTRO-CUSTO-FASE1-SQL.sql: idx_receitas_centro, idx_custos_fixos_centro,
      -- idx_custos_variaveis_centro, idx_contas_pagar_centro) — não duplicar aqui.
      ('receitas', ARRAY['cliente_id']),
      ('contas_pagar', ARRAY['fornecedor_id']),
      ('contas_receber', ARRAY['cliente_id']),
      ('contas_receber', ARRAY['centro_custo_id']),
      ('fornecedores', ARRAY['centro_custo_id']),
      ('importacao_linhas', ARRAY['importacao_id']),
      ('inadimplencia', ARRAY['cliente_id']),
      ('assinaturas', ARRAY['plano_id'])
    ) AS t(tabela, colunas)
  LOOP
    v_nome := 'idx_' || idx.tabela || '_' || array_to_string(idx.colunas, '_');
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%s)', v_nome, idx.tabela, array_to_string(idx.colunas, ', '));
  END LOOP;
END $$;

-- mei_dados: índice ÚNICO (1 linha por empresa), guardado pela checagem de
-- duplicidade da Parte 3. Depois de rodar este arquivo, o código precisa
-- trocar o upsert de onConflict:'user_id' para onConflict:'empresa_id' nos
-- 5 arquivos que usam mei_dados (Parte 6, próxima etapa, fora deste SQL).
CREATE UNIQUE INDEX IF NOT EXISTS idx_mei_dados_empresa_unico ON mei_dados(empresa_id);

COMMIT;

-- ============================================================================
-- PARTE 6 — VALIDAÇÃO FINAL (só leitura, roda junto — é o que vai pro relatório)
-- ============================================================================

-- a) confirma zero NULL em empresa_id nas tabelas migradas (redundante com o
--    portão da Parte 3, mas re-confirma pós-commit)
SELECT 'a) tabelas com empresa_id ainda NULL (deve vir vazio)' AS checagem;
SELECT tabela, nulos FROM (
  SELECT 'receitas' AS tabela, count(*) FILTER (WHERE empresa_id IS NULL) AS nulos FROM receitas
  UNION ALL SELECT 'contas_pagar', count(*) FILTER (WHERE empresa_id IS NULL) FROM contas_pagar
  UNION ALL SELECT 'contas_receber', count(*) FILTER (WHERE empresa_id IS NULL) FROM contas_receber
  UNION ALL SELECT 'mei_dados', count(*) FILTER (WHERE empresa_id IS NULL) FROM mei_dados
) r WHERE nulos > 0;

-- b) conta quantas políticas em public ainda usam a forma NÃO otimizada
--    (auth.uid() direto, sem o subselect) — deve dar ZERO.
SELECT 'b) políticas ainda na forma antiga (auth.uid() sem subselect) — deve ser 0' AS checagem;
SELECT count(*) AS politicas_nao_otimizadas
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual ILIKE '%auth.uid()%' AND qual NOT ILIKE '%select auth.uid()%')
    OR (with_check ILIKE '%auth.uid()%' AND with_check NOT ILIKE '%select auth.uid()%')
  );

-- c) total de políticas hoje em public, e quantas usam a forma otimizada —
--    pro número final do relatório.
SELECT 'c) total de políticas x otimizadas' AS checagem;
SELECT
  count(*) AS total_politicas,
  count(*) FILTER (WHERE qual ILIKE '%select auth.uid()%' OR with_check ILIKE '%select auth.uid()%' OR qual ILIKE '%empresas_do_usuario%') AS otimizadas
FROM pg_policies
WHERE schemaname = 'public';

-- d) empresa_usuarios foi semeada (1+ por empresa, papel 'dono')
SELECT 'd) linhas em empresa_usuarios (deve ser >= nº de empresas ativas)' AS checagem;
SELECT count(*) AS linhas_empresa_usuarios FROM empresa_usuarios;

-- e) teste do cenário hoje quebrado — cole o UUID de uma empresa de teste e de
--    um SEGUNDO usuário (outra conta sua de teste) pra provar que o convite
--    passa a funcionar de verdade. Substitua os dois <<...>> antes de rodar
--    esta parte isolada (não faz parte da transação acima).
-- insert into empresa_usuarios (empresa_id, user_id, papel)
-- values ('<<uuid-da-empresa>>', '<<uuid-do-segundo-usuario>>', 'funcionario');
-- -- depois logue com o segundo usuário no app e confirme que os módulos
-- -- mostram os mesmos dados da empresa (é o teste manual do item 8-d).
