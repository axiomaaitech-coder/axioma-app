import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { perguntarAssistenteAxioma, type MensagemChat, type RespostaAssistente } from "../../../../lib/axiomaChat";

// 🦅 AXIOMA AI.TECH — chat de ajuda contextual do cadastro do PDV (Etapa 4).
// O system prompt é montado AQUI a partir de campos estruturados (nicho/
// categoria/sub-nicho/tipo), nunca a partir de texto livre vindo do client —
// evita prompt injection via um campo "contexto" forjado. OPENAI_API_KEY só
// existe dentro de lib/axiomaChat.ts, nunca chega ao navegador.

function montarContexto(args: { nicho: string; categoria: string | null; subNicho: string | null; tipo: string; idioma: string }): string {
  const partes = [args.nicho, args.categoria, args.subNicho].filter(Boolean).join(" › ");
  const nomeIdioma = args.idioma === "en" ? "inglês" : args.idioma === "es" ? "espanhol" : "português";
  return (
    `O lojista está cadastrando um(a) ${args.tipo} em ${partes}. ` +
    `Ajude com dúvida de preenchimento, significado de campo, margem típica do ramo e boas práticas de cadastro. ` +
    `NUNCA invente dados do produto específico do lojista — você não tem acesso a ele. Responda em ${nomeIdioma}.`
  );
}

// Etapa 5 — lista de campos da tela atual (curada em components/PdvCadastroProduto.tsx
// a partir do próprio form + subNichoSel.campos, nunca de texto livre). Só
// label/tipo/preenchido chegam aqui; valor só existe pra Nome e Categoria
// (ver comentário na montagem, do lado do client).
type CampoContexto = { label: string; tipo?: string; preenchido: boolean; valor?: string };

function sanitizarCampos(bruto: unknown): CampoContexto[] {
  if (!Array.isArray(bruto)) return [];
  return bruto
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .slice(0, 40)
    .map((c) => ({
      label: String(c.label || "").slice(0, 60),
      tipo: c.tipo ? String(c.tipo).slice(0, 20) : undefined,
      preenchido: !!c.preenchido,
      valor: c.valor ? String(c.valor).slice(0, 80) : undefined,
    }))
    .filter((c) => c.label);
}

function montarContextoCampos(campos: CampoContexto[]): string {
  if (!campos.length) return "";
  const linhas = campos
    .map((c) => {
      const tipo = c.tipo ? ` (${c.tipo})` : "";
      const estado = c.valor ? `preenchido com "${c.valor}"` : c.preenchido ? "preenchido" : "VAZIO";
      return `- ${c.label}${tipo}: ${estado}`;
    })
    .join("\n");
  return (
    `\n\nCampos do formulário desta tela:\n${linhas}\n\n` +
    `Use essa lista pra guiar o lojista campo a campo, priorizando os campos VAZIOS (o que falta preencher) e explicando o significado de cada campo quando for útil. ` +
    `NUNCA peça print ou captura de tela — você já tem a lista completa de campos da tela acima.`
  );
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { /* rota só de leitura, não precisa renovar sessão */ } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "erro", mensagem: "Não autorizado" } satisfies RespostaAssistente, { status: 401 });

  const corpo = await req.json().catch(() => null);
  const mensagem: string | undefined = corpo?.mensagem?.trim();
  if (!mensagem) return NextResponse.json({ status: "erro", mensagem: "Mensagem não informada" } satisfies RespostaAssistente, { status: 400 });

  const historico: MensagemChat[] = Array.isArray(corpo?.historico)
    ? corpo.historico.filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
    : [];

  const contexto =
    montarContexto({
      nicho: String(corpo?.nicho || "").slice(0, 80),
      categoria: corpo?.categoria ? String(corpo.categoria).slice(0, 80) : null,
      subNicho: corpo?.subNicho ? String(corpo.subNicho).slice(0, 80) : null,
      tipo: corpo?.tipo === "servico" ? "serviço" : "produto",
      idioma: ["pt", "en", "es"].includes(corpo?.idioma) ? corpo.idioma : "pt",
    }) + montarContextoCampos(sanitizarCampos(corpo?.campos));

  const resultado = await perguntarAssistenteAxioma({
    mensagens: [...historico, { role: "user", content: mensagem }],
    contexto,
  });
  return NextResponse.json(resultado);
}
