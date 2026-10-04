// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '27 - Comercial - Fornecedores.docx',
  titulo: 'Manual 27 — Fornecedores',
  subtitulo: 'Cadeia de suprimentos com score, risco e inteligência de compras',
  info: ['Menu: Comercial → Fornecedores  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Organiza todos os fornecedores e mostra **de quem a empresa depende**, **quem está aumentando preço**, **onde há desperdício** e **quais contratos e documentos vão vencer**. Cada fornecedor recebe o **Score Corporativo Axioma** (0 a 1000).' },

    { h1: 'Dashboard Executivo' },
    { p: 'Grade de 17 indicadores. Clique em qualquer um para ver o detalhe e a explicação de como é calculado:' },
    { tabela: { colunas: ['Indicador', 'Como é calculado'], larguras: [3000, 6026], linhas: [
      ['Total / Ativos / Inativos', 'Contagem pelo status no cadastro.'],
      ['Valor Total Contratado', 'Soma do valor de todos os contratos cadastrados.'],
      ['Compras do Mês / do Ano', 'Soma das contas a pagar emitidas para fornecedores no período.'],
      ['Dependência Financeira', 'Quanto do total pago está no maior fornecedor.'],
      ['Diversificação da Cadeia', 'Índice de 0 a 100: 100 é gasto bem espalhado, 0 é tudo num só.'],
      ['Risco Médio da Carteira', 'Média da classificação de risco informada no cadastro.'],
      ['Pontualidade de Pagamento', 'Quanto a empresa paga os fornecedores em dia.'],
      ['Índice de Qualidade', 'Média do nível de qualidade informado no cadastro.'],
      ['Índice de Estabilidade', 'Tempo médio de relacionamento com os fornecedores ativos.'],
      ['Score Médio dos Fornecedores', 'Média do Score Corporativo Axioma.'],
    ] } },
    { nota: 'Indicadores como Economia Obtida, Índice de Negociação e Lead Time aparecem como "Sem dados suficientes" porque dependem de informações que o Axioma ainda não registra (cotações e prazo de entrega). Nada é inventado.' },
    { h2: 'Curva ABC e Distribuição Geográfica' },
    { p: 'A Curva ABC mostra a concentração de gasto: **Classe A** (80% do gasto), **Classe B** (até 95%) e **Classe C**. O mapa mostra fornecedores por estado.' },
    { h2: 'Radar de Risco e Escada de Vencimentos' },
    { p: 'O Radar mostra risco, dependência, concentração, qualidade e atraso de pagamento. A Escada lista documentos e contratos que vencem nos próximos 6 meses.' },
    { h2: 'Ranking Axioma' },
    { p: 'Fornecedores ordenados pelo **Score Corporativo Axioma** (0 a 1000), formado por critérios com peso próprio: Risco, Compliance, Relacionamento, Confiabilidade, Preço, Capacidade de Entrega, Saúde Financeira, Sustentabilidade, Inovação e Flexibilidade, entre outros. **Ver Score** mostra o peso e a contribuição de cada critério.' },

    { h1: 'Inteligência de Compras' },
    { lista: [
      '**Evolução de Compras** de cada fornecedor.',
      '**Inflação do Fornecedor**: quanto ele aumentou em relação ao período anterior.',
      '**Tendência de Reajuste**: aponta "Acima da própria média" e "Aumento recorrente".',
      '**Sazonalidade**: distribuição das compras nos últimos 12 meses.',
      '**Desperdícios**: descrições muito parecidas, possível cobrança duplicada.',
      '**Oportunidades de Consolidação**: fornecedores na mesma categoria e a economia estimada concentrando no de menor ticket.',
    ] },
    { h1: 'Painel de Alertas' },
    { p: 'Tudo que pede atenção agora, cada um com a ação sugerida: **Fornecedor parado**, **Fornecedor em risco**, **Contrato vencendo**, **Documento vencendo**, **Preço acima da média interna**, **Dependência elevada**, **Compras concentradas** e **Aumento recorrente de preço** (subiu em 3 compras seguidas).' },
    { h1: 'Simulador Executivo' },
    { p: 'Simule uma decisão antes de tomá-la: **Troca de Fornecedor**, **Mudança de Preço**, **Mudança de Prazo**, **Mudança Cambial**, **Perda de Fornecedor Estratégico** ou **Novo Fornecedor**. Informe se o gasto é custo fixo ou variável, os valores e o horizonte. O resultado mostra Receita, EBITDA, Lucro Líquido, Caixa Projetado e Margem em quatro cenários (Conservador, Base, Otimista, Adverso).' },
    { h1: 'Reforma Tributária 2026 por Fornecedor' },
    { p: 'Mostra o potencial de cada fornecedor gerar **crédito tributário** no novo IVA (CBS/IBS): **Crédito Pleno**, **Parcial**, **Baixo** ou **Indefinido**, com base no regime do fornecedor. Como as alíquotas finais ainda não estão regulamentadas, o Axioma mostra o potencial estrutural e atualiza quando a legislação fechar.' },
    { h1: 'IA Executiva' },
    { p: 'Recomendações em linguagem de CFO sobre a carteira: risco de interrupção, aumentos anormais de preço, oportunidades de renegociação e consolidação, contratos vencendo e dependência. Hoje o parecer é gerado por **regras sobre dados reais**, com a mesma transparência do resto do Axioma.' },

    { h1: 'Passo a passo: cadastrar um fornecedor' },
    { p: 'Clique em **+ Novo Fornecedor**. O cadastro tem etapas (use **Anterior** e **Próximo**):' },
    { numerada: [
      '**Identificação**: tipo de pessoa, razão social, nome fantasia, CNPJ/CPF (validado), porte, categoria, status e gasto mensal.',
      '**Contatos**: contato principal e outros contatos.',
      '**Endereço**: o CEP preenche o endereço sozinho.',
      '**Documentos**: tipo, número, emissão, validade e arquivo. Vencidos e a vencer ficam marcados.',
      '**Fiscal**: inscrições, regime tributário e contribuinte de ICMS.',
      '**Financeiro**: banco, agência, conta, chave Pix, condição e prazo de pagamento, moeda e centro de custo.',
      '**Contratos**: início, fim, renovação automática, índice de reajuste e valores.',
      '**Produtos**, **Qualidade** (nível e certificações) e **Risco** (classificação e dependência).',
      '**Observações** e a **Timeline de Interações**. Clique em **Concluir Cadastro**.',
    ] },
    { p: 'Na aba **Contas a Pagar** da própria tela você vê as contas de cada fornecedor.' },
  ],
}

export default doc
