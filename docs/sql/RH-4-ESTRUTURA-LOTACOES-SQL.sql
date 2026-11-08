-- RH · Fase 1 · Subfase 4 — Lotações (S-1020), departamentos e cargos — 2026-11-08
-- Lotação: campos do leiaute oficial eSocial S-1.3 (NT 07/2026 rev. 20/10/2026), com as Tabelas 04, 10 e 12.
-- Departamentos e cargos são do Axioma (não vão ao eSocial como tabela). O código CBO do cargo é conferido
-- no formato (6 dígitos). A lista oficial da CBO entra na etapa de admissão, quando o eSocial a exige.
-- Só CRIA coisas novas. Grupos que exigem a Tabela de Processos (S-1070) — Terceiros suspensos — ficam bloqueados.

-- ═════ BLOCO 1 — tabelas oficiais de referência (só leitura) ═════
create table if not exists public.esocial_tab04_fpas (
  fpas text not null check (fpas ~ '^[0-9]{3}$'),
  grupo text not null,                          -- EMPRESAS, COOPERATIVAS... (como na Tabela 04)
  descricao text not null,
  terceiros_total integer not null check (terceiros_total between 0 and 9999),   -- código cheio de Terceiros
  fonte text not null default 'eSocial S-1.3 NT 07/2026 rev. 20/10/2026 — Tabela 04',
  primary key (fpas, grupo)
);
create table if not exists public.esocial_tab10_tipo_lotacao (
  codigo text primary key check (codigo ~ '^[0-9]{2}$'),
  descricao text not null,
  preenchimento_nr_insc text,
  fonte text not null default 'eSocial S-1.3 NT 07/2026 rev. 20/10/2026 — Tabela 10'
);
create table if not exists public.esocial_tab12_lotacao_class_trib (
  tp_lotacao text not null references public.esocial_tab10_tipo_lotacao(codigo),
  class_trib text not null references public.esocial_tab08_class_trib(codigo),
  permitido boolean not null,
  fonte text not null default 'eSocial S-1.3 NT 07/2026 rev. 20/10/2026 — Tabela 12',
  primary key (tp_lotacao, class_trib)
);
alter table public.esocial_tab04_fpas enable row level security;
alter table public.esocial_tab10_tipo_lotacao enable row level security;
alter table public.esocial_tab12_lotacao_class_trib enable row level security;
drop policy if exists le on public.esocial_tab04_fpas;
create policy le on public.esocial_tab04_fpas for select to authenticated using (true);
drop policy if exists le on public.esocial_tab10_tipo_lotacao;
create policy le on public.esocial_tab10_tipo_lotacao for select to authenticated using (true);
drop policy if exists le on public.esocial_tab12_lotacao_class_trib;
create policy le on public.esocial_tab12_lotacao_class_trib for select to authenticated using (true);
-- ═════ FIM BLOCO 1 ═════

