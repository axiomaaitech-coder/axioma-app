'use client'
// Guardião do Motor de Rastreabilidade, rodando em silêncio: ao abrir o Axioma e a
// cada 5 minutos termina os rastros que não chegaram em todos os módulos (ver
// lib/rastreio/guardiao.ts). Se consertou algo, avisa as telas abertas pra recarregar.
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { obterEmpresaAtiva } from '../lib/empresaHelpers'
import { rodarGuardiao } from '../lib/rastreio/guardiao'

const INTERVALO_MS = 5 * 60 * 1000

export default function GuardiaoRastreio() {
  const caminho = usePathname()
  // Frente de caixa (operador) não mexe em dinheiro de contas: não roda lá.
  const ativo = !caminho?.startsWith('/pdv')

  useEffect(() => {
    if (!ativo) return
    let vivo = true
    let rodando = false
    const rodar = async () => {
      if (rodando) return
      rodando = true
      try {
        const empresaId = await obterEmpresaAtiva()
        if (!vivo || !empresaId) return
        const r = await rodarGuardiao(empresaId)
        if (vivo && r.resolvidos > 0) window.dispatchEvent(new CustomEvent('axioma:dados-atualizados', { detail: { origem: 'guardiao', resolvidos: r.resolvidos } }))
      } catch { /* o próprio motor já reporta cada falha ao Sentry; o Guardião tenta de novo no próximo ciclo */ } // varredura:ok guardião silencioso por desenho, falhas já reportadas em lib/rastreio/motor.ts
      finally { rodando = false }
    }
    void rodar()
    const t = setInterval(rodar, INTERVALO_MS)
    return () => { vivo = false; clearInterval(t) }
  }, [ativo])

  return null
}
