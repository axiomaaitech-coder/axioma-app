-- AXIOMA OVERDUE INTELLIGENCE — Fase 1 (Data Core). 2026-11-02.
-- Só ACRESCENTA: nenhuma tabela, coluna ou dado existente é apagado/alterado.
-- Origem dos títulos continua sendo contas_receber / contas_pagar (Financeiro). Aqui fica só o que
-- não existia: o "caso" de cada título vencido (causa, disputa, criticidade), o histórico append-only,
-- a configuração por empresa e a foto das previsões (para comparar previsto x realizado).
-- Promessas e acordos REUSAM cobranca_compromissos; contatos REUSAM cobranca_interacoes.
-- Rodar bloco a bloco no SQL Editor (cada bloco é independente e pode rodar de novo sem erro).

-- ═══ BLOCO 1 — caso de cada título vencido (um por título, receber OU pagar) ═══
create table if not exists public.vencido_caso (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  dominio text not null check (dominio in ('receber', 'pagar')),
  conta_receber_id uuid references public.contas_receber(id) on delete restrict,
  conta_pagar_id uuid references public.contas_pagar(id) on delete restrict,
  -- causa do atraso: fato (confirmada) x inferência (sugerida pela IA/regra, não confirmada)
  causa text not null default 'desconhecido' check (causa in ('financeiro','liquidez','divergencia_comercial','entrega','qualidade','nota_fiscal','erro_administrativo','contestacao_contratual','pagamento','desconhecido')),
  causa_origem text not null default 'manual' check (causa_origem in ('manual','ia','regra')),
  causa_confirmada boolean not null default false,
  causa_nota text check (causa_nota is null or char_length(causa_nota) <= 2000),
  -- disputa: valor contestado fica separado do incontroverso; título NUNCA é liquidado/apagado por aqui
  disputa_tipo text check (disputa_tipo is null or disputa_tipo in ('valor','nota_fiscal','entrega','qualidade','devolucao','duplicidade','contrato','desconto')),
  disputa_status text check (disputa_status is null or disputa_status in ('aberta','em_analise','resolvida_favor','resolvida_contra','cancelada')),
  disputa_valor numeric(14,2) not null default 0 check (disputa_valor >= 0),
  disputa_prazo date,
  disputa_responsavel text check (disputa_responsavel is null or char_length(disputa_responsavel) <= 120),
  disputa_evidencias jsonb not null default '[]'::jsonb check (jsonb_typeof(disputa_evidencias) = 'array'),
  -- relação jurídica (encargos): b2b, b2c ou null = deduzir do documento do cliente (CPF = b2c)
  relacao text check (relacao is null or relacao in ('b2b','b2c')),
  estrategia text check (estrategia is null or char_length(estrategia) <= 60),
  -- a pagar: importância operacional do fornecedor para o Supplier Payment Priority Score
  criticidade text check (criticidade is null or criticidade in ('critica','alta','media','baixa')),
  risco_interrupcao boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid default auth.uid(),
  constraint vencido_caso_um_titulo check (
    (dominio = 'receber' and conta_receber_id is not null and conta_pagar_id is null) or
    (dominio = 'pagar' and conta_pagar_id is not null and conta_receber_id is null)),
  constraint vencido_caso_disputa_coerente check (disputa_valor = 0 or disputa_status is not null)
);
-- idempotência: um caso só por título
create unique index if not exists vencido_caso_receber_unico on public.vencido_caso (empresa_id, conta_receber_id) where conta_receber_id is not null;
create unique index if not exists vencido_caso_pagar_unico on public.vencido_caso (empresa_id, conta_pagar_id) where conta_pagar_id is not null;
create index if not exists vencido_caso_lista on public.vencido_caso (empresa_id, dominio, atualizado_em desc);
alter table public.vencido_caso enable row level security;
drop policy if exists vencido_caso_multi_tenant on public.vencido_caso;
create policy vencido_caso_multi_tenant on public.vencido_caso for all
  using (empresa_id in (select public.empresas_do_usuario_operacional()))
  with check (empresa_id in (select public.empresas_do_usuario_operacional()));

-- ═══ BLOCO 2 — o título do caso precisa ser da MESMA empresa (sem caso cruzando empresas) ═══
create or replace function public.vencido_caso_conferir() returns trigger language plpgsql
security definer set search_path = public as $$
declare v_emp uuid;
begin
  if new.dominio = 'receber' then select empresa_id into v_emp from contas_receber where id = new.conta_receber_id;
  else select empresa_id into v_emp from contas_pagar where id = new.conta_pagar_id; end if;
  if v_emp is distinct from new.empresa_id then raise exception 'vencido_caso: título de outra empresa'; end if;
  new.atualizado_em := now(); new.atualizado_por := auth.uid();
  return new;
end $$;
drop trigger if exists vencido_caso_conferir on public.vencido_caso;
create trigger vencido_caso_conferir before insert or update on public.vencido_caso
  for each row execute function public.vencido_caso_conferir();

