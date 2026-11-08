-- RH · Fase 1 · Subfase 6 — Cadastro de colaboradores (2026-11-08)
-- Campos e valores do evento S-2200 do leiaute oficial eSocial S-1.3 (NT 07/2026 rev. 20/10/2026) e Tabela 01.
-- Dado separado por sensibilidade, cada parte com a sua trava (rh_pode v2):
--   rh_colaboradores ............ nome, situação          → 'ver'
--   rh_colaborador_pessoal ...... CPF, nascimento, endereço, contatos, dados do eSocial → 'pessoais'
--   rh_contratos ................ vínculo, cargo, jornada → 'ver'
--   rh_remuneracoes ............. salário (histórico que nunca se apaga nem se altera) → 'salario'
-- Só CRIA coisas novas. Depois: RH-7-TESTE-COLABORADORES-SQL.sql (esperado falhas=0).
-- ═════ BLOCO 1 — Tabela 01 oficial: categorias de trabalhadores (só leitura) ═════
create table if not exists public.esocial_tab01_categoria (
  codigo text primary key check (codigo ~ '^[0-9]{3}$'),
  grupo text not null, descricao text not null, inicio date, termino date,
  fonte text not null default 'eSocial S-1.3 NT 07/2026 rev. 20/10/2026 — Tabela 01'
);
alter table public.esocial_tab01_categoria enable row level security;
drop policy if exists le on public.esocial_tab01_categoria;
create policy le on public.esocial_tab01_categoria for select to authenticated using (true);
insert into public.esocial_tab01_categoria (codigo, grupo, descricao, inicio, termino) values
('101','Empregado e Trabalhador Temporário','Empregado - Geral, inclusive o empregado público da administração direta ou indireta contratado pela CLT','2014-01-01',null),
('102','Empregado e Trabalhador Temporário','Empregado - Trabalhador rural por pequeno prazo da Lei 11.718/2008','2014-01-01',null),
('103','Empregado e Trabalhador Temporário','Empregado - Aprendiz','2014-01-01',null),
('104','Empregado e Trabalhador Temporário','Empregado - Doméstico','2014-01-01',null),
('105','Empregado e Trabalhador Temporário','Empregado - Contrato a termo firmado nos termos da Lei 9.601/1998','2014-01-01',null),
('106','Empregado e Trabalhador Temporário','Trabalhador temporário - Contrato nos termos da Lei 6.019/1974','2014-01-01',null),
('107','Empregado e Trabalhador Temporário','Empregado - Contrato de trabalho Verde e Amarelo - sem acordo para antecipação mensal da multa rescisória do FGTS','2020-01-01','2022-12-31'),
('108','Empregado e Trabalhador Temporário','Empregado - Contrato de trabalho Verde e Amarelo - com acordo para antecipação mensal da multa rescisória do FGTS','2020-01-01','2022-12-31'),
('111','Empregado e Trabalhador Temporário','Empregado - Contrato de trabalho intermitente','2014-01-01',null),
('201','Avulso','Trabalhador avulso portuário','2014-01-01',null),
('202','Avulso','Trabalhador avulso não portuário','2014-01-01',null),
('301','Agente Público','Servidor público titular de cargo efetivo, magistrado, ministro de Tribunal de Contas, conselheiro de Tribunal de Contas e membro do Ministério Público','2014-01-01',null),
('302','Agente Público','Servidor público ocupante de cargo exclusivo em comissão','2014-01-01',null),
('303','Agente Público','Exercente de mandato eletivo','2014-01-01',null),
('304','Agente Público','Servidor público exercente de mandato eletivo, inclusive com exercício de cargo em comissão','2014-01-01',null),
('305','Agente Público','Servidor público indicado para conselho ou órgão deliberativo, na condição de representante do governo, órgão ou entidade da administração pública','2014-01-01',null),
('306','Agente Público','Servidor público contratado por tempo determinado, sujeito a regime administrativo especial definido em lei própria','2014-01-01',null),
('307','Agente Público','Militar dos Estados e Distrito Federal','2014-01-01',null),
('308','Agente Público','Conscrito','2014-01-01','2023-04-25'),
('309','Agente Público','Agente público - Outros','2014-01-01',null),
('310','Agente Público','Servidor público eventual','2014-01-01',null),
('311','Agente Público','Ministros, juízes, procuradores, promotores ou oficiais de justiça à disposição da Justiça Eleitoral','2014-01-01',null),
('312','Agente Público','Auxiliar local','2014-01-01',null),
('313','Agente Público','Servidor público exercente de atividade de instrutoria, curso ou concurso, convocado para pareceres técnicos, depoimentos, aditância no exterior ou demais atividades vinculadas ao regime próprio','2014-01-01',null),
('314','Agente Público','Militar das Forças Armadas','2014-01-01',null),
('401','Cessão','Dirigente sindical - Informação prestada pelo sindicato','2014-01-01',null),
('410','Cessão','Trabalhador cedido/exercício em outro órgão/juiz auxiliar - Informação prestada pelo cessionário/destino','2014-01-01',null),
('501','Segurado Especial','Dirigente sindical - Segurado especial','2014-01-01',null),
('701','Contribuinte Individual','Contribuinte individual - Autônomo em geral, exceto se enquadrado em uma das demais categorias de contribuinte individual','2014-01-01',null),
('711','Contribuinte Individual','Contribuinte individual - Transportador autônomo de passageiros','2014-01-01',null),
('712','Contribuinte Individual','Contribuinte individual - Transportador autônomo de carga','2014-01-01',null),
('721','Contribuinte Individual','Contribuinte individual - Diretor não empregado, com FGTS','2014-01-01',null),
('722','Contribuinte Individual','Contribuinte individual - Diretor não empregado, sem FGTS','2014-01-01',null),
('723','Contribuinte Individual','Contribuinte individual - Empresário, sócio e membro de conselho de administração ou fiscal','2014-01-01',null),
('731','Contribuinte Individual','Contribuinte individual - Cooperado que presta serviços por intermédio de cooperativa de trabalho','2014-01-01',null),
('734','Contribuinte Individual','Contribuinte individual - Transportador cooperado que presta serviços por intermédio de cooperativa de trabalho','2014-01-01',null),
('738','Contribuinte Individual','Contribuinte individual - Cooperado filiado a cooperativa de produção','2014-01-01',null),
('741','Contribuinte Individual','Contribuinte individual - Microempreendedor individual','2014-01-01',null),
('751','Contribuinte Individual','Contribuinte individual - Magistrado classista temporário da Justiça do Trabalho ou da Justiça Eleitoral que seja aposentado de qualquer regime previdenciário','2014-01-01',null),
('761','Contribuinte Individual','Contribuinte individual - Associado eleito para direção de cooperativa, associação ou entidade de classe de qualquer natureza ou finalidade, bem como o síndico ou administrador eleito para exercer atividade de direção condominial, desde que recebam remuneração','2014-01-01',null),
('771','Contribuinte Individual','Contribuinte individual - Membro de conselho tutelar, nos termos da Lei 8.069/1990','2014-01-01',null),
('781','Contribuinte Individual','Ministro de confissão religiosa ou membro de vida consagrada, de congregação ou de ordem religiosa','2014-01-01',null),
('901','Bolsista','Estagiário','2014-01-01',null),
('902','Bolsista','Médico residente, residente em área profissional de saúde ou médico em curso de formação','2014-01-01',null),
('903','Bolsista','Bolsista','2014-01-01',null),
('904','Bolsista','Participante de curso de formação, como etapa de concurso público, sem vínculo de emprego/estatutário','2014-01-01',null),
('906','Bolsista','Beneficiário do Programa Nacional de Prestação de Serviço Civil Voluntário','2022-01-28',null)
on conflict (codigo) do update set grupo=excluded.grupo, descricao=excluded.descricao, inicio=excluded.inicio, termino=excluded.termino;
-- ═════ FIM BLOCO 1 ═════

