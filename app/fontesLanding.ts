// Fonte da página inicial (next/font, hospedada pelo próprio site — o @import do Google
// dentro do <style jsx> não carregava e caía numa fonte genérica pesada).
// Red Hat Display: escolhida pelo Elias em 2026-10-13 (parecida com a referência do Behance).
import { Red_Hat_Display } from 'next/font/google'

export const fonteRedHat = Red_Hat_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--f-redhat' })
