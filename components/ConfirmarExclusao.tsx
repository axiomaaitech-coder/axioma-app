'use client'
// Regra do Elias (2026-10-08): NENHUM módulo apaga dado de empresa sem AVISAR e sem a
// AUTORIZAÇÃO DE UM SUPERVISOR (dono/CEO, Sócio ou Admin). Janela única do Axioma:
// diz o que vai ser apagado e o que mais muda, pede o motivo e o e-mail + senha do
// supervisor; o servidor confere (/api/autorizar-exclusao) e grava na auditoria.
// Uso:
//   const { confirmar, janelaConfirmacao } = useConfirmarExclusao(temaClaro)
//   if (!(await confirmar({ oQue: `"${nome}"`, efeito: EFEITO.financeiro, tabela: "receitas", registroId: id }))) return
//   ... e renderizar {janelaConfirmacao} uma vez na tela.
import { useEffect, useState, type ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ShieldAlert } from 'lucide-react'
import Modal from './Modal'
import { CanvasBox } from './CanvasBox'
import { useLanguage } from '../lib/LanguageContext'
import { obterEmpresaAtiva, obterMeuPapel } from '../lib/empresaHelpers'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

type Texto = { pt: string; en: string; es: string }
type PedidoExclusao = { oQue: string | Texto; efeito?: Texto; tabela?: string; registroId?: string }
type Pedido = PedidoExclusao & { resolve: (ok: boolean) => void }

// Efeitos padrão — o mesmo texto em toda tela que apaga o mesmo tipo de dado.
export const EFEITO: Record<string, Texto> = {
  financeiro: {
    pt: 'O valor também é desfeito na Contabilidade, no Fluxo de Caixa, na DRE, nos relatórios e nas análises do Nexus/José.',
    en: 'The amount is also undone in Accounting, Cash Flow, the P&L, reports and Nexus/José analyses.',
    es: 'El valor también se deshace en Contabilidad, Flujo de Caja, Estado de Resultados, informes y análisis de Nexus/José.',
  },
  cadastro: {
    pt: 'Os lançamentos ligados a este cadastro continuam existindo, mas perdem o vínculo com ele (relatórios por fornecedor/cliente e Nexus/José deixam de vê-lo).',
    en: 'Entries linked to this record keep existing, but lose the link (supplier/customer reports and Nexus/José no longer see it).',
    es: 'Los registros vinculados siguen existiendo, pero pierden el vínculo (informes por proveedor/cliente y Nexus/José dejan de verlo).',
  },
  cascata: {
    pt: 'Tudo que pertence a este cadastro (contatos, documentos, contratos, produtos e histórico) é apagado junto.',
    en: 'Everything that belongs to this record (contacts, documents, contracts, products and history) is deleted with it.',
    es: 'Todo lo que pertenece a este catastro (contactos, documentos, contratos, productos e historial) se elimina junto.',
  },
  planejamento: {
    pt: 'Some dos painéis, relatórios e das análises da Inteligência do Axioma (inclusive do Nexus/José).',
    en: 'It disappears from dashboards, reports and Axioma Intelligence analyses (including Nexus/José).',
    es: 'Desaparece de los paneles, informes y análisis de la Inteligencia de Axioma (incluido Nexus/José).',
  },
}

// Nome do item que vai ser apagado (descrição, nome ou título), entre aspas; sem nome, o texto genérico.
export function nomeItem(item: unknown, generico: Texto): string | Texto {
  const x = (item ?? {}) as Record<string, unknown>
  const nome = [x.descricao, x.nome, x.titulo, x.nome_arquivo].find((v) => typeof v === 'string' && v.trim()) as string | undefined
  return nome ? `"${nome}"` : generico
}

