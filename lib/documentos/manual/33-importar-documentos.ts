// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '33 - Gestão - Importar Documentos.docx',
  titulo: 'Manual 33 — Importar Documentos',
  subtitulo: 'Envie o arquivo e o Axioma lança no lugar certo',
  info: ['Menu: Gestão → Importar Documentos  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Em vez de digitar lançamento por lançamento, você envia o arquivo e o Axioma lê, classifica e lança no módulo certo: Fluxo de Caixa, Receitas, Custos Fixos, Custos Variáveis, Contas a Pagar, Contas a Receber, Fornecedores ou Endividamento. **Você confere tudo antes de gravar.**' },
    { h2: 'Arquivos aceitos' },
    { p: '**OFX** (extrato bancário), **XML de NF-e**, **CSV**, **XLSX/XLS** (planilhas), **PDF** e **fotos (JPG/PNG)** de notas.' },

    { h1: 'Como a leitura funciona' },
    { tabela: { colunas: ['Tipo de arquivo', 'Como o Axioma lê'], larguras: [2800, 6226], linhas: [
      ['OFX, XML de NF-e, CSV, planilhas', 'Por **regras exatas**: esses formatos têm estrutura fixa, então a leitura é precisa e não depende de inteligência artificial.'],
      ['PDF e foto de nota', 'Pela **inteligência artificial de visão**: ela lê a imagem, extrai fornecedor, valores, datas, parcelas e itens, e sugere a categoria. Pode levar até 1 minuto.'],
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

    { h1: 'Depois de importar' },
    { p: 'O resumo mostra quantas linhas foram **importadas**, **duplicadas**, **ignoradas** e com **erro**. No **Histórico** cada importação tem: **Ver detalhes**, **Baixar original** (o arquivo fica guardado em cofre seguro), **Compartilhar** e **Desfazer**, que remove todos os lançamentos criados por aquela importação.' },
    { p: 'Nos detalhes há a **Fila de Exceções** (o que o sistema não decidiu sozinho, para você marcar como resolvida) e a **Linha do Tempo** de tudo o que aconteceu.' },
    { h2: 'Painel de Importações (este mês)' },
    { p: '**Total Importado**, **Documentos Processados**, **Taxa de Sucesso**, **Duplicatas Evitadas**, **Tempo Médio** e **Horas Economizadas**.' },
    { nota: 'Compras de mercadoria podem ser lançadas como custo variável, custo fixo mensal, estoque ou investimento: o Axioma pergunta antes de lançar. Notas já importadas pelo PDV são reconhecidas para não duplicar.' },
  ],
}

export default doc
