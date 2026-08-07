-- ============================================================================
-- AXIOMA — Corrige a política de "empresas": leitura bloqueava quem é dono
-- só via empresa_usuarios (não é empresas.user_id, o criador original).
--
-- CAUSA CONFIRMADA (SQL Editor, Elias): política atual é uma única
-- "empresas_own | ALL | (user_id = (SELECT auth.uid()))" — só permite ver/
-- editar/apagar quem CRIOU a empresa. Convidado com papel 'dono' via
-- empresa_usuarios nunca lê a própria empresa. Efeito: /empresa aparecia
-- vazio (obterEmpresaAtiva() achava o id certo, carregarEmpresaPorId()
-- voltava nulo) e atualizarEmpresa()/config de Estoque salvavam ZERO linhas
-- em silêncio (corrigido em paralelo no código — ver commit desta rodada).
--
-- O QUE FAZ: troca a única política "FOR ALL" por 4 políticas separadas,
-- cada uma com sua própria regra (não dá pra ter regras diferentes por
-- operação numa política só "FOR ALL"):
--   1) SELECT — dono original OU qualquer vínculo em empresa_usuarios
--      (qualquer papel, inclusive operador — nome/CNPJ é dado cadastral
--      necessário pra operar, não financeiro).
--   2) UPDATE — só dono original OU papel 'dono' em empresa_usuarios.
--   3) INSERT — inalterado (só cria em nome do próprio usuário).
--   4) DELETE — só dono original (decisão explícita: nunca dono-por-vínculo
--      apaga a empresa de outro).
--
-- SOBRE RECURSÃO (verificado, não suposto — mesma checagem já documentada em
-- PDV-FASE0-EQUIPE-OPERADOR-SQL.sql): tanto SELECT quanto UPDATE usam
-- subselect DIRETO em empresa_usuarios (sem passar por meu_papel() — ver
-- nota abaixo sobre por quê). Essas subconsultas respeitam a RLS de
-- empresa_usuarios, cujo primeiro ramo já é "user_id = auth.uid()" —
-- exatamente o filtro usado nas duas subconsultas — então nunca precisam do
-- segundo ramo (que chama meu_papel()) pra resolver. Cadeia termina em 1
-- passo, não recursiona.
--
-- POR QUE UPDATE NÃO USA meu_papel() (correção pedida pelo Elias, motivo
-- verificado): meu_papel() resolve com COALESCE — primeiro olha a linha em
-- empresa_usuarios, só cai pro fallback "empresas.user_id" se aquela linha
-- não existir. Isso é um problema aqui: se o dono original (empresas.user_id)
-- tiver sua própria linha em empresa_usuarios rebaixada pra outro papel (a
-- tela /equipe permite trocar o papel de qualquer membro; o gatilho
-- protege_ultimo_dono() só impede ficar ZERO 'dono' — com 2 donos, dá pra
-- rebaixar o criador original sem travar nada), meu_papel() passaria a
-- devolver o papel errado e trancaria o dono de verdade fora do próprio
-- cadastro. O subselect explícito abaixo não sofre disso: as duas condições
-- (user_id = auth.uid() OU papel 'dono' em empresa_usuarios) são
-- independentes, uma não mascara a outra.
--
-- STATUS: revisado e APLICADO por Elias em 2026-08-06.
-- Idempotente — pode rodar de novo com segurança se precisar.
-- ============================================================================


-- ============================================================================
-- VERIFICAÇÃO "ANTES" — RODE SOZINHA, AGORA, ANTES DE CONTINUAR. Confirma que
-- a política atual é exatamente a reportada (1 linha, "empresas_own", ALL).
-- ============================================================================
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'empresas';


BEGIN;

-- No-op de segurança — a tabela já tem RLS ligado (já tinha política antes),
-- isso só garante que continua ligado.
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS empresas_own ON public.empresas;
DROP POLICY IF EXISTS empresas_select ON public.empresas;
DROP POLICY IF EXISTS empresas_update ON public.empresas;
DROP POLICY IF EXISTS empresas_insert ON public.empresas;
DROP POLICY IF EXISTS empresas_delete ON public.empresas;

-- 1) SELECT — dono original OU vínculo em empresa_usuarios (qualquer papel)
create policy empresas_select on public.empresas
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or id in (select empresa_id from empresa_usuarios where user_id = (select auth.uid()))
  );

-- 2) UPDATE — dono original OU papel 'dono' via empresa_usuarios (subselect
-- explícito, não meu_papel() — ver nota no cabeçalho sobre o coalesce).
create policy empresas_update on public.empresas
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or id in (select empresa_id from empresa_usuarios where user_id = (select auth.uid()) and papel = 'dono')
  )
  with check (
    user_id = (select auth.uid())
    or id in (select empresa_id from empresa_usuarios where user_id = (select auth.uid()) and papel = 'dono')
  );

-- 3) INSERT — inalterado
create policy empresas_insert on public.empresas
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- 4) DELETE — só o criador original
create policy empresas_delete on public.empresas
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Verificação (só leitura) — confirma as 4 políticas novas.
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'empresas'
ORDER BY policyname;

COMMIT;


-- ============================================================================
-- ROLLBACK — SÓ RODAR SE ALGO QUEBRAR DEPOIS DE APLICAR O BLOCO ACIMA.
-- Devolve exatamente a política de hoje: 1 única "FOR ALL", com USING e
-- WITH CHECK iguais (confirmado no SQL Editor: os dois existem e são
-- idênticos na política atual — não é só USING).
-- Descomente e rode como bloco único.
-- ============================================================================
-- BEGIN;
--
-- DROP POLICY IF EXISTS empresas_select ON public.empresas;
-- DROP POLICY IF EXISTS empresas_update ON public.empresas;
-- DROP POLICY IF EXISTS empresas_insert ON public.empresas;
-- DROP POLICY IF EXISTS empresas_delete ON public.empresas;
--
-- create policy empresas_own on public.empresas
--   for all to authenticated
--   using (user_id = (select auth.uid()))
--   with check (user_id = (select auth.uid()));
--
-- COMMIT;
-- ============================================================================
