// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '38 - Configurações - Empresa.docx',
  titulo: 'Manual 38 — Empresa',
  subtitulo: 'Cadastro profissional, compliance e cofre de documentos',
  info: ['Menu: Config → Empresa  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'É a ficha oficial da empresa no Axioma. Os dados daqui alimentam todos os módulos: o regime tributário define os impostos da DRE e da IA Tributária, o CNAE define a atividade, e as obrigações aparecem no Fiscal. Também guarda os documentos da empresa em um cofre e registra todas as alterações.' },

    { h1: 'Topo da tela' },
    { lista: [
      '**📊 Health Score (Completude)**: quanto do cadastro está preenchido. Clique para ver o que falta.',
      '**🛡️ Compliance Score (Fiscal)**: como estão as obrigações fiscais.',
      '**📤 Compartilhar Cartão da Empresa**: envia um cartão com os dados principais (WhatsApp, e-mail, Telegram, copiar ou **PDF Cartão**).',
    ] },

    { h1: 'Abas' },
    { h2: '🏢 Dados Cadastrais' },
    { p: 'Use **🪄 Preencher por CNPJ**: digite o CNPJ e o Axioma consulta a Receita Federal (pela BrasilAPI, gratuita) e mostra razão social, situação, porte, CNAE, cidade e sócios. Clique em **✓ Aplicar Dados** e depois em salvar.' },
    { p: 'Blocos do cadastro: **Logo**; identificação (razão social, nome fantasia, inscrições, porte); **🏛️ Tributário** (regime, CNAE, natureza jurídica, capital social, data de abertura, situação cadastral); **📍 Endereço** (o CEP preenche sozinho); **📞 Contato** (telefones e e-mails principal, financeiro e contábil, site); **🏦 Dados Bancários** (banco, agência, conta, chave Pix com o tipo detectado automaticamente); **👤 Contador** (nome, CRC, telefone, e-mail).' },
    { p: 'Clique em **✅ Salvar Dados da Empresa**. O botão **Limpar campos** só esvazia a tela; nada é apagado até você salvar, e as outras abas não são afetadas.' },
    { h2: '👥 Sócios & Equipe' },
    { p: '**Quadro Societário**: **+ Novo Sócio** com nome, CPF/CNPJ, tipo de pessoa, qualificação (Sócio, Sócio Administrador, Administrador, Diretor, Procurador, Outros), % de participação e data de entrada.' },
    { h2: '📋 Compliance & Fiscal' },
    { p: 'O **Calendário Fiscal**: **🪄 Gerar Calendário Automático** cria as obrigações do seu regime (defina o regime antes). **+ Nova Obrigação** cadastra uma à mão: tipo, nome, descrição, vencimento, valor estimado, status (Pendente, Paga, Atrasada, Dispensada) e recorrência (Mensal, Trimestral, Anual, Única). Use **Marcar paga** quando quitar.' },
    { h2: '📄 Cofre Digital' },
    { p: 'Guarde Contrato Social, Cartão CNPJ, alvarás e certidões (PDF, imagens ou planilhas, até 50 MB cada, armazenamento criptografado). Informe nome, número, emissão, validade e órgão emissor. Documentos vencidos ficam marcados como **VENCIDO**. Use **⬇️ Baixar** para abrir.' },
    { h2: '🔐 Auditoria' },
    { p: 'O **Histórico de Alterações**: cada criação, edição ou exclusão fica registrada com data, hora, quem fez e o que mudou. Alterações com dado pessoal de terceiros aparecem sem o conteúdo, por privacidade.' },
    { h2: '🔁 Transferir empresa' },
    { p: 'Para quando a empresa muda de dono de verdade: venda, doação, herança ou reorganização entre sócios. Só o **Proprietário** pede; CEO, Sócios e Admins veem o histórico. (Para só passar o comando do Axioma a um CEO, Sócio ou Admin permanente que já está na equipe, use **Transferir propriedade** na tela Equipe.)' },
    { lista: [
      '**1. Tipo da empresa e da operação**: LTDA, SLU, S.A. ou outra. **MEI e Empresário Individual não podem ser transferidos** (o CNPJ é da própria pessoa) — a tela explica o caminho certo.',
      '**2. Quem passa e quem recebe**: nome, CPF ou CNPJ e o e-mail de quem recebe.',
      '**3. Registro na Junta Comercial**: número do protocolo/registro, data e o documento em PDF (vai também para o Cofre).',
      '**4. O que a lei pede**: marque os itens obrigatórios (documento assinado, registro na Junta, quadro de sócios na Receita; em herança, alvará ou formal de partilha). Certidões, contador e bancos são recomendados.',
      '**5. Confirmar**: escolha se você continua como Admin ou sai, escreva o motivo, marque a declaração e digite sua senha. Clique em **Enviar pedido de transferência**.',
    ] },
    { p: 'Copie o link e mande para quem recebe. Ela entra no Axioma com o e-mail indicado (ou cria a conta), confere o resumo, digita o CPF, aceita a declaração e a LGPD e clica em **Aceitar e assumir a empresa**. O link vale **7 dias**; até o aceite você pode **Cancelar transferência** (com motivo). Cada pedido fica no **Histórico de transferências** para sempre, com **Baixar PDF**.' },
    { nota: 'As regras da lei foram conferidas em 09/10/2026 (Código Civil, Lei 6.404/76 e normas do DREI) e podem mudar. Confirme com a Junta Comercial do seu estado antes de assinar.' },
    { nota: 'Só quem tem permissão de edição altera a empresa. Os demais veem em modo leitura.' },
  ],
}

export default doc
