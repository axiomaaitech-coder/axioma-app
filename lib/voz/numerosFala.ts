// AXIOMA VOICE INTELLIGENCE — números para FALAR. Nenhuma voz (do aparelho ou do fornecedor) lê dinheiro
// brasileiro de forma confiável: "R$ 59.000,00" virava "59 reais" (o ponto de milhar era lido como fim de
// frase/decimal). Aqui o valor em dinheiro vira POR EXTENSO no idioma da resposta e os demais números perdem
// o separador de milhar — a voz recebe só o que não tem como ler errado. Testes: scripts/check-voz-fase2.mts.
import type { IdiomaFala } from './textoFala'

// ─── Por extenso (inteiros até trilhões) ───
const PT_U = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const PT_D = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const PT_C = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']
function pt999(n: number): string {
  if (n === 100) return 'cem'
  const c = Math.floor(n / 100), r = n % 100, p: string[] = []
  if (c) p.push(PT_C[c])
  if (r) p.push(r < 20 ? PT_U[r] : PT_D[Math.floor(r / 10)] + (r % 10 ? ' e ' + PT_U[r % 10] : ''))
  return p.join(' e ')
}
function ptExtenso(n: number): string {
  if (n < 1000) return n === 0 ? 'zero' : pt999(n)
  const escalas: [number, string, string][] = [[1e12, 'um trilhão', 'trilhões'], [1e9, 'um bilhão', 'bilhões'], [1e6, 'um milhão', 'milhões'], [1e3, 'mil', 'mil']]
  for (const [s, um, plural] of escalas) {
    if (n < s) continue
    const q = Math.floor(n / s), r = n % s
    const cab = q === 1 ? um : `${ptExtenso(q)} ${plural}`
    if (!r) return cab
    return cab + (r < 100 || r % 100 === 0 ? ' e ' : ' ') + ptExtenso(r)
  }
  return pt999(n)
}

const ES_U = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const ES_D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const ES_C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']
function es999(n: number): string {
  if (n === 100) return 'cien'
  const c = Math.floor(n / 100), r = n % 100, p: string[] = []
  if (c) p.push(ES_C[c])
  if (r) p.push(r < 30 ? ES_U[r] : ES_D[Math.floor(r / 10)] + (r % 10 ? ' y ' + ES_U[r % 10] : ''))
  return p.join(' ')
}
// "uno" vira "un" antes de substantivo/mil/millón (veintiún mil, un real)
const esApocope = (s: string) => s.replace(/veintiuno$/, 'veintiún').replace(/\buno$/, 'un')
function esExtenso(n: number, antesDeNome = false): string {
  const fim = (s: string) => (antesDeNome ? esApocope(s) : s)
  if (n < 1000) return fim(n === 0 ? 'cero' : es999(n))
  if (n >= 1e12) { const q = Math.floor(n / 1e12), r = n % 1e12; return (q === 1 ? 'un billón' : `${esExtenso(q, true)} billones`) + (r ? ' ' + esExtenso(r, antesDeNome) : '') }
  if (n >= 1e6) { const q = Math.floor(n / 1e6), r = n % 1e6; return (q === 1 ? 'un millón' : `${esExtenso(q, true)} millones`) + (r ? ' ' + esExtenso(r, antesDeNome) : '') }
  const q = Math.floor(n / 1000), r = n % 1000
  return (q === 1 ? 'mil' : `${esExtenso(q, true)} mil`) + (r ? ' ' + fim(es999(r)) : '')
}

