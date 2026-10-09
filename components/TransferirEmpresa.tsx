'use client'
// Aba "Transferir empresa" (Config → Empresa) — Elias, 2026-10-09.
// Passagem da empresa DE VERDADE (venda, doação, sucessão, reorganização) com os
// dados que a lei pede. O botão "Transferir propriedade" da Equipe continua só pra
// passar o comando do Axioma a um CEO/Sócio/Admin permanente.
import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRightLeft, Copy, FileText, ShieldCheck, XCircle } from 'lucide-react'
import { CanvasBox } from './CanvasBox'
import { copiarTexto } from '../lib/copiar'
import { gerarPdfTabela } from '../lib/gerarPdfTabela'
import { uploadDocumento, criarDocumento } from '../lib/empresaHelpers'
import {
  TIPOS_SOCIETARIOS, TIPOS_OPERACAO, AVISO_BLOQUEADO, BASE_LEGAL_DATA, checklistDe, tipoSugerido, docValido,
  listarTransferencias, pedirTransferencia, cancelarTransferencia,
  type TipoSocietario, type TipoOperacao, type Transferencia,
} from '../lib/transferenciaEmpresa'

type Props = {
  empresa: { id: string; nome?: string; razao_social?: string; porte?: string | null; natureza_juridica?: string | null }
  userId: string
  lang: 'pt' | 'en' | 'es'
  temaClaro: boolean
  cartaoTema: { fundo?: string; premium3d: boolean }
  inputStyle: React.CSSProperties
  cores: { TEXTO: string; CINZA: string; VERDE: string; VERMELHO: string; AMARELO: string }
  aviso: (msg: string, tipo?: 'info' | 'erro' | 'ok') => void
  aoMudar?: () => void
}

const FORM_VAZIO = { tipo: '' as TipoSocietario | '', operacao: 'venda' as TipoOperacao, cedenteNome: '', cedenteDoc: '', nome: '', doc: '', email: '',
  protocolo: '', juntaData: '', motivo: '', ficaAdmin: true, senha: '', declaracao: false }

