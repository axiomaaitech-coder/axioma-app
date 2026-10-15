# Ditado (Voice Fase 1) — 60 frases de teste com áudio real

**Status: NÃO EXECUTADO.** Estas frases são o roteiro da verificação manual com voz humana, microfone real e
a OpenAI de verdade. Nenhuma precisão foi medida ainda — não citar taxa de acerto antes de rodar.

## Como testar

1. Ligar o ditado só para a empresa de teste: na Vercel (ou `.env.local`), `VOZ_EMPRESAS_TESTE=<id da empresa de teste>`.
2. Em cada tela indicada, tocar no microfone, ler a frase em voz normal e parar.
3. Comparar o texto que entrou no campo com o "esperado". Marcar: **valor** certo? **data** certa? **nome** certo? **termo** certo?
4. Critério de aceite da Fase 1: **100% dos valores e datas certos** depois que a pessoa revisa; erros brutos anotados para ajustar a dica de vocabulário.
5. Repetir uma amostra no celular (Safari/iPhone e Chrome/Android) e no computador (Chrome, Edge, Firefox).

| Resultado | Preencher |
|---|---|
| Data do teste | |
| Aparelhos / navegadores | |
| Frases com valor errado | |
| Frases com data errada | |
| Frases com nome errado | |

## Português do Brasil (20)

| # | Tela | Falar | Esperado (conteúdo) |
|---|---|---|---|
| P01 | Contas a Pagar · descrição | "Conta de luz da Enel, trezentos e vinte reais, vence dia dez" | Enel · R$ 320 · dia 10 |
| P02 | Contas a Pagar · CFO | "Quanto eu vou pagar nos próximos trinta dias?" | 30 dias |
| P03 | Contas a Pagar · descrição | "Aluguel da loja, quatro mil e quinhentos reais, todo dia cinco" | R$ 4.500 · dia 5 |
| P04 | Contas a Pagar · descrição | "Boleto da Ambev de mil duzentos e trinta e quatro reais e cinquenta centavos" | Ambev · R$ 1.234,50 |
| P05 | Contas a Receber · descrição | "Farma Vida, parcela três de doze, cinco mil reais" | Farma Vida · 3/12 · R$ 5.000 |
| P06 | Contas a Receber · cobrança | "Cliente prometeu pagar na sexta-feira dia vinte e quatro de outubro" | 24/10 |
| P07 | Importar · descrição | "Material de limpeza no Atacadão, oitenta e nove reais e noventa" | Atacadão · R$ 89,90 |
| P08 | PDV · busca | "Água mineral quinhentos mililitros" | água mineral 500 ml |
| P09 | PDV · busca | "Pão de queijo" | pão de queijo |
| P10 | IA Financeira | "Qual foi meu faturamento em setembro de dois mil e vinte e seis?" | setembro de 2026 |
| P11 | IA Financeira | "Meu caixa aguenta pagar o décimo terceiro em dezembro?" | décimo terceiro · dezembro |
| P12 | IA Tributária | "Vale mais a pena o Simples Nacional ou o Lucro Presumido?" | Simples Nacional · Lucro Presumido |
| P13 | IA Tributária | "Qual a alíquota efetiva do anexo três com faturamento de oitenta mil por mês?" | Anexo III · R$ 80.000 |
| P14 | IA MEI Advisor | "Quanto falta para eu estourar o limite de oitenta e um mil do MEI?" | R$ 81.000 · MEI |
| P15 | IA MEI Advisor | "Quando vence o DAS de novembro?" | DAS · novembro |
| P16 | José | "José, se o dólar for para seis reais e dez, o que acontece com meu lucro?" | R$ 6,10 |
| P17 | José | "Como a Selic a quinze por cento afeta minhas dívidas?" | Selic · 15% |
| P18 | Contas a Pagar · descrição | "Fornecedor CNPJ doze ponto três quatro cinco barra zero zero zero um" | CNPJ dígitos |
| P19 | Contas a Receber · descrição | "Venda para Mercado Bom Preço no Pix, dois mil e trezentos" | Bom Preço · Pix · R$ 2.300 |
| P20 | IA Financeira | "Qual é o meu ponto de equilíbrio e a minha margem de contribuição?" | ponto de equilíbrio · margem de contribuição |

## English (20)