-- ═════ BLOCO 2 — colaborador (a pessoa) ═════
create table if not exists public.rh_colaboradores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 2 and 70),
  nome_social text check (nome_social is null or char_length(btrim(nome_social)) between 2 and 70),
  situacao text not null default 'ativo' check (situacao in ('pre_admissao','ativo','afastado','desligado')),
  user_id uuid,                                   -- login no Axioma, se a pessoa tiver (não é obrigatório)
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  excluido_em timestamptz, excluido_por uuid
);
create index if not exists rh_colab_lista on public.rh_colaboradores (empresa_id, situacao, nome) where excluido_em is null;
create index if not exists rh_colab_lixeira on public.rh_colaboradores (empresa_id, excluido_em desc) where excluido_em is not null;
alter table public.rh_colaboradores enable row level security;
drop policy if exists rh_colab_le on public.rh_colaboradores;
create policy rh_colab_le on public.rh_colaboradores for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists rh_colab_grava on public.rh_colaboradores;
create policy rh_colab_grava on public.rh_colaboradores for all to authenticated
  using (public.rh_pode(empresa_id, 'editar')) with check (public.rh_pode(empresa_id, 'editar'));
drop trigger if exists rh_lixeira_marca on public.rh_colaboradores;
create trigger rh_lixeira_marca before update of excluido_em on public.rh_colaboradores for each row execute function public.rh_lixeira_marca();
-- ═════ FIM BLOCO 2 ═════

