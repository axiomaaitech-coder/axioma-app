-- ============================================================================
-- AXIOMA — Contas a Pagar > Histórico: lápis (observação) + lixeira de 30 dias
-- Pedido do Elias (2026-10-01). Rodar UMA VEZ no SQL Editor do Supabase.
-- Idempotente — pode rodar mais de uma vez. Não apaga nem altera nenhum dado.
--
-- O QUE FAZ:
--   1) 6 colunas em contas_pagar_auditoria: quem/quando/por que mandou pra
--      lixeira + observação do lápis (o registro em si nunca muda).
--   2) SEGURANÇA: a regra antiga deixava QUALQUER membro da equipe apagar ou
--      alterar o histórico direto pelo navegador. Agora: membro só LÊ; gravar
--      continua só pelo gatilho/funções do sistema; lixeira só pelo dono.
--   3) 3 funções: ap_auditoria_excluir (só dono, motivo obrigatório),
--      ap_auditoria_restaurar (só dono, dentro dos 30 dias),
--      ap_auditoria_anotar (qualquer membro da empresa — lápis).
--   A exclusão definitiva depois de 30 dias roda na limpeza diária que já
--   existe (lib/nexusAuditoria.ts limparDadosVencidos).
-- ============================================================================

ALTER TABLE public.contas_pagar_auditoria
  ADD COLUMN IF NOT EXISTS excluido_em timestamptz,
  ADD COLUMN IF NOT EXISTS excluido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS motivo_exclusao text,
  ADD COLUMN IF NOT EXISTS observacao text,
  ADD COLUMN IF NOT EXISTS observacao_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS observacao_em timestamptz;

CREATE INDEX IF NOT EXISTS idx_contas_pagar_auditoria_lixeira
  ON public.contas_pagar_auditoria (excluido_em) WHERE excluido_em IS NOT NULL;

-- 2) Segurança: só leitura pelo navegador.
DROP POLICY IF EXISTS contas_pagar_auditoria_empresa ON public.contas_pagar_auditoria;
DROP POLICY IF EXISTS contas_pagar_auditoria_leitura ON public.contas_pagar_auditoria;
CREATE POLICY contas_pagar_auditoria_leitura ON public.contas_pagar_auditoria
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT public.empresas_do_usuario()));

-- 3a) Mandar pra lixeira (só dono)
CREATE OR REPLACE FUNCTION public.ap_auditoria_excluir(p_id uuid, p_motivo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  IF length(trim(coalesce(p_motivo, ''))) < 5 THEN
    RAISE EXCEPTION 'Informe o motivo da exclusão (mínimo 5 letras)';
  END IF;
  SELECT empresa_id INTO v_empresa_id FROM public.contas_pagar_auditoria WHERE id = p_id AND excluido_em IS NULL;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Registro não encontrado ou já está na lixeira';
  END IF;
  IF public.meu_papel(v_empresa_id) <> 'dono' THEN
    RAISE EXCEPTION 'Só o proprietário pode excluir registros do histórico';
  END IF;
  UPDATE public.contas_pagar_auditoria
  SET excluido_em = now(), excluido_por = auth.uid(), motivo_exclusao = trim(p_motivo)
  WHERE id = p_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ap_auditoria_excluir(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.ap_auditoria_excluir(uuid, text) TO authenticated;

-- 3b) Restaurar (só dono, dentro dos 30 dias)
CREATE OR REPLACE FUNCTION public.ap_auditoria_restaurar(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  SELECT empresa_id INTO v_empresa_id FROM public.contas_pagar_auditoria
  WHERE id = p_id AND excluido_em IS NOT NULL AND excluido_em > now() - interval '30 days';
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Registro não está na lixeira ou o prazo de 30 dias já passou';
  END IF;
  IF public.meu_papel(v_empresa_id) <> 'dono' THEN
    RAISE EXCEPTION 'Só o proprietário pode restaurar registros do histórico';
  END IF;
  UPDATE public.contas_pagar_auditoria
  SET excluido_em = NULL, excluido_por = NULL, motivo_exclusao = NULL
  WHERE id = p_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ap_auditoria_restaurar(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.ap_auditoria_restaurar(uuid) TO authenticated;

-- 3c) Lápis: observação no registro (qualquer membro da empresa; vazio apaga a observação)
CREATE OR REPLACE FUNCTION public.ap_auditoria_anotar(p_id uuid, p_observacao text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  SELECT empresa_id INTO v_empresa_id FROM public.contas_pagar_auditoria WHERE id = p_id AND excluido_em IS NULL;
  IF v_empresa_id IS NULL OR v_empresa_id NOT IN (SELECT public.empresas_do_usuario()) THEN
    RAISE EXCEPTION 'Registro não encontrado';
  END IF;
  UPDATE public.contas_pagar_auditoria
  SET observacao = NULLIF(trim(coalesce(p_observacao, '')), ''),
      observacao_por = auth.uid(), observacao_em = now()
  WHERE id = p_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ap_auditoria_anotar(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.ap_auditoria_anotar(uuid, text) TO authenticated;

-- VERIFICAÇÃO (só leitura): 3 funções + 1 regra de leitura
SELECT proname FROM pg_proc WHERE proname IN ('ap_auditoria_excluir', 'ap_auditoria_restaurar', 'ap_auditoria_anotar');
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'contas_pagar_auditoria';
