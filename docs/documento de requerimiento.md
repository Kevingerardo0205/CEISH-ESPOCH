
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 8 
 
  Descripción de requisitos del sofware 
 
Gestión de 
enmiendas 
Flujo específico para modificaciones de 
protocolos aprobados Media 
Reportes de 
eventos 
adversos 
Formularios Anexo 20, 21, 22 (Algoritmo de 
Naranjo) Alta 
Auditoría Logs de todas las acciones del sistema Alta 
Reportes MSP Generación automática de estadísticas para 
Ministerio de Salud Media 
Renovaciones Alerta 60 días antes de vencimiento de 
aprobación (1 año) Alta 
2.3 Características de los usuarios 
Tipo de usuario Secretaria CEISH 
Formación Administrativa 
Habilidades Manejo básico de computadora 
Actividades Registro, validación y gestión de procesos 
 
Tipo de usuario Evaluador 
Formación Profesional académico 
Habilidades Análisis de documentos 
Actividades Evaluación ética de protocolos 
 
Tipo de usuario Investigador 
Formación Estudiante/Docente 
Habilidades Uso básico de sistemas 
Actividades Envío de protocolos 
 
Tipo de usuario Presidenta del CEISH  
Formación Profesional con experiencia en investigación y ética 
Habilidades Toma de decisiones, supervisión 
Actividades Aprobación o rechazo final de protocolos, supervisión del 
proceso. 
 
Tipo de usuario Administrador 
Formación Técnico 
Habilidades Manejo de sistemas 
Actividades Configuración del sistema  
 
2.4 Restricciones 
El desarrollo del sistema CEISH estará sujeto a las siguientes restricciones técnicas, 
metodológicas y organizacionales definidas en el perfil del proyecto: 
 
Restricciones tecnológicas 
Tecnología Versión Justificación 
Frontend Angular 16+ Definido en perfil de proyecto 
Backend Node.js con NestJS Definido en perfil de proyecto 
Base de Datos PostgreSQL 15+ Definido en perfil de proyecto 
Control de Versiones Git + GitHub Estándar del proyecto 
Autenticación JWT + Refresh 
Tokens Seguridad requerida 
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 9 
 
  Descripción de requisitos del sofware 
 
 
Restricciones metodológicas 
▪ Desarrollo bajo metodología Scrum (sprints de 2 semanas) 
▪ Validación continua con Product Owner (Secretaria Karina Albuja) 
▪ Evaluación bajo norma ISO/IEC 25010:2023 
▪ Periodo de desarrollo: Marzo – Julio 2026 
 
Restricciones institucionales 
▪ Cumplimiento obligatorio del PET CEISH-ESPOCH 2023 
▪ Reportes mensuales/anuales al Ministerio de Salud Pública 
▪ Confidencialidad de datos (solo investigador y evaluadores asignados pueden ver 
documentos) 
▪ Reemplazo gradual de Keybox (notificar a evaluadores que usen plataforma) 
 
Restricciones operativas 
▪ Acceso únicamente mediante navegador web (Chrome, Firefox, Edge actualizados) 
▪ Requiere conexión a internet estable 
▪ No requiere hardware especializado 
▪ No se despliega en producción institucional (solo servidor local/cloud para 
demostración de tesis) 
 
Restricciones de desarrollo 
▪ Equipo de 2 estudiantes desarrolladores 
▪ Tiempo limitado a periodo académico (5 meses) 
▪ Asistente IA será basado en plantillas inteligentes (no LLM externo por 
costos/privacidad) 
2.5 Suposiciones y dependencias 
Suposición Impacto si no se cumple 
Usuarios tienen acceso a internet estable Sistema inaccesible 
Secretaria valida documentos antes de enviar a 
evaluadores 
Evaluadores reciben documentación 
incompleta 
Presidenta asigna evaluadores según 
dashboard de carga 
Desbalance de trabajo entre 
miembros 
Investigadores envían información verídica Validaciones automáticas fallan 
Procesos PET no cambian durante desarrollo Requiere reingeniería de requisitos 
Servidor local/cloud disponible para 
demostración No se puede presentar en defensa 
 
