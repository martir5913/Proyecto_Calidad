## Universidad Mariano Gálvez de Guatemala

Ingeniería en Sistemas de información y Ciencias de la Computación

Ing. Omar Esduardo Sagastume Alvarez

Curso: Aseguramiento De La Calidad De Software

Documento Técnico de Aseguramiento de la Calidad del Software

del Sistema AgroChain ERP para AgroTrace Tech, S. A.

5190 11 6975 FREDY GEOVANY MARTIR GONZÁLEZ

LA

5190-22-3175 EDGAR DANIEL MALDONADO PINEDA

5190-21-3110 ESDRAS JOSUE AJANEL BARRIOS

Guatemala, 14 de AGOSTO de 2026

## CONTENIDO

## INTRODUCCIÓN

El presente documento constituye el entregable técnico del proyecto de curso y describe,

bajo un enfoque de ingeniería de software, el modelo de negocio de AgroTrace Tech, S. A., así

como la especificación del sistema AgroChain ERP, plataforma de trazabilidad agrícola concebida

para el sector agroexportador. El documento se estructura en seis apartados que abordan,

respectivamente, el modelo de negocio, la clasificación técnica del tipo de aplicación, la

presentación de la lógica funcional, la metodología de desarrollo adoptada, los estándares de

calidad aplicables y el detalle de las herramientas, sistemas operativos y plataformas tecnológicas

seleccionadas.

La orientación metodológica del documento parte de la premisa de que la calidad del

software no es un atributo que se verifique al final del ciclo de vida, sino una propiedad que se

construye mediante procesos definidos, verificables y medibles. En consecuencia, cada decisión

técnica descrita se acompaña de su justificación y de la evidencia objetiva que permitirá auditarla,

en congruencia con lo establecido por el Institute of Electrical and Electronics Engineers (IEEE,

2014) respecto de los procesos de aseguramiento de la calidad del software.

5

## MODELO DE NEGOCIO

AgroTrace Tech, S. A. es una empresa de base tecnológica cuyo giro principal es el

desarrollo y la operación de soluciones de trazabilidad e inteligencia de datos para la cadena

agroexportadora. Su propuesta de valor se sustenta en la digitalización de los eventos productivos

del campo y en la generación de evidencia auditable que respalde los procesos de certificación

internacional.

Misión

Proveer soluciones tecnológicas de trazabilidad e inteligencia de datos para el sector

agroexportador, garantizando la calidad, inocuidad y transparencia de los productos desde la

siembra hasta la entrega al consumidor final.

Visión

Convertirse para el año 2030 en la plataforma estándar de trazabilidad agrícola en

Latinoamérica, impulsando la certificación internacional y la sostenibilidad de los productores

agropecuarios mediante tecnología accesible y de alta confiabilidad.

Objetivos Organizacionales

Objetivo General

Desarrollar e implementar un ecosistema digital de gestión logística agrícola que reduzca

en un 25 % las mermas por falta de control de calidad en la cadena de distribución durante el

primer año de operaciones.

Objetivos Específicos

Definición Institucional

6

- 1. Automatizar el registro de insumos y bitácoras de cosecha mediante dispositivos móviles con soporte para operación sin conexión (offline), garantizando la persistencia local de los datos y su posterior conciliación con el repositorio central.

- 2. Integrar un módulo de auditoría automatizada conforme a las normativas de exportación GLOBALG.A.P. y USDA Organic, capaz de generar matrices de evidencia y reportes de conformidad exportables.

- 3. Garantizar la integridad referencial y la trazabilidad bidireccional de cada lote productivo, de modo que sea posible reconstruir su historial completo tanto desde el origen hacia el consumidor como en sentido inverso.

## Modelo de Ingresos y Propuesta Tecnológica de Valor

El modelo de comercialización adoptado es el de software como servicio (SaaS), operado

bajo una arquitectura multiinquilino (multi-tenant) con aislamiento lógico de datos por esquema

de base de datos. La facturación se establece mediante suscripción escalonada según el número de

hectáreas monitoreadas y de usuarios concurrentes, complementada con servicios profesionales de

implantación, migración de datos históricos y capacitación. Este esquema permite amortizar el

costo de la infraestructura entre múltiples productores y cooperativas, lo cual resulta determinante

para la penetración en un mercado compuesto mayoritariamente por unidades productivas

pequeñas y medianas.

## Administración y Organización

La empresa adopta una estructura funcional jerárquica con énfasis en la agilidad operativa

y el cumplimiento normativo. La característica estructural más relevante desde la perspectiva del

aseguramiento de la calidad es la ubicación de la función de calidad (QA) como una unidad con

dependencia directa de la Dirección de Tecnología y Calidad, y no subordinada al Departamento

de Desarrollo. Esta separación jerárquica materializa el principio de independencia organizacional

del aseguramiento de la calidad establecido en el estándar IEEE 730, el cual exige que la instancia

que evalúa la conformidad no dependa de la instancia que produce el artefacto evaluado.

*Figura 1*

*Estructura organizacional de AgroTrace Tech, S. A.*

Nota. La Dirección de Tecnología y Calidad concentra la autoridad técnica sobre el producto y la independencia funcional del aseguramiento de la calidad respecto del equipo de desarrollo. Elaboración propia.

*Tabla 1*

*Responsabilidades técnicas por unidad organizacional*

| Unidad organizacional Rol técnico asignado Responsabilidad en el proceso de calidad |
| --- |
| Dirección General Patrocinador del Aprueba el Plan de Aseguramiento de la Calidad del (CEO) proyecto Software (SQAP) y asigna los recursos necesarios para su ejecución. |
| Gerencia de Operaciones Cliente en sitio (on-site Redacta y prioriza las historias de usuario; define y ejecuta Agrícolas customer) los criterios de las pruebas de aceptación. |
| Dirección de Tecnología CTO / Gerente de SQA Ejerce la autoridad de calidad independiente; aprueba las y Calidad líneas base de configuración y los informes de auditoría. |
| Departamento de Equipo de programación Aplica desarrollo guiado por pruebas, programación en Desarrollo e Ingeniería XP pares, refactorización continua e integración continua. |
| Unidad de Ingenieros de pruebas Diseña, ejecuta y documenta los niveles de prueba Aseguramiento de (QA) conforme a la norma ISO/IEC/IEEE 29119. Calidad |