export default function TransferirEmpresa({ empresa, userId, lang, temaClaro, cartaoTema, inputStyle, cores, aviso, aoMudar }: Props) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { TEXTO, CINZA, VERDE, VERMELHO, AMARELO } = cores
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const dataBR = (iso?: string | null) => iso ? new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString(locale) : '—'
  const aninhado = temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(255,255,255,0.04)'
  // Regra do Elias (2026-10-09): todo botão é verde-menta escuro ou azul-marinho escuro, texto branco
  const botaoVerde = { background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }
  const botaoNavy = { background: '#101b3d', color: '#fff', border: '1px solid rgba(46,204,155,0.35)' }

  const [itens, setItens] = useState<Transferencia[]>([])
  const [souProprietario, setSouProprietario] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [semAcesso, setSemAcesso] = useState(false)
  const [form, setForm] = useState({ ...FORM_VAZIO, tipo: tipoSugerido(empresa.porte, empresa.natureza_juridica) })
  const [marcados, setMarcados] = useState<Record<string, boolean>>({})
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [motivoCancelar, setMotivoCancelar] = useState('')

  async function carregar() {
    setCarregando(true)
    const r = await listarTransferencias(empresa.id)
    setCarregando(false)
    if (r.erro === 'sem_permissao') { setSemAcesso(true); return }
    if (r.erro) { aviso(L('Não foi possível carregar as transferências agora. Recarregue a página.', 'Could not load transfers now. Reload the page.', 'No se pudieron cargar las transferencias ahora. Recargue la página.'), 'erro'); return }
    setItens(r.itens || []); setSouProprietario(!!r.souProprietario)
  }
  useEffect(() => { void carregar() }, [empresa.id])

  const aberta = itens.find((t) => t.situacao === 'aguardando')
  const tipoInfo = TIPOS_SOCIETARIOS.find((x) => x.key === form.tipo)
  const bloqueado = form.tipo === 'mei' || form.tipo === 'ei'
  // Lista aparece sempre (sem tipo escolhido ainda, mostra a de LTDA, a mais comum)
  const lista = bloqueado ? [] : checklistDe(form.tipo || 'ltda', form.operacao)
  const linkDe = (token?: string) => token ? `${window.location.origin}/transferencia/${token}` : ''
  const nomeOperacao = (k: string) => TIPOS_OPERACAO.find((x) => x.key === k)?.nome[lang] ?? k
  const nomeTipo = (k: string) => TIPOS_SOCIETARIOS.find((x) => x.key === k)?.nome[lang] ?? k
  const SITUACAO: Record<string, { txt: string; cor: string }> = {
    aguardando: { txt: L('Aguardando aceite', 'Waiting for acceptance', 'Esperando aceptación'), cor: AMARELO },
    concluida: { txt: L('Concluída', 'Completed', 'Concluida'), cor: VERDE },
    cancelada: { txt: L('Cancelada', 'Cancelled', 'Cancelada'), cor: VERMELHO },
    expirada: { txt: L('Expirou sem aceite', 'Expired without acceptance', 'Expiró sin aceptación'), cor: CINZA },
  }

  // O que ainda falta (o botão só libera com tudo certo)
  const faltando: string[] = []
  if (!form.tipo) faltando.push(L('tipo da empresa', 'company type', 'tipo de empresa'))
  if (form.cedenteNome.trim().length < 3 || !docValido(form.cedenteDoc)) faltando.push(L('seus dados (nome e CPF/CNPJ válido)', 'your details (name and valid CPF/CNPJ)', 'sus datos (nombre y CPF/CNPJ válido)'))
  if (form.nome.trim().length < 3 || !docValido(form.doc) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) faltando.push(L('dados de quem recebe (nome, CPF/CNPJ válido e e-mail)', 'recipient details (name, valid CPF/CNPJ and e-mail)', 'datos de quien recibe (nombre, CPF/CNPJ válido y correo)'))
  if (form.protocolo.trim().length < 3 || !form.juntaData) faltando.push(L('protocolo e data da Junta', 'Registry protocol and date', 'protocolo y fecha de la Junta'))
  if (!arquivo) faltando.push(L('documento em PDF', 'PDF document', 'documento en PDF'))
  if (lista.some((i) => i.obrigatorio && !marcados[i.id])) faltando.push(L('itens obrigatórios da lista', 'required checklist items', 'ítems obligatorios de la lista'))
  if (form.motivo.trim().length < 5) faltando.push(L('motivo', 'reason', 'motivo'))
  if (!form.declaracao) faltando.push(L('declaração', 'declaration', 'declaración'))
  if (!form.senha) faltando.push(L('sua senha', 'your password', 'su contraseña'))

  const ERROS: Record<string, string> = {
    senha: L('Senha incorreta. Nada foi enviado.', 'Wrong password. Nothing was sent.', 'Contraseña incorrecta. No se envió nada.'),
    muitas_tentativas: L('Muitas tentativas erradas. Aguarde 15 minutos.', 'Too many wrong attempts. Wait 15 minutes.', 'Demasiados intentos fallidos. Espere 15 minutos.'),
    ja_existe: L('Já existe uma transferência aguardando aceite. Cancele a atual para pedir outra.', 'A transfer is already waiting for acceptance. Cancel it to request another.', 'Ya hay una transferencia esperando aceptación. Cancélela para pedir otra.'),
    mesma_pessoa: L('Quem recebe precisa ter outro e-mail, diferente do seu.', 'The recipient needs a different e-mail from yours.', 'Quien recibe necesita otro correo, distinto del suyo.'),
    tipo_bloqueado: L('Este tipo de empresa não pode ser transferido (veja o aviso acima).', 'This company type cannot be transferred (see the notice above).', 'Este tipo de empresa no se puede transferir (vea el aviso arriba).'),
    junta_data: L('A data da Junta não pode ser no futuro.', 'The Registry date cannot be in the future.', 'La fecha de la Junta no puede ser futura.'),
    so_proprietario: L('Só o Proprietário pode transferir a empresa.', 'Only the Owner can transfer the company.', 'Solo el Propietario puede transferir la empresa.'),
  }

  async function enviar() {
    if (faltando.length || !arquivo || !form.tipo || bloqueado) return
    setEnviando(true); setErro('')
    const up = await uploadDocumento(arquivo, empresa.id, userId, 'alteracao_contratual')
    if (up.erro) { setEnviando(false); setErro(L('Não foi possível enviar o PDF. Tente de novo.', 'Could not upload the PDF. Try again.', 'No se pudo subir el PDF. Intente de nuevo.')); return }
    const doc = await criarDocumento(empresa.id, userId, {
      tipo: 'alteracao_contratual', nome: L('Transferência da empresa', 'Company transfer', 'Transferencia de la empresa') + ` — ${form.nome.trim()}`,
      numero_documento: form.protocolo.trim(), data_emissao: form.juntaData, orgao_emissor: 'Junta Comercial',
      storage_path: up.path, mime_type: arquivo.type, tamanho_bytes: arquivo.size,
    })
    if (doc.erro || !doc.id) { setEnviando(false); setErro(L('O PDF subiu, mas não entrou no Cofre. Tente de novo.', 'The PDF uploaded but did not reach the Vault. Try again.', 'El PDF subió, pero no entró en la Bóveda. Intente de nuevo.')); return }
    const r = await pedirTransferencia({
      empresaId: empresa.id, tipoSocietario: form.tipo, tipoOperacao: form.operacao,
      cedenteNome: form.cedenteNome, cedenteDoc: form.cedenteDoc, cessionarioNome: form.nome, cessionarioDoc: form.doc, cessionarioEmail: form.email,
      juntaProtocolo: form.protocolo, juntaData: form.juntaData, documentoId: doc.id, checklist: marcados,
      motivo: form.motivo, cedenteFicaAdmin: form.ficaAdmin, senha: form.senha,
    })
    setEnviando(false)
    if (!r.token) { setForm((f) => ({ ...f, senha: '' })); setErro(ERROS[r.erro || ''] || L('Não foi possível enviar o pedido agora. Nada mudou — confira os dados e tente de novo.', 'Could not send the request now. Nothing changed — check the details and try again.', 'No se pudo enviar el pedido ahora. Nada cambió — revise los datos e intente de nuevo.')); return }
    aviso(L('Pedido enviado. Mande o link para quem recebe.', 'Request sent. Send the link to the recipient.', 'Pedido enviado. Envíe el enlace a quien recibe.'), 'ok')
    setForm({ ...FORM_VAZIO, tipo: form.tipo }); setMarcados({}); setArquivo(null)
    await carregar(); aoMudar?.()
  }

  async function cancelar(id: string) {
    if (motivoCancelar.trim().length < 5) { aviso(L('Escreva o motivo (pelo menos 5 letras).', 'Write the reason (at least 5 letters).', 'Escriba el motivo (al menos 5 letras).'), 'erro'); return }
    const r = await cancelarTransferencia(empresa.id, id, motivoCancelar)
    if (!r.ok) { aviso(L('Não foi possível cancelar agora. Tente de novo.', 'Could not cancel now. Try again.', 'No se pudo cancelar ahora. Intente de nuevo.'), 'erro'); return }
    aviso(L('Transferência cancelada. O link não vale mais.', 'Transfer cancelled. The link no longer works.', 'Transferencia cancelada. El enlace ya no vale.'), 'ok')
    setCancelandoId(null); setMotivoCancelar(''); await carregar()
  }

  function baixarHistorico() {
    gerarPdfTabela({
      titulo: L('Histórico de transferências', 'Transfer history', 'Historial de transferencias') + ` — ${empresa.razao_social || empresa.nome || ''}`,
      subtitulo: new Date().toLocaleDateString(locale),
      colunas: [
        { header: L('PEDIDO', 'REQUEST', 'PEDIDO'), key: 'data', width: 18 },
        { header: L('PARA', 'TO', 'PARA'), key: 'para', width: 40 },
        { header: L('OPERAÇÃO', 'OPERATION', 'OPERACIÓN'), key: 'op', width: 26 },
        { header: L('JUNTA', 'REGISTRY', 'JUNTA'), key: 'junta', width: 30 },
        { header: L('SITUAÇÃO', 'STATUS', 'ESTADO'), key: 'sit', width: 26 },
      ],
      linhas: itens.map((t) => ({ data: dataBR(t.created_at), para: `${t.cessionario_nome} (${t.cessionario_doc})`, op: nomeOperacao(t.tipo_operacao),
        junta: `${t.junta_protocolo} — ${dataBR(t.junta_data)}`, sit: `${SITUACAO[t.situacao]?.txt ?? t.situacao}${t.aceite_em ? ' ' + dataBR(t.aceite_em) : ''}` })),
      nomeArquivo: 'historico-transferencias',
    }, (m) => aviso(m, 'erro'), lang)
  }

  const campo = (rotulo: string, filho: ReactNode, dica?: string) => (
    <label className="block">
      <span className="text-xs font-semibold" style={{ color: TEXTO }}>{rotulo}</span>
      <div className="mt-1">{filho}</div>
      {dica && <span className="text-[11px] block mt-1" style={{ color: CINZA }}>{dica}</span>}
    </label>
  )
  const entrada = (valor: string, mudar: (v: string) => void, extra: Record<string, unknown> = {}) => (
    <input value={valor} onChange={(e) => mudar(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle} {...extra} />
  )
  const passo = (n: number, titulo: string, filho: ReactNode) => (
    <div className="rounded-xl p-3 sm:p-4 axi-card-premium3d axi-card-faixa" style={{ background: aninhado }}>
      <p className="text-sm font-bold mb-3" style={{ color: TEXTO }}>{n}. {titulo}</p>
      {filho}
    </div>
  )

  if (carregando) return <CanvasBox cor={VERDE} {...cartaoTema}><p className="text-sm" style={{ color: CINZA }}>{L('Carregando…', 'Loading…', 'Cargando…')}</p></CanvasBox>
  if (semAcesso) return (
    <CanvasBox cor={VERDE} {...cartaoTema}>
      <p className="text-sm" style={{ color: TEXTO }}>{L('Só o Proprietário, o CEO, os Sócios e os Admins veem as transferências da empresa.', 'Only the Owner, CEO, Partners and Admins see company transfers.', 'Solo el Propietario, el CEO, los Socios y los Admins ven las transferencias de la empresa.')}</p>
    </CanvasBox>
  )

  return (
    <div className="space-y-4">
      {/* O que é esta aba */}
      <CanvasBox cor={VERDE} {...cartaoTema}>
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: TEXTO }}><ArrowRightLeft size={18} /> {L('Transferir empresa', 'Transfer company', 'Transferir empresa')}</h3>
        <p className="text-sm mt-1" style={{ color: TEXTO }}>
          {L('Use aqui quando a empresa muda de dono de verdade: venda, doação, herança ou reorganização entre sócios. Quem recebe vira o Proprietário no Axioma depois de aceitar.',
            'Use this when the company really changes owner: sale, donation, inheritance or reorganization among partners. The recipient becomes the Owner in Axioma after accepting.',
            'Use esto cuando la empresa cambia de dueño de verdad: venta, donación, herencia o reorganización entre socios. Quien recibe pasa a ser el Propietario en Axioma tras aceptar.')}
        </p>
        <p className="text-xs mt-2" style={{ color: CINZA }}>
          {L('Só quer passar o comando do Axioma para um CEO, Sócio ou Admin que já está na equipe? Use "Transferir propriedade" na tela Equipe.',
            'Just want to hand Axioma control to a CEO, Partner or Admin already on the team? Use "Transfer ownership" on the Team screen.',
            '¿Solo quiere pasar el control de Axioma a un CEO, Socio o Admin que ya está en el equipo? Use "Transferir propiedad" en la pantalla Equipo.')}
        </p>
        <p className="text-[11px] mt-2" style={{ color: CINZA }}>
          {L(`Regras da lei conferidas em ${dataBR(BASE_LEGAL_DATA)} (Código Civil, Lei 6.404/76 e normas do DREI). Leis mudam: confirme com a Junta Comercial do seu estado antes de assinar.`,
            `Legal rules checked on ${dataBR(BASE_LEGAL_DATA)} (Civil Code, Law 6,404/76 and DREI rules). Laws change: confirm with your state Commercial Registry before signing.`,
            `Reglas legales verificadas el ${dataBR(BASE_LEGAL_DATA)} (Código Civil, Ley 6.404/76 y normas del DREI). Las leyes cambian: confirme con la Junta Comercial de su estado antes de firmar.`)}
        </p>
      </CanvasBox>

      {/* Transferência em andamento */}
      {aberta && (
        <CanvasBox cor={AMARELO} {...cartaoTema}>
          <p className="text-sm font-bold" style={{ color: TEXTO }}>{L('Transferência aguardando aceite', 'Transfer waiting for acceptance', 'Transferencia esperando aceptación')}</p>
          <p className="text-sm mt-1" style={{ color: TEXTO }}>
            {L(`Para ${aberta.cessionario_nome} (${aberta.cessionario_email}). Vale até ${dataBR(aberta.expira_em)}.`, `To ${aberta.cessionario_nome} (${aberta.cessionario_email}). Valid until ${dataBR(aberta.expira_em)}.`, `Para ${aberta.cessionario_nome} (${aberta.cessionario_email}). Vale hasta ${dataBR(aberta.expira_em)}.`)}
          </p>
          {souProprietario && aberta.token && (
            <div className="mt-3 rounded-xl p-3" style={{ background: aninhado }}>
              <p className="text-xs" style={{ color: TEXTO }}>{L(`Envie este link para ${aberta.cessionario_nome}. Ele entra com o e-mail ${aberta.cessionario_email} e aceita com o CPF.`, `Send this link to ${aberta.cessionario_nome}. They sign in with ${aberta.cessionario_email} and accept with their CPF.`, `Envíe este enlace a ${aberta.cessionario_nome}. Entra con el correo ${aberta.cessionario_email} y acepta con su CPF.`)}</p>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input readOnly value={linkDe(aberta.token)} className="flex-1 px-3 py-2 rounded-xl text-xs" style={inputStyle} />
                <button onClick={async () => { if (await copiarTexto(linkDe(aberta.token))) aviso(L('Link copiado.', 'Link copied.', 'Enlace copiado.'), 'ok') }}
                  className="px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={botaoNavy}><Copy size={14} /> {L('Copiar link', 'Copy link', 'Copiar enlace')}</button>
              </div>
            </div>
          )}
          {souProprietario && (cancelandoId === aberta.id ? (
            <div className="mt-3 space-y-2">
              {entrada(motivoCancelar, setMotivoCancelar, { placeholder: L('Por que está cancelando? (obrigatório)', 'Why are you cancelling? (required)', '¿Por qué cancela? (obligatorio)') })}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setCancelandoId(null); setMotivoCancelar('') }} className="py-2 rounded-xl text-sm font-bold" style={botaoNavy}>{L('Voltar', 'Back', 'Volver')}</button>
                <button onClick={() => void cancelar(aberta.id)} className="py-2 rounded-xl text-sm font-bold" style={botaoNavy}>{L('Cancelar transferência', 'Cancel transfer', 'Cancelar transferencia')}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCancelandoId(aberta.id)} className="mt-3 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5" style={botaoNavy}>
              <XCircle size={14} /> {L('Cancelar transferência', 'Cancel transfer', 'Cancelar transferencia')}
            </button>
          ))}
        </CanvasBox>
      )}

      {/* Formulário (só o Proprietário, e só sem outra em andamento) */}
      {!souProprietario && !aberta && (
        <CanvasBox cor={VERDE} {...cartaoTema}>
          <p className="text-sm" style={{ color: TEXTO }}>{L('Só o Proprietário da empresa pode pedir uma transferência. Aqui você acompanha o histórico.', 'Only the company Owner can request a transfer. Here you follow the history.', 'Solo el Propietario de la empresa puede pedir una transferencia. Aquí sigue el historial.')}</p>
        </CanvasBox>
      )}
      {souProprietario && !aberta && (
        <CanvasBox cor={VERDE} {...cartaoTema}>
          <div className="space-y-3">
            {passo(1, L('Tipo da empresa e da operação', 'Company and operation type', 'Tipo de empresa y de operación'), (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campo(L('Tipo da empresa', 'Company type', 'Tipo de empresa'), (
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoSocietario })} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                    <option value="">—</option>
                    {TIPOS_SOCIETARIOS.map((x) => <option key={x.key} value={x.key}>{x.nome[lang]}</option>)}
                  </select>
                ), L('Já vem do cadastro quando dá. Confira no contrato social.', 'Comes from the registration when possible. Check the articles.', 'Viene del registro cuando es posible. Confírmelo en el contrato social.'))}
                {!bloqueado && campo(L('Operação', 'Operation', 'Operación'), (
                  <select value={form.operacao} onChange={(e) => setForm({ ...form, operacao: e.target.value as TipoOperacao })} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                    {TIPOS_OPERACAO.map((x) => <option key={x.key} value={x.key}>{x.nome[lang]}</option>)}
                  </select>
                ))}
              </div>
            ))}

            {bloqueado && (
              <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(248,113,113,0.10)', border: `1px solid ${VERMELHO}55`, color: TEXTO }}>
                <p className="font-bold mb-1" style={{ color: VERMELHO }}>{L(`${tipoInfo?.nome.pt} não pode ser transferido`, `${tipoInfo?.nome.en} cannot be transferred`, `${tipoInfo?.nome.es} no se puede transferir`)}</p>
                {AVISO_BLOQUEADO[form.tipo as 'mei' | 'ei'][lang]}
              </div>
            )}

            {!bloqueado && (<>
              {passo(2, L('Quem passa e quem recebe', 'Who transfers and who receives', 'Quién transfiere y quién recibe'), (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campo(L('Seu nome completo', 'Your full name', 'Su nombre completo'), entrada(form.cedenteNome, (v) => setForm({ ...form, cedenteNome: v })))}
                  {campo(L('Seu CPF ou CNPJ', 'Your CPF or CNPJ', 'Su CPF o CNPJ'), entrada(form.cedenteDoc, (v) => setForm({ ...form, cedenteDoc: v }), { inputMode: 'numeric' }))}
                  {campo(L('Nome completo de quem recebe', 'Recipient full name', 'Nombre completo de quien recibe'), entrada(form.nome, (v) => setForm({ ...form, nome: v })))}
                  {campo(L('CPF ou CNPJ de quem recebe', 'Recipient CPF or CNPJ', 'CPF o CNPJ de quien recibe'), entrada(form.doc, (v) => setForm({ ...form, doc: v }), { inputMode: 'numeric' }),
                    L('Se for pessoa física, ela vai confirmar este mesmo CPF ao aceitar.', 'If an individual, they confirm this same CPF when accepting.', 'Si es persona física, confirmará este mismo CPF al aceptar.'))}
                  <div className="sm:col-span-2">
                    {campo(L('E-mail de quem recebe', 'Recipient e-mail', 'Correo de quien recibe'), entrada(form.email, (v) => setForm({ ...form, email: v }), { type: 'email' }),
                      L('Ela entra no Axioma com este e-mail para aceitar. Se ainda não tem conta, cria na hora.', 'They sign in to Axioma with this e-mail to accept. If they have no account yet, they create one.', 'Entra en Axioma con este correo para aceptar. Si aún no tiene cuenta, la crea en el momento.'))}
                  </div>
                </div>
              ))}

              {passo(3, L('Registro na Junta Comercial', 'Commercial Registry filing', 'Registro en la Junta Comercial'), (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campo(L('Número do protocolo ou registro', 'Protocol or registration number', 'Número de protocolo o registro'), entrada(form.protocolo, (v) => setForm({ ...form, protocolo: v })))}
                  {campo(L('Data do registro', 'Registration date', 'Fecha del registro'), entrada(form.juntaData, (v) => setForm({ ...form, juntaData: v }), { type: 'date', max: new Date().toISOString().slice(0, 10) }))}
                  <div className="sm:col-span-2">
                    {campo(L('Documento da transferência (PDF)', 'Transfer document (PDF)', 'Documento de la transferencia (PDF)'), (
                      <input type="file" accept="application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] || null)} className="w-full text-sm" style={{ color: TEXTO }} />
                    ), L('Fica guardado também no Cofre da empresa.', 'Also stored in the company Vault.', 'También queda guardado en la Bóveda de la empresa.'))}
                  </div>
                </div>
              ))}

              {passo(4, L('O que a lei pede', 'What the law requires', 'Lo que pide la ley'), (
                <div className="space-y-2">
                  {lista.map((i) => (
                    <label key={i.id} className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!marcados[i.id]} onChange={(e) => setMarcados({ ...marcados, [i.id]: e.target.checked })} className="mt-1" />
                      <span className="text-sm" style={{ color: TEXTO }}>
                        {i.texto[lang]} <span className="text-[11px] font-semibold" style={{ color: i.obrigatorio ? VERMELHO : CINZA }}>({i.obrigatorio ? L('obrigatório', 'required', 'obligatorio') : L('recomendado', 'recommended', 'recomendado')})</span>
                        <span className="block text-[11px]" style={{ color: CINZA }}>{i.ajuda[lang]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ))}

              {passo(5, L('Confirmar', 'Confirm', 'Confirmar'), (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold" style={{ color: TEXTO }}>{L('Depois da troca, você:', 'After the transfer, you:', 'Después del cambio, usted:')}</span>
                    <div className="flex flex-col sm:flex-row gap-3 mt-1">
                      {[{ v: true, t: L('Continua como Admin', 'Stay as Admin', 'Sigue como Admin') }, { v: false, t: L('Sai da empresa no Axioma', 'Leave the company in Axioma', 'Sale de la empresa en Axioma') }].map((o) => (
                        <label key={String(o.v)} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: TEXTO }}>
                          <input type="radio" checked={form.ficaAdmin === o.v} onChange={() => setForm({ ...form, ficaAdmin: o.v })} /> {o.t}
                        </label>
                      ))}
                    </div>
                  </div>
                  {campo(L('Motivo', 'Reason', 'Motivo'), (
                    <textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                  ))}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.declaracao} onChange={(e) => setForm({ ...form, declaracao: e.target.checked })} className="mt-1" />
                    <span className="text-sm" style={{ color: TEXTO }}>{L('Declaro que as informações são verdadeiras e que a transferência foi formalizada como a lei pede. Sei que, depois do aceite, quem recebe passa a ser o Proprietário e só ele pode desfazer.',
                      'I declare the information is true and the transfer was formalized as the law requires. I know that after acceptance the recipient becomes the Owner and only they can undo it.',
                      'Declaro que la información es verdadera y que la transferencia se formalizó como pide la ley. Sé que, tras la aceptación, quien recibe pasa a ser el Propietario y solo él puede deshacerlo.')}</span>
                  </label>
                  {campo(L('Sua senha do Axioma', 'Your Axioma password', 'Su contraseña de Axioma'), entrada(form.senha, (v) => setForm({ ...form, senha: v }), { type: 'password', autoComplete: 'new-password' }))}
                  {faltando.length > 0 && (
                    <p className="text-xs" style={{ color: CINZA }}>{L('Falta: ', 'Missing: ', 'Falta: ')}{faltando.join(', ')}.</p>
                  )}
                  {erro && <p className="text-sm font-semibold" style={{ color: VERMELHO }}>{erro}</p>}
                  <button onClick={() => void enviar()} disabled={enviando || faltando.length > 0}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:cursor-not-allowed" style={botaoVerde}>
                    <ShieldCheck size={16} /> {enviando ? L('Enviando…', 'Sending…', 'Enviando…') : L('Enviar pedido de transferência', 'Send transfer request', 'Enviar pedido de transferencia')}
                  </button>
                </div>
              ))}
            </>)}
          </div>
        </CanvasBox>
      )}

      {/* Histórico */}
      <CanvasBox cor={VERDE} {...cartaoTema}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <p className="text-sm font-bold" style={{ color: TEXTO }}>{L('Histórico de transferências', 'Transfer history', 'Historial de transferencias')}</p>
          {itens.length > 0 && (
            <button onClick={baixarHistorico} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={botaoNavy}><FileText size={14} /> {L('Baixar PDF', 'Download PDF', 'Descargar PDF')}</button>
          )}
        </div>
        {itens.length === 0 ? (
          <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma transferência pedida ainda. Quando houver, cada uma fica registrada aqui para sempre.', 'No transfer requested yet. When there is one, it stays recorded here for good.', 'Ninguna transferencia pedida aún. Cuando haya, cada una queda registrada aquí para siempre.')}</p>
        ) : (
          <div className="space-y-2">
            {itens.map((t) => {
              const s = SITUACAO[t.situacao] ?? { txt: t.situacao, cor: CINZA }
              return (
                <div key={t.id} className="rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={{ background: aninhado }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: TEXTO }}>{t.cedente_nome} <ArrowRightLeft size={12} className="inline mx-1" /> {t.cessionario_nome}</p>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${s.cor}22`, color: s.cor, border: `1px solid ${s.cor}50` }}>{s.txt}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: CINZA }}>
                    {nomeOperacao(t.tipo_operacao)} · {nomeTipo(t.tipo_societario)} · {L('Junta', 'Registry', 'Junta')} {t.junta_protocolo} ({dataBR(t.junta_data)}) · {L('pedido em', 'requested on', 'pedido el')} {dataBR(t.created_at)}
                    {t.aceite_em ? ` · ${L('aceito em', 'accepted on', 'aceptado el')} ${dataBR(t.aceite_em)}` : ''}
                  </p>
                  <p className="text-xs mt-1" style={{ color: TEXTO }}>{L('Motivo', 'Reason', 'Motivo')}: {t.motivo}</p>
                  {t.cancelado_motivo && <p className="text-xs mt-1" style={{ color: VERMELHO }}>{L('Cancelada', 'Cancelled', 'Cancelada')}: {t.cancelado_motivo}</p>}
                </div>
              )
            })}
          </div>
        )}
      </CanvasBox>
    </div>
  )
}
