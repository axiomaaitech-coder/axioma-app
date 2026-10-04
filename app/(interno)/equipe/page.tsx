'use client'
import { LetreiroExecutivo } from '../../../components/LetreiroExecutivo'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import {
  obterMeuPapel, listarEquipe, alterarPapelMembro, removerAcessoMembro,
  listarTermosConvite, listarLixeiraTermos, recuperarTermoConvite, transferirPropriedade, obterVagasEquipe, type VagasEquipe, apagarTermoConvite, decidirConvite, type TermoConvite,
  type MembroEquipe, obterMeuNivel, listarPedidosEquipe, decidirPedidoEquipe,
  concluirPedidoEquipe, restaurarMembro, type PedidoEquipe,
} from '../../../lib/empresaHelpers'
import ModuloLayout from '../../../components/ModuloLayout'
import { CanvasBox } from '../../../components/CanvasBox'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Pencil, Trash2, X, CheckCircle, AlertCircle, Users, Copy, Send, FileText, AlertTriangle, Menu, ChevronDown, RotateCcw, LogOut, ShieldCheck } from 'lucide-react'
import { CentroCompartilhamento } from '../../../components/CentroCompartilhamento'
import { canaisCompartilhamento } from '../../../lib/cfoTextos'
import Modal from '../../../components/Modal'
import { useThemeAxioma } from '../../../lib/ThemeContext'
import { ThemeToggle } from '../../../components/ThemeToggle'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Idioma = 'pt' | 'en' | 'es'

const JADE = '#047857'
const BRONZE = '#065f46'
const VERDE = '#34d399'
const VERMELHO = '#f87171'
const AMBAR = '#2ecc9b'
const AZUL = '#2ecc9b'
const FONTE_EXEC = { fontFamily: "'Georgia','Times New Roman',serif" }

// Link do convite sempre no domínio próprio (nunca o endereço da Vercel)
const SITE = 'https://axiomaai.com.br'

const PAPEIS_ATRIBUIVEIS = ['admin', 'financeiro', 'contabil', 'leitor', 'operador'] as const

