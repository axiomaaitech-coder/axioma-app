import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 🦅 AXIOMA AI.TECH - Consulta de CNPJ na BrasilAPI, server-side.
// Movida do navegador pro servidor: a CSP bloqueia fetch direto a
// brasilapi.com.br do browser (connect-src restritivo, decisão consciente —
// não liberamos a CSP, movemos a chamada). Mesmo padrão de
// app/api/produto/consulta-ean/route.ts.

function limparCNPJ(cnpj: string): string {
  return (cnpj || "").replace(/\D/g, "");
}

function validarCNPJ(cnpj: string): boolean {
  const c = limparCNPJ(cnpj);
  if (c.length !== 14) return false;
  if (/^(\d)\1+$/.test(c)) return false;

  let soma = 0;
  let pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) soma += parseInt(c[i]) * pesos[i];
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (d1 !== parseInt(c[12])) return false;

  soma = 0;
  pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) soma += parseInt(c[i]) * pesos[i];
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  return d2 === parseInt(c[13]);
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { /* rota só de leitura */ } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "erro" }, { status: 401 });

  const cnpj = limparCNPJ(req.nextUrl.searchParams.get("cnpj") || "");
  if (!validarCNPJ(cnpj)) return NextResponse.json({ status: "invalido" });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  let resp: Response;
  try {
    resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { signal: controller.signal });
  } catch {
    return NextResponse.json({ status: "indisponivel" });
  } finally {
    clearTimeout(timeoutId);
  }

  if (resp.status === 404) return NextResponse.json({ status: "nao_encontrado" });
  if (!resp.ok) return NextResponse.json({ status: "indisponivel" });

  const data = await resp.json();

  let regime = "";
  if (data.opcao_pelo_mei) regime = "mei";
  else if (data.opcao_pelo_simples) regime = "simples";

  return NextResponse.json({
    status: "ok",
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia || null,
    cnpj: data.cnpj,
    cnae_principal: data.cnae_fiscal ? String(data.cnae_fiscal) : null,
    cnae_descricao: data.cnae_fiscal_descricao,
    cnaes_secundarios: data.cnaes_secundarios || [],
    natureza_juridica: data.natureza_juridica,
    porte: data.porte,
    data_abertura: data.data_inicio_atividade,
    capital_social: data.capital_social ? Number(data.capital_social) : 0,
    situacao_cadastral: (data.descricao_situacao_cadastral || data.situacao_cadastral || "").toLowerCase(),
    opcao_simples: data.opcao_pelo_simples || false,
    opcao_mei: data.opcao_pelo_mei || false,
    regime_sugerido: regime || null,
    cep: data.cep ? String(data.cep) : null,
    logradouro: data.logradouro || data.descricao_tipo_de_logradouro
      ? `${data.descricao_tipo_de_logradouro || ""} ${data.logradouro || ""}`.trim()
      : null,
    numero: data.numero ? String(data.numero) : null,
    complemento: data.complemento,
    bairro: data.bairro,
    cidade: data.municipio,
    uf: data.uf,
    telefone_principal: data.ddd_telefone_1 ? String(data.ddd_telefone_1) : null,
    email_principal: data.email,
    socios: data.qsa || [],
  });
}
