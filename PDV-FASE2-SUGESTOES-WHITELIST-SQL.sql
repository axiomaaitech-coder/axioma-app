-- ============================================================================
-- AXIOMA — PDV Fase 2: estende a whitelist de autocomplete por histórico
-- Pré-requisito já rodado antes: ESTOQUE-FASE3-SUGESTOES-SQL.sql (cria
-- estoque_sugestoes_coluna).
--
-- O QUE FAZ: adiciona 'nome', 'marca', 'categoria' à whitelist de colunas que
-- podem ser consultadas por estoque_sugestoes_coluna() — hoje só aceita
-- rua/prateleira/nivel/posicao/conta_contabil (autocomplete de localização do
-- Estoque). O PDV precisa de autocomplete em nome/marca/categoria pro
-- cadastro rápido/bipagem em massa.
--
-- SEGURO: só ADICIONA 3 valores no IN(...) existente. Nenhum comportamento
-- muda pras 5 colunas atuais — mesma função, mesma query dinâmica via
-- format(%I) já usada e já auditada (protegida contra SQL dinâmico porque só
-- roda depois do IF de whitelist). CREATE OR REPLACE, idempotente.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.estoque_sugestoes_coluna(p_empresa_id uuid, p_coluna text)
RETURNS TABLE(valor text, usos bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_empresa_id NOT IN (SELECT public.empresas_do_usuario()) THEN
    RAISE EXCEPTION 'sem permissão para consultar esta empresa';
  END IF;
  IF p_coluna NOT IN ('rua', 'prateleira', 'nivel', 'posicao', 'conta_contabil', 'nome', 'marca', 'categoria') THEN
    RAISE EXCEPTION 'coluna não permitida para sugestão: %', p_coluna;
  END IF;

  RETURN QUERY EXECUTE format(
    'SELECT %I AS valor, count(*) AS usos
     FROM public.produtos
     WHERE empresa_id = $1 AND %I IS NOT NULL AND btrim(%I) <> %L
     GROUP BY %I
     ORDER BY count(*) DESC, max(updated_at) DESC
     LIMIT 20',
    p_coluna, p_coluna, p_coluna, '', p_coluna
  ) USING p_empresa_id;
END;
$$;

REVOKE ALL ON FUNCTION public.estoque_sugestoes_coluna(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.estoque_sugestoes_coluna(uuid, text) TO authenticated;

COMMIT;
