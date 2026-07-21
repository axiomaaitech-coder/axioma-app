// 🦅 AXIOMA AI.TECH - Helpers Centro de Inteligência de Clientes
// IVCA (Índice de Valor do Cliente Axioma), Saúde do Cliente, Radar de Sinais,
// Conselho Executivo e camada "ZIA" (Claude API se ativa, regras honestas se não).
// Só usa dado real: clientes + contas_receber + inadimplencia. Nada de LTV/CAC/margem
// fabricados — essas métricas exigem receitas.cliente_id, que ainda não existe no schema
// (ver STATUS-AXIOMA.md). Mesmo princípio de "nunca inventar número" do resto do alicerce.

import type { CorSaude } from "./cfoCore";

// ============================================================================
// TIPOS — LINHAS DO SUPABASE
// ============================================================================

export type ClienteRow = {
  id: string; nome: string; email: string; telefone: string;
  documento: string; cidade: string; status: string;
  user_id: string; empresa_id: string; created_at: string;
  // Cadastro executivo — colunas novas, opcionais até o Elias rodar o ALTER TABLE
  // (ver STATUS-AXIOMA.md). Undefined/null é tratado como "não informado" em toda
  // a UI, nunca como erro.
  razao_social?: string | null; nome_fantasia?: string | null; inscricao_estadual?: string | null;
  whatsapp?: string | null; site?: string | null; responsavel?: string | null; cargo?: string | null;
  segmento?: string | null; porte?: string | null; regime_tributario?: string | null;
  num_funcionarios?: number | null; faturamento_estimado?: number | null;
  origem?: string | null; responsavel_comercial?: string | null;
  condicao_pagamento?: string | null; prazo_medio_dias?: number | null; limite_credito?: number | null;
  classificacao?: string | null; estado?: string | null; data_primeira_compra?: string | null;
  observacoes?: string | null;
};

export type ClassificacaoCliente = "lead" | "cliente" | "parceiro" | "estrategico" | "premium";

export type ContaRow = {
  id: string; descricao: string; valor: number; valor_recebido?: number | null;
  data_vencimento: string; data_emissao?: string | null; data_recebimento?: string | null;
  status?: string | null; cliente_id?: string | null; forma_recebimento?: string | null;
  numero_documento?: string | null; categoria?: string | null; parcelas?: number | null;
  taxa_juros?: number | null; taxa_multa?: number | null; observacoes?: string | null;
  user_id: string; empresa_id?: string | null; created_at: string;
};

export type EstagioInadimplencia = "aberto" | "aviso" | "negociacao" | "acordo" | "juridico" | "perda";

export type InadimplenciaRow = {
  id: string; cliente_id?: string | null; valor: number; valor_recuperado?: number | null;
  vencimento: string; descricao?: string | null; dias_atraso?: number | null;
  status?: string | null; estagio?: EstagioInadimplencia | null; forma_contato?: string | null;
  data_ultimo_contato?: string | null; observacoes?: string | null; user_id: string;
};

// ============================================================================
// SNAPSHOT — DADO REAL AGREGADO POR CLIENTE E POR CARTEIRA
// ============================================================================

export type ClienteSnapshot = {
  cliente: ClienteRow;
  contas: ContaRow[];
  inadimplencias: InadimplenciaRow[];
  tempoComoClienteDias: number;
  valorTotalCobrado: number;
  valorTotalRecebido: number;
  valorPendente: number;
  valorVencido: number;
  qtdContas: number;
  qtdContasRecebidas: number;
  ticketMedio: number;
  pctPagoEmDia: number; // 0-100, entre as contas já recebidas
  diasAtrasoMedio: number;
  formasRecebimentoDistintas: number;
  ultimaCobrancaData: string | null;
  ultimoContatoData: string | null;
  estagioAtual: EstagioInadimplencia | null;
  diasAtrasoAtual: number;
  valorEmAtrasoAtual: number;
  valorRecuperadoHistorico: number;
  valorUltimos3Meses: number;
  valorTresMesesAnteriores: number;
};

export type SnapshotCarteira = {
  clientesSnapshot: ClienteSnapshot[];
  valorTotalCarteira: number;
  ticketMedioCarteira: number;
  qtdClientesAtivos: number;
};

// Único ponto de verdade para "clientes ativos líquidos" — reutilizado pelo snapshot da
// carteira (sempre "hoje") e por Metas (precisa de um "ativos até a data X" para a série
// histórica da meta num_clientes). Sem `ateISO`, conta o estado atual.
export function contarClientesAtivos(clientes: { status: string; created_at: string }[], ateISO?: string): number {
  const limite = ateISO ? `${ateISO}T23:59:59` : null;
  return clientes.filter((c) => c.status === "ativo" && (!limite || c.created_at <= limite)).length;
}

const PENALIDADE_ESTAGIO: Record<EstagioInadimplencia, number> = {
  aberto: 5, aviso: 15, negociacao: 25, acordo: 12, juridico: 45, perda: 85,
};

const ORDEM_GRAVIDADE_ESTAGIO: EstagioInadimplencia[] = ["aberto", "aviso", "negociacao", "acordo", "juridico", "perda"];

