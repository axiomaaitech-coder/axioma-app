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
