-- Auditoria 2026-11-12 — parte 2 (autorizada pelo Elias: "pode fazer o sql e corrigir todos os erros mesmo que tenha que deletar").

-- ═════ BLOCO 1 — Prontidão do fechamento contando certo ═════
-- Antes: (a) "eventos não contabilizados" contava eventos que NUNCA geram lançamento (conta aprovada, conta editada sem
-- mudar valor) e ignorava lançamento feito por RPC sem carimbo de evento (venda, estorno); (b) conta CANCELADA contava
-- como pendente no % de contas a pagar/receber do mês.
create or replace function public.contador_close_readiness(p_empresa_id uuid, p_competencia date)
returns setof contador_close language plpgsql security definer set search_path to 'public' as $function$
DECLARE
  v_competencia_inicio date := date_trunc('month', p_competencia)::date;
  v_competencia_fim    date := (date_trunc('month', p_competencia) + interval '1 month' - interval '1 day')::date;
  v_eventos_total int; v_eventos_sem_lanc int; v_pct_eventos numeric;
  v_ap_total int; v_ap_pendentes int; v_ap_pendente_valor numeric; v_pct_ap numeric;
  v_ar_total int; v_ar_pendentes int; v_ar_pendente_valor numeric; v_pct_ar numeric;
  v_readiness numeric; v_pendencias jsonb;
BEGIN
  IF p_empresa_id NOT IN (SELECT public.empresas_do_usuario()) THEN
    RAISE EXCEPTION 'Sem acesso a esta empresa';
  END IF;
  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.lancamento_contabil lc WHERE lc.evento_id = e.id)
                            AND NOT EXISTS (SELECT 1 FROM public.lancamento_contabil lc
                                            WHERE lc.empresa_id = e.empresa_id AND lc.origem_tabela = e.origem_tabela
                                              AND lc.origem_id::text = e.origem_id::text AND lc.criado_em >= e.criado_em - interval '1 minute'))
    INTO v_eventos_total, v_eventos_sem_lanc
  FROM public.eventos_negocio e
  WHERE e.empresa_id = p_empresa_id AND e.criado_em >= v_competencia_inicio AND e.criado_em < v_competencia_fim + 1
    AND e.tipo IN ('AP_CREATED','AP_PAID','AP_PAYMENT_REVERSED','AR_CREATED','AR_RECEIVED','AR_PAYMENT_REVERSED',
                   'SALE_CREATED','STOCK_ENTRY_MANUAL','STOCK_ADJUSTMENT','STOCK_LOSS','CASH_WITHDRAWAL','CASH_DEPOSIT',
                   'MANUAL_ENTRY_RECORDED','MANUAL_ENTRY_REVERSED');
  v_pct_eventos := CASE WHEN v_eventos_total = 0 THEN 100 ELSE ROUND((v_eventos_total - v_eventos_sem_lanc)::numeric / v_eventos_total * 100, 1) END;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status NOT IN ('pago','cancelado')),
         COALESCE(SUM(valor_total - valor_pago) FILTER (WHERE status NOT IN ('pago','cancelado')), 0)
    INTO v_ap_total, v_ap_pendentes, v_ap_pendente_valor
  FROM public.contas_pagar WHERE empresa_id = p_empresa_id AND data_vencimento BETWEEN v_competencia_inicio AND v_competencia_fim;
  v_pct_ap := CASE WHEN v_ap_total = 0 THEN 100 ELSE ROUND((v_ap_total - v_ap_pendentes)::numeric / v_ap_total * 100, 1) END;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status NOT IN ('recebido','cancelado')),
         COALESCE(SUM(valor - valor_recebido) FILTER (WHERE status NOT IN ('recebido','cancelado')), 0)
    INTO v_ar_total, v_ar_pendentes, v_ar_pendente_valor
  FROM public.contas_receber WHERE empresa_id = p_empresa_id AND data_vencimento BETWEEN v_competencia_inicio AND v_competencia_fim;
  v_pct_ar := CASE WHEN v_ar_total = 0 THEN 100 ELSE ROUND((v_ar_total - v_ar_pendentes)::numeric / v_ar_total * 100, 1) END;

  v_readiness := ROUND((v_pct_eventos + v_pct_ap + v_pct_ar) / 3, 1);
  v_pendencias := jsonb_build_object(
    'eventos_nao_contabilizados', v_eventos_sem_lanc, 'eventos_total_periodo', v_eventos_total,
    'contas_pagar_pendentes', jsonb_build_object('qtd', v_ap_pendentes, 'valor_total', v_ap_pendente_valor),
    'contas_receber_pendentes', jsonb_build_object('qtd', v_ar_pendentes, 'valor_total', v_ar_pendente_valor));

  RETURN QUERY
  INSERT INTO public.contador_close (empresa_id, competencia, readiness_pct, pendencias, previsao_prazo, calculado_em)
  VALUES (p_empresa_id, v_competencia_inicio, v_readiness, v_pendencias, NULL, now())
  ON CONFLICT (empresa_id, competencia) DO UPDATE SET
    readiness_pct = EXCLUDED.readiness_pct, pendencias = EXCLUDED.pendencias, previsao_prazo = EXCLUDED.previsao_prazo, calculado_em = now()
  RETURNING *;
