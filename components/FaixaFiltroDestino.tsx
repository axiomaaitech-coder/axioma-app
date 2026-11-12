'use client'
// Faixa no topo da tela de destino: o que está filtrado (vindo do Fechamento do mês), limpar e voltar.
import Link from 'next/link'
import { Filter } from 'lucide-react'

type Props = { texto: string; mes: string | null; de: string | null; onLimpar: () => void; lang: 'pt' | 'en' | 'es'; temaClaro: boolean }

export default function FaixaFiltroDestino({ texto, mes, de, onLimpar, lang, temaClaro }: Props) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  return (
    <div role="status" className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 axi-card-premium3d axi-card-faixa"
      style={{ background: temaClaro ? '#f6f7c4' : 'rgba(10,20,36,0.7)', border: `1px solid ${temaClaro ? 'rgba(15,122,90,0.35)' : 'rgba(46,204,155,0.35)'}` }}>
      <Filter size={16} style={{ color: temaClaro ? '#0f7a5a' : '#2ecc9b', flexShrink: 0 }} />
      <p className="text-sm font-semibold flex-1 min-w-[12rem]" style={{ color: temaClaro ? '#101b3d' : '#e6edf5' }}>
        {L('Filtro', 'Filter', 'Filtro')}: {texto}
      </p>
      <button type="button" onClick={onLimpar} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #0a1628, #101b3d)' }}>
        {L('Limpar filtro', 'Clear filter', 'Quitar filtro')}
      </button>
      {de === 'fechamento' && (
        <Link href={`/contador/fechamento${mes ? `?mes=${mes}` : ''}`} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #0b5f46, #0f7a5a)' }}>
          {L('Voltar ao Fechamento ›', 'Back to Month-end close ›', 'Volver al Cierre ›')}
        </Link>
      )}
    </div>
  )
}
