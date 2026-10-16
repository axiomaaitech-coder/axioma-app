"use client";
// Chat da Inteligência Axioma para telas operacionais (Contas a Pagar, Importar Documentos): conversa com
// histórico, ditado, Ouvir, "Quer que eu lembre?"/"Está errado?", conversa ao vivo e Memória da IA — a mesma
// experiência das IAs Financeira/Tributária/MEI, num componente só (reuso genérico, sem duplicar telas).
// O contexto da tela (números, nota aberta) vem de `contexto()`; o motor confere tudo no servidor.
import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";
import BotaoVoz from "./BotaoVoz";
import OuvirResposta from "./OuvirResposta";
import AcoesMemoria from "./AcoesMemoria";
import ConversaAoVivo from "./ConversaAoVivo";
import PainelMemoriaIA from "./PainelMemoriaIA";
import { AcoesRelatorio, type PedidoTela } from "./RelatorioCFO";
import { perguntarAoAxioma } from "../lib/ia/cliente";
import { juntarTexto } from "../lib/voz/gravador";
import type { SugestaoMemoria } from "../lib/ia/memoria";

type L = "pt" | "en" | "es";
type Msg = { role: "user" | "assistant"; texto: string; assinatura?: string; ressalva?: boolean; sugestaoMemoria?: SugestaoMemoria | null; relatorio?: PedidoTela | null };
const MAX_HISTORICO = 8;
const TX: Record<string, Record<L, string>> = {
  pensando: { pt: "Pensando…", en: "Thinking…", es: "Pensando…" },
  enviar: { pt: "Enviar", en: "Send", es: "Enviar" },
  falhaRegra: { pt: "Respondendo com base em regras — a inteligência do Axioma está indisponível no momento.", en: "Answering based on rules — Axioma's intelligence is unavailable right now.", es: "Respondiendo con base en reglas — la inteligencia de Axioma no está disponible en este momento." },
  falha: { pt: "Não foi possível responder agora. Tente de novo em instantes.", en: "Could not answer right now. Try again in a moment.", es: "No fue posible responder ahora. Intente de nuevo en unos instantes." },
  formato: { pt: "FORMATO: resposta para ser FALADA numa conversa ao vivo — no máximo 4 frases curtas, sem listas, valores e período claros; mantenha os rótulos Fato/Estimativa/Cenário e os avisos.", en: "FORMAT: answer to be SPOKEN in a live conversation — at most 4 short sentences, no lists, clear amounts and period; keep the Fact/Estimate/Scenario labels and the notes.", es: "FORMATO: respuesta para ser HABLADA en una conversación en vivo — máximo 4 frases cortas, sin listas, valores y período claros; mantenga las etiquetas Hecho/Estimación/Escenario y los avisos." },
};

