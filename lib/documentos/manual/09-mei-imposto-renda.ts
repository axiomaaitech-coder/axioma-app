// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '09 - MEI - Imposto de Renda.docx',
  titulo: 'Manual 09 — Imposto de Renda do MEI',
  subtitulo: 'Calcule e planeje o IRPF com os seus dados reais e as regras oficiais de 2026',
  info: ['Menu: MEI → Imposto de Renda  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Mostra se você **é obrigado a declarar** o Imposto de Renda da pessoa física, **quanto do lucro do MEI é isento e quanto é tributável**, uma estimativa do imposto do ano, a lista do que separar para a declaração e um lugar seguro para guardar os comprovantes.' },
    { nota: 'Regras conferidas em 10/10/2026 nas páginas oficiais da Receita Federal: tabela mensal de 2026, redutor da Lei 15.270/2025, "Quem deve declarar" (exercício 2026) e a pergunta 184 do "Perguntas e Respostas IRPF 2026". Se a lei mudar, o Axioma atualiza e a data muda.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **MEI ▼** → **Imposto de Renda**.', 'Painel MEI → **Acesso Rápido** → **Imposto de Renda**.'] },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Gera um PDF com o resumo do IR.', 'O arquivo é baixado ("PDF pronto — baixado").'],
      ['**Compartilhar**', 'Abre a Central de Compartilhamento com o resumo.', 'WhatsApp, e-mail, copiar ou baixar o PDF.'],
      ['**Escuro / Tema Claro**', 'Troca as cores.', 'Vale para todo o Axioma.'],
    ] } },

    { h1: 'Como o Axioma calcula (regra oficial)' },
    { numerada: [
      '**Lucro do ano** = receita do MEI − despesas do negócio (custos variáveis do ano + custos fixos × meses).',
      '**Parte isenta** = receita × percentual da atividade: **8%** comércio, indústria e transporte de carga; **32%** serviços. Nunca passa do lucro.',
      '**Renda tributável do MEI** = lucro − parte isenta. Soma-se a **Outra renda mensal** (salário, aluguel…) que você digitar.',
      '**Imposto do mês** = tabela mensal de 2026 sobre (renda − desconto simplificado de R$ 607,20), menos o **redutor de 2026**: até R$ 5.000 por mês não paga; de R$ 5.000,01 a R$ 7.350 o desconto diminui conforme a renda.',
    ] },
    { alerta: 'Lance as despesas do negócio em Custos Fixos e Custos Variáveis. Sem elas, o lucro fica maior do que o real e o imposto estimado também.' },

    { h1: 'As partes da tela' },
    { h2: 'Declaração obrigatória ou não' },
    { p: 'Faixa no topo com **Declaração OBRIGATÓRIA** ou **Declaração não obrigatória** e o motivo. Para a declaração de 2026 a Receita obriga quem teve **renda tributável acima de R$ 35.584** ou **rendimentos isentos acima de R$ 200 mil** no ano. **Ser MEI, sozinho, não obriga.** A tela lembra que bens acima de R$ 800 mil, venda de bens com lucro ou operações em bolsa acima de R$ 40 mil também obrigam — esses dados o Axioma não tem.' },
    { h2: 'Resumo IRPF MEI' },
    { tabela: { colunas: ['Linha', 'O que é'], larguras: [3000, 6026], linhas: [
      ['Receita Bruta MEI', 'Faturamento do ano que conta no limite do MEI.'],
      ['Despesas do negócio no ano', 'O que sai do lucro antes de calcular a parte tributável.'],
      ['Isenção MEI (8% ou 32%)', 'Parte do lucro que você recebe sem imposto.'],
      ['Renda tributável MEI', 'Lucro acima da parte isenta.'],
      ['Outra renda (anual)', 'O valor do campo **Outra renda mensal** × 12.'],
      ['Renda total tributável/ano', 'Soma do que paga imposto.'],
      ['Alíquota efetiva IRPF', 'Imposto ÷ renda — quanto pesa de verdade.'],
      ['💰 IRPF total estimado/ano', 'Estimativa para separar dinheiro ao longo do ano.'],
    ] } },
    { h2: 'Tabela Progressiva IRPF 2026 (mensal)' },
    { p: 'As cinco faixas oficiais (isento até R$ 2.428,80; 7,5%; 15%; 22,5%; 27,5% acima de R$ 4.664,68), com a parcela a deduzir. A seta 👉 marca a sua faixa. Embaixo, a explicação do desconto simplificado e do redutor de 2026.' },
    { h2: 'Checklist Declaração IRPF MEI' },
    { p: 'Seis itens para marcar (CNPJ em dia, DASN-SIMEI entregue, comprovantes separados, recibos e notas, informes de outras rendas, programa da Receita instalado). A barra mostra **X itens concluídos**. A marcação fica guardada neste navegador. O botão **Acessar Receita Federal** abre o site oficial do Meu Imposto de Renda.' },
    { h2: 'Análise Executiva Axioma' },
    { p: 'Botão **Analisar**: a inteligência do Axioma explica se você precisa declarar, como separar parte isenta e tributável (para não cair na malha fina) e quanto reservar. Sem IA disponível, entra uma análise por regras.' },

    { h1: 'Documentos Fiscais' },
    { p: 'Guarde os comprovantes do ano em um lugar privado — só a sua empresa vê.' },
    { numerada: ['Clique em **Escolher arquivo** (PDF ou imagem, até 10 MB).', 'Escolha o **Tipo de documento**: Comprovante de Despesa, Recibo, Informe de Rendimento, Nota Fiscal, DAS Pago ou Outro.', 'Escreva uma **Descrição** (opcional) e clique em **Enviar**.', 'O documento entra na lista do **Ano** escolhido; dá para **Filtrar por tipo**.'] },
    { tabela: { colunas: ['Botão do documento', 'O que faz', 'O que acontece depois'], larguras: [2200, 3600, 3226], linhas: [
      ['👁️ Visualizar', 'Abre o arquivo.', 'O documento abre em outra aba.'],
      ['✏️ Editar', 'Troca tipo e descrição.', 'Aparecem **Salvar** e **Cancelar**.'],
      ['🗑️ Excluir', 'Pede para apagar o arquivo.', 'Abre o aviso de exclusão: motivo (pelo menos 5 letras) e e-mail e senha de um supervisor (Proprietário, Sócio ou Administrador). Só então o arquivo é apagado.'],
    ] } },
    { p: 'O quadro **Você já subiu o que o IRPF precisa?** mostra quais tipos de documento ainda faltam no ano.' },
    { nota: 'Abaixo da tabela, a tela mostra a fonte (Receita Federal) e a data da conferência. Regras podem mudar com lei nova.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '09 - MEI - Income Tax.docx',
  titulo: 'Manual 09 — MEI Income Tax',
  subtitulo: 'Calculate and plan your income tax with your real data and the official 2026 rules',
  info: ['Menu: MEI → Income Tax  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Shows whether you **must file** the personal income tax return (IRPF), **how much of the MEI profit is exempt and how much is taxable**, an estimate of the year\'s tax, the checklist for the return and a safe place to keep receipts.' },
    { nota: 'Rules checked on 10/10/2026 on the official Receita Federal pages: 2026 monthly table, the Law 15,270/2025 reducer, "Who must file" (2026 return) and question 184 of "Perguntas e Respostas IRPF 2026". If the law changes, Axioma updates it and the date changes.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **MEI ▼** → **Income Tax**.', 'MEI Dashboard → **Quick Access** → **Income Tax**.'] },

    { h1: 'Header buttons' },
    { tabela: { colunas: ['Button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['**Export PDF**', 'Creates a PDF with the income tax summary.', 'The file is downloaded ("PDF ready — downloaded").'],
      ['**Share**', 'Opens the Sharing Center with the summary.', 'WhatsApp, email, copy or download the PDF.'],
      ['**Dark / Light Theme**', 'Switches the colors.', 'Applies to all of Axioma.'],
    ] } },

    { h1: 'How Axioma calculates (official rule)' },
    { numerada: [
      '**Profit for the year** = MEI revenue − business expenses (variable costs for the year + fixed costs × months).',
      '**Exempt part** = revenue × activity percentage: **8%** trade, industry and cargo transport; **32%** services. It never exceeds the profit.',
      '**MEI taxable income** = profit − exempt part. Any **Other monthly income** (salary, rent…) you type is added.',
      '**Monthly tax** = 2026 monthly table on (income − simplified discount of R$ 607.20), minus the **2026 reducer**: up to R$ 5,000 per month pays nothing; from R$ 5,000.01 to R$ 7,350 the discount shrinks as income rises.',
    ] },
    { alerta: 'Record business expenses in Fixed Costs and Variable Costs. Without them, the profit looks bigger than it is and so does the estimated tax.' },

    { h1: 'Parts of the screen' },
    { h2: 'Filing required or not' },
    { p: 'Banner at the top with **MANDATORY Declaration** or **Declaration not required** and the reason. For the 2026 return, the Receita requires filing from anyone with **taxable income above R$ 35,584** or **exempt income above R$ 200k** in the year. **Being an MEI alone does not require filing.** The screen reminds you that assets above R$ 800k, selling assets at a gain or stock trades above R$ 40k also require it — Axioma does not have that data.' },
    { h2: 'MEI Income Tax Summary' },
    { tabela: { colunas: ['Line', 'What it is'], larguras: [3000, 6026], linhas: [
      ['MEI Gross Revenue', 'Revenue for the year that counts toward the MEI limit.'],
      ['Business expenses this year', 'What comes out of the profit before the taxable part.'],
      ['MEI Exemption (8% or 32%)', 'Part of the profit you receive tax-free.'],
      ['MEI taxable income', 'Profit above the exempt part.'],
      ['Other income (annual)', 'The **Other monthly income** field × 12.'],
      ['Total taxable income/year', 'Sum of what is taxed.'],
      ['Effective IRPF rate', 'Tax ÷ income — what it really weighs.'],
      ['💰 Estimated total IRPF/year', 'Estimate to set money aside during the year.'],
    ] } },
    { h2: 'Progressive IRPF Table 2026 (monthly)' },
    { p: 'The five official brackets (exempt up to R$ 2,428.80; 7.5%; 15%; 22.5%; 27.5% above R$ 4,664.68), with the deduction amount. The 👉 arrow marks your bracket. Below, the explanation of the simplified discount and the 2026 reducer.' },
    { h2: 'MEI Income Tax Checklist' },
    { p: 'Six items to tick (CNPJ up to date, DASN-SIMEI filed, receipts separated, receipts and invoices, statements of other income, Receita program installed). The bar shows **X items completed**. Ticks are kept in this browser. The **Go to Receita Federal** button opens the official Meu Imposto de Renda site.' },
    { h2: 'Axioma Executive Analysis' },
    { p: '**Analyze** button: Axioma\'s intelligence explains whether you must file, how to split exempt and taxable parts (to avoid audits) and how much to set aside. If the AI is unavailable, a rule-based analysis takes over.' },

    { h1: 'Tax Documents' },
    { p: 'Keep the year\'s receipts in a private place — only your company sees them.' },
    { numerada: ['Click **Choose file** (PDF or image, up to 10 MB).', 'Pick the **Document type**: Expense Receipt, Receipt, Income Statement, Invoice, Paid DAS or Other.', 'Write a **Description** (optional) and click **Send**.', 'The document joins the list for the chosen **Year**; you can **Filter by type**.'] },
    { tabela: { colunas: ['Document button', 'What it does', 'What happens next'], larguras: [2200, 3600, 3226], linhas: [
      ['👁️ View', 'Opens the file.', 'The document opens in another tab.'],
      ['✏️ Edit', 'Changes type and description.', '**Save** and **Cancel** appear.'],
      ['🗑️ Delete', 'Asks to delete the file.', 'Opens the deletion notice: reason (at least 5 letters) and the email and password of a supervisor (Owner, Partner or Administrator). Only then is the file deleted.'],
    ] } },
    { p: 'The **Have you uploaded what the IRPF needs?** box shows which document types are still missing for the year.' },
    { nota: 'Below the table, the screen shows the source (Receita Federal) and the check date. Rules may change with a new law.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '09 - MEI - Impuesto a la Renta.docx',
  titulo: 'Manual 09 — Impuesto a la Renta del MEI',
  subtitulo: 'Calcule y planifique el IRPF con sus datos reales y las reglas oficiales de 2026',
  info: ['Menú: MEI → Impuesto a la Renta  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Muestra si usted **está obligado a declarar** el impuesto a la renta de persona física (IRPF), **cuánto de la ganancia del MEI es exento y cuánto es gravable**, una estimación del impuesto del año, la lista para la declaración y un lugar seguro para guardar los comprobantes.' },
    { nota: 'Reglas verificadas el 10/10/2026 en las páginas oficiales de la Receita Federal: tabla mensual de 2026, reductor de la Ley 15.270/2025, "Quién debe declarar" (ejercicio 2026) y la pregunta 184 de "Perguntas e Respostas IRPF 2026". Si la ley cambia, Axioma la actualiza y cambia la fecha.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **MEI ▼** → **Impuesto a la Renta**.', 'Panel MEI → **Acceso Rápido** → **Impuesto de Renta**.'] },

    { h1: 'Botones del encabezado' },
    { tabela: { colunas: ['Botón', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['**Exportar PDF**', 'Genera un PDF con el resumen del impuesto.', 'El archivo se descarga ("PDF listo — descargado").'],
      ['**Compartir**', 'Abre el Centro de Compartir con el resumen.', 'WhatsApp, correo, copiar o descargar el PDF.'],
      ['**Oscuro / Tema Claro**', 'Cambia los colores.', 'Vale para todo Axioma.'],
    ] } },

    { h1: 'Cómo calcula Axioma (regla oficial)' },
    { numerada: [
      '**Ganancia del año** = ingresos del MEI − gastos del negocio (costos variables del año + costos fijos × meses).',
      '**Parte exenta** = ingresos × porcentaje de la actividad: **8%** comercio, industria y transporte de carga; **32%** servicios. Nunca supera la ganancia.',
      '**Renta gravable del MEI** = ganancia − parte exenta. Se suma **Otra renta mensual** (salario, alquiler…) que usted escriba.',
      '**Impuesto del mes** = tabla mensual de 2026 sobre (renta − descuento simplificado de R$ 607,20), menos el **reductor de 2026**: hasta R$ 5.000 por mes no paga; de R$ 5.000,01 a R$ 7.350 el descuento disminuye según la renta.',
    ] },
    { alerta: 'Registre los gastos del negocio en Costos Fijos y Costos Variables. Sin ellos, la ganancia parece mayor de lo real y el impuesto estimado también.' },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Declaración obligatoria o no' },
    { p: 'Franja arriba con **Declaración OBLIGATORIA** o **Declaración no obligatoria** y el motivo. Para la declaración de 2026, la Receita obliga a quien tuvo **renta gravable por encima de R$ 35.584** o **rendimientos exentos por encima de R$ 200 mil** en el año. **Ser MEI, por sí solo, no obliga.** La pantalla recuerda que bienes por encima de R$ 800 mil, venta de bienes con ganancia u operaciones en bolsa por encima de R$ 40 mil también obligan — esos datos Axioma no los tiene.' },
    { h2: 'Resumen IRPF MEI' },
    { tabela: { colunas: ['Línea', 'Qué es'], larguras: [3000, 6026], linhas: [
      ['Ingresos Brutos MEI', 'Facturación del año que cuenta en el límite del MEI.'],
      ['Gastos del negocio en el año', 'Lo que sale de la ganancia antes de la parte gravable.'],
      ['Exención MEI (8% o 32%)', 'Parte de la ganancia que usted recibe sin impuesto.'],
      ['Renta gravable MEI', 'Ganancia por encima de la parte exenta.'],
      ['Otros ingresos (anual)', 'El campo **Otra renta mensual** × 12.'],
      ['Renta total gravable/año', 'Suma de lo que paga impuesto.'],
      ['Alícuota efectiva IRPF', 'Impuesto ÷ renta — lo que pesa de verdad.'],
      ['💰 IRPF total estimado/año', 'Estimación para separar dinero a lo largo del año.'],
    ] } },
    { h2: 'Tabla Progresiva IRPF 2026 (mensual)' },
    { p: 'Las cinco franjas oficiales (exento hasta R$ 2.428,80; 7,5%; 15%; 22,5%; 27,5% por encima de R$ 4.664,68), con la parcela a deducir. La flecha 👉 marca su franja. Abajo, la explicación del descuento simplificado y del reductor de 2026.' },
    { h2: 'Checklist Declaración IRPF MEI' },
    { p: 'Seis ítems para marcar (CNPJ al día, DASN-SIMEI entregada, comprobantes separados, recibos y facturas, informes de otras rentas, programa de la Receita instalado). La barra muestra **X ítems completados**. Las marcas quedan guardadas en este navegador. El botón **Acceder a Receita Federal** abre el sitio oficial de Meu Imposto de Renda.' },
    { h2: 'Análisis Ejecutivo Axioma' },
    { p: 'Botón **Analizar**: la inteligencia de Axioma explica si debe declarar, cómo separar la parte exenta y la gravable (para no caer en la "malla fina") y cuánto reservar. Sin IA disponible, entra un análisis por reglas.' },

    { h1: 'Documentos Fiscales' },
    { p: 'Guarde los comprobantes del año en un lugar privado — solo su empresa los ve.' },
    { numerada: ['Haga clic en **Elegir archivo** (PDF o imagen, hasta 10 MB).', 'Elija el **Tipo de documento**: Comprobante de Gasto, Recibo, Informe de Rendimiento, Factura, DAS Pagado u Otro.', 'Escriba una **Descripción** (opcional) y haga clic en **Enviar**.', 'El documento entra en la lista del **Año** elegido; puede **Filtrar por tipo**.'] },
    { tabela: { colunas: ['Botón del documento', 'Qué hace', 'Qué pasa después'], larguras: [2200, 3600, 3226], linhas: [
      ['👁️ Ver', 'Abre el archivo.', 'El documento se abre en otra pestaña.'],
      ['✏️ Editar', 'Cambia tipo y descripción.', 'Aparecen **Guardar** y **Cancelar**.'],
      ['🗑️ Eliminar', 'Pide borrar el archivo.', 'Abre el aviso de eliminación: motivo (al menos 5 letras) y correo y contraseña de un supervisor (Propietario, Socio o Administrador). Solo entonces se borra el archivo.'],
    ] } },
    { p: 'El cuadro **¿Ya subió lo que el IRPF necesita?** muestra qué tipos de documento todavía faltan en el año.' },
    { nota: 'Debajo de la tabla, la pantalla muestra la fuente (Receita Federal) y la fecha de verificación. Las reglas pueden cambiar con una nueva ley.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