function diffDias(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function montarSnapshotsCarteira(clientes: ClienteRow[], contas: ContaRow[], inadimplencias: InadimplenciaRow[]): SnapshotCarteira {
  const hoje = new Date();
  const inicio3m = new Date(hoje); inicio3m.setMonth(inicio3m.getMonth() - 3);
  const inicio6m = new Date(hoje); inicio6m.setMonth(inicio6m.getMonth() - 6);
  const hojeStr = hoje.toISOString().slice(0, 10);

  const clientesSnapshot: ClienteSnapshot[] = clientes.map((cliente) => {
    const contasCliente = contas.filter((c) => c.cliente_id === cliente.id);
    const inadCliente = inadimplencias.filter((i) => i.cliente_id === cliente.id);

    const valorTotalCobrado = contasCliente.reduce((s, c) => s + (Number(c.valor) || 0), 0);
    const recebidas = contasCliente.filter((c) => c.status === "recebido");
    const valorTotalRecebido = recebidas.reduce((s, c) => s + (Number(c.valor_recebido ?? c.valor) || 0), 0);
    const pendentes = contasCliente.filter((c) => c.status !== "recebido");
    const valorPendente = pendentes.reduce((s, c) => s + (Number(c.valor) || 0), 0);
    const vencidas = pendentes.filter((c) => c.data_vencimento < hojeStr);
    const valorVencido = vencidas.reduce((s, c) => s + (Number(c.valor) || 0), 0);

    const noPrazo = recebidas.filter((c) => !c.data_recebimento || c.data_recebimento <= c.data_vencimento);
    const pctPagoEmDia = recebidas.length > 0 ? (noPrazo.length / recebidas.length) * 100 : -1; // -1 = sem dado

    const atrasos = recebidas
      .filter((c) => c.data_recebimento && c.data_recebimento > c.data_vencimento)
      .map((c) => diffDias(new Date(c.data_recebimento! + "T00:00:00"), new Date(c.data_vencimento + "T00:00:00")));
    const diasAtrasoMedio = atrasos.length > 0 ? atrasos.reduce((a, b) => a + b, 0) / atrasos.length : 0;

    const formasRecebimentoDistintas = new Set(contasCliente.map((c) => c.forma_recebimento).filter(Boolean)).size;

    const datasCobranca = contasCliente.map((c) => c.data_emissao || c.created_at?.slice(0, 10)).filter(Boolean) as string[];
    const ultimaCobrancaData = datasCobranca.length > 0 ? datasCobranca.sort().slice(-1)[0] : null;

    const datasContato = [
      ...recebidas.map((c) => c.data_recebimento).filter(Boolean),
      ...inadCliente.map((i) => i.data_ultimo_contato).filter(Boolean),
    ] as string[];
    const ultimoContatoData = datasContato.length > 0 ? datasContato.sort().slice(-1)[0] : (ultimaCobrancaData || null);

    const inadAtiva = inadCliente.filter((i) => i.status !== "resolvido" && i.status !== "recuperado");
    const estagioAtual = inadAtiva.reduce<EstagioInadimplencia | null>((pior, i) => {
      if (!i.estagio) return pior;
      if (!pior) return i.estagio;
      return ORDEM_GRAVIDADE_ESTAGIO.indexOf(i.estagio) > ORDEM_GRAVIDADE_ESTAGIO.indexOf(pior) ? i.estagio : pior;
    }, vencidas.length > 0 ? "aberto" : null);
    const diasAtrasoAtual = Math.max(
      vencidas.reduce((max, c) => Math.max(max, diffDias(hoje, new Date(c.data_vencimento + "T00:00:00"))), 0),
      inadAtiva.reduce((max, i) => Math.max(max, i.dias_atraso || 0), 0)
    );
    const valorEmAtrasoAtual = valorVencido;
    const valorRecuperadoHistorico = inadCliente.reduce((s, i) => s + (Number(i.valor_recuperado) || 0), 0);

    const iso3m = inicio3m.toISOString().slice(0, 10);
    const iso6m = inicio6m.toISOString().slice(0, 10);
    const dataRef = (c: ContaRow) => c.data_emissao || c.data_vencimento;
    const valorUltimos3Meses = contasCliente.filter((c) => dataRef(c) >= iso3m).reduce((s, c) => s + (Number(c.valor) || 0), 0);
    const valorTresMesesAnteriores = contasCliente.filter((c) => dataRef(c) >= iso6m && dataRef(c) < iso3m).reduce((s, c) => s + (Number(c.valor) || 0), 0);

    return {
      cliente, contas: contasCliente, inadimplencias: inadCliente,
      tempoComoClienteDias: cliente.created_at ? Math.max(0, diffDias(hoje, new Date(cliente.created_at))) : 0,
      valorTotalCobrado, valorTotalRecebido, valorPendente, valorVencido,
      qtdContas: contasCliente.length, qtdContasRecebidas: recebidas.length,
      ticketMedio: contasCliente.length > 0 ? valorTotalCobrado / contasCliente.length : 0,
      pctPagoEmDia, diasAtrasoMedio, formasRecebimentoDistintas,
      ultimaCobrancaData, ultimoContatoData, estagioAtual, diasAtrasoAtual, valorEmAtrasoAtual,
      valorRecuperadoHistorico, valorUltimos3Meses, valorTresMesesAnteriores,
    };
  });

  const valorTotalCarteira = clientesSnapshot.reduce((s, c) => s + c.valorTotalCobrado, 0);
  const qtdClientesAtivos = contarClientesAtivos(clientes);
  return {
    clientesSnapshot, valorTotalCarteira,
    ticketMedioCarteira: clientesSnapshot.length > 0 ? valorTotalCarteira / clientesSnapshot.length : 0,
    qtdClientesAtivos,
  };
}

// ============================================================================
// IVCA — ÍNDICE DE VALOR DO CLIENTE AXIOMA (0-1000)
// Mesma forma do IPPA (lib/cfoCore.ts): total + nível + cor + subscores explicados.
// Só entram dimensões medíveis com dado real hoje. Rentabilidade/LTV/CAC ficam de fora
// deliberadamente — exigem receitas.cliente_id, que não existe no schema ainda.
// ============================================================================

export type IVCA = { total: number; nivel: "critico" | "atencao" | "bom" | "excelente"; cor: CorSaude; subscores: { chave: string; valor: number; peso: number }[] };

export function calcularIVCA(s: ClienteSnapshot, carteira: SnapshotCarteira): IVCA {
  // Pontualidade — sem histórico de recebimento, usa prior neutro (mesmo padrão do IPPA
  // quando não há concorrente cadastrado: nem penaliza nem premia por falta de dado).
  let pontualidade = s.pctPagoEmDia >= 0 ? s.pctPagoEmDia : 60;
  if (s.diasAtrasoAtual > 0) pontualidade -= Math.min(40, s.diasAtrasoAtual / 3);
  if (s.estagioAtual) pontualidade -= PENALIDADE_ESTAGIO[s.estagioAtual];
  pontualidade = clamp(pontualidade, 0, 100);

  const ticketMedioBase = carteira.ticketMedioCarteira > 0 ? carteira.ticketMedioCarteira : s.ticketMedio || 1;
  const volume = clamp((s.ticketMedio / ticketMedioBase) * 50, 0, 100);

  const mesesComoCliente = Math.max(1, s.tempoComoClienteDias / 30);
  const recorrencia = clamp((s.qtdContas / mesesComoCliente) * 40, 0, 100);

  let tendencia: number;
  if (s.valorTresMesesAnteriores <= 0 && s.valorUltimos3Meses <= 0) tendencia = 50;
  else if (s.valorTresMesesAnteriores <= 0) tendencia = 80;
  else tendencia = clamp(50 + ((s.valorUltimos3Meses - s.valorTresMesesAnteriores) / s.valorTresMesesAnteriores) * 100, 0, 100);

  let risco = 100;
  if (s.valorEmAtrasoAtual > 0 && s.valorTotalCobrado > 0) risco -= Math.min(60, (s.valorEmAtrasoAtual / s.valorTotalCobrado) * 100);
  if (s.estagioAtual) risco -= PENALIDADE_ESTAGIO[s.estagioAtual];
  risco = clamp(risco, 0, 100);

  const subscores = [
    { chave: "pontualidade", valor: pontualidade, peso: 0.30 },
    { chave: "volume", valor: volume, peso: 0.20 },
    { chave: "recorrencia", valor: recorrencia, peso: 0.15 },
    { chave: "tendencia", valor: tendencia, peso: 0.15 },
    { chave: "risco", valor: risco, peso: 0.20 },
  ];
  const total = Math.round(subscores.reduce((sum, x) => sum + x.valor * x.peso, 0) * 10);
  const nivel: IVCA["nivel"] = total < 400 ? "critico" : total < 650 ? "atencao" : total < 850 ? "bom" : "excelente";
  const cor: CorSaude = total < 400 ? "vermelho" : total < 650 ? "amarelo" : "verde";
  return { total, nivel, cor, subscores };
}

// ============================================================================
// SAÚDE DO CLIENTE — 4 gauges 0-100, tempo real
// ============================================================================

export type SaudeCliente = {
  pagamento: number;
  relacionamento: number;
  recorrencia: number;
  comercial: number;
};

export function calcularSaudeCliente(s: ClienteSnapshot, ivca: IVCA): SaudeCliente {
  const sub = (chave: string) => ivca.subscores.find((x) => x.chave === chave)?.valor ?? 50;
  const hoje = new Date();
  const diasSemContato = s.ultimoContatoData ? diffDias(hoje, new Date(s.ultimoContatoData + "T00:00:00")) : s.tempoComoClienteDias;
  const relacionamento = clamp(100 - diasSemContato / 2, 0, 100);
  return {
    pagamento: sub("pontualidade"),
    relacionamento,
    recorrencia: sub("recorrencia"),
    comercial: clamp((sub("volume") + sub("tendencia")) / 2, 0, 100),
  };
}

// ============================================================================
// RADAR DE SINAIS — oportunidade e risco no mesmo detector (padrão de
// detectarOportunidadesPrecificacao em cfoCore.ts). Cada sinal cita o número real.
// ============================================================================

export type TipoSinalCliente = "premium" | "prontoParaUpsell" | "emRisco" | "negligenciado" | "geraCaixaRecorrente" | "concentracaoAlta";
export type SeveridadeSinal = "positivo" | "atencao" | "risco";

export type SinalCliente = {
  tipo: TipoSinalCliente; severidade: SeveridadeSinal;
  clienteId: string; clienteNome: string;
  detalhe: { [k: string]: number | string };
};

export function detectarSinaisCliente(s: ClienteSnapshot, ivca: IVCA, carteira: SnapshotCarteira): SinalCliente[] {
  const sub = (chave: string) => ivca.subscores.find((x) => x.chave === chave)?.valor ?? 50;
  const out: SinalCliente[] = [];
  const base = { clienteId: s.cliente.id, clienteNome: s.cliente.nome };

  if (ivca.total >= 750 && s.ticketMedio >= carteira.ticketMedioCarteira) {
    out.push({ ...base, tipo: "premium", severidade: "positivo", detalhe: { ivca: ivca.total, ticket: s.ticketMedio } });
  }
  if (s.estagioAtual === "negociacao" || s.estagioAtual === "juridico" || s.estagioAtual === "perda" || s.diasAtrasoAtual > 30) {
    out.push({ ...base, tipo: "emRisco", severidade: "risco", detalhe: { diasAtraso: s.diasAtrasoAtual, valorEmAtraso: s.valorEmAtrasoAtual, estagio: s.estagioAtual || "" } });
  }
  if (sub("pontualidade") >= 80 && sub("tendencia") >= 65 && sub("risco") >= 70) {
    out.push({ ...base, tipo: "prontoParaUpsell", severidade: "positivo", detalhe: { pontualidade: sub("pontualidade"), tendencia: sub("tendencia") } });
  }
  const diasSemContato = s.ultimoContatoData ? diffDias(new Date(), new Date(s.ultimoContatoData + "T00:00:00")) : s.tempoComoClienteDias;
  if (s.cliente.status === "ativo" && diasSemContato > 90) {
    out.push({ ...base, tipo: "negligenciado", severidade: "atencao", detalhe: { diasSemContato } });
  }
  if (sub("recorrencia") >= 70 && sub("pontualidade") >= 80) {
    out.push({ ...base, tipo: "geraCaixaRecorrente", severidade: "positivo", detalhe: { valorTotalCobrado: s.valorTotalCobrado } });
  }
  if (carteira.valorTotalCarteira > 0 && s.valorTotalCobrado / carteira.valorTotalCarteira > 0.25) {
    out.push({ ...base, tipo: "concentracaoAlta", severidade: "atencao", detalhe: { pctCarteira: (s.valorTotalCobrado / carteira.valorTotalCarteira) * 100 } });
  }
  return out;
}

const ORDEM_SEVERIDADE: Record<SeveridadeSinal, number> = { risco: 0, atencao: 1, positivo: 2 };
export function ordenarSinaisPorSeveridade(sinais: SinalCliente[]): SinalCliente[] {
  return [...sinais].sort((a, b) => ORDEM_SEVERIDADE[a.severidade] - ORDEM_SEVERIDADE[b.severidade]);
}

// ============================================================================
// NARRATIVAS — pt/en/es, sempre citando o número real (mesmo estilo de cfoTextos.ts)
// ============================================================================

export type Idioma3 = "pt" | "en" | "es";

const SUB_LABEL: Record<Idioma3, Record<string, string>> = {
  pt: { pontualidade: "Pontualidade", volume: "Volume/Ticket", recorrencia: "Recorrência", tendencia: "Tendência", risco: "Risco de Inadimplência" },
  en: { pontualidade: "On-time Payment", volume: "Volume/Ticket", recorrencia: "Recurrence", tendencia: "Trend", risco: "Default Risk" },
  es: { pontualidade: "Puntualidad", volume: "Volumen/Ticket", recorrencia: "Recurrencia", tendencia: "Tendencia", risco: "Riesgo de Impago" },
};
export function nomeSubscoreIVCA(lang: Idioma3, chave: string): string {
  return SUB_LABEL[lang][chave] || chave;
}

export function montarNarrativaIVCA(lang: Idioma3, ivca: IVCA): string {
  const pior = [...ivca.subscores].sort((a, b) => a.valor - b.valor)[0];
  const nome = nomeSubscoreIVCA(lang, pior.chave);
  if (lang === "en") return `Score ${ivca.total}/1000 — the main brake right now is ${nome.toLowerCase()} (${Math.round(pior.valor)}/100).`;
  if (lang === "es") return `Nota ${ivca.total}/1000 — el mayor freno ahora es ${nome.toLowerCase()} (${Math.round(pior.valor)}/100).`;
  return `Nota ${ivca.total}/1000 — o maior freio agora é ${nome.toLowerCase()} (${Math.round(pior.valor)}/100).`;
}

const NOME_SINAL: Record<Idioma3, Record<TipoSinalCliente, string>> = {
  pt: { premium: "Cliente Premium", prontoParaUpsell: "Pronto para Upsell", emRisco: "Em Risco", negligenciado: "Negligenciado", geraCaixaRecorrente: "Gera Caixa Recorrente", concentracaoAlta: "Concentração Alta" },
  en: { premium: "Premium Client", prontoParaUpsell: "Ready for Upsell", emRisco: "At Risk", negligenciado: "Neglected", geraCaixaRecorrente: "Steady Cash Generator", concentracaoAlta: "High Concentration" },
  es: { premium: "Cliente Premium", prontoParaUpsell: "Listo para Upsell", emRisco: "En Riesgo", negligenciado: "Descuidado", geraCaixaRecorrente: "Genera Caja Recurrente", concentracaoAlta: "Concentración Alta" },
};
export function nomeTipoSinal(lang: Idioma3, tipo: TipoSinalCliente): string {
  return NOME_SINAL[lang][tipo];
}

export function montarNarrativaSinal(lang: Idioma3, sinal: SinalCliente): string {
  const d = sinal.detalhe;
  const fBRLLocal = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
  switch (sinal.tipo) {
    case "premium":
      return lang === "en" ? `${sinal.clienteNome} scores ${d.ivca}/1000 with a ticket above the portfolio average — top-tier asset.`
        : lang === "es" ? `${sinal.clienteNome} tiene ${d.ivca}/1000 con ticket por encima del promedio de la cartera — activo de primer nivel.`
        : `${sinal.clienteNome} tem nota ${d.ivca}/1000 e ticket acima da média da carteira — ativo de primeira linha.`;
    case "emRisco":
      return lang === "en" ? `${sinal.clienteNome}: ${d.diasAtraso} days overdue, ${fBRLLocal(Number(d.valorEmAtraso))} at risk${d.estagio ? ` (stage: ${d.estagio})` : ""}.`
        : lang === "es" ? `${sinal.clienteNome}: ${d.diasAtraso} días de atraso, ${fBRLLocal(Number(d.valorEmAtraso))} en riesgo${d.estagio ? ` (etapa: ${d.estagio})` : ""}.`
        : `${sinal.clienteNome}: ${d.diasAtraso} dias de atraso, ${fBRLLocal(Number(d.valorEmAtraso))} em risco${d.estagio ? ` (estágio: ${d.estagio})` : ""}.`;
    case "prontoParaUpsell":
      return lang === "en" ? `${sinal.clienteNome} pays on time (${Math.round(Number(d.pontualidade))}/100) and revenue is trending up — good moment to offer more.`
        : lang === "es" ? `${sinal.clienteNome} paga puntual (${Math.round(Number(d.pontualidade))}/100) y la tendencia es de alta — buen momento para ofrecer más.`
        : `${sinal.clienteNome} paga em dia (${Math.round(Number(d.pontualidade))}/100) e a tendência é de alta — bom momento para oferecer mais.`;
    case "negligenciado":
      return lang === "en" ? `${sinal.clienteNome}: ${d.diasSemContato} days without contact or billing despite being active.`
        : lang === "es" ? `${sinal.clienteNome}: ${d.diasSemContato} días sin contacto o cobro a pesar de estar activo.`
        : `${sinal.clienteNome}: ${d.diasSemContato} dias sem contato ou cobrança apesar de ativo.`;
    case "geraCaixaRecorrente":
      return lang === "en" ? `${sinal.clienteNome} generates ${fBRLLocal(Number(d.valorTotalCobrado))} with high recurrence and on-time payment.`
        : lang === "es" ? `${sinal.clienteNome} genera ${fBRLLocal(Number(d.valorTotalCobrado))} con alta recurrencia y pago puntual.`
        : `${sinal.clienteNome} gera ${fBRLLocal(Number(d.valorTotalCobrado))} com alta recorrência e pagamento em dia.`;
    case "concentracaoAlta":
      return lang === "en" ? `${sinal.clienteNome} represents ${Math.round(Number(d.pctCarteira))}% of the whole billed portfolio — dependency risk for the company.`
        : lang === "es" ? `${sinal.clienteNome} representa ${Math.round(Number(d.pctCarteira))}% de toda la cartera facturada — riesgo de dependencia para la empresa.`
        : `${sinal.clienteNome} representa ${Math.round(Number(d.pctCarteira))}% de toda a carteira cobrada — risco de dependência para a empresa.`;
  }
}

// ============================================================================
// CONSELHO EXECUTIVO — painel de especialistas (mesmo formato de Precificação:
// relabela métricas já calculadas, não são "agentes" separados) + recomendação
// consolidada com os sinais mais graves.
// ============================================================================

export type CardEspecialista = { papel: string; texto: string };
export type ConselhoExecutivo = { cards: CardEspecialista[]; recomendacoes: SinalCliente[] };

const PAPEL: Record<Idioma3, Record<string, string>> = {
  pt: { cfo: "CFO", controller: "Controller / Cobrança", comercial: "Especialista Comercial", risco: "Especialista de Risco", relacionamento: "Especialista de Relacionamento", analista: "Analista de Dados" },
  en: { cfo: "CFO", controller: "Controller / Collections", comercial: "Commercial Specialist", risco: "Risk Specialist", relacionamento: "Relationship Specialist", analista: "Data Analyst" },
  es: { cfo: "CFO", controller: "Controller / Cobranza", comercial: "Especialista Comercial", risco: "Especialista de Riesgo", relacionamento: "Especialista de Relación", analista: "Analista de Datos" },
};

export function montarConselhoExecutivo(lang: Idioma3, s: ClienteSnapshot, ivca: IVCA, sinais: SinalCliente[]): ConselhoExecutivo {
  const fBRLLocal = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
  const p = PAPEL[lang];
  const riscos = sinais.filter((x) => x.severidade === "risco").length;
  const cards: CardEspecialista[] = [
    { papel: p.cfo, texto: `${lang === "en" ? "Pending" : lang === "es" ? "Pendiente" : "Pendente"}: ${fBRLLocal(s.valorPendente)} · ${lang === "en" ? "Received" : lang === "es" ? "Recibido" : "Recebido"}: ${fBRLLocal(s.valorTotalRecebido)}` },
    { papel: p.controller, texto: `${s.pctPagoEmDia >= 0 ? Math.round(s.pctPagoEmDia) + "%" : "—"} ${lang === "en" ? "on time" : lang === "es" ? "puntual" : "em dia"} · ${Math.round(s.diasAtrasoMedio)} ${lang === "en" ? "days avg. delay" : lang === "es" ? "días de atraso prom." : "dias de atraso médio"}` },
    { papel: p.comercial, texto: `${lang === "en" ? "Avg. ticket" : lang === "es" ? "Ticket prom." : "Ticket médio"}: ${fBRLLocal(s.ticketMedio)} · ${nomeSubscoreIVCA(lang, "tendencia")}: ${Math.round(ivca.subscores.find((x) => x.chave === "tendencia")?.valor || 0)}/100` },
    { papel: p.risco, texto: `${lang === "en" ? "Active signals" : lang === "es" ? "Señales activas" : "Sinais ativos"}: ${riscos} ${lang === "en" ? "risk" : lang === "es" ? "riesgo" : "de risco"}` },
    { papel: p.relacionamento, texto: s.ultimoContatoData ? `${lang === "en" ? "Last contact" : lang === "es" ? "Último contacto" : "Último contato"}: ${new Date(s.ultimoContatoData + "T00:00:00").toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR")}` : (lang === "en" ? "No contact recorded yet." : lang === "es" ? "Sin contacto registrado." : "Nenhum contato registrado ainda.") },
    { papel: p.analista, texto: montarNarrativaIVCA(lang, ivca) },
  ];
  const recomendacoes = ordenarSinaisPorSeveridade(sinais).slice(0, 3);
  return { cards, recomendacoes };
}

// ============================================================================
// LINHA DO TEMPO FINANCEIRA — 100% dado real (contas_receber + inadimplencia)
// ============================================================================

export type EventoTimeline = { data: string; tipo: "cadastro" | "emissao" | "recebimento" | "vencido" | "contato" | "estagio"; texto: string };

export function montarTimelineCliente(lang: Idioma3, s: ClienteSnapshot): EventoTimeline[] {
  const fBRLLocal = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
  const eventos: EventoTimeline[] = [];
  if (s.cliente.created_at) {
    eventos.push({
      data: s.cliente.created_at.slice(0, 10), tipo: "cadastro",
      texto: lang === "en" ? `Client registered: ${s.cliente.nome}` : lang === "es" ? `Cliente registrado: ${s.cliente.nome}` : `Cliente cadastrado: ${s.cliente.nome}`,
    });
  }
  s.contas.forEach((c) => {
    const data = c.data_emissao || c.created_at?.slice(0, 10);
    if (data) eventos.push({ data, tipo: "emissao", texto: `${lang === "en" ? "Billing issued" : lang === "es" ? "Cobro emitido" : "Cobrança emitida"}: ${c.descricao} (${fBRLLocal(c.valor)})` });
    if (c.data_recebimento) eventos.push({ data: c.data_recebimento, tipo: "recebimento", texto: `${lang === "en" ? "Payment received" : lang === "es" ? "Pago recibido" : "Pagamento recebido"}: ${fBRLLocal(Number(c.valor_recebido ?? c.valor))}` });
  });
  s.inadimplencias.forEach((i) => {
    if (i.data_ultimo_contato) eventos.push({ data: i.data_ultimo_contato, tipo: "contato", texto: `${lang === "en" ? "Contact" : lang === "es" ? "Contacto" : "Contato"}${i.forma_contato ? ` (${i.forma_contato})` : ""}${i.estagio ? ` — ${i.estagio}` : ""}` });
  });
  return eventos.filter((e) => !!e.data).sort((a, b) => b.data.localeCompare(a.data));
}

// ============================================================================
// COMPRAS — Última, Maior e Primeira, derivadas de contas_receber já carregado
// (nenhuma tabela nova; "compra" aqui = cobrança emitida, mesmo dado da timeline).
// ============================================================================

export type ResumoComprasCliente = { ultima: ContaRow | null; maior: ContaRow | null; primeira: string | null };

export function resumoComprasCliente(s: ClienteSnapshot): ResumoComprasCliente {
  const comDatas = s.contas.filter((c) => c.data_emissao || c.created_at);
  const ordenadas = [...comDatas].sort((a, b) => (a.data_emissao || a.created_at).localeCompare(b.data_emissao || b.created_at));
  const ultima = ordenadas.length > 0 ? ordenadas[ordenadas.length - 1] : null;
  const maior = s.contas.length > 0 ? [...s.contas].sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0))[0] : null;
  const primeira = s.cliente.data_primeira_compra || (ordenadas.length > 0 ? (ordenadas[0].data_emissao || ordenadas[0].created_at?.slice(0, 10)) : null);
  return { ultima, maior, primeira: primeira || null };
}

