// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '29 - Comercial - Estoque.docx',
  titulo: 'Manual 29 — Estoque',
  subtitulo: 'Saldo, custo médio, validade e centro de avisos',
  info: ['Menu: Comercial → Estoque  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Controla os produtos, as entradas e saídas, o custo médio e a validade dos lotes. Avisa sobre ruptura, estoque baixo, capital parado e produtos vencendo, e sugere o que repor e o que promover. É integrado ao PDV e às notas fiscais de compra.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **👥 Comercial ▼** → **Estoque**.'] },

    { h1: 'Botões' },
    { p: '**+ Novo Produto**, **+ Nova Movimentação**, **Compartilhar** e o campo de busca (por nome, código, SKU, categoria, marca, fornecedor ou localização; também aceita leitor de código de barras).' },

    { h1: 'Abas' },
    { h2: 'Painel' },
    { p: '**Valor Total em Estoque**, **Produtos Ativos**, **Produtos Inativos**, **Em Ruptura**, **Baixo Estoque**, **Próx. da Validade**, **Vencidos** e **Capital Parado**. Gráficos de **Estoque por Categoria**, **por Fornecedor** e **Entradas × Saídas** (6 meses).' },
    { h2: 'Produtos' },
    { p: 'Lista com nome, código, categoria, saldo, custo médio, preço de venda e status. Selecione vários para **Editar em Lote**. Também: **Exportar Excel/CSV** (exporta todos os produtos do filtro, sem limite de linhas), **Importar Excel/CSV**, **Gerar Etiquetas** e **Imprimir**.' },
    { h2: 'Movimentações' },
    { p: 'Todas as entradas e saídas. Movimentos **Em trânsito** (comprados, aguardando chegada) têm o botão para confirmar o recebimento, e só então entram no saldo.' },
    { h2: 'Avisos' },
    { p: '**Ruptura**, **Baixo estoque**, **Capital parado**, **Custo subindo** e **Validade (FEFO)**: lotes vencidos, no último dia, e em 7, 30, 60 e 90 dias.' },
    { h2: 'Inteligência' },
    { lista: [
      '**Curva ABC / Pareto**: Classe A (alto valor), B, C e itens sem giro.',
      '**Giro e Tempo em Estoque**: giro em 90 dias, consumo por dia, capital imobilizado, dias sem giro.',
      '**Rentabilidade Projetada**: margem pelo preço sugerido × custo médio (não é lucro realizado).',
      '**Ponto de Reposição e Risco de Ruptura**: quando comprar e quantos dias restam (precisa do prazo de entrega no cadastro).',
      '**Comparação de Fornecedores**: preço médio de compra, entregas e última entrada.',
    ] },
    { h2: 'Copiloto' },
    { p: 'Resume o que fazer: o que está **parado há mais tempo**, quanto **dinheiro está parado**, **o que repor**, **o que promover** (Classe C parado) e o **risco de ruptura**. É calculado por regras a partir das movimentações reais.' },

    { h1: 'Passo a passo: cadastrar um produto' },
    { numerada: [
      'Clique em **+ Novo Produto**. Digite o código de barras e use **Buscar dados pelo código de barras** para preencher pelo catálogo (revise antes de salvar).',
      '**Identificação**: nome, códigos (interno, EAN, SKU), categoria, marca, fabricante, fornecedor, unidade.',
      '**Dimensões** e **Localização Física** (rua, prateleira, nível, posição), centro de custo e conta contábil.',
      '**Preços**: custo, markup, preço sugerido, mínimo, promocional e preço de venda (o botão "usar sugestão" aplica o sugerido).',
      '**Fiscal** (opcional): NCM, CEST, CFOP e alíquotas.',
      '**Controle**: estoque mínimo e máximo, lote inicial com validade, imagem e observações.',
      'Clique em **Salvar**.',
    ] },
    { nota: 'O **segmento padrão** da empresa e os até 3 **campos personalizados** valem para a empresa inteira: só o **proprietário** pode mudá-los. Se outra pessoa tentar, o Axioma avisa e não grava.' },
    { h1: 'Passo a passo: movimentação' },
    { p: 'Clique em **+ Nova Movimentação**, escolha o produto e o **Tipo**: Entrada, Saída, Transferência, Perda, Ajuste, Inventário ou Devolução. Informe quantidade, custo unitário, situação (confirmada ou em trânsito), lote e validade (o Axioma sugere o lote que vence primeiro, regra FEFO), documento e motivo.' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápis', 'Edita o produto ou a movimentação.'],
      ['🗑️ Lixeira', 'Pede motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador). Produto com movimentação não é apagado: vira inativo, para manter o histórico. Produto com venda registrada não pode ser excluído.'],
    ] } },
    { nota: 'Avisos, inteligência e listas são lidos sem limite de linhas. Se alguma leitura falhar, a tela avisa que os dados podem estar incompletos — nunca mostra "estoque vazio" por engano.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '29 - Commercial - Inventory.docx',
  titulo: 'Manual 29 — Inventory',
  subtitulo: 'Balance, average cost, expiration and alerts center',
  info: ['Menu: Commercial → Inventory  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Controls products, stock in and out, average cost and batch expiration. Warns about stockouts, low stock, idle capital and expiring products, and suggests what to restock and what to promote. It is integrated with the POS and purchase invoices.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **👥 Commercial ▼** → **Inventory**.'] },

    { h1: 'Buttons' },
    { p: '**+ New Product**, **+ New Movement**, **Share** and the search field (by name, code, SKU, category, brand, supplier or location; also accepts a barcode scanner).' },

    { h1: 'Tabs' },
    { h2: 'Dashboard' },
    { p: '**Total Inventory Value**, **Active Products**, **Inactive Products**, **Out of Stock**, **Low Stock**, **Near Expiration**, **Expired** and **Idle Capital**. Charts of **Inventory by Category**, **by Supplier** and **In × Out** (6 months).' },
    { h2: 'Products' },
    { p: 'List with name, code, category, balance, average cost, sale price and status. Select several to **Bulk Edit**. Also: **Export Excel/CSV** (exports every product in the filter, with no row limit), **Import Excel/CSV**, **Generate Labels** and **Print**.' },
    { h2: 'Movements' },
    { p: 'All stock in and out. **In transit** movements (bought, waiting to arrive) have a button to confirm receipt, and only then enter the balance.' },
    { h2: 'Alerts' },
    { p: '**Stockout**, **Low stock**, **Idle capital**, **Rising cost** and **Expiration (FEFO)**: expired batches, last day, and in 7, 30, 60 and 90 days.' },
    { h2: 'Intelligence' },
    { lista: [
      '**ABC Curve / Pareto**: Class A (high value), B, C and items with no turnover.',
      '**Turnover and Time in Stock**: 90-day turnover, daily consumption, tied-up capital, days without turnover.',
      '**Projected Profitability**: margin from suggested price × average cost (not realized profit).',
      '**Reorder Point and Stockout Risk**: when to buy and how many days are left (needs the lead time in the record).',
      '**Supplier Comparison**: average purchase price, deliveries and last entry.',
    ] },
    { h2: 'Copilot' },
    { p: 'Summarizes what to do: what has been **idle the longest**, how much **money is idle**, **what to restock**, **what to promote** (idle Class C) and the **stockout risk**. It is calculated by rules from real movements.' },

    { h1: 'Step by step: registering a product' },
    { numerada: [
      'Click **+ New Product**. Type the barcode and use **Fetch data by barcode** to fill it in from the catalog (review before saving).',
      '**Identification**: name, codes (internal, EAN, SKU), category, brand, manufacturer, supplier, unit.',
      '**Dimensions** and **Physical Location** (aisle, shelf, level, position), cost center and ledger account.',
      '**Prices**: cost, markup, suggested, minimum, promotional and sale price (the "use suggestion" button applies the suggested one).',
      '**Tax** (optional): NCM, CEST, CFOP and rates.',
      '**Control**: minimum and maximum stock, initial batch with expiration, image and notes.',
      'Click **Save**.',
    ] },
    { nota: 'The company’s **default segment** and up to 3 **custom fields** apply to the whole company: only the **owner** can change them. If someone else tries, Axioma warns and does not save.' },
    { h1: 'Step by step: movement' },
    { p: 'Click **+ New Movement**, choose the product and the **Type**: In, Out, Transfer, Loss, Adjustment, Count or Return. Enter quantity, unit cost, status (confirmed or in transit), batch and expiration (Axioma suggests the batch that expires first, FEFO rule), document and reason.' },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['✏️ Pencil', 'Edits the product or the movement.'],
      ['🗑️ Trash', 'Asks for a reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator). A product with movements is not deleted: it becomes inactive, to keep the history. A product with a recorded sale cannot be deleted.'],
    ] } },
    { nota: 'Alerts, intelligence and lists are read with no row limit. If any loading fails, the screen warns that the data may be incomplete — it never shows an "empty inventory" by mistake.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '29 - Comercial - Inventario.docx',
  titulo: 'Manual 29 — Inventario',
  subtitulo: 'Saldo, costo promedio, vencimiento y centro de avisos',
  info: ['Menú: Comercial → Inventario  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Controla los productos, las entradas y salidas, el costo promedio y el vencimiento de los lotes. Avisa sobre quiebre de stock, stock bajo, capital inmovilizado y productos por vencer, y sugiere qué reponer y qué promocionar. Está integrado al PDV y a las facturas de compra.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **👥 Comercial ▼** → **Inventario**.'] },

    { h1: 'Botones' },
    { p: '**+ Nuevo Producto**, **+ Nuevo Movimiento**, **Compartir** y el campo de búsqueda (por nombre, código, SKU, categoría, marca, proveedor o ubicación; también acepta lector de código de barras).' },

    { h1: 'Pestañas' },
    { h2: 'Panel' },
    { p: '**Valor Total en Inventario**, **Productos Activos**, **Productos Inactivos**, **En Quiebre**, **Stock Bajo**, **Próx. a Vencer**, **Vencidos** y **Capital Inmovilizado**. Gráficos de **Inventario por Categoría**, **por Proveedor** y **Entradas × Salidas** (6 meses).' },
    { h2: 'Productos' },
    { p: 'Lista con nombre, código, categoría, saldo, costo promedio, precio de venta y estado. Seleccione varios para **Editar en Lote**. También: **Exportar Excel/CSV** (exporta todos los productos del filtro, sin límite de filas), **Importar Excel/CSV**, **Generar Etiquetas** e **Imprimir**.' },
    { h2: 'Movimientos' },
    { p: 'Todas las entradas y salidas. Los movimientos **En tránsito** (comprados, esperando llegar) tienen el botón para confirmar la recepción, y solo entonces entran al saldo.' },
    { h2: 'Avisos' },
    { p: '**Quiebre**, **Stock bajo**, **Capital inmovilizado**, **Costo en alza** y **Vencimiento (FEFO)**: lotes vencidos, en el último día, y en 7, 30, 60 y 90 días.' },
    { h2: 'Inteligencia' },
    { lista: [
      '**Curva ABC / Pareto**: Clase A (alto valor), B, C e ítems sin rotación.',
      '**Rotación y Tiempo en Inventario**: rotación en 90 días, consumo diario, capital inmovilizado, días sin rotación.',
      '**Rentabilidad Proyectada**: margen por precio sugerido × costo promedio (no es utilidad realizada).',
      '**Punto de Reposición y Riesgo de Quiebre**: cuándo comprar y cuántos días quedan (necesita el plazo de entrega en el registro).',
      '**Comparación de Proveedores**: precio promedio de compra, entregas y última entrada.',
    ] },
    { h2: 'Copiloto' },
    { p: 'Resume qué hacer: lo que está **parado hace más tiempo**, cuánto **dinero está parado**, **qué reponer**, **qué promocionar** (Clase C parada) y el **riesgo de quiebre**. Se calcula por reglas a partir de los movimientos reales.' },

    { h1: 'Paso a paso: registrar un producto' },
    { numerada: [
      'Haga clic en **+ Nuevo Producto**. Escriba el código de barras y use **Buscar datos por el código de barras** para completar desde el catálogo (revise antes de guardar).',
      '**Identificación**: nombre, códigos (interno, EAN, SKU), categoría, marca, fabricante, proveedor, unidad.',
      '**Dimensiones** y **Ubicación Física** (pasillo, estante, nivel, posición), centro de costo y cuenta contable.',
      '**Precios**: costo, markup, precio sugerido, mínimo, promocional y precio de venta (el botón "usar sugerencia" aplica el sugerido).',
      '**Fiscal** (opcional): NCM, CEST, CFOP y alícuotas.',
      '**Control**: stock mínimo y máximo, lote inicial con vencimiento, imagen y observaciones.',
      'Haga clic en **Guardar**.',
    ] },
    { nota: 'El **segmento estándar** de la empresa y los hasta 3 **campos personalizados** valen para toda la empresa: solo el **propietario** puede cambiarlos. Si otra persona lo intenta, Axioma avisa y no guarda.' },
    { h1: 'Paso a paso: movimiento' },
    { p: 'Haga clic en **+ Nuevo Movimiento**, elija el producto y el **Tipo**: Entrada, Salida, Transferencia, Pérdida, Ajuste, Inventario o Devolución. Informe cantidad, costo unitario, situación (confirmada o en tránsito), lote y vencimiento (Axioma sugiere el lote que vence primero, regla FEFO), documento y motivo.' },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápiz', 'Edita el producto o el movimiento.'],
      ['🗑️ Papelera', 'Pide motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador). Un producto con movimientos no se borra: pasa a inactivo, para mantener el historial. Un producto con venta registrada no se puede eliminar.'],
    ] } },
    { nota: 'Avisos, inteligencia y listas se leen sin límite de filas. Si alguna lectura falla, la pantalla avisa que los datos pueden estar incompletos — nunca muestra "inventario vacío" por error.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