Dependencias Externas: 
• Servicio  SMTP  institucional  para  envío  de  correos  (o  servicio  externo  tipo 
SendGrid) 
• Servidor para hosting (local para tesis, institucional post-tesis) 
• No depende de APIs externas de IA (asistente basado en plantillas locales) 
2.6 Evolución previsible del sistema 
Fase Funcionalidad Prioridad 
Versión 1.0 (Tesis) 
Gestión básica de 
protocolos, 
validación, 
asignación, 
seguimiento, 
Esencial 
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 10 
 
  Descripción de requisitos del sofware 
 
notificaciones, 
asistente plantillas 
Versión 2.0 (Post-tesis) 
Integración con TI-
ESPOCH para 
despliegue 
institucional 
Deseado 
Versión 3.0 (Futuro) 
Firma electrónica 
integrada, reportes 
automáticos MSP, 
integración ARCSA 
Opcional 
Versión 4.0 (Escalable) 
Adaptable para otros 
comités de ética 
universitarios 
Opcional 
 
El sistema CEISH podrá evolucionar en el futuro incorporando nuevas funcionalidades 
que permitan mejorar la gestión de los procesos del comité. 
 
Entre las posibles mejoras se considera la integración con sistemas institucionales de la 
ESPOCH, automatización completa de reportes hacia el Ministerio de Salud Pública y la 
implementación de firmas digitales para documentos oficiales. 
 
También se prevé la incorporación de módulos de análisis estadístico que permitan 
evaluar el desempeño del comité, así como mejoras en la experiencia del usuario 
mediante interfaces más intuitivas. 
 
Finalmente, el sistema podría adaptarse para ser utilizado por otros comités de ética en 
diferentes instituciones, ampliando su alcance y funcionalidad. 
3  Requisitos específicos 
3.1 Requisitos comunes de los interfaces 
3.1.1  Interfaces de usuario 
El sistema contará con 5 interfaces diferenciadas por rol: 
Rol Vistas Principales Acciones Clave 
Investigador 
Dashboard de 
protocolos, 
Formulario de envío, 
Estado de trámites 
Registrar protocolo, Cargar 
documentos, Ver 
observaciones, Enviar 
informes 
Secretaria 
Panel de validación, 
Dashboard de 
evaluadores, 
Seguimiento de 
fechas 
Validar documentos, Asignar 
evaluadores, Enviar 
notificaciones, Generar 
reportes 
Evaluador 
Protocolos 
asignados, 
Formularios de 
evaluación, Historial 
Revisar protocolos, Emitir 
informe, Ver carga de trabajo 
Presidenta 
Dashboard global, 
Asignación de 
evaluadores, 
Aprobaciones finales 
Asignar evaluadores, 
Aprobar/resolver, Supervisar 
procesos 
Administrador Configuración, Gestionar usuarios, 
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 11 
 
  Descripción de requisitos del sofware 
 
Usuarios, Logs, 
Backup 
Configurar parámetros, 
Auditoría 
 
