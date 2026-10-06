// Lista dos manuais por módulo (numerados), nos 3 idiomas. Cada arquivo também gera
// os PDFs "NN - Nome - Idioma.pdf" (scripts/gerar-pdf.cjs). Adicionar aqui ao criar um manual novo.
import { ehTrilingue, type DocumentoAxioma, type DocTrilingue, type IdiomaDoc } from "../tipos"
import m00 from "./00-introducao"
import m01 from "./01-dashboard"
import m02 from "./02-mei-painel"
import m03 from "./03-mei-cockpit"
import m04 from "./04-mei-faturamento"
import m05 from "./05-mei-das"
import m06 from "./06-mei-reforma"
import m07 from "./07-mei-precificacao"
import m08 from "./08-mei-ia-advisor"
import m09 from "./09-mei-imposto-renda"
import m10 from "./10-receitas"
import m11 from "./11-custos-fixos"
import m12 from "./12-custos-variaveis"
import m13 from "./13-fluxo-caixa"
import m14 from "./14-dre"
import m15 from "./15-endividamento"
import m16 from "./16-tesouraria"
import m17 from "./17-contador"
import m18 from "./18-fiscal"
import m19 from "./19-livro-razao"
import m20 from "./20-balancete"
import m21 from "./21-dre-contabil"
import m22 from "./22-metas"
import m23 from "./23-investimentos"
import m24 from "./24-simulacoes"
import m25 from "./25-precificacao"
import m26 from "./26-clientes"
import m27 from "./27-fornecedores"
import m28 from "./28-contas-pagar"
import m29 from "./29-estoque"
import m30 from "./30-contas-receber"
import m31 from "./31-inadimplencia"
import m32 from "./32-centros-custo"
import m33 from "./33-importar-documentos"
import m34 from "./34-relatorios"
import m35 from "./35-open-finance"
import m36 from "./36-ia-financeira"
import m37 from "./37-ia-tributaria"
import m38 from "./38-empresa"
import m39 from "./39-equipe"
import m40 from "./40-planos"
import m41 from "./41-uso-ia"
import m42 from "./42-pdv"
import m43 from "./43-nexus"

// Manual ainda só em português aparece igual nos 3 idiomas até ganhar a tradução.
const tri = (d: DocumentoAxioma | DocTrilingue): DocTrilingue => (ehTrilingue(d) ? d : { pt: d, en: d, es: d })

export type ManualAxioma = { numero: string; nome: string; doc: DocTrilingue }
// Nome no menu: em português vem da lista; nos outros idiomas, do título do manual traduzido.
export const nomeManual = (m: ManualAxioma, lang: IdiomaDoc) =>
  lang === "pt" ? m.nome : m.doc[lang].titulo.replace(/^[^—]*—\s*/, "")

export const MANUAIS: ManualAxioma[] = ([
  { numero: "00", nome: "Prólogo, apresentação e primeiros passos", doc: m00 },
  { numero: "01", nome: "Dashboard", doc: m01 },
  { numero: "02", nome: "MEI — Painel MEI", doc: m02 },
  { numero: "03", nome: "MEI — Cockpit", doc: m03 },
  { numero: "04", nome: "MEI — Faturamento", doc: m04 },
  { numero: "05", nome: "MEI — DAS & Obrigações", doc: m05 },
  { numero: "06", nome: "MEI — Reforma Tributária", doc: m06 },
  { numero: "07", nome: "MEI — Precificação MEI", doc: m07 },
  { numero: "08", nome: "MEI — IA MEI Advisor", doc: m08 },
  { numero: "09", nome: "MEI — Imposto de Renda", doc: m09 },
  { numero: "10", nome: "Financeiro — Receitas", doc: m10 },
  { numero: "11", nome: "Financeiro — Custos Fixos", doc: m11 },
  { numero: "12", nome: "Financeiro — Custos Variáveis", doc: m12 },
  { numero: "13", nome: "Financeiro — Fluxo de Caixa", doc: m13 },
  { numero: "14", nome: "Financeiro — DRE", doc: m14 },
  { numero: "15", nome: "Financeiro — Endividamento", doc: m15 },
  { numero: "16", nome: "Financeiro — Tesouraria", doc: m16 },
  { numero: "17", nome: "Contabilidade — Contador", doc: m17 },
  { numero: "18", nome: "Contabilidade — Fiscal", doc: m18 },
  { numero: "19", nome: "Contabilidade — Livro Razão", doc: m19 },
  { numero: "20", nome: "Contabilidade — Balancete", doc: m20 },
  { numero: "21", nome: "Contabilidade — DRE Contábil", doc: m21 },
  { numero: "22", nome: "Crescimento — Metas", doc: m22 },
  { numero: "23", nome: "Crescimento — Investimentos", doc: m23 },
  { numero: "24", nome: "Crescimento — Simulações", doc: m24 },
  { numero: "25", nome: "Crescimento — Precificação", doc: m25 },
  { numero: "26", nome: "Comercial — Clientes", doc: m26 },
  { numero: "27", nome: "Comercial — Fornecedores", doc: m27 },
  { numero: "28", nome: "Comercial — Contas a Pagar", doc: m28 },
  { numero: "29", nome: "Comercial — Estoque", doc: m29 },
  { numero: "30", nome: "Comercial — Contas a Receber", doc: m30 },
  { numero: "31", nome: "Comercial — Inadimplência", doc: m31 },
  { numero: "32", nome: "Gestão — Centros de Custo", doc: m32 },
  { numero: "33", nome: "Gestão — Importar Documentos", doc: m33 },
  { numero: "34", nome: "Gestão — Relatórios", doc: m34 },
  { numero: "35", nome: "Gestão — Open Finance", doc: m35 },
  { numero: "36", nome: "IA Premium — IA Financeira", doc: m36 },
  { numero: "37", nome: "IA Premium — IA Tributária", doc: m37 },
  { numero: "38", nome: "Configurações — Empresa", doc: m38 },
  { numero: "39", nome: "Configurações — Equipe", doc: m39 },
  { numero: "40", nome: "Configurações — Planos", doc: m40 },
  { numero: "41", nome: "Configurações — Uso da IA", doc: m41 },
  { numero: "42", nome: "PDV — Ponto de Venda", doc: m42 },
  { numero: "43", nome: "Nexus — Inteligência Econômica e o José", doc: m43 },
] as { numero: string; nome: string; doc: DocumentoAxioma | DocTrilingue }[]).map((m) => ({ ...m, doc: tri(m.doc) }))

