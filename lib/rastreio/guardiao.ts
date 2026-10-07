// 🦅 GUARDIÃO DO MOTOR DE RASTREABILIDADE
// Procura rastros que não chegaram em todos os destinos (navegador fechado no
// meio, queda de internet, banco lento) e termina o caminho — antes de alguém
// abrir a tela e ver número faltando. Roda ao abrir o Axioma e a cada 5 min
// (components/GuardiaoRastreio.tsx) e pelo botão "Houve falha?".
import { createBrowserClient } from "@supabase/ssr";
import { percorrerRastreio, type ResolvidoPor } from "./motor";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type ResultadoGuardiao = { verificados: number; resolvidos: number; aindaComFalha: { rastreioId: string; falhas: string[] }[] };

// "pendente" recém-criado ainda está sendo percorrido pelo motor da própria tela:
// só entra depois de 1 min, pra não correr junto (correr junto seria seguro — tudo
// é idempotente — mas gastaria trabalho à toa).
const FOLGA_PENDENTE_MS = 60_000;

export async function rodarGuardiao(empresaId: string, quem: ResolvidoPor = "guardiao", limite = 50): Promise<ResultadoGuardiao> {
  const corte = new Date(Date.now() - FOLGA_PENDENTE_MS).toISOString();
  const { data, error } = await supabase.from("rastreio_movimentacao").select("id, status, criado_em")
    .eq("empresa_id", empresaId).in("status", ["pendente", "falhou"]).order("criado_em", { ascending: true }).limit(limite);
  if (error) return { verificados: 0, resolvidos: 0, aindaComFalha: [{ rastreioId: "-", falhas: [error.message] }] };
  const alvos = (data || []).filter((r) => quem !== "guardiao" || r.status === "falhou" || r.criado_em < corte);
  const aindaComFalha: ResultadoGuardiao["aindaComFalha"] = [];
  let resolvidos = 0;
  // Um de cada vez, na ordem em que aconteceram: estorno nunca passa na frente do pagamento.
  for (const r of alvos) {
    const res = await percorrerRastreio(r.id as string, quem);
    if (res.ok) resolvidos++;
    else aindaComFalha.push({ rastreioId: r.id as string, falhas: res.falhas });
  }
  return { verificados: alvos.length, resolvidos, aindaComFalha };
}
