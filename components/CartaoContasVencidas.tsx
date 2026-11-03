'use client'
// Ligação entre módulos (Elias 2026-11-02): cartão único que mostra o que está vencido e leva à central de
// Contas Vencidas. Entra pelo ModuloLayout (prop `vencidos`) em Contas a Receber, Contas a Pagar, Inadimplência,
// Tesouraria e Dashboard — uma peça só, sem copiar código em cada tela. Sem nada vencido, não aparece.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useThemeAxioma } from '../lib/ThemeContext'
import { useLanguage } from '../lib/LanguageContext'
import { obterEmpresaAtiva } from '../lib/empresaHelpers'
import { resumoRapidoVencidos, type ResumoRapido } from '../lib/vencidos/resumo'

export type FocoVencidos = 'receber' | 'pagar' | 'ambos' | 'tesouraria'

export default function CartaoContasVencidas({ foco }: { foco: FocoVencidos }) {
  const { idioma } = useLanguage()
  const lang = idioma === 'en' ? 'en' : idioma === 'es' ? 'es' : 'pt'
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const fmt = (v: number) => v.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { style: 'currency', currency: 'BRL' })
  const { tema } = useThemeAxioma()
  const claro = tema === 'xms'
  const [r, setR] = useState<ResumoRapido | null>(null)

  useEffect(() => {
    let vivo = true
    const ler = () => void obterEmpresaAtiva().then(async (id) => { if (id) { const x = await resumoRapidoVencidos(id); if (vivo) setR(x) } })
    ler()
    window.addEventListener('axioma:dados-atualizados', ler)
    return () => { vivo = false; window.removeEventListener('axioma:dados-atualizados', ler) }
  }, [])

  if (!r || r.falhou) return null
  const mostraReceber = foco !== 'pagar', mostraPagar = foco !== 'receber'
  if ((!mostraReceber || !r.receber.qtd) && (!mostraPagar || !r.pagar.qtd)) return null

  const texto = claro ? '#101b3d' : '#e6edf5', cinza = claro ? '#374151' : '#a3b1c2'
  const partes: string[] = []
  if (mostraReceber && r.receber.qtd) partes.push(L(`${fmt(r.receber.total)} a receber vencido (${r.receber.qtd})`, `${fmt(r.receber.total)} overdue receivable (${r.receber.qtd})`, `${fmt(r.receber.total)} por cobrar vencido (${r.receber.qtd})`))
  if (mostraPagar && r.pagar.qtd) partes.push(L(`${fmt(r.pagar.total)} a pagar vencido (${r.pagar.qtd})`, `${fmt(r.pagar.total)} overdue payable (${r.pagar.qtd})`, `${fmt(r.pagar.total)} por pagar vencido (${r.pagar.qtd})`))
  return (
    <div className="mb-4 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 axi-card-premium3d axi-card-faixa"
      style={{ background: claro ? '#f6f7c4' : 'linear-gradient(180deg, rgba(16,32,58,0.92), rgba(10,22,40,0.92))', border: `1px solid ${claro ? 'rgba(16,27,61,0.12)' : 'rgba(46,204,155,0.15)'}` }}>
      <div className="flex items-start gap-2 min-w-0">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: claro ? '#0f7a5a' : '#2ecc9b' }} aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: texto }}>{L('Contas vencidas', 'Overdue bills', 'Cuentas vencidas')}: {partes.join(L(' e ', ' and ', ' y '))}</p>
          {foco === 'tesouraria' && <p className="text-[11px] mt-0.5" style={{ color: cinza }}>{L('Vencido a receber não é caixa disponível; vencido a pagar já pressiona a liquidez.', 'Overdue receivables are not available cash; overdue payables already press liquidity.', 'Lo vencido por cobrar no es caja disponible; lo vencido por pagar ya presiona la liquidez.')}</p>}
        </div>
      </div>
      <Link href="/contas-vencidas" className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)' }}>
        {L('Abrir Contas Vencidas', 'Open Overdue Bills', 'Abrir Cuentas Vencidas')}
      </Link>
    </div>
  )
}
