-- 🦅 AXIOMA — Importar Documentos, Fase 1 (fila de exceções, timeline, motor de aprendizado)
-- Decidido com Elias em 2026-07-24. Rodar UMA VEZ no SQL Editor do Supabase.
-- Transação única (BEGIN/COMMIT) — se algo falhar no meio, nada fica pela metade.
-- Idempotente (IF NOT EXISTS em tudo) — pode rodar de novo sem quebrar nada.
--
-- As 3 tabelas já nascem no padrão multi-tenant definitivo (decidido 2026-07-23):
--   - empresa_id NOT NULL desde a criação (dono do dado é a empresa, não o usuário)
--   - RLS via empresas_do_usuario() (mesma função da migração multi-tenant, já existe no banco)
--   - índice composto (empresa_id, coluna-de-data) + índice em toda FK

BEGIN;

-- ============================================================================
-- 1) importacao_timeline — histórico de eventos de cada importação
--    (criada, revisada, linha editada/excluída, revertida, exceção aberta/resolvida)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.importacao_timeline (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  user_id uuid not null,
  importacao_id uuid not null references public.importacoes(id) on delete cascade,
  evento text not null,
  descricao text,
  dados jsonb,
  created_at timestamptz not null default now()
);

ALTER TABLE public.importacao_timeline ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'importacao_timeline'
  ) THEN
    CREATE POLICY importacao_timeline_multi_tenant ON public.importacao_timeline
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_importacao_timeline_empresa_data ON public.importacao_timeline(empresa_id, created_at);
CREATE INDEX IF NOT EXISTS idx_importacao_timeline_importacao ON public.importacao_timeline(importacao_id);

-- ============================================================================
-- 2) importacao_excecoes — fila do que o sistema não decidiu sozinho
--    (linha com formato inválido, parser recusou, incoerência de layout Reforma)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.importacao_excecoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  user_id uuid not null,
  importacao_id uuid not null references public.importacoes(id) on delete cascade,
  linha_numero int,
  tipo text not null,
  motivo text not null,
  dados_originais jsonb,
  status text not null default 'pendente',
  resolucao text,
  resolvido_em timestamptz,
  created_at timestamptz not null default now()
);

ALTER TABLE public.importacao_excecoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'importacao_excecoes'
  ) THEN
    CREATE POLICY importacao_excecoes_multi_tenant ON public.importacao_excecoes
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_importacao_excecoes_empresa_data ON public.importacao_excecoes(empresa_id, created_at);
CREATE INDEX IF NOT EXISTS idx_importacao_excecoes_importacao ON public.importacao_excecoes(importacao_id);
CREATE INDEX IF NOT EXISTS idx_importacao_excecoes_status ON public.importacao_excecoes(empresa_id, status);

-- ============================================================================
-- 3) importacao_padroes_classificacao — motor de aprendizado: lembra como uma
--    descrição parecida já foi classificada antes, pra SUGERIR (nunca decidir
--    sozinho) da próxima vez.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.importacao_padroes_classificacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  padrao_chave text not null,
  destino_tabela text not null,
  categoria text,
  ocorrencias int not null default 1,
  ultima_vez_usado timestamptz not null default now(),
  created_at timestamptz not null default now()
);

ALTER TABLE public.importacao_padroes_classificacao ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'importacao_padroes_classificacao'
  ) THEN
    CREATE POLICY importacao_padroes_multi_tenant ON public.importacao_padroes_classificacao
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_importacao_padroes_unico ON public.importacao_padroes_classificacao(empresa_id, padrao_chave, destino_tabela);
CREATE INDEX IF NOT EXISTS idx_importacao_padroes_empresa_uso ON public.importacao_padroes_classificacao(empresa_id, ultima_vez_usado);

COMMIT;

-- ============================================================================
-- VALIDAÇÃO (só leitura, rode depois do COMMIT acima pra conferir)
-- ============================================================================
SELECT 'tabelas criadas' AS checagem, tablename FROM pg_tables
  WHERE schemaname = 'public' AND tablename IN ('importacao_timeline', 'importacao_excecoes', 'importacao_padroes_classificacao');

SELECT 'políticas RLS' AS checagem, tablename, policyname FROM pg_policies
  WHERE schemaname = 'public' AND tablename IN ('importacao_timeline', 'importacao_excecoes', 'importacao_padroes_classificacao');

SELECT 'índices' AS checagem, tablename, indexname FROM pg_indexes
  WHERE schemaname = 'public' AND tablename IN ('importacao_timeline', 'importacao_excecoes', 'importacao_padroes_classificacao');
