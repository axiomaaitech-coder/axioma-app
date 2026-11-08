// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '50 - RH Painel.docx',
  titulo: 'Manual 50 — RH · Painel',
  subtitulo: 'O quadro de pessoas e o Radar de Risco Trabalhista, cada alerta com a lei que o sustenta',
  info: ['Menu: Gestão → RH · Painel  •  Manual de uso do Axioma AI.Tech  •  Versão 1.0 (novembro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Mostra, numa tela só, quantas pessoas a Empresa tem e **o que pode virar problema trabalhista antes de virar**: experiência vencendo, admissão não enviada ao eSocial, quem trabalha sem exame admissional, documentos faltando. Cada alerta traz a **base legal** e os nomes. **Nenhum valor de multa é estimado** — depende da fiscalização e da tabela vigente.' },
    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Gestão ▼** → **RH · Painel**.'] },
    { h1: 'Números do topo' },
    { lista: ['**Ativos**, **Admissões no mês**, **Desligamentos no mês** e **Salários-base mensais** (só para quem tem liberação de salário): toque para abrir RH · Colaboradores.', '**Rotatividade do mês** = ((admissões + desligamentos) ÷ 2) ÷ ativos de hoje × 100. Tocar leva até a fórmula.'] },
    { h1: 'Radar de Risco Trabalhista' },
    { lista: [
      '**Crítico** (vermelho): experiência vencida sem decisão; admissão sem envio ao eSocial (precisa ir até a véspera do início); pessoa trabalhando sem exame admissional (NR-7).',
      '**Atenção** (amarelo): experiência terminando em até 15 dias; prazo determinado terminando em até 30 dias; documentos obrigatórios pendentes; ativo sem cargo ou sem salário.',
      '**Obrigação** (azul): o que a lei exige pelo tamanho — ponto acima de 20 pessoas (CLT art. 74), cota PCD a partir de 100 (Lei 8.213 art. 93) e relatório de igualdade salarial a partir de 100 (Lei 14.611). Perto de um limite, aparece um aviso amarelo embaixo.',
      'Cada alerta tem um botão que leva direto para resolver.',
      'Exame admissional só aparece para quem tem liberação de **saúde**; documentos, só para quem tem **dados pessoais**.',
    ] },
    { h1: 'Gráfico e IA' },
    { lista: ['**Ativos por departamento**: aparece quando há pessoas ativas.', '**Pergunte à IA do RH**: "o que preciso resolver no RH hoje?", "tem algum risco trabalhista?". A IA usa o mesmo cálculo da tela e só lê o que você pode ver.'] },
    { h1: 'Compartilhar e exportar' },
    { lista: ['**Compartilhar**, **PDF** e **Excel** levam a lista de alertas com a base legal.'] },
    { nota: 'Quem pode ver: Proprietário, CEO, Sócio e Admin; os demais só com liberação em RH · Estrutura → **Acessos do RH**.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '50 - HR Panel.docx',
  titulo: 'Manual 50 — HR · Panel',
  subtitulo: 'Headcount and the Labor Risk Radar, each alert with the law behind it',
  info: ['Menu: Management → HR · Panel  •  Axioma AI.Tech user manual  •  Version 1.0 (November 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Shows, on one screen, how many people the company has and **what can become a labor problem before it does**: probation ending, hiring not sent to eSocial, people working without the pre-employment exam, missing documents. Each alert shows the **legal basis** and the names. **No fine amount is estimated** — it depends on inspection and the current table.' },
    { h1: 'How to get there' },
    { lista: ['Top menu → **Management ▼** → **HR · Panel**.'] },
    { h1: 'Top numbers' },
    { lista: ['**Active**, **Hires this month**, **Terminations this month** and **Monthly base salaries** (only with salary access): tap to open HR · Employees.', '**Monthly turnover** = ((hires + terminations) ÷ 2) ÷ today\'s active × 100. Tapping shows the formula.'] },
    { h1: 'Labor Risk Radar' },
    { lista: [
      '**Critical** (red): probation expired with no decision; hiring not sent to eSocial (due by the day before start); person working without the pre-employment exam (NR-7).',
      '**Attention** (yellow): probation ending within 15 days; fixed term ending within 30 days; required documents pending; active person with no job title or salary.',
      '**Obligation** (blue): what the law requires by size — time clock above 20 people (CLT art. 74), disability quota from 100 (Law 8.213 art. 93) and pay equity report from 100 (Law 14.611). Near a threshold, a yellow notice appears below.',
      'Each alert has a button that takes you straight to fix it.',
      'The exam alert only shows with **health** access; documents only with **personal data** access.',
    ] },
    { h1: 'Chart and AI' },
    { lista: ['**Active by department**: shown when there are active people.', '**Ask the HR AI**: "what do I need to solve in HR today?", "is there any labor risk?". The AI uses the same calculation as the screen and only reads what you can see.'] },
    { h1: 'Share and export' },
    { lista: ['**Share**, **PDF** and **Excel** carry the alert list with the legal basis.'] },
    { nota: 'Who can see: Owner, CEO, Partner and Admin; others only with access granted in HR · Structure → **HR access**.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '50 - RRHH Panel.docx',
  titulo: 'Manual 50 — RR. HH. · Panel',
  subtitulo: 'El cuadro de personas y el Radar de Riesgo Laboral, cada alerta con la ley que la sostiene',
  info: ['Menú: Gestión → RR. HH. · Panel  •  Manual de uso de Axioma AI.Tech  •  Versión 1.0 (noviembre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Muestra, en una sola pantalla, cuántas personas tiene la empresa y **lo que puede volverse un problema laboral antes de que suceda**: experiencia por vencer, admisión no enviada al eSocial, quien trabaja sin examen de admisión, documentos faltantes. Cada alerta trae la **base legal** y los nombres. **Ningún monto de multa se estima** — depende de la fiscalización y la tabla vigente.' },
    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Gestión ▼** → **RR. HH. · Panel**.'] },
    { h1: 'Números superiores' },
    { lista: ['**Activos**, **Admisiones del mes**, **Desvinculaciones del mes** y **Salarios base mensuales** (solo con salario habilitado): toque para abrir RR. HH. · Colaboradores.', '**Rotación del mes** = ((admisiones + desvinculaciones) ÷ 2) ÷ activos de hoy × 100. Al tocar se ve la fórmula.'] },
    { h1: 'Radar de Riesgo Laboral' },
    { lista: [
      '**Crítico** (rojo): experiencia vencida sin decisión; admisión sin envío al eSocial (debe ir hasta la víspera del inicio); persona trabajando sin examen de admisión (NR-7).',
      '**Atención** (amarillo): experiencia terminando en hasta 15 días; plazo determinado terminando en hasta 30 días; documentos obligatorios pendientes; activo sin cargo o sin salario.',
      '**Obligación** (azul): lo que la ley exige por tamaño — control de jornada con más de 20 personas (CLT art. 74), cuota de discapacidad desde 100 (Ley 8.213 art. 93) e informe de igualdad salarial desde 100 (Ley 14.611). Cerca de un límite aparece un aviso amarillo abajo.',
      'Cada alerta tiene un botón que lleva directo a resolverla.',
      'El examen solo aparece con **salud** habilitada; los documentos, con **datos personales**.',
    ] },
    { h1: 'Gráfico e IA' },
    { lista: ['**Activos por departamento**: aparece cuando hay personas activas.', '**Pregunte a la IA de RR. HH.**: "¿qué debo resolver en RR. HH. hoy?", "¿hay algún riesgo laboral?". La IA usa el mismo cálculo de la pantalla y solo lee lo que usted puede ver.'] },
    { h1: 'Compartir y exportar' },
    { lista: ['**Compartir**, **PDF** y **Excel** llevan la lista de alertas con la base legal.'] },
    { nota: 'Quién puede ver: Propietario, CEO, Socio y Admin; los demás solo con acceso en RR. HH. · Estructura → **Accesos de RR. HH.**' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
