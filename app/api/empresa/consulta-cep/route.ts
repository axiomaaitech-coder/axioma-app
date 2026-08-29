import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import * as Sentry from "@sentry/nextjs";

// 🦅 AXIOMA AI.TECH - Consulta de CEP no ViaCEP, server-side.
// O CSP hoje já libera viacep.com.br (não estava bloqueada), mas
// consultarCEP() é helper compartilhado (Empresa, Fornecedores, Centro de
// Custos) — move pro servidor também, mesmo padrão do CNPJ/Cosmos EAN.
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

  const cep = (req.nextUrl.searchParams.get("cep") || "").replace(/\D/g, "");
  if (cep.length !== 8) return NextResponse.json({ status: "invalido" });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  let resp: Response;
  const inicio = Date.now();
  try {
    resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
      headers: { "User-Agent": "AxiomaAI.Tech/1.0 (+https://axioma.ai.tech)" },
    });
  } catch (err: any) {
    const timeoutEstourou = err?.name === "AbortError";
    console.error("[consulta-cep] fetch falhou", {
      cep, ms: Date.now() - inicio, timeout: timeoutEstourou,
      erroNome: err?.name, erroMsg: err?.message, erroCausa: err?.cause?.message || err?.cause,
    });
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: "empresa/consulta-cep", etapa: "fetch", timeout: timeoutEstourou } });
    return NextResponse.json({
      status: "indisponivel",
      detalhe: { httpStatus: null, motivo: timeoutEstourou ? "timeout_6s" : `fetch_excecao: ${err?.message || err?.name || "desconhecido"}` },
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!resp.ok) {
    const corpo = await resp.text().catch(() => "");
    console.error("[consulta-cep] ViaCEP respondeu status != 2xx", {
      cep, httpStatus: resp.status, ms: Date.now() - inicio, corpoInicio: corpo.slice(0, 300),
    });
    Sentry.captureException(new Error(`[consulta-cep] ViaCEP respondeu ${resp.status}`), { extra: { rota: "empresa/consulta-cep", etapa: "resposta_nao_ok", httpStatus: resp.status } });
    return NextResponse.json({ status: "indisponivel", detalhe: { httpStatus: resp.status, motivo: "http_nao_ok" } });
  }

  let data: any;
  try {
    data = await resp.json();
  } catch (err: any) {
    console.error("[consulta-cep] JSON inválido na resposta 2xx do ViaCEP", { cep, erroMsg: err?.message });
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: "empresa/consulta-cep", etapa: "json_invalido", httpStatus: resp.status } });
    return NextResponse.json({ status: "indisponivel", detalhe: { httpStatus: resp.status, motivo: "json_invalido" } });
  }
  if (data.erro) return NextResponse.json({ status: "nao_encontrado" });

  return NextResponse.json({
    status: "ok",
    cep: data.cep,
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    uf: data.uf,
  });
}
