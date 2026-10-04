// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '15 - Financeiro - Endividamento.docx',
  titulo: 'Manual 15 — Endividamento',
  subtitulo: 'Empréstimos, financiamentos e dívidas sob controle',
  info: ['Menu: Financeiro → Endividamento  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Organiza todas as dívidas da empresa (empréstimos, financiamentos, parcelamentos) e responde: **a empresa aguenta essa dívida? qual pagar primeiro? vale refinanciar?** Ajuda a evitar o "muro de vencimentos" e a quebra de caixa.' },

    { h1: 'Botões do cabeçalho' },
    { p: '**Exportar PDF**, **+ Nova Dívida** e **Escuro / Tema Claro**.' },

    { h1: 'As partes da tela' },
    { h2: 'Cards principais' },
    { p: '**Total em Dívidas**, **Total Pago** e **Saldo Restante**.' },
    { h2: 'Semáforo de Solvência' },
    { p: 'Cor geral (verde, amarelo ou vermelho) que resume se a empresa consegue honrar as dívidas.' },
    { h2: 'Indicadores de Solvência' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [3000, 6026], linhas: [
      ['Cobertura de Juros', 'Quantas vezes o resultado operacional cobre os juros. Abaixo de 1, o lucro não paga nem os juros.'],
      ['Dívida / EBITDA', 'Em quantos anos de resultado a dívida seria paga.'],
      ['Dívida / Receita', 'O peso da dívida sobre o faturamento.'],
      ['Comprometimento Mensal', 'Quanto da receita mensal vai para parcelas.'],
      ['Fluxo de Caixa / Dívida', 'A capacidade de pagamento a partir do caixa gerado.'],
    ] } },
    { h2: 'Escada de Vencimentos' },
    { p: 'Mostra quanto vence em cada período e destaca um **Muro de vencimentos** quando muitas parcelas se concentram no mesmo momento.' },
    { h2: 'Método Avalanche' },
    { p: 'Ordena as dívidas da mais cara (maior juro) para a mais barata e marca qual **Quitar primeiro**. Pagar primeiro a mais cara economiza mais juros. Dívidas caras recebem a etiqueta **Cara**.' },
    { h2: 'Projeção de Quitação e Simulador de Refinanciamento' },
    { p: 'A janela de análise compara o **Ritmo Atual** com o **Avalanche** (quando cada uma quita). No **Simulador de Refinanciamento**, informe a **Nova taxa (% a.m.)** e o **Novo prazo (parcelas)** e veja a **Economia de Juros** e quanto o refinanciamento **Libera de Caixa por Mês**.' },
    { h2: 'Conselho CFO, Radar de Prevenção de Quebra e Runway da Dívida' },
    { p: 'Recomendações quando há risco e o tempo até a dívida apertar o caixa. Sem riscos, aparece "endividamento sob controle".' },
    { nota: '**Regra de ouro:** negocie antes de atrasar. Depois do atraso, você perde poder de barganha.' },
    { h2: 'Lista de dívidas' },
    { p: 'Cada dívida mostra **Valor Total**, **Já Pago**, **Restante**, **Taxa de juros**, **Vencimento**, número de parcelas e a barra de **Progresso de pagamento**, com ✏️ editar e 🗑️ excluir. Há busca por **Buscar dívida...**.' },

    { h1: 'Passo a passo: cadastrar uma dívida' },
    { numerada: ['Clique em **+ Nova Dívida**.', 'Informe descrição, credor/categoria, valor total, valor já pago, taxa de juros mensal, número de parcelas e o próximo vencimento.', 'Clique em **Salvar Dívida**.'] },
    { p: 'As parcelas passam a aparecer na previsão do Fluxo de Caixa e os juros entram na DRE automaticamente.' },
  ],
}

export default doc
