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

export const MANUAIS: { numero: string; nome: string; doc: DocumentoAxioma }[] = [
  { numero: "00", nome: "Introdução e primeiros passos", doc: m00 },
  { numero: "01", nome: "Dashboard", doc: m01 },
  { numero: "02", nome: "MEI — Painel MEI", doc: m02 },
  { numero: "03", nome: "MEI — Cockpit", doc: m03 },
  { numero: "04", nome: "MEI — Faturamento", doc: m04 },
  { numero: "05", nome: "MEI — DAS & Obrigações", doc: m05 },
  { numero: "06", nome: "MEI — Reforma Tributária", doc: m06 },
  { numero: "07", nome: "MEI — Precificação MEI", doc: m07 },
  { numero: "08", nome: "MEI — IA MEI Advisor", doc: m08 },
  { numero: "09", nome: "MEI — Imposto de Renda", doc: m09 },
]
