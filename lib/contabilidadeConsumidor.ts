// 🦅 AXIOMA AI.TECH — CFO Core, Fase 1, Commit 5: Accounting Core, consumidor
// automático. De-para aprovado com o Elias em 2026-08-30:
//   AP_CREATED  → débito despesa (por categoria) / crédito Fornecedores
//                 (regime de competência: a despesa é reconhecida na hora
//                 que a conta nasce, não quando o dinheiro sai).
//   AP_PAID     → débito Fornecedores / crédito Caixa-Banco-Cartão (por
//                 forma de pagamento) — nunca toca despesa de novo, ela já
//                 foi reconhecida no AP_CREATED. Cartão de crédito credita
//                 "Cartão de Crédito a Pagar" (passivo), nunca Caixa/Banco:
//                 pagar no cartão troca uma dívida por outra, não é saída
//                 de caixa. Fatura de cartão em si fica inerte até existir
//                 evento de pagamento de fatura (não inventado agora).
//   AP_PAYMENT_REVERSED / AP_DELETED / AP_UPDATED (valor ou categoria
//   mudando) → nunca edita um lançamento existente (ledger imutável por
//                 desenho) — sempre estorna (lançamento espelho, débito/
//                 crédito invertidos) e, se for edição, lança de novo com
//                 os dados certos.
//
// PAPEL, não tipo de evento: o lançamento a estornar é encontrado pelo LADO
// em que ele mexe na conta Fornecedores (3.01) — crédito = reconhecimento
// de despesa (papel do AP_CREATED), débito = quitação (papel do AP_PAID).
// Isso é o que faz um relançamento originado por AP_UPDATED (evento
// diferente de AP_CREATED) ainda ser encontrado certo se a conta for paga
// ou excluída depois — rastrear por "quem criou" quebraria nesse caso.
//
// COMMIT 6/7 — PDV: SALE_CREATED → débito conta de ativo pela forma de
// pagamento / crédito 6.01 Receita de Vendas + débito 7.01 CMV / crédito
// 1.05 Estoques, pelo custo real dos itens vendidos (item_venda.
// custo_unitario_na_venda, já congelado por finalizar_venda). As 4 partidas
// são montadas dentro da RPC contabil_registrar_lancamento_venda, nunca em
// TypeScript — custo/margem não pode passar pelo navegador do operador (ver
// gerarLancamentoVenda). Fora do escopo: cancelamento/estorno de venda,
// múltiplas formas de pagamento, venda a prazo — nenhum existe no PDV hoje.
//
// COMMIT 8/9 — CONTAS A RECEBER: de-para aprovado com o Elias em 2026-09-02:
//   AR_CREATED  → débito 1.04 Clientes / crédito conta de receita pela
//                 categoria (6.01 Vendas, 6.02 Serviços/Mensalidade/
//                 Consultoria) — regime de competência, mesma lógica do
//                 AP_CREATED espelhada pro lado do recebimento. Confirmado
//                 que contas_receber não tem nenhum vínculo (FK/trigger) com
//                 a venda do PDV — nasce sempre de lançamento manual do
//                 módulo, então nunca duplica a receita já reconhecida em
//                 SALE_CREATED.
//   AR_RECEIVED → débito conta de ativo pela forma de recebimento / crédito
//                 1.04 Clientes (baixa o que o cliente devia) — nunca toca
//                 receita de novo, ela já foi reconhecida no AR_CREATED.
//   AR_PAYMENT_REVERSED / AR_DELETED / AR_UPDATED → mesmo desenho do espelho
//                 AP: nunca edita lançamento existente, sempre estorna
//                 (lançamento espelho) e, se for edição, lança de novo.
//
// "Cartão de Crédito" no de-para de RECEBIMENTO (SALE_CREATED, AR_RECEIVED)
// é o cliente pagando a empresa — dinheiro entrando, ativo — por isso tem
// mapa PRÓPRIO (FORMA_RECEBIMENTO_PARA_CODIGO), separado do mapa de
// PAGAMENTO (FORMA_PAGAMENTO_PARA_CODIGO, onde "Cartão de Crédito" é a
// empresa pagando NO PRÓPRIO cartão — aí sim passivo, 3.06).
//
// COMMIT 10 — corrige um bug latente que já estava em produção desde o
// Commit 6/7: gerarLancamentoVenda (SALE_CREATED, PDV) reusava o mapa de
// PAGAMENTO pro débito da venda, debitando 3.06 "Cartão de Crédito a
// Pagar" (passivo) numa venda paga no cartão de crédito do CLIENTE — sem
// sentido, não existe dívida da empresa nesse caso, é dinheiro entrando.
// Passa a usar FORMA_RECEBIMENTO_PARA_CODIGO (decisão do Elias em
// 2026-09-02: sem conta "Cartão de Crédito a Receber" nova no plano,
// simplifica caindo em 1.02 Bancos — mesma simplificação que o app já faz,
// sem rastreio de prazo de liquidação de adquirente em lugar nenhum hoje).
// Só vale pra lançamentos NOVOS — não desfaz nem corrige nenhum lançamento
// já gravado (ledger imutável por desenho).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { registrarLancamentoContabil, type PartidaContabilInput } from "./contabilidadeHelpers";
import { type CategoriaDespesa } from "./categoriasDespesa";
import { publicarEvento, type OrigemEvento, type TipoEvento } from "./eventFabricHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// ============================================================================
// PUBLICAR + DISPARAR CONTABILIDADE (compartilhado) — publica o evento em
// eventos_negocio e, se der certo, aciona processarEventoContabil sem
// bloquear quem chamou. Morava só em contasPagarHelpers.ts (Commit 2) até o
// PDV (Commit 6) também precisar do mesmo encadeamento — movido pra cá, o
// módulo que já sabe de contabilidade, em vez de duplicar em cada helper de
// módulo que publica evento. Falha de evento OU do consumidor contábil nunca
// desfaz a operação principal, que já aconteceu de verdade antes desta
// função ser chamada.
// ============================================================================
export async function publicarEventoNaoBloqueante(
  empresaId: string | null | undefined,
  tipo: TipoEvento,
  payload: Record<string, unknown>,
  origem: OrigemEvento,
): Promise<void> {
  if (!empresaId) return;
  try {
    const { id: eventoId, erro } = await publicarEvento(empresaId, tipo, payload, origem);
    if (erro) {
      reportarFalhaEscrita("eventos_negocio", "publicarEvento", erro);
      return;
    }
    if (eventoId) {
      processarEventoContabil(tipo, empresaId, origem, payload).catch((e) =>
        reportarFalhaEscrita("lancamento_contabil", `consumidor ${tipo}`, e instanceof Error ? e.message : String(e)));
    }
  } catch (e) {
    reportarFalhaEscrita("eventos_negocio", "publicarEvento", e instanceof Error ? e.message : String(e));
  }
}

