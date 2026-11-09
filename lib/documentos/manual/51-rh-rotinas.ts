// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
// Rotinas do RH (auditoria 09/11/2026): Exames, Documentos, Contratos a vencer, Central do eSocial e Obrigações da empresa.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '51 - RH Rotinas.docx',
  titulo: 'Manual 51 — RH · Rotinas do dia a dia',
  subtitulo: 'Exames, documentos, contratos a vencer, eSocial e obrigações da Empresa — cada alerta do Painel leva a uma delas',
  info: ['Menu: Gestão → RH → linha de botões abaixo das abas  •  Manual de uso do Axioma AI.Tech  •  Versão 1.0 (novembro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Cada alerta do Painel do RH tem uma tela própria para ser resolvido. Em todas, **o nome da pessoa abre a ficha dela já na parte certa** (contrato, documentos, eSocial ou desligamento). As listas de pessoas ficam em **ordem alfabética**.' },
    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Gestão ▼** → **RH**. Abaixo das abas Painel · Colaboradores · Estrutura há uma linha de botões: **Exames**, **Documentos**, **Contratos a vencer**, **Central do eSocial** e **Obrigações da empresa**.', 'Ou toque no botão de um alerta do Painel: ele abre a rotina que resolve. Se o alerta tem uma pessoa só, abre direto a ficha dela.'] },
    { h1: 'Exames (precisa da liberação de saúde)' },
    { lista: [
      'Quatro grupos: **Trabalhando sem exame admissional** (vermelho), **Vão começar** (agendar antes do primeiro dia), **Agendados** e **ASO feito ou dispensado**.',
      '**Agendar**: escolha o exame, a data e hora e a clínica → **Salvar**. Aparece **Copiar convocação**: a mensagem pronta para colar no WhatsApp ou e-mail da pessoa.',
      '**Registrar resultado**: data em que foi feito e o resultado (Apto, Apto com restrição, Inapto). Inapto mostra um aviso: a pessoa não pode assumir a função.',
      'Exame só agendado **ainda conta como pendente** no Painel: pela NR-7 a pessoa só começa com o ASO.',
      '**Ficha e anexos ›** abre a ficha na parte de Documentos e exames, para anexar o ASO assinado.',
    ] },
    { h1: 'Documentos (precisa da liberação de dados pessoais)' },
    { lista: [
      'Lista quem está com documento obrigatório faltando e quais. Busca por nome; a caixa **Mostrar também quem está completo** mostra todo mundo.',
      '**Recebido** ou **Não se aplica** em cada documento. **Copiar cobrança** copia a mensagem com a lista do que falta. **Anexar na ficha ›** abre a ficha para anexar o arquivo.',
    ] },
    { h1: 'Contratos a vencer' },
    { lista: [
      'Experiência e prazo determinado que ainda não terminaram, em quatro grupos: **Já venceram — decidir agora**, **Vencem em até 15 dias**, **até 30 dias** e **Depois de 30 dias**.',
      '**Efetivar (prazo indeterminado)**: tira a data de término. Se a admissão já foi ao eSocial, a alteração (S-2206) fica pendente no cartão do eSocial da ficha.',
      '**Prorrogar**: escolha a nova data de término e toque em Prorrogar. O Axioma não deixa passar do limite legal (experiência 90 dias; prazo determinado 2 anos — CLT art. 445). A CLT permite prorrogar **uma única vez** (art. 451).',
      '**Desligar ›** abre a ficha no desligamento, com o cálculo da rescisão.',
    ] },
    { h1: 'Central do eSocial' },
    { lista: [
      'Tudo o que ainda falta ir ao governo, por evento: **S-2200** admissões, **S-2205** alterações cadastrais, **S-2206** alterações de contrato, **S-2299** desligamentos e **S-1010** verbas da empresa.',
      'Cada linha diz em que ponto está (não preparada, arquivo pronto esperando envio, recusada) e abre a ficha no **cartão do eSocial** — ou, nas verbas, RH · Estrutura → Verbas.',
      'Desligamentos só aparecem para quem tem liberação de dados pessoais e salário.',
      '**S-3000 · Admissões canceladas**: quem não chegou a trabalhar e teve a admissão cancelada — o contador exclui a admissão no eSocial.',
    ] },
    { h1: 'Obrigações da empresa' },
    { lista: [
      '**Controle de ponto**: obrigatório com mais de 20 empregados no mesmo estabelecimento (CLT art. 74, § 2º). Mostra a conta por filial.',
      '**Cota de pessoas com deficiência**: a partir de 100 empregados, 2% a 5% (Lei 8.213/1991, art. 93). Com liberação de saúde, mostra quantas vagas já estão preenchidas.',
      '**Relatório de igualdade salarial**: a partir de 100 empregados, 2 vezes por ano no Portal Emprega Brasil (Lei 14.611/2023). **Ver cargos e salários ›** abre os cargos na Estrutura.',
      '**Cota de aprendizes**: 5% a 15% das funções que exigem formação (CLT art. 429); ME/EPP dispensadas (LC 123/2006, art. 51, III). Quais funções contam depende da CBO — confirme com o contador.',
      'Cada item diz se **já se aplica** ou quantos empregados faltam, e traz a base legal.',
    ] },
    { nota: 'Quem pode ver: Proprietário, CEO, Sócio e Admin; os demais só com liberação em RH · Estrutura → Acessos do RH. Alterar (agendar, marcar recebido, efetivar, prorrogar) precisa da liberação de editar.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '51 - HR Routines.docx',
  titulo: 'Manual 51 — HR · Day-to-day routines',
  subtitulo: 'Exams, documents, expiring contracts, eSocial and company obligations — each Panel alert leads to one of them',
  info: ['Menu: Management → HR → row of buttons below the tabs  •  Axioma AI.Tech user manual  •  Version 1.0 (November 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Each HR Panel alert has its own screen to be solved. On all of them, **the person\'s name opens their record at the right part** (contract, documents, eSocial or termination). Lists of people are in **alphabetical order**.' },
    { h1: 'How to get there' },
    { lista: ['Top menu → **Management ▼** → **HR**. Below the Panel · Employees · Structure tabs there is a row of buttons: **Exams**, **Documents**, **Expiring contracts**, **eSocial center** and **Company obligations**.', 'Or tap an alert button on the Panel: it opens the routine that solves it. If the alert has only one person, it opens their record directly.'] },
    { h1: 'Exams (needs health access)' },
    { lista: [
      'Four groups: **Working without pre-employment exam** (red), **Starting soon** (schedule before day one), **Scheduled** and **ASO done or waived**.',
      '**Schedule**: pick the exam, date and time and clinic → **Save**. **Copy notice** appears: the ready message to paste in the person\'s WhatsApp or e-mail.',
      '**Record result**: date done and result (Fit, Fit with restriction, Unfit). Unfit shows a warning: the person cannot take the role.',
      'An exam that is only scheduled **still counts as pending** on the Panel: under NR-7 the person only starts with the ASO.',
      '**Record and files ›** opens the record at Documents and exams, to attach the signed ASO.',
    ] },
    { h1: 'Documents (needs personal data access)' },
    { lista: [
      'Lists who has a required document missing and which. Search by name; the **Also show who is complete** box shows everyone.',
      '**Received** or **Not applicable** on each document. **Copy request** copies the message listing what is missing. **Attach on the record ›** opens the record to attach the file.',
    ] },
    { h1: 'Expiring contracts' },
    { lista: [
      'Probation and fixed-term contracts not yet ended, in four groups: **Already ended — decide now**, **End within 15 days**, **within 30 days** and **After 30 days**.',
      '**Make permanent (open-ended)**: removes the end date. If the hire already went to eSocial, the change (S-2206) becomes pending in the record\'s eSocial card.',
      '**Extend**: pick the new end date and tap Extend. Axioma does not allow going beyond the legal limit (probation 90 days; fixed term 2 years — CLT art. 445). The CLT allows **a single extension** (art. 451).',
      '**Terminate ›** opens the record at termination, with the severance calculation.',
    ] },
    { h1: 'eSocial center' },
    { lista: [
      'Everything still to be sent to the government, by event: **S-2200** hires, **S-2205** personal data changes, **S-2206** contract changes, **S-2299** terminations and **S-1010** company pay items.',
      'Each line says where it stands (not prepared, file ready waiting to be sent, rejected) and opens the record at the **eSocial card** — or, for pay items, HR · Structure → Pay items.',
      'Terminations only show for those with personal data and salary access.',
      '**S-3000 · Cancelled hires**: people who did not start work and had the hire cancelled — the accountant deletes the hire in eSocial.',
    ] },
    { h1: 'Company obligations' },
    { lista: [
      '**Time tracking**: mandatory above 20 employees in the same site (CLT art. 74, § 2). Shows the count per branch.',
      '**Disability quota**: from 100 employees, 2% to 5% (Law 8.213/1991, art. 93). With health access, shows how many positions are filled.',
      '**Pay equality report**: from 100 employees, twice a year on the Emprega Brasil portal (Law 14.611/2023). **See job titles and salaries ›** opens the job titles in Structure.',
      '**Apprentice quota**: 5% to 15% of roles that require training (CLT art. 429); micro and small businesses exempt (LC 123/2006, art. 51, III). Which roles count depends on the CBO — confirm with the accountant.',
      'Each item says whether it **already applies** or how many employees are left, with the legal basis.',
    ] },
    { nota: 'Who can see: Owner, CEO, Partner and Admin; others only with access granted in HR · Structure → HR access. Changing (schedule, mark received, make permanent, extend) needs edit access.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '51 - RRHH Rutinas.docx',
  titulo: 'Manual 51 — RR. HH. · Rutinas del día a día',
  subtitulo: 'Exámenes, documentos, contratos por vencer, eSocial y obligaciones de la empresa — cada alerta del Panel lleva a una de ellas',
  info: ['Menú: Gestión → RR. HH. → fila de botones debajo de las pestañas  •  Manual de uso de Axioma AI.Tech  •  Versión 1.0 (noviembre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Cada alerta del Panel de RR. HH. tiene su propia pantalla para resolverse. En todas, **el nombre de la persona abre su ficha en la parte correcta** (contrato, documentos, eSocial o desvinculación). Las listas de personas están en **orden alfabético**.' },
    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Gestión ▼** → **RR. HH.**. Debajo de las pestañas Panel · Colaboradores · Estructura hay una fila de botones: **Exámenes**, **Documentos**, **Contratos por vencer**, **Central del eSocial** y **Obligaciones de la empresa**.', 'O toque el botón de una alerta del Panel: abre la rutina que la resuelve. Si la alerta tiene una sola persona, abre directamente su ficha.'] },
    { h1: 'Exámenes (necesita habilitación de salud)' },
    { lista: [
      'Cuatro grupos: **Trabajando sin examen de admisión** (rojo), **Van a empezar** (agendar antes del primer día), **Agendados** y **ASO hecho o dispensado**.',
      '**Agendar**: elija el examen, la fecha y hora y la clínica → **Guardar**. Aparece **Copiar convocatoria**: el mensaje listo para pegar en el WhatsApp o e-mail de la persona.',
      '**Registrar resultado**: fecha en que se hizo y resultado (Apto, Apto con restricción, No apto). No apto muestra un aviso: la persona no puede asumir la función.',
      'Un examen solo agendado **sigue contando como pendiente** en el Panel: según la NR-7 la persona solo empieza con el ASO.',
      '**Ficha y archivos ›** abre la ficha en Documentos y exámenes, para adjuntar el ASO firmado.',
    ] },
    { h1: 'Documentos (necesita habilitación de datos personales)' },
    { lista: [
      'Lista quién tiene un documento obligatorio faltante y cuáles. Búsqueda por nombre; la casilla **Mostrar también a quien está completo** muestra a todos.',
      '**Recibido** o **No aplica** en cada documento. **Copiar cobro** copia el mensaje con la lista de lo que falta. **Adjuntar en la ficha ›** abre la ficha para adjuntar el archivo.',
    ] },
    { h1: 'Contratos por vencer' },
    { lista: [
      'Experiencia y plazo determinado aún no terminados, en cuatro grupos: **Ya vencieron — decidir ahora**, **Vencen en hasta 15 días**, **hasta 30 días** y **Después de 30 días**.',
      '**Efectivar (plazo indeterminado)**: quita la fecha de término. Si la admisión ya fue al eSocial, la alteración (S-2206) queda pendiente en la tarjeta del eSocial de la ficha.',
      '**Prorrogar**: elija la nueva fecha de término y toque Prorrogar. Axioma no permite pasar del límite legal (experiencia 90 días; plazo determinado 2 años — CLT art. 445). La CLT permite prorrogar **una sola vez** (art. 451).',
      '**Desvincular ›** abre la ficha en la desvinculación, con el cálculo de la rescisión.',
    ] },
    { h1: 'Central del eSocial' },
    { lista: [
      'Todo lo que aún falta enviar al gobierno, por evento: **S-2200** admisiones, **S-2205** alteraciones de registro, **S-2206** alteraciones de contrato, **S-2299** desvinculaciones y **S-1010** rubros de la empresa.',
      'Cada línea dice en qué punto está (no preparada, archivo listo esperando envío, rechazada) y abre la ficha en la **tarjeta del eSocial** — o, en los rubros, RR. HH. · Estructura → Rubros.',
      'Las desvinculaciones solo aparecen para quien tiene habilitación de datos personales y salario.',
      '**S-3000 · Admisiones canceladas**: quien no llegó a trabajar y tuvo la admisión cancelada — el contador excluye la admisión en el eSocial.',
    ] },
    { h1: 'Obligaciones de la empresa' },
    { lista: [
      '**Control de jornada**: obligatorio con más de 20 empleados en el mismo establecimiento (CLT art. 74, § 2). Muestra la cuenta por sucursal.',
      '**Cuota de personas con discapacidad**: desde 100 empleados, 2% a 5% (Ley 8.213/1991, art. 93). Con habilitación de salud, muestra cuántos puestos están ocupados.',
      '**Informe de igualdad salarial**: desde 100 empleados, 2 veces al año en el Portal Emprega Brasil (Ley 14.611/2023). **Ver cargos y salarios ›** abre los cargos en la Estructura.',
      '**Cuota de aprendices**: 5% a 15% de las funciones que exigen formación (CLT art. 429); ME/EPP dispensadas (LC 123/2006, art. 51, III). Qué funciones cuentan depende de la CBO — confirme con el contador.',
      'Cada ítem dice si **ya se aplica** o cuántos empleados faltan, con la base legal.',
    ] },
    { nota: 'Quién puede ver: Propietario, CEO, Socio y Admin; los demás solo con habilitación en RR. HH. · Estructura → Accesos de RR. HH. Cambiar (agendar, marcar recibido, efectivar, prorrogar) necesita habilitación de editar.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
