-- ============================================================================
-- AXIOMA — Equipe: convite seguro com prazo, termo dos dois lados e
-- APROVAÇÃO FINAL do dono/admin. Pedido do Elias (2026-10-01): plataforma
-- contábil, mexe com dinheiro e dados bancários — link vazado não pode
-- virar porta aberta.
--
-- FLUXO:
--   1) Dono/admin gera o convite: relação (sócio, contador, funcionário,
--      consultor, outro), papel, prazo e motivo + aceita o termo de quem envia.
--      Prazo: Admin, Sócio e CEO podem "sem prazo"; terceiros só 1/3/7/30/60/90 dias.
--   2) Quem recebe abre o link, entra/cria conta (e-mail confirmado pelo
--      Axioma), preenche nome completo + CPF, confirma quem convidou e aceita
--      Termos + LGPD → fica "Aguardando aprovação" (AINDA SEM ACESSO).
--   3) Dono/admin vê nome, CPF, e-mail e aprova ou recusa. Só então entra.
--   4) Prazo vencido = acesso cortado NO BANCO (todas as regras de segurança).
--      Cortar antes = botão "Cortar acesso agora".
-- Dados pessoais (nome/CPF/e-mail) ficam em empresa_convite_termo: só
-- dono/admin leem; apagar só por apagar_termo_convite (com motivo).
--
-- Rodar UMA VEZ no SQL Editor do Supabase. Idempotente. Não apaga dados.
-- ============================================================================

ALTER TABLE public.empresa_equipe
  ADD COLUMN IF NOT EXISTS acesso_dias integer,            -- NULL = sem prazo (só admin/sócio)
  ADD COLUMN IF NOT EXISTS motivo_convite text,
  ADD COLUMN IF NOT EXISTS relacao text,                   -- ceo | socio | contador | funcionario | consultor | outro
  ADD COLUMN IF NOT EXISTS remetente_nome text,
  ADD COLUMN IF NOT EXISTS remetente_termo_em timestamptz,
  ADD COLUMN IF NOT EXISTS convidado_nome_termo text,
  ADD COLUMN IF NOT EXISTS convidado_termo_em timestamptz,
  ADD COLUMN IF NOT EXISTS situacao text NOT NULL DEFAULT 'enviado', -- enviado | aguardando_aprovacao | aprovado | recusado
  ADD COLUMN IF NOT EXISTS decidido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decidido_em timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_recusa text;

ALTER TABLE public.empresa_usuarios
  ADD COLUMN IF NOT EXISTS acesso_expira_em timestamptz,   -- NULL = sem prazo
  ADD COLUMN IF NOT EXISTS convite_id uuid;

CREATE TABLE IF NOT EXISTS public.empresa_convite_termo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  convite_id uuid REFERENCES public.empresa_equipe(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text,
  cpf text,
  email text,
  remetente_nome text,
  confirmou_remetente boolean NOT NULL DEFAULT false,
  aceitou_termos_lgpd boolean NOT NULL DEFAULT false,
  relacao text,
  papel text,
  acesso_dias integer,
  motivo_convite text,
  convidado_em timestamptz,
  aceito_em timestamptz NOT NULL DEFAULT now(),
  apagado_em timestamptz,
  apagado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  motivo_apagado text
);
CREATE INDEX IF NOT EXISTS idx_empresa_convite_termo_empresa ON public.empresa_convite_termo (empresa_id, aceito_em);
ALTER TABLE public.empresa_convite_termo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS empresa_convite_termo_leitura ON public.empresa_convite_termo;
CREATE POLICY empresa_convite_termo_leitura ON public.empresa_convite_termo
  FOR SELECT TO authenticated
  USING (public.meu_papel(empresa_id) IN ('dono', 'admin'));

-- 1) Regras centrais de acesso: prazo vencido = sem acesso
create or replace function public.empresas_do_usuario()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from empresas where user_id = (select auth.uid())
  union
  select empresa_id from empresa_usuarios
  where user_id = (select auth.uid())
    and (acesso_expira_em is null or acesso_expira_em > now())
$$;

create or replace function public.empresas_do_usuario_operacional()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from empresas where user_id = (select auth.uid())
  union
  select empresa_id from empresa_usuarios
  where user_id = (select auth.uid()) and papel <> 'operador'
    and (acesso_expira_em is null or acesso_expira_em > now())
$$;

create or replace function public.meu_papel(p_empresa_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select papel from empresa_usuarios
      where empresa_id = p_empresa_id and user_id = (select auth.uid())
        and (acesso_expira_em is null or acesso_expira_em > now())
      limit 1),
    (select 'dono' from empresas where id = p_empresa_id and user_id = (select auth.uid()) limit 1)
  )
$$;

