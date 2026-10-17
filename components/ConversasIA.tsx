"use client";
// ═══════════════════════════════════════════════════════════════
// CONVERSAS SALVAS das IAs (José, IA Financeira, IA Tributária, MEI Advisor, Relatórios, Contas a Pagar) — 2026-10-16.
// Antes a conversa vivia só na memória da tela: saiu do módulo, o relatório gerado sumia. Agora cada mensagem
// (e o pedido do relatório, para o cartão voltar ao reabrir) fica em ia_conversa_mensagem, com RLS por empresa
// E por pessoa. A tela continua dona do seu estado: o motor só (1) abre a última conversa ao entrar, (2) salva
// toda mensagem nova sem id assim que a conversa tem uma pergunta da pessoa, (3) dá Nova conversa, lista,
// lixeira e anotação (lápis). Nada é apagado sozinho: o cliente decide.
// ═══════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "../lib/supabaseBrowser";
import * as Sentry from "@sentry/nextjs";
import { assinarHistorico } from "../lib/voz/assinarHistorico";
import type { PedidoTela } from "./RelatorioCFO";

type Lang = "pt" | "en" | "es";
export type LinhaConversa = { id: string; role: "user" | "assistant"; texto: string; relatorio: PedidoTela | null; nota: string | null; assinatura?: string };
type Conversa = { id: string; titulo: string; atualizado_em: string };
// O que o motor precisa saber de cada mensagem da tela (cada tela tem o seu formato)
export type MsgBase = { id?: string; role: string; relatorio?: PedidoTela | null; nota?: string | null };

// Escrita que falha nunca some calada (padrão do Axioma): vai para o Sentry com tabela e operação
const reportarFalhaEscrita = (tabela: string, operacao: string, motivo: string) =>
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });

let sb: ReturnType<typeof createBrowserClient> | null = null;
const cliente = () => (sb ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));

