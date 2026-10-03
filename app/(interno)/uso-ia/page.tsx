'use client'
// ═══════════════════════════════════════════════════════════════
// USO DA IA — painel de custo e qualidade do motor de IA (B2, docs/MOTOR-IA.md).
// Lê o registro de auditoria (nexus_audit_log, ação 'ia.motor') da empresa —
// a RLS só devolve as linhas da própria empresa. Nunca mostra conteúdo de
// pergunta/resposta (a auditoria não guarda isso), só contagens e consumo.
// ponytail: soma no navegador com teto de 5000 registros no período; mover a
// agregação pra RPC no banco quando alguma empresa passar desse volume.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { useThemeAxioma } from '../../../lib/ThemeContext'
import { ThemeToggle } from '../../../components/ThemeToggle'
import { reportarFalhaLeitura } from '../../../lib/erroUiHelpers'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
type Idioma = 'pt' | 'en' | 'es'
type Registro = {
  created_at: string
  parametros: {
    tela?: string | null; nivel?: string; provedor?: string | null; escalou?: boolean; respondeu?: boolean
    valores_nao_conferidos?: number; consultas?: number; custo_usd_anthropic?: number; tokens_openai?: number
    tokens_entrada?: number; tokens_saida?: number; tokens_cache_leitura?: number
  } | null
}

const PERIODOS = [7, 30, 90] as const
const T = {
  pt: {
    titulo: 'Uso da IA', sub: 'Quanto a inteligência do Axioma foi usada, por qual caminho e quanto custou — sem nenhum conteúdo das conversas.',
    dias: (n: number) => `Últimos ${n} dias`, carregando: 'Carregando...', erro: 'Não foi possível ler o uso agora. Tente de novo em instantes.',
    vazio: 'Nenhuma pergunta à IA neste período.', perguntas: 'Perguntas', respondidas: 'respondidas',
    rotina: 'Rotina (OpenAI)', analise: 'Análise (Anthropic Sonnet)', estrategica: 'Estratégica (Anthropic Opus)',
    subiram: 'Subiram de nível', subiramDesc: 'começaram na rotina e foram para a Anthropic',
    consultas: 'Consultas a dados', consultasDesc: 'vezes que a IA buscou detalhe (contas, clientes, estoque)',
    qualidade: 'Números conferidos', qualidadeDesc: 'respostas em que todo valor em R$ bateu com os dados',
    custo: 'Custo Anthropic (estimado)', custoDesc: 'pelo preço de tabela, já com o desconto do cache',
    tokensOpenai: 'Consumo OpenAI', tokensOpenaiDesc: 'tokens — o valor em US$ fica no painel da OpenAI',
    porNivel: 'Perguntas por nível', porTela: 'Telas que mais usaram', tela: 'Tela', qtd: 'Qtd.',
    comoFunciona: 'Como funciona: perguntas simples vão para a OpenAI (barata); análise e decisões grandes vão para a Anthropic. Se a OpenAI não dá conta, a pergunta sobe sozinha.',
  },
  en: {
    titulo: 'AI usage', sub: 'How much Axioma’s intelligence was used, through which path and what it cost — no conversation content.',
    dias: (n: number) => `Last ${n} days`, carregando: 'Loading...', erro: 'Could not read usage right now. Try again shortly.',
    vazio: 'No AI questions in this period.', perguntas: 'Questions', respondidas: 'answered',
    rotina: 'Routine (OpenAI)', analise: 'Analysis (Anthropic Sonnet)', estrategica: 'Strategic (Anthropic Opus)',
    subiram: 'Escalated', subiramDesc: 'started as routine and went to Anthropic',
    consultas: 'Data lookups', consultasDesc: 'times the AI fetched detail (bills, customers, inventory)',
    qualidade: 'Numbers verified', qualidadeDesc: 'answers where every R$ value matched the data',
    custo: 'Anthropic cost (estimated)', custoDesc: 'at list price, cache discount included',
    tokensOpenai: 'OpenAI usage', tokensOpenaiDesc: 'tokens — the US$ amount is in the OpenAI dashboard',
    porNivel: 'Questions by level', porTela: 'Screens that used it most', tela: 'Screen', qtd: 'Qty',
    comoFunciona: 'How it works: simple questions go to OpenAI (cheap); analysis and big decisions go to Anthropic. If OpenAI can’t handle it, the question escalates automatically.',
  },
  es: {
    titulo: 'Uso de la IA', sub: 'Cuánto se usó la inteligencia de Axioma, por qué camino y cuánto costó — sin ningún contenido de las conversaciones.',
    dias: (n: number) => `Últimos ${n} días`, carregando: 'Cargando...', erro: 'No fue posible leer el uso ahora. Intente de nuevo en instantes.',
    vazio: 'Ninguna pregunta a la IA en este período.', perguntas: 'Preguntas', respondidas: 'respondidas',
    rotina: 'Rutina (OpenAI)', analise: 'Análisis (Anthropic Sonnet)', estrategica: 'Estratégica (Anthropic Opus)',
    subiram: 'Subieron de nivel', subiramDesc: 'empezaron en rutina y fueron a Anthropic',
    consultas: 'Consultas de datos', consultasDesc: 'veces que la IA buscó detalle (cuentas, clientes, inventario)',
    qualidade: 'Números verificados', qualidadeDesc: 'respuestas en que todo valor en R$ coincidió con los datos',
    custo: 'Costo Anthropic (estimado)', custoDesc: 'a precio de lista, con el descuento del caché',
    tokensOpenai: 'Consumo OpenAI', tokensOpenaiDesc: 'tokens — el valor en US$ está en el panel de OpenAI',
    porNivel: 'Preguntas por nivel', porTela: 'Pantallas que más usaron', tela: 'Pantalla', qtd: 'Cant.',
    comoFunciona: 'Cómo funciona: las preguntas simples van a OpenAI (barata); el análisis y las decisiones grandes van a Anthropic. Si OpenAI no puede, la pregunta sube sola.',
  },
}

