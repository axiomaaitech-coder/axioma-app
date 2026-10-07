// Página pública de cada fonte do Nexus — o endereço que uma PESSOA abre pra conferir
// o dado por conta própria (o endpoint gravado em nexus_source é a API, não serve pra isso).
export const PAGINA_FONTE: Record<string, string> = {
  'BCB SGS': 'https://www3.bcb.gov.br/sgspub/',
  'BCB Copom (histórico de taxas)': 'https://www.bcb.gov.br/controleinflacao/historicotaxasjuros',
  'IBGE Dados Abertos': 'https://sidra.ibge.gov.br/',
  'IPEA Data': 'http://www.ipeadata.gov.br/',
  'Banco Central Europeu': 'https://data.ecb.europa.eu/',
  'Frankfurter (espelho do BCE)': 'https://frankfurter.dev/',
  'FMI': 'https://data.imf.org/',
  'FMI DataMapper': 'https://www.imf.org/external/datamapper/',
  'Banco Mundial': 'https://data.worldbank.org/',
  'Banco Mundial — Pink Sheet': 'https://www.worldbank.org/en/research/commodity-markets',
  'Comex Stat': 'https://comexstat.mdic.gov.br/',
  'ANP': 'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas',
  'OCDE': 'https://data-explorer.oecd.org/',
  'GDELT': 'https://www.gdeltproject.org/',
}

export const paginaDaFonte = (nome: string | null | undefined) => (nome && PAGINA_FONTE[nome]) || null
