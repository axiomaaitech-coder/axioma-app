import { NextResponse } from 'next/server'

// Retorna a lista de bancos (conectores) do Pluggy COM logo oficial e cor da marca.
// Usado para montar os cartões clicáveis na tela de Open Finance.
export async function GET() {
  try {
    // Autentica no Pluggy
    const authResponse = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: process.env.PLUGGY_CLIENT_ID,
        clientSecret: process.env.PLUGGY_CLIENT_SECRET,
      }),
    })
    if (!authResponse.ok) throw new Error('Erro ao autenticar com Pluggy')
    const { apiKey } = await authResponse.json()

    // Busca conectores (inclui sandbox para permitir teste com o Pluggy Bank)
    const resp = await fetch('https://api.pluggy.ai/connectors?sandbox=true&countries=BR', {
      headers: { 'X-API-KEY': apiKey },
    })
    if (!resp.ok) throw new Error('Erro ao buscar conectores')
    const json = await resp.json()
    const results = json?.results || []

    const connectors = results.map((c: any) => ({
      id: c.id,
      name: c.name || '',
      imageUrl: c.imageUrl || '',
      primaryColor: c.primaryColor
        ? (String(c.primaryColor).startsWith('#') ? c.primaryColor : `#${c.primaryColor}`)
        : '#6ab0ff',
      type: c.type || '',
      isSandbox: !!c.isSandbox,
    }))

    return NextResponse.json({ connectors })
  } catch (error: any) {
    console.error('Pluggy connectors error:', error)
    return NextResponse.json({ error: error.message, connectors: [] }, { status: 500 })
  }
}