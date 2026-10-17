// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '08 - MEI - IA MEI Advisor.docx',
  titulo: 'Manual 08 — IA MEI Advisor',
  subtitulo: 'Seu consultor financeiro e fiscal MEI, com os seus números reais',
  info: ['Menu: MEI → IA MEI Advisor  •  Manual de uso do Axioma AI.Tech  •  Versão 2.8 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Um chat que **conhece os dados reais do seu MEI** (faturamento, teto, DAS, despesas e configuração) e responde, em linguagem simples, perguntas sobre DAS, limite anual, imposto de renda, Reforma Tributária e preço.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **MEI ▼** → **IA MEI Advisor**.', 'Painel MEI → **Acesso Rápido** → **IA MEI Advisor**.'] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera um PDF com os números do topo e a conversa.', 'O arquivo é baixado.'],
      ['**Compartilhar**', 'Abre a Central de Compartilhamento com um resumo.', 'WhatsApp, e-mail, copiar ou baixar o PDF.'],
      ['**Escuro / Tema Claro**', 'Troca as cores.', 'Vale para todo o Axioma.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Letreiro e cartões' },
    { p: 'O letreiro e os três cartões mostram os números que a IA está usando: **Faturamento do ano**, **Limite usado** (em %) e **Categoria MEI**. Assim você sabe em que dados a resposta se baseia.' },
    { h2: 'Chat' },
    { tabela: { colunas: ['Elemento', 'O que faz', 'O que acontece depois'], larguras: [2600, 3400, 3026], linhas: [
      ['Mensagem de boas-vindas', 'Explica o que dá para perguntar.', 'Some quando a primeira pergunta é enviada.'],
      ['Campo **Pergunte sobre seu MEI...**', 'Onde você escreve a pergunta.', 'Tecla Enter também envia.'],
      ['**Enviar**', 'Manda a pergunta (só fica liberado com texto no campo).', 'Aparecem três pontinhos enquanto a IA pensa; a resposta entra na conversa. A sua pergunta fica em azul-marinho e a resposta em caixa branca.'],
      ['Perguntas prontas', '**Vou estourar o limite?**, **Preciso declarar IRPF?**, **MEI ou ME em 2027?**, **Como reduzir meus impostos?**, **Qual meu DAS correto?**', 'O clique **preenche o campo**; confira e clique em **Enviar**.'],
    ] } },
    { nota: 'Em pergunta sobre imposto, limite ou Reforma, a IA usa a lista de **Regras Oficiais Vigentes** do Axioma, com a fonte e a data da última conferência. Notícia ou projeto de lei nunca é tratado como lei. Se a IA não puder responder no momento, a tela responde por regras — você não fica sem resposta.' },
    { p: 'O Cofre e a reserva de IR que o Advisor cita usam a mesma conta do Painel MEI e do Manual 09: lucro (receita − despesas) acima da parte isenta, tabela de 2026.' },

    { h1: 'Exemplos de perguntas' },
    { lista: ['"Quanto ainda posso faturar este ano sem estourar o teto?"', '"Meu DAS está em dia?"', '"Preciso declarar imposto de renda?"', '"O que muda para mim com a Reforma Tributária?"', '"Meu preço está cobrindo os custos?"'] },
    { h1: 'Boas práticas' },
    { lista: ['Mantenha o faturamento e as despesas lançados: a IA responde melhor com dados completos.', 'Uma pergunta por vez, de forma direta.', 'A resposta orienta; a decisão é sempre sua.'] },

    { h1: 'Ditado por voz' },
    { p: 'Quando o ditado estiver liberado para a sua empresa, aparece um botão de microfone na caixa de pergunta do Advisor. Toque e fale (ou segure e solte); o navegador pede permissão ao microfone só no primeiro uso. Para sozinho depois de um silêncio ou em 60 segundos, e o botão ✕ cancela. O texto entra no campo, junto do que você já tinha digitado, para você revisar — **nada é enviado nem gravado sozinho**. Cada ditado concluído usa 1 pergunta de IA comum do saldo; falha, silêncio ou áudio não entendido não consome. O áudio não é guardado pelo Axioma.' },
    { p: '**Ouvir a resposta:** quando a voz estiver liberada, aparece o botão **🔊 Ouvir** embaixo de cada resposta. Toque para ouvir a resposta em voz alta e em **Parar** para interromper; só uma resposta fala por vez e nada toca sozinho. A voz, masculina e em tom executivo, chama você pelo nome, lê apenas o que a inteligência do Axioma respondeu (sem símbolos nem emojis, com valores em reais por extenso) e, se algum valor não pôde ser conferido nos seus dados, avisa isso no fim. A voz é sempre a do José (a mesma da conversa ao vivo); se ela estiver indisponível, o botão avisa e você tenta de novo — não há voz robótica. Ouvir não consome perguntas do saldo e o áudio não é guardado. A voz é a mesma da conversa ao vivo; com a conversa ao vivo aberta, o Ouvir fica oculto para nunca falarem duas vozes ao mesmo tempo. Para responder falando, toque em **Falar** — o microfone nunca abre sozinho.' },
    { p: '**Memória da IA:** quando você conta na conversa um dado da Empresa que não está no sistema (pró-labore, número de funcionários, regime, época de mais vendas, como prefere as respostas), a IA pergunta embaixo da resposta: **"Quer que eu lembre disso?"**. Só fica guardado se você tocar em **Lembrar**. Em toda resposta há também **"Está errado?"**: escreva o que é o certo e a IA passa a usar a correção e não repete o erro. No painel **Memória da IA**, abaixo do chat, você vê tudo o que ela aprendeu, pode **Ensinar algo** novo, **Editar** ou **Esquecer** (ela deixa de usar; nada é apagado do histórico). A memória é só desta Empresa e nunca é usada em outra.' },
    { p: '**Conversa ao vivo (em teste):** nas empresas liberadas para teste aparece o painel **Conversa ao vivo com a Inteligência Axioma — Consultor do MEI**. Toque em **Iniciar conversa ao vivo**, permita o microfone e fale naturalmente, sem apertar botão a cada frase; pode interromper falando por cima. Todo número vem da consulta aos dados da empresa, com os mesmos avisos do chat. **Você pode abrir outras telas (Custos Fixos, Contas a Pagar etc.) para conferir os números enquanto a conversa continua**: uma barra fixa embaixo da tela mostra o microfone aberto, o que está acontecendo, o botão **Voltar à conversa** e o **Encerrar**. Termina no **Encerrar**, depois de 60 segundos de silêncio ou em 10 minutos; recarregar a página também encerra. O áudio não é guardado e cada consulta conta 1 pergunta do saldo. A leitura pelo botão **Ouvir** também continua ao trocar de tela (com **Parar** na mesma barra).' },
    { p: '**Avisos no fim da resposta:** quando a pergunta é sobre dados da empresa (contas, vencidos, devedores, fornecedores, dívidas, estoque, custos, faturamento de um período), a inteligência consulta os registros na hora antes de responder. Se alguma consulta falhar, aparece no fim: "Observação: não foi possível consultar agora…" — esse valor não é zero, só não pôde ser lido. Se a consulta não pôde ser feita, ou se algum valor citado não foi encontrado nos dados, também aparece um aviso para conferir na tela. DRE de um mês, impostos de um período e folha de pagamento ainda não são consultados pela conversa: ela indica a tela certa.' },
    { nota: '**Relatório depois da consulta:** peça "gere um relatório" (ou DRE, fluxo de caixa, contas a receber…) e a IA monta o relatório completo com os dados reais, avisa "seu relatório está feito e está aí embaixo, em PDF" e mostra o cartão com o botão grande **⬇ Baixar relatório em PDF** (os mesmos números da tela Relatórios). Vale também na conversa por voz.' },
    { nota: '**Conversas salvas:** a conversa e os relatórios gerados ficam guardados mesmo se você sair do módulo. Use **＋ Nova conversa** para começar outra e **🗂 Conversas salvas** para reabrir as anteriores ou apagar (🗑, com confirmação). No cartão do relatório há **✏️ Anotar** para escrever uma observação e **🗑 Apagar** para tirá-lo da conversa. Cada conversa é só sua: outras pessoas da Empresa não a veem, e nenhuma outra Empresa tem acesso. Nada é apagado sozinho.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '08 - MEI - AI MEI Advisor.docx',
  titulo: 'Manual 08 — AI MEI Advisor',
  subtitulo: 'Your MEI financial and tax advisor, with your real numbers',
  info: ['Menu: MEI → AI MEI Advisor  •  Axioma AI.Tech user manual  •  Version 2.8 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'A chat that **knows your MEI\'s real data** (revenue, cap, DAS, expenses and settings) and answers, in plain language, questions about the DAS, the annual limit, income tax, the Tax Reform and pricing.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **MEI ▼** → **AI MEI Advisor**.', 'MEI Dashboard → **Quick Access** → **AI MEI Advisor**.'] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates a PDF with the top numbers and the conversation.', 'The file is downloaded.'],
      ['**Share**', 'Opens the Sharing Center with a summary.', 'WhatsApp, email, copy or download the PDF.'],
      ['**Dark / Light Theme**', 'Switches the colors.', 'Applies to all of Axioma.'],
    ] } },

    { h1: 'Parts of the screen' },
    { h2: 'Ticker and cards' },
    { p: 'The ticker and the three cards show the numbers the AI is using: **Revenue for the year**, **Limit used** (in %) and **MEI Category**. So you know which data each answer is based on.' },
    { h2: 'Chat' },
    { tabela: { colunas: ['Element', 'What it does', 'What happens next'], larguras: [2600, 3400, 3026], linhas: [
      ['Welcome message', 'Explains what you can ask.', 'Disappears when the first question is sent.'],
      ['**Ask about your MEI...** field', 'Where you type the question.', 'The Enter key also sends.'],
      ['**Send**', 'Sends the question (enabled only with text in the field).', 'Three dots appear while the AI thinks; the answer joins the conversation. Your question shows in navy blue and the answer in a white box.'],
      ['Ready questions', '**Will I exceed the limit?**, **Do I need to declare IRPF?**, **MEI or ME in 2027?**, **How to reduce my taxes?**, **What is my correct DAS?**', 'The click **fills in the field**; check it and click **Send**.'],
    ] } },
    { nota: 'For questions about tax, the limit or the Reform, the AI uses Axioma\'s **Official Rules in Force** list, with the source and the date of the last check. A news story or a bill is never treated as law. If the AI cannot answer at the moment, the screen answers with rules — you are never left without an answer.' },
    { p: 'The Vault and the income tax reserve the Advisor cites use the same math as the MEI Dashboard and Manual 09: profit (revenue − expenses) above the exempt part, 2026 table.' },

    { h1: 'Example questions' },
    { lista: ['"How much more can I bill this year without exceeding the cap?"', '"Is my DAS up to date?"', '"Do I need to file income tax?"', '"What does the Tax Reform change for me?"', '"Is my price covering my costs?"'] },
    { h1: 'Good practices' },
    { lista: ['Keep revenue and expenses recorded: the AI answers better with complete data.', 'One question at a time, straight to the point.', 'The answer guides you; the decision is always yours.'] },

    { h1: 'Voice dictation' },
    { p: 'When dictation is enabled for your company, a microphone button appears in the Advisor question box. Tap and speak (or hold and release); the browser asks for microphone permission only the first time. It stops by itself after a silence or at 60 seconds, and the ✕ button cancels. The text goes into the field, after what you had already typed, for you to review — **nothing is sent or saved on its own**. Each completed dictation uses 1 standard AI question from the balance; failures, silence or unintelligible audio do not count. Axioma does not keep the audio.' },
    { p: '**Listen to the answer:** when voice is enabled, a **🔊 Listen** button appears below each answer. Tap it to hear the answer out loud and **Stop** to interrupt; only one answer speaks at a time and nothing plays by itself. The voice, male and with an executive tone, addresses you by name and reads only what the Axioma intelligence answered (no symbols or emojis, with amounts spelled out) and, if any amount could not be checked against your data, says so at the end. The voice is always José\'s (the same as the live conversation); if it is unavailable, the button says so and you try again — there is no robotic voice. Listening does not use questions from your balance and the audio is not stored. The voice is the same as the live conversation; while a live conversation is open, Listen is hidden so two voices never speak at once. To reply by voice, tap **Speak** — the microphone never opens by itself.' },
    { p: '**AI Memory:** when you mention in the conversation a Company detail that is not in the system (owner\'s salary, number of employees, tax regime, peak sales season, how you prefer answers), the AI asks below the answer: **"Should I remember this?"**. It is saved only if you tap **Remember**. Every answer also has **"Is this wrong?"**: write what is right and the AI starts using the correction and does not repeat the mistake. In the **AI Memory** panel, below the chat, you see everything it learned and can **Teach something** new, **Edit** or **Forget** (it stops using it; nothing is erased from history). The memory belongs only to this Company and is never used in another.' },
    { p: '**Live conversation (testing):** companies enabled for testing see the **Live conversation with Axioma Intelligence — MEI Advisor** panel. Tap **Start live conversation**, allow the microphone and speak naturally, no button for each sentence; you can interrupt by talking over. Every number comes from looking up the company data, with the same notes as the chat. **You can open other screens (Fixed Costs, Accounts Payable etc.) to check the numbers while the conversation continues**: a fixed bar at the bottom shows the microphone on, what is happening, **Back to the conversation** and **End**. It ends with **End**, after 60 seconds of silence or at 10 minutes; reloading the page also ends it. Audio is not stored and each lookup uses 1 question from the balance. Reading with the **Listen** button also continues when you switch screens (with **Stop** on the same bar).' },
    { p: '**Notes at the end of the answer:** when the question is about company data (bills, overdue items, debtors, suppliers, debts, inventory, costs, revenue for a period), the intelligence looks up the records right then before answering. If a lookup fails, the end shows: "Note: it was not possible to check right now…" — that amount is not zero, it just could not be read. If the lookup could not be done, or an amount quoted was not found in the data, a note also asks you to check the screen. A month\'s income statement, taxes for a period and payroll are not looked up by the conversation yet: it points to the right screen.' },
    { nota: '**Report after the consultation:** ask "generate a report" (or income statement, cash flow, receivables…) and the AI builds the full report with the real data, says "your report is done and it is right below, in PDF" and shows the card with the big **⬇ Download report as PDF** button (the same numbers as the Reports screen). It also works in the voice conversation.' },
    { nota: '**Saved conversations:** the conversation and the generated reports stay saved even if you leave the module. Use **＋ New conversation** to start another one and **🗂 Saved conversations** to reopen previous ones or delete them (🗑, with confirmation). On the report card there is **✏️ Add note** to write a remark and **🗑 Delete** to remove it from the conversation. Each conversation is yours only: other people in the Company cannot see it, and no other Company has access. Nothing is deleted automatically.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '08 - MEI - IA MEI Advisor.docx',
  titulo: 'Manual 08 — IA MEI Advisor',
  subtitulo: 'Su consultor financiero y fiscal MEI, con sus números reales',
  info: ['Menú: MEI → IA Advisor MEI  •  Manual de uso de Axioma AI.Tech  •  Versión 2.8 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Un chat que **conoce los datos reales de su MEI** (facturación, tope, DAS, gastos y configuración) y responde, en lenguaje simple, preguntas sobre el DAS, el límite anual, el impuesto a la renta, la Reforma Tributaria y los precios.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **MEI ▼** → **IA Advisor MEI**.', 'Panel MEI → **Acceso Rápido** → **IA MEI Advisor**.'] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera un PDF con los números de arriba y la conversación.', 'El archivo se descarga.'],
      ['**Compartir**', 'Abre el Centro de Compartir con un resumen.', 'WhatsApp, correo, copiar o descargar el PDF.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores.', 'Vale para todo Axioma.'],
    ] } },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Marquesina y tarjetas' },
    { p: 'La marquesina y las tres tarjetas muestran los números que usa la IA: **Facturación del año**, **Límite usado** (en %) y **Categoría MEI**. Así sabe en qué datos se basa cada respuesta.' },
    { h2: 'Chat' },
    { tabela: { colunas: ['Elemento', 'Qué hace', 'Qué pasa después'], larguras: [2600, 3400, 3026], linhas: [
      ['Mensaje de bienvenida', 'Explica qué se puede preguntar.', 'Desaparece al enviar la primera pregunta.'],
      ['Campo **Pregunte sobre su MEI...**', 'Donde escribe la pregunta.', 'La tecla Enter también envía.'],
      ['**Enviar**', 'Envía la pregunta (se habilita solo con texto en el campo).', 'Aparecen tres puntitos mientras la IA piensa; la respuesta entra en la conversación. Su pregunta aparece en azul marino y la respuesta en caja blanca.'],
      ['Preguntas listas', '**¿Superaré el límite?**, **¿Necesito declarar IRPF?**, **¿MEI o ME en 2027?**, **¿Cómo reducir mis impuestos?**, **¿Cuál es mi DAS correcto?**', 'El clic **completa el campo**; revíselo y haga clic en **Enviar**.'],
    ] } },
    { nota: 'En preguntas sobre impuesto, límite o Reforma, la IA usa la lista de **Reglas Oficiales Vigentes** de Axioma, con la fuente y la fecha de la última verificación. Una noticia o un proyecto de ley nunca se trata como ley. Si la IA no puede responder en el momento, la pantalla responde por reglas — usted nunca se queda sin respuesta.' },
    { p: 'La Caja y la reserva del impuesto a la renta que cita el Advisor usan la misma cuenta del Panel MEI y del Manual 09: ganancia (ingresos − gastos) por encima de la parte exenta, tabla de 2026.' },

    { h1: 'Ejemplos de preguntas' },
    { lista: ['"¿Cuánto más puedo facturar este año sin superar el tope?"', '"¿Mi DAS está al día?"', '"¿Necesito declarar impuesto a la renta?"', '"¿Qué cambia para mí con la Reforma Tributaria?"', '"¿Mi precio cubre los costos?"'] },
    { h1: 'Buenas prácticas' },
    { lista: ['Mantenga la facturación y los gastos registrados: la IA responde mejor con datos completos.', 'Una pregunta a la vez, directa.', 'La respuesta orienta; la decisión siempre es suya.'] },

    { h1: 'Dictado por voz' },
    { p: 'Cuando el dictado esté habilitado para su empresa, aparece un botón de micrófono en la caja de pregunta del Advisor. Toque y hable (o mantenga y suelte); el navegador pide permiso al micrófono solo la primera vez. Se detiene solo después de un silencio o a los 60 segundos, y el botón ✕ cancela. El texto entra en el campo, junto con lo que ya había escrito, para que lo revise — **nada se envía ni se guarda solo**. Cada dictado completado usa 1 pregunta de IA común del saldo; fallas, silencio o audio no entendido no consumen. Axioma no guarda el audio.' },
    { p: '**Escuchar la respuesta:** cuando la voz esté habilitada, aparece el botón **🔊 Escuchar** debajo de cada respuesta. Tóquelo para oír la respuesta en voz alta y **Detener** para interrumpir; solo una respuesta habla a la vez y nada suena solo. La voz, masculina y de tono ejecutivo, lo llama por su nombre y lee únicamente lo que respondió la inteligencia de Axioma (sin símbolos ni emojis, con los valores en palabras) y, si algún valor no pudo verificarse con sus datos, lo avisa al final. La voz es siempre la de José (la misma de la conversación en vivo); si no está disponible, el botón avisa y usted intenta de nuevo — no hay voz robótica. Escuchar no consume preguntas del saldo y el audio no se guarda. La voz es la misma de la conversación en vivo; con la conversación en vivo abierta, Escuchar se oculta para que nunca hablen dos voces a la vez. Para responder hablando, toque **Hablar** — el micrófono nunca se abre solo.' },
    { p: '**Memoria de la IA:** cuando usted cuenta en la conversación un dato de la Empresa que no está en el sistema (retiro del dueño, número de empleados, régimen, época de más ventas, cómo prefiere las respuestas), la IA pregunta debajo de la respuesta: **"¿Quiere que recuerde esto?"**. Solo se guarda si toca **Recordar**. Cada respuesta también tiene **"¿Está mal?"**: escriba lo correcto y la IA pasa a usar la corrección y no repite el error. En el panel **Memoria de la IA**, debajo del chat, ve todo lo que aprendió y puede **Enseñar algo** nuevo, **Editar** u **Olvidar** (deja de usarlo; nada se borra del historial). La memoria es solo de esta Empresa y nunca se usa en otra.' },
    { p: '**Conversación en vivo (en prueba):** en las empresas habilitadas para prueba aparece el panel **Conversación en vivo con la Inteligencia Axioma — Consultor del MEI**. Toque **Iniciar conversación en vivo**, permita el micrófono y hable con naturalidad, sin botón en cada frase; puede interrumpir hablando encima. Todo número viene de la consulta a los datos de la empresa, con los mismos avisos del chat. **Puede abrir otras pantallas (Costos Fijos, Cuentas por Pagar etc.) para verificar los números mientras la conversación continúa**: una barra fija abajo muestra el micrófono abierto, lo que está pasando, **Volver a la conversación** y **Terminar**. Termina con **Terminar**, tras 60 segundos de silencio o a los 10 minutos; recargar la página también la termina. El audio no se guarda y cada consulta consume 1 pregunta del saldo. La lectura con el botón **Escuchar** también continúa al cambiar de pantalla (con **Detener** en la misma barra).' },
    { p: '**Avisos al final de la respuesta:** cuando la pregunta es sobre datos de la empresa (cuentas, vencidos, deudores, proveedores, deudas, inventario, costos, facturación de un período), la inteligencia consulta los registros en ese momento antes de responder. Si alguna consulta falla, aparece al final: "Observación: no fue posible consultar ahora…" — ese valor no es cero, solo no pudo leerse. Si la consulta no pudo hacerse, o si algún valor citado no se encontró en los datos, también aparece un aviso para revisar la pantalla. El estado de resultados de un mes, los impuestos de un período y la nómina aún no se consultan en la conversación: indica la pantalla correcta.' },
    { nota: '**Informe después de la consulta:** pida "genere un informe" (o estado de resultados, flujo de caja, cuentas por cobrar…) y la IA arma el informe completo con los datos reales, avisa "su informe está hecho y está justo abajo, en PDF" y muestra la tarjeta con el botón grande **⬇ Descargar informe en PDF** (los mismos números de la pantalla Informes). También funciona en la conversación por voz.' },
    { nota: '**Conversaciones guardadas:** la conversación y los informes generados quedan guardados aunque salga del módulo. Use **＋ Nueva conversación** para empezar otra y **🗂 Conversaciones guardadas** para reabrir las anteriores o borrarlas (🗑, con confirmación). En la tarjeta del informe está **✏️ Anotar** para escribir una observación y **🗑 Borrar** para quitarlo de la conversación. Cada conversación es solo suya: otras personas de la Empresa no la ven y ninguna otra Empresa tiene acceso. Nada se borra solo.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
