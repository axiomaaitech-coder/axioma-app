-- RH-15 — S-2200 completo para todas as categorias de empregado em vigor (101, 102, 103, 104, 105, 106, 111):
-- pessoa com deficiência (dado de SAÚDE — LGPD art. 11: só quem tem liberação de saúde), dependentes (Tabela 07),
-- trabalhador imigrante, aprendiz, temporário (Lei 6.019/1974) e local de trabalho do doméstico/temporário.
-- Fonte: leiaute S-1.3 cons. NT 07/2026 rev. e Tabela 07 (gov.br/esocial), conferidos em 08/11/2026.
-- 107/108 (Verde e Amarelo) foram encerradas pelo governo em 31/12/2022. Só tabelas/colunas novas; nada é apagado.

-- ═════ BLOCO 1 — Tabela 07 (tipos de dependente) ═════
create table if not exists public.esocial_tab07_dependente (
  codigo text primary key check (codigo ~ '^[0-9]{2}$'),
  descricao text not null,
  inicio date not null,
  termino date
);
alter table public.esocial_tab07_dependente enable row level security;
drop policy if exists le on public.esocial_tab07_dependente;
create policy le on public.esocial_tab07_dependente for select to authenticated using (true);
insert into public.esocial_tab07_dependente (codigo, descricao, inicio, termino) values
  ('01','Cônjuge','2014-01-01',null),
  ('02','Companheiro(a) com o(a) qual tenha filho ou viva há mais de 5 (cinco) anos ou possua declaração de união estável','2018-01-08',null),
  ('03','Filho(a) ou enteado(a)','2018-01-08',null),
  ('04','Filho(a) ou enteado(a), universitário(a) ou cursando escola técnica de 2º grau','2018-01-08','2023-04-25'),
  ('06','Irmão(ã), neto(a) ou bisneto(a) sem arrimo dos pais, do(a) qual detenha a guarda judicial','2018-01-08',null),
  ('07','Irmão(ã), neto(a) ou bisneto(a) sem arrimo dos pais, universitário(a) ou cursando escola técnica de 2° grau, do(a) qual detenha a guarda judicial','2018-01-08','2023-04-25'),
  ('09','Pais, avós e bisavós','2014-01-01',null),
  ('10','Menor pobre do qual detenha a guarda judicial','2018-01-08',null),
  ('11','A pessoa absolutamente incapaz, da qual seja tutor ou curador','2014-01-01',null),
  ('12','Ex-cônjuge','2018-01-08',null),
  ('99','Agregado/Outros','2014-01-01',null)
on conflict (codigo) do update set descricao = excluded.descricao, inicio = excluded.inicio, termino = excluded.termino;

-- ═════ BLOCO 2 — pessoa com deficiência (saúde) ═════
create table if not exists public.rh_colaborador_pcd (
  colaborador_id uuid primary key references public.rh_colaboradores(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  def_fisica boolean not null default false,
  def_visual boolean not null default false,
  def_auditiva boolean not null default false,
  def_mental boolean not null default false,
  def_intelectual boolean not null default false,
  reab_readap boolean not null default false,          -- reabilitado pelo INSS
  info_cota boolean,                                   -- conta na cota de PCD/reabilitados (o eSocial pede só p/ admissão antes de 26/10/2026)
  observacao text check (char_length(observacao) between 1 and 255),
  updated_at timestamptz not null default now(),
  constraint rh_pcd_cota check (info_cota is not true or def_fisica or def_visual or def_auditiva or def_mental or def_intelectual or reab_readap)
);
create index if not exists rh_pcd_empresa on public.rh_colaborador_pcd (empresa_id);
drop trigger if exists rh_pcd_empresa on public.rh_colaborador_pcd;
create trigger rh_pcd_empresa before insert or update of colaborador_id, empresa_id on public.rh_colaborador_pcd
  for each row execute function public.rh_confere_mesma_empresa('rh_colaboradores', 'colaborador_id');
alter table public.rh_colaborador_pcd enable row level security;
drop policy if exists le on public.rh_colaborador_pcd;
create policy le on public.rh_colaborador_pcd for select to authenticated using (public.rh_pode(empresa_id, 'saude'));
drop policy if exists grava on public.rh_colaborador_pcd;
create policy grava on public.rh_colaborador_pcd for all to authenticated
  using (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'saude'))
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'saude'));

