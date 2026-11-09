-- RH-14 — Admissão preparada para o eSocial (S-2200, leiaute S-1.3 cons. NT 07/2026 rev., esquema XSD de 26/10/2026)
-- Decisões do Elias (08/11/2026): o contador envia ao governo na v1; o Axioma prepara o arquivo. O sindicato fica na filial
-- (estabelecimento) e pode ser trocado no contrato (categoria diferenciada). Só colunas e uma tabela novas; nada é apagado.

-- ═════ BLOCO 1 — sindicato na filial e no contrato ═════
alter table public.rh_estabelecimentos add column if not exists cnpj_sindicato text;
alter table public.rh_estabelecimentos drop constraint if exists rh_estab_sindicato;
alter table public.rh_estabelecimentos add constraint rh_estab_sindicato check (cnpj_sindicato is null or public.rh_cnpj_valido(cnpj_sindicato));

-- ═════ BLOCO 2 — campos do S-2200 que faltavam no contrato ═════
alter table public.rh_contratos
  add column if not exists cnpj_sindicato text,                       -- vazio = usa o da filial
  add column if not exists tp_reg_jor smallint not null default 1,    -- 1 horário · 2 externo (art. 62 I) · 3 gestão (art. 62 II) · 4 teletrabalho (art. 62 III)
  add column if not exists nat_atividade smallint not null default 1, -- 1 urbano · 2 rural
  add column if not exists tmp_parc smallint not null default 0,      -- 0 não · 1 até 25h (só doméstico) · 2 até 30h · 3 até 26h
  add column if not exists hor_noturno boolean,
  add column if not exists dsc_jorn text,                             -- dias e horários (entrada, saída, intervalos)
  add column if not exists clau_assec boolean,                        -- só prazo determinado (tpContr 2 ou 3)
  add column if not exists obj_det text,                              -- só prazo vinculado a fato (tpContr 3)
  add column if not exists data_base smallint,                        -- mês da data-base da categoria (opcional)
  add column if not exists dsc_sal_var text;                          -- só salário por tarefa ou só variável
alter table public.rh_contratos drop constraint if exists rh_contrato_s2200;
alter table public.rh_contratos add constraint rh_contrato_s2200 check (
      (cnpj_sindicato is null or public.rh_cnpj_valido(cnpj_sindicato))
  and tp_reg_jor in (1,2,3,4) and nat_atividade in (1,2) and tmp_parc in (0,1,2,3)
  and (tmp_parc <> 1 or cod_categ = '104') and (tmp_parc not in (2,3) or cod_categ <> '104')
  and (cod_categ <> '104' or nat_atividade = 1) and (cod_categ <> '102' or nat_atividade = 2)
  and (dsc_jorn is null or char_length(dsc_jorn) between 1 and 999)
  and (clau_assec is null or tp_contr in (2,3))
  and ((tp_contr = 3) = (obj_det is not null)) and (obj_det is null or char_length(obj_det) between 1 and 255)
  and (data_base is null or data_base between 1 and 12)
  and (dsc_sal_var is null or char_length(dsc_sal_var) between 1 and 999)
) not valid;   -- não valid: contratos antigos tp_contr 3 sem objeto ficam como estão; os novos já entram certos

-- ═════ BLOCO 3 — município (código IBGE) no endereço da pessoa ═════
alter table public.rh_colaborador_pessoal add column if not exists cod_munic text;
alter table public.rh_colaborador_pessoal drop constraint if exists rh_pessoal_cod_munic;
alter table public.rh_colaborador_pessoal add constraint rh_pessoal_cod_munic check (cod_munic is null or cod_munic ~ '^[0-9]{7}$');

