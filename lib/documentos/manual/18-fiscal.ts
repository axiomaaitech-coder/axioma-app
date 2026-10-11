// Fonte única: gera os PDFs (scripts/gerar-pdf.cjs) e a página no site, nos 3 idiomas.
import type { DocumentoAxioma, DocTrilingue } from "../tipos"

const pt: DocumentoAxioma = {
  arquivo: '18 - Fiscal.docx',
  titulo: 'Manual 18 — Fiscal',
  subtitulo: 'Status fiscal da empresa: obrigações, descobertas e o Fiscal Health Score explicado',
  info: ['Menu: Contabilidade → Fiscal  •  Manual de uso do Axioma AI.Tech  •  Versão 2.0 (outubro de 2026)'],
  blocos: [
    { h1: 'Para que serve' },
    { p: 'Mostra se a empresa está **em dia com o Fisco**: as obrigações que vencem (DAS, DASN, DEFIS, DCTF, EFD, ECF, ECD e as demais do seu regime), as **descobertas fiscais** da Axioma e uma nota de saúde fiscal. Não é formulário — é um painel de status.' },

    { h1: 'Como chegar' },
    { lista: ['Menu do topo → **Contabilidade ▼** → **Fiscal**.'] },

    { h1: 'Tela principal' },
    { tabela: { colunas: ['Elemento', 'O que mostra / faz', 'O que acontece depois'], larguras: [2600, 3600, 2826], linhas: [
      ['**Fiscal Health Score**', 'Nota de saúde fiscal (Em Dia, Atenção, Crítico) com a explicação.', '—'],
      ['**Obrigações nos próx. 7 dias**', 'O que vence na semana; "Nenhuma obrigação vencendo em 7 dias" quando não há.', '—'],
      ['**Próximas Obrigações**', 'As que vencem em 30 dias, com selo "atrasada" quando passou do prazo.', '**Ver calendário completo →** abre o Calendário.'],
      ['Aviso **Atividade fiscal não definida**', 'Aparece quando o cálculo de imposto usa o padrão (Serviços).', '**Definir agora →** abre a Configuração Fiscal.'],
      ['**Rodar descoberta**', 'A Axioma procura riscos fiscais nas obrigações e impostos.', '**Rodando...**; depois as descobertas ou "Nada novo".'],
      ['Descobertas (filtro **Mostrar só abertas / Mostrar todas**)', 'Tipo, Prioridade, Confiança, Impacto, Por quê, Evidência.', '**Marcar como revisada**, **Marcar como resolvida** ou **Ignorar** (pede Sim/Não).'],
      ['**Compartilhar**', 'Abre a Central de Compartilhamento.', 'WhatsApp, e-mail, copiar ou PDF.'],
    ] } },
    { h2: 'Reforma Tributária (educativo)' },
    { p: 'Dois cartões com os pontos que mais afetam empresas pequenas (IBS/CBS substituindo PIS, COFINS, ISS e ICMS; Simples mantido; cashback para famílias do CadÚnico; Imposto Seletivo sobre fumígenos, bebidas alcoólicas e açucaradas, veículos e outros). **Fonte: EC 132/2023 e LC 214/2025**, com a data da conferência; as alíquotas finais ainda dependem de lei.' },

    { h1: 'Calendário de Obrigações' },
    { p: 'Lista de todas as obrigações já geradas para o seu regime, com **Vencimento**, **Valor** e **Status**.' },
    { tabela: { colunas: ['Botão', 'O que faz'], larguras: [2800, 6226], linhas: [
      ['**Marcar como paga**', 'Atualiza o status na hora ("Atualizado.").'],
      ['**Marcar como dispensada**', 'Para obrigação que não se aplica ao seu caso.'],
      ['**Editar valor/dados na aba Compliance**', 'Abre Configurações → Empresa → Compliance, onde fica a edição completa (nome, valor, recorrência) — sem duplicar cadastro.'],
      ['**Voltar ao Fiscal**', 'Volta para a tela principal.'],
    ] } },

    { h1: 'Configuração Fiscal (só o Proprietário)' },
    { p: 'Define a **Atividade Fiscal** (comércio, indústria, serviços…) e a **Alíquota de ISS do seu município** (de 2% a 5%; em branco usa 5%) — liga o cálculo correto do imposto. O **Regime Tributário** e o **CNAE Principal** aparecem só para leitura (edite em Empresa). Sem regime definido, a tela pede para defini-lo primeiro em Empresa. Quem não é o Proprietário vê em modo leitura — é a mesma regra do banco de dados.' },
  ],
}

