// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '00 - Introdução e Primeiros Passos.docx',
  titulo: 'Manual 00 — Introdução',
  subtitulo: 'Primeiros passos no Axioma: acesso, navegação, temas, idiomas e funções que existem em todas as telas',
  info: ['Manual de uso do Axioma AI.Tech  •  Versão 1.0'],
  blocos: [
    { h1: 'O que é o Axioma' },
    { p: 'O Axioma é o seu **CFO digital**: uma plataforma que reúne as finanças, os impostos, as vendas e a gestão da empresa em um só lugar e usa inteligência artificial para explicar os números e sugerir o que fazer. Ele não é só um sistema de lançamentos: cada tela mostra **o que está acontecendo, por que está acontecendo e qual é o próximo passo**.' },
    { p: 'Este manual é dividido em documentos numerados, um por módulo. Este primeiro explica o que é igual em todas as telas. Os seguintes explicam cada módulo, botão por botão.' },

    { h1: 'Criar a conta e entrar' },
    { numerada: [
      'Acesse **axiomaai.com.br** e clique em **Criar conta grátis** (ou **Cadastrar com Google**, para usar a sua conta Google).',
      'Informe nome, e-mail e uma senha. Confirme a verificação anti-robô (a caixinha da Cloudflare) quando ela aparecer.',
      'Confirme o e-mail pelo código enviado para a sua caixa de entrada.',
      'Escolha um plano na tela **Planos** para liberar os módulos.',
      'Na primeira entrada, o Axioma cria automaticamente a sua empresa com o nome "Minha Empresa". Complete o cadastro em **Config → Empresa** (a faixa verde no topo da tela lembra você disso).',
    ] },
    { nota: 'Esqueceu a senha? Na tela de login clique em **Esqueceu a senha?**. Você recebe um e-mail para criar uma nova.' },
    { h2: 'Entrar por convite' },
    { p: 'Se alguém da empresa convidou você, abra o link do convite recebido, preencha nome (e CPF, se o acesso for longo), confira quem convidou, aceite os Termos e a LGPD e digite o **código de 8 números** enviado ao seu e-mail. Pronto: você entra direto na empresa que convidou.' },

    { h1: 'O menu do topo' },
    { p: 'O menu fica fixo no alto de todas as telas e é dividido em grupos. Clique em um grupo para abrir a lista de telas dele:' },
    { tabela: { colunas: ['Grupo', 'O que tem dentro'], larguras: [2400, 6626], linhas: [
      ['🏠 Dashboard', 'Visão geral da empresa (Manual 01)'],
      ['🌐 Nexus', 'Inteligência de mercado com o assistente José (Manual 43)'],
      ['🟡 MEI (PRO)', 'Painel MEI, Cockpit, Faturamento, DAS & Obrigações, Reforma Tributária, Precificação MEI, IA MEI Advisor, Imposto de Renda (Manuais 02 a 09)'],
      ['🛒 PDV (PRO)', 'Frente de caixa, catálogo, cadastro de produtos, retaguarda e entrada de NF-e (Manual 42)'],
      ['💰 Financeiro', 'Receitas, Custos Fixos, Custos Variáveis, Fluxo de Caixa, DRE, Endividamento, Tesouraria (Manuais 10 a 16)'],
      ['📒 Contabilidade', 'Contador, Fiscal, Livro Razão, Balancete, DRE Contábil (Manuais 17 a 21)'],
      ['📈 Crescimento', 'Metas, Investimentos, Simulações, Precificação (Manuais 22 a 25)'],
      ['👥 Comercial', 'Clientes, Fornecedores, Contas a Pagar, Estoque, Contas a Receber, Inadimplência (Manuais 26 a 31)'],
      ['🏢 Gestão', 'Centros de Custo, Importar Documentos, Relatórios, Open Finance (Manuais 32 a 35)'],
      ['🤖 IA Premium', 'IA Financeira e IA Tributária (Manuais 36 e 37)'],
      ['⚙️ Config', 'Empresa, Equipe, Planos, Uso da IA (Manuais 38 a 41)'],
      ['🏦 BANCO', 'Atalho para conectar o banco (Open Finance)'],
      ['🇧🇷 🇺🇸 🇪🇸', 'Troca o idioma de todo o Axioma: português, inglês ou espanhol'],
      ['Sair', 'Encerra a sua sessão com segurança'],
    ] } },
    { p: 'No celular, o menu vira o botão **☰** no canto do topo.' },

    { h1: 'Faixas de aviso no topo' },
    { lista: [
      '**Faixa verde-menta "Complete o cadastro da sua empresa"**: aparece enquanto o cadastro da empresa estiver incompleto. Clique para ir direto à tela Empresa.',
      '**Faixa azul-marinho "pedido de aval na Equipe"**: aparece quando alguém pediu um aval que você pode decidir. Clique em **Ver agora** para abrir a Equipe.',
    ] },

    { h1: 'O que existe em quase todas as telas' },
    { h2: 'Cabeçalho do módulo' },
    { p: 'Cada módulo começa com um cartão azul-marinho com o nome da tela, uma frase explicando para que ela serve e os botões principais:' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2600, 6426], linhas: [
      ['📄 Exportar PDF', 'Gera um PDF com os dados da tela (tabelas, totais e indicadores) para salvar, imprimir ou enviar.'],
      ['+ Novo (lançamento, cliente, conta...)', 'Abre a janela de cadastro do item principal do módulo.'],
      ['Escuro / Tema Claro', 'Troca a aparência da tela. O Escuro tem fundo azul-escuro; o Claro tem fundo branco e cards creme. A escolha fica guardada.'],
    ] } },
    { h2: 'Seletor de período' },
    { p: 'Nos módulos com números ao longo do tempo há um seletor com as opções **Mês atual, Mês anterior, Trimestre atual, Ano atual, Últimos 12 meses e Personalizado** (você escolhe as datas de início e fim). Os cards, gráficos e tabelas passam a mostrar só o período escolhido, e as setas ▲▼ comparam com o período anterior equivalente.' },
    { h2: 'Letreiro' },
    { p: 'A faixa azul-marinho com texto passando (o letreiro) resume os números mais importantes da tela em uma linha. Passe o mouse por cima para pausar a leitura.' },
    { h2: 'Cards com efeito verde-menta' },
    { p: 'Todos os cartões têm um efeito ao passar o mouse: a borda acende e aparece uma faixa verde-menta no topo. Muitos cartões são **clicáveis** e levam ao módulo de origem daquele número ou filtram a lista da própria tela.' },
    { h2: 'Compartilhar (Centro de Compartilhamento)' },
    { p: 'O botão **Compartilhar** abre o Centro de Compartilhamento, onde você escolhe:' },
    { lista: [
      '**Resumo** (os principais números) ou **Detalhado** (lista completa).',
      'O canal: **WhatsApp, Gmail, Outlook, Telegram, outro e-mail** ou **Copiar** (para colar onde quiser).',
    ] },
    { p: 'Os valores compartilhados vão sempre com centavos exatos, sem arredondamento.' },
    { h2: 'Ver Histórico' },
    { p: 'Em alguns módulos (como DRE e Contas a Pagar) o botão **Ver Histórico** mostra os fechamentos anteriores ou as alterações feitas, com quem fez e quando.' },

    { h1: 'Inteligência artificial no Axioma' },
    { lista: [
      'A IA está nas telas IA Financeira, IA Tributária, Nexus (José), na leitura de notas fiscais e em explicações dentro dos módulos.',
      'Ela usa os números reais da sua empresa e **confere os valores** que cita; quando algo não pôde ser conferido, a tela avisa.',
      'Os cálculos de impostos e totais não são feitos pela IA, e sim por regras fixas do Axioma. A IA explica e sugere.',
      'O consumo da IA aparece em **Config → Uso da IA**.',
    ] },

    { h1: 'Boas práticas' },
    { lista: [
      'Lance as receitas e os custos com frequência: quanto mais completos os dados, melhores as análises.',
      'Conecte o banco em **Open Finance** para trazer o extrato automaticamente.',
      'Use **Importar Documentos** para lançar notas fiscais e extratos de uma vez.',
      'Dê à sua equipe só o acesso necessário e pelo menor prazo (veja o Manual 39 — Equipe).',
    ] },
  ],
}

export default doc
