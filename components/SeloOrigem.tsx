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
  const pagar = origemTabela === 'contas_pagar'
  const nome = pagar ? L('Contas a Pagar', 'Payables', 'Cuentas por Pagar') : L('Contas a Receber', 'Receivables', 'Cuentas por Cobrar')
  return (
    <button onClick={() => router.push(pagar ? '/contas-pagar' : '/contas-receber')}
      title={L(`Lançado automaticamente pela baixa em ${nome}. Para corrigir, estorne a baixa lá — o Axioma atualiza todos os módulos.`,
        `Posted automatically by the payment in ${nome}. To fix it, reverse the payment there — Axioma updates every module.`,
        `Registrado automáticamente por el pago en ${nome}. Para corregirlo, revierta el pago allí — Axioma actualiza todos los módulos.`)}
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap"
      style={temaClaro ? { background: '#101b3d', color: '#fff' } : { color: '#2ecc9b', border: '1px solid rgba(46,204,155,0.45)' }}>
      <Link2 size={11} aria-hidden />{L('Origem', 'Source', 'Origen')}: {nome}
    </button>
  )
}
