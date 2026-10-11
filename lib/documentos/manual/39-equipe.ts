// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '39 - Configurações - Equipe.docx',
  titulo: 'Manual 39 — Equipe',
  subtitulo: 'Quem tem acesso à empresa e com qual papel',
  info: ['Menu: Equipe (barra superior)  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Controla quem entra na empresa dentro do Axioma, o que cada pessoa pode fazer e por quanto tempo. Tudo fica registrado na auditoria da empresa.' },

    { h1: 'Papéis' },
    { tabela: { colunas: ['Papel', 'O que pode fazer'], larguras: [2800, 6226], linhas: [
      ['Proprietário', 'Dono da empresa. Acesso total. Ninguém pode removê-lo.'],
      ['Admin', 'Acesso total à gestão.'],
      ['Financeiro', 'Módulos financeiros.'],
      ['Contábil', 'Módulos contábeis e fiscais.'],
      ['Leitor', 'Só visualização.'],
      ['Caixa', 'Só o PDV, sem acesso ao restante do Axioma.'],
    ] } },
    { p: '**Hierarquia**: Proprietário › CEO › Sócio › Admin › demais. Ninguém remove o Proprietário. Para remover alguém do mesmo nível ou acima, é preciso o **aval** de alguém acima.' },

    { h1: 'Convidar uma pessoa' },
    { numerada: [
      'Clique em **Convidar pessoa**.',
      'Informe nome, **E-mail** (opcional: se preencher, o link só vale para ele), cargo, quem você está convidando (CEO, Sócio, Contador, Funcionário, Consultor, Outro) e o **Papel**.',
      'Escolha o **Tempo de acesso** (de 24 horas até indeterminado; indeterminado só para Admin, Sócio ou CEO) e o motivo.',
      'Marque o termo de responsabilidade e clique em **Gerar convite**.',
      'Envie pelo canal que preferir: WhatsApp, Gmail, Outlook, Telegram, e-mail ou **Copiar link**.',
    ] },
    { p: 'A pessoa abre o link, preenche nome, CPF e e-mail e confirma com o **código enviado ao e-mail dela**. Ela cria uma senha e aceita os Termos e a LGPD, declarando quem enviou o convite (a responsabilidade é de quem enviou). CEO, Sócio e Admin enviam direto. Se quem convida é outra pessoa (ex.: funcionário), o convite precisa do **motivo** e da autorização (e-mail e senha) de um deles, ou fica **Aguardando sua aprovação** para o responsável **Aprovar** ou **Recusar**.' },

    { h1: 'Vagas do plano' },
    { p: 'A assinatura pertence à **empresa**. Cada plano tem um número de pessoas: **Starter 1**, **Pro 2**, **Business 5**, **Enterprise 10**. Contam: o dono, a equipe fixa e convites de **8 dias ou mais**. **Não contam**: operador de caixa e contador ou consultor externo.' },
    { p: 'Convites **temporários de até 7 dias** (ex.: um analista para uma segunda opinião) não ocupam vaga, mas cada plano tem **3** desses convites; eles se esgotam ao usar e só renovam ao subir de plano. No limite, o convite é bloqueado e aparece o botão **Ver planos**.' },

    { h1: 'Remover, cortar e restaurar acesso' },
    { lista: [
      '**Remover acesso** de alguém fixo: o acesso fica **suspenso por 7 dias** e pode ser **restaurado** nesse prazo.',
      '**Cortar acesso** de convite **de até 30 dias**: encerra **de vez**. Para a pessoa voltar, envie um novo convite.',
      'Convites **acima de 30 dias ou sem prazo**: o corte suspende e o acesso pode ser restaurado, com os dados preservados.',
      'Toda remoção pede **motivo**, que fica registrado na auditoria com a data.',
      '**Sair desta empresa**: qualquer membro pode sair; um Sócio ou acima restaura em até 7 dias. O Proprietário precisa transferir a empresa antes de sair.',
    ] },
    { h2: 'Remoções aguardando aval' },
    { p: 'Quando a remoção depende de alguém acima, vira um pedido que vale 7 dias. Se ninguém acima responder no prazo, é possível **Concluir sem aval** informando o motivo. A barra superior avisa quando há pedido esperando você.' },

    { h1: 'Termos de convite e lixeira' },
    { p: '**Termos de convite aceitos**: quem aceitou, com nome, CPF e e-mail informados no aceite. Só o Proprietário e administradores veem.' },
    { p: 'Quando alguém sai da empresa, o termo vai para a **Lixeira de termos** (fechada, no fim da página). Fica guardado por **60 dias** e depois é apagado automaticamente. Dentro desse prazo, use **Recuperar**. Também é possível **apagar os dados pessoais** de um termo de forma definitiva, com motivo; fica registrado só quem apagou e quando.' },

    { h1: 'Transferir propriedade (dentro da equipe)' },
    { p: 'O Proprietário pode passar o comando do Axioma para um **CEO, Sócio ou Admin permanente** que já está na equipe (nunca para um convite com prazo): **Transferir propriedade**, escolha a pessoa, marque "Entendo que deixo de ser o Proprietário" e clique em **Transferir**. A assinatura continua com a empresa.' },
    { h1: 'Transferir a empresa (venda, doação, herança)' },
    { p: 'Quando a empresa muda de dono de verdade, use o card **Transferir a empresa** → **Preencher transferência**: abre o formulário completo (dados da Junta Comercial, documento, o que a lei pede); quem recebe aceita pelo link em até 7 dias. O passo a passo está no Manual 38 (Empresa → Transferir empresa).' },
    { nota: 'Se só você gerencia a equipe, o Axioma recomenda convidar um Sócio ou Admin para a empresa nunca ficar sem gestor. Se a lista da equipe não carregar, a tela avisa.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '39 - Settings - Team.docx',
  titulo: 'Manual 39 — Team',
  subtitulo: 'Who has access to the company and with which role',
  info: ['Menu: Team (top bar)  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Controls who enters the company inside Axioma, what each person can do and for how long. Everything is logged in the company’s audit trail.' },

    { h1: 'Roles' },
    { tabela: { colunas: ['Role', 'What they can do'], larguras: [2800, 6226], linhas: [
      ['Owner', 'Owner of the company. Full access. Nobody can remove them.'],
      ['Admin', 'Full management access.'],
      ['Finance', 'Financial modules.'],
      ['Accounting', 'Accounting and tax modules.'],
      ['Viewer', 'View only.'],
      ['Cashier', 'POS only, with no access to the rest of Axioma.'],
    ] } },
    { p: '**Hierarchy**: Owner › CEO › Partner › Admin › others. Nobody removes the Owner. To remove someone at the same level or above, the **approval** of someone above is required.' },

    { h1: 'Inviting a person' },
    { numerada: [
      'Click **Invite person**.',
      'Enter name, **Email** (optional: if filled in, the link only works for it), job title, who you are inviting (CEO, Partner, Accountant, Employee, Consultant, Other) and the **Role**.',
      'Choose the **Access time** (from 24 hours to indefinite; indefinite only for Admin, Partner or CEO) and the reason.',
      'Check the responsibility term and click **Generate invite**.',
      'Send it through the channel you prefer: WhatsApp, Gmail, Outlook, Telegram, email or **Copy link**.',
    ] },
    { p: 'The person opens the link, fills in name, CPF and email and confirms with the **code sent to their email**. They create a password and accept the Terms and LGPD, declaring who sent the invite (responsibility lies with the sender). CEO, Partner and Admin send directly. If someone else invites (e.g., an employee), the invite needs a **reason** and the authorization (email and password) of one of them, or it stays **Awaiting your approval** for the person in charge to **Approve** or **Decline**.' },

    { h1: 'Plan seats' },
    { p: 'The subscription belongs to the **company**. Each plan has a number of people: **Starter 1**, **Pro 2**, **Business 5**, **Enterprise 10**. They count: the owner, the permanent team and invites of **8 days or more**. They **do not count**: cashier and external accountant or consultant.' },
    { p: '**Temporary invites of up to 7 days** (e.g., an analyst for a second opinion) do not take a seat, but each plan has **3** of them; they run out as you use them and only renew when you upgrade. At the limit, the invite is blocked and the **See plans** button appears.' },

    { h1: 'Remove, cut and restore access' },
    { lista: [
      '**Remove access** of a permanent person: access is **suspended for 7 days** and can be **restored** within that time.',
      '**Cut access** of an invite **of up to 30 days**: ends it **for good**. For the person to come back, send a new invite.',
      'Invites **over 30 days or with no deadline**: cutting suspends them and access can be restored, with data preserved.',
      'Every removal asks for a **reason**, which is logged in the audit trail with the date.',
      '**Leave this company**: any member can leave; a Partner or above can restore within 7 days. The Owner must transfer the company before leaving.',
    ] },
    { h2: 'Removals awaiting approval' },
    { p: 'When a removal depends on someone above, it becomes a request valid for 7 days. If nobody above answers in time, you can **Complete without approval** stating the reason. The top bar warns you when a request is waiting for you.' },

    { h1: 'Invite terms and trash' },
    { p: '**Accepted invite terms**: who accepted, with name, CPF and email given at acceptance. Only the Owner and administrators see them.' },
    { p: 'When someone leaves the company, the term goes to the **Terms trash** (collapsed, at the bottom of the page). It is kept for **60 days** and then deleted automatically. Within that time, use **Recover**. You can also **erase the personal data** of a term permanently, with a reason; only who erased it and when is logged.' },

    { h1: 'Transfer ownership (within the team)' },
    { p: 'The Owner can hand over control of Axioma to a **permanent CEO, Partner or Admin** already on the team (never to a time-limited invite): **Transfer ownership**, choose the person, check "I understand I will no longer be the Owner" and click **Transfer**. The subscription stays with the company.' },
    { h1: 'Transfer the company (sale, donation, inheritance)' },
    { p: 'When the company truly changes owner, use the **Transfer the company** card → **Fill in the transfer**: it opens the full form (Commercial Registry details, document, what the law requires); the recipient accepts by link within 7 days. The step by step is in Manual 38 (Company → Transfer company).' },
    { nota: 'If only you manage the team, Axioma recommends inviting a Partner or Admin so the company never lacks a manager. If the team list does not load, the screen warns you.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '39 - Configuración - Equipo.docx',
  titulo: 'Manual 39 — Equipo',
  subtitulo: 'Quién tiene acceso a la empresa y con qué rol',
  info: ['Menú: Equipo (barra superior)  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Controla quién entra a la empresa dentro de Axioma, qué puede hacer cada persona y por cuánto tiempo. Todo queda registrado en la auditoría de la empresa.' },

    { h1: 'Roles' },
    { tabela: { colunas: ['Rol', 'Qué puede hacer'], larguras: [2800, 6226], linhas: [
      ['Propietario', 'Dueño de la empresa. Acceso total. Nadie puede quitarlo.'],
      ['Admin', 'Acceso total a la gestión.'],
      ['Financiero', 'Módulos financieros.'],
      ['Contable', 'Módulos contables y fiscales.'],
      ['Lector', 'Solo visualización.'],
      ['Caja', 'Solo el PDV, sin acceso al resto de Axioma.'],
    ] } },
    { p: '**Jerarquía**: Propietario › CEO › Socio › Admin › demás. Nadie quita al Propietario. Para quitar a alguien del mismo nivel o superior, se necesita el **aval** de alguien superior.' },

    { h1: 'Invitar a una persona' },
    { numerada: [
      'Haga clic en **Invitar persona**.',
      'Informe nombre, **Correo** (opcional: si lo completa, el enlace solo vale para él), cargo, a quién está invitando (CEO, Socio, Contador, Empleado, Consultor, Otro) y el **Rol**.',
      'Elija el **Tiempo de acceso** (de 24 horas a indeterminado; indeterminado solo para Admin, Socio o CEO) y el motivo.',
      'Marque el término de responsabilidad y haga clic en **Generar invitación**.',
      'Envíe por el canal que prefiera: WhatsApp, Gmail, Outlook, Telegram, correo o **Copiar enlace**.',
    ] },
    { p: 'La persona abre el enlace, completa nombre, CPF y correo y confirma con el **código enviado a su correo**. Crea una contraseña y acepta los Términos y la LGPD, declarando quién envió la invitación (la responsabilidad es de quien la envió). CEO, Socio y Admin envían directo. Si quien invita es otra persona (ej.: un empleado), la invitación necesita el **motivo** y la autorización (correo y contraseña) de uno de ellos, o queda **Esperando su aprobación** para que el responsable **Apruebe** o **Rechace**.' },

    { h1: 'Cupos del plan' },
    { p: 'La suscripción pertenece a la **empresa**. Cada plan tiene un número de personas: **Starter 1**, **Pro 2**, **Business 5**, **Enterprise 10**. Cuentan: el dueño, el equipo fijo e invitaciones de **8 días o más**. **No cuentan**: operador de caja y contador o consultor externo.' },
    { p: 'Las invitaciones **temporales de hasta 7 días** (ej.: un analista para una segunda opinión) no ocupan cupo, pero cada plan tiene **3**; se agotan al usarlas y solo se renuevan al subir de plan. En el límite, la invitación se bloquea y aparece el botón **Ver planes**.' },

    { h1: 'Quitar, cortar y restaurar acceso' },
    { lista: [
      '**Quitar acceso** de alguien fijo: el acceso queda **suspendido por 7 días** y puede **restaurarse** en ese plazo.',
      '**Cortar acceso** de una invitación **de hasta 30 días**: termina **definitivamente**. Para que la persona vuelva, envíe una nueva invitación.',
      'Invitaciones **de más de 30 días o sin plazo**: el corte suspende y el acceso puede restaurarse, con los datos preservados.',
      'Toda remoción pide **motivo**, que queda registrado en la auditoría con la fecha.',
      '**Salir de esta empresa**: cualquier miembro puede salir; un Socio o superior restaura en hasta 7 días. El Propietario debe transferir la empresa antes de salir.',
    ] },
    { h2: 'Remociones esperando aval' },
    { p: 'Cuando la remoción depende de alguien superior, se vuelve una solicitud que vale 7 días. Si nadie superior responde a tiempo, es posible **Concluir sin aval** informando el motivo. La barra superior avisa cuando hay una solicitud esperándolo.' },

    { h1: 'Términos de invitación y papelera' },
    { p: '**Términos de invitación aceptados**: quién aceptó, con nombre, CPF y correo informados al aceptar. Solo el Propietario y los administradores los ven.' },
    { p: 'Cuando alguien sale de la empresa, el término va a la **Papelera de términos** (cerrada, al final de la página). Se guarda por **60 días** y luego se borra automáticamente. En ese plazo, use **Recuperar**. También es posible **borrar los datos personales** de un término de forma definitiva, con motivo; solo queda registrado quién lo borró y cuándo.' },

    { h1: 'Transferir propiedad (dentro del equipo)' },
    { p: 'El Propietario puede pasar el control de Axioma a un **CEO, Socio o Admin permanente** que ya está en el equipo (nunca a una invitación con plazo): **Transferir propiedad**, elija a la persona, marque "Entiendo que dejo de ser el Propietario" y haga clic en **Transferir**. La suscripción sigue con la empresa.' },
    { h1: 'Transferir la empresa (venta, donación, herencia)' },
    { p: 'Cuando la empresa cambia de dueño de verdad, use la tarjeta **Transferir la empresa** → **Llenar la transferencia**: abre el formulario completo (datos de la Junta Comercial, documento, lo que pide la ley); quien recibe acepta por enlace en hasta 7 días. El paso a paso está en el Manual 38 (Empresa → Transferir empresa).' },
    { nota: 'Si solo usted gestiona el equipo, Axioma recomienda invitar a un Socio o Admin para que la empresa nunca quede sin gestor. Si la lista del equipo no carga, la pantalla avisa.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
