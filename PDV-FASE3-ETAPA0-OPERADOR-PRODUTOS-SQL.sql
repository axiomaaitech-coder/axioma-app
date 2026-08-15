-- ============================================================================
-- AXIOMA — PDV Fase 3, Etapa 0: fundação de segurança pro operador ler
-- produtos na frente de caixa (SEM ver custo/margem). Vem antes de qualquer
-- tela — Etapa 1 (tabelas de venda + carrinho) só começa depois desta.
--
-- DECISÃO DO DONO (Elias, já tomada — não é decisão deste SQL): o operador lê
-- produtos SÓ pelas colunas seguras (nome, preço de venda, código de barras/
-- SKU, unidade/categoria, saldo) — NUNCA preco_custo, preco_medio,
-- preco_medio_anterior, margem, markup, nem os impostos (ncm/cest/cfop/ipi/
-- icms/pis/cofins/iss, que também não são assunto de quem só vende). O corte
-- é no BANCO, não só na tela — F12/DevTools não pode revelar essas colunas
-- pro operador, mesmo que a tela nunca renderize.
--
-- CONTEXTO já confirmado (ver PDV-FASE0-EQUIPE-OPERADOR-SQL.sql):
--   - meu_papel(empresa_id) resolve o papel; papel 'operador' já existe.
--   - A RLS de descoberta dinâmica daquele arquivo bloqueia o operador (por
--     LINHA) em TODA tabela com empresa_id — incluindo produtos. Isso é
--     CORRETO e continua assim: a tabela crua public.produtos permanece
--     bloqueada pro operador depois deste SQL também. Este SQL não mexe
--     nessa política nem precisa mexer.
--   - lib/pdvHelpers.ts já tem COLUNAS_SEGURAS (mesma lista exata usada
--     abaixo) esperando esse dia — column-level security já pensada no
--     código, faltando só a trava real no banco.
--
-- ABORDAGEM ESCOLHIDA: VIEW com filtro de coluna embutido, NÃO column-level
-- GRANT/REVOKE. Motivo específico deste projeto (não é preferência de
-- estilo): toda a segurança do Axioma no Postgres é feita via RLS por LINHA
-- usando auth.uid() dentro das políticas/funções (meu_papel, empresas_do_
-- usuario, etc.) — nunca por ROLE do Postgres, porque o Supabase conecta
-- TODOS os usuários autenticados (dono, operador, admin...) com o MESMO role
-- do Postgres: "authenticated". Um GRANT SELECT (colunas) ON produtos TO
-- authenticated valeria IGUAL pra dono e operador, porque os dois são o
-- MESMO role no banco — não existe "role operador" e "role dono" separados
-- pro Postgres distinguir. Column-level GRANT/REVOKE é seguro só quando
-- roles do banco mapeiam 1:1 pra papéis de aplicação, o que não é o caso
-- aqui. Uma VIEW com WHERE explícito, controlada por auth.uid() dentro de
-- empresas_do_usuario(), resolve isso: quem view é não depende do role do
-- Postgres, depende de qual query o app manda.
--
-- MECANISMO DA VIEW (mesmo truque que meu_papel()/empresas_do_usuario() já
-- usam em produção, documentado no cabeçalho de PDV-FASE0-EQUIPE-OPERADOR-
-- SQL.sql): a view é criada SEM "security_invoker" (SEM_INVOKER = comporta-
-- mento clássico do Postgres, dono da view por trás). Isso é DE PROPÓSITO
-- o OPOSTO do padrão já usado em vw_estoque_por_segmento (que usa
-- security_invoker = true). Se esta view usasse security_invoker = true, a
-- leitura de dentro dela rodaria com a identidade do operador de verdade, a
-- RLS de produtos bloquearia por LINHA e a view devolveria ZERO linhas —
-- inutilizando o propósito. Sem security_invoker, a consulta INTERNA da view
-- roda com o dono da view (que não sofre RLS de produtos, contanto que
-- produtos não tenha FORCE ROW LEVEL SECURITY — conferido: não tem, ver nota
-- em PDV-FASE0-EQUIPE-OPERADOR-SQL.sql), e o WHERE explícito da view
-- (empresa_id IN empresas_do_usuario()) vira a ÚNICA fonte de isolamento
-- multi-tenant pra quem consulta a view — por isso o WHERE é obrigatório
-- dentro da view, nunca deixado pra RLS externa resolver.
-- security_barrier = true também é ligado: evita que uma função marcada
-- LEAKY empurrada de fora pro WHERE da view rode ANTES do filtro de
-- empresa_id/colunas (proteção padrão do Postgres pra views que implementam
-- regra de segurança por conta própria, recomendada pela documentação oficial
-- pra exatamente este padrão).
--
-- Idempotente — pode rodar mais de uma vez com segurança. NÃO ALTERADO
-- código de app nesta etapa — só este arquivo SQL.
-- ============================================================================