-- ═════ BLOCO 3 — dados pessoais (só quem tem liberação de "dados pessoais") ═════
create table if not exists public.rh_colaborador_pessoal (
  colaborador_id uuid primary key references public.rh_colaboradores(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cpf text not null check (public.rh_cpf_valido(cpf)),
  data_nascimento date not null check (data_nascimento >= date '1890-01-01'),
  sexo text check (sexo in ('M','F')),
  raca_cor smallint check (raca_cor between 1 and 6),          -- autoclassificação (Lei 12.288/2010, art. 39 § 8º)
  estado_civil smallint check (estado_civil between 1 and 5),
  grau_instr text check (grau_instr ~ '^(0[1-9]|1[0-2])$'),
  pais_nascimento text not null default '105' check (pais_nascimento ~ '^[0-9]{3}$'),   -- Tabela 06 (105 = Brasil)
  pais_nacionalidade text not null default '105' check (pais_nacionalidade ~ '^[0-9]{3}$'),
  cep text check (cep ~ '^[0-9]{8}$'), logradouro text, numero text, complemento text, bairro text, cidade text,
  uf text check (uf ~ '^[A-Z]{2}$'),
  telefone text, email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  emergencia_nome text, emergencia_telefone text,
  updated_at timestamptz not null default now(),
  constraint rh_pessoal_cpf_unico unique (empresa_id, cpf)
);
create or replace function public.rh_pessoal_confere()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.data_nascimento > current_date then
    raise exception 'Data de nascimento no futuro' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists rh_pessoal_confere on public.rh_colaborador_pessoal;
create trigger rh_pessoal_confere before insert or update on public.rh_colaborador_pessoal for each row execute function public.rh_pessoal_confere();
drop trigger if exists rh_pessoal_colab_empresa on public.rh_colaborador_pessoal;
create trigger rh_pessoal_colab_empresa before insert or update of colaborador_id, empresa_id on public.rh_colaborador_pessoal
  for each row execute function public.rh_confere_mesma_empresa('rh_colaboradores', 'colaborador_id');
alter table public.rh_colaborador_pessoal enable row level security;
drop policy if exists rh_pessoal_le on public.rh_colaborador_pessoal;
create policy rh_pessoal_le on public.rh_colaborador_pessoal for select to authenticated using (public.rh_pode(empresa_id, 'pessoais'));
drop policy if exists rh_pessoal_grava on public.rh_colaborador_pessoal;
create policy rh_pessoal_grava on public.rh_colaborador_pessoal for all to authenticated
  using (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais'))
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'pessoais'));
-- ═════ FIM BLOCO 3 ═════

