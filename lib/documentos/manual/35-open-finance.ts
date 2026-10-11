// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '35 - Gestão - Open Finance.docx',
  titulo: 'Manual 35 — Open Finance (Conciliação)',
  subtitulo: 'Conecte o banco e veja se o sistema bate com o extrato',
  info: ['Menu: Gestão → Open Finance  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Conecta a conta bancária da empresa ao Axioma pelo **Open Finance** (sistema regulado pelo Banco Central, por meio da parceira Pluggy). As transações do banco entram sozinhas e o Axioma **concilia**: compara com o que já está lançado e avisa o que está diferente ou estranho.' },
    { alerta: 'A conexão com bancos reais fica disponível quando o Open Finance for ativado na sua conta (hoje funciona em ambiente de teste). A conexão é **somente leitura**: o Axioma vê saldo e extrato, mas não movimenta dinheiro. Você autoriza no ambiente do próprio banco e pode desconectar a qualquer momento.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **🏢 Gestão ▼** → **Open Finance**.'] },

    { h1: 'Passo a passo: conectar o banco' },
    { numerada: [
      'Clique em **Conectar Banco**.',
      'Busque o banco pelo nome e clique nele.',
      'Siga as telas do banco para autorizar o acesso.',
      'Ao voltar, aparece "Banco conectado com sucesso!". Clique em **Sincronizar** para trazer as transações.',
    ] },
    { nota: 'Bancos marcados como **Ambiente de teste** são simulações da Pluggy, não o seu banco real.' },

    { h1: 'As partes da tela' },
    { h2: 'Indicadores' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['Saldo do Banco', 'O saldo real informado pelo banco.'],
      ['Saldo do Sistema', 'O saldo calculado com o que está lançado no Axioma (receitas recebidas e custos lançados).'],
      ['Divergência', 'A diferença entre os dois: dinheiro não explicado.'],
      ['% Conciliado', 'Quanto das transações já foi casado com um lançamento.'],
    ] } },
    { p: 'Quando há diferença, a tela mostra quantas transações pendentes podem explicá-la, com o atalho **Ver pendentes**. Quando bate, aparece "Seu sistema bate com o banco".' },
    { h2: 'Bancos conectados' },
    { p: 'Lista das conexões, com **Desconectar** (pede confirmação).' },
    { h2: 'Abas de conciliação' },
    { tabela: { colunas: ['Aba', 'O que mostra e faz'], larguras: [2400, 6626], linhas: [
      ['Conciliado', 'Transações casadas com um lançamento ("Casado com...").'],
      ['Pendente', 'Transações sem lançamento correspondente. Use **Criar lançamento** (com a **categoria sugerida**) ou **Escolher lançamento** existente. Se houver mais de um parecido, o Axioma pede para você escolher. O lançamento criado passa pela porta oficial: entra em Receitas ou Custos Variáveis, no **Fluxo de Caixa** e na **contabilidade** de uma vez.'],
      ['Atípico', 'O que merece uma olhada: **Possível cobrança duplicada**, **Valor fora do padrão histórico** e **Débito novo, nunca visto antes**.'],
    ] } },
    { h1: 'Como a inteligência funciona aqui' },
    { p: 'A conciliação usa **regras**: compara valor, data e descrição, e o histórico da empresa para apontar atípicos. Nada é lançado sem você clicar.' },
    { nota: 'Se alguma leitura falhar, a tela avisa que a conciliação pode estar incompleta — nunca mostra uma divergência falsa calada.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '35 - Management - Open Finance.docx',
  titulo: 'Manual 35 — Open Finance (Reconciliation)',
  subtitulo: 'Connect the bank and see if the system matches the statement',
  info: ['Menu: Management → Open Finance  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Connects the company’s bank account to Axioma through **Open Finance** (a system regulated by the Brazilian Central Bank, via the partner Pluggy). Bank transactions come in automatically and Axioma **reconciles** them: it compares with what is already posted and flags what is different or unusual.' },
    { alerta: 'Connection to real banks becomes available when Open Finance is activated on your account (today it works in a test environment). The connection is **read-only**: Axioma sees balance and statement but does not move money. You authorize it in the bank’s own environment and can disconnect at any time.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **🏢 Management ▼** → **Open Finance**.'] },

    { h1: 'Step by step: connect the bank' },
    { numerada: [
      'Click **Connect Bank**.',
      'Search the bank by name and click it.',
      'Follow the bank’s screens to authorize access.',
      'When you come back, "Bank connected successfully!" appears. Click **Sync** to bring in the transactions.',
    ] },
    { nota: 'Banks marked **Test environment** are Pluggy simulations, not your real bank.' },

    { h1: 'Parts of the screen' },
    { h2: 'Indicators' },
    { tabela: { colunas: ['Indicator', 'What it means'], larguras: [2800, 6226], linhas: [
      ['Bank Balance', 'The real balance reported by the bank.'],
      ['System Balance', 'The balance calculated from what is posted in Axioma (received revenue and posted costs).'],
      ['Discrepancy', 'The difference between the two: unexplained money.'],
      ['% Reconciled', 'How much of the transactions has already been matched with an entry.'],
    ] } },
    { p: 'When there is a difference, the screen shows how many pending transactions may explain it, with the **See pending** shortcut. When it matches, "Your system matches the bank" appears.' },
    { h2: 'Connected banks' },
    { p: 'List of connections, with **Disconnect** (asks for confirmation).' },
    { h2: 'Reconciliation tabs' },
    { tabela: { colunas: ['Tab', 'What it shows and does'], larguras: [2400, 6626], linhas: [
      ['Reconciled', 'Transactions matched with an entry ("Matched with...").'],
      ['Pending', 'Transactions with no matching entry. Use **Create entry** (with the **suggested category**) or **Choose entry** from existing ones. If more than one is similar, Axioma asks you to choose. The created entry goes through the official path: it goes into Revenue or Variable Costs, **Cash Flow** and **accounting** at once.'],
      ['Unusual', 'What deserves a look: **Possible duplicate charge**, **Amount outside the historical pattern** and **New debit, never seen before**.'],
    ] } },
    { h1: 'How the intelligence works here' },
    { p: 'Reconciliation uses **rules**: it compares amount, date and description, and the company’s history to point out unusual items. Nothing is posted without your click.' },
    { nota: 'If any loading fails, the screen warns that reconciliation may be incomplete — it never shows a false discrepancy silently.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '35 - Gestión - Open Finance.docx',
  titulo: 'Manual 35 — Open Finance (Conciliación)',
  subtitulo: 'Conecte el banco y vea si el sistema coincide con el extracto',
  info: ['Menú: Gestión → Open Finance  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Conecta la cuenta bancaria de la empresa a Axioma por **Open Finance** (sistema regulado por el Banco Central de Brasil, por medio del socio Pluggy). Las transacciones del banco entran solas y Axioma **concilia**: compara con lo que ya está registrado y avisa lo que es diferente o extraño.' },
    { alerta: 'La conexión con bancos reales estará disponible cuando Open Finance se active en su cuenta (hoy funciona en ambiente de prueba). La conexión es **solo de lectura**: Axioma ve saldo y extracto, pero no mueve dinero. Usted autoriza en el ambiente del propio banco y puede desconectar en cualquier momento.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **🏢 Gestión ▼** → **Open Finance**.'] },

    { h1: 'Paso a paso: conectar el banco' },
    { numerada: [
      'Haga clic en **Conectar Banco**.',
      'Busque el banco por nombre y haga clic en él.',
      'Siga las pantallas del banco para autorizar el acceso.',
      'Al volver, aparece "¡Banco conectado con éxito!". Haga clic en **Sincronizar** para traer las transacciones.',
    ] },
    { nota: 'Los bancos marcados como **Ambiente de prueba** son simulaciones de Pluggy, no su banco real.' },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Indicadores' },
    { tabela: { colunas: ['Indicador', 'Qué significa'], larguras: [2800, 6226], linhas: [
      ['Saldo del Banco', 'El saldo real informado por el banco.'],
      ['Saldo del Sistema', 'El saldo calculado con lo registrado en Axioma (ingresos cobrados y costos registrados).'],
      ['Divergencia', 'La diferencia entre los dos: dinero no explicado.'],
      ['% Conciliado', 'Cuánto de las transacciones ya se emparejó con un registro.'],
    ] } },
    { p: 'Cuando hay diferencia, la pantalla muestra cuántas transacciones pendientes pueden explicarla, con el atajo **Ver pendientes**. Cuando coincide, aparece "Su sistema coincide con el banco".' },
    { h2: 'Bancos conectados' },
    { p: 'Lista de las conexiones, con **Desconectar** (pide confirmación).' },
    { h2: 'Pestañas de conciliación' },
    { tabela: { colunas: ['Pestaña', 'Qué muestra y hace'], larguras: [2400, 6626], linhas: [
      ['Conciliado', 'Transacciones emparejadas con un registro ("Emparejado con...").'],
      ['Pendiente', 'Transacciones sin registro correspondiente. Use **Crear registro** (con la **categoría sugerida**) o **Elegir registro** existente. Si hay más de uno parecido, Axioma pide que usted elija. El registro creado pasa por la puerta oficial: entra en Ingresos o Costos Variables, en el **Flujo de Caja** y en la **contabilidad** de una vez.'],
      ['Atípico', 'Lo que merece una mirada: **Posible cobro duplicado**, **Valor fuera del patrón histórico** y **Débito nuevo, nunca visto antes**.'],
    ] } },
    { h1: 'Cómo funciona la inteligencia aquí' },
    { p: 'La conciliación usa **reglas**: compara valor, fecha y descripción, y el historial de la empresa para señalar atípicos. Nada se registra sin su clic.' },
    { nota: 'Si alguna lectura falla, la pantalla avisa que la conciliación puede estar incompleta — nunca muestra una divergencia falsa en silencio.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
