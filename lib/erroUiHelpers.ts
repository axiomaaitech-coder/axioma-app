import * as Sentry from "@sentry/nextjs";

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