const en: DocumentoAxioma = {
  arquivo: '18 - Tax.docx',
  titulo: 'Manual 18 — Tax',
  subtitulo: 'The company’s tax status: obligations, discoveries and the Fiscal Health Score explained',
  info: ['Menu: Accounting → Tax  •  Axioma AI.Tech user manual  •  Version 2.0 (October 2026)'],
  blocos: [
    { h1: 'What it is for' },
    { p: 'Shows whether the company is **up to date with the tax authority**: the obligations coming due (DAS, DASN, DEFIS, DCTF, EFD, ECF, ECD and the others for your regime), Axioma’s **tax discoveries** and a tax health score. It is not a form — it is a status panel.' },

    { h1: 'How to get there' },
    { lista: ['Top menu → **Accounting ▼** → **Tax**.'] },

    { h1: 'Main screen' },
    { tabela: { colunas: ['Element', 'What it shows / does', 'What happens next'], larguras: [2600, 3600, 2826], linhas: [
      ['**Fiscal Health Score**', 'Tax health score (Up to Date, Attention, Critical) with the explanation.', '—'],
      ['**Obligations in the next 7 days**', 'What is due this week; "No obligation due in 7 days" when there is none.', '—'],
      ['**Upcoming Obligations**', 'Those due in 30 days, tagged "overdue" when past the deadline.', '**See full calendar →** opens the Calendar.'],
      ['**Tax activity not set** notice', 'Shows when the tax calculation uses the default (Services).', '**Set it now →** opens Tax Settings.'],
      ['**Run discovery**', 'Axioma looks for tax risks in obligations and taxes.', '**Running...**; then the discoveries or "Nothing new".'],
      ['Discoveries (**Show only open / Show all** filter)', 'Type, Priority, Confidence, Impact, Why, Evidence.', '**Mark as reviewed**, **Mark as resolved** or **Ignore** (asks Yes/No).'],
      ['**Share**', 'Opens the Sharing Center.', 'WhatsApp, email, copy or PDF.'],
    ] } },
    { h2: 'Tax Reform (educational)' },
    { p: 'Two cards with the points that most affect small companies (IBS/CBS replacing PIS, COFINS, ISS and ICMS; Simples kept; cashback for CadÚnico families; Selective Tax on tobacco, alcoholic and sugary drinks, vehicles and others). **Source: Constitutional Amendment 132/2023 and LC 214/2025**, with the check date; final rates still depend on law.' },

    { h1: 'Obligations Calendar' },
    { p: 'List of all obligations already generated for your regime, with **Due date**, **Amount** and **Status**.' },
    { tabela: { colunas: ['Button', 'What it does'], larguras: [2800, 6226], linhas: [
      ['**Mark as paid**', 'Updates the status right away ("Updated.").'],
      ['**Mark as waived**', 'For an obligation that does not apply to your case.'],
      ['**Edit amount/data in the Compliance tab**', 'Opens Settings → Company → Compliance, where full editing (name, amount, recurrence) lives — no duplicate records.'],
      ['**Back to Tax**', 'Returns to the main screen.'],
    ] } },

    { h1: 'Tax Settings (Owner only)' },
    { p: 'Sets the **Tax Activity** (trade, industry, services…) and your **municipality’s ISS rate** (2% to 5%; blank uses 5%) — this turns on the correct tax calculation. The **Tax Regime** and **Main CNAE** are read-only here (edit them in Company). With no regime set, the screen asks you to set it in Company first. Anyone who is not the Owner sees it in read-only mode — the same rule as the database.' },
  ],
}

