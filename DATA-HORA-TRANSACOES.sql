-- 🦅 AXIOMA — Coluna opcional data_hora (preserva hora do extrato quando existir)
-- Decidido com Elias em 2026-07-24. Rodar UMA VEZ no SQL Editor do Supabase.
-- Transação única (BEGIN/COMMIT) — se algo falhar no meio, nada fica pela metade.
-- Idempotente (IF NOT EXISTS) — pode rodar de novo sem quebrar nada.
--
-- NÃO converte a coluna de data existente (isso quebraria toda leitura do tipo
-- new Date(x.data + "T00:00:00") espalhada pelo app). Adiciona uma coluna NOVA,
-- opcional, do lado da coluna de data atual — que continua exatamente como
-- está. Lançamento manual e registro antigo ficam com data_hora vazia e
-- continuam funcionando 100% como hoje.

BEGIN;

ALTER TABLE public.fluxo_caixa ADD COLUMN IF NOT EXISTS data_hora timestamptz;
ALTER TABLE public.receitas ADD COLUMN IF NOT EXISTS data_hora timestamptz;
ALTER TABLE public.custos_variaveis ADD COLUMN IF NOT EXISTS data_hora timestamptz;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS data_hora timestamptz;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS data_hora timestamptz;

COMMIT;

-- ============================================================================
-- SOBRE ÍNDICE — decisão consciente de NÃO criar um novo
-- ============================================================================
-- A detecção de duplicata não filtra por data_hora (não faz WHERE data_hora =
-- ...) — ela filtra por empresa_id + valor + a coluna de data já existente
-- (que já tem índice composto (empresa_id, data) desde a migração
-- multi-tenant de 2026-07-23), e só LÊ data_hora depois, no pequeno grupo de
-- candidatos já filtrado, pra decidir se são a mesma transação ou duas
-- diferentes. Um índice em (empresa_id, data_hora) não aceleraria essa
-- consulta — só ocuparia espaço à toa. Não criado.

-- ============================================================================
-- VALIDAÇÃO (só leitura, rode depois do COMMIT acima pra conferir)
-- ============================================================================
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('fluxo_caixa', 'receitas', 'custos_variaveis', 'contas_pagar', 'contas_receber')
  AND column_name = 'data_hora'
ORDER BY table_name;
