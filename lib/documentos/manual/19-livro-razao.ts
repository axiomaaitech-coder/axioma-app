// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '19 - Contabilidade - Livro Razão.docx',
  titulo: 'Manual 19 — Livro Razão',
  subtitulo: 'Extrato por conta contábil, com saldo acumulado',
  info: ['Menu: Contabilidade → Livro Razão  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Livro Razão mostra, para **cada conta contábil**, todos os movimentos do período e o saldo depois de cada um, como um extrato bancário da conta. É a base de onde saem o Balancete e a DRE Contábil.' },
    { nota: 'Você não lança nada aqui. Os movimentos são gerados automaticamente pelos módulos (receitas, contas a pagar, PDV, importação de notas) e pelos lançamentos manuais do Contador.' },

    { h1: 'Como usar' },
    { numerada: [
      'Escolha a **Conta** no seletor.',
      'Escolha o **período**.',
      'Leia o **Saldo Anterior** (antes do período), a lista de movimentos e o **Saldo Atual**.',
    ] },
    { h1: 'A tabela' },
    { tabela: { colunas: ['Coluna', 'O que mostra'], larguras: [2400, 6626], linhas: [
      ['Data', 'Quando o movimento aconteceu.'],
      ['Descrição', 'O que foi o movimento.'],
      ['Débito / Crédito', 'O valor de cada lado da partida.'],
      ['Saldo', 'O saldo acumulado depois do movimento.'],
      ['Origem', 'De qual módulo veio o lançamento.'],
    ] } },
    { p: 'Lançamentos estornados aparecem com a marca **ESTORNADO**: nada é apagado, para o histórico ficar completo e auditável.' },
    { p: 'O botão **Compartilhar** envia o resumo do extrato.' },
    { alerta: 'Se aparecer "Cadastre o plano de contas para ver o Razão", o plano de contas da empresa ainda não foi criado.' },
  ],
}

export default doc