Requisitos: 
• Interfaz  intuitiva  para  usuarios  no  técnicos  (secretaria  tiene  formación 
administrativa) 
• Estados visibles del proceso (Pendiente → En Revisión → 
Aprobado/Condicionado/No Aprobado) 
• Carga  múltiple  de  documentos  (drag  &  drop,  máximo  50  archivos  por 
subida) 
• Notificaciones visibles en dashboard + correo electrónico 
• Asistente de redacción accesible desde panel de secretaria 
3.1.2  Interfaces de hardware 
Dispositivo Requisito Observación 
Computadora escritorio 
Navegador 
actualizado, 4GB 
RAM mínimo 
Uso principal en oficina 
CEISH 
Laptop 
Navegador 
actualizado, 4GB 
RAM mínimo 
Evaluadores pueden revisar 
desde casa 
Tablet/Móvil 
Navegador 
responsive (solo 
consulta) 
No para carga de 
documentos 
No requiere: 
• Hardware especializado 
• Escáneres (documentos ya digitalizados) 
• Servidores dedicados (para versión de tesis) 
3.1.3  Interfaces de software 
Sistema Protocolo Propósito Frecuencia 
Servicio SMTP SMTP/JSON 
Envío de correos 
automáticos 
(notificaciones, 
alertas) 
Por evento 
(aprobación, 
vencimiento, etc.) 
PostgreSQL SQL 
Almacenamiento 
de usuarios, 
protocolos, 
documentos, logs 
Continuo 
Asistente IA 
(Plantillas) 
Texto 
dinámico 
Generación de 
mensajes 
personalizados 
para secretaria 
Por necesidad de 
comunicación 
Sistema de Archivos Local/Cloud 
Almacenamiento 
de documentos 
PDF/DOCX 
Por subida de 
protocolo 
 
Especificación del Asistente Inteligente: 
Tipo: Motor de plantillas con variables dinámicas 
Funcionalidad: 
• Sugiere texto base para correos según tipo de evento 
• Secretaria personaliza datos específicos (nombre, fechas, código) 
• Historial de mensajes enviados por protocolo 
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 12 
 
  Descripción de requisitos del sofware 
 
