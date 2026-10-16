"use client";
// AXIOMA VOICE INTELLIGENCE — Fase 2: botão "Ouvir / Parar" embaixo de cada resposta da IA.
// Voz do servidor (OpenAI ou ElevenLabs, /api/voz/falar) quando houver fornecedor e a resposta vier
// ASSINADA pelo motor; senão — ou se o servidor falhar — a voz do próprio aparelho lê de graça (anti-falha).
// Só toca quando a pessoa toca; nunca abre o microfone sozinho. Some se a voz não estiver liberada.
import { useEffect, useRef, useState } from "react";
import { Loader2, Square, Volume2 } from "lucide-react";
import { obterEmpresaAtiva } from "../lib/empresaHelpers";
import { useThemeAxioma } from "../lib/ThemeContext";
import { dividirEmFrases, textoParaFala, type IdiomaFala } from "../lib/voz/textoFala";

type Estado = "pronto" | "carregando" | "falando";
const TX: Record<string, Record<IdiomaFala, string>> = {
  ouvir: { pt: "Ouvir", en: "Listen", es: "Escuchar" },
  parar: { pt: "Parar", en: "Stop", es: "Detener" },
  preparando: { pt: "Preparando…", en: "Preparing…", es: "Preparando…" },
  dica: { pt: "Ouvir esta resposta em voz alta", en: "Listen to this answer out loud", es: "Escuchar esta respuesta en voz alta" },
  semVoz: { pt: "Este aparelho não tem voz disponível. Leia a resposta na tela.", en: "This device has no voice available. Read the answer on screen.", es: "Este dispositivo no tiene voz disponible. Lea la respuesta en pantalla." },
};
const LOCALE: Record<IdiomaFala, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

// Uma consulta por empresa (lista com 30 respostas não faz 30 pedidos)
const situacaoCache = new Map<string, Promise<{ ativa: boolean; fornecedor: string | null; nome: string }>>();
function situacaoVoz(id: string) {
  if (!situacaoCache.has(id)) {
    situacaoCache.set(id, fetch(`/api/voz/falar?empresa_id=${encodeURIComponent(id)}`).then((x) => x.json())
      .then((j) => ({ ativa: !!j?.ativa, fornecedor: typeof j?.fornecedor === "string" ? j.fornecedor : null, nome: typeof j?.nome === "string" ? j.nome : "" }))
      .catch(() => { situacaoCache.delete(id); return { ativa: false, fornecedor: null, nome: "" }; }));
  }
  return situacaoCache.get(id)!;
}
// Só uma resposta fala por vez na tela inteira
let pararAtual: (() => void) | null = null;

