// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '25 - Crescimento - Precificação.docx',
  titulo: 'Manual 25 — Precificação',
  subtitulo: 'Centro de Engenharia de Valor',
  info: ['Menu: Crescimento → Precificação  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Ajuda a definir o **preço certo** de cada produto ou serviço: quanto cobrar, até onde dar desconto, como reagir à concorrência e o que acontece com o lucro se o preço mudar. Funciona para empresas de qualquer porte (para o MEI existe a Precificação MEI, manual 07).' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Crescimento ▼** → **Precificação**.'] },

    { h1: 'Botões do cabeçalho' },
    { p: '**Exportar PDF**, **+ Novo Produto**, **Escuro / Tema Claro** e **Compartilhar**.' },

    { h1: 'As partes da tela' },
    { h2: 'IPPA — Índice de Poder de Precificação Axioma' },
    { p: 'Nota de **0 a 1000** (Crítico, Atenção, Bom, Excelente): quanto maior, menos a empresa depende de desconto para vender. É formada por cinco partes: **Margem**, **Dependência de Desconto**, **Concentração de Receita**, **Estabilidade de Receita** e **Competitividade**.' },
    { h2: 'Radar de Oportunidades' },
    { p: 'Produtos que pedem atenção agora, com selo: **Destrói Margem**, **Subprecificado**, **Sobreprecificado**, **Premium** ou **Sustenta o Caixa**.' },
    { h2: 'Seletor de produto' },
    { p: 'Escolha o produto que será analisado pelo Motor, Descontos, Elasticidade e Concorrentes.' },
    { h2: 'Motor de Precificação por Valor' },
    { p: 'Informe um **Preço Candidato** e as **Unidades Vendidas/Mês**. O motor mostra o **Impacto na Receita**, no **Lucro Líquido**, no **EBITDA**, o **Impacto Tributário** (com o imposto do seu regime; no MEI, o DAS da categoria certa) e a **Nova Margem de Contribuição**. Se gostar, clique em **Aplicar Este Preço** — o preço muda no produto e a decisão fica registrada na Memória Estratégica.' },
    { h2: 'Engenharia de Descontos' },
    { p: 'Informe o **Desconto (%)** e veja o **Limite Máximo Saudável**: dentro dele, o desconto ainda dá lucro; acima, vira prejuízo direto por unidade.' },
    { h2: 'Elasticidade de Preço' },
    { p: 'Estima quanto as vendas reagem a mudanças de preço, usando o histórico do produto. Com menos de 3 mudanças de preço registradas, a tela avisa "Dados insuficientes" em vez de inventar.' },
    { h2: 'Inteligência Competitiva' },
    { p: 'Cadastre o **Nome do Concorrente**, o **Preço do Concorrente** e o **Posicionamento** e clique em **Adicionar Concorrente**. O Axioma compara seu preço com o mercado. A 🗑️ lixeira remove o concorrente.' },
    { h2: 'War Room — Simulação Estratégica' },
    { p: 'Escolha um cenário e rode a simulação: **Concorrente Reduz Preço**, **Concorrente Aumenta Preço**, **Alta da Inflação**, **Alta da Selic**, **Choque Cambial**, **Crise Econômica**, **Mudança Tributária**, **Novo Concorrente**, **Explosão de Demanda**, **Queda nas Vendas** e **Mudança de Fornecedores**. O resultado mostra o Lucro Líquido/Mês em quatro cenários (usa o mesmo motor da tela Simulações).' },
    { h2: 'Painel de Especialistas' },
    { p: 'Cinco visões sobre o preço analisado: **CFO**, **Especialista Tributário**, **Especialista Comercial/Pricing**, **Especialista em Riscos** e **Analista Financeiro**. No fim, a **Recomendação Consolidada** junta as cinco.' },
    { h2: 'Memória Estratégica' },
    { p: 'Cada decisão de preço aplicada (Preço Anterior, Preço Novo, Motivo, Resultado Esperado). Depois de algumas semanas, preencha o **Resultado Real** para aprender com o que funcionou.' },
    { h2: 'Lista de produtos' },
    { p: 'Produtos cadastrados com custo, preço e margem, com ✏️ editar e 🗑️ excluir.' },

    { h1: 'Passo a passo: cadastrar um produto' },
    { numerada: ['Clique em **+ Novo Produto**.', 'Preencha **Produto/Serviço**, **Custo Total** e **Margem desejada** (obrigatórios). Opcional: impostos e despesas (%), categoria, unidades vendidas por mês e status.', 'O Axioma mostra o preço sugerido na hora. Clique em **Salvar**.', 'Selecione o produto no seletor, teste preços no Motor e descontos na Engenharia de Descontos.', 'Cadastre concorrentes, rode cenários no War Room, leia o Painel de Especialistas e aplique o preço escolhido.'] },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápis', 'Edita o produto. O preço atual só muda pelo **Aplicar Este Preço** (para ficar registrado na Memória).'],
      ['🗑️ Lixeira', 'Pede motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador).'],
    ] } },
    { h1: 'Transparência' },
    { p: 'O Painel de Especialistas e a Recomendação Consolidada são gerados **100% por regras** a partir dos seus dados reais. Nenhum texto aqui é escrito por modelo de linguagem.' },
    { nota: 'Se a leitura de produtos, concorrentes, receitas ou custos falhar, a tela avisa que os números podem estar incompletos — nunca mostra "nenhum produto" por engano. Toda gravação que falha também avisa.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '25 - Growth - Pricing.docx',
  titulo: 'Manual 25 — Pricing',
  subtitulo: 'Value Engineering Center',
  info: ['Menu: Growth → Pricing  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Helps you set the **right price** for each product or service: how much to charge, how far to discount, how to react to competitors and what happens to profit if the price changes. Works for companies of any size (for MEI there is MEI Pricing, manual 07).' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Growth ▼** → **Pricing**.'] },

    { h1: 'Header buttons' },
    { p: '**Export PDF**, **+ New Product**, **Dark / Light Theme** and **Share**.' },

    { h1: 'Parts of the screen' },
    { h2: 'IPPA — Axioma Pricing Power Index' },
    { p: 'Score from **0 to 1000** (Critical, Attention, Good, Excellent): the higher, the less the company depends on discounts to sell. It has five parts: **Margin**, **Discount Dependency**, **Revenue Concentration**, **Revenue Stability** and **Competitiveness**.' },
    { h2: 'Opportunity Radar' },
    { p: 'Products that need attention now, tagged: **Destroys Margin**, **Underpriced**, **Overpriced**, **Premium** or **Cash Backbone**.' },
    { h2: 'Product selector' },
    { p: 'Choose the product analyzed by the Engine, Discounts, Elasticity and Competitors.' },
    { h2: 'Value-Based Pricing Engine' },
    { p: 'Enter a **Candidate Price** and the **Units Sold/Month**. The engine shows the **Revenue Impact**, **Net Profit Impact**, **EBITDA Impact**, the **Tax Impact** (with your regime’s tax; for MEI, the DAS of the right category) and the **New Contribution Margin**. If you like it, click **Apply This Price** — the product price changes and the decision is logged in the Strategic Memory.' },
    { h2: 'Discount Engineering' },
    { p: 'Enter the **Discount (%)** and see the **Healthy Maximum Limit**: within it, the discount still makes a profit; above it, it is a direct loss per unit.' },
    { h2: 'Price Elasticity' },
    { p: 'Estimates how much sales react to price changes, using the product’s history. With fewer than 3 recorded price changes, the screen says "Insufficient data" instead of making it up.' },
    { h2: 'Competitive Intelligence' },
    { p: 'Enter the **Competitor Name**, **Competitor Price** and **Positioning** and click **Add Competitor**. Axioma compares your price with the market. The 🗑️ trash removes the competitor.' },
    { h2: 'War Room — Strategic Simulation' },
    { p: 'Pick a scenario and run the simulation: **Competitor Cuts Price**, **Competitor Raises Price**, **Inflation Spike**, **Interest Rate Hike**, **FX Shock**, **Economic Crisis**, **Tax Change**, **New Competitor**, **Demand Surge**, **Sales Drop** and **Supplier Change**. The result shows Net Profit/Month in four scenarios (it uses the same engine as the Simulations screen).' },
    { h2: 'Specialist Panel' },
    { p: 'Five views on the analyzed price: **CFO**, **Tax Specialist**, **Commercial/Pricing Specialist**, **Risk Specialist** and **Financial Analyst**. At the end, the **Consolidated Recommendation** combines all five.' },
    { h2: 'Strategic Memory' },
    { p: 'Each applied pricing decision (Previous Price, New Price, Reason, Expected Outcome). After a few weeks, fill in the **Actual Outcome** to learn from what worked.' },
    { h2: 'Product list' },
    { p: 'Registered products with cost, price and margin, with ✏️ edit and 🗑️ delete.' },

    { h1: 'Step by step: registering a product' },
    { numerada: ['Click **+ New Product**.', 'Fill in **Product/Service**, **Total Cost** and **Desired Margin** (required). Optional: taxes and expenses (%), category, units sold per month and status.', 'Axioma shows the suggested price right away. Click **Save**.', 'Select the product in the selector, test prices in the Engine and discounts in Discount Engineering.', 'Register competitors, run War Room scenarios, read the Specialist Panel and apply the chosen price.'] },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['✏️ Pencil', 'Edits the product. The current price only changes through **Apply This Price** (so it is logged in the Memory).'],
      ['🗑️ Trash', 'Asks for a reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator).'],
    ] } },
    { h1: 'Transparency' },
    { p: 'The Specialist Panel and the Consolidated Recommendation are **100% rule-generated** from your real data. No text here is written by a language model.' },
    { nota: 'If loading products, competitors, revenue or costs fails, the screen warns that the numbers may be incomplete — it never shows "no products" by mistake. Every failed save also warns you.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '25 - Crecimiento - Precios.docx',
  titulo: 'Manual 25 — Precios',
  subtitulo: 'Centro de Ingeniería de Valor',
  info: ['Menú: Crecimiento → Precios  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Ayuda a definir el **precio correcto** de cada producto o servicio: cuánto cobrar, hasta dónde dar descuento, cómo reaccionar a la competencia y qué pasa con la utilidad si el precio cambia. Funciona para empresas de cualquier tamaño (para el MEI existe Precios MEI, manual 07).' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Crecimiento ▼** → **Precios**.'] },

    { h1: 'Botones del encabezado' },
    { p: '**Exportar PDF**, **+ Nuevo Producto**, **Oscuro / Tema Claro** y **Compartir**.' },

    { h1: 'Las partes de la pantalla' },
    { h2: 'IPPA — Índice de Poder de Precificación Axioma' },
    { p: 'Nota de **0 a 1000** (Crítico, Atención, Bueno, Excelente): cuanto más alta, menos depende la empresa del descuento para vender. Tiene cinco partes: **Margen**, **Dependencia de Descuento**, **Concentración de Ingresos**, **Estabilidad de Ingresos** y **Competitividad**.' },
    { h2: 'Radar de Oportunidades' },
    { p: 'Productos que necesitan atención ahora, con etiqueta: **Destruye Margen**, **Subprecificado**, **Sobreprecificado**, **Premium** o **Sostiene la Caja**.' },
    { h2: 'Selector de producto' },
    { p: 'Elija el producto que analizarán el Motor, Descuentos, Elasticidad y Competidores.' },
    { h2: 'Motor de Precificación por Valor' },
    { p: 'Informe un **Precio Candidato** y las **Unidades Vendidas/Mes**. El motor muestra el **Impacto en Ingresos**, en la **Utilidad Neta**, en el **EBITDA**, el **Impacto Tributario** (con el impuesto de su régimen; en el MEI, el DAS de la categoría correcta) y el **Nuevo Margen de Contribución**. Si le gusta, haga clic en **Aplicar Este Precio** — el precio cambia en el producto y la decisión queda registrada en la Memoria Estratégica.' },
    { h2: 'Ingeniería de Descuentos' },
    { p: 'Informe el **Descuento (%)** y vea el **Límite Máximo Saludable**: dentro de él, el descuento aún da utilidad; por encima, es pérdida directa por unidad.' },
    { h2: 'Elasticidad de Precio' },
    { p: 'Estima cuánto reaccionan las ventas a cambios de precio, usando el historial del producto. Con menos de 3 cambios de precio registrados, la pantalla avisa "Datos insuficientes" en lugar de inventar.' },
    { h2: 'Inteligencia Competitiva' },
    { p: 'Registre el **Nombre del Competidor**, el **Precio del Competidor** y el **Posicionamiento** y haga clic en **Agregar Competidor**. Axioma compara su precio con el mercado. La 🗑️ papelera elimina al competidor.' },
    { h2: 'War Room — Simulación Estratégica' },
    { p: 'Elija un escenario y ejecute la simulación: **Competidor Reduce Precio**, **Competidor Aumenta Precio**, **Alza de la Inflación**, **Alza de la Tasa de Interés**, **Choque Cambiario**, **Crisis Económica**, **Cambio Tributario**, **Nuevo Competidor**, **Explosión de Demanda**, **Caída de Ventas** y **Cambio de Proveedores**. El resultado muestra la Utilidad Neta/Mes en cuatro escenarios (usa el mismo motor de la pantalla Simulaciones).' },
    { h2: 'Panel de Especialistas' },
    { p: 'Cinco visiones sobre el precio analizado: **CFO**, **Especialista Tributario**, **Especialista Comercial/Pricing**, **Especialista en Riesgos** y **Analista Financiero**. Al final, la **Recomendación Consolidada** une las cinco.' },
    { h2: 'Memoria Estratégica' },
    { p: 'Cada decisión de precio aplicada (Precio Anterior, Precio Nuevo, Motivo, Resultado Esperado). Después de algunas semanas, complete el **Resultado Real** para aprender de lo que funcionó.' },
    { h2: 'Lista de productos' },
    { p: 'Productos registrados con costo, precio y margen, con ✏️ editar y 🗑️ eliminar.' },

    { h1: 'Paso a paso: registrar un producto' },
    { numerada: ['Haga clic en **+ Nuevo Producto**.', 'Complete **Producto/Servicio**, **Costo Total** y **Margen deseado** (obligatorios). Opcional: impuestos y gastos (%), categoría, unidades vendidas por mes y estado.', 'Axioma muestra el precio sugerido al instante. Haga clic en **Guardar**.', 'Seleccione el producto en el selector, pruebe precios en el Motor y descuentos en Ingeniería de Descuentos.', 'Registre competidores, ejecute escenarios en el War Room, lea el Panel de Especialistas y aplique el precio elegido.'] },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['✏️ Lápiz', 'Edita el producto. El precio actual solo cambia con **Aplicar Este Precio** (para quedar registrado en la Memoria).'],
      ['🗑️ Papelera', 'Pide motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador).'],
    ] } },
    { h1: 'Transparencia' },
    { p: 'El Panel de Especialistas y la Recomendación Consolidada se generan **100% por reglas** a partir de sus datos reales. Ningún texto aquí es escrito por un modelo de lenguaje.' },
    { nota: 'Si la lectura de productos, competidores, ingresos o costos falla, la pantalla avisa que los números pueden estar incompletos — nunca muestra "ningún producto" por error. Toda grabación que falla también avisa.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
