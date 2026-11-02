"use client";
// Entrada visível da conversa por voz (Elias 2026-11-02: "em nenhuma IA está aparecendo"). Nas telas em que o
// chat mora numa aba (IA Financeira, IA Tributária), este cartão fica acima das abas: abre o chat e leva até
// o painel "Iniciar conversa ao vivo" (components/ConversaAoVivo, id="conversa-ao-vivo"). Mesmo código em
// computador e celular.
import { Mic } from "lucide-react";

const TX = {
  titulo: { pt: "Converse por voz com a Inteligência Axioma", en: "Talk by voice with Axioma Intelligence", es: "Converse por voz con la Inteligencia Axioma" },
  dica: { pt: "Fale naturalmente: ela consulta os números reais da sua empresa e responde falando.", en: "Speak naturally: it checks your company's real figures and answers out loud.", es: "Hable con naturalidad: consulta los números reales de su empresa y responde hablando." },
  botao: { pt: "Conversar por voz", en: "Talk by voice", es: "Conversar por voz" },
} as const;

export default function AtalhoConversaVoz({ lang, claro, abrir }: { lang: "pt" | "en" | "es"; claro: boolean; abrir: () => void }) {
  function ir() {
    abrir();
    setTimeout(() => document.getElementById("conversa-ao-vivo")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  }
  return (
    <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 axi-card-premium3d axi-card-faixa"
      style={{ background: claro ? "#f6f7c4" : "linear-gradient(180deg, rgba(16,32,58,0.92), rgba(10,22,40,0.92))", border: claro ? "1px solid rgba(16,27,61,0.12)" : "1px solid rgba(46,204,155,0.25)" }}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#101b3d", border: "1px solid #2ecc9b" }}>
          <Mic size={18} color="#2ecc9b" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: claro ? "#101b3d" : "#ffffff" }}>{TX.titulo[lang]}</p>
          <p className="text-xs" style={{ color: claro ? "#374151" : "#a3b1c2" }}>{TX.dica[lang]}</p>
        </div>
      </div>
      <button type="button" onClick={ir} className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #0a4f3b, #0f7d5c)", border: "1px solid #2ecc9b" }}>
        <Mic size={16} aria-hidden /> {TX.botao[lang]}
      </button>
    </div>
  );
}
