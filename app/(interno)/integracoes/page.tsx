'use client'
// Saúde das integrações (2026-11-12): cada ligação do Axioma (IA, banco, importação, rastreabilidade, assinatura)
// com status, última vez que funcionou e o botão de onde resolver. Regras em lib/saudeIntegracoes.ts.
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, XCircle, MinusCircle, HelpCircle, RefreshCw } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { ThemeToggle } from '../../../components/ThemeToggle'
import { useThemeAxioma } from '../../../lib/ThemeContext'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import { carregarSaudeIntegracoes, type ItemSaude, type StatusSaude } from '../../../lib/saudeIntegracoes'
import { createBrowserClient } from '../../../lib/supabaseBrowser'

type Idioma3 = 'pt' | 'en' | 'es'
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Sem vermelho decorativo: "falha" usa o laranja de alerta real, mesmo tom das outras telas.
const PALETA = {
  dark: { VERDE: '#34d399', ALERTA: '#fbbf24', FALHA: '#fb923c', CINZA: '#a3b1c2', TEXTO: '#e6edf5', PAINEL_BG: 'rgba(10,20,36,0.7)', BORDA: 'rgba(255,255,255,0.08)', ANINHADO: 'rgba(2,8,16,0.5)' },
  xms: { VERDE: '#0f7a5a', ALERTA: '#9a3412', FALHA: '#9a3412', CINZA: '#374151', TEXTO: '#101b3d', PAINEL_BG: '#f6f7c4', BORDA: 'rgba(16,27,61,0.12)', ANINHADO: 'rgba(245,238,220,0.7)' },
} as const
const ORDEM: Record<StatusSaude, number> = { falha: 0, atencao: 1, sem_dado: 2, ok: 3, nao_usa: 4 }

export default function IntegracoesPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const { VERDE, ALERTA, FALHA, CINZA, TEXTO, PAINEL_BG, BORDA, ANINHADO } = PALETA[tema]

  const [loading, setLoading] = useState(true)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [itens, setItens] = useState<ItemSaude[] | null>(null)
  const [conferidoEm, setConferidoEm] = useState<Date | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const empId = await obterEmpresaAtiva()
    setEmpresaId(empId)
    if (empId) {
      // Anti-falha: 3 tentativas antes de mostrar o aviso.
      let lista: ItemSaude[] | null = null
      for (let i = 0; i < 3 && !lista; i++) lista = await carregarSaudeIntegracoes(supabase, empId).catch(() => null)
      setItens(lista); setConferidoEm(new Date())
    }
    setLoading(false)
  }, [])
  useEffect(() => { carregar() }, [carregar])

  const cor = (s: StatusSaude) => s === 'ok' ? VERDE : s === 'falha' ? FALHA : s === 'atencao' || s === 'sem_dado' ? ALERTA : CINZA
  const icone = (s: StatusSaude) => {
    const p = { size: 20, style: { color: cor(s), flexShrink: 0 } }
    return s === 'ok' ? <CheckCircle2 {...p} /> : s === 'falha' ? <XCircle {...p} /> : s === 'atencao' ? <AlertCircle {...p} /> : s === 'sem_dado' ? <HelpCircle {...p} /> : <MinusCircle {...p} />
  }
  const rotulo = (s: StatusSaude) => ({ ok: L('Funcionando', 'Working', 'Funcionando'), atencao: L('Atenção', 'Attention', 'Atención'), falha: L('Com falha', 'Failing', 'Con falla'), sem_dado: L('Sem leitura', 'No reading', 'Sin lectura'), nao_usa: L('Não usado', 'Not used', 'No usado') })[s]
  const dataHora = (iso: string) => new Date(iso).toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const problemas = itens?.filter((i) => i.status === 'falha' || i.status === 'atencao' || i.status === 'sem_dado').length ?? 0

  return (
    <div data-theme={tema} style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
    <ModuloLayout
      titulo={L('Saúde das Integrações', 'Integrations Health', 'Salud de las Integraciones')}
      subtitulo={L('Cada ligação do Axioma: se está funcionando, a última vez que rodou e onde resolver.', 'Every Axioma connection: whether it works, when it last ran and where to fix it.', 'Cada conexión del Axioma: si funciona, la última vez que corrió y dónde resolverlo.')}
      headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
      botaoExtra={
        <>
          <button onClick={carregar} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #0b5f46, #0f7a5a)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{L('Conferir de novo', 'Check again', 'Verificar de nuevo')}
          </button>
          <ThemeToggle />
        </>
      }
    >
      {loading && !itens ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !empresaId ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : (
        <div className="rounded-2xl p-5 axi-card-premium3d axi-card-faixa" style={{ background: PAINEL_BG, border: `1px solid ${BORDA}` }}>
          {!itens ? (
            <p className="text-sm" style={{ color: ALERTA }}>{L('Não foi possível conferir as integrações agora. Toque em "Conferir de novo".', 'Could not check the integrations now. Tap "Check again".', 'No se pudieron verificar las integraciones ahora. Toque "Verificar de nuevo".')}</p>
          ) : (<>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: CINZA }}>{L('Situação geral', 'Overall status', 'Situación general')}</p>
                <p className="text-2xl font-black mt-1" style={{ color: problemas ? ALERTA : VERDE }}>
                  {problemas === 1 ? L('1 integração pede atenção', '1 integration needs attention', '1 integración requiere atención') : problemas ? L(`${problemas} integrações pedem atenção`, `${problemas} integrations need attention`, `${problemas} integraciones requieren atención`) : L('Tudo funcionando', 'Everything working', 'Todo funcionando')}
                </p>
              </div>
              {conferidoEm && <p className="text-xs" style={{ color: CINZA }}>{L('Conferido em', 'Checked at', 'Verificado el')} {dataHora(conferidoEm.toISOString())}</p>}
            </div>
            <ul className="space-y-2">
              {[...itens].sort((a, b) => ORDEM[a.status] - ORDEM[b.status]).map((i) => (
                <li key={i.id} className="rounded-xl p-3 flex flex-wrap items-center gap-3 axi-card-faixa" style={{ background: ANINHADO, border: `1px solid ${i.status === 'falha' || i.status === 'atencao' ? cor(i.status) + '55' : BORDA}` }}>
                  {icone(i.status)}
                  <div className="flex-1 min-w-[14rem]">
                    <p className="text-sm font-bold" style={{ color: TEXTO }}>{i.titulo[lang]} <span className="text-xs font-semibold" style={{ color: cor(i.status) }}>· {rotulo(i.status)}</span></p>
                    <p className="text-xs mt-0.5" style={{ color: i.status === 'ok' || i.status === 'nao_usa' ? CINZA : cor(i.status) }}>{i.detalhe[lang]}</p>
                    {i.ultimaVez && <p className="text-xs mt-0.5" style={{ color: CINZA }}>{L('Última vez', 'Last time', 'Última vez')}: {dataHora(i.ultimaVez)}</p>}
                  </div>
                  <button type="button" onClick={() => router.push(i.rota)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #0a1628, #101b3d)' }}>{i.acao[lang]}</button>
                </li>
              ))}
            </ul>
            <p className="text-xs mt-3" style={{ color: CINZA }}>{L('Esta tela só lê: nada é alterado. "Não usado" quer dizer que a Empresa ainda não usa aquela ligação.', 'This screen only reads: nothing is changed. "Not used" means the company does not use that connection yet.', 'Esta pantalla solo lee: nada se modifica. "No usado" significa que la empresa aún no usa esa conexión.')}</p>
          </>)}
        </div>
      )}
    </ModuloLayout>
    </div>
  )
}