// Nomes das vozes masculinas/femininas que Windows, Edge, Mac, Android e iPhone instalam (pt/en/es)
const MASCULINAS = /(antonio|daniel|donato|fabio|f[áa]bio|humberto|julio|j[úu]lio|nicolau|valerio|val[ée]rio|leandro|thiago|felipe|guy|andrew|brian|christopher|eric|roger|steffan|david|mark|ryan|alex|fred|aaron|rishi|tom|alvaro|[áa]lvaro|jorge|pablo|ra[úu]l|gonzalo|dar[íi]o|tom[áa]s|diego|carlos|male|masculin)/i;
const FEMININAS = /(francisca|thalita|maria|luciana|leila|yara|brenda|elza|giovanna|manuela|helena|joana|catarina|fernanda|raquel|ana|aria|jenny|michelle|emma|ava|zira|hazel|susan|samantha|karen|moira|tessa|elvira|dalia|helena|laura|paulina|monica|m[óo]nica|sabina|female|feminin|google portugu[êe]s|google espa[ñn]ol|google us english)/i;
// Melhor voz do aparelho para o idioma (as "naturais"/online soam bem melhores que as antigas)
function melhorVoz(lang: IdiomaFala): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices();
  const loc = LOCALE[lang].toLowerCase();
  const doIdioma = vozes.filter((v) => v.lang.toLowerCase().replace("_", "-") === loc);
  const lista = doIdioma.length ? doIdioma : vozes.filter((v) => v.lang.toLowerCase().startsWith(lang));
  // Voz MASCULINA (pedido do Elias 2026-10-16): homem natural > homem comum > qualquer natural; voz feminina por último
  const nota = (v: SpeechSynthesisVoice) => (MASCULINAS.test(v.name) ? 10 : 0) + (FEMININAS.test(v.name) ? -10 : 0) + (/natural|neural|online/i.test(v.name) ? 3 : 0);
  return lista.sort((a, b) => nota(b) - nota(a))[0] ?? null;
}

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
  const [sit, setSit] = useState<{ ativa: boolean; fornecedor: string | null; nome: string; empresa: string } | null>(null);
  const [estado, setEstado] = useState<Estado>("pronto");
  const [aviso, setAviso] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null); // áudio já gerado: tocar de novo não pede de novo
  const ctrlRef = useRef<AbortController | null>(null);
  const t = (k: string) => TX[k][lang];

  useEffect(() => {
    let vivo = true;
    (async () => {
      const id = empresaId ?? (await obterEmpresaAtiva().catch(() => null));
      if (!id) return;
      const s = await situacaoVoz(id);
      if (vivo) setSit({ ...s, empresa: id });
    })();
    return () => { vivo = false; };
  }, [empresaId]);
  // Chrome carrega as vozes do aparelho depois: pede a lista cedo para a 1ª fala já sair com a voz boa
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    const ok = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", ok);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", ok);
  }, []);
  // Saiu da tela: para a fala e libera o áudio da memória
  useEffect(() => () => {
    ctrlRef.current?.abort();
    audioRef.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  if (!sit?.ativa || !texto.trim()) return null;

  function parar() {
    ctrlRef.current?.abort();
    audioRef.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setEstado("pronto");
  }

  function falarNoAparelho() {
    if (!("speechSynthesis" in window)) { setAviso(t("semVoz")); setEstado("pronto"); return; }
    const synth = window.speechSynthesis;
    synth.cancel();
    const frases = dividirEmFrases(textoParaFala(texto, lang, ressalva, sit?.nome ?? null));
    const voz = melhorVoz(lang);
    if (!frases.length) { setEstado("pronto"); return; }
    frases.forEach((f, i) => {
      const u = new SpeechSynthesisUtterance(f);
      u.lang = LOCALE[lang]; if (voz) u.voice = voz; u.rate = 1.02;
      if (i === frases.length - 1) u.onend = () => setEstado((e) => (e === "falando" ? "pronto" : e));
      u.onerror = (ev) => { if (ev.error !== "interrupted" && ev.error !== "canceled") setEstado("pronto"); };
      synth.speak(u);
    });
    setEstado("falando");
  }

  function tocar(url: string) {
    const a = audioRef.current ?? new Audio();
    audioRef.current = a;
    a.src = url;
    a.onended = () => setEstado("pronto");
    a.play().then(() => setEstado("falando")).catch(() => { setEstado("pronto"); });
  }

  async function ouvir() {
    pararAtual?.(); pararAtual = parar;
    setAviso("");
    if (urlRef.current) { tocar(urlRef.current); return; }
    // Sem fornecedor ou resposta sem assinatura (ex.: histórico antigo, resposta por regras): voz do aparelho
    if (!sit?.fornecedor || !assinatura) { falarNoAparelho(); return; }
    setEstado("carregando");
    const ctrl = new AbortController(); ctrlRef.current = ctrl;
    try {
      const res = await fetch("/api/voz/falar", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
        body: JSON.stringify({ empresa_id: sit.empresa, texto, assinatura, lang, ressalva }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      if (ctrl.signal.aborted) return;
      urlRef.current = URL.createObjectURL(blob);
      tocar(urlRef.current);
    } catch {
      if (ctrl.signal.aborted) return;
      falarNoAparelho(); // anti-falha: o servidor falhou, o aparelho lê
    }
  }

  const ativo = estado !== "pronto";
  const Icone = estado === "carregando" ? Loader2 : estado === "falando" ? Square : Volume2;
  const cor = temaClaro ? "#101b3d" : "#cfe0fa";
  return (
    <span className="inline-flex flex-col items-start gap-1 mt-2">
      <button type="button" onClick={ativo ? parar : ouvir} title={t("dica")} aria-label={ativo ? t("parar") : t("dica")} aria-pressed={estado === "falando"}
        data-estado={estado === "falando" ? "gravando" : estado === "carregando" ? "transcrevendo" : "pronto"}
        className={`axv${temaClaro ? "" : " axv-escuro"}`} style={{ height: 34, padding: "0 .75rem" }}>
        <span className="axv-mic" style={{ width: 22, height: 22 }}><Icone size={13} aria-hidden className={estado === "carregando" ? "animate-spin" : undefined} /></span>
        <span className="axv-rotulo text-xs">{estado === "falando" ? t("parar") : estado === "carregando" ? t("preparando") : t("ouvir")}</span>
      </button>
      {aviso && <span role="alert" className="text-[11px] font-medium" style={{ color: cor }}>{aviso}</span>}
    </span>
  );
}
