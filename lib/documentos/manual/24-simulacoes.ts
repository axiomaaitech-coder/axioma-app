// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '24 - Crescimento - Simulações.docx',
  titulo: 'Manual 24 — Simulações Estratégicas',
  subtitulo: 'Teste decisões antes de arriscar o caixa',
  info: ['Menu: Crescimento → Simulações  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Responde perguntas do tipo **"e se?"**: e se a receita cair 20%? e se os juros subirem? e se eu contratar mais duas pessoas? A tela parte dos **números reais** da empresa, aplica as mudanças e mostra lucro, caixa, risco de ruptura e o impacto em cada regime tributário. **Nada do que você simula é gravado** — os dados reais não mudam.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Crescimento ▼** → **Simulações**.'] },

    { h1: 'As partes da tela' },
    { h2: 'Ponto de Partida (dados reais)' },
    { p: '**Receita Mensal Média** e **Custo Variável Mensal** (média do período escolhido no seletor de período), **Custo Fixo Mensal** (só os custos fixos **vigentes hoje**), **Dívida Total Ativa**, **Caixa Disponível** (o mesmo saldo do Fluxo de Caixa, com as vendas do PDV) e **Regime Atual**. Para MEI, o imposto usa o DAS da categoria certa. Sem Receitas, Custos Fixos e Custos Variáveis cadastrados, a tela pede o cadastro primeiro.' },
    { h2: 'Indicadores de Mercado' },
    { p: 'Selic, CDI, IPCA e Dólar do Banco Central — os mesmos números do resto do Axioma.' },
    { h2: 'Objetivos Rápidos' },
    { p: 'Botões que já preenchem os choques para objetivos comuns: **Dobrar Faturamento**, **Triplicar Lucro**, **Melhorar Fluxo de Caixa**, **Reduzir Custos**, **Reduzir Dívida**, **Cenário de Crise** e **Expansão**.' },
    { h2: 'Motor de Simulação (choques)' },
    { p: 'Ajuste **Receita (%)**, **Custo Fixo (%)**, **Custo Variável (%)**, **Juros da Dívida (pontos)**, **Aporte** e seu retorno, **Novo custo fixo (R$/mês)** — para testar contratações ou um aluguel novo —, o **Horizonte de Simulação (meses)** e, se a empresa tiver custos em dólar, o **Choque Cambial** com a **Exposição Cambial**. Clique em **Rodar Simulação**.' },
    { h2: 'Cenários Simulados' },
    { p: 'Quatro cenários (**Conservador**, **Base**, **Otimista**, **Adverso**) com Lucro Líquido/Mês, Saldo projetado em 12 meses e Runway crítico, além da **Probabilidade de Lucro Positivo**, da **Probabilidade de Ruptura de Caixa** e do **Nível de Confiança** (Baixo, Médio, Alto).' },
    { h2: 'Análise de Sensibilidade' },
    { p: 'Mostra quais variáveis mais mexem no lucro, com o **peso** de cada uma e o efeito **Desfavorável** e **Favorável**. Ajuda a saber onde focar.' },
    { h2: 'Simulação Monte Carlo' },
    { p: 'Roda milhares de **iterações simuladas** com variações aleatórias realistas e mostra a faixa provável de resultado (com a **mediana**). É a técnica usada por bancos e seguradoras para medir risco.' },
    { h2: 'Impacto por Regime Tributário' },
    { p: 'Calcula o **Imposto Mensal Estimado** e o **Lucro Líquido** em Simples Nacional, Lucro Presumido e Lucro Real, marcando o melhor regime para aquele cenário.' },
    { h2: 'Conselho Executivo' },
    { p: 'Relatório final com **Resumo Executivo**, **Riscos**, **Oportunidades**, **Premissas Utilizadas**, **Plano de Ação Recomendado** e **Limitações**.' },

    { h1: 'Passo a passo' },
    { numerada: ['Confira o Ponto de Partida (troque o período se quiser outra base).', 'Escolha um Objetivo Rápido ou ajuste os choques à mão.', 'Clique em **Rodar Simulação**.', 'Leia os cenários, a sensibilidade e o Conselho Executivo.', 'Use **Compartilhar** ou **Exportar PDF** para enviar o resultado aos sócios.'] },
    { h1: 'Transparência' },
    { p: 'Esta análise é **100% baseada em regras e nos números reais** da sua empresa: nenhum texto aqui é gerado por modelo de linguagem. A projeção não prevê eventos fora do modelo (como mudança regulatória súbita) e não garante resultado futuro.' },
    { nota: 'Receitas, custos e caixa são lidos sem limite de linhas. Se parte deles não carregar, a tela avisa que o ponto de partida pode estar incompleto — recarregue antes de decidir.' },
    { nota: 'Para simulações em conversa livre com inteligência artificial, use a IA Financeira (manual 36).' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '24 - Growth - Simulations.docx',
  titulo: 'Manual 24 — Strategic Simulations',
  subtitulo: 'Test decisions before risking your cash',
  info: ['Menu: Growth → Simulations  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Answers **"what if?"** questions: what if revenue drops 20%? what if interest rises? what if I hire two more people? The screen starts from the company’s **real numbers**, applies the changes and shows profit, cash, risk of running out of cash and the impact under each tax regime. **Nothing you simulate is saved** — the real data does not change.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Growth ▼** → **Simulations**.'] },

    { h1: 'Parts of the screen' },
    { h2: 'Starting Point (real data)' },
    { p: '**Average Monthly Revenue** and **Monthly Variable Cost** (average for the period chosen in the period selector), **Monthly Fixed Cost** (only fixed costs **valid today**), **Total Active Debt**, **Available Cash** (the same balance as Cash Flow, including POS sales) and **Current Regime**. For MEI, the tax uses the DAS of the right category. Without Revenue, Fixed Costs and Variable Costs registered, the screen asks you to register them first.' },
    { h2: 'Market Indicators' },
    { p: 'Selic, CDI, IPCA and Dollar from the Central Bank — the same numbers as the rest of Axioma.' },
    { h2: 'Quick Goals' },
    { p: 'Buttons that pre-fill the shocks for common goals: **Double Revenue**, **Triple Profit**, **Improve Cash Flow**, **Reduce Costs**, **Reduce Debt**, **Crisis Scenario** and **Expansion**.' },
    { h2: 'Simulation Engine (shocks)' },
    { p: 'Adjust **Revenue (%)**, **Fixed Cost (%)**, **Variable Cost (%)**, **Debt Interest (points)**, **Contribution** and its return, **New fixed cost (R$/month)** — to test hires or a new rent —, the **Simulation Horizon (months)** and, if the company has dollar costs, the **Exchange Shock** with the **Exchange Exposure**. Click **Run Simulation**.' },
    { h2: 'Simulated Scenarios' },
    { p: 'Four scenarios (**Conservative**, **Base**, **Optimistic**, **Adverse**) with Net Profit/Month, projected 12-month Balance and critical Runway, plus the **Probability of Positive Profit**, the **Probability of Cash Shortfall** and the **Confidence Level** (Low, Medium, High).' },
    { h2: 'Sensitivity Analysis' },
    { p: 'Shows which variables move profit the most, with the **weight** of each and the **Unfavorable** and **Favorable** effect. Helps you know where to focus.' },
    { h2: 'Monte Carlo Simulation' },
    { p: 'Runs thousands of **simulated iterations** with realistic random variations and shows the likely range of results (with the **median**). It is the technique banks and insurers use to measure risk.' },
    { h2: 'Impact by Tax Regime' },
    { p: 'Calculates the **Estimated Monthly Tax** and **Net Profit** under Simples Nacional, Lucro Presumido and Lucro Real, marking the best regime for that scenario.' },
    { h2: 'Executive Advice' },
    { p: 'Final report with **Executive Summary**, **Risks**, **Opportunities**, **Assumptions Used**, **Recommended Action Plan** and **Limitations**.' },

    { h1: 'Step by step' },
    { numerada: ['Check the Starting Point (change the period if you want another base).', 'Choose a Quick Goal or adjust the shocks by hand.', 'Click **Run Simulation**.', 'Read the scenarios, the sensitivity and the Executive Advice.', 'Use **Share** or **Export PDF** to send the result to your partners.'] },
    { h1: 'Transparency' },
    { p: 'This analysis is **100% based on rules and on your company’s real numbers**: no text here is generated by a language model. The projection does not predict events outside the model (such as a sudden regulatory change) and does not guarantee future results.' },
    { nota: 'Revenue, costs and cash are read with no row limit. If part of them does not load, the screen warns that the starting point may be incomplete — reload before deciding.' },
    { nota: 'For free-form simulations in conversation with artificial intelligence, use Financial AI (manual 36).' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '24 - Crecimiento - Simulaciones.docx',
  titulo: 'Manual 24 — Simulaciones Estratégicas',
  subtitulo: 'Pruebe decisiones antes de arriesgar la caja',
  info: ['Menú: Crecimiento → Simulaciones  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Responde preguntas del tipo **"¿y si?"**: ¿y si los ingresos caen 20%? ¿y si suben los intereses? ¿y si contrato a dos personas más? La pantalla parte de los **números reales** de la empresa, aplica los cambios y muestra utilidad, caja, riesgo de quedarse sin caja y el impacto en cada régimen tributario. **Nada de lo que simula se guarda** — los datos reales no cambian.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Crecimiento ▼** → **Simulaciones**.'] },

    { h1: 'Las partes de la pantalla' },
    { h2: 'Punto de Partida (datos reales)' },
    { p: '**Ingreso Mensual Promedio** y **Costo Variable Mensual** (promedio del período elegido en el selector de período), **Costo Fijo Mensual** (solo los costos fijos **vigentes hoy**), **Deuda Total Activa**, **Caja Disponible** (el mismo saldo del Flujo de Caja, con las ventas del PDV) y **Régimen Actual**. Para MEI, el impuesto usa el DAS de la categoría correcta. Sin Ingresos, Costos Fijos y Costos Variables registrados, la pantalla pide registrarlos primero.' },
    { h2: 'Indicadores de Mercado' },
    { p: 'Selic, CDI, IPCA y Dólar del Banco Central — los mismos números del resto de Axioma.' },
    { h2: 'Objetivos Rápidos' },
    { p: 'Botones que ya completan los choques para objetivos comunes: **Duplicar Facturación**, **Triplicar Utilidad**, **Mejorar Flujo de Caja**, **Reducir Costos**, **Reducir Deuda**, **Escenario de Crisis** y **Expansión**.' },
    { h2: 'Motor de Simulación (choques)' },
    { p: 'Ajuste **Ingresos (%)**, **Costo Fijo (%)**, **Costo Variable (%)**, **Intereses de la Deuda (puntos)**, **Aporte** y su retorno, **Nuevo costo fijo (R$/mes)** — para probar contrataciones o un alquiler nuevo —, el **Horizonte de Simulación (meses)** y, si la empresa tiene costos en dólares, el **Choque Cambiario** con la **Exposición Cambiaria**. Haga clic en **Ejecutar Simulación**.' },
    { h2: 'Escenarios Simulados' },
    { p: 'Cuatro escenarios (**Conservador**, **Base**, **Optimista**, **Adverso**) con Utilidad Neta/Mes, Saldo proyectado a 12 meses y Runway crítico, además de la **Probabilidad de Utilidad Positiva**, la **Probabilidad de Ruptura de Caja** y el **Nivel de Confianza** (Bajo, Medio, Alto).' },
    { h2: 'Análisis de Sensibilidad' },
    { p: 'Muestra qué variables más mueven la utilidad, con el **peso** de cada una y el efecto **Desfavorable** y **Favorable**. Ayuda a saber dónde enfocarse.' },
    { h2: 'Simulación Monte Carlo' },
    { p: 'Ejecuta miles de **iteraciones simuladas** con variaciones aleatorias realistas y muestra el rango probable de resultado (con la **mediana**). Es la técnica que usan bancos y aseguradoras para medir riesgo.' },
    { h2: 'Impacto por Régimen Tributario' },
    { p: 'Calcula el **Impuesto Mensual Estimado** y la **Utilidad Neta** en Simples Nacional, Lucro Presumido y Lucro Real, marcando el mejor régimen para ese escenario.' },
    { h2: 'Consejo Ejecutivo' },
    { p: 'Informe final con **Resumen Ejecutivo**, **Riesgos**, **Oportunidades**, **Premisas Utilizadas**, **Plan de Acción Recomendado** y **Limitaciones**.' },

    { h1: 'Paso a paso' },
    { numerada: ['Revise el Punto de Partida (cambie el período si quiere otra base).', 'Elija un Objetivo Rápido o ajuste los choques a mano.', 'Haga clic en **Ejecutar Simulación**.', 'Lea los escenarios, la sensibilidad y el Consejo Ejecutivo.', 'Use **Compartir** o **Exportar PDF** para enviar el resultado a los socios.'] },
    { h1: 'Transparencia' },
    { p: 'Este análisis es **100% basado en reglas y en los números reales** de su empresa: ningún texto aquí es generado por un modelo de lenguaje. La proyección no prevé eventos fuera del modelo (como un cambio regulatorio repentino) y no garantiza resultados futuros.' },
    { nota: 'Ingresos, costos y caja se leen sin límite de filas. Si parte de ellos no carga, la pantalla avisa que el punto de partida puede estar incompleto — recargue antes de decidir.' },
    { nota: 'Para simulaciones en conversación libre con inteligencia artificial, use la IA Financiera (manual 36).' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
