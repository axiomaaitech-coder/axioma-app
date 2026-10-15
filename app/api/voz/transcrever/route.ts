import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { mensagemSemSaldo } from '@/lib/iaSaldo'
import { comRetentativa } from '@/lib/antiFalha'
import { processarDitado, vozAtivaPara, mensagemVoz, MAX_BYTES, type Idioma } from '@/lib/voz/servidor'

// ═══════════════════════════════════════════════════════════════
// AXIOMA VOICE INTELLIGENCE — Fase 1: POST /api/voz/transcrever (multipart: audio, empresa_id, tela, lang)
// Regra inteira em lib/voz/servidor.ts (testada). Aqui: sessão do usuário (RLS, nunca chave de
// serviço), OpenAI só no servidor, áudio só na memória deste pedido, auditoria só com metadados.
// GET ?empresa_id= → { ativa } (o botão só aparece se a função estiver liberada para a empresa).
// ═══════════════════════════════════════════════════════════════
export const maxDuration = 60
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// whisper-1 + verbose_json: único caminho em que a DURAÇÃO vem conferida pelo fornecedor (limite de
// 60 s checado no servidor, sem confiar no navegador). Trocável por VOZ_MODELO após o comparativo.
const MODELO = () => process.env.VOZ_MODELO || 'whisper-1'
const ENV_VOZ = () => ({ VOZ_ATIVA: process.env.VOZ_ATIVA, VOZ_EMPRESAS_TESTE: process.env.VOZ_EMPRESAS_TESTE })
// Dica de vocabulário (melhora valores, siglas e nomes do dia a dia financeiro)
const DICA: Record<Idioma, string> = {
  pt: 'Ditado financeiro em português do Brasil: R$, reais, centavos, boleto, Pix, NF-e, CNPJ, CPF, DAS, MEI, DRE, fornecedor, cliente, vencimento.',
  en: 'Financial dictation in English: dollars, reais, invoice, due date, supplier, customer, tax, cash flow.',
  es: 'Dictado financiero en español: reales, factura, vencimiento, proveedor, cliente, impuesto, flujo de caja.',
}

async function sessao() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(request: NextRequest) {
  const { user } = await sessao()
  const empresaId = request.nextUrl.searchParams.get('empresa_id') ?? ''
  if (!user || !UUID.test(empresaId)) return NextResponse.json({ ativa: false })
  return NextResponse.json({ ativa: vozAtivaPara(empresaId, ENV_VOZ()) })
}

async function transcreverOpenAI(audio: Blob, tipo: string, lang: Idioma): Promise<{ texto: string; duracao: number }> {
  const chave = process.env.OPENAI_API_KEY
  if (!chave) throw new Error('OPENAI_API_KEY ausente')
  const ext = tipo.includes('mp4') || tipo.includes('m4a') ? 'm4a' : tipo.includes('ogg') ? 'ogg' : tipo.includes('mpeg') ? 'mp3' : tipo.includes('wav') ? 'wav' : 'webm'
  const form = new FormData()
  form.append('file', new File([audio], `ditado.${ext}`, { type: tipo }))
  form.append('model', MODELO())
  form.append('response_format', 'verbose_json')
  form.append('language', lang)
  form.append('temperature', '0')
  form.append('prompt', DICA[lang])
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${chave}` }, body: form, signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}`) // corpo da resposta não é lido nem registrado
  const j = await res.json() as { text?: string; duration?: number }
  return { texto: String(j.text ?? ''), duracao: Number(j.duration ?? Number.NaN) }
}

export async function POST(request: NextRequest) {
  const inicio = Date.now()
  const { supabase, user } = await sessao()
  // Tamanho conferido ANTES de ler o corpo inteiro (o limite de 2 MB vale também para quem forja o pedido)
  const tamanhoDeclarado = Number(request.headers.get('content-length') || 0)
  const form = tamanhoDeclarado > MAX_BYTES + 64 * 1024 ? null : await request.formData().catch(() => null)
  const arquivo = form?.get('audio')
  const empresaId = String(form?.get('empresa_id') ?? '')
  const tela = String(form?.get('tela') ?? '')
  const lang = String(form?.get('lang') ?? 'pt')

  const resultado = tamanhoDeclarado > MAX_BYTES + 64 * 1024
    ? { status: 413, codigo: 'audio_grande' as const, cobrado: false }
    : await processarDitado(
        { usuario: user?.id ?? null, empresaId, tela, lang, arquivo: arquivo instanceof Blob ? { tipo: arquivo.type, tamanho: arquivo.size, bytes: arquivo } : null },
        {
          ativa: (id) => vozAtivaPara(id, ENV_VOZ()),
          situacao: async (id) => {
            const { data, error } = await comRetentativa(() => supabase.rpc('ia_situacao', { p_empresa: id }))
            if (error) { if (/sem acesso/i.test(error.message)) return null; throw new Error(error.message) }
            const d = data as { openai?: { restante?: number }; ilimitada?: boolean } | null
            return d ? { restante: Number(d.openai?.restante ?? 0), ilimitada: !!d.ilimitada } : null
          },
          papel: async (id) => {
            const { data, error } = await comRetentativa(() => supabase.from('empresa_usuarios').select('papel').eq('empresa_id', id).eq('user_id', user!.id).maybeSingle())
            if (error) throw new Error(error.message)
            return (data?.papel as string | undefined) ?? null
          },
          transcrever: transcreverOpenAI,
          // Gravação: NUNCA repetida (repetir poderia cobrar 2x). ia_consumir é atômico (trava a linha da empresa).
          consumir: async (id) => {
            const { data, error } = await supabase.rpc('ia_consumir', { p_empresa: id, p_tipo: 'openai' })
            if (error) throw new Error(error.message)
            return data?.ok ? { ok: true as const } : { ok: false as const, motivo: String(data?.motivo ?? 'sem_saldo') }
          },
        },
      )

  // Auditoria e monitoramento: só metadados — nunca áudio nem texto.
  if (user && UUID.test(empresaId)) {
    after(() => registrarAuditoria({
      empresaId, ator: user.id, acao: 'voz.transcrever', entidade: 'voz',
      parametros: { tela, lang, codigo: resultado.codigo, cobrado: resultado.cobrado, bytes: arquivo instanceof Blob ? arquivo.size : 0, duracao_s: 'duracao' in resultado ? resultado.duracao ?? null : null, modelo: MODELO(), ms: Date.now() - inicio },
    }))
  }
  if (resultado.codigo === 'fornecedor_indisponivel' || resultado.codigo === 'falha_leitura') {
    Sentry.captureMessage(`[voz] ${resultado.codigo}`, { level: 'warning', extra: { tela, codigo: resultado.codigo } })
  }

  if (resultado.codigo === 'ok') return NextResponse.json({ texto: resultado.texto })
  const mensagem = resultado.codigo === 'sem_saldo' && 'motivoSaldo' in resultado && resultado.motivoSaldo
    ? mensagemSemSaldo(resultado.motivoSaldo, (['pt', 'en', 'es'].includes(lang) ? lang : 'pt') as Idioma)
    : mensagemVoz(resultado.codigo, lang)
  return NextResponse.json({ error: resultado.codigo, mensagem }, { status: resultado.status })
}