const textos = {
  pt: {
    titulo: 'Equipe', sub: 'Quem tem acesso à sua empresa e com qual papel.',
    carregando: 'Carregando...',
    somenteProprietario: 'Só o proprietário da empresa acessa a Equipe.',
    meuPapelLabel: 'Qual é o seu papel? *', mp_admin: 'Admin',
    autTitulo: 'Autorização obrigatória', autAviso: 'Só Admin, Sócio ou CEO liberam acesso. Peça para um deles digitar o e-mail e a senha aqui.',
    autEmail: 'E-mail do Admin, Sócio ou CEO', autSenha: 'Senha dele(a)',
    erroAutorizador: 'E-mail ou senha do Admin/Sócio/CEO incorretos, ou essa pessoa não é Admin/Sócio/CEO desta empresa.', erroMuitas: 'Muitas tentativas. Aguarde 15 minutos.', erroMeuPapel: 'Escolha qual é o seu papel.',
    convidarSub: 'Você pode convidar pessoas para esta empresa. Sem ser Admin, Sócio ou CEO, o convite precisa da senha de um deles.',
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
    enviarPorApps: 'Enviar convite (WhatsApp, Gmail, Outlook, Telegram, e-mail)',
    erroEmail: 'Preencha um e-mail válido para enviar o convite.',
    semPrazoRegra: 'Indeterminado só para Admin, Sócio ou CEO.', aguardandoAprovacao: 'Aguardando sua aprovação', aprovar: 'Aprovar', recusar: 'Recusar', sucessoAprovar: 'Acesso liberado.', sucessoRecusar: 'Convite recusado.', erroDecidir: 'Não foi possível concluir. Tente novamente.', confirmarRecusa: 'Recusar o acesso desta pessoa?',
    cortarTitulo: 'Cortar acesso?', cortarAviso: 'Informe o motivo — fica registrado na auditoria da empresa com a data. O acesso fica suspenso por 7 dias e pode ser restaurado; se a pessoa estiver no seu nível ou acima, vira um pedido de aval.', cortarBotao: 'Cortar acesso', cortarCiente: 'Confirmo que tenho autorização para cortar este acesso.', motivoTerceiro: 'Dados de terceiro removidos pelo responsável',
    tempoAcesso: 'Tempo de acesso', semPrazo: 'Indeterminado', h24: '24 horas', dias: (n: number) => n === 180 ? '6 meses' : n === 365 ? '1 ano' : `${n} dias`, prazoMsg: (p: string) => ` por ${p}`,
    motivoLabel: 'Motivo do convite (ex.: segunda opinião no fechamento)', erroTermo: 'Marque o termo de responsabilidade para enviar o convite.',
    termoRemetente: (nome: string, data: string) => `Eu, ${nome}, envio este convite em ${data} e assumo a responsabilidade pelo acesso desta pessoa aos dados financeiros e bancários da empresa. Posso cortar o acesso a qualquer momento.`,
    acessoAte: (d: string) => `Acesso até ${d}`, acessoEncerrado: 'Acesso encerrado', cortarAcesso: 'Cortar acesso agora',
    relacaoLabel: 'Quem você está convidando', rel_ceo: 'CEO', rel_socio: 'Sócio', rel_contador: 'Contador', rel_funcionario: 'Funcionário', rel_consultor: 'Consultor (2ª opinião)', rel_outro: 'Outro',
    termosTitulo: 'Termos de convite aceitos', termosSub: 'Quem aceitou, com nome, CPF e e-mail informados no aceite. Só o proprietário e administradores veem e podem apagar estes dados.',
    lixeiraTitulo: 'Lixeira de termos', lixeiraSub: 'Dados de quem saiu da empresa. Ficam guardados por 60 dias e depois são apagados automaticamente.', lixeiraVazia: 'A lixeira está vazia.', recuperar: 'Recuperar', recuperado: 'Termo recuperado.', vagasPlano: (o: number, l: number) => `Vagas do plano: ${o} de ${l}`, tempPlano: (u: number, l: number) => `Convites temporários (até 7 dias): ${u} de ${l}`, erroLimitePlano: (l: number) => `Seu plano permite ${l} pessoa${l > 1 ? 's' : ''} na equipe (contando você). Mude para o plano acima para convidar mais. Não contam: operador de caixa, contador/consultor externo e convidado de até 7 dias.`, erroCotaTemp: (l: number) => `Você já usou os ${l} convites temporários (até 7 dias) do seu plano. Para convidar mais, suba de plano.`, verPlanos: 'Ver planos', transferirBotao: 'Transferir propriedade', transferirTitulo: 'Transferir a propriedade da empresa', transferirAviso: (n: string) => `${n} passa a ser o Proprietário: manda na empresa, na equipe e na assinatura. Você continua na equipe como Administrador.`, transferirCiente: 'Entendo que deixo de ser o Proprietário desta empresa.', transferirConfirmar: 'Transferir', transferido: 'Propriedade transferida.', erroSemAtivo: 'Escolha alguém com acesso ativo na equipe.', saiuEm: (d: string) => `Saiu em ${d}`, apagaEm: (d: string) => `Apagado em ${d}`,
    semTermos: 'Nenhum termo aceito ainda.', convidadoPorEm: (r: string, d: string) => `Convidado por ${r} em ${d}`, aceitoEm: (d: string) => `Aceito em ${d}`,
    dadosApagados: (d: string, m: string) => `Dados pessoais apagados em ${d}. Motivo: ${m}`, apagarDados: 'Apagar dados pessoais deste termo',
    apagarTitulo: 'Apagar dados pessoais do termo?', apagarAviso: 'O nome, o CPF e o e-mail desta pessoa serão apagados de forma definitiva. Fica registrado apenas quem apagou, quando e o motivo.',
    apagarMotivo: 'Motivo *', apagarCiente: 'Confirmo que tenho autorização para apagar estes dados e que a ação não pode ser desfeita.', apagarBotao: 'Apagar dados', apagando: 'Apagando...',
    sucessoApagar: 'Dados pessoais apagados.', erroApagar: 'Não foi possível apagar. Tente novamente.',
    enviarPor: 'Gerar e enviar o convite por:', conviteLink: 'Convite por link', outroEmail: 'Outro e-mail', copiarLinkCurto: 'Copiar link',
    assuntoConvite: 'Convite para a equipe no Axioma',
    msgConvite: 'Olá{nome}! {remetente} convidou você para entrar na nossa empresa no Axioma como {papel}{prazo}.\n\nToque no link, preencha o formulário e pronto, você já entra:\n{link}\n\nO link vale por {validade}.',
    papel_dono: 'Proprietário', papel_admin: 'Admin (acesso total)', papel_financeiro: 'Financeiro',
    papel_contabil: 'Contábil', papel_leitor: 'Leitor (só visualização)', papel_operador: 'Caixa (só PDV, sem acesso ao Axioma)',
    erroGenerico: 'Não foi possível concluir. Tente de novo.',
    erroDuplicado: 'Já existe um convite pendente pra este e-mail.',
    erroUltimoDono: 'Não é possível remover ou rebaixar o único proprietário da empresa.',
    erroConviteExpirado: 'Este convite expirou.',
    erroConviteUsado: 'Este convite já foi utilizado.',
    erroNaoProprietario: 'Só Admin, Sócio, CEO ou Proprietário veem a equipe.',
    hierarquia: 'Hierarquia: Proprietário › CEO › Sócio › Admin › demais. Remover = suspender por 7 dias (dá para restaurar).',
    nivel_1: 'Proprietário', nivel_2: 'CEO', nivel_3: 'Sócio', nivel_4: 'Admin',
    sucessoSuspenso: 'Acesso suspenso. Dá para restaurar em até 7 dias.',
    sucessoPedido: 'Pedido enviado. A remoção precisa do aval de alguém acima (vale 7 dias).',
    sucessoEncerrado: 'Acesso encerrado de vez (convite com prazo). Para voltar, envie um novo convite.',
    cortarAvisoPrazo: 'Acesso de até 30 dias: cortar encerra DE VEZ, sem restaurar. Para a pessoa voltar, envie um novo convite. O motivo fica na auditoria da empresa com a data.',
    sucessoSaiu: 'Você saiu da empresa.', sucessoRestaurar: 'Acesso restaurado.',
    statusSuspenso: (ate: string) => `Suspenso — restaurar até ${ate}`, restaurar: 'Restaurar acesso',
    sairEmpresa: 'Sair desta empresa', confirmarSair: 'Sair desta empresa? Você perde o acesso na hora (um Sócio ou acima pode restaurar em até 7 dias).',
    pedidosTitulo: 'Remoções aguardando aval', pedidoDe: (quem: string, alvo: string) => `${quem} pediu para remover ${alvo}`,
    avalDe: (n: string) => `Aval de: ${n} ou acima`, venceEm: (d: string) => `Vale até ${d}`,
    concluirSemAval: 'Concluir sem aval', motivoConcluir: 'Ninguém acima respondeu em 7 dias. Motivo para concluir (mín. 5 letras):',
    sucessoDecidido: 'Pedido decidido.', unicoGestor: 'Só você gerencia esta equipe. Convide um Sócio ou Admin para a empresa nunca ficar sem gestor.',
    erroHierarquia: 'Seu nível não permite esta ação.', erroProprietario: 'Ninguém remove o Proprietário.',
    erroProprietarioSair: 'O Proprietário não pode sair: transfira a empresa antes.', erroMotivo: 'Escreva o motivo (mínimo 5 letras).',
    erroPedidoAberto: 'Já existe um pedido aberto para esta pessoa.', erroAindaAcima: 'Ainda existe alguém acima para decidir.',
    erroPrazoAval: 'O prazo de aval (7 dias) ainda não venceu.', erroRestaurar: 'Passou o prazo de 7 dias para restaurar.',
  },
  en: {
    titulo: 'Team', sub: 'Who has access to your company and with which role.',
    carregando: 'Loading...',
    somenteProprietario: 'Only the company owner can access Team.',
    meuPapelLabel: 'What is your role? *', mp_admin: 'Admin',
    autTitulo: 'Authorization required', autAviso: 'Only Admin, Partner or CEO can grant access. Ask one of them to type their e-mail and password here.',
    autEmail: 'Admin, Partner or CEO e-mail', autSenha: 'Their password',
    erroAutorizador: 'Wrong Admin/Partner/CEO e-mail or password, or this person is not Admin/Partner/CEO of this company.', erroMuitas: 'Too many attempts. Wait 15 minutes.', erroMeuPapel: 'Choose your role.',
    convidarSub: 'You can invite people to this company. If you are not Admin, Partner or CEO, the invite needs one of their passwords.',
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
    enviarPorApps: 'Send invite (WhatsApp, Gmail, Outlook, Telegram, e-mail)',
    erroEmail: 'Enter a valid e-mail to send the invite.',
    semPrazoRegra: 'Indefinite only for Admin, Partner or CEO.', aguardandoAprovacao: 'Waiting for your approval', aprovar: 'Approve', recusar: 'Decline', sucessoAprovar: 'Access granted.', sucessoRecusar: 'Invite declined.', erroDecidir: 'Could not complete. Try again.', confirmarRecusa: 'Decline this person\'s access?',
    cortarTitulo: 'Cut access?', cortarAviso: 'Enter the reason — it is recorded in the company audit with the date. Access is suspended for 7 days and can be restored; if the person is at your level or above, it becomes an approval request.', cortarBotao: 'Cut access', cortarCiente: 'I confirm I am authorized to cut this access.', motivoTerceiro: 'Third-party data removed by the owner',
    tempoAcesso: 'Access time', semPrazo: 'Indefinite', h24: '24 hours', dias: (n: number) => n === 180 ? '6 months' : n === 365 ? '1 year' : `${n} days`, prazoMsg: (p: string) => ` for ${p}`,
    motivoLabel: 'Reason for the invite (e.g.: second opinion on closing)', erroTermo: 'Check the responsibility term to send the invite.',
    termoRemetente: (nome: string, data: string) => `I, ${nome}, send this invite on ${data} and take responsibility for this person's access to the company's financial and banking data. I can cut the access at any time.`,
    acessoAte: (d: string) => `Access until ${d}`, acessoEncerrado: 'Access ended', cortarAcesso: 'Cut access now',
    relacaoLabel: 'Who you are inviting', rel_ceo: 'CEO', rel_socio: 'Partner', rel_contador: 'Accountant', rel_funcionario: 'Employee', rel_consultor: 'Consultant (2nd opinion)', rel_outro: 'Other',
    termosTitulo: 'Accepted invite terms', termosSub: 'Who accepted, with the name, CPF and e-mail given on acceptance. Only the owner and administrators can see and delete this data.',
    lixeiraTitulo: 'Terms trash', lixeiraSub: 'Data of people who left the company. Kept for 60 days and then deleted automatically.', lixeiraVazia: 'The trash is empty.', recuperar: 'Restore', recuperado: 'Term restored.', vagasPlano: (o: number, l: number) => `Plan seats: ${o} of ${l}`, tempPlano: (u: number, l: number) => `Temporary invites (up to 7 days): ${u} of ${l}`, erroLimitePlano: (l: number) => `Your plan allows ${l} ${l > 1 ? 'people' : 'person'} on the team (including you). Move to the plan above to invite more. Not counted: cashier operator, external accountant/consultant and guests of up to 7 days.`, erroCotaTemp: (l: number) => `You have used the ${l} temporary invites (up to 7 days) of your plan. Upgrade your plan to invite more.`, verPlanos: 'See plans', transferirBotao: 'Transfer ownership', transferirTitulo: 'Transfer company ownership', transferirAviso: (n: string) => `${n} becomes the Owner: in charge of the company, the team and the subscription. You stay on the team as Administrator.`, transferirCiente: 'I understand I will no longer be the Owner of this company.', transferirConfirmar: 'Transfer', transferido: 'Ownership transferred.', erroSemAtivo: 'Choose someone with active access on the team.', saiuEm: (d: string) => `Left on ${d}`, apagaEm: (d: string) => `Deleted on ${d}`,
    semTermos: 'No term accepted yet.', convidadoPorEm: (r: string, d: string) => `Invited by ${r} on ${d}`, aceitoEm: (d: string) => `Accepted on ${d}`,
    dadosApagados: (d: string, m: string) => `Personal data deleted on ${d}. Reason: ${m}`, apagarDados: 'Delete personal data of this term',
    apagarTitulo: 'Delete personal data of the term?', apagarAviso: 'This person\'s name, CPF and e-mail will be permanently deleted. Only who deleted it, when and why are kept.',
    apagarMotivo: 'Reason *', apagarCiente: 'I confirm I am authorized to delete this data and that it cannot be undone.', apagarBotao: 'Delete data', apagando: 'Deleting...',
    sucessoApagar: 'Personal data deleted.', erroApagar: 'Could not delete. Try again.',
    enviarPor: 'Create and send the invite via:', conviteLink: 'Invite by link', outroEmail: 'Other e-mail', copiarLinkCurto: 'Copy link',
    assuntoConvite: 'Invitation to join the team on Axioma',
    msgConvite: 'Hi{nome}! {remetente} invited you to join our company on Axioma as {papel}{prazo}.\n\nTap the link, fill in the form and you are in:\n{link}\n\nThe link is valid for {validade}.',
    papel_dono: 'Owner', papel_admin: 'Admin (full access)', papel_financeiro: 'Financial',
    papel_contabil: 'Accounting', papel_leitor: 'Reader (view only)', papel_operador: 'Cashier (POS only, no Axioma access)',
    erroGenerico: 'Could not complete. Please try again.',
    erroDuplicado: 'A pending invite already exists for this e-mail.',
    erroUltimoDono: 'You cannot remove or demote the company\'s only owner.',
    erroConviteExpirado: 'This invite has expired.',
    erroConviteUsado: 'This invite has already been used.',
    erroNaoProprietario: 'Only Admin, Partner, CEO or Owner can view the team.',
    hierarquia: 'Hierarchy: Owner › CEO › Partner › Admin › others. Removing = suspending for 7 days (can be restored).',
    nivel_1: 'Owner', nivel_2: 'CEO', nivel_3: 'Partner', nivel_4: 'Admin',
    sucessoSuspenso: 'Access suspended. It can be restored within 7 days.',
    sucessoPedido: 'Request sent. The removal needs approval from someone above (valid 7 days).',
    sucessoEncerrado: 'Access ended for good (invite with a time limit). To come back, send a new invite.',
    cortarAvisoPrazo: 'Access of up to 30 days: cutting it ends it FOR GOOD, no restore. For the person to come back, send a new invite. The reason is recorded in the company audit with the date.',
    sucessoSaiu: 'You left the company.', sucessoRestaurar: 'Access restored.',
    statusSuspenso: (ate: string) => `Suspended — restore until ${ate}`, restaurar: 'Restore access',
    sairEmpresa: 'Leave this company', confirmarSair: 'Leave this company? You lose access right away (a Partner or above can restore it within 7 days).',
    pedidosTitulo: 'Removals awaiting approval', pedidoDe: (quem: string, alvo: string) => `${quem} asked to remove ${alvo}`,
    avalDe: (n: string) => `Approval by: ${n} or above`, venceEm: (d: string) => `Valid until ${d}`,
    concluirSemAval: 'Conclude without approval', motivoConcluir: 'Nobody above answered in 7 days. Reason to conclude (min. 5 letters):',
    sucessoDecidido: 'Request decided.', unicoGestor: 'You are the only one managing this team. Invite a Partner or Admin so the company is never left without a manager.',
    erroHierarquia: 'Your level does not allow this action.', erroProprietario: 'Nobody removes the Owner.',
    erroProprietarioSair: 'The Owner cannot leave: transfer the company first.', erroMotivo: 'Write the reason (at least 5 letters).',
    erroPedidoAberto: 'There is already an open request for this person.', erroAindaAcima: 'There is still someone above to decide.',
    erroPrazoAval: 'The approval period (7 days) has not ended yet.', erroRestaurar: 'The 7-day restore period has passed.',
  },
  es: {
    titulo: 'Equipo', sub: 'Quién tiene acceso a su empresa y con qué rol.',
    carregando: 'Cargando...',
    somenteProprietario: 'Solo el propietario de la empresa accede a Equipo.',
    meuPapelLabel: '¿Cuál es su rol? *', mp_admin: 'Admin',
    autTitulo: 'Autorización obligatoria', autAviso: 'Solo Admin, Socio o CEO liberan acceso. Pida a uno de ellos que escriba su correo y contraseña aquí.',
    autEmail: 'Correo del Admin, Socio o CEO', autSenha: 'Su contraseña',
    erroAutorizador: 'Correo o contraseña del Admin/Socio/CEO incorrectos, o esta persona no es Admin/Socio/CEO de esta empresa.', erroMuitas: 'Demasiados intentos. Espere 15 minutos.', erroMeuPapel: 'Elija cuál es su rol.',
    convidarSub: 'Puede invitar personas a esta empresa. Si no es Admin, Socio o CEO, la invitación necesita la contraseña de uno de ellos.',
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
    enviarPorApps: 'Enviar invitación (WhatsApp, Gmail, Outlook, Telegram, correo)',
    erroEmail: 'Ingrese un correo válido para enviar la invitación.',
    semPrazoRegra: 'Indefinido solo para Admin, Socio o CEO.', aguardandoAprovacao: 'Esperando su aprobación', aprovar: 'Aprobar', recusar: 'Rechazar', sucessoAprovar: 'Acceso liberado.', sucessoRecusar: 'Invitación rechazada.', erroDecidir: 'No se pudo completar. Intente de nuevo.', confirmarRecusa: '¿Rechazar el acceso de esta persona?',
    cortarTitulo: '¿Cortar acceso?', cortarAviso: 'Informe el motivo — queda registrado en la auditoría de la empresa con la fecha. El acceso queda suspendido 7 días y se puede restaurar; si la persona está en su nivel o superior, se convierte en una solicitud de aval.', cortarBotao: 'Cortar acceso', cortarCiente: 'Confirmo que tengo autorización para cortar este acceso.', motivoTerceiro: 'Datos de tercero eliminados por el responsable',
    tempoAcesso: 'Tiempo de acceso', semPrazo: 'Indefinido', h24: '24 horas', dias: (n: number) => n === 180 ? '6 meses' : n === 365 ? '1 año' : `${n} días`, prazoMsg: (p: string) => ` por ${p}`,
    motivoLabel: 'Motivo de la invitación (ej.: segunda opinión en el cierre)', erroTermo: 'Marque el término de responsabilidad para enviar la invitación.',
    termoRemetente: (nome: string, data: string) => `Yo, ${nome}, envío esta invitación el ${data} y asumo la responsabilidad por el acceso de esta persona a los datos financieros y bancarios de la empresa. Puedo cortar el acceso en cualquier momento.`,
    acessoAte: (d: string) => `Acceso hasta ${d}`, acessoEncerrado: 'Acceso finalizado', cortarAcesso: 'Cortar acceso ahora',
    relacaoLabel: 'A quién está invitando', rel_ceo: 'CEO', rel_socio: 'Socio', rel_contador: 'Contador', rel_funcionario: 'Empleado', rel_consultor: 'Consultor (2ª opinión)', rel_outro: 'Otro',
    termosTitulo: 'Términos de invitación aceptados', termosSub: 'Quién aceptó, con nombre, CPF y correo informados al aceptar. Solo el propietario y administradores ven y pueden borrar estos datos.',
    lixeiraTitulo: 'Papelera de términos', lixeiraSub: 'Datos de quienes salieron de la empresa. Se guardan 60 días y luego se borran automáticamente.', lixeiraVazia: 'La papelera está vacía.', recuperar: 'Recuperar', recuperado: 'Término recuperado.', vagasPlano: (o: number, l: number) => `Plazas del plan: ${o} de ${l}`, tempPlano: (u: number, l: number) => `Invitaciones temporales (hasta 7 días): ${u} de ${l}`, erroLimitePlano: (l: number) => `Su plan permite ${l} persona${l > 1 ? 's' : ''} en el equipo (contándole a usted). Cambie al plan superior para invitar a más. No cuentan: operador de caja, contador/consultor externo e invitado de hasta 7 días.`, erroCotaTemp: (l: number) => `Ya usó las ${l} invitaciones temporales (hasta 7 días) de su plan. Suba de plan para invitar a más.`, verPlanos: 'Ver planes', transferirBotao: 'Transferir propiedad', transferirTitulo: 'Transferir la propiedad de la empresa', transferirAviso: (n: string) => `${n} pasa a ser el Propietario: manda en la empresa, el equipo y la suscripción. Usted sigue en el equipo como Administrador.`, transferirCiente: 'Entiendo que dejo de ser el Propietario de esta empresa.', transferirConfirmar: 'Transferir', transferido: 'Propiedad transferida.', erroSemAtivo: 'Elija a alguien con acceso activo en el equipo.', saiuEm: (d: string) => `Salió el ${d}`, apagaEm: (d: string) => `Se borra el ${d}`,
    semTermos: 'Ningún término aceptado todavía.', convidadoPorEm: (r: string, d: string) => `Invitado por ${r} el ${d}`, aceitoEm: (d: string) => `Aceptado el ${d}`,
    dadosApagados: (d: string, m: string) => `Datos personales borrados el ${d}. Motivo: ${m}`, apagarDados: 'Borrar datos personales de este término',
    apagarTitulo: '¿Borrar datos personales del término?', apagarAviso: 'El nombre, el CPF y el correo de esta persona se borrarán de forma definitiva. Solo queda registrado quién borró, cuándo y el motivo.',
    apagarMotivo: 'Motivo *', apagarCiente: 'Confirmo que tengo autorización para borrar estos datos y que la acción no se puede deshacer.', apagarBotao: 'Borrar datos', apagando: 'Borrando...',
    sucessoApagar: 'Datos personales borrados.', erroApagar: 'No se pudo borrar. Intente de nuevo.',
    enviarPor: 'Generar y enviar la invitación por:', conviteLink: 'Invitación por link', outroEmail: 'Otro correo', copiarLinkCurto: 'Copiar link',
    assuntoConvite: 'Invitación al equipo en Axioma',
    msgConvite: '¡Hola{nome}! {remetente} te invitó a entrar en nuestra empresa en Axioma como {papel}{prazo}.\n\nToca el link, completa el formulario y listo, ya entras:\n{link}\n\nEl link vale por {validade}.',
    papel_dono: 'Propietario', papel_admin: 'Admin (acceso total)', papel_financeiro: 'Financiero',
    papel_contabil: 'Contable', papel_leitor: 'Lector (solo visualización)', papel_operador: 'Cajero (solo PDV, sin acceso a Axioma)',
    erroGenerico: 'No se pudo completar. Intente de nuevo.',
    erroDuplicado: 'Ya existe una invitación pendiente para este correo.',
    erroUltimoDono: 'No es posible eliminar o degradar al único propietario de la empresa.',
    erroConviteExpirado: 'Esta invitación expiró.',
    erroConviteUsado: 'Esta invitación ya fue utilizada.',
    erroNaoProprietario: 'Solo Admin, Socio, CEO o Propietario ven el equipo.',
    hierarquia: 'Jerarquía: Propietario › CEO › Socio › Admin › demás. Eliminar = suspender por 7 días (se puede restaurar).',
    nivel_1: 'Propietario', nivel_2: 'CEO', nivel_3: 'Socio', nivel_4: 'Admin',
    sucessoSuspenso: 'Acceso suspendido. Se puede restaurar en hasta 7 días.',
    sucessoPedido: 'Solicitud enviada. La eliminación necesita el aval de alguien superior (vale 7 días).',
    sucessoEncerrado: 'Acceso cerrado definitivamente (invitación con plazo). Para volver, envíe una nueva invitación.',
    cortarAvisoPrazo: 'Acceso de hasta 30 días: cortarlo lo cierra DEFINITIVAMENTE, sin restaurar. Para que la persona vuelva, envíe una nueva invitación. El motivo queda en la auditoría de la empresa con la fecha.',
    sucessoSaiu: 'Usted salió de la empresa.', sucessoRestaurar: 'Acceso restaurado.',
    statusSuspenso: (ate: string) => `Suspendido — restaurar hasta ${ate}`, restaurar: 'Restaurar acceso',
    sairEmpresa: 'Salir de esta empresa', confirmarSair: '¿Salir de esta empresa? Pierde el acceso al instante (un Socio o superior puede restaurarlo en hasta 7 días).',
    pedidosTitulo: 'Eliminaciones esperando aval', pedidoDe: (quem: string, alvo: string) => `${quem} pidió eliminar a ${alvo}`,
    avalDe: (n: string) => `Aval de: ${n} o superior`, venceEm: (d: string) => `Vale hasta ${d}`,
    concluirSemAval: 'Concluir sin aval', motivoConcluir: 'Nadie superior respondió en 7 días. Motivo para concluir (mín. 5 letras):',
    sucessoDecidido: 'Solicitud decidida.', unicoGestor: 'Solo usted gestiona este equipo. Invite a un Socio o Admin para que la empresa nunca quede sin gestor.',
    erroHierarquia: 'Su nivel no permite esta acción.', erroProprietario: 'Nadie elimina al Propietario.',
    erroProprietarioSair: 'El Propietario no puede salir: transfiera la empresa antes.', erroMotivo: 'Escriba el motivo (mínimo 5 letras).',
    erroPedidoAberto: 'Ya existe una solicitud abierta para esta persona.', erroAindaAcima: 'Todavía hay alguien superior para decidir.',
    erroPrazoAval: 'El plazo de aval (7 días) aún no venció.', erroRestaurar: 'Pasó el plazo de 7 días para restaurar.',
  },
}

