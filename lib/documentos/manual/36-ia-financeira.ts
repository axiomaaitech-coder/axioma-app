// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '36 - IA Premium - IA Financeira.docx',
  titulo: 'Manual 36 — IA Financeira',
  subtitulo: 'Diretor Financeiro Digital da Inteligência Axioma: análise inteligente com dados reais',
  info: ['Menu: IA Premium → IA Financeira  •  Manual de uso do Axioma AI.Tech  •  Versão 2.6 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A IA Financeira é o **diretor financeiro digital** da empresa. Junta todos os módulos em uma nota geral (Score 360°), aponta anomalias, projeta a receita, simula cenários, monta um plano de ação e conversa com você sobre as finanças, sempre com os dados reais.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **🤖 IA Premium ▼** → **IA Financeira**.'] },

    { h1: 'Como a inteligência funciona aqui' },
    { p: 'A tela combina duas camadas:' },
    { tabela: { colunas: ['Camada', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Cálculos do Axioma', 'Score 360°, Anomalias, Projeções, What-If, Plano de Ação, Resumo Executivo e Benchmark são **calculados por regras** a partir dos seus lançamentos (custos fixos só os vigentes). São instantâneos e sempre iguais para os mesmos dados.'],
      ['Chat CFO (inteligência artificial)', 'Usa o **motor de inteligência mais avançado do Axioma**. A cada pergunta, o Axioma monta um retrato atualizado da empresa (receitas, custos, caixa, dívidas, indicadores), envia junto com a pergunta e confere a resposta antes de mostrar. A resposta separa o que é **fato**, **estimativa**, **previsão** e **cenário**. Se a inteligência estiver fora, responde por regras e avisa.'],
    ] } },
    { nota: 'A inteligência só lê: nunca apaga nem altera dados. Toda chamada à inteligência artificial é registrada para auditoria, sem guardar o conteúdo das conversas no registro de auditoria.' },

    { p: '**Avisos em vez de resposta**: se o saldo de IA do mês acabou, a conversa mostra o aviso com o caminho da recarga (Config → Uso da IA) em vez de uma resposta pronta. Quem tem acesso de **operador de caixa** recebe o aviso de que a inteligência financeira é do dono, sócios e administradores. Se algum dado não puder ser lido nem depois das novas tentativas automáticas, aparece no topo o aviso **Alguns dados não puderam ser carregados** — o número nunca é tratado como zero.' },
    { h1: 'As abas' },
    { h2: '🏆 Score 360°' },
    { p: 'Nota geral da empresa com o gráfico de radar das **dimensões** (rentabilidade, liquidez, endividamento, eficiência, crescimento). Cada dimensão tem um card com os indicadores que a formam, a cor (Bom, Atenção, Crítico) e uma **sugestão**.' },
    { h2: '💬 Chat CFO' },
    { p: 'Escreva a pergunta em linguagem natural, por exemplo: "por que meu lucro caiu este mês?", "consigo contratar mais uma pessoa?", "qual custo devo cortar primeiro?". A resposta cita os números da empresa. O botão **🗑️ Limpar histórico** apaga as suas conversas (se não conseguir apagar no servidor, a tela avisa).' },
    { h2: '🔍 Anomalias' },
    { p: 'Alertas sobre indicadores fora do esperado, classificados como **Alerta** ou **Info**.' },
    { h2: '🔮 Projeções' },
    { p: 'Receita dos próximos 6 meses em três cenários: **Otimista**, **Realista** e **Pessimista**. Precisa de pelo menos 2 meses de receitas.' },
    { h2: '⚡ What-If' },
    { p: 'Ajuste quanto a **receita**, os **custos fixos**, os **custos variáveis** e o **preço** sobem ou descem e clique em **Simular**. Mostra **Lucro Antes/Depois**, a **Diferença** e a **Margem Antes/Depois**. Nada é gravado.' },
    { h2: '🎯 Plano de Ação' },
    { p: '**5 ações prioritárias** baseadas nos dados reais, cada uma com **impacto estimado** e **prioridade**.' },
    { h2: '📊 Resumo Executivo' },
    { p: 'Relatório do mês narrado em texto, pronto para enviar aos sócios.' },
    { h2: '📈 Benchmark' },
    { p: 'Compara seus indicadores com a **faixa do setor**.' },

    { h1: 'Compartilhar e exportar' },
    { p: '**📤 Compartilhar** abre o Centro de Compartilhamento (WhatsApp, e-mail, Telegram, **Copiar**) e o **PDF Relatório**. Os gráficos e tabelas saem no idioma escolhido.' },
    { h1: 'Dicas para perguntar melhor' },
    { lista: ['Seja específico: cite o período ("em setembro") ou o módulo ("nos custos fixos").', 'Peça comparação: "compare com o mês passado".', 'Peça decisão: "o que você faria no meu lugar?".', 'Quanto mais completos os lançamentos, melhores as respostas.'] },
    { nota: 'Os dados são lidos sem limite de linhas. Se alguma leitura falhar, a tela avisa em vez de dar nota ou plano com zero no lugar do dado que não veio.' },

    { h1: 'Ditado por voz' },
    { p: 'Quando o ditado estiver liberado para a sua empresa, aparece um botão de microfone na caixa de pergunta do chat. Toque e fale (ou segure e solte); o navegador pede permissão ao microfone só no primeiro uso. Para sozinho depois de um silêncio ou em 60 segundos, e o botão ✕ cancela. O texto entra no campo, junto do que você já tinha digitado, para você revisar — **nada é enviado nem gravado sozinho**. Cada ditado concluído usa 1 pergunta de IA comum do saldo; falha, silêncio ou áudio não entendido não consome. O áudio não é guardado pelo Axioma.' },
    { p: '**Ouvir a resposta:** quando a voz estiver liberada, aparece o botão **🔊 Ouvir** embaixo de cada resposta. Toque para ouvir a resposta em voz alta e em **Parar** para interromper; só uma resposta fala por vez e nada toca sozinho. A voz, masculina e em tom executivo, chama você pelo nome, lê apenas o que a inteligência do Axioma respondeu (sem símbolos nem emojis, com valores em reais por extenso) e, se algum valor não pôde ser conferido nos seus dados, avisa isso no fim. Se a voz do Axioma estiver fora do ar, a voz do próprio aparelho lê no lugar. Ouvir não consome perguntas do saldo e o áudio não é guardado. Para responder falando, toque em **Falar** — o microfone nunca abre sozinho.' },
    { p: '**Memória da IA:** quando você conta na conversa um dado da Empresa que não está no sistema (pró-labore, número de funcionários, regime, época de mais vendas, como prefere as respostas), a IA pergunta embaixo da resposta: **"Quer que eu lembre disso?"**. Só fica guardado se você tocar em **Lembrar**. Em toda resposta há também **"Está errado?"**: escreva o que é o certo e a IA passa a usar a correção e não repete o erro. No painel **Memória da IA**, abaixo do chat, você vê tudo o que ela aprendeu, pode **Ensinar algo** novo, **Editar** ou **Esquecer** (ela deixa de usar; nada é apagado do histórico). A memória é só desta Empresa e nunca é usada em outra.' },
    { p: '**Conversa ao vivo (em teste):** nas empresas liberadas para teste aparece o painel **Conversa ao vivo com a Inteligência Axioma — Diretor Financeiro Digital**. Toque em **Iniciar conversa ao vivo**, permita o microfone e fale naturalmente, sem apertar botão a cada frase; pode interromper falando por cima. Todo número vem da consulta aos dados da empresa, com os mesmos avisos do chat. **Você pode abrir outras telas (Custos Fixos, Contas a Pagar etc.) para conferir os números enquanto a conversa continua**: uma barra fixa embaixo da tela mostra o microfone aberto, o que está acontecendo, o botão **Voltar à conversa** e o **Encerrar**. Termina no **Encerrar**, depois de 60 segundos de silêncio ou em 10 minutos; recarregar a página também encerra. O áudio não é guardado e cada consulta conta 1 pergunta do saldo. A leitura pelo botão **Ouvir** também continua ao trocar de tela (com **Parar** na mesma barra).' },
    { p: '**Avisos no fim da resposta:** quando a pergunta é sobre dados da empresa (contas, vencidos, devedores, fornecedores, dívidas, estoque, custos, faturamento de um período), a inteligência consulta os registros na hora antes de responder. Se alguma consulta falhar, aparece no fim: "Observação: não foi possível consultar agora…" — esse valor não é zero, só não pôde ser lido. Se a consulta não pôde ser feita, ou se algum valor citado não foi encontrado nos dados, também aparece um aviso para conferir na tela. DRE de um mês, impostos de um período e folha de pagamento ainda não são consultados pela conversa: ela indica a tela certa.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '36 - AI Premium - Financial AI.docx',
  titulo: 'Manual 36 — Financial AI',
  subtitulo: 'Digital Finance Director of Axioma Intelligence: smart analysis with real data',
  info: ['Menu: AI Premium → Financial AI  •  Axioma AI.Tech user manual  •  Version 2.6 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Financial AI is the company’s **digital CFO**. It combines every module into an overall score (360° Score), points out anomalies, projects revenue, simulates scenarios, builds an action plan and talks with you about the finances, always with real data.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **🤖 AI Premium ▼** → **Financial AI**.'] },

    { h1: 'How the intelligence works here' },
    { p: 'The screen combines two layers:' },
    { tabela: { colunas: ['Layer', 'What it does'], larguras: [2600, 6426], linhas: [
      ['Axioma calculations', '360° Score, Anomalies, Projections, What-If, Action Plan, Executive Summary and Benchmark are **calculated by rules** from your entries (only active fixed costs). They are instant and always the same for the same data.'],
      ['CFO Chat (artificial intelligence)', 'Uses **Axioma’s most advanced intelligence engine**. For each question, Axioma builds an updated snapshot of the company (revenue, costs, cash, debts, indicators), sends it with the question and checks the answer before showing it. The answer separates **fact**, **estimate**, **forecast** and **scenario**. If the AI is down, it answers by rules and says so.'],
    ] } },
    { nota: 'The AI only reads: it never deletes or changes data. Every AI call is logged for auditing, without storing conversation content in the audit log.' },

    { p: '**Notices instead of an answer**: if this month’s AI balance has run out, the chat shows the notice with the top-up path (Settings → AI Usage) instead of a canned answer. Users with **cashier operator** access get a notice that the financial intelligence is for owners, partners and administrators. If some data cannot be read even after the automatic retries, the notice **Some data could not be loaded** appears at the top — the number is never treated as zero.' },
    { h1: 'The tabs' },
    { h2: '🏆 360° Score' },
    { p: 'The company’s overall score with a radar chart of the **dimensions** (profitability, liquidity, indebtedness, efficiency, growth). Each dimension has a card with its indicators, color (Good, Attention, Critical) and a **suggestion**.' },
    { h2: '💬 CFO Chat' },
    { p: 'Write your question in plain language, for example: "why did my profit drop this month?", "can I hire one more person?", "which cost should I cut first?". The answer cites the company’s numbers. **🗑️ Clear history** deletes your conversations (if it cannot delete on the server, the screen warns you).' },
    { h2: '🔍 Anomalies' },
    { p: 'Alerts about indicators outside what is expected, classified as **Alert** or **Info**.' },
    { h2: '🔮 Projections' },
    { p: 'Revenue for the next 6 months in three scenarios: **Optimistic**, **Realistic** and **Pessimistic**. Needs at least 2 months of revenue.' },
    { h2: '⚡ What-If' },
    { p: 'Adjust how much **revenue**, **fixed costs**, **variable costs** and **price** go up or down and click **Simulate**. Shows **Profit Before/After**, the **Difference** and **Margin Before/After**. Nothing is saved.' },
    { h2: '🎯 Action Plan' },
    { p: '**5 priority actions** based on real data, each with **estimated impact** and **priority**.' },
    { h2: '📊 Executive Summary' },
    { p: 'The month’s report narrated in text, ready to send to partners.' },
    { h2: '📈 Benchmark' },
    { p: 'Compares your indicators with the **industry range**.' },

    { h1: 'Share and export' },
    { p: '**📤 Share** opens the Sharing Center (WhatsApp, email, Telegram, **Copy**) and the **PDF Report**. Charts and tables come out in the chosen language.' },
    { h1: 'Tips for better questions' },
    { lista: ['Be specific: mention the period ("in September") or the module ("in fixed costs").', 'Ask for comparison: "compare with last month".', 'Ask for a decision: "what would you do in my place?".', 'The more complete your entries, the better the answers.'] },
    { nota: 'Data is read with no row limit. If any loading fails, the screen warns you instead of giving a score or plan with zero in place of the missing data.' },

    { h1: 'Voice dictation' },
    { p: 'When dictation is enabled for your company, a microphone button appears in the chat question box. Tap and speak (or hold and release); the browser asks for microphone permission only the first time. It stops by itself after a silence or at 60 seconds, and the ✕ button cancels. The text goes into the field, after what you had already typed, for you to review — **nothing is sent or saved on its own**. Each completed dictation uses 1 standard AI question from the balance; failures, silence or unintelligible audio do not count. Axioma does not keep the audio.' },
    { p: '**Listen to the answer:** when voice is enabled, a **🔊 Listen** button appears below each answer. Tap it to hear the answer out loud and **Stop** to interrupt; only one answer speaks at a time and nothing plays by itself. The voice, male and with an executive tone, addresses you by name and reads only what the Axioma intelligence answered (no symbols or emojis, with amounts spelled out) and, if any amount could not be checked against your data, says so at the end. If the Axioma voice is unavailable, your device voice reads instead. Listening does not use questions from your balance and the audio is not stored. To reply by voice, tap **Speak** — the microphone never opens by itself.' },
    { p: '**AI Memory:** when you mention in the conversation a Company detail that is not in the system (owner\'s salary, number of employees, tax regime, peak sales season, how you prefer answers), the AI asks below the answer: **"Should I remember this?"**. It is saved only if you tap **Remember**. Every answer also has **"Is this wrong?"**: write what is right and the AI starts using the correction and does not repeat the mistake. In the **AI Memory** panel, below the chat, you see everything it learned and can **Teach something** new, **Edit** or **Forget** (it stops using it; nothing is erased from history). The memory belongs only to this Company and is never used in another.' },
    { p: '**Live conversation (testing):** companies enabled for testing see the **Live conversation with Axioma Intelligence — Digital Finance Director** panel. Tap **Start live conversation**, allow the microphone and speak naturally, no button for each sentence; you can interrupt by talking over. Every number comes from looking up the company data, with the same notes as the chat. **You can open other screens (Fixed Costs, Accounts Payable etc.) to check the numbers while the conversation continues**: a fixed bar at the bottom shows the microphone on, what is happening, **Back to the conversation** and **End**. It ends with **End**, after 60 seconds of silence or at 10 minutes; reloading the page also ends it. Audio is not stored and each lookup uses 1 question from the balance. Reading with the **Listen** button also continues when you switch screens (with **Stop** on the same bar).' },
    { p: '**Notes at the end of the answer:** when the question is about company data (bills, overdue items, debtors, suppliers, debts, inventory, costs, revenue for a period), the intelligence looks up the records right then before answering. If a lookup fails, the end shows: "Note: it was not possible to check right now…" — that amount is not zero, it just could not be read. If the lookup could not be done, or an amount quoted was not found in the data, a note also asks you to check the screen. A month\'s income statement, taxes for a period and payroll are not looked up by the conversation yet: it points to the right screen.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '36 - IA Premium - IA Financiera.docx',
  titulo: 'Manual 36 — IA Financiera',
  subtitulo: 'Director Financiero Digital de la Inteligencia Axioma: análisis inteligente con datos reales',
  info: ['Menú: IA Premium → IA Financiera  •  Manual de uso de Axioma AI.Tech  •  Versión 2.6 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'La IA Financiera es el **director financiero digital** de la empresa. Junta todos los módulos en una nota general (Score 360°), señala anomalías, proyecta los ingresos, simula escenarios, arma un plan de acción y conversa con usted sobre las finanzas, siempre con los datos reales.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **🤖 IA Premium ▼** → **IA Financiera**.'] },

    { h1: 'Cómo funciona la inteligencia aquí' },
    { p: 'La pantalla combina dos capas:' },
    { tabela: { colunas: ['Capa', 'Qué hace'], larguras: [2600, 6426], linhas: [
      ['Cálculos de Axioma', 'Score 360°, Anomalías, Proyecciones, What-If, Plan de Acción, Resumen Ejecutivo y Benchmark se **calculan por reglas** a partir de sus registros (solo costos fijos vigentes). Son instantáneos y siempre iguales para los mismos datos.'],
      ['Chat CFO (inteligencia artificial)', 'Usa el **motor de inteligencia más avanzado de Axioma**. En cada pregunta, Axioma arma un retrato actualizado de la empresa (ingresos, costos, caja, deudas, indicadores), lo envía con la pregunta y revisa la respuesta antes de mostrarla. La respuesta separa lo que es **hecho**, **estimación**, **previsión** y **escenario**. Si la inteligencia está caída, responde por reglas y avisa.'],
    ] } },
    { nota: 'La inteligencia solo lee: nunca borra ni altera datos. Cada llamada a la inteligencia artificial queda registrada para auditoría, sin guardar el contenido de las conversaciones en el registro de auditoría.' },

    { p: '**Avisos en lugar de respuesta**: si el saldo de IA del mes se agotó, la conversación muestra el aviso con el camino de recarga (Config → Uso de la IA) en lugar de una respuesta predefinida. Quien tiene acceso de **operador de caja** recibe el aviso de que la inteligencia financiera es del dueño, socios y administradores. Si algún dato no se puede leer ni después de los reintentos automáticos, aparece arriba el aviso **Algunos datos no se pudieron cargar** — el número nunca se trata como cero.' },
    { h1: 'Las pestañas' },
    { h2: '🏆 Score 360°' },
    { p: 'Nota general de la empresa con el gráfico de radar de las **dimensiones** (rentabilidad, liquidez, endeudamiento, eficiencia, crecimiento). Cada dimensión tiene una tarjeta con sus indicadores, el color (Bueno, Atención, Crítico) y una **sugerencia**.' },
    { h2: '💬 Chat CFO' },
    { p: 'Escriba la pregunta en lenguaje natural, por ejemplo: "¿por qué cayó mi utilidad este mes?", "¿puedo contratar a una persona más?", "¿qué costo debo cortar primero?". La respuesta cita los números de la empresa. El botón **🗑️ Limpiar historial** borra sus conversaciones (si no logra borrar en el servidor, la pantalla avisa).' },
    { h2: '🔍 Anomalías' },
    { p: 'Alertas sobre indicadores fuera de lo esperado, clasificadas como **Alerta** o **Info**.' },
    { h2: '🔮 Proyecciones' },
    { p: 'Ingresos de los próximos 6 meses en tres escenarios: **Optimista**, **Realista** y **Pesimista**. Necesita al menos 2 meses de ingresos.' },
    { h2: '⚡ What-If' },
    { p: 'Ajuste cuánto suben o bajan los **ingresos**, los **costos fijos**, los **costos variables** y el **precio** y haga clic en **Simular**. Muestra **Utilidad Antes/Después**, la **Diferencia** y el **Margen Antes/Después**. Nada se guarda.' },
    { h2: '🎯 Plan de Acción' },
    { p: '**5 acciones prioritarias** basadas en los datos reales, cada una con **impacto estimado** y **prioridad**.' },
    { h2: '📊 Resumen Ejecutivo' },
    { p: 'Informe del mes narrado en texto, listo para enviar a los socios.' },
    { h2: '📈 Benchmark' },
    { p: 'Compara sus indicadores con el **rango del sector**.' },

    { h1: 'Compartir y exportar' },
    { p: '**📤 Compartir** abre el Centro de Compartir (WhatsApp, correo, Telegram, **Copiar**) y el **PDF Informe**. Los gráficos y tablas salen en el idioma elegido.' },
    { h1: 'Consejos para preguntar mejor' },
    { lista: ['Sea específico: cite el período ("en septiembre") o el módulo ("en los costos fijos").', 'Pida comparación: "compare con el mes pasado".', 'Pida una decisión: "¿qué haría usted en mi lugar?".', 'Cuanto más completos los registros, mejores las respuestas.'] },
    { nota: 'Los datos se leen sin límite de filas. Si alguna lectura falla, la pantalla avisa en lugar de dar nota o plan con cero en lugar del dato que no llegó.' },

    { h1: 'Dictado por voz' },
    { p: 'Cuando el dictado esté habilitado para su empresa, aparece un botón de micrófono en la caja de pregunta del chat. Toque y hable (o mantenga y suelte); el navegador pide permiso al micrófono solo la primera vez. Se detiene solo después de un silencio o a los 60 segundos, y el botón ✕ cancela. El texto entra en el campo, junto con lo que ya había escrito, para que lo revise — **nada se envía ni se guarda solo**. Cada dictado completado usa 1 pregunta de IA común del saldo; fallas, silencio o audio no entendido no consumen. Axioma no guarda el audio.' },
    { p: '**Escuchar la respuesta:** cuando la voz esté habilitada, aparece el botón **🔊 Escuchar** debajo de cada respuesta. Tóquelo para oír la respuesta en voz alta y **Detener** para interrumpir; solo una respuesta habla a la vez y nada suena solo. La voz, masculina y de tono ejecutivo, lo llama por su nombre y lee únicamente lo que respondió la inteligencia de Axioma (sin símbolos ni emojis, con los valores en palabras) y, si algún valor no pudo verificarse con sus datos, lo avisa al final. Si la voz de Axioma no está disponible, la voz del propio dispositivo lee en su lugar. Escuchar no consume preguntas del saldo y el audio no se guarda. Para responder hablando, toque **Hablar** — el micrófono nunca se abre solo.' },
    { p: '**Memoria de la IA:** cuando usted cuenta en la conversación un dato de la Empresa que no está en el sistema (retiro del dueño, número de empleados, régimen, época de más ventas, cómo prefiere las respuestas), la IA pregunta debajo de la respuesta: **"¿Quiere que recuerde esto?"**. Solo se guarda si toca **Recordar**. Cada respuesta también tiene **"¿Está mal?"**: escriba lo correcto y la IA pasa a usar la corrección y no repite el error. En el panel **Memoria de la IA**, debajo del chat, ve todo lo que aprendió y puede **Enseñar algo** nuevo, **Editar** u **Olvidar** (deja de usarlo; nada se borra del historial). La memoria es solo de esta Empresa y nunca se usa en otra.' },
    { p: '**Conversación en vivo (en prueba):** en las empresas habilitadas para prueba aparece el panel **Conversación en vivo con la Inteligencia Axioma — Director Financiero Digital**. Toque **Iniciar conversación en vivo**, permita el micrófono y hable con naturalidad, sin botón en cada frase; puede interrumpir hablando encima. Todo número viene de la consulta a los datos de la empresa, con los mismos avisos del chat. **Puede abrir otras pantallas (Costos Fijos, Cuentas por Pagar etc.) para verificar los números mientras la conversación continúa**: una barra fija abajo muestra el micrófono abierto, lo que está pasando, **Volver a la conversación** y **Terminar**. Termina con **Terminar**, tras 60 segundos de silencio o a los 10 minutos; recargar la página también la termina. El audio no se guarda y cada consulta consume 1 pregunta del saldo. La lectura con el botón **Escuchar** también continúa al cambiar de pantalla (con **Detener** en la misma barra).' },
    { p: '**Avisos al final de la respuesta:** cuando la pregunta es sobre datos de la empresa (cuentas, vencidos, deudores, proveedores, deudas, inventario, costos, facturación de un período), la inteligencia consulta los registros en ese momento antes de responder. Si alguna consulta falla, aparece al final: "Observación: no fue posible consultar ahora…" — ese valor no es cero, solo no pudo leerse. Si la consulta no pudo hacerse, o si algún valor citado no se encontró en los datos, también aparece un aviso para revisar la pantalla. El estado de resultados de un mes, los impuestos de un período y la nómina aún no se consultan en la conversación: indica la pantalla correcta.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