// ============================================================================
// CLASSIFICAÇÃO — rótulo do cadastro executivo (lead/cliente/parceiro/estratégico/premium)
// ============================================================================

const CLASSIFICACAO_LABEL: Record<Idioma3, Record<string, string>> = {
  pt: { lead: "Lead", cliente: "Cliente", parceiro: "Parceiro", estrategico: "Estratégico", premium: "Premium" },
  en: { lead: "Lead", cliente: "Customer", parceiro: "Partner", estrategico: "Strategic", premium: "Premium" },
  es: { lead: "Lead", cliente: "Cliente", parceiro: "Socio", estrategico: "Estratégico", premium: "Premium" },
};
export function nomeClassificacao(lang: Idioma3, classificacao?: string | null): string {
  if (!classificacao) return "";
  return CLASSIFICACAO_LABEL[lang][classificacao] || classificacao;
}

// ============================================================================
// RADAR EXECUTIVO — mesmo detectarSinaisCliente, agregado pra carteira toda em
// vez de um cliente só. Cada bucket já vem ordenado por severidade/relevância.
// ============================================================================

export type ItemIntel = { s: ClienteSnapshot; ivca: IVCA; saude: SaudeCliente; sinais: SinalCliente[] };
export type RadarCarteira = Record<TipoSinalCliente, SinalCliente[]>;

