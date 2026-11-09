"use client";
// RH · Estrutura da Empresa (Fase 1 do Axioma People & HR).
// Empregador (S-1000), filiais (S-1005), lotações (S-1020), departamentos e cargos.
// As regras do eSocial e as permissões estão no BANCO (docs/sql/RH-1..5); esta tela só mostra, pré-preenche
// e traduz as recusas. Apagar = lixeira de 60 dias (o que já foi enviado ao eSocial não vai para a lixeira).
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Pencil, Trash2, X, Share2, RotateCcw, Plus, Wand2, ShieldCheck, CopyPlus, KeyRound, Info as InfoIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/nextjs";
import { useLanguage } from "../../../../lib/LanguageContext";
import { createBrowserClient } from "../../../../lib/supabaseBrowser";
import ModuloLayout from "../../../../components/ModuloLayout";
import { CanvasBox } from "../../../../components/CanvasBox";
import { CentroCompartilhamento } from "../../../../components/CentroCompartilhamento";
import AvisoAxioma from "../../../../components/AvisoAxioma";
import { ThemeToggle } from "../../../../components/ThemeToggle";
import { useConfirmarExclusao, nomeItem } from "../../../../components/ConfirmarExclusao";
import { PerguntaIA } from "../../../../components/PerguntaIA";
import { LetreiroAxioma } from "../../../../components/LetreiroAxioma";
import { NavRh } from "../../../../components/NavRh";
import Link from "next/link";
import { BotaoAcao } from "../../../../components/BotaoAcao";
import { useThemeAxioma } from "../../../../lib/ThemeContext";
import { obterEmpresaAtiva, listarEquipe } from "../../../../lib/empresaHelpers";
import { corTema, FONTE_EXEC } from "../../../../lib/cfoCore";
import { gerarPdfTabela, gerarExcelTabela } from "../../../../lib/gerarPdfTabela";
import { tratarFalhaExportacao } from "../../../../lib/erroUiHelpers";
import { hojeISO } from "../../../../lib/datas";
import { DIAS_LIXEIRA_RH } from "../../../../lib/nexusRetencao";
import { lerValorBR } from "../../../../lib/valorBR";
import { mascaraCPF, mascaraCNPJ } from "../../../../lib/enderecoHelpers";
import { raizCnpj, cnaeSete, sugerirClassTrib, mesAtual, mensagemErroRh, type Lang, type Texto } from "../../../../lib/rhEstrutura";
import { gerarS1010, VERSAO_LEIAUTE, type Rubrica } from "../../../../lib/rhEsocial";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Linha = Record<string, any>;
type Opcao = { v: string; l: string | Texto };
type Campo = {
  k: string; r: Texto; tipo: "texto" | "numero" | "mes" | "data" | "select" | "area" | "lista" | "bool" | "competencias";
  opcoes?: Opcao[] | ((d: Dados) => Opcao[]); ajuda?: Texto; avancado?: boolean; obrig?: boolean; num?: boolean;
};
type Aba = "empregador" | "filiais" | "lotacoes" | "departamentos" | "cargos";
type Dados = Record<Aba, Linha[]> & { tab08: Opcao[]; tab10: Opcao[]; fpas: Opcao[]; centros: Opcao[] };
type Competencia = { nome: string; tipo: "tecnica" | "comportamental"; obrigatoria: boolean; nivel?: number };

const T = (pt: string, en: string, es: string): Texto => ({ pt, en, es });
const SIM_NAO: Opcao[] = [{ v: "", l: T("Não", "No", "No") }, { v: "S", l: T("Sim", "Yes", "Sí") }];
const SITUACAO: Opcao[] = [
  { v: "rascunho", l: T("Rascunho (ainda não enviado)", "Draft (not sent yet)", "Borrador (aún no enviado)") },
  { v: "enviado_pelo_contador", l: T("Já enviado ao eSocial pelo contador", "Already sent to eSocial by the accountant", "Ya enviado al eSocial por el contador") },
];
const AJUDA_VALIDADE = T("Mês em que estes dados passam a valer (AAAA-MM). Mudou algo? Crie uma nova validade — o histórico fica.", "Month these data take effect (YYYY-MM). Something changed? Create a new validity — history is kept.", "Mes en que estos datos entran en vigor (AAAA-MM). ¿Cambió algo? Cree una nueva vigencia — el historial se mantiene.");

