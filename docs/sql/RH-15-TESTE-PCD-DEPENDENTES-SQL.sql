-- Teste do RH-15 (PCD, dependentes, imigrante, aprendiz, temporário). Rodar DEPOIS de RH-15-PCD-DEPENDENTES-CATEGORIAS-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH15 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';
  DONO uuid; C1 uuid; K1 uuid; D1 uuid; c int; n int := 0; falhas text := ''; ok boolean;
begin
  select user_id into DONO from empresas where id = ALVO;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into rh_colaboradores (empresa_id, nome) values (ALVO, 'Teste RH15') returning id into C1;
  insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, data_termino, qtd_hrs_sem, tp_jornada)
    values (ALVO, C1, 'T-015', '103', '2026-11-10', 2, '2027-11-09', 30, 4) returning id into K1;
  insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, pais_nacionalidade, imig_tmp_resid, imig_cond_ing)
    values (C1, ALVO, '52998224725', '2007-01-01', '063', 1, 4);

  -- PCD: entra, cota só com deficiência marcada
  insert into rh_colaborador_pcd (colaborador_id, empresa_id, def_visual) values (C1, ALVO, true);
  ok := false; begin update rh_colaborador_pcd set def_visual = false, info_cota = true where colaborador_id = C1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' cota_sem_deficiencia'; end if;
  -- imigrante: tempo indeterminado não combina com "solicitante de refúgio" (2)
  ok := false; begin update rh_colaborador_pessoal set imig_cond_ing = 2 where colaborador_id = C1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' imigrante_combinacao'; end if;

  -- dependentes: IR exige CPF e tipo; "Outros" exige descrição; CPF repetido não entra
  insert into rh_dependentes (empresa_id, colaborador_id, tp_dep, nome, data_nascimento, cpf, dep_irrf) values (ALVO, C1, '03', 'Filha Teste', '2020-01-01', '11144477735', true) returning id into D1;
  ok := false; begin insert into rh_dependentes (empresa_id, colaborador_id, nome, data_nascimento, dep_irrf) values (ALVO, C1, 'Sem CPF', '2020-01-01', true); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' irrf_sem_cpf'; end if;
  ok := false; begin insert into rh_dependentes (empresa_id, colaborador_id, tp_dep, nome, data_nascimento) values (ALVO, C1, '99', 'Outro', '2000-01-01'); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' outros_sem_descricao'; end if;
  ok := false; begin insert into rh_dependentes (empresa_id, colaborador_id, tp_dep, nome, data_nascimento, cpf) values (ALVO, C1, '03', 'Repetido', '2021-01-01', '11144477735'); exception when unique_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' cpf_repetido'; end if;
  delete from rh_dependentes where id = D1; get diagnostics c = row_count; if c <> 0 then n := n + 1; falhas := falhas || ' apagou_dependente'; end if;

  -- aprendiz: forma de contratação só no 103; temporário só no 106; CPF substituído inválido barrado
  update rh_contratos set apr_ind = 1, apr_cnpj_ent_qual = '45678901000175' where id = K1;
  ok := false; begin update rh_contratos set temp_hip_leg = 1 where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' temporario_fora_106'; end if;
  ok := false; begin update rh_contratos set apr_cnpj_ent_qual = '11111111111111' where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' cnpj_entidade_invalido'; end if;
  ok := false; begin update rh_contratos set cod_categ = '106', apr_ind = null, apr_cnpj_ent_qual = null, tp_contr = 1, data_termino = null, temp_hip_leg = 1, temp_cpf_substituidos = array['12345678900'] where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' cpf_substituido_invalido'; end if;
  ok := false; begin update rh_contratos set lt_cep = '123' where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' cep_local_invalido'; end if;

  -- histórico: dependente como "pessoal" e PCD como "saude"
  select count(*) into c from rh_historico where colaborador_id = C1 and parte = 'saude'; if c < 1 then n := n + 1; falhas := falhas || ' historico_pcd=' || c; end if;
  select count(*) into c from rh_historico where colaborador_id = C1 and parte = 'pessoal' and 'tp_dep' = any(campos); if c < 1 then n := n + 1; falhas := falhas || ' historico_dep=' || c; end if;

  -- quem tem só "ver" e "pessoais" (sem saúde): vê dependente, NÃO vê PCD nem o histórico de saúde
  execute 'reset role';
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'contabil') on conflict do nothing;
  delete from rh_permissoes where empresa_id = ALVO and user_id = U;
  insert into rh_permissoes (empresa_id, user_id, ver, pessoais) values (ALVO, U, true, true);
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into c from rh_colaborador_pcd where colaborador_id = C1; if c <> 0 then n := n + 1; falhas := falhas || ' sem_saude_viu_pcd'; end if;
  select count(*) into c from rh_historico where colaborador_id = C1 and parte = 'saude'; if c <> 0 then n := n + 1; falhas := falhas || ' sem_saude_viu_historico'; end if;
  select count(*) into c from rh_dependentes where colaborador_id = C1; if c <> 1 then n := n + 1; falhas := falhas || ' pessoais_nao_viu_dep=' || c; end if;
  update rh_colaborador_pcd set def_fisica = true where colaborador_id = C1; get diagnostics c = row_count; if c <> 0 then n := n + 1; falhas := falhas || ' sem_saude_alterou_pcd'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH15 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
