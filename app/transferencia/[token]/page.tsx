'use client'
// Página de quem RECEBE a empresa (Elias, 2026-10-09). Abre o link, entra no
// Axioma com o e-mail indicado pelo Proprietário (ou cria a conta), confere o
// resumo e aceita com CPF + declaração + LGPD. Mesmo visual da página de convite.
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '../../../lib/LanguageContext'
import { definirEmpresaPreferida, limparCacheEmpresaAtiva } from '../../../lib/empresaHelpers'
import { verTransferencia, aceitarTransferencia, TIPOS_OPERACAO, TIPOS_SOCIETARIOS, docValido } from '../../../lib/transferenciaEmpresa'

const COR = { fundo: '#050d1c', card: '#0a1730', linha: 'rgba(147,166,194,0.16)', menta: '#2ecc9b', texto: '#e8eef7', sec: '#93a6c2', campo: 'rgba(255,255,255,0.035)', erro: '#f87171' }

type Resumo = {
  situacao: string; cedente_nome: string; cessionario_nome: string; cessionario_email: string; tipo_operacao: string; tipo_societario: string
  junta_protocolo: string; junta_data: string; expira_em: string; cedente_fica_admin: boolean; empresa_nome: string; empresa_cnpj: string
  logado_email: string | null; email_confere: boolean; erro?: string
}

