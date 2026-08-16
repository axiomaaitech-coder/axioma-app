// 🦅 AXIOMA AI.TECH - Camada adaptadora de dispositivos do Estoque
//
// Fase 1 implementa só o leitor de código de barras (é tudo que este módulo
// precisa hoje). O resto abaixo são GANCHOS documentados — pontos de entrada
// prontos pra quando o PDV, a NFC-e ou a IA existirem, sem precisar refatorar
// o Estoque quando esse dia chegar. Nada disso roda agora.

import type { KeyboardEvent } from "react";

// ============================================================================
// LEITOR DE CÓDIGO DE BARRAS (HID) — implementado, funcional
// ============================================================================
// Um leitor USB/Bluetooth em modo HID é só um teclado muito rápido: ele manda
// os caracteres do código e finaliza com Enter. Um <input> comum já resolve
// isso sozinho (não precisa de listener global nem de debounce manual) — o
// hook só empacota "se foi Enter, pega o valor atual do campo e dispara".
export function useLeitorCodigoBarras(onLeitura: (codigo: string) => void) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const codigo = e.currentTarget.value.trim();
      if (codigo) onLeitura(codigo);
    }
  };
  return { onKeyDown };
}

// ============================================================================
// GANCHOS — NÃO IMPLEMENTADOS NESTA FASE (documentados de propósito)
// ============================================================================

// PDV — baixa de estoque por venda real. IMPLEMENTADO (2026-08-16), não
// aqui — baixarEstoqueVenda() em lib/pdvVendaHelpers.ts, chamando
// criarMovimentacao() com tipo:'saida', origem:'pdv', documento_ref:<venda_id>,
// exatamente como planejado neste gancho. Ficou no módulo do PDV (não como
// função à parte aqui) porque a orquestração — tentar item a item, marcar
// venda.estoque_baixado, expor "quais falharam" pra tela — é específica da
// Frente de Caixa; a chamada de baixo nível (criarMovimentacao) continua
// sendo a mesma de sempre, sem duplicação nenhuma.

// Impressora ESC/POS (cupom não fiscal, etiqueta de produto) — hardware do
// PDV, não do Estoque. Quando existir, o adaptador de impressão vive aqui,
// não dentro de app/(interno)/estoque/page.tsx, pra não acoplar a tela ao
// driver de hardware específico.
// export async function imprimirEtiquetaProduto(produto: Produto) { /* ESC/POS via WebUSB/WebSerial */ }

// Gaveta de caixa (abre por comando da impressora ESC/POS ou pulso próprio) —
// PDV também, mesmo motivo acima.
// export async function abrirGavetaCaixa() { /* pulso via impressora ESC/POS */ }

// NFC-e/SEFAZ — emissão de nota na venda (PDV) e leitura de NF-e de compra
// (entrada de estoque, ver "Importar Documentos" abaixo). Fica fora daqui:
// exige certificado digital A1/A3 e comunicação com a SEFAZ, escopo de outro
// módulo inteiro, não deste device adapter.
// export async function emitirNFCe(venda: unknown) { /* SEFAZ */ }

// IA plugável — ponto único de config, mesmo padrão já usado em IA Financeira
// e IA Tributária (fallback determinístico até a ANTHROPIC_API_KEY ser
// ativada, decisão do Elias). Quando o Estoque ganhar sugestão de recompra/
// previsão de ruptura por IA (Fase 2), o gancho entra aqui, não espalhado
// pela tela.
// export async function sugestaoIAEstoque(contexto: unknown) { /* @anthropic-ai/sdk via app/api/ia-chat */ }

// Importar Documentos — NF-e de compra virando entrada de estoque automática.
// Ponto de entrada: lib/importarHelpers.ts já sabe classificar uma NF-e; o dia
// que ligar em Estoque, o destino da linha vira uma chamada a criarMovimentacao
// (tipo:'entrada', origem:'nfe', documento_ref:<chave da NF-e>) em vez de só
// contas_pagar. Não conectado agora (decisão: Importar Documentos está
// pausado até a Fase 2/IA, ver STATUS-AXIOMA.md).
