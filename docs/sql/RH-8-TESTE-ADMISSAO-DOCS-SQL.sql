-- Teste de documentos/exames da admissão e país. Rodar DEPOIS de RH-8-ADMISSAO-DOCS-PAISES-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH8 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';
  DONO uuid; C1 uuid; c int; n int := 0; falhas text := ''; ok boolean;
begin
  select user_id into DONO from empresas where id = ALVO;
  if (select count(*) from esocial_tab06_pais) <> 281 then n := n + 1; falhas := falhas || ' tab06'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into rh_colaboradores (empresa_id, nome) values (ALVO, 'Maria Exemplo') returning id into C1;
  -- válidos
  begin
    insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, situacao) values (ALVO, C1, 'documento', 'ctps_digital', 'entregue');
    insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, situacao, data_item, resultado) values (ALVO, C1, 'exame', 'aso_admissional', 'entregue', '2026-11-02', 'apto');
    insert into rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, pais_nascimento) values (C1, ALVO, '52998224725', '1990-01-01', '063');
  exception when others then n := n + 1; falhas := falhas || ' valido_recusado:' || sqlerrm; end;
  -- inválidos
  ok := false; begin insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo) values (ALVO, C1, 'documento', 'teste_gravidez'); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou_gravidez'; end if;
  ok := false; begin insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo) values (ALVO, C1, 'documento', 'audiometria'); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' exame_disfarcado_de_documento'; end if;
  ok := false; begin insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, resultado) values (ALVO, C1, 'exame', 'audiometria', 'apto'); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' resultado_fora_do_aso'; end if;
  ok := false; begin update rh_colaborador_pessoal set pais_nascimento = '999' where colaborador_id = C1; exception when foreign_key_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' pais_inexistente'; end if;

  -- liberado só com "dados pessoais": vê documento, não vê exame
  execute 'reset role';
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'contabil');
  insert into rh_permissoes (empresa_id, user_id, ver, ver_pessoais) values (ALVO, U, true, true);
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into c from rh_admissao_itens where categoria = 'documento'; if c <> 1 then n := n + 1; falhas := falhas || ' pessoais_nao_ve_doc=' || c; end if;
  select count(*) into c from rh_admissao_itens where categoria = 'exame'; if c <> 0 then n := n + 1; falhas := falhas || ' viu_exame_sem_saude'; end if;
  -- com saúde liberada, vê o exame
  execute 'reset role';
  update rh_permissoes set ver_saude = true where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into c from rh_admissao_itens where categoria = 'exame'; if c <> 1 then n := n + 1; falhas := falhas || ' saude_nao_ve_exame'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH8 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
