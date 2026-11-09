-- RH-18 — Rescisão e desligamento (S-1010 verbas da empresa e S-2299). Decisão do Elias (09/11/2026): o Axioma calcula a rescisão.
-- 1) Motor de regras: valores da lei com fonte e vigência (rh_regras) — o cálculo lê daqui, não do código.
-- 2) rh_desligamentos: o que foi informado + o resultado do cálculo guardado como foi feito.
-- 3) Verbas padrão do Axioma para a rescisão (S-1010), em rascunho para o contador conferir antes do primeiro envio.
-- 4) Arquivos do S-1010 e do S-2299 no mesmo histórico de arquivos (rh_esocial_eventos).

-- ═════ BLOCO 1 — regras da lei (INSS, IRRF) com fonte e vigência ═════
create table if not exists public.rh_regras (
  id uuid primary key default gen_random_uuid(),
  chave text not null check (chave in ('folha')),
  vigencia_inicio date not null,
  vigencia_fim date,
  valor jsonb not null,
  fonte text not null,
  conferido_em date,
  situacao text not null default 'ativa' check (situacao in ('ativa','em_teste')),
  constraint rh_regras_vigencia unique (chave, vigencia_inicio),
  constraint rh_regras_fim check (vigencia_fim is null or vigencia_fim >= vigencia_inicio)
);
alter table public.rh_regras enable row level security;
drop policy if exists le on public.rh_regras;
create policy le on public.rh_regras for select to authenticated using (true);
-- sem regra de gravação: só pelo SQL (quem atualiza a lei é a equipe do Axioma, com fonte)
insert into public.rh_regras (chave, vigencia_inicio, valor, fonte, conferido_em) values ('folha', '2026-01-01', '{
  "inss": [{"ate": 1621.00, "aliq": 0.075}, {"ate": 2902.84, "aliq": 0.09}, {"ate": 4354.27, "aliq": 0.12}, {"ate": 8475.55, "aliq": 0.14}],
  "irrf": [{"ate": 2428.80, "aliq": 0, "deduzir": 0}, {"ate": 2826.65, "aliq": 0.075, "deduzir": 182.16}, {"ate": 3751.05, "aliq": 0.15, "deduzir": 394.16},
           {"ate": 4664.68, "aliq": 0.225, "deduzir": 675.49}, {"ate": null, "aliq": 0.275, "deduzir": 908.73}],
  "irrfDependente": 189.59, "irrfSimplificado": 607.20,
  "reducao": {"isentoAte": 5000, "faixaAte": 7350, "a": 978.62, "b": 0.133145},
  "irrfMinimo": 10,
  "fonte": "Portaria Interministerial MPS/MF nº 13/2026 (INSS) · Receita Federal, Tributação de 2026 e Lei 15.270/2025 (IRRF)"
}'::jsonb, 'Portaria Interministerial MPS/MF nº 13/2026; Receita Federal — Tributação de 2026; Lei 15.270/2025', '2026-11-09')
on conflict (chave, vigencia_inicio) do nothing;

-- ═════ BLOCO 2 — desligamentos ═════
create table if not exists public.rh_desligamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  contrato_id uuid not null unique references public.rh_contratos(id) on delete cascade,
  mtv_deslig text not null check (mtv_deslig in ('01','02','03','04','05','06','07','08','09','10','17','26','27','33','38','41','42','47','48','49')),
  dt_deslig date not null,
  aviso text check (aviso in ('indenizado','trabalhado','descontado','dispensado')),
  dt_aviso date,
  ferias_vencidas smallint not null default 0 check (ferias_vencidas between 0 and 2),
  faltas smallint not null default 0 check (faltas >= 0),
  media_variaveis numeric(14,2) not null default 0 check (media_variaveis >= 0),
  adiantamento_13 numeric(14,2) not null default 0 check (adiantamento_13 >= 0),
  descontar_480 boolean not null default false,
  saldo_fgts numeric(14,2) check (saldo_fgts >= 0),
  dependentes_ir smallint not null default 0 check (dependentes_ir between 0 and 99),
  resultado jsonb not null,                 -- o cálculo como foi feito (verbas, impostos, FGTS, avisos, regra usada)
  situacao text not null default 'calculado' check (situacao in ('calculado','preparado','enviado_pelo_contador','aceito','recusado')),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  constraint rh_deslig_aviso_data check (dt_aviso is null or dt_aviso <= dt_deslig)
);
create index if not exists rh_deslig_empresa on public.rh_desligamentos (empresa_id, dt_deslig desc);
drop trigger if exists rh_deslig_empresa on public.rh_desligamentos;
create trigger rh_deslig_empresa before insert or update of contrato_id, empresa_id on public.rh_desligamentos
  for each row execute function public.rh_confere_mesma_empresa('rh_contratos', 'contrato_id');
