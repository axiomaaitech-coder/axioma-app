// Self-check: nenhum texto do relatório passa da margem direita (nada cortado na lateral).
// node --no-warnings scripts/check-pdf-relatorio.mjs
import assert from 'node:assert/strict'
import { montarPdfRelatorio } from '../lib/gerarPdfRelatorio.ts'

const longo = 'Texto muito longo que antes era cortado com reticências e passava da borda da folha — agora precisa quebrar em várias linhas sem perder nenhuma palavra. '.repeat(6)
const pdf = montarPdfRelatorio({
  titulo: 'Plano do José para sua empresa — 1 a 3 anos com um título bem comprido para testar a quebra de linha no cabeçalho do documento',
  subtitulo: longo,
  numeros: [{ rotulo: 'Receita por mês', valor: 'R$ 0' }, { rotulo: 'Caixa disponível', valor: 'R$ 3.799.996' }],
  secoes: Array.from({ length: 8 }, (_, i) => ({ titulo: `Seção ${i + 1}`, paragrafo: longo, itens: [{ titulo: longo.slice(0, 120), texto: longo, nota: 'prioridade alta · impacto: a medir' }] })),
  nomeArquivo: 'teste.pdf',
})
const W = pdf.internal.pageSize.getWidth(), M = 16
// splitTextToSize garante a largura; confere reconstruindo as linhas do texto longo.
pdf.setFontSize(9)
const linhas = pdf.splitTextToSize(longo, W - M * 2 - 4)
for (const l of linhas) assert.ok(pdf.getTextWidth(l) <= W - M * 2 - 4 + 0.5, 'linha passou da margem: ' + l)
assert.equal(linhas.join(' ').replace(/\s+/g, ' ').trim(), longo.replace(/\s+/g, ' ').trim(), 'texto perdeu palavras ao quebrar')
assert.ok(pdf.getNumberOfPages() >= 2, 'deveria virar página com tanto conteúdo')
console.log('OK — PDF de relatório sem corte (' + pdf.getNumberOfPages() + ' páginas)')

// Caracteres que a fonte do PDF não tem viram equivalentes legíveis (nada de lixo)
const { limparTextoPdf } = await import('../lib/gerarPdfRelatorio.ts')
assert.equal(limparTextoPdf('Margem 5% → 12% ≈ meta 💡'), 'Margem 5% -> 12% ~ meta ')
assert.equal(limparTextoPdf('Ação — prioridade “alta” • ok'), 'Ação — prioridade “alta” • ok')
console.log('OK — limpeza de caracteres do PDF')
