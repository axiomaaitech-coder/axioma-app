// Lista dos manuais por módulo (numerados). Cada arquivo também gera o Word
// "NN - Nome.docx" na pasta do Elias. Adicionar aqui ao criar um manual novo.
import type { DocumentoAxioma } from "../tipos"
import m00 from "./00-introducao"
import m01 from "./01-dashboard"

export const MANUAIS: { numero: string; nome: string; doc: DocumentoAxioma }[] = [
  { numero: "00", nome: "Introdução e primeiros passos", doc: m00 },
  { numero: "01", nome: "Dashboard", doc: m01 },
]
