-- RH-16 — Exemplos na empresa de TESTE "Axioma Teste — Distribuidora Horizonte" para o fluxo completo do S-2200.
-- Autorizado pelo Elias em 08/11/2026 ("pode, cadastra os exemplos na Horizonte"). Rodar DEPOIS do RH-15.
-- Todos os documentos são FICTÍCIOS com dígito verificador válido (não são de empresas ou pessoas reais conhecidas).
-- O Bruno continua como está (sem cargo/salário, experiência vencida) — ele é quem aciona os alertas do Radar.
-- Doméstico e temporário não cabem na Horizonte (o doméstico tem empregador pessoa física; o temporário só pode ser
-- contratado por empresa de trabalho temporário) — esses dois ficam cobertos pelo teste automático contra o XSD oficial.
do $$
declare
  ALVO constant uuid := 'a0000000-0000-4000-8000-00000000e001';
  VENDEDOR constant uuid := 'fb682d63-70a8-46c5-a4ff-4713f6e27f20';
  ASSIST constant uuid := 'ba9d9476-4c32-4f47-beb1-ba70c6bae5e7';
  MOTORISTA constant uuid := 'ee1cdec9-b398-4f45-8ea4-33d29c0349a8';
  ESTAB uuid; C uuid; K uuid;
begin
  -- 1) CNPJ completo da Empresa (só se ainda estiver vazio), empregador (S-1000) e a matriz com o sindicato
  update empresas set cnpj = '12.345.678/0001-95' where id = ALVO and coalesce(cnpj, '') = '';
  insert into rh_empregador (empresa_id, tp_insc, nr_insc, ini_valid, class_trib, ind_coop, ind_constr, ind_des_folha)
    select ALVO, 1, '12345678', '2025-01', '01', 0, 0, 0
    where not exists (select 1 from rh_empregador where empresa_id = ALVO and excluido_em is null);
  select id into ESTAB from rh_estabelecimentos where empresa_id = ALVO and nr_insc = '12345678000195' and excluido_em is null;
  if ESTAB is null then
    insert into rh_estabelecimentos (empresa_id, nome, tp_insc, nr_insc, ini_valid, cnae_prep, cnpj_sindicato)
      values (ALVO, 'Matriz — Horizonte (exemplo)', 1, '12345678000195', '2025-01', '4639701', '98765432000198') returning id into ESTAB;
  end if;

  -- 2) Diego (exemplo): empregado geral, pessoa com deficiência física e uma filha dependente — pronto para preparar
  if not exists (select 1 from rh_colaboradores where empresa_id = ALVO and nome = 'Diego Rocha (exemplo)') then
    insert into rh_colaboradores (empresa_id, nome, situacao) values (ALVO, 'Diego Rocha (exemplo)', 'pre_admissao') returning id into C;
    insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, cargo_id, estabelecimento_id,
        qtd_hrs_sem, tp_jornada, tp_reg_jor, nat_atividade, tmp_parc, hor_noturno, dsc_jorn, data_base)
      values (ALVO, C, 'HZ-004', '101', '2026-11-16', 1, VENDEDOR, ESTAB, 44, 4, 1, 1, 0, false, 'Seg a sex 08:00-12:00 e 13:00-17:48', 5) returning id into K;
    insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, sexo, raca_cor, estado_civil, grau_instr,
        pais_nascimento, pais_nacionalidade, cep, logradouro, numero, bairro, cidade, uf, cod_munic, telefone, email)
      values (C, ALVO, '13579246828', '1990-05-20', 'M', 3, 2, '07', '105', '105', '01310100', 'Avenida Paulista', '1500', 'Bela Vista', 'São Paulo', 'SP', '3550308', '11987654321', 'diego.exemplo@axiomaai.com.br');
    insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (ALVO, K, '2026-11-16', 5, 3200, 'admissao');
    insert into rh_colaborador_pcd (colaborador_id, empresa_id, def_fisica, observacao) values (C, ALVO, true, 'Exemplo: usa muleta; posto de trabalho adaptado');
    insert into rh_dependentes (empresa_id, colaborador_id, tp_dep, nome, data_nascimento, cpf, dep_irrf, dep_sf)
      values (ALVO, C, '03', 'Lia Rocha (exemplo)', '2019-08-10', '24681357928', true, true);
  end if;

  -- 3) Eduarda (exemplo): aprendiz, contratação direta, curso numa entidade qualificadora
  if not exists (select 1 from rh_colaboradores where empresa_id = ALVO and nome = 'Eduarda Lins (exemplo)') then
    insert into rh_colaboradores (empresa_id, nome, situacao) values (ALVO, 'Eduarda Lins (exemplo)', 'pre_admissao') returning id into C;
    insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, data_termino, clau_assec, cargo_id, estabelecimento_id,
        qtd_hrs_sem, tp_jornada, tp_reg_jor, nat_atividade, tmp_parc, hor_noturno, dsc_jorn, apr_ind, apr_cnpj_ent_qual)
      values (ALVO, C, 'HZ-005', '103', '2026-11-16', 2, '2027-11-15', false, ASSIST, ESTAB, 30, 4, 1, 1, 0, false,
        'Seg a sex 13:00-19:15 com 15 min de intervalo (teoria às quartas na entidade)', 1, '32165498000139') returning id into K;
    insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, sexo, raca_cor, estado_civil, grau_instr,
        pais_nascimento, pais_nacionalidade, cep, logradouro, numero, bairro, cidade, uf, cod_munic)
      values (C, ALVO, '19283746546', '2009-02-14', 'F', 2, 1, '06', '105', '105', '01310100', 'Rua Augusta', '200', 'Consolação', 'São Paulo', 'SP', '3550308');
    insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (ALVO, K, '2026-11-16', 5, 1150, 'admissao');
  end if;

  -- 4) Fábio (exemplo): intermitente, pago por hora, motorista (sindicato diferenciado no próprio contrato)
  if not exists (select 1 from rh_colaboradores where empresa_id = ALVO and nome = 'Fábio Prado (exemplo)') then
    insert into rh_colaboradores (empresa_id, nome, situacao) values (ALVO, 'Fábio Prado (exemplo)', 'pre_admissao') returning id into C;
    insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, cargo_id, estabelecimento_id,
        tp_jornada, tp_reg_jor, nat_atividade, tmp_parc, dsc_jorn, cnpj_sindicato)
      values (ALVO, C, 'HZ-006', '111', '2026-11-16', 1, MOTORISTA, ESTAB, 9, 1, 1, 0,
        'Conforme convocação, com pelo menos 3 dias corridos de antecedência (CLT art. 452-A)', '45678901000175') returning id into K;
    insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, sexo, raca_cor, estado_civil, grau_instr,
        pais_nascimento, pais_nacionalidade, cep, logradouro, numero, bairro, cidade, uf, cod_munic)
      values (C, ALVO, '56473829164', '1985-09-30', 'M', 1, 3, '05', '105', '105', '01310100', 'Rua da Consolação', '50', 'Consolação', 'São Paulo', 'SP', '3550308');
    insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (ALVO, K, '2026-11-16', 1, 12.50, 'admissao');
  end if;
end $$;

-- CONFERÊNCIA (esperado: 1 · 1 · 1 · 3 · 1 · 1)
select (select count(*) from rh_empregador where empresa_id = 'a0000000-0000-4000-8000-00000000e001' and excluido_em is null) as empregador,
       (select count(*) from rh_estabelecimentos where empresa_id = 'a0000000-0000-4000-8000-00000000e001' and cnpj_sindicato is not null) as matriz_com_sindicato,
       (select count(*) from empresas where id = 'a0000000-0000-4000-8000-00000000e001' and cnpj is not null) as empresa_cnpj,
       (select count(*) from rh_colaboradores where empresa_id = 'a0000000-0000-4000-8000-00000000e001' and nome in ('Diego Rocha (exemplo)','Eduarda Lins (exemplo)','Fábio Prado (exemplo)')) as novos_exemplos,
       (select count(*) from rh_colaborador_pcd where empresa_id = 'a0000000-0000-4000-8000-00000000e001') as pcd,
       (select count(*) from rh_dependentes where empresa_id = 'a0000000-0000-4000-8000-00000000e001') as dependentes;
