'use client'
// Corrente de causa e efeito do evento (Push 03): "Petróleo → Combustível →
// Logística → Custo → Margem". Caminho TÍPICO por regra (determinístico, sem IA,
// grátis) — não é fato nem previsão; o tamanho do efeito fica com o simulador.
import { Fragment } from 'react'
import { motion } from 'framer-motion'
import type { PayloadEvento, RegraEvento } from '../../../lib/nexusEventDetector'

type Lang = 'pt' | 'en' | 'es'
type Nome3 = [string, string, string]
// sinal: +1 anda junto com o elo anterior, -1 anda ao contrário.
type Elo = { icone: string; nome: Nome3; sinal: 1 | -1 }

const MARGEM: Elo = { icone: '📊', nome: ['Margem da sua empresa', 'Your company’s margin', 'Margen de su empresa'], sinal: 1 }
const IPCA: { elos: Elo[]; nota?: Nome3 } = {
  elos: [
    { icone: '📈', nome: ['Inflação', 'Inflation', 'Inflación'], sinal: 1 },
    { icone: '🧾', nome: ['Custos, aluguel e salários', 'Costs, rent and wages', 'Costos, alquiler y salarios'], sinal: 1 },
    { icone: '🛍️', nome: ['Poder de compra do cliente', 'Customer purchasing power', 'Poder de compra del cliente'], sinal: -1 },
    MARGEM,
  ],
  nota: ['Se você consegue reajustar preços no mesmo ritmo, o efeito na margem diminui.', 'If you can raise prices at the same pace, the effect on margin shrinks.', 'Si puede reajustar precios al mismo ritmo, el efecto en el margen disminuye.'],
}

const CORRENTES: Record<RegraEvento, { elos: Elo[]; nota?: Nome3 }> = {
  fx_5d: {
    elos: [
      { icone: '💱', nome: ['Moeda estrangeira', 'Foreign currency', 'Moneda extranjera'], sinal: 1 },
      { icone: '📦', nome: ['Produtos e insumos importados', 'Imported goods and inputs', 'Productos e insumos importados'], sinal: 1 },
      { icone: '🏭', nome: ['Custo da sua empresa', 'Your company’s cost', 'Costo de su empresa'], sinal: 1 },
      { ...MARGEM, sinal: -1 },
    ],
    nota: ['Se você exporta ou vende em moeda estrangeira, o efeito se inverte: a receita sobe junto.', 'If you export or sell in foreign currency, the effect flips: revenue rises too.', 'Si exporta o vende en moneda extranjera, el efecto se invierte: el ingreso también sube.'],
  },
  petroleo_5d: {
    elos: [
      { icone: '🛢️', nome: ['Petróleo', 'Oil', 'Petróleo'], sinal: 1 },
      { icone: '⛽', nome: ['Combustível', 'Fuel', 'Combustible'], sinal: 1 },
      { icone: '🚚', nome: ['Frete e logística', 'Freight and logistics', 'Flete y logística'], sinal: 1 },
      { icone: '🏭', nome: ['Custo da sua empresa', 'Your company’s cost', 'Costo de su empresa'], sinal: 1 },
      { ...MARGEM, sinal: -1 },
    ],
    nota: ['A Petrobras não repassa todo movimento na hora — o combustível costuma reagir com atraso.', 'Petrobras does not pass every move through right away — fuel usually reacts with a lag.', 'Petrobras no traslada cada movimiento de inmediato — el combustible suele reaccionar con retraso.'],
  },
  selic_mudanca: {
    elos: [
      { icone: '🏦', nome: ['Selic', 'Selic rate', 'Tasa Selic'], sinal: 1 },
      { icone: '💳', nome: ['Juros de empréstimos e cartão', 'Loan and card interest', 'Intereses de préstamos y tarjeta'], sinal: 1 },
      { icone: '🛒', nome: ['Crédito e consumo dos clientes', 'Customer credit and spending', 'Crédito y consumo de los clientes'], sinal: -1 },
      { icone: '💰', nome: ['Suas vendas', 'Your sales', 'Sus ventas'], sinal: 1 },
      MARGEM,
    ],
    nota: ['Dívida pós-fixada fica mais cara (ou mais barata) na mesma direção; dinheiro aplicado rende junto.', 'Floating-rate debt moves the same way; invested cash earns along with it.', 'La deuda posfijada se mueve en la misma dirección; el dinero invertido rinde junto.'],
  },
  ipca_forte: IPCA,
  ipca_deflacao: IPCA,
  desemprego_variacao: {
    elos: [
      { icone: '👷', nome: ['Desemprego', 'Unemployment', 'Desempleo'], sinal: 1 },
      { icone: '💵', nome: ['Renda das famílias', 'Household income', 'Ingreso de las familias'], sinal: -1 },
      { icone: '🛒', nome: ['Consumo', 'Consumer spending', 'Consumo'], sinal: 1 },
      { icone: '💰', nome: ['Suas vendas', 'Your sales', 'Sus ventas'], sinal: 1 },
      MARGEM,
    ],
  },
  atividade_variacao: {
    elos: [
      { icone: '🏗️', nome: ['Atividade econômica', 'Economic activity', 'Actividad económica'], sinal: 1 },
      { icone: '🛒', nome: ['Demanda', 'Demand', 'Demanda'], sinal: 1 },
      { icone: '💰', nome: ['Suas vendas', 'Your sales', 'Sus ventas'], sinal: 1 },
      MARGEM,
    ],
  },
}

