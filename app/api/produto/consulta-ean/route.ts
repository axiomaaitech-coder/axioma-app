import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 🦅 AXIOMA AI.TECH - Consulta de EAN no catálogo Cosmos (Bluesoft), server-side.
// O COSMOS_API_TOKEN só existe aqui — nunca chega ao navegador. Enriquecimento
// opcional: sem token configurado, o app segue 100% funcional no cadastro manual.

type RespostaCosmos = {
  description?: string;
  brand?: { name?: string };
  gpc?: { description?: string };
  ncm?: { code?: string };
  net_weight?: number;
  gross_weight?: number;
  height?: number;
  width?: number;
  length?: number;
  thumbnail?: string;
  avg_price?: number;
  tax?: Record<string, number>;
  tributos?: Record<string, number>;
};

export async function GET(req: NextRequest) {
  const ean = req.nextUrl.searchParams.get("ean")?.trim();
  if (!ean) return NextResponse.json({ status: "erro", mensagem: "EAN não informado" }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { /* rota só de leitura, não precisa renovar sessão */ } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "erro", mensagem: "Não autorizado" }, { status: 401 });

  // Enriquecimento opcional — sem token, o cadastro segue 100% manual.
  // TODO: assim que o COSMOS_API_TOKEN estiver definido em produção (painel
  // da Vercel/ambiente), este endpoint liga sozinho, sem precisar de deploy novo.
  const token = process.env.COSMOS_API_TOKEN;
  if (!token) return NextResponse.json({ status: "nao_configurado" });

  let cosmosResp: Response;
  try {
    cosmosResp = await fetch(`https://cosmos.bluesoft.com.br/api/gtins/${encodeURIComponent(ean)}.json`, {
      headers: {
        "X-Cosmos-Token": token,
        "User-Agent": "Cosmos-API-Request",
        "Content-Type": "application/json",
      },
    });
  } catch {
    return NextResponse.json({ status: "erro", mensagem: "Falha de rede ao consultar o catálogo" });
  }

  if (cosmosResp.status === 404) return NextResponse.json({ status: "nao_encontrado" });
  if (cosmosResp.status === 429) return NextResponse.json({ status: "erro", mensagem: "Limite de consultas do catálogo atingido — tente novamente mais tarde" });
  if (!cosmosResp.ok) return NextResponse.json({ status: "erro", mensagem: `Catálogo respondeu com erro (${cosmosResp.status})` });

  const dados: RespostaCosmos = await cosmosResp.json();

  // Baixa a miniatura aqui no servidor (evita CORS no navegador e nunca guarda
  // link externo no produto — o front sobe o arquivo pro bucket produto-imagens
  // pelo mesmo caminho de quando o usuário anexa uma foto manualmente).
  let imagemBase64: string | undefined;
  if (dados.thumbnail) {
    try {
      const imgResp = await fetch(dados.thumbnail);
      if (imgResp.ok) {
        const buffer = Buffer.from(await imgResp.arrayBuffer());
        const contentType = imgResp.headers.get("content-type") || "image/jpeg";
        imagemBase64 = `data:${contentType};base64,${buffer.toString("base64")}`;
      }
    } catch {
      // imagem é enriquecimento, não pode travar o resto do preenchimento
    }
  }

  // Mapeamento best-effort dos tributos: schema exato de `tax`/`tributos` da
  // Cosmos não foi validado contra a API real (sem token disponível aqui pra
  // testar) — os nomes de chave abaixo são os mais comuns nessa API; ajuste
  // fino pode ser necessário no primeiro teste com token e EAN reais.
  const tributos = dados.tax || dados.tributos || {};

  return NextResponse.json({
    status: "ok",
    nome: dados.description || undefined,
    marca: dados.brand?.name || undefined,
    categoria: dados.gpc?.description || undefined,
    ncm: dados.ncm?.code || undefined,
    peso: typeof dados.net_weight === "number" ? dados.net_weight : undefined,
    altura: typeof dados.height === "number" ? dados.height : undefined,
    largura: typeof dados.width === "number" ? dados.width : undefined,
    comprimento: typeof dados.length === "number" ? dados.length : undefined,
    ipi: typeof tributos.ipi === "number" ? tributos.ipi : undefined,
    icms: typeof tributos.icms === "number" ? tributos.icms : undefined,
    pis: typeof tributos.pis === "number" ? tributos.pis : undefined,
    cofins: typeof tributos.cofins === "number" ? tributos.cofins : undefined,
    // Preço médio de mercado da Cosmos — só referência (preco_sugerido), nunca
    // grava direto em preco_venda: é média nacional, não o preço que ESTA loja
    // pratica. Campo novo, aditivo — o cadastro do Estoque não lê esta chave,
    // segue exatamente como antes.
    precoSugerido: typeof dados.avg_price === "number" ? dados.avg_price : undefined,
    imagemBase64,
  });
}
