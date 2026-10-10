'use client'
// Selo dos lançamentos que o Motor de Rastreabilidade criou sozinho (baixa de
// Contas a Pagar/Receber). Fica no lugar dos botões editar/apagar: mexer aqui
// quebraria o caminho do dinheiro — corrige-se estornando a baixa na origem.
import { useRouter } from 'next/navigation'
import { Link2 } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

export default function SeloOrigem({ origemTabela, temaClaro }: { origemTabela: string; temaClaro: boolean }) {
  const router = useRouter()
  const { idioma } = useLanguage()
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt)
  // Toda porta que pode originar um lançamento automático (Motor de Rastreabilidade).
  const ORIGENS: Record<string, { rota: string; nome: string }> = {
    contas_pagar: { rota: '/contas-pagar', nome: L('Contas a Pagar', 'Payables', 'Cuentas por Pagar') },
    contas_receber: { rota: '/contas-receber', nome: L('Contas a Receber', 'Receivables', 'Cuentas por Cobrar') },
    receitas: { rota: '/receitas', nome: L('Receitas', 'Revenue', 'Ingresos') },
    custos_variaveis: { rota: '/custos-variaveis', nome: L('Custos Variáveis', 'Variable Costs', 'Costos Variables') },
    fluxo_caixa: { rota: '/fluxo-caixa', nome: L('Fluxo de Caixa', 'Cash Flow', 'Flujo de Caja') },
    venda: { rota: '/pdv', nome: L('PDV', 'POS', 'PDV') },
    mei_obrigacoes: { rota: '/mei/das', nome: L('MEI — DAS', 'MEI — DAS', 'MEI — DAS') },
  }
  const o = ORIGENS[origemTabela] ?? ORIGENS.contas_receber
  const nome = o.nome
  return (
    <button onClick={() => router.push(o.rota)}
      title={L(`Lançado automaticamente a partir de ${nome}. Para corrigir, altere ou estorne lá — o Axioma atualiza todos os módulos.`,
        `Posted automatically from ${nome}. To fix it, change or reverse it there — Axioma updates every module.`,
        `Registrado automáticamente desde ${nome}. Para corregirlo, modifíquelo o reviértalo allí — Axioma actualiza todos los módulos.`)}
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap"
      style={temaClaro ? { background: '#101b3d', color: '#fff' } : { color: '#2ecc9b', border: '1px solid rgba(46,204,155,0.45)' }}>
      <Link2 size={11} aria-hidden />{L('Origem', 'Source', 'Origen')}: {nome}
    </button>
  )
}
