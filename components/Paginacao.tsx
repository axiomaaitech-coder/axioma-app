'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Paginador genérico das listas (P5 2026-10-02): a tela desenha só uma página,
// os totais/gráficos continuam usando a lista inteira.
export const POR_PAGINA = 25

// Volta pra página 1 quando a lista muda de tamanho (filtro/busca) e corta a fatia.
export function usePagina<T>(lista: T[], porPagina = POR_PAGINA) {
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(lista.length)
  if (tamanho !== lista.length) { setTamanho(lista.length); setPagina(0) }
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina))
  const atual = Math.min(pagina, totalPaginas - 1)
  return { pagina: atual, setPagina, fatia: lista.slice(atual * porPagina, (atual + 1) * porPagina), total: lista.length, porPagina }
}

const TXT = {
  pt: { reg: 'registro', regs: 'registros', pag: 'página', de: 'de', ant: 'Página anterior', prox: 'Próxima página' },
  en: { reg: 'record', regs: 'records', pag: 'page', de: 'of', ant: 'Previous page', prox: 'Next page' },
  es: { reg: 'registro', regs: 'registros', pag: 'página', de: 'de', ant: 'Página anterior', prox: 'Página siguiente' },
}

export default function Paginacao({ pagina, total, porPagina = POR_PAGINA, onMudar, lang, temaClaro }: {
  pagina: number; total: number; porPagina?: number; onMudar: (p: number) => void; lang: string; temaClaro?: boolean
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  if (totalPaginas <= 1) return null
  const t = TXT[(lang === 'en' || lang === 'es' ? lang : 'pt') as 'pt']
  const botao = { background: temaClaro ? '#101b3d' : 'rgba(46,204,155,0.12)', color: temaClaro ? '#ffffff' : '#2ecc9b' }
  return (
    <div className="flex items-center justify-between mt-4 text-xs gap-3" style={{ color: temaClaro ? '#6b7280' : '#93a6c2' }}>
      <span>{total} {total === 1 ? t.reg : t.regs} — {t.pag} {pagina + 1} {t.de} {totalPaginas}</span>
      <div className="flex gap-2">
        <button type="button" aria-label={t.ant} onClick={() => onMudar(Math.max(0, pagina - 1))} disabled={pagina === 0}
          className="p-1.5 rounded-lg disabled:opacity-30" style={botao}><ChevronLeft size={16} /></button>
        <button type="button" aria-label={t.prox} onClick={() => onMudar(Math.min(totalPaginas - 1, pagina + 1))} disabled={pagina >= totalPaginas - 1}
          className="p-1.5 rounded-lg disabled:opacity-30" style={botao}><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}
