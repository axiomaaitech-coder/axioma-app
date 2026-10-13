# Axioma AI.Tech — Documento de Requisitos

Fonte viva dos requisitos do produto: **o que** cada parte deve fazer (funcionais) e **como** deve se comportar (não funcionais), com a data e a origem de cada decisão. O manual de uso (`lib/documentos/manual`) explica as telas para quem usa; este documento registra as regras que o código precisa cumprir.

Convenção: `RF` = requisito funcional · `RNF` = requisito não funcional · `RV` = requisito visual. Cada item traz a decisão (quem/quando) e onde está no código.

---

## 1. Página inicial pública — `axiomaai.com.br` (`app/page.tsx`)

Manual: **00 — Prólogo e Primeiros Passos**, seção "A página inicial". Última revisão: **2026-10-13** (decisões do Elias nesta data).

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

### 1.2 Visuais

| Código | Requisito |
|---|---|
| RV-L01 | **Topo:** vídeo `hero-5.mp4` (3:2) inteiro na altura da tela, sem corte e **sem cópia do vídeo nas laterais**; bordas do vídeo se dissolvem no fundo escuro. No computador o vídeo fica deslocado à esquerda, deixando o painel do vídeo visível. |
| RV-L02 | **Frase do topo** ("O Futuro Financeiro do Brasil Pensa Sozinho") na faixa escura **à direita**, sem cobrir o vídeo, com texto complementar nos 3 idiomas. |
| RV-L03 | **Alternância de faixas:** depois do topo, as seções alternam **branco `#ffffff`** e **azul-marinho `#101b3d`** até o fim (referências: print Behance/XMS e `tema-tokens.md`). |
| RV-L04 | **Verde único:** todo verde da página é o **verde-menta `#2ecc9b`**. Proibido verde escuro ("verde militar", ex.: `#0f7a5a`, `#0a4f3b`, `#0f7d5c`) na landing. |
| RV-L05 | **Botões primários:** fundo verde-menta, letra azul-marinho (padrão do `tema-tokens.md`). Botão de contorno em faixa branca: contorno e letra azul-marinho. |
| RV-L06 | **Cartões verde-menta com letra branca:** idiomas e "Troque o idioma…" (Três idiomas), itens da Conferência, itens do Acompanhamento (robôs). |
| RV-L07 | **Cartões de Segurança:** verde-menta com **letra azul-marinho** (mais nítido — pedido do Elias). |
| RV-L08 | **Módulos e Planos:** cartões **azul-marinho** sobre a faixa branca; nome em verde-menta, texto branco; mesmo efeito de luz/borda ao passar o mouse. Nunca cartão branco sobre fundo branco. |
| RV-L09 | **Fonte:** **Red Hat Display** em toda a página (títulos e texto), carregada pelo próprio site via `next/font` (`app/fontesLanding.ts`). Títulos do José e nomes dos planos seguem em Cinzel. Proibido `@import` de fonte dentro de `<style jsx>` (não carrega e cai em fonte genérica). |

### 1.3 Não funcionais

| Código | Requisito |
|---|---|
| RNF-L01 | **Efeito de rolagem profissional:** blocos de vídeo/texto entram pelas laterais com **GSAP ScrollTrigger** (`useEntradaLateral`), presos ao movimento da rolagem (*scrub*), vindo de longe, em 3D e crescendo; ao rolar para cima, voltam. |
| RNF-L02 | **Efeitos sempre ativos:** a landing **não** desliga animações pela preferência "menos movimento" do sistema (`prefers-reduced-motion`). Decisão do Elias, 2026-10-13: trabalho premium não fica preso a trava casual do sistema. |
| RNF-L03 | **Sem rolagem lateral:** nenhum efeito pode criar barra de rolagem horizontal (raiz com `overflow-x: hidden`, seções com efeito lateral com `overflow: hidden`). Conferir `scrollWidth == clientWidth`. |
| RNF-L04 | **Vídeos leves:** vídeos comprimidos (total ~42 MB) e carregados só quando o visitante chega perto (`VideoFrame` com `IntersectionObserver`). |
| RNF-L05 | **Celular:** layout em uma coluna, sem corte de texto e sem rolagem lateral (ainda não conferido em tela de celular — pendente). |

### 1.4 Como voltar atrás

- Marcador git `landing-antes-cores`: versão aprovada antes da alternância de cores e das fontes novas.
- Pendente (2026-10-13): Elias notou "alguns atrasos" no efeito de rolagem — investigar (*scrub* 0,6 s e vídeos carregando ao chegar perto) e conferir no celular.
