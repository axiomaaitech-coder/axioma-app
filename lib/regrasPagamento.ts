// Regras de pagamento usadas por Fluxo de Caixa, Contabilidade, Estoque e Conferência (decisão do Elias, 2026-11-06).
// Compra no cartão de crédito vira dívida na hora: o dinheiro só sai do caixa quando a fatura é paga.
export const CARTAO_CREDITO = "Cartão de Crédito";
export const saiDoCaixaAgora = (forma: string | null | undefined) => forma !== CARTAO_CREDITO;

// Como uma entrada manual de estoque foi paga. Estoque inicial não é compra: nenhum dinheiro saiu.
export type PagamentoEntrada =
  | { modo: "pago"; forma: string }
  | { modo: "a_prazo"; vencimento: string; fornecedor_id?: string | null }
  | { modo: "estoque_inicial" };
