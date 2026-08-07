'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import {
  obterMeuPapel, listarEquipe, convidarMembro, alterarPapelMembro, removerAcessoMembro,
  type MembroEquipe,
} from '../../../lib/empresaHelpers'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Pencil, Trash2, X, CheckCircle, AlertCircle, Users, Copy } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Idioma = 'pt' | 'en' | 'es'

const JADE = '#047857'
const BRONZE = '#065f46'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AMBAR = '#f59e0b'
const AZUL = '#6ab0ff'
const FONTE_EXEC = { fontFamily: "'Georgia','Times New Roman',serif" }

const PAPEIS_ATRIBUIVEIS = ['admin', 'financeiro', 'contabil', 'leitor', 'operador'] as const

const textos = {
  pt: {
    titulo: 'Equipe', sub: 'Quem tem acesso à sua empresa e com qual papel.',
    carregando: 'Carregando...',
    somenteProprietario: 'Só o proprietário da empresa acessa a Equipe.',
    voltarDashboard: 'Voltar ao Dashboard',
    convidar: 'Convidar pessoa', novoConvite: 'Convidar pessoa',
    emailLabel: 'E-mail *', nomeLabel: 'Nome', cargoLabel: 'Cargo', papelLabel: 'Papel',
    enviarConvite: 'Gerar convite', enviando: 'Gerando...', cancelar: 'Cancelar',
    voce: '(você)',
    statusAtivo: 'Ativo', statusConvidado: 'Convidado', statusExpirado: 'Expirado',
    semEquipe: 'Ninguém além de você tem acesso ainda.', semEquipeSub: 'Convide um balconista ou operador pra começar.',
    editarPapel: 'Trocar papel', removerAcesso: 'Remover acesso',
    confirmarRemocao: 'Remover o acesso desta pessoa?', confirmar: 'Confirmar',
    linkCopiado: 'Link do convite copiado! Envie pra pessoa (WhatsApp, e-mail etc.)',
    sucessoConvite: 'Convite gerado', sucessoPapel: 'Papel atualizado', sucessoRemocao: 'Acesso removido',
    copiarLink: 'Copiar link do convite',
    papel_dono: 'Proprietário', papel_admin: 'Admin (acesso total)', papel_financeiro: 'Financeiro',
    papel_contabil: 'Contábil', papel_leitor: 'Leitor (só visualização)', papel_operador: 'Operador (caixa/PDV)',
    erroGenerico: 'Não foi possível concluir. Tente de novo.',
    erroDuplicado: 'Já existe um convite pendente pra este e-mail.',
    erroUltimoDono: 'Não é possível remover ou rebaixar o único proprietário da empresa.',
    erroConviteExpirado: 'Este convite expirou.',
    erroConviteUsado: 'Este convite já foi utilizado.',
    erroNaoProprietario: 'Só o proprietário pode ver a equipe.',
  },
  en: {
    titulo: 'Team', sub: 'Who has access to your company and with which role.',
    carregando: 'Loading...',
    somenteProprietario: 'Only the company owner can access Team.',
    voltarDashboard: 'Back to Dashboard',
    convidar: 'Invite person', novoConvite: 'Invite person',
    emailLabel: 'E-mail *', nomeLabel: 'Name', cargoLabel: 'Position', papelLabel: 'Role',
    enviarConvite: 'Generate invite', enviando: 'Generating...', cancelar: 'Cancel',
    voce: '(you)',
    statusAtivo: 'Active', statusConvidado: 'Invited', statusExpirado: 'Expired',
    semEquipe: 'No one besides you has access yet.', semEquipeSub: 'Invite a clerk or operator to get started.',
    editarPapel: 'Change role', removerAcesso: 'Remove access',
    confirmarRemocao: 'Remove this person\'s access?', confirmar: 'Confirm',
    linkCopiado: 'Invite link copied! Send it to the person (WhatsApp, e-mail etc.)',
    sucessoConvite: 'Invite generated', sucessoPapel: 'Role updated', sucessoRemocao: 'Access removed',
    copiarLink: 'Copy invite link',
    papel_dono: 'Owner', papel_admin: 'Admin (full access)', papel_financeiro: 'Financial',
    papel_contabil: 'Accounting', papel_leitor: 'Reader (view only)', papel_operador: 'Operator (register/POS)',
    erroGenerico: 'Could not complete. Please try again.',
    erroDuplicado: 'A pending invite already exists for this e-mail.',
    erroUltimoDono: 'You cannot remove or demote the company\'s only owner.',
    erroConviteExpirado: 'This invite has expired.',
    erroConviteUsado: 'This invite has already been used.',
    erroNaoProprietario: 'Only the owner can view the team.',
  },
  es: {
    titulo: 'Equipo', sub: 'Quién tiene acceso a su empresa y con qué rol.',
    carregando: 'Cargando...',
    somenteProprietario: 'Solo el propietario de la empresa accede a Equipo.',
    voltarDashboard: 'Volver al Panel',
    convidar: 'Invitar persona', novoConvite: 'Invitar persona',
    emailLabel: 'Correo *', nomeLabel: 'Nombre', cargoLabel: 'Cargo', papelLabel: 'Rol',
    enviarConvite: 'Generar invitación', enviando: 'Generando...', cancelar: 'Cancelar',
    voce: '(usted)',
    statusAtivo: 'Activo', statusConvidado: 'Invitado', statusExpirado: 'Expirado',
    semEquipe: 'Nadie además de usted tiene acceso todavía.', semEquipeSub: 'Invite a un cajero u operador para empezar.',
    editarPapel: 'Cambiar rol', removerAcesso: 'Quitar acceso',
    confirmarRemocao: '¿Quitar el acceso de esta persona?', confirmar: 'Confirmar',
    linkCopiado: '¡Link de invitación copiado! Envíelo a la persona (WhatsApp, correo, etc.)',
    sucessoConvite: 'Invitación generada', sucessoPapel: 'Rol actualizado', sucessoRemocao: 'Acceso eliminado',
    copiarLink: 'Copiar link de invitación',
    papel_dono: 'Propietario', papel_admin: 'Admin (acceso total)', papel_financeiro: 'Financiero',
    papel_contabil: 'Contable', papel_leitor: 'Lector (solo visualización)', papel_operador: 'Operador (caja/PDV)',
    erroGenerico: 'No se pudo completar. Intente de nuevo.',
    erroDuplicado: 'Ya existe una invitación pendiente para este correo.',
    erroUltimoDono: 'No es posible eliminar o degradar al único propietario de la empresa.',
    erroConviteExpirado: 'Esta invitación expiró.',
    erroConviteUsado: 'Esta invitación ya fue utilizada.',
    erroNaoProprietario: 'Solo el propietario puede ver el equipo.',
  },
}