const EN_U = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const EN_D = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
function en999(n: number): string {
  const c = Math.floor(n / 100), r = n % 100, p: string[] = []
  if (c) p.push(`${EN_U[c]} hundred`)
  if (r) p.push(r < 20 ? EN_U[r] : EN_D[Math.floor(r / 10)] + (r % 10 ? '-' + EN_U[r % 10] : ''))
  return p.join(' ')
}
function enExtenso(n: number): string {
  if (n < 1000) return n === 0 ? 'zero' : en999(n)
  for (const [s, nome] of [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']] as [number, string][]) {
    if (n < s) continue
    const q = Math.floor(n / s), r = n % s
    return `${enExtenso(q)} ${nome}` + (r ? ' ' + enExtenso(r) : '')
  }
  return en999(n)
}

export function porExtenso(n: number, lang: IdiomaFala, antesDeNome = false): string {
  const i = Math.floor(Math.abs(n))
  return lang === 'pt' ? ptExtenso(i) : lang === 'es' ? esExtenso(i, antesDeNome) : enExtenso(i)
}

// ─── Leitura de "59.000", "59.000,50", "59,000.50", "1,2" ───
// Regra: os dois separadores → o último é o decimal; um só separador repetido → milhar;
// um só separador com exatamente 3 dígitos depois (e parte inteira ≠ 0) → milhar; senão → decimal.
export function lerNumero(s: string): { inteiro: number; decimal: string } | null {
  const temPonto = s.includes('.'), temVirgula = s.includes(',')
  let int = s, dec = ''
  if (temPonto && temVirgula) {
    const d = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ','
    const i = s.lastIndexOf(d); int = s.slice(0, i); dec = s.slice(i + 1)
  } else if (temPonto || temVirgula) {
    const sep = temPonto ? '.' : ','
    const partes = s.split(sep)
    const milhar = partes.length > 2 || (partes[1].length === 3 && partes[0] !== '0')
    if (!milhar) { int = partes[0]; dec = partes[1] }
  }
  const digitos = int.replace(/[.,]/g, '')
  if (!/^\d+$/.test(digitos) || (dec && !/^\d+$/.test(dec))) return null
  return { inteiro: Number(digitos), decimal: dec }
}

const MOEDA: Record<string, Record<IdiomaFala, [string, string]>> = {
  BRL: { pt: ['real', 'reais'], en: ['real', 'reais'], es: ['real', 'reales'] },
  USD: { pt: ['dólar', 'dólares'], en: ['dollar', 'dollars'], es: ['dólar', 'dólares'] },
  EUR: { pt: ['euro', 'euros'], en: ['euro', 'euros'], es: ['euro', 'euros'] },
}
const CENTAVO: Record<IdiomaFala, [string, string]> = { pt: ['centavo', 'centavos'], en: ['cent', 'cents'], es: ['centavo', 'centavos'] }
const E: Record<IdiomaFala, string> = { pt: ' e ', en: ' and ', es: ' con ' }
const MENOS: Record<IdiomaFala, string> = { pt: 'menos ', en: 'minus ', es: 'menos ' }
const VIRGULA: Record<IdiomaFala, string> = { pt: ' vírgula ', en: ' point ', es: ' coma ' }

export function dinheiroPorExtenso(valor: number, moeda: keyof typeof MOEDA, lang: IdiomaFala): string {
  const neg = valor < 0
  const centsTotal = Math.round(Math.abs(valor) * 100)
  const int = Math.floor(centsTotal / 100), cents = centsTotal % 100
  const [um, varios] = MOEDA[moeda][lang]
  const partes: string[] = []
  if (int > 0 || cents === 0) {
    // "um milhão DE reais" / "un millón DE reales" (milhão/bilhão redondo)
    const de = int >= 1e6 && int % 1e6 === 0 && lang !== 'en' ? 'de ' : ''
    partes.push(`${porExtenso(int, lang, true)} ${de}${int === 1 ? um : varios}`)
  }
  if (cents > 0) partes.push(`${porExtenso(cents, lang, true)} ${cents === 1 ? CENTAVO[lang][0] : CENTAVO[lang][1]}`)
  return (neg ? MENOS[lang] : '') + partes.join(E[lang])
}

const ESCALA: Record<string, number> = {
  mil: 1e3, thousand: 1e3, k: 1e3,
  'milhão': 1e6, 'milhao': 1e6, 'milhões': 1e6, 'milhoes': 1e6, mi: 1e6, million: 1e6, millions: 1e6, 'millón': 1e6, millones: 1e6, mm: 1e6,
  'bilhão': 1e9, 'bilhao': 1e9, 'bilhões': 1e9, 'bilhoes': 1e9, bi: 1e9, billion: 1e9, billions: 1e9,
}
const NUM = String.raw`\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?`
// moeda + (sinal) + número + (escala), ou sinal antes da moeda: "-R$ 500", "R$ -500", "R$ 1,2 mi", "US$ 3 mil"
const RE_DINHEIRO = new RegExp(String.raw`([-−]\s?)?(R\$|US\$|U\$|€)\s?([-−]\s?)?(${NUM})(?:\s?(mil(?:h(?:ão|ao|ões|oes))?|bilh(?:ão|ao|ões|oes)|thousand|millions?|billions?|millón|millones|mi|bi|mm|k|m)\b)?`, 'gi')
// número solto com separador (não mexe em datas 15/10/2026, horas 14:30 nem versões 2.3.1)
const RE_NUMERO = new RegExp(String.raw`(?<![\d/:.,])(${NUM})(?![\d/:]|[.,]\d)`, 'g')

export function numerosParaFala(texto: string, lang: IdiomaFala): string {
  let t = texto.replace(RE_DINHEIRO, (orig, s1: string | undefined, simbolo: string, s2: string | undefined, num: string, escala: string | undefined) => {
    const n = lerNumero(num)
    if (!n) return orig
    const valor = (n.inteiro + (n.decimal ? Number(`0.${n.decimal}`) : 0)) * (escala ? ESCALA[escala.toLowerCase()] ?? 1 : 1)
    const moeda = simbolo === '€' ? 'EUR' : simbolo.toUpperCase().startsWith('U') ? 'USD' : 'BRL'
    return dinheiroPorExtenso((s1 || s2) ? -valor : valor, moeda, lang)
  })
  t = t.replace(RE_NUMERO, (orig, num: string) => {
    if (!/[.,]/.test(num)) return orig // inteiro simples: a voz lê certo e acerta o gênero ("duas notas")
    const n = lerNumero(num)
    if (!n) return orig
    return n.decimal
      ? porExtenso(n.inteiro, lang) + VIRGULA[lang] + (/^0/.test(n.decimal) || lang === 'en' ? n.decimal.split('').map((d) => porExtenso(Number(d), lang)).join(' ') : porExtenso(Number(n.decimal), lang))
      : String(n.inteiro)
  })
  // "%" por extenso (algumas vozes leem "porcentagem" ou pulam)
  const pc = lang === 'pt' ? ' por cento' : lang === 'es' ? ' por ciento' : ' percent'
  return t.replace(/\s?%/g, pc)
}
