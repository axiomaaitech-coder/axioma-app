// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "./tipos"

const doc: DocumentoAxioma = {
  arquivo: 'Axioma - Termos de Uso.docx',
  titulo: 'Termos de Uso',
  subtitulo: 'Contrato de licença de uso da plataforma Axioma AI.Tech',
  info: ['Versão 1.0  •  Vigência a partir de [[DATA DE VIGÊNCIA]]', 'Leia com atenção. Ao criar uma conta, aceitar um convite ou usar o Axioma, você concorda com estes Termos.'],
  blocos: [
    { h1: 'Apresentação' },
    { p: 'Bem-vindo ao Axioma. Estes Termos de Uso são o acordo entre você e o Axioma sobre como a plataforma funciona, o que cada parte se compromete a fazer e como protegemos você e a sua empresa. Escrevemos este documento para ser lido, não apenas aceito: as cláusulas seguem a lei brasileira, mas a linguagem foi pensada para ser clara.' },
    { p: 'O Axioma lida com informações sensíveis — números da sua empresa, contas bancárias, impostos e dados de pessoas. Por isso, três princípios orientam todas as regras a seguir:' },
    { lista: [
      '**Seus dados são seus.** Usamos as informações apenas para prestar o serviço que você contratou. Não vendemos dados e não os usamos para treinar inteligências artificiais de terceiros.',
      '**Você no controle.** Você decide quem da sua equipe acessa o quê e por quanto tempo, pode exportar seus dados e pode encerrar a conta quando quiser.',
      '**Transparência e boa-fé.** Avisamos com antecedência quando algo importante mudar e explicamos com clareza o que a plataforma faz e o que ela não faz.',
    ] },
    { h2: 'Resumo em linguagem simples' },
    { p: 'Este resumo ajuda a entender o essencial. Ele não substitui as cláusulas completas, que vêm logo depois.' },
    { tabela: { colunas: ['Assunto', 'Em poucas palavras'], larguras: [2600, 6426], linhas: [
      ['O que é o Axioma', 'Uma plataforma de gestão financeira com inteligência artificial, contratada por assinatura (cláusulas 4 e 5).'],
      ['Sua conta', 'É pessoal. Guarde sua senha e não compartilhe o login (cláusula 6).'],
      ['Sua equipe', 'Você convida pessoas, escolhe o nível e o prazo de acesso, e pode cortar o acesso a qualquer momento (cláusula 7).'],
      ['Planos e pagamento', 'A assinatura é da empresa, tem limite de pessoas por plano e pode ser cancelada quando quiser (cláusula 8).'],
      ['Inteligência artificial', 'Apoia as suas decisões, confere os números que cita e não decide por você (cláusula 9).'],
      ['Banco e pagamentos', 'A conexão bancária depende da sua autorização no banco; nenhum dinheiro sai sem você aprovar (cláusulas 10 e 11).'],
      ['Seus dados', 'Pertencem à sua empresa, são protegidos conforme a LGPD e podem ser exportados (cláusulas 12 e 16).'],
      ['Uso correto', 'Não use o Axioma para nada ilegal nem para acessar dados de outras empresas (cláusula 13).'],
      ['Responsabilidades', 'As decisões tomadas com base nas análises são suas; limitamos nossa responsabilidade dentro do que a lei permite (cláusulas 17 e 18).'],
    ] } },
    { nota: 'Se alguma regra não ficar clara, fale com a gente antes de aceitar. Preferimos explicar a deixar dúvidas.' },
    { h1: '1. Quem somos' },
    { p: 'A plataforma **Axioma AI.Tech** ("Axioma", "nós") é oferecida por [[RAZÃO SOCIAL]], pessoa jurídica de direito privado inscrita no CNPJ sob o nº [[CNPJ]], com sede em [[ENDEREÇO COMPLETO]], contato [[E-MAIL DE CONTATO]].' },
    { p: 'Estes Termos de Uso ("Termos") regulam o acesso e o uso do Axioma, disponível em axiomaai.com.br e em seus subdomínios. Eles devem ser lidos em conjunto com a **Política de Privacidade e Proteção de Dados**, que integra este contrato.' },

    { h1: '2. Definições' },
    { p: 'Para facilitar a leitura, as palavras abaixo têm o seguinte significado nestes Termos:' },
    { lista: [
      '**Plataforma ou Axioma:** o software de gestão financeira e inteligência empresarial oferecido como serviço pela internet (SaaS), incluindo todos os módulos, telas, integrações e funcionalidades de inteligência artificial.',
      '**Cliente:** a empresa (pessoa jurídica, inclusive MEI) que contrata o Axioma e em nome da qual os dados são lançados.',
      '**Usuário:** toda pessoa física que acessa o Axioma com login próprio, seja o Proprietário da empresa ou alguém convidado por ele.',
      '**Proprietário:** o Usuário titular da empresa no Axioma, responsável pela assinatura e pela gestão da Equipe.',
      '**Equipe:** os Usuários vinculados a uma empresa por convite (por exemplo: CEO, sócio, administrador, contador, funcionário, consultor, operador de caixa).',
      '**Dados do Cliente:** todas as informações que o Cliente ou sua Equipe lançam, importam ou conectam ao Axioma (receitas, custos, contas, notas fiscais, extratos, cadastros de clientes e fornecedores, entre outros).',
      '**Assinatura ou Plano:** a modalidade contratada (Starter, Pro, Business ou Enterprise), com seus limites e preço.',
      '**Open Finance:** o sistema regulado pelo Banco Central do Brasil que permite, com o consentimento do titular, compartilhar dados e iniciar pagamentos entre instituições.',
      '**LGPD:** a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).',
    ] },

    { h1: '3. Aceitação e capacidade' },
    { p: 'Ao criar uma conta, marcar a caixa de aceite, aceitar um convite ou simplesmente usar o Axioma, o Usuário declara que leu, entendeu e concorda com estes Termos e com a Política de Privacidade. Se não concordar, não deve usar a Plataforma.' },
    { p: 'O Axioma é destinado ao uso empresarial. Quem cria uma empresa ou contrata um Plano declara ter poderes para representá-la e obrigá-la a estes Termos. O uso por menores de 18 anos é proibido.' },
    { p: 'Por ser um serviço contratado por empresas para a sua própria atividade, a relação é regida principalmente pelo Código Civil (Lei nº 10.406/2002). Quando o Cliente for consumidor nos termos da lei, inclusive em situação de vulnerabilidade reconhecida, aplicam-se também as regras do Código de Defesa do Consumidor (Lei nº 8.078/1990).' },

    { h1: '4. O que o Axioma oferece' },
    { p: 'O Axioma é uma plataforma de gestão financeira e inteligência empresarial que reúne, entre outros, os módulos de Dashboard, MEI, Financeiro (receitas, custos, fluxo de caixa, DRE, endividamento e tesouraria), Contabilidade e Fiscal, Crescimento (metas, investimentos, simulações e precificação), Comercial (clientes, fornecedores, contas a pagar e a receber, estoque e inadimplência), Gestão (centros de custo, importação de documentos, relatórios e Open Finance), PDV (frente de caixa), Nexus (inteligência de mercado com o assistente José), IA Financeira, IA Tributária e Configurações (empresa, equipe, planos e uso da IA).' },
    { p: 'Os módulos e funcionalidades podem variar conforme o Plano contratado e podem ser melhorados, alterados ou descontinuados ao longo do tempo, sempre com aviso prévio quando a mudança reduzir de forma relevante o que foi contratado.' },

    { h1: '5. Licença de uso' },
    { p: 'Enquanto a Assinatura estiver ativa, concedemos ao Cliente e à sua Equipe uma licença de uso do Axioma **não exclusiva, intransferível, não sublicenciável, revogável e limitada** ao uso interno da empresa, nos termos da Lei nº 9.609/1998 (Lei do Software).' },
    { p: 'A licença não transfere ao Cliente nenhum direito de propriedade sobre o software, o código-fonte, a marca, o design, os textos, os modelos de cálculo ou qualquer outro elemento da Plataforma.' },

    { h1: '6. Cadastro, conta e segurança' },
    { p: 'Para usar o Axioma é preciso criar uma conta com e-mail válido e senha. O Usuário se compromete a informar dados verdadeiros, completos e atualizados, e responde pelas informações que fornecer.' },
    { lista: [
      'A conta é **pessoal e intransferível**. Cada pessoa deve usar o próprio login; não é permitido compartilhar senha.',
      'O Usuário é responsável por guardar sua senha e por todas as ações realizadas com o seu login.',
      'Usamos camadas de proteção como verificação anti-robô e código de confirmação enviado por e-mail. Esses mecanismos não substituem os cuidados do próprio Usuário.',
      'Em caso de suspeita de acesso indevido, o Usuário deve trocar a senha imediatamente e nos avisar pelo canal de contato.',
    ] },

    { h1: '7. Empresa, Equipe e níveis de acesso' },
    { p: 'Cada empresa no Axioma tem um Proprietário, que pode convidar outras pessoas para a Equipe. Os níveis de acesso seguem esta ordem: **Proprietário › CEO › Sócio › Administrador › demais papéis** (contador, financeiro, contábil, consultor, leitor e operador de caixa).' },
    { h2: '7.1 Convites' },
    { lista: [
      'Todo convite é feito para um e-mail específico e só pode ser aceito por esse e-mail, mediante código de confirmação.',
      'Quem convida declara, por meio de um termo eletrônico, que assume a responsabilidade pelo acesso concedido aos dados financeiros e bancários da empresa.',
      'Quem é convidado informa nome (e CPF, quando o acesso for superior a 30 dias ou sem prazo), confirma o remetente e aceita estes Termos e a Política de Privacidade antes de entrar.',
      'O acesso pode ter prazo (24 horas, 3, 7, 30, 60 ou 90 dias) ou ser sem prazo, este último apenas para Administrador, Sócio ou CEO.',
    ] },
    { h2: '7.2 Remoção, suspensão e saída' },
    { lista: [
      'Acesso de **até 30 dias** que for cortado é encerrado de forma definitiva; para voltar, é necessário novo convite.',
      'Acesso de **mais de 30 dias ou sem prazo** que for cortado fica suspenso por 7 dias e pode ser restaurado nesse período.',
      'A remoção de pessoas de nível igual ou superior pode exigir o aval de alguém acima, conforme as regras exibidas na tela Equipe.',
      'Qualquer membro pode sair da empresa quando quiser, exceto o Proprietário, que precisa antes transferir a propriedade.',
      'Os dados pessoais do termo de aceite de quem sai da empresa ficam guardados por 60 dias e depois são apagados automaticamente.',
    ] },
    { h2: '7.3 Transferência de propriedade' },
    { p: 'O Proprietário pode transferir a empresa para outro membro ativo da Equipe, informando o motivo. A Assinatura acompanha a empresa. O antigo Proprietário permanece na Equipe como Administrador, salvo se for removido depois.' },
    { nota: 'O Proprietário é o responsável perante o Axioma por quem ele convida e pelos acessos que concede. Recomendamos conceder sempre o menor nível de acesso necessário e pelo menor prazo possível.' },

    { h1: '8. Planos, assinatura e pagamento' },
    { h2: '8.1 Planos e limites' },
    { p: 'O Axioma é oferecido em planos com preços e limites diferentes, exibidos na tela Planos no momento da contratação. A Assinatura pertence à empresa. Os limites de pessoas vigentes são:' },
    { tabela: { colunas: ['Plano', 'Pessoas na equipe (contando o Proprietário)'], larguras: [3000, 6026], linhas: [['Starter', '1'], ['Pro', '2'], ['Business', '5'], ['Enterprise', '10']] } },
    { lista: [
      'Não ocupam vaga: o operador de caixa (PDV) e o contador ou consultor externo.',
      'Cada Plano dá direito a **3 convites temporários de até 7 dias** (por exemplo, para analistas convidados). Esses convites não ocupam vaga, mas, uma vez usados, só são renovados quando a empresa muda para um Plano superior.',
      'Acessos de 8 dias ou mais ocupam vaga do Plano.',
      'Ao atingir o limite, novos convites são bloqueados até que a empresa mude de Plano.',
    ] },
    { h2: '8.2 Cobrança' },
    { lista: [
      'Os pagamentos são processados pela Stripe, empresa especializada em pagamentos. O Axioma não armazena os dados completos do cartão.',
      'A Assinatura é cobrada de forma recorrente (mensal, salvo outra modalidade escolhida) e renovada automaticamente até ser cancelada.',
      'Se um pagamento não for confirmado, o acesso pode ser suspenso até a regularização. Os Dados do Cliente são preservados durante a suspensão, nos prazos da cláusula 16.',
      'Os preços podem ser reajustados, com aviso de pelo menos 30 dias antes da próxima cobrança. Se não concordar, o Cliente pode cancelar antes do reajuste.',
      'Tributos incidentes sobre o serviço seguem a legislação aplicável.',
    ] },
    { h2: '8.3 Cancelamento e reembolso' },
    { p: 'O Cliente pode cancelar a Assinatura a qualquer momento. O acesso continua até o fim do período já pago, sem cobrança no período seguinte. Não há reembolso proporcional de períodos já iniciados, exceto quando a lei garantir esse direito, como o direito de arrependimento de 7 dias da primeira contratação feita pela internet, quando o Cliente se enquadrar como consumidor (art. 49 do Código de Defesa do Consumidor).' },

    { h1: '9. Inteligência artificial' },
    { p: 'O Axioma usa inteligência artificial (IA) para explicar números, responder perguntas, ler documentos, sugerir classificações e gerar análises e planos. A IA é uma ferramenta de **apoio à decisão**:' },
    { lista: [
      'As respostas são geradas a partir dos Dados do Cliente e de informações públicas, mas podem conter erros, imprecisões ou omissões. O Axioma confere automaticamente os números citados pela IA contra os dados da empresa e sinaliza quando algo não pôde ser conferido.',
      'As decisões tomadas a partir das análises são de responsabilidade exclusiva do Cliente.',
      'Cálculos de impostos e obrigações exibidos pelo Axioma seguem regras fixas e a legislação vigente na data indicada; mudanças na lei podem alterar resultados.',
      'Para gerar as respostas, partes dos Dados do Cliente necessárias à pergunta são enviadas a provedores de IA (como OpenAI e Anthropic), sob contratos que não permitem o uso desses dados para treinar os modelos deles. Os detalhes estão na Política de Privacidade.',
      'Toda chamada de IA fica registrada para fins de auditoria (sem guardar o conteúdo da conversa nesse registro), e o consumo pode ser acompanhado na tela Uso da IA.',
    ] },

    { h1: '10. Open Finance e integrações bancárias' },
    { p: 'O Cliente pode conectar contas bancárias ao Axioma por meio da Pluggy, instituição que opera no ecossistema do Open Finance Brasil. A conexão:' },
    { lista: [
      'Depende do consentimento expresso do titular da conta, dado diretamente no ambiente da instituição financeira, com prazo e finalidade definidos.',
      'Serve para ler saldos, extratos e transações e conciliá-los com os lançamentos do Axioma.',
      'Pode ser revogada a qualquer momento pelo Cliente, no Axioma ou no banco.',
      'Segue as regras do Banco Central do Brasil e do Conselho Monetário Nacional sobre Open Finance (Resolução Conjunta nº 1/2020 e normas posteriores).',
    ] },
    { p: 'O Axioma não tem acesso à senha bancária do Cliente e não movimenta dinheiro sem autorização.' },

    { h1: '11. Pagamento de contas pelo Axioma' },
    { p: 'Quando a funcionalidade estiver disponível no Plano do Cliente, será possível pagar contas por Pix a partir da tela Contas a Pagar, usando a iniciação de pagamento do Open Finance. Nessas operações:' },
    { lista: [
      'Todo pagamento precisa ser **autorizado pelo próprio Cliente no aplicativo do seu banco**. O Axioma nunca retira dinheiro sozinho.',
      'O Cliente é responsável por conferir valor, favorecido e vencimento antes de autorizar.',
      'A baixa da conta e o registro do comprovante são feitos automaticamente quando a instituição confirma o pagamento.',
      'O Axioma não é instituição financeira e não responde por recusas, atrasos ou falhas causadas pelo banco, pela instituição iniciadora ou pelo recebedor.',
    ] },

    { h1: '12. Dados do Cliente e proteção de dados' },
    { p: 'Os Dados do Cliente pertencem ao Cliente. O Axioma os trata apenas para prestar o serviço, conforme estes Termos, a Política de Privacidade e a LGPD.' },
    { lista: [
      'Em relação aos dados pessoais que o Cliente lança na Plataforma sobre terceiros (por exemplo, clientes, fornecedores, funcionários e sócios), o **Cliente é o controlador** e o **Axioma atua como operador**, tratando esses dados somente conforme as instruções do Cliente e para as finalidades do serviço (art. 39 da LGPD).',
      'Em relação aos dados de cadastro, login e uso da própria conta dos Usuários, o **Axioma é o controlador**.',
      'O Cliente declara ter base legal adequada (art. 7º e, quando for o caso, art. 11 da LGPD) para lançar dados pessoais de terceiros no Axioma e se compromete a informar os titulares quando a lei exigir.',
      'O Axioma adota medidas técnicas e administrativas de segurança, como criptografia em trânsito, isolamento dos dados de cada empresa e controle de acesso por papel, e comunicará o Cliente sobre incidentes de segurança que possam acarretar risco ou dano relevante, nos termos do art. 48 da LGPD.',
      'O Axioma não vende Dados do Cliente e não os usa para treinar modelos de inteligência artificial de terceiros.',
    ] },

    { h1: '13. Uso aceitável' },
    { p: 'É proibido usar o Axioma para:' },
    { lista: [
      'Praticar atos ilícitos, fraude, lavagem de dinheiro, sonegação ou qualquer atividade contrária à lei.',
      'Lançar dados de terceiros sem base legal ou violar direitos de privacidade, imagem, propriedade intelectual ou sigilo.',
      'Tentar acessar dados de outras empresas, contornar controles de acesso, testar vulnerabilidades sem autorização escrita ou explorar falhas.',
      'Fazer engenharia reversa, copiar, revender, sublicenciar ou criar produtos concorrentes a partir da Plataforma.',
      'Usar robôs, extração automatizada de dados ou sobrecarregar a infraestrutura de forma abusiva.',
      'Enviar arquivos com vírus, códigos maliciosos ou conteúdo ilegal.',
      'Compartilhar login, revender acessos ou burlar os limites do Plano.',
    ] },
    { p: 'O descumprimento pode levar à suspensão imediata ou ao encerramento da conta, sem prejuízo das medidas legais cabíveis.' },

    { h1: '14. Propriedade intelectual' },
    { p: 'O Axioma, sua marca, nome, logotipos, telas, textos, ícones, modelos de cálculo, bases de conhecimento, código-fonte e demais elementos pertencem a [[RAZÃO SOCIAL]] ou aos seus licenciadores e são protegidos pelas Leis nº 9.609/1998 (software), nº 9.610/1998 (direitos autorais) e nº 9.279/1996 (propriedade industrial).' },
    { p: 'Os Dados do Cliente continuam sendo do Cliente. Sugestões e opiniões enviadas sobre a Plataforma podem ser usadas livremente para melhorá-la, sem obrigação de pagamento.' },

    { h1: '15. Disponibilidade, manutenção e suporte' },
    { lista: [
      'Empenhamo-nos para manter o Axioma disponível de forma contínua, mas podem ocorrer interrupções por manutenção, atualização, falhas de fornecedores (hospedagem, banco de dados, provedores de IA, bancos e instituições de Open Finance) ou eventos fora do nosso controle.',
      'Manutenções programadas serão, sempre que possível, feitas em horários de menor uso e comunicadas com antecedência.',
      'Informações de mercado exibidas no Nexus vêm de fontes públicas (como Banco Central, IBGE e organismos internacionais) e podem atrasar ou ficar indisponíveis por falha dessas fontes.',
      'O suporte é prestado pelos canais informados na Plataforma, em dias úteis.',
    ] },

    { h1: '16. Encerramento, exportação e exclusão de dados' },
    { lista: [
      'O Cliente pode encerrar a conta a qualquer momento.',
      'Podemos suspender ou encerrar o acesso em caso de violação destes Termos, falta de pagamento ou ordem de autoridade competente.',
      'Após o encerramento, o Cliente terá **30 dias** para exportar seus dados pelas funções de exportação da Plataforma (PDF, planilhas e relatórios).',
      'Depois desse prazo, os Dados do Cliente serão excluídos ou anonimizados, exceto os que devam ser guardados por obrigação legal ou regulatória (por exemplo, registros de acesso guardados por 6 meses conforme o art. 15 do Marco Civil da Internet) ou para o exercício de direitos em processos.',
    ] },

    { h1: '17. Limitação de responsabilidade' },
    { p: 'Na máxima extensão permitida pela lei:' },
    { lista: [
      'O Axioma é fornecido para apoiar a gestão; os resultados dependem da qualidade e da atualização dos dados lançados pelo Cliente.',
      'Não respondemos por decisões empresariais tomadas com base nas análises, nem por lucros cessantes, perda de oportunidade ou danos indiretos.',
      'Não respondemos por falhas de terceiros fora do nosso controle, como bancos, instituições de pagamento, provedores de internet e órgãos públicos.',
      'Quando houver responsabilidade nossa, ela fica limitada ao valor pago pelo Cliente ao Axioma nos 12 meses anteriores ao fato.',
      'Essas limitações não se aplicam a casos de dolo ou culpa grave, nem afastam direitos que a lei não permita limitar.',
    ] },

    { h1: '18. Responsabilidade do Cliente' },
    { p: 'O Cliente responde pelos dados que lança, pelos acessos que concede à sua Equipe e pelo uso da Plataforma em desacordo com estes Termos ou com a lei, e se compromete a ressarcir prejuízos causados ao Axioma ou a terceiros por esses motivos.' },

    { h1: '19. Comunicações e assinatura eletrônica' },
    { p: 'As comunicações entre as partes podem ser feitas por e-mail, por avisos na Plataforma ou por notificações. O aceite eletrônico destes Termos, dos termos de convite e das confirmações registradas na Plataforma tem validade jurídica, com registro de data, hora e identificação do Usuário, nos termos da legislação brasileira sobre documentos e assinaturas eletrônicas.' },

    { h1: '20. Alterações destes Termos' },
    { p: 'Podemos atualizar estes Termos para refletir mudanças legais, técnicas ou do serviço. Alterações relevantes serão comunicadas com antecedência mínima de 30 dias. O uso continuado após a vigência da nova versão significa concordância; se não concordar, o Cliente pode cancelar a Assinatura antes disso.' },

    { h1: '21. Disposições gerais' },
    { lista: [
      'A tolerância a um descumprimento não significa renúncia de direito.',
      'Se alguma cláusula for considerada inválida, as demais continuam valendo.',
      'O Cliente não pode ceder este contrato sem nossa concordância. Podemos cedê-lo em caso de reorganização societária, mantidas as condições.',
      'Estes Termos e a Política de Privacidade formam o acordo completo entre as partes sobre o uso do Axioma.',
    ] },

    { h1: '22. Lei aplicável e foro' },
    { p: 'Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de [[CIDADE/UF DO FORO]] para resolver eventuais controvérsias, com renúncia a qualquer outro, ressalvado o foro do domicílio do Cliente quando este for consumidor, nos termos da lei.' },

    { h1: '23. Contato' },
    { p: 'Dúvidas sobre estes Termos: [[E-MAIL DE CONTATO]].' },
    { p: 'Assuntos de privacidade e proteção de dados: Encarregado pelo Tratamento de Dados Pessoais [[NOME DO ENCARREGADO (DPO)]], [[E-MAIL DO ENCARREGADO]].' },
  ],
}

export default doc