-- ═════ BLOCO 2 — conteúdo oficial das tabelas 04, 10 e 12 ═════
insert into public.esocial_tab04_fpas (fpas, grupo, descricao, terceiros_total) values
('507','EMPRESAS','INDÚSTRIA - TRANSPORTE FERROVIÁRIO e de CARRIS URBANOS (inclusive cabos aéreos) EMPRESA METROVIÁRIA - EMPRESA DE TELECOMUNICAÇÕES - OFICINA GRÁFICA DE EMPRESA JORNALÍSTICA - Oficinas mecânicas de manutenção e reparação de veículos e máquinas, inclusive de concessionárias - ESCRITÓRIO E DEPÓSITO DE EMPRESA INDUSTRIAL - INDÚSTRIA DA CONSTRUÇÃO CIVIL - ARMAZÉNS GERAIS - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código) - TOMADOR DE SERVIÇO DE TRABALHADOR AVULSO - contribuição sobre a remuneração de trabalhador avulso vinculado à indústria. INDÚSTRIA DE CARNES E DERIVADOS (frigorífico) de animal de qualquer espécie, inclusive o setor industrial das agroindústrias de piscicultura, carcinicultura, suinocultura e avicultura (exceto quanto aos empregados envolvidos diretamente com o abate - FPAS 531). SETOR INDUSTRIAL DA AGROINDÚSTRIA de florestamento e reflorestamento quando não aplicável a substituição, na forma do art. 22-A da Lei 8.212/1991. ESTALEIRO - setor de fabricação e desmontagem de embarcações navais.',79),
('507','COOPERATIVAS','INDÚSTRIA - TRANSPORTE FERROVIÁRIO e de CARRIS URBANOS (inclusive cabos aéreos) EMPRESA METROVIÁRIA - EMPRESA DE TELECOMUNICAÇÕES - OFICINA GRÁFICA DE EMPRESA JORNALÍSTICA - Oficinas mecânicas de manutenção e reparação de veículos e máquinas, inclusive de concessionárias - ESCRITÓRIO E DEPÓSITO DE EMPRESA INDUSTRIAL - INDÚSTRIA DA CONSTRUÇÃO CIVIL - ARMAZÉNS GERAIS - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código) - TOMADOR DE SERVIÇO DE TRABALHADOR AVULSO - contribuição sobre a remuneração de trabalhador avulso vinculado à indústria. INDÚSTRIA DE CARNES E DERIVADOS (frigorífico) de animal de qualquer espécie, inclusive o setor industrial das agroindústrias de piscicultura, carcinicultura, suinocultura e avicultura (exceto quanto aos empregados envolvidos diretamente com o abate - FPAS 531). SETOR INDUSTRIAL DA AGROINDÚSTRIA de florestamento e reflorestamento quando não aplicável a substituição, na forma do art. 22-A da Lei 8.212/1991. ESTALEIRO - setor de fabricação e desmontagem de embarcações navais.',4163),
('515','EMPRESAS','COMÉRCIO ATACADISTA - COMÉRCIO VAREJISTA - AGENTE AUTÔNOMO DO COMÉRCIO - COMÉRCIO ARMAZENADOR - TURISMO E HOSPITALIDADE (inclusive salão de barbeiro, instituto de beleza, empresa de compra, venda, locação e administração de imóvel, engraxate, empresa de asseio e conservação, sociedade beneficente e religiosa etc.) - ESTABELECIMENTO DE SERVIÇO DE SAÚDE (hospital, clínica, casa de saúde, laboratório de pesquisas e análises clínicas, cooperativa de serviço médico, banco de sangue, estabelecimento de ducha, massagem e fisioterapia e empresa de prótese) - COMÉRCIO TRANSPORTADOR, REVENDEDOR, RETALHISTA DE ÓLEO DIESEL, ÓLEO COMBUSTÍVEL E QUEROSENE (exceto quanto aos empregados envolvidos diretamente na atividade de transporte - Decreto 1.092/1994 - FPAS 612) - EMPRESA E SERVIÇOS DE PROCESSAMENTO DE DADOS - ESCRITÓRIO, CONSULTÓRIO OU LABORATÓRIO DE PROFISSIONAIS LIBERAIS (pessoa jurídica) - CONSÓRCIO - AUTOESCOLA - CURSO LIVRE - LOCAÇÕES DIVERSAS - PARTIDO POLÍTICO - EMPRESA DE TRABALHO TEMPORÁRIO (contribuição sobre a folha de salário de seus empregados) - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código) - TOMADOR DE SERVIÇO DE TRABALHADOR AVULSO - contribuição sobre a remuneração de trabalhador avulso vinculado ao comércio - EMPRESAS DE FACTORING .',115),
('515','COOPERATIVAS','COMÉRCIO ATACADISTA - COMÉRCIO VAREJISTA - AGENTE AUTÔNOMO DO COMÉRCIO - COMÉRCIO ARMAZENADOR - TURISMO E HOSPITALIDADE (inclusive salão de barbeiro, instituto de beleza, empresa de compra, venda, locação e administração de imóvel, engraxate, empresa de asseio e conservação, sociedade beneficente e religiosa etc.) - ESTABELECIMENTO DE SERVIÇO DE SAÚDE (hospital, clínica, casa de saúde, laboratório de pesquisas e análises clínicas, cooperativa de serviço médico, banco de sangue, estabelecimento de ducha, massagem e fisioterapia e empresa de prótese) - COMÉRCIO TRANSPORTADOR, REVENDEDOR, RETALHISTA DE ÓLEO DIESEL, ÓLEO COMBUSTÍVEL E QUEROSENE (exceto quanto aos empregados envolvidos diretamente na atividade de transporte - Decreto 1.092/1994 - FPAS 612) - EMPRESA E SERVIÇOS DE PROCESSAMENTO DE DADOS - ESCRITÓRIO, CONSULTÓRIO OU LABORATÓRIO DE PROFISSIONAIS LIBERAIS (pessoa jurídica) - CONSÓRCIO - AUTOESCOLA - CURSO LIVRE - LOCAÇÕES DIVERSAS - PARTIDO POLÍTICO - EMPRESA DE TRABALHO TEMPORÁRIO (contribuição sobre a folha de salário de seus empregados) - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código) - TOMADOR DE SERVIÇO DE TRABALHADOR AVULSO - contribuição sobre a remuneração de trabalhador avulso vinculado ao comércio - EMPRESAS DE FACTORING .',4163),
('523','GERAL','SINDICATO OU ASSOCIAÇÃO PROFISSIONAL DE EMPREGADO, TRABALHADOR AVULSO OU EMPREGADOR, PERTENCENTE A ATIVIDADE OUTRORA NÃO VINCULADA AO ex-IAPC - EMPRESA BRASILEIRA DE NAVEGAÇÃO (exclusivamente em relação aos tripulantes de embarcação inscrita no Registro Especial Brasileiro - REB, Lei 9.432/1997 e Decreto 2.256/1997), PESSOAS JURÍDICAS DE DIREITO PRIVADO CONSTITUÍDAS SOB A FORMA DE SERVIÇO SOCIAL AUTÔNOMO.',3),
('531','GERAL','INDÚSTRIA DE CANA-DE-AÇÚCAR - DE LATICÍNIO - DE BENEFICIAMENTO DE CHÁ E MATE - DA UVA - DE EXTRAÇÃO E BENEFICIAMENTO DE FIBRAS VEGETAIS E DE DESCAROÇAMENTO DE ALGODÃO - DE BENEFICIAMENTO DE CAFÉ E DE CEREAIS - DE EXTRAÇÃO DE MADEIRA PARA SERRARIA, DE RESINA, LENHA E CARVÃO VEGETAL - MATADOURO OU ABATEDOURO E O SETOR DE ABATE DE ANIMAL DE QUALQUER ESPÉCIE, inclusive das agroindústrias de PISCICULTURA, CARCINICULTURA, SUINOCULTURA E AVICULTURA, E CHARQUEADA.',3),
('540','GERAL','EMPRESA DE NAVEGAÇÃO MARÍTIMA, FLUVIAL OU LACUSTRE (exceto em relação aos tripulantes de embarcação inscrita no Registro Especial Brasileiro - REB - FPAS 523) - AGÊNCIA DE NAVEGAÇÃO - SERVIÇO PORTUÁRIO - EMPRESA DE DRAGAGEM [Serviços de dragagem em portos, terminais, marinas, área marítima (canais / mares) fluvial e lacustre, ou seja, dragagem no meio aquaviário] - EMPRESA DE ADMINISTRAÇÃO E EXPLORAÇÃO DE PORTOS - SERVIÇOS PORTUÁRIOS (inclusive empresas de praticagem) - ÓRGÃO DE GESTÃO DE MÃO-DE-OBRA (em relação aos empregados permanentes) - EMPRESA DE CAPTURA DE PESCADO (inclusive armador de pesca em relação aos empregados envolvidos na atividade de captura de pescado e do escritório) - ESTALEIRO - setor de reparos e consertos sem desmontagem de embarcações navais.',131),
('558','GERAL','EMPRESA AEROVIÁRIA, INCLUSIVE TÁXI-AÉREO - EMPRESA DE SERVIÇO AÉREO ESPECIALIZADO - EMPRESA DE TELECOMUNICAÇÕES AERONÁUTICAS - IMPLANTAÇÃO, ADMINISTRAÇÃO, OPERAÇÃO E EXPLORAÇÃO DE INFRAESTRUTURA AEROPORTUÁRIA E DE SERVIÇOS AUXILIARES - EMPRESA DE FABRICAÇÃO, REPARO E MANUTENÇÃO OU REPRESENTAÇÃO DE AERONAVE, SUAS PEÇAS E ACESSÓRIOS - EMPRESA DE EQUIPAMENTO AERONÁUTICO - TRANSPORTE ESPACIAL.',259),
('566','EMPRESAS','EMPRESA DE COMUNICAÇÃO - EMPRESA DE PUBLICIDADE - EMPRESA JORNALÍSTICA - EMPRESA DE DIFUSÃO CULTURAL E ARTÍSTICA - ESTABELECIMENTO DE CULTURA FÍSICA - ESTABELECIMENTO HÍPICO - ESCRITÓRIO, CONSULTÓRIO DE PROFISSIONAL LIBERAL (pessoa física) - SINDICATO OU ASSOCIAÇÃO DE PROFISSIONAL, EMPREGADO OU EMPREGADOR, PERTENCENTE A ATIVIDADE OUTRORA VINCULADA AO ex-IAPC - CONDOMÍNIO - CRECHE - ASSOCIAÇÕES DESPORTIVAS (exceto clubes de futebol profissional - FPAS 647 e 779) - ENTIDADES RECREATIVAS, CULTURAIS, DE ORIENTAÇÃO E FORMAÇÃO PROFISSIONAL E DE ASSISTÊNCIA SOCIAL - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código).',99),
('566','COOPERATIVAS','EMPRESA DE COMUNICAÇÃO - EMPRESA DE PUBLICIDADE - EMPRESA JORNALÍSTICA - EMPRESA DE DIFUSÃO CULTURAL E ARTÍSTICA - ESTABELECIMENTO DE CULTURA FÍSICA - ESTABELECIMENTO HÍPICO - ESCRITÓRIO, CONSULTÓRIO DE PROFISSIONAL LIBERAL (pessoa física) - SINDICATO OU ASSOCIAÇÃO DE PROFISSIONAL, EMPREGADO OU EMPREGADOR, PERTENCENTE A ATIVIDADE OUTRORA VINCULADA AO ex-IAPC - CONDOMÍNIO - CRECHE - ASSOCIAÇÕES DESPORTIVAS (exceto clubes de futebol profissional - FPAS 647 e 779) - ENTIDADES RECREATIVAS, CULTURAIS, DE ORIENTAÇÃO E FORMAÇÃO PROFISSIONAL E DE ASSISTÊNCIA SOCIAL - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código).',4163),
('574','EMPRESAS','ESTABELECIMENTO DE ENSINO - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código).',99),
('574','COOPERATIVAS','ESTABELECIMENTO DE ENSINO - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código).',4163),
('582','GERAL','ÓRGÃO DO PODER PÚBLICO (União, Estado, Distrito Federal e Município, inclusive suas respectivas Autarquias e as Fundações com personalidade jurídica de direito público.) - ORGANISMO OFICIAL BRASILEIRO E INTERNACIONAL do qual o Brasil seja membro efetivo e mantenha, no exterior, brasileiro civil que trabalhe para a união ainda que lá domiciliado e contratado - REPARTIÇÃO DIPLOMÁTICA BRASILEIRA sediada no exterior que contrata auxiliares locais - MISSÃO DIPLOMÁTICA OU REPARTIÇÃO CONSULAR de carreira estrangeira e órgão a ela subordinado no Brasil, ou a membro dessa missão ou repartição, observadas as exclusões legais (Decreto-Lei 2.253/1985) - ORDEM DOS ADVOGADOS DO BRASIL - CONSELHO DE FISCALIZAÇÃO DE PROFISSÃO REGULAMENTADA. Nota: Não se incluem no FPAS 582 as MISSÕES DIPLOMÁTICAS E OUTROS ORGANISMOS A ELAS EQUIPARADOS, INCLUSIVE SEUS MEMBROS, que sejam partícipes de acordo internacional de isenção reconhecido pelo Brasil, os quais deverão se enquadrar no FPAS 876.',0),
('590','GERAL','CARTÓRIO, TABELIONATO, oficializados ou não.',1),
('604','GERAL','PRODUTOR RURAL PESSOA FÍSICA, contribuinte individual (com recolhimento sobre a comercialização da produção rural) e segurado especial, nos termos da Lei 11.718/2008. PRODUTOR RURAL PESSOA JURÍDICA, inclusive na atividade de criação de pescado em cativeiro, em relação a todos os seus empregados (com recolhimento sobre a comercialização da produção rural). CONSORCIO SIMPLIFICADO DE PRODUTORES RURAIS. AGROINDÚSTRIA não relacionada no caput do Decreto Lei 1.146/1970, relativamente aos segurados e envolvidos no processo de produção própria, setor rural, exceto as agroindústrias de piscicultura, carcinicultura, suinocultura, avicultura e florestamento e reflorestamento, nos termos da Lei 10.684/2003. SOCIEDADE COOPERATIVA DE PRODUÇÃO RURAL, relativamente em relação aos segurados contratados para a colheita da produção de seus cooperados. Exclui-se deste código a prestação de serviços a terceiros, nos termos da Lei 10.256/2001.',3),
('612','EMPRESAS','EMPRESA DE TRANSPORTE RODOVIÁRIO - EMPRESA DE TRANSPORTE DE VALORES - EMPRESA DE LOCAÇÃO DE VEÍCULO - EMPRESA DE DISTRIBUIÇÃO DE PETRÓLEO (exclusivamente em relação à folha de pagamento dos empregados envolvidos diretamente na atividade de transporte) - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código).',3139),
('612','COOPERATIVAS','EMPRESA DE TRANSPORTE RODOVIÁRIO - EMPRESA DE TRANSPORTE DE VALORES - EMPRESA DE LOCAÇÃO DE VEÍCULO - EMPRESA DE DISTRIBUIÇÃO DE PETRÓLEO (exclusivamente em relação à folha de pagamento dos empregados envolvidos diretamente na atividade de transporte) - SOCIEDADE COOPERATIVA (estabelecimento no qual explora atividade econômica relacionada neste código).',4163),
('620','GERAL','TOMADOR DE SERVIÇO DE TRANSPORTADOR RODOVIÁRIO AUTÔNOMO (contribuição previdenciária a cargo da empresa tomadora e contribuição descontada do transportador autônomo para o SEST e o SENAT).',3072),
('639','GERAL','ENTIDADE BENEFICENTE DE ASSISTÊNCIA SOCIAL, com isenção requerida e concedida pela Previdência Social, inclusive aquela transformada em entidade de fins econômicos na forma do art. 7° da Lei 9.131/1995, no período de pagamento parcial das contribuições patronais, nos termos do art. 13 da Lei 11.096/2005.',0),
('647','GERAL','ASSOCIAÇÃO DESPORTIVA QUE MANTÉM EQUIPE DE FUTEBOL PROFISSIONAL, em qualquer modalidade desportiva, e CLUBE DE FUTEBOL PROFISSIONAL - contribuição descontada dos empregados, atletas ou não, e as destinadas a outras entidades ou fundos.',99),
('655','GERAL','EMPRESA DE TRABALHO TEMPORÁRIO (Lei 6.019/1974) - contribuição sobre a remuneração do trabalhador temporário.',1),
('680','GERAL','ÓRGÃO GESTOR DE MÃO-DE-OBRA, com relação a contribuição sobre a remuneração de trabalhador avulso vinculado à Diretoria de Portos e Costas.',131),
('736','GERAL','BANCO COMERCIAL - BANCO DE INVESTIMENTO - BANCO DE DESENVOLVIMENTO - CAIXA ECONÔMICA - SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTO - SOCIEDADE DE CRÉDITO IMOBILIÁRIO - SOCIEDADE CORRETORA - DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS - EMPRESA DE ARRENDAMENTO MERCANTIL - EMPRESA DE SEGURO PRIVADO E DE CAPITALIZAÇÃO (inclusive seguro saúde) - AGENTE AUTÔNOMO DE SEGURO PRIVADO E DE CRÉDITO - ENTIDADE DE PREVIDÊNCIA PRIVADA (aberta e fechada).',3),
('744','PESSOA FÍSICA','EMPRESA ADQUIRENTE, CONSUMIDORA, CONSIGNATÁRIA OU COOPERATIVA que adquire produção rural de produtor pessoa física. PRODUTOR RURAL PESSOA FÍSICA (contribuinte individual e segurado especial), quando venderem seus produtos a outro produtor rural pessoa física, consumidor pessoa física, destinatário incerto ou não comprovar formalmente o destino da produção ou a adquirente domiciliado no exterior. PRODUTOR RURAL PESSOA JURÍDICA E AGROINDÚSTRIA (exceto as agroindústrias de piscicultura, carcinicultura, suinocultura, avicultura, florestamento e reflorestamento, nos termos da Lei 10.684/2003).',512),
('744','PESSOA JURÍDICA E AGROINDÚSTRIA','EMPRESA ADQUIRENTE, CONSUMIDORA, CONSIGNATÁRIA OU COOPERATIVA que adquire produção rural de produtor pessoa física. PRODUTOR RURAL PESSOA FÍSICA (contribuinte individual e segurado especial), quando venderem seus produtos a outro produtor rural pessoa física, consumidor pessoa física, destinatário incerto ou não comprovar formalmente o destino da produção ou a adquirente domiciliado no exterior. PRODUTOR RURAL PESSOA JURÍDICA E AGROINDÚSTRIA (exceto as agroindústrias de piscicultura, carcinicultura, suinocultura, avicultura, florestamento e reflorestamento, nos termos da Lei 10.684/2003).',512),
('779','GERAL','ASSOCIAÇÃO DESPORTIVA QUE MANTÉM EQUIPE DE FUTEBOL PROFISSIONAL - contribuição de 5% da receita bruta, decorrente de espetáculo desportivo de que participe em todo território nacional em qualquer modalidade, inclusive jogos internacionais, a ser recolhida pela ENTIDADE PROMOTORA DO EVENTO (federação ou confederação), e de QUALQUER FORMA DE PATROCÍNIO, LICENCIAMENTO DE USO DE MARCAS E SÍMBOLOS, PUBLICIDADE, PROPAGANDA E TRANSMISSÃO DE ESPETÁCULOS DESPORTIVOS, a ser recolhida pela empresa ou entidade patrocinadora.',0),
('787','TODAS AS ATIVIDADES, EXCETO COOPERATIVISTA','SINDICATO, FEDERAÇÃO E CONFEDERAÇÃO PATRONAL RURAL. ATIVIDADE COOPERATIVISTA RURAL (cooperativa rural) não relacionada no Decreto-Lei 1.146/1970 (com ou sem produção própria), somente em relação aos empregados que atuem diretamente na produção primária de origem animal ou vegetal. AGROINDÚSTRIAS de piscicultura, carcinicultura, suinocultura, avicultura, florestamento e reflorestamento, nos termos da Lei 10.684/2003, somente em relação aos empregados que atuem diretamente na produção primária de origem animal ou vegetal. PRESTADOR DE MÃO-DE-OBRA RURAL legalmente constituído como pessoa jurídica. PRODUTOR RURAL PESSOA JURÍDICA na prestação de serviços rurais (atividade não autônoma). AGROINDÚSTRIA (nos termos da Lei 10.256/2001) na prestação de serviços rurais ou agroindustriais a terceiros. PRODUTOR RURAL PESSOA JURÍDICA que exerce outra atividade econômica autônoma, somente em relação aos empregados que atuem diretamente na produção primária de origem animal ou vegetal. PRODUTOR RURAL PESSOA FÍSICA, contribuinte individual (empregador) e PRODUTOR RURAL PESSOA JURÍDICA, com recolhimento sobre a folha de salários. SOCIEDADE COOPERATIVA DE CRÉDITO, conforme art. 10 da Lei 11.524/2007.',515),
('787','COOPERATIVAS','SINDICATO, FEDERAÇÃO E CONFEDERAÇÃO PATRONAL RURAL. ATIVIDADE COOPERATIVISTA RURAL (cooperativa rural) não relacionada no Decreto-Lei 1.146/1970 (com ou sem produção própria), somente em relação aos empregados que atuem diretamente na produção primária de origem animal ou vegetal. AGROINDÚSTRIAS de piscicultura, carcinicultura, suinocultura, avicultura, florestamento e reflorestamento, nos termos da Lei 10.684/2003, somente em relação aos empregados que atuem diretamente na produção primária de origem animal ou vegetal. PRESTADOR DE MÃO-DE-OBRA RURAL legalmente constituído como pessoa jurídica. PRODUTOR RURAL PESSOA JURÍDICA na prestação de serviços rurais (atividade não autônoma). AGROINDÚSTRIA (nos termos da Lei 10.256/2001) na prestação de serviços rurais ou agroindustriais a terceiros. PRODUTOR RURAL PESSOA JURÍDICA que exerce outra atividade econômica autônoma, somente em relação aos empregados que atuem diretamente na produção primária de origem animal ou vegetal. PRODUTOR RURAL PESSOA FÍSICA, contribuinte individual (empregador) e PRODUTOR RURAL PESSOA JURÍDICA, com recolhimento sobre a folha de salários. SOCIEDADE COOPERATIVA DE CRÉDITO, conforme art. 10 da Lei 11.524/2007.',4099),
('795','GERAL','ESTABELECIMENTOS RURAL E INDUSTRIAL DA SOCIEDADE COOPERATIVA relacionada no art. 2°, caput , do Decreto-Lei 1.146/1970.',4099),
('825','GERAL','AGROINDÚSTRIA relacionada no caput do art. 2º do Decreto-Lei 1.146/1970, a partir da competência 11/2001. TOMADOR DE SERVIÇO DE TRABALHADOR AVULSO - contribuição sobre a remuneração de trabalhador avulso vinculado à agroindústria relacionada no caput do art. 2º do Decreto-Lei 1.146/1970. Exclui-se deste código a prestação de serviços a terceiros, nos termos da Lei 10.256/2001.',3),
('833','EMPRESAS','SETOR INDUSTRIAL DA AGROINDÚSTRIA não relacionada no caput do art. 2º do Decreto-Lei 1.146/1970, a partir da competência 11/2001, exceto as agroindústrias de piscicultura, carcinicultura, suinocultura e avicultura, inclusive sob a forma de cooperativa. SETOR INDUSTRIAL DA AGROINDÚSTRIA de florestamento e reflorestamento quando aplicável a substituição, na forma do art. 22-A da Lei 8.212/1991. TOMADOR DE SERVIÇO DE TRABALHADOR AVULSO - contribuição sobre a remuneração de trabalhador avulso vinculado à agroindústria não relacionada no caput do art. 2º do Decreto-Lei 1.146/1970. Exclui-se deste código a prestação de serviços a terceiros.',79),
('833','COOPERATIVAS','SETOR INDUSTRIAL DA AGROINDÚSTRIA não relacionada no caput do art. 2º do Decreto-Lei 1.146/1970, a partir da competência 11/2001, exceto as agroindústrias de piscicultura, carcinicultura, suinocultura e avicultura, inclusive sob a forma de cooperativa. SETOR INDUSTRIAL DA AGROINDÚSTRIA de florestamento e reflorestamento quando aplicável a substituição, na forma do art. 22-A da Lei 8.212/1991. TOMADOR DE SERVIÇO DE TRABALHADOR AVULSO - contribuição sobre a remuneração de trabalhador avulso vinculado à agroindústria não relacionada no caput do art. 2º do Decreto-Lei 1.146/1970. Exclui-se deste código a prestação de serviços a terceiros.',4163),
('868','GERAL','EMPREGADOR DOMÉSTICO - instituído para possibilitar o depósito do FGTS.',0),
('876','GERAL','MISSÕES DIPLOMÁTICAS E OUTROS ORGANISMOS A ELAS EQUIPARADOS, INCLUSIVE SEUS MEMBROS, que sejam partícipes de acordo internacional de isenção reconhecido pelo Brasil.',0)
on conflict (fpas, grupo) do update set descricao=excluded.descricao, terceiros_total=excluded.terceiros_total;
insert into public.esocial_tab10_tipo_lotacao (codigo, descricao, preenchimento_nr_insc) values
('01','Classificação da atividade econômica exercida pela Pessoa Jurídica para fins de atribuição de código FPAS, inclusive obras de construção civil própria, exceto: a) empreitada parcial ou sub-empreitada de obra de construção civil (utilizar opção 02); b) prestação de serviços em instalações de terceiros (utilizar opções 03 a 09); c) Embarcação inscrita no Registro Especial Brasileiro - REB (utilizar opção 10)','Não preencher'),
('02','Obra de construção civil - Empreitada parcial ou subempreitada','CNO da obra - A informação do CNPJ/CPF do contratante é prestada no grupo {infoEmprParcial}'),
('03','Pessoa Física tomadora de serviços prestados mediante cessão de mão de obra, exceto contratante de cooperativa','CPF do contratante'),
('04','Pessoa Jurídica tomadora de serviços prestados mediante cessão de mão de obra, exceto contratante de cooperativa, nos termos da Lei 8.212/1991','CNPJ do estabelecimento contratante'),
('05','Pessoa Jurídica tomadora de serviços prestados por cooperados por intermédio de cooperativa de trabalho, exceto aqueles prestados a entidade beneficente/isenta','CNPJ do estabelecimento contratante'),
('06','Entidade beneficente/isenta tomadora de serviços prestados por cooperados por intermédio de cooperativa de trabalho','CNPJ do estabelecimento contratante'),
('07','Pessoa Física tomadora de serviços prestados por cooperados por intermédio de cooperativa de trabalho','CPF do contratante'),
('08','Operador portuário tomador de serviços de trabalhadores avulsos','CNPJ do operador portuário'),
('09','Contratante de trabalhadores avulsos não portuários por intermédio de sindicato','CNPJ ou CPF do contratante'),
('10','Embarcação inscrita no Registro Especial Brasileiro - REB','Não preencher'),
('21','Classificação da atividade econômica ou obra própria de construção civil da Pessoa Física','Não preencher'),
('24','Empregador doméstico','Não preencher'),
('90','Atividades desenvolvidas no exterior por trabalhador vinculado ao Regime Geral de Previdência Social (expatriados)','Não preencher'),
('91','Atividades desenvolvidas por trabalhador estrangeiro vinculado a Regime de Previdência Social no exterior','Não preencher'),
('92','Bolsista contribuinte individual sem contribuição patronal','Não preencher')
on conflict (codigo) do update set descricao=excluded.descricao, preenchimento_nr_insc=excluded.preenchimento_nr_insc;
insert into public.esocial_tab12_lotacao_class_trib (tp_lotacao, class_trib, permitido) values
('01','01',true),
('01','02',true),
('01','03',true),
('01','04',true),
('01','06',true),
('01','07',true),
('01','09',true),
('01','10',true),
('01','11',true),
('01','13',true),
('01','14',true),
('01','21',false),
('01','22',false),
('01','60',true),
('01','70',true),
('01','80',true),
('01','85',true),
('01','99',true),
('02','01',true),
('02','02',true),
('02','03',true),
('02','04',true),
('02','06',true),
('02','07',true),
('02','09',true),
('02','10',true),
('02','11',true),
('02','13',true),
('02','14',true),
('02','21',false),
('02','22',false),
('02','60',true),
('02','70',true),
('02','80',true),
('02','85',true),
('02','99',true),
('03','01',true),
('03','02',true),
('03','03',true),
('03','04',false),
('03','06',true),
('03','07',false),
('03','09',false),
('03','10',false),
('03','11',false),
('03','13',false),
('03','14',false),
('03','21',false),
('03','22',false),
('03','60',false),
('03','70',false),
('03','80',true),
('03','85',false),
('03','99',true),
('04','01',true),
('04','02',true),
('04','03',true),
('04','04',false),
('04','06',true),
('04','07',false),
('04','09',false),
('04','10',false),
('04','11',false),
('04','13',false),
('04','14',false),
('04','21',false),
('04','22',false),
('04','60',false),
('04','70',true),
('04','80',true),
('04','85',false),
('04','99',true),
('05','01',true),
('05','02',true),
('05','03',true),
('05','04',false),
('05','06',true),
('05','07',true),
('05','09',false),
('05','10',true),
('05','11',false),
('05','13',false),
('05','14',true),
('05','21',false),
('05','22',false),
('05','60',false),
('05','70',true),
('05','80',true),
('05','85',true),
('05','99',true),
('06','01',false),
('06','02',false),
('06','03',false),
('06','04',false),
('06','06',false),
('06','07',false),
('06','09',false),
('06','10',false),
('06','11',false),
('06','13',false),
('06','14',false),
('06','21',false),
('06','22',false),
('06','60',false),
('06','70',false),
('06','80',false),
('06','85',false),
('06','99',true),
('07','01',false),
('07','02',false),
('07','03',false),
('07','04',false),
('07','06',false),
('07','07',false),
('07','09',false),
('07','10',false),
('07','11',false),
('07','13',false),
('07','14',false),
('07','21',false),
('07','22',false),
('07','60',false),
('07','70',false),
('07','80',false),
('07','85',false),
('07','99',true),
('08','01',false),
('08','02',false),
('08','03',false),
('08','04',false),
('08','06',false),
('08','07',false),
('08','09',true),
('08','10',false),
('08','11',false),
('08','13',false),
('08','14',false),
('08','21',false),
('08','22',false),
('08','60',false),
('08','70',false),
('08','80',false),
('08','85',false),
('08','99',false),
('09','01',false),
('09','02',false),
('09','03',false),
('09','04',false),
('09','06',false),
('09','07',false),
('09','09',false),
('09','10',true),
('09','11',false),
('09','13',false),
('09','14',false),
('09','21',false),
('09','22',false),
('09','60',false),
('09','70',false),
('09','80',false),
('09','85',false),
('09','99',false),
('10','01',true),
('10','02',true),
('10','03',true),
('10','04',true),
('10','06',true),
('10','07',true),
('10','09',true),
('10','10',true),
('10','11',true),
('10','13',true),
('10','14',false),
('10','21',false),
('10','22',false),
('10','60',false),
('10','70',true),
('10','80',true),
('10','85',true),
('10','99',true),
('21','01',false),
('21','02',false),
('21','03',false),
('21','04',false),
('21','06',false),
('21','07',false),
('21','09',false),
('21','10',false),
('21','11',false),
('21','13',false),
('21','14',false),
('21','21',true),
('21','22',true),
('21','60',false),
('21','70',false),
('21','80',false),
('21','85',false),
('21','99',false),
('24','01',false),
('24','02',false),
('24','03',false),
('24','04',false),
('24','06',false),
('24','07',false),
('24','09',false),
('24','10',false),
('24','11',false),
('24','13',false),
('24','14',false),
('24','21',true),
('24','22',true),
('24','60',false),
('24','70',false),
('24','80',false),
('24','85',false),
('24','99',false),
('90','01',true),
('90','02',true),
('90','03',true),
('90','04',false),
('90','06',true),
('90','07',true),
('90','09',true),
('90','10',true),
('90','11',true),
('90','13',true),
('90','14',true),
('90','21',false),
('90','22',false),
('90','60',true),
('90','70',true),
('90','80',true),
('90','85',true),
('90','99',true),
('91','01',true),
('91','02',true),
('91','03',true),
('91','04',false),
('91','06',true),
('91','07',true),
('91','09',true),
('91','10',true),
('91','11',true),
('91','13',true),
('91','14',true),
('91','21',false),
('91','22',false),
('91','60',true),
('91','70',true),
('91','80',true),
('91','85',true),
('91','99',true),
('92','01',true),
('92','02',true),
('92','03',true),
('92','04',true),
('92','06',true),
('92','07',true),
('92','09',true),
('92','10',true),
('92','11',true),
('92','13',true),
('92','14',true),
('92','21',false),
('92','22',false),
('92','60',true),
('92','70',true),
('92','80',true),
('92','85',true),
('92','99',true)
on conflict (tp_lotacao, class_trib) do update set permitido=excluded.permitido;
-- ═════ FIM BLOCO 2 ═════

