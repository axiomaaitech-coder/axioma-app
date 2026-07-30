-- ============================================================================
-- AXIOMA — Estoque: correções + Cadastro Camaleão (B) + Inteligência Fase 2 (C)
-- PRÉ-REQUISITO: rodar ESTOQUE-FASE1-SQL.sql primeiro (cria produtos,
-- estoque_movimentacoes, estoque_lotes — sem isso este arquivo falha).
-- Rodar UMA VEZ no SQL Editor do Supabase. Transação única (BEGIN/COMMIT),
-- idempotente (IF NOT EXISTS / CREATE OR REPLACE em tudo).
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE B — CADASTRO CAMALEÃO POR NICHO
-- ============================================================================

-- Segmento padrão da empresa (cada produto pode sobrescrever) + campos que a
-- própria empresa cria (nome/tipo) — o VALOR de cada um mora em
-- produtos.atributos_nicho, isto aqui só guarda a DEFINIÇÃO do campo.
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS segmento_padrao text;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS campos_personalizados_estoque jsonb NOT NULL DEFAULT '[]';

-- Segmento por produto (nullable — herda o da empresa quando vazio) + balde
-- único de atributos específicos de nicho E campos personalizados da empresa.
-- Não vira coluna nova por campo (explodiria o schema a cada nicho diferente).
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS segmento text;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS atributos_nicho jsonb NOT NULL DEFAULT '{}';

-- Aprendizado de categorização por empresa: quando o usuário corrige a
-- sugestão de categoria, grava aqui pra próxima vez a mesma palavra já vir
-- certa (prioridade sobre o dicionário fixo do segmento). Mesmo padrão de
-- importacao_padroes_classificacao (já existe no projeto).
CREATE TABLE IF NOT EXISTS public.produtos_categoria_aprendizado (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  termo text not null,
  categoria text not null,
  ocorrencias int not null default 1,
  ultima_vez_usado timestamptz not null default now(),
  created_at timestamptz not null default now()
);

ALTER TABLE public.produtos_categoria_aprendizado ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'produtos_categoria_aprendizado'
  ) THEN
    CREATE POLICY produtos_categoria_aprendizado_multi_tenant ON public.produtos_categoria_aprendizado
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_categoria_aprendizado_empresa_termo ON public.produtos_categoria_aprendizado(empresa_id, termo);
CREATE INDEX IF NOT EXISTS idx_categoria_aprendizado_empresa_uso ON public.produtos_categoria_aprendizado(empresa_id, ultima_vez_usado);

-- ============================================================================
-- PARTE C — INTELIGÊNCIA (Fase 2) + PARTE D4 — pronto pra NFC-e
-- ============================================================================

ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS lead_time_dias integer;
-- preco_venda é o preço de fato praticado na venda (NFC-e/PDV) — distinto de
-- preco_sugerido (referência) e preco_promocional (campanha pontual).
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS preco_venda numeric;

-- Giro + velocidade de consumo (base pra ponto de reposição e previsão de
-- ruptura, calculados no cliente a partir destes 2 números — sem view extra).
CREATE OR REPLACE VIEW public.vw_estoque_giro
WITH (security_invoker = true) AS
SELECT
  p.id AS produto_id, p.empresa_id, p.nome, p.categoria, p.saldo_disponivel, p.preco_medio, p.lead_time_dias,
  COALESCE(m90.saida_qtd, 0) AS saida_qtd_90d,
  COALESCE(m90.saida_valor, 0) AS saida_valor_90d,
  ROUND(COALESCE(m90.saida_qtd, 0) / 90.0, 3) AS velocidade_consumo_diaria,
  CASE WHEN p.saldo_disponivel > 0 THEN ROUND(COALESCE(m90.saida_qtd, 0)::numeric / p.saldo_disponivel, 2) ELSE NULL END AS giro_90d
FROM public.produtos p
LEFT JOIN LATERAL (
  SELECT SUM(quantidade) AS saida_qtd, SUM(valor_total) AS saida_valor
  FROM public.estoque_movimentacoes em
  WHERE em.produto_id = p.id AND em.tipo = 'saida' AND em.data_hora >= now() - interval '90 days'
) m90 ON true
WHERE p.status = 'ativo';

