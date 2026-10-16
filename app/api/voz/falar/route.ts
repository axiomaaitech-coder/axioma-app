import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { comRetentativa } from '@/lib/antiFalha'
import { vozAtivaPara } from '@/lib/voz/servidor'
import { assinaturaValida } from '@/lib/voz/assinatura'
import { fornecedorFala, processarFala, type Fornecedor } from '@/lib/voz/fala'
import { primeiroNome, type IdiomaFala } from '@/lib/voz/textoFala'

// ═══════════════════════════════════════════════════════════════
// AXIOMA VOICE INTELLIGENCE — Fase 2: POST /api/voz/falar { empresa_id, texto, assinatura, lang, ressalva }
// Lê em voz alta SÓ a resposta que o motor assinou (lib/voz/assinatura.ts). Regra em lib/voz/fala.ts.
// Fornecedor por variável: VOZ_FALA=elevenlabs (ELEVENLABS_API_KEY, ELEVENLABS_VOZ_ID) ou VOZ_FALA=openai
// (OPENAI_API_KEY, VOZ_FALA_OPENAI_VOZ). Sem variável: 409 fala_no_aparelho → o navegador fala de graça.
// GET ?empresa_id= → { ativa, fornecedor } (o botão Ouvir só aparece se a voz estiver liberada).
// Áudio sai em fluxo direto do fornecedor para a pessoa: nada é guardado aqui.
// ═══════════════════════════════════════════════════════════════
export const maxDuration = 60
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ENV_VOZ = () => ({ VOZ_ATIVA: process.env.VOZ_ATIVA, VOZ_EMPRESAS_TESTE: process.env.VOZ_EMPRESAS_TESTE })
const FORNECEDOR = () => fornecedorFala({ VOZ_FALA: process.env.VOZ_FALA, OPENAI_API_KEY: process.env.OPENAI_API_KEY, ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY })
// Voz padrão MASCULINA da ElevenLabs (George) que funciona no plano gratuito (troque por ELEVENLABS_VOZ_ID após escolher)
const VOZ_ELEVEN = () => process.env.ELEVENLABS_VOZ_ID || 'JBFqnCBsd6RMkjVDRZzb'
const MODELO_ELEVEN = () => process.env.ELEVENLABS_MODELO || 'eleven_flash_v2_5'
const VOZ_OPENAI = () => process.env.VOZ_FALA_OPENAI_VOZ || 'onyx' // masculina (pedido do Elias 2026-10-16)
const MODELO_OPENAI = () => process.env.VOZ_FALA_OPENAI_MODELO || 'gpt-4o-mini-tts'
// Tom: diretor executivo respondendo ao dono numa reunião de diretoria (pedido do Elias 2026-10-16)
const JEITO: Record<IdiomaFala, string> = {
  pt: 'Você é um diretor financeiro experiente respondendo ao dono da empresa numa reunião de diretoria. Voz masculina, grave e segura; português do Brasil com sotaque brasileiro natural; tom formal, educado, executivo e sofisticado; ritmo calmo, com pausas curtas entre as ideias; sem entusiasmo exagerado.',
  en: 'You are an experienced CFO answering the company owner in a board meeting. Deep, confident male voice; formal, polite, executive and sophisticated tone; calm pace with short pauses between ideas; no exaggerated enthusiasm.',
  es: 'Usted es un director financiero experimentado respondiendo al dueño de la empresa en una reunión de directorio. Voz masculina, grave y segura; español neutro; tono formal, educado, ejecutivo y sofisticado; ritmo pausado, con pausas breves entre ideas; sin entusiasmo exagerado.',
}

async function sessao() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}
// Nome de quem pergunta: vem da conta logada (nunca do navegador)
const nomeDe = (u: { user_metadata?: Record<string, unknown> } | null) => primeiroNome(u?.user_metadata?.nome || u?.user_metadata?.full_name || '')

async function sintetizar(fala: string, lang: IdiomaFala, f: Fornecedor): Promise<ReadableStream<Uint8Array>> {
  const res = f === 'elevenlabs'
    ? await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOZ_ELEVEN())}/stream?output_format=mp3_44100_64`, {
        method: 'POST', signal: AbortSignal.timeout(30000),
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text: fala, model_id: MODELO_ELEVEN(), language_code: lang }),
      })
    : await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST', signal: AbortSignal.timeout(30000),
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODELO_OPENAI(), voice: VOZ_OPENAI(), input: fala, instructions: JEITO[lang], response_format: 'mp3' }),
      })
  if (!res.ok || !res.body) throw new Error(`${f} ${res.status}`) // corpo do erro não é lido nem registrado
  return res.body
}

export async function GET(request: NextRequest) {
  const { user } = await sessao()
  const empresaId = request.nextUrl.searchParams.get('empresa_id') ?? ''
  if (!user || !UUID.test(empresaId)) return NextResponse.json({ ativa: false, fornecedor: null })
  return NextResponse.json({ ativa: vozAtivaPara(empresaId, ENV_VOZ()), fornecedor: FORNECEDOR(), nome: nomeDe(user) })
}

export async function POST(request: NextRequest) {
  const inicio = Date.now()
  const { supabase, user } = await sessao()
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const empresaId = String(body?.empresa_id ?? '')
  const lang = String(body?.lang ?? 'pt')

  const resultado = await processarFala(
    { usuario: user?.id ?? null, empresaId, lang, texto: body?.texto as string, assinatura: body?.assinatura as string, ressalva: body?.ressalva === true, nome: nomeDe(user) },
    {
      ativa: (id) => vozAtivaPara(id, ENV_VOZ()),
      fornecedor: FORNECEDOR(),
      assinaturaValida,
      acesso: async (id) => {
        const { data, error } = await comRetentativa(() => supabase.rpc('ia_situacao', { p_empresa: id }))
        if (error) { if (/sem acesso/i.test(error.message)) return null; throw new Error(error.message) }
        return !!data
      },
      papel: async (id) => {
        const { data, error } = await comRetentativa(() => supabase.from('empresa_usuarios').select('papel').eq('empresa_id', id).eq('user_id', user!.id).maybeSingle())
        if (error) throw new Error(error.message)
        return (data?.papel as string | undefined) ?? null
      },
      sintetizar,
    },
  )

  // Auditoria: só metadados (quantos caracteres, qual fornecedor) — nunca o texto nem o áudio.
  if (user && UUID.test(empresaId) && resultado.codigo !== 'fala_no_aparelho') {
    after(() => registrarAuditoria({
      empresaId, ator: user.id, acao: 'voz.falar', entidade: 'voz',
      parametros: { lang, codigo: resultado.codigo, caracteres: resultado.caracteres ?? 0, fornecedor: resultado.fornecedor ?? null, ms: Date.now() - inicio },
    }))
  }
  if (resultado.codigo === 'fornecedor_indisponivel' || resultado.codigo === 'falha_leitura') {
    Sentry.captureMessage(`[voz-falar] ${resultado.codigo}`, { level: 'warning', extra: { codigo: resultado.codigo, fornecedor: resultado.fornecedor } })
  }

  if (resultado.codigo === 'ok' && resultado.audio) {
    return new Response(resultado.audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json({ error: resultado.codigo }, { status: resultado.status })
}
