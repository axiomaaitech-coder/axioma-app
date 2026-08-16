-- ============================================================================
-- AXIOMA — PDV Fase 3, Etapa 2: função finalizar_venda() + rastreio de baixa
-- de estoque na venda. NÃO RODAR AINDA — arquivo pra revisão do Elias antes
-- de aplicar.
--
-- Pré-requisito: PDV-FASE3-ETAPA1-VENDAS-SQL.sql já aplicado e confirmado
-- (2026-08-16) — tabelas caixa/turno_caixa/venda/item_venda no ar, política
-- multi-tenant plena (operador incluso), trigger de total ativo.
--
-- PLANO APROVADO PELO ELIAS PRA ESTA ETAPA:
--   Sub-etapa 2 (Finalizar Venda): RPC SECURITY DEFINER, transação atômica,
--   custo lido e congelado SERVER-SIDE (nunca passa pelo navegador do
--   operador), devolve só venda_id + valor_total.
--   Sub-etapa 3 (baixa de estoque, código de app numa etapa seguinte,
--   NÃO neste SQL): reaproveita criarMovimentacao() já existente em
--   lib/estoqueHelpers.ts — sem duplicar lógica de baixa/lote/FEFO em SQL.
--   Reforço obrigatório pra essa sub-etapa não perder venda com baixa
--   incompleta: a coluna estoque_baixado (item 2 abaixo), que este arquivo
--   já entrega agora pra não vir depois como migração separada.
--
-- O QUE FAZ:
--   1) finalizar_venda(turno_caixa_id, itens, forma_pagamento, desconto_total,
--      cliente_id, cpf_nota) — grava venda + todos os item_venda numa ÚNICA
--      transação (tudo ou nada, o Postgres garante isso sozinho, não é
--      "checar erro depois de cada insert"). Preço de venda E custo são
--      lidos de public.produtos DENTRO da função (SECURITY DEFINER, mesmo
--      mecanismo de vw_produtos_seguro/meu_papel já documentado em
--      PDV-FASE0-EQUIPE-OPERADOR-SQL.sql) — o client nunca informa nem o
--      preço nem o custo, só produto_id + quantidade, então não tem como o
--      operador manipular preço no meio de uma venda nem enxergar custo em
--      nenhum momento da chamada.
--   2) venda.estoque_baixado — 'pendente' | 'parcial' | 'concluido', default
--      'pendente'. A venda nasce sempre 'pendente' (finalizar_venda não mexe
--      nisso, baixa de estoque é etapa seguinte, fora deste SQL). O código
--      de app da Etapa 3 atualiza este campo depois de tentar a baixa de
--      cada item — 'concluido' se todos baixaram, 'parcial' se só alguns,
--      continua 'pendente' se nenhum. Isso é o que garante que uma venda com
--      baixa incompleta NUNCA se perde: fica consultável no banco mesmo que
--      o operador feche a tela sem clicar "tentar novamente" — é dado
--      persistido, não estado que só existe na memória do navegador.
--
-- DECISÃO DE SEGURANÇA — por que o client nunca envia preco_unitario: se a
-- função aceitasse preço vindo do client, um operador malicioso (ou um bug
-- de tela) poderia enviar qualquer valor, inclusive R$ 0,01 pra um produto
-- caro. A função sempre lê produtos.preco_venda no momento da venda — é a
-- ÚNICA fonte de verdade pro preço, igual ao custo. Desconto por ITEM não
-- existe nesta etapa (só desconto_total, no cabeçalho da venda, decisão já
-- existente desde a Etapa 1) — se um dia precisar de desconto por item, é
-- decisão nova, não decidida sozinha aqui.
--
-- POR QUE NÃO DUPLICAR A BAIXA DE ESTOQUE AQUI DENTRO (decisão do Elias):
-- dava pra fazer a baixa de estoque_movimentacoes também dentro desta mesma
-- função, ganhando atomicidade total (venda + estoque juntos, tudo ou nada).
-- Foi decidido que NÃO — reescrever a lógica de baixa em PL/pgSQL duplicaria
-- fonte única de verdade (criarMovimentacao/obterOuCriarLote/FEFO já
-- existem e são mantidos só em TypeScript). O preço pago por essa escolha é
-- a janela entre "venda gravada" e "estoque baixado" — coberta pela coluna
-- estoque_baixado acima, não pela transação do banco.
--
-- Idempotente (CREATE OR REPLACE na função, ADD COLUMN IF NOT EXISTS na
-- coluna). Transação única.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1) venda.estoque_baixado — rastreio persistente da baixa de estoque
-- ============================================================================
ALTER TABLE public.venda
  ADD COLUMN IF NOT EXISTS estoque_baixado text NOT NULL DEFAULT 'pendente'
  CHECK (estoque_baixado IN ('pendente', 'parcial', 'concluido'));

