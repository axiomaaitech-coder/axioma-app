// 🦅 AXIOMA AI.TECH — PDV Fase 3, Etapa 4: impressão térmica ESC/POS via QZ
// Tray (https://qz.io). QZ Tray é um programa que roda no PC do caixa — o
// navegador fala com ele por WebSocket em localhost (qz.websocket.connect),
// e ele manda os bytes crus (ESC/POS) direto pra impressora térmica
// instalada no sistema operacional. Sem QZ Tray aberto, a conexão falha —
// quem chama estas funções SEMPRE trata esse caso caindo pro cupom HTML
// (window.print()), nunca trava a venda (ver imprimirCupomAtual em
// app/(interno)/pdv/venda/page.tsx).
//
// Import da lib SEMPRE dinâmico (nunca top-level): qz-tray toca
// window/WebSocket ao carregar, o que quebraria a renderização no servidor
// (SSR) do Next se fosse import estático no topo de um arquivo que roda no
// server também.
//
// SEGURANÇA/CERTIFICADO: configurado abaixo em modo "unsigned" (sem
// certificado próprio) — o QZ Tray mostra UM diálogo de confiança no PC do
// caixa a cada vez que o QZ Tray é reaberto (não é 100% silencioso depois
// de reiniciar o programa, mas TAMBÉM não é a cada venda: a conexão fica
// aberta entre vendas — keepAlive padrão de 60s do QZ Tray — então o
// diálogo só reaparece de fato quando o programa é fechado/reaberto ou o PC
// reinicia). No diálogo, marcar "Remember this decision"/"Always allow" +
// "Allow" resolve pro resto daquela sessão do QZ Tray. Pra eliminar o
// diálogo de vez mesmo depois de reiniciar o QZ Tray, sem precisar de
// certificado nenhum: no ícone do QZ Tray na bandeja → "Advanced" → "Site
// Manager", adicionar o domínio do Axioma como permanentemente permitido.
// ponytail: modo unsigned. Upgrade: certificado próprio + endpoint de
// assinatura (elimina o diálogo por completo, inclusive sem usar o Site
// Manager), se ainda incomodar em produção.

type QzModulo = typeof import("qz-tray");

let qzModulo: QzModulo | null = null;
let segurancaConfigurada = false;

async function carregarQz(): Promise<QzModulo> {
  if (!qzModulo) qzModulo = await import("qz-tray");
  if (!segurancaConfigurada) {
    qzModulo.security.setCertificatePromise((resolve) => resolve());
    qzModulo.security.setSignaturePromise(() => (resolve) => resolve());
    segurancaConfigurada = true;
  }
  return qzModulo;
}

export async function conectarQz(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const qz = await carregarQz();
    if (qz.websocket.isActive()) return true;
    await qz.websocket.connect();
    return true;
  } catch {
    return false;
  }
}

export async function listarImpressorasQz(): Promise<string[]> {
  try {
    const qz = await carregarQz();
    if (!qz.websocket.isActive()) await qz.websocket.connect();
    const impressoras = await qz.printers.find();
    return Array.isArray(impressoras) ? impressoras : [impressoras];
  } catch {
    return [];
  }
}

// comandos: strings ESC/POS já com os bytes de controle embutidos (ex:
// "\x1B\x40" pra inicializar) — string simples no array é interpretada pelo
// QZ Tray como {type:'raw', format:'command', flavor:'plain'} automaticamente,
// sem precisar montar o objeto à mão.
export async function imprimirEscPos(impressora: string, comandos: string[]): Promise<{ erro?: string }> {
  try {
    const qz = await carregarQz();
    if (!qz.websocket.isActive()) await qz.websocket.connect();
    const config = qz.configs.create(impressora, { encoding: "ISO-8859-1" });
    await qz.print(config, comandos);
    return {};
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao imprimir via QZ Tray" };
  }
}