// Tela → manual (o prefixo mais longo vence). Usado pelo Assistente de Ajuda.
const ROTAS: [string, string][] = [
  ["/manual", "00"], ["/dashboard", "01"], ["/mei", "02"], ["/mei/cockpit", "03"], ["/mei/faturamento", "04"], ["/mei/das", "05"],
  ["/mei/reforma", "06"], ["/mei/precificacao", "07"], ["/mei/ia-advisor", "08"], ["/mei/imposto-renda", "09"], ["/receitas", "10"],
  ["/custos-fixos", "11"], ["/custos-variaveis", "12"], ["/fluxo-caixa", "13"], ["/dre", "14"], ["/endividamento", "15"], ["/tesouraria", "16"],
  ["/contador", "17"], ["/fiscal", "18"], ["/contabilidade/razao", "19"], ["/contabilidade/balancete", "20"], ["/contabilidade/dre", "21"],
  ["/metas", "22"], ["/investimentos", "23"], ["/simulacoes", "24"], ["/precificacao", "25"], ["/clientes", "26"], ["/fornecedores", "27"],
  ["/contas-pagar", "28"], ["/estoque", "29"], ["/contas-receber", "30"], ["/inadimplencia", "31"], ["/centros-custo", "32"],
  ["/importar-documentos", "33"], ["/relatorios", "34"], ["/open-finance", "35"], ["/ia-financeira", "36"], ["/ia-tributaria", "37"],
  ["/empresa", "38"], ["/equipe", "39"], ["/planos", "40"], ["/uso-ia", "41"], ["/pdv", "42"], ["/nexus", "43"],
]
export function manualDaRota(caminho: string): ManualAxioma | null {
  const achado = ROTAS.filter(([r]) => caminho === r || caminho.startsWith(`${r}/`)).sort((a, b) => b[0].length - a[0].length)[0]
  return achado ? MANUAIS.find((m) => m.numero === achado[1]) ?? null : null
}

// Manual em texto corrido (para o Assistente de Ajuda ler).
export function manualEmTexto(doc: DocumentoAxioma): string {
  const linhas = [doc.titulo, ...(doc.info ?? [])]
  for (const b of doc.blocos) {
    if ("h1" in b) linhas.push(`\n# ${b.h1}`)
    else if ("h2" in b) linhas.push(`## ${b.h2}`)
    else if ("h3" in b) linhas.push(`### ${b.h3}`)
    else if ("p" in b) linhas.push(b.p)
    else if ("lista" in b) linhas.push(...b.lista.map((i) => `- ${i}`))
    else if ("numerada" in b) linhas.push(...b.numerada.map((i, n) => `${n + 1}. ${i}`))
    else if ("nota" in b) linhas.push(`Nota: ${b.nota}`)
    else if ("alerta" in b) linhas.push(`Atenção: ${b.alerta}`)
    else if ("tabela" in b) linhas.push(...b.tabela.linhas.map((l) => l.join(" | ")))
  }
  return linhas.join("\n").replace(/\*\*/g, "")
}
