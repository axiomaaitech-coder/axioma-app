// Baixar tabela em Excel (.xlsx) ou CSV — uma função pra todo módulo (antes só o Estoque tinha).
import * as XLSX from "xlsx";

export function exportarPlanilha(linhas: Record<string, string | number>[], nomeArquivo: string, aba: string, formato: "xlsx" | "csv") {
  const ws = XLSX.utils.json_to_sheet(linhas);
  if (formato === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, aba.slice(0, 31)); // Excel limita o nome da aba a 31 letras
    XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
    return;
  }
  // BOM + ";" — o Excel em português abre com acento e colunas certas.
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${nomeArquivo}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// Várias abas num arquivo só (relatórios completos). Abas vazias ganham uma linha "—" para o Excel não reclamar.
export function exportarPlanilhaAbas(abas: { nome: string; linhas: Record<string, string | number>[] }[], nomeArquivo: string) {
  const wb = XLSX.utils.book_new();
  const usados = new Set<string>();
  for (const a of abas) {
    let nome = a.nome.replace(/[\/?*[\]:]/g, " ").slice(0, 31) || "Aba";
    while (usados.has(nome)) nome = `${nome.slice(0, 28)} ${usados.size}`;
    usados.add(nome);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(a.linhas.length ? a.linhas : [{ "": "—" }]), nome);
  }
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}