| Unidad organizacional Rol técnico asignado Responsabilidad en el proceso de calidad |
| --- |
| Ingeniería DevOps Administrador de la Mantiene los entornos, las canalizaciones automatizadas y cadena CI/CD las compuertas de calidad (quality gates). |

Nota. La independencia de la unidad de Aseguramiento de Calidad respecto del Departamento de Desarrollo responde al requisito de independencia organizacional descrito en IEEE (2014). Elaboración propia.

## TIPO DE APLICACIÓN

## Clasificación del Proyecto

El sistema AgroChain ERP se clasifica como un desarrollo nuevo (greenfield

development), toda vez que no existe una plataforma antecesora que deba ser refactorizada,

migrada o reescrita. La organización opera actualmente sus registros de campo mediante

formularios en papel y hojas de cálculo desconectadas, artefactos que no constituyen un sistema

de software y que, por tanto, no imponen restricciones de compatibilidad hacia atrás ni deuda

técnica heredada. Esta condición es relevante desde la perspectiva del aseguramiento de la calidad,

pues permite instrumentar el proceso de verificación desde la primera línea de código y establecer

las líneas base de configuración sin las limitaciones propias de un sistema heredado.

## Naturaleza Técnica de la Solución

La solución se materializa como un sistema distribuido de dos frentes cliente. El primero

es un portal web administrativo implementado como aplicación de página única (SPA), destinado

a la operación de oficina, la parametrización del sistema y la explotación analítica de la

información. El segundo es una aplicación móvil multiplataforma compilada a código nativo,

concebida bajo el patrón offline-first, la cual opera en zonas de baja o nula conectividad celular y

sincroniza su estado con el repositorio central al restablecerse el enlace.

Ambos clientes consumen un mismo backend estructurado en módulos de dominio

desacoplados, expuesto mediante una interfaz de programación de aplicaciones (API) de estilo

arquitectónico REST sobre HTTPS. La decisión de iniciar con un monolito modular, en lugar de

una arquitectura de microservicios plena, obedece a un criterio de riesgo: la fragmentación

prematura del despliegue incrementaría de forma significativa la complejidad de las pruebas de

integración y de la observabilidad, sin aportar beneficios de escalabilidad demostrables en el

volumen transaccional proyectado para el primer año de operación.

*Tabla 2*

*Caracterización técnica del tipo de aplicación*

| Dimensión de análisis Clasificación adoptada |
| --- |
| Tipo de proyecto Desarrollo nuevo (greenfield) |
| Paradigma arquitectónico Cliente-servidor distribuido con backend monolítico modular orientado a dominios |
| Cliente web Aplicación de página única (SPA) con renderizado en el cliente |
| Cliente móvil Aplicación multiplataforma compilada a nativo, con patrón offline-first |
| Modelo de despliegue Nube pública sobre contenedores, con perfil alternativo de instalación local (on-premise) |
| Modelo de tenencia Multiinquilino con aislamiento lógico por esquema de base de datos |
| Estilo de interfaz de servicios REST sobre HTTPS con serialización JSON y versionado de contrato por URI |
| Modo de operación Síncrono en el portal web; asíncrono con sincronización diferida en el cliente móvil |
| Estrategia de persistencia Base de datos relacional con extensión geoespacial y almacén de objetos para evidencia binaria |
| Mecanismo de autenticación OAuth 2.0 / OpenID Connect con tokens JWT y control de acceso basado en roles (RBAC) |
| Criticidad del sistema Media-alta: la pérdida de registros compromete la certificación de exportación del lote |

Nota. La caracterización precede a la definición de los requisitos no funcionales, dado que cada dimensión condiciona las subcaracterísticas de calidad exigibles según ISO/IEC 25010. Elaboración propia.

## Módulos Funcionales Comprometidos

- Gestión de fincas, parcelas y lotes productivos, con delimitación geoespacial mediante polígonos georreferenciados.

- Registro de eventos del ciclo productivo: siembra, fertilización, aplicación fitosanitaria, riego, cosecha y despacho.

- Control de insumos agrícolas, con validación automática de períodos de carencia previos a la cosecha.

- Identificación y seguimiento de lotes mediante códigos QR, con lectura y validación en planta empacadora.

- Motor de auditoría automatizada contra los puntos de control de GLOBALG.A.P. y USDA Organic.

- Administración de usuarios, perfiles y matriz de permisos bajo el modelo RBAC.

- Módulo de reportería, indicadores de gestión y exportación de expedientes de trazabilidad.

## PRESENTACIÓN DE LA LÓGICA FUNCIONAL

La lógica funcional del sistema se presenta en cuatro planos complementarios: el plano de

actores y casos de uso, que delimita el alcance funcional; el plano de descomposición modular,

que expresa la organización interna del dominio; el plano arquitectónico en capas, que describe la

distribución de responsabilidades técnicas; y el plano de flujo de control del proceso crítico de

sincronización, que constituye el mayor riesgo técnico del proyecto.

## Actores y Casos de Uso

Se identificaron cuatro actores primarios cuya interacción con el sistema determina las

fronteras funcionales. La distinción entre el agrónomo de campo y el inspector de calidad es

sustantiva y no meramente nominal: el primero opera predominantemente en modo desconectado

y genera registros de origen, mientras que el segundo opera en planta con conectividad estable y

ejecuta validaciones sobre registros ya existentes. Esta diferencia condiciona tanto el diseño de la

interfaz como la estrategia de persistencia de cada perfil.

