-- ============================================================================
-- AXIOMA — PDV Fase 2.1: importação de XML de NF-e
-- Duas peças, cada uma resolvendo um problema diferente:
--   1) estoque_nfe_importadas — anti-duplicidade pela CHAVE DE ACESSO real da
--      NF-e (44 dígitos, validada pela SEFAZ). Tabela NOVA, separada de
--      `importacoes` (Importar Documentos) de propósito: "essa nota já virou
--      lançamento financeiro?" (importacoes) e "essa nota já alimentou o
--      estoque?" (esta tabela) são perguntas diferentes — uma nota legítima
--      pode responder SIM pras duas ao mesmo tempo, sem ser duplicata de nada.
--   2) fornecedor_produtos ganha 2 colunas — produto_id e codigo_fornecedor —
--      pra guardar "esse fornecedor chama ESTE produto nosso de código X".
--      Aditivo e nullable: a aba "Produtos e Serviços" do módulo Fornecedores
--      continua fazendo select("*") e mostrando só descricao/categoria/
--      valor_unitario/unidade — nunca vai ver as 2 colunas novas, então nada
--      muda pra quem já usa aquela tela hoje.
--
-- Uma terceira peça pequena: produtos_ia_cache (já existe, Fase 2) ganha a
-- coluna sub_nicho — a classificação em LOTE da NF-e sugere nome+categoria+
-- sub-nicho de uma vez, e o cache original (Fase 2, cadastro avulso por EAN)
-- só guardava nome+marca+categoria. Aditivo, nullable — a rota de Fase 2
-- (consulta-ia) nunca escreve nela, continua funcionando igual.
--
-- Idempotente — pode rodar mais de uma vez com segurança.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) estoque_nfe_importadas — trava a mesma NF-e de entrar duas vezes no
--    estoque. chave_acesso é única POR EMPRESA (duas empresas diferentes
--    podem, em teoria, processar a "mesma" nota se uma delas view-only, mas
--    na prática é uma trava por empresa mesmo — cada compra é da empresa que
--    comprou).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.estoque_nfe_importadas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  user_id uuid not null,
  chave_acesso text not null,
  numero_nf text,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  valor_total numeric,
  qtd_itens integer not null default 0,
  created_at timestamptz not null default now()
);

ALTER TABLE public.estoque_nfe_importadas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'estoque_nfe_importadas'
  ) THEN
    CREATE POLICY estoque_nfe_importadas_multi_tenant ON public.estoque_nfe_importadas
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_nfe_importadas_empresa_chave ON public.estoque_nfe_importadas(empresa_id, chave_acesso);
CREATE INDEX IF NOT EXISTS idx_nfe_importadas_empresa_created ON public.estoque_nfe_importadas(empresa_id, created_at);
CREATE INDEX IF NOT EXISTS idx_nfe_importadas_fornecedor ON public.estoque_nfe_importadas(fornecedor_id);

-- ----------------------------------------------------------------------------
-- 2) fornecedor_produtos — vínculo por fornecedor (código dele → nosso produto)
-- ----------------------------------------------------------------------------
ALTER TABLE public.fornecedor_produtos ADD COLUMN IF NOT EXISTS produto_id uuid REFERENCES public.produtos(id) ON DELETE SET NULL;
ALTER TABLE public.fornecedor_produtos ADD COLUMN IF NOT EXISTS codigo_fornecedor text;

-- Um fornecedor não pode ter dois códigos diferentes apontando pro mesmo
-- produto nosso (evitaria "reconhecer sozinho" de forma ambígua) — mas só
-- quando as duas colunas estão preenchidas (linhas antigas, sem vínculo,
-- ficam de fora do índice, WHERE parcial).
CREATE UNIQUE INDEX IF NOT EXISTS uq_fornecedor_produtos_vinculo
  ON public.fornecedor_produtos(fornecedor_id, codigo_fornecedor)
  WHERE codigo_fornecedor IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fornecedor_produtos_produto ON public.fornecedor_produtos(produto_id);

-- ----------------------------------------------------------------------------
-- 3) produtos_ia_cache — sub_nicho (classificação em lote da NF-e)
-- ----------------------------------------------------------------------------
ALTER TABLE public.produtos_ia_cache ADD COLUMN IF NOT EXISTS sub_nicho text;

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO (só leitura, rode depois de aplicar)
-- ============================================================================
-- SELECT count(*) FROM fornecedor_produtos WHERE produto_id IS NOT NULL;
-- esperado: 0 logo após aplicar (nada preenche essas colunas ainda até a
-- primeira importação de XML acontecer) — prova que nenhuma linha existente
-- mudou.

-- ============================================================================
-- ROLLBACK — só rodar se algo quebrar depois de aplicar.
-- ============================================================================
-- BEGIN;
-- DROP TABLE IF EXISTS public.estoque_nfe_importadas;
-- DROP INDEX IF EXISTS public.uq_fornecedor_produtos_vinculo;
-- DROP INDEX IF EXISTS public.idx_fornecedor_produtos_produto;
-- ALTER TABLE public.fornecedor_produtos DROP COLUMN IF EXISTS produto_id;
-- ALTER TABLE public.fornecedor_produtos DROP COLUMN IF EXISTS codigo_fornecedor;
-- ALTER TABLE public.produtos_ia_cache DROP COLUMN IF EXISTS sub_nicho;
-- COMMIT;