-- ============================================================================
-- PASSO 0 — RODE SOZINHO PRIMEIRO, ANTES DE QUALQUER OUTRA COISA. Só leitura.
-- Mostra a política ATUAL de public.produtos — confirme que ela já usa
-- empresas_do_usuario_operacional() (aplicada por PDV-FASE0-EQUIPE-OPERADOR-
-- SQL.sql). Se ainda mostrar empresas_do_usuario() (sem "_operacional"), a
-- Fase 0 não foi aplicada nesta base — pare e avise antes de continuar, essa
-- é uma pré-condição de fora deste arquivo, não algo que este SQL corrige.
-- ============================================================================
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'produtos';


BEGIN;

-- ============================================================================
-- 1) VIEW SEGURA — só as colunas da mesma lista de lib/pdvHelpers.ts
--    (COLUNAS_SEGURAS), mesmo isolamento multi-tenant de sempre
--    (empresas_do_usuario(), nunca user_id).
-- ============================================================================
DROP VIEW IF EXISTS public.vw_produtos_seguro;

CREATE VIEW public.vw_produtos_seguro
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  id,
  empresa_id,
  nome,
  codigo_barras,
  sku,
  categoria,
  subcategoria,
  segmento,
  unidade,
  preco_venda,
  preco_sugerido,
  saldo_disponivel,
  status
FROM public.produtos
WHERE empresa_id IN (SELECT public.empresas_do_usuario());

-- Nunca dono de tabela nova sem saber quem é: registra explicitamente o
-- comentário de propósito da view no catálogo do Postgres (documentação
-- viva, aparece em qualquer client SQL/Supabase Studio).
COMMENT ON VIEW public.vw_produtos_seguro IS
  'Leitura segura de produtos para o papel operador (frente de caixa) — nunca preco_custo/preco_medio/margem/markup/impostos. Ver PDV-FASE3-ETAPA0-OPERADOR-PRODUTOS-SQL.sql.';

-- authenticated é o único role de aplicação que existe no Supabase — dono,
-- operador, admin etc. são todos "authenticated" pro Postgres. Conceder
-- SELECT na view não é risco: ela já só devolve colunas não-sensíveis e já
-- filtra por empresa_id do usuário logado (dono continua com acesso total
-- via a tabela crua, isso aqui é só um caminho A MAIS, não substitui nada).
GRANT SELECT ON public.vw_produtos_seguro TO authenticated;

-- ============================================================================
-- 2) Verificação (só leitura) — confirma que a view existe, com as opções
--    certas, e que a política de produtos (tabela crua) continua intocada.
-- ============================================================================
SELECT viewname, definition FROM pg_views
WHERE schemaname = 'public' AND viewname = 'vw_produtos_seguro';

SELECT relname, reloptions FROM pg_class
WHERE relname = 'vw_produtos_seguro';

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'produtos';

COMMIT;


-- ============================================================================
-- TESTE LÓGICO (não é código, é o raciocínio pra conferir depois de rodar)
--
-- Operador, consultando SELECT * FROM public.produtos (tabela crua):
--   → RLS de PDV-FASE0 bloqueia por LINHA. Zero linhas. Continua exatamente
--     como já era antes deste SQL — este arquivo não abre essa porta.
--
-- Operador, consultando SELECT * FROM public.vw_produtos_seguro:
--   → Vê as linhas da(s) empresa(s) onde tem QUALQUER vínculo (inclusive
--     como operador), com EXATAMENTE estas colunas: id, empresa_id, nome,
--     codigo_barras, sku, categoria, subcategoria, segmento, unidade,
--     preco_venda, preco_sugerido, saldo_disponivel, status.
--   → NÃO EXISTE preco_custo/preco_medio/preco_medio_anterior/margem/markup/
--     preco_minimo/preco_promocional/ncm/cest/cfop_padrao/ipi/icms/pis/
--     cofins/iss nessa view — nem "SELECT *" traz, porque a view não as
--     seleciona da tabela de origem. Não é ocultado na tela, é inexistente
--     no resultado da query.
--
-- Dono/admin/financeiro/contábil/leitor, consultando public.produtos
-- (tabela crua, código de app inalterado):
--   → RLS de PDV-FASE0 usa empresas_do_usuario_operacional(), que NÃO exclui
--     esses papéis (só exclui vínculo com papel = 'operador'). Acesso total
--     de sempre, nenhuma coluna cortada, nada muda pra eles.
-- ============================================================================


-- ============================================================================
-- ROLLBACK — SÓ RODAR SE ALGO QUEBRAR DEPOIS DE APLICAR O BLOCO ACIMA.
-- Remove só o que este arquivo criou (a view + a permissão dela). Não mexe
-- em nada da Fase 0 (política de produtos continua como estava).
-- Descomente e rode como bloco único.
-- ============================================================================
-- BEGIN;
--
-- REVOKE SELECT ON public.vw_produtos_seguro FROM authenticated;
-- DROP VIEW IF EXISTS public.vw_produtos_seguro;
--
-- COMMIT;
-- ============================================================================
