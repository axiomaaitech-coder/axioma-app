// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '50 - RH Painel.docx',
  titulo: 'Manual 50 — RH · Painel',
  subtitulo: 'O quadro de pessoas e o Radar de Risco Trabalhista, cada alerta com a lei que o sustenta',
  info: ['Menu: Gestão → RH  •  Manual de uso do Axioma AI.Tech  •  Versão 1.0 (novembro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Mostra, numa tela só, quantas pessoas a Empresa tem e **o que pode virar problema trabalhista antes de virar**: experiência vencendo, admissão não enviada ao eSocial, quem trabalha sem exame admissional, documentos faltando. Cada alerta traz a **base legal** e os nomes. **Nenhum valor de multa é estimado** — depende da fiscalização e da tabela vigente.' },
    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Gestão ▼** → **RH**.'] },
    { h1: 'Letreiro' },
    { p: 'Faixa azul-marinho logo abaixo das abas, rolando sozinha: ativos, salários-base (só com liberação de salário) e quantos alertas o Radar tem. Passe o mouse para parar.' },
    { h1: 'Números do topo' },
    { lista: ['**Ativos**, **Admissões no mês**, **Desligamentos no mês** e **Salários-base mensais** (só para quem tem liberação de salário): toque para abrir RH · Colaboradores já filtrado (só os ativos, só quem entrou ou só quem saiu no mês).', '**Rotatividade do mês** = ((admissões + desligamentos) ÷ 2) ÷ ativos de hoje × 100. Tocar leva até a fórmula.'] },
    { h1: 'Radar de Risco Trabalhista' },
    { lista: [
      '**Crítico** (vermelho): empregador não cadastrado (o eSocial exige antes de qualquer admissão — o botão leva a RH · Estrutura); experiência vencida sem decisão; admissão sem envio ao eSocial (precisa ir até a véspera do início); pessoa trabalhando sem exame admissional (NR-7).',
      '**Atenção** (amarelo): experiência terminando em até 15 dias; prazo determinado terminando em até 30 dias; documentos obrigatórios pendentes; ativo sem cargo ou sem salário.',
      '**Obrigação** (azul): o que a lei exige pelo tamanho — ponto acima de 20 pessoas (CLT art. 74), cota PCD a partir de 100 (Lei 8.213 art. 93) e relatório de igualdade salarial a partir de 100 (Lei 14.611). Perto de um limite, aparece um aviso amarelo embaixo.',
      'Cada alerta tem um botão que leva à tela que resolve (Exames, Documentos, Contratos a vencer, Central do eSocial, Obrigações — Manual 51); com uma pessoa só, abre direto a ficha dela. **Cada nome do alerta abre a ficha da pessoa** já na parte certa.',
      'Exame admissional só aparece para quem tem liberação de **saúde**; documentos, só para quem tem **dados pessoais**.',
    ] },
    { h1: 'Gráfico e IA' },
    { lista: ['**Ativos por departamento**: aparece quando há pessoas ativas. **Toque numa barra** para abrir Colaboradores só com as pessoas daquele departamento. Os avisos amarelos de "falta pouco" abrem Obrigações da empresa.', '**Inteligência Axioma — Especialista de RH**: "o que preciso resolver no RH hoje?", "tem algum risco trabalhista?". A IA usa o mesmo cálculo da tela e só lê o que você pode ver. Escreva ou toque no **microfone** para falar; **Ouvir** lê a resposta em voz alta e **Conversa ao vivo** conversa por voz, como com o José. A conversa fica salva e continua nas 3 telas do RH.'] },
    { h1: 'Compartilhar e exportar' },
    { lista: ['**Compartilhar**, **PDF** e **Excel** levam a lista de alertas com a base legal.'] },
    { nota: 'Quem pode ver: Proprietário, CEO, Sócio e Admin; os demais só com liberação em RH · Estrutura → **Acessos do RH**. Se a internet falhar ao conferir o acesso, a tela avisa "Não foi possível conferir o seu acesso" com o botão **Tentar de novo** (não mostra um falso "sem acesso").' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '50 - HR Panel.docx',
  titulo: 'Manual 50 — HR · Panel',
  subtitulo: 'Headcount and the Labor Risk Radar, each alert with the law behind it',
  info: ['Menu: Management → HR  •  Axioma AI.Tech user manual  •  Version 1.0 (November 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Shows, on one screen, how many people the company has and **what can become a labor problem before it does**: probation ending, hiring not sent to eSocial, people working without the pre-employment exam, missing documents. Each alert shows the **legal basis** and the names. **No fine amount is estimated** — it depends on inspection and the current table.' },
    { h1: 'How to get there' },
    { lista: ['Top menu → **Management ▼** → **HR**.'] },
    { h1: 'Ticker' },
    { p: 'Navy strip right below the tabs, scrolling on its own: active, base salaries (only with salary access) and how many alerts the Radar has. Hover to pause.' },
    { h1: 'Top numbers' },
    { lista: ['**Active**, **Hires this month**, **Terminations this month** and **Monthly base salaries** (only with salary access): tap to open HR · Employees already filtered (only active, only hired or only terminated this month).', '**Monthly turnover** = ((hires + terminations) ÷ 2) ÷ today\'s active × 100. Tapping shows the formula.'] },
    { h1: 'Labor Risk Radar' },
    { lista: [
      '**Critical** (red): employer not registered (eSocial requires it before any hire — the button takes you to HR · Structure); probation expired with no decision; hiring not sent to eSocial (due by the day before start); person working without the pre-employment exam (NR-7).',
      '**Attention** (yellow): probation ending within 15 days; fixed term ending within 30 days; required documents pending; active person with no job title or salary.',
      '**Obligation** (blue): what the law requires by size — time clock above 20 people (CLT art. 74), disability quota from 100 (Law 8.213 art. 93) and pay equity report from 100 (Law 14.611). Near a threshold, a yellow notice appears below.',
      'Each alert has a button that opens the screen that solves it (Exams, Documents, Expiring contracts, eSocial center, Obligations — Manual 51); with only one person, it opens their record directly. **Each name in the alert opens the record of that person** at the right part.',
      'The exam alert only shows with **health** access; documents only with **personal data** access.',
    ] },
    { h1: 'Chart and AI' },
    { lista: ['**Active by department**: shown when there are active people. **Tap a bar** to open Employees with only that department. The yellow "almost there" notices open Company obligations.', '**Axioma Intelligence — HR Specialist**: "what do I need to solve in HR today?", "is there any labor risk?". The AI uses the same calculation as the screen and only reads what you can see. Type or tap the **microphone** to speak; **Listen** reads the answer aloud and **Live conversation** talks by voice, like with José. The conversation is saved and continues across the 3 HR screens.'] },
    { h1: 'Share and export' },
    { lista: ['**Share**, **PDF** and **Excel** carry the alert list with the legal basis.'] },
    { nota: 'Who can see: Owner, CEO, Partner and Admin; others only with access granted in HR · Structure → **HR access**. If the internet fails while checking access, the screen says "Could not check your HR access" with a **Try again** button (it never shows a false "no access").' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '50 - RRHH Panel.docx',
  titulo: 'Manual 50 — RR. HH. · Panel',
  subtitulo: 'El cuadro de personas y el Radar de Riesgo Laboral, cada alerta con la ley que la sostiene',
  info: ['Menú: Gestión → RR. HH.  •  Manual de uso de Axioma AI.Tech  •  Versión 1.0 (noviembre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Muestra, en una sola pantalla, cuántas personas tiene la empresa y **lo que puede volverse un problema laboral antes de que suceda**: experiencia por vencer, admisión no enviada al eSocial, quien trabaja sin examen de admisión, documentos faltantes. Cada alerta trae la **base legal** y los nombres. **Ningún monto de multa se estima** — depende de la fiscalización y la tabla vigente.' },
    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Gestión ▼** → **RR. HH.**.'] },
    { h1: 'Letrero' },
    { p: 'Franja azul marino debajo de las pestañas, que se desplaza sola: activos, salarios base (solo con permiso de salario) y cuántas alertas tiene el Radar. Pase el mouse para detenerla.' },
    { h1: 'Números superiores' },
    { lista: ['**Activos**, **Admisiones del mes**, **Desvinculaciones del mes** y **Salarios base mensuales** (solo con salario habilitado): toque para abrir RR. HH. · Colaboradores ya filtrado (solo activos, solo admitidos o solo desvinculados en el mes).', '**Rotación del mes** = ((admisiones + desvinculaciones) ÷ 2) ÷ activos de hoy × 100. Al tocar se ve la fórmula.'] },
    { h1: 'Radar de Riesgo Laboral' },
    { lista: [
      '**Crítico** (rojo): empleador no registrado (el eSocial lo exige antes de cualquier admisión — el botón lleva a RR. HH. · Estructura); experiencia vencida sin decisión; admisión sin envío al eSocial (debe ir hasta la víspera del inicio); persona trabajando sin examen de admisión (NR-7).',
      '**Atención** (amarillo): experiencia terminando en hasta 15 días; plazo determinado terminando en hasta 30 días; documentos obligatorios pendientes; activo sin cargo o sin salario.',
      '**Obligación** (azul): lo que la ley exige por tamaño — control de jornada con más de 20 personas (CLT art. 74), cuota de discapacidad desde 100 (Ley 8.213 art. 93) e informe de igualdad salarial desde 100 (Ley 14.611). Cerca de un límite aparece un aviso amarillo abajo.',
      'Cada alerta tiene un botón que abre la pantalla que la resuelve (Exámenes, Documentos, Contratos por vencer, Central del eSocial, Obligaciones — Manual 51); con una sola persona, abre directamente su ficha. **Cada nombre de la alerta abre la ficha de la persona** en la parte correcta.',
      'El examen solo aparece con **salud** habilitada; los documentos, con **datos personales**.',
    ] },
    { h1: 'Gráfico e IA' },
    { lista: ['**Activos por departamento**: aparece cuando hay personas activas. **Toque una barra** para abrir Colaboradores solo con ese departamento. Los avisos amarillos de "falta poco" abren Obligaciones de la empresa.', '**Inteligencia Axioma — Especialista de RR. HH.**: "¿qué debo resolver en RR. HH. hoy?", "¿hay algún riesgo laboral?". La IA usa el mismo cálculo de la pantalla y solo lee lo que usted puede ver. Escriba o toque el **micrófono** para hablar; **Escuchar** lee la respuesta en voz alta y **Conversación en vivo** conversa por voz, como con José. La conversación queda guardada y sigue en las 3 pantallas de RR. HH.'] },
    { h1: 'Compartir y exportar' },
    { lista: ['**Compartir**, **PDF** y **Excel** llevan la lista de alertas con la base legal.'] },
    { nota: 'Quién puede ver: Propietario, CEO, Socio y Admin; los demás solo con acceso en RR. HH. · Estructura → **Accesos de RR. HH.** Si internet falla al verificar el acceso, la pantalla avisa "No se pudo verificar su acceso" con el botón **Intentar de nuevo** (no muestra un falso "sin acceso").' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