-- ═════ BLOCO 3 — conferência genérica "a referência é da MESMA Empresa" (reaproveitada por várias tabelas) ═════
-- Uso: trigger ... execute function rh_confere_mesma_empresa('tabela_referida', 'coluna_desta_tabela')
create or replace function public.rh_confere_mesma_empresa()
returns trigger language plpgsql set search_path to 'public' as $$
declare ref_id uuid; ok boolean;
begin
  ref_id := (to_jsonb(new) ->> tg_argv[1])::uuid;
  if ref_id is null then return new; end if;
  execute format('select exists (select 1 from public.%I where id = $1 and empresa_id = $2)', tg_argv[0])
    into ok using ref_id, new.empresa_id;
  if not ok then
    raise exception '% escolhido não é desta Empresa', tg_argv[1] using errcode = '23514';
  end if;
  return new;
end $$;
-- ═════ FIM BLOCO 3 ═════

-- ═════ BLOCO 4 — lotações tributárias (S-1020). Mudança = nova linha com nova validade. ═════
create table if not exists public.rh_lotacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 120),     -- só do Axioma
  cod_lotacao text not null check (char_length(cod_lotacao) between 1 and 30 and cod_lotacao !~* '^esocial'),
  ini_valid text not null check (ini_valid ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  fim_valid text check (fim_valid ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  tp_lotacao text not null references public.esocial_tab10_tipo_lotacao(codigo),
  tp_insc smallint check (tp_insc in (1,2,4)),
  nr_insc text check (nr_insc ~ '^[0-9]{11,14}$'),
  fpas text not null check (fpas ~ '^[0-9]{3}$'),
  cod_tercs text not null check (cod_tercs ~ '^[0-9]{4}$'),
  -- infoEmprParcial (obra em empreitada parcial — tipo 02)
  contrat_tp_insc smallint check (contrat_tp_insc in (1,2)),
  contrat_nr_insc text,
  prop_tp_insc smallint check (prop_tp_insc in (1,2)),
  prop_nr_insc text,
  -- dadosOpPort (operador portuário — tipo 08)
  op_port_aliq_rat smallint check (op_port_aliq_rat in (1,2,3)),
  op_port_fap numeric(5,4) check (op_port_fap between 0.5 and 2.0),
  situacao_esocial text not null default 'rascunho'
    check (situacao_esocial in ('rascunho','preparado','enviado','aceito','recusado','enviado_pelo_contador')),
  recibo_esocial text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint rh_lot_periodo unique (empresa_id, cod_lotacao, ini_valid),
  constraint rh_lot_fim_depois check (fim_valid is null or fim_valid >= ini_valid),
  -- Tabela 10: quais tipos levam inscrição, e de que espécie
  constraint rh_lot_insc check (
    (tp_lotacao in ('01','10','21','24','90','91','92') and tp_insc is null and nr_insc is null)
    or (tp_lotacao = '02' and tp_insc = 4 and char_length(nr_insc) = 12)
    or (tp_lotacao in ('03','07') and tp_insc = 2 and public.rh_cpf_valido(nr_insc))
    or (tp_lotacao in ('04','05','06','08') and tp_insc = 1 and public.rh_cnpj_valido(nr_insc))
    or (tp_lotacao = '09' and ((tp_insc = 1 and public.rh_cnpj_valido(nr_insc)) or (tp_insc = 2 and public.rh_cpf_valido(nr_insc))))),
  constraint rh_lot_parcial check (
    (contrat_tp_insc is null and contrat_nr_insc is null and prop_tp_insc is null and prop_nr_insc is null)
    or (tp_lotacao = '02' and contrat_tp_insc is not null
        and ((contrat_tp_insc = 1 and public.rh_cnpj_valido(contrat_nr_insc)) or (contrat_tp_insc = 2 and public.rh_cpf_valido(contrat_nr_insc)))
        and (prop_tp_insc is null) = (prop_nr_insc is null)
        and (prop_tp_insc is null or (prop_tp_insc = 1 and public.rh_cnpj_valido(prop_nr_insc)) or (prop_tp_insc = 2 and public.rh_cpf_valido(prop_nr_insc))))),
  constraint rh_lot_parcial_obrigatorio check (tp_lotacao <> '02' or contrat_tp_insc is not null),
  constraint rh_lot_op_port check ((op_port_aliq_rat is null and op_port_fap is null)
    or (tp_lotacao = '08' and op_port_aliq_rat is not null and op_port_fap is not null))
);
create index if not exists rh_lot_empresa on public.rh_lotacoes (empresa_id, cod_lotacao);

-- Regras que olham para o empregador (S-1000) e para as Tabelas 04 e 12
create or replace function public.rh_lotacao_confere()
returns trigger language plpgsql set search_path to 'public' as $$
declare classe text; tercs int := new.cod_tercs::int;
begin
  select class_trib into classe from public.rh_empregador
   where empresa_id = new.empresa_id and ini_valid <= new.ini_valid and (fim_valid is null or fim_valid >= new.ini_valid)
   order by ini_valid desc limit 1;
  if classe is null then
    raise exception 'Cadastre primeiro os dados do empregador (S-1000) válidos em %', new.ini_valid using errcode = '23514';
  end if;
  if not coalesce((select permitido from public.esocial_tab12_lotacao_class_trib
                   where tp_lotacao = new.tp_lotacao and class_trib = classe), false) then
    raise exception 'Tipo de lotação % não é permitido para a classificação tributária % (Tabela 12)', new.tp_lotacao, classe using errcode = '23514';
  end if;
  if not exists (select 1 from public.esocial_tab04_fpas where fpas = new.fpas) then
    raise exception 'FPAS % não existe na Tabela 04', new.fpas using errcode = '23514';
  end if;
  if classe in ('01','02','03','04') then
    if new.cod_tercs <> '0000' then
      raise exception 'Empresa do Simples/MEI (classificação %) informa Terceiros 0000', classe using errcode = '23514';
    end if;
  elsif not exists (select 1 from public.esocial_tab04_fpas where fpas = new.fpas and (tercs & ~terceiros_total) = 0) then
    raise exception 'Código de Terceiros % não cabe no FPAS % (Tabela 04)', new.cod_tercs, new.fpas using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_lotacao_confere on public.rh_lotacoes;
create trigger rh_lotacao_confere before insert or update on public.rh_lotacoes
  for each row execute function public.rh_lotacao_confere();

alter table public.rh_lotacoes enable row level security;
drop policy if exists rh_lot_le on public.rh_lotacoes;
create policy rh_lot_le on public.rh_lotacoes for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists rh_lot_insere on public.rh_lotacoes;
create policy rh_lot_insere on public.rh_lotacoes for insert to authenticated with check (public.rh_pode(empresa_id, 'editar'));
drop policy if exists rh_lot_altera on public.rh_lotacoes;
create policy rh_lot_altera on public.rh_lotacoes for update to authenticated
  using (public.rh_pode(empresa_id, 'editar')) with check (public.rh_pode(empresa_id, 'editar'));
drop policy if exists rh_lot_apaga on public.rh_lotacoes;
create policy rh_lot_apaga on public.rh_lotacoes for delete to authenticated
  using (public.rh_pode(empresa_id, 'editar') and situacao_esocial = 'rascunho');
-- ═════ FIM BLOCO 4 ═════

-- ═════ BLOCO 5 — departamentos (árvore: departamento pode ter um departamento "pai") ═════
create table if not exists public.rh_departamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 120),
  codigo text check (char_length(codigo) <= 30),
  pai_id uuid references public.rh_departamentos(id) on delete restrict,
  centro_custo_id uuid references public.centros_custo(id) on delete set null,
  estabelecimento_id uuid references public.rh_estabelecimentos(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint rh_dep_nome unique (empresa_id, nome),
  constraint rh_dep_nao_pai_de_si check (pai_id is null or pai_id <> id)
);
create index if not exists rh_dep_pai on public.rh_departamentos (empresa_id, pai_id);
drop trigger if exists rh_dep_pai_empresa on public.rh_departamentos;
create trigger rh_dep_pai_empresa before insert or update of pai_id, empresa_id on public.rh_departamentos
  for each row execute function public.rh_confere_mesma_empresa('rh_departamentos', 'pai_id');
