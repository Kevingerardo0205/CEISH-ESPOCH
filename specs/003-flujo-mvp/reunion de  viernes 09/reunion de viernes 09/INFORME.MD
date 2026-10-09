No se modificó ningún archivo del repositorio. Informe final:
1. RESUMEN EJECUTIVO
 1. La auditoría anterior contenía dos errores graves que esta ejecución con BD real corrige: (a) las entidades ORM sí coinciden con el esquema PostgreSQL vivo; (b) los tests E2E sí pasan (3/3 suites, 6/6 tests). Ambos fallos anteriores se debieron a inferir desde dumps/migraciones y a ejecutar E2E con la BD apagada.
 2. Las 55 migraciones aplicadas corresponden a 51 archivos ↔ 51 filas en public.migrations, coincidencia 1:1 sin drift. Existen 2 colisiones de timestamp (1789000000000, 1797000000000).
 3. Tipos reales verificados: convocatorias.id uuid, convocatoria_protocolos.id/convocatoria_id uuid, protocolo_id/version_id INTEGER (public.protocolos.id y public.versiones_protocolo.id son integer).
 4. RF-09.2 no existe en ninguna capa: cero coincidencias de AgendaSectionType, AgendaItemType, tipo_punto_agenda, INFORME_INICIO/AVANCE/FINAL en src/. El único campo de clasificación persistido es convocatoria_protocolos.orden (integer).
 5. RF-15.2 no existe: seguimiento tiene 4 tablas y catalogos.tipos_seguimiento existe pero tiene 0 filas; src/modules/follow-up/ son 19 carpetas vacías y no está registrado en app.module.ts.
 6. Numeración atómica no garantizada: ORDER BY numero_convocatoria DESC en PostgreSQL ordena NULLS FIRST, y la BD ya contiene una fila con numero_convocatoria nulo → la secuencia puede reiniciarse en 1. CallsService usa count()+1 sin ninguna garantía atómica (solo el UNIQUE lo salva, con error 500 no manejado).
 7. El flujo de actas y quórum es código muerto: nada en el repositorio crea filas en evaluacion.sesiones (0 filas), por lo que signMinutes es inalcanzable y la Sección I no tiene ruta de datos.
 8. Divergencia de tipo confirmada: SessionOrmEntity.convocatoriaId declara uuid, pero la columna real evaluacion.sesiones.convocatoria_id es character varying y sin FK.
 9. create-meeting.use-case.ts:3-6 importa CreateMeetingParams e IMeetingPdfGeneratorPort desde meeting-repository.port, que no los exporta → error de compilación real.
