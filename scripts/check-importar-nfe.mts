// Conferência da leitura de NF-e no Importar Documentos (parcelas e pagamentos).
// Rodar: npx tsx scripts/check-importar-nfe.mts
import assert from 'node:assert/strict'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { parseXMLNFe, resultadoDeNotaIA, aplicarClassificacaoItens, perguntasSupervisao, lerSugestoesIA } = await import('../lib/importarParsers')

const EMPRESA = '11222333000181'
const nota = (emit: string, dest: string, extra: string) => `<nfeProc><NFe><infNFe Id="NFe35260911222333000181550010000001231000001230">
  <ide><nNF>123</nNF><serie>1</serie><dhEmi>2026-09-20T10:00:00-03:00</dhEmi></ide>
  <emit><CNPJ>${emit}</CNPJ><xNome>Fornecedor Aço Ltda</xNome></emit>
  <dest><CNPJ>${dest}</CNPJ><xNome>Cliente Comprador</xNome></dest>
  <det nItem="1"><prod><cProd>1</cProd><cEAN>SEM GTIN</cEAN><xProd>CHAPA ACO</xProd><NCM>72085100</NCM><CFOP>5102</CFOP><uCom>UN</uCom><qCom>1</qCom><vUnCom>3000.00</vUnCom><vProd>3000.00</vProd></prod></det>
  <total><ICMSTot><vNF>3000.00</vNF></ICMSTot></total>${extra}</infNFe></NFe></nfeProc>`

// 1) Compra em 3 parcelas (boleto a prazo) → 3 contas, cada uma no vencimento certo
const parcelada = await parseXMLNFe(nota('99888777000100', EMPRESA, `
  <cobr><fat><nFat>123</nFat><vOrig>3000.00</vOrig><vLiq>3000.00</vLiq></fat>
    <dup><nDup>001</nDup><dVenc>2026-10-20</dVenc><vDup>1000.00</vDup></dup>
    <dup><nDup>002</nDup><dVenc>2026-11-20</dVenc><vDup>1000.00</vDup></dup>
    <dup><nDup>003</nDup><dVenc>2026-12-20</dVenc><vDup>1000.00</vDup></dup></cobr>
  <pag><detPag><indPag>1</indPag><tPag>15</tPag><vPag>3000.00</vPag></detPag></pag>`), EMPRESA)
assert.equal(parcelada.linhas.length, 3)
assert.deepEqual(parcelada.linhas.map((l) => [l.valor, l.vencimento, l.destinoSugerido]), [[1000, '2026-10-20', 'contas_pagar'], [1000, '2026-11-20', 'contas_pagar'], [1000, '2026-12-20', 'contas_pagar']])
assert.ok(parcelada.linhas[0].descricao?.includes('parcela 1/3'))
assert.equal(parcelada.metadados.valor_quitado_na_emissao, 0)
console.log('OK — compra em 3 parcelas vira 3 contas a pagar com vencimento real')

// 2) Compra paga à vista no Pix → 1 conta que já nasce paga
const pix = await parseXMLNFe(nota('99888777000100', EMPRESA, `<pag><detPag><indPag>0</indPag><tPag>17</tPag><vPag>3000.00</vPag></detPag></pag>`), EMPRESA)
assert.equal(pix.linhas.length, 1)
assert.equal(pix.linhas[0].valorPago, 3000)
assert.equal(pix.metadados.pagamentos[0].meio, 'Pix')
console.log('OK — compra paga no Pix nasce quitada')

// 3) Venda (a empresa é a emitente) → continua 1 linha de receita, sem mexer em valor pago
const venda = await parseXMLNFe(nota(EMPRESA, '55666777000199', `<pag><detPag><tPag>01</tPag><vPag>3000.00</vPag></detPag></pag>`), EMPRESA)
assert.equal(venda.linhas.length, 1)
assert.equal(venda.linhas[0].destinoSugerido, 'receitas')
assert.equal(venda.linhas[0].valorPago, undefined)
console.log('OK — venda continua como receita única')