Figura 2

## Diagrama de casos de uso del sistema AgroChain ERP

Nota. Las relaciones «include» indican dependencia obligatoria: ningún registro de bitácora o de insumo puede completarse sin la captura previa del evento georreferenciado. Elaboración propia con notación UML 2.5.

*Tabla 3*

*Matriz de control de acceso basado en roles (RBAC)*

| Actor Rol técnico Permisos otorgados Modo de operación |
| --- |
| Agrónomo de ROLE_FIELD_OP Crear y leer eventos productivos; sin Offline con campo permiso de eliminación sincronización diferida |
| Inspector de calidad ROLE_QA_INSP Leer eventos; crear validaciones de En línea inocuidad; actualizar estado de lote |
| Administrador del ROLE_ADMIN CRUD completo sobre catálogos, En línea sistema usuarios y roles; sin acceso a datos de otro inquilino |
| Auditor externo ROLE_AUDITOR Solo lectura sobre expedientes cerrados y En línea, acceso bitácora de auditoría temporal |
| Proceso de SERVICE_SYNC Escritura transaccional idempotente sobre Automatizado sincronización eventos pendientes |

Nota. El principio de mínimo privilegio se aplica de forma estricta: ningún rol de negocio dispone de la operación de eliminación física, la cual se sustituye por borrado lógico para preservar la cadena de custodia de la evidencia. Elaboración propia.

## Descomposición Modular del Dominio

El sistema se descompone en módulos cohesivos con acoplamiento controlado, definidos

a partir de los contextos delimitados del dominio agrícola. Cada módulo expone su funcionalidad

mediante una interfaz explícita y no accede directamente a las estructuras internas de persistencia

de los demás, lo cual constituye la precondición técnica para una eventual extracción hacia

servicios independientes.

*Tabla 4*

*Descomposición modular: entradas, procesamiento y salidas*

| Módulo Entradas Procesamiento Salidas |
| --- |
| Gestión territorial Coordenadas GPS, Validación topológica de polígonos y Parcelas área declarada, detección de solapamientos mediante georreferenciadas y cultivo PostGIS catálogo de lotes |
| Bitácora de Fecha, cuadrilla, Validación de rangos, cálculo de Registro inmutable de cosecha volumen, evidencia rendimiento por hectárea y sellado evento productivo fotográfica temporal |
| Control de Producto, dosis, Verificación del período de carencia Alerta de bloqueo o insumos fecha de aplicación contra la fecha prevista de cosecha autorización de cosecha |
| Sincronización Lote de eventos con Resolución de conflictos por versión y Confirmación (ACK) y estado PENDIENTE marca temporal; escritura idempotente actualización de estado por UUID local |
| Auditoría Expediente del lote y Evaluación automática de reglas de Matriz de evidencia y normativa puntos de control conformidad GLOBALG.A.P. y USDA porcentaje de Organic cumplimiento |
| Reportería Parámetros de Agregación analítica sobre vistas Indicadores, tableros y consulta y rango materializadas exportación en PDF y temporal CSV |
| Seguridad y Credenciales y Autenticación OIDC, emisión de JWT y Token de sesión y acceso contexto de inquilino evaluación de la matriz RBAC registro en bitácora de auditoría |

Nota. La separación del módulo de sincronización respecto de los módulos de dominio permite aislar la complejidad de la concurrencia distribuida y someterla a pruebas específicas. Elaboración propia.

## Arquitectura Lógica en Capas

La organización interna responde a una arquitectura en capas con dependencia

unidireccional descendente. La capa de presentación desconoce los detalles de persistencia; la capa

de lógica de negocio no contiene referencias a los mecanismos de transporte; y la capa de

persistencia se expone exclusivamente mediante abstracciones de repositorio. Esta disciplina de

dependencias es la que hace viable la sustitución de componentes durante las pruebas unitarias

mediante dobles de prueba (mocks y stubs), requisito indispensable para sostener el desarrollo

guiado por pruebas (Sommerville, 2016).

*Figura 3*

*Arquitectura lógica en capas del sistema AgroChain ERP*

Nota. Las líneas discontinuas representan dependencias opcionales o asíncronas. La persistencia local en SQLite se ubica en la capa de presentación porque su ciclo de vida está acoplado al del dispositivo, no al del servidor. Elaboración propia.

## Flujo de Control del Proceso Crítico de Sincronización

El proceso de sincronización constituye el punto de mayor riesgo técnico del sistema, dado

que involucra concurrencia distribuida, conectividad intermitente y exigencia de no pérdida de

información. El algoritmo implementado asigna a cada evento un identificador único universal

(UUID) generado en el dispositivo, lo cual garantiza la idempotencia de la operación de escritura:

si un mismo lote se transmite más de una vez por efecto de un reintento, el servidor descarta los

duplicados sin generar registros espurios.

La resolución de conflictos se realiza mediante una estrategia de última escritura válida,

arbitrada por marca temporal del dispositivo corregida contra el reloj del servidor, y toda

sobrescritura queda asentada en la bitácora de auditoría. La política de reintento aplica retroceso

exponencial con fluctuación aleatoria (exponential backoff with jitter) a fin de evitar picos de carga

sincronizados cuando múltiples dispositivos recuperan la señal simultáneamente.

*Figura 4*

*Diagrama de flujo del proceso de sincronización offline-first*

Nota. El estado PENDIENTE se conserva en el dispositivo hasta recibir confirmación explícita del servidor, de manera que la interrupción del enlace en cualquier punto del flujo no produce pérdida de datos. Elaboración propia.

## Tabla 5

*Reglas de negocio verificables del sistema*

