// Fonte de personagem do José (Cinzel, letra de forma de inscrição antiga) —
// exceção autorizada pelo Elias só pros títulos/apresentação do José no Nexus.
// Carregada uma vez aqui (next/font, hospedada pelo próprio site) e reaproveitada.
import { Cinzel } from 'next/font/google'

export const cinzel = Cinzel({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' })

// Título de seção do Nexus — um só padrão pro módulo inteiro (pedido do Elias,
// 2026-09-28): mesma fonte/tamanho do "Painel executivo do José".
export const TITULO_SECAO = `${cinzel.className} nexus-titulo-secao flex items-center gap-2 text-lg md:text-xl font-bold tracking-wide`
