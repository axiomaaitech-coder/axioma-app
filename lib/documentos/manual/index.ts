// Lista dos manuais por módulo (numerados). Cada arquivo também gera o Word
// "NN - Nome.docx" na pasta do Elias. Adicionar aqui ao criar um manual novo.
import type { DocumentoAxioma } from "../tipos"
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

export const MANUAIS: { numero: string; nome: string; doc: DocumentoAxioma }[] = [
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
]
