"use client";
// AXIOMA VOICE INTELLIGENCE — Fase 1: botão de ditado ao lado de um campo de texto existente.
// Toque para começar e tocar de novo para parar, OU segure para falar e solte para parar (estilo WeChat).
// Para sozinho no silêncio e em 60 s. A transcrição só PREENCHE o campo (onTexto) — nunca envia nada,
// nunca executa ação financeira. Some da tela se a função não estiver liberada para a empresa.
// Regras e limites: lib/voz/gravador.ts (navegador) e lib/voz/servidor.ts (servidor).
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, Square, X } from "lucide-react";
import { GravadorVoz, type ErroGravador } from "../lib/voz/gravador";
import { obterEmpresaAtiva } from "../lib/empresaHelpers";
import { useThemeAxioma } from "../lib/ThemeContext";

type Lang = "pt" | "en" | "es";
type Estado = "pronto" | "permissao" | "gravando" | "transcrevendo" | "concluido" | "erro";
const SEGURAR_MS = 450;

const TX: Record<string, Record<Lang, string>> = {
  rotulo: { pt: "Ditar por voz", en: "Dictate by voice", es: "Dictar por voz" },
  dica: { pt: "Toque para falar e toque de novo para parar — ou segure e solte. O texto entra no campo para você revisar.", en: "Tap to speak and tap again to stop — or hold and release. The text goes into the field for you to review.", es: "Toque para hablar y toque de nuevo para parar — o mantenga y suelte. El texto entra en el campo para que lo revise." },
  permissao: { pt: "Permita o microfone no aviso do navegador…", en: "Allow the microphone in the browser prompt…", es: "Permita el micrófono en el aviso del navegador…" },
  gravando: { pt: "Ouvindo… toque para parar", en: "Listening… tap to stop", es: "Escuchando… toque para parar" },
  transcrevendo: { pt: "Transcrevendo…", en: "Transcribing…", es: "Transcribiendo…" },
  concluido: { pt: "Texto inserido — revise antes de enviar.", en: "Text inserted — review it before sending.", es: "Texto insertado — revíselo antes de enviar." },
  cancelar: { pt: "Cancelar gravação", en: "Cancel recording", es: "Cancelar grabación" },
  negado: { pt: "O microfone está bloqueado. Libere no cadeado ao lado do endereço do site e tente de novo.", en: "The microphone is blocked. Allow it in the lock icon next to the site address and try again.", es: "El micrófono está bloqueado. Habilítelo en el candado junto a la dirección del sitio e intente de nuevo." },
  sem_microfone: { pt: "Nenhum microfone encontrado neste aparelho.", en: "No microphone found on this device.", es: "No se encontró micrófono en este dispositivo." },
  sem_suporte: { pt: "Este navegador não grava áudio. Use Chrome, Edge, Firefox ou Safari atualizado — ou digite.", en: "This browser cannot record audio. Use an up-to-date Chrome, Edge, Firefox or Safari — or type.", es: "Este navegador no graba audio. Use Chrome, Edge, Firefox o Safari actualizado — o escriba." },
  grande_demais: { pt: "A gravação ficou grande demais. Fale em trechos menores.", en: "The recording is too large. Speak in shorter parts.", es: "La grabación es demasiado grande. Hable en partes más cortas." },
  vazio: { pt: "Nenhum som foi gravado. Tente de novo.", en: "No sound was recorded. Try again.", es: "No se grabó ningún sonido. Intente de nuevo." },
  falha: { pt: "Não foi possível gravar agora. Tente de novo ou digite.", en: "Could not record right now. Try again or type.", es: "No se pudo grabar ahora. Intente de nuevo o escriba." },
  rede: { pt: "Sem conexão com o Axioma. Nada foi cobrado — tente de novo.", en: "No connection to Axioma. Nothing was charged — try again.", es: "Sin conexión con Axioma. No se cobró nada — intente de nuevo." },
  curtoFalar: { pt: "Falar", en: "Speak", es: "Hablar" },
  curtoOuvindo: { pt: "Ouvindo", en: "Listening", es: "Escuchando" },
  curtoEscrevendo: { pt: "Escrevendo…", en: "Writing…", es: "Escribiendo…" },
  curtoPermissao: { pt: "Microfone…", en: "Microphone…", es: "Micrófono…" },
  curtoPronto: { pt: "Pronto", en: "Done", es: "Listo" },
  curtoTentar: { pt: "Tentar de novo", en: "Try again", es: "Reintentar" },
};
const fmt = (ms: number) => `0:${String(Math.min(60, Math.floor(ms / 1000))).padStart(2, "0")}`;

