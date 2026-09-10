// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Comitê 03, Parte 1 (evolução): conteúdo de DEMONSTRAÇÃO
// da TV. Ainda não existe ingestão de notícia (nexus_news/nexus_global_event
// estão vazias) — este arquivo é o único lugar com manchete de exemplo,
// SEMPRE marcada como demonstração na tela (nunca dado falso disfarçado
// de real). `fonte` fica genérico ("Fonte de demonstração") de propósito:
// a manchete é fictícia, não pode carregar o nome de um veículo real.
// `url_original` aponta pra uma página oficial real e estável (BCB/FMI/gov)
// do tema do canal — não existe artigo de fato por trás da manchete demo.
//
// Quando a ingestão real (nexus_news) existir, troca-se só a função
// `obterNoticiasNexusDemo` por uma leitura do banco no mesmo formato
// {titulo, resumo, imagem_url, fonte, url_original, data, canal} — a tela
// (app/(interno)/nexus/page.tsx) não muda.
// ═══════════════════════════════════════════════════════════════

export type Texto3 = { pt: string; en: string; es: string };

export type CanalNexus = {
  id: string;
  label: Texto3;
};

export type NoticiaNexus = {
  id: string;
  canal: string; // bate com CanalNexus.id
  titulo: Texto3;
  resumo: Texto3;
  imagem_url: string | null; // null = TV mostra thumbnail-placeholder do canal (nunca imagem inventada)
  fonte: Texto3;
  url_original: string;
  data: string; // ISO 8601
};

export const CANAIS_NEXUS_DEMO: CanalNexus[] = [
  { id: 'economia-br', label: { pt: 'Economia BR', en: 'BR Economy', es: 'Economía BR' } },
  { id: 'moedas', label: { pt: 'Moedas', en: 'Currencies', es: 'Divisas' } },
  { id: 'mundo', label: { pt: 'Mundo', en: 'World', es: 'Mundo' } },
  { id: 'reforma-tributaria', label: { pt: 'Reforma Tributária', en: 'Tax Reform', es: 'Reforma Tributaria' } },
]

const FONTE_DEMO: Texto3 = { pt: 'Fonte de demonstração', en: 'Sample source', es: 'Fuente de demostración' }

// Datas relativas a "agora" — mantém o card sempre parecendo recente sem
// precisar editar string de data a cada rodada.
const diasAtras_ = (diasAtras: number) => new Date(Date.now() - diasAtras * 86400000).toISOString()

