-- ============================================================================
-- AXIOMA — DRE por competência + monitor de limite MEI (2026-10-10)
-- SÓ ACRESCENTA (colunas e regras). Não altera nem apaga nenhum registro financeiro.
-- Rodar no SQL Editor, bloco A e depois B. Desfazer no fim do arquivo.
-- ============================================================================

-- BLOCO A — vigência real do custo fixo (início/término). Vazio = vale desde o cadastro.
alter table public.custos_fixos
  add column if not exists data_inicio date,
  add column if not exists data_fim date;
alter table public.custos_fixos drop constraint if exists custos_fixos_vigencia_ck;
alter table public.custos_fixos add constraint custos_fixos_vigencia_ck check (data_fim is null or data_inicio is null or data_fim >= data_inicio);

-- BLOCO B — limite anual do MEI como regra oficial versionada (MEI comum × caminhoneiro).
alter table public.regras_fiscais drop constraint if exists regras_fiscais_tipo_check;
alter table public.regras_fiscais add constraint regras_fiscais_tipo_check check (tipo in ('DAS_MEI', 'LIMITE_MEI', 'LIMITE_MEI_TAC'));
insert into public.regras_fiscais (tipo, versao, vigencia_inicio, vigencia_fim, parametros, status, fonte_url, fonte_descricao, verificado_em) values
  ('LIMITE_MEI', 2018, '2018-01-01', null,
   '{"limite_anual": 81000.00, "limite_mensal_proporcional": 6750.00, "tolerancia_pct": 20}', 'oficial',
   'https://www.gov.br/memp/pt-br/teto-do-mei',
   'LC 123/2006 art. 18-A §1º (redação LC 155/2016). Proporcional no ano de abertura (§2º). Excesso até 20%: desenquadra em 1º/jan do ano seguinte e recolhe a diferença em janeiro (§7º III a, §10); acima de 20%: retroage a 1º/jan do ano do excesso (§7º III b). PLP 186/2026 (R$110 mil/2027, R$140 mil/2028) NÃO aprovado.', '2026-10-10'),
  ('LIMITE_MEI_TAC', 2022, '2022-01-01', null,
   '{"limite_anual": 251600.00, "limite_mensal_proporcional": 20966.67, "tolerancia_pct": 20}', 'oficial',
   'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp188.htm',
   'LC 188/2021 — MEI transportador autônomo de cargas (todas as ocupações na Tabela B do Anexo XI da Res. CGSN 140). Proporcional R$ 20.966,67/mês no ano de abertura.', '2026-10-10')
on conflict (tipo, versao) do nothing;

-- DESFAZER (só se precisar):
-- delete from public.regras_fiscais where tipo in ('LIMITE_MEI', 'LIMITE_MEI_TAC');
-- alter table public.regras_fiscais drop constraint if exists regras_fiscais_tipo_check;
-- alter table public.regras_fiscais add constraint regras_fiscais_tipo_check check (tipo in ('DAS_MEI'));
-- alter table public.custos_fixos drop constraint if exists custos_fixos_vigencia_ck;
-- alter table public.custos_fixos drop column if exists data_fim, drop column if exists data_inicio;
