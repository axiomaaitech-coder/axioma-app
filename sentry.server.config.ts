// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubEventoSentry } from "./lib/sentryScrub";

Sentry.init({
  dsn: "https://b7f638e37fa0bf89c943b8cbefe83513@o4511068799696896.ingest.us.sentry.io/4511068809265152",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Desligado de propósito: app financeiro — não manda IP/PII automática do
  // usuário pro Sentry pelo ganho de debug. Credencial já era coberta pelo
  // scrub abaixo independente disso; isto fecha a PII que o scrub não pega
  // (não é nome de campo sensível, é o dado em si — IP, corpo, cookie).
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  // Defesa em profundidade (auditoria de segredos): redige Authorization/
  // X-API-KEY/Cookie e qualquer campo com nome de credencial antes de sair
  // — cobre as chamadas de saída pra OpenAI/Anthropic/Groq/Stripe/Pluggy
  // feitas de rotas server-side deste app.
  beforeSend: scrubEventoSentry,
});