// ============================================================================
// DE-PARA — único lugar do código que decide qual conta contábil corresponde
// a cada categoria/forma de pagamento do app. Os dois enums (categorias de
// despesa, formas de pagamento) são fechados — sem "adivinhação" nenhuma.
// ============================================================================

const CODIGO_FORNECEDORES = "3.01";
const CODIGO_CLIENTES = "1.04";
const CODIGO_ESTOQUES = "1.05";
// Contas NOVAS, ainda não existem no plano padrão (SQL em arquivo separado,
// não aplicado) — até o Elias rodar aquele SQL, um ajuste/perda de estoque
// não encontra a conta e só reporta no Sentry (mesmo padrão de "conta não
// encontrada" já usado em todo o resto deste arquivo), sem lançar errado.
const CODIGO_GANHO_AJUSTE_ESTOQUE = "6.05";
const CODIGO_PERDA_ESTOQUE = "8.09";

const CATEGORIA_PARA_CODIGO: Record<CategoriaDespesa, string> = {
  "Produtos": "7.01",
  "Marketing": "8.03",
  "Logística": "8.07",
  "Tecnologia": "8.06",
  "Serviços": "8.08",
  "Outros": "8.02",
};
const CODIGO_DESPESA_PADRAO = "8.02"; // categoria fora do enum conhecido — não deveria acontecer, enum é fechado

// CATEGORIAS do módulo Contas a Receber (contas-receber/page.tsx: CATEGORIAS)
// — "Vendas" cai em Produtos (6.01) por simetria com o PDV; os demais em
// Serviços (6.02). "Outros" cai no padrão de produtos por não ter conta
// dedicada — mesmo raciocínio do CODIGO_DESPESA_PADRAO do lado do AP.
const CATEGORIA_RECEITA_PARA_CODIGO: Record<string, string> = {
  "Vendas": "6.01",
  "Serviços": "6.02",
  "Mensalidade": "6.02",
  "Consultoria": "6.02",
  "Outros": "6.01",
};
const CODIGO_RECEITA_PADRAO = "6.01";

