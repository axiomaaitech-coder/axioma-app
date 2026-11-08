// RH · Documentos e exames da admissão (2026-11-08). Lista única usada pela tela, pelo banco (RH-8) e pelo teste.
// Só entra o que tem base legal ou é prática usual de admissão; o que a lei PROÍBE pedir fica em PROIBIDOS
// (aparece como aviso na tela e não existe como tipo no banco). Base conferida em 08/11/2026:
//  · Lei 9.029/1995, art. 2º, I (Planalto): exigir teste/atestado de gravidez ou esterilização é crime.
//  · Ministério da Saúde (gov.br/aids, "Direitos das PVHIV"): teste de HIV não pode ser exigido em exame do trabalho.
//  · NR-7: exame clínico admissional antes de o empregado assumir as atividades; complementares conforme PGR/PCMSO;
//    custeio da empresa. · Lei 8.213/1991, art. 67: salário-família com vacinação e frequência escolar dos filhos.
//  · CLT art. 168 § 6º (Lei 13.103/2015): exame toxicológico de motorista profissional na admissão.
export type Texto = { pt: string; en: string; es: string }
export type ItemAdmissao = { tipo: string; categoria: 'documento' | 'exame'; nome: Texto; quando: Texto; obrigatorio: boolean }
const T = (pt: string, en: string, es: string): Texto => ({ pt, en, es })
const SEMPRE = T('Toda admissão', 'Every hire', 'Toda admisión')

