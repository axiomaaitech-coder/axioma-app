// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '46 - Rastreabilidade.docx',
  titulo: 'Manual 46 — Rastreabilidade',
  subtitulo: 'O caminho de cada dinheiro: por quais módulos ele precisava passar e se chegou em todos',
  info: ['Menu: Contabilidade → Rastreabilidade  •  Manual de uso do Axioma AI.Tech  •  Versão 1.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'No Axioma cada módulo é uma **porta**: quando o dinheiro entra ou sai (uma conta paga, um recebimento, uma receita, um custo, um empréstimo, uma conta que nasce), ele precisa chegar em todos os módulos que dependem dele — **Contabilidade**, **Fluxo de Caixa** e **Receitas/Custos e DRE**. Esta tela mostra esse caminho para cada movimentação e se ele terminou.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Contabilidade ▼** → **Rastreabilidade**.', 'Em Contas a Pagar e Contas a Receber, o ícone 🔗 de cada conta.'] },

    { h1: 'O Guardião' },
    { p: 'Ao abrir o Axioma e a cada 5 minutos, o **Guardião** procura caminhos que pararam no meio (internet caiu, navegador fechou) e termina sozinho — sem nunca lançar duas vezes. Uma vez por dia ele também gera a conta do mês de cada custo fixo vigente.' },

    { h1: 'Botões e filtros' },
    { tabela: { colunas: ['Elemento', 'O que faz', 'O que acontece depois'], larguras: [2600, 3400, 3026], linhas: [
      ['**Houve falha? Resolver com a Inteligência do Axioma**', 'Refaz o caminho de tudo o que falhou ou está a caminho e explica.', 'Aparece "Refazendo o caminho…" e depois "Tudo em ordem" ou, para o que não deu, o quadro **Inteligência do Axioma** com a causa e **O que fazer**.'],
      ['Filtros **Todos**, **Com falha**, **A caminho**', 'Mostram só aquele grupo, com a contagem.', 'A lista muda na hora.'],
      ['**Ir para …**', 'Abre o módulo de origem da movimentação.', 'Ex.: Dívidas, Contas a Pagar.'],
      ['**Ver histórico da conta**', 'Abre o histórico completo da conta.', 'Criação, aprovação, cada pagamento, juros e quanto falta.'],
    ] } },

    { h1: 'Cada movimentação' },
    { p: 'Mostra o tipo (Pagamento a fornecedor, Recebimento, Lançamento manual, Nova conta…), a descrição, o valor (+ entrada / − saída), a **data do movimento** e quando foi **registrado**, **Nasceu em** (o módulo de origem) e, se veio de nota, o arquivo e se foi lido por regra ou pela IA e conferido por humano. Juros/multa aparecem à parte.' },
    { tabela: { colunas: ['Selo do destino', 'Significado'], larguras: [2600, 6426], linhas: [
      ['✓ Chegou', 'O lançamento foi gravado nesse módulo (conferido de verdade, não só tentado).'],
      ['🕒 A caminho', 'Ainda vai chegar; o Guardião termina.'],
      ['✗ Falhou', 'Não chegou; mostra o motivo e quantas tentativas. Use o botão de resolver.'],
      ['— Não se aplica', 'Esse módulo não recebe esse tipo de dinheiro (ex.: pagamento de empréstimo não vai para a DRE).'],
    ] } },
    { nota: 'Lançamentos automáticos têm o selo **Origem: …** nas outras telas e só são editados na origem — assim nenhum módulo fica diferente do outro.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '46 - Traceability.docx',
  titulo: 'Manual 46 — Traceability',
  subtitulo: 'The path of every money movement: which modules it had to reach and whether it reached all of them',
  info: ['Menu: Accounting → Traceability  •  Axioma AI.Tech user manual  •  Version 1.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'In Axioma each module is a **door**: when money comes in or goes out (a paid bill, a receipt, revenue, a cost, a loan, a new bill), it must reach every module that depends on it — **Accounting**, **Cash Flow** and **Revenue/Costs and P&L**. This screen shows that path for each movement and whether it finished.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Accounting ▼** → **Traceability**.', 'In Payables and Receivables, the 🔗 icon on each bill.'] },

    { h1: 'The Guardian' },
    { p: 'When Axioma opens and every 5 minutes, the **Guardian** looks for paths that stopped midway (internet dropped, browser closed) and finishes them — never posting twice. Once a day it also creates the month\'s bill for each valid fixed cost.' },

    { h1: 'Buttons and filters' },
    { tabela: { colunas: ['Element', 'What it does', 'What happens next'], larguras: [2600, 3400, 3026], linhas: [
      ['**Something failed? Resolve with Axioma Intelligence**', 'Redoes the path of everything that failed or is on the way and explains it.', '"Redoing the path…" appears, then "All in order" or, for what did not work, the **Axioma Intelligence** box with the cause and **What to do**.'],
      ['**All**, **Failed**, **On the way** filters', 'Show only that group, with the count.', 'The list changes right away.'],
      ['**Go to …**', 'Opens the movement\'s source module.', 'E.g., Debts, Payables.'],
      ['**View bill history**', 'Opens the bill\'s full history.', 'Creation, approval, each payment, interest and what is left.'],
    ] } },

    { h1: 'Each movement' },
    { p: 'Shows the type (Supplier payment, Receipt, Manual entry, New bill…), the description, the amount (+ inflow / − outflow), the **movement date** and when it was **recorded**, **Born in** (source module) and, if it came from an invoice, the file and whether it was read by rule or by AI and checked by a human. Interest/fees show separately.' },
    { tabela: { colunas: ['Destination tag', 'Meaning'], larguras: [2600, 6426], linhas: [
      ['✓ Arrived', 'The entry was saved in that module (actually checked, not just attempted).'],
      ['🕒 On the way', 'Still to arrive; the Guardian finishes it.'],
      ['✗ Failed', 'Did not arrive; shows the reason and the number of attempts. Use the resolve button.'],
      ['— Not applicable', 'That module does not take this kind of money (e.g., a loan payment does not go to the P&L).'],
    ] } },
    { nota: 'Automatic entries carry the **Origin: …** tag on other screens and are edited only at the source — so no module ever differs from another.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '46 - Trazabilidad.docx',
  titulo: 'Manual 46 — Trazabilidad',
  subtitulo: 'El camino de cada dinero: por qué módulos tenía que pasar y si llegó a todos',
  info: ['Menú: Contabilidad → Trazabilidad  •  Manual de uso de Axioma AI.Tech  •  Versión 1.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'En Axioma cada módulo es una **puerta**: cuando el dinero entra o sale (una cuenta pagada, un cobro, un ingreso, un costo, un préstamo, una cuenta que nace), tiene que llegar a todos los módulos que dependen de él — **Contabilidad**, **Flujo de Caja** e **Ingresos/Costos y Estado de Resultados**. Esta pantalla muestra ese camino para cada movimiento y si terminó.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Contabilidad ▼** → **Trazabilidad**.', 'En Cuentas por Pagar y Cuentas por Cobrar, el ícono 🔗 de cada cuenta.'] },

    { h1: 'El Guardián' },
    { p: 'Al abrir Axioma y cada 5 minutos, el **Guardián** busca caminos que quedaron a la mitad (se cayó internet, se cerró el navegador) y los termina solo — sin registrar nunca dos veces. Una vez al día también genera la cuenta del mes de cada costo fijo vigente.' },

    { h1: 'Botones y filtros' },
    { tabela: { colunas: ['Elemento', 'Qué hace', 'Qué pasa después'], larguras: [2600, 3400, 3026], linhas: [
      ['**¿Hubo falla? Resolver con la Inteligencia de Axioma**', 'Rehace el camino de todo lo que falló o está en camino y lo explica.', 'Aparece "Rehaciendo el camino…" y después "Todo en orden" o, para lo que no salió, el cuadro **Inteligencia de Axioma** con la causa y **Qué hacer**.'],
      ['Filtros **Todos**, **Con falla**, **En camino**', 'Muestran solo ese grupo, con el conteo.', 'La lista cambia al instante.'],
      ['**Ir a …**', 'Abre el módulo de origen del movimiento.', 'Ej.: Deudas, Cuentas por Pagar.'],
      ['**Ver historial de la cuenta**', 'Abre el historial completo de la cuenta.', 'Creación, aprobación, cada pago, intereses y cuánto falta.'],
    ] } },

    { h1: 'Cada movimiento' },
    { p: 'Muestra el tipo (Pago a proveedor, Cobro, Registro manual, Nueva cuenta…), la descripción, el valor (+ entrada / − salida), la **fecha del movimiento** y cuándo se **registró**, **Nació en** (módulo de origen) y, si vino de una factura, el archivo y si fue leída por regla o por la IA y revisada por una persona. Intereses/multa aparecen aparte.' },
    { tabela: { colunas: ['Etiqueta del destino', 'Significado'], larguras: [2600, 6426], linhas: [
      ['✓ Llegó', 'El registro se guardó en ese módulo (verificado de verdad, no solo intentado).'],
      ['🕒 En camino', 'Todavía va a llegar; el Guardián lo termina.'],
      ['✗ Falló', 'No llegó; muestra el motivo y cuántos intentos. Use el botón de resolver.'],
      ['— No aplica', 'Ese módulo no recibe ese tipo de dinero (ej.: el pago de un préstamo no va al Estado de Resultados).'],
    ] } },
    { nota: 'Los registros automáticos llevan la etiqueta **Origen: …** en las otras pantallas y solo se editan en el origen — así ningún módulo queda distinto de otro.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
