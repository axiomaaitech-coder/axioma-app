# Axioma AI.Tech — Documento de Requisitos

Fonte viva dos requisitos do produto: **o que** cada parte deve fazer (funcionais) e **como** deve se comportar (não funcionais), com a data e a origem de cada decisão. O manual de uso (`lib/documentos/manual`) explica as telas para quem usa; este documento registra as regras que o código precisa cumprir.

Convenção: `RF` = requisito funcional · `RNF` = requisito não funcional · `RV` = requisito visual. Cada item traz a decisão (quem/quando) e onde está no código.

---

## 1. Página inicial pública — `axiomaai.com.br` (`app/page.tsx`)

Manual: **00 — Prólogo e Primeiros Passos**, seção "A página inicial". Última revisão: **2026-10-15** (decisões do Elias em 13, 14 e 15/10).

### 1.1 Funcionais

| Código | Requisito |
|---|---|
| RF-L01 | Visitante sem login vê a página inicial; quem já está conectado é levado ao Painel (`/dashboard`) pelo `middleware.ts`. |
| RF-L02 | Toda a página existe em português, inglês e espanhol; as bandeiras no topo trocam o idioma na hora, sem recarregar. |
| RF-L03 | Botões **Começar Agora**, **Testar 7 dias grátis** e **Quero conhecer** levam a `/cadastro`; **Login** leva a `/login`. |
| RF-L04 | **Conheça o Nexus e o José** leva à página pública `/nexus-jose`. |
| RF-L05 | Os planos e preços vêm do catálogo único `lib/planos.ts` (nunca escritos à mão na página). |
| RF-L06 | Rodapé com links para `/termos`, `/privacidade` e `/login`. |
| RF-L07 | Textos não prometem o que o sistema não faz e não limitam por porte da empresa ("CFO de qualquer porte"). |
| RF-L08 | **Módulos (2026-10-14):** a grade lista os **45 módulos** do Axioma (manual 01–46, menos Planos), cada um com descrição curta nos 3 idiomas; grade completa de 3 colunas × 15 linhas. Nexus e o José leva a `/nexus-jose`. |

### 1.2 Visuais

| Código | Requisito |
|---|---|
| RV-L01 | **Topo:** vídeo `hero-5.mp4` (3:2) inteiro na altura da tela, sem corte e **sem cópia do vídeo nas laterais**; bordas do vídeo se dissolvem no fundo escuro. No computador o vídeo fica deslocado à esquerda, deixando o painel do vídeo visível. |
| RV-L02 | **Frase do topo** ("O Futuro Financeiro do Brasil Pensa Sozinho") na faixa escura **à direita**, sem cobrir o vídeo, com texto complementar nos 3 idiomas. |
| RV-L03 | **Alternância de faixas:** depois do topo, as seções alternam **branco `#ffffff`** e **azul-marinho `#101b3d`** até o fim (referências: print Behance/XMS e `tema-tokens.md`). |
| RV-L04 | **Verde único:** todo verde da página é o **verde-menta `#2ecc9b`**. Proibido verde escuro ("verde militar", ex.: `#0f7a5a`, `#0a4f3b`, `#0f7d5c`) na landing. |
| RV-L05 | **Botões primários:** fundo verde-menta, letra azul-marinho (padrão do `tema-tokens.md`). Botão de contorno em faixa branca: contorno e letra azul-marinho. |
| RV-L06 | **Cartões verde-menta com letra azul-marinho `#101b3d`** (2026-10-15, antes branca — "muito claro, ruim de ler"): idiomas e "Troque o idioma…", itens da Conferência, itens do Acompanhamento (robôs) e a caixa "IA por mês" dos planos. |
| RV-L07 | **Cartões de Segurança:** verde-menta com **letra azul-marinho** (mais nítido — pedido do Elias). |
| RV-L08 | **Módulos e Planos:** cartões **azul-marinho** sobre a faixa branca; nome em verde-menta, texto branco; mesmo efeito de luz/borda ao passar o mouse. Nunca cartão branco sobre fundo branco. |
| RV-L10 | **Títulos em destaque (2026-10-15):** inicial maiúscula em cada palavra, exceto palavrinhas de ligação no meio ("Você Conhece os Números da Sua Empresa?"; "Einstein nos Ensinou: Massa é Energia"); siglas intactas; primeira palavra e a que segue ":" sempre maiúsculas. Função única `tt()` em `app/page.tsx` (lista `MINUSCULAS` por idioma). Texto pequeno não muda. |
| RV-L11 | **"Empresa"/"Company" sempre com maiúscula** em toda a página; **"O Axioma"** (nunca "A Axioma"); sem "&" em título (usa "e"); espanhol sempre em *usted* ("su"), nunca *tú*. |
| RV-L09 | **Fonte:** **Red Hat Display** em toda a página (títulos e texto), carregada pelo próprio site via `next/font` (`app/fontesLanding.ts`). Títulos do José e nomes dos planos seguem em Cinzel. Proibido `@import` de fonte dentro de `<style jsx>` (não carrega e cai em fonte genérica). |

