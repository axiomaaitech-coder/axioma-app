import { ImageResponse } from 'next/og'
import { lerConvite } from '../../../lib/conviteLink'

// Imagem do cartão do convite (WhatsApp/Telegram/e-mail) — cores do Axioma.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Convite para o Axioma'

export default async function Imagem({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const c = await lerConvite(token)
  // logo pelo próprio site (arquivo de public/ nem sempre vai junto na função da Vercel)
  const logo = `data:image/png;base64,${Buffer.from(await (await fetch('https://axiomaai.com.br/logo-aitech.png')).arrayBuffer()).toString('base64')}`
  const empresa = c?.empresa || 'Axioma'

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px',
        background: 'radial-gradient(ellipse at 20% 0%, #0f2a4a 0%, #071326 55%, #030a16 100%)', color: '#e8eef7', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={84} height={84} alt="" />
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: 6, color: '#2ecc9b' }}>AXIOMA AI.TECH</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', fontSize: 36, color: '#9fb3cf' }}>
            {c?.remetente ? `${c.remetente} convidou você para entrar em` : 'Você foi convidado para entrar em'}
          </div>
          <div style={{ display: 'flex', fontSize: empresa.length > 28 ? 64 : 84, fontWeight: 800, lineHeight: 1.05 }}>{empresa}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', padding: '16px 34px', borderRadius: 16, background: '#2ecc9b', color: '#04241a', fontSize: 30, fontWeight: 800 }}>
            Aceitar convite
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#9fb3cf' }}>axiomaai.com.br</div>
        </div>
      </div>
    ),
    size,
  )
}
