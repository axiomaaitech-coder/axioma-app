-- ============================================================================
-- AXIOMA — MEI FASE 2: % de reserva de emergência configurável (Cofre Inteligente)
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente (ADD COLUMN IF NOT
-- EXISTS) — pode rodar mais de uma vez com segurança.
--
-- Sem esta coluna, o Cofre Inteligente já funciona normalmente — usa o
-- padrão explicado de 10% e avisa isso na tela. Rodar este SQL só habilita
-- o usuário a personalizar esse percentual em "Configurar MEI".
-- ============================================================================

ALTER TABLE public.mei_dados
  ADD COLUMN IF NOT EXISTS reserva_emergencia_pct numeric;
