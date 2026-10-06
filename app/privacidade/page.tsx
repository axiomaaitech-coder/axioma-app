import DocumentoLegal from '../../components/DocumentoLegal'

export const metadata = { title: 'Política de Privacidade — Axioma AI.Tech' }

// Mesmo conteúdo dos PDFs "Política de Privacidade" (lib/documentos/privacidade.{pt,en,es}.ts).
export default function Privacidade() {
  return <DocumentoLegal qual="privacidade" />
}
