-- Transferir empresa (pedido do Elias, 2026-10-09)
-- Passagem da empresa de verdade (venda, doação, sucessão, reorganização) com os
-- dados que a lei pede. Tudo é gravado pelo servidor (/api/transferir-empresa,
-- chave de serviço); a tela só LÊ o histórico (CEO, Sócio e Admin).

-- BLOCO 1 — tabela + índices + proteção
create table if not exists public.empresa_transferencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cedente_user_id uuid not null,
  cedente_nome text not null,
  cedente_doc text not null,
  cessionario_nome text not null,
  cessionario_doc text not null,
  cessionario_email text not null,
  cessionario_user_id uuid,
  tipo_operacao text not null check (tipo_operacao in ('venda','doacao','sucessao','reorganizacao')),
  tipo_societario text not null check (tipo_societario in ('ltda','slu','sa','outra')),
  junta_protocolo text not null,
  junta_data date not null,
  documento_id uuid references public.empresa_documentos(id) on delete set null,
  checklist jsonb not null default '{}'::jsonb,
  motivo text not null,
  cedente_fica_admin boolean not null default true,
  token text not null unique,
  situacao text not null default 'aguardando' check (situacao in ('aguardando','concluida','cancelada','expirada')),
  expira_em timestamptz not null,
  aceite_cpf text,
  aceite_em timestamptz,
  cancelado_em timestamptz,
  cancelado_por uuid,
  cancelado_motivo text,
  created_at timestamptz not null default now()
);
create index if not exists empresa_transferencias_empresa_idx on public.empresa_transferencias (empresa_id, created_at desc);
-- Só 1 transferência aguardando por empresa
create unique index if not exists empresa_transferencias_uma_aberta on public.empresa_transferencias (empresa_id) where situacao = 'aguardando';

alter table public.empresa_transferencias enable row level security;
revoke all on public.empresa_transferencias from anon;
revoke insert, update, delete on public.empresa_transferencias from authenticated;
drop policy if exists "transferencias: lideres leem" on public.empresa_transferencias;
create policy "transferencias: lideres leem" on public.empresa_transferencias
  for select to authenticated
  using (public.equipe_nivel(empresa_id, (select auth.uid())) <= 4);
