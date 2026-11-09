-- RH-17 — Alterações depois da admissão enviada: S-2205 (dados pessoais) e S-2206 (contrato). Leiaute S-1.3 cons. NT 07/2026 rev.
-- Pedido do Elias (09/11/2026): "faz agora o desligamento e as alterações do eSocial". Esta etapa: alterações. Só colunas novas.
-- Depois do S-2200 enviado/aceito, mudar dado do contrato ou salário marca "alteração de contrato pendente" (S-2206); mudar dado
-- pessoal, deficiência ou dependente marca "alteração cadastral pendente" (S-2205). O que o eSocial não deixa alterar por esses
-- eventos (matrícula, admissão, regime; CPF, nascimento, país de nascimento) continua travado — corrige-se retificando a admissão.

-- ═════ BLOCO 1 — marcas de pendência no contrato ═════
alter table public.rh_contratos
  add column if not exists alt_contratual_pendente boolean not null default false,
  add column if not exists alt_cadastral_pendente boolean not null default false;

-- ═════ BLOCO 2 — os arquivos passam a ter situação própria (alterações e, depois, desligamento) ═════
alter table public.rh_esocial_eventos
  add column if not exists situacao text not null default 'preparado',
  add column if not exists recibo text,
  add column if not exists data_ref date;     -- data da alteração (S-2205/S-2206) ou do desligamento (S-2299)
alter table public.rh_esocial_eventos drop constraint if exists rh_esocial_eventos_evento_check;
alter table public.rh_esocial_eventos add constraint rh_esocial_eventos_evento_check check (evento in ('S-2200','S-2205','S-2206','S-2299'));
alter table public.rh_esocial_eventos drop constraint if exists rh_esocial_evento_situacao;
alter table public.rh_esocial_eventos add constraint rh_esocial_evento_situacao check (situacao in ('preparado','enviado_pelo_contador','aceito','recusado')
  and (recibo is null or recibo ~ '^[0-9.]{10,40}$'));
-- só a situação e o recibo mudam; o arquivo gerado nunca muda
create or replace function public.rh_esocial_evento_imutavel()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if (to_jsonb(new) - array['situacao','recibo']) is distinct from (to_jsonb(old) - array['situacao','recibo']) then
    raise exception 'O arquivo preparado não muda: prepare um novo.' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_esocial_evento_imutavel on public.rh_esocial_eventos;
