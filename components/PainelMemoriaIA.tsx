"use client";
// Painel "Memória da IA": o que a Inteligência Axioma aprendeu desta empresa (só o confirmado pela pessoa).
// Ver, ensinar algo novo, editar e esquecer (= arquivar; nada é apagado). Memória de aprendizagem, 2026-10-16.
import { useState } from "react";
import { Brain, ChevronDown, ChevronUp, Pencil, Plus } from "lucide-react";
import { adicionarManual, arquivarMemoria, editarMemoria, listarMemorias } from "../lib/ia/memoriaCliente";
import { areasLidas, type AreaMemoria, type Memoria } from "../lib/ia/memoria";

type L = "pt" | "en" | "es";
const TX: Record<string, Record<L, string>> = {
  titulo: { pt: "Memória da IA", en: "AI Memory", es: "Memoria de la IA" },
  dica: { pt: "O que a Inteligência Axioma aprendeu sobre a sua Empresa. Só entra aqui o que você confirmou; ela usa isso em todas as respostas desta área.", en: "What Axioma Intelligence learned about your Company. Only what you confirmed is here; it uses this in every answer in this area.", es: "Lo que la Inteligencia Axioma aprendió de su Empresa. Solo entra lo que usted confirmó; lo usa en todas las respuestas de esta área." },
  vazio: { pt: "Ainda não há nada guardado. Quando você informar um dado da Empresa numa conversa, a IA pergunta se deve lembrar.", en: "Nothing saved yet. When you share a Company detail in a conversation, the AI asks whether to remember it.", es: "Aún no hay nada guardado. Cuando informe un dato de la Empresa en una conversación, la IA pregunta si debe recordarlo." },
  ensinar: { pt: "Ensinar algo", en: "Teach something", es: "Enseñar algo" },
  assunto: { pt: "Assunto (ex.: Pró-labore)", en: "Subject (e.g. Owner's salary)", es: "Asunto (ej.: Retiro del dueño)" },
  oQue: { pt: "O que a IA deve saber (ex.: R$ 8.000 por mês desde jan/2026)", en: "What the AI should know (e.g. R$ 8,000 a month since Jan/2026)", es: "Lo que la IA debe saber (ej.: R$ 8.000 al mes desde ene/2026)" },
  salvar: { pt: "Salvar", en: "Save", es: "Guardar" },
  cancelar: { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  editar: { pt: "Editar", en: "Edit", es: "Editar" },
  esquecer: { pt: "Esquecer", en: "Forget", es: "Olvidar" },
  confirmaEsquecer: { pt: "A IA deixa de usar isso (fica guardado só no histórico). Confirmar?", en: "The AI stops using this (kept only in history). Confirm?", es: "La IA deja de usar esto (queda solo en el historial). ¿Confirmar?" },
  sim: { pt: "Sim, esquecer", en: "Yes, forget", es: "Sí, olvidar" },
  nao: { pt: "Não", en: "No", es: "No" },
  correcao: { pt: "correção", en: "correction", es: "corrección" },
  falha: { pt: "Não foi possível concluir agora. Nada foi alterado — tente de novo.", en: "Could not finish right now. Nothing was changed — try again.", es: "No fue posible terminar ahora. No se cambió nada — intente de nuevo." },
  falhaLer: { pt: "Não foi possível carregar a memória agora.", en: "Could not load the memory right now.", es: "No fue posible cargar la memoria ahora." },
};

export default function PainelMemoriaIA({ empresaId, area, lang, claro }: { empresaId: string | null | undefined; area: AreaMemoria; lang: L; claro: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<Memoria[]>([]);
  const [erro, setErro] = useState("");
  const [novo, setNovo] = useState<{ titulo: string; conteudo: string } | null>(null);
  const [editando, setEditando] = useState<{ id: string; conteudo: string } | null>(null);
  const [esquecendo, setEsquecendo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const t = (k: string) => TX[k][lang];

  async function carregar() {
    if (!empresaId) return;
    const r = await listarMemorias(empresaId, areasLidas(area));
    setItens(r.itens); setErro(r.erro ? t("falhaLer") : "");
  }
  if (!empresaId) return null;

  const cor = claro ? "#101b3d" : "#e2ecf7";
  const caixa = { background: claro ? "rgba(245,240,225,0.7)" : "rgba(10,22,40,0.6)", border: "1px solid rgba(46,204,155,0.3)" };
  const campo = { background: claro ? "#ffffff" : "#0a1628", color: cor, border: "1px solid rgba(46,204,155,0.35)" };
  const botao = (fundo: string) => ({ background: fundo, color: "#ffffff", border: "1px solid #2ecc9b" });
  const executar = async (f: () => Promise<{ erro?: string }>) => { setOcupado(true); setErro(""); const r = await f(); setOcupado(false); if (r.erro) { setErro(t("falha")); return false; } await carregar(); return true; };
  const data = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");

  return (
    <div className="mt-3 rounded-xl p-3 axi-card-premium3d axi-card-faixa" style={caixa}>
      <button type="button" onClick={() => { const abrir = !aberto; setAberto(abrir); if (abrir) void carregar(); }} className="w-full flex items-center gap-2 text-left" aria-expanded={aberto}>
        <Brain size={15} aria-hidden style={{ color: claro ? "#0f7a5a" : "#34d399" }} />
        <span className="text-xs font-bold flex-1" style={{ color: cor }}>{t("titulo")}{aberto ? ` (${itens.length})` : ""}</span>
        {aberto ? <ChevronUp size={14} aria-hidden style={{ color: cor }} /> : <ChevronDown size={14} aria-hidden style={{ color: cor }} />}
      </button>
      {aberto && (
        <div className="mt-2 space-y-2 text-[12px]" style={{ color: cor }}>
          <p>{t("dica")}</p>
          {itens.length === 0 && !erro && <p className="font-medium">{t("vazio")}</p>}
          {itens.map((m) => (
            <div key={m.id} className="rounded-lg p-2.5" style={campo}>
              <p className="font-bold">{m.titulo}{m.tipo === "correcao" ? ` (${t("correcao")})` : ""} <span className="font-normal">· {data(m.confirmado_em)}</span></p>
              {editando?.id === m.id ? (
                <>
                  <textarea value={editando.conteudo} onChange={(e) => setEditando({ id: m.id, conteudo: e.target.value })} maxLength={1000} rows={2} className="w-full mt-1 rounded-md px-2 py-1.5" style={campo} />
                  <div className="mt-1.5 flex gap-2">
                    <button type="button" disabled={ocupado || editando.conteudo.trim().length < 3} onClick={async () => { if (await executar(() => editarMemoria(empresaId, m.id, editando.conteudo))) setEditando(null); }} className="px-3 py-1 rounded-full font-bold" style={botao("#0f7a5a")}>{t("salvar")}</button>
                    <button type="button" disabled={ocupado} onClick={() => setEditando(null)} className="px-3 py-1 rounded-full font-bold" style={botao("#101b3d")}>{t("cancelar")}</button>
                  </div>
                </>
              ) : <p className="mt-0.5">{m.conteudo}</p>}
              {esquecendo === m.id ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{t("confirmaEsquecer")}</span>
                  <button type="button" disabled={ocupado} onClick={async () => { if (await executar(() => arquivarMemoria(empresaId, m.id))) setEsquecendo(null); }} className="px-3 py-1 rounded-full font-bold" style={botao("#101b3d")}>{t("sim")}</button>
                  <button type="button" disabled={ocupado} onClick={() => setEsquecendo(null)} className="px-3 py-1 rounded-full font-bold" style={botao("#0f7a5a")}>{t("nao")}</button>
                </div>
              ) : editando?.id !== m.id && (
                <div className="mt-1.5 flex gap-3">
                  <button type="button" onClick={() => setEditando({ id: m.id, conteudo: m.conteudo })} className="inline-flex items-center gap-1 underline font-semibold"><Pencil size={11} aria-hidden /> {t("editar")}</button>
                  <button type="button" onClick={() => setEsquecendo(m.id)} className="underline font-semibold">{t("esquecer")}</button>
                </div>
              )}
            </div>
          ))}
          {novo ? (
            <div className="rounded-lg p-2.5 space-y-1.5" style={campo}>
              <input value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} maxLength={120} placeholder={t("assunto")} className="w-full rounded-md px-2 py-1.5" style={campo} />
              <textarea value={novo.conteudo} onChange={(e) => setNovo({ ...novo, conteudo: e.target.value })} maxLength={1000} rows={2} placeholder={t("oQue")} className="w-full rounded-md px-2 py-1.5" style={campo} />
              <div className="flex gap-2">
                <button type="button" disabled={ocupado || novo.titulo.trim().length < 3 || novo.conteudo.trim().length < 3} onClick={async () => { if (await executar(() => adicionarManual(empresaId, area, novo.titulo, novo.conteudo))) setNovo(null); }} className="px-3 py-1 rounded-full font-bold" style={botao("#0f7a5a")}>{t("salvar")}</button>
                <button type="button" disabled={ocupado} onClick={() => setNovo(null)} className="px-3 py-1 rounded-full font-bold" style={botao("#101b3d")}>{t("cancelar")}</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setNovo({ titulo: "", conteudo: "" })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold" style={botao("#0f7a5a")}><Plus size={12} aria-hidden /> {t("ensinar")}</button>
          )}
          {erro && <p role="alert" className="font-semibold" style={{ color: claro ? "#b42318" : "#fca5a5" }}>{erro}</p>}
        </div>
      )}
    </div>
  );
}