-- 2) Tela do convite (pública): quem convidou, quando, prazo, motivo, situação
drop function if exists public.obter_convite_por_token(text);
create function public.obter_convite_por_token(p_token text)
returns table (
  empresa_nome text, email_convidado text, papel text, cargo text, convite_aceito boolean,
  remetente_nome text, convidado_em timestamptz, acesso_dias integer, motivo_convite text,
  expira_em timestamptz, relacao text, situacao text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select e.nome, eq.email_convidado, eq.papel, eq.cargo, coalesce(eq.convite_aceito, false),
           eq.remetente_nome, eq.created_at, eq.acesso_dias, eq.motivo_convite,
           eq.expira_em, eq.relacao, eq.situacao
    from empresa_equipe eq
    join empresas e on e.id = eq.empresa_id
    where eq.token_convite = p_token
    limit 1;
end;
$$;
revoke all on function public.obter_convite_por_token(text) from public;
grant execute on function public.obter_convite_por_token(text) to anon, authenticated;

-- 3) Quem recebe preenche o termo → "aguardando aprovação" (NÃO dá acesso)
drop function if exists public.aceitar_convite(text);
drop function if exists public.aceitar_convite(text, text);
drop function if exists public.aceitar_convite(text, text, text, text);
create or replace function public.aceitar_convite(
  p_token text, p_nome text, p_cpf text, p_email text, p_confirma_remetente boolean, p_aceita_termos boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_convite record;
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
begin
  if v_user_id is null then
    raise exception 'Você precisa estar logado para aceitar um convite' using errcode = 'AX007';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 5 or length(v_cpf) <> 11 then
    raise exception 'Preencha nome completo e CPF' using errcode = 'AX009';
  end if;
  if not coalesce(p_confirma_remetente, false) or not coalesce(p_aceita_termos, false) then
    raise exception 'Confirme quem enviou o convite e aceite os Termos e a LGPD' using errcode = 'AX009';
  end if;
  select email into v_user_email from auth.users where id = v_user_id;
  -- e-mail do termo = e-mail da conta (confirmado pelo Axioma no cadastro)
  if lower(trim(coalesce(p_email, ''))) <> lower(v_user_email) then
    raise exception 'O e-mail precisa ser o mesmo da sua conta no Axioma' using errcode = 'AX005';
  end if;
  select * into v_convite from empresa_equipe where token_convite = p_token limit 1 for update;
  if v_convite is null then
    raise exception 'Convite não encontrado' using errcode = 'AX002';
  end if;
  if coalesce(v_convite.convite_aceito, false) or v_convite.situacao in ('aprovado', 'recusado')
     or (v_convite.user_id_convidado is not null and v_convite.user_id_convidado <> v_user_id) then
    raise exception 'Este convite já foi utilizado' using errcode = 'AX003';
  end if;
  if v_convite.expira_em < now() then
    raise exception 'Este convite expirou' using errcode = 'AX004';
  end if;
  if coalesce(v_convite.email_convidado, '') <> '' and lower(v_convite.email_convidado) <> lower(v_user_email) then
    raise exception 'Este convite foi enviado para outro e-mail (%). Entre com a conta correta.', v_convite.email_convidado using errcode = 'AX005';
  end if;

  update empresa_equipe
  set user_id_convidado = v_user_id, situacao = 'aguardando_aprovacao',
      convidado_nome_termo = trim(p_nome), convidado_termo_em = now()
  where id = v_convite.id;

  delete from empresa_convite_termo where convite_id = v_convite.id and apagado_em is null and user_id = v_user_id;
  insert into empresa_convite_termo (empresa_id, convite_id, user_id, nome, cpf, email, remetente_nome,
    confirmou_remetente, aceitou_termos_lgpd, relacao, papel, acesso_dias, motivo_convite, convidado_em)
  values (v_convite.empresa_id, v_convite.id, v_user_id, trim(p_nome), v_cpf, lower(v_user_email), v_convite.remetente_nome,
    true, true, v_convite.relacao, v_convite.papel, v_convite.acesso_dias, v_convite.motivo_convite, v_convite.created_at);

  return v_convite.empresa_id;
end;
$$;
revoke all on function public.aceitar_convite(text, text, text, text, boolean, boolean) from public;
grant execute on function public.aceitar_convite(text, text, text, text, boolean, boolean) to authenticated;

-- 4) Dono/admin aprova (libera o acesso com prazo) ou recusa
create or replace function public.decidir_convite(p_convite_id uuid, p_aprovar boolean, p_motivo text DEFAULT NULL)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_convite record;
  v_expira timestamptz;
