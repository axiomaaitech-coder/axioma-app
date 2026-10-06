import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { tarefaDeRotina } from "@/lib/ia/motor";

// 🦅 AXIOMA AI.TECH - Camada 3 da cascata de cadastro do PDV, server-side.
// SÓ chamada quando a base própria (camada 1) e o catálogo Cosmos (camada 2)
// já falharam — nunca em paralelo, nunca preventivamente (controle de custo,
// exigência do Elias). Tarefa de rotina → OpenAI pelo motor de IA (decisão do
// Elias 2026-09-28: Groq saiu; modelo de rotina definido só em lib/ia/motor.ts).
// Sem OPENAI_API_KEY, o cadastro segue 100% manual. Resposta é sempre marcada
// como "sugestão automática" na tela — nunca cita o provedor/modelo por trás.
//
// Cache por EAN (produtos_ia_cache, global entre empresas — mesmo produto,
// mesmo código, não custa perguntar duas vezes): verificado ANTES de chamar a
// IA, gravado DEPOIS de uma resposta real. Timeout curto, sem retry — se
// falhar, falhou; o cadastro nunca trava esperando IA.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type LinhaCache = { encontrado: boolean; nome: string | null; marca: string | null; categoria: string | null };

export type ConsultaIaResposta =
  | { status: "nao_configurado" }
  | { status: "nao_encontrado" }
  | { status: "erro"; mensagem?: string }
  | { status: "ok"; nome?: string; marca?: string; categoria?: string };

export async function GET(req: NextRequest) {
  const ean = req.nextUrl.searchParams.get("ean")?.trim();
  const idioma = (req.nextUrl.searchParams.get("idioma") || "pt").trim();
  if (!ean) return NextResponse.json({ status: "erro", mensagem: "EAN não informado" } satisfies ConsultaIaResposta, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { /* rota só de leitura, não precisa renovar sessão */ } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "erro", mensagem: "Não autorizado" } satisfies ConsultaIaResposta, { status: 401 });

  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ status: "nao_configurado" } satisfies ConsultaIaResposta);

  // Cache primeiro — nunca pergunta duas vezes pro mesmo EAN+idioma.
  const { data: cacheado } = await supabaseAdmin
    .from("produtos_ia_cache")
    .select("encontrado, nome, marca, categoria")
    .eq("ean", ean).eq("idioma", idioma).maybeSingle<LinhaCache>();

  if (cacheado) {
    if (!cacheado.encontrado) return NextResponse.json({ status: "nao_encontrado" } satisfies ConsultaIaResposta);
    return NextResponse.json({
      status: "ok",
      nome: cacheado.nome || undefined, marca: cacheado.marca || undefined, categoria: cacheado.categoria || undefined,
    } satisfies ConsultaIaResposta);
  }

  const nomeIdioma = idioma === "en" ? "inglês" : idioma === "es" ? "espanhol" : "português";
  // Rotina → OpenAI pelo motor de IA (lib/ia/motor.ts, modelo de rotina único). Timeout
  // curto: o cadastro nunca trava esperando IA. Falha = null (rede, tempo, formato).
  const conteudo = await tarefaDeRotina(
    `Você identifica produtos a partir de código de barras (EAN/GTIN) usando seu conhecimento geral. ` +
    `Responda SOMENTE um objeto JSON, sem nenhum texto fora dele, no formato exato {"nome": string|null, "marca": string|null, "categoria": string|null}, em ${nomeIdioma}. ` +
    `Se não tiver informação confiável sobre esse código, responda {"nome": null, "marca": null, "categoria": null} — nunca invente um produto.`,
    `Código de barras: ${ean}`,
    { maxTokens: 1000, timeoutMs: 8000 },
  );
  if (conteudo === null) {
    return NextResponse.json({ status: "erro", mensagem: "Sugestão automática indisponível no momento" } satisfies ConsultaIaResposta);
  }
  let resposta: { nome?: string; marca?: string; categoria?: string } | null = null;
  try {
    const parseado = JSON.parse(conteudo);
    resposta = {
      nome: typeof parseado.nome === "string" && parseado.nome.trim() ? parseado.nome.trim() : undefined,
      marca: typeof parseado.marca === "string" && parseado.marca.trim() ? parseado.marca.trim() : undefined,
      categoria: typeof parseado.categoria === "string" && parseado.categoria.trim() ? parseado.categoria.trim() : undefined,
    };
  } catch {
    resposta = null; // resposta fora do formato — trata como "não achou", nunca inventa
  }

  const encontrouAlgo = !!(resposta?.nome || resposta?.marca || resposta?.categoria);

  // Grava no cache (global) o que realmente veio da IA — sucesso ou "nada
  // encontrado" — pra nunca mais perguntar por este EAN+idioma. Falha ao
  // gravar não derruba a resposta pro usuário, só perde o cache desta vez.
  // varredura:ok — ignoreDuplicates devolve 0 linhas quando o EAN já está no cache (normal)
  const { error: erroCache } = await supabaseAdmin.from("produtos_ia_cache").upsert(
    { ean, idioma, encontrado: encontrouAlgo, nome: resposta?.nome || null, marca: resposta?.marca || null, categoria: resposta?.categoria || null },
    { onConflict: "ean,idioma", ignoreDuplicates: true }
  );
  if (erroCache) Sentry.captureException(new Error(`Falha ao upsert em produtos_ia_cache: ${erroCache.message}`), { extra: { rota: "produto/consulta-ia", ean } });

  if (!encontrouAlgo) return NextResponse.json({ status: "nao_encontrado" } satisfies ConsultaIaResposta);
  return NextResponse.json({ status: "ok", ...resposta } satisfies ConsultaIaResposta);
}
