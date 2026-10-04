// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '03 - MEI - Cockpit.docx',
  titulo: 'Manual 03 — Cockpit MEI',
  subtitulo: 'O retrato consolidado do seu MEI, num só lugar',
  info: ['Menu: MEI → Cockpit  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Cockpit é a "foto do dia" do MEI. Enquanto o Painel MEI mostra tudo em detalhe, o Cockpit resume em **quatro vereditos** se você está bem ou se precisa agir hoje: teto, dinheiro que é seu, impostos e preço cobrado.' },

    { h1: 'As partes da tela' },
    { h2: 'Saudação e Score de Saúde' },
    { p: 'No topo aparece "Olá, (seu nome) — aqui está a foto de hoje.", o nome da empresa e o **Score de Saúde do MEI** (de 0 a 100). O botão **Ver detalhe** abre o Painel MEI com a explicação de cada parte do score.' },
    { h2: 'Alerta do dia' },
    { p: 'Uma faixa mostra o assunto mais urgente, na ordem de prioridade. Exemplos de mensagens:' },
    { lista: [
      '"DAS atrasado há X dias — juros e multa aumentando"',
      '"DAS vence em X dias"',
      '"Teto do MEI em X% — risco de estourar o limite"',
      '"O que é seu de verdade está negativo"',
      '"Sobra do mês não cobre DAS + IRPF"',
      '"Você está no prejuízo de R$ X por unidade cobrada"',
      '"Margem apertada: X% — pouca folga pra imprevisto"',
      '"Faturamento caiu X% vs. o mês anterior"',
      '"Tudo em ordem hoje — nenhum risco encontrado" (quando está tudo bem)',
    ] },
    { p: 'Quando o alerta tem um botão de ação, ele leva direto à tela que resolve o problema.' },

    { h2: 'Os 4 cards de veredito' },
    { tabela: { colunas: ['Card', 'O que mostra', 'Ao clicar abre'], larguras: [2300, 4600, 2126], linhas: [
      ['Teto do MEI', 'Quanto do teto anual já foi usado (% do teto), quanto resta e, no ritmo atual, quando estoura ou "Sem risco de estouro neste ritmo".', 'Faturamento'],
      ['O que é seu de verdade', 'O pró-labore seguro do mês, depois de separar DAS, IRPF, contas e reserva.', 'Painel MEI'],
      ['DAS & Obrigações', 'Se está **Em dia** ou **Atrasado**, quantos dias até vencer ou em atraso, e as consequências do atraso: multa no teto (20%), risco de CNPJ inapto e dívida ativa da União.', 'DAS & Obrigações'],
      ['Você está trabalhando de graça?', 'Compara o preço que você cobra com o custo real: mostra prejuízo por unidade, margem apertada ou margem saudável.', 'Precificação MEI'],
    ] } },
    { alerta: 'Se o card "Você está trabalhando de graça?" disser "Você ainda não informou quanto cobra hoje na Precificação MEI", clique em **Complete em Precificação MEI** e preencha o seu preço atual.' },

    { h2: 'Faixa de indicadores de apoio' },
    { lista: ['**Faturamento acumulado** no ano.', '**Projeção anual** no ritmo atual.', '**Sobra do mês vs. o que precisa guardar** (DAS + IRPF).'] },

    { h1: 'Botões' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['Compartilhar', 'Envia o retrato do dia por WhatsApp, e-mail, Telegram ou copia o texto.'],
      ['Ver detalhe', 'Abre o Painel MEI.'],
      ['Escuro / Tema Claro', 'Troca a aparência da tela.'],
    ] } },

    { h1: 'Como usar no dia a dia' },
    { numerada: ['Abra o Cockpit pela manhã.', 'Leia o alerta do dia e clique nele, se houver ação.', 'Confira se algum card está em vermelho e clique para resolver.', 'Compartilhe a foto do dia com o contador, se quiser.'] },
  ],
}

export default doc
