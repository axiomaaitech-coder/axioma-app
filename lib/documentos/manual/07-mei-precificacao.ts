// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '07 - MEI - Precificação.docx',
  titulo: 'Manual 07 — Precificação MEI',
  subtitulo: 'Descubra o preço mínimo real e pare de trabalhar de graça',
  info: ['Menu: MEI → Precificação MEI  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Calcula **quanto você precisa cobrar** por hora, por projeto ou por produto para cobrir seus custos, o DAS, o imposto de renda e ainda pagar o seu próprio tempo. Compara com o que você cobra hoje, mostra se há prejuízo e guarda os preços que você quiser reaproveitar.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **MEI ▼** → **Precificação MEI**.', 'Painel MEI → **Acesso Rápido** → **Precificação**.'] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera um PDF com o cálculo da tela.', 'O arquivo é baixado.'],
      ['**Compartilhar**', 'Abre a Central de Compartilhamento com o resumo do preço.', 'WhatsApp, e-mail, copiar ou baixar o PDF.'],
      ['**Escuro / Tema Claro**', 'Troca as cores.', 'Vale para todo o Axioma.'],
    ] } },

    { h1: 'Passo a passo do cálculo' },
    { h2: '1. Informações do MEI' },
    { p: 'No topo aparecem a **Categoria MEI**, o **DAS Mensal** e a **Receita Mensal Média Real**, puxados dos seus dados.' },
    { h2: '2. Como você cobra?' },
    { p: 'Clique em **Por Hora**, **Por Projeto/Serviço** ou **Por Produto**. Os campos abaixo mudam conforme a escolha.' },
    { h2: '3. Seus Custos Reais' },
    { p: 'O Axioma já preenche com os seus lançamentos ("Puxamos dos seus lançamentos — ajuste se quiser"). Sem dados suficientes, aparece "preencha manualmente":' },
    { tabela: { colunas: ['Campo', 'Quando aparece', 'O que colocar'], larguras: [3000, 2200, 3826], linhas: [
      ['Custo Fixo Mensal (R$)', 'Sempre', 'Aluguel, internet, assinaturas, contador.'],
      ['Custo Variável Mensal (R$)', 'Sempre', 'Gastos que mudam com o volume de trabalho.'],
      ['Horas por dia / Dias por semana / % de horas produtivas', 'Por Hora', 'O Axioma calcula "Você trabalha ~X h/mês". A % desconta reuniões e deslocamentos.'],
      ['Horas usadas no cálculo (por mês)', 'Por Hora', 'Pré-preenchido pelo cálculo; pode trocar por um número exato.'],
      ['Horas estimadas para este projeto / Materiais deste projeto (R$)', 'Por Projeto', 'Tempo e insumos daquele trabalho.'],
      ['Custo do produto (R$/unidade) / Unidades vendidas por mês', 'Por Produto', 'Custo de cada unidade e volume.'],
      ['Margem de lucro desejada (%)', 'Sempre', 'Quanto quer ganhar acima do custo. Sugestão: 20 a 30%.'],
    ] } },
    { nota: 'O cálculo inclui o seu **pró-labore desejado** (configurado em **Configurar MEI**, no Painel MEI) rateado pelas horas ou unidades. Sem ele configurado, a tela avisa. Esquecer o valor do próprio tempo é o erro número 1.' },
    { h2: '4. Resultado' },
    { tabela: { colunas: ['Linha', 'O que é'], larguras: [3000, 6026], linhas: [
      ['Custo Base', 'Custos + pró-labore rateados.'],
      ['DAS (no preço)', 'A parte do DAS que cada venda precisa cobrir.'],
      ['Exposição IRPF (no preço)', 'A parte do imposto de renda.'],
      ['Sua Margem em R$', 'O lucro em reais.'],
      ['⚠️ Preço Mínimo (sem lucro)', 'Abaixo disso você perde dinheiro.'],
      ['💰 Preço Sugerido', 'Preço com a margem desejada.'],
      ['Seu ticket médio histórico real', 'Quanto você costuma cobrar, para comparar.'],
      ['Adicional de urgência/complexidade (%)', 'Opcional; mostra o **Preço com adicional**.'],
    ] } },
    { p: 'O gráfico **Composição do Preço Sugerido** mostra de que é feito o preço (custo base, DAS, IRPF e margem). O valor do centro é o preço sugerido; passe o mouse em cada fatia para ver o valor.' },
    { h2: '5. Você Está Trabalhando de Graça?' },
    { p: 'Digite **Quanto você cobra hoje? (R$)**. O Axioma compara com o preço mínimo e mostra **Prejuízo Detectado** (prejuízo por unidade e por mês), margem **apertada** (sugere subir para o preço sugerido) ou margem **saudável**.' },
    { h2: '6. Análise Executiva Axioma' },
    { p: 'Botão **Analisar**: a inteligência do Axioma comenta a sua precificação com os seus números. Sem IA disponível, entra uma análise por regras.' },

    { h1: 'Meus Preços Salvos' },
    { numerada: ['Escreva o **Nome deste preço** (ex.: "Corte de cabelo masculino").', 'Clique em **Salvar Preço** (fica liberado só com nome preenchido).', 'O preço aparece em **Meus Preços Salvos**, com páginas ("Página X de Y" e as setas ‹ ›).'] },
    { tabela: { colunas: ['Botão do preço salvo', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['✏️ Lápis', 'Carrega aquele preço no cálculo.', 'Aparece "Editando…" e os botões **Atualizar Preço** e **Cancelar edição**.'],
      ['🗑️ Lixeira', 'Pede para excluir o preço.', 'Abre o aviso de exclusão: escreva o motivo (pelo menos 5 letras) e o e-mail e a senha de um supervisor (Proprietário, Sócio ou Administrador). Só então o preço sai da lista.'],
    ] } },

    { h1: 'Dicas de Precificação MEI' },
    { lista: ['Nunca precifique abaixo do custo real — inclua DAS, IRPF e o valor do seu tempo.', 'Adicione 20 a 30% de margem mínima para imprevistos e investimentos.', 'Revise os preços a cada 6 meses (inflação e novos custos).', 'Serviços MEI têm 32% da receita isenta de IRPF — o cálculo já considera isso.'] },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '07 - MEI - Pricing.docx',
  titulo: 'Manual 07 — MEI Pricing',
  subtitulo: 'Find your real minimum price and stop working for free',
  info: ['Menu: MEI → MEI Pricing  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Calculates **how much you need to charge** per hour, per project or per product to cover your costs, the DAS, income tax and still pay for your own time. It compares with what you charge today, shows whether you are losing money and stores the prices you want to reuse.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **MEI ▼** → **MEI Pricing**.', 'MEI Dashboard → **Quick Access** → **Pricing**.'] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates a PDF with the calculation on screen.', 'The file is downloaded.'],
      ['**Share**', 'Opens the Sharing Center with the price summary.', 'WhatsApp, email, copy or download the PDF.'],
      ['**Dark / Light Theme**', 'Switches the colors.', 'Applies to all of Axioma.'],
    ] } },

    { h1: 'Step by step' },
    { h2: '1. MEI information' },
    { p: 'At the top you see the **MEI Category**, the **Monthly DAS** and the **Real Average Monthly Revenue**, taken from your data.' },
    { h2: '2. How do you charge?' },
    { p: 'Click **Per Hour**, **Per Project/Service** or **Per Product**. The fields below change with your choice.' },
    { h2: '3. Your Real Costs' },
    { p: 'Axioma pre-fills them from your entries ("Taken from your entries — adjust if you want"). Without enough data, it says "fill in manually":' },
    { tabela: { colunas: ['Field', 'When it shows', 'What to enter'], larguras: [3000, 2200, 3826], linhas: [
      ['Monthly Fixed Cost (R$)', 'Always', 'Rent, internet, subscriptions, accountant.'],
      ['Monthly Variable Cost (R$)', 'Always', 'Expenses that change with your workload.'],
      ['Hours per day / Days per week / % productive hours', 'Per Hour', 'Axioma calculates "You work ~X h/month". The % discounts meetings and travel.'],
      ['Hours used in the calculation (per month)', 'Per Hour', 'Pre-filled by the calculation; you can replace it with an exact number.'],
      ['Estimated hours for this project / Materials for this project (R$)', 'Per Project', 'Time and inputs for that job.'],
      ['Product cost (R$/unit) / Units sold per month', 'Per Product', 'Cost of each unit and volume.'],
      ['Desired profit margin (%)', 'Always', 'How much you want above cost. Suggested: 20 to 30%.'],
    ] } },
    { nota: 'The calculation includes your **desired owner\'s pay** (set in **Configure MEI**, on the MEI Dashboard) spread over hours or units. If it is not set, the screen warns you. Forgetting the value of your own time is mistake number 1.' },
    { h2: '4. Result' },
    { tabela: { colunas: ['Line', 'What it is'], larguras: [3000, 6026], linhas: [
      ['Base Cost', 'Costs + owner\'s pay spread out.'],
      ['DAS (in the price)', 'The share of the DAS each sale must cover.'],
      ['Income tax exposure (in the price)', 'The income tax share.'],
      ['Your Margin in R$', 'The profit in reais.'],
      ['⚠️ Minimum Price (no profit)', 'Below this you lose money.'],
      ['💰 Suggested Price', 'Price with the desired margin.'],
      ['Your real historical average ticket', 'What you usually charge, for comparison.'],
      ['Urgency/complexity add-on (%)', 'Optional; shows the **Price with add-on**.'],
    ] } },
    { p: 'The **Suggested Price Composition** chart shows what the price is made of (base cost, DAS, income tax and margin). The value in the center is the suggested price; hover over each slice to see its value.' },
    { h2: '5. Are You Working for Free?' },
    { p: 'Type **How much do you charge today? (R$)**. Axioma compares it with the minimum price and shows **Loss Detected** (loss per unit and per month), a **tight** margin (suggests moving to the suggested price) or a **healthy** margin.' },
    { h2: '6. Axioma Executive Analysis' },
    { p: '**Analyze** button: Axioma\'s intelligence comments on your pricing using your numbers. If the AI is unavailable, a rule-based analysis takes over.' },

    { h1: 'My Saved Prices' },
    { numerada: ['Type the **Name of this price** (e.g., "Men\'s haircut").', 'Click **Save Price** (enabled only when a name is filled in).', 'The price appears under **My Saved Prices**, with pages ("Page X of Y" and the ‹ › arrows).'] },
    { tabela: { colunas: ['Saved price button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['✏️ Pencil', 'Loads that price into the calculation.', '"Editing…" appears, with the **Update Price** and **Cancel editing** buttons.'],
      ['🗑️ Trash', 'Asks to delete the price.', 'Opens the deletion notice: write the reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator). Only then does the price leave the list.'],
    ] } },

    { h1: 'MEI Pricing Tips' },
    { lista: ['Never price below your real cost — include DAS, income tax and the value of your time.', 'Add a 20 to 30% minimum margin for surprises and investments.', 'Review prices every 6 months (inflation and new costs).', 'MEI services have 32% of revenue exempt from income tax — the calculation already accounts for it.'] },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '07 - MEI - Precios.docx',
  titulo: 'Manual 07 — Precios MEI',
  subtitulo: 'Descubra su precio mínimo real y deje de trabajar gratis',
  info: ['Menú: MEI → Precios MEI  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Calcula **cuánto necesita cobrar** por hora, por proyecto o por producto para cubrir sus costos, el DAS, el impuesto a la renta y además pagar su propio tiempo. Compara con lo que cobra hoy, muestra si hay pérdida y guarda los precios que quiera reutilizar.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **MEI ▼** → **Precios MEI**.', 'Panel MEI → **Acceso Rápido** → **Precios**.'] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera un PDF con el cálculo de la pantalla.', 'El archivo se descarga.'],
      ['**Compartir**', 'Abre el Centro de Compartir con el resumen del precio.', 'WhatsApp, correo, copiar o descargar el PDF.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores.', 'Vale para todo Axioma.'],
    ] } },

    { h1: 'Paso a paso del cálculo' },
    { h2: '1. Información del MEI' },
    { p: 'Arriba aparecen la **Categoría MEI**, el **DAS Mensual** y el **Ingreso Mensual Promedio Real**, tomados de sus datos.' },
    { h2: '2. ¿Cómo cobra?' },
    { p: 'Haga clic en **Por Hora**, **Por Proyecto/Servicio** o **Por Producto**. Los campos de abajo cambian según la elección.' },
    { h2: '3. Sus Costos Reales' },
    { p: 'Axioma los completa con sus registros ("Tomamos de sus registros — ajuste si quiere"). Sin datos suficientes, aparece "complete manualmente":' },
    { tabela: { colunas: ['Campo', 'Cuándo aparece', 'Qué poner'], larguras: [3000, 2200, 3826], linhas: [
      ['Costo Fijo Mensual (R$)', 'Siempre', 'Alquiler, internet, suscripciones, contador.'],
      ['Costo Variable Mensual (R$)', 'Siempre', 'Gastos que cambian con el volumen de trabajo.'],
      ['Horas por día / Días por semana / % de horas productivas', 'Por Hora', 'Axioma calcula "Usted trabaja ~X h/mes". El % descuenta reuniones y traslados.'],
      ['Horas usadas en el cálculo (por mes)', 'Por Hora', 'Completado por el cálculo; puede cambiarlo por un número exacto.'],
      ['Horas estimadas para este proyecto / Materiales de este proyecto (R$)', 'Por Proyecto', 'Tiempo e insumos de ese trabajo.'],
      ['Costo del producto (R$/unidad) / Unidades vendidas por mes', 'Por Producto', 'Costo de cada unidad y volumen.'],
      ['Margen de ganancia deseado (%)', 'Siempre', 'Cuánto quiere ganar sobre el costo. Sugerencia: 20 a 30%.'],
    ] } },
    { nota: 'El cálculo incluye su **retiro deseado** (configurado en **Configurar MEI**, en el Panel MEI) repartido por horas o unidades. Si no está configurado, la pantalla avisa. Olvidar el valor de su propio tiempo es el error número 1.' },
    { h2: '4. Resultado' },
    { tabela: { colunas: ['Línea', 'Qué es'], larguras: [3000, 6026], linhas: [
      ['Costo Base', 'Costos + retiro repartidos.'],
      ['DAS (en el precio)', 'La parte del DAS que cada venta debe cubrir.'],
      ['Exposición IRPF (en el precio)', 'La parte del impuesto a la renta.'],
      ['Su Margen en R$', 'La ganancia en reales.'],
      ['⚠️ Precio Mínimo (sin ganancia)', 'Por debajo usted pierde dinero.'],
      ['💰 Precio Sugerido', 'Precio con el margen deseado.'],
      ['Su ticket promedio histórico real', 'Lo que suele cobrar, para comparar.'],
      ['Adicional de urgencia/complejidad (%)', 'Opcional; muestra el **Precio con adicional**.'],
    ] } },
    { p: 'El gráfico **Composición del Precio Sugerido** muestra de qué está hecho el precio (costo base, DAS, IRPF y margen). El valor del centro es el precio sugerido; pase el mouse por cada porción para ver su valor.' },
    { h2: '5. ¿Está Trabajando Gratis?' },
    { p: 'Escriba **¿Cuánto cobra hoy? (R$)**. Axioma lo compara con el precio mínimo y muestra **Pérdida Detectada** (pérdida por unidad y por mes), margen **ajustado** (sugiere subir al precio sugerido) o margen **saludable**.' },
    { h2: '6. Análisis Ejecutivo Axioma' },
    { p: 'Botón **Analizar**: la inteligencia de Axioma comenta sus precios con sus números. Sin IA disponible, entra un análisis por reglas.' },

    { h1: 'Mis Precios Guardados' },
    { numerada: ['Escriba el **Nombre de este precio** (ej.: "Corte de cabello masculino").', 'Haga clic en **Guardar Precio** (se habilita solo con el nombre completo).', 'El precio aparece en **Mis Precios Guardados**, con páginas ("Página X de Y" y las flechas ‹ ›).'] },
    { tabela: { colunas: ['Botón del precio guardado', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['✏️ Lápiz', 'Carga ese precio en el cálculo.', 'Aparece "Editando…" y los botones **Actualizar Precio** y **Cancelar edición**.'],
      ['🗑️ Papelera', 'Pide eliminar el precio.', 'Abre el aviso de eliminación: escriba el motivo (al menos 5 letras) y el correo y la contraseña de un supervisor (Propietario, Socio o Administrador). Solo entonces el precio sale de la lista.'],
    ] } },

    { h1: 'Consejos de Precios MEI' },
    { lista: ['Nunca ponga precio por debajo del costo real — incluya DAS, IRPF y el valor de su tiempo.', 'Agregue de 20 a 30% de margen mínimo para imprevistos e inversiones.', 'Revise los precios cada 6 meses (inflación y nuevos costos).', 'Los servicios MEI tienen 32% de los ingresos exentos de IRPF — el cálculo ya lo considera.'] },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
