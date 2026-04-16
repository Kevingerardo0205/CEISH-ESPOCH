-- ============================================================================
-- SISTEMA DE GESTIÓN CEISH-ESPOCH - ARQUITECTURA MODULAR POR SCHEMAS
-- PostgreSQL 13+ | Sin extensiones, triggers, views o funciones
-- Basado en PET CEISH-ESPOCH V2 (2023)
-- ============================================================================

-- ============================================================================
-- 1. CREACIÓN DE SCHEMAS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS catalogos;
CREATE SCHEMA IF NOT EXISTS recepcion;
CREATE SCHEMA IF NOT EXISTS evaluacion;
CREATE SCHEMA IF NOT EXISTS resolucion;
CREATE SCHEMA IF NOT EXISTS seguimiento;
CREATE SCHEMA IF NOT EXISTS gestion;
CREATE SCHEMA IF NOT EXISTS sistema;
CREATE SCHEMA IF NOT EXISTS ml_features;

COMMENT ON SCHEMA catalogos IS 'Catálogos maestros reutilizables';
COMMENT ON SCHEMA recepcion IS 'Proceso PET 4.1: Recepción de protocolos';
COMMENT ON SCHEMA evaluacion IS 'Proceso PET 4.2: Evaluación ética/metodológica/jurídica';
COMMENT ON SCHEMA resolucion IS 'Proceso PET 4.3: Emisión de resoluciones';
COMMENT ON SCHEMA seguimiento IS 'Proceso PET 4.4: Seguimiento de estudios aprobados';
COMMENT ON SCHEMA gestion IS 'Procesos PET 4.5-4.7: Enmiendas, renovaciones, suspensiones';
COMMENT ON SCHEMA sistema IS 'Normas de funcionamiento PET 5.1: Auditoría, parámetros';
COMMENT ON SCHEMA ml_features IS 'Microservicio Python ML - Innovación de tesis';

-- ============================================================================
-- 2. SCHEMA: CATALOGOS (Datos maestros)
-- ============================================================================

CREATE TABLE catalogos.roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE catalogos.usuarios (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombres_completos VARCHAR(200) NOT NULL,
    email_institucional VARCHAR(100) UNIQUE NOT NULL,
    email_personal VARCHAR(100),
    telefono VARCHAR(20),
    institucion_pertenece VARCHAR(200),
    cargo VARCHAR(100),
    registro_senescyt VARCHAR(50),
    password_hash VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP
);

