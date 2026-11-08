-- Teste dos arquivos da admissão. Rodar DEPOIS de RH-10-ARQUIVOS-ADMISSAO-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH10 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';
  OUTRA uuid := gen_random_uuid();
  DONO uuid; C1 uuid; c int; n int := 0; falhas text := ''; ok boolean; pdoc text; pexa text;
begin
  select user_id into DONO from empresas where id = ALVO;
  if not exists (select 1 from storage.buckets where id = 'rh-documentos' and public = false) then n := n + 1; falhas := falhas || ' cofre_publico_ou_ausente'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into rh_colaboradores (empresa_id, nome) values (ALVO, 'Maria Exemplo') returning id into C1;
  pdoc := ALVO || '/' || C1 || '/documento/ctps_digital-1731000000000.pdf';
  pexa := ALVO || '/' || C1 || '/exame/aso_admissional-1731000000000.jpg';
  -- dono grava e liga o arquivo ao item
  if not rh_arquivo_pode_gravar(pdoc) then n := n + 1; falhas := falhas || ' dono_nao_grava_doc'; end if;
  if not rh_arquivo_pode_gravar(pexa) then n := n + 1; falhas := falhas || ' dono_nao_grava_exame'; end if;
  begin
    insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, situacao, arquivo_path, arquivo_nome, arquivo_mime, arquivo_bytes) values (ALVO, C1, 'documento', 'ctps_digital', 'entregue', pdoc, 'ctps.pdf', 'application/pdf', 1000);
    insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, situacao, arquivo_path, arquivo_nome, arquivo_mime, arquivo_bytes) values (ALVO, C1, 'exame', 'aso_admissional', 'entregue', pexa, 'aso.jpg', 'image/jpeg', 1000);
  exception when others then n := n + 1; falhas := falhas || ' valido_recusado:' || sqlerrm; end;
  -- caminho malformado ou de outra empresa: falso, sem erro
  if rh_arquivo_pode_gravar('lixo/../x.pdf') then n := n + 1; falhas := falhas || ' aceitou_lixo'; end if;
  if rh_arquivo_pode_gravar(ALVO || '/' || C1 || '/documento/ctps_digital-1.exe') then n := n + 1; falhas := falhas || ' aceitou_exe'; end if;
  if rh_arquivo_pode_gravar(OUTRA || '/' || C1 || '/documento/ctps_digital-1.pdf') then n := n + 1; falhas := falhas || ' outra_empresa'; end if;
  if rh_arquivo_pode_gravar(ALVO || '/' || OUTRA || '/documento/ctps_digital-1.pdf') then n := n + 1; falhas := falhas || ' pessoa_inexistente'; end if;
  -- caminho que não bate com o item é recusado (exame não se esconde na pasta de documento)
  ok := false; begin update rh_admissao_itens set arquivo_path = ALVO || '/' || C1 || '/documento/aso_admissional-1.jpg' where tipo = 'aso_admissional'; exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' exame_na_pasta_documento'; end if;
  ok := false; begin insert into rh_admissao_itens (empresa_id, colaborador_id, categoria, tipo, arquivo_mime) values (ALVO, C1, 'documento', 'cpf', 'application/x-msdownload'); exception when check_violation then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou_mime'; end if;

  -- só "ver" + "dados pessoais", sem editar: não grava nada; documento visível, exame não
  execute 'reset role';
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'contabil');
  insert into rh_permissoes (empresa_id, user_id, ver, ver_pessoais) values (ALVO, U, true, true);
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if rh_arquivo_pode_gravar(pdoc) then n := n + 1; falhas := falhas || ' gravou_sem_editar'; end if;
  select count(*) into c from rh_admissao_itens where arquivo_path = pexa; if c <> 0 then n := n + 1; falhas := falhas || ' viu_arquivo_exame_sem_saude'; end if;
  select count(*) into c from rh_admissao_itens where arquivo_path = pdoc; if c <> 1 then n := n + 1; falhas := falhas || ' nao_viu_arquivo_doc'; end if;
  -- com editar: grava documento, mas exame continua fechado sem saúde
  execute 'reset role';
  update rh_permissoes set editar = true where empresa_id = ALVO and user_id = U;
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if not rh_arquivo_pode_gravar(pdoc) then n := n + 1; falhas := falhas || ' editor_nao_grava_doc'; end if;
  if rh_arquivo_pode_gravar(pexa) then n := n + 1; falhas := falhas || ' gravou_exame_sem_saude'; end if;

  execute 'reset role';
  raise exception 'RESULTADO_RH10 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
