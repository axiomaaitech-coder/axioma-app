// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '41 - Configurações - Uso da IA.docx',
  titulo: 'Manual 41 — Uso da IA',
  subtitulo: 'Quanto a inteligência foi usada, por qual caminho e quanto custou',
  info: ['Menu: Config → Uso da IA  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Dá transparência total sobre a inteligência artificial do Axioma: quantas perguntas foram feitas, qual motor respondeu, quantas respostas foram conferidas e o custo estimado. **Nenhum conteúdo das conversas aparece aqui**: só números.' },

    { h1: 'Como o motor escolhe quem responde' },
    { p: 'Perguntas simples e frequentes vão para a **OpenAI** (rápida e econômica). Análises e decisões grandes, e as telas premium (IA Financeira, IA Tributária, José no Nexus e relatórios complexos), vão para a **Anthropic**. Se a OpenAI não dá conta de uma pergunta, ela **sobe de nível sozinha**.' },
    { tabela: { colunas: ['Nível', 'Quem responde'], larguras: [3000, 6026], linhas: [
      ['Rotina', 'OpenAI'],
      ['Análise', 'Anthropic Sonnet'],
      ['Estratégica', 'Anthropic Opus'],
    ] } },

    { h1: 'Os indicadores' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [3000, 6026], linhas: [
      ['Perguntas', 'Total de perguntas e quantas foram respondidas.'],
      ['Perguntas por nível', 'Quantas foram para Rotina, Análise e Estratégica.'],
      ['Subiram de nível', 'Começaram na rotina e foram para a Anthropic.'],
      ['Consultas a dados', 'Vezes que a IA buscou detalhe (contas, clientes, estoque) para responder.'],
      ['Números conferidos', 'Respostas em que todo valor em R$ bateu com os dados da empresa.'],
      ['Custo Anthropic (estimado)', 'Pelo preço de tabela, já com o desconto do cache.'],
      ['Consumo OpenAI', 'Em tokens; o valor em dólar fica no painel da OpenAI.'],
      ['Telas que mais usaram', 'Ranking das telas com mais perguntas.'],
    ] } },
    { nota: 'Escolha o período no topo da tela. Os registros seguem a política de retenção e auditoria do Axioma, descrita na Política de Privacidade.' },
  ],
}

export default doc
