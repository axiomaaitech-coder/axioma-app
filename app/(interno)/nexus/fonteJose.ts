// Fonte de personagem do José (Cinzel, letra de forma de inscrição antiga) —
// exceção autorizada pelo Elias só pros títulos/apresentação do José no Nexus.
// Carregada uma vez aqui (next/font, hospedada pelo próprio site) e reaproveitada.
import { Cinzel } from 'next/font/google'

export const cinzel = Cinzel({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' })
