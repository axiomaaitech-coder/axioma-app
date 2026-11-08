-- RH · Fase 1 · Subfase 3 — Estabelecimentos (S-1005) e grupo de Empresas — 2026-11-08
-- Campos do leiaute oficial eSocial S-1.3 (NT 07/2026 rev. 20/10/2026), evento S-1005.
-- Regra do eSocial: o empregador é a RAIZ do CNPJ (8 dígitos). Filial com a mesma raiz = estabelecimento DENTRO da Empresa.
-- CNPJ com outra raiz = outra Empresa no Axioma, ligada pelo "grupo" (bloco 4).
-- Só CRIA coisas novas (e acrescenta 1 trava em rh_empregador, tabela criada na subfase 2).
-- Grupos que exigem a Tabela de Processos (S-1070) — alíquota RAT diferente da lei, processos de FAP — ficam
-- bloqueados até o S-1070 existir.

-- ═════ BLOCO 1 — validação de CNPJ e CPF no próprio banco (dígitos verificadores) ═════
create or replace function public.rh_cnpj_valido(p text)
returns boolean language plpgsql immutable as $$
declare d int[]; s int; r int; i int; p1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2]; p2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
begin
  if p is null or p !~ '^[0-9]{14}$' or p ~ '^(.)\1{13}$' then return false; end if;
  d := array(select substr(p, g.k, 1)::int from generate_series(1, char_length(p)) as g(k) order by g.k);
  s := 0; for i in 1..12 loop s := s + d[i] * p1[i]; end loop;
  r := s % 11; if (case when r < 2 then 0 else 11 - r end) <> d[13] then return false; end if;
  s := 0; for i in 1..13 loop s := s + d[i] * p2[i]; end loop;
  r := s % 11; return (case when r < 2 then 0 else 11 - r end) = d[14];
end $$;

