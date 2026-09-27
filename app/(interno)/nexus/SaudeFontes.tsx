'use client'
// "Saúde das fontes" — mostra, fonte por fonte, se a coleta automática diária
// deu certo (Banco Central, IPEA, Banco Mundial, notícias...). Card visível
// sempre; a lista abre no clique pra não pesar a tela.
import { useState } from 'react'
import { PALETA, VERDE_SOLIDO } from '../../../lib/nexusTema'
import { obterSaudeFontes, type FonteSaude } from '../../../lib/nexusHelpers'
import type { SaudeFonte } from '../../../lib/nexusFreshness'

type Lang = 'pt' | 'en' | 'es'

const ROTULO: Record<SaudeFonte, [string, string, string]> = {
  ok: ['Funcionando', 'Working', 'Funcionando'],
  falhou: ['Falhou na última tentativa', 'Last attempt failed', 'Falló en el último intento'],
  parada: ['Sem atualizar há mais de 1 dia', 'Not updated for over 1 day', 'Sin actualizar hace más de 1 día'],
  nunca: ['Ainda não coletou', 'Not collected yet', 'Aún no recolectada'],
  desligada: ['Desligada', 'Turned off', 'Desactivada'],
}
const COR: Record<SaudeFonte, string> = { ok: '#2ecc9b', falhou: '#ff5a6b', parada: '#f5a623', nunca: '#7f9bb8', desligada: '#7f9bb8' }
const TEXTO_SOBRE: Record<SaudeFonte, string> = { ok: '#101b3d', falhou: '#2b0007', parada: '#2b1900', nunca: '#101b3d', desligada: '#101b3d' }

export function SaudeFontes({ lang, temaClaro }: { lang: Lang; temaClaro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG, NESTED_BG, NESTED_BORDA } = PALETA[temaClaro ? 'xms' : 'dark']
  const [fontes, setFontes] = useState<FonteSaude[] | null>(null)
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState(false)

  const abrir = () => {
    setAberto((a) => !a)
    if (!fontes) obterSaudeFontes().then(setFontes).catch(() => setErro(true))
  }
  const quando = (iso: string | null) => iso
    ? new Date(iso).toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—'
  const comProblema = fontes?.filter((f) => f.saude === 'falhou' || f.saude === 'parada').length ?? 0

  return (
    <section className="relative overflow-hidden rounded-2xl p-4 axi-card-premium3d" style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
      <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: TITULO }}>🩺 {L('Saúde das fontes', 'Source health', 'Salud de las fuentes')}</h2>
          <p className="text-xs mt-0.5" style={{ color: TEXTO, opacity: 0.8 }}>
            {L('Confira se cada fonte oficial (Banco Central, IPEA, Banco Mundial, notícias) atualizou hoje. Se alguma falhar, o José avisa que o dado pode estar velho.',
              'Check whether each official source (Central Bank, IPEA, World Bank, news) updated today. If one fails, José warns the data may be old.',
              'Verifique si cada fuente oficial (Banco Central, IPEA, Banco Mundial, noticias) se actualizó hoy. Si alguna falla, José avisa que el dato puede estar viejo.')}
          </p>
        </div>
        <button onClick={abrir} className="shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all hover:scale-[1.02]"
          style={temaClaro ? VERDE_SOLIDO : { background: `${CIANO}15`, border: `1px solid ${CIANO}35`, color: CIANO }}>
          {aberto ? L('Fechar', 'Close', 'Cerrar') : L('Ver fontes', 'See sources', 'Ver fuentes')}
        </button>
      </div>

      {aberto && (
        <div className="mt-4">
          {erro && <p className="text-xs" style={{ color: '#ff5a6b' }}>{L('Não foi possível carregar agora. Tente de novo.', 'Could not load now. Try again.', 'No se pudo cargar ahora. Intente de nuevo.')}</p>}
          {!erro && !fontes && <p className="text-xs" style={{ color: CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p>}
          {fontes && (
            <>
              <p className="text-xs mb-3 font-bold" style={{ color: comProblema ? '#f5a623' : temaClaro ? '#16a97d' : '#2ecc9b' }}>
                {comProblema
                  ? L(`${comProblema} fonte(s) com problema — as outras seguem normais.`, `${comProblema} source(s) with issues — the rest are fine.`, `${comProblema} fuente(s) con problema — las demás siguen normales.`)
                  : L('Todas as fontes ativas estão funcionando.', 'All active sources are working.', 'Todas las fuentes activas funcionan.')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {fontes.map((f) => (
                  <div key={f.nome} className="rounded-xl p-3" style={{ background: NESTED_BG, border: `1px solid ${NESTED_BORDA}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold break-words" style={{ color: TITULO }}>{f.nome}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={temaClaro
                        ? { background: COR[f.saude], color: TEXTO_SOBRE[f.saude] }
                        : { background: `${COR[f.saude]}20`, color: COR[f.saude] }}>{L(...ROTULO[f.saude])}</span>
                    </div>
                    <p className="text-[11px] mt-1.5" style={{ color: CINZA }}>{L('Último sucesso', 'Last success', 'Último éxito')}: <span style={{ color: TEXTO }}>{quando(f.ultimoSucesso)}</span></p>
                    {f.ultimaFalha && <p className="text-[11px]" style={{ color: CINZA }}>{L('Última falha', 'Last failure', 'Último fallo')}: <span style={{ color: TEXTO }}>{quando(f.ultimaFalha)}</span></p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