CREATE TABLE catalogos.usuarios_roles (
    usuario_id INT REFERENCES catalogos.usuarios(id) ON DELETE CASCADE,
    rol_id INT REFERENCES catalogos.roles(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    asignado_por INT REFERENCES catalogos.usuarios(id),
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE catalogos.permisos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE catalogos.rol_permisos (
    rol_id INT REFERENCES catalogos.roles(id) ON DELETE CASCADE,
    permiso_id INT REFERENCES catalogos.permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE catalogos.tipos_estudio (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    plazo_evaluacion_dias INTEGER,
    requiere_arcsa BOOLEAN,
    periodicidad_informe_dias INTEGER,
    requiere_informe_inicio BOOLEAN,
    requiere_informe_final BOOLEAN,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE catalogos.niveles_riesgo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    tipo_revision VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE catalogos.estados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    categoria VARCHAR(50)
);

CREATE TABLE catalogos.tipos_documento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    codigo_anexo VARCHAR(20),
    es_obligatorio BOOLEAN DEFAULT TRUE,
    es_condicional BOOLEAN DEFAULT FALSE,
    condicion_json JSONB,
    tipo_estudio_aplica JSONB
);

CREATE TABLE catalogos.tipo_documento_estudio (
    tipo_documento_id INT REFERENCES catalogos.tipos_documento(id),
    tipo_estudio_id INT REFERENCES catalogos.tipos_estudio(id),
    obligatorio BOOLEAN,
    PRIMARY KEY (tipo_documento_id, tipo_estudio_id)
);

CREATE TABLE catalogos.perfiles_evaluador (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    obligatorio_para_tipo_estudio JSONB,
    orden_prioridad INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE catalogos.evaluadores_perfil (
    usuario_id INT REFERENCES catalogos.usuarios(id),
    perfil_id INT REFERENCES catalogos.perfiles_evaluador(id),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (usuario_id, perfil_id)
);

CREATE TABLE catalogos.modalidades_revision (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE catalogos.tipos_seguimiento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    codigo VARCHAR(50) UNIQUE,
    plazo_dias_desde_aprobacion INTEGER,
    plazo_dias_desde_finalizacion INTEGER,
    requiere_evaluacion BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE catalogos.tipos_resolucion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE catalogos.criterios_evaluacion (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50),
    descripcion TEXT,
    UNIQUE(tipo, descripcion)
);

CREATE TABLE catalogos.causales_suspension (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

-- ============================================================================
-- 3. SCHEMA: PUBLIC (Entidad central - Protocolos)
-- ============================================================================

CREATE TABLE public.protocolos (
    id SERIAL PRIMARY KEY,
    codigo_ceish VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(500),
    tipo_estudio_id INT REFERENCES catalogos.tipos_estudio(id),
    nivel_riesgo_id INT REFERENCES catalogos.niveles_riesgo(id),
    investigador_principal_id INT REFERENCES catalogos.usuarios(id),
    estado_id INT REFERENCES catalogos.estados(id),
    
    -- Fechas Clave (PET 4.3.2, 4.4.1)
    fecha_recepcion DATE,
    fecha_aprobacion DATE,
    fecha_vencimiento DATE,
    fecha_finalizacion DATE,
    
    -- Metadatos PET
    duracion_estudio_meses INTEGER,
    poblacion_vulnerable BOOLEAN DEFAULT FALSE,
    utiliza_muestras_biologicas BOOLEAN DEFAULT FALSE,
    multicentrico BOOLEAN DEFAULT FALSE,
    
    version_actual INTEGER DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.versiones_protocolo (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id) ON DELETE CASCADE,
    numero_version INTEGER,
    estado_id INT REFERENCES catalogos.estados(id),
    fecha_envio TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    tipo_resolucion VARCHAR(50),
    observaciones TEXT,
    plazo_subsanacion_dias INTEGER DEFAULT 30,
    fecha_limite_subsanacion DATE,
    validado_por INT REFERENCES catalogos.usuarios(id),
    UNIQUE(protocolo_id, numero_version)
);

-- ============================================================================
-- 4. SCHEMA: RECEPCION (PET 4.1)
-- ============================================================================

CREATE TABLE recepcion.documentos (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id) ON DELETE CASCADE,
    version_id INT REFERENCES public.versiones_protocolo(id),
    tipo_documento_id INT REFERENCES catalogos.tipos_documento(id),
    nombre_archivo VARCHAR(200),
    ruta VARCHAR(500),
    numero_hojas INTEGER,
    hash_checksum VARCHAR(64),
    tamaño_bytes BIGINT,
    es_confidencial BOOLEAN DEFAULT TRUE,
    validado_secretaria BOOLEAN DEFAULT FALSE,
    observaciones_validacion TEXT,
    fecha_validacion TIMESTAMP,
    validado_por INT REFERENCES catalogos.usuarios(id),
    subido_por INT REFERENCES catalogos.usuarios(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recepcion.validaciones_documento (
    id SERIAL PRIMARY KEY,
    documento_id INT REFERENCES recepcion.documentos(id) ON DELETE CASCADE,
    estado_id INT REFERENCES catalogos.estados(id),
    observaciones TEXT,
    validado_por INT REFERENCES catalogos.usuarios(id),
    fecha_validacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(documento_id)
);

CREATE TABLE recepcion.recepciones (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    fecha_recepcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_id INT REFERENCES catalogos.estados(id),
    
    -- Notificación de Faltantes (PET 4.1.4: 15 días)
    tiene_faltantes BOOLEAN DEFAULT FALSE,
    lista_faltantes TEXT,
    fecha_notificacion_faltantes TIMESTAMP,
    plazo_completar_dias INTEGER DEFAULT 15,
    fecha_limite_completar DATE,
    
    -- Constancia de Recepción (PET 4.1.5)
    constancia_emitida BOOLEAN DEFAULT FALSE,
    fecha_constancia TIMESTAMP,
    plazo_respuesta_dias INTEGER,
    
    codigo_ceish_generado VARCHAR(50),
    observaciones TEXT,
    creado_por INT REFERENCES catalogos.usuarios(id),
    UNIQUE(protocolo_id)
);

-- ============================================================================
-- 5. SCHEMA: EVALUACION (PET 4.2)
-- ============================================================================

CREATE TABLE evaluacion.asignaciones_evaluacion (
    id SERIAL PRIMARY KEY,
    version_id INT REFERENCES public.versiones_protocolo(id),
    evaluador_id INT REFERENCES catalogos.usuarios(id),
    perfil_id INT REFERENCES catalogos.perfiles_evaluador(id),
    modalidad_id INT REFERENCES catalogos.modalidades_revision(id),
    estado_id INT REFERENCES catalogos.estados(id),
    fecha_limite DATE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_real TIMESTAMP,
    informe_evaluacion TEXT,
    recomendacion VARCHAR(50),
    asignado_por INT REFERENCES catalogos.usuarios(id),
    aprobado_asignacion_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE evaluacion.evaluaciones (
    id SERIAL PRIMARY KEY,
    asignacion_id INT REFERENCES evaluacion.asignaciones_evaluacion(id) ON DELETE CASCADE,
    aspectos_eticos JSONB,
    aspectos_metodologicos JSONB,
    aspectos_juridicos JSONB,
    resultado VARCHAR(50),
    observaciones TEXT,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluado_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE evaluacion.evaluacion_criterio (
    evaluacion_id INT REFERENCES evaluacion.evaluaciones(id) ON DELETE CASCADE,
    criterio_id INT REFERENCES catalogos.criterios_evaluacion(id),
    valor BOOLEAN,
    PRIMARY KEY (evaluacion_id, criterio_id)
);

CREATE TABLE evaluacion.sesiones (
    id SERIAL PRIMARY KEY,
    fecha DATE,
    tipo_sesion VARCHAR(50),
    quorum_alcanzado BOOLEAN,
    asistentes INTEGER,
    estado_id INT REFERENCES catalogos.estados(id),
    creado_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE evaluacion.actas (
    id SERIAL PRIMARY KEY,
    sesion_id INT REFERENCES evaluacion.sesiones(id),
    numero_acta INTEGER,
    resumen TEXT,
    resumen_agenda TEXT,
    deliberaciones TEXT,
    decisiones_tomadas JSONB,
    votaciones JSONB,
    lista_asistentes JSONB,
    conflictos_interes_registrados JSONB,
    consultores_externos JSONB,
    archivo_acta_pdf VARCHAR(500),
    firmada_por_presidente BOOLEAN DEFAULT FALSE,
    firmada_por_secretario BOOLEAN DEFAULT FALSE,
    fecha_elaboracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE evaluacion.acta_protocolo (
    acta_id INT REFERENCES evaluacion.actas(id),
    protocolo_id INT REFERENCES public.protocolos(id),
    PRIMARY KEY (acta_id, protocolo_id)
);

CREATE TABLE evaluacion.acta_asistente (
    acta_id INT REFERENCES evaluacion.actas(id),
    usuario_id INT REFERENCES catalogos.usuarios(id),
    PRIMARY KEY (acta_id, usuario_id)
);

CREATE TABLE evaluacion.asistencia_sesiones (
    id SERIAL PRIMARY KEY,
    sesion_id INT REFERENCES evaluacion.sesiones(id),
    usuario_id INT REFERENCES catalogos.usuarios(id),
    asistio BOOLEAN NOT NULL,
    participo_en_votacion BOOLEAN,
    conflicto_interes BOOLEAN DEFAULT FALSE,
    excusa_presentada BOOLEAN DEFAULT FALSE,
    registro_por INT REFERENCES catalogos.usuarios(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. SCHEMA: RESOLUCION (PET 4.3)
-- ============================================================================

CREATE TABLE resolucion.resoluciones (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    version_id INT REFERENCES public.versiones_protocolo(id),
    tipo_resolucion_id INT REFERENCES catalogos.tipos_resolucion(id),
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_notificacion_investigador TIMESTAMP,
    vigencia_aprobacion_anios INTEGER DEFAULT 1,
    periodo_seguimiento_dias INTEGER,
    observaciones_mayores TEXT,
    observaciones_menores TEXT,
    procedimiento_subsanacion TEXT,
    firmada_por_presidente BOOLEAN DEFAULT FALSE,
    firmada_por_secretario BOOLEAN DEFAULT FALSE,
    firma_electronica_valida BOOLEAN DEFAULT FALSE,
    archivo_carta_pdf VARCHAR(500),
    creado_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE resolucion.notificaciones_resolucion (
    id SERIAL PRIMARY KEY,
    resolucion_id INT REFERENCES resolucion.resoluciones(id) ON DELETE CASCADE,
    destinatario_id INT REFERENCES catalogos.usuarios(id),
    canal VARCHAR(50),
    asunto VARCHAR(200),
    cuerpo_mensaje TEXT,
    fecha_programada TIMESTAMP,
    fecha_envio TIMESTAMP,
    fecha_lectura TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'PENDIENTE'
);

-- ============================================================================
-- 7. SCHEMA: SEGUIMIENTO (PET 4.4)
-- ============================================================================

CREATE TABLE seguimiento.seguimientos (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    tipo_seguimiento_id INT REFERENCES catalogos.tipos_seguimiento(id),
    fecha_programada DATE,
    fecha_vencimiento DATE,
    fecha_recordatorio_1 DATE,
    fecha_recordatorio_2 DATE,
    estado_id INT REFERENCES catalogos.estados(id),
    fue_notificado BOOLEAN DEFAULT FALSE,
    fecha_notificacion TIMESTAMP,
    informe_recibido BOOLEAN DEFAULT FALSE,
    fecha_recepcion_informe TIMESTAMP,
    evaluado_por INT REFERENCES catalogos.usuarios(id),
    observaciones_evaluacion TEXT,
    aprobado BOOLEAN
);

CREATE TABLE seguimiento.informes_seguimiento (
    id SERIAL PRIMARY KEY,
    seguimiento_id INT REFERENCES seguimiento.seguimientos(id),
    contenido TEXT,
    enviado_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE seguimiento.informe_documento (
    informe_id INT REFERENCES seguimiento.informes_seguimiento(id),
    documento_id INT REFERENCES recepcion.documentos(id),
    PRIMARY KEY (informe_id, documento_id)
);

CREATE TABLE seguimiento.eventos_adversos (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    tipo_evento VARCHAR(50) NOT NULL,
    codigo_sujeto VARCHAR(50),
    fecha_inicio_evento DATE,
    fecha_fin_evento DATE,
    descripcion TEXT,
    gravedad VARCHAR(50),
    fecha_reporte_inicial TIMESTAMP,
    reportado_por INT REFERENCES catalogos.usuarios(id),
    informe_completo_recibido BOOLEAN DEFAULT FALSE,
    fecha_informe_completo TIMESTAMP,
    causalidad_naranjo INTEGER,
    grado_causalidad VARCHAR(50),
    notificado_arcsa BOOLEAN DEFAULT FALSE,
    fecha_notificacion_arcsa TIMESTAMP,
    notificado_dis BOOLEAN DEFAULT FALSE,
    fecha_notificacion_dis TIMESTAMP,
    estado_sujeto VARCHAR(50),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. SCHEMA: GESTION (PET 4.5-4.7)
-- ============================================================================

CREATE TABLE gestion.enmiendas (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    numero_enmienda INTEGER,
    version_anterior_id INT REFERENCES public.versiones_protocolo(id),
    descripcion TEXT,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_id INT REFERENCES catalogos.estados(id),
    tipo_enmienda VARCHAR(50),
    afecta_seguridad_sujetos BOOLEAN DEFAULT FALSE,
    modalidad_evaluacion VARCHAR(50),
    evaluado_por INT REFERENCES catalogos.usuarios(id),
    solicitado_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE gestion.renovaciones (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    numero_renovacion INTEGER,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    estado_id INT REFERENCES catalogos.estados(id),
    periodo_anterior_desde DATE,
    periodo_anterior_hasta DATE,
    periodo_solicitado_desde DATE,
    periodo_solicitado_hasta DATE,
    tiene_protocolo_aprobado BOOLEAN DEFAULT FALSE,
    tiene_enmiendas_aprobadas BOOLEAN DEFAULT FALSE,
    tiene_informes_avance BOOLEAN DEFAULT FALSE,
    tiene_aprobacion_arcsa BOOLEAN DEFAULT FALSE,
    evaluado_por INT REFERENCES catalogos.usuarios(id),
    solicitado_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE gestion.suspensiones (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    tipo VARCHAR(50),
    motivo TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    informe_motivacion TEXT,
    fecha_notificacion_investigador TIMESTAMP,
    plazo_justificacion_dias INTEGER DEFAULT 15,
    fecha_limite_justificacion DATE,
    justificacion_recibida BOOLEAN DEFAULT FALSE,
    fecha_justificacion TIMESTAMP,
    justificacion_aceptada BOOLEAN,
    notificado_dis BOOLEAN DEFAULT FALSE,
    notificado_arcsa BOOLEAN DEFAULT FALSE,
    creado_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE gestion.suspension_causal (
    suspension_id INT REFERENCES gestion.suspensiones(id) ON DELETE CASCADE,
    causal_id INT REFERENCES catalogos.causales_suspension(id),
    PRIMARY KEY (suspension_id, causal_id)
);

-- ============================================================================
-- 9. SCHEMA: SISTEMA (PET 5.1 - Normas de funcionamiento)
-- ============================================================================

CREATE TABLE sistema.plantillas_comunicacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    asunto VARCHAR(200),
    cuerpo_html TEXT,
    variables_disponibles JSONB,
    tipo_destinatario VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE sistema.notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES catalogos.usuarios(id),
    plantilla_id INT REFERENCES sistema.plantillas_comunicacion(id),
    asunto VARCHAR(200),
    cuerpo_mensaje TEXT,
    enviar_email BOOLEAN DEFAULT TRUE,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    fecha_programada TIMESTAMP,
    fecha_envio TIMESTAMP,
    fecha_lectura TIMESTAMP,
    protocolo_id INT REFERENCES public.protocolos(id),
    metadata_json JSONB
);

CREATE TABLE sistema.parametros_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo_dato VARCHAR(20),
    descripcion TEXT,
    actualizado_por INT REFERENCES catalogos.usuarios(id),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sistema.audit_log (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES catalogos.usuarios(id),
    accion VARCHAR(50),
    tabla VARCHAR(100),
    registro_id INT,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_origen VARCHAR(50),
    protocolo_codigo VARCHAR(50),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sistema.declaracion_confidencialidad (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    investigador_id INT REFERENCES catalogos.usuarios(id),
    fecha_firma DATE,
    archivo_firmado VARCHAR(500)
);

CREATE TABLE sistema.declaracion_conflicto_interes (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    investigador_id INT REFERENCES catalogos.usuarios(id),
    tiene_conflicto BOOLEAN,
    descripcion_conflicto TEXT,
    fecha_firma DATE
);

-- ============================================================================
-- 10. SCHEMA: ML_FEATURES (Microservicio Python)
-- ============================================================================

CREATE TABLE ml_features.protocolo_features (
    id SERIAL PRIMARY KEY,
    protocolo_id INT UNIQUE REFERENCES public.protocolos(id),
    texto TEXT,
    longitud INTEGER,
    riesgo VARCHAR(50),
    confianza DECIMAL(5,4),
    palabras_clave JSONB,
    secciones_detectadas JSONB,
    factores_riesgo JSONB,
    fecha_extraccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version_modelo VARCHAR(20)
);

CREATE TABLE ml_features.predicciones_log (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    tipo_prediccion VARCHAR(50),
    entrada_json JSONB,
    salida_json JSONB,
    modelo_version VARCHAR(20),
    tiempo_procesamiento_ms INTEGER,
    confidence_score DECIMAL(5,4),
    fecha_prediccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ml_features.modelos_versiones (
    id SERIAL PRIMARY KEY,
    nombre_modelo VARCHAR(100),
    version VARCHAR(20),
    metricas_evaluacion JSONB,
    fecha_entrenamiento TIMESTAMP,
    ruta_archivo VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE,
    creado_por INT REFERENCES catalogos.usuarios(id)
);

CREATE TABLE ml_features.configuracion_ml (
    clave VARCHAR(100) PRIMARY KEY,
    valor DECIMAL(10,4),
    descripcion TEXT,
    actualizado_por INT REFERENCES catalogos.usuarios(id),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ml_features.analisis_documentos (
    id SERIAL PRIMARY KEY,
    documento_id INT UNIQUE REFERENCES recepcion.documentos(id),
    tipo_documento VARCHAR(100),
    texto_extraido TEXT,
    secciones_encontradas JSONB,
    errores_detectados JSONB,
    recomendaciones JSONB,
    puntaje_calidad DECIMAL(5,4),
    fecha_analisis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version_modelo VARCHAR(20)
);

CREATE TABLE ml_features.balanceo_evaluadores (
    id SERIAL PRIMARY KEY,
    fecha_calculo DATE NOT NULL,
    evaluador_id INT REFERENCES catalogos.usuarios(id),
    carga_actual INTEGER,
    carga_promedio INTEGER,
    desviacion DECIMAL(5,4),
    sugerido_para_asignar BOOLEAN,
    factores_considerados JSONB,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ml_features.prediccion_incumplimientos (
    id SERIAL PRIMARY KEY,
    protocolo_id INT REFERENCES public.protocolos(id),
    seguimiento_id INT REFERENCES seguimiento.seguimientos(id),
    probabilidad_incumplimiento DECIMAL(5,4),
    factores_riesgo JSONB,
    fecha_prediccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modelo_version VARCHAR(20),
    accion_recomendada TEXT
);

CREATE TABLE ml_features.chatbot_conversaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES catalogos.usuarios(id),
    pregunta TEXT,
    respuesta TEXT,
    fuentes_consultadas JSONB,
    confianza_respuesta DECIMAL(5,4),
    feedback_util BOOLEAN,
    fecha_conversacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ml_features.reportes_msp (
    id SERIAL PRIMARY KEY,
    tipo_reporte VARCHAR(50),
    periodo_desde DATE,
    periodo_hasta DATE,
    datos_json JSONB,
    archivo_generado VARCHAR(500),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generado_por INT REFERENCES catalogos.usuarios(id)
);

-- ============================================================================
-- 11. ÍNDICES PARA RENDIMIENTO
-- ============================================================================
-- Índices en public
CREATE INDEX idx_protocolos_estado ON public.protocolos(estado_id);
CREATE INDEX idx_protocolos_fecha_vencimiento ON public.protocolos(fecha_vencimiento);

-- Índices en recepcion
CREATE INDEX idx_documentos_protocolo ON recepcion.documentos(protocolo_id);

-- Índices en evaluacion
CREATE INDEX idx_asignaciones_evaluador ON evaluacion.asignaciones_evaluacion(evaluador_id, estado_id);

-- Índices en seguimiento
CREATE INDEX idx_seguimientos_vencimiento ON seguimiento.seguimientos(fecha_vencimiento);

-- Índices en sistema
CREATE INDEX idx_audit_log_fecha ON sistema.audit_log(fecha);
CREATE INDEX idx_audit_log_protocolo ON sistema.audit_log(protocolo_codigo);

-- Índices en ml_features
CREATE INDEX idx_protocolo_features_protocolo ON ml_features.protocolo_features(protocolo_id);
CREATE INDEX idx_predicciones_log_fecha ON ml_features.predicciones_log(fecha_prediccion);
CREATE INDEX idx_analisis_documentos_documento ON ml_features.analisis_documentos(documento_id);
CREATE INDEX idx_prediccion_incumplimientos_probabilidad ON ml_features.prediccion_incumplimientos(probabilidad_incumplimiento DESC);


-- ============================================================================
-- 13. PERMISOS DE USUARIOS (COMENTADO - EJECUTAR CON SUPERUSUARIO)
-- ============================================================================
/*
-- Usuario para NestJS (acceso completo a schemas operativos, lectura a catalogos)
CREATE USER app_nestjs WITH PASSWORD 'nestjs_secure_password_2024';
GRANT CONNECT ON DATABASE current_database() TO app_nestjs;
GRANT USAGE ON SCHEMA public, recepcion, evaluacion, resolucion, seguimiento, gestion, sistema TO app_nestjs;
GRANT USAGE ON SCHEMA catalogos, ml_features TO app_nestjs;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, recepcion, evaluacion, resolucion, seguimiento, gestion, sistema TO app_nestjs;
GRANT SELECT ON ALL TABLES IN SCHEMA catalogos, ml_features TO app_nestjs;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, recepcion, evaluacion, resolucion, seguimiento, gestion, sistema TO app_nestjs;

-- Usuario para Python ML (lectura a operativos, escritura en ml_features)
CREATE USER app_python_ml WITH PASSWORD 'python_ml_secure_password_2024';
GRANT CONNECT ON DATABASE current_database() TO app_python_ml;
GRANT USAGE ON SCHEMA public, catalogos, recepcion, evaluacion, seguimiento TO app_python_ml;
GRANT USAGE ON SCHEMA ml_features TO app_python_ml;
GRANT SELECT ON ALL TABLES IN SCHEMA public, catalogos, recepcion, evaluacion, seguimiento TO app_python_ml;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ml_features TO app_python_ml;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ml_features TO app_python_ml;
*/

-- ============================================================================
-- FIN DEL SCRIPT - ARQUITECTURA MODULAR LISTA PARA PRODUCCIÓN
-- ============================================================================