-- RH-13 — Lista oficial da CBO (Ministério do Trabalho, arquivo "Estrutura CBO (CSV)", baixado em 08/11/2026
-- de cbo.mte.gov.br/cbosite/pages/downloads.jsf; arquivos de 10/07/2026). Só leitura para quem está logado.
-- 2.725 ocupações + 7.870 sinônimos. Coluna "busca" = título em minúsculas e sem acento (para achar "escritorio").

-- ═════ BLOCO 1 — tabelas ═════
create table if not exists public.cbo_ocupacoes (
  codigo text primary key check (codigo ~ '^[0-9]{6}$'),
  titulo text not null,
  familia text not null,
  busca text not null
);
create table if not exists public.cbo_sinonimos (
  codigo text not null references public.cbo_ocupacoes(codigo),
  titulo text not null,
  busca text not null,
  primary key (codigo, titulo)
);
create index if not exists cbo_ocupacoes_busca on public.cbo_ocupacoes using gin (busca gin_trgm_ops);
create index if not exists cbo_sinonimos_busca on public.cbo_sinonimos using gin (busca gin_trgm_ops);
alter table public.cbo_ocupacoes enable row level security;
alter table public.cbo_sinonimos enable row level security;
drop policy if exists le on public.cbo_ocupacoes;
create policy le on public.cbo_ocupacoes for select to authenticated using (true);
drop policy if exists le on public.cbo_sinonimos;
create policy le on public.cbo_sinonimos for select to authenticated using (true);

-- ═════ BLOCO 2 — dados oficiais ═════
insert into public.cbo_ocupacoes (codigo, titulo, familia, busca)
select split_part(l, '|', 1), split_part(l, '|', 2), split_part(l, '|', 3), split_part(l, '|', 4)
from unnest(string_to_array($cbo$010105|Oficial general da aeronáutica|Oficiais generais das forças armadas|oficial general da aeronautica
010110|Oficial general do exército|Oficiais generais das forças armadas|oficial general do exercito
010115|Oficial general da marinha|Oficiais generais das forças armadas|oficial general da marinha
010205|Oficial da aeronáutica|Oficiais das forças armadas|oficial da aeronautica
010210|Oficial do exército|Oficiais das forças armadas|oficial do exercito
010215|Oficial da marinha|Oficiais das forças armadas|oficial da marinha
010305|Praça da aeronáutica|Praças das forças armadas|praca da aeronautica
010310|Praça do exército|Praças das forças armadas|praca do exercito
010315|Praça da marinha|Praças das forças armadas|praca da marinha
020105|Coronel da polícia militar|Oficiais superiores da polícia militar|coronel da policia militar
020110|Tenente-coronel da polícia militar|Oficiais superiores da polícia militar|tenente-coronel da policia militar
020115|Major da polícia militar|Oficiais superiores da polícia militar|major da policia militar
020205|Capitão da polícia militar|Capitães da  polícia militar|capitao da policia militar
020305|Primeiro tenente de polícia militar|Tenentes da polícia militar|primeiro tenente de policia militar
020310|Segundo tenente de polícia militar|Tenentes da polícia militar|segundo tenente de policia militar
021105|Subtenente da policia militar|Subtenentes e sargentos da policia militar|subtenente da policia militar
021110|Sargento da policia militar|Subtenentes e sargentos da policia militar|sargento da policia militar
021205|Cabo da polícia militar|Cabos e soldados da polícia militar|cabo da policia militar
021210|Soldado da polícia militar|Cabos e soldados da polícia militar|soldado da policia militar
030105|Coronel bombeiro militar|Oficiais superiores do corpo de bombeiros militar|coronel bombeiro militar
030110|Major bombeiro militar|Oficiais superiores do corpo de bombeiros militar|major bombeiro militar
030115|Tenente-coronel bombeiro militar|Oficiais superiores do corpo de bombeiros militar|tenente-coronel bombeiro militar
030205|Capitão bombeiro militar|Oficiais intermediários do corpo de bombeiros militar|capitao bombeiro militar
030305|Tenente do corpo de bombeiros militar|Tenentes do corpo de bombeiros militar|tenente do corpo de bombeiros militar
031105|Subtenente bombeiro militar|Subtenentes e sargentos do corpo de bombeiros militar|subtenente bombeiro militar
031110|Sargento bombeiro militar|Subtenentes e sargentos do corpo de bombeiros militar|sargento bombeiro militar
031205|Cabo bombeiro militar|Cabos e soldados do corpo de bombeiros militar|cabo bombeiro militar
031210|Soldado bombeiro militar|Cabos e soldados do corpo de bombeiros militar|soldado bombeiro militar
111105|Senador|Legisladores|senador
111110|Deputado federal|Legisladores|deputado federal
111115|Deputado estadual e distrital|Legisladores|deputado estadual e distrital
111120|Vereador|Legisladores|vereador
111205|Presidente da república|Dirigentes gerais da administração pública|presidente da republica
111210|Vice-presidente da república|Dirigentes gerais da administração pública|vice-presidente da republica
111215|Ministro de estado|Dirigentes gerais da administração pública|ministro de estado
111220|Secretário - executivo|Dirigentes gerais da administração pública|secretario - executivo
111225|Membro superior do poder executivo|Dirigentes gerais da administração pública|membro superior do poder executivo
111230|Governador de estado|Dirigentes gerais da administração pública|governador de estado
111235|Governador do distrito federal|Dirigentes gerais da administração pública|governador do distrito federal
111240|Vice-governador de estado|Dirigentes gerais da administração pública|vice-governador de estado
111245|Vice-governador do distrito federal|Dirigentes gerais da administração pública|vice-governador do distrito federal
111250|Prefeito|Dirigentes gerais da administração pública|prefeito
111255|Vice-prefeito|Dirigentes gerais da administração pública|vice-prefeito
111305|Ministro do supremo tribunal federal|Magistrados|ministro do supremo tribunal federal
111310|Ministro do superior tribunal de justiça|Magistrados|ministro do superior tribunal de justica
111315|Ministro do  superior tribunal militar|Magistrados|ministro do  superior tribunal militar
111320|Ministro do  superior tribunal do trabalho|Magistrados|ministro do  superior tribunal do trabalho
111325|Juiz de direito|Magistrados|juiz de direito
111330|Juiz federal|Magistrados|juiz federal
111335|Juiz auditor federal - justiça militar|Magistrados|juiz auditor federal - justica militar
111340|Juiz auditor estadual - justiça militar|Magistrados|juiz auditor estadual - justica militar
111345|Juiz do trabalho|Magistrados|juiz do trabalho
111405|Dirigente do serviço público federal|Dirigentes do serviço público|dirigente do servico publico federal
111410|Dirigente do serviço público estadual e distrital|Dirigentes do serviço público|dirigente do servico publico estadual e distrital
111415|Dirigente do serviço público municipal|Dirigentes do serviço público|dirigente do servico publico municipal
111505|Especialista de políticas públicas e gestão governamental - eppgg|Gestores públicos|especialista de politicas publicas e gestao governamental - eppgg
111510|Analista de planejamento e orçamento - apo|Gestores públicos|analista de planejamento e orcamento - apo
113005|Cacique|Dirigentes de povos indígenas, de quilombolas e caiçaras|cacique
113010|Líder de comunidade caiçara|Dirigentes de povos indígenas, de quilombolas e caiçaras|lider de comunidade caicara
113015|Membro de liderança quilombola|Dirigentes de povos indígenas, de quilombolas e caiçaras|membro de lideranca quilombola
114105|Dirigente de partido político|Dirigentes de partidos políticos|dirigente de partido politico
114205|Dirigente de entidade de trabalhadores|Dirigentes e administradores de entidades patronais e dos trabalhadores e de outros interesses sócioeconômicos|dirigente de entidade de trabalhadores
114210|Dirigente de entidade patronal|Dirigentes e administradores de entidades patronais e dos trabalhadores e de outros interesses sócioeconômicos|dirigente de entidade patronal
114305|Dirigente e administrador de organização religiosa|Dirigentes e administradores de entidades religiosas|dirigente e administrador de organizacao religiosa
114405|Dirigente e administrador de organização da sociedade civil sem fins lucrativos|Dirigentes e administradores de organizações da sociedade civil sem fins lucrativos|dirigente e administrador de organizacao da sociedade civil sem fins lucrativos
121005|Diretor de planejamento estratégico|Diretores gerais|diretor de planejamento estrategico
121010|Diretor geral de empresa e organizações (exceto do terceiro setor)|Diretores gerais|diretor geral de empresa e organizacoes (exceto do terceiro setor)
122105|Diretor de produção e operações em empresa agropecuária|Diretores de produção e operações em empresa agropecuária, pesqueira , aqüícola e florestal|diretor de producao e operacoes em empresa agropecuaria
122110|Diretor de produção e operações em empresa aquícola|Diretores de produção e operações em empresa agropecuária, pesqueira , aqüícola e florestal|diretor de producao e operacoes em empresa aquicola
122115|Diretor de produção e operações em empresa florestal|Diretores de produção e operações em empresa agropecuária, pesqueira , aqüícola e florestal|diretor de producao e operacoes em empresa florestal
122120|Diretor de produção e operações em empresa pesqueira|Diretores de produção e operações em empresa agropecuária, pesqueira , aqüícola e florestal|diretor de producao e operacoes em empresa pesqueira
122205|Diretor de produção e operações da indústria de transformação, extração mineral e utilidades|Diretores de produção e operações em empresa da indústria extrativa, transformação e de serviços de utilidade pública|diretor de producao e operacoes da industria de transformacao, extracao mineral e utilidades
122305|Diretor de operações de obras pública e civil|Diretores de operações de obras em empresa de construção|diretor de operacoes de obras publica e civil
122405|Diretor de operações comerciais (comércio atacadista e varejista)|Diretores de operações em empresa do comércio|diretor de operacoes comerciais (comercio atacadista e varejista)
122505|Diretor de  produção e operações de alimentação|Diretores de serviços de turismo, de alojamento e de alimentação|diretor de  producao e operacoes de alimentacao
122510|Diretor de  produção e operações de hotel|Diretores de serviços de turismo, de alojamento e de alimentação|diretor de  producao e operacoes de hotel
122515|Diretor de  produção e operações de turismo|Diretores de serviços de turismo, de alojamento e de alimentação|diretor de  producao e operacoes de turismo
122520|Turismólogo|Diretores de serviços de turismo, de alojamento e de alimentação|turismologo
122605|Diretor de operações de correios|Diretores de operações de serviços em empresa de armazenamento, de transporte e de telecomunicação|diretor de operacoes de correios
122610|Diretor de operações de serviços de armazenamento|Diretores de operações de serviços em empresa de armazenamento, de transporte e de telecomunicação|diretor de operacoes de servicos de armazenamento
122615|Diretor de operações de serviços de telecomunicações|Diretores de operações de serviços em empresa de armazenamento, de transporte e de telecomunicação|diretor de operacoes de servicos de telecomunicacoes
122620|Diretor de operações de serviços de transporte|Diretores de operações de serviços em empresa de armazenamento, de transporte e de telecomunicação|diretor de operacoes de servicos de transporte
122705|Diretor comercial em operações de intermediação financeira|Diretores de operações de serviços em instituição de intermediação financeira|diretor comercial em operacoes de intermediacao financeira
122710|Diretor de produtos bancários|Diretores de operações de serviços em instituição de intermediação financeira|diretor de produtos bancarios
122715|Diretor de crédito rural|Diretores de operações de serviços em instituição de intermediação financeira|diretor de credito rural
122720|Diretor de câmbio e comércio exterior|Diretores de operações de serviços em instituição de intermediação financeira|diretor de cambio e comercio exterior
122725|Diretor de compliance|Diretores de operações de serviços em instituição de intermediação financeira|diretor de compliance
122730|Diretor de crédito (exceto crédito imobiliário)|Diretores de operações de serviços em instituição de intermediação financeira|diretor de credito (exceto credito imobiliario)
122735|Diretor de crédito imobiliário|Diretores de operações de serviços em instituição de intermediação financeira|diretor de credito imobiliario
122740|Diretor de leasing|Diretores de operações de serviços em instituição de intermediação financeira|diretor de leasing
122745|Diretor de mercado de capitais|Diretores de operações de serviços em instituição de intermediação financeira|diretor de mercado de capitais
122750|Diretor de recuperação de créditos em operações de intermediação financeira|Diretores de operações de serviços em instituição de intermediação financeira|diretor de recuperacao de creditos em operacoes de intermediacao financeira
122755|Diretor de riscos de mercado|Diretores de operações de serviços em instituição de intermediação financeira|diretor de riscos de mercado
123105|Diretor administrativo|Diretores administrativos e financeiros|diretor administrativo
123110|Diretor administrativo e financeiro|Diretores administrativos e financeiros|diretor administrativo e financeiro
123115|Diretor financeiro|Diretores administrativos e financeiros|diretor financeiro
123205|Diretor de recursos humanos|Diretores de recursos humanos e relações de trabalho|diretor de recursos humanos
123210|Diretor de relações de trabalho|Diretores de recursos humanos e relações de trabalho|diretor de relacoes de trabalho
123305|Diretor comercial|Diretores de comercialização e marketing|diretor comercial
123310|Diretor de marketing|Diretores de comercialização e marketing|diretor de marketing
123405|Diretor de suprimentos|Diretores de suprimentos e afins|diretor de suprimentos
123410|Diretor de suprimentos no serviço público|Diretores de suprimentos e afins|diretor de suprimentos no servico publico
123605|Diretor de tecnologia da informação|Diretores de tecnologia da informação|diretor de tecnologia da informacao
123705|Diretor de pesquisa, desenvolvimento e inovação - pdi|Diretores de pesquisa, desenvolvimento e inovação - pdi|diretor de pesquisa, desenvolvimento e inovacao - pdi
123805|Diretor de manutenção|Diretores de manutenção|diretor de manutencao
131105|Diretor de serviços culturais|Diretores e gerentes de operações em empresa de serviços pessoais, sociais e culturais|diretor de servicos culturais
131110|Diretor de serviços sociais|Diretores e gerentes de operações em empresa de serviços pessoais, sociais e culturais|diretor de servicos sociais
131115|Gerente de serviços culturais|Diretores e gerentes de operações em empresa de serviços pessoais, sociais e culturais|gerente de servicos culturais
131120|Gerente de serviços sociais|Diretores e gerentes de operações em empresa de serviços pessoais, sociais e culturais|gerente de servicos sociais
131205|Diretor de serviços de saúde|Gestores e especialistas de operações em empresas, secretarias e unidades de serviços de saúde|diretor de servicos de saude
131210|Gerente de serviços de saúde|Gestores e especialistas de operações em empresas, secretarias e unidades de serviços de saúde|gerente de servicos de saude
131215|Tecnólogo em gestão hospitalar|Gestores e especialistas de operações em empresas, secretarias e unidades de serviços de saúde|tecnologo em gestao hospitalar
131220|Gerontólogo|Gestores e especialistas de operações em empresas, secretarias e unidades de serviços de saúde|gerontologo
131225|Sanitarista|Gestores e especialistas de operações em empresas, secretarias e unidades de serviços de saúde|sanitarista
131305|Diretor de instituição educacional da área privada|Diretores e gerentes de instituição de serviços educacionais|diretor de instituicao educacional da area privada
131310|Diretor de instituição educacional pública|Diretores e gerentes de instituição de serviços educacionais|diretor de instituicao educacional publica
131315|Gerente de instituição educacional da área privada|Diretores e gerentes de instituição de serviços educacionais|gerente de instituicao educacional da area privada
131320|Gerente de serviços educacionais da área pública|Diretores e gerentes de instituição de serviços educacionais|gerente de servicos educacionais da area publica
141105|Gerente de produção e operações aquícolas|Gerentes de produção e operações em empresa agropecuária, pesqueira, aquícola e florestal|gerente de producao e operacoes aquicolas
141110|Gerente de produção e operações  florestais|Gerentes de produção e operações em empresa agropecuária, pesqueira, aquícola e florestal|gerente de producao e operacoes  florestais
141115|Gerente de produção e operações agropecuárias|Gerentes de produção e operações em empresa agropecuária, pesqueira, aquícola e florestal|gerente de producao e operacoes agropecuarias
141120|Gerente de produção e operações pesqueiras|Gerentes de produção e operações em empresa agropecuária, pesqueira, aquícola e florestal|gerente de producao e operacoes pesqueiras
141205|Gerente de produção e operações|Gerentes de produção e operações em empresa da indústria extrativa, de transformação e de serviços de utilidade pública|gerente de producao e operacoes
141305|Gerente de produção e operações da construção civil e obras públicas|Gerentes de obras em empresa de construção|gerente de producao e operacoes da construcao civil e obras publicas
141405|Comerciante atacadista|Gerentes de operações comerciais e de assistência técnica|comerciante atacadista
141410|Comerciante varejista|Gerentes de operações comerciais e de assistência técnica|comerciante varejista
141415|Gerente de loja e supermercado|Gerentes de operações comerciais e de assistência técnica|gerente de loja e supermercado
141420|Gerente de operações de serviços de assistência técnica|Gerentes de operações comerciais e de assistência técnica|gerente de operacoes de servicos de assistencia tecnica
141505|Gerente de hotel|Gerentes de operações de serviços em empresa de turismo, de alojamento e alimentação|gerente de hotel
141510|Gerente de restaurante|Gerentes de operações de serviços em empresa de turismo, de alojamento e alimentação|gerente de restaurante
141515|Gerente de bar|Gerentes de operações de serviços em empresa de turismo, de alojamento e alimentação|gerente de bar
141520|Gerente de pensão|Gerentes de operações de serviços em empresa de turismo, de alojamento e alimentação|gerente de pensao
141525|Gerente de turismo|Gerentes de operações de serviços em empresa de turismo, de alojamento e alimentação|gerente de turismo
141605|Gerente de operações de transportes|Gerentes de operações de serviços em empresa de transporte, de comunicação e de logística (armazenagem e distribuição)|gerente de operacoes de transportes
141610|Gerente de operações de correios e telecomunicações|Gerentes de operações de serviços em empresa de transporte, de comunicação e de logística (armazenagem e distribuição)|gerente de operacoes de correios e telecomunicacoes
141615|Gerente de logística (armazenagem e distribuição)|Gerentes de operações de serviços em empresa de transporte, de comunicação e de logística (armazenagem e distribuição)|gerente de logistica (armazenagem e distribuicao)
141705|Gerente de produtos bancários|Gerentes de operações de serviços em instituição de intermediação financeira|gerente de produtos bancarios
141710|Gerente de agência bancária|Gerentes de operações de serviços em instituição de intermediação financeira|gerente de agencia bancaria
141715|Gerente de câmbio e comércio exterior|Gerentes de operações de serviços em instituição de intermediação financeira|gerente de cambio e comercio exterior
141720|Gerente de crédito e cobrança|Gerentes de operações de serviços em instituição de intermediação financeira|gerente de credito e cobranca
141725|Gerente de crédito imobiliário|Gerentes de operações de serviços em instituição de intermediação financeira|gerente de credito imobiliario
141730|Gerente de crédito rural|Gerentes de operações de serviços em instituição de intermediação financeira|gerente de credito rural
141735|Gerente de recuperação de crédito|Gerentes de operações de serviços em instituição de intermediação financeira|gerente de recuperacao de credito
141805|Gerente de administração em aeroportos|Gerentes operacionais da aviação civil|gerente de administracao em aeroportos
141810|Gerente de empresa aérea e empresa de serviços auxiliares ao transporte aéreo (esata) em aeroportos|Gerentes operacionais da aviação civil|gerente de empresa aerea e empresa de servicos auxiliares ao transporte aereo (esata) em aeroportos
141815|Gerente de operações em aeroportos|Gerentes operacionais da aviação civil|gerente de operacoes em aeroportos
141820|Gerente de operações de cargas|Gerentes operacionais da aviação civil|gerente de operacoes de cargas
141825|Gerente de segurança da aviação civil|Gerentes operacionais da aviação civil|gerente de seguranca da aviacao civil
141830|Gerente de segurança operacional (aviação civil)|Gerentes operacionais da aviação civil|gerente de seguranca operacional (aviacao civil)
142105|Gerente administrativo|Gerentes administrativos, financeiros, de riscos e afins|gerente administrativo
142110|Gerente de riscos|Gerentes administrativos, financeiros, de riscos e afins|gerente de riscos
142115|Gerente financeiro|Gerentes administrativos, financeiros, de riscos e afins|gerente financeiro
142120|Tecnólogo em gestão administrativo- financeira|Gerentes administrativos, financeiros, de riscos e afins|tecnologo em gestao administrativo- financeira
142125|Analista de compliance|Gerentes administrativos, financeiros, de riscos e afins|analista de compliance
142130|Analista de riscos|Gerentes administrativos, financeiros, de riscos e afins|analista de riscos
142135|Oficial de proteção de dados pessoais (dpo)|Gerentes administrativos, financeiros, de riscos e afins|oficial de protecao de dados pessoais (dpo)
142140|Profissional de facility management|Gerentes administrativos, financeiros, de riscos e afins|profissional de facility management
142205|Gerente de recursos humanos|Gerentes de recursos humanos e de relações do trabalho|gerente de recursos humanos
142210|Gerente de departamento pessoal|Gerentes de recursos humanos e de relações do trabalho|gerente de departamento pessoal
142305|Gerente comercial|Gerentes de comercialização, marketing e comunicação|gerente comercial
142310|Gerente de comunicação|Gerentes de comercialização, marketing e comunicação|gerente de comunicacao
142315|Gerente de marketing|Gerentes de comercialização, marketing e comunicação|gerente de marketing
142320|Gerente de vendas|Gerentes de comercialização, marketing e comunicação|gerente de vendas
142325|Relações públicas|Gerentes de comercialização, marketing e comunicação|relacoes publicas
142330|Analista de negócios|Gerentes de comercialização, marketing e comunicação|analista de negocios
142335|Analista de pesquisa de mercado|Gerentes de comercialização, marketing e comunicação|analista de pesquisa de mercado
142340|Ouvidor|Gerentes de comercialização, marketing e comunicação|ouvidor
142345|Profissional de relações institucionais e governamentais|Gerentes de comercialização, marketing e comunicação|profissional de relacoes institucionais e governamentais
142350|Profissonal de relações internacionais|Gerentes de comercialização, marketing e comunicação|profissonal de relacoes internacionais
142355|Analista de e-commerce|Gerentes de comercialização, marketing e comunicação|analista de e-commerce
142360|Analista de sucesso do cliente - customer success|Gerentes de comercialização, marketing e comunicação|analista de sucesso do cliente - customer success
142365|Analista de experiência do cliente - customer experience|Gerentes de comercialização, marketing e comunicação|analista de experiencia do cliente - customer experience
142405|Gerente de compras|Gerentes de suprimentos e afins|gerente de compras
142410|Gerente de cadeia de suprimentos|Gerentes de suprimentos e afins|gerente de cadeia de suprimentos
142415|Gerente de almoxarifado|Gerentes de suprimentos e afins|gerente de almoxarifado
142505|Gerente de infraestrutura de tecnologia da informação|Gerentes de tecnologia da informação|gerente de infraestrutura de tecnologia da informacao
142510|Gerente de desenvolvimento de sistemas|Gerentes de tecnologia da informação|gerente de desenvolvimento de sistemas
142515|Gerente de operação de tecnologia da informação|Gerentes de tecnologia da informação|gerente de operacao de tecnologia da informacao
142520|Gerente de projetos de tecnologia da informação|Gerentes de tecnologia da informação|gerente de projetos de tecnologia da informacao
142525|Gerente de segurança da informação|Gerentes de tecnologia da informação|gerente de seguranca da informacao
142530|Gerente de suporte técnico de tecnologia da informação|Gerentes de tecnologia da informação|gerente de suporte tecnico de tecnologia da informacao
142535|Tecnólogo em gestão da tecnologia da informação|Gerentes de tecnologia da informação|tecnologo em gestao da tecnologia da informacao
142605|Gerente de pesquisa, desenvolvimento e inovação (pdi)|Gerentes de pesquisa e desenvolvimento e afins|gerente de pesquisa, desenvolvimento e inovacao (pdi)
142610|Especialista em desenvolvimento de cigarros|Gerentes de pesquisa e desenvolvimento e afins|especialista em desenvolvimento de cigarros
142705|Gerente de projetos e serviços de manutenção|Gerentes de manutenção e afins|gerente de projetos e servicos de manutencao
142710|Tecnólogo em sistemas biomédicos|Gerentes de manutenção e afins|tecnologo em sistemas biomedicos
201105|Bioengenheiro|Profissionais da biotecnologia|bioengenheiro
201110|Biotecnologista|Profissionais da biotecnologia|biotecnologista
201115|Geneticista|Profissionais da biotecnologia|geneticista
201205|Pesquisador em metrologia|Profissionais da metrologia|pesquisador em metrologia
201210|Especialista em calibrações metrológicas|Profissionais da metrologia|especialista em calibracoes metrologicas
201215|Especialista em ensaios metrológicos|Profissionais da metrologia|especialista em ensaios metrologicos
201220|Especialista em instrumentação metrológica|Profissionais da metrologia|especialista em instrumentacao metrologica
201225|Especialista em materiais de referência metrológica|Profissionais da metrologia|especialista em materiais de referencia metrologica
202105|Engenheiro mecatrônico|Engenheiros de controle e automação, engenheiros mecatrônicos e afins|engenheiro mecatronico
202110|Engenheiro de controle e automação|Engenheiros de controle e automação, engenheiros mecatrônicos e afins|engenheiro de controle e automacao
202115|Tecnólogo em mecatrônica|Engenheiros de controle e automação, engenheiros mecatrônicos e afins|tecnologo em mecatronica
202120|Tecnólogo em automação industrial|Engenheiros de controle e automação, engenheiros mecatrônicos e afins|tecnologo em automacao industrial
203005|Pesquisador em biologia ambiental|Pesquisadores das ciências biológicas|pesquisador em biologia ambiental
203010|Pesquisador em biologia animal|Pesquisadores das ciências biológicas|pesquisador em biologia animal
203015|Pesquisador em biologia de microorganismos e parasitas|Pesquisadores das ciências biológicas|pesquisador em biologia de microorganismos e parasitas
203020|Pesquisador em biologia humana|Pesquisadores das ciências biológicas|pesquisador em biologia humana
203025|Pesquisador em biologia vegetal|Pesquisadores das ciências biológicas|pesquisador em biologia vegetal
203105|Pesquisador em ciências da computação e informática|Pesquisadores das ciências naturais e exatas|pesquisador em ciencias da computacao e informatica
203110|Pesquisador em ciências da terra e meio ambiente|Pesquisadores das ciências naturais e exatas|pesquisador em ciencias da terra e meio ambiente
203115|Pesquisador em física|Pesquisadores das ciências naturais e exatas|pesquisador em fisica
203120|Pesquisador em matemática|Pesquisadores das ciências naturais e exatas|pesquisador em matematica
203125|Pesquisador em química|Pesquisadores das ciências naturais e exatas|pesquisador em quimica
203205|Pesquisador de engenharia civil|Pesquisadores de engenharia e tecnologia|pesquisador de engenharia civil
203210|Pesquisador de engenharia e tecnologia (outras áreas da engenharia)|Pesquisadores de engenharia e tecnologia|pesquisador de engenharia e tecnologia (outras areas da engenharia)
203215|Pesquisador de engenharia elétrica e eletrônica|Pesquisadores de engenharia e tecnologia|pesquisador de engenharia eletrica e eletronica
203220|Pesquisador de engenharia mecânica|Pesquisadores de engenharia e tecnologia|pesquisador de engenharia mecanica
203225|Pesquisador de engenharia metalúrgica, de minas e de materiais|Pesquisadores de engenharia e tecnologia|pesquisador de engenharia metalurgica, de minas e de materiais
203230|Pesquisador de engenharia química|Pesquisadores de engenharia e tecnologia|pesquisador de engenharia quimica
203305|Pesquisador de clínica médica|Pesquisadores das ciências da saúde|pesquisador de clinica medica
203310|Pesquisador de medicina básica|Pesquisadores das ciências da saúde|pesquisador de medicina basica
203315|Pesquisador em medicina veterinária|Pesquisadores das ciências da saúde|pesquisador em medicina veterinaria
203320|Pesquisador em saúde coletiva|Pesquisadores das ciências da saúde|pesquisador em saude coletiva
203405|Pesquisador em ciências agronômicas|Pesquisadores das ciências da agricultura|pesquisador em ciencias agronomicas
203410|Pesquisador em ciências da pesca e aquicultura|Pesquisadores das ciências da agricultura|pesquisador em ciencias da pesca e aquicultura
203415|Pesquisador em ciências da zootecnia|Pesquisadores das ciências da agricultura|pesquisador em ciencias da zootecnia
203420|Pesquisador em ciências florestais|Pesquisadores das ciências da agricultura|pesquisador em ciencias florestais
203505|Pesquisador em ciências sociais|Pesquisadores das ciências sociais e humanas|pesquisador em ciencias sociais
203510|Pesquisador em economia|Pesquisadores das ciências sociais e humanas|pesquisador em economia
203515|Pesquisador em ciências da educação|Pesquisadores das ciências sociais e humanas|pesquisador em ciencias da educacao
203520|Pesquisador em história|Pesquisadores das ciências sociais e humanas|pesquisador em historia
203525|Pesquisador em psicologia|Pesquisadores das ciências sociais e humanas|pesquisador em psicologia
204105|Perito criminal|Peritos criminais e judiciais|perito criminal
204110|Perito judicial|Peritos criminais e judiciais|perito judicial
211105|Atuário|Profissionais da matemática|atuario
211110|Especialista em pesquisa operacional|Profissionais da matemática|especialista em pesquisa operacional
211115|Matemático|Profissionais da matemática|matematico
211120|Matemático aplicado|Profissionais da matemática|matematico aplicado
211205|Estatístico|Profissionais de estatística e afins|estatistico
211210|Estatístico (estatística aplicada)|Profissionais de estatística e afins|estatistico (estatistica aplicada)
211215|Estatístico teórico|Profissionais de estatística e afins|estatistico teorico
211220|Cientista de dados|Profissionais de estatística e afins|cientista de dados
212205|Engenheiro de aplicativos em computação|Engenheiros em computação|engenheiro de aplicativos em computacao
212210|Engenheiro de equipamentos em computação|Engenheiros em computação|engenheiro de equipamentos em computacao
212215|Engenheiros de sistemas operacionais em computação|Engenheiros em computação|engenheiros de sistemas operacionais em computacao
212305|Administrador de banco de dados|Administradores de tecnologia da informação|administrador de banco de dados
212310|Administrador de redes|Administradores de tecnologia da informação|administrador de redes
212315|Administrador de sistemas operacionais|Administradores de tecnologia da informação|administrador de sistemas operacionais
212320|Administrador em segurança da informação|Administradores de tecnologia da informação|administrador em seguranca da informacao
212405|Analista de desenvolvimento de sistemas|Analistas de tecnologia da informação|analista de desenvolvimento de sistemas
212410|Analista de redes e de comunicação de dados|Analistas de tecnologia da informação|analista de redes e de comunicacao de dados
212415|Analista de sistemas de automação|Analistas de tecnologia da informação|analista de sistemas de automacao
212420|Analista de suporte computacional|Analistas de tecnologia da informação|analista de suporte computacional
212425|Arquiteto de soluções de tecnologia da informação|Analistas de tecnologia da informação|arquiteto de solucoes de tecnologia da informacao
212430|Analista de testes de tecnologia da informação|Analistas de tecnologia da informação|analista de testes de tecnologia da informacao
213105|Físico|Físicos|fisico
213110|Físico (acústica)|Físicos|fisico (acustica)
213115|Físico (atômica e molecular)|Físicos|fisico (atomica e molecular)
213120|Físico (cosmologia)|Físicos|fisico (cosmologia)
213125|Físico (estatística e matemática)|Físicos|fisico (estatistica e matematica)
213130|Físico (fluidos)|Físicos|fisico (fluidos)
213135|Físico (instrumentação)|Físicos|fisico (instrumentacao)
213140|Físico (matéria condensada)|Físicos|fisico (materia condensada)
213145|Físico (materiais)|Físicos|fisico (materiais)
213150|Físico (medicina)|Físicos|fisico (medicina)
213155|Físico (nuclear e reatores)|Físicos|fisico (nuclear e reatores)
213160|Físico (óptica)|Físicos|fisico (optica)
213165|Físico (partículas e campos)|Físicos|fisico (particulas e campos)
213170|Físico (plasma)|Físicos|fisico (plasma)
213175|Físico (térmica)|Físicos|fisico (termica)
213205|Químico|Químicos|quimico
213210|Químico industrial|Químicos|quimico industrial
213215|Tecnólogo em processos químicos|Químicos|tecnologo em processos quimicos
213305|Astrônomo|Profissionais das ciências atmosféricas e espaciais e de astronomia|astronomo
213310|Geofísico espacial|Profissionais das ciências atmosféricas e espaciais e de astronomia|geofisico espacial
213315|Meteorologista|Profissionais das ciências atmosféricas e espaciais e de astronomia|meteorologista
213405|Geólogo|Geólogos, oceanógrafos, geofísicos e afins|geologo
213410|Geólogo de engenharia|Geólogos, oceanógrafos, geofísicos e afins|geologo de engenharia
213415|Geofísico|Geólogos, oceanógrafos, geofísicos e afins|geofisico
213420|Geoquímico|Geólogos, oceanógrafos, geofísicos e afins|geoquimico
213425|Hidrogeólogo|Geólogos, oceanógrafos, geofísicos e afins|hidrogeologo
213430|Paleontólogo|Geólogos, oceanógrafos, geofísicos e afins|paleontologo
213435|Petrógrafo|Geólogos, oceanógrafos, geofísicos e afins|petrografo
213440|Oceanógrafo|Geólogos, oceanógrafos, geofísicos e afins|oceanografo
214005|Engenheiro ambiental|Engenheiros ambientais e afins|engenheiro ambiental
214010|Tecnólogo em meio ambiente|Engenheiros ambientais e afins|tecnologo em meio ambiente
214105|Arquiteto de edificações|Arquitetos e urbanistas|arquiteto de edificacoes
214110|Arquiteto de interiores|Arquitetos e urbanistas|arquiteto de interiores
214115|Arquiteto de patrimônio|Arquitetos e urbanistas|arquiteto de patrimonio
214120|Arquiteto paisagista|Arquitetos e urbanistas|arquiteto paisagista
214125|Arquiteto urbanista|Arquitetos e urbanistas|arquiteto urbanista
214130|Urbanista|Arquitetos e urbanistas|urbanista
214205|Engenheiro civil|Engenheiros civis e afins|engenheiro civil
214210|Engenheiro civil (aeroportos)|Engenheiros civis e afins|engenheiro civil (aeroportos)
214215|Engenheiro civil (edificações)|Engenheiros civis e afins|engenheiro civil (edificacoes)
214220|Engenheiro civil (estruturas metálicas)|Engenheiros civis e afins|engenheiro civil (estruturas metalicas)
214225|Engenheiro civil (ferrovias e metrovias)|Engenheiros civis e afins|engenheiro civil (ferrovias e metrovias)
214230|Engenheiro civil (geotécnia)|Engenheiros civis e afins|engenheiro civil (geotecnia)
214235|Engenheiro civil (hidrologia)|Engenheiros civis e afins|engenheiro civil (hidrologia)
214240|Engenheiro civil (hidráulica)|Engenheiros civis e afins|engenheiro civil (hidraulica)
214245|Engenheiro civil (pontes e viadutos)|Engenheiros civis e afins|engenheiro civil (pontes e viadutos)
214250|Engenheiro civil (portos e vias navegáveis)|Engenheiros civis e afins|engenheiro civil (portos e vias navegaveis)
214255|Engenheiro civil (rodovias)|Engenheiros civis e afins|engenheiro civil (rodovias)
214260|Engenheiro civil (saneamento)|Engenheiros civis e afins|engenheiro civil (saneamento)
214265|Engenheiro civil (túneis)|Engenheiros civis e afins|engenheiro civil (tuneis)
214270|Engenheiro civil (transportes e trânsito)|Engenheiros civis e afins|engenheiro civil (transportes e transito)
214280|Tecnólogo em construção civil|Engenheiros civis e afins|tecnologo em construcao civil
214305|Engenheiro eletricista|Engenheiros eletricistas, eletrônicos e afins|engenheiro eletricista
214310|Engenheiro eletrônico|Engenheiros eletricistas, eletrônicos e afins|engenheiro eletronico
214315|Engenheiro eletricista de manutenção|Engenheiros eletricistas, eletrônicos e afins|engenheiro eletricista de manutencao
214320|Engenheiro eletricista de projetos|Engenheiros eletricistas, eletrônicos e afins|engenheiro eletricista de projetos
214325|Engenheiro eletrônico de manutenção|Engenheiros eletricistas, eletrônicos e afins|engenheiro eletronico de manutencao
214330|Engenheiro eletrônico de projetos|Engenheiros eletricistas, eletrônicos e afins|engenheiro eletronico de projetos
214335|Engenheiro de manutenção de telecomunicações|Engenheiros eletricistas, eletrônicos e afins|engenheiro de manutencao de telecomunicacoes
214340|Engenheiro de telecomunicações|Engenheiros eletricistas, eletrônicos e afins|engenheiro de telecomunicacoes
214345|Engenheiro projetista de telecomunicações|Engenheiros eletricistas, eletrônicos e afins|engenheiro projetista de telecomunicacoes
214350|Engenheiro de redes de comunicação|Engenheiros eletricistas, eletrônicos e afins|engenheiro de redes de comunicacao
214360|Tecnólogo em eletricidade|Engenheiros eletricistas, eletrônicos e afins|tecnologo em eletricidade
214365|Tecnólogo em eletrônica|Engenheiros eletricistas, eletrônicos e afins|tecnologo em eletronica
214370|Tecnólogo em telecomunicações|Engenheiros eletricistas, eletrônicos e afins|tecnologo em telecomunicacoes
214375|Engenheiro de energia|Engenheiros eletricistas, eletrônicos e afins|engenheiro de energia
214380|Engenheiro biomédico|Engenheiros eletricistas, eletrônicos e afins|engenheiro biomedico
214405|Engenheiro mecânico|Engenheiros mecânicos e afins|engenheiro mecanico
214410|Engenheiro mecânico automotivo|Engenheiros mecânicos e afins|engenheiro mecanico automotivo
214415|Engenheiro mecânico (energia nuclear)|Engenheiros mecânicos e afins|engenheiro mecanico (energia nuclear)
214420|Engenheiro mecânico industrial|Engenheiros mecânicos e afins|engenheiro mecanico industrial
214425|Engenheiro aeronáutico|Engenheiros mecânicos e afins|engenheiro aeronautico
214430|Engenheiro naval|Engenheiros mecânicos e afins|engenheiro naval
214435|Tecnólogo em fabricação mecânica|Engenheiros mecânicos e afins|tecnologo em fabricacao mecanica
214505|Engenheiro químico|Engenheiros químicos e afins|engenheiro quimico
214510|Engenheiro químico (indústria química)|Engenheiros químicos e afins|engenheiro quimico (industria quimica)
214515|Engenheiro químico (mineração, metalurgia, siderurgia, cimenteira e cerâmica)|Engenheiros químicos e afins|engenheiro quimico (mineracao, metalurgia, siderurgia, cimenteira e ceramica)
214520|Engenheiro químico (papel e celulose)|Engenheiros químicos e afins|engenheiro quimico (papel e celulose)
214525|Engenheiro químico (petróleo e borracha)|Engenheiros químicos e afins|engenheiro quimico (petroleo e borracha)
214530|Engenheiro químico (utilidades e meio ambiente)|Engenheiros químicos e afins|engenheiro quimico (utilidades e meio ambiente)
214535|Tecnólogo em produção sucroalcooleira|Engenheiros químicos e afins|tecnologo em producao sucroalcooleira
214540|Engenheiro têxtil|Engenheiros químicos e afins|engenheiro textil
214605|Engenheiro de materiais|Engenheiros metalurgistas, de materiais e afins|engenheiro de materiais
214610|Engenheiro metalurgista|Engenheiros metalurgistas, de materiais e afins|engenheiro metalurgista
214615|Tecnólogo em metalurgia|Engenheiros metalurgistas, de materiais e afins|tecnologo em metalurgia
214705|Engenheiro de minas|Engenheiros de minas e afins|engenheiro de minas
214710|Engenheiro de minas (beneficiamento)|Engenheiros de minas e afins|engenheiro de minas (beneficiamento)
214715|Engenheiro de minas (lavra a céu aberto)|Engenheiros de minas e afins|engenheiro de minas (lavra a ceu aberto)
214720|Engenheiro de minas (lavra subterrânea)|Engenheiros de minas e afins|engenheiro de minas (lavra subterranea)
214725|Engenheiro de minas (pesquisa mineral)|Engenheiros de minas e afins|engenheiro de minas (pesquisa mineral)
214730|Engenheiro de minas (planejamento)|Engenheiros de minas e afins|engenheiro de minas (planejamento)
214735|Engenheiro de minas (processo)|Engenheiros de minas e afins|engenheiro de minas (processo)
214740|Engenheiro de minas (projeto)|Engenheiros de minas e afins|engenheiro de minas (projeto)
214745|Tecnólogo em petróleo e gás|Engenheiros de minas e afins|tecnologo em petroleo e gas
214750|Tecnólogo em rochas ornamentais|Engenheiros de minas e afins|tecnologo em rochas ornamentais
214805|Engenheiro agrimensor|Engenheiros agrimensores e engenheiros cartógrafos|engenheiro agrimensor
214810|Engenheiro cartógrafo|Engenheiros agrimensores e engenheiros cartógrafos|engenheiro cartografo
214905|Engenheiro de produção|Profissionais de produção, qualidade, saúde, segurança e afins|engenheiro de producao
214910|Engenheiro de controle de qualidade|Profissionais de produção, qualidade, saúde, segurança e afins|engenheiro de controle de qualidade
214915|Engenheiro de segurança do trabalho|Profissionais de produção, qualidade, saúde, segurança e afins|engenheiro de seguranca do trabalho
214920|Engenheiro de riscos|Profissionais de produção, qualidade, saúde, segurança e afins|engenheiro de riscos
214925|Engenheiro de tempos e movimentos|Profissionais de produção, qualidade, saúde, segurança e afins|engenheiro de tempos e movimentos
214930|Tecnólogo em produção industrial|Profissionais de produção, qualidade, saúde, segurança e afins|tecnologo em producao industrial
214935|Tecnólogo em segurança do trabalho|Profissionais de produção, qualidade, saúde, segurança e afins|tecnologo em seguranca do trabalho
214940|Higienista ocupacional|Profissionais de produção, qualidade, saúde, segurança e afins|higienista ocupacional
214945|Engenheiro de logistica|Profissionais de produção, qualidade, saúde, segurança e afins|engenheiro de logistica
214950|Ergonomista|Profissionais de produção, qualidade, saúde, segurança e afins|ergonomista
215105|Agente de manobra e docagem|Oficiais de convés e afins|agente de manobra e docagem
215110|Capitão de manobra da marinha mercante|Oficiais de convés e afins|capitao de manobra da marinha mercante
215115|Comandante da marinha mercante|Oficiais de convés e afins|comandante da marinha mercante
215120|Coordenador de operações de combate à poluição no meio aquaviário|Oficiais de convés e afins|coordenador de operacoes de combate a poluicao no meio aquaviario
215125|Imediato da marinha mercante|Oficiais de convés e afins|imediato da marinha mercante
215130|Inspetor de terminal|Oficiais de convés e afins|inspetor de terminal
215135|Inspetor naval|Oficiais de convés e afins|inspetor naval
215140|Oficial de quarto de navegação da marinha mercante|Oficiais de convés e afins|oficial de quarto de navegacao da marinha mercante
215145|Prático de portos da marinha mercante|Oficiais de convés e afins|pratico de portos da marinha mercante
215150|Vistoriador naval|Oficiais de convés e afins|vistoriador naval
215205|Oficial superior de máquinas da marinha mercante|Oficiais de máquinas da marinha mercante|oficial superior de maquinas da marinha mercante
215210|Primeiro oficial de máquinas da marinha mercante|Oficiais de máquinas da marinha mercante|primeiro oficial de maquinas da marinha mercante
215215|Segundo oficial de máquinas da marinha mercante|Oficiais de máquinas da marinha mercante|segundo oficial de maquinas da marinha mercante
215220|Superintendente técnico no transporte aquaviário|Oficiais de máquinas da marinha mercante|superintendente tecnico no transporte aquaviario
215305|Piloto de aeronaves|Profissionais da pilotagem aeronáutica|piloto de aeronaves
215310|Piloto de ensaios em vôo|Profissionais da pilotagem aeronáutica|piloto de ensaios em voo
215315|Instrutor de vôo|Profissionais da pilotagem aeronáutica|instrutor de voo
221105|Biólogo|Biólogos e afins|biologo
221110|Biólogo em meio ambiente e biodiversidade|Biólogos e afins|biologo em meio ambiente e biodiversidade
221115|Biólogo em saúde|Biólogos e afins|biologo em saude
221205|Biomédico|Biomédicos|biomedico
222105|Engenheiro agrícola|Engenheiros agrossilvipecuários|engenheiro agricola
222110|Engenheiro agrônomo|Engenheiros agrossilvipecuários|engenheiro agronomo
222115|Engenheiro de pesca|Engenheiros agrossilvipecuários|engenheiro de pesca
222120|Engenheiro florestal|Engenheiros agrossilvipecuários|engenheiro florestal
222125|Tecnólogo em agronegócio|Engenheiros agrossilvipecuários|tecnologo em agronegocio
222130|Agroecólogo|Engenheiros agrossilvipecuários|agroecologo
222135|Tecnólogo em agroecologia|Engenheiros agrossilvipecuários|tecnologo em agroecologia
222140|Engenheiro de biossistemas|Engenheiros agrossilvipecuários|engenheiro de biossistemas
222205|Engenheiro de alimentos|Engenheiros de alimentos e afins|engenheiro de alimentos
222215|Tecnólogo em alimentos|Engenheiros de alimentos e afins|tecnologo em alimentos
223204|Cirurgião dentista - auditor|Cirurgiões-dentistas|cirurgiao dentista - auditor
223208|Cirurgião dentista - clínico geral|Cirurgiões-dentistas|cirurgiao dentista - clinico geral
223212|Cirurgião dentista - endodontista|Cirurgiões-dentistas|cirurgiao dentista - endodontista
223216|Cirurgião dentista - epidemiologista|Cirurgiões-dentistas|cirurgiao dentista - epidemiologista
223220|Cirurgião dentista - estomatologista|Cirurgiões-dentistas|cirurgiao dentista - estomatologista
223224|Cirurgião dentista - implantodontista|Cirurgiões-dentistas|cirurgiao dentista - implantodontista
223228|Cirurgião dentista - odontogeriatra|Cirurgiões-dentistas|cirurgiao dentista - odontogeriatra
223232|Cirurgião dentista - odontologista legal|Cirurgiões-dentistas|cirurgiao dentista - odontologista legal
223236|Cirurgião dentista - odontopediatra|Cirurgiões-dentistas|cirurgiao dentista - odontopediatra
223240|Cirurgião dentista - ortopedista e ortodontista|Cirurgiões-dentistas|cirurgiao dentista - ortopedista e ortodontista
223244|Cirurgião dentista - patologista bucal|Cirurgiões-dentistas|cirurgiao dentista - patologista bucal
223248|Cirurgião dentista - periodontista|Cirurgiões-dentistas|cirurgiao dentista - periodontista
223252|Cirurgião dentista - protesiólogo bucomaxilofacial|Cirurgiões-dentistas|cirurgiao dentista - protesiologo bucomaxilofacial
223256|Cirurgião dentista - protesista|Cirurgiões-dentistas|cirurgiao dentista - protesista
223260|Cirurgião dentista - radiologista|Cirurgiões-dentistas|cirurgiao dentista - radiologista
223264|Cirurgião dentista - reabilitador oral|Cirurgiões-dentistas|cirurgiao dentista - reabilitador oral
223268|Cirurgião dentista - traumatologista bucomaxilofacial|Cirurgiões-dentistas|cirurgiao dentista - traumatologista bucomaxilofacial
223272|Cirurgião dentista de saúde coletiva|Cirurgiões-dentistas|cirurgiao dentista de saude coletiva
223276|Cirurgião dentista - odontologia do trabalho|Cirurgiões-dentistas|cirurgiao dentista - odontologia do trabalho
223280|Cirurgião dentista - dentística|Cirurgiões-dentistas|cirurgiao dentista - dentistica
223284|Cirurgião dentista - disfunção temporomandibular e dor orofacial|Cirurgiões-dentistas|cirurgiao dentista - disfuncao temporomandibular e dor orofacial
223288|Cirurgião dentista - odontologia para pacientes com necessidades especiais|Cirurgiões-dentistas|cirurgiao dentista - odontologia para pacientes com necessidades especiais
223293|Cirurgião-dentista da estratégia de saúde da família|Cirurgiões-dentistas|cirurgiao-dentista da estrategia de saude da familia
223305|Médico veterinário|Veterinários e zootecnistas|medico veterinario
223310|Zootecnista|Veterinários e zootecnistas|zootecnista
223405|Farmacêutico|Farmacêuticos|farmaceutico
223415|Farmacêutico analista clínico|Farmacêuticos|farmaceutico analista clinico
223420|Farmacêutico de alimentos|Farmacêuticos|farmaceutico de alimentos
223425|Farmacêutico práticas integrativas e complementares|Farmacêuticos|farmaceutico praticas integrativas e complementares
223430|Farmacêutico em saúde pública|Farmacêuticos|farmaceutico em saude publica
223435|Farmacêutico industrial|Farmacêuticos|farmaceutico industrial
223440|Farmacêutico toxicologista|Farmacêuticos|farmaceutico toxicologista
223445|Farmacêutico hospitalar e clínico|Farmacêuticos|farmaceutico hospitalar e clinico
223505|Enfermeiro|Enfermeiros e afins|enfermeiro
223510|Enfermeiro auditor|Enfermeiros e afins|enfermeiro auditor
223515|Enfermeiro de bordo|Enfermeiros e afins|enfermeiro de bordo
223520|Enfermeiro de centro cirúrgico|Enfermeiros e afins|enfermeiro de centro cirurgico
223525|Enfermeiro de terapia intensiva|Enfermeiros e afins|enfermeiro de terapia intensiva
223530|Enfermeiro do trabalho|Enfermeiros e afins|enfermeiro do trabalho
223535|Enfermeiro nefrologista|Enfermeiros e afins|enfermeiro nefrologista
223540|Enfermeiro neonatologista|Enfermeiros e afins|enfermeiro neonatologista
223545|Enfermeiro obstétrico|Enfermeiros e afins|enfermeiro obstetrico
223550|Enfermeiro psiquiátrico|Enfermeiros e afins|enfermeiro psiquiatrico
223555|Enfermeiro puericultor e pediátrico|Enfermeiros e afins|enfermeiro puericultor e pediatrico
223560|Enfermeiro sanitarista|Enfermeiros e afins|enfermeiro sanitarista
223565|Enfermeiro da estratégia de saúde da família|Enfermeiros e afins|enfermeiro da estrategia de saude da familia
223570|Perfusionista|Enfermeiros e afins|perfusionista
223575|Obstetriz|Enfermeiros e afins|obstetriz
223580|Enfermeiro estomaterapeuta|Enfermeiros e afins|enfermeiro estomaterapeuta
223585|Enfermeiro forense|Enfermeiros e afins|enfermeiro forense
223605|Fisioterapeuta geral|Fisioterapeutas|fisioterapeuta geral
223625|Fisioterapeuta respiratória|Fisioterapeutas|fisioterapeuta respiratoria
223630|Fisioterapeuta neurofuncional|Fisioterapeutas|fisioterapeuta neurofuncional
223635|Fisioterapeuta traumato-ortopédica funcional|Fisioterapeutas|fisioterapeuta traumato-ortopedica funcional
223640|Fisioterapeuta osteopata|Fisioterapeutas|fisioterapeuta osteopata
223645|Fisioterapeuta quiropraxista|Fisioterapeutas|fisioterapeuta quiropraxista
223650|Fisioterapeuta acupunturista|Fisioterapeutas|fisioterapeuta acupunturista
223655|Fisioterapeuta esportivo|Fisioterapeutas|fisioterapeuta esportivo
223660|Fisioterapeuta  do trabalho|Fisioterapeutas|fisioterapeuta  do trabalho
223705|Dietista|Nutricionistas|dietista
223710|Nutricionista|Nutricionistas|nutricionista
223810|Fonoaudiólogo geral|Fonoaudiólogos|fonoaudiologo geral
223815|Fonoaudiólogo educacional|Fonoaudiólogos|fonoaudiologo educacional
223820|Fonoaudiólogo em audiologia|Fonoaudiólogos|fonoaudiologo em audiologia
223825|Fonoaudiólogo em disfagia|Fonoaudiólogos|fonoaudiologo em disfagia
223830|Fonoaudiólogo em linguagem|Fonoaudiólogos|fonoaudiologo em linguagem
223835|Fonoaudiólogo em motricidade orofacial|Fonoaudiólogos|fonoaudiologo em motricidade orofacial
223840|Fonoaudiólogo em saúde coletiva|Fonoaudiólogos|fonoaudiologo em saude coletiva
223845|Fonoaudiólogo em voz|Fonoaudiólogos|fonoaudiologo em voz
223905|Terapeuta ocupacional|Terapeutas ocupacionais, ortoptistas e psicomotricistas|terapeuta ocupacional
223910|Ortoptista|Terapeutas ocupacionais, ortoptistas e psicomotricistas|ortoptista
223915|Psicomotricista|Terapeutas ocupacionais, ortoptistas e psicomotricistas|psicomotricista
224105|Avaliador físico|Profissionais da educação física|avaliador fisico
224110|Ludomotricista|Profissionais da educação física|ludomotricista
224115|Preparador de atleta|Profissionais da educação física|preparador de atleta
224120|Preparador físico|Profissionais da educação física|preparador fisico
224125|Técnico de desporto individual e coletivo (exceto futebol)|Profissionais da educação física|tecnico de desporto individual e coletivo (exceto futebol)
224130|Técnico de laboratório e fiscalização desportiva|Profissionais da educação física|tecnico de laboratorio e fiscalizacao desportiva
224135|Treinador profissional de futebol|Profissionais da educação física|treinador profissional de futebol
224140|Profissional de educação física na saúde|Profissionais da educação física|profissional de educacao fisica na saude
225103|Médico infectologista|Médicos clínicos|medico infectologista
225105|Médico acupunturista|Médicos clínicos|medico acupunturista
225106|Médico legista e perito médico|Médicos clínicos|medico legista e perito medico
225109|Médico nefrologista|Médicos clínicos|medico nefrologista
225110|Médico alergista e imunologista|Médicos clínicos|medico alergista e imunologista
225112|Médico neurologista|Médicos clínicos|medico neurologista
225115|Médico angiologista|Médicos clínicos|medico angiologista
225118|Médico nutrologista|Médicos clínicos|medico nutrologista
225120|Médico cardiologista|Médicos clínicos|medico cardiologista
225121|Médico oncologista clínico|Médicos clínicos|medico oncologista clinico
225122|Médico oncologista pediátrico|Médicos clínicos|medico oncologista pediatrico
225124|Médico pediatra|Médicos clínicos|medico pediatra
225125|Médico clínico|Médicos clínicos|medico clinico
225127|Médico pneumologista|Médicos clínicos|medico pneumologista
225130|Médico de família e comunidade|Médicos clínicos|medico de familia e comunidade
225133|Médico psiquiatra|Médicos clínicos|medico psiquiatra
225135|Médico dermatologista|Médicos clínicos|medico dermatologista
225136|Médico reumatologista|Médicos clínicos|medico reumatologista
225139|Médico em medicina preventiva e social|Médicos clínicos|medico em medicina preventiva e social
225140|Médico do trabalho|Médicos clínicos|medico do trabalho
225145|Médico em medicina do tráfego|Médicos clínicos|medico em medicina do trafego
225148|Médico anatomopatologista|Médicos clínicos|medico anatomopatologista
225150|Médico em medicina intensiva|Médicos clínicos|medico em medicina intensiva
225151|Médico anestesiologista|Médicos clínicos|medico anestesiologista
225154|Médico antroposófico|Médicos clínicos|medico antroposofico
225155|Médico endocrinologista e metabologista|Médicos clínicos|medico endocrinologista e metabologista
225157|Médico emergencista|Médicos clínicos|medico emergencista
225160|Médico fisiatra|Médicos clínicos|medico fisiatra
225165|Médico gastroenterologista|Médicos clínicos|medico gastroenterologista
225170|Médico generalista|Médicos clínicos|medico generalista
225175|Médico geneticista|Médicos clínicos|medico geneticista
225180|Médico geriatra|Médicos clínicos|medico geriatra
225185|Médico hematologista|Médicos clínicos|medico hematologista
225195|Médico homeopata|Médicos clínicos|medico homeopata
225203|Médico em cirurgia vascular|Médicos em especialidades cirúrgicas|medico em cirurgia vascular
225210|Médico cirurgião cardiovascular|Médicos em especialidades cirúrgicas|medico cirurgiao cardiovascular
225215|Médico cirurgião de cabeça e pescoço|Médicos em especialidades cirúrgicas|medico cirurgiao de cabeca e pescoco
225220|Médico cirurgião do aparelho digestivo|Médicos em especialidades cirúrgicas|medico cirurgiao do aparelho digestivo
225225|Médico cirurgião geral|Médicos em especialidades cirúrgicas|medico cirurgiao geral
225230|Médico cirurgião pediátrico|Médicos em especialidades cirúrgicas|medico cirurgiao pediatrico
225235|Médico cirurgião plástico|Médicos em especialidades cirúrgicas|medico cirurgiao plastico
225240|Médico cirurgião torácico|Médicos em especialidades cirúrgicas|medico cirurgiao toracico
225250|Médico ginecologista e obstetra|Médicos em especialidades cirúrgicas|medico ginecologista e obstetra
225255|Médico mastologista|Médicos em especialidades cirúrgicas|medico mastologista
225260|Médico neurocirurgião|Médicos em especialidades cirúrgicas|medico neurocirurgiao
225265|Médico oftalmologista|Médicos em especialidades cirúrgicas|medico oftalmologista
225270|Médico ortopedista e traumatologista|Médicos em especialidades cirúrgicas|medico ortopedista e traumatologista
225275|Médico otorrinolaringologista|Médicos em especialidades cirúrgicas|medico otorrinolaringologista
225280|Médico coloproctologista|Médicos em especialidades cirúrgicas|medico coloproctologista
225285|Médico urologista|Médicos em especialidades cirúrgicas|medico urologista
225290|Médico cancerologista cirurgíco|Médicos em especialidades cirúrgicas|medico cancerologista cirurgico
225295|Médico cirurgião da mão|Médicos em especialidades cirúrgicas|medico cirurgiao da mao
225305|Médico citopatologista|Médicos em medicina diagnóstica e terapêutica|medico citopatologista
225310|Médico em endoscopia|Médicos em medicina diagnóstica e terapêutica|medico em endoscopia
225315|Médico em medicina nuclear|Médicos em medicina diagnóstica e terapêutica|medico em medicina nuclear
225320|Médico em radiologia e diagnóstico por imagem|Médicos em medicina diagnóstica e terapêutica|medico em radiologia e diagnostico por imagem
225325|Médico patologista|Médicos em medicina diagnóstica e terapêutica|medico patologista
225330|Médico radioterapeuta|Médicos em medicina diagnóstica e terapêutica|medico radioterapeuta
225335|Médico patologista clínico / medicina laboratorial|Médicos em medicina diagnóstica e terapêutica|medico patologista clinico / medicina laboratorial
225340|Médico hemoterapeuta|Médicos em medicina diagnóstica e terapêutica|medico hemoterapeuta
225345|Médico hiperbarista|Médicos em medicina diagnóstica e terapêutica|medico hiperbarista
225350|Médico neurofisiologista clínico|Médicos em medicina diagnóstica e terapêutica|medico neurofisiologista clinico
225355|Médico radiologista intervencionista|Médicos em medicina diagnóstica e terapêutica|medico radiologista intervencionista
226105|Quiropraxista|Osteopatas e quiropraxistas|quiropraxista
226110|Osteopata|Osteopatas e quiropraxistas|osteopata
226305|Musicoterapeuta|Profissionais das terapias criativas,equoterápicas e naturológicas|musicoterapeuta
226310|Arteterapeuta|Profissionais das terapias criativas,equoterápicas e naturológicas|arteterapeuta
226315|Equoterapeuta|Profissionais das terapias criativas,equoterápicas e naturológicas|equoterapeuta
226320|Naturólogo|Profissionais das terapias criativas,equoterápicas e naturológicas|naturologo
231105|Professor de nível superior na educação infantil (quatro a seis anos)|Professores de nível superior na educação infantil|professor de nivel superior na educacao infantil (quatro a seis anos)
231110|Professor de nível superior na educação infantil (zero a três anos)|Professores de nível superior na educação infantil|professor de nivel superior na educacao infantil (zero a tres anos)
231205|Professor da  educação de jovens e adultos do ensino fundamental (primeira a quarta série)|Professores de nível superior do ensino fundamental (primeira a quarta séries)|professor da  educacao de jovens e adultos do ensino fundamental (primeira a quarta serie)
231210|Professor de nível superior do ensino fundamental (primeira a quarta série)|Professores de nível superior do ensino fundamental (primeira a quarta séries)|professor de nivel superior do ensino fundamental (primeira a quarta serie)
231305|Professor de ciências exatas e naturais do ensino fundamental|Professores de nível superior no ensino fundamental de quinta a oitava série|professor de ciencias exatas e naturais do ensino fundamental
231310|Professor de educação artística do ensino fundamental|Professores de nível superior no ensino fundamental de quinta a oitava série|professor de educacao artistica do ensino fundamental
231315|Professor de educação física do ensino fundamental|Professores de nível superior no ensino fundamental de quinta a oitava série|professor de educacao fisica do ensino fundamental
231320|Professor de geografia do ensino fundamental|Professores de nível superior no ensino fundamental de quinta a oitava série|professor de geografia do ensino fundamental
231325|Professor de história do ensino fundamental|Professores de nível superior no ensino fundamental de quinta a oitava série|professor de historia do ensino fundamental
231330|Professor de língua estrangeira moderna do ensino fundamental|Professores de nível superior no ensino fundamental de quinta a oitava série|professor de lingua estrangeira moderna do ensino fundamental
231335|Professor de língua portuguesa do ensino fundamental|Professores de nível superior no ensino fundamental de quinta a oitava série|professor de lingua portuguesa do ensino fundamental
231340|Professor de matemática do ensino fundamental|Professores de nível superior no ensino fundamental de quinta a oitava série|professor de matematica do ensino fundamental
232105|Professor de artes no ensino médio|Professores do ensino médio|professor de artes no ensino medio
232110|Professor de biologia no ensino médio|Professores do ensino médio|professor de biologia no ensino medio
232115|Professor de disciplinas pedagógicas no ensino médio|Professores do ensino médio|professor de disciplinas pedagogicas no ensino medio
232120|Professor de educação física no ensino médio|Professores do ensino médio|professor de educacao fisica no ensino medio
232125|Professor de filosofia no ensino médio|Professores do ensino médio|professor de filosofia no ensino medio
232130|Professor de física no ensino médio|Professores do ensino médio|professor de fisica no ensino medio
232135|Professor de geografia no ensino médio|Professores do ensino médio|professor de geografia no ensino medio
232140|Professor de história no ensino médio|Professores do ensino médio|professor de historia no ensino medio
232145|Professor de língua e literatura brasileira no ensino médio|Professores do ensino médio|professor de lingua e literatura brasileira no ensino medio
232150|Professor de língua estrangeira moderna no ensino médio|Professores do ensino médio|professor de lingua estrangeira moderna no ensino medio
232155|Professor de matemática no ensino médio|Professores do ensino médio|professor de matematica no ensino medio
232160|Professor de psicologia no ensino médio|Professores do ensino médio|professor de psicologia no ensino medio
232165|Professor de química no ensino médio|Professores do ensino médio|professor de quimica no ensino medio
232170|Professor de sociologia no ensino médio|Professores do ensino médio|professor de sociologia no ensino medio
233105|Professor de educação ambiental no ensino profissional|Professores do ensino profissional|professor de educacao ambiental no ensino profissional
233110|Professor de desenho técnico do ensino profissional|Professores do ensino profissional|professor de desenho tecnico do ensino profissional
233115|Professor de técnicas agrícolas|Professores do ensino profissional|professor de tecnicas agricolas
233120|Professor de técnicas comerciais e secretariais|Professores do ensino profissional|professor de tecnicas comerciais e secretariais
233125|Professor de técnicas de enfermagem|Professores do ensino profissional|professor de tecnicas de enfermagem
233130|Professor de técnicas industriais|Professores do ensino profissional|professor de tecnicas industriais
233135|Professor de tecnologia e cálculo técnico|Professores do ensino profissional|professor de tecnologia e calculo tecnico
233205|Instrutor de aprendizagem e treinamento agropecuário|Instrutores de ensino profissional|instrutor de aprendizagem e treinamento agropecuario
233210|Instrutor de aprendizagem e treinamento industrial|Instrutores de ensino profissional|instrutor de aprendizagem e treinamento industrial
233215|Instrutor de aprendizagem e treinamento comercial|Instrutores de ensino profissional|instrutor de aprendizagem e treinamento comercial
233220|Professor instrutor de ensino e aprendizagem agroflorestal|Instrutores de ensino profissional|professor instrutor de ensino e aprendizagem agroflorestal
233225|Professor instrutor de aprendizagem em serviços|Instrutores de ensino profissional|professor instrutor de aprendizagem em servicos
234105|Professor de matemática aplicada (no ensino superior)|Professores de matemática, estatística e informática do ensino superior|professor de matematica aplicada (no ensino superior)
234110|Professor de matemática pura (no ensino superior)|Professores de matemática, estatística e informática do ensino superior|professor de matematica pura (no ensino superior)
234115|Professor de estatística (no ensino superior)|Professores de matemática, estatística e informática do ensino superior|professor de estatistica (no ensino superior)
234120|Professor de computação (no ensino superior)|Professores de matemática, estatística e informática do ensino superior|professor de computacao (no ensino superior)
234125|Professor de pesquisa operacional (no ensino superior)|Professores de matemática, estatística e informática do ensino superior|professor de pesquisa operacional (no ensino superior)
234205|Professor de física (ensino superior)|Professores de ciências físicas, químicas e afins do ensino superior|professor de fisica (ensino superior)
234210|Professor de química (ensino superior)|Professores de ciências físicas, químicas e afins do ensino superior|professor de quimica (ensino superior)
234215|Professor de astronomia (ensino superior)|Professores de ciências físicas, químicas e afins do ensino superior|professor de astronomia (ensino superior)
234305|Professor de arquitetura|Professores de arquitetura e urbanismo, engenharia, geofísica e geologia do ensino superior|professor de arquitetura
234310|Professor de engenharia|Professores de arquitetura e urbanismo, engenharia, geofísica e geologia do ensino superior|professor de engenharia
234315|Professor de geofísica|Professores de arquitetura e urbanismo, engenharia, geofísica e geologia do ensino superior|professor de geofisica
234320|Professor de geologia|Professores de arquitetura e urbanismo, engenharia, geofísica e geologia do ensino superior|professor de geologia
234405|Professor de ciências biológicas do ensino superior|Professores de ciências biológicas e da saúde do ensino superior|professor de ciencias biologicas do ensino superior
234410|Professor de educação física no ensino superior|Professores de ciências biológicas e da saúde do ensino superior|professor de educacao fisica no ensino superior
234415|Professor de enfermagem do ensino superior|Professores de ciências biológicas e da saúde do ensino superior|professor de enfermagem do ensino superior
234420|Professor de farmácia e bioquímica|Professores de ciências biológicas e da saúde do ensino superior|professor de farmacia e bioquimica
234425|Professor de fisioterapia|Professores de ciências biológicas e da saúde do ensino superior|professor de fisioterapia
234430|Professor de fonoaudiologia|Professores de ciências biológicas e da saúde do ensino superior|professor de fonoaudiologia
234435|Professor de medicina|Professores de ciências biológicas e da saúde do ensino superior|professor de medicina
234440|Professor de medicina veterinária|Professores de ciências biológicas e da saúde do ensino superior|professor de medicina veterinaria
234445|Professor de nutrição|Professores de ciências biológicas e da saúde do ensino superior|professor de nutricao
234450|Professor de odontologia|Professores de ciências biológicas e da saúde do ensino superior|professor de odontologia
234455|Professor de terapia ocupacional|Professores de ciências biológicas e da saúde do ensino superior|professor de terapia ocupacional
234460|Professor de zootecnia do ensino superior|Professores de ciências biológicas e da saúde do ensino superior|professor de zootecnia do ensino superior
234505|Professor de ensino superior na área de didática|Professores na área de formação pedagógica do ensino superior|professor de ensino superior na area de didatica
234510|Professor de ensino superior na área de orientação educacional|Professores na área de formação pedagógica do ensino superior|professor de ensino superior na area de orientacao educacional
234515|Professor de ensino superior na área de pesquisa educacional|Professores na área de formação pedagógica do ensino superior|professor de ensino superior na area de pesquisa educacional
234520|Professor de ensino superior na área de prática de ensino|Professores na área de formação pedagógica do ensino superior|professor de ensino superior na area de pratica de ensino
234604|Professor de língua alemã|Professores nas áreas de língua e literatura do ensino superior|professor de lingua alema
234608|Professor de língua italiana|Professores nas áreas de língua e literatura do ensino superior|professor de lingua italiana
234612|Professor de língua francesa|Professores nas áreas de língua e literatura do ensino superior|professor de lingua francesa
234616|Professor de língua inglesa|Professores nas áreas de língua e literatura do ensino superior|professor de lingua inglesa
234620|Professor de língua espanhola|Professores nas áreas de língua e literatura do ensino superior|professor de lingua espanhola
234624|Professor de língua portuguesa|Professores nas áreas de língua e literatura do ensino superior|professor de lingua portuguesa
234628|Professor de literatura brasileira|Professores nas áreas de língua e literatura do ensino superior|professor de literatura brasileira
234632|Professor de literatura portuguesa|Professores nas áreas de língua e literatura do ensino superior|professor de literatura portuguesa
234636|Professor de literatura alemã|Professores nas áreas de língua e literatura do ensino superior|professor de literatura alema
234640|Professor de literatura comparada|Professores nas áreas de língua e literatura do ensino superior|professor de literatura comparada
234644|Professor de literatura espanhola|Professores nas áreas de língua e literatura do ensino superior|professor de literatura espanhola
234648|Professor de literatura francesa|Professores nas áreas de língua e literatura do ensino superior|professor de literatura francesa
234652|Professor de literatura inglesa|Professores nas áreas de língua e literatura do ensino superior|professor de literatura inglesa
234656|Professor de literatura italiana|Professores nas áreas de língua e literatura do ensino superior|professor de literatura italiana
234660|Professor de literatura de línguas estrangeiras modernas|Professores nas áreas de língua e literatura do ensino superior|professor de literatura de linguas estrangeiras modernas
234664|Professor de outras línguas e literaturas|Professores nas áreas de língua e literatura do ensino superior|professor de outras linguas e literaturas
234668|Professor de línguas estrangeiras modernas|Professores nas áreas de língua e literatura do ensino superior|professor de linguas estrangeiras modernas
234672|Professor de linguística e linguística aplicada|Professores nas áreas de língua e literatura do ensino superior|professor de linguistica e linguistica aplicada
234676|Professor de filologia e crítica textual|Professores nas áreas de língua e literatura do ensino superior|professor de filologia e critica textual
234680|Professor de semiótica|Professores nas áreas de língua e literatura do ensino superior|professor de semiotica
234684|Professor de teoria da literatura|Professores nas áreas de língua e literatura do ensino superior|professor de teoria da literatura
234689|Professor de língua brasileira de sinais (libras)|Professores nas áreas de língua e literatura do ensino superior|professor de lingua brasileira de sinais (libras)
234705|Professor de antropologia do ensino superior|Professores de ciências humanas do ensino superior|professor de antropologia do ensino superior
234710|Professor de arquivologia do ensino superior|Professores de ciências humanas do ensino superior|professor de arquivologia do ensino superior
234715|Professor de biblioteconomia do ensino superior|Professores de ciências humanas do ensino superior|professor de biblioteconomia do ensino superior
234720|Professor de ciência política do ensino superior|Professores de ciências humanas do ensino superior|professor de ciencia politica do ensino superior
234725|Professor de comunicação social do ensino superior|Professores de ciências humanas do ensino superior|professor de comunicacao social do ensino superior
234730|Professor de direito do ensino superior|Professores de ciências humanas do ensino superior|professor de direito do ensino superior
234735|Professor de filosofia do ensino superior|Professores de ciências humanas do ensino superior|professor de filosofia do ensino superior
234740|Professor de geografia do ensino superior|Professores de ciências humanas do ensino superior|professor de geografia do ensino superior
234745|Professor de história do ensino superior|Professores de ciências humanas do ensino superior|professor de historia do ensino superior
234750|Professor de jornalismo do ensino superior|Professores de ciências humanas do ensino superior|professor de jornalismo do ensino superior
234755|Professor de museologia do ensino superior|Professores de ciências humanas do ensino superior|professor de museologia do ensino superior
234760|Professor de psicologia do ensino superior|Professores de ciências humanas do ensino superior|professor de psicologia do ensino superior
234765|Professor de serviço social do ensino superior|Professores de ciências humanas do ensino superior|professor de servico social do ensino superior
234770|Professor de sociologia do ensino superior|Professores de ciências humanas do ensino superior|professor de sociologia do ensino superior
234805|Professor de economia|Professores de ciências econômicas, administrativas e contábeis do ensino superior|professor de economia
234810|Professor de administração|Professores de ciências econômicas, administrativas e contábeis do ensino superior|professor de administracao
234815|Professor de contabilidade|Professores de ciências econômicas, administrativas e contábeis do ensino superior|professor de contabilidade
234905|Professor de artes do espetáculo no ensino superior|Professores de artes do ensino superior|professor de artes do espetaculo no ensino superior
234910|Professor de artes visuais no ensino superior (artes plásticas e multimídia)|Professores de artes do ensino superior|professor de artes visuais no ensino superior (artes plasticas e multimidia)
234915|Professor de música no ensino superior|Professores de artes do ensino superior|professor de musica no ensino superior
239205|Professor de alunos com deficiência auditiva e surdos|Professores de educação especial|professor de alunos com deficiencia auditiva e surdos
239210|Professor de alunos com deficiência física|Professores de educação especial|professor de alunos com deficiencia fisica
239215|Professor de alunos com deficiência mental|Professores de educação especial|professor de alunos com deficiencia mental
239220|Professor de alunos com deficiência múltipla|Professores de educação especial|professor de alunos com deficiencia multipla
239225|Professor de alunos com deficiência visual|Professores de educação especial|professor de alunos com deficiencia visual
239405|Coordenador pedagógico|Programadores, avaliadores e orientadores de ensino|coordenador pedagogico
239410|Orientador educacional|Programadores, avaliadores e orientadores de ensino|orientador educacional
239415|Pedagogo|Programadores, avaliadores e orientadores de ensino|pedagogo
239420|Professor de técnicas e recursos audiovisuais|Programadores, avaliadores e orientadores de ensino|professor de tecnicas e recursos audiovisuais
239425|Psicopedagogo|Programadores, avaliadores e orientadores de ensino|psicopedagogo
239430|Supervisor de ensino|Programadores, avaliadores e orientadores de ensino|supervisor de ensino
239435|Designer educacional|Programadores, avaliadores e orientadores de ensino|designer educacional
239440|Neuropsicopedagogo clinico|Programadores, avaliadores e orientadores de ensino|neuropsicopedagogo clinico
239445|Neuropsicopedagogo institucional|Programadores, avaliadores e orientadores de ensino|neuropsicopedagogo institucional
241005|Advogado|Advogados|advogado
241010|Advogado de empresa|Advogados|advogado de empresa
241015|Advogado (direito civil)|Advogados|advogado (direito civil)
241020|Advogado (direito público)|Advogados|advogado (direito publico)
241025|Advogado (direito penal)|Advogados|advogado (direito penal)
241030|Advogado (áreas especiais)|Advogados|advogado (areas especiais)
241035|Advogado (direito do trabalho)|Advogados|advogado (direito do trabalho)
241040|Consultor jurídico|Advogados|consultor juridico
241205|Advogado da união|Procuradores e advogados públicos|advogado da uniao
241210|Procurador autárquico|Procuradores e advogados públicos|procurador autarquico
241215|Procurador da fazenda nacional|Procuradores e advogados públicos|procurador da fazenda nacional
241220|Procurador do estado|Procuradores e advogados públicos|procurador do estado
241225|Procurador do município|Procuradores e advogados públicos|procurador do municipio
241230|Procurador federal|Procuradores e advogados públicos|procurador federal
241235|Procurador fundacional|Procuradores e advogados públicos|procurador fundacional
241305|Oficial de registro de contratos marítimos|Tabeliães e registradores|oficial de registro de contratos maritimos
241310|Oficial do registro civil de pessoas jurídicas|Tabeliães e registradores|oficial do registro civil de pessoas juridicas
241315|Oficial do registro civil de pessoas naturais|Tabeliães e registradores|oficial do registro civil de pessoas naturais
241320|Oficial do registro de distribuições|Tabeliães e registradores|oficial do registro de distribuicoes
241325|Oficial do registro de imóveis|Tabeliães e registradores|oficial do registro de imoveis
241330|Oficial do registro de títulos e documentos|Tabeliães e registradores|oficial do registro de titulos e documentos
241335|Tabelião de notas|Tabeliães e registradores|tabeliao de notas
241340|Tabelião de protestos|Tabeliães e registradores|tabeliao de protestos
241405|Conselheiro julgador|Conselheiros julgadores|conselheiro julgador
242205|Procurador da república|Membros do ministério público|procurador da republica
242210|Procurador de justiça|Membros do ministério público|procurador de justica
242215|Procurador de justiça militar|Membros do ministério público|procurador de justica militar
242220|Procurador do trabalho|Membros do ministério público|procurador do trabalho
242225|Procurador regional da república|Membros do ministério público|procurador regional da republica
242230|Procurador regional do trabalho|Membros do ministério público|procurador regional do trabalho
242235|Promotor de justiça|Membros do ministério público|promotor de justica
242240|Subprocurador-geral da justiça militar|Membros do ministério público|subprocurador-geral da justica militar
242245|Subprocurador-geral da república|Membros do ministério público|subprocurador-geral da republica
242250|Subprocurador-geral do trabalho|Membros do ministério público|subprocurador-geral do trabalho
242305|Delegado de polícia|Delegados de polícia|delegado de policia
242405|Defensor público|Defensores públicos e procuradores da assistência judiciária|defensor publico
242410|Procurador da assistência judiciária|Defensores públicos e procuradores da assistência judiciária|procurador da assistencia judiciaria
242905|Oficial de inteligência|Profissionais da inteligência|oficial de inteligencia
242910|Oficial técnico de inteligência|Profissionais da inteligência|oficial tecnico de inteligencia
251105|Antropólogo|Profissionais em pesquisa e análise antropológica sociológica|antropologo
251110|Arqueólogo|Profissionais em pesquisa e análise antropológica sociológica|arqueologo
251115|Cientista político|Profissionais em pesquisa e análise antropológica sociológica|cientista politico
251120|Sociólogo|Profissionais em pesquisa e análise antropológica sociológica|sociologo
251205|Economista|Economistas|economista
251210|Economista agroindustrial|Economistas|economista agroindustrial
251215|Economista financeiro|Economistas|economista financeiro
251220|Economista industrial|Economistas|economista industrial
251225|Economista do setor público|Economistas|economista do setor publico
251230|Economista ambiental|Economistas|economista ambiental
251235|Economista regional e urbano|Economistas|economista regional e urbano
251305|Geógrafo|Profissionais em pesquisa e análise geográfica|geografo
251405|Filósofo|Filósofos|filosofo
251505|Psicólogo educacional|Psicólogos e psicanalistas|psicologo educacional
251510|Psicólogo clínico|Psicólogos e psicanalistas|psicologo clinico
251515|Psicólogo do esporte|Psicólogos e psicanalistas|psicologo do esporte
251520|Psicólogo hospitalar|Psicólogos e psicanalistas|psicologo hospitalar
251525|Psicólogo jurídico|Psicólogos e psicanalistas|psicologo juridico
251530|Psicólogo social|Psicólogos e psicanalistas|psicologo social
251535|Psicólogo do trânsito|Psicólogos e psicanalistas|psicologo do transito
251540|Psicólogo do trabalho|Psicólogos e psicanalistas|psicologo do trabalho
251545|Neuropsicólogo|Psicólogos e psicanalistas|neuropsicologo
251550|Psicanalista|Psicólogos e psicanalistas|psicanalista
251555|Psicólogo acupunturista|Psicólogos e psicanalistas|psicologo acupunturista
251605|Assistente social|Assistentes sociais e economistas domésticos|assistente social
251610|Economista doméstico|Assistentes sociais e economistas domésticos|economista domestico
252105|Administrador|Administradores|administrador
252205|Auditor (contadores e afins)|Contadores e afins|auditor (contadores e afins)
252210|Contador|Contadores e afins|contador
252215|Perito contábil|Contadores e afins|perito contabil
252305|Secretário executivo|Secretárias(os) executivas(os) e afins|secretario executivo
252310|Secretário bilíngue|Secretárias(os) executivas(os) e afins|secretario bilingue
252315|Secretário trilíngue|Secretárias(os) executivas(os) e afins|secretario trilingue
252320|Tecnólogo em secretariado escolar|Secretárias(os) executivas(os) e afins|tecnologo em secretariado escolar
252405|Analista de recursos humanos|Profissionais de recursos humanos|analista de recursos humanos
252505|Administrador de fundos e carteiras de investimento|Profissionais de administração ecônomico-financeira|administrador de fundos e carteiras de investimento
252510|Analista de câmbio|Profissionais de administração ecônomico-financeira|analista de cambio
252515|Analista de cobrança (instituições financeiras)|Profissionais de administração ecônomico-financeira|analista de cobranca (instituicoes financeiras)
252525|Analista de crédito (instituições financeiras)|Profissionais de administração ecônomico-financeira|analista de credito (instituicoes financeiras)
252530|Analista de crédito rural|Profissionais de administração ecônomico-financeira|analista de credito rural
252535|Analista de leasing|Profissionais de administração ecônomico-financeira|analista de leasing
252540|Analista de produtos bancários|Profissionais de administração ecônomico-financeira|analista de produtos bancarios
252545|Analista financeiro (instituições financeiras)|Profissionais de administração ecônomico-financeira|analista financeiro (instituicoes financeiras)
252550|Profissional de relações com investidores|Profissionais de administração ecônomico-financeira|profissional de relacoes com investidores
252605|Gestor em segurança|Profissionais da administração dos serviços de segurança|gestor em seguranca
252705|Analista de pcp (programação e controle da produção)|Profissionais de planejamento, programação e controles logisticos|analista de pcp (programacao e controle da producao)
252710|Analista de planejamento de materias|Profissionais de planejamento, programação e controles logisticos|analista de planejamento de materias
252715|Analista de logistica|Profissionais de planejamento, programação e controles logisticos|analista de logistica
252720|Analista de projetos logisticos|Profissionais de planejamento, programação e controles logisticos|analista de projetos logisticos
252725|Analista de gestão de estoque|Profissionais de planejamento, programação e controles logisticos|analista de gestao de estoque
253110|Redator de publicidade|Profissionais de publicidade|redator de publicidade
253115|Publicitário|Profissionais de publicidade|publicitario
253120|Diretor de mídia (publicidade)|Profissionais de publicidade|diretor de midia (publicidade)
253125|Diretor de arte (publicidade)|Profissionais de publicidade|diretor de arte (publicidade)
253130|Diretor de criação|Profissionais de publicidade|diretor de criacao
253135|Diretor de contas (publicidade)|Profissionais de publicidade|diretor de contas (publicidade)
253140|Agenciador de propaganda|Profissionais de publicidade|agenciador de propaganda
253205|Gerente de captação (fundos e investimentos institucionais)|Profissionais de comercializacão e consultoria de serviços bancários|gerente de captacao (fundos e investimentos institucionais)
253210|Gerente de clientes especiais (private)|Profissionais de comercializacão e consultoria de serviços bancários|gerente de clientes especiais (private)
253215|Gerente de contas - pessoa física e jurídica|Profissionais de comercializacão e consultoria de serviços bancários|gerente de contas - pessoa fisica e juridica
253220|Gerente de grandes contas (corporate)|Profissionais de comercializacão e consultoria de serviços bancários|gerente de grandes contas (corporate)
253225|Operador de negócios|Profissionais de comercializacão e consultoria de serviços bancários|operador de negocios
253305|Corretor de valores, ativos financeiros, mercadorias e derivativos|Corretores de valores, ativos financeiros, mercadorias e derivativos|corretor de valores, ativos financeiros, mercadorias e derivativos
253405|Analista de mídias sociais|Profissionais de mídias digitais e afins|analista de midias sociais
253410|Influenciador digital|Profissionais de mídias digitais e afins|influenciador digital
254105|Auditor-fiscal da receita federal|Auditores fiscais e técnicos da receita federal|auditor-fiscal da receita federal
254110|Técnico da receita federal|Auditores fiscais e técnicos da receita federal|tecnico da receita federal
254205|Auditor-fiscal da previdência social|Auditores fiscais da previdência social|auditor-fiscal da previdencia social
254305|Auditor-fiscal do trabalho|Auditores fiscais do trabalho|auditor-fiscal do trabalho
254310|Agente de higiene e segurança|Auditores fiscais do trabalho|agente de higiene e seguranca
254405|Fiscal de tributos estadual|Fiscais de tributos estaduais e municipais|fiscal de tributos estadual
254410|Fiscal de tributos municipal|Fiscais de tributos estaduais e municipais|fiscal de tributos municipal
254415|Técnico de tributos estadual|Fiscais de tributos estaduais e municipais|tecnico de tributos estadual
254420|Técnico de tributos municipal|Fiscais de tributos estaduais e municipais|tecnico de tributos municipal
254505|Fiscal de atividades urbanas|Profissionais da fiscalização de atividades urbanas|fiscal de atividades urbanas
261105|Arquivista pesquisador (jornalismo)|Profissionais do jornalismo|arquivista pesquisador (jornalismo)
261110|Assessor de imprensa|Profissionais do jornalismo|assessor de imprensa
261115|Diretor de redação|Profissionais do jornalismo|diretor de redacao
261120|Editor|Profissionais do jornalismo|editor
261125|Jornalista|Profissionais do jornalismo|jornalista
261130|Produtor de texto|Profissionais do jornalismo|produtor de texto
261135|Repórter (exclusive rádio e televisão)|Profissionais do jornalismo|reporter (exclusive radio e televisao)
261140|Revisor de texto|Profissionais do jornalismo|revisor de texto
261205|Bibliotecário|Profissionais da informação|bibliotecario
261210|Documentalista|Profissionais da informação|documentalista
261215|Analista de informações (pesquisador de informações de rede)|Profissionais da informação|analista de informacoes (pesquisador de informacoes de rede)
261305|Arquivista|Arquivistas e museólogos|arquivista
261310|Museólogo|Arquivistas e museólogos|museologo
261405|Filólogo|Filólogos,tradutores ,intérpretes e afins|filologo
261410|Intérprete|Filólogos,tradutores ,intérpretes e afins|interprete
261415|Linguista|Filólogos,tradutores ,intérpretes e afins|linguista
261420|Tradutor|Filólogos,tradutores ,intérpretes e afins|tradutor
261425|Intérprete de língua de sinais|Filólogos,tradutores ,intérpretes e afins|interprete de lingua de sinais
261430|Audiodescritor|Filólogos,tradutores ,intérpretes e afins|audiodescritor
261505|Autor-roteirista|Profissionais da escrita|autor-roteirista
261510|Crítico|Profissionais da escrita|critico
261515|Escritor de ficção|Profissionais da escrita|escritor de ficcao
261520|Escritor de não ficção|Profissionais da escrita|escritor de nao ficcao
261525|Poeta|Profissionais da escrita|poeta
261530|Redator de textos técnicos|Profissionais da escrita|redator de textos tecnicos
261605|Editor de jornal|Editores|editor de jornal
261610|Editor de livro|Editores|editor de livro
261615|Editor de mídia eletrônica|Editores|editor de midia eletronica
261620|Editor de revista|Editores|editor de revista
261625|Editor de revista científica|Editores|editor de revista cientifica
261705|Âncora de mídias audiovisuais|Locutores, comentaristas e repórteres de mídias audiovisuais|ancora de midias audiovisuais
261710|Comentarista de mídias audiovisuais|Locutores, comentaristas e repórteres de mídias audiovisuais|comentarista de midias audiovisuais
261715|Locutor de mídias audiovisuais|Locutores, comentaristas e repórteres de mídias audiovisuais|locutor de midias audiovisuais
261730|Repórter de mídias audiovisuais|Locutores, comentaristas e repórteres de mídias audiovisuais|reporter de midias audiovisuais
261805|Fotógrafo|Fotógrafos profissionais|fotografo
261810|Fotógrafo publicitário|Fotógrafos profissionais|fotografo publicitario
261815|Fotógrafo retratista|Fotógrafos profissionais|fotografo retratista
261820|Repórter fotográfico|Fotógrafos profissionais|reporter fotografico
261905|Continuista|Assistentes de direção (tv) e continuístas|continuista
261910|Assistente de direção (tv)|Assistentes de direção (tv) e continuístas|assistente de direcao (tv)
262105|Produtor cultural|Produtores artísticos e culturais|produtor cultural
262110|Produtor cinematográfico|Produtores artísticos e culturais|produtor cinematografico
262115|Produtor de rádio|Produtores artísticos e culturais|produtor de radio
262120|Produtor de teatro|Produtores artísticos e culturais|produtor de teatro
262125|Produtor de televisão|Produtores artísticos e culturais|produtor de televisao
262130|Tecnólogo em produção fonográfica|Produtores artísticos e culturais|tecnologo em producao fonografica
262135|Tecnólogo em produção audiovisual|Produtores artísticos e culturais|tecnologo em producao audiovisual
262205|Diretor de cinema|Diretores artísticos, de espetáculos e afins|diretor de cinema
262210|Diretor de programas de rádio|Diretores artísticos, de espetáculos e afins|diretor de programas de radio
262215|Diretor de programas de televisão|Diretores artísticos, de espetáculos e afins|diretor de programas de televisao
262220|Diretor teatral|Diretores artísticos, de espetáculos e afins|diretor teatral
262225|Diretor de programação|Diretores artísticos, de espetáculos e afins|diretor de programacao
262230|Diretor de produção|Diretores artísticos, de espetáculos e afins|diretor de producao
262235|Diretor artístico|Diretores artísticos, de espetáculos e afins|diretor artistico
262240|Diretor de elenco (audiovisual)|Diretores artísticos, de espetáculos e afins|diretor de elenco (audiovisual)
262245|Diretor de animação (audiovisual)|Diretores artísticos, de espetáculos e afins|diretor de animacao (audiovisual)
262305|Cenógrafo carnavalesco e de festas populares|Cenógrafos|cenografo carnavalesco e de festas populares
262310|Cenógrafo de cinema|Cenógrafos|cenografo de cinema
262315|Cenógrafo de eventos|Cenógrafos|cenografo de eventos
262320|Cenógrafo de teatro|Cenógrafos|cenografo de teatro
262325|Cenógrafo de tv|Cenógrafos|cenografo de tv
262330|Diretor de arte|Cenógrafos|diretor de arte
262335|Produtor de arte (audiovisual)|Cenógrafos|produtor de arte (audiovisual)
262405|Artista (artes visuais)|Artistas visuais, desenhistas industriais e conservadores-restauradores de bens culturais|artista (artes visuais)
262410|Desenhista industrial gráfico (designer gráfico)|Artistas visuais, desenhistas industriais e conservadores-restauradores de bens culturais|desenhista industrial grafico (designer grafico)
262415|Conservador-restaurador de bens  culturais|Artistas visuais, desenhistas industriais e conservadores-restauradores de bens culturais|conservador-restaurador de bens  culturais
262420|Desenhista industrial de produto (designer de produto)|Artistas visuais, desenhistas industriais e conservadores-restauradores de bens culturais|desenhista industrial de produto (designer de produto)
262425|Desenhista industrial de produto de moda (designer de moda)|Artistas visuais, desenhistas industriais e conservadores-restauradores de bens culturais|desenhista industrial de produto de moda (designer de moda)
262430|Artista visual de jogos eletrônicos|Artistas visuais, desenhistas industriais e conservadores-restauradores de bens culturais|artista visual de jogos eletronicos
262435|Designer de jogos eletrônicos|Artistas visuais, desenhistas industriais e conservadores-restauradores de bens culturais|designer de jogos eletronicos
262440|Designer de narrativa de jogos eletrônicos|Artistas visuais, desenhistas industriais e conservadores-restauradores de bens culturais|designer de narrativa de jogos eletronicos
262505|Ator|Atores|ator
262605|Compositor|Músicos compositores, arranjadores, regentes e musicólogos|compositor
262610|Músico arranjador|Músicos compositores, arranjadores, regentes e musicólogos|musico arranjador
262615|Músico regente|Músicos compositores, arranjadores, regentes e musicólogos|musico regente
262620|Musicólogo|Músicos compositores, arranjadores, regentes e musicólogos|musicologo
262705|Músico intérprete cantor|Músicos intérpretes|musico interprete cantor
262710|Músico intérprete instrumentista|Músicos intérpretes|musico interprete instrumentista
262805|Assistente de coreografia|Artistas da dança (exceto dança tradicional e popular)|assistente de coreografia
262810|Bailarino (exceto danças populares)|Artistas da dança (exceto dança tradicional e popular)|bailarino (exceto dancas populares)
262815|Coreógrafo|Artistas da dança (exceto dança tradicional e popular)|coreografo
262820|Dramaturgo de dança|Artistas da dança (exceto dança tradicional e popular)|dramaturgo de danca
262825|Ensaiador de dança|Artistas da dança (exceto dança tradicional e popular)|ensaiador de danca
262830|Professor de dança|Artistas da dança (exceto dança tradicional e popular)|professor de danca
262905|Decorador de interiores de nível superior|Designer de interiores de nível superior|decorador de interiores de nivel superior
263105|Ministro de culto religioso|Ministros de culto, missionários, teólogos e profissionais assemelhados|ministro de culto religioso
263110|Missionário|Ministros de culto, missionários, teólogos e profissionais assemelhados|missionario
263115|Teólogo|Ministros de culto, missionários, teólogos e profissionais assemelhados|teologo
271105|Chefe de cozinha|Chefes de cozinha e afins|chefe de cozinha
271110|Tecnólogo em gastronomia|Chefes de cozinha e afins|tecnologo em gastronomia
300105|Técnico em mecatrônica - automação da manufatura|Técnicos em mecatrônica|tecnico em mecatronica - automacao da manufatura
300110|Técnico em mecatrônica - robótica|Técnicos em mecatrônica|tecnico em mecatronica - robotica
300305|Técnico em eletromecânica|Técnicos em eletromecânica|tecnico em eletromecanica
301105|Técnico de laboratório industrial|Técnicos de laboratório industrial|tecnico de laboratorio industrial
301110|Técnico de laboratório de análises físico-químicas (materiais de construção)|Técnicos de laboratório industrial|tecnico de laboratorio de analises fisico-quimicas (materiais de construcao)
301115|Técnico químico de petróleo|Técnicos de laboratório industrial|tecnico quimico de petroleo
301205|Técnico de apoio à bioengenharia|Técnicos de apoio à bioengenharia|tecnico de apoio a bioengenharia
311105|Técnico químico|Técnicos químicos|tecnico quimico
311110|Técnico de celulose e papel|Técnicos químicos|tecnico de celulose e papel
311115|Técnico em curtimento|Técnicos químicos|tecnico em curtimento
311205|Técnico em petroquímica|Técnicos de produção de indústrias químicas, petroquímicas, refino de petróleo, gás e afins|tecnico em petroquimica
311305|Técnico em materiais, produtos cerâmicos e vidros|Técnicos em materiais, produtos cerâmicos e vidros|tecnico em materiais, produtos ceramicos e vidros
311405|Técnico em borracha|Técnicos em fabricação de produtos plásticos e de borracha|tecnico em borracha
311410|Técnico em plástico|Técnicos em fabricação de produtos plásticos e de borracha|tecnico em plastico
311505|Técnico de controle de meio ambiente|Técnicos em controle ambiental, utilidades e tratamento de efluentes|tecnico de controle de meio ambiente
311510|Técnico de meteorologia|Técnicos em controle ambiental, utilidades e tratamento de efluentes|tecnico de meteorologia
311515|Técnico de utilidade (produção e distribuição de vapor, gases, óleos, combustíveis, energia)|Técnicos em controle ambiental, utilidades e tratamento de efluentes|tecnico de utilidade (producao e distribuicao de vapor, gases, oleos, combustiveis, energia)
311520|Técnico em tratamento de efluentes|Técnicos em controle ambiental, utilidades e tratamento de efluentes|tecnico em tratamento de efluentes
311605|Técnico têxtil|Técnicos têxteis|tecnico textil
311610|Técnico têxtil (tratamentos químicos)|Técnicos têxteis|tecnico textil (tratamentos quimicos)
311615|Técnico têxtil de fiação|Técnicos têxteis|tecnico textil de fiacao
311620|Técnico têxtil de malharia|Técnicos têxteis|tecnico textil de malharia
311625|Técnico têxtil de tecelagem|Técnicos têxteis|tecnico textil de tecelagem
311705|Colorista de papel|Coloristas|colorista de papel
311710|Colorista têxtil|Coloristas|colorista textil
311715|Preparador de tintas|Coloristas|preparador de tintas
311720|Preparador de tintas (fábrica de tecidos)|Coloristas|preparador de tintas (fabrica de tecidos)
311725|Tingidor de couros|Coloristas|tingidor de couros
312105|Técnico de obras civis|Técnicos em construção civil (edificações)|tecnico de obras civis
312205|Técnico de estradas|Técnicos em construção civil (obras de infraestrutura)|tecnico de estradas
312210|Técnico de saneamento|Técnicos em construção civil (obras de infraestrutura)|tecnico de saneamento
312305|Técnico em agrimensura|Técnicos em geomática|tecnico em agrimensura
312310|Técnico em geodésia e cartografia|Técnicos em geomática|tecnico em geodesia e cartografia
312315|Técnico em hidrografia|Técnicos em geomática|tecnico em hidrografia
312320|Topógrafo|Técnicos em geomática|topografo
313105|Eletrotécnico|Técnicos em eletricidade e eletrotécnica|eletrotecnico
313110|Eletrotécnico (produção de energia)|Técnicos em eletricidade e eletrotécnica|eletrotecnico (producao de energia)
313115|Eletrotécnico na fabricação, montagem e instalação de máquinas e equipamentos|Técnicos em eletricidade e eletrotécnica|eletrotecnico na fabricacao, montagem e instalacao de maquinas e equipamentos
313120|Técnico de manutenção elétrica|Técnicos em eletricidade e eletrotécnica|tecnico de manutencao eletrica
313125|Técnico de manutenção elétrica de máquina|Técnicos em eletricidade e eletrotécnica|tecnico de manutencao eletrica de maquina
313130|Técnico eletricista|Técnicos em eletricidade e eletrotécnica|tecnico eletricista
313205|Técnico de manutenção eletrônica|Técnicos em eletrônica|tecnico de manutencao eletronica
313210|Técnico de manutenção eletrônica (circuitos de máquinas com comando numérico)|Técnicos em eletrônica|tecnico de manutencao eletronica (circuitos de maquinas com comando numerico)
313215|Técnico eletrônico|Técnicos em eletrônica|tecnico eletronico
313220|Técnico em manutenção de equipamentos de informática|Técnicos em eletrônica|tecnico em manutencao de equipamentos de informatica
313305|Técnico de comunicação de dados (telecomunicações)|Técnicos em telecomunicações|tecnico de comunicacao de dados (telecomunicacoes)
313310|Técnico de rede (telecomunicações)|Técnicos em telecomunicações|tecnico de rede (telecomunicacoes)
313315|Técnico de telecomunicações (telefonia)|Técnicos em telecomunicações|tecnico de telecomunicacoes (telefonia)
313320|Técnico de transmissão (telecomunicações)|Técnicos em telecomunicações|tecnico de transmissao (telecomunicacoes)
313405|Técnico em calibração|Técnicos em calibração e instrumentação|tecnico em calibracao
313410|Técnico em instrumentação|Técnicos em calibração e instrumentação|tecnico em instrumentacao
313415|Encarregado de manutenção de instrumentos de controle, medição e similares|Técnicos em calibração e instrumentação|encarregado de manutencao de instrumentos de controle, medicao e similares
313505|Técnico em fotônica|Técnicos em fotônica|tecnico em fotonica
314105|Técnico em mecânica de precisão|Técnicos mecânicos na fabricação e montagem de máquinas, sistemas e instrumentos|tecnico em mecanica de precisao
314110|Técnico mecânico|Técnicos mecânicos na fabricação e montagem de máquinas, sistemas e instrumentos|tecnico mecanico
314115|Técnico mecânico (calefação, ventilação, refrigeração e climatização)|Técnicos mecânicos na fabricação e montagem de máquinas, sistemas e instrumentos|tecnico mecanico (calefacao, ventilacao, refrigeracao e climatizacao)
314120|Técnico mecânico (máquinas)|Técnicos mecânicos na fabricação e montagem de máquinas, sistemas e instrumentos|tecnico mecanico (maquinas)
314125|Técnico mecânico (motores)|Técnicos mecânicos na fabricação e montagem de máquinas, sistemas e instrumentos|tecnico mecanico (motores)
314205|Técnico mecânico na fabricação de ferramentas|Técnicos mecânicos (ferramentas)|tecnico mecanico na fabricacao de ferramentas
314210|Técnico mecânico na manutenção de ferramentas|Técnicos mecânicos (ferramentas)|tecnico mecanico na manutencao de ferramentas
314305|Técnico em automobilística|Técnicos em mecânica veicular|tecnico em automobilistica
314310|Técnico mecânico (aeronaves)|Técnicos em mecânica veicular|tecnico mecanico (aeronaves)
314315|Técnico mecânico (embarcações)|Técnicos em mecânica veicular|tecnico mecanico (embarcacoes)
314405|Técnico de manutenção de sistemas e instrumentos|Técnicos mecânicos na manutenção de máquinas, sistemas e instrumentos|tecnico de manutencao de sistemas e instrumentos
314410|Técnico em manutenção de máquinas|Técnicos mecânicos na manutenção de máquinas, sistemas e instrumentos|tecnico em manutencao de maquinas
314610|Técnico em caldeiraria|Técnicos em metalurgia (estruturas metálicas)|tecnico em caldeiraria
314615|Técnico em estruturas metálicas|Técnicos em metalurgia (estruturas metálicas)|tecnico em estruturas metalicas
314620|Técnico em soldagem|Técnicos em metalurgia (estruturas metálicas)|tecnico em soldagem
314625|Tecnólogo em soldagem|Técnicos em metalurgia (estruturas metálicas)|tecnologo em soldagem
314705|Técnico de acabamento em siderurgia|Técnicos em siderurgia|tecnico de acabamento em siderurgia
314710|Técnico de aciaria em siderurgia|Técnicos em siderurgia|tecnico de aciaria em siderurgia
314715|Técnico de fundição em siderurgia|Técnicos em siderurgia|tecnico de fundicao em siderurgia
314720|Técnico de laminação em siderurgia|Técnicos em siderurgia|tecnico de laminacao em siderurgia
314725|Técnico de redução na siderurgia (primeira fusão)|Técnicos em siderurgia|tecnico de reducao na siderurgia (primeira fusao)
314730|Técnico de refratário em siderurgia|Técnicos em siderurgia|tecnico de refratario em siderurgia
314805|Inspetor de equipamentos|Especialistas em inspeções industriais|inspetor de equipamentos
314810|Inspetor de fabricação|Especialistas em inspeções industriais|inspetor de fabricacao
314815|Inspetor de ensaios não destrutivos|Especialistas em inspeções industriais|inspetor de ensaios nao destrutivos
314825|Inspetor de dutos|Especialistas em inspeções industriais|inspetor de dutos
314830|Inspetor de controle dimensional|Especialistas em inspeções industriais|inspetor de controle dimensional
314835|Inspetor de pintura|Especialistas em inspeções industriais|inspetor de pintura
314840|Inspetor de manutenção|Especialistas em inspeções industriais|inspetor de manutencao
314845|Inspetor de soldagem|Especialistas em inspeções industriais|inspetor de soldagem
316105|Técnico em geofísica|Técnicos em geologia|tecnico em geofisica
316110|Técnico em geologia|Técnicos em geologia|tecnico em geologia
316115|Técnico em geoquímica|Técnicos em geologia|tecnico em geoquimica
316120|Técnico em geotecnia|Técnicos em geologia|tecnico em geotecnia
316305|Técnico de mineração|Técnicos em mineração|tecnico de mineracao
316310|Técnico de mineração (óleo e petróleo)|Técnicos em mineração|tecnico de mineracao (oleo e petroleo)
316315|Técnico em processamento mineral (exceto petróleo)|Técnicos em mineração|tecnico em processamento mineral (exceto petroleo)
316320|Técnico em pesquisa mineral|Técnicos em mineração|tecnico em pesquisa mineral
316325|Técnico de produção em refino de petróleo|Técnicos em mineração|tecnico de producao em refino de petroleo
316330|Técnico em planejamento de lavra de minas|Técnicos em mineração|tecnico em planejamento de lavra de minas
316335|Desincrustador (poços de petróleo)|Técnicos em mineração|desincrustador (pocos de petroleo)
316340|Cimentador (poços de petróleo)|Técnicos em mineração|cimentador (pocos de petroleo)
317105|Desenvolvedor web (técnico)|Técnicos de desenvolvimento de sistemas e aplicações|desenvolvedor web (tecnico)
317110|Desenvolvedor de sistemas de tecnologia da informação (técnico)|Técnicos de desenvolvimento de sistemas e aplicações|desenvolvedor de sistemas de tecnologia da informacao (tecnico)
317115|Programador de máquinas - ferramenta com comando numérico|Técnicos de desenvolvimento de sistemas e aplicações|programador de maquinas - ferramenta com comando numerico
317120|Desenvolvedor de aplicativos|Técnicos de desenvolvimento de sistemas e aplicações|desenvolvedor de aplicativos
317205|Operador de computador|Técnicos de suporte e monitoração ao usuário de tecnologia da informação.|operador de computador
317210|Técnico de suporte ao usuário de tecnologia da informação|Técnicos de suporte e monitoração ao usuário de tecnologia da informação.|tecnico de suporte ao usuario de tecnologia da informacao
318005|Desenhista técnico|Desenhistas técnicos, em geral|desenhista tecnico
318010|Desenhista copista|Desenhistas técnicos, em geral|desenhista copista
318015|Desenhista detalhista|Desenhistas técnicos, em geral|desenhista detalhista
318105|Desenhista técnico (arquitetura)|Desenhistas técnicos da construção civil e arquitetura|desenhista tecnico (arquitetura)
318110|Desenhista técnico (cartografia)|Desenhistas técnicos da construção civil e arquitetura|desenhista tecnico (cartografia)
318115|Desenhista técnico (construção civil)|Desenhistas técnicos da construção civil e arquitetura|desenhista tecnico (construcao civil)
318120|Desenhista técnico (instalações hidrossanitárias)|Desenhistas técnicos da construção civil e arquitetura|desenhista tecnico (instalacoes hidrossanitarias)
318205|Desenhista técnico mecânico|Desenhistas técnicos da mecânica|desenhista tecnico mecanico
318210|Desenhista técnico aeronáutico|Desenhistas técnicos da mecânica|desenhista tecnico aeronautico
318215|Desenhista técnico naval|Desenhistas técnicos da mecânica|desenhista tecnico naval
318305|Desenhista técnico (eletricidade e eletrônica)|Desenhistas técnicos em eletricidade, eletrônica, eletromecânica, calefação, ventilação e refrigeração|desenhista tecnico (eletricidade e eletronica)
318310|Desenhista técnico (calefação, ventilação e refrigeração)|Desenhistas técnicos em eletricidade, eletrônica, eletromecânica, calefação, ventilação e refrigeração|desenhista tecnico (calefacao, ventilacao e refrigeracao)
318405|Desenhista técnico (artes gráficas)|Desenhistas técnicos de produtos e serviços diversos|desenhista tecnico (artes graficas)
318410|Desenhista técnico (ilustrações artísticas)|Desenhistas técnicos de produtos e serviços diversos|desenhista tecnico (ilustracoes artisticas)
318415|Desenhista técnico (ilustrações técnicas)|Desenhistas técnicos de produtos e serviços diversos|desenhista tecnico (ilustracoes tecnicas)
318420|Desenhista técnico (indústria têxtil)|Desenhistas técnicos de produtos e serviços diversos|desenhista tecnico (industria textil)
318425|Desenhista técnico (mobiliário)|Desenhistas técnicos de produtos e serviços diversos|desenhista tecnico (mobiliario)
318430|Desenhista técnico de embalagens, maquetes e leiautes|Desenhistas técnicos de produtos e serviços diversos|desenhista tecnico de embalagens, maquetes e leiautes
318505|Desenhista projetista de arquitetura|Desenhistas projetistas de construção civil e arquitetura|desenhista projetista de arquitetura
318510|Desenhista projetista de construção civil|Desenhistas projetistas de construção civil e arquitetura|desenhista projetista de construcao civil
318605|Desenhista projetista de máquinas|Desenhistas projetistas da mecânica|desenhista projetista de maquinas
318610|Desenhista projetista mecânico|Desenhistas projetistas da mecânica|desenhista projetista mecanico
318705|Desenhista projetista de eletricidade|Desenhistas projetistas de eletricidade e eletrônica|desenhista projetista de eletricidade
318710|Desenhista projetista eletrônico|Desenhistas projetistas de eletricidade e eletrônica|desenhista projetista eletronico
318805|Projetista de móveis|Desenhistas projetistas e modelistas de produtos e serviços diversos|projetista de moveis
318810|Modelista de roupas|Desenhistas projetistas e modelistas de produtos e serviços diversos|modelista de roupas
318815|Modelista de calçados|Desenhistas projetistas e modelistas de produtos e serviços diversos|modelista de calcados
319105|Técnico em calçados e artefatos de couro|Técnicos do vestuário|tecnico em calcados e artefatos de couro
319110|Técnico em confecções do vestuário|Técnicos do vestuário|tecnico em confeccoes do vestuario
319205|Técnico do mobiliário|Técnicos do mobiliário e afins|tecnico do mobiliario
320105|Técnico em bioterismo|Técnicos em biologia|tecnico em bioterismo
320110|Técnico em histologia|Técnicos em biologia|tecnico em histologia
321105|Técnico agrícola|Técnicos agrícolas|tecnico agricola
321110|Técnico agropecuário|Técnicos agrícolas|tecnico agropecuario
321205|Técnico em madeira|Técnicos florestais|tecnico em madeira
321210|Técnico florestal|Técnicos florestais|tecnico florestal
321305|Técnico em piscicultura|Técnicos em aqüicultura|tecnico em piscicultura
321310|Técnico em carcinicultura|Técnicos em aqüicultura|tecnico em carcinicultura
321315|Técnico em mitilicultura|Técnicos em aqüicultura|tecnico em mitilicultura
321320|Técnico em ranicultura|Técnicos em aqüicultura|tecnico em ranicultura
322110|Podólogo|Tecnólogos e técnicos em terapias complementares e estéticas|podologo
322130|Esteticista|Tecnólogos e técnicos em terapias complementares e estéticas|esteticista
322135|Doula|Tecnólogos e técnicos em terapias complementares e estéticas|doula
322140|Instrutor de pilates|Tecnólogos e técnicos em terapias complementares e estéticas|instrutor de pilates
322205|Técnico de enfermagem|Técnicos e auxiliares de enfermagem|tecnico de enfermagem
322210|Técnico de enfermagem de terapia intensiva|Técnicos e auxiliares de enfermagem|tecnico de enfermagem de terapia intensiva
322215|Técnico de enfermagem do trabalho|Técnicos e auxiliares de enfermagem|tecnico de enfermagem do trabalho
322220|Técnico de enfermagem psiquiátrica|Técnicos e auxiliares de enfermagem|tecnico de enfermagem psiquiatrica
322225|Instrumentador cirúrgico|Técnicos e auxiliares de enfermagem|instrumentador cirurgico
322230|Auxiliar de enfermagem|Técnicos e auxiliares de enfermagem|auxiliar de enfermagem
322235|Auxiliar de enfermagem do trabalho|Técnicos e auxiliares de enfermagem|auxiliar de enfermagem do trabalho
322240|Auxiliar de saúde (navegação marítima)|Técnicos e auxiliares de enfermagem|auxiliar de saude (navegacao maritima)
322245|Técnico de enfermagem da estratégia de saúde da família|Técnicos e auxiliares de enfermagem|tecnico de enfermagem da estrategia de saude da familia
322250|Auxiliar de enfermagem da estratégia de saúde da família|Técnicos e auxiliares de enfermagem|auxiliar de enfermagem da estrategia de saude da familia
322255|Técnico em agente comunitário de saúde|Técnicos e auxiliares de enfermagem|tecnico em agente comunitario de saude
322305|Técnico em óptica e optometria|Técnicos em óptica e optometria|tecnico em optica e optometria
322405|Técnico em saúde bucal|Técnicos de odontologia|tecnico em saude bucal
322410|Protético dentário|Técnicos de odontologia|protetico dentario
322415|Auxiliar em saúde bucal|Técnicos de odontologia|auxiliar em saude bucal
322420|Auxiliar de prótese dentária|Técnicos de odontologia|auxiliar de protese dentaria
322425|Técnico em saúde bucal da estratégia de saúde da família|Técnicos de odontologia|tecnico em saude bucal da estrategia de saude da familia
322430|Auxiliar em saúde bucal da estratégia de saúde da família|Técnicos de odontologia|auxiliar em saude bucal da estrategia de saude da familia
322505|Técnico de ortopedia|Técnicos em próteses ortopédicas|tecnico de ortopedia
322605|Técnico de imobilização ortopédica|Técnicos de imobilizações ortopédicas|tecnico de imobilizacao ortopedica
322705|Técnico em acupuntura|Técnicos e profissionais em práticas integrativas e complementares (pics)|tecnico em acupuntura
322710|Técnico em quiropraxia|Técnicos e profissionais em práticas integrativas e complementares (pics)|tecnico em quiropraxia
322715|Massoterapeuta|Técnicos e profissionais em práticas integrativas e complementares (pics)|massoterapeuta
322720|Terapeuta holístico|Técnicos e profissionais em práticas integrativas e complementares (pics)|terapeuta holistico
322725|Facilitador de biodança|Técnicos e profissionais em práticas integrativas e complementares (pics)|facilitador de biodanca
322730|Terapeuta reiki|Técnicos e profissionais em práticas integrativas e complementares (pics)|terapeuta reiki
322735|Instrutor de yoga|Técnicos e profissionais em práticas integrativas e complementares (pics)|instrutor de yoga
322740|Instrutor de meditação|Técnicos e profissionais em práticas integrativas e complementares (pics)|instrutor de meditacao
322745|Facilitador de grupos de movimento(bioernergética)|Técnicos e profissionais em práticas integrativas e complementares (pics)|facilitador de grupos de movimento(bioernergetica)
323105|Técnico em pecuária|Técnicos em pecuária|tecnico em pecuaria
324105|Técnico em métodos eletrográficos em encefalografia|Tecnólogos e técnicos em métodos de diagnósticos e terapêutica|tecnico em metodos eletrograficos em encefalografia
324110|Técnico em métodos gráficos em cardiologia|Tecnólogos e técnicos em métodos de diagnósticos e terapêutica|tecnico em metodos graficos em cardiologia
324115|Técnico em radiologia e imagenologia|Tecnólogos e técnicos em métodos de diagnósticos e terapêutica|tecnico em radiologia e imagenologia
324120|Tecnólogo em radiologia|Tecnólogos e técnicos em métodos de diagnósticos e terapêutica|tecnologo em radiologia
324125|Tecnólogo oftálmico|Tecnólogos e técnicos em métodos de diagnósticos e terapêutica|tecnologo oftalmico
324130|Técnico em espirometria|Tecnólogos e técnicos em métodos de diagnósticos e terapêutica|tecnico em espirometria
324135|Técnico em polissonografia|Tecnólogos e técnicos em métodos de diagnósticos e terapêutica|tecnico em polissonografia
324140|Dosimetrista clínico|Tecnólogos e técnicos em métodos de diagnósticos e terapêutica|dosimetrista clinico
324205|Técnico em patologia clínica|Técnicos de laboratórios de saúde e bancos de sangue|tecnico em patologia clinica
324215|Citotécnico|Técnicos de laboratórios de saúde e bancos de sangue|citotecnico
324220|Técnico em hemoterapia|Técnicos de laboratórios de saúde e bancos de sangue|tecnico em hemoterapia
325005|Enólogo|Enólogos, perfumistas e aromistas|enologo
325010|Aromista|Enólogos, perfumistas e aromistas|aromista
325015|Perfumista|Enólogos, perfumistas e aromistas|perfumista
325105|Auxiliar técnico em laboratório de farmácia|Técnico em farmácia e em manipulação farmacêutica|auxiliar tecnico em laboratorio de farmacia
325110|Técnico em laboratório de farmácia|Técnico em farmácia e em manipulação farmacêutica|tecnico em laboratorio de farmacia
325115|Técnico em farmácia|Técnico em farmácia e em manipulação farmacêutica|tecnico em farmacia
325205|Técnico de alimentos|Técnicos em produção, conservação  e de qualidade de alimentos|tecnico de alimentos
325210|Técnico em nutrição e dietética|Técnicos em produção, conservação  e de qualidade de alimentos|tecnico em nutricao e dietetica
325305|Técnico em biotecnologia|Técnicos de apoio à biotecnologia|tecnico em biotecnologia
325310|Técnico em imunobiológicos|Técnicos de apoio à biotecnologia|tecnico em imunobiologicos
328105|Embalsamador|Técnicos em necrópsia e taxidermistas|embalsamador
328110|Taxidermista|Técnicos em necrópsia e taxidermistas|taxidermista
331105|Professor de nível médio na educação infantil|Professores de nível médio na educação infantil|professor de nivel medio na educacao infantil
331110|Auxiliar de desenvolvimento infantil|Professores de nível médio na educação infantil|auxiliar de desenvolvimento infantil
331205|Professor de nível médio no ensino fundamental|Professores de nível médio no ensino fundamental|professor de nivel medio no ensino fundamental
331305|Professor de nível médio no ensino profissionalizante|Professores de nível médio no ensino profissionalizante|professor de nivel medio no ensino profissionalizante
332105|Professor leigo no ensino fundamental|Professores leigos no ensino fundamental|professor leigo no ensino fundamental
332205|Professor prático no ensino profissionalizante|Professores práticos no ensino profissionalizante|professor pratico no ensino profissionalizante
333105|Instrutor de auto-escola|Educadores, instrutores e mestres de cursos livres e de culturas tradicionais e populares|instrutor de auto-escola
333110|Instrutor de cursos livres|Educadores, instrutores e mestres de cursos livres e de culturas tradicionais e populares|instrutor de cursos livres
333115|Professores de cursos livres|Educadores, instrutores e mestres de cursos livres e de culturas tradicionais e populares|professores de cursos livres
333120|Mestre das culturas populares e tradicionais|Educadores, instrutores e mestres de cursos livres e de culturas tradicionais e populares|mestre das culturas populares e tradicionais
334105|Inspetor de alunos de escola privada|Inspetores de alunos e afins|inspetor de alunos de escola privada
334110|Inspetor de alunos de escola pública|Inspetores de alunos e afins|inspetor de alunos de escola publica
334115|Monitor de transporte escolar|Inspetores de alunos e afins|monitor de transporte escolar
341105|Piloto comercial (exceto linhas aéreas)|Pilotos de aviação comercial, mecânicos de voo e afins|piloto comercial (exceto linhas aereas)
341110|Piloto comercial de helicóptero (exceto linhas aéreas)|Pilotos de aviação comercial, mecânicos de voo e afins|piloto comercial de helicoptero (exceto linhas aereas)
341115|Mecânico de voo|Pilotos de aviação comercial, mecânicos de voo e afins|mecanico de voo
341120|Piloto agrícola|Pilotos de aviação comercial, mecânicos de voo e afins|piloto agricola
341205|Contramestre de cabotagem|Técnicos marítimos, fluviários e pescadores de convés|contramestre de cabotagem
341210|Mestre de cabotagem|Técnicos marítimos, fluviários e pescadores de convés|mestre de cabotagem
341215|Mestre fluvial|Técnicos marítimos, fluviários e pescadores de convés|mestre fluvial
341220|Patrão de pesca de alto-mar|Técnicos marítimos, fluviários e pescadores de convés|patrao de pesca de alto-mar
341225|Patrão de pesca na navegação interior|Técnicos marítimos, fluviários e pescadores de convés|patrao de pesca na navegacao interior
341230|Piloto fluvial|Técnicos marítimos, fluviários e pescadores de convés|piloto fluvial
341235|Técnico em sinalização náutica|Técnicos marítimos, fluviários e pescadores de convés|tecnico em sinalizacao nautica
341240|Técnicos em manobras e equipamentos de convés|Técnicos marítimos, fluviários e pescadores de convés|tecnicos em manobras e equipamentos de conves
341245|Técnico em sinais navais|Técnicos marítimos, fluviários e pescadores de convés|tecnico em sinais navais
341250|Auxiliar técnico de sinalização náutica|Técnicos marítimos, fluviários e pescadores de convés|auxiliar tecnico de sinalizacao nautica
341305|Condutor maquinista motorista fluvial|Técnicos marítimos e fluviários de máquinas|condutor maquinista motorista fluvial
341310|Condutor de máquinas|Técnicos marítimos e fluviários de máquinas|condutor de maquinas
341315|Eletricista de bordo|Técnicos marítimos e fluviários de máquinas|eletricista de bordo
341320|Condutor de máquinas (bombeador)|Técnicos marítimos e fluviários de máquinas|condutor de maquinas (bombeador)
341325|Condutor de máquinas (mecânico)|Técnicos marítimos e fluviários de máquinas|condutor de maquinas (mecanico)
342105|Analista de transporte em comércio exterior|Especialistas em logística de transportes|analista de transporte em comercio exterior
342110|Operador de transporte multimodal|Especialistas em logística de transportes|operador de transporte multimodal
342115|Controlador de serviços de máquinas e veículos|Especialistas em logística de transportes|controlador de servicos de maquinas e veiculos
342120|Afretador|Especialistas em logística de transportes|afretador
342125|Tecnólogo em logística de transporte|Especialistas em logística de transportes|tecnologo em logistica de transporte
342205|Ajudante de despachante aduaneiro|Despachantes aduaneiros|ajudante de despachante aduaneiro
342210|Despachante aduaneiro|Despachantes aduaneiros|despachante aduaneiro
342215|Analista de desembaraço aduaneiro|Despachantes aduaneiros|analista de desembaraco aduaneiro
342305|Chefe de serviço de transporte rodoviário (passageiros e cargas)|Técnicos em transportes rodoviários|chefe de servico de transporte rodoviario (passageiros e cargas)
342310|Inspetor de serviços de transportes rodoviários (passageiros e cargas)|Técnicos em transportes rodoviários|inspetor de servicos de transportes rodoviarios (passageiros e cargas)
342315|Supervisor de carga e descarga|Técnicos em transportes rodoviários|supervisor de carga e descarga
342405|Agente de estação (ferrovia e metrô)|Técnicos em transportes metroferroviários|agente de estacao (ferrovia e metro)
342410|Operador de centro de controle (ferrovia e metrô)|Técnicos em transportes metroferroviários|operador de centro de controle (ferrovia e metro)
342505|Controlador de tráfego aéreo|Técnicos em transportes aéreos|controlador de trafego aereo
342510|Despachante operacional de voo|Técnicos em transportes aéreos|despachante operacional de voo
342515|Fiscal de aviação civil (fac)|Técnicos em transportes aéreos|fiscal de aviacao civil (fac)
342530|Inspetor de aviação civil|Técnicos em transportes aéreos|inspetor de aviacao civil
342535|Operador de atendimento aeroviário|Técnicos em transportes aéreos|operador de atendimento aeroviario
342540|Supervisor da administração de aeroportos|Técnicos em transportes aéreos|supervisor da administracao de aeroportos
342545|Supervisor de empresa aérea em aeroportos|Técnicos em transportes aéreos|supervisor de empresa aerea em aeroportos
342550|Agente de proteção de aviação civil|Técnicos em transportes aéreos|agente de protecao de aviacao civil
342555|Fiscal de pista de aeroporto|Técnicos em transportes aéreos|fiscal de pista de aeroporto
342560|Operador de rampa ( transporte aéreo)|Técnicos em transportes aéreos|operador de rampa ( transporte aereo)
342605|Chefe de estação portuária|Técnicos em transportes por vias navegáveis e operações portuárias|chefe de estacao portuaria
342610|Supervisor de operações portuárias|Técnicos em transportes por vias navegáveis e operações portuárias|supervisor de operacoes portuarias
351105|Técnico de contabilidade|Técnicos em contabilidade|tecnico de contabilidade
351110|Chefe de contabilidade (técnico)|Técnicos em contabilidade|chefe de contabilidade (tecnico)
351115|Consultor contábil (técnico)|Técnicos em contabilidade|consultor contabil (tecnico)
351305|Técnico em administração|Técnicos em administração|tecnico em administracao
351310|Técnico em administração de comércio exterior|Técnicos em administração|tecnico em administracao de comercio exterior
351315|Agente de recrutamento e seleção|Técnicos em administração|agente de recrutamento e selecao
351405|Escrevente|Serventuários da justiça e afins|escrevente
351410|Escrivão judicial|Serventuários da justiça e afins|escrivao judicial
351415|Escrivão extra - judicial|Serventuários da justiça e afins|escrivao extra - judicial
351420|Escrivão de polícia|Serventuários da justiça e afins|escrivao de policia
351425|Oficial de justiça|Serventuários da justiça e afins|oficial de justica
351430|Auxiliar de serviços jurídicos|Serventuários da justiça e afins|auxiliar de servicos juridicos
351435|Mediador de conflitos|Serventuários da justiça e afins|mediador de conflitos
351440|Árbitro extrajudicial|Serventuários da justiça e afins|arbitro extrajudicial
351505|Técnico em secretariado|Técnicos em secretariado, taquígrafos e estenotipistas|tecnico em secretariado
351510|Taquígrafo|Técnicos em secretariado, taquígrafos e estenotipistas|taquigrafo
351515|Estenotipista|Técnicos em secretariado, taquígrafos e estenotipistas|estenotipista
351605|Técnico de segurança do trabalho|Técnicos de segurança do trabalho|tecnico de seguranca do trabalho
351610|Técnico em higiene ocupacional|Técnicos de segurança do trabalho|tecnico em higiene ocupacional
351705|Analista de seguros (técnico)|Técnicos de seguros e afins|analista de seguros (tecnico)
351710|Analista de sinistros|Técnicos de seguros e afins|analista de sinistros
351715|Assistente comercial de seguros|Técnicos de seguros e afins|assistente comercial de seguros
351720|Assistente técnico de seguros|Técnicos de seguros e afins|assistente tecnico de seguros
351725|Inspetor de risco|Técnicos de seguros e afins|inspetor de risco
351730|Inspetor de sinistros|Técnicos de seguros e afins|inspetor de sinistros
351735|Técnico de resseguros|Técnicos de seguros e afins|tecnico de resseguros
351740|Técnico de seguros|Técnicos de seguros e afins|tecnico de seguros
351805|Detetive profissional|Agentes de investigação e identificação|detetive profissional
351810|Investigador de polícia|Agentes de investigação e identificação|investigador de policia
351815|Papiloscopista policial|Agentes de investigação e identificação|papiloscopista policial
351905|Agente de inteligência|Técnicos da inteligência|agente de inteligencia
351910|Agente técnico de inteligência|Técnicos da inteligência|agente tecnico de inteligencia
352205|Agente de defesa ambiental|Agentes da saúde e do meio ambiente|agente de defesa ambiental
352210|Agente de saúde pública|Agentes da saúde e do meio ambiente|agente de saude publica
352305|Metrologista|Agentes  fiscais metrológicos e de qualidade|metrologista
352310|Agente fiscal de qualidade|Agentes  fiscais metrológicos e de qualidade|agente fiscal de qualidade
352315|Agente fiscal metrológico|Agentes  fiscais metrológicos e de qualidade|agente fiscal metrologico
352320|Agente fiscal têxtil|Agentes  fiscais metrológicos e de qualidade|agente fiscal textil
352405|Agente de direitos autorais|Profissionais de direitos autorais e de avaliacão de produtos dos meios de comunicação|agente de direitos autorais
352410|Avaliador de produtos dos meios de comunicação|Profissionais de direitos autorais e de avaliacão de produtos dos meios de comunicação|avaliador de produtos dos meios de comunicacao
352420|Técnico em serviços jurídicos na área de direito autoral|Profissionais de direitos autorais e de avaliacão de produtos dos meios de comunicação|tecnico em servicos juridicos na area de direito autoral
353205|Técnico de operações e serviços bancários - câmbio|Técnicos em operações e serviços bancários|tecnico de operacoes e servicos bancarios - cambio
353210|Técnico de operações e serviços bancários - crédito imobiliário|Técnicos em operações e serviços bancários|tecnico de operacoes e servicos bancarios - credito imobiliario
353215|Técnico de operações e serviços bancários - crédito rural|Técnicos em operações e serviços bancários|tecnico de operacoes e servicos bancarios - credito rural
353220|Técnico de operações e serviços bancários - leasing|Técnicos em operações e serviços bancários|tecnico de operacoes e servicos bancarios - leasing
353225|Técnico de operações e serviços bancários - renda fixa e variável|Técnicos em operações e serviços bancários|tecnico de operacoes e servicos bancarios - renda fixa e variavel
353230|Tesoureiro de banco|Técnicos em operações e serviços bancários|tesoureiro de banco
353235|Chefe de serviços bancários|Técnicos em operações e serviços bancários|chefe de servicos bancarios
354120|Agente de vendas de serviços|Especialistas em promoção de produtos e vendas|agente de vendas de servicos
354125|Assistente de vendas|Especialistas em promoção de produtos e vendas|assistente de vendas
354130|Promotor de vendas especializado|Especialistas em promoção de produtos e vendas|promotor de vendas especializado
354135|Técnico de vendas|Especialistas em promoção de produtos e vendas|tecnico de vendas
354140|Técnico em atendimento e vendas|Especialistas em promoção de produtos e vendas|tecnico em atendimento e vendas
354145|Vendedor pracista|Especialistas em promoção de produtos e vendas|vendedor pracista
354150|Propagandista de produtos famacêuticos|Especialistas em promoção de produtos e vendas|propagandista de produtos famaceuticos
354205|Comprador|Compradores|comprador
354210|Supervisor de compras|Compradores|supervisor de compras
354305|Analista de exportação e importação|Analistas de comércio exterior|analista de exportacao e importacao
354405|Leiloeiro|Leiloeiros e avaliadores|leiloeiro
354410|Avaliador de imóveis|Leiloeiros e avaliadores|avaliador de imoveis
354415|Avaliador de bens móveis|Leiloeiros e avaliadores|avaliador de bens moveis
354505|Corretor de seguros|Corretores de seguros|corretor de seguros
354605|Corretor de imóveis|Corretores de imóveis e de grãos|corretor de imoveis
354610|Corretor de grãos|Corretores de imóveis e de grãos|corretor de graos
354705|Representante comercial autônomo|Representantes comerciais autônomos|representante comercial autonomo
354805|Técnico em turismo|Técnicos em serviços de turismo e organização de eventos|tecnico em turismo
354810|Operador de turismo|Técnicos em serviços de turismo e organização de eventos|operador de turismo
354815|Agente de viagem|Técnicos em serviços de turismo e organização de eventos|agente de viagem
354820|Organizador de evento|Técnicos em serviços de turismo e organização de eventos|organizador de evento
354825|Cerimonialista|Técnicos em serviços de turismo e organização de eventos|cerimonialista
371105|Auxiliar de biblioteca|Técnicos em biblioteconomia|auxiliar de biblioteca
371110|Técnico em biblioteconomia|Técnicos em biblioteconomia|tecnico em biblioteconomia
371205|Colecionador de selos e moedas|Técnicos em museologia e afins|colecionador de selos e moedas
371210|Técnico em museologia|Técnicos em museologia e afins|tecnico em museologia
371305|Técnico em programação visual|Técnicos em artes gráficas|tecnico em programacao visual
371310|Técnico gráfico|Técnicos em artes gráficas|tecnico grafico
371405|Recreador de acantonamento|Recreadores, brinquedistas e afins|recreador de acantonamento
371410|Recreador|Recreadores, brinquedistas e afins|recreador
371415|Brinquedista|Recreadores, brinquedistas e afins|brinquedista
372105|Diretor de fotografia|Captadores de imagens em movimento|diretor de fotografia
372110|Iluminador (televisão)|Captadores de imagens em movimento|iluminador (televisao)
372115|Operador de câmera de televisão|Captadores de imagens em movimento|operador de camera de televisao
372205|Operador de rede de teleprocessamento|Operadores de rede de teleprocessamento e afins|operador de rede de teleprocessamento
372210|Radiotelegrafista|Operadores de rede de teleprocessamento e afins|radiotelegrafista
373105|Operador de mídia audiovisual|Técnicos de operação de registros sonoro/audiovisuais|operador de midia audiovisual
373130|Técnico de sistemas audiovisuais|Técnicos de operação de registros sonoro/audiovisuais|tecnico de sistemas audiovisuais
373135|Operador de controle mestre|Técnicos de operação de registros sonoro/audiovisuais|operador de controle mestre
373140|Coordenador de programação|Técnicos de operação de registros sonoro/audiovisuais|coordenador de programacao
373145|Assistente de operações audiovisuais|Técnicos de operação de registros sonoro/audiovisuais|assistente de operacoes audiovisuais
373220|Supervisor técnico operacional de sistemas de televisão e produtoras de vídeo|Supervisores operacionais e técnicos em mídias audiovisuais|supervisor tecnico operacional de sistemas de televisao e produtoras de video
373225|Supervisor de operações (mídias audiovisuais)|Supervisores operacionais e técnicos em mídias audiovisuais|supervisor de operacoes (midias audiovisuais)
373230|Supervisor técnico (mídias audiovisuais)|Supervisores operacionais e técnicos em mídias audiovisuais|supervisor tecnico (midias audiovisuais)
374105|Técnico em gravação de áudio|Técnicos em áudio|tecnico em gravacao de audio
374110|Técnico em instalação de equipamentos de áudio|Técnicos em áudio|tecnico em instalacao de equipamentos de audio
374115|Técnico em masterização de áudio|Técnicos em áudio|tecnico em masterizacao de audio
374120|Projetista de som|Técnicos em áudio|projetista de som
374125|Técnico em sonorização|Técnicos em áudio|tecnico em sonorizacao
374130|Técnico em mixagem de áudio|Técnicos em áudio|tecnico em mixagem de audio
374135|Projetista de sistemas de áudio|Técnicos em áudio|projetista de sistemas de audio
374140|Microfonista|Técnicos em áudio|microfonista
374145|Dj (disc jockey)|Técnicos em áudio|dj (disc jockey)
374150|Sonoplasta|Técnicos em áudio|sonoplasta
374155|Analista musical|Técnicos em áudio|analista musical
374205|Cenotécnico (cinema, vídeo, televisão, teatro e espetáculos)|Técnicos em cenografia|cenotecnico (cinema, video, televisao, teatro e espetaculos)
374210|Maquinista de cinema e vídeo|Técnicos em cenografia|maquinista de cinema e video
374215|Maquinista de teatro e espetáculos|Técnicos em cenografia|maquinista de teatro e espetaculos
374305|Operador de projetor cinematográfico|Técnicos em operação de aparelhos de projeção|operador de projetor cinematografico
374310|Operador-mantenedor de projetor cinematográfico|Técnicos em operação de aparelhos de projeção|operador-mantenedor de projetor cinematografico
374405|Editor de mídia audiovisual|Técnicos em montagem, edição e finalização de mídia audiovisual|editor de midia audiovisual
374410|Finalizador de filmes|Técnicos em montagem, edição e finalização de mídia audiovisual|finalizador de filmes
374415|Finalizador de vídeo|Técnicos em montagem, edição e finalização de mídia audiovisual|finalizador de video
374420|Montador de filmes|Técnicos em montagem, edição e finalização de mídia audiovisual|montador de filmes
374425|Diretor de imagens (tv)|Técnicos em montagem, edição e finalização de mídia audiovisual|diretor de imagens (tv)
375105|Designer de interiores|Designers de interiores, de vitrines e visual merchandiser e afins (nível médio)|designer de interiores
375110|Designer de vitrines|Designers de interiores, de vitrines e visual merchandiser e afins (nível médio)|designer de vitrines
375115|Visual merchandiser|Designers de interiores, de vitrines e visual merchandiser e afins (nível médio)|visual merchandiser
375120|Decorador de eventos|Designers de interiores, de vitrines e visual merchandiser e afins (nível médio)|decorador de eventos
375125|Produtor de moda|Designers de interiores, de vitrines e visual merchandiser e afins (nível médio)|produtor de moda
375130|Profissional de organização (personal organizer)|Designers de interiores, de vitrines e visual merchandiser e afins (nível médio)|profissional de organizacao (personal organizer)
376105|Dançarino tradicional|Dançarinos tradicionais e populares|dancarino tradicional
376110|Dançarino popular|Dançarinos tradicionais e populares|dancarino popular
376205|Acrobata|Artistas de circo (circenses)|acrobata
376210|Artista aéreo|Artistas de circo (circenses)|artista aereo
376215|Artista de circo (outros)|Artistas de circo (circenses)|artista de circo (outros)
376220|Contorcionista|Artistas de circo (circenses)|contorcionista
376225|Domador de animais (circense)|Artistas de circo (circenses)|domador de animais (circense)
376230|Equilibrista|Artistas de circo (circenses)|equilibrista
376235|Mágico|Artistas de circo (circenses)|magico
376240|Malabarista|Artistas de circo (circenses)|malabarista
376245|Palhaço|Artistas de circo (circenses)|palhaco
376250|Titeriteiro|Artistas de circo (circenses)|titeriteiro
376255|Trapezista|Artistas de circo (circenses)|trapezista
376305|Apresentador de eventos|Apresentadores de eventos, programas e espetáculos|apresentador de eventos
376310|Apresentador de festas populares|Apresentadores de eventos, programas e espetáculos|apresentador de festas populares
376315|Apresentador de programas de rádio|Apresentadores de eventos, programas e espetáculos|apresentador de programas de radio
376320|Apresentador de programas de televisão|Apresentadores de eventos, programas e espetáculos|apresentador de programas de televisao
376325|Apresentador de circo|Apresentadores de eventos, programas e espetáculos|apresentador de circo
376330|Mestre de cerimônias|Apresentadores de eventos, programas e espetáculos|mestre de cerimonias
376405|Modelo artístico|Modelos|modelo artistico
376410|Modelo de modas|Modelos|modelo de modas
376415|Modelo publicitário|Modelos|modelo publicitario
377105|Atleta profissional (outras modalidades)|Atletas profissionais|atleta profissional (outras modalidades)
377110|Atleta profissional de futebol|Atletas profissionais|atleta profissional de futebol
377115|Atleta profissional de golfe|Atletas profissionais|atleta profissional de golfe
377120|Atleta profissional de luta|Atletas profissionais|atleta profissional de luta
377125|Atleta profissional de tênis|Atletas profissionais|atleta profissional de tenis
377130|Jóquei|Atletas profissionais|joquei
377135|Piloto de competição automobilística|Atletas profissionais|piloto de competicao automobilistica
377140|Profissional de atletismo|Atletas profissionais|profissional de atletismo
377145|Pugilista|Atletas profissionais|pugilista
377205|Árbitro desportivo|Árbitros desportivos|arbitro desportivo
377210|Árbitro de atletismo|Árbitros desportivos|arbitro de atletismo
377215|Árbitro de basquete|Árbitros desportivos|arbitro de basquete
377220|Árbitro de futebol|Árbitros desportivos|arbitro de futebol
377225|Árbitro de futebol de salão|Árbitros desportivos|arbitro de futebol de salao
377230|Árbitro de judô|Árbitros desportivos|arbitro de judo
377235|Árbitro de karatê|Árbitros desportivos|arbitro de karate
377240|Árbitro de poló aquático|Árbitros desportivos|arbitro de polo aquatico
377245|Árbitro de vôlei|Árbitros desportivos|arbitro de volei
391105|Cronoanalista|Planejadores, programadores e controladores de produção e manutenção|cronoanalista
391110|Cronometrista|Planejadores, programadores e controladores de produção e manutenção|cronometrista
391115|Controlador de entrada e saída|Planejadores, programadores e controladores de produção e manutenção|controlador de entrada e saida
391120|Planejista|Planejadores, programadores e controladores de produção e manutenção|planejista
391125|Técnico de planejamento de produção|Planejadores, programadores e controladores de produção e manutenção|tecnico de planejamento de producao
391130|Técnico de planejamento e programação da manutenção|Planejadores, programadores e controladores de produção e manutenção|tecnico de planejamento e programacao da manutencao
391135|Técnico de matéria-prima e material|Planejadores, programadores e controladores de produção e manutenção|tecnico de materia-prima e material
391140|Analista de manutenção aeronáutica|Planejadores, programadores e controladores de produção e manutenção|analista de manutencao aeronautica
391145|Analista de planejamento de manutenção|Planejadores, programadores e controladores de produção e manutenção|analista de planejamento de manutencao
391205|Inspetor de qualidade|Técnicos de controle da produção|inspetor de qualidade
391210|Técnico de garantia da qualidade|Técnicos de controle da produção|tecnico de garantia da qualidade
391215|Operador de inspeção de qualidade|Técnicos de controle da produção|operador de inspecao de qualidade
391220|Técnico de painel de controle|Técnicos de controle da produção|tecnico de painel de controle
391225|Escolhedor de papel|Técnicos de controle da produção|escolhedor de papel
391230|Técnico operacional de serviços de correios|Técnicos de controle da produção|tecnico operacional de servicos de correios
395105|Técnico de apoio em pesquisa e desenvolvimento (exceto agropecuário e florestal)|Técnicos de apoio em pesquisa e desenvolvimento|tecnico de apoio em pesquisa e desenvolvimento (exceto agropecuario e florestal)
395110|Técnico de apoio em pesquisa e desenvolvimento agropecuário florestal|Técnicos de apoio em pesquisa e desenvolvimento|tecnico de apoio em pesquisa e desenvolvimento agropecuario florestal
410105|Supervisor administrativo|Supervisores administrativos|supervisor administrativo
410205|Supervisor de almoxarifado|Supervisores de serviços financeiros, de câmbio e de controle|supervisor de almoxarifado
410210|Supervisor de câmbio|Supervisores de serviços financeiros, de câmbio e de controle|supervisor de cambio
410215|Supervisor de contas a pagar|Supervisores de serviços financeiros, de câmbio e de controle|supervisor de contas a pagar
410220|Supervisor de controle patrimonial|Supervisores de serviços financeiros, de câmbio e de controle|supervisor de controle patrimonial
410225|Supervisor de crédito e cobrança|Supervisores de serviços financeiros, de câmbio e de controle|supervisor de credito e cobranca
410230|Supervisor de orçamento|Supervisores de serviços financeiros, de câmbio e de controle|supervisor de orcamento
410235|Supervisor de tesouraria|Supervisores de serviços financeiros, de câmbio e de controle|supervisor de tesouraria
410240|Supervisor de logística|Supervisores de serviços financeiros, de câmbio e de controle|supervisor de logistica
411005|Auxiliar de escritório|Agentes, assistentes e auxiliares administrativos|auxiliar de escritorio
411010|Assistente administrativo|Agentes, assistentes e auxiliares administrativos|assistente administrativo
411015|Atendente de judiciário|Agentes, assistentes e auxiliares administrativos|atendente de judiciario
411020|Auxiliar de judiciário|Agentes, assistentes e auxiliares administrativos|auxiliar de judiciario
411025|Auxiliar de cartório|Agentes, assistentes e auxiliares administrativos|auxiliar de cartorio
411030|Auxiliar de pessoal|Agentes, assistentes e auxiliares administrativos|auxiliar de pessoal
411035|Auxiliar de estatística|Agentes, assistentes e auxiliares administrativos|auxiliar de estatistica
411040|Auxiliar de seguros|Agentes, assistentes e auxiliares administrativos|auxiliar de seguros
411045|Auxiliar de serviços de importação e exportação|Agentes, assistentes e auxiliares administrativos|auxiliar de servicos de importacao e exportacao
411050|Agente de microcrédito|Agentes, assistentes e auxiliares administrativos|agente de microcredito
411055|Captador de recursos|Agentes, assistentes e auxiliares administrativos|captador de recursos
412105|Datilógrafo|Operadores de equipamentos de entrada e transmissão de dados|datilografo
412110|Digitador|Operadores de equipamentos de entrada e transmissão de dados|digitador
412115|Operador de mensagens de telecomunicações (correios)|Operadores de equipamentos de entrada e transmissão de dados|operador de mensagens de telecomunicacoes (correios)
412120|Supervisor de digitação e operação|Operadores de equipamentos de entrada e transmissão de dados|supervisor de digitacao e operacao
412205|Contínuo|Contínuos|continuo
413105|Analista de folha de pagamento|Auxiliares de contabilidade|analista de folha de pagamento
413110|Auxiliar de contabilidade|Auxiliares de contabilidade|auxiliar de contabilidade
413115|Auxiliar de faturamento|Auxiliares de contabilidade|auxiliar de faturamento
413205|Atendente de agência|Escriturários de serviços bancários|atendente de agencia
413210|Caixa de banco|Escriturários de serviços bancários|caixa de banco
413215|Compensador de banco|Escriturários de serviços bancários|compensador de banco
413220|Conferente de serviços bancários|Escriturários de serviços bancários|conferente de servicos bancarios
413225|Escriturário de banco|Escriturários de serviços bancários|escriturario de banco
413230|Operador de cobrança bancária|Escriturários de serviços bancários|operador de cobranca bancaria
414105|Almoxarife|Almoxarifes e armazenistas|almoxarife
414110|Armazenista|Almoxarifes e armazenistas|armazenista
414115|Balanceiro|Almoxarifes e armazenistas|balanceiro
414120|Conferente mercadoria (exceto carga e descarga)|Almoxarifes e armazenistas|conferente mercadoria (exceto carga e descarga)
414125|Estoquista|Almoxarifes e armazenistas|estoquista
414135|Expedidor de mercadorias|Almoxarifes e armazenistas|expedidor de mercadorias
414140|Auxiliar de logística|Almoxarifes e armazenistas|auxiliar de logistica
414205|Apontador de mão de obra|Apontadores e conferentes|apontador de mao de obra
414210|Apontador de produção|Apontadores e conferentes|apontador de producao
414215|Conferente de carga e descarga|Apontadores e conferentes|conferente de carga e descarga
415105|Arquivista de documentos|Auxiliares de serviços de documentação, informação e pesquisa|arquivista de documentos
415115|Codificador de dados|Auxiliares de serviços de documentação, informação e pesquisa|codificador de dados
415120|Fitotecário|Auxiliares de serviços de documentação, informação e pesquisa|fitotecario
415125|Kardexista|Auxiliares de serviços de documentação, informação e pesquisa|kardexista
415130|Operador de máquina copiadora (exceto operador de gráfica rápida)|Auxiliares de serviços de documentação, informação e pesquisa|operador de maquina copiadora (exceto operador de grafica rapida)
415205|Carteiro|Trabalhadores nos serviços de classificação e entregas de correspondências, encomendas e publicações|carteiro
415210|Operador de triagem e transbordo|Trabalhadores nos serviços de classificação e entregas de correspondências, encomendas e publicações|operador de triagem e transbordo
415215|Entregador de publicações|Trabalhadores nos serviços de classificação e entregas de correspondências, encomendas e publicações|entregador de publicacoes
415305|Registrador de câncer|Trabalhadores em registros e informações em saúde|registrador de cancer
415310|Analista de informação em saúde|Trabalhadores em registros e informações em saúde|analista de informacao em saude
420105|Supervisor de caixas e bilheteiros (exceto caixa de banco)|Supervisores de atendimento ao público e de pesquisa|supervisor de caixas e bilheteiros (exceto caixa de banco)
420110|Supervisor de cobrança|Supervisores de atendimento ao público e de pesquisa|supervisor de cobranca
420115|Supervisor de coletadores de apostas e de jogos|Supervisores de atendimento ao público e de pesquisa|supervisor de coletadores de apostas e de jogos
420120|Supervisor de coleta de dados em pesquisa|Supervisores de atendimento ao público e de pesquisa|supervisor de coleta de dados em pesquisa
420125|Supervisor de recepcionistas|Supervisores de atendimento ao público e de pesquisa|supervisor de recepcionistas
420130|Supervisor de telefonistas|Supervisores de atendimento ao público e de pesquisa|supervisor de telefonistas
420135|Supervisor de telemarketing e atendimento|Supervisores de atendimento ao público e de pesquisa|supervisor de telemarketing e atendimento
421105|Atendente comercial (agência postal)|Caixas e bilheteiros (exceto caixa de banco)|atendente comercial (agencia postal)
421110|Bilheteiro de transportes coletivos|Caixas e bilheteiros (exceto caixa de banco)|bilheteiro de transportes coletivos
421115|Bilheteiro no serviço de diversões|Caixas e bilheteiros (exceto caixa de banco)|bilheteiro no servico de diversoes
421120|Emissor de passagens|Caixas e bilheteiros (exceto caixa de banco)|emissor de passagens
421125|Operador de caixa|Caixas e bilheteiros (exceto caixa de banco)|operador de caixa
421205|Recebedor de apostas (loteria)|Coletadores de apostas e de jogos|recebedor de apostas (loteria)
421210|Recebedor de apostas (turfe)|Coletadores de apostas e de jogos|recebedor de apostas (turfe)
421305|Cobrador externo|Cobradores e afins|cobrador externo
421310|Cobrador interno|Cobradores e afins|cobrador interno
421315|Localizador (cobrador)|Cobradores e afins|localizador (cobrador)
422105|Recepcionista, em geral|Recepcionistas|recepcionista, em geral
422110|Recepcionista de consultório médico ou dentário|Recepcionistas|recepcionista de consultorio medico ou dentario
422115|Recepcionista de seguro saúde|Recepcionistas|recepcionista de seguro saude
422120|Recepcionista de hotel|Recepcionistas|recepcionista de hotel
422125|Recepcionista de banco|Recepcionistas|recepcionista de banco
422130|Concierge|Recepcionistas|concierge
422205|Telefonista|Operadores de telefonia|telefonista
422210|Teleoperador|Operadores de telefonia|teleoperador
422220|Operador de rádio-chamada|Operadores de telefonia|operador de radio-chamada
422305|Operador de telemarketing ativo|Operadores de telemarketing e afins|operador de telemarketing ativo
422310|Operador de telemarketing ativo e receptivo|Operadores de telemarketing e afins|operador de telemarketing ativo e receptivo
422315|Operador de telemarketing receptivo|Operadores de telemarketing e afins|operador de telemarketing receptivo
422320|Operador de telemarketing técnico|Operadores de telemarketing e afins|operador de telemarketing tecnico
422330|Teleatendente de emergência|Operadores de telemarketing e afins|teleatendente de emergencia
422335|Monitor de teleatendimento|Operadores de telemarketing e afins|monitor de teleatendimento
423105|Despachante documentalista|Despachantes documentalistas e afins|despachante documentalista
423110|Despachante de trânsito|Despachantes documentalistas e afins|despachante de transito
423115|Vistoriador veicular|Despachantes documentalistas e afins|vistoriador veicular
424105|Entrevistador censitário e de pesquisas amostrais|Entrevistadores e recenseadores|entrevistador censitario e de pesquisas amostrais
424110|Entrevistador de pesquisa de opinião e mídia|Entrevistadores e recenseadores|entrevistador de pesquisa de opiniao e midia
424115|Entrevistador de pesquisas de mercado|Entrevistadores e recenseadores|entrevistador de pesquisas de mercado
424120|Entrevistador de preços|Entrevistadores e recenseadores|entrevistador de precos
424125|Escriturário  em  estatística|Entrevistadores e recenseadores|escriturario  em  estatistica
424130|Entrevistador social|Entrevistadores e recenseadores|entrevistador social
424205|Coordenador de provas (concurso, avaliação, exame)|Aplicadores de provas e afins|coordenador de provas (concurso, avaliacao, exame)
424210|Aplicador de provas (concurso, avaliação,exame)|Aplicadores de provas e afins|aplicador de provas (concurso, avaliacao,exame)
510105|Supervisor de transportes|Supervisores dos serviços de transporte, turismo, hotelaria e administração de edifícios|supervisor de transportes
510110|Administrador de edifícios|Supervisores dos serviços de transporte, turismo, hotelaria e administração de edifícios|administrador de edificios
510115|Supervisor de andar|Supervisores dos serviços de transporte, turismo, hotelaria e administração de edifícios|supervisor de andar
510120|Chefe de portaria de hotel|Supervisores dos serviços de transporte, turismo, hotelaria e administração de edifícios|chefe de portaria de hotel
510130|Chefe de bar|Supervisores dos serviços de transporte, turismo, hotelaria e administração de edifícios|chefe de bar
510135|Maître|Supervisores dos serviços de transporte, turismo, hotelaria e administração de edifícios|maitre
510205|Supervisor de lavanderia|Supervisores de lavanderia|supervisor de lavanderia
510305|Supervisor de bombeiros|Supervisores dos serviços de proteção, segurança e outros|supervisor de bombeiros
510310|Supervisor de vigilantes|Supervisores dos serviços de proteção, segurança e outros|supervisor de vigilantes
511105|Comissário de vôo|Trabalhadores de segurança e atendimento aos usuários nos transportes|comissario de voo
511110|Comissário de trem|Trabalhadores de segurança e atendimento aos usuários nos transportes|comissario de trem
511115|Taifeiro (exceto militares)|Trabalhadores de segurança e atendimento aos usuários nos transportes|taifeiro (exceto militares)
511205|Fiscal de transportes coletivos (exceto trem)|Fiscais e cobradores dos transportes coletivos|fiscal de transportes coletivos (exceto trem)
511210|Despachante de transportes coletivos (exceto trem)|Fiscais e cobradores dos transportes coletivos|despachante de transportes coletivos (exceto trem)
511215|Cobrador de transportes coletivos (exceto trem)|Fiscais e cobradores dos transportes coletivos|cobrador de transportes coletivos (exceto trem)
511220|Bilheteiro (estações de metrô, ferroviárias e assemelhadas)|Fiscais e cobradores dos transportes coletivos|bilheteiro (estacoes de metro, ferroviarias e assemelhadas)
511405|Guia de turismo|Guias de turismo|guia de turismo
511505|Condutor de turismo de aventura|Condutores de turismo|condutor de turismo de aventura
511510|Condutor de turismo de pesca|Condutores de turismo|condutor de turismo de pesca
511515|Condutor turismo náutico|Condutores de turismo|condutor turismo nautico
512105|Empregado  doméstico  nos serviços gerais|Trabalhadores dos serviços domésticos em geral|empregado  domestico  nos servicos gerais
512110|Empregado doméstico  arrumador|Trabalhadores dos serviços domésticos em geral|empregado domestico  arrumador
512115|Empregado doméstico  faxineiro|Trabalhadores dos serviços domésticos em geral|empregado domestico  faxineiro
512120|Empregado doméstico diarista|Trabalhadores dos serviços domésticos em geral|empregado domestico diarista
513105|Mordomo de residência|Mordomos e governantas|mordomo de residencia
513110|Mordomo de hotelaria|Mordomos e governantas|mordomo de hotelaria
513115|Governanta de hotelaria|Mordomos e governantas|governanta de hotelaria
513205|Cozinheiro geral|Cozinheiros|cozinheiro geral
513210|Cozinheiro do serviço doméstico|Cozinheiros|cozinheiro do servico domestico
513215|Cozinheiro industrial|Cozinheiros|cozinheiro industrial
513220|Cozinheiro de hospital|Cozinheiros|cozinheiro de hospital
513225|Cozinheiro de embarcações|Cozinheiros|cozinheiro de embarcacoes
513305|Camareiro de teatro|Camareiros, roupeiros e afins|camareiro de teatro
513310|Camareiro de televisão|Camareiros, roupeiros e afins|camareiro de televisao
513315|Camareiro  de hotel|Camareiros, roupeiros e afins|camareiro  de hotel
513320|Camareiro de embarcações|Camareiros, roupeiros e afins|camareiro de embarcacoes
513325|Guarda-roupeiro de cinema|Camareiros, roupeiros e afins|guarda-roupeiro de cinema
513405|Garçom|Trabalhadores no atendimento em estabelecimentos de serviços de alimentação, bebidas e hotelaria|garcom
513410|Sommelier|Trabalhadores no atendimento em estabelecimentos de serviços de alimentação, bebidas e hotelaria|sommelier
513415|Cumim|Trabalhadores no atendimento em estabelecimentos de serviços de alimentação, bebidas e hotelaria|cumim
513420|Barman|Trabalhadores no atendimento em estabelecimentos de serviços de alimentação, bebidas e hotelaria|barman
513425|Copeiro|Trabalhadores no atendimento em estabelecimentos de serviços de alimentação, bebidas e hotelaria|copeiro
513430|Copeiro de hospital|Trabalhadores no atendimento em estabelecimentos de serviços de alimentação, bebidas e hotelaria|copeiro de hospital
513435|Atendente de lanchonete|Trabalhadores no atendimento em estabelecimentos de serviços de alimentação, bebidas e hotelaria|atendente de lanchonete
513440|Barista|Trabalhadores no atendimento em estabelecimentos de serviços de alimentação, bebidas e hotelaria|barista
513505|Auxiliar nos serviços de alimentação|Trabalhadores auxiliares nos serviços de alimentação|auxiliar nos servicos de alimentacao
513510|Lactarista|Trabalhadores auxiliares nos serviços de alimentação|lactarista
513605|Churrasqueiro|Churrasqueiros, pizzaiolos e sushimen|churrasqueiro
513610|Pizzaiolo|Churrasqueiros, pizzaiolos e sushimen|pizzaiolo
513615|Sushiman|Churrasqueiros, pizzaiolos e sushimen|sushiman
514105|Ascensorista|Trabalhadores nos serviços de administração de edifícios|ascensorista
514110|Garagista|Trabalhadores nos serviços de administração de edifícios|garagista
514115|Sacristão|Trabalhadores nos serviços de administração de edifícios|sacristao
514120|Zelador de edifício|Trabalhadores nos serviços de administração de edifícios|zelador de edificio
514205|Coletor de lixo domiciliar|Trabalhadores nos serviços de coleta de resíduos, de limpeza e conservação de áreas públicas|coletor de lixo domiciliar
514215|Varredor de rua|Trabalhadores nos serviços de coleta de resíduos, de limpeza e conservação de áreas públicas|varredor de rua
514225|Trabalhador de serviços de limpeza e conservação de áreas públicas|Trabalhadores nos serviços de coleta de resíduos, de limpeza e conservação de áreas públicas|trabalhador de servicos de limpeza e conservacao de areas publicas
514230|Coletor de resíduos sólidos de serviços de saúde|Trabalhadores nos serviços de coleta de resíduos, de limpeza e conservação de áreas públicas|coletor de residuos solidos de servicos de saude
514305|Limpador de vidros|Trabalhadores nos serviços de manutenção de edificações, estruturas e equipamentos industriais|limpador de vidros
514310|Auxiliar de manutenção predial|Trabalhadores nos serviços de manutenção de edificações, estruturas e equipamentos industriais|auxiliar de manutencao predial
514315|Limpador de fachadas|Trabalhadores nos serviços de manutenção de edificações, estruturas e equipamentos industriais|limpador de fachadas
514320|Faxineiro|Trabalhadores nos serviços de manutenção de edificações, estruturas e equipamentos industriais|faxineiro
514325|Trabalhador da manutenção de edificações|Trabalhadores nos serviços de manutenção de edificações, estruturas e equipamentos industriais|trabalhador da manutencao de edificacoes
514330|Limpador de piscinas|Trabalhadores nos serviços de manutenção de edificações, estruturas e equipamentos industriais|limpador de piscinas
514335|Hidrojatista|Trabalhadores nos serviços de manutenção de edificações, estruturas e equipamentos industriais|hidrojatista
515105|Agente comunitário de saúde|Trabalhadores em serviços de promoção e apoio à saúde|agente comunitario de saude
515110|Atendente de enfermagem|Trabalhadores em serviços de promoção e apoio à saúde|atendente de enfermagem
515115|Parteira tradicional|Trabalhadores em serviços de promoção e apoio à saúde|parteira tradicional
515120|Visitador sanitário|Trabalhadores em serviços de promoção e apoio à saúde|visitador sanitario
515125|Agente indígena de saúde|Trabalhadores em serviços de promoção e apoio à saúde|agente indigena de saude
515130|Agente indígena de saneamento|Trabalhadores em serviços de promoção e apoio à saúde|agente indigena de saneamento
515135|Socorrista (exceto médicos e enfermeiros)|Trabalhadores em serviços de promoção e apoio à saúde|socorrista (exceto medicos e enfermeiros)
515140|Agente de combate às endemias|Trabalhadores em serviços de promoção e apoio à saúde|agente de combate as endemias
515205|Auxiliar de banco de sangue|Auxiliares de laboratório da saúde|auxiliar de banco de sangue
515210|Auxiliar de farmácia de manipulação|Auxiliares de laboratório da saúde|auxiliar de farmacia de manipulacao
515215|Auxiliar de laboratório de análises clínicas|Auxiliares de laboratório da saúde|auxiliar de laboratorio de analises clinicas
515220|Auxiliar de laboratório de imunobiológicos|Auxiliares de laboratório da saúde|auxiliar de laboratorio de imunobiologicos
515225|Auxiliar de produção farmacêutica|Auxiliares de laboratório da saúde|auxiliar de producao farmaceutica
515305|Educador social|Trabalhadores de atenção, defesa e proteção as pessoas em situação de vulnerabilidade|educador social
515310|Agente de ação social|Trabalhadores de atenção, defesa e proteção as pessoas em situação de vulnerabilidade|agente de acao social
515315|Monitor de dependente químico|Trabalhadores de atenção, defesa e proteção as pessoas em situação de vulnerabilidade|monitor de dependente quimico
515320|Conselheiro tutelar|Trabalhadores de atenção, defesa e proteção as pessoas em situação de vulnerabilidade|conselheiro tutelar
515325|Sócioeducador|Trabalhadores de atenção, defesa e proteção as pessoas em situação de vulnerabilidade|socioeducador
515330|Monitor de ressocialização prisional|Trabalhadores de atenção, defesa e proteção as pessoas em situação de vulnerabilidade|monitor de ressocializacao prisional
515335|Mediador intercultural|Trabalhadores de atenção, defesa e proteção as pessoas em situação de vulnerabilidade|mediador intercultural
516105|Barbeiro|Trabalhadores nos serviços de embelezamento|barbeiro
516110|Cabeleireiro|Trabalhadores nos serviços de embelezamento|cabeleireiro
516120|Manicure/pedicure|Trabalhadores nos serviços de embelezamento|manicure/pedicure
516125|Maquiador|Trabalhadores nos serviços de embelezamento|maquiador
516130|Maquiador de caracterização|Trabalhadores nos serviços de embelezamento|maquiador de caracterizacao
516145|Designer de unhas|Trabalhadores nos serviços de embelezamento|designer de unhas
516150|Designer de sobrancelhas|Trabalhadores nos serviços de embelezamento|designer de sobrancelhas
516155|Designer de cílios|Trabalhadores nos serviços de embelezamento|designer de cilios
516160|Confeccionador de perucas|Trabalhadores nos serviços de embelezamento|confeccionador de perucas
516165|Trancista|Trabalhadores nos serviços de embelezamento|trancista
516205|Babá|Cuidadores de crianças, jovens, adultos e idosos|baba
516210|Cuidador de idosos|Cuidadores de crianças, jovens, adultos e idosos|cuidador de idosos
516215|Mãe social|Cuidadores de crianças, jovens, adultos e idosos|mae social
516220|Cuidador em saúde|Cuidadores de crianças, jovens, adultos e idosos|cuidador em saude
516305|Lavadeiro, em geral|Tintureiros, lavadeiros e afins, a máquina|lavadeiro, em geral
516310|Lavador de roupas à máquina|Tintureiros, lavadeiros e afins, a máquina|lavador de roupas a maquina
516315|Lavador de artefatos de tapeçaria|Tintureiros, lavadeiros e afins, a máquina|lavador de artefatos de tapecaria
516320|Limpador a seco, à máquina|Tintureiros, lavadeiros e afins, a máquina|limpador a seco, a maquina
516325|Passador de roupas em geral|Tintureiros, lavadeiros e afins, a máquina|passador de roupas em geral
516330|Tingidor de roupas|Tintureiros, lavadeiros e afins, a máquina|tingidor de roupas
516335|Conferente-expedidor de roupas (lavanderias)|Tintureiros, lavadeiros e afins, a máquina|conferente-expedidor de roupas (lavanderias)
516340|Atendente de lavanderia|Tintureiros, lavadeiros e afins, a máquina|atendente de lavanderia
516345|Auxiliar de lavanderia|Tintureiros, lavadeiros e afins, a máquina|auxiliar de lavanderia
516405|Lavador de roupas e artefatos à mão|Lavadores e passadores de roupa, a mão|lavador de roupas e artefatos a mao
516410|Limpador de roupas a seco, à mão|Lavadores e passadores de roupa, a mão|limpador de roupas a seco, a mao
516415|Passador de roupas, à mão|Lavadores e passadores de roupa, a mão|passador de roupas, a mao
516505|Agente funerário|Trabalhadores dos serviços funerários|agente funerario
516605|Operador de forno (serviços funerários)|Trabalhadores auxiliares dos serviços funerários|operador de forno (servicos funerarios)
516610|Sepultador|Trabalhadores auxiliares dos serviços funerários|sepultador
516705|Astrólogo|Astrólogos e numerólogos|astrologo
516710|Numerólogo|Astrólogos e numerólogos|numerologo
516805|Esotérico|Esotéricos e afins|esoterico
516810|Paranormal|Esotéricos e afins|paranormal
516815|Ufólogo|Esotéricos e afins|ufologo
516905|Tatuador|Trabalhadores nos serviços de arte corporal|tatuador
516910|Micropigmentador|Trabalhadores nos serviços de arte corporal|micropigmentador
516915|Body piercer|Trabalhadores nos serviços de arte corporal|body piercer
517105|Bombeiro de aeródromo|Bombeiros, salva-vidas e afins|bombeiro de aerodromo
517110|Bombeiro civil|Bombeiros, salva-vidas e afins|bombeiro civil
517115|Salva-vidas|Bombeiros, salva-vidas e afins|salva-vidas
517120|Brigadista florestal|Bombeiros, salva-vidas e afins|brigadista florestal
517125|Chefe de brigada|Bombeiros, salva-vidas e afins|chefe de brigada
517130|Agente de proteção e defesa civil|Bombeiros, salva-vidas e afins|agente de protecao e defesa civil
517205|Agente de polícia federal|Policiais, guardas civis municipais e agentes de trânsito|agente de policia federal
517210|Policial rodoviário federal|Policiais, guardas civis municipais e agentes de trânsito|policial rodoviario federal
517215|Guarda civil municipal|Policiais, guardas civis municipais e agentes de trânsito|guarda civil municipal
517220|Agente de trânsito|Policiais, guardas civis municipais e agentes de trânsito|agente de transito
517225|Policial legislativo|Policiais, guardas civis municipais e agentes de trânsito|policial legislativo
517230|Policial penal|Policiais, guardas civis municipais e agentes de trânsito|policial penal
517235|Guarda portuário|Policiais, guardas civis municipais e agentes de trânsito|guarda portuario
517305|Vigilante aeroportuário|Vigilantes e guardas de segurança|vigilante aeroportuario
517310|Agente de segurança|Vigilantes e guardas de segurança|agente de seguranca
517320|Vigilante florestal|Vigilantes e guardas de segurança|vigilante florestal
517325|Vigilante portuário|Vigilantes e guardas de segurança|vigilante portuario
517330|Vigilante patrimonial|Vigilantes e guardas de segurança|vigilante patrimonial
517405|Porteiro (hotel)|Porteiros, vigias e afins|porteiro (hotel)
517410|Porteiro de edifícios|Porteiros, vigias e afins|porteiro de edificios
517415|Agente de portaria|Porteiros, vigias e afins|agente de portaria
517420|Vigia|Porteiros, vigias e afins|vigia
517425|Fiscal de loja|Porteiros, vigias e afins|fiscal de loja
519105|Ciclista mensageiro|Motociclistas e ciclistas de entregas rápidas|ciclista mensageiro
519110|Motofretista|Motociclistas e ciclistas de entregas rápidas|motofretista
519115|Mototaxista|Motociclistas e ciclistas de entregas rápidas|mototaxista
519205|Catador de material reciclável|Trabalhadores da coleta e seleção de material reciclável|catador de material reciclavel
519210|Selecionador de material reciclável|Trabalhadores da coleta e seleção de material reciclável|selecionador de material reciclavel
519215|Operador de prensa de material reciclável|Trabalhadores da coleta e seleção de material reciclável|operador de prensa de material reciclavel
519305|Auxiliar de serviços em saúde animal|Trabalhadores cuidadores de animais domésticos|auxiliar de servicos em saude animal
519310|Esteticista de animais domésticos|Trabalhadores cuidadores de animais domésticos|esteticista de animais domesticos
519315|Banhista de animais domésticos|Trabalhadores cuidadores de animais domésticos|banhista de animais domesticos
519320|Tosador de animais domésticos|Trabalhadores cuidadores de animais domésticos|tosador de animais domesticos
519325|Monitor de animais domésticos|Trabalhadores cuidadores de animais domésticos|monitor de animais domesticos
519330|Condutor de cães domésticos|Trabalhadores cuidadores de animais domésticos|condutor de caes domesticos
519805|Profissional do sexo|Profissionais do sexo|profissional do sexo
519905|Cartazeiro|Outros trabalhadores dos serviços|cartazeiro
519910|Controlador de pragas|Outros trabalhadores dos serviços|controlador de pragas
519915|Engraxate|Outros trabalhadores dos serviços|engraxate
519920|Gandula|Outros trabalhadores dos serviços|gandula
519925|Guardador de veículos|Outros trabalhadores dos serviços|guardador de veiculos
519930|Lavador de garrafas, vidros e outros utensílios|Outros trabalhadores dos serviços|lavador de garrafas, vidros e outros utensilios
519935|Lavador de veículos|Outros trabalhadores dos serviços|lavador de veiculos
519940|Leiturista|Outros trabalhadores dos serviços|leiturista
519945|Recepcionista de casas de espetáculos|Outros trabalhadores dos serviços|recepcionista de casas de espetaculos
520105|Supervisor de vendas de serviços|Supervisores de vendas e de prestação de serviços|supervisor de vendas de servicos
520110|Supervisor de vendas de produtos|Supervisores de vendas e de prestação de serviços|supervisor de vendas de produtos
521105|Vendedor em comércio atacadista|Operadores do comércio em lojas e mercados|vendedor em comercio atacadista
521110|Vendedor de comércio varejista|Operadores do comércio em lojas e mercados|vendedor de comercio varejista
521115|Promotor de vendas|Operadores do comércio em lojas e mercados|promotor de vendas
521120|Demonstrador de mercadorias|Operadores do comércio em lojas e mercados|demonstrador de mercadorias
521125|Repositor de mercadorias|Operadores do comércio em lojas e mercados|repositor de mercadorias
521130|Atendente de farmácia - balconista|Operadores do comércio em lojas e mercados|atendente de farmacia - balconista
521135|Frentista|Operadores do comércio em lojas e mercados|frentista
521140|Atendente de lojas e mercados|Operadores do comércio em lojas e mercados|atendente de lojas e mercados
523105|Instalador de cortinas e persianas, portas sanfonadas e boxe|Instaladores de produtos e acessórios|instalador de cortinas e persianas, portas sanfonadas e boxe
523110|Instalador de som e acessórios de veículos|Instaladores de produtos e acessórios|instalador de som e acessorios de veiculos
523115|Chaveiro|Instaladores de produtos e acessórios|chaveiro
523120|Aplicador de vinil autoadesivo|Instaladores de produtos e acessórios|aplicador de vinil autoadesivo
523125|Estampador de placa de identificação veicular (epiv)|Instaladores de produtos e acessórios|estampador de placa de identificacao veicular (epiv)
524105|Vendedor em domicílio|Vendedores em domicílio|vendedor em domicilio
524205|Feirante|Vendedores em bancas, quiosques e barracas|feirante
524210|Jornaleiro (em banca de jornal)|Vendedores em bancas, quiosques e barracas|jornaleiro (em banca de jornal)
524215|Vendedor  permissionário|Vendedores em bancas, quiosques e barracas|vendedor  permissionario
524305|Vendedor ambulante|Vendedores ambulantes|vendedor ambulante
524310|Pipoqueiro ambulante|Vendedores ambulantes|pipoqueiro ambulante
524315|Baiana de acarajé|Vendedores ambulantes|baiana de acaraje
611005|Produtor agropecuário, em geral|Produtores agropecuários em geral|produtor agropecuario, em geral
612005|Produtor agrícola polivalente|Produtores agrícolas polivalentes|produtor agricola polivalente
612105|Produtor de arroz|Produtores agrícolas na cultura de gramíneas|produtor de arroz
612110|Produtor de cana-de-açúcar|Produtores agrícolas na cultura de gramíneas|produtor de cana-de-acucar
612115|Produtor de cereais de inverno|Produtores agrícolas na cultura de gramíneas|produtor de cereais de inverno
612120|Produtor de gramíneas forrageiras|Produtores agrícolas na cultura de gramíneas|produtor de gramineas forrageiras
612125|Produtor de milho e sorgo|Produtores agrícolas na cultura de gramíneas|produtor de milho e sorgo
612205|Produtor de algodão|Produtores agrícolas na cultura de plantas fibrosas|produtor de algodao
612210|Produtor de curauá|Produtores agrícolas na cultura de plantas fibrosas|produtor de curaua
612215|Produtor de juta|Produtores agrícolas na cultura de plantas fibrosas|produtor de juta
612220|Produtor de rami|Produtores agrícolas na cultura de plantas fibrosas|produtor de rami
612225|Produtor de sisal|Produtores agrícolas na cultura de plantas fibrosas|produtor de sisal
612305|Produtor na olericultura de legumes|Produtores agrícolas na olericultura|produtor na olericultura de legumes
612310|Produtor na olericultura de raízes, bulbos e tubérculos|Produtores agrícolas na olericultura|produtor na olericultura de raizes, bulbos e tuberculos
612315|Produtor na olericultura de talos, folhas e flores|Produtores agrícolas na olericultura|produtor na olericultura de talos, folhas e flores
612320|Produtor na olericultura de frutos e sementes|Produtores agrícolas na olericultura|produtor na olericultura de frutos e sementes
612405|Produtor de flores de corte|Produtores agrícolas no cultivo de flores e plantas ornamentais|produtor de flores de corte
612410|Produtor de flores em vaso|Produtores agrícolas no cultivo de flores e plantas ornamentais|produtor de flores em vaso
612415|Produtor de forrações|Produtores agrícolas no cultivo de flores e plantas ornamentais|produtor de forracoes
612420|Produtor de plantas ornamentais|Produtores agrícolas no cultivo de flores e plantas ornamentais|produtor de plantas ornamentais
612505|Produtor de árvores frutíferas|Produtores agrícolas na fruticultura|produtor de arvores frutiferas
612510|Produtor de espécies frutíferas rasteiras|Produtores agrícolas na fruticultura|produtor de especies frutiferas rasteiras
612515|Produtor de espécies frutíferas trepadeiras|Produtores agrícolas na fruticultura|produtor de especies frutiferas trepadeiras
612605|Cafeicultor|Produtores agrícolas na cultura de plantas estimulantes|cafeicultor
612610|Produtor de cacau|Produtores agrícolas na cultura de plantas estimulantes|produtor de cacau
612615|Produtor de erva-mate|Produtores agrícolas na cultura de plantas estimulantes|produtor de erva-mate
612620|Produtor de fumo|Produtores agrícolas na cultura de plantas estimulantes|produtor de fumo
612625|Produtor de guaraná|Produtores agrícolas na cultura de plantas estimulantes|produtor de guarana
612705|Produtor da cultura de amendoim|Produtores agrícolas na cultura de plantas oleaginosas|produtor da cultura de amendoim
612710|Produtor da cultura de canola|Produtores agrícolas na cultura de plantas oleaginosas|produtor da cultura de canola
612715|Produtor da cultura de coco-da-baia|Produtores agrícolas na cultura de plantas oleaginosas|produtor da cultura de coco-da-baia
612720|Produtor da cultura de dendê|Produtores agrícolas na cultura de plantas oleaginosas|produtor da cultura de dende
612725|Produtor da cultura de girassol|Produtores agrícolas na cultura de plantas oleaginosas|produtor da cultura de girassol
612730|Produtor da cultura de linho|Produtores agrícolas na cultura de plantas oleaginosas|produtor da cultura de linho
612735|Produtor da cultura de mamona|Produtores agrícolas na cultura de plantas oleaginosas|produtor da cultura de mamona
612740|Produtor da cultura de soja|Produtores agrícolas na cultura de plantas oleaginosas|produtor da cultura de soja
612805|Produtor de especiarias|Produtores de especiarias e de plantas aromáticas e medicinais|produtor de especiarias
612810|Produtor de plantas aromáticas e medicinais|Produtores de especiarias e de plantas aromáticas e medicinais|produtor de plantas aromaticas e medicinais
613005|Criador em pecuária polivalente|Produtores em pecuária polivalente|criador em pecuaria polivalente
613010|Criador de animais domésticos|Produtores em pecuária polivalente|criador de animais domesticos
613105|Criador de asininos e muares|Produtores em pecuária de animais de grande porte|criador de asininos e muares
613110|Criador de bovinos (corte)|Produtores em pecuária de animais de grande porte|criador de bovinos (corte)
613115|Criador de bovinos (leite)|Produtores em pecuária de animais de grande porte|criador de bovinos (leite)
613120|Criador de bubalinos (corte)|Produtores em pecuária de animais de grande porte|criador de bubalinos (corte)
613125|Criador de bubalinos (leite)|Produtores em pecuária de animais de grande porte|criador de bubalinos (leite)
613130|Criador de equínos|Produtores em pecuária de animais de grande porte|criador de equinos
613205|Criador de caprinos|Produtores em pecuária de animais de médio porte|criador de caprinos
613210|Criador de ovinos|Produtores em pecuária de animais de médio porte|criador de ovinos
613215|Criador de suínos|Produtores em pecuária de animais de médio porte|criador de suinos
613305|Avicultor|Produtores da avicultura e cunicultura|avicultor
613310|Cunicultor|Produtores da avicultura e cunicultura|cunicultor
613405|Apicultor|Produtores de animais e insetos úteis|apicultor
613410|Criador de animais produtores de veneno|Produtores de animais e insetos úteis|criador de animais produtores de veneno
613415|Minhocultor|Produtores de animais e insetos úteis|minhocultor
613420|Sericultor|Produtores de animais e insetos úteis|sericultor
620105|Supervisor de exploração agrícola|Supervisores na exploração agropecuária|supervisor de exploracao agricola
620110|Supervisor de exploração agropecuária|Supervisores na exploração agropecuária|supervisor de exploracao agropecuaria
620115|Supervisor de exploração pecuária|Supervisores na exploração agropecuária|supervisor de exploracao pecuaria
621005|Trabalhador agropecuário em geral|Trabalhadores agropecuários em geral|trabalhador agropecuario em geral
622005|Caseiro (agricultura)|Trabalhadores de apoio à agricultura|caseiro (agricultura)
622010|Jardineiro|Trabalhadores de apoio à agricultura|jardineiro
622015|Trabalhador na produção de mudas e sementes|Trabalhadores de apoio à agricultura|trabalhador na producao de mudas e sementes
622020|Trabalhador volante da agricultura|Trabalhadores de apoio à agricultura|trabalhador volante da agricultura
622105|Trabalhador da cultura de arroz|Trabalhadores agrícolas na cultura de gramíneas|trabalhador da cultura de arroz
622110|Trabalhador da cultura de cana-de-açúcar|Trabalhadores agrícolas na cultura de gramíneas|trabalhador da cultura de cana-de-acucar
622115|Trabalhador da cultura de milho e sorgo|Trabalhadores agrícolas na cultura de gramíneas|trabalhador da cultura de milho e sorgo
622120|Trabalhador da cultura de trigo, aveia, cevada e triticale|Trabalhadores agrícolas na cultura de gramíneas|trabalhador da cultura de trigo, aveia, cevada e triticale
622205|Trabalhador da cultura de algodão|Trabalhadores agrícolas na cultura de plantas fibrosas|trabalhador da cultura de algodao
622210|Trabalhador da cultura de sisal|Trabalhadores agrícolas na cultura de plantas fibrosas|trabalhador da cultura de sisal
622215|Trabalhador da cultura do rami|Trabalhadores agrícolas na cultura de plantas fibrosas|trabalhador da cultura do rami
622305|Trabalhador na olericultura (frutos e sementes)|Trabalhadores agrícolas na olericultura|trabalhador na olericultura (frutos e sementes)
622310|Trabalhador na olericultura (legumes)|Trabalhadores agrícolas na olericultura|trabalhador na olericultura (legumes)
622315|Trabalhador na olericultura (raízes, bulbos e tubérculos)|Trabalhadores agrícolas na olericultura|trabalhador na olericultura (raizes, bulbos e tuberculos)
622320|Trabalhador na olericultura (talos, folhas e flores)|Trabalhadores agrícolas na olericultura|trabalhador na olericultura (talos, folhas e flores)
622405|Trabalhador no cultivo de flores e folhagens de corte|Trabalhadores agrícolas no cultivo de flores e plantas ornamentais|trabalhador no cultivo de flores e folhagens de corte
622410|Trabalhador no cultivo de flores em vaso|Trabalhadores agrícolas no cultivo de flores e plantas ornamentais|trabalhador no cultivo de flores em vaso
622415|Trabalhador no cultivo de forrações|Trabalhadores agrícolas no cultivo de flores e plantas ornamentais|trabalhador no cultivo de forracoes
622420|Trabalhador no cultivo de mudas|Trabalhadores agrícolas no cultivo de flores e plantas ornamentais|trabalhador no cultivo de mudas
622425|Trabalhador no cultivo de plantas ornamentais|Trabalhadores agrícolas no cultivo de flores e plantas ornamentais|trabalhador no cultivo de plantas ornamentais
622505|Trabalhador no cultivo de árvores frutíferas|Trabalhadores agrícolas na fruticultura|trabalhador no cultivo de arvores frutiferas
622510|Trabalhador no cultivo de espécies frutíferas rasteiras|Trabalhadores agrícolas na fruticultura|trabalhador no cultivo de especies frutiferas rasteiras
622515|Trabalhador no cultivo de trepadeiras frutíferas|Trabalhadores agrícolas na fruticultura|trabalhador no cultivo de trepadeiras frutiferas
622605|Trabalhador da cultura de cacau|Trabalhadores agrícolas nas culturas de plantas estimulantes|trabalhador da cultura de cacau
622610|Trabalhador da cultura de café|Trabalhadores agrícolas nas culturas de plantas estimulantes|trabalhador da cultura de cafe
622615|Trabalhador da cultura de erva-mate|Trabalhadores agrícolas nas culturas de plantas estimulantes|trabalhador da cultura de erva-mate
622620|Trabalhador da cultura de fumo|Trabalhadores agrícolas nas culturas de plantas estimulantes|trabalhador da cultura de fumo
622625|Trabalhador da cultura de guaraná|Trabalhadores agrícolas nas culturas de plantas estimulantes|trabalhador da cultura de guarana
622705|Trabalhador na cultura de amendoim|Trabalhadores agrícolas na cultura de plantas oleaginosas|trabalhador na cultura de amendoim
622710|Trabalhador na cultura de canola|Trabalhadores agrícolas na cultura de plantas oleaginosas|trabalhador na cultura de canola
622715|Trabalhador na cultura de coco-da-baía|Trabalhadores agrícolas na cultura de plantas oleaginosas|trabalhador na cultura de coco-da-baia
622720|Trabalhador na cultura de dendê|Trabalhadores agrícolas na cultura de plantas oleaginosas|trabalhador na cultura de dende
622725|Trabalhador na cultura de mamona|Trabalhadores agrícolas na cultura de plantas oleaginosas|trabalhador na cultura de mamona
622730|Trabalhador na cultura de soja|Trabalhadores agrícolas na cultura de plantas oleaginosas|trabalhador na cultura de soja
622735|Trabalhador na cultura do girassol|Trabalhadores agrícolas na cultura de plantas oleaginosas|trabalhador na cultura do girassol
622740|Trabalhador na cultura do linho|Trabalhadores agrícolas na cultura de plantas oleaginosas|trabalhador na cultura do linho
622805|Trabalhador da cultura de especiarias|Trabalhadores agrícolas da cultura de especiarias e de plantas aromáticas e medicinais|trabalhador da cultura de especiarias
622810|Trabalhador da cultura de plantas aromáticas e medicinais|Trabalhadores agrícolas da cultura de especiarias e de plantas aromáticas e medicinais|trabalhador da cultura de plantas aromaticas e medicinais
623005|Adestrador de animais|Tratadores polivalentes de animais|adestrador de animais
623010|Inseminador|Tratadores polivalentes de animais|inseminador
623015|Trabalhador de pecuária polivalente|Tratadores polivalentes de animais|trabalhador de pecuaria polivalente
623020|Tratador de animais|Tratadores polivalentes de animais|tratador de animais
623025|Casqueador de animais|Tratadores polivalentes de animais|casqueador de animais
623030|Ferrador de animais|Tratadores polivalentes de animais|ferrador de animais
623035|Instrutor de mobilidade com cães-guia|Tratadores polivalentes de animais|instrutor de mobilidade com caes-guia
623105|Trabalhador da pecuária (asininos e muares)|Trabalhadores na pecuária de animais de grande porte|trabalhador da pecuaria (asininos e muares)
623110|Trabalhador da pecuária (bovinos corte)|Trabalhadores na pecuária de animais de grande porte|trabalhador da pecuaria (bovinos corte)
623115|Trabalhador da pecuária (bovinos leite)|Trabalhadores na pecuária de animais de grande porte|trabalhador da pecuaria (bovinos leite)
623120|Trabalhador da pecuária (bubalinos)|Trabalhadores na pecuária de animais de grande porte|trabalhador da pecuaria (bubalinos)
623125|Trabalhador da pecuária (equinos)|Trabalhadores na pecuária de animais de grande porte|trabalhador da pecuaria (equinos)
623205|Trabalhador da caprinocultura|Trabalhadores na pecuária de animais de médio porte|trabalhador da caprinocultura
623210|Trabalhador da ovinocultura|Trabalhadores na pecuária de animais de médio porte|trabalhador da ovinocultura
623215|Trabalhador da suinocultura|Trabalhadores na pecuária de animais de médio porte|trabalhador da suinocultura
623305|Trabalhador da avicultura de corte|Trabalhadores na avicultura e cunicultura|trabalhador da avicultura de corte
623310|Trabalhador da avicultura de postura|Trabalhadores na avicultura e cunicultura|trabalhador da avicultura de postura
623315|Operador de incubadora de ovos|Trabalhadores na avicultura e cunicultura|operador de incubadora de ovos
623320|Trabalhador da cunicultura|Trabalhadores na avicultura e cunicultura|trabalhador da cunicultura
623325|Sexador|Trabalhadores na avicultura e cunicultura|sexador
623405|Trabalhador em criatórios de animais produtores de veneno|Trabalhadores na criação de insetos e animais úteis|trabalhador em criatorios de animais produtores de veneno
623410|Trabalhador na apicultura|Trabalhadores na criação de insetos e animais úteis|trabalhador na apicultura
623415|Trabalhador na minhocultura|Trabalhadores na criação de insetos e animais úteis|trabalhador na minhocultura
623420|Trabalhador na sericicultura|Trabalhadores na criação de insetos e animais úteis|trabalhador na sericicultura
630105|Supervisor da aqüicultura|Supervisores na área florestal e aquicultura|supervisor da aquicultura
630110|Supervisor da área florestal|Supervisores na área florestal e aquicultura|supervisor da area florestal
631005|Catador de caranguejos e siris|Pescadores polivalentes|catador de caranguejos e siris
631010|Catador de mariscos|Pescadores polivalentes|catador de mariscos
631015|Pescador artesanal de lagostas|Pescadores polivalentes|pescador artesanal de lagostas
631020|Pescador artesanal de peixes e camarões|Pescadores polivalentes|pescador artesanal de peixes e camaroes
631105|Pescador artesanal de água doce|Pescadores profissionais artesanais de água doce|pescador artesanal de agua doce
631205|Pescador industrial|Pescadores de água costeira e alto mar|pescador industrial
631210|Pescador profissional|Pescadores de água costeira e alto mar|pescador profissional
631305|Criador de camarões|Criadores de animais aquáticos|criador de camaroes
631310|Criador de jacarés|Criadores de animais aquáticos|criador de jacares
631315|Criador de mexilhões|Criadores de animais aquáticos|criador de mexilhoes
631320|Criador de ostras|Criadores de animais aquáticos|criador de ostras
631325|Criador de peixes|Criadores de animais aquáticos|criador de peixes
631330|Criador de quelônios|Criadores de animais aquáticos|criador de quelonios
631335|Criador de rãs|Criadores de animais aquáticos|criador de ras
631405|Gelador industrial|Trabalhadores de apoio à pesca|gelador industrial
631410|Gelador profissional|Trabalhadores de apoio à pesca|gelador profissional
631415|Proeiro|Trabalhadores de apoio à pesca|proeiro
631420|Redeiro (pesca)|Trabalhadores de apoio à pesca|redeiro (pesca)
632005|Guia florestal|Trabalhadores florestais polivalentes|guia florestal
632010|Raizeiro|Trabalhadores florestais polivalentes|raizeiro
632015|Viveirista florestal|Trabalhadores florestais polivalentes|viveirista florestal
632105|Classificador de toras|Extrativistas e reflorestadores de espécies produtoras de madeira|classificador de toras
632110|Cubador de madeira|Extrativistas e reflorestadores de espécies produtoras de madeira|cubador de madeira
632115|Identificador florestal|Extrativistas e reflorestadores de espécies produtoras de madeira|identificador florestal
632120|Operador de motosserra|Extrativistas e reflorestadores de espécies produtoras de madeira|operador de motosserra
632125|Trabalhador de extração florestal, em geral|Extrativistas e reflorestadores de espécies produtoras de madeira|trabalhador de extracao florestal, em geral
632205|Seringueiro|Extrativistas florestais de espécies produtoras de gomas e resinas|seringueiro
632210|Trabalhador da exploração de espécies produtoras de gomas não elásticas|Extrativistas florestais de espécies produtoras de gomas e resinas|trabalhador da exploracao de especies produtoras de gomas nao elasticas
632215|Trabalhador da exploração de resinas|Extrativistas florestais de espécies produtoras de gomas e resinas|trabalhador da exploracao de resinas
632305|Trabalhador da exploração de andiroba|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de andiroba
632310|Trabalhador da exploração de babaçu|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de babacu
632315|Trabalhador da exploração de bacaba|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de bacaba
632320|Trabalhador da exploração de buriti|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de buriti
632325|Trabalhador da exploração de carnaúba|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de carnauba
632330|Trabalhador da exploração de coco-da-praia|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de coco-da-praia
632335|Trabalhador da exploração de copaíba|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de copaiba
632340|Trabalhador da exploração de malva (pãina)|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de malva (paina)
632345|Trabalhador da exploração de murumuru|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de murumuru
632350|Trabalhador da exploração de oiticica|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de oiticica
632355|Trabalhador da exploração de ouricuri|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de ouricuri
632360|Trabalhador da exploração de pequi|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de pequi
632365|Trabalhador da exploração de piaçava|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de piacava
632370|Trabalhador da exploração de tucum|Extrativistas florestais de espécies produtoras de fibras, ceras e óleos|trabalhador da exploracao de tucum
632405|Trabalhador da exploração de açaí|Extrativistas florestais de espécies produtoras de alimentos silvestres|trabalhador da exploracao de acai
632410|Trabalhador da exploração de castanha|Extrativistas florestais de espécies produtoras de alimentos silvestres|trabalhador da exploracao de castanha
632415|Trabalhador da exploração de pinhão|Extrativistas florestais de espécies produtoras de alimentos silvestres|trabalhador da exploracao de pinhao
632420|Trabalhador da exploração de pupunha|Extrativistas florestais de espécies produtoras de alimentos silvestres|trabalhador da exploracao de pupunha
632505|Trabalhador da exploração de árvores e arbustos produtores de substâncias aromáticas, medicinais e tóxicas|Extrativistas florestais de espécies produtoras de substâncias aromáticas, medicinais e tóxicas|trabalhador da exploracao de arvores e arbustos produtores de substancias aromaticas, medicinais e toxicas
632510|Trabalhador da exploração de cipós produtores de substâncias aromáticas, medicinais e tóxicas|Extrativistas florestais de espécies produtoras de substâncias aromáticas, medicinais e tóxicas|trabalhador da exploracao de cipos produtores de substancias aromaticas, medicinais e toxicas
632515|Trabalhador da exploração de madeiras tanantes|Extrativistas florestais de espécies produtoras de substâncias aromáticas, medicinais e tóxicas|trabalhador da exploracao de madeiras tanantes
632520|Trabalhador da exploração de raízes produtoras de substâncias aromáticas, medicinais e tóxicas|Extrativistas florestais de espécies produtoras de substâncias aromáticas, medicinais e tóxicas|trabalhador da exploracao de raizes produtoras de substancias aromaticas, medicinais e toxicas
632525|Trabalhador da extração de substâncias aromáticas, medicinais e tóxicas, em geral|Extrativistas florestais de espécies produtoras de substâncias aromáticas, medicinais e tóxicas|trabalhador da extracao de substancias aromaticas, medicinais e toxicas, em geral
632605|Carvoeiro|Carvoejadores|carvoeiro
632610|Carbonizador|Carvoejadores|carbonizador
632615|Ajudante de carvoaria|Carvoejadores|ajudante de carvoaria
641005|Operador de colheitadeira|Trabalhadores da mecanização agrícola|operador de colheitadeira
641010|Operador de máquinas de beneficiamento de produtos agrícolas|Trabalhadores da mecanização agrícola|operador de maquinas de beneficiamento de produtos agricolas
641015|Tratorista agrícola|Trabalhadores da mecanização agrícola|tratorista agricola
642005|Operador de colhedor florestal|Trabalhadores da mecanização florestal|operador de colhedor florestal
642010|Operador de máquinas florestais estáticas|Trabalhadores da mecanização florestal|operador de maquinas florestais estaticas
642015|Operador de trator florestal|Trabalhadores da mecanização florestal|operador de trator florestal
643005|Trabalhador na operação de sistema de irrigação localizada (microaspersão e gotejamento)|Trabalhadores da irrigação e drenagem|trabalhador na operacao de sistema de irrigacao localizada (microaspersao e gotejamento)
643010|Trabalhador na operação de sistema de irrigação por aspersão (pivô central)|Trabalhadores da irrigação e drenagem|trabalhador na operacao de sistema de irrigacao por aspersao (pivo central)
643015|Trabalhador na operação de sistemas convencionais de irrigação por aspersão|Trabalhadores da irrigação e drenagem|trabalhador na operacao de sistemas convencionais de irrigacao por aspersao
643020|Trabalhador na operação de sistemas de irrigação e aspersão (alto propelido)|Trabalhadores da irrigação e drenagem|trabalhador na operacao de sistemas de irrigacao e aspersao (alto propelido)
643025|Trabalhador na operação de sistemas de irrigação por superfície e drenagem|Trabalhadores da irrigação e drenagem|trabalhador na operacao de sistemas de irrigacao por superficie e drenagem
710105|Supervisor de apoio operacional na mineração|Supervisores da extração mineral|supervisor de apoio operacional na mineracao
710110|Supervisor de extração de sal|Supervisores da extração mineral|supervisor de extracao de sal
710115|Supervisor de perfuração e desmonte|Supervisores da extração mineral|supervisor de perfuracao e desmonte
710120|Supervisor de produção na mineração|Supervisores da extração mineral|supervisor de producao na mineracao
710125|Supervisor de transporte na mineração|Supervisores da extração mineral|supervisor de transporte na mineracao
710205|Mestre (construção civil)|Supervisores da construção civil|mestre (construcao civil)
710210|Mestre de linhas (ferrovias)|Supervisores da construção civil|mestre de linhas (ferrovias)
710215|Inspetor de terraplenagem|Supervisores da construção civil|inspetor de terraplenagem
710220|Supervisor de usina de concreto|Supervisores da construção civil|supervisor de usina de concreto
710225|Fiscal de pátio de usina de concreto|Supervisores da construção civil|fiscal de patio de usina de concreto
711105|Amostrador de minérios|Trabalhadores da extração de minerais sólidos|amostrador de minerios
711110|Canteiro|Trabalhadores da extração de minerais sólidos|canteiro
711115|Destroçador de pedra|Trabalhadores da extração de minerais sólidos|destrocador de pedra
711120|Detonador|Trabalhadores da extração de minerais sólidos|detonador
711125|Escorador de minas|Trabalhadores da extração de minerais sólidos|escorador de minas
711130|Mineiro|Trabalhadores da extração de minerais sólidos|mineiro
711205|Operador de caminhão (minas e pedreiras)|Trabalhadores de extração de minerais sólidos (operadores de máquinas)|operador de caminhao (minas e pedreiras)
711210|Operador de pá carregadeira|Trabalhadores de extração de minerais sólidos (operadores de máquinas)|operador de pa carregadeira
711215|Operador de máquina cortadora (minas e pedreiras)|Trabalhadores de extração de minerais sólidos (operadores de máquinas)|operador de maquina cortadora (minas e pedreiras)
711220|Operador de máquina de extração contínua (minas de carvão)|Trabalhadores de extração de minerais sólidos (operadores de máquinas)|operador de maquina de extracao continua (minas de carvao)
711225|Operador de máquina perfuradora (minas e pedreiras)|Trabalhadores de extração de minerais sólidos (operadores de máquinas)|operador de maquina perfuradora (minas e pedreiras)
711230|Operador de máquina perfuratriz|Trabalhadores de extração de minerais sólidos (operadores de máquinas)|operador de maquina perfuratriz
711235|Operador de motoniveladora (extração de minerais sólidos)|Trabalhadores de extração de minerais sólidos (operadores de máquinas)|operador de motoniveladora (extracao de minerais solidos)
711240|Operador de schutthecar|Trabalhadores de extração de minerais sólidos (operadores de máquinas)|operador de schutthecar
711245|Operador de trator (minas e pedreiras)|Trabalhadores de extração de minerais sólidos (operadores de máquinas)|operador de trator (minas e pedreiras)
711305|Operador de sonda a percussão|Trabalhadores da extração de minerais líquidos e gasosos|operador de sonda a percussao
711310|Operador de sonda rotativa|Trabalhadores da extração de minerais líquidos e gasosos|operador de sonda rotativa
711315|Sondador (poços de petróleo e gás)|Trabalhadores da extração de minerais líquidos e gasosos|sondador (pocos de petroleo e gas)
711320|Sondador de poços (exceto de petróleo e gás)|Trabalhadores da extração de minerais líquidos e gasosos|sondador de pocos (exceto de petroleo e gas)
711325|Plataformista (petróleo)|Trabalhadores da extração de minerais líquidos e gasosos|plataformista (petroleo)
711330|Torrista (petróleo)|Trabalhadores da extração de minerais líquidos e gasosos|torrista (petroleo)
711405|Garimpeiro|Garimpeiros e operadores de salinas|garimpeiro
711410|Operador de salina (sal marinho)|Garimpeiros e operadores de salinas|operador de salina (sal marinho)
712105|Moleiro de minérios|Trabalhadores de beneficiamento de minérios|moleiro de minerios
712110|Operador de aparelho de flotação|Trabalhadores de beneficiamento de minérios|operador de aparelho de flotacao
712115|Operador de aparelho de precipitação (minas de ouro ou prata)|Trabalhadores de beneficiamento de minérios|operador de aparelho de precipitacao (minas de ouro ou prata)
712120|Operador de britador de mandíbulas|Trabalhadores de beneficiamento de minérios|operador de britador de mandibulas
712125|Operador de espessador|Trabalhadores de beneficiamento de minérios|operador de espessador
712130|Operador de jig (minas)|Trabalhadores de beneficiamento de minérios|operador de jig (minas)
712135|Operador de peneiras hidráulicas|Trabalhadores de beneficiamento de minérios|operador de peneiras hidraulicas
712205|Cortador de pedras|Trabalhadores de beneficiamento de pedras ornamentais|cortador de pedras
712210|Gravador de inscrições em pedra|Trabalhadores de beneficiamento de pedras ornamentais|gravador de inscricoes em pedra
712215|Gravador de relevos em pedra|Trabalhadores de beneficiamento de pedras ornamentais|gravador de relevos em pedra
712220|Polidor de pedras|Trabalhadores de beneficiamento de pedras ornamentais|polidor de pedras
712225|Torneiro (lavra de pedra)|Trabalhadores de beneficiamento de pedras ornamentais|torneiro (lavra de pedra)
712230|Traçador de pedras|Trabalhadores de beneficiamento de pedras ornamentais|tracador de pedras
715105|Operador de bate-estacas|Trabalhadores na operação de máquinas de terraplenagem e fundações|operador de bate-estacas
715110|Operador de compactadora de solos|Trabalhadores na operação de máquinas de terraplenagem e fundações|operador de compactadora de solos
715115|Operador de escavadeira|Trabalhadores na operação de máquinas de terraplenagem e fundações|operador de escavadeira
715120|Operador de máquina de abrir valas|Trabalhadores na operação de máquinas de terraplenagem e fundações|operador de maquina de abrir valas
715125|Operador de máquinas de construção civil e mineração|Trabalhadores na operação de máquinas de terraplenagem e fundações|operador de maquinas de construcao civil e mineracao
715130|Operador de motoniveladora|Trabalhadores na operação de máquinas de terraplenagem e fundações|operador de motoniveladora
715135|Operador de pá carregadeira|Trabalhadores na operação de máquinas de terraplenagem e fundações|operador de pa carregadeira
715140|Operador de pavimentadora (asfalto, concreto e materiais similares)|Trabalhadores na operação de máquinas de terraplenagem e fundações|operador de pavimentadora (asfalto, concreto e materiais similares)
715145|Operador de trator de lâmina|Trabalhadores na operação de máquinas de terraplenagem e fundações|operador de trator de lamina
715205|Calceteiro|Trabalhadores de estruturas de alvenaria|calceteiro
715210|Pedreiro|Trabalhadores de estruturas de alvenaria|pedreiro
715215|Pedreiro (chaminés industriais)|Trabalhadores de estruturas de alvenaria|pedreiro (chamines industriais)
715220|Pedreiro (material refratário)|Trabalhadores de estruturas de alvenaria|pedreiro (material refratario)
715225|Pedreiro (mineração)|Trabalhadores de estruturas de alvenaria|pedreiro (mineracao)
715230|Pedreiro de edificações|Trabalhadores de estruturas de alvenaria|pedreiro de edificacoes
715305|Armador de estrutura de concreto|Montadores de estruturas de concreto armado|armador de estrutura de concreto
715310|Moldador de corpos de prova em usinas de concreto|Montadores de estruturas de concreto armado|moldador de corpos de prova em usinas de concreto
715315|Armador de estrutura de concreto armado|Montadores de estruturas de concreto armado|armador de estrutura de concreto armado
715405|Operador de betoneira|Trabalhadores na operação de máquinas de concreto usinado e afins|operador de betoneira
715410|Operador de bomba de concreto|Trabalhadores na operação de máquinas de concreto usinado e afins|operador de bomba de concreto
715415|Operador de central de concreto|Trabalhadores na operação de máquinas de concreto usinado e afins|operador de central de concreto
715420|Operador de usina de asfalto|Trabalhadores na operação de máquinas de concreto usinado e afins|operador de usina de asfalto
715505|Carpinteiro|Trabalhadores de montagem de estruturas de madeira, metal e compósitos em obras civis|carpinteiro
715510|Carpinteiro (esquadrias)|Trabalhadores de montagem de estruturas de madeira, metal e compósitos em obras civis|carpinteiro (esquadrias)
715515|Carpinteiro (cenários)|Trabalhadores de montagem de estruturas de madeira, metal e compósitos em obras civis|carpinteiro (cenarios)
715520|Carpinteiro (mineração)|Trabalhadores de montagem de estruturas de madeira, metal e compósitos em obras civis|carpinteiro (mineracao)
715525|Carpinteiro de obras|Trabalhadores de montagem de estruturas de madeira, metal e compósitos em obras civis|carpinteiro de obras
715530|Carpinteiro (telhados)|Trabalhadores de montagem de estruturas de madeira, metal e compósitos em obras civis|carpinteiro (telhados)
715535|Carpinteiro de fôrmas para concreto|Trabalhadores de montagem de estruturas de madeira, metal e compósitos em obras civis|carpinteiro de formas para concreto
715540|Carpinteiro de obras civis de arte (pontes, túneis, barragens)|Trabalhadores de montagem de estruturas de madeira, metal e compósitos em obras civis|carpinteiro de obras civis de arte (pontes, tuneis, barragens)
715545|Montador de andaimes (edificações)|Trabalhadores de montagem de estruturas de madeira, metal e compósitos em obras civis|montador de andaimes (edificacoes)
715605|Eletricista de instalações (cenários)|Trabalhadores de instalações elétricas|eletricista de instalacoes (cenarios)
715610|Eletricista de instalações (edifícios)|Trabalhadores de instalações elétricas|eletricista de instalacoes (edificios)
715615|Eletricista de instalações|Trabalhadores de instalações elétricas|eletricista de instalacoes
715705|Aplicador de asfalto impermeabilizante (coberturas)|Aplicadores de materiais isolantes|aplicador de asfalto impermeabilizante (coberturas)
715710|Instalador de isolantes acústicos|Aplicadores de materiais isolantes|instalador de isolantes acusticos
715715|Instalador de isolantes térmicos (refrigeração e climatização)|Aplicadores de materiais isolantes|instalador de isolantes termicos (refrigeracao e climatizacao)
715720|Instalador de isolantes térmicos de caldeira e tubulações|Aplicadores de materiais isolantes|instalador de isolantes termicos de caldeira e tubulacoes
715725|Instalador de material isolante, à mão (edificações)|Aplicadores de materiais isolantes|instalador de material isolante, a mao (edificacoes)
715730|Instalador de material isolante, à máquina (edificações)|Aplicadores de materiais isolantes|instalador de material isolante, a maquina (edificacoes)
716105|Acabador de superfícies de concreto|Revestidores de concreto|acabador de superficies de concreto
716110|Revestidor de superfícies de concreto|Revestidores de concreto|revestidor de superficies de concreto
716205|Telhador (telhas de argila e materiais similares)|Telhadores (revestimentos rígidos)|telhador (telhas de argila e materiais similares)
716210|Telhador (telhas de fibrocimento)|Telhadores (revestimentos rígidos)|telhador (telhas de fibrocimento)
716215|Telhador (telhas metálicas)|Telhadores (revestimentos rígidos)|telhador (telhas metalicas)
716220|Telhador (telhas plásticas)|Telhadores (revestimentos rígidos)|telhador (telhas plasticas)
716305|Vidraceiro|Vidraceiros (revestimentos rígidos)|vidraceiro
716310|Vidraceiro (edificações)|Vidraceiros (revestimentos rígidos)|vidraceiro (edificacoes)
716315|Vidraceiro (vitrais)|Vidraceiros (revestimentos rígidos)|vidraceiro (vitrais)
716405|Gesseiro|Gesseiros|gesseiro
716505|Assentador de revestimentos e laminados de madeira|Aplicadores de revestimentos cerâmicos, pastilhas, pedras e madeiras|assentador de revestimentos e laminados de madeira
716510|Assentador de revestimentos cerâmicos|Aplicadores de revestimentos cerâmicos, pastilhas, pedras e madeiras|assentador de revestimentos ceramicos
716515|Pastilheiro|Aplicadores de revestimentos cerâmicos, pastilhas, pedras e madeiras|pastilheiro
716520|Lustrador de piso|Aplicadores de revestimentos cerâmicos, pastilhas, pedras e madeiras|lustrador de piso
716525|Assentador de mármores, granitos e outras pedras decorativas|Aplicadores de revestimentos cerâmicos, pastilhas, pedras e madeiras|assentador de marmores, granitos e outras pedras decorativas
716530|Mosaísta|Aplicadores de revestimentos cerâmicos, pastilhas, pedras e madeiras|mosaista
716535|Taqueiro|Aplicadores de revestimentos cerâmicos, pastilhas, pedras e madeiras|taqueiro
716540|Rejuntador de revestimentos|Aplicadores de revestimentos cerâmicos, pastilhas, pedras e madeiras|rejuntador de revestimentos
716605|Calafetador|Pintores de obras e revestidores de interiores (revestimentos flexíveis)|calafetador
716610|Pintor de obras|Pintores de obras e revestidores de interiores (revestimentos flexíveis)|pintor de obras
716615|Revestidor de interiores (papel, material plástico e emborrachados)|Pintores de obras e revestidores de interiores (revestimentos flexíveis)|revestidor de interiores (papel, material plastico e emborrachados)
717005|Demolidor de edificações|Operadores de equipamentos da construção civil|demolidor de edificacoes
717010|Operador de martelete|Operadores de equipamentos da construção civil|operador de martelete
717015|Poceiro (edificações)|Operadores de equipamentos da construção civil|poceiro (edificacoes)
717020|Servente de obras|Operadores de equipamentos da construção civil|servente de obras
717025|Vibradorista|Operadores de equipamentos da construção civil|vibradorista
720105|Mestre (afiador de ferramentas)|Supervisores de usinagem, conformação e tratamento de metais|mestre (afiador de ferramentas)
720110|Mestre de caldeiraria|Supervisores de usinagem, conformação e tratamento de metais|mestre de caldeiraria
720115|Mestre de ferramentaria|Supervisores de usinagem, conformação e tratamento de metais|mestre de ferramentaria
720120|Mestre de forjaria|Supervisores de usinagem, conformação e tratamento de metais|mestre de forjaria
720125|Mestre de fundição|Supervisores de usinagem, conformação e tratamento de metais|mestre de fundicao
720130|Mestre de galvanoplastia|Supervisores de usinagem, conformação e tratamento de metais|mestre de galvanoplastia
720135|Mestre de pintura (tratamento de superfícies)|Supervisores de usinagem, conformação e tratamento de metais|mestre de pintura (tratamento de superficies)
720140|Mestre de soldagem|Supervisores de usinagem, conformação e tratamento de metais|mestre de soldagem
720145|Mestre de trefilação de metais|Supervisores de usinagem, conformação e tratamento de metais|mestre de trefilacao de metais
720150|Mestre de usinagem|Supervisores de usinagem, conformação e tratamento de metais|mestre de usinagem
720155|Mestre serralheiro|Supervisores de usinagem, conformação e tratamento de metais|mestre serralheiro
720160|Supervisor de controle de tratamento térmico|Supervisores de usinagem, conformação e tratamento de metais|supervisor de controle de tratamento termico
720205|Mestre (construção naval)|Supervisores da fabricação e montagem metalmecânica|mestre (construcao naval)
720210|Mestre (indústria de automotores e material de transportes)|Supervisores da fabricação e montagem metalmecânica|mestre (industria de automotores e material de transportes)
720215|Mestre (indústria de máquinas e outros equipamentos mecânicos)|Supervisores da fabricação e montagem metalmecânica|mestre (industria de maquinas e outros equipamentos mecanicos)
720220|Mestre de construção de fornos|Supervisores da fabricação e montagem metalmecânica|mestre de construcao de fornos
721105|Ferramenteiro|Ferramenteiros e afins|ferramenteiro
721110|Ferramenteiro de mandris, calibradores e outros dispositivos|Ferramenteiros e afins|ferramenteiro de mandris, calibradores e outros dispositivos
721115|Modelador de metais (fundição)|Ferramenteiros e afins|modelador de metais (fundicao)
721205|Operador de máquina de eletroerosão|Preparadores e operadores de máquinas-ferramenta convencionais|operador de maquina de eletroerosao
721210|Operador de máquinas operatrizes|Preparadores e operadores de máquinas-ferramenta convencionais|operador de maquinas operatrizes
721215|Operador de máquinas-ferramenta convencionais|Preparadores e operadores de máquinas-ferramenta convencionais|operador de maquinas-ferramenta convencionais
721220|Operador de usinagem convencional por abrasão|Preparadores e operadores de máquinas-ferramenta convencionais|operador de usinagem convencional por abrasao
721225|Preparador de máquinas-ferramenta|Preparadores e operadores de máquinas-ferramenta convencionais|preparador de maquinas-ferramenta
721305|Afiador de cardas|Afiadores e polidores de metais|afiador de cardas
721310|Afiador de cutelaria|Afiadores e polidores de metais|afiador de cutelaria
721315|Afiador de ferramentas|Afiadores e polidores de metais|afiador de ferramentas
721320|Afiador de serras|Afiadores e polidores de metais|afiador de serras
721325|Polidor de metais|Afiadores e polidores de metais|polidor de metais
721405|Operador de centro de usinagem com comando numérico|Operadores de máquinas de usinagem cnc|operador de centro de usinagem com comando numerico
721410|Operador de fresadora com comando numérico|Operadores de máquinas de usinagem cnc|operador de fresadora com comando numerico
721415|Operador de mandriladora com comando numérico|Operadores de máquinas de usinagem cnc|operador de mandriladora com comando numerico
721420|Operador de máquina eletroerosão, à fio, com comando numérico|Operadores de máquinas de usinagem cnc|operador de maquina eletroerosao, a fio, com comando numerico
721425|Operador de retificadora com comando numérico|Operadores de máquinas de usinagem cnc|operador de retificadora com comando numerico
721430|Operador de torno com comando numérico|Operadores de máquinas de usinagem cnc|operador de torno com comando numerico
722105|Forjador|Trabalhadores de forjamento de metais|forjador
722110|Forjador a martelo|Trabalhadores de forjamento de metais|forjador a martelo
722115|Forjador prensista|Trabalhadores de forjamento de metais|forjador prensista
722205|Fundidor de metais|Trabalhadores de fundição de metais puros e de ligas metálicas|fundidor de metais
722210|Operador de lingotamento|Trabalhadores de fundição de metais puros e de ligas metálicas|operador de lingotamento
722215|Operador de acabamento de peças fundidas|Trabalhadores de fundição de metais puros e de ligas metálicas|operador de acabamento de pecas fundidas
722220|Operador de máquina de fundição|Trabalhadores de fundição de metais puros e de ligas metálicas|operador de maquina de fundicao
722230|Operador de vazamento|Trabalhadores de fundição de metais puros e de ligas metálicas|operador de vazamento
722235|Preparador de panelas|Trabalhadores de fundição de metais puros e de ligas metálicas|preparador de panelas
722305|Macheiro, a mão|Trabalhadores de moldagem de metais e de ligas metálicas|macheiro, a mao
722310|Macheiro, a  máquina|Trabalhadores de moldagem de metais e de ligas metálicas|macheiro, a  maquina
722315|Moldador e fundição, a mão|Trabalhadores de moldagem de metais e de ligas metálicas|moldador e fundicao, a mao
722320|Moldador em fundição, a máquina|Trabalhadores de moldagem de metais e de ligas metálicas|moldador em fundicao, a maquina
722325|Operador de equipamentos de preparação de areia|Trabalhadores de moldagem de metais e de ligas metálicas|operador de equipamentos de preparacao de areia
722330|Operador de máquina de moldar automatizada|Trabalhadores de moldagem de metais e de ligas metálicas|operador de maquina de moldar automatizada
722405|Cableador|Trabalhadores de trefilação e estiramento de metais puros e ligas metálicas|cableador
722410|Estirador de tubos de metal sem costura|Trabalhadores de trefilação e estiramento de metais puros e ligas metálicas|estirador de tubos de metal sem costura
722415|Trefilador de metais, à máquina|Trabalhadores de trefilação e estiramento de metais puros e ligas metálicas|trefilador de metais, a maquina
723105|Cementador de metais|Trabalhadores de tratamento térmico de metais|cementador de metais
723110|Normalizador de metais e de compósitos|Trabalhadores de tratamento térmico de metais|normalizador de metais e de compositos
723115|Operador de equipamento para resfriamento|Trabalhadores de tratamento térmico de metais|operador de equipamento para resfriamento
723120|Operador de forno de tratamento térmico de metais|Trabalhadores de tratamento térmico de metais|operador de forno de tratamento termico de metais
723125|Temperador de metais e de compósitos|Trabalhadores de tratamento térmico de metais|temperador de metais e de compositos
723205|Decapador|Trabalhadores de tratamento de superfícies de metais e de compósitos (termoquímicos)|decapador
723210|Fosfatizador|Trabalhadores de tratamento de superfícies de metais e de compósitos (termoquímicos)|fosfatizador
723215|Galvanizador|Trabalhadores de tratamento de superfícies de metais e de compósitos (termoquímicos)|galvanizador
723220|Metalizador, à pistola|Trabalhadores de tratamento de superfícies de metais e de compósitos (termoquímicos)|metalizador, a pistola
723225|Metalizador (banho quente)|Trabalhadores de tratamento de superfícies de metais e de compósitos (termoquímicos)|metalizador (banho quente)
723230|Operador de máquina recobridora de arame|Trabalhadores de tratamento de superfícies de metais e de compósitos (termoquímicos)|operador de maquina recobridora de arame
723235|Operador de zincagem (processo eletrolítico)|Trabalhadores de tratamento de superfícies de metais e de compósitos (termoquímicos)|operador de zincagem (processo eletrolitico)
723240|Oxidador|Trabalhadores de tratamento de superfícies de metais e de compósitos (termoquímicos)|oxidador
723305|Operador de equipamento de secagem de pintura|Trabalhadores da pintura de equipamentos, veículos, estruturas metálicas e de compósitos|operador de equipamento de secagem de pintura
723310|Pintor a pincel e rolo (exceto obras e estruturas metálicas)|Trabalhadores da pintura de equipamentos, veículos, estruturas metálicas e de compósitos|pintor a pincel e rolo (exceto obras e estruturas metalicas)
723315|Pintor de estruturas metálicas|Trabalhadores da pintura de equipamentos, veículos, estruturas metálicas e de compósitos|pintor de estruturas metalicas
723320|Pintor de veículos (fabricação)|Trabalhadores da pintura de equipamentos, veículos, estruturas metálicas e de compósitos|pintor de veiculos (fabricacao)
723325|Pintor por imersão|Trabalhadores da pintura de equipamentos, veículos, estruturas metálicas e de compósitos|pintor por imersao
723330|Pintor, a  pistola (exceto obras e estruturas metálicas)|Trabalhadores da pintura de equipamentos, veículos, estruturas metálicas e de compósitos|pintor, a  pistola (exceto obras e estruturas metalicas)
724105|Assentador de canalização (edificações)|Encanadores e instaladores de tubulações|assentador de canalizacao (edificacoes)
724110|Encanador|Encanadores e instaladores de tubulações|encanador
724115|Instalador de tubulações|Encanadores e instaladores de tubulações|instalador de tubulacoes
724120|Instalador de tubulações (aeronaves)|Encanadores e instaladores de tubulações|instalador de tubulacoes (aeronaves)
724125|Instalador de tubulações (embarcações)|Encanadores e instaladores de tubulações|instalador de tubulacoes (embarcacoes)
724130|Instalador de tubulações de gás combustível (produção e distribuição)|Encanadores e instaladores de tubulações|instalador de tubulacoes de gas combustivel (producao e distribuicao)
724135|Instalador de tubulações de vapor (produção e distribuição)|Encanadores e instaladores de tubulações|instalador de tubulacoes de vapor (producao e distribuicao)
724205|Montador de estruturas metálicas|Trabalhadores de traçagem e montagem de estruturas metálicas e de compósitos|montador de estruturas metalicas
724210|Montador de estruturas metálicas de embarcações|Trabalhadores de traçagem e montagem de estruturas metálicas e de compósitos|montador de estruturas metalicas de embarcacoes
724215|Rebitador a  martelo pneumático|Trabalhadores de traçagem e montagem de estruturas metálicas e de compósitos|rebitador a  martelo pneumatico
724220|Preparador de estruturas metálicas|Trabalhadores de traçagem e montagem de estruturas metálicas e de compósitos|preparador de estruturas metalicas
724225|Riscador de estruturas metálicas|Trabalhadores de traçagem e montagem de estruturas metálicas e de compósitos|riscador de estruturas metalicas
724230|Rebitador, a  mão|Trabalhadores de traçagem e montagem de estruturas metálicas e de compósitos|rebitador, a  mao
724305|Brasador|Trabalhadores de soldagem e corte de ligas metálicas|brasador
724310|Oxicortador a mão e a  máquina|Trabalhadores de soldagem e corte de ligas metálicas|oxicortador a mao e a  maquina
724315|Soldador|Trabalhadores de soldagem e corte de ligas metálicas|soldador
724320|Soldador a  oxigás|Trabalhadores de soldagem e corte de ligas metálicas|soldador a  oxigas
724325|Soldador elétrico|Trabalhadores de soldagem e corte de ligas metálicas|soldador eletrico
724405|Caldeireiro (chapas de cobre)|Trabalhadores de caldeiraria e serralheria|caldeireiro (chapas de cobre)
724410|Caldeireiro (chapas de ferro e aço)|Trabalhadores de caldeiraria e serralheria|caldeireiro (chapas de ferro e aco)
724415|Chapeador|Trabalhadores de caldeiraria e serralheria|chapeador
724420|Chapeador de carrocerias metálicas (fabricação)|Trabalhadores de caldeiraria e serralheria|chapeador de carrocerias metalicas (fabricacao)
724425|Chapeador naval|Trabalhadores de caldeiraria e serralheria|chapeador naval
724430|Chapeador de aeronaves|Trabalhadores de caldeiraria e serralheria|chapeador de aeronaves
724435|Funileiro industrial|Trabalhadores de caldeiraria e serralheria|funileiro industrial
724440|Serralheiro|Trabalhadores de caldeiraria e serralheria|serralheiro
724505|Operador de máquina de cilindrar chapas|Operadores de máquinas de conformação de metais|operador de maquina de cilindrar chapas
724510|Operador de máquina de dobrar chapas|Operadores de máquinas de conformação de metais|operador de maquina de dobrar chapas
724515|Prensista (operador de prensa)|Operadores de máquinas de conformação de metais|prensista (operador de prensa)
724605|Operador de laços de cabos de aço|Trançadores e laceiros de cabos de aço|operador de lacos de cabos de aco
724610|Trançador de cabos de aço|Trançadores e laceiros de cabos de aço|trancador de cabos de aco
725005|Ajustador ferramenteiro|Ajustadores mecânicos polivalentes e afins|ajustador ferramenteiro
725010|Ajustador mecânico|Ajustadores mecânicos polivalentes e afins|ajustador mecanico
725015|Ajustador mecânico (usinagem em bancada e em máquinas-ferramentas)|Ajustadores mecânicos polivalentes e afins|ajustador mecanico (usinagem em bancada e em maquinas-ferramentas)
725020|Ajustador mecânico em bancada|Ajustadores mecânicos polivalentes e afins|ajustador mecanico em bancada
725025|Ajustador naval (reparo e construção)|Ajustadores mecânicos polivalentes e afins|ajustador naval (reparo e construcao)
725030|Operador de manutenção e recarga de extintor de incêndio|Ajustadores mecânicos polivalentes e afins|operador de manutencao e recarga de extintor de incendio
725105|Montador de máquinas, motores e acessórios (montagem em série)|Montadores de máquinas, aparelhos e acessórios em linhas de montagem|montador de maquinas, motores e acessorios (montagem em serie)
725205|Montador de máquinas|Montadores de máquinas industriais|montador de maquinas
725210|Montador de máquinas gráficas|Montadores de máquinas industriais|montador de maquinas graficas
725215|Montador de máquinas operatrizes para madeira|Montadores de máquinas industriais|montador de maquinas operatrizes para madeira
725220|Montador de máquinas têxteis|Montadores de máquinas industriais|montador de maquinas texteis
725225|Montador de máquinas-ferramentas (usinagem de metais)|Montadores de máquinas industriais|montador de maquinas-ferramentas (usinagem de metais)
725305|Montador de equipamento de levantamento|Montadores de máquinas pesadas e equipamentos agrícolas|montador de equipamento de levantamento
725310|Montador de máquinas agrícolas|Montadores de máquinas pesadas e equipamentos agrícolas|montador de maquinas agricolas
725315|Montador de máquinas de minas e pedreiras|Montadores de máquinas pesadas e equipamentos agrícolas|montador de maquinas de minas e pedreiras
725320|Montador de máquinas de terraplenagem|Montadores de máquinas pesadas e equipamentos agrícolas|montador de maquinas de terraplenagem
725405|Mecânico montador de motores de aeronaves|Mecânicos montadores de motores e turboalimentadores|mecanico montador de motores de aeronaves
725410|Mecânico montador de motores de embarcações|Mecânicos montadores de motores e turboalimentadores|mecanico montador de motores de embarcacoes
725415|Mecânico montador de motores de explosão e diesel|Mecânicos montadores de motores e turboalimentadores|mecanico montador de motores de explosao e diesel
725420|Mecânico montador de turboalimentadores|Mecânicos montadores de motores e turboalimentadores|mecanico montador de turboalimentadores
725505|Montador de veículos (linha de montagem)|Montadores de veículos automotores (linha de montagem)|montador de veiculos (linha de montagem)
725510|Operador de time de montagem|Montadores de veículos automotores (linha de montagem)|operador de time de montagem
725605|Montador de estruturas de aeronaves|Montadores de sistemas e estruturas de aeronaves|montador de estruturas de aeronaves
725610|Montador de sistemas de combustível de aeronaves|Montadores de sistemas e estruturas de aeronaves|montador de sistemas de combustivel de aeronaves
725705|Mecânico de refrigeração e climatização|Instaladores de equipamentos de refrigeração e ventilação|mecanico de refrigeracao e climatizacao
730105|Supervisor de montagem e instalação eletroeletrônica|Supervisores de montagens e instalações eletroeletrônicas|supervisor de montagem e instalacao eletroeletronica
731105|Montador de equipamentos eletroeletrônicos odonto-médico-hospitalares|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletroeletronicos odonto-medico-hospitalares
731110|Montador de equipamentos eletrônicos (computadores e equipamentos auxiliares)|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletronicos (computadores e equipamentos auxiliares)
731115|Montador de equipamentos eletroeletrônicos (instrumentos de medição)|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletroeletronicos (instrumentos de medicao)
731120|Montador de equipamentos eletroeletrônicos (aparelhos eletrodomésticos)|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletroeletronicos (aparelhos eletrodomesticos)
731125|Montador de equipamentos elétricos (centrais elétricas)|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletricos (centrais eletricas)
731130|Montador de equipamentos elétricos (motores e dínamos)|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletricos (motores e dinamos)
731135|Montador de equipamentos elétricos|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletricos
731140|Montador de equipamentos eletrônicos (instalações de sinalização)|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletronicos (instalacoes de sinalizacao)
731145|Montador de equipamentos eletroeletrônicos (máquinas industriais)|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletroeletronicos (maquinas industriais)
731150|Montador de equipamentos eletrônicos|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletronicos
731155|Montador de equipamentos elétricos (elevadores e equipamentos similares)|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletricos (elevadores e equipamentos similares)
731160|Montador de equipamentos elétricos (transformadores)|Montadores de equipamentos eletroeletrônicos|montador de equipamentos eletricos (transformadores)
731165|Bobinador eletricista, à mão|Montadores de equipamentos eletroeletrônicos|bobinador eletricista, a mao
731170|Bobinador eletricista, à máquina|Montadores de equipamentos eletroeletrônicos|bobinador eletricista, a maquina
731175|Operador de linha de montagem (aparelhos elétricos)|Montadores de equipamentos eletroeletrônicos|operador de linha de montagem (aparelhos eletricos)
731180|Operador de linha de montagem (aparelhos eletrônicos)|Montadores de equipamentos eletroeletrônicos|operador de linha de montagem (aparelhos eletronicos)
731205|Montador de equipamentos eletrônicos (estação de rádio, tv e equipamentos de radar)|Montadores de aparelhos de telecomunicações|montador de equipamentos eletronicos (estacao de radio, tv e equipamentos de radar)
731305|Instalador-reparador de equipamentos de comutação em telefonia|Instaladores-reparadores de  linhas e equipamentos de telecomunicações|instalador-reparador de equipamentos de comutacao em telefonia
731310|Instalador-reparador de equipamentos de energia em telefonia|Instaladores-reparadores de  linhas e equipamentos de telecomunicações|instalador-reparador de equipamentos de energia em telefonia
731315|Instalador-reparador de equipamentos de transmissão em telefonia|Instaladores-reparadores de  linhas e equipamentos de telecomunicações|instalador-reparador de equipamentos de transmissao em telefonia
731320|Instalador-reparador de linhas e aparelhos de telecomunicações|Instaladores-reparadores de  linhas e equipamentos de telecomunicações|instalador-reparador de linhas e aparelhos de telecomunicacoes
731325|Instalador-reparador de redes e cabos telefônicos|Instaladores-reparadores de  linhas e equipamentos de telecomunicações|instalador-reparador de redes e cabos telefonicos
731330|Reparador de aparelhos de telecomunicações em laboratório|Instaladores-reparadores de  linhas e equipamentos de telecomunicações|reparador de aparelhos de telecomunicacoes em laboratorio
732105|Eletricista de manutenção de linhas elétricas, telefônicas e de comunicação de dados|Instaladores e reparadores de linhas e cabos elétricos, telefônicos e de comunicação de dados|eletricista de manutencao de linhas eletricas, telefonicas e de comunicacao de dados
732110|Emendador de cabos elétricos e telefônicos (aéreos e subterrâneos)|Instaladores e reparadores de linhas e cabos elétricos, telefônicos e de comunicação de dados|emendador de cabos eletricos e telefonicos (aereos e subterraneos)
732115|Examinador de cabos, linhas elétricas e telefônicas|Instaladores e reparadores de linhas e cabos elétricos, telefônicos e de comunicação de dados|examinador de cabos, linhas eletricas e telefonicas
732120|Instalador de linhas elétricas de alta e baixa tensão (rede aérea e subterrânea)|Instaladores e reparadores de linhas e cabos elétricos, telefônicos e de comunicação de dados|instalador de linhas eletricas de alta e baixa tensao (rede aerea e subterranea)
732125|Instalador eletricista (tração de veículos)|Instaladores e reparadores de linhas e cabos elétricos, telefônicos e de comunicação de dados|instalador eletricista (tracao de veiculos)
732130|Instalador-reparador de redes telefônicas e de comunicação de dados|Instaladores e reparadores de linhas e cabos elétricos, telefônicos e de comunicação de dados|instalador-reparador de redes telefonicas e de comunicacao de dados
732135|Ligador de linhas de comunicação de voz e dados|Instaladores e reparadores de linhas e cabos elétricos, telefônicos e de comunicação de dados|ligador de linhas de comunicacao de voz e dados
732140|Instalador de sistemas fotovoltaicos|Instaladores e reparadores de linhas e cabos elétricos, telefônicos e de comunicação de dados|instalador de sistemas fotovoltaicos
740105|Supervisor da mecânica de precisão|Supervisores da mecânica de precisão e instrumentos musicais|supervisor da mecanica de precisao
740110|Supervisor de fabricação de instrumentos musicais|Supervisores da mecânica de precisão e instrumentos musicais|supervisor de fabricacao de instrumentos musicais
741105|Ajustador de instrumentos de precisão|Mecânicos de instrumentos de precisão|ajustador de instrumentos de precisao
741110|Montador de instrumentos de óptica|Mecânicos de instrumentos de precisão|montador de instrumentos de optica
741115|Montador de instrumentos de precisão|Mecânicos de instrumentos de precisão|montador de instrumentos de precisao
741120|Relojoeiro (fabricação)|Mecânicos de instrumentos de precisão|relojoeiro (fabricacao)
741125|Relojoeiro (reparação)|Mecânicos de instrumentos de precisão|relojoeiro (reparacao)
742105|Afinador de instrumentos musicais|Confeccionadores de instrumentos musicais|afinador de instrumentos musicais
742110|Confeccionador de acordeão|Confeccionadores de instrumentos musicais|confeccionador de acordeao
742115|Confeccionador de instrumentos de corda|Confeccionadores de instrumentos musicais|confeccionador de instrumentos de corda
742120|Confeccionador de instrumentos de percussão (pele, couro ou plástico)|Confeccionadores de instrumentos musicais|confeccionador de instrumentos de percussao (pele, couro ou plastico)
742125|Confeccionador de instrumentos de sopro (madeira)|Confeccionadores de instrumentos musicais|confeccionador de instrumentos de sopro (madeira)
742130|Confeccionador de instrumentos de sopro (metal)|Confeccionadores de instrumentos musicais|confeccionador de instrumentos de sopro (metal)
742135|Confeccionador de órgão|Confeccionadores de instrumentos musicais|confeccionador de orgao
742140|Confeccionador de piano acústico|Confeccionadores de instrumentos musicais|confeccionador de piano acustico
750105|Supervisor de joalheria|Supervisores de joalheria e afins|supervisor de joalheria
750205|Supervisor da indústria de minerais não metálicos (exceto os derivados de petróleo e carvão)|Supervisores de vidraria, cerâmica e afins|supervisor da industria de minerais nao metalicos (exceto os derivados de petroleo e carvao)
751005|Engastador (jóias)|Joalheiros e lapidadores de gemas|engastador (joias)
751010|Joalheiro|Joalheiros e lapidadores de gemas|joalheiro
751015|Joalheiro (reparações)|Joalheiros e lapidadores de gemas|joalheiro (reparacoes)
751020|Lapidador (joias)|Joalheiros e lapidadores de gemas|lapidador (joias)
751105|Bate-folha a  máquina|Artesãos de metais preciosos e semipreciosos|bate-folha a  maquina
751110|Fundidor (joalheria e ourivesaria)|Artesãos de metais preciosos e semipreciosos|fundidor (joalheria e ourivesaria)
751115|Gravador (joalheria e ourivesaria)|Artesãos de metais preciosos e semipreciosos|gravador (joalheria e ourivesaria)
751120|Laminador de metais preciosos à máquina|Artesãos de metais preciosos e semipreciosos|laminador de metais preciosos a maquina
751125|Ourives|Artesãos de metais preciosos e semipreciosos|ourives
751130|Trefilador (joalheria e ourivesaria)|Artesãos de metais preciosos e semipreciosos|trefilador (joalheria e ourivesaria)
752105|Artesão modelador (vidros)|Sopradores, moldadores e modeladores de vidros e afins|artesao modelador (vidros)
752110|Moldador (vidros)|Sopradores, moldadores e modeladores de vidros e afins|moldador (vidros)
752115|Soprador de vidro|Sopradores, moldadores e modeladores de vidros e afins|soprador de vidro
752120|Transformador de tubos de vidro|Sopradores, moldadores e modeladores de vidros e afins|transformador de tubos de vidro
752205|Aplicador serigráfico em vidros|Trabalhadores da transformação de vidros planos|aplicador serigrafico em vidros
752210|Cortador de vidro|Trabalhadores da transformação de vidros planos|cortador de vidro
752215|Gravador de vidro a  água-forte|Trabalhadores da transformação de vidros planos|gravador de vidro a  agua-forte
752220|Gravador de vidro a  esmeril|Trabalhadores da transformação de vidros planos|gravador de vidro a  esmeril
752225|Gravador de vidro a  jato de areia|Trabalhadores da transformação de vidros planos|gravador de vidro a  jato de areia
752230|Lapidador de vidros e cristais|Trabalhadores da transformação de vidros planos|lapidador de vidros e cristais
752235|Surfassagista|Trabalhadores da transformação de vidros planos|surfassagista
752305|Ceramista|Ceramistas (preparação e fabricação)|ceramista
752310|Ceramista (torno de pedal e motor)|Ceramistas (preparação e fabricação)|ceramista (torno de pedal e motor)
752315|Ceramista (torno semiautomático)|Ceramistas (preparação e fabricação)|ceramista (torno semiautomatico)
752320|Ceramista modelador|Ceramistas (preparação e fabricação)|ceramista modelador
752325|Ceramista moldador|Ceramistas (preparação e fabricação)|ceramista moldador
752330|Ceramista prensador|Ceramistas (preparação e fabricação)|ceramista prensador
752405|Decorador de cerâmica|Vidreiros e ceramistas (arte e decoração)|decorador de ceramica
752410|Decorador de vidro|Vidreiros e ceramistas (arte e decoração)|decorador de vidro
752415|Decorador de vidro, a pincel|Vidreiros e ceramistas (arte e decoração)|decorador de vidro, a pincel
752420|Operador de esmaltadeira|Vidreiros e ceramistas (arte e decoração)|operador de esmaltadeira
752425|Operador de espelhamento|Vidreiros e ceramistas (arte e decoração)|operador de espelhamento
752430|Pintor de cerâmica, a  pincel|Vidreiros e ceramistas (arte e decoração)|pintor de ceramica, a  pincel
760105|Contramestre de acabamento (indústria têxtil)|Supervisores da indústria têxtil|contramestre de acabamento (industria textil)
760110|Contramestre de fiação (indústria têxtil)|Supervisores da indústria têxtil|contramestre de fiacao (industria textil)
760115|Contramestre de malharia (indústria têxtil)|Supervisores da indústria têxtil|contramestre de malharia (industria textil)
760120|Contramestre de tecelagem (indústria têxtil)|Supervisores da indústria têxtil|contramestre de tecelagem (industria textil)
760125|Mestre (indústria têxtil e de confecções)|Supervisores da indústria têxtil|mestre (industria textil e de confeccoes)
760205|Supervisor de curtimento|Supervisores na indústria do curtimento|supervisor de curtimento
760305|Encarregado de corte na confecção do vestuário|Supervisores na confecção do vestuário|encarregado de corte na confeccao do vestuario
760310|Encarregado de costura na confecção do vestuário|Supervisores na confecção do vestuário|encarregado de costura na confeccao do vestuario
760405|Supervisor  (indústria de calçados e artefatos de couro)|Supervisores na confecção de calçados|supervisor  (industria de calcados e artefatos de couro)
760505|Supervisor da confecção de artefatos de tecidos, couros e afins|Supervisores da confecção de artefatos de tecidos, couros e afins|supervisor da confeccao de artefatos de tecidos, couros e afins
760605|Supervisor das artes gráficas (indústria editorial e gráfica)|Supervisores das artes gráficas|supervisor das artes graficas (industria editorial e grafica)
761005|Operador polivalente da indústria têxtil|Trabalhadores polivalentes das indústrias têxteis|operador polivalente da industria textil
761105|Classificador de fibras têxteis|Trabalhadores da classificação de fibras têxteis e lavagem de lã|classificador de fibras texteis
761110|Lavador de lã|Trabalhadores da classificação de fibras têxteis e lavagem de lã|lavador de la
761205|Operador de abertura (fiação)|Operadores da fiação|operador de abertura (fiacao)
761210|Operador de binadeira|Operadores da fiação|operador de binadeira
761215|Operador de bobinadeira|Operadores da fiação|operador de bobinadeira
761220|Operador de cardas|Operadores da fiação|operador de cardas
761225|Operador de conicaleira|Operadores da fiação|operador de conicaleira
761230|Operador de filatório|Operadores da fiação|operador de filatorio
761235|Operador de laminadeira e reunideira|Operadores da fiação|operador de laminadeira e reunideira
761240|Operador de maçaroqueira|Operadores da fiação|operador de macaroqueira
761245|Operador de open-end|Operadores da fiação|operador de open-end
761250|Operador de passador (fiação)|Operadores da fiação|operador de passador (fiacao)
761255|Operador de penteadeira|Operadores da fiação|operador de penteadeira
761260|Operador de retorcedeira|Operadores da fiação|operador de retorcedeira
761303|Tecelão (redes)|Operadores de tear e máquinas similares|tecelao (redes)
761306|Tecelão (rendas e bordados)|Operadores de tear e máquinas similares|tecelao (rendas e bordados)
761309|Tecelão (tear automático)|Operadores de tear e máquinas similares|tecelao (tear automatico)
761312|Tecelão (tear jacquard)|Operadores de tear e máquinas similares|tecelao (tear jacquard)
761315|Tecelão (tear mecânico de maquineta)|Operadores de tear e máquinas similares|tecelao (tear mecanico de maquineta)
761318|Tecelão (tear mecânico de xadrez)|Operadores de tear e máquinas similares|tecelao (tear mecanico de xadrez)
761321|Tecelão (tear mecânico liso)|Operadores de tear e máquinas similares|tecelao (tear mecanico liso)
761324|Tecelão (tear mecânico, exceto jacquard)|Operadores de tear e máquinas similares|tecelao (tear mecanico, exceto jacquard)
761327|Tecelão de malhas, a  máquina|Operadores de tear e máquinas similares|tecelao de malhas, a  maquina
761330|Tecelão de malhas (máquina circular)|Operadores de tear e máquinas similares|tecelao de malhas (maquina circular)
761333|Tecelão de malhas (máquina retilínea)|Operadores de tear e máquinas similares|tecelao de malhas (maquina retilinea)
761336|Tecelão de meias, a  máquina|Operadores de tear e máquinas similares|tecelao de meias, a  maquina
761339|Tecelão de meias (máquina circular)|Operadores de tear e máquinas similares|tecelao de meias (maquina circular)
761342|Tecelão de meias (máquina retilínea)|Operadores de tear e máquinas similares|tecelao de meias (maquina retilinea)
761345|Tecelão de tapetes, a  máquina|Operadores de tear e máquinas similares|tecelao de tapetes, a  maquina
761348|Operador de engomadeira de urdume|Operadores de tear e máquinas similares|operador de engomadeira de urdume
761351|Operador de espuladeira|Operadores de tear e máquinas similares|operador de espuladeira
761354|Operador de máquina de cordoalha|Operadores de tear e máquinas similares|operador de maquina de cordoalha
761357|Operador de urdideira|Operadores de tear e máquinas similares|operador de urdideira
761360|Passamaneiro a  máquina|Operadores de tear e máquinas similares|passamaneiro a  maquina
761363|Remetedor de fios|Operadores de tear e máquinas similares|remetedor de fios
761366|Picotador de cartões jacquard|Operadores de tear e máquinas similares|picotador de cartoes jacquard
761405|Alvejador (tecidos)|Trabalhadores de acabamento, tingimento e estamparia das indústrias têxteis|alvejador (tecidos)
761410|Estampador de tecido|Trabalhadores de acabamento, tingimento e estamparia das indústrias têxteis|estampador de tecido
761415|Operador de calandras (tecidos)|Trabalhadores de acabamento, tingimento e estamparia das indústrias têxteis|operador de calandras (tecidos)
761420|Operador de chamuscadeira de tecidos|Trabalhadores de acabamento, tingimento e estamparia das indústrias têxteis|operador de chamuscadeira de tecidos
761425|Operador de impermeabilizador de tecidos|Trabalhadores de acabamento, tingimento e estamparia das indústrias têxteis|operador de impermeabilizador de tecidos
761430|Operador de máquina de lavar fios e tecidos|Trabalhadores de acabamento, tingimento e estamparia das indústrias têxteis|operador de maquina de lavar fios e tecidos
761435|Operador de rameuse|Trabalhadores de acabamento, tingimento e estamparia das indústrias têxteis|operador de rameuse
761805|Inspetor de estamparia (produção têxtil)|Inspetores e revisores de produção têxtil|inspetor de estamparia (producao textil)
761810|Revisor de fios (produção têxtil)|Inspetores e revisores de produção têxtil|revisor de fios (producao textil)
761815|Revisor de tecidos acabados|Inspetores e revisores de produção têxtil|revisor de tecidos acabados
761820|Revisor de tecidos crus|Inspetores e revisores de produção têxtil|revisor de tecidos crus
762005|Trabalhador polivalente do curtimento de couros e peles|Trabalhadores polivalentes do curtimento de couros e peles|trabalhador polivalente do curtimento de couros e peles
762105|Classificador de peles|Trabalhadores da preparação do curtimento de couros e peles|classificador de peles
762110|Descarnador de couros|Trabalhadores da preparação do curtimento de couros e peles|descarnador de couros
762115|Estirador de couros e peles (preparação)|Trabalhadores da preparação do curtimento de couros e peles|estirador de couros e peles (preparacao)
762120|Fuloneiro|Trabalhadores da preparação do curtimento de couros e peles|fuloneiro
762125|Rachador de couros|Trabalhadores da preparação do curtimento de couros e peles|rachador de couros
762205|Curtidor (couros e peles)|Trabalhadores do curtimento de couros e peles|curtidor (couros e peles)
762210|Classificador de couros|Trabalhadores do curtimento de couros e peles|classificador de couros
762215|Enxugador de couros|Trabalhadores do curtimento de couros e peles|enxugador de couros
762220|Rebaixador de couros|Trabalhadores do curtimento de couros e peles|rebaixador de couros
762305|Estirador de couros e peles (acabamento)|Trabalhadores do acabamento de couros e peles|estirador de couros e peles (acabamento)
762310|Fuloneiro no acabamento de couros e peles|Trabalhadores do acabamento de couros e peles|fuloneiro no acabamento de couros e peles
762315|Lixador de couros e peles|Trabalhadores do acabamento de couros e peles|lixador de couros e peles
762320|Matizador de couros e peles|Trabalhadores do acabamento de couros e peles|matizador de couros e peles
762325|Operador de máquinas do acabamento de couros e peles|Trabalhadores do acabamento de couros e peles|operador de maquinas do acabamento de couros e peles
762330|Prensador de couros e peles|Trabalhadores do acabamento de couros e peles|prensador de couros e peles
762335|Palecionador de couros e peles|Trabalhadores do acabamento de couros e peles|palecionador de couros e peles
762340|Preparador de couros curtidos|Trabalhadores do acabamento de couros e peles|preparador de couros curtidos
762345|Vaqueador de couros e peles|Trabalhadores do acabamento de couros e peles|vaqueador de couros e peles
763005|Alfaiate|Profissionais polivalentes da confecção de roupas|alfaiate
763010|Costureira de peças sob encomenda|Profissionais polivalentes da confecção de roupas|costureira de pecas sob encomenda
763015|Costureira de reparação de roupas|Profissionais polivalentes da confecção de roupas|costureira de reparacao de roupas
763020|Costureiro de roupa de couro e pele|Profissionais polivalentes da confecção de roupas|costureiro de roupa de couro e pele
763105|Auxiliar de corte (preparação da confecção de roupas)|Trabalhadores da preparação da confecção de roupas|auxiliar de corte (preparacao da confeccao de roupas)
763110|Cortador de roupas|Trabalhadores da preparação da confecção de roupas|cortador de roupas
763115|Enfestador de roupas|Trabalhadores da preparação da confecção de roupas|enfestador de roupas
763120|Riscador de roupas|Trabalhadores da preparação da confecção de roupas|riscador de roupas
763125|Ajudante de confecção|Trabalhadores da preparação da confecção de roupas|ajudante de confeccao
763205|Costureiro de roupas de couro e pele, a  máquina na  confecção em série|Operadores de máquinas para costura de peças do vestuário|costureiro de roupas de couro e pele, a  maquina na  confeccao em serie
763210|Costureiro na confecção em série|Operadores de máquinas para costura de peças do vestuário|costureiro na confeccao em serie
763215|Costureiro, a  máquina  na confecção em série|Operadores de máquinas para costura de peças do vestuário|costureiro, a  maquina  na confeccao em serie
763305|Arrematadeira|Operadores de máquinas para bordado e acabamento de roupas|arrematadeira
763310|Bordador, à máquina|Operadores de máquinas para bordado e acabamento de roupas|bordador, a maquina
763315|Marcador de peças confeccionadas para bordar|Operadores de máquinas para bordado e acabamento de roupas|marcador de pecas confeccionadas para bordar
763320|Operador de máquina de costura para acabamento|Operadores de máquinas para bordado e acabamento de roupas|operador de maquina de costura para acabamento
763325|Passadeira de peças confeccionadas|Operadores de máquinas para bordado e acabamento de roupas|passadeira de pecas confeccionadas
764005|Trabalhador polivalente da confecção de calçados|Trabalhadores polivalentes da confecção de calçados|trabalhador polivalente da confeccao de calcados
764105|Cortador de calçados, a  máquina (exceto solas e palmilhas)|Trabalhadores da preparação da confecção de calçados|cortador de calcados, a  maquina (exceto solas e palmilhas)
764110|Cortador de solas e palmilhas, a  máquina|Trabalhadores da preparação da confecção de calçados|cortador de solas e palmilhas, a  maquina
764115|Preparador de calçados|Trabalhadores da preparação da confecção de calçados|preparador de calcados
764120|Preparador de solas e palmilhas|Trabalhadores da preparação da confecção de calçados|preparador de solas e palmilhas
764205|Costurador de calçados, a  máquina|Operadores de máquinas de costurar e montar calçados|costurador de calcados, a  maquina
764210|Montador de calçados|Operadores de máquinas de costurar e montar calçados|montador de calcados
764305|Acabador de calçados|Trabalhadores de acabamento de calçados|acabador de calcados
765005|Confeccionador de artefatos de couro (exceto sapatos)|Trabalhadores polivalentes da confecção de artefatos de tecidos e couros|confeccionador de artefatos de couro (exceto sapatos)
765010|Chapeleiro de senhoras|Trabalhadores polivalentes da confecção de artefatos de tecidos e couros|chapeleiro de senhoras
765015|Boneleiro|Trabalhadores polivalentes da confecção de artefatos de tecidos e couros|boneleiro
765105|Cortador de artefatos de couro (exceto roupas e calçados)|Trabalhadores da preparação de artefatos de tecidos, couros e tapeçaria|cortador de artefatos de couro (exceto roupas e calcados)
765110|Cortador de tapeçaria|Trabalhadores da preparação de artefatos de tecidos, couros e tapeçaria|cortador de tapecaria
765205|Colchoeiro (confecção de colchões)|Trabalhadores da confecção de artefatos de tecidos, couros e sintéticos|colchoeiro (confeccao de colchoes)
765215|Confeccionador de brinquedos de pano|Trabalhadores da confecção de artefatos de tecidos, couros e sintéticos|confeccionador de brinquedos de pano
765225|Confeccionador de velas náuticas, barracas e toldos|Trabalhadores da confecção de artefatos de tecidos, couros e sintéticos|confeccionador de velas nauticas, barracas e toldos
765230|Estofador de aviões|Trabalhadores da confecção de artefatos de tecidos, couros e sintéticos|estofador de avioes
765235|Estofador de móveis|Trabalhadores da confecção de artefatos de tecidos, couros e sintéticos|estofador de moveis
765240|Tapeceiro de autos|Trabalhadores da confecção de artefatos de tecidos, couros e sintéticos|tapeceiro de autos
765310|Costurador de artefatos de couro, à máquina (exceto roupas e calçados)|Operadores de máquinas na confecção de artefatos de  couro|costurador de artefatos de couro, a maquina (exceto roupas e calcados)
765315|Montador de artefatos de couro (exceto roupas e calçados)|Operadores de máquinas na confecção de artefatos de  couro|montador de artefatos de couro (exceto roupas e calcados)
765405|Trabalhador do acabamento de artefatos de tecidos e couros|Trabalhadores do acabamento de artefatos de tecidos e couros|trabalhador do acabamento de artefatos de tecidos e couros
766105|Copiador de chapa|Trabalhadores da pré-impressão gráfica|copiador de chapa
766115|Gravador de matriz para flexografia (clicherista)|Trabalhadores da pré-impressão gráfica|gravador de matriz para flexografia (clicherista)
766120|Editor de texto e imagem|Trabalhadores da pré-impressão gráfica|editor de texto e imagem
766125|Montador de fotolito (analógico e digital)|Trabalhadores da pré-impressão gráfica|montador de fotolito (analogico e digital)
766130|Gravador de matriz para rotogravura (eletromecânico e químico)|Trabalhadores da pré-impressão gráfica|gravador de matriz para rotogravura (eletromecanico e quimico)
766135|Gravador de matriz calcográfica|Trabalhadores da pré-impressão gráfica|gravador de matriz calcografica
766140|Gravador de matriz serigráfica|Trabalhadores da pré-impressão gráfica|gravador de matriz serigrafica
766145|Operador de sistemas de prova (analógico e digital)|Trabalhadores da pré-impressão gráfica|operador de sistemas de prova (analogico e digital)
766150|Operador de processo de tratamento de imagem|Trabalhadores da pré-impressão gráfica|operador de processo de tratamento de imagem
766155|Programador visual gráfico|Trabalhadores da pré-impressão gráfica|programador visual grafico
766205|Impressor (serigrafia)|Trabalhadores da impressão gráfica|impressor (serigrafia)
766210|Impressor calcográfico|Trabalhadores da impressão gráfica|impressor calcografico
766215|Impressor de ofsete (plano e rotativo)|Trabalhadores da impressão gráfica|impressor de ofsete (plano e rotativo)
766220|Impressor de rotativa|Trabalhadores da impressão gráfica|impressor de rotativa
766225|Impressor de rotogravura|Trabalhadores da impressão gráfica|impressor de rotogravura
766230|Impressor digital|Trabalhadores da impressão gráfica|impressor digital
766235|Impressor flexográfico|Trabalhadores da impressão gráfica|impressor flexografico
766240|Impressor letterset|Trabalhadores da impressão gráfica|impressor letterset
766245|Impressor tampográfico|Trabalhadores da impressão gráfica|impressor tampografico
766250|Impressor tipográfico|Trabalhadores da impressão gráfica|impressor tipografico
766305|Acabador de embalagens (flexíveis e cartotécnicas)|Trabalhadores do acabamento gráfico|acabador de embalagens (flexiveis e cartotecnicas)
766310|Impressor de corte e vinco|Trabalhadores do acabamento gráfico|impressor de corte e vinco
766315|Operador de acabamento (indústria gráfica)|Trabalhadores do acabamento gráfico|operador de acabamento (industria grafica)
766320|Operador de guilhotina (corte de papel)|Trabalhadores do acabamento gráfico|operador de guilhotina (corte de papel)
766325|Preparador de matrizes de corte e vinco|Trabalhadores do acabamento gráfico|preparador de matrizes de corte e vinco
766405|Laboratorista fotográfico|Trabalhadores de laboratório fotográfico e radiológico|laboratorista fotografico
766410|Revelador de filmes fotográficos, em preto e branco|Trabalhadores de laboratório fotográfico e radiológico|revelador de filmes fotograficos, em preto e branco
766415|Revelador de filmes fotográficos, em cores|Trabalhadores de laboratório fotográfico e radiológico|revelador de filmes fotograficos, em cores
766420|Auxiliar de radiologia (revelação fotográfica)|Trabalhadores de laboratório fotográfico e radiológico|auxiliar de radiologia (revelacao fotografica)
768105|Tecelão (tear manual)|Trabalhadores de tecelagem manual, tricô, crochê, rendas e afins|tecelao (tear manual)
768110|Tecelão de tapetes, à mão|Trabalhadores de tecelagem manual, tricô, crochê, rendas e afins|tecelao de tapetes, a mao
768115|Tricoteiro, à mão|Trabalhadores de tecelagem manual, tricô, crochê, rendas e afins|tricoteiro, a mao
768120|Redeiro|Trabalhadores de tecelagem manual, tricô, crochê, rendas e afins|redeiro
768125|Chapeleiro (chapéus de palha)|Trabalhadores de tecelagem manual, tricô, crochê, rendas e afins|chapeleiro (chapeus de palha)
768130|Crocheteiro, a  mão|Trabalhadores de tecelagem manual, tricô, crochê, rendas e afins|crocheteiro, a  mao
768205|Bordador, à mão|Trabalhadores artesanais da confecção de peças e tecidos|bordador, a mao
768210|Cerzidor|Trabalhadores artesanais da confecção de peças e tecidos|cerzidor
768305|Artífice do couro|Trabalhadores artesanais da confecção de calçados e artefatos de couros e peles|artifice do couro
768310|Cortador de calçados, à mão (exceto solas)|Trabalhadores artesanais da confecção de calçados e artefatos de couros e peles|cortador de calcados, a mao (exceto solas)
768315|Costurador de artefatos de couro, à mão (exceto roupas e calçados)|Trabalhadores artesanais da confecção de calçados e artefatos de couros e peles|costurador de artefatos de couro, a mao (exceto roupas e calcados)
768320|Sapateiro (calçados sob medida)|Trabalhadores artesanais da confecção de calçados e artefatos de couros e peles|sapateiro (calcados sob medida)
768325|Seleiro|Trabalhadores artesanais da confecção de calçados e artefatos de couros e peles|seleiro
768605|Tipógrafo|Trabalhadores tipográficos linotipistas e afins|tipografo
768610|Linotipista|Trabalhadores tipográficos linotipistas e afins|linotipista
768615|Monotipista|Trabalhadores tipográficos linotipistas e afins|monotipista
768620|Paginador|Trabalhadores tipográficos linotipistas e afins|paginador
768625|Pintor de letreiros|Trabalhadores tipográficos linotipistas e afins|pintor de letreiros
768630|Confeccionador de carimbos de borracha|Trabalhadores tipográficos linotipistas e afins|confeccionador de carimbos de borracha
768705|Encadernador e gravador de capas e lombadas|Encadernadores e recuperadores de livros (pequenos lotes ou a unidade)|encadernador e gravador de capas e lombadas
768710|Restaurador de livros|Encadernadores e recuperadores de livros (pequenos lotes ou a unidade)|restaurador de livros
770105|Encarregado de produção (indústria de madeira e mobiliário)|Supervisores em indústria de madeira, mobiliário e da carpintaria veicular|encarregado de producao (industria de madeira e mobiliario)
770110|Encarregado de carpintaria|Supervisores em indústria de madeira, mobiliário e da carpintaria veicular|encarregado de carpintaria
771105|Marceneiro|Marceneiros e afins|marceneiro
771110|Modelador de madeira|Marceneiros e afins|modelador de madeira
771115|Maquetista na marcenaria|Marceneiros e afins|maquetista na marcenaria
771120|Tanoeiro|Marceneiros e afins|tanoeiro
772105|Classificador de madeira|Trabalhadores de tratamento e preparação da madeira|classificador de madeira
772110|Impregnador de madeira|Trabalhadores de tratamento e preparação da madeira|impregnador de madeira
772115|Operador de secagem de madeira|Trabalhadores de tratamento e preparação da madeira|operador de secagem de madeira
773105|Cortador de laminados de madeira|Operadores de máquinas de desdobramento da madeira|cortador de laminados de madeira
773110|Operador de serras no desdobramento de madeira|Operadores de máquinas de desdobramento da madeira|operador de serras no desdobramento de madeira
773115|Serrador de bordas no desdobramento de madeira|Operadores de máquinas de desdobramento da madeira|serrador de bordas no desdobramento de madeira
773120|Serrador de madeira|Operadores de máquinas de desdobramento da madeira|serrador de madeira
773125|Serrador de madeira (serra circular múltipla)|Operadores de máquinas de desdobramento da madeira|serrador de madeira (serra circular multipla)
773130|Serrador de madeira (serra de fita múltipla)|Operadores de máquinas de desdobramento da madeira|serrador de madeira (serra de fita multipla)
773205|Operador de máquina intercaladora de placas (compensados)|Operadores de máquinas de aglomeração e prensagem de chapas|operador de maquina intercaladora de placas (compensados)
773210|Prensista de aglomerados|Operadores de máquinas de aglomeração e prensagem de chapas|prensista de aglomerados
773215|Prensista de compensados|Operadores de máquinas de aglomeração e prensagem de chapas|prensista de compensados
773220|Preparador de aglomerantes|Operadores de máquinas de aglomeração e prensagem de chapas|preparador de aglomerantes
773305|Operador de desempenadeira na usinagem convencional de madeira|Operadores de usinagem convencional de madeira|operador de desempenadeira na usinagem convencional de madeira
773310|Operador de entalhadeira (usinagem de madeira)|Operadores de usinagem convencional de madeira|operador de entalhadeira (usinagem de madeira)
773315|Operador de fresadora (usinagem de madeira)|Operadores de usinagem convencional de madeira|operador de fresadora (usinagem de madeira)
773320|Operador de lixadeira (usinagem de madeira)|Operadores de usinagem convencional de madeira|operador de lixadeira (usinagem de madeira)
773325|Operador de máquina de usinagem madeira, em geral|Operadores de usinagem convencional de madeira|operador de maquina de usinagem madeira, em geral
773330|Operador de molduradora (usinagem de madeira)|Operadores de usinagem convencional de madeira|operador de molduradora (usinagem de madeira)
773335|Operador de plaina desengrossadeira|Operadores de usinagem convencional de madeira|operador de plaina desengrossadeira
773340|Operador de serras (usinagem de madeira)|Operadores de usinagem convencional de madeira|operador de serras (usinagem de madeira)
773345|Operador de torno automático (usinagem de madeira)|Operadores de usinagem convencional de madeira|operador de torno automatico (usinagem de madeira)
773350|Operador de tupia (usinagem de madeira)|Operadores de usinagem convencional de madeira|operador de tupia (usinagem de madeira)
773355|Torneiro na usinagem convencional de madeira|Operadores de usinagem convencional de madeira|torneiro na usinagem convencional de madeira
773405|Operador de máquina bordatriz|Operadores de máquina de usinar madeira (produção em série)|operador de maquina bordatriz
773410|Operador de máquina de cortina d´água (produção de móveis)|Operadores de máquina de usinar madeira (produção em série)|operador de maquina de cortina d´agua (producao de moveis)
773415|Operador de máquina de usinagem de madeira (produção em série)|Operadores de máquina de usinar madeira (produção em série)|operador de maquina de usinagem de madeira (producao em serie)
773420|Operador de prensa de alta frequência na produção de painéis de madeira|Operadores de máquina de usinar madeira (produção em série)|operador de prensa de alta frequencia na producao de paineis de madeira
773505|Operador de centro de usinagem de madeira (cnc)|Operadores de máquinas de usinagem de madeira cnc|operador de centro de usinagem de madeira (cnc)
773510|Operador de máquinas de usinar madeira (cnc)|Operadores de máquinas de usinagem de madeira cnc|operador de maquinas de usinar madeira (cnc)
774105|Montador de móveis e artefatos de madeira|Montadores de móveis e artefatos de madeira|montador de moveis e artefatos de madeira
775105|Entalhador  de madeira|Trabalhadores de arte e  do acabamento em madeira do mobiliário|entalhador  de madeira
775110|Folheador de móveis de madeira|Trabalhadores de arte e  do acabamento em madeira do mobiliário|folheador de moveis de madeira
775115|Lustrador de peças de madeira|Trabalhadores de arte e  do acabamento em madeira do mobiliário|lustrador de pecas de madeira
775120|Marcheteiro|Trabalhadores de arte e  do acabamento em madeira do mobiliário|marcheteiro
776405|Cesteiro|Confeccionadores de artefatos de madeira, móveis de vime e afins|cesteiro
776410|Confeccionador de escovas, pincéis e produtos similares (à mão)|Confeccionadores de artefatos de madeira, móveis de vime e afins|confeccionador de escovas, pinceis e produtos similares (a mao)
776415|Confeccionador de escovas, pincéis e produtos similares (à máquina)|Confeccionadores de artefatos de madeira, móveis de vime e afins|confeccionador de escovas, pinceis e produtos similares (a maquina)
776420|Confeccionador de móveis de vime, junco e bambu|Confeccionadores de artefatos de madeira, móveis de vime e afins|confeccionador de moveis de vime, junco e bambu
776425|Esteireiro|Confeccionadores de artefatos de madeira, móveis de vime e afins|esteireiro
776430|Vassoureiro|Confeccionadores de artefatos de madeira, móveis de vime e afins|vassoureiro
777105|Carpinteiro naval (construção de pequenas embarcações)|Carpinteiros navais|carpinteiro naval (construcao de pequenas embarcacoes)
777110|Carpinteiro naval (embarcações)|Carpinteiros navais|carpinteiro naval (embarcacoes)
777115|Carpinteiro naval (estaleiros)|Carpinteiros navais|carpinteiro naval (estaleiros)
777205|Carpinteiro de carretas|Carpinteiros de carrocerias e carretas|carpinteiro de carretas
777210|Carpinteiro de carrocerias|Carpinteiros de carrocerias e carretas|carpinteiro de carrocerias
780105|Supervisor de embalagem e etiquetagem|Supervisores de trabalhadores de embalagem e etiquetagem|supervisor de embalagem e etiquetagem
781105|Condutor de processos robotizados de pintura|Condutores de processos robotizados|condutor de processos robotizados de pintura
781110|Condutor de processos robotizados de soldagem|Condutores de processos robotizados|condutor de processos robotizados de soldagem
781305|Operador de veículos subaquáticos controlados remotamente|Operadores de equipamentos pilotados remotamente|operador de veiculos subaquaticos controlados remotamente
781310|Operador de aeronaves não tripuladas|Operadores de equipamentos pilotados remotamente|operador de aeronaves nao tripuladas
781705|Mergulhador profissional (raso e profundo)|Trabalhadores subaquáticos|mergulhador profissional (raso e profundo)
782105|Operador de draga|Operadores de máquinas e equipamentos de elevação|operador de draga
782110|Operador de guindaste (fixo)|Operadores de máquinas e equipamentos de elevação|operador de guindaste (fixo)
782115|Operador de guindaste móvel|Operadores de máquinas e equipamentos de elevação|operador de guindaste movel
782120|Operador de máquina rodoferroviária|Operadores de máquinas e equipamentos de elevação|operador de maquina rodoferroviaria
782125|Operador de monta-cargas (construção civil)|Operadores de máquinas e equipamentos de elevação|operador de monta-cargas (construcao civil)
782130|Operador de ponte rolante|Operadores de máquinas e equipamentos de elevação|operador de ponte rolante
782135|Operador de pórtico rolante|Operadores de máquinas e equipamentos de elevação|operador de portico rolante
782140|Operador de talha elétrica|Operadores de máquinas e equipamentos de elevação|operador de talha eletrica
782145|Sinaleiro (ponte rolante)|Operadores de máquinas e equipamentos de elevação|sinaleiro (ponte rolante)
782205|Guincheiro (construção civil)|Operadores de equipamentos de movimentação de cargas|guincheiro (construcao civil)
782210|Operador de docagem|Operadores de equipamentos de movimentação de cargas|operador de docagem
782220|Operador de empilhadeira|Operadores de equipamentos de movimentação de cargas|operador de empilhadeira
782305|Motorista de carro de passeio|Motoristas de veículos de pequeno e médio porte|motorista de carro de passeio
782310|Motorista de furgão ou veículo similar|Motoristas de veículos de pequeno e médio porte|motorista de furgao ou veiculo similar
782315|Motorista de táxi|Motoristas de veículos de pequeno e médio porte|motorista de taxi
782320|Condutor de ambulância|Motoristas de veículos de pequeno e médio porte|condutor de ambulancia
782325|Motorista de transporte por aplicativos|Motoristas de veículos de pequeno e médio porte|motorista de transporte por aplicativos
782405|Motorista de ônibus rodoviário|Condutores de ônibus urbanos, metropolitanos e rodoviários|motorista de onibus rodoviario
782410|Motorista de ônibus urbano|Condutores de ônibus urbanos, metropolitanos e rodoviários|motorista de onibus urbano
782415|Motorista de trólebus|Condutores de ônibus urbanos, metropolitanos e rodoviários|motorista de trolebus
782420|Condutor escolar (terrestre)|Condutores de ônibus urbanos, metropolitanos e rodoviários|condutor escolar (terrestre)
782505|Caminhoneiro autônomo (rotas regionais e internacionais)|Motoristas de veículos de cargas em geral|caminhoneiro autonomo (rotas regionais e internacionais)
782510|Motorista de caminhão (rotas regionais e internacionais)|Motoristas de veículos de cargas em geral|motorista de caminhao (rotas regionais e internacionais)
782515|Motorista operacional de guincho|Motoristas de veículos de cargas em geral|motorista operacional de guincho
782605|Operador de trem de metrô|Operadores de veículos sobre trilhos e cabos aéreos|operador de trem de metro
782610|Maquinista de trem|Operadores de veículos sobre trilhos e cabos aéreos|maquinista de trem
782615|Maquinista de trem metropolitano|Operadores de veículos sobre trilhos e cabos aéreos|maquinista de trem metropolitano
782620|Motorneiro|Operadores de veículos sobre trilhos e cabos aéreos|motorneiro
782625|Auxiliar de maquinista de trem|Operadores de veículos sobre trilhos e cabos aéreos|auxiliar de maquinista de trem
782630|Operador de teleférico (passageiros)|Operadores de veículos sobre trilhos e cabos aéreos|operador de teleferico (passageiros)
782705|Marinheiro de convés (marítimo e fluviário)|Trabalhadores aquaviários|marinheiro de conves (maritimo e fluviario)
782710|Marinheiro de máquinas|Trabalhadores aquaviários|marinheiro de maquinas
782715|Moço de convés|Trabalhadores aquaviários|moco de conves
782720|Moço de máquinas|Trabalhadores aquaviários|moco de maquinas
782725|Marinheiro de esporte e recreio|Trabalhadores aquaviários|marinheiro de esporte e recreio
782730|Marinheiro auxiliar de convés (marítimo e aquaviário)|Trabalhadores aquaviários|marinheiro auxiliar de conves (maritimo e aquaviario)
782735|Marinheiro auxiliar de máquinas (marítimo e aquaviário)|Trabalhadores aquaviários|marinheiro auxiliar de maquinas (maritimo e aquaviario)
782805|Condutor de veículos de tração animal (ruas e estradas)|Condutores de animais e de veículos de tração animal|condutor de veiculos de tracao animal (ruas e estradas)
782810|Tropeiro|Condutores de animais e de veículos de tração animal|tropeiro
782815|Boiadeiro|Condutores de animais e de veículos de tração animal|boiadeiro
783105|Agente de pátio|Trabalhadores de manobras de transportes sobre trilhos|agente de patio
783110|Manobrador|Trabalhadores de manobras de transportes sobre trilhos|manobrador
783205|Carregador (aeronaves)|Trabalhadores de cargas e descargas de mercadorias|carregador (aeronaves)
783210|Carregador (armazém)|Trabalhadores de cargas e descargas de mercadorias|carregador (armazem)
783215|Carregador (veículos de transportes terrestres)|Trabalhadores de cargas e descargas de mercadorias|carregador (veiculos de transportes terrestres)
783220|Estivador|Trabalhadores de cargas e descargas de mercadorias|estivador
783225|Ajudante de motorista|Trabalhadores de cargas e descargas de mercadorias|ajudante de motorista
783230|Bloqueiro (trabalhador portuário)|Trabalhadores de cargas e descargas de mercadorias|bloqueiro (trabalhador portuario)
783235|Trabalhador portuário de capatazia|Trabalhadores de cargas e descargas de mercadorias|trabalhador portuario de capatazia
783240|Amarrador e desamarrador de embarcações|Trabalhadores de cargas e descargas de mercadorias|amarrador e desamarrador de embarcacoes
784105|Embalador, a mão|Trabalhadores de embalagem e de etiquetagem|embalador, a mao
784110|Embalador, a máquina|Trabalhadores de embalagem e de etiquetagem|embalador, a maquina
784115|Operador de máquina de etiquetar|Trabalhadores de embalagem e de etiquetagem|operador de maquina de etiquetar
784120|Operador de máquina de envasar líquidos|Trabalhadores de embalagem e de etiquetagem|operador de maquina de envasar liquidos
784125|Operador de prensa de enfardamento|Trabalhadores de embalagem e de etiquetagem|operador de prensa de enfardamento
784205|Alimentador de linha de produção|Alimentadores de linhas de produção|alimentador de linha de producao
791105|Artesão bordador|Artesãos|artesao bordador
791110|Artesão ceramista|Artesãos|artesao ceramista
791115|Artesão com material reciclável|Artesãos|artesao com material reciclavel
791120|Artesão confeccionador de biojóias e ecojóias|Artesãos|artesao confeccionador de biojoias e ecojoias
791125|Artesão do couro|Artesãos|artesao do couro
791130|Artesão escultor|Artesãos|artesao escultor
791135|Artesão moveleiro (exceto reciclado)|Artesãos|artesao moveleiro (exceto reciclado)
791140|Artesão tecelão|Artesãos|artesao tecelao
791145|Artesão trançador|Artesãos|artesao trancador
791150|Artesão crocheteiro|Artesãos|artesao crocheteiro
791155|Artesão tricoteiro|Artesãos|artesao tricoteiro
791160|Artesão rendeiro|Artesãos|artesao rendeiro
810105|Mestre (indústria petroquímica e carboquímica)|Supervisores de produção em indústrias químicas, petroquímicas e afins|mestre (industria petroquimica e carboquimica)
810110|Mestre de produção química|Supervisores de produção em indústrias químicas, petroquímicas e afins|mestre de producao quimica
810205|Mestre (indústria de borracha e plástico)|Supervisores de produção em indústrias de transformação de plásticos e borrachas|mestre (industria de borracha e plastico)
810305|Mestre de produção farmacêutica|Supervisores de produção em indústrias de produtos farmacêuticos, cosméticos e afins|mestre de producao farmaceutica
811005|Operador de processos químicos e petroquímicos|Operadores polivalentes de equipamentos em indústrias químicas, petroquímicas e afins|operador de processos quimicos e petroquimicos
811010|Operador de sala de controle de instalações químicas, petroquímicas e afins|Operadores polivalentes de equipamentos em indústrias químicas, petroquímicas e afins|operador de sala de controle de instalacoes quimicas, petroquimicas e afins
811105|Moleiro (tratamentos químicos e afins)|Operadores de equipamentos de moagem e mistura de materiais (tratamentos químicos e afins)|moleiro (tratamentos quimicos e afins)
811110|Operador de máquina misturadeira (tratamentos químicos e afins)|Operadores de equipamentos de moagem e mistura de materiais (tratamentos químicos e afins)|operador de maquina misturadeira (tratamentos quimicos e afins)
811115|Operador de britadeira (tratamentos químicos e afins)|Operadores de equipamentos de moagem e mistura de materiais (tratamentos químicos e afins)|operador de britadeira (tratamentos quimicos e afins)
811120|Operador de concentração|Operadores de equipamentos de moagem e mistura de materiais (tratamentos químicos e afins)|operador de concentracao
811125|Trabalhador da fabricação de resinas e vernizes|Operadores de equipamentos de moagem e mistura de materiais (tratamentos químicos e afins)|trabalhador da fabricacao de resinas e vernizes
811130|Trabalhador de fabricação de tintas|Operadores de equipamentos de moagem e mistura de materiais (tratamentos químicos e afins)|trabalhador de fabricacao de tintas
811205|Operador de calcinação (tratamento químico e afins)|Operadores de calcinação e de tratamentos químicos de materiais radioativos|operador de calcinacao (tratamento quimico e afins)
811215|Operador de tratamento químico de materiais radioativos|Operadores de calcinação e de tratamentos químicos de materiais radioativos|operador de tratamento quimico de materiais radioativos
811305|Operador de centrifugadora (tratamentos químicos e afins)|Operadores de equipamentos de filtragem e separação|operador de centrifugadora (tratamentos quimicos e afins)
811310|Operador de exploração de petróleo|Operadores de equipamentos de filtragem e separação|operador de exploracao de petroleo
811315|Operador de filtro de secagem (mineração)|Operadores de equipamentos de filtragem e separação|operador de filtro de secagem (mineracao)
811320|Operador de filtro de tambor rotativo (tratamentos químicos e afins)|Operadores de equipamentos de filtragem e separação|operador de filtro de tambor rotativo (tratamentos quimicos e afins)
811325|Operador de filtro-esteira (mineração)|Operadores de equipamentos de filtragem e separação|operador de filtro-esteira (mineracao)
811330|Operador de filtro-prensa (tratamentos químicos e afins)|Operadores de equipamentos de filtragem e separação|operador de filtro-prensa (tratamentos quimicos e afins)
811335|Operador de filtros de parafina (tratamentos químicos e afins)|Operadores de equipamentos de filtragem e separação|operador de filtros de parafina (tratamentos quimicos e afins)
811405|Destilador de madeira|Operadores de equipamentos de destilação, evaporação e reação|destilador de madeira
811410|Destilador de produtos químicos por batelada (exceto petróleo)|Operadores de equipamentos de destilação, evaporação e reação|destilador de produtos quimicos por batelada (exceto petroleo)
811415|Operador de destilação de produtos químicos por processo contínuo (exceto petróleo)|Operadores de equipamentos de destilação, evaporação e reação|operador de destilacao de produtos quimicos por processo continuo (exceto petroleo)
811420|Operador de aparelho de reação e conversão (produtos químicos, exceto petróleo)|Operadores de equipamentos de destilação, evaporação e reação|operador de aparelho de reacao e conversao (produtos quimicos, exceto petroleo)
811425|Operador de equipamento de destilação de álcool|Operadores de equipamentos de destilação, evaporação e reação|operador de equipamento de destilacao de alcool
811430|Operador de evaporador na destilação|Operadores de equipamentos de destilação, evaporação e reação|operador de evaporador na destilacao
811505|Operador de painel de controle (refinação de petróleo)|Operadores de equipamentos de produção e refino de petróleo e gás|operador de painel de controle (refinacao de petroleo)
811510|Operador de transferência e estocagem - na refinação do petróleo|Operadores de equipamentos de produção e refino de petróleo e gás|operador de transferencia e estocagem - na refinacao do petroleo
811605|Operador de britador de coque|Operadores de equipamentos de coqueificação|operador de britador de coque
811610|Operador de carro de apagamento e coque|Operadores de equipamentos de coqueificação|operador de carro de apagamento e coque
811615|Operador de destilação e subprodutos de coque|Operadores de equipamentos de coqueificação|operador de destilacao e subprodutos de coque
811620|Operador de enfornamento e desenfornamento de coque|Operadores de equipamentos de coqueificação|operador de enfornamento e desenfornamento de coque
811625|Operador de exaustor (coqueria)|Operadores de equipamentos de coqueificação|operador de exaustor (coqueria)
811630|Operador de painel de controle (coqueificação)|Operadores de equipamentos de coqueificação|operador de painel de controle (coqueificacao)
811635|Operador de preservação e controle térmico|Operadores de equipamentos de coqueificação|operador de preservacao e controle termico
811640|Operador de reator de coque de petróleo|Operadores de equipamentos de coqueificação|operador de reator de coque de petroleo
811645|Operador de refrigeração (coqueria)|Operadores de equipamentos de coqueificação|operador de refrigeracao (coqueria)
811650|Operador de sistema de reversão (coqueria)|Operadores de equipamentos de coqueificação|operador de sistema de reversao (coqueria)
811705|Bamburista|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|bamburista
811710|Calandrista de borracha|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|calandrista de borracha
811715|Confeccionador de pneumáticos|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|confeccionador de pneumaticos
811725|Confeccionador de velas por imersão|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|confeccionador de velas por imersao
811735|Confeccionador de velas por moldagem|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|confeccionador de velas por moldagem
811745|Laminador de plástico|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|laminador de plastico
811750|Moldador de borracha por compressão|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|moldador de borracha por compressao
811760|Moldador de plástico por compressão|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|moldador de plastico por compressao
811770|Moldador de plástico por injeção|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|moldador de plastico por injecao
811775|Trefilador de borracha|Operadores de instalações e máquinas de produtos plásticos, de borracha e moldadores de parafinas|trefilador de borracha
811805|Operador de máquina de produtos farmacêuticos|Operadores de máquinas e instalações de produtos farmacêuticos, cosméticos e afins|operador de maquina de produtos farmaceuticos
811810|Drageador (medicamentos)|Operadores de máquinas e instalações de produtos farmacêuticos, cosméticos e afins|drageador (medicamentos)
811815|Operador de máquina de fabricação de cosméticos|Operadores de máquinas e instalações de produtos farmacêuticos, cosméticos e afins|operador de maquina de fabricacao de cosmeticos
811820|Operador de máquina de fabricação de produtos de higiene e limpeza (sabão, sabonete, detergente, absorvente, fraldas cotonetes e outros)|Operadores de máquinas e instalações de produtos farmacêuticos, cosméticos e afins|operador de maquina de fabricacao de produtos de higiene e limpeza (sabao, sabonete, detergente, absorvente, fraldas cotonetes e outros)
812105|Pirotécnico|Trabalhadores da fabricação de munição e explosivos químicos|pirotecnico
812110|Trabalhador da fabricação de munição e explosivos|Trabalhadores da fabricação de munição e explosivos químicos|trabalhador da fabricacao de municao e explosivos
813105|Cilindrista (petroquímica e afins)|Operadores de processos das indústrias de transformação de produtos químicos, petroquímicos e afins|cilindrista (petroquimica e afins)
813110|Operador de calandra (química, petroquímica e afins)|Operadores de processos das indústrias de transformação de produtos químicos, petroquímicos e afins|operador de calandra (quimica, petroquimica e afins)
813115|Operador de extrusora (química, petroquímica e afins)|Operadores de processos das indústrias de transformação de produtos químicos, petroquímicos e afins|operador de extrusora (quimica, petroquimica e afins)
813120|Operador de processo (química, petroquímica e afins)|Operadores de processos das indústrias de transformação de produtos químicos, petroquímicos e afins|operador de processo (quimica, petroquimica e afins)
813125|Operador de produção (química, petroquímica e afins)|Operadores de processos das indústrias de transformação de produtos químicos, petroquímicos e afins|operador de producao (quimica, petroquimica e afins)
813130|Técnico de operação (química, petroquímica e afins)|Operadores de processos das indústrias de transformação de produtos químicos, petroquímicos e afins|tecnico de operacao (quimica, petroquimica e afins)
818105|Assistente de laboratório industrial|Laboratoristas industriais auxiliares|assistente de laboratorio industrial
818110|Auxiliar de laboratório de análises físico-químicas|Laboratoristas industriais auxiliares|auxiliar de laboratorio de analises fisico-quimicas
820105|Mestre de siderurgia|Supervisores de produção em indústrias siderúrgicas|mestre de siderurgia
820110|Mestre de aciaria|Supervisores de produção em indústrias siderúrgicas|mestre de aciaria
820115|Mestre de alto-forno|Supervisores de produção em indústrias siderúrgicas|mestre de alto-forno
820120|Mestre de forno elétrico|Supervisores de produção em indústrias siderúrgicas|mestre de forno eletrico
820125|Mestre de laminação|Supervisores de produção em indústrias siderúrgicas|mestre de laminacao
820205|Supervisor de fabricação de produtos cerâmicos, porcelanatos e afins|Supervisores na fabricação de materiais para construção (vidros e cerâmicas)|supervisor de fabricacao de produtos ceramicos, porcelanatos e afins
820210|Supervisor de fabricação de produtos de vidro|Supervisores na fabricação de materiais para construção (vidros e cerâmicas)|supervisor de fabricacao de produtos de vidro
821105|Operador de centro de controle ( sinterização)|Operadores de instalações de sinterização|operador de centro de controle ( sinterizacao)
821110|Operador de máquina de sinterizar|Operadores de instalações de sinterização|operador de maquina de sinterizar
821205|Forneiro e operador (alto-forno)|Operadores de fornos de primeira  fusão e aciaria|forneiro e operador (alto-forno)
821210|Forneiro e operador (conversor a oxigênio)|Operadores de fornos de primeira  fusão e aciaria|forneiro e operador (conversor a oxigenio)
821215|Forneiro e operador (forno elétrico)|Operadores de fornos de primeira  fusão e aciaria|forneiro e operador (forno eletrico)
821220|Forneiro e operador (refino de metais não-ferrosos)|Operadores de fornos de primeira  fusão e aciaria|forneiro e operador (refino de metais nao-ferrosos)
821225|Forneiro e operador de forno de redução direta|Operadores de fornos de primeira  fusão e aciaria|forneiro e operador de forno de reducao direta
821230|Operador de aciaria (basculamento de convertedor)|Operadores de fornos de primeira  fusão e aciaria|operador de aciaria (basculamento de convertedor)
821235|Operador de aciaria (dessulfuração de gusa)|Operadores de fornos de primeira  fusão e aciaria|operador de aciaria (dessulfuracao de gusa)
821240|Operador de aciaria (recebimento de gusa)|Operadores de fornos de primeira  fusão e aciaria|operador de aciaria (recebimento de gusa)
821245|Operador de área de corrida|Operadores de fornos de primeira  fusão e aciaria|operador de area de corrida
821250|Operador de desgaseificação|Operadores de fornos de primeira  fusão e aciaria|operador de desgaseificacao
821255|Soprador de convertedor|Operadores de fornos de primeira  fusão e aciaria|soprador de convertedor
821305|Operador de laminador|Operadores de equipamentos de laminação|operador de laminador
821310|Operador de laminador de barras a frio|Operadores de equipamentos de laminação|operador de laminador de barras a frio
821315|Operador de laminador de barras a quente|Operadores de equipamentos de laminação|operador de laminador de barras a quente
821320|Operador de laminador de metais não-ferrosos|Operadores de equipamentos de laminação|operador de laminador de metais nao-ferrosos
821325|Operador de laminador de tubos|Operadores de equipamentos de laminação|operador de laminador de tubos
821330|Operador de montagem de cilindros e mancais|Operadores de equipamentos de laminação|operador de montagem de cilindros e mancais
821335|Recuperador de guias e cilindros|Operadores de equipamentos de laminação|recuperador de guias e cilindros
821405|Encarregado de acabamento de chapas e metais  (têmpera)|Operadores de equipamentos de acabamento de chapas e metais|encarregado de acabamento de chapas e metais  (tempera)
821410|Escarfador|Operadores de equipamentos de acabamento de chapas e metais|escarfador
821415|Marcador de produtos (siderúrgico e metalúrgico)|Operadores de equipamentos de acabamento de chapas e metais|marcador de produtos (siderurgico e metalurgico)
821420|Operador de bobinadeira de tiras a quente, no acabamento de chapas e metais|Operadores de equipamentos de acabamento de chapas e metais|operador de bobinadeira de tiras a quente, no acabamento de chapas e metais
821425|Operador de cabine de laminação (fio-máquina)|Operadores de equipamentos de acabamento de chapas e metais|operador de cabine de laminacao (fio-maquina)
821430|Operador de escória e sucata|Operadores de equipamentos de acabamento de chapas e metais|operador de escoria e sucata
821435|Operador de jato abrasivo|Operadores de equipamentos de acabamento de chapas e metais|operador de jato abrasivo
821440|Operador de tesoura mecânica e máquina de corte, no acabamento de chapas e metais|Operadores de equipamentos de acabamento de chapas e metais|operador de tesoura mecanica e maquina de corte, no acabamento de chapas e metais
821445|Preparador de sucata e aparas|Operadores de equipamentos de acabamento de chapas e metais|preparador de sucata e aparas
821450|Rebarbador de metal|Operadores de equipamentos de acabamento de chapas e metais|rebarbador de metal
822105|Forneiro de cubilô|Forneiros metalúrgicos (segunda fusão e reaquecimento)|forneiro de cubilo
822110|Forneiro de forno-poço|Forneiros metalúrgicos (segunda fusão e reaquecimento)|forneiro de forno-poco
822115|Forneiro de fundição (forno de redução)|Forneiros metalúrgicos (segunda fusão e reaquecimento)|forneiro de fundicao (forno de reducao)
822120|Forneiro de reaquecimento e tratamento térmico na metalurgia|Forneiros metalúrgicos (segunda fusão e reaquecimento)|forneiro de reaquecimento e tratamento termico na metalurgia
822125|Forneiro de revérbero|Forneiros metalúrgicos (segunda fusão e reaquecimento)|forneiro de reverbero
823105|Preparador de massa (fabricação de abrasivos)|Operadores na preparação de massas para abrasivo, vidro, cerâmica, porcelana e materiais de construção|preparador de massa (fabricacao de abrasivos)
823110|Preparador de massa (fabricação de vidro)|Operadores na preparação de massas para abrasivo, vidro, cerâmica, porcelana e materiais de construção|preparador de massa (fabricacao de vidro)
823115|Preparador de massa de argila|Operadores na preparação de massas para abrasivo, vidro, cerâmica, porcelana e materiais de construção|preparador de massa de argila
823120|Preparador de barbotina|Operadores na preparação de massas para abrasivo, vidro, cerâmica, porcelana e materiais de construção|preparador de barbotina
823125|Preparador de esmaltes (cerâmica)|Operadores na preparação de massas para abrasivo, vidro, cerâmica, porcelana e materiais de construção|preparador de esmaltes (ceramica)
823130|Preparador de aditivos|Operadores na preparação de massas para abrasivo, vidro, cerâmica, porcelana e materiais de construção|preparador de aditivos
823135|Operador de atomizador|Operadores na preparação de massas para abrasivo, vidro, cerâmica, porcelana e materiais de construção|operador de atomizador
823210|Extrusor de fios ou fibras de vidro|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|extrusor de fios ou fibras de vidro
823215|Forneiro na fundição de vidro|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|forneiro na fundicao de vidro
823220|Forneiro no recozimento de vidro|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|forneiro no recozimento de vidro
823230|Moldador de abrasivos na fabricação de cerâmica, vidro e porcelana|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|moldador de abrasivos na fabricacao de ceramica, vidro e porcelana
823235|Operador de banho metálico de vidro por flutuação|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|operador de banho metalico de vidro por flutuacao
823240|Operador de máquina de soprar vidro|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|operador de maquina de soprar vidro
823245|Operador de máquina extrusora de varetas e tubos de vidro|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|operador de maquina extrusora de varetas e tubos de vidro
823250|Operador de prensa de moldar vidro|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|operador de prensa de moldar vidro
823255|Temperador de vidro|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|temperador de vidro
823265|Trabalhador na fabricação de produtos abrasivos|Operadores de equipamentos de fabricação  e beneficiamento de cristais, vidros, cerâmicas, porcelanas, fibras de vidro, abrasivos e afins|trabalhador na fabricacao de produtos abrasivos
823305|Classificador e empilhador de tijolos refratários|Operadores de instalações e equipamentos de fabricação de materiais de construção|classificador e empilhador de tijolos refratarios
823315|Forneiro (materiais de construção)|Operadores de instalações e equipamentos de fabricação de materiais de construção|forneiro (materiais de construcao)
823320|Trabalhador da elaboração de pré-fabricados (fibrocimento sem amianto)|Operadores de instalações e equipamentos de fabricação de materiais de construção|trabalhador da elaboracao de pre-fabricados (fibrocimento sem amianto)
823325|Trabalhador da elaboração de pré-fabricados (concreto armado)|Operadores de instalações e equipamentos de fabricação de materiais de construção|trabalhador da elaboracao de pre-fabricados (concreto armado)
823330|Trabalhador da fabricação de pedras artificiais|Operadores de instalações e equipamentos de fabricação de materiais de construção|trabalhador da fabricacao de pedras artificiais
828105|Oleiro (fabricação de telhas)|Trabalhadores da fabricação de cerâmica estrutural para construção|oleiro (fabricacao de telhas)
828110|Oleiro (fabricação de tijolos)|Trabalhadores da fabricação de cerâmica estrutural para construção|oleiro (fabricacao de tijolos)
830105|Mestre (indústria de celulose, papel e papelão)|Supervisores da fabricação de celulose e papel|mestre (industria de celulose, papel e papelao)
831105|Cilindreiro na preparação de pasta para fabricação de papel|Preparadores de pasta para fabricação de papel|cilindreiro na preparacao de pasta para fabricacao de papel
831110|Operador de branqueador de pasta para fabricação de papel|Preparadores de pasta para fabricação de papel|operador de branqueador de pasta para fabricacao de papel
831115|Operador de digestor de pasta para fabricação de papel|Preparadores de pasta para fabricação de papel|operador de digestor de pasta para fabricacao de papel
831120|Operador de lavagem e depuração de pasta para fabricação de papel|Preparadores de pasta para fabricação de papel|operador de lavagem e depuracao de pasta para fabricacao de papel
831125|Operador de máquina de secar celulose|Preparadores de pasta para fabricação de papel|operador de maquina de secar celulose
832105|Calandrista de papel|Operadores de máquinas de fabricar papel e papelão|calandrista de papel
832110|Operador de cortadeira de papel|Operadores de máquinas de fabricar papel e papelão|operador de cortadeira de papel
832115|Operador de máquina de fabricar papel  (fase úmida)|Operadores de máquinas de fabricar papel e papelão|operador de maquina de fabricar papel  (fase umida)
832120|Operador de máquina de fabricar papel (fase seca)|Operadores de máquinas de fabricar papel e papelão|operador de maquina de fabricar papel (fase seca)
832125|Operador de máquina de fabricar papel e papelão|Operadores de máquinas de fabricar papel e papelão|operador de maquina de fabricar papel e papelao
832135|Operador de rebobinadeira na fabricação de papel e papelão|Operadores de máquinas de fabricar papel e papelão|operador de rebobinadeira na fabricacao de papel e papelao
833105|Cartonageiro, a máquina|Operadores de máquinas na fabricação de produtos de papel e papelão|cartonageiro, a maquina
833110|Confeccionador de bolsas, sacos e sacolas e papel, a máquina|Operadores de máquinas na fabricação de produtos de papel e papelão|confeccionador de bolsas, sacos e sacolas e papel, a maquina
833115|Confeccionador de sacos de celofane, a máquina|Operadores de máquinas na fabricação de produtos de papel e papelão|confeccionador de sacos de celofane, a maquina
833120|Operador de máquina de cortar e dobrar papelão|Operadores de máquinas na fabricação de produtos de papel e papelão|operador de maquina de cortar e dobrar papelao
833125|Operador de prensa de embutir papelão|Operadores de máquinas na fabricação de produtos de papel e papelão|operador de prensa de embutir papelao
833205|Cartonageiro, a mão (caixas de papelão)|Trabalhadores artesanais de produtos de papel e papelão|cartonageiro, a mao (caixas de papelao)
840105|Supervisor de produção da indústria alimentícia|Supervisores da fabricação de alimentos, bebidas e fumo|supervisor de producao da industria alimenticia
840110|Supervisor da indústria de bebidas|Supervisores da fabricação de alimentos, bebidas e fumo|supervisor da industria de bebidas
840115|Supervisor da indústria de fumo|Supervisores da fabricação de alimentos, bebidas e fumo|supervisor da industria de fumo
840120|Chefe de confeitaria|Supervisores da fabricação de alimentos, bebidas e fumo|chefe de confeitaria
841105|Moleiro de cereais (exceto arroz)|Trabalhadores da indústria de beneficiamento de grãos, cereais e afins|moleiro de cereais (exceto arroz)
841110|Moleiro de especiarias|Trabalhadores da indústria de beneficiamento de grãos, cereais e afins|moleiro de especiarias
841115|Operador de processo de moagem|Trabalhadores da indústria de beneficiamento de grãos, cereais e afins|operador de processo de moagem
841205|Moedor de sal|Trabalhadores no beneficiamento do sal|moedor de sal
841210|Refinador de sal|Trabalhadores no beneficiamento do sal|refinador de sal
841305|Operador de cristalização na refinação de açucar|Trabalhadores na fabricação e refino de açúcar|operador de cristalizacao na refinacao de acucar
841310|Operador de equipamentos de refinação de açúcar (processo contínuo)|Trabalhadores na fabricação e refino de açúcar|operador de equipamentos de refinacao de acucar (processo continuo)
841315|Operador de moenda na fabricação de açúcar|Trabalhadores na fabricação e refino de açúcar|operador de moenda na fabricacao de acucar
841320|Operador de tratamento de calda na refinação de açúcar|Trabalhadores na fabricação e refino de açúcar|operador de tratamento de calda na refinacao de acucar
841408|Cozinhador (conservação de alimentos)|Trabalhadores na fabricação e conservação de alimentos|cozinhador (conservacao de alimentos)
841416|Cozinhador de carnes|Trabalhadores na fabricação e conservação de alimentos|cozinhador de carnes
841420|Cozinhador de frutas e legumes|Trabalhadores na fabricação e conservação de alimentos|cozinhador de frutas e legumes
841428|Cozinhador de pescado|Trabalhadores na fabricação e conservação de alimentos|cozinhador de pescado
841432|Desidratador de alimentos|Trabalhadores na fabricação e conservação de alimentos|desidratador de alimentos
841440|Esterilizador de alimentos|Trabalhadores na fabricação e conservação de alimentos|esterilizador de alimentos
841444|Hidrogenador de óleos e gorduras|Trabalhadores na fabricação e conservação de alimentos|hidrogenador de oleos e gorduras
841448|Lagareiro|Trabalhadores na fabricação e conservação de alimentos|lagareiro
841456|Operador de câmaras frias|Trabalhadores na fabricação e conservação de alimentos|operador de camaras frias
841460|Operador de preparação de grãos vegetais (óleos e gorduras)|Trabalhadores na fabricação e conservação de alimentos|operador de preparacao de graos vegetais (oleos e gorduras)
841464|Prensador de frutas (exceto oleaginosas)|Trabalhadores na fabricação e conservação de alimentos|prensador de frutas (exceto oleaginosas)
841468|Preparador de rações|Trabalhadores na fabricação e conservação de alimentos|preparador de racoes
841472|Refinador de óleo e gordura|Trabalhadores na fabricação e conservação de alimentos|refinador de oleo e gordura
841476|Trabalhador de fabricação de margarina|Trabalhadores na fabricação e conservação de alimentos|trabalhador de fabricacao de margarina
841484|Trabalhador de preparação de pescados (limpeza)|Trabalhadores na fabricação e conservação de alimentos|trabalhador de preparacao de pescados (limpeza)
841505|Trabalhador de tratamento do leite e fabricação de laticínios e afins|Trabalhadores na pasteurização do leite e na fabricação de laticínios  e afins|trabalhador de tratamento do leite e fabricacao de laticinios e afins
841605|Misturador de café|Trabalhadores na industrialização de café, cacau, mate e de produtos afins|misturador de cafe
841610|Torrador de café|Trabalhadores na industrialização de café, cacau, mate e de produtos afins|torrador de cafe
841615|Moedor de café|Trabalhadores na industrialização de café, cacau, mate e de produtos afins|moedor de cafe
841620|Operador de extração de café solúvel|Trabalhadores na industrialização de café, cacau, mate e de produtos afins|operador de extracao de cafe soluvel
841625|Torrador de cacau|Trabalhadores na industrialização de café, cacau, mate e de produtos afins|torrador de cacau
841630|Misturador de chá ou mate|Trabalhadores na industrialização de café, cacau, mate e de produtos afins|misturador de cha ou mate
841705|Alambiqueiro|Trabalhadores na fabricação de cachaça, cerveja, vinhos e outras bebidas|alambiqueiro
841710|Filtrador de cerveja|Trabalhadores na fabricação de cachaça, cerveja, vinhos e outras bebidas|filtrador de cerveja
841715|Fermentador|Trabalhadores na fabricação de cachaça, cerveja, vinhos e outras bebidas|fermentador
841720|Trabalhador de fabricação de vinhos|Trabalhadores na fabricação de cachaça, cerveja, vinhos e outras bebidas|trabalhador de fabricacao de vinhos
841725|Malteiro (germinação)|Trabalhadores na fabricação de cachaça, cerveja, vinhos e outras bebidas|malteiro (germinacao)
841730|Cozinhador de malte|Trabalhadores na fabricação de cachaça, cerveja, vinhos e outras bebidas|cozinhador de malte
841735|Dessecador de malte|Trabalhadores na fabricação de cachaça, cerveja, vinhos e outras bebidas|dessecador de malte
841740|Vinagreiro|Trabalhadores na fabricação de cachaça, cerveja, vinhos e outras bebidas|vinagreiro
841745|Xaropeiro|Trabalhadores na fabricação de cachaça, cerveja, vinhos e outras bebidas|xaropeiro
841805|Operador de forno (fabricação de pães, biscoitos e similares)|Operadores de equipamentos na fabricação de pães, massas alimentícias, doces, chocolates e achocolatados|operador de forno (fabricacao de paes, biscoitos e similares)
841810|Operador de máquinas de fabricação de doces, salgados e massas alimentícias|Operadores de equipamentos na fabricação de pães, massas alimentícias, doces, chocolates e achocolatados|operador de maquinas de fabricacao de doces, salgados e massas alimenticias
841815|Operador de máquinas de fabricação de chocolates e achocolatados|Operadores de equipamentos na fabricação de pães, massas alimentícias, doces, chocolates e achocolatados|operador de maquinas de fabricacao de chocolates e achocolatados
842105|Preparador de melado e essência de fumo|Cigarreiros e beneficiadores de fumo|preparador de melado e essencia de fumo
842110|Processador de fumo|Cigarreiros e beneficiadores de fumo|processador de fumo
842115|Classificador de fumo|Cigarreiros e beneficiadores de fumo|classificador de fumo
842120|Auxiliar de processamento de fumo|Cigarreiros e beneficiadores de fumo|auxiliar de processamento de fumo
842125|Operador de máquina (fabricação de cigarros)|Cigarreiros e beneficiadores de fumo|operador de maquina (fabricacao de cigarros)
842135|Operador de máquina de preparação de matéria prima para produção de cigarros|Cigarreiros e beneficiadores de fumo|operador de maquina de preparacao de materia prima para producao de cigarros
842205|Preparador de fumo na fabricação de charutos|Charuteiros|preparador de fumo na fabricacao de charutos
842210|Operador de máquina de fabricar charutos e cigarrilhas|Charuteiros|operador de maquina de fabricar charutos e cigarrilhas
842215|Classificador de charutos|Charuteiros|classificador de charutos
842220|Cortador de charutos|Charuteiros|cortador de charutos
842225|Celofanista na fabricação de charutos|Charuteiros|celofanista na fabricacao de charutos
842230|Charuteiro a mão|Charuteiros|charuteiro a mao
842235|Degustador de charutos|Charuteiros|degustador de charutos
848105|Defumador de carnes e pescados|Trabalhadores artesanais na conservação de alimentos|defumador de carnes e pescados
848110|Salgador de alimentos|Trabalhadores artesanais na conservação de alimentos|salgador de alimentos
848115|Salsicheiro (fabricação de lingüiça, salsicha e produtos similares)|Trabalhadores artesanais na conservação de alimentos|salsicheiro (fabricacao de linguica, salsicha e produtos similares)
848205|Pasteurizador|Trabalhadores artesanais na pasteurização do leite e na fabricação de laticínios e afins|pasteurizador
848210|Queijeiro na fabricação de laticínio|Trabalhadores artesanais na pasteurização do leite e na fabricação de laticínios e afins|queijeiro na fabricacao de laticinio
848215|Manteigueiro na fabricação de laticínio|Trabalhadores artesanais na pasteurização do leite e na fabricação de laticínios e afins|manteigueiro na fabricacao de laticinio
848305|Padeiro|Padeiros, confeiteiros e afins|padeiro
848310|Confeiteiro|Padeiros, confeiteiros e afins|confeiteiro
848315|Masseiro (massas alimentícias)|Padeiros, confeiteiros e afins|masseiro (massas alimenticias)
848325|Trabalhador de fabricação de sorvete|Padeiros, confeiteiros e afins|trabalhador de fabricacao de sorvete
848405|Degustador de café|Trabalhadores na degustação e classificação de grãos e afins|degustador de cafe
848410|Degustador de chá|Trabalhadores na degustação e classificação de grãos e afins|degustador de cha
848415|Degustador de derivados de cacau|Trabalhadores na degustação e classificação de grãos e afins|degustador de derivados de cacau
848420|Degustador de vinhos ou licores|Trabalhadores na degustação e classificação de grãos e afins|degustador de vinhos ou licores
848425|Classificador de grãos|Trabalhadores na degustação e classificação de grãos e afins|classificador de graos
848505|Abatedor|Magarefes e afins|abatedor
848510|Açougueiro|Magarefes e afins|acougueiro
848515|Desossador|Magarefes e afins|desossador
848520|Magarefe|Magarefes e afins|magarefe
848525|Retalhador de carne|Magarefes e afins|retalhador de carne
848605|Trabalhador do beneficiamento de fumo|Trabalhadores artesanais na indústria do fumo|trabalhador do beneficiamento de fumo
860105|Supervisor de manutenção eletromecânica (utilidades)|Supervisores da produção de utilidades|supervisor de manutencao eletromecanica (utilidades)
860110|Supervisor de operação de fluidos (distribuição, captação, tratamento de água, gases, vapor)|Supervisores da produção de utilidades|supervisor de operacao de fluidos (distribuicao, captacao, tratamento de agua, gases, vapor)
860115|Supervisor de operação elétrica (geração, transmissão e distribuição de energia elétrica)|Supervisores da produção de utilidades|supervisor de operacao eletrica (geracao, transmissao e distribuicao de energia eletrica)
861105|Operador de central hidrelétrica|Operadores de instalações de geração e distribuição de energia elétrica, hidráulica, térmica ou nuclear|operador de central hidreletrica
861110|Operador de quadro de distribuição de energia elétrica|Operadores de instalações de geração e distribuição de energia elétrica, hidráulica, térmica ou nuclear|operador de quadro de distribuicao de energia eletrica
861115|Operador de central termoelétrica|Operadores de instalações de geração e distribuição de energia elétrica, hidráulica, térmica ou nuclear|operador de central termoeletrica
861120|Operador de reator nuclear|Operadores de instalações de geração e distribuição de energia elétrica, hidráulica, térmica ou nuclear|operador de reator nuclear
861205|Operador de subestação|Operadores de instalações de distribuição de energia elétrica|operador de subestacao
862105|Foguista (locomotivas a vapor)|Operadores de máquinas a vapor e utilidades|foguista (locomotivas a vapor)
862110|Maquinista de embarcações|Operadores de máquinas a vapor e utilidades|maquinista de embarcacoes
862115|Operador de bateria de gás de hulha|Operadores de máquinas a vapor e utilidades|operador de bateria de gas de hulha
862120|Operador de caldeira|Operadores de máquinas a vapor e utilidades|operador de caldeira
862130|Operador de compressor de ar|Operadores de máquinas a vapor e utilidades|operador de compressor de ar
862140|Operador de estação de bombeamento|Operadores de máquinas a vapor e utilidades|operador de estacao de bombeamento
862150|Operador de máquinas fixas, em geral|Operadores de máquinas a vapor e utilidades|operador de maquinas fixas, em geral
862155|Operador de utilidade (produção e distribuição de vapor, gás, óleo, combustível, energia, oxigênio)|Operadores de máquinas a vapor e utilidades|operador de utilidade (producao e distribuicao de vapor, gas, oleo, combustivel, energia, oxigenio)
862160|Operador de abastecimento de combustível de aeronave|Operadores de máquinas a vapor e utilidades|operador de abastecimento de combustivel de aeronave
862205|Operador de estação de captação, tratamento e distribuição de água|Operadores de instalações de captação, tratamento e distribuição de água|operador de estacao de captacao, tratamento e distribuicao de agua
862305|Operador de estação de tratamento de água e efluentes|Operadores de instalações de captação e esgotos|operador de estacao de tratamento de agua e efluentes
862310|Operador de forno de incineração no tratamento de água, efluentes e resíduos industriais|Operadores de instalações de captação e esgotos|operador de forno de incineracao no tratamento de agua, efluentes e residuos industriais
862405|Operador de instalação de extração, processamento, envasamento e distribuição de gases|Operadores de instalações de extração, processamento, envasamento e distribuição de gases|operador de instalacao de extracao, processamento, envasamento e distribuicao de gases
862505|Operador de instalação de refrigeração|Operadores de instalações de refrigeração e ar-condicionado|operador de instalacao de refrigeracao
862510|Operador de refrigeração com amônia|Operadores de instalações de refrigeração e ar-condicionado|operador de refrigeracao com amonia
862515|Operador de instalação de ar-condicionado|Operadores de instalações de refrigeração e ar-condicionado|operador de instalacao de ar-condicionado
910105|Encarregado de manutenção mecânica de sistemas operacionais|Supervisores em serviços de reparação e manutenção de máquinas e equipamentos industriais, comerciais e residenciais|encarregado de manutencao mecanica de sistemas operacionais
910110|Supervisor de manutenção de aparelhos térmicos, de climatização e de refrigeração|Supervisores em serviços de reparação e manutenção de máquinas e equipamentos industriais, comerciais e residenciais|supervisor de manutencao de aparelhos termicos, de climatizacao e de refrigeracao
910115|Supervisor de manutenção de bombas, motores, compressores e equipamentos de transmissão|Supervisores em serviços de reparação e manutenção de máquinas e equipamentos industriais, comerciais e residenciais|supervisor de manutencao de bombas, motores, compressores e equipamentos de transmissao
910120|Supervisor de manutenção de máquinas gráficas|Supervisores em serviços de reparação e manutenção de máquinas e equipamentos industriais, comerciais e residenciais|supervisor de manutencao de maquinas graficas
910125|Supervisor de manutenção de máquinas industriais têxteis|Supervisores em serviços de reparação e manutenção de máquinas e equipamentos industriais, comerciais e residenciais|supervisor de manutencao de maquinas industriais texteis
910130|Supervisor de manutenção de máquinas operatrizes e de usinagem|Supervisores em serviços de reparação e manutenção de máquinas e equipamentos industriais, comerciais e residenciais|supervisor de manutencao de maquinas operatrizes e de usinagem
910205|Supervisor da manutenção e reparação de veículos leves|Supervisores em serviços de reparação e manutenção veicular|supervisor da manutencao e reparacao de veiculos leves
910210|Supervisor da manutenção e reparação de veículos pesados|Supervisores em serviços de reparação e manutenção veicular|supervisor da manutencao e reparacao de veiculos pesados
910905|Supervisor de reparos linhas férreas|Supervisores de outros trabalhadores de serviços de reparação, conservação e manutenção|supervisor de reparos linhas ferreas
910910|Supervisor de manutenção de vias férreas|Supervisores de outros trabalhadores de serviços de reparação, conservação e manutenção|supervisor de manutencao de vias ferreas
911105|Mecânico de manutenção de bomba injetora (exceto de veículos automotores)|Mecânicos de manutenção de bombas, motores, compressores e equipamentos de transmissão|mecanico de manutencao de bomba injetora (exceto de veiculos automotores)
911110|Mecânico de manutenção de bombas|Mecânicos de manutenção de bombas, motores, compressores e equipamentos de transmissão|mecanico de manutencao de bombas
911115|Mecânico de manutenção de compressores de ar|Mecânicos de manutenção de bombas, motores, compressores e equipamentos de transmissão|mecanico de manutencao de compressores de ar
911120|Mecânico de manutenção de motores diesel (exceto de veículos automotores)|Mecânicos de manutenção de bombas, motores, compressores e equipamentos de transmissão|mecanico de manutencao de motores diesel (exceto de veiculos automotores)
911125|Mecânico de manutenção de redutores|Mecânicos de manutenção de bombas, motores, compressores e equipamentos de transmissão|mecanico de manutencao de redutores
911130|Mecânico de manutenção de turbinas (exceto de aeronaves)|Mecânicos de manutenção de bombas, motores, compressores e equipamentos de transmissão|mecanico de manutencao de turbinas (exceto de aeronaves)
911135|Mecânico de manutenção de turbocompressores|Mecânicos de manutenção de bombas, motores, compressores e equipamentos de transmissão|mecanico de manutencao de turbocompressores
911205|Mecânico de manutenção e instalação de aparelhos de climatização e  refrigeração|Mecânicos de manutenção e instalação de aparelhos de  climatização e refrigeração|mecanico de manutencao e instalacao de aparelhos de climatizacao e  refrigeracao
911305|Mecânico de manutenção de máquinas, em geral|Mecânicos de manutenção de máquinas industriais|mecanico de manutencao de maquinas, em geral
911310|Mecânico de manutenção de máquinas gráficas|Mecânicos de manutenção de máquinas industriais|mecanico de manutencao de maquinas graficas
911315|Mecânico de manutenção de máquinas operatrizes (lavra de madeira)|Mecânicos de manutenção de máquinas industriais|mecanico de manutencao de maquinas operatrizes (lavra de madeira)
911320|Mecânico de manutenção de máquinas têxteis|Mecânicos de manutenção de máquinas industriais|mecanico de manutencao de maquinas texteis
911325|Mecânico de manutenção de máquinas-ferramentas (usinagem de metais)|Mecânicos de manutenção de máquinas industriais|mecanico de manutencao de maquinas-ferramentas (usinagem de metais)
913105|Mecânico de manutenção de aparelhos de levantamento|Mecânicos de manutenção de máquinas pesadas e equipamentos agrícolas|mecanico de manutencao de aparelhos de levantamento
913110|Mecânico de manutenção de equipamento de mineração|Mecânicos de manutenção de máquinas pesadas e equipamentos agrícolas|mecanico de manutencao de equipamento de mineracao
913115|Mecânico de manutenção de máquinas agrícolas|Mecânicos de manutenção de máquinas pesadas e equipamentos agrícolas|mecanico de manutencao de maquinas agricolas
913120|Mecânico de manutenção de máquinas de construção e terraplenagem|Mecânicos de manutenção de máquinas pesadas e equipamentos agrícolas|mecanico de manutencao de maquinas de construcao e terraplenagem
913125|Vulcanizador de correias transportadoras|Mecânicos de manutenção de máquinas pesadas e equipamentos agrícolas|vulcanizador de correias transportadoras
914105|Mecânico de manutenção de aeronaves, em geral|Mecânicos de manutenção aeronáutica|mecanico de manutencao de aeronaves, em geral
914110|Mecânico de manutenção de sistema hidráulico de aeronaves (serviços de pista e hangar)|Mecânicos de manutenção aeronáutica|mecanico de manutencao de sistema hidraulico de aeronaves (servicos de pista e hangar)
914205|Mecânico de manutenção de motores e equipamentos navais|Mecânicos de manutenção de motores e equipamentos navais|mecanico de manutencao de motores e equipamentos navais
914305|Mecânico de manutenção de veículos ferroviários|Mecânicos de manutenção metroferroviária|mecanico de manutencao de veiculos ferroviarios
914405|Mecânico de manutenção de automóveis e veículos similares|Mecânicos de manutenção de veículos automotores|mecanico de manutencao de automoveis e veiculos similares
914410|Mecânico de manutenção de empilhadeiras e outros veículos de cargas leves|Mecânicos de manutenção de veículos automotores|mecanico de manutencao de empilhadeiras e outros veiculos de cargas leves
914415|Mecânico de manutenção de motocicletas|Mecânicos de manutenção de veículos automotores|mecanico de manutencao de motocicletas
914420|Mecânico de manutenção de tratores|Mecânicos de manutenção de veículos automotores|mecanico de manutencao de tratores
914425|Mecânico de veículos automotores a diesel (exceto tratores)|Mecânicos de manutenção de veículos automotores|mecanico de veiculos automotores a diesel (exceto tratores)
915105|Técnico em manutenção de instrumentos de medição e precisão|Técnicos em manutenção e reparação de instrumentos de medição e precisão|tecnico em manutencao de instrumentos de medicao e precisao
915110|Técnico em manutenção de hidrômetros|Técnicos em manutenção e reparação de instrumentos de medição e precisão|tecnico em manutencao de hidrometros
915115|Técnico em manutenção de balanças|Técnicos em manutenção e reparação de instrumentos de medição e precisão|tecnico em manutencao de balancas
915205|Restaurador de instrumentos musicais (exceto cordas arcadas)|Restauradores de instrumentos musicais|restaurador de instrumentos musicais (exceto cordas arcadas)
915210|Reparador de instrumentos musicais|Restauradores de instrumentos musicais|reparador de instrumentos musicais
915215|Luthier (restauração de cordas arcadas)|Restauradores de instrumentos musicais|luthier (restauracao de cordas arcadas)
915305|Técnico em manutenção de equipamentos e instrumentos odonto-médico-hospitalares|Técnicos em manutenção e reparação de equipamentos biomédicos|tecnico em manutencao de equipamentos e instrumentos odonto-medico-hospitalares
915405|Reparador de equipamentos fotográficos|Reparadores de equipamentos fotográficos|reparador de equipamentos fotograficos
919105|Lubrificador industrial|Lubrificadores|lubrificador industrial
919110|Lubrificador de veículos automotores (exceto embarcações)|Lubrificadores|lubrificador de veiculos automotores (exceto embarcacoes)
919115|Lubrificador de embarcações|Lubrificadores|lubrificador de embarcacoes
919205|Mecânico de manutenção de máquinas cortadoras de grama, roçadeiras, motosserras e similares|Trabalhadores de manutenção de roçadeiras, motoserras e similares|mecanico de manutencao de maquinas cortadoras de grama, rocadeiras, motosserras e similares
919305|Mecânico de manutenção de aparelhos esportivos e de ginástica|Mecânicos de manutenção de bicicletas e equipamentos esportivos e de ginástica|mecanico de manutencao de aparelhos esportivos e de ginastica
919310|Mecânico de manutenção de bicicletas e veículos similares|Mecânicos de manutenção de bicicletas e equipamentos esportivos e de ginástica|mecanico de manutencao de bicicletas e veiculos similares
919315|Montador de bicicletas|Mecânicos de manutenção de bicicletas e equipamentos esportivos e de ginástica|montador de bicicletas
950105|Supervisor de manutenção elétrica de alta tensão industrial|Supervisores de manutenção eletroeletrônica industrial, comercial e predial|supervisor de manutencao eletrica de alta tensao industrial
950110|Supervisor de manutenção eletromecânica industrial, comercial e predial|Supervisores de manutenção eletroeletrônica industrial, comercial e predial|supervisor de manutencao eletromecanica industrial, comercial e predial
950205|Encarregado de manutenção eletroeletrônica de veículos|Supervisores de manutenção eletroeletrônica veicular|encarregado de manutencao eletroeletronica de veiculos
950305|Supervisor de manutenção eletromecânica|Supervisores de manutenção eletromecânica|supervisor de manutencao eletromecanica
951105|Eletricista de manutenção eletroeletrônica|Eletricistas de manutenção eletroeletrônica|eletricista de manutencao eletroeletronica
951305|Instalador de sistemas eletroeletrônicos de segurança|Instaladores e mantenedores de sistemas eletroeletrônicos de segurança|instalador de sistemas eletroeletronicos de seguranca
951310|Mantenedor de sistemas eletroeletrônicos de segurança|Instaladores e mantenedores de sistemas eletroeletrônicos de segurança|mantenedor de sistemas eletroeletronicos de seguranca
951315|Monitor de sistemas eletrônicos de segurança interno|Instaladores e mantenedores de sistemas eletroeletrônicos de segurança|monitor de sistemas eletronicos de seguranca interno
951320|Monitor de sistemas eletrônicos de segurança externo|Instaladores e mantenedores de sistemas eletroeletrônicos de segurança|monitor de sistemas eletronicos de seguranca externo
953105|Eletricista de instalações (aeronaves)|Eletricistas eletrônicos de manutenção veicular (aérea, terrestre e naval)|eletricista de instalacoes (aeronaves)
953110|Eletricista de instalações (embarcações)|Eletricistas eletrônicos de manutenção veicular (aérea, terrestre e naval)|eletricista de instalacoes (embarcacoes)
953115|Eletricista de instalações (veículos automotores e máquinas operatrizes, exceto aeronaves e embarcações)|Eletricistas eletrônicos de manutenção veicular (aérea, terrestre e naval)|eletricista de instalacoes (veiculos automotores e maquinas operatrizes, exceto aeronaves e embarcacoes)
954105|Eletromecânico de manutenção de elevadores|Instaladores e mantenedores eletromecânicos de elevadores, escadas e portas automáticas|eletromecanico de manutencao de elevadores
954110|Eletromecânico de manutenção de escadas rolantes|Instaladores e mantenedores eletromecânicos de elevadores, escadas e portas automáticas|eletromecanico de manutencao de escadas rolantes
954115|Eletromecânico de manutenção de portas automáticas|Instaladores e mantenedores eletromecânicos de elevadores, escadas e portas automáticas|eletromecanico de manutencao de portas automaticas
954120|Mecânico de manutenção de instalações mecânicas de edifícios|Instaladores e mantenedores eletromecânicos de elevadores, escadas e portas automáticas|mecanico de manutencao de instalacoes mecanicas de edificios
954125|Operador eletromecânico|Instaladores e mantenedores eletromecânicos de elevadores, escadas e portas automáticas|operador eletromecanico
954205|Reparador de aparelhos eletrodomésticos (exceto imagem e som)|Reparadores de aparelhos eletrodomésticos|reparador de aparelhos eletrodomesticos (exceto imagem e som)
954210|Reparador de rádio, tv e som|Reparadores de aparelhos eletrodomésticos|reparador de radio, tv e som
954305|Reparador de equipamentos de escritório|Reparadores de equipamentos de escritório|reparador de equipamentos de escritorio
991105|Conservador de via permanente (trilhos)|Conservadores de vias permanentes (trilhos)|conservador de via permanente (trilhos)
991110|Inspetor de via permanente (trilhos)|Conservadores de vias permanentes (trilhos)|inspetor de via permanente (trilhos)
991115|Operador de máquinas especiais em conservação de via permanente (trilhos)|Conservadores de vias permanentes (trilhos)|operador de maquinas especiais em conservacao de via permanente (trilhos)
991120|Soldador aluminotérmico em conservação de trilhos|Conservadores de vias permanentes (trilhos)|soldador aluminotermico em conservacao de trilhos
991205|Mantenedor de equipamentos de parques de diversões e similares|Mantenedores de equipamentos de parques de diversões e similares|mantenedor de equipamentos de parques de diversoes e similares
991305|Funileiro de veículos (reparação)|Reparadores de carrocerias de veículos|funileiro de veiculos (reparacao)
991310|Montador de veículos (reparação)|Reparadores de carrocerias de veículos|montador de veiculos (reparacao)
991315|Pintor de veículos (reparação)|Reparadores de carrocerias de veículos|pintor de veiculos (reparacao)
992105|Alinhador veicular|Trabalhadores elementares de serviços de manutenção veicular|alinhador veicular
992110|Balanceador|Trabalhadores elementares de serviços de manutenção veicular|balanceador
992115|Borracheiro|Trabalhadores elementares de serviços de manutenção veicular|borracheiro
992120|Lavador de peças|Trabalhadores elementares de serviços de manutenção veicular|lavador de pecas
992205|Encarregado geral de operações de conservação de vias permanentes (exceto trilhos)|Trabalhadores operacionais de conservação de vias permanentes (exceto trilhos)|encarregado geral de operacoes de conservacao de vias permanentes (exceto trilhos)
992210|Encarregado de equipe de conservação de vias permanentes (exceto trilhos)|Trabalhadores operacionais de conservação de vias permanentes (exceto trilhos)|encarregado de equipe de conservacao de vias permanentes (exceto trilhos)
992215|Operador de ceifadeira na conservação de vias permanentes|Trabalhadores operacionais de conservação de vias permanentes (exceto trilhos)|operador de ceifadeira na conservacao de vias permanentes
992220|Pedreiro de conservação de vias permanentes (exceto trilhos)|Trabalhadores operacionais de conservação de vias permanentes (exceto trilhos)|pedreiro de conservacao de vias permanentes (exceto trilhos)
992225|Auxiliar geral de conservação de vias permanentes (exceto trilhos)|Trabalhadores operacionais de conservação de vias permanentes (exceto trilhos)|auxiliar geral de conservacao de vias permanentes (exceto trilhos)$cbo$, E'
')) l
on conflict (codigo) do update set titulo = excluded.titulo, familia = excluded.familia, busca = excluded.busca;

insert into public.cbo_sinonimos (codigo, titulo, busca)
select split_part(l, '|', 1), split_part(l, '|', 2), split_part(l, '|', 3)
from unnest(string_to_array($cbo$010105|Brigadeiro|brigadeiro
010105|Major-brigadeiro|major-brigadeiro
010105|Marechal-do-ar|marechal-do-ar
010105|Tenente-brigadeiro|tenente-brigadeiro
010110|General-de-brigada|general-de-brigada
010110|General-de-divisão|general-de-divisao
010110|General-de-exército|general-de-exercito
010110|Marechal|marechal
010115|Almirante|almirante
010115|Almirante-de-esquadra|almirante-de-esquadra
010115|Contra-almirante|contra-almirante
010115|Vice-almirante|vice-almirante
010205|Capitão da aeronáutica|capitao da aeronautica
010205|Coronel da aeronáutica|coronel da aeronautica
010205|Major da aeronáutica|major da aeronautica
010205|Primeiro-tenente da aeronáutica|primeiro-tenente da aeronautica
010205|Segundo-tenente da aeronáutica|segundo-tenente da aeronautica
010205|Tenente-coronel da aeronáutica|tenente-coronel da aeronautica
010210|Capitão do exército|capitao do exercito
010210|Coronel do exército|coronel do exercito
010210|Major do exército|major do exercito
010210|Primeiro-tenente do exército|primeiro-tenente do exercito
010210|Segundo-tenente do exército|segundo-tenente do exercito
010210|Tenente-coronel do exército|tenente-coronel do exercito
010215|Capitão-de-corveta|capitao-de-corveta
010215|Capitão-de-fragata|capitao-de-fragata
010215|Capitão-de-mar-e-guerra|capitao-de-mar-e-guerra
010215|Capitão-tenente da marinha|capitao-tenente da marinha
010215|Primeiro-tenente da marinha|primeiro-tenente da marinha
010215|Segundo-tenente da marinha|segundo-tenente da marinha
010305|Cabo da aeronáutica|cabo da aeronautica
010305|Primeiro-sargento da aeronáutica|primeiro-sargento da aeronautica
010305|Segundo-sargento da aeronáutica|segundo-sargento da aeronautica
010305|Soldado da aeronáutica|soldado da aeronautica
010305|Suboficial da aeronáutica|suboficial da aeronautica
010305|Taifeiro da aeronáutica|taifeiro da aeronautica
010305|Taifeiro-mor da aeronáutica|taifeiro-mor da aeronautica
010305|Terceiro-sargento da aeronáutica|terceiro-sargento da aeronautica
010310|Cabo do exército|cabo do exercito
010310|Primeiro-sargento do exército|primeiro-sargento do exercito
010310|Segundo-sargento|segundo-sargento
010310|Soldado do exército|soldado do exercito
010310|Subtenente do exército|subtenente do exercito
010310|Taifeiro do exército|taifeiro do exercito
010310|Taifeiro-mor do exército|taifeiro-mor do exercito
010310|Terceiro-sargento do exército|terceiro-sargento do exercito
010315|Cabo da marinha|cabo da marinha
010315|Marinheiro|marinheiro
010315|Primeiro-sargento da marinha|primeiro-sargento da marinha
010315|Segundo-sargento da marinha|segundo-sargento da marinha
010315|Soldado fuzileiro naval|soldado fuzileiro naval
010315|Suboficial da marinha|suboficial da marinha
010315|Terceiro-sargento da marinha|terceiro-sargento da marinha
030105|Coronel do corpo de bombeiros militar|coronel do corpo de bombeiros militar
030110|Major do corpo de bombeiros militar|major do corpo de bombeiros militar
030115|Tenente-coronel do corpo de bombeiros militar|tenente-coronel do corpo de bombeiros militar
030205|Capitão do corpo de bombeiros militar|capitao do corpo de bombeiros militar
030305|Oficial subalterno do corpo de bombeiros militar|oficial subalterno do corpo de bombeiros militar
030305|Primeiro-tenente bombeiro militar|primeiro-tenente bombeiro militar
030305|Primeiro-tenente do corpo de bombeiros|primeiro-tenente do corpo de bombeiros
030305|Segundo-tenente bombeiro militar|segundo-tenente bombeiro militar
030305|Segundo-tenente do corpo de bombeiros|segundo-tenente do corpo de bombeiros
031105|Subtenente do corpo de bombeiros militar|subtenente do corpo de bombeiros militar
031110|Sargento do corpo de bombeiros militar|sargento do corpo de bombeiros militar
111320|Juiz do tribunal regional do trabalho|juiz do tribunal regional do trabalho
111320|Juiz federal  de segunda  instância|juiz federal  de segunda  instancia
111325|Desembargadores|desembargadores
111325|Juiz de alçada|juiz de alcada
111325|Juiz de direito de primeira instância|juiz de direito de primeira instancia
111330|Juiz do tribunal regional federal|juiz do tribunal regional federal
111340|Juiz dos tribunais militares estaduais|juiz dos tribunais militares estaduais
111405|Conselheiro (diplomacia)|conselheiro (diplomacia)
111405|Coordenador  do serviço público federal|coordenador  do servico publico federal
111405|Coordenador geral do serviço público federal|coordenador geral do servico publico federal
111405|Diretor do serviço público federal|diretor do servico publico federal
111405|Funcionário público federal superior|funcionario publico federal superior
111405|Gerente do serviço público federal|gerente do servico publico federal
111405|Ministro (diplomacia)|ministro (diplomacia)
111405|Secretário de estado (serviço público federal)|secretario de estado (servico publico federal)
111405|Secretário (diplomacia)|secretario (diplomacia)
111405|Subsecretário de estado (serviço público federal)|subsecretario de estado (servico publico federal)
111410|Chefe do serviço público estadual e distrital|chefe do servico publico estadual e distrital
111410|Coordenador do serviço público estadual e distrital|coordenador do servico publico estadual e distrital
111410|Funcionário público estadual e distrital superior|funcionario publico estadual e distrital superior
111410|Gerente do serviço público estadual e distrital|gerente do servico publico estadual e distrital
111410|Secretário estadual e distrital (serviço público estadual e distrital)|secretario estadual e distrital (servico publico estadual e distrital)
111415|Chefe de assessoria técnica do serviço público municipal|chefe de assessoria tecnica do servico publico municipal
111415|Chefe de gabinete do serviço público municipal|chefe de gabinete do servico publico municipal
111415|Diretor de departamento do  serviço público municipal|diretor de departamento do  servico publico municipal
111415|Diretor de divisão do serviço público municipal|diretor de divisao do servico publico municipal
111415|Funcionário público municipal superior|funcionario publico municipal superior
111415|Secretário municipal (serviço público municipal)|secretario municipal (servico publico municipal)
113005|Morubixaba|morubixaba
113005|Tuxaua|tuxaua
113015|Coordenador de associação quilombola|coordenador de associacao quilombola
113015|Líder quilombola|lider quilombola
114105|Assessor|assessor
114105|Assessor político partidário|assessor politico partidario
114105|Dirigente partidário|dirigente partidario
114105|Dirigente político|dirigente politico
114105|Líder partidário|lider partidario
114205|Assistente sindical de entidades de trabalhadores|assistente sindical de entidades de trabalhadores
114205|Diretor de sindicato de trabalhadores|diretor de sindicato de trabalhadores
114210|Assistente sindical de entidades patronais|assistente sindical de entidades patronais
114210|Diretor de sindicato patronal|diretor de sindicato patronal
114305|Coordenador de entidade religiosa|coordenador de entidade religiosa
114305|Diretor de entidade religiosa|diretor de entidade religiosa
114305|Gestor de entidade religiosa|gestor de entidade religiosa
114305|Secretário-executivo de entidade religiosa|secretario-executivo de entidade religiosa
114405|Dirigente de clube e associação esportiva|dirigente de clube e associacao esportiva
114405|Dirigente de organização de defesa de direitos|dirigente de organizacao de defesa de direitos
114405|Dirigente de organização de desenvolvimento cultural|dirigente de organizacao de desenvolvimento cultural
114405|Dirigente de organização de proteção ao meio ambiente|dirigente de organizacao de protecao ao meio ambiente
114405|Dirigente de organização filantrópica|dirigente de organizacao filantropica
114405|Dirigente de organização humanitária|dirigente de organizacao humanitaria
114405|Dirigente de organização não governamental|dirigente de organizacao nao governamental
122105|Diretor de produção na agropecuária|diretor de producao na agropecuaria
122115|Diretor de produção em empresa florestal|diretor de producao em empresa florestal
122120|Diretor de produção em empresa pesqueira|diretor de producao em empresa pesqueira
122205|Diretor de produção em utilidades|diretor de producao em utilidades
122205|Diretor de produção na indústria de transformação|diretor de producao na industria de transformacao
122205|Diretor de produção na mineração|diretor de producao na mineracao
122205|Superintendente de operações industriais|superintendente de operacoes industriais
122305|Diretor de contratos de obras pública e civil|diretor de contratos de obras publica e civil
122305|Diretor de obras pública e civil|diretor de obras publica e civil
122305|Diretor de produção de obras pública e civil|diretor de producao de obras publica e civil
122305|Superintendente de contratos de operações de obras pública e civil|superintendente de contratos de operacoes de obras publica e civil
122520|Analista de turismo (turismólogo)|analista de turismo (turismologo)
122520|Consultor em turismo (turismólogo)|consultor em turismo (turismologo)
122520|Gestor em turismo (turismólogo)|gestor em turismo (turismologo)
122520|Planejador de turismo (turismólogo)|planejador de turismo (turismologo)
122605|Coordenador geral de operações de correios|coordenador geral de operacoes de correios
122605|Diretor de correios|diretor de correios
122610|Diretor de gestão portuária|diretor de gestao portuaria
122610|Gerente de terminal em operações de armazenamento|gerente de terminal em operacoes de armazenamento
122615|Diretor de operações de radiodifusão|diretor de operacoes de radiodifusao
122615|Diretor de redes (telecomunicações)|diretor de redes (telecomunicacoes)
122615|Diretor regional (telecomunicações)|diretor regional (telecomunicacoes)
122620|Diretor de logística em operações de transportes|diretor de logistica em operacoes de transportes
122705|Diretor adjunto comercial em operações de intermediação financeira|diretor adjunto comercial em operacoes de intermediacao financeira
122705|Diretor de plataforma em operações de intermediação financeira|diretor de plataforma em operacoes de intermediacao financeira
122705|Diretor regional em operações de intermediação financeira|diretor regional em operacoes de intermediacao financeira
123105|Superintendente administrativo|superintendente administrativo
123110|Superintendente administrativo e financeiro|superintendente administrativo e financeiro
123115|Diretor de finanças|diretor de financas
123115|Diretor de planejamento financeiro|diretor de planejamento financeiro
123115|Superintendente de finanças|superintendente de financas
123115|Superintendente financeiro|superintendente financeiro
123205|Diretor de capital humano|diretor de capital humano
123305|Diretor de vendas|diretor de vendas
123305|Diretor geral de vendas|diretor geral de vendas
123305|Superintendente comercial|superintendente comercial
123305|Vice-presidente comercial|vice-presidente comercial
123305|Vice-presidente de vendas|vice-presidente de vendas
123310|Superintendente de marketing|superintendente de marketing
123310|Vice-presidente de marketing|vice-presidente de marketing
123405|Diretor de compras|diretor de compras
123405|Diretor de logística e de suprimentos|diretor de logistica e de suprimentos
123605|Diretor de informática|diretor de informatica
123605|Diretor de infraestrutura de tecnologia da informação|diretor de infraestrutura de tecnologia da informacao
123605|Diretor de processos de tecnologia da informação|diretor de processos de tecnologia da informacao
123605|Diretor de serviços de informática|diretor de servicos de informatica
123605|Diretor de serviços de tecnologia da informação|diretor de servicos de tecnologia da informacao
123605|Diretor de tecnologia|diretor de tecnologia
123705|Diretor de tecnologia (pesquisa, desenvolvimento e inovação)|diretor de tecnologia (pesquisa, desenvolvimento e inovacao)
123705|Diretor técnico (pesquisa, desenvolvimento e inovação)|diretor tecnico (pesquisa, desenvolvimento e inovacao)
123705|Superintendente de desenvolvimento de produtos e processos|superintendente de desenvolvimento de produtos e processos
123805|Diretor de operações e manutenção|diretor de operacoes e manutencao
123805|Superintendente de manutenção|superintendente de manutencao
131105|Diretor de biblioteca|diretor de biblioteca
131105|Diretor de museu|diretor de museu
131105|Diretor de ong (organização não governamental)|diretor de ong (organizacao nao governamental)
131105|Diretor de organização social e interesse público|diretor de organizacao social e interesse publico
131105|Diretor de pesquisa|diretor de pesquisa
131105|Diretor de relações interinstitucionais|diretor de relacoes interinstitucionais
131105|Diretor executivo de instituições culturais|diretor executivo de instituicoes culturais
131105|Superintendente de relações institucionais|superintendente de relacoes institucionais
131105|Superintendente de serviços culturais|superintendente de servicos culturais
131110|Diretor de departamento de esportes|diretor de departamento de esportes
131110|Diretor de osip (organização social de interesse público)|diretor de osip (organizacao social de interesse publico)
131115|Administrador de instituições culturais|administrador de instituicoes culturais
131115|Coordenador de eventos|coordenador de eventos
131115|Coordenador executivo|coordenador executivo
131115|Gerente de departamento de planejamento e análise|gerente de departamento de planejamento e analise
131115|Gerente de departamento de planejamento e pesquisa|gerente de departamento de planejamento e pesquisa
131115|Gerente de divisão de pesquisas e análise|gerente de divisao de pesquisas e analise
131115|Gerente de ong (organização não governamental)|gerente de ong (organizacao nao governamental)
131115|Gerente de planejamento e estatística|gerente de planejamento e estatistica
131115|Superintendente de seção de estudos e programação|superintendente de secao de estudos e programacao
131115|Superintendente de seção de estudos especiais|superintendente de secao de estudos especiais
131120|Chefe de serviço de pesquisa e estatística|chefe de servico de pesquisa e estatistica
131120|Coordenador de projetos sociais|coordenador de projetos sociais
131120|Diretor de futebol|diretor de futebol
131120|Gerente de organização social de interesse público|gerente de organizacao social de interesse publico
131120|Gerente de pesquisas no ibge (instituto brasileiro de geografia e estatística)|gerente de pesquisas no ibge (instituto brasileiro de geografia e estatistica)
131205|Diretor clínico|diretor clinico
131205|Diretor de departamento de saúde|diretor de departamento de saude
131205|Diretor de departamento médico|diretor de departamento medico
131205|Diretor de divisão médica|diretor de divisao medica
131205|Diretor de serviços médicos|diretor de servicos medicos
131205|Diretor de unidade assistencial|diretor de unidade assistencial
131205|Diretor de unidade de saúde|diretor de unidade de saude
131205|Diretor de unidade hospitalar|diretor de unidade hospitalar
131205|Diretor médico-hospitalar|diretor medico-hospitalar
131205|Diretor técnico de unidade hospitalar|diretor tecnico de unidade hospitalar
131210|Administrador de ambulatório|administrador de ambulatorio
131210|Chefe de serviços de saúde|chefe de servicos de saude
131210|Gerente da área de saúde mental|gerente da area de saude mental
131210|Gerente de ambulatório|gerente de ambulatorio
131210|Gerente de apoio e diagnóstico de saúde|gerente de apoio e diagnostico de saude
131210|Gerente de enfermagem|gerente de enfermagem
131210|Gerente de nutrição em unidades de saúde|gerente de nutricao em unidades de saude
131210|Gerente de programas de saúde|gerente de programas de saude
131210|Gerente de pronto-socorro|gerente de pronto-socorro
131305|Diretor adjunto de escolas privadas|diretor adjunto de escolas privadas
131305|Diretor de centro de educação infantil (creche e pré-escola) privado|diretor de centro de educacao infantil (creche e pre-escola) privado
131305|Diretor de centro de formação profissional privado|diretor de centro de formacao profissional privado
131305|Diretor de colégio privado|diretor de colegio privado
131305|Diretor de escola privada|diretor de escola privada
131305|Diretor de escola religiosa privada|diretor de escola religiosa privada
131305|Diretor de estabelecimento de ensino fundamental privado|diretor de estabelecimento de ensino fundamental privado
131305|Diretor de estabelecimento de ensino médio privado|diretor de estabelecimento de ensino medio privado
131305|Diretor de estabelecimento de ensino superior privado|diretor de estabelecimento de ensino superior privado
131305|Diretor de internato privado|diretor de internato privado
131305|Diretor de unidade integrada de pré-escola privada|diretor de unidade integrada de pre-escola privada
131305|Subdiretor de ensino privado|subdiretor de ensino privado
131310|Diretor de caic público|diretor de caic publico
131310|Diretor de centro de educação infantil público|diretor de centro de educacao infantil publico
131310|Diretor de centro de ensino especial público|diretor de centro de ensino especial publico
131310|Diretor de centro de ensino fundamental público|diretor de centro de ensino fundamental publico
131310|Diretor de centro de ensino médio profissionalizante público|diretor de centro de ensino medio profissionalizante publico
131310|Diretor de centro de ensino médio público|diretor de centro de ensino medio publico
131310|Diretor de centro de ensino supletivo público|diretor de centro de ensino supletivo publico
131310|Diretor de colégio público|diretor de colegio publico
131310|Diretor de escola de classe pública|diretor de escola de classe publica
131310|Diretor de escola pública|diretor de escola publica
131310|Vice-diretor de centro de educação infantil público|vice-diretor de centro de educacao infantil publico
131310|Vice-diretor de centro de ensino especial público|vice-diretor de centro de ensino especial publico
131310|Vice-diretor de centro de ensino fundamental público|vice-diretor de centro de ensino fundamental publico
131310|Vice-diretor de centro de ensino médio, profissionalizante público|vice-diretor de centro de ensino medio, profissionalizante publico
131310|Vice-diretor de centro de ensino médio público|vice-diretor de centro de ensino medio publico
131310|Vice-diretor de centro de ensino supletivo público|vice-diretor de centro de ensino supletivo publico
131310|Vice-diretor de centro interescolar de línguas público|vice-diretor de centro interescolar de linguas publico
131310|Vice-diretor de colégio público|vice-diretor de colegio publico
131310|Vice-diretor de escola de classe pública|vice-diretor de escola de classe publica
131310|Vice-diretor de escola pública|vice-diretor de escola publica
131310|Vice-diretor de grupo escolar público|vice-diretor de grupo escolar publico
131315|Chefe de centro de formação profissional privado|chefe de centro de formacao profissional privado
131315|Chefe de departamento em escolas privadas|chefe de departamento em escolas privadas
131315|Gerente de apoio educacional em escolas privadas|gerente de apoio educacional em escolas privadas
131315|Gerente de centro de educação profissional em escolas privadas|gerente de centro de educacao profissional em escolas privadas
131315|Gerente de centro de formação profissional em escolas privadas|gerente de centro de formacao profissional em escolas privadas
141110|Coordenador de produção de madeira|coordenador de producao de madeira
141110|Gerente de departamento florestal|gerente de departamento florestal
141110|Gerente de produção florestal|gerente de producao florestal
141110|Gerente operacional florestal|gerente operacional florestal
141115|Gerente de agropecuária|gerente de agropecuaria
141115|Gerente de produção na agropecuária|gerente de producao na agropecuaria
141115|Gerente operacional na agropecuária|gerente operacional na agropecuaria
141120|Administrador de empresas de pesca|administrador de empresas de pesca
141120|Gerente de empresa de pesca|gerente de empresa de pesca
141120|Gerente de frota pesqueira|gerente de frota pesqueira
141205|Banguezeiro - empregador|banguezeiro - empregador
141205|Banguezista - empregador|banguezista - empregador
141205|Cervejeiro - empregador|cervejeiro - empregador
141205|Correeiro - empregador|correeiro - empregador
141205|Correiro - empregador|correiro - empregador
141205|Corrieiro - empregador|corrieiro - empregador
141205|Curtidor - empregador|curtidor - empregador
141205|Gerente de departamento de fabricação|gerente de departamento de fabricacao
141205|Gerente de departamento de produção|gerente de departamento de producao
141205|Gerente de departamento industrial|gerente de departamento industrial
141205|Gerente de fábrica|gerente de fabrica
141205|Gerente de manufatura|gerente de manufatura
141205|Gerente de montagem|gerente de montagem
141205|Gerente de processos|gerente de processos
141205|Gerente de produção|gerente de producao
141205|Gerente de unidade de fabricação|gerente de unidade de fabricacao
141205|Gerente industrial|gerente industrial
141205|Joalheiro - na fabricação - empregador|joalheiro - na fabricacao - empregador
141205|Lombilheiro - empregador|lombilheiro - empregador
141205|Marmorista - exclusive na extração - empregador|marmorista - exclusive na extracao - empregador
141205|Marmorista - na extração - empregador|marmorista - na extracao - empregador
141205|Proprietário de areal - empregador|proprietario de areal - empregador
141205|Proprietário de pedreira - empregador|proprietario de pedreira - empregador
141205|Proprietário de porto de areia - empregador|proprietario de porto de areia - empregador
141205|Proprietário de saibreira - empregador|proprietario de saibreira - empregador
141205|Proprietário de salina - empregador|proprietario de salina - empregador
141205|Salineiro - empregador|salineiro - empregador
141205|Salineiro - na extração - empregador|salineiro - na extracao - empregador
141205|Salineiro (empregador)|salineiro (empregador)
141205|Seleiro - na fabricação - empregador|seleiro - na fabricacao - empregador
141205|Sócio-proprietário - na extração mineral - empregador|socio-proprietario - na extracao mineral - empregador
141205|Sócio-proprietário de areal - empregador|socio-proprietario de areal - empregador
141205|Sócio-proprietário de pedreira - empregador|socio-proprietario de pedreira - empregador
141205|Sócio-proprietário de porto de areia - empregador|socio-proprietario de porto de areia - empregador
141205|Sócio-proprietário de saibreira - empregador|socio-proprietario de saibreira - empregador
141205|Sócio-proprietário de salina - empregador|socio-proprietario de salina - empregador
141205|Talabarteiro - empregador (selas)|talabarteiro - empregador (selas)
141305|Coordenador de obras (construção civil)|coordenador de obras (construcao civil)
141305|Gerente de contratos (construção civil)|gerente de contratos (construcao civil)
141305|Gerente de empresas de construção civil|gerente de empresas de construcao civil
141305|Gerente de obras (construção civil)|gerente de obras (construcao civil)
141405|Adeleiro  (comércio atacadista)|adeleiro  (comercio atacadista)
141405|Alfarrabista|alfarrabista
141405|Alheiro (comércio atacadista)|alheiro (comercio atacadista)
141405|Antiquário (comércio atacadista)|antiquario (comercio atacadista)
141405|Arborário|arborario
141405|Armarinheiro (comércio atacadista)|armarinheiro (comercio atacadista)
141405|Armazenário (comércio atacadista)|armazenario (comercio atacadista)
141405|Armeiro (comércio atacadista)|armeiro (comercio atacadista)
141405|Arrombador - no comércio de gado - empregador|arrombador - no comercio de gado - empregador
141405|Arrombador (comércio de gado)|arrombador (comercio de gado)
141405|Atacadista|atacadista
141405|Boiadeiro - no comércio de gado - empregador|boiadeiro - no comercio de gado - empregador
141405|Boiadeiro (comércio de gado)|boiadeiro (comercio de gado)
141405|Boieiro|boieiro
141405|Comissário de café|comissario de cafe
141405|Comissário de mercadorias|comissario de mercadorias
141405|Distribuidor de fumo|distribuidor de fumo
141405|Distribuidor de produtos químicos|distribuidor de produtos quimicos
141405|Distribuidor de revistas|distribuidor de revistas
141405|Exportador|exportador
141405|Exportador - empregador|exportador - empregador
141405|Grossista|grossista
141405|Importador|importador
141405|Lojista  (comércio atacadista)|lojista  (comercio atacadista)
141405|Madeireiro (comércio atacadista)|madeireiro (comercio atacadista)
141405|Marchante (comércio de gado)|marchante (comercio de gado)
141405|Negociante (comércio atacadista )|negociante (comercio atacadista )
141410|Adegueiro|adegueiro
141410|Adeleiro (comércio varejista)|adeleiro (comercio varejista)
141410|Alfarrabista (comércio varejista)|alfarrabista (comercio varejista)
141410|Alheiro (comércio varejista)|alheiro (comercio varejista)
141410|Alugador (comerciante varejista)|alugador (comerciante varejista)
141410|Antiquário comércio varejista|antiquario comercio varejista
141410|Armarinheiro (comércio varejista)|armarinheiro (comercio varejista)
141410|Armazenário (comércio varejista)|armazenario (comercio varejista)
141410|Armeiro (comércio varejista)|armeiro (comercio varejista)
141410|Arrozeiro (comércio)|arrozeiro (comercio)
141410|Aviador (comércio varejista)|aviador (comercio varejista)
141410|Bacalhoeiro|bacalhoeiro
141410|Baiuqueiro|baiuqueiro
141410|Baleiro (exclusive no comércio ambulante)|baleiro (exclusive no comercio ambulante)
141410|Barraconista|barraconista
141410|Barraqueiro (barracão comercial)|barraqueiro (barracao comercial)
141410|Bauleiro|bauleiro
141410|Bazareiro|bazareiro
141410|Beiradeiro|beiradeiro
141410|Belchior|belchior
141410|Bibliopola|bibliopola
141410|Bodegueiro|bodegueiro
141410|Botequineiro|botequineiro
141410|Bricabraquista|bricabraquista
141410|Bricabraquista - empregador|bricabraquista - empregador
141410|Cacaulista|cacaulista
141410|Caga-sebista|caga-sebista
141410|Cantineiro (comércio varejista)|cantineiro (comercio varejista)
141410|Carniceiro|carniceiro
141410|Carvoeiro - no comércio - empregador|carvoeiro - no comercio - empregador
141410|Carvoeiro (comércio varejista)|carvoeiro (comercio varejista)
141410|Chanfaneiro|chanfaneiro
141410|Chapeleiro (comércio varejista)|chapeleiro (comercio varejista)
141410|Charcuteiro - no comércio - conta própria|charcuteiro - no comercio - conta propria
141410|Charcuteiro (comércio varejista)|charcuteiro (comercio varejista)
141410|Charqueador (comércio varejista)|charqueador (comercio varejista)
141410|Charuteiro - no comércio - empregador|charuteiro - no comercio - empregador
141410|Charuteiro (comércio varejista)|charuteiro (comercio varejista)
141410|Chumbeiro (comércio varejista)|chumbeiro (comercio varejista)
141410|Cigarreiro (comércio varejista)|cigarreiro (comercio varejista)
141410|Comissário de transporte (comércio varejista)|comissario de transporte (comercio varejista)
141410|Cuteleiro  (comércio varejista)|cuteleiro  (comercio varejista)
141410|Diamantário (comércio varejista)|diamantario (comercio varejista)
141410|Doceiro (exclusive no comércio ambulante)|doceiro (exclusive no comercio ambulante)
141410|Dono de lavanderia automática - conta própria|dono de lavanderia automatica - conta propria
141410|Droguista (comércio varejista)|droguista (comercio varejista)
141410|Ervanário (comércio varejista)|ervanario (comercio varejista)
141410|Estancieiro (comércio varejista)|estancieiro (comercio varejista)
141410|Ferrageiro (comércio varejista)|ferrageiro (comercio varejista)
141410|Ferragista (comércio varejista)|ferragista (comercio varejista)
141410|Florista (comércio varejista)|florista (comercio varejista)
141410|Fornecedor|fornecedor
141410|Fruteiro (comércio varejista)|fruteiro (comercio varejista)
141410|Galinheiro (exceto no comércio ambulante)|galinheiro (exceto no comercio ambulante)
141410|Geleiro|geleiro
141410|Gerente de box de mercado público|gerente de box de mercado publico
141410|Gerente de carrocerias (vendas a varejo)|gerente de carrocerias (vendas a varejo)
141410|Gerente de casa de peixe|gerente de casa de peixe
141410|Gerente de editora|gerente de editora
141410|Gerente de farmácia|gerente de farmacia
141410|Gerente de granja|gerente de granja
141410|Herborista (comércio varejista)|herborista (comercio varejista)
141410|Inspetor geral (comércio de mercadorias a varejo)|inspetor geral (comercio de mercadorias a varejo)
141410|Inspetor regional (comércio de mercadorias a varejo)|inspetor regional (comercio de mercadorias a varejo)
141410|Joalheiro (comércio varejista)|joalheiro (comercio varejista)
141410|Lenheiro ( comércio varejista)|lenheiro ( comercio varejista)
141410|Livreiro (comércio varejista)|livreiro (comercio varejista)
141410|Locador de animais para lazer|locador de animais para lazer
141410|Locador de barco para lazer|locador de barco para lazer
141410|Locador de bicicletas para lazer|locador de bicicletas para lazer
141410|Locador de bóia para lazer|locador de boia para lazer
141410|Locador de cadeira de praia|locador de cadeira de praia
141410|Locador de cadeira para festa|locador de cadeira para festa
141410|Locador de caiaque para lazer|locador de caiaque para lazer
141410|Locador de eletrodomésticos|locador de eletrodomesticos
141410|Locador de mesas para festa|locador de mesas para festa
141410|Locador de móveis|locador de moveis
141410|Locador de patins para lazer|locador de patins para lazer
141410|Locador de pedalinho para lazer|locador de pedalinho para lazer
141410|Locador de televisão|locador de televisao
141410|Locador (serviços de diversões)|locador (servicos de diversoes)
141410|Lojista (comércio varejista)|lojista (comercio varejista)
141410|Madeireiro (comércio varejista)|madeireiro (comercio varejista)
141410|Maleiro (comércio varejista )|maleiro (comercio varejista )
141410|Merceeiro|merceeiro
141410|Muladeiro (comércio varejista)|muladeiro (comercio varejista)
141410|Mulandeiro|mulandeiro
141410|Negociante (comércio varejista)|negociante (comercio varejista)
141410|Negociante (comércio varejista - empregador)|negociante (comercio varejista - empregador)
141410|Papeleiro (comércio varejista)|papeleiro (comercio varejista)
141410|Peixeiro (comércio varejista)|peixeiro (comercio varejista)
141410|Peleteiro (comércio varejista)|peleteiro (comercio varejista)
141410|Proprietário de casa funerária (comércio varejista)|proprietario de casa funeraria (comercio varejista)
141410|Proprietário de fliperama|proprietario de fliperama
141410|Proprietário de jogos eletrônicos|proprietario de jogos eletronicos
141410|Proprietário de lavanderia|proprietario de lavanderia
141410|Proprietário de lavanderia automática (comércio varejista)|proprietario de lavanderia automatica (comercio varejista)
141410|Proprietário de loja (comércio varejista)|proprietario de loja (comercio varejista)
141410|Proprietário de pebolim (comércio varejista)|proprietario de pebolim (comercio varejista)
141410|Proprietário de sinuquinha (comércio varejista)|proprietario de sinuquinha (comercio varejista)
141410|Proprietário de tinturaria (comércio varejista)|proprietario de tinturaria (comercio varejista)
141410|Proprietário de totó (comércio varejista)|proprietario de toto (comercio varejista)
141410|Quitandeiro (comércio varejista)|quitandeiro (comercio varejista)
141410|Relojoeiro (comércio varejista)|relojoeiro (comercio varejista)
141410|Retalhista (comércio varejista)|retalhista (comercio varejista)
141410|Sapateiro (comércio varejista)|sapateiro (comercio varejista)
141410|Seleiro (comércio varejista)|seleiro (comercio varejista)
141410|Sócio proprietário (comércio  varejista)|socio proprietario (comercio  varejista)
141410|Sorveteiro (comércio varejista)|sorveteiro (comercio varejista)
141410|Tintureiro lavagem de roupas (comércio varejista)|tintureiro lavagem de roupas (comercio varejista)
141410|Vendeiro (comércio varejista)|vendeiro (comercio varejista)
141410|Vidraceiro (comércio varejista)|vidraceiro (comercio varejista)
141410|Vidraceiro de quadros e molduras (comércio varejista)|vidraceiro de quadros e molduras (comercio varejista)
141415|Administrador no comércio de mercadorias|administrador no comercio de mercadorias
141415|Encarregado de supermercado|encarregado de supermercado
141415|Gerente de balconista|gerente de balconista
141415|Gerente de empresas comerciais|gerente de empresas comerciais
141415|Gerente de magazine|gerente de magazine
141415|Gerente de mercearia|gerente de mercearia
141415|Gerente de papelaria|gerente de papelaria
141415|Gerente de posto de venda|gerente de posto de venda
141415|Gerente de supermercado|gerente de supermercado
141415|Gerente de utilidades (operações comerciais)|gerente de utilidades (operacoes comerciais)
141415|Gerente de varejo|gerente de varejo
141415|Subchefe de loja (operações comerciais)|subchefe de loja (operacoes comerciais)
141415|Subgerente de loja (operações comerciais)|subgerente de loja (operacoes comerciais)
141420|Gerente de serviços de oficina (assistência técnica)|gerente de servicos de oficina (assistencia tecnica)
141420|Gerente de serviços e peças|gerente de servicos e pecas
141420|Proprietário de oficina mecânica|proprietario de oficina mecanica
141420|Subgerente de oficina (assistência técnica)|subgerente de oficina (assistencia tecnica)
141505|Administrador de camping|administrador de camping
141505|Administrador de empresas de hospedagem|administrador de empresas de hospedagem
141505|Administrador (serviço de hospedagem)|administrador (servico de hospedagem)
141505|Dono de hotel - conta própria|dono de hotel - conta propria
141505|Dono de motel - conta própria|dono de motel - conta propria
141505|Gerente de apart hotel|gerente de apart hotel
141505|Gerente de ecoresort|gerente de ecoresort
141505|Gerente de estância|gerente de estancia
141505|Gerente de hotel fazenda|gerente de hotel fazenda
141505|Gerente de hotel residencial|gerente de hotel residencial
141505|Gerente de resort|gerente de resort
141505|Gerente de termas|gerente de termas
141505|Proprietário - nos serviços de alojamento - empregador|proprietario - nos servicos de alojamento - empregador
141505|Proprietário - nos serviços de hospedagem - empregador|proprietario - nos servicos de hospedagem - empregador
141505|Proprietário de hotel - conta própria|proprietario de hotel - conta propria
141505|Proprietário de hotel - empregador|proprietario de hotel - empregador
141505|Proprietário de motel - conta própria|proprietario de motel - conta propria
141505|Sócio proprietário - nos serviços de alojamento - empregador|socio proprietario - nos servicos de alojamento - empregador
141505|Sócio proprietário - nos serviços de hospedagem - empregador|socio proprietario - nos servicos de hospedagem - empregador
141505|Sócio proprietário de hotel - conta própria|socio proprietario de hotel - conta propria
141505|Sócio proprietário de hotel - empregador|socio proprietario de hotel - empregador
141505|Sócio proprietário de motel - conta própria|socio proprietario de motel - conta propria
141505|Sócio proprietário de motel - empregador|socio proprietario de motel - empregador
141505|Subgerente de hotel|subgerente de hotel
141505|Tecnólogo em hotelaria|tecnologo em hotelaria
141510|Administrador de refeitório|administrador de refeitorio
141510|Administrador de restaurante|administrador de restaurante
141510|Assistente de direção de restaurante|assistente de direcao de restaurante
141510|Coordenador de restaurante|coordenador de restaurante
141510|Coordenador de vendas (restaurante)|coordenador de vendas (restaurante)
141510|Gerente de cantina|gerente de cantina
141510|Proprietário - nos serviços de alimentação - empregador|proprietario - nos servicos de alimentacao - empregador
141510|Proprietário de restaurante - empregador|proprietario de restaurante - empregador
141510|Proprietário no serviço de alimentação - conta própria|proprietario no servico de alimentacao - conta propria
141510|Sócio proprietário - no serviço de alimentação - conta própria|socio proprietario - no servico de alimentacao - conta propria
141510|Sócio proprietário - no serviço de alimentação - empregador|socio proprietario - no servico de alimentacao - empregador
141510|Sócio proprietário de restaurante - conta própria|socio proprietario de restaurante - conta propria
141510|Sócio proprietário de restaurante - empregador|socio proprietario de restaurante - empregador
141510|Subgerente de restaurante|subgerente de restaurante
141515|Gerente administrativo de lanchonete|gerente administrativo de lanchonete
141515|Gerente de bar, cantina e restaurante|gerente de bar, cantina e restaurante
141515|Gerente de bar e lanchonete|gerente de bar e lanchonete
141515|Gerente de salão de café|gerente de salao de cafe
141515|Proprietário de bar - empregador|proprietario de bar - empregador
141515|Proprietário de bar, lanchonete, restaurante - conta própria|proprietario de bar, lanchonete, restaurante - conta propria
141515|Proprietário de lanchonete - empregador|proprietario de lanchonete - empregador
141515|Sócio proprietário de bar - empregador|socio proprietario de bar - empregador
141515|Sócio proprietário de bar, lanchonete - conta própria|socio proprietario de bar, lanchonete - conta propria
141515|Sócio proprietário de lanchonete - empregador|socio proprietario de lanchonete - empregador
141515|Taverneiro|taverneiro
141520|Dono de pensão - conta própria|dono de pensao - conta propria
141520|Dono de pensão - empregador|dono de pensao - empregador
141520|Estalageiro|estalageiro
141520|Gerente de  albergue|gerente de  albergue
141520|Gerente de pensionato|gerente de pensionato
141520|Gerente de pousada|gerente de pousada
141520|Proprietário de pensão - conta própria|proprietario de pensao - conta propria
141520|Proprietário de pensão - empregador|proprietario de pensao - empregador
141520|Sócio proprietário de pensão|socio proprietario de pensao
141520|Sócio proprietário de pensão - conta própria|socio proprietario de pensao - conta propria
141525|Gerente de operações de turismo|gerente de operacoes de turismo
141525|Gerente de produtos de turismo|gerente de produtos de turismo
141525|Gerente operacional de turismo|gerente operacional de turismo
141525|Tecnólogo em gestão de turismo|tecnologo em gestao de turismo
141605|Agente de navio - no transporte marítimo|agente de navio - no transporte maritimo
141605|Encarregado de operação de porto|encarregado de operacao de porto
141605|Gerente de frota|gerente de frota
141605|Gerente de operações e transportes|gerente de operacoes e transportes
141605|Gerente de tráfego|gerente de trafego
141605|Gerente de transportes|gerente de transportes
141605|Gerente técnico operacional de transporte|gerente tecnico operacional de transporte
141605|Subgerente nos transportes|subgerente nos transportes
141610|Gerente de assistência técnica nas operações de correios e telecomunicações|gerente de assistencia tecnica nas operacoes de correios e telecomunicacoes
141610|Gerente de correio expresso - internacional|gerente de correio expresso - internacional
141610|Gerente de encomendas nas operações de correios e telecomunicações|gerente de encomendas nas operacoes de correios e telecomunicacoes
141610|Gerente de operações e manutenção nos sistemas de correios e telecomunicações|gerente de operacoes e manutencao nos sistemas de correios e telecomunicacoes
141610|Gerente de rede nas operações de correios e telecomunicações|gerente de rede nas operacoes de correios e telecomunicacoes
141610|Gerente de serviços operacionais de correios e telecomunicações|gerente de servicos operacionais de correios e telecomunicacoes
141610|Gerente de suporte operacional de correios e telecomunicações|gerente de suporte operacional de correios e telecomunicacoes
141610|Gerente técnico nas operações de correios e telecomunicações|gerente tecnico nas operacoes de correios e telecomunicacoes
141615|Gerente de armazém|gerente de armazem
141615|Gerente de depósito|gerente de deposito
141615|Gerente de distribuição de mercadorias|gerente de distribuicao de mercadorias
141615|Gerente de movimentação de materiais|gerente de movimentacao de materiais
141615|Gerente de recebimento e expedição de materiais|gerente de recebimento e expedicao de materiais
141715|Administrador de carteiras de câmbio e comércio exterior|administrador de carteiras de cambio e comercio exterior
141715|Gerente de administração de carteiras de câmbio e comércio exterior|gerente de administracao de carteiras de cambio e comercio exterior
141720|Administrador de carteiras de crédito e cobrança|administrador de carteiras de credito e cobranca
141720|Gerente de administração de carteiras de crédito e cobrança|gerente de administracao de carteiras de credito e cobranca
141725|Administrador de carteiras de crédito imobiliário|administrador de carteiras de credito imobiliario
141725|Gerente de administração de carteira de crédito imobiliário|gerente de administracao de carteira de credito imobiliario
141805|Gerente de aeródromo|gerente de aerodromo
141810|Gerente de aeroportos|gerente de aeroportos
141810|Gerente de atendimento a passageiros|gerente de atendimento a passageiros
141810|Gerente de aviação executiva|gerente de aviacao executiva
141810|Gerente de rampa|gerente de rampa
141810|Gerente de táxi aéreo|gerente de taxi aereo
141810|Gerente operacional|gerente operacional
141810|Gerente regional de aeroportos|gerente regional de aeroportos
141820|Gerente de cargas|gerente de cargas
141820|Gerente de tráfego de cargas|gerente de trafego de cargas
141820|Gerente operacional de cargas|gerente operacional de cargas
141820|Gerente regional de cargas|gerente regional de cargas
141825|Gerente avsec (segurança da aviação civil)|gerente avsec (seguranca da aviacao civil)
141825|Gerente de security|gerente de security
141825|Gerente de segurança e resposta à emergência|gerente de seguranca e resposta a emergencia
141830|Gerente de investigação|gerente de investigacao
141830|Gerente de prevenção|gerente de prevencao
141830|Gerente de safety|gerente de safety
141830|Gerente de sistema de gerenciamento de segurança operacional (sgso)|gerente de sistema de gerenciamento de seguranca operacional (sgso)
142105|Gerente administrativo e financeiro|gerente administrativo e financeiro
142105|Gerente de sistemas administrativos e finanças|gerente de sistemas administrativos e financas
142105|Gerente de sistemas e métodos administrativos|gerente de sistemas e metodos administrativos
142110|Gerente de riscos e seguros|gerente de riscos e seguros
142110|Gerente de seguros|gerente de seguros
142110|Gestor de riscos|gestor de riscos
142115|Gerente de administração financeira|gerente de administracao financeira
142115|Gerente de finanças|gerente de financas
142115|Gerente de operações financeiras|gerente de operacoes financeiras
142115|Tecnólogo em gestão financeira|tecnologo em gestao financeira
142120|Tecnólogo em gestão de cooperativas|tecnologo em gestao de cooperativas
142120|Tecnólogo em gestão pública|tecnologo em gestao publica
142125|Analista de integridade (compliance)|analista de integridade (compliance)
142125|Assistente de compliance|assistente de compliance
142125|Especialista em compliance|especialista em compliance
142130|Analista de gerenciamento de riscos|analista de gerenciamento de riscos
142130|Analista de riscos corporativos|analista de riscos corporativos
142130|Analista de riscos e controles internos|analista de riscos e controles internos
142135|Encarregado de proteção de dados pessoais|encarregado de protecao de dados pessoais
142140|Gerente de infraestrutura (facility management)|gerente de infraestrutura (facility management)
142140|Gerente de propriedade (facility management)|gerente de propriedade (facility management)
142140|Gerente de workplace (facility management)|gerente de workplace (facility management)
142205|Coordenador de rh|coordenador de rh
142205|Gerente de planejamento de salários e benefícios|gerente de planejamento de salarios e beneficios
142205|Gerente de relações de recursos humanos|gerente de relacoes de recursos humanos
142205|Gerente de relações humanas|gerente de relacoes humanas
142205|Gerente de relações industriais|gerente de relacoes industriais
142210|Administrador de pessoal|administrador de pessoal
142210|Coordenador de administração de pessoal|coordenador de administracao de pessoal
142210|Gerente de administração de pessoal|gerente de administracao de pessoal
142210|Gerente de divisão de pessoal|gerente de divisao de pessoal
142210|Gerente de setor de pessoal|gerente de setor de pessoal
142210|Gerente de sistemas administrativos de pessoal|gerente de sistemas administrativos de pessoal
142305|Gerente de divisão comercial|gerente de divisao comercial
142305|Gerente de exportação e importação|gerente de exportacao e importacao
142305|Gerente técnico comercial|gerente tecnico comercial
142310|Gerente de assuntos corporativos|gerente de assuntos corporativos
142310|Gerente de comunicação corporativa|gerente de comunicacao corporativa
142310|Gerente de comunicação social|gerente de comunicacao social
142310|Gerente de relações corporativas|gerente de relacoes corporativas
142310|Gerente de relações institucionais|gerente de relacoes institucionais
142315|Gerente de coordenação de marketing|gerente de coordenacao de marketing
142315|Gerente de departamento de marketing|gerente de departamento de marketing
142315|Gerente de divisão de marketing|gerente de divisao de marketing
142315|Gerente de marketing e vendas|gerente de marketing e vendas
142315|Gerente de produtos|gerente de produtos
142320|Gerente de área de vendas|gerente de area de vendas
142320|Gerente de departamento de vendas|gerente de departamento de vendas
142320|Gerente de exportação|gerente de exportacao
142320|Gerente de mercado|gerente de mercado
142320|Gerente distrital de vendas|gerente distrital de vendas
142320|Gerente geral de vendas|gerente geral de vendas
142320|Gerente nacional de vendas|gerente nacional de vendas
142320|Gerente regional de vendas|gerente regional de vendas
142325|Especialista de comunicação em relações públicas|especialista de comunicacao em relacoes publicas
142325|Gerente de relações públicas|gerente de relacoes publicas
142325|Profissional de relações públicas|profissional de relacoes publicas
142335|Analista de estudos de mercado|analista de estudos de mercado
142335|Analista de informações de mercado|analista de informacoes de mercado
142335|Analista de inteligência de mercado|analista de inteligencia de mercado
142335|Analista de marketing|analista de marketing
142335|Analista de mercado|analista de mercado
142340|Ombudsman|ombudsman
142345|Defensor de interesses ( relações governamentais)|defensor de interesses ( relacoes governamentais)
142345|Profissionais de relações institucionais|profissionais de relacoes institucionais
142345|Profissional de relações governamentais|profissional de relacoes governamentais
142350|Analista de mercado internacional|analista de mercado internacional
142350|Analista de relações internacionais|analista de relacoes internacionais
142350|Gestor de negócios internacionais|gestor de negocios internacionais
142350|Gestor de projetos internacionais|gestor de projetos internacionais
142350|Internacionalista|internacionalista
142360|Analista de implementação de sucesso do cliente|analista de implementacao de sucesso do cliente
142360|Analista de sucesso do cliente de operações|analista de sucesso do cliente de operacoes
142360|Customer marketing|customer marketing
142360|Customer success manager|customer success manager
142360|Especialista de sucesso do cliente|especialista de sucesso do cliente
142365|Especialista de experiência do cliente|especialista de experiencia do cliente
142405|Administrador de compras|administrador de compras
142405|Coordenador de compras|coordenador de compras
142405|Gerente de materiais|gerente de materiais
142405|Gerente de planejamento de compras|gerente de planejamento de compras
142405|Gerente geral de compras|gerente geral de compras
142405|Gerente nacional de compras|gerente nacional de compras
142415|Administrador de materiais|administrador de materiais
142505|Coordenador de infraestrutura de tecnologia da informação|coordenador de infraestrutura de tecnologia da informacao
142505|Gerente de rede|gerente de rede
142505|Gerente executivo de infraestrutura de ti|gerente executivo de infraestrutura de ti
142510|Coordenador de desenvolvimento de ti|coordenador de desenvolvimento de ti
142510|Gerente de desenvolvimento de aplicações|gerente de desenvolvimento de aplicacoes
142510|Gerente de desenvolvimento de software|gerente de desenvolvimento de software
142510|Gerente de desenvolvimento de ti|gerente de desenvolvimento de ti
142510|Gerente de sistemas de ti|gerente de sistemas de ti
142515|Coordenador de operação de tecnologia da informação|coordenador de operacao de tecnologia da informacao
142515|Gerente de produção de tecnologia da informação|gerente de producao de tecnologia da informacao
142520|Coordenador de projetos de tecnologia da informação|coordenador de projetos de tecnologia da informacao
142520|Gerente de programas de ti|gerente de programas de ti
142525|Coordenador de segurança da informação|coordenador de seguranca da informacao
142525|Gerente de cyber security|gerente de cyber security
142530|Coordenador de suporte técnico de tecnologia da informação|coordenador de suporte tecnico de tecnologia da informacao
142530|Gerente de atendimento de tecnologia da informação|gerente de atendimento de tecnologia da informacao
142530|Gerente de operação de suporte de tecnologia da informação|gerente de operacao de suporte de tecnologia da informacao
142535|Tecnólogo em gestão de sistema de informação|tecnologo em gestao de sistema de informacao
142605|Chefe de desenvolvimento de novos produtos|chefe de desenvolvimento de novos produtos
142605|Gerente de desenvolvimento (tecnologia)|gerente de desenvolvimento (tecnologia)
142605|Gerente de divisão de desenvolvimento de novos produtos|gerente de divisao de desenvolvimento de novos produtos
142605|Gerente de estudos e projetos|gerente de estudos e projetos
142605|Gerente de pesquisa (tecnologia)|gerente de pesquisa (tecnologia)
142605|Gerente de pesquisas técnicas|gerente de pesquisas tecnicas
142605|Gerente de pesquisas tecnológicas|gerente de pesquisas tecnologicas
142605|Gerente de planejamento e novos projetos|gerente de planejamento e novos projetos
142605|Gerente de projeto de pesquisa|gerente de projeto de pesquisa
142610|Blender (cigarros)|blender (cigarros)
142610|Flavourist (cigarros)|flavourist (cigarros)
142610|Flavourista (cigarros)|flavourista (cigarros)
142705|Coordenador de projetos de manutenção|coordenador de projetos de manutencao
142705|Coordenador de serviços de manutenção|coordenador de servicos de manutencao
142705|Gerente de planejamento e manutenção|gerente de planejamento e manutencao
142705|Gerente de serviço de manutenção|gerente de servico de manutencao
142705|Gestor de manutenção|gestor de manutencao
142710|Tecnólogo em saúde|tecnologo em saude
201210|Metrologista de calibrações|metrologista de calibracoes
201210|Responsável técnico da calibração metrológica|responsavel tecnico da calibracao metrologica
201215|Inspetor de ensaios metrológicos|inspetor de ensaios metrologicos
201215|Metrologista de ensaios|metrologista de ensaios
201215|Operador de ensaios na metrologia|operador de ensaios na metrologia
201215|Responsável técnico de ensaios metrológicos|responsavel tecnico de ensaios metrologicos
202110|Engenheiro de automação|engenheiro de automacao
202110|Engenheiro de controle|engenheiro de controle
202110|Engenheiro de instrumentação|engenheiro de instrumentacao
202115|Tecnólogo em mecatrônica industrial|tecnologo em mecatronica industrial
202120|Tecnólogo em automação|tecnologo em automacao
203005|Ecologista|ecologista
203005|Ecólogo|ecologo
203010|Carcinologista|carcinologista
203010|Entomologista|entomologista
203010|Entomólogo|entomologo
203010|Ofiologista|ofiologista
203010|Ornitólogo|ornitologo
203010|Zoologista|zoologista
203010|Zoólogo|zoologo
203015|Bacteriologista|bacteriologista
203020|Fisiologista (exceto médico)|fisiologista (exceto medico)
203025|Agrostólogo|agrostologo
203025|Botânico|botanico
203025|Fenologista|fenologista
203025|Ficologista|ficologista
203025|Pesquisador botânico|pesquisador botanico
203205|Engenheiro pesquisador (engenharia civil)|engenheiro pesquisador (engenharia civil)
203205|Especialista em engenharia civil|especialista em engenharia civil
203210|Engenheiro pesquisador (outras áreas da engenharia)|engenheiro pesquisador (outras areas da engenharia)
203210|Especialista em engenharia e tecnologia (outras áreas)|especialista em engenharia e tecnologia (outras areas)
203215|Engenheiro pesquisador (engenharia elétrica e eletrônica)|engenheiro pesquisador (engenharia eletrica e eletronica)
203215|Engenheiro pesquisador (telecomunicações)|engenheiro pesquisador (telecomunicacoes)
203215|Especialista em engenharia elétrica e eletrônica|especialista em engenharia eletrica e eletronica
203220|Engenheiro pesquisador (engenharia mecânica)|engenheiro pesquisador (engenharia mecanica)
203220|Especialista em engenharia mecânica|especialista em engenharia mecanica
203225|Engenheiro pesquisador (materiais)|engenheiro pesquisador (materiais)
203225|Engenheiro pesquisador (metalurgia)|engenheiro pesquisador (metalurgia)
203225|Engenheiro pesquisador (minas)|engenheiro pesquisador (minas)
203225|Especialista em engenharia metalúrgica, de minas e de materiais|especialista em engenharia metalurgica, de minas e de materiais
203230|Engenheiro pesquisador (engenharia química)|engenheiro pesquisador (engenharia quimica)
203230|Especialista em engenharia química|especialista em engenharia quimica
203405|Pesquisador das ciências agrárias|pesquisador das ciencias agrarias
203520|Historiador|historiador
204105|Perito criminal federal|perito criminal federal
204105|Perito criminalístico|perito criminalistico
204105|Perito criminalístico engenheiro|perito criminalistico engenheiro
204105|Perito criminalístico químico|perito criminalistico quimico
204105|Perito oficial|perito oficial
204110|Perito forense de formação específica|perito forense de formacao especifica
204110|Perito judicial acidentólogo, de trânsito e transporte|perito judicial acidentologo, de transito e transporte
204110|Perito judicial áudio e imagem|perito judicial audio e imagem
204110|Perito judicial avaliador de bens móveis|perito judicial avaliador de bens moveis
204110|Perito judicial contábil|perito judicial contabil
204110|Perito judicial de formação específica|perito judicial de formacao especifica
204110|Perito judicial de incêndio automotivo e explosões|perito judicial de incendio automotivo e explosoes
204110|Perito judicial de incêndio de edificações|perito judicial de incendio de edificacoes
204110|Perito judicial em engenharia|perito judicial em engenharia
204110|Perito judicial grafotécnico documentoscópico|perito judicial grafotecnico documentoscopico
204110|Perito judicial técnico industrial|perito judicial tecnico industrial
211110|Analista de pesquisa operacional|analista de pesquisa operacional
211120|Matemático computacional|matematico computacional
211120|Matemático industrial|matematico industrial
211205|Amostrista|amostrista
211205|Estatístico - analista|estatistico - analista
211210|Bioestatístico|bioestatistico
211210|Demógrafo|demografo
211210|Econometrista|econometrista
212205|Engenheiro de sistemas computacionais - aplicativos|engenheiro de sistemas computacionais - aplicativos
212205|Engenheiro de softwares computacionais|engenheiro de softwares computacionais
212210|Engenheiro de hardware computacional|engenheiro de hardware computacional
212210|Engenheiro de sistemas computacionais - equipamentos|engenheiro de sistemas computacionais - equipamentos
212215|Engenheiro de software computacional básico|engenheiro de software computacional basico
212215|Engenheiro de suporte de sistemas operacionais em computação|engenheiro de suporte de sistemas operacionais em computacao
212305|Dba|dba
212305|Tecnólogo em banco de dados|tecnologo em banco de dados
212310|Administrador de rede e de sistemas computacionais|administrador de rede e de sistemas computacionais
212310|Administrador de sistema operacional de rede|administrador de sistema operacional de rede
212310|Tecnólogo em redes de computadores|tecnologo em redes de computadores
212315|Administrador de sistemas computacionais|administrador de sistemas computacionais
212315|Administrador de sistemas operacionais de rede|administrador de sistemas operacionais de rede
212315|Analista de aplicativo básico (software)|analista de aplicativo basico (software)
212320|Analista em segurança da informação|analista em seguranca da informacao
212320|Especialista em segurança da informação|especialista em seguranca da informacao
212320|Tecnólogo em segurança da informação|tecnologo em seguranca da informacao
212405|Analista de desenvolvimento de software|analista de desenvolvimento de software
212405|Analista de sistemas|analista de sistemas
212405|Analista de sistemas web|analista de sistemas web
212405|Consultor de sistemas de ti|consultor de sistemas de ti
212405|Consultor de tecnologia da informação|consultor de tecnologia da informacao
212405|Desenvolvedor de ti|desenvolvedor de ti
212405|Especialista de sistemas de ti|especialista de sistemas de ti
212405|Tecnólogo em análise de desenvolvimento de sistema|tecnologo em analise de desenvolvimento de sistema
212405|Tecnólogo em processamento de dados|tecnologo em processamento de dados
212405|Tecnólogo em sistemas para internet|tecnologo em sistemas para internet
212410|Analista de comunicação (teleprocessamento)|analista de comunicacao (teleprocessamento)
212410|Analista de infraestrutura|analista de infraestrutura
212410|Analista de rede|analista de rede
212410|Analista de telecomunicação|analista de telecomunicacao
212420|Analista de suporte|analista de suporte
212420|Analista de suporte de banco de dados|analista de suporte de banco de dados
212420|Analista de suporte de sistema|analista de suporte de sistema
212420|Analista de suporte técnico|analista de suporte tecnico
212425|Arquiteto de sistemas de ti|arquiteto de sistemas de ti
212430|Analista de qualidade de ti|analista de qualidade de ti
212430|Analista de testes automatizados de ti|analista de testes automatizados de ti
213120|Cosmológo|cosmologo
213140|Físico (estado sólido)|fisico (estado solido)
213150|Físico hospitalar|fisico hospitalar
213150|Físico médico|fisico medico
213155|Físico nuclear|fisico nuclear
213205|Químico agrícola|quimico agricola
213205|Químico ambiental|quimico ambiental
213205|Químico analista|quimico analista
213205|Químico bromatologista|quimico bromatologista
213205|Químico consultor|quimico consultor
213205|Químico de alimentos|quimico de alimentos
213205|Químico de controle de qualidade|quimico de controle de qualidade
213205|Químico de embalagens|quimico de embalagens
213205|Químico de laboratório|quimico de laboratorio
213205|Químico de laboratório de controle|quimico de laboratorio de controle
213205|Químico de laboratórios de solos|quimico de laboratorios de solos
213205|Químico (fisico-química)|quimico (fisico-quimica)
213205|Químico (química inorgânica)|quimico (quimica inorganica)
213205|Químico (química nuclear)|quimico (quimica nuclear)
213205|Químico (química orgânica)|quimico (quimica organica)
213205|Químico (tratamento de água)|quimico (tratamento de agua)
213210|Químico cosmetólogo|quimico cosmetologo
213210|Químico de cerâmica|quimico de ceramica
213210|Químico de curtume|quimico de curtume
213210|Químico de petróleo|quimico de petroleo
213210|Químico de polímeros|quimico de polimeros
213210|Químico de processos|quimico de processos
213210|Químico de produtos naturais|quimico de produtos naturais
213210|Químico galvanoplasta|quimico galvanoplasta
213210|Químico perfumista|quimico perfumista
213210|Químico (produtos aromáticos)|quimico (produtos aromaticos)
213210|Químico têxtil|quimico textil
213215|Tecnólogo em processos químicos industriais|tecnologo em processos quimicos industriais
213440|Oceanólogo|oceanologo
214005|Engenheiro de meio ambiente|engenheiro de meio ambiente
214010|Tecnólogo em gestão ambiental|tecnologo em gestao ambiental
214010|Tecnólogo em processos ambientais|tecnologo em processos ambientais
214010|Tecnólogo em saneamento ambiental|tecnologo em saneamento ambiental
214105|Engenheiro arquiteto|engenheiro arquiteto
214105|Projetista (arquiteto)|projetista (arquiteto)
214115|Arquiteto de restauro|arquiteto de restauro
214115|Arquiteto restaurador|arquiteto restaurador
214115|Conservador de edificações|conservador de edificacoes
214115|Restaurador de edificações|restaurador de edificacoes
214120|Arquiteto da paisagem|arquiteto da paisagem
214120|Paisagista|paisagista
214125|Planejador urbano|planejador urbano
214205|Engenheiro de planejamento|engenheiro de planejamento
214205|Engenheiro orçamentista|engenheiro orcamentista
214205|Engenheiro projetista|engenheiro projetista
214230|Engenheiro civil (fundações)|engenheiro civil (fundacoes)
214230|Engenheiro civil (mecânica de solos)|engenheiro civil (mecanica de solos)
214255|Engenheiro civil (terraplanagem)|engenheiro civil (terraplanagem)
214255|Engenheiro de estradas|engenheiro de estradas
214255|Engenheiro de geometria|engenheiro de geometria
214255|Engenheiro de pavimentação|engenheiro de pavimentacao
214255|Engenheiro de projetos viários|engenheiro de projetos viarios
214255|Engenheiro de segurança viária|engenheiro de seguranca viaria
214255|Engenheiro de sinalização viária|engenheiro de sinalizacao viaria
214255|Engenheiro rodoviário|engenheiro rodoviario
214260|Engenheiro civil (obras sanitárias)|engenheiro civil (obras sanitarias)
214260|Engenheiro sanitarista|engenheiro sanitarista
214270|Analista de projetos viários|analista de projetos viarios
214270|Analista de tráfego|analista de trafego
214270|Analista de transportes e trânsito|analista de transportes e transito
214270|Engenheiro de logística|engenheiro de logistica
214270|Engenheiro de operação (transporte rodoviário)|engenheiro de operacao (transporte rodoviario)
214270|Engenheiro de tráfego|engenheiro de trafego
214270|Engenheiro de trânsito|engenheiro de transito
214270|Engenheiro de transportes|engenheiro de transportes
214280|Tecnólogo em construção civil-modalidade edifícios|tecnologo em construcao civil-modalidade edificios
214280|Tecnólogo em construção civil-modalidade hidráulica|tecnologo em construcao civil-modalidade hidraulica
214280|Tecnólogo em construção civil-modalidade movimento de terra e pavimentação|tecnologo em construcao civil-modalidade movimento de terra e pavimentacao
214280|Tecnólogo em construção de edifícios|tecnologo em construcao de edificios
214280|Tecnólogo em controle de obras|tecnologo em controle de obras
214280|Tecnólogo em edificações|tecnologo em edificacoes
214280|Tecnólogo em estradas|tecnologo em estradas
214305|Engenheiro elétrico|engenheiro eletrico
214305|Engenheiro eletrotécnico|engenheiro eletrotecnico
214315|Engenheiro de manutenção elétrica|engenheiro de manutencao eletrica
214320|Engenheiro de projetos elétricos|engenheiro de projetos eletricos
214320|Engenheiro eletrotécnico de projetos|engenheiro eletrotecnico de projetos
214325|Engenheiro de manutenção eletrônica|engenheiro de manutencao eletronica
214330|Engenheiro de projetos eletrônicos|engenheiro de projetos eletronicos
214340|Engenheiro de comutação|engenheiro de comutacao
214340|Engenheiro de tráfego telefônico|engenheiro de trafego telefonico
214340|Engenheiro de transmissão|engenheiro de transmissao
214345|Engenheiro de projetos de telecomunicações|engenheiro de projetos de telecomunicacoes
214345|Engenheiro de projetos de telefonia|engenheiro de projetos de telefonia
214350|Engenheiro de sistemas de comunicação|engenheiro de sistemas de comunicacao
214360|Engenheiro operacional em eletrotécnica|engenheiro operacional em eletrotecnica
214370|Especialista em telecomunicações (tecnólogo )|especialista em telecomunicacoes (tecnologo )
214370|Tecnólogo em redes de telecomunicações|tecnologo em redes de telecomunicacoes
214370|Tecnólogo em sistemas de telecomunicações|tecnologo em sistemas de telecomunicacoes
214370|Tecnólogo em telemática|tecnologo em telematica
214380|Engenheiro clínico|engenheiro clinico
214410|Engenheiro de manutenção de veículos|engenheiro de manutencao de veiculos
214410|Engenheiro mecânico automobilístico|engenheiro mecanico automobilistico
214410|Engenheiro mecânico (veículos automotores)|engenheiro mecanico (veiculos automotores)
214415|Engenheiro mecânico nuclear|engenheiro mecanico nuclear
214430|Engenheiro de construção naval|engenheiro de construcao naval
214435|Tecnólogo em mecânica|tecnologo em mecanica
214435|Tecnólogo em processo de produção|tecnologo em processo de producao
214435|Tecnólogo em processo de produção e usinagem|tecnologo em processo de producao e usinagem
214505|Engenheiro de desenvolvimento químico|engenheiro de desenvolvimento quimico
214505|Engenheiro de processamento químico|engenheiro de processamento quimico
214505|Engenheiro químico (alimentos e bebidas)|engenheiro quimico (alimentos e bebidas)
214505|Engenheiro químico (controle de qualidade)|engenheiro quimico (controle de qualidade)
214505|Engenheiro químico de processos|engenheiro quimico de processos
214505|Engenheiro químico de produção|engenheiro quimico de producao
214505|Engenheiro químico de projetos|engenheiro quimico de projetos
214505|Engenheiro químico, em geral|engenheiro quimico, em geral
214510|Engenheiro de indústria química|engenheiro de industria quimica
214510|Engenheiro químico (ácidos e bases)|engenheiro quimico (acidos e bases)
214510|Engenheiro químico (açúcar e álcool)|engenheiro quimico (acucar e alcool)
214510|Engenheiro químico (cosméticos, higiene e limpeza)|engenheiro quimico (cosmeticos, higiene e limpeza)
214510|Engenheiro químico (fertilizantes)|engenheiro quimico (fertilizantes)
214510|Engenheiro químico (produtos farmacêuticos)|engenheiro quimico (produtos farmaceuticos)
214510|Engenheiro químico (solventes e tintas)|engenheiro quimico (solventes e tintas)
214515|Engenheiro químico (cerâmica)|engenheiro quimico (ceramica)
214515|Engenheiro químico (cimento)|engenheiro quimico (cimento)
214515|Engenheiro químico (metalurgia)|engenheiro quimico (metalurgia)
214515|Engenheiro químico (mineração)|engenheiro quimico (mineracao)
214515|Engenheiro químico (siderurgia)|engenheiro quimico (siderurgia)
214520|Engenheiro de celulose e papel|engenheiro de celulose e papel
214520|Engenheiro químico (celulose)|engenheiro quimico (celulose)
214520|Engenheiro químico (papel)|engenheiro quimico (papel)
214525|Engenheiro químico (borracha)|engenheiro quimico (borracha)
214525|Engenheiro químico (derivados de petróleo)|engenheiro quimico (derivados de petroleo)
214525|Engenheiro químico (petróleo e petroquímica)|engenheiro quimico (petroleo e petroquimica)
214525|Engenheiro químico (plástico)|engenheiro quimico (plastico)
214530|Engenheiro químico (meio ambiente)|engenheiro quimico (meio ambiente)
214530|Engenheiro químico (utilidades)|engenheiro quimico (utilidades)
214535|Tecnólogo em produção de açúcar e álcool|tecnologo em producao de acucar e alcool
214540|Engenheiro químico (têxtil)|engenheiro quimico (textil)
214605|Engenheiro de materiais (cerâmica)|engenheiro de materiais (ceramica)
214605|Engenheiro de materiais (metais)|engenheiro de materiais (metais)
214605|Engenheiro de materiais (polímeros)|engenheiro de materiais (polimeros)
214610|Engenheiro metalúrgico|engenheiro metalurgico
214610|Engenheiro metalúrgico (produção de metais)|engenheiro metalurgico (producao de metais)
214610|Engenheiro metalúrgico (siderurgia)|engenheiro metalurgico (siderurgia)
214610|Engenheiro metalúrgico (tratamento de metais)|engenheiro metalurgico (tratamento de metais)
214615|Tecnólogo em processos metalúrgicos|tecnologo em processos metalurgicos
214615|Tecnólogo metalurgista|tecnologo metalurgista
214705|Consultor técnico - na extração mineral|consultor tecnico - na extracao mineral
214705|Engenheiro de beneficiamento de minério|engenheiro de beneficiamento de minerio
214705|Engenheiro de concentração|engenheiro de concentracao
214705|Engenheiro de minas (carvão)|engenheiro de minas (carvao)
214705|Engenheiro de mineração|engenheiro de mineracao
214705|Engenheiro de tratamento de minério|engenheiro de tratamento de minerio
214705|Engenheiro tuneleiro|engenheiro tuneleiro
214705|Prospector de jazidas|prospector de jazidas
214705|Prospector de minerais|prospector de minerais
214705|Prospector de minérios|prospector de minerios
214805|Agrimensor|agrimensor
214810|Cartógrafo|cartografo
214810|Engenheiro de geodésia e topografia|engenheiro de geodesia e topografia
214905|Engenheiro de organização e métodos|engenheiro de organizacao e metodos
214905|Engenheiro de organização industrial|engenheiro de organizacao industrial
214905|Engenheiro de planejamento industrial|engenheiro de planejamento industrial
214905|Engenheiro de processamento|engenheiro de processamento
214905|Engenheiro de processos|engenheiro de processos
214910|Engenheiro de qualidade|engenheiro de qualidade
214910|Especialista em controle de qualidade e planejamento|especialista em controle de qualidade e planejamento
214910|Planejador de controle de qualidade|planejador de controle de qualidade
214915|Engenheiro de segurança industrial|engenheiro de seguranca industrial
214925|Engenheiro de análise de trabalho|engenheiro de analise de trabalho
214930|Tecnólogo em gestão dos processos produtivos do vestuário|tecnologo em gestao dos processos produtivos do vestuario
214930|Tecnólogo em produção de vestuário|tecnologo em producao de vestuario
214930|Tecnólogo em produção gráfica|tecnologo em producao grafica
214930|Tecnólogo em produção joalheira|tecnologo em producao joalheira
214930|Tecnólogo em produção moveleira|tecnologo em producao moveleira
214930|Tecnólogo gráfico|tecnologo grafico
214940|Higienista industrial|higienista industrial
215115|Capitão de cabotagem (comandante)|capitao de cabotagem (comandante)
215115|Capitão de longo curso (comandante)|capitao de longo curso (comandante)
215115|Primeiro oficial de náutica (comandante)|primeiro oficial de nautica (comandante)
215115|Segundo oficial de náutica (comandante)|segundo oficial de nautica (comandante)
215125|Capitão de cabotagem (imediato)|capitao de cabotagem (imediato)
215125|Capitão de longo curso (imediato)|capitao de longo curso (imediato)
215125|Primeiro oficial de náutica (imediato)|primeiro oficial de nautica (imediato)
215125|Segundo oficial de náutica (imediato)|segundo oficial de nautica (imediato)
215140|Capitão de cabotagem|capitao de cabotagem
215140|Capitão de longo curso|capitao de longo curso
215140|Primeiro oficial de náutica|primeiro oficial de nautica
215140|Segundo oficial de náutica|segundo oficial de nautica
215205|Chefe de máquinas da marinha mercante|chefe de maquinas da marinha mercante
215210|Subchefe de máquinas da marinha mercante|subchefe de maquinas da marinha mercante
215220|Inspetor de manutenção de máquinas aquaviárias|inspetor de manutencao de maquinas aquaviarias
215305|Aviador civil|aviador civil
215305|Piloto de avião|piloto de aviao
215305|Piloto de helicóptero|piloto de helicoptero
215305|Piloto de linha aérea regular|piloto de linha aerea regular
215310|Piloto de provas|piloto de provas
215315|Instrutor de pilotagem (aviação)|instrutor de pilotagem (aviacao)
215315|Instrutor de pilotagem de aviões|instrutor de pilotagem de avioes
215315|Instrutor de pilotagem de helicópteros|instrutor de pilotagem de helicopteros
221105|Biologista|biologista
221105|Citologista|citologista
221105|Hidrobiologista|hidrobiologista
221105|Histologista|histologista
221105|Microbiologista|microbiologista
222105|Engenheiro de irrigação e drenagem|engenheiro de irrigacao e drenagem
222105|Engenheiro especialista em construções rurais|engenheiro especialista em construcoes rurais
222105|Engenheiro especialista em construções rurais e ambiência|engenheiro especialista em construcoes rurais e ambiencia
222105|Engenheiro especialista em mecanização agrícola|engenheiro especialista em mecanizacao agricola
222105|Engenheiro especialista em secagem e armazenagem de grãos|engenheiro especialista em secagem e armazenagem de graos
222105|Tecnólogo de engenharia rural|tecnologo de engenharia rural
222110|Agrônomo|agronomo
222110|Engenheiro agrônomo (agricultura)|engenheiro agronomo (agricultura)
222110|Engenheiro agrônomo (solos)|engenheiro agronomo (solos)
222110|Engenheiro horticultor|engenheiro horticultor
222115|Consultor técnico em aqüicultura|consultor tecnico em aquicultura
222115|Consultor técnico em pesca|consultor tecnico em pesca
222115|Engenheiro aqüicultor|engenheiro aquicultor
222115|Engenheiro especialista em tecnologia de pesca|engenheiro especialista em tecnologia de pesca
222115|Engenheiro especialista em tecnologia de pescado|engenheiro especialista em tecnologia de pescado
222120|Consultor técnico em exploração vegetal|consultor tecnico em exploracao vegetal
222120|Engenheiro de fauna e flora|engenheiro de fauna e flora
222120|Engenheiro especialista em preservação florestal|engenheiro especialista em preservacao florestal
222120|Engenheiro especialista em tecnologia de madeira|engenheiro especialista em tecnologia de madeira
222120|Engenheiro silvicultor|engenheiro silvicultor
222120|Reflorestador|reflorestador
222125|Tecnólogo em agronegócio digital|tecnologo em agronegocio digital
222215|Tecnólogo em agroindústria|tecnologo em agroindustria
222215|Tecnólogo em laticínios|tecnologo em laticinios
222215|Tecnólogo em processamento de carnes|tecnologo em processamento de carnes
223208|Dentista|dentista
223208|Odontologista|odontologista
223208|Odontólogo|odontologo
223212|Canalista|canalista
223212|Endodontólogo|endodontologo
223212|Odontólogo-endodontista|odontologo-endodontista
223228|Dentista de idosos|dentista de idosos
223228|Dentista de terceira idade|dentista de terceira idade
223236|Dentista de criança|dentista de crianca
223236|Odontopediatra|odontopediatra
223240|Dentista de aparelho|dentista de aparelho
223240|Ortodontista|ortodontista
223240|Ortodontólogo|ortodontologo
223240|Ortopedista maxilar|ortopedista maxilar
223248|Dentista de gengivas|dentista de gengivas
223248|Periodontista|periodontista
223252|Protesista bucomaxilofacial|protesista bucomaxilofacial
223256|Odontólogo protesista|odontologo protesista
223256|Protesista|protesista
223256|Reabilitador oral|reabilitador oral
223260|Odontoradiologista|odontoradiologista
223268|Cirurgião oral e maxilofacial|cirurgiao oral e maxilofacial
223268|Odontólogo (cirurgia e traumatologia bucomaxilofacial)|odontologo (cirurgia e traumatologia bucomaxilofacial)
223272|Dentista de saúde coletiva|dentista de saude coletiva
223272|Odontologista social|odontologista social
223272|Odontólogo de saúde coletiva|odontologo de saude coletiva
223272|Odontólogo de saúde pública|odontologo de saude publica
223276|Odontologia ocupacional|odontologia ocupacional
223280|Dentística restauradora|dentistica restauradora
223284|Dentista da dor|dentista da dor
223284|Disfunção de atm|disfuncao de atm
223284|Disfunção e dor|disfuncao e dor
223284|Dtm/dof|dtm/dof
223288|Dentista de cuidados especiais|dentista de cuidados especiais
223288|Dentista de excepcionais|dentista de excepcionais
223288|Dentista de pacientes com necessidades especiais|dentista de pacientes com necessidades especiais
223288|Dentista de pacientes especiais|dentista de pacientes especiais
223288|Dentistas de deficientes|dentistas de deficientes
223305|Médico veterinário de saúde pública|medico veterinario de saude publica
223305|Médico veterinário sanitarista|medico veterinario sanitarista
223305|Veterinário|veterinario
223405|Farmacêutico auditor|farmaceutico auditor
223405|Farmacêutico de manipulação|farmaceutico de manipulacao
223405|Farmacêutico em atenção farmacêutica|farmaceutico em atencao farmaceutica
223405|Farmacêutico em biofarmácia|farmaceutico em biofarmacia
223405|Farmacêutico em biossegurança|farmaceutico em biosseguranca
223405|Farmacêutico em cosmetologia|farmaceutico em cosmetologia
223405|Farmacêutico em farmácia comunitária|farmaceutico em farmacia comunitaria
223405|Farmacêutico em farmácia veterinária|farmaceutico em farmacia veterinaria
223405|Farmacêutico em farmacocinética clínica|farmaceutico em farmacocinetica clinica
223405|Farmacêutico em farmacotécnica|farmaceutico em farmacotecnica
223405|Farmacêutico farmacologista|farmaceutico farmacologista
223405|Farmacêutico magistral|farmaceutico magistral
223415|Farmacêutico analista clínico (bioquímico)|farmaceutico analista clinico (bioquimico)
223415|Farmacêutico em análises clínicas|farmaceutico em analises clinicas
223415|Farmacêutico em bacteriologia clínica|farmaceutico em bacteriologia clinica
223415|Farmacêutico em banco de materiais biológicos|farmaceutico em banco de materiais biologicos
223415|Farmacêutico em banco de órgãos, tecidos e células|farmaceutico em banco de orgaos, tecidos e celulas
223415|Farmacêutico em banco de sangue|farmaceutico em banco de sangue
223415|Farmacêutico em banco de sêmem|farmaceutico em banco de semem
223415|Farmacêutico em biologia molecular|farmaceutico em biologia molecular
223415|Farmacêutico em bioquímica clínica|farmaceutico em bioquimica clinica
223415|Farmacêutico em citogenética|farmaceutico em citogenetica
223415|Farmacêutico em citologia clínica e diagnóstica|farmaceutico em citologia clinica e diagnostica
223415|Farmacêutico em citopatologia|farmaceutico em citopatologia
223415|Farmacêutico em citoquímica|farmaceutico em citoquimica
223415|Farmacêutico em genética|farmaceutico em genetica
223415|Farmacêutico em hematologia clínica|farmaceutico em hematologia clinica
223415|Farmacêutico em hemoterapia|farmaceutico em hemoterapia
223415|Farmacêutico em histocompatibilidade|farmaceutico em histocompatibilidade
223415|Farmacêutico em histoquímica|farmaceutico em histoquimica
223415|Farmacêutico em imunocitoquímica|farmaceutico em imunocitoquimica
223415|Farmacêutico em imunogenética|farmaceutico em imunogenetica
223415|Farmacêutico em imunologia clínica|farmaceutico em imunologia clinica
223415|Farmacêutico em imunopatologia|farmaceutico em imunopatologia
223415|Farmacêutico em micologia clínica|farmaceutico em micologia clinica
223415|Farmacêutico em microbiologia clínica|farmaceutico em microbiologia clinica
223415|Farmacêutico em parasitologia clínica|farmaceutico em parasitologia clinica
223415|Farmacêutico em virologia clínica|farmaceutico em virologia clinica
223420|Farmacêutico bromatologista|farmaceutico bromatologista
223420|Farmacêutico em alimentos funcionais e nutracêuticos|farmaceutico em alimentos funcionais e nutraceuticos
223420|Farmacêutico em análise de alimentos|farmaceutico em analise de alimentos
223420|Farmacêutico em banco de leite|farmaceutico em banco de leite
223420|Farmacêutico em controle de qualidade de alimentos|farmaceutico em controle de qualidade de alimentos
223420|Farmacêutico em indústria de alimentos|farmaceutico em industria de alimentos
223420|Farmacêutico em microbiologia de alimentos|farmaceutico em microbiologia de alimentos
223420|Farmacêutico em nutrição animal|farmaceutico em nutricao animal
223420|Farmacêutico em pesquisa e desenvolvimento de alimentos|farmaceutico em pesquisa e desenvolvimento de alimentos
223420|Farmacêutico em produção de alimentos|farmaceutico em producao de alimentos
223425|Farmacêutico acupunturista|farmaceutico acupunturista
223425|Farmacêutico antroposófico|farmaceutico antroposofico
223425|Farmacêutico em plantas medicinais e fitoterapia|farmaceutico em plantas medicinais e fitoterapia
223425|Farmacêutico em termalismo social/crenoterapia|farmaceutico em termalismo social/crenoterapia
223425|Farmacêutico fitoterapeuta|farmaceutico fitoterapeuta
223425|Farmacêutico homeopata|farmaceutico homeopata
223430|Farmacêutico em controle de qualidade e tratamento de água|farmaceutico em controle de qualidade e tratamento de agua
223430|Farmacêutico em controle de vetores e pragas urbanas|farmaceutico em controle de vetores e pragas urbanas
223430|Farmacêutico em estratégia da saúde da família|farmaceutico em estrategia da saude da familia
223430|Farmacêutico em farmácia pública|farmaceutico em farmacia publica
223430|Farmacêutico em farmacoepidemiologia|farmaceutico em farmacoepidemiologia
223430|Farmacêutico em farmacovigilância|farmaceutico em farmacovigilancia
223430|Farmacêutico em gerenciamento dos resíduos em serviços de saúde|farmaceutico em gerenciamento dos residuos em servicos de saude
223430|Farmacêutico em gestão ambiental|farmaceutico em gestao ambiental
223430|Farmacêutico em gestão de assistência farmacêutica|farmaceutico em gestao de assistencia farmaceutica
223430|Farmacêutico em saúde ambiental|farmaceutico em saude ambiental
223430|Farmacêutico em saúde ocupacional|farmaceutico em saude ocupacional
223430|Farmacêutico em segurança do trabalho|farmaceutico em seguranca do trabalho
223430|Farmacêutico em vigilância epidemiológica|farmaceutico em vigilancia epidemiologica
223435|Farmacêutico em alfândega|farmaceutico em alfandega
223435|Farmacêutico em armazenamento|farmaceutico em armazenamento
223435|Farmacêutico em biotecnologia industrial|farmaceutico em biotecnologia industrial
223435|Farmacêutico em controle de qualidade de insumos, medicamentos, cosméticos e produtos veterinários|farmaceutico em controle de qualidade de insumos, medicamentos, cosmeticos e produtos veterinarios
223435|Farmacêutico em distribuidora|farmaceutico em distribuidora
223435|Farmacêutico em domissanitários|farmaceutico em domissanitarios
223435|Farmacêutico em indústria de cosméticos|farmaceutico em industria de cosmeticos
223435|Farmacêutico em indústria farmacêutica|farmaceutico em industria farmaceutica
223435|Farmacêutico em indústria químico-farmacêutico|farmaceutico em industria quimico-farmaceutico
223435|Farmacêutico em indústria veterinária|farmaceutico em industria veterinaria
223435|Farmacêutico em pesquisa e desenvolvimento de fármacos|farmaceutico em pesquisa e desenvolvimento de farmacos
223435|Farmacêutico em transportadora|farmaceutico em transportadora
223435|Farmacêutico logístico|farmaceutico logistico
223440|Farmacêutica criminalista|farmaceutica criminalista
223440|Farmacêutico em análise de solo|farmaceutico em analise de solo
223440|Farmacêutico em toxicologia ambiental|farmaceutico em toxicologia ambiental
223440|Farmacêutico em toxicologia analítica|farmaceutico em toxicologia analitica
223440|Farmacêutico em toxicologia clínica|farmaceutico em toxicologia clinica
223440|Farmacêutico em toxicologia de alimentos|farmaceutico em toxicologia de alimentos
223440|Farmacêutico em toxicologia de cosméticos|farmaceutico em toxicologia de cosmeticos
223440|Farmacêutico em toxicologia de emergência|farmaceutico em toxicologia de emergencia
223440|Farmacêutico em toxicologia de medicamentos|farmaceutico em toxicologia de medicamentos
223440|Farmacêutico em toxicologia desportiva|farmaceutico em toxicologia desportiva
223440|Farmacêutico em toxicologia experimental|farmaceutico em toxicologia experimental
223440|Farmacêutico em toxicologia forense|farmaceutico em toxicologia forense
223440|Farmacêutico em toxicologia ocupacional|farmaceutico em toxicologia ocupacional
223440|Farmacêutico em toxicologia veterinária|farmaceutico em toxicologia veterinaria
223445|Farmacêutico clínico|farmaceutico clinico
223445|Farmacêutico clínico domiciliar|farmaceutico clinico domiciliar
223445|Farmacêutico clínico em cardiologia|farmaceutico clinico em cardiologia
223445|Farmacêutico clínico em cuidados paliativos|farmaceutico clinico em cuidados paliativos
223445|Farmacêutico clínico em famarcocinética clinica|farmaceutico clinico em famarcocinetica clinica
223445|Farmacêutico clínico em farmacovigilância|farmaceutico clinico em farmacovigilancia
223445|Farmacêutico clínico em geriatria|farmaceutico clinico em geriatria
223445|Farmacêutico clínico em hematologia|farmaceutico clinico em hematologia
223445|Farmacêutico clínico em oncologia|farmaceutico clinico em oncologia
223445|Farmacêutico clínico em pediatria|farmaceutico clinico em pediatria
223445|Farmacêutico clínico em reumatologia|farmaceutico clinico em reumatologia
223445|Farmacêutico clínico em terapia antineoplásica|farmaceutico clinico em terapia antineoplasica
223445|Farmacêutico em assistência domiciliar|farmaceutico em assistencia domiciliar
223445|Farmacêutico em cuidados paliativos|farmaceutico em cuidados paliativos
223445|Farmacêutico em gases e misturas de usos terapêuticos|farmaceutico em gases e misturas de usos terapeuticos
223445|Farmacêutico em homecare|farmaceutico em homecare
223445|Farmacêutico em homoderivados|farmaceutico em homoderivados
223445|Farmacêutico em nutrição parenteral|farmaceutico em nutricao parenteral
223445|Farmacêutico em pesquisas clínicas|farmaceutico em pesquisas clinicas
223445|Farmacêutico em radioisótopos|farmaceutico em radioisotopos
223445|Farmacêutico nuclear|farmaceutico nuclear
223445|Farmacêutico pré-hospitalar em serviços de urgência e emergência|farmaceutico pre-hospitalar em servicos de urgencia e emergencia
223445|Radiofarmacêutico|radiofarmaceutico
223520|Instrumentador cirúrgico (enfermeiro)|instrumentador cirurgico (enfermeiro)
223525|Enfermeiro intensivista|enfermeiro intensivista
223540|Enfermeiro de berçário|enfermeiro de bercario
223545|Enfermeira parteira|enfermeira parteira
223560|Enfermeiro de saúde publica|enfermeiro de saude publica
223575|Parteira profissional|parteira profissional
223705|Auxiliar de dietista|auxiliar de dietista
223705|Auxiliar de nutrição e dietética|auxiliar de nutricao e dietetica
223710|Nutricionista (saúde pública)|nutricionista (saude publica)
223820|Audiologista (fonoaudiólogo)|audiologista (fonoaudiologo)
224105|Orientador fisiocorporal|orientador fisiocorporal
224110|Cinesiólogo ludomotricista|cinesiologo ludomotricista
224120|Personal treanning|personal treanning
224120|Preparador fisiocorporal|preparador fisiocorporal
224125|Treinador assistente de modalidade esportiva|treinador assistente de modalidade esportiva
224125|Treinador auxiliar de modalidade esportiva|treinador auxiliar de modalidade esportiva
224125|Treinador esportivo|treinador esportivo
224135|Auxiliar técnico - no futebol|auxiliar tecnico - no futebol
224135|Auxiliar técnico - nos esportes|auxiliar tecnico - nos esportes
224135|Coordenador de futebol|coordenador de futebol
224135|Professor de futebol|professor de futebol
225103|Infectologista|infectologista
225103|Médico de doenças infecciosas e parasitárias|medico de doencas infecciosas e parasitarias
225106|Legista|legista
225109|Nefrologista|nefrologista
225110|Alergista|alergista
225110|Alergista e imunologista|alergista e imunologista
225110|Alergologista|alergologista
225110|Médico alergista|medico alergista
225110|Médico imunologista|medico imunologista
225112|Médico neuropediatra|medico neuropediatra
225112|Neurologista|neurologista
225112|Neuropediatra|neuropediatra
225115|Angiologista|angiologista
225118|Médico nutrólogo|medico nutrologo
225118|Nutrologista|nutrologista
225120|Cardiologista|cardiologista
225120|Médico do coração|medico do coracao
225121|Cancerologista clínico|cancerologista clinico
225121|Médico cancerologista (clínico)|medico cancerologista (clinico)
225121|Oncologista (clínico)|oncologista (clinico)
225124|Hebeatra|hebeatra
225124|Médico de criança|medico de crianca
225124|Neonatologista|neonatologista
225124|Pediatra|pediatra
225125|Clínico geral|clinico geral
225125|Médico clínico geral|medico clinico geral
225125|Médico especialista em clínica médica|medico especialista em clinica medica
225125|Médico especialista em medicina interna|medico especialista em medicina interna
225125|Médico internista|medico internista
225127|Médico pneumotisiologista|medico pneumotisiologista
225127|Pneumologista|pneumologista
225127|Pneumotisiologista|pneumotisiologista
225127|Tisiologista|tisiologista
225130|Médico comunitário|medico comunitario
225130|Médico de família|medico de familia
225133|Médico psicanalista|medico psicanalista
225133|Médico psicoterapeuta|medico psicoterapeuta
225133|Neuropsiquiatra|neuropsiquiatra
225133|Psiquiatra|psiquiatra
225135|Dermatologista|dermatologista
225135|Hansenólogo|hansenologo
225135|Médico cirurgião dermatologista|medico cirurgiao dermatologista
225136|Reumatologista|reumatologista
225139|Epidemiologista|epidemiologista
225139|Médico de saúde pública|medico de saude publica
225139|Médico epidemiologista|medico epidemiologista
225139|Médico higienista|medico higienista
225145|Médico do tráfego|medico do trafego
225150|Ceteísta|ceteista
225150|Intensivista|intensivista
225151|Anestesiologista|anestesiologista
225151|Anestesista|anestesista
225151|Médico anestesista|medico anestesista
225155|Diabetólogo|diabetologo
225155|Endocrinologista|endocrinologista
225155|Médico endocrinologista|medico endocrinologista
225155|Médico metabolista|medico metabolista
225155|Metabolista|metabolista
225155|Metabologista|metabologista
225160|Fisiatra|fisiatra
225165|Gastroenterologista|gastroenterologista
225170|Médico alopata|medico alopata
225170|Médico em medicina interna|medico em medicina interna
225170|Médico militar|medico militar
225180|Geriatra|geriatra
225180|Gerontologista|gerontologista
225180|Gerontólogo|gerontologo
225185|Hematologista|hematologista
225203|Cirurgião vascular|cirurgiao vascular
225210|Cirurgião cardiovascular|cirurgiao cardiovascular
225215|Cirurgião de cabeça e pescoço|cirurgiao de cabeca e pescoco
225220|Cirurgião do aparelho digestivo|cirurgiao do aparelho digestivo
225220|Cirurgião gastroenterológico|cirurgiao gastroenterologico
225225|Cirurgião|cirurgiao
225225|Cirurgião geral|cirurgiao geral
225225|Médico cirurgião|medico cirurgiao
225230|Cirurgião pediátrico|cirurgiao pediatrico
225235|Cirurgião plástico|cirurgiao plastico
225240|Cirurgião torácico|cirurgiao toracico
225250|Cirurgião ginecológico|cirurgiao ginecologico
225250|Ginecologista|ginecologista
225250|Médico de mulheres|medico de mulheres
225250|Médico ginecologista|medico ginecologista
225250|Médico obstetra|medico obstetra
225250|Obstetra|obstetra
225250|Tocoginecologista|tocoginecologista
225255|Cirurgião de mama|cirurgiao de mama
225255|Cirurgião mastologista|cirurgiao mastologista
225255|Mastologista|mastologista
225260|Médico neurocirurgião pediátrico|medico neurocirurgiao pediatrico
225260|Neurocirurgião|neurocirurgiao
225260|Neurocirurgião pediátrico|neurocirurgiao pediatrico
225265|Cirurgião oftalmológico|cirurgiao oftalmologico
225265|Oculista|oculista
225265|Oftalmologista|oftalmologista
225270|Cirurgião ortopedista|cirurgiao ortopedista
225270|Cirurgião traumatologista|cirurgiao traumatologista
225270|Médico ortopedista|medico ortopedista
225270|Médico traumatologista|medico traumatologista
225270|Ortopedista|ortopedista
225270|Traumatologista|traumatologista
225275|Cirurgião otorrinolaringologista|cirurgiao otorrinolaringologista
225275|Foniatra|foniatra
225275|Médico foniatra|medico foniatra
225275|Otorrino|otorrino
225275|Otorrinolaringologista|otorrinolaringologista
225280|Cirurgião proctologista|cirurgiao proctologista
225280|Coloproctologista|coloproctologista
225280|Médico proctologista|medico proctologista
225280|Proctologista|proctologista
225285|Andrologista|andrologista
225285|Cirurgião urológico|cirurgiao urologico
225285|Cirurgião urologista|cirurgiao urologista
225285|Urologista|urologista
225290|Médico oncologista cirúrgico|medico oncologista cirurgico
225290|Oncologista cirúrgico|oncologista cirurgico
225295|Cirurgião da mão|cirurgiao da mao
225305|Citopatologista|citopatologista
225310|Endoscopista|endoscopista
225310|Médico broncoesofagologista|medico broncoesofagologista
225310|Médico broncoscopista|medico broncoscopista
225310|Médico endoscopista|medico endoscopista
225315|Médico nuclear|medico nuclear
225320|Imaginologista|imaginologista
225320|Médico radiologista|medico radiologista
225320|Radiologista|radiologista
225325|Médico anatomopatologista|medico anatomopatologista
225325|Patologista|patologista
225330|Médico em radio-oncologia|medico em radio-oncologia
225330|Médico em radioterapia|medico em radioterapia
225330|Radio-oncologista|radio-oncologista
225330|Radioterapeuta|radioterapeuta
225335|Médico em medicina laboratorial|medico em medicina laboratorial
225335|Médico laboratorista|medico laboratorista
225335|Médico patologista clínico|medico patologista clinico
225335|Patologista clínico|patologista clinico
225340|Hemoterapeuta|hemoterapeuta
225340|Médico em hemoterapia|medico em hemoterapia
225345|Médico em medicina hiperbárica|medico em medicina hiperbarica
225345|Médico hiperbaricista|medico hiperbaricista
225345|Médico hiperbárico|medico hiperbarico
225350|Médico neurofisiologista|medico neurofisiologista
225350|Neurofisiologista clínico|neurofisiologista clinico
225355|Intervencionista|intervencionista
225355|Medico intervencionista|medico intervencionista
225355|Radiologista intervencionista não vascular|radiologista intervencionista nao vascular
225355|Radiologista intervencionista percutâneo|radiologista intervencionista percutaneo
225355|Radiologista intervencionista vascular|radiologista intervencionista vascular
231105|Professor de ensino pré-escolar|professor de ensino pre-escolar
231105|Professor de ensino pré-primário|professor de ensino pre-primario
231110|Professor de creche|professor de creche
231110|Professor de jardim de infância (nível superior)|professor de jardim de infancia (nivel superior)
231110|Professor de maternal (nivel superior)|professor de maternal (nivel superior)
231110|Professor de minimaternal|professor de minimaternal
231205|Professor de suplência do ensino fundamental (primeira a quarta série)|professor de suplencia do ensino fundamental (primeira a quarta serie)
231210|Professor das séries iniciais|professor das series iniciais
231210|Professor dos ciclos iniciais (ensino fundamental)|professor dos ciclos iniciais (ensino fundamental)
231305|Professor de ciências na educação de jovens e adultos do ensino fundamental de 5ª a 8ª série|professor de ciencias na educacao de jovens e adultos do ensino fundamental de 5ª a 8ª serie
231305|Professor de ciências naturais no ensino fundamental de 5ª a 8ª série|professor de ciencias naturais no ensino fundamental de 5ª a 8ª serie
231310|Professor de artes do ensino fundamental de de 5ª a 8ª série|professor de artes do ensino fundamental de de 5ª a 8ª serie
231310|Professor de artes na educação de jovens e adultos do ensino fundamental de 5ª a 8ª série|professor de artes na educacao de jovens e adultos do ensino fundamental de 5ª a 8ª serie
231315|Professor de educação física na educação de jovens e adultos do ensino fundamental de 5ª a 8ª série|professor de educacao fisica na educacao de jovens e adultos do ensino fundamental de 5ª a 8ª serie
231320|Professor de geografia na educação de jovens e adultos do ensino fundamental de 5ª a 8ª série|professor de geografia na educacao de jovens e adultos do ensino fundamental de 5ª a 8ª serie
231325|Professor de história na educação de jovens e adultos do ensino fundamental de 5ª a 8ª série|professor de historia na educacao de jovens e adultos do ensino fundamental de 5ª a 8ª serie
231330|Professor de língua estrangeira moderna  no ensino supletivo do ensino fundamental de  5ª a 8ª série|professor de lingua estrangeira moderna  no ensino supletivo do ensino fundamental de  5ª a 8ª serie
231335|Professor de língua portuguesa no ensino supletivo do ensino fundamental de 5ª a 8ª série|professor de lingua portuguesa no ensino supletivo do ensino fundamental de 5ª a 8ª serie
231340|Professor de matemática na educação de jovens e adultos do ensino fundamental de 5ª a 8ª série|professor de matematica na educacao de jovens e adultos do ensino fundamental de 5ª a 8ª serie
233110|Professor de ensino profissionalizante no ensino de nível médio|professor de ensino profissionalizante no ensino de nivel medio
233205|Instrutor agrícola|instrutor agricola
233205|Instrutor de aprendizagem agropecuária|instrutor de aprendizagem agropecuaria
233205|Instrutor de treinamento agropecuário|instrutor de treinamento agropecuario
233210|Instrutor de aprendizagem industrial|instrutor de aprendizagem industrial
233210|Instrutor de educação profissional industrial|instrutor de educacao profissional industrial
233210|Instrutor de ofícios industriais|instrutor de oficios industriais
233210|Instrutor de treinamento industrial (formação profissional)|instrutor de treinamento industrial (formacao profissional)
233210|Instrutor de treinamentos industriais|instrutor de treinamentos industriais
233210|Professor-instrutor de cursos de treinamento industrial|professor-instrutor de cursos de treinamento industrial
233210|Professor-instrutor de educação profissional industrial|professor-instrutor de educacao profissional industrial
233215|Instrutor de aprendizagem comercial|instrutor de aprendizagem comercial
233215|Instrutor de treinamento comercial|instrutor de treinamento comercial
233220|Instrutor de aprendizagem agroindustrial e florestal|instrutor de aprendizagem agroindustrial e florestal
233225|Instrutor de aprendizagem em comunicação|instrutor de aprendizagem em comunicacao
233225|Instrutor de aprendizagem em informática|instrutor de aprendizagem em informatica
233225|Instrutor de aprendizagem em transportes|instrutor de aprendizagem em transportes
233225|Instrutor de informática|instrutor de informatica
234105|Professor de cálculo numérico (no ensino superior)|professor de calculo numerico (no ensino superior)
234105|Professor de matemática financeira (no ensino superior)|professor de matematica financeira (no ensino superior)
234105|Professor de teoria matemática de sistemas (no ensino superior)|professor de teoria matematica de sistemas (no ensino superior)
234110|Professor de álgebra linear (no ensino superior)|professor de algebra linear (no ensino superior)
234110|Professor de matemática (no ensino superior)|professor de matematica (no ensino superior)
234115|Professor de amostragem estatística (no ensino superior)|professor de amostragem estatistica (no ensino superior)
234120|Professor de informática (no ensino superior)|professor de informatica (no ensino superior)
234210|Professor de química inorgânica (ensino superior)|professor de quimica inorganica (ensino superior)
234210|Professor de química orgânica (ensino superior)|professor de quimica organica (ensino superior)
234435|Professor de clínica cirúrgica (ensino superior)|professor de clinica cirurgica (ensino superior)
234435|Professor de clínica médica (ensino superior)|professor de clinica medica (ensino superior)
234505|Docente de ensino superior na área de didática|docente de ensino superior na area de didatica
234505|Professor de didática (ensino superior)|professor de didatica (ensino superior)
234505|Professor universitário na área de didática|professor universitario na area de didatica
234510|Docente de ensino superior na área de orientação educacional|docente de ensino superior na area de orientacao educacional
234510|Professor universitário na área de orientação educacional|professor universitario na area de orientacao educacional
234515|Docente de ensino superior na área de pesquisa educacional|docente de ensino superior na area de pesquisa educacional
234515|Professor de ensino superior na área de metodologia da pesquisa|professor de ensino superior na area de metodologia da pesquisa
234515|Professor de ensino superior na área de metodologia da pesquisa em educação|professor de ensino superior na area de metodologia da pesquisa em educacao
234515|Professor de pesquisa educacional (ensino superior)|professor de pesquisa educacional (ensino superior)
234515|Professor universitário em metodologia de pesquisa em educação|professor universitario em metodologia de pesquisa em educacao
234515|Professor universitário na área de pesquisa educacional|professor universitario na area de pesquisa educacional
234520|Docente do ensino superior na área de prática de ensino|docente do ensino superior na area de pratica de ensino
234520|Professor de ensino superior na área de estágio supervisionado|professor de ensino superior na area de estagio supervisionado
234520|Professor de ensino superior na área de prática de ensino e estágio supervisionado|professor de ensino superior na area de pratica de ensino e estagio supervisionado
234520|Professor de prática de ensino (ensino superior)|professor de pratica de ensino (ensino superior)
234520|Professor universitário de estágio supervisionado|professor universitario de estagio supervisionado
234520|Professor universitário de metodologia do ensino|professor universitario de metodologia do ensino
234520|Professor universitário na área de prática de ensino|professor universitario na area de pratica de ensino
234604|Professor de alemão|professor de alemao
234608|Professor de italiano|professor de italiano
234612|Professor de francês|professor de frances
234616|Professor de inglês|professor de ingles
234620|Professor de espanhol|professor de espanhol
234624|Professor de português|professor de portugues
234672|Professor de lingüística|professor de linguistica
234672|Professor de lingüística aplicada|professor de linguistica aplicada
234676|Professor de crítica textual|professor de critica textual
234676|Professor de filologia|professor de filologia
234676|Professor de filologia germânica|professor de filologia germanica
234676|Professor de filologia portuguesa|professor de filologia portuguesa
234676|Professor de filologia românica|professor de filologia romanica
234676|Professor de linguística românica|professor de linguistica romanica
234689|Docente de ensino superior na área de língua brasileira de sinais (libras)|docente de ensino superior na area de lingua brasileira de sinais (libras)
234689|Docente de magistério superior de lingua brasileira de sinais (libras)|docente de magisterio superior de lingua brasileira de sinais (libras)
234805|Professor de desenvolvimento econômico|professor de desenvolvimento economico
234805|Professor de econometria|professor de econometria
234805|Professor de economia brasileira|professor de economia brasileira
234805|Professor de economia internacional|professor de economia internacional
234805|Professor de finanças públicas|professor de financas publicas
234805|Professor de história do pensamento econômico|professor de historia do pensamento economico
234805|Professor de história econômica|professor de historia economica
234805|Professor de macroeconomia|professor de macroeconomia
234805|Professor de matemática financeira (economia)|professor de matematica financeira (economia)
234805|Professor de microeconomia|professor de microeconomia
234805|Professor de pesquisa econômica|professor de pesquisa economica
234805|Professor de teoria econômica|professor de teoria economica
234810|Professor de administração financeira|professor de administracao financeira
234810|Professor de administração pública|professor de administracao publica
234810|Professor de finanças (administração)|professor de financas (administracao)
234810|Professor de gestão (administração)|professor de gestao (administracao)
234810|Professor de marketing|professor de marketing
234810|Professor de matemática financeira (administração)|professor de matematica financeira (administracao)
234810|Professor de organização e métodos (administração)|professor de organizacao e metodos (administracao)
234810|Professor de planejamento e desenvolvimento|professor de planejamento e desenvolvimento
234810|Professor de planejamento empresarial|professor de planejamento empresarial
234810|Professor de teoria da administração|professor de teoria da administracao
234815|Professor de análise de custos|professor de analise de custos
234815|Professor de auditoria contábil|professor de auditoria contabil
234815|Professor de contabilidade bancária|professor de contabilidade bancaria
234815|Professor de contabilidade financeira|professor de contabilidade financeira
234815|Professor de contabilidade industrial|professor de contabilidade industrial
234815|Professor de contabilidade internacional|professor de contabilidade internacional
234815|Professor de contabilidade pública|professor de contabilidade publica
234815|Professor de contabilidade societária|professor de contabilidade societaria
234815|Professor de perícia contábil|professor de pericia contabil
234905|Professor de artes cênicas no ensino superior|professor de artes cenicas no ensino superior
234905|Professor de circo no ensino superior|professor de circo no ensino superior
234905|Professor de dança no ensino superior|professor de danca no ensino superior
234905|Professor de performance no ensino superior|professor de performance no ensino superior
234905|Professor de teatro no ensino superior|professor de teatro no ensino superior
234905|Professor de teatro-educação no ensino superior|professor de teatro-educacao no ensino superior
239205|Pedagogo em educação especial de surdos|pedagogo em educacao especial de surdos
239205|Pedagogo especializado em deficientes da áudio-comunicação|pedagogo especializado em deficientes da audio-comunicacao
239205|Professor de  língua portuguesa na modalidade escrita (ensino especial)|professor de  lingua portuguesa na modalidade escrita (ensino especial)
239205|Professor de alunos com distúrbios da áudio-comunicação|professor de alunos com disturbios da audio-comunicacao
239205|Professor de estimulação da língua portuguesa modalidade oral (ensino especial)|professor de estimulacao da lingua portuguesa modalidade oral (ensino especial)
239205|Professor especializado em deficiência  auditiva e surdos|professor especializado em deficiencia  auditiva e surdos
239210|Pedagogo especializado em deficiência física|pedagogo especializado em deficiencia fisica
239210|Professor na área de deficiência física|professor na area de deficiencia fisica
239215|Pedagogo especializado em deficiência mental|pedagogo especializado em deficiencia mental
239215|Professor de alunos com deficiências mentais|professor de alunos com deficiencias mentais
239215|Professor especializado em excepcionais|professor especializado em excepcionais
239220|Professor de aluno surdo-cego|professor de aluno surdo-cego
239220|Professor de ensino especial na área de deficiência múltipla|professor de ensino especial na area de deficiencia multipla
239220|Professor em educação especial de DMu (deficiências múltiplas)|professor em educacao especial de dmu (deficiencias multiplas)
239225|Monitor de braile|monitor de braile
239225|Pedagogo em educação especial de cegos|pedagogo em educacao especial de cegos
239225|Professor de braile|professor de braile
239225|Professor de cegos|professor de cegos
239225|Professor de orientação e mobilidade de cegos|professor de orientacao e mobilidade de cegos
239225|Professor de reabilitação funcional de cego|professor de reabilitacao funcional de cego
239225|Professor de reabilitação visual|professor de reabilitacao visual
239225|Professor de sorobã|professor de soroba
239405|Auxiliar de coordenação de ensino fundamental de primeira a quarta séries|auxiliar de coordenacao de ensino fundamental de primeira a quarta series
239405|Auxiliar de coordenador escolar|auxiliar de coordenador escolar
239405|Coordenador auxiliar de curso|coordenador auxiliar de curso
239405|Coordenador de disciplina e área de estudo|coordenador de disciplina e area de estudo
239405|Coordenador de ensino|coordenador de ensino
239405|Coordenador escolar|coordenador escolar
239410|Auxiliar de orientação educacional|auxiliar de orientacao educacional
239410|Orientador de disciplina e área de estudo|orientador de disciplina e area de estudo
239410|Orientador de ensino|orientador de ensino
239410|Orientador escolar|orientador escolar
239410|Orientador profissional|orientador profissional
239410|Orientador vocacional e profissional|orientador vocacional e profissional
239410|Professor de orientação educacional|professor de orientacao educacional
239410|Técnico de orientação profissional|tecnico de orientacao profissional
239415|Auxiliar de orientação pedagógica|auxiliar de orientacao pedagogica
239415|Auxiliar de orientação pedagógica em educação fundamental de primeira a quarta séries|auxiliar de orientacao pedagogica em educacao fundamental de primeira a quarta series
239415|Coordenador de orientação pedagógica|coordenador de orientacao pedagogica
239415|Coordenador de serviço de orientação pedagógica|coordenador de servico de orientacao pedagogica
239430|Auxiliar de supervisão de ensino|auxiliar de supervisao de ensino
239430|Auxiliar de supervisor escolar|auxiliar de supervisor escolar
239430|Supervisor educacional|supervisor educacional
239430|Supervisor pedagógico|supervisor pedagogico
239435|Desenhista instrucional|desenhista instrucional
239435|Designer instrucional|designer instrucional
239435|Projetista instrucional|projetista instrucional
241005|Advogado generalista|advogado generalista
241005|Assistente Jurídico|assistente juridico
241010|Advogado empresarial|advogado empresarial
241015|Advogado civilista|advogado civilista
241015|Advogado comercial|advogado comercial
241015|Advogado contratualista|advogado contratualista
241015|Advogado (direito de família e sucessões)|advogado (direito de familia e sucessoes)
241020|Advogado constitucionalista|advogado constitucionalista
241020|Advogado (direito administrativo)|advogado (direito administrativo)
241020|Advogado fiscal (direito fiscal)|advogado fiscal (direito fiscal)
241020|Advogado previdenciário|advogado previdenciario
241020|Advogado tributarista|advogado tributarista
241025|Advogado criminalista|advogado criminalista
241025|Criminalista|criminalista
241025|Penalista|penalista
241030|Advogado (abuso do poder econômico)|advogado (abuso do poder economico)
241030|Advogado (aeroespacial)|advogado (aeroespacial)
241030|Advogado (agente de propriedade industrial)|advogado (agente de propriedade industrial)
241030|Advogado (ambientalista)|advogado (ambientalista)
241030|Advogado (arbitragem)|advogado (arbitragem)
241030|Advogado (biodireito)|advogado (biodireito)
241030|Advogado (concorrência desleal)|advogado (concorrencia desleal)
241030|Advogado (desportivo)|advogado (desportivo)
241030|Advogado (direito internacional)|advogado (direito internacional)
241030|Advogado (direitos da criança e do adolescente)|advogado (direitos da crianca e do adolescente)
241030|Advogado (direitos do consumidor)|advogado (direitos do consumidor)
241030|Advogado (energia elétrica)|advogado (energia eletrica)
241030|Advogado (propriedade intelectual)|advogado (propriedade intelectual)
241030|Advogado (recursos hídricos e minerais)|advogado (recursos hidricos e minerais)
241030|Advogado (telecomunicações)|advogado (telecomunicacoes)
241030|Advogados (direito eletrônico)|advogados (direito eletronico)
241035|Advogado trabalhista|advogado trabalhista
241040|Assessor jurídico|assessor juridico
241040|Consultor|consultor
241040|Jurisconsultor|jurisconsultor
241040|Jurista|jurista
241215|Procurador distrital|procurador distrital
241215|Procurador na Justiça|procurador na justica
241225|Procurador municipal|procurador municipal
241235|Procurador de fundação|procurador de fundacao
241305|Registrador de contratos marítimos|registrador de contratos maritimos
241305|Tabelião de contratos marítimos|tabeliao de contratos maritimos
241310|Registrador civil de pessoas jurídicas|registrador civil de pessoas juridicas
241315|Registrador civil de pessoas naturais|registrador civil de pessoas naturais
241325|Registrador imobiliário|registrador imobiliario
241330|Registrador de títulos e documentos|registrador de titulos e documentos
241335|Notário|notario
241340|Tabelião de protesto de letras e títulos|tabeliao de protesto de letras e titulos
241405|Conselheiro classista|conselheiro classista
241405|Conselheiro julgador relator|conselheiro julgador relator
241405|Conselheiro relator|conselheiro relator
241405|Juiz (administrativo)|juiz (administrativo)
241405|Juiz de impostos e tributos|juiz de impostos e tributos
242305|Autoridade policial (delegado)|autoridade policial (delegado)
242305|Delegado distrital de polícia|delegado distrital de policia
242305|Delegado regional de polícia|delegado regional de policia
242405|Defensor público estadual|defensor publico estadual
242405|Defensor público federal|defensor publico federal
242910|Analista de suporte à inteligência (grupo apoio)|analista de suporte a inteligencia (grupo apoio)
242910|Analista técnico em inteligência (grupo informações)|analista tecnico em inteligencia (grupo informacoes)
251105|Paleetnólogo|paleetnologo
251115|Cientista social|cientista social
251205|Analista de economia internacional|analista de economia internacional
251205|Analista de estudos econômicos|analista de estudos economicos
251205|Analista de mercado de trabalho (economista)|analista de mercado de trabalho (economista)
251205|Analista de mercado e produtos (economista)|analista de mercado e produtos (economista)
251205|Analista de mercado internacional|analista de mercado internacional
251205|Analista de mercadologia (economista)|analista de mercadologia (economista)
251205|Analista econômico|analista economico
251205|Árbitro econômico|arbitro economico
251205|Mediador econômico|mediador economico
251205|Perito econômico|perito economico
251205|Pesquisador econômico|pesquisador economico
251210|Analista agroindustrial (economista)|analista agroindustrial (economista)
251210|Analista de agronegócios (economista)|analista de agronegocios (economista)
251210|Analista de mercado agrícola (economista)|analista de mercado agricola (economista)
251210|Analista de produto agropecuário (economista)|analista de produto agropecuario (economista)
251210|Economista agrícola|economista agricola
251215|Analista de controle orçamentário (economista)|analista de controle orcamentario (economista)
251215|Analista de crédito (economista)|analista de credito (economista)
251215|Analista de fundos de investimento|analista de fundos de investimento
251215|Analista de subscrição de títulos|analista de subscricao de titulos
251215|Analista econômico-financeiro|analista economico-financeiro
251215|Analista financeiro (economista)|analista financeiro (economista)
251220|Analista de cadeias produtivas (economista)|analista de cadeias produtivas (economista)
251220|Analista de mercado industrial (economista)|analista de mercado industrial (economista)
251220|Analista de planejamento industrial (economista)|analista de planejamento industrial (economista)
251220|Analista de produto industrial (economista)|analista de produto industrial (economista)
251220|Analista de projetos industriais (economista)|analista de projetos industriais (economista)
251225|Analista de controle e gestão (economista)|analista de controle e gestao (economista)
251225|Analista de finanças públicas (economista)|analista de financas publicas (economista)
251225|Analista de políticas públicas (economista)|analista de politicas publicas (economista)
251225|Analista fiscal (economista)|analista fiscal (economista)
251225|Analista tributário (economista)|analista tributario (economista)
251230|Analista de ecodesenvolvimento (economista)|analista de ecodesenvolvimento (economista)
251230|Analista de impactos ambientais (economista)|analista de impactos ambientais (economista)
251230|Analista de meio ambiente (economista)|analista de meio ambiente (economista)
251230|Analista de recursos naturais (economista)|analista de recursos naturais (economista)
251235|Analista de desenvolvimento regional (economista)|analista de desenvolvimento regional (economista)
251235|Economista urbano|economista urbano
251505|Psicólogo da educação|psicologo da educacao
251505|Psicólogo escolar|psicologo escolar
251510|Psicólogo da saúde|psicologo da saude
251510|Psicoterapeuta|psicoterapeuta
251510|Terapeuta|terapeuta
251515|Psicólogo desportivo|psicologo desportivo
251525|Psicólogo criminal|psicologo criminal
251525|Psicólogo forense|psicologo forense
251535|Psicólogo de tráfego|psicologo de trafego
251540|Psicólogo organizacional|psicologo organizacional
251550|Analista (psicanálise)|analista (psicanalise)
252105|Administrador de empresas|administrador de empresas
252105|Administrador de marketing|administrador de marketing
252105|Administrador de orçamento|administrador de orcamento
252105|Administrador de patrimônio|administrador de patrimonio
252105|Administrador de pequena e média empresa|administrador de pequena e media empresa
252105|Administrador de recursos humanos|administrador de recursos humanos
252105|Administrador de recursos tecnológicos|administrador de recursos tecnologicos
252105|Administrador financeiro|administrador financeiro
252105|Administrador hospitalar|administrador hospitalar
252105|Administrador público|administrador publico
252105|Analista administrativo|analista administrativo
252105|Consultor administrativo|consultor administrativo
252105|Consultor de organização|consultor de organizacao
252105|Gestor público (administrador)|gestor publico (administrador)
252205|Auditor contábil|auditor contabil
252205|Auditor de contabilidade e orçamento|auditor de contabilidade e orcamento
252205|Auditor externo (contadores e afins)|auditor externo (contadores e afins)
252205|Auditor financeiro|auditor financeiro
252205|Auditor fiscal (em contabilidade)|auditor fiscal (em contabilidade)
252205|Auditor independente (contadores e afins)|auditor independente (contadores e afins)
252205|Auditor interno (contadores e afins)|auditor interno (contadores e afins)
252205|Inspetor de auditoria|inspetor de auditoria
252210|Administrador de contadorias e registros fiscais|administrador de contadorias e registros fiscais
252210|Analista contábil|analista contabil
252210|Analista de balanço|analista de balanco
252210|Analista de contabilidade|analista de contabilidade
252210|Analista de contas|analista de contas
252210|Analista de contas a pagar|analista de contas a pagar
252210|Analista de custos|analista de custos
252210|Assistente de contabilidade industrial|assistente de contabilidade industrial
252210|Assistente de contador de custos|assistente de contador de custos
252210|Assistente de contadoria fiscal|assistente de contadoria fiscal
252210|Assistente de controladoria|assistente de controladoria
252210|Contabilista|contabilista
252210|Contador judicial|contador judicial
252210|Controller (contador)|controller (contador)
252210|Coordenador de contabilidade|coordenador de contabilidade
252210|Especialista contábil|especialista contabil
252210|Gerente de contabilidade|gerente de contabilidade
252210|Inspetor de agência bancária|inspetor de agencia bancaria
252210|Subcontador|subcontador
252210|Supervisor de contabilidade|supervisor de contabilidade
252210|Técnico de controladoria|tecnico de controladoria
252215|Perito assistente (contador)|perito assistente (contador)
252215|Perito contador|perito contador
252215|Perito de balanço|perito de balanco
252215|Perito liquidador (contador)|perito liquidador (contador)
252305|Assessor de diretoria|assessor de diretoria
252305|Assessor de presidência|assessor de presidencia
252305|Assistente de diretoria|assistente de diretoria
252305|Assistente de presidência|assistente de presidencia
252305|Auxiliar administrativo de diretoria|auxiliar administrativo de diretoria
252305|Auxiliar administrativo de presidência|auxiliar administrativo de presidencia
252305|Secretário  de diretoria|secretario  de diretoria
252305|Secretário  de gabinete|secretario  de gabinete
252305|Secretário  de presidência|secretario  de presidencia
252305|Secretário  pleno|secretario  pleno
252305|Secretário sênior|secretario senior
252305|Tecnólogo em secretariado|tecnologo em secretariado
252310|Assessor bilíngue|assessor bilingue
252310|Assistente bilíngue|assistente bilingue
252310|Auxiliar administrativo bilíngue|auxiliar administrativo bilingue
252310|Secretário bilíngue de diretoria|secretario bilingue de diretoria
252310|Secretário bilíngue de gabinete|secretario bilingue de gabinete
252310|Secretário bilíngue de presidência|secretario bilingue de presidencia
252310|Secretário pleno bilíngue|secretario pleno bilingue
252310|Secretário sênior bilíngue|secretario senior bilingue
252315|Assessor trilíngue|assessor trilingue
252315|Assistente trilíngue|assistente trilingue
252315|Auxiliar administrativo trilíngue|auxiliar administrativo trilingue
252315|Secretário pleno trilíngue|secretario pleno trilingue
252315|Secretário sênior trilíngue|secretario senior trilingue
252315|Secretário trilíngue de diretoria|secretario trilingue de diretoria
252315|Secretário trilíngue de gabinete|secretario trilingue de gabinete
252315|Secretário trilíngue de presidência|secretario trilingue de presidencia
252320|Secretário de escola (tecnólogo)|secretario de escola (tecnologo)
252320|Secretário escolar (tecnólogo)|secretario escolar (tecnologo)
252405|Analista de cargos e salários|analista de cargos e salarios
252405|Analista de ocupações|analista de ocupacoes
252545|Analista de planejamento financeiro|analista de planejamento financeiro
252550|Profissional de relações com o mercado|profissional de relacoes com o mercado
252550|Profissional de ri (relações com investidores)|profissional de ri (relacoes com investidores)
252605|Gerente de segurança empresarial|gerente de seguranca empresarial
252605|Tecnólogo em gestão de segurança empresarial|tecnologo em gestao de seguranca empresarial
252605|Tecnólogo em gestão de segurança privada|tecnologo em gestao de seguranca privada
252725|Analista de estoque|analista de estoque
252725|Analista de inventário|analista de inventario
253120|Coordenador de mídia|coordenador de midia
253140|Agenciador de publicidade|agenciador de publicidade
253140|Corretor de anúncios (publicidade)|corretor de anuncios (publicidade)
253305|Corretor de mercadorias|corretor de mercadorias
253305|Corretor de mercadorias e futuros|corretor de mercadorias e futuros
253305|Operador de  mercadorias e derivativos|operador de  mercadorias e derivativos
253305|Operador de bolsa - pregão|operador de bolsa - pregao
253305|Operador de bolsa de mercadorias e futuros|operador de bolsa de mercadorias e futuros
253305|Operador de câmbio e comércio exterior|operador de cambio e comercio exterior
253305|Operador de carteiras internacionais|operador de carteiras internacionais
253305|Operador de mesa bolsa de valores|operador de mesa bolsa de valores
253305|Operador de renda fixa|operador de renda fixa
253305|Operador de renda variável|operador de renda variavel
253305|Operador financeiro|operador financeiro
253405|Analista de mídias digitais|analista de midias digitais
253405|Analista de redes sociais|analista de redes sociais
253405|Assistente de mídias sociais|assistente de midias sociais
253405|Social media|social media
253410|Criador de conteúdo digital|criador de conteudo digital
253410|Gerador de conteúdo digital|gerador de conteudo digital
253410|Influencer|influencer
253410|Produtor de conteúdo digital|produtor de conteudo digital
254505|Agente fiscal(atividades urbanas)|agente fiscal(atividades urbanas)
254505|Agente vistor|agente vistor
254505|Auditor de atividades urbanas|auditor de atividades urbanas
254505|Auditor fiscal de atividades urbanas|auditor fiscal de atividades urbanas
254505|Fiscal de atividades econômicas|fiscal de atividades economicas
254505|Fiscal de feiras livres|fiscal de feiras livres
254505|Fiscal de posturas|fiscal de posturas
254505|Fiscal integrado|fiscal integrado
254505|Fiscal municipal|fiscal municipal
254505|Fiscal urbano|fiscal urbano
254505|Inspetor fiscal|inspetor fiscal
261115|Diretor adjunto|diretor adjunto
261120|Editor assistente|editor assistente
261120|Editor de área|editor de area
261120|Editor de arte|editor de arte
261120|Editor de fotografia|editor de fotografia
261120|Editor de imagem|editor de imagem
261120|Editor de rádio|editor de radio
261120|Editor de web|editor de web
261120|Editor executivo|editor executivo
261125|Assistente de editorial|assistente de editorial
261125|Colunista|colunista
261125|Colunista de jornal|colunista de jornal
261125|Correspondente de jornal|correspondente de jornal
261125|Correspondente de línguas estrangeiras|correspondente de linguas estrangeiras
261125|Cronista|cronista
261125|Diarista-em jornal|diarista-em jornal
261125|Diretor noticiarista|diretor noticiarista
261125|Editorialista|editorialista
261125|Jornalista exclusive empregador|jornalista exclusive empregador
261125|Jornalista-empregador|jornalista-empregador
261125|Radiojornalista|radiojornalista
261125|Roteirista de jornal|roteirista de jornal
261125|Roteirista na imprensa|roteirista na imprensa
261135|Repórter cinematográfico|reporter cinematografico
261135|Repórter correspondente|reporter correspondente
261135|Repórter de área|reporter de area
261135|Repórter de web|reporter de web
261135|Repórter especial|reporter especial
261205|Bibliógrafo|bibliografo
261205|Biblioteconomista|biblioteconomista
261205|Cientista de informação|cientista de informacao
261205|Consultor de informação|consultor de informacao
261205|Especialista de informação|especialista de informacao
261205|Gerente de informação|gerente de informacao
261205|Gestor de informação|gestor de informacao
261210|Analista de documentação|analista de documentacao
261210|Especialista de documentação|especialista de documentacao
261210|Gerente de documentação|gerente de documentacao
261210|Supervisor de controle de processos documentais|supervisor de controle de processos documentais
261210|Supervisor de controle documental|supervisor de controle documental
261210|Técnico de documentação|tecnico de documentacao
261210|Técnico em suporte de documentação|tecnico em suporte de documentacao
261215|Pesquisador de informações de rede|pesquisador de informacoes de rede
261305|Administrador de arquivos|administrador de arquivos
261305|Encarregado de serviço de arquivo médico e estatística|encarregado de servico de arquivo medico e estatistica
261305|Especialista em documentação arquivística|especialista em documentacao arquivistica
261305|Especialista em organização de arquivos|especialista em organizacao de arquivos
261305|Gestor de documentos|gestor de documentos
261310|Especialista em conservação de acervos|especialista em conservacao de acervos
261310|Especialista em documentação museológica|especialista em documentacao museologica
261310|Especialista em educação em museus|especialista em educacao em museus
261310|Especialista em museografia de exposição|especialista em museografia de exposicao
261405|Crítico textual|critico textual
261405|Filólogo dicionarista|filologo dicionarista
261410|Intérprete comercial|interprete comercial
261410|Intérprete de comunicação eletrônica|interprete de comunicacao eletronica
261410|Intérprete de conferência|interprete de conferencia
261410|Intérprete simultâneo|interprete simultaneo
261410|Tradutor simultâneo|tradutor simultaneo
261415|Lexicógrafo|lexicografo
261415|Lexicólogo|lexicologo
261415|Linguista dicionarista|linguista dicionarista
261415|Terminógrafo|terminografo
261415|Terminólogo|terminologo
261415|Vocabularista|vocabularista
261420|Tradutor de textos eletrônicos|tradutor de textos eletronicos
261420|Tradutor de textos escritos|tradutor de textos escritos
261420|Tradutor público juramentado|tradutor publico juramentado
261425|Guia-intérprete|guia-interprete
261425|Intérprete de libras|interprete de libras
261425|Intérprete educacional|interprete educacional
261425|Tradutor de libras|tradutor de libras
261425|Tradutor-intérprete de libras|tradutor-interprete de libras
261505|Adaptador de obras para teatro, cinema e televisão|adaptador de obras para teatro, cinema e televisao
261505|Argumentista-roteirista de história em quadrinhos|argumentista-roteirista de historia em quadrinhos
261505|Assistente de roteiro|assistente de roteiro
261505|Autor-roteirista de cinema|autor-roteirista de cinema
261505|Autor-roteirista de rádio|autor-roteirista de radio
261505|Autor-roteirista de teatro|autor-roteirista de teatro
261505|Autor-roteirista de televisão|autor-roteirista de televisao
261505|Autor-roteirista multimídia|autor-roteirista multimidia
261505|Chefe de sala de roteiros|chefe de sala de roteiros
261505|Dramaturgista|dramaturgista
261505|Redator final de roteiro|redator final de roteiro
261505|Roteirista|roteirista
261505|Roteirista cinematográfico|roteirista cinematografico
261505|Roteirista de animação|roteirista de animacao
261505|Roteirista de intervalos comerciais|roteirista de intervalos comerciais
261505|Roteirista de programas de televisão|roteirista de programas de televisao
261505|Roteirista de telenovelas|roteirista de telenovelas
261505|Roteirista-chefe|roteirista-chefe
261510|Crítico de artes plásticas|critico de artes plasticas
261510|Crítico de cinema|critico de cinema
261510|Crítico de dança|critico de danca
261510|Crítico de jornal (ombudsman)|critico de jornal (ombudsman)
261510|Crítico de música|critico de musica
261510|Crítico de rádio|critico de radio
261510|Crítico de teatro|critico de teatro
261510|Crítico de televisão|critico de televisao
261510|Crítico literário|critico literario
261515|Autor de ficção|autor de ficcao
261515|Contista|contista
261515|Cronista de ficção|cronista de ficcao
261515|Dramaturgo|dramaturgo
261515|Ensaísta de ficção|ensaista de ficcao
261515|Escritor de cordel|escritor de cordel
261515|Escritor de folhetim|escritor de folhetim
261515|Escritor de histórias em quadrinhos|escritor de historias em quadrinhos
261515|Escritor de novela de rádio|escritor de novela de radio
261515|Escritor de novela de televisão|escritor de novela de televisao
261515|Escritor de obras educativas de ficção|escritor de obras educativas de ficcao
261515|Fabulista|fabulista
261515|Folclorista de ficção|folclorista de ficcao
261515|Letrista (música)|letrista (musica)
261515|Libretista|libretista
261515|Memorialista de ficção|memorialista de ficcao
261515|Novelista (escritor)|novelista (escritor)
261515|Prosador|prosador
261515|Romancista|romancista
261520|Biógrafo|biografo
261520|Cronista de não ficção|cronista de nao ficcao
261520|Enciclopedista|enciclopedista
261520|Ensaísta de não ficção|ensaista de nao ficcao
261520|Escritor de obra didática|escritor de obra didatica
261520|Escritor de obras científicas|escritor de obras cientificas
261520|Escritor de obras educativas de não ficção|escritor de obras educativas de nao ficcao
261520|Escritor de obras técnicas|escritor de obras tecnicas
261520|Folclorista de não ficção|folclorista de nao ficcao
261520|Memorialista de não ficção|memorialista de nao ficcao
261525|Letrista|letrista
261525|Trovador|trovador
261530|Glossarista|glossarista
261530|Redator de anais|redator de anais
261530|Redator de jornal|redator de jornal
261530|Redator de manuais técnicos|redator de manuais tecnicos
261530|Redator de textos científicos|redator de textos cientificos
261530|Redator de textos comerciais|redator de textos comerciais
261705|Âncora de rádio e tv|ancora de radio e tv
261705|Apresentador de rádio e televisão|apresentador de radio e televisao
261710|Comentarista cultural|comentarista cultural
261710|Comentarista de esportes|comentarista de esportes
261710|Comentarista de jornal|comentarista de jornal
261710|Comentarista de moda|comentarista de moda
261710|Comentarista de rádio e tv|comentarista de radio e tv
261710|Comentarista econômico|comentarista economico
261710|Comentarista esportivo|comentarista esportivo
261710|Comentarista político|comentarista politico
261715|Comunicador de mídias audiovisuais|comunicador de midias audiovisuais
261715|Comunicador de rádio e televisão|comunicador de radio e televisao
261715|Locutor anunciador|locutor anunciador
261715|Locutor apresentador animador|locutor apresentador animador
261715|Locutor comercial|locutor comercial
261715|Locutor de chamadas (promocionais e institucionais)|locutor de chamadas (promocionais e institucionais)
261715|Locutor de notícias|locutor de noticias
261715|Locutor de rádio e tv|locutor de radio e tv
261715|Locutor de telejornal|locutor de telejornal
261715|Locutor esportivo|locutor esportivo
261715|Locutor noticiarista|locutor noticiarista
261715|Locutor publicitário|locutor publicitario
261715|Locutor-operador|locutor-operador
261715|Narrador esportivo|narrador esportivo
261730|Rádio repórter|radio reporter
261730|Repórter de rádio|reporter de radio
261730|Repórter de rádio e tv|reporter de radio e tv
261730|Repórter de televisão|reporter de televisao
261805|Fotógrafo científico|fotografo cientifico
261805|Fotógrafo de aerofotografia|fotografo de aerofotografia
261805|Fotógrafo de arquitetura|fotografo de arquitetura
261805|Fotógrafo de foto submarina|fotografo de foto submarina
261805|Fotógrafo de sensoriamento remoto|fotografo de sensoriamento remoto
261805|Fotógrafo documentarista|fotografo documentarista
261805|Fotógrafo industrial|fotografo industrial
261815|Fotógrafo social|fotografo social
261815|Retratista|retratista
261820|Fotojornalista|fotojornalista
262105|Empresário de espetáculo, tecnólogo em produção cultural|empresario de espetaculo, tecnologo em producao cultural
262110|Produtor de imagem (cinema)|produtor de imagem (cinema)
262110|Produtor de som (cinema)|produtor de som (cinema)
262115|Produtor de som (rádio)|produtor de som (radio)
262120|Produtor de som (teatro)|produtor de som (teatro)
262125|Produtor de imagem (televisão)|produtor de imagem (televisao)
262125|Produtor de programa|produtor de programa
262125|Produtor de som (televisão)|produtor de som (televisao)
262130|Tecnólogo em produção de música eletrônica|tecnologo em producao de musica eletronica
262130|Tecnólogo em produção musical|tecnologo em producao musical
262135|Tecnólogo em produção audiovisual( cinema e vídeo)|tecnologo em producao audiovisual( cinema e video)
262135|Tecnólogo em produção audiovisual( rádio e tv)|tecnologo em producao audiovisual( radio e tv)
262135|Tecnólogo em produção multimídia|tecnologo em producao multimidia
262205|Assistente de direção de cinema|assistente de direcao de cinema
262205|Cineasta|cineasta
262205|Coordenador de direção (cinema)|coordenador de direcao (cinema)
262205|Diretor cinematográfico|diretor cinematografico
262205|Diretor de estúdio cinematográfico|diretor de estudio cinematografico
262215|Diretor de televisão|diretor de televisao
262220|Assistente de direção de teatro|assistente de direcao de teatro
262220|Diretor circense|diretor circense
262220|Encenador teatral|encenador teatral
262220|Ensaiador de teatro|ensaiador de teatro
262220|Gerente de arte teatral|gerente de arte teatral
262225|Gerente de programação|gerente de programacao
262230|Assistente de produção (audiovisual)|assistente de producao (audiovisual)
262230|Coordenador de produção (audiovisual)|coordenador de producao (audiovisual)
262230|Produtor de linha (audiovisual)|produtor de linha (audiovisual)
262230|Supervisor de pós-produção (audiovisual)|supervisor de pos-producao (audiovisual)
262230|Supervisor de produção (audiovisual)|supervisor de producao (audiovisual)
262235|Assistente de direção de arte|assistente de direcao de arte
262235|Diretor criativo|diretor criativo
262240|Assistente de direção de elenco|assistente de direcao de elenco
262240|Assistente de produção de figuração|assistente de producao de figuracao
262240|Diretor de casting|diretor de casting
262240|Produtor de casting|produtor de casting
262240|Produtor de casting em dublagem|produtor de casting em dublagem
262240|Produtor de casting em voz original|produtor de casting em voz original
262240|Produtor de elenco|produtor de elenco
262240|Produtor de figuração|produtor de figuracao
262245|Assistente de diretor de animação|assistente de diretor de animacao
262330|Diretor de arte de animação|diretor de arte de animacao
262335|Ambientador de cenários|ambientador de cenarios
262335|Coordenador de arte (audiovisual)|coordenador de arte (audiovisual)
262335|Decorador de cenas (audiovisual)|decorador de cenas (audiovisual)
262335|Produtor de cenografia|produtor de cenografia
262335|Produtor de objetos de cena (audiovisual)|produtor de objetos de cena (audiovisual)
262335|Produtor de objetos e decoração de cenário e set (audiovisual)|produtor de objetos e decoracao de cenario e set (audiovisual)
262405|Aquarelista|aquarelista
262405|Artesão (artista visual)|artesao (artista visual)
262405|Artista plástico|artista plastico
262405|Caricaturista|caricaturista
262405|Cartunista|cartunista
262405|Ceramista (artes visuais)|ceramista (artes visuais)
262405|Chargista|chargista
262405|Escultor|escultor
262405|Grafiteiro (artes visuais)|grafiteiro (artes visuais)
262405|Gravador (artes visuais)|gravador (artes visuais)
262405|Ilustrador (artes visuais)|ilustrador (artes visuais)
262405|Pintor (artes visuais)|pintor (artes visuais)
262410|Desenhista de editorial|desenhista de editorial
262410|Desenhista de identidade visual|desenhista de identidade visual
262410|Desenhista de páginas da internet (web designer)|desenhista de paginas da internet (web designer)
262410|Desenhista gráfico de embalagem|desenhista grafico de embalagem
262410|Desenhista gráfico de sinalização|desenhista grafico de sinalizacao
262410|Desenhista gráfico de superfície|desenhista grafico de superficie
262410|Desenhista gráfico promocional|desenhista grafico promocional
262410|Tecnólogo em design gráfico|tecnologo em design grafico
262415|Restaurador de obras de arte|restaurador de obras de arte
262420|Desenhista de produto (artigos esportivos)|desenhista de produto (artigos esportivos)
262420|Desenhista de produto (brinquedos)|desenhista de produto (brinquedos)
262420|Desenhista de produto (construção civil)|desenhista de produto (construcao civil)
262420|Desenhista de produto (cuidados pessoais)|desenhista de produto (cuidados pessoais)
262420|Desenhista de produto (eletroeletrônicos e eletrodomésticos)|desenhista de produto (eletroeletronicos e eletrodomesticos)
262420|Desenhista de produto (embalagem)|desenhista de produto (embalagem)
262420|Desenhista de produto (iluminação)|desenhista de produto (iluminacao)
262420|Desenhista de produto (jóias)|desenhista de produto (joias)
262420|Desenhista de produto (máquinas e equipamentos)|desenhista de produto (maquinas e equipamentos)
262420|Desenhista de produto (material promocional)|desenhista de produto (material promocional)
262420|Desenhista de produto (mobiliário)|desenhista de produto (mobiliario)
262420|Desenhista de produto (transporte)|desenhista de produto (transporte)
262420|Desenhista de produto (utensílios domésticos e escritório)|desenhista de produto (utensilios domesticos e escritorio)
262420|Tecnólogo em design de jóias|tecnologo em design de joias
262420|Tecnólogo em design de móveis|tecnologo em design de moveis
262420|Tecnólogo em design de produtos|tecnologo em design de produtos
262425|Desenhista industrial de acessórios|desenhista industrial de acessorios
262425|Desenhista industrial de calçados|desenhista industrial de calcados
262425|Desenhista industrial têxtil|desenhista industrial textil
262425|Estilista de moda|estilista de moda
262425|Tecnólogo em design de moda|tecnologo em design de moda
262430|Artista de efeitos visuais (vfx)|artista de efeitos visuais (vfx)
262430|Artista de jogos eletrônicos|artista de jogos eletronicos
262430|Artista de jogos 2d|artista de jogos 2d
262430|Artista de jogos 3d|artista de jogos 3d
262430|Artista técnico de jogos (tech art)|artista tecnico de jogos (tech art)
262430|Game artist|game artist
262435|Designer de games|designer de games
262435|Game designer|game designer
262440|Escritor de jogos|escritor de jogos
262440|Game writer|game writer
262440|Narrative designer|narrative designer
262440|Roteirista de jogos|roteirista de jogos
262505|Artista de cinema|artista de cinema
262505|Artista de rádio|artista de radio
262505|Artista de teatro|artista de teatro
262505|Artista de televisão|artista de televisao
262505|Artista dramático|artista dramatico
262505|Ator bonequeiro|ator bonequeiro
262505|Ator de cinema|ator de cinema
262505|Ator de rádio|ator de radio
262505|Ator de teatro|ator de teatro
262505|Ator de televisão|ator de televisao
262505|Ator dramático|ator dramatico
262505|Ator dublador|ator dublador
262505|Coadjuvante (artístico)|coadjuvante (artistico)
262505|Comediante|comediante
262505|Contador de história|contador de historia
262505|Declamador|declamador
262505|Dublê|duble
262505|Figurante|figurante
262505|Humorista|humorista
262505|Mímico|mimico
262505|Rádio-ator|radio-ator
262505|Teleator|teleator
262505|Teleatriz|teleatriz
262505|Vedete|vedete
262605|Autor de música|autor de musica
262605|Compositor de música|compositor de musica
262610|Orquestrador|orquestrador
262615|Auxiliar de maestro|auxiliar de maestro
262615|Diretor regente de bateria|diretor regente de bateria
262615|Diretor regente musical|diretor regente musical
262615|Instrutor de banda|instrutor de banda
262615|Instrutor de fanfarra|instrutor de fanfarra
262615|Maestro|maestro
262615|Maestro correpetidor|maestro correpetidor
262615|Maestro de banda|maestro de banda
262615|Mestre de banda|mestre de banda
262615|Mestre de bateria|mestre de bateria
262615|Regente assistente|regente assistente
262615|Regente auxiliar|regente auxiliar
262615|Regente de banda|regente de banda
262615|Regente de coral|regente de coral
262615|Regente de orquestra|regente de orquestra
262615|Regente interno|regente interno
262620|Historiador em música|historiador em musica
262620|Pesquisador em música|pesquisador em musica
262705|Músico intérprete cantor erudito|musico interprete cantor erudito
262705|Músico intérprete cantor popular|musico interprete cantor popular
262710|Músico intérprete instrumentista clássico|musico interprete instrumentista classico
262710|Músico intérprete instrumentista erudito|musico interprete instrumentista erudito
262710|Músico intérprete instrumentista popular|musico interprete instrumentista popular
262810|Bailarino criador|bailarino criador
262810|Bailarino intérprete|bailarino interprete
262810|Dançarino|dancarino
262815|Bailarino coreógrafo|bailarino coreografo
262815|Coreógrafo bailarino|coreografo bailarino
262830|Maître de ballet|maitre de ballet
262905|Ambientador|ambientador
262905|Decorador de interiores|decorador de interiores
262905|Designers de ambientes|designers de ambientes
262905|Designers de interiores|designers de interiores
262905|Planejador de interiores|planejador de interiores
263105|Abade|abade
263105|Abadessa|abadessa
263105|Administrador apostólico|administrador apostolico
263105|Administrador paroquial|administrador paroquial
263105|Agaipi|agaipi
263105|Agbagigan|agbagigan
263105|Agente de pastoral|agente de pastoral
263105|Agonjaí|agonjai
263105|Alabê|alabe
263105|Alapini|alapini
263105|Alayan|alayan
263105|Ancião|anciao
263105|Apóstolo|apostolo
263105|Arcebispo|arcebispo
263105|Arcipreste|arcipreste
263105|Axogum|axogum
263105|Babá de umbanda|baba de umbanda
263105|Babakekerê|babakekere
263105|Babalawô|babalawo
263105|Babalorixá|babalorixa
263105|Babalossain|babalossain
263105|Babaojé|babaoje
263105|Bikkhu|bikkhu
263105|Bikkuni|bikkuni
263105|Bispo|bispo
263105|Bispo auxiliar|bispo auxiliar
263105|Bispo coadjutor|bispo coadjutor
263105|Bispo emérito|bispo emerito
263105|Cambono|cambono
263105|Capelão|capelao
263105|Cardeal|cardeal
263105|Clérigo|clerigo
263105|Cônega|conega
263105|Cônego|conego
263105|Confessor|confessor
263105|Cura|cura
263105|Curimbeiro|curimbeiro
263105|Dabôce|daboce
263105|Dada voduno|dada voduno
263105|Dáia|daia
263105|Daiosho|daiosho
263105|Deré|dere
263105|Diácono|diacono
263105|Diácono permanente|diacono permanente
263105|Dirigente espiritual de umbanda|dirigente espiritual de umbanda
263105|Dom|dom
263105|Doné|done
263105|Doté|dote
263105|Egbonmi|egbonmi
263105|Ekêdi|ekedi
263105|Episcopiza|episcopiza
263105|Evangelista|evangelista
263105|Frade|frade
263105|Frei|frei
263105|Freira|freira
263105|Gaiaku|gaiaku
263105|Gãtó|gato
263105|Gheshe|gheshe
263105|Humbono|humbono
263105|Hunjaí|hunjai
263105|Huntó|hunto
263105|Instrutor de curimba|instrutor de curimba
263105|Instrutor leigo de meditação budista|instrutor leigo de meditacao budista
263105|Irmã|irma
263105|Irmão|irmao
263105|Iyakekerê|iyakekere
263105|Iyalorixá|iyalorixa
263105|Iyamorô|iyamoro
263105|Iyawo|iyawo
263105|Izadioncoé|izadioncoe
263105|Kambondo pokó|kambondo poko
263105|Kantoku (diretor de missão)|kantoku (diretor de missao)
263105|Kunhã-karaí|kunha-karai
263105|Kyôshi (mestre)|kyoshi (mestre)
263105|Lama budista tibetano|lama budista tibetano
263105|Madre superiora|madre superiora
263105|Madrinha de umbanda|madrinha de umbanda
263105|Mameto ndenge|mameto ndenge
263105|Mameto nkisi|mameto nkisi
263105|Mejitó|mejito
263105|Meôncia|meoncia
263105|Metropolita|metropolita
263105|Monge|monge
263105|Monge budista|monge budista
263105|Monge oficial responsável por templo budista (Jushoku)|monge oficial responsavel por templo budista (jushoku)
263105|Monsenhor|monsenhor
263105|Mosoyoyó|mosoyoyo
263105|Muézin|muezin
263105|Muzenza|muzenza
263105|Nhanderú arandú|nhanderu arandu
263105|Nisosan|nisosan
263105|Nochê|noche
263105|Noviço|novico
263105|Oboosan|oboosan
263105|Olorixá|olorixa
263105|Osho|osho
263105|Padre|padre
263105|Padrinho de umbanda|padrinho de umbanda
263105|Pagé|page
263105|Pároco|paroco
263105|Pastor evangélico|pastor evangelico
263105|Pegigan|pegigan
263105|Pontífice|pontifice
263105|Pope|pope
263105|Prelado|prelado
263105|Presbítero|presbitero
263105|Primaz|primaz
263105|Prior|prior
263105|Prioressa|prioressa
263105|Rabino|rabino
263105|Reitor|reitor
263105|Religiosa|religiosa
263105|Religioso leigo|religioso leigo
263105|Reverendo|reverendo
263105|Rimban (reitor de templo provincial)|rimban (reitor de templo provincial)
263105|Roshi|roshi
263105|Sacerdote|sacerdote
263105|Sacerdotisa|sacerdotisa
263105|Sheikh|sheikh
263105|Sóchó (superior de missão)|socho (superior de missao)
263105|Sokan|sokan
263105|Superintendente de culto religioso|superintendente de culto religioso
263105|Superior de culto religioso|superior de culto religioso
263105|Superior geral|superior geral
263105|Superiora de culto religioso|superiora de culto religioso
263105|Swami|swami
263105|Tata kisaba|tata kisaba
263105|Tata nkisi|tata nkisi
263105|Tateto ndenge|tateto ndenge
263105|Testemunha qualificada do matrimônio|testemunha qualificada do matrimonio
263105|Toy hunji|toy hunji
263105|Toy vodunnon|toy vodunnon
263105|Upasaka|upasaka
263105|Upasika|upasika
263105|Vigário|vigario
263105|Voduno ( ministro de culto religioso)|voduno ( ministro de culto religioso)
263105|Vodunsi (ministro de culto religioso)|vodunsi (ministro de culto religioso)
263105|Vodunsi poncilê (ministro de culto religioso)|vodunsi poncile (ministro de culto religioso)
263105|Xeramõe (ministro de culto religioso)|xeramoe (ministro de culto religioso)
263105|Xondaria (ministro de culto religioso)|xondaria (ministro de culto religioso)
263105|Xondáro (ministro de culto religioso)|xondaro (ministro de culto religioso)
263105|Ywyrájá (ministro de culto religioso)|ywyraja (ministro de culto religioso)
263110|Bikku - bikkhuni|bikku - bikkhuni
263110|Jushoku|jushoku
263110|Kaikyôshi|kaikyoshi
263110|Lama tibetano|lama tibetano
263110|Missionário leigo|missionario leigo
263110|Missionário religioso|missionario religioso
263110|Missionário sacerdote|missionario sacerdote
263110|Obreiro bíblico|obreiro biblico
263110|Pastor|pastor
263110|Pastor evangelista|pastor evangelista
263110|Sóchó|socho
263110|Swami (missionário)|swami (missionario)
263110|Zenji (missionário)|zenji (missionario)
263115|Agbá|agba
263115|Álim|alim
263115|Bokonô|bokono
263115|Cádi|cadi
263115|Consagrado|consagrado
263115|Conselheiro correicional eclesiástico|conselheiro correicional eclesiastico
263115|Conselheiro do tribunal eclesiástico|conselheiro do tribunal eclesiastico
263115|Especialista em história da tradição, doutrina e textos sagrados|especialista em historia da tradicao, doutrina e textos sagrados
263115|Exegeta|exegeta
263115|Imã|ima
263115|Juiz do tribunal eclesiástico|juiz do tribunal eclesiastico
263115|Leigo consagrado|leigo consagrado
263115|Mufti|mufti
263115|Obá|oba
263115|Teóloga|teologa
271105|Chef|chef
271105|Chefe de partida|chefe de partida
271105|Chefe executivo de cozinha|chefe executivo de cozinha
271105|Encarregado de cozinha|encarregado de cozinha
271105|Subchefe de cozinha|subchefe de cozinha
271105|Supervisor de cozinha|supervisor de cozinha
271110|Gastrólogo|gastrologo
300105|Técnico em automação industrial|tecnico em automacao industrial
300105|Técnico em manutenção mecatrônica|tecnico em manutencao mecatronica
300305|Auxiliar técnico de instalações eletromecânicas|auxiliar tecnico de instalacoes eletromecanicas
300305|Reparador de equipamentos elétricos e eletrônicos|reparador de equipamentos eletricos e eletronicos
301105|Auxiliar de laboratorista (indústria)|auxiliar de laboratorista (industria)
301105|Laboratorista - exclusive análises clínicas|laboratorista - exclusive analises clinicas
301105|Laboratorista de ensaios mecânicos|laboratorista de ensaios mecanicos
301105|Laboratorista de ensaios químicos|laboratorista de ensaios quimicos
301105|Laboratorista industrial|laboratorista industrial
301105|Laboratorista químico|laboratorista quimico
301105|Laboratorista têxtil|laboratorista textil
301110|Analista de areias em fundição|analista de areias em fundicao
301110|Auxiliar de laboratorista de solo|auxiliar de laboratorista de solo
301110|Auxiliar de laboratorista de solos e de concreto|auxiliar de laboratorista de solos e de concreto
301110|Laboratorista de concreto|laboratorista de concreto
301110|Laboratorista de ensaios de areia de fundição|laboratorista de ensaios de areia de fundicao
301110|Laboratorista de materiais de construção|laboratorista de materiais de construcao
301110|Laboratorista de solos|laboratorista de solos
301110|Laboratorista (ensaios de areia)|laboratorista (ensaios de areia)
301110|Laboratorista (solos e materiais de construção)|laboratorista (solos e materiais de construcao)
301115|Analista de laboratório químico  (petróleo)|analista de laboratorio quimico  (petroleo)
301115|Analista químico (petróleo)|analista quimico (petroleo)
301115|Técnico de análise de óleos e graxas|tecnico de analise de oleos e graxas
301115|Técnico de laboratório de análises físico-químicas (petróleo)|tecnico de laboratorio de analises fisico-quimicas (petroleo)
311105|Analista de laboratório químico|analista de laboratorio quimico
311105|Analista de produtos químicos|analista de produtos quimicos
311105|Analista de tratamento de água|analista de tratamento de agua
311105|Analista químico|analista quimico
311105|Técnico de análise química|tecnico de analise quimica
311105|Técnico de ciências químicas|tecnico de ciencias quimicas
311105|Técnico de desenvolvimento de análise química|tecnico de desenvolvimento de analise quimica
311105|Técnico de indústria química|tecnico de industria quimica
311105|Técnico de laboratório - exclusive análises clínicas|tecnico de laboratorio - exclusive analises clinicas
311105|Técnico de laboratório de água e esgotos|tecnico de laboratorio de agua e esgotos
311105|Técnico de sistema de tratamento de água|tecnico de sistema de tratamento de agua
311105|Técnico químico - exclusive análises químicas|tecnico quimico - exclusive analises quimicas
311105|Técnico químico industrial|tecnico quimico industrial
311115|Técnico químico em couro|tecnico quimico em couro
311115|Técnico químico em curtimento|tecnico quimico em curtimento
311205|Técnico de indústria  petroquímica|tecnico de industria  petroquimica
311205|Técnico de processamento industrial (petroquímica)|tecnico de processamento industrial (petroquimica)
311205|Técnico de processo petroquímico|tecnico de processo petroquimico
311205|Técnico de produção (gás combustível)|tecnico de producao (gas combustivel)
311205|Técnico de produção (petroquímica)|tecnico de producao (petroquimica)
311205|Técnico de sistemas industriais (petroquímica)|tecnico de sistemas industriais (petroquimica)
311205|Técnico em refinação de petróleo|tecnico em refinacao de petroleo
311205|Técnico petroquímico|tecnico petroquimico
311305|Técnico ceramista|tecnico ceramista
311305|Técnico em cerâmica|tecnico em ceramica
311305|Técnico em vidros|tecnico em vidros
311405|Técnico de processos (borracha)|tecnico de processos (borracha)
311405|Técnico em injeção (borracha)|tecnico em injecao (borracha)
311405|Técnico em laboratório (borracha)|tecnico em laboratorio (borracha)
311405|Técnico químico em borracha|tecnico quimico em borracha
311410|Técnico de processos (plástico)|tecnico de processos (plastico)
311410|Técnico em injeção (plástico)|tecnico em injecao (plastico)
311410|Técnico em laboratório (plástico)|tecnico em laboratorio (plastico)
311410|Técnico químico (plástico)|tecnico quimico (plastico)
311505|Técnico de gestão do meio ambiente|tecnico de gestao do meio ambiente
311505|Técnico de saneamento e controle ambiental|tecnico de saneamento e controle ambiental
311510|Técnico hidrometrista|tecnico hidrometrista
311515|Auxiliar técnico de centro de operação do sistema de energia|auxiliar tecnico de centro de operacao do sistema de energia
311515|Auxiliar técnico de distribuição de energia|auxiliar tecnico de distribuicao de energia
311515|Auxiliar técnico de geração de energia|auxiliar tecnico de geracao de energia
311515|Laboratorista de água e controle ambiental|laboratorista de agua e controle ambiental
311515|Técnico de abastecimento, captação e distribuição de água|tecnico de abastecimento, captacao e distribuicao de agua
311515|Técnico de avaliação de capacidade de estação de tratamento e distribuição de água e esgoto|tecnico de avaliacao de capacidade de estacao de tratamento e distribuicao de agua e esgoto
311515|Técnico de central térmica|tecnico de central termica
311520|Analista de estação de tratamento de efluentes|analista de estacao de tratamento de efluentes
311610|Técnico têxtil (beneficiamento)|tecnico textil (beneficiamento)
311615|Técnico de fiação|tecnico de fiacao
311710|Tingidor de fios|tingidor de fios
311710|Tingidor de tecidos|tingidor de tecidos
311715|Colorista|colorista
311715|Cromista|cromista
311715|Preparador de pastas (na fabricação de tintas)|preparador de pastas (na fabricacao de tintas)
311725|Alvejador de couros|alvejador de couros
311725|Alvejador de sola|alvejador de sola
311725|Brazidor de curtume|brazidor de curtume
311725|Colorista - na indústria do couro|colorista - na industria do couro
311725|Colorista de couro|colorista de couro
311725|Marroquineiro|marroquineiro
311725|Operador de máquina de alvejar (couros)|operador de maquina de alvejar (couros)
311725|Pintor de couros e peles à mão|pintor de couros e peles a mao
311725|Pintor de couros e peles à pistola|pintor de couros e peles a pistola
312105|Assistente de engenharia (construção civil)|assistente de engenharia (construcao civil)
312105|Auxiliar técnico de engenharia (construção civil)|auxiliar tecnico de engenharia (construcao civil)
312105|Fiscal de medição (obras civis)|fiscal de medicao (obras civis)
312105|Inspetor de obras|inspetor de obras
312105|Técnico de analista de custos (construção civil)|tecnico de analista de custos (construcao civil)
312105|Técnico de construção civil|tecnico de construcao civil
312105|Técnico de edificações|tecnico de edificacoes
312105|Técnico de edificações, estradas e saneamento|tecnico de edificacoes, estradas e saneamento
312105|Técnico de engenharia civil|tecnico de engenharia civil
312105|Técnico de manutenção de obras|tecnico de manutencao de obras
312105|Técnico de obras|tecnico de obras
312105|Técnico de planejamento de obras|tecnico de planejamento de obras
312105|Técnico em canteiro de obras de construção civil|tecnico em canteiro de obras de construcao civil
312105|Técnico em desenho de construção civil|tecnico em desenho de construcao civil
312105|Técnico em laboratório e campo de construção civil|tecnico em laboratorio e campo de construcao civil
312105|Técnico orçamentista de obras na construção civil|tecnico orcamentista de obras na construcao civil
312205|Assistente técnico de engenharia (obras de infra-estrutura de estrada)|assistente tecnico de engenharia (obras de infra-estrutura de estrada)
312205|Auxiliar técnico de conservação de estradas, caminhos e pontes|auxiliar tecnico de conservacao de estradas, caminhos e pontes
312205|Auxiliar técnico em obras de infra-estrutura de estradas|auxiliar tecnico em obras de infra-estrutura de estradas
312205|Técnico de construção de estradas|tecnico de construcao de estradas
312205|Técnico de inspeção e especificação de materiais e equipamentos de construção de estradas|tecnico de inspecao e especificacao de materiais e equipamentos de construcao de estradas
312205|Técnico de projetos e obras de infra-estrutura de estradas|tecnico de projetos e obras de infra-estrutura de estradas
312205|Técnico de transporte ferroviário|tecnico de transporte ferroviario
312205|Técnico em construção civil de obras de infra-estrutura de estradas|tecnico em construcao civil de obras de infra-estrutura de estradas
312205|Técnico em planejamento de obras de infra-estrutura de estradas|tecnico em planejamento de obras de infra-estrutura de estradas
312210|Assistente técnico de engenharia de obras de saneamento|assistente tecnico de engenharia de obras de saneamento
312210|Auxiliar técnico de obras saneamento|auxiliar tecnico de obras saneamento
312210|Técnico de inspeção e especificação de materiais e equipamentos de obras de saneamento|tecnico de inspecao e especificacao de materiais e equipamentos de obras de saneamento
312210|Técnico de redes de água e esgoto|tecnico de redes de agua e esgoto
312210|Técnico em construção civil (obras de saneamento)|tecnico em construcao civil (obras de saneamento)
312210|Técnico em hidrometria (obras de saneamento)|tecnico em hidrometria (obras de saneamento)
312210|Técnico em planejamento de obras de infra-estrutura de saneamento|tecnico em planejamento de obras de infra-estrutura de saneamento
312210|Técnico em sondagem (obras de saneamento)|tecnico em sondagem (obras de saneamento)
312315|Auxiliar técnico de hidrografia|auxiliar tecnico de hidrografia
312315|Hidrotécnico|hidrotecnico
312320|Auxiliar de topógrafo|auxiliar de topografo
312320|Greidista|greidista
313105|Auxiliar de eletrotécnico|auxiliar de eletrotecnico
313105|Técnico de ensaios elétricos|tecnico de ensaios eletricos
313105|Técnico de operação eletrotécnica|tecnico de operacao eletrotecnica
313110|Projetista elétrico|projetista eletrico
313110|Técnico de comandos e controle|tecnico de comandos e controle
313110|Técnico de projeto (eletrotécnico)|tecnico de projeto (eletrotecnico)
313115|Encarregado de manutenção|encarregado de manutencao
313115|Encarregado de montagem|encarregado de montagem
313115|Supervisor de manutenção de máquinas e equipamentos|supervisor de manutencao de maquinas e equipamentos
313115|Supervisor de montagem|supervisor de montagem
313120|Técnico de manutenção industrial|tecnico de manutencao industrial
313125|Técnico em ferramentas elétricas|tecnico em ferramentas eletricas
313130|Técnico de eletricidade|tecnico de eletricidade
313130|Técnico de equipamentos elétricos|tecnico de equipamentos eletricos
313130|Técnico de projetos elétricos|tecnico de projetos eletricos
313205|Eletrônico de manutenção|eletronico de manutencao
313205|Reparador técnico|reparador tecnico
313205|Técnico de controle de processo de manutenção eletrônica|tecnico de controle de processo de manutencao eletronica
313205|Técnico de manutenção de computador|tecnico de manutencao de computador
313205|Técnico de produção eletrônica|tecnico de producao eletronica
313205|Técnico eletrônico de processo|tecnico eletronico de processo
313205|Técnico instrumentista|tecnico instrumentista
313210|Técnico eletrônico de manutenção industrial|tecnico eletronico de manutencao industrial
313215|Auxiliar de eletrônica|auxiliar de eletronica
313215|Auxiliar de técnico de eletrônica|auxiliar de tecnico de eletronica
313215|Auxiliar técnico eletrônico|auxiliar tecnico eletronico
313215|Eletrônico de rádio e televisão|eletronico de radio e televisao
313215|Laboratorista de ensaios eletrônicos|laboratorista de ensaios eletronicos
313215|Técnico de balanças (eletrônicas)|tecnico de balancas (eletronicas)
313215|Técnico de indústria eletrônica|tecnico de industria eletronica
313215|Técnico de laboratório de eletrônica de automação|tecnico de laboratorio de eletronica de automacao
313215|Técnico de rádio e televisão|tecnico de radio e televisao
313215|Técnico de sistema automação industrial|tecnico de sistema automacao industrial
313215|Técnico eletrônico em geral|tecnico eletronico em geral
313305|Técnico de dados (telecomunicações)|tecnico de dados (telecomunicacoes)
313305|Técnico de teleprocessamento|tecnico de teleprocessamento
313315|Analisador de tráfego telefônico|analisador de trafego telefonico
313315|Inspetor de centrais privadas de comutação telefônica|inspetor de centrais privadas de comutacao telefonica
313315|Técnico de comutação telefônica|tecnico de comutacao telefonica
313315|Técnico de manipulação de tráfego telefônico|tecnico de manipulacao de trafego telefonico
313315|Técnico de manutenção de equipamento de comutação telefônica|tecnico de manutencao de equipamento de comutacao telefonica
313315|Técnico de operações de telecomunicações|tecnico de operacoes de telecomunicacoes
313315|Técnico de telefonia|tecnico de telefonia
313320|Técnico de manutenção de equipamento de transmissão|tecnico de manutencao de equipamento de transmissao
313505|Técnico em equipamentos ópticos|tecnico em equipamentos opticos
313505|Técnico em fibras ópticas|tecnico em fibras opticas
313505|Técnico em instalação de sistemas ópticos|tecnico em instalacao de sistemas opticos
313505|Técnico em laboratório óptico|tecnico em laboratorio optico
313505|Técnico em laser|tecnico em laser
313505|Técnico em materiais ópticos|tecnico em materiais opticos
313505|Técnico em medidas ópticas|tecnico em medidas opticas
313505|Técnico em polimento de superfície óptica|tecnico em polimento de superficie optica
314105|Técnico mecânico na fabricação de máquinas, sistemas e instrumentos|tecnico mecanico na fabricacao de maquinas, sistemas e instrumentos
314105|Técnico mecânico na montagem de máquinas, sistemas e instrumentos|tecnico mecanico na montagem de maquinas, sistemas e instrumentos
314110|Auxiliar técnico de mecânica|auxiliar tecnico de mecanica
314110|Programador de usinagem|programador de usinagem
314110|Técnico de projetos mecânicos|tecnico de projetos mecanicos
314110|Técnico mecânico de processos|tecnico mecanico de processos
314110|Técnico mecânico em automação|tecnico mecanico em automacao
314110|Técnico mecânico (energia nuclear)|tecnico mecanico (energia nuclear)
314110|Técnico mecânico (equipamentos médicos e odontológicos)|tecnico mecanico (equipamentos medicos e odontologicos)
314110|Técnico mecânico montador|tecnico mecanico montador
314115|Auxiliar técnico de refrigeração|auxiliar tecnico de refrigeracao
314115|Técnico de refrigeração (fabricação)|tecnico de refrigeracao (fabricacao)
314115|Técnico mecânico em ar condicionado|tecnico mecanico em ar condicionado
314120|Auxiliar técnico na mecânica de máquinas|auxiliar tecnico na mecanica de maquinas
314125|Inspetor de máquinas e motores|inspetor de maquinas e motores
314125|Projetista de motores|projetista de motores
314205|Especialista em ferramentas (técnico mecânico na fabricação de ferramentas)|especialista em ferramentas (tecnico mecanico na fabricacao de ferramentas)
314205|Planejador de processos (fabricação de ferramentas)|planejador de processos (fabricacao de ferramentas)
314205|Técnico em desenvolvimento de processos (fabricação de ferramentas)|tecnico em desenvolvimento de processos (fabricacao de ferramentas)
314205|Técnico em desenvolvimento de produtos (ferramentas mecânicas)|tecnico em desenvolvimento de produtos (ferramentas mecanicas)
314205|Técnico em métodos e processos (fabricação de ferramentas)|tecnico em metodos e processos (fabricacao de ferramentas)
314210|Especialista em ferramentas (técnico mecânico na manutenção de ferramentas)|especialista em ferramentas (tecnico mecanico na manutencao de ferramentas)
314210|Planejador de processos (manutenção de ferramentas)|planejador de processos (manutencao de ferramentas)
314210|Técnico em desenvolvimento de processos (manutenção de ferramentas)|tecnico em desenvolvimento de processos (manutencao de ferramentas)
314305|Técnico automotivo|tecnico automotivo
314310|Técnico aeronáutico|tecnico aeronautico
314310|Técnico de manutenção aeronáutica|tecnico de manutencao aeronautica
314310|Técnico de manutenção de aeronaves|tecnico de manutencao de aeronaves
314310|Técnico de manutenção de sistemas de aeronaves|tecnico de manutencao de sistemas de aeronaves
314310|Técnico montador de aeronaves|tecnico montador de aeronaves
314315|Técnico mecânico naval|tecnico mecanico naval
314315|Técnico naval|tecnico naval
314610|Técnico de ensaios mecânicos (caldeiraria)|tecnico de ensaios mecanicos (caldeiraria)
314610|Técnico de montagem (caldeiraria)|tecnico de montagem (caldeiraria)
314610|Técnico de tubulação (caldeiraria)|tecnico de tubulacao (caldeiraria)
314615|Inspetor dimensional (estruturas metálicas)|inspetor dimensional (estruturas metalicas)
314615|Técnico de planejamento da indústria metalúrgica (estruturas metálicas)|tecnico de planejamento da industria metalurgica (estruturas metalicas)
314620|Laboratorista metalográfico (soldagem)|laboratorista metalografico (soldagem)
314620|Metalógrafo (técnico)|metalografo (tecnico)
314620|Técnico de inspeção da indústria metalúrgica|tecnico de inspecao da industria metalurgica
314620|Técnico de planejamento da indústria metalúrgica (soldagem)|tecnico de planejamento da industria metalurgica (soldagem)
314620|Técnico de tratamento térmico (metalurgia)|tecnico de tratamento termico (metalurgia)
314620|Técnico em metalurgia (soldagem)|tecnico em metalurgia (soldagem)
314705|Técnico de linhas de acabamento em siderurgia|tecnico de linhas de acabamento em siderurgia
314710|Técnico de alto-forno em siderurgia|tecnico de alto-forno em siderurgia
314710|Técnico de controle de lingoteira|tecnico de controle de lingoteira
314710|Técnico de convertedor de aciaria em siderurgia|tecnico de convertedor de aciaria em siderurgia
314710|Técnico de lingotamento|tecnico de lingotamento
314715|Assistente técnico de fundição em siderurgia|assistente tecnico de fundicao em siderurgia
314715|Auxiliar técnico de fundição em siderurgia|auxiliar tecnico de fundicao em siderurgia
314715|Projetista de fundição em siderurgia|projetista de fundicao em siderurgia
314805|Inspetor de equipamentos (estruturas metálicas)|inspetor de equipamentos (estruturas metalicas)
314805|Inspetor dimensional (estruturas metálicas)|inspetor dimensional (estruturas metalicas)
314810|Inspetor de fabricação (acessórios de tubulação)|inspetor de fabricacao (acessorios de tubulacao)
314810|Inspetor de fabricação (caldeiraria e tubulação)|inspetor de fabricacao (caldeiraria e tubulacao)
314810|Inspetor de fabricação (elétrica/instrumentação)|inspetor de fabricacao (eletrica/instrumentacao)
314810|Inspetor de fabricação (mecânica)|inspetor de fabricacao (mecanica)
314810|Inspetor de fabricação (perfuração e produção de petróleo)|inspetor de fabricacao (perfuracao e producao de petroleo)
314810|Inspetor de fabricação (tubos flexíveis e umbilicais)|inspetor de fabricacao (tubos flexiveis e umbilicais)
314815|Inspetor de ensaios não destrutivos (correntes parasitas)|inspetor de ensaios nao destrutivos (correntes parasitas)
314815|Inspetor de ensaios não destrutivos (emissão acústica)|inspetor de ensaios nao destrutivos (emissao acustica)
314815|Inspetor de ensaios não destrutivos (estanqueidade)|inspetor de ensaios nao destrutivos (estanqueidade)
314815|Inspetor de ensaios não destrutivos (líquido penetrante)|inspetor de ensaios nao destrutivos (liquido penetrante)
314815|Inspetor de ensaios não destrutivos (partícula magnética)|inspetor de ensaios nao destrutivos (particula magnetica)
314815|Inspetor de ensaios não destrutivos (radiográfico)|inspetor de ensaios nao destrutivos (radiografico)
314815|Inspetor de ensaios não destrutivos (termografia)|inspetor de ensaios nao destrutivos (termografia)
314815|Inspetor de ensaios não destrutivos (teste por pontos)|inspetor de ensaios nao destrutivos (teste por pontos)
314815|Inspetor de ensaios não destrutivos (ultrassom)|inspetor de ensaios nao destrutivos (ultrassom)
314815|Inspetor de ensaios não destrutivos (visual)|inspetor de ensaios nao destrutivos (visual)
314825|Inspetor de dutos terrestres|inspetor de dutos terrestres
314830|Inspetor de controle dimensional (caldeiraria e tubulação)|inspetor de controle dimensional (caldeiraria e tubulacao)
314830|Inspetor de controle dimensional (mecânica)|inspetor de controle dimensional (mecanica)
314830|Inspetor de controle dimensional (montagem de máquinas)|inspetor de controle dimensional (montagem de maquinas)
314830|Inspetor de controle dimensional (topografia)|inspetor de controle dimensional (topografia)
314840|Inspetor de manutenção (elétrica e instrumentação)|inspetor de manutencao (eletrica e instrumentacao)
314840|Inspetor de manutenção (mecânica)|inspetor de manutencao (mecanica)
316110|Técnico de metalografia e petrografia|tecnico de metalografia e petrografia
316110|Técnico de mineração (pesquisa geológica)|tecnico de mineracao (pesquisa geologica)
316110|Técnico de pesquisa mineral|tecnico de pesquisa mineral
316305|Técnico de mineração (águas subterrâneas)|tecnico de mineracao (aguas subterraneas)
316305|Técnico de mineração (minerais sólidos)|tecnico de mineracao (minerais solidos)
316305|Técnico de mineração (tóriom zircônio e outros minerais raros)|tecnico de mineracao (toriom zirconio e outros minerais raros)
316305|Técnico de perfuração (minas)|tecnico de perfuracao (minas)
316305|Técnico de recursos minerais|tecnico de recursos minerais
316310|Técnico de produção na extração de petróleo|tecnico de producao na extracao de petroleo
316310|Técnico em exploração de petróleo|tecnico em exploracao de petroleo
316310|Técnico na extração de petróleo e gás natural|tecnico na extracao de petroleo e gas natural
316315|Técnico de processos minerais|tecnico de processos minerais
316315|Técnico especializado em produção mineral|tecnico especializado em producao mineral
316320|Prospector|prospector
316325|Técnico de operação em refino de petróleo e gás|tecnico de operacao em refino de petroleo e gas
316325|Técnico de processamento em refino de petróleo e gás|tecnico de processamento em refino de petroleo e gas
316325|Técnico em processamento mineral (petróleo)|tecnico em processamento mineral (petroleo)
316335|Desincrustador de poços de petróleo e gás|desincrustador de pocos de petroleo e gas
317105|Desenvolvedor de back-end|desenvolvedor de back-end
317105|Desenvolvedor de banco de dados (dba)|desenvolvedor de banco de dados (dba)
317105|Desenvolvedor de front-end|desenvolvedor de front-end
317105|Desenvolvedor de internet (técnico)|desenvolvedor de internet (tecnico)
317105|Desenvolvedor de plataforma web (técnico)|desenvolvedor de plataforma web (tecnico)
317105|Desenvolvedor web full-stack|desenvolvedor web full-stack
317105|Programador de internet|programador de internet
317110|Desenvolvedor de sustentação de ti (técnico)|desenvolvedor de sustentacao de ti (tecnico)
317110|Programador de sistemas de computador|programador de sistemas de computador
317110|Programador de sistemas de informação|programador de sistemas de informacao
317110|Técnico de desenvolvimento de sistemas (ti)|tecnico de desenvolvimento de sistemas (ti)
317110|Técnico de desenvolvimento de software|tecnico de desenvolvimento de software
317110|Técnico em programação de computador|tecnico em programacao de computador
317120|Desenvolvedor de games|desenvolvedor de games
317120|Desenvolvedor de jogos|desenvolvedor de jogos
317120|Desenvolvedor de jogos para computador|desenvolvedor de jogos para computador
317120|Desenvolvedor de multimídia|desenvolvedor de multimidia
317120|Desenvolvedor mobile|desenvolvedor mobile
317120|Programador de aplicativos educacionais e de entretenimento|programador de aplicativos educacionais e de entretenimento
317120|Programador de comunicação de sistemas|programador de comunicacao de sistemas
317120|Programador de comunicação visual e sonora de sistemas|programador de comunicacao visual e sonora de sistemas
317120|Programador de multimídia|programador de multimidia
317205|Operador de computador (inclusive microcomputador|operador de computador (inclusive microcomputador
317205|Operador de sistema de computador|operador de sistema de computador
317205|Operador de sistemas computacionais em rede|operador de sistemas computacionais em rede
317210|Analista de service desk|analista de service desk
317210|Assistente de service desk|assistente de service desk
317210|Técnico de apoio ao usuário de informática (helpdesk)|tecnico de apoio ao usuario de informatica (helpdesk)
317210|Técnico de suporte de ti|tecnico de suporte de ti
318005|Desenhista técnico auxiliar|desenhista tecnico auxiliar
318010|Copista de croqui|copista de croqui
318010|Desenhista copista  (cad)|desenhista copista  (cad)
318010|Operador de cad (copista)|operador de cad (copista)
318015|Desenhista detalhista (cad)|desenhista detalhista (cad)
318015|Desenhista técnico detalhista|desenhista tecnico detalhista
318015|Detalhista em desenho técnico|detalhista em desenho tecnico
318105|Cadista (desenhista técnico de arquitetura)|cadista (desenhista tecnico de arquitetura)
318105|Desenhista copista (arquitetura)|desenhista copista (arquitetura)
318105|Desenhista de arquitetura|desenhista de arquitetura
318110|Desenhista de cartografia|desenhista de cartografia
318110|Desenhista técnico de topografia|desenhista tecnico de topografia
318115|Desenhista de estrutura metálica (construção civil)|desenhista de estrutura metalica (construcao civil)
318115|Desenhista técnico de engenharia civil|desenhista tecnico de engenharia civil
318120|Desenhista de instalações de combate a incêndio|desenhista de instalacoes de combate a incendio
318120|Desenhista de instalações hidráulicas|desenhista de instalacoes hidraulicas
318120|Desenhista técnico de hidráulica|desenhista tecnico de hidraulica
318205|Desenhista de carrocerias|desenhista de carrocerias
318205|Desenhista de estruturas metálicas (mecânica)|desenhista de estruturas metalicas (mecanica)
318205|Desenhista de ferramentas (mecânica)|desenhista de ferramentas (mecanica)
318205|Desenhista de instalações mecânicas|desenhista de instalacoes mecanicas
318205|Desenhista de tubulação (mecânica)|desenhista de tubulacao (mecanica)
318205|Desenhista mecânico|desenhista mecanico
318205|Desenhista técnico de ferramentas|desenhista tecnico de ferramentas
318205|Desenhista técnico de máquinas|desenhista tecnico de maquinas
318205|Desenhista técnico de tubulação|desenhista tecnico de tubulacao
318210|Desenhista técnico de aeronaves|desenhista tecnico de aeronaves
318305|Desenhista de leiaute de circuito impresso|desenhista de leiaute de circuito impresso
318305|Desenhista técnico eletromecânica|desenhista tecnico eletromecanica
318305|Desenhista técnico em eletricidade|desenhista tecnico em eletricidade
318305|Desenhista técnico em eletroeletrônica|desenhista tecnico em eletroeletronica
318305|Desenhista técnico em eletrônica|desenhista tecnico em eletronica
318310|Desenhista técnico em calefação|desenhista tecnico em calefacao
318310|Desenhista técnico em refrigeração|desenhista tecnico em refrigeracao
318310|Desenhista técnico em ventilação|desenhista tecnico em ventilacao
318405|Arte-finalista (desenhista técnico de artes gráficas)|arte-finalista (desenhista tecnico de artes graficas)
318405|Desenhista  técnico de arte-final|desenhista  tecnico de arte-final
318410|Desenhista de desenho animado|desenhista de desenho animado
318410|Desenhista de filatelia  (selos)|desenhista de filatelia  (selos)
318415|Desenhista letrista|desenhista letrista
318420|Desenhista de fotoestamparia|desenhista de fotoestamparia
318420|Desenhista têxtil|desenhista textil
318425|Desenhista de móveis|desenhista de moveis
318430|Desenhista de embalagens|desenhista de embalagens
318430|Desenhista de leiautes|desenhista de leiautes
318430|Desenhista maquetista|desenhista maquetista
318505|Auxiliar de arquitetura|auxiliar de arquitetura
318505|Desenhista calculista|desenhista calculista
318505|Desenhista detalhista na arquitetura|desenhista detalhista na arquitetura
318505|Projetista na arquitetura|projetista na arquitetura
318510|Auxiliar de engenheiro da construção civil|auxiliar de engenheiro da construcao civil
318510|Desenhista calculista na construção civil|desenhista calculista na construcao civil
318510|Desenhista detalhista na construção civil|desenhista detalhista na construcao civil
318510|Projetista na construção civil|projetista na construcao civil
318610|Desenhista projetista de ferramentas|desenhista projetista de ferramentas
318610|Desenhista projetista de moldes|desenhista projetista de moldes
318610|Desenhista projetista de produtos (mecânica)|desenhista projetista de produtos (mecanica)
318610|Projetista de ferramentas|projetista de ferramentas
318610|Projetista de matrizes|projetista de matrizes
318610|Projetista de moldes|projetista de moldes
318705|Desenhista projetista eletroeletrônico|desenhista projetista eletroeletronico
318705|Projetista de eletricidade|projetista de eletricidade
318705|Projetista de instalações elétricas|projetista de instalacoes eletricas
318705|Projetista de instrumentos elétricos|projetista de instrumentos eletricos
318705|Projetista eletroeletrônico|projetista eletroeletronico
318705|Projetista eletrotécnico|projetista eletrotecnico
318710|Desenhista projetista de circuitos impressos|desenhista projetista de circuitos impressos
318710|Leiautista de circuitos impressos|leiautista de circuitos impressos
318810|Moldador de roupas|moldador de roupas
319205|Técnico em madeira e mobiliário|tecnico em madeira e mobiliario
319205|Técnico em móveis e esquadrias|tecnico em moveis e esquadrias
319205|Técnico em móveis (fabricação)|tecnico em moveis (fabricacao)
319205|Técnico moveleiro|tecnico moveleiro
320105|Técnico de biotério|tecnico de bioterio
320105|Técnico em criação de animais de laboratório|tecnico em criacao de animais de laboratorio
321105|Agrotécnico|agrotecnico
321105|Técnico agrícola executor de operações aéreas agrícolas|tecnico agricola executor de operacoes aereas agricolas
321105|Técnico em agricultura|tecnico em agricultura
321105|Técnico em vitivinicultura|tecnico em vitivinicultura
321110|Técnico em agropecuária|tecnico em agropecuaria
321110|Técnico em ovinocaprinocultura|tecnico em ovinocaprinocultura
321205|Assistente técnico em madeira|assistente tecnico em madeira
321205|Técnico madeireiro|tecnico madeireiro
321210|Administrador florestal|administrador florestal
321210|Assistente técnico florestal|assistente tecnico florestal
321210|Auxiliar técnico florestal|auxiliar tecnico florestal
321210|Encarregado florestal|encarregado florestal
321210|Técnico ambiental|tecnico ambiental
321210|Técnico de produção florestal|tecnico de producao florestal
321210|Técnico de reflorestamento|tecnico de reflorestamento
321210|Técnico silvicultor|tecnico silvicultor
321310|Técnico de camarão|tecnico de camarao
321315|Técnico em malococultura|tecnico em malococultura
321315|Técnico em mexilhões|tecnico em mexilhoes
321315|Técnico em moluscos|tecnico em moluscos
321315|Técnico em ostras|tecnico em ostras
322110|Técnico em podologia|tecnico em podologia
322130|Técnico em estética|tecnico em estetica
322130|Tecnólogo em cosmetologia e estética|tecnologo em cosmetologia e estetica
322130|Tecnólogo em cosmetologia e estética facial e corporal|tecnologo em cosmetologia e estetica facial e corporal
322130|Tecnólogo em estética|tecnologo em estetica
322130|Tecnólogo em estética corporal, facial e capilar|tecnologo em estetica corporal, facial e capilar
322130|Tecnólogo em estética e cosmética|tecnologo em estetica e cosmetica
322140|Professor de pilates|professor de pilates
322205|Técnico em hemotransfusão|tecnico em hemotransfusao
322210|Técnico em hemodiálise|tecnico em hemodialise
322210|Técnico em uti|tecnico em uti
322215|Técnico de enfermagem em saúde ocupacional|tecnico de enfermagem em saude ocupacional
322215|Técnico de enfermagem ocupacional|tecnico de enfermagem ocupacional
322220|Técnico de enfermagem em saúde mental|tecnico de enfermagem em saude mental
322225|Instrumentador em cirurgia|instrumentador em cirurgia
322230|Auxiliar de ambulatório|auxiliar de ambulatorio
322230|Auxiliar de enfermagem de central de material esterelizado (cme)|auxiliar de enfermagem de central de material esterelizado (cme)
322230|Auxiliar de enfermagem de centro cirúrgico|auxiliar de enfermagem de centro cirurgico
322230|Auxiliar de enfermagem de clínica médica|auxiliar de enfermagem de clinica medica
322230|Auxiliar de enfermagem de hospital|auxiliar de enfermagem de hospital
322230|Auxiliar de enfermagem de saúde pública|auxiliar de enfermagem de saude publica
322230|Auxiliar de enfermagem em hemodiálise|auxiliar de enfermagem em hemodialise
322230|Auxiliar de enfermagem em home care|auxiliar de enfermagem em home care
322230|Auxiliar de enfermagem em nefrologia|auxiliar de enfermagem em nefrologia
322230|Auxiliar de enfermagem em saúde mental|auxiliar de enfermagem em saude mental
322230|Auxiliar de ginecologia|auxiliar de ginecologia
322230|Auxiliar de hipodermia|auxiliar de hipodermia
322230|Auxiliar de obstetrícia|auxiliar de obstetricia
322230|Auxiliar de oftalmologia|auxiliar de oftalmologia
322230|Auxiliar de parteira|auxiliar de parteira
322230|Auxiliar em hemotransfusão|auxiliar em hemotransfusao
322235|Auxiliar de enfermagem em saúde ocupacional|auxiliar de enfermagem em saude ocupacional
322235|Auxiliar de enfermagem ocupacional|auxiliar de enfermagem ocupacional
322240|Auxiliar de saúde marítimo|auxiliar de saude maritimo
322305|Contatólogo|contatologo
322305|Óptico contatólogo|optico contatologo
322305|Óptico oftálmico|optico oftalmico
322305|Óptico optometrista|optico optometrista
322305|Óptico protesista|optico protesista
322305|Técnico optometrista|tecnico optometrista
322415|Atendente de clínica dentária|atendente de clinica dentaria
322415|Atendente de gabinete dentário|atendente de gabinete dentario
322415|Atendente de serviço odontológico|atendente de servico odontologico
322415|Atendente odontológico|atendente odontologico
322415|Auxiliar de dentista|auxiliar de dentista
322505|Ortesista|ortesista
322505|Protesista (técnico)|protesista (tecnico)
322505|Sapateiro ortopédico|sapateiro ortopedico
322505|Técnico de aparelhos ortopédicos|tecnico de aparelhos ortopedicos
322505|Técnico de oficina ortopédica|tecnico de oficina ortopedica
322505|Técnico de prótese e órtese|tecnico de protese e ortese
322505|Técnico de prótese ortopédica|tecnico de protese ortopedica
322505|Técnico ortopédico|tecnico ortopedico
322605|Técnico em aparelho gessado|tecnico em aparelho gessado
322605|Técnico em gesso hospitalar|tecnico em gesso hospitalar
322605|Técnico em gesso ortopédico|tecnico em gesso ortopedico
322605|Técnico em imobilizações do aparelho locomotor|tecnico em imobilizacoes do aparelho locomotor
322605|Técnico em imobilizações gessadas|tecnico em imobilizacoes gessadas
322605|Técnico engessador|tecnico engessador
322605|Técnico gessista|tecnico gessista
322705|Acupuntor|acupuntor
322705|Acupunturista|acupunturista
322705|Técnico corporal em medicina tradicional chinesa|tecnico corporal em medicina tradicional chinesa
322715|Massagista|massagista
322715|Massoprevencionista|massoprevencionista
322720|Homeopata (não médico)|homeopata (nao medico)
322720|Naturopata|naturopata
322720|Terapeuta alternativo|terapeuta alternativo
322720|Terapeuta naturalista|terapeuta naturalista
322725|Facilitador de biodanza|facilitador de biodanza
322730|Reikiano|reikiano
322730|Terapeuta reikiano|terapeuta reikiano
322735|Instrutor de ioga|instrutor de ioga
322745|Facilitador de classes de exercício (análise bioenergética)|facilitador de classes de exercicio (analise bioenergetica)
323105|Técnico em avicultura|tecnico em avicultura
323105|Técnico em zootecnia|tecnico em zootecnia
324105|Operador de eletroencefalógrafo|operador de eletroencefalografo
324105|Técnico em captações bioelétricas do cérebro|tecnico em captacoes bioeletricas do cerebro
324105|Técnico em eletroencefalografia|tecnico em eletroencefalografia
324105|Técnico em eletroencefalograma|tecnico em eletroencefalograma
324110|Operador de eletrocardiógrafo|operador de eletrocardiografo
324110|Técnico em eletrocardiografia|tecnico em eletrocardiografia
324110|Técnico em eletrocardiograma|tecnico em eletrocardiograma
324110|Técnico em métodos eletrográficos em cardiologia|tecnico em metodos eletrograficos em cardiologia
324110|Técnico em métodos não invasivos em cardiologia|tecnico em metodos nao invasivos em cardiologia
324115|Operador de raio-x|operador de raio-x
324115|Técnico de radioterapia|tecnico de radioterapia
324115|Técnico em hemodinâmica|tecnico em hemodinamica
324115|Técnico em mamografia|tecnico em mamografia
324115|Técnico em medicina nuclear|tecnico em medicina nuclear
324115|Técnico em radiologia|tecnico em radiologia
324115|Técnico em radiologia médica|tecnico em radiologia medica
324115|Técnico em radiologia odontológica|tecnico em radiologia odontologica
324115|Técnico em ressonância magnética|tecnico em ressonancia magnetica
324115|Técnico em tomografia|tecnico em tomografia
324125|Tecnólogo em oftalmologia|tecnologo em oftalmologia
324130|Técnico em prova de função pulmonar|tecnico em prova de funcao pulmonar
324135|Técnico do sono|tecnico do sono
324140|Dosimetrista|dosimetrista
324205|Técnico de laboratório de análises clínicas|tecnico de laboratorio de analises clinicas
324205|Técnico de laboratório em patologia clínica|tecnico de laboratorio em patologia clinica
324205|Técnico de laboratório médico|tecnico de laboratorio medico
324205|Técnico em análises clínicas|tecnico em analises clinicas
324215|Citotecnologista|citotecnologista
324215|Técnico em citopatologia|tecnico em citopatologia
324220|Técnico em banco de sangue|tecnico em banco de sangue
325005|Enotécnico|enotecnico
325005|Técnico em enologia|tecnico em enologia
325005|Tecnólogo em enologia|tecnologo em enologia
325005|Tecnólogo em viticultura e enologia|tecnologo em viticultura e enologia
325010|Flavorista|flavorista
325010|Técnico em aromas|tecnico em aromas
325015|Criadores de perfumes|criadores de perfumes
325105|Auxiliar técnico de manipulação em laboratório de farmácia|auxiliar tecnico de manipulacao em laboratorio de farmacia
325110|Manipulador em laboratório de farmácia|manipulador em laboratorio de farmacia
325205|Técnico de bebidas|tecnico de bebidas
325205|Técnico de carnes e derivados|tecnico de carnes e derivados
325205|Técnico de controle de qualidade de alimentos|tecnico de controle de qualidade de alimentos
325205|Técnico de frutas e hortaliças|tecnico de frutas e hortalicas
325205|Técnico de grãos e cereais|tecnico de graos e cereais
325205|Técnico de laticínios|tecnico de laticinios
325205|Técnico de massas alimentícias|tecnico de massas alimenticias
325205|Técnico de panificação|tecnico de panificacao
325205|Técnico de pescado e derivados|tecnico de pescado e derivados
325205|Técnico de produção de alimentos|tecnico de producao de alimentos
325205|Técnico em açúcar e álcool|tecnico em acucar e alcool
325205|Técnico em química de alimentos|tecnico em quimica de alimentos
325210|Técnico em nutrição|tecnico em nutricao
331105|Educador infantil de nível médio|educador infantil de nivel medio
331105|Professor de escolinha (maternal)|professor de escolinha (maternal)
331105|Professor de jardim da infância|professor de jardim da infancia
331105|Professor de maternal|professor de maternal
331105|Professor de pré-escola|professor de pre-escola
331110|Atendente de creche|atendente de creche
331110|Auxiliar de creche|auxiliar de creche
331110|Crecheira|crecheira
331205|Professor de ensino fundamental - séries iniciais|professor de ensino fundamental - series iniciais
331205|Professor de ensino fundamental de primeira a quinta séries|professor de ensino fundamental de primeira a quinta series
331205|Professor de ensino fundamental nas cinco primeiras séries|professor de ensino fundamental nas cinco primeiras series
331205|Professor i - ensino fundamental|professor i - ensino fundamental
331305|Docente de nível médio no ensino profissionalizante|docente de nivel medio no ensino profissionalizante
331305|Instrutor de nível médio no ensino profissionalizante|instrutor de nivel medio no ensino profissionalizante
331305|Monitor de nível médio no ensino profissionalizante|monitor de nivel medio no ensino profissionalizante
332105|Professor assistente de regência de classe|professor assistente de regencia de classe
332105|Professor indigenista bilingue|professor indigenista bilingue
332105|Professor leigo em classe multisseriada|professor leigo em classe multisseriada
332105|Professor leigo em regência de classe|professor leigo em regencia de classe
332105|Professor leigo responsável por escolas rurais|professor leigo responsavel por escolas rurais
332105|Professor não habilitado no ensino fundamental|professor nao habilitado no ensino fundamental
332105|Professor sem formação para o magistério|professor sem formacao para o magisterio
332205|Instrutor no ensino profissionalizante|instrutor no ensino profissionalizante
333110|Instrutor de equitação para equoterapia|instrutor de equitacao para equoterapia
334110|Agente de organização escolar|agente de organizacao escolar
334110|Agente educador|agente educador
334110|Auxiliar técnico de educação|auxiliar tecnico de educacao
334110|Bedel|bedel
334110|Inspetor de alunos|inspetor de alunos
334110|Inspetor de disciplina|inspetor de disciplina
334110|Monitor de alunos|monitor de alunos
341105|Piloto comercial|piloto comercial
341210|Capitão de pequena cabotagem|capitao de pequena cabotagem
341210|Mestre de pequena cabotagem|mestre de pequena cabotagem
341230|Condutor escolar (aquaviário)|condutor escolar (aquaviario)
341235|Agente de atuidade marítima e fluvial|agente de atuidade maritima e fluvial
341235|Faroleiro (meio militar)|faroleiro (meio militar)
341240|Manobras e reparos|manobras e reparos
341245|Sinaleiro naval|sinaleiro naval
341250|Auxiliar de faroleiro|auxiliar de faroleiro
342105|Agente de comércio exterior|agente de comercio exterior
342105|Auxiliar de exportação e importação|auxiliar de exportacao e importacao
342105|Transitário de cargas|transitario de cargas
342110|Analista de transporte multimodal|analista de transporte multimodal
342110|Programador de transporte multimodal|programador de transporte multimodal
342110|Técnico de operação de transporte|tecnico de operacao de transporte
342115|Supervisor operacional dos serviços de máquinas e veículos|supervisor operacional dos servicos de maquinas e veiculos
342115|Técnico de operações de serviços de máquinas e veículos|tecnico de operacoes de servicos de maquinas e veiculos
342120|Agenciador de cargas|agenciador de cargas
342120|Agente de carga|agente de carga
342120|Agente de transporte|agente de transporte
342120|Corretor de frete|corretor de frete
342125|Analista de logística de transporte|analista de logistica de transporte
342125|Assistente de logística de transporte|assistente de logistica de transporte
342205|Ajudante de despachante alfandegário|ajudante de despachante alfandegario
342210|Despachante alfandegário|despachante alfandegario
342215|Assistente de desembaraço aduaneiro|assistente de desembaraco aduaneiro
342305|Assistente de tráfego rodoviário|assistente de trafego rodoviario
342305|Chefe de departamento de motoristas|chefe de departamento de motoristas
342305|Chefe de serviço de transporte rodoviário|chefe de servico de transporte rodoviario
342305|Chefe de transporte - no serviço público|chefe de transporte - no servico publico
342305|Chefe de transportes - exclusive no serviço público|chefe de transportes - exclusive no servico publico
342305|Coordenador de tráfego rodoviário|coordenador de trafego rodoviario
342305|Encarregado de linha de transporte rodoviário|encarregado de linha de transporte rodoviario
342305|Encarregado de tráfego rodoviário|encarregado de trafego rodoviario
342305|Gerente de frota (transporte rodoviário)|gerente de frota (transporte rodoviario)
342305|Gerente de tráfego rodoviário|gerente de trafego rodoviario
342305|Programador de transporte rodoviário|programador de transporte rodoviario
342305|Supervisor de tráfego rodoviário|supervisor de trafego rodoviario
342310|Agente rodoviário|agente rodoviario
342310|Chefe de garagem (transporte rodoviário)|chefe de garagem (transporte rodoviario)
342310|Controlador de serviço de transporte rodoviário|controlador de servico de transporte rodoviario
342310|Inspetor de carga e descarga|inspetor de carga e descarga
342310|Inspetor de carregadoria de embarque rodoviário|inspetor de carregadoria de embarque rodoviario
342310|Inspetor de tráfego rodoviário|inspetor de trafego rodoviario
342310|Inspetor de transporte rodoviário|inspetor de transporte rodoviario
342310|Instrutor de motoristas|instrutor de motoristas
342315|Chefe de armazém (técnicos em transportes rodoviários)|chefe de armazem (tecnicos em transportes rodoviarios)
342315|Chefe de carga e descarga no transporte rodoviário|chefe de carga e descarga no transporte rodoviario
342315|Chefe de depósito|chefe de deposito
342315|Encarregado de carga e descarga no transporte rodoviário|encarregado de carga e descarga no transporte rodoviario
342405|Agente de pátio e terminais (ferrovia e metrô)|agente de patio e terminais (ferrovia e metro)
342405|Assistente de estação (metrô e ferrovia)|assistente de estacao (metro e ferrovia)
342405|Chefe de estação (ferrovia)|chefe de estacao (ferrovia)
342405|Supervisor de estação (metrô e ferrovia)|supervisor de estacao (metro e ferrovia)
342405|Supervisor geral de operação (metrô)|supervisor geral de operacao (metro)
342410|Controlador de centro de controle operacional|controlador de centro de controle operacional
342410|Controlador de centro de controle operacional (metrô e ferrovia)|controlador de centro de controle operacional (metro e ferrovia)
342410|Controlador de tráfego|controlador de trafego
342410|Operador de programação (ferrovia)|operador de programacao (ferrovia)
342410|Supervisor de centro de controle (ferrovia e metrô)|supervisor de centro de controle (ferrovia e metro)
342505|Controlador de voo|controlador de voo
342505|Operador de torre de controle (aéreo)|operador de torre de controle (aereo)
342505|Profissional de tráfego aéreo|profissional de trafego aereo
342535|Atendente de aeroporto|atendente de aeroporto
342555|Fiscal de pátio (aeroporto)|fiscal de patio (aeroporto)
342605|Agente de estação portuária|agente de estacao portuaria
342610|Chefe de operações portuárias|chefe de operacoes portuarias
342610|Coordenador de operações portuárias|coordenador de operacoes portuarias
342610|Encarregado de operações portuárias|encarregado de operacoes portuarias
351305|Chefe de recurso de glosa de contas de convênios (administração de hospital)|chefe de recurso de glosa de contas de convenios (administracao de hospital)
351305|Chefe de recurso de glosas de contas nos hospitais (administração de convênios e fonte pagadora)|chefe de recurso de glosas de contas nos hospitais (administracao de convenios e fonte pagadora)
351405|Escrevente extra - judicial|escrevente extra - judicial
351405|Escrevente judicial|escrevente judicial
351405|Oficial maior|oficial maior
351410|Avaliador judicial (escrivão)|avaliador judicial (escrivao)
351410|Depositário público|depositario publico
351410|Distribuidor público|distribuidor publico
351410|Escrivão civil|escrivao civil
351410|Escrivão criminal|escrivao criminal
351410|Partidor judicial|partidor judicial
351415|Escrivão de cartório|escrivao de cartorio
351415|Oficial de registro|oficial de registro
351415|Tabelião da justiça|tabeliao da justica
351415|Tabelião substituto|tabeliao substituto
351425|Oficial judiciário|oficial judiciario
351425|Oficial legislativo|oficial legislativo
351430|Auxiliar jurídico|auxiliar juridico
351435|Mediador extrajudicial|mediador extrajudicial
351505|Secretária (técnico em secretariado - português)|secretaria (tecnico em secretariado - portugues)
351505|Secretário (técnico de nível médio)|secretario (tecnico de nivel medio)
351505|Secretário-assistente administrativo (técnico)|secretario-assistente administrativo (tecnico)
351505|Técnico em secretariado (português)|tecnico em secretariado (portugues)
351510|Estenógrafo|estenografo
351510|Taquígrafo em línguas estrangeiras|taquigrafo em linguas estrangeiras
351510|Taquígrafo judiciário|taquigrafo judiciario
351510|Taquígrafo parlamentar|taquigrafo parlamentar
351510|Taquígrafo revisor|taquigrafo revisor
351515|Escrevente técnico estenotipista|escrevente tecnico estenotipista
351515|Estenotipista em ´close caption´|estenotipista em ´close caption´
351515|Estenotipista ´free lancer´|estenotipista ´free lancer´
351515|Estenotipista técnico judiciário|estenotipista tecnico judiciario
351515|Estenotipista técnico parlamentar|estenotipista tecnico parlamentar
351605|Supervisor de segurança do trabalho|supervisor de seguranca do trabalho
351605|Técnico em meio ambiente, segurança e saúde|tecnico em meio ambiente, seguranca e saude
351605|Técnico em segurança industrial|tecnico em seguranca industrial
351705|Analista técnico de seguros|analista tecnico de seguros
351705|Subscritor assistente de seguros|subscritor assistente de seguros
351710|Analista técnico de sinistros|analista tecnico de sinistros
351710|Técnico de sinistros|tecnico de sinistros
351715|Assistente de contas de seguros|assistente de contas de seguros
351715|Assistente de negócios de seguros|assistente de negocios de seguros
351715|Inspetor de produção de seguros|inspetor de producao de seguros
351720|Assistente de analista de produtos|assistente de analista de produtos
351720|Assistente de produtos (técnico de seguros)|assistente de produtos (tecnico de seguros)
351725|Representante de controle de perdas|representante de controle de perdas
351725|Vistoriador de risco de auto|vistoriador de risco de auto
351730|Comissário de avarias|comissario de avarias
351730|Inspetor de avarias|inspetor de avarias
351730|Regulador de sinistros|regulador de sinistros
351730|Vistoriador de sinistros|vistoriador de sinistros
351805|Agente de investigação privada|agente de investigacao privada
351805|Detetive particular|detetive particular
351805|Investigador particular|investigador particular
351810|Agente policial|agente policial
351810|Comissário de polícia|comissario de policia
351810|Detetive de polícia|detetive de policia
351810|Inspetor de polícia|inspetor de policia
351815|Datiloscopista|datiloscopista
351815|Perito em identificação|perito em identificacao
351815|Perito papiloscopista|perito papiloscopista
351815|Técnico de identificação (papiloscopista)|tecnico de identificacao (papiloscopista)
351910|Técnico de suporte à inteligência (grupo apoio)|tecnico de suporte a inteligencia (grupo apoio)
351910|Técnico em inteligência (grupo informações)|tecnico em inteligencia (grupo informacoes)
352205|Agente de defesa florestal|agente de defesa florestal
352205|Agente de fiscalização ambiental|agente de fiscalizacao ambiental
352205|Agente de inspeção de pesca|agente de inspecao de pesca
352205|Analista ambiental|analista ambiental
352205|Analista de projetos ambientais|analista de projetos ambientais
352205|Fiscal do meio ambiente|fiscal do meio ambiente
352205|Fiscal florestal|fiscal florestal
352205|Guarda ambiental|guarda ambiental
352205|Guarda florestal|guarda florestal
352205|Guarda-parques|guarda-parques
352205|Inspetor agrícola|inspetor agricola
352205|Polícia florestal e de mananciais|policia florestal e de mananciais
352210|Agente de saneamento|agente de saneamento
352210|Agente sanitarista|agente sanitarista
352210|Fiscal de higiene|fiscal de higiene
352210|Fiscal de obras|fiscal de obras
352210|Inspetor de comercialização de produtos|inspetor de comercializacao de produtos
352210|Inspetor de saneamento|inspetor de saneamento
352305|Inspetor de medição|inspetor de medicao
352305|Metrologista auxiliar|metrologista auxiliar
352310|Fiscal de pesos e medidas|fiscal de pesos e medidas
352310|Inspetor de equipamentos|inspetor de equipamentos
352310|Inspetor de transporte de produtos perigosos|inspetor de transporte de produtos perigosos
352310|Inspetor técnico de qualidade|inspetor tecnico de qualidade
352320|Fiscal têxtil|fiscal textil
353230|Tesoureiro|tesoureiro
354120|Vendedor de informações comerciais|vendedor de informacoes comerciais
354135|Representante técnico de vendas|representante tecnico de vendas
354150|Consultor de produtos farmacêuticos|consultor de produtos farmaceuticos
354150|Representante de produtos farmacêuticos|representante de produtos farmaceuticos
354205|Arrematador, no comércio|arrematador, no comercio
354405|Pregoeiro|pregoeiro
354405|Preposto de leiloeiro|preposto de leiloeiro
354410|Avaliador de prédios|avaliador de predios
354410|Avaliador de propriedade|avaliador de propriedade
354415|Avaliador de artes e antiguidades|avaliador de artes e antiguidades
354415|Avaliador de automóveis|avaliador de automoveis
354415|Avaliador de bens|avaliador de bens
354415|Avaliador de jóias|avaliador de joias
354415|Avaliador judicial|avaliador judicial
354415|Perito avaliador de bens móveis|perito avaliador de bens moveis
354505|Securitário|securitario
354605|Assessor imobiliário|assessor imobiliario
354605|Consultor imobiliário|consultor imobiliario
354610|Corretor de cereais|corretor de cereais
354810|Agente de reservas|agente de reservas
354810|Supervisor de operações turísticas|supervisor de operacoes turisticas
354815|Consultor de viagem|consultor de viagem
354815|Coordenador de turismo|coordenador de turismo
354820|Gestor de evento|gestor de evento
354820|Tecnólogo de evento|tecnologo de evento
371105|Assistente de biblioteca|assistente de biblioteca
371105|Auxiliar de bibliotecário|auxiliar de bibliotecario
371105|Auxiliar de serviços bibliotecários|auxiliar de servicos bibliotecarios
371110|Técnico de biblioteca|tecnico de biblioteca
371110|Técnico de documentação e informação|tecnico de documentacao e informacao
371110|Técnico em documentação|tecnico em documentacao
371110|Tratador de documentos (biblioteconomia)|tratador de documentos (biblioteconomia)
371205|Numismata|numismata
371210|Técnico de arquivo (museologia)|tecnico de arquivo (museologia)
371310|Técnico de artes gráficas|tecnico de artes graficas
371405|Conselheiro em acantonamento|conselheiro em acantonamento
371405|Monitor de acampamento|monitor de acampamento
371405|Monitor de acantonamento|monitor de acantonamento
371410|Go - gentil organizador|go - gentil organizador
371410|Monitor de entretenimento|monitor de entretenimento
371410|Monitor de esportes e lazer|monitor de esportes e lazer
371410|Monitor de recreação|monitor de recreacao
371410|Monitor infantil|monitor infantil
371410|Recreacionista|recreacionista
371415|Brincante|brincante
371415|Brinquedista hospitalar|brinquedista hospitalar
372115|Cameraman (cinema)|cameraman (cinema)
372115|Operador de câmera|operador de camera
372115|Operador de câmera de vídeo|operador de camera de video
372205|Operador de rede de transmissão de dados|operador de rede de transmissao de dados
372205|Operador de sistemas de informática (teleprocessamento)|operador de sistemas de informatica (teleprocessamento)
372205|Operador de teleprocessamento|operador de teleprocessamento
372210|Operador de radiotelégrafo|operador de radiotelegrafo
373105|Operador de áudio|operador de audio
373105|Operador de gravação|operador de gravacao
373105|Operador de mesa (rádio)|operador de mesa (radio)
373105|Operador de rádio|operador de radio
373105|Operador de vídeo|operador de video
373105|Técnico de áudio (rádio)|tecnico de audio (radio)
373130|Operador de externas|operador de externas
373130|Operador de videoteipe|operador de videoteipe
373130|Técnico de captação de som|tecnico de captacao de som
373130|Técnico de externas (sistemas audiovisuais)|tecnico de externas (sistemas audiovisuais)
373130|Técnico de sistema de televisão|tecnico de sistema de televisao
373130|Técnico de transmissor de rádio|tecnico de transmissor de radio
373135|Controle mestre|controle mestre
373140|Controlador de programação|controlador de programacao
373145|Assistente de câmera externa|assistente de camera externa
373145|Auxiliar de cinegrafia|auxiliar de cinegrafia
373145|Auxiliar de iluminação|auxiliar de iluminacao
373145|Auxiliar de unidade portátil externa|auxiliar de unidade portatil externa
373145|Auxiliar iluminador|auxiliar iluminador
373145|Operador de cabos|operador de cabos
373145|Operador de microfone|operador de microfone
373145|Operador de unidade portátil externa|operador de unidade portatil externa
373145|Técnico de externas (operações audiovisuais)|tecnico de externas (operacoes audiovisuais)
373220|Chefe de operações de sistemas de televisão e produtoras de vídeo|chefe de operacoes de sistemas de televisao e produtoras de video
373220|Coordenador de operações de sistemas de televisão e produtoras de vídeo|coordenador de operacoes de sistemas de televisao e produtoras de video
373220|Supervisor de operações de sistemas de televisão e produtoras de vídeo|supervisor de operacoes de sistemas de televisao e produtoras de video
374105|Assistente de estúdio (gravação de áudio)|assistente de estudio (gravacao de audio)
374105|Auxiliar de estúdio|auxiliar de estudio
374105|Operador de estúdio (gravação de áudio)|operador de estudio (gravacao de audio)
374105|Operador de gravação (trilha sonora para filmes)|operador de gravacao (trilha sonora para filmes)
374105|Técnico de gravação de áudio|tecnico de gravacao de audio
374110|Auxiliar de instalação (equipamentos de rádio)|auxiliar de instalacao (equipamentos de radio)
374110|Auxiliar técnico de montagem|auxiliar tecnico de montagem
374110|Instalador de equipamentos de áudio|instalador de equipamentos de audio
374110|Roadie (assistente de palco)|roadie (assistente de palco)
374110|Técnico de montagem|tecnico de montagem
374115|Engenheiro de master|engenheiro de master
374120|Desenhista de som|desenhista de som
374120|Diretor de som|diretor de som
374120|Sound designer|sound designer
374130|Mixador|mixador
374130|Técnico de mixagem|tecnico de mixagem
374135|Engenheiro projetista de áudio|engenheiro projetista de audio
374135|Projetista de áudio|projetista de audio
374135|Técnico em projeto de aúdio|tecnico em projeto de audio
374140|Operador de microfone|operador de microfone
374145|Dee jay|dee jay
374145|Disc jóquei|disc joquei
374145|Discotecário|discotecario
374155|Programador musical|programador musical
374205|Construtor de cenários|construtor de cenarios
374210|Assistente de estúdio (cinema e vídeo)|assistente de estudio (cinema e video)
374210|Cenotécnico de filmagem|cenotecnico de filmagem
374210|Operador de carrinho (travelling)|operador de carrinho (travelling)
374210|Operador de grua|operador de grua
374215|Maquinista de cenário|maquinista de cenario
374215|Técnico de palco|tecnico de palco
374215|Técnico de teatro|tecnico de teatro
374305|Operador cinematográfico|operador cinematografico
374305|Operador de cabine cinematográfica|operador de cabine cinematografica
374305|Operador de projetor cinematográfico e áudio|operador de projetor cinematografico e audio
374305|Projecionista|projecionista
374405|Editor de imagens|editor de imagens
374405|Editor de pós-produção|editor de pos-producao
374405|Editor de tv e vídeo|editor de tv e video
374405|Editor de vt|editor de vt
374405|Editor finalizador|editor finalizador
374415|Compositor de imagens|compositor de imagens
374415|Criador de efeitos especiais|criador de efeitos especiais
374415|Criador de efeitos visuais|criador de efeitos visuais
374415|Pós-produtor de tv e vídeo|pos-produtor de tv e video
374420|Montador|montador
374420|Montador cinematográfico|montador cinematografico
374420|Montador de filmes de cinema|montador de filmes de cinema
374425|Diretor de corte|diretor de corte
374425|Diretor de tv|diretor de tv
374425|Dtv|dtv
375110|Vitrinista|vitrinista
375120|Decorador com balões|decorador com baloes
375120|Decorador de arte com balões|decorador de arte com baloes
375120|Decorador de arte floral|decorador de arte floral
375120|Decorador de festas|decorador de festas
375120|Decorador de festas infantis|decorador de festas infantis
375120|Decorador de lycra tensionada|decorador de lycra tensionada
375120|Designer de eventos|designer de eventos
375120|Ornamentador de eventos|ornamentador de eventos
375125|Assistente de produção (moda)|assistente de producao (moda)
375125|Consultor de estilo|consultor de estilo
375125|Image designer|image designer
375125|Personal stylist|personal stylist
375125|Stylist|stylist
375130|Consultor em organização|consultor em organizacao
375130|Organizador profissional|organizador profissional
376105|Bailarino de danças folclóricas|bailarino de dancas folcloricas
376105|Dançarino brincante|dancarino brincante
376105|Dançarino de danças de raiz|dancarino de dancas de raiz
376105|Dançarino de danças folclóricas|dancarino de dancas folcloricas
376105|Dançarino de danças rituais|dancarino de dancas rituais
376105|Folgazão|folgazao
376105|Sambista|sambista
376110|Bailarinos de danças parafolclóricas|bailarinos de dancas parafolcloricas
376110|Bailarinos étnicos|bailarinos etnicos
376110|Bailarinos populares|bailarinos populares
376110|Dançarino de rua|dancarino de rua
376110|Dançarino de salão|dancarino de salao
376110|Dançarinos de danças parafolclóricas|dancarinos de dancas parafolcloricas
376110|Dançarinos étnicos|dancarinos etnicos
376110|Dançarinos populares|dancarinos populares
376205|Saltador|saltador
376210|Artista de corda|artista de corda
376210|Artista de força capilar|artista de forca capilar
376210|Artista de lira|artista de lira
376215|Atirador de facas|atirador de facas
376215|Comedor de espada|comedor de espada
376215|Comedor de fogo (pirofagista)|comedor de fogo (pirofagista)
376215|Faquir|faquir
376215|Globista|globista
376215|Homem-bala|homem-bala
376215|Partner (circo)|partner (circo)
376215|Pirofagista|pirofagista
376215|Saltimbanco|saltimbanco
376215|Ventríloquo|ventriloquo
376220|Deslocador|deslocador
376225|Treinador de animais (circense)|treinador de animais (circense)
376230|Aramista (equilibrista)|aramista (equilibrista)
376230|Funâmbulo|funambulo
376230|Paradista|paradista
376235|Ilusionista|ilusionista
376235|Manipulador|manipulador
376235|Prestidigitador|prestidigitador
376245|Clown|clown
376245|Cômico de circo|comico de circo
376245|Excêntrico|excentrico
376245|Tony de soirée|tony de soiree
376250|Bonequeiro|bonequeiro
376250|Mamulengueiro|mamulengueiro
376250|Manipulador de bonecos|manipulador de bonecos
376250|Marionetistas|marionetistas
376305|Animador de eventos|animador de eventos
376305|Apresentador animador de eventos|apresentador animador de eventos
376305|Apresentador de convenções|apresentador de convencoes
376305|Apresentador de espetáculos|apresentador de espetaculos
376310|Animador de festas populares|animador de festas populares
376310|Apresentador animador de festas populares|apresentador animador de festas populares
376310|Comentarista de rodeio|comentarista de rodeio
376310|Locutor de rodeio|locutor de rodeio
376315|Animador de rádio|animador de radio
376315|Apresentador animador de programas de rádio|apresentador animador de programas de radio
376320|Animador de televisão|animador de televisao
376320|Apresentador animador de programas de televisão|apresentador animador de programas de televisao
376320|Apresentador de telejornal|apresentador de telejornal
376325|Animador de circo|animador de circo
376325|Apresentador animador de circo|apresentador animador de circo
376405|Estátua viva|estatua viva
376405|Modelo fotográfico de nu artístico|modelo fotografico de nu artistico
376405|Modelo vivo|modelo vivo
376410|Manequim|manequim
376410|Modelo de passarela|modelo de passarela
376410|Modelo "fashion"|modelo "fashion"
376415|Modelo comercial|modelo comercial
376415|Modelo de detalhes|modelo de detalhes
376415|Modelo de editorial de moda|modelo de editorial de moda
376415|Modelo fotográfico|modelo fotografico
376415|Modelo fotográfico de workshop|modelo fotografico de workshop
377105|Atleta da ginástica|atleta da ginastica
377105|Atleta da natação|atleta da natacao
377105|Atleta de bodybare|atleta de bodybare
377105|Atleta de canoagem|atleta de canoagem
377105|Atleta de ciclismo|atleta de ciclismo
377105|Atleta de escalada|atleta de escalada
377105|Atleta de esgrima|atleta de esgrima
377105|Atleta de futvôlei|atleta de futvolei
377105|Atleta de handebol|atleta de handebol
377105|Atleta de nado sincronizado|atleta de nado sincronizado
377105|Atleta de paraquedismo|atleta de paraquedismo
377105|Atleta de patinação|atleta de patinacao
377105|Atleta de peteca|atleta de peteca
377105|Atleta de pólo aquático|atleta de polo aquatico
377105|Atleta de remo|atleta de remo
377105|Atleta de skate|atleta de skate
377105|Atleta de squash|atleta de squash
377105|Atleta de surf e windsurf|atleta de surf e windsurf
377105|Atleta de vela|atleta de vela
377105|Atleta de voleibol|atleta de voleibol
377105|Atleta do basquete|atleta do basquete
377105|Atleta do beisebol|atleta do beisebol
377105|Atleta do hóquei|atleta do hoquei
377105|Peão de boiadeiro|peao de boiadeiro
377110|Atacante - no futebol|atacante - no futebol
377110|Atleta de futebol sete|atleta de futebol sete
377110|Atleta de futsal|atleta de futsal
377110|Esportista no futebol|esportista no futebol
377110|Goleiro|goleiro
377110|Jogador de futebol|jogador de futebol
377110|Meio campista no futebol|meio campista no futebol
377110|Zagueiro - jogador de futebol|zagueiro - jogador de futebol
377115|Golfista profissional|golfista profissional
377115|Jogador de golfe profissional|jogador de golfe profissional
377115|Profissional de golfe|profissional de golfe
377120|Atleta de judô|atleta de judo
377120|Atleta de karatê|atleta de karate
377120|Atleta de tai chi chuan|atleta de tai chi chuan
377120|Jodoísta|jodoista
377120|Judoca|judoca
377120|Karateca|karateca
377120|Lutador de aikidô|lutador de aikido
377120|Lutador de capoeira|lutador de capoeira
377120|Lutador de fullcontact|lutador de fullcontact
377120|Lutador de hapkidô|lutador de hapkido
377120|Lutador de karatê|lutador de karate
377120|Lutador de kendô|lutador de kendo
377120|Lutador de sumô|lutador de sumo
377120|Lutador de taekwondô|lutador de taekwondo
377125|Atleta de tênis profissional|atleta de tenis profissional
377125|Esportista profissional de tênis|esportista profissional de tenis
377125|Jogador de tênis profissional|jogador de tenis profissional
377125|Jogador profissional de tênis|jogador profissional de tenis
377125|Tenista profissional|tenista profissional
377130|Atleta do hipismo|atleta do hipismo
377130|Jóquei profissional|joquei profissional
377140|Atleta de triatlo|atleta de triatlo
377140|Corredor fundista|corredor fundista
377140|Maratonista|maratonista
377145|Boxeador|boxeador
377145|Boxeur|boxeur
377145|Lutador profissional de boxe|lutador profissional de boxe
377145|Pugilista de luta livre|pugilista de luta livre
377210|Árbitro geral de campo|arbitro geral de campo
377210|Árbitro geral de pista|arbitro geral de pista
377210|Árbitro geral de provas fora do estádio|arbitro geral de provas fora do estadio
377210|Coordenador de câmara de chegada|coordenador de camara de chegada
377210|Oficial encarregado de painel de advertência|oficial encarregado de painel de advertencia
377215|Apontador (basquete)|apontador (basquete)
377215|Árbitro de basquetebol|arbitro de basquetebol
377215|Árbitro reserva (basquete)|arbitro reserva (basquete)
377215|Assistente de apontador (basquete)|assistente de apontador (basquete)
377215|Cronometrista (basquete)|cronometrista (basquete)
377215|Fiscal de basquetebol|fiscal de basquetebol
377215|Oficial de mesa (basquete)|oficial de mesa (basquete)
377215|Oficial de quadra (basquete)|oficial de quadra (basquete)
377215|Operador dos vinte e quatro segundos (basquete)|operador dos vinte e quatro segundos (basquete)
377220|Árbitro assistente (futebol)|arbitro assistente (futebol)
377220|Árbitro central (futebol)|arbitro central (futebol)
377220|Árbitro reserva (futebol)|arbitro reserva (futebol)
377220|Observador (futebol)|observador (futebol)
377225|Anotador (futebol de salão)|anotador (futebol de salao)
377225|Árbitro de futsal|arbitro de futsal
377225|Cronometrista (futebol de salão)|cronometrista (futebol de salao)
377225|Oficial de arbitragem (futebol de salão)|oficial de arbitragem (futebol de salao)
377230|Anotador (judô)|anotador (judo)
377230|Árbitro central (judô)|arbitro central (judo)
377230|Árbitro lateral (judô)|arbitro lateral (judo)
377230|Coordenador de área (judô)|coordenador de area (judo)
377230|Cronometrista (judô)|cronometrista (judo)
377230|Oficial de mesa (judô)|oficial de mesa (judo)
377235|Anotador de pontuação (karatê)|anotador de pontuacao (karate)
377235|Anotador (karatê)|anotador (karate)
377235|Árbitro central (karatê)|arbitro central (karate)
377235|Árbitro chefe de área (karatê)|arbitro chefe de area (karate)
377235|Árbitro reserva (karatê)|arbitro reserva (karate)
377235|Cronometrista (karatê)|cronometrista (karate)
377235|Juiz auxiliar (karatê)|juiz auxiliar (karate)
377240|Cronometrista de pólo aquático|cronometrista de polo aquatico
377240|Cronometrista de trinta e cinco segundos (poló aquático)|cronometrista de trinta e cinco segundos (polo aquatico)
377240|Juiz de gol (poloaquático)|juiz de gol (poloaquatico)
377240|Oficial de arbitragem (poloaquático)|oficial de arbitragem (poloaquatico)
377245|Apontador (vôlei)|apontador (volei)
377245|Controlador de líbero (vôlei)|controlador de libero (volei)
377245|Juiz de linha (vôlei)|juiz de linha (volei)
391105|Calculista de tempos|calculista de tempos
391105|Técnico analista de estudos de tempo|tecnico analista de estudos de tempo
391105|Técnico analista de processos de produção|tecnico analista de processos de producao
391105|Técnico de tempos e métodos|tecnico de tempos e metodos
391110|Apontador de tempo (produção)|apontador de tempo (producao)
391110|Computometrista|computometrista
391125|Calculista de produção|calculista de producao
391125|Planejador de produção (técnico)|planejador de producao (tecnico)
391125|Programador de controle de produção|programador de controle de producao
391125|Técnico analista de pcp|tecnico analista de pcp
391125|Técnico analista de produção|tecnico analista de producao
391125|Técnico analista de programação|tecnico analista de programacao
391125|Técnico de processo de fabricação|tecnico de processo de fabricacao
391125|Técnico de produção|tecnico de producao
391125|Técnico de programação de produção|tecnico de programacao de producao
391125|Técnico de programação e controle da produção e expedição|tecnico de programacao e controle da producao e expedicao
391125|Técnico em análise de controle de produção|tecnico em analise de controle de producao
391130|Analista de manutenção (equipamentos industriais)|analista de manutencao (equipamentos industriais)
391130|Especialista de manutenção (equipamentos industriais)|especialista de manutencao (equipamentos industriais)
391130|Técnico de programação e controle de serviço de manutenção|tecnico de programacao e controle de servico de manutencao
391135|Programador e controlador de materiais|programador e controlador de materiais
391135|Técnico analista de materiais|tecnico analista de materiais
391145|Analista de controle técnico de manutenção|analista de controle tecnico de manutencao
391145|Assistente de controle técnico de manutenção|assistente de controle tecnico de manutencao
391145|Assistente de planejamento de manutenção|assistente de planejamento de manutencao
391205|Agente de inspeção (qualidade)|agente de inspecao (qualidade)
391205|Controlador de qualidade|controlador de qualidade
391205|Inspetor de chopp|inspetor de chopp
391205|Inspetor de ferramentas|inspetor de ferramentas
391205|Inspetor de fundição|inspetor de fundicao
391205|Inspetor de linha de montagem|inspetor de linha de montagem
391205|Inspetor de linha de produção|inspetor de linha de producao
391205|Inspetor de linha de transmissão|inspetor de linha de transmissao
391205|Inspetor de linhas de cabos aéreos|inspetor de linhas de cabos aereos
391205|Inspetor de montagem|inspetor de montagem
391205|Inspetor de qualidade - nas indústrias|inspetor de qualidade - nas industrias
391205|Inspetor de qualidade material|inspetor de qualidade material
391205|Inspetor geral de produção|inspetor geral de producao
391205|Supervisor de operações na área de controle de produção|supervisor de operacoes na area de controle de producao
391205|Técnico de controle de qualidade|tecnico de controle de qualidade
391210|Analista de controle de qualidade|analista de controle de qualidade
391210|Analista de laboratório de controle de qualidade|analista de laboratorio de controle de qualidade
391210|Técnico analista de controle de produtos manufaturados|tecnico analista de controle de produtos manufaturados
391210|Técnico analista de controle estatístico de qualidade|tecnico analista de controle estatistico de qualidade
391210|Técnico analista de padrões de qualidade|tecnico analista de padroes de qualidade
391210|Técnico analista de pesquisa de controle de qualidade|tecnico analista de pesquisa de controle de qualidade
391210|Técnico analista de qualidade|tecnico analista de qualidade
391210|Técnico analista de recebimento de peças compradas|tecnico analista de recebimento de pecas compradas
391215|Auxiliar de técnico de controle de qualidade|auxiliar de tecnico de controle de qualidade
391215|Revisor de equipamentos (controle de qualidade)|revisor de equipamentos (controle de qualidade)
391220|Técnico de controle interno na produção|tecnico de controle interno na producao
395105|Técnico de apoio em pesquisa e desenvolvimento de processos|tecnico de apoio em pesquisa e desenvolvimento de processos
395105|Técnico de apoio em pesquisa e desenvolvimento de produtos|tecnico de apoio em pesquisa e desenvolvimento de produtos
395105|Técnico de apoio em pesquisa e desenvolvimento de tecnologias energéticas|tecnico de apoio em pesquisa e desenvolvimento de tecnologias energeticas
395105|Técnico de apoio em pesquisa e desenvolvimento em telecomunicações|tecnico de apoio em pesquisa e desenvolvimento em telecomunicacoes
410105|Agente administrativo supervisor|agente administrativo supervisor
410105|Chefe administrativo|chefe administrativo
410105|Chefe de departamento de pessoal|chefe de departamento de pessoal
410105|Chefe de escritório|chefe de escritorio
410105|Chefe de expediente - no serviço público|chefe de expediente - no servico publico
410105|Chefe de seção - no serviço público|chefe de secao - no servico publico
410105|Chefe de seção de expedição|chefe de secao de expedicao
410105|Chefe de seção de serviços administrativos|chefe de secao de servicos administrativos
410105|Chefe de seção de serviços gerais - exclusive no serviço público|chefe de secao de servicos gerais - exclusive no servico publico
410105|Chefe de serviço de limpeza|chefe de servico de limpeza
410105|Chefe de serviços de coordenação de contratos|chefe de servicos de coordenacao de contratos
410105|Chefe de setor - exclusive no serviço público|chefe de setor - exclusive no servico publico
410105|Chefe de setor - no serviço público|chefe de setor - no servico publico
410105|Coordenador administrativo|coordenador administrativo
410105|Encarregado administrativo|encarregado administrativo
410105|Encarregado de escritório - exclusive no serviço público|encarregado de escritorio - exclusive no servico publico
410105|Encarregado de serviço - exclusive no serviço público|encarregado de servico - exclusive no servico publico
410105|Subencarregado de escritório|subencarregado de escritorio
410105|Supervisor administrativo de escritório|supervisor administrativo de escritorio
410105|Supervisor administrativo de pessoal|supervisor administrativo de pessoal
410105|Supervisor administrativo interno|supervisor administrativo interno
410105|Supervisor de administração|supervisor de administracao
410105|Supervisor de administração e arquivo técnico|supervisor de administracao e arquivo tecnico
410105|Supervisor de seção de serviços gerais|supervisor de secao de servicos gerais
410205|Encarregado de almoxarifado|encarregado de almoxarifado
410205|Supervisor de materiais em almoxarifado|supervisor de materiais em almoxarifado
410210|Encarregado de câmbio|encarregado de cambio
410215|Encarregado de contas a pagar|encarregado de contas a pagar
410220|Chefe de administração patrimonial|chefe de administracao patrimonial
410220|Encarregado de ativo fixo|encarregado de ativo fixo
410220|Encarregado de patrimônio|encarregado de patrimonio
410220|Supervisor de ativo fixo|supervisor de ativo fixo
410225|Auxiliar de crédito|auxiliar de credito
410225|Balconista de crediário|balconista de crediario
410225|Encarregado de crédito e cobrança|encarregado de credito e cobranca
410225|Supervisor de cobrança de serviço financeiro, de câmbio e controle|supervisor de cobranca de servico financeiro, de cambio e controle
410225|Supervisor de crédito|supervisor de credito
410230|Chefe de orçamento|chefe de orcamento
410230|Controlador de orçamento|controlador de orcamento
410230|Encarregado de orçamento|encarregado de orcamento
410235|Chefe de serviço financeiro|chefe de servico financeiro
410235|Encarregado de controle financeiro|encarregado de controle financeiro
410235|Encarregado de tesouraria|encarregado de tesouraria
410240|Supervisor de operações logísticas|supervisor de operacoes logisticas
411005|Auxiliar administrativo|auxiliar administrativo
411005|Auxiliar de compras|auxiliar de compras
411005|Escriturário|escriturario
411010|Agente administrativo|agente administrativo
411010|Apoiador político partidário|apoiador politico partidario
411010|Assistente administrativo sindical|assistente administrativo sindical
411010|Assistente de compras|assistente de compras
411010|Assistente de escritório|assistente de escritorio
411010|Assistente técnico - no serviço público|assistente tecnico - no servico publico
411030|Apontador de cartões de ponto|apontador de cartoes de ponto
411035|Controlador de estatística|controlador de estatistica
411040|Auxiliar técnico de seguros|auxiliar tecnico de seguros
411045|Auxiliar de tráfego de exportação e importação|auxiliar de trafego de exportacao e importacao
411045|Conferente de documentação de importação e exportação|conferente de documentacao de importacao e exportacao
411045|Conferente de exportação|conferente de exportacao
411050|Agente de microfinanças|agente de microfinancas
411050|Assessor de microcrédito|assessor de microcredito
411050|Assessor de microfinanças|assessor de microfinancas
411050|Coordenador de microcrédito|coordenador de microcredito
411055|Mobilizador de recursos|mobilizador de recursos
412105|Operador de máquina de escrever|operador de maquina de escrever
412110|Digitador de terminal|digitador de terminal
412110|Operador de equipamentos de entrada de dados|operador de equipamentos de entrada de dados
412110|Operador de microcomputador|operador de microcomputador
412115|Operador de telecomunicações de correios|operador de telecomunicacoes de correios
412115|Operador de telex|operador de telex
412120|Chefe de digitação|chefe de digitacao
412120|Coordenador de digitação|coordenador de digitacao
412120|Encarregado de digitação e operação|encarregado de digitacao e operacao
412120|Encarregado de serviço de digitação|encarregado de servico de digitacao
412120|Supervisor de digitação|supervisor de digitacao
412205|Chasquil|chasquil
412205|Estafeta|estafeta
412205|Mensageiro|mensageiro
412205|Mensageiro externo|mensageiro externo
412205|Mensageiro interno|mensageiro interno
412205|Office-boy|office-boy
412205|Office-girl|office-girl
413105|Calculista de folha de pagamento|calculista de folha de pagamento
413110|Assistente de serviço de contabilidade|assistente de servico de contabilidade
413110|Auxiliar contábil|auxiliar contabil
413110|Auxiliar de contas a pagar|auxiliar de contas a pagar
413110|Auxiliar de contas a receber|auxiliar de contas a receber
413110|Auxiliar de custos|auxiliar de custos
413110|Auxiliar de escrituração fiscal|auxiliar de escrituracao fiscal
413110|Auxiliar financeiro|auxiliar financeiro
413110|Revisor contábil|revisor contabil
413115|Faturista|faturista
414105|Auxiliar de almoxarifado|auxiliar de almoxarifado
414105|Controlador de almoxarifado|controlador de almoxarifado
414110|Auxiliar de armazenamento|auxiliar de armazenamento
414110|Fiel de depósito|fiel de deposito
414110|Operador de movimentação e armazenamento de carga|operador de movimentacao e armazenamento de carga
414110|Sileiro|sileiro
414115|Encarregado de pesagem|encarregado de pesagem
414115|Fiscal de balanças|fiscal de balancas
414115|Operador de balanças rodoviárias|operador de balancas rodoviarias
414115|Operador de pesagem de matéria prima|operador de pesagem de materia prima
414115|Pesador|pesador
414120|Conferente de logística|conferente de logistica
414125|Auxiliar de estoque|auxiliar de estoque
414125|Encarregado de estoque|encarregado de estoque
414135|Auxiliar de expedição|auxiliar de expedicao
414135|Encarregado de expedição|encarregado de expedicao
414140|Auxiliar operacional de logística|auxiliar operacional de logistica
414205|Anotador de mão de obra|anotador de mao de obra
414205|Anotador de pessoal|anotador de pessoal
414205|Apontador de obras|apontador de obras
414205|Apontador de pessoal|apontador de pessoal
414205|Apropriador de mão de obra|apropriador de mao de obra
414205|Controlador de mão de obra|controlador de mao de obra
414210|Anotador de processo de produção|anotador de processo de producao
414210|Anotador de produção|anotador de producao
414210|Apontador de campo|apontador de campo
414210|Apontador industrial|apontador industrial
414210|Conferente de controle de produção|conferente de controle de producao
414210|Controlador de produção|controlador de producao
414210|Controlador de serviços de produção|controlador de servicos de producao
414210|Encarregado de seção de controle de produção|encarregado de secao de controle de producao
414215|Conferente de faturas e notas fiscais|conferente de faturas e notas fiscais
414215|Conferente portuário|conferente portuario
415105|Arquivador|arquivador
415125|Ficharista|ficharista
415130|Copiador de documentos|copiador de documentos
415130|Operador de máquina reprográfica|operador de maquina reprografica
415205|Carteiro motorizado|carteiro motorizado
415205|Entregador de correspondências (correios e telégrafos)|entregador de correspondencias (correios e telegrafos)
415205|Mensageiro (correios e telégrafos)|mensageiro (correios e telegrafos)
415210|Classificador de correspondências (correios e telégrafos)|classificador de correspondencias (correios e telegrafos)
415210|Encarregado de malote|encarregado de malote
415210|Manipulador de correspondências (correios e telégrafos)|manipulador de correspondencias (correios e telegrafos)
415210|Manipulador postal|manipulador postal
415210|Selecionador de correspondências (correios e telégrafos)|selecionador de correspondencias (correios e telegrafos)
415210|Separador de cargas postais (correios e telégrafos)|separador de cargas postais (correios e telegrafos)
415210|Separador de correspondências (correios e telégrafos)|separador de correspondencias (correios e telegrafos)
415215|Ajudante de entregador de publicações|ajudante de entregador de publicacoes
415215|Entregador de assinaturas (jornais e revistas)|entregador de assinaturas (jornais e revistas)
415215|Entregador de jornais e revistas|entregador de jornais e revistas
415215|Entregador de venda avulsa (jornais e revistas)|entregador de venda avulsa (jornais e revistas)
415310|Codificador de dados clínicos|codificador de dados clinicos
415310|Codificador hospitalar|codificador hospitalar
415310|Gestor de dados clínicos|gestor de dados clinicos
415310|Técnico em registro e informação em saúde|tecnico em registro e informacao em saude
420105|Supervisor de atendimento (caixas e bilheteiros)|supervisor de atendimento (caixas e bilheteiros)
420110|Chefe de cobrança|chefe de cobranca
420110|Coordenador de cobrança|coordenador de cobranca
420110|Encarregado de cobrança|encarregado de cobranca
420115|Supervisor de arrecadação (apostas e jogos)|supervisor de arrecadacao (apostas e jogos)
420115|Supervisor de tesouraria de apostas e jogos|supervisor de tesouraria de apostas e jogos
420120|Agente de coleta supervisor|agente de coleta supervisor
420120|Supervisor de coleta|supervisor de coleta
420125|Chefe de recepção|chefe de recepcao
420125|Coordenador de recepção|coordenador de recepcao
420125|Encarregado de recepção|encarregado de recepcao
420125|Líder de recepção|lider de recepcao
420130|Encarregado de telefonistas|encarregado de telefonistas
420135|Encarregado de telemarketing|encarregado de telemarketing
420135|Supervisor de atendimento ao cliente|supervisor de atendimento ao cliente
420135|Supervisor de central de atendimento|supervisor de central de atendimento
420135|Supervisor de teleatendimento|supervisor de teleatendimento
420135|Supervisor de televendas|supervisor de televendas
421105|Atendente comercial em agência postal|atendente comercial em agencia postal
421105|Atendente em agência de correios|atendente em agencia de correios
421110|Agente operacional de estação|agente operacional de estacao
421115|Bilheteiro de cinema|bilheteiro de cinema
421115|Bilheteiro de circo|bilheteiro de circo
421115|Bilheteiro de parques de diversão|bilheteiro de parques de diversao
421115|Bilheteiro de teatro|bilheteiro de teatro
421120|Agente de passagens|agente de passagens
421120|Agente de passagens aéreas|agente de passagens aereas
421120|Agente de reserva de passagens aéreas|agente de reserva de passagens aereas
421120|Agente de reserva de passagens rodoviárias|agente de reserva de passagens rodoviarias
421120|Agente de venda de passagens|agente de venda de passagens
421120|Bilheteiro de agência|bilheteiro de agencia
421120|Emissor de passagens aéreas|emissor de passagens aereas
421120|Emissor de passagens no transporte rodoviário|emissor de passagens no transporte rodoviario
421125|Atendente de pedágio|atendente de pedagio
421125|Caixa de bar, lanchonetes e restaurantes|caixa de bar, lanchonetes e restaurantes
421125|Caixa de loja|caixa de loja
421125|Caixa no comércio|caixa no comercio
421125|Caixa no serviço de alimentação|caixa no servico de alimentacao
421125|Caixa (supermercado)|caixa (supermercado)
421125|Fiscal de caixa|fiscal de caixa
421205|Caixa lotérico|caixa loterico
421205|Operador de caixa lotérico|operador de caixa loterico
421210|Auxiliar de apostas|auxiliar de apostas
421210|Caixa de turfe|caixa de turfe
421210|Mensageira|mensageira
421210|Operador de teleturfe|operador de teleturfe
421210|Vendedor de apostas de turfe|vendedor de apostas de turfe
421210|Vendedor de poule|vendedor de poule
421305|Cobrador de aluguéis|cobrador de alugueis
421305|Cobrador pracista|cobrador pracista
421305|Cobrador viajante|cobrador viajante
421305|Consultor de cobrança|consultor de cobranca
421305|Recuperador externo|recuperador externo
421305|Representante de cobrança|representante de cobranca
421310|Analista de cobrança|analista de cobranca
421310|Assistente de cobrança|assistente de cobranca
421310|Auxiliar de cobrança|auxiliar de cobranca
421310|Monitor de cobrança|monitor de cobranca
421310|Operador de cobrança|operador de cobranca
421310|Operador de telecobrança|operador de telecobranca
421310|Recuperador de ativos|recuperador de ativos
421310|Recuperador de crédito|recuperador de credito
421310|Recuperador interno|recuperador interno
421315|Localizador externo|localizador externo
421315|Notificador|notificador
422105|Agente de tráfego|agente de trafego
422105|Atendente de clínica  veterinária|atendente de clinica  veterinaria
422105|Atendente de consultório veterinário|atendente de consultorio veterinario
422105|Encarregado da recepção|encarregado da recepcao
422105|Funcionário de setor de informação|funcionario de setor de informacao
422105|Recepcionista atendente|recepcionista atendente
422105|Recepcionista auxiliar de secretária|recepcionista auxiliar de secretaria
422105|Recepcionista bilíngüe|recepcionista bilingue
422105|Recepcionista de crediário|recepcionista de crediario
422105|Recepcionista de empresa de navegação aérea|recepcionista de empresa de navegacao aerea
422105|Recepcionista secretária|recepcionista secretaria
422105|Recepcionista telefonista|recepcionista telefonista
422105|Recepcionista vendedor de passagens aéreas|recepcionista vendedor de passagens aereas
422110|Atendente de ambulatório|atendente de ambulatorio
422110|Atendente de clínica  médica|atendente de clinica  medica
422110|Atendente de consultório médico|atendente de consultorio medico
422110|Auxiliar de recepção|auxiliar de recepcao
422110|Recepcionista de hospital|recepcionista de hospital
422115|Atendente de seguro saúde|atendente de seguro saude
422120|Guest relations|guest relations
422120|Recepcionista caixa|recepcionista caixa
422205|Operador de centro telefônico|operador de centro telefonico
422205|Operador de mesa telefônica|operador de mesa telefonica
422205|Operador de pabx|operador de pabx
422205|Telefonista bilíngüe|telefonista bilingue
422210|Operador bilíngüe (telefonia)|operador bilingue (telefonia)
422210|Operador internacional (telefonia)|operador internacional (telefonia)
422220|Operador de rádio (telefonia)|operador de radio (telefonia)
422220|Operador de radiotelefonia|operador de radiotelefonia
422220|Radioperador|radioperador
422305|Operador de teleatendimento ativo (telemarketing)|operador de teleatendimento ativo (telemarketing)
422305|Teleoperador ativo (telemarketing)|teleoperador ativo (telemarketing)
422310|Operador de teleatendimento híbrido (telemarketing)|operador de teleatendimento hibrido (telemarketing)
422310|Operador de telemarketing (operações híbridas)|operador de telemarketing (operacoes hibridas)
422310|Teleoperador de marketing (híbrido)|teleoperador de marketing (hibrido)
422315|Atendente central telemarketing|atendente central telemarketing
422315|Atendente de informações (telemarketing)|atendente de informacoes (telemarketing)
422315|Atendente de telemarketing|atendente de telemarketing
422315|Operador de atendimento receptivo (telemarketing)|operador de atendimento receptivo (telemarketing)
422315|Teleoperador receptivo (telemarketing)|teleoperador receptivo (telemarketing)
422320|Operador de suporte técnico (telemarketing)|operador de suporte tecnico (telemarketing)
422320|Operador de telemarketing bilíngue|operador de telemarketing bilingue
422320|Operador de telemarketing especializado|operador de telemarketing especializado
422320|Teleoperador de apoio (telemarketing)|teleoperador de apoio (telemarketing)
422320|Teleoperador de suporte técnico (telemarketing)|teleoperador de suporte tecnico (telemarketing)
422330|Atendente de emergência|atendente de emergencia
422335|Monitor de apoio ao teleatendimento|monitor de apoio ao teleatendimento
422335|Telefonista líder|telefonista lider
422335|Telefonista monitor|telefonista monitor
423105|Despachante de documentos|despachante de documentos
423105|Despachante policial|despachante policial
423110|Despachante de veículos|despachante de veiculos
423110|Despachante emplacador|despachante emplacador
423115|Vistoriador de identificação veicular|vistoriador de identificacao veicular
424105|Agente de coleta ( censo e pesquisas amostrais)|agente de coleta ( censo e pesquisas amostrais)
424105|Agente de pesquisa|agente de pesquisa
424105|Entrevistador de campo|entrevistador de campo
424105|Recenseador|recenseador
424110|Entrevistador de cati (computer assisted telephone interviewing)|entrevistador de cati (computer assisted telephone interviewing)
424110|Entrevistador de mídia|entrevistador de midia
424110|Entrevistador de pesquisa em profundidade|entrevistador de pesquisa em profundidade
424120|Coletador de preços|coletador de precos
424120|Pesquisador de preços|pesquisador de precos
424125|Técnico em estatística (escriturário)|tecnico em estatistica (escriturario)
424205|Assistente de coordenação (concurso, avaliação, exame)|assistente de coordenacao (concurso, avaliacao, exame)
424205|Coordenador de provas de local de aplicação (concurso, avaliação, exame)|coordenador de provas de local de aplicacao (concurso, avaliacao, exame)
424205|Coordenador de provas estadual (concurso, avaliação, exame)|coordenador de provas estadual (concurso, avaliacao, exame)
424205|Coordenador de provas municipal (concurso, avaliação, exame)|coordenador de provas municipal (concurso, avaliacao, exame)
424205|Supervisor de local de aplicação (concurso, avaliação, exame)|supervisor de local de aplicacao (concurso, avaliacao, exame)
424210|Chefe de sala (concurso, avaliação, exame)|chefe de sala (concurso, avaliacao, exame)
424210|Fiscal de banheiro (concurso, avaliação, exame)|fiscal de banheiro (concurso, avaliacao, exame)
424210|Fiscal de sala (concurso, avaliação, exame)|fiscal de sala (concurso, avaliacao, exame)
424210|Fiscal volante (concurso, avaliação, exame)|fiscal volante (concurso, avaliacao, exame)
510105|Chefe de bilheteria|chefe de bilheteria
510105|Encarregado de tráfego rodoviário e ferroviário|encarregado de trafego rodoviario e ferroviario
510105|Fiscal de transporte rodoviário|fiscal de transporte rodoviario
510105|Inspetor de bilheteria de transportes|inspetor de bilheteria de transportes
510105|Supervisor de bilheteira de transportes|supervisor de bilheteira de transportes
510105|Supervisor de estação ferroviária e rodoviária|supervisor de estacao ferroviaria e rodoviaria
510105|Supervisor de movimento de trens|supervisor de movimento de trens
510105|Supervisor de trens|supervisor de trens
510110|Administrador de prédios|administrador de predios
510110|Chefe de portaria (edifício)|chefe de portaria (edificio)
510110|Encarregado de edifício|encarregado de edificio
510110|Síndico (edifícios)|sindico (edificios)
510115|Encarregado de andar|encarregado de andar
510120|Encarregado de portaria de hotel|encarregado de portaria de hotel
510120|Supervisor de hospedagem|supervisor de hospedagem
510120|Supervisor de recepção de hotel|supervisor de recepcao de hotel
510130|Chefe de barewomen|chefe de barewomen
510130|Chefe de bartander|chefe de bartander
510130|Encarregado de bar e restaurante|encarregado de bar e restaurante
510130|Encarregado de cantina|encarregado de cantina
510130|Subchefe de bar|subchefe de bar
510130|Supervisor de bar|supervisor de bar
510135|Chef executivo nos serviços de alimentação|chef executivo nos servicos de alimentacao
510135|Chefe de fila nos serviços de alimentação|chefe de fila nos servicos de alimentacao
510135|Maître - no serviço de alimentação|maitre - no servico de alimentacao
510135|Maître de bar|maitre de bar
510135|Maître de boate|maitre de boate
510135|Maître de hotel|maitre de hotel
510135|Maître de restaurante|maitre de restaurante
510135|Maître executivo|maitre executivo
510135|Sommalier|sommalier
510205|Chefe de lavagem de equipamentos de proteção individual  (epi)|chefe de lavagem de equipamentos de protecao individual  (epi)
510205|Chefe de lavanderia|chefe de lavanderia
510205|Encarregado de lavanderia|encarregado de lavanderia
510205|Encarregado operacional de lavanderia|encarregado operacional de lavanderia
510205|Supervisor operacional de lavanderia|supervisor operacional de lavanderia
510305|Encarregado de bombeiros|encarregado de bombeiros
510305|Líder de bombeiros|lider de bombeiros
510310|Inspetor de segurança|inspetor de seguranca
510310|Supervisor de segurança patrimonial|supervisor de seguranca patrimonial
510310|Supervisor de segurança (vigilância)|supervisor de seguranca (vigilancia)
511105|Aeromoça|aeromoca
511105|Comissário de bordo|comissario de bordo
511105|Inspetor de bordo|inspetor de bordo
511205|Agente de serviços de fiscalização de transportes coletivos e licenciamento de veículos|agente de servicos de fiscalizacao de transportes coletivos e licenciamento de veiculos
511205|Encarregado de tráfego|encarregado de trafego
511205|Escalante|escalante
511205|Fiscal de linha|fiscal de linha
511205|Fiscal de ônibus|fiscal de onibus
511205|Fiscal de operação|fiscal de operacao
511205|Fiscal de tráfego|fiscal de trafego
511205|Fiscal de viagens|fiscal de viagens
511205|Fiscal nos transportes|fiscal nos transportes
511205|Fiscal rodoviário|fiscal rodoviario
511210|Auxiliar de operação|auxiliar de operacao
511210|Despachante de embarque|despachante de embarque
511210|Despachante de tráfego|despachante de trafego
511210|Despachante nos transportes|despachante nos transportes
511210|Encarregado de transporte coletivo (exceto trem)|encarregado de transporte coletivo (exceto trem)
511215|Trocador|trocador
511405|Guia de turismo especializado em atrativo turístico|guia de turismo especializado em atrativo turistico
511405|Guia de turismo especializado em excursão internacional|guia de turismo especializado em excursao internacional
511405|Guia de turismo especializado em excursão nacional|guia de turismo especializado em excursao nacional
511405|Guia de turismo especializado em turismo regional|guia de turismo especializado em turismo regional
511510|Piloteiro de turismo de pesca|piloteiro de turismo de pesca
511510|Pirangueiro de turismo de pesca|pirangueiro de turismo de pesca
511515|Barqueiro (turismo náutico)|barqueiro (turismo nautico)
511515|Canoeiro (turismo náutico)|canoeiro (turismo nautico)
511515|Jangadeiro (turismo náutico)|jangadeiro (turismo nautico)
512105|Caseiro|caseiro
512110|Arrumador no serviço doméstico|arrumador no servico domestico
512115|Faxineiro no serviço doméstico|faxineiro no servico domestico
513105|Governanta de residência|governanta de residencia
513115|Assistente de governanta|assistente de governanta
513115|Governanta executiva|governanta executiva
513205|Cozinheiro de restaurante|cozinheiro de restaurante
513205|Merendeiro|merendeiro
513215|Cozinheiro de restaurante de indústria|cozinheiro de restaurante de industria
513220|Cozinheiro hospitalar|cozinheiro hospitalar
513225|Cozinheiro de bordo|cozinheiro de bordo
513305|Camareiro(a) de teatro|camareiro(a) de teatro
513305|Guarda-roupeiro de teatro|guarda-roupeiro de teatro
513305|Roupeiro de teatro|roupeiro de teatro
513310|Camareiro(a) de televisão|camareiro(a) de televisao
513310|Encarregado de guarda-roupa de televisão|encarregado de guarda-roupa de televisao
513310|Guarda-roupeiro de televisão|guarda-roupeiro de televisao
513310|Roupeiro de televisão|roupeiro de televisao
513315|Arrumadeira de hotel|arrumadeira de hotel
513315|Arrumador de hotel|arrumador de hotel
513315|Camareira de hotel|camareira de hotel
513320|Camareiro no transporte marítimo e fluvial|camareiro no transporte maritimo e fluvial
513320|Comissário de bordo no transporte marítimo|comissario de bordo no transporte maritimo
513325|Encarregado de guarda-roupa de cinema|encarregado de guarda-roupa de cinema
513325|Roupeiro de cinema|roupeiro de cinema
513325|Técnica de cinema|tecnica de cinema
513405|Atendente de buffet|atendente de buffet
513405|Atendente de mesa|atendente de mesa
513405|Auxiliar de maître|auxiliar de maitre
513405|Garção|garcao
513405|Garçom de bar|garcom de bar
513405|Passador de guarnição|passador de guarnicao
513410|Atendente de estabelecimento com cervejas artesanais|atendente de estabelecimento com cervejas artesanais
513410|Cachacier|cachacier
513410|Cachacista|cachacista
513410|Degustador de vinho|degustador de vinho
513410|Escanção|escancao
513410|Especialista em cerveja|especialista em cerveja
513410|Especialista em vinho|especialista em vinho
513410|Garçom (serviços de vinhos)|garcom (servicos de vinhos)
513410|Organizador de degustações e harmonizações de bebidas|organizador de degustacoes e harmonizacoes de bebidas
513410|Sommelier de cachaça|sommelier de cachaca
513410|Sommelier de cerveja|sommelier de cerveja
513410|Sommelier de saquê|sommelier de saque
513410|Sommelier de vinho|sommelier de vinho
513415|Auxiliar de garçom|auxiliar de garcom
513415|Auxiliar de mesa em restaurantes, hotéis e outros|auxiliar de mesa em restaurantes, hoteis e outros
513415|Carregador de utensílios de cozinha|carregador de utensilios de cozinha
513420|Atendente de bar|atendente de bar
513420|Auxiliar de barman|auxiliar de barman
513420|Balconista de bar|balconista de bar
513420|Preparador de drinques e bebidas|preparador de drinques e bebidas
513425|Auxiliar de serviço de copa|auxiliar de servico de copa
513425|Chefe da copa|chefe da copa
513425|Copeiro  de bar|copeiro  de bar
513425|Copeiro  de eventos|copeiro  de eventos
513425|Copeiro  de hotel|copeiro  de hotel
513425|Copeiro  de lanchonete|copeiro  de lanchonete
513425|Copeiro  de restaurante|copeiro  de restaurante
513435|Ajudante, auxiliar de bar|ajudante, auxiliar de bar
513435|Ajudante, auxiliar de lanchonete|ajudante, auxiliar de lanchonete
513435|Atendente de balcão de café|atendente de balcao de cafe
513435|Balconista de lanchonete|balconista de lanchonete
513435|Cafeteiro|cafeteiro
513435|Cantineiro (escola)|cantineiro (escola)
513435|Chapista de lanchonete|chapista de lanchonete
513435|Servente de lanche|servente de lanche
513440|Atendente barista|atendente barista
513440|Atendente de cafeteria|atendente de cafeteria
513505|Ajudante de churrasqueiro|ajudante de churrasqueiro
513505|Ajudante de confeiteiro|ajudante de confeiteiro
513505|Ajudante de cozinha|ajudante de cozinha
513505|Ajudante de padeiro|ajudante de padeiro
513505|Ajudante de pizzaiolo|ajudante de pizzaiolo
513505|Ajudante de sushiman|ajudante de sushiman
513505|Auxiliar de churrasqueiro|auxiliar de churrasqueiro
513505|Auxiliar de confeiteiro|auxiliar de confeiteiro
513505|Auxiliar de cozinha|auxiliar de cozinha
513505|Auxiliar de padeiro|auxiliar de padeiro
513505|Auxiliar de pizzaiolo|auxiliar de pizzaiolo
513505|Auxiliar de sushiman|auxiliar de sushiman
513505|Forneiro(pizzaria)|forneiro(pizzaria)
513505|Lavador de pratos|lavador de pratos
513505|Saladeiro|saladeiro
513505|Salgadeiro|salgadeiro
513510|Lactarista escolar|lactarista escolar
513510|Lactarista hospitalar|lactarista hospitalar
514105|Cabineiro de elevador|cabineiro de elevador
514105|Encarregado de elevador|encarregado de elevador
514105|Operador de elevador|operador de elevador
514110|Encarregado de garagem|encarregado de garagem
514110|Manobrista|manobrista
514115|Fiscal de capela|fiscal de capela
514120|Zelador|zelador
514205|Agente de coleta de lixo|agente de coleta de lixo
514205|Coletor de lixo|coletor de lixo
514205|Lixeiro|lixeiro
514215|Gari|gari
514215|Margarida|margarida
514230|Coletor de lixo hospitalar|coletor de lixo hospitalar
514230|Coletor de resíduos de saúde|coletor de residuos de saude
514230|Coletor de resíduos hospitalares|coletor de residuos hospitalares
514305|Cordeiro - limpeza de vidros|cordeiro - limpeza de vidros
514305|Lavador de fachadas|lavador de fachadas
514305|Lavador de vidros|lavador de vidros
514305|Limpador de janelas|limpador de janelas
514305|Limpador de vidros alpinista industrial|limpador de vidros alpinista industrial
514305|Limpador de vidros de acesso por corda|limpador de vidros de acesso por corda
514310|Auxiliar de manutenção de edificações|auxiliar de manutencao de edificacoes
514310|Auxiliar de manutenção elétrica e hidráulica|auxiliar de manutencao eletrica e hidraulica
514315|Conservador de fachadas|conservador de fachadas
514315|Cordista|cordista
514315|Limpador de fachada alpinista industrial|limpador de fachada alpinista industrial
514315|Limpador de fachada de acesso por corda|limpador de fachada de acesso por corda
514315|Limpador de fachadas com jato|limpador de fachadas com jato
514315|Operador de balancim|operador de balancim
514320|Auxiliar de limpeza|auxiliar de limpeza
514320|Servente de limpeza|servente de limpeza
514325|Auxiliar de conservação de barragens|auxiliar de conservacao de barragens
514325|Auxiliar de conservação de obras civis|auxiliar de conservacao de obras civis
514325|Auxiliar de manutenção de edifícios|auxiliar de manutencao de edificios
514325|Oficial de manutenção|oficial de manutencao
514325|Oficial de manutenção predial|oficial de manutencao predial
514325|Oficial de serviços diversos na manutenção de edificações|oficial de servicos diversos na manutencao de edificacoes
514325|Oficial de serviços gerais na manutenção de edificações|oficial de servicos gerais na manutencao de edificacoes
514325|Trabalhador da manutenção de edificações alpinista industrial|trabalhador da manutencao de edificacoes alpinista industrial
514325|Trabalhador da manutenção de edificações de acesso por corda|trabalhador da manutencao de edificacoes de acesso por corda
514325|Trabalhador de manutenção de edifícios|trabalhador de manutencao de edificios
514325|Trabalhador na conservação de edifícios|trabalhador na conservacao de edificios
514330|Piscineiro|piscineiro
515105|Agente de saúde|agente de saude
515105|Visitador de saúde|visitador de saude
515105|Visitador de saúde em domicílio|visitador de saude em domicilio
515110|Atendente de berçário|atendente de bercario
515110|Atendente de centro cirúrgico|atendente de centro cirurgico
515110|Atendente de enfermagem no serviço doméstico|atendente de enfermagem no servico domestico
515110|Atendente de hospital|atendente de hospital
515110|Atendente de serviço de saúde|atendente de servico de saude
515110|Atendente de serviço médico|atendente de servico medico
515110|Atendente hospitalar|atendente hospitalar
515110|Atendente-enfermeiro|atendente-enfermeiro
515110|Maqueiro de hospital|maqueiro de hospital
515110|Maqueiro hospitalar|maqueiro hospitalar
515110|Padioleiro-enfermeiro|padioleiro-enfermeiro
515115|Assistente de parto|assistente de parto
515115|Parteira leiga|parteira leiga
515115|Parteira prática|parteira pratica
515120|Auxiliar de sanitarista|auxiliar de sanitarista
515120|Educador sanitário|educador sanitario
515120|Imunizador|imunizador
515120|Vigilante de saúde|vigilante de saude
515120|Visitador sanitário domiciliar|visitador sanitario domiciliar
515135|Auxiliar de enfermagem socorrista|auxiliar de enfermagem socorrista
515135|Bombeiro resgatista|bombeiro resgatista
515135|Bombeiro socorrista|bombeiro socorrista
515135|Resgatista|resgatista
515135|Resgatista socorrista|resgatista socorrista
515135|Técnico em enfermagem socorrista|tecnico em enfermagem socorrista
515140|Agente de controle de vetores|agente de controle de vetores
515140|Agente de contrrole de dengue|agente de contrrole de dengue
515140|Guarda de endemias|guarda de endemias
515205|Flebotomista|flebotomista
515215|Auxiliar técnico em patologia cínica|auxiliar tecnico em patologia cinica
515305|Arte educador|arte educador
515305|Educador de rua|educador de rua
515305|Educador social de rua|educador social de rua
515305|Instrutor educacional|instrutor educacional
515305|Orientador sócio educativo|orientador socio educativo
515310|Agente de proteção social|agente de protecao social
515310|Agente de proteção social de rua|agente de protecao social de rua
515310|Agente social|agente social
515315|Conselheiro de dependente químico|conselheiro de dependente quimico
515315|Consultor em dependência química|consultor em dependencia quimica
515325|Agente de apoio socioeducativo|agente de apoio socioeducativo
515325|Agente de segurança socioeducativa|agente de seguranca socioeducativa
515325|Agente educacional|agente educacional
515325|Atendente de reintegração social|atendente de reintegracao social
515330|Agente de ressocialização prisional|agente de ressocializacao prisional
515330|Monitor disciplinar prisional|monitor disciplinar prisional
515335|Agente intercultural|agente intercultural
515335|Intermediador cultural|intermediador cultural
515335|Mediador intercultural em saúde|mediador intercultural em saude
516110|Ajudante de cabeleireiro|ajudante de cabeleireiro
516110|Auxiliar de cabeleireiro|auxiliar de cabeleireiro
516110|Cabeleireiro afro|cabeleireiro afro
516110|Cabeleireiro escovista|cabeleireiro escovista
516110|Cabeleireiro feminino|cabeleireiro feminino
516110|Cabeleireiro masculino|cabeleireiro masculino
516110|Cabeleireiro penteador|cabeleireiro penteador
516110|Cabeleireiro tinturista|cabeleireiro tinturista
516110|Cabeleireiro unissex|cabeleireiro unissex
516120|Manicuro|manicuro
516125|Maquiador social|maquiador social
516125|Maquilador|maquilador
516130|Maquiador artístico|maquiador artistico
516130|Maquiador de cinema, teatro e tv|maquiador de cinema, teatro e tv
516145|Nail designer|nail designer
516145|Porcelanista|porcelanista
516145|Técnico em unhas|tecnico em unhas
516155|Extensionista de cílios|extensionista de cilios
516155|Lash designer|lash designer
516160|Peruqueiro|peruqueiro
516165|Artesão capilar|artesao capilar
516165|Profissional das tranças|profissional das trancas
516165|Trançadeiro (capilar)|trancadeiro (capilar)
516205|Baby-sitter|baby-sitter
516205|Pajém (baby-sitter em início de carreira)|pajem (baby-sitter em inicio de carreira)
516210|Acompanhante de idosos|acompanhante de idosos
516210|Cuidador de  pessoas idosas e dependentes|cuidador de  pessoas idosas e dependentes
516210|Cuidador de idosos domiciliar|cuidador de idosos domiciliar
516210|Cuidador de idosos institucional|cuidador de idosos institucional
516210|Gero-sitter|gero-sitter
516215|Mãe crecheira|mae crecheira
516215|Mãe substituta|mae substituta
516310|Auxiliar de lavador de roupas, a máquina industrial|auxiliar de lavador de roupas, a maquina industrial
516310|Lavador de roupa hospitalar|lavador de roupa hospitalar
516310|Lavador de roupas à maquina industrial|lavador de roupas a maquina industrial
516310|Operador de centrífuga de roupas|operador de centrifuga de roupas
516310|Operador de máquina de lavar roupas, em geral|operador de maquina de lavar roupas, em geral
516310|Operador de secadora de roupas|operador de secadora de roupas
516315|Ajudante de lavador de tapetes|ajudante de lavador de tapetes
516315|Ajudante de lavanderia de artefatos da tapeçaria|ajudante de lavanderia de artefatos da tapecaria
516315|Auxiliar de lavador de tapetes|auxiliar de lavador de tapetes
516315|Lavador de tapetes|lavador de tapetes
516315|Operador de lavadora de tapetes|operador de lavadora de tapetes
516325|Passador de roupas à prensa|passador de roupas a prensa
516325|Passador de roupas em calandra|passador de roupas em calandra
516325|Passador de roupas em manequim|passador de roupas em manequim
516405|Lavador de roupa a seco|lavador de roupa a seco
516415|Passador - no serviço do vestuário|passador - no servico do vestuario
516415|Passador a ferro a vapor|passador a ferro a vapor
516415|Passador de amostras de roupas|passador de amostras de roupas
516415|Passador de roupas|passador de roupas
516415|Passador de tecidos|passador de tecidos
516505|Agente funerário - tanatopraxista|agente funerario - tanatopraxista
516505|Atendente funerário|atendente funerario
516505|Auxiliar de funerária|auxiliar de funeraria
516605|Cremador|cremador
516605|Operador de crematório|operador de crematorio
516605|Operador de forno funerário|operador de forno funerario
516610|Coveiro|coveiro
516610|Oficial de obras - sepultador|oficial de obras - sepultador
516705|Cosmoanalista|cosmoanalista
516805|Analista kirlian|analista kirlian
516805|Cartomante|cartomante
516805|Cristalomante|cristalomante
516805|Frenólogo|frenologo
516805|Leitor de oráculos|leitor de oraculos
516805|Quirólogo|quirologo
516805|Quiromante|quiromante
516805|Radioestesista|radioestesista
516805|Rumenal|rumenal
516805|Tarólogo|tarologo
516805|Vidente|vidente
516810|Parapsicólogo|parapsicologo
516815|Ufologista|ufologista
516915|Piercer|piercer
517105|Bombeiro de aeroporto|bombeiro de aeroporto
517110|Agente de investigação de incêndio|agente de investigacao de incendio
517110|Bombeiro de empresas particulares|bombeiro de empresas particulares
517110|Bombeiro de estabelecimentos comerciais|bombeiro de estabelecimentos comerciais
517110|Bombeiro de estabelecimentos industriais|bombeiro de estabelecimentos industriais
517110|Bombeiro de segurança do trabalho|bombeiro de seguranca do trabalho
517115|Guarda-vidas|guarda-vidas
517115|Salva-surf|salva-surf
517120|Chefe de esquadrão|chefe de esquadrao
517125|Gerente de fogo|gerente de fogo
517130|Agente de proteção e defesa civil operacional|agente de protecao e defesa civil operacional
517210|Inspetor de polícia rodoviária federal|inspetor de policia rodoviaria federal
517215|Guarda civil metropolitano|guarda civil metropolitano
517220|Agente de transporte e trânsito|agente de transporte e transito
517220|Auxiliar de tráfego|auxiliar de trafego
517220|Operador de tráfego|operador de trafego
517225|Agente de polícia legislativa|agente de policia legislativa
517225|Policial legislativo federal|policial legislativo federal
517230|Agente de execução penal|agente de execucao penal
517230|Agente de segurança penitenciária|agente de seguranca penitenciaria
517230|Agente penitenciário|agente penitenciario
517230|Guarda de presídio|guarda de presidio
517230|Inspetor penitenciário|inspetor penitenciario
517235|Agente da guarda portuária|agente da guarda portuaria
517235|Inspetor de guarda portuária|inspetor de guarda portuaria
517235|Rondante de guarda portuária|rondante de guarda portuaria
517305|Vigilante de aeroporto|vigilante de aeroporto
517310|Segurança comunitário|seguranca comunitario
517310|Segurança de evento|seguranca de evento
517310|Segurança pessoal|seguranca pessoal
517320|Guarda-territorial|guarda-territorial
517320|Inspetor de guarda-territorial e florestal|inspetor de guarda-territorial e florestal
517320|Mateiro-guarda florestal|mateiro-guarda florestal
517320|Vigilante- rural|vigilante- rural
517325|Vigia portuário|vigia portuario
517325|Vigilante de embarcadouro|vigilante de embarcadouro
517325|Vigilante de portos|vigilante de portos
517330|Agente de segurança ferroviária|agente de seguranca ferroviaria
517330|Assistente de segurança|assistente de seguranca
517330|Auxiliar de segurança|auxiliar de seguranca
517330|Auxiliar de serviço de segurança|auxiliar de servico de seguranca
517330|Encarregado de portaria e segurança|encarregado de portaria e seguranca
517330|Encarregado de segurança|encarregado de seguranca
517330|Encarregado de vigilância (organizações particulares de segurança)|encarregado de vigilancia (organizacoes particulares de seguranca)
517330|Fiscal de segurança|fiscal de seguranca
517330|Fiscal de vigilância bancária|fiscal de vigilancia bancaria
517330|Fiscal de vigilância (organizações particulares de segurança)|fiscal de vigilancia (organizacoes particulares de seguranca)
517330|Guarda de banco (organizações particulares de segurança)|guarda de banco (organizacoes particulares de seguranca)
517330|Guarda de segurança|guarda de seguranca
517330|Guarda de segurança (empresa particular de segurança)|guarda de seguranca (empresa particular de seguranca)
517330|Guarda de vigilância|guarda de vigilancia
517330|Guarda-civil|guarda-civil
517330|Guarda-costas|guarda-costas
517330|Guarda-ferroviário|guarda-ferroviario
517330|Guarda-valores|guarda-valores
517330|Guarda-vigia|guarda-vigia
517330|Inspetor de vigilância|inspetor de vigilancia
517330|Ronda (organizações particulares de segurança)|ronda (organizacoes particulares de seguranca)
517330|Rondante (organizações particulares de segurança)|rondante (organizacoes particulares de seguranca)
517330|Vigilante bancário|vigilante bancario
517330|Vigilante motorista de carro-forte|vigilante motorista de carro-forte
517405|Atendente de portaria de hotel|atendente de portaria de hotel
517405|Capitão porteiro|capitao porteiro
517410|Guariteiro|guariteiro
517410|Porteiro|porteiro
517410|Porteiro industrial|porteiro industrial
517415|Controlador de acesso|controlador de acesso
517415|Medidor de temperatura corporal|medidor de temperatura corporal
517415|Porteiro de locais de diversão|porteiro de locais de diversao
517420|Vigia de rua|vigia de rua
517420|Vigia noturno|vigia noturno
517425|Assistente de prevenção de perdas|assistente de prevencao de perdas
517425|Fiscal de piso|fiscal de piso
517425|Fiscal de prevenção de perdas|fiscal de prevencao de perdas
517425|Monitor de prevenção de perdas|monitor de prevencao de perdas
519105|Bikeboy|bikeboy
519105|Condutor de bicicleta no transporte de mercadorias|condutor de bicicleta no transporte de mercadorias
519205|Agente de reciclagem de materiais|agente de reciclagem de materiais
519205|Catador de ferro-velho|catador de ferro-velho
519205|Catador de papel e papelão|catador de papel e papelao
519205|Catador de sucata|catador de sucata
519205|Catador de vasilhame|catador de vasilhame
519205|Coletor de materiais recicláveis|coletor de materiais reciclaveis
519205|Enfardador de sucata (cooperativa)|enfardador de sucata (cooperativa)
519210|Separador de material reciclável|separador de material reciclavel
519210|Separador de sucata|separador de sucata
519210|Triador de material reciclável|triador de material reciclavel
519210|Triador de sucata|triador de sucata
519215|Enfardador de material de sucata (cooperativa)|enfardador de material de sucata (cooperativa)
519215|Prenseiro|prenseiro
519215|Prensista|prensista
519305|Auxiliar de serviços veterinário|auxiliar de servicos veterinario
519325|Babá de animais domésticos (pet sitter)|baba de animais domesticos (pet sitter)
519325|Cuidador de animais domésticos|cuidador de animais domesticos
519325|Monitor em creches caninas|monitor em creches caninas
519325|Monitor em creches de animais domésticos|monitor em creches de animais domesticos
519325|Recreador de animais domésticos|recreador de animais domesticos
519330|Passeador de cães (dog walker)|passeador de caes (dog walker)
519805|Garota de programa|garota de programa
519805|Garoto de programa|garoto de programa
519805|Meretriz|meretriz
519805|Messalina|messalina
519805|Michê|miche
519805|Mulher da vida|mulher da vida
519805|Prostituta|prostituta
519805|Trabalhador do sexo|trabalhador do sexo
519905|Colador de cartazes|colador de cartazes
519905|Colocador de cartazes|colocador de cartazes
519905|Colocador de painéis|colocador de paineis
519905|Emendador de cartazes|emendador de cartazes
519905|Instalador de painéis|instalador de paineis
519905|Panfleteiro|panfleteiro
519905|Plaqueiro|plaqueiro
519905|Propagandista|propagandista
519910|Aplicador de inseticida|aplicador de inseticida
519910|Dedetizador|dedetizador
519910|Descupinizador|descupinizador
519910|Desinfestador|desinfestador
519910|Desratizador|desratizador
519915|Lustrador - engraxate|lustrador - engraxate
519915|Polidor de artefatos de couro|polidor de artefatos de couro
519915|Polidor de calçados|polidor de calcados
519920|Enxugador de quadra|enxugador de quadra
519920|Pegador de bola|pegador de bola
519920|Rodoboy|rodoboy
519925|Flanelinha|flanelinha
519925|Guardador autônomo de veículos|guardador autonomo de veiculos
519925|Guardador de carro|guardador de carro
519925|Orientador de tráfego para estacionamento|orientador de trafego para estacionamento
519935|Ajudante de lavador de automóvel|ajudante de lavador de automovel
519935|Ajudante de polidor de veículos|ajudante de polidor de veiculos
519935|Enxugador de veículos|enxugador de veiculos
519935|Enxugador e acabador na lavagem de veículos|enxugador e acabador na lavagem de veiculos
519935|Lavador de automóveis|lavador de automoveis
519935|Lavador de carros|lavador de carros
519935|Lavador de ônibus|lavador de onibus
519935|Limpador de aviões, bondes, coletivos, ônibus e trens|limpador de avioes, bondes, coletivos, onibus e trens
519935|Operador de lavador de veículos|operador de lavador de veiculos
519935|Polidor de automóveis|polidor de automoveis
519935|Polidor de veículos|polidor de veiculos
519940|Anotador de consumo de energia elétrica, água e gás|anotador de consumo de energia eletrica, agua e gas
519940|Encarregado de serviços de leitura e verificação de consumo de energia elétrica, água e gás|encarregado de servicos de leitura e verificacao de consumo de energia eletrica, agua e gas
519940|Hidrometrista|hidrometrista
519940|Leitor de hidrômetro|leitor de hidrometro
519940|Leitor de medidores de água, gás e energia elétrica|leitor de medidores de agua, gas e energia eletrica
519945|Indicador|indicador
519945|Lanterninha|lanterninha
519945|Vagalume|vagalume
520110|Supervisor comercial|supervisor comercial
520110|Supervisor de vendas no atacado|supervisor de vendas no atacado
520110|Supervisor de vendas no varejo|supervisor de vendas no varejo
521110|Consultor de vendas|consultor de vendas
521110|Operador de vendas (lojas)|operador de vendas (lojas)
521110|Vendedor - no comércio de mercadorias|vendedor - no comercio de mercadorias
521110|Vendedor interno|vendedor interno
521125|Arrumador de prateleiras - em supermercados|arrumador de prateleiras - em supermercados
521125|Arrumador de prateleiras - no comércio|arrumador de prateleiras - no comercio
521125|Repositor - em supermercados|repositor - em supermercados
521130|Ajudante de farmácia|ajudante de farmacia
521135|Atendente de posto de gasolina|atendente de posto de gasolina
521135|Bombeiro de posto de gasolina|bombeiro de posto de gasolina
521140|Atendente balconista|atendente balconista
521140|Atendente de balcão|atendente de balcao
521140|Atendente de lojas|atendente de lojas
521140|Atendente de padaria|atendente de padaria
521140|Atendente de peixaria|atendente de peixaria
521140|Atendente do setor de frios e laticínios|atendente do setor de frios e laticinios
521140|Atendente do setor de hortifrutigranjeiros|atendente do setor de hortifrutigranjeiros
521140|Atendente do setor de rotisserie (pratos prontos)|atendente do setor de rotisserie (pratos prontos)
521140|Atendente do setor de vinhos|atendente do setor de vinhos
521140|Balconista|balconista
523110|Instalador de película solar (insulfilm)|instalador de pelicula solar (insulfilm)
523115|Montador de fechaduras|montador de fechaduras
523120|Adesivador|adesivador
523120|Aplicador de adesivos|aplicador de adesivos
523120|Aplicador de adesivos em superfícies|aplicador de adesivos em superficies
523120|Aplicador de autoadesivo|aplicador de autoadesivo
523120|Envelopador|envelopador
523120|Instalador de vinil adesivo|instalador de vinil adesivo
524105|Vendedor de consórcio|vendedor de consorcio
524105|Vendedor de livros|vendedor de livros
524105|Vendedor de plano de saúde|vendedor de plano de saude
524105|Vendedor de serviços|vendedor de servicos
524105|Vendedor orçamentista|vendedor orcamentista
524105|Vendedor por catálogos|vendedor por catalogos
524105|Vendedor porta a porta|vendedor porta a porta
524205|Auxiliar de feirante|auxiliar de feirante
524210|Vendedor de jornais e revistas|vendedor de jornais e revistas
524215|Camelô (permissionário em ponto fixo)|camelo (permissionario em ponto fixo)
524305|Ambulante|ambulante
524305|Baleiro (ambulante)|baleiro (ambulante)
524305|Camelô (comércio ambulante)|camelo (comercio ambulante)
524305|Doceiro (comércio ambulante)|doceiro (comercio ambulante)
524305|Garrafeiro (comércio ambulante)|garrafeiro (comercio ambulante)
524305|Jornaleiro (ambulante)|jornaleiro (ambulante)
524305|Leiteiro (comércio ambulante)|leiteiro (comercio ambulante)
524305|Sorveteiro (comércio ambulante)|sorveteiro (comercio ambulante)
524305|Vendedor de cachorro-quente|vendedor de cachorro-quente
524310|Vendedor de pipocas ambulante|vendedor de pipocas ambulante
611005|Agropecuarista|agropecuarista
611005|Arrendatário na agropecuária|arrendatario na agropecuaria
611005|Empresário rural na agropecuária|empresario rural na agropecuaria
611005|Fazendeiro na agropecuária - conta própria|fazendeiro na agropecuaria - conta propria
611005|Meeiro na agropecuária - conta própria|meeiro na agropecuaria - conta propria
611005|Parceiro na agropecuária - conta própria|parceiro na agropecuaria - conta propria
611005|Posseiro na agropecuária - conta própria|posseiro na agropecuaria - conta propria
611005|Produtor rural na agropecuária|produtor rural na agropecuaria
611005|Proprietário na agropecuária - conta própria|proprietario na agropecuaria - conta propria
611005|Roceiro na agropecuária - conta própria|roceiro na agropecuaria - conta propria
611005|Sitiante|sitiante
611005|Sitiante na agropecuária - conta própria|sitiante na agropecuaria - conta propria
611005|Sócio-proprietário na agropecuária - conta própria|socio-proprietario na agropecuaria - conta propria
612005|Agricultor familiar polivalente|agricultor familiar polivalente
612005|Agricultor polivalente|agricultor polivalente
612005|Agricultor polivalente - conta própria|agricultor polivalente - conta propria
612005|Agricultor polivalente - empregador|agricultor polivalente - empregador
612005|Arrendatário polivalente|arrendatario polivalente
612005|Meeiro polivalente|meeiro polivalente
612005|Parceiro polivalente|parceiro polivalente
612005|Produtor rural polivalente na agricultura - conta própria|produtor rural polivalente na agricultura - conta propria
612005|Produtor rural polivalente na agricultura - empregador|produtor rural polivalente na agricultura - empregador
612005|Proprietário polivalente na agricultura - conta própria|proprietario polivalente na agricultura - conta propria
612005|Proprietário polivalente na agricultura - empregador|proprietario polivalente na agricultura - empregador
612005|Sitiante polivalente|sitiante polivalente
612005|Sócio-proprietário polivalente na agricultura - conta própria|socio-proprietario polivalente na agricultura - conta propria
612005|Sócio-proprietário polivalente na agricultura - empregador|socio-proprietario polivalente na agricultura - empregador
612105|Agricultor na produção de arroz|agricultor na producao de arroz
612105|Arrozeiro|arrozeiro
612105|Colono na produção de arroz|colono na producao de arroz
612105|Granjeiro na produção de arroz|granjeiro na producao de arroz
612105|Lavoureiro na produção de arroz|lavoureiro na producao de arroz
612105|Orizicultor|orizicultor
612105|Rizicultor|rizicultor
612105|Rizipiscicultor|rizipiscicultor
612110|Agricultor na produção da cana-de-açúcar|agricultor na producao da cana-de-acucar
612110|Canavieiro|canavieiro
612115|Agricultor na produção de cereais de inverno|agricultor na producao de cereais de inverno
612115|Colono na produção de cereais de inverno|colono na producao de cereais de inverno
612115|Lavoureiro na produção de cereais de inverno|lavoureiro na producao de cereais de inverno
612115|Produtor de aveia|produtor de aveia
612115|Produtor de centeio|produtor de centeio
612115|Produtor de cevada|produtor de cevada
612115|Produtor de trigo|produtor de trigo
612115|Produtor de triticale|produtor de triticale
612115|Triticultor|triticultor
612120|Agricultor na produção de gramíneas forrageiras|agricultor na producao de gramineas forrageiras
612120|Colono na produção de gramíneas forrageiras|colono na producao de gramineas forrageiras
612120|Granjeiro na produção de gramíneas forrageiras|granjeiro na producao de gramineas forrageiras
612120|Produtor de sementes forrageiras|produtor de sementes forrageiras
612120|Sementeiro|sementeiro
612125|Agricultor na produção de milho e sorgo|agricultor na producao de milho e sorgo
612125|Colono na produção de milho e sorgo|colono na producao de milho e sorgo
612125|Granjeiro na produção de milho e sorgo|granjeiro na producao de milho e sorgo
612125|Lavoureiro na produção de milho e sorgo|lavoureiro na producao de milho e sorgo
612125|Produtor de milho|produtor de milho
612125|Produtor de sorgo|produtor de sorgo
612205|Cotonicultor - empregador|cotonicultor - empregador
612205|Plantador de algodão|plantador de algodao
612210|Plantador de curauá|plantador de curaua
612215|Juteiro - conta própria|juteiro - conta propria
612215|Juticultor - conta própria|juticultor - conta propria
612215|Plantador de juta|plantador de juta
612220|Plantador de rami|plantador de rami
612220|Ramicultor|ramicultor
612225|Plantador de agave|plantador de agave
612225|Plantador de sisal|plantador de sisal
612225|Produtor de agave|produtor de agave
612225|Sisaleiro|sisaleiro
612305|Horticultor de legumes|horticultor de legumes
612305|Olericultor de legumes|olericultor de legumes
612310|Bataticultor|bataticultor
612310|Cebolecultor|cebolecultor
612310|Horticultor de raízes, bulbos e tubérculos|horticultor de raizes, bulbos e tuberculos
612310|Olericultor|olericultor
612315|Alfaceiro|alfaceiro
612315|Horticultor de talos, folhas e flores|horticultor de talos, folhas e flores
612315|Olericultor de talos, folhas e flores|olericultor de talos, folhas e flores
612320|Horticultor de frutos e sementes|horticultor de frutos e sementes
612320|Olericultor de frutos e sementes|olericultor de frutos e sementes
612320|Tomatecultor|tomatecultor
612405|Floricultor  de flores de corte|floricultor  de flores de corte
612410|Floricultor de flores em vaso|floricultor de flores em vaso
612415|Floricultor de forrações|floricultor de forracoes
612420|Floricultor de plantas ornamentais|floricultor de plantas ornamentais
612420|Viveirista de flores e plantas ornamentais|viveirista de flores e plantas ornamentais
612505|Bananicultor|bananicultor
612505|Citricultor|citricultor
612505|Pessicultor|pessicultor
612505|Produtor de abacate|produtor de abacate
612505|Produtor de banana|produtor de banana
612505|Produtor de caju|produtor de caju
612505|Produtor de caqui|produtor de caqui
612505|Produtor de laranja|produtor de laranja
612505|Produtor de maçã|produtor de maca
612505|Produtor de mamão|produtor de mamao
612505|Produtor de manga|produtor de manga
612505|Produtor de pêra|produtor de pera
612505|Produtor de pêssego|produtor de pessego
612510|Abacaxicultor|abacaxicultor
612510|Produtor de abacaxi|produtor de abacaxi
612510|Produtor de melancia|produtor de melancia
612510|Produtor de melão|produtor de melao
612510|Produtor de morango|produtor de morango
612515|Produtor de framboesa|produtor de framboesa
612515|Produtor de kiwi|produtor de kiwi
612515|Produtor de maracujá|produtor de maracuja
612515|Produtor de uva|produtor de uva
612515|Vinicultor|vinicultor
612515|Viticultor|viticultor
612605|Cafeicultor - empregador|cafeicultor - empregador
612605|Produtor de café|produtor de cafe
612610|Cacauicultor - empregador|cacauicultor - empregador
612615|Mateicultor - empregador|mateicultor - empregador
612620|Fumicultor - empregador|fumicultor - empregador
612625|Guaranaicultor|guaranaicultor
612625|Guaranazeiro - empregador|guaranazeiro - empregador
612705|Produtor de amendoim|produtor de amendoim
612710|Produtor de canola|produtor de canola
612710|Produtor de colza|produtor de colza
612715|Produtor de coco|produtor de coco
612720|Dendeicultor|dendeicultor
612720|Palmicultor|palmicultor
612720|Produtor da cultura de palma|produtor da cultura de palma
612720|Produtor de dendê|produtor de dende
612720|Produtor de palma|produtor de palma
612725|Produtor de girassol|produtor de girassol
612730|Produtor de linhaça|produtor de linhaca
612730|Produtor de linho|produtor de linho
612735|Produtor de mamona|produtor de mamona
612740|Produtor de soja|produtor de soja
612740|Sojicultor|sojicultor
613005|Arrendatário (pecuária)|arrendatario (pecuaria)
613005|Criador de aves e bovinos|criador de aves e bovinos
613005|Criador de gado - bovino, caprino, suíno|criador de gado - bovino, caprino, suino
613005|Criador de gado - eqüino, ovino, muar - conta própria|criador de gado - equino, ovino, muar - conta propria
613005|Engordador de gado bovino, suíno, caprino - conta própria|engordador de gado bovino, suino, caprino - conta propria
613005|Invernador de gado|invernador de gado
613005|Invernador de gado bovino, suíno, caprino, ovino - conta própria|invernador de gado bovino, suino, caprino, ovino - conta propria
613005|Parceiro na pecuária|parceiro na pecuaria
613005|Pecuarista|pecuarista
613005|Pequeno produtor rural|pequeno produtor rural
613005|Produtor  em pecuária familiar|produtor  em pecuaria familiar
613005|Produtor rural em pecuária|produtor rural em pecuaria
613010|Cachorreiro|cachorreiro
613010|Canicultor|canicultor
613010|Criador de cachorros|criador de cachorros
613010|Criador de cães|criador de caes
613010|Criador de gatos|criador de gatos
613010|Criador de pequenos animais|criador de pequenos animais
613010|Gateiro|gateiro
613010|Sócio- proprietário - na criação de pequenos animais - empregador|socio- proprietario - na criacao de pequenos animais - empregador
613105|Criador de asininos e muares - empregador|criador de asininos e muares - empregador
613105|Eqüideocultor de asininos e muares|equideocultor de asininos e muares
613105|Fazendeiro - na criação de asininos  e muares|fazendeiro - na criacao de asininos  e muares
613105|Pecuarista - na criação de asininos|pecuarista - na criacao de asininos
613105|Pecuarista - na criação de muares|pecuarista - na criacao de muares
613105|Proprietário - na criação de muares|proprietario - na criacao de muares
613105|Sitiante - na criação de asininos e muares|sitiante - na criacao de asininos e muares
613105|Sócio proprietário - na criação de asininos|socio proprietario - na criacao de asininos
613105|Sócio proprietário - na criação de muares|socio proprietario - na criacao de muares
613110|Bovinocultor - empregador|bovinocultor - empregador
613110|Cabanheiro - corte|cabanheiro - corte
613110|Criador de gado bovino (exceto gado leiteiro) - empregador|criador de gado bovino (exceto gado leiteiro) - empregador
613110|Criador de zebu|criador de zebu
613110|Criador de zebu - conta própria|criador de zebu - conta propria
613110|Criador de zebu - empregador|criador de zebu - empregador
613110|Engordador de gado bovino - empregador|engordador de gado bovino - empregador
613110|Engordador de zebu - empregador|engordador de zebu - empregador
613110|Estancieiro - na criação de gado bovino - empregador|estancieiro - na criacao de gado bovino - empregador
613110|Estancieiro na criação de gado bovino (gado de corte)|estancieiro na criacao de gado bovino (gado de corte)
613110|Fazendeiro - na criação de bovinos - empregador|fazendeiro - na criacao de bovinos - empregador
613110|Invernador - na criação de gado bovino - empregador|invernador - na criacao de gado bovino - empregador
613110|Inverneiro - na criação de gado bovino - empregador|inverneiro - na criacao de gado bovino - empregador
613110|Invernista - na criação de gado bovino - empregador|invernista - na criacao de gado bovino - empregador
613110|Parceiro - na criação de gado bovino - empregador|parceiro - na criacao de gado bovino - empregador
613110|Pecuário - na criação de gado bovino - empregador|pecuario - na criacao de gado bovino - empregador
613110|Pecuarista - na criação de gado bovino - empregador|pecuarista - na criacao de gado bovino - empregador
613110|Produtor rural de gado de corte|produtor rural de gado de corte
613110|Proprietário - na criação de gado bovino - empregador|proprietario - na criacao de gado bovino - empregador
613115|Cabanheiro - leite|cabanheiro - leite
613115|Estancieiro de leite|estancieiro de leite
613115|Leiteiro - na criação de gado bovino - empregador|leiteiro - na criacao de gado bovino - empregador
613115|Pecuarista de leite|pecuarista de leite
613115|Produtor de leite - na criação de gado bovino - empregador|produtor de leite - na criacao de gado bovino - empregador
613115|Tirador de leite - produtor|tirador de leite - produtor
613120|Bubalinocultor - corte|bubalinocultor - corte
613120|Criador de búfalos - corte|criador de bufalos - corte
613120|Fazendeiro de búfalos - corte|fazendeiro de bufalos - corte
613125|Bubalinocultor - leite|bubalinocultor - leite
613125|Criador de búfalos - leite|criador de bufalos - leite
613125|Fazendeiro de búfalos - leite|fazendeiro de bufalos - leite
613130|Criador de cavalo de raça|criador de cavalo de raca
613130|Criador de cavalos - conta própria|criador de cavalos - conta propria
613130|Criador de cavalos - empregador|criador de cavalos - empregador
613130|Criador de equideos equinos - empregador|criador de equideos equinos - empregador
613130|Equinocultor|equinocultor
613130|Fazendeiro - na criação de equinos - empregador|fazendeiro - na criacao de equinos - empregador
613130|Pantaneiro|pantaneiro
613130|Pecuarista - na criação de equinos - empregador|pecuarista - na criacao de equinos - empregador
613130|Proprietário - na criação de equinos|proprietario - na criacao de equinos
613130|Sitiante - na criação de equinos|sitiante - na criacao de equinos
613205|Caprinocultor|caprinocultor
613205|Caprinocultor - empregador|caprinocultor - empregador
613205|Caprinocultor cabanheiro|caprinocultor cabanheiro
613205|Caprinocultor de corte|caprinocultor de corte
613205|Caprinocultor de leite|caprinocultor de leite
613205|Caprinocultor matrizeiro|caprinocultor matrizeiro
613205|Criador de bode|criador de bode
613205|Criador de cabras|criador de cabras
613205|Criador de caprinos - empregador|criador de caprinos - empregador
613205|Fazendeiro - na criação de caprinos - empregador|fazendeiro - na criacao de caprinos - empregador
613205|Pecuarista - na criação de caprinos - empregador|pecuarista - na criacao de caprinos - empregador
613205|Proprietário na criação de caprinos|proprietario na criacao de caprinos
613205|Sitiante - na criação de caprinos|sitiante - na criacao de caprinos
613210|Criador de carneiro|criador de carneiro
613210|Criador de ovelhas - empregador|criador de ovelhas - empregador
613210|Criador de ovinos - empregador|criador de ovinos - empregador
613210|Fazendeiro - na criação de ovinos|fazendeiro - na criacao de ovinos
613210|Ovinocultor - empregador|ovinocultor - empregador
613210|Ovinocultor cabanheiro|ovinocultor cabanheiro
613210|Ovinocultor matrizeiro|ovinocultor matrizeiro
613210|Pecuarista - na criação de ovinos|pecuarista - na criacao de ovinos
613210|Proprietário - na criação de ovinos|proprietario - na criacao de ovinos
613210|Sitiante na criação de ovinos - empregador|sitiante na criacao de ovinos - empregador
613215|Criador de porcos - empregador|criador de porcos - empregador
613215|Criador de suínos - empregador|criador de suinos - empregador
613215|Fazendeiro na criação de suínos - empregador|fazendeiro na criacao de suinos - empregador
613215|Pecuarista - na criação de suínos empregador|pecuarista - na criacao de suinos empregador
613215|Proprietário - na criação de suínos empregador|proprietario - na criacao de suinos empregador
613215|Proprietário de granja de suínos|proprietario de granja de suinos
613215|Sitiante - na criação de suínos|sitiante - na criacao de suinos
613215|Sócio-proprietário - na criação de suínos empregador|socio-proprietario - na criacao de suinos empregador
613215|Suinocultor - criador de leitão|suinocultor - criador de leitao
613215|Suinocultor - empregador|suinocultor - empregador
613215|Suinocultor cabanheiro|suinocultor cabanheiro
613215|Suinocultor crecheiro|suinocultor crecheiro
613305|Avícola - empregador|avicola - empregador
613305|Avicultor - empregador|avicultor - empregador
613305|Avicultor avozeiro|avicultor avozeiro
613305|Avicultor comercial|avicultor comercial
613305|Avicultor matrizeiro|avicultor matrizeiro
613305|Criador de aves|criador de aves
613305|Parceiro - na criação de aves - empregador|parceiro - na criacao de aves - empregador
613305|Produtor de pinto de corte|produtor de pinto de corte
613305|Proprietário de granja - na criação de aves|proprietario de granja - na criacao de aves
613310|Coelheiro|coelheiro
613310|Criador de coelhos|criador de coelhos
613310|Criador de matrizes de coelhos|criador de matrizes de coelhos
613310|Criadores de coelhos integrados|criadores de coelhos integrados
613310|Matrizeiro de coelho|matrizeiro de coelho
613310|Parceiro na criação de coelhos|parceiro na criacao de coelhos
613310|Proprietário - na criação de coelhos|proprietario - na criacao de coelhos
613405|Abelheiro|abelheiro
613405|Apicultor - empregador|apicultor - empregador
613405|Meleiro|meleiro
613405|Proprietário - na criação de abelhas - empregador|proprietario - na criacao de abelhas - empregador
613405|Sócio-proprietário - na criação de abelhas - empregador|socio-proprietario - na criacao de abelhas - empregador
613415|Criador de minhocas|criador de minhocas
613415|Minhoqueiro|minhoqueiro
613415|Produtor de húmus de minhoca|produtor de humus de minhoca
613420|Criador de bicho-da-seda - empregador|criador de bicho-da-seda - empregador
613420|Proprietário - na criação de bicho-da-seda - empregador|proprietario - na criacao de bicho-da-seda - empregador
613420|Rancheiro|rancheiro
613420|Sericultor - conta própria|sericultor - conta propria
613420|Sócio - proprietário - na criação de bicho-da-seda - empregador|socio - proprietario - na criacao de bicho-da-seda - empregador
620105|Capataz da exploração agrícola|capataz da exploracao agricola
620105|Capataz de horticultura|capataz de horticultura
620105|Capataz na fruticultura e na floricultura|capataz na fruticultura e na floricultura
620105|Capataz na lavoura (exceto na floricultura, fruticultura e horticultura)|capataz na lavoura (exceto na floricultura, fruticultura e horticultura)
620105|Encarregado de horticultura|encarregado de horticultura
620105|Encarregado de hortifrutigrangeiros|encarregado de hortifrutigrangeiros
620105|Fiscal de lavoura|fiscal de lavoura
620105|Monitor agrícola|monitor agricola
620105|Orientador de plantio|orientador de plantio
620110|Capataz da exploração agropecuária|capataz da exploracao agropecuaria
620110|Capataz rural|capataz rural
620110|Encarregado na agropecuária|encarregado na agropecuaria
620110|Fiscal de propriedade agropecuária|fiscal de propriedade agropecuaria
620115|Capataz (criação de gado bovino)|capataz (criacao de gado bovino)
620115|Capataz de currais bovinos|capataz de currais bovinos
620115|Capataz na exploração de pecuária|capataz na exploracao de pecuaria
620115|Capataz na pecuária|capataz na pecuaria
620115|Encarregado na exploração de pecuária|encarregado na exploracao de pecuaria
621005|Agregado - na agropecuária|agregado - na agropecuaria
621005|Arameiro (colocador de arames)|arameiro (colocador de arames)
621005|Arrendatário - na agropecuária|arrendatario - na agropecuaria
621005|Bóia-fria - na agropecuária|boia-fria - na agropecuaria
621005|Camarada - na agropecuária|camarada - na agropecuaria
621005|Campeiro - na agropecuária|campeiro - na agropecuaria
621005|Camponês na agropecuária|campones na agropecuaria
621005|Colono - na agropecuária|colono - na agropecuaria
621005|Curador de animais - na agropecuária|curador de animais - na agropecuaria
621005|Destocador - na agropecuária|destocador - na agropecuaria
621005|Diarista - na agropecuária|diarista - na agropecuaria
621005|Exterminador de insetos - na agropecuária|exterminador de insetos - na agropecuaria
621005|Fazedor de cerca - inclusive na agropecuária|fazedor de cerca - inclusive na agropecuaria
621005|Limpador de pasto - na agropecuária|limpador de pasto - na agropecuaria
621005|Meeiro - na agropecuária - exclusive conta própria e empregador|meeiro - na agropecuaria - exclusive conta propria e empregador
621005|Operador de engenho|operador de engenho
621005|Parceiro na agropecuária - exclusive conta própria e empregador|parceiro na agropecuaria - exclusive conta propria e empregador
621005|Peão - na agropecuária|peao - na agropecuaria
621005|Pegador de animais - na agropecuária|pegador de animais - na agropecuaria
621005|Peneirador - na agropecuária|peneirador - na agropecuaria
621005|Rendeiro na agropecuária - exclusive conta própria e empregador|rendeiro na agropecuaria - exclusive conta propria e empregador
621005|Roceiro - na agropecuária - exclusive conta própria e empregador|roceiro - na agropecuaria - exclusive conta propria e empregador
621005|Trabalhador braçal - na agropecuária - conta própria|trabalhador bracal - na agropecuaria - conta propria
621005|Trabalhador braçal - na agropecuária - exclusive conta própria|trabalhador bracal - na agropecuaria - exclusive conta propria
621005|Trabalhador braçal - na agropecuária - exclusive empregador|trabalhador bracal - na agropecuaria - exclusive empregador
621005|Trabalhador da coleta de sementes|trabalhador da coleta de sementes
621005|Trabalhador da produção de sementes agrícolas|trabalhador da producao de sementes agricolas
621005|Trabalhador de enxada - na agropecuária|trabalhador de enxada - na agropecuaria
621005|Trabalhador na formação de pastagem|trabalhador na formacao de pastagem
621005|Trabalhador rural - na agropecuária - exclusive conta própria|trabalhador rural - na agropecuaria - exclusive conta propria
621005|Trabalhador rural - na agropecuária - exclusive empregador|trabalhador rural - na agropecuaria - exclusive empregador
622005|Chacareiro - exclusive conta própria e empregador|chacareiro - exclusive conta propria e empregador
622005|Rancheiro - na cultura|rancheiro - na cultura
622010|Jardineiro (árvores para ornamentação urbana)|jardineiro (arvores para ornamentacao urbana)
622010|Regador - na cultura|regador - na cultura
622010|Trabalhador do plantio e trato de árvores ornamentais|trabalhador do plantio e trato de arvores ornamentais
622015|Colhedor de sementes|colhedor de sementes
622015|Embalador de mudas|embalador de mudas
622015|Viveirista agrícola|viveirista agricola
622020|Abanador na agricultura|abanador na agricultura
622020|Adubador|adubador
622020|Ajudante de serviço de (aplicação de produtos agroquímicos)|ajudante de servico de (aplicacao de produtos agroquimicos)
622020|Apanhador - na cultura|apanhador - na cultura
622020|Aplicador agrícola|aplicador agricola
622020|Arrancador - na cultura|arrancador - na cultura
622020|Auxiliar de agricultura|auxiliar de agricultura
622020|Bóia-fria|boia-fria
622020|Cabeça-de-campo|cabeca-de-campo
622020|Capinador - na cultura|capinador - na cultura
622020|Capinador - na lavoura|capinador - na lavoura
622020|Capineiro - na cultura|capineiro - na cultura
622020|Capinheiro - na cultura|capinheiro - na cultura
622020|Capinzeiro - na cultura|capinzeiro - na cultura
622020|Carpidor - na cultura|carpidor - na cultura
622020|Catadeira - na cultura|catadeira - na cultura
622020|Catador - na cultura|catador - na cultura
622020|Cavador - na cultura|cavador - na cultura
622020|Ceifador|ceifador
622020|Ceifador - na cultura|ceifador - na cultura
622020|Ceifeiro|ceifeiro
622020|Cerqueiro|cerqueiro
622020|Chefe de turma volante - na cultura|chefe de turma volante - na cultura
622020|Coletor na cultura|coletor na cultura
622020|Colhedor - na cultura|colhedor - na cultura
622020|Colhedor de lavoura (exceto na floricultura, fruticultura e horticultura)|colhedor de lavoura (exceto na floricultura, fruticultura e horticultura)
622020|Cultivador de cultura permanente|cultivador de cultura permanente
622020|Cultivador de cultura temporária|cultivador de cultura temporaria
622020|Debulhador - na cultura|debulhador - na cultura
622020|Descascador - na cultura|descascador - na cultura
622020|Destalador - na cultura|destalador - na cultura
622020|Diarista na agricultura|diarista na agricultura
622020|Empreiteiro - na cultura|empreiteiro - na cultura
622020|Encarregado de silos|encarregado de silos
622020|Encoivarador - na cultura|encoivarador - na cultura
622020|Enxadeiro|enxadeiro
622020|Enxadeiro - na cultura|enxadeiro - na cultura
622020|Escolhedor - na cultura|escolhedor - na cultura
622020|Esparramador de adubos|esparramador de adubos
622020|Estercador|estercador
622020|Foiceiro|foiceiro
622020|Foiceiro - na cultura|foiceiro - na cultura
622020|Formador - na cultura|formador - na cultura
622020|Formigueiro (combate às formigas)|formigueiro (combate as formigas)
622020|Lavrador - na cultura - exclusive conta própria e empregador|lavrador - na cultura - exclusive conta propria e empregador
622020|Lavrador de cultura permanente - exclusive conta própria e empregador|lavrador de cultura permanente - exclusive conta propria e empregador
622020|Lavrador de cultura temporária - exclusive conta própria e empregador|lavrador de cultura temporaria - exclusive conta propria e empregador
622020|Lavrador na horticultura e na floricultura - exclusive conta própria e empregador|lavrador na horticultura e na floricultura - exclusive conta propria e empregador
622020|Matador de formiga - na cultura|matador de formiga - na cultura
622020|Plantador - exclusive conta própria e empregador|plantador - exclusive conta propria e empregador
622020|Plantador de cultura permanente|plantador de cultura permanente
622020|Plantador de cultura temporária|plantador de cultura temporaria
622020|Podador agrícola|podador agricola
622020|Roçador - na cultura|rocador - na cultura
622020|Ronda de formiga (combate às formigas)|ronda de formiga (combate as formigas)
622020|Safrista|safrista
622020|Selecionador e embalador de colheitas agrícolas|selecionador e embalador de colheitas agricolas
622020|Semeador|semeador
622020|Sementeiro - na cultura|sementeiro - na cultura
622020|Tarefeiro - na cultura|tarefeiro - na cultura
622020|Tirador de palha - na cultura|tirador de palha - na cultura
622020|Trabalhador agrícola polivalente|trabalhador agricola polivalente
622020|Valeiro - na cultura|valeiro - na cultura
622020|Volante na agricultura|volante na agricultura
622105|Arrozeiro - na cultura - conta própria|arrozeiro - na cultura - conta propria
622105|Colhedor de arroz|colhedor de arroz
622105|Cortador de arroz|cortador de arroz
622105|Plantador de arroz - conta própria|plantador de arroz - conta propria
622105|Plantador de arroz - empregador|plantador de arroz - empregador
622105|Rizicultor - conta própria|rizicultor - conta propria
622105|Rizicultor - empregador|rizicultor - empregador
622105|Secador de arroz|secador de arroz
622110|Colhedor de cana-de-açúcar|colhedor de cana-de-acucar
622110|Cortador de cana-de-açúcar|cortador de cana-de-acucar
622110|Plantador de cana-de-açúcar - conta própria|plantador de cana-de-acucar - conta propria
622110|Plantador de cana-de-açúcar - empregador|plantador de cana-de-acucar - empregador
622110|Tombador de cana-de-açúcar|tombador de cana-de-acucar
622115|Plantador de milho e sorgo - conta própria|plantador de milho e sorgo - conta propria
622115|Plantador de milho e sorgo - empregador|plantador de milho e sorgo - empregador
622120|Plantador de trigo - conta própria|plantador de trigo - conta propria
622120|Plantador de trigo - empregador|plantador de trigo - empregador
622120|Triticultor - conta própria|triticultor - conta propria
622120|Triticultor - empregador|triticultor - empregador
622205|Apanhador de algodão|apanhador de algodao
622205|Catador de algodão|catador de algodao
622205|Colhedor de algodão|colhedor de algodao
622205|Cotonicultor|cotonicultor
622205|Cultivador de algodão - conta própria|cultivador de algodao - conta propria
622205|Cultivador de algodão - exclusive conta própria e empregador|cultivador de algodao - exclusive conta propria e empregador
622205|Plantador de algodão - exclusive conta própria e empregador|plantador de algodao - exclusive conta propria e empregador
622210|Bagaceiro de sisal|bagaceiro de sisal
622210|Batedor de sisal - na cultura|batedor de sisal - na cultura
622210|Cultivador de agave - conta própria|cultivador de agave - conta propria
622210|Cultivador de agave - exclusive conta própria e empregador|cultivador de agave - exclusive conta propria e empregador
622210|Cultivador de sisal - conta própria|cultivador de sisal - conta propria
622210|Cultivador de sisal - exclusive conta própria e empregador|cultivador de sisal - exclusive conta propria e empregador
622210|Desfibrador de agave|desfibrador de agave
622210|Desifbrador de sisal - na cultura|desifbrador de sisal - na cultura
622210|Fibreiro de sisal|fibreiro de sisal
622210|Operador de batedor de fibras|operador de batedor de fibras
622210|Plantador de sisal ou agave - exclusive conta própria e empregador|plantador de sisal ou agave - exclusive conta propria e empregador
622210|Puxador de sisal - na cultura|puxador de sisal - na cultura
622210|Resideiro de sisal|resideiro de sisal
622210|Trabalhador na cultura de agave|trabalhador na cultura de agave
622215|Bagaceiro de rami|bagaceiro de rami
622215|Batedor de rami|batedor de rami
622215|Carregador de rami|carregador de rami
622215|Cortador de rami|cortador de rami
622215|Cultivador de rami - conta própria|cultivador de rami - conta propria
622215|Cultivador de rami - exclusive conta própria e empregador|cultivador de rami - exclusive conta propria e empregador
622215|Fibreiro de rami|fibreiro de rami
622305|Trabalhador da cultura de feijão, lentilha e ervilha|trabalhador da cultura de feijao, lentilha e ervilha
622305|Trabalhador na cultura de tomate|trabalhador na cultura de tomate
622315|Plantador de beterraba|plantador de beterraba
622315|Trabalhador na cultura de batata-doce|trabalhador na cultura de batata-doce
622315|Trabalhador na cultura de batata-inglesa|trabalhador na cultura de batata-inglesa
622315|Trabalhador na cultura de beterraba|trabalhador na cultura de beterraba
622315|Trabalhador na cultura de cebola|trabalhador na cultura de cebola
622315|Trabalhador na cultura de mandioca|trabalhador na cultura de mandioca
622320|Trabalhador na cultura de hortaliças|trabalhador na cultura de hortalicas
622405|Floricultor no cultivo de flores e folhagens de corte|floricultor no cultivo de flores e folhagens de corte
622405|Trabalhador na floricultura (flores e folhagens de corte)|trabalhador na floricultura (flores e folhagens de corte)
622410|Floricultor no cultivo de flores em vaso|floricultor no cultivo de flores em vaso
622410|Trabalhador na floricultura (flores em vaso)|trabalhador na floricultura (flores em vaso)
622415|Floricultor no cultivo de forragens|floricultor no cultivo de forragens
622415|Trabalhador na floricultura (forrações)|trabalhador na floricultura (forracoes)
622420|Floricultor no cultivo de mudas|floricultor no cultivo de mudas
622420|Trabalhador na floricultura (cultivo de mudas)|trabalhador na floricultura (cultivo de mudas)
622425|Floricultor no cultivo de plantas ornamentais|floricultor no cultivo de plantas ornamentais
622425|Trabalhador da cultura de plantas ornamentais|trabalhador da cultura de plantas ornamentais
622425|Trabalhador na floricultura (plantas ornamentais)|trabalhador na floricultura (plantas ornamentais)
622505|Apanhador de laranja|apanhador de laranja
622505|Colhedor de banana|colhedor de banana
622505|Colhedor de caju|colhedor de caju
622505|Colhedor de laranja|colhedor de laranja
622505|Colhedor de manga|colhedor de manga
622505|Colhedor de pêssego|colhedor de pessego
622505|Trabalhador da cultura de abacate|trabalhador da cultura de abacate
622505|Trabalhador da cultura de acerola|trabalhador da cultura de acerola
622505|Trabalhador da cultura de ameixa|trabalhador da cultura de ameixa
622505|Trabalhador da cultura de amora|trabalhador da cultura de amora
622505|Trabalhador da cultura de atemóia|trabalhador da cultura de atemoia
622505|Trabalhador da cultura de banana|trabalhador da cultura de banana
622505|Trabalhador da cultura de cajá|trabalhador da cultura de caja
622505|Trabalhador da cultura de caju|trabalhador da cultura de caju
622505|Trabalhador da cultura de caqui|trabalhador da cultura de caqui
622505|Trabalhador da cultura de carambola|trabalhador da cultura de carambola
622505|Trabalhador da cultura de cítricos|trabalhador da cultura de citricos
622505|Trabalhador da cultura de cupuaçu|trabalhador da cultura de cupuacu
622505|Trabalhador da cultura de fruta-pão|trabalhador da cultura de fruta-pao
622505|Trabalhador da cultura de goiaba|trabalhador da cultura de goiaba
622505|Trabalhador da cultura de graviola|trabalhador da cultura de graviola
622505|Trabalhador da cultura de jaca|trabalhador da cultura de jaca
622505|Trabalhador da cultura de jenipapo|trabalhador da cultura de jenipapo
622505|Trabalhador da cultura de laranja e outros cítricos|trabalhador da cultura de laranja e outros citricos
622505|Trabalhador da cultura de maçã|trabalhador da cultura de maca
622505|Trabalhador da cultura de manga|trabalhador da cultura de manga
622505|Trabalhador da cultura de nectarina|trabalhador da cultura de nectarina
622505|Trabalhador da cultura de pêra|trabalhador da cultura de pera
622505|Trabalhador da cultura de pêssego|trabalhador da cultura de pessego
622505|Trabalhador da cultura de pinha|trabalhador da cultura de pinha
622505|Trabalhador da cultura de pitanga|trabalhador da cultura de pitanga
622505|Trabalhador da cultura de tamarindo|trabalhador da cultura de tamarindo
622505|Trabalhador da cultura de umbu|trabalhador da cultura de umbu
622505|Trabalhador de fruticultura em geral|trabalhador de fruticultura em geral
622505|Trabalhador na cultura de romã|trabalhador na cultura de roma
622510|Trabalhador da cultura de abacaxi|trabalhador da cultura de abacaxi
622510|Trabalhador da cultura de melancia|trabalhador da cultura de melancia
622510|Trabalhador da cultura de melão|trabalhador da cultura de melao
622510|Trabalhador da cultura de morango|trabalhador da cultura de morango
622515|Colhedor de uva|colhedor de uva
622515|Trabalhador da cultura de framboesa|trabalhador da cultura de framboesa
622515|Trabalhador da cultura de maracujá|trabalhador da cultura de maracuja
622515|Trabalhador da cultura de uva|trabalhador da cultura de uva
622515|Trabalhador no cultivo de quiui (kiwi)|trabalhador no cultivo de quiui (kiwi)
622515|Trabalhador no cultivo de uva de mesa|trabalhador no cultivo de uva de mesa
622515|Trabalhador no cultivo de uva de vinho e suco|trabalhador no cultivo de uva de vinho e suco
622605|Barcaceiro - na cultura de cacau|barcaceiro - na cultura de cacau
622605|Cacauicultor - exclusive conta própria e empregador|cacauicultor - exclusive conta propria e empregador
622605|Colhedor de cacau|colhedor de cacau
622605|Embandeirador de cacau|embandeirador de cacau
622605|Enxertador de cacau|enxertador de cacau
622605|Podador da cultura de cacau|podador da cultura de cacau
622605|Quebrador - na cultura de cacau|quebrador - na cultura de cacau
622605|Tirador - na cultura de cacau|tirador - na cultura de cacau
622605|Tropeiro - na cultura de cacau|tropeiro - na cultura de cacau
622610|Apanhador de café|apanhador de cafe
622610|Arruador de café|arruador de cafe
622610|Cafeicultor - exclusive conta própria e empregador|cafeicultor - exclusive conta propria e empregador
622610|Catador de café|catador de cafe
622610|Colhedor de café|colhedor de cafe
622610|Terreirista de café|terreirista de cafe
622610|Terrereiro de café|terrereiro de cafe
622615|Colhedor de erva-mate|colhedor de erva-mate
622615|Plantador da matecultura|plantador da matecultura
622615|Podador de erva-mate|podador de erva-mate
622615|Tarefeiro na cultura de erva-mate|tarefeiro na cultura de erva-mate
622615|Trabalhador da matecultura|trabalhador da matecultura
622620|Colhedor de fumo|colhedor de fumo
622620|Cultivador de fumo - exclusive conta própria e empregador|cultivador de fumo - exclusive conta propria e empregador
622620|Fumeiro|fumeiro
622620|Fumicultor - exclusive conta própria e empregador|fumicultor - exclusive conta propria e empregador
622625|Colhedor de guaraná|colhedor de guarana
622625|Cultivador de guaraná - exclusive conta própria e empregador|cultivador de guarana - exclusive conta propria e empregador
622625|Guaranazeiro|guaranazeiro
622625|Podador de guaraná|podador de guarana
622625|Torrador de guaraná|torrador de guarana
622715|Colhedor de coco|colhedor de coco
622715|Subidor de coqueiro|subidor de coqueiro
622720|Cortador de dendê|cortador de dende
622725|Quebrador de mamona|quebrador de mamona
622805|Lavrador da cultura de especiarias|lavrador da cultura de especiarias
622805|Trabalhador na cultura de pimenta-do-reino|trabalhador na cultura de pimenta-do-reino
623005|Amansador|amansador
623005|Amestrador|amestrador
623005|Condicionador de animais|condicionador de animais
623005|Domador - na pecuária|domador - na pecuaria
623005|Domador (asininos e muares)|domador (asininos e muares)
623005|Domador de animais domésticos|domador de animais domesticos
623005|Domador (equinos)|domador (equinos)
623005|Educador de animais|educador de animais
623005|Instrutor de animais|instrutor de animais
623005|Treinador de animais domésticos|treinador de animais domesticos
623010|Inseminador de animais|inseminador de animais
623015|Arraçoador (pecuária polivalente)|arracoador (pecuaria polivalente)
623015|Assinalador - na pecuária|assinalador - na pecuaria
623015|Campeiro - na pecuária|campeiro - na pecuaria
623015|Capataz|capataz
623015|Castrador|castrador
623015|Castrador - na pecuária|castrador - na pecuaria
623015|Cevador (pecuária)|cevador (pecuaria)
623015|Condutor de bois - na criação|condutor de bois - na criacao
623015|Condutor de bovinos|condutor de bovinos
623015|Embretador|embretador
623015|Manoseador|manoseador
623015|Peão de cavalo|peao de cavalo
623015|Peão de estábulo|peao de estabulo
623015|Preparador de ração natural para gado|preparador de racao natural para gado
623020|Tratador - na pecuária|tratador - na pecuaria
623020|Tratador de animais - na pecuária|tratador de animais - na pecuaria
623020|Tratador de animais (jardim zoológico)|tratador de animais (jardim zoologico)
623020|Vacinador de animais|vacinador de animais
623025|Casqueador de bovinos|casqueador de bovinos
623030|Ferrador de equinos|ferrador de equinos
623030|Ferrageador de equinos|ferrageador de equinos
623035|Instrutor de cães-guia|instrutor de caes-guia
623105|Adestrador de animais de trabalho ( asininos e muares)|adestrador de animais de trabalho ( asininos e muares)
623105|Campeiro (asininos e muares)|campeiro (asininos e muares)
623105|Peão (asininos e muares)|peao (asininos e muares)
623105|Tratador (asininos e muares)|tratador (asininos e muares)
623105|Treinador (asininos e muares)|treinador (asininos e muares)
623110|Ajudante de boiadeiro|ajudante de boiadeiro
623110|Ajudante de vaqueiro|ajudante de vaqueiro
623110|Arrebanhador|arrebanhador
623110|Auxiliar de vaqueiro|auxiliar de vaqueiro
623110|Batedor de pasto|batedor de pasto
623110|Campeiro (bovinos de corte)|campeiro (bovinos de corte)
623110|Peão de pecuária|peao de pecuaria
623110|Tocador de gado - na pecuária|tocador de gado - na pecuaria
623110|Trabalhador rural|trabalhador rural
623110|Vaqueiro|vaqueiro
623110|Vaqueiro - na agropecuária - exclusive conta própria e empregador|vaqueiro - na agropecuaria - exclusive conta propria e empregador
623110|Vaqueiro (bovinos corte)|vaqueiro (bovinos corte)
623110|Vaqueiro inseminador (bovinos corte)|vaqueiro inseminador (bovinos corte)
623115|Apartador de gado|apartador de gado
623115|Operador de ordenhadeira|operador de ordenhadeira
623115|Ordenhador - na pecuária|ordenhador - na pecuaria
623115|Retireiro - na pecuária|retireiro - na pecuaria
623115|Retireiro inseminador|retireiro inseminador
623115|Trabalhador - na pecuária - exclusive conta própria e empregador|trabalhador - na pecuaria - exclusive conta propria e empregador
623115|Vaqueiro (bovinhos leite)|vaqueiro (bovinhos leite)
623115|Vaqueiro inseminador|vaqueiro inseminador
623120|Campeiro (bubalinos)|campeiro (bubalinos)
623120|Peão (bubalinos)|peao (bubalinos)
623120|Retireiro|retireiro
623120|Trabalhador rural (bubalinos)|trabalhador rural (bubalinos)
623120|Vaqueiro (bubalinos)|vaqueiro (bubalinos)
623125|Adestrador (equinos)|adestrador (equinos)
623125|Campeiro (equinos)|campeiro (equinos)
623125|Cavalariço|cavalarico
623125|Cavaleiro|cavaleiro
623125|Encilhador|encilhador
623125|Pantaneiro - exclusive conta própria e empregador|pantaneiro - exclusive conta propria e empregador
623125|Peão (equinos)|peao (equinos)
623125|Repassador - na pecuária|repassador - na pecuaria
623125|Tratador (equinos)|tratador (equinos)
623125|Treinador (equinos)|treinador (equinos)
623205|Caprinocultor - exclusive conta própria|caprinocultor - exclusive conta propria
623205|Retireiro (caprinos)|retireiro (caprinos)
623205|Tratador de animais - caprinos|tratador de animais - caprinos
623210|Ovinocultor - exclusive conta própria|ovinocultor - exclusive conta propria
623210|Pastor - na pecuária|pastor - na pecuaria
623210|Tosador|tosador
623210|Tosquiador|tosquiador
623210|Trabalhador de manutenção e preparação de tosqueadeiras|trabalhador de manutencao e preparacao de tosqueadeiras
623215|Suinocultor - exclusive conta  própria|suinocultor - exclusive conta  propria
623305|Avicultor de corte - exclusive conta própria e empregador|avicultor de corte - exclusive conta propria e empregador
623310|Avicultor  de postura - exclusive conta própria e empregador|avicultor  de postura - exclusive conta propria e empregador
623310|Avicultor - exclusive conta própria na avicultura de postura|avicultor - exclusive conta propria na avicultura de postura
623315|Auxiliar de incubação|auxiliar de incubacao
623315|Incubador de ovos|incubador de ovos
623320|Cunicultor - exclusive conta própria e empregador|cunicultor - exclusive conta propria e empregador
623325|Selecionador de pintos por sexo|selecionador de pintos por sexo
623325|Sexador de pintos|sexador de pintos
623405|Cobreiro|cobreiro
623405|Serpentarista|serpentarista
623410|Apicultor - exclusive conta própria e empregador|apicultor - exclusive conta propria e empregador
623410|Criador de abelhas - exclusive conta própia e empregador|criador de abelhas - exclusive conta propia e empregador
623415|Minhoqueiro - exclusive conta própria e empregador|minhoqueiro - exclusive conta propria e empregador
623420|Criador de bicho-da-seda - conta própria|criador de bicho-da-seda - conta propria
623420|Parceiro do bicho-da-seda|parceiro do bicho-da-seda
623420|Sericicultor - exclusive conta própria e empregador|sericicultor - exclusive conta propria e empregador
623420|Sericultor - exclusive conta própria e empregador|sericultor - exclusive conta propria e empregador
623420|Trabalhador sericícola|trabalhador sericicola
630105|Encarregado da aquicultura|encarregado da aquicultura
630110|Encarregado da área florestal|encarregado da area florestal
630110|Líder da área florestal|lider da area florestal
630110|Supervisor florestal|supervisor florestal
631005|Caranguejeiro|caranguejeiro
631005|Catador de caranguejos|catador de caranguejos
631005|Catador de crustáceos|catador de crustaceos
631005|Catador de siris|catador de siris
631005|Sirieiro|sirieiro
631005|Trabalhador na captura de crustáceos|trabalhador na captura de crustaceos
631005|Trabalhador na pesca de crustáceo|trabalhador na pesca de crustaceo
631010|Mariscador|mariscador
631010|Marisqueiro|marisqueiro
631015|Lagosteiro|lagosteiro
631015|Mergulhador - pescador de lagosta|mergulhador - pescador de lagosta
631015|Pescador artesanal  de lagostas com covos|pescador artesanal  de lagostas com covos
631015|Pescador artesanal de lagostas com gaiolas|pescador artesanal de lagostas com gaiolas
631015|Pescador de lagostas|pescador de lagostas
631015|Pescador lagosteiro|pescador lagosteiro
631020|Curraleiro de pesca artesanal de peixes e camarões|curraleiro de pesca artesanal de peixes e camaroes
631020|Jangadeiro, na pesca de peixes e camarões|jangadeiro, na pesca de peixes e camaroes
631020|Pescador artesanal de camarões|pescador artesanal de camaroes
631020|Pescador artesanal de peixes|pescador artesanal de peixes
631020|Pescador artesanal de peixes e camaões com rede de calão|pescador artesanal de peixes e camaoes com rede de calao
631020|Pescador artesanal de peixes e camarões com covos|pescador artesanal de peixes e camaroes com covos
631020|Pescador artesanal de peixes e camarões com espinhel|pescador artesanal de peixes e camaroes com espinhel
631020|Pescador artesanal de peixes e camarões com redes e linhas|pescador artesanal de peixes e camaroes com redes e linhas
631020|Pescador artesanal de peixes e camarões em currais|pescador artesanal de peixes e camaroes em currais
631020|Pescador de espinhel (embarcações de pesca)|pescador de espinhel (embarcacoes de pesca)
631020|Pescador de linhas (embarcações de pesca)|pescador de linhas (embarcacoes de pesca)
631020|Pescador de peixes e camarões com redes|pescador de peixes e camaroes com redes
631020|Pescador de peixes e camarões em embarcações de pequeno porte|pescador de peixes e camaroes em embarcacoes de pequeno porte
631020|Pescador de tarrafa (peixes e camarões)|pescador de tarrafa (peixes e camaroes)
631020|Remador, na pesca de peixes e camarões|remador, na pesca de peixes e camaroes
631020|Tarrafeador na pesca de peixes e camarões|tarrafeador na pesca de peixes e camaroes
631105|Pescador de anzol|pescador de anzol
631105|Pirangueiro|pirangueiro
631305|Arraçoador de camarões|arracoador de camaroes
631305|Camaroneiro|camaroneiro
631305|Carcinicultor|carcinicultor
631310|Jacarecultor|jacarecultor
631310|Trabalhador na jacarecultura|trabalhador na jacarecultura
631315|Mitilicutor|mitilicutor
631315|Trabalhador na criação de mexilhões|trabalhador na criacao de mexilhoes
631320|Ostreicultor|ostreicultor
631320|Trabalhador da criação de ostras|trabalhador da criacao de ostras
631325|Alimentador de peixe|alimentador de peixe
631325|Arraçoador de peixe|arracoador de peixe
631325|Criador de peixes ornamentais|criador de peixes ornamentais
631325|Piscicultor|piscicultor
631325|Trabalhador - na criação de peixe - exclusive empregador|trabalhador - na criacao de peixe - exclusive empregador
631325|Trabalhador - na criação de peixes - exclusive conta própria|trabalhador - na criacao de peixes - exclusive conta propria
631325|Trabalhador na piscicultura|trabalhador na piscicultura
631330|Criador de tartarugas|criador de tartarugas
631330|Quelonicultor|quelonicultor
631335|Ranicultor|ranicultor
631335|Trabalhador na criação de rãs|trabalhador na criacao de ras
631405|Bodegueiro (gelador industrial)|bodegueiro (gelador industrial)
631405|Conservador de pescado em barco de pesca (gelador industrial)|conservador de pescado em barco de pesca (gelador industrial)
631410|Bodegueiro (gelador profissional)|bodegueiro (gelador profissional)
631410|Conservador de pescado em barco de pesca (gelador profissional)|conservador de pescado em barco de pesca (gelador profissional)
631415|Vigia da proa|vigia da proa
632005|Condutor de ecotrilha|condutor de ecotrilha
632005|Mateiro - guia|mateiro - guia
632005|Monitor ambiental (área florestal)|monitor ambiental (area florestal)
632010|Dr. Raiz|dr. raiz
632010|Erveiro|erveiro
632015|Coletor de sementes (floresta)|coletor de sementes (floresta)
632015|Produtor de mudas (florestas)|produtor de mudas (florestas)
632015|Viveirista (mudas)|viveirista (mudas)
632105|Marcador de árvores|marcador de arvores
632105|Marcador de toras|marcador de toras
632110|Auxiliar de dendrometria|auxiliar de dendrometria
632110|Auxiliar de dendrometrista|auxiliar de dendrometrista
632110|Dendrometrista|dendrometrista
632110|Romaneador|romaneador
632115|Auxiliar de inventário|auxiliar de inventario
632115|Balizador em inventário florestal|balizador em inventario florestal
632115|Inventariante florestal|inventariante florestal
632115|Mateiro|mateiro
632115|Mateiro (inventário de florestas)|mateiro (inventario de florestas)
632120|Ajudante de derrubada|ajudante de derrubada
632120|Auxiliar de operador de motosserra|auxiliar de operador de motosserra
632120|Cortador de árvores|cortador de arvores
632120|Cortador de cepos|cortador de cepos
632120|Cortador de lenha|cortador de lenha
632120|Cortador de madeira - na extração|cortador de madeira - na extracao
632120|Cortador descascador de toras|cortador descascador de toras
632120|Derrubador - na extração de madeira|derrubador - na extracao de madeira
632120|Derrubador de árvores|derrubador de arvores
632120|Operador de serras (exploração florestal)|operador de serras (exploracao florestal)
632120|Serrador de árvores - na extração de madeira|serrador de arvores - na extracao de madeira
632120|Serrador de lenha|serrador de lenha
632125|Abatedor - na extração de madeira|abatedor - na extracao de madeira
632125|Ajudante de reflorestamento|ajudante de reflorestamento
632125|Arrastador de árvores|arrastador de arvores
632125|Casqueador de toras|casqueador de toras
632125|Descascador de árvores|descascador de arvores
632125|Explorador de madeira, em geral|explorador de madeira, em geral
632125|Operador de descascador de madeira|operador de descascador de madeira
632125|Operador de máquina transportadora (madeira)|operador de maquina transportadora (madeira)
632125|Operador de triturador de toras|operador de triturador de toras
632125|Servente de reflorestamento|servente de reflorestamento
632125|Transportador de árvores|transportador de arvores
632125|Transportador de madeiras|transportador de madeiras
632205|Balateiro|balateiro
632205|Balateiro na extração de látex|balateiro na extracao de latex
632205|Borracheiro - na extração de látex|borracheiro - na extracao de latex
632205|Brabo|brabo
632205|Caucheiro|caucheiro
632205|Coletor de látex|coletor de latex
632205|Defumador de látex|defumador de latex
632205|Extrator de látex|extrator de latex
632205|Sirgueiro|sirgueiro
632205|Tirador de látex|tirador de latex
632205|Toqueiro - seringueiro|toqueiro - seringueiro
632210|Amapateiro|amapateiro
632210|Extrator de látex (gomas não elásticas)|extrator de latex (gomas nao elasticas)
632210|Maçarandubeiro|macarandubeiro
632210|Sorveiro|sorveiro
632210|Sucubeiro|sucubeiro
632210|Trabalhador da exploração de coquirana|trabalhador da exploracao de coquirana
632215|Coletor de resinas|coletor de resinas
632215|Extrator de resinas|extrator de resinas
632215|Tirador de resinas|tirador de resinas
632215|Trabalhador da cultura oiticica|trabalhador da cultura oiticica
632215|Trabalhador da exploração de breu|trabalhador da exploracao de breu
632215|Trabalhador da exploração de jatobá  (resinas)|trabalhador da exploracao de jatoba  (resinas)
632215|Trabalhador da exploração de jotaicica|trabalhador da exploracao de jotaicica
632215|Trabalhador da exploração de sucuruba|trabalhador da exploracao de sucuruba
632305|Ajuntador de andiroba|ajuntador de andiroba
632305|Carregador de andiroba|carregador de andiroba
632305|Cozinhador de andiroba|cozinhador de andiroba
632310|Apanhador de babaçu|apanhador de babacu
632310|Caldereiro - na exploração de babaçu|caldereiro - na exploracao de babacu
632310|Coletor de babaçu|coletor de babacu
632310|Extrator - na extração de babaçu|extrator - na extracao de babacu
632310|Moezeiro - na exploração do babaçu|moezeiro - na exploracao do babacu
632315|Apanhador de bacaba|apanhador de bacaba
632315|Carregador de bacaba|carregador de bacaba
632315|Cozinhador de vinho de bacaba|cozinhador de vinho de bacaba
632315|Peneirador de vinho de bacaba|peneirador de vinho de bacaba
632320|Ajuntador de buriti|ajuntador de buriti
632320|Apanhador de buriti|apanhador de buriti
632320|Carregador de buriti|carregador de buriti
632325|Aparador - na extração da carnaúba|aparador - na extracao da carnauba
632325|Baganeiro - na extração da carnaúba|baganeiro - na extracao da carnauba
632325|Batedor de palha de carnaúba|batedor de palha de carnauba
632325|Cambiteiro - na extração da carnaúba|cambiteiro - na extracao da carnauba
632325|Classificador de cera de carnaúba - na extração|classificador de cera de carnauba - na extracao
632325|Cortador de palha de carnaúba|cortador de palha de carnauba
632325|Cozinhador de cera de carnaúba - na extração|cozinhador de cera de carnauba - na extracao
632325|Enfeixador de palha de carnaúba|enfeixador de palha de carnauba
632325|Foiceiro - na extração da carnaúba|foiceiro - na extracao da carnauba
632325|Juntador - na extração da carnaúba|juntador - na extracao da carnauba
632325|Lasteiro - na extração da carnaúba|lasteiro - na extracao da carnauba
632335|Aparador de óleo de copaíba|aparador de oleo de copaiba
632335|Tirador de óleo de copaíba|tirador de oleo de copaiba
632340|Cultivador de malva - exclusive conta própria e empregador|cultivador de malva - exclusive conta propria e empregador
632340|Plantador de malva|plantador de malva
632340|Trabalhador da cultura de malva|trabalhador da cultura de malva
632340|Trabalhador da exploração de pãina|trabalhador da exploracao de paina
632355|Ajuntador de ouricuri|ajuntador de ouricuri
632355|Cortador de ouricuri|cortador de ouricuri
632355|Cortador de palha de ouricuri|cortador de palha de ouricuri
632355|Quebrador de ouricuri|quebrador de ouricuri
632355|Trabalhador da exploração de butiá|trabalhador da exploracao de butia
632355|Trabalhador da exploração de licuri|trabalhador da exploracao de licuri
632360|Pequizeiro|pequizeiro
632365|Amarrador de piaçava|amarrador de piacava
632365|Batedor de piaçava|batedor de piacava
632365|Beneficiador de piaçava|beneficiador de piacava
632365|Catador de piaçava|catador de piacava
632365|Cortador de palha de piaçava|cortador de palha de piacava
632365|Cortador de piaçava|cortador de piacava
632365|Extrator de piaçava|extrator de piacava
632365|Limpador de piaçava|limpador de piacava
632365|Piaçaveiro|piacaveiro
632405|Açaizeiro|acaizeiro
632405|Pecunheiro|pecunheiro
632410|Castanheiro|castanheiro
632410|Selecionador de castanha de caju|selecionador de castanha de caju
632415|Catador de pinhão|catador de pinhao
632420|Palmiteiro|palmiteiro
632420|Pupunheiro|pupunheiro
632505|Trabalhador da exploração de açacuzeiro|trabalhador da exploracao de acacuzeiro
632505|Trabalhador da exploração de amapá|trabalhador da exploracao de amapa
632505|Trabalhador da exploração de ameixeira|trabalhador da exploracao de ameixeira
632505|Trabalhador da exploração de amesca|trabalhador da exploracao de amesca
632505|Trabalhador da exploração de aroeira|trabalhador da exploracao de aroeira
632505|Trabalhador da exploração de bacupari|trabalhador da exploracao de bacupari
632505|Trabalhador da exploração de bacuri|trabalhador da exploracao de bacuri
632505|Trabalhador da exploração de canela|trabalhador da exploracao de canela
632505|Trabalhador da exploração de capitiú|trabalhador da exploracao de capitiu
632505|Trabalhador da exploração de carapanaúba|trabalhador da exploracao de carapanauba
632505|Trabalhador da exploração de catuaba|trabalhador da exploracao de catuaba
632505|Trabalhador da exploração de caxinguba|trabalhador da exploracao de caxinguba
632505|Trabalhador da exploração de cedro|trabalhador da exploracao de cedro
632505|Trabalhador da exploração de cerejeira|trabalhador da exploracao de cerejeira
632505|Trabalhador da exploração de craveira-da-terra|trabalhador da exploracao de craveira-da-terra
632505|Trabalhador da exploração de cumaru|trabalhador da exploracao de cumaru
632505|Trabalhador da exploração de favela|trabalhador da exploracao de favela
632505|Trabalhador da exploração de graviola|trabalhador da exploracao de graviola
632505|Trabalhador da exploração de inharé|trabalhador da exploracao de inhare
632505|Trabalhador da exploração de ipê-amarelo|trabalhador da exploracao de ipe-amarelo
632505|Trabalhador da exploração de ipê-roxo|trabalhador da exploracao de ipe-roxo
632505|Trabalhador da exploração de jaborandi|trabalhador da exploracao de jaborandi
632505|Trabalhador da exploração de jacareúba|trabalhador da exploracao de jacareuba
632505|Trabalhador da exploração de janaguba|trabalhador da exploracao de janaguba
632505|Trabalhador da exploração de jatobá|trabalhador da exploracao de jatoba
632505|Trabalhador da exploração de jenipapo|trabalhador da exploracao de jenipapo
632505|Trabalhador da exploração de jucá|trabalhador da exploracao de juca
632505|Trabalhador da exploração de macaca-poranga|trabalhador da exploracao de macaca-poranga
632505|Trabalhador da exploração de mangabeira|trabalhador da exploracao de mangabeira
632505|Trabalhador da exploração de marapoama|trabalhador da exploracao de marapoama
632505|Trabalhador da exploração de moreira|trabalhador da exploracao de moreira
632505|Trabalhador da exploração de mururé|trabalhador da exploracao de murure
632505|Trabalhador da exploração de pau-rosa|trabalhador da exploracao de pau-rosa
632505|Trabalhador da exploração de piquiá|trabalhador da exploracao de piquia
632505|Trabalhador da exploração de preciosa|trabalhador da exploracao de preciosa
632505|Trabalhador da exploração de quina|trabalhador da exploracao de quina
632505|Trabalhador da exploração de quinarana|trabalhador da exploracao de quinarana
632505|Trabalhador da exploração de sacaca|trabalhador da exploracao de sacaca
632505|Trabalhador da exploração de sangue-de-drago (dragão)|trabalhador da exploracao de sangue-de-drago (dragao)
632505|Trabalhador da exploração de santa-maria|trabalhador da exploracao de santa-maria
632505|Trabalhador da exploração de sucuuba|trabalhador da exploracao de sucuuba
632505|Trabalhador da exploração de tatajuba|trabalhador da exploracao de tatajuba
632510|Trabalhador da exploração de abútua|trabalhador da exploracao de abutua
632510|Trabalhador da exploração de cipó-cravo|trabalhador da exploracao de cipo-cravo
632510|Trabalhador da exploração de cipó-de-alho|trabalhador da exploracao de cipo-de-alho
632510|Trabalhador da exploração de cipó-escada|trabalhador da exploracao de cipo-escada
632510|Trabalhador da exploração de cipó-macaco|trabalhador da exploracao de cipo-macaco
632510|Trabalhador da exploração de cipó-mil-homens|trabalhador da exploracao de cipo-mil-homens
632510|Trabalhador da exploração de cipó-seda|trabalhador da exploracao de cipo-seda
632510|Trabalhador da exploração de cipó-sume|trabalhador da exploracao de cipo-sume
632510|Trabalhador da exploração de cipó-tuína|trabalhador da exploracao de cipo-tuina
632510|Trabalhador da exploração de croapé|trabalhador da exploracao de croape
632515|Trabalhador da exploração de angico|trabalhador da exploracao de angico
632515|Trabalhador da exploração de barbatimão|trabalhador da exploracao de barbatimao
632515|Trabalhador da exploração de murici-da-casca-vermelha|trabalhador da exploracao de murici-da-casca-vermelha
632515|Trabalhador da exploração de pau-para-tudo|trabalhador da exploracao de pau-para-tudo
632520|Poaieiro|poaieiro
632520|Tirador de poaia|tirador de poaia
632520|Trabalhador da exploração de ipecacuanha|trabalhador da exploracao de ipecacuanha
632520|Trabalhador da exploração de timbó|trabalhador da exploracao de timbo
632525|Trabalhador da extração de substâncias aromáticas|trabalhador da extracao de substancias aromaticas
632525|Trabalhador da extração de substâncias medicinais|trabalhador da extracao de substancias medicinais
632525|Trabalhador da extração de substâncias tóxicas|trabalhador da extracao de substancias toxicas
632605|Abastecedor de silos de carvão|abastecedor de silos de carvao
632605|Rachador de lenha para carvão|rachador de lenha para carvao
641010|Operador de estufas mecânicas|operador de estufas mecanicas
641010|Operador de máquinas agrícolas|operador de maquinas agricolas
641010|Operador de motobomba|operador de motobomba
641010|Operador de secadeiras no beneficiamento de produtos agrícolas|operador de secadeiras no beneficiamento de produtos agricolas
641010|Operador de secador de resíduos|operador de secador de residuos
641010|Operador de secador (produtos agrícolas)|operador de secador (produtos agricolas)
641015|Arador|arador
641015|Operador de adubadeira|operador de adubadeira
641015|Operador de implementos agrícolas|operador de implementos agricolas
641015|Operador de máquina agrícola|operador de maquina agricola
641015|Tratorista  operador de roçadeira|tratorista  operador de rocadeira
641015|Tratorista operador de semeadeira|tratorista operador de semeadeira
642005|Operador de máquinas florestais (colheitadeira)|operador de maquinas florestais (colheitadeira)
642015|Operador de máquinas florestais (tratores)|operador de maquinas florestais (tratores)
642015|Tratorista florestal|tratorista florestal
643020|Trabalhador na operação de sistemas de irrigação e aspersão (canhão)|trabalhador na operacao de sistemas de irrigacao e aspersao (canhao)
710115|Gerente técnico de produção (mineração)|gerente tecnico de producao (mineracao)
710115|Inspetor de produção (mineração)|inspetor de producao (mineracao)
710115|Supervisor de britagem (mineração)|supervisor de britagem (mineracao)
710115|Supervisor de escavação e transporte (mineração)|supervisor de escavacao e transporte (mineracao)
710115|Técnico de geologia|tecnico de geologia
710120|Chefe de seção de mina|chefe de secao de mina
710120|Encarregado de extração de magnésio|encarregado de extracao de magnesio
710120|Encarregado de extração de pedreira|encarregado de extracao de pedreira
710120|Encarregado de extração de talco|encarregado de extracao de talco
710120|Encarregado de extração (mineração)|encarregado de extracao (mineracao)
710120|Encarregado de pedreira (mineração)|encarregado de pedreira (mineracao)
710120|Supervisor de lavra (mineração)|supervisor de lavra (mineracao)
710120|Supervisor de produção e lavra (mineração)|supervisor de producao e lavra (mineracao)
710120|Supervisor de turno (mineração)|supervisor de turno (mineracao)
710125|Supervisor de carregamento de minérios|supervisor de carregamento de minerios
710205|Construtor civil|construtor civil
710205|Edificador - mestre de obras|edificador - mestre de obras
710205|Encarregado de alvenaria|encarregado de alvenaria
710205|Encarregado de construção civil|encarregado de construcao civil
710205|Encarregado de construção civil e carpintaria|encarregado de construcao civil e carpintaria
710205|Encarregado de construção civil e manutenção|encarregado de construcao civil e manutencao
710205|Encarregado de obras|encarregado de obras
710205|Encarregado de obras de manutenção|encarregado de obras de manutencao
710205|Encarregado de obras e instalações|encarregado de obras e instalacoes
710205|Encarregado de obras, manutenção e segurança|encarregado de obras, manutencao e seguranca
710205|Encarregado de servente|encarregado de servente
710205|Fiscal de construção|fiscal de construcao
710205|Mestre de construção civil|mestre de construcao civil
710205|Mestre de instalações mecânicas de edifícios|mestre de instalacoes mecanicas de edificios
710205|Mestre de manutenção de obras civis|mestre de manutencao de obras civis
710205|Mestre de manutenção de prédios|mestre de manutencao de predios
710205|Mestre de obras|mestre de obras
710205|Mestre de obras civis|mestre de obras civis
710205|Supervisor de conservação de obras|supervisor de conservacao de obras
710205|Supervisor de construção civil|supervisor de construcao civil
710205|Supervisor de construção e conservação|supervisor de construcao e conservacao
710205|Supervisor de construções e manutenção|supervisor de construcoes e manutencao
710210|Feitor de turma de ferrovia|feitor de turma de ferrovia
710210|Feitor de turma (ferrovias)|feitor de turma (ferrovias)
710210|Feitor de vias férreas|feitor de vias ferreas
710210|Mestre de linha férrea|mestre de linha ferrea
710210|Mestre de supervisão de linhas (ferrovias)|mestre de supervisao de linhas (ferrovias)
710210|Programador ferroviário|programador ferroviario
710210|Supervisor de controle de linhas ferroviárias|supervisor de controle de linhas ferroviarias
710215|Subencarregado de terraplenagem|subencarregado de terraplenagem
710215|Supervisor de máquina de terraplenagem|supervisor de maquina de terraplenagem
710220|Encarregado de setor de concreto|encarregado de setor de concreto
710220|Subencarregado central de concreto|subencarregado central de concreto
710220|Superintendente de usina central de concreto|superintendente de usina central de concreto
711105|Classificador de amostras - na mineração|classificador de amostras - na mineracao
711105|Classificador de minérios|classificador de minerios
711105|Colhedor de amostras - em minas|colhedor de amostras - em minas
711105|Inspetor de sondagem - na mineração|inspetor de sondagem - na mineracao
711105|Operador de torre de amostragem - na mineração|operador de torre de amostragem - na mineracao
711105|Preparador de aglomerados de minérios e rochas|preparador de aglomerados de minerios e rochas
711105|Preparador de amostras de minérios e rochas|preparador de amostras de minerios e rochas
711105|Sondador - na mineração|sondador - na mineracao
711110|Cortador de pedras - na extração de pedras|cortador de pedras - na extracao de pedras
711110|Graniteiro - na extração|graniteiro - na extracao
711110|Maçariqueiro - na mineração|macariqueiro - na mineracao
711110|Marqueiro - na mineração|marqueiro - na mineracao
711110|Operador de granitadeira|operador de granitadeira
711110|Operador de máquina a fio diamantado|operador de maquina a fio diamantado
711115|Aparelhador de pedra (mina)|aparelhador de pedra (mina)
711115|Cunhador - na extração de pedras|cunhador - na extracao de pedras
711115|Encunhador - na extração de pedras|encunhador - na extracao de pedras
711115|Encunhador de pedreira|encunhador de pedreira
711115|Macaqueiro - na extração de pedras|macaqueiro - na extracao de pedras
711115|Marreteiro - na extração de pedras|marreteiro - na extracao de pedras
711115|Marroeiro|marroeiro
711115|Marteleiro - na extração de pedras|marteleiro - na extracao de pedras
711115|Operador de desintegrador de pedras|operador de desintegrador de pedras
711115|Operador de desmineralizadora|operador de desmineralizadora
711115|Operador de pedreira|operador de pedreira
711115|Quebrador - na extração de pedras|quebrador - na extracao de pedras
711120|Assistente de cabo de fogo|assistente de cabo de fogo
711120|Auxiliar de cabo de fogo|auxiliar de cabo de fogo
711120|Blaster|blaster
711120|Cabo de fogo|cabo de fogo
711120|Dinamitador|dinamitador
711120|Explodidor - em minas e pedreiras|explodidor - em minas e pedreiras
711120|Preparador de explosivos bombeados - detonador (blaster)|preparador de explosivos bombeados - detonador (blaster)
711120|Rastilheiro|rastilheiro
711125|Madeireiro de subsolo - na mineração|madeireiro de subsolo - na mineracao
711130|Ajudante de mineiro|ajudante de mineiro
711130|Amostrista de minérios|amostrista de minerios
711130|Caboucador (minas)|caboucador (minas)
711130|Cabouqueiro - na extração de pedras|cabouqueiro - na extracao de pedras
711130|Cavouqueiro - na extração de pedras|cavouqueiro - na extracao de pedras
711130|Controlador de tráfego -na mineração|controlador de trafego -na mineracao
711130|Minerador|minerador
711130|Operador de equipamentos pesados e móveis - na mineração|operador de equipamentos pesados e moveis - na mineracao
711130|Operador de máquina perfuradora - na mineração|operador de maquina perfuradora - na mineracao
711130|Operador de máquinas de mineração|operador de maquinas de mineracao
711130|Operador de rompedor|operador de rompedor
711130|Operador de sala de controle - na mineração|operador de sala de controle - na mineracao
711130|Supervisor de mina|supervisor de mina
711130|Trabalhador da extração de pedras abrasivas|trabalhador da extracao de pedras abrasivas
711205|Operador de caminhão fora de estrada|operador de caminhao fora de estrada
711210|Operador de carregadeira|operador de carregadeira
711210|Operador de escavadeira|operador de escavadeira
711220|Condutor de máquina contínua de extração|condutor de maquina continua de extracao
711225|Marteleteiro de rocha|marteleteiro de rocha
711225|Marteleteiro detonador|marteleteiro detonador
711225|Operador de máquina de perfurar (minas e pedreiras)|operador de maquina de perfurar (minas e pedreiras)
711230|Maçariqueiro|macariqueiro
711230|Operador de jet flame|operador de jet flame
711230|Operador de máquina perfuratriz a fio diamantado|operador de maquina perfuratriz a fio diamantado
711230|Operador de water jet|operador de water jet
711230|Serrador de pedra (extração)|serrador de pedra (extracao)
711235|Operador de patrola|operador de patrola
711310|Sondador de poços tubulares e sistemas rotativos|sondador de pocos tubulares e sistemas rotativos
711315|Condutor de perfuradora de precisão|condutor de perfuradora de precisao
711315|Operador de aparelho de sonda por rotação (poço de petróleo)|operador de aparelho de sonda por rotacao (poco de petroleo)
711315|Operador de compressor - na extração de petróleo e gás|operador de compressor - na extracao de petroleo e gas
711315|Operador de extração (petróleo)|operador de extracao (petroleo)
711320|Maquinista de perfuradora de subsolo|maquinista de perfuradora de subsolo
711320|Operador de sonda manual|operador de sonda manual
711320|Operador de sonda pesada|operador de sonda pesada
711320|Perfurador de poços artesianos|perfurador de pocos artesianos
711320|Sondador de geofísica|sondador de geofisica
711325|Despachante de plataforma (petróleo)|despachante de plataforma (petroleo)
711325|Operador de plataforma (petróleo)|operador de plataforma (petroleo)
711330|Preparador e instalador de lodo para sondagem|preparador e instalador de lodo para sondagem
711330|Torrista - na extração de petróleo e gás|torrista - na extracao de petroleo e gas
711405|Barranqueiro - no garimpo|barranqueiro - no garimpo
711405|Bateador|bateador
711405|Bateeiro|bateeiro
711405|Catador de ouro|catador de ouro
711405|Faiscador - no garimpo|faiscador - no garimpo
711405|Furão - no garimpo|furao - no garimpo
711405|Garfeiro - no garimpo|garfeiro - no garimpo
711405|Gruneiro|gruneiro
711405|Jateador - no garimpo|jateador - no garimpo
711405|Maraqueiro - no garimpo|maraqueiro - no garimpo
711405|Meia-praça (garimpo)|meia-praca (garimpo)
711405|Minerador - no garimpo|minerador - no garimpo
711405|Trabalhador na lavra de ouro|trabalhador na lavra de ouro
711410|Abridor - nas salinas|abridor - nas salinas
711410|Assistente de salinas|assistente de salinas
711410|Chefe de cristalização|chefe de cristalizacao
711410|Feitor de salinas|feitor de salinas
711410|Levantador de sal|levantador de sal
711410|Marnoteiro|marnoteiro
711410|Salineiro (sal marinho)|salineiro (sal marinho)
712105|Caieiro - na fabricação de cal|caieiro - na fabricacao de cal
712105|Enquadrador de pedra - na mineração|enquadrador de pedra - na mineracao
712105|Operador de moinho (beneficiamento  de minérios)|operador de moinho (beneficiamento  de minerios)
712105|Operador de moinho de bolas (minério)|operador de moinho de bolas (minerio)
712110|Operador de beneficiamento de minérios|operador de beneficiamento de minerios
712110|Operador de célula (aparelho de flotação)|operador de celula (aparelho de flotacao)
712110|Operador de coluna de flotação|operador de coluna de flotacao
712110|Operador de equipamento de flotação|operador de equipamento de flotacao
712110|Operador de flotação|operador de flotacao
712110|Operador de instalação de beneficiamento|operador de instalacao de beneficiamento
712115|Operador de equipamentos de precipitação|operador de equipamentos de precipitacao
712115|Operador de precipitador eletrostático|operador de precipitador eletrostatico
712115|Operador de sistema de precipitação|operador de sistema de precipitacao
712120|Ajudante de britador|ajudante de britador
712120|Britador - na extração de pedras|britador - na extracao de pedras
712120|Extrator de britagem|extrator de britagem
712120|Feitor de britagem|feitor de britagem
712120|Operador britador|operador britador
712125|Operador de reagentes|operador de reagentes
712130|Operador de cone de separação (minas)|operador de cone de separacao (minas)
712130|Operador de jato de água - em minas|operador de jato de agua - em minas
712135|Operador de maracá - no garimpo|operador de maraca - no garimpo
712135|Operador de pelotização|operador de pelotizacao
712135|Operador de peneiras vibratórias|operador de peneiras vibratorias
712205|Aplainador de mármore|aplainador de marmore
712205|Cortador de mármore|cortador de marmore
712205|Cortador de pedras - lavra de pedras|cortador de pedras - lavra de pedras
712205|Marmorista - exclusive empregador  em marmoraria|marmorista - exclusive empregador  em marmoraria
712205|Montador de mármore|montador de marmore
712205|Operador de máquina de desdobramento de mármores|operador de maquina de desdobramento de marmores
712205|Serrador de mármore|serrador de marmore
712205|Serrador de pedras (beneficiamento)|serrador de pedras (beneficiamento)
712210|Gravador de inscrições em mármore|gravador de inscricoes em marmore
712210|Gravador de inscrições em mármore e em pedras|gravador de inscricoes em marmore e em pedras
712210|Trabalhador na colocação de inscrições em pedras|trabalhador na colocacao de inscricoes em pedras
712215|Ornamentador|ornamentador
712215|Ornamentista de pedra|ornamentista de pedra
712220|Acabador de pedras|acabador de pedras
712220|Aparelhador de pedra (mármore)|aparelhador de pedra (marmore)
712220|Polidor de granito|polidor de granito
712220|Polidor de mármore|polidor de marmore
712220|Polidor de marmorite|polidor de marmorite
712220|Polidor de pedras, a mão|polidor de pedras, a mao
712220|Polidor de pedras, a máquina|polidor de pedras, a maquina
715105|Condutor de bate-estaca|condutor de bate-estaca
715110|Operador de rolo compactador|operador de rolo compactador
715110|Operador de rolo compressor|operador de rolo compressor
715115|Condutor de escavadeira|condutor de escavadeira
715115|Condutor de pá mecânica|condutor de pa mecanica
715115|Escavadeirista|escavadeirista
715115|Operador de equipamento de escavadeira|operador de equipamento de escavadeira
715115|Operador de retro-escavadeira|operador de retro-escavadeira
715120|Condutor de máquina de abrir valas|condutor de maquina de abrir valas
715120|Valeteiro - exclusive na agropecuária|valeteiro - exclusive na agropecuaria
715125|Operador de máquina de terraplenagem|operador de maquina de terraplenagem
715125|Operador de máquina rodoviária|operador de maquina rodoviaria
715125|Operador de tratores diversos|operador de tratores diversos
715130|Condutor de motoniveladora|condutor de motoniveladora
715130|Condutor de niveladora|condutor de niveladora
715130|Operador de equipamento de motoniveladora|operador de equipamento de motoniveladora
715130|Operador de niveladora e de scraper|operador de niveladora e de scraper
715130|Operador de patrol (niveladora)|operador de patrol (niveladora)
715130|Operador de trator de esteira|operador de trator de esteira
715130|Operador patroleiro|operador patroleiro
715130|Patroleiro|patroleiro
715130|Patroleiro de pavimentação|patroleiro de pavimentacao
715130|Patroleiro de terraplanagem|patroleiro de terraplanagem
715135|Operador de pá carregadeira de esteira|operador de pa carregadeira de esteira
715135|Operador de pá carregadeira de pneu|operador de pa carregadeira de pneu
715135|Operador de pá carregadeira e tratores|operador de pa carregadeira e tratores
715135|Operador de pá mecânica|operador de pa mecanica
715135|Operador de pá mecânica em subsolo|operador de pa mecanica em subsolo
715140|Condutor de asfaltadora|condutor de asfaltadora
715140|Condutor de pavimentadora|condutor de pavimentadora
715140|Conservador de estradas de rodagem|conservador de estradas de rodagem
715140|Pavimentador|pavimentador
715140|Trabalhador de pavimentação (rodovias)|trabalhador de pavimentacao (rodovias)
715140|Trabalhadores de conservação de rodovias|trabalhadores de conservacao de rodovias
715145|Operador de trator - exclusive na agropecuária|operador de trator - exclusive na agropecuaria
715145|Tratorista - exclusive na agropecuária|tratorista - exclusive na agropecuaria
715205|Acafelador|acafelador
715205|Ajudante de calceteiro|ajudante de calceteiro
715205|Asfaltador|asfaltador
715205|Cabuqueiro|cabuqueiro
715205|Rasteleiro de asfalto|rasteleiro de asfalto
715210|Entaipador|entaipador
715210|Entijolador|entijolador
715210|Estucador|estucador
715210|Pedreiro de acabamento|pedreiro de acabamento
715210|Pedreiro de concreto|pedreiro de concreto
715210|Pedreiro de fachada|pedreiro de fachada
715210|Pedreiro de manutenção e conservação|pedreiro de manutencao e conservacao
715210|Pedreiro de reforma geral|pedreiro de reforma geral
715215|Pedreiro de chaminés|pedreiro de chamines
715220|Pedreiro de forno|pedreiro de forno
715220|Refratarista (pedreiro)|refratarista (pedreiro)
715225|Pedreiro de mineração|pedreiro de mineracao
715230|Alvanel|alvanel
715230|Alvaner|alvaner
715230|Pedreiro de alvenaria|pedreiro de alvenaria
715315|Armador de ferragens na construção civil|armador de ferragens na construcao civil
715315|Armador de ferros|armador de ferros
715315|Ferreiro armador na construção civil|ferreiro armador na construcao civil
715405|Condutor de betoneira|condutor de betoneira
715405|Motorista operador de betoneira|motorista operador de betoneira
715410|Bombista|bombista
715410|Motorista operador de bomba de concreto|motorista operador de bomba de concreto
715415|Balanceiro de concreto|balanceiro de concreto
715415|Concreteiro|concreteiro
715415|Operador de balança (concreto)|operador de balanca (concreto)
715420|Auxiliar de operador de usina de asfalto|auxiliar de operador de usina de asfalto
715420|Operador de central de asfalto|operador de central de asfalto
715505|Carapina|carapina
715505|Carpinteiro auxiliar|carpinteiro auxiliar
715505|Carpinteiro de estruturas|carpinteiro de estruturas
715505|Carpinteiro de manutenção|carpinteiro de manutencao
715505|Oficial carpinteiro|oficial carpinteiro
715510|Montador de esquadrias de madeira|montador de esquadrias de madeira
715515|Carpinteiro de estúdio|carpinteiro de estudio
715515|Montador de andaimes (cenários)|montador de andaimes (cenarios)
715525|Carpinteiro (obras)|carpinteiro (obras)
715530|Armador de telhados|armador de telhados
715535|Ajustador de fôrmas (concreto)|ajustador de formas (concreto)
715535|Carpinteiro de fôrmas (concreto)|carpinteiro de formas (concreto)
715540|Carpinteiro de pontes|carpinteiro de pontes
715605|Eletricista de teatro e televisão|eletricista de teatro e televisao
715610|Eletricista de instalações comerciais e residenciais|eletricista de instalacoes comerciais e residenciais
715610|Eletricista de instalações de prédios|eletricista de instalacoes de predios
715610|Instalador reparador de equipamento de força|instalador reparador de equipamento de forca
715615|Ajudante de eletricista|ajudante de eletricista
715615|Eletricista auxiliar|eletricista auxiliar
715615|Eletricista de instalações elétricas de minas|eletricista de instalacoes eletricas de minas
715615|Eletricista de instalações (iluminação a gás neon)|eletricista de instalacoes (iluminacao a gas neon)
715615|Eletricista de instalações industriais|eletricista de instalacoes industriais
715615|Eletricista de instalações (semáforos)|eletricista de instalacoes (semaforos)
715615|Eletricista de planejamento de instalações elétricas|eletricista de planejamento de instalacoes eletricas
715615|Instalador de antenas de televisão|instalador de antenas de televisao
715705|Aplicador de isolante (coberturas)|aplicador de isolante (coberturas)
715705|Operador de rolo (impermeabilização)|operador de rolo (impermeabilizacao)
715710|Operador de gunite|operador de gunite
715715|Aplicador de isolante térmico|aplicador de isolante termico
715715|Isolador térmico|isolador termico
715720|Aplicador de material isolante em caldeiras e tubulações|aplicador de material isolante em caldeiras e tubulacoes
715720|Isolador refratarista (caldeira e tubulações)|isolador refratarista (caldeira e tubulacoes)
715720|Refratarista (caldeira e tubulações)|refratarista (caldeira e tubulacoes)
715725|Oficial de manutenção civil|oficial de manutencao civil
716305|Assentador de vidros|assentador de vidros
716305|Auxiliar de colocador de vidros|auxiliar de colocador de vidros
716305|Auxiliar de cortador de vidros|auxiliar de cortador de vidros
716305|Auxiliar de vidraceiro|auxiliar de vidraceiro
716305|Cortador de vidros|cortador de vidros
716305|Montador de vidros|montador de vidros
716305|Vidraceiro colocador de vidros|vidraceiro colocador de vidros
716305|Vidraceiro (painéis de vidro)|vidraceiro (paineis de vidro)
716310|Vidraceiro de clarabóias|vidraceiro de claraboias
716315|Auxiliar de vitralista|auxiliar de vitralista
716315|Vitralista (vitrais)|vitralista (vitrais)
716405|Gesseiro de decoração|gesseiro de decoracao
716405|Gesseiro de revestimento|gesseiro de revestimento
716405|Gesseiro forrador|gesseiro forrador
716405|Gesseiro fundidor|gesseiro fundidor
716405|Gesseiro modelador|gesseiro modelador
716405|Gesseiro moldureiro|gesseiro moldureiro
716405|Gesseiro montador|gesseiro montador
716405|Gesseiro plaqueiro|gesseiro plaqueiro
716505|Colocador de assoalho|colocador de assoalho
716510|Assentador cerâmico|assentador ceramico
716510|Azulejador|azulejador
716510|Azulejista|azulejista
716510|Colocador de cerâmica|colocador de ceramica
716510|Colocador de cerâmica (pastilhas)|colocador de ceramica (pastilhas)
716510|Ladrilheiro|ladrilheiro
716515|Calceteiro (pastilheiro)|calceteiro (pastilheiro)
716520|Aplicador de resinas em pisos|aplicador de resinas em pisos
716520|Aplicador de sinteco e bona|aplicador de sinteco e bona
716520|Raspador de taco|raspador de taco
716525|Acabador de mármore e granito|acabador de marmore e granito
716525|Piseiro (mármore e granito)|piseiro (marmore e granito)
716525|Polidor de mármore e granito (na construção)|polidor de marmore e granito (na construcao)
716535|Colocador de tacos|colocador de tacos
716540|Rejuntador cerâmico|rejuntador ceramico
716540|Rejuntador (construção civil)|rejuntador (construcao civil)
716605|Calafate|calafate
716605|Petintal (calafetação)|petintal (calafetacao)
716605|Raspador|raspador
716610|Ajudante de pintor|ajudante de pintor
716610|Broxador-caiador|broxador-caiador
716610|Caiador|caiador
716610|Caieiro  (pintor de paredes)|caieiro  (pintor de paredes)
716610|Pintor de alvenaria|pintor de alvenaria
716610|Pintor de casas|pintor de casas
716610|Pintor de construções cênicas|pintor de construcoes cenicas
716610|Pintor de decoração de fundo (cinema e teatro)|pintor de decoracao de fundo (cinema e teatro)
716610|Pintor de edifícios|pintor de edificios
716610|Pintor de paredes|pintor de paredes
716610|Retocador de pintura|retocador de pintura
716615|Colocador de papel de parede|colocador de papel de parede
716615|Colocador de piso vinílico|colocador de piso vinilico
716615|Colocador de pisos emborrachados|colocador de pisos emborrachados
716615|Colocador de tapetes, carpetes e pisos plásticos|colocador de tapetes, carpetes e pisos plasticos
716615|Revestidor de interiores (papel e material plástico)|revestidor de interiores (papel e material plastico)
717005|Demolidor de casas|demolidor de casas
717005|Demolidor de prédios|demolidor de predios
717010|Ajudante de marteleteiro|ajudante de marteleteiro
717010|Marteleteiro|marteleteiro
717010|Marteleteiro - na construção civil|marteleteiro - na construcao civil
717015|Cacimbeiro (poço)|cacimbeiro (poco)
717015|Cavador de poço|cavador de poco
717015|Cisterneiro|cisterneiro
717015|Poceiro|poceiro
717020|Ajudante de obras|ajudante de obras
717020|Ajudante de saneamento|ajudante de saneamento
717020|Auxiliar de pedreiro|auxiliar de pedreiro
717020|Meia-colher|meia-colher
717020|Servente (construção civil)|servente (construcao civil)
717020|Servente de pedreiro|servente de pedreiro
717025|Operador de vibrador de concreto|operador de vibrador de concreto
720105|Mestre de afiação (ferramentas)|mestre de afiacao (ferramentas)
720110|Chefe de chaparia|chefe de chaparia
720110|Coordenador de caldeiraria|coordenador de caldeiraria
720110|Mestre caldeireiro|mestre caldeireiro
720110|Mestre de seção de caldeiraria|mestre de secao de caldeiraria
720110|Mestre de seção de caldeiraria leve|mestre de secao de caldeiraria leve
720110|Mestre de seção de caldeiraria pesada|mestre de secao de caldeiraria pesada
720115|Mestre de construção de ferramentas e dispositivos|mestre de construcao de ferramentas e dispositivos
720115|Mestre de construção de matrizes|mestre de construcao de matrizes
720115|Mestre de correção de ferramentas|mestre de correcao de ferramentas
720115|Mestre de ferramentas|mestre de ferramentas
720120|Mestre de seção de forjaria (fornos)|mestre de secao de forjaria (fornos)
720120|Mestre ferreiro|mestre ferreiro
720125|Chefe de setor de fundição de metais|chefe de setor de fundicao de metais
720125|Encarregado de seção de fundição|encarregado de secao de fundicao
720125|Encarregado de vazamento de fundição de ferro|encarregado de vazamento de fundicao de ferro
720125|Encarregado geral de fundição|encarregado geral de fundicao
720125|Mestre de forno fundição|mestre de forno fundicao
720125|Mestre de fundição de alumínio|mestre de fundicao de aluminio
720125|Mestre de fundição de materiais|mestre de fundicao de materiais
720125|Mestre de lingotamento|mestre de lingotamento
720125|Mestre de lingoteiras|mestre de lingoteiras
720125|Mestre de macharia|mestre de macharia
720125|Mestre de molde manual|mestre de molde manual
720125|Mestre de produção de fundição de alumínio|mestre de producao de fundicao de aluminio
720125|Mestre de seção de fundição|mestre de secao de fundicao
720125|Mestre fundidor a pressão|mestre fundidor a pressao
720130|Chefe de setor de cromação|chefe de setor de cromacao
720130|Mestre de anodização|mestre de anodizacao
720130|Mestre de cromação e lapidação de anéis|mestre de cromacao e lapidacao de aneis
720130|Mestre de estanhamento|mestre de estanhamento
720130|Mestre de galvanização|mestre de galvanizacao
720130|Mestre de niquelagem|mestre de niquelagem
720130|Mestre de pintura galvanoplástica|mestre de pintura galvanoplastica
720130|Mestre de polimento e banho (metais)|mestre de polimento e banho (metais)
720130|Mestre de zincagem|mestre de zincagem
720130|Mestre niquelador|mestre niquelador
720130|Subchefe de galvanização|subchefe de galvanizacao
720135|Encarregado de pintura (tratamento de superfícies)|encarregado de pintura (tratamento de superficies)
720135|Mestre de inspeção de pinturas (tratamento de superfícies)|mestre de inspecao de pinturas (tratamento de superficies)
720135|Supervisor de pintura (tratamento de superfícies)|supervisor de pintura (tratamento de superficies)
720140|Encarregado de oxicorte|encarregado de oxicorte
720140|Encarregado de soldagem|encarregado de soldagem
720140|Mestre de solda e corte|mestre de solda e corte
720145|Encarregado de montagem de tubos|encarregado de montagem de tubos
720145|Mestre acabador de produtos extrusados|mestre acabador de produtos extrusados
720145|Mestre de trefilação (metal)|mestre de trefilacao (metal)
720145|Mestre mecânico de extrusão de alumínio|mestre mecanico de extrusao de aluminio
720150|Encarregado de usinagem de metais|encarregado de usinagem de metais
720150|Mestre de ajustagem e usinagem|mestre de ajustagem e usinagem
720150|Mestre de seção de usinagem|mestre de secao de usinagem
720150|Mestre de usinagem e montagem|mestre de usinagem e montagem
720155|Mestre serralheiro de alumínio|mestre serralheiro de aluminio
720155|Mestre serralheiro de estamparia|mestre serralheiro de estamparia
720205|Supervisor de construção naval|supervisor de construcao naval
720210|Líder (indústria de automotores e de material de transporte)|lider (industria de automotores e de material de transporte)
720210|Mestre de linha de montagem (indústria automobilística)|mestre de linha de montagem (industria automobilistica)
720210|Supervisor (indústria de automotores e de material de transporte)|supervisor (industria de automotores e de material de transporte)
720215|Chefe de produção (indústria de máquinas e outros equipamentos mecânicos)|chefe de producao (industria de maquinas e outros equipamentos mecanicos)
720215|Contramestre de indústria de máquinas|contramestre de industria de maquinas
720215|Contramestre (indústria de máquinas e outros equipamentos mecânicos)|contramestre (industria de maquinas e outros equipamentos mecanicos)
720215|Mestre de produção (indústria de máquinas e outros equipamentos mecânicos)|mestre de producao (industria de maquinas e outros equipamentos mecanicos)
720220|Líder (construção de fornos)|lider (construcao de fornos)
720220|Supervisor de construção de fornos|supervisor de construcao de fornos
721105|Ferramenteiro de bancada|ferramenteiro de bancada
721105|Ferramenteiro de coquilhas|ferramenteiro de coquilhas
721105|Ferramenteiro de injeção termofixo|ferramenteiro de injecao termofixo
721105|Ferramenteiro de injeção termoplástico|ferramenteiro de injecao termoplastico
721105|Ferramenteiro de injeção zamak e alumínio|ferramenteiro de injecao zamak e aluminio
721105|Ferramenteiro de manutenção|ferramenteiro de manutencao
721105|Ferramenteiro de matrizes e estampos|ferramenteiro de matrizes e estampos
721105|Ferramenteiro de molde para borracha|ferramenteiro de molde para borracha
721105|Ferramenteiro de moldes plásticos (sopro)|ferramenteiro de moldes plasticos (sopro)
721105|Líder de ferramentaria|lider de ferramentaria
721105|Matrizeiro|matrizeiro
721115|Modelador de ferramentaria|modelador de ferramentaria
721205|Operador de eletroerosão a fio|operador de eletroerosao a fio
721205|Operador de eletroerosão por penetração|operador de eletroerosao por penetracao
721210|Broqueador de cilindros|broqueador de cilindros
721210|Brunidor de cilindros|brunidor de cilindros
721210|Foscador de cilindros (laminação)|foscador de cilindros (laminacao)
721210|Torneiro repuxador|torneiro repuxador
721215|Auxiliar de torneiro mecânico|auxiliar de torneiro mecanico
721215|Fresador (fresadora universal)|fresador (fresadora universal)
721215|Mandrilador|mandrilador
721215|Operador de furadeiras|operador de furadeiras
721215|Plainador de metais (plaina limadora)|plainador de metais (plaina limadora)
721215|Torneiro ajustador|torneiro ajustador
721215|Torneiro ferramenteiro|torneiro ferramenteiro
721215|Torneiro mecânico|torneiro mecanico
721220|Retificador de fieiras|retificador de fieiras
721220|Retificador, em geral|retificador, em geral
721220|Retificador (retificadora cilíndrica externa e interna)|retificador (retificadora cilindrica externa e interna)
721220|Retificador (retificadora de árvore de manivelas)|retificador (retificadora de arvore de manivelas)
721220|Retificador (retificadora plana)|retificador (retificadora plana)
721225|Preparador de ferramentas para máquinas-ferramenta|preparador de ferramentas para maquinas-ferramenta
721225|Preparador de fresadora copiadora|preparador de fresadora copiadora
721225|Preparador de fresadora de engrenagens|preparador de fresadora de engrenagens
721225|Preparador de furadeira|preparador de furadeira
721225|Preparador de máquina de tarraxar|preparador de maquina de tarraxar
721225|Preparador de máquina de transferência|preparador de maquina de transferencia
721225|Preparador de prensa mecânica de metais|preparador de prensa mecanica de metais
721225|Preparador de retificadora sem centro|preparador de retificadora sem centro
721225|Preparador de torno automático|preparador de torno automatico
721225|Preparador de torno copiador|preparador de torno copiador
721225|Preparador de torno revólver|preparador de torno revolver
721305|Amolador de cardas|amolador de cardas
721305|Amolador de guarnição - na fabricação têxtil|amolador de guarnicao - na fabricacao textil
721310|Afiador ambulante|afiador ambulante
721310|Afiador de facas|afiador de facas
721310|Afiador de facas ( inclusive ambulante)|afiador de facas ( inclusive ambulante)
721310|Afiador de tesouras ( inclusive ambulante)|afiador de tesouras ( inclusive ambulante)
721310|Amolador ambulante|amolador ambulante
721310|Amolador de cutelaria|amolador de cutelaria
721310|Amolador de facas|amolador de facas
721310|Amolador de tesouras ( inclusive ambulante)|amolador de tesouras ( inclusive ambulante)
721310|Cuteleiro (na fabricação)|cuteleiro (na fabricacao)
721315|Afiador - na fabricação|afiador - na fabricacao
721315|Afiador, a máquina|afiador, a maquina
721315|Afiador de brocas e coroas|afiador de brocas e coroas
721315|Afiador de talhadeira|afiador de talhadeira
721315|Afiador manual|afiador manual
721315|Ajudante de afiador|ajudante de afiador
721315|Amolador - na fabricação|amolador - na fabricacao
721315|Amolador de cilindros|amolador de cilindros
721315|Amolador de ferramentas|amolador de ferramentas
721315|Amolador de talhadeira|amolador de talhadeira
721315|Auxiliar de afiador de ferramentas|auxiliar de afiador de ferramentas
721315|Mecânico afiador|mecanico afiador
721320|Afiador de lâminas|afiador de laminas
721320|Afiador e laminador de serras|afiador e laminador de serras
721320|Ajudante de afiação de serras|ajudante de afiacao de serras
721320|Amolador de serras|amolador de serras
721325|Acepilhador de metais|acepilhador de metais
721325|Ajudante de polimento|ajudante de polimento
721325|Alisador de metal|alisador de metal
721325|Despolidor|despolidor
721325|Escovador de fundição|escovador de fundicao
721325|Lixador de móveis metálicos|lixador de moveis metalicos
721325|Lixador de peças de metal|lixador de pecas de metal
721325|Operador de eletropolimento|operador de eletropolimento
721325|Polidor de ferramentas|polidor de ferramentas
721325|Polidor de fieiras|polidor de fieiras
721325|Polidor de matrizes|polidor de matrizes
721325|Polidor de metais a mão|polidor de metais a mao
721325|Polidor de rodas dentadas a máquina|polidor de rodas dentadas a maquina
721410|Fresador cnc|fresador cnc
721415|Mandrilador cnc|mandrilador cnc
721425|Retificador  cnc|retificador  cnc
721430|Torneiro cnc|torneiro cnc
722105|Aguilhoeiro|aguilhoeiro
722105|Ajudante de ferreiro|ajudante de ferreiro
722105|Ajudante de forjador|ajudante de forjador
722105|Contramestre ferreiro|contramestre ferreiro
722105|Craveiro (forjaria)|craveiro (forjaria)
722105|Ferreiro|ferreiro
722105|Ferreiro de molas|ferreiro de molas
722105|Forjador a mão (molas helicoidais)|forjador a mao (molas helicoidais)
722105|Forjador de molas|forjador de molas
722105|Forjador de talhadeira|forjador de talhadeira
722105|Forjador manual|forjador manual
722105|Operador de forja|operador de forja
722105|Preparador de máquinas de forjar|preparador de maquinas de forjar
722110|Forjador a martelete|forjador a martelete
722110|Forjador a martelo de queda livre|forjador a martelo de queda livre
722110|Forjador a martelo-pilão|forjador a martelo-pilao
722110|Marteleiro a carga de fogo|marteleiro a carga de fogo
722110|Marteleiro de cutelaria|marteleiro de cutelaria
722110|Marteleiro (forjaria)|marteleiro (forjaria)
722110|Marteleiro (metalúrgica)|marteleiro (metalurgica)
722115|Operador de prensa (ferramentaria)|operador de prensa (ferramentaria)
722205|Ajudante de fundidor|ajudante de fundidor
722205|Fundidor coquilheiro|fundidor coquilheiro
722205|Fundidor de coquilha|fundidor de coquilha
722205|Fundidor de ligas metálicas|fundidor de ligas metalicas
722205|Fundidor moldador de metais|fundidor moldador de metais
722210|Ajudante de lingotamento|ajudante de lingotamento
722210|Lingotador|lingotador
722210|Operador de carro de lingotes|operador de carro de lingotes
722210|Operador de lingoteira contínua|operador de lingoteira continua
722210|Operador de lingoteiras|operador de lingoteiras
722210|Operador de máquina de moldar lingoteira|operador de maquina de moldar lingoteira
722210|Operador de mesa de recebimento de lingotes|operador de mesa de recebimento de lingotes
722210|Operador de roda de lingotamento|operador de roda de lingotamento
722215|Ajudante de acabamento de fundição|ajudante de acabamento de fundicao
722215|Operador de acabamento (fundição)|operador de acabamento (fundicao)
722220|Fundidor a pressão|fundidor a pressao
722220|Fundidor de máquina de pressão|fundidor de maquina de pressao
722220|Operador de fundição|operador de fundicao
722220|Operador de máquina coquilhadeira|operador de maquina coquilhadeira
722220|Operador de máquina de fundição por centrífuga|operador de maquina de fundicao por centrifuga
722220|Operador de máquina de fundir sob pressão|operador de maquina de fundir sob pressao
722220|Operador de máquina injetora de metais|operador de maquina injetora de metais
722230|Operador de panela vazadora|operador de panela vazadora
722230|Vazador de metais|vazador de metais
722230|Vazador (fundição)|vazador (fundicao)
722305|Acabador de macho - na fundição|acabador de macho - na fundicao
722305|Ajudante de macheiro|ajudante de macheiro
722305|Moldador de machos (manual)|moldador de machos (manual)
722305|Moldador macheiro (manual)|moldador macheiro (manual)
722310|Operador de máquina de fabricar machos (ar comprimido)|operador de maquina de fabricar machos (ar comprimido)
722310|Operador de máquina de machos|operador de maquina de machos
722310|Tirador de machos - na fundição|tirador de machos - na fundicao
722315|Acabador de moldes (fundição)|acabador de moldes (fundicao)
722315|Desmoldador|desmoldador
722315|Formista manual|formista manual
722315|Moldador em areia|moldador em areia
722320|Fechador de moldes - na fundição|fechador de moldes - na fundicao
722320|Fixador de moldes - na fundição|fixador de moldes - na fundicao
722320|Moldador de bloco - na fundição|moldador de bloco - na fundicao
722320|Moldador de fundição (metais)|moldador de fundicao (metais)
722320|Moldador de metal|moldador de metal
722320|Preparador de moldes de fundição, à máquina|preparador de moldes de fundicao, a maquina
722325|Auxiliar de preparação de areia|auxiliar de preparacao de areia
722325|Desenformador - na fundição|desenformador - na fundicao
722325|Formista - na fundição|formista - na fundicao
722325|Misturador de areias - em fundição|misturador de areias - em fundicao
722325|Operador de máquina de areia para fundição|operador de maquina de areia para fundicao
722325|Operador de misturador de areia para fundição|operador de misturador de areia para fundicao
722325|Operador de prensa de areia para fundição|operador de prensa de areia para fundicao
722325|Operador de secador de areia para fundição|operador de secador de areia para fundicao
722325|Operador de sistema de areia para fundição|operador de sistema de areia para fundicao
722325|Peneireiro - na fundição|peneireiro - na fundicao
722325|Preparador de areia - em fundição|preparador de areia - em fundicao
722325|Secador de areia|secador de areia
722405|Operador de máquina de cablear|operador de maquina de cablear
722410|Estirador de tubo de metal|estirador de tubo de metal
722410|Operador de esticadeira (metal sem costura)|operador de esticadeira (metal sem costura)
722415|Alambrador - na fabricação de arame|alambrador - na fabricacao de arame
722415|Aramador - na fabricação de arame|aramador - na fabricacao de arame
722415|Operador de trefila|operador de trefila
722415|Separador de trefilados|separador de trefilados
722415|Trefilador à máquina|trefilador a maquina
722415|Trefilador de barras de metal, à máquina|trefilador de barras de metal, a maquina
723110|Recozedor e normalizador de metais|recozedor e normalizador de metais
723120|Forneiro de tratamento térmico de metais|forneiro de tratamento termico de metais
723125|Ajudante de tratamento térmico|ajudante de tratamento termico
723125|Operador de tratamento térmico|operador de tratamento termico
723125|Operador de tratamento termoelétrico|operador de tratamento termoeletrico
723125|Operador multifuncional de tratamento térmico|operador multifuncional de tratamento termico
723205|Operador de linha de decapagem|operador de linha de decapagem
723205|Preparador de peça para decapagem|preparador de peca para decapagem
723205|Preparador de peça para imersão|preparador de peca para imersao
723210|Operador de superfosfato|operador de superfosfato
723215|Auxiliar de galvanização|auxiliar de galvanizacao
723215|Bronzeador de metais|bronzeador de metais
723215|Dourador (metais)|dourador (metais)
723215|Esmaltador|esmaltador
723215|Esmaltador de banho fundente|esmaltador de banho fundente
723215|Esmaltador de metais não-preciosos|esmaltador de metais nao-preciosos
723215|Estanhador|estanhador
723215|Galvanizador (sherardização)|galvanizador (sherardizacao)
723215|Operador de banhos (níquel, zinco, cromoprata, ouro)|operador de banhos (niquel, zinco, cromoprata, ouro)
723215|Operador de cobreamento|operador de cobreamento
723215|Operador de galvanização|operador de galvanizacao
723215|Platinador|platinador
723215|Prateador|prateador
723220|Pintor a revólver (pintura eletrostática)|pintor a revolver (pintura eletrostatica)
723220|Pulverizador de metal, à pistola|pulverizador de metal, a pistola
723225|Cromador de metais|cromador de metais
723225|Niquelador|niquelador
723235|Anodizador e anodizador de metais|anodizador e anodizador de metais
723235|Operador de processo de zincagem|operador de processo de zincagem
723235|Operador de zincagem|operador de zincagem
723235|Prateador (processo eletrolítico)|prateador (processo eletrolitico)
723235|Zincador|zincador
723305|Cabineiro|cabineiro
723310|Pintor (retoques)|pintor (retoques)
723315|Pintor de metais a  pistola|pintor de metais a  pistola
723315|Pintor industrial|pintor industrial
723320|Auxiliar de pintor de automóveis|auxiliar de pintor de automoveis
723320|Operador de estufa de pintura|operador de estufa de pintura
723320|Pintor de automóveis|pintor de automoveis
723320|Pintor de aviões|pintor de avioes
723320|Pintor de carros|pintor de carros
723320|Pintor de motos|pintor de motos
723320|Pintor de vagões tanques|pintor de vagoes tanques
723320|Pintor especializado em pintura acrílica (veículos)|pintor especializado em pintura acrilica (veiculos)
723325|Pintor especializado em pintura acrílica|pintor especializado em pintura acrilica
723330|Ajudante de pintor à pistola|ajudante de pintor a pistola
723330|Ajudante de pintor de móveis|ajudante de pintor de moveis
723330|Ajudante de pintor de produção|ajudante de pintor de producao
723330|Operador de máquina de pintar contínua|operador de maquina de pintar continua
723330|Operador de pistola de pintura|operador de pistola de pintura
723330|Operador de pistola rotativa|operador de pistola rotativa
723330|Pintor a revólver|pintor a revolver
723330|Pintor de brinquedos|pintor de brinquedos
723330|Pintor de geladeira|pintor de geladeira
723330|Pintor de máquinas industriais|pintor de maquinas industriais
723330|Pintor de móveis - a pistola|pintor de moveis - a pistola
723330|Pintor por pulverização (exceto veículos)|pintor por pulverizacao (exceto veiculos)
724105|Armador de manilhas|armador de manilhas
724105|Assentador de manilhas|assentador de manilhas
724110|Auxiliar de encanador|auxiliar de encanador
724110|Bombeiro hidráulico|bombeiro hidraulico
724110|Instalador hidráulico|instalador hidraulico
724115|Bombeiro eletricista|bombeiro eletricista
724115|Encanador de manutenção|encanador de manutencao
724115|Encanador industrial|encanador industrial
724115|Instalador de águas, esgotos e gás|instalador de aguas, esgotos e gas
724115|Instalador de canos|instalador de canos
724115|Serpentineiro|serpentineiro
724130|Ajudante de gasista|ajudante de gasista
724130|Duteiro|duteiro
724130|Gasista|gasista
724135|Instalador de tubulações de vapor|instalador de tubulacoes de vapor
724205|Colocador de estruturas metálicas|colocador de estruturas metalicas
724205|Montador de estruturas de aço|montador de estruturas de aco
724210|Edificador de casco (navios)|edificador de casco (navios)
724210|Montador de estruturas navais|montador de estruturas navais
724210|Montador naval|montador naval
724210|Montador naval (estruturas)|montador naval (estruturas)
724220|Ajudante de estruturas metálicas|ajudante de estruturas metalicas
724220|Preparador de estruturas de aço|preparador de estruturas de aco
724225|Riscador de estruturas de aço|riscador de estruturas de aco
724225|Traçador de estruturas metálicas|tracador de estruturas metalicas
724230|Cravador de metais|cravador de metais
724230|Rebatedor de metais|rebatedor de metais
724305|Soldador de solda a forte|soldador de solda a forte
724305|Soldador manual|soldador manual
724310|Cortador de ferro|cortador de ferro
724310|Cortador de metais|cortador de metais
724310|Cortador de sucata a oxigênio|cortador de sucata a oxigenio
724310|Cortador oxiacetilênico|cortador oxiacetilenico
724310|Operador de maçarico de corte|operador de macarico de corte
724310|Operador de oxicorte|operador de oxicorte
724310|Oxicortador|oxicortador
724315|Montador soldador|montador soldador
724315|Operador de banho de solda|operador de banho de solda
724315|Operador de máquina de solda a ultrassom|operador de maquina de solda a ultrassom
724315|Operador de máquina de solda eletrônica|operador de maquina de solda eletronica
724315|Operador de máquina de soldar|operador de maquina de soldar
724315|Operador de máquina de soldar automática|operador de maquina de soldar automatica
724315|Soldador autógeno|soldador autogeno
724315|Soldador de oficina mecânica|soldador de oficina mecanica
724315|Soldador de solda branca|soldador de solda branca
724315|Soldador de solda elétrica e oxiacetileno|soldador de solda eletrica e oxiacetileno
724315|Soldador mecânico|soldador mecanico
724320|Operador de maçarico|operador de macarico
724320|Soldador a  oxiacetileno|soldador a  oxiacetileno
724320|Soldador a  oxigênio|soldador a  oxigenio
724325|Operador de máquina de solda elétrica|operador de maquina de solda eletrica
724325|Soldador a arco elétrico|soldador a arco eletrico
724325|Soldador com maçarico e arco elétrico|soldador com macarico e arco eletrico
724410|Caldeireiro de manutenção|caldeireiro de manutencao
724410|Caldeireiro instalador|caldeireiro instalador
724410|Caldeireiro montador|caldeireiro montador
724410|Caldeireiro serralheiro|caldeireiro serralheiro
724410|Chapeador montador|chapeador montador
724410|Chapeiro (chapas de ferrro e aço)|chapeiro (chapas de ferrro e aco)
724410|Mecânico de caldeiraria pesada|mecanico de caldeiraria pesada
724410|Montador de caldeira|montador de caldeira
724410|Traçador de caldeiraria|tracador de caldeiraria
724415|Chapeador de móveis metálicos|chapeador de moveis metalicos
724415|Chapeador metalúrgico|chapeador metalurgico
724415|Chapeiro|chapeiro
724415|Marcador de chapas|marcador de chapas
724420|Chapeador de automóveis|chapeador de automoveis
724420|Chapeador de veículos|chapeador de veiculos
724420|Chapista de automóveis|chapista de automoveis
724420|Chapista de carrocerias metálicas|chapista de carrocerias metalicas
724420|Chapista de veículos (fabricação)|chapista de veiculos (fabricacao)
724425|Caldeireiro em arsenal|caldeireiro em arsenal
724425|Caldeireiro em estaleiro|caldeireiro em estaleiro
724430|Chapeador de aviões|chapeador de avioes
724430|Chapista de aeronaves|chapista de aeronaves
724430|Chapista de aviões|chapista de avioes
724435|Flandeiro|flandeiro
724435|Funileiro de bancada|funileiro de bancada
724435|Funileiro de manutenção|funileiro de manutencao
724435|Funileiro montador|funileiro montador
724435|Funileiro soldador|funileiro soldador
724435|Picheleiro|picheleiro
724440|Ajudante de serralheiro|ajudante de serralheiro
724440|Arqueador|arqueador
724440|Arqueador de molas|arqueador de molas
724440|Arqueador e temperador de molas|arqueador e temperador de molas
724440|Operador de mesa de corte (serralharia)|operador de mesa de corte (serralharia)
724440|Serralheiro de alumínio|serralheiro de aluminio
724440|Serralheiro de ferro|serralheiro de ferro
724440|Serralheiro de manutenção|serralheiro de manutencao
724440|Serralheiro de metal|serralheiro de metal
724440|Serralheiro de produção|serralheiro de producao
724440|Serralheiro de protótipo|serralheiro de prototipo
724440|Serralheiro industrial|serralheiro industrial
724440|Serralheiro modelista|serralheiro modelista
724440|Serralheiro montador|serralheiro montador
724440|Serralheiro preparador|serralheiro preparador
724505|Operador de calandra (siderurgia)|operador de calandra (siderurgia)
724505|Operador de máquina de curvar metais|operador de maquina de curvar metais
724510|Auxiliar de dobrador (metais)|auxiliar de dobrador (metais)
724510|Operador de máquina de virar chapas|operador de maquina de virar chapas
724510|Operador de viradeira (aço)|operador de viradeira (aco)
724510|Operador de viradeira de chapas|operador de viradeira de chapas
724510|Operador de viradeira de tubos|operador de viradeira de tubos
724510|Operador de viradeiras de fitas de aço|operador de viradeiras de fitas de aco
724510|Virador de chapas|virador de chapas
724515|Operador de desempenadeira (conformação de metais)|operador de desempenadeira (conformacao de metais)
724605|Laceiro de cabos de aço|laceiro de cabos de aco
724605|Montador de laços de cabos|montador de lacos de cabos
724605|Operador de lingas|operador de lingas
724610|Cableador (cabos de aço)|cableador (cabos de aco)
724610|Espulador (cabos de aço)|espulador (cabos de aco)
724610|Operador de espulagem|operador de espulagem
724610|Operador de máquina (pernas, fechamento, repassamento, alma)|operador de maquina (pernas, fechamento, repassamento, alma)
724610|Operador de repassadeira|operador de repassadeira
725010|Afinador mecânico|afinador mecanico
725010|Ajustador de oficina de cilindros|ajustador de oficina de cilindros
725010|Ajustador de válvulas|ajustador de valvulas
725010|Ajustador mecânico de ferramentas|ajustador mecanico de ferramentas
725010|Ajustador mecânico de manutenção|ajustador mecanico de manutencao
725010|Aprendiz de mecânico ajustador|aprendiz de mecanico ajustador
725010|Balanceador de motores|balanceador de motores
725010|Centralizador de canos|centralizador de canos
725010|Centralizador de fusos|centralizador de fusos
725010|Centralizador de rodas|centralizador de rodas
725010|Mecânico ajustador|mecanico ajustador
725020|Ajustador de agulhas|ajustador de agulhas
725020|Ajustador limador de fresas|ajustador limador de fresas
725020|Ajustador limador de tornos|ajustador limador de tornos
725020|Mecânico de bancada|mecanico de bancada
725020|Rasqueteador de metais|rasqueteador de metais
725030|Auxiliar de manutenção e recarga de extintor de incêndio|auxiliar de manutencao e recarga de extintor de incendio
725030|Chefe de oficina de manutenção e recarga de extintor de incêndio|chefe de oficina de manutencao e recarga de extintor de incendio
725030|Encarregado de manutenção e recarga de extintor de incêndio|encarregado de manutencao e recarga de extintor de incendio
725030|Responsável operacional de manutenção e recarga de extintor de incêndio|responsavel operacional de manutencao e recarga de extintor de incendio
725105|Montador, a mão|montador, a mao
725105|Montador de acessórios|montador de acessorios
725105|Montador de equipamento de escritório|montador de equipamento de escritorio
725105|Montador de máquina de escrever|montador de maquina de escrever
725105|Montador de máquinas (montagem em série)|montador de maquinas (montagem em serie)
725105|Montador instalador de acessórios|montador instalador de acessorios
725205|Instalador de máquinas|instalador de maquinas
725205|Mecânico de montagem de máquinas|mecanico de montagem de maquinas
725205|Mecânico montador|mecanico montador
725205|Montador mecânico (máquinas industriais)|montador mecanico (maquinas industriais)
725220|Montador de máquinas de fiação|montador de maquinas de fiacao
725225|Instalador de máquinas-ferramentas (usinagem de metais)|instalador de maquinas-ferramentas (usinagem de metais)
725305|Montador de equipamentos de levantamento e movimentação|montador de equipamentos de levantamento e movimentacao
725305|Montador de pontes rolantes|montador de pontes rolantes
725310|Montador mecânico de máquinas agrícolas|montador mecanico de maquinas agricolas
725310|Montador multifuncional em máquinas agrícolas|montador multifuncional em maquinas agricolas
725315|Montador de máquinas de extração e beneficiamento de minérios|montador de maquinas de extracao e beneficiamento de minerios
725320|Montador mecânico de máquinas de terraplenagem|montador mecanico de maquinas de terraplenagem
725410|Mecânico de motores marítimos|mecanico de motores maritimos
725415|Mecânico montador especializado em motores de explosão e diesel|mecanico montador especializado em motores de explosao e diesel
725415|Montador de motores a diesel|montador de motores a diesel
725415|Montador de motores a explosão|montador de motores a explosao
725415|Montador de motores a gasolina|montador de motores a gasolina
725420|Mecânico de motores turboalimentadores|mecanico de motores turboalimentadores
725420|Mecânico montador de motores turboalimentadores|mecanico montador de motores turboalimentadores
725420|Mecânico montador de turbinas|mecanico montador de turbinas
725420|Mecânico turboalimentador|mecanico turboalimentador
725420|Montador de turbinas|montador de turbinas
725505|Montador de automóveis|montador de automoveis
725505|Montador de carroceria|montador de carroceria
725505|Montador de chassi|montador de chassi
725505|Montador de motores (grupo motopropulsor-gmp)|montador de motores (grupo motopropulsor-gmp)
725505|Montador de veículos automotores (linha de montagem)|montador de veiculos automotores (linha de montagem)
725510|Operador de equipe de montagem (veiculos automotores)|operador de equipe de montagem (veiculos automotores)
725605|Mecânico de manutenção aeronáutica|mecanico de manutencao aeronautica
725605|Mecânico montador de aeronaves|mecanico montador de aeronaves
725605|Técnico em manutenção aeronáutica|tecnico em manutencao aeronautica
725605|Técnico em montagem aeronáutica|tecnico em montagem aeronautica
725605|Técnico mecânico aeronáutico|tecnico mecanico aeronautico
725705|Montador de instalação de calefação, ventilação e refrigeração|montador de instalacao de calefacao, ventilacao e refrigeracao
725705|Técnico de refrigeração (instalação)|tecnico de refrigeracao (instalacao)
730105|Chefe de produção (indústria de material elétrico e eletrônico)|chefe de producao (industria de material eletrico e eletronico)
730105|Mestre da indústria de material elétrico e eletrônico|mestre da industria de material eletrico e eletronico
730105|Mestre de manutenção elétrica|mestre de manutencao eletrica
730105|Mestre de manutenção eletrônica|mestre de manutencao eletronica
730105|Mestre de montagem de motores elétricos|mestre de montagem de motores eletricos
730105|Mestre eletricista de bobinas estacionárias|mestre eletricista de bobinas estacionarias
730105|Mestre eletricista enrolador de bobinas|mestre eletricista enrolador de bobinas
730105|Supervisor de produção (indústria de material elétrico e eletrônico)|supervisor de producao (industria de material eletrico e eletronico)
731110|Montador de computadores e equipamentos auxiliares|montador de computadores e equipamentos auxiliares
731115|Montador de instrumentos eletroeletrônicos de medição|montador de instrumentos eletroeletronicos de medicao
731120|Montador de eletrodomésticos|montador de eletrodomesticos
731125|Eletricista instalador de alta e baixa tensão|eletricista instalador de alta e baixa tensao
731125|Instalador e mantenedor de placas fotovoltaicas|instalador e mantenedor de placas fotovoltaicas
731125|Montador de centrais elétricas|montador de centrais eletricas
731125|Montador de linha de transmissão e rede de distribuição|montador de linha de transmissao e rede de distribuicao
731130|Montador de dínamos|montador de dinamos
731135|Montador de aparelhos elétricos|montador de aparelhos eletricos
731140|Montador de comandos e sinalização|montador de comandos e sinalizacao
731150|Instalador de som|instalador de som
731150|Montador de aparelhos eletroeletrônicos|montador de aparelhos eletroeletronicos
731150|Montador de aparelhos eletrônicos|montador de aparelhos eletronicos
731150|Revisor de aparelhos eletrônicos|revisor de aparelhos eletronicos
731155|Montador de elevadores e similares|montador de elevadores e similares
731160|Auxiliar de montagem de transformadores|auxiliar de montagem de transformadores
731160|Montador de transformadores|montador de transformadores
731165|Auxiliar de bobinagem, à mão|auxiliar de bobinagem, a mao
731170|Bobinador - eletricista|bobinador - eletricista
731170|Eletricista bobinador|eletricista bobinador
731170|Montador de bobinas|montador de bobinas
731180|Operador de máquinas de linha de montagem (aparelhos eletrônicos)|operador de maquinas de linha de montagem (aparelhos eletronicos)
731180|Revisor de linha de montagem (aparelhos eletrônicos)|revisor de linha de montagem (aparelhos eletronicos)
731205|Consertador de equipamentos eletrônicos|consertador de equipamentos eletronicos
731205|Instalador de equipamentos de radar|instalador de equipamentos de radar
731205|Instalador de estação de rádio|instalador de estacao de radio
731205|Instalador de estação de tv|instalador de estacao de tv
731205|Montador de equipamentos de radar|montador de equipamentos de radar
731205|Montador de equipamentos de telecomunicações|montador de equipamentos de telecomunicacoes
731205|Montador de equipamentos eletrônicos (rádio e tv )|montador de equipamentos eletronicos (radio e tv )
731305|Especialista em linha de transmissão|especialista em linha de transmissao
731305|Instalador de centrais telefônicas|instalador de centrais telefonicas
731305|Instalador de equipamentos de comunicação|instalador de equipamentos de comunicacao
731305|Instalador de estações telefônicas|instalador de estacoes telefonicas
731305|Instalador reparador de central|instalador reparador de central
731305|Montador de centrais telefônicas|montador de centrais telefonicas
731320|Instalador de aparelhos telefônicos|instalador de aparelhos telefonicos
731320|Instalador de telefones|instalador de telefones
731320|Instalador mantenedor de telefonia|instalador mantenedor de telefonia
731320|Instaladores e reparadores de equipamentos e linhas telefônicas|instaladores e reparadores de equipamentos e linhas telefonicas
731320|Reparador de instalações telefônicas|reparador de instalacoes telefonicas
731320|Reparador de linhas e aparelhos|reparador de linhas e aparelhos
731320|Reparador de pabx|reparador de pabx
731320|Reparador de telefone|reparador de telefone
731320|Revisor de aparelhos telefônicos|revisor de aparelhos telefonicos
732105|Auxiliar técnico de eletricidade de linhas de transmissão|auxiliar tecnico de eletricidade de linhas de transmissao
732105|Conservador de linhas elétricas e telefônicas|conservador de linhas eletricas e telefonicas
732105|Eletricista de linha de transmissão|eletricista de linha de transmissao
732105|Eletricista de manutenção de linhas elétricas|eletricista de manutencao de linhas eletricas
732105|Eletricista de manutenção de linhas telefônicas|eletricista de manutencao de linhas telefonicas
732110|Ajudante de cabista|ajudante de cabista
732110|Cabista|cabista
732110|Emendador de fios (elétricos e telefônicos)|emendador de fios (eletricos e telefonicos)
732120|Eletricista de alta tensão|eletricista de alta tensao
732120|Eletricista de baixa tensão|eletricista de baixa tensao
732120|Eletricista de iluminação pública|eletricista de iluminacao publica
732120|Eletricista de linha de alta-tensão|eletricista de linha de alta-tensao
732120|Eletricista de linha de baixa tensão|eletricista de linha de baixa tensao
732120|Eletricista de rede|eletricista de rede
732120|Instalador de linhas subterrâneas (transmissão de energia elétrica)|instalador de linhas subterraneas (transmissao de energia eletrica)
732120|Instalador-reparador de rede elétrica|instalador-reparador de rede eletrica
732120|Reparador de linhas  elétricas|reparador de linhas  eletricas
732125|Eletricista de rede aérea de tração de veículos|eletricista de rede aerea de tracao de veiculos
732130|Ajudante de reparador (telecomunicações)|ajudante de reparador (telecomunicacoes)
732130|Instalador-reparador de linhas de comunicação de dados|instalador-reparador de linhas de comunicacao de dados
732130|Instalador-reparador de linhas telefônicas aéreas e subterrâneas|instalador-reparador de linhas telefonicas aereas e subterraneas
732130|Instalador-reparador de linhas telefônicas e telegráficas|instalador-reparador de linhas telefonicas e telegraficas
732140|Instalador fotovoltaico|instalador fotovoltaico
740105|Supervisor de fabricação de instrumentos de precisão|supervisor de fabricacao de instrumentos de precisao
741105|Instrumentista de precisão|instrumentista de precisao
741105|Mecânico de aparelhos de precisão|mecanico de aparelhos de precisao
741105|Mecânico de instrumentos de precisão|mecanico de instrumentos de precisao
742115|Encordoador de instrumentos musicais|encordoador de instrumentos musicais
742115|Luthier (confeccionador)|luthier (confeccionador)
742115|Montador de instrumentos de corda|montador de instrumentos de corda
742120|Confeccionador de tambores (música)|confeccionador de tambores (musica)
750105|Mestre em artigos de ourivesaria e joalheria|mestre em artigos de ourivesaria e joalheria
750105|Mestre (fabricação de artigos de ourivesaria e joalheria)|mestre (fabricacao de artigos de ourivesaria e joalheria)
750105|Mestre (lapidação de pedras preciosas)|mestre (lapidacao de pedras preciosas)
750205|Mestre da indústria de minerais não metálicos (exceto os derivados de petróleo e carvão)|mestre da industria de minerais nao metalicos (exceto os derivados de petroleo e carvao)
751005|Cravador de joias|cravador de joias
751005|Cravejador de joias|cravejador de joias
751005|Cravejador de metais preciosos|cravejador de metais preciosos
751005|Cravejador de ourivesaria|cravejador de ourivesaria
751010|Joalheiro na confecção de bijuterias e joias de fantasia|joalheiro na confeccao de bijuterias e joias de fantasia
751010|Joalheiro na fabricação|joalheiro na fabricacao
751010|Joalheiro ourives na fabricação e reparação|joalheiro ourives na fabricacao e reparacao
751015|Joalheiro na reparação|joalheiro na reparacao
751020|Lapidador de diamantes|lapidador de diamantes
751020|Lapidador de pedras preciosas|lapidador de pedras preciosas
751020|Lapidador de pedras semipreciosas|lapidador de pedras semipreciosas
751020|Lapidário|lapidario
751020|Lapidário de diamantes|lapidario de diamantes
751020|Lapidário de pedras preciosas|lapidario de pedras preciosas
751020|Lapidário de pedras semipreciosas|lapidario de pedras semipreciosas
751105|Laminador de metais preciosos, à máquina|laminador de metais preciosos, a maquina
751115|Gravador de joias|gravador de joias
751115|Gravador em ouriversaria|gravador em ouriversaria
751120|Laminador de metais preciosos|laminador de metais preciosos
751120|Laminador de ouro|laminador de ouro
751120|Laminador de prata|laminador de prata
751125|Aurifice|aurifice
751125|Cinzelador de metais preciosos|cinzelador de metais preciosos
751125|Filigraneiro|filigraneiro
751125|Filigranista|filigranista
751125|Ourives de bijuteria|ourives de bijuteria
751125|Ourives montador|ourives montador
751125|Prensista de ourivesaria|prensista de ourivesaria
751125|Soldador de joias|soldador de joias
751125|Trabalhador de confecções de bijuterias e joias de fantasia|trabalhador de confeccoes de bijuterias e joias de fantasia
751130|Trefilador de metais preciosos, à máquina|trefilador de metais preciosos, a maquina
752105|Gambista (artesão de vidros)|gambista (artesao de vidros)
752105|Mestre vidreiro|mestre vidreiro
752105|Miniaturista (artesão de vidros)|miniaturista (artesao de vidros)
752110|Moldador de lentes|moldador de lentes
752110|Operador de máquina de estirar vidro|operador de maquina de estirar vidro
752110|Operador de máquina de vidraria|operador de maquina de vidraria
752115|Ampoleiro|ampoleiro
752115|Calibrador de tubos de vidro|calibrador de tubos de vidro
752115|Calibrador na fabricação de ampolas|calibrador na fabricacao de ampolas
752115|Colhedor - em fabricação de vidro|colhedor - em fabricacao de vidro
752115|Fechador de ampolas (garrafas térmicas)|fechador de ampolas (garrafas termicas)
752115|Soprador de vidro (material de laboratório)|soprador de vidro (material de laboratorio)
752120|Curvador de tubos de vidro|curvador de tubos de vidro
752120|Hialotécnico|hialotecnico
752205|Impressor serigráfico em vidros|impressor serigrafico em vidros
752205|Impressor silkscreen em vidros|impressor silkscreen em vidros
752205|Serigrafista em vidros|serigrafista em vidros
752210|Cortador de vidro - no comércio - exclusive conta própria e empregador|cortador de vidro - no comercio - exclusive conta propria e empregador
752210|Cristaleiro (corte de vidros)|cristaleiro (corte de vidros)
752210|Operador de máquina de corte (vidros)|operador de maquina de corte (vidros)
752210|Traçador de vidros|tracador de vidros
752215|Foscador de vidro a ácido|foscador de vidro a acido
752225|Foscador de vidro a jato de areia|foscador de vidro a jato de areia
752225|Jateador de materiais abrasivos|jateador de materiais abrasivos
752225|Jateador de vidro|jateador de vidro
752230|Ajudante de lapidador (vidros)|ajudante de lapidador (vidros)
752230|Beneficiador de cristal|beneficiador de cristal
752230|Biselador de cristais|biselador de cristais
752230|Operador de polidora de vidros e cristais|operador de polidora de vidros e cristais
752230|Polidor de vidros|polidor de vidros
752230|Polidor de vidros e cristais|polidor de vidros e cristais
752235|Cortador de cristais de óptica|cortador de cristais de optica
752235|Lapidador de cristais de ótica|lapidador de cristais de otica
752235|Operador de polidora de cristais de ótica|operador de polidora de cristais de otica
752235|Polidor de cristais|polidor de cristais
752235|Polidor de cristais de óptica, a máquina|polidor de cristais de optica, a maquina
752235|Polidor de lentes|polidor de lentes
752305|Cerâmico|ceramico
752305|Ceramista multifuncional|ceramista multifuncional
752305|Especialista em cerâmica|especialista em ceramica
752310|Ceramista artesanal|ceramista artesanal
752310|Ceramista artístico|ceramista artistico
752310|Oleiro em torno de pedal|oleiro em torno de pedal
752315|Operador de torno semi-automático (cerâmica)|operador de torno semi-automatico (ceramica)
752315|Torneiro ceramista|torneiro ceramista
752320|Modelador ceramista|modelador ceramista
752320|Modelador de porcelana|modelador de porcelana
752320|Modelador em cerâmica|modelador em ceramica
752320|Modelista em cerâmica|modelista em ceramica
752325|Ceramista (confecção de moldes)|ceramista (confeccao de moldes)
752325|Ceramista fundidor de molde|ceramista fundidor de molde
752325|Formista (cerâmica)|formista (ceramica)
752325|Fundidor de barbotina|fundidor de barbotina
752325|Moldador de cerâmica|moldador de ceramica
752325|Moldador em barbotina|moldador em barbotina
752325|Moldador em cerâmica|moldador em ceramica
752325|Preparador de moldes (cerâmica)|preparador de moldes (ceramica)
752330|Ceramista batedor de prensa extrusora|ceramista batedor de prensa extrusora
752330|Ceramista operador de prensa hidráulica|ceramista operador de prensa hidraulica
752330|Ceramista prensador (prensa a  fricção)|ceramista prensador (prensa a  friccao)
752330|Ceramista prensador (prensa extrusora)|ceramista prensador (prensa extrusora)
752330|Ceramista prensador (prensa hidráulica)|ceramista prensador (prensa hidraulica)
752330|Ceramista prensista (prensa extrusora)|ceramista prensista (prensa extrusora)
752330|Ceramista prensista (prensa hidráulica)|ceramista prensista (prensa hidraulica)
752330|Prensador cerâmico|prensador ceramico
752405|Aplicador de decalque em cerâmica|aplicador de decalque em ceramica
752405|Aplicador de impressos em cerâmica|aplicador de impressos em ceramica
752405|Ceramista escultor (acabamento)|ceramista escultor (acabamento)
752405|Decalcador em cerâmica|decalcador em ceramica
752405|Decorador ceramista|decorador ceramista
752405|Preparador de tela serigráfica para cerâmica|preparador de tela serigrafica para ceramica
752410|Decorador de vidro a  decalque|decorador de vidro a  decalque
752410|Decorador de vidro a  pistola|decorador de vidro a  pistola
752410|Escultor de vidro|escultor de vidro
752410|Escultor de vidro (acabamento)|escultor de vidro (acabamento)
752410|Jateador de vidro não plano|jateador de vidro nao plano
752410|Lapidador de vidros (acabamento)|lapidador de vidros (acabamento)
752410|Preparador de tela serigráfica de vidro|preparador de tela serigrafica de vidro
752410|Riscador de copos|riscador de copos
752420|Esmaltador cerâmico|esmaltador ceramico
752420|Esmaltador de cerâmica por imersão|esmaltador de ceramica por imersao
752420|Operador de máquina cerâmica (pintor)|operador de maquina ceramica (pintor)
752420|Operador de máquina de esmaltação cerâmica|operador de maquina de esmaltacao ceramica
752420|Pintor de cerâmica a  pistola|pintor de ceramica a  pistola
752420|Pistoleiro (cerâmica)|pistoleiro (ceramica)
752420|Vidrador-esmaltador em cerâmica|vidrador-esmaltador em ceramica
752420|Vitrificador|vitrificador
752425|Espelhador|espelhador
752425|Espelhador - na fabricação de espelhos|espelhador - na fabricacao de espelhos
752425|Espelhador (esmaltador)|espelhador (esmaltador)
752425|Foscador de espelhos|foscador de espelhos
752425|Opacador|opacador
752425|Prateador de espelho|prateador de espelho
752430|Ceramista fileteiro|ceramista fileteiro
752430|Pintor de cerâmica manual|pintor de ceramica manual
760105|Encarregado de acabamento de estampa|encarregado de acabamento de estampa
760105|Encarregado de acabamento (indústria têxtil)|encarregado de acabamento (industria textil)
760105|Encarregado de mercerização|encarregado de mercerizacao
760110|Encarregado geral de fiação|encarregado geral de fiacao
760115|Encarregado geral de malharia|encarregado geral de malharia
760120|Contramestre de indústrias têxtil|contramestre de industrias textil
760120|Encarregado geral de tecelagem|encarregado geral de tecelagem
760125|Mestre de acabamento de fios|mestre de acabamento de fios
760125|Mestre de acabamento em confecção|mestre de acabamento em confeccao
760125|Mestre de alvejamento de tecidos|mestre de alvejamento de tecidos
760125|Mestre de bobinadeira têxtil|mestre de bobinadeira textil
760125|Mestre de cerzideira|mestre de cerzideira
760125|Mestre de espularia|mestre de espularia
760125|Mestre de estampagem|mestre de estampagem
760125|Mestre de fiação|mestre de fiacao
760125|Mestre de fiação de algodão|mestre de fiacao de algodao
760125|Mestre de fiação de juta|mestre de fiacao de juta
760125|Mestre de fiação de lã|mestre de fiacao de la
760125|Mestre de fiação de linho|mestre de fiacao de linho
760125|Mestre de fiação de tecelagem|mestre de fiacao de tecelagem
760125|Mestre de fiação e tecelagem de rami|mestre de fiacao e tecelagem de rami
760125|Mestre de indústria têxtil|mestre de industria textil
760125|Mestre de malharia|mestre de malharia
760125|Mestre de preparação de tear|mestre de preparacao de tear
760125|Mestre de preparação de tecelagem|mestre de preparacao de tecelagem
760125|Mestre de preparação e revisão de bordados|mestre de preparacao e revisao de bordados
760125|Mestre de retorcedeira|mestre de retorcedeira
760125|Mestre de tapeçaria|mestre de tapecaria
760125|Mestre de tecelagem|mestre de tecelagem
760125|Mestre de tecelagem de juta|mestre de tecelagem de juta
760125|Mestre de tecelagem de malhas|mestre de tecelagem de malhas
760125|Mestre de tecelagem de máquina circular|mestre de tecelagem de maquina circular
760125|Mestre de tecelagem de rendas|mestre de tecelagem de rendas
760125|Mestre de tecelagem de telas|mestre de tecelagem de telas
760125|Mestre de texturização de fios|mestre de texturizacao de fios
760125|Mestre de tingimento (indústria têxtil e de confecções)|mestre de tingimento (industria textil e de confeccoes)
760125|Mestre de torção de fios|mestre de torcao de fios
760125|Mestre de urdimento|mestre de urdimento
760125|Mestre gravador têxtil|mestre gravador textil
760205|Técnico em curtimento (supervisor de primeira linha)|tecnico em curtimento (supervisor de primeira linha)
760305|Coordenador de corte na confecção do vestuário|coordenador de corte na confeccao do vestuario
760305|Supervisor de corte na confecção do vestuário|supervisor de corte na confeccao do vestuario
760310|Coordenador de bordado|coordenador de bordado
760310|Coordenador de costura do vestuário|coordenador de costura do vestuario
760310|Supervisor de costura do vestuário|supervisor de costura do vestuario
760405|Contramestre da indústria de calçados|contramestre da industria de calcados
760405|Mestre (indústria de calçados e artefatos de couro)|mestre (industria de calcados e artefatos de couro)
760405|Mestre sapateiro|mestre sapateiro
760405|Supervisor de acabamento de confecção de calçados|supervisor de acabamento de confeccao de calcados
760405|Supervisor de alta frequência de confecção de calçados|supervisor de alta frequencia de confeccao de calcados
760405|Supervisor de corte de confecção de calçados|supervisor de corte de confeccao de calcados
760405|Supervisor de injeção de confecção de calçados|supervisor de injecao de confeccao de calcados
760405|Supervisor de matrizaria de confecção de calçados|supervisor de matrizaria de confeccao de calcados
760405|Supervisor de modelagem de confecção de calçados|supervisor de modelagem de confeccao de calcados
760405|Supervisor de montagem de confecção de calçados|supervisor de montagem de confeccao de calcados
760405|Supervisor de pesponto de confecção de calçados|supervisor de pesponto de confeccao de calcados
760405|Supervisor de pré-frezado de confecção de calçados|supervisor de pre-frezado de confeccao de calcados
760505|Supervisor de produção (artefatos de couro)|supervisor de producao (artefatos de couro)
760605|Chefe de divisão gráfica|chefe de divisao grafica
760605|Chefe de seção de artes gráficas|chefe de secao de artes graficas
760605|Coordenador de artes gráficas|coordenador de artes graficas
760605|Encarregado de gráfica|encarregado de grafica
760605|Mestre das artes gráficas (indústria editorial e gráfica)|mestre das artes graficas (industria editorial e grafica)
760605|Mestre de fotogravuras|mestre de fotogravuras
760605|Mestre de produção (indústria gráfica)|mestre de producao (industria grafica)
760605|Mestre de serviços gráficos|mestre de servicos graficos
760605|Mestre gráfico|mestre grafico
760605|Mestre gravador de clichê|mestre gravador de cliche
760605|Mestre impressor|mestre impressor
760605|Mestre impressor de offset|mestre impressor de offset
760605|Mestre litográfico|mestre litografico
760605|Mestre tipógrafo|mestre tipografo
761105|Classificador de algodão - no beneficiamento de fibras têxteis|classificador de algodao - no beneficiamento de fibras texteis
761105|Classificador de algodão em caroço|classificador de algodao em caroco
761105|Classificador de algodão em pluma|classificador de algodao em pluma
761105|Classificador de fibras na indústria têxtil|classificador de fibras na industria textil
761105|Classificador de lã na indústria têxtil|classificador de la na industria textil
761105|Classificador de sisal - no beneficiamento|classificador de sisal - no beneficiamento
761110|Lavador de fibras na indústria têxtil|lavador de fibras na industria textil
761110|Operador de máquina de lavanderia de lã|operador de maquina de lavanderia de la
761110|Secador de lã|secador de la
761205|Abridor de lã|abridor de la
761205|Operador batedor de fibras|operador batedor de fibras
761205|Operador de abridor de fibras|operador de abridor de fibras
761205|Operador misturador de fibras|operador misturador de fibras
761205|Triador de lã|triador de la
761220|Cardista|cardista
761225|Maquinista de conicaleira|maquinista de conicaleira
761230|Arriador de filatório|arriador de filatorio
761230|Fiandeiro|fiandeiro
761230|Maquinista de filatório|maquinista de filatorio
761240|Acertador de maçaroqueira|acertador de macaroqueira
761240|Distribuidor de maçarocas|distribuidor de macarocas
761240|Maçaroqueiro|macaroqueiro
761250|Operador passadista (fiação)|operador passadista (fiacao)
761250|Operador passadorista (fiação)|operador passadorista (fiacao)
761303|Tecedor de redes|tecedor de redes
761306|Labirinteira (rendas e bordados)|labirinteira (rendas e bordados)
761306|Tecelão de bordados|tecelao de bordados
761306|Tecelão de rendas|tecelao de rendas
761312|Operador de tear de jacquard|operador de tear de jacquard
761315|Operador de tear mecânico de maquineta|operador de tear mecanico de maquineta
761318|Operador de tear mecânico de xadrez|operador de tear mecanico de xadrez
761321|Operador de tear mecânico liso|operador de tear mecanico liso
761324|Operador de tear mecânico, exceto jacquad|operador de tear mecanico, exceto jacquad
761327|Enformador de malharia|enformador de malharia
761327|Operador de malhas, a  máquina|operador de malhas, a  maquina
761330|Operador de máquina circular de malharia|operador de maquina circular de malharia
761333|Operador de máquina retilínea de malharia|operador de maquina retilinea de malharia
761336|Enformador de meias|enformador de meias
761345|Confeccionador de tapetes e passadeiras, a  máquina|confeccionador de tapetes e passadeiras, a  maquina
761354|Barbanteiro|barbanteiro
761360|Tecelão de fitas|tecelao de fitas
761360|Tecelão de tear de fita|tecelao de tear de fita
761366|Perfurador de cartões jacquard|perfurador de cartoes jacquard
761405|Operador de máquinas de cozinhamento e alvejamento de fibras soltas, fios e tecidos|operador de maquinas de cozinhamento e alvejamento de fibras soltas, fios e tecidos
761415|Operador de máquinas de flanelar (peletizar, lixar) tecidos|operador de maquinas de flanelar (peletizar, lixar) tecidos
761420|Operador de chamuscadeira/desengomagem de tecidos|operador de chamuscadeira/desengomagem de tecidos
761425|Mercerizador de fios e tecidos|mercerizador de fios e tecidos
761425|Operador de máquinas de impermeabilizar tecidos|operador de maquinas de impermeabilizar tecidos
761425|Operador de máquinas de mercerizar fios e tecidos|operador de maquinas de mercerizar fios e tecidos
761430|Ajudante de operador de máquinas de lavar fibras, fios, tecidos e peças confeccionadas|ajudante de operador de maquinas de lavar fibras, fios, tecidos e pecas confeccionadas
761430|Auxiliar de operador de máquinas de lavar fibras, fios, tecidos e peças confeccionadas|auxiliar de operador de maquinas de lavar fibras, fios, tecidos e pecas confeccionadas
761430|Operador de máquinas de lavar fibras soltas, fios, tecidos e peças confeccionadas|operador de maquinas de lavar fibras soltas, fios, tecidos e pecas confeccionadas
761805|Revisor de silk screen|revisor de silk screen
761810|Inspetor de bobinas (produção têxtil)|inspetor de bobinas (producao textil)
761815|Classificador de tecidos|classificador de tecidos
761815|Dobrador-revisor - em fábrica de tecidos|dobrador-revisor - em fabrica de tecidos
761815|Espinçador (produção têxtil)|espincador (producao textil)
761815|Examinador de meias (produção têxtil)|examinador de meias (producao textil)
761815|Inspetor de pano|inspetor de pano
761815|Pinçador (produção têxtil)|pincador (producao textil)
761815|Revisor têxtil|revisor textil
761820|Inspetor de tecidos crus|inspetor de tecidos crus
762110|Trinchador|trinchador
762125|Embocador|embocador
762205|Auxiliar de curtimento|auxiliar de curtimento
762205|Curtidor de couro|curtidor de couro
762205|Depilador de couros e peles|depilador de couros e peles
762205|Enxugador de couros e peles|enxugador de couros e peles
762205|Operador de enxugador (couros)|operador de enxugador (couros)
762205|Operador de fulão|operador de fulao
762220|Rebaixador de base (couros)|rebaixador de base (couros)
762335|Amaciador de couros e peles|amaciador de couros e peles
763005|Alfaite modelista|alfaite modelista
763005|Buteiro|buteiro
763005|Paramenteiro - alfaite|paramenteiro - alfaite
763010|Modelista|modelista
763015|Reformadora de roupas|reformadora de roupas
763105|Preparador de lotes e pacotes|preparador de lotes e pacotes
763110|Cortador de roupas (couro e pele)|cortador de roupas (couro e pele)
763110|Operador de máquina de corte de roupas|operador de maquina de corte de roupas
763110|Talhador de roupas|talhador de roupas
763115|Operador de máquina de enfestar|operador de maquina de enfestar
763120|Programador de encaixe (cad)|programador de encaixe (cad)
763120|Programador de risco e corte|programador de risco e corte
763120|Riscador de tecidos|riscador de tecidos
763125|Auxiliar de confecção|auxiliar de confeccao
763125|Auxiliar de produção - na confecção de roupas|auxiliar de producao - na confeccao de roupas
763125|Auxiliar de serviços gerais - na confecção de roupas|auxiliar de servicos gerais - na confeccao de roupas
763210|Auxiliar de costura|auxiliar de costura
763210|Costureira em geral|costureira em geral
763210|Costureiro de amostra|costureiro de amostra
763210|Costureiro de roupas (confecção em série)|costureiro de roupas (confeccao em serie)
763215|Costureira de máquina overloque|costureira de maquina overloque
763215|Costureira de máquina reta|costureira de maquina reta
763215|Costureira de máquinas industriais|costureira de maquinas industriais
763310|Auxiliar de operador de máquina de bordar|auxiliar de operador de maquina de bordar
763310|Operador de máquina de bordar|operador de maquina de bordar
763315|Preparador de produção de peças para bordar|preparador de producao de pecas para bordar
763315|Revisor de produção de peças para bordar|revisor de producao de pecas para bordar
763320|Auxiliar de costureira (no acabamento)|auxiliar de costureira (no acabamento)
763325|Coladeira (confecção em série)|coladeira (confeccao em serie)
764105|Cortador de calçados|cortador de calcados
764105|Cortador de capas de saltos para calçados|cortador de capas de saltos para calcados
764105|Cortador de couro na fabricação de calçados|cortador de couro na fabricacao de calcados
764105|Operador de balancim na confecção de calçados|operador de balancim na confeccao de calcados
764105|Operador de balancim no corte de couro|operador de balancim no corte de couro
764105|Operador de prensa na indústria de calçados|operador de prensa na industria de calcados
764110|Cortador de palmilhas|cortador de palmilhas
764110|Cortador de solas, a  máquina|cortador de solas, a  maquina
764115|Chanfrador de calçados|chanfrador de calcados
764115|Colador de calçados|colador de calcados
764115|Debruador de calçados|debruador de calcados
764115|Montador de calçados (parte superior)|montador de calcados (parte superior)
764115|Virador de calçados|virador de calcados
764120|Asperador de solas e palmilhas|asperador de solas e palmilhas
764120|Colador de palmilhas|colador de palmilhas
764120|Lixador de calçados|lixador de calcados
764120|Lixador de saltos de calçados|lixador de saltos de calcados
764120|Lixador de solas na confecção de calçados|lixador de solas na confeccao de calcados
764120|Marcador de sola na confecção de calçados|marcador de sola na confeccao de calcados
764120|Montador de saltos de calçados|montador de saltos de calcados
764120|Preparador de palmilhas|preparador de palmilhas
764120|Preparador de saltos para calçados|preparador de saltos para calcados
764120|Recortador de palmilhas|recortador de palmilhas
764120|Riscador de palmilhas|riscador de palmilhas
764205|Costureiro de calçados a  máquina|costureiro de calcados a  maquina
764210|Apontador de bicos (calçados)|apontador de bicos (calcados)
764210|Armador de calçados|armador de calcados
764210|Calceirista|calceirista
764210|Operador de máquina de apontar bico|operador de maquina de apontar bico
764305|Asperador de couro no acabamento de calçados|asperador de couro no acabamento de calcados
764305|Escovador de solas no acabamento de calçados|escovador de solas no acabamento de calcados
764305|Expedidor de calçados|expedidor de calcados
764305|Forrador de saltos no acabamento  de calçados|forrador de saltos no acabamento  de calcados
764305|Lustrador no acabamento de calçados|lustrador no acabamento de calcados
764305|Planchador de calçados|planchador de calcados
764305|Polidor de calçados (na fabricação)|polidor de calcados (na fabricacao)
764305|Retocador de calçados|retocador de calcados
764305|Revisor de qualidade de calçados|revisor de qualidade de calcados
764305|Selecionador de calçados|selecionador de calcados
765010|Chapeleiro - exclusive de palha|chapeleiro - exclusive de palha
765010|Chapeleiro de chapéus de luxo|chapeleiro de chapeus de luxo
765010|Conformador de chapéus|conformador de chapeus
765010|Cortador de chapéus|cortador de chapeus
765010|Decatizador|decatizador
765010|Fulista|fulista
765010|Modelador de chapéus|modelador de chapeus
765010|Padronista de chapéus|padronista de chapeus
765105|Cortador, a  balancim|cortador, a  balancim
765105|Cortador, a  mão|cortador, a  mao
765110|Cortador de tapetes|cortador de tapetes
765205|Costureiro de colchões|costureiro de colchoes
765205|Operador de máquina de encher colchões|operador de maquina de encher colchoes
765215|Costureiro de artefatos de tecido (brinquedos)|costureiro de artefatos de tecido (brinquedos)
765215|Montador de brinquedos de pano|montador de brinquedos de pano
765225|Costurador de lonas e encerados|costurador de lonas e encerados
765225|Costureiro velamista|costureiro velamista
765225|Padronizador de velas de embarcações, toldos e barracas|padronizador de velas de embarcacoes, toldos e barracas
765230|Tapeceiro de aviões|tapeceiro de avioes
765235|Forrador de móveis|forrador de moveis
765235|Reformador de móveis|reformador de moveis
765235|Tapeceiro de móveis|tapeceiro de moveis
765240|Capoteiro|capoteiro
765240|Estofador de veículos|estofador de veiculos
765240|Tapeceiro de veículos|tapeceiro de veiculos
766115|Gravador de clichês, a  mão (matrizes de borracha ou linóleo)|gravador de cliches, a  mao (matrizes de borracha ou linoleo)
766115|Gravador de clichês (madeira, borracha ou linóleo)|gravador de cliches (madeira, borracha ou linoleo)
766115|Reprodutor de clichê impressão (reprodução plástica)|reprodutor de cliche impressao (reproducao plastica)
766120|Arte-finalista|arte-finalista
766120|Diagramador ( jornalismo)|diagramador ( jornalismo)
766120|Diagramador e desenhista|diagramador e desenhista
766120|Diagramador em terminal de vídeo|diagramador em terminal de video
766120|Especialista em arte final|especialista em arte final
766120|Montador de arte final|montador de arte final
766125|Ajudante de montagem e fotolito|ajudante de montagem e fotolito
766125|Auxiliar de montador de fotolito|auxiliar de montador de fotolito
766125|Copiador de chapas de off-set|copiador de chapas de off-set
766125|Copiador de fotolito|copiador de fotolito
766125|Gravador de fotolito|gravador de fotolito
766125|Montador de fotocomposição|montador de fotocomposicao
766125|Montador de fotolito em cores|montador de fotolito em cores
766125|Operador de aparelhos de preparação|operador de aparelhos de preparacao
766125|Preparador de fotolitos|preparador de fotolitos
766145|Chapista gráfico|chapista grafico
766145|Chapista tipográfico|chapista tipografico
766145|Compositor, a  máquina|compositor, a  maquina
766145|Confeccionador de clichês de flexografia|confeccionador de cliches de flexografia
766145|Confeccionador de matrizes tipográficas|confeccionador de matrizes tipograficas
766145|Copiador de clicheria|copiador de clicheria
766145|Copiador de clichês tipográficos|copiador de cliches tipograficos
766145|Copiador de desenhos sobre pedras litográficas|copiador de desenhos sobre pedras litograficas
766145|Copiador gravador|copiador gravador
766145|Digitador de fotocomposição|digitador de fotocomposicao
766145|Fotocompositor|fotocompositor
766145|Fotolitógrafo|fotolitografo
766145|Fototipista|fototipista
766145|Galvanista (rotogravura)|galvanista (rotogravura)
766145|Gravador a ácido|gravador a acido
766145|Gravador com pantógrafo|gravador com pantografo
766145|Gravador de chapa|gravador de chapa
766145|Gravador de chapas, cliches e cilindros de impressão|gravador de chapas, cliches e cilindros de impressao
766145|Gravador de chapas e cilindros com ácido|gravador de chapas e cilindros com acido
766145|Gravador de cilindros, a  máquina|gravador de cilindros, a  maquina
766145|Gravador de fotogravura ou de rotogravura|gravador de fotogravura ou de rotogravura
766145|Gravador de matrizes de impressão|gravador de matrizes de impressao
766145|Gravador de rotogravura|gravador de rotogravura
766145|Matrizeiro - na indústrias gráfica|matrizeiro - na industrias grafica
766145|Montador de clichês|montador de cliches
766145|Montador de clichês sobre suportes|montador de cliches sobre suportes
766145|Montador de seleção de cores|montador de selecao de cores
766145|Operador de fotocomposição|operador de fotocomposicao
766145|Pantografista|pantografista
766145|Programador de fotocomposição|programador de fotocomposicao
766145|Provista de clicheria (em cores)|provista de clicheria (em cores)
766145|Provista (provas analógicas e digitais)|provista (provas analogicas e digitais)
766145|Provista tipógrafo|provista tipografo
766145|Reprodutor de desenhos sobre pedras litográficas|reprodutor de desenhos sobre pedras litograficas
766145|Retocador de chapas de impressão (fotogravura)|retocador de chapas de impressao (fotogravura)
766145|Revisor - na indústria  gráfica|revisor - na industria  grafica
766145|Revisor gráfico|revisor grafico
766145|Rotogravador|rotogravador
766150|Fotógrafo (pré-impressão gráfica)|fotografo (pre-impressao grafica)
766150|Operador de escâner (pré-impressão gráfica)|operador de escaner (pre-impressao grafica)
766150|Retocador convencional|retocador convencional
766205|Aplicador de serigrafia|aplicador de serigrafia
766205|Aplicador de silkscreen|aplicador de silkscreen
766205|Aplicador de silkscreen, à máquina|aplicador de silkscreen, a maquina
766205|Auxiliar de serigrafia|auxiliar de serigrafia
766205|Impressor de silkscreen|impressor de silkscreen
766205|Impressor serigráfico|impressor serigrafico
766205|Operador de serigrafia|operador de serigrafia
766205|Operador de silkscreen|operador de silkscreen
766205|Serigrafista (gráfico)|serigrafista (grafico)
766210|Impressor de segurança|impressor de seguranca
766210|Impressor de talho doce|impressor de talho doce
766210|Operador de impressão de valores|operador de impressao de valores
766215|Impressor de cartazes|impressor de cartazes
766215|Impressor de máquina ofsete|impressor de maquina ofsete
766215|Impressor multilight|impressor multilight
766215|Maquinista de ofsete|maquinista de ofsete
766215|Operador de impressora ofsete|operador de impressora ofsete
766215|Operador de máquina ofsete|operador de maquina ofsete
766220|Ajudante de impressor de formulários contínuos|ajudante de impressor de formularios continuos
766220|Alimentador de rotativas|alimentador de rotativas
766220|Impressor de formulários contínuos|impressor de formularios continuos
766225|Impressor de plásticos|impressor de plasticos
766225|Impressor de rótulos|impressor de rotulos
766225|Operador de impressora de rotogravura|operador de impressora de rotogravura
766245|Impressor de tipografia|impressor de tipografia
766250|Cilindrista de imprensa|cilindrista de imprensa
766250|Impressor automático|impressor automatico
766250|Impressor de etiqueta|impressor de etiqueta
766250|Impressor de máquina plana|impressor de maquina plana
766250|Impressor de selo|impressor de selo
766250|Impressor gráfico manual|impressor grafico manual
766250|Operador de impressora platina|operador de impressora platina
766310|Dobrador gráfico|dobrador grafico
766310|Extrusor (artes gráficas)|extrusor (artes graficas)
766310|Laminador gráfico|laminador grafico
766310|Operador de dobradeira na indústria gráfica|operador de dobradeira na industria grafica
766310|Operador de extrusora (arte gráfica)|operador de extrusora (arte grafica)
766310|Operador gráfico de corte e vinco na impressão|operador grafico de corte e vinco na impressao
766320|Cortador  de papel à guilhotina|cortador  de papel a guilhotina
766320|Cortador de bobina de papel|cortador de bobina de papel
766320|Cortador de papel|cortador de papel
766320|Cortador de papel em máquina eletrônica|cortador de papel em maquina eletronica
766320|Guilhotineiro - na indústria gráfica|guilhotineiro - na industria grafica
766320|Operador de corta-riscadeira  de papel|operador de corta-riscadeira  de papel
766320|Refilador gráfico|refilador grafico
766325|Enramador gráfico de corte e vinco|enramador grafico de corte e vinco
766325|Margeador gráfico de corte e vinco|margeador grafico de corte e vinco
766325|Montador gráfico de corte e vinco|montador grafico de corte e vinco
766405|Auxiliar de laboratório fotográfico|auxiliar de laboratorio fotografico
766405|Operador de mini-lab|operador de mini-lab
766405|Supervisor de laboratório fotográfico|supervisor de laboratorio fotografico
766410|Fotógrafo laboratorista filmes fotográficos, em preto e branco|fotografo laboratorista filmes fotograficos, em preto e branco
766410|Laboratorista de filmes fotográficos, em preto e branco|laboratorista de filmes fotograficos, em preto e branco
766415|Fotógrafo laboratorista filmes fotográficos, em cores|fotografo laboratorista filmes fotograficos, em cores
766415|Retoquista (revelação fotográfica)|retoquista (revelacao fotografica)
768105|Operador de tear manual|operador de tear manual
768105|Tecedor - exclusive de tapetes|tecedor - exclusive de tapetes
768105|Tecelão - exclusive de tapetes|tecelao - exclusive de tapetes
768110|Montador de tapetes|montador de tapetes
768110|Operador de urdideira de tapetes|operador de urdideira de tapetes
768110|Tapeceiro a mão (tapetes)|tapeceiro a mao (tapetes)
768110|Tecedor de tapetes|tecedor de tapetes
768110|Tecelão de alfombras, a  mão|tecelao de alfombras, a  mao
768110|Tecelão de tapeçaria em tear manual|tecelao de tapecaria em tear manual
768110|Trabalhador de tapetes de nós, a  mão|trabalhador de tapetes de nos, a  mao
768115|Tecelão de malhas, a mão|tecelao de malhas, a mao
768115|Tricotador, à mão|tricotador, a mao
768120|Mamucabeira|mamucabeira
768120|Montador de punho de rede|montador de punho de rede
768120|Tecedor de redes - inclusive de punho, mamucaba, varanda|tecedor de redes - inclusive de punho, mamucaba, varanda
768120|Tecelão de redes - inclusive de punho, mamucaba, varanda|tecelao de redes - inclusive de punho, mamucaba, varanda
768120|Varandeira|varandeira
768125|Acabador de chapéus de palha|acabador de chapeus de palha
768125|Chapeleiro de palha|chapeleiro de palha
768125|Confeccionador de chapéus de palha|confeccionador de chapeus de palha
768125|Decorador de chapéus de palha|decorador de chapeus de palha
768125|Moldador de chapéus de palha|moldador de chapeus de palha
768125|Trançador - na fabricação de chapéus de palha|trancador - na fabricacao de chapeus de palha
768130|Crocheteiro|crocheteiro
768205|Bordadeira|bordadeira
768205|Criveira|criveira
768205|Labirinteira bordadeira, a  mão.|labirinteira bordadeira, a  mao.
768205|Rebordadeira|rebordadeira
768210|Cerzideira de malha|cerzideira de malha
768210|Cerzideira de meias|cerzideira de meias
768210|Cerzideira de roupas|cerzideira de roupas
768210|Cerzideira de tecidos|cerzideira de tecidos
768210|Consertador de roupas|consertador de roupas
768210|Remendeira|remendeira
768305|Bolseiro (bolsas de couro)|bolseiro (bolsas de couro)
768305|Cinteiro (correeiro)|cinteiro (correeiro)
768305|Colador de couro, a  mão|colador de couro, a  mao
768305|Trabalhador na confecção de peças de couro|trabalhador na confeccao de pecas de couro
768315|Boleiro (fabricação de bolas de couro)|boleiro (fabricacao de bolas de couro)
768315|Trabalhador de fabricação de bolas de couro|trabalhador de fabricacao de bolas de couro
768320|Confeccionador de calçados de couro|confeccionador de calcados de couro
768320|Costurador de calçados, à mão|costurador de calcados, a mao
768320|Sapateiro (confecção de calçados)|sapateiro (confeccao de calcados)
768320|Sapateiro de confecção sob medida|sapateiro de confeccao sob medida
768320|Sapateiro montador|sapateiro montador
768320|Sapateiro (sapatos de balé)|sapateiro (sapatos de bale)
768325|Arreeiro de couro - na fabricação|arreeiro de couro - na fabricacao
768325|Arreeiro na fabricação|arreeiro na fabricacao
768325|Bainheiro - em selaria|bainheiro - em selaria
768325|Cabresteador|cabresteador
768325|Cangalheiro - na fabricação|cangalheiro - na fabricacao
768325|Colador de couro - exclusive calçados|colador de couro - exclusive calcados
768325|Confeccionador de cabrestos|confeccionador de cabrestos
768325|Correeiro (peças para animais)|correeiro (pecas para animais)
768325|Seleiro (equipamentos para equitação)|seleiro (equipamentos para equitacao)
768325|Seleiro na fabricação|seleiro na fabricacao
768325|Trabalhador de fabricação de arreios|trabalhador de fabricacao de arreios
768325|Trançador de couro|trancador de couro
768605|Copiador de texto na tipografia|copiador de texto na tipografia
768605|Tipógrafo chapista|tipografo chapista
768610|Compositor de texto|compositor de texto
768615|Fundidor de tipos|fundidor de tipos
768620|Chapista paginador|chapista paginador
768625|Serigrafista|serigrafista
768630|Confeccionador de carimbos|confeccionador de carimbos
768705|Dourador|dourador
768705|Gravador de lombadas de livros|gravador de lombadas de livros
768710|Restaurador de livros e documentos|restaurador de livros e documentos
770105|Encarregado de montagem de móveis|encarregado de montagem de moveis
770105|Encarregado de serraria|encarregado de serraria
770105|Encarregado de serviços de serras e tornos|encarregado de servicos de serras e tornos
770105|Mestre (indústria de madeira e mobiliário)|mestre (industria de madeira e mobiliario)
770105|Supervisor de serraria|supervisor de serraria
770110|Mestre carpinteiro|mestre carpinteiro
770110|Supervisor de carpintaria|supervisor de carpintaria
770110|Supervisor de carpinteiro de manutenção|supervisor de carpinteiro de manutencao
771105|Auxiliar de marceneiro|auxiliar de marceneiro
771105|Marceneiro de móveis|marceneiro de moveis
771105|Moveleiro - exclusive empregador|moveleiro - exclusive empregador
771105|Prototipista (marceneiro)|prototipista (marceneiro)
771110|Marceneiro modelista|marceneiro modelista
771110|Modelador de fundição (madeira)|modelador de fundicao (madeira)
771110|Modelista de madeira|modelista de madeira
771120|Marceneiro adueleiro|marceneiro adueleiro
771120|Marceneiro barriqueiro|marceneiro barriqueiro
771120|Marceneiro boteiro|marceneiro boteiro
771120|Marceneiro pipeiro|marceneiro pipeiro
771120|Montador de tonéis|montador de toneis
771120|Tineiro|tineiro
771120|Toneleiro|toneleiro
772105|Ajudante de classificador de folhas (madeira)|ajudante de classificador de folhas (madeira)
772105|Ajudante de classificador de madeira|ajudante de classificador de madeira
772105|Amarrador de madeira|amarrador de madeira
772105|Classificador de lâminas (madeira)|classificador de laminas (madeira)
772105|Classificador de madeira na indústria|classificador de madeira na industria
772110|Impregnador de madeira (produtos anti-inflamáveis)|impregnador de madeira (produtos anti-inflamaveis)
772115|Ajudante de estufador (madeira)|ajudante de estufador (madeira)
773105|Cortador de chapas de madeiras|cortador de chapas de madeiras
773105|Desdobrador de madeira|desdobrador de madeira
773105|Falquejador|falquejador
773105|Laminador de madeira|laminador de madeira
773110|Artífice de serra|artifice de serra
773110|Operador de máquina de serrar|operador de maquina de serrar
773110|Operador de serra elétrica|operador de serra eletrica
773110|Operador de serra esquadrejadeira|operador de serra esquadrejadeira
773110|Operador de serra manual|operador de serra manual
773110|Operador de serra mecânica|operador de serra mecanica
773110|Operador de serra vertical automática|operador de serra vertical automatica
773115|Destopador (madeira)|destopador (madeira)
773115|Esquadriador (madeira)|esquadriador (madeira)
773120|Operador de industrialização de madeiras|operador de industrializacao de madeiras
773120|Operador de máquina de desdobrar madeira|operador de maquina de desdobrar madeira
773120|Operador de máquina de serrar madeira|operador de maquina de serrar madeira
773120|Operador de máquina de serraria|operador de maquina de serraria
773120|Operador de serra automática|operador de serra automatica
773120|Operador de serra de disco|operador de serra de disco
773120|Operador de serra-cinta|operador de serra-cinta
773120|Serrador - em serrarias|serrador - em serrarias
773120|Serrador de toras|serrador de toras
773125|Auxiliar de operador de serra circular múltipla|auxiliar de operador de serra circular multipla
773125|Circuleiro|circuleiro
773125|Cortador a serra circular|cortador a serra circular
773125|Operador de circular automática (madeira)|operador de circular automatica (madeira)
773125|Operador de serra circular|operador de serra circular
773125|Operador de serra circular automática|operador de serra circular automatica
773125|Operador de serra circular múltipla|operador de serra circular multipla
773130|Alimentador de serra de fita|alimentador de serra de fita
773130|Operador de serra de fita|operador de serra de fita
773205|Operador de passadeira  na fabricação de compensados|operador de passadeira  na fabricacao de compensados
773210|Prensista de aglomerado de madeira|prensista de aglomerado de madeira
773215|Operador de prensa de compensados|operador de prensa de compensados
773215|Prensista de lâmina de madeira|prensista de lamina de madeira
773220|Preparador de cola para madeira|preparador de cola para madeira
773220|Preparador de goma para colagem de madeira|preparador de goma para colagem de madeira
773340|Ajudante de operador de serra|ajudante de operador de serra
773340|Ajudante de serrador|ajudante de serrador
773340|Oficial de serra|oficial de serra
773340|Serrador (usinagem da madeira)|serrador (usinagem da madeira)
773415|Operador de fingirjoint|operador de fingirjoint
773415|Operador de lixadeira na usinagem de madeira|operador de lixadeira na usinagem de madeira
773415|Operador de máquina de confeccionar palitos|operador de maquina de confeccionar palitos
773415|Operador de máquina de produção na usinagem de madeira|operador de maquina de producao na usinagem de madeira
773415|Operador de máquinas de confeccionar fósforo|operador de maquinas de confeccionar fosforo
773415|Operador de perfiladeira|operador de perfiladeira
773415|Operador de seccionadeira na usinagem de madeira|operador de seccionadeira na usinagem de madeira
773510|Operador  de seccionadora|operador  de seccionadora
774105|Montador de artefatos de madeira|montador de artefatos de madeira
774105|Montador de caixas de madeira|montador de caixas de madeira
774105|Montador de caixotes de madeira|montador de caixotes de madeira
774105|Montador de engradados de madeira|montador de engradados de madeira
774105|Montador de móveis de madeira|montador de moveis de madeira
774105|Montador de paletes|montador de paletes
775105|Escultor de madeira|escultor de madeira
775110|Chapeador de fórmica|chapeador de formica
775110|Chapeador de móveis de madeira|chapeador de moveis de madeira
775110|Folheador de móveis|folheador de moveis
775110|Montador de capas trabalhadas|montador de capas trabalhadas
775110|Montador de lâminas|montador de laminas
775110|Operador de prensa (folha de recobrimento de móveis)|operador de prensa (folha de recobrimento de moveis)
775110|Revestidor de móveis de madeira|revestidor de moveis de madeira
775115|Ajudante de lustrador|ajudante de lustrador
775115|Laqueador de madeira|laqueador de madeira
775115|Laqueador de móveis|laqueador de moveis
775115|Lustrador de madeira|lustrador de madeira
775115|Lustrador de móveis|lustrador de moveis
776405|Balaieiro|balaieiro
776405|Cabazeiro|cabazeiro
776405|Jacazeiro|jacazeiro
776405|Vimeiro|vimeiro
776415|Confeccionador de escovas|confeccionador de escovas
776415|Confeccionador de pincéis|confeccionador de pinceis
776415|Confeccionador de pincéis, escovas e vassouras|confeccionador de pinceis, escovas e vassouras
776415|Operador de máquina de encher escovas, pincéis e vassouras|operador de maquina de encher escovas, pinceis e vassouras
776420|Armador de móveis de vime|armador de moveis de vime
776420|Artífice de vime|artifice de vime
776420|Empalhador de cadeiras|empalhador de cadeiras
776425|Confeccionador de esteiras|confeccionador de esteiras
776425|Confeccionador de esteiras de palha|confeccionador de esteiras de palha
776430|Confeccionador de vassouras de piaçaba, palha, cerdas plásticas e náilon|confeccionador de vassouras de piacaba, palha, cerdas plasticas e nailon
777110|Carpinteiro (tripulante de embarcações)|carpinteiro (tripulante de embarcacoes)
777110|Marceneiro naval|marceneiro naval
780105|Encarregado de acabamento (embalagem e etiquetagem)|encarregado de acabamento (embalagem e etiquetagem)
780105|Encarregado de seção de empacotamento|encarregado de secao de empacotamento
780105|Encarregado de turma de acondicionamento|encarregado de turma de acondicionamento
780105|Encarregado do setor de embalagem|encarregado do setor de embalagem
780105|Inspetor de alimentador de linhas de rotulagem|inspetor de alimentador de linhas de rotulagem
780105|Supervisor de ensacamento|supervisor de ensacamento
780105|Supervisor de envasamento|supervisor de envasamento
780105|Supervisor do setor de embalagem|supervisor do setor de embalagem
781105|Operador de processos automatizados de pintura|operador de processos automatizados de pintura
781105|Operador de robô de pintura|operador de robo de pintura
781110|Operador de robô de soldagem|operador de robo de soldagem
781110|Robotista (soldagem)|robotista (soldagem)
781305|Operador de rov|operador de rov
781305|Piloto de rov|piloto de rov
781310|Operador de aeronaves pilotadas remotamente|operador de aeronaves pilotadas remotamente
781310|Operador de drone|operador de drone
781310|Operador de quadricóptero|operador de quadricoptero
781310|Operador de sistema de aeronaves remotamente pilotadas (rpas)|operador de sistema de aeronaves remotamente pilotadas (rpas)
781310|Operador de ua (unmanned aircraft)|operador de ua (unmanned aircraft)
781310|Operador de veículos aéreos não tripulados (vant)|operador de veiculos aereos nao tripulados (vant)
781310|Piloto de aeronaves não tripuladas|piloto de aeronaves nao tripuladas
781310|Piloto de aeronaves pilotadas remotamente|piloto de aeronaves pilotadas remotamente
781310|Piloto de drone|piloto de drone
781310|Piloto de sistema de aeronaves remotamente pilotadas (rpas)|piloto de sistema de aeronaves remotamente pilotadas (rpas)
781310|Piloto de ua (unmanned aircraft)|piloto de ua (unmanned aircraft)
781310|Piloto de veículos aéreos não tripulados (vant)|piloto de veiculos aereos nao tripulados (vant)
781705|Mergulhador|mergulhador
782105|Operador de equipamento de dragagem|operador de equipamento de dragagem
782110|Guincheiro|guincheiro
782110|Guindasteiro|guindasteiro
782110|Operador de guindaste fixo sobre vagões de plataformas flutuantes|operador de guindaste fixo sobre vagoes de plataformas flutuantes
782110|Operador de ship loader|operador de ship loader
782115|Operador de grua (móvel)|operador de grua (movel)
782120|Maquinista ferroviário|maquinista ferroviario
782120|Operador de máquinas e equipamentos rodoferroviários|operador de maquinas e equipamentos rodoferroviarios
782145|Portaló nas operações de máquinas e equipamentos de elevação|portalo nas operacoes de maquinas e equipamentos de elevacao
782145|Sinaleiro de campo nas operações de máquinas e equipamentos de elevações|sinaleiro de campo nas operacoes de maquinas e equipamentos de elevacoes
782145|Sinaleiro (orientação de guindastes e equipamentos similares)|sinaleiro (orientacao de guindastes e equipamentos similares)
782205|Ajudante de guincheiro|ajudante de guincheiro
782205|Ajudante de operador de guincho|ajudante de operador de guincho
782205|Operador de guincho|operador de guincho
782205|Operador de máquina elevador|operador de maquina elevador
782210|Doqueiro|doqueiro
782220|Motorista de empilhadeira|motorista de empilhadeira
782220|Operador de empilhadeira elétrica|operador de empilhadeira eletrica
782220|Operador de máquina  empilhadeira|operador de maquina  empilhadeira
782305|Chofer|chofer
782305|Motorista  no serviço doméstico|motorista  no servico domestico
782305|Motorista de automóveis|motorista de automoveis
782305|Motorista particular|motorista particular
782305|Motorista segurança|motorista seguranca
782305|Piloto de precisão (motorista)|piloto de precisao (motorista)
782310|Condutor de veículo de carga|condutor de veiculo de carga
782310|Motorista auxiliar|motorista auxiliar
782310|Motorista auxiliar de tráfego|motorista auxiliar de trafego
782310|Motorista de carga a frete|motorista de carga a frete
782310|Motorista de furgão|motorista de furgao
782310|Motorista de kombi|motorista de kombi
782310|Motorista de perua|motorista de perua
782310|Motorista entregador|motorista entregador
782310|Motorista manipulador|motorista manipulador
782315|Chofer de praça|chofer de praca
782315|Condutor de táxi|condutor de taxi
782315|Motorista de praça|motorista de praca
782315|Taxeiro|taxeiro
782315|Taxista|taxista
782320|Condutor de transporte de pacientes|condutor de transporte de pacientes
782320|Condutor de veículos ambulatoriais|condutor de veiculos ambulatoriais
782320|Motorista de ambulância|motorista de ambulancia
782325|Condutor de transporte por aplicativos|condutor de transporte por aplicativos
782325|Motorista de aplicativos|motorista de aplicativos
782505|Caminhoneiro|caminhoneiro
782505|Caminhoneiro caçambeiro|caminhoneiro cacambeiro
782505|Caminhoneiro carreteiro|caminhoneiro carreteiro
782505|Caminhoneiro carreteiro (transporte animal)|caminhoneiro carreteiro (transporte animal)
782505|Caminhoneiro de basculante|caminhoneiro de basculante
782505|Caminhoneiro de caminhão basculante|caminhoneiro de caminhao basculante
782505|Caminhoneiro de caminhão betoneira|caminhoneiro de caminhao betoneira
782505|Caminhoneiro de caminhão leve|caminhoneiro de caminhao leve
782505|Caminhoneiro de caminhão pipa|caminhoneiro de caminhao pipa
782505|Caminhoneiro de caminhão-tanque|caminhoneiro de caminhao-tanque
782505|Caminhoneiro gaioleiro (gado)|caminhoneiro gaioleiro (gado)
782505|Caminhoneiro operador de caminhão betoneira|caminhoneiro operador de caminhao betoneira
782505|Carreteiro (caminhoneiro de caminhão carreta)|carreteiro (caminhoneiro de caminhao carreta)
782510|Caçambeiro|cacambeiro
782510|Carreteiro (motorista de caminhão carreta)|carreteiro (motorista de caminhao carreta)
782510|Carreteiro (transporte de animal)|carreteiro (transporte de animal)
782510|Cegonheiro ( motorista de caminhão)|cegonheiro ( motorista de caminhao)
782510|Gaioleiro (gado)|gaioleiro (gado)
782510|Manobrista de veículos pesados sobre rodas|manobrista de veiculos pesados sobre rodas
782510|Motorista carreteiro|motorista carreteiro
782510|Motorista de basculante|motorista de basculante
782510|Motorista de caminhão|motorista de caminhao
782510|Motorista de caminhão basculante|motorista de caminhao basculante
782510|Motorista de caminhão betoneira|motorista de caminhao betoneira
782510|Motorista de caminhão (entrega de bebidas)|motorista de caminhao (entrega de bebidas)
782510|Motorista de caminhão leve|motorista de caminhao leve
782510|Motorista de caminhão-pipa|motorista de caminhao-pipa
782510|Motorista de caminhão-tanque|motorista de caminhao-tanque
782510|Motorista operador de caminhão betoneira|motorista operador de caminhao betoneira
782515|Motorista de caminhão guincho leve|motorista de caminhao guincho leve
782515|Motorista de caminhão guincho médio|motorista de caminhao guincho medio
782515|Motorista de caminhão guincho pesado|motorista de caminhao guincho pesado
782515|Motorista de caminhão guincho pesado com munk|motorista de caminhao guincho pesado com munk
782515|Motorista de caminhão guindaste|motorista de caminhao guindaste
782605|Piloto de trem de metrô|piloto de trem de metro
782610|Maquinista de locomotiva|maquinista de locomotiva
782610|Operador de locomotiva|operador de locomotiva
782615|Operador de locomotiva (transporte metropolitano)|operador de locomotiva (transporte metropolitano)
782615|Operador de trem metropolitano|operador de trem metropolitano
782620|Operador de automotriz|operador de automotriz
782620|Operador de bonde|operador de bonde
782625|Ajudante de maquinista de trem|ajudante de maquinista de trem
782705|Contramestre fluvial|contramestre fluvial
782705|Marinheiro de convés|marinheiro de conves
782715|Marinheiro fluvial de convés|marinheiro fluvial de conves
782720|Marinheiro fluvial de máquinas|marinheiro fluvial de maquinas
782805|Cangueiro - carro de boi|cangueiro - carro de boi
782805|Carroceiro|carroceiro
782805|Charreteiro|charreteiro
782805|Cocheiro|cocheiro
782805|Condutor de carroça|condutor de carroca
782805|Condutor de charrete|condutor de charrete
782810|Arreador|arreador
782810|Arrieiro|arrieiro
782810|Bruaqueiro|bruaqueiro
782810|Cambiteiro|cambiteiro
782810|Cangalheiro|cangalheiro
782810|Cargueiro|cargueiro
782810|Carreiro|carreiro
782810|Comboieiro|comboieiro
782810|Muladeiro|muladeiro
782810|Sota|sota
782815|Chamador de bois|chamador de bois
782815|Condutor de boiada|condutor de boiada
782815|Condutor de bois|condutor de bois
782815|Guieiro|guieiro
782815|Madrinheiro|madrinheiro
783105|Agente de estação (manobras)|agente de estacao (manobras)
783110|Chefe de manobra - no transporte ferroviário|chefe de manobra - no transporte ferroviario
783110|Manobrador de ferrovia|manobrador de ferrovia
783110|Manobrador de trem|manobrador de trem
783110|Manobreiro de ferrovia|manobreiro de ferrovia
783110|Manobreiro de trem|manobreiro de trem
783110|Manobrista de ferrovia|manobrista de ferrovia
783110|Manobrista de trem|manobrista de trem
783110|Maquinista de manobras|maquinista de manobras
783110|Operador de manobras (auxiliar de ferrovias)|operador de manobras (auxiliar de ferrovias)
783205|Auxiliar de serviços no aeroporto|auxiliar de servicos no aeroporto
783205|Despachante de bagagens em aeroportos|despachante de bagagens em aeroportos
783215|Carregador de caminhão|carregador de caminhao
783215|Carregador de vagões|carregador de vagoes
783215|Carregador e descarregador de caminhões|carregador e descarregador de caminhoes
783215|Chapa arrumador de caminhões|chapa arrumador de caminhoes
783215|Chapa de caminhão|chapa de caminhao
783215|Chapa (movimentador de mercadoria)|chapa (movimentador de mercadoria)
783220|Bagrinho (estiva)|bagrinho (estiva)
783220|Cacimbeiro (estivador)|cacimbeiro (estivador)
783225|Ajudante de carga e descarga de mercadoria|ajudante de carga e descarga de mercadoria
783225|Entregador de bebidas (ajudante de caminhão)|entregador de bebidas (ajudante de caminhao)
783225|Entregador de gás (ajudante de caminhão)|entregador de gas (ajudante de caminhao)
783230|Bloquista (trabalhador portuário)|bloquista (trabalhador portuario)
783230|Peador (trabalhador portuário)|peador (trabalhador portuario)
783230|Trabalhador portuário de bloco|trabalhador portuario de bloco
783235|Encarregado de serviço de capatazia|encarregado de servico de capatazia
783235|Encarregado de serviços de cais (capatazia)|encarregado de servicos de cais (capatazia)
783240|Amarrador de embarcações|amarrador de embarcacoes
783240|Amarrador e desatracador de embarcações|amarrador e desatracador de embarcacoes
784105|Ajudante de embalador|ajudante de embalador
784105|Ajudante de encaixotador|ajudante de encaixotador
784105|Amarrador de embalagens|amarrador de embalagens
784105|Carimbador, a mão|carimbador, a mao
784105|Classificador de embalagens (manual)|classificador de embalagens (manual)
784105|Colador de caixas|colador de caixas
784105|Embrulhador|embrulhador
784105|Empacotador, a mão|empacotador, a mao
784105|Encaixotador, a mão|encaixotador, a mao
784105|Enchedor de bandejas|enchedor de bandejas
784105|Engradador|engradador
784105|Ensacador|ensacador
784105|Etiquetador, a mão|etiquetador, a mao
784105|Montador de caixa de papelão|montador de caixa de papelao
784105|Montador de embalagens|montador de embalagens
784110|Ajudante de ensacador, a máquina|ajudante de ensacador, a maquina
784110|Empacotador, a máquina|empacotador, a maquina
784110|Inspetor de material de embalagem|inspetor de material de embalagem
784110|Lacrador de embalagens, a  máquina|lacrador de embalagens, a  maquina
784110|Operador de embalagem, a máquina|operador de embalagem, a maquina
784110|Operador de máquina a vácuo|operador de maquina a vacuo
784110|Operador de máquina de embalar|operador de maquina de embalar
784110|Operador de máquina de embrulhar|operador de maquina de embrulhar
784110|Operador de máquina de empacotar|operador de maquina de empacotar
784110|Operador de máquina de enlatar|operador de maquina de enlatar
784110|Operador de máquina pneumática|operador de maquina pneumatica
784115|Carimbador, a máquina|carimbador, a maquina
784115|Colador de rótulos em caixas|colador de rotulos em caixas
784115|Etiquetador|etiquetador
784115|Etiquetador de embalagem|etiquetador de embalagem
784115|Marcador de caixas|marcador de caixas
784115|Marcador de embalagem|marcador de embalagem
784115|Marcador de fardos|marcador de fardos
784115|Marcador de preços|marcador de precos
784115|Operador de máquina de rotular|operador de maquina de rotular
784115|Rotulador|rotulador
784115|Seladeira|seladeira
784120|Ajudante de engarrafamento|ajudante de engarrafamento
784120|Arrolhador|arrolhador
784120|Engarrafador|engarrafador
784120|Operador de máquina de engarrafamento|operador de maquina de engarrafamento
784125|Ajudante de enfardamento|ajudante de enfardamento
784125|Costurador de fardos|costurador de fardos
784125|Enfardador|enfardador
784125|Operador de prensa de fardos|operador de prensa de fardos
784125|Prensador de sacos|prensador de sacos
784205|Abastecedor de linha de produção|abastecedor de linha de producao
784205|Abastecedor de máquinas de linha de produção|abastecedor de maquinas de linha de producao
784205|Alimentador de esteiras (preparação de alimentos e bebidas)|alimentador de esteiras (preparacao de alimentos e bebidas)
784205|Alimentador de máquina automática|alimentador de maquina automatica
784205|Auxiliar de linha de produção|auxiliar de linha de producao
784205|Operador de processo de produção|operador de processo de producao
810105|Supervisor de operação (indústria petroquímica e carboquímica)|supervisor de operacao (industria petroquimica e carboquimica)
810110|Chefe de centrifugação|chefe de centrifugacao
810110|Encarregado de misturas de divisão de corantes e produtos químicos|encarregado de misturas de divisao de corantes e produtos quimicos
810110|Encarregado de produção química|encarregado de producao quimica
810110|Supervisor de produção química|supervisor de producao quimica
810205|Chefe de setor de plásticos|chefe de setor de plasticos
810205|Encarregado de setor de borracha|encarregado de setor de borracha
810205|Mestre de acabamento de peças (plástico e borracha)|mestre de acabamento de pecas (plastico e borracha)
810305|Supervisor de embalagem (produção farmacêutica)|supervisor de embalagem (producao farmaceutica)
810305|Supervisor de fabricação (produção farmacêutica)|supervisor de fabricacao (producao farmaceutica)
810305|Supervisor de processamento (produção farmacêutica)|supervisor de processamento (producao farmaceutica)
810305|Supervisor de produção de líquidos (produção farmacêutica)|supervisor de producao de liquidos (producao farmaceutica)
810305|Supervisor de produção de semi-sólidos (produção farmacêutica)|supervisor de producao de semi-solidos (producao farmaceutica)
810305|Supervisor de produção de sólidos (produção farmacêutica)|supervisor de producao de solidos (producao farmaceutica)
810305|Supervisor de produção (produção farmacêutica)|supervisor de producao (producao farmaceutica)
811005|Mantenedor operacional de processos químicos e petroquímicos|mantenedor operacional de processos quimicos e petroquimicos
811005|Técnico de operação em processos químicos e petroquímicos|tecnico de operacao em processos quimicos e petroquimicos
811005|Técnico de processo petroquímico (operador de equipamentos)|tecnico de processo petroquimico (operador de equipamentos)
811010|Operador industrial nas instalações químicas, petroquímicas e afins|operador industrial nas instalacoes quimicas, petroquimicas e afins
811105|Operador de moinho (tratamentos químicos e afins)|operador de moinho (tratamentos quimicos e afins)
811110|Operador de estação de mistura (tratamentos químicos e afins)|operador de estacao de mistura (tratamentos quimicos e afins)
811110|Operador de mistura (tratamentos químicos e afins)|operador de mistura (tratamentos quimicos e afins)
811115|Operador de central de britagem (tratamentos químicos e afins)|operador de central de britagem (tratamentos quimicos e afins)
811115|Operador de máquina trituradora (tratamentos químicos e afins)|operador de maquina trituradora (tratamentos quimicos e afins)
811125|Operador de fabricação de tintas e vernizes|operador de fabricacao de tintas e vernizes
811125|Operador de reatores (fabricação de vernizes e resinas)|operador de reatores (fabricacao de vernizes e resinas)
811130|Misturador de tintas|misturador de tintas
811130|Operador de fabricação de tintas|operador de fabricacao de tintas
811205|Calcinador|calcinador
811205|Operador de forno de calcinação|operador de forno de calcinacao
811205|Operador de forno termoelétrico para elétrodos de grafite|operador de forno termoeletrico para eletrodos de grafite
811205|Operador de sistema de calcinação|operador de sistema de calcinacao
811305|Ajudante de operador de centrífugas|ajudante de operador de centrifugas
811305|Centrifuguista|centrifuguista
811305|Operador de centrífuga (tratamentos químicos e afins)|operador de centrifuga (tratamentos quimicos e afins)
811305|Operador de equipamentos de centrifugar|operador de equipamentos de centrifugar
811305|Operador de máquinas de centrifugar (tratamentos químicos e afins)|operador de maquinas de centrifugar (tratamentos quimicos e afins)
811310|Operador de equipamentos (exploração de petróleo)|operador de equipamentos (exploracao de petroleo)
811310|Operador de filtragem (exploração de petróleo)|operador de filtragem (exploracao de petroleo)
811310|Operador de máquinas (exploração de petróleo)|operador de maquinas (exploracao de petroleo)
811310|Operador de processos (exploração de petróleo)|operador de processos (exploracao de petroleo)
811315|Operador de equipamentos de secagem (mineração)|operador de equipamentos de secagem (mineracao)
811315|Operador de filtragem (mineração)|operador de filtragem (mineracao)
811320|Operador de filtragem (filtro de tambor rotativo)|operador de filtragem (filtro de tambor rotativo)
811320|Operador de filtro rotativo|operador de filtro rotativo
811320|Operador de máquina de filtro rotativo (tratamentos químicos)|operador de maquina de filtro rotativo (tratamentos quimicos)
811320|Operador de tambor rotativo|operador de tambor rotativo
811330|Ajudante de filtrador (filtro-prensa)|ajudante de filtrador (filtro-prensa)
811330|Filtrador de goma|filtrador de goma
811330|Operador de equipamentos (filtro-prensa para tratamentos químicos)|operador de equipamentos (filtro-prensa para tratamentos quimicos)
811330|Operador de estação de filtragem (filtro-prensa)|operador de estacao de filtragem (filtro-prensa)
811330|Operador de filtro-prensa|operador de filtro-prensa
811335|Operador de equipamentos de parafinar|operador de equipamentos de parafinar
811335|Operador de filtragem de parafina|operador de filtragem de parafina
811335|Parafinador|parafinador
811335|Parafineiro|parafineiro
811335|Preparador de anéis de parafina|preparador de aneis de parafina
811405|Alcatroeiro|alcatroeiro
811410|Destilador de glicerina|destilador de glicerina
811410|Destilador de produtos de perfumaria|destilador de produtos de perfumaria
811410|Destilador de produtos químicos e afins|destilador de produtos quimicos e afins
811410|Destilador de resinas|destilador de resinas
811410|Operador auxiliar de destilação|operador auxiliar de destilacao
811410|Operador de destilação (produtos químicos)|operador de destilacao (produtos quimicos)
811415|Destilador|destilador
811420|Operador de reator (produtos químicos exceto petróleo)|operador de reator (produtos quimicos exceto petroleo)
811425|Destilador de álcool|destilador de alcool
811425|Operador de produção de álcool|operador de producao de alcool
811430|Ajudante de evaporador na destilação|ajudante de evaporador na destilacao
811505|Operador de processo (petróleo)|operador de processo (petroleo)
811505|Operador de utilidades (petróleo)|operador de utilidades (petroleo)
811505|Operador industrial especializado (petróleo)|operador industrial especializado (petroleo)
811510|Bombeador (refinação de petróleo)|bombeador (refinacao de petroleo)
811510|Operador de bomba (refinação de petróleo)|operador de bomba (refinacao de petroleo)
811510|Operador de processamento (transferência e estocagem de petróleo)|operador de processamento (transferencia e estocagem de petroleo)
811615|Ajudante de destilação de amônia|ajudante de destilacao de amonia
811615|Operador de carboquímico|operador de carboquimico
811615|Operador de destilação de amônia|operador de destilacao de amonia
811615|Operador de destilação de enxofre|operador de destilacao de enxofre
811615|Operador de tratamento de gás (coque)|operador de tratamento de gas (coque)
811615|Operador de tratamento residual|operador de tratamento residual
811635|Operador de controle de produção de carboquímico|operador de controle de producao de carboquimico
811635|Operador de controle térmico|operador de controle termico
811635|Operador de preservação de área carboquímicos|operador de preservacao de area carboquimicos
811635|Operador de tratamento de gás|operador de tratamento de gas
811705|Operador de bambury|operador de bambury
811710|Cilindrista de borracha|cilindrista de borracha
811715|Confeccionador de câmaras de ar|confeccionador de camaras de ar
811715|Confeccionador de pneus|confeccionador de pneus
811715|Modelador de pneumáticos|modelador de pneumaticos
811735|Moldador de parafinas|moldador de parafinas
811745|Calandreiro de plástico|calandreiro de plastico
811745|Cilindrista de plástico|cilindrista de plastico
811750|Modador-prensista (borracha)|modador-prensista (borracha)
811750|Moldador de borracha|moldador de borracha
811750|Moldador prensista (borracha)|moldador prensista (borracha)
811750|Prensista de borracha|prensista de borracha
811760|Moldador de plástico|moldador de plastico
811760|Prensista de plástico|prensista de plastico
811770|Injetor de plástico|injetor de plastico
811770|Operador de injetora de plástico|operador de injetora de plastico
811775|Extrusor de borracha|extrusor de borracha
811775|Operador de extrusora de borracha e plástico|operador de extrusora de borracha e plastico
811775|Operador de trefila (borracha)|operador de trefila (borracha)
811810|Drageador|drageador
811810|Drageador manipulador|drageador manipulador
811810|Manipulador de seção de comprimidos e drágeas|manipulador de secao de comprimidos e drageas
811810|Trabalhador de fabricação de comprimidos e drágeas|trabalhador de fabricacao de comprimidos e drageas
811820|Fraldeiro|fraldeiro
812105|Arrematador de fogos|arrematador de fogos
812105|Confeccionador de estalinho|confeccionador de estalinho
812105|Confeccionador de foguetes|confeccionador de foguetes
812105|Fabricador de baladas|fabricador de baladas
812105|Fabricador de fogos de artifício|fabricador de fogos de artificio
813110|Operador industrial (química, petroquímica e afins)|operador industrial (quimica, petroquimica e afins)
813115|Operador especializado de extrusora|operador especializado de extrusora
813120|Operador de processo de golfragem|operador de processo de golfragem
813125|Operador de manufaturado (química, petroquímica e afins)|operador de manufaturado (quimica, petroquimica e afins)
813125|Operador de máquina de arame|operador de maquina de arame
818105|Coletor ambiental|coletor ambiental
818105|Coletor de amostras ambientais|coletor de amostras ambientais
820110|Supervisor de calcinação|supervisor de calcinacao
820110|Supervisor de convertedor|supervisor de convertedor
820110|Supervisor de dessulfuração|supervisor de dessulfuracao
820110|Supervisor de forno-panela|supervisor de forno-panela
820110|Supervisor de lingotamento|supervisor de lingotamento
820110|Supervisor de pátio e sucata|supervisor de patio e sucata
820115|Supervisor de alto-forno|supervisor de alto-forno
820120|Mestre de forno de resistência|mestre de forno de resistencia
820125|Supervisor de forno-poço|supervisor de forno-poco
820125|Supervisor de laminador de bloco e tarugos|supervisor de laminador de bloco e tarugos
820125|Supervisor de laminador desbastador|supervisor de laminador desbastador
820125|Supervisor de linhas de acabamento|supervisor de linhas de acabamento
820205|Assistente técnico na fabricação de produtos de cerâmica, porcelanatos e afins|assistente tecnico na fabricacao de produtos de ceramica, porcelanatos e afins
820205|Chefe de produção na fabricação de produtos de cerâmica, porcelanatos e afins|chefe de producao na fabricacao de produtos de ceramica, porcelanatos e afins
820205|Encarregado de produção na fabricação de produtos de cerâmica, porcelanatos e afins|encarregado de producao na fabricacao de produtos de ceramica, porcelanatos e afins
820205|Gerente de produção na fabricação de produtos de cerâmica, porcelanatos e afins|gerente de producao na fabricacao de produtos de ceramica, porcelanatos e afins
820205|Supervisor de produção na fabricação de produtos de cerâmica, porcelanatos e afins|supervisor de producao na fabricacao de produtos de ceramica, porcelanatos e afins
820210|Chefe de produção na fabricação de produtos de vidro|chefe de producao na fabricacao de produtos de vidro
820210|Encarregado de produção na fabricação de produtos de vidros|encarregado de producao na fabricacao de produtos de vidros
820210|Gerente de produção na fabricação de produtos de vidro|gerente de producao na fabricacao de produtos de vidro
820210|Supervisor de produção na fabricação de produtos de vidro|supervisor de producao na fabricacao de produtos de vidro
821105|Operador de centro de controle de sinterização e pátios|operador de centro de controle de sinterizacao e patios
821105|Operador de centro de controle e equipamentos da sinterização|operador de centro de controle e equipamentos da sinterizacao
821105|Operador de centro de controle e matéria-prima para sinterizar|operador de centro de controle e materia-prima para sinterizar
821110|Operador de forno de sinterizar|operador de forno de sinterizar
821110|Operador de sinterização|operador de sinterizacao
821205|Ajudante de forneiro|ajudante de forneiro
821205|Carregador de alto-forno|carregador de alto-forno
821205|Forneiro auxiliar (alto-forno)|forneiro auxiliar (alto-forno)
821205|Forneiro de alto-forno|forneiro de alto-forno
821205|Forneiro de recuperação de resíduos|forneiro de recuperacao de residuos
821205|Operador de alto-forno|operador de alto-forno
821205|Operador de carregamento de alto-forno|operador de carregamento de alto-forno
821205|Operador de centro de controle de alto-forno|operador de centro de controle de alto-forno
821205|Operador de inspeção de alto-forno|operador de inspecao de alto-forno
821210|Forneiro conversor a oxigênio|forneiro conversor a oxigenio
821210|Operador de forno (conversor a oxigênio)|operador de forno (conversor a oxigenio)
821215|Operador de forno de indução elétrica|operador de forno de inducao eletrica
821215|Operador de forno de tratamento térmico elétrico|operador de forno de tratamento termico eletrico
821215|Operador de forno elétrico|operador de forno eletrico
821220|Forneiro (fundição)|forneiro (fundicao)
821220|Forneiros de não-ferrosos|forneiros de nao-ferrosos
821220|Fundidor (depuração e refinação de metais não-ferrosos)|fundidor (depuracao e refinacao de metais nao-ferrosos)
821220|Operador de forno (refino de metais não-ferrosos)|operador de forno (refino de metais nao-ferrosos)
821230|Operador de basculamento de convertedor|operador de basculamento de convertedor
821235|Auxiliar de dessulfuração e estação de mistura|auxiliar de dessulfuracao e estacao de mistura
821235|Operador de dessulfurador de gusa|operador de dessulfurador de gusa
821240|Líder de recebimento de gusa|lider de recebimento de gusa
821240|Operador de recebimento de gusa|operador de recebimento de gusa
821245|Controlador de carro torpedo|controlador de carro torpedo
821245|Líder de área de corrida|lider de area de corrida
821245|Operador de conservação de canais|operador de conservacao de canais
821245|Preparador de área de corrida|preparador de area de corrida
821250|Auxiliar de desgaseificação|auxiliar de desgaseificacao
821255|Líder de convertedor|lider de convertedor
821255|Operador de sopragem|operador de sopragem
821305|Controlador de laminação|controlador de laminacao
821305|Operador de laminação|operador de laminacao
821305|Operador de laminador de encruamento|operador de laminador de encruamento
821305|Operador de laminador de placas|operador de laminador de placas
821315|Operador de cardas de chapas grossas|operador de cardas de chapas grossas
821315|Operador de laminador de tiras a quente|operador de laminador de tiras a quente
821315|Operador de leito de chapas grossas|operador de leito de chapas grossas
821315|Operador de máquina de laminação (a quente)|operador de maquina de laminacao (a quente)
821320|Laminador de metais não-ferrosos|laminador de metais nao-ferrosos
821405|Líder de produção, no acabamento de chapas e metais|lider de producao, no acabamento de chapas e metais
821420|Operador de desbobinadeira da linha de decapagem|operador de desbobinadeira da linha de decapagem
821420|Operador de desbobinadeiras de tiras a quente e a frio|operador de desbobinadeiras de tiras a quente e a frio
821435|Operador de jato de areia|operador de jato de areia
821435|Operador de jato de granalha|operador de jato de granalha
821440|Líder de linhas de tesoura de tiras a quente e a  frio|lider de linhas de tesoura de tiras a quente e a  frio
821440|Líder de linhas de tesoura, no acabamento de chapas e metais (tiras a frio)|lider de linhas de tesoura, no acabamento de chapas e metais (tiras a frio)
821440|Operador de carro de aparas|operador de carro de aparas
821440|Operador de máquina de corte a gás|operador de maquina de corte a gas
821440|Operador de tesoura desbastadora, no acabamento chapas e metais|operador de tesoura desbastadora, no acabamento chapas e metais
821440|Operador de tesoura elétrica, no acabamento de chapas e metais|operador de tesoura eletrica, no acabamento de chapas e metais
821440|Operador de tesoura pendular, no acabamento de chapas e metais|operador de tesoura pendular, no acabamento de chapas e metais
821440|Operador de tesoura rotativa, no acabamento de chapas e metais|operador de tesoura rotativa, no acabamento de chapas e metais
821440|Operador de tesoura sucata|operador de tesoura sucata
821440|Operador de tesoura transversal, no acabamento de chapas e metais|operador de tesoura transversal, no acabamento de chapas e metais
821440|Operador de tesoura volante e guilhotina, no acabamento de chapas e metais|operador de tesoura volante e guilhotina, no acabamento de chapas e metais
821440|Picotador de flandres|picotador de flandres
821445|Ajudante de pátio de sucata|ajudante de patio de sucata
821445|Controlador de pátio de sucata|controlador de patio de sucata
821445|Selecionador de sucatas|selecionador de sucatas
821450|Ajudante de rebarbação (metais)|ajudante de rebarbacao (metais)
821450|Ajustador de rebarbador|ajustador de rebarbador
821450|Esmerilador de metais|esmerilador de metais
821450|Limpador de metais|limpador de metais
821450|Operador de esmeril e serra de disco, no acabamento de metal|operador de esmeril e serra de disco, no acabamento de metal
821450|Operador de esmeril fixo, no rebarbamento de metal|operador de esmeril fixo, no rebarbamento de metal
821450|Operador de esmeril, no rebarbamento de metal|operador de esmeril, no rebarbamento de metal
821450|Operador de esmerilador de trilhos, no acabamento de metais|operador de esmerilador de trilhos, no acabamento de metais
822105|Forneiro auxiliar de cubilô|forneiro auxiliar de cubilo
822105|Operador de forno cubilô|operador de forno cubilo
822110|Operador de forno-poço|operador de forno-poco
822115|Forneiro de fundição|forneiro de fundicao
822115|Forneiro fundidor de metais|forneiro fundidor de metais
822115|Forneiro metalúrgico|forneiro metalurgico
822115|Operador de forno metalúrgico|operador de forno metalurgico
822120|Operador de forno de tratamento térmico|operador de forno de tratamento termico
822125|Carregador de forno de segunda fusão e reaquecimento|carregador de forno de segunda fusao e reaquecimento
822125|Forneiro de forno revérbero|forneiro de forno reverbero
822125|Forneiro de metais ferrosos e não-ferrosos (preparação de ligas)|forneiro de metais ferrosos e nao-ferrosos (preparacao de ligas)
822125|Forneiro de retêmpera|forneiro de retempera
822125|Forneiro de têmpera|forneiro de tempera
822125|Operador de forno de espera|operador de forno de espera
822125|Operador de revérbero|operador de reverbero
822125|Preparador de ligas na metalurgia|preparador de ligas na metalurgia
823105|Preparador de massa abrasiva|preparador de massa abrasiva
823105|Preparador de mistura abrasiva|preparador de mistura abrasiva
823110|Preparador de composição de matéria-prima (vidro)|preparador de composicao de materia-prima (vidro)
823115|Operador de moinhos (argila)|operador de moinhos (argila)
823115|Preparador de argila|preparador de argila
823115|Preparador de massa de argila em cerâmica|preparador de massa de argila em ceramica
823115|Preparador de massa de argila em olaria|preparador de massa de argila em olaria
823115|Preparador de massa refratária (revestimento de forno)|preparador de massa refrataria (revestimento de forno)
823120|Preparador de massa cerâmica|preparador de massa ceramica
823125|Preparador de esmalte vítreo|preparador de esmalte vitreo
823130|Preparador de aditivos e massas refratárias|preparador de aditivos e massas refratarias
823210|Ajudante de extrusão de fibras de vidro|ajudante de extrusao de fibras de vidro
823210|Fibrador (fabricação de fibra de vidro)|fibrador (fabricacao de fibra de vidro)
823210|Misturador de fios de fibras de vidro|misturador de fios de fibras de vidro
823210|Operador de extrusora (vidro)|operador de extrusora (vidro)
823215|Forneiro de vidro|forneiro de vidro
823215|Fundidor vidreiro|fundidor vidreiro
823215|Operador de forno (fundição de vidro)|operador de forno (fundicao de vidro)
823215|Vidreiro|vidreiro
823220|Operador de forno de recozimento (vidro)|operador de forno de recozimento (vidro)
823230|Manipulador de moldados (abrasivos)|manipulador de moldados (abrasivos)
823230|Prensista de rebolo de diamante|prensista de rebolo de diamante
823235|Ajudante de banhos (vidros)|ajudante de banhos (vidros)
823240|Garrafeiro (fabricação)|garrafeiro (fabricacao)
823240|Soprador de vidro (a máquina)|soprador de vidro (a maquina)
823245|Ampoleiro (jarras e garrafas térmicas)|ampoleiro (jarras e garrafas termicas)
823245|Operador de máquina de esticar varetas ou tubos de vidro|operador de maquina de esticar varetas ou tubos de vidro
823245|Operador de máquina extrusora de fibra de vidro|operador de maquina extrusora de fibra de vidro
823245|Operador de máquina extrusora de vidro|operador de maquina extrusora de vidro
823250|Operador de cerâmica (fundição de vidro)|operador de ceramica (fundicao de vidro)
823250|Operador de máquina de moldar vidro|operador de maquina de moldar vidro
823250|Vazador de vidro fundido|vazador de vidro fundido
823250|Vazador de vidro fundido em moldes|vazador de vidro fundido em moldes
823255|Forneiro temperador|forneiro temperador
823265|Confeccionador de lixas|confeccionador de lixas
823265|Trabalhador  na fabricação de pedras abrasivas|trabalhador  na fabricacao de pedras abrasivas
823265|Trabalhador da fabricação de lixa|trabalhador da fabricacao de lixa
823265|Trabalhador na fabricação de esmeris|trabalhador na fabricacao de esmeris
823265|Trabalhador na fabricação de rebolos|trabalhador na fabricacao de rebolos
823305|Classificador e empilhador de tijolos e telhas|classificador e empilhador de tijolos e telhas
823315|Forneiro de material de construção (telhas e tijolos)|forneiro de material de construcao (telhas e tijolos)
823315|Operador de forno de cerâmica (materiais de construção)|operador de forno de ceramica (materiais de construcao)
823320|Auxiliar de fabricação nas indústrias de artefatos de cimento|auxiliar de fabricacao nas industrias de artefatos de cimento
823320|Operador de máquina na fabricação de artefatos de cimento|operador de maquina na fabricacao de artefatos de cimento
823320|Trabalhador  na fabricação de artefatos de cimento amianto|trabalhador  na fabricacao de artefatos de cimento amianto
823325|Trabalhador na fabricação de artefatos de cimento|trabalhador na fabricacao de artefatos de cimento
823330|Fundidor de pedras artificiais|fundidor de pedras artificiais
823330|Graniteiro|graniteiro
828105|Cortador de telhas|cortador de telhas
828105|Manilheiro - na fabricação|manilheiro - na fabricacao
828105|Telheiro|telheiro
828110|Ajudante de fábrica de tijolos|ajudante de fabrica de tijolos
828110|Ajudante de oleiro|ajudante de oleiro
828110|Amassador - em olaria|amassador - em olaria
828110|Barreiro|barreiro
828110|Barrerista|barrerista
828110|Batedor - em olaria|batedor - em olaria
828110|Batedor de tijolos - na fabricação|batedor de tijolos - na fabricacao
828110|Chapeador de tijolos|chapeador de tijolos
828110|Cortador de barro|cortador de barro
828110|Cortador de tijolos|cortador de tijolos
828110|Desbarbeador de tijolos|desbarbeador de tijolos
828110|Desempenador em olaria|desempenador em olaria
828110|Desenfornador de tijolo e telha|desenfornador de tijolo e telha
828110|Encaierador de tijolos|encaierador de tijolos
828110|Enfornador de tijolos|enfornador de tijolos
828110|Forneiro - em olaria|forneiro - em olaria
828110|Gradeiro|gradeiro
828110|Marombeiro|marombeiro
828110|Operador de máquina de cortar tijolos e telhas|operador de maquina de cortar tijolos e telhas
828110|Operador de maromba|operador de maromba
828110|Operador de prensa - em olaria|operador de prensa - em olaria
828110|Operador de secador da fabricação cerâmica|operador de secador da fabricacao ceramica
828110|Prensista de telhas e tijolos|prensista de telhas e tijolos
828110|Queimador - em olaria|queimador - em olaria
828110|Sabugueiro|sabugueiro
828110|Tijoleiro|tijoleiro
830105|Chefe de acabamento de papel|chefe de acabamento de papel
830105|Contramestre (indústria de celulose, papel e papelão)|contramestre (industria de celulose, papel e papelao)
830105|Coordenador de turno - área de fibras|coordenador de turno - area de fibras
830105|Coordenador de turno - área de papel|coordenador de turno - area de papel
830105|Mestre de fabricação e montagem de caixas (papelão)|mestre de fabricacao e montagem de caixas (papelao)
830105|Supervisor de fibras e utilidades|supervisor de fibras e utilidades
830105|Supervisor de máquinas para fabricar papel|supervisor de maquinas para fabricar papel
830105|Supervisor de papel e acabamento|supervisor de papel e acabamento
830105|Supervisor de pátio de madeira|supervisor de patio de madeira
830105|Supervisor de processo de fibras, químicos e madeira|supervisor de processo de fibras, quimicos e madeira
830105|Supervisor de produção de celulose|supervisor de producao de celulose
830105|Supervisor de produção de papel|supervisor de producao de papel
830105|Supervisor de recuperação de produtos químicos|supervisor de recuperacao de produtos quimicos
831105|Condutor de máquina de secagem na fabricação de pasta/celulose|condutor de maquina de secagem na fabricacao de pasta/celulose
831105|Preparador de massa para fabricação de papel|preparador de massa para fabricacao de papel
831105|Refinador de pasta/celulose  para fabricação de papel|refinador de pasta/celulose  para fabricacao de papel
831110|Branqueador de pasta  de celulose para fabricação de papel|branqueador de pasta  de celulose para fabricacao de papel
831110|Operador de processos de semibranqueamento de pasta/celulose|operador de processos de semibranqueamento de pasta/celulose
831110|Operador de sdcd|operador de sdcd
831125|Ajudante de fabricação de celulose|ajudante de fabricacao de celulose
831125|Condutor de máquina de secagem de celulose|condutor de maquina de secagem de celulose
832105|Operador de supercalandra|operador de supercalandra
832115|Condutor de máquina de papel (fase úmida)|condutor de maquina de papel (fase umida)
832125|Condutor  em fábrica de papel|condutor  em fabrica de papel
832125|Condutor de máquina de fabricar papel e papelão|condutor de maquina de fabricar papel e papelao
832125|Operador de máquina de fabricar papel|operador de maquina de fabricar papel
832125|Operador de onduladora de papel|operador de onduladora de papel
832135|Rebobinador na fabricação de papel e papelão|rebobinador na fabricacao de papel e papelao
833105|Caroneiro - em cartonagem|caroneiro - em cartonagem
833105|Cartonageiro - em cartonagem|cartonageiro - em cartonagem
833105|Cartonageiro - nas indústrias gráficas|cartonageiro - nas industrias graficas
833105|Confeccionador de caixas de papelão|confeccionador de caixas de papelao
833105|Confeccionador de caixas de papelão, a máquina|confeccionador de caixas de papelao, a maquina
833105|Operador de máquina de cartonagem|operador de maquina de cartonagem
833110|Confeccionador de artigos de papel e papelão|confeccionador de artigos de papel e papelao
833110|Confeccionador de bolsas de papel|confeccionador de bolsas de papel
833110|Confeccionador de produtos de papel e papelão|confeccionador de produtos de papel e papelao
833110|Confeccionador de sacolas de papel|confeccionador de sacolas de papel
833110|Confeccionador de sacos de papel|confeccionador de sacos de papel
833110|Operador de máquina de cortar, colar e dobrar papel|operador de maquina de cortar, colar e dobrar papel
833115|Operador de máquina de cortar, colar e dobrar celofane e similar|operador de maquina de cortar, colar e dobrar celofane e similar
833125|Operador de prensa a fabricação de papel|operador de prensa a fabricacao de papel
833205|Confeccionador de caixas de papelão, a mão|confeccionador de caixas de papelao, a mao
840105|Chefe de fabricação de chocolate|chefe de fabricacao de chocolate
840105|Encarregado de moinho|encarregado de moinho
840105|Mestre chocolateiro|mestre chocolateiro
840105|Mestre da indústria de produtos alimentícios|mestre da industria de produtos alimenticios
840105|Mestre de conservas|mestre de conservas
840105|Mestre de massas alimentícias|mestre de massas alimenticias
840105|Mestre padeiro|mestre padeiro
840110|Mestre cervejeiro|mestre cervejeiro
840110|Mestre da indústria de bebidas|mestre da industria de bebidas
840110|Mestre de engarrafamento (bebidas)|mestre de engarrafamento (bebidas)
840115|Encarregado de abridores (fumo)|encarregado de abridores (fumo)
840115|Encarregado de fumo desfiado|encarregado de fumo desfiado
840115|Encarregado de preparação de talo (indústria de fumo)|encarregado de preparacao de talo (industria de fumo)
840115|Encarregado de qualidade de fumo|encarregado de qualidade de fumo
840115|Encarregado fabricação de cigarros|encarregado fabricacao de cigarros
840115|Mestre da indústria de fumo|mestre da industria de fumo
840115|Mestre de preparação de fumo|mestre de preparacao de fumo
840120|Mestre doceiro|mestre doceiro
841105|Moendeiro (farinheiro)|moendeiro (farinheiro)
841105|Operador de moinho de farinha crua|operador de moinho de farinha crua
841110|Moedor de condimento|moedor de condimento
841110|Moedor de especiarias|moedor de especiarias
841110|Operador de moinho de especiarias|operador de moinho de especiarias
841115|Moageiro|moageiro
841115|Moedor de farinha|moedor de farinha
841115|Moendeiro|moendeiro
841115|Operador de moinho e mistura|operador de moinho e mistura
841115|Operador de moinho (processo de moagem)|operador de moinho (processo de moagem)
841115|Ralador de mandioca|ralador de mandioca
841210|Auxiliares de produção de refinação de sal|auxiliares de producao de refinacao de sal
841210|Beneficiador de sal|beneficiador de sal
841210|Encarregado de armazenagem de sal|encarregado de armazenagem de sal
841210|Forneiro na refrigeração de sal|forneiro na refrigeracao de sal
841210|Operador braçal do refino de sal|operador bracal do refino de sal
841210|Operador de fábrica de  refino de sal|operador de fabrica de  refino de sal
841210|Operador de máquinas de embalagem de sal|operador de maquinas de embalagem de sal
841210|Operador de refinaria de sal|operador de refinaria de sal
841305|Operador de evaporador para concentração do xarope na refinação de açúcar|operador de evaporador para concentracao do xarope na refinacao de acucar
841305|Operador de secador na fabricação e refino de açúcar|operador de secador na fabricacao e refino de acucar
841305|Operador de turbina a vapor na fabricação e refino de açúcar|operador de turbina a vapor na fabricacao e refino de acucar
841310|Controlador da velocidade de equipamentos na refinação de açúcar|controlador da velocidade de equipamentos na refinacao de acucar
841310|Operador de caleadeira na refinação de açúcar|operador de caleadeira na refinacao de acucar
841310|Operador de cozedor a vácuo na refinação de açúcar|operador de cozedor a vacuo na refinacao de acucar
841310|Operador de decantador na refinação de açúcar|operador de decantador na refinacao de acucar
841310|Operador de enxofreira na refinação de açúcar|operador de enxofreira na refinacao de acucar
841310|Operador de filtro na refinação de açúcar|operador de filtro na refinacao de acucar
841310|Operador de flotador na refinação de açúcar|operador de flotador na refinacao de acucar
841310|Operador de mexedeira na refinação de açúcar|operador de mexedeira na refinacao de acucar
841310|Operador de turbina a vapor na refinação de açúcar|operador de turbina a vapor na refinacao de acucar
841310|Turbineiro na refinação de açúcar|turbineiro na refinacao de acucar
841315|Operador de secador na fabricação de açúcar|operador de secador na fabricacao de acucar
841315|Parozeiro|parozeiro
841408|Assistente de cozinhador|assistente de cozinhador
841408|Cozinhador de alimentos|cozinhador de alimentos
841408|Cozinhador de conservas|cozinhador de conservas
841408|Cozinhador de molhos e condimentos|cozinhador de molhos e condimentos
841408|Cozinheiro salgador|cozinheiro salgador
841408|Preparador de guarnições|preparador de guarnicoes
841408|Preparador de ingredientes (conservação de alimentos)|preparador de ingredientes (conservacao de alimentos)
841420|Limpador de frutas e legumes para conserva|limpador de frutas e legumes para conserva
841428|Operador de máquina - na industrialização do pescado|operador de maquina - na industrializacao do pescado
841440|Ajudante de esterilização (indústria alimentícia)|ajudante de esterilizacao (industria alimenticia)
841440|Operador de autoclave (conservação de alimentos)|operador de autoclave (conservacao de alimentos)
841444|Operador de hidrogenação|operador de hidrogenacao
841444|Operador de instalação para produção de resfriamento de banha|operador de instalacao para producao de resfriamento de banha
841448|Ajudante de produção de óleos vegetais na indústria alimentar|ajudante de producao de oleos vegetais na industria alimentar
841448|Auxiliar de produção de gorduras vegetais comestíveis|auxiliar de producao de gorduras vegetais comestiveis
841448|Operador de extração de oleos e gorduras vegetais|operador de extracao de oleos e gorduras vegetais
841456|Operador de câmaras frigoríficas|operador de camaras frigorificas
841460|Graneador|graneador
841460|Prensador de sementes e frutas oleaginosas|prensador de sementes e frutas oleaginosas
841464|Operador de prensadora de frutas|operador de prensadora de frutas
841468|Controlador de dosadores de rações|controlador de dosadores de racoes
841468|Operador de fábrica de rações|operador de fabrica de racoes
841484|Trabalhador de limpeza de pescado - na industrialização|trabalhador de limpeza de pescado - na industrializacao
841505|Operador de desnatadeira (fabricação de laticínios e afins)|operador de desnatadeira (fabricacao de laticinios e afins)
841505|Operador de máquina de laticínios|operador de maquina de laticinios
841505|Operador de pasteurizador|operador de pasteurizador
841505|Trabalhador da fabricação de laticínio|trabalhador da fabricacao de laticinio
841505|Trabalhador de tratamento de leite|trabalhador de tratamento de leite
841625|Operador de máquina de torrefação de cacau|operador de maquina de torrefacao de cacau
841630|Operador de secador de mate|operador de secador de mate
841630|Operador de soque|operador de soque
841630|Torrador de chá|torrador de cha
841705|Aguardenteiro (fabricação)|aguardenteiro (fabricacao)
841705|Destilador de bebidas|destilador de bebidas
841705|Destilador de licores|destilador de licores
841710|Cervejeiro (fabricação)|cervejeiro (fabricacao)
841710|Chopeiro|chopeiro
841710|Filtrador na indústria de bebidas|filtrador na industria de bebidas
841710|Operador de filtro (cerveja)|operador de filtro (cerveja)
841710|Serpenteador|serpenteador
841715|Auxiliar de fermentação|auxiliar de fermentacao
841715|Fermentador de cerveja|fermentador de cerveja
841715|Fermentador de vinho|fermentador de vinho
841715|Operador de adegas|operador de adegas
841720|Cantineiro (fabricação de vidros)|cantineiro (fabricacao de vidros)
841720|Clarificador de vinhos|clarificador de vinhos
841720|Fundidor de vinheta|fundidor de vinheta
841720|Licorista|licorista
841720|Manipulador de misturas (vinhos)|manipulador de misturas (vinhos)
841720|Misturador de vinhos|misturador de vinhos
841720|Trabalhador de vinhos achampanhados|trabalhador de vinhos achampanhados
841720|Vinhateiro|vinhateiro
841725|Operador de germinação|operador de germinacao
841730|Cozinhador de extrato de cerveja|cozinhador de extrato de cerveja
841730|Cozinheiro de cerveja|cozinheiro de cerveja
841730|Operador de sala de brassagem|operador de sala de brassagem
841735|Operador de estufa de secagem de malte|operador de estufa de secagem de malte
841735|Operador de forno de secagem (malte)|operador de forno de secagem (malte)
841735|Secador de malte|secador de malte
841740|Misturador de vinagre|misturador de vinagre
841745|Ajudante de fabricação - na indústria de bebidas|ajudante de fabricacao - na industria de bebidas
841745|Ajudante de produção - na indústria de bebidas|ajudante de producao - na industria de bebidas
841745|Ajudante de tratamento de preparo de xarope|ajudante de tratamento de preparo de xarope
841745|Ajudante xaropeiro|ajudante xaropeiro
841745|Dosador de xaropes|dosador de xaropes
841745|Xaropeiro - na indústria de bebidas|xaropeiro - na industria de bebidas
841805|Enfornador de pão|enfornador de pao
841805|Forneiro de padaria|forneiro de padaria
841810|Baleiro (fabricação)|baleiro (fabricacao)
841810|Bolacheiro|bolacheiro
841810|Laminador de massas alimentícias|laminador de massas alimenticias
841810|Misturador de massas alimentícias|misturador de massas alimenticias
841810|Operador de máquina na fabricação de macarrão.|operador de maquina na fabricacao de macarrao.
841810|Operador de preparo de massas (alimentícias)|operador de preparo de massas (alimenticias)
841810|Preparador de massas alimentícias - na fabricação|preparador de massas alimenticias - na fabricacao
842105|Manipulador de essência e melado (fumo)|manipulador de essencia e melado (fumo)
842105|Melaceador (cultura do fumo)|melaceador (cultura do fumo)
842105|Misturador de essência (fumo)|misturador de essencia (fumo)
842105|Preparador de essência de fumo|preparador de essencia de fumo
842110|Operador de conjunto de secador de fumo|operador de conjunto de secador de fumo
842110|Operador de debulhador de fumo|operador de debulhador de fumo
842110|Operador de prensa|operador de prensa
842110|Operador de umidificação|operador de umidificacao
842115|Blender de fumo|blender de fumo
842115|Comprador de fumo|comprador de fumo
842120|Auxiliar de produção de fumo|auxiliar de producao de fumo
842125|Operador de máquina de cigarros|operador de maquina de cigarros
842125|Operador de máquina de encarteiramento (cigarros)|operador de maquina de encarteiramento (cigarros)
842125|Operador de máquina de fabricar cigarros|operador de maquina de fabricar cigarros
842125|Operador de máquina de filtros (cigarros)|operador de maquina de filtros (cigarros)
842135|Mecânico-operador (cigarros)|mecanico-operador (cigarros)
842135|Operador de equipamentos (cigarros)|operador de equipamentos (cigarros)
842135|Operador de linha de produção de preparação de matéria prima para produção de cigarros|operador de linha de producao de preparacao de materia prima para producao de cigarros
842135|Operador junior (cigarros)|operador junior (cigarros)
842135|Operador malto (cigarros)|operador malto (cigarros)
842135|Operador mecânico (cigarros)|operador mecanico (cigarros)
842230|Capeador de charutos|capeador de charutos
842230|Enrolador de charutos|enrolador de charutos
848105|Charqueador|charqueador
848105|Defumador de pescados|defumador de pescados
848110|Manteador na conservação de alimentos|manteador na conservacao de alimentos
848110|Salgador - em charqueada|salgador - em charqueada
848110|Salgador de pescados|salgador de pescados
848110|Salgador de tripas|salgador de tripas
848110|Salmorador na conservação de alimentos|salmorador na conservacao de alimentos
848110|Toucinheiro na conservação de alimentos|toucinheiro na conservacao de alimentos
848115|Auxiliar de salsicheiro|auxiliar de salsicheiro
848115|Cortador de salsichas|cortador de salsichas
848115|Cozedor de salsichas|cozedor de salsichas
848115|Encarregado de frios|encarregado de frios
848115|Enchedor de lingüiças|enchedor de linguicas
848115|Enchedor de salame|enchedor de salame
848115|Fiambreiro na conservação de alimentos|fiambreiro na conservacao de alimentos
848115|Lingüiceiros na conservação de alimentos|linguiceiros na conservacao de alimentos
848115|Salameiro na conservação de alimentos|salameiro na conservacao de alimentos
848115|Salsicheiros na conservação de alimentos|salsicheiros na conservacao de alimentos
848205|Operador de máquina de pasteurizar|operador de maquina de pasteurizar
848210|Ajudante de queijeiro|ajudante de queijeiro
848210|Moldeador de queijo|moldeador de queijo
848210|Operador de queijeira|operador de queijeira
848215|Operador de batedeira na fabricação de laticínio|operador de batedeira na fabricacao de laticinio
848215|Operador de máquina de manteiga|operador de maquina de manteiga
848305|Encarregado de padaria|encarregado de padaria
848305|Masseiro (padeiro)|masseiro (padeiro)
848305|Panificador|panificador
848310|Alfeloeiro|alfeloeiro
848310|Auxiliar de confeitaria|auxiliar de confeitaria
848310|Auxiliar de doceiro|auxiliar de doceiro
848310|Bomboneiro|bomboneiro
848310|Cake designer|cake designer
848310|Carameleiro|carameleiro
848310|Compoteiro|compoteiro
848310|Padeiro confeiteiro|padeiro confeiteiro
848315|Ajudante de pasteleiro|ajudante de pasteleiro
848315|Aprendiz de macarroneiro|aprendiz de macarroneiro
848315|Cilindreiro de preparação de massa alimentícia|cilindreiro de preparacao de massa alimenticia
848315|Macarroneiro|macarroneiro
848315|Masseiro de biscoito, macarrão e pão|masseiro de biscoito, macarrao e pao
848315|Pasteleiro|pasteleiro
848315|Patisseiro|patisseiro
848325|Sorveteiro|sorveteiro
848405|Classificador de café|classificador de cafe
848405|Provador de café|provador de cafe
848405|Selecionador de café|selecionador de cafe
848410|Provador de chá|provador de cha
848415|Provador de cacau|provador de cacau
848420|Classificador de bebida|classificador de bebida
848420|Classificador de licores|classificador de licores
848420|Classificador de vinhos|classificador de vinhos
848420|Degustador de bebidas|degustador de bebidas
848420|Provador de bebidas|provador de bebidas
848420|Provador de licores|provador de licores
848420|Provador de vinhos|provador de vinhos
848505|Abatedor  em matadouro|abatedor  em matadouro
848505|Abatedor de animais|abatedor de animais
848505|Abatedor de aves|abatedor de aves
848505|Abatedor de gado|abatedor de gado
848505|Abatedor de galinha|abatedor de galinha
848505|Abatedor de porco|abatedor de porco
848505|Degolador em matadouro|degolador em matadouro
848505|Encarregado de matadouro|encarregado de matadouro
848505|Esfolador em matadouro|esfolador em matadouro
848505|Frangueiro em matadouro|frangueiro em matadouro
848505|Marchante|marchante
848505|Marreteiro em matadouro|marreteiro em matadouro
848505|Marreteiro (indústria alimentar)|marreteiro (industria alimentar)
848505|Matador (magarefe)|matador (magarefe)
848505|Operador de abate em matadouro|operador de abate em matadouro
848505|Operador de setor de matanças de gado|operador de setor de matancas de gado
848505|Sangrador (magarefe)|sangrador (magarefe)
848505|Talhador em matadouro|talhador em matadouro
848510|Açougueiro retalhista|acougueiro retalhista
848510|Ajudante de açougueiro (comércio)|ajudante de acougueiro (comercio)
848510|Balconista de açougue|balconista de acougue
848510|Cortador de carne em açougue|cortador de carne em acougue
848510|Encarregado de açougue|encarregado de acougue
848510|Picador em açougue|picador em acougue
848510|Supervisor de açougue|supervisor de acougue
848510|Talhador em açougue|talhador em acougue
848515|Açougueiro desossador|acougueiro desossador
848515|Auxiliar de desossador|auxiliar de desossador
848515|Cabeceiro  em matadouro|cabeceiro  em matadouro
848515|Desnucador em matadouro|desnucador em matadouro
848515|Desorelhador em matadouro|desorelhador em matadouro
848515|Desqueixador em matadouro|desqueixador em matadouro
848515|Dessebador em matadouro e açougues|dessebador em matadouro e acougues
848515|Escarnador em matadouro e açougue|escarnador em matadouro e acougue
848515|Fateiro em matadouro|fateiro em matadouro
848515|Operador de máquina de escarnar|operador de maquina de escarnar
848520|Açougueiro classificador (exclusive comércio)|acougueiro classificador (exclusive comercio)
848520|Arrancador em matadouro|arrancador em matadouro
848520|Arreador em matadouro|arreador em matadouro
848520|Auxiliar de magarefe|auxiliar de magarefe
848520|Cangoteiro em matadouro|cangoteiro em matadouro
848520|Classificador de carnes|classificador de carnes
848520|Classificador de carnes em matadouro|classificador de carnes em matadouro
848520|Coxãozeiro em matadouro|coxaozeiro em matadouro
848520|Despansador em matadouro|despansador em matadouro
848520|Lombador em matadouro|lombador em matadouro
848520|Pescoceiro em matadouro|pescoceiro em matadouro
848520|Quarteador em matadouro|quarteador em matadouro
848525|Açougueiro cortador (exclusive comércio)|acougueiro cortador (exclusive comercio)
848525|Auxiliar de classificador de carne|auxiliar de classificador de carne
848525|Carneador em matadouro e açougue|carneador em matadouro e acougue
848525|Cortador de carne em matadouro|cortador de carne em matadouro
848525|Descarnador em matadouro|descarnador em matadouro
848525|Desmanchador  em matadouro|desmanchador  em matadouro
848525|Desmanchador exclusive em matadouro|desmanchador exclusive em matadouro
848525|Desmembrador de mocotó dianteiro|desmembrador de mocoto dianteiro
848525|Divisor de cortes em matadouro|divisor de cortes em matadouro
848525|Estripador (matadouro)|estripador (matadouro)
848525|Eviscerador em matadouro|eviscerador em matadouro
848525|Extrator de miolos em matadouro|extrator de miolos em matadouro
848525|Garreador de mocotó|garreador de mocoto
848525|Limpador de aves|limpador de aves
848525|Limpador de carne|limpador de carne
848525|Limpador de tripas|limpador de tripas
848525|Miudeiro em matadouro|miudeiro em matadouro
848525|Mocotozeiro em matadouro|mocotozeiro em matadouro
848525|Picador de carne em matadouro|picador de carne em matadouro
848525|Quarteiro em matadouro|quarteiro em matadouro
848525|Raspador de tripas em matadouro|raspador de tripas em matadouro
848525|Separador de carnes em matadouro|separador de carnes em matadouro
848525|Serrador de chifres|serrador de chifres
848525|Serrador de mocotó|serrador de mocoto
848525|Serrador de parte dianteira|serrador de parte dianteira
848525|Serrador de parte traseira|serrador de parte traseira
848525|Serrador de peito|serrador de peito
848525|Serrador de ponta-de-agulha|serrador de ponta-de-agulha
848525|Serrador de porcos|serrador de porcos
848525|Servente de limpeza e desossa em açougue|servente de limpeza e desossa em acougue
848525|Talhador de carne|talhador de carne
848525|Trabalhador da extração de tripas e demais vísceras|trabalhador da extracao de tripas e demais visceras
848525|Tripeiro em matadouro|tripeiro em matadouro
848525|Virador em matadouro|virador em matadouro
848605|Fermentador de fumo|fermentador de fumo
848605|Preparador de fumo|preparador de fumo
860105|Chefe de seção de manutenção eletromecânica (utilidades)|chefe de secao de manutencao eletromecanica (utilidades)
860105|Contramestre de manutenção de serviço de esgoto|contramestre de manutencao de servico de esgoto
860105|Contramestre de manutenção (serviço de esgotos sanitários)|contramestre de manutencao (servico de esgotos sanitarios)
860105|Mestre e contramestre de manutenção de serviço de esgoto|mestre e contramestre de manutencao de servico de esgoto
860105|Primeiro oficial de  manutenção eletromecânica (utilidades)|primeiro oficial de  manutencao eletromecanica (utilidades)
860110|Contramestre de produção e distribuição de energia elétrica|contramestre de producao e distribuicao de energia eletrica
860110|Contramestre (distribuição de energia elétrica, gás e água)|contramestre (distribuicao de energia eletrica, gas e agua)
860110|Supervisor técnico de aplicação e distribuição de gás|supervisor tecnico de aplicacao e distribuicao de gas
860110|Supervisor técnico de operação de água e esgoto|supervisor tecnico de operacao de agua e esgoto
860115|Contramestre de abastecimento, captação e distribuição de água|contramestre de abastecimento, captacao e distribuicao de agua
860115|Contramestre (produção de energia elétrica, gás e captação de água)|contramestre (producao de energia eletrica, gas e captacao de agua)
860115|Fiscal técnico na geração, transmissão e distribuição de energia elétrica|fiscal tecnico na geracao, transmissao e distribuicao de energia eletrica
860115|Mestre e contramestre de produção e distribuição de água|mestre e contramestre de producao e distribuicao de agua
860115|Primeiro oficial de manutenção na geração, transmissão e distribuição de energia elétrica|primeiro oficial de manutencao na geracao, transmissao e distribuicao de energia eletrica
860115|Supervisor de área de operação elétrica|supervisor de area de operacao eletrica
860115|Supervisor de manutenção na geração ,transmissão e distribuição de energia elétrica|supervisor de manutencao na geracao ,transmissao e distribuicao de energia eletrica
860115|Supervisor técnico de manutenção elétrica (distribuição de energia)|supervisor tecnico de manutencao eletrica (distribuicao de energia)
860115|Supervisor técnico de operação de sistema de geração, transmissão e distribuição de energia elétrica|supervisor tecnico de operacao de sistema de geracao, transmissao e distribuicao de energia eletrica
861105|Operador de hidrelétrica e subestações|operador de hidreletrica e subestacoes
861105|Operador de instalação de produção de energia elétrica|operador de instalacao de producao de energia eletrica
861105|Operador de turbinas de central elétrica|operador de turbinas de central eletrica
861105|Operador de usina elétrica|operador de usina eletrica
861105|Operador de usina hidrelétrica|operador de usina hidreletrica
861110|Operador de quadro de alimentação (subestação de distribuição de energia elétrica)|operador de quadro de alimentacao (subestacao de distribuicao de energia eletrica)
861115|Maquinista de usina termoelétrica|maquinista de usina termoeletrica
861115|Operador de usina térmica|operador de usina termica
861115|Operador de usina termogás|operador de usina termogas
861120|Operador de central termonuclear|operador de central termonuclear
861120|Operador de usina termonuclear|operador de usina termonuclear
861205|Operador de eclusa|operador de eclusa
861205|Operador de usina hidroelétrica|operador de usina hidroeletrica
861205|Operador de usina nuclear|operador de usina nuclear
861205|Operador de usina termoelétrica|operador de usina termoeletrica
862105|Carvoeiro - no transporte ferroviário|carvoeiro - no transporte ferroviario
862105|Foguista de caldeira de trem|foguista de caldeira de trem
862105|Foguista de locomotiva|foguista de locomotiva
862105|Foguista de trem|foguista de trem
862105|Maquinista foguista|maquinista foguista
862110|Chefe de máquina - no transporte marítimo|chefe de maquina - no transporte maritimo
862110|Controlador de motores - no transporte marítimo|controlador de motores - no transporte maritimo
862110|Operador de sala de máquinas (embarcações)|operador de sala de maquinas (embarcacoes)
862115|Operador de gaseificação de carvão|operador de gaseificacao de carvao
862120|Abastecedor de caldeira|abastecedor de caldeira
862120|Caldeirista|caldeirista
862120|Controlador de caldeira|controlador de caldeira
862120|Operador de caldeira a vapor|operador de caldeira a vapor
862130|Compressorista de ar|compressorista de ar
862130|Operador de equipamento de compressor de ar|operador de equipamento de compressor de ar
862130|Operador de máquina de compressão de ar|operador de maquina de compressao de ar
862130|Operador de sistema de ar comprimido|operador de sistema de ar comprimido
862140|Operador de bombas (estação de bombeamento)|operador de bombas (estacao de bombeamento)
862140|Operador de casa de bomba|operador de casa de bomba
862140|Operador de oleoduto|operador de oleoduto
862150|Manipulador de máquinas fixas|manipulador de maquinas fixas
862150|Maquinista de máquina fixa|maquinista de maquina fixa
862150|Operador de casa de máquinas - exceto embarcações|operador de casa de maquinas - exceto embarcacoes
862160|Abastecedor de combustível de aeronave|abastecedor de combustivel de aeronave
862160|Técnico de abastecimento de combustível de aeronave|tecnico de abastecimento de combustivel de aeronave
862205|Agente técnico de operação na captação, tratamento e distribuição de água|agente tecnico de operacao na captacao, tratamento e distribuicao de agua
862205|Operador de hidrogenação e cloroficação da água|operador de hidrogenacao e cloroficacao da agua
862205|Operador de instalação de tratamento de água|operador de instalacao de tratamento de agua
862205|Operador de sistemas de água|operador de sistemas de agua
862205|Operadores de tratamento e bombeamento de água|operadores de tratamento e bombeamento de agua
862305|Operador de bombas no tratamento de água e efluentes|operador de bombas no tratamento de agua e efluentes
862305|Operador de estação de tratamento de água|operador de estacao de tratamento de agua
862305|Operador de estação de tratamento de esgoto|operador de estacao de tratamento de esgoto
862305|Operador de estação de tratamento de esgotos e resíduos industriais|operador de estacao de tratamento de esgotos e residuos industriais
862305|Operador de estação de tratamento de resíduos industriais|operador de estacao de tratamento de residuos industriais
862305|Operador de estação elevatória|operador de estacao elevatoria
862305|Operador de tratamento de água e esgoto|operador de tratamento de agua e esgoto
862305|Operador de tratamento de esgoto|operador de tratamento de esgoto
862305|Operador de utilidades no tratamento de água e efluentes|operador de utilidades no tratamento de agua e efluentes
862310|Operador de coprocessamento de resíduos|operador de coprocessamento de residuos
862310|Operador de incinerador|operador de incinerador
862310|Operador de instalação de incineração de resíduos|operador de instalacao de incineracao de residuos
862405|Ajudante de operador de gás|ajudante de operador de gas
862405|Operador de gás|operador de gas
862405|Operador de glp|operador de glp
862405|Operador de instalação de transferência de gases|operador de instalacao de transferencia de gases
862405|Operador de sistema de gás|operador de sistema de gas
862405|Operador mantenedor de compressores de gases|operador mantenedor de compressores de gases
862405|Operador mecânico de gás|operador mecanico de gas
862505|Operador de central de refrigeração|operador de central de refrigeracao
862505|Operador de compressor de refrigeração|operador de compressor de refrigeracao
862505|Operador de máquina de fabricar gelo|operador de maquina de fabricar gelo
862505|Operador de sistema de refrigeração|operador de sistema de refrigeracao
862515|Operador de sistema de climatização|operador de sistema de climatizacao
910105|Chefe de manutenção mecânica de sistemas operacionais|chefe de manutencao mecanica de sistemas operacionais
910105|Coordenador de manutenção mecânica de sistemas operacionais|coordenador de manutencao mecanica de sistemas operacionais
910105|Encarregado de turma de manutenção mecânica de sistemas operacionais|encarregado de turma de manutencao mecanica de sistemas operacionais
910105|Mestre de manutenção de máquinas de sistemas operacionais|mestre de manutencao de maquinas de sistemas operacionais
910105|Mestre de manutenção industrial de máquinas|mestre de manutencao industrial de maquinas
910105|Mestre de manutenção mecânica de sistemas operacionais|mestre de manutencao mecanica de sistemas operacionais
910105|Supervisor de manutenção mecânica de sistemas operacionais|supervisor de manutencao mecanica de sistemas operacionais
910105|Supervisores de manutenção de máquinas e equipamentos comerciais e residenciais|supervisores de manutencao de maquinas e equipamentos comerciais e residenciais
910115|Coordenador de manutenção eletrônica|coordenador de manutencao eletronica
910125|Mestre de manutenção de máquinas de cardas|mestre de manutencao de maquinas de cardas
910125|Mestre de manutenção de máquinas de estampar tecidos|mestre de manutencao de maquinas de estampar tecidos
910125|Mestre de manutenção de máquinas de fiação|mestre de manutencao de maquinas de fiacao
910125|Mestre de manutenção de tecelagem|mestre de manutencao de tecelagem
910125|Mestre mecânico de conicaleira|mestre mecanico de conicaleira
910130|Mestre de manutenção de máquinas operatrizes|mestre de manutencao de maquinas operatrizes
910205|Supervisor de manutenção de veículos de passeio|supervisor de manutencao de veiculos de passeio
910210|Supervisor de manutenção de veículos de carga|supervisor de manutencao de veiculos de carga
910905|Contramestre de conservação de vias permanentes|contramestre de conservacao de vias permanentes
910905|Encarregado de conservação de vias permanentes|encarregado de conservacao de vias permanentes
910905|Líder de conservação de vias permanentes|lider de conservacao de vias permanentes
910910|Encarregado de lubrificação de vias permanentes|encarregado de lubrificacao de vias permanentes
910910|Líder de lubrificação de vias permanentes|lider de lubrificacao de vias permanentes
910910|Supervisor de manutenção em lubrificação de vias permanentes|supervisor de manutencao em lubrificacao de vias permanentes
911105|Mecânico de bomba injetora (exceto de veículos automotores)|mecanico de bomba injetora (exceto de veiculos automotores)
911105|Mecânico de bombas diesel (exceto de veículos automotores)|mecanico de bombas diesel (exceto de veiculos automotores)
911110|Mecânico de bombas hidráulicas|mecanico de bombas hidraulicas
911110|Mecânico de manutenção de bombas centrífugas|mecanico de manutencao de bombas centrifugas
911110|Mecânico de manutenção de bombas hidráulicas|mecanico de manutencao de bombas hidraulicas
911110|Mecânico reparador de bombas hidráulicas|mecanico reparador de bombas hidraulicas
911120|Afinador de motores diesel  (exceto de veículos automotores)|afinador de motores diesel  (exceto de veiculos automotores)
911120|Auxiliar de mecânico diesel (exceto de veículos automotores)|auxiliar de mecanico diesel (exceto de veiculos automotores)
911120|Inspetor de manutenção de motores diesel (exceto de veículos automotores)|inspetor de manutencao de motores diesel (exceto de veiculos automotores)
911120|Mecânico de afinação de motores diesel (exceto de veículos automotores)|mecanico de afinacao de motores diesel (exceto de veiculos automotores)
911120|Mecânico de regulagem de motores diesel (exceto de veículos automotores)|mecanico de regulagem de motores diesel (exceto de veiculos automotores)
911120|Mecânico diesel (exceto de veículos automotores)|mecanico diesel (exceto de veiculos automotores)
911125|Mecânico de manutenção de transmissão|mecanico de manutencao de transmissao
911130|Mecânico de turbinas e caldeiras|mecanico de turbinas e caldeiras
911130|Mecânico de turbinas exclusive de avião|mecanico de turbinas exclusive de aviao
911130|Mecânicos de turbinas a vapor e gás|mecanicos de turbinas a vapor e gas
911205|Auxiliar mecânico de ar condicionado|auxiliar mecanico de ar condicionado
911205|Auxiliar mecânico de refrigeração|auxiliar mecanico de refrigeracao
911205|Mecânico de ar-condicionado e refrigeração|mecanico de ar-condicionado e refrigeracao
911205|Mecânico de manutenção de aparelhos de refrigeração|mecanico de manutencao de aparelhos de refrigeracao
911205|Mecânico de manutenção de ar condicionado|mecanico de manutencao de ar condicionado
911205|Mecânico de manutenção de refrigerador|mecanico de manutencao de refrigerador
911205|Mecânico de máquina de ventilação|mecanico de maquina de ventilacao
911205|Meio oficial de mecânico de refrigeração|meio oficial de mecanico de refrigeracao
911205|Meio oficial mecânico de ar condicionado|meio oficial mecanico de ar condicionado
911305|Ajustador de máquinas de embalagem|ajustador de maquinas de embalagem
911305|Aprendiz de mecânica de manutenção|aprendiz de mecanica de manutencao
911305|Líder de manutenção mecânica|lider de manutencao mecanica
911305|Mecânico de caldeiras|mecanico de caldeiras
911305|Mecânico de equipamento pneumático|mecanico de equipamento pneumatico
911305|Mecânico de equipamentos industriais|mecanico de equipamentos industriais
911305|Mecânico de fundição (manutenção)|mecanico de fundicao (manutencao)
911305|Mecânico de gerador|mecanico de gerador
911305|Mecânico de instalações industriais (manutenção)|mecanico de instalacoes industriais (manutencao)
911305|Mecânico de laminação (manutenção)|mecanico de laminacao (manutencao)
911305|Mecânico de manutenção de bombas de refrigeração e hidráulicas|mecanico de manutencao de bombas de refrigeracao e hidraulicas
911305|Mecânico de manutenção de equipamentos hidropneumáticos|mecanico de manutencao de equipamentos hidropneumaticos
911305|Mecânico de manutenção de máquina de calçado|mecanico de manutencao de maquina de calcado
911305|Mecânico de manutenção de máquina de curtume|mecanico de manutencao de maquina de curtume
911305|Mecânico de manutenção de máquina de embalagem|mecanico de manutencao de maquina de embalagem
911305|Mecânico de manutenção de máquina de rotular|mecanico de manutencao de maquina de rotular
911305|Mecânico de manutenção de máquina industrial|mecanico de manutencao de maquina industrial
911305|Mecânico de manutenção de máquinas de acondicionar|mecanico de manutencao de maquinas de acondicionar
911305|Mecânico de manutenção de máquinas de embalagem|mecanico de manutencao de maquinas de embalagem
911305|Mecânico de manutenção de máquinas industriais|mecanico de manutencao de maquinas industriais
911305|Mecânico de manutenção e instalação elétrica|mecanico de manutencao e instalacao eletrica
911305|Mecânico de manutenção hidráulica|mecanico de manutencao hidraulica
911305|Mecânico de manutenção (máquinas hidráulicas)|mecanico de manutencao (maquinas hidraulicas)
911305|Mecânico de máquinas de pasteurização|mecanico de maquinas de pasteurizacao
911305|Mecânico de máquinas operatrizes (manutenção)|mecanico de maquinas operatrizes (manutencao)
911305|Mecânico reparador de máquinas|mecanico reparador de maquinas
911305|Mestre de manutenção de equipamento de solda|mestre de manutencao de equipamento de solda
911305|Reparador de máquinas|reparador de maquinas
911310|Mecânico de rotativa (indústria gráfica)|mecanico de rotativa (industria grafica)
911320|Mecânico de estamparia (máquinas têxteis)|mecanico de estamparia (maquinas texteis)
911320|Mecânico de malharia (máquinas)|mecanico de malharia (maquinas)
911320|Mecânico de manutenção de bobinadeira (indústria têxtil)|mecanico de manutencao de bobinadeira (industria textil)
911320|Mecânico de manutenção de cardas|mecanico de manutencao de cardas
911320|Mecânico de manutenção de espuladeira|mecanico de manutencao de espuladeira
911320|Mecânico de manutenção de máquinas de costura|mecanico de manutencao de maquinas de costura
911320|Mecânico de manutenção de máquinas maçaroqueiras|mecanico de manutencao de maquinas macaroqueiras
911320|Mecânico de manutenção de teares|mecanico de manutencao de teares
911320|Mecânico de máquinas de fiação|mecanico de maquinas de fiacao
911320|Mecânico de penteadeiras (máquinas têxteis)|mecanico de penteadeiras (maquinas texteis)
911320|Mecânico de urdideira e engomadeira|mecanico de urdideira e engomadeira
911320|Reformador de pentes (máquinas têxteis)|reformador de pentes (maquinas texteis)
911325|Mecânico de manutenção de máquinas de fundição (usinagem de metais)|mecanico de manutencao de maquinas de fundicao (usinagem de metais)
911325|Mecânico de manutenção de máquinas operatrizes|mecanico de manutencao de maquinas operatrizes
911325|Mecânico de prensas|mecanico de prensas
911325|Mecânico de usinagem (manutenção)|mecanico de usinagem (manutencao)
913105|Mecânico de estiva|mecanico de estiva
913105|Mecânico de manutenção de empilhadeiras|mecanico de manutencao de empilhadeiras
913105|Mecânico de manutenção de guindaste|mecanico de manutencao de guindaste
913105|Mecânico de manutenção de pontes-rolantes|mecanico de manutencao de pontes-rolantes
913105|Mecânico de ponte-rolante|mecanico de ponte-rolante
913110|Mecânico de manutenção de britagem|mecanico de manutencao de britagem
913110|Mecânico de máquina para trabalho de minas|mecanico de maquina para trabalho de minas
913110|Mecânico de mineração|mecanico de mineracao
913110|Mecânico de recravadeira|mecanico de recravadeira
913115|Mecânico de campo|mecanico de campo
913115|Mecânico de manutenção de implementos agrícolas|mecanico de manutencao de implementos agricolas
913115|Mecânico de máquina agrícola|mecanico de maquina agricola
913115|Mecânico de motores agrícolas|mecanico de motores agricolas
913120|Mecânico de equipamento pesado|mecanico de equipamento pesado
913120|Mecânico de escavadeira|mecanico de escavadeira
913120|Mecânico de manutenção de máquinas de construção civil|mecanico de manutencao de maquinas de construcao civil
913120|Mecânico de máquinas pesadas (manutenção)|mecanico de maquinas pesadas (manutencao)
913120|Mecânico de perfuratrizes|mecanico de perfuratrizes
914105|Ajudante, auxiliar de mecânico de avião|ajudante, auxiliar de mecanico de aviao
914105|Ajudante de manutenção de aeronave|ajudante de manutencao de aeronave
914105|Mecânico de aeronaves|mecanico de aeronaves
914105|Mecânico de manutenção de aviões|mecanico de manutencao de avioes
914105|Mecânico de manutenção de helicópteros|mecanico de manutencao de helicopteros
914105|Mecânico encarregado de manutenção de aeronave|mecanico encarregado de manutencao de aeronave
914105|Técnico em manutenção de aeronaves|tecnico em manutencao de aeronaves
914110|Técnico em manutenção de sistema hidráulico de aeronaves|tecnico em manutencao de sistema hidraulico de aeronaves
914205|Mecânico de manutenção mariner|mecanico de manutencao mariner
914205|Mecânico naval|mecanico naval
914305|Agente de manutenção de veículos ferroviários|agente de manutencao de veiculos ferroviarios
914305|Artífice de manutenção|artifice de manutencao
914305|Mecânico de locomotivas e vagões|mecanico de locomotivas e vagoes
914305|Mecânico de manutenção de locomotiva|mecanico de manutencao de locomotiva
914305|Mecânico ferroviário|mecanico ferroviario
914305|Mecânico reparador de vagões|mecanico reparador de vagoes
914305|Operador de produção metroferroviária|operador de producao metroferroviaria
914305|Truqueiro (ferrovias)|truqueiro (ferrovias)
914405|Afinador de motores de automóveis|afinador de motores de automoveis
914405|Alinhador de direção|alinhador de direcao
914405|Alinhador de rodas|alinhador de rodas
914405|Auxiliar de mecânico de autos|auxiliar de mecanico de autos
914405|Encarregado de montagem de caixa diferencial|encarregado de montagem de caixa diferencial
914405|Mecânico de amortecedores|mecanico de amortecedores
914405|Mecânico de auto em geral|mecanico de auto em geral
914405|Mecânico de automóvel|mecanico de automovel
914405|Mecânico de câmbio|mecanico de cambio
914405|Mecânico de chassis|mecanico de chassis
914405|Mecânico de direção e freios de automóveis|mecanico de direcao e freios de automoveis
914405|Mecânico de freios de automóveis|mecanico de freios de automoveis
914405|Mecânico de injeção eletrônica|mecanico de injecao eletronica
914405|Mecânico de instalação de freios|mecanico de instalacao de freios
914405|Mecânico de manutenção de automóveis|mecanico de manutencao de automoveis
914405|Mecânico de manutenção de motores a álcool|mecanico de manutencao de motores a alcool
914405|Mecânico de motor a gasolina|mecanico de motor a gasolina
914405|Mecânico de motor de explosão|mecanico de motor de explosao
914405|Mecânico de radiadores|mecanico de radiadores
914405|Mecânico de socorro|mecanico de socorro
914405|Mecânico de suspensão|mecanico de suspensao
914405|Mecânico de testes de automotores|mecanico de testes de automotores
914405|Mecânico de veículos|mecanico de veiculos
914405|Mecânicos de veículos automotores|mecanicos de veiculos automotores
914405|Oficial mecânico de veículos|oficial mecanico de veiculos
914405|Reparador de veículos automotores|reparador de veiculos automotores
914405|Retificador de motores a álcool|retificador de motores a alcool
914405|Retificador de motores a diesel|retificador de motores a diesel
914405|Retificador de motores a gasolina|retificador de motores a gasolina
914405|Retificador de motores de automóveis|retificador de motores de automoveis
914405|Retificador de motores de carros|retificador de motores de carros
914405|Retificador de motores de explosão|retificador de motores de explosao
914405|Retificador de motores de veículos|retificador de motores de veiculos
914410|Mecânico de empilhadeira|mecanico de empilhadeira
914410|Mecânico de manutenção de máquinas agrícolas (tratores)|mecanico de manutencao de maquinas agricolas (tratores)
914410|Reparador de empilhadeiras|reparador de empilhadeiras
914415|Mecânico de motocicletas|mecanico de motocicletas
914415|Mecânico de motonetas|mecanico de motonetas
914420|Reparador de tratores|reparador de tratores
914425|Afinador de motores a diesel|afinador de motores a diesel
914425|Mecânico de automóveis e caminhões|mecanico de automoveis e caminhoes
914425|Mecânico de diesel e eletricidade|mecanico de diesel e eletricidade
914425|Mecânico de manutenção de caminhão a diesel|mecanico de manutencao de caminhao a diesel
914425|Mecânico de manutenção de ônibus|mecanico de manutencao de onibus
914425|Mecânico de motor a diesel|mecanico de motor a diesel
914425|Mecânico eletricista de diesel (veículos automotores)|mecanico eletricista de diesel (veiculos automotores)
915105|Instrumentista de laboratório (manutenção)|instrumentista de laboratorio (manutencao)
915105|Técnico instrumentista (manutenção de instrumentos de medição e precisão)|tecnico instrumentista (manutencao de instrumentos de medicao e precisao)
915210|Afinador de piano|afinador de piano
915210|Técnico em instrumentos de sopro|tecnico em instrumentos de sopro
915210|Técnico em teclado musical|tecnico em teclado musical
915405|Auxiliar técnico na reparação de equipamentos fotográficos|auxiliar tecnico na reparacao de equipamentos fotograficos
915405|Mecânico de máquinas fotográficas|mecanico de maquinas fotograficas
915405|Técnico em reparação de equipamentos fotográficos|tecnico em reparacao de equipamentos fotograficos
915405|Técnico em reparação de máquinas fotográficas|tecnico em reparacao de maquinas fotograficas
919105|Ajudante de lubrificação (indústria)|ajudante de lubrificacao (industria)
919105|Engraxador de máquinas|engraxador de maquinas
919105|Lubrificador auxiliar mecânico|lubrificador auxiliar mecanico
919105|Lubrificador de máquinas|lubrificador de maquinas
919105|Mecânico lubrificador de manutenção industrial|mecanico lubrificador de manutencao industrial
919105|Mecânico lubrificador industrial|mecanico lubrificador industrial
919110|Auxiliar de lubrificador de veículos|auxiliar de lubrificador de veiculos
919110|Lubrificador de automóveis|lubrificador de automoveis
919110|Lubrificador de máquinas de terraplenagem|lubrificador de maquinas de terraplenagem
919115|Lubrificador naval|lubrificador naval
919115|Mecânico de manutenção (embarcações)|mecanico de manutencao (embarcacoes)
919115|Mecânico lubrificador (embarcações)|mecanico lubrificador (embarcacoes)
919205|Mecânico|mecanico
919205|Mecânico de manutenção de roçadeiras, motosserras e similares|mecanico de manutencao de rocadeiras, motosserras e similares
919205|Mecânico de motosserra|mecanico de motosserra
919205|Técnico de máquinas (a explosão)|tecnico de maquinas (a explosao)
919310|Mecânico de bicicletas|mecanico de bicicletas
919310|Mecânico de manutenção de bicicletas|mecanico de manutencao de bicicletas
919310|Reparador de bicicletas|reparador de bicicletas
950105|Encarregado eletricista de instalações|encarregado eletricista de instalacoes
950105|Mestre de manutenção elétrica (alta tensão)|mestre de manutencao eletrica (alta tensao)
950105|Mestre de manutenção elétrica e equipamentos|mestre de manutencao eletrica e equipamentos
950105|Mestre eletricista de manutenção|mestre eletricista de manutencao
950110|Chefe de manutenção eletromecânica|chefe de manutencao eletromecanica
950110|Coordenador técnico de eletromecânica|coordenador tecnico de eletromecanica
950110|Encarregado de turmas de eletromecânicos|encarregado de turmas de eletromecanicos
950110|Encarregado de turno de manutenção eletromecânica|encarregado de turno de manutencao eletromecanica
950110|Encarregado eletromecânico de instalações|encarregado eletromecanico de instalacoes
950110|Mestre de manutenção eletromecânica|mestre de manutencao eletromecanica
950110|Mestre de manutenção eletromecânica de equipamentos|mestre de manutencao eletromecanica de equipamentos
950205|Chefe de manutenção eletroeletrônica veicular|chefe de manutencao eletroeletronica veicular
950205|Líder produtivo de manutenção eletroeletrônica veicular|lider produtivo de manutencao eletroeletronica veicular
950305|Supervisor de manutenção industrial|supervisor de manutencao industrial
951105|Eletricista|eletricista
951105|Eletricista de manutenção em geral|eletricista de manutencao em geral
951105|Eletricista de manutenção industrial|eletricista de manutencao industrial
951305|Instalador de alarme|instalador de alarme
951305|Instalador de alarmes residenciais|instalador de alarmes residenciais
951305|Montador de sistemas eletroeletrônicos de segurança|montador de sistemas eletroeletronicos de seguranca
951310|Rastreador de satélite|rastreador de satelite
951315|Monitor interno de alarmes|monitor interno de alarmes
951320|Agente de vistoria de alarmes|agente de vistoria de alarmes
951320|Monitor externo de alarmes|monitor externo de alarmes
951320|Vistoriador de alarmes|vistoriador de alarmes
953105|Especialista em sistema elétrico de aviões|especialista em sistema eletrico de avioes
953105|Instrumentista de aviões|instrumentista de avioes
953105|Mecânico eletricista de aviões|mecanico eletricista de avioes
953110|Eletricista de embarcações|eletricista de embarcacoes
953115|Eletricista de instalações de veículos automotores|eletricista de instalacoes de veiculos automotores
953115|Eletricista de veículos de máquinas operatrizes|eletricista de veiculos de maquinas operatrizes
953115|Mecânico eletricista de automóveis|mecanico eletricista de automoveis
953115|Mecânico eletricista de veículos automotores|mecanico eletricista de veiculos automotores
954120|Mecânico de manutenção (equipamento de edifícios)|mecanico de manutencao (equipamento de edificios)
954125|Mecânico de manutenção e eletricista|mecanico de manutencao e eletricista
954125|Operador de equipamentos elétricos|operador de equipamentos eletricos
954125|Operador de manutenção eletromecânica|operador de manutencao eletromecanica
954205|Mecânico de aparelhos domésticos|mecanico de aparelhos domesticos
954205|Mecânico de fogão|mecanico de fogao
954205|Mecânico de lavadora e secadora|mecanico de lavadora e secadora
954205|Mecânico de refrigeração doméstica|mecanico de refrigeracao domestica
954210|Antenista|antenista
954210|Consertador de rádio|consertador de radio
954210|Eletrotécnico reparador de aparelhos de som|eletrotecnico reparador de aparelhos de som
954210|Radiotécnico|radiotecnico
954210|Técnico de rádio (reparo)|tecnico de radio (reparo)
954210|Técnico de televisão|tecnico de televisao
954305|Mecânico de máquinas de escrever|mecanico de maquinas de escrever
954305|Mecânico de máquinas de escrever e calcular|mecanico de maquinas de escrever e calcular
954305|Mecanógrafo  (mecânico de máquina de escrever)|mecanografo  (mecanico de maquina de escrever)
954305|Técnico de calculadora eletrônica|tecnico de calculadora eletronica
954305|Técnico de copiadora|tecnico de copiadora
954305|Técnico de impressora (matricial)|tecnico de impressora (matricial)
954305|Técnico de máquina autenticadora|tecnico de maquina autenticadora
954305|Técnico de máquina de escrever elétrica e manual|tecnico de maquina de escrever eletrica e manual
954305|Técnico de máquina de escrever eletrônica|tecnico de maquina de escrever eletronica
954305|Técnico de máquinas eletrônicas|tecnico de maquinas eletronicas
991105|Auxiliar de manutenção de linha férrea|auxiliar de manutencao de linha ferrea
991105|Trabalhador de linha férrea|trabalhador de linha ferrea
991115|Operador de máquinas e veículos especiais na conservação de vias permanentes (trilhos)|operador de maquinas e veiculos especiais na conservacao de vias permanentes (trilhos)
991115|Operador de veículos especiais na conservação de vias permanentes (trilhos)|operador de veiculos especiais na conservacao de vias permanentes (trilhos)
991205|Eletricista de manutenção de parques de diversões|eletricista de manutencao de parques de diversoes
991205|Eletrônico de manutenção de parques de diversões|eletronico de manutencao de parques de diversoes
991205|Mecânico de manutenção de parques de diversões|mecanico de manutencao de parques de diversoes
991305|Chapista de veículos|chapista de veiculos
991305|Funileiro de automóveis (reparação)|funileiro de automoveis (reparacao)
991305|Lanterneiro de automóveis (reparação)|lanterneiro de automoveis (reparacao)
991305|Latoeiro de veículos (reparação)|latoeiro de veiculos (reparacao)
991305|Soldador de veículos|soldador de veiculos
991310|Cabineiro de veículos|cabineiro de veiculos
991310|Capoteiro|capoteiro
991310|Tapeceiro de veículos|tapeceiro de veiculos
992115|Borracheiro auxiliar|borracheiro auxiliar
992115|Consertador de pneus|consertador de pneus
992115|Emendador de câmaras de ar|emendador de camaras de ar
992115|Montador de pneus|montador de pneus
992225|Asfaltador na conservação de vias permanentes (exceto trilhos)|asfaltador na conservacao de vias permanentes (exceto trilhos)
992225|Auxiliar de jardinagem na conservação de vias permanentes|auxiliar de jardinagem na conservacao de vias permanentes
992225|Buerista na conservação de vias permanentes|buerista na conservacao de vias permanentes
992225|Podador de árvores na conservação de vias permanentes|podador de arvores na conservacao de vias permanentes
992225|Servente de pedreiro na conservação de vias permanentes (exceto trilhos)|servente de pedreiro na conservacao de vias permanentes (exceto trilhos)
992225|Servente de serviços gerais na conservação de vias permanentes (exceto trilhos)|servente de servicos gerais na conservacao de vias permanentes (exceto trilhos)
992225|Varredor na conservação de vias permanentes (exceto trilhos)|varredor na conservacao de vias permanentes (exceto trilhos)$cbo$, E'
')) l
on conflict do nothing;

-- ═════ BLOCO 3 — o cargo só aceita CBO que existe na lista oficial ═════
alter table public.rh_cargos drop constraint if exists rh_cargos_cbo_oficial;
alter table public.rh_cargos add constraint rh_cargos_cbo_oficial foreign key (cbo) references public.cbo_ocupacoes(codigo);

-- ═════ CONFERÊNCIA (esperado: 2725 · 7870 · 0) ═════
select (select count(*) from public.cbo_ocupacoes) as ocupacoes,
       (select count(*) from public.cbo_sinonimos) as sinonimos,
       (select count(*) from public.rh_cargos c where not exists (select 1 from public.cbo_ocupacoes o where o.codigo = c.cbo)) as cargos_fora_da_lista;
