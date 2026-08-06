-- ============================================================================
-- AXIOMA — Tela de Aceitar Convite.
-- Pré-requisitos já rodados antes: MIGRACAO-MULTITENANT.sql, SQL-EMPRESA-PADRAO.sql.
--
-- O QUE FAZ:
--   1) 2 colunas novas em empresa_equipe — só pra registrar QUEM aceitou e
--      QUANDO (auditoria simples, não muda nada do que já existia).
--   2) obter_convite_por_token(token) — RPC pública (funciona sem login) que
--      devolve só o necessário pra mostrar a tela de convite (nome da
--      empresa, e-mail convidado, papel). Nunca expõe a linha inteira.
--   3) aceitar_convite(token) — RPC que exige login. Confere que o e-mail
--      logado bate com o e-mail convidado, cria o vínculo real em
--      empresa_usuarios — o que faltava até hoje: "convidar membro" só
--      gravava o convite, nunca dava acesso de fato a ninguém — e marca o
--      convite como aceito.
--
-- Idempotente — pode rodar mais de uma vez com segurança.
-- ============================================================================

BEGIN;

ALTER TABLE public.empresa_equipe
  ADD COLUMN IF NOT EXISTS aceito_em timestamptz,
  ADD COLUMN IF NOT EXISTS user_id_convidado uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_empresa_equipe_token ON public.empresa_equipe (token_convite);

-- 1) Consulta pública do convite ---------------------------------------------
create or replace function public.obter_convite_por_token(p_token text)
returns table (
  empresa_nome text,
  email_convidado text,
  papel text,
  cargo text,
  convite_aceito boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select e.nome, eq.email_convidado, eq.papel, eq.cargo, coalesce(eq.convite_aceito, false)
    from empresa_equipe eq
    join empresas e on e.id = eq.empresa_id
    where eq.token_convite = p_token
    limit 1;
end;
$$;

revoke all on function public.obter_convite_por_token(text) from public;
grant execute on function public.obter_convite_por_token(text) to anon, authenticated;

-- 2) Aceitar o convite (exige login) -----------------------------------------
create or replace function public.aceitar_convite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_convite record;
begin
  if v_user_id is null then
    raise exception 'Você precisa estar logado para aceitar um convite';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  select * into v_convite
  from empresa_equipe
  where token_convite = p_token
  limit 1;

  if v_convite is null then
    raise exception 'Convite não encontrado';
  end if;

  if coalesce(v_convite.convite_aceito, false) then
    raise exception 'Este convite já foi utilizado';
  end if;

  if lower(v_convite.email_convidado) <> lower(v_user_email) then
    raise exception 'Este convite foi enviado para outro e-mail (%). Entre com a conta correta.', v_convite.email_convidado;
  end if;

  insert into empresa_usuarios (empresa_id, user_id, papel)
  values (v_convite.empresa_id, v_user_id, coalesce(v_convite.papel, 'leitor'))
  on conflict (empresa_id, user_id) do nothing;

  update empresa_equipe
  set convite_aceito = true, aceito_em = now(), user_id_convidado = v_user_id
  where id = v_convite.id;

  return v_convite.empresa_id;
end;
$$;

revoke all on function public.aceitar_convite(text) from public;
grant execute on function public.aceitar_convite(text) to authenticated;

-- 3) Verificação (só leitura) -------------------------------------------------
SELECT proname FROM pg_proc WHERE proname IN ('obter_convite_por_token', 'aceitar_convite');

COMMIT;
