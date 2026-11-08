-- RH · Permissões v2 (regra do Elias, 2026-11-08): dado de funcionário só para quem foi AUTORIZADO.
-- Proprietário, CEO, Sócio e Admin (equipe_nivel <= 4, a mesma hierarquia da Equipe) têm acesso total ao RH
-- e são os únicos que liberam acesso. Todos os outros papéis (Financeiro, Contador, Leitor, Operador) não veem
-- NADA do RH até serem liberados, item por item: ver, editar, dados pessoais, salário, saúde.
-- Ninguém libera para si mesmo. Substitui a regra da subfase 1 (rh_pode) — mesmas tabelas, mesma função.

-- ═════ BLOCO 1 — novo item de permissão: dados pessoais (CPF, endereço, contatos) ═════
alter table public.rh_permissoes add column if not exists ver_pessoais boolean not null default false;
-- ═════ FIM BLOCO 1 ═════

-- ═════ BLOCO 2 — função única de decisão ═════
-- rh_pode(empresa, 'ver' | 'editar' | 'pessoais' | 'salario' | 'saude' | 'gerir')
-- 'gerir' = pode liberar acesso a outras pessoas (só Proprietário, CEO, Sócio, Admin).
create or replace function public.rh_pode(p_empresa uuid, p_acao text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  with nivel as (select coalesce(public.equipe_nivel(p_empresa, (select auth.uid())), 99) as n),
       extra as (select * from public.rh_permissoes
                 where empresa_id = p_empresa and user_id = (select auth.uid()) limit 1)
  select case
    when public.meu_papel(p_empresa) is null then false              -- não é da Empresa (ou suspenso/expirado)
    when (select n from nivel) <= 4 then true                         -- Proprietário, CEO, Sócio, Admin
    when p_acao = 'gerir' then false
    when p_acao = 'ver' then coalesce((select ver or editar or ver_pessoais or ver_salario or ver_saude from extra), false)
    when p_acao = 'editar' then coalesce((select editar from extra), false)
    when p_acao = 'pessoais' then coalesce((select ver_pessoais from extra), false)
    when p_acao = 'salario' then coalesce((select ver_salario from extra), false)
    when p_acao = 'saude' then coalesce((select ver_saude from extra), false)
    else false
  end
$$;
revoke all on function public.rh_pode(uuid, text) from public, anon;
grant execute on function public.rh_pode(uuid, text) to authenticated;
-- ═════ FIM BLOCO 2 ═════

-- ═════ BLOCO 3 — quem lê e quem muda as liberações ═════
-- Lê: a própria liberação, ou quem pode gerir. Muda: só quem pode gerir, e nunca a própria linha.
drop policy if exists rh_permissoes_le on public.rh_permissoes;
create policy rh_permissoes_le on public.rh_permissoes for select to authenticated
  using (empresa_id in (select public.empresas_do_usuario_operacional())
         and (user_id = (select auth.uid()) or public.rh_pode(empresa_id, 'gerir')));
drop policy if exists rh_permissoes_insere on public.rh_permissoes;
create policy rh_permissoes_insere on public.rh_permissoes for insert to authenticated
  with check (public.rh_pode(empresa_id, 'gerir') and user_id <> (select auth.uid()));
drop policy if exists rh_permissoes_altera on public.rh_permissoes;
create policy rh_permissoes_altera on public.rh_permissoes for update to authenticated
  using (public.rh_pode(empresa_id, 'gerir') and user_id <> (select auth.uid()))
  with check (public.rh_pode(empresa_id, 'gerir') and user_id <> (select auth.uid()));
drop policy if exists rh_permissoes_apaga on public.rh_permissoes;
create policy rh_permissoes_apaga on public.rh_permissoes for delete to authenticated
  using (public.rh_pode(empresa_id, 'gerir') and user_id <> (select auth.uid()));
-- quem liberou fica registrado
create or replace function public.rh_permissoes_marca()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.concedido_por := auth.uid(); new.updated_at := now(); return new; end $$;
drop trigger if exists rh_permissoes_marca on public.rh_permissoes;
create trigger rh_permissoes_marca before insert or update on public.rh_permissoes
  for each row execute function public.rh_permissoes_marca();
-- ═════ FIM BLOCO 3 ═════
