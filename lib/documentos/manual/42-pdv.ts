// Fonte única: gera o Word (scripts/gerar-docs) e a página no site.
import type { DocumentoAxioma } from "../tipos"

const doc: DocumentoAxioma = {
  arquivo: '42 - PDV - Ponto de Venda.docx',
  titulo: 'Manual 42 — PDV (Ponto de Venda)',
  subtitulo: 'Catálogo, frente de caixa, fechamento e retaguarda',
  info: ['Menu: PDV  •  Manual de uso do Axioma AI.Tech'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'O PDV é o caixa da loja dentro do Axioma: cadastra produtos, vende, baixa o estoque, emite o cupom e fecha o caixa. Cada venda já entra nas receitas, no estoque e nos indicadores, sem digitar de novo.' },
    { p: 'O PDV tem cinco áreas: **Catálogo**, **Cadastro**, **Importar XML da NF-e**, **Frente de Caixa** e **Retaguarda**.' },

    { h1: 'Catálogo' },
    { p: 'Navegue por **nicho** (Alimentos, Não-Alimentos), **categoria** e **sub-nicho** até os produtos. O modo pode ser **Produto**, **Misto** ou **Serviço**. Busque por nome, SKU ou código de barras. Cada produto mostra estoque e preço, com **Editar** e **Excluir** (produto com venda não pode ser excluído). Botões: **+ Novo Produto/Serviço**, **Importar XML da NF-e**, **Frente de Caixa** e **Produtos Cadastrados**.' },

    { h1: 'Cadastro inteligente' },
    { p: 'Feito para digitar o mínimo. Escolha nicho, categoria e sub-nicho e use um dos modos:' },
    { lista: [
      '**Cadastro Único**: preencha nome, marca, preço de venda, unidade, estoque mínimo e status. O Axioma tenta preencher pelo catálogo de códigos de barras ("Preenchido pelo catálogo — confira") ou dá uma **sugestão automática** para você confirmar.',
      '**Bipagem em Massa**: bipe um produto atrás do outro. Os itens salvos aparecem na lista da sessão, com **Desfazer**, **Editar** e **Pular**. Se o código já existe, o produto abre para edição.',
    ] },

    { h1: 'Importar XML da NF-e (compra)' },
    { numerada: [
      'Escolha o nicho da nota e envie o arquivo **.xml**.',
      'O fornecedor é reconhecido (ou será cadastrado automaticamente ao confirmar).',
      'Para cada item, o Axioma diz se é **Produto novo** ou **Já existe no catálogo** e sugere categoria e sub-nicho.',
      'Defina o preço de venda (ou aplique uma **margem sobre o custo** a todos os itens novos), informe se veio em fardo/caixa e quantas unidades tem, e marque **Incluir**.',
      'Clique em **Confirmar e Gravar**. O estoque entra, a conferência compara a nota com o recebimento e as contas a pagar, e o Axioma avisa se encontrou divergência.',
    ] },
    { nota: 'A mesma nota (mesma chave de acesso) não pode ser importada duas vezes. Lote e validade presentes na nota são detectados.' },

    { h1: 'Frente de Caixa (vender)' },
    { numerada: [
      'Escolha o caixa que vai operar e, se não houver turno aberto, clique em **Abrir Caixa** informando o **fundo de troco**.',
      'Bipe o código de barras ou digite nome/SKU. O item entra na **Lista de Produtos** com valor unitário e total.',
      'Clique em **Finalizar Venda** (ou F2), escolha a forma de pagamento (Dinheiro, Débito, Crédito, Outro), informe o valor recebido (o troco é calculado) e, se quiser, o CPF na nota.',
      'Clique em **Confirmar Venda**. O estoque baixa e o cupom é gerado.',
    ] },
    { tabela: { colunas: ['Atalho', 'Função'], larguras: [2400, 6626], linhas: [
      ['Enter', 'Adicionar item'],
      ['F2', 'Finalizar venda'],
      ['Delete', 'Remover o último item'],
      ['Esc', 'Fechar ou cancelar'],
    ] } },
    { p: 'O cupom (não fiscal) mostra os itens, o valor aproximado dos tributos (Lei 12.741), o operador e o caixa. Pode ser impresso em **impressora térmica** pelo programa **QZ Tray** ou pela tela; em **Impressão** você testa a conexão, liga a impressão automática e define a mensagem de rodapé.' },
    { alerta: '**Preço é decisão do dono.** Se um produto não tem preço de venda, só o proprietário ou um administrador pode defini-lo. O operador de caixa nunca define preço. Venda sem estoque suficiente também pede autorização.' },

    { h1: 'Retaguarda (acompanhar e fechar o caixa)' },
    { p: 'Protegida por senha, para o caso de o dono se afastar do caixa. Na primeira vez, três perguntas configuram o acompanhamento: **ao vivo**, **só fechamento** ou **os dois**; se quer **conferir a gaveta**; e se quer ver **lucro real e margem** (dá para mudar depois em **Configurar**).' },
    { lista: [
      '**Indicadores do dia**: total vendido, número de vendas, ticket médio e lucro real (avisa quando há item sem custo cadastrado).',
      '**Vendas por categoria, sub-nicho e produto**, com horário, valor e lucro, e quanto o estoque baixou.',
      '**Itens vendidos com prejuízo hoje**, com o cálculo.',
      '**Sangria** e **Suprimento**: registre retiradas e reforços de dinheiro com motivo; dá para editar valor e motivo ou excluir.',
      '**Fechamento**: informe o valor contado na gaveta (há **Calculadora** e **Contagem de gaveta** por notas e moedas). O Axioma compara **Esperado × Contado** e mostra a **Diferença** (sobra, falta ou "Bateu certinho"), com a composição do esperado: fundo de abertura + vendas em dinheiro + suprimentos − sangrias.',
    ] },
    { nota: 'Fechar o caixa não pode ser desfeito: o turno é marcado como fechado. O papel **Caixa** dá acesso só ao PDV, sem o restante do Axioma.' },
  ],
}

export default doc