begin
  select * into v_convite from empresa_equipe where id = p_convite_id for update;
  if v_convite is null or v_convite.situacao <> 'aguardando_aprovacao' or v_convite.user_id_convidado is null then
    raise exception 'Convite não está aguardando aprovação' using errcode = 'AX002';
  end if;
  if public.meu_papel(v_convite.empresa_id) not in ('dono', 'admin') then
    raise exception 'Só o proprietário ou um administrador pode aprovar' using errcode = 'AX006';
  end if;

  if not p_aprovar then
    update empresa_equipe set situacao = 'recusado', decidido_por = auth.uid(), decidido_em = now(),
      motivo_recusa = nullif(trim(coalesce(p_motivo, '')), '')
    where id = p_convite_id;
    return;
  end if;

  -- Sem prazo só para Admin, Sócio ou CEO; terceiros sempre com prazo permitido
  if v_convite.acesso_dias is null and not (v_convite.papel = 'admin' or v_convite.relacao in ('socio', 'ceo')) then
    raise exception 'Acesso sem prazo só para Admin, Sócio ou CEO' using errcode = 'AX011';
  end if;
  if v_convite.acesso_dias is not null and v_convite.acesso_dias not in (1, 3, 7, 30, 60, 90) then
    raise exception 'Prazo de acesso inválido' using errcode = 'AX011';
  end if;

  v_expira := case when v_convite.acesso_dias is null then null
                   else now() + make_interval(days => v_convite.acesso_dias) end;

  insert into empresa_usuarios (empresa_id, user_id, papel, acesso_expira_em, convite_id)
  values (v_convite.empresa_id, v_convite.user_id_convidado, coalesce(v_convite.papel, 'leitor'), v_expira, v_convite.id)
  on conflict (empresa_id, user_id) do update
    set acesso_expira_em = excluded.acesso_expira_em, convite_id = excluded.convite_id, papel = excluded.papel;

  update empresa_equipe set situacao = 'aprovado', convite_aceito = true, aceito_em = now(),
    decidido_por = auth.uid(), decidido_em = now()
  where id = p_convite_id;
end;
$$;
revoke all on function public.decidir_convite(uuid, boolean, text) from public;
grant execute on function public.decidir_convite(uuid, boolean, text) to authenticated;

-- 5) Apagar dados pessoais do termo (dono/admin + motivo; fica quem/quando/por quê)
create or replace function public.apagar_termo_convite(p_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  if length(trim(coalesce(p_motivo, ''))) < 5 then
    raise exception 'Informe o motivo (mínimo 5 letras)' using errcode = 'AX010';
  end if;
  select empresa_id into v_empresa_id from empresa_convite_termo where id = p_id and apagado_em is null;
  if v_empresa_id is null then
    raise exception 'Registro não encontrado ou já apagado' using errcode = 'AX002';
  end if;
  if public.meu_papel(v_empresa_id) not in ('dono', 'admin') then
    raise exception 'Só o proprietário ou um administrador pode apagar' using errcode = 'AX006';
  end if;
  update empresa_convite_termo
  set nome = null, cpf = null, email = null,
      apagado_em = now(), apagado_por = auth.uid(), motivo_apagado = trim(p_motivo)
  where id = p_id;
end;
$$;
revoke all on function public.apagar_termo_convite(uuid, text) from public;
grant execute on function public.apagar_termo_convite(uuid, text) to authenticated;

-- 6) Lista da equipe: + situação do convite; para quem já entrou, expira_em = fim do acesso
drop function if exists public.listar_equipe(uuid);
create function public.listar_equipe(p_empresa_id uuid)
returns table (id uuid, origem text, user_id uuid, email text, nome text, cargo text, papel text,
               token_convite text, expira_em timestamptz, criado_em timestamptz, situacao text, relacao text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.meu_papel(p_empresa_id) <> 'dono' then
    raise exception 'Apenas o proprietário pode ver a equipe.' using errcode = 'AX006';
  end if;

  return query
    select eu.id, 'ativo'::text, eu.user_id, u.email::text,
           coalesce(eq.convidado_nome_termo, eq.nome, '')::text, coalesce(eq.cargo, '')::text, eu.papel,
           null::text, eu.acesso_expira_em, eu.created_at, 'aprovado'::text, eq.relacao
    from empresa_usuarios eu
    join auth.users u on u.id = eu.user_id
    -- só o convite mais recente da pessoa (quem aceitou 2 convites não aparece 2x)
    left join lateral (
      select x.convidado_nome_termo, x.nome, x.cargo, x.relacao from empresa_equipe x
      where x.empresa_id = eu.empresa_id
        and (x.id = eu.convite_id or (eu.convite_id is null and x.user_id_convidado = eu.user_id))
      order by x.created_at desc limit 1
    ) eq on true
    where eu.empresa_id = p_empresa_id

    union all

    select e.user_id, 'ativo'::text, e.user_id, u.email::text,
           ''::text, ''::text, 'dono'::text,
           null::text, null::timestamptz, e.created_at, 'aprovado'::text, null::text
    from empresas e
    join auth.users u on u.id = e.user_id
    where e.id = p_empresa_id
      and not exists (select 1 from empresa_usuarios eu2 where eu2.empresa_id = e.id and eu2.user_id = e.user_id)

    union all

    select eq2.id, 'convite'::text, eq2.user_id_convidado, coalesce(eq2.email_convidado, ''),
           coalesce(eq2.convidado_nome_termo, eq2.nome, '')::text, coalesce(eq2.cargo, '')::text, eq2.papel,
           eq2.token_convite, eq2.expira_em, eq2.created_at, eq2.situacao, eq2.relacao
    from empresa_equipe eq2
    where eq2.empresa_id = p_empresa_id and not coalesce(eq2.convite_aceito, false) and eq2.situacao <> 'recusado'

    order by 10 desc;
end;
$$;
revoke all on function public.listar_equipe(uuid) from public;
grant execute on function public.listar_equipe(uuid) to authenticated;
