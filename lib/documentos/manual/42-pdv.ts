// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '42 - PDV - Ponto de Venda.docx',
  titulo: 'Manual 42 — PDV (Ponto de Venda)',
  subtitulo: 'Catálogo, frente de caixa, fechamento e retaguarda',
  info: ['Menu: PDV (barra superior)  •  Manual de uso do Axioma AI.Tech  •  Versão 2.1 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O PDV é o caixa da loja dentro do Axioma: cadastra produtos, vende, baixa o estoque, emite o cupom e fecha o caixa. Cada venda já entra nas receitas, no estoque, no saldo de caixa e nos indicadores, sem digitar de novo.' },
    { p: 'O PDV tem cinco áreas: **Catálogo**, **Cadastro**, **Importar XML da NF-e**, **Frente de Caixa** e **Retaguarda**.' },

    { h1: 'Catálogo' },
    { p: 'Navegue por **nicho** (Alimentos, Não-Alimentos), **categoria** e **sub-nicho** até os produtos (todas as categorias aparecem, sem limite de produtos). O modo pode ser **Produto**, **Misto** ou **Serviço**. Busque por nome, SKU ou código de barras. Cada produto mostra estoque e preço, com **Editar** e **Excluir** (produto com venda não pode ser excluído; excluir pede motivo e e-mail e senha de um supervisor). Botões: **+ Novo Produto/Serviço**, **Importar XML da NF-e**, **Frente de Caixa** e **Produtos Cadastrados**.' },

    { h1: 'Cadastro inteligente' },
    { p: 'Feito para digitar o mínimo. Escolha nicho, categoria e sub-nicho e use um dos modos:' },
    { lista: [
      '**Cadastro Único**: preencha nome, marca, preço de venda, unidade, estoque mínimo e status. O Axioma tenta preencher pelo catálogo de códigos de barras ("Preenchido pelo catálogo — confira") ou dá uma **sugestão automática** para você confirmar.',
      '**Bipagem em Massa**: bipe um produto atrás do outro. Os itens salvos aparecem na lista da sessão, com **Desfazer**, **Editar** e **Pular**. Se o código já existe, o produto abre para edição.',
    ] },

    { h1: 'Importar XML da NF-e (compra)' },
    { numerada: [
      'Escolha o nicho da nota e envie o arquivo **.xml**.',
      'O fornecedor é reconhecido (ou será cadastrado automaticamente ao confirmar).',
      'Para cada item, o Axioma diz se é **Produto novo** ou **Já existe no catálogo** e sugere categoria e sub-nicho.',
      'Defina o preço de venda (ou aplique uma **margem sobre o custo** a todos os itens novos), informe se veio em fardo/caixa e quantas unidades tem, e marque **Incluir**.',
      'Clique em **Confirmar e Gravar**. O estoque entra, a conferência compara a nota com o recebimento e as contas a pagar, e o Axioma avisa se encontrou divergência.',
    ] },
    { nota: 'A mesma nota (mesma chave de acesso) não pode ser importada duas vezes. Se a conferência não conseguir checar isso (falha de conexão), nada é importado e a tela pede para tentar de novo. Lote e validade presentes na nota são detectados.' },

    { h1: 'Frente de Caixa (vender)' },
    { numerada: [
      'Escolha o caixa que vai operar e, se não houver turno aberto, clique em **Abrir Caixa** informando o **fundo de troco**.',
      'Bipe o código de barras ou digite nome/SKU. O item entra na **Lista de Produtos** com valor unitário e total.',
      'Clique em **Finalizar Venda** (ou F2), escolha a forma de pagamento (Dinheiro, Débito, Crédito, Outro), informe o valor recebido (o troco é calculado) e, se quiser, o CPF na nota.',
      'Clique em **Confirmar Venda**. O estoque baixa e o cupom é gerado.',
    ] },
    { tabela: { colunas: ['Atalho', 'Função'], larguras: [2400, 6626], linhas: [
      ['Enter', 'Adicionar item'],
      ['F2', 'Finalizar venda'],
      ['Delete', 'Remover o último item'],
      ['Esc', 'Fechar ou cancelar'],
    ] } },
    { p: 'O cupom (não fiscal) mostra os itens, o valor aproximado dos tributos (Lei 12.741/2012), o operador e o caixa. Pode ser impresso em **impressora térmica** pelo programa **QZ Tray** ou pela tela; em **Impressão** você testa a conexão, liga a impressão automática e define a mensagem de rodapé (essa configuração vale para a empresa toda e só o **proprietário** pode mudá-la — para os outros, o Axioma avisa).' },
    { alerta: '**Preço é decisão do dono.** Se um produto não tem preço de venda, só o proprietário ou um administrador pode defini-lo. O operador de caixa nunca define preço. Venda sem estoque suficiente também pede autorização.' },

    { h1: 'Retaguarda (acompanhar e fechar o caixa)' },
    { p: 'Protegida por senha, para o caso de o dono se afastar do caixa. Na primeira vez, três perguntas configuram o acompanhamento: **ao vivo**, **só fechamento** ou **os dois**; se quer **conferir a gaveta**; e se quer ver **lucro real e margem** (dá para mudar depois em **Configurar**).' },
    { lista: [
      '**Indicadores do dia**: total vendido, número de vendas, ticket médio e lucro real (avisa quando há item sem custo cadastrado).',
      '**Vendas por categoria, sub-nicho e produto**, com horário, valor e lucro, e quanto o estoque baixou.',
      '**Itens vendidos com prejuízo hoje**, com o cálculo.',
      '**Sangria** e **Suprimento**: registre retiradas e reforços de dinheiro com motivo; dá para editar valor e motivo ou excluir (excluir pede supervisor).',
      '**Fechamento**: informe o valor contado na gaveta (há **Calculadora** e **Contagem de gaveta** por notas e moedas). O Axioma compara **Esperado × Contado** e mostra a **Diferença** (sobra, falta ou "Bateu certinho"), com a composição do esperado: fundo de abertura + vendas em dinheiro + suprimentos − sangrias.',
    ] },
    { nota: 'Fechar o caixa não pode ser desfeito: o turno é marcado como fechado. O papel **Caixa** dá acesso só ao PDV, sem o restante do Axioma.' },

    { h1: 'Ditado por voz' },
    { p: 'Quando o ditado estiver liberado para a sua empresa, aparece um botão de microfone na busca de produto (o único campo do caixa com ditado: valores, CPF, preço e senha continuam só digitados). Toque e fale (ou segure e solte); o navegador pede permissão ao microfone só no primeiro uso. Para sozinho depois de um silêncio ou em 60 segundos, e o botão ✕ cancela. O texto entra no campo, junto do que você já tinha digitado, para você revisar — **nada é enviado nem gravado sozinho**. Cada ditado concluído usa 1 pergunta de IA comum do saldo; falha, silêncio ou áudio não entendido não consome. O áudio não é guardado pelo Axioma.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '42 - POS - Point of Sale.docx',
  titulo: 'Manual 42 — POS (Point of Sale)',
  subtitulo: 'Catalog, checkout, closing and back office',
  info: ['Menu: POS (top bar)  •  Axioma AI.Tech user manual  •  Version 2.1 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'The POS is the store’s cash register inside Axioma: it registers products, sells, lowers inventory, issues the receipt and closes the register. Each sale goes straight into revenue, inventory, the cash balance and the indicators, with no retyping.' },
    { p: 'The POS has five areas: **Catalog**, **Registration**, **Import NF-e XML**, **Checkout** and **Back Office**.' },

    { h1: 'Catalog' },
    { p: 'Browse by **niche** (Food, Non-Food), **category** and **sub-niche** down to the products (every category appears, with no product limit). The mode can be **Product**, **Mixed** or **Service**. Search by name, SKU or barcode. Each product shows stock and price, with **Edit** and **Delete** (a product with sales cannot be deleted; deleting asks for a reason and a supervisor’s email and password). Buttons: **+ New Product/Service**, **Import NF-e XML**, **Checkout** and **Registered Products**.' },

    { h1: 'Smart registration' },
    { p: 'Built so you type as little as possible. Choose niche, category and sub-niche and use one of the modes:' },
    { lista: [
      '**Single Registration**: fill in name, brand, sale price, unit, minimum stock and status. Axioma tries to fill it from the barcode catalog ("Filled from the catalog — check it") or gives an **automatic suggestion** for you to confirm.',
      '**Bulk Scanning**: scan one product after another. Saved items appear in the session list, with **Undo**, **Edit** and **Skip**. If the code already exists, the product opens for editing.',
    ] },

    { h1: 'Import NF-e XML (purchase)' },
    { numerada: [
      'Choose the invoice’s niche and upload the **.xml** file.',
      'The supplier is recognized (or will be registered automatically when you confirm).',
      'For each item, Axioma says whether it is a **New product** or **Already in catalog** and suggests category and sub-niche.',
      'Set the sale price (or apply a **margin over cost** to all new items), say whether it came in packs/boxes and how many units, and check **Include**.',
      'Click **Confirm and Save**. Stock comes in, matching compares the invoice with the receipt and payables, and Axioma warns if it finds a discrepancy.',
    ] },
    { nota: 'The same invoice (same access key) cannot be imported twice. If the check cannot be done (connection failure), nothing is imported and the screen asks you to try again. Batch and expiration in the invoice are detected.' },

    { h1: 'Checkout (selling)' },
    { numerada: [
      'Choose the register you will operate and, if no shift is open, click **Open Register** entering the **change float**.',
      'Scan the barcode or type name/SKU. The item enters the **Product List** with unit and total price.',
      'Click **Finish Sale** (or F2), choose the payment method (Cash, Debit, Credit, Other), enter the amount received (change is calculated) and, if you want, the CPF on the receipt.',
      'Click **Confirm Sale**. Stock goes down and the receipt is generated.',
    ] },
    { tabela: { colunas: ['Shortcut', 'Function'], larguras: [2400, 6626], linhas: [
      ['Enter', 'Add item'],
      ['F2', 'Finish sale'],
      ['Delete', 'Remove the last item'],
      ['Esc', 'Close or cancel'],
    ] } },
    { p: 'The receipt (non-fiscal) shows the items, the approximate tax amount (Law 12.741/2012), the operator and the register. It can be printed on a **thermal printer** through the **QZ Tray** program or from the screen; in **Printing** you test the connection, turn on automatic printing and set the footer message (this setting applies to the whole company and only the **owner** can change it — for others, Axioma warns).' },
    { alerta: '**Price is the owner’s decision.** If a product has no sale price, only the owner or an administrator can set it. The cashier never sets a price. Selling without enough stock also requires authorization.' },

    { h1: 'Back Office (tracking and closing the register)' },
    { p: 'Password-protected, in case the owner steps away from the register. The first time, three questions set up tracking: **live**, **closing only** or **both**; whether to **check the drawer**; and whether to see **real profit and margin** (you can change it later in **Configure**).' },
    { lista: [
      '**Today’s indicators**: total sold, number of sales, average ticket and real profit (warns when an item has no registered cost).',
      '**Sales by category, sub-niche and product**, with time, amount and profit, and how much stock went down.',
      '**Items sold at a loss today**, with the calculation.',
      '**Cash withdrawal** and **Cash supply**: record cash removals and top-ups with a reason; you can edit amount and reason or delete (deleting asks for a supervisor).',
      '**Closing**: enter the amount counted in the drawer (there is a **Calculator** and **Drawer count** by bills and coins). Axioma compares **Expected × Counted** and shows the **Difference** (over, short or "Spot on"), with the composition of the expected amount: opening float + cash sales + supplies − withdrawals.',
    ] },
    { nota: 'Closing the register cannot be undone: the shift is marked as closed. The **Cashier** role gives access to the POS only, without the rest of Axioma.' },

    { h1: 'Voice dictation' },
    { p: 'When dictation is enabled for your company, a microphone button appears in the product search (the only cashier field with dictation: amounts, tax ID, price and password are still typed only). Tap and speak (or hold and release); the browser asks for microphone permission only the first time. It stops by itself after a silence or at 60 seconds, and the ✕ button cancels. The text goes into the field, after what you had already typed, for you to review — **nothing is sent or saved on its own**. Each completed dictation uses 1 standard AI question from the balance; failures, silence or unintelligible audio do not count. Axioma does not keep the audio.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '42 - PDV - Punto de Venta.docx',
  titulo: 'Manual 42 — PDV (Punto de Venta)',
  subtitulo: 'Catálogo, caja, cierre y trastienda',
  info: ['Menú: PDV (barra superior)  •  Manual de uso de Axioma AI.Tech  •  Versión 2.1 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'El PDV es la caja de la tienda dentro de Axioma: registra productos, vende, descuenta el inventario, emite el ticket y cierra la caja. Cada venta entra directo en los ingresos, el inventario, el saldo de caja y los indicadores, sin escribir de nuevo.' },
    { p: 'El PDV tiene cinco áreas: **Catálogo**, **Registro**, **Importar XML de la NF-e**, **Caja** y **Trastienda**.' },

    { h1: 'Catálogo' },
    { p: 'Navegue por **nicho** (Alimentos, No Alimentos), **categoría** y **sub-nicho** hasta los productos (aparecen todas las categorías, sin límite de productos). El modo puede ser **Producto**, **Mixto** o **Servicio**. Busque por nombre, SKU o código de barras. Cada producto muestra stock y precio, con **Editar** y **Eliminar** (un producto con ventas no se puede eliminar; eliminar pide motivo y correo y contraseña de un supervisor). Botones: **+ Nuevo Producto/Servicio**, **Importar XML de la NF-e**, **Caja** y **Productos Registrados**.' },

    { h1: 'Registro inteligente' },
    { p: 'Hecho para escribir lo mínimo. Elija nicho, categoría y sub-nicho y use uno de los modos:' },
    { lista: [
      '**Registro Único**: complete nombre, marca, precio de venta, unidad, stock mínimo y estado. Axioma intenta completar por el catálogo de códigos de barras ("Completado por el catálogo — revise") o da una **sugerencia automática** para que usted confirme.',
      '**Escaneo Masivo**: escanee un producto tras otro. Los ítems guardados aparecen en la lista de la sesión, con **Deshacer**, **Editar** y **Omitir**. Si el código ya existe, el producto se abre para edición.',
    ] },

    { h1: 'Importar XML de la NF-e (compra)' },
    { numerada: [
      'Elija el nicho de la factura y suba el archivo **.xml**.',
      'El proveedor se reconoce (o se registrará automáticamente al confirmar).',
      'Para cada ítem, Axioma dice si es **Producto nuevo** o **Ya existe en el catálogo** y sugiere categoría y sub-nicho.',
      'Defina el precio de venta (o aplique un **margen sobre el costo** a todos los ítems nuevos), indique si vino en fardo/caja y cuántas unidades tiene, y marque **Incluir**.',
      'Haga clic en **Confirmar y Guardar**. El stock entra, la conciliación compara la factura con la recepción y las cuentas por pagar, y Axioma avisa si encontró divergencia.',
    ] },
    { nota: 'La misma factura (misma clave de acceso) no se puede importar dos veces. Si la verificación no puede hacerse (falla de conexión), no se importa nada y la pantalla pide intentar de nuevo. Lote y vencimiento presentes en la factura se detectan.' },

    { h1: 'Caja (vender)' },
    { numerada: [
      'Elija la caja que va a operar y, si no hay turno abierto, haga clic en **Abrir Caja** informando el **fondo de cambio**.',
      'Escanee el código de barras o escriba nombre/SKU. El ítem entra en la **Lista de Productos** con valor unitario y total.',
      'Haga clic en **Finalizar Venta** (o F2), elija la forma de pago (Efectivo, Débito, Crédito, Otro), informe el valor recibido (el cambio se calcula) y, si quiere, el CPF en el ticket.',
      'Haga clic en **Confirmar Venta**. El stock baja y se genera el ticket.',
    ] },
    { tabela: { colunas: ['Atajo', 'Función'], larguras: [2400, 6626], linhas: [
      ['Enter', 'Agregar ítem'],
      ['F2', 'Finalizar venta'],
      ['Delete', 'Quitar el último ítem'],
      ['Esc', 'Cerrar o cancelar'],
    ] } },
    { p: 'El ticket (no fiscal) muestra los ítems, el valor aproximado de los tributos (Ley 12.741/2012), el operador y la caja. Puede imprimirse en **impresora térmica** con el programa **QZ Tray** o desde la pantalla; en **Impresión** usted prueba la conexión, activa la impresión automática y define el mensaje de pie (esta configuración vale para toda la empresa y solo el **propietario** puede cambiarla — para los demás, Axioma avisa).' },
    { alerta: '**El precio es decisión del dueño.** Si un producto no tiene precio de venta, solo el propietario o un administrador puede definirlo. El cajero nunca define precio. Vender sin stock suficiente también pide autorización.' },

    { h1: 'Trastienda (seguir y cerrar la caja)' },
    { p: 'Protegida por contraseña, por si el dueño se aleja de la caja. La primera vez, tres preguntas configuran el seguimiento: **en vivo**, **solo cierre** o **los dos**; si quiere **revisar el cajón**; y si quiere ver **utilidad real y margen** (se puede cambiar después en **Configurar**).' },
    { lista: [
      '**Indicadores del día**: total vendido, número de ventas, ticket promedio y utilidad real (avisa cuando hay ítem sin costo registrado).',
      '**Ventas por categoría, sub-nicho y producto**, con hora, valor y utilidad, y cuánto bajó el stock.',
      '**Ítems vendidos con pérdida hoy**, con el cálculo.',
      '**Retiro** y **Refuerzo**: registre retiros y refuerzos de efectivo con motivo; se puede editar valor y motivo o eliminar (eliminar pide supervisor).',
      '**Cierre**: informe el valor contado en el cajón (hay **Calculadora** y **Conteo de cajón** por billetes y monedas). Axioma compara **Esperado × Contado** y muestra la **Diferencia** (sobra, falta o "Cuadró exacto"), con la composición de lo esperado: fondo de apertura + ventas en efectivo + refuerzos − retiros.',
    ] },
    { nota: 'Cerrar la caja no se puede deshacer: el turno queda marcado como cerrado. El rol **Caja** da acceso solo al PDV, sin el resto de Axioma.' },

    { h1: 'Dictado por voz' },
    { p: 'Cuando el dictado esté habilitado para su empresa, aparece un botón de micrófono en la búsqueda de producto (el único campo de la caja con dictado: valores, CPF, precio y contraseña se siguen escribiendo). Toque y hable (o mantenga y suelte); el navegador pide permiso al micrófono solo la primera vez. Se detiene solo después de un silencio o a los 60 segundos, y el botón ✕ cancela. El texto entra en el campo, junto con lo que ya había escrito, para que lo revise — **nada se envía ni se guarda solo**. Cada dictado completado usa 1 pregunta de IA común del saldo; fallas, silencio o audio no entendido no consumen. Axioma no guarda el audio.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
