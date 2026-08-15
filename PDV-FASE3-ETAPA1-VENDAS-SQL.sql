-- ============================================================================
-- AXIOMA — PDV Fase 3, Etapa 1: tabelas de venda (turno de caixa + venda +
-- itens). NÃO RODAR AINDA — arquivo pra revisão do Elias antes de aplicar.
--
-- Pré-requisito: PDV-FASE3-ETAPA0-OPERADOR-PRODUTOS-SQL.sql já aplicado e
-- confirmado (2026-08-15) — vw_produtos_seguro criada, produtos_multi_tenant
-- usando empresas_do_usuario_operacional().
--
-- O QUE FAZ:
--   1) turno_caixa — abertura de caixa por quem estiver vendendo (dono ou
--      operador), com fundo de troco (valor_abertura). Fechamento de
--      verdade (contagem física, diferença de caixa) fica pra uma etapa
--      futura — aqui só a estrutura pra abrir/registrar o turno, com
--      valor_fechamento já reservado pra quando essa etapa chegar.
--   2) venda — cabeçalho da venda: quem vendeu, em que turno, status, forma
--      de pagamento, total.
--   3) item_venda — cada linha vendida, com preço E CUSTO CONGELADOS no
--      momento da venda (nunca recalculados depois) — é o que permite medir
--      a margem real de uma venda de 6 meses atrás mesmo que o preço de
--      custo do produto tenha mudado 10 vezes desde então.
--   4) Trigger que recalcula venda.valor_total a partir da SOMA real dos
--      itens — nunca um número guardado à parte que pode dessincronizar,
--      mesmo princípio de "nunca soma incremental manual, sempre reagregado
--      do histórico real" já usado em fn_estoque_recalcular_produto
--      (ESTOQUE-FASE1-SQL.sql).
--
-- NADA AQUI AINDA GRAVA VENDA DE VERDADE. O carrinho da Etapa 1 (tela) vive
-- em memória no navegador — o código que de fato grava turno_caixa/venda/
-- item_venda entra numa etapa posterior, só depois deste SQL estar aplicado
-- e testado. Este arquivo só entrega a fundação pra revisão.
--
-- DECISÃO DE SEGURANÇA — por que estas 3 tabelas usam empresas_do_usuario()
-- e NÃO a variante _operacional() que bloqueia o operador por completo
-- (como acontece em produtos): o operador PRECISA abrir o próprio turno e
-- registrar as próprias vendas — é o trabalho dele, diferente de mexer no
-- catálogo. Bloqueá-lo destas 3 tabelas quebraria o PDV pra quem mais usa.
--
-- O corte da coluna sensível (custo) não é resolvido por RLS aqui — é
-- resolvido em código: nenhuma tela desta etapa lê item_venda de volta,
-- então a decisão de "como o operador olha o próprio histórico de vendas
-- sem ver custo_unitario_na_venda" (mesmo problema que vw_produtos_seguro
-- já resolveu pra produtos) fica registrada como pendência explícita pra
-- quando essa tela existir — não decidir sozinho quando chegar a hora
-- (mesma cautela já registrada em PDV-FASE0-EQUIPE-OPERADOR-SQL.sql, seção
-- "NOTA PARA A PRÓXIMA FASE").
--
-- ATENÇÃO — ARMADILHA JÁ IDENTIFICADA: PDV-FASE0-EQUIPE-OPERADOR-SQL.sql
-- (item 4, "descoberta dinâmica") acha automaticamente QUALQUER tabela nova
-- com empresa_id e aplica a política que bloqueia o operador por completo.
-- Se aquele arquivo for rodado de novo no futuro (não deveria ser
-- necessário, mas por segurança), ele vai sobrescrever a política destas 3
-- tabelas e quebrar a venda pro operador. Se um dia precisar rodar de novo,
-- a lista de exceções daquele arquivo (hoje só empresa_usuarios/
-- empresa_equipe/empresas) precisa ganhar turno_caixa/venda/item_venda
-- antes — registrado aqui pra não esquecer.
--
-- Idempotente (IF NOT EXISTS em tudo). Transação única.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1) TURNO_CAIXA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.turno_caixa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  usuario_id uuid not null,

  status text not null default 'aberto' check (status in ('aberto', 'fechado')),
  valor_abertura numeric(12,2) not null default 0,
  valor_fechamento numeric(12,2),
  observacao text,

  aberto_em timestamptz not null default now(),
  fechado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.turno_caixa ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'turno_caixa'
  ) THEN
    CREATE POLICY turno_caixa_multi_tenant ON public.turno_caixa
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_turno_caixa_empresa_aberto_em ON public.turno_caixa(empresa_id, aberto_em);
CREATE INDEX IF NOT EXISTS idx_turno_caixa_empresa_status ON public.turno_caixa(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_turno_caixa_usuario ON public.turno_caixa(usuario_id);

-- Nunca mais de um turno ABERTO ao mesmo tempo por empresa — evita 2
-- pessoas abrindo caixa em paralelo sem perceber e misturando vendas em
-- turnos diferentes por engano. Índice único parcial, só quando aberto.
CREATE UNIQUE INDEX IF NOT EXISTS uq_turno_caixa_aberto_por_empresa
  ON public.turno_caixa(empresa_id) WHERE status = 'aberto';

-- ============================================================================
-- 2) VENDA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.venda (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  turno_caixa_id uuid not null references public.turno_caixa(id),
  vendedor_id uuid not null,
  -- Opcional — a maioria das vendas de balcão é anônima. Vínculo com
  -- cliente cadastrado fica pra quando o PDV quiser oferecer fidelidade/
  -- fiado, não é obrigatório nesta etapa.
  cliente_id uuid references public.clientes(id) on delete set null,

  status text not null default 'aberta' check (status in ('aberta', 'finalizada', 'cancelada')),
  forma_pagamento text,
  valor_total numeric(12,2) not null default 0,
  desconto_total numeric(12,2) not null default 0,

  criado_em timestamptz not null default now(),
  finalizada_em timestamptz,
  cancelada_em timestamptz,
  updated_at timestamptz not null default now()
);

