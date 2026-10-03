-- ============================================================================
-- AXIOMA — Hierarquia da Equipe (aprovada pelo Elias em 2026-10-02).
-- Níveis: 1 Proprietário (dono da empresa) · 2 CEO · 3 Sócio · 4 Admin ·
--         5 demais (Contador, Financeiro, Contábil, Consultor, Leitor, Caixa).
-- Regras (bloco 5: quem tem PRAZO sai de vez, sem restaurar):
--   - Ninguém remove o Proprietário (ele também não "sai": só transfere).
--   - CEO: sai sozinho, prazo vence, ou Proprietário + aval de 1 Sócio (ou
--     Sócio + aval do Proprietário). Sem sócio, o Proprietário conclui com motivo.
--   - Sócio remove outro Sócio só com aval do CEO (sem CEO: do Proprietário).
--   - Sócio/CEO/Proprietário removem Admin direto; Admin↔Admin precisa aval
--     de Sócio/CEO/Proprietário.
--   - Nível 5: Admin ou acima remove direto.
--   - Aval vale 7 dias; depois, quem está acima pode decidir; se não existe
--     ninguém acima, quem pediu conclui com motivo (nunca trava a empresa).
--   - Remover = SUSPENDER por 7 dias (dá pra restaurar). Sair é livre.
-- Rodar um bloco por vez, na ordem. Idempotente.
-- ============================================================================


-- ============================== BLOCO 1 =====================================
-- Suspensão reversível + pedidos de aval + função de nível
ALTER TABLE public.empresa_usuarios
  ADD COLUMN IF NOT EXISTS suspenso_em timestamptz,
  ADD COLUMN IF NOT EXISTS suspenso_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspenso_motivo text;

CREATE TABLE IF NOT EXISTS public.equipe_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  alvo_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pedido_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo text NOT NULL,
  nivel_aval integer NOT NULL,          -- quem aprova: nível <= este
  situacao text NOT NULL DEFAULT 'aberto', -- aberto | aprovado | recusado | concluido_sem_aval | cancelado
  decidido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decidido_em timestamptz,
  motivo_decisao text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);
CREATE INDEX IF NOT EXISTS idx_equipe_pedidos_empresa ON public.equipe_pedidos (empresa_id, situacao, criado_em DESC);

-- Nível de uma pessoa na empresa (null = sem acesso ativo)
create or replace function public.equipe_nivel(p_empresa uuid, p_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from empresas where id = p_empresa and user_id = p_user) then 1
    else (
      select case when eu.papel = 'dono' then 1
                  when x.relacao = 'ceo' then 2
                  when x.relacao = 'socio' then 3
                  when eu.papel = 'admin' then 4
                  else 5 end
      from empresa_usuarios eu
      left join lateral (
        select q.relacao from empresa_equipe q
        where q.empresa_id = eu.empresa_id
          and (q.id = eu.convite_id or (eu.convite_id is null and q.user_id_convidado = eu.user_id))
        order by q.created_at desc limit 1
      ) x on true
      where eu.empresa_id = p_empresa and eu.user_id = p_user
        and eu.suspenso_em is null
        and (eu.acesso_expira_em is null or eu.acesso_expira_em > now())
      limit 1
    )
  end
$$;
revoke all on function public.equipe_nivel(uuid, uuid) from public;
grant execute on function public.equipe_nivel(uuid, uuid) to authenticated;

ALTER TABLE public.equipe_pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS equipe_pedidos_leitura ON public.equipe_pedidos;
CREATE POLICY equipe_pedidos_leitura ON public.equipe_pedidos FOR SELECT TO authenticated
  USING (public.equipe_nivel(empresa_id, (select auth.uid())) <= 4);
-- (sem INSERT/UPDATE/DELETE direto: só pelas funções do BLOCO 3)

SELECT 'bloco 1 ok' AS resultado,
  (select count(*) from information_schema.columns where table_name = 'empresa_usuarios' and column_name like 'suspenso%') AS colunas_suspensao;


-- ============================== BLOCO 2 =====================================
-- Suspenso perde o acesso na hora (mesmo efeito de prazo vencido)
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
    and suspenso_em is null
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
    and suspenso_em is null
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
        and suspenso_em is null
        and (acesso_expira_em is null or acesso_expira_em > now())
      limit 1),
    (select 'dono' from empresas where id = p_empresa_id and user_id = (select auth.uid()) limit 1)
  )
