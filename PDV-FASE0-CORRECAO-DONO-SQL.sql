-- ============================================================================
-- AXIOMA — PDV Fase 0: correção "dono some da lista de Equipe"
-- Roda independente do PDV-FASE0-EQUIPE-OPERADOR-SQL.sql (antes ou depois,
-- não importa a ordem) — não toca em nenhuma policy de RLS, só dados e uma
-- função. Idempotente, pode rodar mais de uma vez com segurança.
--
-- CAUSA CONFIRMADA (lendo o código, não suposição): a posse de uma empresa
-- sempre existiu de duas formas paralelas — (1) empresas.user_id (quem
-- criou) e (2) uma linha espelho em empresa_usuarios com papel 'dono'. A
-- MIGRACAO-MULTITENANT.sql já semeava essa linha (2) pra toda empresa que
-- existia NAQUELE dia. Mas lib/empresaHelpers.ts:criarEmpresa() — usado no
-- cadastro manual de uma empresa — nunca foi ajustado pra gravar essa linha
-- em empresas criadas DEPOIS daquela migração. Resultado: toda empresa
-- criada por esse caminho desde então tem posse (1) mas não tem (2) —
-- meu_papel() já sabia lidar com isso (tem o mesmo fallback pra
-- empresas.user_id), mas listar_equipe() só olhava (2), então o dono nunca
-- aparecia na própria lista de equipe.
--
-- O QUE FAZ:
--   1) Backfill: garante a linha (2) pra toda empresa que só tem (1) —
--      mesmo INSERT que a migração original já usava, rodando de novo pra
--      cobrir as empresas criadas depois.
--   2) listar_equipe() passa a enxergar o dono mesmo sem a linha (2) —
--      mesma folga que meu_papel() já dá — pra nunca mais depender só do
--      backfill acima (se uma empresa nova escapar do backfill por algum
--      motivo, ainda aparece certo na tela).
--
-- COMO RODAR (2 passos, não um bloco só):
--   1) Rode a verificação no fim deste arquivo PRIMEIRO, sozinha, ANTES do
--      bloco BEGIN/COMMIT abaixo — ela precisa mostrar o estado de ANTES do
--      backfill. Se for rodada depois (dentro do mesmo bloco), o backfill já
--      terá resolvido tudo e ela sempre vai devolver 0 linhas, não provando
--      nada.
--   2) Depois rode o bloco BEGIN/COMMIT abaixo.
-- ============================================================================

-- ============================================================================
-- VERIFICAÇÃO "ANTES" — RODE ESTA CONSULTA SOZINHA, AGORA, ANTES DE CONTINUAR.
-- Mostra toda empresa cujo dono ainda não tem a linha espelho em
-- empresa_usuarios (é o que o backfill abaixo vai corrigir). Guarde o
-- resultado pra comparar depois.
-- ============================================================================
SELECT e.id, e.nome
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM empresa_usuarios eu WHERE eu.empresa_id = e.id AND eu.user_id = e.user_id
);


BEGIN;

-- 1) Backfill — garante 1 linha em empresa_usuarios pro dono de toda empresa
--    que ainda não tem (idêntico ao que MIGRACAO-MULTITENANT.sql já fez,
--    rodando de novo pra pegar empresas criadas depois daquela migração).
insert into empresa_usuarios (empresa_id, user_id, papel)
select e.id, e.user_id, 'dono'
from empresas e
where not exists (
  select 1 from empresa_usuarios eu where eu.empresa_id = e.id and eu.user_id = e.user_id
)
on conflict (empresa_id, user_id) do nothing;

-- 2) listar_equipe() — dono sempre aparece, com ou sem linha em
--    empresa_usuarios (mesmo fallback que meu_papel() já usa).
create or replace function public.listar_equipe(p_empresa_id uuid)
returns table (
  id uuid,
  origem text,
  user_id uuid,
  email text,
  nome text,
  cargo text,
  papel text,
  token_convite text,
  expira_em timestamptz,
  criado_em timestamptz
)
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
    -- Ativos com vínculo real em empresa_usuarios
    select eu.id, 'ativo'::text, eu.user_id, u.email::text,
           coalesce(eq.nome, '')::text, coalesce(eq.cargo, '')::text, eu.papel,
           null::text, null::timestamptz, eu.created_at
    from empresa_usuarios eu
    join auth.users u on u.id = eu.user_id
    left join empresa_equipe eq on eq.user_id_convidado = eu.user_id and eq.empresa_id = eu.empresa_id
    where eu.empresa_id = p_empresa_id

    union all

    -- Dono sem linha em empresa_usuarios ainda (não deveria mais acontecer
    -- depois do backfill do item 1, mas fica de proteção permanente —
    -- nunca deixa o proprietário sumir da própria lista de equipe).
    -- LIMITAÇÃO CONHECIDA: o "id" devolvido aqui é e.user_id (id do usuário),
    -- não o id de uma linha real em empresa_usuarios — essa linha não existe
    -- nesse ramo (é exatamente o que falta e o backfill do item 1 resolve).
    -- Não quebra hoje porque a tela (/equipe) esconde lápis/lixeira pra quem
    -- é "(você)" (ehVoce), e é sempre o dono vendo a própria linha aqui. Se um
    -- dia a tela permitir editar/remover essa linha usando esse id, ela vai
    -- apontar pra um id que não existe em empresa_usuarios — não usar esse id
    -- pra UPDATE/DELETE em empresa_usuarios sem antes resolver essa lacuna.
    select e.user_id, 'ativo'::text, e.user_id, u.email::text,
           coalesce(eq.nome, '')::text, coalesce(eq.cargo, '')::text, 'dono'::text,
           null::text, null::timestamptz, e.created_at
    from empresas e
    join auth.users u on u.id = e.user_id
    left join empresa_equipe eq on eq.user_id_convidado = e.user_id and eq.empresa_id = e.id
    where e.id = p_empresa_id
      and not exists (select 1 from empresa_usuarios eu2 where eu2.empresa_id = e.id and eu2.user_id = e.user_id)

    union all

    -- Convites pendentes
    select eq2.id, 'convite'::text, null::uuid, eq2.email_convidado,
           coalesce(eq2.nome, '')::text, coalesce(eq2.cargo, '')::text, eq2.papel,
           eq2.token_convite, eq2.expira_em, eq2.created_at
    from empresa_equipe eq2
    where eq2.empresa_id = p_empresa_id and not coalesce(eq2.convite_aceito, false)

    order by criado_em desc;
end;
$$;

revoke all on function public.listar_equipe(uuid) from public;
grant execute on function public.listar_equipe(uuid) to authenticated;

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO "DEPOIS" — rode esta mesma consulta de novo, agora que o bloco
-- acima já rodou. Deve devolver 0 linhas (prova que o backfill cobriu todo
-- mundo). Se sobrar alguma linha aqui, me avise antes de considerar concluído.
-- ============================================================================
SELECT e.id, e.nome
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM empresa_usuarios eu WHERE eu.empresa_id = e.id AND eu.user_id = e.user_id
);
