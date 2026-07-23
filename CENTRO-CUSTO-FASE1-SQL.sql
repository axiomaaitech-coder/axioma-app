-- ============================================================================
-- AXIOMA — Centro de Custos Fase 1
-- Rodar uma única vez no Supabase SQL Editor. Só acrescenta colunas/tabelas
-- novas (IF NOT EXISTS), nada existente é alterado ou apagado.
-- ============================================================================

-- 1) Liga cada módulo de custo/receita ao centro de custo (opcional, nullable)
ALTER TABLE custos_fixos      ADD COLUMN IF NOT EXISTS centro_custo_id uuid REFERENCES centros_custo(id) ON DELETE SET NULL;
ALTER TABLE custos_variaveis  ADD COLUMN IF NOT EXISTS centro_custo_id uuid REFERENCES centros_custo(id) ON DELETE SET NULL;
ALTER TABLE contas_pagar      ADD COLUMN IF NOT EXISTS centro_custo_id uuid REFERENCES centros_custo(id) ON DELETE SET NULL;
ALTER TABLE receitas          ADD COLUMN IF NOT EXISTS centro_custo_id uuid REFERENCES centros_custo(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_custos_fixos_centro     ON custos_fixos(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_custos_variaveis_centro ON custos_variaveis(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_centro     ON contas_pagar(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_receitas_centro         ON receitas(centro_custo_id);

-- 2) Cadastro enterprise do centro de custo: endereço, documento, base de rateio
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS tipo_pessoa  text;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS documento    text;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS pais         text DEFAULT 'BR';
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS cep          text;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS endereco     text;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS numero       text;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS complemento  text;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS bairro       text;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS cidade       text;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS uf           text;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS headcount    integer;
ALTER TABLE centros_custo ADD COLUMN IF NOT EXISTS area_m2      numeric;

-- 3) Regras de rateio — divide UM lançamento existente (de origem_tabela/origem_id)
--    entre vários centros por %. Não copia valor, só a fração de cada centro.
CREATE TABLE IF NOT EXISTS centro_custo_rateio (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  origem_tabela   text NOT NULL,   -- 'custos_fixos' | 'custos_variaveis' | 'contas_pagar'
  origem_id       uuid NOT NULL,
  centro_custo_id uuid NOT NULL REFERENCES centros_custo(id) ON DELETE CASCADE,
  percentual      numeric NOT NULL,
  base_tipo       text NOT NULL DEFAULT 'manual', -- 'headcount' | 'area' | 'faturamento' | 'manual'
  descricao       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rateio_origem ON centro_custo_rateio(origem_tabela, origem_id);
CREATE INDEX IF NOT EXISTS idx_rateio_centro ON centro_custo_rateio(centro_custo_id);

ALTER TABLE centro_custo_rateio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rateio_select_own" ON centro_custo_rateio;
CREATE POLICY "rateio_select_own" ON centro_custo_rateio FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rateio_insert_own" ON centro_custo_rateio;
CREATE POLICY "rateio_insert_own" ON centro_custo_rateio FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "rateio_update_own" ON centro_custo_rateio;
CREATE POLICY "rateio_update_own" ON centro_custo_rateio FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rateio_delete_own" ON centro_custo_rateio;
CREATE POLICY "rateio_delete_own" ON centro_custo_rateio FOR DELETE USING (auth.uid() = user_id);

-- 4) Orçamento por centro (histórico simples, não obrigatório usar já na Fase 1)
CREATE TABLE IF NOT EXISTS centro_custo_orcamento (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  centro_custo_id uuid NOT NULL REFERENCES centros_custo(id) ON DELETE CASCADE,
  periodo         text NOT NULL,  -- 'YYYY-MM'
  valor_orcado    numeric NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orcamento_centro_periodo ON centro_custo_orcamento(centro_custo_id, periodo);

ALTER TABLE centro_custo_orcamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orcamento_select_own" ON centro_custo_orcamento;
CREATE POLICY "orcamento_select_own" ON centro_custo_orcamento FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "orcamento_insert_own" ON centro_custo_orcamento;
CREATE POLICY "orcamento_insert_own" ON centro_custo_orcamento FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "orcamento_update_own" ON centro_custo_orcamento;
CREATE POLICY "orcamento_update_own" ON centro_custo_orcamento FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "orcamento_delete_own" ON centro_custo_orcamento;
CREATE POLICY "orcamento_delete_own" ON centro_custo_orcamento FOR DELETE USING (auth.uid() = user_id);

-- 5) Trilha de auditoria do módulo (mesmo padrão do empresa_auditoria)
CREATE TABLE IF NOT EXISTS centro_custo_auditoria (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  centro_custo_id uuid REFERENCES centros_custo(id) ON DELETE SET NULL,
  tabela          text NOT NULL,
  registro_id     uuid,
  acao            text NOT NULL, -- 'criar' | 'editar' | 'excluir'
  campo           text,
  valor_antes     jsonb,
  valor_depois    jsonb,
  descricao       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_centro ON centro_custo_auditoria(centro_custo_id);

ALTER TABLE centro_custo_auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auditoria_select_own" ON centro_custo_auditoria;
CREATE POLICY "auditoria_select_own" ON centro_custo_auditoria FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "auditoria_insert_own" ON centro_custo_auditoria;
CREATE POLICY "auditoria_insert_own" ON centro_custo_auditoria FOR INSERT WITH CHECK (auth.uid() = user_id);
