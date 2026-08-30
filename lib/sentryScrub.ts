// 🦅 AXIOMA AI.TECH — Sentry: redação de credencial/PII sensível antes de
// qualquer evento sair do navegador/servidor. Único lugar com a lista de
// nomes sensíveis — instrumentation-client.ts, sentry.server.config.ts e
// sentry.edge.config.ts só chamam scrubEventoSentry, nenhum reimplementa a
// regra. Defesa em profundidade: não depende de nenhuma rota lembrar de não
// logar uma chave — se acontecer, isto redige antes de sair daqui.

import type { ErrorEvent as EventoSentry, Breadcrumb } from "@sentry/nextjs";

// "cookie" só entra na lista de HEADER (abaixo) — como nome de campo solto
// em extra/contexts ela dá falso positivo demais (ex.: "cookieConsentDado").
const NOME_SENSIVEL = /token|secret|api[_-]?key|password|senha|authorization/i;
const HEADERS_SENSIVEIS = new Set(["authorization", "x-api-key", "cookie"]);

function redigirHeaders(headers: unknown): unknown {
  if (!headers || typeof headers !== "object") return headers;
  const saida: Record<string, unknown> = {};
  for (const [nome, valor] of Object.entries(headers as Record<string, unknown>)) {
    saida[nome] = HEADERS_SENSIVEIS.has(nome.toLowerCase()) || NOME_SENSIVEL.test(nome) ? "[REDACTED]" : valor;
  }
  return saida;
}

// Percorre extra/contexts/breadcrumb.data recursivamente. Qualquer chave
// cujo NOME contenha um termo sensível vira "[REDACTED]" (o valor nunca é
// inspecionado — o risco está no nome do campo, não em adivinhar o formato
// do segredo). Uma sub-chave chamada "headers"/"requestHeaders"/etc. é
// tratada pelo redator de headers (pega "cookie", que a regra geral não pega
// de propósito). Profundidade limitada — nunca trava num evento gigante.
function redigirProfundo(valor: unknown, profundidade = 0): unknown {
  if (profundidade > 6 || valor === null || typeof valor !== "object") return valor;
  if (Array.isArray(valor)) return valor.map((v) => redigirProfundo(v, profundidade + 1));
  const saida: Record<string, unknown> = {};
  for (const [chave, val] of Object.entries(valor as Record<string, unknown>)) {
    if (chave.toLowerCase().includes("header")) {
      saida[chave] = redigirHeaders(val);
    } else if (NOME_SENSIVEL.test(chave)) {
      saida[chave] = "[REDACTED]";
    } else if (val && typeof val === "object") {
      saida[chave] = redigirProfundo(val, profundidade + 1);
    } else {
      saida[chave] = val;
    }
  }
  return saida;
}

// beforeSend de verdade. Nunca lança — se a própria redação falhar por
// algum evento com formato inesperado, deixa o evento passar como veio a
// derrubar o report de erro inteiro seria pior que o risco que isto cobre.
export function scrubEventoSentry(event: EventoSentry): EventoSentry {
  try {
    if (event.request?.headers) {
      event.request.headers = redigirHeaders(event.request.headers) as Record<string, string>;
    }
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map((b: Breadcrumb) =>
        b?.data ? { ...b, data: redigirProfundo(b.data) as Record<string, unknown> } : b
      );
    }
    if (event.extra) {
      event.extra = redigirProfundo(event.extra) as Record<string, unknown>;
    }
    if (event.contexts) {
      event.contexts = redigirProfundo(event.contexts) as EventoSentry["contexts"];
    }
  } catch {
    // ver comentário acima — nunca bloqueia o envio do evento por causa disto.
  }
  return event;
}
