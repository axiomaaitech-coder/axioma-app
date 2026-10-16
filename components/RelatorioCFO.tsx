"use client";
// Relatório CFO (Plano 3, Tarefa 2): escolhe tipo e período, gera no servidor (/api/relatorios/gerar — login,
// empresa pela RLS, operador barrado), mostra a prévia e baixa o PDF. Tela e PDF leem a MESMA estrutura:
// nada é recalculado aqui, só formatado. O PDF é montado no navegador, sem arquivo guardado nem link público.
import { useEffect, useState } from "react";
import { CanvasBox } from "./CanvasBox";
import { TIPOS_RELATORIO, type Relatorio, type TipoRelatorio } from "../lib/financeiro/relatorioTipos";
import { dataHoraNoFuso, fmtCelula, formatarIndicador, nomePeriodo, rotuloClasse, rotuloConfianca, rotuloEstado, rotuloPrioridade, tituloRelatorio, tx } from "../lib/financeiro/relatorioTextos";

type Lang = "pt" | "en" | "es";
const PERIODOS = ["este_mes", "mes_anterior", "esta_semana", "semana_anterior", "ultimos_30_dias", "este_trimestre", "trimestre_anterior", "este_ano", "ano_anterior", "ultimos_12_meses", "personalizado"];
export type PedidoTela = { tipo: TipoRelatorio; periodo: string; inicio: string | null; fim: string | null; comparar: boolean };

// Link para abrir esta tela já com o relatório pedido no chat (José, IA Financeira, Relatórios)
export const linkRelatorio = (p: PedidoTela) =>
  `/relatorios?${new URLSearchParams({ rel: p.tipo, periodo: p.periodo, ...(p.inicio ? { inicio: p.inicio } : {}), ...(p.fim ? { fim: p.fim } : {}), ...(p.comparar ? { comparar: "1" } : {}) })}#relatorio-cfo`;

