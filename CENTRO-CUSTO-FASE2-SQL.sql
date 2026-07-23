-- ============================================================================
-- AXIOMA — Centro de Custos Fase 2 (Inteligência Executiva + Automação)
-- Rodar uma única vez no Supabase SQL Editor. Só acrescenta 1 tabela nova
-- (IF NOT EXISTS), nada existente é alterado ou apagado.
-- ============================================================================

-- Planos de ação gerados a partir do Motor de Causa Raiz / Motor de Oportunidades.
-- Nunca executado automaticamente — status começa sempre em 'pendente', só o
-- usuário avança pra 'em_andamento'/'concluido'/'cancelado'.
CREATE TABLE IF NOT EXISTS centro_custo_plano_acao (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL,
  centro_custo_id    uuid REFERENCES centros_custo(id) ON DELETE SET NULL,
  origem_tipo        text NOT NULL DEFAULT 'manual', -- 'causa_raiz' | 'oportunidade' | 'manual'
  origem_id          text,            -- id do item de causa raiz/oportunidade que originou o plano (não é uuid, é composto)
  titulo             text NOT NULL,
  objetivo           text,
  tarefas             jsonb,           -- array de strings
  responsavel        text,
  prazo              date,
  impacto_esperado   text,
  economia_estimada  numeric,
  status             text NOT NULL DEFAULT 'pendente', -- 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plano_acao_centro  ON centro_custo_plano_acao(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_plano_acao_status  ON centro_custo_plano_acao(status);

ALTER TABLE centro_custo_plano_acao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plano_acao_select_own" ON centro_custo_plano_acao;
CREATE POLICY "plano_acao_select_own" ON centro_custo_plano_acao FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "plano_acao_insert_own" ON centro_custo_plano_acao;
CREATE POLICY "plano_acao_insert_own" ON centro_custo_plano_acao FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "plano_acao_update_own" ON centro_custo_plano_acao;
CREATE POLICY "plano_acao_update_own" ON centro_custo_plano_acao FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "plano_acao_delete_own" ON centro_custo_plano_acao;
CREATE POLICY "plano_acao_delete_own" ON centro_custo_plano_acao FOR DELETE USING (auth.uid() = user_id);