-- ═════ BLOCO 3 — dependentes (dados pessoais) ═════
create table if not exists public.rh_dependentes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  colaborador_id uuid not null references public.rh_colaboradores(id) on delete cascade,
  tp_dep text references public.esocial_tab07_dependente(codigo),
  nome text not null check (char_length(btrim(nome)) between 2 and 70),
  data_nascimento date not null check (data_nascimento >= date '1890-01-01'),
  cpf text check (cpf is null or public.rh_cpf_valido(cpf)),
  dep_irrf boolean not null default false,   -- deduz no Imposto de Renda
  dep_sf boolean not null default false,     -- salário-família
  inc_trab boolean not null default false,   -- incapaz para o trabalho
  descr_dep text check (char_length(descr_dep) between 1 and 100),
  excluido_em timestamptz,
  excluido_por uuid,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint rh_dep_irrf check (not dep_irrf or (cpf is not null and tp_dep is not null)),
  constraint rh_dep_outros check ((tp_dep = '99') = (descr_dep is not null))
);
create index if not exists rh_dep_colab on public.rh_dependentes (empresa_id, colaborador_id);
create unique index if not exists rh_dep_cpf on public.rh_dependentes (colaborador_id, cpf) where cpf is not null and excluido_em is null;
drop trigger if exists rh_dep_empresa on public.rh_dependentes;
create trigger rh_dep_empresa before insert or update of colaborador_id, empresa_id on public.rh_dependentes
  for each row execute function public.rh_confere_mesma_empresa('rh_colaboradores', 'colaborador_id');