10. El puerto PDF está enlazado a un mock (evaluations.module.ts:55-63) que devuelve una URL ficticia; el generador real PdfGeneratorService.generateCallPdf solo lo usa CallsService.
11. Dos rutas canónicas en conflicto (/evaluations/calls protegida vs /evaluations/meetings desprotegida) escriben las mismas dos tablas con reglas de negocio divergentes.
12. Se verificó reutilización posible: catalogos.tipos_estudio.requiere_informe_inicio/requiere_informe_final/periodicidad_informe_dias y gestion.renovaciones.tiene_informes_avance ya modelan qué informes RF-15 aplican.
13. catalogos.tipos_seguimiento con 0 filas impide derivar por inspección los códigos de tipo de informe: requiere decisión+y seed.
14. La numeración real en BD es dato de prueba: 10 convocatorias (una sin número, 9 con fecha_reunion idéntica) y 8 ítems, todos orden=1 sobre el mismo protocolo 165 / versión 137.
15. Clasificación final: 3 IMPLEMENTADAS (001, 002, 003), 7 PARCIALES (004, 005, 010, 011, 012, 013, 004→…), 0 DOCUMENTACIÓN_INCORRECTA, resto NO_IMPLEMENTADA. 0 errores de compilación y 415 de ESLint impiden cerrar TSK-009-014.
Efectos colaterales de esta fase (declarados): se inició Docker Desktop (lo que re-levantó los contenedores con restart: always, incluido ceish_api y ceish_pgadmin) y se levantó el servicio db. La ejecución de npm run test:e2e escribió 1 fila en evaluacion.convocatorias y 1 en convocatoria_protocolos (de 9→10 y 7→8). El pg_dump se guardó fuera del repositorio, en C:\Users\Usuario\AppData\Local\Temp\opencode\. Cero escrituras al repositorio (59 archivos modificados/no versionados, todos preexistentes).
2. ESTADO REAL DE TSK-009-001 → TSK-009-014
Tarea	Requisito	Estado documental	Estado real del código
TSK-009-001 VOs 001-YYYY y precedencia	RF-09.1	[x]	Ambos VOs existen y son funcionales. MeetingNumberValueObject valida formato y año ≥2000; MeetingDatesValueObject valida deadline >= meeting → BadRequest. Ambos importan BadRequestException de @nestjs/common
TSK-009-002 Cálculo del jueves previo	RF-09.1	[x]	CalculateMeetingDatesService existe; algoritmo por getDay() cubre jueves→jueves anterior, viernes/sábado→jueves de la semana, dom/lun/mar/mié→jueves de la semana previa. Fija 23:59:59.999 en hora local
TSK-009-003 Entidades convocatorias y lugares	RF-09.1	[x]	Verificado contra el DDL real: id uuid, lugar_id uuid, tipo_session/estado enums idénticos a los 12 enums de BD, created_at/updated_at timestamptz, unique en numero_convocatoria. El único defecto: no mapea 10 columnas legacy huérfanas
TSK-009-004 Puertos repo + PDF	RF-09.1	[x]	Los tokens IoC existen (evaluations.module.ts:106,112), pero meeting-repository.port.ts:1 importa ConvocatoriaOrmEntity desde infraestructura, CreateMeetingParams está mal ubicado en el archivo del PDF, y create-meeting.use-case.ts:3-6 importa símbolos no exportados por el puerto → no compila
TSK-009-005 Numeración SERIALIZABLE+FOR UPDATE	RF-09.1	[x]	Usa ambos mecanismos, pero no garantiza atomicidad: ORDER BY numero_convocatoria DESC ⇒ NULLS FIRST; FOR UPDATE no bloquea nada si el año no tiene filas; solo se mapea 40001 y no 23505; no hay reintento; fechaPlazoNormativo = new Date() en vez del plazo normativo del protocolo
TSK-009-006 Enums AgendaSectionType/AgendaItemType	RF-09.2, RF-15.2	[ ]	src/shared/enums/agenda-section.enum.ts no existe; 0 coincidencias en todo src/
TSK-009-007 tipo_punto_agenda + informe_seguimiento_id	RF-09.2, RF-15.2	[ ]	La entidad no declara ninguna de las dos columnas. BD confirma que tampoco existen
TSK-009-008 followUpReportIds en DTO	RF-09.2, RF-15.2	[ ]	create-meeting.dto.ts solo acepta sessionType, meetingDate, evalSubmissionDeadline, locationId, protocolVersionIds. Sin followUpReportIds
TSK-009-009 Persistencia de ítems de seguimiento	RF-09.1, RF-09.2	[ ]	saveMeetingWithAtomicNumber solo itera protocolVersionIds; nunca escribe tipo de ítem ni referencia de seguimiento
TSK-009-010 Use case con agenda estructurada	RF-09.1/09.2/15.2	[ ]	El use case crea la convocatoria y devuelve {id, meetingNumber, pdfUrl} (contrato base cumplido), pero no valida agenda mínima, no discrimina secciones y pide el PDF al mock
TSK-009-011 PDF con 4 secciones	RF-09.2, RF-09.1	[ ]	PdfGeneratorService.generateCallPdf (línea 897) es real y reutilizable, pero su agenda es una lista de 3 textos libres (Lectura y aprobación del acta…, Análisis de comunicaciones…, Cierre de la sesión…), no las 4 secciones normativas ni los 5 tipos de ítem
TSK-009-012 POST + GET /:id	RF-09.1, RF-09.2	[ ]	POST / y POST /calculate-eval-date existen; GET /:id no existe; sin guards (importa UseGuards y no lo usa), sin @ApiTags, sin @Audit, sin validación de rol
TSK-009-013 E2E de meetings	RF-09.1, RF-09.2	[ ]	test/meetings.e2e-spec.ts existe y pasa. Cubre 2 de 4 escenarios: no prueba atomicidad (solo regex ^\d{3}-\d{4}$), no prueba las 4 secciones y no existe prueba del GET /:id. Escribe en la BD de desarrollo sin cleanup
TSK-009-014 Suite de calidad en verde	Todos	[ ]	npm test ✅ 32 suites/97 tests · npm run test:e2e ✅ 3/3 suites, 6/6 tests · npx tsc --noEmit ❌ >50 errores · npx eslint ❌ 446 problemas (415 errores) · npm run build ✅ (falso verde: Nest usa SWC sin type-check)
3. INCONSISTENCIAS DOCUMENTACIÓN ↔ CÓDIGO
Documento	Afirmación	Realidad verificada
tasks-rf09-convocatorias.md L24-35	TSK-009-001 "Value Objects puros de dominio"	Ambos importan BadRequestException desde @nestjs/common
tasks L48-59	TSK-009-003 "Mapeo ORM verificado contra el esquema PostgreSQL real"	Verdadero, pero solo para 11 de 21 columnas de convocatorias y 8 de 16 de convocatoria_protocolos
tasks L61-72	TSK-009-004 "Puertos de abstracción"	El puerto de repositorio importa una entidad ORM de infraestructura
tasks L74-83	TSK-009-005 "numeración correlativa anual única"	No hay unicidad garantizada; FOR UPDATE sobre MAX no serializa la primera inserción del año
spec.md L108	"numeración correlativa atómica por año lectivo"	CallsService usa count()+1; MeetingTypeOrmRepository usa un lock incompleto
spec.md L111	fecha_plazo_normativo "proviene del cálculo normativo (45/60 días hábiles)"	meeting-typeorm.repository.ts:90 escribe new Date() (fecha de creación)
spec.md L112	fecha_entrega_evaluacion "jueves previo 23:59:59"	Correcto, pero en hora local del servidor sobre columna timestamptz
spec.md L110	"advertencia suave no bloqueante si se excede el plazo"	evaluateSoftWarnings existe pero nadie lo invoca
spec.md L114	"Sección I: acta de la sesión anterior"	evaluacion.actas enlaza a sesiones (integer, 0 filas) y no a convocatorias
spec.md L116 / L131	Sección III + informes de seguimiento	0 código, 0 columnas, tipos_seguimiento vacío
reconciliation.md	Endpoints, guards y tablas de RF-09 declarados completos	/evaluations/meetings sin guards; sin GET /:id; enums y tablas RF-09.2 inexistentes
AGENTS.md	"synchronize: true in non-prod"	database.config.ts:12 tiene synchronize: false
AGENTS.md / constitution.md	Migraciones como fuente de esquema	Divergen del DDL real: los archivos describen un modelo que las migraciones aplicadas corrigieron
plan-rf09-convocatorias.md	Pseudocódigo SELECT MAX() FOR UPDATE como prueba de corrección	El pseudocódigo es示意; el código real tiene defectos que el documento no menciona
4. DUPLICACIONES DETECTADAS
Concepto	Archivo A	Archivo B	Diferencia
Crear convocatoria	application/services/calls.service.ts:188	infrastructure/repositories/meeting-typeorm.repository.ts:22	A: count()+1, transacción READ COMMITTED, PDF real + email, actualiza deadline de asignaciones. B: SERIALIZABLE + FOR UPDATE, PDF mock, fechaPlazoNormativo = now()
Calcular jueves previo	calls.service.ts:174 (privado)	calculate-meeting-dates.service.ts:13	Lógica equivalente por distinto algoritmo (bucle while vs. tabla de días)
Endpoint de creación	calls.controller.ts:111	meetings.controller.ts:39	A: JwtAuthGuard+RolesGuard, @Roles, @Audit, Swagger. B: sin seguridad ni Swagger
Consulta de convocatoria	calls.controller.ts:133 (GET /:id)	meetings.controller.ts (no existe)	Solo A existe y cumple RF-09.2 parcialmente
Entidad "sesión"	entities/convocatoria.orm-entity.ts (uuid)	database/session.entity.orm.ts:31 (uuid sobre columna varchar real)	Dos modelos del mismo concepto con PK uuid vs integer
Acta / minutas	calls.service.ts:416 (signMinutes)	evaluacion.actas + MinutesOrmEntity	Servicio activo sobre tabla huérfana sin filas de sesión
Generación de PDF	shared/utils/pdf-generator.service.ts:897	evaluations.module.ts:55 (mock del puerto)	Real vs. URL ficticia
Puerto de params	domain/ports/meeting-pdf-generator.port.ts:1	—	CreateMeetingParams (contrato de creación) dentro del archivo del puerto PDF
Notificación de convocatoria	calls.service.ts:342 (sendCallNotification)	infrastructure/adapters/mailer-notification.adapter.ts	前者 con PDF adjunto;后者 genérica
5. INCONSISTENCIAS DE BASE DE DATOS
Tabla / Columna	Tipo real (verificado en PostgreSQL)	Declarado en código
evaluacion.convocatorias.id	uuid PK	uuid
evaluacion.convocatorias.numero_convocatoria	varchar(20) UNIQUE	varchar(20) unique
evaluacion.convocatorias.codigo	varchar(50) UNIQUE, legacy, sin mapear	no mapeado
evaluacion.convocatorias legacy	fecha, hora, tipo_sesion, estado_id, resumen_agenda, creado_por, creado_en, actualizado_en, eliminado_en	no mapeadas
evaluacion.lugares.id	uuid PK, 0 filas	uuid
evaluacion.convocatoria_protocolos.id / convocatoria_id	uuid / uuid NOT NULL FK CASCADE	uuid
evaluacion.convocatoria_protocolos.protocolo_id	integer NOT NULL FK RESTRICT	integer
evaluacion.convocatoria_protocolos.version_id	integer NOT NULL FK RESTRICT	integer
evaluacion.convocatoria_protocolos.orden	integer NOT NULL	integer
evaluacion.convocatoria_protocolos legacy	version_protocolo_id, resultado_id, fecha_reunion, fecha_entrega_evaluacion	no mapeadas
Índices de convocatoria_protocolos	Solo el PK	—
tipo_punto_agenda	No existe en ninguna tabla	—
informe_seguimiento_id	No existe	—
evaluacion.sesiones.id	integer PK (SERIAL)	integer
evaluacion.sesiones.convocatoria_id	character varying, sin FK	uuid + @ManyToOne en la misma columna
evaluacion.sesiones.attendeesCount	integer (camelCase)	no mapeado
evaluacion.sesiones	0 filas	—
evaluacion.actas	integer PK, sesion_id NOT NULL → sesiones; resumen_agenda, decisiones_tomadas/voting jsonb; numero_acta	MinutesOrmEntity mapea subconjunto
evaluacion.acta_protocolo	PK compuesta (acta_id, protocolo_id)	—
catalogos.tipos_seguimiento	codigo UNIQUE, plazos, 0 filas	—
seguimiento.seguimientos	integer PK, informe_recibido, fecha_recepcion_informe, evaluado_por, aprobado; sin estado de selección para Pleno; 0 filas	—
seguimiento.informes_seguimiento	contenido, enviado_por; sin columna de tipo de informe	—
catalogos.tipos_estudio	4 filas: IO(180), EI(90), EC(90), EX(0) con requiere_informe_inicio/requiere_informe_final	no mapeado en RF-15
gestion.renovaciones.tiene_informes_avance	boolean nullable	no usado
evaluacion.item_estado_enum	C/NC/NA, usada por ninguna tabla	—
Enums de BD	12 enums; ninguno de agenda	—
Estado de migraciones	51 archivos ↔ 51 filas, 1:1, 0 pendientes; 2 colisiones de timestamp	—
Datos de convocatorias	10 filas: 9 con 001-2026…009-2026, 1 sin número; todas con fecha_reunion 2026-04-16; lugar_id NULL	—
Datos de convocatoria_protocolos	8 filas, todas orden=1, mismo protocolo_id=165/version_id=137	—
6. PROBLEMAS ARQUITECTÓNICOS
Violación	Ubicación	Gravedad
Dominio → NestJS	meeting-dates.vo.ts:1, meeting-number.vo.ts:1	ALTO
Dominio → Infraestructura	meeting-repository.port.ts:1	CRÍTICO
Puerto mal ubicado	meeting-pdf-generator.port.ts:1	ALTO
Import inexistente	create-meeting.use-case.ts:3-6	CRÍTICO
Aplicación → Infraestructura	create-meeting.dto.ts:10	MEDIO
Aplicación → ORM directo	calls.service.ts:225-310	CRÍTICO
Mock en producción	evaluations.module.ts:55-63	CRÍTICO
Endpoint sin autenticación	meetings.controller.ts:14-19	CRÍTICO
Mapper de dominio inexistente	calls.service.ts:188	MEDIO
Doble camino de escritura	CallsService vs MeetingTypeOrmRepository	CRÍTICO
Columna doble mapeada	session.entity.orm.ts:31-36	CRÍTICO
follow-up no registrado	src/app.module.ts	ALTO
Número mágico de estado	calls.service.ts:457	MEDIO
Silencio de errores	calls.service.ts:326-329, 353-358	MEDIO
Sin cleanup en E2E	test/meetings.e2e-spec.ts	MEDIO
catch (error) sin tipado	meeting-typeorm.repository.ts:99	MEDIO
Dependencias válidas confirmadas	evaluations → protocols/reception/resolved vía forwardRef; shared/ sin箭头 inversos	—
7. RF-09.1
Numeración anual. El requisito es un contador correlativo único por año lectivo compartido entre sesiones ordinarias y extraordinarias, formato 001-2026. El formato existe y está validado por MeetingNumberValueObject (/^(\d{3,})-(\d{4})$/, año ≥ 2000). La unicidad está garantizada exclusivamente por el UNIQUE de numero_convocatoria; ninguna lógica de aplicación lo garantiza. Hay dos generadores: CallsService:198-202 (count()+1, sin locking, reutiliza números si se borran filas y cuenta filas con número nulo) y MeetingTypeOrmRepository:35-51 (SERIALIZABLE + FOR UPDATE). El segundo tiene un defecto específico de PostgreSQL: ORDER BY numero_convocatoria DESC usa NULLS FIRST por defecto, de modo que si existe una fila del año con número nulo devuelve NULL, result[0]?.max es undefined y nextSequence vuelve a 1, provocando violación de UNIQUE (23505) no manejada → HTTP 500. Además, FOR UPDATE sobre la fila máxima no serializa dos primeras inserciones concurrentes de un año vacío (no hay fila que bloquear), y no existe reintento pese a declarar SERIALIZABLE. La columna anio_lectivo es nullable, por lo que la fila huérfina existente (anio_lectivo NULL) queda fuera del filtro: el defecto está latente y armado, no activo. Estado: PARCIAL. La atomicidad exigida por spec.md L108 y por la constitution no está garantizada.
Fechas normativas. Las tres fechas exigidas (fecha_plazo_normativo, fecha_reunion, fecha_entrega_evaluacion) existen, pero con un defecto semántico: meeting-typeorm.repository.ts:90 persiste fechaPlazoNormativo = new Date() (momento de la inserción) en lugar del plazo normativo calculado (45/60 días hábiles según spec.md L111). CallsService:280-284 sí usa protocol.responseDeadline. Ninguna ruta escribe nunca fecha_plazo_normativo desde ProtocolDeadlineService. Estado: PARCIAL.
Regla de precedencia. MeetingDatesValueObject valida evalSubmissionDeadline >= meetingDate → BadRequestException('FECHA_EVALUACION_INVALIDA'). La regla dura de spec.md L112 se cumple y está probada tanto en unitario como en E2E (meetings.e2e-spec.ts:55-72). Observación: el VO solo conoce 2 de las 3 fechas normativas; fecha_plazo_normativo no participa de la validación. Estado: IMPLEMENTADA.
Jueves previo. CalculateMeetingDatesService cubre los casos requeridos: jueves → jueves anterior (7 días), viernes/sábado → jueves de la misma semana, domingo/lunes/martes/miércoles → jueves de la semana previa; fija 23:59:59.999. Riesgo real: usa setHours() sobre hora local del servidor y almacena en timestamptz; con contenedor en UTC, el deadline efectivo para Ecuador es 18:59 local, cinco horas antes de lo specificationado. No hay tests de zona horaria. Estado: IMPLEMENTADA con riesgo de zona horaria.
Advertencias. evaluateSoftWarnings existe pero no es invocado por ningún servicio ni use case: la advertencia suave de spec.md L110 nunca se emite. Estado: NO IMPLEMENTADA (funcionalmente).
Generación de convocatoria. El PDF real existe (PdfGeneratorService.generateCallPdf) y el correo real se despacha (IEmailServicePort.sendCallNotification con PDF adjunto a EVALUADOR y PRESIDENTE). Sin embargo, ese flujo pertenece a CallsService; el endpoint POST /api/evaluations/meetings usa el mock. orden_dia_pdf_path existe en BD y nadie lo escribe (10/10 filas nulas). Estado: PARCIAL, y disponible para reutilización.
8. RF-09.2
No existe implementación en ninguna capa. Búsqueda exhaustiva en src/: 0 coincidencias de AgendaSectionType, AgendaItemType, tipoPuntoAgenda, tipo_punto_agenda, agendaItem, seccionAgenda, INFORME_INICIO, INFORME_AVANCE, INFORME_FIN. En BD: 0 columnas y 0 tablas de agenda; el único campo de clasificación persistido es convocatoria_protocolos.orden (integer, NOT NULL, sin default, sin índice único). El único enum potencialmente related, evaluacion.item_estado_enum (C/NC/NA), está sin uso por ninguna tabla y corresponde a semántica de criterios de evaluación, no de agenda: no debe reutilizarse para agenda.
Sobre la identidad de dominio de los números romanos. Los romanos I–IV son hoy presentación: no existen ni como enum, ni como columna, ni como valor de orden. orden es un entero secuencial plano cuyo único consumidor es order: { orden: 'ASC' } en CallsService:404 y el bucle order++ de MeetingTypeOrmRepository:70-89. Los datos lo confirman: las 8 filas tienen orden = 1. Por tanto, orden es posición, no tipo, y no puede derivarse la sección a partir de él. La sección debe ser un atributo explícito del ítem; la posición debe seguir siendo un entero (útil para reordenar y para el UNIQUE(convocatoria_id, orden) que hoy falta).
Viabilidad de la clasificación en el modelo actual. La sección I (acta anterior) no puede representarse en convocatoria_protocolos: esa tabla exige protocolo_id y version_id NOT NULL, y el acta vive en evaluacion.actas → sesiones (0 filas, sin FK a convocatorias). La sección III tampoco: no hay informe_seguimiento_id ni tabla de informes linked. Conclusión: reutilizar orden es insuficiente; se requiere una entidad de ítem de agenda que soporte tres discrimina (protocolo de evaluación, informe de seguimiento, acta) sin forzar protocolo_id NOT NULL. Esa decisión de modelado está en la sección 13 porque no se resuelve por inspección.
9. RF-15.2
Infraestructura de datos: existe, código: no existe. Hay 4 tablas en el schema seguimiento (seguimientos, informes_seguimiento, informe_documento, eventos_adversos), todas con 0 filas, y catalogos.tipos_seguimiento con la estructura correcta (codigo UNIQUE, plazo_dias_desde_aprobacion, plazo_dias_desde_finalizacion, requiere_evaluacion) pero 0 filas. src/modules/follow-up/ contiene 19 carpetas y 0 archivos, y no está importado en app.module.ts.
El viaje exigido por la spec no tiene ningún tramo implementado:
Tramo	Estado	Evidencia
Informe de seguimiento	Datos uniquement	seguimiento.informes_seguimiento (contenido/enviado_por), sin tipo de informe
Pendiente de presentación	Datos únicamente	seguimiento.seguimientos.fecha_vencimiento, estado_id, informe_recibido
Presentado	Datos únicamente	informe_recibido (bool) + fecha_recepcion_informe
Disponible para Pleno	Ausente	No hay estado, flag ni consulta de bandeja para Secretaría
Seleccionado por Secretaría	Ausente	Ningún endpoint ni servicio
Incluido en Sección III	Ausente	Sin tipo_punto_agenda, sin informe_seguimiento_id
Convocatoria	Parcial	Solo ítems de protocolo
Orden del Día	Ausente	Sin secciones
Pronunciamiento del Pleno. spec.md L131 exige Aprobado, Observado, Convalidado, Cierre Definitivo. El modelo actual solo tiene seguimientos.aprobado boolean y observaciones_evaluacion text: no puede representar 4 desenlaces. catalogos.estados podría locus, pero tipos_seguimiento vacío impide derivar los códigos.
Dependencias reutilizables descubiertas (no crear de cero). catalogos.tipos_estudio.requiere_informe_inicio, .requiere_informe_final y .periodicidad_informe_dias ya determinan, por tipo de estudio (4 filas, 134 de 135 protocolos con tipo_estudio_id), qué entregables aplican; gestion.renovaciones.tiene_informes_avance cubre el avance. Estas columnas resuelven "qué informes tocan" y deben ser la fuente, no un nuevo conjunto de flags.
Precedente de informe_seguimiento_id. La alternativa de agregar esa columna a convocatoria_protocolos (TSK-009-007) sí es viable técnicamente porque informe_seguimiento_id sería integer (PK de informes_seguimiento es integer) y no crearía colisión de tipos. Sin embargo, introduce acoplamiento indebido: evaluations escribiría una FK hacia el schema seguimiento y quedaría atada a la granularidad de informes_seguimiento (1 informe = 1 fila con contenido text), que no modela anexos ni tipos. Se recomienda una tabla de ítems de agenda en evaluacion con discriminante y FK opcional a seguimiento.informes_seguimiento, dejando la clasificación en el lado de evaluacion y el contenido en el lado de seguimiento. Ver sección 13.
10. RIESGOS CRÍTICOS
Ordenados por criticidad, sin puntuaciones.
 1. Creación de convocatorias sin autenticación. MeetingsController no aplica JwtAuthGuard ni RolesGuard pese a importarlos. Evidencia: meetings.controller.ts:4-19; el E2E crea una convocatoria sin token y obtiene 201. Impacto: cualquier cliente anónimo puede generar numeración oficial, displacement del correlativo y notificaciones. Archivo: meetings.controller.ts. Requisito: RF-09.1. Recomendación: replicar la cadena JwtAuthGuard → RolesGuard + @Roles(SECRETARIA, PRESIDENTE, ADMIN_TI) + @Audit de CallsController sobre la ruta canónica.
 2. Numeración correlativa no atómica con dos algoritmos divergentes. Evidencia: calls.service.ts:198-202 (count()+1) frente a meeting-typeorm.repository.ts:35-51; UNIQUE en numero_convocatoria como única red; NULLS FIRST en DESC; 23505 no manejada; FOR UPDATE ineffective con año vacío. Impacto: números duplicados o reutilizados, que es el identificador legal de la convocatoria. Archivos: ambos. Requisito: RF-09.1, spec.md L108. Recomendación: una única ruta canónica con contador por año lectivo protegido por fila de bloqueo o INSERT ... ON CONFLICT con reintento acotado sobre 40001/23505.
 3. Flujo de actas, quórum y Sección I inerte. Evidencia: evaluacion.sesiones con 0 filas y ningún save/create de SessionOrmEntity en todo src; evaluacion.actas.sesion_id NOT NULL; acta_protocolo une solo con actas. Impacto: POST /calls/minutes/:id/sign es inalcanzable, quorum_alcanzado nunca se calcula y la Sección I del Orden del Día no tiene origen de datos. Archivos: calls.service.ts:416-479, session.entity.orm.ts, minutes.entity.orm.ts. Requisito: RF-09.2 Sección I.
 4. Divergencia de tipo UUID vs varchar en sesiones.convocatoria_id. Evidencia: DDL real character varying sin FK frente a @Column({type:'uuid'}) + @ManyToOne sobre la misma columna. Impacto: fallos en tiempo de ejecución al escribir o al resolver la relación, y synchronize: false impide que la divergencia se detecte automáticamente. Archivo: session.entity.orm.ts:31-36. Recomendación: consolidar en el modelo uuid y alinear la columna por migración, o retirar la entidad del contenedor.
 5. Capa de aplicación coupled a TypeORM y entidades ORM expuestas en la API. Evidencia: calls.service.ts:225-310 persiste con queryRunner.manager; :188 retorna ConvocatoriaOrmEntity; meeting-repository.port.ts:1 importa infraestructura. Impacto: imposible testear sin base de datos, viola la constitution y filtra el modelo de persistencia al frontend. Requisito: todos.
 6. El PDF oficial del Orden del Día se produce por un mock en la rutarf-09 canónica. Evidencia: evaluations.module.ts:55-63; orden_dia_pdf_path nulo en 10/10 filas. Impacto: la convocatoria "exitosa" no tiene documento oficial, incumpliendo el criterio EARS de spec.md L118. Requisito: RF-09.1/RF-09.2.
 7. tipo_punto_agenda inexistente y convocatoria_protocolos bloqueada para RF-15.2. Evidencia: protocolo_id/version_id NOT NULL; sin índices únicos; 8 filas con orden=1. Impacto: imposible distinguir evaluación inicial, subsanación, informe de inicio, avance o fin; imposible garantizar orden único. Requisito: RF-09.2, RF-15.2.
 8. catalogos.tipos_seguimiento vacío. Evidencia: 0 filas con codigo UNIQUE. Impacto: no existe el discriminante de tipo de informe; la clasificación de RF-15.2 no puede derivarse por inspección y depende de decisión + seed. Requisito: RF-15.1/15.2.
 9. Error de compilación que invalida la ruta meetings. Evidencia: create-meeting.use-case.ts:3-6 importa símbolos no exportados; >50 errores de tsc; npm run build reporta éxito por SWC. Impacto: el artefacto desplegado no respeta los tipos y el fallo aparece en runtime. Requisito: TSK-009-014.
