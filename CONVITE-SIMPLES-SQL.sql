-- CONVITE SIMPLES (pedido do Elias, 2026-10-02): quem recebe o convite
-- preenche o nome, aceita os Termos e ENTRA NA HORA. Sem CPF, sem esperar
-- aprovação. O dono continua podendo cortar o acesso a qualquer momento
-- (tela Equipe) e o prazo (24h/3/7/30/60/90) começa a contar no aceite.

drop function if exists public.aceitar_convite(text, text, text, text, boolean, boolean);
create or replace function public.aceitar_convite(p_token text, p_nome text, p_aceita_termos boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_convite record;
  v_expira timestamptz;
begin
  if v_user_id is null then
    raise exception 'Você precisa estar logado para aceitar um convite' using errcode = 'AX007';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 2 or not coalesce(p_aceita_termos, false) then
    raise exception 'Digite seu nome e aceite os Termos' using errcode = 'AX009';
  end if;
  select email into v_user_email from auth.users where id = v_user_id;
  select * into v_convite from empresa_equipe where token_convite = p_token limit 1 for update;
  if v_convite is null then
    raise exception 'Convite não encontrado' using errcode = 'AX002';
  end if;
  if v_convite.situacao in ('aprovado', 'recusado')
     or (v_convite.user_id_convidado is not null and v_convite.user_id_convidado <> v_user_id) then
    raise exception 'Este convite já foi utilizado' using errcode = 'AX003';
  end if;
  if v_convite.expira_em < now() then
    raise exception 'Este convite expirou' using errcode = 'AX004';
  end if;
  if coalesce(v_convite.email_convidado, '') <> '' and lower(v_convite.email_convidado) <> lower(v_user_email) then
    raise exception 'Este convite foi enviado para outro e-mail (%). Entre com a conta correta.', v_convite.email_convidado using errcode = 'AX005';
  end if;

  v_expira := case when v_convite.acesso_dias is null then null
                   else now() + make_interval(days => v_convite.acesso_dias) end;

  insert into empresa_usuarios (empresa_id, user_id, papel, acesso_expira_em, convite_id)
  values (v_convite.empresa_id, v_user_id, coalesce(v_convite.papel, 'leitor'), v_expira, v_convite.id)
  on conflict (empresa_id, user_id) do update
    set acesso_expira_em = excluded.acesso_expira_em, convite_id = excluded.convite_id, papel = excluded.papel;

  update empresa_equipe
  set user_id_convidado = v_user_id, situacao = 'aprovado', convite_aceito = true, aceito_em = now(),
      convidado_nome_termo = trim(p_nome), convidado_termo_em = now()
  where id = v_convite.id;

  -- registro do aceite (quem, quando, e-mail) — o dono vê na tela Equipe
  insert into empresa_convite_termo (empresa_id, convite_id, user_id, nome, email, remetente_nome,
    confirmou_remetente, aceitou_termos_lgpd, relacao, papel, acesso_dias, motivo_convite, convidado_em)
  values (v_convite.empresa_id, v_convite.id, v_user_id, trim(p_nome), lower(v_user_email), v_convite.remetente_nome,
    true, true, v_convite.relacao, v_convite.papel, v_convite.acesso_dias, v_convite.motivo_convite, v_convite.created_at);

  return v_convite.empresa_id;
end;
$$;
revoke all on function public.aceitar_convite(text, text, boolean) from public;
grant execute on function public.aceitar_convite(text, text, boolean) to authenticated;