alter table public.rh_desligamentos enable row level security;
-- tem salário e dados pessoais: mesma liberação do arquivo do eSocial
drop policy if exists le on public.rh_desligamentos;
create policy le on public.rh_desligamentos for select to authenticated using (public.rh_pode(empresa_id, 'pessoais') and public.rh_pode(empresa_id, 'salario'));
drop policy if exists grava on public.rh_desligamentos;
create policy grava on public.rh_desligamentos for all to authenticated
  using (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais') and public.rh_pode(empresa_id, 'salario'))
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais') and public.rh_pode(empresa_id, 'salario'));
-- depois de preparado o S-2299, o cálculo não muda (prepare de novo só se o contador recusar)
create or replace function public.rh_deslig_trava()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if tg_op = 'DELETE' then
    if old.situacao <> 'calculado' then raise exception 'Desligamento já preparado para o eSocial: não pode ser desfeito aqui.' using errcode = '23514'; end if;
    return old;
  end if;
  if old.situacao in ('preparado','enviado_pelo_contador','aceito')
     and (to_jsonb(new) - array['situacao','updated_at']) is distinct from (to_jsonb(old) - array['situacao','updated_at']) then
    raise exception 'Desligamento já preparado para o eSocial: o cálculo não muda.' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_deslig_trava on public.rh_desligamentos;
create trigger rh_deslig_trava before update or delete on public.rh_desligamentos for each row execute function public.rh_deslig_trava();

-- ═════ BLOCO 3 — verbas padrão do Axioma para a rescisão (S-1010), em rascunho ═════
-- Incidências: CP 11/12 base mensal/13º, 31/32 desconto do segurado; IRRF (Tabela 21) 11/12 base, 31/32 retenção, 41/42 dedução INSS,
-- 74 indenização rescisória isenta, 79 outras isenções (férias indenizadas), 9 natureza diversa; FGTS 11/12 base, 21 aviso indenizado.
create or replace function public.rh_rubricas_padrao(p_empresa uuid)
returns integer language plpgsql set search_path to 'public' as $$
declare n integer;
begin
  insert into rh_rubricas (empresa_id, cod_rubr, ide_tab_rubr, ini_valid, dsc_rubr, nat_rubr, tp_rubr, cod_inc_cp, cod_inc_irrf, cod_inc_fgts, observacao)
  select p_empresa, x.cod, 'AXIOMA', '2025-01', x.dsc, x.nat, x.tp, x.cp, x.ir, x.fg, 'Padrão Axioma para rescisão — conferir com o contador antes do primeiro envio'
  from (values
    ('AX6000',  'Saldo de salário na rescisão',              '6000', 1, '11', '11', '11'),
    ('AX6001',  '13º salário sobre o aviso prévio indenizado','6001', 1, '12', '12', '12'),
    ('AX6002',  '13º salário proporcional na rescisão',      '6002', 1, '12', '12', '12'),
    ('AX6003',  'Aviso prévio indenizado',                   '6003', 1, '00', '74', '21'),
    ('AX6004',  'Férias em dobro na rescisão + 1/3',         '6004', 1, '00', '79', '00'),
    ('AX6006',  'Férias proporcionais indenizadas + 1/3',    '6006', 1, '00', '79', '00'),
    ('AX6007',  'Férias vencidas indenizadas + 1/3',         '6007', 1, '00', '79', '00'),
    ('AX6104',  'Indenização do art. 479 da CLT',            '6104', 1, '00', '74', '00'),
    ('AX6901',  'Desconto do aviso prévio não cumprido',     '6901', 2, '00', '9',  '00'),
    ('AX6904',  'Desconto do art. 480 da CLT',               '6904', 2, '00', '9',  '00'),
    ('AX9214',  'Desconto do adiantamento do 13º salário',   '9214', 2, '00', '9',  '00'),
    ('AX9201M', 'INSS do empregado — mensal',                '9201', 2, '31', '41', '00'),
    ('AX9201D', 'INSS do empregado — 13º salário',           '9201', 2, '32', '42', '00'),
    ('AX9203M', 'Imposto de Renda retido — mensal',          '9203', 2, '00', '31', '00'),
    ('AX9203D', 'Imposto de Renda retido — 13º salário',     '9203', 2, '00', '32', '00')
  ) as x(cod, dsc, nat, tp, cp, ir, fg)
  on conflict (empresa_id, ide_tab_rubr, cod_rubr, ini_valid) where excluido_em is null do nothing;   -- índice parcial da lixeira (RH-5)
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.rh_rubricas_padrao(uuid) to authenticated;   -- roda com a liberação de quem chama (RLS de rh_rubricas: editar)

-- ═════ BLOCO 4 — arquivos do S-1010 (por verba, sem contrato) e do S-2299 no mesmo histórico ═════
alter table public.rh_esocial_eventos alter column contrato_id drop not null;
alter table public.rh_esocial_eventos add column if not exists rubrica_id uuid references public.rh_rubricas(id) on delete cascade;
alter table public.rh_esocial_eventos drop constraint if exists rh_esocial_eventos_evento_check;
alter table public.rh_esocial_eventos add constraint rh_esocial_eventos_evento_check check (evento in ('S-1010','S-2200','S-2205','S-2206','S-2299'));
alter table public.rh_esocial_eventos drop constraint if exists rh_esocial_evento_dono;
alter table public.rh_esocial_eventos add constraint rh_esocial_evento_dono check ((evento = 'S-1010') = (contrato_id is null and rubrica_id is not null));
drop trigger if exists rh_esocial_evento_rubrica on public.rh_esocial_eventos;
create trigger rh_esocial_evento_rubrica before insert on public.rh_esocial_eventos
  for each row execute function public.rh_confere_mesma_empresa('rh_rubricas', 'rubrica_id');

-- ═════ CONFERÊNCIA (esperado: 1 · 1 · 1 · 1 · 2) ═════
select (select count(*) from public.rh_regras where chave = 'folha' and vigencia_inicio = '2026-01-01') as regras_2026,
       (select count(*) from pg_tables where tablename = 'rh_desligamentos') as desligamentos,
       (select count(*) from pg_proc where proname = 'rh_rubricas_padrao') as funcao_verbas,
       (select count(*) from information_schema.columns where table_name = 'rh_esocial_eventos' and column_name = 'rubrica_id') as evento_rubrica,
       (select count(*) from pg_trigger where tgname in ('rh_deslig_trava','rh_esocial_evento_rubrica')) as gatilhos;