// Regra do Elias (2026-10-03): acesso de até 30 dias cortado zera de vez; acima disso ou sem prazo, restaura.
const zeraAoCortar = (m: MembroEquipe) =>
  !!m.expira_em && new Date(m.expira_em).getTime() - new Date(m.criado_em).getTime() <= 31 * 86400000

export default function EquipePage() {
  const { idioma } = useLanguage()
  const lang = (idioma as Idioma) || 'pt'
  const t = textos[lang] || textos.pt
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  // Paleta Claro segue tema-tokens.md, mesmo padrão já usado nos demais
  // módulos com modal/CRUD (ex.: Metas) - card creme, texto azul-marinho,
  // cinza #374151, campo branco, modal creme.
  const TEXTO = temaClaro ? '#101b3d' : '#e6edf5'
  const MUTED = temaClaro ? '#374151' : '#a3b1c2'
  const CAMPO_BG = temaClaro ? '#ffffff' : 'rgba(2,8,16,0.7)'
  const LINHA_BG = temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(2,8,16,0.5)'
  const CAMPO_BORDA = temaClaro ? '1px solid rgba(16,27,61,0.15)' : '1px solid rgba(46,204,155,0.2)'

  const [carregando, setCarregando] = useState(true)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [meuPapel, setMeuPapel] = useState<string | null>(null)
  const [meuNivel, setMeuNivel] = useState<number | null>(null)
  const [pedidos, setPedidos] = useState<PedidoEquipe[]>([])
  const gestor = (meuNivel ?? 99) <= 4
  const [membros, setMembros] = useState<MembroEquipe[]>([])
  const [mensagem, setMensagem] = useState('')
  const [tipoMsg, setTipoMsg] = useState<'sucesso' | 'erro' | ''>('')

  const [modalAberto, setModalAberto] = useState(false)
  const FORM_VAZIO = { email_convidado: '', nome: '', cargo: '', papel: 'leitor', acesso_dias: 7 as number | null, motivo_convite: '', relacao: 'funcionario' }
  const [form, setForm] = useState(FORM_VAZIO)
  const [termoRemetente, setTermoRemetente] = useState(false)
  // Trava do convite: papel declarado + conferência no servidor (/api/convite)
  const [meuPapelConvite, setMeuPapelConvite] = useState('')
  const [podeLiberar, setPodeLiberar] = useState(false)
  const [autEmail, setAutEmail] = useState('')
  const [autSenha, setAutSenha] = useState('')
  const precisaAutorizacao = !podeLiberar || !['ceo', 'socio', 'admin'].includes(meuPapelConvite)
  const [nomeRemetente, setNomeRemetente] = useState('')
  const [termos, setTermos] = useState<TermoConvite[]>([])
  const [lixeira, setLixeira] = useState<TermoConvite[]>([])
  const [lixeiraAberta, setLixeiraAberta] = useState(false)
  const [membroTransferir, setMembroTransferir] = useState<MembroEquipe | null>(null)
  const [vagas, setVagas] = useState<VagasEquipe | null>(null)
  const [limiteAtingido, setLimiteAtingido] = useState(false)
  const [transferindo, setTransferindo] = useState(false)
  const [decidindoId, setDecidindoId] = useState<string | null>(null)
  // Admin, CEO, Sócio e Contador: cortar acesso / apagar dados exige formulário simples (data + motivo).
  // Funcionário, consultor e outros: direto, sem formulário (pedido do Elias).
  const ehAltoNivel = (papel?: string | null, relacao?: string | null) => papel === 'admin' || relacao === 'ceo' || relacao === 'socio' || relacao === 'contador'
  const [membroCortar, setMembroCortar] = useState<MembroEquipe | null>(null)
  // Sem prazo: só Admin (papel) ou Sócio/CEO (relação) — mesma regra checada no banco (decidir_convite)
  const podeSemPrazo = (f: { papel: string; relacao: string }) => f.papel === 'admin' || f.relacao === 'socio' || f.relacao === 'ceo'
  function ajustarForm(novo: typeof FORM_VAZIO) {
    setForm(novo.acesso_dias === null && !podeSemPrazo(novo) ? { ...novo, acesso_dias: 7 } : novo)
  }
  const [termoApagar, setTermoApagar] = useState<TermoConvite | null>(null)
  const [motivoApagar, setMotivoApagar] = useState('')
  const [cienteApagar, setCienteApagar] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  // convite aberto no Centro de Compartilhamento (envio de verdade pelos apps da pessoa)
  const [conviteEnviar, setConviteEnviar] = useState<MembroEquipe | null>(null)
  const [erroModal, setErroModal] = useState('')

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
      case 'AX021': return t.erroProprietarioSair
      case 'AX022': return t.erroMotivo
      case 'AX023': return t.erroSemAtivo
      case 'AX024': return t.erroProprietario
      case 'AX025': case 'AX028': return t.erroHierarquia
      case 'AX026': return t.erroPedidoAberto
      case 'AX029': return t.erroPrazoAval
      case 'AX030': return t.erroAindaAcima
      case 'AX032': return t.erroRestaurar
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
      setNomeRemetente(String(user.user_metadata?.nome || user.user_metadata?.full_name || user.email || ''))
      const id = await obterEmpresaAtiva()
      if (!id) return
      setEmpresaId(id)

      const [papel, nivel] = await Promise.all([obterMeuPapel(id), obterMeuNivel(id, user.id)])
      setMeuPapel(papel)
      setMeuNivel(nivel)
      fetch(`/api/convite?empresaId=${id}`).then((r) => r.json()).then((j) => setPodeLiberar(!!j?.podeLiberar)).catch(() => {})
      if ((nivel ?? 99) > 4) return
      await recarregarEquipe(id)
    } catch (err: any) {
      avisar('erro', t.erroGenerico)
    } finally {
      setCarregando(false)
    }
  }

  async function recarregarEquipe(id: string) {
    const r = await listarEquipe(id)
    if (r.erro) avisar('erro', mensagemErro(r.codigo))
    setMembros(r.dados)
    const [tm, pd, lx, vg] = await Promise.all([listarTermosConvite(id), listarPedidosEquipe(id), listarLixeiraTermos(id), obterVagasEquipe(id)])
    setTermos(tm)
    setVagas(vg)
    setLixeira(lx)
    setPedidos(pd)
  }

  // Hierarquia: quem está acima mexe; Sócio↔Sócio, Admin↔Admin e Sócio→CEO viram pedido de aval (regra no banco).
  const podeRemover = (m: MembroEquipe) => m.origem === 'convite'
    || (m.nivel != null && m.nivel > 1 && meuNivel != null && (meuNivel < m.nivel || (meuNivel === m.nivel && (m.nivel === 3 || m.nivel === 4)) || (meuNivel === 3 && m.nivel === 2)))
  const podeTrocarPapel = (m: MembroEquipe) => m.origem === 'convite' || (m.nivel != null && m.nivel > 1 && meuNivel != null && meuNivel < m.nivel)
  const nomeDe = (uid: string) => { const m = membros.find((x) => x.user_id === uid); return m ? (m.nome || m.email) : '—' }
  const nomeNivel = (n: number) => (t as any)[`nivel_${n}`] || ''

  async function sairDaEmpresa() {
    if (!empresaId || !userId || !window.confirm(t.confirmarSair)) return
    const eu = { id: userId, origem: 'ativo', user_id: userId, email: '' } as MembroEquipe
    const r = await removerAcessoMembro(eu, empresaId, userId)
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    avisar('sucesso', t.sucessoSaiu)
    setTimeout(() => { window.location.href = '/dashboard' }, 1500)
  }

  async function restaurar(m: MembroEquipe) {
    if (!empresaId || !m.user_id) return
    const r = await restaurarMembro(empresaId, m.user_id)
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    avisar('sucesso', t.sucessoRestaurar)
    await recarregarEquipe(empresaId)
  }

  async function decidirPedido(p: PedidoEquipe, aprovar: boolean) {
    if (!empresaId) return
    const r = await decidirPedidoEquipe(p.id, aprovar)
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    avisar('sucesso', t.sucessoDecidido)
    await recarregarEquipe(empresaId)
  }

  async function concluirPedido(p: PedidoEquipe) {
    if (!empresaId) return
    const motivo = window.prompt(t.motivoConcluir) || ''
    if (motivo.trim().length < 5) { avisar('erro', t.erroMotivo); return }
    const r = await concluirPedidoEquipe(p.id, motivo.trim())
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    avisar('sucesso', t.sucessoSuspenso)
    await recarregarEquipe(empresaId)
  }

  // Gera o convite e já abre o canal escolhido com mensagem + e-mail preenchidos.
  // A aba nova é aberta ANTES do await (clique do usuário) — senão o navegador
  // bloqueia como pop-up; depois só recebe o endereço certo.
  async function enviarConvite(canal: string) {
    if (!empresaId || !userId) { setErroModal(t.erroGenerico); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_convidado.trim())) { setErroModal(t.erroEmail); return }
    if (!meuPapelConvite) { setErroModal(t.erroMeuPapel); return }
    if (!termoRemetente) { setErroModal(t.erroTermo); return }
    setErroModal('')
    const abreAba = canal !== 'E-mail' && canal !== 'copiar'
    const aba = abreAba ? window.open('', '_blank') : null
    setEnviando(true)
    try {
      // Link vale até 7 dias, nunca mais que o próprio prazo de acesso (convite de 24h = link de 24h).
      const diasLink = Math.min(form.acesso_dias ?? 7, 7)
      const dadosForm = { ...form, motivo_convite: form.motivo_convite.trim() || null, remetente_nome: nomeRemetente, remetente_termo_em: new Date().toISOString(), expira_em: new Date(Date.now() + diasLink * 86400000).toISOString() }
      const resp = await fetch('/api/convite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'criar', empresaId, form: dadosForm, termoRemetente, meuPapel: meuPapelConvite,
          autorizador: precisaAutorizacao ? { email: autEmail, senha: autSenha } : null }),
      })
      const r = await resp.json().catch(() => ({ erro: 'generico' }))
      if (r.erro || !r.token) {
        aba?.close()
        setLimiteAtingido(r.erro === 'limite_plano' || r.erro === 'cota_temporarios')
        setErroModal(r.erro === 'limite_plano' ? t.erroLimitePlano(Number(r.limite) || 1) : r.erro === 'cota_temporarios' ? t.erroCotaTemp(Number(r.limite) || 3) : r.erro === 'autorizador' ? t.erroAutorizador : r.erro === 'muitas_tentativas' ? t.erroMuitas : r.erro === 'sem_prazo' ? t.semPrazoRegra : r.erro === 'termo' ? t.erroTermo : r.erro === 'email' ? t.erroEmail : t.erroGenerico)
        return
      }
      const membroNovo = { id: r.id, origem: 'convite', user_id: null, email: dadosForm.email_convidado.trim().toLowerCase(), nome: dadosForm.nome, cargo: dadosForm.cargo, papel: dadosForm.papel, token_convite: r.token, expira_em: dadosForm.expira_em } as unknown as MembroEquipe
      const texto = textoConvite(membroNovo, form.acesso_dias)
      if (canal === 'copiar') {
        try { await navigator.clipboard.writeText(texto) } catch {}
        avisar('sucesso', t.linkCopiado)
      } else {
        const url = canaisCompartilhamento(texto, t.assuntoConvite, membroNovo.email).find((c) => c.nome === canal)?.url
        if (url && aba) aba.location.href = url
        else if (url) window.location.href = url
        avisar('sucesso', t.sucessoConvite)
      }
      setModalAberto(false)
      setForm(FORM_VAZIO)
      setTermoRemetente(false)
      setAutSenha('')
      if (!gestor) return
      await recarregarEquipe(empresaId)
    } finally {
      setEnviando(false)
    }
  }

  async function trocarPapel(membro: MembroEquipe, novoPapel: string) {
    if (!empresaId || !userId) { avisar('erro', t.erroGenerico); return }
    const r = await alterarPapelMembro(membro, empresaId, userId, novoPapel)
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    setEditandoId(null)
    avisar('sucesso', t.sucessoPapel)
    await recarregarEquipe(empresaId)
  }

  async function removerAcesso(membro: MembroEquipe, motivo?: string) {
    if (!empresaId || !userId) { avisar('erro', t.erroGenerico); return }
    const r = await removerAcessoMembro(membro, empresaId, userId, motivo)
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    // Até 30 dias: o banco encerra de vez (regra do Elias); acima ou sem prazo: suspensão restaurável.
    // 'removido' = o acesso já tinha vencido e saiu de vez.
    const zera = membro.origem === 'ativo' && zeraAoCortar(membro)
    avisar('sucesso', r.resultado === 'pedido' ? t.sucessoPedido : r.resultado === 'removido' ? t.sucessoEncerrado : r.resultado === 'suspenso' ? (zera ? t.sucessoEncerrado : t.sucessoSuspenso) : t.sucessoRemocao, 7000)
    await recarregarEquipe(empresaId)
  }

  const rotuloPrazo = (dias: number | null) => dias == null ? t.semPrazo : dias === 1 ? t.h24 : t.dias(dias)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const dataHora = (iso: string | Date) => new Date(iso).toLocaleString(localeData, { dateStyle: 'short', timeStyle: 'short' })
  function textoConvite(m: MembroEquipe, acessoDias?: number | null): string {
    const validadeDias = m.expira_em ? Math.max(1, Math.round((new Date(m.expira_em).getTime() - Date.now()) / 86400000)) : 7
    return t.msgConvite
      .replace('{nome}', m.nome ? ` ${m.nome}` : '')
      .replace('{remetente}', nomeRemetente)
      .replace('{prazo}', acessoDias === undefined || acessoDias === null ? '' : t.prazoMsg(rotuloPrazo(acessoDias)))
      .replace('{validade}', rotuloPrazo(validadeDias))
      .replace('{papel}', labelPapel(m.papel))
      .replace('{link}', `${SITE}/convite/${m.token_convite}`)
  }

  async function apagarTermoDireto(tm: TermoConvite) {
    if (!empresaId) return
    const r = await apagarTermoConvite(tm.id, t.motivoTerceiro)
    if (r.erro) { avisar('erro', t.erroApagar); return }
    avisar('sucesso', t.sucessoApagar)
    setTermos(await listarTermosConvite(empresaId))
  }

  async function confirmarTransferencia() {
    if (!membroTransferir?.user_id || !empresaId || motivoApagar.trim().length < 5 || !cienteApagar) return
    setTransferindo(true)
    const r = await transferirPropriedade(empresaId, membroTransferir.user_id, motivoApagar.trim())
    setTransferindo(false)
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    setMembroTransferir(null)
    avisar('sucesso', t.transferido)
    await carregarTudo()
  }

  async function recuperarTermo(tm: TermoConvite) {
    if (!empresaId) return
    const r = await recuperarTermoConvite(tm.id)
    if (r.erro) { avisar('erro', mensagemErro(r.codigo)); return }
    avisar('sucesso', t.recuperado)
    await recarregarEquipe(empresaId)
  }

  async function confirmarCorteAltoNivel() {
    if (!membroCortar || motivoApagar.trim().length < 5 || !cienteApagar) return
    setApagando(true)
    await removerAcesso(membroCortar, motivoApagar.trim())
    setApagando(false)
    setMembroCortar(null)
  }

  async function confirmarApagarTermo() {
    if (!termoApagar || !empresaId || motivoApagar.trim().length < 5 || !cienteApagar) return
    setApagando(true)
    const r = await apagarTermoConvite(termoApagar.id, motivoApagar.trim())
    setApagando(false)
    if (r.erro) { avisar('erro', t.erroApagar); return }
    setTermoApagar(null)
    avisar('sucesso', t.sucessoApagar)
    setTermos(await listarTermosConvite(empresaId))
  }

  function copiarLink(token: string) {
    const link = `${SITE}/convite/${token}`
    navigator.clipboard.writeText(link)
    avisar('sucesso', t.linkCopiado)
  }

  async function decidir(m: MembroEquipe, aprovar: boolean) {
    if (!empresaId) return
    if (!aprovar && !window.confirm(t.confirmarRecusa)) return
    setDecidindoId(m.id)
    const r = await decidirConvite(m.id, aprovar)
    setDecidindoId(null)
    if (r.erro) { avisar('erro', r.codigo === 'AX011' ? t.semPrazoRegra : t.erroDecidir); return }
    avisar('sucesso', aprovar ? t.sucessoAprovar : t.sucessoRecusar)
    await recarregarEquipe(empresaId)
  }

  function statusDe(m: MembroEquipe): { label: string; cor: string } {
    if (m.origem === 'ativo' && m.suspenso_em) return { label: t.statusSuspenso(dataHora(new Date(new Date(m.suspenso_em).getTime() + 7 * 86400000))), cor: VERMELHO }
    if (m.origem === 'convite' && m.situacao === 'aguardando_aprovacao') return { label: t.aguardandoAprovacao, cor: temaClaro ? '#101b3d' : AZUL }
    if (m.origem === 'ativo') {
      if (m.expira_em && new Date(m.expira_em) < new Date()) return { label: t.acessoEncerrado, cor: VERMELHO }
      if (m.expira_em) return { label: t.acessoAte(dataHora(m.expira_em)), cor: temaClaro ? '#16a97d' : VERDE }
      return { label: t.statusAtivo, cor: VERDE }
    }
    const expirado = m.expira_em ? new Date(m.expira_em) < new Date() : false
    return expirado ? { label: t.statusExpirado, cor: VERMELHO } : { label: t.statusConvidado, cor: AMBAR }
  }

  const labelPapel = (papel: string) => (t as any)[`papel_${papel}`] || papel

  const modalConvite = (<Modal open={modalAberto} onClose={() => setModalAberto(false)}>
            {/* premium3d desligado aqui: o efeito de "levantar" no hover mudava a
                altura e a barra de rolagem do modal ficava oscilando. Layout
                compacto (2 colunas) cabe na tela sem rolagem. */}
            <CanvasBox cor={JADE} fundo={temaClaro ? '#f6f7c4' : undefined}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: temaClaro ? '#101b3d' : VERDE }}>AXIOMA AI.TECH</p>
                  <h3 className="text-lg font-bold" style={{ color: TEXTO }}>{t.novoConvite}</h3>
                </div>
                <button onClick={() => setModalAberto(false)} style={{ color: MUTED }}><X size={20} /></button>
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>{t.emailLabel}</label>
                  <input type="email" value={form.email_convidado} onChange={(e) => setForm({ ...form, email_convidado: e.target.value })}
                    placeholder="nome@empresa.com.br" autoComplete="off"
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: CAMPO_BORDA, color: TEXTO }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>{t.nomeLabel}</label>
                    <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: CAMPO_BORDA, color: TEXTO }} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>{t.cargoLabel}</label>
                    <input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: CAMPO_BORDA, color: TEXTO }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <MenuEscolha rotulo={t.relacaoLabel} temaClaro={temaClaro} cores={{ texto: TEXTO, muted: MUTED, campo: CAMPO_BG, borda: CAMPO_BORDA }}
                    valor={form.relacao}
                    opcoes={(['ceo', 'socio', 'contador', 'funcionario', 'consultor', 'outro'] as const).map((r) => ({ valor: r, label: (t as any)[`rel_${r}`] }))}
                    onEscolher={(r) => ajustarForm({ ...form, relacao: r, acesso_dias: (r === 'socio' || r === 'ceo') && form.acesso_dias === 7 ? null : form.acesso_dias })} />
                  <MenuEscolha rotulo={t.papelLabel} temaClaro={temaClaro} cores={{ texto: TEXTO, muted: MUTED, campo: CAMPO_BG, borda: CAMPO_BORDA }}
                    valor={form.papel}
                    opcoes={PAPEIS_ATRIBUIVEIS.map((p) => ({ valor: p, label: labelPapel(p) }))}
                    onEscolher={(p) => ajustarForm({ ...form, papel: p })} />
                </div>
                <MenuEscolha rotulo={t.tempoAcesso} temaClaro={temaClaro} cores={{ texto: TEXTO, muted: MUTED, campo: CAMPO_BG, borda: CAMPO_BORDA }}
                  valor={String(form.acesso_dias)}
                  opcoes={([1, 3, 7, 30, 60, 90, 180, 365, null] as (number | null)[]).filter((d) => d !== null || podeSemPrazo(form)).map((d) => ({ valor: String(d), label: rotuloPrazo(d) }))}
                  onEscolher={(v) => ajustarForm({ ...form, acesso_dias: v === 'null' ? null : Number(v) })} />
                {!podeSemPrazo(form) && <p className="text-[10px] -mt-1" style={{ color: MUTED }}>{t.semPrazoRegra}</p>}
                <div>
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>{t.motivoLabel}</label>
                  <input value={form.motivo_convite} onChange={(e) => setForm({ ...form, motivo_convite: e.target.value })} maxLength={300}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: CAMPO_BORDA, color: TEXTO }} />
                </div>
                <MenuEscolha rotulo={t.meuPapelLabel} temaClaro={temaClaro} cores={{ texto: TEXTO, muted: MUTED, campo: CAMPO_BG, borda: CAMPO_BORDA }}
                  valor={meuPapelConvite}
                  opcoes={(['ceo', 'socio', 'admin', 'contador', 'funcionario', 'consultor', 'outro'] as const).map((r) => ({ valor: r, label: r === 'admin' ? t.mp_admin : (t as any)[`rel_${r}`] }))}
                  onEscolher={(r) => { setMeuPapelConvite(r); setErroModal('') }} />
                {meuPapelConvite && precisaAutorizacao && (
                  <div className="rounded-lg p-2.5 space-y-2 axi-card-premium3d axi-card-faixa" style={{ background: temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(46,204,155,0.06)', border: `1px solid ${AMBAR}66` }}>
                    <p className="text-xs font-bold" style={{ color: temaClaro ? '#101b3d' : AMBAR }}>🔒 {t.autTitulo}</p>
                    <p className="text-[11px]" style={{ color: MUTED }}>{t.autAviso}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input value={autEmail} onChange={(e) => { setAutEmail(e.target.value); setErroModal('') }} placeholder={t.autEmail} type="email" autoComplete="off"
                        className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: CAMPO_BORDA, color: TEXTO }} />
                      <input value={autSenha} onChange={(e) => { setAutSenha(e.target.value); setErroModal('') }} placeholder={t.autSenha} type="password" autoComplete="new-password"
                        className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: CAMPO_BG, border: CAMPO_BORDA, color: TEXTO }} />
                    </div>
                  </div>
                )}
                <label className="flex items-start gap-2 cursor-pointer rounded-lg p-2" style={{ background: temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(255,255,255,0.03)', border: `1px solid ${termoRemetente ? '#16a97d' : (temaClaro ? 'rgba(16,27,61,0.15)' : 'rgba(255,255,255,0.08)')}` }}>
                  <input type="checkbox" checked={termoRemetente} onChange={(e) => { setTermoRemetente(e.target.checked); setErroModal('') }} className="mt-0.5" />
                  <span className="text-[11px] leading-snug" style={{ color: TEXTO }}>{t.termoRemetente(nomeRemetente, dataHora(new Date()))}</span>
                </label>
                <div className="pt-1">
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: MUTED }}>{t.enviarPor}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { canal: 'WhatsApp', rotulo: 'WhatsApp', cor: '#25D366' },
                      { canal: 'Gmail', rotulo: 'Gmail', cor: '#EA4335' },
                      { canal: 'Outlook', rotulo: 'Outlook', cor: '#0078D4' },
                      { canal: 'Telegram', rotulo: 'Telegram', cor: '#0088cc' },
                      { canal: 'E-mail', rotulo: t.outroEmail, cor: temaClaro ? '#101b3d' : '#94a3b8' },
                      { canal: 'copiar', rotulo: t.copiarLinkCurto, cor: temaClaro ? '#16a97d' : '#2ecc9b' },
                    ].map((c) => (
                      <motion.button key={c.canal} onClick={() => enviarConvite(c.canal)} disabled={enviando}
                        whileHover={{ scale: 1.05, y: -2, boxShadow: `0 8px 18px ${c.cor}55` }} whileTap={{ scale: 0.96 }}
                        className="py-2.5 rounded-xl text-sm font-bold disabled:cursor-wait"
                        style={temaClaro ? { background: c.cor, border: `1px solid ${c.cor}`, color: '#ffffff' } : { background: `${c.cor}26`, border: `1px solid ${c.cor}80`, color: c.cor }}>
                        {enviando ? t.enviando : c.rotulo}
                      </motion.button>
                    ))}
                  </div>
                  {erroModal && (
                    <p className="text-xs font-semibold mt-2 flex items-center gap-1.5" style={{ color: VERMELHO }}><AlertCircle size={14} />{erroModal}</p>
                  )}
                  {erroModal && limiteAtingido && (
                    <a href="/planos" className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>{t.verPlanos} →</a>
                  )}
                  <motion.button onClick={() => setModalAberto(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: temaClaro ? 'rgba(16,27,61,0.08)' : 'rgba(46,204,155,0.1)', color: temaClaro ? '#101b3d' : AZUL }}>{t.cancelar}</motion.button>
                </div>
              </div>
            </CanvasBox>
      </Modal>
  )

  if (carregando) {
    return (
      <div data-theme={tema}>
      <ModuloLayout titulo={t.titulo} subtitulo={t.sub} botaoExtra={<ThemeToggle />}>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${JADE} transparent transparent transparent` }} />
        </div>
      </ModuloLayout>
      </div>
    )
  }

  if (!gestor) {
    const podeConvidar = !!meuPapel && meuPapel !== 'operador'
    return (
      <div data-theme={tema}>
      <ModuloLayout titulo={t.titulo} subtitulo={t.sub} botaoExtra={<ThemeToggle />}>
        <CanvasBox cor={AZUL} fundo={temaClaro ? '#f6f7c4' : undefined} premium3d>
          <div className="text-center py-10">
            <Users size={32} className="mx-auto mb-3" style={{ color: AZUL }} />
            <p className="text-sm font-semibold" style={{ color: TEXTO }}>{podeConvidar ? t.convidarSub : t.somenteProprietario}</p>
            {podeConvidar && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setErroModal(''); setLimiteAtingido(false); setTermoRemetente(false); setMeuPapelConvite(''); setAutEmail(''); setAutSenha(''); setForm(FORM_VAZIO); setModalAberto(true) }}
                className="mt-4 px-5 py-3 rounded-xl font-black text-sm tracking-wide inline-flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>
                <UserPlus size={16} /> {t.convidar}
              </motion.button>
            )}
            <div><a href="/dashboard" className="inline-block mt-4 text-xs font-semibold underline" style={{ color: AZUL }}>{t.voltarDashboard}</a></div>
            {meuNivel != null && meuNivel > 1 && (
              <button onClick={sairDaEmpresa} className="mt-3 text-xs font-semibold inline-flex items-center gap-1" style={{ color: VERMELHO }}>
                <LogOut size={13} /> {t.sairEmpresa}
              </button>
            )}
          </div>
        </CanvasBox>
        {mensagem && <p className="text-sm font-semibold text-center mt-3" style={{ color: tipoMsg === 'sucesso' ? VERDE : VERMELHO }}>{mensagem}</p>}
        {modalConvite}
      </ModuloLayout>
      </div>
    )
  }

  return (
    <div data-theme={tema}>
    <ModuloLayout titulo={t.titulo} subtitulo={t.sub} botaoExtra={<ThemeToggle />}>
      <div className="space-y-4">
        <LetreiroExecutivo cor="#101b3d" itens={[
          { texto: '🚀 AXIOMA AI.TECH', destaque: true },
          `${(lang === 'en' ? 'People on the team' : lang === 'es' ? 'Personas en el equipo' : 'Pessoas na equipe')}: ${membros.length}`,
          `${(lang === 'en' ? 'Open approval requests' : lang === 'es' ? 'Solicitudes de aval abiertas' : 'Pedidos de aval abertos')}: ${pedidos.length}`,
          `${(lang === 'en' ? 'Accepted terms' : lang === 'es' ? 'Términos aceptados' : 'Termos aceitos')}: ${termos.length}`,
          `${(lang === 'en' ? 'In the trash (60 days)' : lang === 'es' ? 'En la papelera (60 días)' : 'Na lixeira (60 dias)')}: ${lixeira.length}`,
        ]} />

        {membros.some((m) => m.origem === 'convite' && m.situacao === 'aguardando_aprovacao') && (
          <CanvasBox cor="#16a97d" fundo={temaClaro ? '#f6f7c4' : undefined} premium3d>
            <div className="flex items-center gap-2 mb-3">
              <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
                <AlertCircle size={18} style={{ color: '#16a97d' }} />
              </motion.span>
              <p className="text-sm font-black" style={{ color: TEXTO }}>
                {t.aguardandoAprovacao} ({membros.filter((m) => m.origem === 'convite' && m.situacao === 'aguardando_aprovacao').length})
              </p>
            </div>
            <div className="space-y-2">
              {membros.filter((m) => m.origem === 'convite' && m.situacao === 'aguardando_aprovacao').map((m) => {
                const tm = termos.find((x) => x.convite_id === m.id && !x.apagado_em)
                return (
                  <div key={m.id} className="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 axi-card-premium3d axi-card-faixa"
                    style={{ background: LINHA_BG, border: '1px solid rgba(22,169,125,0.35)' }}>
                    <div className="flex-1 min-w-0 text-xs space-y-0.5" style={{ color: MUTED }}>
                      <p className="text-sm font-bold" style={{ color: TEXTO }}>{tm?.nome || m.nome || t.conviteLink}</p>
                      <p>📧 <strong style={{ color: TEXTO }}>{tm?.email || m.email || '—'}</strong>{tm?.cpf ? ` • CPF ${tm.cpf.slice(0, 3)}.***.***-${tm.cpf.slice(9)}` : ''}</p>
                      <p>{m.relacao ? `${(t as any)[`rel_${m.relacao}`] || m.relacao} • ` : ''}{labelPapel(m.papel)}{tm ? ` • ${rotuloPrazo(tm.acesso_dias)}` : ''}</p>
                      {tm && <p>{t.convidadoPorEm(tm.remetente_nome || '—', tm.convidado_em ? dataHora(tm.convidado_em) : '—')} • {t.aceitoEm(dataHora(tm.aceito_em))}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <motion.button whileHover={{ scale: 1.05, y: -2, boxShadow: '0 8px 20px rgba(22,169,125,0.4)' }} whileTap={{ scale: 0.95 }}
                        onClick={() => decidir(m, true)} disabled={decidindoId === m.id}
                        className="px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-1.5 disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #16a97d, #2ecc9b)', color: '#fff' }}>
                        <CheckCircle size={15} />{t.aprovar}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        onClick={() => decidir(m, false)} disabled={decidindoId === m.id}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 axi-card-premium3d axi-card-faixa"
                        style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.45)', color: VERMELHO }}>
                        {t.recusar}
                      </motion.button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CanvasBox>
        )}

        {pedidos.length > 0 && (
          <CanvasBox cor={VERMELHO} fundo={temaClaro ? '#f6f7c4' : undefined} premium3d>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={18} style={{ color: VERMELHO }} />
              <p className="text-sm font-black" style={{ color: TEXTO }}>{t.pedidosTitulo} ({pedidos.length})</p>
            </div>
            <div className="space-y-2">
              {pedidos.map((p) => {
                const souParte = p.pedido_por === userId || p.alvo_user_id === userId
                const possoDecidir = !souParte && (meuNivel ?? 99) <= p.nivel_aval
                const venceu = new Date(p.expira_em) < new Date()
                return (
                  <div key={p.id} className="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 axi-card-premium3d axi-card-faixa" style={{ background: LINHA_BG, border: '1px solid rgba(248,113,113,0.35)' }}>
                    <div className="flex-1 min-w-0 text-xs space-y-0.5" style={{ color: MUTED }}>
                      <p className="text-sm font-bold" style={{ color: TEXTO }}>{t.pedidoDe(nomeDe(p.pedido_por), nomeDe(p.alvo_user_id))}</p>
                      <p>{t.motivoLabel.split(' (')[0]}: {p.motivo}</p>
                      <p>{t.avalDe(nomeNivel(p.nivel_aval))} • {t.venceEm(dataHora(p.expira_em))}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {possoDecidir && (<>
                        <button onClick={() => decidirPedido(p, true)} className="px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, #16a97d, #2ecc9b)', color: '#fff' }}>
                          <CheckCircle size={15} />{t.aprovar}
                        </button>
                        <button onClick={() => decidirPedido(p, false)} className="px-4 py-2.5 rounded-xl text-sm font-bold axi-card-premium3d axi-card-faixa" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.45)', color: VERMELHO }}>
                          {t.recusar}
                        </button>
                      </>)}
                      {p.pedido_por === userId && venceu && (
                        <button onClick={() => concluirPedido(p)} className="px-4 py-2.5 rounded-xl text-sm font-bold axi-card-premium3d axi-card-faixa" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.45)', color: VERMELHO }}>
                          {t.concluirSemAval}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CanvasBox>
        )}

        <AnimatePresence>
          {mensagem && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl axi-card-premium3d axi-card-faixa"
              style={{ background: tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.15)' : 'rgba(255,90,107,0.15)', border: `1px solid ${tipoMsg === 'sucesso' ? 'rgba(5,150,105,0.4)' : 'rgba(255,90,107,0.4)'}` }}>
              {tipoMsg === 'sucesso' ? <CheckCircle size={18} color={VERDE} /> : <AlertCircle size={18} color={VERMELHO} />}
              <p className="text-sm font-semibold" style={{ color: tipoMsg === 'sucesso' ? VERDE : VERMELHO }}>{mensagem}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <CanvasBox cor={JADE} fundo={temaClaro ? '#f6f7c4' : undefined} premium3d>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl axi-card-premium3d axi-card-faixa" style={{ background: 'rgba(4,120,87,0.12)' }}>
                <Users size={26} style={{ color: JADE }} />
              </div>
              <div>
                <p className="text-lg font-black" style={{ ...FONTE_EXEC, color: TEXTO }}>{membros.length}</p>
                <p className="text-xs" style={{ color: MUTED }}>{t.titulo}</p>
                {vagas && <p className="text-[11px] font-bold mt-0.5" style={{ color: vagas.ocupadas >= vagas.limite ? VERMELHO : '#2ecc9b' }}>{t.vagasPlano(vagas.ocupadas, vagas.limite)}</p>}
                {vagas && <p className="text-[11px] font-bold" style={{ color: vagas.tempUsados >= vagas.tempLimite ? VERMELHO : MUTED }}>{t.tempPlano(vagas.tempUsados, vagas.tempLimite)}</p>}
              </div>
            </div>
            <p className="text-[11px] flex-1 sm:px-4" style={{ color: MUTED }}>
              {t.hierarquia}
              {membros.filter((m) => m.origem === 'ativo' && !m.suspenso_em && (m.nivel ?? 99) <= 4).length <= 1 && (
                <span className="block mt-1 font-semibold" style={{ color: temaClaro ? '#101b3d' : AMBAR }}>⚠ {t.unicoGestor}</span>
              )}
            </p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setErroModal(''); setLimiteAtingido(false); setTermoRemetente(false); setMeuPapelConvite(''); setAutEmail(''); setAutSenha(''); setForm(FORM_VAZIO); setModalAberto(true) }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>
              <UserPlus size={16} /> {t.convidar}
            </motion.button>
          </div>
        </CanvasBox>

        <CanvasBox cor="#2ecc9b" fundo={temaClaro ? '#f6f7c4' : undefined} premium3d>
          {membros.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🧑‍🤝‍🧑</p>
              <p className="text-sm font-semibold" style={{ color: TEXTO }}>{t.semEquipe}</p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>{t.semEquipeSub}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {membros.map((m) => {
                const status = statusDe(m)
                const ehVoce = m.origem === 'ativo' && m.user_id === userId
                return (
                  <div key={`${m.origem}-${m.id}`} className="rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap axi-card-premium3d axi-card-faixa"
                    style={{ background: LINHA_BG, border: '1px solid rgba(46,204,155,0.15)' }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: TEXTO }}>
                        {m.nome || m.email || t.conviteLink} {ehVoce && <span className="font-normal" style={{ color: MUTED }}>{t.voce}</span>}
                      </p>
                      <p className="text-xs truncate" style={{ color: MUTED }}>
                        {m.email || t.conviteLink} {m.nivel != null && m.nivel <= 4 ? `• ${nomeNivel(m.nivel)}` : m.relacao ? `• ${(t as any)[`rel_${m.relacao}`] || m.relacao}` : ''} {m.cargo ? `• ${m.cargo}` : ''} {m.nivel === 1 ? '' : `• ${labelPapel(m.papel)}`}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${status.cor}22`, color: status.cor, border: `1px solid ${status.cor}50` }}>
                        {status.label}
                      </span>
                    </div>

                    {ehVoce && meuNivel != null && meuNivel > 1 && (
                      <button onClick={sairDaEmpresa} title={t.sairEmpresa} className="p-2 rounded-lg axi-card-premium3d axi-card-faixa" style={{ background: 'rgba(248,113,113,0.08)', color: VERMELHO }}>
                        <LogOut size={15} />
                      </button>
                    )}
                    {!ehVoce && meuNivel === 1 && m.origem === 'ativo' && !m.suspenso_em && m.user_id && (
                      <button onClick={() => { setMembroTransferir(m); setMotivoApagar(''); setCienteApagar(false) }} title={t.transferirBotao}
                        className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5" style={{ background: '#101b3d', color: '#ffffff', border: '1px solid rgba(46,204,155,0.35)' }}>
                        <ShieldCheck size={14} /> {t.transferirBotao}
                      </button>
                    )}
                    {!ehVoce && m.origem === 'ativo' && m.suspenso_em && (meuNivel ?? 99) <= 3 && (
                      <button onClick={() => restaurar(m)} title={t.restaurar} className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        style={{ background: temaClaro ? '#16a97d' : 'rgba(46,204,155,0.15)', color: temaClaro ? '#ffffff' : '#2ecc9b' }}>
                        <RotateCcw size={14} /> {t.restaurar}
                      </button>
                    )}
                    {!ehVoce && !m.suspenso_em && podeRemover(m) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {m.origem === 'convite' && m.token_convite && (
                          <button onClick={() => setConviteEnviar(m)} title={t.enviarPorApps}
                            className="p-2 rounded-lg axi-card-premium3d axi-card-faixa" style={{ background: temaClaro ? '#16a97d' : 'rgba(46,204,155,0.15)', color: temaClaro ? '#ffffff' : '#2ecc9b' }}>
                            <Send size={15} />
                          </button>
                        )}
                        {m.origem === 'convite' && m.token_convite && (
                          <button onClick={() => copiarLink(m.token_convite as string)} title={t.copiarLink}
                            className="p-2 rounded-lg axi-card-premium3d axi-card-faixa" style={{ background: 'rgba(46,204,155,0.12)', color: '#2ecc9b' }}>
                            <Copy size={15} />
                          </button>
                        )}

                        {editandoId === `${m.origem}-${m.id}` ? (
                          <select
                            value={m.papel}
                            onChange={(e) => trocarPapel(m, e.target.value)}
                            className="px-2 py-2 rounded-lg text-xs"
                            style={{ background: CAMPO_BG, border: CAMPO_BORDA, color: TEXTO }}
                          >
                            {PAPEIS_ATRIBUIVEIS.map((p) => (
                              <option key={p} value={p} style={{ background: temaClaro ? '#ffffff' : '#020810' }}>{labelPapel(p)}</option>
                            ))}
                          </select>
                        ) : podeTrocarPapel(m) && (
                          <button onClick={() => setEditandoId(`${m.origem}-${m.id}`)} title={t.editarPapel}
                            className="p-2 rounded-lg axi-card-premium3d axi-card-faixa" style={{ background: 'rgba(46,204,155,0.1)', color: AZUL }}>
                            <Pencil size={15} />
                          </button>
                        )}

                        <button onClick={() => m.origem === 'ativo' ? (setMembroCortar(m), setMotivoApagar(''), setCienteApagar(false)) : removerAcesso(m)}
                          title={t.cortarAcesso} className="p-2 rounded-lg axi-card-premium3d axi-card-faixa" style={{ background: 'rgba(248,113,113,0.08)', color: VERMELHO }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CanvasBox>

        <CanvasBox cor={JADE} fundo={temaClaro ? '#f6f7c4' : undefined} premium3d>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} style={{ color: temaClaro ? '#101b3d' : VERDE }} />
            <p className="text-sm font-bold" style={{ color: TEXTO }}>{t.termosTitulo}</p>
          </div>
          <p className="text-xs mb-3" style={{ color: MUTED }}>{t.termosSub}</p>
          {termos.length === 0 ? (
            <p className="text-xs" style={{ color: MUTED }}>{t.semTermos}</p>
          ) : (
            <div className="space-y-2">
              {termos.map((tm) => (
                <div key={tm.id} className="rounded-xl p-3 flex items-start justify-between gap-3 axi-card-premium3d axi-card-faixa" style={{ background: LINHA_BG, border: '1px solid rgba(16,27,61,0.10)' }}>
                  <div className="min-w-0 text-xs space-y-0.5" style={{ color: MUTED }}>
                    {tm.apagado_em ? (
                      <p className="font-semibold" style={{ color: TEXTO }}>{t.dadosApagados(dataHora(tm.apagado_em), tm.motivo_apagado || '')}</p>
                    ) : (
                      <p className="text-sm font-bold" style={{ color: TEXTO }}>{tm.nome} <span className="font-normal" style={{ color: MUTED }}>• CPF {tm.cpf ? `${tm.cpf.slice(0, 3)}.***.***-${tm.cpf.slice(9)}` : '—'} • {tm.email}</span></p>
                    )}
                    <p>{tm.relacao ? `${(t as any)[`rel_${tm.relacao}`] || tm.relacao} • ` : ''}{tm.papel ? labelPapel(tm.papel) : ''}{` • ${rotuloPrazo(tm.acesso_dias)}`}</p>
                    <p>{t.convidadoPorEm(tm.remetente_nome || '—', tm.convidado_em ? dataHora(tm.convidado_em) : '—')} • {t.aceitoEm(dataHora(tm.aceito_em))}</p>
                    {tm.motivo_convite && <p>{t.motivoLabel.split(' (')[0]}: {tm.motivo_convite}</p>}
                  </div>
                  {!tm.apagado_em && (
                    <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} onClick={() => ehAltoNivel(tm.papel, tm.relacao) ? (setTermoApagar(tm), setMotivoApagar(''), setCienteApagar(false)) : apagarTermoDireto(tm)}
                      title={t.apagarDados} className="p-2 rounded-lg flex-shrink-0 axi-card-premium3d axi-card-faixa" style={{ background: 'rgba(248,113,113,0.08)', color: VERMELHO }}>
                      <Trash2 size={15} />
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CanvasBox>

        {/* Lixeira de termos — quem saiu da empresa; 60 dias e a limpeza diária apaga */}
        <CanvasBox cor={JADE} fundo={temaClaro ? '#f6f7c4' : undefined} premium3d>
          <button type="button" onClick={() => setLixeiraAberta(v => !v)} className="w-full flex items-center justify-between gap-2" aria-expanded={lixeiraAberta}>
            <span className="flex items-center gap-2">
              <Trash2 size={16} style={{ color: temaClaro ? '#101b3d' : VERDE }} />
              <span className="text-sm font-bold" style={{ color: TEXTO }}>{t.lixeiraTitulo} ({lixeira.length})</span>
            </span>
            <ChevronDown size={16} style={{ color: MUTED, transform: lixeiraAberta ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>
          <p className="text-xs mt-1" style={{ color: MUTED }}>{t.lixeiraSub}</p>
          {lixeiraAberta && (lixeira.length === 0 ? (
            <p className="text-xs mt-3" style={{ color: MUTED }}>{t.lixeiraVazia}</p>
          ) : (
            <div className="space-y-2 mt-3">
              {lixeira.map((tm) => (
                <div key={tm.id} className="rounded-xl p-3 text-xs flex items-start justify-between gap-3 axi-card-premium3d axi-card-faixa" style={{ background: LINHA_BG, color: MUTED }}>
                  <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-bold" style={{ color: TEXTO }}>{tm.nome || '—'} <span className="font-normal" style={{ color: MUTED }}>• CPF {tm.cpf ? `${tm.cpf.slice(0, 3)}.***.***-${tm.cpf.slice(9)}` : '—'} • {tm.email || '—'}</span></p>
                  <p>{tm.relacao ? `${(t as any)[`rel_${tm.relacao}`] || tm.relacao} • ` : ''}{tm.papel ? labelPapel(tm.papel) : ''}</p>
                  {tm.saiu_em && <p>{t.saiuEm(dataHora(tm.saiu_em))} • <span style={{ color: VERMELHO }}>{t.apagaEm(dataHora(new Date(new Date(tm.saiu_em).getTime() + 60 * 86400000)))}</span></p>}
                  </div>
                  <button type="button" onClick={() => recuperarTermo(tm)} className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>
                    <RotateCcw size={13} />{t.recuperar}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </CanvasBox>

      </div>

      <Modal open={!!termoApagar || !!membroCortar} onClose={() => { if (!apagando) { setTermoApagar(null); setMembroCortar(null) } }}>
        <CanvasBox cor={VERMELHO} fundo={temaClaro ? '#f6f7c4' : undefined}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: VERMELHO }}>AXIOMA AI.TECH</p>
              <h3 className="text-lg font-bold" style={{ color: TEXTO }}>{membroCortar ? t.cortarTitulo : t.apagarTitulo}</h3>
            </div>
            <button onClick={() => { if (!apagando) { setTermoApagar(null); setMembroCortar(null) } }} style={{ color: MUTED }}><X size={20} /></button>
          </div>
          <div className="rounded-xl p-3 mb-3 flex gap-2 axi-card-premium3d axi-card-faixa" style={{ background: temaClaro ? 'rgba(245,238,220,0.7)' : 'rgba(248,113,113,0.08)', border: `1px solid ${VERMELHO}40` }}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: VERMELHO }} />
            <p className="text-xs" style={{ color: TEXTO }}>{membroCortar ? `${membroCortar.nome || membroCortar.email} — ${zeraAoCortar(membroCortar) ? t.cortarAvisoPrazo : t.cortarAviso}` : t.apagarAviso}</p>
          </div>
          <p className="text-xs mb-2" style={{ color: MUTED }}>{lang === 'en' ? 'Date' : lang === 'es' ? 'Fecha' : 'Data'}: <strong style={{ color: TEXTO }}>{dataHora(new Date())}</strong></p>
          <label className="text-xs font-semibold mb-1 block" style={{ color: TEXTO }}>{t.apagarMotivo}</label>
          <textarea value={motivoApagar} onChange={(e) => setMotivoApagar(e.target.value)} rows={2} maxLength={500} disabled={apagando}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none mb-3" style={{ background: CAMPO_BG, border: CAMPO_BORDA, color: TEXTO }} />
          <label className="flex items-start gap-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={cienteApagar} onChange={(e) => setCienteApagar(e.target.checked)} disabled={apagando} className="mt-0.5" />
            <span className="text-xs" style={{ color: TEXTO }}>{membroCortar ? t.cortarCiente : t.apagarCiente}</span>
          </label>
          <motion.button onClick={membroCortar ? confirmarCorteAltoNivel : confirmarApagarTermo} disabled={apagando || motivoApagar.trim().length < 5 || !cienteApagar}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background: VERMELHO, color: '#fff' }}>
            {apagando ? t.apagando : membroCortar ? t.cortarBotao : t.apagarBotao}
          </motion.button>
        </CanvasBox>
      </Modal>
      <Modal open={!!membroTransferir} onClose={() => { if (!transferindo) setMembroTransferir(null) }}>
        <CanvasBox cor="#2ecc9b" fundo={temaClaro ? '#f6f7c4' : undefined} premium3d>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: '#2ecc9b' }}>AXIOMA AI.TECH</p>
              <h3 className="text-lg font-bold" style={{ color: TEXTO }}>{t.transferirTitulo}</h3>
            </div>
            <button onClick={() => { if (!transferindo) setMembroTransferir(null) }} style={{ color: MUTED }}><X size={20} /></button>
          </div>
          <div className="rounded-xl p-3 mb-3 flex gap-2 axi-card-premium3d axi-card-faixa" style={{ background: LINHA_BG }}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#2ecc9b' }} />
            <p className="text-xs" style={{ color: TEXTO }}>{membroTransferir ? t.transferirAviso(membroTransferir.nome || membroTransferir.email) : ''}</p>
          </div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: TEXTO }}>{t.apagarMotivo}</label>
          <textarea value={motivoApagar} onChange={(e) => setMotivoApagar(e.target.value)} rows={2} maxLength={500} disabled={transferindo}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none mb-3" style={{ background: CAMPO_BG, border: CAMPO_BORDA, color: TEXTO }} />
          <label className="flex items-start gap-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={cienteApagar} onChange={(e) => setCienteApagar(e.target.checked)} disabled={transferindo} className="mt-0.5" />
            <span className="text-xs" style={{ color: TEXTO }}>{t.transferirCiente}</span>
          </label>
          <motion.button onClick={confirmarTransferencia} disabled={transferindo || motivoApagar.trim().length < 5 || !cienteApagar}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', color: '#fff' }}>
            {transferindo ? '…' : t.transferirConfirmar}
          </motion.button>
        </CanvasBox>
      </Modal>
      {/* Modal compartilhado (portal no body): antes era fixed dentro do
          ModuloLayout, que anima com transform — o card nascia cortado em cima. */}
      {modalConvite}
      <CentroCompartilhamento
        aberto={!!conviteEnviar}
        onFechar={() => setConviteEnviar(null)}
        lang={lang}
        cor="#2ecc9b"
        para={conviteEnviar?.email}
        assunto={t.assuntoConvite}
        textoResumo={conviteEnviar ? textoConvite(conviteEnviar) : ''}
      />
    </ModuloLayout>
    </div>
  )
}

// Menu de escolha "hambúrguer": botão largo com o valor escolhido; abre uma
// lista legível (no lugar dos botões pequenos espremidos — pedido do Elias).
function MenuEscolha({ rotulo, valor, opcoes, onEscolher, temaClaro, cores }: {
  rotulo: string; valor: string; opcoes: { valor: string; label: string }[]; onEscolher: (v: string) => void
  temaClaro: boolean; cores: { texto: string; muted: string; campo: string; borda: string }
}) {
  const [aberto, setAberto] = useState(false)
  const atual = opcoes.find((o) => o.valor === valor)?.label || '—'
  return (
    <div className="relative">
      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: cores.muted }}>{rotulo}</p>
      <motion.button type="button" onClick={() => setAberto((a) => !a)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-left"
        style={{ background: cores.campo, border: aberto ? '1px solid #16a97d' : cores.borda, color: cores.texto }}>
        <Menu size={15} style={{ color: '#16a97d' }} />
        <span className="flex-1 truncate">{atual}</span>
        <motion.span animate={{ rotate: aberto ? 180 : 0 }}><ChevronDown size={15} style={{ color: cores.muted }} /></motion.span>
      </motion.button>
      <AnimatePresence>
        {aberto && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1 z-20 rounded-xl overflow-hidden shadow-xl"
            style={{ background: temaClaro ? '#ffffff' : '#0a1628', border: temaClaro ? '1px solid rgba(16,27,61,0.15)' : '1px solid rgba(46,204,155,0.25)' }}>
            {opcoes.map((o) => {
              const sel = o.valor === valor
              return (
                <motion.button key={o.valor} type="button" whileHover={{ x: 4 }}
                  onClick={() => { onEscolher(o.valor); setAberto(false) }}
                  className="w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition-colors"
                  style={{ background: sel ? (temaClaro ? 'rgba(22,169,125,0.12)' : 'rgba(46,204,155,0.15)') : 'transparent', color: sel ? '#16a97d' : cores.texto, fontWeight: sel ? 700 : 500 }}>
                  {o.label}{sel && <CheckCircle size={14} />}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