// Mapa de PAGAMENTO — a empresa gastando (AP_PAID). "Cartão de Crédito" cai
// em passivo (3.06): pagar no próprio cartão troca uma dívida por outra,
// nunca é saída de caixa.
const FORMA_PAGAMENTO_PARA_CODIGO: Record<string, string> = {
  "Dinheiro": "1.01",
  "PIX": "1.02",
  "Boleto": "1.02",
  "Transferência": "1.02",
  "Cartão de Débito": "1.02",
  "Cartão de Crédito": "3.06",
};
const CODIGO_ATIVO_PADRAO = "1.02"; // forma de pagamento fora do enum conhecido

// Mapa de RECEBIMENTO — a empresa recebendo (SALE_CREATED, AR_RECEIVED).
// Único ponto de diferença do mapa de pagamento: "Cartão de Crédito" aqui é
// o cliente pagando a empresa, dinheiro entrando — tem que ser ativo, nunca
// a conta de passivo do cartão da própria empresa (ver nota no topo do
// arquivo). Sem conta dedicada de "Cartão de Crédito a Receber" no plano —
// simplifica em Bancos, mesma aproximação usada em todo o resto do app.
const FORMA_RECEBIMENTO_PARA_CODIGO: Record<string, string> = {
  "Dinheiro": "1.01",
  "PIX": "1.02",
  "Boleto": "1.02",
  "Transferência": "1.02",
  "Cartão de Débito": "1.02",
  "Cartão de Crédito": "1.02",
};

// ============================================================================
// MAPA DO PLANO DE CONTAS — resolve código → id. Busca tudo de uma vez (o
// plano tem ~45 linhas) em vez de uma query por conta.
// ============================================================================