export default function ChatInteligencia({ tela, empresaId, lang, claro, titulo, placeholder, sugestoes, contexto, porRegra }: {
  tela: "contas-pagar" | "importar-documentos" | "relatorios";
  empresaId: string | null | undefined;
  lang: L;
  claro: boolean;
  titulo: string;
  placeholder: string;
  sugestoes: string[];
  contexto: () => string; // números/nota desta tela (sempre o estado mais novo)
  porRegra?: (pergunta: string) => string; // resposta por regras quando a IA está fora (Contas a Pagar já tinha)
}) {
  const [mensagens, setMensagens] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const pedido = useRef<AbortController | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const t = (k: string) => TX[k][lang];
  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [mensagens, carregando]);
  useEffect(() => () => { pedido.current?.abort(); }, []);

  async function enviar(pergunta: string) {
    const p = pergunta.trim();
    if (!p || !empresaId) return;
    pedido.current?.abort(); // pergunta nova durante a análise = correção (a anterior é abandonada)
    const ctrl = new AbortController(); pedido.current = ctrl;
    const historico = mensagens.slice(-MAX_HISTORICO).map((m) => ({ role: m.role, content: m.texto }));
    setMensagens((m) => [...m, { role: "user", texto: p }]);
    setTexto(""); setCarregando(true);
    const ia = await perguntarAoAxioma({ pergunta: p, empresaId, tela, lang, historico, contextoTela: contexto(), signal: ctrl.signal });
    if (ctrl.signal.aborted) return;
    const resposta = ia?.resposta ?? (porRegra ? `${porRegra(p)}\n\n(${t("falhaRegra")})` : t("falha"));
    setMensagens((m) => [...m, { role: "assistant", texto: resposta, assinatura: ia?.assinatura, ressalva: !!ia?.ressalva, sugestaoMemoria: ia?.sugestaoMemoria ?? null, relatorio: ia?.relatorio ?? null }]);
    setCarregando(false); pedido.current = null;
  }

  async function consultarAoVivo(pergunta: string): Promise<string> {
    const historico = mensagens.slice(-MAX_HISTORICO).map((m) => ({ role: m.role, content: m.texto }));
    const ia = await perguntarAoAxioma({ pergunta, empresaId, tela, lang, historico, contextoTela: `${t("formato")}\n\n${contexto()}` });
    return ia?.resposta ?? t("falha");
  }

  const cor = claro ? "#101b3d" : "#e2ecf7";
  const bolhaIA = claro ? { background: "rgba(245,240,225,0.7)", border: "1px solid rgba(16,27,61,0.12)", color: "#101b3d" } : { background: "rgba(10,22,40,0.8)", border: "1px solid rgba(46,204,155,0.15)", color: "#e2ecf7" };
  const bolhaVoce = claro ? { background: "#101b3d", color: "#ffffff" } : { background: "rgba(46,204,155,0.15)", border: "1px solid rgba(46,204,155,0.3)", color: "#e2ecf7" };
  return (
    <div>
      <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: cor }}>
        <MessageCircleQuestion size={14} aria-hidden /> {titulo}
      </p>
      {mensagens.length > 0 && (
        <div className="max-h-96 overflow-y-auto space-y-2 mb-2 pr-1">
          {mensagens.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[90%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap" style={m.role === "user" ? bolhaVoce : bolhaIA}>
                {m.texto}
                {m.role === "assistant" && (
                  <div>
                    <OuvirResposta texto={m.texto} lang={lang} assinatura={m.assinatura} ressalva={m.ressalva} empresaId={empresaId} claro={claro} />
                    {m.assinatura && <AcoesMemoria empresaId={empresaId} area="financeira" sugestao={m.sugestaoMemoria} resposta={m.texto} lang={lang} claro={claro} />}
                    <AcoesRelatorio tela={tela} pergunta={mensagens[i - 1]?.role === "user" ? mensagens[i - 1].texto : undefined} resposta={m.texto} pedido={m.relatorio} ressalva={m.ressalva} empresaId={empresaId} lang={lang} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {carregando && <div className="px-3 py-2 rounded-xl text-sm inline-block" style={bolhaIA}>{t("pensando")}</div>}
          <div ref={fim} />
        </div>
      )}
      <div className="flex gap-2 mb-2">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void enviar(texto); }}
          placeholder={placeholder} aria-label={titulo}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm" style={{ background: claro ? "#ffffff" : "rgba(10,22,40,0.95)", border: claro ? "1px solid rgba(16,27,61,0.18)" : "1px solid rgba(46,204,155,0.2)", color: cor }} />
        <BotaoVoz lang={lang} tela={tela} empresaId={empresaId} claro={claro} onTexto={(x) => setTexto((a) => juntarTexto(a, x))} />
        <button type="button" onClick={() => void enviar(texto)} disabled={!texto.trim()} aria-label={t("enviar")}
          className="px-3 py-2.5 rounded-xl flex items-center justify-center text-white" style={{ background: "#0f7a5a", border: "1px solid #2ecc9b" }}>
          <Send size={16} aria-hidden />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {sugestoes.map((s) => (
          <button key={s} type="button" onClick={() => void enviar(s)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white" style={{ background: "#101b3d", border: "1px solid rgba(46,204,155,0.35)" }}>{s}</button>
        ))}
      </div>
      <ConversaAoVivo empresaId={empresaId} lang={lang} claro={claro} tela={tela} consultar={consultarAoVivo}
        aoFalar={(quem, txt) => setMensagens((m) => [...m, { role: quem === "voce" ? "user" : "assistant", texto: txt }])} />
      <PainelMemoriaIA empresaId={empresaId} area="financeira" lang={lang} claro={claro} />
    </div>
  );
}
