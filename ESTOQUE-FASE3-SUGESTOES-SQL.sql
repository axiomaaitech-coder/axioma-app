-- ============================================================================
-- AXIOMA — Estoque: sugestão inteligente por histórico (autocomplete) +
-- migração dos campos de nicho fundidos. Rodar UMA VEZ no SQL Editor do
-- Supabase, depois dos SQLs anteriores de Estoque. Transação única
-- (BEGIN/COMMIT), idempotente (CREATE OR REPLACE + condições de migração
-- que não fazem nada numa segunda execução) — pode rodar de novo sem quebrar.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Sugestão por histórico — colunas de produtos (Rua, Prateleira, Nível,
--    Posição, Conta Contábil). Lista de colunas é uma whitelist fixa: só
--    essas 5 podem ser consultadas, mesmo que alguém passe outro nome —
--    protege contra SQL dinâmico malicioso (o nome da coluna vira SQL
--    literal via format(%I), então só roda depois de validado no IF).
-- ----------------------------------------------------------------------------
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
  IF p_coluna NOT IN ('rua', 'prateleira', 'nivel', 'posicao', 'conta_contabil') THEN
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

-- ----------------------------------------------------------------------------
-- 2) Sugestão por histórico — qualquer campo de texto dentro de
--    atributos_nicho (Sabor, Cor, Material, Marca, Aplicação/Veículo etc.).
--    p_chave é usado só como valor de comparação (atributos_nicho->>p_chave),
--    nunca vira identificador SQL — não precisa de whitelist, é seguro por
--    natureza (parâmetro de bind normal).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.estoque_sugestoes_atributo(p_empresa_id uuid, p_chave text)
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

  RETURN QUERY
    SELECT atributos_nicho->>p_chave AS valor, count(*) AS usos
    FROM public.produtos
    WHERE empresa_id = p_empresa_id
      AND atributos_nicho ? p_chave
      AND btrim(atributos_nicho->>p_chave) <> ''
    GROUP BY atributos_nicho->>p_chave
    ORDER BY count(*) DESC
    LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION public.estoque_sugestoes_atributo(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.estoque_sugestoes_atributo(uuid, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3) Combinações de localização já usadas (Rua + Prateleira + Nível +
--    Posição juntos), pra sugerir o conjunto inteiro de uma vez.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.estoque_sugestoes_localizacao(p_empresa_id uuid)
RETURNS TABLE(rua text, prateleira text, nivel text, posicao text, usos bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_empresa_id NOT IN (SELECT public.empresas_do_usuario()) THEN
    RAISE EXCEPTION 'sem permissão para consultar esta empresa';
  END IF;

  RETURN QUERY
    SELECT p.rua, p.prateleira, p.nivel, p.posicao, count(*) AS usos
    FROM public.produtos p
    WHERE p.empresa_id = p_empresa_id
      AND (coalesce(p.rua, '') <> '' OR coalesce(p.prateleira, '') <> '' OR coalesce(p.nivel, '') <> '' OR coalesce(p.posicao, '') <> '')
    GROUP BY p.rua, p.prateleira, p.nivel, p.posicao
    ORDER BY count(*) DESC
    LIMIT 8;
END;
$$;

REVOKE ALL ON FUNCTION public.estoque_sugestoes_localizacao(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.estoque_sugestoes_localizacao(uuid) TO authenticated;

-- ============================================================================
-- 4) MIGRAÇÃO — campos de nicho fundidos (o app já foi atualizado pra só usar
--    a chave vencedora; isto aqui só resgata o dado de quem já tinha salvo
--    com a chave antiga, pra ninguém perder informação).
--    Padrão por par: 1ª UPDATE copia o valor da chave perdedora pra vencedora
--    SÓ quando a vencedora ainda está vazia (nunca sobrescreve dado real);
--    2ª UPDATE remove a chave perdedora de todo mundo. Idempotente: numa
--    segunda execução não sobra nenhuma linha com a chave perdedora, então
--    as duas UPDATEs não afetam nada.
-- ============================================================================

-- Pet: "Peso da Embalagem" (pesoEmbalagem) + "Peso/Volume" (pesoVolume) → pesoVolume
UPDATE public.produtos
SET atributos_nicho = jsonb_set(atributos_nicho, '{pesoVolume}', atributos_nicho->'pesoEmbalagem')
WHERE atributos_nicho ? 'pesoEmbalagem'
  AND (NOT (atributos_nicho ? 'pesoVolume') OR btrim(atributos_nicho->>'pesoVolume') = '');

UPDATE public.produtos
SET atributos_nicho = atributos_nicho - 'pesoEmbalagem'
WHERE atributos_nicho ? 'pesoEmbalagem';

-- Vestuário: "Composição do Tecido" (composicaoTecido) + "Material/Composição" (materialComposicao) → materialComposicao
UPDATE public.produtos
SET atributos_nicho = jsonb_set(atributos_nicho, '{materialComposicao}', atributos_nicho->'composicaoTecido')
WHERE atributos_nicho ? 'composicaoTecido'
  AND (NOT (atributos_nicho ? 'materialComposicao') OR btrim(atributos_nicho->>'materialComposicao') = '');

UPDATE public.produtos
SET atributos_nicho = atributos_nicho - 'composicaoTecido'
WHERE atributos_nicho ? 'composicaoTecido';

-- Vestuário: "Coleção" (colecao) + "Coleção/Estação" (colecaoEstacao) → colecaoEstacao
UPDATE public.produtos
SET atributos_nicho = jsonb_set(atributos_nicho, '{colecaoEstacao}', atributos_nicho->'colecao')
WHERE atributos_nicho ? 'colecao'
  AND (NOT (atributos_nicho ? 'colecaoEstacao') OR btrim(atributos_nicho->>'colecaoEstacao') = '');

UPDATE public.produtos
SET atributos_nicho = atributos_nicho - 'colecao'
WHERE atributos_nicho ? 'colecao';

-- Eletrônicos: "Garantia do Fabricante (meses)" (garantiaFabricanteMeses) + "Garantia (meses)" (garantiaMeses) → garantiaMeses
UPDATE public.produtos
SET atributos_nicho = jsonb_set(atributos_nicho, '{garantiaMeses}', atributos_nicho->'garantiaFabricanteMeses')
WHERE atributos_nicho ? 'garantiaFabricanteMeses'
  AND (NOT (atributos_nicho ? 'garantiaMeses') OR btrim(atributos_nicho->>'garantiaMeses') = '');

UPDATE public.produtos
SET atributos_nicho = atributos_nicho - 'garantiaFabricanteMeses'
WHERE atributos_nicho ? 'garantiaFabricanteMeses';

COMMIT;
