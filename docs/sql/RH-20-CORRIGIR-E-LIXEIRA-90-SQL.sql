-- RH-20 — Corrigir na hora e lixeira de 90 dias (pedido do Elias, 09/11/2026): "lixeira e lápis onde preenche os dados dos
-- colaboradores… deletar até 90 dias em caso de vencer a experiência e não seguir com a contratação".
-- Decisões (Elias, 09/11): lixeira do RH passa de 60 para 90 dias (o prazo fica no código: lib/nexusRetencao.ts); quem NÃO
-- chegou a trabalhar pode ter a admissão cancelada e ir para a lixeira (o contador exclui o S-2200 no eSocial com o S-3000);
-- quem trabalhou é desligado (término da experiência) e os dados ficam guardados — obrigação legal (LGPD art. 16, I).

-- ═════ BLOCO 1 — salário: corrigir (lápis) e lixeira; a linha na lixeira some de todas as leituras ═════
alter table public.rh_remuneracoes
  add column if not exists excluido_em timestamptz,
  add column if not exists excluido_por uuid;
alter table public.rh_remuneracoes drop constraint if exists rh_remun_vigencia;
create unique index if not exists rh_remun_vigencia_ativa on public.rh_remuneracoes (contrato_id, vigencia_inicio) where excluido_em is null;
-- leitura comum (tela, Painel, IA) só vê o que não está na lixeira; a lixeira é lida pela função do BLOCO 2
drop policy if exists rh_remun_le on public.rh_remuneracoes;
create policy rh_remun_le on public.rh_remuneracoes for select to authenticated
  using (public.rh_pode(empresa_id, 'salario') and excluido_em is null);
drop policy if exists rh_remun_corrige on public.rh_remuneracoes;
create policy rh_remun_corrige on public.rh_remuneracoes for update to authenticated
  using (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'salario') and excluido_em is null)
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'salario') and excluido_em is null);
-- correção: não troca de contrato; a linha da admissão continua na data da admissão
create or replace function public.rh_remun_corrige_confere()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.contrato_id is distinct from old.contrato_id or new.empresa_id is distinct from old.empresa_id then
    raise exception 'O salário não muda de contrato.' using errcode = '23514';
  end if;
  if old.motivo = 'admissao' and (new.motivo <> 'admissao' or new.vigencia_inicio <> old.vigencia_inicio) then
    raise exception 'O salário da admissão vale desde a data da admissão: corrija só o valor.' using errcode = '23514';
  end if;
  if old.motivo <> 'admissao' and new.motivo = 'admissao' then
    raise exception 'Só existe um salário de admissão por contrato.' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_remun_corrige_confere on public.rh_remuneracoes;
create trigger rh_remun_corrige_confere before update on public.rh_remuneracoes for each row execute function public.rh_remun_corrige_confere();
-- correção e lixeira também vão no S-2206 quando a admissão já foi enviada; e entram no histórico
create or replace function public.rh_remun_marca_alteracao()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  update rh_contratos set alt_contratual_pendente = true
   where id = new.contrato_id and situacao_esocial in ('enviado','aceito','enviado_pelo_contador') and data_desligamento is null
     and (new.vigencia_inicio > data_admissao or tg_op = 'UPDATE');
  return new;
end $$;
revoke all on function public.rh_remun_marca_alteracao() from public, anon, authenticated;
drop trigger if exists rh_remun_marca_alteracao on public.rh_remuneracoes;
create trigger rh_remun_marca_alteracao after insert or update on public.rh_remuneracoes for each row execute function public.rh_remun_marca_alteracao();
drop trigger if exists rh_historico on public.rh_remuneracoes;
create trigger rh_historico after insert or update on public.rh_remuneracoes for each row execute function public.rh_historico_registra();

-- ═════ BLOCO 2 — lixeira do salário (mover, listar, recuperar) com a mesma liberação ═════
create or replace function public.rh_remun_lixeira(p_id uuid, p_recuperar boolean default false)
returns void language plpgsql security definer set search_path to 'public' as $$
declare r rh_remuneracoes;
begin
  select * into r from rh_remuneracoes where id = p_id;
  if r.id is null or not (rh_pode(r.empresa_id, 'editar') and rh_pode(r.empresa_id, 'salario')) then
    raise exception 'Sem liberação para alterar este salário.' using errcode = '42501';
  end if;
  if not p_recuperar then
    if r.excluido_em is not null then return; end if;
    if r.motivo = 'admissao' then raise exception 'O salário da admissão não vai para a lixeira: corrija o valor pelo lápis.' using errcode = '23514'; end if;
    update rh_remuneracoes set excluido_em = now(), excluido_por = auth.uid() where id = p_id;
  else
    if r.excluido_em is null then return; end if;
    if exists (select 1 from rh_remuneracoes x where x.contrato_id = r.contrato_id and x.vigencia_inicio = r.vigencia_inicio and x.excluido_em is null) then
      raise exception 'Já existe outro salário com a mesma data: corrija um deles antes de recuperar.' using errcode = '23505';
    end if;
    update rh_remuneracoes set excluido_em = null, excluido_por = null where id = p_id;
  end if;
