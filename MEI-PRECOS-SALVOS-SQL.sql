-- ============================================================================
-- AXIOMA — MEI Precificação: "Meus Preços Salvos".
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente (CREATE TABLE/INDEX/
-- POLICY IF NOT EXISTS) — pode rodar mais de uma vez com segurança.
--
-- Tabela nova, sem relação com nenhuma tabela existente. Guarda o snapshot de
-- um cálculo de precificação MEI (inputs + resultado) pra o usuário reabrir,
-- editar ou excluir depois — nunca é lida pela Análise Axioma (IA), só pela
-- própria tela de Precificação MEI.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mei_precos_salvos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  modo text NOT NULL, -- 'hora' | 'projeto' | 'produto'
  dados jsonb NOT NULL, -- inputs + resultado do cálculo no momento de salvar
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice composto (empresa_id, updated_at) — cobre tanto o filtro de posse
-- quanto a ordenação "mais recente primeiro" que a tela usa pra listar.
CREATE INDEX IF NOT EXISTS idx_mei_precos_salvos_empresa
  ON public.mei_precos_salvos (empresa_id, updated_at DESC);

ALTER TABLE public.mei_precos_salvos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mei_precos_salvos_empresa ON public.mei_precos_salvos;
CREATE POLICY mei_precos_salvos_empresa ON public.mei_precos_salvos
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT public.empresas_do_usuario()))
  WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));

-- Verificação: confirma que a tabela existe e a política foi criada.
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'mei_precos_salvos';