export function montarRadarCarteira(intel: ItemIntel[]): RadarCarteira {
  const radar: RadarCarteira = { premium: [], prontoParaUpsell: [], emRisco: [], negligenciado: [], geraCaixaRecorrente: [], concentracaoAlta: [] };
  intel.forEach((i) => { i.sinais.forEach((sinal) => { radar[sinal.tipo].push(sinal); }); });
  (Object.keys(radar) as TipoSinalCliente[]).forEach((tipo) => { radar[tipo] = ordenarSinaisPorSeveridade(radar[tipo]); });
  return radar;
}

// ============================================================================
// KPIs DE CARTEIRA — só o que dá pra calcular com dado real hoje.
// "Perdidos no mês" fica de fora de propósito: não existe timestamp de mudança
// de status (só o valor atual), então não dá pra saber QUANDO um cliente virou
// inativo — mostrar "Clientes Inativos" (total, sem recorte de tempo) é honesto,
// "Perdidos no mês" seria inventado. Mesmo princípio de nunca fabricar número.
// ============================================================================

export type KpisCarteiraExecutivo = {
  clientesNovosMes: number;
  clientesInativos: number;
  tempoMedioRelacionamentoDias: number;
  qtdPremium: number;
  qtdEstrategico: number;
  qtdEmRisco: number;
  qtdNegligenciado: number;
};

