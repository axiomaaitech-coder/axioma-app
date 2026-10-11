// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '33 - Gestão - Importar Documentos.docx',
  titulo: 'Manual 33 — Importar Documentos',
  subtitulo: 'Envie o arquivo e o Axioma lança no lugar certo',
  info: ['Menu: Gestão → Importar Documentos  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Em vez de digitar lançamento por lançamento, você envia o arquivo e o Axioma lê, classifica e lança no módulo certo: Fluxo de Caixa, Receitas, Custos Fixos, Custos Variáveis, Contas a Pagar, Contas a Receber, Fornecedores ou Endividamento. **Você confere tudo antes de gravar.**' },
    { h2: 'Como chegar' },
    { lista: ['Menu do topo → **🏢 Gestão ▼** → **Importar Documentos**.'] },
    { h2: 'Arquivos aceitos' },
    { p: '**OFX** (extrato bancário), **XML de NF-e**, **CSV**, **XLSX/XLS** (planilhas), **PDF** e **fotos (JPG/PNG)** de notas.' },

    { h1: 'Como a leitura funciona' },
    { tabela: { colunas: ['Tipo de arquivo', 'Como o Axioma lê'], larguras: [2800, 6226], linhas: [
      ['OFX, XML de NF-e, CSV, planilhas', 'Por **regras exatas**: esses formatos têm estrutura fixa, então a leitura é precisa e não depende de inteligência artificial.'],
      ['PDF e foto de nota', 'Pela **inteligência artificial de visão**: ela lê a imagem, extrai fornecedor, valores, datas, parcelas e itens, e sugere a categoria. Pode levar até 1 minuto. A IA só sugere: quem decide e grava é você.'],
    ] } },

    { h1: 'Passo a passo' },
    { numerada: [
      '**Arraste o arquivo** para a área indicada ou clique para selecionar.',
      'O Axioma verifica se o **mesmo arquivo já foi importado**. Se foi, avisa a data e você escolhe **Importar mesmo assim** ou **Cancelar**.',
      'Na **Revisão antes de Importar**, confira o **Tipo detectado** e o **Destino** de cada linha. Dá para mudar o destino das linhas selecionadas e editar uma linha com o lápis. Linhas com sugestão de baixa confiança vêm marcadas para conferência.',
      'Em planilhas, faça o **Mapeamento de Colunas** (data, valor, descrição, categoria, documento) e, se quiser, **Salvar como Template** (ex.: "Extrato Itaú") para a próxima vez.',
      'Responda a **Conferência humana**: perguntas sobre data, valor e destino (por exemplo, se é uma **compra** ou uma **venda**). Você pode clicar em **Usar todas as sugestões da IA** e depois revisar. O botão de importar só libera depois das respostas.',
      'Resolva as **Possíveis Duplicatas**: **Importar mesmo assim**, **Pular** ou **Somar ao existente**. Valor igual em data diferente não é considerado duplicata automaticamente.',
      'Opcional: clique em **Simular** para ver o resultado sem gravar nada.',
      'Clique em **Confirmar Importação**.',
    ] },

    { h2: 'O Axioma reconhece e aprende' },
    { lista: [
      '**Fornecedor**: reconhecido pelo CNPJ; sem CNPJ, pelo nome (nome igual, sem LTDA/ME, liga sozinho; nome parecido vira pergunta).',
      '**Pagamento que chega** (extrato, comprovante): o Axioma procura a conta em aberto correspondente e dá baixa nela pela porta oficial, em vez de lançar um gasto novo.',
      '**Categoria aprendida**: se você trocar a categoria de uma conta antes de importar, na próxima nota do **mesmo fornecedor** (mesmo CNPJ) ela já vem como você escolheu, com o aviso **"Categoria aprendida com as suas notas anteriores deste fornecedor"** — e continua dando para trocar. Extratos com a mesma descrição também passam a sugerir a categoria e a natureza usadas antes.',
      '**Origem guardada**: a conta nascida de uma nota guarda o arquivo, o formato, o número, a chave e o método (regra ou IA + conferência humana) — visível na Rastreabilidade.',
    ] },
    { h1: 'Depois de importar' },
    { p: 'O resumo mostra quantas linhas foram **importadas**, **duplicadas**, **ignoradas** e com **erro**. O **Histórico** mostra as últimas 50 importações; cada uma tem: **Ver detalhes**, **Baixar original** (o arquivo fica guardado em cofre seguro), **Compartilhar** e **Desfazer**, que remove todos os lançamentos criados por aquela importação (pede motivo e e-mail e senha de um supervisor: Proprietário, Sócio ou Administrador).' },
    { p: 'Nos detalhes há a **Fila de Exceções** (o que o sistema não decidiu sozinho, para você marcar como resolvida) e a **Linha do Tempo** de tudo o que aconteceu.' },
    { h2: 'Painel de Importações (este mês)' },
    { p: '**Total Importado**, **Documentos Processados**, **Taxa de Sucesso**, **Duplicatas Evitadas**, **Tempo Médio** e **Horas Economizadas**.' },
    { nota: 'Compras de mercadoria podem ser lançadas como custo variável, custo fixo mensal, estoque ou investimento: o Axioma pergunta antes de lançar. Notas já importadas pelo PDV são reconhecidas para não duplicar. O custo da nota lançado na importação não é lançado de novo quando a conta é paga. Se o histórico não carregar, ou se não der para conferir os fornecedores pelo nome, a tela avisa.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '33 - Management - Import Documents.docx',
  titulo: 'Manual 33 — Import Documents',
  subtitulo: 'Upload the file and Axioma posts it in the right place',
  info: ['Menu: Management → Import Documents  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Instead of typing entry by entry, you upload the file and Axioma reads, classifies and posts it to the right module: Cash Flow, Revenue, Fixed Costs, Variable Costs, Accounts Payable, Receivables, Suppliers or Debt. **You review everything before saving.**' },
    { h2: 'How to get there' },
    { lista: ['Top menu → **🏢 Management ▼** → **Import Documents**.'] },
    { h2: 'Accepted files' },
    { p: '**OFX** (bank statement), **NF-e XML**, **CSV**, **XLSX/XLS** (spreadsheets), **PDF** and **photos (JPG/PNG)** of invoices.' },

    { h1: 'How reading works' },
    { tabela: { colunas: ['File type', 'How Axioma reads it'], larguras: [2800, 6226], linhas: [
      ['OFX, NF-e XML, CSV, spreadsheets', 'By **exact rules**: these formats have a fixed structure, so reading is precise and does not depend on artificial intelligence.'],
      ['Invoice PDF and photo', 'By **vision AI**: it reads the image, extracts supplier, amounts, dates, installments and items, and suggests the category. It may take up to 1 minute. The AI only suggests: you decide and save.'],
    ] } },

    { h1: 'Step by step' },
    { numerada: [
      '**Drag the file** to the indicated area or click to select it.',
      'Axioma checks whether the **same file was already imported**. If so, it shows the date and you choose **Import anyway** or **Cancel**.',
      'In **Review before Import**, check the **Detected type** and the **Destination** of each line. You can change the destination of selected lines and edit a line with the pencil. Low-confidence suggestions come flagged for review.',
      'For spreadsheets, do the **Column Mapping** (date, amount, description, category, document) and, if you want, **Save as Template** (e.g., "Itaú Statement") for next time.',
      'Answer the **Human check**: questions about date, amount and destination (for example, whether it is a **purchase** or a **sale**). You can click **Use all AI suggestions** and then review. The import button is only enabled after the answers.',
      'Resolve the **Possible Duplicates**: **Import anyway**, **Skip** or **Add to existing**. The same amount on a different date is not automatically considered a duplicate.',
      'Optional: click **Simulate** to see the result without saving anything.',
      'Click **Confirm Import**.',
    ] },

    { h2: 'Axioma recognizes and learns' },
    { lista: [
      '**Supplier**: recognized by CNPJ; without CNPJ, by name (same name, without LTDA/ME, links automatically; a similar name becomes a question).',
      '**Incoming payment** (statement, receipt): Axioma looks for the matching open bill and settles it through the official path, instead of posting a new expense.',
      '**Learned category**: if you change a bill’s category before importing, the next invoice from the **same supplier** (same CNPJ) comes with your choice, with the notice **"Category learned from your previous invoices from this supplier"** — and you can still change it. Statement lines with the same description also suggest the category and nature used before.',
      '**Source kept**: a bill created from an invoice keeps the file, format, number, key and method (rule or AI + human check) — visible in Traceability.',
    ] },
    { h1: 'After importing' },
    { p: 'The summary shows how many lines were **imported**, **duplicated**, **ignored** and with **error**. The **History** shows the last 50 imports; each has **View details**, **Download original** (the file is kept in a secure vault), **Share** and **Undo**, which removes every entry created by that import (asks for a reason and the email and password of a supervisor: Owner, Partner or Administrator).' },
    { p: 'In the details there is the **Exception Queue** (what the system did not decide by itself, for you to mark as resolved) and the **Timeline** of everything that happened.' },
    { h2: 'Imports Panel (this month)' },
    { p: '**Total Imported**, **Documents Processed**, **Success Rate**, **Duplicates Avoided**, **Average Time** and **Hours Saved**.' },
    { nota: 'Merchandise purchases can be posted as variable cost, monthly fixed cost, inventory or investment: Axioma asks before posting. Invoices already imported through the POS are recognized so they are not duplicated. The invoice cost posted at import is not posted again when the bill is paid. If the history does not load, or suppliers cannot be checked by name, the screen warns you.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '33 - Gestión - Importar Documentos.docx',
  titulo: 'Manual 33 — Importar Documentos',
  subtitulo: 'Suba el archivo y Axioma lo registra en el lugar correcto',
  info: ['Menú: Gestión → Importar Documentos  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'En lugar de escribir registro por registro, usted sube el archivo y Axioma lee, clasifica y registra en el módulo correcto: Flujo de Caja, Ingresos, Costos Fijos, Costos Variables, Cuentas por Pagar, Cuentas por Cobrar, Proveedores o Endeudamiento. **Usted revisa todo antes de guardar.**' },
    { h2: 'Cómo llegar' },
    { lista: ['Menú superior → **🏢 Gestión ▼** → **Importar Documentos**.'] },
    { h2: 'Archivos aceptados' },
    { p: '**OFX** (extracto bancario), **XML de NF-e**, **CSV**, **XLSX/XLS** (planillas), **PDF** y **fotos (JPG/PNG)** de facturas.' },

    { h1: 'Cómo funciona la lectura' },
    { tabela: { colunas: ['Tipo de archivo', 'Cómo lo lee Axioma'], larguras: [2800, 6226], linhas: [
      ['OFX, XML de NF-e, CSV, planillas', 'Por **reglas exactas**: estos formatos tienen estructura fija, así que la lectura es precisa y no depende de inteligencia artificial.'],
      ['PDF y foto de factura', 'Por **inteligencia artificial de visión**: lee la imagen, extrae proveedor, valores, fechas, cuotas e ítems, y sugiere la categoría. Puede tardar hasta 1 minuto. La IA solo sugiere: usted decide y guarda.'],
    ] } },

    { h1: 'Paso a paso' },
    { numerada: [
      '**Arrastre el archivo** al área indicada o haga clic para seleccionarlo.',
      'Axioma verifica si el **mismo archivo ya fue importado**. Si fue, avisa la fecha y usted elige **Importar de todos modos** o **Cancelar**.',
      'En la **Revisión antes de Importar**, revise el **Tipo detectado** y el **Destino** de cada línea. Se puede cambiar el destino de las líneas seleccionadas y editar una línea con el lápiz. Las sugerencias de baja confianza vienen marcadas para revisión.',
      'En planillas, haga el **Mapeo de Columnas** (fecha, valor, descripción, categoría, documento) y, si quiere, **Guardar como Plantilla** (ej.: "Extracto Itaú") para la próxima vez.',
      'Responda la **Revisión humana**: preguntas sobre fecha, valor y destino (por ejemplo, si es una **compra** o una **venta**). Puede hacer clic en **Usar todas las sugerencias de la IA** y luego revisar. El botón de importar solo se habilita después de las respuestas.',
      'Resuelva los **Posibles Duplicados**: **Importar de todos modos**, **Omitir** o **Sumar al existente**. El mismo valor en fecha diferente no se considera duplicado automáticamente.',
      'Opcional: haga clic en **Simular** para ver el resultado sin guardar nada.',
      'Haga clic en **Confirmar Importación**.',
    ] },

    { h2: 'Axioma reconoce y aprende' },
    { lista: [
      '**Proveedor**: reconocido por el CNPJ; sin CNPJ, por el nombre (nombre igual, sin LTDA/ME, se vincula solo; nombre parecido se vuelve pregunta).',
      '**Pago que llega** (extracto, comprobante): Axioma busca la cuenta abierta correspondiente y la salda por la puerta oficial, en lugar de registrar un gasto nuevo.',
      '**Categoría aprendida**: si cambia la categoría de una cuenta antes de importar, la próxima factura del **mismo proveedor** (mismo CNPJ) viene con su elección, con el aviso **"Categoría aprendida de sus facturas anteriores de este proveedor"** — y se puede seguir cambiando. Los extractos con la misma descripción también sugieren la categoría y la naturaleza usadas antes.',
      '**Origen guardado**: la cuenta nacida de una factura guarda el archivo, el formato, el número, la clave y el método (regla o IA + revisión humana) — visible en Trazabilidad.',
    ] },
    { h1: 'Después de importar' },
    { p: 'El resumen muestra cuántas líneas fueron **importadas**, **duplicadas**, **ignoradas** y con **error**. El **Historial** muestra las últimas 50 importaciones; cada una tiene **Ver detalles**, **Descargar original** (el archivo queda guardado en una bóveda segura), **Compartir** y **Deshacer**, que elimina todos los registros creados por esa importación (pide motivo y correo y contraseña de un supervisor: Propietario, Socio o Administrador).' },
    { p: 'En los detalles está la **Cola de Excepciones** (lo que el sistema no decidió solo, para que usted lo marque como resuelto) y la **Línea de Tiempo** de todo lo que pasó.' },
    { h2: 'Panel de Importaciones (este mes)' },
    { p: '**Total Importado**, **Documentos Procesados**, **Tasa de Éxito**, **Duplicados Evitados**, **Tiempo Promedio** y **Horas Ahorradas**.' },
    { nota: 'Las compras de mercadería pueden registrarse como costo variable, costo fijo mensual, inventario o inversión: Axioma pregunta antes de registrar. Las facturas ya importadas por el PDV se reconocen para no duplicar. El costo de la factura registrado en la importación no se registra de nuevo cuando se paga la cuenta. Si el historial no carga, o no se pueden verificar los proveedores por nombre, la pantalla avisa.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