-- ═════ BLOCO 4 — contrato / vínculo (S-2200: vínculo, contrato, jornada) ═════
create table if not exists public.rh_contratos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  colaborador_id uuid not null references public.rh_colaboradores(id) on delete cascade,
  matricula text not null check (char_length(matricula) between 1 and 30 and matricula !~* '^esocial'),
  cod_categ text not null references public.esocial_tab01_categoria(codigo),
  tp_reg_trab smallint not null default 1 check (tp_reg_trab in (1,2)),
  tp_reg_prev smallint not null default 1 check (tp_reg_prev in (1,2,3,4)),
  data_admissao date not null,
  tp_contr smallint not null default 1 check (tp_contr in (1,2,3)),   -- 1 indeterminado · 2 determinado em dias · 3 vinculado a fato
  data_termino date,
  experiencia boolean not null default false,                        -- contrato de experiência (CLT art. 443 § 2º, "c")
  cargo_id uuid references public.rh_cargos(id) on delete set null,
  departamento_id uuid references public.rh_departamentos(id) on delete set null,
  estabelecimento_id uuid references public.rh_estabelecimentos(id) on delete set null,
  lotacao_id uuid references public.rh_lotacoes(id) on delete set null,
  centro_custo_id uuid references public.centros_custo(id) on delete set null,
  gestor_id uuid references public.rh_colaboradores(id) on delete set null,
  qtd_hrs_sem numeric(5,2) check (qtd_hrs_sem > 0),
  tp_jornada smallint check (tp_jornada in (2,3,4,5,6,7,9)),
  data_desligamento date,
  situacao_esocial text not null default 'rascunho'
    check (situacao_esocial in ('rascunho','preparado','enviado','aceito','recusado','enviado_pelo_contador')),
  recibo_esocial text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint rh_contrato_matricula unique (empresa_id, matricula),
  -- leiaute S-2200: data de término obrigatória e só no prazo determinado em dias; nunca antes da admissão
  constraint rh_contrato_termino check ((tp_contr = 2) = (data_termino is not null) and (data_termino is null or data_termino >= data_admissao)),
  -- CLT art. 445, parágrafo único: contrato de experiência não passa de 90 dias
  constraint rh_contrato_experiencia check (not experiencia or (tp_contr = 2 and data_termino <= data_admissao + 89)),
  -- CLT art. 445, caput: prazo determinado comum não passa de 2 anos (temporário e outros têm lei própria)
  constraint rh_contrato_determinado check (tp_contr <> 2 or cod_categ <> '101' or data_termino < data_admissao + interval '2 years'),
  -- leiaute S-2200: aprendiz admitido a partir de 2024-04-22 é sempre prazo determinado
  constraint rh_contrato_aprendiz check (cod_categ <> '103' or data_admissao < date '2024-04-22' or tp_contr = 2),
  -- leiaute S-2200: horas semanais obrigatórias, exceto intermitente (111)
  constraint rh_contrato_horas check (cod_categ = '111' or qtd_hrs_sem is not null),
  -- leiaute S-2200: doméstico (104) é CLT/RGPS; empregados 101–111 não usam regime 2 ou 4
  constraint rh_contrato_regime check ((cod_categ <> '104' or (tp_reg_trab = 1 and tp_reg_prev = 1))
    and (cod_categ not in ('101','102','103','105','106','107','108','111') or tp_reg_prev not in (2,4))),
  constraint rh_contrato_deslig check (data_desligamento is null or data_desligamento >= data_admissao)
);
create index if not exists rh_contrato_colab on public.rh_contratos (empresa_id, colaborador_id);
create index if not exists rh_contrato_termino_idx on public.rh_contratos (empresa_id, data_termino) where data_termino is not null and data_desligamento is null;
create index if not exists rh_contrato_dep on public.rh_contratos (empresa_id, departamento_id);
do $$ declare par text[];
begin
  foreach par slice 1 in array array[['rh_colaboradores','colaborador_id'],['rh_cargos','cargo_id'],['rh_departamentos','departamento_id'],
      ['rh_estabelecimentos','estabelecimento_id'],['rh_lotacoes','lotacao_id'],['centros_custo','centro_custo_id'],['rh_colaboradores','gestor_id']] loop
    execute format('drop trigger if exists %I on public.rh_contratos', 'rh_contrato_emp_' || par[2]);
    execute format('create trigger %I before insert or update of %I, empresa_id on public.rh_contratos for each row execute function public.rh_confere_mesma_empresa(%L, %L)',
      'rh_contrato_emp_' || par[2], par[2], par[1], par[2]);
  end loop;
