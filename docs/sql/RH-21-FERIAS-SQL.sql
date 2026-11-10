-- RH-21 — Controle de férias (item 6 do plano CFO/RH aprovado pelo Elias, 09/11/2026).
-- Cada linha é UMA parte de férias programada/gozada de um período aquisitivo (até 3 partes por período — CLT art. 134 § 1º).
-- O período aquisitivo é identificado pela data de início (aniversário da admissão). Regras de negócio completas no código
-- (lib/rhFerias.ts); o banco barra o que nunca pode acontecer. Lixeira de 90 dias (sem senha). Regras conferidas no Planalto.

-- ═════ BLOCO 1 — tabela ═════
create table if not exists public.rh_ferias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  colaborador_id uuid not null references public.rh_colaboradores(id) on delete cascade,
  contrato_id uuid not null references public.rh_contratos(id) on delete cascade,
  aquisitivo_inicio date not null,                       -- início do período aquisitivo (aniversário da admissão)
  gozo_inicio date not null,                             -- 1º dia de descanso
  dias smallint not null check (dias between 5 and 30),  -- art. 134 § 1º: nenhuma parte com menos de 5 dias
  abono_dias smallint not null default 0 check (abono_dias between 0 and 10), -- art. 143: venda de até 1/3
  faltas_periodo smallint check (faltas_periodo between 0 and 366), -- faltas injustificadas no período (art. 130)
  observacao text check (char_length(observacao) <= 300),
  excluido_em timestamptz,
  excluido_por uuid,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  -- férias só depois de completar o período aquisitivo (art. 134: "nos 12 meses subsequentes")
  constraint rh_ferias_depois_aquisitivo check (gozo_inicio >= aquisitivo_inicio + interval '1 year')
);
create index if not exists rh_ferias_colab on public.rh_ferias (empresa_id, colaborador_id, aquisitivo_inicio);
create index if not exists rh_ferias_gozo on public.rh_ferias (empresa_id, gozo_inicio) where excluido_em is null;

-- ═════ BLOCO 2 — mesma empresa e contrato da própria pessoa ═════
drop trigger if exists rh_ferias_empresa on public.rh_ferias;
create trigger rh_ferias_empresa before insert or update of contrato_id, empresa_id on public.rh_ferias
  for each row execute function public.rh_confere_mesma_empresa('rh_contratos', 'contrato_id');
create or replace function public.rh_ferias_confere()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if not exists (select 1 from rh_contratos c where c.id = new.contrato_id and c.colaborador_id = new.colaborador_id) then
    raise exception 'O contrato não é desta pessoa.' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_ferias_confere on public.rh_ferias;
create trigger rh_ferias_confere before insert or update of contrato_id, colaborador_id on public.rh_ferias
  for each row execute function public.rh_ferias_confere();

-- ═════ BLOCO 3 — acesso pela liberação do RH (ver lê; editar grava; sem apagar de vez: lixeira) ═════
alter table public.rh_ferias enable row level security;
drop policy if exists le on public.rh_ferias;
create policy le on public.rh_ferias for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists insere on public.rh_ferias;
create policy insere on public.rh_ferias for insert to authenticated with check (public.rh_pode(empresa_id, 'editar'));
drop policy if exists altera on public.rh_ferias;
create policy altera on public.rh_ferias for update to authenticated
  using (public.rh_pode(empresa_id, 'editar')) with check (public.rh_pode(empresa_id, 'editar'));

-- ═════ CONFERÊNCIA — esperado: 1 · 3 · 2 · 1 ═════
select (select count(*) from pg_tables where tablename = 'rh_ferias') as tabela,
       (select count(*) from pg_policies where tablename = 'rh_ferias') as politicas,
       (select count(*) from pg_trigger where tgname in ('rh_ferias_empresa','rh_ferias_confere')) as gatilhos,
       (select count(*) from pg_constraint where conname = 'rh_ferias_depois_aquisitivo') as regra_aquisitivo;
