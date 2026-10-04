// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '10 - Financeiro - Receitas.docx',
  titulo: 'Manual 10 — Receitas',
  subtitulo: 'Gerencie as entradas e o faturamento da empresa',
  info: ['Menu: Financeiro → Receitas  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Receitas é onde ficam **todas as entradas de dinheiro** da empresa: vendas, serviços, contratos recorrentes e receitas eventuais. É a base de quase todos os outros módulos: DRE, Fluxo de Caixa, Metas, IA Financeira e Dashboard usam estes lançamentos.' },
    { p: 'Além de guardar os lançamentos, a tela traz uma **camada CFO**: indicadores que um diretor financeiro acompanha, como receita recorrente, crescimento, ticket médio e concentração.' },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Exportar PDF', 'Gera o PDF com a lista de receitas e os totais do período.'],
      ['+ Nova Receita', 'Abre a janela de cadastro.'],
      ['Escuro / Tema Claro', 'Troca a aparência.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Seletor de período e Compartilhar' },
    { p: 'Escolha Mês atual, Mês anterior, Trimestre, Ano, Últimos 12 meses ou Personalizado. O botão **Compartilhar** envia o resumo das receitas por WhatsApp, e-mail, Telegram ou copia.' },
    { h2: 'Cards principais' },
    { tabela: { colunas: ['Card', 'O que mostra'], larguras: [2600, 6426], linhas: [
      ['Total de Receitas', 'Soma do período escolhido.'],
      ['Recebido', 'O que já entrou de fato.'],
      ['Pendente', 'O que foi lançado mas ainda não foi recebido.'],
    ] } },
    { h2: 'Camada CFO (indicadores)' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['Receita Recorrente (MRR)', 'Quanto entra todo mês de forma recorrente (contratos, mensalidades).'],
      ['Receita Anual (ARR)', 'A receita recorrente projetada para 12 meses.'],
      ['Crescimento no Mês', 'Variação da receita em relação ao mês anterior.'],
      ['Ticket Médio', 'Valor médio de cada receita lançada.'],
      ['Concentração Top 20%', 'Quanto da receita vem dos 20% maiores lançamentos. Alta concentração significa risco.'],
      ['% Recorrente', 'Quanto da receita é recorrente. Quanto maior, mais previsível o negócio.'],
    ] } },
    { p: 'Cada indicador mostra a comparação com o período anterior (▲ ou ▼). Os cards são clicáveis e levam à origem do número.' },
    { h2: 'Letreiro' },
    { p: 'Faixa azul-marinho com os principais números passando.' },
    { h2: 'Análise Anual' },
    { p: 'Três visões: **Evolução Mensal** (realizado mês a mês), **Composição por Categoria** e **Previsão (próximos 3 meses)**, a projeção do Axioma feita a partir do seu histórico.' },
    { h2: 'Insights Inteligentes' },
    { p: 'Mensagens automáticas, calculadas por regras do Axioma, por exemplo:' },
    { lista: ['"Alta concentração: poucos lançamentos representam a maior parte."', '"Queda em relação ao mês anterior. Atenção ao fluxo."', '"Baixa recorrência: dependência de itens eventuais aumenta o risco."', '"Crescimento consistente. Continue acelerando."', '"Boa base recorrente: resultado previsível e saudável."'] },
    { h2: 'Busca e lista' },
    { p: 'Campo **Buscar receita...** e filtro. A tabela mostra descrição, valor, data, categoria e status. Em cada linha há ✏️ editar e 🗑️ excluir.' },

    { h1: 'Passo a passo: lançar uma receita' },
    { numerada: [
      'Clique em **+ Nova Receita**.',
      'Preencha **Descrição**, **Valor (R$)**, **Data**, **Categoria** e **Status** (Recebido ou Pendente).',
      'Opcional: escolha o **Centro de Custo**, para ver depois o resultado por área.',
      'Clique em **Salvar Receita**.',
    ] },
    { nota: 'Toda alteração e exclusão fica registrada na auditoria da empresa. Se o registro de auditoria falhar, a tela avisa, mas o lançamento continua salvo.' },
    { h1: 'Dicas' },
    { lista: ['Use categorias consistentes: elas alimentam a Composição por Categoria e a DRE.', 'Marque como Recebido quando o dinheiro entrar, para o Fluxo de Caixa ficar fiel.', 'Notas fiscais de venda podem ser importadas em **Importar Documentos**, que lança a receita sozinho.'] },
  ],
}

export default doc