$$;

SELECT 'bloco 2 ok' AS resultado;


-- ============================== BLOCO 3 =====================================
-- Ações da Equipe (únicas portas para remover, aprovar, restaurar, trocar papel)

-- Existe alguém (fora quem pediu e o alvo) com nível <= p_nivel?
create or replace function public.equipe_tem_aprovador(p_empresa uuid, p_nivel integer, p_fora1 uuid, p_fora2 uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from (
      select user_id from empresas where id = p_empresa
      union
      select user_id from empresa_usuarios where empresa_id = p_empresa
    ) pessoas
    where pessoas.user_id not in (p_fora1, p_fora2)
      and public.equipe_nivel(p_empresa, pessoas.user_id) <= p_nivel
  )
$$;
revoke all on function public.equipe_tem_aprovador(uuid, integer, uuid, uuid) from public;

create or replace function public.equipe_suspender(p_empresa uuid, p_alvo uuid, p_por uuid, p_motivo text)
returns void
language sql
security definer
set search_path = public
as $$
  update empresa_usuarios
  set suspenso_em = now(), suspenso_por = p_por, suspenso_motivo = p_motivo
  where empresa_id = p_empresa and user_id = p_alvo and suspenso_em is null;
  update equipe_pedidos set situacao = 'cancelado', decidido_em = now()
  where empresa_id = p_empresa and alvo_user_id = p_alvo and situacao = 'aberto';
$$;
revoke all on function public.equipe_suspender(uuid, uuid, uuid, text) from public;

