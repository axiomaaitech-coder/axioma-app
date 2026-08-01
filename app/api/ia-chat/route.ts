import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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
      system: contexto || 'Você é um assistente financeiro inteligente da Axioma AI.Tech. Responda sempre em português, de forma clara, prática e objetiva.',
      messages,
    })

    // Modelos com adaptive thinking (ex.: Sonnet 5) podem devolver um bloco
    // "thinking" antes do bloco "text" — nunca assumir que content[0] é o texto.
    const blocoTexto = response.content.find((b) => b.type === 'text')
    const resposta = blocoTexto && blocoTexto.type === 'text' ? blocoTexto.text : ''

    if (!resposta) {
      console.error('[ia-chat] Resposta sem bloco de texto:', { modelo: modeloUsado, stopReason: response.stop_reason, tipos: response.content.map((b) => b.type) })
    }

    return NextResponse.json({ resposta })
  } catch (error) {
    const err = error as { status?: number; message?: string; error?: { error?: { message?: string; type?: string } } }
    console.error('[ia-chat] Erro na chamada à Anthropic:', {
      status: err?.status,
      mensagem: err?.error?.error?.message || err?.message,
      tipo: err?.error?.error?.type,
    })
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}