-- ═══ BLOCO 3 — histórico append-only (causa, disputa, negociação, recomendação, resultado…) ═══
create table if not exists public.vencido_evento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  caso_id uuid not null references public.vencido_caso(id) on delete restrict,
  tipo text not null check (tipo in ('causa','disputa','evidencia','promessa','negociacao_proposta','negociacao_aprovada','negociacao_recusada','recomendacao','resultado','escalonamento','estrategia','nota')),
  origem text not null default 'usuario' check (origem in ('usuario','ia','sistema')),
  dados jsonb not null default '{}'::jsonb check (jsonb_typeof(dados) = 'object'),
  chave_idempotencia text check (chave_idempotencia is null or char_length(chave_idempotencia) <= 200),
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now()
);
create unique index if not exists vencido_evento_idem on public.vencido_evento (empresa_id, chave_idempotencia) where chave_idempotencia is not null;
create index if not exists vencido_evento_caso on public.vencido_evento (empresa_id, caso_id, criado_em desc);
alter table public.vencido_evento enable row level security;
-- só ler e acrescentar: sem política de update/delete = histórico não se altera nem some
drop policy if exists vencido_evento_ler on public.vencido_evento;
drop policy if exists vencido_evento_inserir on public.vencido_evento;
create policy vencido_evento_ler on public.vencido_evento for select using (empresa_id in (select public.empresas_do_usuario_operacional()));
create policy vencido_evento_inserir on public.vencido_evento for insert with check (empresa_id in (select public.empresas_do_usuario_operacional()));

-- ═══ BLOCO 4 — negociação: aprovar/recusar só dono, sócio ou admin; IA nunca aprova ═══
create or replace function public.vencido_evento_conferir() returns trigger language plpgsql
security definer set search_path = public as $$
begin
  if (select empresa_id from vencido_caso where id = new.caso_id) is distinct from new.empresa_id then
    raise exception 'vencido_evento: caso de outra empresa'; end if;
  if new.tipo in ('negociacao_aprovada','negociacao_recusada') then
    if new.origem <> 'usuario' then raise exception 'vencido_evento: aprovação só por pessoa (IA/sistema não aprova)'; end if;
    if coalesce(public.meu_papel(new.empresa_id), '') not in ('dono','socio','admin') then
      raise exception 'vencido_evento: aprovar negociação exige dono, sócio ou admin'; end if;
  end if;
  new.criado_por := auth.uid(); new.criado_em := now();
  return new;
end $$;
drop trigger if exists vencido_evento_conferir on public.vencido_evento;
create trigger vencido_evento_conferir before insert on public.vencido_evento
  for each row execute function public.vencido_evento_conferir();

-- ═══ BLOCO 5 — configuração por empresa (faixas de aging e parâmetros legais) ═══
create table if not exists public.vencido_config (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  faixas integer[] not null default '{7,15,30,45,60,90,120,180,360}' check (cardinality(faixas) between 1 and 20),
  parametros jsonb not null default '{}'::jsonb check (jsonb_typeof(parametros) = 'object'),
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid default auth.uid()
);
alter table public.vencido_config enable row level security;
drop policy if exists vencido_config_multi_tenant on public.vencido_config;
create policy vencido_config_multi_tenant on public.vencido_config for all
  using (empresa_id in (select public.empresas_do_usuario_operacional()))
  with check (empresa_id in (select public.empresas_do_usuario_operacional()));

-- ═══ BLOCO 6 — foto das previsões de recuperação (previsto x realizado, precisão histórica) ═══
create table if not exists public.vencido_previsao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  data_base date not null,
  horizonte_dias integer not null check (horizonte_dias in (7,15,30,60,90)),
  valor_previsto numeric(14,2) not null check (valor_previsto >= 0),
  saldo_base numeric(14,2) not null check (saldo_base >= 0),
  -- saldo de cada título vencido na data-base: o realizado é conferido título a título depois
  titulos jsonb not null check (jsonb_typeof(titulos) = 'object'),
  metodo text not null check (char_length(metodo) <= 60),
  criado_em timestamptz not null default now(),
  unique (empresa_id, data_base, horizonte_dias)
);
alter table public.vencido_previsao enable row level security;
drop policy if exists vencido_previsao_ler on public.vencido_previsao;
drop policy if exists vencido_previsao_inserir on public.vencido_previsao;
create policy vencido_previsao_ler on public.vencido_previsao for select using (empresa_id in (select public.empresas_do_usuario_operacional()));
create policy vencido_previsao_inserir on public.vencido_previsao for insert with check (empresa_id in (select public.empresas_do_usuario_operacional()));

-- ═══ BLOCO 7 — promessas (reuso de cobranca_compromissos): canal, renegociação e quanto já estava pago ═══
alter table public.cobranca_compromissos add column if not exists canal text check (canal is null or char_length(canal) <= 40);
alter table public.cobranca_compromissos add column if not exists renegociada_de uuid references public.cobranca_compromissos(id) on delete restrict;
-- valor_recebido do título no momento da promessa: cumprimento = o que entrou DEPOIS dela
alter table public.cobranca_compromissos add column if not exists recebido_na_promessa numeric(14,2) check (recebido_na_promessa is null or recebido_na_promessa >= 0);
create index if not exists cobranca_compromissos_empresa_data on public.cobranca_compromissos (empresa_id, data_compromissada);