| Código Enunciado de la regla Mecanismo de verificación |
| --- |
| RN-01 Ningún lote puede registrar cosecha si existe una Prueba unitaria sobre el motor de reglas y aplicación fitosanitaria dentro de su período de bloqueo transaccional en base de datos carencia. |
| RN-02 Todo evento productivo debe incluir coordenadas Validación en el cliente móvil y restricción geográficas con precisión horizontal menor o igual a CHECK en la capa de persistencia 10 metros. |
| RN-03 Los registros consolidados no admiten eliminación Revocación del permiso DELETE y disparador física; únicamente borrado lógico con justificación. de auditoría |
| RN-04 Un usuario no puede acceder a datos pertenecientes a Filtrado por identificador de inquilino en la un inquilino distinto del asociado a su sesión. capa de repositorio y prueba de seguridad automatizada |
| RN-05 La lectura de un código QR debe resolver el Prueba de rendimiento automatizada con expediente completo del lote en menos de 1.5 umbral de fallo en la canalización de segundos. integración continua |
| RN-06 Todo expediente sometido a auditoría debe conservar Verificación de integridad mediante suma de la cadena de custodia completa de sus evidencias. comprobación (hash) sobre los objetos almacenados |

Nota. Cada regla de negocio se encuentra asociada al menos a un caso de prueba automatizado, en cumplimiento del criterio de trazabilidad requisito-prueba exigido por ISO/IEC/IEEE 29119. Elaboración propia.

## METODOLOGÍA DE DESARROLLO

La estrategia de construcción del sistema combina dos elementos que operan en planos

distintos y complementarios: un modelo de ciclo de vida incremental, que determina cómo se

ordenan y entregan las porciones del producto a lo largo del tiempo, y la metodología

Programación Extrema (XP, por sus siglas en inglés), que determina cómo se construye

técnicamente el software dentro de cada porción. Resulta pertinente subrayar esta distinción, dado

que en la práctica profesional suelen confundirse ambos niveles de decisión.

## Modelo de Ciclo de Vida Incremental

El modelo incremental descompone el producto en porciones funcionales acumulativas,

cada una de las cuales constituye un sistema operativo y desplegable que amplía las capacidades

del incremento anterior. Su adopción se justifica por tres razones de orden técnico. En primer lugar,

permite obtener retroalimentación temprana de los agrónomos y cooperativas sobre el núcleo de

17

trazabilidad antes de comprometer esfuerzo en las funcionalidades de auditoría normativa. En

segundo lugar, aísla el riesgo asociado a la sincronización desconectada en un incremento

específico, evitando que su complejidad contamine la construcción del resto del dominio. En tercer

lugar, hace posible la certificación progresiva del producto, ya que cada incremento se somete a

verificación y validación completas antes de habilitar el siguiente (Pressman y Maxim, 2020).

Programación Extrema como Metodología de Construcción

XP es una metodología ágil que, a diferencia de los marcos de gestión, prescribe prácticas

concretas de ingeniería sobre la forma en que se escribe, verifica e integra el código fuente. Su

elección responde directamente al objetivo del proyecto de alcanzar una cobertura de código

superior al 85 % verificada automáticamente: dicha meta es consecuencia natural del desarrollo

guiado por pruebas, práctica nuclear de XP, y difícilmente alcanzable bajo un modelo que relegue

la construcción de pruebas a una fase posterior a la codificación (Beck y Andres, 2004).

Los valores que sustentan la metodología —comunicación, simplicidad, retroalimentación,

coraje y respeto— se traducen en prácticas verificables cuya ejecución deja evidencia objetiva

auditable, condición indispensable para que el aseguramiento de la calidad pueda ejercerse sobre

el proceso y no únicamente sobre el producto terminado.

*Figura 5*

*Integración del ciclo de vida incremental con las prácticas de Programación Extrema*

Nota. El ciclo XP inferior se ejecuta de forma completa dentro de cada uno de los cuatro incrementos, con iteraciones acotadas a dos semanas. Elaboración propia.

*Tabla 6*

*Plan de incrementos del sistema AgroChain ERP*

| Incremento Alcance funcional Duración Criterio de aceptación |
| --- |
| I-1 Núcleo de trazabilidad: gestión territorial, 8 semanas Registro y consulta del ciclo catálogo de lotes, eventos productivos y (4 iteraciones) completo de un lote en entorno autenticación con RBAC conectado, con cobertura mínima del 85 % |
| I-2 Aplicación móvil offline-first, persistencia 10 semanas Cero pérdida de registros en prueba local, servicio de sincronización y captura (5 iteraciones) de desconexión forzada de 72 horas georreferenciada con 50 dispositivos simulados |
| I-3 Motor de auditoría normativa 8 semanas Resolución del expediente completo GLOBALG.A.P. y USDA Organic, (4 iteraciones) por lectura de QR en menos de 1.5 identificación por QR y validación de segundos inocuidad |
| I-4 Reportería analítica, tableros de 6 semanas Ausencia de vulnerabilidades indicadores, endurecimiento de seguridad (3 iteraciones) críticas y altas del top 10 de y optimización del rendimiento OWASP; disponibilidad verificada bajo carga nominal |

Nota. Cada incremento culmina con una liberación candidata sometida a pruebas de aceptación ejecutadas por el cliente en sitio. Elaboración propia.

## Prácticas de Ingeniería Adoptadas y su Evidencia Verificable

El valor de XP para efectos del aseguramiento de la calidad radica en que cada una de sus

prácticas produce un artefacto o un registro susceptible de auditoría. La siguiente tabla establece

la correspondencia entre la práctica adoptada, su implementación concreta en el proyecto y la

evidencia objetiva que permitirá verificar su cumplimiento.

*Tabla 7*

*Prácticas de Programación Extrema y evidencia objetiva de cumplimiento*