function ambienteNavegador() {
  if (typeof window === "undefined") return {};
  const w = window as unknown as { MediaRecorder?: typeof MediaRecorder; AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return {
    getUserMedia: navigator.mediaDevices?.getUserMedia ? (c: MediaStreamConstraints) => navigator.mediaDevices.getUserMedia(c) : undefined,
    MediaRecorder: w.MediaRecorder, AudioContext: w.AudioContext ?? w.webkitAudioContext,
  };
}

export default function BotaoVoz({ lang, tela, onTexto, empresaId, claro, desativado = false }: {
  lang: Lang;
  tela: "nexus" | "ia-financeira" | "ia-tributaria" | "mei-ia-advisor" | "contas-pagar" | "importar-documentos" | "pdv" | "contas-receber";
  onTexto: (texto: string) => void;
  empresaId?: string | null;
  claro?: boolean;
  desativado?: boolean;
}) {
  const { tema } = useThemeAxioma();
  const temaClaro = claro ?? tema === "xms";
  const [liberado, setLiberado] = useState(false);
  const [empresa, setEmpresa] = useState<string | null>(empresaId ?? null);
  const [estado, setEstado] = useState<Estado>("pronto");
  const [msg, setMsg] = useState<string>("");
  const [nivel, setNivel] = useState(0);
  const [ms, setMs] = useState(0);
  const grav = useRef<GravadorVoz | null>(null);
  const pressionadoEm = useRef(0);
  const modoToque = useRef(false);
  const canceladoRef = useRef(false);
  const t = (k: string) => TX[k][lang];

  // A função só aparece se estiver liberada para a empresa (desligada para clientes até a Privacidade ser aprovada)
  useEffect(() => {
    let vivo = true;
    (async () => {
      const id = empresaId ?? (await obterEmpresaAtiva().catch(() => null));
      if (!vivo || !id) return;
      setEmpresa(id);
      const r = await fetch(`/api/voz/transcrever?empresa_id=${encodeURIComponent(id)}`).then((x) => x.json()).catch(() => null);
      if (vivo) setLiberado(!!r?.ativa);
    })();
    return () => { vivo = false; };
  }, [empresaId]);
  // Saiu da tela no meio da gravação: descarta e libera o microfone
  useEffect(() => () => { grav.current?.cancelar(); }, []);

  if (!liberado) return null;

  async function enviar(audio: Blob) {
    setEstado("transcrevendo"); setMsg(t("transcrevendo"));
    const form = new FormData();
    form.append("audio", audio, "ditado");
    form.append("empresa_id", empresa ?? ""); form.append("tela", tela); form.append("lang", lang);
    try {
      const res = await fetch(`/api/voz/transcrever?lang=${lang}`, { method: "POST", body: form });
      const j = await res.json().catch(() => null);
      if (res.ok && typeof j?.texto === "string") {
        onTexto(j.texto);
        setEstado("concluido"); setMsg(t("concluido"));
        setTimeout(() => setEstado((e) => (e === "concluido" ? "pronto" : e)), 2500);
      } else { setEstado("erro"); setMsg(typeof j?.mensagem === "string" ? j.mensagem : t("falha")); }
    } catch { setEstado("erro"); setMsg(t("rede")); }
  }

  async function comecar() {
    if (desativado) return;
    canceladoRef.current = false;
    const g = new GravadorVoz(ambienteNavegador(), (n, tempo) => { setNivel(n); setMs(tempo); });
    grav.current = g;
    setNivel(0); setMs(0);
    if (!GravadorVoz.suportado(ambienteNavegador())) { setEstado("erro"); setMsg(t("sem_suporte")); return; }
    setEstado("permissao"); setMsg(t("permissao"));
    try {
      const { final } = await g.iniciar();
      setEstado("gravando"); setMsg(t("gravando"));
      final.then(enviar).catch((e: ErroGravador) => {
        if (canceladoRef.current) { setEstado("pronto"); setMsg(""); return; }
        setEstado("erro"); setMsg(t(e in TX ? e : "falha"));
      });
    } catch (e) {
      g.liberar();
      setEstado("erro"); setMsg(t(typeof e === "string" && e in TX ? e : "falha"));
    }
  }
  function parar() { grav.current?.parar(); }
  function cancelar() { canceladoRef.current = true; grav.current?.cancelar(); setEstado("pronto"); setMsg(""); }

  const ocioso = estado === "pronto" || estado === "erro" || estado === "concluido";
  const aoPressionar = () => {
    if (ocioso) { pressionadoEm.current = Date.now(); modoToque.current = false; void comecar(); }
    else if (estado === "gravando" && modoToque.current) parar();
  };
  const aoSoltar = () => {
    if (estado !== "permissao" && estado !== "gravando") return;
    if (Date.now() - pressionadoEm.current > SEGURAR_MS) parar(); // segurou e soltou: para
    else modoToque.current = true; // toque rápido: continua até o próximo toque
  };

  // Cápsula viva (classes .axv* em app/globals.css, cores do tema-tokens.md)
  const Icone = estado === "gravando" ? Square : estado === "transcrevendo" || estado === "permissao" ? Loader2 : estado === "concluido" ? Check : Mic;
  const corMsg = estado === "erro" ? (temaClaro ? "#b42318" : "#fca5a5") : temaClaro ? "#101b3d" : "#cfe0fa";
  const rotulo = estado === "gravando" ? t("curtoOuvindo") : estado === "transcrevendo" ? t("curtoEscrevendo") : estado === "permissao" ? t("curtoPermissao") : estado === "concluido" ? t("curtoPronto") : estado === "erro" ? t("curtoTentar") : t("curtoFalar");
  // 5 barras que seguem o volume da voz (alturas desencontradas para parecer um equalizador)
  const forca = Math.min(1, nivel * 7);
  const barras = [0.55, 0.85, 1, 0.75, 0.5].map((f, i) => 4 + Math.round(16 * forca * f * (0.7 + 0.3 * Math.abs(Math.sin(ms / 140 + i)))));

  return (
    <span className="relative inline-flex items-center gap-1.5 shrink-0">
      {estado === "gravando" && (
        <button type="button" onClick={cancelar} aria-label={t("cancelar")} title={t("cancelar")}
          className="axv-cancelar" style={{ color: temaClaro ? "#101b3d" : "#cfe0fa" }}>
          <X size={14} aria-hidden />
        </button>
      )}
      <button type="button" disabled={desativado || estado === "transcrevendo"} data-estado={estado}
        onPointerDown={aoPressionar} onPointerUp={aoSoltar}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (ocioso) { modoToque.current = true; void comecar(); } else if (estado === "gravando") parar(); } }}
        aria-label={estado === "gravando" ? t("gravando") : t("rotulo")} aria-pressed={estado === "gravando"} title={t("dica")}
        className={`axv${temaClaro ? "" : " axv-escuro"}`}>
        <span className="axv-mic"><Icone size={15} aria-hidden className={estado === "transcrevendo" || estado === "permissao" ? "animate-spin" : undefined} /></span>
        {estado === "gravando" ? (
          <>
            <span className="axv-barras" aria-hidden>{barras.map((h, i) => <i key={i} style={{ height: h }} />)}</span>
            <span className="axv-tempo" aria-hidden>{fmt(ms)}</span>
          </>
        ) : (
          <span className="axv-rotulo">{rotulo}</span>
        )}
      </button>
      {msg && estado !== "pronto" && (
        <span role={estado === "erro" ? "alert" : "status"} aria-live="polite"
          className="absolute right-0 top-full mt-1 z-30 w-64 rounded-lg px-3 py-2 text-xs font-medium shadow-lg"
          style={{ background: temaClaro ? "#ffffff" : "#0a1628", color: corMsg, border: `1px solid ${estado === "erro" ? "rgba(180,35,24,0.35)" : "rgba(46,204,155,0.35)"}` }}>
          {msg}
        </span>
      )}
    </span>
  );
}