### 1.3 Não funcionais

| Código | Requisito |
|---|---|
| RNF-L01 | **Efeito de rolagem profissional:** blocos de vídeo/texto entram pelas laterais com **GSAP ScrollTrigger** (`useEntradaLateral`), presos ao movimento da rolagem (*scrub*), vindo de longe, em 3D e crescendo; ao rolar para cima, voltam. |
| RNF-L02 | **Efeitos sempre ativos:** a landing **não** desliga animações pela preferência "menos movimento" do sistema (`prefers-reduced-motion`). Decisão do Elias, 2026-10-13: trabalho premium não fica preso a trava casual do sistema. |
| RNF-L03 | **Sem rolagem lateral:** nenhum efeito pode criar barra de rolagem horizontal (raiz com `overflow-x: hidden`, seções com efeito lateral com `overflow: hidden`). Conferir `scrollWidth == clientWidth`. |
| RNF-L04 | **Vídeos leves:** vídeos comprimidos (total ~42 MB) e carregados só quando o visitante chega perto (`VideoFrame` com `IntersectionObserver`). |
| RNF-L06 | **Cartões entram pelo próprio lado (2026-10-14):** `Reveal de="lado"` — coluna da esquerda pela esquerda, da direita pela direita, a do meio (e o celular) alternando; nunca um cartão cruza o vizinho. Distância medida pela largura da tela (bloco pequeno, como o José, também vem de fora). *Scrub* 0,3 s. |
| RNF-L07 | **Toda seção com movimento (2026-10-15):** Segurança, faixa Gestão Financeira, Painel Inteligente, Módulos, Nexus/José e Planos entram pelas laterais. Pendente: efeito mais forte no "Pronto para Ter um CFO na Sua Empresa?" com elemento escolhido pelo Elias. |
| RNF-L05 | **Celular:** layout em uma coluna, sem corte de texto e sem rolagem lateral (ainda não conferido em tela de celular — pendente). |

### 1.4 Como voltar atrás

- Marcador git `landing-antes-cores`: versão aprovada antes da alternância de cores e das fontes novas.
- Pendente (2026-10-13): Elias notou "alguns atrasos" no efeito de rolagem — investigar (*scrub* 0,6 s e vídeos carregando ao chegar perto) e conferir no celular.

---

## 2. Inteligência artificial e voz — Axioma Voice Intelligence

Documentos técnicos: `docs/MOTOR-IA.md`, `docs/VOICE-INTELLIGENCE.md`. Última revisão: **2026-10-15**.