export default function UsoIaPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma
  const t = T[lang]
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const TEXTO = temaClaro ? '#101b3d' : '#e6edf5'
  const MUTED = temaClaro ? '#374151' : '#a3b1c2'
  const CREME = temaClaro ? '#f6f7c4' : undefined
  // Caixa aninhada: bege translúcido no Claro (regra permanente), padrão original no Escuro.
  const NESTED = temaClaro ? { background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(16,27,61,0.12)' } : { background: 'rgba(2,8,16,0.5)', border: '1px solid rgba(106,176,255,0.15)' }
  const ACENTO = temaClaro ? '#16a97d' : '#2ecc9b'
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'

  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(30)
  const [registros, setRegistros] = useState<Registro[] | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      setRegistros(null); setErro(false)
      const empresaId = await obterEmpresaAtiva()
      if (!empresaId) { if (!cancelado) setRegistros([]); return }
      const desde = new Date(Date.now() - dias * 86400000).toISOString()
      const { data, error } = await supabase.from('nexus_audit_log').select('created_at, parametros')
        .eq('empresa_id', empresaId).eq('acao', 'ia.motor').gte('created_at', desde).order('created_at', { ascending: false }).limit(5000)
      if (cancelado) return
      if (error) { reportarFalhaLeitura('uso-ia.carregar', new Error(error.message)); setErro(true); return }
      setRegistros((data ?? []) as Registro[])
    })()
    return () => { cancelado = true }
  }, [dias])

  const r = useMemo(() => {
    const ls = registros ?? []
    const p = (x: Registro) => x.parametros ?? {}
    const porTela = new Map<string, number>()
    for (const x of ls) { const k = p(x).tela || '—'; porTela.set(k, (porTela.get(k) || 0) + 1) }
    const respondidas = ls.filter((x) => p(x).respondeu)
    return {
      total: ls.length,
      respondidas: respondidas.length,
      nivel: { rotina: ls.filter((x) => p(x).nivel === 'rotina').length, analise: ls.filter((x) => p(x).nivel === 'analise').length, estrategica: ls.filter((x) => p(x).nivel === 'estrategica').length },
      subiram: ls.filter((x) => p(x).escalou).length,
      consultas: ls.reduce((s, x) => s + (p(x).consultas || 0), 0),
      conferidas: respondidas.filter((x) => !p(x).valores_nao_conferidos).length,
      custo: ls.reduce((s, x) => s + (p(x).custo_usd_anthropic || 0), 0),
      tokensOpenai: ls.reduce((s, x) => s + (p(x).tokens_openai || 0), 0),
      telas: [...porTela.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    }
  }, [registros])

  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')
  const num = (v: number) => v.toLocaleString(locale)
  // Função de desenho (não componente dentro da tela — seria recriado a cada atualização).
  const card = (titulo: string, valor: string, desc: string) => (
    <div key={titulo} className="rounded-xl p-4" style={NESTED}>
      <p className="text-xs font-semibold" style={{ color: MUTED }}>{titulo}</p>
      <p className="text-2xl font-black mt-1" style={{ color: TEXTO }}>{valor}</p>
      <p className="text-[11px] mt-1" style={{ color: MUTED }}>{desc}</p>
    </div>
  )

  return (
    <div data-theme={tema}>
      <ModuloLayout titulo={t.titulo} subtitulo={t.sub} botaoExtra={<ThemeToggle />}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PERIODOS.map((d) => (
              <button key={d} onClick={() => setDias(d)} className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={dias === d ? { background: temaClaro ? '#101b3d' : 'rgba(46,204,155,0.2)', color: temaClaro ? '#ffffff' : '#e6edf5', border: `1px solid ${temaClaro ? '#101b3d' : 'rgba(46,204,155,0.5)'}` } : { ...NESTED, color: TEXTO }}>
                {t.dias(d)}
              </button>
            ))}
          </div>

          <CanvasBox cor={ACENTO} fundo={CREME} premium3d>
            {erro ? <p className="text-sm py-6 text-center" style={{ color: TEXTO }}>{t.erro}</p>
              : registros === null ? <p className="text-sm py-6 text-center" style={{ color: MUTED }}>{t.carregando}</p>
              : r.total === 0 ? <p className="text-sm py-6 text-center" style={{ color: TEXTO }}>{t.vazio}</p>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {card(t.perguntas, num(r.total), `${num(r.respondidas)} ${t.respondidas}`)}
                  {card(t.subiram, `${num(r.subiram)} (${pct(r.subiram, r.total)})`, t.subiramDesc)}
                  {card(t.qualidade, pct(r.conferidas, r.respondidas), t.qualidadeDesc)}
                  {card(t.consultas, num(r.consultas), t.consultasDesc)}
                  {card(t.custo, `US$ ${r.custo.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`, t.custoDesc)}
                  {card(t.tokensOpenai, num(r.tokensOpenai), t.tokensOpenaiDesc)}
                </div>
              )}
          </CanvasBox>

          {!!registros?.length && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CanvasBox cor={ACENTO} fundo={CREME} premium3d>
                <p className="text-sm font-black mb-3" style={{ color: TEXTO }}>{t.porNivel}</p>
                <div className="space-y-2">
                  {([['rotina', t.rotina], ['analise', t.analise], ['estrategica', t.estrategica]] as const).map(([k, rotulo]) => (
                    <div key={k} className="rounded-xl p-3" style={NESTED}>
                      <div className="flex justify-between text-xs font-semibold" style={{ color: TEXTO }}>
                        <span>{rotulo}</span><span>{num(r.nivel[k])} · {pct(r.nivel[k], r.total)}</span>
                      </div>
                      <div className="h-1.5 rounded-full mt-2" style={{ background: temaClaro ? 'rgba(16,27,61,0.08)' : 'rgba(46,204,155,0.1)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: pct(r.nivel[k], r.total), background: ACENTO }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CanvasBox>
              <CanvasBox cor={ACENTO} fundo={CREME} premium3d>
                <p className="text-sm font-black mb-3" style={{ color: TEXTO }}>{t.porTela}</p>
                <div className="rounded-xl overflow-hidden" style={NESTED}>
                  <div className="flex justify-between px-3 py-2 text-[11px] font-bold" style={{ color: MUTED }}><span>{t.tela}</span><span>{t.qtd}</span></div>
                  {r.telas.map(([tela, qtd]) => (
                    <div key={tela} className="flex justify-between px-3 py-2 text-xs" style={{ color: TEXTO, borderTop: temaClaro ? '1px solid rgba(16,27,61,0.08)' : '1px solid rgba(46,204,155,0.08)' }}>
                      <span>{tela}</span><span className="font-bold">{num(qtd)}</span>
                    </div>
                  ))}
                </div>
              </CanvasBox>
            </div>
          )}

          <p className="text-xs px-1" style={{ color: MUTED }}>{t.comoFunciona}</p>
        </div>
      </ModuloLayout>
    </div>
  )
}
