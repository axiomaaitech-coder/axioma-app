-- ============================================================================
-- DESFAZER a Rodada 1 do motor de obrigações MEI (ordem inversa: D → C → B → A).
-- ATENÇÃO: o bloco C apaga as tabelas de pagamento. Rodar só se NENHUM pagamento real
-- tiver sido registrado pelo motor (conferir antes: select count(*) from pagamentos_obrigacao;).
-- As colunas antigas de mei_obrigacoes (status, valor, data_entrega) ficam como estavam.
-- ============================================================================

-- D — funções e trava
drop function if exists public.mei_resumo_obrigacoes(uuid, integer);
drop function if exists public.mei_marcar_rastreio_ok(uuid, uuid);
drop function if exists public.mei_estornar_pagamento(uuid, uuid, text);
drop function if exists public.mei_registrar_pagamento(uuid, numeric, date, text, text, text, jsonb, text, uuid, text);
drop trigger if exists trg_contas_pagar_trava_das on public.contas_pagar;
drop function if exists public.fn_contas_pagar_trava_das();
drop function if exists public.mei_gerar_periodos_das(uuid, integer);
drop function if exists public.mei_status_conta(numeric, numeric, date);
drop function if exists public.mei_situacao_obrigacao(uuid);

-- C — pagamento, alocação, guia
drop table if exists public.pagamento_alocacoes;
drop table if exists public.pagamentos_obrigacao;
drop table if exists public.guias_arrecadacao;

-- B — vínculo e campos novos (contas a pagar de DAS continuam existindo, sem o vínculo)
drop trigger if exists trg_mei_obrigacoes_historico on public.mei_obrigacoes;
drop function if exists public.fn_mei_obrigacoes_historico();
drop table if exists public.mei_obrigacoes_historico;
drop index if exists public.ux_contas_pagar_mei_obrigacao;
alter table public.contas_pagar drop column if exists mei_obrigacao_id;
alter table public.mei_obrigacoes
  drop column if exists situacao_origem,
  drop column if exists situacao,
  drop column if exists premissa,
  drop column if exists regra_id,
  drop column if exists natureza,
  drop column if exists valor_esperado;

-- A — regras fiscais
drop table if exists public.regras_fiscais;