END; $function$;

-- ═════ BLOCO 2 — "Minha Empresa" (1d42ea89…) do Elias: só dado de TESTE antigo (ago–out/2026, antes do motor contábil
-- completo: 54 eventos sem lançamento, aluguel com dia 1017, "Teste 2", "TESTE ROTEIRO 1"…). Apaga o movimento; mantém
-- usuários, assinatura, plano de contas, configurações e históricos de auditoria. Os exemplos ficam na empresa de teste
-- Horizonte. Ordem resolvida sozinha: repete até nada mais sair (filho antes do pai).
DO $$
DECLARE
  emp uuid := '1d42ea89-632b-4357-9c3f-5e9c836d13ca';
  tabs text[] := ARRAY['item_venda','venda','estoque_movimentacoes','estoque_lotes','estoque_nfe_importadas','nfe_itens',
    'pedido_compra_itens','pedido_compra','fornecedor_produtos','produtos',
    'lancamento_contabil_partida','lancamento_contabil','eventos_negocio','rastreio_destino','rastreio_movimentacao',
    'fluxo_caixa','caixa_movimentacao','contas_pagar_documentos','contas_pagar_aprovacao','pagamento_alocacoes',
    'cobranca_compromissos','cobranca_interacoes','inadimplencia','vencido_evento','vencido_previsao','vencido_caso',
    'contas_pagar','contas_receber','receitas','custos_variaveis','custos_fixos','dividas','endividamento','investimentos',
    'metas','lancamentos_centro','centro_custo_rateio','centro_custo_orcamento','centro_custo_plano_acao','centro_custo_auditoria',
    'fornecedor_contatos','fornecedor_contratos','fornecedor_documentos','fornecedor_interacoes','fornecedores','clientes','centros_custo',
    'importacao_linhas','importacao_excecoes','importacao_timeline','importacoes','documentos_fiscais','guias_arrecadacao',
    'pagamentos_obrigacao','match_divergencias','match_resultado','of_transacoes','contador_close','contador_descoberta',
    'contador_decisao_journal','contador_data_trust','dre_historico','dre_mensal','tesouraria_alerta','tesouraria_cenario',
    'tesouraria_forecast_precisao','tesouraria_banco_metrica','alertas','riscos','score_historico','simulacoes',
    'precificacao','decisoes_precificacao','relatorios','fiscal_descoberta','fiscal_health'];
  t text; n int; total int; rodada int := 0; restante int;
BEGIN
  LOOP
    rodada := rodada + 1; total := 0;
    FOREACH t IN ARRAY tabs LOOP
      BEGIN
        EXECUTE format('delete from public.%I where empresa_id = $1', t) USING emp;
        GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
      EXCEPTION WHEN foreign_key_violation THEN NULL; -- ainda tem filho: sai na próxima rodada
      END;
    END LOOP;
    EXIT WHEN total = 0 OR rodada >= 8;
  END LOOP;
  restante := 0;
  FOREACH t IN ARRAY tabs LOOP
    EXECUTE format('select count(*) from public.%I where empresa_id = $1', t) USING emp INTO n;
    restante := restante + n;
  END LOOP;
  IF restante > 0 THEN RAISE EXCEPTION 'Ficaram % linhas (algo amarrado fora da empresa) — nada foi apagado', restante; END IF;
END $$;
