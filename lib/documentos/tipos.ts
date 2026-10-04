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
