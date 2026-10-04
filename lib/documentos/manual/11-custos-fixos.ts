// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '11 - Financeiro - Custos Fixos.docx',
  titulo: 'Manual 11 — Custos Fixos',
  subtitulo: 'Gerencie os custos recorrentes mensais',
  info: ['Menu: Financeiro → Custos Fixos  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Custos fixos são os gastos que a empresa tem todo mês, venda ou não venda: aluguel, salários, contador, internet, sistemas e assinaturas. Esta tela organiza esses custos, mostra o peso deles sobre a receita, avisa sobre **renovações de contratos** e detecta **desperdícios** e **duplicidades**.' },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Exportar PDF', 'Gera o PDF dos custos fixos com totais mensal e anual.'],
      ['+ Novo Custo Fixo', 'Abre a janela de cadastro.'],
      ['Escuro / Tema Claro', 'Troca a aparência.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Cards principais' },
    { tabela: { colunas: ['Card', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Total Mensal', 'Soma dos custos fixos por mês.'],
      ['Total Anual', 'O mesmo valor projetado para 12 meses.'],
      ['Itens', 'Quantos custos fixos estão cadastrados.'],
    ] } },
    { h2: 'Camada CFO' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['Peso na Receita', 'Quanto da receita os custos fixos consomem.'],
      ['Economia Potencial', 'Quanto daria para economizar renegociando ou cortando itens identificados.'],
      ['Desperdício Detectado', 'Custos com sinais de desperdício (acima da própria média, subindo sem motivo).'],
    ] } },
    { h2: 'Radar de Renovações' },
    { p: 'Mostra os contratos que estão para renovar, a partir da **data de renovação** informada no cadastro. Cada item recebe uma urgência: **Vencido**, **Crítico**, **Próximo** ou **Futuro**, com textos como "renova em X dias", "hoje", "amanhã" ou "vencido há X dias". É a hora de renegociar antes que o contrato renove sozinho.' },
    { h2: 'Análise (Maiores Custos)' },
    { p: 'Janela de análise com os maiores custos e a evolução ao longo do tempo.' },
    { h2: 'Insights' },
    { lista: ['"Custos com nomes muito parecidos — verifique duplicidade."', '"Custos fixos consomem grande parte da receita. Avalie cortes."', '"Estrutura de custos enxuta e saudável."'] },
    { h2: 'Busca e lista' },
    { p: 'Campo **Buscar custo...** e tabela com descrição, valor mensal, valor anual, dia de vencimento e categoria. Em cada linha, ✏️ editar e 🗑️ excluir.' },

    { h1: 'Passo a passo: cadastrar um custo fixo' },
    { numerada: [
      'Clique em **+ Novo Custo Fixo**.',
      'Informe **Descrição**, **Valor Mensal**, **Dia Vencimento** e **Categoria**.',
      'Se for um contrato com renovação (aluguel, software, seguro), informe a **data de renovação** para entrar no Radar.',
      'Opcional: **Centro de Custo**.',
      'Clique em **Salvar Custo Fixo**.',
    ] },
    { nota: 'Os custos fixos entram sozinhos na projeção do Fluxo de Caixa (Previstos Automáticos) e na DRE. Em Contas a Pagar, o botão "Gerar de Custo Fixo" cria a conta do mês a partir daqui.' },
  ],
}

export default doc
