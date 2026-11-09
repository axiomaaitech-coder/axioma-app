-- RH-18B — Exemplos na empresa de TESTE Horizonte para o desligamento: lotação tributária (S-1020) e as verbas padrão (S-1010).
-- Autorizado pelo Elias em 08/11/2026 ("pode, cadastra os exemplos na Horizonte"). Rodar DEPOIS do RH-18.
-- correção da função (índice parcial da lixeira) — a mesma do RH-18 já ajustado
create or replace function public.rh_rubricas_padrao(p_empresa uuid)
returns integer language plpgsql set search_path to 'public' as $$
declare n integer;
begin
  insert into rh_rubricas (empresa_id, cod_rubr, ide_tab_rubr, ini_valid, dsc_rubr, nat_rubr, tp_rubr, cod_inc_cp, cod_inc_irrf, cod_inc_fgts, observacao)
  select p_empresa, x.cod, 'AXIOMA', '2025-01', x.dsc, x.nat, x.tp, x.cp, x.ir, x.fg, 'Padrão Axioma para rescisão — conferir com o contador antes do primeiro envio'
  from (values
    ('AX6000',  'Saldo de salário na rescisão',              '6000', 1, '11', '11', '11'),
    ('AX6001',  '13º salário sobre o aviso prévio indenizado','6001', 1, '12', '12', '12'),
    ('AX6002',  '13º salário proporcional na rescisão',      '6002', 1, '12', '12', '12'),
    ('AX6003',  'Aviso prévio indenizado',                   '6003', 1, '00', '74', '21'),
    ('AX6004',  'Férias em dobro na rescisão + 1/3',         '6004', 1, '00', '79', '00'),
    ('AX6006',  'Férias proporcionais indenizadas + 1/3',    '6006', 1, '00', '79', '00'),
    ('AX6007',  'Férias vencidas indenizadas + 1/3',         '6007', 1, '00', '79', '00'),
    ('AX6104',  'Indenização do art. 479 da CLT',            '6104', 1, '00', '74', '00'),
    ('AX6901',  'Desconto do aviso prévio não cumprido',     '6901', 2, '00', '9',  '00'),
    ('AX6904',  'Desconto do art. 480 da CLT',               '6904', 2, '00', '9',  '00'),
    ('AX9214',  'Desconto do adiantamento do 13º salário',   '9214', 2, '00', '9',  '00'),
    ('AX9201M', 'INSS do empregado — mensal',                '9201', 2, '31', '41', '00'),
    ('AX9201D', 'INSS do empregado — 13º salário',           '9201', 2, '32', '42', '00'),
    ('AX9203M', 'Imposto de Renda retido — mensal',          '9203', 2, '00', '31', '00'),
    ('AX9203D', 'Imposto de Renda retido — 13º salário',     '9203', 2, '00', '32', '00')
  ) as x(cod, dsc, nat, tp, cp, ir, fg)
  on conflict (empresa_id, ide_tab_rubr, cod_rubr, ini_valid) where excluido_em is null do nothing;   -- índice parcial da lixeira (RH-5)
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.rh_rubricas_padrao(uuid) to authenticated;   -- roda com a liberação de quem chama (RLS de rh_rubricas: editar)

do $$
declare ALVO constant uuid := 'a0000000-0000-4000-8000-00000000e001'; LOT uuid;
begin
  select id into LOT from rh_lotacoes where empresa_id = ALVO and cod_lotacao = 'LOT-01' and excluido_em is null;
  if LOT is null then
    insert into rh_lotacoes (empresa_id, nome, cod_lotacao, ini_valid, tp_lotacao, fpas, cod_tercs)
      values (ALVO, 'Lotação própria — Horizonte (exemplo)', 'LOT-01', '2025-01', '01', '515', '0000') returning id into LOT;   -- Simples (classe 01): terceiros vão no DAS → 0000
  end if;
  update rh_contratos set lotacao_id = LOT where empresa_id = ALVO and lotacao_id is null;
  perform rh_rubricas_padrao(ALVO);
end $$;
-- CONFERÊNCIA (esperado: 1 · 6 · 15)
select (select count(*) from rh_lotacoes where empresa_id = 'a0000000-0000-4000-8000-00000000e001' and cod_lotacao = 'LOT-01') as lotacao,
       (select count(*) from rh_contratos where empresa_id = 'a0000000-0000-4000-8000-00000000e001' and lotacao_id is not null) as contratos_com_lotacao,
       (select count(*) from rh_rubricas where empresa_id = 'a0000000-0000-4000-8000-00000000e001' and ide_tab_rubr = 'AXIOMA') as verbas_padrao;
