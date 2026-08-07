-- ============================================================================
-- AXIOMA — PDV Fase 2: cache da sugestão de IA (Groq) por EAN
-- Exigência do Elias: nunca consultar a IA duas vezes pro mesmo código de
-- barras — guarda a resposta (ou o "não achei nada") no banco.
--
-- GLOBAL, não por empresa: um EAN é o mesmo código em qualquer empresa (é o
-- código de barras oficial do produto, igual o catálogo Cosmos já trata) —
-- se a empresa A já perguntou pra IA sobre um código e a empresa B bipar o
-- mesmo código depois, B aproveita a resposta de graça, sem chamar a IA de
-- novo. Mesmo princípio de "custo zero" que o autocomplete por histórico já
-- usa, só que compartilhado entre empresas em vez de por empresa (não é dado
-- sensível: é só "o que este código de barras provavelmente é", igual ao que
-- o catálogo Cosmos já responde pra qualquer um).
--
-- Chave (ean, idioma): a sugestão vem em texto (nome/marca/categoria), então
-- uma resposta em PT não serve pra quem cadastra em EN/ES.
--
-- encontrado=false também é cacheado — "a IA não achou nada pra esse
-- código" é uma resposta válida que também evita nova chamada.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.produtos_ia_cache (
  ean text NOT NULL,
  idioma text NOT NULL,
  encontrado boolean NOT NULL,
  nome text,
  marca text,
  categoria text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ean, idioma)
);

ALTER TABLE public.produtos_ia_cache ENABLE ROW LEVEL SECURITY;

-- DE PROPÓSITO nenhuma policy para 'authenticated'/'anon' — RLS ligada +
-- zero policy = zero acesso por PostgREST/navegador, pra ninguém conseguir
-- inserir linha nenhuma daqui (nem ler, nem escrever), fechando o risco de
-- envenenamento de cache. Só quem acessa esta tabela é
-- app/api/produto/consulta-ia/route.ts, usando o client server-side com
-- SUPABASE_SERVICE_ROLE_KEY (mesmo padrão de app/api/pluggy/webhook/route.ts)
-- — o service role ignora RLS por definição do Postgres/Supabase, então não
-- precisa (nem deve) ganhar uma policy permissiva aqui. O cliente do
-- navegador nunca fala com esta tabela diretamente — sempre passa pela rota,
-- que valida a sessão do usuário ANTES de ler ou gravar o cache (mesma
-- checagem de auth.getUser() que a rota do Cosmos já faz).

COMMIT;
