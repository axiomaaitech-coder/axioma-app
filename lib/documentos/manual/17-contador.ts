// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '17 - Contabilidade - Contador.docx',
  titulo: 'Manual 17 — Contador',
  subtitulo: 'O que a Axioma descobriu sozinha nos seus números',
  info: ['Menu: Contabilidade → Contador  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Contador não é um balanço: é um **status de inteligência**. O Axioma vasculha seus lançamentos, contas a pagar, estoque e bancos e traz **descobertas**: riscos, inconsistências, oportunidades e previsões, cada uma com a prova de onde veio.' },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['Compartilhar', 'Envia o resumo das descobertas.'],
      ['Explique minha empresa', 'Abre a narrativa de como a empresa ganha e perde dinheiro.'],
      ['Se eu fizer nada', 'Projeção de onde a empresa chega em 30/60/90/180 dias sem nenhuma mudança.'],
      ['Fechamento', 'Mostra quão pronto está o fechamento do mês.'],
      ['Lançamento Manual', 'Ajustes e correções contábeis em partida dobrada.'],
      ['Rodar descoberta', 'Faz o Axioma vasculhar os dados agora. Ao terminar, avisa quantas descobertas novas achou ou "Nada novo — tudo já mapeado".'],
    ] } },

    { h1: 'O que a descoberta procura (e como)' },
    { p: 'A descoberta é feita por **regras fixas e auditáveis**, sem inventar números. Cada regra olha um ponto da empresa:' },
    { tabela: { colunas: ['Regra', 'O que encontra'], larguras: [3000, 6026], linhas: [
      ['Variação de despesa', 'Despesas que subiram ou caíram fora do normal no mês.'],
      ['Concentração de fornecedor', 'Um único fornecedor concentrando grande parte das contas a pagar.'],
      ['Concentração de banco e caixa', 'Dinheiro demais parado em uma única conta.'],
      ['Oportunidades em contas a pagar', 'Descontos, antecipações e renegociações possíveis.'],
      ['Estoque parado', 'Produtos sem giro, com dinheiro preso.'],
      ['Duplicidades', 'Contas que parecem lançadas duas vezes.'],
      ['Classificação suspeita', 'Lançamentos com categoria provavelmente errada.'],
      ['Anomalia correlacionada', 'Movimentos que, juntos, formam um padrão estranho.'],
    ] } },
    { p: 'A mesma descoberta não é repetida: rodar de novo só acrescenta o que é novo.' },

    { h1: 'As partes da tela' },
    { h2: 'Cards de resumo' },
    { p: '**Riscos Críticos**, **Atenção**, **Pendências**, **Oportunidades**, **Previsões** e **Descobertas abertas**. Clicar em "Ver estas descobertas" filtra a lista.' },
    { h2: 'Lista de descobertas' },
    { p: 'Cada linha mostra **Prioridade**, **Descoberta**, **Tipo** (Inconsistência, Anomalia, Oportunidade, Risco, Divergência, Concentração, Classificação Suspeita, Tendência), **Impacto**, **Confiança** (Fato, Cálculo, Inferência, Previsão ou Cenário) e **Status** (Aberta, Revisada, Resolvida, Ignorada).' },
    { p: 'Abrindo uma descoberta você vê o **Por quê**, onde foi **Encontrada** e a **Evidência**: os dados e o cálculo usados. Ações: **Corrigir no Lançamento Manual**, **Marcar como resolvida**, **Marcar como revisada** ou **Ignorar**. O filtro alterna entre **Mostrar só abertas** e **Mostrar todas**.' },
    { nota: 'Lista vazia com o filtro de abertas é um ótimo sinal: não há nada pendente.' },

    { h1: 'Explique Minha Empresa' },
    { p: 'Uma narrativa calculada direto dos lançamentos, sem nada inventado: **Como sua empresa ganha dinheiro** (receita do mês e comparação), **Onde sua empresa perde dinheiro** (despesa do mês), **Concentração** de fornecedores, **Como o caixa se comporta** (caixa disponível e Liquidity Score), **Riscos abertos** e **Oportunidades abertas**.' },
    { h1: 'Se Eu Fizer Nada' },
    { p: 'Mantendo tudo como está (sem cortar custo, sem vender mais, sem empréstimo), mostra onde a empresa chega em **30, 60, 90 e 180 dias**: saldo, Capital de Giro, Dívida Pendente e Liquidity Score. Se o caixa romper a reserva mínima, a tela avisa em quantos dias. O botão **Simular uma mudança grande** leva ao Gêmeo Financeiro.' },
    { h1: 'Fechamento (Continuous Close)' },
    { p: 'Mostra o **Close Readiness** (quão pronto está o fechamento do mês e a previsão de dias para fechar), o **Data Trust Score** (confiabilidade dos dados; aparece "Ainda não calculado" enquanto não houver base), os **Eventos não contabilizados** e as **contas a pagar e a receber pendentes**, com atalho "clique pra resolver".' },
    { h1: 'Lançamento Manual' },
    { p: 'Para ajustes, provisões e correções. Usa **partida dobrada de verdade**: débitos e créditos precisam somar o mesmo valor.' },
    { numerada: [
      'Informe a **Data** e a **Descrição** (ex.: "Provisão de depreciação de outubro").',
      'Escolha a conta e o valor de **Débito** ou **Crédito** em cada partida; use **Adicionar partida** para mais linhas.',
      'Confira o indicador **Diferença**: só grava quando mostrar "Bate certinho".',
      'Clique em **Gravar lançamento**.',
    ] },
    { p: 'Um lançamento nunca é editado: para corrigir, use **Estornar** (confirmando em "Sim, estornar") e lance de novo. O estornado fica marcado como **ESTORNADO**, preservando o histórico.' },
    { nota: 'Só o dono ou um administrador pode lançar ou estornar. Os demais veem em modo leitura.' },
  ],
}

export default doc
