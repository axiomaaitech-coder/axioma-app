// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '06 - MEI - Reforma Tributária.docx',
  titulo: 'Manual 06 — Reforma Tributária no MEI',
  subtitulo: 'O que a Reforma muda no seu MEI — sem pânico, com prazo real',
  info: ['Menu: MEI → Reforma Tributária  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'A Reforma Tributária (IBS e CBS) muda os impostos sobre consumo no Brasil, com transição até 2033. Esta tela explica **o que muda especificamente para o seu MEI**, com base no perfil dos seus clientes e no seu faturamento, e ajuda a decidir se vale continuar MEI ou migrar para ME no Simples Nacional.' },
    { nota: 'As informações seguem a legislação e o cronograma vigentes na data indicada na própria tela. Regras podem ser ajustadas por novas normas, e o Axioma atualiza o conteúdo quando isso acontece.' },

    { h1: 'As partes da tela' },
    { h2: 'Boa notícia: em 2026 nada muda no seu bolso' },
    { p: 'Em 2026, ano-teste, o IBS e a CBS aparecem de forma simbólica (0,9% + 0,1%), mas **o MEI não paga esse imposto**: continua só com o DAS fixo.' },
    { h2: 'O que pede atenção: a decisão até setembro de 2026' },
    { p: 'Explica que a escolha entre continuar MEI ou ir para ME precisa ser feita até setembro de 2026 para valer em 2027.' },
    { h2: 'A Reforma no seu caso específico' },
    { p: 'Mostra o impacto conforme o perfil de clientes configurado no Painel MEI:' },
    { tabela: { colunas: ['Perfil', 'O que significa'], larguras: [2800, 6226], linhas: [
      ['🏢 Clientes empresas (B2B)', 'Atenção ao crédito de IBS/CBS a partir de 2027: empresas podem preferir fornecedores que geram crédito, o que pode afetar sua competitividade. No ME Simples é possível gerar esse crédito.'],
      ['🧑 Clientes pessoa física (B2C)', 'O crédito quase não te afeta. O foco é manter o CNPJ regular.'],
      ['Ambos', 'Os dois cenários valem; o risco de crédito pesa só na parte B2B da carteira.'],
      ['Não configurado', 'A tela pede para configurar. Use o botão **Configurar perfil de cliente**.'],
    ] } },
    { h2: 'O que fazer agora (checklist)' },
    { lista: [
      'Manter o CNPJ regular — DAS em dia é a base de tudo (atalho **Ver DAS & Obrigações →**).',
      'Manter o cadastro limpo: CNAE e atividade corretos evitam problema na nota fiscal obrigatória de 2027.',
      'Acompanhar o teto anual (atalho **Ver Faturamento →**).',
      'Decidir MEI ou ME até setembro de 2026, usando o simulador.',
      'Para faturamento bem baixo (até R$ 40,5 mil/ano), a tela indica uma alternativa a conhecer.',
    ] },
    { h2: 'Simulador: MEI vs ME Simples Nacional' },
    { p: 'Compara, com o seu faturamento real, quanto você paga hoje como MEI (DAS fixo por mês) e quanto pagaria como ME no Simples Nacional (estimativa de cerca de 6% por mês), além de apontar a vantagem do crédito no caso B2B.' },
    { h2: 'Linha do Tempo — Transição até 2033' },
    { p: 'Mostra os marcos da Reforma com o selo **Você está aqui**: 2026 ano-teste; 2027 CBS cobrada de verdade, nota fiscal de serviço obrigatória e split payment voluntário para B2B; até 2033, fim da transição.' },
    { h2: 'Análise Executiva Axioma' },
    { p: 'Botão **Analisar**: a inteligência do Axioma explica como a Reforma afeta o seu MEI com os seus números. Sem IA disponível, aparece uma análise por regras.' },
  ],
}

export default doc
