// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '35 - Gestão - Open Finance.docx',
  titulo: 'Manual 35 — Open Finance (Conciliação)',
  subtitulo: 'Conecte o banco e veja se o sistema bate com o extrato',
  info: ['Menu: Gestão → Open Finance  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Conecta a conta bancária da empresa ao Axioma pelo **Open Finance** (sistema oficial do Banco Central, por meio da parceira Pluggy). As transações do banco entram sozinhas e o Axioma **concilia**: compara com o que já está lançado e avisa o que está diferente ou estranho.' },
    { alerta: 'A conexão é **somente leitura**: o Axioma vê saldo e extrato, mas não movimenta dinheiro. Você autoriza no ambiente do próprio banco e pode desconectar a qualquer momento.' },

    { h1: 'Passo a passo: conectar o banco' },
    { numerada: [
      'Clique em **Conectar Banco**.',
      'Busque o banco pelo nome e clique nele.',
      'Siga as telas do banco para autorizar o acesso.',
      'Ao voltar, aparece "Banco conectado com sucesso!". Clique em **Sincronizar** para trazer as transações.',
    ] },
    { nota: 'Bancos marcados como **Ambiente de teste** são simulações da Pluggy, não o seu banco real.' },

    { h1: 'As partes da tela' },
    { h2: 'Indicadores' },
    { tabela: { colunas: ['Indicador', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['Saldo do Banco', 'O saldo real informado pelo banco.'],
      ['Saldo do Sistema', 'O saldo calculado com o que está lançado no Axioma (receitas recebidas e custos lançados).'],
      ['Divergência', 'A diferença entre os dois: dinheiro não explicado.'],
      ['% Conciliado', 'Quanto das transações já foi casado com um lançamento.'],
    ] } },
    { p: 'Quando há diferença, a tela mostra quantas transações pendentes podem explicá-la, com o atalho **Ver pendentes**. Quando bate, aparece "Seu sistema bate com o banco".' },
    { h2: 'Bancos conectados' },
    { p: 'Lista das conexões, com **Desconectar** (pede confirmação).' },
    { h2: 'Abas de conciliação' },
    { tabela: { colunas: ['Aba', 'O que mostra e faz'], larguras: [2400, 6626], linhas: [
      ['Conciliado', 'Transações casadas com um lançamento ("Casado com...").'],
      ['Pendente', 'Transações sem lançamento correspondente. Use **Criar lançamento** (com a **categoria sugerida**) ou **Escolher lançamento** existente e **Usar este**. Se houver mais de um parecido, o Axioma pede para você escolher.'],
      ['Atípico', 'O que merece uma olhada: **Possível cobrança duplicada**, **Valor fora do padrão histórico** e **Débito novo, nunca visto antes**.'],
    ] } },
    { h1: 'Como a inteligência funciona aqui' },
    { p: 'A conciliação usa **regras**: compara valor, data e descrição, e o histórico da empresa para apontar atípicos. Nada é lançado sem você clicar.' },
  ],
}

export default doc
