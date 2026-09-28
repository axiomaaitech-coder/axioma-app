// ═══════════════════════════════════════════════════════════════
// MOTOR DE IA — Catálogo de setores (manual especialista por ramo).
// Cobre as 21 seções da CNAE 2.3 (IBGE), com indústria e serviços abertos
// por nicho. O setor sai da divisão do CNAE (2 primeiros dígitos); sem CNAE,
// tenta o campo livre "setor" do cadastro. Arquivo puro (sem import): roda
// no navegador, no servidor e nos scripts de conferência.
//
// "foco" é o manual que a IA recebe: o que mais pesa no caixa e na margem
// daquele negócio, riscos típicos e o que vigiar na economia. Nada de número
// de mercado inventado — só direção e o que medir.
// "series" = indicadores do Nexus que mais mexem com o ramo (selo "Mexe com
// o seu ramo" nos eventos + prioridade no chat e no plano do José).
// ═══════════════════════════════════════════════════════════════

export type Texto3 = { pt: string; en: string; es: string }
export type Setor = { id: string; nome: Texto3; divisoes: [number, number][]; series: string[]; foco: string }

// Códigos do Nexus: 1 dólar · 21619 euro · 432 Selic · 433 IPCA · 24369 desemprego ·
// 24363 IBC-Br · BCE:CNY yuan · IPEA:BRENT petróleo · FMI:* matérias-primas ·
// ANP:* combustíveis · IBGE:* setores · COMEX:* comércio exterior · OCDE:CLI:* ciclo.
export const SETORES: Setor[] = [
  // ── A. Agropecuária ──
  { id: 'agro', nome: { pt: 'Agropecuária', en: 'Agriculture & livestock', es: 'Agropecuaria' }, divisoes: [[1, 1]],
    series: ['FMI:SOJA', 'FMI:MILHO', 'FMI:CAFE', 'ANP:DIESEL', '1', 'COMEX:EXPORT', '432'],
    foco: 'Receita concentrada na safra/abate e preço ditado por commodity em dólar; custo puxado por insumo importado (fertilizante, defensivo), diesel e juros do custeio. Vigiar: fluxo de caixa entre safras, capital de giro do custeio, endividamento rural, câmbio na venda e na compra de insumo, clima e seguro. Métricas: custo por hectare/cabeça, margem por safra, preço de equilíbrio, alavancagem sobre receita anual.' },
  { id: 'florestal', nome: { pt: 'Produção florestal', en: 'Forestry', es: 'Producción forestal' }, divisoes: [[2, 2]],
    series: ['ANP:DIESEL', '1', 'COMEX:EXPORT', 'IBGE:INDUSTRIA'],
    foco: 'Ciclo longo entre plantio e corte (caixa imobilizado por anos), frete pesado e demanda ligada a papel, celulose, construção e moveleiro. Vigiar: capital empatado no ativo biológico, custo de colheita/frete, preço da madeira, licenças ambientais.' },
  { id: 'pesca', nome: { pt: 'Pesca e aquicultura', en: 'Fishing & aquaculture', es: 'Pesca y acuicultura' }, divisoes: [[3, 3]],
    series: ['ANP:DIESEL', 'FMI:MILHO', 'FMI:SOJA', '433'],
    foco: 'Custo dominado por ração (milho/soja) e combustível; produto perecível exige giro rápido e cadeia de frio. Vigiar: custo da ração por kg produzido, perdas, sazonalidade de preço, defeso.' },
  // ── B. Extração ──
  { id: 'mineracao', nome: { pt: 'Mineração', en: 'Mining', es: 'Minería' }, divisoes: [[5, 5], [7, 9]],
    series: ['FMI:MINERIO', '1', 'BCE:CNY', 'OCDE:CLI:CHN', 'ANP:DIESEL', 'COMEX:EXPORT'],
    foco: 'Preço em dólar ditado pela demanda da China; custo alto de energia, diesel e frete; capital intensivo. Vigiar: preço do minério, câmbio, custo por tonelada, royalties (CFEM), licenciamento e passivo ambiental.' },
  { id: 'petroleo_gas', nome: { pt: 'Petróleo e gás', en: 'Oil & gas', es: 'Petróleo y gas' }, divisoes: [[6, 6]],
    series: ['IPEA:BRENT', '1', 'COMEX:EXPORT', '432'],
    foco: 'Receita atrelada ao Brent e ao câmbio; contratos longos e capital intensivo. Vigiar: preço do barril, custo de extração por barril, câmbio, juros sobre dívida de investimento.' },
  // ── C. Indústria de transformação ──
  { id: 'alimentos_bebidas', nome: { pt: 'Indústria de alimentos e bebidas', en: 'Food & beverage manufacturing', es: 'Industria de alimentos y bebidas' }, divisoes: [[10, 12]],
    series: ['FMI:SOJA', 'FMI:MILHO', 'FMI:CAFE', '433', 'IBGE:VAREJO', 'ANP:DIESEL', 'ANP:GLP'],
    foco: 'Matéria-prima agrícola é o maior custo e oscila com commodity; margem apertada, repasse de preço com atraso ao varejo. Vigiar: custo do insumo sobre receita, validade/perdas, giro de estoque, prazo dado às redes varejistas, energia e frete, carga tributária (substituição tributária).' },
  { id: 'textil_vestuario', nome: { pt: 'Têxtil, vestuário, couro e calçados', en: 'Textiles, apparel, leather & footwear', es: 'Textil, confección, cuero y calzado' }, divisoes: [[13, 15]],
    series: ['BCE:CNY', '1', 'IBGE:VAREJO', '433', '24369', 'COMEX:IMPORT'],
    foco: 'Concorrência forte de importado asiático; coleção sazonal gera estoque parado e liquidação. Vigiar: giro e cobertura de estoque, markdown, prazo de recebimento do varejo, custo de mão de obra, câmbio do yuan.' },
  { id: 'madeira_papel_moveis', nome: { pt: 'Madeira, papel, gráfica e móveis', en: 'Wood, paper, printing & furniture', es: 'Madera, papel, gráfica y muebles' }, divisoes: [[16, 18], [31, 31]],
    series: ['IBGE:INDUSTRIA', '432', 'IBGE:VAREJO', '1', 'ANP:DIESEL'],
    foco: 'Demanda de móveis e construção sobe e desce com juros e crédito ao consumidor; celulose segue dólar. Vigiar: sensibilidade à Selic, custo da madeira/chapa, frete, capacidade ociosa.' },
  { id: 'quimica_farma', nome: { pt: 'Química, petroquímica e farmacêutica', en: 'Chemicals & pharmaceuticals', es: 'Química y farmacéutica' }, divisoes: [[19, 21]],
    series: ['IPEA:BRENT', '1', 'COMEX:IMPORT', 'BCE:CNY', 'IBGE:INDUSTRIA'],
    foco: 'Insumo importado ou derivado de petróleo cotado em dólar; regulação pesada (ANVISA) e estoque de matéria-prima caro. Vigiar: câmbio e Brent no custo, prazo de fornecedores externos, capital de giro, margem por linha.' },
  { id: 'plastico_borracha', nome: { pt: 'Plástico e borracha', en: 'Plastics & rubber', es: 'Plástico y caucho' }, divisoes: [[22, 22]],
    series: ['IPEA:BRENT', '1', 'IBGE:INDUSTRIA', '433'],
    foco: 'Resina é derivada de petróleo e cotada em dólar — custo muda rápido e o repasse ao cliente demora. Vigiar: preço da resina sobre receita, contratos com reajuste, energia, sucata/perdas.' },
  { id: 'minerais_nao_metalicos', nome: { pt: 'Cimento, vidro e cerâmica', en: 'Cement, glass & ceramics', es: 'Cemento, vidrio y cerámica' }, divisoes: [[23, 23]],
    series: ['432', 'IBGE:INDUSTRIA', 'ANP:DIESEL', 'ANP:GLP', '433'],
    foco: 'Muito dependente da construção civil (juros e crédito imobiliário) e de energia/gás no forno; frete pesa por ser produto pesado. Vigiar: custo de energia e gás por tonelada, raio de frete, carteira da construção.' },
  { id: 'metalurgia', nome: { pt: 'Metalurgia e siderurgia', en: 'Metallurgy & steel', es: 'Metalurgia y siderurgia' }, divisoes: [[24, 24]],
    series: ['FMI:MINERIO', 'BCE:CNY', '1', 'OCDE:CLI:CHN', 'IBGE:INDUSTRIA', 'COMEX:IMPORT'],
    foco: 'Preço do aço segue minério e o excesso de oferta da China; energia é custo crítico; clientes são indústria, construção e automotivo. Vigiar: spread entre preço de venda e custo do insumo, importação chinesa, energia, estoque de bobina, alavancagem.' },
  { id: 'produtos_metal', nome: { pt: 'Metalmecânica e produtos de metal', en: 'Fabricated metal products', es: 'Metalmecánica y productos de metal' }, divisoes: [[25, 25], [33, 33]],
    series: ['FMI:MINERIO', 'BCE:CNY', '1', 'IBGE:INDUSTRIA', '432'],
    foco: 'Compra aço/chapa (preço volátil) e vende sob encomenda — orçamento sem reajuste corrói margem. Vigiar: custo do aço por pedido, prazo entre orçamento e compra, capacidade ociosa, recebimento de clientes industriais.' },
  { id: 'eletronicos_maquinas', nome: { pt: 'Eletrônicos, máquinas e equipamentos', en: 'Electronics, machinery & equipment', es: 'Electrónica, máquinas y equipos' }, divisoes: [[26, 28]],
    series: ['1', 'BCE:CNY', 'COMEX:IMPORT', '432', 'IBGE:INDUSTRIA'],
    foco: 'Componentes importados (dólar/yuan) e venda de bem de capital que depende de crédito e juros do cliente. Vigiar: câmbio no custo, carteira de pedidos, prazo de entrega, financiamento ao cliente (BNDES/Finame), estoque de componente.' },
  { id: 'automotivo', nome: { pt: 'Automotivo e outros veículos', en: 'Automotive & other vehicles', es: 'Automotriz y otros vehículos' }, divisoes: [[29, 30]],
    series: ['432', '1', 'FMI:MINERIO', 'IBGE:INDUSTRIA', '24369'],
    foco: 'Venda depende de crédito ao consumidor e juros; cadeia de autopeças vive de contrato com montadora (prazo longo, pressão de preço). Vigiar: Selic e crédito, aço e componentes importados, concentração em poucos clientes.' },
  { id: 'industria_diversa', nome: { pt: 'Indústria diversa', en: 'Other manufacturing', es: 'Industria diversa' }, divisoes: [[32, 32]],
    series: ['IBGE:INDUSTRIA', '1', 'BCE:CNY', '433'],
    foco: 'Produção variada (joias, brinquedos, material médico, esportivo). Vigiar: custo de matéria-prima, importado concorrente, estoque e sazonalidade de vendas.' },
  // ── D/E. Energia, água e resíduos ──
  { id: 'energia', nome: { pt: 'Energia elétrica e gás', en: 'Electricity & gas', es: 'Energía eléctrica y gas' }, divisoes: [[35, 35]],
    series: ['IPEA:BRENT', '433', '432'],
    foco: 'Receita regulada ou por contrato longo, reajustada por índice de inflação; capital intensivo e dívida longa. Vigiar: juros sobre a dívida, reajuste contratual versus IPCA, inadimplência de clientes, risco hídrico.' },
  { id: 'saneamento_residuos', nome: { pt: 'Água, esgoto e resíduos', en: 'Water, sewage & waste', es: 'Agua, saneamiento y residuos' }, divisoes: [[36, 39]],
    series: ['433', '432', 'ANP:DIESEL'],
    foco: 'Contratos públicos (prazo de recebimento longo), frota a diesel e mão de obra. Vigiar: recebimento de prefeituras, reajuste contratual, custo de combustível, investimento obrigatório.' },
  // ── F. Construção ──
  { id: 'construcao', nome: { pt: 'Construção civil', en: 'Construction', es: 'Construcción' }, divisoes: [[41, 43]],
    series: ['432', '433', '24363', 'ANP:DIESEL', 'FMI:MINERIO'],
    foco: 'Caixa por medição de obra (descasamento entre gasto e recebimento), custo de material (aço, cimento) e mão de obra; demanda depende de juros e crédito imobiliário. Vigiar: fluxo por obra, INCC/custo do material, adiantamento a fornecedor, retenções, inadimplência de compradores/distratos.' },
  // ── G. Comércio ──
  { id: 'comercio_veiculos', nome: { pt: 'Comércio e oficina de veículos', en: 'Vehicle sales & repair', es: 'Comercio y taller de vehículos' }, divisoes: [[45, 45]],
    series: ['432', '24369', 'IBGE:VAREJO', '1'],
    foco: 'Venda depende de crédito e juros; estoque de veículo é capital caro (plano de floor). Oficina e peças são receita mais estável. Vigiar: dias de estoque, custo financeiro do estoque, margem de peças e serviços.' },
  { id: 'atacado', nome: { pt: 'Comércio atacadista e distribuição', en: 'Wholesale & distribution', es: 'Comercio mayorista y distribución' }, divisoes: [[46, 46]],
    series: ['433', '432', 'ANP:DIESEL', '1', 'IBGE:VAREJO'],
    foco: 'Margem baixa e volume alto: o lucro está no giro e no prazo. Vigiar: ciclo financeiro (prazo médio de estoque + recebimento − pagamento), crédito dado a clientes, frete, substituição tributária, concentração de fornecedores.' },
  { id: 'varejo', nome: { pt: 'Comércio varejista', en: 'Retail', es: 'Comercio minorista' }, divisoes: [[47, 47]],
    series: ['IBGE:VAREJO', '433', '432', '24369', '1', 'BCE:CNY'],
    foco: 'Vende para o consumidor: renda, emprego e crédito ditam a demanda; margem vive de mix e giro. Vigiar: ticket médio, giro e ruptura de estoque, taxa de cartão e antecipação de recebíveis, aluguel sobre receita, sazonalidade (datas comerciais), inadimplência do crediário.' },
  // ── H. Transporte ──
  { id: 'transporte', nome: { pt: 'Transporte e logística', en: 'Transport & logistics', es: 'Transporte y logística' }, divisoes: [[49, 53]],
    series: ['ANP:DIESEL', 'ANP:GASOLINA', 'IPEA:BRENT', 'IBGE:SERVICOS', '24363'],
    foco: 'Diesel é o maior custo variável; frota envelhece e exige renovação financiada. Vigiar: custo por km, repasse de combustível no frete (gatilho contratual), manutenção, ociosidade da frota, prazo de recebimento de embarcadores.' },
  // ── I. Alojamento e alimentação ──
  { id: 'alimentacao', nome: { pt: 'Restaurantes e alimentação', en: 'Restaurants & food service', es: 'Restaurantes y alimentación' }, divisoes: [[56, 56]],
    series: ['433', 'ANP:GLP', '24369', 'IBGE:SERVICOS', 'FMI:SOJA'],
    foco: 'CMV (insumos) e folha são os maiores custos; margem fina e perdas altas. Vigiar: CMV sobre receita, desperdício, taxa de aplicativo de entrega, aluguel, gás, ticket médio e ocupação.' },
  { id: 'hospedagem', nome: { pt: 'Hotelaria e hospedagem', en: 'Hospitality & lodging', es: 'Hotelería y hospedaje' }, divisoes: [[55, 55]],
    series: ['1', '21619', 'IBGE:SERVICOS', '433', '24369'],
    foco: 'Custo fixo alto e receita sazonal: ocupação decide o lucro. Vigiar: taxa de ocupação, diária média, comissão de plataformas, câmbio (turista estrangeiro e brasileiro indo ao exterior), manutenção.' },
  // ── J. Informação e comunicação ──
  { id: 'tecnologia', nome: { pt: 'Tecnologia e software', en: 'Technology & software', es: 'Tecnología y software' }, divisoes: [[62, 63]],
    series: ['1', '432', 'IBGE:SERVICOS', '24369'],
    foco: 'Folha de pessoal qualificado é o maior custo; receita recorrente (assinatura) vale mais que projeto. Vigiar: MRR/ARR, churn, custo de aquisição de cliente, nuvem e licenças em dólar, concentração de clientes, prazo de recebimento de projeto.' },
  { id: 'telecom_midia', nome: { pt: 'Telecom, mídia e editoras', en: 'Telecom, media & publishing', es: 'Telecom, medios y editoriales' }, divisoes: [[58, 61]],
    series: ['1', '432', 'IBGE:SERVICOS', '433'],
    foco: 'Equipamento e conteúdo em dólar, receita em real; publicidade cai rápido em desaceleração. Vigiar: receita por assinante/anunciante, churn, investimento em rede, dívida.' },
  // ── K/L. Financeiro e imobiliário ──
  { id: 'financeiro', nome: { pt: 'Serviços financeiros e seguros', en: 'Financial services & insurance', es: 'Servicios financieros y seguros' }, divisoes: [[64, 66]],
    series: ['432', '433', '24369'],
    foco: 'Resultado depende do spread e da inadimplência; Selic muda o custo de captação. Vigiar: inadimplência da carteira, custo de funding, provisões, regulação (BACEN/SUSEP).' },
  { id: 'imobiliario', nome: { pt: 'Imobiliário', en: 'Real estate', es: 'Inmobiliario' }, divisoes: [[68, 68]],
    series: ['432', '433', '24363'],
    foco: 'Venda depende de crédito imobiliário e juros; aluguel é reajustado por índice. Vigiar: vacância, inadimplência de inquilinos, comissões, estoque de imóveis, Selic.' },
  // ── M. Profissionais, científicas e técnicas ──
  { id: 'servicos_profissionais', nome: { pt: 'Serviços profissionais (contábil, jurídico, consultoria, engenharia)', en: 'Professional services', es: 'Servicios profesionales' }, divisoes: [[69, 72], [74, 74]],
    series: ['IBGE:SERVICOS', '433', '432', '24363'],
    foco: 'Vende hora/projeto: o lucro está na taxa de ocupação da equipe e no preço por hora. Vigiar: horas faturáveis, concentração de clientes, prazo de recebimento, retenções de impostos na fonte, escolha do regime (Anexo III x V do Simples, Fator R).' },
  { id: 'marketing', nome: { pt: 'Publicidade e marketing', en: 'Advertising & marketing', es: 'Publicidad y marketing' }, divisoes: [[73, 73]],
    series: ['IBGE:SERVICOS', '24363', '432'],
    foco: 'Verba de marketing é a primeira que o cliente corta na crise; mídia repassada infla a receita sem margem. Vigiar: receita líquida (sem repasse de mídia), concentração de clientes, fee recorrente x projeto.' },
  { id: 'veterinaria', nome: { pt: 'Veterinária e pet', en: 'Veterinary & pet', es: 'Veterinaria y mascotas' }, divisoes: [[75, 75]],
    series: ['433', '24369', 'IBGE:SERVICOS', '1'],
    foco: 'Mix de serviço (margem alta) e produto (margem baixa, medicamento importado). Vigiar: ticket médio, recorrência (planos/vacinas), estoque de medicamentos, folha técnica.' },
  // ── N. Administrativos ──
  { id: 'servicos_administrativos', nome: { pt: 'Serviços administrativos, limpeza, segurança e RH', en: 'Administrative, cleaning, security & staffing', es: 'Servicios administrativos, limpieza, seguridad y RR. HH.' }, divisoes: [[77, 78], [80, 82]],
    series: ['24369', '433', 'IBGE:SERVICOS', '432'],
    foco: 'Mão de obra é quase todo o custo: dissídio, encargos e rotatividade decidem a margem. Vigiar: custo por posto, reajuste contratual x dissídio, retenções (INSS/ISS) na fonte, prazo de recebimento, contratos públicos.' },
  { id: 'turismo', nome: { pt: 'Turismo e agências de viagem', en: 'Travel & tourism', es: 'Turismo y agencias de viaje' }, divisoes: [[79, 79]],
    series: ['1', '21619', 'IBGE:SERVICOS', '24369'],
    foco: 'Comissão sobre pacotes; câmbio muda a demanda (viagem ao exterior) e o custo; caixa recebe antes e paga fornecedor depois. Vigiar: câmbio, sazonalidade, cancelamentos, dinheiro de cliente em trânsito.' },
  // ── O. Administração pública ──
  { id: 'publico', nome: { pt: 'Administração pública', en: 'Public administration', es: 'Administración pública' }, divisoes: [[84, 84]],
    series: ['433', '432'],
    foco: 'Orçamento público e regras fiscais. Foque em execução orçamentária, restos a pagar e custo de pessoal.' },
  // ── P/Q. Educação e saúde ──
  { id: 'educacao', nome: { pt: 'Educação', en: 'Education', es: 'Educación' }, divisoes: [[85, 85]],
    series: ['433', '24369', 'IBGE:SERVICOS', '432'],
    foco: 'Receita recorrente por mensalidade com sazonalidade de matrícula; folha de professores é o maior custo. Vigiar: evasão, inadimplência de mensalidades, alunos por turma, reajuste anual x inflação, captação.' },
  { id: 'saude', nome: { pt: 'Saúde (clínicas, hospitais, laboratórios)', en: 'Healthcare', es: 'Salud' }, divisoes: [[86, 88]],
    series: ['433', '1', 'IBGE:SERVICOS', '24369'],
    foco: 'Recebe de convênio com prazo longo e glosas; equipamento e insumo importados (dólar). Vigiar: prazo e glosa de convênios, receita particular x convênio, custo por procedimento, ocupação de agenda/leitos, folha médica.' },
  // ── R/S/T/U. Cultura, pessoais e demais ──
  { id: 'cultura_esporte_lazer', nome: { pt: 'Cultura, esporte e lazer', en: 'Arts, sports & recreation', es: 'Cultura, deporte y ocio' }, divisoes: [[90, 93]],
    series: ['24369', '433', 'IBGE:SERVICOS'],
    foco: 'Gasto discricionário: cai rápido quando a renda aperta; receita sazonal e por evento. Vigiar: ocupação/ingressos, recorrência (academias: churn), custo fixo do espaço, patrocínio.' },
  { id: 'servicos_pessoais', nome: { pt: 'Serviços pessoais e reparação (beleza, lavanderia, consertos)', en: 'Personal services & repair', es: 'Servicios personales y reparación' }, divisoes: [[95, 97]],
    series: ['24369', '433', 'IBGE:SERVICOS'],
    foco: 'Negócio de agenda e mão de obra: ocupação das horas decide o lucro. Vigiar: ticket médio, recorrência de clientes, comissão de profissionais, produto consumido por atendimento.' },
  { id: 'terceiro_setor', nome: { pt: 'Associações e terceiro setor', en: 'Associations & non-profits', es: 'Asociaciones y tercer sector' }, divisoes: [[94, 94], [99, 99]],
    series: ['433', '24369'],
    foco: 'Receita de contribuições, doações e projetos, com prestação de contas. Vigiar: dependência de poucas fontes, reserva para meses sem repasse, custo administrativo sobre o total.' },
]

