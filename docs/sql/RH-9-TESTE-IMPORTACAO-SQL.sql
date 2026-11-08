-- Teste da importação em lote. Rodar DEPOIS de RH-9-IMPORTACAO-SQL.sql.
-- Termina com erro DE PROPÓSITO (o banco desfaz tudo). Esperado: "RESULTADO_RH9 falhas=0".
do $$
declare
  ALVO uuid := 'a0000000-0000-4000-8000-00000000e001';
  U    uuid := '56fd93fa-4e72-438d-94ef-c532d157298e';
  DONO uuid; r jsonb; n int := 0; falhas text := ''; c int; ok boolean;
  lote jsonb := '[
    {"colaborador":{"nome":"Ana Exemplo","situacao":"ativo"},"contrato":{"matricula":"I1","cod_categ":"101","data_admissao":"2026-11-03","tp_contr":2,"data_termino":"2026-12-31","experiencia":true,"qtd_hrs_sem":44,"situacao_esocial":"enviado_pelo_contador"},
     "pessoal":{"cpf":"52998224725","data_nascimento":"1990-05-10","sexo":"F"},"remuneracao":{"valor":2500}},
    {"colaborador":{"nome":"Bruno Exemplo"},"contrato":{"matricula":"I1","cod_categ":"101","data_admissao":"2026-11-03","tp_contr":1,"qtd_hrs_sem":44}},
    {"colaborador":{"nome":"Caio Exemplo"},"contrato":{"matricula":"I3","cod_categ":"101","data_admissao":"2026-11-03","tp_contr":2,"data_termino":"2027-03-01","experiencia":true,"qtd_hrs_sem":44}},
    {"colaborador":{"nome":"Davi Exemplo"},"contrato":{"matricula":"I4","cod_categ":"101","data_admissao":"2026-11-03","tp_contr":1,"qtd_hrs_sem":40},"pessoal":{"cpf":"52998224724","data_nascimento":"1990-01-01"}}
  ]';
begin
  select user_id into DONO from empresas where id = ALVO;
  perform set_config('request.jwt.claims', json_build_object('sub', DONO, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := rh_importar_colaboradores(ALVO, lote);
  -- 1ª entra; 2ª matrícula repetida; 3ª experiência > 90 dias; 4ª CPF inválido (e não deixa a pessoa pela metade)
  if (r->0->>'ok')::boolean is not true then n := n + 1; falhas := falhas || ' linha1:' || coalesce(r->0->>'erro', '?'); end if;
  if (r->1->>'ok')::boolean or (r->2->>'ok')::boolean or (r->3->>'ok')::boolean then n := n + 1; falhas := falhas || ' aceitou_linha_errada'; end if;
  select count(*) into c from rh_colaboradores where empresa_id = ALVO;
  if c <> 1 then n := n + 1; falhas := falhas || ' pessoas_gravadas=' || c || '(esperado 1: linha com erro não deixa pessoa pela metade)'; end if;
  if (select situacao_esocial from rh_contratos where matricula = 'I1' and empresa_id = ALVO) <> 'enviado_pelo_contador' then n := n + 1; falhas := falhas || ' marca_esocial'; end if;
  if (select count(*) from rh_remuneracoes where empresa_id = ALVO) <> 1 then n := n + 1; falhas := falhas || ' salario'; end if;
  -- lote grande demais
  ok := false; begin perform rh_importar_colaboradores(ALVO, (select jsonb_agg(x) from generate_series(1, 201) x)); exception when invalid_parameter_value then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' aceitou_201'; end if;
  -- quem só pode ver não importa
  execute 'reset role';
  insert into empresa_usuarios (empresa_id, user_id, papel) values (ALVO, U, 'financeiro');
  insert into rh_permissoes (empresa_id, user_id, ver) values (ALVO, U, true);
  perform set_config('request.jwt.claims', json_build_object('sub', U, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  ok := false; begin perform rh_importar_colaboradores(ALVO, '[]'::jsonb); exception when insufficient_privilege then ok := true; end;
  if not ok then n := n + 1; falhas := falhas || ' importou_sem_editar'; end if;
  execute 'reset role';
  raise exception 'RESULTADO_RH9 falhas=%', n || coalesce(nullif(falhas, ''), '');
end $$;
