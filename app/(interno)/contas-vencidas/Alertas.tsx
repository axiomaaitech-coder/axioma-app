'use client'
// Central de alertas (Overdue Intelligence, Fase 2 etapa 12): níveis Normal/Atenção/Alto risco/Crítico, filtros,
// "Marcar como tratado" com o que foi feito e histórico de resolução. Alerta geral (caixa, faixas) some sozinho
// quando a situação muda; alerta de conta tratado sai dos abertos por 7 dias e volta se a situação continuar.
import { useCallback, useEffect, useState } from 'react'
import type { AlertaVencido, NivelAlerta } from '../../../lib/vencidos/motor'
import { NIVEIS_ALERTA } from '../../../lib/vencidos/motor'
import { tratarAlerta, listarAlertasTratados, DIAS_TRATADO, type AlertaTratado } from '../../../lib/vencidos/dados'
import { nomeNivel, textoAlerta, type Lang } from '../../../lib/vencidos/textos'
import { coresSituacao } from '../../../lib/cfoCore'
import { somarDiasISO, hojeISO } from '../../../lib/datas'

type Paleta = { VERDE: string; VERMELHO: string; CINZA: string; TEXTO: string; PAINEL_BG: string; ANINHADA: string; BORDA: string; CAMPO: string }
const BOTAO_ACAO = 'linear-gradient(135deg, #0a4f3b, #0f7d5c)'
const BOTAO_SECUNDARIO = '#101b3d'

