-- ============================================================================
-- AXIOMA — Estoque: reorganização por Segmento/Categoria + exclusão segura de
-- campo personalizado. Rodar UMA VEZ no SQL Editor do Supabase, depois dos
-- SQLs anteriores de Estoque. Transação única (BEGIN/COMMIT), idempotente
-- (CREATE OR REPLACE em tudo) — pode rodar de novo sem quebrar nada.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Contagem de produtos por segmento (chips dinâmicos da tela Produtos).
--    Nunca soma no navegador — a tela só lê o total já pronto daqui.
--    Produto sem segmento próprio herda o segmento padrão da empresa (mesma
--    regra que a tela já usa pra decidir quais campos de nicho mostrar); só
--    cai em "generico" se nem a empresa tiver padrão definido.
--    security_invoker = true: RLS de quem consulta continua valendo.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_estoque_por_segmento
WITH (security_invoker = true) AS
SELECT
  p.empresa_id,
  COALESCE(NULLIF(p.segmento, ''), NULLIF(e.segmento_padrao, ''), 'generico') AS segmento,
  COUNT(*) FILTER (WHERE p.status = 'ativo') AS qtd_ativo,
  COUNT(*) FILTER (WHERE p.status = 'inativo') AS qtd_inativo,
  COUNT(*) AS qtd_total
FROM public.produtos p
JOIN public.empresas e ON e.id = p.empresa_id
GROUP BY p.empresa_id, COALESCE(NULLIF(p.segmento, ''), NULLIF(e.segmento_padrao, ''), 'generico');

-- ----------------------------------------------------------------------------
-- 2) Exclusão de campo personalizado — remove a DEFINIÇÃO em empresas.
--    campos_personalizados_estoque E o VALOR (a chave) de dentro do JSONB
--    atributos_nicho de TODOS os produtos da empresa, numa única instrução por
--    tabela (sem loop linha a linha no app — Regra 6 de escala).
--
--    Segurança multi-tenant: SECURITY DEFINER pra poder tocar produtos de
--    outros usuários da MESMA empresa, mas com checagem explícita logo no
--    início — só executa se p_empresa_id estiver entre as empresas do usuário
--    que chamou (public.empresas_do_usuario(), a mesma função usada nas
--    políticas de RLS do projeto). Sem essa checagem, alguém autenticado
--    poderia passar o empresa_id de outra empresa e mexer no dado dela.
--
--    Idempotente: se a chave já não existir em campos_personalizados_estoque
--    ou em algum atributos_nicho, o filtro/jsonb `-` simplesmente não muda
--    nada nessa linha — rodar de novo com a mesma chave não dá erro.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remover_campo_personalizado_estoque(p_empresa_id uuid, p_chave text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_empresa_id IS NULL OR p_chave IS NULL OR btrim(p_chave) = '' THEN
    RAISE EXCEPTION 'empresa_id e chave são obrigatórios';
  END IF;

  IF p_empresa_id NOT IN (SELECT public.empresas_do_usuario()) THEN
    RAISE EXCEPTION 'sem permissão para alterar esta empresa';
  END IF;

  UPDATE public.empresas
  SET campos_personalizados_estoque = COALESCE(
    (
      SELECT jsonb_agg(campo)
      FROM jsonb_array_elements(campos_personalizados_estoque) AS campo
      WHERE campo->>'chave' <> p_chave
    ),
    '[]'::jsonb
  )
  WHERE id = p_empresa_id;

  UPDATE public.produtos
  SET atributos_nicho = atributos_nicho - p_chave
  WHERE empresa_id = p_empresa_id
    AND atributos_nicho ? p_chave;
END;
$$;

REVOKE ALL ON FUNCTION public.remover_campo_personalizado_estoque(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.remover_campo_personalizado_estoque(uuid, text) TO authenticated;

COMMIT;
