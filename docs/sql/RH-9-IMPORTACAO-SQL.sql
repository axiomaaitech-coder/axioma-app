-- RH · Fase 1 · Subfase 8 — Importação de colaboradores em lote (2026-11-08)
-- A tela confere a planilha (lib/rhImportacao.ts) e manda lotes de até 200 linhas. Esta função grava cada linha
-- separada (pessoa + contrato + dados pessoais + salário): se uma falhar, só ela volta, com o motivo; as outras entram.
-- SECURITY INVOKER: valem as mesmas travas da tela (RLS + rh_pode v2). Sem liberação, a linha falha — nunca entra pela metade.
-- Só CRIA a função. Depois: RH-9-TESTE-IMPORTACAO-SQL.sql (esperado falhas=0).

create or replace function public.rh_importar_colaboradores(p_empresa uuid, p_linhas jsonb)
returns jsonb
language plpgsql security invoker
set search_path to 'public'
as $$
declare
  l jsonb; i int := 0; cid uuid; kid uuid; saida jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_linhas) <> 'array' or jsonb_array_length(p_linhas) > 200 then
    raise exception 'Mande no máximo 200 linhas por vez' using errcode = '22023';
  end if;
  if not public.rh_pode(p_empresa, 'editar') then
    raise exception 'Sem liberação para editar o RH desta Empresa' using errcode = '42501';
  end if;
  for l in select * from jsonb_array_elements(p_linhas) loop
    i := i + 1;
    begin
      insert into public.rh_colaboradores (empresa_id, nome, nome_social, situacao)
        values (p_empresa, l->'colaborador'->>'nome', nullif(l->'colaborador'->>'nome_social', ''), coalesce(l->'colaborador'->>'situacao', 'ativo'))
        returning id into cid;
      insert into public.rh_contratos (empresa_id, colaborador_id, matricula, cod_categ, data_admissao, tp_contr, data_termino, experiencia,
                                       qtd_hrs_sem, cargo_id, departamento_id, data_desligamento, situacao_esocial)
        values (p_empresa, cid, l->'contrato'->>'matricula', l->'contrato'->>'cod_categ', (l->'contrato'->>'data_admissao')::date,
                (l->'contrato'->>'tp_contr')::smallint, (l->'contrato'->>'data_termino')::date, coalesce((l->'contrato'->>'experiencia')::boolean, false),
                (l->'contrato'->>'qtd_hrs_sem')::numeric, (l->'contrato'->>'cargo_id')::uuid, (l->'contrato'->>'departamento_id')::uuid,
                (l->'contrato'->>'data_desligamento')::date, coalesce(l->'contrato'->>'situacao_esocial', 'rascunho'))
        returning id into kid;
      if jsonb_typeof(l->'pessoal') = 'object' then
        insert into public.rh_colaborador_pessoal (colaborador_id, empresa_id, cpf, data_nascimento, sexo, uf, email, cep, telefone, logradouro, numero, bairro, cidade)
          values (cid, p_empresa, l->'pessoal'->>'cpf', (l->'pessoal'->>'data_nascimento')::date, l->'pessoal'->>'sexo', l->'pessoal'->>'uf', l->'pessoal'->>'email',
                  l->'pessoal'->>'cep', l->'pessoal'->>'telefone', l->'pessoal'->>'logradouro', l->'pessoal'->>'numero', l->'pessoal'->>'bairro', l->'pessoal'->>'cidade');
      end if;
      if jsonb_typeof(l->'remuneracao') = 'object' then
        insert into public.rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio, und_sal_fixo, valor, motivo)
          values (p_empresa, kid, (l->'contrato'->>'data_admissao')::date, 5, (l->'remuneracao'->>'valor')::numeric, 'admissao');
      end if;
      saida := saida || jsonb_build_object('i', i, 'ok', true);
    exception when others then
      -- só esta linha volta (o bloco funciona como ponto de retorno); devolve o motivo para a tela traduzir
      saida := saida || jsonb_build_object('i', i, 'ok', false, 'codigo', sqlstate, 'erro', sqlerrm);
    end;
  end loop;
  return saida;
end $$;
revoke all on function public.rh_importar_colaboradores(uuid, jsonb) from public, anon;
grant execute on function public.rh_importar_colaboradores(uuid, jsonb) to authenticated;
