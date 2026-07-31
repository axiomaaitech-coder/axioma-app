-- ============================================================================
-- AXIOMA — MEI FASE 1: flag de faturamento MEI em `receitas`
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente (ADD COLUMN IF NOT
-- EXISTS) — pode rodar mais de uma vez com segurança.
--
-- Motivo: o Painel MEI soma TODA receita lançada pra calcular o teto de
-- R$ 81.000/ano, sem distinguir o que é faturamento do MEI do que não é.
-- Esta coluna permite marcar/desmarcar cada lançamento — default TRUE, ou
-- seja, nada muda de comportamento até alguém desmarcar um lançamento
-- específico na tela Faturamento MEI.
-- ============================================================================

ALTER TABLE public.receitas
  ADD COLUMN IF NOT EXISTS considera_teto_mei boolean NOT NULL DEFAULT true;

-- Verificação: confirma que a coluna existe e todas as linhas vieram com
-- default true (não deveria haver NULL, já que a coluna nasce NOT NULL).
SELECT count(*) AS total_receitas,
       count(*) FILTER (WHERE considera_teto_mei) AS contam_pro_teto
FROM public.receitas;