ALTER TABLE public.venda ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'venda'
  ) THEN
    CREATE POLICY venda_multi_tenant ON public.venda
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_venda_empresa_criado_em ON public.venda(empresa_id, criado_em);
CREATE INDEX IF NOT EXISTS idx_venda_empresa_status ON public.venda(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_venda_turno ON public.venda(turno_caixa_id);
CREATE INDEX IF NOT EXISTS idx_venda_vendedor ON public.venda(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_venda_cliente ON public.venda(cliente_id) WHERE cliente_id IS NOT NULL;

-- ============================================================================
-- 3) ITEM_VENDA — preço E custo CONGELADOS no momento da venda
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.item_venda (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  venda_id uuid not null references public.venda(id) on delete cascade,
  -- Sem ON DELETE em produto_id de propósito (fica RESTRICT): impede apagar
  -- um produto que já tem venda real associada — mesmo espírito de
  -- excluirProduto() já inativar em vez de excluir quando há movimentação.
  produto_id uuid not null references public.produtos(id),

  quantidade numeric(12,3) not null check (quantidade > 0),
  preco_unitario_venda numeric(12,2) not null,
  -- PROTEGIDO — nunca exposto pro operador. Antes de qualquer tela ler esta
  -- coluna de volta (histórico de vendas, relatório de margem), decisão
  -- explícita de coluna segura é necessária (ver nota no cabeçalho).
  custo_unitario_na_venda numeric(12,2),
  subtotal numeric(12,2) generated always as (round(quantidade * preco_unitario_venda, 2)) stored,

  created_at timestamptz not null default now()
);

ALTER TABLE public.item_venda ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'item_venda'
  ) THEN
    CREATE POLICY item_venda_multi_tenant ON public.item_venda
      FOR ALL TO authenticated
      USING (empresa_id IN (SELECT public.empresas_do_usuario()))
      WITH CHECK (empresa_id IN (SELECT public.empresas_do_usuario()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_item_venda_venda ON public.item_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_item_venda_empresa_produto ON public.item_venda(empresa_id, produto_id);

-- ============================================================================
-- 4) TOTAL DA VENDA — sempre reagregado da soma real dos itens, nunca um
--    número mantido à parte que pode dessincronizar.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_venda_recalcular_total(p_venda_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_soma_itens numeric := 0;
BEGIN
  SELECT COALESCE(SUM(subtotal), 0) INTO v_soma_itens
  FROM item_venda WHERE venda_id = p_venda_id;

  UPDATE venda SET
    valor_total = GREATEST(v_soma_itens - desconto_total, 0),
    updated_at = now()
  WHERE id = p_venda_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_item_venda_recalcular()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.fn_venda_recalcular_total(OLD.venda_id);
    RETURN OLD;
  ELSE
    PERFORM public.fn_venda_recalcular_total(NEW.venda_id);
    IF TG_OP = 'UPDATE' AND OLD.venda_id <> NEW.venda_id THEN
      PERFORM public.fn_venda_recalcular_total(OLD.venda_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_venda_recalcular ON public.item_venda;
CREATE TRIGGER trg_item_venda_recalcular
AFTER INSERT OR UPDATE OR DELETE ON public.item_venda
FOR EACH ROW EXECUTE FUNCTION public.trg_item_venda_recalcular();

-- ============================================================================
-- Verificação (só leitura) — confirma que as 3 tabelas, políticas e o
-- trigger existem.
-- ============================================================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('turno_caixa', 'venda', 'item_venda');
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('turno_caixa', 'venda', 'item_venda');

COMMIT;


-- ============================================================================
-- ROLLBACK — SÓ RODAR SE ALGO QUEBRAR DEPOIS DE APLICAR O BLOCO ACIMA.
-- Remove só o que este arquivo criou. Descomente e rode como bloco único.
-- ============================================================================
-- BEGIN;
--
-- DROP TRIGGER IF EXISTS trg_item_venda_recalcular ON public.item_venda;
-- DROP FUNCTION IF EXISTS public.trg_item_venda_recalcular();
-- DROP FUNCTION IF EXISTS public.fn_venda_recalcular_total(uuid);
-- DROP TABLE IF EXISTS public.item_venda;
-- DROP TABLE IF EXISTS public.venda;
-- DROP TABLE IF EXISTS public.turno_caixa;
--
-- COMMIT;
-- ============================================================================
