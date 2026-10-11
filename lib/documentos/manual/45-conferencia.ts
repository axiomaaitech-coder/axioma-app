// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '45 - Conferência entre módulos.docx',
  titulo: 'Manual 45 — Conferência entre módulos',
  subtitulo: 'Os números batem? DRE × Contabilidade e contas × Fluxo de Caixa, mês a mês — e a correção dos casos antigos',
  info: ['Menu: Contabilidade → Conferência  •  Manual de uso do Axioma AI.Tech  •  Versão 1.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Confere se o mesmo dinheiro aparece igual em todos os lugares. Compara, mês a mês, pares que usam o **mesmo critério** — senão a diferença seria do critério, não um erro. Também lista os **casos antigos** (de antes do motor de rastreabilidade) e deixa corrigir cada um.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Contabilidade ▼** → **Conferência**.', 'Faixa vermelha **"❌ Conferência de hoje"** no topo de qualquer tela → **Ver conferência**.'] },

    { h1: 'Conferência diária automática' },
    { p: 'Uma vez por dia, ao abrir o Axioma, a conferência roda sozinha no mês atual e no anterior. Se algum par não bater, aparece no topo de todas as telas a faixa **"❌ Conferência de hoje: X diferenças entre módulos"**. Clique nela para ver mês, par e diferença em R$; **Ver conferência** abre esta tela; **Ocultar hoje** esconde até amanhã. Ela recalcula quando você salva algo.' },

    { h1: 'Tabela mês a mês' },
    { tabela: { colunas: ['Par', 'O que compara'], larguras: [3000, 6026], linhas: [
      ['Receita: DRE × Contabilidade', 'A receita da DRE (competência) contra as contas de receita (grupo 6) da Contabilidade.'],
      ['Custos: DRE × Contabilidade', 'Custos variáveis + fixos da DRE contra as despesas (grupos 7 e 8).'],
      ['Contas pagas × Fluxo de Caixa', 'O que foi pago em Contas a Pagar contra as saídas do Fluxo vindas delas.'],
      ['Contas recebidas × Fluxo de Caixa', 'O que foi recebido em Contas a Receber contra as entradas do Fluxo vindas delas.'],
    ] } },
    { p: 'Cada célula mostra **✓ bate** com o valor ou **✗ diferença R$ X**. Passe o mouse para ver os dois lados. Use as abas de ano para trocar o ano.' },

    { h1: 'Casos antigos para corrigir' },
    { p: 'Cada caso mostra o registro, o **Antes**, o **Depois**, o que muda em cada módulo e o **risco de duplicar**. Nada muda até você clicar — um caso por vez.' },
    { tabela: { colunas: ['Caso', 'O que é', 'Botão'], larguras: [2600, 3600, 2826], linhas: [
      ['D3 / D4 — Pagamento sem rastro', 'Conta paga (toda ou em parte) que não chegou ao Fluxo e à Contabilidade.', '**Corrigir este caso**'],
      ['D5 — Receita fora da Contabilidade', 'Receita recebida sem lançamento contábil.', '**Corrigir este caso**'],
      ['D7 — Receita pendente sem conta a receber', 'Receita "pendente" que o caixa nunca espera.', 'Escolha o **Vencimento** e clique **Criar a conta a receber**. A receita fica ligada à conta — a DRE não conta duas vezes e nada é apagado.'],
    ] } },
    { p: 'Quando a prévia aponta **risco de duplicar** (já existe um lançamento igual no Fluxo), aparecem dois botões: **Corrigir sem mexer no Fluxo (já está lá)** — lança só nas outras portas — e **Corrigir tudo (é outro dinheiro)**. Depois de corrigir, a conferência recalcula sozinha.' },
    { nota: 'A correção passa pelo mesmo motor de um lançamento normal: o resultado é igual a ter sido lançado certo desde o começo. Se o caso já foi resolvido por outro caminho, a tela avisa e não faz nada.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '45 - Cross-module reconciliation.docx',
  titulo: 'Manual 45 — Cross-module reconciliation',
  subtitulo: 'Do the numbers match? P&L × Accounting and bills × Cash Flow, month by month — and fixing old cases',
  info: ['Menu: Accounting → Reconciliation  •  Axioma AI.Tech user manual  •  Version 1.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Checks that the same money shows the same everywhere. It compares, month by month, pairs that use the **same criterion** — otherwise the difference would be the criterion, not an error. It also lists **old cases** (from before the traceability engine) and lets you fix each one.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Accounting ▼** → **Reconciliation**.', 'Red banner **"❌ Today\'s check"** at the top of any screen → **View check**.'] },

    { h1: 'Automatic daily check' },
    { p: 'Once a day, when Axioma opens, the check runs on its own for the current and previous month. If a pair does not match, the banner **"❌ Today\'s check: X differences between modules"** appears at the top of every screen. Click it to see month, pair and difference in R$; **View check** opens this screen; **Hide today** hides it until tomorrow. It recalculates when you save something.' },

    { h1: 'Month-by-month table' },
    { tabela: { colunas: ['Pair', 'What it compares'], larguras: [3000, 6026], linhas: [
      ['Revenue: P&L × Accounting', 'P&L revenue (accrual) against the revenue accounts (group 6) in Accounting.'],
      ['Costs: P&L × Accounting', 'P&L variable + fixed costs against expenses (groups 7 and 8).'],
      ['Paid bills × Cash Flow', 'What was paid in Payables against Cash Flow outflows coming from them.'],
      ['Received bills × Cash Flow', 'What was received in Receivables against Cash Flow inflows coming from them.'],
    ] } },
    { p: 'Each cell shows **✓ matches** with the amount or **✗ difference R$ X**. Hover to see both sides. Use the year tabs to change the year.' },

    { h1: 'Old cases to fix' },
    { p: 'Each case shows the record, **Before**, **After**, what changes in each module and the **duplication risk**. Nothing changes until you click — one case at a time.' },
    { tabela: { colunas: ['Case', 'What it is', 'Button'], larguras: [2600, 3600, 2826], linhas: [
      ['D3 / D4 — Payment without a trace', 'A paid bill (fully or partly) that never reached Cash Flow and Accounting.', '**Fix this case**'],
      ['D5 — Revenue missing from Accounting', 'Received revenue with no accounting entry.', '**Fix this case**'],
      ['D7 — Pending revenue with no receivable', '"Pending" revenue that cash never expects.', 'Pick the **Due date** and click **Create the receivable**. The revenue is linked to the bill — the P&L does not count it twice and nothing is deleted.'],
    ] } },
    { p: 'When the preview points to **duplication risk** (a matching entry already exists in Cash Flow), two buttons appear: **Fix without touching Cash Flow (already there)** — posts only to the other modules — and **Fix everything (different money)**. After fixing, the check recalculates on its own.' },
    { nota: 'The fix goes through the same engine as a normal entry: the result is the same as if it had been entered correctly from the start. If the case was already resolved another way, the screen says so and does nothing.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '45 - Conciliación entre módulos.docx',
  titulo: 'Manual 45 — Conciliación entre módulos',
  subtitulo: '¿Cuadran los números? Estado de Resultados × Contabilidad y cuentas × Flujo de Caja, mes a mes — y la corrección de casos antiguos',
  info: ['Menú: Contabilidad → Conciliación  •  Manual de uso de Axioma AI.Tech  •  Versión 1.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Verifica que el mismo dinero aparezca igual en todos lados. Compara, mes a mes, pares que usan el **mismo criterio** — si no, la diferencia sería del criterio, no un error. También lista los **casos antiguos** (de antes del motor de trazabilidad) y permite corregir cada uno.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Contabilidad ▼** → **Conciliación**.', 'Franja roja **"❌ Conciliación de hoy"** arriba de cualquier pantalla → **Ver conciliación**.'] },

    { h1: 'Conciliación diaria automática' },
    { p: 'Una vez al día, al abrir Axioma, la conciliación corre sola en el mes actual y el anterior. Si algún par no cuadra, aparece arriba de todas las pantallas la franja **"❌ Conciliación de hoy: X diferencias entre módulos"**. Haga clic para ver mes, par y diferencia en R$; **Ver conciliación** abre esta pantalla; **Ocultar hoy** la esconde hasta mañana. Se recalcula cuando usted guarda algo.' },

    { h1: 'Tabla mes a mes' },
    { tabela: { colunas: ['Par', 'Qué compara'], larguras: [3000, 6026], linhas: [
      ['Ingreso: Estado de Resultados × Contabilidad', 'El ingreso del Estado de Resultados (devengo) contra las cuentas de ingreso (grupo 6) de la Contabilidad.'],
      ['Costos: Estado de Resultados × Contabilidad', 'Costos variables + fijos contra los gastos (grupos 7 y 8).'],
      ['Cuentas pagadas × Flujo de Caja', 'Lo pagado en Cuentas por Pagar contra las salidas del Flujo que vienen de ellas.'],
      ['Cuentas cobradas × Flujo de Caja', 'Lo cobrado en Cuentas por Cobrar contra las entradas del Flujo que vienen de ellas.'],
    ] } },
    { p: 'Cada celda muestra **✓ cuadra** con el valor o **✗ diferencia R$ X**. Pase el mouse para ver los dos lados. Use las pestañas de año para cambiar el año.' },

    { h1: 'Casos antiguos para corregir' },
    { p: 'Cada caso muestra el registro, el **Antes**, el **Después**, qué cambia en cada módulo y el **riesgo de duplicar**. Nada cambia hasta que haga clic — un caso a la vez.' },
    { tabela: { colunas: ['Caso', 'Qué es', 'Botón'], larguras: [2600, 3600, 2826], linhas: [
      ['D3 / D4 — Pago sin rastro', 'Cuenta pagada (toda o en parte) que no llegó al Flujo ni a la Contabilidad.', '**Corregir este caso**'],
      ['D5 — Ingreso fuera de la Contabilidad', 'Ingreso cobrado sin asiento contable.', '**Corregir este caso**'],
      ['D7 — Ingreso pendiente sin cuenta por cobrar', 'Ingreso "pendiente" que la caja nunca espera.', 'Elija el **Vencimiento** y haga clic en **Crear la cuenta por cobrar**. El ingreso queda vinculado a la cuenta — el Estado de Resultados no lo cuenta dos veces y nada se borra.'],
    ] } },
    { p: 'Cuando la vista previa señala **riesgo de duplicar** (ya existe un registro igual en el Flujo), aparecen dos botones: **Corregir sin tocar el Flujo (ya está)** — registra solo en los otros módulos — y **Corregir todo (es otro dinero)**. Después de corregir, la conciliación se recalcula sola.' },
    { nota: 'La corrección pasa por el mismo motor que un registro normal: el resultado es igual a haberlo registrado bien desde el inicio. Si el caso ya se resolvió por otro camino, la pantalla avisa y no hace nada.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
