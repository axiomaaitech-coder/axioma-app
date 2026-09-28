'use client'
// ═══════════════════════════════════════════════════════════════
// "O que o Nexus faz por você" — vitrine das funções que moram atrás de um
// clique (leitura do José, E se...?, Minhas Simulações, Radar Global).
// Sem isso ninguém descobre que elas existem: cada card diz o que a função
// faz, como usar, e leva direto até ela. Mesmo tamanho/efeito dos cards do
// Nexus (grade de 4, altura igual por linha).
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { Brain, FlaskConical, FolderOpen, Globe2 } from 'lucide-react'
import { PALETA, VERDE_SOLIDO } from '../../../lib/nexusTema'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import { contarSimulacoes } from '../../../lib/nexusSimulacaoHelpers'
import { radarLigado, definirRadar } from '../../../components/NexusEventStream'
import type { EventoNexus } from '../../../lib/nexusHelpers'

type Lang = 'pt' | 'en' | 'es'
const BARRA = <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />

type Cores = { titulo: string; texto: string; cinza: string; acento: string }

function TopoCard({ icone, titulo, cores }: { icone: ReactNode; titulo: string; cores: Cores }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 30, height: 30, background: cores.acento + '1f' }}>{icone}</span>
      <h3 className="text-sm font-bold leading-snug" style={{ color: cores.titulo }}>{titulo}</h3>
    </div>
  )
}

function TextoCard({ oque, como, rotuloComo, cores }: { oque: string; como: string; rotuloComo: string; cores: Cores }) {
  return (
    <>
      <p className="text-xs leading-relaxed mb-2" style={{ color: cores.texto }}>{oque}</p>
      <p className="text-[11px] leading-relaxed mb-3" style={{ color: cores.cinza }}><span className="font-bold">{rotuloComo}</span> {como}</p>
    </>
  )
}

