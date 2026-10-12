'use client'
// ═══════════════════════════════════════════════════════════════
// PÁGINA PÚBLICA DO NEXUS E DO JOSÉ (pedido do Elias 2026-10-12): mostra a dimensão da
// tecnologia do Axioma. Conteúdo tirado do manual 43 (o que existe de verdade), 3 idiomas.
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { JosephAvatar } from '../../components/JosephAvatar'
import { cinzel } from '../(interno)/nexus/fonteJose'

type Lang = 'pt' | 'en' | 'es'
type Item = { titulo: string; desc: string }

const T: Record<Lang, {
  voltar: string; comecar: string; heroTitulo: string; heroSub: string; heroNota: string
  porqueTitulo: string; porqueTexto: string
  acompanhaTitulo: string; acompanha: Item[]
  joseTitulo: string; jose: Item[]
  passosTitulo: string; passos: Item[]
  compromissoTitulo: string; compromissos: string[]
  ctaTitulo: string; ctaSub: string; ctaBtn: string; termos: string; privacidade: string; direitos: string
}> = {
  pt: {
    voltar: 'Voltar ao início', comecar: 'Testar 7 dias grátis',
    heroTitulo: 'Nexus e o José', heroSub: 'A inteligência econômica do Axioma: acompanha a economia do Brasil e do mundo todos os dias e traduz o que acontece em impacto para a sua empresa.',
    heroNota: 'Incluído no plano Premium.',
    porqueTitulo: 'Por que "José"', porqueTexto: 'Na história bíblica, José do Egito interpretou os sinais e preparou o país para os sete anos de vacas magras. É a ideia do Nexus: ler os sinais de hoje para a sua empresa se preparar para amanhã.',
    acompanhaTitulo: 'O que o Nexus acompanha',
    acompanha: [
      { titulo: 'Indicadores do Brasil', desc: 'Câmbio, juros, inflação, emprego e atividade, de fontes oficiais como Banco Central e IBGE, atualizados todo dia, com a confiabilidade e a data de cada dado.' },
      { titulo: 'Economia mundial', desc: 'Petróleo Brent, crescimento e inflação mundial, as matérias-primas que o Brasil mais exporta (FMI), combustíveis nos postos (ANP) e comércio exterior.' },
      { titulo: 'Radar Global', desc: 'Mudanças relevantes percebidas automaticamente. O que afeta o seu setor vem marcado com "Mexe com o seu ramo".' },
      { titulo: 'Notícias e Reforma Tributária', desc: 'Manchetes por canal, com link para a matéria completa e para a página oficial do Senado.' },
      { titulo: 'Pesquisar com fonte oficial', desc: 'Em cada indicador: o dado oficial, a fonte pública, a hora da coleta, o valor de um mês antes e as reportagens dos últimos 30 dias.' },
      { titulo: 'Saúde das fontes', desc: 'Mostra se cada fonte está no ar. Fonte fora tenta de novo em até 6 horas, e quase todas têm uma reserva gratuita.' },
    ],
    joseTitulo: 'O que o José faz por você',
    jose: [
      { titulo: 'Leitura de cada evento', desc: 'Impacto no Brasil e no mundo, setores afetados, o que muda para uma empresa como a sua, cenários, riscos, oportunidades e o grau de confiança da leitura.' },
      { titulo: 'Painel executivo diário', desc: 'O mundo, o Brasil, alertas, riscos e oportunidades, com horizontes de 12 meses, 3, 5 e 10 anos — e "o que você pode não estar vendo".' },
      { titulo: 'Conversa em linguagem natural', desc: 'Pergunte o que quiser: o José responde com os indicadores oficiais e os números da sua empresa no Axioma.' },
      { titulo: 'Plano para a sua empresa', desc: 'Veredito, sobrevivência, onde economizar, o que cortar, como crescer, metas e gatilhos para vigiar — salvo e exportável em PDF.' },
      { titulo: 'E se...? (simulações)', desc: 'Mude dólar, Selic, inflação, petróleo ou vendas e veja o efeito no lucro, no caixa e por quantos meses o caixa dura. O José explica o resultado.' },
      { titulo: 'Placar de acertos', desc: 'O José faz previsões e o Axioma confere depois, no prazo. Acertos e erros ficam à mostra, sem esconder nada.' },
    ],
    passosTitulo: 'Como funciona',
    passos: [
      { titulo: 'Coleta', desc: 'Todo dia o Nexus busca os dados em fontes oficiais e gratuitas, com reserva quando uma fonte atrasa.' },
      { titulo: 'Radar', desc: 'Mudanças relevantes viram eventos, ligados ao ramo de cada empresa.' },
      { titulo: 'Leitura do José', desc: 'O José cruza a economia com os números da sua empresa e explica o impacto.' },
      { titulo: 'Sua decisão', desc: 'Você recebe o quadro completo. Quem decide é sempre você.' },
    ],
    compromissoTitulo: 'Compromissos do José',
    compromissos: [
      'Só usa dados oficiais e os números da sua empresa no Axioma: nada é inventado.',
      'Leituras são interpretações, não fatos, e não são recomendação de investimento.',
      'O José só lê: nunca apaga nem altera dados da sua empresa.',
      'Usa o motor de inteligência mais avançado do Axioma, com motores de reserva para nunca ficar parado.',
    ],
    ctaTitulo: 'Veja a economia pelos olhos da sua empresa.', ctaSub: 'Nexus e o José fazem parte do plano Premium do Axioma.', ctaBtn: 'Ver os planos',
    termos: 'Termos de Uso', privacidade: 'Política de Privacidade', direitos: '© 2026 axiomaai.com.br — Axioma AI.Tech. Todos os direitos reservados.',
  },
  en: {
    voltar: 'Back to home', comecar: 'Try 7 days free',
    heroTitulo: 'Nexus and José', heroSub: 'Axioma’s economic intelligence: it follows the Brazilian and world economy every day and translates what happens into impact on your company.',
    heroNota: 'Included in the Premium plan.',
    porqueTitulo: 'Why "José"', porqueTexto: 'In the biblical story, Joseph of Egypt read the signs and prepared the country for seven lean years. That is the idea behind Nexus: read today’s signs so your company is ready for tomorrow.',
    acompanhaTitulo: 'What Nexus follows',
    acompanha: [
      { titulo: 'Brazilian indicators', desc: 'Exchange rate, interest, inflation, employment and activity, from official sources such as the Central Bank and IBGE, updated daily, with the reliability and date of each figure.' },
      { titulo: 'World economy', desc: 'Brent oil, world growth and inflation, the commodities Brazil exports most (IMF), fuel prices at the pump (ANP) and foreign trade.' },
      { titulo: 'Global Radar', desc: 'Relevant changes detected automatically. What affects your sector is flagged "Affects your industry".' },
      { titulo: 'News and Tax Reform', desc: 'Headlines by channel, with links to the full story and to the Brazilian Senate’s official page.' },
      { titulo: 'Search with official sources', desc: 'For each indicator: the official figure, the public source, the collection time, the value a month earlier and the news of the last 30 days.' },
      { titulo: 'Source health', desc: 'Shows whether each source is up. A failing source retries within 6 hours, and almost all have a free backup.' },
    ],
    joseTitulo: 'What José does for you',
    jose: [
      { titulo: 'A reading of every event', desc: 'Impact on Brazil and the world, affected sectors, what changes for a company like yours, scenarios, risks, opportunities and how confident the reading is.' },
      { titulo: 'Daily executive panel', desc: 'The world, Brazil, alerts, risks and opportunities, with 12-month, 3, 5 and 10-year horizons — and "what you may not be seeing".' },
      { titulo: 'Natural-language chat', desc: 'Ask anything: José answers with the official indicators and your company’s numbers in Axioma.' },
      { titulo: 'A plan for your company', desc: 'Verdict, survival, where to save, what to cut, how to grow, targets and triggers to watch — saved and exportable to PDF.' },
      { titulo: 'What if...? (simulations)', desc: 'Change the dollar, Selic rate, inflation, oil or sales and see the effect on profit, cash and how many months cash lasts. José explains the result.' },
      { titulo: 'Track record', desc: 'José makes forecasts and Axioma checks them later, on time. Hits and misses are shown openly.' },
    ],
    passosTitulo: 'How it works',
    passos: [
      { titulo: 'Collection', desc: 'Every day Nexus fetches data from official, free sources, with a backup when a source is late.' },
      { titulo: 'Radar', desc: 'Relevant changes become events, linked to each company’s industry.' },
      { titulo: 'José’s reading', desc: 'José matches the economy with your company’s numbers and explains the impact.' },
      { titulo: 'Your decision', desc: 'You get the full picture. You always make the decision.' },
    ],
    compromissoTitulo: 'José’s commitments',
    compromissos: [
      'Uses only official data and your company’s numbers in Axioma: nothing is made up.',
      'Readings are interpretations, not facts, and are not investment advice.',
      'José only reads: he never deletes or changes your company’s data.',
      'Runs on Axioma’s most advanced intelligence engine, with backup engines so it never stops.',
    ],
    ctaTitulo: 'See the economy through your company’s eyes.', ctaSub: 'Nexus and José are part of Axioma’s Premium plan.', ctaBtn: 'See the plans',
    termos: 'Terms of Use', privacidade: 'Privacy Policy', direitos: '© 2026 axiomaai.com.br — Axioma AI.Tech. All rights reserved.',
  },
  es: {
    voltar: 'Volver al inicio', comecar: 'Probar 7 días gratis',
    heroTitulo: 'Nexus y José', heroSub: 'La inteligencia económica de Axioma: sigue la economía de Brasil y del mundo cada día y traduce lo que pasa en impacto para su empresa.',
    heroNota: 'Incluido en el plan Premium.',
    porqueTitulo: 'Por qué "José"', porqueTexto: 'En la historia bíblica, José de Egipto interpretó las señales y preparó al país para los siete años de vacas flacas. Es la idea de Nexus: leer las señales de hoy para que su empresa esté preparada para mañana.',
    acompanhaTitulo: 'Lo que Nexus sigue',
    acompanha: [
      { titulo: 'Indicadores de Brasil', desc: 'Tipo de cambio, tasas, inflación, empleo y actividad, de fuentes oficiales como el Banco Central y el IBGE, actualizados cada día, con la confiabilidad y la fecha de cada dato.' },
      { titulo: 'Economía mundial', desc: 'Petróleo Brent, crecimiento e inflación mundial, las materias primas que Brasil más exporta (FMI), combustibles en las estaciones (ANP) y comercio exterior.' },
      { titulo: 'Radar Global', desc: 'Cambios relevantes detectados automáticamente. Lo que afecta a su sector viene marcado con "Afecta a su rubro".' },
      { titulo: 'Noticias y Reforma Tributaria', desc: 'Titulares por canal, con enlace a la nota completa y a la página oficial del Senado de Brasil.' },
      { titulo: 'Buscar con fuente oficial', desc: 'En cada indicador: el dato oficial, la fuente pública, la hora de la recolección, el valor de un mes antes y las noticias de los últimos 30 días.' },
      { titulo: 'Salud de las fuentes', desc: 'Muestra si cada fuente está activa. Una fuente caída reintenta en hasta 6 horas, y casi todas tienen una reserva gratuita.' },
    ],
    joseTitulo: 'Lo que José hace por usted',
    jose: [
      { titulo: 'Lectura de cada evento', desc: 'Impacto en Brasil y en el mundo, sectores afectados, qué cambia para una empresa como la suya, escenarios, riesgos, oportunidades y el grado de confianza de la lectura.' },
      { titulo: 'Panel ejecutivo diario', desc: 'El mundo, Brasil, alertas, riesgos y oportunidades, con horizontes de 12 meses, 3, 5 y 10 años — y "lo que quizá no está viendo".' },
      { titulo: 'Conversación en lenguaje natural', desc: 'Pregunte lo que quiera: José responde con los indicadores oficiales y los números de su empresa en Axioma.' },
      { titulo: 'Plan para su empresa', desc: 'Veredicto, supervivencia, dónde ahorrar, qué recortar, cómo crecer, metas y señales a vigilar — guardado y exportable en PDF.' },
      { titulo: '¿Y si...? (simulaciones)', desc: 'Cambie dólar, Selic, inflación, petróleo o ventas y vea el efecto en la utilidad, la caja y cuántos meses dura la caja. José explica el resultado.' },
      { titulo: 'Marcador de aciertos', desc: 'José hace previsiones y Axioma las verifica después, en plazo. Aciertos y errores quedan a la vista.' },
    ],
    passosTitulo: 'Cómo funciona',
    passos: [
      { titulo: 'Recolección', desc: 'Cada día Nexus busca los datos en fuentes oficiales y gratuitas, con reserva cuando una fuente se atrasa.' },
      { titulo: 'Radar', desc: 'Los cambios relevantes se convierten en eventos, ligados al rubro de cada empresa.' },
      { titulo: 'Lectura de José', desc: 'José cruza la economía con los números de su empresa y explica el impacto.' },
      { titulo: 'Su decisión', desc: 'Usted recibe el panorama completo. Usted siempre decide.' },
    ],
    compromissoTitulo: 'Compromisos de José',
    compromissos: [
      'Solo usa datos oficiales y los números de su empresa en Axioma: nada es inventado.',
      'Las lecturas son interpretaciones, no hechos, y no son recomendación de inversión.',
      'José solo lee: nunca borra ni altera datos de su empresa.',
      'Usa el motor de inteligencia más avanzado de Axioma, con motores de reserva para no detenerse nunca.',
    ],
    ctaTitulo: 'Vea la economía con los ojos de su empresa.', ctaSub: 'Nexus y José forman parte del plan Premium de Axioma.', ctaBtn: 'Ver los planes',
    termos: 'Términos de Uso', privacidade: 'Política de Privacidad', direitos: '© 2026 axiomaai.com.br — Axioma AI.Tech. Todos los derechos reservados.',
  },
}

