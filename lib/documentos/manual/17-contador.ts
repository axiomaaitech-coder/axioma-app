// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '17 - Contador.docx',
  titulo: 'Manual 17 — Contador',
  subtitulo: 'O que a Axioma descobriu sozinha nos seus números — e as ferramentas do contador',
  info: ['Menu: Contabilidade → Contador  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Contador é o **status de inteligência** da contabilidade: a Axioma vasculha os lançamentos e mostra **descobertas** (riscos, oportunidades, pendências, previsões) com a evidência e o que fazer. Daqui você abre também o **Explique Minha Empresa**, o **Fechamento**, o **Lançamento Manual** e o **Se Eu Fizer Nada**.' },
    { nota: 'Toda a contabilidade é alimentada sozinha pelo motor de rastreabilidade: cada pagamento, recebimento, receita, custo, dívida e venda do PDV vira lançamento de partida dobrada. O Lançamento Manual é só para ajustes do contador.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Contabilidade ▼** → **Contador**.'] },

    { h1: 'Tela principal' },
    { tabela: { colunas: ['Elemento', 'O que faz', 'O que acontece depois'], larguras: [2600, 3400, 3026], linhas: [
      ['**Rodar descoberta**', 'A Axioma vasculha os dados atrás de riscos e oportunidades.', 'Aparece **Rodando...**; depois as descobertas novas, ou "Nada novo — tudo já mapeado".'],
      ['Cartões **Riscos Críticos**, **Oportunidades**, **Pendências**, **Previsões**', 'Contam as descobertas abertas de cada tipo.', '**Ver estas descobertas** filtra a lista.'],
      ['**Mostrar só abertas / Mostrar todas**', 'Filtra a lista.', 'A lista muda na hora.'],
      ['**Compartilhar**', 'Abre a Central de Compartilhamento.', 'WhatsApp, e-mail, copiar ou PDF.'],
      ['Atalhos **Explique minha empresa**, **Fechamento**, **Lançamento Manual**, **Se eu fizer nada**', 'Abrem as telas internas.', 'Cada uma tem **Voltar ao Contador**.'],
    ] } },
    { h2: 'Cada descoberta' },
    { p: 'Mostra Tipo, Prioridade, **Confiança**, **Impacto**, **Por quê**, **O que fazer**, **Encontrada em** e a **Evidência (dados e cálculo usados)** — nada é afirmado sem o número por trás.' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['**Marcar como revisada**', 'Diz que você já viu; continua aberta.'],
      ['**Marcar como resolvida**', 'Fecha a descoberta.'],
      ['**Ignorar**', 'Tira da lista de abertas (pede confirmação Sim/Não).'],
      ['**Corrigir no Lançamento Manual**', 'Abre o Lançamento Manual para o ajuste.'],
    ] } },

    { h1: 'Explique Minha Empresa' },
    { p: 'Como a empresa realmente funciona, direto da contabilidade: **Como sua empresa ganha dinheiro** (receitas), **Onde sua empresa perde dinheiro** (despesas), **Como o caixa se comporta** (caixa disponível e Liquidity Score), **Concentração** de fornecedores e os riscos e oportunidades abertos. Sem lançamentos, pede para cadastrar o plano de contas e lançar movimentos.' },

    { h1: 'Fechamento (Continuous Close)' },
    { p: 'Quão pronto está o fechamento do mês: **Close Readiness**, **Data Trust Score**, **Eventos não contabilizados**, **Contas a pagar pendentes** e **Contas a receber pendentes** — cada item com "clique pra resolver" levando ao lugar certo.' },

    { h1: 'Lançamento Manual (Proprietário ou Administrador)' },
    { p: 'Ajustes, provisões e correções em **partida dobrada**. Nunca edita um lançamento existente: sempre **estorna e relança**.' },
    { numerada: [
      'Clique em **Novo Lançamento**.',
      'Preencha **Descrição** (ex.: "Provisão de depreciação de outubro") e **Data**.',
      'Em cada partida, **Selecione a conta**, escolha **D** (débito) ou **C** (crédito) e o valor. **Adicionar partida** inclui mais linhas.',
      'O rodapé mostra **Bate certinho** quando débitos = créditos, ou a **Diferença** quando **não bate** (aí não grava).',
      'Clique em **Gravar lançamento**.',
    ] },
    { p: 'Na lista **Últimos Lançamentos Manuais**, o botão **Estornar** pergunta "Confirma o estorno?" e cria o lançamento contrário — o original fica marcado **ESTORNADO**, nada é apagado. Quem não é Proprietário ou Administrador vê em modo leitura.' },

    { h1: 'Se Eu Fizer Nada' },
    { p: 'Mantendo tudo como está — sem cortar custo, vender mais ou pegar empréstimo — onde a empresa chega em 30, 60, 90 e 180 dias: caixa, **Capital de Giro**, **Dívida Pendente** e **Liquidity Score**. **Simular uma mudança grande** leva ao Gêmeo Financeiro (Manual 16).' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '17 - Accountant.docx',
  titulo: 'Manual 17 — Accountant',
  subtitulo: 'What Axioma discovered on its own in your numbers — and the accountant’s tools',
  info: ['Menu: Accounting → Accountant  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'The Accountant is the accounting **intelligence status**: Axioma scans the entries and shows **discoveries** (risks, opportunities, pending items, forecasts) with the evidence and what to do. From here you also open **Explain My Company**, **Close**, **Manual Entry** and **If I Do Nothing**.' },
    { nota: 'All accounting is fed automatically by the traceability engine: every payment, receipt, revenue, cost, debt and POS sale becomes a double-entry posting. Manual Entry is only for the accountant’s adjustments.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Accounting ▼** → **Accountant**.'] },

    { h1: 'Main screen' },
    { tabela: { colunas: ['Element', 'What it does', 'What happens next'], larguras: [2600, 3400, 3026], linhas: [
      ['**Run discovery**', 'Axioma scans the data for risks and opportunities.', '**Running...** appears; then the new discoveries, or "Nothing new — all mapped".'],
      ['**Critical Risks**, **Opportunities**, **Pending**, **Forecasts** cards', 'Count open discoveries of each type.', '**See these discoveries** filters the list.'],
      ['**Show only open / Show all**', 'Filters the list.', 'The list changes right away.'],
      ['**Share**', 'Opens the Sharing Center.', 'WhatsApp, email, copy or PDF.'],
      ['**Explain my company**, **Close**, **Manual Entry**, **If I do nothing** shortcuts', 'Open the inner screens.', 'Each has **Back to Accountant**.'],
    ] } },
    { h2: 'Each discovery' },
    { p: 'Shows Type, Priority, **Confidence**, **Impact**, **Why**, **What to do**, **Found in** and the **Evidence (data and calculation used)** — nothing is stated without the number behind it.' },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['**Mark as reviewed**', 'Says you have seen it; it stays open.'],
      ['**Mark as resolved**', 'Closes the discovery.'],
      ['**Ignore**', 'Removes it from the open list (asks Yes/No).'],
      ['**Fix in Manual Entry**', 'Opens Manual Entry for the adjustment.'],
    ] } },

    { h1: 'Explain My Company' },
    { p: 'How the company really works, straight from the accounting: **How your company makes money** (revenue), **Where your company loses money** (expenses), **How cash behaves** (available cash and Liquidity Score), supplier **Concentration** and open risks and opportunities. Without entries, it asks you to set up the chart of accounts and post movements.' },

    { h1: 'Close (Continuous Close)' },
    { p: 'How ready the month’s close is: **Close Readiness**, **Data Trust Score**, **Unposted events**, **Pending payables** and **Pending receivables** — each item with "click to resolve" leading to the right place.' },

    { h1: 'Manual Entry (Owner or Administrator)' },
    { p: 'Adjustments, provisions and corrections in **double entry**. It never edits an existing entry: it always **reverses and re-posts**.' },
    { numerada: [
      'Click **New Entry**.',
      'Fill in **Description** (e.g., "October depreciation provision") and **Date**.',
      'In each line, **Select the account**, choose **D** (debit) or **C** (credit) and the amount. **Add line** adds more lines.',
      'The footer shows **Balanced** when debits = credits, or the **Difference** when it **does not balance** (then it will not save).',
      'Click **Save entry**.',
    ] },
    { p: 'In **Latest Manual Entries**, the **Reverse** button asks "Confirm the reversal?" and creates the opposite entry — the original is marked **REVERSED**, nothing is deleted. Anyone who is not an Owner or Administrator sees it in read-only mode.' },

    { h1: 'If I Do Nothing' },
    { p: 'Keeping everything as is — no cost cuts, no extra sales, no loans — where the company gets in 30, 60, 90 and 180 days: cash, **Working Capital**, **Pending Debt** and **Liquidity Score**. **Simulate a big change** leads to the Financial Twin (Manual 16).' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '17 - Contador.docx',
  titulo: 'Manual 17 — Contador',
  subtitulo: 'Lo que Axioma descubrió sola en sus números — y las herramientas del contador',
  info: ['Menú: Contabilidad → Contador  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'El Contador es el **estado de inteligencia** de la contabilidad: Axioma revisa los asientos y muestra **descubrimientos** (riesgos, oportunidades, pendientes, previsiones) con la evidencia y qué hacer. Desde aquí también abre **Explique Mi Empresa**, **Cierre**, **Asiento Manual** y **Si No Hago Nada**.' },
    { nota: 'Toda la contabilidad se alimenta sola por el motor de trazabilidad: cada pago, cobro, ingreso, costo, deuda y venta del PDV se vuelve un asiento de partida doble. El Asiento Manual es solo para ajustes del contador.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Contabilidad ▼** → **Contador**.'] },

    { h1: 'Pantalla principal' },
    { tabela: { colunas: ['Elemento', 'Qué hace', 'Qué pasa después'], larguras: [2600, 3400, 3026], linhas: [
      ['**Ejecutar descubrimiento**', 'Axioma revisa los datos en busca de riesgos y oportunidades.', 'Aparece **Ejecutando...**; después los descubrimientos nuevos, o "Nada nuevo — todo ya mapeado".'],
      ['Tarjetas **Riesgos Críticos**, **Oportunidades**, **Pendientes**, **Previsiones**', 'Cuentan los descubrimientos abiertos de cada tipo.', '**Ver estos descubrimientos** filtra la lista.'],
      ['**Mostrar solo abiertos / Mostrar todos**', 'Filtra la lista.', 'La lista cambia al instante.'],
      ['**Compartir**', 'Abre el Centro de Compartir.', 'WhatsApp, correo, copiar o PDF.'],
      ['Atajos **Explique mi empresa**, **Cierre**, **Asiento Manual**, **Si no hago nada**', 'Abren las pantallas internas.', 'Cada una tiene **Volver al Contador**.'],
    ] } },
    { h2: 'Cada descubrimiento' },
    { p: 'Muestra Tipo, Prioridad, **Confianza**, **Impacto**, **Por qué**, **Qué hacer**, **Encontrado en** y la **Evidencia (datos y cálculo usados)** — nada se afirma sin el número detrás.' },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['**Marcar como revisado**', 'Indica que ya lo vio; sigue abierto.'],
      ['**Marcar como resuelto**', 'Cierra el descubrimiento.'],
      ['**Ignorar**', 'Lo saca de la lista de abiertos (pide Sí/No).'],
      ['**Corregir en el Asiento Manual**', 'Abre el Asiento Manual para el ajuste.'],
    ] } },

    { h1: 'Explique Mi Empresa' },
    { p: 'Cómo funciona realmente la empresa, directo de la contabilidad: **Cómo su empresa gana dinero** (ingresos), **Dónde su empresa pierde dinero** (gastos), **Cómo se comporta la caja** (caja disponible y Liquidity Score), **Concentración** de proveedores y los riesgos y oportunidades abiertos. Sin asientos, pide registrar el plan de cuentas y movimientos.' },

    { h1: 'Cierre (Continuous Close)' },
    { p: 'Qué tan listo está el cierre del mes: **Close Readiness**, **Data Trust Score**, **Eventos no contabilizados**, **Cuentas por pagar pendientes** y **Cuentas por cobrar pendientes** — cada ítem con "clic para resolver" que lleva al lugar correcto.' },

    { h1: 'Asiento Manual (Propietario o Administrador)' },
    { p: 'Ajustes, provisiones y correcciones en **partida doble**. Nunca edita un asiento existente: siempre **revierte y vuelve a registrar**.' },
    { numerada: [
      'Haga clic en **Nuevo Asiento**.',
      'Complete **Descripción** (ej.: "Provisión de depreciación de octubre") y **Fecha**.',
      'En cada partida, **Seleccione la cuenta**, elija **D** (débito) o **C** (crédito) y el valor. **Agregar partida** incluye más líneas.',
      'El pie muestra **Cuadra** cuando débitos = créditos, o la **Diferencia** cuando **no cuadra** (entonces no guarda).',
      'Haga clic en **Grabar asiento**.',
    ] },
    { p: 'En **Últimos Asientos Manuales**, el botón **Revertir** pregunta "¿Confirma la reversión?" y crea el asiento contrario — el original queda marcado **REVERTIDO**, nada se borra. Quien no es Propietario o Administrador lo ve en modo lectura.' },

    { h1: 'Si No Hago Nada' },
    { p: 'Manteniendo todo como está — sin recortar costos, vender más ni tomar préstamos — a dónde llega la empresa en 30, 60, 90 y 180 días: caja, **Capital de Trabajo**, **Deuda Pendiente** y **Liquidity Score**. **Simular un cambio grande** lleva al Gemelo Financiero (Manual 16).' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
