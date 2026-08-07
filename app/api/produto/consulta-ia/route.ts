import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// 🦅 AXIOMA AI.TECH - Camada 3 da cascata de cadastro do PDV (Groq), server-side.
// SÓ chamada quando a base própria (camada 1) e o catálogo Cosmos (camada 2)
// já falharam — nunca em paralelo, nunca preventivamente (controle de custo,
// exigência do Elias). GROQ_API_KEY só existe aqui, nunca chega ao navegador.
// Sem chave configurada, o cadastro segue 100% manual (mesmo padrão da rota
// do Cosmos). Resposta é sempre marcada como "sugestão automática" na tela —
// nunca cita o provedor/modelo por trás.
//
// Cache por EAN (produtos_ia_cache, global entre empresas — mesmo produto,
// mesmo código, não custa perguntar duas vezes): verificado ANTES de chamar a
// Groq, gravado DEPOIS de uma resposta real. Timeout curto (6s), sem retry —
// se falhar, falhou; o cadastro nunca trava esperando IA.
//
// MODELO: llama-3.1-8b-instant hoje é o mais barato/rápido hospedado pela
// Groq pra essa tarefa (extração de 3 campos, não geração longa). Groq
// aposenta/troca modelos com alguma frequência — se este endpoint começar a
// devolver 400/model_decommissioned, é só trocar o valor de MODELO abaixo,
// nada mais muda.
const MODELO = "llama-3.1-8b-instant";

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

  const chave = process.env.GROQ_API_KEY;
  if (!chave) return NextResponse.json({ status: "nao_configurado" } satisfies ConsultaIaResposta);

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
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 6000);

  let resposta: { nome?: string; marca?: string; categoria?: string } | null = null;
  try {
    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controlador.signal,
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `Você identifica produtos a partir de código de barras (EAN/GTIN) usando seu conhecimento geral. ` +
              `Responda SOMENTE um objeto JSON, sem nenhum texto fora dele, no formato exato {"nome": string|null, "marca": string|null, "categoria": string|null}, em ${nomeIdioma}. ` +
              `Se não tiver informação confiável sobre esse código, responda {"nome": null, "marca": null, "categoria": null} — nunca invente um produto. ` +
              `Nunca se identifique como uma IA, modelo de linguagem ou cite o provedor por trás — se perguntado, isso não faz parte da tarefa.`,
          },
          { role: "user", content: `Código de barras: ${ean}` },
        ],
      }),
    });
    clearTimeout(timeout);

    if (!groqResp.ok) {
      return NextResponse.json({ status: "erro", mensagem: `Sugestão automática indisponível (${groqResp.status})` } satisfies ConsultaIaResposta);
    }
    const dados = await groqResp.json();
    const conteudo: string | undefined = dados?.choices?.[0]?.message?.content;
    if (conteudo) {
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
    }
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ status: "erro", mensagem: "Falha de rede ou tempo esgotado na sugestão automática" } satisfies ConsultaIaResposta);
  }

  const encontrouAlgo = !!(resposta?.nome || resposta?.marca || resposta?.categoria);

  // Grava no cache (global) o que realmente veio da IA — sucesso ou "nada
  // encontrado" — pra nunca mais perguntar por este EAN+idioma. Falha ao
  // gravar não derruba a resposta pro usuário, só perde o cache desta vez.
  await supabaseAdmin.from("produtos_ia_cache").upsert(
    { ean, idioma, encontrado: encontrouAlgo, nome: resposta?.nome || null, marca: resposta?.marca || null, categoria: resposta?.categoria || null },
    { onConflict: "ean,idioma", ignoreDuplicates: true }
  );

  if (!encontrouAlgo) return NextResponse.json({ status: "nao_encontrado" } satisfies ConsultaIaResposta);
  return NextResponse.json({ status: "ok", ...resposta } satisfies ConsultaIaResposta);
}