export function calcularKpisCarteiraExecutivo(clientes: ClienteRow[], intel: ItemIntel[]): KpisCarteiraExecutivo {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const clientesNovosMes = clientes.filter((c) => c.created_at && c.created_at.slice(0, 10) >= inicioMes).length;
  const clientesInativos = clientes.filter((c) => c.status !== "ativo").length;
  const ativos = intel.filter((i) => i.s.cliente.status === "ativo");
  const tempoMedioRelacionamentoDias = ativos.length > 0 ? ativos.reduce((sum, i) => sum + i.s.tempoComoClienteDias, 0) / ativos.length : 0;
  const contaTipo = (tipo: TipoSinalCliente) => intel.filter((i) => i.sinais.some((x) => x.tipo === tipo)).length;
  return {
    clientesNovosMes, clientesInativos, tempoMedioRelacionamentoDias,
    qtdPremium: contaTipo("premium"),
    qtdEstrategico: clientes.filter((c) => c.classificacao === "estrategico").length,
    qtdEmRisco: contaTipo("emRisco"),
    qtdNegligenciado: contaTipo("negligenciado"),
  };
}

// ============================================================================
// RECEITA POR SEGMENTO/CIDADE/ESTADO — agrupamento simples do valor cobrado.
// Sem dado de segmento/cidade/estado preenchido, tudo cai em "não informado" —
// painel honesto que preenche sozinho conforme o cadastro for completado.
// ============================================================================

