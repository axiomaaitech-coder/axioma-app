import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 🦅 AXIOMA AI.TECH - Lista de bancos brasileiros (BrasilAPI), server-side.
// Alimenta o seletor com busca do campo Banco em /empresa. Lista muda raramente
// (não sai banco novo toda semana) — cache de 24h no fetch, sem custo de rodar
// de novo a cada tela aberta.

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
  try {
    resp = await fetch("https://brasilapi.com.br/api/banks/v1", {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
  } catch {
    return NextResponse.json({ status: "indisponivel", bancos: [] });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!resp.ok) return NextResponse.json({ status: "indisponivel", bancos: [] });

  const data = await resp.json();
  const bancos = (Array.isArray(data) ? data : [])
    .filter((b: any) => b.code && b.name)
    .map((b: any) => ({ codigo: String(b.code), nome: b.name }))
    .sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  return NextResponse.json({ status: "ok", bancos });
}
