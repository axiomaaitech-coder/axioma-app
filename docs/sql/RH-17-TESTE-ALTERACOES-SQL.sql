-- Teste das alterações (RH-17). Rodar DEPOIS de RH-17-ALTERACOES-ESOCIAL-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH17 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  DONO uuid; C1 uuid; K1 uuid; E1 uuid; c int; n int := 0; falhas text := ''; ok boolean; b boolean; s text;
  ARQ text := '<eSocial xmlns="x"><evtAdmissao Id="ID1123456780000002026110912000000001"/></eSocial>' || repeat(' ', 40);
begin
  select user_id into DONO from empresas where id = ALVO;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into rh_colaboradores (empresa_id, nome) values (ALVO, 'Teste RH17') returning id into C1;
  insert into rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, qtd_hrs_sem, tp_jornada)
    values (ALVO, C1, 'T-017', '101', '2026-10-01', 1, 44, 4) returning id into K1;
  insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, sexo, cep) values (C1, ALVO, '52998224725', '1990-01-01', 'M', '01310100');
  insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (ALVO, K1, '2026-10-01', 5, 3000, 'admissao');

  -- rascunho: mudar não marca nada
  update rh_contratos set qtd_hrs_sem = 40 where id = K1;
  select alt_contratual_pendente into b from rh_contratos where id = K1; if b then n := n + 1; falhas := falhas || ' rascunho_marcou'; end if;

  -- enviado: horas mudam e marcam S-2206; matrícula/admissão não mudam
  update rh_contratos set situacao_esocial = 'aceito', recibo_esocial = '1.2.0000000000000000001' where id = K1;
  update rh_contratos set qtd_hrs_sem = 44 where id = K1;
  select alt_contratual_pendente into b from rh_contratos where id = K1; if not b then n := n + 1; falhas := falhas || ' horas_nao_marcou'; end if;
  ok := false; begin update rh_contratos set matricula = 'T-999' where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' matricula_mudou'; end if;
  ok := false; begin update rh_contratos set data_admissao = '2026-10-02' where id = K1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' admissao_mudou'; end if;
  update rh_contratos set alt_contratual_pendente = false where id = K1;
  -- salário novo marca S-2206
  insert into rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo) values (ALVO, K1, '2026-11-01', 5, 3300, 'merito');
  select alt_contratual_pendente into b from rh_contratos where id = K1; if not b then n := n + 1; falhas := falhas || ' salario_nao_marcou'; end if;
  -- departamento não vai ao eSocial: não marca
  update rh_contratos set alt_contratual_pendente = false where id = K1;
  update rh_contratos set departamento_id = null where id = K1;
  select alt_contratual_pendente into b from rh_contratos where id = K1; if b then n := n + 1; falhas := falhas || ' departamento_marcou'; end if;

  -- dados pessoais: endereço marca S-2205; contato de emergência não; CPF trava
  update rh_colaborador_pessoal set emergencia_nome = 'Mãe' where colaborador_id = C1;
  select alt_cadastral_pendente into b from rh_contratos where id = K1; if b then n := n + 1; falhas := falhas || ' emergencia_marcou'; end if;
  update rh_colaborador_pessoal set cep = '01310200' where colaborador_id = C1;
  select alt_cadastral_pendente into b from rh_contratos where id = K1; if not b then n := n + 1; falhas := falhas || ' cep_nao_marcou'; end if;
  ok := false; begin update rh_colaborador_pessoal set cpf = '11144477735' where colaborador_id = C1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' cpf_mudou'; end if;
  update rh_contratos set alt_cadastral_pendente = false where id = K1;
  update rh_colaboradores set nome = 'Teste RH17 Silva' where id = C1;
  select alt_cadastral_pendente into b from rh_contratos where id = K1; if not b then n := n + 1; falhas := falhas || ' nome_nao_marcou'; end if;
  update rh_contratos set alt_cadastral_pendente = false where id = K1;
  insert into rh_dependentes (empresa_id, colaborador_id, tp_dep, nome, data_nascimento) values (ALVO, C1, '03', 'Filho Teste', '2020-01-01');
  select alt_cadastral_pendente into b from rh_contratos where id = K1; if not b then n := n + 1; falhas := falhas || ' dependente_nao_marcou'; end if;

  -- arquivo de alteração: situação e recibo mudam; o XML não
  insert into rh_esocial_eventos (empresa_id, contrato_id, evento, id_evento, versao_leiaute, xml, data_ref)
    values (ALVO, K1, 'S-2206', 'ID1123456780000002026110912000000001', 'S-1.3', ARQ, '2026-11-01') returning id into E1;
  update rh_esocial_eventos set situacao = 'aceito', recibo = '1.2.0000000000000000002' where id = E1;
  select situacao into s from rh_esocial_eventos where id = E1; if s <> 'aceito' then n := n + 1; falhas := falhas || ' situacao_nao_mudou'; end if;
  ok := false; begin update rh_esocial_eventos set xml = ARQ || 'x' where id = E1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' xml_mudou'; end if;
  ok := false; begin update rh_esocial_eventos set situacao = 'qualquer' where id = E1; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' situacao_invalida'; end if;
  ok := false; begin insert into rh_esocial_eventos (empresa_id, contrato_id, evento, id_evento, versao_leiaute, xml) values (ALVO, K1, 'S-9999', 'ID1123456780000002026110912000000002', 'S-1.3', ARQ); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' evento_invalido'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH17 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
