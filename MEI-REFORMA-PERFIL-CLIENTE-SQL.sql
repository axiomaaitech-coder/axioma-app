-- AXIOMA AI.TECH — MEI Reforma Tributária: perfil de cliente do MEI.
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente (ADD COLUMN IF NOT
-- EXISTS) — pode rodar mais de uma vez com segurança.
--
-- Motivo: a Reforma Tributária afeta o MEI de forma OPOSTA dependendo de
-- quem ele atende — cliente PJ (B2B) se importa com crédito de IBS/CBS,
-- cliente pessoa física (B2C) não. Sem essa coluna a tela não sabe qual
-- dos dois casos mostrar. Nullable — MEI que nunca configurou vê os dois
-- lados, sem suposição.

ALTER TABLE mei_dados
  ADD COLUMN IF NOT EXISTS perfil_cliente text;

-- Valores esperados pelo código (não é CHECK constraint de propósito — mesma
-- lição já registrada no projeto: constraint rígida demais quebra silenciosamente
-- se o app mandar um valor novo antes do banco ser atualizado):
--   'b2b'   → clientes majoritariamente empresas (emitem nota, usam crédito)
--   'b2c'   → clientes majoritariamente pessoa física (consumidor final)
--   'ambos' → mistura relevante dos dois
--   null    → não configurado ainda (tela mostra os dois lados)