export default function RelatorioCFO({ empresaId, lang, claro }: { empresaId: string | null; lang: Lang; claro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [tipo, setTipo] = useState<TipoRelatorio>("executivo");
  const [periodo, setPeriodo] = useState("este_mes");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [comparar, setComparar] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [rel, setRel] = useState<Relatorio | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [pedidoUrl, setPedidoUrl] = useState<PedidoTela | null>(null);

  // Cores: Escuro = fundação; Claro = navy + menta escuro, caixa aninhada bege, campo branco
  const cTexto = claro ? "#101b3d" : "#c8d8f0", cSuave = claro ? "#4a5a74" : "#5a7a9a", cValor = claro ? "#0f7a5a" : "#2ecc9b", cNeg = claro ? "#b02a2a" : "#f87171";
  const caixa = claro ? { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(16,27,61,0.12)" } : { background: "rgba(2,8,16,0.6)", border: "1px solid rgba(46,204,155,0.18)" };
  const campo = { background: claro ? "#ffffff" : "rgba(2,8,16,0.7)", color: cTexto, border: claro ? "1px solid rgba(16,27,61,0.25)" : "1px solid rgba(46,204,155,0.2)" };

  // Pedido vindo do chat (link "Abrir relatório e PDF"): preenche e gera sozinho
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      const t = q.get("rel")
      if (!t || !(TIPOS_RELATORIO as readonly string[]).includes(t)) return
      const p = { tipo: t as TipoRelatorio, periodo: PERIODOS.includes(q.get("periodo") ?? "") ? q.get("periodo")! : "este_mes", inicio: q.get("inicio"), fim: q.get("fim"), comparar: q.get("comparar") === "1" }
      setTipo(p.tipo); setPeriodo(p.periodo); setInicio(p.inicio ?? ""); setFim(p.fim ?? ""); setComparar(p.comparar); setPedidoUrl(p)
    } catch { /* sem pedido na URL */ }
  }, []);
  useEffect(() => {
    if (pedidoUrl && empresaId) { gerar(pedidoUrl); setPedidoUrl(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoUrl, empresaId]);

  async function gerar(p: PedidoTela = { tipo, periodo, inicio: inicio || null, fim: fim || null, comparar }) {
    if (!empresaId) { setErro(L("Escolha a Empresa ativa antes de gerar o relatório.", "Choose the active Company before generating the report.", "Elija la Empresa activa antes de generar el informe.")); return }
    if (p.periodo === "personalizado" && (!p.inicio || !p.fim)) { setErro(L("Preencha a data inicial e a final.", "Fill in the start and end dates.", "Complete la fecha inicial y la final.")); return }
    setCarregando(true); setErro(null)
    try {
      const res = await fetch("/api/relatorios/gerar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empresa_id: empresaId, ...p, lang }) })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.relatorio) { setRel(j.relatorio as Relatorio); return }
      setRel(null)
      setErro(typeof j?.mensagem === "string" ? j.mensagem
        : res.status === 401 ? L("Sua sessão terminou. Entre de novo para gerar o relatório.", "Your session ended. Sign in again to generate the report.", "Su sesión terminó. Ingrese de nuevo para generar el informe.")
        : res.status === 404 ? L("Empresa não encontrada para o seu acesso.", "Company not found for your access.", "Empresa no encontrada para su acceso.")
        : L("Não foi possível gerar agora. Tente de novo em instantes.", "Could not generate now. Try again in a moment.", "No fue posible generar ahora. Intente de nuevo en instantes."))
    } catch {
      setErro(L("Sem conexão com o servidor. Confira a internet e tente de novo.", "No connection to the server. Check the internet and try again.", "Sin conexión con el servidor. Revise internet e intente de nuevo."))
    } finally { setCarregando(false) }
  }

  async function baixarPdf() {
    if (!rel) return
    setGerandoPdf(true)
    try {
      const { montarPdfRelatorio, nomeArquivoRelatorio } = await import("../lib/financeiro/relatorioPdf")
      montarPdfRelatorio(rel).save(nomeArquivoRelatorio(rel))
    } catch {
      setErro(L("O PDF não pôde ser montado neste navegador. Tente de novo ou use outro navegador.", "The PDF could not be built in this browser. Try again or use another browser.", "El PDF no pudo generarse en este navegador. Intente de nuevo o use otro navegador."))
    } finally { setGerandoPdf(false) }
  }

  const corPrioridade = (p: string) => (p === "alta" ? cNeg : p === "media" ? (claro ? "#965f00" : "#f0b45a") : cSuave)

  return (
    <div id="relatorio-cfo" className="mb-5">
      <CanvasBox premium3d fundo={claro ? "#f6f7c4" : undefined} cor="#2ecc9b">
        <h2 className="text-base font-bold" style={{ color: cTexto }}>📑 {L("Relatório CFO com PDF", "CFO Report with PDF", "Informe CFO con PDF")}</h2>
        <p className="text-xs mt-1 mb-4" style={{ color: cSuave }}>
          {L("Escolha o relatório e o período. Os números vêm das mesmas consultas da Inteligência Axioma; o PDF mostra exatamente o que aparece aqui.", "Choose the report and the period. Numbers come from the same queries as Axioma Intelligence; the PDF shows exactly what appears here.", "Elija el informe y el período. Los números vienen de las mismas consultas de la Inteligencia Axioma; el PDF muestra exactamente lo que aparece aquí.")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <label className="text-xs flex flex-col gap-1" style={{ color: cSuave }}>
            {L("Relatório", "Report", "Informe")}
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoRelatorio)} className="px-3 py-2 rounded-lg text-sm" style={campo}>
              {TIPOS_RELATORIO.map((t) => <option key={t} value={t}>{tituloRelatorio(t, lang)}</option>)}
            </select>
          </label>
          <label className="text-xs flex flex-col gap-1" style={{ color: cSuave }}>
            {L("Período", "Period", "Período")}
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={campo}>
              {PERIODOS.map((p) => <option key={p} value={p}>{nomePeriodo(p, lang)}</option>)}
            </select>
          </label>
          {periodo === "personalizado" ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs flex flex-col gap-1" style={{ color: cSuave }}>{L("De", "From", "Desde")}
                <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="px-2 py-2 rounded-lg text-sm" style={campo} /></label>
              <label className="text-xs flex flex-col gap-1" style={{ color: cSuave }}>{L("Até", "To", "Hasta")}
                <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="px-2 py-2 rounded-lg text-sm" style={campo} /></label>
            </div>
          ) : (
            <label className="text-sm flex items-center gap-2 py-2" style={{ color: cTexto }}>
              <input type="checkbox" checked={comparar} onChange={(e) => setComparar(e.target.checked)} className="w-4 h-4" />
              {L("Comparar com o período anterior", "Compare with the previous period", "Comparar con el período anterior")}
            </label>
          )}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => gerar()} disabled={carregando} className="px-4 py-2 rounded-lg text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2" style={{ background: carregando ? "#5f7f74" : "#0f7a5a" }}>
              {carregando ? L("Gerando…", "Generating…", "Generando…") : L("Gerar relatório", "Generate report", "Generar informe")}
            </button>
            {rel && (
              <button onClick={baixarPdf} disabled={gerandoPdf} className="px-4 py-2 rounded-lg text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2" style={{ background: gerandoPdf ? "#4a5470" : "#101b3d", border: claro ? "none" : "1px solid rgba(46,204,155,0.4)" }}>
                {gerandoPdf ? L("Montando PDF…", "Building PDF…", "Generando PDF…") : L("Baixar PDF", "Download PDF", "Descargar PDF")}
              </button>
            )}
          </div>
        </div>
        {periodo === "personalizado" && (
          <label className="text-sm flex items-center gap-2 mt-3" style={{ color: cTexto }}>
            <input type="checkbox" checked={comparar} onChange={(e) => setComparar(e.target.checked)} className="w-4 h-4" />
            {L("Comparar com o período anterior", "Compare with the previous period", "Comparar con el período anterior")}
          </label>
        )}

        {erro && (
          <div role="alert" className="mt-4 rounded-lg p-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2" style={{ background: claro ? "rgba(176,42,42,0.08)" : "rgba(248,113,113,0.1)", border: `1px solid ${cNeg}55`, color: cNeg }}>
            <span className="flex-1">{erro}</span>
            <button onClick={() => gerar()} className="px-3 py-1.5 rounded-md text-xs font-semibold text-white self-start" style={{ background: "#101b3d" }}>{L("Tentar de novo", "Try again", "Intentar de nuevo")}</button>
          </div>
        )}
      </CanvasBox>

      {rel && !carregando && (
        <div className="mt-4">
          <CanvasBox premium3d fundo={claro ? "#f6f7c4" : undefined} cor="#2ecc9b">
            <h3 className="text-lg font-bold" style={{ color: cTexto }}>{rel.titulo}</h3>
            <p className="text-xs mt-1" style={{ color: cSuave }}>
              {rel.empresa.nome}{rel.periodo ? ` — ${rel.periodo.rotulo}` : ""}{rel.comparado_com ? ` — ${L("comparado com", "compared with", "comparado con")} ${rel.comparado_com}` : ""}
            </p>
            <p className="text-xs mt-0.5" style={{ color: cSuave }}>{L("Gerado em", "Generated on", "Generado el")} {dataHoraNoFuso(rel.gerado_em, rel.fuso, lang)}</p>
            <p className="text-xs font-semibold mt-2" style={{ color: rel.estado === "verificado" ? cValor : (claro ? "#965f00" : "#f0b45a") }}>
              {L("Situação dos dados", "Data status", "Situación de los datos")}: {rotuloEstado(rel.estado, lang)}
            </p>

            {rel.resumo.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-bold mb-2" style={{ color: cTexto }}>{tx(lang, "resumo")}</h4>
                <ul className="space-y-1 text-sm list-disc pl-5" style={{ color: cTexto }}>{rel.resumo.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}

            {rel.secoes.map((s) => (
              <section key={s.id} className="mt-5">
                <h4 className="text-sm font-bold mb-2" style={{ color: cTexto }}>{s.titulo}</h4>
                {s.tipo === "texto" && s.paragrafos.map((p, i) => <p key={i} className="text-sm" style={{ color: cTexto }}>{p}</p>)}
                {s.tipo === "indicadores" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {s.itens.map((it, i) => (
                      <div key={i} className="rounded-lg p-3" style={caixa}>
                        <p className="text-xs" style={{ color: cSuave }}>{it.rotulo} <span className="opacity-80">· {rotuloClasse(it.classe, lang)}</span></p>
                        <p className="text-base font-bold mt-0.5" style={{ color: it.valor == null ? cSuave : it.unidade === "BRL" && it.valor < 0 ? cNeg : cValor }}>
                          {it.valor == null ? L("não consultado", "not queried", "no consultado") : formatarIndicador(it, lang)}
                        </p>
                        {it.anterior !== undefined && (
                          <p className="text-xs mt-0.5" style={{ color: cSuave }}>
                            {L("anterior", "previous", "anterior")} {formatarIndicador({ valor: it.anterior ?? null, unidade: it.unidade }, lang)}
                            {it.variacao_pct != null ? ` (${it.variacao_pct > 0 ? "+" : ""}${fmtCelula(it.variacao_pct, "pct", lang)})` : ` ${L("(sem base para %)", "(no base for %)", "(sin base para %)")}`}
                          </p>
                        )}
                        {it.nota && it.anterior === undefined && <p className="text-xs mt-0.5" style={{ color: cSuave }}>{it.nota}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {s.tipo === "tabela" && (s.linhas.length === 0
                  ? <p className="text-sm" style={{ color: cSuave }}>{s.vazio}</p>
                  : (
                    <div className="overflow-x-auto rounded-lg" style={caixa}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: "#101b3d" }}>
                            {s.colunas.map((c, i) => <th key={i} className={`px-3 py-2 font-semibold text-white whitespace-nowrap ${c.tipo === "texto" || c.tipo === "data" ? "text-left" : "text-right"}`}>{c.rotulo}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {[...s.linhas, ...(s.total ? [s.total] : [])].map((l, k) => (
                            <tr key={k} style={{ borderTop: claro ? "1px solid rgba(16,27,61,0.08)" : "1px solid rgba(46,204,155,0.08)", fontWeight: s.total && k === s.linhas.length ? 700 : 400 }}>
                              {l.map((v, i) => {
                                const t = s.colunas[i].tipo
                                const neg = (t === "moeda" || t === "pct") && typeof v === "number" && v < 0
                                return <td key={i} className={`px-3 py-1.5 ${t === "texto" || t === "data" ? "text-left" : "text-right whitespace-nowrap"}`} style={{ color: neg ? cNeg : cTexto }}>{fmtCelula(v, t, lang)}</td>
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
              </section>
            ))}

            <section className="mt-5">
              <h4 className="text-sm font-bold mb-2" style={{ color: cTexto }}>{tx(lang, "riscos")} · {tx(lang, "recomendacoes")}</h4>
              {rel.achados.length === 0
                ? <p className="text-sm" style={{ color: cSuave }}>{L("Nenhuma regra de risco disparou com os números deste relatório.", "No risk rule was triggered by the numbers in this report.", "Ninguna regla de riesgo se activó con los números de este informe.")}</p>
                : (
                  <div className="space-y-2">
                    {rel.achados.map((a, i) => (
                      <div key={i} className="rounded-lg p-3" style={caixa}>
                        <p className="text-sm font-bold" style={{ color: corPrioridade(a.prioridade) }}>{a.titulo}</p>
                        <p className="text-xs" style={{ color: cSuave }}>{rotuloPrioridade(a.prioridade, lang)} · {rotuloClasse(a.tipo, lang)} · {rotuloConfianca(a.confianca, lang)}</p>
                        <p className="text-sm mt-1" style={{ color: cTexto }}>{L("Evidência", "Evidence", "Evidencia")}: {a.evidencia}</p>
                        {a.recomendacao && <p className="text-sm mt-1 font-semibold" style={{ color: cValor }}>{L("Recomendação", "Recommendation", "Recomendación")}: {a.recomendacao}</p>}
                      </div>
                    ))}
                  </div>
                )}
            </section>

            {rel.limitacoes.length > 0 && (
              <section className="mt-5">
                <h4 className="text-sm font-bold mb-2" style={{ color: cTexto }}>{tx(lang, "limitacoes")}</h4>
                <ul className="space-y-1 text-sm list-disc pl-5" style={{ color: cTexto }}>{rel.limitacoes.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </section>
            )}

            <details className="mt-5">
              <summary className="text-sm font-bold cursor-pointer" style={{ color: cTexto }}>{tx(lang, "metodologia")}</summary>
              <p className="text-xs mt-2" style={{ color: cSuave }}>{L("Fontes no Axioma", "Sources in Axioma", "Fuentes en Axioma")}: {rel.fontes.join(", ")}.</p>
              <ul className="space-y-1 text-xs list-disc pl-5 mt-1" style={{ color: cSuave }}>{rel.metodologia.map((s, i) => <li key={i}>{s}</li>)}</ul>
              <p className="text-[11px] mt-2 break-all" style={{ color: cSuave }}>{L("Referências das consultas", "Query references", "Referencias de las consultas")}: {rel.refs.join(" · ")}</p>
            </details>
          </CanvasBox>
        </div>
      )}
    </div>
  );
}

// Botão que aparece na resposta do chat quando a IA gerou um relatório: abre esta tela já com ele e o PDF
export function BotaoAbrirRelatorio({ pedido, lang }: { pedido: PedidoTela | null | undefined; lang: Lang }) {
  if (!pedido || !(TIPOS_RELATORIO as readonly string[]).includes(pedido.tipo)) return null
  return (
    <a href={linkRelatorio(pedido)} className="inline-block mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#0f7a5a" }}>
      📑 {lang === "en" ? "Open report and PDF" : lang === "es" ? "Abrir informe y PDF" : "Abrir relatório e PDF"}
    </a>
  )
}
