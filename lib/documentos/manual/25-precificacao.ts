// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '25 - Crescimento - Precificação.docx',
  titulo: 'Manual 25 — Precificação',
  subtitulo: 'Centro de Engenharia de Valor',
  info: ['Menu: Crescimento → Precificação  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Ajuda a definir o **preço certo** de cada produto ou serviço: quanto cobrar, até onde dar desconto, como reagir à concorrência e o que acontece com o lucro se o preço mudar. Funciona para empresas de qualquer porte (para o MEI existe a Precificação MEI, manual 07).' },

    { h1: 'Botões do cabeçalho' },
    { p: '**Exportar PDF**, **+ Novo Produto**, **Escuro / Tema Claro** e **Compartilhar**.' },

    { h1: 'As partes da tela' },
    { h2: 'IPPA — Índice de Poder de Precificação Axioma' },
    { p: 'Nota de 0 a 100 (Crítico, Atenção, Bom, Excelente) que mede o quanto a empresa consegue sustentar seus preços. É formada por cinco partes: **Margem**, **Dependência de Desconto**, **Concentração**, **Estabilidade** e **Competitividade**.' },
    { h2: 'Radar de Oportunidades' },
    { p: 'Produtos com margem baixa, preço abaixo do mercado ou espaço para reajuste.' },
    { h2: 'Seletor de produto' },
    { p: 'Escolha o produto que será analisado pelo Motor, Descontos, Elasticidade e Concorrentes.' },
    { h2: 'Motor de Precificação por Valor' },
    { p: 'Informe um **Preço Candidato** e as **Unidades Vendidas** esperadas. O motor mostra o **Impacto na Receita**, no **Lucro**, no **EBITDA** e a **Margem Nova**. Se gostar, clique em **Aplicar Este Preço** (fica registrado na Memória Estratégica).' },
    { h2: 'Engenharia de Descontos' },
    { p: 'Informe o **Desconto (%)** e veja quanto a mais seria preciso vender só para manter o mesmo lucro. Mostra por que descontos "pequenos" costumam custar caro.' },
    { h2: 'Elasticidade de Preço' },
    { p: 'Estima quanto as vendas reagem a mudanças de preço, usando o histórico do produto. Sem histórico suficiente, a tela avisa em vez de inventar.' },
    { h2: 'Inteligência Competitiva' },
    { p: 'Cadastre o **Nome do Concorrente**, o **Preço** e o **Posicionamento** e clique em **Adicionar Concorrente**. O Axioma compara seu preço com o mercado.' },
    { h2: 'War Room — Simulação Estratégica' },
    { p: 'Escolha um cenário e clique em **Rodar Simulação**: **Concorrente Reduz Preço**, **Concorrente Aumenta Preço**, **Inflação**, **Selic**, **Câmbio**, **Crise Econômica**, **Mudança Tributária**, **Novo Concorrente**, **Explosão de Demanda**, **Queda de Vendas** e **Mudança de Fornecedores**. O resultado mostra o Lucro Líquido/Mês em quatro cenários.' },
    { h2: 'Painel de Especialistas' },
    { p: 'Cinco visões sobre o preço analisado: **CFO** (lucro e caixa), **Tributário** (impacto nos impostos), **Comercial** (mercado e cliente), **Risco** e **Analista**. No fim, a **Recomendação Consolidada** junta as cinco.' },
    { h2: 'Memória Estratégica' },
    { p: 'Histórico das decisões de preço aplicadas, com o **resultado real** depois, para você aprender com o que funcionou.' },
    { h2: 'Lista de produtos' },
    { p: 'Produtos cadastrados com custo, preço e margem, com ✏️ editar e 🗑️ excluir.' },

    { h1: 'Passo a passo' },
    { numerada: ['Cadastre o produto com **+ Novo Produto** (nome, custo e preço atual).', 'Selecione o produto no seletor.', 'Teste preços no Motor e descontos na Engenharia de Descontos.', 'Cadastre concorrentes e rode cenários no War Room.', 'Leia o Painel de Especialistas e aplique o preço escolhido.'] },
    { h1: 'Transparência' },
    { p: 'O Painel de Especialistas e a Recomendação Consolidada são gerados **100% por regras** a partir dos seus dados reais. Nenhum texto aqui é escrito por modelo de linguagem.' },
  ],
}

export default doc
