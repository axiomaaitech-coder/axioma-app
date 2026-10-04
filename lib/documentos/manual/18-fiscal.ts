// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '18 - Contabilidade - Fiscal.docx',
  titulo: 'Manual 18 — Fiscal',
  subtitulo: 'Obrigações, descobertas fiscais e o Health Score explicado',
  info: ['Menu: Contabilidade → Fiscal  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O Fiscal mostra o **status fiscal da empresa**: quais obrigações vencem, o que está atrasado, onde há risco de imposto errado e a nota de saúde fiscal. Não é um formulário: o Axioma lê os dados e aponta o que precisa de atenção.' },

    { h1: 'Botões do cabeçalho' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['Compartilhar', 'Envia o resumo fiscal.'],
      ['Calendário', 'Abre o Calendário de Obrigações.'],
      ['Atividade Fiscal', 'Define a atividade e a alíquota de ISS.'],
      ['Rodar descoberta', 'Faz o Radar Fiscal vasculhar os dados agora.'],
    ] } },

    { h1: 'O Radar Fiscal (como a descoberta funciona)' },
    { p: 'São regras fixas, sem inventar números:' },
    { tabela: { colunas: ['Regra', 'O que encontra'], larguras: [3000, 6026], linhas: [
      ['Obrigação atrasada', 'Guias e declarações vencidas e não pagas.'],
      ['Obrigação sem preparação', 'Obrigações perto do vencimento sem os dados prontos.'],
      ['Divergência de imposto', 'Diferença entre o imposto calculado pelo Axioma e o lançado.'],
      ['Exposição fiscal', 'O valor total em risco com as pendências.'],
      ['Oportunidade de regime', 'Indícios de que outro regime tributário pagaria menos (o detalhe fica em IA Tributária).'],
    ] } },

    { h1: 'As partes da tela' },
    { h2: 'Cards de resumo' },
    { p: '**Crítico**, **Atenção**, **Pendências**, **Em Dia**, **Próx. Obrigações (7d)**, **Previsões** e **Descobertas**.' },
    { h2: 'Aviso de atividade fiscal' },
    { p: 'Se a atividade não foi definida, aparece: "Atividade fiscal não definida — o cálculo de imposto está usando um padrão (Serviços)", com o atalho **Definir agora →**.' },
    { h2: 'Fiscal Health Score' },
    { p: 'Nota de saúde fiscal formada por: **obrigações em dia** (%), **divergências** abertas, **documentos pendentes**, **exposição** e **qualidade dos dados** (quantos campos esperados estão preenchidos). A tela mostra cada parte para você saber exatamente o que melhorar.' },
    { h2: 'Próximas Obrigações' },
    { p: 'Obrigações dos próximos 30 dias, com os dias restantes ou a marca "atrasada". **Ver calendário completo →** leva ao calendário.' },
    { h2: 'Descobertas' },
    { p: 'Mesma lógica do Contador: prioridade, tipo, impacto, confiança e status, com **Por quê**, **Evidência** e as ações **Marcar como resolvida**, **revisada** ou **Ignorar**.' },
    { h2: 'Reforma Tributária' },
    { p: 'Bloco educativo sobre a transição da Reforma (2026 em diante). As regras ainda estão em transição e podem mudar; o Axioma mostra a premissa usada e a data.' },

    { h1: 'Calendário de Obrigações' },
    { p: 'Lista DAS, DASN, DEFIS, DCTF, EFD, ECF, ECD e as demais obrigações geradas para o seu regime, com **Vencimento**, **Valor** e **Status**. Escolha a janela em dias. Ações rápidas: **Marcar como paga** e **Marcar como dispensada**. A edição completa (nome, valor, recorrência) fica na aba Compliance da tela Empresa, para não duplicar o cadastro.' },
    { h1: 'Atividade Fiscal' },
    { numerada: [
      'Confira o **Regime Tributário** e o **CNAE Principal** (só leitura aqui; edite em Empresa).',
      'Escolha a atividade: **Comércio**, **Indústria**, **Serviço** ou **Misto**.',
      'Informe a **Alíquota de ISS do seu município** (2% a 5%). Em branco, o Axioma usa 5%.',
      'Clique em **Salvar**. A tela compara o imposto "Sem atividade definida" com "Com a atividade que você escolheu".',
    ] },
    { nota: 'Se o regime atual não usa a atividade no cálculo, ela fica guardada para quando você mudar de regime ou simular Lucro Presumido em IA Tributária. Só o dono ou um administrador pode alterar.' },
  ],
}

export default doc
