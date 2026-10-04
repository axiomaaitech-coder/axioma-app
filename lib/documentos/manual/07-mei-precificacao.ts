// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '07 - MEI - Precificação MEI.docx',
  titulo: 'Manual 07 — Precificação MEI',
  subtitulo: 'Descubra o preço mínimo real e pare de trabalhar de graça',
  info: ['Menu: MEI → Precificação MEI  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Calcula **quanto você precisa cobrar** por hora, por projeto ou por produto para cobrir seus custos, o DAS, o imposto de renda e ainda pagar o seu próprio tempo. Compara com o que você cobra hoje e mostra se há prejuízo.' },

    { h1: 'Passo a passo do cálculo' },
    { h2: '1. Informações do MEI' },
    { p: 'No topo aparecem a **Categoria MEI**, o **DAS Mensal** e a **Receita Mensal Média Real**, puxados dos seus dados.' },
    { h2: '2. Como você cobra?' },
    { p: 'Escolha **Por Hora**, **Por Projeto/Serviço** ou **Por Produto**. Os campos mudam conforme a escolha.' },
    { h2: '3. Seus Custos Reais' },
    { p: 'O Axioma já preenche com os seus lançamentos ("Puxamos dos seus lançamentos — ajuste se quiser"). Se não houver dados, preencha manualmente:' },
    { tabela: { colunas: ['Campo', 'Quando aparece', 'O que colocar'], larguras: [3000, 2200, 3826], linhas: [
      ['Custo Fixo Mensal (R$)', 'Sempre', 'Aluguel, internet, assinaturas, contador.'],
      ['Custo Variável Mensal (R$)', 'Sempre', 'Gastos que mudam com o volume de trabalho.'],
      ['Horas por dia / Dias por semana / % de horas produtivas', 'Por Hora', 'O Axioma calcula "Você trabalha ~X h/mês". A % desconta reuniões e deslocamentos.'],
      ['Horas usadas no cálculo (por mês)', 'Por Hora', 'Pré-preenchido; pode trocar por um número exato.'],
      ['Horas estimadas para este projeto / Materiais deste projeto (R$)', 'Por Projeto', 'Tempo e insumos daquele trabalho.'],
      ['Custo do produto (R$/unidade) / Unidades vendidas por mês', 'Por Produto', 'Custo de cada unidade e volume.'],
      ['Margem de lucro desejada (%)', 'Sempre', 'Quanto quer ganhar acima do custo. Sugestão: 20 a 30%.'],
    ] } },
    { nota: 'O cálculo inclui o seu **pró-labore desejado** (configurado em Configurar MEI, no Painel MEI) rateado pelas horas ou unidades. Esquecer o valor do próprio tempo é o erro número 1.' },
    { h2: '4. Resultado' },
    { tabela: { colunas: ['Linha', 'O que é'], larguras: [3000, 6026], linhas: [
      ['Custo Base', 'Custos + pró-labore rateados.'],
      ['DAS (no preço)', 'A parte do DAS que cada venda precisa cobrir.'],
      ['Exposição IRPF (no preço)', 'A parte do imposto de renda.'],
      ['Sua Margem em R$', 'O lucro em reais.'],
      ['⚠️ Preço Mínimo (sem lucro)', 'Abaixo disso você perde dinheiro.'],
      ['💰 Preço Sugerido', 'Preço com a margem desejada.'],
      ['Seu ticket médio histórico real', 'Quanto você costuma cobrar, para comparar.'],
      ['Adicional de urgência/complexidade (%)', 'Opcional; mostra o "Preço com adicional".'],
    ] } },
    { p: 'O gráfico **Composição do Preço Sugerido** mostra de que é feito o preço.' },
    { h2: '5. Você Está Trabalhando de Graça?' },
    { p: 'Informe **Quanto você cobra hoje? (R$)**. O Axioma compara com o preço mínimo e mostra **Prejuízo Detectado** (com o prejuízo por unidade e por mês), margem **apertada** ou margem **saudável**.' },
    { h2: '6. Análise Executiva Axioma' },
    { p: 'Botão **Analisar**: a IA comenta sua precificação e sugere ajustes.' },

    { h1: 'Meus Preços Salvos' },
    { numerada: ['Dê um nome ao preço (ex.: "Corte de cabelo masculino").', 'Clique em **Salvar Preço**.', 'O preço aparece na lista **Meus Preços Salvos**, que tem páginas ("Página X de Y").'] },
    { p: 'Em cada preço salvo: ✏️ editar (aparece "Editando..." e os botões **Atualizar Preço** e **Cancelar edição**) ou 🗑️ excluir.' },

    { h1: 'Dicas de Precificação MEI' },
    { lista: ['Nunca precifique abaixo do custo real — inclua DAS, IRPF e o valor do seu tempo.', 'Adicione 20 a 30% de margem mínima para imprevistos e investimentos.', 'Revise os preços a cada 6 meses (inflação e novos custos).'] },
  ],
}

export default doc