// 3b) Venda parcelada → receita na data da venda + 1 conta a receber por duplicata
const vendaParcelada = await parseXMLNFe(nota(EMPRESA, '55666777000199', `
  <cobr><dup><nDup>001</nDup><dVenc>2026-10-20</dVenc><vDup>1500.00</vDup></dup><dup><nDup>002</nDup><dVenc>2026-11-20</dVenc><vDup>1500.00</vDup></dup></cobr>
  <pag><detPag><indPag>1</indPag><tPag>15</tPag><vPag>3000.00</vPag></detPag></pag>`), EMPRESA)
assert.deepEqual(vendaParcelada.linhas.map((l) => [l.destinoSugerido, l.valor, l.vencimento ?? null]), [['receitas', 3000, null], ['contas_receber', 1500, '2026-10-20'], ['contas_receber', 1500, '2026-11-20']])
console.log('OK — venda parcelada: receita + contas a receber no vencimento de cada parcela')
const vendaCartao = await parseXMLNFe(nota(EMPRESA, '55666777000199', `<pag><detPag><tPag>03</tPag><vPag>3000.00</vPag></detPag></pag>`), EMPRESA)
assert.equal(vendaCartao.metadados.resumo_pagamento.perguntaParcelasCartao, false)
assert.ok(!vendaCartao.metadados.resumo_pagamento.pt.includes('quantas vezes'))
console.log('OK — venda no cartão não pergunta parcelas (só compra pergunta)')

// 4) Resumo em linguagem simples (e pergunta quando o cartão não diz em quantas vezes)
assert.ok(parcelada.metadados.resumo_pagamento.pt.startsWith('Parcelado em 3x (Boleto)'))
assert.ok(pix.metadados.resumo_pagamento.pt.startsWith('Pago à vista: Pix'))
const cartao = await parseXMLNFe(nota('99888777000100', EMPRESA, `<pag><detPag><indPag>0</indPag><tPag>03</tPag><vPag>3000.00</vPag></detPag></pag>`), EMPRESA)
assert.equal(cartao.metadados.resumo_pagamento.perguntaParcelasCartao, true)
assert.ok(cartao.metadados.resumo_pagamento.pt.includes('em quantas vezes?'))
assert.ok(cartao.metadados.resumo_pagamento.en.includes('how many installments'))
console.log('OK — resumo do pagamento (pt/en/es) e pergunta de parcelas do cartão')

// 5) Usuário escolhe as parcelas do cartão (1x a 48x) — centavos fecham, dá pra trocar de ideia
const { parcelarCompraCartao } = await import('../lib/importarParsers')
const em7 = parcelarCompraCartao(cartao, 7)
assert.equal(em7.linhas.length, 7)
assert.equal(Math.round(em7.linhas.reduce((s, l) => s + (l.valor ?? 0), 0) * 100), 300000) // soma exata R$ 3.000,00
assert.equal(em7.linhas[0].vencimento, '2026-10-20')
assert.equal(em7.linhas[6].vencimento, '2027-04-20')
assert.ok(em7.linhas.every((l) => l.valorPago === undefined)) // parcelas futuras em aberto
const em48 = parcelarCompraCartao(em7, 48) // troca de 7x para 48x: parte da compra original
assert.equal(em48.linhas.length, 48)
assert.equal(Math.round(em48.linhas.reduce((s, l) => s + (l.valor ?? 0), 0) * 100), 300000)
const em1 = parcelarCompraCartao(em48, 1)
assert.equal(em1.linhas.length, 1)
assert.equal(em1.linhas[0].valorPago, 3000)
assert.equal(parcelarCompraCartao(cartao, 49), cartao) // fora do limite: não mexe
assert.equal(parcelarCompraCartao(pix, 3), pix) // sem pergunta de cartão: não mexe
console.log('OK — parcelas do cartão de 1x a 48x (centavos fecham, troca de opção parte da compra original)')