drop trigger if exists rh_dep_cc_empresa on public.rh_departamentos;
create trigger rh_dep_cc_empresa before insert or update of centro_custo_id, empresa_id on public.rh_departamentos
  for each row execute function public.rh_confere_mesma_empresa('centros_custo', 'centro_custo_id');
drop trigger if exists rh_dep_estab_empresa on public.rh_departamentos;
create trigger rh_dep_estab_empresa before insert or update of estabelecimento_id, empresa_id on public.rh_departamentos
  for each row execute function public.rh_confere_mesma_empresa('rh_estabelecimentos', 'estabelecimento_id');
-- Sem ciclo: um departamento não pode ficar "dentro" de um descendente dele
create or replace function public.rh_dep_sem_ciclo()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.pai_id is not null and exists (
    with recursive sobe(id, pai_id) as (
      select id, pai_id from public.rh_departamentos where id = new.pai_id
      union all
      select d.id, d.pai_id from public.rh_departamentos d join sobe s on d.id = s.pai_id
    ) select 1 from sobe where id = new.id) then
    raise exception 'Departamento não pode ficar dentro de um subdepartamento dele mesmo' using errcode = '23514';
  end if;
  return new;
end $$;
drop trigger if exists rh_dep_sem_ciclo on public.rh_departamentos;
create trigger rh_dep_sem_ciclo before update of pai_id on public.rh_departamentos
  for each row execute function public.rh_dep_sem_ciclo();