export function CorrenteImpacto({ payload, lang, temaClaro, fundo, borda }: {
  payload: PayloadEvento; lang: Lang; temaClaro: boolean; fundo: string; borda: string
}) {
  const corrente = CORRENTES[payload.regra]
  if (!corrente) return null
  const L = (n: Nome3) => (lang === 'en' ? n[1] : lang === 'es' ? n[2] : n[0])
  const TIT = temaClaro ? '#101b3d' : '#e2ecf7'
  const SEC = temaClaro ? '#374151' : '#8aa4c2'
  const SOBE = temaClaro ? '#16a97d' : '#34d399'
  const CAI = temaClaro ? '#dc3545' : '#f87171'

  // Direção de cada elo = direção do evento × sinais acumulados.
  let dir = payload.direcao === 'alta' ? 1 : -1
  const elos = corrente.elos.map((e) => ({ ...e, sobe: (dir *= e.sinal) > 0 }))

  return (
    <div className="mt-3 rounded-xl p-3" style={{ background: fundo, border: `1px solid ${borda}` }}>
      <p className="text-xs font-bold mb-2" style={{ color: TIT }}>
        {L(['Como isso chega até a sua empresa', 'How this reaches your company', 'Cómo esto llega a su empresa'])}
      </p>
      <ol className="flex flex-wrap items-center gap-1.5" aria-label={L(['Corrente de causa e efeito', 'Cause-and-effect chain', 'Cadena de causa y efecto'])}>
        {elos.map((e, i) => {
          const ultimo = i === elos.length - 1
          // Só o último elo (margem) é bom/ruim; os do meio só sobem/descem.
          const cor = ultimo ? (e.sobe ? SOBE : CAI) : TIT
          return (
            <Fragment key={i}>
              {i > 0 && <li aria-hidden className="text-xs" style={{ color: SEC }}>→</li>}
              <motion.li
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12, duration: 0.25 }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
                style={{ color: cor, border: `1px solid ${ultimo ? cor + '80' : borda}`, background: ultimo ? cor + '14' : 'transparent' }}
              >
                <span aria-hidden>{e.icone}</span>{L(e.nome)}
                <span style={{ color: ultimo ? cor : SEC }} aria-label={e.sobe ? L(['sobe', 'rises', 'sube']) : L(['cai', 'falls', 'baja'])}>{e.sobe ? '▲' : '▼'}</span>
              </motion.li>
            </Fragment>
          )
        })}
      </ol>
      {corrente.nota && <p className="text-[11px] mt-2 leading-relaxed" style={{ color: SEC }}>{L(corrente.nota)}</p>}
      <p className="text-[10px] mt-1" style={{ color: SEC }}>
        {L(['Caminho típico, não certeza. O tamanho do efeito na sua empresa sai no simulador "E se...?".', 'Typical path, not a certainty. The size of the effect on your company comes from the "What if...?" simulator.', 'Camino típico, no certeza. El tamaño del efecto en su empresa sale del simulador "¿Y si...?".'])}
      </p>
    </div>
  )
}
