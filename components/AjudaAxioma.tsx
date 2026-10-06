"use client";
// Assistente de Ajuda do Axioma — botão fixo (canto inferior esquerdo) em todas as
// telas internas. Responde "onde fica / o que faz / como faço" a partir do Manual
// de Uso (rota /api/ia/ajuda). Não vê os números da empresa.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, Send, X, BookOpen } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { obterEmpresaAtiva } from "../lib/empresaHelpers";

type Msg = { role: "user" | "assistant"; content: string; manuais?: { numero: string; nome: string }[] };

const NAVY = "#101b3d", MENTA = "#2ecc9b", MENTA_ESC = "#0f7d5c";
const TXT = {
  pt: {
    botao: "Ajuda", titulo: "Assistente de Ajuda", sub: "Pergunte onde fica uma função ou o que um botão faz",
    ola: "Olá! Sou o assistente do Axioma. Posso explicar o que cada botão desta tela faz, para onde ele leva e o passo a passo de qualquer tarefa. O que você precisa?",
    placeholder: "Ex.: como dou baixa numa conta paga?", pensando: "Procurando no manual...", abrir: "Abrir manual", erro: "Não consegui falar com o assistente agora. Tente de novo em instantes.",
    sugestoes: ["O que faz cada botão desta tela?", "Como começo a usar esta tela?", "Como desfaço algo que salvei errado?"],
  },
  en: {
    botao: "Help", titulo: "Help Assistant", sub: "Ask where a feature is or what a button does",
    ola: "Hi! I'm Axioma's assistant. I can explain what each button on this screen does, where it takes you and the step-by-step for any task. What do you need?",
    placeholder: "E.g.: how do I mark a bill as paid?", pensando: "Searching the manual...", abrir: "Open manual", erro: "I couldn't reach the assistant right now. Please try again shortly.",
    sugestoes: ["What does each button on this screen do?", "How do I start using this screen?", "How do I undo something I saved by mistake?"],
  },
  es: {
    botao: "Ayuda", titulo: "Asistente de Ayuda", sub: "Pregunte dónde está una función o qué hace un botón",
    ola: "¡Hola! Soy el asistente de Axioma. Puedo explicar qué hace cada botón de esta pantalla, a dónde lleva y el paso a paso de cualquier tarea. ¿Qué necesita?",
    placeholder: "Ej.: ¿cómo registro el pago de una cuenta?", pensando: "Buscando en el manual...", abrir: "Abrir manual", erro: "No pude hablar con el asistente ahora. Intente de nuevo en unos instantes.",
    sugestoes: ["¿Qué hace cada botón de esta pantalla?", "¿Cómo empiezo a usar esta pantalla?", "¿Cómo deshago algo que guardé por error?"],
  },
};

export default function AjudaAxioma() {
  const caminho = usePathname() ?? "";
  const { idioma } = useLanguage();
  const lang = idioma === "en" ? "en" : idioma === "es" ? "es" : "pt";
  const t = TXT[lang];
  const [aberto, setAberto] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, enviando]);

  // Frente de caixa ocupa a tela inteira: o operador não precisa do botão ali.
  if (caminho.startsWith("/pdv/venda")) return null;

  async function enviar(pergunta: string) {
    const p = pergunta.trim();
    if (!p || enviando) return;
    const historico = msgs.map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: "user", content: p }]);
    setTexto("");
    setEnviando(true);
    try {
      const empresaId = await obterEmpresaAtiva().catch(() => null);
      const res = await fetch("/api/ia/ajuda", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: p, lang, caminho, historico, empresa_id: empresaId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || typeof json?.resposta !== "string") throw new Error(String(res.status));
      setMsgs((m) => [...m, { role: "assistant", content: json.resposta, manuais: json.manuais }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: t.erro }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setAberto((a) => !a)}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
        className="fixed bottom-4 left-4 z-[64] flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-sm font-bold shadow-lg"
        style={{ background: `linear-gradient(135deg, ${MENTA_ESC}, #16a97d)`, color: "#fff", border: `1px solid ${MENTA}` }}
        aria-label={t.titulo}
      >
        {aberto ? <X size={18} /> : <HelpCircle size={18} />} {t.botao}
      </motion.button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-20 left-4 right-4 sm:right-auto sm:w-[400px] z-[64] rounded-2xl overflow-hidden flex flex-col axi-card-premium3d"
            style={{ background: NAVY, border: `1px solid rgba(46,204,155,0.45)`, boxShadow: "0 20px 50px rgba(0,0,0,0.45)", maxHeight: "min(600px, calc(100vh - 140px))" }}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: MENTA }} />
            <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-black text-white">{t.titulo}</p>
              <p className="text-xs mt-0.5" style={{ color: "#a3b1c2" }}>{t.sub}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.06)", color: "#e6edf5" }}>{t.ola}</div>
              {msgs.length === 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {t.sugestoes.map((s) => (
                    <button key={s} onClick={() => enviar(s)} className="text-xs px-2.5 py-1.5 rounded-full text-left"
                      style={{ background: "rgba(46,204,155,0.12)", color: MENTA, border: "1px solid rgba(46,204,155,0.35)" }}>{s}</button>
                  ))}
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div className="rounded-xl px-3 py-2.5 whitespace-pre-wrap leading-relaxed max-w-[92%]"
                    style={m.role === "user" ? { background: MENTA_ESC, color: "#fff" } : { background: "rgba(255,255,255,0.06)", color: "#e6edf5" }}>
                    {m.content}
                    {m.manuais && m.manuais.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {m.manuais.map((r) => (
                          <Link key={r.numero} href={`/manual?m=${r.numero}`} onClick={() => { setAberto(false); window.dispatchEvent(new CustomEvent("axioma:abrir-manual", { detail: r.numero })); }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
                            style={{ background: "#fff", color: NAVY }}>
                            <BookOpen size={12} /> {t.abrir} {r.numero} — {r.nome}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {enviando && <p className="text-xs" style={{ color: MENTA }}>{t.pensando}</p>}
              <div ref={fim} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); enviar(texto); }} className="flex gap-2 p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t.placeholder} maxLength={1500}
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={{ background: "#fff", color: NAVY }} />
              <button type="submit" disabled={enviando || !texto.trim()} className="px-3 rounded-xl disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${MENTA_ESC}, #16a97d)`, color: "#fff" }} aria-label="Enviar">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
