-- AXIOMA AI.TECH — MEI Fase 2, acabamentos (Configurar MEI: CNPJ, Razão Social,
-- CNAE, Pró-labore desejado, Dia de vencimento do DAS). Rodar no Supabase (SQL Editor)
-- antes de testar o modal "Configurar MEI" atualizado. Idempotente (ADD COLUMN IF NOT EXISTS).

ALTER TABLE mei_dados
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS cnae text,
  ADD COLUMN IF NOT EXISTS pro_labore_desejado numeric,
  ADD COLUMN IF NOT EXISTS dia_vencimento_das integer DEFAULT 20;