10. Módulo follow-up inexistente pese a tener 4 tablas en BD. Evidencia: 19 carpetas vacías, sin FollowUpModule en app.module.ts. Impacto: RF-15.2 no tiene punto de entrada; las tablas quedarán huérfanas. Requisito: RF-15.2.
11. ORDEN DE IMPLEMENTACIÓN RECOMENDADO
 1. Congelar la ruta canónica antes de escribir código. Decidir Calls como única ruta (ya confirmado) y declarar Meetings como alias o retirarlo. Sin esto, cualquier corrección se duplica.
 2. Restaurar la compilabilidad. Resolver el import de create-meeting.use-case.ts, reubicar CreateMeetingParams en el puerto de repositorio y quitar la dependencia infrastructure→domain→ORM. Es前置 de cualquier otra cosa: hoy no hay red de seguridad de tipos.
 3. Limpieza de estado y de datos de prueba. Las columnas legacy de convocatorias y convocatoria_protocolos y la fila huérfana con numero_convocatoria nulo son las que hacen fallar ORDER BY ... DESC. Debe definirse si se depuran o se marcan, antes de tocar la numeración.
 4. Unificar la numeración en una sola implementación atómica. Portar el aislamiento transaccional de MeetingTypeOrmRepository a la ruta canónica y corregir NULLS FIRST (NULLS LAST o filtro IS NOT NULL), mapear 23505, agregar reintento acotado y validar contra la BD real.
 5. Corregir fecha_plazo_normativo. Usar el plazo normativo real del protocolo en lugar de new Date(), y definir la zona horaria de referencia para las 23:59:59.999.
 6. Decidir el modelo de ítem de agenda y persistir la clasificación. Crear el enum canónico y la columna/tabla que soporte los tres discrimina (protocolo, informe de seguimiento, acta). Antes de esto no tiene sentido avanzar en DTO, use case, controlador o PDF, porque los tres dependen de la misma forma.
 7. Restaurar la cadena de sesión y acta (o eliminarla del alcance). Sin filas en sesiones, la Sección I y el quórum no tienen ruta. Depende del paso 3 para no perpetuar el uuid/varchar.
 8. Solo entonces: DTO, puerto, repositorio, use case, controlador y PDF, en ese orden, porque cada capa consume el contrato de la anterior. El PDF reutiliza PdfGeneratorService y solo añade agrupación seccional.
 9. Seed de catalogos.tipos_seguimiento y módulo follow-up con su lectura de bandeja, antes de exponer la Sección III.
