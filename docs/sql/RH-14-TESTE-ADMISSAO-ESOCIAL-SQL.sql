-- Teste da admissão preparada para o eSocial. Rodar DEPOIS de RH-14, RH-14B e RH-14C.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH14 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  OUTRA uuid;
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';
  DONO uuid; C1 uuid; K1 uuid; E1 uuid; c int; n int := 0; falhas text := ''; ok boolean; s text;
  ARQ text := '<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtAdmissao/v_S_01_03_00"><evtAdmissao Id="ID1123456780000002026110812000000001"/></eSocial>' || repeat(' ', 10);
begin
  select user_id into DONO from empresas where id = ALVO;
  select id into OUTRA from empresas where id <> ALVO limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into rh_colaboradores (empresa_id, nome) values (ALVO, 'Teste Admissão') returning id into C1;
  insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, qtd_hrs_sem, tp_jornada, dsc_jorn, hor_noturno)
    values (ALVO, C1, 'T-014', '101', '2026-11-10', 1, 44, 4, 'Seg a sex 08:00-12:00 13:00-17:48', false) returning id into K1;

  -- formatos: sindicato com CNPJ inválido, tempo parcial 1 fora de doméstico, cláusula em prazo indeterminado, data-base 13
  ok := false; begin update rh_contratos set cnpj_sindicato = '11111111111111' where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' sindicato_invalido_passou'; end if;
  ok := false; begin update rh_contratos set tmp_parc = 1 where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' parcial1_passou'; end if;
  ok := false; begin update rh_contratos set clau_assec = true where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' clausula_indeterminado_passou'; end if;
  ok := false; begin update rh_contratos set data_base = 13 where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' database13_passou'; end if;
  ok := false; begin insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, cod_munic) values (C1, ALVO, '52998224725', '1990-01-01', '355030'); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' municipio6_passou'; end if;
  update rh_contratos set cnpj_sindicato = '11222333000181' where id = K1;   -- CNPJ válido entra

  -- arquivo preparado: entra, não muda e não sai
  insert into rh_esocial_eventos (empresa_id, contrato_id, evento, id_evento, versao_leiaute, xml)
    values (ALVO, K1, 'S-2200', 'ID1123456780000002026110812000000001', 'S-1.3', ARQ) returning id into E1;
  update rh_contratos set situacao_esocial = 'preparado' where id = K1;
  update rh_esocial_eventos set xml = ARQ || 'x' where id = E1; get diagnostics c = row_count; if c <> 0 then n := n + 1; falhas := falhas || ' alterou_arquivo'; end if;
  delete from rh_esocial_eventos where id = E1; get diagnostics c = row_count; if c <> 0 then n := n + 1; falhas := falhas || ' apagou_arquivo'; end if;
  ok := false; begin insert into rh_esocial_eventos (empresa_id, contrato_id, evento, id_evento, versao_leiaute, xml) values (ALVO, K1, 'S-2200', 'ID-errado', 'S-1.3', ARQ); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' id_errado_passou'; end if;

  -- preparado + mudou dado da admissão → volta a rascunho; mudar só o departamento não mexe
  update rh_contratos set departamento_id = null where id = K1;
  select situacao_esocial into s from rh_contratos where id = K1; if s <> 'preparado' then n := n + 1; falhas := falhas || ' depto_desfez_preparado'; end if;
  update rh_contratos set qtd_hrs_sem = 40 where id = K1;
  select situacao_esocial into s from rh_contratos where id = K1; if s <> 'rascunho' then n := n + 1; falhas := falhas || ' preparado_nao_voltou=' || s; end if;

  -- enviado: dado da admissão não muda; recibo e desligamento podem
  update rh_contratos set situacao_esocial = 'enviado' where id = K1;
  ok := false; begin update rh_contratos set qtd_hrs_sem = 30 where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' enviado_mudou'; end if;
  update rh_contratos set recibo_esocial = '1.2.0000000000000000001', situacao_esocial = 'aceito' where id = K1;
  select situacao_esocial into s from rh_contratos where id = K1; if s <> 'aceito' then n := n + 1; falhas := falhas || ' recibo_bloqueado'; end if;

  -- outra empresa e quem não tem acesso não veem o arquivo
  execute 'reset role';
  ok := false; begin insert into rh_esocial_eventos (empresa_id, contrato_id, evento, id_evento, versao_leiaute, xml) values (OUTRA, K1, 'S-2200', 'ID1123456780000002026110812000000002', 'S-1.3', ARQ); exception when others then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' empresa_cruzada_passou'; end if;
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'contabil') on conflict do nothing;
  delete from rh_permissoes where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into c from rh_esocial_eventos where contrato_id = K1; if c <> 0 then n := n + 1; falhas := falhas || ' sem_acesso_viu'; end if;
  -- RH-14C: só "ver" (sem dados pessoais e salário) também não lê o arquivo, que tem CPF e salário
  execute 'reset role';
  insert into rh_permissoes (empresa_id, user_id, ver) values (ALVO, U, true);
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into c from rh_esocial_eventos where contrato_id = K1; if c <> 0 then n := n + 1; falhas := falhas || ' so_ver_leu_arquivo'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH14 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
