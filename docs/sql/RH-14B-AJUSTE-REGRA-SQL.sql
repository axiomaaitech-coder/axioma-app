-- RH-14B — ajuste da regra do contrato (rodar DEPOIS de RH-14, que já rodou em 08/11/2026).
-- Tira do banco "rural (102) exige natureza rural" e "doméstico (104) exige urbana": a importação por planilha não manda
-- a natureza e quebraria contrato rural. Essa conferência fica na lista de pendências do S-2200 (lib/rhEsocial.ts).
-- E passa a valer para todos os contratos (nenhum antigo quebra a regra: conferido em 08/11/2026).
alter table public.rh_contratos drop constraint if exists rh_contrato_s2200;
alter table public.rh_contratos add constraint rh_contrato_s2200 check (
      (cnpj_sindicato is null or public.rh_cnpj_valido(cnpj_sindicato))
  and tp_reg_jor in (1,2,3,4) and nat_atividade in (1,2) and tmp_parc in (0,1,2,3)
  and (tmp_parc <> 1 or cod_categ = '104') and (tmp_parc not in (2,3) or cod_categ <> '104')
  and (dsc_jorn is null or char_length(dsc_jorn) between 1 and 999)
  and (clau_assec is null or tp_contr in (2,3))
  and ((tp_contr = 3) = (obj_det is not null)) and (obj_det is null or char_length(obj_det) between 1 and 255)
  and (data_base is null or data_base between 1 and 12)
  and (dsc_sal_var is null or char_length(dsc_sal_var) between 1 and 999)
);
-- CONFERÊNCIA (esperado: true)
select convalidated as regra_vale_para_todos from pg_constraint where conname = 'rh_contrato_s2200';
