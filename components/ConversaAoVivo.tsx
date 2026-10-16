"use client";
// AXIOMA VOICE INTELLIGENCE — Conversa ao vivo: painel "Iniciar conversa ao vivo" nas telas de IA
// (José/Nexus, IA Financeira, IA Tributária, MEI Advisor — todas iguais).
// A sessão mora fora da tela (lib/voz/tempoReal/sessaoGlobal.ts): trocar de página NÃO encerra — a barra
// fixa (components/BarraVozGlobal) mostra o microfone aberto em qualquer página. Abre só no toque;
// encerra no botão, em 60 s de silêncio ou em 10 min. As falas entram no chat desta tela quando ela
// está aberta (as que aconteceram enquanto a pessoa estava em outra página chegam ao voltar).
import { useEffect, useState, useSyncExternalStore } from "react";
import { Loader2, PhoneOff, Radio } from "lucide-react";
import { obterEmpresaAtiva } from "../lib/empresaHelpers";
import { pararFala } from "../lib/voz/reprodutor";
import { assinarConversaGlobal, encerrarConversaGlobal, estadoConversaGlobal, estadoConversaInicial, iniciarConversaGlobal, registrarTela, type TelaConversa } from "../lib/voz/tempoReal/sessaoGlobal";
import type { FornecedorTR } from "../lib/voz/tempoReal/servidor";
import type { IdiomaFala } from "../lib/voz/textoFala";

const TX: Record<string, Record<IdiomaFala, string>> = {
  "titulo-nexus": { pt: "Conversa ao vivo com o José (teste)", en: "Live conversation with José (test)", es: "Conversación en vivo con José (prueba)" },
  "titulo-ia-financeira": { pt: "Conversa ao vivo com a Inteligência Axioma — Diretora Financeira Digital (teste)", en: "Live conversation with Axioma Intelligence — Digital Finance Director (test)", es: "Conversación en vivo con la Inteligencia Axioma — Directora Financiera Digital (prueba)" },
  "titulo-ia-tributaria": { pt: "Conversa ao vivo com a Inteligência Axioma — Especialista Tributária (teste)", en: "Live conversation with Axioma Intelligence — Tax Specialist (test)", es: "Conversación en vivo con la Inteligencia Axioma — Especialista Tributaria (prueba)" },
  "titulo-mei-ia-advisor": { pt: "Conversa ao vivo com a Inteligência Axioma — Consultora do MEI (teste)", en: "Live conversation with Axioma Intelligence — MEI Advisor (test)", es: "Conversación en vivo con la Inteligencia Axioma — Consultora del MEI (prueba)" },
  dica: { pt: "Fale naturalmente, sem apertar botão a cada frase. Pode interromper falando por cima e pode abrir outras telas para conferir os números: a conversa continua. Os números vêm do motor do Axioma.", en: "Speak naturally, no button for each sentence. You can interrupt by talking over and open other screens to check the numbers: the conversation continues. Numbers come from the Axioma engine.", es: "Hable con naturalidad, sin botón en cada frase. Puede interrumpir hablando encima y abrir otras pantallas para verificar los números: la conversación continúa. Los números vienen del motor de Axioma." },
  iniciar: { pt: "Iniciar conversa ao vivo", en: "Start live conversation", es: "Iniciar conversación en vivo" },
  encerrar: { pt: "Encerrar", en: "End", es: "Terminar" },
  conectando: { pt: "Conectando…", en: "Connecting…", es: "Conectando…" },
  ouvindo: { pt: "Microfone aberto — pode falar", en: "Microphone on — go ahead", es: "Micrófono abierto — puede hablar" },
  consultando: { pt: "Consultando os dados da empresa…", en: "Checking company data…", es: "Consultando los datos de la empresa…" },
  falando: { pt: "Falando — fale por cima para interromper", en: "Speaking — talk over to interrupt", es: "Hablando — hable encima para interrumpir" },
  outra: { pt: "Há uma conversa ao vivo aberta em outra tela.", en: "A live conversation is open on another screen.", es: "Hay una conversación en vivo abierta en otra pantalla." },
  silencio: { pt: "Conversa encerrada por silêncio.", en: "Conversation ended due to silence.", es: "Conversación terminada por silencio." },
  tempo_esgotado: { pt: "Conversa encerrada: limite de 10 minutos.", en: "Conversation ended: 10-minute limit.", es: "Conversación terminada: límite de 10 minutos." },
  voz: { pt: "Voz", en: "Voice", es: "Voz" },
};
const NOME_FORNECEDOR: Record<FornecedorTR, string> = { gemini: "Google Gemini Live", qwen: "Alibaba Qwen Omni" };