• Plantillas predefinidas: 
o Notificación de documentos faltantes 
o Solicitud de informe de inicio/seguimiento/final 
o Notificación de asignación a evaluadores 
o Alerta de renovación (60 días antes) 
o Notificación de aprobación/observaciones/no aprobación 
3.1.4  Interfaces de comunicación 
Comunicación Protocolo Dirección Datos 
Frontend ↔ Backend HTTP/HTTPS 
(REST API) 
Angular → 
NestJS JSON 
Backend ↔ Database 
TCP/IP 
(PostgreSQL 
Protocol) 
NestJS → 
PostgreSQL SQL 
Backend ↔ SMTP 
SMTP 
(puerto 587 
TLS) 
NestJS → 
Servidor Correo MIME 
Frontend ↔ Usuario HTTPS Navegador → 
Angular HTML/CSS/JS 
Seguridad en Comunicación: 
• Todas las comunicaciones externas mediante HTTPS 
• Autenticación JWT en todas las peticiones API 
• Documentos encriptados en reposo (AES-256) 
3.2 Requisitos funcionales 
3.2.1  Requisito funcional 1 
Número de requisito RF-001  
Nombre de requisito Gestión de usuarios 
Tipo X  Requisito  Restricción 
Fuente del requisito PET CEISH-ESPOCH  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción:  El  sistema  permitirá  registrar,  modificar  y  eliminar  usuarios  con 
roles definidos (secretaria, evaluadores, investigadores, presidenta, 
administrador). Validará credenciales de acceso y asignará permisos según rol. 
3.2.2  Requisito funcional 2 
Número de requisito RF-002  
Nombre de requisito Recepción de protocolos  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 4.1  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción: Los investigadores podrán registrar protocolos según tipo de 
estudio (observacional, intervención, ensayo clínico). El sistema validará campos 
obligatorios, generará código único (CEISH-ESPOCH-IO/EI/EC-###-AAAA) y 
permitirá carga múltiple de documentos. 
3.2.3  Requisito funcional 3 
Número de requisito RF-003  
Nombre de requisito Validación documental  
Tipo X  Requisito  Restricción 
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 13 
 
  Descripción de requisitos del sofware 
 
Fuente del requisito PET 4.1.3-4.1.4   
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción:  La  secretaria validará  checklist  de  documentos  según  tipo  de 
estudio. Si está incompleto, notificará al investigador con lista de faltantes (plazo 
15  días).  Si  está  completo,  generará  constancia  de  recepción  y  notificará  a 
presidenta. 
3.2.4  Requisito funcional 4 
Número de requisito RF-004 
Nombre de requisito Asignación de evaluadores  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 4.2.2.1  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción: El sistema permitirá registrar, modificar y eliminar usuarios con roles 
definidos (secretaria, evaluadores, investigadores, presidenta, administrador). 
Validará credenciales de acceso y asignará permisos según rol. 
3.2.5  Requisito funcional 5 
Número de requisito RF-005 
Nombre de requisito Evaluación de protocolos  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 4.2, Anexos 9-11  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción:  Evaluadores  revisarán  protocolos  asignados  usando  formularios 
digitales  (expedita:  8  días,  pleno:  15  días).  El  sistema  evaluará  aspectos  éticos, 
metodológicos y jurídicos, y permitirá emitir resultado (aprobado/no aprobado/con 
observaciones). 
3.2.6  Requisito funcional 6 
Número de requisito RF-006 
Nombre de requisito Emisión de resoluciones  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 4.3  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción:  El  sistema  generará  cartas  de  resolución  automáticas (aprobación 
definitiva, condicionada o no aprobación) con vigencia de 1 año. Para 
aprobaciones condicionadas, establecerá plazo de 30 días para subsanar. 
3.2.7  Requisito funcional 7 
Número de requisito RF-007 
Nombre de requisito Seguimiento de estudios  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 4.4  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción: El sistema calculará automáticamente fechas de informes (inicio: 30 
días, avance: según periodicidad, final: 60 días). Notificará 7 días y 1 día antes de 
vencimientos. Alertará renovación 60 días antes de expiración. 
3.2.8  Requisito funcional 8 
Número de requisito RF-008 
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 14 
 
  Descripción de requisitos del sofware 
 
Nombre de requisito Notificaciones automáticas  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 4.2.4, 4.3.3  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción: El sistema enviará correos automáticos para: recepción de 
protocolo, documentos faltantes, asignación de evaluadores, resoluciones, 
vencimientos de informes, renovaciones. Usará plantillas personalizables 
3.2.9  Requisito funcional 9 
Número de requisito RF-009 
Nombre de requisito Asistente de redacción  
Tipo X  Requisito  Restricción 
Fuente del requisito Requerimiento usuario  
Prioridad del requisito  Alta/Esencial X  Media/Deseado  Baja/ Opcional 
Descripción:  Módulo  que  ayudará  a  secretaria  a  redactar  mensajes  y  correos 
mediante plantillas inteligentes con variables dinámicas (nombre, código, fechas). 
Permitirá personalización antes de enviar. 
3.2.10 Requisito funcional 10 
Número de requisito RF-0010 
Nombre de requisito Gestión de enmiendas  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 4.5   
Prioridad del requisito  Alta/Esencial X  Media/Deseado  Baja/ Opcional 
Descripción: Los investigadores podrán solicitar enmiendas a protocolos 
aprobados. El sistema validará documentación (carta solicitud, justificación, 
documentos modificados) y asignará evaluación (expedita o pleno según 
impacto). 
3.2.11 Requisito funcional 11 
Número de requisito RF-0011 
Nombre de requisito Reporte de eventos adversos  
Tipo X  Requisito  Restricción 
Fuente del requisito  PET 4.4.2  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción: Investigadores reportarán EAG/RAGI en 2 días. El sistema 
notificará  a  ARCSA/DIS  en  48  horas  y  solicitará  informe  completo  con  algoritmo 
de Naranjo en 15 días. 
3.2.12 Requisito funcional 12 
Número de requisito RF-0012 
Nombre de requisito Dashboard y reportes 
Tipo X  Requisito  Restricción 
Fuente del requisito PET 5.1  
Prioridad del requisito  Alta/Esencial X  Media/Deseado  Baja/ Opcional 
Descripción: El sistema generará reportes mensuales/anuales para MSP 
(protocolos  evaluados,  aprobados,  tipos  de  estudio),  dashboard  con  protocolos 
por estado, carga por evaluador, y exportación a Excel/PDF. 
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 15 
 
  Descripción de requisitos del sofware 
 
3.2.13 Requisito funcional 13 
Número de requisito RF-0013 
Nombre de requisito Auditoría del sistema  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 5.1.b  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción:  El  sistema  registrará  logs  de  todas  las  acciones  críticas  (crear, 
modificar,  eliminar,  aprobar)  con  usuario,  fecha,  hora,  IP  y  datos  modificados. 
Retención mínima de 7 años. 
3.2.14 Requisito funcional 14 
Número de requisito RF-0014 
Nombre de requisito Gestión de renovaciones  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 4.6  
Prioridad del requisito X  Alta/Esencial  Media/Deseado  Baja/ Opcional 
Descripción:  El  sistema  alertará  60,  30  y  7  días  antes  de  vencimiento  de 
aprobación.  Investigadores  solicitarán  renovación  con  documentación  requerida. 
Si no renueva, estado cambiará a "Vencido". 
3.2.15 Requisito funcional 15 
Número de requisito RF-0015 
Nombre de requisito Suspensión y revocatoria  
Tipo X  Requisito  Restricción 
Fuente del requisito PET 4.7  
Prioridad del requisito  Alta/Esencial X  Media/Deseado  Baja/ Opcional 
Descripción:  El  sistema  gestionará  suspensiones  (15  días  para  justificar)  y 
revocatorias por incumplimientos. Notificará automáticamente a investigador, 
patrocinador, DIS y ARCSA. 
3.3 Requisitos no funcionales 
3.3.1  Requisitos de rendimiento 
• El sistema soportará 50 usuarios simultáneos concurrentes 
• El 95% de las transacciones se completarán en menos de 3 segundos 
• La  carga  de  documentos  (hasta  50  archivos,  100MB)  se  completará  en 
menos de 10 segundos 
• La generación de reportes complejos no excederá 30 segundos 
• El  tiempo  de  respuesta  de  API  será  menor  a  500ms  para  el  95%  de 
peticiones 
3.3.2  Seguridad 
• Autenticación mediante JWT con refresh tokens y expiración de 24 horas 
• Control de acceso basado en roles (RBAC) con 5 niveles de permisos 
• Encriptación AES-256 para documentos en reposo 
• HTTPS/TLS 1.3 para todas las comunicaciones 
• Solo investigador y evaluadores asignados podrán ver documentos 
confidenciales 
• Logs de auditoría inmodificables de todas las acciones críticas 
• Queries parametrizadas para prevención de inyección SQL 
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 16 
 
  Descripción de requisitos del sofware 
 
• Sanitización de todas las entradas para prevención de XSS 
• Backup automático diario con retención de 7 años 
3.3.3  Fiabilidad 
• MTBF (Mean Time Between Failures) mayor a 720 horas (30 días) 
• Tasa de errores menor al 0.1% de transacciones totales 
• Validación del 100% de campos obligatorios antes de procesar 
• Recuperación ante fallos: RTO < 4 horas, RPO < 1 hora 
• Consistencia de cálculos automáticos de fechas sin errores 
3.3.4  Disponibilidad 
• Disponibilidad del 99% en horario laboral (8:00-18:00, lunes a viernes) 
• Mantenimiento programado fuera de horario laboral con notificación de 48 
horas 
• Modo degradado: si el servicio de correo falla, las notificaciones internas 
continuarán funcionando 
• Tiempo de recuperación máximo de 4 horas ante caídas del sistema 
3.3.5  Mantenibilidad 
• 100% del código documentado con JSDoc/TSDoc 
• Cobertura de pruebas unitarias mayor al 80% 
• Score mayor al 80% en análisis estático (SonarQube) 
• Parámetros del PET configurables en base de datos (plazos, vigencias) 
• Plantillas de correos modificables por secretaria sin intervención de 
desarrollador 
• Actualizaciones trimestrales de seguridad y mejoras 
• Documentación técnica completa del sistema 
3.3.6  Portabilidad 
• Compatible con navegadores Chrome 90+, Firefox 88+, Edge 90+ 
• Independiente de sistema operativo (Windows, macOS, Linux) 
• Responsive design para consulta en dispositivos móviles 
• Menos del 10% de código dependiente del servidor 
• Desarrollo en TypeScript para máxima portabilidad 
• Contenedor Docker para fácil despliegue en diferentes entornos 
3.4 Otros requisitos 
Requisitos legales 
• Cumplimiento del PET CEISH-ESPOCH Versión 2 (2023) 
• Cumplimiento del Acuerdo Ministerial 00015-2021 (investigaciones 
observacionales/intervención) 
• Cumplimiento del Acuerdo Ministerial 00005-2022 (ensayos clínicos) 
• Ley Orgánica de Protección de Datos Personales del Ecuador 
• Declaración de Helsinki (ética en investigación médica) 
• Retención de documentos por 7 años mínimos (PET 5.1.b) 
Requisitos culturales y de usabilidad 
• Idioma: Español (todos los textos, formularios y correos) 
• Terminología según glosario del PET CEISH-ESPOCH 
• Contraste adecuado y fuentes legibles (mínimo 14px) 
• Curva de aprendizaje: secretaria capacitada en menos de 4 horas 
• Tooltips de ayuda contextual en formularios complejos 
 
 
 Desarrollo de un sistema web para la gestión y 
seguimiento de los procesos del Comité de Ética en 
Investigación en Seres Humanos de la ESPOCH 
Especificación de requisitos de software 
Rev. 1.0 
Pág. 17 
 
  Descripción de requisitos del sofware 
 
Requisitos de innovación 
• Asistente de validación documental que reduzca tiempo de 2 horas a 20 minutos 
• Asistente de redacción que reduzca tiempo de comunicación de 10 a 2 minutos 
• Dashboard de carga de evaluadores para distribución equitativa 
• Cálculo automático de fechas de seguimiento (eliminación de error humano) 
• Notificaciones automáticas escalonadas (prevención de vencimientos olvidados) 
4  Apéndices 
4.1 Apéndice A: Glosario de términos 
• CEISH: Comité de Ética de Investigación en Seres Humanos 
• EAG: Evento Adverso Grave 
• RAGI: Reacción Adversa Grave Inesperada 
• IO: Investigación Observacional 
• EI: Estudio de Intervención 
• EC: Ensayo Clínico 
• ARCSA: Agencia Nacional de Regulación, Control y Vigilancia Sanitaria 
• MSP: Ministerio de Salud Pública 
• PET: Procesos Estandarizados de Trabajo 
• JWT: JSON Web Token 
• RBAC: Role-Based Access Control 
4.2 Apéndice B: Referencias normativas 
1. PET CEISH-ESPOCH Versión 2, 2023 
2. Acuerdo Ministerial 00015-2021 (Registro Oficial 573, 9 noviembre 2021) 
3. Acuerdo Ministerial 00005-2022 (Registro Oficial 118, 2 agosto 2022) 
4. Constitución de la República del Ecuador 
5. Ley Orgánica de Educación Superior 
6. Ley Orgánica de Protección de Datos Personales 
7. Declaración de Helsinki (64ª Asamblea General, Fortaleza 2013) 
8. Pautas Éticas Internacionales CIOMS-OMS (2002) 
4.3 Apéndice C: Anexos del PET 
• Anexo 1: Solicitud de evaluación 
• Anexo 2: Formulario de protocolo 
• Anexo 3: Consentimiento informado 
• Anexo 4: Declaración de responsabilidad IP 
• Anexo 5: Carta de interés institucional 
• Anexo 6: Solicitud evaluación ensayos clínicos 
• Anexo 7A-C: Notificación de recepción 
• Anexo 8: Estratificación de riesgos 
• Anexo 9: Guía evaluación expedita 
• Anexo 10: Guía evaluación en pleno 
• Anexo 11: Guía evaluación ensayos clínicos 
• Anexo 12-27: Cartas y formularios va