| Práctica XP Implementación en el proyecto Evidencia verificable |
| --- |
| Desarrollo guiado por Ciclo rojo-verde-refactorización obligatorio Reporte de cobertura JaCoCo o Istanbul pruebas (TDD) en módulos de inocuidad, carencia de con umbral de fallo automático en 85 % insumos y sincronización |
| Integración continua Ejecución automática de la canalización Historial de ejecuciones y estado de las ante cada envío al repositorio remoto compuertas de calidad en GitLab CI/CD |
| Programación en Obligatoria en historias clasificadas como Autoría conjunta declarada en el mensaje pares de riesgo alto o de complejidad ciclomática de confirmación mediante la etiqueta Co- elevada authored-by |
| Refactorización Remediación obligatoria de la deuda técnica Reducción medible del índice de deuda continua detectada antes del cierre de cada iteración técnica reportado por SonarQube |
| Diseño simple Prohibición explícita de introducir Actas de revisión de código y control de generalizaciones no exigidas por una la complejidad ciclomática por función historia vigente |
| Cliente en sitio Participación del gerente de operaciones Historias de usuario firmadas y registro de agrícolas en la planificación y aceptación de aceptación por iteración cada iteración |
| Entregas pequeñas Liberación funcional cada dos semanas al Etiquetas de versión semántica y notas de entorno de pruebas de aceptación liberación versionadas |
| Estándar de Aplicación automatizada de reglas de Ejecución de ESLint, Prettier y ganchos codificación formato y estilo previo a la confirmación de pre-confirmación registrada en la canalización |
| Propiedad colectiva Cualquier integrante puede modificar Solicitudes de fusión con al menos una del código cualquier módulo previa aprobación de aprobación obligatoria de un par revisión |

Nota. La existencia de evidencia automatizada permite que la auditoría de proceso prevista en IEEE 730 se ejecute sobre datos objetivos y no sobre declaraciones del equipo. Elaboración propia.

## Asignación de Roles del Equipo de Proyecto

Dado que el equipo se compone de tres integrantes, se adopta el esquema de roles reducido

propio de las organizaciones muy pequeñas, con rotación de la responsabilidad de revisión para

preservar la independencia del control por pares. Ningún integrante revisa y aprueba su propio

código.

*Tabla 8*

*Asignación de roles técnicos del equipo de proyecto*

| Integrante Rol principal Responsabilidad técnica específica |
| --- |
| Fredy Geovany Martir Líder técnico y arquitecto Define la arquitectura en capas, aprueba las líneas González de software base de configuración y coordina la resolución de deuda técnica |
| Edgar Daniel Maldonado Ingeniero de desarrollo y Construye los módulos de dominio y mantiene la Pineda DevOps canalización de integración y despliegue continuos |
| Esdras Josué Ajanel Barrios Ingeniero de Elabora el SQAP, diseña la estrategia de pruebas aseguramiento de la conforme a ISO/IEC/IEEE 29119 y administra las calidad métricas de calidad |

Nota. Los tres integrantes participan en la codificación bajo el esquema de propiedad colectiva; los roles indican la responsabilidad de decisión, no la exclusividad de la tarea. Elaboración propia.

## ESTÁNDARES DE CALIDAD A UTILIZAR

El marco de calidad del proyecto se construye sobre cuatro normas que operan en niveles

distintos y no redundantes. ISO/IEC 25010 define qué se entiende por calidad en el producto; IEEE

730 define cómo se organiza y gobierna la función de aseguramiento; ISO/IEC/IEEE 29119 define

cómo se estructura el proceso de pruebas; e ISO/IEC 29110 define el conjunto mínimo de procesos

exigible a una organización muy pequeña como AgroTrace Tech. La articulación de las cuatro

evita tanto los vacíos de cobertura como la duplicidad de esfuerzo documental.

## ISO/IEC 25010: Modelo de Calidad del Producto

El estándar ISO/IEC 25010, perteneciente a la serie SQuaRE, establece un modelo de ocho

características de calidad del producto software, cada una descompuesta en subcaracterísticas

medibles (Organización Internacional de Normalización [ISO], 2011). Su función en el proyecto

es proporcionar el vocabulario formal para especificar los requisitos no funcionales, de modo que

estos dejen de enunciarse como aspiraciones cualitativas y se conviertan en umbrales verificables

mediante prueba.

*Tabla 9*

Requisitos no funcionales especificados conforme a ISO/IEC 25010

| Característica Subcaracterística Métrica y umbral objetivo Técnica de verificación priorizada |
| --- |
| Eficiencia de Comportamiento Resolución de expediente por Prueba de rendimiento desempeño temporal lectura de QR ≤ 1.5 s en el automatizada con JMeter percentil 95 |
| Fiabilidad Tolerancia a fallos Cero pérdida de registros ante Prueba de inyección de desconexión de hasta 72 horas fallos sobre el servicio de sincronización |
| Fiabilidad Recuperabilidad Objetivo de tiempo de recuperación Simulacro de restauración ≤ 30 min; objetivo de punto de desde respaldo recuperación ≤ 15 min |
| Seguridad Confidencialidad e Ausencia de vulnerabilidades Análisis dinámico con integridad críticas o altas del top 10 de OWASP ZAP y análisis OWASP estático de seguridad |
| Mantenibilidad Modularidad y Complejidad ciclomática ≤ 10 por Análisis estático con capacidad de prueba función; cobertura de sentencias ≥ SonarQube integrado a la 85 % canalización |
| Mantenibilidad Reusabilidad Reutilización del núcleo de Revisión arquitectónica validación entre cliente móvil y formal por inspección servidor |
| Compatibilidad Interoperabilidad Exportación conforme a los Prueba de contrato sobre esquemas de intercambio exigidos la API pública por la certificadora |
| Adecuación Corrección funcional 100 % de las reglas de negocio con Matriz de trazabilidad funcional al menos un caso de prueba requisito-prueba asociado |
| Usabilidad Operabilidad Registro completo de un evento de Prueba de usabilidad con campo en un máximo de cinco agrónomos en interacciones condiciones reales |
| Portabilidad Capacidad de Despliegue reproducible mediante Prueba de despliegue instalación contenedores en menos de 15 automatizado en entorno minutos limpio |

