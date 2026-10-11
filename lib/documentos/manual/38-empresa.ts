// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '38 - Configurações - Empresa.docx',
  titulo: 'Manual 38 — Empresa',
  subtitulo: 'Cadastro profissional, compliance e cofre de documentos',
  info: ['Menu: Config → Empresa  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'É a ficha oficial da empresa no Axioma. Os dados daqui alimentam todos os módulos: o regime tributário define os impostos da DRE e da IA Tributária, o CNAE define a atividade, e as obrigações aparecem no Fiscal. Também guarda os documentos da empresa em um cofre e registra todas as alterações.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **⚙️ Config ▼** → **Empresa**.'] },

    { h1: 'Topo da tela' },
    { lista: [
      '**📊 Health Score (Completude)**: quanto do cadastro está preenchido. Clique para ver o que falta.',
      '**🛡️ Compliance Score (Fiscal)**: como estão as obrigações fiscais.',
      '**📤 Compartilhar Cartão da Empresa**: envia um cartão com os dados principais (WhatsApp, e-mail, Telegram, copiar ou **PDF Cartão**).',
    ] },

    { h1: 'Abas' },
    { h2: '🏢 Dados Cadastrais' },
    { p: 'Use **🪄 Preencher por CNPJ**: digite o CNPJ e o Axioma consulta a Receita Federal (pela BrasilAPI, gratuita) e mostra razão social, situação, porte, CNAE, cidade e sócios. Clique em **✓ Aplicar Dados** e depois em salvar. Só preenche campos vazios: nada que você já digitou é apagado.' },
    { p: 'Blocos do cadastro: **Logo**; identificação (razão social, nome fantasia, inscrições, porte); **🏛️ Tributário** (regime, CNAE, natureza jurídica, capital social, data de abertura, situação cadastral); **📍 Endereço** (o CEP preenche sozinho); **📞 Contato** (telefones e e-mails principal, financeiro e contábil, site); **🏦 Dados Bancários** (banco, agência, conta, chave Pix com o tipo detectado automaticamente); **👤 Contador** (nome, CRC, telefone, e-mail).' },
    { p: 'Clique em **✅ Salvar Dados da Empresa**. O botão **Limpar campos** só esvazia a tela; nada é apagado até você salvar, e as outras abas não são afetadas.' },
    { h2: '👥 Sócios & Equipe' },
    { p: '**Quadro Societário**: **+ Novo Sócio** com nome, CPF/CNPJ, tipo de pessoa, qualificação (Sócio, Sócio Administrador, Administrador, Diretor, Procurador, Outros), % de participação e data de entrada.' },
    { h2: '📋 Compliance & Fiscal' },
    { p: 'O **Calendário Fiscal**: **🪄 Gerar Calendário Automático** cria as obrigações do seu regime (defina o regime antes). **+ Nova Obrigação** cadastra uma à mão: tipo, nome, descrição, vencimento, valor estimado, status (Pendente, Paga, Atrasada, Dispensada) e recorrência (Mensal, Trimestral, Anual, Única). Use **Marcar paga** quando quitar.' },
    { h2: '📄 Cofre Digital' },
    { p: 'Guarde Contrato Social, Cartão CNPJ, alvarás e certidões (PDF, imagens ou planilhas, até 50 MB cada, armazenamento criptografado). Informe nome, número, emissão, validade e órgão emissor. Documentos vencidos ficam marcados como **VENCIDO**. Use **⬇️ Baixar** para abrir.' },
    { h2: '🔐 Auditoria' },
    { p: 'O **Histórico de Alterações** (as 100 mais recentes): cada criação, edição ou exclusão fica registrada com data, hora, quem fez e o que mudou. Alterações com dado pessoal de terceiros aparecem sem o conteúdo, por privacidade.' },
    { h2: '🔁 Transferir empresa' },
    { p: 'Para quando a empresa muda de dono de verdade: venda, doação, herança ou reorganização entre sócios. Só o **Proprietário** pede; CEO, Sócios e Admins veem o histórico. (Para só passar o comando do Axioma a um CEO, Sócio ou Admin permanente que já está na equipe, use **Transferir propriedade** na tela Equipe.)' },
    { lista: [
      '**1. Tipo da empresa e da operação**: LTDA, SLU, S.A. ou outra. **MEI e Empresário Individual não podem ser transferidos** (o CNPJ é da própria pessoa) — a tela explica o caminho certo.',
      '**2. Quem passa e quem recebe**: nome, CPF ou CNPJ e o e-mail de quem recebe.',
      '**3. Registro na Junta Comercial**: número do protocolo/registro, data e o documento em PDF (vai também para o Cofre).',
      '**4. O que a lei pede**: marque os itens obrigatórios (documento assinado, registro na Junta, quadro de sócios na Receita; em herança, alvará ou formal de partilha). Certidões, contador e bancos são recomendados.',
      '**5. Confirmar**: escolha se você continua como Admin ou sai, escreva o motivo, marque a declaração e digite sua senha. Clique em **Enviar pedido de transferência**.',
    ] },
    { p: 'Copie o link e mande para quem recebe. Ela entra no Axioma com o e-mail indicado (ou cria a conta), confere o resumo, digita o CPF, aceita a declaração e a LGPD e clica em **Aceitar e assumir a empresa**. O link vale **7 dias**; até o aceite você pode **Cancelar transferência** (com motivo). Cada pedido fica no **Histórico de transferências** para sempre, com **Baixar PDF**.' },
    { p: '**Assinatura:** o que o antigo Proprietário já pagou continua valendo até o fim do período (a empresa não trava). A renovação no cartão dele é cancelada sozinha, e a tela de aceite mostra até quando está pago. Antes dessa data, o novo Proprietário cadastra o próprio pagamento em **Planos** — a assinatura dele passa a cobrir a empresa recebida.' },
    { nota: 'As regras da lei foram conferidas em 09/10/2026 (Código Civil, Lei 6.404/76 e normas do DREI) e podem mudar. Confirme com a Junta Comercial do seu estado antes de assinar.' },
    { nota: 'Só o **Proprietário** altera os dados cadastrais da empresa; os demais veem em modo leitura (se tentarem salvar, o Axioma avisa e não grava). Apagar sócio, documento ou obrigação pede motivo e e-mail e senha de um supervisor. Se alguma leitura falhar, a tela avisa — nunca mostra listas vazias por engano.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '38 - Settings - Company.docx',
  titulo: 'Manual 38 — Company',
  subtitulo: 'Professional registration, compliance and document vault',
  info: ['Menu: Settings → Company  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'It is the company’s official record in Axioma. The data here feeds every module: the tax regime defines the taxes in the Income Statement and Tax AI, the CNAE defines the activity, and obligations appear in Tax. It also keeps the company’s documents in a vault and logs every change.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **⚙️ Settings ▼** → **Company**.'] },

    { h1: 'Top of the screen' },
    { lista: [
      '**📊 Health Score (Completeness)**: how much of the record is filled in. Click to see what is missing.',
      '**🛡️ Compliance Score (Tax)**: how the tax obligations are doing.',
      '**📤 Share Company Card**: sends a card with the main data (WhatsApp, email, Telegram, copy or **PDF Card**).',
    ] },

    { h1: 'Tabs' },
    { h2: '🏢 Registration Data' },
    { p: 'Use **🪄 Fill by CNPJ**: type the CNPJ and Axioma queries the Federal Revenue (via the free BrasilAPI) and shows legal name, status, size, CNAE, city and partners. Click **✓ Apply Data** and then save. It only fills empty fields: nothing you already typed is erased.' },
    { p: 'Record blocks: **Logo**; identification (legal name, trade name, registrations, size); **🏛️ Tax** (regime, CNAE, legal nature, share capital, opening date, registration status); **📍 Address** (the ZIP code fills it in); **📞 Contact** (main, finance and accounting phones and emails, website); **🏦 Bank Details** (bank, branch, account, Pix key with its type detected automatically); **👤 Accountant** (name, CRC, phone, email).' },
    { p: 'Click **✅ Save Company Data**. **Clear fields** only empties the screen; nothing is deleted until you save, and the other tabs are not affected.' },
    { h2: '👥 Partners & Team' },
    { p: '**Partnership Table**: **+ New Partner** with name, CPF/CNPJ, person type, role (Partner, Managing Partner, Administrator, Director, Attorney, Other), % share and entry date.' },
    { h2: '📋 Compliance & Tax' },
    { p: 'The **Tax Calendar**: **🪄 Generate Automatic Calendar** creates your regime’s obligations (set the regime first). **+ New Obligation** adds one by hand: type, name, description, due date, estimated amount, status (Pending, Paid, Overdue, Waived) and recurrence (Monthly, Quarterly, Yearly, One-off). Use **Mark paid** when you pay it.' },
    { h2: '📄 Digital Vault' },
    { p: 'Keep the Articles of Association, CNPJ Card, permits and certificates (PDF, images or spreadsheets, up to 50 MB each, encrypted storage). Enter name, number, issue date, expiration and issuing body. Expired documents are tagged **EXPIRED**. Use **⬇️ Download** to open.' },
    { h2: '🔐 Audit' },
    { p: 'The **Change History** (the 100 most recent): every creation, edit or deletion is logged with date, time, who did it and what changed. Changes with third-party personal data appear without the content, for privacy.' },
    { h2: '🔁 Transfer company' },
    { p: 'For when the company truly changes owner: sale, donation, inheritance or reorganization among partners. Only the **Owner** requests it; CEO, Partners and Admins see the history. (To just hand over control of Axioma to a permanent CEO, Partner or Admin already on the team, use **Transfer ownership** on the Team screen.)' },
    { lista: [
      '**1. Company and operation type**: LTDA, SLU, S.A. or other. **MEI and Sole Proprietor cannot be transferred** (the CNPJ belongs to the person) — the screen explains the right path.',
      '**2. Who transfers and who receives**: name, CPF or CNPJ and the recipient’s email.',
      '**3. Commercial Registry record**: protocol/registration number, date and the PDF document (also saved to the Vault).',
      '**4. What the law requires**: check the mandatory items (signed document, Registry record, partner table at the Federal Revenue; for inheritance, court authorization or partition deed). Certificates, accountant and banks are recommended.',
      '**5. Confirm**: choose whether you stay as Admin or leave, write the reason, check the declaration and type your password. Click **Send transfer request**.',
    ] },
    { p: 'Copy the link and send it to the recipient. They sign in to Axioma with the given email (or create the account), review the summary, type their CPF, accept the declaration and LGPD and click **Accept and take over the company**. The link is valid for **7 days**; until acceptance you can **Cancel transfer** (with a reason). Each request stays in the **Transfer history** forever, with **Download PDF**.' },
    { p: '**Subscription:** what the former Owner already paid remains valid until the end of the period (the company does not lock). Renewal on their card is canceled automatically, and the acceptance screen shows until when it is paid. Before that date, the new Owner sets up their own payment in **Plans** — their subscription then covers the received company.' },
    { nota: 'The legal rules were checked on 10/09/2026 (Civil Code, Law 6.404/76 and DREI rules) and may change. Confirm with your state’s Commercial Registry before signing.' },
    { nota: 'Only the **Owner** changes the company’s registration data; others see it read-only (if they try to save, Axioma warns and does not save). Deleting a partner, document or obligation asks for a reason and a supervisor’s email and password. If any loading fails, the screen warns you — it never shows empty lists by mistake.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '38 - Configuración - Empresa.docx',
  titulo: 'Manual 38 — Empresa',
  subtitulo: 'Registro profesional, cumplimiento y bóveda de documentos',
  info: ['Menú: Config → Empresa  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Es la ficha oficial de la empresa en Axioma. Los datos de aquí alimentan todos los módulos: el régimen tributario define los impuestos del Estado de Resultados y de la IA Tributaria, el CNAE define la actividad, y las obligaciones aparecen en Fiscal. También guarda los documentos de la empresa en una bóveda y registra todos los cambios.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **⚙️ Config ▼** → **Empresa**.'] },

    { h1: 'Parte superior de la pantalla' },
    { lista: [
      '**📊 Health Score (Completitud)**: cuánto del registro está completo. Haga clic para ver lo que falta.',
      '**🛡️ Compliance Score (Fiscal)**: cómo están las obligaciones fiscales.',
      '**📤 Compartir Tarjeta de la Empresa**: envía una tarjeta con los datos principales (WhatsApp, correo, Telegram, copiar o **PDF Tarjeta**).',
    ] },

    { h1: 'Pestañas' },
    { h2: '🏢 Datos de Registro' },
    { p: 'Use **🪄 Completar por CNPJ**: escriba el CNPJ y Axioma consulta la Receita Federal (por la BrasilAPI, gratuita) y muestra razón social, situación, tamaño, CNAE, ciudad y socios. Haga clic en **✓ Aplicar Datos** y luego en guardar. Solo completa campos vacíos: nada de lo que ya escribió se borra.' },
    { p: 'Bloques del registro: **Logo**; identificación (razón social, nombre comercial, inscripciones, tamaño); **🏛️ Tributario** (régimen, CNAE, naturaleza jurídica, capital social, fecha de apertura, situación registral); **📍 Dirección** (el código postal la completa); **📞 Contacto** (teléfonos y correos principal, financiero y contable, sitio web); **🏦 Datos Bancarios** (banco, agencia, cuenta, clave Pix con el tipo detectado automáticamente); **👤 Contador** (nombre, CRC, teléfono, correo).' },
    { p: 'Haga clic en **✅ Guardar Datos de la Empresa**. El botón **Limpiar campos** solo vacía la pantalla; nada se borra hasta que guarde, y las otras pestañas no se afectan.' },
    { h2: '👥 Socios y Equipo' },
    { p: '**Cuadro Societario**: **+ Nuevo Socio** con nombre, CPF/CNPJ, tipo de persona, calificación (Socio, Socio Administrador, Administrador, Director, Apoderado, Otros), % de participación y fecha de entrada.' },
    { h2: '📋 Compliance y Fiscal' },
    { p: 'El **Calendario Fiscal**: **🪄 Generar Calendario Automático** crea las obligaciones de su régimen (defina el régimen antes). **+ Nueva Obligación** registra una a mano: tipo, nombre, descripción, vencimiento, valor estimado, estado (Pendiente, Pagada, Atrasada, Dispensada) y recurrencia (Mensual, Trimestral, Anual, Única). Use **Marcar pagada** al pagar.' },
    { h2: '📄 Bóveda Digital' },
    { p: 'Guarde Contrato Social, Tarjeta CNPJ, licencias y certificados (PDF, imágenes o planillas, hasta 50 MB cada uno, almacenamiento cifrado). Informe nombre, número, emisión, validez y órgano emisor. Los documentos vencidos quedan marcados como **VENCIDO**. Use **⬇️ Descargar** para abrir.' },
    { h2: '🔐 Auditoría' },
    { p: 'El **Historial de Cambios** (los 100 más recientes): cada creación, edición o eliminación queda registrada con fecha, hora, quién lo hizo y qué cambió. Los cambios con datos personales de terceros aparecen sin el contenido, por privacidad.' },
    { h2: '🔁 Transferir empresa' },
    { p: 'Para cuando la empresa cambia de dueño de verdad: venta, donación, herencia o reorganización entre socios. Solo el **Propietario** lo solicita; CEO, Socios y Admins ven el historial. (Para solo pasar el control de Axioma a un CEO, Socio o Admin permanente que ya está en el equipo, use **Transferir propiedad** en la pantalla Equipo.)' },
    { lista: [
      '**1. Tipo de empresa y de operación**: LTDA, SLU, S.A. u otra. **MEI y Empresario Individual no se pueden transferir** (el CNPJ es de la propia persona) — la pantalla explica el camino correcto.',
      '**2. Quién transfiere y quién recibe**: nombre, CPF o CNPJ y el correo de quien recibe.',
      '**3. Registro en la Junta Comercial**: número de protocolo/registro, fecha y el documento en PDF (va también a la Bóveda).',
      '**4. Lo que exige la ley**: marque los ítems obligatorios (documento firmado, registro en la Junta, cuadro de socios en la Receita; en herencia, autorización judicial o formal de partición). Certificados, contador y bancos son recomendados.',
      '**5. Confirmar**: elija si sigue como Admin o sale, escriba el motivo, marque la declaración y escriba su contraseña. Haga clic en **Enviar solicitud de transferencia**.',
    ] },
    { p: 'Copie el enlace y envíelo a quien recibe. Esa persona entra a Axioma con el correo indicado (o crea la cuenta), revisa el resumen, escribe el CPF, acepta la declaración y la LGPD y hace clic en **Aceptar y asumir la empresa**. El enlace vale **7 días**; hasta la aceptación usted puede **Cancelar transferencia** (con motivo). Cada solicitud queda en el **Historial de transferencias** para siempre, con **Descargar PDF**.' },
    { p: '**Suscripción:** lo que el antiguo Propietario ya pagó sigue valiendo hasta el fin del período (la empresa no se bloquea). La renovación en su tarjeta se cancela sola, y la pantalla de aceptación muestra hasta cuándo está pagado. Antes de esa fecha, el nuevo Propietario registra su propio pago en **Planes** — su suscripción pasa a cubrir la empresa recibida.' },
    { nota: 'Las reglas legales se verificaron el 09/10/2026 (Código Civil, Ley 6.404/76 y normas del DREI) y pueden cambiar. Confirme con la Junta Comercial de su estado antes de firmar.' },
    { nota: 'Solo el **Propietario** cambia los datos de registro de la empresa; los demás ven en modo lectura (si intentan guardar, Axioma avisa y no graba). Borrar socio, documento u obligación pide motivo y correo y contraseña de un supervisor. Si alguna lectura falla, la pantalla avisa — nunca muestra listas vacías por error.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
