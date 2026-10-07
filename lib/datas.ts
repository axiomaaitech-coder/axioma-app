// Motor de hora do Axioma — "hoje" e "agora" certos SOZINHOS, sem ninguém configurar:
//
// HORA: vem do servidor (/api/hora, sincronizado por NTP), não do relógio do aparelho.
//   Se o computador estiver adiantado/atrasado, o Axioma corrige pela diferença medida
//   (com desconto do tempo de ida e volta da rede) e confere de novo a cada 10 minutos,
//   ao voltar para a aba e ao reconectar (components/RelogioAxioma.tsx).
//
// FUSO, nesta ordem (o 1º que existir vence):
//   1. Estado/cidade da empresa ativa (Brasil: fuso oficial de cada UF; Noronha pela cidade);
//   2. Fuso da conexão de internet (país/região detectados pela Vercel pelo IP);
//   3. Fuso do aparelho;
//   4. Idioma escolhido no Axioma (pt → Brasília, es → Madri, en → Nova York);
//   5. Brasília.
// Antes o Axioma usava new Date().toISOString().slice(0, 10) — o dia em UTC: entre 21h
// e meia-noite (Brasília) virava "amanhã".
const PADRAO = 'America/Sao_Paulo'
const FUSO_IDIOMA: Record<string, string> = { pt: 'America/Sao_Paulo', es: 'Europe/Madrid', en: 'America/New_York' }

// Fuso oficial (IANA) de cada UF. Horário de verão não existe no Brasil desde 2019;
// usar o nome IANA (e não "-03:00" fixo) mantém certo se a lei mudar de novo.
const FUSO_UF: Record<string, string> = {
  AC: 'America/Rio_Branco', AM: 'America/Manaus', RO: 'America/Porto_Velho', RR: 'America/Boa_Vista',
  MT: 'America/Cuiaba', MS: 'America/Campo_Grande',
  PA: 'America/Belem', AP: 'America/Belem', TO: 'America/Araguaina', MA: 'America/Fortaleza', PI: 'America/Fortaleza',
  CE: 'America/Fortaleza', RN: 'America/Fortaleza', PB: 'America/Fortaleza', PE: 'America/Recife', AL: 'America/Maceio',
  SE: 'America/Maceio', BA: 'America/Bahia', GO: 'America/Sao_Paulo', DF: 'America/Sao_Paulo', MG: 'America/Sao_Paulo',
  ES: 'America/Sao_Paulo', RJ: 'America/Sao_Paulo', SP: 'America/Sao_Paulo', PR: 'America/Sao_Paulo',
  SC: 'America/Sao_Paulo', RS: 'America/Sao_Paulo',
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const noNavegador = () => typeof window !== 'undefined'
const ler = (k: string) => { try { return noNavegador() ? sessionStorage.getItem(k) : null } catch { return null } }
const gravar = (k: string, v: string | null) => {
  if (!noNavegador()) return
  try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v) } catch { /* aba sem armazenamento: vale só agora */ }
}
const fusoValido = (f: string | null | undefined): f is string => {
  if (!f) return false
  try { new Intl.DateTimeFormat('en-CA', { timeZone: f }); return true } catch { return false }
}

// Fuso de uma empresa pelo cadastro (null = deixa as outras regras decidirem).
export function fusoDaEmpresa(uf?: string | null, cidade?: string | null, pais?: string | null): string | null {
  if (pais && !['br', 'bra', 'brasil', 'brazil'].includes(semAcento(pais))) return null
  if (cidade && semAcento(cidade).includes('fernando de noronha')) return 'America/Noronha'
  return (uf && FUSO_UF[uf.trim().toUpperCase()]) || null
}

// ─── Estado do motor (por aba) ───
const K_EMPRESA = 'axioma_fuso_empresa', K_REDE = 'axioma_fuso_rede', K_DESVIO = 'axioma_desvio_relogio', K_IDIOMA = 'axioma_idioma_fuso'
let fusoEmpresa: string | null = null
let fusoRede: string | null = null
let idioma: string | null = null
let desvioMs: number | null = null // hora do servidor − hora do aparelho

export function definirFusoEmpresa(fuso: string | null) {
  fusoEmpresa = fusoValido(fuso) ? fuso : null
  gravar(K_EMPRESA, fusoEmpresa)
}
export function definirIdiomaFuso(lang: string | null) {
  idioma = lang
  gravar(K_IDIOMA, lang)
}

// "Agora" corrigido pela hora oficial (o relógio do aparelho pode estar errado).
export function agora(): number {
  if (desvioMs == null) { const salvo = Number(ler(K_DESVIO)); desvioMs = Number.isFinite(salvo) ? salvo : 0 }
  return Date.now() + desvioMs
}

const fusoDoAparelho = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null } catch { return null } }

export function fusoAtivo(): string {
  if (!noNavegador()) return PADRAO
  const empresa = fusoEmpresa ?? ler(K_EMPRESA)
  if (fusoValido(empresa)) return empresa
  const rede = fusoRede ?? ler(K_REDE)
  if (fusoValido(rede)) return rede
  const aparelho = fusoDoAparelho()
  if (fusoValido(aparelho)) return aparelho
  const porIdioma = FUSO_IDIOMA[idioma ?? ler(K_IDIOMA) ?? 'pt']
  return fusoValido(porIdioma) ? porIdioma : PADRAO
}

// Pede a hora oficial e o fuso da conexão ao servidor. Nunca lança.
export async function sincronizarRelogio(): Promise<void> {
  if (!noNavegador()) return
  try {
    const ida = Date.now()
    const res = await fetch('/api/hora', { cache: 'no-store' })
    const volta = Date.now()
    if (!res.ok) return
    const j = await res.json() as { agora?: number; fuso?: string | null }
    // Ida e volta lenta demais = medida imprecisa: mantém o desvio anterior.
    if (typeof j.agora === 'number' && volta - ida < 5000) {
      desvioMs = Math.round(j.agora - (ida + volta) / 2)
      // Diferença menor que 2s é ruído de rede, não relógio errado.
      if (Math.abs(desvioMs) < 2000) desvioMs = 0
      gravar(K_DESVIO, String(desvioMs))
    }
    if (fusoValido(j.fuso)) { fusoRede = j.fuso; gravar(K_REDE, j.fuso) }
  } catch { /* sem rede: segue com o último desvio/fuso conhecidos */ }
}

const formatos = new Map<string, Intl.DateTimeFormat>()
// "Hoje" (YYYY-MM-DD) no fuso certo. No servidor, passe o fuso da empresa quando houver.
export function hojeISO(base: Date = new Date(agora()), fuso: string = fusoAtivo()): string {
  let f = formatos.get(fuso)
  if (!f) { f = new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }); formatos.set(fuso, f) }
  return f.format(base)
}
