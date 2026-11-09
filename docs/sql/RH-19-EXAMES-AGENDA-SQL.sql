-- RH-19 — Agenda dos exames ocupacionais (auditoria do RH, 09/11/2026: o botão "Marcar o exame" não tinha para onde ir).
-- O item de exame/documento da admissão ganha a situação "agendado" com data/hora e clínica. Só colunas novas; nada é apagado.
alter table public.rh_admissao_itens
  add column if not exists agendado_para timestamptz,
  add column if not exists clinica text;
alter table public.rh_admissao_itens drop constraint if exists rh_admissao_itens_situacao_check;
alter table public.rh_admissao_itens add constraint rh_admissao_itens_situacao_check check (situacao in ('pendente','agendado','entregue','dispensado'));
alter table public.rh_admissao_itens drop constraint if exists rh_admissao_agenda;
alter table public.rh_admissao_itens add constraint rh_admissao_agenda check (
      (situacao <> 'agendado' or (agendado_para is not null and categoria = 'exame'))
  and (clinica is null or char_length(clinica) between 1 and 120));
create index if not exists rh_admissao_agenda_idx on public.rh_admissao_itens (empresa_id, agendado_para) where situacao = 'agendado';
-- CONFERÊNCIA (esperado: 2 · 1)
select (select count(*) from information_schema.columns where table_name = 'rh_admissao_itens' and column_name in ('agendado_para','clinica')) as colunas,
       (select count(*) from pg_constraint where conname = 'rh_admissao_agenda') as regra;
