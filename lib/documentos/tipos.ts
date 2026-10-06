// Documentos do Axioma (Termos, Privacidade e Manual): o mesmo conteúdo gera o
// Word (pasta do Elias) e a página no site. Texto **negrito**; [[CAMPO]] = a preencher.
export type Bloco =
  | { h1: string } | { h2: string } | { h3: string } | { p: string }
  | { lista: string[] } | { numerada: string[] } | { nota: string } | { alerta: string }
  | { tabela: { colunas: string[]; linhas: string[][]; larguras?: number[] } } | { quebra: true }

export type DocumentoAxioma = {
  arquivo: string
  titulo: string
  subtitulo?: string
  info?: string[]
  blocos: Bloco[]
}

export type IdiomaDoc = 'pt' | 'en' | 'es'
export const IDIOMAS_DOC: IdiomaDoc[] = ['pt', 'en', 'es']
export const NOME_IDIOMA_DOC: Record<IdiomaDoc, string> = { pt: 'Português', en: 'English', es: 'Español' }
// Um documento nos 3 idiomas (regra trilíngue do Axioma).
export type DocTrilingue = Record<IdiomaDoc, DocumentoAxioma>
export const ehTrilingue = (d: DocumentoAxioma | DocTrilingue): d is DocTrilingue => 'pt' in d && 'en' in d && 'es' in d
