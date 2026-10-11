-- Financial Core 1.7 (2026-10-11): mesma parcela da mesma NF-e entra em Contas a Pagar uma vez só.
-- Parcela = chave de acesso + vencimento + valor. Conferido antes: nenhuma repetição no banco.
-- O app já trata a recusa (conta como "duplicada" no Importar, sem erro técnico).
-- Desfazer: drop index if exists contas_pagar_nfe_parcela_uq;
create unique index if not exists contas_pagar_nfe_parcela_uq
  on public.contas_pagar (empresa_id, chave_acesso, data_vencimento, valor_total)
  where chave_acesso is not null;
