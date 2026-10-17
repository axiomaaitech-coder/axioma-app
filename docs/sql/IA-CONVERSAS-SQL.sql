-- Conversas salvas das IAs (José, IA Financeira, IA Tributária, MEI Advisor, Relatórios, Contas a Pagar) — 2026-10-16.
-- Cada conversa é de UMA empresa e de UMA pessoa (quem conversou): outra empresa não vê nada; outro usuário da
-- mesma empresa também não lê a conversa alheia. Mensagens guardam o pedido do relatório (cartão volta ao reabrir)
-- e a anotação (lápis). A pessoa apaga quando quiser (lixeira) — é conteúdo dela, não dado financeiro.

create table if not exists public.ia_conversa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  tela text not null check (char_length(tela) between 1 and 40),
  titulo text not null default 'Nova conversa' check (char_length(titulo) between 1 and 120),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists ia_conversa_lista on public.ia_conversa (empresa_id, user_id, tela, atualizado_em desc);

create table if not exists public.ia_conversa_mensagem (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.ia_conversa(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  role text not null check (role in ('user', 'assistant')),
  texto text not null check (char_length(texto) <= 20000),
  relatorio jsonb,
  nota text check (nota is null or char_length(nota) <= 2000),
  criado_em timestamptz not null default now()
);
create index if not exists ia_conversa_mensagem_conv on public.ia_conversa_mensagem (conversa_id, criado_em);

alter table public.ia_conversa enable row level security;
alter table public.ia_conversa_mensagem enable row level security;

drop policy if exists ia_conversa_dono on public.ia_conversa;
create policy ia_conversa_dono on public.ia_conversa for all
  using (user_id = (select auth.uid()) and empresa_id in (select public.empresas_do_usuario_operacional()))
  with check (user_id = (select auth.uid()) and empresa_id in (select public.empresas_do_usuario_operacional()));

drop policy if exists ia_conversa_mensagem_dono on public.ia_conversa_mensagem;
create policy ia_conversa_mensagem_dono on public.ia_conversa_mensagem for all
  using (user_id = (select auth.uid()) and empresa_id in (select public.empresas_do_usuario_operacional()))
  with check (user_id = (select auth.uid()) and empresa_id in (select public.empresas_do_usuario_operacional())
    and conversa_id in (select c.id from public.ia_conversa c where c.user_id = (select auth.uid()) and c.empresa_id = ia_conversa_mensagem.empresa_id));
