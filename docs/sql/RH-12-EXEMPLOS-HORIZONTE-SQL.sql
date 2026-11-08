-- RH-12: dados de EXEMPLO na Empresa de teste "Axioma Teste — Distribuidora Horizonte" (nunca em Empresa real).
-- 3 pessoas montadas para acionar cada função do RH (Radar, alertas, salários, documentos, histórico). Rodar DEPOIS do RH-11.
-- Roda uma vez só: se já houver exemplos, não faz nada. CPFs fictícios (dígito válido, gerados).
do $$
declare
  H uuid := 'a0000000-0000-4000-8000-00000000e001';
  d_com uuid; d_log uuid; d_adm uuid; g_vend uuid; g_mot uuid; g_assist uuid;
  ana uuid; bruno uuid; carla uuid; k_ana uuid; k_bruno uuid; k_carla uuid;
begin
  if exists (select 1 from rh_colaboradores where empresa_id = H and nome like '%(exemplo)%') then
    raise notice 'Exemplos já existem — nada feito.'; return;
  end if;
  insert into rh_departamentos (empresa_id, nome, codigo) values (H, 'Comercial', 'COM') returning id into d_com;
  insert into rh_departamentos (empresa_id, nome, codigo) values (H, 'Logística', 'LOG') returning id into d_log;
  insert into rh_departamentos (empresa_id, nome, codigo) values (H, 'Administrativo', 'ADM') returning id into d_adm;
  insert into rh_cargos (empresa_id, nome, cbo, departamento_id) values (H, 'Vendedor', '521110', d_com) returning id into g_vend;
  insert into rh_cargos (empresa_id, nome, cbo, departamento_id) values (H, 'Motorista de caminhão', '782510', d_log) returning id into g_mot;
  insert into rh_cargos (empresa_id, nome, cbo, departamento_id) values (H, 'Assistente administrativo', '411010', d_adm) returning id into g_assist;

  -- 1) Ana: experiência termina em 18/11/2026 (alerta de atenção), eSocial enviado pelo contador, ASO apto, faltam documentos
  insert into rh_colaboradores (empresa_id, nome, situacao) values (H, 'Ana Souza (exemplo)', 'ativo') returning id into ana;
  insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, sexo, cep, cidade, uf, telefone)
    values (ana, H, '52601815906', '1996-04-12', 'F', '01310100', 'São Paulo', 'SP', '11987650001');
  insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, data_termino, experiencia, qtd_hrs_sem, tp_jornada, cargo_id, departamento_id, situacao_esocial)
    values (H, ana, 'HZ-001', '101', '2026-08-21', 2, '2026-11-18', true, 44, 4, g_vend, d_com, 'enviado_pelo_contador') returning id into k_ana;
  insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (H, k_ana, '2026-08-21', 5, 2400.00, 'admissao');
  insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, situacao, data_item, resultado) values
    (H, ana, 'exame', 'aso_admissional', 'entregue', '2026-08-19', 'apto');
  insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, situacao, data_item) values
    (H, ana, 'documento', 'ctps_digital', 'entregue', '2026-08-21');

  -- 2) Bruno: experiência VENCIDA em 28/09, admissão sem envio ao eSocial, sem exame admissional, sem cargo e sem salário (críticos)
  insert into rh_colaboradores (empresa_id, nome, situacao) values (H, 'Bruno Lima (exemplo)', 'ativo') returning id into bruno;
  insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, sexo, cep, cidade, uf)
    values (bruno, H, '08301661305', '1989-11-30', 'M', '30130010', 'Belo Horizonte', 'MG');
  insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, data_termino, experiencia, qtd_hrs_sem, tp_jornada, departamento_id, situacao_esocial)
    values (H, bruno, 'HZ-002', '101', '2026-07-01', 2, '2026-09-28', true, 44, 4, d_log, 'rascunho') returning id into k_bruno;

  -- 3) Carla: tudo em dia (prazo indeterminado, documentos obrigatórios entregues, ASO apto) + reajuste e mudança de jornada (histórico)
  insert into rh_colaboradores (empresa_id, nome, situacao) values (H, 'Carla Mendes (exemplo)', 'ativo') returning id into carla;
  insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, sexo, cep, cidade, uf, email)
    values (carla, H, '18609139034', '1985-02-07', 'F', '80010000', 'Curitiba', 'PR', 'carla.exemplo@horizonte.test');
  insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, qtd_hrs_sem, tp_jornada, cargo_id, departamento_id, situacao_esocial)
    values (H, carla, 'HZ-003', '101', '2025-03-10', 1, 44, 4, g_assist, d_adm, 'enviado_pelo_contador') returning id into k_carla;
  insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (H, k_carla, '2025-03-10', 5, 4500.00, 'admissao');
  insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (H, k_carla, '2026-10-01', 5, 4800.00, 'merito');
  insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, situacao, data_item, resultado)
    select H, carla, c, t, 'entregue', '2025-03-07', case when t = 'aso_admissional' then 'apto' end
    from (values ('documento','ctps_digital'), ('documento','documento_identidade'), ('documento','cpf'), ('documento','contrato_assinado'), ('documento','ciencia_lgpd'), ('exame','aso_admissional')) v(c, t);
  update rh_contratos set qtd_hrs_sem = 40 where id = k_carla;
  raise notice 'Exemplos criados: Ana, Bruno e Carla (Distribuidora Horizonte).';
end $$;
