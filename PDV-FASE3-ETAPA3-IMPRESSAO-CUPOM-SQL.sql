-- ============================================================================
-- AXIOMA — PDV Fase 3, Etapa 3: impressão automática de cupom não-fiscal
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente (ADD COLUMN IF NOT
-- EXISTS). Não mexe em finalizar_venda nem em nenhuma outra função/tabela —
-- só 2 colunas novas de configuração em public.empresas.
-- ============================================================================

BEGIN;

-- "Imprimir automaticamente ao finalizar" — ligado por padrão (true), por
-- empresa (cada terminal/caixa da mesma empresa usa a mesma config). RLS de
-- empresas já existente (FIX-POLITICA-EMPRESAS-SQL.sql) restringe quem pode
-- fazer UPDATE nesta linha a "dono" — nenhuma policy nova necessária aqui.
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS pdv_impressao_automatica boolean NOT NULL DEFAULT true;

-- Mensagem de rodapé livre do cupom (ex: "Volte sempre!", política de troca).
-- NULL = sem rodapé.
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS pdv_cupom_rodape text;

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO (rodar depois do COMMIT)
-- ============================================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'empresas'
--   AND column_name IN ('pdv_impressao_automatica', 'pdv_cupom_rodape');

-- ============================================================================
-- ROLLBACK (só se precisar desfazer)
-- ============================================================================
-- ALTER TABLE public.empresas DROP COLUMN IF EXISTS pdv_impressao_automatica;
-- ALTER TABLE public.empresas DROP COLUMN IF EXISTS pdv_cupom_rodape;