export const ITENS_ADMISSAO: ItemAdmissao[] = [
  // ─── documentos (protegidos como dado pessoal) ───
  { tipo: 'ctps_digital', categoria: 'documento', obrigatorio: true, nome: T('Carteira de Trabalho Digital (consulta pelo CPF)', 'Digital Work Card (lookup by CPF)', 'Cartera de Trabajo Digital (consulta por CPF)'), quando: SEMPRE },
  { tipo: 'documento_identidade', categoria: 'documento', obrigatorio: true, nome: T('Documento de identidade com foto (RG ou CNH)', 'Photo ID (RG or driver\'s licence)', 'Documento de identidad con foto (RG o CNH)'), quando: SEMPRE },
  { tipo: 'cpf', categoria: 'documento', obrigatorio: true, nome: T('CPF', 'CPF', 'CPF'), quando: SEMPRE },
  { tipo: 'comprovante_residencia', categoria: 'documento', obrigatorio: false, nome: T('Comprovante de residência', 'Proof of address', 'Comprobante de domicilio'), quando: T('Usual (endereço vai ao eSocial e ao vale-transporte)', 'Usual (address goes to eSocial and transport voucher)', 'Usual (la dirección va al eSocial y al vale-transporte)') },
  { tipo: 'titulo_eleitor', categoria: 'documento', obrigatorio: false, nome: T('Título de eleitor', 'Voter ID', 'Título de elector'), quando: T('Maiores de 18 anos', 'Over 18', 'Mayores de 18 años') },
  { tipo: 'reservista', categoria: 'documento', obrigatorio: false, nome: T('Certificado de reservista', 'Military service certificate', 'Certificado de reservista'), quando: T('Homens, quando aplicável', 'Men, when applicable', 'Hombres, cuando aplica') },
  { tipo: 'certidao_civil', categoria: 'documento', obrigatorio: false, nome: T('Certidão de nascimento ou casamento', 'Birth or marriage certificate', 'Certificado de nacimiento o matrimonio'), quando: T('Usual', 'Usual', 'Usual') },
  { tipo: 'comprovante_escolaridade', categoria: 'documento', obrigatorio: false, nome: T('Comprovante de escolaridade', 'Proof of education', 'Comprobante de escolaridad'), quando: T('Quando o cargo exige formação', 'When the job requires education', 'Cuando el cargo exige formación') },
  { tipo: 'certidao_filhos', categoria: 'documento', obrigatorio: false, nome: T('Certidão de nascimento dos filhos', 'Children\'s birth certificates', 'Certificado de nacimiento de los hijos'), quando: T('Dependentes (salário-família, IR, plano)', 'Dependents (family allowance, tax, health plan)', 'Dependientes (salario familiar, IR, plan)') },
  { tipo: 'vacinacao_filhos', categoria: 'documento', obrigatorio: false, nome: T('Atestado de vacinação dos filhos', 'Children\'s vaccination record', 'Certificado de vacunación de los hijos'), quando: T('Salário-família (Lei 8.213, art. 67)', 'Family allowance (Law 8.213, art. 67)', 'Salario familiar (Ley 8.213, art. 67)') },
  { tipo: 'frequencia_escolar_filhos', categoria: 'documento', obrigatorio: false, nome: T('Comprovante de frequência escolar dos filhos', 'Children\'s school attendance', 'Comprobante de asistencia escolar de los hijos'), quando: T('Salário-família (Lei 8.213, art. 67)', 'Family allowance (Law 8.213, art. 67)', 'Salario familiar (Ley 8.213, art. 67)') },
  { tipo: 'declaracao_dependentes_ir', categoria: 'documento', obrigatorio: false, nome: T('Declaração de dependentes para o Imposto de Renda', 'Income tax dependents declaration', 'Declaración de dependientes para el Impuesto a la Renta'), quando: T('Se houver dependentes', 'If there are dependents', 'Si hay dependientes') },
  { tipo: 'opcao_vale_transporte', categoria: 'documento', obrigatorio: false, nome: T('Opção pelo vale-transporte (endereço e trajeto)', 'Transport voucher choice (address and route)', 'Opción por vale-transporte (dirección y trayecto)'), quando: T('Se for usar vale-transporte', 'If using transport voucher', 'Si usará vale-transporte') },
  { tipo: 'dados_bancarios', categoria: 'documento', obrigatorio: false, nome: T('Dados bancários para pagamento', 'Bank details for payment', 'Datos bancarios para el pago'), quando: SEMPRE },
  { tipo: 'cnh_profissional', categoria: 'documento', obrigatorio: false, nome: T('CNH da categoria exigida', 'Required licence category', 'CNH de la categoría exigida'), quando: T('Motoristas', 'Drivers', 'Conductores') },
  { tipo: 'registro_profissional', categoria: 'documento', obrigatorio: false, nome: T('Registro no conselho profissional (CRC, CREA, COREN…)', 'Professional council registration (CRC, CREA, COREN…)', 'Registro en consejo profesional (CRC, CREA, COREN…)'), quando: T('Profissões regulamentadas', 'Regulated professions', 'Profesiones reguladas') },
  { tipo: 'contrato_assinado', categoria: 'documento', obrigatorio: true, nome: T('Contrato de trabalho assinado', 'Signed employment contract', 'Contrato de trabajo firmado'), quando: SEMPRE },
  { tipo: 'ciencia_lgpd', categoria: 'documento', obrigatorio: true, nome: T('Ciência do tratamento de dados (LGPD)', 'Data processing notice (LGPD)', 'Aviso de tratamiento de datos (LGPD)'), quando: SEMPRE },
  // ─── exames (dado de saúde: só quem tem liberação de saúde) ───
  { tipo: 'aso_admissional', categoria: 'exame', obrigatorio: true, nome: T('Exame admissional (ASO)', 'Pre-employment exam (ASO)', 'Examen de admisión (ASO)'), quando: T('Antes de começar a trabalhar (NR-7), pago pela empresa', 'Before starting work (NR-7), paid by the company', 'Antes de empezar a trabajar (NR-7), pagado por la empresa') },
  { tipo: 'audiometria', categoria: 'exame', obrigatorio: false, nome: T('Audiometria', 'Audiometry', 'Audiometría'), quando: T('Exposição a ruído, conforme PCMSO', 'Noise exposure, per PCMSO', 'Exposición a ruido, según PCMSO') },
  { tipo: 'espirometria', categoria: 'exame', obrigatorio: false, nome: T('Espirometria', 'Spirometry', 'Espirometría'), quando: T('Poeiras e agentes respiratórios, conforme PCMSO', 'Dust and respiratory agents, per PCMSO', 'Polvos y agentes respiratorios, según PCMSO') },
  { tipo: 'raio_x_torax', categoria: 'exame', obrigatorio: false, nome: T('Raio-X de tórax', 'Chest X-ray', 'Radiografía de tórax'), quando: T('Conforme PCMSO', 'Per PCMSO', 'Según PCMSO') },
  { tipo: 'acuidade_visual', categoria: 'exame', obrigatorio: false, nome: T('Acuidade visual', 'Visual acuity', 'Agudeza visual'), quando: T('Conforme PCMSO (ex.: motoristas, telas)', 'Per PCMSO (e.g. drivers, screens)', 'Según PCMSO (ej.: conductores, pantallas)') },
  { tipo: 'hemograma', categoria: 'exame', obrigatorio: false, nome: T('Hemograma e exames de sangue', 'Blood count and blood tests', 'Hemograma y análisis de sangre'), quando: T('Conforme PCMSO (ex.: benzeno, chumbo)', 'Per PCMSO (e.g. benzene, lead)', 'Según PCMSO (ej.: benceno, plomo)') },
  { tipo: 'eletrocardiograma', categoria: 'exame', obrigatorio: false, nome: T('Eletrocardiograma', 'Electrocardiogram', 'Electrocardiograma'), quando: T('Conforme PCMSO (ex.: trabalho em altura)', 'Per PCMSO (e.g. work at height)', 'Según PCMSO (ej.: trabajo en altura)') },
  { tipo: 'eletroencefalograma', categoria: 'exame', obrigatorio: false, nome: T('Eletroencefalograma', 'Electroencephalogram', 'Electroencefalograma'), quando: T('Conforme PCMSO (ex.: trabalho em altura, eletricidade)', 'Per PCMSO (e.g. height, electricity)', 'Según PCMSO (ej.: altura, electricidad)') },
  { tipo: 'toxicologico', categoria: 'exame', obrigatorio: false, nome: T('Exame toxicológico', 'Toxicology test', 'Examen toxicológico'), quando: T('Motorista profissional (CLT art. 168 § 6º)', 'Professional driver (CLT art. 168 § 6)', 'Conductor profesional (CLT art. 168 § 6)') },
  { tipo: 'outro_exame_pcmso', categoria: 'exame', obrigatorio: false, nome: T('Outro exame previsto no PCMSO', 'Other exam in the PCMSO', 'Otro examen previsto en el PCMSO'), quando: T('Conforme PCMSO', 'Per PCMSO', 'Según PCMSO') },
]
export const TIPOS_ADMISSAO = ITENS_ADMISSAO.map((i) => i.tipo)

// O que a lei proíbe pedir: aviso fixo na tela, nunca um tipo que se possa marcar.
export const PROIBIDOS: Texto[] = [
  T('Teste ou atestado de gravidez ou de esterilização — crime (Lei 9.029/1995, art. 2º)', 'Pregnancy or sterilization test or certificate — a crime (Law 9.029/1995, art. 2)', 'Prueba o certificado de embarazo o esterilización — delito (Ley 9.029/1995, art. 2)'),
  T('Teste de HIV em exame do trabalho (Ministério da Saúde)', 'HIV testing in work exams (Ministry of Health)', 'Prueba de VIH en exámenes laborales (Ministerio de Salud)'),
  T('Qualquer exigência ligada a sexo, raça, cor, estado civil, situação familiar, deficiência ou idade (Lei 9.029/1995, art. 1º)', 'Any requirement tied to sex, race, color, marital status, family situation, disability or age (Law 9.029/1995, art. 1)', 'Cualquier exigencia vinculada a sexo, raza, color, estado civil, situación familiar, discapacidad o edad (Ley 9.029/1995, art. 1)'),
]
