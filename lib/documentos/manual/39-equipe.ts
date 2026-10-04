// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '39 - Configurações - Equipe.docx',
  titulo: 'Manual 39 — Equipe',
  subtitulo: 'Quem tem acesso à empresa e com qual papel',
  info: ['Menu: Equipe (barra superior)  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Controla quem entra na empresa dentro do Axioma, o que cada pessoa pode fazer e por quanto tempo. Tudo fica registrado na auditoria da empresa.' },

    { h1: 'Papéis' },
    { tabela: { colunas: ['Papel', 'O que pode fazer'], larguras: [2800, 6226], linhas: [
      ['Proprietário', 'Dono da empresa. Acesso total. Ninguém pode removê-lo.'],
      ['Admin', 'Acesso total à gestão.'],
      ['Financeiro', 'Módulos financeiros.'],
      ['Contábil', 'Módulos contábeis e fiscais.'],
      ['Leitor', 'Só visualização.'],
      ['Caixa', 'Só o PDV, sem acesso ao restante do Axioma.'],
    ] } },
    { p: '**Hierarquia**: Proprietário › CEO › Sócio › Admin › demais. Ninguém remove o Proprietário. Para remover alguém do mesmo nível ou acima, é preciso o **aval** de alguém acima.' },

    { h1: 'Convidar uma pessoa' },
    { numerada: [
      'Clique em **Convidar pessoa**.',
      'Informe **E-mail** (obrigatório), nome, cargo, quem você está convidando (CEO, Sócio, Contador, Funcionário, Consultor, Outro) e o **Papel**.',
      'Escolha o **Tempo de acesso** (de 24 horas até indeterminado; indeterminado só para Admin, Sócio ou CEO) e o motivo.',
      'Marque o termo de responsabilidade e clique em **Gerar convite**.',
      'Envie pelo canal que preferir: WhatsApp, Gmail, Outlook, Telegram, e-mail ou **Copiar link**.',
    ] },
    { p: 'A pessoa abre o link, preenche o formulário e confirma com o **código enviado ao e-mail dela**. Se quem convida não é Admin, Sócio ou CEO, o convite precisa da autorização (e-mail e senha) de um deles, ou fica **Aguardando sua aprovação** para o responsável **Aprovar** ou **Recusar**.' },

    { h1: 'Vagas do plano' },
    { p: 'A assinatura pertence à **empresa**. Cada plano tem um número de pessoas: **Starter 1**, **Pro 2**, **Business 5**, **Enterprise 10**. Contam: o dono, a equipe fixa e convites de **8 dias ou mais**. **Não contam**: operador de caixa e contador ou consultor externo.' },
    { p: 'Convites **temporários de até 7 dias** (ex.: um analista para uma segunda opinião) não ocupam vaga, mas cada plano tem **3** desses convites; eles se esgotam ao usar e só renovam ao subir de plano. No limite, o convite é bloqueado e aparece o botão **Ver planos**.' },

    { h1: 'Remover, cortar e restaurar acesso' },
    { lista: [
      '**Remover acesso** de alguém fixo: o acesso fica **suspenso por 7 dias** e pode ser **restaurado** nesse prazo.',
      '**Cortar acesso** de convite **de até 30 dias**: encerra **de vez**. Para a pessoa voltar, envie um novo convite.',
      'Convites **acima de 30 dias ou sem prazo**: o corte suspende e o acesso pode ser restaurado, com os dados preservados.',
      'Toda remoção pede **motivo**, que fica registrado na auditoria com a data.',
      '**Sair desta empresa**: qualquer membro pode sair; um Sócio ou acima restaura em até 7 dias. O Proprietário precisa transferir a empresa antes de sair.',
    ] },
    { h2: 'Remoções aguardando aval' },
    { p: 'Quando a remoção depende de alguém acima, vira um pedido que vale 7 dias. Se ninguém acima responder no prazo, é possível **Concluir sem aval** informando o motivo. A barra superior avisa quando há pedido esperando você.' },

    { h1: 'Termos de convite e lixeira' },
    { p: '**Termos de convite aceitos**: quem aceitou, com nome, CPF e e-mail informados no aceite. Só o Proprietário e administradores veem.' },
    { p: 'Quando alguém sai da empresa, o termo vai para a **Lixeira de termos** (fechada, no fim da página). Fica guardado por **60 dias** e depois é apagado automaticamente. Dentro desse prazo, use **Recuperar**. Também é possível **apagar os dados pessoais** de um termo de forma definitiva, com motivo; fica registrado só quem apagou e quando.' },

    { h1: 'Transferir propriedade' },
    { p: 'O Proprietário pode passar a empresa para alguém com acesso ativo na equipe: **Transferir propriedade**, escolha a pessoa, marque "Entendo que deixo de ser o Proprietário" e clique em **Transferir**. A assinatura continua com a empresa.' },
    { nota: 'Se só você gerencia a equipe, o Axioma recomenda convidar um Sócio ou Admin para a empresa nunca ficar sem gestor.' },
  ],
}

export default doc