export const NOTICIAS_NEXUS_DEMO: NoticiaNexus[] = [
  {
    id: 'demo-econ-1',
    canal: 'economia-br',
    titulo: { pt: 'Copom mantém ritmo de decisões atrelado à inflação de serviços', en: 'Copom keeps decision pace tied to services inflation', es: 'Copom mantiene el ritmo de decisiones ligado a la inflación de servicios' },
    resumo: { pt: 'Comitê sinaliza cautela e reforça que próximos passos dependem dos dados de inflação de serviços nas próximas leituras.', en: 'Committee signals caution and reinforces that next steps depend on upcoming services inflation readings.', es: 'El comité señala cautela y refuerza que los próximos pasos dependen de las lecturas de inflación de servicios.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.bcb.gov.br/',
    data: diasAtras_(0),
  },
  {
    id: 'demo-econ-2',
    canal: 'economia-br',
    titulo: { pt: 'Mercado de trabalho formal segue resiliente no trimestre', en: 'Formal labor market remains resilient this quarter', es: 'El mercado laboral formal sigue resiliente en el trimestre' },
    resumo: { pt: 'Novos postos com carteira assinada seguem em alta, mesmo com juros ainda em patamar restritivo.', en: 'Formal job creation keeps rising even with rates still restrictive.', es: 'La creación de empleo formal sigue en alza, incluso con tasas todavía restrictivas.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.bcb.gov.br/',
    data: diasAtras_(1),
  },
  {
    id: 'demo-econ-3',
    canal: 'economia-br',
    titulo: { pt: 'Arrecadação federal surpreende analistas em meio à reforma', en: 'Federal tax collection surprises analysts amid the reform', es: 'La recaudación federal sorprende a los analistas en medio de la reforma' },
    resumo: { pt: 'Receita acima do esperado é atribuída a ajustes de conformidade que antecedem a transição da Reforma Tributária.', en: 'Above-expected revenue is attributed to compliance adjustments ahead of the Tax Reform transition.', es: 'La recaudación superior a lo esperado se atribuye a ajustes de cumplimiento previos a la transición de la reforma.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.gov.br/fazenda/pt-br',
    data: diasAtras_(2),
  },
  {
    id: 'demo-econ-4',
    canal: 'economia-br',
    titulo: { pt: 'Ibovespa fecha em alta puxado por bancos e exportadoras', en: 'Ibovespa closes higher led by banks and exporters', es: 'El Ibovespa cierra al alza impulsado por bancos y exportadoras' },
    resumo: { pt: 'Bolsa brasileira reage bem a dados domésticos, com destaque pra papéis ligados a exportação de commodities.', en: 'Brazilian stocks react well to domestic data, led by commodity-export names.', es: 'La bolsa brasileña reacciona bien a los datos domésticos, con destaque para acciones ligadas a la exportación de materias primas.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.b3.com.br/',
    data: diasAtras_(0),
  },
  {
    id: 'demo-moeda-1',
    canal: 'moedas',
    titulo: { pt: 'Dólar opera de lado à espera de sinalização do Fed', en: 'Dollar trades sideways awaiting Fed signal', es: 'El dólar opera lateral a la espera de señales de la Fed' },
    resumo: { pt: 'Câmbio sem direção definida enquanto o mercado precifica o próximo passo da política monetária americana.', en: 'FX with no clear direction while markets price in the next US monetary policy move.', es: 'El tipo de cambio sin dirección definida mientras el mercado descuenta el próximo paso de la política monetaria de EE. UU.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.bcb.gov.br/estatisticas/mercadocambio',
    data: diasAtras_(0),
  },
  {
    id: 'demo-moeda-2',
    canal: 'moedas',
    titulo: { pt: 'CDI segue como referência de custo de oportunidade no caixa das empresas', en: 'CDI remains the reference for companies\' cash opportunity cost', es: 'El CDI sigue como referencia de costo de oportunidad en la caja de las empresas' },
    resumo: { pt: 'Com juros altos, aplicações atreladas ao CDI continuam competindo com investimento produtivo nas decisões de caixa.', en: 'With high rates, CDI-linked investments keep competing with productive investment in cash decisions.', es: 'Con tasas altas, las inversiones ligadas al CDI siguen compitiendo con la inversión productiva en las decisiones de caja.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.bcb.gov.br/estatisticas/mercadocambio',
    data: diasAtras_(1),
  },
  {
    id: 'demo-moeda-3',
    canal: 'moedas',
    titulo: { pt: 'Volatilidade cambial cai após semana de dados de emprego nos EUA', en: 'FX volatility drops after a week of US jobs data', es: 'La volatilidad cambiaria cae tras una semana de datos de empleo en EE. UU.' },
    resumo: { pt: 'Indicadores de emprego dentro do esperado reduzem incerteza de curto prazo sobre o câmbio.', en: 'In-line jobs data reduces short-term FX uncertainty.', es: 'Datos de empleo en línea con lo esperado reducen la incertidumbre cambiaria de corto plazo.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.bcb.gov.br/estatisticas/mercadocambio',
    data: diasAtras_(3),
  },
  {
    id: 'demo-mundo-1',
    canal: 'mundo',
    titulo: { pt: 'Bancos centrais globais monitoram cadeias de suprimento de energia', en: 'Global central banks monitor energy supply chains', es: 'Bancos centrales globales monitorean las cadenas de suministro de energía' },
    resumo: { pt: 'Autoridades monetárias acompanham de perto o custo de energia como fator de risco pra inflação global.', en: 'Monetary authorities closely track energy costs as a global inflation risk factor.', es: 'Las autoridades monetarias siguen de cerca el costo de la energía como factor de riesgo para la inflación global.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.imf.org/en/News',
    data: diasAtras_(1),
  },
  {
    id: 'demo-mundo-2',
    canal: 'mundo',
    titulo: { pt: 'Crescimento chinês pressiona preços de commodities agrícolas', en: 'Chinese growth pressures agricultural commodity prices', es: 'El crecimiento chino presiona los precios de las materias primas agrícolas' },
    resumo: { pt: 'Demanda chinesa mais forte que o esperado eleva preços de grãos e impacta custos de insumo no Brasil.', en: 'Stronger-than-expected Chinese demand lifts grain prices and affects input costs in Brazil.', es: 'Una demanda china más fuerte de lo esperado eleva los precios de los granos y afecta los costos de insumos en Brasil.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.imf.org/en/News',
    data: diasAtras_(2),
  },
  {
    id: 'demo-mundo-3',
    canal: 'mundo',
    titulo: { pt: 'Tensões comerciais entre grandes blocos elevam custo logístico global', en: 'Trade tensions between major blocs raise global logistics costs', es: 'Las tensiones comerciales entre grandes bloques elevan el costo logístico global' },
    resumo: { pt: 'Novas barreiras tarifárias entre grandes economias encarecem frete e afetam prazos de importação/exportação.', en: 'New tariff barriers between major economies raise freight costs and affect import/export lead times.', es: 'Nuevas barreras arancelarias entre grandes economías encarecen el flete y afectan los plazos de importación/exportación.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.imf.org/en/News',
    data: diasAtras_(4),
  },
  {
    id: 'demo-mundo-4',
    canal: 'mundo',
    titulo: { pt: 'Petróleo sobe com cortes de produção da Opep+ em discussão', en: 'Oil rises as OPEC+ production cuts are discussed', es: 'El petróleo sube ante discusión de recortes de producción de la OPEP+' },
    resumo: { pt: 'Barril reage a rumores de novo corte de oferta, com efeito direto no custo de frete e combustível no Brasil.', en: 'Crude reacts to talk of a new supply cut, with a direct effect on freight and fuel costs in Brazil.', es: 'El crudo reacciona a rumores de un nuevo recorte de oferta, con efecto directo en el costo de flete y combustible en Brasil.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.imf.org/en/News',
    data: diasAtras_(1),
  },
  {
    id: 'demo-reforma-1',
    canal: 'reforma-tributaria',
    titulo: { pt: 'Regulamentação do IBS avança com novo cronograma de transição', en: 'IBS regulation advances with a new transition schedule', es: 'La reglamentación del IBS avanza con un nuevo cronograma de transición' },
    resumo: { pt: 'Comitê Gestor detalha etapas da transição do IBS, com prazos revisados pra adequação das empresas.', en: 'Steering Committee details IBS transition steps, with revised deadlines for company compliance.', es: 'El Comité Gestor detalla las etapas de la transición del IBS, con plazos revisados para la adecuación de las empresas.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria',
    data: diasAtras_(0),
  },
  {
    id: 'demo-reforma-2',
    canal: 'reforma-tributaria',
    titulo: { pt: 'Setores de serviços pedem clareza sobre regras de creditamento da CBS', en: 'Service sectors ask for clarity on CBS credit rules', es: 'Los sectores de servicios piden claridad sobre las reglas de crédito de la CBS' },
    resumo: { pt: 'Entidades de classe cobram regulamentação mais detalhada pra evitar dúvida na apuração de créditos.', en: 'Trade groups push for more detailed rules to avoid uncertainty in credit calculations.', es: 'Las entidades del sector piden una reglamentación más detallada para evitar dudas en el cálculo de créditos.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria',
    data: diasAtras_(2),
  },
  {
    id: 'demo-reforma-3',
    canal: 'reforma-tributaria',
    titulo: { pt: 'Comitê Gestor do IBS define calendário de testes com estados e municípios', en: 'IBS Steering Committee sets testing schedule with states and municipalities', es: 'El Comité Gestor del IBS define el calendario de pruebas con estados y municipios' },
    resumo: { pt: 'Testes-piloto com entes federativos antecedem a entrada em vigor plena do novo sistema.', en: 'Pilot tests with states/municipalities precede the new system\'s full rollout.', es: 'Las pruebas piloto con entes federativos preceden a la entrada en vigor plena del nuevo sistema.' },
    imagem_url: null,
    fonte: FONTE_DEMO,
    url_original: 'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria',
    data: diasAtras_(3),
  },
]

export function obterNoticiasNexusDemo(canalId: string): NoticiaNexus[] {
  return NOTICIAS_NEXUS_DEMO.filter((n) => n.canal === canalId)
}

// Letreiro exclusivo da TV — mundo/moedas/Reforma Tributária, sem repetir o
// letreiro padrão do módulo (que já leva os 4 indicadores reais).
export const MANCHETES_TICKER_NEXUS_DEMO: Texto3[] = [
  { pt: 'Reforma Tributária: regulamentação do IBS avança com novo cronograma', en: 'Tax Reform: IBS regulation advances with new schedule', es: 'Reforma Tributaria: la reglamentación del IBS avanza con nuevo cronograma' },
  { pt: 'Bancos centrais globais monitoram cadeias de suprimento de energia', en: 'Global central banks monitor energy supply chains', es: 'Bancos centrales globales monitorean las cadenas de suministro de energía' },
  { pt: 'Dólar opera de lado à espera de sinalização do Fed', en: 'Dollar trades sideways awaiting Fed signal', es: 'El dólar opera lateral a la espera de señales de la Fed' },
  { pt: 'Crescimento chinês pressiona preços de commodities agrícolas', en: 'Chinese growth pressures agricultural commodity prices', es: 'El crecimiento chino presiona los precios de las materias primas agrícolas' },
  { pt: 'Setores de serviços pedem clareza sobre creditamento da CBS', en: 'Service sectors ask for clarity on CBS crediting', es: 'Los sectores de servicios piden claridad sobre el crédito de la CBS' },
]