Nota. La cuantificación de cada umbral es condición necesaria para que el requisito sea verificable; los requisitos no funcionales enunciados de forma cualitativa no son auditables. Elaboración propia con base en ISO (2011).

## IEEE 730: Plan de Aseguramiento de la Calidad del Software

El estándar IEEE 730-2014 establece los requisitos del proceso de aseguramiento de la

calidad del software y determina el contenido mínimo del plan correspondiente, conocido por sus

siglas en inglés como SQAP (IEEE, 2014). Su aporte diferencial respecto de las demás normas

adoptadas consiste en que no describe el producto ni las pruebas, sino la función organizacional

que verifica que los procesos definidos efectivamente se ejecutan.

El SQAP del proyecto contempla las siguientes actividades:

- Auditorías de proceso al cierre de cada incremento, orientadas a verificar la conformidad entre las prácticas declaradas y las evidencias registradas en la canalización de integración continua.

- Revisiones técnicas formales de la arquitectura mediante el método de inspección de Fagan, con roles diferenciados de moderador, lector, autor e inspector, y registro cuantitativo de defectos detectados por hora de inspección (Fagan, 1976).

- Gestión de la configuración del software, con establecimiento de líneas base al cierre de cada incremento y control formal de cambios sobre los artefactos aprobados.

- Gestión de no conformidades, mediante clasificación por severidad, análisis de causa raíz y verificación de la eficacia de la acción correctiva.

- Definición de la independencia organizacional del responsable de calidad respecto de la línea de producción, conforme se representó en la estructura organizacional de la Figura 1.

## ISO/IEC/IEEE 29119: Proceso de Pruebas de Software

La norma ISO/IEC/IEEE 29119 estructura las pruebas de software en procesos

organizacionales, de gestión y dinámicos, y proporciona un vocabulario común para la

documentación y las técnicas de diseño de casos de prueba (ISO, IEC e IEEE, 2022). En el

proyecto se emplea para definir la estrategia de prueba, la documentación mínima exigible y la

selección justificada de técnicas de diseño.

Tabla 10

Estrategia de pruebas estructurada conforme a ISO/IEC/IEEE 29119

| Nivel de prueba Tipo de prueba Técnica de diseño de casos Automatización y herramienta |
| --- |
| Unitario Funcional y Partición de equivalencia, valores Total: Jest y JUnit ejecutados estructural límite y cobertura de decisiones en cada confirmación |
| Integración Funcional y de Pruebas basadas en estado y Total: Supertest y contrato verificación de contratos de API Testcontainers |
| Sistema Extremo a extremo Casos de uso y transición de estados Alta: Cypress sobre el portal y Appium sobre el cliente móvil |
| Sistema Rendimiento y carga Perfiles de carga nominal, de estrés Total: Apache JMeter con y de resistencia umbral de fallo automático |
| Sistema Seguridad Top 10 de OWASP y pruebas de Parcial: OWASP ZAP penetración dirigidas automatizado y revisión manual |
| Sistema Recuperación y Inyección de fallos y simulación de Alta: escenarios automatizados tolerancia a fallos pérdida de conectividad de desconexión |
| Aceptación Aceptación del Criterios de aceptación derivados de Manual, ejecutada por el usuario historias de usuario cliente en sitio |
| Regresión Transversal a todos Selección por análisis de impacto Total: suite ejecutada en cada los niveles sobre módulos afectados solicitud de fusión |

Nota. La matriz de trazabilidad bidireccional entre requisitos y casos de prueba constituye el producto de trabajo que evidencia la cobertura funcional completa. Elaboración propia con base en ISO, IEC e IEEE (2022).

## ISO/IEC 29110: Perfil para Organizaciones Muy Pequeñas

AgroTrace Tech, S. A. clasifica como entidad muy pequeña (very small entity), categoría

que la norma ISO/IEC 29110 define como aquella organización, proyecto o departamento con

hasta veinticinco personas (ISO e IEC, 2018). La adopción del perfil Básico de esta norma cumple

una función de proporcionalidad: acredita un marco de procesos reconocido internacionalmente

sin imponer la carga documental de modelos concebidos para organizaciones de gran escala, como

CMMI-DEV, cuya implantación excedería la capacidad operativa de la empresa en su etapa actual.

*Tabla 11*

*Procesos y productos de trabajo del perfil Básico de ISO/IEC 29110*

| Proceso Actividad Producto de trabajo generado |
| --- |
| Gestión del Proyecto Planificación del proyecto Plan del proyecto con incrementos, iteraciones y asignación de recursos |
| Gestión del Proyecto Ejecución y control Registro de avance, bitácora de riesgos y actas de reunión de iteración |
| Gestión del Proyecto Cierre del proyecto Acta de aceptación y repositorio de configuración congelado |
| Implementación de Análisis de requisitos Especificación de requisitos y matriz de Software trazabilidad inicial |
| Implementación de Diseño arquitectónico y detallado Documento de arquitectura, modelo de datos y Software actas de inspección |
| Implementación de Construcción Código fuente versionado, pruebas unitarias y Software reportes de análisis estático |
| Implementación de Integración y pruebas Casos de prueba, reportes de ejecución e Software informe de defectos |
| Implementación de Entrega del producto Configuración liberada, manual de usuario y Software manual de operación |

Nota. La correspondencia entre los productos de trabajo del perfil Básico y los artefactos que genera de forma natural la práctica de XP evita la duplicidad documental. Elaboración propia con base en ISO e IEC (2018).

## Métricas de Control de Calidad

La operación del marco normativo se materializa mediante un conjunto reducido de

métricas cuantitativas evaluadas de forma automática dentro de la canalización de integración

continua. La complejidad ciclomática de McCabe se emplea como indicador de la capacidad de

prueba del código, bajo el fundamento de que dicha métrica determina el número mínimo de casos

necesarios para alcanzar cobertura de caminos independientes (McCabe, 1976).

*Tabla 12*