async function mapaContasPorCodigo(empresaId: string): Promise<Record<string, string>> {
  const { data } = await supabase.from("plano_de_contas").select("id, codigo").eq("empresa_id", empresaId);
  const mapa: Record<string, string> = {};
  for (const c of (data as { id: string; codigo: string }[]) || []) mapa[c.codigo] = c.id;
  return mapa;
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================================
// ESTORNO POR PAPEL
// ============================================================================

async function estornarLancamentosPorPapel(
  empresaId: string,
  origemTabela: "contas_pagar" | "contas_receber",
  origemId: string,
  contaPapelId: string,
  ladoNaConta: "debito" | "credito",
  descricao: string,
): Promise<void> {
  const { data: cabecalhos, error: erroCabecalhos } = await supabase
    .from("lancamento_contabil")
    .select("id")
    .eq("empresa_id", empresaId).eq("origem_tabela", origemTabela).eq("origem_id", origemId)
    .is("estornado_por_id", null);
  if (erroCabecalhos) {
    reportarFalhaEscrita("lancamento_contabil", "buscar lançamentos p/ estorno automático", erroCabecalhos.message);
    return;
  }
  if (!cabecalhos || cabecalhos.length === 0) return;

  const idsCandidatos = cabecalhos.map((c) => c.id);
  const { data: partidasFornecedores, error: erroPartidas } = await supabase
    .from("lancamento_contabil_partida")
    .select("lancamento_id")
    .in("lancamento_id", idsCandidatos)
    .eq("conta_id", contaPapelId).eq("tipo", ladoNaConta);
  if (erroPartidas) {
    reportarFalhaEscrita("lancamento_contabil_partida", "buscar partidas p/ estorno automático", erroPartidas.message);
    return;
  }

  const idsAlvo = Array.from(new Set((partidasFornecedores || []).map((p: { lancamento_id: string }) => p.lancamento_id)));
  for (const lancamentoId of idsAlvo) {
    const { error: erroRpc } = await supabase.rpc("contabil_estornar_lancamento", {
      p_lancamento_id: lancamentoId, p_data: hojeISO(), p_descricao: descricao,
    });
    if (erroRpc) reportarFalhaEscrita("lancamento_contabil", "rpc contabil_estornar_lancamento", erroRpc.message);
  }
}

// ============================================================================
// ESTORNO POR ORIGEM (Estoque, Caixa) — mais simples que o estorno por papel
// acima: estoque_movimentacoes e caixa_movimentacao nunca têm dois eventos
// diferentes (tipo AP_CREATED + AP_PAID) apontando pro MESMO origem_id, cada
// linha gera no máximo 1 lançamento — então basta achar todo lançamento não
// estornado com esse (origem_tabela, origem_id) e reverter, sem precisar
// saber qual conta/lado ele mexeu.
// ============================================================================

async function estornarLancamentosPorOrigem(
  empresaId: string,
  origemTabela: "estoque_movimentacoes" | "caixa_movimentacao",
  origemId: string,
  descricao: string,
): Promise<void> {
  const { data: cabecalhos, error: erroCabecalhos } = await supabase
    .from("lancamento_contabil")
    .select("id")
    .eq("empresa_id", empresaId).eq("origem_tabela", origemTabela).eq("origem_id", origemId)
    .is("estornado_por_id", null);
  if (erroCabecalhos) {
    reportarFalhaEscrita("lancamento_contabil", "buscar lançamentos p/ estorno automático", erroCabecalhos.message);
    return;
  }
  for (const c of cabecalhos || []) {
    const { error: erroRpc } = await supabase.rpc("contabil_estornar_lancamento", {
      p_lancamento_id: c.id, p_data: hojeISO(), p_descricao: descricao,
    });
    if (erroRpc) reportarFalhaEscrita("lancamento_contabil", "rpc contabil_estornar_lancamento", erroRpc.message);
  }
}

// ============================================================================
// GERADORES — um por PAPEL de lançamento, reaproveitado por mais de um
// evento (AP_UPDATED chama o mesmo gerador de reconhecimento de despesa que
// AP_CREATED usa, ao relançar).
// ============================================================================

async function gerarReconhecimentoDespesa(
  empresaId: string,
  origemId: string,
  categoria: string | null | undefined,
  valor: number,
  descricaoConta: string | null | undefined,
  dataCompetencia: string,
  centroCustoId?: string | null,
): Promise<void> {
  if (!(valor > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const codigoDespesa = CATEGORIA_PARA_CODIGO[categoria as CategoriaDespesa] ?? CODIGO_DESPESA_PADRAO;
  const contaDespesaId = contas[codigoDespesa];
  const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
  if (!contaDespesaId || !contaFornecedoresId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (AP_CREATED)", `código ${codigoDespesa} ou ${CODIGO_FORNECEDORES} não encontrado na empresa ${empresaId}`);
    return;
  }
  // centro_custo_id só entra na ponta de despesa — a dimensão de rateio é do
  // impacto no resultado, não de qual conta de passivo/ativo é afetada.
  const partidas: PartidaContabilInput[] = [
    { contaId: contaDespesaId, tipo: "debito", valor, centroCustoId: centroCustoId ?? null },
    { contaId: contaFornecedoresId, tipo: "credito", valor },
  ];
  const descricao = descricaoConta ? `Conta a pagar: ${descricaoConta}` : "Conta a pagar";
  const { erro } = await registrarLancamentoContabil(empresaId, dataCompetencia, descricao, partidas, {
    origemTabela: "contas_pagar", origemId,
  });
  if (erro) reportarFalhaEscrita("lancamento_contabil", "gerar reconhecimento de despesa (AP_CREATED)", erro);
}

async function gerarQuitacao(
  empresaId: string,
  origemId: string,
  formaPagamento: string | null | undefined,
  valor: number,
  dataPagamento: string,
): Promise<void> {
  if (!(valor > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const codigoAtivo = FORMA_PAGAMENTO_PARA_CODIGO[formaPagamento ?? ""] ?? CODIGO_ATIVO_PADRAO;
  const contaAtivoId = contas[codigoAtivo];
  const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
  if (!contaAtivoId || !contaFornecedoresId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (AP_PAID)", `código ${codigoAtivo} ou ${CODIGO_FORNECEDORES} não encontrado na empresa ${empresaId}`);
    return;
  }
  const partidas: PartidaContabilInput[] = [
    { contaId: contaFornecedoresId, tipo: "debito", valor },
    { contaId: contaAtivoId, tipo: "credito", valor },
  ];
  const { erro } = await registrarLancamentoContabil(empresaId, dataPagamento, "Pagamento de conta a pagar", partidas, {
    origemTabela: "contas_pagar", origemId,
  });
  if (erro) reportarFalhaEscrita("lancamento_contabil", "gerar quitação (AP_PAID)", erro);
}

// ============================================================================
// GERAR RECEITA + CMV DA VENDA (PDV, Commit 7) — DIFERENTE dos geradores
// acima: não monta partidas em TypeScript. Chama a RPC
// contabil_registrar_lancamento_venda (PDV-FASE3-SALE-CONTABIL-RPC-SQL.txt),
// que soma o custo de item_venda e monta as 4 partidas (débito ativo/crédito
// 6.01 Receita; débito 7.01 CMV/crédito 1.05 Estoques) INTEIRAMENTE dentro
// do Postgres. Por quê: custo/margem é dado que o papel operador nunca pode
// ver em lugar nenhum do PDV (mesma regra de vw_produtos_seguro) — se a soma
// fosse feita aqui, em TS, o valor do CMV apareceria na aba Network do
// navegador de quem fechou a venda. Só o id da conta de ativo (pela forma de
// pagamento, mesmo mapa de gerarQuitacao) sai do client — isso não é
// sensível, é só o id de uma linha do plano de contas.
// ============================================================================

async function gerarLancamentoVenda(
  empresaId: string,
  vendaId: string,
  formaPagamento: string | null | undefined,
  valorTotal: number,
): Promise<void> {
  if (!(valorTotal > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const codigoAtivo = FORMA_RECEBIMENTO_PARA_CODIGO[formaPagamento ?? ""] ?? CODIGO_ATIVO_PADRAO;
  const contaAtivoId = contas[codigoAtivo];
  if (!contaAtivoId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (SALE_CREATED)", `código ${codigoAtivo} não encontrado na empresa ${empresaId}`);
    return;
  }
  const { error } = await supabase.rpc("contabil_registrar_lancamento_venda", {
    p_venda_id: vendaId, p_data: hojeISO(), p_descricao: "Venda PDV", p_conta_ativo_id: contaAtivoId,
  });
  if (error) reportarFalhaEscrita("lancamento_contabil", "rpc contabil_registrar_lancamento_venda (SALE_CREATED)", error.message);
}

// ============================================================================
// GERAR RECEITA + BAIXA DA CONTA A RECEBER (Commit 8/9) — espelho de
// gerarReconhecimentoDespesa/gerarQuitacao pro lado do recebimento. Não
// precisa de RPC própria (diferente do PDV): Contas a Receber não tem papel
// operador escondendo custo/margem, é módulo do próprio CFO/dono — as
// partidas podem ser montadas aqui, igual ao AP.
// ============================================================================

async function gerarReconhecimentoReceita(
  empresaId: string,
  origemId: string,
  categoria: string | null | undefined,
  valor: number,
  descricaoConta: string | null | undefined,
  dataCompetencia: string,
  centroCustoId?: string | null,
): Promise<void> {
  if (!(valor > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const codigoReceita = CATEGORIA_RECEITA_PARA_CODIGO[categoria ?? ""] ?? CODIGO_RECEITA_PADRAO;
  const contaReceitaId = contas[codigoReceita];
  const contaClientesId = contas[CODIGO_CLIENTES];
  if (!contaReceitaId || !contaClientesId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (AR_CREATED)", `código ${codigoReceita} ou ${CODIGO_CLIENTES} não encontrado na empresa ${empresaId}`);
    return;
  }
  const partidas: PartidaContabilInput[] = [
    { contaId: contaClientesId, tipo: "debito", valor },
    { contaId: contaReceitaId, tipo: "credito", valor, centroCustoId: centroCustoId ?? null },
  ];
  const descricao = descricaoConta ? `Conta a receber: ${descricaoConta}` : "Conta a receber";
  const { erro } = await registrarLancamentoContabil(empresaId, dataCompetencia, descricao, partidas, {
    origemTabela: "contas_receber", origemId,
  });
  if (erro) reportarFalhaEscrita("lancamento_contabil", "gerar reconhecimento de receita (AR_CREATED)", erro);
}

async function gerarBaixaRecebimento(
  empresaId: string,
  origemId: string,
  formaRecebimento: string | null | undefined,
  valor: number,
  dataRecebimento: string,
): Promise<void> {
  if (!(valor > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const codigoAtivo = FORMA_RECEBIMENTO_PARA_CODIGO[formaRecebimento ?? ""] ?? CODIGO_ATIVO_PADRAO;
  const contaAtivoId = contas[codigoAtivo];
  const contaClientesId = contas[CODIGO_CLIENTES];
  if (!contaAtivoId || !contaClientesId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (AR_RECEIVED)", `código ${codigoAtivo} ou ${CODIGO_CLIENTES} não encontrado na empresa ${empresaId}`);
    return;
  }
  const partidas: PartidaContabilInput[] = [
    { contaId: contaAtivoId, tipo: "debito", valor },
    { contaId: contaClientesId, tipo: "credito", valor },
  ];
  const { erro } = await registrarLancamentoContabil(empresaId, dataRecebimento, "Recebimento de conta a receber", partidas, {
    origemTabela: "contas_receber", origemId,
  });
  if (erro) reportarFalhaEscrita("lancamento_contabil", "gerar baixa de recebimento (AR_RECEIVED)", erro);
}

// ============================================================================
// ESTOQUE (Commit 11) — DE-PARA aprovado com o Elias em 2026-09-02.
//
// DUPLA CONTAGEM — o ponto crítico: nem toda entrada em estoque_movimentacoes
// vira lançamento. Só `origem: "manual"` (compra sem NF-e, ou primeira carga
// de lote de um produto novo — ver PdvCadastroProduto.tsx/estoque/page.tsx)
// gera reconhecimento de estoque aqui. Mercadoria que entra por NF-e
// (`origem: "nfe"`, pdv/importar-nfe/page.tsx) NÃO lança de novo — o
// contas_pagar nascido daquela mesma nota já reconhece o valor via
// AP_CREATED (débito despesa/categoria, crédito Fornecedores); lançar de
// novo aqui contaria a mesma compra 2x. Saída de estoque por venda
// (`origem: "pdv"`, baixarEstoqueVenda) também NÃO lança de novo — o CMV já
// sai pela RPC contabil_registrar_lancamento_venda (SALE_CREATED). `origem:
// "importacao"` (bulk/migração) fica de fora por ora: nenhum call site do
// código usa esse valor hoje, e dado histórico de migração não é fato
// financeiro do dia a dia — mais seguro não adivinhar do que lançar errado.
//
// VALOR — quando a linha não tem custo_unitario (comum em ajuste/perda
// lançados na tela rápida de "Nova Movimentação", campo opcional), busca o
// preco_medio ATUAL do produto: a trigger fn_estoque_recalcular_produto (já
// em produção) usa exatamente esse valor pra compor o saldo de um ajuste, e
// pra 'perda' já today faz o mesmo backfill em NEW.custo_unitario antes de
// gravar — ler de volta depois do insert dá o número certo nos dois casos.
// ============================================================================

async function custoUnitarioEfetivo(produtoId: string, custoDaLinha: number | null | undefined): Promise<number> {
  if (custoDaLinha != null && custoDaLinha > 0) return custoDaLinha;
  const { data } = await supabase.from("produtos").select("preco_medio").eq("id", produtoId).maybeSingle();
  return Number((data as { preco_medio: number } | null)?.preco_medio) || 0;
}

async function gerarEntradaEstoqueManual(
  empresaId: string,
  origemId: string,
  produtoId: string,
  quantidade: number,
  custoUnitario: number | null | undefined,
  dataMovimento: string,
): Promise<void> {
  const custo = await custoUnitarioEfetivo(produtoId, custoUnitario);
  const valor = quantidade * custo;
  if (!(valor > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const contaEstoquesId = contas[CODIGO_ESTOQUES];
  const contaAtivoId = contas[CODIGO_ATIVO_PADRAO];
  if (!contaEstoquesId || !contaAtivoId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (STOCK_ENTRY_MANUAL)", `código ${CODIGO_ESTOQUES} ou ${CODIGO_ATIVO_PADRAO} não encontrado na empresa ${empresaId}`);
    return;
  }
  const partidas: PartidaContabilInput[] = [
    { contaId: contaEstoquesId, tipo: "debito", valor },
    { contaId: contaAtivoId, tipo: "credito", valor },
  ];
  const { erro } = await registrarLancamentoContabil(empresaId, dataMovimento, "Entrada de estoque (compra manual)", partidas, {
    origemTabela: "estoque_movimentacoes", origemId,
  });
  if (erro) reportarFalhaEscrita("lancamento_contabil", "gerar entrada de estoque (STOCK_ENTRY_MANUAL)", erro);
}

async function gerarAjusteEstoque(
  empresaId: string,
  origemId: string,
  produtoId: string,
  quantidade: number,
  custoUnitario: number | null | undefined,
  dataMovimento: string,
): Promise<void> {
  const custo = await custoUnitarioEfetivo(produtoId, custoUnitario);
  const valor = quantidade * custo;
  if (!(valor > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const contaEstoquesId = contas[CODIGO_ESTOQUES];
  const contaGanhoId = contas[CODIGO_GANHO_AJUSTE_ESTOQUE];
  if (!contaEstoquesId || !contaGanhoId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (STOCK_ADJUSTMENT)", `código ${CODIGO_ESTOQUES} ou ${CODIGO_GANHO_AJUSTE_ESTOQUE} não encontrado na empresa ${empresaId} — rode o SQL novo de contas`);
    return;
  }
  const partidas: PartidaContabilInput[] = [
    { contaId: contaEstoquesId, tipo: "debito", valor },
    { contaId: contaGanhoId, tipo: "credito", valor },
  ];
  const { erro } = await registrarLancamentoContabil(empresaId, dataMovimento, "Ajuste de estoque (contagem)", partidas, {
    origemTabela: "estoque_movimentacoes", origemId,
  });
  if (erro) reportarFalhaEscrita("lancamento_contabil", "gerar ajuste de estoque (STOCK_ADJUSTMENT)", erro);
}

async function gerarPerdaEstoque(
  empresaId: string,
  origemId: string,
  produtoId: string,
  quantidade: number,
  custoUnitario: number | null | undefined,
  dataMovimento: string,
): Promise<void> {
  const custo = await custoUnitarioEfetivo(produtoId, custoUnitario);
  const valor = quantidade * custo;
  if (!(valor > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const contaEstoquesId = contas[CODIGO_ESTOQUES];
  const contaPerdaId = contas[CODIGO_PERDA_ESTOQUE];
  if (!contaEstoquesId || !contaPerdaId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (STOCK_LOSS)", `código ${CODIGO_ESTOQUES} ou ${CODIGO_PERDA_ESTOQUE} não encontrado na empresa ${empresaId} — rode o SQL novo de contas`);
    return;
  }
  const partidas: PartidaContabilInput[] = [
    { contaId: contaPerdaId, tipo: "debito", valor },
    { contaId: contaEstoquesId, tipo: "credito", valor },
  ];
  const { erro } = await registrarLancamentoContabil(empresaId, dataMovimento, "Perda/quebra de estoque", partidas, {
    origemTabela: "estoque_movimentacoes", origemId,
  });
  if (erro) reportarFalhaEscrita("lancamento_contabil", "gerar perda de estoque (STOCK_LOSS)", erro);
}

// ============================================================================
// CONSUMIDOR — chamado por publicarEventoNaoBloqueante logo depois que o
// evento é publicado com sucesso em eventos_negocio. Só trata origem
// "contas_pagar", "venda", "contas_receber" e "estoque_movimentacoes"; outros
// módulos que um dia publicarem eventos ficam de fora até terem seu próprio
// de-para revisado (nunca improvisado aqui).
// ============================================================================

export async function processarEventoContabil(
  tipo: string,
  empresaId: string,
  origem: OrigemEvento,
  payload: Record<string, unknown>,
): Promise<void> {
  const origensConhecidas = ["contas_pagar", "venda", "contas_receber", "estoque_movimentacoes"];
  if (!origem.id || !origem.tabela || !origensConhecidas.includes(origem.tabela)) return;
  const origemId = origem.id;

  try {
    switch (tipo) {
      case "SALE_CREATED": {
        // PDV, Commit 6/7 — receita + CMV. O payload nunca tem custo/margem
        // (ver pdvVendaHelpers.ts); quem soma o CMV é a RPC contábil, direto
        // no Postgres, e monta as 4 partidas sem devolver o valor pro
        // navegador do operador.
        await gerarLancamentoVenda(
          empresaId, origemId, payload.forma_pagamento as string | null, Number(payload.valor_total) || 0,
        );
        break;
      }
      case "AP_CREATED": {
        const dataCompetencia = (payload.data_emissao as string) || hojeISO();
        await gerarReconhecimentoDespesa(
          empresaId, origemId, payload.categoria as string | null,
          Number(payload.valor) || 0, payload.descricao as string | null, dataCompetencia,
          payload.centro_custo_id as string | null,
        );
        break;
      }
      case "AP_PAID": {
        const incremento = Number(payload.valor_incremento) || 0;
        await gerarQuitacao(
          empresaId, origemId, payload.forma_pagamento as string | null,
          incremento, (payload.data_pagamento as string) || hojeISO(),
        );
        break;
      }
      case "AP_PAYMENT_REVERSED": {
        const contas = await mapaContasPorCodigo(empresaId);
        const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
        if (!contaFornecedoresId) break;
        // Papel do AP_PAID = débito em Fornecedores (quitação) — reverte todo
        // pagamento ainda não estornado, cobre também baixas parciais.
        await estornarLancamentosPorPapel(empresaId, "contas_pagar", origemId, contaFornecedoresId, "debito", "Estorno de pagamento");
        break;
      }
      case "AP_DELETED": {
        const contas = await mapaContasPorCodigo(empresaId);
        const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
        if (!contaFornecedoresId) break;
        // Papel do AP_CREATED = crédito em Fornecedores (reconhecimento) —
        // sem isto, excluir uma conta em aberto deixava despesa fantasma no Razão.
        await estornarLancamentosPorPapel(empresaId, "contas_pagar", origemId, contaFornecedoresId, "credito", "Estorno por exclusão da conta");
        break;
      }
      case "AP_UPDATED": {
        const valorMudou = payload.valor_antes != null && payload.valor_depois != null
          && Number(payload.valor_antes) !== Number(payload.valor_depois);
        const categoriaMudou = payload.categoria_antes !== undefined && payload.categoria_depois !== undefined
          && payload.categoria_antes !== payload.categoria_depois;
        if (!valorMudou && !categoriaMudou) break;
        const contas = await mapaContasPorCodigo(empresaId);
        const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
        if (!contaFornecedoresId) break;
        await estornarLancamentosPorPapel(empresaId, "contas_pagar", origemId, contaFornecedoresId, "credito", "Estorno por edição (valor/categoria alterados)");
        const dataCompetencia = (payload.data_emissao_depois as string) || hojeISO();
        await gerarReconhecimentoDespesa(
          empresaId, origemId, payload.categoria_depois as string | null,
          Number(payload.valor_depois) || 0, payload.descricao_depois as string | null, dataCompetencia,
          payload.centro_custo_id_depois as string | null,
        );
        break;
      }
      case "AR_CREATED": {
        const dataCompetencia = (payload.data_emissao as string) || (payload.competencia as string) || hojeISO();
        await gerarReconhecimentoReceita(
          empresaId, origemId, payload.categoria as string | null,
          Number(payload.valor) || 0, payload.descricao as string | null, dataCompetencia,
          payload.centro_custo_id as string | null,
        );
        break;
      }
      case "AR_RECEIVED": {
        const incremento = Number(payload.valor_incremento) || 0;
        await gerarBaixaRecebimento(
          empresaId, origemId, payload.forma_recebimento as string | null,
          incremento, (payload.data_recebimento as string) || hojeISO(),
        );
        break;
      }
      case "AR_PAYMENT_REVERSED": {
        const contas = await mapaContasPorCodigo(empresaId);
        const contaClientesId = contas[CODIGO_CLIENTES];
        if (!contaClientesId) break;
        // Papel do AR_RECEIVED = crédito em Clientes (baixa) — reverte todo
        // recebimento ainda não estornado, cobre também baixas parciais.
        await estornarLancamentosPorPapel(empresaId, "contas_receber", origemId, contaClientesId, "credito", "Estorno de recebimento");
        break;
      }
      case "AR_DELETED": {
        const contas = await mapaContasPorCodigo(empresaId);
        const contaClientesId = contas[CODIGO_CLIENTES];
        if (!contaClientesId) break;
        // Papel do AR_CREATED = débito em Clientes (reconhecimento) — sem
        // isto, excluir uma conta em aberto deixava receita fantasma no Razão.
        await estornarLancamentosPorPapel(empresaId, "contas_receber", origemId, contaClientesId, "debito", "Estorno por exclusão da conta");
        break;
      }
      case "AR_UPDATED": {
        const valorMudou = payload.valor_antes != null && payload.valor_depois != null
          && Number(payload.valor_antes) !== Number(payload.valor_depois);
        const categoriaMudou = payload.categoria_antes !== undefined && payload.categoria_depois !== undefined
          && payload.categoria_antes !== payload.categoria_depois;
        if (!valorMudou && !categoriaMudou) break;
        const contas = await mapaContasPorCodigo(empresaId);
        const contaClientesId = contas[CODIGO_CLIENTES];
        if (!contaClientesId) break;
        await estornarLancamentosPorPapel(empresaId, "contas_receber", origemId, contaClientesId, "debito", "Estorno por edição (valor/categoria alterados)");
        const dataCompetencia = (payload.data_emissao_depois as string) || hojeISO();
        await gerarReconhecimentoReceita(
          empresaId, origemId, payload.categoria_depois as string | null,
          Number(payload.valor_depois) || 0, payload.descricao_depois as string | null, dataCompetencia,
          payload.centro_custo_id_depois as string | null,
        );
        break;
      }
      case "STOCK_ENTRY_MANUAL": {
        await gerarEntradaEstoqueManual(
          empresaId, origemId, payload.produto_id as string, Number(payload.quantidade) || 0,
          payload.custo_unitario as number | null, (payload.data_hora as string)?.slice(0, 10) || hojeISO(),
        );
        break;
      }
      case "STOCK_ADJUSTMENT": {
        await gerarAjusteEstoque(
          empresaId, origemId, payload.produto_id as string, Number(payload.quantidade) || 0,
          payload.custo_unitario as number | null, (payload.data_hora as string)?.slice(0, 10) || hojeISO(),
        );
        break;
      }
      case "STOCK_LOSS": {
        await gerarPerdaEstoque(
          empresaId, origemId, payload.produto_id as string, Number(payload.quantidade) || 0,
          payload.custo_unitario as number | null, (payload.data_hora as string)?.slice(0, 10) || hojeISO(),
        );
        break;
      }
      default:
        return; // demais eventos são sinal de workflow, não fato financeiro
    }
  } catch (e) {
    reportarFalhaEscrita("lancamento_contabil", `consumidor ${tipo}`, e instanceof Error ? e.message : String(e));
  }
}