| Código | Requisito |
|---|---|
| RF-IA01 | Toda IA passa pelo motor único (`/api/ia/motor`); a voz é só entrada (fala → texto) e saída (texto → fala), nunca um segundo motor. |
| RF-IA02 | **Papel:** a inteligência financeira atende dono, admin, financeiro, contábil e leitor; **operador de caixa** recebe aviso trilíngue (403) — mesma regra da RLS `empresas_do_usuario_operacional` (`podeUsarIAFinanceira`, `lib/ia/motor.ts`). |
| RF-IA03 | IA Financeira e IA Tributária mostram o aviso de **saldo de IA esgotado** (402) e de operador (403) em vez de resposta pronta. |
| RF-IA04 | **Significado fixo dos termos** (texto e voz): faturamento = receita do período pedido; lucro = média mensal de 12 meses (dito como "em média"; mês específico = tela DRE); caixa = realizado até hoje, nunca "livre para gastar"; contas a pagar separadas em aberto/vencido/30 dias. |
| RNF-IA01 | Número só é "confirmado" se veio do servidor (retrato, economia, ferramentas): `valoresSemFonteServidor` + `verificacao` na resposta do motor; escalonamento preservado. |
| RNF-IA02 | Ferramenta `custos` da IA conta só custos fixos **vigentes**; leitura que falha vira erro explícito, nunca lista vazia. |
| RNF-V01 | **Microfone:** `Permissions-Policy: microphone=(self)` (só o próprio Axioma; câmera e localização bloqueadas); `media-src 'self' blob:` para tocar áudio gerado. Nenhum domínio de fornecedor na CSP antes de integração efetiva. |
| RNF-V02 | Voz (Fases 1 e 2, ainda não ligadas): áudio nunca guardado; nada de áudio/transcrição em analytics; auditoria só com metadados; chaves só no servidor; até 60 s / 2 MB por gravação. |
| LEGAL-V01 | **Antes de ligar a voz para clientes:** Política de Privacidade (3 idiomas) deve citar o tratamento de voz, a transcrição pela OpenAI como suboperadora e a não retenção do áudio. Em 2026-10-15 nada disso está ativo — Termos e Privacidade **não** foram alterados. |

---

## 3. Confiabilidade — Sistema Anti-Falha

Documento técnico: `docs/ANTI-FALHA.md`. Decisão do Elias, **2026-10-15**: "primeiro o sistema se defende sozinho; o aviso é o último caso".

| Código | Requisito |
|---|---|
| RNF-AF01 | Toda leitura do banco tenta de novo sozinha até 3 vezes (0,4 s e 1,2 s) antes de qualquer aviso; erro permanente (permissão/regra) volta na hora (`lib/antiFalha.ts`). Gravação nunca é repetida. |
| RNF-AF02 | Checagem "já existe?" antes de gravar usa `exigirLeitura`: se falhar de verdade, **cancela** a gravação — nunca grava em dobro (NF importada, transação do extrato, período da DRE, lote, fornecedor, rastreio, pedido de compra, DAS). |
| RNF-AF03 | Listas e painéis usam `registrarLeitura`: seguem sem o dado e mostram **"Alguns dados não puderam ser carregados"** (`components/AvisoFalhaLeitura`, 3 idiomas). Dado faltante nunca aparece como zero. |
| RNF-AF04 | `lerTodas` (leitura em lotes de 1000) usa a mesma retentativa em cada lote. |
| RNF-AF05 | Rota com chave de serviço ou Stripe cria o cliente **no 1º uso** (`lib/supabaseServico.ts`): sem a chave, só a rota falha — a publicação do site segue. |
| RNF-AF06 | Antes de publicar: `tsc`, todos os `scripts/check-*`, lint sem erro novo e `npx next build` sem erro (100/100 páginas em 2026-10-15). |
| LEGAL-AF01 | Nenhum dado novo é coletado: as falhas vão ao Sentry, já previsto na Política de Privacidade ("registros de erros técnicos"). Termos/Privacidade não alterados. |

---

## 4. Datas — dia certo em todo o sistema

Decisão: **2026-10-15** (auditoria). Código: `lib/datas.ts`.

| Código | Requisito |
|---|---|
| RNF-D01 | "Hoje" = `hojeISO()` (fuso da empresa pelo estado/cidade); nunca `new Date().toISOString().slice(0, 10)` (em UTC o dia virava às 21h). Corrigido em 75 pontos de 29 arquivos. |
| RNF-D02 | Dia de uma data montada no horário local = `isoDia(d)` (vale também para quem usa o Axioma fora do Brasil). |
| RNF-D03 | Somar dias/meses só com calendário: `somarDiasISO`, `somarMesesISO` (31/01 + 1 mês = 28/02 — parcelas de cartão no Importar). |
| RNF-D04 | Ano de uma data só-dia pelo texto da data (receita de 1º de janeiro no ano certo — Contas a Receber e Inadimplência). |
| RNF-D05 | Servidor: "hoje" de Brasília (`hojeISO(new Date(), 'America/Sao_Paulo')`) quando a empresa ainda não é conhecida; ferramentas da IA no fuso da empresa. |

