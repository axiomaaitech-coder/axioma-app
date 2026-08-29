import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import * as Sentry from "@sentry/nextjs";

// 🦅 AXIOMA AI.TECH - Lista de bancos brasileiros (BrasilAPI), server-side.
// Alimenta o seletor com busca do campo Banco em /empresa. Lista muda raramente
// (não sai banco novo toda semana) — cache de 24h no fetch, sem custo de rodar
// de novo a cada tela aberta.
//
// Mesma instrumentação do consulta-cnpj/route.ts (ver comentário lá) — log
// real no servidor + campo "detalhe" técnico na resposta, nunca corpo cru.

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { /* rota só de leitura */ } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "erro" }, { status: 401 });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  let resp: Response;
  const inicio = Date.now();
  try {
    resp = await fetch("https://brasilapi.com.br/api/banks/v1", {
      signal: controller.signal,
      next: { revalidate: 86400 },
      headers: { "User-Agent": "AxiomaAI.Tech/1.0 (+https://axioma.ai.tech)" },
    });
  } catch (err: any) {
    const timeoutEstourou = err?.name === "AbortError";
    console.error("[bancos] fetch falhou", {
      ms: Date.now() - inicio, timeout: timeoutEstourou,
      erroNome: err?.name, erroMsg: err?.message, erroCausa: err?.cause?.message || err?.cause,
    });
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: "empresa/bancos", etapa: "fetch", timeout: timeoutEstourou } });
    return NextResponse.json({
      status: "indisponivel", bancos: [],
      detalhe: { httpStatus: null, motivo: timeoutEstourou ? "timeout_8s" : `fetch_excecao: ${err?.message || err?.name || "desconhecido"}` },
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!resp.ok) {
    const corpo = await resp.text().catch(() => "");
    console.error("[bancos] BrasilAPI respondeu status != 2xx", {
      httpStatus: resp.status, ms: Date.now() - inicio, corpoInicio: corpo.slice(0, 300),
    });
    Sentry.captureException(new Error(`[bancos] BrasilAPI respondeu ${resp.status}`), { extra: { rota: "empresa/bancos", etapa: "resposta_nao_ok", httpStatus: resp.status } });
    return NextResponse.json({ status: "indisponivel", bancos: [], detalhe: { httpStatus: resp.status, motivo: "http_nao_ok" } });
  }

  let data: any;
  try {
    data = await resp.json();
  } catch (err: any) {
    console.error("[bancos] JSON inválido na resposta 2xx da BrasilAPI", { erroMsg: err?.message });
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: "empresa/bancos", etapa: "json_invalido", httpStatus: resp.status } });
    return NextResponse.json({ status: "indisponivel", bancos: [], detalhe: { httpStatus: resp.status, motivo: "json_invalido" } });
  }

  const bancos = (Array.isArray(data) ? data : [])
    .filter((b: any) => b.code && b.name)
    .map((b: any) => ({ codigo: String(b.code), nome: b.name }))
    .sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  return NextResponse.json({ status: "ok", bancos });
}
