'use client'
// Piloto automático supervisionado (Overdue Intelligence, Fase 2 etapa 13): a fila de ações do dia montada pelas
// regras (lib/vencidos/motor.ts filaDoDia). NADA sai sozinho: "Abrir" leva à conta, com a mensagem sugerida já
// escolhida; a ação some da fila quando a pessoa registra o contato. Regras liga/desliga ficam na config da empresa.
import { useState } from 'react'
import { REGRAS_PILOTO, type RegraPiloto } from '../../../lib/vencidos/motor'
import { salvarRegrasPiloto, type AnaliseVencidos } from '../../../lib/vencidos/dados'
import { nomeRegraPiloto, facaRegraPiloto, type Lang } from '../../../lib/vencidos/textos'

type Paleta = { VERMELHO: string; CINZA: string; TEXTO: string; PAINEL_BG: string; ANINHADA: string; BORDA: string }
const BOTAO_ACAO = 'linear-gradient(135deg, #0a4f3b, #0f7d5c)'
const BOTAO_SECUNDARIO = '#101b3d'

export default function PilotoAutomatico({ a, empresaId, lang, P, fmt }: { a: AnaliseVencidos; empresaId: string; lang: Lang; P: Paleta; fmt: (v: number) => string }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const [regras, setRegras] = useState(false)
  const [desligadas, setDesligadas] = useState<RegraPiloto[]>(a.pilotoDesligadas)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState<RegraPiloto | null>(null)
  const abrir = (id: string, dominio: string) => window.dispatchEvent(new CustomEvent('axioma:abrir-conta', { detail: { id, dominio } }))

  async function alternar(r: RegraPiloto) {
    const novas = desligadas.includes(r) ? desligadas.filter((x) => x !== r) : [...desligadas, r]
    setSalvando(r); setErro('')
    const res = await salvarRegrasPiloto(empresaId, a, novas)
    setSalvando(null)
    if (!res.ok) return setErro(res.erro === 'sem permissão' ? L('Só dono, sócio ou administrador pode ligar ou desligar regras.', 'Only the owner, partner or admin can turn rules on or off.', 'Solo el dueño, socio o administrador puede activar o desactivar reglas.') : L(`Não foi possível salvar: ${res.erro}`, `Could not save: ${res.erro}`, `No fue posible guardar: ${res.erro}`))
    setDesligadas(novas)
    window.dispatchEvent(new Event('axioma:dados-atualizados')) // refaz a fila com as regras novas
  }

  return (
    <div className="rounded-2xl p-4 space-y-3 axi-card-premium3d axi-card-faixa" style={{ background: P.PAINEL_BG, border: `1px solid ${P.BORDA}`, color: P.TEXTO }}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex-1 min-w-[14rem]">
          <p className="text-sm font-bold">{L('Piloto automático — ações de hoje', 'Autopilot — today’s actions', 'Piloto automático — acciones de hoy')} ({a.piloto.length})</p>
          <p className="text-[11px]" style={{ color: P.CINZA }}>{L('O Axioma separa o que precisa ser feito hoje. Nada é enviado sozinho: “Abrir” leva até a conta com a mensagem sugerida já escolhida, e a ação sai daqui quando o contato é registrado.', 'Axioma picks what needs doing today. Nothing is sent on its own: “Open” takes you to the bill with the suggested message already chosen, and the action leaves this list once the contact is recorded.', 'Axioma separa lo que hay que hacer hoy. Nada se envía solo: “Abrir” lleva a la cuenta con el mensaje sugerido ya elegido, y la acción sale de aquí cuando se registra el contacto.')}</p>
        </div>
        <button type="button" onClick={() => setRegras(!regras)} className="px-2.5 py-1 rounded-lg text-xs font-bold text-white axi-card-premium3d axi-card-faixa" style={{ background: BOTAO_SECUNDARIO }}>{regras ? L('Fechar regras', 'Close rules', 'Cerrar reglas') : L('Regras do piloto', 'Autopilot rules', 'Reglas del piloto')} ({REGRAS_PILOTO.length - desligadas.length}/{REGRAS_PILOTO.length})</button>
      </div>

      {regras && (
        <ul className="space-y-1.5 text-xs">
          {REGRAS_PILOTO.map((r) => {
            const ligada = !desligadas.includes(r)
            return (
              <li key={r} className="rounded-xl p-2.5 flex flex-wrap items-center gap-2 axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${P.BORDA}` }}>
                <span className="flex-1 min-w-[12rem]"><b>{nomeRegraPiloto(lang, r)}</b><br /><span style={{ color: P.CINZA }}>{facaRegraPiloto(lang, r)}</span></span>
                <button type="button" role="switch" aria-checked={ligada} disabled={salvando !== null} onClick={() => void alternar(r)} className="px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: ligada ? BOTAO_ACAO : BOTAO_SECUNDARIO }}>
                  {salvando === r ? L('Salvando…', 'Saving…', 'Guardando…') : ligada ? L('Ligada', 'On', 'Activa') : L('Desligada', 'Off', 'Desactivada')}
                </button>
              </li>
            )
          })}
          {erro && <li style={{ color: P.VERMELHO }}>{erro}</li>}
        </ul>
      )}

      {a.piloto.length === 0 ? <p className="text-xs" style={{ color: P.CINZA }}>{L('Nada pendente hoje pelas regras ligadas.', 'Nothing pending today under the active rules.', 'Nada pendiente hoy según las reglas activas.')}</p> : (
        <ul className="space-y-1.5 text-xs">
          {a.piloto.map((x) => (
            <li key={x.chave} className="rounded-xl p-2.5 flex flex-wrap items-center gap-2 axi-card-premium3d axi-card-faixa" style={{ background: P.ANINHADA, border: `1px solid ${x.regra === 'fornecedor_essencial' ? P.VERMELHO : P.BORDA}` }}>
              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold text-white shrink-0" style={{ background: BOTAO_SECUNDARIO }}>{nomeRegraPiloto(lang, x.regra)}</span>
              <span className="flex-1 min-w-[12rem]"><b>{x.nome || '—'}</b> · {fmt(x.saldo)} · {L(`${x.dias} dias de atraso`, `${x.dias} days overdue`, `${x.dias} días de atraso`)} · {x.dominio === 'pagar' ? L('a pagar', 'payable', 'por pagar') : L('a receber', 'receivable', 'por cobrar')}<br /><span style={{ color: P.CINZA }}>{facaRegraPiloto(lang, x.regra)}</span></span>
              <button type="button" onClick={() => abrir(x.tituloId, x.dominio)} className="px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: BOTAO_SECUNDARIO }}>{L('Abrir', 'Open', 'Abrir')} ›</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