create or replace function public.rh_cpf_valido(p text)
returns boolean language plpgsql immutable as $$
declare d int[]; s int; r int; i int;
begin
  if p is null or p !~ '^[0-9]{11}$' or p ~ '^(.)\1{10}$' then return false; end if;
  d := array(select substr(p, g.k, 1)::int from generate_series(1, char_length(p)) as g(k) order by g.k);
  s := 0; for i in 1..9 loop s := s + d[i] * (11 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if; if r <> d[10] then return false; end if;
  s := 0; for i in 1..10 loop s := s + d[i] * (12 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if; return r = d[11];
end $$;

-- rh_empregador (subfase 2): CNPJ completo e CPF passam a ter os dígitos conferidos. A raiz (8) não tem dígito.
alter table public.rh_empregador drop constraint if exists rh_empregador_digitos;
alter table public.rh_empregador add constraint rh_empregador_digitos check (
  (tp_insc = 1 and (char_length(nr_insc) = 8 or public.rh_cnpj_valido(nr_insc)))
  or (tp_insc = 2 and public.rh_cpf_valido(nr_insc)));
-- ═════ FIM BLOCO 1 ═════

-- ═════ BLOCO 2 — estabelecimentos (S-1005). Mudança = nova linha com nova validade. ═════
create table if not exists public.rh_estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 120),     -- só do Axioma (ex.: "Loja Centro"); não vai ao eSocial
  centro_custo_id uuid references public.centros_custo(id) on delete set null,
  tp_insc smallint not null check (tp_insc in (1,3,4)),                -- 1 CNPJ · 3 CAEPF · 4 CNO (obra)
  nr_insc text not null check (nr_insc ~ '^[0-9]+$'),
  ini_valid text not null check (ini_valid ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  fim_valid text check (fim_valid ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  cnae_prep text not null check (cnae_prep ~ '^[0-9]{7}$'),
  cnpj_resp text check (cnpj_resp ~ '^[0-9]{14}$'),
  fap numeric(5,4) check (fap between 0.5 and 2.0),
  tp_caepf smallint check (tp_caepf in (1,2,3)),
  ind_subst_patr_obra smallint check (ind_subst_patr_obra in (1,2)),
  apr_nr_proc_jud text check (apr_nr_proc_jud ~ '^[0-9]{20}$'),
  apr_entidades_educ text[] check (apr_entidades_educ is null or cardinality(apr_entidades_educ) between 1 and 99),
  pcd_nr_proc_jud text check (pcd_nr_proc_jud ~ '^[0-9]{20}$'),
  situacao_esocial text not null default 'rascunho'
    check (situacao_esocial in ('rascunho','preparado','enviado','aceito','recusado','enviado_pelo_contador')),
  recibo_esocial text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint rh_estab_periodo unique (empresa_id, tp_insc, nr_insc, ini_valid),
  constraint rh_estab_fim_depois check (fim_valid is null or fim_valid >= ini_valid),
  constraint rh_estab_tamanho check ((tp_insc = 1 and char_length(nr_insc) = 14 and public.rh_cnpj_valido(nr_insc))
                                     or (tp_insc = 3 and char_length(nr_insc) = 14)
                                     or (tp_insc = 4 and char_length(nr_insc) = 12)),
  constraint rh_estab_cnpj_resp check (cnpj_resp is null or (tp_insc = 4 and public.rh_cnpj_valido(cnpj_resp))),
  constraint rh_estab_caepf check (tp_caepf is null or tp_insc = 3),
  constraint rh_estab_obra check (ind_subst_patr_obra is null or tp_insc = 4),
  -- PCD: só na matriz (CNPJ com ordem 0001)
  constraint rh_estab_pcd_matriz check (pcd_nr_proc_jud is null or (tp_insc = 1 and substr(nr_insc, 9, 4) = '0001'))
);
create index if not exists rh_estab_empresa on public.rh_estabelecimentos (empresa_id, nr_insc);

-- Regras que olham para o empregador (S-1000) da mesma Empresa:
--  · CNPJ do estabelecimento precisa ter a MESMA raiz do empregador (senão é outra Empresa → grupo)
--  · MEI (classTrib 04) só pode ter estabelecimento CNPJ
--  · entidade educativa de aprendiz precisa ter CNPJ válido e raiz DIFERENTE do empregador
create or replace function public.rh_estab_confere_empregador()
returns trigger language plpgsql set search_path to 'public' as $$
declare emp record; e text;
begin
  select tp_insc, nr_insc, class_trib into emp from public.rh_empregador
   where empresa_id = new.empresa_id and ini_valid <= new.ini_valid and (fim_valid is null or fim_valid >= new.ini_valid)
   order by ini_valid desc limit 1;
  if not found then
    raise exception 'Cadastre primeiro os dados do empregador (S-1000) válidos em %', new.ini_valid using errcode = '23514';
  end if;
  if new.tp_insc = 1 and emp.tp_insc = 1 and left(new.nr_insc, 8) <> left(emp.nr_insc, 8) then
    raise exception 'CNPJ % tem outra raiz: é outra Empresa. Cadastre-a no Axioma e ligue as duas pelo grupo.', new.nr_insc using errcode = '23514';
  end if;
  if emp.class_trib = '04' and new.tp_insc <> 1 then
    raise exception 'MEI só pode ter estabelecimento com CNPJ (regra do S-1005)' using errcode = '23514';
  end if;
  if new.apr_entidades_educ is not null then
    foreach e in array new.apr_entidades_educ loop
      if not public.rh_cnpj_valido(e) or (emp.tp_insc = 1 and left(e, 8) = left(emp.nr_insc, 8)) then
        raise exception 'Entidade educativa % inválida (CNPJ inválido ou da mesma raiz do empregador)', e using errcode = '23514';
      end if;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists rh_estab_confere_empregador on public.rh_estabelecimentos;
create trigger rh_estab_confere_empregador before insert or update on public.rh_estabelecimentos
  for each row execute function public.rh_estab_confere_empregador();

alter table public.rh_estabelecimentos enable row level security;
drop policy if exists rh_estab_le on public.rh_estabelecimentos;
create policy rh_estab_le on public.rh_estabelecimentos for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists rh_estab_insere on public.rh_estabelecimentos;
create policy rh_estab_insere on public.rh_estabelecimentos for insert to authenticated with check (public.rh_pode(empresa_id, 'editar'));
drop policy if exists rh_estab_altera on public.rh_estabelecimentos;
create policy rh_estab_altera on public.rh_estabelecimentos for update to authenticated
  using (public.rh_pode(empresa_id, 'editar')) with check (public.rh_pode(empresa_id, 'editar'));
drop policy if exists rh_estab_apaga on public.rh_estabelecimentos;
create policy rh_estab_apaga on public.rh_estabelecimentos for delete to authenticated
  using (public.rh_pode(empresa_id, 'editar') and situacao_esocial = 'rascunho');
-- ═════ FIM BLOCO 2 ═════

-- ═════ BLOCO 3 — o centro de custo ligado precisa ser da MESMA Empresa ═════
create or replace function public.rh_estab_confere_centro()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.centro_custo_id is not null and not exists
     (select 1 from public.centros_custo c where c.id = new.centro_custo_id and c.empresa_id = new.empresa_id) then
    raise exception 'O centro de custo escolhido não é desta Empresa' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_estab_confere_centro on public.rh_estabelecimentos;
create trigger rh_estab_confere_centro before insert or update of centro_custo_id, empresa_id on public.rh_estabelecimentos
  for each row execute function public.rh_estab_confere_centro();
-- ═════ FIM BLOCO 3 ═════

-- ═════ BLOCO 4 — grupo de Empresas (CNPJs de raízes diferentes do mesmo dono) ═════
-- O grupo é do usuário que o criou. Só entra no grupo uma Empresa da qual esse usuário é DONO.
-- Cada Empresa fica em no máximo 1 grupo. O grupo não junta dados: só diz quais Empresas andam juntas
-- (os relatórios consolidados virão depois e vão respeitar a permissão de cada Empresa).
create table if not exists public.grupos_empresariais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  nome text not null check (char_length(nome) between 1 and 120),
  created_at timestamptz not null default now()
);
create table if not exists public.grupo_empresas (
  grupo_id uuid not null references public.grupos_empresariais(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (grupo_id, empresa_id),
  constraint grupo_empresas_uma_vez unique (empresa_id)
);
alter table public.grupos_empresariais enable row level security;
alter table public.grupo_empresas enable row level security;
drop policy if exists grupos_dono on public.grupos_empresariais;
create policy grupos_dono on public.grupos_empresariais for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists grupo_empresas_le on public.grupo_empresas;
create policy grupo_empresas_le on public.grupo_empresas for select to authenticated
  using (empresa_id in (select public.empresas_do_usuario_operacional()));
drop policy if exists grupo_empresas_insere on public.grupo_empresas;
create policy grupo_empresas_insere on public.grupo_empresas for insert to authenticated
  with check (public.meu_papel(empresa_id) = 'dono'
              and exists (select 1 from public.grupos_empresariais g where g.id = grupo_id and g.user_id = (select auth.uid())));
drop policy if exists grupo_empresas_apaga on public.grupo_empresas;
create policy grupo_empresas_apaga on public.grupo_empresas for delete to authenticated
  using (public.meu_papel(empresa_id) = 'dono'
         and exists (select 1 from public.grupos_empresariais g where g.id = grupo_id and g.user_id = (select auth.uid())));
-- ═════ FIM BLOCO 4 ═════
