-- ============================================================================
-- AXIOMA — MEI Imposto de Renda: Central de Documentos Fiscais (Fase 1).
--
-- ORDEM OBRIGATÓRIA:
--   1. Criar o bucket "documentos-fiscais" no painel do Supabase, PRIVADO
--      (ver passo a passo enviado no chat — "Public bucket" DESLIGADO).
--   2. Só depois, rodar este arquivo inteiro no SQL Editor.
--
-- Idempotente (CREATE ... IF NOT EXISTS / DROP POLICY IF EXISTS antes de
-- recriar) — pode rodar mais de uma vez com segurança.
--
-- SEGURANÇA — fail-safe por padrão: o Supabase Storage nega TODO acesso a um
-- bucket com RLS ativo (todo bucket tem RLS ativo por padrão) até existir uma
-- política que libere explicitamente. Ou seja: entre criar o bucket privado
-- e rodar este SQL, ninguém — nem o dono — consegue subir, ver ou apagar
-- nenhum arquivo. É o comportamento correto pra documento fiscal sensível.
-- ============================================================================

-- 1) TABELA DE METADADOS ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.documentos_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ano int NOT NULL,
  tipo text NOT NULL DEFAULT 'outro', -- comprovante_despesa | recibo | informe_rendimento | nota_fiscal | das_pago | outro
  descricao text,
  nome_arquivo text NOT NULL,
  path_storage text NOT NULL, -- "empresaId/ano/timestamp-arquivo.ext" no bucket documentos-fiscais
  tamanho_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice composto (empresa_id, ano) — cobre o filtro de posse E o
-- agrupamento por ano que a tela usa (Regra 2, seção 9 do STATUS-AXIOMA).
CREATE INDEX IF NOT EXISTS idx_documentos_fiscais_empresa_ano
  ON public.documentos_fiscais (empresa_id, ano);

ALTER TABLE public.documentos_fiscais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documentos_fiscais_empresa ON public.documentos_fiscais;
CREATE POLICY documentos_fiscais_empresa ON public.documentos_fiscais
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT public.empresas_do_usuario()))
  WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));

-- 2) POLICIES DO STORAGE (bucket documentos-fiscais) ------------------------
-- Todo arquivo é salvo em "empresaId/ano/arquivo" — o primeiro pedaço do
-- path (storage.foldername) precisa ser uma das empresas do usuário logado.
-- 3 policies (select/insert/delete) — não existe update de arquivo, edição
-- de tipo/descrição mexe só na tabela de metadados acima, nunca no storage.

DROP POLICY IF EXISTS documentos_fiscais_storage_select ON storage.objects;
CREATE POLICY documentos_fiscais_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos-fiscais'
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.empresas_do_usuario())
  );

DROP POLICY IF EXISTS documentos_fiscais_storage_insert ON storage.objects;
CREATE POLICY documentos_fiscais_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documentos-fiscais'
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.empresas_do_usuario())
  );

DROP POLICY IF EXISTS documentos_fiscais_storage_delete ON storage.objects;
CREATE POLICY documentos_fiscais_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documentos-fiscais'
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.empresas_do_usuario())
  );

-- 3) VERIFICAÇÃO (só leitura) ------------------------------------------------

SELECT tablename, policyname FROM pg_policies WHERE tablename = 'documentos_fiscais';

SELECT policyname FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'documentos_fiscais%';
