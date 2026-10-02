import type { Metadata } from 'next'
import { lerConvite } from '../../../lib/conviteLink'

// Cartão do link no WhatsApp/Telegram/e-mail: "Você foi convidado" + empresa,
// em vez de um endereço solto. A imagem vem de opengraph-image.tsx.
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const c = await lerConvite(token)
  const titulo = c ? `Convite para ${c.empresa} no Axioma` : 'Convite para o Axioma'
  const descricao = c?.remetente ? `${c.remetente} convidou você. Toque para aceitar e entrar.` : 'Toque para aceitar o convite e entrar.'
  return {
    title: titulo,
    description: descricao,
    robots: { index: false, follow: false },
    openGraph: { title: titulo, description: descricao, siteName: 'Axioma AI.Tech', type: 'website' },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao },
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
