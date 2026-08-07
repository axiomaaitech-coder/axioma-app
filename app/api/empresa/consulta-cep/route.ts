import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 🦅 AXIOMA AI.TECH - Consulta de CEP no ViaCEP, server-side.
// O CSP hoje já libera viacep.com.br (não estava bloqueada), mas
// consultarCEP() é helper compartilhado (Empresa, Fornecedores, Centro de
// Custos) — move pro servidor também, mesmo padrão do CNPJ/Cosmos EAN.

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
  try {
    resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal });
  } catch {
    return NextResponse.json({ status: "indisponivel" });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!resp.ok) return NextResponse.json({ status: "indisponivel" });
  const data = await resp.json();
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