// Cada coluna tem função: o nome ordena a lista, o ⓘ explica (com a base legal) e o valor leva ao destino.
type Destino = { aba: Aba } | { rota: string } | { externo: string } | { editar: Linha } | { card: { titulo: string; linhas: string[] } };
type Coluna = { r: string | Texto; v: (l: Linha, d: Dados, lang: Lang) => string; ajuda: Texto; ir?: (l: Linha, d: Dados, lang: Lang) => Destino | null };
const AJUDA_VALE = T("O mês em que estes dados passam a valer para o eSocial. As tabelas do eSocial têm período de validade: quando algo muda, cria-se uma nova validade (botão de copiar nas Ações) e a anterior fica no histórico.", "The month these data take effect for eSocial. eSocial tables have validity periods: when something changes, create a new validity (copy button in Actions) and the previous one stays in history.", "El mes en que estos datos entran en vigor para eSocial. Las tablas de eSocial tienen período de vigencia: si algo cambia, se crea una nueva vigencia (botón de copiar en Acciones) y la anterior queda en el historial.");
const ABAS: { id: Aba; tabela: string; nome: Texto; versionada: boolean; campos: Campo[]; titulo: (l: Linha) => string; colunas: Coluna[] }[] = [
  {
    id: "empregador", tabela: "rh_empregador", versionada: true, nome: T("Empregador", "Employer", "Empleador"),
    titulo: (l) => `${l.nr_insc} · ${l.ini_valid}`,
    campos: [
      { k: "tp_insc", r: T("Tipo de inscrição", "Registration type", "Tipo de inscripción"), tipo: "select", obrig: true, num: true, opcoes: [{ v: "1", l: "CNPJ" }, { v: "2", l: "CPF" }] },
      { k: "nr_insc", r: T("CNPJ (raiz, 8 dígitos) ou CPF", "CNPJ (root, 8 digits) or CPF", "CNPJ (raíz, 8 dígitos) o CPF"), tipo: "texto", obrig: true, ajuda: T("Para empresa, o eSocial usa só os 8 primeiros números do CNPJ.", "For companies, eSocial uses only the first 8 digits of the CNPJ.", "Para empresas, eSocial usa solo los 8 primeros números del CNPJ.") },
      { k: "ini_valid", r: T("Vale a partir de", "Valid from", "Vigente desde"), tipo: "mes", obrig: true, ajuda: AJUDA_VALIDADE },
      { k: "fim_valid", r: T("Vale até (opcional)", "Valid until (optional)", "Vigente hasta (opcional)"), tipo: "mes" },
      { k: "class_trib", r: T("Classificação tributária (Tabela 08)", "Tax classification (Table 08)", "Clasificación tributaria (Tabla 08)"), tipo: "select", obrig: true, opcoes: (d) => d.tab08, ajuda: T("Sugestão pelo regime da Empresa — confirme com o contador (no Simples, Anexo IV é 02).", "Suggested from the company's regime — confirm with the accountant (Simples Annex IV is 02).", "Sugerida por el régimen de la empresa — confirme con el contador (Simples Anexo IV es 02).") },
      { k: "ind_coop", r: T("Cooperativa", "Cooperative", "Cooperativa"), tipo: "select", num: true, opcoes: [{ v: "0", l: T("Não é cooperativa", "Not a cooperative", "No es cooperativa") }, { v: "1", l: T("Cooperativa de trabalho", "Worker cooperative", "Cooperativa de trabajo") }, { v: "2", l: T("Cooperativa de produção", "Production cooperative", "Cooperativa de producción") }, { v: "3", l: T("Outras cooperativas", "Other cooperatives", "Otras cooperativas") }] },
      { k: "ind_constr", r: T("Construtora", "Construction company", "Constructora"), tipo: "select", num: true, opcoes: [{ v: "0", l: T("Não é construtora", "Not a construction company", "No es constructora") }, { v: "1", l: T("Empresa construtora", "Construction company", "Empresa constructora") }] },
      { k: "ind_des_folha", r: T("Desoneração da folha", "Payroll tax relief", "Desoneración de la nómina"), tipo: "select", num: true, opcoes: [{ v: "0", l: T("Não se aplica", "Not applicable", "No aplica") }, { v: "1", l: T("Empresa enquadrada", "Company qualifies", "Empresa encuadrada") }, { v: "2", l: T("Município enquadrado", "Municipality qualifies", "Municipio encuadrado") }] },
      { k: "ind_porte", r: T("Micro ou pequena empresa (ME/EPP)", "Micro or small business (ME/EPP)", "Micro o pequeña empresa (ME/EPP)"), tipo: "select", opcoes: SIM_NAO },
      { k: "situacao_esocial", r: T("Situação no eSocial", "eSocial status", "Situación en eSocial"), tipo: "select", obrig: true, opcoes: SITUACAO },
      { k: "ind_opc_cp", r: T("Produtor rural: contribuição sobre", "Rural producer: contribution on", "Productor rural: contribución sobre"), tipo: "select", num: true, avancado: true, opcoes: [{ v: "", l: "—" }, { v: "1", l: T("Comercialização da produção", "Sale of production", "Comercialización de la producción") }, { v: "2", l: T("Folha de pagamento", "Payroll", "Nómina") }] },
      { k: "ind_opt_reg_eletron", r: T("Optou pelo registro eletrônico de empregados (só antes de 2026-02)", "Opted for electronic employee register (only before 2026-02)", "Optó por el registro electrónico (solo antes de 2026-02)"), tipo: "select", num: true, avancado: true, opcoes: [{ v: "", l: "—" }, { v: "0", l: T("Não", "No", "No") }, { v: "1", l: T("Sim", "Yes", "Sí") }] },
      { k: "cnpj_efr", r: T("CNPJ do ente federativo (órgão público)", "Federative entity CNPJ (public body)", "CNPJ del ente federativo (órgano público)"), tipo: "texto", avancado: true },
      { k: "dt_trans_11096", r: T("Transformação em sociedade com fins lucrativos (Lei 11.096)", "Conversion to for-profit (Law 11.096)", "Transformación en sociedad con fines de lucro (Ley 11.096)"), tipo: "data", avancado: true },
      { k: "ind_trib_folha_pis_pasep", r: T("PIS/PASEP sobre a folha", "PIS/PASEP on payroll", "PIS/PASEP sobre la nómina"), tipo: "select", avancado: true, opcoes: SIM_NAO },
      { k: "ind_pert_irrf", r: T("Pertencimento do IRRF", "IRRF ownership", "Pertenencia del IRRF"), tipo: "select", avancado: true, opcoes: SIM_NAO },
      { k: "ind_siafi", r: T("Usa o SIAFI", "Uses SIAFI", "Usa SIAFI"), tipo: "select", avancado: true, opcoes: SIM_NAO },
      { k: "isen_ide_min_lei", r: T("Isenção: ministério ou lei", "Exemption: ministry or law", "Exención: ministerio o ley"), tipo: "texto", avancado: true },
      { k: "isen_nr_certif", r: T("Isenção: nº do certificado (CEBAS)", "Exemption: certificate no. (CEBAS)", "Exención: nº de certificado (CEBAS)"), tipo: "texto", avancado: true },
      { k: "isen_dt_emis_certif", r: T("Isenção: emissão do certificado", "Exemption: certificate issue date", "Exención: emisión del certificado"), tipo: "data", avancado: true },
      { k: "isen_dt_venc_certif", r: T("Isenção: vencimento do certificado", "Exemption: certificate expiry", "Exención: vencimiento del certificado"), tipo: "data", avancado: true },
      { k: "isen_nr_prot_renov", r: T("Isenção: protocolo de renovação", "Exemption: renewal protocol", "Exención: protocolo de renovación"), tipo: "texto", avancado: true },
      { k: "isen_dt_prot_renov", r: T("Isenção: data do protocolo", "Exemption: protocol date", "Exención: fecha del protocolo"), tipo: "data", avancado: true },
      { k: "isen_dt_dou", r: T("Isenção: publicação no DOU", "Exemption: Official Gazette date", "Exención: publicación en el DOU"), tipo: "data", avancado: true },
      { k: "isen_pag_dou", r: T("Isenção: página do DOU", "Exemption: Gazette page", "Exención: página del DOU"), tipo: "numero", avancado: true },
      { k: "ind_acordo_isen_multa", r: T("Organismo internacional: acordo de isenção de multa", "International body: fine-exemption agreement", "Organismo internacional: acuerdo de exención de multa"), tipo: "select", num: true, avancado: true, opcoes: [{ v: "", l: "—" }, { v: "0", l: T("Sem acordo", "No agreement", "Sin acuerdo") }, { v: "1", l: T("Com acordo", "With agreement", "Con acuerdo") }] },
    ],
    colunas: [
      { r: T("Vale de", "Valid from", "Vigente desde"), v: (l) => `${l.ini_valid}${l.fim_valid ? ` → ${l.fim_valid}` : ""}`, ajuda: AJUDA_VALE },
      { r: T("Inscrição", "Registration", "Inscripción"), v: (l) => `${l.tp_insc === 2 ? "CPF" : "CNPJ"} ${l.nr_insc}`, ajuda: T("Quem é o empregador no eSocial (evento S-1000): para empresa, só os 8 primeiros números do CNPJ (a raiz); para pessoa física, o CPF. Tocar abre o cadastro para conferir.", "Who the employer is in eSocial (event S-1000): for companies, only the first 8 CNPJ digits (the root); for individuals, the CPF. Tap to open the record.", "Quién es el empleador en eSocial (evento S-1000): para empresas, solo los 8 primeros números del CNPJ (la raíz); para personas físicas, el CPF. Toque para abrir el registro."), ir: (l) => ({ editar: l }) },
      { r: T("Classificação", "Classification", "Clasificación"), v: (l, d, lang) => rotulo(d.tab08, l.class_trib, lang), ajuda: T("Classificação tributária da Tabela 08 do eSocial: diz como a Empresa contribui para a Previdência (Simples Nacional, lucro real/presumido, MEI, órgão público…). Errar aqui muda o cálculo dos encargos — confirme com o contador. Tocar mostra o texto oficial.", "eSocial Table 08 tax classification: how the company contributes to Social Security (Simples Nacional, real/presumed profit, MEI, public body…). A mistake changes payroll charges — confirm with the accountant. Tap to see the official text.", "Clasificación tributaria de la Tabla 08 de eSocial: cómo contribuye la empresa a la Seguridad Social (Simples Nacional, lucro real/presunto, MEI, órgano público…). Un error cambia las cargas — confirme con el contador. Toque para ver el texto oficial."), ir: (l, d, lang) => ({ card: { titulo: "Tabela 08 — eSocial", linhas: [rotulo(d.tab08, l.class_trib, lang)] } }) },
    ],
  },
  {
    id: "filiais", tabela: "rh_estabelecimentos", versionada: true, nome: T("Filiais", "Branches", "Sucursales"),
    titulo: (l) => l.nome,
    campos: [
      { k: "nome", r: T("Nome (no Axioma)", "Name (in Axioma)", "Nombre (en Axioma)"), tipo: "texto", obrig: true },
      { k: "tp_insc", r: T("Tipo", "Type", "Tipo"), tipo: "select", obrig: true, num: true, opcoes: [{ v: "1", l: "CNPJ" }, { v: "3", l: "CAEPF" }, { v: "4", l: T("CNO (obra)", "CNO (construction site)", "CNO (obra)") }] },
      { k: "nr_insc", r: T("Número (CNPJ completo, CAEPF ou CNO)", "Number (full CNPJ, CAEPF or CNO)", "Número (CNPJ completo, CAEPF o CNO)"), tipo: "texto", obrig: true, ajuda: T("Filial precisa ter os mesmos 8 primeiros números do CNPJ do empregador. Outra raiz é outra Empresa.", "A branch must share the employer's first 8 CNPJ digits. A different root is another company.", "La sucursal debe tener los mismos 8 primeros números del CNPJ del empleador. Otra raíz es otra empresa.") },
      { k: "ini_valid", r: T("Vale a partir de", "Valid from", "Vigente desde"), tipo: "mes", obrig: true, ajuda: AJUDA_VALIDADE },
      { k: "fim_valid", r: T("Vale até (opcional)", "Valid until (optional)", "Vigente hasta (opcional)"), tipo: "mes" },
      { k: "cnae_prep", r: T("CNAE principal (7 dígitos)", "Main CNAE (7 digits)", "CNAE principal (7 dígitos)"), tipo: "texto", obrig: true },
      { k: "centro_custo_id", r: T("Centro de custo (opcional)", "Cost center (optional)", "Centro de costo (opcional)"), tipo: "select", opcoes: (d) => [{ v: "", l: "—" }, ...d.centros] },
      { k: "cnpj_sindicato", r: T("CNPJ do sindicato da categoria", "Union CNPJ (category)", "CNPJ del sindicato de la categoría"), tipo: "texto", ajuda: T("O eSocial exige em toda admissão. Vale para quem trabalha nesta filial; quem é de categoria diferenciada (ex.: motorista) recebe outro no contrato. Confira na convenção coletiva ou com o contador.", "eSocial requires it on every hire. Applies to everyone at this branch; differentiated categories (e.g. drivers) get another one on the contract. Check the collective agreement or the accountant.", "eSocial lo exige en toda admisión. Vale para quien trabaja en esta sucursal; las categorías diferenciadas (ej.: conductor) reciben otro en el contrato. Revise el convenio colectivo o con el contador.") },
      { k: "situacao_esocial", r: T("Situação no eSocial", "eSocial status", "Situación en eSocial"), tipo: "select", obrig: true, opcoes: SITUACAO },
      { k: "cnpj_resp", r: T("Obra: CNPJ responsável", "Site: responsible CNPJ", "Obra: CNPJ responsable"), tipo: "texto", avancado: true },
      { k: "fap", r: T("FAP (0,5000 a 2,0000), se diferente do oficial", "FAP (0.5000–2.0000), if different from official", "FAP (0,5000 a 2,0000), si distinto del oficial"), tipo: "numero", avancado: true },
      { k: "tp_caepf", r: T("Tipo de CAEPF", "CAEPF type", "Tipo de CAEPF"), tipo: "select", num: true, avancado: true, opcoes: [{ v: "", l: "—" }, { v: "1", l: T("Contribuinte individual", "Individual contributor", "Contribuyente individual") }, { v: "2", l: T("Produtor rural", "Rural producer", "Productor rural") }, { v: "3", l: T("Segurado especial", "Special insured", "Asegurado especial") }] },
      { k: "ind_subst_patr_obra", r: T("Obra: contribuição patronal", "Site: employer contribution", "Obra: contribución patronal"), tipo: "select", num: true, avancado: true, opcoes: [{ v: "", l: "—" }, { v: "1", l: T("Substituída", "Replaced", "Sustituida") }, { v: "2", l: T("Não substituída", "Not replaced", "No sustituida") }] },
      { k: "apr_nr_proc_jud", r: T("Aprendiz: nº do processo judicial (20 dígitos)", "Apprentice: lawsuit no. (20 digits)", "Aprendiz: nº de proceso judicial (20 dígitos)"), tipo: "texto", avancado: true },
      { k: "apr_entidades_educ", r: T("Aprendiz: CNPJs das entidades educativas (separados por vírgula)", "Apprentice: training entities' CNPJs (comma-separated)", "Aprendiz: CNPJ de las entidades educativas (separados por coma)"), tipo: "lista", avancado: true },
      { k: "pcd_nr_proc_jud", r: T("PCD: nº do processo judicial (só na matriz)", "Disability quota: lawsuit no. (head office only)", "PCD: nº de proceso judicial (solo en la matriz)"), tipo: "texto", avancado: true },
    ],
    colunas: [
      { r: T("Nome", "Name", "Nombre"), v: (l) => l.nome, ajuda: T("Nome da filial (estabelecimento) dentro do Axioma. Tocar abre o cadastro.", "Branch (establishment) name inside Axioma. Tap to open the record.", "Nombre de la sucursal (establecimiento) en Axioma. Toque para abrir el registro."), ir: (l) => ({ editar: l }) },
      { r: T("Inscrição", "Registration", "Inscripción"), v: (l) => `${({ 1: "CNPJ", 3: "CAEPF", 4: "CNO" } as Record<number, string>)[l.tp_insc] ?? ""} ${l.nr_insc}`, ajuda: T("Inscrição do estabelecimento no eSocial (evento S-1005): CNPJ completo da filial (mesma raiz de 8 números do empregador), CAEPF (pessoa física com empregados) ou CNO (obra de construção). Outra raiz de CNPJ é outra Empresa.", "Establishment registration in eSocial (event S-1005): the branch's full CNPJ (same 8-digit root as the employer), CAEPF (individual with employees) or CNO (construction site). A different CNPJ root is another company.", "Inscripción del establecimiento en eSocial (evento S-1005): CNPJ completo de la sucursal (misma raíz de 8 números del empleador), CAEPF (persona física con empleados) o CNO (obra). Otra raíz de CNPJ es otra empresa.") },
      { r: T("Vale de", "Valid from", "Vigente desde"), v: (l) => `${l.ini_valid}${l.fim_valid ? ` → ${l.fim_valid}` : ""}`, ajuda: AJUDA_VALE },
      { r: "CNAE", v: (l) => l.cnae_prep, ajuda: T("Atividade econômica principal da filial (CNAE de 7 dígitos, IBGE). O eSocial usa para definir o grau de risco do trabalho (RAT). Tocar abre a consulta oficial do IBGE.", "The branch's main economic activity (7-digit CNAE, IBGE). eSocial uses it to set the work-risk level (RAT). Tap to open the official IBGE lookup.", "Actividad económica principal de la sucursal (CNAE de 7 dígitos, IBGE). eSocial la usa para definir el grado de riesgo laboral (RAT). Toque para abrir la consulta oficial del IBGE."), ir: (l) => (l.cnae_prep ? { externo: `https://concla.ibge.gov.br/busca-online-cnae.html?subclasse=${String(l.cnae_prep).replace(/\D/g, "")}&view=subclasse` } : null) },
    ],
  },
  {
    id: "lotacoes", tabela: "rh_lotacoes", versionada: true, nome: T("Lotações", "Tax units", "Lotaciones"),
    titulo: (l) => `${l.cod_lotacao} · ${l.nome}`,
    campos: [
      { k: "nome", r: T("Nome (no Axioma)", "Name (in Axioma)", "Nombre (en Axioma)"), tipo: "texto", obrig: true },
      { k: "cod_lotacao", r: T("Código da lotação", "Tax unit code", "Código de la lotación"), tipo: "texto", obrig: true },
      { k: "ini_valid", r: T("Vale a partir de", "Valid from", "Vigente desde"), tipo: "mes", obrig: true, ajuda: AJUDA_VALIDADE },
      { k: "fim_valid", r: T("Vale até (opcional)", "Valid until (optional)", "Vigente hasta (opcional)"), tipo: "mes" },
      { k: "tp_lotacao", r: T("Tipo de lotação (Tabela 10)", "Tax unit type (Table 10)", "Tipo de lotación (Tabla 10)"), tipo: "select", obrig: true, opcoes: (d) => d.tab10, ajuda: T("O comum é 01 (atividade da própria empresa). Os outros tipos pedem a inscrição do contratante ou da obra.", "Usually 01 (company's own activity). Other types require the contractor's or site registration.", "Lo común es 01 (actividad de la propia empresa). Los otros tipos piden la inscripción del contratante o de la obra.") },
      { k: "tp_insc", r: T("Inscrição ligada (se o tipo pedir)", "Linked registration (if the type requires)", "Inscripción vinculada (si el tipo lo pide)"), tipo: "select", num: true, opcoes: [{ v: "", l: "—" }, { v: "1", l: "CNPJ" }, { v: "2", l: "CPF" }, { v: "4", l: "CNO" }] },
      { k: "nr_insc", r: T("Número da inscrição ligada", "Linked registration number", "Número de la inscripción vinculada"), tipo: "texto" },
      { k: "fpas", r: T("FPAS (Tabela 04)", "FPAS (Table 04)", "FPAS (Tabla 04)"), tipo: "select", obrig: true, opcoes: (d) => d.fpas },
      { k: "cod_tercs", r: T("Código de Terceiros (4 dígitos)", "Third-party code (4 digits)", "Código de Terceros (4 dígitos)"), tipo: "texto", obrig: true, ajuda: T("Simples e MEI: 0000. Demais: o código cheio do FPAS, descontando convênios (ex.: 515 → 0115).", "Simples and MEI: 0000. Others: the FPAS full code minus agreements (e.g. 515 → 0115).", "Simples y MEI: 0000. Demás: el código completo del FPAS, descontando convenios (ej.: 515 → 0115).") },
      { k: "situacao_esocial", r: T("Situação no eSocial", "eSocial status", "Situación en eSocial"), tipo: "select", obrig: true, opcoes: SITUACAO },
      { k: "contrat_tp_insc", r: T("Empreitada parcial: tipo do contratante", "Partial contract: contractor type", "Contrata parcial: tipo del contratante"), tipo: "select", num: true, avancado: true, opcoes: [{ v: "", l: "—" }, { v: "1", l: "CNPJ" }, { v: "2", l: "CPF" }] },
      { k: "contrat_nr_insc", r: T("Empreitada parcial: CNPJ/CPF do contratante", "Partial contract: contractor CNPJ/CPF", "Contrata parcial: CNPJ/CPF del contratante"), tipo: "texto", avancado: true },
      { k: "prop_tp_insc", r: T("Empreitada parcial: tipo do proprietário da obra", "Partial contract: site owner type", "Contrata parcial: tipo del propietario"), tipo: "select", num: true, avancado: true, opcoes: [{ v: "", l: "—" }, { v: "1", l: "CNPJ" }, { v: "2", l: "CPF" }] },
      { k: "prop_nr_insc", r: T("Empreitada parcial: CNPJ/CPF do proprietário", "Partial contract: owner CNPJ/CPF", "Contrata parcial: CNPJ/CPF del propietario"), tipo: "texto", avancado: true },
      { k: "op_port_aliq_rat", r: T("Operador portuário: alíquota RAT", "Port operator: RAT rate", "Operador portuario: alícuota RAT"), tipo: "select", num: true, avancado: true, opcoes: [{ v: "", l: "—" }, { v: "1", l: "1" }, { v: "2", l: "2" }, { v: "3", l: "3" }] },
      { k: "op_port_fap", r: T("Operador portuário: FAP", "Port operator: FAP", "Operador portuario: FAP"), tipo: "numero", avancado: true },
    ],
    colunas: [
      { r: T("Código", "Code", "Código"), v: (l) => l.cod_lotacao, ajuda: T("Código que a Empresa escolhe para a lotação tributária (evento S-1020 do eSocial). Cada pessoa no contrato fica ligada a uma lotação. Tocar abre o cadastro.", "Code the company chooses for the tax unit (eSocial event S-1020). Each person's contract is linked to one. Tap to open the record.", "Código que la empresa elige para la lotación tributaria (evento S-1020 de eSocial). Cada contrato queda vinculado a una. Toque para abrir el registro."), ir: (l) => ({ editar: l }) },
      { r: T("Nome", "Name", "Nombre"), v: (l) => l.nome, ajuda: T("Nome da lotação dentro do Axioma (ex.: Sede, Obra Centro).", "Tax unit name inside Axioma (e.g. Head office, Downtown site).", "Nombre de la lotación en Axioma (ej.: Sede, Obra Centro).") },
      { r: T("Tipo / FPAS", "Type / FPAS", "Tipo / FPAS"), v: (l) => `${l.tp_lotacao} · FPAS ${l.fpas} · ${l.cod_tercs}`, ajuda: T("Tipo da lotação (Tabela 10 do eSocial — o comum é 01, atividade da própria empresa), FPAS (Tabela 04 — define para quais fundos e entidades a Empresa contribui, como o Sistema S) e o código de Terceiros (Simples e MEI: 0000). Tocar mostra os textos oficiais.", "Tax unit type (eSocial Table 10 — usually 01, the company's own activity), FPAS (Table 04 — which funds and entities the company contributes to, such as the S System) and the third-party code (Simples and MEI: 0000). Tap to see the official texts.", "Tipo de lotación (Tabla 10 de eSocial — lo común es 01, actividad propia), FPAS (Tabla 04 — a qué fondos y entidades contribuye la empresa, como el Sistema S) y el código de Terceros (Simples y MEI: 0000). Toque para ver los textos oficiales."), ir: (l, d, lang) => ({ card: { titulo: "Tabela 10 · Tabela 04 — eSocial", linhas: [`${T("Tipo", "Type", "Tipo")[lang]}: ${rotulo(d.tab10, l.tp_lotacao, lang)}`, `FPAS: ${rotulo(d.fpas, l.fpas, lang)}`, `${T("Terceiros", "Third parties", "Terceros")[lang]}: ${l.cod_tercs}`] } }) },
      { r: T("Vale de", "Valid from", "Vigente desde"), v: (l) => `${l.ini_valid}${l.fim_valid ? ` → ${l.fim_valid}` : ""}`, ajuda: AJUDA_VALE },
    ],
  },
  {
    id: "departamentos", tabela: "rh_departamentos", versionada: false, nome: T("Departamentos", "Departments", "Departamentos"),
    titulo: (l) => l.nome,
    campos: [
      { k: "nome", r: T("Nome", "Name", "Nombre"), tipo: "texto", obrig: true },
      { k: "codigo", r: T("Código (opcional)", "Code (optional)", "Código (opcional)"), tipo: "texto" },
      { k: "pai_id", r: T("Fica dentro de (opcional)", "Belongs to (optional)", "Está dentro de (opcional)"), tipo: "select", opcoes: (d) => [{ v: "", l: "—" }, ...d.departamentos.map((x) => ({ v: x.id, l: x.nome }))] },
      { k: "centro_custo_id", r: T("Centro de custo (opcional)", "Cost center (optional)", "Centro de costo (opcional)"), tipo: "select", opcoes: (d) => [{ v: "", l: "—" }, ...d.centros] },
      { k: "estabelecimento_id", r: T("Filial (opcional)", "Branch (optional)", "Sucursal (opcional)"), tipo: "select", opcoes: (d) => [{ v: "", l: "—" }, ...d.filiais.map((x) => ({ v: x.id, l: x.nome }))] },
      { k: "ativo", r: T("Ativo", "Active", "Activo"), tipo: "bool" },
    ],
    colunas: [
      { r: T("Nome", "Name", "Nombre"), v: (l) => l.nome, ajuda: T("Área interna da Empresa (Comercial, Logística…). É usada no contrato de cada pessoa, no Painel do RH e nos relatórios. Tocar abre o cadastro.", "Internal area of the company (Sales, Logistics…). Used in each person's contract, the HR Panel and reports. Tap to open the record.", "Área interna de la empresa (Comercial, Logística…). Se usa en el contrato de cada persona, el Panel de RR. HH. y los informes. Toque para abrir el registro."), ir: (l) => ({ editar: l }) },
      { r: T("Fica dentro de", "Belongs to", "Está dentro de"), v: (l, d) => d.departamentos.find((x) => x.id === l.pai_id)?.nome ?? "—", ajuda: T("O departamento acima deste no organograma (ex.: Vendas Online fica dentro de Comercial). O Axioma não deixa formar um ciclo. Tocar abre o departamento de cima.", "The department above this one in the org chart (e.g. Online Sales belongs to Sales). Axioma blocks loops. Tap to open the parent department.", "El departamento superior en el organigrama (ej.: Ventas Online está dentro de Comercial). Axioma no permite ciclos. Toque para abrir el departamento superior."), ir: (l, d) => { const p = d.departamentos.find((x) => x.id === l.pai_id); return p ? { editar: p } : null; } },
      { r: T("Centro de custo", "Cost center", "Centro de costo"), v: (l, d, lang) => (l.centro_custo_id ? rotulo(d.centros, l.centro_custo_id, lang) : "—"), ajuda: T("Para onde vai o custo das pessoas deste departamento no Financeiro (rateio). Tocar abre o módulo Centros de Custo.", "Where this department's people cost goes in Finance (allocation). Tap to open Cost Centers.", "A dónde va el costo de las personas de este departamento en Finanzas (prorrateo). Toque para abrir Centros de Costo."), ir: (l) => (l.centro_custo_id ? { rota: "/centros-custo" } : null) },
      { r: T("Situação", "Status", "Situación"), v: (l, _d, lang) => (l.ativo ? { pt: "Ativo", en: "Active", es: "Activo" } : { pt: "Inativo", en: "Inactive", es: "Inactivo" })[lang], ajuda: T("Inativo deixa de aparecer para escolha em contratos novos, mas o histórico de quem já está nele continua.", "Inactive stops showing as a choice in new contracts, but the history of people in it stays.", "Inactivo deja de aparecer para elegir en contratos nuevos, pero el historial de quien ya está en él se mantiene.") },
    ],
  },
  {
    id: "cargos", tabela: "rh_cargos", versionada: false, nome: T("Cargos", "Job titles", "Cargos"),
    titulo: (l) => l.nome,
    campos: [
      { k: "nome", r: T("Nome do cargo", "Job title", "Nombre del cargo"), tipo: "texto", obrig: true },
      { k: "cbo", r: T("Ocupação na CBO", "CBO occupation", "Ocupación en la CBO"), tipo: "texto", obrig: true, ajuda: T("Digite o nome do cargo (ex.: vendedor, motorista) ou o código e escolha na lista oficial do Ministério do Trabalho (2.725 ocupações e 7.870 nomes alternativos). O eSocial exige na admissão.", "Type the job name (e.g. salesperson, driver) or the code and pick it from the official Ministry of Labor list (2,725 occupations and 7,870 alternative names). eSocial requires it at hiring.", "Escriba el nombre del cargo (ej.: vendedor, conductor) o el código y elíjalo de la lista oficial del Ministerio de Trabajo (2.725 ocupaciones y 7.870 nombres alternativos). eSocial lo exige en la admisión.") },
      { k: "departamento_id", r: T("Departamento (opcional)", "Department (optional)", "Departamento (opcional)"), tipo: "select", opcoes: (d) => [{ v: "", l: "—" }, ...d.departamentos.map((x) => ({ v: x.id, l: x.nome }))] },
      { k: "descricao", r: T("O que a pessoa faz", "What the person does", "Qué hace la persona"), tipo: "area" },
      { k: "requisitos", r: T("Requisitos (formação, experiência, registro)", "Requirements (education, experience, licence)", "Requisitos (formación, experiencia, registro)"), tipo: "area" },
      { k: "competencias", r: T("Competências exigidas", "Required skills", "Competencias exigidas"), tipo: "competencias", ajuda: T("Usadas no recrutamento e na análise de lacunas da equipe.", "Used in recruitment and team skill-gap analysis.", "Usadas en el reclutamiento y en el análisis de brechas del equipo.") },
      { k: "ativo", r: T("Ativo", "Active", "Activo"), tipo: "bool" },
    ],
    colunas: [
      { r: T("Cargo", "Job title", "Cargo"), v: (l) => l.nome, ajuda: T("Nome do cargo na Empresa. É escolhido no contrato de cada pessoa. Tocar abre o cadastro (descrição, requisitos e competências).", "Job title in the company. Chosen in each person's contract. Tap to open the record (description, requirements and skills).", "Nombre del cargo en la empresa. Se elige en el contrato de cada persona. Toque para abrir el registro (descripción, requisitos y competencias)."), ir: (l) => ({ editar: l }) },
      { r: "CBO", v: (l) => l.cbo, ajuda: T("Classificação Brasileira de Ocupações (Ministério do Trabalho, Portaria nº 397/2002). O eSocial exige o código de 6 dígitos na admissão (S-2200). Tocar abre a consulta oficial do Ministério do Trabalho.", "Brazilian Occupation Classification (Ministry of Labor, Ordinance 397/2002). eSocial requires the 6-digit code at hiring (S-2200). Tap to open the Ministry of Labor's official lookup.", "Clasificación Brasileña de Ocupaciones (Ministerio de Trabajo, Ordenanza 397/2002). eSocial exige el código de 6 dígitos en la admisión (S-2200). Toque para abrir la consulta oficial del Ministerio de Trabajo."), ir: () => ({ externo: "https://cbo.mte.gov.br/cbosite/pages/pesquisas/BuscaPorCodigo.jsf" }) },
      { r: T("Departamento", "Department", "Departamento"), v: (l, d) => d.departamentos.find((x) => x.id === l.departamento_id)?.nome ?? "—", ajuda: T("Departamento onde o cargo fica. Tocar abre a aba Departamentos.", "Department the job title belongs to. Tap to open the Departments tab.", "Departamento donde está el cargo. Toque para abrir la pestaña Departamentos."), ir: (l) => (l.departamento_id ? { aba: "departamentos" } : null) },
      { r: T("Competências", "Skills", "Competencias"), v: (l) => String((l.competencias ?? []).length), ajuda: T("Quantas competências o cargo exige (técnicas e comportamentais). Servem no recrutamento e na análise de lacunas da equipe. Tocar lista as competências.", "How many skills the job requires (technical and behavioral). Used in recruitment and team gap analysis. Tap to list them.", "Cuántas competencias exige el cargo (técnicas y de comportamiento). Sirven en el reclutamiento y el análisis de brechas. Toque para listarlas."), ir: (l, _d, lang) => ((l.competencias ?? []).length ? { card: { titulo: `${T("Competências", "Skills", "Competencias")[lang]} — ${l.nome}`, linhas: (l.competencias as Competencia[]).map((c) => `${c.nome} · ${c.tipo === "tecnica" ? T("técnica", "technical", "técnica")[lang] : T("comportamental", "behavioral", "de comportamiento")[lang]}${c.obrigatoria ? ` · ${T("obrigatória", "required", "obligatoria")[lang]}` : ""}`) } } : null) },
    ],
  },
];


