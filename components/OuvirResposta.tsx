"use client";
// AXIOMA VOICE INTELLIGENCE — Fase 2/B: botão "Ouvir / Parar" embaixo de cada resposta da IA.
// Toda a fala passa pelo reprodutor único da tela (lib/voz/reprodutor.ts): uma resposta por vez, Parar
// corta de verdade, voz do servidor só com resposta assinada pelo motor e voz do aparelho como reserva.
// Só toca quando a pessoa toca (ou no modo conversa, que ela ligou); nunca abre o microfone sozinho.
import { useEffect, useState, useSyncExternalStore } from "react";
import { Loader2, Square, Volume2 } from "lucide-react";
import { obterEmpresaAtiva } from "../lib/empresaHelpers";
import { useThemeAxioma } from "../lib/ThemeContext";
import { assinarFala, estadoFala, falar, pararFala, situacaoVoz } from "../lib/voz/reprodutor";
import { assinarConversaGlobal, estadoConversaGlobal, estadoConversaInicial } from "../lib/voz/tempoReal/sessaoGlobal";
import type { IdiomaFala } from "../lib/voz/textoFala";

const TX: Record<string, Record<IdiomaFala, string>> = {
  ouvir: { pt: "Ouvir", en: "Listen", es: "Escuchar" },
  parar: { pt: "Parar", en: "Stop", es: "Detener" },
  preparando: { pt: "Preparando…", en: "Preparing…", es: "Preparando…" },
  dica: { pt: "Ouvir esta resposta em voz alta", en: "Listen to this answer out loud", es: "Escuchar esta respuesta en voz alta" },
  semVoz: { pt: "A voz do José está indisponível agora. Tente de novo em instantes.", en: "José's voice is unavailable right now. Try again in a moment.", es: "La voz de José no está disponible ahora. Intente de nuevo en unos instantes." },
};
const PARADO = { chave: "", estado: "parado" as const };

export default function OuvirResposta({ texto, lang, assinatura, ressalva = false, empresaId, claro }: {
  texto: string;
  lang: IdiomaFala;
  assinatura?: string | null;
  ressalva?: boolean;
  empresaId?: string | null;
  claro?: boolean;
}) {
  const { tema } = useThemeAxioma();
  const temaClaro = claro ?? tema === "xms";
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [ativa, setAtiva] = useState(false);
  const [temVozJose, setTemVozJose] = useState(false);
  const [aviso, setAviso] = useState("");
  const atual = useSyncExternalStore(assinarFala, estadoFala, () => PARADO);
  const aoVivo = useSyncExternalStore(assinarConversaGlobal, estadoConversaGlobal, estadoConversaInicial).ativa;
  const t = (k: string) => TX[k][lang];

  useEffect(() => {
    let vivo = true;
    (async () => {
      const id = empresaId ?? (await obterEmpresaAtiva().catch(() => null));
      if (!id) return;
      const s = await situacaoVoz(id);
      if (vivo) { setEmpresa(id); setAtiva(s.ativa); setTemVozJose(!!s.fornecedor); }
    })();
    return () => { vivo = false; };
  }, [empresaId]);

  // Trocar de tela NÃO para a leitura (pedido do CEO, 2026-10-16): a barra fixa BarraVozGlobal tem o Parar

  // Conversa ao vivo aberta: o Ouvir some (uma voz só, sem interferência)
  if (!ativa || !empresa || !texto.trim() || aoVivo) return null;
  // Sem assinatura (saudação, fala da conversa ao vivo) não há como usar a voz do José: o botão não aparece
  if (temVozJose && !assinatura) return null;

  const minha = atual.chave === texto ? atual.estado : "parado";
  async function ouvir() {
    setAviso("");
    const ok = await falar({ chave: texto, texto, lang, empresaId: empresa!, assinatura, ressalva });
    if (!ok && estadoFala().estado === "parado") setAviso(t("semVoz"));
  }

  const ativo = minha !== "parado";
  const Icone = minha === "carregando" ? Loader2 : minha === "falando" ? Square : Volume2;
  const cor = temaClaro ? "#101b3d" : "#cfe0fa";
  return (
    <span className="inline-flex flex-col items-start gap-1 mt-2">
      <button type="button" onClick={ativo ? pararFala : ouvir} title={t("dica")} aria-label={ativo ? t("parar") : t("dica")} aria-pressed={minha === "falando"}
        data-estado={minha === "falando" ? "gravando" : minha === "carregando" ? "transcrevendo" : "pronto"}
        className={`axv${temaClaro ? "" : " axv-escuro"}`} style={{ height: 34, padding: "0 .75rem" }}>
        <span className="axv-mic" style={{ width: 22, height: 22 }}><Icone size={13} aria-hidden className={minha === "carregando" ? "animate-spin" : undefined} /></span>
        <span className="axv-rotulo text-xs">{minha === "falando" ? t("parar") : minha === "carregando" ? t("preparando") : t("ouvir")}</span>
      </button>
      {aviso && <span role="alert" className="text-[11px] font-medium" style={{ color: cor }}>{aviso}</span>}
    </span>
  );
}
