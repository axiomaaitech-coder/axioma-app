// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '40 - Configurações - Planos.docx',
  titulo: 'Manual 40 — Planos e Assinatura',
  subtitulo: 'Escolha, assine e gerencie o plano da empresa',
  info: ['Menu: Planos  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Mostra os planos do Axioma e permite assinar. O plano define os recursos disponíveis e quantas pessoas podem usar a empresa.' },

    { h1: 'Como assinar' },
    { numerada: [
      'Abra **Planos** e compare os cards. O plano mais escolhido aparece como **⭐ Mais Popular**.',
      'Clique em **Começar agora** no plano desejado.',
      'Você vai para a página de pagamento segura do **Stripe**, parceiro de pagamentos usado por empresas do mundo todo. O Axioma não vê nem guarda os dados do seu cartão.',
      'Ao concluir, o acesso é liberado automaticamente.',
    ] },
    { p: 'Todo plano começa com **14 dias grátis**. **Cancele quando quiser, sem fidelidade.**' },

    { h1: 'Pessoas por plano' },
    { tabela: { colunas: ['Plano', 'Pessoas'], larguras: [3000, 6026], linhas: [
      ['Starter', '1'],
      ['Pro', '2'],
      ['Business', '5'],
      ['Enterprise', '10'],
    ] } },
    { p: 'A assinatura pertence à **empresa**: se a propriedade for transferida, o plano vai junto. Detalhes de quem conta como vaga estão no manual 39 (Equipe).' },
    { nota: 'Os recursos e preços de cada plano podem ser atualizados. Os valores válidos são sempre os mostrados na tela no momento da assinatura.' },
  ],
}

export default doc
