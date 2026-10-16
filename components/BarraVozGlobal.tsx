"use client";
// Barra fixa da voz em TODAS as telas internas: aparece enquanto há conversa ao vivo aberta ou uma
// resposta sendo lida (botão Ouvir). Mostra que o microfone está aberto, o que a IA está fazendo, a
// última fala, "Voltar à conversa" (quando a pessoa está em outra tela) e Encerrar/Parar.
// Assim dá para conferir os números em Custos, Contas etc. enquanto a IA fala (pedido do CEO, 2026-10-16).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Loader2, PhoneOff, Square, Volume2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useThemeAxioma } from "../lib/ThemeContext";
import { assinarFala, estadoFala, pararFala } from "../lib/voz/reprodutor";
import { assinarConversaGlobal, encerrarConversaGlobal, estadoConversaGlobal, estadoConversaInicial } from "../lib/voz/tempoReal/sessaoGlobal";

type L = "pt" | "en" | "es";
const TX: Record<string, Record<L, string>> = {
  conectando: { pt: "Conectando…", en: "Connecting…", es: "Conectando…" },
  ouvindo: { pt: "Microfone aberto — pode falar", en: "Microphone on — go ahead", es: "Micrófono abierto — puede hablar" },
  consultando: { pt: "Consultando os dados da empresa…", en: "Checking company data…", es: "Consultando los datos de la empresa…" },
  falando: { pt: "Falando — fale por cima para interromper", en: "Speaking — talk over to interrupt", es: "Hablando — hable encima para interrumpir" },
  lendo: { pt: "Lendo a resposta", en: "Reading the answer", es: "Leyendo la respuesta" },
  voltar: { pt: "Voltar à conversa", en: "Back to the conversation", es: "Volver a la conversación" },
  encerrar: { pt: "Encerrar", en: "End", es: "Terminar" },
  parar: { pt: "Parar", en: "Stop", es: "Detener" },
  "nexus": { pt: "José", en: "José", es: "José" },
  "ia-financeira": { pt: "Inteligência Axioma — Financeira", en: "Axioma Intelligence — Finance", es: "Inteligencia Axioma — Financiera" },
  "ia-tributaria": { pt: "Inteligência Axioma — Tributária", en: "Axioma Intelligence — Tax", es: "Inteligencia Axioma — Tributaria" },
  "mei-ia-advisor": { pt: "Inteligência Axioma — MEI", en: "Axioma Intelligence — MEI", es: "Inteligencia Axioma — MEI" },
  "contas-pagar": { pt: "Inteligência Axioma — Contas a Pagar", en: "Axioma Intelligence — Payables", es: "Inteligencia Axioma — Cuentas por Pagar" },
  "importar-documentos": { pt: "Inteligência Axioma — Importar", en: "Axioma Intelligence — Import", es: "Inteligencia Axioma — Importar" },
};
const PARADO = { chave: "", estado: "parado" as const };

export default function BarraVozGlobal() {
  const { idioma } = useLanguage();
  const lang = (["pt", "en", "es"].includes(String(idioma)) ? idioma : "pt") as L;
  const { tema } = useThemeAxioma();
  const claro = tema === "xms";
  const pathname = usePathname();
  const g = useSyncExternalStore(assinarConversaGlobal, estadoConversaGlobal, estadoConversaInicial);
  const f = useSyncExternalStore(assinarFala, estadoFala, () => PARADO);
  const t = (k: string) => TX[k]?.[lang] ?? k;

  const lendo = !g.ativa && f.estado !== "parado";
  if (!g.ativa && !lendo) return null;

  const cor = claro ? "#101b3d" : "#e2ecf7";
  const ocupado = g.estado === "conectando" || g.estado === "consultando" || f.estado === "carregando";
  const ultima = g.ultimaFala?.texto ?? "";
  return (
    <div role="region" aria-label={g.ativa ? t(g.tela ?? "nexus") : t("lendo")}
      className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-xl rounded-2xl px-4 py-3 shadow-2xl axi-card-premium3d axi-card-faixa"
      style={{ background: claro ? "#ffffff" : "#0a1628", border: "1px solid #2ecc9b" }}>
      <div className="flex items-center gap-3">
        {ocupado ? <Loader2 size={16} className="animate-spin shrink-0" style={{ color: "#0f7a5a" }} aria-hidden />
          : g.ativa ? <span className="inline-block w-3 h-3 rounded-full animate-pulse shrink-0" style={{ background: "#e5484d" }} aria-hidden />
          : <Volume2 size={16} className="shrink-0" style={{ color: claro ? "#0f7a5a" : "#34d399" }} aria-hidden />}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold truncate" style={{ color: cor }}>
            {g.ativa ? `${t(g.tela ?? "nexus")} · ${t(g.estado ?? "conectando")}` : t("lendo")}
          </p>
          {g.ativa && ultima && <p className="text-[11px] truncate" style={{ color: cor, opacity: 0.85 }}>{ultima}</p>}
        </div>
        {g.ativa && g.caminho && pathname !== g.caminho && (
          <Link href={g.caminho} className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: "#0f7a5a" }}>{t("voltar")}</Link>
        )}
        <button type="button" onClick={g.ativa ? encerrarConversaGlobal : pararFala}
          className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: "#101b3d", border: "1px solid #2ecc9b" }}>
          {g.ativa ? <PhoneOff size={13} aria-hidden /> : <Square size={12} aria-hidden />}
          {g.ativa ? t("encerrar") : t("parar")}
        </button>
      </div>
    </div>
  );
}
