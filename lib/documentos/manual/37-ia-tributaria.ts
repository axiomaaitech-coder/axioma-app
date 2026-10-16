// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '37 - IA Premium - IA Tributária.docx',
  titulo: 'Manual 37 — IA Tributária',
  subtitulo: 'Especialista Tributário da Inteligência Axioma: simulação, economia e compliance',
  info: ['Menu: IA Premium → IA Tributária  •  Manual de uso do Axioma AI.Tech  •  Versão 2.8 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A IA Tributária mostra **quanto a empresa paga de imposto**, **se está no regime mais barato**, **quanto dá para economizar** e **como a Reforma Tributária vai afetar o negócio**. Tem um chat para tirar dúvidas fiscais com os dados reais da empresa.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **🤖 IA Premium ▼** → **IA Tributária**.'] },

    { h1: 'Regime atual' },
    { p: 'No topo aparece o regime tributário da empresa, com o botão para editar. Para o cálculo do Lucro Presumido ficar exato, confirme a **atividade**: **Serviços** (presunção 32%), **Comércio/Indústria** (8%) ou **Revenda de combustível** (1,6%), e o **ISS do município** (2% a 5%; padrão 5%). Sem confirmação, o Axioma presume Serviços e avisa. Para MEI, o imposto é o DAS da categoria certa.' },

    { h1: 'Como a inteligência funciona aqui' },
    { tabela: { colunas: ['Camada', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Cálculos do Axioma', 'Score Fiscal, Simulador de Regime, Carga Tributária, Economia, Reforma e Diagnóstico são **calculados por regras** com as alíquotas vigentes e os seus dados reais.'],
      ['Chat Fiscal (inteligência artificial)', 'Usa o **motor de inteligência mais avançado do Axioma**, com um retrato fiscal da empresa (regime, faturamento, impostos calculados, obrigações) enviado junto com a pergunta e as regras oficiais vigentes. A resposta é conferida antes de aparecer. A inteligência só lê: nunca apaga nem altera dados.'],
    ] } },
    { alerta: 'Reforma Tributária — premissa: IBS e CBS criados pela Emenda Constitucional 132/2023 e regulados pela Lei Complementar 214/2025 (planalto.gov.br, conferidas em outubro de 2026); 2026 é ano de teste e as alíquotas finais ainda dependem de lei. O Axioma mostra a premissa e a data em cada cálculo. Regras em transição: podem mudar.' },

    { p: '**Avisos em vez de resposta**: se o saldo de IA do mês acabou, a conversa mostra o aviso com o caminho da recarga (Config → Uso da IA) em vez de uma resposta pronta. Quem tem acesso de **operador de caixa** recebe o aviso de que a inteligência financeira é do dono, sócios e administradores. Se algum dado não puder ser lido nem depois das novas tentativas automáticas, aparece no topo o aviso **Alguns dados não puderam ser carregados** — o número nunca é tratado como zero.' },
    { h1: 'As abas' },
    { h2: '🛡️ Score Fiscal' },
    { p: 'Nota de adequação fiscal e compliance da empresa, com o que está bom e o que melhorar.' },
    { h2: '💬 Chat Fiscal' },
    { p: 'Pergunte sobre impostos, regime, DAS, notas, obrigações. Exemplos: "vale a pena sair do Simples?", "quanto vou pagar de imposto este mês?". **🗑️ Limpar** apaga o histórico das suas conversas.' },
    { h2: '🏛️ Simulador de Regime' },
    { p: 'Compara **Simples Nacional**, **Lucro Presumido** e **Lucro Real** com os seus dados reais. O mais barato aparece primeiro com a marca **MAIS BARATO**; o atual é marcado como **Atual**; regimes que a empresa não pode usar aparecem como **Inelegível**. Para cada um: imposto por mês e por ano, **alíquota efetiva** e **economia por ano** em relação ao atual.' },
    { h2: '📊 Carga Tributária' },
    { p: 'Quanto da receita vai para impostos e a **composição** (quais impostos). Os gráficos saem no idioma escolhido.' },
    { h2: '💰 Economia' },
    { p: '**Economia mensal**, **Economia anual**, o **Regime ideal** e as **ações para economizar**.' },
    { h2: '🔔 Reforma 2026' },
    { p: 'Linha do tempo da transição para IBS/CBS (2026 a 2033) e os impactos no seu negócio, classificados como **Positivo**, **Neutro** ou **Atenção**, com a fonte de cada regra.' },
    { h2: '📋 Diagnóstico' },
    { p: 'Parecer tributário completo, gerado a partir de todos os dados fiscais da empresa.' },
    { h2: '📅 Calendário' },
    { p: 'Atalho para as obrigações, que são geridas em **Empresa → Compliance & Fiscal** e no Calendário de Obrigações do módulo Fiscal.' },

    { h1: 'Compartilhar e exportar' },
    { p: '**📤 Compartilhar** abre o Centro de Compartilhamento e o **PDF Relatório**, útil para levar ao contador.' },
    { nota: 'Os dados são lidos sem limite de linhas. Se alguma leitura falhar, a tela avisa em vez de simular regime ou economia com zero no lugar do dado.' },

    { h1: 'Ditado por voz' },
    { p: 'Quando o ditado estiver liberado para a sua empresa, aparece um botão de microfone na caixa de pergunta do chat. Toque e fale (ou segure e solte); o navegador pede permissão ao microfone só no primeiro uso. Para sozinho depois de um silêncio ou em 60 segundos, e o botão ✕ cancela. O texto entra no campo, junto do que você já tinha digitado, para você revisar — **nada é enviado nem gravado sozinho**. Cada ditado concluído usa 1 pergunta de IA comum do saldo; falha, silêncio ou áudio não entendido não consome. O áudio não é guardado pelo Axioma.' },
    { p: '**Ouvir a resposta:** quando a voz estiver liberada, aparece o botão **🔊 Ouvir** embaixo de cada resposta. Toque para ouvir a resposta em voz alta e em **Parar** para interromper; só uma resposta fala por vez e nada toca sozinho. A voz, masculina e em tom executivo, chama você pelo nome, lê apenas o que a inteligência do Axioma respondeu (sem símbolos nem emojis, com valores em reais por extenso) e, se algum valor não pôde ser conferido nos seus dados, avisa isso no fim. A voz é sempre a do José (a mesma da conversa ao vivo); se ela estiver indisponível, o botão avisa e você tenta de novo — não há voz robótica. Ouvir não consome perguntas do saldo e o áudio não é guardado. A voz é a mesma da conversa ao vivo; com a conversa ao vivo aberta, o Ouvir fica oculto para nunca falarem duas vozes ao mesmo tempo. Para responder falando, toque em **Falar** — o microfone nunca abre sozinho.' },
    { p: '**Memória da IA:** quando você conta na conversa um dado da Empresa que não está no sistema (pró-labore, número de funcionários, regime, época de mais vendas, como prefere as respostas), a IA pergunta embaixo da resposta: **"Quer que eu lembre disso?"**. Só fica guardado se você tocar em **Lembrar**. Em toda resposta há também **"Está errado?"**: escreva o que é o certo e a IA passa a usar a correção e não repete o erro. No painel **Memória da IA**, abaixo do chat, você vê tudo o que ela aprendeu, pode **Ensinar algo** novo, **Editar** ou **Esquecer** (ela deixa de usar; nada é apagado do histórico). A memória é só desta Empresa e nunca é usada em outra.' },
    { p: '**Conversa ao vivo (em teste):** nas empresas liberadas para teste aparece o painel **Conversa ao vivo com a Inteligência Axioma — Especialista Tributário**. Toque em **Iniciar conversa ao vivo**, permita o microfone e fale naturalmente, sem apertar botão a cada frase; pode interromper falando por cima. Todo número vem da consulta aos dados da empresa, com os mesmos avisos do chat. **Você pode abrir outras telas (Custos Fixos, Contas a Pagar etc.) para conferir os números enquanto a conversa continua**: uma barra fixa embaixo da tela mostra o microfone aberto, o que está acontecendo, o botão **Voltar à conversa** e o **Encerrar**. Termina no **Encerrar**, depois de 60 segundos de silêncio ou em 10 minutos; recarregar a página também encerra. O áudio não é guardado e cada consulta conta 1 pergunta do saldo. A leitura pelo botão **Ouvir** também continua ao trocar de tela (com **Parar** na mesma barra).' },
    { p: '**Avisos no fim da resposta:** quando a pergunta é sobre dados da empresa (contas, vencidos, devedores, fornecedores, dívidas, estoque, custos, faturamento de um período), a inteligência consulta os registros na hora antes de responder. Se alguma consulta falhar, aparece no fim: "Observação: não foi possível consultar agora…" — esse valor não é zero, só não pôde ser lido. Se a consulta não pôde ser feita, ou se algum valor citado não foi encontrado nos dados, também aparece um aviso para conferir na tela. DRE de um mês, impostos de um período e folha de pagamento ainda não são consultados pela conversa: ela indica a tela certa.' },
    { nota: '**Relatório depois da consulta:** peça "gere um relatório" (ou DRE, fluxo de caixa, contas a receber…) e a IA monta o relatório completo com os dados reais, avisa "seu relatório está feito e está aí embaixo, em PDF" e mostra o cartão com o botão grande **⬇ Baixar relatório em PDF** (os mesmos números da tela Relatórios). Vale também na conversa por voz.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '37 - AI Premium - Tax AI.docx',
  titulo: 'Manual 37 — Tax AI',
  subtitulo: 'Tax Specialist of Axioma Intelligence: simulation, savings and compliance',
  info: ['Menu: AI Premium → Tax AI  •  Axioma AI.Tech user manual  •  Version 2.8 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Tax AI shows **how much tax the company pays**, **whether it is in the cheapest regime**, **how much it can save** and **how the Tax Reform will affect the business**. It has a chat to answer tax questions with the company’s real data.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **🤖 AI Premium ▼** → **Tax AI**.'] },

    { h1: 'Current regime' },
    { p: 'At the top you see the company’s tax regime, with a button to edit it. For an exact Lucro Presumido calculation, confirm the **activity**: **Services** (32% presumption), **Trade/Industry** (8%) or **Fuel resale** (1.6%), and the **municipal ISS** (2% to 5%; default 5%). Without confirmation, Axioma assumes Services and warns you. For MEI, the tax is the DAS of the right category.' },

    { h1: 'How the intelligence works here' },
    { tabela: { colunas: ['Layer', 'What it does'], larguras: [2600, 6426], linhas: [
      ['Axioma calculations', 'Tax Score, Regime Simulator, Tax Burden, Savings, Reform and Diagnosis are **calculated by rules** with the current rates and your real data.'],
      ['Tax Chat (artificial intelligence)', 'Uses **Axioma’s most advanced intelligence engine**, with a tax snapshot of the company (regime, revenue, calculated taxes, obligations) sent with the question and the current official rules. The answer is checked before it appears. The AI only reads: it never deletes or changes data.'],
    ] } },
    { alerta: 'Tax Reform — assumption: IBS and CBS created by Constitutional Amendment 132/2023 and regulated by Complementary Law 214/2025 (planalto.gov.br, checked in October 2026); 2026 is a test year and final rates still depend on law. Axioma shows the assumption and date in each calculation. Rules in transition: they may change.' },

    { p: '**Notices instead of an answer**: if this month’s AI balance has run out, the chat shows the notice with the top-up path (Settings → AI Usage) instead of a canned answer. Users with **cashier operator** access get a notice that the financial intelligence is for owners, partners and administrators. If some data cannot be read even after the automatic retries, the notice **Some data could not be loaded** appears at the top — the number is never treated as zero.' },
    { h1: 'The tabs' },
    { h2: '🛡️ Tax Score' },
    { p: 'The company’s tax compliance score, with what is fine and what to improve.' },
    { h2: '💬 Tax Chat' },
    { p: 'Ask about taxes, regime, DAS, invoices, obligations. Examples: "is it worth leaving Simples?", "how much tax will I pay this month?". **🗑️ Clear** deletes your conversation history.' },
    { h2: '🏛️ Regime Simulator' },
    { p: 'Compares **Simples Nacional**, **Lucro Presumido** and **Lucro Real** with your real data. The cheapest appears first with the **CHEAPEST** tag; the current one is marked **Current**; regimes the company cannot use appear as **Ineligible**. For each: tax per month and per year, **effective rate** and **savings per year** compared with the current one.' },
    { h2: '📊 Tax Burden' },
    { p: 'How much of revenue goes to taxes and the **composition** (which taxes). Charts come out in the chosen language.' },
    { h2: '💰 Savings' },
    { p: '**Monthly savings**, **Annual savings**, the **Ideal regime** and the **actions to save**.' },
    { h2: '🔔 2026 Reform' },
    { p: 'Timeline of the transition to IBS/CBS (2026 to 2033) and the impacts on your business, classified as **Positive**, **Neutral** or **Attention**, with the source of each rule.' },
    { h2: '📋 Diagnosis' },
    { p: 'A complete tax opinion, generated from all of the company’s tax data.' },
    { h2: '📅 Calendar' },
    { p: 'Shortcut to obligations, which are managed in **Company → Compliance & Tax** and in the Obligations Calendar of the Tax module.' },

    { h1: 'Share and export' },
    { p: '**📤 Share** opens the Sharing Center and the **PDF Report**, useful to take to the accountant.' },
    { nota: 'Data is read with no row limit. If any loading fails, the screen warns you instead of simulating regime or savings with zero in place of the data.' },

    { h1: 'Voice dictation' },
    { p: 'When dictation is enabled for your company, a microphone button appears in the chat question box. Tap and speak (or hold and release); the browser asks for microphone permission only the first time. It stops by itself after a silence or at 60 seconds, and the ✕ button cancels. The text goes into the field, after what you had already typed, for you to review — **nothing is sent or saved on its own**. Each completed dictation uses 1 standard AI question from the balance; failures, silence or unintelligible audio do not count. Axioma does not keep the audio.' },
    { p: '**Listen to the answer:** when voice is enabled, a **🔊 Listen** button appears below each answer. Tap it to hear the answer out loud and **Stop** to interrupt; only one answer speaks at a time and nothing plays by itself. The voice, male and with an executive tone, addresses you by name and reads only what the Axioma intelligence answered (no symbols or emojis, with amounts spelled out) and, if any amount could not be checked against your data, says so at the end. The voice is always José\'s (the same as the live conversation); if it is unavailable, the button says so and you try again — there is no robotic voice. Listening does not use questions from your balance and the audio is not stored. The voice is the same as the live conversation; while a live conversation is open, Listen is hidden so two voices never speak at once. To reply by voice, tap **Speak** — the microphone never opens by itself.' },
    { p: '**AI Memory:** when you mention in the conversation a Company detail that is not in the system (owner\'s salary, number of employees, tax regime, peak sales season, how you prefer answers), the AI asks below the answer: **"Should I remember this?"**. It is saved only if you tap **Remember**. Every answer also has **"Is this wrong?"**: write what is right and the AI starts using the correction and does not repeat the mistake. In the **AI Memory** panel, below the chat, you see everything it learned and can **Teach something** new, **Edit** or **Forget** (it stops using it; nothing is erased from history). The memory belongs only to this Company and is never used in another.' },
    { p: '**Live conversation (testing):** companies enabled for testing see the **Live conversation with Axioma Intelligence — Tax Specialist** panel. Tap **Start live conversation**, allow the microphone and speak naturally, no button for each sentence; you can interrupt by talking over. Every number comes from looking up the company data, with the same notes as the chat. **You can open other screens (Fixed Costs, Accounts Payable etc.) to check the numbers while the conversation continues**: a fixed bar at the bottom shows the microphone on, what is happening, **Back to the conversation** and **End**. It ends with **End**, after 60 seconds of silence or at 10 minutes; reloading the page also ends it. Audio is not stored and each lookup uses 1 question from the balance. Reading with the **Listen** button also continues when you switch screens (with **Stop** on the same bar).' },
    { p: '**Notes at the end of the answer:** when the question is about company data (bills, overdue items, debtors, suppliers, debts, inventory, costs, revenue for a period), the intelligence looks up the records right then before answering. If a lookup fails, the end shows: "Note: it was not possible to check right now…" — that amount is not zero, it just could not be read. If the lookup could not be done, or an amount quoted was not found in the data, a note also asks you to check the screen. A month\'s income statement, taxes for a period and payroll are not looked up by the conversation yet: it points to the right screen.' },
    { nota: '**Report after the consultation:** ask "generate a report" (or income statement, cash flow, receivables…) and the AI builds the full report with the real data, says "your report is done and it is right below, in PDF" and shows the card with the big **⬇ Download report as PDF** button (the same numbers as the Reports screen). It also works in the voice conversation.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '37 - IA Premium - IA Tributaria.docx',
  titulo: 'Manual 37 — IA Tributaria',
  subtitulo: 'Especialista Tributario de la Inteligencia Axioma: simulación, ahorro y cumplimiento',
  info: ['Menú: IA Premium → IA Tributaria  •  Manual de uso de Axioma AI.Tech  •  Versión 2.8 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'La IA Tributaria muestra **cuánto paga de impuestos la empresa**, **si está en el régimen más barato**, **cuánto se puede ahorrar** y **cómo la Reforma Tributaria afectará al negocio**. Tiene un chat para resolver dudas fiscales con los datos reales de la empresa.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **🤖 IA Premium ▼** → **IA Tributaria**.'] },

    { h1: 'Régimen actual' },
    { p: 'Arriba aparece el régimen tributario de la empresa, con el botón para editarlo. Para que el cálculo del Lucro Presumido sea exacto, confirme la **actividad**: **Servicios** (presunción 32%), **Comercio/Industria** (8%) o **Reventa de combustible** (1,6%), y el **ISS del municipio** (2% a 5%; estándar 5%). Sin confirmación, Axioma presume Servicios y avisa. Para MEI, el impuesto es el DAS de la categoría correcta.' },

    { h1: 'Cómo funciona la inteligencia aquí' },
    { tabela: { colunas: ['Capa', 'Qué hace'], larguras: [2600, 6426], linhas: [
      ['Cálculos de Axioma', 'Score Fiscal, Simulador de Régimen, Carga Tributaria, Ahorro, Reforma y Diagnóstico se **calculan por reglas** con las alícuotas vigentes y sus datos reales.'],
      ['Chat Fiscal (inteligencia artificial)', 'Usa el **motor de inteligencia más avanzado de Axioma**, con un retrato fiscal de la empresa (régimen, facturación, impuestos calculados, obligaciones) enviado junto con la pregunta y las reglas oficiales vigentes. La respuesta se revisa antes de aparecer. La inteligencia solo lee: nunca borra ni altera datos.'],
    ] } },
    { alerta: 'Reforma Tributaria — premisa: IBS y CBS creados por la Enmienda Constitucional 132/2023 y regulados por la Ley Complementaria 214/2025 (planalto.gov.br, verificadas en octubre de 2026); 2026 es año de prueba y las alícuotas finales aún dependen de ley. Axioma muestra la premisa y la fecha en cada cálculo. Reglas en transición: pueden cambiar.' },

    { p: '**Avisos en lugar de respuesta**: si el saldo de IA del mes se agotó, la conversación muestra el aviso con el camino de recarga (Config → Uso de la IA) en lugar de una respuesta predefinida. Quien tiene acceso de **operador de caja** recibe el aviso de que la inteligencia financiera es del dueño, socios y administradores. Si algún dato no se puede leer ni después de los reintentos automáticos, aparece arriba el aviso **Algunos datos no se pudieron cargar** — el número nunca se trata como cero.' },
    { h1: 'Las pestañas' },
    { h2: '🛡️ Score Fiscal' },
    { p: 'Nota de adecuación fiscal y cumplimiento de la empresa, con lo que está bien y lo que mejorar.' },
    { h2: '💬 Chat Fiscal' },
    { p: 'Pregunte sobre impuestos, régimen, DAS, facturas, obligaciones. Ejemplos: "¿vale la pena salir del Simples?", "¿cuánto voy a pagar de impuestos este mes?". **🗑️ Limpiar** borra el historial de sus conversaciones.' },
    { h2: '🏛️ Simulador de Régimen' },
    { p: 'Compara **Simples Nacional**, **Lucro Presumido** y **Lucro Real** con sus datos reales. El más barato aparece primero con la marca **MÁS BARATO**; el actual se marca como **Actual**; los regímenes que la empresa no puede usar aparecen como **Inelegible**. Para cada uno: impuesto por mes y por año, **alícuota efectiva** y **ahorro por año** frente al actual.' },
    { h2: '📊 Carga Tributaria' },
    { p: 'Cuánto de los ingresos va a impuestos y la **composición** (qué impuestos). Los gráficos salen en el idioma elegido.' },
    { h2: '💰 Ahorro' },
    { p: '**Ahorro mensual**, **Ahorro anual**, el **Régimen ideal** y las **acciones para ahorrar**.' },
    { h2: '🔔 Reforma 2026' },
    { p: 'Línea de tiempo de la transición a IBS/CBS (2026 a 2033) y los impactos en su negocio, clasificados como **Positivo**, **Neutro** o **Atención**, con la fuente de cada regla.' },
    { h2: '📋 Diagnóstico' },
    { p: 'Parecer tributario completo, generado a partir de todos los datos fiscales de la empresa.' },
    { h2: '📅 Calendario' },
    { p: 'Atajo a las obligaciones, que se gestionan en **Empresa → Compliance y Fiscal** y en el Calendario de Obligaciones del módulo Fiscal.' },

    { h1: 'Compartir y exportar' },
    { p: '**📤 Compartir** abre el Centro de Compartir y el **PDF Informe**, útil para llevar al contador.' },
    { nota: 'Los datos se leen sin límite de filas. Si alguna lectura falla, la pantalla avisa en lugar de simular régimen o ahorro con cero en lugar del dato.' },

    { h1: 'Dictado por voz' },
    { p: 'Cuando el dictado esté habilitado para su empresa, aparece un botón de micrófono en la caja de pregunta del chat. Toque y hable (o mantenga y suelte); el navegador pide permiso al micrófono solo la primera vez. Se detiene solo después de un silencio o a los 60 segundos, y el botón ✕ cancela. El texto entra en el campo, junto con lo que ya había escrito, para que lo revise — **nada se envía ni se guarda solo**. Cada dictado completado usa 1 pregunta de IA común del saldo; fallas, silencio o audio no entendido no consumen. Axioma no guarda el audio.' },
    { p: '**Escuchar la respuesta:** cuando la voz esté habilitada, aparece el botón **🔊 Escuchar** debajo de cada respuesta. Tóquelo para oír la respuesta en voz alta y **Detener** para interrumpir; solo una respuesta habla a la vez y nada suena solo. La voz, masculina y de tono ejecutivo, lo llama por su nombre y lee únicamente lo que respondió la inteligencia de Axioma (sin símbolos ni emojis, con los valores en palabras) y, si algún valor no pudo verificarse con sus datos, lo avisa al final. La voz es siempre la de José (la misma de la conversación en vivo); si no está disponible, el botón avisa y usted intenta de nuevo — no hay voz robótica. Escuchar no consume preguntas del saldo y el audio no se guarda. La voz es la misma de la conversación en vivo; con la conversación en vivo abierta, Escuchar se oculta para que nunca hablen dos voces a la vez. Para responder hablando, toque **Hablar** — el micrófono nunca se abre solo.' },
    { p: '**Memoria de la IA:** cuando usted cuenta en la conversación un dato de la Empresa que no está en el sistema (retiro del dueño, número de empleados, régimen, época de más ventas, cómo prefiere las respuestas), la IA pregunta debajo de la respuesta: **"¿Quiere que recuerde esto?"**. Solo se guarda si toca **Recordar**. Cada respuesta también tiene **"¿Está mal?"**: escriba lo correcto y la IA pasa a usar la corrección y no repite el error. En el panel **Memoria de la IA**, debajo del chat, ve todo lo que aprendió y puede **Enseñar algo** nuevo, **Editar** u **Olvidar** (deja de usarlo; nada se borra del historial). La memoria es solo de esta Empresa y nunca se usa en otra.' },
    { p: '**Conversación en vivo (en prueba):** en las empresas habilitadas para prueba aparece el panel **Conversación en vivo con la Inteligencia Axioma — Especialista Tributario**. Toque **Iniciar conversación en vivo**, permita el micrófono y hable con naturalidad, sin botón en cada frase; puede interrumpir hablando encima. Todo número viene de la consulta a los datos de la empresa, con los mismos avisos del chat. **Puede abrir otras pantallas (Costos Fijos, Cuentas por Pagar etc.) para verificar los números mientras la conversación continúa**: una barra fija abajo muestra el micrófono abierto, lo que está pasando, **Volver a la conversación** y **Terminar**. Termina con **Terminar**, tras 60 segundos de silencio o a los 10 minutos; recargar la página también la termina. El audio no se guarda y cada consulta consume 1 pregunta del saldo. La lectura con el botón **Escuchar** también continúa al cambiar de pantalla (con **Detener** en la misma barra).' },
    { p: '**Avisos al final de la respuesta:** cuando la pregunta es sobre datos de la empresa (cuentas, vencidos, deudores, proveedores, deudas, inventario, costos, facturación de un período), la inteligencia consulta los registros en ese momento antes de responder. Si alguna consulta falla, aparece al final: "Observación: no fue posible consultar ahora…" — ese valor no es cero, solo no pudo leerse. Si la consulta no pudo hacerse, o si algún valor citado no se encontró en los datos, también aparece un aviso para revisar la pantalla. El estado de resultados de un mes, los impuestos de un período y la nómina aún no se consultan en la conversación: indica la pantalla correcta.' },
    { nota: '**Informe después de la consulta:** pida "genere un informe" (o estado de resultados, flujo de caja, cuentas por cobrar…) y la IA arma el informe completo con los datos reales, avisa "su informe está hecho y está justo abajo, en PDF" y muestra la tarjeta con el botón grande **⬇ Descargar informe en PDF** (los mismos números de la pantalla Informes). También funciona en la conversación por voz.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
