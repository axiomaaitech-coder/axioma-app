-- RH · Lixeira de 60 dias da estrutura (pedido do Elias, 2026-11-08) — mesmo padrão da lixeira de Contas Vencidas.
-- "Apagar" na tela = mandar para a lixeira (excluido_em/excluido_por). As telas escondem; dá para recuperar por
-- 60 dias; depois a limpeza diária (lib/nexusAuditoria.ts → limparDadosVencidos) apaga de vez.
-- Depende do dado: o que JÁ FOI ENVIADO ao eSocial (pelo Axioma ou pelo contador) NÃO vai para a lixeira —
-- no governo, tirar exige um evento de exclusão; aqui o caminho é dar fim de validade.
-- Os nomes/períodos repetidos passam a valer só entre os itens que NÃO estão na lixeira.
-- Mexe só nas tabelas novas do RH (todas vazias). Pode rodar de novo sem erro.

-- ═════ BLOCO 1 — colunas da lixeira ═════
alter table public.rh_empregador        add column if not exists excluido_em timestamptz, add column if not exists excluido_por uuid;
alter table public.rh_rubricas          add column if not exists excluido_em timestamptz, add column if not exists excluido_por uuid;
alter table public.rh_estabelecimentos  add column if not exists excluido_em timestamptz, add column if not exists excluido_por uuid;
alter table public.rh_lotacoes          add column if not exists excluido_em timestamptz, add column if not exists excluido_por uuid;
alter table public.rh_departamentos     add column if not exists excluido_em timestamptz, add column if not exists excluido_por uuid;
alter table public.rh_cargos            add column if not exists excluido_em timestamptz, add column if not exists excluido_por uuid;
-- ═════ FIM BLOCO 1 ═════

-- ═════ BLOCO 2 — o que foi enviado ao eSocial não vai para a lixeira ═════
alter table public.rh_empregador       drop constraint if exists rh_empregador_lixeira_rascunho;
alter table public.rh_empregador       add constraint rh_empregador_lixeira_rascunho check (excluido_em is null or situacao_esocial = 'rascunho');
alter table public.rh_rubricas         drop constraint if exists rh_rubricas_lixeira_rascunho;
alter table public.rh_rubricas         add constraint rh_rubricas_lixeira_rascunho check (excluido_em is null or situacao_esocial = 'rascunho');
alter table public.rh_estabelecimentos drop constraint if exists rh_estab_lixeira_rascunho;
alter table public.rh_estabelecimentos add constraint rh_estab_lixeira_rascunho check (excluido_em is null or situacao_esocial = 'rascunho');
alter table public.rh_lotacoes         drop constraint if exists rh_lot_lixeira_rascunho;
alter table public.rh_lotacoes         add constraint rh_lot_lixeira_rascunho check (excluido_em is null or situacao_esocial = 'rascunho');
-- ═════ FIM BLOCO 2 ═════

-- ═════ BLOCO 3 — "não repetir" só entre os itens fora da lixeira (mesmos nomes de trava, para as mensagens da tela) ═════
alter table public.rh_empregador drop constraint if exists rh_empregador_periodo;
create unique index if not exists rh_empregador_periodo on public.rh_empregador (empresa_id, ini_valid) where excluido_em is null;
alter table public.rh_rubricas drop constraint if exists rh_rubricas_periodo;
create unique index if not exists rh_rubricas_periodo on public.rh_rubricas (empresa_id, ide_tab_rubr, cod_rubr, ini_valid) where excluido_em is null;
alter table public.rh_estabelecimentos drop constraint if exists rh_estab_periodo;
create unique index if not exists rh_estab_periodo on public.rh_estabelecimentos (empresa_id, tp_insc, nr_insc, ini_valid) where excluido_em is null;
alter table public.rh_lotacoes drop constraint if exists rh_lot_periodo;
create unique index if not exists rh_lot_periodo on public.rh_lotacoes (empresa_id, cod_lotacao, ini_valid) where excluido_em is null;
alter table public.rh_departamentos drop constraint if exists rh_dep_nome;
create unique index if not exists rh_dep_nome on public.rh_departamentos (empresa_id, nome) where excluido_em is null;
alter table public.rh_cargos drop constraint if exists rh_cargo_nome;
create unique index if not exists rh_cargo_nome on public.rh_cargos (empresa_id, nome) where excluido_em is null;
-- índice da lixeira (lista "recuperar" por Empresa, mais recente primeiro)
create index if not exists rh_dep_lixeira   on public.rh_departamentos (empresa_id, excluido_em desc) where excluido_em is not null;
create index if not exists rh_cargo_lixeira on public.rh_cargos (empresa_id, excluido_em desc) where excluido_em is not null;
-- ═════ FIM BLOCO 3 ═════

