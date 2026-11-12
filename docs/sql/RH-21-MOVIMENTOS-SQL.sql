-- RH-21 (11/11/2026) — telas Admissões e Desligamentos: lista paginada NO BANCO (empresa grande), ordem alfabética,
-- busca por nome/matrícula/CPF sem acento. Visão com security_invoker: cada leitura passa pelas MESMAS travas (RLS) das
-- tabelas de origem — quem não tem liberação de dados pessoais não vê nem busca CPF; sem salário não vê o motivo/rescisão.

-- ═══ BLOCO 1 — visão dos movimentos ═══
create or replace view public.rh_movimentos_v with (security_invoker = true) as
select k.id as contrato_id, k.empresa_id, k.colaborador_id,
       coalesce(nullif(c.nome_social, ''), c.nome) as nome, c.situacao,
       k.matricula, p.cpf, k.cod_categ, k.data_admissao, k.experiencia, k.data_termino,
       k.situacao_esocial, coalesce(k.admissao_cancelada, false) as admissao_cancelada,
       coalesce(k.data_desligamento, d.dt_deslig) as data_desligamento,
       d.mtv_deslig, d.situacao as deslig_situacao, d.aviso, d.dt_aviso,
       lower(translate(coalesce(c.nome, '') || ' ' || coalesce(c.nome_social, '') || ' ' || coalesce(k.matricula, '') || ' ' || regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g'),
         'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ', 'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn')) as busca
from public.rh_contratos k
join public.rh_colaboradores c on c.id = k.colaborador_id and c.excluido_em is null
left join public.rh_colaborador_pessoal p on p.colaborador_id = c.id
left join public.rh_desligamentos d on d.contrato_id = k.id;

revoke all on public.rh_movimentos_v from anon;
grant select on public.rh_movimentos_v to authenticated;
-- ═══ FIM BLOCO 1 ═══

-- ═══ BLOCO 2 — índices para ordenar e filtrar rápido por Empresa ═══
create index if not exists rh_contratos_empresa_admissao_idx on public.rh_contratos (empresa_id, data_admissao);
create index if not exists rh_contratos_empresa_deslig_idx on public.rh_contratos (empresa_id, data_desligamento);
create index if not exists rh_colaboradores_empresa_nome_idx on public.rh_colaboradores (empresa_id, nome);
-- ═══ FIM BLOCO 2 ═══

-- ═══ BLOCO 3 — conferência (deve mostrar 1 linha por contrato da sua Empresa, sem erro) ═══
select count(*) as contratos_na_visao from public.rh_movimentos_v;
-- ═══ FIM BLOCO 3 ═══
