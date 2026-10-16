"use client";
// AXIOMA VOICE INTELLIGENCE — PoC CONVERSA AO VIVO: painel "Iniciar conversa ao vivo".
// Só aparece com algum fornecedor de tempo real liberado para a empresa (GET /api/voz/tempo-real).
// Abre só no toque, mostra "microfone aberto" o tempo todo, encerra no botão, em 60 s de silêncio
// ou em 10 min. As falas (sua e do José) entram no chat pela função `aoFalar` da tela.
import { useEffect, useRef, useState } from "react";
import { Loader2, PhoneOff, Radio } from "lucide-react";
import { pararFala } from "../lib/voz/reprodutor";
import { iniciarConversaAoVivo, type EstadoConversa, type MotivoFim, type SessaoAoVivo } from "../lib/voz/tempoReal/cliente";
import type { FornecedorTR } from "../lib/voz/tempoReal/servidor";
import type { IdiomaFala } from "../lib/voz/textoFala";

const TX: Record<string, Record<IdiomaFala, string>> = {
  titulo: { pt: "Conversa ao vivo com o José (teste)", en: "Live conversation with José (test)", es: "Conversación en vivo con José (prueba)" },
  dica: { pt: "Fale naturalmente, sem apertar botão a cada frase. Pode interromper o José falando por cima. Os números vêm do motor do Axioma.", en: "Speak naturally, no button for each sentence. You can interrupt José by talking over him. Numbers come from the Axioma engine.", es: "Hable con naturalidad, sin botón en cada frase. Puede interrumpir a José hablando encima. Los números vienen del motor de Axioma." },
  iniciar: { pt: "Iniciar conversa ao vivo", en: "Start live conversation", es: "Iniciar conversación en vivo" },
  encerrar: { pt: "Encerrar", en: "End", es: "Terminar" },
  conectando: { pt: "Conectando…", en: "Connecting…", es: "Conectando…" },
  ouvindo: { pt: "Microfone aberto — pode falar", en: "Microphone on — go ahead", es: "Micrófono abierto — puede hablar" },
  consultando: { pt: "Consultando os dados da empresa…", en: "Checking company data…", es: "Consultando los datos de la empresa…" },
  falando: { pt: "José falando — fale por cima para interromper", en: "José speaking — talk over to interrupt", es: "José hablando — hable encima para interrumpir" },
  silencio: { pt: "Conversa encerrada por silêncio.", en: "Conversation ended due to silence.", es: "Conversación terminada por silencio." },
  tempo_esgotado: { pt: "Conversa encerrada: limite de 10 minutos.", en: "Conversation ended: 10-minute limit.", es: "Conversación terminada: límite de 10 minutos." },
  voz: { pt: "Voz", en: "Voice", es: "Voz" },
};
const NOME_FORNECEDOR: Record<FornecedorTR, string> = { gemini: "Google Gemini Live", qwen: "Alibaba Qwen Omni" };

export default function ConversaAoVivo({ empresaId, lang, claro, aoFalar, consultar }: {
  empresaId: string | null;
  lang: IdiomaFala;
  claro: boolean;
  aoFalar: (quem: "voce" | "jose", texto: string) => void;
  consultar: (pergunta: string) => Promise<string>;
}) {
  const [fornecedores, setFornecedores] = useState<FornecedorTR[]>([]);
  const [escolhido, setEscolhido] = useState<FornecedorTR | null>(null);
  const [estado, setEstado] = useState<EstadoConversa | null>(null);
  const [aviso, setAviso] = useState("");
  const sessao = useRef<SessaoAoVivo | null>(null);
  // Funções da tela mudam a cada render: a sessão usa sempre a mais nova
  const aoFalarRef = useRef(aoFalar);
  const consultarRef = useRef(consultar);
  useEffect(() => { aoFalarRef.current = aoFalar; consultarRef.current = consultar; }, [aoFalar, consultar]);
  const t = (k: string) => TX[k][lang];

  useEffect(() => {
    if (!empresaId) return;
    let vivo = true;
    fetch(`/api/voz/tempo-real?empresa_id=${encodeURIComponent(empresaId)}`).then((r) => r.json()).then((j) => {
      if (!vivo) return;
      const f = (Array.isArray(j?.fornecedores) ? j.fornecedores : []) as FornecedorTR[];
      setFornecedores(f); setEscolhido((e) => e ?? f[0] ?? null);
    }).catch(() => {});
    return () => { vivo = false; };
  }, [empresaId]);
  // Saiu da tela: encerra e libera o microfone
  useEffect(() => () => { sessao.current?.encerrar("saiu_da_tela"); }, []);

  if (!fornecedores.length || !empresaId) return null;

  const ativa = estado === "conectando" || estado === "ouvindo" || estado === "consultando" || estado === "falando";
  async function iniciar() {
    if (!escolhido || ativa) return;
    pararFala(); setAviso("");
    sessao.current = await iniciarConversaAoVivo({
      fornecedor: escolhido, empresaId: empresaId!, lang,
      consultar: (p) => consultarRef.current(p),
      eventos: {
        estado: setEstado,
        fala: (quem, texto) => aoFalarRef.current(quem, texto),
        erro: setAviso,
        fim: (m: MotivoFim) => { if (m === "silencio" || m === "tempo_esgotado") setAviso(t(m)); },
      },
    });
  }

  const corTexto = claro ? "#101b3d" : "#e2ecf7";
  return (
    <div className="mt-3 rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={{ background: claro ? "rgba(46,204,155,0.10)" : "rgba(46,204,155,0.06)", border: `1px solid ${ativa ? "#2ecc9b" : "rgba(46,204,155,0.3)"}` }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold" style={{ color: corTexto }}>{t("titulo")}</span>
        {fornecedores.length > 1 && !ativa && (
          <label className="text-[11px] font-medium inline-flex items-center gap-1" style={{ color: corTexto }}>
            {t("voz")}:
            <select value={escolhido ?? ""} onChange={(e) => setEscolhido(e.target.value as FornecedorTR)} className="rounded-md px-2 py-1 text-[11px]"
              style={{ background: claro ? "#ffffff" : "#0a1628", color: corTexto, border: "1px solid rgba(46,204,155,0.35)" }}>
              {fornecedores.map((f) => <option key={f} value={f}>{NOME_FORNECEDOR[f]}</option>)}
            </select>
          </label>
        )}
        {ativa ? (
          <button type="button" onClick={() => sessao.current?.encerrar("usuario")}
            className="ml-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold text-white" style={{ background: "#101b3d", border: "1px solid #2ecc9b" }}>
            <PhoneOff size={14} aria-hidden /> {t("encerrar")}
          </button>
        ) : (
          <button type="button" onClick={iniciar} disabled={!escolhido}
            className="ml-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold text-white" style={{ background: "#0f7a5a", border: "1px solid #2ecc9b" }}>
            <Radio size={14} aria-hidden /> {t("iniciar")}
          </button>
        )}
      </div>
      {ativa ? (
        <p role="status" aria-live="polite" className="mt-2 text-xs font-semibold inline-flex items-center gap-2" style={{ color: claro ? "#0f7a5a" : "#34d399" }}>
          {estado === "conectando" || estado === "consultando" ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <span className="inline-block w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#e5484d" }} aria-hidden />}
          {t(estado!)}
        </p>
      ) : (
        <p className="mt-2 text-[11px] font-medium" style={{ color: corTexto }}>{t("dica")}</p>
      )}
      {aviso && <p role="alert" className="mt-1 text-[11px] font-semibold" style={{ color: claro ? "#b42318" : "#fca5a5" }}>{aviso}</p>}
    </div>
  );
}
