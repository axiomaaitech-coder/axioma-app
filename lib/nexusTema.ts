// Paleta do Nexus por tema — compartilhada entre /nexus e /nexus/simulacoes.
// dark = fundação do Escuro; texto passou de azul-acinzentado pra quase branco em
// 2026-09-28 (azul sobre fundo azul não lia — pedido do Elias). xms = tema Claro, valores de
// public/referencias/tema-tokens.md: verde-menta no lugar de ciano/roxo (roxo
// não é da paleta), texto azul-marinho, secundário #374151 sobre o creme,
// card creme #f6f7c4 (aprovado no rollout MEI).
export const PALETA = {
  dark: {
    // Escuro padronizado (2026-10-03): azul/ciano/roxo viram verde-menta; textos aprovados ficam
    AZULC: '#2ecc9b', CIANO: '#2ecc9b', ROXOTV: '#2ecc9b', CINZA: '#d7e0ea', TEXTO: '#e6edf5', TITULO: '#ffffff',
    PAINEL_BG: 'rgba(10,20,36,0.7)', MODAL_BG: 'linear-gradient(135deg, #0a1628 0%, #060f1e 100%)',
    NESTED_BG: 'rgba(255,255,255,0.04)', NESTED_BORDA: 'rgba(46,204,155,0.22)',
  },
  xms: {
    AZULC: '#2ecc9b', CIANO: '#2ecc9b', ROXOTV: '#2ecc9b', CINZA: '#374151', TEXTO: '#101b3d', TITULO: '#101b3d',
    PAINEL_BG: '#f6f7c4', MODAL_BG: '#f6f7c4',
    NESTED_BG: 'rgba(255,255,255,0.5)', NESTED_BORDA: 'rgba(16,27,61,0.12)',
  },
} as const

// Botão de utilidade no Claro = mesmo degradê sólido do Exportar PDF (regra fixa).
export const VERDE_SOLIDO = { background: 'linear-gradient(135deg, #16a97d, #2ecc9b)', border: 'none', color: '#fff' }
