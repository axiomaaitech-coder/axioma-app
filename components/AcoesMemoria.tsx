"use client";
// Embaixo de cada resposta da IA: "Quer que eu lembre disso?" (quando a IA sugere) e "Está errado?".
// Só grava com o toque da pessoa (lib/ia/memoriaCliente.ts, RLS). Memória de aprendizagem, 2026-10-16.
import { useState } from "react";
import { Brain, Check, X } from "lucide-react";
import { lembrarSugestao, registrarCorrecao } from "../lib/ia/memoriaCliente";
import type { AreaMemoria, SugestaoMemoria } from "../lib/ia/memoria";

type L = "pt" | "en" | "es";
const TX: Record<string, Record<L, string>> = {
  pergunta: { pt: "Quer que eu lembre disso nas próximas respostas?", en: "Should I remember this for future answers?", es: "¿Quiere que recuerde esto en las próximas respuestas?" },
  lembrar: { pt: "Lembrar", en: "Remember", es: "Recordar" },
  agoraNao: { pt: "Agora não", en: "Not now", es: "Ahora no" },
  lembrado: { pt: "Guardado na memória da IA. Você pode ver, editar ou esquecer no painel Memória da IA.", en: "Saved in the AI memory. You can view, edit or forget it in the AI Memory panel.", es: "Guardado en la memoria de la IA. Puede verlo, editarlo u olvidarlo en el panel Memoria de la IA." },
  errado: { pt: "Está errado?", en: "Is this wrong?", es: "¿Está mal?" },
  qualCerto: { pt: "Escreva o que está certo (ex.: \"o pró-labore é R$ 8.000 por mês, não R$ 5.000\"):", en: "Write what is right (e.g. \"the owner's salary is R$ 8,000 a month, not R$ 5,000\"):", es: "Escriba lo correcto (ej.: \"el retiro del dueño es R$ 8.000 al mes, no R$ 5.000\"):" },
  salvar: { pt: "Salvar correção", en: "Save correction", es: "Guardar corrección" },
  cancelar: { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  corrigido: { pt: "Correção guardada: a IA vai usar isso e não repetir o erro.", en: "Correction saved: the AI will use it and not repeat the mistake.", es: "Corrección guardada: la IA la usará y no repetirá el error." },
  falha: { pt: "Não foi possível guardar agora. Nada foi salvo — tente de novo.", en: "Could not save right now. Nothing was saved — try again.", es: "No fue posible guardar ahora. No se guardó nada — intente de nuevo." },
};

export default function AcoesMemoria({ empresaId, area, sugestao, resposta, lang, claro }: {
  empresaId: string | null | undefined;
  area: AreaMemoria;
  sugestao?: SugestaoMemoria | null;
  resposta: string;
  lang: L;
  claro: boolean;
}) {
  const [sug, setSug] = useState<"aberta" | "salvando" | "feita" | "fechada">(sugestao ? "aberta" : "fechada");
  const [corr, setCorr] = useState<"fechada" | "aberta" | "salvando" | "feita">("fechada");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const t = (k: string) => TX[k][lang];
  if (!empresaId) return null;

  const cor = claro ? "#101b3d" : "#e2ecf7";
  const caixa = { background: claro ? "rgba(245,240,225,0.7)" : "rgba(46,204,155,0.06)", border: "1px solid rgba(46,204,155,0.35)" };
  const botao = (fundo: string) => ({ background: fundo, color: "#ffffff", border: "1px solid #2ecc9b" });

  async function lembrar() {
    if (!sugestao) return;
    setSug("salvando"); setErro("");
    const r = await lembrarSugestao(empresaId!, sugestao);
    if (r.erro) { setSug("aberta"); setErro(t("falha")); } else setSug("feita");
  }
  async function salvarCorrecao() {
    if (texto.trim().length < 3) return;
    setCorr("salvando"); setErro("");
    const r = await registrarCorrecao(empresaId!, area, resposta, texto);
    if (r.erro) { setCorr("aberta"); setErro(t("falha")); } else setCorr("feita");
  }

  return (
    <div className="mt-2 space-y-2 text-[12px]" style={{ color: cor }}>
      {sugestao && sug !== "fechada" && (
        <div className="rounded-lg p-2.5 axi-card-premium3d axi-card-faixa" style={caixa}>
          {sug === "feita" ? (
            <p className="font-semibold inline-flex items-center gap-1.5"><Check size={13} aria-hidden /> {t("lembrado")}</p>
          ) : (
            <>
              <p className="font-bold inline-flex items-center gap-1.5"><Brain size={13} aria-hidden /> {t("pergunta")}</p>
              <p className="mt-1"><strong>{sugestao.titulo}:</strong> {sugestao.conteudo}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={lembrar} disabled={sug === "salvando"} className="px-3 py-1.5 rounded-full font-bold" style={botao("#0f7a5a")}>{t("lembrar")}</button>
                <button type="button" onClick={() => setSug("fechada")} disabled={sug === "salvando"} className="px-3 py-1.5 rounded-full font-bold" style={botao("#101b3d")}>{t("agoraNao")}</button>
              </div>
            </>
          )}
        </div>
      )}
      {corr === "fechada" && (
        <button type="button" onClick={() => setCorr("aberta")} className="underline font-semibold" style={{ color: cor }}>{t("errado")}</button>
      )}
      {(corr === "aberta" || corr === "salvando") && (
        <div className="rounded-lg p-2.5" style={caixa}>
          <label className="font-semibold block mb-1">{t("qualCerto")}</label>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000} rows={2}
            className="w-full rounded-md px-2 py-1.5 text-[12px]" style={{ background: claro ? "#ffffff" : "#0a1628", color: cor, border: "1px solid rgba(46,204,155,0.35)" }} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={salvarCorrecao} disabled={corr === "salvando" || texto.trim().length < 3} className="px-3 py-1.5 rounded-full font-bold" style={botao("#0f7a5a")}>{t("salvar")}</button>
            <button type="button" onClick={() => { setCorr("fechada"); setTexto(""); }} disabled={corr === "salvando"} className="px-3 py-1.5 rounded-full font-bold inline-flex items-center gap-1" style={botao("#101b3d")}><X size={12} aria-hidden /> {t("cancelar")}</button>
          </div>
        </div>
      )}
      {corr === "feita" && <p className="font-semibold inline-flex items-center gap-1.5"><Check size={13} aria-hidden /> {t("corrigido")}</p>}
      {erro && <p role="alert" className="font-semibold" style={{ color: claro ? "#b42318" : "#fca5a5" }}>{erro}</p>}
    </div>
  );
}