*Métricas de calidad, umbrales de aceptación y acción ante incumplimiento*

| Métrica Definición operativa Umbral Acción ante incumplimiento |
| --- |
| Cobertura de Porcentaje de sentencias ejecutadas ≥ 85 % Falla la canalización; se bloquea la sentencias por la suite de pruebas fusión automatizadas |
| Complejidad Número de caminos linealmente ≤ 10 Refactorización obligatoria antes de ciclomática (McCabe) independientes por función aprobar la revisión |
| Densidad de defectos Defectos detectados por cada mil ≤ 1.5 Análisis de causa raíz e inspección líneas de código entregadas formal del módulo |

| Métrica Definición operativa Umbral Acción ante incumplimiento |
| --- |
| Eficiencia de Defectos detectados antes de la ≥ 90 % Revisión y ajuste de la estrategia de remoción de defectos liberación sobre el total de defectos pruebas del incremento |
| Deuda técnica Tiempo estimado de remediación ≤ 5 % del Asignación de capacidad de reportado por el análisis estático esfuerzo refactorización en la iteración siguiente |
| Duplicación de código Porcentaje de líneas duplicadas ≤ 3 % Extracción de abstracciones detectadas por el analizador comunes |
| Tiempo medio de Intervalo entre la detección y la ≤ 48 horas Escalamiento a la Dirección de reparación resolución verificada de un defecto Tecnología y Calidad crítico |

Nota. Los umbrales operan como compuertas de calidad automatizadas; su incumplimiento detiene la promoción del artefacto entre entornos. Elaboración propia.

## HERRAMIENTAS DE DESARROLLO, SISTEMA OPERATIVO Y PLATAFORMA TECNOLÓGICA

La selección del conjunto tecnológico obedece a tres criterios de decisión declarados: la

capacidad de operar de forma confiable en condiciones de conectividad intermitente, la

disponibilidad de instrumentación automatizada para la medición de las métricas de calidad

definidas, y la sostenibilidad económica del licenciamiento para una organización muy pequeña.

En consecuencia, se privilegian componentes de código abierto con soporte de largo plazo y

comunidad activa.

## Plataforma Tecnológica por Categoría

*Tabla 13*

*Detalle de la plataforma tecnológica y herramientas de desarrollo*

| Categoría Herramienta o tecnología Justificación técnica |
| --- |
| Sistema operativo de Ubuntu Server 24.04 LTS Soporte extendido de cinco años, ecosistema de servidor contenedores maduro y bajo costo de licenciamiento |
| Sistema operativo de Windows 11 Pro y Ubuntu Paridad de entorno mediante WSL 2, evitando estación de trabajo Desktop 24.04 LTS divergencias entre desarrollo y producción |
| Sistema operativo móvil Android 10 o superior; iOS 15 Cobertura del parque de dispositivos de campo con o superior soporte a la interfaz de geolocalización requerida |

| Categoría Herramienta o tecnología Justificación técnica |
| --- |
| Lenguajes de TypeScript, Dart y SQL Tipado estático que habilita la detección temprana programación de defectos en tiempo de compilación |
| Backend Node.js 22 LTS con NestJS Arquitectura modular con inyección de dependencias, precondición técnica para el uso de dobles de prueba |
| Frontend web React 18 con Vite y TypeScript Componentización con pruebas aisladas y tiempos de construcción reducidos |
| Cliente móvil Flutter 3 con Dart y Drift sobre Base de código única compilada a nativo, con motor SQLite de persistencia local transaccional |
| Base de datos PostgreSQL 16 con extensión Integridad transaccional ACID y operaciones PostGIS geoespaciales nativas sobre polígonos de parcela |
| Caché y colas Redis 7 Reducción de latencia en consultas de expediente y gestión de colas de sincronización |
| Almacén de objetos MinIO compatible con el Custodia de evidencia fotográfica con verificación protocolo S3 de integridad mediante suma de comprobación |
| Contenedorización Docker y Docker Compose Reproducibilidad de entornos y eliminación de la divergencia entre desarrollo y producción |
| Orquestación Kubernetes (K3s en la fase Escalamiento horizontal y recuperación automática inicial) ante fallo de nodo |
| Control de versiones Git con GitLab Trazabilidad de cambios, revisión por pares y control de acceso al repositorio |
| Integración y despliegue GitLab CI/CD Automatización de compuertas de calidad y continuos despliegue por promoción entre entornos |
| Pruebas unitarias e Jest, Supertest y Testcontainers Ejecución rápida con dependencias reales aisladas integración en contenedores efímeros |
| Pruebas de interfaz Cypress y Appium Verificación extremo a extremo sobre navegador y dispositivo móvil |
| Pruebas de carga Apache JMeter Generación de perfiles de carga y validación automatizada de umbrales de desempeño |
| Análisis estático de SonarQube Community Edition Medición de complejidad ciclomática, duplicación, calidad cobertura y deuda técnica |
| Análisis de seguridad OWASP ZAP y OWASP Detección de vulnerabilidades de aplicación y de Dependency-Check componentes de terceros |
| Documentación de API OpenAPI 3.1 con Swagger UI Contrato ejecutable que habilita pruebas automatizadas de conformidad |
| Gestión del proyecto GitLab Issues con tableros de Trazabilidad directa entre historia de usuario, iteración confirmación de código y caso de prueba |
| Observabilidad Prometheus y Grafana Instrumentación de métricas de disponibilidad y comportamiento temporal en producción |
| Entorno de desarrollo Visual Studio Code y Android Configuración compartida de formato, análisis y integrado Studio depuración entre integrantes |

Nota. La totalidad de las herramientas de verificación se integra a la canalización de integración continua, de modo que las métricas se obtienen sin intervención manual. Elaboración propia.

## Estrategia de Entornos y Promoción de Artefactos

Se definen cuatro entornos con propósito diferenciado. La promoción de un artefacto entre

