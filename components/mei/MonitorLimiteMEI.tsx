'use client'
// 🦅 MONITOR DE LIMITE MEI → ME (2026-10-10)
// Faturado de verdade × projeção (sempre separados), limite LEGAL da categoria (MEI comum ou
// caminhoneiro, proporcional no ano de abertura — lib/meiHelpers regraLimiteMEI), alerta
// interno que a pessoa escolhe, efeito do excesso pela LC 123 art. 18-A §7º III e checklist
// de transição. O Axioma NUNCA muda porte, natureza jurídica ou regime sozinho.
import { useEffect, useState } from 'react'
import { CanvasBox } from '../CanvasBox'
import { efeitoExcessoMEI, type RegraLimiteMEI } from '../../lib/meiHelpers'

type Lang = 'pt' | 'en' | 'es'
type Cores = { VERDE: string; VERMELHO: string; AMBAR: string; NEUTRO: string; TEXTO_SEC: string; NESTED_BORDA: string; CAMPO_BG: string }

export default function MonitorLimiteMEI({ empresaId, ano, faturado, projecaoAnual, teto, proporcional, mesesAtivos, regra, lang, temaClaro, cartaoTema, cores }: {
  empresaId: string | null; ano: number; faturado: number; projecaoAnual: number; teto: number; proporcional: boolean; mesesAtivos: number
  regra: RegraLimiteMEI; lang: Lang; temaClaro: boolean; cartaoTema: { fundo?: string; premium3d: boolean }; cores: Cores
}) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const local = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const fmt = (v: number) => v.toLocaleString(local, { style: 'currency', currency: 'BRL' })
  const { VERDE, VERMELHO, AMBAR, NEUTRO, TEXTO_SEC, NESTED_BORDA, CAMPO_BG } = cores
  const TEXTO = temaClaro ? '#101b3d' : '#e5edf7'
  const NESTED_BG = temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(255,255,255,0.03)'
  const caixa = 'rounded-xl p-3 axi-card-premium3d axi-card-faixa'

  // Alerta interno (escolha da pessoa, só neste navegador) — o limite LEGAL não muda.
  const chave = `axioma:mei-alerta-pct:${empresaId ?? ''}`
  const [alertaPct, setAlertaPct] = useState(80)
  useEffect(() => { try { const v = Number(localStorage.getItem(chave)); if (v >= 50 && v <= 100) setAlertaPct(v) } catch { /* sem storage: 80% */ } }, [chave])
  const salvarAlerta = (v: number) => { setAlertaPct(v); try { localStorage.setItem(chave, String(v)) } catch { /* só nesta visita */ } }

  const pctReal = teto > 0 ? (faturado / teto) * 100 : 0
  const pctProj = teto > 0 ? (projecaoAnual / teto) * 100 : 0
  const real = efeitoExcessoMEI(faturado, teto)
  const proj = efeitoExcessoMEI(projecaoAnual, teto)
  const nivel = real.situacao !== 'dentro' ? 'excedeu' : pctReal >= alertaPct || proj.situacao !== 'dentro' ? 'atencao' : 'ok'
  const corNivel = nivel === 'excedeu' ? VERMELHO : nivel === 'atencao' ? AMBAR : VERDE
  const ehTac = regra.tipo === 'tac'

  const efeitoTexto = (s: 'dentro' | 'ate20' | 'acima20') => s === 'ate20'
    ? L(`Excesso de até 20% (até ${fmt(real.limite20)}): pela regra em vigor, o MEI deixa o regime a partir de 1º de janeiro de ${ano + 1} e recolhe a diferença do excesso junto com o DAS de janeiro.`,
        `Excess up to 20% (up to ${fmt(real.limite20)}): under current rules, the MEI leaves the regime from January 1, ${ano + 1} and pays the difference with the January DAS.`,
        `Exceso de hasta 20% (hasta ${fmt(real.limite20)}): según la regla vigente, el MEI deja el régimen desde el 1º de enero de ${ano + 1} y paga la diferencia con el DAS de enero.`)
    : s === 'acima20'
    ? L(`Excesso acima de 20% (mais de ${fmt(real.limite20)}): pela regra em vigor, o desenquadramento volta a 1º de janeiro de ${ano} — os impostos do ano passam a ser os de ME/EPP desde janeiro.`,
        `Excess above 20% (over ${fmt(real.limite20)}): under current rules, the exclusion goes back to January 1, ${ano} — the year's taxes become ME/EPP taxes since January.`,
        `Exceso superior a 20% (más de ${fmt(real.limite20)}): según la regla vigente, el desencuadre retrocede al 1º de enero de ${ano} — los impuestos del año pasan a ser de ME/EPP desde enero.`)
    : ''

  const checklist = [
    L('Fale com um contador antes de qualquer passo — ele confirma o enquadramento e o melhor regime (Simples Nacional, anexo, fator R).', 'Talk to an accountant before any step — they confirm the classification and the best regime (Simples Nacional, annex, R factor).', 'Hable con un contador antes de cualquier paso — confirma el encuadre y el mejor régimen (Simples Nacional, anexo, factor R).'),
    L('Comunicação de desenquadramento no Portal do Simples Nacional: até o último dia útil do mês seguinte ao do excesso.', 'Exclusion notice on the Simples Nacional portal: by the last business day of the month after the excess.', 'Comunicación de desencuadre en el Portal del Simples Nacional: hasta el último día hábil del mes siguiente al exceso.'),
    L('Planeje o caixa: como ME o imposto passa a ser uma % do faturamento, não mais o DAS fixo.', 'Plan cash: as ME the tax becomes a % of revenue, no longer the fixed DAS.', 'Planifique la caja: como ME el impuesto pasa a ser un % de la facturación, ya no el DAS fijo.'),
    L('Notas fiscais, contrato social e cadastro mudam — o Axioma não altera porte, natureza jurídica nem regime sozinho.', 'Invoices, articles and registration change — Axioma never changes size, legal nature or regime by itself.', 'Facturas, contrato social y registro cambian — Axioma nunca cambia porte, naturaleza jurídica ni régimen solo.'),
  ]

  return (
    <CanvasBox cor={corNivel} {...cartaoTema}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <p className="text-sm font-bold" style={{ color: TEXTO }}>{L(`Limite do MEI em ${ano}`, `MEI cap in ${ano}`, `Límite del MEI en ${ano}`)}</p>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${corNivel}22`, color: corNivel, border: `1px solid ${corNivel}55` }}>
          {nivel === 'excedeu' ? L('Limite ultrapassado', 'Cap exceeded', 'Límite superado') : nivel === 'atencao' ? L('Atenção', 'Attention', 'Atención') : L('Dentro do limite', 'Within the cap', 'Dentro del límite')}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <div className={caixa} style={{ background: NESTED_BG, border: `1px solid ${NESTED_BORDA}` }}>
          <p className="text-[11px] font-semibold" style={{ color: TEXTO_SEC }}>{L('Faturado de verdade', 'Actually invoiced', 'Facturado de verdad')}</p>
          <p className="text-lg font-black" style={{ color: TEXTO }}>{fmt(faturado)}</p>
          <p className="text-[11px]" style={{ color: TEXTO_SEC }}>{pctReal.toFixed(1)}% {L('do limite', 'of the cap', 'del límite')}</p>
        </div>
        <div className={caixa} style={{ background: NESTED_BG, border: `1px solid ${NESTED_BORDA}` }}>
          <p className="text-[11px] font-semibold" style={{ color: TEXTO_SEC }}>{L('Projeção até dezembro (estimativa)', 'Projection to December (estimate)', 'Proyección hasta diciembre (estimación)')}</p>
          <p className="text-lg font-black" style={{ color: proj.situacao === 'dentro' ? TEXTO : AMBAR }}>{fmt(projecaoAnual)}</p>
          <p className="text-[11px]" style={{ color: TEXTO_SEC }}>{pctProj.toFixed(1)}% · {L('média dos últimos 6 meses', 'average of the last 6 months', 'promedio de los últimos 6 meses')}</p>
        </div>
        <div className={caixa} style={{ background: NESTED_BG, border: `1px solid ${NESTED_BORDA}` }}>
          <p className="text-[11px] font-semibold" style={{ color: TEXTO_SEC }}>{L('Limite legal', 'Legal cap', 'Límite legal')}{ehTac ? L(' — caminhoneiro', ' — truck driver', ' — camionero') : ''}</p>
          <p className="text-lg font-black" style={{ color: TEXTO }}>{fmt(teto)}</p>
          <p className="text-[11px]" style={{ color: TEXTO_SEC }}>{proporcional ? L(`proporcional: ${mesesAtivos} meses × ${fmt(regra.mensal)}`, `prorated: ${mesesAtivos} months × ${fmt(regra.mensal)}`, `proporcional: ${mesesAtivos} meses × ${fmt(regra.mensal)}`) : L('ano inteiro', 'full year', 'año completo')}</p>
        </div>
      </div>
      {real.situacao !== 'dentro' && <p className="text-xs font-semibold mb-2" style={{ color: VERMELHO }}>{efeitoTexto(real.situacao)}</p>}
      {real.situacao === 'dentro' && proj.situacao !== 'dentro' && (
        <p className="text-xs font-semibold mb-2" style={{ color: AMBAR }}>{L(`Se o ritmo continuar, você passa do limite até dezembro (projeção, não fato). ${efeitoTexto(proj.situacao)}`, `If the pace continues, you exceed the cap by December (projection, not fact). ${efeitoTexto(proj.situacao)}`, `Si el ritmo sigue, supera el límite hasta diciembre (proyección, no hecho). ${efeitoTexto(proj.situacao)}`)}</p>
      )}
      {nivel !== 'ok' && (
        <div className={`${caixa} mb-2`} style={{ background: NESTED_BG, border: `1px solid ${NESTED_BORDA}` }}>
          <p className="text-[11px] font-bold mb-1" style={{ color: TEXTO }}>{L('Transição para ME — checklist preliminar', 'Move to ME — preliminary checklist', 'Transición a ME — checklist preliminar')}</p>
          <ul className="text-[11px] space-y-1 list-disc pl-4" style={{ color: TEXTO_SEC }}>{checklist.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[11px] flex items-center gap-1.5" style={{ color: TEXTO_SEC }}>
          {L('Me avise a partir de', 'Warn me from', 'Avíseme desde')}
          <input type="number" min={50} max={100} step={5} value={alertaPct} onChange={(e) => salvarAlerta(Math.max(50, Math.min(100, Number(e.target.value) || 80)))}
            className="w-16 px-2 py-1 rounded-lg text-xs" style={{ background: CAMPO_BG, border: `1px solid ${NESTED_BORDA}`, color: TEXTO }} aria-label={L('Percentual de alerta', 'Alert percentage', 'Porcentaje de alerta')} />
          {L('% do limite', '% of the cap', '% del límite')}
        </label>
        <p className="text-[10px]" style={{ color: NEUTRO }}>{L('Fonte: ', 'Source: ', 'Fuente: ')}{regra.fonte}. {L('Análise preliminar — valide com o contador.', 'Preliminary analysis — validate with your accountant.', 'Análisis preliminar — valide con su contador.')}</p>
      </div>
    </CanvasBox>
  )
}
