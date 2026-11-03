-- Lixeira de 60 dias (Elias 2026-11-02): contatos e promessas de cobrança não são apagados de vez —
-- ganham a data em que foram para a lixeira; todas as telas escondem; dá para recuperar por 60 dias.
-- Só acrescenta colunas e índices. Pode rodar de novo sem erro.
alter table public.cobranca_interacoes add column if not exists excluido_em timestamptz;
alter table public.cobranca_interacoes add column if not exists excluido_por uuid;
alter table public.cobranca_compromissos add column if not exists excluido_em timestamptz;
alter table public.cobranca_compromissos add column if not exists excluido_por uuid;
create index if not exists cobranca_interacoes_ativos on public.cobranca_interacoes (empresa_id, conta_id, data desc) where excluido_em is null;
create index if not exists cobranca_interacoes_lixeira on public.cobranca_interacoes (empresa_id, excluido_em desc) where excluido_em is not null;
