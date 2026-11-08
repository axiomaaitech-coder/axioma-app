-- Teste da Subfase 2 do RH. Rodar DEPOIS de RH-2-EMPREGADOR-RUBRICAS-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH2 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';   -- Empresa de teste
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';   -- usuário que NÃO é membro dela
  DONO uuid;
  n int := 0; falhas text := ''; c int; ok boolean; estado text;
  -- cada caso inválido: [rótulo, SQL de inserção] — todos devem ser RECUSADOS pelo banco
  ruins text[][] := array[
    ['cpf_com_class_pj',   $q$insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr) values ('a0000000-0000-4000-8000-00000000e001',2,'12345678901','2025-06','01',0,0)$q$],
    ['cnpj_tamanho_errado',$q$insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr) values ('a0000000-0000-4000-8000-00000000e001',1,'1234567','2025-06','01',0,0)$q$],
    ['class_inexistente',  $q$insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr) values ('a0000000-0000-4000-8000-00000000e001',1,'12345678','2025-06','98',0,0)$q$],
    ['desfolha_simples01', $q$insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr,ind_des_folha) values ('a0000000-0000-4000-8000-00000000e001',1,'12345678','2025-06','01',0,0,1)$q$],
    ['reg_eletron_2026_03',$q$insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr,ind_opt_reg_eletron) values ('a0000000-0000-4000-8000-00000000e001',1,'12345678','2026-03','01',0,0,1)$q$],
    ['pj_sem_coop',        $q$insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib) values ('a0000000-0000-4000-8000-00000000e001',1,'12345678','2025-06','01')$q$],
    ['mes_invalido',       $q$insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr) values ('a0000000-0000-4000-8000-00000000e001',1,'12345678','2026-13','01',0,0)$q$],
    ['natureza_inexistente',$q$insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts) values ('a0000000-0000-4000-8000-00000000e001','X1','2026-01','x','0001',1,'11','11','11')$q$],
    ['econsig_sem_fgts31', $q$insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts) values ('a0000000-0000-4000-8000-00000000e001','X2','2026-01','x','9253',2,'00','9','00')$q$],
    ['fgts31_sem_econsig', $q$insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts) values ('a0000000-0000-4000-8000-00000000e001','X3','2026-01','x','1000',1,'11','11','31')$q$],
    ['dedutora_sem_obs',   $q$insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts) values ('a0000000-0000-4000-8000-00000000e001','X4','2026-01','x','1000',4,'00','9','00')$q$],
    ['cp_suspensao_91',    $q$insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts) values ('a0000000-0000-4000-8000-00000000e001','X5','2026-01','x','1000',1,'91','11','11')$q$],
    ['natureza_vencida',   $q$insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts) values ('a0000000-0000-4000-8000-00000000e001','X6','2026-01','x','1002',1,'11','11','11')$q$],
    ['codigo_esocial',     $q$insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts) values ('a0000000-0000-4000-8000-00000000e001','eSocial1','2026-01','x','1000',1,'11','11','11')$q$]
  ];
  i int;
begin
  select user_id into DONO from empresas where id = ALVO;
  if (select count(*) from esocial_tab03_natureza_rubrica) <> 216 then n := n + 1; falhas := falhas || ' tab03_incompleta'; end if;
  if (select count(*) from esocial_tab08_class_trib) <> 18 then n := n + 1; falhas := falhas || ' tab08_incompleta'; end if;
  if (select count(*) from esocial_tab21_inc_irrf) <> 87 then n := n + 1; falhas := falhas || ' tab21_incompleta'; end if;

  -- 1) como DONO: casos válidos entram
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr,ind_porte)
      values (ALVO,1,'12345678','2026-01','01',0,0,'S');
    insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts)
      values (ALVO,'1000','2026-01','Salário','1000',1,'11','11','11');
    insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts)
      values (ALVO,'9253','2026-01','eConsignado','9253',2,'00','9','31');
    -- 1016 Férias tem duas versões na Tabela 03; a de 2026 precisa ser aceita
    insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts)
      values (ALVO,'1016','2026-01','Férias','1016',1,'11','13','11');
  exception when others then n := n + 1; falhas := falhas || ' valido_recusado:' || sqlerrm;
  end;

  -- 2) como DONO: casos inválidos são recusados pelo próprio banco
  for i in 1 .. array_length(ruins, 1) loop
    ok := false;
    begin execute ruins[i][2];
    exception when check_violation or foreign_key_violation then ok := true; end;
    if not ok then n := n + 1; falhas := falhas || ' aceitou:' || ruins[i][1]; end if;
  end loop;

  -- 3) apagar: rascunho pode; depois de "enviado_pelo_contador", não
  update rh_rubricas set situacao_esocial = 'enviado_pelo_contador' where empresa_id = ALVO and cod_rubr = '1000';
  delete from rh_rubricas where empresa_id = ALVO and cod_rubr = '1000'; get diagnostics c = row_count;
  if c > 0 then n := n + 1; falhas := falhas || ' apagou_rubrica_enviada'; end if;

  -- 4) financeiro: lê, mas não grava
  execute 'reset role';
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'financeiro');
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into c from rh_rubricas where empresa_id = ALVO;
  if c <> 3 then n := n + 1; falhas := falhas || ' financeiro_le=' || c; end if;
  ok := false;
  begin insert into rh_rubricas (empresa_id,cod_rubr,ini_valid,dsc_rubr,nat_rubr,tp_rubr,cod_inc_cp,cod_inc_irrf,cod_inc_fgts)
          values (ALVO,'1003','2026-01','Hora extra','1003',1,'11','11','11');
  exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' financeiro_gravou'; end if;

  -- 5) leitor e quem é de fora: não leem nada
  execute 'reset role';
  update empresa_usuarios set papel = 'leitor' where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select (select count(*) from rh_rubricas where empresa_id = ALVO) + (select count(*) from rh_empregador where empresa_id = ALVO) into c;
  if c <> 0 then n := n + 1; falhas := falhas || ' leitor_le=' || c; end if;
  execute 'reset role';
  delete from empresa_usuarios where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select (select count(*) from rh_rubricas) + (select count(*) from rh_empregador) into c;
  if c <> 0 then n := n + 1; falhas := falhas || ' fora_le=' || c; end if;
  -- tabelas oficiais: qualquer usuário logado lê
  if (select count(*) from esocial_tab03_natureza_rubrica) = 0 then n := n + 1; falhas := falhas || ' tab03_sem_leitura'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH2 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
