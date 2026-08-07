import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { buscarNicho } from "../../../../lib/pdvCatalogoTaxonomia";

// 🦅 AXIOMA AI.TECH - PDV Fase 2.1: classificação em LOTE (Groq), server-side.
// Uma chamada por NOTA INTEIRA, nunca uma por item — é o que torna barato.
// Dado fiscal (EAN/NCM/custo) SEMPRE vem do XML, nunca daqui — esta rota só
// organiza nome legível + sugere categoria/sub-nicho dentro da nossa própria
// taxonomia (a IA escolhe de uma lista fechada, nunca inventa categoria
// nova). Cache por EAN em produtos_ia_cache (mesma tabela da Fase 2) — item
// já visto antes nem entra na chamada. GROQ_API_KEY só existe aqui.

const MODELO = "llama-3.1-8b-instant";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ItemEntrada = { ean?: string; descricao: string };
type ResultadoItem = { descricao: string; ean?: string; nomeSugerido?: string; categoriaSugerida?: string; subNichoSugerido?: string };
type CorpoRequisicao = { itens: ItemEntrada[]; idioma?: string; nicho: string };
type LinhaCache = { nome: string | null; categoria: string | null; sub_nicho: string | null };

export async function POST(req: NextRequest) {
  const corpo = (await req.json().catch(() => null)) as CorpoRequisicao | null;
  if (!corpo || !Array.isArray(corpo.itens) || corpo.itens.length === 0 || !corpo.nicho) {
    return NextResponse.json({ status: "erro", mensagem: "Requisição inválida" }, { status: 400 });
  }
  const idioma = corpo.idioma || "pt";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { /* rota só de leitura de sessão */ } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "erro", mensagem: "Não autorizado" }, { status: 401 });

  const nichoDef = buscarNicho(corpo.nicho);
  if (!nichoDef) return NextResponse.json({ status: "erro", mensagem: "Nicho inválido" }, { status: 400 });

  const chave = process.env.GROQ_API_KEY;
  if (!chave) return NextResponse.json({ status: "nao_configurado" });

  // 1) Cache primeiro — só itens com EAN podem ser cacheados (é a chave).
  const eansUnicos = Array.from(new Set(corpo.itens.map((i) => i.ean).filter((e): e is string => !!e)));
  const cacheMap = new Map<string, LinhaCache>();
  if (eansUnicos.length > 0) {
    const { data } = await supabaseAdmin.from("produtos_ia_cache")
      .select("ean, nome, categoria, sub_nicho").eq("idioma", idioma).in("ean", eansUnicos);
    for (const linha of data || []) cacheMap.set((linha as any).ean, linha as LinhaCache);
  }

  const resultados: ResultadoItem[] = new Array(corpo.itens.length);
  const pendentes: { idx: number; descricao: string }[] = [];
  corpo.itens.forEach((item, idx) => {
    const cacheado = item.ean ? cacheMap.get(item.ean) : undefined;
    if (cacheado) {
      resultados[idx] = { descricao: item.descricao, ean: item.ean, nomeSugerido: cacheado.nome || undefined, categoriaSugerida: cacheado.categoria || undefined, subNichoSugerido: cacheado.sub_nicho || undefined };
    } else {
      resultados[idx] = { descricao: item.descricao, ean: item.ean };
      pendentes.push({ idx, descricao: item.descricao });
    }
  });

  if (pendentes.length === 0) return NextResponse.json({ status: "ok", resultados } as const);

  // 2) Opções válidas — a IA escolhe de uma lista fechada, nunca inventa.
  const opcoesTaxonomia = nichoDef.categorias.flatMap((c) =>
    c.subNichos.map((s) => `${c.label[idioma as "pt" | "en" | "es"] || c.label.pt} > ${s.label[idioma as "pt" | "en" | "es"] || s.label.pt}`)
  );
  const nomeIdioma = idioma === "en" ? "inglês" : idioma === "es" ? "espanhol" : "português";

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 20000);

  try {
    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controlador.signal,
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `Você organiza descrições cruas de nota fiscal (tipo "REFRIG COCA COLA 2L PET") em nome legível de produto, em ${nomeIdioma}. ` +
              `Para cada item, escolha a combinação categoria > sub-nicho MAIS PARECIDA desta lista fechada (nunca invente uma fora dela): ${opcoesTaxonomia.join("; ")}. ` +
              `Se nenhuma combinação fizer sentido, deixe categoria e subNicho como null — nunca force uma errada. ` +
              `Responda SOMENTE um objeto JSON no formato exato {"itens": [{"idx": number, "nome": string|null, "categoria": string|null, "subNicho": string|null}]}, um item pra cada entrada recebida, na mesma ordem. ` +
              `Nunca se identifique como uma IA, modelo de linguagem ou cite o provedor por trás — isso não faz parte da tarefa.`,
          },
          { role: "user", content: JSON.stringify(pendentes.map((p) => ({ idx: p.idx, descricao: p.descricao }))) },
        ],
      }),
    });
    clearTimeout(timeout);

    if (!groqResp.ok) {
      return NextResponse.json({ status: "erro", mensagem: `Sugestão automática indisponível (${groqResp.status})` });
    }
    const dados = await groqResp.json();
    const conteudo: string | undefined = dados?.choices?.[0]?.message?.content;
    const parseado = conteudo ? JSON.parse(conteudo) : null;
    const itensRespondidos: { idx: number; nome?: string | null; categoria?: string | null; subNicho?: string | null }[] = Array.isArray(parseado?.itens) ? parseado.itens : [];

    const linhasParaCache: Record<string, any>[] = [];
    for (const resp of itensRespondidos) {
      if (typeof resp.idx !== "number" || !resultados[resp.idx]) continue;
      const item = corpo.itens[resp.idx];
      resultados[resp.idx] = {
        descricao: item.descricao, ean: item.ean,
        nomeSugerido: resp.nome || undefined, categoriaSugerida: resp.categoria || undefined, subNichoSugerido: resp.subNicho || undefined,
      };
      if (item.ean) linhasParaCache.push({ ean: item.ean, idioma, encontrado: !!(resp.nome || resp.categoria), nome: resp.nome || null, marca: null, categoria: resp.categoria || null, sub_nicho: resp.subNicho || null });
    }
    if (linhasParaCache.length > 0) {
      await supabaseAdmin.from("produtos_ia_cache").upsert(linhasParaCache, { onConflict: "ean,idioma", ignoreDuplicates: true });
    }
  } catch {
    clearTimeout(timeout);
    // Falha na IA não pode travar a importação — itens pendentes voltam sem
    // sugestão, o dono completa nome/categoria na tela de conferência.
  }

  return NextResponse.json({ status: "ok", resultados } as const);
}