-- ═════ BLOCO 4 — quem manda para a lixeira fica registrado; o empregador/filial ativos ignoram itens na lixeira ═════
create or replace function public.rh_lixeira_marca()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.excluido_em is not null and old.excluido_em is null then new.excluido_por := auth.uid();
  elsif new.excluido_em is null then new.excluido_por := null; end if;
  return new;
end $$;
do $$ declare t text;
begin
  foreach t in array array['rh_empregador','rh_rubricas','rh_estabelecimentos','rh_lotacoes','rh_departamentos','rh_cargos'] loop
    execute format('drop trigger if exists rh_lixeira_marca on public.%I', t);
    execute format('create trigger rh_lixeira_marca before update of excluido_em on public.%I for each row execute function public.rh_lixeira_marca()', t);
  end loop;
end $$;

-- Filial e lotação conferem o empregador válido no mês — sem contar o que está na lixeira.
create or replace function public.rh_estab_confere_empregador()
returns trigger language plpgsql set search_path to 'public' as $$
declare emp record; e text;
begin
  if new.excluido_em is not null then return new; end if;   -- indo para a lixeira: nada a conferir
  select tp_insc, nr_insc, class_trib into emp from public.rh_empregador
   where empresa_id = new.empresa_id and excluido_em is null and ini_valid <= new.ini_valid and (fim_valid is null or fim_valid >= new.ini_valid)
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

create or replace function public.rh_lotacao_confere()
returns trigger language plpgsql set search_path to 'public' as $$
declare classe text; tercs int := new.cod_tercs::int;
begin
  if new.excluido_em is not null then return new; end if;
  select class_trib into classe from public.rh_empregador
   where empresa_id = new.empresa_id and excluido_em is null and ini_valid <= new.ini_valid and (fim_valid is null or fim_valid >= new.ini_valid)
   order by ini_valid desc limit 1;
  if classe is null then
    raise exception 'Cadastre primeiro os dados do empregador (S-1000) válidos em %', new.ini_valid using errcode = '23514';
  end if;
  if not coalesce((select permitido from public.esocial_tab12_lotacao_class_trib
                   where tp_lotacao = new.tp_lotacao and class_trib = classe), false) then
    raise exception 'Tipo de lotação % não é permitido para a classificação tributária % (Tabela 12)', new.tp_lotacao, classe using errcode = '23514';
  end if;
  if not exists (select 1 from public.esocial_tab04_fpas where fpas = new.fpas) then
    raise exception 'FPAS % não existe na Tabela 04', new.fpas using errcode = '23514';
  end if;
  if classe in ('01','02','03','04') then
    if new.cod_tercs <> '0000' then
      raise exception 'Empresa do Simples/MEI (classificação %) informa Terceiros 0000', classe using errcode = '23514';
    end if;
  elsif not exists (select 1 from public.esocial_tab04_fpas where fpas = new.fpas and (tercs & ~terceiros_total) = 0) then
    raise exception 'Código de Terceiros % não cabe no FPAS % (Tabela 04)', new.cod_tercs, new.fpas using errcode = '23514';
  end if;
  return new;
end $$;
-- ═════ FIM BLOCO 4 ═════
