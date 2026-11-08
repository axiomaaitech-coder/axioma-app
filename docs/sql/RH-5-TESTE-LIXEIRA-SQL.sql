-- Teste da lixeira de 60 dias do RH. Rodar DEPOIS de RH-5-LIXEIRA-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH5 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  DONO uuid; D1 uuid; quem uuid; n int := 0; falhas text := ''; ok boolean;
begin
  select user_id into DONO from empresas where id = ALVO;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 1) vai para a lixeira, guarda quem mandou, e o nome fica livre para um novo
  insert into rh_departamentos (empresa_id, nome) values (ALVO, 'Financeiro') returning id into D1;
  update rh_departamentos set excluido_em = now() where id = D1;
  select excluido_por into quem from rh_departamentos where id = D1;
  if quem is distinct from DONO then n := n + 1; falhas := falhas || ' sem_excluido_por'; end if;
  begin insert into rh_departamentos (empresa_id, nome) values (ALVO, 'Financeiro');
  exception when others then n := n + 1; falhas := falhas || ' nome_preso_na_lixeira:' || sqlstate; end;

  -- 2) recuperar com um nome que já voltou a existir: recusado (sem duplicar)
  ok := false;
  begin update rh_departamentos set excluido_em = null where id = D1;
  exception when unique_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' recuperou_duplicado'; end if;

  -- 3) recuperar de verdade limpa quem apagou
  update rh_departamentos set nome = 'Financeiro antigo' where id = D1;
  update rh_departamentos set excluido_em = null where id = D1;
  select excluido_por into quem from rh_departamentos where id = D1;
  if quem is not null then n := n + 1; falhas := falhas || ' excluido_por_ficou'; end if;

  -- 4) o que já foi enviado ao eSocial não vai para a lixeira
  insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr,situacao_esocial)
    values (ALVO,1,'11222333','2026-01','01',0,0,'enviado_pelo_contador');
  ok := false;
  begin update rh_empregador set excluido_em = now() where empresa_id = ALVO;
  exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' enviado_foi_para_lixeira'; end if;

  -- 5) empregador na lixeira não vale para cadastrar filial
  insert into rh_empregador (empresa_id,tp_insc,nr_insc,ini_valid,class_trib,ind_coop,ind_constr)
    values (ALVO,1,'11222333','2025-01','01',0,0);
  update rh_empregador set excluido_em = now() where empresa_id = ALVO and ini_valid = '2025-01';
  ok := false;
  begin insert into rh_estabelecimentos (empresa_id,nome,tp_insc,nr_insc,ini_valid,cnae_prep) values (ALVO,'X',1,'11222333000181','2025-03','4711302');
  exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' usou_empregador_da_lixeira'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH5 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
