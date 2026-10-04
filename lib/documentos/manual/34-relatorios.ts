// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '34 - Gestão - Relatórios.docx',
  titulo: 'Manual 34 — Relatórios',
  subtitulo: 'Relatórios executivos prontos para compartilhar',
  info: ['Menu: Gestão → Relatórios  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Reúne em um só lugar os relatórios que sócios, investidores, bancos e o contador costumam pedir, montados automaticamente com os dados do Axioma e prontos para enviar.' },

    { h1: 'Como usar' },
    { numerada: ['Escolha o **Período** (mês ou ano).', 'Escolha a aba do relatório.', 'Clique em **Compartilhar** para enviar.'] },

    { h1: 'As abas' },
    { tabela: { colunas: ['Aba', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Dashboard Executivo', '**Score CFO** (Excelente, Bom, Regular, Atenção, Crítico), mini indicadores, **Insights Automáticos** e a evolução dos últimos 6 meses.'],
      ['DRE Gerencial', 'Receita Bruta, Deduções (Impostos), Receita Líquida, Custos Variáveis, Margem de Contribuição, Custos Fixos, Lucro Operacional (EBITDA), Despesas Financeiras e Lucro Líquido, com o **% da Receita** e um comentário automático.'],
      ['Evolução 12 Meses', 'Receita, custos, lucro e margem mês a mês.'],
      ['Distribuição de Custos', 'Para onde vai o dinheiro, por grupo e categoria.'],
      ['KPIs & Score CFO', 'Indicadores de **Rentabilidade**, **Liquidez**, **Endividamento**, **Operacional** e **Crescimento**, cada um comparado com a **Meta** e o **Benchmark Brasil** (acima ou abaixo da meta).'],
    ] } },
    { h1: 'Centro de Compartilhamento' },
    { p: 'Mostra uma prévia do **Resumo Executivo** e os canais de envio (WhatsApp, e-mail, Telegram ou copiar). O resumo leva os principais números do período.' },
    { nota: 'Sem lançamentos no período, a tela pede para cadastrar receitas e custos primeiro. Os relatórios são calculados por regras sobre os seus dados; para análises em conversa, use a IA Financeira.' },
  ],
}

export default doc
