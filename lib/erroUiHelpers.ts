import * as Sentry from "@sentry/nextjs";
import { comRetentativa, type ErroBanco } from "./antiFalha";

export type LangUi = "pt" | "en" | "es";

// Helper ÚNICO e centralizado pra falha de LEITURA/AÇÃO (carregar tela,
// gerar/exportar arquivo) — NUNCA escrita, isso já é reportarFalhaEscrita
// (um por arquivo, padrão já fechado no projeto). Existir centralizado aqui
// (em vez de copiado por tela, como reportarFalhaEscrita) é deliberado: essa
// categoria de erro (catch silencioso) foi encontrada duplicada em 21+
// lugares — duplicar de novo o remédio recriaria o mesmo problema.
export function reportarFalhaLeitura(contexto: string, err: unknown): void {
  Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { contexto } });
}

type RespostaBanco<T> = { data: T; error: ErroBanco | null };

// ─── Último caso do SISTEMA ANTI-FALHA (lib/antiFalha.ts): a leitura já foi tentada de novo
// sozinha; se ainda assim falhou, exigirLeitura LANÇA (quem chama cancela a gravação ou mostra o
// aviso) e registrarLeitura segue sem o dado — os dois registram no monitoramento. ───

// Último caso visível: avisa a tela aberta (components/AvisoFalhaLeitura, no layout interno) que
// um dado não veio mesmo depois das novas tentativas — nunca deixa parecer que é zero/vazio de verdade.
export const EVENTO_FALHA_LEITURA = "axioma:falha-leitura";
function avisarTela() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_FALHA_LEITURA));
}

// Leitura que NÃO pode virar "vazio" calado (lista, soma, checagem "já existe?" antes de gravar).
// Antes, falha virava "não existe" e a checagem deixava gravar em dobro.
export async function exigirLeitura<T>(executar: () => PromiseLike<RespostaBanco<T>>, contexto: string): Promise<T> {
  const r = await comRetentativa(executar);
  if (r.error) {
    const e = new Error(`leitura falhou (${contexto}): ${r.error.message}`);
    reportarFalhaLeitura(contexto, e);
    avisarTela();
    throw e;
  }
  return r.data;
}

// Leitura opcional (nome para exibir, cache, evento de fundo): tenta de novo sozinha; se ainda
// assim falhar, segue sem o dado e a falha fica registrada.
export async function registrarLeitura<T>(executar: () => PromiseLike<RespostaBanco<T>>, contexto: string): Promise<T> {
  const r = await comRetentativa(executar);
  if (r.error) { reportarFalhaLeitura(contexto, new Error(`leitura falhou (${contexto}): ${r.error.message}`)); avisarTela(); }
  return r.data;
}

export function mensagemFalhaCarregamento(lang: LangUi = "pt"): string {
  return lang === "en"
    ? "Some data could not be loaded. The rest of the screen still works — try refreshing the page."
    : lang === "es"
    ? "Algunos datos no se pudieron cargar. El resto de la pantalla sigue funcionando — intente actualizar la página."
    : "Alguns dados não puderam ser carregados. O resto da tela continua funcionando — tente atualizar a página.";
}

export function mensagemFalhaExportacao(lang: LangUi = "pt"): string {
  return lang === "en"
    ? "Could not generate the PDF. Try again."
    : lang === "es"
    ? "No se pudo generar el PDF. Intente de nuevo."
    : "Não foi possível gerar o PDF. Tente novamente.";
}

// Reporta a falha de carregamento no Sentry e já devolve a mensagem pronta
// pra tela mostrar num toast — a tela nunca trava, só avisa que o dado pode
// estar incompleto em vez de deixar parecer que é zero de verdade.
export function tratarFalhaCarregamento(contexto: string, err: unknown, lang: LangUi = "pt"): string {
  reportarFalhaLeitura(contexto, err);
  return mensagemFalhaCarregamento(lang);
}

// Mesma ideia pra exportação (PDF/CSV/compartilhamento) — texto próprio.
export function tratarFalhaExportacao(contexto: string, err: unknown, lang: LangUi = "pt"): string {
  reportarFalhaLeitura(contexto, err);
  return mensagemFalhaExportacao(lang);
}