export default function CentralAlertas({ alertas, empresaId, lang, P, temaClaro, dataTxt }: { alertas: AlertaVencido[]; empresaId: string; lang: Lang; P: Paleta; temaClaro: boolean; dataTxt: (d: string) => string }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const [nivel, setNivel] = useState<NivelAlerta | 'todos'>('todos')
  const [ver, setVer] = useState<'abertos' | 'tratados'>('abertos')
  const [hist, setHist] = useState<AlertaTratado[] | null>(null)
  const [tratando, setTratando] = useState<string | null>(null)
  const [nota, setNota] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const carregar = useCallback(() => { listarAlertasTratados(empresaId).then(setHist) }, [empresaId])
  useEffect(() => { carregar() }, [carregar])

  const cs = coresSituacao(temaClaro)
  const corNivel: Record<NivelAlerta, string> = { normal: cs.bom, atencao: cs.atencao, alto: cs.critico, critico: cs.critico }
  const desde = somarDiasISO(hojeISO(), -DIAS_TRATADO)
  const tratadoRecente = (chave: string) => (hist ?? []).some((h) => h.chave === chave && h.em.slice(0, 10) > desde)
  const abertos = alertas.filter((a) => !tratadoRecente(a.chave))
  const lista = abertos.filter((a) => nivel === 'todos' || a.severidade === nivel)
  const contagem = (n: NivelAlerta) => abertos.filter((a) => a.severidade === n).length
  const nomeDe = (chave: string) => { const a = alertas.find((x) => x.chave === chave); return a ? textoAlerta(lang, a) : L('Alerta já resolvido', 'Alert already resolved', 'Alerta ya resuelta') }
  const abrir = (a: AlertaVencido) => window.dispatchEvent(new CustomEvent('axioma:abrir-conta', { detail: { id: a.tituloId, dominio: a.dominio } }))
  const pill = (ativo: boolean) => ({ background: ativo ? BOTAO_ACAO : BOTAO_SECUNDARIO, color: '#ffffff' })
  const selo = (n: NivelAlerta) => (
    <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0" style={n === 'alto' ? { border: `1.5px solid ${corNivel[n]}`, color: corNivel[n] } : { background: corNivel[n], color: n === 'atencao' && !temaClaro ? '#101b3d' : '#ffffff' }}>{nomeNivel(lang, n)}</span>
  )

  async function salvar(a: AlertaVencido) {
    setSalvando(true); setErro('')
    const r = await tratarAlerta(empresaId, a, nota)
    setSalvando(false)
    if (!r.ok) return setErro(r.erro === 'escreva o que foi feito' ? L('Escreva o que foi feito.', 'Write what was done.', 'Escriba lo que se hizo.') : L(`Não foi possível salvar: ${r.erro}`, `Could not save: ${r.erro}`, `No fue posible guardar: ${r.erro}`))
    setTratando(null); setNota(''); carregar()
  }

  return (
    <div className="rounded-2xl p-4 space-y-3 axi-card-premium3d axi-card-faixa" style={{ background: P.PAINEL_BG, border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
      <div>
        <p className="text-sm font-bold">{L('Central de alertas', 'Alert center', 'Central de alertas')} ({abertos.length})</p>
        <p className="text-[11px]" style={{ color: P.CINZA }}>{L(`Mais grave primeiro. Alerta de conta marcado como tratado sai daqui por ${DIAS_TRATADO} dias e volta se a situação continuar; alerta geral some sozinho quando a situação muda.`, `Most serious first. A bill alert marked as handled leaves for ${DIAS_TRATADO} days and comes back if the situation continues; general alerts disappear on their own when things change.`, `Lo más grave primero. Una alerta de cuenta marcada como tratada sale por ${DIAS_TRATADO} días y vuelve si la situación continúa; la alerta general desaparece sola cuando la situación cambia.`)}</p>
      </div>
      <div className="flex flex-wrap gap-1 text-xs">
        <button type="button" onClick={() => setNivel('todos')} className="px-2.5 py-1 rounded-lg font-bold axi-card-premium3d axi-card-faixa" style={pill(nivel === 'todos')}>{L('Todos', 'All', 'Todos')} ({abertos.length})</button>
        {NIVEIS_ALERTA.map((n) => (
          <button key={n} type="button" onClick={() => setNivel(n)} className="px-2.5 py-1 rounded-lg font-bold axi-card-premium3d axi-card-faixa flex items-center gap-1.5" style={pill(nivel === n)}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: corNivel[n], outline: '1px solid rgba(255,255,255,0.6)' }} />{nomeNivel(lang, n)} ({contagem(n)})
          </button>
        ))}
        <span className="w-full sm:w-auto sm:ml-auto flex gap-1">
          <button type="button" onClick={() => setVer('abertos')} className="px-2.5 py-1 rounded-lg font-bold axi-card-premium3d axi-card-faixa" style={pill(ver === 'abertos')}>{L('Abertos', 'Open', 'Abiertas')}</button>
          <button type="button" onClick={() => setVer('tratados')} className="px-2.5 py-1 rounded-lg font-bold axi-card-premium3d axi-card-faixa" style={pill(ver === 'tratados')}>{L('Histórico de tratados', 'Handled history', 'Historial de tratadas')} ({hist?.length ?? 0})</button>
        </span>
      </div>

      {ver === 'abertos' ? (
        lista.length === 0 ? <p className="text-xs" style={{ color: P.CINZA }}>{abertos.length ? L('Nenhum alerta neste nível.', 'No alerts at this level.', 'Ninguna alerta en este nivel.') : L('Tudo normal: nenhum alerta aberto agora.', 'All normal: no open alerts right now.', 'Todo normal: ninguna alerta abierta ahora.')}</p> : (
          <ul className="space-y-1.5 text-xs">
            {lista.map((a) => (
              <li key={a.chave} className="rounded-xl p-2.5 axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${a.severidade === 'critico' ? corNivel.critico : P.BORDA}` }}>
                <div className="flex flex-wrap items-center gap-2">
                  {selo(a.severidade)}
                  <span className="flex-1 min-w-[12rem] font-semibold">{textoAlerta(lang, a)}</span>
                  {a.tituloId ? (
                    <span className="flex gap-1">
                      <button type="button" onClick={() => abrir(a)} className="px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: BOTAO_SECUNDARIO }}>{L('Abrir', 'Open', 'Abrir')} ›</button>
                      <button type="button" onClick={() => { setTratando(tratando === a.chave ? null : a.chave); setNota(''); setErro('') }} className="px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{L('Marcar como tratado', 'Mark as handled', 'Marcar como tratada')}</button>
                    </span>
                  ) : <span className="text-[11px]" style={{ color: P.CINZA }}>{L('Some sozinho quando a situação mudar', 'Disappears when things change', 'Desaparece sola cuando la situación cambie')}</span>}
                </div>
                {tratando === a.chave && (
                  <div className="mt-2 space-y-1.5">
                    <textarea value={nota} onChange={(e) => setNota(e.target.value)} maxLength={500} rows={2} aria-label={L('O que foi feito', 'What was done', 'Lo que se hizo')} placeholder={L('O que foi feito? Ex.: liguei, cliente paga sexta.', 'What was done? E.g.: called, customer pays Friday.', '¿Qué se hizo? Ej.: llamé, el cliente paga el viernes.')} className="w-full rounded-lg px-2 py-1.5 text-sm" style={{ background: P.CAMPO, border: `1px solid ${P.BORDA}`, color: P.TEXTO }} />
                    {erro && <p style={{ color: P.VERMELHO }}>{erro}</p>}
                    <button type="button" disabled={salvando} onClick={() => salvar(a)} className="px-3 py-1.5 rounded-lg font-bold text-white" style={{ background: BOTAO_ACAO }}>{salvando ? L('Salvando…', 'Saving…', 'Guardando…') : L('Salvar', 'Save', 'Guardar')}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      ) : hist === null ? <p className="text-xs" style={{ color: P.CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p> : hist.length === 0 ? <p className="text-xs" style={{ color: P.CINZA }}>{L('Nenhum alerta tratado nos últimos 90 dias.', 'No alerts handled in the last 90 days.', 'Ninguna alerta tratada en los últimos 90 días.')}</p> : (
        <ul className="space-y-1.5 text-xs max-h-80 overflow-y-auto">
          {hist.map((h, k) => (
            <li key={`${h.chave}-${k}`} className="rounded-xl p-2.5 axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}` }}>
              <p className="font-semibold">{nomeDe(h.chave)}</p>
              <p style={{ color: P.CINZA }}>{dataTxt(h.em.slice(0, 10))} · {h.nota}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
