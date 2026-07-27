-- ============================================================================
-- AXIOMA — Estoque, Fase 1 (fundação operacional / fonte da verdade do CMV)
-- Rodar UMA VEZ no SQL Editor do Supabase. Transação única (BEGIN/COMMIT),
-- idempotente (IF NOT EXISTS em tudo) — pode rodar de novo sem quebrar nada.
--
-- Nasce no padrão multi-tenant definitivo (decidido 2026-07-23):
--   - empresa_id NOT NULL desde a criação
--   - RLS via empresas_do_usuario() (mesma função da migração multi-tenant)
--   - índice composto (empresa_id, data) + índice em toda FK
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1) PRODUTOS — cadastro
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  user_id uuid not null,

  codigo_interno text,
  codigo_barras text,
  sku text,
  nome text not null,
  descricao text,
  categoria text,
  subcategoria text,
  marca text,
  fabricante text,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,

  unidade text not null default 'UN',
  peso numeric,
  altura numeric,
  largura numeric,
  comprimento numeric,
  volume numeric,
  cor text,
  modelo text,

  rua text,
  prateleira text,
  nivel text,
  posicao text,

  centro_custo_id uuid references public.centros_custo(id) on delete set null,
  conta_contabil text,

  preco_custo numeric not null default 0,
  preco_medio numeric not null default 0,
  preco_medio_anterior numeric not null default 0,
  preco_sugerido numeric,
  preco_minimo numeric,
  preco_promocional numeric,
  margem numeric,
  markup numeric,

  ncm text,
  cest text,
  cfop_padrao text,
  ipi numeric,
  icms numeric,
  pis numeric,
  cofins numeric,
  iss numeric,

  estoque_minimo numeric not null default 0,
  estoque_maximo numeric,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  imagem_principal text,
  observacoes text,

  saldo_disponivel numeric not null default 0,
  saldo_reservado numeric not null default 0,
  saldo_transito numeric not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'produtos'
  ) THEN
    CREATE POLICY produtos_multi_tenant ON public.produtos
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_produtos_empresa_created ON public.produtos(empresa_id, created_at);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_status ON public.produtos(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON public.produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_produtos_centro_custo ON public.produtos(centro_custo_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_produtos_empresa_codbarras ON public.produtos(empresa_id, codigo_barras) WHERE codigo_barras IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_produtos_empresa_sku ON public.produtos(empresa_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_nome_trgm ON public.produtos USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_produtos_codint_trgm ON public.produtos USING gin (codigo_interno gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_produtos_marca_trgm ON public.produtos USING gin (marca gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_trgm ON public.produtos USING gin (categoria gin_trgm_ops);

-- ============================================================================
-- 2) ESTOQUE_LOTES — validade + FEFO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.estoque_lotes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  numero_lote text,
  data_fabricacao date,
  data_validade date,
  quantidade_atual numeric not null default 0,
  custo_unitario numeric,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.estoque_lotes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'estoque_lotes'
  ) THEN
    CREATE POLICY estoque_lotes_multi_tenant ON public.estoque_lotes
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lotes_empresa_validade ON public.estoque_lotes(empresa_id, data_validade);
CREATE INDEX IF NOT EXISTS idx_lotes_produto ON public.estoque_lotes(produto_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_lotes_produto_numero ON public.estoque_lotes(produto_id, numero_lote) WHERE numero_lote IS NOT NULL;

-- ============================================================================
-- 3) ESTOQUE_MOVIMENTACOES — histórico completo
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  user_id uuid not null,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'transferencia', 'perda', 'ajuste', 'inventario', 'devolucao')),
  quantidade numeric not null,
  custo_unitario numeric,
  valor_total numeric,
  lote_id uuid references public.estoque_lotes(id) on delete set null,
  status_recebimento text not null default 'confirmada' check (status_recebimento in ('confirmada', 'em_transito')),
  destino_saldo text not null default 'disponivel' check (destino_saldo in ('disponivel', 'reservado')),
  data_hora timestamptz not null default now(),
  motivo text,
  origem text not null default 'manual' check (origem in ('manual', 'nfe', 'pdv', 'importacao')),
  documento_ref text,
  created_at timestamptz not null default now()
);

ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'estoque_movimentacoes'
  ) THEN
    CREATE POLICY estoque_movimentacoes_multi_tenant ON public.estoque_movimentacoes
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mov_empresa_data ON public.estoque_movimentacoes(empresa_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_mov_produto_data ON public.estoque_movimentacoes(produto_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_mov_lote ON public.estoque_movimentacoes(lote_id);
CREATE INDEX IF NOT EXISTS idx_mov_empresa_tipo ON public.estoque_movimentacoes(empresa_id, tipo);

-- ============================================================================
-- 4) TRIGGER BEFORE INSERT — snapshota o custo médio do momento em saída/perda
--    (o app não precisa calcular/enviar isso; garante consistência mesmo com
--    duas gravações concorrentes)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trg_estoque_movimentacao_before()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tipo IN ('saida', 'perda') AND NEW.custo_unitario IS NULL THEN
    SELECT preco_medio INTO NEW.custo_unitario FROM produtos WHERE id = NEW.produto_id;
  END IF;
  IF NEW.valor_total IS NULL AND NEW.custo_unitario IS NOT NULL THEN
    NEW.valor_total := NEW.quantidade * NEW.custo_unitario;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mov_before ON public.estoque_movimentacoes;
CREATE TRIGGER trg_mov_before
BEFORE INSERT ON public.estoque_movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.trg_estoque_movimentacao_before();

-- ============================================================================
-- 5) CUSTO MÉDIO MÓVEL + SALDOS — reprocessa o histórico do produto em ordem
--    cronológica a cada gravação (não é soma incremental: saída não muda o
--    custo médio, só a próxima entrada muda, ponderada pelo saldo real que
--    sobrou depois das saídas — é assim que fecha certo com o método de custo
--    médio ponderado móvel).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_estoque_recalcular_produto(p_produto_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  v_saldo_qtd numeric := 0;
  v_saldo_valor numeric := 0;
  v_preco_medio numeric := 0;
  v_preco_medio_anterior numeric := 0;
  v_custo_ultima_entrada numeric := 0;
  v_saldo_reservado numeric := 0;
  v_saldo_transito numeric := 0;
BEGIN
  FOR rec IN
    SELECT tipo, quantidade, custo_unitario, status_recebimento, destino_saldo
    FROM estoque_movimentacoes
    WHERE produto_id = p_produto_id
    ORDER BY data_hora ASC, created_at ASC
  LOOP
    IF rec.tipo = 'entrada' AND rec.status_recebimento = 'em_transito' THEN
      v_saldo_transito := v_saldo_transito + rec.quantidade;

    ELSIF rec.tipo = 'entrada' THEN -- confirmada
      v_preco_medio_anterior := v_preco_medio;
      v_saldo_valor := v_saldo_valor + (rec.quantidade * COALESCE(rec.custo_unitario, 0));
      v_saldo_qtd := v_saldo_qtd + rec.quantidade;
      IF v_saldo_qtd > 0 THEN v_preco_medio := v_saldo_valor / v_saldo_qtd; END IF;
      v_custo_ultima_entrada := COALESCE(rec.custo_unitario, v_custo_ultima_entrada);

    ELSIF rec.tipo IN ('saida', 'perda') THEN
      v_saldo_valor := v_saldo_valor - (rec.quantidade * v_preco_medio);
      v_saldo_qtd := v_saldo_qtd - rec.quantidade;

    ELSIF rec.tipo = 'devolucao' THEN
      v_saldo_valor := v_saldo_valor + (rec.quantidade * v_preco_medio);
      v_saldo_qtd := v_saldo_qtd + rec.quantidade;

    ELSIF rec.tipo IN ('ajuste', 'inventario') AND rec.destino_saldo = 'reservado' THEN
      v_saldo_reservado := v_saldo_reservado + rec.quantidade;

    ELSIF rec.tipo IN ('ajuste', 'inventario') THEN -- destino_saldo = 'disponivel'
      v_saldo_valor := v_saldo_valor + (rec.quantidade * v_preco_medio);
      v_saldo_qtd := v_saldo_qtd + rec.quantidade;

    END IF;
    -- 'transferencia': ponytail — sem efeito no saldo total nesta fase (não
    -- existe múltiplo depósito ainda); só fica registrada pra rastreabilidade.
    -- Upgrade: quando houver mais de um local físico controlado, dar baixa na
    -- origem e entrada no destino como duas pernas de saldo.
  END LOOP;

  UPDATE produtos SET
    saldo_disponivel = v_saldo_qtd,
    saldo_reservado = v_saldo_reservado,
    saldo_transito = v_saldo_transito,
    preco_medio = v_preco_medio,
    preco_medio_anterior = v_preco_medio_anterior,
    preco_custo = CASE WHEN v_custo_ultima_entrada > 0 THEN v_custo_ultima_entrada ELSE preco_custo END,
    margem = CASE WHEN preco_sugerido > 0 THEN ((preco_sugerido - v_preco_medio) / preco_sugerido) * 100 ELSE margem END,
    markup = CASE WHEN v_preco_medio > 0 THEN ((preco_sugerido - v_preco_medio) / v_preco_medio) * 100 ELSE markup END,
    updated_at = now()
  WHERE id = p_produto_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_estoque_movimentacao_recalcular()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.fn_estoque_recalcular_produto(OLD.produto_id);
    RETURN OLD;
  ELSE
    PERFORM public.fn_estoque_recalcular_produto(NEW.produto_id);
    IF TG_OP = 'UPDATE' AND OLD.produto_id <> NEW.produto_id THEN
      PERFORM public.fn_estoque_recalcular_produto(OLD.produto_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_mov_recalcular ON public.estoque_movimentacoes;
CREATE TRIGGER trg_mov_recalcular
AFTER INSERT OR UPDATE OR DELETE ON public.estoque_movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.trg_estoque_movimentacao_recalcular();

-- ============================================================================
-- 6) LOTES — quantidade_atual também por recálculo (mesmo princípio: nunca
--    soma incremental manual, sempre reagregado do histórico real)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_lote_recalcular(p_lote_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qtd numeric := 0;
BEGIN
  SELECT COALESCE(SUM(CASE
    WHEN tipo = 'entrada' AND status_recebimento = 'confirmada' THEN quantidade
    WHEN tipo = 'devolucao' THEN quantidade
    WHEN tipo IN ('saida', 'perda') THEN -quantidade
    ELSE 0 END), 0) INTO v_qtd
  FROM estoque_movimentacoes WHERE lote_id = p_lote_id;

  UPDATE estoque_lotes SET quantidade_atual = v_qtd, updated_at = now() WHERE id = p_lote_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_estoque_movimentacao_lote()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.lote_id IS NOT NULL THEN PERFORM public.fn_lote_recalcular(OLD.lote_id); END IF;
    RETURN OLD;
  ELSE
    IF NEW.lote_id IS NOT NULL THEN PERFORM public.fn_lote_recalcular(NEW.lote_id); END IF;
    IF TG_OP = 'UPDATE' AND OLD.lote_id IS NOT NULL AND OLD.lote_id <> NEW.lote_id THEN
      PERFORM public.fn_lote_recalcular(OLD.lote_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_mov_lote ON public.estoque_movimentacoes;
CREATE TRIGGER trg_mov_lote
AFTER INSERT OR UPDATE OR DELETE ON public.estoque_movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.trg_estoque_movimentacao_lote();

-- ============================================================================
-- 7) VIEWS — agregação no banco, nunca no navegador (Regra 4, seção 9 do
--    STATUS). security_invoker = true: a RLS de quem consulta a view continua
--    valendo, exatamente como se fosse a tabela base.
-- ============================================================================

-- CMV por período — fonte da verdade pra DRE ler quando/se for plugada (não
-- alterei nenhum arquivo da DRE nesta fase).
CREATE OR REPLACE VIEW public.vw_cmv_periodo
WITH (security_invoker = true) AS
SELECT
  empresa_id,
  date_trunc('month', data_hora)::date AS periodo,
  SUM(quantidade * COALESCE(custo_unitario, 0)) AS cmv_total
FROM estoque_movimentacoes
WHERE tipo = 'saida'
GROUP BY empresa_id, date_trunc('month', data_hora);

-- Avisos de estoque por produto (ruptura, baixo estoque, capital parado, custo subindo)
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
WHERE status = 'ativo';

-- Avisos de validade, escalonados por severidade (base FEFO)
CREATE OR REPLACE VIEW public.vw_estoque_avisos_validade
WITH (security_invoker = true) AS
SELECT
  l.id AS lote_id, l.empresa_id, l.produto_id, p.nome AS produto_nome,
  l.numero_lote, l.data_validade, l.quantidade_atual,
  (l.data_validade - CURRENT_DATE) AS dias_para_vencer,
  CASE
    WHEN l.data_validade < CURRENT_DATE THEN 'vencido'
    WHEN l.data_validade - CURRENT_DATE <= 1 THEN 'ultimo_dia'
    WHEN l.data_validade - CURRENT_DATE <= 7 THEN 'critico_7'
    WHEN l.data_validade - CURRENT_DATE <= 30 THEN 'atencao_30'
    WHEN l.data_validade - CURRENT_DATE <= 60 THEN 'aviso_60'
    WHEN l.data_validade - CURRENT_DATE <= 90 THEN 'monitorar_90'
    ELSE 'ok'
  END AS severidade
FROM estoque_lotes l
JOIN produtos p ON p.id = l.produto_id
WHERE l.quantidade_atual > 0 AND l.data_validade IS NOT NULL;

-- KPIs do Dashboard Executivo — um total por empresa, nunca somado no navegador
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
GROUP BY empresa_id;

-- Composição por categoria (gráfico do Painel)
CREATE OR REPLACE VIEW public.vw_estoque_por_categoria
WITH (security_invoker = true) AS
SELECT
  empresa_id,
  COALESCE(NULLIF(categoria, ''), '—') AS categoria,
  SUM(saldo_disponivel * preco_medio) AS valor_total,
  SUM(saldo_disponivel) AS quantidade_total
FROM produtos
WHERE status = 'ativo'
GROUP BY empresa_id, COALESCE(NULLIF(categoria, ''), '—');

-- Composição por fornecedor (gráfico do Painel)
CREATE OR REPLACE VIEW public.vw_estoque_por_fornecedor
WITH (security_invoker = true) AS
SELECT
  p.empresa_id,
  p.fornecedor_id,
  f.nome AS fornecedor_nome,
  SUM(p.saldo_disponivel * p.preco_medio) AS valor_total,
  SUM(p.saldo_disponivel) AS quantidade_total
FROM produtos p
LEFT JOIN fornecedores f ON f.id = p.fornecedor_id
WHERE p.status = 'ativo' AND p.fornecedor_id IS NOT NULL
GROUP BY p.empresa_id, p.fornecedor_id, f.nome;

-- Entradas x Saídas por mês (gráfico do Painel — evolução do estoque)
CREATE OR REPLACE VIEW public.vw_estoque_evolucao
WITH (security_invoker = true) AS
SELECT
  empresa_id,
  date_trunc('month', data_hora)::date AS periodo,
  SUM(quantidade) FILTER (WHERE tipo = 'entrada' AND status_recebimento = 'confirmada') AS entradas_qtd,
  SUM(quantidade) FILTER (WHERE tipo = 'saida') AS saidas_qtd,
  SUM(quantidade * COALESCE(custo_unitario, 0)) FILTER (WHERE tipo = 'entrada' AND status_recebimento = 'confirmada') AS entradas_valor,
  SUM(quantidade * COALESCE(custo_unitario, 0)) FILTER (WHERE tipo = 'saida') AS saidas_valor
FROM estoque_movimentacoes
GROUP BY empresa_id, date_trunc('month', data_hora);

COMMIT;

-- ============================================================================
-- PASSO MANUAL (fora deste SQL): criar o bucket de Storage "produto-imagens"
-- (público), igual "empresa-logos" — Storage → New bucket, no painel do
-- Supabase. Não dá pra criar bucket de dentro de uma transação SQL comum.
-- ============================================================================