export default function EquipePage() {
  const { idioma } = useLanguage()
  const lang = (idioma as Idioma) || 'pt'
  const t = textos[lang] || textos.pt

  const [carregando, setCarregando] = useState(true)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [meuPapel, setMeuPapel] = useState<string | null>(null)
  const [membros, setMembros] = useState<MembroEquipe[]>([])
  const [mensagem, setMensagem] = useState('')
  const [tipoMsg, setTipoMsg] = useState<'sucesso' | 'erro' | ''>('')

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ email_convidado: '', nome: '', cargo: '', papel: 'operador' })
  const [enviando, setEnviando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)

  useEffect(() => { carregarTudo() }, [])

  function avisar(tipo: 'sucesso' | 'erro', msg: string, ms = 5000) {
    setTipoMsg(tipo); setMensagem(msg)
    setTimeout(() => setMensagem(''), ms)
  }

  function mensagemErro(codigo: string | undefined): string {
    switch (codigo) {
      case 'AX001': return t.erroUltimoDono
      case 'AX003': return t.erroConviteUsado
      case 'AX004': return t.erroConviteExpirado
      case 'AX006': return t.erroNaoProprietario
      case 'AX008': return t.erroDuplicado
      default: return t.erroGenerico
    }
  }

  // Try/catch/finally por inteiro — mesmo padrão de /empresa (commit
  // 6c6ad64): antes, qualquer erro em QUALQUER passo daqui (rede, RPC que
  // ainda não existia no banco etc.) travava a tela em "carregando" pra
  // sempre, sem nenhum aviso. O finally garante que isso nunca mais acontece.
  async function carregarTudo() {
    setCarregando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const id = await obterEmpresaAtiva()
      if (!id) return
      setEmpresaId(id)

      const papel = await obterMeuPapel(id)
      setMeuPapel(papel)
      if (papel !== 'dono') return

      const r = await listarEquipe(id)
      if (r.erro) avisar('erro', mensagemErro(r.codigo))
      setMembros(r.dados)
    } catch (err: any) {
      avisar('erro', t.erroGenerico)
    } finally {
      setCarregando(false)
    }
  }

  async function enviarConvite() {
    if (!empresaId || !userId || !form.email_convidado.trim()) return
    setEnviando(true)
    try {
      const r = await convidarMembro(empresaId, userId, form)
      if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
      setModalAberto(false)
      setForm({ email_convidado: '', nome: '', cargo: '', papel: 'operador' })
      const lista = await listarEquipe(empresaId)
      setMembros(lista.dados)
      const novo = lista.dados.find((m) => m.origem === 'convite' && m.email.toLowerCase() === form.email_convidado.trim().toLowerCase())
      if (novo?.token_convite) {
        const link = `${window.location.origin}/convite/${novo.token_convite}`
        navigator.clipboard.writeText(link)
        avisar('sucesso', t.linkCopiado)
      } else {
        avisar('sucesso', t.sucessoConvite)
      }
    } finally {
      setEnviando(false)
    }
  }

  async function trocarPapel(membro: MembroEquipe, novoPapel: string) {
    if (!empresaId || !userId) return
    const r = await alterarPapelMembro(membro, empresaId, userId, novoPapel)
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    setEditandoId(null)
    avisar('sucesso', t.sucessoPapel)
    const lista = await listarEquipe(empresaId)
    setMembros(lista.dados)
  }

  async function removerAcesso(membro: MembroEquipe) {
    if (!empresaId || !userId) return
    const r = await removerAcessoMembro(membro, empresaId, userId)
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    setConfirmandoId(null)
    avisar('sucesso', t.sucessoRemocao)
    const lista = await listarEquipe(empresaId)
    setMembros(lista.dados)
  }

  function copiarLink(token: string) {
    const link = `${window.location.origin}/convite/${token}`
    navigator.clipboard.writeText(link)
    avisar('sucesso', t.linkCopiado)
  }

  function statusDe(m: MembroEquipe): { label: string; cor: string } {
    if (m.origem === 'ativo') return { label: t.statusAtivo, cor: VERDE }
    const expirado = m.expira_em ? new Date(m.expira_em) < new Date() : false
    return expirado ? { label: t.statusExpirado, cor: VERMELHO } : { label: t.statusConvidado, cor: AMBAR }
  }

  const labelPapel = (papel: string) => (t as any)[`papel_${papel}`] || papel

  if (carregando) {
    return (
      <ModuloLayout titulo={t.titulo} subtitulo={t.sub}>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${JADE} transparent transparent transparent` }} />
        </div>
      </ModuloLayout>
    )
  }

  if (meuPapel !== 'dono') {
    return (
      <ModuloLayout titulo={t.titulo} subtitulo={t.sub}>
        <CanvasBox cor={AZUL}>
          <div className="text-center py-10">
            <Users size={32} className="mx-auto mb-3" style={{ color: AZUL }} />
            <p className="text-sm font-semibold" style={{ color: '#c8d8f0' }}>{t.somenteProprietario}</p>
            <a href="/dashboard" className="inline-block mt-4 text-xs font-semibold underline" style={{ color: AZUL }}>{t.voltarDashboard}</a>
          </div>
        </CanvasBox>
      </ModuloLayout>
    )
  }

  return (
    <ModuloLayout titulo={t.titulo} subtitulo={t.sub}>
      <div className="space-y-4">

        <AnimatePresence>
          {mensagem && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.15)', border: `1px solid ${tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.4)' : 'rgba(220,38,38,0.4)'}` }}>
              {tipoMsg === 'sucesso' ? <CheckCircle size={18} color={VERDE} /> : <AlertCircle size={18} color={VERMELHO} />}
              <p className="text-sm font-semibold" style={{ color: tipoMsg === 'sucesso' ? VERDE : VERMELHO }}>{mensagem}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <CanvasBox cor={JADE}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(4,120,87,0.12)' }}>
                <Users size={26} style={{ color: JADE }} />
              </div>
              <div>
                <p className="text-lg font-black" style={{ ...FONTE_EXEC, color: '#c8d8f0' }}>{membros.length}</p>
                <p className="text-xs" style={{ color: '#5a7a9a' }}>{t.titulo}</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setModalAberto(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${JADE}, ${BRONZE})`, color: '#fff' }}>
              <UserPlus size={16} /> {t.convidar}
            </motion.button>
          </div>
        </CanvasBox>

        <CanvasBox cor="#a78bfa">
          {membros.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🧑‍🤝‍🧑</p>
              <p className="text-sm font-semibold" style={{ color: '#c8d8f0' }}>{t.semEquipe}</p>
              <p className="text-xs mt-1" style={{ color: '#5a7a9a' }}>{t.semEquipeSub}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {membros.map((m) => {
                const status = statusDe(m)
                const ehVoce = m.origem === 'ativo' && m.user_id === userId
                return (
                  <div key={`${m.origem}-${m.id}`} className="rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap"
                    style={{ background: 'rgba(2,8,16,0.5)', border: '1px solid rgba(167,139,250,0.15)' }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: '#c8d8f0' }}>
                        {m.nome || m.email} {ehVoce && <span className="font-normal" style={{ color: '#5a7a9a' }}>{t.voce}</span>}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#5a7a9a' }}>
                        {m.email} {m.cargo ? `• ${m.cargo}` : ''} • {labelPapel(m.papel)}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${status.cor}22`, color: status.cor, border: `1px solid ${status.cor}50` }}>
                        {status.label}
                      </span>
                    </div>

                    {!ehVoce && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {m.origem === 'convite' && m.token_convite && (
                          <button onClick={() => copiarLink(m.token_convite as string)} title={t.copiarLink}
                            className="p-2 rounded-lg" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>
                            <Copy size={15} />
                          </button>
                        )}

                        {editandoId === `${m.origem}-${m.id}` ? (
                          <select
                            value={m.papel}
                            onChange={(e) => trocarPapel(m, e.target.value)}
                            className="px-2 py-2 rounded-lg text-xs"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(106,176,255,0.25)', color: '#c8d8f0' }}
                          >
                            {PAPEIS_ATRIBUIVEIS.map((p) => (
                              <option key={p} value={p} style={{ background: '#020810' }}>{labelPapel(p)}</option>
                            ))}
                          </select>
                        ) : (
                          <button onClick={() => setEditandoId(`${m.origem}-${m.id}`)} title={t.editarPapel}
                            className="p-2 rounded-lg" style={{ background: 'rgba(106,176,255,0.1)', color: AZUL }}>
                            <Pencil size={15} />
                          </button>
                        )}

                        {confirmandoId === `${m.origem}-${m.id}` ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => removerAcesso(m)}
                              className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.2)', color: VERMELHO, border: `1px solid ${VERMELHO}50` }}>
                              {t.confirmar}
                            </button>
                            <button onClick={() => setConfirmandoId(null)}
                              className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: '#5a7a9a' }}>
                              {t.cancelar}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmandoId(`${m.origem}-${m.id}`)} title={t.removerAcesso}
                            className="p-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.08)', color: VERMELHO }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CanvasBox>

      </div>

      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24 pb-8 overflow-y-auto"
            style={{ background: 'rgba(2,8,16,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={() => setModalAberto(false)}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="w-full max-w-md rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
              style={{ background: 'rgba(10,22,40,0.98)', border: `1px solid ${JADE}50` }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={{ ...FONTE_EXEC, color: '#c8d8f0' }}>{t.novoConvite}</p>
                <button onClick={() => setModalAberto(false)} style={{ color: '#5a7a9a' }}><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{t.emailLabel}</label>
                  <input type="email" value={form.email_convidado} onChange={(e) => setForm({ ...form, email_convidado: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(2,8,16,0.7)', border: '1px solid rgba(106,176,255,0.2)', color: '#c8d8f0' }} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{t.nomeLabel}</label>
                  <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(2,8,16,0.7)', border: '1px solid rgba(106,176,255,0.2)', color: '#c8d8f0' }} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{t.cargoLabel}</label>
                  <input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(2,8,16,0.7)', border: '1px solid rgba(106,176,255,0.2)', color: '#c8d8f0' }} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: '#5a7a9a' }}>{t.papelLabel}</label>
                  <select value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(2,8,16,0.7)', border: '1px solid rgba(106,176,255,0.2)', color: '#c8d8f0' }}>
                    {PAPEIS_ATRIBUIVEIS.map((p) => (
                      <option key={p} value={p} style={{ background: '#020810' }}>{labelPapel(p)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setModalAberto(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(106,176,255,0.1)', color: AZUL }}>{t.cancelar}</button>
                  <button onClick={enviarConvite} disabled={enviando || !form.email_convidado.trim()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${JADE}, ${BRONZE})`, color: '#fff' }}>
                    {enviando ? t.enviando : t.enviarConvite}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  )
}