create trigger rh_esocial_evento_imutavel before update on public.rh_esocial_eventos for each row execute function public.rh_esocial_evento_imutavel();
drop policy if exists situacao on public.rh_esocial_eventos;
create policy situacao on public.rh_esocial_eventos for update to authenticated
  using (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais') and public.rh_pode(empresa_id, 'salario') and public.rh_pode(empresa_id, 'saude'))
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais') and public.rh_pode(empresa_id, 'salario') and public.rh_pode(empresa_id, 'saude'));

-- ═════ BLOCO 3 — trava do contrato: depois de enviado, muda e marca S-2206 (só o que o eSocial não deixa alterar trava) ═════
create or replace function public.rh_contrato_trava_esocial()
returns trigger language plpgsql set search_path to 'public' as $$
declare
  livres constant text[] := array['situacao_esocial','recibo_esocial','data_desligamento','gestor_id','centro_custo_id','departamento_id','lotacao_id','alt_contratual_pendente','alt_cadastral_pendente'];
  mudou boolean;
begin
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

-- salário novo depois da admissão enviada também vai no S-2206
create or replace function public.rh_remun_marca_alteracao()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  update rh_contratos set alt_contratual_pendente = true
   where id = new.contrato_id and situacao_esocial in ('enviado','aceito','enviado_pelo_contador') and data_desligamento is null
     and new.vigencia_inicio > data_admissao;
  return new;
end $$;
revoke all on function public.rh_remun_marca_alteracao() from public, anon, authenticated;
drop trigger if exists rh_remun_marca_alteracao on public.rh_remuneracoes;
create trigger rh_remun_marca_alteracao after insert on public.rh_remuneracoes for each row execute function public.rh_remun_marca_alteracao();

-- ═════ BLOCO 4 — dados pessoais, deficiência e dependentes: marcam S-2205 (CPF, nascimento e país de nascimento travam) ═════
create or replace function public.rh_marca_alt_cadastral()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  n jsonb := to_jsonb(new);
  o jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  v_colab uuid := (n ->> case when tg_table_name = 'rh_colaboradores' then 'id' else 'colaborador_id' end)::uuid;
  campos text[];
begin
  -- tudo por jsonb: a mesma função atende tabelas com colunas diferentes
  if not exists (select 1 from rh_contratos where colaborador_id = v_colab and situacao_esocial in ('enviado','aceito','enviado_pelo_contador')) then return new; end if;
  if tg_table_name = 'rh_colaborador_pessoal' and tg_op = 'UPDATE' then
    if (n->'cpf') is distinct from (o->'cpf') or (n->'data_nascimento') is distinct from (o->'data_nascimento') or (n->'pais_nascimento') is distinct from (o->'pais_nascimento') then
      raise exception 'CPF, data de nascimento e país de nascimento não mudam depois da admissão enviada: o contador precisa retificar a admissão.' using errcode = '23514';
    end if;
    -- só o que vai no S-2205 (contato de emergência e cidade por extenso não vão)
    campos := array['sexo','raca_cor','estado_civil','grau_instr','pais_nacionalidade','cep','logradouro','numero','complemento','bairro','uf','cod_munic','telefone','email','imig_tmp_resid','imig_cond_ing'];
    if (select bool_and((n->c) is not distinct from (o->c)) from unnest(campos) c) then return new; end if;
  elsif tg_table_name = 'rh_colaboradores' then
    if (n->'nome') is not distinct from (o->'nome') and (n->'nome_social') is not distinct from (o->'nome_social') then return new; end if;
  end if;
  update rh_contratos set alt_cadastral_pendente = true
   where colaborador_id = v_colab and situacao_esocial in ('enviado','aceito','enviado_pelo_contador') and data_desligamento is null;
  return new;
end $$;
revoke all on function public.rh_marca_alt_cadastral() from public, anon, authenticated;
drop trigger if exists rh_marca_alt_cadastral on public.rh_colaboradores;
create trigger rh_marca_alt_cadastral after update of nome, nome_social on public.rh_colaboradores for each row execute function public.rh_marca_alt_cadastral();
drop trigger if exists rh_marca_alt_cadastral on public.rh_colaborador_pessoal;
create trigger rh_marca_alt_cadastral before update on public.rh_colaborador_pessoal for each row execute function public.rh_marca_alt_cadastral();
drop trigger if exists rh_marca_alt_cadastral on public.rh_colaborador_pcd;
create trigger rh_marca_alt_cadastral after insert or update on public.rh_colaborador_pcd for each row execute function public.rh_marca_alt_cadastral();
drop trigger if exists rh_marca_alt_cadastral on public.rh_dependentes;
create trigger rh_marca_alt_cadastral after insert or update on public.rh_dependentes for each row execute function public.rh_marca_alt_cadastral();

-- ═════ CONFERÊNCIA (esperado: 2 · 3 · 1 · 2 · 4) ═════
select (select count(*) from information_schema.columns where table_name = 'rh_contratos' and column_name like 'alt_%_pendente') as marcas,
       (select count(*) from information_schema.columns where table_name = 'rh_esocial_eventos' and column_name in ('situacao','recibo','data_ref')) as evento_campos,
       (select count(*) from pg_policies where tablename = 'rh_esocial_eventos' and policyname = 'situacao') as regra_situacao,
       (select count(*) from pg_trigger where tgname in ('rh_esocial_evento_imutavel','rh_remun_marca_alteracao')) as gatilhos_evento,
       (select count(*) from pg_trigger where tgname = 'rh_marca_alt_cadastral') as gatilhos_cadastro;
