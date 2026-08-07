-- ============================================================================
-- AXIOMA — 3 colunas novas em empresa_auditoria: rastreabilidade real
--
-- Hoje cada registro só mostra "editar → empresas", o nome do campo e a
-- data — falta o essencial: qual empresa, quem fez, e o valor de/para.
-- valor_antes/valor_depois já existiam (não usados na tela); esta rodada
-- só ADICIONA empresa_nome/autor_nome/autor_email, que faltavam.
--
-- NÃO apaga nem altera nenhuma linha existente — registros antigos ficam
-- com essas 3 colunas NULL (decisão do Elias: limpeza é manual, não
-- automática). Só os registros novos, gravados depois de aplicar este SQL
-- e do deploy do código, vêm preenchidos.
--
-- NÃO mexe em nenhuma policy de RLS.
-- Idempotente — pode rodar mais de uma vez com segurança.
-- ============================================================================

ALTER TABLE public.empresa_auditoria
  ADD COLUMN IF NOT EXISTS empresa_nome text,
  ADD COLUMN IF NOT EXISTS autor_nome text,
  ADD COLUMN IF NOT EXISTS autor_email text;
