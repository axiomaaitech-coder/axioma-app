import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import * as Sentry from '@sentry/nextjs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Vale pros dois provedores — nunca se identifica nem como Claude/Anthropic
// nem como ChatGPT/OpenAI/GPT, mesmo se perguntado diretamente.
const AVISO_IDENTIDADE = 'Nunca se identifique como uma IA, como Claude, como Anthropic, como ChatGPT, como GPT, como OpenAI, ou como um modelo de linguagem — mesmo se perguntado diretamente. Você é a inteligência do Axioma. Se perguntarem o que você é, responda que é o consultor/CFO digital do Axioma, e redirecione pra como pode ajudar.'

type Mensagem = { role: 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  try {
    const { mensagem, historico, contexto, modelo, provedor } = await request.json()

    if (!mensagem) {
      return NextResponse.json({ error: 'Mensagem não fornecida' }, { status: 400 })
    }

    const messages: Mensagem[] = []
    if (historico && Array.isArray(historico)) {
      historico.forEach((msg: { role: string; content: string }) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content })
        }
      })
    }
    messages.push({ role: 'user', content: mensagem })

    if (provedor === 'openai') {
      const resposta = await responderComOpenAI(messages, contexto, modelo)
      return NextResponse.json({ resposta })
    }

    // Claude — provedor padrão, comportamento idêntico ao de antes pra quem
    // não passa "provedor" (ex.: MEI IA Advisor).
    const modeloUsado = modelo || 'claude-sonnet-4-20250514'
    const response = await client.messages.create({
      model: modeloUsado,
      max_tokens: 1024,
      system: (contexto || 'Você é a inteligência financeira do Axioma. Responda sempre em português, de forma clara, prática e objetiva.') + '\n\n' + AVISO_IDENTIDADE,
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

// Sem SDK novo — é 1 chamada REST simples, fetch direto evita adicionar uma
// dependência só pra isso. Nunca lança: falha vira resposta vazia, e quem
// chama esta rota já trata resposta vazia como "cai pro fallback por regra".
async function responderComOpenAI(messages: Mensagem[], contexto: string | undefined, modelo: string | undefined): Promise<string> {
  const modeloUsado = modelo || 'gpt-4o-mini'
  const systemPrompt = (contexto || 'Você é a inteligência financeira do Axioma. Responda sempre em português, de forma clara, prática e objetiva.') + '\n\n' + AVISO_IDENTIDADE

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modeloUsado,
        max_tokens: 1024,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    })

    if (!res.ok) {
      const corpo = await res.text()
      console.error('[ia-chat] Erro na chamada à OpenAI:', { status: res.status, corpo })
      Sentry.captureException(new Error('[ia-chat] Erro na chamada à OpenAI'), { extra: { rota: 'ia-chat', provedor: 'openai', status: res.status, corpo } })
      return ''
    }

    const data = await res.json()
    return data?.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('[ia-chat] Erro de rede na chamada à OpenAI:', error)
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { extra: { rota: 'ia-chat', provedor: 'openai' } })
    return ''
  }
}