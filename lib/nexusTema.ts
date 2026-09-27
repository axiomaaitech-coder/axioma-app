// Paleta do Nexus por tema — compartilhada entre /nexus e /nexus/simulacoes.
// dark = valores de sempre (fundação, intocada). xms = tema Claro, valores de
// public/referencias/tema-tokens.md: verde-menta no lugar de ciano/roxo (roxo
// não é da paleta), texto azul-marinho, secundário #374151 sobre o creme,
// card creme #f6f7c4 (aprovado no rollout MEI).
export const PALETA = {
  dark: {
    AZULC: '#6ab0ff', CIANO: '#22d3ee', ROXOTV: '#a78bfa', CINZA: '#5a7a9a', TEXTO: '#c8d8f0', TITULO: '#e2ecf7',
    PAINEL_BG: 'rgba(10,20,36,0.7)', MODAL_BG: 'linear-gradient(135deg, #0a1628 0%, #060f1e 100%)',
    NESTED_BG: 'rgba(255,255,255,0.04)', NESTED_BORDA: 'transparent',
  },
  xms: {
    AZULC: '#2ecc9b', CIANO: '#2ecc9b', ROXOTV: '#2ecc9b', CINZA: '#374151', TEXTO: '#101b3d', TITULO: '#101b3d',
    PAINEL_BG: '#f6f7c4', MODAL_BG: '#f6f7c4',
    NESTED_BG: 'rgba(255,255,255,0.5)', NESTED_BORDA: 'rgba(16,27,61,0.12)',
  },
} as const

// Botão de utilidade no Claro = mesmo degradê sólido do Exportar PDF (regra fixa).
export const VERDE_SOLIDO = { background: 'linear-gradient(135deg, #16a97d, #2ecc9b)', border: 'none', color: '#fff' }