alter table public.rh_dependentes enable row level security;
drop policy if exists le on public.rh_dependentes;
create policy le on public.rh_dependentes for select to authenticated using (public.rh_pode(empresa_id, 'pessoais'));
drop policy if exists insere on public.rh_dependentes;
create policy insere on public.rh_dependentes for insert to authenticated
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais'));
drop policy if exists altera on public.rh_dependentes;
create policy altera on public.rh_dependentes for update to authenticated
  using (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais'))
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais'));
-- sem apagar de vez: tirar um dependente marca excluido_em (fica no histórico)

-- ═════ BLOCO 4 — trabalhador imigrante (dados pessoais) ═════
alter table public.rh_colaborador_pessoal
  add column if not exists imig_tmp_resid smallint,   -- 1 prazo indeterminado · 2 prazo determinado
  add column if not exists imig_cond_ing smallint;    -- 1 refugiado … 7 outra condição
alter table public.rh_colaborador_pessoal drop constraint if exists rh_pessoal_imigrante;
alter table public.rh_colaborador_pessoal add constraint rh_pessoal_imigrante check (
      (imig_tmp_resid is null or imig_tmp_resid in (1,2)) and (imig_cond_ing is null or imig_cond_ing between 1 and 7)
  and not (imig_tmp_resid = 1 and imig_cond_ing in (2,5)) and not (imig_tmp_resid = 2 and imig_cond_ing = 1));

-- ═════ BLOCO 5 — contrato: aprendiz, temporário e local de trabalho do doméstico/temporário ═════
alter table public.rh_contratos
  add column if not exists apr_ind smallint,                 -- 1 contratação direta · 2 indireta
  add column if not exists apr_cnpj_ent_qual text,           -- direta: entidade qualificadora
  add column if not exists apr_tp_insc smallint,             -- indireta: 1 CNPJ · 2 CPF do estabelecimento cumpridor da cota
  add column if not exists apr_nr_insc text,
  add column if not exists apr_cnpj_prat text,               -- onde são feitas as atividades práticas (quando for outro lugar)
  add column if not exists temp_hip_leg smallint,            -- 1 substituição de pessoal · 2 demanda complementar
  add column if not exists temp_just_contr text,
  add column if not exists temp_tomador_tp_insc smallint,    -- 1 CNPJ · 2 CPF de quem contrata o serviço temporário
  add column if not exists temp_tomador_nr_insc text,
  add column if not exists temp_cpf_substituidos text[],     -- até 9 CPFs (só na substituição)
  add column if not exists lt_cep text, add column if not exists lt_logradouro text, add column if not exists lt_numero text,
  add column if not exists lt_complemento text, add column if not exists lt_bairro text, add column if not exists lt_cod_munic text,
  add column if not exists lt_uf text;                       -- endereço de trabalho (doméstico e temporário)
alter table public.rh_contratos drop constraint if exists rh_contrato_s2200_cat;
alter table public.rh_contratos add constraint rh_contrato_s2200_cat check (
      (apr_ind is null or apr_ind in (1,2)) and (apr_cnpj_ent_qual is null or public.rh_cnpj_valido(apr_cnpj_ent_qual))
  and (apr_tp_insc is null or apr_tp_insc in (1,2))
  and (apr_nr_insc is null or (apr_tp_insc = 1 and public.rh_cnpj_valido(apr_nr_insc)) or (apr_tp_insc = 2 and public.rh_cpf_valido(apr_nr_insc)))
  and (apr_cnpj_prat is null or public.rh_cnpj_valido(apr_cnpj_prat))
  and (apr_ind is null or cod_categ = '103')
  and (temp_hip_leg is null or temp_hip_leg in (1,2)) and (temp_just_contr is null or char_length(temp_just_contr) between 1 and 999)
  and (temp_tomador_tp_insc is null or temp_tomador_tp_insc in (1,2))
  and (temp_tomador_nr_insc is null or (temp_tomador_tp_insc = 1 and public.rh_cnpj_valido(temp_tomador_nr_insc)) or (temp_tomador_tp_insc = 2 and public.rh_cpf_valido(temp_tomador_nr_insc)))
  and (temp_cpf_substituidos is null or cardinality(temp_cpf_substituidos) between 1 and 9)
  and (temp_hip_leg is null or cod_categ = '106')
  and (lt_cep is null or lt_cep ~ '^[0-9]{8}$') and (lt_cod_munic is null or lt_cod_munic ~ '^[0-9]{7}$') and (lt_uf is null or lt_uf ~ '^[A-Z]{2}$')
  and (lt_logradouro is null or char_length(lt_logradouro) between 1 and 100) and (lt_numero is null or char_length(lt_numero) between 1 and 10)
  and (lt_complemento is null or char_length(lt_complemento) <= 30) and (lt_bairro is null or char_length(lt_bairro) <= 90)
);
create or replace function public.rh_contrato_cpfs_substituidos()
returns trigger language plpgsql set search_path to 'public' as $$
declare c text;
begin
  foreach c in array coalesce(new.temp_cpf_substituidos, '{}') loop
    if not public.rh_cpf_valido(c) then raise exception 'CPF do trabalhador substituído inválido: %', c using errcode = '23514'; end if;
  end loop;
  return new;
end $$;
drop trigger if exists rh_contrato_cpfs_substituidos on public.rh_contratos;
create trigger rh_contrato_cpfs_substituidos before insert or update of temp_cpf_substituidos on public.rh_contratos
  for each row execute function public.rh_contrato_cpfs_substituidos();

-- ═════ BLOCO 6 — histórico: dependentes entram como "dados pessoais"; PCD como "saúde" (só quem tem saúde vê) ═════
alter table public.rh_historico drop constraint if exists rh_historico_parte_check;
alter table public.rh_historico add constraint rh_historico_parte_check check (parte in ('cadastro','contrato','pessoal','salario','documento','exame','saude'));
drop policy if exists rh_historico_le on public.rh_historico;
create policy rh_historico_le on public.rh_historico for select to authenticated using (
  public.rh_pode(empresa_id, 'ver') and case parte
    when 'pessoal' then public.rh_pode(empresa_id, 'pessoais')
    when 'documento' then public.rh_pode(empresa_id, 'pessoais')
    when 'exame' then public.rh_pode(empresa_id, 'saude')
    when 'saude' then public.rh_pode(empresa_id, 'saude')
    when 'salario' then public.rh_pode(empresa_id, 'salario')
    else true end);
create or replace function public.rh_historico_registra()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  META constant text[] := array['id','empresa_id','colaborador_id','contrato_id','created_at','created_by','updated_at','updated_by','excluido_por','arquivo_path','arquivo_mime','arquivo_bytes'];
  o jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  n jsonb := to_jsonb(new);
  k text; campos text[] := '{}'; a jsonb := '{}'; d jsonb := '{}';
  v_parte text; v_acao text := case when tg_op = 'INSERT' then 'criou' else 'alterou' end; v_colab uuid;
begin
  v_parte := case tg_table_name
    when 'rh_colaboradores' then 'cadastro' when 'rh_contratos' then 'contrato' when 'rh_colaborador_pessoal' then 'pessoal'
    when 'rh_dependentes' then 'pessoal' when 'rh_colaborador_pcd' then 'saude'
    when 'rh_remuneracoes' then 'salario' else n->>'categoria' end;  -- rh_admissao_itens: documento | exame
  if tg_table_name = 'rh_colaboradores' then v_colab := (n->>'id')::uuid;
  elsif tg_table_name = 'rh_remuneracoes' then select c.colaborador_id into v_colab from rh_contratos c where c.id = (n->>'contrato_id')::uuid;
  else v_colab := (n->>'colaborador_id')::uuid; end if;
  for k in select jsonb_object_keys(n) loop
    continue when k = any(META);
    if tg_op = 'INSERT' then
      if n->k <> 'null'::jsonb then campos := campos || k; d := d || jsonb_build_object(k, n->k); end if;
    elsif (o->k) is distinct from (n->k) then
      campos := campos || k; a := a || jsonb_build_object(k, o->k); d := d || jsonb_build_object(k, n->k);
    end if;
  end loop;
  if tg_op = 'UPDATE' and 'excluido_em' = any(campos) then
    v_acao := case when n->>'excluido_em' is null then 'recuperou' else 'lixeira' end;
    campos := array_remove(campos, 'excluido_em');
  end if;
  if tg_op = 'UPDATE' and cardinality(campos) = 0 and v_acao = 'alterou' then return new; end if;
  insert into rh_historico (empresa_id, colaborador_id, parte, acao, campos, antes, depois)
  values ((n->>'empresa_id')::uuid, v_colab, v_parte, v_acao, campos,
    case when v_parte in ('cadastro','contrato') and tg_op = 'UPDATE' then a end,
    case when v_parte in ('cadastro','contrato') then d when v_parte in ('documento','exame') then jsonb_build_object('item', n->>'tipo') end);
  return new;
end $$;
revoke all on function public.rh_historico_registra() from public, anon, authenticated;
drop trigger if exists rh_historico on public.rh_dependentes;
create trigger rh_historico after insert or update on public.rh_dependentes for each row execute function public.rh_historico_registra();
drop trigger if exists rh_historico on public.rh_colaborador_pcd;
create trigger rh_historico after insert or update on public.rh_colaborador_pcd for each row execute function public.rh_historico_registra();

-- ═════ BLOCO 7 — o arquivo do S-2200 agora pode ter deficiência: preparar e ler também exige SAÚDE ═════
drop policy if exists le on public.rh_esocial_eventos;
create policy le on public.rh_esocial_eventos for select to authenticated
  using (public.rh_pode(empresa_id, 'pessoais') and public.rh_pode(empresa_id, 'salario') and public.rh_pode(empresa_id, 'saude'));
drop policy if exists insere on public.rh_esocial_eventos;
create policy insere on public.rh_esocial_eventos for insert to authenticated
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais') and public.rh_pode(empresa_id, 'salario') and public.rh_pode(empresa_id, 'saude'));

-- ═════ CONFERÊNCIA (esperado: 11 · 1 · 1 · 2 · 17 · 4 · 2) ═════
select (select count(*) from public.esocial_tab07_dependente) as tab07,
       (select count(*) from pg_tables where tablename = 'rh_colaborador_pcd') as pcd,
       (select count(*) from pg_tables where tablename = 'rh_dependentes') as dependentes,
       (select count(*) from information_schema.columns where table_name = 'rh_colaborador_pessoal' and column_name like 'imig_%') as imigrante,
       (select count(*) from information_schema.columns where table_name = 'rh_contratos' and (column_name like 'apr_%' or column_name like 'temp_%' or column_name like 'lt_%')) as contrato_campos,
       (select count(*) from pg_trigger where tgname in ('rh_historico') and tgrelid in ('public.rh_dependentes'::regclass, 'public.rh_colaborador_pcd'::regclass))
         + (select count(*) from pg_trigger where tgname in ('rh_pcd_empresa','rh_dep_empresa')) as gatilhos,
       (select count(*) from pg_policies where tablename = 'rh_esocial_eventos' and coalesce(qual, with_check) like '%saude%') as arquivo_exige_saude;