| # | Screen | Say | Expected (content) |
|---|---|---|---|
| E01 | Accounts Payable · description | "Electricity bill from Enel, three hundred twenty reais, due on the tenth" | Enel · 320 · 10th |
| E02 | Accounts Payable · CFO | "How much will I pay in the next thirty days?" | 30 days |
| E03 | Accounts Payable · description | "Store rent, four thousand five hundred reais, every fifth" | 4,500 · 5th |
| E04 | Accounts Payable · description | "Invoice from Ambev for one thousand two hundred thirty four dollars and fifty cents" | Ambev · 1,234.50 |
| E05 | Accounts Receivable · description | "Farma Vida, installment three of twelve, five thousand reais" | 3/12 · 5,000 |
| E06 | Accounts Receivable · collection | "The customer promised to pay on Friday, October twenty fourth" | Oct 24 |
| E07 | Import · description | "Cleaning supplies at Costco, eighty nine ninety" | 89.90 |
| E08 | POS · search | "Mineral water five hundred milliliters" | mineral water 500 ml |
| E09 | POS · search | "Cheese bread" | cheese bread |
| E10 | Financial AI | "What was my revenue in September twenty twenty six?" | September 2026 |
| E11 | Financial AI | "Can my cash cover the year-end bonus in December?" | December |
| E12 | Tax AI | "Is Simples Nacional or Lucro Presumido better for me?" | Simples Nacional · Lucro Presumido |
| E13 | Tax AI | "What is the effective rate in Annex three with eighty thousand per month?" | Annex III · 80,000 |
| E14 | MEI Advisor | "How far am I from the eighty one thousand MEI cap?" | 81,000 · MEI |
| E15 | MEI Advisor | "When is the November DAS due?" | DAS · November |
| E16 | José | "José, if the dollar goes to six point ten, what happens to my profit?" | 6.10 |
| E17 | José | "How does a fifteen percent Selic rate affect my debts?" | Selic · 15% |
| E18 | Accounts Payable · description | "Supplier tax ID one two three four five" | digits |
| E19 | Accounts Receivable · description | "Sale to Bom Preço Market via Pix, two thousand three hundred" | Pix · 2,300 |
| E20 | Financial AI | "What is my break-even point and contribution margin?" | break-even · contribution margin |

## Español (20)

| # | Pantalla | Decir | Esperado (contenido) |
|---|---|---|---|
| S01 | Cuentas por Pagar · descripción | "Factura de luz de Enel, trescientos veinte reales, vence el día diez" | Enel · 320 · día 10 |
| S02 | Cuentas por Pagar · CFO | "¿Cuánto voy a pagar en los próximos treinta días?" | 30 días |
| S03 | Cuentas por Pagar · descripción | "Alquiler del local, cuatro mil quinientos reales, cada día cinco" | 4.500 · día 5 |
| S04 | Cuentas por Pagar · descripción | "Factura de Ambev por mil doscientos treinta y cuatro con cincuenta" | Ambev · 1.234,50 |
| S05 | Cuentas por Cobrar · descripción | "Farma Vida, cuota tres de doce, cinco mil reales" | 3/12 · 5.000 |
| S06 | Cuentas por Cobrar · cobranza | "El cliente prometió pagar el viernes veinticuatro de octubre" | 24/10 |
| S07 | Importar · descripción | "Productos de limpieza en Atacadão, ochenta y nueve con noventa" | 89,90 |
| S08 | PDV · búsqueda | "Agua mineral de quinientos mililitros" | agua mineral 500 ml |
| S09 | PDV · búsqueda | "Pan de queso" | pan de queso |
| S10 | IA Financiera | "¿Cuál fue mi facturación en septiembre de dos mil veintiséis?" | septiembre 2026 |
| S11 | IA Financiera | "¿Mi caja alcanza para pagar el aguinaldo en diciembre?" | aguinaldo · diciembre |
| S12 | IA Tributaria | "¿Conviene más el Simples Nacional o el Lucro Presumido?" | Simples Nacional · Lucro Presumido |
| S13 | IA Tributaria | "¿Cuál es la alícuota efectiva del anexo tres con ochenta mil al mes?" | Anexo III · 80.000 |
| S14 | IA MEI Advisor | "¿Cuánto me falta para el límite de ochenta y un mil del MEI?" | 81.000 · MEI |
| S15 | IA MEI Advisor | "¿Cuándo vence el DAS de noviembre?" | DAS · noviembre |
| S16 | José | "José, si el dólar sube a seis con diez, ¿qué pasa con mi ganancia?" | 6,10 |
| S17 | José | "¿Cómo afecta una Selic del quince por ciento a mis deudas?" | Selic · 15% |
| S18 | Cuentas por Pagar · descripción | "Proveedor con CNPJ uno dos tres cuatro cinco" | dígitos |
| S19 | Cuentas por Cobrar · descripción | "Venta a Mercado Bom Preço por Pix, dos mil trescientos" | Pix · 2.300 |
| S20 | IA Financiera | "¿Cuál es mi punto de equilibrio y mi margen de contribución?" | punto de equilibrio · margen de contribución |
