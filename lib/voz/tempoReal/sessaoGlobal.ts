// ═══════════════════════════════════════════════════════════════
// Conversa ao vivo que CONTINUA quando a pessoa troca de tela (pedido do CEO, 2026-10-16: conferir em
// Custos Fixos/Variáveis enquanto o José fala). A sessão mora aqui (fora das telas), a barra fixa
// (components/BarraVozGlobal) mostra o microfone aberto em qualquer página e permite encerrar.
// A tela de origem, quando está aberta, recebe as falas no chat e pode fornecer uma consulta mais rica
// (registrarTela); fora dela, a consulta usa o mesmo motor com o histórico desta conversa.
// Recarregar a página (F5) ou fechar a aba encerra (limite do navegador).
// ═══════════════════════════════════════════════════════════════
import { perguntarAoAxioma } from '../../ia/cliente'
import type { IdiomaFala } from '../textoFala'
import { iniciarConversaAoVivo, type EstadoConversa, type SessaoAoVivo } from './cliente'
import type { FornecedorTR, TelaTR } from './servidor'

export type TelaConversa = TelaTR
type Fala = { quem: 'voce' | 'jose'; texto: string }
export type EstadoGlobal = { ativa: boolean; estado: EstadoConversa | null; tela: TelaConversa | null; caminho: string; ultimaFala: Fala | null; aviso: string }
type Tela = { aoFalar: (quem: 'voce' | 'jose', texto: string) => void; consultar?: (pergunta: string) => Promise<string> }

const INICIAL: EstadoGlobal = { ativa: false, estado: null, tela: null, caminho: '', ultimaFala: null, aviso: '' }
let atual: EstadoGlobal = INICIAL
const ouvintes = new Set<() => void>()
const mudar = (p: Partial<EstadoGlobal>) => { atual = { ...atual, ...p }; ouvintes.forEach((f) => f()) }
export const estadoConversaGlobal = () => atual
export const estadoConversaInicial = () => INICIAL
export function assinarConversaGlobal(f: () => void): () => void { ouvintes.add(f); return () => { ouvintes.delete(f) } }

let sessao: SessaoAoVivo | null = null
let falas: Fala[] = []
let entregues = 0
let telaAberta: Tela | null = null
let contexto: { empresaId: string; lang: IdiomaFala; tela: TelaConversa } | null = null

const ATIVOS: EstadoConversa[] = ['conectando', 'ouvindo', 'consultando', 'falando']
const FORMATO: Record<IdiomaFala, string> = {
  pt: 'FORMATO: resposta para ser FALADA numa conversa ao vivo — no máximo 4 frases curtas, sem listas, valores e período claros; mantenha os rótulos Fato/Estimativa/Cenário e os avisos.',
  en: 'FORMAT: answer to be SPOKEN in a live conversation — at most 4 short sentences, no lists, clear amounts and period; keep the Fact/Estimate/Scenario labels and the notes.',
  es: 'FORMATO: respuesta para ser HABLADA en una conversación en vivo — máximo 4 frases cortas, sin listas, valores y período claros; mantenga las etiquetas Hecho/Estimación/Escenario y los avisos.',
}
const FALHA: Record<IdiomaFala, string> = { pt: 'Não foi possível consultar os dados agora.', en: 'It was not possible to check the data right now.', es: 'No fue posible consultar los datos ahora.' }

function entregarPendentes() {
  if (!telaAberta) return
  while (entregues < falas.length) { const f = falas[entregues++]; telaAberta.aoFalar(f.quem, f.texto) }
}

// A tela de origem se registra ao abrir e sai ao fechar (a conversa continua)
export function registrarTela(tela: TelaConversa, t: Tela): () => void {
  if (contexto?.tela === tela) { telaAberta = t; entregarPendentes() }
  else if (!contexto) telaAberta = t
  const minha = t
  return () => { if (telaAberta === minha) telaAberta = null }
}
export function atualizarTela(tela: TelaConversa, t: Tela) { if (contexto?.tela === tela && telaAberta) telaAberta = t }

// Consulta padrão (tela fechada): o mesmo motor, com o histórico desta conversa
async function consultarPadrao(pergunta: string): Promise<string> {
  if (!contexto) return FALHA.pt
  const { empresaId, lang, tela } = contexto
  const historico = falas.slice(-8).map((f) => ({ role: f.quem === 'voce' ? 'user' : 'assistant', content: f.texto }))
  const ia = await perguntarAoAxioma({ pergunta, empresaId, tela, lang, historico, contextoTela: FORMATO[lang] })
  return ia?.resposta ?? FALHA[lang]
}

export async function iniciarConversaGlobal(p: { fornecedor: FornecedorTR; empresaId: string; lang: IdiomaFala; tela: TelaConversa; caminho: string; tela_aberta: Tela }) {
  if (atual.ativa) return
  sessao?.encerrar('usuario')
  falas = []; entregues = 0
  contexto = { empresaId: p.empresaId, lang: p.lang, tela: p.tela }
  telaAberta = p.tela_aberta
  mudar({ ativa: true, estado: 'conectando', tela: p.tela, caminho: p.caminho, ultimaFala: null, aviso: '' })
  sessao = await iniciarConversaAoVivo({
    fornecedor: p.fornecedor, empresaId: p.empresaId, lang: p.lang, tela: p.tela,
    consultar: (pergunta) => (telaAberta?.consultar ?? consultarPadrao)(pergunta),
    eventos: {
      estado: (e) => mudar({ estado: e, ativa: ATIVOS.includes(e) }),
      fala: (quem, texto) => { falas.push({ quem, texto }); mudar({ ultimaFala: { quem, texto } }); entregarPendentes() },
      erro: (m) => mudar({ aviso: m }),
      fim: (motivo) => { mudar({ ativa: false, aviso: motivo === 'silencio' || motivo === 'tempo_esgotado' ? motivo : atual.aviso }); sessao = null },
    },
  })
  if (!sessao) mudar({ ativa: false })
}

export function encerrarConversaGlobal() { sessao?.encerrar('usuario') }