-- Suporte direto pra uma tela futura de "vendas com baixa pendente" (a
-- própria Etapa 3 de app vai precisar listar isso pro botão "tentar
-- novamente" funcionar depois que o operador sair da tela e voltar depois).
-- Parcial — só indexa o que ainda precisa de atenção, não a tabela toda.
CREATE INDEX IF NOT EXISTS idx_venda_estoque_baixado_pendente
  ON public.venda(empresa_id, criado_em)
  WHERE estoque_baixado <> 'concluido';

-- ============================================================================
-- 2) finalizar_venda() — grava venda + item_venda numa transação atômica
-- ============================================================================
CREATE OR REPLACE FUNCTION public.finalizar_venda(
  p_turno_caixa_id uuid,
  -- cada elemento: {"produto_id": "<uuid>", "quantidade": <number>} — NUNCA
  -- preço nem custo, ver "DECISÃO DE SEGURANÇA" no cabeçalho.
  p_itens jsonb,
  p_forma_pagamento text DEFAULT NULL,
  p_desconto_total numeric DEFAULT 0,
  p_cliente_id uuid DEFAULT NULL,
  p_cpf_nota text DEFAULT NULL
)
RETURNS TABLE (venda_id uuid, valor_total numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_venda_id uuid;
  v_item jsonb;
  v_produto_id uuid;
  v_quantidade numeric;
  v_preco_venda numeric;
  v_preco_custo numeric;
BEGIN
  -- SECURITY DEFINER ignora RLS — a checagem de que o turno pertence a uma
  -- empresa do usuário que chamou é feita AQUI, manualmente, exatamente como
  -- listar_equipe() já faz pra meu_papel() em PDV-FASE0-EQUIPE-OPERADOR-SQL.sql.
  -- Sem isso, qualquer usuário autenticado poderia gravar venda em turno de
  -- OUTRA empresa só adivinhando o uuid.
  SELECT empresa_id INTO v_empresa_id
  FROM turno_caixa
  WHERE id = p_turno_caixa_id
    AND status = 'aberto'
    AND empresa_id IN (SELECT public.empresas_do_usuario());

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Turno de caixa não encontrado ou não está aberto' USING errcode = 'AX009';
  END IF;

  IF p_itens IS NULL OR jsonb_typeof(p_itens) <> 'array' OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'A venda precisa ter ao menos um item' USING errcode = 'AX010';
  END IF;

  IF p_cpf_nota IS NOT NULL AND p_cpf_nota !~ '^[0-9]{11}$' THEN
    RAISE EXCEPTION 'CPF da nota inválido' USING errcode = 'AX011';
  END IF;

  -- cliente_id, se informado, também precisa ser da mesma empresa — mesma
  -- lógica de não confiar em uuid vindo do client sem checar posse.
  IF p_cliente_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM clientes WHERE id = p_cliente_id AND empresa_id = v_empresa_id
  ) THEN
    RAISE EXCEPTION 'Cliente não encontrado nesta empresa' USING errcode = 'AX012';
  END IF;

  INSERT INTO venda (empresa_id, turno_caixa_id, vendedor_id, cliente_id, cpf_nota, status, forma_pagamento, desconto_total, finalizada_em)
  VALUES (v_empresa_id, p_turno_caixa_id, auth.uid(), p_cliente_id, p_cpf_nota, 'finalizada', p_forma_pagamento, COALESCE(p_desconto_total, 0), now())
  RETURNING id INTO v_venda_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_produto_id := NULLIF(v_item->>'produto_id', '')::uuid;
    v_quantidade := NULLIF(v_item->>'quantidade', '')::numeric;

    IF v_produto_id IS NULL OR v_quantidade IS NULL OR v_quantidade <= 0 THEN
      RAISE EXCEPTION 'Item de venda inválido (produto ou quantidade ausente)' USING errcode = 'AX013';
    END IF;

    -- Única fonte de verdade pro preço E pro custo — nunca o que veio do
    -- client. Filtra por empresa_id de propósito: garante que o produto é
    -- desta empresa mesmo que alguém tente passar um produto_id de outra.
    SELECT preco_venda, preco_custo INTO v_preco_venda, v_preco_custo
    FROM produtos
    WHERE id = v_produto_id AND empresa_id = v_empresa_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto não encontrado nesta empresa' USING errcode = 'AX014';
    END IF;
    IF v_preco_venda IS NULL THEN
      RAISE EXCEPTION 'Produto sem preço de venda definido' USING errcode = 'AX015';
    END IF;

    INSERT INTO item_venda (empresa_id, venda_id, produto_id, quantidade, preco_unitario_venda, custo_unitario_na_venda)
    VALUES (v_empresa_id, v_venda_id, v_produto_id, v_quantidade, v_preco_venda, v_preco_custo);
    -- trigger trg_item_venda_recalcular (Etapa 1) atualiza venda.valor_total
    -- sozinho a cada INSERT — não recalculado aqui de propósito, mesma regra
    -- de "nunca soma manual" já vale pro total.
  END LOOP;

  RETURN QUERY SELECT v.id, v.valor_total FROM venda v WHERE v.id = v_venda_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalizar_venda(uuid, jsonb, text, numeric, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.finalizar_venda(uuid, jsonb, text, numeric, uuid, text) TO authenticated;

-- ============================================================================
-- Verificação (só leitura) — confirma que a função e a coluna existem.
-- ============================================================================
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'finalizar_venda';
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'venda' AND column_name = 'estoque_baixado';

COMMIT;


-- ============================================================================
-- ROLLBACK — SÓ RODAR SE ALGO QUEBRAR DEPOIS DE APLICAR O BLOCO ACIMA.
-- ATENÇÃO: dropar estoque_baixado apaga o rastreio de baixa de vendas já
-- finalizadas nesse meio-tempo — só descomente essa linha se tiver certeza
-- de que nenhuma venda real foi gravada usando esta etapa ainda.
-- Descomente e rode como bloco único.
-- ============================================================================
-- BEGIN;
--
-- DROP FUNCTION IF EXISTS public.finalizar_venda(uuid, jsonb, text, numeric, uuid, text);
-- DROP INDEX IF EXISTS idx_venda_estoque_baixado_pendente;
-- -- ALTER TABLE public.venda DROP COLUMN IF EXISTS estoque_baixado;
--
-- COMMIT;
-- ============================================================================