export function FuncoesNexus({ lang, temaClaro, eventoRecente, onAbrirEvento }: {
  lang: Lang; temaClaro: boolean; eventoRecente: EventoNexus | null; onAbrirEvento: (ev: EventoNexus) => void
}) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG } = PALETA[temaClaro ? 'xms' : 'dark']
  const ACENTO = temaClaro ? '#16a97d' : CIANO
  const [qtdSimulacoes, setQtdSimulacoes] = useState<number | null>(null)
  const [radar, setRadar] = useState(true)

  useEffect(() => {
    // Preferência mora no navegador: só dá pra ler depois de montar (senão o texto do
    // botão diverge entre servidor e navegador).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRadar(radarLigado())
    obterEmpresaAtiva().then((id) => (id ? contarSimulacoes(id) : 0)).then(setQtdSimulacoes).catch(() => setQtdSimulacoes(null))
  }, [])

  const cores: Cores = { titulo: TITULO, texto: TEXTO, cinza: CINZA, acento: ACENTO }
  const rotuloComo = L('Como usar:', 'How to use:', 'Cómo usar:')
  const card = 'relative overflow-hidden rounded-2xl p-4 flex flex-col h-full axi-card-premium3d'
  const estiloCard: CSSProperties = { background: PAINEL_BG, border: `1px solid ${CIANO}30` }
  const botao: CSSProperties = temaClaro ? VERDE_SOLIDO : { background: `${CIANO}18`, border: `1px solid ${CIANO}50`, color: CIANO }
  const classeBotao = 'mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-center'

  return (
    <section>
      <div className="mb-3 px-1">
        <h2 className="text-base font-bold" style={{ color: TITULO }}>{L('O que o Nexus faz por você', 'What Nexus does for you', 'Lo que Nexus hace por usted')}</h2>
        <p className="text-xs mt-0.5" style={{ color: TEXTO, opacity: 0.8 }}>
          {L('Ferramentas que transformam o que acontece na economia em decisão para a sua empresa.', 'Tools that turn what happens in the economy into decisions for your company.', 'Herramientas que convierten lo que pasa en la economía en decisiones para su empresa.')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
        <div className={card} style={estiloCard}>
          {BARRA}
          <TopoCard cores={cores} icone={<Brain size={16} style={{ color: ACENTO }} aria-hidden />} titulo={L('José lê cada evento', 'José reads every event', 'José lee cada evento')} />
          <TextoCard cores={cores} rotuloComo={rotuloComo}
            oque={L('Mostra o caminho até a sua margem (ex.: petróleo → combustível → frete → custo → margem), explica o que mudou, o impacto no Brasil e na sua empresa, os cenários com probabilidade e o que fazer — e mostra por que pensa assim.', 'Shows the path to your margin (e.g. oil → fuel → freight → cost → margin), explains what changed, the impact on Brazil and on your company, scenarios with probabilities and what to do — and why.', 'Muestra el camino hasta su margen (ej.: petróleo → combustible → flete → costo → margen), explica qué cambió, el impacto en Brasil y en su empresa, escenarios con probabilidad y qué hacer — y por qué.')}
            como={L('clique em qualquer card do Radar Global acima.', 'click any Global Radar card above.', 'haga clic en cualquier tarjeta del Radar Global arriba.')}
          />
          <button onClick={() => eventoRecente && onAbrirEvento(eventoRecente)} disabled={!eventoRecente} className={classeBotao + ' disabled:opacity-50'} style={botao}>
            {eventoRecente ? L('Ver a leitura do evento mais recente', 'See the latest event reading', 'Ver la lectura del evento más reciente') : L('Nenhum evento ainda', 'No events yet', 'Aún no hay eventos')}
          </button>
        </div>

        <div className={card} style={estiloCard}>
          {BARRA}
          <TopoCard cores={cores} icone={<FlaskConical size={16} style={{ color: ACENTO }} aria-hidden />} titulo={L('E se...? na sua empresa', 'What if...? for your company', '¿Y si...? en su empresa')} />
          <TextoCard cores={cores} rotuloComo={rotuloComo}
            oque={L('Simule dólar, Selic, inflação, petróleo ou queda de vendas e veja o efeito no seu lucro e no seu caixa, com os seus números reais.', 'Simulate dollar, Selic, inflation, oil or a sales drop and see the effect on your profit and cash, with your real numbers.', 'Simule dólar, Selic, inflación, petróleo o caída de ventas y vea el efecto en su beneficio y caja, con sus números reales.')}
            como={L('escolha um atalho (ex.: "Dólar +20%") ou digite seus valores e clique em Simular.', 'pick a shortcut (e.g. "Dollar +20%") or type your values and click Simulate.', 'elija un atajo (ej.: "Dólar +20%") o escriba sus valores y haga clic en Simular.')}
          />
          <Link href="/nexus/simulacoes" className={classeBotao} style={botao}>{L('Abrir o simulador', 'Open the simulator', 'Abrir el simulador')}</Link>
        </div>

        <div className={card} style={estiloCard}>
          {BARRA}
          <TopoCard cores={cores} icone={<FolderOpen size={16} style={{ color: ACENTO }} aria-hidden />} titulo={L('Minhas Simulações', 'My Simulations', 'Mis Simulaciones')} />
          <TextoCard cores={cores} rotuloComo={rotuloComo}
            oque={qtdSimulacoes
              ? L(`Você tem ${qtdSimulacoes} simulação(ões) salva(s). Edite, duplique, favorite ou arquive quando quiser.`, `You have ${qtdSimulacoes} saved simulation(s). Edit, duplicate, favorite or archive anytime.`, `Tiene ${qtdSimulacoes} simulación(es) guardada(s). Edite, duplique, marque como favorita o archive cuando quiera.`)
              : L('Guarde os cenários que importam para comparar depois. As antigas vão sozinhas para o arquivo — nada é apagado.', 'Save the scenarios that matter to compare later. Old ones get archived automatically — nothing is deleted.', 'Guarde los escenarios importantes para comparar después. Las antiguas se archivan solas — nada se borra.')}
            como={L('depois de simular, clique em "Salvar simulação".', 'after simulating, click "Save simulation".', 'después de simular, haga clic en "Guardar simulación".')}
          />
          <Link href="/nexus/simulacoes#salvas" className={classeBotao} style={botao}>{L('Ver minhas simulações', 'See my simulations', 'Ver mis simulaciones')}</Link>
        </div>

        <div className={card} style={estiloCard}>
          {BARRA}
          <TopoCard cores={cores} icone={<Globe2 size={16} style={{ color: ACENTO }} aria-hidden />} titulo={L('Radar Global em qualquer tela', 'Global Radar on every screen', 'Radar Global en cualquier pantalla')} />
          <TextoCard cores={cores} rotuloComo={rotuloComo}
            oque={L('Quando algo de impacto alto acontece, um aviso discreto aparece no canto enquanto você usa o Axioma — sem precisar abrir o Nexus.', 'When something high-impact happens, a discreet alert shows in the corner while you use Axioma — no need to open Nexus.', 'Cuando pasa algo de alto impacto, un aviso discreto aparece en la esquina mientras usa Axioma — sin abrir Nexus.')}
            como={L('no aviso, clique em "Ver análise". Ligue ou desligue aqui.', 'in the alert, click "See analysis". Turn it on or off here.', 'en el aviso, haga clic en "Ver análisis". Actívelo o desactívelo aquí.')}
          />
          <button
            onClick={() => { definirRadar(!radar); setRadar(!radar) }}
            aria-pressed={radar}
            className={classeBotao}
            style={radar ? botao : { background: 'transparent', border: `1px solid ${CINZA}80`, color: TEXTO }}
          >
            {radar ? L('Avisos ligados — desligar', 'Alerts on — turn off', 'Avisos activos — desactivar') : L('Avisos desligados — ligar', 'Alerts off — turn on', 'Avisos desactivados — activar')}
          </button>
        </div>
      </div>
    </section>
  )
}