end $$;
revoke all on function public.rh_remun_lixeira(uuid, boolean) from public, anon;
grant execute on function public.rh_remun_lixeira(uuid, boolean) to authenticated;

create or replace function public.rh_remun_na_lixeira(p_contrato uuid)
returns table (id uuid, vigencia_inicio date, und_sal_fixo smallint, valor numeric, motivo text, excluido_em timestamptz)
language sql security definer set search_path to 'public' stable as $$
  select r.id, r.vigencia_inicio, r.und_sal_fixo, r.valor, r.motivo, r.excluido_em from rh_remuneracoes r
  where r.contrato_id = p_contrato and r.excluido_em is not null and rh_pode(r.empresa_id, 'salario')
  order by r.excluido_em desc
$$;
revoke all on function public.rh_remun_na_lixeira(uuid) from public, anon;
grant execute on function public.rh_remun_na_lixeira(uuid) to authenticated;

-- ═════ BLOCO 3 — arquivo anexado por engano: lixeira de 90 dias (o arquivo some da tela e pode voltar) ═════
alter table public.rh_admissao_itens add column if not exists arquivo_excluido_em timestamptz;
alter table public.rh_admissao_itens drop constraint if exists rh_admissao_arquivo_lixeira;
alter table public.rh_admissao_itens add constraint rh_admissao_arquivo_lixeira check (arquivo_excluido_em is null or arquivo_path is not null);

-- ═════ BLOCO 4 — admissão cancelada: a pessoa não chegou a trabalhar (pode ir para a lixeira mesmo já enviada) ═════
alter table public.rh_contratos add column if not exists admissao_cancelada boolean not null default false;
create or replace function public.rh_colab_lixeira_confere()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.excluido_em is not null and old.excluido_em is null and exists (
     select 1 from public.rh_contratos c where c.colaborador_id = new.id and c.situacao_esocial <> 'rascunho' and not c.admissao_cancelada) then
    raise exception 'Este colaborador já foi enviado ao eSocial: registre o desligamento (ou, se não chegou a trabalhar, cancele a admissão).' using errcode = '23514';
  end if;
  return new;
end $$;
-- cancelar a admissão não é alteração de contrato (não marca S-2206) e só vale para quem não tem desligamento
create or replace function public.rh_contrato_trava_esocial()
returns trigger language plpgsql set search_path to 'public' as $$
declare
  livres constant text[] := array['situacao_esocial','recibo_esocial','data_desligamento','gestor_id','centro_custo_id','departamento_id','lotacao_id','alt_contratual_pendente','alt_cadastral_pendente','admissao_cancelada'];
  mudou boolean;
begin
  if new.admissao_cancelada and not old.admissao_cancelada and (old.data_desligamento is not null or exists (select 1 from public.rh_desligamentos d where d.contrato_id = old.id)) then
    raise exception 'Este contrato tem desligamento: quem trabalhou é desligado, a admissão não é cancelada.' using errcode = '23514';
  end if;
  mudou := (to_jsonb(new) - livres) is distinct from (to_jsonb(old) - livres);
  if not mudou then return new; end if;
  if old.situacao_esocial in ('enviado','aceito','enviado_pelo_contador') then
    if new.matricula is distinct from old.matricula or new.data_admissao is distinct from old.data_admissao
       or new.tp_reg_trab is distinct from old.tp_reg_trab or new.colaborador_id is distinct from old.colaborador_id then
      raise exception 'Matrícula, data de admissão e regime não mudam depois de enviados ao eSocial: o contador precisa retificar a admissão.' using errcode = '23514';
    end if;
    new.alt_contratual_pendente := true;   -- vai no S-2206
    return new;
  end if;
  if old.situacao_esocial = 'preparado' and new.situacao_esocial = 'preparado' then new.situacao_esocial := 'rascunho'; end if;
  return new;
end $$;

-- ═════ CONFERÊNCIA — esperado: 2 · 1 · 1 · 2 · 1 · 1 ═════
select (select count(*) from information_schema.columns where table_name = 'rh_remuneracoes' and column_name in ('excluido_em','excluido_por')) as colunas_salario,
       (select count(*) from pg_indexes where indexname = 'rh_remun_vigencia_ativa') as indice_salario,
       (select count(*) from pg_policies where tablename = 'rh_remuneracoes' and policyname = 'rh_remun_corrige') as politica_corrige,
       (select count(*) from pg_proc where proname in ('rh_remun_lixeira','rh_remun_na_lixeira')) as funcoes_lixeira,
       (select count(*) from information_schema.columns where table_name = 'rh_admissao_itens' and column_name = 'arquivo_excluido_em') as arquivo_lixeira,
       (select count(*) from information_schema.columns where table_name = 'rh_contratos' and column_name = 'admissao_cancelada') as admissao_cancelada;