export function useConversaSalva<T extends MsgBase>(p: {
  tela: string; empresaId: string | null | undefined;
  mensagens: T[]; setMensagens: (f: (m: T[]) => T[]) => void;
  textoDe: (m: T) => string; paraTela: (l: LinhaConversa) => T;
  inicio?: () => T[]; // mensagens de boas-vindas da Nova conversa (não são salvas)
  semConversa?: () => void | Promise<void>; // nenhuma conversa salva ainda: a tela mostra o que tinha (ex.: histórico antigo)
}) {
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [lista, setLista] = useState<Conversa[]>([]);
  const [abrindo, setAbrindo] = useState(false);
  const salvando = useRef(new WeakSet<object>());
  const conv = useRef<string | null>(null);
  const criando = useRef<Promise<string | null> | null>(null);
  const ref = useRef(p); ref.current = p;

  const listar = useCallback(async () => {
    if (!p.empresaId) return [] as Conversa[];
    const { data, error } = await cliente().from("ia_conversa").select("id, titulo, atualizado_em").eq("empresa_id", p.empresaId).eq("tela", p.tela).order("atualizado_em", { ascending: false }).limit(50);
    if (error) { reportarFalhaEscrita("ia_conversa", "select", error.message); return [] as Conversa[]; }
    setLista((data ?? []) as Conversa[]);
    return (data ?? []) as Conversa[];
  }, [p.empresaId, p.tela]);

  const abrir = useCallback(async (id: string) => {
    const { empresaId, paraTela, setMensagens } = ref.current;
    setAbrindo(true);
    const { data, error } = await cliente().from("ia_conversa_mensagem").select("id, role, texto, relatorio, nota").eq("conversa_id", id).order("criado_em").limit(500);
    setAbrindo(false);
    if (error) { reportarFalhaEscrita("ia_conversa_mensagem", "select", error.message); return; }
    const linhas = (data ?? []) as LinhaConversa[];
    // Respostas guardadas ganham a assinatura do servidor: o Ouvir fala com a voz do José
    const assin = await assinarHistorico("conversa", empresaId, linhas.map((l) => ({ id: l.id, role: l.role })));
    const msgs = linhas.map((l) => paraTela({ ...l, assinatura: assin[l.id] }));
    msgs.forEach((m) => salvando.current.add(m));
    conv.current = id; setConversaId(id);
    setMensagens(() => msgs);
  }, []);

  // Ao entrar (ou trocar de empresa): abre a última conversa desta tela, se houver
  useEffect(() => {
    if (!p.empresaId) return;
    let vivo = true;
    conv.current = null; setConversaId(null);
    listar().then((l) => { if (!vivo) return; if (l[0]) abrir(l[0].id); else ref.current.semConversa?.(); });
    return () => { vivo = false };
  }, [p.empresaId, p.tela, listar, abrir]);

  // Salva toda mensagem nova (sem id) quando a conversa já tem uma pergunta da pessoa
  useEffect(() => {
    const { mensagens, empresaId, textoDe, setMensagens, tela } = p;
    if (!empresaId || !mensagens.some((m) => m.role === "user")) return;
    const novas = mensagens.filter((m) => !m.id && !salvando.current.has(m) && textoDe(m).trim());
    if (!novas.length) return;
    novas.forEach((m) => salvando.current.add(m));
    (async () => {
      if (!conv.current) {
        criando.current ??= (async () => {
          const titulo = (textoDe(mensagens.find((m) => m.role === "user")!) || "Nova conversa").replace(/\s+/g, " ").trim().slice(0, 80);
          const { data, error } = await cliente().from("ia_conversa").insert({ empresa_id: empresaId, tela, titulo }).select("id").single();
          if (error || !data) { reportarFalhaEscrita("ia_conversa", "insert", error?.message ?? "sem id"); return null; }
          conv.current = data.id as string; setConversaId(conv.current);
          return conv.current;
        })();
        await criando.current; criando.current = null;
      }
      const id = conv.current;
      if (!id) return;
      for (const m of novas) {
        const { data, error } = await cliente().from("ia_conversa_mensagem").insert({ conversa_id: id, empresa_id: empresaId, role: m.role === "user" ? "user" : "assistant", texto: textoDe(m).slice(0, 20000), relatorio: m.relatorio ?? null }).select("id").single();
        if (error || !data) { reportarFalhaEscrita("ia_conversa_mensagem", "insert", error?.message ?? "sem id"); continue; }
        setMensagens((ms) => ms.map((x) => { if (x !== m) return x; const y = { ...x, id: data.id as string }; salvando.current.add(y); return y; }));
      }
      // Só a ordem da lista (trilha): falha vai para o Sentry, a mensagem já está salva
      const { data: tocou, error: eTocou } = await cliente().from("ia_conversa").update({ atualizado_em: new Date().toISOString() }).eq("id", id).select("id");
      if (eTocou || !tocou?.length) reportarFalhaEscrita("ia_conversa", "update", eTocou?.message ?? "0 linhas (RLS?)");
      listar();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.mensagens, p.empresaId, p.tela, listar]);

  const nova = useCallback(() => {
    conv.current = null; setConversaId(null);
    const ini = ref.current.inicio?.() ?? [];
    ini.forEach((m) => salvando.current.add(m));
    ref.current.setMensagens(() => ini);
  }, []);

  const apagarConversa = useCallback(async (id: string) => {
    const { data, error } = await cliente().from("ia_conversa").delete().eq("id", id).select("id");
    if (error || !data?.length) { reportarFalhaEscrita("ia_conversa", "delete", error?.message ?? "0 linhas (RLS?)"); return false; }
    if (conv.current === id) nova();
    await listar();
    return true;
  }, [listar, nova]);

  const anotar = useCallback(async (msgId: string, nota: string) => {
    const { data, error } = await cliente().from("ia_conversa_mensagem").update({ nota: nota.trim() || null }).eq("id", msgId).select("id");
    if (error || !data?.length) { reportarFalhaEscrita("ia_conversa_mensagem", "update", error?.message ?? "0 linhas (RLS?)"); return false; }
    ref.current.setMensagens((ms) => ms.map((m) => (m.id === msgId ? { ...m, nota: nota.trim() || null } : m)));
    return true;
  }, []);

  const apagarMensagem = useCallback(async (msgId: string) => {
    const { data, error } = await cliente().from("ia_conversa_mensagem").delete().eq("id", msgId).select("id");
    if (error || !data?.length) { reportarFalhaEscrita("ia_conversa_mensagem", "delete", error?.message ?? "0 linhas (RLS?)"); return false; }
    ref.current.setMensagens((ms) => ms.filter((m) => m.id !== msgId));
    return true;
  }, []);

  return { conversaId, lista, abrindo, abrir, nova, apagarConversa, anotar, apagarMensagem };
}

export type ConversaSalvaApi = ReturnType<typeof useConversaSalva>;

// Barra das conversas: Nova conversa + lista das anteriores (abrir e lixeira com confirmação na própria tela)
export function BarraConversas({ api, lang, claro }: { api: ConversaSalvaApi; lang: Lang; claro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [aberta, setAberta] = useState(false);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);
  const cTexto = claro ? "#101b3d" : "#c8d8f0", cSuave = claro ? "#4a5a74" : "#8ea3bf";
  const caixa = claro ? { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(16,27,61,0.12)" } : { background: "rgba(2,8,16,0.6)", border: "1px solid rgba(46,204,155,0.18)" };
  const atual = api.lista.find((c) => c.id === api.conversaId);
  const data = (iso: string) => new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => { api.nova(); setAberta(false); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#0f7a5a" }}>
          ＋ {L("Nova conversa", "New conversation", "Nueva conversación")}
        </button>
        <button type="button" onClick={() => setAberta((a) => !a)} aria-expanded={aberta} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#101b3d" }}>
          🗂 {L("Conversas salvas", "Saved conversations", "Conversaciones guardadas")} ({api.lista.length}) {aberta ? "▴" : "▾"}
        </button>
        <span className="text-xs truncate max-w-full" style={{ color: cSuave }}>
          {api.abrindo ? L("Abrindo…", "Opening…", "Abriendo…") : atual ? `${L("Conversa", "Conversation", "Conversación")}: ${atual.titulo}` : L("Conversa nova (salva quando você perguntar)", "New conversation (saved when you ask)", "Conversación nueva (se guarda al preguntar)")}
        </span>
      </div>
      {falhou && <p className="mt-2 text-xs" role="alert" style={{ color: "#f87171" }}>{L("Não foi possível apagar a conversa agora. Ela continua salva; tente de novo.", "Could not delete the conversation now. It is still saved; try again.", "No fue posible borrar la conversación ahora. Sigue guardada; intente de nuevo.")}</p>}
      {aberta && (
        <div className="mt-2 rounded-lg p-2 max-h-64 overflow-y-auto" style={caixa}>
          {api.lista.length === 0 && <p className="text-xs p-2" style={{ color: cSuave }}>{L("Nenhuma conversa salva ainda. Pergunte algo e ela fica guardada aqui.", "No saved conversations yet. Ask something and it will be kept here.", "Aún no hay conversaciones guardadas. Pregunte algo y quedará guardada aquí.")}</p>}
          {api.lista.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: c.id === api.conversaId ? "rgba(46,204,155,0.12)" : "transparent" }}>
              <button type="button" onClick={() => { api.abrir(c.id); setAberta(false); }} className="flex-1 min-w-0 text-left">
                <span className="block text-sm truncate" style={{ color: cTexto }}>{c.titulo}</span>
                <span className="block text-[11px]" style={{ color: cSuave }}>{data(c.atualizado_em)}</span>
              </button>
              {confirmar === c.id ? (
                <span className="flex items-center gap-1 text-xs">
                  <span style={{ color: cSuave }}>{L("Apagar?", "Delete?", "¿Borrar?")}</span>
                  <button type="button" onClick={async () => { setFalhou(!(await api.apagarConversa(c.id))); setConfirmar(null); }} className="px-2 py-1 rounded text-white font-semibold" style={{ background: "#b02a2a" }}>{L("Sim", "Yes", "Sí")}</button>
                  <button type="button" onClick={() => setConfirmar(null)} className="px-2 py-1 rounded text-white font-semibold" style={{ background: "#101b3d" }}>{L("Não", "No", "No")}</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmar(c.id)} title={L("Apagar conversa", "Delete conversation", "Borrar conversación")} aria-label={L("Apagar conversa", "Delete conversation", "Borrar conversación")} className="px-2 py-1 rounded text-sm" style={{ color: "#f87171" }}>🗑</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
