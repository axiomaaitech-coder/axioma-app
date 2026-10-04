import Link from 'next/link'
import DocumentoWeb from '../../components/DocumentoWeb'
import termos from '../../lib/documentos/termos.pt'

export const metadata = { title: 'Termos de Uso — Axioma AI.Tech' }

// Mesmo conteúdo do Word "Axioma - Termos de Uso" (lib/documentos/termos.pt.ts).
export default function Termos() {
  return (
    <div style={{ background: '#f7f8fa', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-3 mb-6 text-sm font-semibold">
          <Link href="/dashboard" style={{ color: '#0f7d5c' }}>← Voltar ao Axioma</Link>
          <Link href="/privacidade" style={{ color: '#101b3d' }}>Política de Privacidade</Link>
        </div>
        <DocumentoWeb doc={termos} />
      </div>
    </div>
  )
}
