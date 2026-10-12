-- SALDO DE IA POR EMPRESA (decisão do Elias 2026-10-11)
-- Cada plano traz um saldo mensal de IA (OpenAI, Anthropic, notas lidas pela IA);
-- acabou = recarga paga (Stripe). Teste grátis de 7 dias: IA só nos 3 primeiros dias.
-- O saldo do plano volta todo mês no dia em que o plano começou; recarga não vence.
-- Rodar os blocos em ordem.

-- ===== BLOCO 1: tabelas e colunas =====
alter table public.empresas
  add column if not exists teste_ate timestamptz,
  add column if not exists ia_recarga_openai int not null default 0,
  add column if not exists ia_recarga_anthropic int not null default 0,
  add column if not exists ia_recarga_nota int not null default 0,
  add column if not exists ia_ilimitada boolean not null default false; -- só empresa interna de teste; muda só pelo banco

create table if not exists public.ia_consumo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tipo text not null check (tipo in ('openai','anthropic','nota')),
  fonte text not null check (fonte in ('plano','teste','recarga','ilimitada')),
  user_id uuid,
  criado_em timestamptz not null default now()
);
create index if not exists idx_ia_consumo_empresa_tipo_data on public.ia_consumo (empresa_id, tipo, criado_em);

create table if not exists public.ia_recarga (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tipo text not null check (tipo in ('openai','anthropic','nota')),
  quantidade int not null check (quantidade > 0),
  valor_centavos int not null,
  stripe_session_id text not null unique, -- o mesmo pagamento nunca credita 2 vezes
  criado_em timestamptz not null default now()
);
create index if not exists idx_ia_recarga_empresa on public.ia_recarga (empresa_id, criado_em);

alter table public.ia_consumo enable row level security;
alter table public.ia_recarga enable row level security;
drop policy if exists ia_consumo_ler on public.ia_consumo;
create policy ia_consumo_ler on public.ia_consumo for select using (empresa_id in (select public.empresas_do_usuario()));
drop policy if exists ia_recarga_ler on public.ia_recarga;
create policy ia_recarga_ler on public.ia_recarga for select using (empresa_id in (select public.empresas_do_usuario()));
-- sem policy de escrita: só as funções abaixo gravam.

-- ===== BLOCO 2: limites e situação do saldo =====
create or replace function public.ia_limite_plano(p_plano text, p_tipo text) returns int
language sql immutable as $$
  select case p_plano
    when 'teste'      then case p_tipo when 'openai' then 20   when 'anthropic' then 5   else 5   end
    when 'starter'    then case p_tipo when 'openai' then 150  when 'anthropic' then 20  else 20  end -- MEI
    when 'pro'        then case p_tipo when 'openai' then 500  when 'anthropic' then 60  else 60  end -- Essencial
    when 'business'   then case p_tipo when 'openai' then 1000 when 'anthropic' then 120 else 120 end -- Empresa
    when 'enterprise' then case p_tipo when 'openai' then 2000 when 'anthropic' then 300 else 250 end -- Premium
    else 0 end
$$;

