// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '08 - MEI - IA MEI Advisor.docx',
  titulo: 'Manual 08 — IA MEI Advisor',
  subtitulo: 'Seu consultor financeiro e fiscal do MEI, por conversa',
  info: ['Menu: MEI → IA MEI Advisor  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O IA MEI Advisor é um chat que **conhece os dados reais do seu MEI** (faturamento, teto, DAS, despesas, configuração) e responde perguntas sobre DAS, limite anual, imposto de renda, Reforma Tributária e precificação, em linguagem simples.' },

    { h1: 'As partes da tela' },
    { h2: 'Cards de contexto' },
    { p: 'No topo, cards mostram os números que a IA está usando (faturamento, teto, DAS e situação). Assim você sabe em que dados a resposta se baseia.' },
    { h2: 'Chat' },
    { tabela: { colunas: ['Elemento', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['Mensagem de boas-vindas', '"Olá! Sou o MEI Advisor da Axioma. Conheço seus dados reais..." — o ponto de partida.'],
      ['Campo "Pergunte sobre seu MEI..."', 'Onde você escreve a pergunta.'],
      ['Enviar', 'Manda a pergunta. A resposta aparece logo abaixo.'],
      ['Sugestões de pergunta', 'Botões com perguntas prontas; clique para perguntar sem digitar.'],
    ] } },
    { nota: 'As respostas são geradas pela inteligência do Axioma com os seus dados reais. Se a IA não puder responder no momento, a tela responde automaticamente com base em regras.' },

    { h1: 'Exemplos de perguntas' },
    { lista: ['"Quanto ainda posso faturar este ano sem estourar o teto?"', '"Meu DAS está em dia?"', '"Preciso declarar imposto de renda?"', '"O que muda para mim com a Reforma Tributária?"', '"Meu preço está cobrindo os custos?"'] },
    { h1: 'Boas práticas' },
    { lista: ['Mantenha o faturamento e as despesas lançados: a IA responde melhor com dados completos.', 'Faça uma pergunta por vez, de forma direta.', 'Use a resposta como orientação; as decisões são suas.'] },
  ],
}

export default doc
