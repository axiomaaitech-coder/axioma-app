import Link from 'next/link'
import DocumentoWeb from '../../components/DocumentoWeb'
import privacidade from '../../lib/documentos/privacidade.pt'

export const metadata = { title: 'Política de Privacidade — Axioma AI.Tech' }

// Mesmo conteúdo do Word "Axioma - Política de Privacidade" (lib/documentos/privacidade.pt.ts).
export default function Privacidade() {
  return (
    <div style={{ background: '#f7f8fa', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-3 mb-6 text-sm font-semibold">
          <Link href="/dashboard" style={{ color: '#0f7d5c' }}>← Voltar ao Axioma</Link>
          <Link href="/termos" style={{ color: '#101b3d' }}>Termos de Uso</Link>
        </div>
        <DocumentoWeb doc={privacidade} />
      </div>
    </div>
  )
}
