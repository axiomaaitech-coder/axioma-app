-- ============================================================================
-- AXIOMA — Empresa padrão automática (pré-requisito da tela de aceitar convite)
-- Decidido com Elias em 2026-07-23, junto com a Parte 6 (ajuste de código) da
-- migração multi-tenant. Rodar UMA VEZ no SQL Editor do Supabase.
--
-- O QUE FAZ:
--   1) Coluna nova `cadastro_completo` em `empresas` — marca quando uma empresa
--      foi criada automaticamente (dado vazio) vs. cadastrada de verdade.
--   2) Função `obter_ou_criar_empresa_padrao()` — dado o usuário logado:
--        a) se ele já é DONO de uma empresa própria, retorna ela
--        b) senão, se ele já tem VÍNCULO como convidado (empresa_usuarios),
--           retorna a empresa do vínculo — NUNCA cria uma nova pra quem já
--           foi convidado (é o que evita o convidado ficar preso numa
--           empresa vazia própria em vez de ver os dados do cliente dele)
--        c) só se não houver nenhuma das duas, cria "Minha Empresa" vazia
--           (cadastro_completo = false) e a marca como dono
--      Atômica: usa advisory lock por usuário, então duas gravações
--      simultâneas (2 abas, dupla chamada) nunca criam duas empresas.
-- ============================================================================

BEGIN;

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS cadastro_completo boolean NOT NULL DEFAULT true;

-- Nenhuma empresa existente muda de status (todas continuam "completas") —
-- só as criadas a partir de agora pela função abaixo nascem incompletas.

create or replace function public.obter_ou_criar_empresa_padrao()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_empresa_id uuid;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  -- Trava por usuário: evita duas criações simultâneas (corrida entre abas).
  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  -- (a) empresa própria (dono)
  select id into v_empresa_id
  from empresas
  where user_id = v_user_id and ativo = true
  order by created_at asc
  limit 1;
  if v_empresa_id is not null then
    return v_empresa_id;
  end if;

  -- (b) vínculo existente (convidado — contador, funcionário)
  select empresa_id into v_empresa_id
  from empresa_usuarios
  where user_id = v_user_id
  limit 1;
  if v_empresa_id is not null then
    return v_empresa_id;
  end if;

  -- (c) nem dono nem convidado: cria "Minha Empresa" vazia, sinalizada incompleta
  insert into empresas (user_id, nome, ativo, cadastro_completo)
  values (v_user_id, 'Minha Empresa', true, false)
  returning id into v_empresa_id;

  insert into empresa_usuarios (empresa_id, user_id, papel)
  values (v_empresa_id, v_user_id, 'dono')
  on conflict (empresa_id, user_id) do nothing;

  return v_empresa_id;
end;
$$;

revoke all on function public.obter_ou_criar_empresa_padrao() from public;
grant execute on function public.obter_ou_criar_empresa_padrao() to authenticated;

COMMIT;