export type GrupoReceita = { chave: string; valor: number };

function rotuloNaoInformado(lang: Idioma3): string {
  return lang === "en" ? "Not informed" : lang === "es" ? "No informado" : "Não informado";
}

function agruparPorCampo(intel: ItemIntel[], lang: Idioma3, campo: "segmento" | "cidade" | "estado"): GrupoReceita[] {
  const mapa = new Map<string, number>();
  intel.forEach((i) => {
    const chave = (i.s.cliente[campo] as string | null | undefined)?.trim() || rotuloNaoInformado(lang);
    mapa.set(chave, (mapa.get(chave) || 0) + i.s.valorTotalCobrado);
  });
  return [...mapa.entries()].map(([chave, valor]) => ({ chave, valor })).sort((a, b) => b.valor - a.valor);
}

export function receitaPorSegmento(intel: ItemIntel[], lang: Idioma3): GrupoReceita[] { return agruparPorCampo(intel, lang, "segmento"); }
export function receitaPorCidade(intel: ItemIntel[], lang: Idioma3): GrupoReceita[] { return agruparPorCampo(intel, lang, "cidade"); }
export function receitaPorEstado(intel: ItemIntel[], lang: Idioma3): GrupoReceita[] { return agruparPorCampo(intel, lang, "estado"); }

