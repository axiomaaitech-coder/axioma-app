// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Comitê 03, Parte 1: conteúdo de DEMONSTRAÇÃO da TV.
// Ainda não existe ingestão de notícia (nexus_news/nexus_global_event
// estão vazias) — este arquivo é o único lugar com manchete de exemplo,
// SEMPRE marcada como demonstração na tela (nunca dado falso disfarçado
// de real). Quando a ingestão real existir, troca-se só a função
// `obterCanaisNexusDemo`/`obterTickerNexusDemo` por uma leitura do banco
// no mesmo formato — a tela (app/(interno)/nexus/page.tsx) não muda.
// ═══════════════════════════════════════════════════════════════

export type ManchetDemo = { titulo: { pt: string; en: string; es: string } };

export type CanalNexus = {
  id: string;
  label: { pt: string; en: string; es: string };
  manchetes: ManchetDemo[];
};

export const CANAIS_NEXUS_DEMO: CanalNexus[] = [
  {
    id: "economia-br",
    label: { pt: "Economia BR", en: "BR Economy", es: "Economía BR" },
    manchetes: [
      { titulo: { pt: "Copom mantém ritmo de decisões atrelado à inflação de serviços", en: "Copom keeps decision pace tied to services inflation", es: "Copom mantiene el ritmo de decisiones ligado a la inflación de servicios" } },
      { titulo: { pt: "Mercado de trabalho formal segue resiliente no trimestre", en: "Formal labor market remains resilient this quarter", es: "El mercado laboral formal sigue resiliente en el trimestre" } },
      { titulo: { pt: "Arrecadação federal surpreende analistas em meio à reforma", en: "Federal tax collection surprises analysts amid the reform", es: "La recaudación federal sorprende a los analistas en medio de la reforma" } },
    ],
  },
  {
    id: "moedas",
    label: { pt: "Moedas", en: "Currencies", es: "Divisas" },
    manchetes: [
      { titulo: { pt: "Dólar opera de lado à espera de sinalização do Fed", en: "Dollar trades sideways awaiting Fed signal", es: "El dólar opera lateral a la espera de señales de la Fed" } },
      { titulo: { pt: "CDI segue como referência de custo de oportunidade no caixa das empresas", en: "CDI remains the reference for companies' cash opportunity cost", es: "El CDI sigue como referencia de costo de oportunidad en la caja de las empresas" } },
      { titulo: { pt: "Volatilidade cambial cai após semana de dados de emprego nos EUA", en: "FX volatility drops after a week of US jobs data", es: "La volatilidad cambiaria cae tras una semana de datos de empleo en EE. UU." } },
    ],
  },
  {
    id: "mundo",
    label: { pt: "Mundo", en: "World", es: "Mundo" },
    manchetes: [
      { titulo: { pt: "Bancos centrais globais monitoram cadeias de suprimento de energia", en: "Global central banks monitor energy supply chains", es: "Bancos centrales globales monitorean las cadenas de suministro de energía" } },
      { titulo: { pt: "Crescimento chinês pressiona preços de commodities agrícolas", en: "Chinese growth pressures agricultural commodity prices", es: "El crecimiento chino presiona los precios de las materias primas agrícolas" } },
      { titulo: { pt: "Tensões comerciais entre grandes blocos elevam custo logístico global", en: "Trade tensions between major blocs raise global logistics costs", es: "Las tensiones comerciales entre grandes bloques elevan el costo logístico global" } },
    ],
  },
  {
    id: "reforma-tributaria",
    label: { pt: "Reforma Tributária", en: "Tax Reform", es: "Reforma Tributaria" },
    manchetes: [
      { titulo: { pt: "Regulamentação do IBS avança com novo cronograma de transição", en: "IBS regulation advances with a new transition schedule", es: "La reglamentación del IBS avanza con un nuevo cronograma de transición" } },
      { titulo: { pt: "Setores de serviços pedem clareza sobre regras de creditamento da CBS", en: "Service sectors ask for clarity on CBS credit rules", es: "Los sectores de servicios piden claridad sobre las reglas de crédito de la CBS" } },
      { titulo: { pt: "Comitê Gestor do IBS define calendário de testes com estados e municípios", en: "IBS Steering Committee sets testing schedule with states and municipalities", es: "El Comité Gestor del IBS define el calendario de pruebas con estados y municipios" } },
    ],
  },
];

// Letreiro exclusivo da TV — mundo/moedas/Reforma Tributária, sem repetir o
// letreiro padrão do módulo (que já leva os 4 indicadores reais).
export const MANCHETES_TICKER_NEXUS_DEMO: ManchetDemo[] = [
  { titulo: { pt: "Reforma Tributária: regulamentação do IBS avança com novo cronograma", en: "Tax Reform: IBS regulation advances with new schedule", es: "Reforma Tributaria: la reglamentación del IBS avanza con nuevo cronograma" } },
  { titulo: { pt: "Bancos centrais globais monitoram cadeias de suprimento de energia", en: "Global central banks monitor energy supply chains", es: "Bancos centrales globales monitorean las cadenas de suministro de energía" } },
  { titulo: { pt: "Dólar opera de lado à espera de sinalização do Fed", en: "Dollar trades sideways awaiting Fed signal", es: "El dólar opera lateral a la espera de señales de la Fed" } },
  { titulo: { pt: "Crescimento chinês pressiona preços de commodities agrícolas", en: "Chinese growth pressures agricultural commodity prices", es: "El crecimiento chino presiona los precios de las materias primas agrícolas" } },
  { titulo: { pt: "Setores de serviços pedem clareza sobre creditamento da CBS", en: "Service sectors ask for clarity on CBS crediting", es: "Los sectores de servicios piden claridad sobre el crédito de la CBS" } },
];