// Card de explicação (ⓘ das colunas e dos acessos) e de detalhe (tabelas oficiais, competências) — efeito padrão.
type Info = { titulo: string; linhas: string[]; link?: { href: string; texto: string } };
function CardInfo({ info, onFechar, temaClaro, lang }: { info: Info | null; onFechar: () => void; temaClaro: boolean; lang: Lang }) {
  const verde = temaClaro ? "#0f7a5a" : "#2ecc9b";
  return (
    <AnimatePresence>
      {info && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.55)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onFechar}>
          <motion.div role="dialog" aria-modal="true" aria-label={info.titulo} onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-md rounded-2xl p-5 axi-card-premium3d axi-card-faixa" style={{ background: temaClaro ? "#f6f7c4" : "#0a1628", border: `1px solid ${temaClaro ? "rgba(16,27,61,0.15)" : "rgba(46,204,155,0.3)"}`, borderTop: `4px solid ${verde}` }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm font-black" style={{ color: temaClaro ? "#101b3d" : "var(--axi-text-primary)", ...FONTE_EXEC }}>{info.titulo}</p>
              <button onClick={onFechar} aria-label={lang === "en" ? "Close" : lang === "es" ? "Cerrar" : "Fechar"} style={{ color: temaClaro ? "#101b3d" : "var(--axi-text-secondary)" }}><X size={18} /></button>
            </div>
            <div className="space-y-2">{info.linhas.map((x, i) => <p key={i} className="text-sm" style={{ color: temaClaro ? "#1f2937" : "var(--axi-text-primary)" }}>{x}</p>)}</div>
            {info.link && <a href={info.link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: temaClaro ? "linear-gradient(135deg, #0b5f46, #0f7a5a)" : "linear-gradient(135deg, #0a4f3b, #0f7d5c)", color: "#fff" }}>{info.link.texto} ↗</a>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const AJUDA_ESOCIAL = T("Se este cadastro já foi enviado ao eSocial (o governo). Rascunho: ainda não foi — pode editar com o lápis. Enviado pelo contador: já está no governo — não se edita; para mudar algo, crie uma nova validade (eSocial, Decreto nº 8.373/2014).", "Whether this record was already sent to eSocial (the government). Draft: not yet — you can edit with the pencil. Sent by the accountant: already with the government — not editable; to change something, create a new validity (eSocial, Decree 8.373/2014).", "Si este registro ya se envió a eSocial (el gobierno). Borrador: aún no — puede editarlo con el lápiz. Enviado por el contador: ya está en el gobierno — no se edita; para cambiar algo, cree una nueva vigencia (eSocial, Decreto 8.373/2014).");
const AJUDA_ACOES = T("Lápis: editar (só rascunho). Copiar: nova validade a partir de um mês (o anterior fica no histórico). Lixeira: guarda por 60 dias e pode recuperar — pede a autorização de um supervisor.", "Pencil: edit (draft only). Copy: new validity from a month (the previous stays in history). Trash: kept 60 days and recoverable — requires a supervisor's authorization.", "Lápiz: editar (solo borrador). Copiar: nueva vigencia desde un mes (la anterior queda en el historial). Papelera: se guarda 60 días y se puede recuperar — pide autorización de un supervisor.");

// Campos de CNPJ/CPF: máscara enquanto digita. Inscrição do empregador/filial/lotação: CPF quando o tipo é CPF (2), senão CNPJ.
const CAMPOS_DOC = new Set(["nr_insc", "cnpj_efr", "cnpj_resp", "contrat_nr_insc", "prop_nr_insc", "cnpj_sindicato"]);
function mascaraDoc(k: string, v: string, f: Linha): string {
  if (!CAMPOS_DOC.has(k)) return v;
  const tipo = String(k === "contrat_nr_insc" ? f.contrat_tp_insc : k === "prop_nr_insc" ? f.prop_tp_insc : k === "nr_insc" ? f.tp_insc : "1");
  if (tipo === "2") return mascaraCPF(v);
  if (tipo === "4" || tipo === "3") return v.replace(/\D/g, "").slice(0, 14);   // CNO e CAEPF: só dígitos
  return mascaraCNPJ(v);
}
function txt(v: string | Texto, lang: Lang) { return typeof v === "string" ? v : v[lang]; }
function rotulo(ops: Opcao[], v: unknown, lang: Lang) { const o = ops.find((x) => x.v === String(v ?? "")); return o ? txt(o.l, lang) : String(v ?? "—"); }
const restamDias = (em: string) => Math.max(0, DIAS_LIXEIRA_RH - Math.floor((Date.now() - new Date(em).getTime()) / 86400000));

export default function RhEstruturaPage() {
  const { idioma } = useLanguage();
  const lang = ((idioma as Lang) || "pt") as Lang;
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const { tema } = useThemeAxioma();
  const temaClaro = tema === "xms";
  const ct = (hex: string) => corTema(hex, temaClaro);
  const { confirmar, janelaConfirmacao } = useConfirmarExclusao(temaClaro);
  const cartaoTema = temaClaro ? { fundo: "#f6f7c4", premium3d: true } : { premium3d: true };
  const TEXTO_SEC = temaClaro ? "#374151" : "var(--axi-text-secondary)";
  const NESTED_BG = temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)";
  const BORDA = temaClaro ? "rgba(16,27,61,0.12)" : "rgba(163,177,194,0.15)";
  const campoFundo = temaClaro ? "#ffffff" : "rgba(10,22,40,0.9)";
  const ROTULO = temaClaro ? "#101b3d" : ct("#5a8fd4");
  const BTN = temaClaro ? "linear-gradient(135deg, #0b5f46, #0f7a5a)" : "linear-gradient(135deg, #0a4f3b, #0f7d5c)";
  const NAVY = "#101b3d";

  const router = useRouter();
  const [aba, setAba] = useState<Aba>("empregador");
  const [info, setInfo] = useState<Info | null>(null);
  const [ordem, setOrdem] = useState<{ col: number; asc: boolean } | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<Linha | null>(null);
  const [pode, setPode] = useState({ ver: false, editar: false, gerir: false, carregado: false });
  const [verAcessos, setVerAcessos] = useState(false);
  const [verVerbas, setVerVerbas] = useState(false);
  const [dados, setDados] = useState<Dados>({ empregador: [], filiais: [], lotacoes: [], departamentos: [], cargos: [], tab08: [], tab10: [], fpas: [], centros: [] });
  const [lixeira, setLixeira] = useState<Linha[]>([]);
  const [verLixeira, setVerLixeira] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState<Linha | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [avancado, setAvancado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [aviso, setAviso] = useState<{ msg: string; tipo: "erro" | "ok" } | null>(null);
  const avisar = (msg: string, tipo: "erro" | "ok" = "erro") => { setAviso({ msg, tipo }); setTimeout(() => setAviso(null), 5000); };
  const cfg = ABAS.find((a) => a.id === aba)!;

  async function carregar() {
    setCarregando(true);
    const eid = await obterEmpresaAtiva();
    if (!eid) { setCarregando(false); return; }
    setEmpresaId(eid);
    const [v, e, g] = await Promise.all(["ver", "editar", "gerir"].map((a) => supabase.rpc("rh_pode", { p_empresa: eid, p_acao: a })));
    setPode({ ver: !!v.data, editar: !!e.data, gerir: !!g.data, carregado: true });
    if (!v.data) { setCarregando(false); return; }
    const sel = (t: string, ordem: string) => supabase.from(t).select("*").eq("empresa_id", eid).is("excluido_em", null).order(ordem).limit(2000);
    const [emp, fil, lot, dep, car, t08, t10, t04, cc, empr] = await Promise.all([
      sel("rh_empregador", "ini_valid"), sel("rh_estabelecimentos", "nome"), sel("rh_lotacoes", "cod_lotacao"), sel("rh_departamentos", "nome"), sel("rh_cargos", "nome"),
      supabase.from("esocial_tab08_class_trib").select("codigo, descricao").order("codigo"),
      supabase.from("esocial_tab10_tipo_lotacao").select("codigo, descricao").order("codigo"),
      supabase.from("esocial_tab04_fpas").select("fpas, grupo, descricao").order("fpas"),
      supabase.from("centros_custo").select("id, nome").eq("empresa_id", eid).order("nome"),
      supabase.from("empresas").select("cnpj, regime_tributario, cnae_principal").eq("id", eid).maybeSingle(),
    ]);
    const falhou = [emp, fil, lot, dep, car, t08, t10, t04].find((r) => r.error);
    if (falhou?.error) {
      // Leitura falhou ≠ "não há cadastro": avisa em vez de mostrar a tela vazia calada.
      avisar(L("Não foi possível carregar a estrutura do RH agora. Recarregue a página.", "Could not load the HR structure now. Reload the page.", "No se pudo cargar la estructura de RR. HH. ahora. Recargue la página."));
      Sentry.captureException(new Error(`rh/estrutura leitura: ${falhou.error.message}`));
    }
    const fpasUnicos = new Map<string, string>();
    (t04.data ?? []).forEach((f: Linha) => { if (!fpasUnicos.has(f.fpas)) fpasUnicos.set(f.fpas, `${f.fpas} — ${String(f.descricao).slice(0, 70)}`); });
    setDados({
      empregador: emp.data ?? [], filiais: fil.data ?? [], lotacoes: lot.data ?? [], departamentos: dep.data ?? [], cargos: car.data ?? [],
      tab08: (t08.data ?? []).map((x: Linha) => ({ v: x.codigo, l: `${x.codigo} — ${x.descricao}` })),
      tab10: (t10.data ?? []).map((x: Linha) => ({ v: x.codigo, l: `${x.codigo} — ${String(x.descricao).slice(0, 90)}` })),
      fpas: [...fpasUnicos].map(([v, l]) => ({ v, l })),
      centros: (cc.data ?? []).map((x: Linha) => ({ v: x.id, l: x.nome })),
    });
    setEmpresa(empr.data ?? null);
    setCarregando(false);
  }
  useEffect(() => { void carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function carregarLixeira() {
    if (!empresaId) return;
    const desde = new Date(Date.now() - DIAS_LIXEIRA_RH * 86400000).toISOString();
    const { data, error } = await supabase.from(cfg.tabela).select("*").eq("empresa_id", empresaId).gte("excluido_em", desde).order("excluido_em", { ascending: false }).limit(200);
    if (error) { avisar(L("Não foi possível abrir a lixeira agora.", "Could not open the trash now.", "No se pudo abrir la papelera ahora.")); return; }
    setLixeira(data ?? []);
  }
  useEffect(() => { if (verLixeira) void carregarLixeira(); }, [verLixeira, aba]); // eslint-disable-line react-hooks/exhaustive-deps

  function novo() {
    const base: Linha = { situacao_esocial: "rascunho", ativo: true, competencias: [] };
    if (cfg.versionada) base.ini_valid = mesAtual();
    if (aba === "empregador") Object.assign(base, { tp_insc: "1", nr_insc: raizCnpj(empresa?.cnpj) ?? "", class_trib: sugerirClassTrib(empresa?.regime_tributario) ?? "", ind_coop: "0", ind_constr: "0", ind_des_folha: "0", ind_porte: ["01", "04"].includes(String(sugerirClassTrib(empresa?.regime_tributario))) ? "S" : "" }); // Simples e MEI são ME/EPP (LC 123/2006)
    if (aba === "filiais") Object.assign(base, { tp_insc: "1", nr_insc: String(empresa?.cnpj ?? "").replace(/\D/g, ""), cnae_prep: cnaeSete(empresa?.cnae_principal) ?? "", nome: L("Matriz", "Head office", "Matriz") });
    if (aba === "lotacoes") Object.assign(base, { tp_lotacao: "01", cod_tercs: sugerirClassTrib(empresa?.regime_tributario) && ["01", "04"].includes(String(sugerirClassTrib(empresa?.regime_tributario))) ? "0000" : "" });
    setEditandoId(null); setAvancado(false); setForm(base);
  }
  function editar(l: Linha) { setEditandoId(l.id); setAvancado(false); setForm(paraForm(l)); }
  function novaValidade(l: Linha) { const f = paraForm(l); f.ini_valid = mesAtual(); f.fim_valid = ""; f.situacao_esocial = "rascunho"; setEditandoId(null); setAvancado(false); setForm(f); }
  function paraForm(l: Linha): Linha {
    const f: Linha = {};
    for (const c of cfg.campos) {
      const v = l[c.k];
      f[c.k] = c.tipo === "lista" ? (v ?? []).join(", ") : c.tipo === "competencias" ? (v ?? []) : c.tipo === "bool" ? !!v : v == null ? "" : String(v);
    }
    return f;
  }

  async function salvar(): Promise<boolean> {
    if (!form || !empresaId) return false;
    const falta = cfg.campos.find((c) => c.obrig && String(form[c.k] ?? "").trim() === "");
    if (falta) { avisar(L(`Preencha: ${falta.r.pt}.`, `Fill in: ${falta.r.en}.`, `Complete: ${falta.r.es}.`)); return false; }
    const payload: Linha = { empresa_id: empresaId };
    for (const c of cfg.campos) {
      const v = form[c.k];
      if (c.tipo === "bool") { payload[c.k] = v; continue; }
      if (c.tipo === "competencias") { payload[c.k] = (v ?? []).filter((x: Competencia) => x.nome.trim()).map((x: Competencia) => ({ ...x, nome: x.nome.trim() })); continue; }
      const s = String(v ?? "").trim();
      if (c.tipo === "lista") { const itens = s.split(",").map((x) => x.replace(/\D/g, "")).filter(Boolean); payload[c.k] = itens.length ? itens : null; continue; }
      if (s === "") { payload[c.k] = null; continue; }
      if (c.num) payload[c.k] = Number(s);
      else if (c.tipo === "numero") {
        const n = lerValorBR(s);
        if (Number.isNaN(n)) { avisar(L(`Número inválido em: ${c.r.pt}.`, `Invalid number in: ${c.r.en}.`, `Número inválido en: ${c.r.es}.`)); return false; }
        payload[c.k] = n;
      }
      else if (["nr_insc", "cnpj_efr", "cnpj_resp", "cnae_prep", "cbo", "contrat_nr_insc", "prop_nr_insc", "apr_nr_proc_jud", "pcd_nr_proc_jud", "cnpj_sindicato"].includes(c.k)) payload[c.k] = s.replace(/\D/g, "");
      else payload[c.k] = s;
    }
    setSalvando(true);
    const r = editandoId
      ? await supabase.from(cfg.tabela).update(payload).eq("id", editandoId).select("id")
      : await supabase.from(cfg.tabela).insert(payload).select("id");
    setSalvando(false);
    if (r.error || !r.data?.length) {
      avisar(mensagemErroRh(r.error ?? { code: "42501", message: "row-level security" }, lang));
      if (r.error && !["23514", "23505", "42501"].includes(String(r.error.code))) Sentry.captureException(new Error(`rh/estrutura gravar ${cfg.tabela}: ${r.error.message}`));
      return false;
    }
    setForm(null); avisar(L("Salvo.", "Saved.", "Guardado."), "ok"); void carregar();
    return true;
  }

  async function paraLixeira(l: Linha) {
    if (cfg.versionada && l.situacao_esocial !== "rascunho") {
      avisar(L("Já foi enviado ao eSocial: não vai para a lixeira. Edite e informe \"Vale até\" — no governo, a correção é por fim de validade.", "Already sent to eSocial: it cannot go to the trash. Set \"Valid until\" instead — the government corrects by ending validity.", "Ya enviado al eSocial: no va a la papelera. Informe \"Vigente hasta\" — en el gobierno se corrige por fin de vigencia."));
      return;
    }
    const ok = await confirmar({
      oQue: nomeItem({ nome: cfg.titulo(l) }, { pt: "este cadastro", en: "this record", es: "este registro" }),
      efeito: T(`Vai para a lixeira do RH e pode ser recuperado por ${DIAS_LIXEIRA_RH} dias. Depois disso, some de vez.`, `It goes to the HR trash and can be recovered for ${DIAS_LIXEIRA_RH} days. After that, it is deleted for good.`, `Va a la papelera de RR. HH. y puede recuperarse por ${DIAS_LIXEIRA_RH} días. Después, se elimina definitivamente.`),
      tabela: cfg.tabela, registroId: l.id,
    });
    if (!ok) return;
    const { data, error } = await supabase.from(cfg.tabela).update({ excluido_em: new Date().toISOString() }).eq("id", l.id).select("id");
    if (error || !data?.length) { avisar(mensagemErroRh(error, lang)); return; }
    avisar(L(`Movido para a lixeira — dá para recuperar por ${DIAS_LIXEIRA_RH} dias.`, `Moved to trash — recoverable for ${DIAS_LIXEIRA_RH} days.`, `Movido a la papelera — se puede recuperar por ${DIAS_LIXEIRA_RH} días.`), "ok");
    void carregar();
  }
  async function recuperar(l: Linha) {
    const { data, error } = await supabase.from(cfg.tabela).update({ excluido_em: null }).eq("id", l.id).select("id");
    if (error || !data?.length) { avisar(mensagemErroRh(error, lang)); return; }
    avisar(L("Recuperado.", "Recovered.", "Recuperado."), "ok"); void carregar(); void carregarLixeira();
  }

  // Compartilhar / exportar — o que está na aba aberta
  const linhas = dados[aba];
  // ordenar pela coluna tocada (texto e número, no idioma da tela)
  const linhasVis = ordem && cfg.colunas[ordem.col] ? [...(verLixeira ? lixeira : linhas)].sort((a, b) => {
    const c = cfg.colunas[ordem.col]; const r = c.v(a, dados, lang).localeCompare(c.v(b, dados, lang), lang, { numeric: true, sensitivity: "base" });
    return ordem.asc ? r : -r;
  }) : (verLixeira ? lixeira : linhas);
  const irPara = (d: Destino) => {
    if ("aba" in d) { setAba(d.aba); setOrdem(null); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if ("rota" in d) router.push(d.rota);
    else if ("externo" in d) window.open(d.externo, "_blank", "noopener,noreferrer");
    else if ("editar" in d) { if (!pode.editar || (cfg.versionada && d.editar.situacao_esocial !== "rascunho")) setInfo({ titulo: cfg.titulo(d.editar), linhas: cfg.colunas.map((c) => `${txt(c.r, lang)}: ${c.v(d.editar, dados, lang)}`) }); else editar(d.editar); }
    else setInfo(d.card);
  };
  const explicar = (titulo: string, ajuda: Texto) => setInfo({ titulo, linhas: [ajuda[lang]] });
  const exportar = (formato: "pdf" | "excel" = "pdf") => {
    try {
      (formato === "excel" ? gerarExcelTabela : gerarPdfTabela)({
        titulo: `RH — ${cfg.nome[lang]}`, subtitulo: L("Estrutura da Empresa", "Company structure", "Estructura de la empresa"),
        colunas: cfg.colunas.map((c, i) => ({ header: txt(c.r, lang), key: `c${i}`, width: 3 })),
        linhas: linhas.map((l) => Object.fromEntries(cfg.colunas.map((c, i) => [`c${i}`, c.v(l, dados, lang)]))),
        resumo: [{ label: L("Itens", "Items", "Ítems"), valor: String(linhas.length) }],
        nomeArquivo: `axioma-rh-${aba}-${hojeISO()}.pdf`,
      }, (m) => avisar(m), lang);
    } catch (err) { avisar(tratarFalhaExportacao("rh-estrutura.exportar", err, lang)); }
  };
  const resumoShare = useMemo(() => [
    `🚀 AXIOMA AI.TECH — ${L("RH · Estrutura da Empresa", "HR · Company structure", "RR. HH. · Estructura de la empresa")}`,
    ...ABAS.map((a) => `• ${a.nome[lang]}: ${dados[a.id].length}`),
    `_axiomaai.com.br_`,
  ].join("\n"), [dados, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const detalhadoShare = [
    `🚀 AXIOMA AI.TECH — RH · ${cfg.nome[lang]}`,
    ...linhas.map((l) => cfg.colunas.map((c) => c.v(l, dados, lang)).join(" | ")),
    `_axiomaai.com.br_`,
  ].join("\n");

  const semEmpregador = dados.empregador.length === 0;
  const opcoesDe = (c: Campo) => (typeof c.opcoes === "function" ? c.opcoes(dados) : c.opcoes ?? []);
  const estiloCampo = { background: campoFundo, border: `1px solid ${BORDA}`, color: "var(--axi-text-primary)" };

  return (
    <div data-theme={tema} style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
      <ModuloLayout
        titulo={L("RH", "HR", "RR. HH.")}
        subtitulo={L("Empregador, filiais, lotações, departamentos e cargos — base do eSocial e da folha", "Employer, branches, tax units, departments and job titles — the base for eSocial and payroll", "Empleador, sucursales, lotaciones, departamentos y cargos — base del eSocial y de la nómina")}
        onExportarPDF={() => exportar("pdf")} onExportarExcel={() => exportar("excel")}
        labelBotao={pode.editar ? L(`Novo: ${cfg.nome.pt}`, `New: ${cfg.nome.en}`, `Nuevo: ${cfg.nome.es}`) : undefined}
        onNovo={pode.editar ? novo : undefined}
        headerFundo={temaClaro ? "linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)" : undefined}
        corExportar={temaClaro ? "linear-gradient(135deg, #16a97d, #2ecc9b)" : undefined}
        corNovo={temaClaro ? "linear-gradient(135deg, #16a97d, #2ecc9b)" : undefined}
        botaoExtra={<ThemeToggle />}>
        <div className="space-y-4">
          <NavRh lang={lang} temaClaro={temaClaro} />
          {pode.ver && <LetreiroAxioma id="rh-estrutura" cor="#101b3d" itens={ABAS.map((a) => `${a.nome[lang]} ${dados[a.id].length}`)} />}
          {pode.carregado && !pode.ver ? (
            <CanvasBox cor={ct("#2ecc9b")} {...cartaoTema}>
              <div className="flex items-start gap-3 py-2">
                <ShieldCheck size={20} style={{ color: ct("#2ecc9b"), flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--axi-text-primary)" }}>{L("Você não tem acesso ao RH desta Empresa. Peça ao Proprietário, CEO, Sócio ou Admin para liberar em RH · Estrutura → Acessos do RH.", "You do not have access to HR for this company. Ask the Owner, CEO, Partner or Admin to grant it in HR · Structure → HR access.", "No tiene acceso a RR. HH. de esta empresa. Pida al Propietario, CEO, Socio o Admin que lo habilite en RR. HH. · Estructura → Accesos de RR. HH.")}</p>
              </div>
            </CanvasBox>
          ) : (
            <>
              {/* Abas + compartilhar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
                  {ABAS.map((a) => {
                    const ativa = a.id === aba && !verAcessos && !verVerbas;
                    return (
                      <button key={a.id} onClick={() => { setAba(a.id); setVerLixeira(false); setVerAcessos(false); setVerVerbas(false); }}
                        className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap axi-card-premium3d axi-card-faixa"
                        style={ativa ? { background: temaClaro ? NAVY : "linear-gradient(135deg, #0a4f3b, #0f7d5c)", color: "#fff", border: `1px solid ${temaClaro ? NAVY : "rgba(46,204,155,0.5)"}` }
                          : { background: NESTED_BG, color: temaClaro ? NAVY : "var(--axi-text-primary)", border: `1px solid ${BORDA}` }}>
                        {a.nome[lang]} <span style={{ opacity: 0.85 }}>({dados[a.id].length})</span>
                      </button>
                    );
                  })}
                  <button onClick={() => { setVerVerbas(true); setVerAcessos(false); }} className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap axi-card-premium3d axi-card-faixa"
                    style={verVerbas ? { background: temaClaro ? NAVY : "linear-gradient(135deg, #0a4f3b, #0f7d5c)", color: "#fff", border: `1px solid ${temaClaro ? NAVY : "rgba(46,204,155,0.5)"}` }
                      : { background: NESTED_BG, color: temaClaro ? NAVY : "var(--axi-text-primary)", border: `1px solid ${BORDA}` }}>
                    {L("Verbas da rescisão (S-1010)", "Termination pay items (S-1010)", "Rubricas de la rescisión (S-1010)")}
                  </button>
                  {pode.gerir && (
                    <button onClick={() => { setVerAcessos(true); setVerVerbas(false); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap axi-card-premium3d axi-card-faixa"
                      style={verAcessos ? { background: temaClaro ? NAVY : "linear-gradient(135deg, #0a4f3b, #0f7d5c)", color: "#fff", border: `1px solid ${temaClaro ? NAVY : "rgba(46,204,155,0.5)"}` }
                        : { background: NESTED_BG, color: temaClaro ? NAVY : "var(--axi-text-primary)", border: `1px solid ${BORDA}` }}>
                      <KeyRound size={14} /> {L("Acessos do RH", "HR access", "Accesos de RR. HH.")}
                    </button>
                  )}
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: BTN, color: "#fff" }}>
                  <Share2 size={16} /> {L("Compartilhar", "Share", "Compartir")}
                </motion.button>
              </div>

              {verVerbas && empresaId ? (
                <VerbasEsocial empresaId={empresaId} lang={lang} temaClaro={temaClaro} cartaoTema={cartaoTema} TEXTO_SEC={TEXTO_SEC} BORDA={BORDA} podeEditar={pode.editar} avisar={avisar} />
              ) : verAcessos && empresaId ? (
                <AcessosRh empresaId={empresaId} lang={lang} temaClaro={temaClaro} cartaoTema={cartaoTema} estilo={estiloCampo} TEXTO_SEC={TEXTO_SEC} BORDA={BORDA} avisar={avisar} />
              ) : (<>
              {/* Comece pelo empregador */}
              {!carregando && semEmpregador && aba !== "empregador" && aba !== "departamentos" && aba !== "cargos" && (
                <CanvasBox cor={ct("#2ecc9b")} {...cartaoTema}>
                  <p className="text-sm" style={{ color: "var(--axi-text-primary)" }}>{L("Comece pela aba Empregador: filiais e lotações dependem dela (regra do eSocial).", "Start with the Employer tab: branches and tax units depend on it (eSocial rule).", "Empiece por la pestaña Empleador: sucursales y lotaciones dependen de ella (regla del eSocial).")}</p>
                  <button onClick={() => setAba("empregador")} className="mt-3 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: BTN, color: "#fff" }}>{L("Ir para Empregador", "Go to Employer", "Ir a Empleador")}</button>
                </CanvasBox>
              )}
              {!carregando && aba === "empregador" && semEmpregador && pode.editar && (
                <CanvasBox cor={ct("#2ecc9b")} {...cartaoTema}>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--axi-text-primary)", ...FONTE_EXEC }}>{L("Primeiro passo do RH", "First HR step", "Primer paso de RR. HH.")}</p>
                  <p className="text-sm" style={{ color: TEXTO_SEC }}>{L("Os dados do empregador são o cadastro que o eSocial exige antes de qualquer admissão. O Axioma preenche com o que já está no cadastro da Empresa — confira com o contador e salve.", "Employer data is the record eSocial requires before any hiring. Axioma fills in what is already in the company record — check with your accountant and save.", "Los datos del empleador son el registro que eSocial exige antes de cualquier admisión. Axioma completa con lo que ya está en el registro de la empresa — confirme con el contador y guarde.")}</p>
                  {!raizCnpj(empresa?.cnpj) && <p className="text-sm mt-2 font-semibold" style={{ color: temaClaro ? "#9a3412" : "#fbbf24" }}>{L("O CNPJ completo da Empresa não está cadastrado. Preencha em Config → Empresa, ou digite no formulário.", "The company's full CNPJ is not registered. Fill it in at Config → Company, or type it in the form.", "El CNPJ completo de la empresa no está registrado. Complételo en Config → Empresa, o escríbalo en el formulario.")} <Link href="/empresa" className="underline font-bold whitespace-nowrap">{L("Abrir Empresa ›", "Open Company ›", "Abrir Empresa ›")}</Link></p>}
                  <BotaoAcao executar={() => { novo(); return true; }} icone={<Wand2 size={15} />} texto={L("Preencher com os dados da Empresa", "Fill in with company data", "Completar con los datos de la empresa")}
                    textoTrabalhando={L("Preenchendo…", "Filling in…", "Completando…")} className="mt-3 px-4 py-2 rounded-xl text-sm" estilo={{ background: BTN, color: "#fff" }} />
                </CanvasBox>
              )}

              {/* Lista */}
              <CanvasBox cor={ct("#2ecc9b")} {...cartaoTema}>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <p className="text-sm font-black" style={{ color: temaClaro ? NAVY : "var(--axi-text-primary)", ...FONTE_EXEC }}>{verLixeira ? L(`Lixeira — ${cfg.nome.pt}`, `Trash — ${cfg.nome.en}`, `Papelera — ${cfg.nome.es}`) : cfg.nome[lang]}</p>
                  {pode.editar && (
                    <button onClick={() => setVerLixeira(!verLixeira)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: temaClaro ? NAVY : "rgba(255,255,255,0.06)", color: "#fff", border: `1px solid ${BORDA}` }}>
                      {verLixeira ? <><X size={13} /> {L("Fechar lixeira", "Close trash", "Cerrar papelera")}</> : <><Trash2 size={13} /> {L(`Lixeira (${DIAS_LIXEIRA_RH} dias)`, `Trash (${DIAS_LIXEIRA_RH} days)`, `Papelera (${DIAS_LIXEIRA_RH} días)`)}</>}
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  {carregando ? (
                    <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (
                    <table className="w-full min-w-[620px]">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDA}` }}>
                          {cfg.colunas.map((c, j) => {
                            const nome = txt(c.r, lang); const ativa = ordem?.col === j;
                            return (
                              <th key={nome} className="text-left px-3 md:px-4 py-3 text-xs font-semibold tracking-wider uppercase" style={{ color: TEXTO_SEC }}>
                                <span className="inline-flex items-center gap-1.5">
                                  <button onClick={() => setOrdem(ativa ? { col: j, asc: !ordem!.asc } : { col: j, asc: true })} className="inline-flex items-center gap-1 uppercase hover:opacity-80" title={L("Ordenar", "Sort", "Ordenar")} style={{ color: ativa ? (temaClaro ? "#0f7a5a" : "#2ecc9b") : TEXTO_SEC }}>
                                    {nome} {ativa ? (ordem!.asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.5 }} />}
                                  </button>
                                  <button onClick={() => explicar(nome, c.ajuda)} aria-label={`${L("O que é", "What is", "Qué es")} ${nome}`} style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }}><InfoIcon size={13} /></button>
                                </span>
                              </th>
                            );
                          })}
                          {cfg.versionada && !verLixeira && (
                            <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold tracking-wider uppercase" style={{ color: TEXTO_SEC }}>
                              <span className="inline-flex items-center gap-1.5">eSocial <button onClick={() => explicar("eSocial", AJUDA_ESOCIAL)} aria-label={L("O que é eSocial", "What is eSocial", "Qué es eSocial")} style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }}><InfoIcon size={13} /></button></span>
                            </th>
                          )}
                          {verLixeira && <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold tracking-wider uppercase" style={{ color: TEXTO_SEC }}>{L("Recuperar até", "Recover within", "Recuperar en")}</th>}
                          <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold tracking-wider uppercase" style={{ color: TEXTO_SEC }}>
                            <span className="inline-flex items-center gap-1.5">{L("Ações", "Actions", "Acciones")} <button onClick={() => explicar(L("Ações", "Actions", "Acciones"), AJUDA_ACOES)} aria-label={L("O que fazem as ações", "What the actions do", "Qué hacen las acciones")} style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }}><InfoIcon size={13} /></button></span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(verLixeira ? lixeira : linhas).length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-10 text-sm" style={{ color: TEXTO_SEC }}>
                            {verLixeira ? L("A lixeira está vazia.", "The trash is empty.", "La papelera está vacía.") : (pode.editar ? L(`Nada cadastrado ainda. Clique no botão verde "+ Novo: ${cfg.nome.pt}", no topo da tela.`, `Nothing registered yet. Click the green "+ New: ${cfg.nome.en}" button at the top of the screen.`, `Nada registrado aún. Haga clic en el botón verde "+ Nuevo: ${cfg.nome.es}", en la parte superior de la pantalla.`) : L("Nada cadastrado ainda.", "Nothing registered yet.", "Nada registrado aún."))}
                          </td></tr>
                        ) : linhasVis.map((l, i) => (
                          <tr key={l.id} style={{ borderBottom: `1px solid ${BORDA}` }}>
                            {cfg.colunas.map((c, j) => (
                              <td key={j} className="px-3 md:px-4 py-3 text-sm" style={{ color: j === 0 ? "var(--axi-text-primary)" : TEXTO_SEC, fontWeight: j === 0 ? 700 : 400 }}>
                                {(() => { const d = !verLixeira && c.ir ? c.ir(l, dados, lang) : null; const valor = c.v(l, dados, lang);
                                  return d ? <button onClick={() => irPara(d)} className="text-left underline decoration-dotted underline-offset-4 hover:opacity-80" style={{ color: j === 0 ? "var(--axi-text-primary)" : temaClaro ? "#0f7a5a" : "#2ecc9b" }}>{valor}{"externo" in d ? " ↗" : " ›"}</button> : valor; })()}
                              </td>
                            ))}
                            {cfg.versionada && !verLixeira && (
                              <td className="px-3 md:px-4 py-3">
                                <span onClick={() => explicar("eSocial", AJUDA_ESOCIAL)} role="button" className="cursor-pointer text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap" style={l.situacao_esocial === "rascunho" ? { background: temaClaro ? "rgba(16,27,61,0.08)" : "rgba(255,255,255,0.08)", color: TEXTO_SEC } : { background: temaClaro ? NAVY : "rgba(46,204,155,0.15)", color: temaClaro ? "#fff" : "#2ecc9b" }}>
                                  {l.situacao_esocial === "rascunho" ? L("Rascunho", "Draft", "Borrador") : L("Enviado pelo contador", "Sent by accountant", "Enviado por el contador")}
                                </span>
                              </td>
                            )}
                            {verLixeira && <td className="px-3 md:px-4 py-3 text-sm" style={{ color: TEXTO_SEC }}>{L(`${restamDias(l.excluido_em)} dias`, `${restamDias(l.excluido_em)} days`, `${restamDias(l.excluido_em)} días`)}</td>}
                            <td className="px-3 md:px-4 py-3">
                              <div className="flex items-center gap-3">
                                {verLixeira ? (
                                  <button title={L("Recuperar", "Recover", "Recuperar")} onClick={() => recuperar(l)} style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }}><RotateCcw size={16} /></button>
                                ) : pode.editar && (
                                  <>
                                    {(!cfg.versionada || l.situacao_esocial === "rascunho") && <button title={L("Editar", "Edit", "Editar")} onClick={() => editar(l)} style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }}><Pencil size={16} /></button>}
                                    {cfg.versionada && <button title={L("Nova validade (mudou algo a partir de um mês)", "New validity (something changed from a month)", "Nueva vigencia (algo cambió desde un mes)")} onClick={() => novaValidade(l)} style={{ color: temaClaro ? NAVY : "#7dd3fc" }}><CopyPlus size={16} /></button>}
                                    <button title={L("Mandar para a lixeira", "Move to trash", "Enviar a la papelera")} onClick={() => paraLixeira(l)} style={{ color: ct("#f87171") }}><Trash2 size={16} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CanvasBox>
              </>)}
              <PerguntaIA tela="rh" empresaId={empresaId} lang={lang} temaClaro={temaClaro} titulo={L("Inteligência Axioma — Especialista de RH", "Axioma Intelligence — HR Specialist", "Inteligencia Axioma — Especialista de RR. HH.")}
                sugestoes={[L("O RH está configurado? O que falta?", "Is HR set up? What is missing?", "¿RR. HH. está configurado? ¿Qué falta?"), L("Quantos departamentos e cargos temos?", "How many departments and job titles do we have?", "¿Cuántos departamentos y cargos tenemos?")]} />
              <p className="text-xs" style={{ color: TEXTO_SEC }}>{L("Fonte das regras: leiaute oficial eSocial S-1.3 (NT 07/2026, rev. 20/10/2026). O Axioma prepara; quem envia ao governo nesta versão é o contador.", "Rules source: official eSocial S-1.3 layout (TN 07/2026, rev. 10/20/2026). Axioma prepares; in this version the accountant sends to the government.", "Fuente de las reglas: diseño oficial eSocial S-1.3 (NT 07/2026, rev. 20/10/2026). Axioma prepara; en esta versión quien envía al gobierno es el contador.")}</p>
            </>
          )}
        </div>

        {/* Formulário */}
        <AnimatePresence>
          {form && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 px-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.96, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 14 }} transition={{ duration: 0.2 }} className="w-full max-w-2xl">
                <CanvasBox cor={ct("#2ecc9b")} {...cartaoTema}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }}>AXIOMA · RH</p>
                      <h3 className="text-lg font-bold" style={{ color: "var(--axi-text-primary)" }}>{editandoId ? L("Editar", "Edit", "Editar") : L("Novo", "New", "Nuevo")} — {cfg.nome[lang]}</h3>
                    </div>
                    <button onClick={() => setForm(null)} style={{ color: TEXTO_SEC }} aria-label={L("Fechar", "Close", "Cerrar")}><X size={20} /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cfg.campos.filter((c) => !c.avancado || avancado).map((c) => (
                      <div key={c.k} className={c.tipo === "area" || c.tipo === "competencias" || c.tipo === "lista" ? "md:col-span-2" : ""}>
                        <label htmlFor={`rh-${c.k}`} className="text-xs font-semibold mb-1.5 block" style={{ color: ROTULO }}>{c.r[lang]}{c.obrig && " *"}</label>
                        {c.tipo === "select" ? (
                          <select id={`rh-${c.k}`} value={form[c.k] ?? ""} onChange={(e) => setForm({ ...form, [c.k]: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={estiloCampo}>
                            {!opcoesDe(c).some((o) => o.v === "") && <option value="">—</option>}
                            {opcoesDe(c).map((o) => <option key={o.v} value={o.v}>{txt(o.l, lang)}</option>)}
                          </select>
                        ) : c.tipo === "bool" ? (
                          <label className="flex items-center gap-2 text-sm py-2" style={{ color: "var(--axi-text-primary)" }}>
                            <input id={`rh-${c.k}`} type="checkbox" checked={!!form[c.k]} onChange={(e) => setForm({ ...form, [c.k]: e.target.checked })} /> {c.r[lang]}
                          </label>
                        ) : c.tipo === "area" ? (
                          <textarea id={`rh-${c.k}`} rows={3} value={form[c.k] ?? ""} onChange={(e) => setForm({ ...form, [c.k]: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={estiloCampo} />
                        ) : c.k === "cbo" ? (
                          <BuscaCbo id={`rh-${c.k}`} valor={String(form.cbo ?? "")} lang={lang} estilo={estiloCampo} claro={temaClaro}
                            onChange={(codigo, titulo) => setForm((f) => (f ? { ...f, cbo: codigo, ...(titulo && !String(f.nome ?? "").trim() ? { nome: titulo } : {}) } : f))} />
                        ) : c.tipo === "competencias" ? (
                          <EditorCompetencias valor={form[c.k] ?? []} onChange={(v) => setForm({ ...form, [c.k]: v })} lang={lang} estilo={estiloCampo} cor={temaClaro ? NAVY : "#2ecc9b"} />
                        ) : (
                          <input id={`rh-${c.k}`} type={c.tipo === "mes" ? "month" : c.tipo === "data" ? "date" : "text"} inputMode={c.tipo === "numero" ? "decimal" : undefined}
                            value={CAMPOS_DOC.has(c.k) ? mascaraDoc(c.k, String(form[c.k] ?? ""), form) : form[c.k] ?? ""} onChange={(e) => setForm({ ...form, [c.k]: mascaraDoc(c.k, e.target.value, form) })} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={estiloCampo} />
                        )}
                        {c.ajuda && <p className="text-xs mt-1" style={{ color: TEXTO_SEC }}>{c.ajuda[lang]}</p>}
                      </div>
                    ))}
                  </div>
                  {cfg.campos.some((c) => c.avancado) && (
                    <button onClick={() => setAvancado(!avancado)} className="mt-3 text-xs font-bold underline" style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }}>
                      {avancado ? L("Esconder casos especiais", "Hide special cases", "Ocultar casos especiales") : L("Mostrar casos especiais (cooperativa, obra, órgão público, isenção…)", "Show special cases (cooperative, site, public body, exemption…)", "Mostrar casos especiales (cooperativa, obra, órgano público, exención…)")}
                    </button>
                  )}
                  <BotaoAcao executar={salvar} texto={L("Salvar", "Save", "Guardar")} textoTrabalhando={L("Salvando…", "Saving…", "Guardando…")} className="w-full mt-4 py-3.5 rounded-xl" estilo={{ background: BTN, color: "#fff" }} />
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <CentroCompartilhamento aberto={shareAberto} onFechar={() => setShareAberto(false)} lang={lang}
          textoResumo={resumoShare} textoDetalhado={detalhadoShare} assunto={`RH — ${cfg.nome[lang]} — Axioma`} onExportarPDF={() => exportar("pdf")} cor="#0f7a5a" />
        {janelaConfirmacao}
        <CardInfo info={info} onFechar={() => setInfo(null)} temaClaro={temaClaro} lang={lang} />
        <AvisoAxioma aviso={aviso} onFechar={() => setAviso(null)} />
      </ModuloLayout>
    </div>
  );
}

// Lista de competências do cargo: nome, técnica/comportamental, obrigatória, nível 1–5.
// Busca na lista oficial da CBO (tabelas cbo_ocupacoes/cbo_sinonimos, RH-13). Sem a lista no banco, aceita o código digitado.
const semAcento = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
function BuscaCbo({ id, valor, onChange, lang, estilo, claro }: { id: string; valor: string; onChange: (codigo: string, titulo?: string) => void; lang: Lang; estilo: CSSProperties; claro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [texto, setTexto] = useState("");
  const [titulo, setTitulo] = useState<string | null>(null);
  const [achados, setAchados] = useState<{ codigo: string; titulo: string; ocupacao: string }[]>([]);
  const [semLista, setSemLista] = useState(false);
  useEffect(() => {
    if (!/^\d{6}$/.test(valor)) return;
    let vivo = true;
    void supabase.from("cbo_ocupacoes").select("titulo").eq("codigo", valor).maybeSingle().then(({ data, error }) => { if (!vivo) return; if (error) setSemLista(true); setTitulo(data?.titulo ?? (error ? null : "")); });
    return () => { vivo = false; };
  }, [valor]);
  useEffect(() => {
    const q = semAcento(texto);
    if (q.length < 2) return;
    let vivo = true;
    const t = setTimeout(async () => {
      const digitos = /^\d+$/.test(q);
      const [oc, si] = await Promise.all([
        (digitos ? supabase.from("cbo_ocupacoes").select("codigo, titulo").like("codigo", `${q}%`) : supabase.from("cbo_ocupacoes").select("codigo, titulo").ilike("busca", `%${q}%`)).order("titulo").limit(12),
        digitos ? Promise.resolve({ data: [], error: null }) : supabase.from("cbo_sinonimos").select("codigo, titulo, cbo_ocupacoes(titulo)").ilike("busca", `%${q}%`).order("titulo").limit(12),
      ]);
      if (!vivo) return;
      if (oc.error || si.error) { setSemLista(true); setAchados([]); return; }
      const vistos = new Set<string>();
      const lista = [
        ...(oc.data ?? []).map((o: Linha) => ({ codigo: o.codigo, titulo: o.titulo, ocupacao: o.titulo })),
        ...(si.data ?? []).map((s: Linha) => ({ codigo: s.codigo, titulo: s.titulo, ocupacao: (s.cbo_ocupacoes as Linha | null)?.titulo ?? s.titulo })),
      ].filter((x) => { const k = `${x.codigo}|${x.titulo}`; if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 15);
      setAchados(lista);
    }, 250);
    return () => { vivo = false; clearTimeout(t); };
  }, [texto]);
  const tituloOk = /^\d{6}$/.test(valor) ? titulo : null;
  const lista = semAcento(texto).length < 2 ? [] : achados;
  const cor = claro ? "#101b3d" : "#2ecc9b";
  return (
    <div>
      <input id={id} type="text" value={texto} placeholder={valor ? `${valor}${tituloOk ? ` — ${tituloOk}` : ""}` : L("Ex.: vendedor, motorista, 411010", "E.g. salesperson, driver, 411010", "Ej.: vendedor, conductor, 411010")}
        onChange={(e) => { const v = e.target.value; setTexto(v); const d = v.replace(/\D/g, ""); if (semLista && /^\d{6}$/.test(d)) onChange(d); }}
        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={estilo} autoComplete="off" />
      {valor && (
        <p className="text-xs mt-1 font-semibold" style={{ color: tituloOk === "" ? (claro ? "#9a3412" : "#fbbf24") : cor }}>
          {tituloOk === "" ? L(`${valor}: código fora da lista oficial — escolha outro.`, `${valor}: code not in the official list — pick another.`, `${valor}: código fuera de la lista oficial — elija otro.`)
            : `${L("Escolhido", "Selected", "Elegido")}: ${valor}${tituloOk ? ` — ${tituloOk}` : ""}`}
        </p>
      )}
      {semLista && <p className="text-xs mt-1" style={{ color: claro ? "#9a3412" : "#fbbf24" }}>{L("A lista oficial ainda não está disponível: digite o código de 6 dígitos.", "The official list is not available yet: type the 6-digit code.", "La lista oficial aún no está disponible: escriba el código de 6 dígitos.")}</p>}
      {lista.length > 0 && (
        <div className="mt-1 rounded-xl overflow-hidden max-h-64 overflow-y-auto" style={{ border: `1px solid ${claro ? "rgba(16,27,61,0.25)" : "rgba(46,204,155,0.35)"}` }} role="listbox">
          {lista.map((a) => (
            <button key={`${a.codigo}|${a.titulo}`} type="button" role="option" aria-selected={a.codigo === valor}
              onClick={() => { onChange(a.codigo, a.ocupacao); setTexto(""); setAchados([]); }}
              className="w-full text-left px-3 py-2 text-sm hover:opacity-80" style={{ background: claro ? "rgba(246,247,196,0.6)" : "rgba(15,23,42,0.6)", color: "var(--axi-text-primary)", borderBottom: "1px solid rgba(128,128,128,0.15)" }}>
              <span className="font-bold" style={{ color: cor }}>{a.codigo}</span> — {a.titulo}{a.titulo !== a.ocupacao && <span style={{ opacity: 0.75 }}> ({a.ocupacao})</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditorCompetencias({ valor, onChange, lang, estilo, cor }: { valor: Competencia[]; onChange: (v: Competencia[]) => void; lang: Lang; estilo: CSSProperties; cor: string }) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const muda = (i: number, p: Partial<Competencia>) => onChange(valor.map((c, j) => (j === i ? { ...c, ...p } : c)));
  return (
    <div className="space-y-2">
      {valor.map((c, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <input aria-label={L("Competência", "Skill", "Competencia")} value={c.nome} onChange={(e) => muda(i, { nome: e.target.value })} placeholder={L("Ex.: Atendimento ao cliente", "E.g. Customer service", "Ej.: Atención al cliente")} className="col-span-12 md:col-span-5 px-3 py-2 rounded-lg text-sm" style={estilo} />
          <select aria-label={L("Tipo", "Type", "Tipo")} value={c.tipo} onChange={(e) => muda(i, { tipo: e.target.value as Competencia["tipo"] })} className="col-span-5 md:col-span-3 px-2 py-2 rounded-lg text-sm" style={estilo}>
            <option value="tecnica">{L("Técnica", "Technical", "Técnica")}</option>
            <option value="comportamental">{L("Comportamental", "Behavioral", "Conductual")}</option>
          </select>
          <select aria-label={L("Nível", "Level", "Nivel")} value={c.nivel ?? ""} onChange={(e) => muda(i, { nivel: e.target.value ? Number(e.target.value) : undefined })} className="col-span-3 md:col-span-2 px-2 py-2 rounded-lg text-sm" style={estilo}>
            <option value="">{L("Nível", "Level", "Nivel")}</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <label className="col-span-3 md:col-span-1 flex items-center gap-1 text-xs" style={{ color: "var(--axi-text-primary)" }}>
            <input type="checkbox" checked={c.obrigatoria} onChange={(e) => muda(i, { obrigatoria: e.target.checked })} /> {L("Obrig.", "Req.", "Oblig.")}
          </label>
          <button aria-label={L("Remover", "Remove", "Quitar")} onClick={() => onChange(valor.filter((_, j) => j !== i))} className="col-span-1 justify-self-end" style={{ color: "#ef4444" }}><Trash2 size={15} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...valor, { nome: "", tipo: "tecnica", obrigatoria: true }])} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: cor, color: "#fff" }}>
        <Plus size={13} /> {L("Adicionar competência", "Add skill", "Agregar competencia")}
      </button>
    </div>
  );
}

// Acessos do RH: só Proprietário, CEO, Sócio e Admin abrem. Eles têm acesso total e liberam os demais,
// item por item. A trava de verdade está no banco (rh_pode + RLS de rh_permissoes): ninguém libera para si.
type Membro = { user_id: string; nome: string; email: string; papel: string; nivel: number; situacao: string };
type Perm = { ver: boolean; editar: boolean; ver_pessoais: boolean; ver_salario: boolean; ver_saude: boolean };
const ITENS_PERM: { k: keyof Perm; r: Texto; ajuda: Texto }[] = [
  { k: "ver", r: T("Ver o RH", "View HR", "Ver RR. HH."), ajuda: T("Abre o RH: Painel, lista de colaboradores (nome, cargo, departamento, contrato) e Estrutura. Sem os itens abaixo, não vê CPF, endereço, salário nem exames. Tirar o \"Ver\" tira todos os outros.", "Opens HR: Panel, employee list (name, job, department, contract) and Structure. Without the items below, no CPF, address, salary or exams. Removing \"View\" removes all others.", "Abre RR. HH.: Panel, lista de colaboradores (nombre, cargo, departamento, contrato) y Estructura. Sin los ítems de abajo, no ve CPF, dirección, salario ni exámenes. Quitar \"Ver\" quita todos los demás.") },
  { k: "editar", r: T("Editar", "Edit", "Editar"), ajuda: T("Cadastra e altera colaboradores, contratos, documentos e a Estrutura. Mandar para a lixeira continua pedindo a autorização de um supervisor. Tudo fica no Histórico de alterações.", "Creates and changes employees, contracts, documents and Structure. Moving to trash still requires a supervisor's authorization. Everything goes to the Change history.", "Registra y cambia colaboradores, contratos, documentos y la Estructura. Enviar a la papelera sigue pidiendo autorización de un supervisor. Todo queda en el Historial de cambios.") },
  { k: "ver_pessoais", r: T("Dados pessoais", "Personal data", "Datos personales"), ajuda: T("CPF, nascimento, endereço, contatos e os documentos da admissão (com os arquivos). A LGPD (Lei nº 13.709/2018, art. 6º) manda liberar só a quem precisa para o trabalho.", "CPF, birth date, address, contacts and hiring documents (with files). Brazil's LGPD (Law 13.709/2018, art. 6) requires granting only to those who need it for their work.", "CPF, nacimiento, dirección, contactos y los documentos de admisión (con archivos). La LGPD (Ley 13.709/2018, art. 6) exige habilitar solo a quien lo necesita para su trabajo.") },
  { k: "ver_salario", r: T("Salário", "Salary", "Salario"), ajuda: T("Salário de cada pessoa, histórico de reajustes e a soma dos salários-base. É dado pessoal protegido pela LGPD — libere só para quem cuida da folha.", "Each person's salary, raise history and total base salaries. It is personal data protected by the LGPD — grant only to those who handle payroll.", "Salario de cada persona, historial de reajustes y suma de salarios base. Es dato personal protegido por la LGPD — habilite solo a quien gestiona la nómina.") },
  { k: "ver_saude", r: T("Saúde", "Health", "Salud"), ajuda: T("Exames da admissão (ASO e complementares) com os arquivos. Dado de saúde é dado pessoal SENSÍVEL (LGPD, art. 5º, II, e art. 11): só quem cuida da medicina do trabalho (NR-7) deve ver.", "Hiring exams (ASO and others) with files. Health data is SENSITIVE personal data (LGPD, art. 5, II, and art. 11): only those handling occupational health (NR-7) should see it.", "Exámenes de admisión (ASO y complementarios) con archivos. El dato de salud es dato personal SENSIBLE (LGPD, art. 5, II, y art. 11): solo quien gestiona la medicina laboral (NR-7) debe verlo.") },
];
function AcessosRh({ empresaId, lang, temaClaro, cartaoTema, TEXTO_SEC, BORDA, avisar }: {
  empresaId: string; lang: Lang; temaClaro: boolean; cartaoTema: { fundo?: string; premium3d: boolean }; estilo: CSSProperties; TEXTO_SEC: string; BORDA: string; avisar: (m: string, t?: "erro" | "ok") => void;
}) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [membros, setMembros] = useState<Membro[] | null>(null);
  const [perms, setPerms] = useState<Record<string, Perm>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const vazio: Perm = { ver: false, editar: false, ver_pessoais: false, ver_salario: false, ver_saude: false };
  useEffect(() => {
    void (async () => {
      const [eq, pr] = await Promise.all([
        listarEquipe(empresaId),
        supabase.from("rh_permissoes").select("user_id, ver, editar, ver_pessoais, ver_salario, ver_saude").eq("empresa_id", empresaId),
      ]);
      if (eq.erro || pr.error) { avisar(L("Não foi possível carregar a equipe agora. Recarregue a página.", "Could not load the team now. Reload the page.", "No se pudo cargar el equipo ahora. Recargue la página.")); setMembros([]); return; }
      setMembros((eq.dados as unknown as Membro[]).filter((m) => m.user_id && m.situacao !== "pendente"));
      setPerms(Object.fromEntries((pr.data ?? []).map((x: Linha) => [x.user_id, x as Perm])));
    })();
  }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps
  async function mudar(uid: string, k: keyof Perm, valor: boolean) {
    const atual: Perm = { ...(perms[uid] ?? vazio), [k]: valor };
    if (k !== "ver" && valor) atual.ver = true;                 // quem vê salário/saúde/dados também vê o RH
    if (k === "ver" && !valor) Object.assign(atual, vazio);     // tirou "ver": tira tudo
    setSalvando(uid);
    const { error } = await supabase.from("rh_permissoes").upsert({ empresa_id: empresaId, user_id: uid, ...atual }, { onConflict: "empresa_id,user_id" });
    setSalvando(null);
    if (error) { avisar(mensagemErroRh(error, lang)); return; }
    setPerms({ ...perms, [uid]: atual });
    avisar(L("Acesso atualizado.", "Access updated.", "Acceso actualizado."), "ok");
  }
  const papelTxt = (m: Membro) => m.nivel === 1 ? L("Proprietário", "Owner", "Propietario") : m.nivel === 2 ? "CEO" : m.nivel === 3 ? L("Sócio", "Partner", "Socio") : m.nivel === 4 ? "Admin" : m.papel;
  return (
    <CanvasBox cor={temaClaro ? "#0f7a5a" : "#2ecc9b"} {...cartaoTema}>
      <p className="text-sm font-black mb-1" style={{ color: temaClaro ? "#101b3d" : "var(--axi-text-primary)", ...FONTE_EXEC }}>{L("Acessos do RH", "HR access", "Accesos de RR. HH.")}</p>
      <p className="text-sm mb-4" style={{ color: TEXTO_SEC }}>{L("Proprietário, CEO, Sócio e Admin têm acesso total e são os únicos que liberam. As demais pessoas não veem nada do RH até serem liberadas aqui. Dados pessoais, salário e saúde são liberados um a um (LGPD). Ninguém libera para si mesmo.", "Owner, CEO, Partner and Admin have full access and are the only ones who grant it. Others see nothing in HR until granted here. Personal data, salary and health are granted one by one (LGPD). Nobody can grant themselves.", "Propietario, CEO, Socio y Admin tienen acceso total y son los únicos que lo otorgan. Los demás no ven nada de RR. HH. hasta ser habilitados aquí. Datos personales, salario y salud se habilitan uno por uno (LGPD). Nadie se habilita a sí mismo.")}</p>
      {membros === null ? (
        <div className="flex justify-center py-8"><div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : membros.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: TEXTO_SEC }}>{L("Ninguém na equipe ainda. Convide pessoas em Equipe.", "No one on the team yet. Invite people in Team.", "Nadie en el equipo aún. Invite personas en Equipo.")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead><tr style={{ borderBottom: `1px solid ${BORDA}` }}>
              <th className="text-left px-3 py-3 text-xs font-semibold tracking-wider uppercase" style={{ color: TEXTO_SEC }}>{L("Pessoa", "Person", "Persona")}</th>
              {ITENS_PERM.map((i) => (
                <th key={i.k} className="text-left px-3 py-3 text-xs font-semibold tracking-wider uppercase" style={{ color: TEXTO_SEC }}>
                  <button onClick={() => setInfo({ titulo: i.r[lang], linhas: [i.ajuda[lang]] })} className="inline-flex items-center gap-1.5 uppercase hover:opacity-80" style={{ color: TEXTO_SEC }}>{i.r[lang]} <InfoIcon size={13} style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }} /></button>
                </th>
              ))}
            </tr></thead>
            <tbody>
              {membros.map((m) => {
                const total = m.nivel <= 4;
                const p = perms[m.user_id] ?? vazio;
                return (
                  <tr key={m.user_id} style={{ borderBottom: `1px solid ${BORDA}` }}>
                    <td className="px-3 py-3 text-sm">
                      <p className="font-bold" style={{ color: "var(--axi-text-primary)" }}>{m.nome || m.email}</p>
                      <p className="text-xs" style={{ color: TEXTO_SEC }}>{papelTxt(m)}{m.situacao === "suspenso" ? ` · ${L("suspenso", "suspended", "suspendido")}` : ""}</p>
                    </td>
                    {total ? (
                      <td colSpan={ITENS_PERM.length} className="px-3 py-3 text-sm font-bold" style={{ color: temaClaro ? "#0f7a5a" : "#2ecc9b" }}>{L("Acesso total ao RH", "Full HR access", "Acceso total a RR. HH.")}</td>
                    ) : ITENS_PERM.map((i) => (
                      <td key={i.k} className="px-3 py-3">
                        <input type="checkbox" aria-label={`${i.r[lang]} — ${m.nome || m.email}`} checked={!!p[i.k]} disabled={salvando === m.user_id}
                          onChange={(e) => mudar(m.user_id, i.k, e.target.checked)} style={{ width: 18, height: 18, accentColor: temaClaro ? "#0f7a5a" : "#2ecc9b" }} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <CardInfo info={info} onFechar={() => setInfo(null)} temaClaro={temaClaro} lang={lang} />
      <p className="text-xs mt-3" style={{ color: TEXTO_SEC }}>{L("Toque no nome de cada liberação para ver o que ela abre. Cada liberação fica registrada com quem liberou e quando.", "Each grant is recorded with who granted it and when.", "Cada habilitación queda registrada con quién la otorgó y cuándo.")}</p>
    </CanvasBox>
  );
}

// Verbas da empresa para a rescisão (S-1010). As 15 padrão do Axioma entram em rascunho: o contador confere as incidências
// (INSS, IR, FGTS) antes do primeiro envio. Elas precisam estar no eSocial antes do primeiro desligamento (S-2299).
const SIT_VERBA: Record<string, [string, string, string]> = {
  rascunho: ["Rascunho — conferir com o contador", "Draft — check with the accountant", "Borrador — revisar con el contador"],
  preparado: ["Arquivo preparado — falta o contador enviar", "File prepared — waiting for the accountant", "Archivo preparado — falta que el contador lo envíe"],
  enviado: ["Enviado", "Sent", "Enviado"], enviado_pelo_contador: ["Enviado pelo contador", "Sent by the accountant", "Enviado por el contador"],
  aceito: ["Aceito pelo eSocial", "Accepted by eSocial", "Aceptado por eSocial"], recusado: ["Recusado — corrigir e preparar de novo", "Rejected — fix and prepare again", "Rechazado — corregir y preparar de nuevo"],
};
function baixarXmlVerba(nome: string, xml: string) {
  const url = URL.createObjectURL(new Blob([xml], { type: "application/xml;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function VerbasEsocial({ empresaId, lang, temaClaro, cartaoTema, TEXTO_SEC, BORDA, podeEditar, avisar }: {
  empresaId: string; lang: Lang; temaClaro: boolean; cartaoTema: { fundo?: string; premium3d: boolean }; TEXTO_SEC: string; BORDA: string; podeEditar: boolean; avisar: (m: string, t?: "erro" | "ok") => void;
}) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const i = lang === "en" ? 1 : lang === "es" ? 2 : 0;
  const [lista, setLista] = useState<Linha[] | null>(null);
  const [emp, setEmp] = useState<Linha | null>(null);
  const [recibos, setRecibos] = useState<Record<string, string>>({});
  async function carregar() {
    const [r, e] = await Promise.all([
      supabase.from("rh_rubricas").select("*").eq("empresa_id", empresaId).is("excluido_em", null).order("cod_rubr"),
      supabase.from("rh_empregador").select("tp_insc, nr_insc").eq("empresa_id", empresaId).is("excluido_em", null).order("ini_valid", { ascending: false }).limit(1),
    ]);
    if (r.error || e.error) { avisar(L("Não foi possível ler as verbas agora. Recarregue a página.", "Could not read the pay items now. Reload the page.", "No se pudieron leer las rubricas ahora. Recargue la página.")); setLista([]); return; }
    setLista(r.data ?? []); setEmp((e.data ?? [])[0] ?? null);
  }
  useEffect(() => { void carregar(); }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps
  async function cadastrarPadrao(): Promise<boolean> {
    const { data, error } = await supabase.rpc("rh_rubricas_padrao", { p_empresa: empresaId });
    if (error) { avisar(mensagemErroRh(error, lang)); return false; }
    avisar(L(`${data ?? 0} verba(s) padrão cadastrada(s). Confira com o contador antes de enviar.`, `${data ?? 0} default pay item(s) registered. Check with the accountant before sending.`, `${data ?? 0} rubrica(s) estándar registrada(s). Revise con el contador antes de enviar.`), "ok");
    await carregar(); return true;
  }
  async function preparar(alvo: Linha[]): Promise<boolean> {
    if (!emp) { avisar(L("Cadastre o Empregador antes (aba Empregador).", "Register the Employer first (Employer tab).", "Registre el Empleador primero (pestaña Empleador).")); return false; }
    const agora = new Date(); let n = 0;
    for (const [k, r] of alvo.entries()) {
      const { id, xml } = gerarS1010({ tp_insc: emp.tp_insc, nr_insc: emp.nr_insc }, r as Rubrica, { agora, seq: k + 1, tpAmb: 1 });
      const r1 = await supabase.from("rh_esocial_eventos").insert({ empresa_id: empresaId, rubrica_id: r.id, contrato_id: null, evento: "S-1010", id_evento: id, versao_leiaute: VERSAO_LEIAUTE, xml }).select("id").single();
      if (r1.error) { avisar(mensagemErroRh(r1.error, lang)); break; }
      const r2 = await supabase.from("rh_rubricas").update({ situacao_esocial: "preparado" }).eq("id", r.id).select("id");
      if (r2.error || !r2.data?.length) { avisar(mensagemErroRh(r2.error, lang)); break; }
      baixarXmlVerba(`S-1010-${r.cod_rubr}-${id}.xml`, xml); n++;
      await new Promise((ok) => setTimeout(ok, 350)); // o navegador baixa um de cada vez
    }
    if (n) avisar(L(`${n} arquivo(s) do S-1010 preparado(s) e baixado(s). Entregue ao contador.`, `${n} S-1010 file(s) prepared and downloaded. Give them to the accountant.`, `${n} archivo(s) S-1010 preparado(s) y descargado(s). Entréguelos al contador.`), "ok");
    await carregar(); return n > 0;
  }
  async function marcar(r: Linha, nova: "enviado_pelo_contador" | "aceito" | "recusado"): Promise<boolean> {
    const rec = (recibos[r.id] ?? "").trim();
    if (nova === "aceito" && !/^[0-9.]{10,40}$/.test(rec)) { avisar(L("Informe o número do recibo (só números e pontos).", "Enter the receipt number (digits and dots only).", "Informe el número de recibo (solo números y puntos).")); return false; }
    const { data, error } = await supabase.from("rh_rubricas").update({ situacao_esocial: nova, ...(nova === "aceito" ? { recibo_esocial: rec } : {}) }).eq("id", r.id).select("id");
    if (error || !data?.length) { avisar(mensagemErroRh(error, lang)); return false; }
    await carregar(); return true;
  }
  const rascunhos = (lista ?? []).filter((r) => ["rascunho", "recusado"].includes(r.situacao_esocial));
  const MENTA = "linear-gradient(135deg, #0b5f46, #0f7a5a)", AZUL = "linear-gradient(135deg, #0a1628, #101b3d)";
  const titulo = temaClaro ? "#101b3d" : "var(--axi-text-primary)";
  const campo: CSSProperties = { background: temaClaro ? "#ffffff" : "rgba(10,22,40,0.9)", border: `1px solid ${BORDA}`, color: "var(--axi-text-primary)" };
  return (
    <CanvasBox cor={temaClaro ? "#0f7a5a" : "#2ecc9b"} {...cartaoTema}>
      <p className="text-sm font-black mb-1" style={{ color: titulo, ...FONTE_EXEC }}>{L("Verbas da rescisão (S-1010)", "Termination pay items (S-1010)", "Rubricas de la rescisión (S-1010)")}</p>
      <p className="text-sm mb-3" style={{ color: TEXTO_SEC }}>{L("São as verbas que o Axioma usa no cálculo da rescisão (saldo, aviso, 13º, férias, INSS, IR…). Precisam estar no eSocial antes do primeiro desligamento. As incidências de INSS, IR e FGTS são o padrão do Axioma pela lei — confira com o contador antes de enviar.", "These are the pay items Axioma uses in the termination calculation (balance, notice, 13th, vacation, INSS, income tax…). They must be in eSocial before the first termination. The INSS, income tax and FGTS incidences are Axioma's legal default — check with the accountant before sending.", "Son las rubricas que Axioma usa en el cálculo de la rescisión (saldo, aviso, 13º, vacaciones, INSS, IR…). Deben estar en eSocial antes de la primera desvinculación. Las incidencias de INSS, IR y FGTS son el estándar legal de Axioma — revíselas con el contador antes de enviar.")}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {podeEditar && <BotaoAcao executar={cadastrarPadrao} texto={L("Cadastrar as verbas padrão", "Register the default pay items", "Registrar las rubricas estándar")} textoTrabalhando="…" className="px-4 py-2.5 rounded-xl text-sm" estilo={{ background: MENTA, color: "#fff" }} />}
        {podeEditar && rascunhos.length > 0 && <BotaoAcao executar={() => preparar(rascunhos)} texto={L(`Preparar S-1010 (${rascunhos.length}) e baixar`, `Prepare S-1010 (${rascunhos.length}) and download`, `Preparar S-1010 (${rascunhos.length}) y descargar`)} textoTrabalhando={L("Preparando…", "Preparing…", "Preparando…")} className="px-4 py-2.5 rounded-xl text-sm" estilo={{ background: AZUL, color: "#fff" }} />}
      </div>
      {lista === null ? <p className="text-sm" style={{ color: TEXTO_SEC }}>{L("Carregando…", "Loading…", "Cargando…")}</p> : lista.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: TEXTO_SEC }}>{L("Nenhuma verba cadastrada. Toque em \"Cadastrar as verbas padrão\".", "No pay items yet. Tap \"Register the default pay items\".", "Ninguna rubrica registrada. Toque \"Registrar las rubricas estándar\".")}</p>
      ) : (
        <ul className="space-y-2">
          {lista.map((r) => (
            <li key={r.id} className="rounded-xl px-3 py-2 text-sm" style={{ border: `1px solid ${BORDA}`, color: "var(--axi-text-primary)" }}>
              <div className="flex flex-wrap justify-between gap-2">
                <span><b>{r.cod_rubr}</b> — {r.dsc_rubr} <span style={{ color: TEXTO_SEC }}>· {L("natureza", "nature", "naturaleza")} {r.nat_rubr} · INSS {r.cod_inc_cp} · IR {r.cod_inc_irrf} · FGTS {r.cod_inc_fgts}</span></span>
                <span className="font-semibold" style={{ color: r.situacao_esocial === "aceito" ? (temaClaro ? "#0f7a5a" : "#2ecc9b") : r.situacao_esocial === "recusado" ? "#ef4444" : (temaClaro ? "#9a3412" : "#fbbf24") }}>{(SIT_VERBA[r.situacao_esocial] ?? [r.situacao_esocial, r.situacao_esocial, r.situacao_esocial])[i]}{r.recibo_esocial ? ` · ${r.recibo_esocial}` : ""}</span>
              </div>
              {podeEditar && ["preparado", "enviado_pelo_contador"].includes(r.situacao_esocial) && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <input value={recibos[r.id] ?? ""} onChange={(e) => setRecibos((x) => ({ ...x, [r.id]: e.target.value }))} aria-label={L("Número do recibo", "Receipt number", "Número de recibo")} placeholder={L("Recibo", "Receipt", "Recibo")} inputMode="decimal" className="px-2 py-1.5 rounded-lg text-xs focus:outline-none w-48" style={campo} />
                  <BotaoAcao executar={() => marcar(r, "aceito")} texto={L("Aceito", "Accepted", "Aceptado")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={{ background: MENTA, color: "#fff" }} />
                  {r.situacao_esocial === "preparado" && <BotaoAcao executar={() => marcar(r, "enviado_pelo_contador")} texto={L("Enviado", "Sent", "Enviado")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={{ background: AZUL, color: "#fff" }} />}
                  <BotaoAcao executar={() => marcar(r, "recusado")} texto={L("Recusado", "Rejected", "Rechazado")} textoTrabalhando="…" className="px-3 py-1.5 rounded-lg text-xs" estilo={{ background: AZUL, color: "#fff" }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </CanvasBox>
  );
}
