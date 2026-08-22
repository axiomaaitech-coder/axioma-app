-- ============================================================================
-- AXIOMA — PDV Fase 3, Etapa 4: impressão térmica ESC/POS via QZ Tray
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente (ADD COLUMN IF NOT
-- EXISTS). Complementa PDV-FASE3-ETAPA3-IMPRESSAO-CUPOM-SQL.sql (rodar
-- aquele primeiro se ainda não rodou) — não mexe em finalizar_venda nem em
-- nenhuma outra função/tabela, só mais 1 coluna de configuração.
-- ============================================================================

BEGIN;

-- Nome da impressora térmica selecionada (como o QZ Tray a enxerga no SO do
-- caixa) — cada empresa escolhe a sua na tela de configuração do PDV. NULL =
-- nenhuma escolhida ainda (cai no cupom HTML via window.print()).
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS pdv_impressora_termica text;

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO (rodar depois do COMMIT)
-- ============================================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'empresas'
--   AND column_name = 'pdv_impressora_termica';

-- ============================================================================
-- ROLLBACK (só se precisar desfazer)
-- ============================================================================
-- ALTER TABLE public.empresas DROP COLUMN IF EXISTS pdv_impressora_termica;
