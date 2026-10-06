import DocumentoLegal from '../../components/DocumentoLegal'

export const metadata = { title: 'Termos de Uso — Axioma AI.Tech' }

// Mesmo conteúdo dos PDFs "Termos de Uso" (lib/documentos/termos.{pt,en,es}.ts).
export default function Termos() {
  return <DocumentoLegal qual="termos" />
}
