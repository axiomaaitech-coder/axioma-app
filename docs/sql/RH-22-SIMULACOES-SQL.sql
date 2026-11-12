-- RH-22 (12/11/2026) — simulações de contratação salvas por 30 dias (pedido do Elias: comparar empregados e possíveis
-- contratações). Depois de 30 dias a simulação some da tela na hora (regra de leitura) e o robô diário apaga de vez.
-- Quem vê: quem tem acesso ao RH vê as próprias; as dos outros só com liberação de salário (o resultado tem custo de pessoal).

-- ═══ BLOCO 1 — tabela, índice e travas ═══
create table if not exists public.rh_simulacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  entrada jsonb not null,
  resultado jsonb not null,
  criado_por uuid not null default auth.uid(),
  criado_em timestamptz not null default now()
);
create index if not exists rh_simulacoes_empresa_criado_idx on public.rh_simulacoes (empresa_id, criado_em desc);
alter table public.rh_simulacoes enable row level security;
revoke all on public.rh_simulacoes from anon;
grant select, insert, delete on public.rh_simulacoes to authenticated;

drop policy if exists rh_simulacoes_le on public.rh_simulacoes;
create policy rh_simulacoes_le on public.rh_simulacoes for select to authenticated
  using (criado_em > now() - interval '30 days' and public.rh_pode(empresa_id, 'ver')
         and (criado_por = (select auth.uid()) or public.rh_pode(empresa_id, 'salario')));
drop policy if exists rh_simulacoes_grava on public.rh_simulacoes;
create policy rh_simulacoes_grava on public.rh_simulacoes for insert to authenticated
  with check (criado_por = (select auth.uid()) and public.rh_pode(empresa_id, 'ver'));
drop policy if exists rh_simulacoes_apaga on public.rh_simulacoes;
create policy rh_simulacoes_apaga on public.rh_simulacoes for delete to authenticated
  using (public.rh_pode(empresa_id, 'ver') and (criado_por = (select auth.uid()) or public.rh_pode(empresa_id, 'editar')));
-- ═══ FIM BLOCO 1 ═══

-- ═══ BLOCO 2 — conferência (esperado: rls=true, politicas=3, anon_le=false) ═══
select c.relrowsecurity as rls,
       (select count(*) from pg_policies where tablename = 'rh_simulacoes') as politicas,
       has_table_privilege('anon', 'public.rh_simulacoes', 'select') as anon_le
from pg_class c where c.relname = 'rh_simulacoes';
-- ═══ FIM BLOCO 2 ═══
