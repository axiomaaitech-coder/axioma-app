-- ============================================================================
-- AXIOMA AI.TECH — Open Finance: Conciliação Inteligente (Fase 2A / Peça 1)
-- Só ALTER em tabelas já existentes (open_finance, of_transacoes).
-- Nenhuma tabela nova. RLS existente (empresas_do_usuario) já cobre as
-- colunas novas automaticamente — RLS é por linha, não por coluna.
-- Rode uma vez no SQL Editor do Supabase.
-- ============================================================================

-- 1) Chave estável da transação na Pluggy. Antes o sync fazia DELETE+INSERT
--    a cada sincronização (não guardava o id que a Pluggy dá pra cada
--    transação) — isso apagava o vínculo de conciliação toda vez que o
--    usuário clicava em "Sincronizar". Com essa coluna, o sync passa a
--    fazer UPSERT: mesma transação nunca duplica, e o vínculo já feito
--    (lancamento_id) nunca é perdido.
alter table public.of_transacoes
  add column if not exists pluggy_transaction_id text;

create unique index if not exists of_transacoes_pluggy_transaction_id_key
  on public.of_transacoes (pluggy_transaction_id)
  where pluggy_transaction_id is not null;

-- 2) Vínculo explícito: preenchido só quando o usuário confirma "criar
--    lançamento" a partir de uma transação pendente. É a fonte de verdade
--    do balde "Conciliado" pra essa transação (nunca recalculado por
--    heurística depois de existir). O índice único garante, no banco, que
--    um lançamento nunca é casado com duas transações diferentes.
alter table public.of_transacoes
  add column if not exists lancamento_id uuid,
  add column if not exists lancamento_tabela text
    check (lancamento_tabela in ('receitas','custos_variaveis'));

create unique index if not exists of_transacoes_lancamento_unico
  on public.of_transacoes (lancamento_tabela, lancamento_id)
  where lancamento_id is not null;

-- 3) Saldo da conta bancária, capturado a cada sync — alimenta o KPI
--    "Saldo do Banco" (comparado ao "Saldo do Sistema", calculado a partir
--    de receitas + custos variáveis já lançados).
alter table public.open_finance
  add column if not exists saldo_atual numeric;
