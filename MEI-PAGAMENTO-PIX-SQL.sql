-- ============================================================================
-- AXIOMA — Pagar DAS por dentro (MEI e Simples/ME) — 2026-10-10. SÓ ACRESCENTA.
-- ============================================================================
alter table public.guias_arrecadacao
  add column if not exists cnpj text,
  add column if not exists conta_pagar_id uuid references public.contas_pagar(id),          -- ME: conta a pagar do DAS do Simples
  add column if not exists pagamento_externo_id text,                                       -- id do pedido de pagamento na Pluggy
  add column if not exists pagamento_externo_status text,                                   -- CREATED / IN_PROGRESS / COMPLETED / ERROR...
  add column if not exists pagamento_externo_url text,                                      -- link de pagamento da Pluggy
  add column if not exists pagamento_externo_em timestamptz;
alter table public.guias_arrecadacao drop constraint if exists guias_arrecadacao_tipo_check;
alter table public.guias_arrecadacao add constraint guias_arrecadacao_tipo_check check (tipo in ('DAS_MEI', 'DAS_SIMPLES'));
create unique index if not exists ux_guias_pagamento_externo on public.guias_arrecadacao (pagamento_externo_id) where pagamento_externo_id is not null;

-- DESFAZER:
-- drop index if exists public.ux_guias_pagamento_externo;
-- alter table public.guias_arrecadacao drop constraint if exists guias_arrecadacao_tipo_check;
-- alter table public.guias_arrecadacao add constraint guias_arrecadacao_tipo_check check (tipo in ('DAS_MEI'));
-- alter table public.guias_arrecadacao drop column if exists pagamento_externo_em, drop column if exists pagamento_externo_url,
--   drop column if exists pagamento_externo_status, drop column if exists pagamento_externo_id, drop column if exists conta_pagar_id, drop column if exists cnpj;
