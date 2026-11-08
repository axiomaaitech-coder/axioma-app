-- RH · Fase 1 · Subfase 1 — Fundação de permissões do RH (2026-11-08)
-- Só CRIA coisas novas: 1 tabela (rh_permissoes) e 1 função (rh_pode). Não altera nenhuma tabela existente.
-- Rodar em blocos, na ordem. Depois rodar RH-1-TESTE-PERMISSOES-SQL.sql (deve terminar com "falhas=0").
--
-- Regra padrão (pode ser mudada pessoa a pessoa em rh_permissoes, só por dono/admin):
--   dono ........ vê tudo, edita, vê salário e saúde
--   admin ....... vê tudo, edita, vê salário — saúde só com permissão dada
--   financeiro .. vê RH e salário (custo de pessoal); editar e saúde só com permissão dada
--   contabil .... vê RH e salário (o contador faz a folha); editar e saúde só com permissão dada
--   leitor/operador: nada do RH, salvo permissão dada
-- Saúde (exames, atestados, deficiência) é dado sensível pela LGPD (art. 11): por padrão só o dono.

-- ═════ BLOCO 1 — tabela de permissões extras do RH ═════
create table if not exists public.rh_permissoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null,
  ver boolean not null default false,
  editar boolean not null default false,
  ver_salario boolean not null default false,
  ver_saude boolean not null default false,
  concedido_por uuid,
  motivo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rh_permissoes_unica unique (empresa_id, user_id)
);
alter table public.rh_permissoes enable row level security;
-- ═════ FIM BLOCO 1 ═════

-- ═════ BLOCO 2 — função única de decisão: rh_pode(empresa, 'ver'|'editar'|'salario'|'saude') ═════
create or replace function public.rh_pode(p_empresa uuid, p_acao text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  with papel as (select public.meu_papel(p_empresa) as p),
       extra as (select * from public.rh_permissoes
                 where empresa_id = p_empresa and user_id = (select auth.uid()) limit 1)
  select case
    when (select p from papel) is null then false
    when (select p from papel) = 'dono' then true
    when p_acao = 'ver' then (select p from papel) in ('admin','financeiro','contabil')
                             or coalesce((select ver or editar from extra), false)
    when p_acao = 'editar' then (select p from papel) = 'admin'
                             or coalesce((select editar from extra), false)
    when p_acao = 'salario' then (select p from papel) in ('admin','financeiro','contabil')
                             or coalesce((select ver_salario from extra), false)
    when p_acao = 'saude' then coalesce((select ver_saude from extra), false)
    else false
  end
$$;
revoke all on function public.rh_pode(uuid, text) from public, anon;
grant execute on function public.rh_pode(uuid, text) to authenticated;
-- ═════ FIM BLOCO 2 ═════

-- ═════ BLOCO 3 — quem lê e quem muda as permissões ═════
-- Lê: a própria linha, ou dono/admin da Empresa.
-- Muda: o dono muda qualquer linha. O admin muda a dos outros, nunca a própria, e não pode dar acesso à saúde
-- (assim ninguém se autoconcede dado sensível; saúde só o dono libera).
alter table public.rh_permissoes alter column concedido_por set default auth.uid();
drop policy if exists rh_permissoes_le on public.rh_permissoes;
create policy rh_permissoes_le on public.rh_permissoes for select to authenticated
  using (empresa_id in (select public.empresas_do_usuario_operacional())
         and (user_id = (select auth.uid()) or public.meu_papel(empresa_id) in ('dono','admin')));
drop policy if exists rh_permissoes_insere on public.rh_permissoes;
create policy rh_permissoes_insere on public.rh_permissoes for insert to authenticated
  with check (public.meu_papel(empresa_id) = 'dono'
              or (public.meu_papel(empresa_id) = 'admin' and user_id <> (select auth.uid()) and not ver_saude));
drop policy if exists rh_permissoes_altera on public.rh_permissoes;
create policy rh_permissoes_altera on public.rh_permissoes for update to authenticated
  using (public.meu_papel(empresa_id) = 'dono'
         or (public.meu_papel(empresa_id) = 'admin' and user_id <> (select auth.uid()) and not ver_saude))
  with check (public.meu_papel(empresa_id) = 'dono'
              or (public.meu_papel(empresa_id) = 'admin' and user_id <> (select auth.uid()) and not ver_saude));
drop policy if exists rh_permissoes_apaga on public.rh_permissoes;
create policy rh_permissoes_apaga on public.rh_permissoes for delete to authenticated
  using (public.meu_papel(empresa_id) = 'dono'
         or (public.meu_papel(empresa_id) = 'admin' and user_id <> (select auth.uid())));
-- ═════ FIM BLOCO 3 ═════