end $$;
alter table public.rh_contratos enable row level security;
drop policy if exists rh_contrato_le on public.rh_contratos;
create policy rh_contrato_le on public.rh_contratos for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists rh_contrato_grava on public.rh_contratos;
create policy rh_contrato_grava on public.rh_contratos for all to authenticated
  using (public.rh_pode(empresa_id, 'editar')) with check (public.rh_pode(empresa_id, 'editar'));
-- ═════ FIM BLOCO 4 ═════

-- ═════ BLOCO 5 — salário: histórico que só cresce (sem alterar, sem apagar) ═════
create table if not exists public.rh_remuneracoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  contrato_id uuid not null references public.rh_contratos(id) on delete cascade,
  vigencia_inicio date not null,
  und_sal_fixo smallint not null default 5 check (und_sal_fixo between 1 and 7),   -- 1 hora · 2 dia · 3 semana · 4 quinzena · 5 mês · 6 tarefa · 7 só variável
  valor numeric(14,2) not null check (valor >= 0),
  motivo text not null check (motivo in ('admissao','reajuste_coletivo','merito','promocao','enquadramento','correcao','outro')),
  observacao text check (char_length(observacao) <= 500),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint rh_remun_vigencia unique (contrato_id, vigencia_inicio),
  constraint rh_remun_variavel check ((und_sal_fixo = 7) = (valor = 0))   -- leiaute: só variável → valor 0
);
create index if not exists rh_remun_contrato on public.rh_remuneracoes (empresa_id, contrato_id, vigencia_inicio desc);
drop trigger if exists rh_remun_contrato_empresa on public.rh_remuneracoes;
create trigger rh_remun_contrato_empresa before insert on public.rh_remuneracoes
  for each row execute function public.rh_confere_mesma_empresa('rh_contratos', 'contrato_id');
alter table public.rh_remuneracoes enable row level security;
drop policy if exists rh_remun_le on public.rh_remuneracoes;
create policy rh_remun_le on public.rh_remuneracoes for select to authenticated using (public.rh_pode(empresa_id, 'salario'));
drop policy if exists rh_remun_insere on public.rh_remuneracoes;
create policy rh_remun_insere on public.rh_remuneracoes for insert to authenticated
  with check (public.rh_pode(empresa_id, 'editar') and public.rh_pode(empresa_id, 'salario'));
-- sem política de alteração nem de exclusão: salário errado se corrige com uma nova linha (motivo "correcao")
-- ═════ FIM BLOCO 5 ═════

-- ═════ BLOCO 6 — lixeira do colaborador: só quem nunca foi enviado ao eSocial ═════
create or replace function public.rh_colab_lixeira_confere()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.excluido_em is not null and old.excluido_em is null and exists (
     select 1 from public.rh_contratos c where c.colaborador_id = new.id and c.situacao_esocial <> 'rascunho') then
    raise exception 'Este colaborador já foi enviado ao eSocial: não vai para a lixeira. Registre o desligamento.' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_colab_lixeira_confere on public.rh_colaboradores;
create trigger rh_colab_lixeira_confere before update of excluido_em on public.rh_colaboradores
  for each row execute function public.rh_colab_lixeira_confere();
-- ═════ FIM BLOCO 6 ═════
