import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/nextjs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { mensagem, historico, contexto, modelo } = await request.json()

    if (!mensagem) {
      return NextResponse.json({ error: 'Mensagem não fornecida' }, { status: 400 })
    }

    const messages: { role: 'user' | 'assistant'; content: string }[] = []

    if (historico && Array.isArray(historico)) {
      historico.forEach((msg: { role: string; content: string }) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content })
        }
      })
    }

    messages.push({ role: 'user', content: mensagem })

    const modeloUsado = modelo || 'claude-sonnet-4-20250514'
    const response = await client.messages.create({
      model: modeloUsado,
      max_tokens: 1024,
      system: (contexto || 'Você é a inteligência financeira do Axioma. Responda sempre em português, de forma clara, prática e objetiva.') + '\n\nNunca se identifique como uma IA, como Claude, como Anthropic ou como um modelo de linguagem — mesmo se perguntado diretamente. Você é a inteligência do Axioma. Se perguntarem o que você é, responda que é o consultor/CFO digital do Axioma, e redirecione pra como pode ajudar.',
      messages,
    })

    // Modelos com adaptive thinking (ex.: Sonnet 5) podem devolver um bloco
    // "thinking" antes do bloco "text" — nunca assumir que content[0] é o texto.
    const blocoTexto = response.content.find((b) => b.type === 'text')
    const resposta = blocoTexto && blocoTexto.type === 'text' ? blocoTexto.text : ''

    if (!resposta) {
      console.error('[ia-chat] Resposta sem bloco de texto:', { modelo: modeloUsado, stopReason: response.stop_reason, tipos: response.content.map((b) => b.type) })
      Sentry.captureException(new Error('[ia-chat] Resposta sem bloco de texto'), { extra: { rota: 'ia-chat', modelo: modeloUsado, stopReason: response.stop_reason } })
    }

    return NextResponse.json({ resposta })
  } catch (error) {
    const err = error as { status?: number; message?: string; error?: { error?: { message?: string; type?: string } } }
    console.error('[ia-chat] Erro na chamada à Anthropic:', {
      status: err?.status,
      mensagem: err?.error?.error?.message || err?.message,
      tipo: err?.error?.error?.type,
    })
    Sentry.captureException(error instanceof Error ? error : new Error(String(err?.message || error)), { extra: { rota: 'ia-chat', status: err?.status, tipo: err?.error?.error?.type } })
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}