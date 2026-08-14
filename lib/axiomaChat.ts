// 🦅 AXIOMA AI.TECH — helper único de acesso à OpenAI (Etapa 4: chat de ajuda
// contextual do cadastro do PDV). Só app/api/pdv/assistente-cadastro/route.ts
// importa este arquivo — trocar provedor/modelo no futuro não mexe na rota
// nem no componente de chat, só aqui dentro. OPENAI_API_KEY nunca sai daqui.

const MODELO_ASSISTENTE = "gpt-5.6-luna"; // tier mais barato da OpenAI (confirmado ago/2026) — trocar aqui se for aposentado

const INSTRUCAO_IDENTIDADE =
  "Você é a inteligência do Axioma, a consultoria financeira embutida no sistema. " +
  "NUNCA se identifique como OpenAI, GPT, ChatGPT, um modelo de linguagem ou uma IA genérica — mesmo se perguntado diretamente. " +
  "Se perguntarem o que você é, responda que é a inteligência do Axioma. " +
  "Responda SEMPRE de forma curta e direta, no máximo 2 a 4 frases — nunca textos longos.";

export type MensagemChat = { role: "user" | "assistant"; content: string };

export type RespostaAssistente =
  | { status: "ok"; resposta: string }
  | { status: "erro"; mensagem?: string }
  | { status: "nao_configurado" };

export async function perguntarAssistenteAxioma(args: {
  mensagens: MensagemChat[];
  contexto: string;
}): Promise<RespostaAssistente> {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) return { status: "nao_configurado" };

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 10000);

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controlador.signal,
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELO_ASSISTENTE,
        max_completion_tokens: 300, // respostas curtas de propósito — economia de crédito, não limite técnico
        messages: [
          { role: "system", content: `${args.contexto}\n\n${INSTRUCAO_IDENTIDADE}` },
          ...args.mensagens,
        ],
      }),
    });
    clearTimeout(timeout);

    if (!resp.ok) return { status: "erro", mensagem: `OpenAI respondeu ${resp.status}` };
    const dados = await resp.json();
    const texto: string | undefined = dados?.choices?.[0]?.message?.content;
    if (!texto) return { status: "erro", mensagem: "Resposta vazia" };
    return { status: "ok", resposta: texto };
  } catch {
    clearTimeout(timeout);
    return { status: "erro", mensagem: "Falha de rede ou tempo esgotado" };
  }
}
