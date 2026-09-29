// Conferência da leitura de NF-e no Importar Documentos (parcelas e pagamentos).
// Rodar: npx tsx scripts/check-importar-nfe.mts
import assert from 'node:assert/strict'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { parseXMLNFe } = await import('../lib/importarParsers')

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