// 6) Nota lida pela IA (PDF/foto) segue o MESMO caminho do XML
const lidaIA = resultadoDeNotaIA({
  eh_nota: true, tipo_documento: 'nfe', numero: '123', data_emissao: '2026-09-20',
  emitente: { nome: 'Fornecedor Aço Ltda', cnpj_cpf: '99.888.777/0001-00' }, destinatario: { nome: 'Cliente Comprador', cnpj_cpf: '11.222.333/0001-81' },
  valor_total: 3000,
  itens: [{ descricao: 'CHAPA ACO', quantidade: 1, unidade: 'UN', valor_unitario: 3000, valor_total: 3000, ncm: '72085100', cfop: '5102', codigo: '1', ean: null }],
  parcelas: [{ numero: '001', vencimento: '2026-10-20', valor: 1000 }, { numero: '002', vencimento: '2026-11-20', valor: 1000 }, { numero: '003', vencimento: '2026-12-20', valor: 1000 }],
  pagamentos: [{ codigo_meio: '15', valor: 3000, a_prazo: true }], duvidas: [],
}, 'pdf', EMPRESA)
assert.equal(lidaIA.formato, 'pdf')
assert.equal(lidaIA.metadados.lido_por_ia, true)
assert.deepEqual(lidaIA.linhas.map((l) => [l.valor, l.vencimento, l.destinoSugerido]), parcelada.linhas.map((l) => [l.valor, l.vencimento, l.destinoSugerido]))
assert.equal(lidaIA.itensNFe?.[0].descricao, 'CHAPA ACO')
assert.equal(lidaIA.metadados.problemas_formato_reforma, undefined)
console.log('OK — nota lida pela IA (PDF/foto) gera as mesmas contas que o XML')

// 7) Classificação dos itens (B3 item 3): resumo por natureza + categoria de maior valor nas contas de compra
const classificada = aplicarClassificacaoItens(parcelada, [{ categoria: 'Produtos', natureza: 'estoque' }])
assert.ok(classificada.linhas.every((l) => l.categoria === 'Produtos'))
assert.equal(classificada.metadados.classificacao_itens.porNatureza.estoque.valor, 3000)
assert.equal(classificada.itensNFe?.[0].naturezaSugerida, 'estoque')
assert.equal(aplicarClassificacaoItens(parcelada, []), parcelada) // quantidade errada: não mexe
const vendaClass = aplicarClassificacaoItens(venda, [{ categoria: 'Produtos', natureza: 'estoque' }])
assert.equal(vendaClass.linhas[0].categoria, undefined) // venda não ganha categoria de despesa
console.log('OK — classificação dos itens da compra (natureza + categoria sugerida, venda intacta)')

// 8) Supervisão humana: perguntas antes de importar
const hoje = new Date('2026-10-02T12:00:00')
const ids = (r: Parameters<typeof perguntasSupervisao>[0]) => perguntasSupervisao(r, hoje).map((p) => p.id)
console.log('   perguntas XML parcelado:', ids(parcelada).join(', ') || '(nenhuma)')
assert.ok(!ids(parcelada).includes('parcelas_total')) // 3 x 1000 = 3000 fecha
assert.ok(ids(lidaIA).includes('leitura_ia')) // nota lida pela IA sempre pede conferência
const comDuvida = resultadoDeNotaIA({ ...JSON.parse(JSON.stringify(lidaIA.linhas[0].raw ? {} : {})), eh_nota: true, tipo_documento: 'nfe', numero: '9', data_emissao: '2027-01-10',
  emitente: { nome: 'X', cnpj_cpf: '11111111111111' }, destinatario: { nome: 'Y', cnpj_cpf: '11222333000181' }, valor_total: 500,
  itens: [], parcelas: [{ numero: '1', vencimento: '2026-12-01', valor: 200 }], pagamentos: [], duvidas: [{ campo: 'data_emissao', pergunta: 'Li 10/01/2027, está borrado.' }] }, 'imagem', EMPRESA)