// ============================================================================
// SUGESTÃO DE AÇÃO POR COBRANÇA — regra determinística por faixa de atraso,
// mesmo padrão dos cards de especialista (relabela dado real, não é IA generativa).
// ============================================================================

export function sugestaoAcaoCobranca(lang: Idioma3, diasAtraso: number): string {
  if (diasAtraso <= 0) return "";
  if (diasAtraso <= 15) return lang === "en" ? "Friendly reminder — still early, low risk." : lang === "es" ? "Recordatorio amistoso — atraso reciente, bajo riesgo." : "Lembrete amigável — atraso recente, baixo risco.";
  if (diasAtraso <= 60) return lang === "en" ? "Active collection — call/WhatsApp and consider a payment plan." : lang === "es" ? "Cobro activo — llamar/WhatsApp y considerar acuerdo de pago." : "Cobrança ativa — ligar/WhatsApp e considerar acordo de pagamento.";
  return lang === "en" ? "Escalate — negotiation or legal collection, risk of loss rising." : lang === "es" ? "Escalar — negociación o cobro jurídico, riesgo de pérdida en aumento." : "Escalar — negociação ou cobrança jurídica, risco de perda crescente.";
}

// ============================================================================
// PARECER EXECUTIVO — versão enriquecida do Conselho Executivo, mesmo padrão
// de transparência de Precificação/Simulações: 100% regra, citando dado real,
// pronto pra virar texto de IA real (Claude) no dia em que a chave for ativada.
// ============================================================================

export type ParecerExecutivo = {
  resumo: string; pontosFortes: string[]; pontosFracos: string[];
  riscos: string[]; oportunidades: string[]; sugestao: string; proximoPasso: string;
};

export function montarParecerExecutivo(lang: Idioma3, s: ClienteSnapshot, ivca: IVCA, sinais: SinalCliente[]): ParecerExecutivo {
  const fBRLLocal = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
  const sub = (chave: string) => ivca.subscores.find((x) => x.chave === chave)?.valor ?? 50;
  const positivos = sinais.filter((x) => x.severidade === "positivo");
  const riscos = sinais.filter((x) => x.severidade === "risco");
  const atencoes = sinais.filter((x) => x.severidade === "atencao");

  const pontosFortes: string[] = [];
  const pontosFracos: string[] = [];
  if (sub("pontualidade") >= 70) pontosFortes.push(lang === "en" ? `On-time payment: ${Math.round(sub("pontualidade"))}/100.` : lang === "es" ? `Pago puntual: ${Math.round(sub("pontualidade"))}/100.` : `Pontualidade: ${Math.round(sub("pontualidade"))}/100.`);
  else pontosFracos.push(lang === "en" ? `On-time payment below par: ${Math.round(sub("pontualidade"))}/100.` : lang === "es" ? `Puntualidad por debajo del promedio: ${Math.round(sub("pontualidade"))}/100.` : `Pontualidade abaixo do ideal: ${Math.round(sub("pontualidade"))}/100.`);
  if (sub("tendencia") >= 60) pontosFortes.push(lang === "en" ? "Revenue trend rising over the last 3 months." : lang === "es" ? "Tendencia de ingresos al alza en los últimos 3 meses." : "Tendência de receita em alta nos últimos 3 meses.");
  else if (sub("tendencia") < 40) pontosFracos.push(lang === "en" ? "Revenue trend falling over the last 3 months." : lang === "es" ? "Tendencia de ingresos a la baja en los últimos 3 meses." : "Tendência de receita em queda nos últimos 3 meses.");
  if (sub("recorrencia") >= 60) pontosFortes.push(lang === "en" ? "Frequent, recurring billing." : lang === "es" ? "Cobros frecuentes y recurrentes." : "Cobrança frequente e recorrente.");
  if (sub("risco") < 50) pontosFracos.push(lang === "en" ? `Default risk elevated (${Math.round(sub("risco"))}/100 safety).` : lang === "es" ? `Riesgo de impago elevado (seguridad ${Math.round(sub("risco"))}/100).` : `Risco de inadimplência elevado (segurança ${Math.round(sub("risco"))}/100).`);

  const resumo = lang === "en"
    ? `${s.cliente.nome} scores ${ivca.total}/1000 (${ivca.nivel}). ${fBRLLocal(s.valorTotalCobrado)} billed total, ${fBRLLocal(s.valorTotalRecebido)} received, ${fBRLLocal(s.valorVencido)} overdue.`
    : lang === "es" ? `${s.cliente.nome} tiene ${ivca.total}/1000 (${ivca.nivel}). ${fBRLLocal(s.valorTotalCobrado)} cobrado total, ${fBRLLocal(s.valorTotalRecebido)} recibido, ${fBRLLocal(s.valorVencido)} vencido.`
    : `${s.cliente.nome} tem nota ${ivca.total}/1000 (${ivca.nivel}). ${fBRLLocal(s.valorTotalCobrado)} cobrado no total, ${fBRLLocal(s.valorTotalRecebido)} recebido, ${fBRLLocal(s.valorVencido)} vencido.`;

  const sugestao = riscos.length > 0
    ? montarNarrativaSinal(lang, riscos[0])
    : positivos.length > 0 ? montarNarrativaSinal(lang, positivos[0]) : montarNarrativaIVCA(lang, ivca);

  const proximoPasso = riscos.length > 0
    ? sugestaoAcaoCobranca(lang, s.diasAtrasoAtual)
    : sinais.some((x) => x.tipo === "prontoParaUpsell")
      ? (lang === "en" ? "Reach out with an upsell offer — data supports it." : lang === "es" ? "Contactar con oferta de upsell — los datos lo respaldan." : "Fazer contato com oferta de upsell — o dado sustenta.")
      : atencoes.length > 0 ? montarNarrativaSinal(lang, atencoes[0])
      : (lang === "en" ? "Keep current relationship cadence — no urgent action." : lang === "es" ? "Mantener la cadencia actual — sin acción urgente." : "Manter a cadência atual de relacionamento — sem ação urgente.");

  return {
    resumo,
    pontosFortes: pontosFortes.length > 0 ? pontosFortes : [lang === "en" ? "No standout strength yet — still building history." : lang === "es" ? "Sin fortaleza destacada aún — historial en construcción." : "Nenhum ponto forte de destaque ainda — histórico em construção."],
    pontosFracos: pontosFracos.length > 0 ? pontosFracos : [lang === "en" ? "No weak point detected." : lang === "es" ? "Ningún punto débil detectado." : "Nenhum ponto fraco detectado."],
    riscos: riscos.map((r) => montarNarrativaSinal(lang, r)),
    oportunidades: positivos.map((p) => montarNarrativaSinal(lang, p)),
    sugestao, proximoPasso,
  };
}

