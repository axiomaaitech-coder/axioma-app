import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { mensagem, historico, contexto } = await request.json()

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

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: contexto || 'Você é um assistente financeiro inteligente da Axioma AI.Tech. Responda sempre em português, de forma clara, prática e objetiva.',
      messages,
    })

    const resposta = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ resposta })
  } catch (error) {
    console.error('Erro na rota ia-chat:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}