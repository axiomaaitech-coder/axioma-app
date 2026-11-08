-- Teste do cadastro de colaboradores. Rodar DEPOIS de RH-7-COLABORADORES-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH7 falhas=0".
-- CPFs abaixo são números de exemplo com dígito válido (não são pessoas reais do Axioma).
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';
  DONO uuid; OUTRO_CC uuid; C1 uuid; K1 uuid; c int; n int := 0; falhas text := ''; ok boolean; i int;
  base text := $q$insert into rh_contratos (empresa_id,colaborador_id,matricula,cod_categ,data_admissao,tp_contr,data_termino,experiencia,qtd_hrs_sem,tp_jornada) values ('a0000000-0000-4000-8000-00000000e001',$q$;
  ruins text[][];
begin
  select user_id into DONO from empresas where id = ALVO;
  select id into OUTRO_CC from centros_custo where empresa_id <> ALVO limit 1;
  if (select count(*) from esocial_tab01_categoria) <> 47 then n := n + 1; falhas := falhas || ' tab01'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 1) válidos: pessoa + dados pessoais + contrato de experiência de 90 dias + salário
  begin
    insert into rh_colaboradores (empresa_id, nome) values (ALVO, 'Maria Exemplo') returning id into C1;
    insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, sexo, raca_cor, grau_instr) values (C1, ALVO, '52998224725', '1990-05-10', 'F', 3, '07');
    insert into rh_contratos (empresa_id,colaborador_id,matricula,cod_categ,data_admissao,tp_contr,data_termino,experiencia,qtd_hrs_sem,tp_jornada)
      values (ALVO, C1, 'M001', '101', '2026-11-03', 2, date '2026-11-03' + 89, true, 44, 4) returning id into K1;
    insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, valor, motivo) values (ALVO, K1, '2026-11-03', 2500.00, 'admissao');
  exception when others then n := n + 1; falhas := falhas || ' valido_recusado:' || sqlerrm; end;

  -- 2) inválidos
  ruins := array[
    ['experiencia_91_dias', format($q$'%s','M002','101','2026-11-03',2,date '2026-11-03' + 90,true,44,4)$q$, C1)],
    ['determinado_sem_termino', format($q$'%s','M003','101','2026-11-03',2,null,false,44,4)$q$, C1)],
    ['indeterminado_com_termino', format($q$'%s','M004','101','2026-11-03',1,'2027-01-01',false,44,4)$q$, C1)],
    ['aprendiz_indeterminado', format($q$'%s','M005','103','2026-11-03',1,null,false,30,4)$q$, C1)],
    ['sem_horas', format($q$'%s','M006','101','2026-11-03',1,null,false,null,4)$q$, C1)],
    ['matricula_repetida', format($q$'%s','M001','101','2026-11-03',1,null,false,44,4)$q$, C1)],
    ['categoria_inexistente', format($q$'%s','M007','999','2026-11-03',1,null,false,44,4)$q$, C1)],
    ['determinado_3_anos', format($q$'%s','M008','101','2026-11-03',2,'2029-11-03',false,44,4)$q$, C1)]
  ];
  for i in 1 .. array_length(ruins, 1) loop
    ok := false;
    begin execute base || ruins[i][2];
    exception when check_violation or foreign_key_violation or unique_violation or not_null_violation then ok := true; end;
    if not ok then n := n + 1; falhas := falhas || ' aceitou:' || ruins[i][1]; end if;
  end loop;
  ok := false; begin insert into rh_colaboradores (empresa_id, nome) values (ALVO, 'X'); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou:nome_1_letra'; end if;
  ok := false; begin insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento) values (C1, ALVO, '52998224724', '1990-01-01');
  exception when check_violation or unique_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou:cpf_invalido'; end if;
  ok := false; begin insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (ALVO, K1, '2026-12-01', 7, 100, 'reajuste_coletivo');
  exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou:variavel_com_valor'; end if;
  if OUTRO_CC is not null then
    ok := false; begin update rh_contratos set centro_custo_id = OUTRO_CC where id = K1; exception when check_violation then ok := true; end;
    if not ok then n := n + 1; falhas := falhas || ' aceitou:centro_outra_empresa'; end if;
  end if;

  -- 3) salário nunca muda nem some: alteração e exclusão não afetam nada
  update rh_remuneracoes set valor = 9999 where contrato_id = K1; get diagnostics c = row_count;
  if c > 0 then n := n + 1; falhas := falhas || ' salario_alterado'; end if;
  delete from rh_remuneracoes where contrato_id = K1; get diagnostics c = row_count;
  if c > 0 then n := n + 1; falhas := falhas || ' salario_apagado'; end if;

  -- 4) contador liberado só para "ver": vê pessoa e contrato; não vê CPF nem salário
  execute 'reset role';
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'contabil');
  insert into rh_permissoes (empresa_id, user_id, ver) values (ALVO, U, true);
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if (select count(*) from rh_colaboradores where empresa_id = ALVO) <> 1 or (select count(*) from rh_contratos where empresa_id = ALVO) <> 1 then n := n + 1; falhas := falhas || ' liberado_ver_nao_ve'; end if;
  if (select count(*) from rh_colaborador_pessoal) <> 0 then n := n + 1; falhas := falhas || ' viu_cpf_sem_liberacao'; end if;
  if (select count(*) from rh_remuneracoes) <> 0 then n := n + 1; falhas := falhas || ' viu_salario_sem_liberacao'; end if;
  ok := false; begin insert into rh_colaboradores (empresa_id, nome) values (ALVO, 'Invasor'); exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' gravou_sem_editar'; end if;

  -- 5) com liberação de salário, passa a ver o salário (e continua sem o CPF)
  execute 'reset role';
  update rh_permissoes set ver_salario = true where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if (select count(*) from rh_remuneracoes) <> 1 then n := n + 1; falhas := falhas || ' liberado_salario_nao_ve'; end if;
  if (select count(*) from rh_colaborador_pessoal) <> 0 then n := n + 1; falhas := falhas || ' salario_abriu_cpf'; end if;

  -- 6) quem é de fora: nada
  execute 'reset role';
  delete from rh_permissoes where empresa_id = ALVO and user_id = U;
  delete from empresa_usuarios where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select (select count(*) from rh_colaboradores) + (select count(*) from rh_contratos) + (select count(*) from rh_colaborador_pessoal) + (select count(*) from rh_remuneracoes) into c;
  if c <> 0 then n := n + 1; falhas := falhas || ' fora_ve=' || c; end if;

  -- 7) enviado ao eSocial não vai para a lixeira
  execute 'reset role';
  update rh_contratos set situacao_esocial = 'enviado_pelo_contador' where id = K1;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  ok := false; begin update rh_colaboradores set excluido_em = now() where id = C1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' enviado_foi_para_lixeira'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH7 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