const MENTA = '#2ecc9b'
const TEXTO = '#eaf2ff'
const CORPO = '#cfe0fa'
const MUTED = '#9ab6e2'

export default function NexusJosePage() {
  const [lang, setLang] = useState<Lang>('pt')
  const t = T[lang]
  const titulo = { fontFamily: cinzel.style.fontFamily, color: TEXTO }

  const cartao = (it: Item, i: number) => (
    <div key={i} className="nj-card relative rounded-2xl p-5" style={{ background: 'rgba(4,10,22,0.97)', border: '1px solid rgba(46,204,155,0.2)' }}>
      <h3 className="text-lg font-bold mb-2" style={{ ...titulo, color: MENTA }}>{it.titulo}</h3>
      <p className="text-[15px] leading-relaxed" style={{ color: CORPO }}>{it.desc}</p>
    </div>
  )

  return (
    <div style={{ background: '#020810', minHeight: '100vh' }}>
      <nav className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-10 py-3" style={{ background: 'rgba(2,8,16,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(46,204,155,0.12)' }}>
        <a href="/" className="flex items-center gap-3">
          <img src="/logo-aitech.png" alt="Axioma" style={{ width: 34, height: 34 }} />
          <span className="font-black tracking-[0.25em] text-sm" style={{ color: TEXTO }}>AXIOMA</span>
        </a>
        <div className="flex items-center gap-2">
          {(['pt', 'en', 'es'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className="text-xs px-2 py-1 rounded-full font-bold"
              style={{ background: lang === l ? 'rgba(46,204,155,0.2)' : 'transparent', color: lang === l ? MENTA : MUTED, border: '1px solid rgba(46,204,155,0.25)' }}>
              {l === 'pt' ? '🇧🇷' : l === 'en' ? '🇺🇸' : '🇪🇸'}
            </button>
          ))}
          <a href="/cadastro" className="px-4 py-2 rounded-xl font-bold text-xs" style={{ background: 'linear-gradient(135deg,#0a4f3b,#0f7d5c)', color: '#fff' }}>{t.comecar}</a>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4">
        {/* Abertura */}
        <section className="py-16 md:py-24 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-center">
          <div className="mx-auto"><JosephAvatar tamanho={200} /></div>
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight" style={titulo}>{t.heroTitulo}</h1>
            <p className="text-lg md:text-xl leading-relaxed mb-4 max-w-2xl" style={{ color: CORPO }}>{t.heroSub}</p>
            <p className="text-sm font-semibold mb-6" style={{ color: MENTA }}>{t.heroNota}</p>
            <div className="flex flex-wrap gap-3">
              <a href="/cadastro" className="px-6 py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg,#0a4f3b,#0f7d5c)', color: '#fff' }}>{t.comecar}</a>
              <a href="/" className="px-6 py-3 rounded-xl font-bold text-sm" style={{ background: '#101b3d', color: '#fff', border: '1px solid rgba(46,204,155,0.3)' }}>{t.voltar}</a>
            </div>
          </div>
        </section>

        {/* Por que José */}
        <section className="pb-16">
          <div className="rounded-2xl p-6 md:p-8 max-w-3xl" style={{ background: 'rgba(46,204,155,0.05)', borderLeft: `3px solid ${MENTA}` }}>
            <h2 className="text-2xl font-bold mb-3" style={titulo}>{t.porqueTitulo}</h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: CORPO }}>{t.porqueTexto}</p>
          </div>
        </section>

        <section className="pb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={titulo}>{t.acompanhaTitulo}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{t.acompanha.map(cartao)}</div>
        </section>

        <section className="pb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={titulo}>{t.joseTitulo}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{t.jose.map(cartao)}</div>
        </section>

        {/* Sequência real: coleta → radar → leitura → decisão */}
        <section className="pb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={titulo}>{t.passosTitulo}</h2>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {t.passos.map((p, i) => (
              <li key={i} className="nj-card relative rounded-2xl p-5" style={{ background: 'rgba(4,10,22,0.97)', border: '1px solid rgba(46,204,155,0.2)' }}>
                <span className="block text-3xl font-bold mb-2" style={{ ...titulo, color: MENTA }}>{i + 1}</span>
                <h3 className="text-lg font-bold mb-1" style={{ color: TEXTO }}>{p.titulo}</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: CORPO }}>{p.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="pb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={titulo}>{t.compromissoTitulo}</h2>
          <ul className="space-y-3 max-w-3xl">
            {t.compromissos.map((c, i) => (
              <li key={i} className="flex gap-3 text-base md:text-lg" style={{ color: CORPO }}>
                <span style={{ color: MENTA }}>✓</span><span>{c}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="pb-20 text-center">
          <div className="rounded-3xl p-8 md:p-12" style={{ background: 'linear-gradient(180deg,#0a1628,#0f2346)', border: '1px solid rgba(46,204,155,0.3)' }}>
            <h2 className="text-2xl md:text-4xl font-bold mb-3" style={titulo}>{t.ctaTitulo}</h2>
            <p className="text-base md:text-lg mb-6" style={{ color: CORPO }}>{t.ctaSub}</p>
            <a href="/cadastro" className="inline-block px-8 py-3.5 rounded-xl font-bold" style={{ background: 'linear-gradient(135deg,#0a4f3b,#0f7d5c)', color: '#fff' }}>{t.ctaBtn}</a>
          </div>
        </section>
      </main>

      <footer className="text-center py-8 px-4" style={{ borderTop: '1px solid rgba(46,204,155,0.12)' }}>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-3 text-xs" style={{ color: MUTED }}>
          <a href="/termos" className="hover:text-[#2ecc9b]">{t.termos}</a><span aria-hidden="true">·</span>
          <a href="/privacidade" className="hover:text-[#2ecc9b]">{t.privacidade}</a>
        </nav>
        <p className="text-xs" style={{ color: '#5a7aaa' }}>{t.direitos}</p>
      </footer>

      <style jsx global>{`
        .nj-card { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
        .nj-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #2ecc9b; border-radius: 16px 16px 0 0; opacity: 0; transition: opacity 0.25s ease; }
        .nj-card:hover { transform: translateY(-4px); border-color: rgba(46,204,155,0.6) !important; box-shadow: 0 0 40px rgba(46,204,155,0.15); }
        .nj-card:hover::before { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .nj-card, .nj-card:hover { transform: none; } }
      `}</style>
    </div>
  )
}
