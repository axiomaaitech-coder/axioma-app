-- ============================================================================
-- AXIOMA — P4: as 8 tabelas que ficaram de fora da MIGRACAO-MULTITENANT.sql
-- (alertas, categorias, chat_ia, dre_mensal, relatorios, riscos,
-- score_historico, simulacoes) passam para a MESMA regra das outras 48:
-- 1 política única por empresa, na forma otimizada (subselect).
-- Conferido em 2026-10-02: as 8 já têm empresa_id; nenhuma é usada pelo app hoje.
-- Apaga as políticas antigas pelo nome real (pg_policies) — política esquecida
-- somaria com OU e anularia a nova. Idempotente.
-- ============================================================================

DO $$
DECLARE
  v_tabela text;
  r record;
BEGIN
  FOREACH v_tabela IN ARRAY ARRAY['alertas','categorias','chat_ia','dre_mensal','relatorios','riscos','score_historico','simulacoes'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_tabela);
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = v_tabela LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, v_tabela);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (empresa_id IN (SELECT public.empresas_do_usuario())) WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()))',
      v_tabela || '_multi_tenant', v_tabela);
  END LOOP;
END $$;

-- Conferência (só leitura): deve voltar 8 linhas, 1 política por tabela
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('alertas','categorias','chat_ia','dre_mensal','relatorios','riscos','score_historico','simulacoes')
ORDER BY tablename;
