-- ============================================================================
-- AXIOMA — Caixa 01 automático pra empresa nova (correção definitiva)
-- Bug: o seed de "Caixa 01" em PDV-FASE3-ETAPA1-VENDAS-SQL.sql (linhas 133-
-- 139) só rodou UMA VEZ, pras empresas que já existiam naquele momento.
-- Toda empresa criada DEPOIS (obter_ou_criar_empresa_padrao(), SQL-EMPRESA-
-- PADRAO.sql) nasce sem nenhuma linha em public.caixa — a Frente de Caixa
-- (/pdv/venda) então mostra "Nenhum caixa cadastrado nesta empresa".
--
-- CORREÇÃO: trigger AFTER INSERT em public.empresas cria "Caixa 01" pra
-- QUALQUER empresa nova, não importa por onde ela foi inserida (a função
-- obter_ou_criar_empresa_padrao() de hoje, cadastro manual, ou qualquer
-- caminho futuro) — mais robusto que checar/criar na tela do PDV, que só
-- cobriria esse um ponto de entrada.
--
-- SECURITY DEFINER: o INSERT em empresas acontece dentro de uma função
-- SECURITY DEFINER (obter_ou_criar_empresa_padrao()), ANTES do vínculo em
-- empresa_usuarios ser gravado nessa mesma transação — o trigger também
-- precisa rodar com privilégio elevado pra não esbarrar na política de RLS
-- de public.caixa (mesmo padrão já usado nas funções de
-- SQL-EMPRESA-PADRAO.sql e MIGRACAO-MULTITENANT.sql).
--
-- Rodar UMA VEZ no SQL Editor do Supabase. Depois disso, nenhuma empresa
-- nova depende de seed manual — o backfill abaixo também cobre qualquer
-- empresa que já ficou sem caixa entre o seed antigo e este trigger.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_empresa_criar_caixa_padrao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.caixa (empresa_id, nome)
  VALUES (NEW.id, 'Caixa 01')
  ON CONFLICT (empresa_id, nome) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_empresa_criar_caixa_padrao ON public.empresas;
CREATE TRIGGER trg_empresa_criar_caixa_padrao
AFTER INSERT ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.fn_empresa_criar_caixa_padrao();

-- Backfill — mesma lógica do seed original, idempotente: só cria "Caixa 01"
-- pra empresa que hoje não tem NENHUM caixa (não mexe em quem já tem).
INSERT INTO public.caixa (empresa_id, nome)
SELECT e.id, 'Caixa 01'
FROM public.empresas e
WHERE NOT EXISTS (SELECT 1 FROM public.caixa c WHERE c.empresa_id = e.id);

COMMIT;

-- ============================================================================
-- Verificação (só leitura) — confirma que o trigger existe e que nenhuma
-- empresa ficou sem caixa.
-- ============================================================================
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trg_empresa_criar_caixa_padrao';
--
-- SELECT e.id, e.nome
-- FROM public.empresas e
-- WHERE NOT EXISTS (SELECT 1 FROM public.caixa c WHERE c.empresa_id = e.id);
