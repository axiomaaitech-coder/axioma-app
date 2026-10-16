// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '08 - MEI - IA MEI Advisor.docx',
  titulo: 'Manual 08 — IA MEI Advisor',
  subtitulo: 'Seu consultor financeiro e fiscal MEI, com os seus números reais',
  info: ['Menu: MEI → IA MEI Advisor  •  Manual de uso do Axioma AI.Tech  •  Versão 2.3 (outubro de 2026)'],
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
    { p: '**Ouvir a resposta:** quando a voz estiver liberada, aparece o botão **🔊 Ouvir** embaixo de cada resposta. Toque para ouvir a resposta em voz alta e em **Parar** para interromper; só uma resposta fala por vez e nada toca sozinho. A voz lê apenas o que a inteligência do Axioma respondeu (sem símbolos nem emojis) e, se algum valor não pôde ser conferido nos seus dados, avisa isso no fim. Se a voz do Axioma estiver fora do ar, a voz do próprio aparelho lê no lugar. Ouvir não consome perguntas do saldo e o áudio não é guardado. Para responder falando, toque em **Falar** — o microfone nunca abre sozinho.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '08 - MEI - AI MEI Advisor.docx',
  titulo: 'Manual 08 — AI MEI Advisor',
  subtitulo: 'Your MEI financial and tax advisor, with your real numbers',
  info: ['Menu: MEI → AI MEI Advisor  •  Axioma AI.Tech user manual  •  Version 2.3 (October 2026)'],
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
    { p: '**Listen to the answer:** when voice is enabled, a **🔊 Listen** button appears below each answer. Tap it to hear the answer out loud and **Stop** to interrupt; only one answer speaks at a time and nothing plays by itself. The voice reads only what the Axioma intelligence answered (no symbols or emojis) and, if any amount could not be checked against your data, says so at the end. If the Axioma voice is unavailable, your device voice reads instead. Listening does not use questions from your balance and the audio is not stored. To reply by voice, tap **Speak** — the microphone never opens by itself.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '08 - MEI - IA MEI Advisor.docx',
  titulo: 'Manual 08 — IA MEI Advisor',
  subtitulo: 'Su consultor financiero y fiscal MEI, con sus números reales',
  info: ['Menú: MEI → IA Advisor MEI  •  Manual de uso de Axioma AI.Tech  •  Versión 2.3 (octubre de 2026)'],
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
    { p: '**Escuchar la respuesta:** cuando la voz esté habilitada, aparece el botón **🔊 Escuchar** debajo de cada respuesta. Tóquelo para oír la respuesta en voz alta y **Detener** para interrumpir; solo una respuesta habla a la vez y nada suena solo. La voz lee únicamente lo que respondió la inteligencia de Axioma (sin símbolos ni emojis) y, si algún valor no pudo verificarse con sus datos, lo avisa al final. Si la voz de Axioma no está disponible, la voz del propio dispositivo lee en su lugar. Escuchar no consume preguntas del saldo y el audio no se guarda. Para responder hablando, toque **Hablar** — el micrófono nunca se abre solo.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