export default function AceitarTransferencia() {
  const params = useParams()
  const router = useRouter()
  const token = String(params.token || '')
  const { idioma, setIdioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as 'pt' | 'en' | 'es'
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const dataBR = (iso?: string) => iso ? new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString(locale) : '—'

  const [r, setR] = useState<Resumo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [cpf, setCpf] = useState('')
  const [declaracao, setDeclaracao] = useState(false)
  const [lgpd, setLgpd] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState(false)

  useEffect(() => { void verTransferencia(token).then((x) => { setR(x); setCarregando(false) }) }, [token])

  const voltar = encodeURIComponent(`/transferencia/${token}`)
  const MSG: Record<string, string> = {
    cpf: L('CPF inválido. Confira os números.', 'Invalid CPF. Check the numbers.', 'CPF inválido. Revise los números.'),
    cpf_diferente: L('Este CPF não é o que o Proprietário informou. Confira com ele.', 'This CPF is not the one the Owner provided. Check with them.', 'Este CPF no es el que informó el Propietario. Confírmelo con él.'),
    email_diferente: L('Você está em outra conta. Entre com o e-mail indicado.', 'You are in another account. Sign in with the indicated e-mail.', 'Está en otra cuenta. Entre con el correo indicado.'),
    expirada: L('O prazo de 7 dias acabou. Peça um novo link ao Proprietário.', 'The 7-day period ended. Ask the Owner for a new link.', 'El plazo de 7 días terminó. Pida un nuevo enlace al Propietario.'),
    cancelada: L('O Proprietário cancelou esta transferência.', 'The Owner cancelled this transfer.', 'El Propietario canceló esta transferencia.'),
    concluida: L('Esta transferência já foi concluída.', 'This transfer is already completed.', 'Esta transferencia ya fue concluida.'),
    dono_mudou: L('A empresa mudou de dono antes do aceite. Fale com quem enviou o link.', 'The company changed owner before acceptance. Talk to who sent the link.', 'La empresa cambió de dueño antes de la aceptación. Hable con quien envió el enlace.'),
    muitas_tentativas: L('Muitas tentativas erradas. Aguarde 15 minutos.', 'Too many wrong attempts. Wait 15 minutes.', 'Demasiados intentos fallidos. Espere 15 minutos.'),
  }

  async function aceitar() {
    if (!docValido(cpf) || cpf.replace(/\D/g, '').length !== 11) { setErro(MSG.cpf); return }
    setEnviando(true); setErro('')
    const x = await aceitarTransferencia(token, cpf, declaracao, lgpd)
    setEnviando(false)
    if (!x.ok) { setErro(MSG[x.erro || ''] || L('Não deu certo. Nada mudou — tente de novo.', 'It did not work. Nothing changed — try again.', 'No funcionó. Nada cambió — intente de nuevo.')); return }
    const { data: { user } } = await createClient().auth.getUser()
    if (user && x.empresaId) definirEmpresaPreferida(user.id, x.empresaId)
    limparCacheEmpresaAtiva()
    setFeito(true)
  }

  async function sair() {
    await createClient().auth.signOut()
    router.push(`/login?next=${voltar}&email=${encodeURIComponent(r?.cessionario_email || '')}`)
  }

  const linha = (rotulo: string, valor: string) => (
    <div className="flex justify-between gap-3 py-1.5 text-sm" style={{ borderBottom: `1px solid ${COR.linha}` }}>
      <span style={{ color: COR.sec }}>{rotulo}</span><span className="text-right font-medium" style={{ color: COR.texto }}>{valor}</span>
    </div>
  )
  const botao = 'w-full py-3 rounded-xl text-[15px] font-semibold text-center block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2ecc9b] disabled:opacity-50'
  const fim = r && ['expirada', 'cancelada', 'concluida'].includes(r.situacao)

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-16 pb-10"
      style={{ background: `radial-gradient(ellipse 90% 60% at 50% -10%, #0f2a4a 0%, ${COR.fundo} 55%, #01050c 100%)` }}>
      <div className="w-full max-w-[460px] flex justify-end gap-1.5 mb-10">
        {(['pt', 'en', 'es'] as const).map((l) => (
          <button key={l} onClick={() => setIdioma(l)} aria-pressed={idioma === l} className="text-xs px-2.5 py-1 rounded-md font-semibold"
            style={{ background: idioma === l ? 'rgba(46,204,155,0.14)' : 'transparent', color: idioma === l ? COR.menta : COR.sec }}>{l.toUpperCase()}</button>
        ))}
      </div>

      <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[460px] rounded-[28px] px-6 sm:px-9 pt-14 pb-8"
        style={{ background: COR.card, border: `1px solid ${COR.linha}`, boxShadow: '0 40px 80px -20px rgba(0,0,0,0.65)' }}>
        <div className="absolute left-1/2 -top-9 -translate-x-1/2 w-[72px] h-[72px] rounded-full flex items-center justify-center"
          style={{ background: COR.fundo, border: '1px solid rgba(46,204,155,0.45)' }}>
          <Image src="/logo-aitech.png" alt="Axioma AI.Tech" width={46} height={46} priority />
        </div>

        {carregando && <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${COR.menta} transparent transparent transparent` }} /></div>}

        {!carregando && (!r || r.erro) && (
          <p className="text-center py-4" style={{ color: COR.texto }}>{L('Link inválido. Confira se copiou o endereço inteiro.', 'Invalid link. Check that you copied the whole address.', 'Enlace inválido. Revise si copió la dirección completa.')}</p>
        )}

        {!carregando && r && !r.erro && feito && (
          <div className="text-center py-2">
            <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: COR.menta }} />
            <p className="text-lg font-semibold" style={{ color: COR.texto }}>{L(`Você agora é o Proprietário de ${r.empresa_nome}`, `You are now the Owner of ${r.empresa_nome}`, `Ahora usted es el Propietario de ${r.empresa_nome}`)}</p>
            <p className="text-sm mt-2" style={{ color: COR.sec }}>{L('Fica registrado no histórico da empresa com data e CPF.', 'It is recorded in the company history with date and CPF.', 'Queda registrado en el historial de la empresa con fecha y CPF.')}</p>
            <a href="/dashboard" className={`${botao} mt-6`} style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>{L('Abrir o Axioma', 'Open Axioma', 'Abrir Axioma')}</a>
          </div>
        )}

        {!carregando && r && !r.erro && !feito && (
          <>
            <h1 className="text-xl font-semibold text-center" style={{ color: COR.texto }}>{L('Transferência de empresa', 'Company transfer', 'Transferencia de empresa')}</h1>
            <p className="text-sm text-center mt-2 mb-5" style={{ color: COR.sec }}>
              {L(`${r.cedente_nome} está passando a empresa para ${r.cessionario_nome}.`, `${r.cedente_nome} is transferring the company to ${r.cessionario_nome}.`, `${r.cedente_nome} está transfiriendo la empresa a ${r.cessionario_nome}.`)}
            </p>
            {linha(L('Empresa', 'Company', 'Empresa'), r.empresa_nome + (r.empresa_cnpj ? ` (${r.empresa_cnpj})` : ''))}
            {linha(L('Operação', 'Operation', 'Operación'), TIPOS_OPERACAO.find((x) => x.key === r.tipo_operacao)?.nome[lang] ?? r.tipo_operacao)}
            {linha(L('Tipo', 'Type', 'Tipo'), TIPOS_SOCIETARIOS.find((x) => x.key === r.tipo_societario)?.nome[lang] ?? r.tipo_societario)}
            {linha(L('Registro na Junta', 'Registry filing', 'Registro en la Junta'), `${r.junta_protocolo} — ${dataBR(r.junta_data)}`)}
            {linha(L('Quem passa', 'Transferring', 'Quien transfiere'), r.cedente_fica_admin ? L('continua como Admin', 'stays as Admin', 'sigue como Admin') : L('sai da empresa', 'leaves the company', 'sale de la empresa'))}
            {linha(L('Aceitar até', 'Accept by', 'Aceptar hasta'), dataBR(r.expira_em))}

            {fim && <p className="text-sm font-semibold mt-5 text-center" style={{ color: COR.erro }}>{MSG[r.situacao]}</p>}

            {!fim && !r.logado_email && (
              <div className="mt-6 space-y-2">
                <p className="text-sm" style={{ color: COR.sec }}>{L(`Para aceitar, entre no Axioma com ${r.cessionario_email}.`, `To accept, sign in to Axioma with ${r.cessionario_email}.`, `Para aceptar, entre en Axioma con ${r.cessionario_email}.`)}</p>
                <a href={`/login?next=${voltar}&email=${encodeURIComponent(r.cessionario_email)}`} className={botao} style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>{L('Entrar', 'Sign in', 'Entrar')}</a>
                <a href={`/cadastro?next=${voltar}&email=${encodeURIComponent(r.cessionario_email)}`} className={botao} style={{ background: '#101b3d', color: '#fff', border: '1px solid rgba(46,204,155,0.35)' }}>{L('Ainda não tenho conta', 'I don\'t have an account yet', 'Aún no tengo cuenta')}</a>
              </div>
            )}

            {!fim && r.logado_email && !r.email_confere && (
              <div className="mt-6 space-y-2">
                <p className="text-sm" style={{ color: COR.erro }}>{L(`Você entrou como ${r.logado_email}, mas a empresa foi indicada para ${r.cessionario_email}.`, `You are signed in as ${r.logado_email}, but the company was assigned to ${r.cessionario_email}.`, `Entró como ${r.logado_email}, pero la empresa fue indicada para ${r.cessionario_email}.`)}</p>
                <button onClick={() => void sair()} className={botao} style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>{L('Sair e entrar com o e-mail certo', 'Sign out and use the right e-mail', 'Salir y entrar con el correo correcto')}</button>
              </div>
            )}

            {!fim && r.email_confere && (
              <div className="mt-6 space-y-3">
                <label className="block">
                  <span className="text-[13px] font-medium" style={{ color: COR.sec }}>{L('Seu CPF', 'Your CPF', 'Su CPF')}</span>
                  <input value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))} inputMode="numeric"
                    className="w-full mt-1.5 px-3.5 py-3 rounded-xl text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc9b]/60"
                    style={{ background: COR.campo, color: COR.texto, border: `1px solid ${COR.linha}` }} />
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: COR.texto }}>
                  <input type="checkbox" checked={declaracao} onChange={(e) => setDeclaracao(e.target.checked)} className="mt-1" />
                  {L('Declaro que sou a pessoa indicada, que conheço a transferência registrada na Junta Comercial e que assumo a empresa como Proprietário no Axioma.',
                    'I declare I am the person indicated, that I know the transfer filed at the Commercial Registry and that I take over the company as Owner in Axioma.',
                    'Declaro que soy la persona indicada, que conozco la transferencia registrada en la Junta Comercial y que asumo la empresa como Propietario en Axioma.')}
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: COR.texto }}>
                  <input type="checkbox" checked={lgpd} onChange={(e) => setLgpd(e.target.checked)} className="mt-1" />
                  <span>{L('Aceito os ', 'I accept the ', 'Acepto los ')}<a href="/termos" target="_blank" className="underline" style={{ color: COR.menta }}>{L('Termos de Uso', 'Terms of Use', 'Términos de Uso')}</a>{L(' e a ', ' and the ', ' y la ')}<a href="/privacidade" target="_blank" className="underline" style={{ color: COR.menta }}>{L('Política de Privacidade (LGPD)', 'Privacy Policy (LGPD)', 'Política de Privacidad (LGPD)')}</a>{L(', e assumo o papel de controlador dos dados da empresa.', ', and I take the role of controller of the company data.', ', y asumo el papel de controlador de los datos de la empresa.')}</span>
                </label>
                {erro && <p className="text-sm font-semibold" style={{ color: COR.erro }}>{erro}</p>}
                <button onClick={() => void aceitar()} disabled={enviando || !declaracao || !lgpd || cpf.length !== 11} className={botao} style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>
                  {enviando ? L('Confirmando…', 'Confirming…', 'Confirmando…') : L('Aceitar e assumir a empresa', 'Accept and take over the company', 'Aceptar y asumir la empresa')}
                </button>
              </div>
            )}
          </>
        )}
      </motion.main>
    </div>
  )
}