// ============================================================================
// ZIA — camada híbrida de IA (mesmo padrão de iaFinanceiraHelpers.ts):
// tenta /api/ia-chat (Claude real, se ANTHROPIC_API_KEY estiver ativa),
// senão cai num fallback determinístico que nunca inventa número.
// A rota espera {mensagem, historico, contexto} — contrato real de app/api/ia-chat/route.ts.
// ============================================================================

export function montarPromptZIA(lang: Idioma3, s: ClienteSnapshot, ivca: IVCA, sinais: SinalCliente[]): string {
  const linhas = [
    `Você é a ZIA, conselho executivo de inteligência de clientes do Axioma (CFO Digital). Responda em ${lang === "en" ? "inglês" : lang === "es" ? "espanhol" : "português"}, curto, direto, sempre citando os números reais abaixo — nunca invente dado que não está aqui.`,
    `Cliente: ${s.cliente.nome} | Cliente há ${Math.round(s.tempoComoClienteDias / 30)} meses | Status: ${s.cliente.status}`,
    `IVCA (Índice de Valor do Cliente Axioma): ${ivca.total}/1000 (${ivca.nivel})`,
    `Cobrado total: ${s.valorTotalCobrado.toFixed(2)} | Recebido: ${s.valorTotalRecebido.toFixed(2)} | Pendente: ${s.valorPendente.toFixed(2)} | Vencido: ${s.valorVencido.toFixed(2)}`,
    `Pontualidade: ${s.pctPagoEmDia >= 0 ? Math.round(s.pctPagoEmDia) + "%" : "sem histórico"} | Atraso médio: ${Math.round(s.diasAtrasoMedio)} dias | Estágio de cobrança atual: ${s.estagioAtual || "nenhum"}`,
    sinais.length > 0 ? `Sinais detectados: ${sinais.map((x) => nomeTipoSinal("pt", x.tipo)).join(", ")}` : "Nenhum sinal crítico detectado.",
  ];
  return linhas.join("\n");
}

export function respostaZIAPorRegras(lang: Idioma3, s: ClienteSnapshot, ivca: IVCA, sinais: SinalCliente[], pergunta: string): string {
  const p = pergunta.toLowerCase();
  const fBRLLocal = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
  if (p.includes("risco") || p.includes("risk") || p.includes("riesgo")) {
    const risco = sinais.find((x) => x.severidade === "risco");
    return risco ? montarNarrativaSinal(lang, risco) : (lang === "en" ? "No active risk signal for this client." : lang === "es" ? "Sin señal de riesgo activa para este cliente." : "Nenhum sinal de risco ativo para este cliente.");
  }
  if (p.includes("atras") || p.includes("delay") || p.includes("overdue")) {
    return `${s.cliente.nome}: ${fBRLLocal(s.valorVencido)} ${lang === "en" ? "overdue" : lang === "es" ? "vencido" : "vencido"}, ${Math.round(s.diasAtrasoMedio)} ${lang === "en" ? "days avg. delay historically" : "dias de atraso médio histórico"}.`;
  }
  if (p.includes("upsell") || p.includes("desconto") || p.includes("discount")) {
    const upsell = sinais.find((x) => x.tipo === "prontoParaUpsell");
    return upsell ? montarNarrativaSinal(lang, upsell) : (lang === "en" ? "Not yet a clear upsell candidate — payment/trend data don't support it." : "Ainda não é um candidato claro a upsell — os dados de pagamento/tendência não sustentam isso.");
  }
  if (p.includes("score") || p.includes("ivca") || p.includes("nota")) {
    return montarNarrativaIVCA(lang, ivca);
  }
  return montarNarrativaIVCA(lang, ivca) + " " + (sinais.length > 0 ? montarNarrativaSinal(lang, ordenarSinaisPorSeveridade(sinais)[0]) : "");
}

export async function enviarPerguntaZIA(
  pergunta: string,
  historico: { role: string; texto: string }[],
  lang: Idioma3, s: ClienteSnapshot, ivca: IVCA, sinais: SinalCliente[]
): Promise<{ resposta: string; modelo: "claude" | "regras" }> {
  try {
    const res = await fetch("/api/ia-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mensagem: pergunta,
        historico: historico.slice(-10).map((m) => ({ role: m.role, content: m.texto })),
        contexto: montarPromptZIA(lang, s, ivca, sinais),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.resposta) return { resposta: data.resposta, modelo: "claude" };
    }
  } catch {}
  return { resposta: respostaZIAPorRegras(lang, s, ivca, sinais, pergunta), modelo: "regras" };
}
