-- RH-11: Histórico de alterações do colaborador (subfase 7 + auditoria da 9).
-- O próprio banco grava quem mudou o quê e quando, em cada parte. Ninguém edita nem apaga uma linha (não há regra de
-- gravação para usuários; só o gatilho grava). Valores só aparecem para cadastro e contrato; dados pessoais, saúde e
-- salário guardam apenas o NOME do campo — quem lê o histórico precisa da mesma liberação da parte.

create table if not exists public.rh_historico (
  id bigint generated always as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  colaborador_id uuid not null references public.rh_colaboradores(id) on delete cascade,
  parte text not null check (parte in ('cadastro','contrato','pessoal','salario','documento','exame')),
  acao text not null check (acao in ('criou','alterou','lixeira','recuperou')),
  campos text[] not null default '{}',
  antes jsonb,
  depois jsonb,
  por uuid default auth.uid(),
  em timestamptz not null default now()
);
create index if not exists rh_historico_colab on public.rh_historico (colaborador_id, em desc);
create index if not exists rh_historico_empresa on public.rh_historico (empresa_id, em desc);
alter table public.rh_historico enable row level security;
drop policy if exists rh_historico_le on public.rh_historico;
create policy rh_historico_le on public.rh_historico for select to authenticated using (
  public.rh_pode(empresa_id, 'ver') and case parte
    when 'pessoal' then public.rh_pode(empresa_id, 'pessoais')
    when 'documento' then public.rh_pode(empresa_id, 'pessoais')
    when 'exame' then public.rh_pode(empresa_id, 'saude')
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
    when 'rh_remuneracoes' then 'salario' else n->>'categoria' end;  -- via jsonb: cada tabela tem campos diferentes  -- rh_admissao_itens: documento | exame
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

drop trigger if exists rh_historico on public.rh_colaboradores;
create trigger rh_historico after insert or update on public.rh_colaboradores for each row execute function public.rh_historico_registra();
drop trigger if exists rh_historico on public.rh_contratos;
create trigger rh_historico after insert or update on public.rh_contratos for each row execute function public.rh_historico_registra();
drop trigger if exists rh_historico on public.rh_colaborador_pessoal;
create trigger rh_historico after insert or update on public.rh_colaborador_pessoal for each row execute function public.rh_historico_registra();
drop trigger if exists rh_historico on public.rh_remuneracoes;
create trigger rh_historico after insert on public.rh_remuneracoes for each row execute function public.rh_historico_registra();
drop trigger if exists rh_historico on public.rh_admissao_itens;
create trigger rh_historico after insert or update on public.rh_admissao_itens for each row execute function public.rh_historico_registra();
