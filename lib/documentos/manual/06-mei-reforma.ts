// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '06 - MEI - Reforma Tributária.docx',
  titulo: 'Manual 06 — Reforma Tributária no MEI',
  subtitulo: 'O que a Reforma muda no seu MEI — sem pânico, com prazo real',
  info: ['Menu: MEI → Reforma Tributária  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A Reforma Tributária (IBS e CBS) muda os impostos sobre consumo no Brasil, com transição até 2033. Esta tela explica **o que muda para o seu MEI**, conforme o perfil dos seus clientes e o seu faturamento, e ajuda a decidir **se vale continuar MEI ou migrar para ME no Simples Nacional**.' },
    { nota: 'Tudo segue as regras vigentes na data mostrada na tela. Projeto de lei ou notícia não é regra: quando uma norma nova for publicada, o Axioma atualiza o conteúdo e a data da conferência.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **MEI ▼** → **Reforma Tributária**.', 'Painel MEI → **Acesso Rápido** → **Reforma Tributária**.'] },

    { h1: 'Mapa da tela (de cima para baixo)' },
    { numerada: [
      '**Cabeçalho:** Exportar PDF, Compartilhar e a escolha de tema (Escuro / Tema Claro).',
      '**Letreiro** com o resumo do seu caso.',
      '**Boa notícia: em 2026 nada muda no seu bolso.**',
      '**O que pede atenção: a decisão até setembro de 2026.**',
      '**A Reforma no seu caso específico** (depende do perfil de clientes).',
      '**O que fazer agora** (lista com atalhos).',
      '**Simulador: MEI vs ME Simples Nacional.**',
      '**Linha do Tempo — Transição até 2033.**',
      '**Análise Executiva Axioma** (botão Analisar).',
    ] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera um PDF com tudo o que está na tela.', 'O arquivo é baixado no seu computador ou celular.'],
      ['**Compartilhar**', 'Abre a Central de Compartilhamento com um resumo pronto.', 'Você escolhe WhatsApp, e-mail, copiar o texto ou baixar o PDF.'],
      ['**Escuro / Tema Claro**', 'Troca as cores da tela.', 'A escolha vale para todo o Axioma.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: '✅ Boa notícia: em 2026 nada muda no seu bolso' },
    { p: '2026 é o ano-teste: o IBS e a CBS aparecem com alíquotas simbólicas (0,9% + 0,1%) só para o sistema aprender. **O MEI não paga esse imposto** — continua só com o DAS, do jeito de sempre.' },
    { h2: '⚠️ O que pede atenção: a decisão até setembro de 2026' },
    { p: 'A urgência real é a escolha que vale para 2027: **continuar MEI ou migrar para ME no Simples Nacional**. Em 2027 a CBS passa a ser cobrada de verdade e a nota fiscal de serviço fica obrigatória.' },
    { h2: 'A Reforma no seu caso específico' },
    { p: 'O texto muda conforme o **perfil de clientes** escolhido em **Configurar MEI** (Painel MEI):' },
    { tabela: { colunas: ['Perfil', 'O que a tela mostra'], larguras: [2800, 6226], linhas: [
      ['🏢 Clientes empresas (B2B)', 'Alerta de **risco de crédito**: a partir de 2027 empresas no regime regular preferem fornecedores que geram crédito de IBS/CBS, e o MEI não gera. Vem com uma lista do que fazer (conversar com os principais clientes, simular o ME, não decidir sozinho).'],
      ['🧑 Clientes pessoa física (B2C)', 'Pode ficar tranquilo: o consumidor final não usa crédito; a Reforma quase não mexe no seu preço nem na sua competitividade.'],
      ['Os dois', 'Os dois cenários valem; o risco de crédito pesa só na parte B2B da carteira.'],
      ['Não configurado', 'A tela pede para configurar e mostra o atalho **Configurar perfil de cliente →**, que leva ao Painel MEI.'],
    ] } },
    { h2: 'O que fazer agora' },
    { lista: [
      'Manter o CNPJ regular — DAS em dia é a base de tudo. Atalho **Ver DAS & Obrigações →** (abre MEI → DAS & Obrigações).',
      'Manter o cadastro limpo: CNAE e atividade corretos evitam problema na nota fiscal obrigatória de 2027.',
      'Acompanhar o teto anual. Atalho **Ver Faturamento →** (abre MEI → Faturamento).',
      'Decidir MEI ou ME até setembro de 2026, usando o simulador logo abaixo.',
      'Faturamento bem baixo (até R$ 40,5 mil por ano): a tela indica conhecer o **Nanoempreendedor**, categoria nova isenta de IBS/CBS.',
    ] },
    { h2: 'Simulador: MEI vs ME Simples Nacional' },
    { p: 'Usa o **seu faturamento real** do ano: à esquerda, quanto você paga como MEI (**DAS fixo por mês**); à direita, a estimativa como ME no Simples (**cerca de 6% por mês**). Para clientes B2B aparece o lembrete de que o ME pode gerar crédito para o seu cliente.' },
    { alerta: 'É uma estimativa com as regras vigentes na data mostrada. As alíquotas definitivas do IBS/CBS ainda serão fixadas em lei e podem mudar — quando mudarem, o Axioma refaz a conta e atualiza a data.' },
    { h2: 'Linha do Tempo — Transição até 2033' },
    { p: 'Marcos da Reforma com o selo **Você está aqui**: **2026** ano-teste (o MEI não paga IBS/CBS); **2027** CBS cobrada de verdade, split payment voluntário para B2B e nota fiscal de serviço obrigatória; **2033** fim da transição.' },
    { h2: 'Análise Executiva Axioma' },
    { p: 'Botão **Analisar**: a inteligência do Axioma lê os seus números e explica o impacto da Reforma no seu MEI. Enquanto trabalha aparece **Analisando...**. Se a IA não estiver disponível, entra sozinha uma análise por regras — você nunca fica sem resposta.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '06 - MEI - Tax Reform.docx',
  titulo: 'Manual 06 — Tax Reform for the MEI',
  subtitulo: 'What the Reform changes for your MEI — no panic, with the real deadline',
  info: ['Menu: MEI → Tax Reform  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Brazil\'s Tax Reform (IBS and CBS) changes consumption taxes, with a transition until 2033. This screen explains **what changes for your MEI**, based on your customer profile and revenue, and helps you decide **whether to stay MEI or move to ME under Simples Nacional**.' },
    { nota: 'Everything follows the rules in force on the date shown on the screen. A bill or a news story is not a rule: when a new norm is published, Axioma updates the content and the check date.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **MEI ▼** → **Tax Reform**.', 'MEI Dashboard → **Quick Access** → **Tax Reform**.'] },

    { h1: 'Screen map (top to bottom)' },
    { numerada: [
      '**Header:** Export PDF, Share and theme choice (Dark / Light Theme).',
      '**Ticker** with a summary of your case.',
      '**Good news: nothing changes in your pocket in 2026.**',
      '**What needs attention: the decision by September 2026.**',
      '**The Reform in your specific case** (depends on the customer profile).',
      '**What to do now** (list with shortcuts).',
      '**Simulator: MEI vs ME Simples Nacional.**',
      '**Timeline — Transition until 2033.**',
      '**Axioma Executive Analysis** (Analyze button).',
    ] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates a PDF with everything on the screen.', 'The file is downloaded to your computer or phone.'],
      ['**Share**', 'Opens the Sharing Center with a ready summary.', 'You pick WhatsApp, email, copy the text or download the PDF.'],
      ['**Dark / Light Theme**', 'Switches the screen colors.', 'The choice applies to all of Axioma.'],
    ] } },

    { h1: 'Parts of the screen' },
    { h2: '✅ Good news: nothing changes in your pocket in 2026' },
    { p: '2026 is the test year: IBS and CBS appear with symbolic rates (0.9% + 0.1%) just for the system to learn. **The MEI does not pay this tax** — it keeps paying only the DAS, as always.' },
    { h2: '⚠️ What needs attention: the decision by September 2026' },
    { p: 'The real urgency is the choice that applies to 2027: **stay MEI or move to ME under Simples Nacional**. In 2027 CBS is charged for real and service invoices become mandatory.' },
    { h2: 'The Reform in your specific case' },
    { p: 'The text changes according to the **customer profile** chosen in **Configure MEI** (MEI Dashboard):' },
    { tabela: { colunas: ['Profile', 'What the screen shows'], larguras: [2800, 6226], linhas: [
      ['🏢 Business customers (B2B)', '**Credit risk** alert: from 2027, companies under the regular regime prefer suppliers that generate IBS/CBS credit, and the MEI does not. Comes with a to-do list (talk to your main customers, simulate ME, do not decide alone).'],
      ['🧑 Individual customers (B2C)', 'You can relax: final consumers do not use credit; the Reform barely affects your price or competitiveness.'],
      ['Both', 'Both scenarios apply; the credit risk only weighs on the B2B part of your portfolio.'],
      ['Not set', 'The screen asks you to set it and shows the **Configure client profile →** shortcut, which opens the MEI Dashboard.'],
    ] } },
    { h2: 'What to do now' },
    { lista: [
      'Keep the CNPJ in good standing — an up-to-date DAS is the foundation. Shortcut **View DAS & Obligations →** (opens MEI → DAS & Obligations).',
      'Keep your registration clean: correct CNAE and activity avoid trouble with the mandatory 2027 invoice.',
      'Track the annual cap. Shortcut **View Revenue →** (opens MEI → Revenue).',
      'Decide MEI or ME by September 2026, using the simulator just below.',
      'Very low revenue (up to R$ 40.5k per year): the screen suggests learning about the **Nano-entrepreneur**, a new category exempt from IBS/CBS.',
    ] },
    { h2: 'Simulator: MEI vs ME Simples Nacional' },
    { p: 'Uses **your real revenue** for the year: on the left, what you pay as MEI (**fixed DAS per month**); on the right, the estimate as ME under Simples (**about 6% per month**). For B2B customers it reminds you that ME can generate credit for your customer.' },
    { alerta: 'This is an estimate using the rules in force on the date shown. Final IBS/CBS rates will still be set by law and may change — when they do, Axioma redoes the math and updates the date.' },
    { h2: 'Timeline — Transition until 2033' },
    { p: 'Reform milestones with the **You\'re here** tag: **2026** test year (the MEI does not pay IBS/CBS); **2027** CBS charged for real, voluntary split payment for B2B and mandatory service invoices; **2033** end of the transition.' },
    { h2: 'Axioma Executive Analysis' },
    { p: '**Analyze** button: Axioma\'s intelligence reads your numbers and explains the Reform\'s impact on your MEI. While it works you see **Analyzing...**. If the AI is unavailable, a rule-based analysis takes over automatically — you are never left without an answer.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '06 - MEI - Reforma Tributaria.docx',
  titulo: 'Manual 06 — Reforma Tributaria en el MEI',
  subtitulo: 'Lo que la Reforma cambia en su MEI — sin pánico, con el plazo real',
  info: ['Menú: MEI → Reforma Tributaria  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'La Reforma Tributaria de Brasil (IBS y CBS) cambia los impuestos al consumo, con transición hasta 2033. Esta pantalla explica **qué cambia para su MEI**, según el perfil de sus clientes y su facturación, y ayuda a decidir **si conviene seguir como MEI o pasar a ME en el Simples Nacional**.' },
    { nota: 'Todo sigue las reglas vigentes en la fecha que muestra la pantalla. Un proyecto de ley o una noticia no es regla: cuando se publique una norma nueva, Axioma actualiza el contenido y la fecha de la verificación.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **MEI ▼** → **Reforma Tributaria**.', 'Panel MEI → **Acceso Rápido** → **Reforma Tributaria**.'] },

    { h1: 'Mapa de la pantalla (de arriba hacia abajo)' },
    { numerada: [
      '**Encabezado:** Exportar PDF, Compartir y elección de tema (Oscuro / Tema Claro).',
      '**Marquesina** con el resumen de su caso.',
      '**Buena noticia: en 2026 nada cambia en su bolsillo.**',
      '**Lo que requiere atención: la decisión hasta septiembre de 2026.**',
      '**La Reforma en su caso específico** (depende del perfil de clientes).',
      '**Qué hacer ahora** (lista con atajos).',
      '**Simulador: MEI vs ME Simples Nacional.**',
      '**Línea de Tiempo — Transición hasta 2033.**',
      '**Análisis Ejecutivo Axioma** (botón Analizar).',
    ] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera un PDF con todo lo que está en la pantalla.', 'El archivo se descarga en su computadora o celular.'],
      ['**Compartir**', 'Abre el Centro de Compartir con un resumen listo.', 'Usted elige WhatsApp, correo, copiar el texto o descargar el PDF.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores de la pantalla.', 'La elección vale para todo Axioma.'],
    ] } },

    { h1: 'Las partes de la pantalla' },
    { h2: '✅ Buena noticia: en 2026 nada cambia en su bolsillo' },
    { p: '2026 es el año de prueba: el IBS y la CBS aparecen con alícuotas simbólicas (0,9% + 0,1%) solo para que el sistema aprenda. **El MEI no paga ese impuesto** — sigue pagando solo el DAS, como siempre.' },
    { h2: '⚠️ Lo que requiere atención: la decisión hasta septiembre de 2026' },
    { p: 'La urgencia real es la elección que vale para 2027: **seguir como MEI o pasar a ME en el Simples Nacional**. En 2027 la CBS se cobra de verdad y la factura de servicio pasa a ser obligatoria.' },
    { h2: 'La Reforma en su caso específico' },
    { p: 'El texto cambia según el **perfil de clientes** elegido en **Configurar MEI** (Panel MEI):' },
    { tabela: { colunas: ['Perfil', 'Qué muestra la pantalla'], larguras: [2800, 6226], linhas: [
      ['🏢 Clientes empresas (B2B)', 'Alerta de **riesgo de crédito**: desde 2027 las empresas del régimen regular prefieren proveedores que generan crédito de IBS/CBS, y el MEI no lo genera. Viene con una lista de qué hacer (hablar con los principales clientes, simular el ME, no decidir solo).'],
      ['🧑 Clientes personas físicas (B2C)', 'Puede estar tranquilo: el consumidor final no usa crédito; la Reforma casi no afecta su precio ni su competitividad.'],
      ['Ambos', 'Valen los dos escenarios; el riesgo de crédito pesa solo en la parte B2B de la cartera.'],
      ['No configurado', 'La pantalla pide configurarlo y muestra el atajo **Configurar perfil de cliente →**, que abre el Panel MEI.'],
    ] } },
    { h2: 'Qué hacer ahora' },
    { lista: [
      'Mantener el CNPJ regular — el DAS al día es la base de todo. Atajo **Ver DAS y Obligaciones →** (abre MEI → DAS y Obligaciones).',
      'Mantener el registro limpio: CNAE y actividad correctos evitan problemas con la factura obligatoria de 2027.',
      'Seguir el tope anual. Atajo **Ver Facturación →** (abre MEI → Facturación).',
      'Decidir MEI o ME hasta septiembre de 2026, usando el simulador de abajo.',
      'Facturación muy baja (hasta R$ 40,5 mil por año): la pantalla sugiere conocer el **Nanoemprendedor**, categoría nueva exenta de IBS/CBS.',
    ] },
    { h2: 'Simulador: MEI vs ME Simples Nacional' },
    { p: 'Usa **su facturación real** del año: a la izquierda, lo que paga como MEI (**DAS fijo por mes**); a la derecha, la estimación como ME en el Simples (**cerca de 6% por mes**). Para clientes B2B recuerda que el ME puede generar crédito para su cliente.' },
    { alerta: 'Es una estimación con las reglas vigentes en la fecha mostrada. Las alícuotas definitivas del IBS/CBS todavía serán fijadas por ley y pueden cambiar — cuando cambien, Axioma rehace la cuenta y actualiza la fecha.' },
    { h2: 'Línea de Tiempo — Transición hasta 2033' },
    { p: 'Hitos de la Reforma con la etiqueta **Usted está aquí**: **2026** año de prueba (el MEI no paga IBS/CBS); **2027** CBS cobrada de verdad, split payment voluntario para B2B y factura de servicio obligatoria; **2033** fin de la transición.' },
    { h2: 'Análisis Ejecutivo Axioma' },
    { p: 'Botón **Analizar**: la inteligencia de Axioma lee sus números y explica el impacto de la Reforma en su MEI. Mientras trabaja aparece **Analizando...**. Si la IA no está disponible, entra sola un análisis por reglas — usted nunca se queda sin respuesta.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
