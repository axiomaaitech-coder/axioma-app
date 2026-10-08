'use client'
// Fase 2 da Rastreabilidade, item 2 (Elias 2026-10-08): aviso no topo do Axioma das
// contas a pagar e a receber que vencem nos próximos 7 dias. Some sozinho quando a
// conta é paga/recebida. "Ocultar hoje" esconde até amanhã. Confere a cada 5 min e
// quando qualquer tela avisa que os dados mudaram.
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CalendarClock, ChevronDown, X } from 'lucide-react'
import { createClient } from '../lib/supabase/client'
import { obterEmpresaAtiva } from '../lib/empresaHelpers'
import { hojeISO } from '../lib/datas'
import { useLanguage } from '../lib/LanguageContext'

type Item = { id: string; tipo: 'pagar' | 'receber'; descricao: string; vencimento: string; saldo: number }
const ENCERRADA = ['pago', 'recebido', 'cancelado', 'cancelada']
const INTERVALO_MS = 5 * 60 * 1000

export default function AvisoVencimentos() {
  const caminho = usePathname()
  const { idioma } = useLanguage()
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt)
  const [itens, setItens] = useState<Item[]>([])
  const [aberto, setAberto] = useState(false)
  const [oculto, setOculto] = useState(false)
  const ativo = !caminho?.startsWith('/pdv')
  const hoje = hojeISO()
  const chaveOculto = 'axioma:aviso-vencimentos-oculto'

  async function carregar() {
    try {
      const empresaId = await obterEmpresaAtiva()
      if (!empresaId) return
      const limite = new Date(new Date(`${hoje}T12:00:00Z`).getTime() + 7 * 86400000).toISOString().slice(0, 10)
      const db = createClient()
      const [ap, ar] = await Promise.all([
        db.from('contas_pagar').select('id, descricao, data_vencimento, valor_total, valor_pago, status')
          .eq('empresa_id', empresaId).gte('data_vencimento', hoje).lte('data_vencimento', limite).limit(200),
        db.from('contas_receber').select('id, descricao, data_vencimento, valor, valor_recebido, valor_desconto, status')
          .eq('empresa_id', empresaId).gte('data_vencimento', hoje).lte('data_vencimento', limite).limit(200),
      ])
      const lista: Item[] = [
        ...(ap.data || []).filter((c) => !ENCERRADA.includes(c.status) && c.status !== 'aguardando_aprovacao')
          .map((c) => ({ id: c.id, tipo: 'pagar' as const, descricao: c.descricao || '—', vencimento: c.data_vencimento, saldo: Number(c.valor_total || 0) - Number(c.valor_pago || 0) })),
        ...(ar.data || []).filter((c) => !ENCERRADA.includes(c.status))
          .map((c) => ({ id: c.id, tipo: 'receber' as const, descricao: c.descricao || '—', vencimento: c.data_vencimento, saldo: Number(c.valor || 0) - Number(c.valor_desconto || 0) - Number(c.valor_recebido || 0) })),
      ].filter((i) => i.saldo > 0.005).sort((a, b) => a.vencimento.localeCompare(b.vencimento))
      setItens(lista)
    } catch { /* tenta de novo no próximo ciclo */ } // varredura:ok aviso informativo; as telas de contas mostram o mesmo dado
  }

  useEffect(() => {
    if (!ativo) return
    try { setOculto(localStorage.getItem(chaveOculto) === hoje) } catch { /* sem storage: mostra */ } // varredura:ok
    void carregar()
    const t = setInterval(carregar, INTERVALO_MS)
    const mudou = () => { void carregar() }
    window.addEventListener('axioma:dados-atualizados', mudou)
    return () => { clearInterval(t); window.removeEventListener('axioma:dados-atualizados', mudou) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, hoje])

  if (!ativo || oculto || itens.length === 0) return null
  const brl = (v: number) => v.toLocaleString(idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-ES' : 'pt-BR', { style: 'currency', currency: 'BRL' })
  const total = (tipo: Item['tipo']) => itens.filter((i) => i.tipo === tipo).reduce((s, i) => s + i.saldo, 0)
  const dias = (venc: string) => Math.round((new Date(`${venc}T12:00:00Z`).getTime() - new Date(`${hoje}T12:00:00Z`).getTime()) / 86400000)
  const quando = (venc: string) => {
    const d = dias(venc)
    return d === 0 ? L('vence hoje', 'due today', 'vence hoy') : d === 1 ? L('vence amanhã', 'due tomorrow', 'vence mañana') : L(`vence em ${d} dias`, `due in ${d} days`, `vence en ${d} días`)
  }
  const aPagar = total('pagar'), aReceber = total('receber')

  return (
    <div className="px-4 pt-3">
      <div className="max-w-7xl mx-auto rounded-xl axi-card-premium3d axi-card-faixa" style={{ background: '#101b3d', border: '1px solid rgba(46,204,155,0.45)', color: '#ffffff' }}>
        <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
          <CalendarClock size={18} style={{ color: '#2ecc9b' }} className="flex-shrink-0" />
          <button onClick={() => setAberto((v) => !v)} className="flex-1 min-w-0 text-left text-sm" aria-expanded={aberto}>
            <strong>{L(`${itens.length} conta${itens.length > 1 ? 's' : ''} vence${itens.length > 1 ? 'm' : ''} nos próximos 7 dias`, `${itens.length} bill${itens.length > 1 ? 's' : ''} due in the next 7 days`, `${itens.length} cuenta${itens.length > 1 ? 's' : ''} vence${itens.length > 1 ? 'n' : ''} en los próximos 7 días`)}</strong>
            <span className="opacity-85">
              {aPagar > 0 && ` • ${L('a pagar', 'to pay', 'a pagar')} ${brl(aPagar)}`}
              {aReceber > 0 && ` • ${L('a receber', 'to receive', 'a cobrar')} ${brl(aReceber)}`}
            </span>
            <ChevronDown size={14} className="inline ml-2" style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>
          <button onClick={() => { setOculto(true); try { localStorage.setItem(chaveOculto, hoje) } catch { /* só nesta tela */ } }} // varredura:ok
            title={L('Ocultar até amanhã', 'Hide until tomorrow', 'Ocultar hasta mañana')} className="text-xs opacity-80 hover:opacity-100 flex items-center gap-1">
            <X size={14} />{L('Ocultar hoje', 'Hide today', 'Ocultar hoy')}
          </button>
        </div>
        {aberto && (
          <div className="px-4 pb-3 space-y-1.5">
            {itens.map((i) => (
              <Link key={`${i.tipo}-${i.id}`} href={i.tipo === 'pagar' ? '/contas-pagar' : '/contas-receber'}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs hover:brightness-125" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span className="min-w-0 truncate">
                  <span className="font-bold" style={{ color: i.tipo === 'pagar' ? '#fca5a5' : '#2ecc9b' }}>{i.tipo === 'pagar' ? L('Pagar', 'Pay', 'Pagar') : L('Receber', 'Receive', 'Cobrar')}</span>
                  {' • '}{i.descricao}
                </span>
                <span className="flex-shrink-0 text-right"><strong>{brl(i.saldo)}</strong> • {quando(i.vencimento)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
