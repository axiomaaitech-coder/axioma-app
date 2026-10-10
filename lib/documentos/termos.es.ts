// Fuente única: genera el PDF (scripts/gerar-pdf.cjs) y la página del sitio.
// Traducción al español de termos.pt.ts — prevalece la versión en portugués.
import type { DocumentoAxioma } from "./tipos"

const doc: DocumentoAxioma = {
  arquivo: 'Axioma - Términos de Uso.docx',
  titulo: 'Términos de Uso',
  subtitulo: 'Contrato de licencia de uso de la plataforma Axioma AI.Tech',
  info: ['Versión 1.0  •  Vigencia a partir de [[FECHA DE VIGENCIA]]', 'Lea con atención. Al crear una cuenta, aceptar una invitación o usar Axioma, usted acepta estos Términos.', 'Esta es una traducción ofrecida por conveniencia. En caso de divergencia, prevalece la versión en portugués.'],
  blocos: [
    { h1: 'Presentación' },
    { p: 'Bienvenido a Axioma. Estos Términos de Uso son el acuerdo entre usted y Axioma sobre cómo funciona la plataforma, a qué se compromete cada parte y cómo lo protegemos a usted y a su empresa. Escribimos este documento para ser leído, no solo aceptado: las cláusulas siguen la ley brasileña, pero el lenguaje fue pensado para ser claro.' },
    { p: 'Axioma maneja información sensible — números de su empresa, cuentas bancarias, impuestos y datos de personas. Por eso, tres principios orientan todas las reglas siguientes:' },
    { lista: [
      '**Sus datos son suyos.** Usamos la información solo para prestar el servicio que usted contrató. No vendemos datos ni los usamos para entrenar inteligencias artificiales de terceros.',
      '**Usted tiene el control.** Usted decide quién de su equipo accede a qué y por cuánto tiempo, puede exportar sus datos y puede cerrar la cuenta cuando quiera.',
      '**Transparencia y buena fe.** Avisamos con anticipación cuando algo importante cambie y explicamos con claridad lo que la plataforma hace y lo que no hace.',
    ] },
    { h2: 'Resumen en lenguaje sencillo' },
    { p: 'Este resumen ayuda a entender lo esencial. No sustituye las cláusulas completas, que vienen a continuación.' },
    { tabela: { colunas: ['Tema', 'En pocas palabras'], larguras: [2600, 6426], linhas: [
      ['Qué es Axioma', 'Una plataforma de gestión financiera con inteligencia artificial, contratada por suscripción (cláusulas 4 y 5).'],
      ['Su cuenta', 'Es personal. Guarde su contraseña y no comparta el acceso (cláusula 6).'],
      ['Su equipo', 'Usted invita personas, elige el nivel y el plazo de acceso, y puede cortar el acceso en cualquier momento (cláusula 7).'],
      ['Planes y pago', 'La suscripción es de la empresa, tiene un límite de personas por plan y puede cancelarse cuando quiera (cláusula 8).'],
      ['Inteligencia artificial', 'Apoya sus decisiones, verifica los números que cita y no decide por usted (cláusula 9).'],
      ['Banco y pagos', 'La conexión bancaria depende de su autorización en el banco; ningún dinero sale sin su aprobación (cláusulas 10 y 11).'],
      ['Sus datos', 'Pertenecen a su empresa, están protegidos según la LGPD (ley brasileña de protección de datos) y pueden exportarse (cláusulas 12 y 16).'],
      ['Uso correcto', 'No use Axioma para nada ilegal ni para acceder a datos de otras empresas (cláusula 13).'],
      ['Responsabilidades', 'Las decisiones tomadas con base en los análisis son suyas; limitamos nuestra responsabilidad dentro de lo que la ley permite (cláusulas 17 y 18).'],
    ] } },
    { nota: 'Si alguna regla no queda clara, hable con nosotros antes de aceptar. Preferimos explicar a dejar dudas.' },
    { h1: '1. Quiénes somos' },
    { p: 'La plataforma **Axioma AI.Tech** ("Axioma", "nosotros") es ofrecida por [[RAZÓN SOCIAL]], persona jurídica de derecho privado inscrita en el CNPJ bajo el nº [[CNPJ]], con sede en [[DIRECCIÓN COMPLETA]], contacto [[E-MAIL DE CONTACTO]].' },
    { p: 'Estos Términos de Uso ("Términos") regulan el acceso y el uso de Axioma, disponible en axiomaai.com.br y sus subdominios. Deben leerse junto con la **Política de Privacidad y Protección de Datos**, que forma parte de este contrato.' },

    { h1: '2. Definiciones' },
    { p: 'Para facilitar la lectura, las palabras siguientes tienen este significado en estos Términos:' },
    { lista: [
      '**Plataforma o Axioma:** el software de gestión financiera e inteligencia empresarial ofrecido como servicio por internet (SaaS), incluidos todos los módulos, pantallas, integraciones y funcionalidades de inteligencia artificial.',
      '**Cliente:** la empresa (persona jurídica, incluido el MEI — microemprendedor individual brasileño) que contrata Axioma y en cuyo nombre se registran los datos.',
      '**Usuario:** toda persona física que accede a Axioma con acceso propio, sea el Propietario de la empresa o alguien invitado por él.',
      '**Propietario:** el Usuario titular de la empresa en Axioma, responsable de la suscripción y de la gestión del Equipo.',
      '**Equipo:** los Usuarios vinculados a una empresa por invitación (por ejemplo: CEO, socio, administrador, contador, empleado, consultor, cajero).',
      '**Datos del Cliente:** toda la información que el Cliente o su Equipo registran, importan o conectan a Axioma (ingresos, costos, cuentas, facturas, extractos, registros de clientes y proveedores, entre otros).',
      '**Suscripción o Plan:** la modalidad contratada (Starter, Pro, Business o Enterprise), con sus límites y precio.',
      '**Open Finance:** el sistema regulado por el Banco Central de Brasil que permite, con el consentimiento del titular, compartir datos e iniciar pagos entre instituciones.',
      '**LGPD:** la Ley General de Protección de Datos Personales de Brasil (Ley nº 13.709/2018).',
    ] },

    { h1: '3. Aceptación y capacidad' },
    { p: 'Al crear una cuenta, marcar la casilla de aceptación, aceptar una invitación o simplemente usar Axioma, el Usuario declara que leyó, entendió y acepta estos Términos y la Política de Privacidad. Si no está de acuerdo, no debe usar la Plataforma.' },
    { p: 'Axioma está destinado al uso empresarial. Quien crea una empresa o contrata un Plan declara tener poderes para representarla y obligarla a estos Términos. Se prohíbe el uso por menores de 18 años.' },
    { p: 'Por ser un servicio contratado por empresas para su propia actividad, la relación se rige principalmente por el Código Civil brasileño (Ley nº 10.406/2002). Cuando el Cliente sea consumidor según la ley, incluso en situación de vulnerabilidad reconocida, también se aplican las reglas del Código de Defensa del Consumidor (Ley nº 8.078/1990).' },

    { h1: '4. Qué ofrece Axioma' },
    { p: 'Axioma es una plataforma de gestión financiera e inteligencia empresarial que reúne, entre otros, los módulos Dashboard, MEI, Financiero (ingresos, costos, flujo de caja, estado de resultados, endeudamiento y tesorería), Contabilidad y Fiscal, Crecimiento (metas, inversiones, simulaciones y precios), Comercial (clientes, proveedores, cuentas por pagar y por cobrar, inventario y morosidad), Gestión (centros de costo, importación de documentos, informes y Open Finance), PDV (punto de venta), Nexus (inteligencia de mercado con el asistente José), IA Financiera, IA Tributaria y Configuración (empresa, equipo, planes y uso de la IA).' },
    { p: 'Los módulos y funcionalidades pueden variar según el Plan contratado y pueden mejorarse, modificarse o discontinuarse con el tiempo, siempre con aviso previo cuando el cambio reduzca de forma relevante lo contratado.' },

    { h1: '5. Licencia de uso' },
    { p: 'Mientras la Suscripción esté activa, concedemos al Cliente y a su Equipo una licencia de uso de Axioma **no exclusiva, intransferible, no sublicenciable, revocable y limitada** al uso interno de la empresa, según la Ley nº 9.609/1998 (Ley de Software de Brasil).' },
    { p: 'La licencia no transfiere al Cliente ningún derecho de propiedad sobre el software, el código fuente, la marca, el diseño, los textos, los modelos de cálculo ni ningún otro elemento de la Plataforma.' },

    { h1: '6. Registro, cuenta y seguridad' },
    { p: 'Para usar Axioma es necesario crear una cuenta con un e-mail válido y una contraseña. El Usuario se compromete a informar datos verdaderos, completos y actualizados, y responde por la información que proporcione.' },
    { lista: [
      'La cuenta es **personal e intransferible**. Cada persona debe usar su propio acceso; no se permite compartir la contraseña.',
      'El Usuario es responsable de guardar su contraseña y de todas las acciones realizadas con su acceso.',
      'Usamos capas de protección como verificación anti-robot y código de confirmación enviado por e-mail. Estos mecanismos no sustituyen los cuidados del propio Usuario.',
      'Ante la sospecha de acceso indebido, el Usuario debe cambiar la contraseña de inmediato y avisarnos por el canal de contacto.',
    ] },

    { h1: '7. Empresa, Equipo y niveles de acceso' },
    { p: 'Cada empresa en Axioma tiene un Propietario, que puede invitar a otras personas al Equipo. Los niveles de acceso siguen este orden: **Propietario › CEO › Socio › Administrador › demás roles** (contador, financiero, contable, consultor, lector y cajero).' },
    { h2: '7.1 Invitaciones' },
    { lista: [
      'Toda invitación se hace a un e-mail específico y solo puede aceptarse desde ese e-mail, mediante código de confirmación.',
      'Quien invita declara, mediante un término electrónico, que asume la responsabilidad por el acceso concedido a los datos financieros y bancarios de la empresa.',
      'Quien es invitado informa su nombre (y CPF — número de contribuyente brasileño — cuando el acceso sea superior a 30 días o sin plazo), confirma el remitente y acepta estos Términos y la Política de Privacidad antes de entrar.',
      'El acceso puede tener plazo (24 horas, 3, 7, 30, 60 o 90 días) o ser sin plazo, esto último solo para Administrador, Socio o CEO.',
    ] },
    { h2: '7.2 Remoción, suspensión y salida' },
    { lista: [
      'El acceso de **hasta 30 días** que se corte termina de forma definitiva; para volver, se necesita una nueva invitación.',
      'El acceso de **más de 30 días o sin plazo** que se corte queda suspendido por 7 días y puede restaurarse en ese período.',
      'La remoción de personas de nivel igual o superior puede exigir el aval de alguien por encima, según las reglas mostradas en la pantalla Equipo.',
      'Cualquier miembro puede salir de la empresa cuando quiera, excepto el Propietario, que antes debe transferir la propiedad.',
      'Los datos personales del término de aceptación de quien sale de la empresa se guardan por 60 días y luego se eliminan automáticamente.',
    ] },
    { h2: '7.3 Transferencia de propiedad' },
    { p: 'El Propietario puede transferir la empresa a otro miembro activo del Equipo, indicando el motivo. La Suscripción acompaña a la empresa. El antiguo Propietario permanece en el Equipo como Administrador, salvo que sea removido después.' },
    { nota: 'El Propietario es responsable ante Axioma por quienes invita y por los accesos que concede. Recomendamos conceder siempre el menor nivel de acceso necesario y por el menor plazo posible.' },

    { h1: '8. Planes, suscripción y pago' },
    { h2: '8.1 Planes y límites' },
    { p: 'Axioma se ofrece en planes con precios y límites diferentes, mostrados en la pantalla Planes al momento de la contratación. La Suscripción pertenece a la empresa. Los límites de personas vigentes son:' },
    { tabela: { colunas: ['Plan', 'Personas en el equipo (incluido el Propietario)'], larguras: [3000, 6026], linhas: [['Starter', '1'], ['Pro', '2'], ['Business', '5'], ['Enterprise', '10']] } },
    { lista: [
      'No ocupan plaza: el cajero (PDV) y el contador o consultor externo.',
      'Cada Plan da derecho a **3 invitaciones temporales de hasta 7 días** (por ejemplo, para analistas invitados). Estas invitaciones no ocupan plaza, pero, una vez usadas, solo se renuevan cuando la empresa pasa a un Plan superior.',
      'Los accesos de 8 días o más ocupan plaza del Plan.',
      'Al alcanzar el límite, las nuevas invitaciones se bloquean hasta que la empresa cambie de Plan.',
    ] },
    { h2: '8.2 Cobro' },
    { lista: [
      'Los pagos son procesados por Stripe, empresa especializada en pagos. Axioma no almacena los datos completos de la tarjeta.',
      'La Suscripción se cobra de forma recurrente (mensual, salvo otra modalidad elegida) y se renueva automáticamente hasta su cancelación.',
      'Si un pago no se confirma, el acceso puede suspenderse hasta su regularización. Los Datos del Cliente se preservan durante la suspensión, en los plazos de la cláusula 16.',
      'Los precios pueden reajustarse, con aviso de al menos 30 días antes del próximo cobro. Si no está de acuerdo, el Cliente puede cancelar antes del reajuste.',
      'Los tributos que inciden sobre el servicio siguen la legislación aplicable.',
    ] },
    { h2: '8.3 Cancelación y reembolso' },
    { p: 'El Cliente puede cancelar la Suscripción en cualquier momento. El acceso continúa hasta el fin del período ya pagado, sin cobro en el período siguiente. No hay reembolso proporcional de períodos ya iniciados, salvo cuando la ley garantice ese derecho, como el derecho de arrepentimiento de 7 días de la primera contratación hecha por internet, cuando el Cliente sea consumidor (art. 49 del Código de Defensa del Consumidor).' },

    { h1: '9. Inteligencia artificial' },
    { p: 'Axioma usa inteligencia artificial (IA) para explicar números, responder preguntas, leer documentos, sugerir clasificaciones y generar análisis y planes. La IA es una herramienta de **apoyo a la decisión**:' },
    { lista: [
      'Las respuestas se generan a partir de los Datos del Cliente y de información pública, pero pueden contener errores, imprecisiones u omisiones. Axioma verifica automáticamente los números citados por la IA contra los datos de la empresa y señala cuando algo no pudo verificarse.',
      'Las decisiones tomadas a partir de los análisis son responsabilidad exclusiva del Cliente.',
      'Los cálculos de impuestos y obligaciones mostrados por Axioma siguen reglas fijas y la legislación vigente en la fecha indicada; los cambios en la ley pueden alterar los resultados.',
      'Para generar las respuestas, las partes de los Datos del Cliente necesarias para la pregunta se envían a proveedores de IA (como OpenAI y Anthropic), bajo contratos que no permiten el uso de esos datos para entrenar sus modelos. Los detalles están en la Política de Privacidad.',
      'Cada llamada de IA queda registrada con fines de auditoría (sin guardar el contenido de la conversación en ese registro), y el consumo puede seguirse en la pantalla Uso de la IA.',
    ] },

    { h1: '10. Open Finance e integraciones bancarias' },
    { p: 'El Cliente puede conectar cuentas bancarias a Axioma por medio de Pluggy, institución que opera en el ecosistema de Open Finance Brasil. La conexión:' },
    { lista: [
      'Depende del consentimiento expreso del titular de la cuenta, dado directamente en el entorno de la institución financiera, con plazo y finalidad definidos.',
      'Sirve para leer saldos, extractos y transacciones y conciliarlos con los registros de Axioma.',
      'Puede ser revocada en cualquier momento por el Cliente, en Axioma o en el banco.',
      'Sigue las reglas del Banco Central de Brasil y del Consejo Monetario Nacional sobre Open Finance (Resolución Conjunta nº 1/2020 y normas posteriores).',
    ] },
    { p: 'Axioma no tiene acceso a la contraseña bancaria del Cliente y no mueve dinero sin autorización.' },

    { h1: '11. Pago de cuentas por Axioma' },
    { p: 'Cuando la funcionalidad esté disponible en el Plan del Cliente, será posible pagar cuentas por Pix (pago instantáneo brasileño) desde la pantalla Cuentas por Pagar, usando la iniciación de pago de Open Finance. En estas operaciones:' },
    { lista: [
      'Todo pago debe ser **autorizado por el propio Cliente en la aplicación de su banco**. Axioma nunca retira dinero por sí solo.',
      'El Cliente es responsable de verificar el monto, el beneficiario y el vencimiento antes de autorizar.',
      'La baja de la cuenta y el registro del comprobante se hacen automáticamente cuando la institución confirma el pago.',
      'Axioma no es una institución financiera y no responde por rechazos, demoras o fallas causadas por el banco, la institución iniciadora o el receptor.',
    ] },

    { h2: '11.1 Guías de tributos (DAS del MEI y del Simples Nacional)' },
    { lista: [
      'La guía es **generada por el Cliente en el portal oficial** (PGMEI o PGDAS-D). Axioma lee la guía enviada con inteligencia artificial y verifica los códigos por regla, pero **el Cliente verifica valor, vencimiento, períodos y CNPJ antes de pagar**.',
      'El pago lo hace el Cliente: en la app del banco (Pix o código de barras), en el portal oficial (tarjeta de crédito, cuando esté disponible) o por el Pix por Axioma, autorizado en el banco del Cliente.',
      'El registro "Ya pagué" es una declaración del Cliente. El comprobante oficial es el del banco o del portal de la Receita Federal; Axioma no sustituye la consulta a los sistemas oficiales.',
      'Los valores, límites y plazos mostrados siguen las reglas oficiales vigentes en la fecha indicada en pantalla y pueden cambiar por nueva ley o norma.',
    ] },
    { h2: '11.2 Apertura de empresa (MEI y ME)' },
    { p: 'Axioma muestra el paso a paso y los enlaces de los portales oficiales (gov.br, REDESIM, Junta Comercial y Portal del Simples Nacional). La apertura, las inscripciones y la opción por el Simples Nacional las hace el Cliente en esos portales. Axioma no abre empresas, no representa al Cliente ante órganos públicos y no cobra por la formalización del MEI, que es gratuita. Los datos buscados por CNPJ vienen de la base pública de la Receita Federal y deben verificarse antes de guardar.' },

    { h1: '12. Datos del Cliente y protección de datos' },
    { p: 'Los Datos del Cliente pertenecen al Cliente. Axioma los trata solo para prestar el servicio, según estos Términos, la Política de Privacidad y la LGPD.' },
    { lista: [
      'En relación con los datos personales que el Cliente registra en la Plataforma sobre terceros (por ejemplo, clientes, proveedores, empleados y socios), el **Cliente es el responsable** y **Axioma actúa como encargado**, tratando esos datos solo según las instrucciones del Cliente y para las finalidades del servicio (art. 39 de la LGPD).',
      'En relación con los datos de registro, acceso y uso de la propia cuenta de los Usuarios, **Axioma es el responsable**.',
      'El Cliente declara tener base legal adecuada (art. 7 y, cuando corresponda, art. 11 de la LGPD) para registrar datos personales de terceros en Axioma y se compromete a informar a los titulares cuando la ley lo exija.',
      'Axioma adopta medidas técnicas y administrativas de seguridad, como cifrado en tránsito, aislamiento de los datos de cada empresa y control de acceso por rol, y comunicará al Cliente los incidentes de seguridad que puedan acarrear riesgo o daño relevante, según el art. 48 de la LGPD.',
      'Axioma no vende Datos del Cliente ni los usa para entrenar modelos de inteligencia artificial de terceros.',
    ] },

    { h1: '13. Uso aceptable' },
    { p: 'Está prohibido usar Axioma para:' },
    { lista: [
      'Practicar actos ilícitos, fraude, lavado de dinero, evasión fiscal o cualquier actividad contraria a la ley.',
      'Registrar datos de terceros sin base legal o violar derechos de privacidad, imagen, propiedad intelectual o confidencialidad.',
      'Intentar acceder a datos de otras empresas, eludir controles de acceso, probar vulnerabilidades sin autorización escrita o explotar fallas.',
      'Hacer ingeniería inversa, copiar, revender, sublicenciar o crear productos competidores a partir de la Plataforma.',
      'Usar robots, extracción automatizada de datos o sobrecargar la infraestructura de forma abusiva.',
      'Enviar archivos con virus, código malicioso o contenido ilegal.',
      'Compartir el acceso, revender accesos o eludir los límites del Plan.',
    ] },
    { p: 'El incumplimiento puede llevar a la suspensión inmediata o al cierre de la cuenta, sin perjuicio de las medidas legales aplicables.' },

    { h1: '14. Propiedad intelectual' },
    { p: 'Axioma, su marca, nombre, logotipos, pantallas, textos, íconos, modelos de cálculo, bases de conocimiento, código fuente y demás elementos pertenecen a [[RAZÓN SOCIAL]] o a sus licenciantes y están protegidos por las Leyes nº 9.609/1998 (software), nº 9.610/1998 (derechos de autor) y nº 9.279/1996 (propiedad industrial).' },
    { p: 'Los Datos del Cliente siguen siendo del Cliente. Las sugerencias y opiniones enviadas sobre la Plataforma pueden usarse libremente para mejorarla, sin obligación de pago.' },

    { h1: '15. Disponibilidad, mantenimiento y soporte' },
    { lista: [
      'Nos esforzamos por mantener Axioma disponible de forma continua, pero pueden ocurrir interrupciones por mantenimiento, actualización, fallas de proveedores (alojamiento, base de datos, proveedores de IA, bancos e instituciones de Open Finance) o eventos fuera de nuestro control.',
      'Los mantenimientos programados se harán, siempre que sea posible, en horarios de menor uso y se comunicarán con anticipación.',
      'La información de mercado mostrada en Nexus proviene de fuentes públicas (como el Banco Central de Brasil, el IBGE y organismos internacionales) y puede retrasarse o no estar disponible por fallas de esas fuentes.',
      'El soporte se presta por los canales informados en la Plataforma, en días hábiles.',
    ] },

    { h1: '16. Cierre, exportación y eliminación de datos' },
    { lista: [
      'El Cliente puede cerrar la cuenta en cualquier momento.',
      'Podemos suspender o cerrar el acceso en caso de violación de estos Términos, falta de pago u orden de autoridad competente.',
      'Tras el cierre, el Cliente tendrá **30 días** para exportar sus datos con las funciones de exportación de la Plataforma (PDF, hojas de cálculo e informes).',
      'Después de ese plazo, los Datos del Cliente se eliminarán o anonimizarán, salvo los que deban guardarse por obligación legal o regulatoria (por ejemplo, registros de acceso guardados por 6 meses según el art. 15 del Marco Civil de Internet de Brasil) o para el ejercicio de derechos en procesos.',
    ] },

    { h1: '17. Limitación de responsabilidad' },
    { p: 'En la máxima medida permitida por la ley:' },
    { lista: [
      'Axioma se ofrece para apoyar la gestión; los resultados dependen de la calidad y actualización de los datos registrados por el Cliente.',
      'No respondemos por decisiones empresariales tomadas con base en los análisis, ni por lucro cesante, pérdida de oportunidad o daños indirectos.',
      'No respondemos por fallas de terceros fuera de nuestro control, como bancos, instituciones de pago, proveedores de internet y organismos públicos.',
      'Cuando exista responsabilidad nuestra, se limita al valor pagado por el Cliente a Axioma en los 12 meses anteriores al hecho.',
      'Estas limitaciones no se aplican a casos de dolo o culpa grave, ni excluyen derechos que la ley no permite limitar.',
    ] },

    { h1: '18. Responsabilidad del Cliente' },
    { p: 'El Cliente responde por los datos que registra, por los accesos que concede a su Equipo y por el uso de la Plataforma en desacuerdo con estos Términos o con la ley, y se compromete a resarcir los perjuicios causados a Axioma o a terceros por esos motivos.' },

    { h1: '19. Comunicaciones y firma electrónica' },
    { p: 'Las comunicaciones entre las partes pueden hacerse por e-mail, por avisos en la Plataforma o por notificaciones. La aceptación electrónica de estos Términos, de los términos de invitación y de las confirmaciones registradas en la Plataforma tiene validez jurídica, con registro de fecha, hora e identificación del Usuario, según la legislación brasileña sobre documentos y firmas electrónicas.' },

    { h1: '20. Cambios en estos Términos' },
    { p: 'Podemos actualizar estos Términos para reflejar cambios legales, técnicos o del servicio. Los cambios relevantes se comunicarán con una antelación mínima de 30 días. El uso continuado tras la vigencia de la nueva versión significa conformidad; si no está de acuerdo, el Cliente puede cancelar la Suscripción antes.' },

    { h1: '21. Disposiciones generales' },
    { lista: [
      'La tolerancia ante un incumplimiento no significa renuncia de derechos.',
      'Si alguna cláusula se considera inválida, las demás siguen vigentes.',
      'El Cliente no puede ceder este contrato sin nuestra conformidad. Podemos cederlo en caso de reorganización societaria, manteniendo las condiciones.',
      'Estos Términos y la Política de Privacidad forman el acuerdo completo entre las partes sobre el uso de Axioma.',
    ] },

    { h1: '22. Ley aplicable y jurisdicción' },
    { p: 'Estos Términos se rigen por las leyes de la República Federativa de Brasil. Se elige el foro de la comarca de [[CIUDAD/ESTADO DEL FORO]] para resolver eventuales controversias, con renuncia a cualquier otro, salvo el foro del domicilio del Cliente cuando este sea consumidor, según la ley.' },

    { h1: '23. Contacto' },
    { p: 'Dudas sobre estos Términos: [[E-MAIL DE CONTACTO]].' },
    { p: 'Asuntos de privacidad y protección de datos: Encargado del Tratamiento de Datos Personales [[NOMBRE DEL ENCARGADO (DPO)]], [[E-MAIL DEL ENCARGADO]].' },
  ],
}

export default doc
