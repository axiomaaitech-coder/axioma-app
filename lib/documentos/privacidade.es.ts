// Fuente única: genera el PDF (scripts/gerar-pdf.cjs) y la página del sitio.
// Traducción al español de privacidade.pt.ts — prevalece la versión en portugués.
import type { DocumentoAxioma } from "./tipos"

const doc: DocumentoAxioma = {
  arquivo: 'Axioma - Política de Privacidad y Protección de Datos.docx',
  titulo: 'Política de Privacidad',
  subtitulo: 'Cómo Axioma AI.Tech trata y protege datos personales y datos de empresas, según la LGPD (Ley brasileña nº 13.709/2018)',
  info: ['Versión 1.0  •  Vigencia a partir de [[FECHA DE VIGENCIA]]', 'Esta Política forma parte de los Términos de Uso de Axioma.', 'Esta es una traducción ofrecida por conveniencia. En caso de divergencia, prevalece la versión en portugués.'],
  blocos: [
    { h1: 'Presentación' },
    { p: 'La privacidad no es un detalle para Axioma: es parte del producto. Esta Política fue escrita para que cualquier persona — el dueño de la empresa, un empleado invitado o un cliente cuyos datos fueron registrados por una empresa — entienda con claridad lo que sucede con su información.' },
    { h2: 'Resumen en lenguaje sencillo' },
    { tabela: { colunas: ['Pregunta', 'Respuesta corta'], larguras: [3000, 6026], linhas: [
      ['¿Qué datos tienen?', 'Los de su cuenta, los que su empresa registra en la plataforma y datos técnicos de acceso (sección 3).'],
      ['¿Para qué los usan?', 'Solo para prestar el servicio, mantener la seguridad y cumplir la ley (sección 4).'],
      ['¿Venden mis datos?', 'No. Y no los usamos para entrenar inteligencias artificiales de terceros (sección 4).'],
      ['¿La IA ve mis datos?', 'Solo lo necesario para responder la pregunta hecha, mediante proveedores contratados que no pueden usar esos datos para entrenar modelos (sección 5).'],
      ['¿Con quién los comparten?', 'Solo con proveedores esenciales (alojamiento, base de datos, IA, pagos, e-mail), bajo contrato (sección 6).'],
      ['¿Por cuánto tiempo los guardan?', 'Mientras la cuenta exista, y después por los plazos mínimos de la ley (sección 8).'],
      ['¿Cómo los protegen?', 'Cifrado, aislamiento por empresa, control de acceso y auditoría (sección 9).'],
      ['¿Cuáles son mis derechos?', 'Acceder, corregir, eliminar, llevar sus datos a otro servicio y más (sección 10).'],
    ] } },
    { nota: 'Si tiene dudas sobre sus datos, hable con nuestro Encargado de Protección de Datos. Responderle bien es parte de nuestro compromiso.' },
    { h1: '1. Nuestro compromiso' },
    { p: 'Axioma AI.Tech es una plataforma de gestión financiera para empresas. Para funcionar, necesita manejar información sensible para el negocio del Cliente: números financieros, cuentas bancarias, facturas y registros de clientes, proveedores y personas del equipo. Tratamos esa información con el mismo cuidado que nos gustaría que se diera a la nuestra.' },
    { p: 'Esta Política explica, en lenguaje sencillo, qué datos tratamos, por qué, con quién los compartimos, por cuánto tiempo los guardamos, cómo los protegemos y cuáles son sus derechos. Sigue la Ley General de Protección de Datos Personales de Brasil (LGPD — Ley nº 13.709/2018), el Marco Civil de Internet (Ley nº 12.965/2014) y las normas de la Autoridad Nacional de Protección de Datos de Brasil (ANPD).' },

    { h1: '2. Quién es el responsable de los datos' },
    { p: 'Axioma es ofrecido por [[RAZÓN SOCIAL]], CNPJ nº [[CNPJ]], con sede en [[DIRECCIÓN COMPLETA]].' },
    { p: 'La LGPD distingue a quien decide sobre los datos (**responsable**) de quien los trata en nombre de otro (**encargado**). En Axioma funciona así:' },
    { tabela: { colunas: ['Tipo de dato', 'Quién decide (responsable)', 'Rol de Axioma'], larguras: [3600, 2800, 2626], linhas: [
      ['Datos de su cuenta: nombre, e-mail, contraseña, accesos, preferencias', 'Axioma', 'Responsable'],
      ['Datos que su empresa registra: clientes, proveedores, empleados, socios, facturas, extractos, registros', 'La empresa Cliente', 'Encargado (trata solo para prestar el servicio)'],
      ['Término de aceptación de invitación (nombre, CPF, e-mail del invitado)', 'La empresa Cliente que invitó', 'Encargado'],
      ['Datos de pago de la suscripción', 'Axioma (con Stripe)', 'Responsable'],
    ] } },
    { p: '**Encargado del Tratamiento de Datos Personales (DPO):** [[NOMBRE DEL ENCARGADO (DPO)]], e-mail [[E-MAIL DEL ENCARGADO]]. Es el canal para cualquier asunto de privacidad (art. 41 de la LGPD).' },

    { h1: '3. Qué datos tratamos' },
    { h2: '3.1 Datos de registro y cuenta' },
    { lista: ['Nombre, e-mail, contraseña (guardada de forma cifrada e irreversible) e idioma preferido.', 'Empresa vinculada, rol y nivel de acceso en el Equipo, plazo del acceso.', 'Registros de aceptación de los Términos, la Política de Privacidad y las invitaciones, con fecha y hora.'] },
    { h2: '3.2 Datos de la invitación de equipo' },
    { lista: ['Nombre completo y e-mail del invitado; CPF (número de contribuyente brasileño) cuando el acceso sea superior a 30 días o sin plazo (para identificar con seguridad a quien accede a datos financieros de la empresa).', 'Nombre de quien envió la invitación, relación con la empresa, rol, plazo y motivo.'] },
    { h2: '3.3 Datos de la empresa (Datos del Cliente)' },
    { lista: [
      'Datos registrales de la empresa: razón social, CNPJ, CNAE (código de actividad), régimen tributario, dirección, socios.',
      'Registros financieros: ingresos, costos, cuentas por pagar y por cobrar, deudas, metas, inversiones, centros de costo.',
      'Registros de clientes y proveedores, que pueden contener datos personales de terceros (nombre, CPF/CNPJ, contacto, historial de compras y pagos).',
      'Documentos importados: facturas (XML, PDF o foto), extractos (OFX), hojas de cálculo (CSV/XLSX).',
      'Productos, inventario y ventas del PDV.',
    ] },
    { h2: '3.4 Datos bancarios (Open Finance)' },
    { p: 'Cuando el Cliente conecta una cuenta bancaria, recibimos de Pluggy saldos, extractos y transacciones de la cuenta autorizada. **No recibimos ni guardamos contraseñas bancarias.**' },
    { h2: '3.5 Datos técnicos y de uso' },
    { lista: ['Dirección IP, fecha y hora de acceso, tipo de navegador y dispositivo (registros de acceso exigidos por el Marco Civil de Internet).', 'Registros de errores técnicos para corregir fallas.', 'Registro de cada uso de inteligencia artificial (pantalla, tipo de pregunta, modelo usado, costo y si los números fueron verificados), **sin guardar el contenido de la conversación en ese registro de auditoría**.', 'Cookies estrictamente necesarias para mantener la sesión abierta y recordar preferencias como idioma y tema.'] },
    { h2: '3.6 Datos que no pedimos' },
    { p: 'Axioma no fue hecho para tratar datos personales sensibles (como salud, religión, biometría u opinión política) ni datos de niños y adolescentes. Pedimos que el Cliente no los registre en la Plataforma.' },

    { h1: '4. Para qué usamos los datos y con qué base legal' },
    { tabela: { colunas: ['Finalidad', 'Base legal (LGPD)'], larguras: [5800, 3226], linhas: [
      ['Crear y mantener la cuenta, autenticar el acceso y prestar el servicio contratado', 'Ejecución de contrato (art. 7, V)'],
      ['Tratar los datos que la empresa registra para generar informes, análisis, alertas y cálculos', 'Ejecución de contrato, según instrucciones del Cliente responsable (arts. 7, V, y 39)'],
      ['Identificar con seguridad a quien recibe acceso a los datos financieros de la empresa (CPF en la invitación)', 'Interés legítimo del Cliente y prevención del fraude (art. 7, IX) y ejecución de contrato'],
      ['Conectar cuentas bancarias y conciliar extractos', 'Consentimiento del titular en Open Finance y ejecución de contrato (art. 7, I y V)'],
      ['Cobrar la suscripción y emitir documentos fiscales', 'Ejecución de contrato y cumplimiento de obligación legal (art. 7, II y V)'],
      ['Guardar registros de acceso por 6 meses', 'Cumplimiento de obligación legal — art. 15 del Marco Civil de Internet (art. 7, II)'],
      ['Garantizar la seguridad, prevenir fraudes, abusos y accesos indebidos (incluida la verificación anti-robot)', 'Interés legítimo (art. 7, IX)'],
      ['Corregir errores y mejorar la Plataforma con datos técnicos', 'Interés legítimo (art. 7, IX)'],
      ['Ejercer derechos en procesos judiciales, administrativos o arbitrales', 'Ejercicio regular de derechos (art. 7, VI)'],
    ] } },
    { nota: 'No vendemos datos personales ni Datos del Cliente, no los usamos para publicidad de terceros y no los usamos para entrenar modelos de inteligencia artificial de terceros.' },

    { h1: '5. Inteligencia artificial' },
    { p: 'Algunas funciones de Axioma usan inteligencia artificial: IA Financiera, IA Tributaria, el asistente José en Nexus, la lectura de facturas en PDF o foto, la clasificación de ítems de compra, las explicaciones en los módulos y el **Asistente de Ayuda**, que orienta el uso de las pantallas (este recibe solo la pregunta y el fragmento del manual, sin los números de la empresa).' },
    { lista: [
      'Para responder, enviamos al proveedor de IA **solo la información necesaria** para esa pregunta: un resumen de los números de la empresa y el texto o documento enviado.',
      'Usamos proveedores que, por las condiciones contractuales de uso vía API, **no utilizan esos datos para entrenar sus modelos**: OpenAI (EE. UU.) y Anthropic (EE. UU.).',
      'Los números citados por la IA se verifican automáticamente con los datos de la empresa; cuando algo no puede verificarse, la pantalla avisa.',
      'La IA no toma decisiones automatizadas que produzcan efectos jurídicos sobre personas. Genera análisis y sugerencias que el Usuario evalúa. Si alguna decisión automatizada llegara a afectar intereses de un titular, este podrá pedir su revisión (art. 20 de la LGPD).',
    ] },

    { h1: '6. Con quién compartimos' },
    { p: 'Compartimos datos solo con proveedores necesarios para el funcionamiento de Axioma (subencargados), bajo contrato y con obligaciones de seguridad y confidencialidad:' },
    { tabela: { colunas: ['Proveedor', 'Para qué', 'Dónde'], larguras: [2400, 4600, 2026], linhas: [
      ['Supabase', 'Base de datos, autenticación y almacenamiento de archivos', '[[REGIÓN DE LA BASE DE DATOS]]'],
      ['Vercel', 'Alojamiento y ejecución de la Plataforma', 'Brasil (São Paulo) y red global'],
      ['OpenAI', 'Inteligencia artificial (respuestas, lectura de documentos)', 'EE. UU.'],
      ['Anthropic', 'Inteligencia artificial (IA Financiera, IA Tributaria, José, informes)', 'EE. UU.'],
      ['Pluggy', 'Conexión bancaria por Open Finance e iniciación de pagos', 'Brasil'],
      ['Stripe', 'Cobro de la suscripción', 'EE. UU. y Brasil'],
      ['Resend', 'Envío de e-mails (códigos de confirmación e invitaciones)', 'EE. UU.'],
      ['Sentry', 'Registro de errores técnicos', 'EE. UU.'],
      ['Cloudflare', 'Verificación anti-robot y protección contra abusos', 'Red global'],
      ['BrasilAPI y ViaCEP', 'Consulta pública de CNPJ y código postal (CEP) para completar registros', 'Brasil'],
    ] } },
    { p: 'También podemos compartir datos cuando la ley lo exija, por orden de autoridad competente o para proteger derechos de Axioma, del Cliente o de terceros. La información de mercado de Nexus proviene de fuentes públicas, como el Banco Central de Brasil, el IBGE, el Banco Mundial y organismos internacionales, y no involucra datos personales.' },

    { h1: '7. Transferencia internacional' },
    { p: 'Algunos proveedores procesan datos fuera de Brasil, principalmente en Estados Unidos. Estas transferencias ocurren para ejecutar el contrato con el Cliente y con garantías contractuales de protección, según el art. 33 de la LGPD y la reglamentación de la ANPD sobre transferencia internacional de datos.' },

    { h1: '8. Por cuánto tiempo guardamos' },
    { tabela: { colunas: ['Dato', 'Plazo'], larguras: [5200, 3826], linhas: [
      ['Datos de la cuenta y Datos del Cliente', 'Mientras la cuenta esté activa; tras el cierre, 30 días para exportación y luego eliminación o anonimización'],
      ['Registros de acceso (IP, fecha y hora)', '6 meses (Marco Civil de Internet, art. 15)'],
      ['Término de aceptación de quien salió del equipo', '60 días en la papelera y luego eliminación automática'],
      ['Historial de cambios de Cuentas por Pagar enviado a la papelera', '30 días y luego eliminación automática'],
      ['Planes estratégicos generados por la IA en Nexus', '90 días'],
      ['Paneles ejecutivos de Nexus', '180 días'],
      ['Registro de auditoría del uso de IA (sin contenido)', '365 días'],
      ['Datos fiscales y de cobro de la suscripción', 'Por el plazo exigido por la legislación tributaria'],
    ] } },
    { p: 'Los datos pueden guardarse por más tiempo cuando sea necesario para cumplir una obligación legal o para la defensa en procesos, siempre por el período mínimo necesario.' },

    { h1: '9. Cómo protegemos' },
    { lista: [
      'Cifrado en la transmisión de los datos (HTTPS/TLS) y contraseñas guardadas de forma irreversible.',
      '**Aislamiento por empresa:** reglas en la propia base de datos impiden que una empresa vea datos de otra.',
      'Control de acceso por rol y jerarquía (Propietario, CEO, Socio, Administrador y demás), con el cajero limitado al PDV y sin ver costos.',
      'Invitaciones vinculadas a un e-mail, confirmadas por código, con plazo y término de responsabilidad.',
      'Verificación anti-robot en el registro y el inicio de sesión, y límite de intentos.',
      'Registro de auditoría de las acciones relevantes y de las llamadas de IA.',
      'Monitoreo de errores y correcciones continuas de seguridad.',
    ] },
    { p: 'Ningún sistema es 100% invulnerable. En caso de un incidente de seguridad que pueda acarrear riesgo o daño relevante a los titulares, comunicaremos al Cliente, a los titulares afectados y a la ANPD en el plazo y la forma de la reglamentación (art. 48 de la LGPD).' },

    { h1: '10. Sus derechos como titular' },
    { p: 'La LGPD (art. 18) garantiza al titular de datos personales el derecho a:' },
    { lista: [
      'Confirmar si tratamos sus datos y tener acceso a ellos.',
      'Corregir datos incompletos, inexactos o desactualizados.',
      'Pedir la anonimización, bloqueo o eliminación de datos innecesarios, excesivos o tratados en desacuerdo con la ley.',
      'Pedir la portabilidad de los datos a otro proveedor.',
      'Pedir la eliminación de los datos tratados con base en el consentimiento.',
      'Saber con quién compartimos sus datos.',
      'Ser informado sobre la posibilidad de no consentir y sus consecuencias.',
      'Revocar el consentimiento, cuando esa sea la base legal.',
      'Presentar una petición ante la ANPD.',
    ] },
    { p: 'Cómo ejercerlos: envíe la solicitud a [[E-MAIL DEL ENCARGADO]]. Responderemos en hasta 15 días. Si los datos fueron registrados por una empresa Cliente (por ejemplo, usted es cliente o proveedor de esa empresa), le enviaremos la solicitud a ella, que es la responsable, y apoyaremos la respuesta.' },
    { p: 'Muchas acciones ya pueden hacerse directamente en la Plataforma: editar datos de la cuenta, exportar informes, salir de una empresa y, para el Propietario y los Administradores, eliminar los datos personales de los términos de invitación.' },

    { h1: '11. Cookies' },
    { p: 'Usamos solo cookies y almacenamiento local estrictamente necesarios para mantener la sesión abierta, proteger el acceso y recordar preferencias (idioma, tema, empresa activa). No usamos cookies de publicidad. Si se adoptan herramientas de estadística de uso, esta Política será actualizada y, cuando sea exigido, pediremos consentimiento.' },

    { h1: '12. Niños y adolescentes' },
    { p: 'Axioma está destinado a empresas y a mayores de 18 años. No tratamos intencionalmente datos de niños y adolescentes. Si identificamos ese tratamiento, los datos serán eliminados.' },

    { h1: '13. Obligaciones del Cliente como responsable' },
    { p: 'Cuando la empresa Cliente registra en Axioma datos personales de terceros, es la responsable de esos datos y se compromete a:' },
    { lista: [
      'Tener base legal adecuada para cada dato registrado e informar a los titulares cuando la ley lo exija.',
      'Registrar solo los datos necesarios para la finalidad de gestión de la empresa.',
      'Conceder acceso al Equipo solo a quien lo necesite, por el menor plazo y en el menor nivel posible.',
      'Atender las solicitudes de los titulares, con nuestro apoyo.',
    ] },

    { h1: '14. Cambios en esta Política' },
    { p: 'Esta Política puede actualizarse para reflejar cambios legales, técnicos o de proveedores. Los cambios relevantes se avisarán en la Plataforma o por e-mail con antelación razonable. La fecha de vigencia al inicio del documento indica la versión actual.' },

    { h1: '15. Contacto' },
    { p: 'Encargado del Tratamiento de Datos Personales: [[NOMBRE DEL ENCARGADO (DPO)]] — [[E-MAIL DEL ENCARGADO]].' },
    { p: '[[RAZÓN SOCIAL]] — CNPJ [[CNPJ]] — [[DIRECCIÓN COMPLETA]] — [[E-MAIL DE CONTACTO]].' },
  ],
}

export default doc
