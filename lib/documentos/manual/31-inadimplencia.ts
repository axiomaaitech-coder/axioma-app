// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '31 - Comercial - Inadimplência.docx',
  titulo: 'Manual 31 — Inadimplência',
  subtitulo: 'Centro de Inteligência de Recuperação Financeira',
  info: ['Menu: Comercial → Inadimplência  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Cuida do dinheiro que **já venceu e não foi pago**. Lê as contas vencidas direto de Contas a Receber (sem cadastro duplicado) e ajuda a recuperar: prioriza quem cobrar, sugere a melhor estratégia, organiza negociações e calcula a perda provável.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **👥 Comercial ▼** → **Inadimplência**.'] },

    { h1: 'Botões do cabeçalho' },
    { p: '**+ Novo Caso** (registra um título vencido direto em Contas a Receber, pela mesma porta oficial), **Compartilhar**, seletor de período, busca por cliente e filtro de prioridade.' },

    { h1: 'As partes da tela' },
    { h2: 'Dashboard Executivo' },
    { p: '**Valor Total Inadimplente**, **Clientes Inadimplentes**, **% de Inadimplência**, **Recuperado no Mês e no Ano**, **Em Negociação**, **Perda Provável**, **DSO Ajustado**, **Índice de Recuperação**, **Tempo Médio de Recuperação**, **Receita em Risco**, **Fluxo de Caixa Comprometido**, **Impacto na Liquidez**, **Impacto no Capital de Giro** e **Score Médio da Carteira Inadimplente**. O caixa usado é o mesmo saldo do Fluxo de Caixa (com as vendas do PDV).' },
    { h2: 'Alertas Inteligentes e Aging' },
    { p: 'Alertas com ação sugerida e o envelhecimento da dívida em 0-30, 31-60, 61-90 e 90+ dias.' },
    { h2: 'Score de Risco Axioma' },
    { p: 'Nota de cada cliente inadimplente e o **Ranking dos Maiores Riscos**.' },
    { h2: 'Prevenção Axioma' },
    { p: 'Explica **O que aconteceu**, **Por quê**, **Impacto** e a **Melhor estratégia**. Funciona por regras, sem texto de modelo de linguagem.' },
    { h2: 'Régua de Recuperação Escalonada' },
    { p: 'Os degraus da recuperação: **amigável → formal → protesto → jurídico → negativação**, cada um com gatilho (dias de atraso), canal e mensagem-modelo. **Usar escalonamento padrão** cria a régua pronta. A régua organiza os passos; nenhuma ação é disparada automaticamente.' },
    { h2: 'Mapa Executivo de Risco' },
    { p: 'Um cliente por linha: valor devido, dias de atraso, nº de títulos, último pagamento, histórico de atrasos, **probabilidade de recuperação** e **de perda**, score, prioridade, impacto financeiro, responsável e negociação.' },
    { h2: 'Simulador Executivo de Recuperação' },
    { p: 'Ajuste **Desconto à Vista**, **% que aceita parcelar**, **Redução de Juros**, **Aumento de Prazo**, **% de Recuperação Parcial**, **% de Perda Total** e **Antecipação** e veja recuperado, perda assumida, EBITDA e caixa em quatro cenários. Nada é gravado.' },
    { h2: 'Perda Esperada — Provisão PCLD' },
    { p: 'Quanto tende a ser recuperado em cada prazo (Provável, Improvável) e a **Perda Esperada** por faixa de atraso. O bloco **Impacto Simulado na DRE** compara a margem atual com a margem após a provisão; o botão **Salvar provisão na DRE do período** grava a provisão (exige um fechamento de DRE no período; sem ele, a tela avisa).' },
    { h2: 'Custo de Cobrança × Valor Recuperável' },
    { p: 'Informe o custo médio de cobrança por título e o Axioma sinaliza títulos que **não vale a pena perseguir** porque custam mais do que recuperam.' },
    { h2: 'Análises Executivas' },
    { p: 'Heatmap, Evolução Mensal, distribuição por estado e segmento, Curva ABC da Inadimplência e **Ranking de Maior Recuperação**.' },

    { h1: 'Central de Negociação do cliente' },
    { p: 'Abra um cliente para ver os **Títulos em Aberto**, a **Estratégia Recomendada** com a chance de recuperar, a **Timeline de Interações** e os acordos e promessas (Cumprido ou Quebrado).' },
    { numerada: [
      'Em **Registrar Contato**, anote o que foi tratado.',
      'Em **Registrar Negociação**, informe valor, parcelas, desconto, juros, multa e condições, e clique em **Salvar Negociação**.',
      'Quando o cliente pagar, clique em **Dar baixa (marcar como pago)**: é um recebimento oficial — entra no Fluxo de Caixa, em Receitas e na contabilidade, e a dívida passa para "Recuperado".',
    ] },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['✏️ Editar', 'Edita o título; o valor não pode ficar menor que o já recebido.'],
      ['🗑️ Excluir', 'Pede motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador). Título com recebimento não pode ser excluído.'],
    ] } },
    { nota: 'Se alguma leitura falhar, a tela avisa que os dados podem estar incompletos — nunca mostra "ninguém inadimplente" por engano.' },
    { nota: 'Enquanto os dados carregam, a tela mostra o sinal de carregando — o aviso de "sem dados" só aparece quando realmente não há lançamentos.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '31 - Commercial - Default.docx',
  titulo: 'Manual 31 — Default',
  subtitulo: 'Financial Recovery Intelligence Center',
  info: ['Menu: Commercial → Default  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Takes care of money that is **already overdue and unpaid**. It reads overdue bills straight from Receivables (no duplicate registration) and helps you recover: it prioritizes whom to collect from, suggests the best strategy, organizes negotiations and calculates the probable loss.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **👥 Commercial ▼** → **Default**.'] },

    { h1: 'Header buttons' },
    { p: '**+ New Case** (records an overdue bill straight in Receivables, through the same official path), **Share**, period selector, client search and priority filter.' },

    { h1: 'Parts of the screen' },
    { h2: 'Executive Dashboard' },
    { p: '**Total Defaulted Amount**, **Defaulting Clients**, **% Default**, **Recovered this Month and Year**, **In Negotiation**, **Probable Loss**, **Adjusted DSO**, **Recovery Rate**, **Average Recovery Time**, **Revenue at Risk**, **Committed Cash Flow**, **Liquidity Impact**, **Working Capital Impact** and **Average Score of the Defaulting Portfolio**. The cash used is the same balance as Cash Flow (including POS sales).' },
    { h2: 'Smart Alerts and Aging' },
    { p: 'Alerts with a suggested action and debt aging in 0-30, 31-60, 61-90 and 90+ days.' },
    { h2: 'Axioma Risk Score' },
    { p: 'Each defaulting client’s score and the **Top Risks Ranking**.' },
    { h2: 'Axioma Prevention' },
    { p: 'Explains **What happened**, **Why**, **Impact** and the **Best strategy**. Rule-based, with no language-model text.' },
    { h2: 'Escalated Recovery Ladder' },
    { p: 'The recovery steps: **friendly → formal → protest → legal → credit bureau**, each with a trigger (days late), channel and template message. **Use default ladder** creates a ready-made ladder. The ladder organizes the steps; no action is triggered automatically.' },
    { h2: 'Executive Risk Map' },
    { p: 'One client per row: amount owed, days late, number of bills, last payment, delay history, **recovery probability** and **loss probability**, score, priority, financial impact, person in charge and negotiation.' },
    { h2: 'Executive Recovery Simulator' },
    { p: 'Adjust **Cash Discount**, **% accepting installments**, **Interest Reduction**, **Term Extension**, **% Partial Recovery**, **% Total Loss** and **Anticipation** and see recovered amount, assumed loss, EBITDA and cash in four scenarios. Nothing is saved.' },
    { h2: 'Expected Loss — PCLD Provision' },
    { p: 'How much is likely to be recovered in each term (Likely, Unlikely) and the **Expected Loss** by delay range. The **Simulated Impact on the Income Statement** block compares the current margin with the margin after the provision; **Save provision to period DRE** records the provision (requires a closed Income Statement for the period; without it, the screen warns you).' },
    { h2: 'Collection Cost × Recoverable Value' },
    { p: 'Enter the average collection cost per bill and Axioma flags bills that are **not worth chasing** because they cost more than they recover.' },
    { h2: 'Executive Analytics' },
    { p: 'Heatmap, Monthly Evolution, distribution by state and segment, Default ABC Curve and **Top Recovery Ranking**.' },

    { h1: 'Client Negotiation Center' },
    { p: 'Open a client to see the **Open Invoices**, the **Recommended Strategy** with the recovery chance, the **Interaction Timeline** and agreements and promises (Fulfilled or Broken).' },
    { numerada: [
      'In **Log Contact**, note what was discussed.',
      'In **Register Negotiation**, enter amount, installments, discount, interest, penalty and terms, and click **Save Negotiation**.',
      'When the client pays, click **Settle (mark as paid)**: it is an official receipt — it goes into Cash Flow, Revenue and accounting, and the debt moves to "Recovered".',
    ] },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['✏️ Edit', 'Edits the bill; the amount cannot go below what was already received.'],
      ['🗑️ Delete', 'Asks for a reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator). A bill with a receipt cannot be deleted.'],
    ] } },
    { nota: 'If any loading fails, the screen warns that the data may be incomplete — it never shows "no one in default" by mistake.' },
    { nota: 'While data loads, the screen shows the loading sign — the "no data" notice only appears when there really are no entries.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '31 - Comercial - Morosidad.docx',
  titulo: 'Manual 31 — Morosidad',
  subtitulo: 'Centro de Inteligencia de Recuperación Financiera',
  info: ['Menú: Comercial → Morosidad  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Cuida el dinero que **ya venció y no fue pagado**. Lee las cuentas vencidas directo de Cuentas por Cobrar (sin registro duplicado) y ayuda a recuperar: prioriza a quién cobrar, sugiere la mejor estrategia, organiza negociaciones y calcula la pérdida probable.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **👥 Comercial ▼** → **Morosidad**.'] },

    { h1: 'Botones del encabezado' },
    { p: '**+ Nuevo Caso** (registra un título vencido directo en Cuentas por Cobrar, por la misma puerta oficial), **Compartir**, selector de período, búsqueda por cliente y filtro de prioridad.' },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Panel Ejecutivo' },
    { p: '**Valor Total en Mora**, **Clientes Morosos**, **% de Morosidad**, **Recuperado en el Mes y el Año**, **En Negociación**, **Pérdida Probable**, **DSO Ajustado**, **Índice de Recuperación**, **Tiempo Promedio de Recuperación**, **Ingreso en Riesgo**, **Flujo de Caja Comprometido**, **Impacto en la Liquidez**, **Impacto en el Capital de Trabajo** y **Score Promedio de la Cartera Morosa**. La caja usada es el mismo saldo del Flujo de Caja (con las ventas del PDV).' },
    { h2: 'Alertas Inteligentes y Aging' },
    { p: 'Alertas con acción sugerida y el envejecimiento de la deuda en 0-30, 31-60, 61-90 y 90+ días.' },
    { h2: 'Score de Riesgo Axioma' },
    { p: 'Nota de cada cliente moroso y el **Ranking de los Mayores Riesgos**.' },
    { h2: 'Prevención Axioma' },
    { p: 'Explica **Qué pasó**, **Por qué**, **Impacto** y la **Mejor estrategia**. Funciona por reglas, sin texto de modelo de lenguaje.' },
    { h2: 'Regla de Recuperación Escalonada' },
    { p: 'Los escalones de la recuperación: **amistoso → formal → protesto → jurídico → registro en burós**, cada uno con disparador (días de atraso), canal y mensaje modelo. **Usar escalonamiento predeterminado** crea la regla lista. La regla organiza los pasos; ninguna acción se dispara automáticamente.' },
    { h2: 'Mapa Ejecutivo de Riesgo' },
    { p: 'Un cliente por línea: valor adeudado, días de atraso, n.º de títulos, último pago, historial de atrasos, **probabilidad de recuperación** y **de pérdida**, score, prioridad, impacto financiero, responsable y negociación.' },
    { h2: 'Simulador Ejecutivo de Recuperación' },
    { p: 'Ajuste **Descuento al Contado**, **% que acepta cuotas**, **Reducción de Intereses**, **Aumento de Plazo**, **% de Recuperación Parcial**, **% de Pérdida Total** y **Anticipación** y vea recuperado, pérdida asumida, EBITDA y caja en cuatro escenarios. Nada se guarda.' },
    { h2: 'Pérdida Esperada — Provisión PCLD' },
    { p: 'Cuánto tiende a recuperarse en cada plazo (Probable, Improbable) y la **Pérdida Esperada** por rango de atraso. El bloque **Impacto Simulado en el Estado de Resultados** compara el margen actual con el margen tras la provisión; el botón **Guardar provisión en la DRE del período** graba la provisión (exige un cierre del Estado de Resultados en el período; sin él, la pantalla avisa).' },
    { h2: 'Costo de Cobro × Valor Recuperable' },
    { p: 'Informe el costo promedio de cobro por título y Axioma señala títulos que **no vale la pena perseguir** porque cuestan más de lo que recuperan.' },
    { h2: 'Análisis Ejecutivos' },
    { p: 'Mapa de calor, Evolución Mensual, distribución por estado y segmento, Curva ABC de la Morosidad y **Ranking de Mayor Recuperación**.' },

    { h1: 'Central de Negociación del cliente' },
    { p: 'Abra un cliente para ver los **Títulos Abiertos**, la **Estrategia Recomendada** con la probabilidad de recuperar, la **Cronología de Interacciones** y los acuerdos y promesas (Cumplido o Incumplido).' },
    { numerada: [
      'En **Registrar Contacto**, anote lo que se trató.',
      'En **Registrar Negociación**, informe valor, cuotas, descuento, intereses, multa y condiciones, y haga clic en **Guardar Negociación**.',
      'Cuando el cliente pague, haga clic en **Saldar (marcar como pagado)**: es un cobro oficial — entra en el Flujo de Caja, en Ingresos y en la contabilidad, y la deuda pasa a "Recuperado".',
    ] },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['✏️ Editar', 'Edita el título; el valor no puede ser menor que lo ya cobrado.'],
      ['🗑️ Eliminar', 'Pide motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador). Un título con cobro no se puede eliminar.'],
    ] } },
    { nota: 'Si alguna lectura falla, la pantalla avisa que los datos pueden estar incompletos — nunca muestra "nadie moroso" por error.' },
    { nota: 'Mientras los datos cargan, la pantalla muestra la señal de carga — el aviso de "sin datos" solo aparece cuando realmente no hay registros.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
