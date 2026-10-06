// Testa ao vivo cada fonte reserva do Nexus (sem gravar nada): node scripts/testar-reservas-nexus.cjs
const jiti = require('jiti')(__filename, { alias: { '@': require('path').join(__dirname, '..') } })
const { INDICADORES } = jiti('../lib/nexusReservas.ts')
;(async () => {
  let ok = 0, falha = 0
  for (const ind of INDICADORES) {
    for (const [i, l] of ind.reservas.entries()) {
      try {
        const p = await l.ler()
        const u = p[p.length - 1]
        console.log(`OK    ${ind.codigo.padEnd(26)} ${i + 2}ª ${l.fonte.nome.padEnd(30)} ${p.length} pts, último ${u ? `${u.data}=${u.valor}` : '-'}`)
        ok++
      } catch (e) { console.log(`FALHA ${ind.codigo.padEnd(26)} ${i + 2}ª ${l.fonte.nome.padEnd(30)} ${e.message}`); falha++ }
    }
  }
  console.log(`\n${ok} ok, ${falha} falha(s)`)
})()