-- Curva ABC/Pareto por valor de saída nos últimos 90 dias (dentro da empresa).
CREATE OR REPLACE VIEW public.vw_estoque_curva_abc
WITH (security_invoker = true) AS
WITH base AS (
  SELECT p.id AS produto_id, p.empresa_id, p.nome, p.categoria,
    COALESCE(SUM(m.quantidade * m.custo_unitario) FILTER (WHERE m.tipo = 'saida' AND m.data_hora >= now() - interval '90 days'), 0) AS valor_saida_90d
  FROM public.produtos p
  LEFT JOIN public.estoque_movimentacoes m ON m.produto_id = p.id
  WHERE p.status = 'ativo'
  GROUP BY p.id, p.empresa_id, p.nome, p.categoria
),
ranked AS (
  SELECT *,
    SUM(valor_saida_90d) OVER (PARTITION BY empresa_id ORDER BY valor_saida_90d DESC, produto_id) AS acumulado,
    SUM(valor_saida_90d) OVER (PARTITION BY empresa_id) AS total_empresa
  FROM base
)
SELECT produto_id, empresa_id, nome, categoria, valor_saida_90d,
  CASE WHEN total_empresa > 0 THEN ROUND(acumulado / total_empresa * 100, 1) ELSE 0 END AS pct_acumulado,
  CASE
    WHEN total_empresa = 0 OR valor_saida_90d = 0 THEN 'sem_giro'
    WHEN acumulado / total_empresa <= 0.8 THEN 'A'
    WHEN acumulado / total_empresa <= 0.95 THEN 'B'
    ELSE 'C'
  END AS classe_abc
FROM ranked;

-- Capital imobilizado + tempo parado (aging) por produto.
CREATE OR REPLACE VIEW public.vw_estoque_capital_imobilizado
WITH (security_invoker = true) AS
SELECT
  p.id AS produto_id, p.empresa_id, p.nome, p.categoria, p.saldo_disponivel, p.preco_medio,
  (p.saldo_disponivel * p.preco_medio) AS capital_imobilizado,
  ultima.data_hora AS ultima_movimentacao,
  CASE WHEN ultima.data_hora IS NOT NULL THEN EXTRACT(DAY FROM now() - ultima.data_hora)::int ELSE NULL END AS dias_sem_movimento
FROM public.produtos p
LEFT JOIN LATERAL (
  SELECT data_hora FROM public.estoque_movimentacoes em WHERE em.produto_id = p.id ORDER BY data_hora DESC LIMIT 1
) ultima ON true
WHERE p.status = 'ativo' AND p.saldo_disponivel > 0;

-- Rentabilidade PROJETADA (preco_sugerido × custo médio — nunca lucro
-- realizado, porque ainda não existe venda real via PDV) por categoria/
-- fornecedor/marca. Só entra produto com preco_sugerido preenchido.
CREATE OR REPLACE VIEW public.vw_estoque_rentabilidade_categoria
WITH (security_invoker = true) AS
SELECT empresa_id, COALESCE(NULLIF(categoria, ''), '—') AS categoria,
  AVG(margem) AS margem_media, AVG(markup) AS markup_medio,
  SUM(saldo_disponivel * preco_medio) AS capital_no_grupo
FROM public.produtos
WHERE status = 'ativo' AND preco_sugerido IS NOT NULL
GROUP BY empresa_id, COALESCE(NULLIF(categoria, ''), '—');

CREATE OR REPLACE VIEW public.vw_estoque_rentabilidade_fornecedor
WITH (security_invoker = true) AS
SELECT p.empresa_id, p.fornecedor_id, f.nome AS fornecedor_nome,
  AVG(p.margem) AS margem_media, AVG(p.markup) AS markup_medio,
  SUM(p.saldo_disponivel * p.preco_medio) AS capital_no_grupo
FROM public.produtos p
LEFT JOIN public.fornecedores f ON f.id = p.fornecedor_id
WHERE p.status = 'ativo' AND p.preco_sugerido IS NOT NULL AND p.fornecedor_id IS NOT NULL
GROUP BY p.empresa_id, p.fornecedor_id, f.nome;

CREATE OR REPLACE VIEW public.vw_estoque_rentabilidade_marca
WITH (security_invoker = true) AS
SELECT empresa_id, COALESCE(NULLIF(marca, ''), '—') AS marca,
  AVG(margem) AS margem_media, AVG(markup) AS markup_medio,
  SUM(saldo_disponivel * preco_medio) AS capital_no_grupo
FROM public.produtos
WHERE status = 'ativo' AND preco_sugerido IS NOT NULL
GROUP BY empresa_id, COALESCE(NULLIF(marca, ''), '—');

-- Comparação de fornecedores por regra, a partir do histórico real de entradas.
CREATE OR REPLACE VIEW public.vw_estoque_fornecedores_comparativo
WITH (security_invoker = true) AS
SELECT
  p.empresa_id, p.fornecedor_id, f.nome AS fornecedor_nome,
  AVG(m.custo_unitario) FILTER (WHERE m.tipo = 'entrada' AND m.status_recebimento = 'confirmada') AS preco_medio_compra,
  COUNT(*) FILTER (WHERE m.tipo = 'entrada' AND m.status_recebimento = 'confirmada') AS frequencia_entregas,
  MAX(m.data_hora) FILTER (WHERE m.tipo = 'entrada' AND m.status_recebimento = 'confirmada') AS ultima_entrada
FROM public.produtos p
JOIN public.estoque_movimentacoes m ON m.produto_id = p.id
LEFT JOIN public.fornecedores f ON f.id = p.fornecedor_id
WHERE p.fornecedor_id IS NOT NULL
GROUP BY p.empresa_id, p.fornecedor_id, f.nome;

COMMIT;