-- ═════ BLOCO 4 — arquivos preparados (histórico que só cresce) ═════
create table if not exists public.rh_esocial_eventos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  contrato_id uuid not null references public.rh_contratos(id) on delete cascade,
  evento text not null check (evento in ('S-2200')),
  id_evento text not null check (id_evento ~ '^ID[0-9][A-Z0-9]{12}[0-9]{21}$'),   -- padrão oficial TS_Id (XSD): ID + tipo + inscrição (CNPJ pode ter letras desde 07/2026) + data/hora + sequência
  versao_leiaute text not null,
  xml text not null check (char_length(xml) between 100 and 200000),
  criado_em timestamptz not null default now(),
  criado_por uuid default auth.uid(),
  constraint rh_esocial_evento_id unique (empresa_id, id_evento)
);
create index if not exists rh_esocial_eventos_contrato on public.rh_esocial_eventos (empresa_id, contrato_id, criado_em desc);
drop trigger if exists rh_esocial_evento_empresa on public.rh_esocial_eventos;
create trigger rh_esocial_evento_empresa before insert on public.rh_esocial_eventos
  for each row execute function public.rh_confere_mesma_empresa('rh_contratos', 'contrato_id');
alter table public.rh_esocial_eventos enable row level security;
drop policy if exists le on public.rh_esocial_eventos;
create policy le on public.rh_esocial_eventos for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists insere on public.rh_esocial_eventos;
create policy insere on public.rh_esocial_eventos for insert to authenticated with check (public.rh_pode(empresa_id, 'editar'));
-- sem alterar e sem apagar: o arquivo entregue ao contador fica guardado como foi gerado

-- ═════ BLOCO 5 — trava do contrato depois de preparado/enviado ═════
-- preparado + qualquer dado da admissão mudou → volta a rascunho (o arquivo antigo deixou de valer)
-- enviado/aceito/enviado pelo contador → dados da admissão não mudam aqui (alteração é outro evento, S-2206)
create or replace function public.rh_contrato_trava_esocial()
returns trigger language plpgsql set search_path to 'public' as $$
declare mudou boolean;
begin
  mudou := (to_jsonb(new) - array['situacao_esocial','recibo_esocial','data_desligamento','gestor_id','centro_custo_id','departamento_id','lotacao_id'])
        is distinct from (to_jsonb(old) - array['situacao_esocial','recibo_esocial','data_desligamento','gestor_id','centro_custo_id','departamento_id','lotacao_id']);
  if not mudou then return new; end if;
  if old.situacao_esocial in ('enviado','aceito','enviado_pelo_contador') then
    raise exception 'Esta admissão já foi enviada ao eSocial: os dados dela não mudam aqui. A alteração de contrato (S-2206) chega numa próxima etapa.' using errcode = '23514';
  end if;
  if old.situacao_esocial = 'preparado' and new.situacao_esocial = 'preparado' then new.situacao_esocial := 'rascunho'; end if;
  return new;
end $$;
drop trigger if exists rh_contrato_trava_esocial on public.rh_contratos;
create trigger rh_contrato_trava_esocial before update on public.rh_contratos
  for each row execute function public.rh_contrato_trava_esocial();

-- ═════ CONFERÊNCIA (esperado: 1 · 10 · 1 · 1 · 1 · N = contratos já enviados; em 08/11/2026 deu 2: Ana e Carla, exemplos da Horizonte) ═════
-- Rodado em 08/11/2026. A regra rh_contrato_s2200 foi ajustada depois em RH-14B.
select (select count(*) from information_schema.columns where table_name = 'rh_estabelecimentos' and column_name = 'cnpj_sindicato') as filial_sindicato,
       (select count(*) from information_schema.columns where table_name = 'rh_contratos' and column_name in
          ('cnpj_sindicato','tp_reg_jor','nat_atividade','tmp_parc','hor_noturno','dsc_jorn','clau_assec','obj_det','data_base','dsc_sal_var')) as contrato_campos,
       (select count(*) from information_schema.columns where table_name = 'rh_colaborador_pessoal' and column_name = 'cod_munic') as cod_munic,
       (select count(*) from pg_tables where tablename = 'rh_esocial_eventos') as tabela_eventos,
       (select count(*) from pg_trigger where tgname = 'rh_contrato_trava_esocial') as trava,
       (select count(*) from public.rh_contratos where situacao_esocial <> 'rascunho') as contratos_nao_rascunho;
