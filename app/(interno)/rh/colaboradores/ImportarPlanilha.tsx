"use client";
// Importar colaboradores por planilha (CSV ou Excel). Baixar modelo → escolher arquivo → prévia com o erro de cada
// linha → importar só as válidas, em lotes de 200 (rh_importar_colaboradores: cada linha entra inteira ou não entra)
// → resultado com planilha dos erros para corrigir e importar de novo. Regras: lib/rhImportacao.ts (mesmas do banco).
import { useState, type CSSProperties } from "react";
import * as XLSX from "xlsx";
import { X, Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { createBrowserClient } from "../../../../lib/supabaseBrowser";
import { CanvasBox } from "../../../../components/CanvasBox";
import { lerTodas } from "../../../../lib/lerTodas";
import { exportarPlanilha, exportarPlanilhaAbas } from "../../../../lib/exportarPlanilha";
import { COLUNAS, mapearCabecalho, validarLinhas, chaveNome, type Resultado } from "../../../../lib/rhImportacao";
import { mensagemErroRh, type Lang } from "../../../../lib/rhEstrutura";
import { hojeISO } from "../../../../lib/datas";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const LOTE = 200;

export default function ImportarPlanilha({ empresaId, lang, temaClaro, podePessoais, podeSalario, aoFechar, aoImportar }: {
  empresaId: string; lang: Lang; temaClaro: boolean; podePessoais: boolean; podeSalario: boolean; aoFechar: () => void; aoImportar: () => void;
}) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const TEXTO_SEC = temaClaro ? "#374151" : "var(--axi-text-secondary)";
  const BORDA = temaClaro ? "rgba(16,27,61,0.12)" : "rgba(163,177,194,0.15)";
  const BTN = temaClaro ? "linear-gradient(135deg, #0b5f46, #0f7a5a)" : "linear-gradient(135deg, #0a4f3b, #0f7d5c)";
  const NAVY = "#101b3d";
  const cel: CSSProperties = { borderBottom: `1px solid ${BORDA}`, padding: "6px 8px", fontSize: 13, verticalAlign: "top" };
  const [etapa, setEtapa] = useState<"escolher" | "previa" | "importando" | "fim">("escolher");
  const [msg, setMsg] = useState<string | null>(null);
  const [res, setRes] = useState<Resultado[]>([]);
  const [avisoCab, setAvisoCab] = useState<string | null>(null);
  const [progresso, setProgresso] = useState({ feito: 0, total: 0 });
  const [final, setFinal] = useState({ ok: 0, falhas: [] as { linha: number; nome: string; erro: string }[] });

  function baixarModelo() {
    const exemplo = Object.fromEntries(COLUNAS.map((c) => [c.titulo, c.exemplo]));
    exportarPlanilhaAbas([
      { nome: L("Colaboradores", "Employees", "Colaboradores"), linhas: [exemplo] },
      { nome: L("Instruções", "Instructions", "Instrucciones"), linhas: COLUNAS.map((c) => ({ [L("Coluna", "Column", "Columna")]: c.titulo, [L("Obrigatória", "Required", "Obligatoria")]: c.obrigatoria ? L("sim", "yes", "sí") : "", [L("Como preencher", "How to fill", "Cómo completar")]: c.ajuda[lang], [L("Exemplo", "Example", "Ejemplo")]: c.exemplo })) },
    ], "axioma-modelo-importacao-colaboradores");
  }

  async function lerArquivo(arq: File) {
    setMsg(L("Lendo a planilha…", "Reading the spreadsheet…", "Leyendo la planilla…"));
    try {
      const wb = XLSX.read(await arq.arrayBuffer(), { type: "array" });
      const linhas = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: "" });
      const ini = linhas.findIndex((l) => l.some((c) => String(c).trim()));
      if (ini < 0) { setMsg(L("A planilha está vazia.", "The spreadsheet is empty.", "La planilla está vacía.")); return; }
      const cab = mapearCabecalho(linhas[ini]);
      if (cab.faltando.length) { setMsg(L(`Faltam colunas obrigatórias: ${cab.faltando.join(", ")}. Use o modelo.`, `Missing required columns: ${cab.faltando.join(", ")}. Use the template.`, `Faltan columnas obligatorias: ${cab.faltando.join(", ")}. Use el modelo.`)); return; }
      setAvisoCab(cab.desconhecidas.length ? L(`Colunas ignoradas (nome não reconhecido): ${cab.desconhecidas.join(", ")}`, `Ignored columns (name not recognized): ${cab.desconhecidas.join(", ")}`, `Columnas ignoradas (nombre no reconocido): ${cab.desconhecidas.join(", ")}`) : null);
      const dados = linhas.slice(ini + 1).map((l, i) => ({ i, o: Object.fromEntries(cab.mapa.map((k, j) => [k, l[j]]).filter(([k]) => k)) as Record<string, unknown> }))
        .filter(({ o }) => Object.values(o).some((v) => String(v ?? "").trim()) && !/\(EXEMPLO\)\s*$/i.test(String(o.nome ?? "")));
      if (!dados.length) { setMsg(L("Nenhuma linha para importar (a linha de exemplo do modelo é ignorada).", "No rows to import (the template example row is ignored).", "Ninguna fila para importar (la fila de ejemplo se ignora).")); return; }
      // contexto: o que já existe na Empresa (para não repetir matrícula/CPF e ligar cargo e departamento pelo nome)
      const [cg, dp, cat, mats, cpfs] = await Promise.all([
        supabase.from("rh_cargos").select("id, nome").eq("empresa_id", empresaId).is("excluido_em", null),
        supabase.from("rh_departamentos").select("id, nome").eq("empresa_id", empresaId).is("excluido_em", null),
        supabase.from("esocial_tab01_categoria").select("codigo").is("termino", null),
        lerTodas(() => supabase.from("rh_contratos").select("matricula").eq("empresa_id", empresaId).order("id")),
        podePessoais ? lerTodas(() => supabase.from("rh_colaborador_pessoal").select("cpf").eq("empresa_id", empresaId).order("colaborador_id")) : Promise.resolve({ data: [], error: null }),
      ]);
      const falha = [cg, dp, cat, mats, cpfs].find((r) => r.error);
      if (falha?.error) { setMsg(L("Não foi possível conferir os cadastros agora. Tente de novo.", "Could not check existing records now. Try again.", "No se pudieron verificar los registros ahora. Intente de nuevo.")); return; }
      const ctx = { hoje: hojeISO(), cargos: new Map((cg.data ?? []).map((x: { id: string; nome: string }) => [chaveNome(x.nome), x.id])), deps: new Map((dp.data ?? []).map((x: { id: string; nome: string }) => [chaveNome(x.nome), x.id])),
        categorias: new Set((cat.data ?? []).map((x: { codigo: string }) => x.codigo)), matriculas: new Set((mats.data ?? []).map((x: { matricula: string }) => String(x.matricula).toLowerCase())),
        cpfs: new Set((cpfs.data ?? []).map((x: { cpf: string }) => x.cpf)), podePessoais, podeSalario };
      const r = validarLinhas(dados.map((d) => d.o), ctx, ini + 2).map((x, k) => ({ ...x, linha: ini + 2 + dados[k].i }));
      setRes(r); setMsg(null); setEtapa("previa");
    } catch {
      setMsg(L("Não consegui ler este arquivo. Salve como .xlsx ou .csv e tente de novo.", "Could not read this file. Save as .xlsx or .csv and try again.", "No pude leer este archivo. Guárdelo como .xlsx o .csv e intente de nuevo."));
    }
  }

  async function importar() {
    const validas = res.filter((r) => r.pronta);
    setEtapa("importando"); setProgresso({ feito: 0, total: validas.length });
    let ok = 0; const falhas: { linha: number; nome: string; erro: string }[] = [];
    for (let i = 0; i < validas.length; i += LOTE) {
      const lote = validas.slice(i, i + LOTE);
      const { data, error } = await supabase.rpc("rh_importar_colaboradores", { p_empresa: empresaId, p_linhas: lote.map((r) => r.pronta) });
      if (error) { lote.forEach((r) => falhas.push({ linha: r.linha, nome: r.nome, erro: mensagemErroRh(error, lang) })); }
      else (data as { i: number; ok: boolean; codigo?: string; erro?: string }[]).forEach((d) => {
        const r = lote[d.i - 1];
        if (d.ok) ok++; else falhas.push({ linha: r.linha, nome: r.nome, erro: mensagemErroRh({ code: d.codigo, message: d.erro }, lang) });
      });
      setProgresso({ feito: Math.min(validas.length, i + LOTE), total: validas.length });
    }
    setFinal({ ok, falhas }); setEtapa("fim");
    if (ok) aoImportar();
  }

  function baixarErros() {
    const linhas = [
      ...res.filter((r) => !r.pronta).map((r) => ({ [L("Linha", "Row", "Fila")]: r.linha, [L("Nome", "Name", "Nombre")]: r.nome, [L("Problema", "Problem", "Problema")]: r.erros.map((e) => e[lang]).join("; ") })),
      ...final.falhas.map((f) => ({ [L("Linha", "Row", "Fila")]: f.linha, [L("Nome", "Name", "Nombre")]: f.nome, [L("Problema", "Problem", "Problema")]: f.erro })),
    ];
    exportarPlanilha(linhas, "axioma-importacao-colaboradores-erros", L("Erros", "Errors", "Errores"), "xlsx");
  }

  const validas = res.filter((r) => r.pronta).length, comErro = res.length - validas, comAviso = res.filter((r) => r.pronta && r.avisos.length).length;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 px-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-4xl">
        <CanvasBox cor={temaClaro ? "#0f7a5a" : "#2ecc9b"} {...(temaClaro ? { fundo: "#f6f7c4", premium3d: true } : { premium3d: true })}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }}>AXIOMA · RH</p>
              <h3 className="text-lg font-bold" style={{ color: "var(--axi-text-primary)" }}>{L("Importar colaboradores por planilha", "Import employees from a spreadsheet", "Importar colaboradores por planilla")}</h3>
            </div>
            {etapa !== "importando" && <button onClick={aoFechar} aria-label={L("Fechar", "Close", "Cerrar")} style={{ color: TEXTO_SEC }}><X size={20} /></button>}
          </div>

          {etapa === "escolher" && (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: "var(--axi-text-primary)" }}>{L("1. Baixe o modelo, preencha uma pessoa por linha (a linha de exemplo é ignorada). 2. Escolha o arquivo (.xlsx ou .csv). 3. Confira a prévia: nada é gravado antes de você confirmar.", "1. Download the template, one person per row (the example row is ignored). 2. Choose the file (.xlsx or .csv). 3. Check the preview: nothing is saved before you confirm.", "1. Descargue el modelo, una persona por fila (la fila de ejemplo se ignora). 2. Elija el archivo (.xlsx o .csv). 3. Revise la vista previa: nada se guarda antes de confirmar.")}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={baixarModelo} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: temaClaro ? NAVY : "rgba(255,255,255,0.08)", color: "#fff" }}><Download size={16} /> {L("Baixar modelo", "Download template", "Descargar modelo")}</button>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer" style={{ background: BTN, color: "#fff" }}>
                  <Upload size={16} /> {L("Escolher planilha", "Choose spreadsheet", "Elegir planilla")}
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void lerArquivo(f); e.target.value = ""; }} />
                </label>
              </div>
              {!podePessoais && <p className="text-xs" style={{ color: TEXTO_SEC }}>{L("Você não tem liberação de dados pessoais: CPF e endereço da planilha ficam de fora.", "You do not have personal-data access: CPF and address are left out.", "No tiene acceso a datos personales: CPF y dirección quedan fuera.")}</p>}
              {!podeSalario && <p className="text-xs" style={{ color: TEXTO_SEC }}>{L("Você não tem liberação de salário: o salário da planilha fica de fora.", "You do not have salary access: salary is left out.", "No tiene acceso a salario: el salario queda fuera.")}</p>}
              {msg && <p className="text-sm font-semibold" style={{ color: "#b45309" }}>{msg}</p>}
            </div>
          )}

          {etapa === "previa" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 text-sm font-bold">
                <span style={{ color: "#0f7a5a" }}><CheckCircle2 size={15} className="inline mr-1" />{L(`${validas} prontas para importar`, `${validas} ready to import`, `${validas} listas para importar`)}</span>
                {comAviso > 0 && <span style={{ color: TEXTO_SEC }}>{L(`${comAviso} com aviso`, `${comAviso} with warnings`, `${comAviso} con aviso`)}</span>}
                {comErro > 0 && <span style={{ color: "#dc2626" }}><AlertTriangle size={15} className="inline mr-1" />{L(`${comErro} com erro (não entram)`, `${comErro} with errors (not imported)`, `${comErro} con error (no entran)`)}</span>}
              </div>
              {avisoCab && <p className="text-xs" style={{ color: TEXTO_SEC }}>{avisoCab}</p>}
              <div className="overflow-auto max-h-[45vh] rounded-lg" style={{ border: `1px solid ${BORDA}` }}>
                <table className="w-full min-w-[560px]">
                  <thead><tr>{[L("Linha", "Row", "Fila"), L("Nome", "Name", "Nombre"), L("Situação", "Status", "Situación")].map((h) => <th key={h} className="text-left text-xs uppercase" style={{ ...cel, color: TEXTO_SEC }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[...res].sort((a, b) => Number(!!a.pronta) - Number(!!b.pronta)).slice(0, 300).map((r) => (
                      <tr key={r.linha}>
                        <td style={{ ...cel, color: TEXTO_SEC }}>{r.linha}</td>
                        <td style={{ ...cel, color: "var(--axi-text-primary)", fontWeight: 600 }}>{r.nome}</td>
                        <td style={cel}>
                          {r.pronta ? <span style={{ color: "#0f7a5a", fontWeight: 700 }}>{L("Pronta", "Ready", "Lista")}</span> : <span style={{ color: "#dc2626", fontWeight: 700 }}>{r.erros.map((e) => e[lang]).join(" · ")}</span>}
                          {r.avisos.length > 0 && <span className="block text-xs" style={{ color: TEXTO_SEC }}>{r.avisos.map((a) => a[lang]).join(" · ")}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {res.length > 300 && <p className="text-xs" style={{ color: TEXTO_SEC }}>{L(`Mostrando 300 de ${res.length} (as com erro primeiro). Baixe a planilha de erros para ver todas.`, `Showing 300 of ${res.length} (errors first). Download the error sheet to see all.`, `Mostrando 300 de ${res.length} (con error primero). Descargue la planilla de errores para ver todas.`)}</p>}
              <div className="flex flex-wrap gap-2">
                <button disabled={!validas} onClick={() => void importar()} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: validas ? BTN : "#6b7280", color: "#fff" }}>{L(`Importar ${validas} colaborador(es)`, `Import ${validas} employee(s)`, `Importar ${validas} colaborador(es)`)}</button>
                {comErro > 0 && <button onClick={baixarErros} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: temaClaro ? NAVY : "rgba(255,255,255,0.08)", color: "#fff" }}>{L("Baixar planilha de erros", "Download error sheet", "Descargar planilla de errores")}</button>}
                <button onClick={() => { setRes([]); setEtapa("escolher"); }} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ color: TEXTO_SEC, border: `1px solid ${BORDA}` }}>{L("Escolher outro arquivo", "Choose another file", "Elegir otro archivo")}</button>
              </div>
            </div>
          )}

          {etapa === "importando" && (
            <div className="py-6">
              <p className="text-sm font-bold mb-2" style={{ color: "var(--axi-text-primary)" }}>{L(`Importando ${progresso.feito} de ${progresso.total}…`, `Importing ${progresso.feito} of ${progresso.total}…`, `Importando ${progresso.feito} de ${progresso.total}…`)}</p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: BORDA }}><div className="h-full" style={{ width: `${progresso.total ? (progresso.feito / progresso.total) * 100 : 0}%`, background: "#0f7a5a" }} /></div>
              <p className="text-xs mt-2" style={{ color: TEXTO_SEC }}>{L("Não feche esta janela.", "Do not close this window.", "No cierre esta ventana.")}</p>
            </div>
          )}

          {etapa === "fim" && (
            <div className="space-y-3">
              <p className="text-sm font-bold" style={{ color: "#0f7a5a" }}>{L(`${final.ok} colaborador(es) importado(s).`, `${final.ok} employee(s) imported.`, `${final.ok} colaborador(es) importado(s).`)}</p>
              {(final.falhas.length > 0 || comErro > 0) && <p className="text-sm font-bold" style={{ color: "#dc2626" }}>{L(`${final.falhas.length + comErro} linha(s) não entraram. Baixe a planilha de erros, corrija e importe só essas.`, `${final.falhas.length + comErro} row(s) were not imported. Download the error sheet, fix and import only those.`, `${final.falhas.length + comErro} fila(s) no entraron. Descargue la planilla de errores, corrija e importe solo esas.`)}</p>}
              <div className="flex flex-wrap gap-2">
                {(final.falhas.length > 0 || comErro > 0) && <button onClick={baixarErros} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: temaClaro ? NAVY : "rgba(255,255,255,0.08)", color: "#fff" }}>{L("Baixar planilha de erros", "Download error sheet", "Descargar planilla de errores")}</button>}
                <button onClick={aoFechar} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: BTN, color: "#fff" }}>{L("Concluir", "Done", "Listo")}</button>
              </div>
            </div>
          )}
        </CanvasBox>
      </div>
    </div>
  );
}
