// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '48 - RH Estrutura da Empresa.docx',
  titulo: 'Manual 48 — RH · Estrutura da Empresa',
  subtitulo: 'Empregador, filiais, lotações, departamentos e cargos: a base do eSocial e da folha',
  info: ['Menu: Gestão → RH → Estrutura  •  Manual de uso do Axioma AI.Tech  •  Versão 1.0 (novembro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'É o primeiro passo do RH do Axioma. Aqui ficam os cadastros que o **eSocial exige antes de qualquer admissão** (dados do empregador, filiais e lotações) e a organização interna da Empresa (departamentos e cargos). Os funcionários, a contratação e a folha usam esta base.' },
    { p: 'As regras do governo já estão no Axioma: o que for preenchido fora do leiaute oficial do eSocial (versão S-1.3) é recusado na hora, com a explicação do motivo. Nesta versão, o **Axioma prepara e o contador envia** ao governo.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Gestão ▼** → **RH** → **Estrutura** (barra no topo da tela).', 'Para cadastrar: clique na parte (Empregador, Filiais, Lotações, Departamentos ou Cargos) e depois no botão verde **+ Novo: <parte>**, no topo da tela, ao lado de Exportar Excel. No Empregador também há **Preencher com os dados da Empresa**.', 'Na **Filial**, informe o **CNPJ do sindicato da categoria**: o eSocial exige em toda admissão e ele vem preenchido no contrato de quem trabalha ali (quem é de categoria diferenciada recebe outro no próprio contrato). Confira na convenção coletiva ou com o contador.', '**Verbas da rescisão (S-1010)**: botão ao lado das partes. **Cadastrar as verbas padrão** cria as 15 verbas que o Axioma usa na rescisão (saldo, aviso, 13º, férias, art. 479/480, INSS e IR), com natureza (Tabela 03) e incidências de INSS, IR e FGTS — em rascunho, para o contador conferir. **Preparar S-1010 e baixar** gera um arquivo por verba; depois registre o recibo (Aceito), Enviado ou Recusado.'] },
    { h1: 'Letreiro' },
    { p: 'Faixa azul-marinho logo abaixo das abas, rolando sozinha: quantos itens há em cada parte (Empregador, Filiais, Lotações, Departamentos, Cargos). Passe o mouse para parar.' },

    { h1: 'Ordem para preencher' },
    { numerada: [
      'Aba **Empregador** → **Preencher com os dados da Empresa**. O Axioma já traz a raiz do CNPJ (8 primeiros números) e sugere a classificação tributária pelo regime cadastrado. Confira com o contador e toque em **Salvar**.',
      'Aba **Filiais** → botão de novo no topo. A matriz já vem preenchida com o CNPJ completo e o CNAE da Empresa. Cada filial precisa ter os mesmos 8 primeiros números do CNPJ do empregador; CNPJ com outro começo é **outra Empresa** no Axioma.',
      'Aba **Lotações** → o tipo comum é **01**. Escolha o **FPAS** da atividade. No Simples e no MEI, o código de Terceiros é **0000**.',
      'Aba **Departamentos** → crie as áreas. Um departamento pode ficar dentro de outro (ex.: Vendas dentro de Comercial) e pode ser ligado a um centro de custo e a uma filial.',
      'Aba **Cargos** → nome, **Ocupação na CBO** (digite o nome — ex.: vendedor, motorista — ou o código e escolha na lista oficial do Ministério do Trabalho, com 2.725 ocupações e 7.870 nomes alternativos; o código de 6 dígitos entra sozinho e, se o nome do cargo estiver vazio, ele também; código fora da lista não é aceito), departamento, o que a pessoa faz, requisitos e as **competências** (técnicas ou comportamentais, obrigatórias ou desejáveis, nível de 1 a 5).',
    ] },

    { h1: 'Colunas das tabelas' },
    { lista: ['Tocar no **nome da coluna** ordena a lista (de novo, inverte).', 'O **ⓘ** ao lado abre um card explicando a coluna e a regra oficial (eSocial, CLT, LGPD).', 'Valor sublinhado leva ao destino: **CBO** abre a consulta oficial do Ministério do Trabalho, **CNAE** a do IBGE, **Departamento** e **Fica dentro de** abrem o departamento, **Centro de custo** abre o módulo Centros de Custo, **Tipo/FPAS**, **Classificação** e **Competências** mostram o texto oficial ou a lista; o nome abre o cadastro.', 'Em **Acessos do RH**, tocar no nome de cada liberação (Ver o RH, Editar, Dados pessoais, Salário, Saúde) mostra o que ela abre.'] },
    { h1: 'Botões de cada linha' },
    { lista: [
      '**Lápis**: corrige o cadastro. Nos cadastros do eSocial, só enquanto estiver como **Rascunho**.',
      '**Nova validade** (ícone de copiar): quando algo muda a partir de um mês, crie uma nova validade em vez de apagar. O histórico fica certo, como o governo exige.',
      '**Lixeira**: manda o cadastro para a lixeira na hora, sem senha. Ele pode ser **recuperado por 90 dias**; depois some de vez.',
      'O que **já foi enviado ao eSocial** não vai para a lixeira: informe **Vale até** — no governo, a correção é por fim de validade.',
      '**Lixeira (90 dias)**, no canto do quadro: mostra o que foi apagado, quantos dias faltam e o botão **Recuperar**.',
      'Tocar em qualquer informação da linha que não tenha link próprio (validade, CNPJ, situação) abre o próprio cadastro: para editar, se for rascunho, ou para ver os detalhes.',
    ] },
    { nota: '**Casos especiais** (cooperativa, obra, órgão público, entidade isenta, operador portuário): toque em **Mostrar casos especiais** dentro do formulário.' },

    { h1: 'Preenchimento e IA' },
    { lista: ['CNPJ e CPF ganham pontos, barra e traço enquanto você digita (grava só os números).', '**Inteligência Axioma — Especialista de RH**, no fim da tela: "o RH está configurado? o que falta?", "quantos departamentos e cargos temos?". A IA lê só o que você pode ver. Escreva ou toque no **microfone** para falar; **Ouvir** lê a resposta em voz alta e **Conversa ao vivo** conversa por voz, como com o José.'] },
    { h1: 'Compartilhar e exportar' },
    { lista: ['**Compartilhar**: resumo (quantos cadastros em cada aba) ou detalhado (a aba aberta).', '**PDF** e **Excel** no topo: a lista da aba aberta.'] },

    { h1: 'Quem pode ver e mexer (aba Acessos do RH)' },
    { lista: [
      '**Proprietário, CEO, Sócio e Admin**: acesso total ao RH. São os únicos que veem a aba **Acessos do RH** e liberam acesso para outras pessoas.',
      '**Todos os outros** (Financeiro, Contador, Leitor, Operador): não veem nada do RH até serem liberados.',
      'Na aba **Acessos do RH**, marque para cada pessoa: **Ver o RH**, **Editar**, **Dados pessoais**, **Salário** e **Saúde**. Marcar um item já marca "Ver o RH"; desmarcar "Ver o RH" tira tudo.',
      'Ninguém libera acesso para si mesmo. Cada liberação fica registrada com quem liberou e quando. Pessoa suspensa ou com acesso vencido perde o acesso ao RH na hora.',
    ] },
    { nota: 'Fonte das regras: leiaute oficial do eSocial S-1.3 (NT 07/2026, revisão de 20/10/2026) e Tabelas 03, 04, 08, 10, 12 e 21 do eSocial.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '48 - HR Company Structure.docx',
  titulo: 'Manual 48 — HR · Company Structure',
  subtitulo: 'Employer, branches, tax units, departments and job titles: the base for eSocial and payroll',
  info: ['Menu: Management → HR → Structure  •  Axioma AI.Tech user manual  •  Version 1.0 (November 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'It is the first step of Axioma HR. It holds the records **eSocial requires before any hiring** (employer data, branches and tax units) and the company\'s internal organization (departments and job titles). Employees, hiring and payroll use this base.' },
    { p: 'Government rules are built in: anything outside the official eSocial layout (version S-1.3) is refused immediately, with the reason. In this version, **Axioma prepares and the accountant submits** to the government.' },
    { h1: 'How to get there' },
    { lista: ['Top menu → **Management ▼** → **HR** → **Structure** (bar at the top of the screen).', 'To register: click the part (Employer, Branches, Tax units, Departments or Positions), then the green **+ New: <part>** button at the top of the screen, next to Export Excel. Employer also has **Fill in with company data**.', 'On the **Branch**, enter the **union CNPJ (category)**: eSocial requires it on every hire and it fills in for whoever works there (differentiated categories get another one on their own contract). Check the collective agreement or the accountant.', '**Termination pay items (S-1010)**: button next to the parts. **Register the default pay items** creates the 15 items Axioma uses in severance (balance, notice, 13th, vacation, art. 479/480, INSS and income tax), with nature (Table 03) and INSS, income tax and FGTS incidences — as drafts for the accountant to check. **Prepare S-1010 and download** creates one file per item; then record the receipt (Accepted), Sent or Rejected.'] },
    { h1: 'Ticker' },
    { p: 'Navy strip right below the tabs, scrolling on its own: how many items each part has (Employer, Branches, Tax units, Departments, Positions). Hover to pause.' },
    { h1: 'Order to fill in' },
    { numerada: [
      '**Employer** tab → **Fill in with company data**. Axioma brings the CNPJ root (first 8 digits) and suggests the tax classification from the registered regime. Check with your accountant and tap **Save**.',
      '**Branches** tab → New button at the top. The head office comes pre-filled with the full CNPJ and the company CNAE. Each branch must share the employer\'s first 8 CNPJ digits; a CNPJ with a different start is **another company** in Axioma.',
      '**Tax units** tab → the usual type is **01**. Choose the activity **FPAS**. In Simples and MEI, the third-party code is **0000**.',
      '**Departments** tab → create the areas. A department can sit inside another and be linked to a cost center and a branch.',
      '**Job titles** tab → name, **CBO occupation** (type the name — e.g. salesperson, driver — or the code and pick it from the official Ministry of Labor list, with 2,725 occupations and 7,870 alternative names; the 6-digit code fills in by itself and, if the job name is empty, so does the name; codes outside the list are not accepted), department, duties, requirements and **skills** (technical or behavioral, required or desirable, level 1 to 5).',
    ] },
    { h1: 'Table columns' },
    { lista: ['Tapping a **column name** sorts the list (again, reverses).', 'The **ⓘ** next to it opens a card explaining the column and the official rule (eSocial, CLT, LGPD).', 'Underlined values take you to the destination: **CBO** opens the Ministry of Labor official lookup, **CNAE** the IBGE one, **Department** and **Belongs to** open the department, **Cost center** opens Cost Centers, **Type/FPAS**, **Classification** and **Skills** show the official text or list; the name opens the record.', 'In **HR access**, tapping each grant name (View HR, Edit, Personal data, Salary, Health) shows what it unlocks.'] },
    { h1: 'Row buttons' },
    { lista: [
      '**Pencil**: edits the record. For eSocial records, only while it is a **Draft**.',
      '**New validity** (copy icon): when something changes from a given month, create a new validity instead of deleting. History stays correct, as the government requires.',
      '**Trash**: moves the record to the trash right away, no password. It can be **recovered for 90 days**; then it is deleted for good.',
      'What **was already sent to eSocial** cannot go to the trash: set **Valid until** — the government corrects by ending validity.',
      '**Trash (90 days)**, at the corner of the panel: shows deleted items, days left and the **Recover** button.',
      'Tapping any item on the row without its own link (validity, CNPJ, status) opens the record itself: to edit, if it is a draft, or to see the details.',
    ] },
    { nota: '**Special cases** (cooperative, construction site, public body, exempt entity, port operator): tap **Show special cases** inside the form.' },
    { h1: 'Filling in and AI' },
    { lista: ['CNPJ and CPF get dots, slash and dash as you type (only digits are saved).', '**Axioma Intelligence — HR Specialist** at the bottom: "is HR set up? what is missing?", "how many departments and job titles?". The AI only reads what you can see. Type or tap the **microphone** to speak; **Listen** reads the answer aloud and **Live conversation** talks by voice, like with José.'] },
    { h1: 'Share and export' },
    { lista: ['**Share**: summary (records per tab) or detailed (the open tab).', '**PDF** and **Excel** at the top: the list of the open tab.'] },
    { h1: 'Who can see and change (HR access tab)' },
    { lista: [
      '**Owner, CEO, Partner and Admin**: full HR access. Only they see the **HR access** tab and grant access to others.',
      '**Everyone else** (Finance, Accountant, Reader, Operator): sees nothing in HR until granted.',
      'In **HR access**, tick for each person: **View HR**, **Edit**, **Personal data**, **Salary** and **Health**. Ticking any item also ticks "View HR"; unticking "View HR" removes everything.',
      'Nobody can grant themselves. Each grant is recorded with who granted it and when. A suspended person or one with expired access loses HR access immediately.',
    ] },
    { nota: 'Rules source: official eSocial S-1.3 layout (TN 07/2026, revision of 10/20/2026) and eSocial Tables 03, 04, 08, 10, 12 and 21. Se a internet falhar ao conferir o acesso, a tela avisa "Não foi possível conferir o seu acesso" com o botão **Tentar de novo** (não mostra um falso "sem acesso").' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '48 - RR HH Estructura de la Empresa.docx',
  titulo: 'Manual 48 — RR. HH. · Estructura de la Empresa',
  subtitulo: 'Empleador, sucursales, lotaciones, departamentos y cargos: la base del eSocial y de la nómina',
  info: ['Menú: Gestión → RR. HH. → Estructura  •  Manual de uso de Axioma AI.Tech  •  Versión 1.0 (noviembre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Es el primer paso de RR. HH. de Axioma. Aquí están los registros que **eSocial exige antes de cualquier admisión** (datos del empleador, sucursales y lotaciones) y la organización interna de la empresa (departamentos y cargos). Los empleados, la contratación y la nómina usan esta base.' },
    { p: 'Las reglas del gobierno ya están en Axioma: lo que quede fuera del diseño oficial de eSocial (versión S-1.3) se rechaza al instante, con el motivo. En esta versión, **Axioma prepara y el contador envía** al gobierno.' },
    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Gestión ▼** → **RR. HH.** → **Estructura** (barra en la parte superior).', 'Para registrar: haga clic en la parte (Empleador, Sucursales, Lotaciones, Departamentos o Cargos) y luego en el botón verde **+ Nuevo: <parte>**, arriba en la pantalla, junto a Exportar Excel. En Empleador también está **Completar con los datos de la Empresa**.', 'En la **Sucursal**, informe el **CNPJ del sindicato de la categoría**: eSocial lo exige en toda admisión y se completa para quien trabaja allí (las categorías diferenciadas reciben otro en su propio contrato). Revise el convenio colectivo o con el contador.', '**Rubricas de la rescisión (S-1010)**: botón al lado de las partes. **Registrar las rubricas estándar** crea las 15 rubricas que Axioma usa en la rescisión (saldo, aviso, 13º, vacaciones, art. 479/480, INSS e IR), con naturaleza (Tabla 03) e incidencias de INSS, IR y FGTS — en borrador, para que el contador las revise. **Preparar S-1010 y descargar** genera un archivo por rubrica; luego registre el recibo (Aceptado), Enviado o Rechazado.'] },
    { h1: 'Letrero' },
    { p: 'Franja azul marino debajo de las pestañas, que se desplaza sola: cuántos ítems tiene cada parte (Empleador, Sucursales, Lotaciones, Departamentos, Cargos). Pase el mouse para detenerla.' },
    { h1: 'Orden para completar' },
    { numerada: [
      'Pestaña **Empleador** → **Completar con los datos de la empresa**. Axioma trae la raíz del CNPJ (8 primeros números) y sugiere la clasificación tributaria por el régimen registrado. Confirme con el contador y toque **Guardar**.',
      'Pestaña **Sucursales** → botón Nuevo arriba. La matriz viene con el CNPJ completo y el CNAE de la empresa. Cada sucursal debe tener los mismos 8 primeros números del CNPJ del empleador; un CNPJ con otro inicio es **otra empresa** en Axioma.',
      'Pestaña **Lotaciones** → el tipo común es **01**. Elija el **FPAS** de la actividad. En Simples y MEI, el código de Terceros es **0000**.',
      'Pestaña **Departamentos** → cree las áreas. Un departamento puede estar dentro de otro y vincularse a un centro de costo y a una sucursal.',
      'Pestaña **Cargos** → nombre, **Ocupación en la CBO** (escriba el nombre — ej.: vendedor, conductor — o el código y elíjalo de la lista oficial del Ministerio de Trabajo, con 2.725 ocupaciones y 7.870 nombres alternativos; el código de 6 dígitos se completa solo y, si el nombre del cargo está vacío, también; no se aceptan códigos fuera de la lista), departamento, funciones, requisitos y **competencias** (técnicas o conductuales, obligatorias o deseables, nivel 1 a 5).',
    ] },
    { h1: 'Columnas de las tablas' },
    { lista: ['Tocar el **nombre de la columna** ordena la lista (de nuevo, invierte).', 'El **ⓘ** al lado abre una tarjeta que explica la columna y la regla oficial (eSocial, CLT, LGPD).', 'Valor subrayado lleva al destino: **CBO** abre la consulta oficial del Ministerio de Trabajo, **CNAE** la del IBGE, **Departamento** y **Está dentro de** abren el departamento, **Centro de costo** abre Centros de Costo, **Tipo/FPAS**, **Clasificación** y **Competencias** muestran el texto oficial o la lista; el nombre abre el registro.', 'En **Accesos de RR. HH.**, tocar el nombre de cada habilitación (Ver RR. HH., Editar, Datos personales, Salario, Salud) muestra lo que abre.'] },
    { h1: 'Botones de cada fila' },
    { lista: [
      '**Lápiz**: corrige el registro. En los registros del eSocial, solo mientras esté como **Borrador**.',
      '**Nueva vigencia** (ícono de copiar): cuando algo cambia desde un mes, cree una nueva vigencia en lugar de borrar. El historial queda correcto, como exige el gobierno.',
      '**Papelera**: envía el registro a la papelera en el momento, sin contraseña. Se puede **recuperar durante 90 días**; después se elimina definitivamente.',
      'Lo que **ya fue enviado al eSocial** no va a la papelera: informe **Vigente hasta** — en el gobierno se corrige por fin de vigencia.',
      '**Papelera (90 días)**, en la esquina del panel: muestra lo borrado, los días que faltan y el botón **Recuperar**.',
      'Tocar cualquier dato de la fila sin enlace propio (validez, CNPJ, situación) abre el propio registro: para editar, si es borrador, o para ver los detalles.',
    ] },
    { nota: '**Casos especiales** (cooperativa, obra, órgano público, entidad exenta, operador portuario): toque **Mostrar casos especiales** dentro del formulario. If the internet fails while checking access, the screen says "Could not check your HR access" with a **Try again** button (it never shows a false "no access").' },
    { h1: 'Llenado e IA' },
    { lista: ['CNPJ y CPF reciben puntos, barra y guion al escribir (solo se guardan los números).', '**Inteligencia Axioma — Especialista de RR. HH.** al final: "¿RR. HH. está configurado? ¿qué falta?", "¿cuántos departamentos y cargos?". La IA solo lee lo que usted puede ver. Escriba o toque el **micrófono** para hablar; **Escuchar** lee la respuesta en voz alta y **Conversación en vivo** conversa por voz, como con José.'] },
    { h1: 'Compartir y exportar' },
    { lista: ['**Compartir**: resumen (registros por pestaña) o detallado (la pestaña abierta).', '**PDF** y **Excel** arriba: la lista de la pestaña abierta.'] },
    { h1: 'Quién puede ver y cambiar (pestaña Accesos de RR. HH.)' },
    { lista: [
      '**Propietario, CEO, Socio y Admin**: acceso total a RR. HH. Solo ellos ven la pestaña **Accesos de RR. HH.** y habilitan a otras personas.',
      '**Todos los demás** (Finanzas, Contador, Lector, Operador): no ven nada de RR. HH. hasta ser habilitados.',
      'En **Accesos de RR. HH.**, marque para cada persona: **Ver RR. HH.**, **Editar**, **Datos personales**, **Salario** y **Salud**. Marcar un ítem ya marca "Ver RR. HH."; desmarcar "Ver RR. HH." quita todo.',
      'Nadie se habilita a sí mismo. Cada habilitación queda registrada con quién la otorgó y cuándo. Una persona suspendida o con acceso vencido pierde el acceso al instante.',
    ] },
    { nota: 'Fuente de las reglas: diseño oficial eSocial S-1.3 (NT 07/2026, revisión del 20/10/2026) y Tablas 03, 04, 08, 10, 12 y 21 del eSocial. Si internet falla al verificar el acceso, la pantalla avisa "No se pudo verificar su acceso" con el botón **Intentar de nuevo** (no muestra un falso "sin acceso").' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