const PALAVRAS_SETOR: [RegExp, string][] = [
  [/agro|agr[ií]col|pecu[aá]r|fazend|lavoura|gado/i, 'agro'], [/minera|miner[aá]/i, 'mineracao'], [/petr[oó]leo|g[aá]s natural/i, 'petroleo_gas'],
  [/metal[uú]rg|sider[uú]rg|a[çc]o\b/i, 'metalurgia'], [/metalmec|usinag|serralh|caldeir/i, 'produtos_metal'], [/aliment[íi]c|latic|frigor|bebida|padaria industrial/i, 'alimentos_bebidas'],
  [/t[eê]xt|confec|vestu|cal[çc]ad|moda/i, 'textil_vestuario'], [/qu[ií]mic|farm/i, 'quimica_farma'], [/pl[aá]stic|borrach/i, 'plastico_borracha'],
  [/ind[uú]stri/i, 'industria_diversa'], [/constru|obra|engenharia civil/i, 'construcao'], [/atacad|distribui/i, 'atacado'],
  [/varej|com[eé]rcio|loja/i, 'varejo'], [/transport|log[ií]stic|frete/i, 'transporte'], [/restaurant|lanchon|bar\b|aliment/i, 'alimentacao'],
  [/hotel|pousad|hosped/i, 'hospedagem'], [/tecnolog|software|\bti\b|sistemas/i, 'tecnologia'], [/sa[uú]de|cl[ií]nic|hospital|m[eé]dic|odonto|laborat/i, 'saude'],
  [/educa|escol|curso|ensino/i, 'educacao'], [/imobili/i, 'imobiliario'], [/contab|advoc|jur[ií]dic|consult/i, 'servicos_profissionais'],
  [/marketing|publicid|ag[eê]ncia de propaganda/i, 'marketing'], [/beleza|sal[aã]o|est[eé]tic|barbear/i, 'servicos_pessoais'], [/servi[çc]o/i, 'servicos_profissionais'],
]

// Divisão do CNAE ("47.11-3-02", "4711302", "47") → setor. Sem CNAE, usa o texto livre do cadastro.
export function setorDaEmpresa(cnae: string | null | undefined, setorLivre?: string | null): Setor | null {
  const div = Number(String(cnae ?? '').replace(/\D/g, '').slice(0, 2))
  if (div) {
    const s = SETORES.find((x) => x.divisoes.some(([de, ate]) => div >= de && div <= ate))
    if (s) return s
  }
  const txt = String(setorLivre ?? '')
  const achado = txt && PALAVRAS_SETOR.find(([re]) => re.test(txt))
  return achado ? SETORES.find((x) => x.id === achado[1]) ?? null : null
}

// Compatível com o uso do Nexus (selo "Mexe com o seu ramo", chat e plano do José).
export function ramoDoCnae(cnae: string | null | undefined): { nome: string; series: string[] } | null {
  const s = setorDaEmpresa(cnae)
  return s ? { nome: s.nome.pt.toLowerCase(), series: s.series } : null
}
