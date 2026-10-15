# Rascunho — Política de Privacidade: ditado por voz (Voice Fase 1)

**Status: RASCUNHO PARA REVISÃO — NÃO PUBLICADO.** Nada aqui foi aplicado em `lib/documentos/privacidade.*.ts`.
Enquanto este texto não for revisado e aprovado (CEO + revisão jurídica), o ditado fica **desligado para
clientes** (`VOZ_ATIVA` sem valor; só `VOZ_EMPRESAS_TESTE` para empresas internas). Requisito: LEGAL-V01.

## Pontos que precisam de decisão antes de publicar

1. **Retenção no fornecedor:** pelas regras da OpenAI para a API, o conteúdo enviado pode ficar em registros de
   monitoramento de abuso **por até 30 dias**. Só deixa de ficar com **Zero Data Retention** ou **Modified Abuse
   Monitoring**, que exigem pedido e aprovação prévia da OpenAI. Opções: (a) pedir ZDR/MAM à OpenAI antes de
   ligar; (b) ligar informando a retenção de até 30 dias (texto abaixo já cobre as duas — escolher a frase).
   Fonte: OpenAI, "Your data" (developers.openai.com/api/docs/guides/your-data), conferida em 15/10/2026.
2. **Data de vigência e versão:** a Política está na v1.0 com `[[DATA DE VIGÊNCIA]]` em aberto — definir junto.
3. **Aviso prévio aos usuários:** alteração relevante deve ser avisada com antecedência (seção 14 da Política).

## Onde entra cada trecho (mesma estrutura nos 3 idiomas)

### Seção 3 — Quais dados tratamos (novo item na lista)
- **PT:** **Voz (ditado), somente quando você toca no microfone:** o áudio da sua fala é enviado para ser convertido em texto e é descartado em seguida. O Axioma **não grava o áudio** em banco de dados, arquivos ou registros, **não guarda o texto ditado** fora do campo em que você o usa e **não identifica pessoas pela voz** (não há biometria de voz).
- **EN:** **Voice (dictation), only when you tap the microphone:** the audio of your speech is sent to be converted into text and is then discarded. Axioma **does not record the audio** in databases, files or logs, **does not keep the dictated text** outside the field where you use it and **does not identify people by their voice** (no voice biometrics).
- **ES:** **Voz (dictado), solo cuando toca el micrófono:** el audio de su habla se envía para convertirlo en texto y luego se descarta. Axioma **no graba el audio** en bases de datos, archivos o registros, **no guarda el texto dictado** fuera del campo donde lo usa y **no identifica a las personas por la voz** (no hay biometría de voz).

### Seção 4 — Para que usamos os dados e com qual base legal (novo item)
- **PT:** Converter a sua fala em texto para preencher o campo escolhido, a seu pedido — execução do contrato (art. 7º, V, LGPD). O texto só é usado depois que você o revisa e envia.
- **EN:** Converting your speech into text to fill the chosen field, at your request — performance of the contract (LGPD art. 7, V). The text is used only after you review and send it.
- **ES:** Convertir su habla en texto para completar el campo elegido, a su pedido — ejecución del contrato (art. 7, V, LGPD). El texto solo se usa después de que usted lo revisa y envía.

### Seção 5 — Inteligência artificial (novo item)
- **PT:** No ditado por voz, o áudio é enviado à **OpenAI (EUA)** apenas para a transcrição. Pelas condições da API, a OpenAI não usa esse conteúdo para treinar modelos; ele pode ficar **por até 30 dias** em registros de monitoramento de abuso do fornecedor *[ou: "não é retido pelo fornecedor (retenção zero contratada)" — escolher conforme item 1]*. O microfone só é ativado depois que você toca no botão e o navegador pede a sua permissão; você pode cancelar a gravação a qualquer momento.
- **EN:** In voice dictation, the audio is sent to **OpenAI (USA)** only for transcription. Under the API terms, OpenAI does not use this content to train models; it may remain **for up to 30 days** in the provider’s abuse-monitoring logs *[or: "it is not retained by the provider (zero retention contracted)" — choose per item 1]*. The microphone is turned on only after you tap the button and your browser asks for permission; you can cancel the recording at any time.
- **ES:** En el dictado por voz, el audio se envía a **OpenAI (EE. UU.)** solo para la transcripción. Según las condiciones de la API, OpenAI no usa este contenido para entrenar modelos; puede permanecer **hasta 30 días** en los registros de monitoreo de abuso del proveedor *[o: "no es retenido por el proveedor (retención cero contratada)" — elegir según el ítem 1]*. El micrófono solo se activa después de que usted toca el botón y el navegador pide su permiso; puede cancelar la grabación en cualquier momento.

### Seção 6 — Com quem compartilhamos (linha da OpenAI na tabela)
- **PT:** `OpenAI | Inteligência artificial (respostas, leitura de documentos e transcrição de voz) | EUA`
- **EN:** `OpenAI | Artificial intelligence (answers, document reading and voice transcription) | USA`
- **ES:** `OpenAI | Inteligencia artificial (respuestas, lectura de documentos y transcripción de voz) | EE. UU.`

### Seção 8 — Por quanto tempo guardamos (novo item)
- **PT:** Áudio do ditado: não é guardado pelo Axioma (existe só durante a conversão). Registro técnico do uso do ditado (data, tela, duração, se foi cobrado — sem áudio e sem texto): pelo mesmo prazo dos registros de uso da IA.
- **EN:** Dictation audio: not kept by Axioma (it exists only during conversion). Technical log of dictation use (date, screen, duration, whether it was charged — no audio and no text): for the same period as AI usage logs.
- **ES:** Audio del dictado: Axioma no lo guarda (existe solo durante la conversión). Registro técnico del uso del dictado (fecha, pantalla, duración, si se cobró — sin audio y sin texto): por el mismo plazo que los registros de uso de la IA.

## Termos de Uso (verificar na mesma revisão)
- Item sobre o saldo de IA: deixar explícito que **cada ditado concluído consome 1 pergunta de IA comum** do saldo do plano; falha técnica, áudio vazio ou não entendido **não consome**.