-- Plano que vale para a empresa: o da empresa; sem ele, o do dono (contas liberadas à mão).
create or replace function public.ia_situacao(p_empresa uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  e record; v_plano text; v_desde timestamptz; v_inicio timestamptz; v_fim timestamptz;
  v_teste boolean; v_teste_ia_ate timestamptz; v_meses int; v_tipo text; v_res jsonb := '{}'::jsonb;
  v_lim int; v_usado int; v_rec int;
begin
  if p_empresa not in (select public.empresas_do_usuario()) then raise exception 'sem acesso a esta empresa'; end if;
  select * into e from empresas where id = p_empresa;
  if e.plano_ativo then v_plano := e.plano; v_desde := e.plano_desde;
  else select p.plano, p.created_at into v_plano, v_desde from perfis p where p.user_id = e.user_id and p.plano_ativo; end if;
  v_desde := coalesce(v_desde, e.created_at, now());
  v_teste := e.teste_ate is not null and now() < e.teste_ate;
  if v_teste then
    v_inicio := v_desde; v_fim := e.teste_ate; v_teste_ia_ate := v_desde + interval '3 days';
  else
    v_desde := coalesce(e.teste_ate, v_desde); -- o mês do saldo vira no dia da cobrança (fim do teste)
    v_meses := (extract(year from age(now(), v_desde)) * 12 + extract(month from age(now(), v_desde)))::int;
    v_inicio := v_desde + make_interval(months => v_meses);
    v_fim := v_desde + make_interval(months => v_meses + 1);
  end if;
  foreach v_tipo in array array['openai','anthropic','nota'] loop
    v_lim := case when v_teste and now() >= v_teste_ia_ate then 0
                  when v_teste then ia_limite_plano('teste', v_tipo)
                  else ia_limite_plano(v_plano, v_tipo) end;
    select count(*) into v_usado from ia_consumo where empresa_id = p_empresa and tipo = v_tipo and fonte = case when v_teste then 'teste' else 'plano' end and criado_em >= v_inicio;
    v_rec := case v_tipo when 'openai' then e.ia_recarga_openai when 'anthropic' then e.ia_recarga_anthropic else e.ia_recarga_nota end;
    v_res := v_res || jsonb_build_object(v_tipo, jsonb_build_object('limite', v_lim, 'usado', v_usado, 'recarga', v_rec, 'restante', greatest(v_lim - v_usado, 0) + v_rec));
  end loop;
  return v_res || jsonb_build_object('plano', v_plano, 'teste', v_teste, 'teste_ia_ate', v_teste_ia_ate, 'teste_ate', e.teste_ate,
    'ciclo_inicio', v_inicio, 'ciclo_fim', v_fim, 'ilimitada', e.ia_ilimitada);
end $$;

-- ===== BLOCO 3: gastar e devolver =====
-- Gasta 1 do plano; se o plano acabou, gasta 1 da recarga; senão recusa.
create or replace function public.ia_consumir(p_empresa uuid, p_tipo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s jsonb; t jsonb; v_id uuid; v_fonte text; v_ilimitada boolean;
begin
  if p_tipo not in ('openai','anthropic','nota') then raise exception 'tipo invalido'; end if;
  perform 1 from empresas where id = p_empresa for update; -- uma de cada vez por empresa
  select ia_ilimitada into v_ilimitada from empresas where id = p_empresa;
  s := ia_situacao(p_empresa);
  t := s -> p_tipo;
  if v_ilimitada then v_fonte := 'ilimitada';
  elsif (t->>'usado')::int < (t->>'limite')::int then v_fonte := case when (s->>'teste')::boolean then 'teste' else 'plano' end;
  elsif (t->>'recarga')::int > 0 then
    v_fonte := 'recarga';
    update empresas set
      ia_recarga_openai = ia_recarga_openai - (p_tipo = 'openai')::int,
      ia_recarga_anthropic = ia_recarga_anthropic - (p_tipo = 'anthropic')::int,
      ia_recarga_nota = ia_recarga_nota - (p_tipo = 'nota')::int
    where id = p_empresa;
  else
    return jsonb_build_object('ok', false, 'motivo',
      case when (s->>'teste')::boolean and now() >= (s->>'teste_ia_ate')::timestamptz then 'teste_ia_encerrada' else 'sem_saldo' end);
  end if;
  insert into ia_consumo (empresa_id, tipo, fonte, user_id) values (p_empresa, p_tipo, v_fonte, auth.uid()) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- A IA falhou (não respondeu): devolve o que foi gasto.
create or replace function public.ia_devolver(p_consumo uuid) returns void
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  delete from ia_consumo where id = p_consumo and empresa_id in (select public.empresas_do_usuario()) returning * into c;
  if c.fonte = 'recarga' then
    update empresas set
      ia_recarga_openai = ia_recarga_openai + (c.tipo = 'openai')::int,
      ia_recarga_anthropic = ia_recarga_anthropic + (c.tipo = 'anthropic')::int,
      ia_recarga_nota = ia_recarga_nota + (c.tipo = 'nota')::int
    where id = c.empresa_id;
  end if;
end $$;

-- Recarga paga (chamada só pelo servidor do Stripe, com a chave de serviço).
create or replace function public.ia_creditar_recarga(p_session text, p_empresa uuid, p_tipo text, p_qtd int, p_valor int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into ia_recarga (empresa_id, tipo, quantidade, valor_centavos, stripe_session_id) values (p_empresa, p_tipo, p_qtd, p_valor, p_session)
    on conflict (stripe_session_id) do nothing;
  if not found then return false; end if; -- já creditada
  update empresas set
    ia_recarga_openai = ia_recarga_openai + case when p_tipo = 'openai' then p_qtd else 0 end,
    ia_recarga_anthropic = ia_recarga_anthropic + case when p_tipo = 'anthropic' then p_qtd else 0 end,
    ia_recarga_nota = ia_recarga_nota + case when p_tipo = 'nota' then p_qtd else 0 end
  where id = p_empresa;
  return true;
end $$;

revoke all on function public.ia_situacao(uuid), public.ia_consumir(uuid, text), public.ia_devolver(uuid) from public, anon;
grant execute on function public.ia_situacao(uuid), public.ia_consumir(uuid, text), public.ia_devolver(uuid) to authenticated;
revoke all on function public.ia_creditar_recarga(text, uuid, text, int, int) from public, anon, authenticated;

-- ===== BLOCO 4: empresa interna de teste sem limite =====
update public.empresas set ia_ilimitada = true where nome = 'Axioma Teste — Distribuidora Horizonte';