export default function ConversaAoVivo({ empresaId, lang, claro, aoFalar, consultar, tela = "nexus" }: {
  empresaId?: string | null;
  tela?: TelaConversa;
  lang: IdiomaFala;
  claro: boolean;
  aoFalar: (quem: "voce" | "jose", texto: string) => void;
  consultar?: (pergunta: string) => Promise<string>;
}) {
  const [empresa, setEmpresa] = useState<string | null>(empresaId ?? null);
  const [fornecedores, setFornecedores] = useState<FornecedorTR[]>([]);
  const [escolhido, setEscolhido] = useState<FornecedorTR | null>(null);
  const g = useSyncExternalStore(assinarConversaGlobal, estadoConversaGlobal, estadoConversaInicial);
  const t = (k: string) => TX[k]?.[lang] ?? k;

  useEffect(() => {
    let vivo = true;
    (async () => {
      const id = empresaId ?? (await obterEmpresaAtiva().catch(() => null));
      if (!vivo || !id) return;
      setEmpresa(id);
      const j = await fetch(`/api/voz/tempo-real?empresa_id=${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => null);
      if (!vivo) return;
      const f = (Array.isArray(j?.fornecedores) ? j.fornecedores : []) as FornecedorTR[];
      setFornecedores(f); setEscolhido((e) => e ?? f[0] ?? null);
    })();
    return () => { vivo = false; };
  }, [empresaId]);
  // Esta tela recebe as falas enquanto estiver aberta; ao sair, a conversa CONTINUA (não encerra)
  useEffect(() => registrarTela(tela, { aoFalar, consultar }), [tela, aoFalar, consultar]);

  if (!fornecedores.length || !empresa) return null;

  const minha = g.ativa && g.tela === tela;
  const outraTela = g.ativa && g.tela !== tela;
  async function iniciar() {
    if (!escolhido || g.ativa) return;
    pararFala();
    await iniciarConversaGlobal({ fornecedor: escolhido, empresaId: empresa!, lang, tela, caminho: window.location.pathname, tela_aberta: { aoFalar, consultar } });
  }

  const corTexto = claro ? "#101b3d" : "#e2ecf7";
  const aviso = !g.ativa && g.tela === tela && g.aviso ? (g.aviso === "silencio" || g.aviso === "tempo_esgotado" ? t(g.aviso) : g.aviso) : "";
  return (
    <div className="mt-3 rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={{ background: claro ? "rgba(46,204,155,0.10)" : "rgba(46,204,155,0.06)", border: `1px solid ${minha ? "#2ecc9b" : "rgba(46,204,155,0.3)"}` }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold" style={{ color: corTexto }}>{t(`titulo-${tela}`)}</span>
        {fornecedores.length > 1 && !g.ativa && (
          <label className="text-[11px] font-medium inline-flex items-center gap-1" style={{ color: corTexto }}>
            {t("voz")}:
            <select value={escolhido ?? ""} onChange={(e) => setEscolhido(e.target.value as FornecedorTR)} className="rounded-md px-2 py-1 text-[11px]"
              style={{ background: claro ? "#ffffff" : "#0a1628", color: corTexto, border: "1px solid rgba(46,204,155,0.35)" }}>
              {fornecedores.map((f) => <option key={f} value={f}>{NOME_FORNECEDOR[f]}</option>)}
            </select>
          </label>
        )}
        {g.ativa ? (
          <button type="button" onClick={encerrarConversaGlobal}
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
      {minha ? (
        <p role="status" aria-live="polite" className="mt-2 text-xs font-semibold inline-flex items-center gap-2" style={{ color: claro ? "#0f7a5a" : "#34d399" }}>
          {g.estado === "conectando" || g.estado === "consultando" ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <span className="inline-block w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#e5484d" }} aria-hidden />}
          {t(g.estado ?? "conectando")}
        </p>
      ) : outraTela ? (
        <p className="mt-2 text-[11px] font-semibold" style={{ color: corTexto }}>{t("outra")}</p>
      ) : (
        <p className="mt-2 text-[11px] font-medium" style={{ color: corTexto }}>{t("dica")}</p>
      )}
      {aviso && <p role="alert" className="mt-1 text-[11px] font-semibold" style={{ color: claro ? "#b42318" : "#fca5a5" }}>{aviso}</p>}
    </div>
  );
}
