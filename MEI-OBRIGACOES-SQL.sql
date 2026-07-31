-- ============================================================================
-- AXIOMA — MEI FASE 1: Central de Obrigações (reaproveita mei_obrigacoes e
-- mei_declaracoes, órfãs até esta fase — nunca lidas por nenhum código antes).
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente (ADD COLUMN IF NOT
-- EXISTS / índice IF NOT EXISTS) — pode rodar mais de uma vez com segurança.
--
-- Contexto: `empresa_id` e a política RLS (empresa_id IN empresas_do_usuario())
-- dessas 2 tabelas já foram criados no MIGRACAO-MULTITENANT.sql. Este arquivo
-- só adiciona as colunas de domínio que a tela DAS & Obrigações precisa pra
-- gravar de verdade (hoje o status vive só em useState e some ao recarregar).
-- ============================================================================

-- mei_obrigacoes: status atual de cada obrigação (DAS mensal, DASN anual,
-- IRPF anual). 1 linha por (empresa_id, tipo, competencia).
ALTER TABLE public.mei_obrigacoes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'DAS',
  ADD COLUMN IF NOT EXISTS competencia text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pendente',
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS data_entrega date,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Índice único: garante 1 status por empresa+tipo+competência e é o que o
-- upsert (onConflict: 'empresa_id,tipo,competencia') de lib/meiHelpers.ts usa.
CREATE UNIQUE INDEX IF NOT EXISTS idx_mei_obrigacoes_unico
  ON public.mei_obrigacoes (empresa_id, tipo, competencia);

-- mei_declaracoes: histórico permanente de DASN entregues (nunca editado
-- depois — é o "carimbo" de que aquela declaração foi feita naquele dia).
ALTER TABLE public.mei_declaracoes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS competencia text,
  ADD COLUMN IF NOT EXISTS data_entrega date,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Verificação: confirma que nenhuma linha ficou sem empresa_id nas 2 tabelas.
SELECT 'mei_obrigacoes' AS tabela, count(*) FILTER (WHERE empresa_id IS NULL) AS sem_empresa FROM public.mei_obrigacoes
UNION ALL
SELECT 'mei_declaracoes', count(*) FILTER (WHERE empresa_id IS NULL) FROM public.mei_declaracoes;