alter table public.rh_departamentos enable row level security;
drop policy if exists rh_dep_le on public.rh_departamentos;
create policy rh_dep_le on public.rh_departamentos for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists rh_dep_grava on public.rh_departamentos;
create policy rh_dep_grava on public.rh_departamentos for all to authenticated
  using (public.rh_pode(empresa_id, 'editar')) with check (public.rh_pode(empresa_id, 'editar'));
-- ═════ FIM BLOCO 5 ═════

-- ═════ BLOCO 6 — cargos (com CBO e competências exigidas) ═════
-- competencias: lista JSON de {"nome": "...", "tipo": "tecnica"|"comportamental", "obrigatoria": true|false, "nivel": 1..5}
-- É o que o recrutamento e a análise de lacunas de competências vão usar.
create table if not exists public.rh_cargos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 120),
  cbo text not null check (cbo ~ '^[0-9]{6}$'),
  departamento_id uuid references public.rh_departamentos(id) on delete set null,
  descricao text check (char_length(descricao) <= 4000),
  requisitos text check (char_length(requisitos) <= 4000),          -- formação, experiência, registro profissional
  competencias jsonb not null default '[]'::jsonb check (jsonb_typeof(competencias) = 'array'),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint rh_cargo_nome unique (empresa_id, nome)
);
create index if not exists rh_cargo_cbo on public.rh_cargos (empresa_id, cbo);
-- cada competência precisa ter nome, tipo válido, "obrigatoria" sim/não e nível 1–5 (se informado)
create or replace function public.rh_cargo_confere_competencias()
returns trigger language plpgsql set search_path to 'public' as $$
declare c jsonb;
begin
  for c in select jsonb_array_elements(new.competencias) loop
    if jsonb_typeof(c) <> 'object'
       or coalesce(btrim(c->>'nome'), '') = ''
       or coalesce(c->>'tipo', '') not in ('tecnica','comportamental')
       or jsonb_typeof(c->'obrigatoria') is distinct from 'boolean'
       or (c ? 'nivel' and (jsonb_typeof(c->'nivel') <> 'number' or (c->>'nivel')::numeric not in (1,2,3,4,5))) then
      raise exception 'Competência inválida: %', c using errcode = '23514';
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists rh_cargo_confere_competencias on public.rh_cargos;
create trigger rh_cargo_confere_competencias before insert or update of competencias on public.rh_cargos
  for each row execute function public.rh_cargo_confere_competencias();
drop trigger if exists rh_cargo_dep_empresa on public.rh_cargos;
create trigger rh_cargo_dep_empresa before insert or update of departamento_id, empresa_id on public.rh_cargos
  for each row execute function public.rh_confere_mesma_empresa('rh_departamentos', 'departamento_id');
alter table public.rh_cargos enable row level security;
drop policy if exists rh_cargo_le on public.rh_cargos;
create policy rh_cargo_le on public.rh_cargos for select to authenticated using (public.rh_pode(empresa_id, 'ver'));
drop policy if exists rh_cargo_grava on public.rh_cargos;
create policy rh_cargo_grava on public.rh_cargos for all to authenticated
  using (public.rh_pode(empresa_id, 'editar')) with check (public.rh_pode(empresa_id, 'editar'));
-- ═════ FIM BLOCO 6 ═════