10. E2E y calidad al final, pero antes darlos por cerrados: extender test/meetings.e2e-spec.ts con concurrencia real (dos inserciones simultáneas), GET /:id con 4 secciones, y exigir tsc/ESLint limpios.
12. ARCHIVOS QUE SERÍA NECESARIO MODIFICAR
CREAR
- src/shared/enums/agenda-section.enum.ts — AgendaSectionType (I–IV) y AgendaItemType (5 tipos).
- src/modules/evaluations/infrastructure/database/entities/convocatoria-agenda-item.orm-entity.ts — ítem de agenda con discriminante, orden, FK opcional a informe de seguimiento y a acta.
- src/modules/follow-up/follow-up.module.ts + domain/, application/, infrastructure/ mínimos para la bandeja de informes.
- test/meetings-concurrency.e2e-spec.ts — prueba de atomicidad real.
- Migración para la columna discriminante, los índices UNIQUE(convocatoria_id, orden) y el seed de catalogos.tipos_seguimiento.
MODIFICAR
- src/modules/evaluations/infrastructure/controllers/meetings.controller.ts — guards, roles, auditoría, Swagger, GET /:id.
- src/modules/evaluations/application/services/calls.service.ts — numeración atómica unificada, fecha_plazo_normativo real, mapeo de dominio, no persistencia directa.
- src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts — NULLS LAST, 23505, reintento, plazo normativo; o su eliminación si se consolida.
- src/modules/evaluations/domain/ports/meeting-repository.port.ts — quitar import de ORM, reubicar CreateMeetingParams.
- src/modules/evaluations/domain/ports/meeting-pdf-generator.port.ts — dejar solo el contrato de PDF.
- src/modules/evaluations/application/services/create-meeting.use-case.ts — imports, agenda estructurada, agenda mínima, PDF real.
- src/modules/evaluations/application/dtos/create-meeting.dto.ts — followUpReportIds, enum de dominio en vez de entidad ORM.
- src/modules/evaluations/domain/value-objects/meeting-dates.vo.ts y meeting-number.vo.ts — eliminar BadRequestException de NestJS.
- src/modules/evaluations/evaluations.module.ts — reemplazar el mock por el generador real; resolver el token duplicado.
- src/modules/evaluations/infrastructure/database/session.entity.orm.ts — alinear convocatoria_id con el tipo real.
- src/shared/utils/pdf-generator.service.ts — agrupación en 4 secciones.
- src/modules/evaluations/application/dtos/create-call.dto.ts — aceptar el tipo de ítem por protocolo.
- test/meetings.e2e-spec.ts — escenarios faltantes y cleanup.
- specs/003-flujo-mvp/reconciliation.md, AGENTS.md — claims y synchronize desactualizados.
REUTILIZAR (no duplicar)
- src/shared/utils/pdf-generator.service.ts → generateCallPdf como base del PDF oficial.
- src/modules/evaluations/infrastructure/controllers/calls.controller.ts → guards, roles, @Audit, Swagger y GET /:id.
- catalogos.tipos_estudio.requiere_informe_inicio/requiere_informe_final/periodicidad_informe_dias → qué informes aplican.
- gestion.renovaciones.tiene_informes_avance → detección de informes de avance.
- catalogos.tipos_seguimiento → discriminante de tipo de seguimiento (requiere seed).
- evaluacion.convocatorias.estado (PROGRAMADA/EN_CURSO/CONCLUIDA/CANCELADA) y tipo_session → ciclo de vida de la convocatoria.
- seguimiento.seguimientos.informe_recibido/fecha_recepcion_informe → estado "presentado".
- catalogos.estados → estados de seguimiento y de sesión, en lugar de números mágicos.
- evaluacion.convocatorias.orden_dia_pdf_path → persistencia del PDF, hoy sin usar.
- src/shared/guards/*, src/shared/decorators/* → seguridad y auditoría.
NO TOCAR
- evaluacion.convocatoria_protocolos.protocolo_id / version_id tipo integer y sus FK RESTRICT: son correctos y coherentes con public.protocolos(id) y public.versiones_protocolo(id).
- evaluacion.convocatorias.numero_convocatoria UNIQUE: es la garantía de integridad que debe aprovecharse, no eliminarse.
- Enums convocatorias_estado_enum y convocatorias_tipo_session_enum: coinciden con el dominio.
- evaluacion.item_estado_enum (C/NC/NA): no reutilizar para agenda; no belongs a RF-09.
- catalogos.tipos_estudio y gestion.renovaciones: son la fuente de verdad de RF-15.
- public.migrations: el estado 1:1 es correcto; solo evitar nuevas colisiones de timestamp.
- evaluacion.actas y evaluacion.acta_protocolo: reutilizar, no recrear.
- Módulos protocols, reception, resolutions, audit, notifications: sin impacto en RF-09/RF-15.
13. DECISIONES QUE REQUIEREN CONFIRMACIÓN
 1. Códigos de catalogos.tipos_seguimiento. La tabla está vacía; no se puede derivar por inspección si el discriminante será INICIO/AVANCE/FIN, INFORME_INICIO/INFORME_AVANCE/INFORME_FIN, u otra nomenclatura oficial.
 2. Definición de "año lectivo". El correlativo usa el año calendario de fecha_reunion (create-meeting.use-case.ts:40) y anio_lectivo es nullable. No está definido si el año lectivo es calendario o período septiembre–agosto.
 3. Modelo del ítem de agenda. ¿Tabla nueva en evaluacion con discriminante, o extender convocatoria_protocolos con tipo_punto_agenda + informe_seguimiento_id + protocolo_id/version_id nulables? La segunda路线 acopla evaluations al schema seguimiento y no puede representar la Sección I (acta).
 4. Sección I y quórum. ¿El Acta Anterior entra como ítem de agenda, o es un encabezado fijo de la sección? Y si el quórum debe bloquear la creación de la convocatoria o solo la firma del acta.
 5. Pronunciamiento de seguimiento. spec.md L131 exige 4 desenlaces (Aprobado, Observado, Convalidado, Cierre Definitivo); el modelo actual tiene un boolean aprobado. Definir si se amplía seguimiento.seguimientos o se usa catalogos.estados.
 6. Destino de MeetingsController tras la consolidación. Si queda como alias兼容 hacia atrás o se retira, considerando que hoy es el endpoint que consume el E2E.
 7. Zona horaria de referencia para el jueves previo a las 23:59:59.999, dado que el cálculo usa hora local del servidor y se almacena en timestamptz.
 8. Tratamiento de datos actuales: 10 convocatorias de prueba (1 sin correlativo) y 8 ítems con orden=1 sobre el mismo protocolo. Definir si se depuran, se archivan o se conservan como base de la numeración.
 9. Columnas legacy de convocatorias y convocatoria_protocolos (codigo, fecha, hora, tipo_sesion, estado_id, resumen_agenda, creado_por, version_protocolo_id, resultado_id, fecha_reunion, fecha_entrega_evaluacion en la tabla hija): eliminar por migración, mapear, o dejar como compatibilidad.
10. Colisiones de timestamp en 1789000000000 y 1797000000000: aceptarlas como deuda histórica o renumerar (requiere coordinación con environments ya migrados).
14. CONCLUSIÓN
Qué está realmente implementado. Los cimientos de RF-09.1 existen y funcionan: los dos value objects de dominio, el cálculo del jueves previo, las entidades ConvocatoriaOrmEntity y LugarOrmEntity — estas últimas verificadas contra el esquema PostgreSQL real, lo que corrige la conclusión anterior— y la validación dura de precedencia de fechas. Existe además un servicio de aplicación completo (CallsService) con CRUD de lugares, priorización de protocolos, PDF real, correo real con adjunto, y firma de actas; y un generador de PDF reutilizable.
Qué falta. RF-09.2 y RF-15.2 están íntegramente ausentes: no hay enum, columna, tabla, DTO, caso de uso, endpoint ni PDF con clasificación de secciones. La RF-09.1 está incompleta en lo esencial: la atomicidad de la numeración no está garantizada y existen dos algoritmos divergentes; fecha_plazo_normativo se persiste como fecha de creación; la advertencia suave nunca se emite; el PDF del orden del día no se genera en la ruta de meetings; y la numeración atómica solo sobrevive gracias al UNIQUE de base de datos. El flujo de sesión, acta y quórum es código muerto.
Qué documentación está desactualizada. reconciliation.md describe endpoints, guards y tablas que no existen. AGENTS.md afirma synchronize: true cuando el código tiene synchronize: false. Las tareas TSK-009-003 a 005 están marcadas [x] cuando 004 y 005 tienen defectos funcionales y 003 solo mapea la mitad de las columnas. tasks y plan presentan el pseudocódigo SELECT MAX() FOR UPDATE como garantía de corrección, yсадa followUpReportIds/tipo_punto_agenda como si fueran amplified sobre una base que no los contiene. La afirmación más importante que se cae es que las entidades ORM y el esquema PostgreSQL están en conflicto: no lo están.
Qué debe corregirse antes de continuar. Nada de RF-09.2 ni RF-15.2 debe escribirse todavía. Primero: compilabilidad (import roto en create-meeting.use-case.ts), consolidation de la ruta canónica en Calls, y las 10 decisiones de la sección 13 — en particular la 3 (modelo del ítem de agenda) y la 1 (códigos de seguimiento), porque condicionan todas las capas posteriores.
Siguiente paso. Confirmar las decisiones de la sección 13 y autorizar el alcance de la primera tanda, que por evidencia del repositorio debería limitarse a: (a) restaurar la compilación, (b) unificar y hacer atómica la numeración sobre la ruta Calls, y (c) corregir fecha_plazo_normativo y la zona horaria. Con eso se elimina el riesgo crítico 1, 2 y 9 y se desbloquea RF-09.2.
Declaración de no-modificación: no se creó, modificó ni eliminó ningún archivo del repositorio; no se ejecutaron migraciones, refactors ni correcciones; no se ejecutó npm run lint ni npm run format (ambos escriben en disco). Comandos de solo lectura ejecutados: docker compose up -d db, psql (consultas SELECT/\d), pg_dump --schema-only (salida a directorio temporal), npm test, npm run test:e2e, npx tsc --noEmit, npx eslint sin --fix, git status. Efectos colaterales declarados en el punto 15 del resumen.