const es: DocumentoAxioma = {
  arquivo: '18 - Fiscal.docx',
  titulo: 'Manual 18 — Fiscal',
  subtitulo: 'Estado fiscal de la empresa: obligaciones, descubrimientos y el Fiscal Health Score explicado',
  info: ['Menú: Contabilidad → Fiscal  •  Manual de uso de Axioma AI.Tech  •  Versión 2.0 (octubre de 2026)'],
  blocos: [
    { h1: 'Para qué sirve' },
    { p: 'Muestra si la empresa está **al día con el Fisco**: las obligaciones que vencen (DAS, DASN, DEFIS, DCTF, EFD, ECF, ECD y las demás de su régimen), los **descubrimientos fiscales** de Axioma y una nota de salud fiscal. No es un formulario — es un panel de estado.' },

    { h1: 'Cómo llegar' },
    { lista: ['Menú superior → **Contabilidad ▼** → **Fiscal**.'] },

    { h1: 'Pantalla principal' },
    { tabela: { colunas: ['Elemento', 'Qué muestra / hace', 'Qué pasa después'], larguras: [2600, 3600, 2826], linhas: [
      ['**Fiscal Health Score**', 'Nota de salud fiscal (Al Día, Atención, Crítico) con la explicación.', '—'],
      ['**Obligaciones en los próx. 7 días**', 'Lo que vence en la semana; "Ninguna obligación venciendo en 7 días" cuando no hay.', '—'],
      ['**Próximas Obligaciones**', 'Las que vencen en 30 días, con la etiqueta "atrasada" cuando pasó el plazo.', '**Ver calendario completo →** abre el Calendario.'],
      ['Aviso **Actividad fiscal no definida**', 'Aparece cuando el cálculo del impuesto usa el predeterminado (Servicios).', '**Definir ahora →** abre la Configuración Fiscal.'],
      ['**Ejecutar descubrimiento**', 'Axioma busca riesgos fiscales en obligaciones e impuestos.', '**Ejecutando...**; después los descubrimientos o "Nada nuevo".'],
      ['Descubrimientos (filtro **Mostrar solo abiertos / Mostrar todos**)', 'Tipo, Prioridad, Confianza, Impacto, Por qué, Evidencia.', '**Marcar como revisado**, **Marcar como resuelto** o **Ignorar** (pide Sí/No).'],
      ['**Compartir**', 'Abre el Centro de Compartir.', 'WhatsApp, correo, copiar o PDF.'],
    ] } },
    { h2: 'Reforma Tributaria (educativo)' },
    { p: 'Dos tarjetas con los puntos que más afectan a las empresas pequeñas (IBS/CBS reemplazando PIS, COFINS, ISS e ICMS; Simples mantenido; cashback para familias del CadÚnico; Impuesto Selectivo sobre tabaco, bebidas alcohólicas y azucaradas, vehículos y otros). **Fuente: EC 132/2023 y LC 214/2025**, con la fecha de verificación; las alícuotas finales aún dependen de ley.' },

    { h1: 'Calendario de Obligaciones' },
    { p: 'Lista de todas las obligaciones ya generadas para su régimen, con **Vencimiento**, **Valor** y **Estado**.' },
    { tabela: { colunas: ['Botón', 'Qué hace'], larguras: [2800, 6226], linhas: [
      ['**Marcar como pagada**', 'Actualiza el estado al instante ("Actualizado.").'],
      ['**Marcar como dispensada**', 'Para una obligación que no aplica a su caso.'],
      ['**Editar valor/datos en la pestaña Compliance**', 'Abre Configuración → Empresa → Compliance, donde está la edición completa (nombre, valor, recurrencia) — sin duplicar registros.'],
      ['**Volver al Fiscal**', 'Vuelve a la pantalla principal.'],
    ] } },

    { h1: 'Configuración Fiscal (solo el Propietario)' },
    { p: 'Define la **Actividad Fiscal** (comercio, industria, servicios…) y la **Alícuota de ISS de su municipio** (de 2% a 5%; vacío usa 5%) — activa el cálculo correcto del impuesto. El **Régimen Tributario** y el **CNAE Principal** aparecen solo para lectura (edítelos en Empresa). Sin régimen definido, la pantalla pide definirlo primero en Empresa. Quien no es el Propietario lo ve en modo lectura — es la misma regla de la base de datos.' },
  ],
}

const doc: DocTrilingue = { pt, en, es }
export default doc