-- Remover alguém (ou sair). Devolve: 'suspenso' | 'pedido' | 'saiu'
create or replace function public.equipe_remover(p_empresa uuid, p_alvo uuid, p_motivo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eu uuid := (select auth.uid());
  v_l integer := public.equipe_nivel(p_empresa, (select auth.uid()));
  v_t integer;
  v_aval integer;
  v_motivo text := nullif(trim(coalesce(p_motivo, '')), '');
begin
  if v_l is null then raise exception 'Você não tem acesso a esta empresa' using errcode = 'AX020'; end if;

  -- Sair por conta própria: livre, menos o Proprietário (precisa transferir)
  if p_alvo = v_eu then
    if v_l = 1 then raise exception 'O Proprietário não pode sair: transfira a empresa antes' using errcode = 'AX021'; end if;
    perform public.equipe_suspender(p_empresa, v_eu, v_eu, coalesce(v_motivo, 'Saiu por conta própria'));
    return 'saiu';
  end if;

  if v_motivo is null or length(v_motivo) < 5 then
    raise exception 'Escreva o motivo (mínimo 5 letras)' using errcode = 'AX022';
  end if;
  v_t := public.equipe_nivel(p_empresa, p_alvo);
  if v_t is null then raise exception 'Esta pessoa não tem acesso ativo' using errcode = 'AX023'; end if;
  if v_t = 1 then raise exception 'Ninguém remove o Proprietário' using errcode = 'AX024'; end if;

  -- Quem pode remover direto, e de quem precisa de aval
  v_aval := case
    when v_t = 2 and v_l = 1 then 3          -- CEO: Proprietário + aval de Sócio
    when v_t = 2 and v_l = 3 then 1          -- CEO: Sócio + aval do Proprietário
    when v_t = 3 and v_l <= 2 then 0         -- Sócio: CEO/Proprietário direto
    when v_t = 3 and v_l = 3 then 2          -- Sócio↔Sócio: aval do CEO (ou Proprietário)
    when v_t = 4 and v_l <= 3 then 0         -- Admin: Sócio/CEO/Proprietário direto
    when v_t = 4 and v_l = 4 then 3          -- Admin↔Admin: aval de Sócio ou acima
    when v_t = 5 and v_l <= 4 then 0         -- demais: Admin ou acima direto
    else -1 end;
  if v_aval < 0 then raise exception 'Seu nível não permite remover esta pessoa' using errcode = 'AX025'; end if;

  -- Sem ninguém acima para dar o aval: conclui com motivo (nunca trava a empresa)
  if v_aval = 0 or not public.equipe_tem_aprovador(p_empresa, v_aval, v_eu, p_alvo) then
    perform public.equipe_suspender(p_empresa, p_alvo, v_eu, v_motivo);
    return 'suspenso';
  end if;

  if exists (select 1 from equipe_pedidos where empresa_id = p_empresa and alvo_user_id = p_alvo and situacao = 'aberto') then
    raise exception 'Já existe um pedido aberto para esta pessoa' using errcode = 'AX026';
  end if;
  insert into equipe_pedidos (empresa_id, alvo_user_id, pedido_por, motivo, nivel_aval)
  values (p_empresa, p_alvo, v_eu, v_motivo, v_aval);
  return 'pedido';
end;
$$;
revoke all on function public.equipe_remover(uuid, uuid, text) from public;
grant execute on function public.equipe_remover(uuid, uuid, text) to authenticated;

-- Aprovar/recusar um pedido (nível <= nivel_aval, nem quem pediu nem o alvo)
create or replace function public.equipe_decidir_pedido(p_pedido uuid, p_aprovar boolean, p_motivo text DEFAULT NULL)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eu uuid := (select auth.uid());
  v_p record;
begin
  select * into v_p from equipe_pedidos where id = p_pedido for update;
  if v_p is null or v_p.situacao <> 'aberto' then raise exception 'Pedido não está aberto' using errcode = 'AX027'; end if;
  if v_eu in (v_p.pedido_por, v_p.alvo_user_id) then raise exception 'Você não pode decidir este pedido' using errcode = 'AX028'; end if;
  if coalesce(public.equipe_nivel(v_p.empresa_id, v_eu), 99) > v_p.nivel_aval then
    raise exception 'Seu nível não permite decidir este pedido' using errcode = 'AX028';
  end if;
  if p_aprovar then
    perform public.equipe_suspender(v_p.empresa_id, v_p.alvo_user_id, v_p.pedido_por, v_p.motivo);
  end if;
  update equipe_pedidos set situacao = case when p_aprovar then 'aprovado' else 'recusado' end,
    decidido_por = v_eu, decidido_em = now(), motivo_decisao = nullif(trim(coalesce(p_motivo, '')), '')
  where id = p_pedido;
end;
$$;
revoke all on function public.equipe_decidir_pedido(uuid, boolean, text) from public;
grant execute on function public.equipe_decidir_pedido(uuid, boolean, text) to authenticated;

-- Pedido venceu (7 dias) e não há ninguém ACIMA do nível de aval: quem pediu conclui
create or replace function public.equipe_concluir_pedido(p_pedido uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eu uuid := (select auth.uid());
  v_p record;
begin
  select * into v_p from equipe_pedidos where id = p_pedido for update;
  if v_p is null or v_p.situacao <> 'aberto' then raise exception 'Pedido não está aberto' using errcode = 'AX027'; end if;
  if v_p.pedido_por <> v_eu then raise exception 'Só quem pediu pode concluir' using errcode = 'AX028'; end if;
  if v_p.expira_em > now() then raise exception 'O prazo de aval (7 dias) ainda não venceu' using errcode = 'AX029'; end if;
  if v_p.nivel_aval > 1 and public.equipe_tem_aprovador(v_p.empresa_id, v_p.nivel_aval - 1, v_eu, v_p.alvo_user_id) then
    raise exception 'Ainda existe alguém acima para decidir' using errcode = 'AX030';
  end if;
  if length(trim(coalesce(p_motivo, ''))) < 5 then raise exception 'Escreva o motivo (mínimo 5 letras)' using errcode = 'AX022'; end if;
  perform public.equipe_suspender(v_p.empresa_id, v_p.alvo_user_id, v_eu, v_p.motivo || ' | concluído sem aval: ' || trim(p_motivo));
  update equipe_pedidos set situacao = 'concluido_sem_aval', decidido_por = v_eu, decidido_em = now(),
    motivo_decisao = trim(p_motivo)
  where id = p_pedido;
end;
$$;
revoke all on function public.equipe_concluir_pedido(uuid, text) from public;
grant execute on function public.equipe_concluir_pedido(uuid, text) to authenticated;

-- Restaurar quem foi suspenso há menos de 7 dias (Sócio ou acima, ou quem suspendeu)
create or replace function public.equipe_restaurar(p_empresa uuid, p_alvo uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eu uuid := (select auth.uid());
  v_l integer := public.equipe_nivel(p_empresa, (select auth.uid()));
  v_s record;
begin
  select * into v_s from empresa_usuarios where empresa_id = p_empresa and user_id = p_alvo for update;
  if v_s is null or v_s.suspenso_em is null then raise exception 'Esta pessoa não está suspensa' using errcode = 'AX031'; end if;
  if v_s.suspenso_em < now() - interval '7 days' then raise exception 'Passou o prazo de 7 dias para restaurar' using errcode = 'AX032'; end if;
  if v_l is null or (v_l > 3 and v_s.suspenso_por is distinct from v_eu) then
    raise exception 'Seu nível não permite restaurar' using errcode = 'AX025';
  end if;
  update empresa_usuarios set suspenso_em = null, suspenso_por = null, suspenso_motivo = null
  where empresa_id = p_empresa and user_id = p_alvo;
end;
$$;
revoke all on function public.equipe_restaurar(uuid, uuid) from public;
grant execute on function public.equipe_restaurar(uuid, uuid) to authenticated;

-- Trocar o papel: só quem está acima; dar "admin" só Sócio ou acima
create or replace function public.equipe_trocar_papel(p_empresa uuid, p_alvo uuid, p_papel text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_l integer := public.equipe_nivel(p_empresa, (select auth.uid()));
  v_t integer := public.equipe_nivel(p_empresa, p_alvo);
begin
  if p_papel not in ('admin', 'financeiro', 'contabil', 'leitor', 'operador') then
    raise exception 'Papel inválido' using errcode = 'AX033';
  end if;
  if v_l is null or v_t is null or v_t = 1 or v_l >= v_t then
    raise exception 'Seu nível não permite trocar o papel desta pessoa' using errcode = 'AX025';
  end if;
  if p_papel = 'admin' and v_l > 3 then
    raise exception 'Só Sócio, CEO ou Proprietário dão o papel de Admin' using errcode = 'AX025';
  end if;
  update empresa_usuarios set papel = p_papel where empresa_id = p_empresa and user_id = p_alvo;
end;
$$;
revoke all on function public.equipe_trocar_papel(uuid, uuid, text) from public;
grant execute on function public.equipe_trocar_papel(uuid, uuid, text) to authenticated;

SELECT 'bloco 3 ok' AS resultado, count(*) AS funcoes
FROM pg_proc WHERE proname IN ('equipe_remover', 'equipe_decidir_pedido', 'equipe_concluir_pedido', 'equipe_restaurar', 'equipe_trocar_papel', 'equipe_tem_aprovador', 'equipe_suspender');


-- ============================== BLOCO 4 =====================================
-- Lista da equipe: Admin ou acima vê; + nível, suspensão e meu nível.
-- Fecha a porta antiga: ninguém altera/apaga acesso direto pela tabela.
drop function if exists public.listar_equipe(uuid);
create function public.listar_equipe(p_empresa_id uuid)
returns table (id uuid, origem text, user_id uuid, email text, nome text, cargo text, papel text,
               token_convite text, expira_em timestamptz, criado_em timestamptz, situacao text, relacao text,
               nivel integer, suspenso_em timestamptz, suspenso_motivo text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(public.equipe_nivel(p_empresa_id, (select auth.uid())), 99) > 4 then
    raise exception 'Só Admin, Sócio, CEO ou Proprietário veem a equipe.' using errcode = 'AX006';
  end if;

  return query
    select eu.id, 'ativo'::text, eu.user_id, u.email::text,
           coalesce(eq.convidado_nome_termo, eq.nome, '')::text, coalesce(eq.cargo, '')::text, eu.papel,
           null::text, eu.acesso_expira_em, eu.created_at,
           case when eu.suspenso_em is not null then 'suspenso' else 'aprovado' end::text, eq.relacao,
           case when exists (select 1 from empresas e2 where e2.id = eu.empresa_id and e2.user_id = eu.user_id) or eu.papel = 'dono' then 1
                when eq.relacao = 'ceo' then 2 when eq.relacao = 'socio' then 3 when eu.papel = 'admin' then 4 else 5 end,
           eu.suspenso_em, eu.suspenso_motivo
    from empresa_usuarios eu
    join auth.users u on u.id = eu.user_id
    left join lateral (
      select x.convidado_nome_termo, x.nome, x.cargo, x.relacao from empresa_equipe x
      where x.empresa_id = eu.empresa_id
        and (x.id = eu.convite_id or (eu.convite_id is null and x.user_id_convidado = eu.user_id))
      order by x.created_at desc limit 1
    ) eq on true
    where eu.empresa_id = p_empresa_id
      and (eu.suspenso_em is null or eu.suspenso_em > now() - interval '7 days')

    union all

    select e.user_id, 'ativo'::text, e.user_id, u.email::text,
           ''::text, ''::text, 'dono'::text,
           null::text, null::timestamptz, e.created_at, 'aprovado'::text, null::text,
           1, null::timestamptz, null::text
    from empresas e
    join auth.users u on u.id = e.user_id
    where e.id = p_empresa_id
      and not exists (select 1 from empresa_usuarios eu2 where eu2.empresa_id = e.id and eu2.user_id = e.user_id)

    union all

    select eq2.id, 'convite'::text, eq2.user_id_convidado, coalesce(eq2.email_convidado, ''),
           coalesce(eq2.convidado_nome_termo, eq2.nome, '')::text, coalesce(eq2.cargo, '')::text, eq2.papel,
           eq2.token_convite, eq2.expira_em, eq2.created_at, eq2.situacao, eq2.relacao,
           null::integer, null::timestamptz, null::text
    from empresa_equipe eq2
    where eq2.empresa_id = p_empresa_id and not coalesce(eq2.convite_aceito, false) and eq2.situacao <> 'recusado'

    order by 10 desc;
end;
$$;
revoke all on function public.listar_equipe(uuid) from public;
grant execute on function public.listar_equipe(uuid) to authenticated;

DROP POLICY IF EXISTS empresa_usuarios_update ON public.empresa_usuarios;
DROP POLICY IF EXISTS empresa_usuarios_delete ON public.empresa_usuarios;

SELECT 'bloco 4 ok' AS resultado,
  (select count(*) from pg_policies where tablename = 'empresa_usuarios') AS politicas_restantes;


-- ============================== BLOCO 5 =====================================
-- Regra do Elias (2026-10-02): quem entrou COM PRAZO (24h, 7, 30 dias...) e tem
-- o acesso cortado sai DE VEZ — sem "Restaurar"; se precisar, novo convite.
-- Suspensão de 7 dias (restaurável) fica só para quem não tem prazo.
create or replace function public.equipe_suspender(p_empresa uuid, p_alvo uuid, p_por uuid, p_motivo text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from empresa_usuarios
  where empresa_id = p_empresa and user_id = p_alvo and acesso_expira_em is not null;
  update empresa_usuarios
  set suspenso_em = now(), suspenso_por = p_por, suspenso_motivo = p_motivo
  where empresa_id = p_empresa and user_id = p_alvo and suspenso_em is null;
  update equipe_pedidos set situacao = 'cancelado', decidido_em = now()
  where empresa_id = p_empresa and alvo_user_id = p_alvo and situacao = 'aberto';
$$;
revoke all on function public.equipe_suspender(uuid, uuid, uuid, text) from public;

SELECT 'bloco 5 ok' AS resultado;

-- ============================== BLOCO 6 =====================================
-- Regra do Elias (2026-10-03): convite de ATÉ 30 DIAS cortado zera de vez (novo
-- convite começa do zero). Acima de 30 dias ou sem prazo: suspende e dá para
-- restaurar com tudo de volta.
create or replace function public.equipe_suspender(p_empresa uuid, p_alvo uuid, p_por uuid, p_motivo text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from empresa_usuarios eu
  where eu.empresa_id = p_empresa and eu.user_id = p_alvo and eu.acesso_expira_em is not null
    and coalesce((select q.acesso_dias from empresa_equipe q where q.id = eu.convite_id), 0) <= 30;
  update empresa_usuarios
  set suspenso_em = now(), suspenso_por = p_por, suspenso_motivo = p_motivo
  where empresa_id = p_empresa and user_id = p_alvo and suspenso_em is null;
  update equipe_pedidos set situacao = 'cancelado', decidido_em = now()
  where empresa_id = p_empresa and alvo_user_id = p_alvo and situacao = 'aberto';
$$;
revoke all on function public.equipe_suspender(uuid, uuid, uuid, text) from public;

SELECT 'bloco 6 ok' AS resultado;
