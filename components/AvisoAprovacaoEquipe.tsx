'use client'
// Pedido de entrada na equipe, em qualquer tela do Axioma (Elias 2026-10-08): quem
// confirmou o e-mail do convite aparece aqui com nome, e-mail e CPF, e CEO/Sócio/Admin
// aprova ou recusa na hora. Confere a cada 20 s. Aprovou = a pessoa vê "Seja bem-vindo".
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { obterEmpresaAtiva, decidirConvite } from '../lib/empresaHelpers'
import { useLanguage } from '../lib/LanguageContext'

type Pendente = { id: string; nome: string; email: string; cpf: string; papel: string; relacao: string | null }
const INTERVALO_MS = 20 * 1000

export default function AvisoAprovacaoEquipe() {
  const caminho = usePathname()
  const { idioma } = useLanguage()
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt)
  const [pendentes, setPendentes] = useState<Pendente[]>([])
  const [decidindo, setDecidindo] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const ativo = !caminho?.startsWith('/pdv')

  async function carregar() {
    try {
      const empresaId = await obterEmpresaAtiva()
      if (!empresaId) return
      const r = await fetch(`/api/convite?empresaId=${empresaId}`).then((x) => x.json())
      setPendentes(Array.isArray(r?.pendentes) ? r.pendentes : [])
    } catch { /* tenta de novo no próximo ciclo */ } // varredura:ok aviso silencioso; a Equipe mostra o mesmo pedido
  }

  useEffect(() => {
    if (!ativo) return
    void carregar()
    const t = setInterval(carregar, INTERVALO_MS)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo])

  async function decidir(p: Pendente, aprovar: boolean) {
    setDecidindo(p.id); setErro('')
    const r = await decidirConvite(p.id, aprovar)
    setDecidindo(null)
    if (r.erro) { setErro(L('Não foi possível concluir. Tente de novo.', 'Could not complete. Try again.', 'No se pudo completar. Intente de nuevo.')); return }
    setPendentes((lista) => lista.filter((x) => x.id !== p.id))
    window.dispatchEvent(new CustomEvent('axioma:dados-atualizados', { detail: { origem: 'equipe' } }))
  }

  if (!ativo || pendentes.length === 0) return null
  return (
    <div className="fixed z-50 right-4 top-24 w-[min(380px,calc(100vw-32px))] space-y-2">
      {pendentes.map((p) => (
        <div key={p.id} className="rounded-xl p-4 shadow-2xl axi-card-premium3d axi-card-faixa"
          style={{ background: '#101b3d', border: '1px solid rgba(46,204,155,0.55)', color: '#ffffff' }}>
          <p className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5" style={{ color: '#2ecc9b' }}>
            <UserPlus size={14} />{L('Pedido de entrada na equipe', 'Request to join the team', 'Solicitud para entrar al equipo')}
          </p>
          <p className="mt-2 text-sm font-bold">{p.nome || '—'}</p>
          <p className="text-xs opacity-85">{L('E-mail', 'E-mail', 'Correo')}: {p.email || '—'}</p>
          <p className="text-xs opacity-85">CPF: {p.cpf || '—'}</p>
          <p className="text-xs opacity-85">{L('Papel', 'Role', 'Rol')}: {p.papel}{p.relacao ? ` • ${p.relacao}` : ''}</p>
          {erro && <p className="text-xs mt-2" style={{ color: '#f87171' }}>{erro}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={() => decidir(p, true)} disabled={decidindo === p.id}
              className="flex-1 py-2 rounded-lg text-sm font-black disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #16a97d, #2ecc9b)', color: '#fff' }}>
              {L('Aceitar', 'Accept', 'Aceptar')}
            </button>
            <button onClick={() => decidir(p, false)} disabled={decidindo === p.id}
              className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60" style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.6)', color: '#fca5a5' }}>
              {L('Recusar', 'Decline', 'Rechazar')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