const idsDuvida = ids(comDuvida)
for (const esperado of ['leitura_ia', 'duvida_ia_0', 'parcelas_total', 'emissao_futura', 'vencimento_antes', 'cnpj_emitente']) assert.ok(idsDuvida.includes(esperado), esperado)
const semEmpresa = await parseXMLNFe(nota('99888777000100', EMPRESA, ''), undefined)
assert.ok(ids(semEmpresa).includes('destino')) // empresa sem CNPJ: pergunta se é compra ou venda
console.log('OK — supervisão humana: leitura da IA, dúvidas, parcelas x total, datas impossíveis, CNPJ inválido, compra ou venda')

// 9) Perguntas de lançamento (B3 item 4): estoque pergunta como tratar; custo fixo da nota inteira oferece "todo mês"
const pEstoque = perguntasSupervisao(classificada, hoje)
assert.ok(pEstoque.some((p) => p.id === 'lanc_estoque' && p.opcoes?.length === 2))
assert.ok(!pEstoque.some((p) => p.id === 'lanc_custo_fixo'))
const pixFixo = aplicarClassificacaoItens(pix, [{ categoria: 'Serviços', natureza: 'custo_fixo' }])
const pFixo = perguntasSupervisao(pixFixo, hoje).find((p) => p.id === 'lanc_custo_fixo')
assert.deepEqual(pFixo?.opcoes?.map((o) => o.valor), ['mensal', 'unico', 'nao'])
const parcFixo = aplicarClassificacaoItens(parcelada, [{ categoria: 'Serviços', natureza: 'custo_fixo' }])
assert.deepEqual(perguntasSupervisao(parcFixo, hoje).find((p) => p.id === 'lanc_custo_fixo')?.opcoes?.map((o) => o.valor), ['unico', 'nao']) // parcelada não vira custo fixo mensal
assert.ok(!perguntasSupervisao(vendaClass, hoje).some((p) => p.id.startsWith('lanc_'))) // venda não pergunta lançamento de custo
console.log('OK — perguntas de lançamento (custo fixo mensal só p/ nota inteira à vista, estoque, venda sem pergunta)')

// 10) Fornecedor (B3 item 5): não cadastrado → pergunta; já cadastrado → liga sem perguntar
const naoCad = { ...parcelada, metadados: { ...parcelada.metadados, fornecedor_cadastrado: null } }
assert.ok(perguntasSupervisao(naoCad, hoje).some((p) => p.id === 'fornecedor_novo'))
const jaCad = { ...parcelada, metadados: { ...parcelada.metadados, fornecedor_cadastrado: { id: 'x', nome: 'Aço' } } }
assert.ok(!perguntasSupervisao(jaCad, hoje).some((p) => p.id === 'fornecedor_novo'))
assert.ok(!perguntasSupervisao({ ...venda, metadados: { ...venda.metadados, fornecedor_cadastrado: null } }, hoje).some((p) => p.id === 'fornecedor_novo'))
console.log('OK — fornecedor: pergunta só quando não cadastrado e só em compra')

// 11) Ajudante da IA: lê só ids e opções que existem; o resto é ignorado
const pergs = perguntasSupervisao(classificada, hoje)
const sug = lerSugestoesIA(`Aqui vai:\n[lanc_estoque] => estoque || São roupas pra revender, então vão pro estoque.\n[lanc_estoque] => inventado || x\n[nao_existe] => certo || y\n1. Confira o papel.`, pergs, () => ['certo', 'corrigir'])
assert.deepEqual(Object.keys(sug), ['lanc_estoque'])
assert.equal(sug.lanc_estoque.valor, 'estoque')
console.log('OK — ajudante da IA: só aceita pergunta e opção válidas')
