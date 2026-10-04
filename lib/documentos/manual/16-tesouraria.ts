// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '16 - Financeiro - Tesouraria.docx',
  titulo: 'Manual 16 — Tesouraria',
  subtitulo: 'Como está o caixa, o que vai acontecer e qual o risco, numa visão só',
  info: ['Menu: Financeiro → Tesouraria  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A Tesouraria é o **centro de comando do caixa**. Junta o saldo de todas as contas, separa o dinheiro livre do que está aplicado ou preso, projeta o caixa nos próximos dias e avisa os riscos antes que virem problema. Tem três telas de apoio: **Simulador de Estresse**, **Gêmeo Financeiro** e **Configurar**.' },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Compartilhar', 'Envia o resumo da tesouraria.'],
      ['Simulador de Estresse', 'Abre a tela que testa "e se" no caixa (queda de receita, atraso, nova dívida).'],
      ['Gêmeo Financeiro', 'Abre a cópia digital da empresa em 30/60/90 dias, com ou sem uma mudança grande.'],
      ['Configurar', 'Define a reserva mínima, os dias de alerta e o nome de cada conta.'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Cards principais' },
    { tabela: { colunas: ['Card', 'O que mostra'], larguras: [2800, 6226], linhas: [
      ['Caixa total', 'Soma de todas as contas.'],
      ['Disponível', 'Dinheiro livre para usar agora.'],
      ['Reserva mínima', 'O valor que você definiu para nunca ser tocado.'],
      ['Liquidity Score', 'Nota de liquidez de 0 a 100: Crítico, Atenção, Bom ou Excelente.'],
    ] } },
    { h2: 'Cobertura, Reserva e Folga' },
    { p: 'Três cards internos: **Cobertura** (quantos dias o caixa cobre as saídas), **Reserva** (se a reserva mínima está garantida) e **Folga** (quanto sobra acima da reserva).' },
    { h2: 'Posição de Caixa' },
    { p: 'Tabela com cada conta, o **Tipo** (Disponível, Aplicado ou Restrito) e o **Saldo**, além do **Total Geral**, do **Livre de Fato** e do **Aplicado**. As contas vêm do Open Finance e dos cadastros.' },
    { h2: 'Caixa Potencialmente Ocioso' },
    { p: 'Dinheiro parado que poderia render. A conta é mostrada na tela: **disponível − reserva mínima − saídas previstas em 30 dias**. Se sobra, é sinal de que vale aplicar.' },
    { h2: 'Fluxo Projetado' },
    { p: 'Gráfico do saldo nos próximos dias em três cenários: **Otimista**, **Base** e **Estressado**. Escolha o **Horizonte** em dias. Enquanto não há histórico suficiente, os cenários Base e Estressado ficam iguais ao Otimista; a tela avisa quando isso acontece.' },
    { h2: 'Treasury Radar' },
    { p: 'Lista os **riscos ativos**: caixa que vai romper a reserva, saldo projetado abaixo do mínimo, concentração em uma conta e outros. Cada risco tem o botão **Resolver**, que leva ao lugar certo para agir.' },
    { h2: 'Pergunte à Tesouraria' },
    { p: 'Campo de pergunta em linguagem natural (ex.: "como está meu caixa?"). A inteligência responde **apenas com os dados reais desta empresa**, sem inventar números.' },

    { h1: 'Simulador de Estresse' },
    { p: 'Ajuste as variáveis e veja o impacto no caixa ao vivo, sempre em cima do fluxo projetado real:' },
    { lista: ['**Receita** (queda ou aumento em %).', '**Atraso dos recebimentos** (em dias).', '**Despesas** (aumento ou corte em %).', '**Nova Dívida**: valor que entra hoje e a parcela mensal.', '**Nova Contratação**: custo mensal.'] },
    { p: 'O resultado mostra **Caixa Disponível** e **Liquidity Score** (com o valor de antes), o gráfico **Antes × Simulado** e, se houver, o aviso: "Neste cenário, o caixa rompe a reserva mínima em X dias". Use **Salvar Cenário** para guardar com um nome; depois é possível **Editar** ou **Excluir**. **Zerar** volta tudo ao início.' },
    { nota: 'Tudo é calculado por regras fixas: a variação é aplicada sobre o cenário Base real (lançamentos, contas a pagar e a receber), nunca inventada.' },

    { h1: 'Gêmeo Financeiro' },
    { p: 'Mostra como a empresa está agora e como estará em 30, 60 e 90 dias: **Caixa Disponível**, **Capital de Giro** (contas a receber + estoque − contas a pagar), **Dívida Pendente** e **Liquidity Score**.' },
    { p: 'Em **Aplicar uma mudança grande**, escolha **Receita +30%**, **Novo Empréstimo** (valor e parcela) ou **Nova Filial** (investimento inicial e custo mensal). A tabela **Antes × Depois** compara caixa, saldo projetado em 90 dias e dívida, e avisa se a mudança faz o caixa romper a reserva.' },

    { h1: 'Configurar' },
    { lista: ['**Reserva mínima (R$)**: o caixa que deve ficar sempre intocado. Usado no Liquidity Score e no Radar.', '**Dias de alerta de ruptura**: com quantos dias de antecedência o Axioma avisa.', '**Contas de Tesouraria**: dê um nome amigável a cada conta (ex.: "Itaú CC") e marque o tipo: Disponível, Aplicado ou Restrito.'] },
    { nota: 'Só o dono ou um administrador da empresa pode alterar a configuração. Os demais veem em modo leitura.' },
  ],
}

export default doc