entornos es automática pero condicionada: únicamente el artefacto que supera la totalidad de las

compuertas de calidad del entorno origen puede desplegarse en el entorno siguiente, lo cual

materializa el principio de que la calidad se verifica antes de avanzar y no después.

*Tabla 14*

*Definición de entornos y compuertas de calidad asociadas*

| Entorno Propósito Datos utilizados Compuerta de promoción |
| --- |
| Desarrollo local Codificación y ejecución del Datos sintéticos generados Pruebas unitarias en verde y ciclo TDD análisis de estilo sin hallazgos |
| Integración Verificación de la interacción Datos sintéticos con Pruebas de integración entre módulos volumen reducido superadas y cobertura ≥ 85 % |
| Aseguramiento de Pruebas de sistema, Datos anonimizados Ausencia de defectos calidad rendimiento, seguridad y derivados de producción críticos y umbrales de aceptación desempeño satisfechos |
| Producción Operación real con Datos reales bajo control de Aprobación formal de la productores y cooperativas acceso RBAC Dirección de Tecnología y Calidad |

Nota. La anonimización de los datos en el entorno de aseguramiento de calidad responde a la obligación de proteger la información comercial sensible de los productores. Elaboración propia.

## Requisitos Mínimos de Infraestructura

- Estación de trabajo de desarrollo: procesador de ocho núcleos, 16 GB de memoria RAM, unidad de estado sólido de 512 GB y virtualización habilitada en firmware.

- Servidor de aplicaciones: cuatro núcleos virtuales, 8 GB de memoria RAM y 100 GB de almacenamiento persistente por instancia.

- Servidor de base de datos: ocho núcleos virtuales, 16 GB de memoria RAM, almacenamiento de estado sólido con respaldo diferencial diario y replicación en espera activa.

- Dispositivo móvil de campo: Android 10 o superior, 3 GB de memoria RAM, receptor GPS con precisión horizontal menor o igual a 10 metros, cámara de 8 megapíxeles y 32 GB de almacenamiento interno.

## CONFIRMACIÓN DE INTEGRANTES DEL PROYECTO DE CURSO

Los integrantes que se detallan a continuación confirman su participación en el proyecto

de curso correspondiente a la asignatura de Aseguramiento de la Calidad del Software, y declaran

conocer y aceptar la asignación de roles técnicos, así como las responsabilidades derivadas del

Plan de Aseguramiento de la Calidad del Software descrito en el presente documento.

*Tabla 15*

*Confirmación de integrantes y responsabilidades asumidas*

| Carné Nombre completo Rol asignado Responsabilidad principal |
| --- |
| 5190-11-6975 Fredy Geovany Martir González Líder técnico y arquitecto de Arquitectura, líneas base de software configuración e inspecciones formales |
| 5190-22-3175 Edgar Daniel Maldonado Pineda Ingeniero de desarrollo y Módulos de dominio y DevOps canalización de integración y despliegue continuos |
| 5190-21-3110 Esdras Josué Ajanel Barrios Ingeniero de aseguramiento SQAP, estrategia de pruebas de la calidad y administración de métricas de calidad |

Nota. Los tres integrantes participan en actividades de codificación bajo el esquema de propiedad colectiva del código propio de XP. Elaboración propia.

\__________________________________

Fredy Geovany Martir González — 5190-11-6975

\__________________________________

Edgar Daniel Maldonado Pineda — 5190-22-3175

\__________________________________

Esdras Josué Ajanel Barrios — 5190-21-3110

## CONCLUSIONES

La combinación de un modelo de ciclo de vida incremental con la metodología de

Programación Extrema resulta coherente con la naturaleza del sistema AgroChain ERP, en tanto

permite entregar valor verificable de forma progresiva mientras se sostiene una disciplina de

ingeniería que produce evidencia objetiva y auditable en cada iteración.

La articulación de ISO/IEC 25010, IEEE 730, ISO/IEC/IEEE 29119 e ISO/IEC 29110

cubre los cuatro planos necesarios del aseguramiento de la calidad —producto, función

organizacional, proceso de pruebas y procesos mínimos de la organización— sin generar

duplicidad documental ni imponer una carga desproporcionada a una entidad muy pequeña.

La definición cuantitativa de umbrales de aceptación y su verificación automatizada

dentro de la canalización de integración continua transforma el aseguramiento de la calidad en un

control preventivo y no correctivo, lo cual reduce el costo de remediación de los defectos al

detectarlos en las etapas más tempranas del ciclo de vida.

## REFERENCIAS

- Beck, K., y Andres, C. (2004). Extreme programming explained: Embrace change (2.ª ed.). Addison-Wesley.

- Fagan, M. E. (1976). Design and code inspections to reduce errors in program development. IBM Systems Journal, 15(3), 182-211.

- Institute of Electrical and Electronics Engineers. (2014). IEEE standard for software quality assurance processes (IEEE Std 730-2014). IEEE.

- McCabe, T. J. (1976). A complexity measure. IEEE Transactions on Software Engineering, SE- 2(4), 308-320.

- Organización Internacional de Normalización y Comisión Electrotécnica Internacional. (2011). Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models (ISO/IEC 25010:2011). ISO.

- Organización Internacional de Normalización y Comisión Electrotécnica Internacional. (2018). Systems and software engineering — Lifecycle profiles for Very Small Entities (VSEs) — Part 4-1: Software engineering profile specifications (ISO/IEC 29110-4-1:2018). ISO.

- Organización Internacional de Normalización, Comisión Electrotécnica Internacional e Institute of Electrical and Electronics Engineers. (2022). Software and systems engineering — Software testing — Part 1: General concepts (ISO/IEC/IEEE 29119-1:2022). ISO.

- Pressman, R. S., y Maxim, B. R. (2020). Ingeniería del software: Un enfoque práctico (9.ª ed.). McGraw-Hill.

- Sommerville, I. (2016). Software engineering (10.ª ed.). Pearson.
