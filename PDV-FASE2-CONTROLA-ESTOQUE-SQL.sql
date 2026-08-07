-- ============================================================================
-- AXIOMA — PDV Fase 2: isola "modo serviço" do controle de estoque
-- Exigência do Elias (Fase 2): produto do modo serviço (Salão/Barbearia,
-- Manicure/Estética, Serviços Técnicos, Serviços Domésticos) NUNCA pode
-- aparecer em ruptura, baixo estoque, curva ABC, giro ou nos KPIs de saldo do
-- Estoque — senão polui a tela de quem vende serviço.
--
-- CAUSA RAIZ INVESTIGADA: serviço nasce com saldo_disponivel = 0 (nunca
-- recebe entrada/saída — não vende unidade física). vw_estoque_avisos define
-- ruptura como "saldo_disponivel <= 0" — sem distinção, um serviço apareceria
-- em ruptura PRA SEMPRE, e seria contado em qtd_ruptura/produtos_ativos do
-- KPI. FEFO (estoque_lotes) já é seguro por construção: o formulário do PDV
-- nunca abre o bloco de lote pra modo serviço, então nunca existe lote pra um
-- serviço ler.
--
-- SOLUÇÃO: 1 coluna nova, boolean, default TRUE — ou seja, TODO produto
-- existente (os 10 segmentos do Estoque, sem exceção) continua exatamente
-- como está, contado em tudo, sem nenhuma mudança de comportamento. Só passa
-- a existir "false" nos produtos NOVOS que o PDV cria com nicho de modo
-- serviço — nunca é uma caixinha que o usuário marca, o próprio cadastro do
-- PDV decide sozinho a partir do nicho escolhido na navegação.
--
-- Não usa lista fixa de segmento nas views (ex: "segmento NOT IN
-- ('salao_barbearia', ...)") de propósito — é o mesmo erro já cometido e
-- corrigido na Fase 0 do PDV (lista fixa esquece nicho novo). Uma coluna
-- própria não tem esse risco: qualquer nicho de serviço futuro já nasce
-- coberto, sem precisar lembrar de atualizar view nenhuma.
--
-- Idempotente — pode rodar mais de uma vez com segurança.
-- ============================================================================

BEGIN;

ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS controla_estoque boolean NOT NULL DEFAULT true;

-- Avisos (ruptura/baixo estoque/capital parado/custo subindo) — só considera
-- quem controla estoque de verdade.
CREATE OR REPLACE VIEW public.vw_estoque_avisos
WITH (security_invoker = true) AS
SELECT
  id AS produto_id, empresa_id, nome, codigo_interno, categoria,
  saldo_disponivel, estoque_minimo, estoque_maximo,
  preco_medio, preco_medio_anterior, preco_custo,
  (saldo_disponivel <= 0) AS ruptura,
  (saldo_disponivel > 0 AND saldo_disponivel <= estoque_minimo) AS baixo_estoque,
  (estoque_maximo IS NOT NULL AND saldo_disponivel > estoque_maximo) AS capital_parado,
  (preco_medio_anterior > 0 AND preco_custo > preco_medio_anterior) AS custo_subindo
FROM produtos
WHERE status = 'ativo' AND controla_estoque = true;

-- KPIs do Dashboard Executivo do Estoque — mesma regra: serviço não entra em
-- "produtos ativos", ruptura, baixo estoque, capital parado nem custo subindo.
CREATE OR REPLACE VIEW public.vw_estoque_kpis
WITH (security_invoker = true) AS
SELECT
  empresa_id,
  COALESCE(SUM(saldo_disponivel * preco_medio) FILTER (WHERE status = 'ativo'), 0) AS valor_total_estoque,
  COUNT(*) FILTER (WHERE status = 'ativo') AS produtos_ativos,
  COUNT(*) FILTER (WHERE status = 'inativo') AS produtos_inativos,
  COUNT(*) FILTER (WHERE status = 'ativo' AND saldo_disponivel <= 0) AS qtd_ruptura,
  COUNT(*) FILTER (WHERE status = 'ativo' AND saldo_disponivel > 0 AND saldo_disponivel <= estoque_minimo) AS qtd_baixo_estoque,
  COUNT(*) FILTER (WHERE status = 'ativo' AND estoque_maximo IS NOT NULL AND saldo_disponivel > estoque_maximo) AS qtd_capital_parado,
  COUNT(*) FILTER (WHERE status = 'ativo' AND preco_medio_anterior > 0 AND preco_custo > preco_medio_anterior) AS qtd_custo_subindo
FROM produtos
WHERE controla_estoque = true
GROUP BY empresa_id;

-- Giro + velocidade de consumo — base do "vai faltar em breve"
-- (calcularAlertasReposicao lê daqui; sem filtro aqui, herdava o problema).
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
WHERE p.status = 'ativo' AND p.controla_estoque = true;

-- Curva ABC/Pareto — mesma regra.
CREATE OR REPLACE VIEW public.vw_estoque_curva_abc
WITH (security_invoker = true) AS
WITH base AS (
  SELECT p.id AS produto_id, p.empresa_id, p.nome, p.categoria,
    COALESCE(SUM(m.quantidade * m.custo_unitario) FILTER (WHERE m.tipo = 'saida' AND m.data_hora >= now() - interval '90 days'), 0) AS valor_saida_90d
  FROM public.produtos p
  LEFT JOIN public.estoque_movimentacoes m ON m.produto_id = p.id
  WHERE p.status = 'ativo' AND p.controla_estoque = true
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

-- Não precisou mexer: vw_estoque_capital_imobilizado já filtra
-- "saldo_disponivel > 0" — serviço (saldo sempre 0) já fica de fora por
-- construção. vw_estoque_por_categoria/por_fornecedor/evolucao são SOMA, não
-- CONTAGEM — serviço contribui exatamente R$0/0 unidades pra soma (saldo
-- sempre 0), não distorce nenhum total exibido.

COMMIT;