export function useConfirmarExclusao(temaClaro: boolean): { confirmar: (p: PedidoExclusao) => Promise<boolean>; janelaConfirmacao: ReactNode } {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [motivo, setMotivo] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [conferindo, setConferindo] = useState(false)
  const [meuPapel, setMeuPapel] = useState<string | null>(null)
  const { idioma } = useLanguage()
  const lang = idioma === 'en' ? 'en' : idioma === 'es' ? 'es' : 'pt'
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const texto = temaClaro ? '#101b3d' : '#e5edf7'
  const campo = { background: temaClaro ? '#ffffff' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(163,177,194,0.3)', color: texto }

  // Sugere o e-mail de quem está logado (se for supervisor, só digita a senha).
  useEffect(() => {
    if (!pedido) return
    void supabase.auth.getUser().then(({ data }) => setEmail((e) => e || data.user?.email || ''))
    void obterEmpresaAtiva().then((id) => (id ? obterMeuPapel(id) : null)).then(setMeuPapel)
  }, [pedido])

  const fechar = (ok: boolean) => { pedido?.resolve(ok); setPedido(null); setMotivo(''); setSenha(''); setErro(''); setConferindo(false) }

  async function autorizar() {
    if (motivo.trim().length < 5) { setErro(L('Escreva o motivo (pelo menos 5 letras).', 'Write the reason (at least 5 letters).', 'Escriba el motivo (al menos 5 letras).')); return }
    if (!email.trim() || !senha) { setErro(L('Informe o e-mail e a senha do supervisor.', 'Enter the supervisor e-mail and password.', 'Informe el correo y la contraseña del supervisor.')); return }
    setConferindo(true); setErro('')
    const empresaId = await obterEmpresaAtiva()
    const r = await fetch('/api/autorizar-exclusao', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresaId, motivo, oQue: typeof pedido?.oQue === 'object' ? pedido.oQue.pt : pedido?.oQue, tabela: pedido?.tabela, registroId: pedido?.registroId, autorizador: { email, senha } }),
    }).then((x) => x.json()).catch(() => ({ erro: 'rede' }))
    if (r?.ok) { fechar(true); return }
    setConferindo(false); setSenha('')
    setErro(r?.erro === 'autorizador' ? L('E-mail ou senha incorretos, ou essa pessoa não é supervisor (dono, sócio ou administrador) desta empresa.', 'Wrong e-mail or password, or this person is not a supervisor (owner, partner or admin) of this company.', 'Correo o contraseña incorrectos, o esta persona no es supervisor (dueño, socio o administrador) de esta empresa.')
      : r?.erro === 'muitas_tentativas' ? L('Muitas tentativas erradas. Aguarde 15 minutos.', 'Too many wrong attempts. Wait 15 minutes.', 'Demasiados intentos fallidos. Espere 15 minutos.')
      : r?.erro === 'motivo' ? L('Escreva o motivo (pelo menos 5 letras).', 'Write the reason (at least 5 letters).', 'Escriba el motivo (al menos 5 letras).')
      : L('Não foi possível conferir a autorização agora. Nada foi apagado — tente de novo.', 'Could not check the authorization now. Nothing was deleted — try again.', 'No se pudo verificar la autorización ahora. No se eliminó nada — intente de nuevo.'))
  }

  const confirmar = (p: PedidoExclusao) => new Promise<boolean>((resolve) => setPedido({ ...p, resolve }))
  const souSupervisor = meuPapel === 'dono' || meuPapel === 'admin' || meuPapel === 'socio' || meuPapel === 'ceo'
  const NOME_PAPEL: Record<string, Texto> = {
    dono: { pt: 'Dono/CEO', en: 'Owner/CEO', es: 'Dueño/CEO' }, ceo: { pt: 'Dono/CEO', en: 'Owner/CEO', es: 'Dueño/CEO' },
    socio: { pt: 'Sócio', en: 'Partner', es: 'Socio' }, admin: { pt: 'Administrador', en: 'Administrator', es: 'Administrador' },
    financeiro: { pt: 'Financeiro', en: 'Finance', es: 'Finanzas' }, contabil: { pt: 'Contábil', en: 'Accounting', es: 'Contable' },
    leitor: { pt: 'Leitor', en: 'Viewer', es: 'Lector' }, operador: { pt: 'Operador', en: 'Operator', es: 'Operador' },
  }
  const bloco = (n: number, titulo: string, conteudo: ReactNode) => (
    <div className="rounded-lg px-3 py-2 mt-2 text-xs axi-card-premium3d axi-card-faixa" style={{ background: temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(255,255,255,0.04)', color: texto }}>
      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#f87171' }}>{n}. {titulo}</p>
      {conteudo}
    </div>
  )
  const janelaConfirmacao = (
    <Modal open={!!pedido} onClose={() => { if (!conferindo) fechar(false) }}>
      <CanvasBox cor="#f87171" fundo={temaClaro ? '#f6f7c4' : undefined}>
        <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: '#f87171' }}>AXIOMA AI.TECH</p>
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: texto }}>
          <ShieldAlert size={18} />{L('Exclusão precisa de autorização', 'Deletion needs authorization', 'La eliminación necesita autorización')}
        </h3>
        <p className="text-[11px] mt-1" style={{ color: texto, opacity: 0.8 }}>
          {L('Nada da empresa é apagado sem aviso, motivo e autorização de um supervisor — nem por pessoas, nem pela Inteligência do Axioma.', 'Nothing in the company is deleted without notice, a reason and a supervisor authorization — neither by people nor by Axioma Intelligence.', 'Nada de la empresa se elimina sin aviso, motivo y autorización de un supervisor — ni por personas ni por la Inteligencia de Axioma.')}
        </p>
        {bloco(1, L('O que está apagando', 'What is being deleted', 'Qué se está eliminando'),
          <p className="text-sm font-bold">{typeof pedido?.oQue === 'object' ? pedido.oQue[lang] : pedido?.oQue}</p>)}
        {bloco(2, L('Por que está apagando', 'Why it is being deleted', 'Por qué se está eliminando'),
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder={L('Escreva o motivo (obrigatório)', 'Write the reason (required)', 'Escriba el motivo (obligatorio)')}
            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={campo} />)}
        {bloco(3, L('Com que autoridade', 'Under what authority', 'Con qué autoridad'), (
          <>
            <p className="mb-2">
              {meuPapel ? `${L('Seu cargo nesta empresa', 'Your role in this company', 'Su cargo en esta empresa')}: ${NOME_PAPEL[meuPapel]?.[lang] ?? meuPapel}. ` : ''}
              {souSupervisor
                ? L('Você é supervisor: confirme com a sua senha.', 'You are a supervisor: confirm with your password.', 'Usted es supervisor: confirme con su contraseña.')
                : L('Só um supervisor (dono/CEO, sócio ou administrador) autoriza: peça para ele digitar o e-mail e a senha aqui.', 'Only a supervisor (owner/CEO, partner or admin) can authorize: ask them to type their e-mail and password here.', 'Solo un supervisor (dueño/CEO, socio o administrador) autoriza: pídale que escriba su correo y contraseña aquí.')}
            </p>
            <div className="space-y-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={L('E-mail do supervisor', 'Supervisor e-mail', 'Correo del supervisor')} autoComplete="off"
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={campo} />
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={L('Senha do supervisor', 'Supervisor password', 'Contraseña del supervisor')} autoComplete="new-password"
                onKeyDown={(e) => { if (e.key === 'Enter') void autorizar() }}
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={campo} />
            </div>
          </>
        ))}
        {bloco(4, L('Impacto', 'Impact', 'Impacto'), (
          <p>
            {pedido?.efeito?.[lang] ?? L('O registro some das telas, relatórios e análises da Inteligência do Axioma.', 'The record disappears from screens, reports and Axioma Intelligence analyses.', 'El registro desaparece de pantallas, informes y análisis de la Inteligencia de Axioma.')}
            {' '}{L('Apagado sem aviso, o operador e o contador trabalhariam com números que mudaram sem saber por quê — por isso fica registrado quem pediu, quem autorizou, quando e o motivo.', 'Deleted without notice, the operator and accountant would work with numbers that changed without knowing why — that is why who asked, who authorized, when and why stays on record.', 'Eliminado sin aviso, el operador y el contador trabajarían con números que cambiaron sin saber por qué — por eso queda registrado quién pidió, quién autorizó, cuándo y el motivo.')}
          </p>
        ))}
        {erro && <p className="text-xs font-semibold mt-2" style={{ color: '#f87171' }}>{erro}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => fechar(false)} disabled={conferindo} className="py-2.5 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #16a97d, #2ecc9b)', color: '#fff' }}>
            {L('Cancelar', 'Cancel', 'Cancelar')}
          </button>
          <button onClick={() => void autorizar()} disabled={conferindo} className="py-2.5 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: '#f87171', color: '#fff' }}>
            {conferindo ? L('Conferindo...', 'Checking...', 'Verificando...') : L('Autorizar e apagar', 'Authorize and delete', 'Autorizar y eliminar')}
          </button>
        </div>
      </CanvasBox>
    </Modal>
  )
  return { confirmar, janelaConfirmacao }
}
