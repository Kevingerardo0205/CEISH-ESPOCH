-- ============================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS - SISTEMA CEISH-ESPOCH
-- Basado en PET V2 (2023) y Requerimientos de Ingeniería
-- Stack: PostgreSQL 13+ (Sin extensiones adicionales)
-- ============================================================================

-- 1. CONFIGURACIÓN INICIAL Y SCHEMAS
-- ============================================================================
COMMENT ON DATABASE current_database() IS 'Sistema de Gestión CEISH-ESPOCH - Automatización de Procesos Éticos';

-- Creación de schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS ml_features;

-- 2. TABLAS MAESTRAS (CATÁLOGOS Y USUARIOS)
-- ============================================================================

-- 2.1 Roles del Sistema
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}',
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 Usuarios (Investigadores, Miembros CEISH, Secretaria)
CREATE TABLE public.usuarios (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombres_completos VARCHAR(200) NOT NULL,
    email_institucional VARCHAR(100) UNIQUE NOT NULL,
    email_personal VARCHAR(100),
    telefono VARCHAR(20),
    institucion_pertenece VARCHAR(200),
    cargo VARCHAR(100),
    registro_senescyt VARCHAR(50),
    password_hash VARCHAR(255), -- Hash generado por la aplicación (bcrypt/argon2)
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMPTZ
);

-- 2.3 Relación Usuarios - Roles (N:M)
CREATE TABLE public.usuarios_roles (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    rol_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    asignado_por INTEGER REFERENCES public.usuarios(id),
    UNIQUE(usuario_id, rol_id)
);

-- 2.4 Perfiles de Evaluador (Jurídico, Salud, etc. - PET 4.2.2.1)
CREATE TABLE public.perfiles_evaluador (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    obligatorio_para_tipo_estudio JSONB,
    orden_prioridad INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE
);

-- 2.5 Asignación de Perfiles a Usuarios Evaluadores
CREATE TABLE public.evaluadores_perfil (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    perfil_id INTEGER REFERENCES public.perfiles_evaluador(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE(usuario_id, perfil_id)
);

-- 2.6 Tipos de Estudio (PET 4.1.2)
CREATE TABLE public.tipos_estudio (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    requisitos_documentales JSONB,
    plazo_evaluacion_dias INTEGER DEFAULT 45,
    requiere_arcsa BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE
);

-- 2.7 Niveles de Riesgo (PET 4.2.1.1)
CREATE TABLE public.niveles_riesgo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo_revision_requerida VARCHAR(50),
    criterios_evaluacion JSONB,
    activo BOOLEAN DEFAULT TRUE
);

-- 3. TABLAS TRANSACCIONALES (PROCESO PRINCIPAL)
-- ============================================================================

-- 3.1 Protocolos (Entidad Principal - PET 4.1.6)
CREATE TABLE public.protocolos (
    id SERIAL PRIMARY KEY,
    codigo_ceish VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(500) NOT NULL,
    tipo_estudio_id INTEGER REFERENCES public.tipos_estudio(id),
    nivel_riesgo_id INTEGER REFERENCES niveles_riesgo(id),
    investigador_principal_id INTEGER REFERENCES public.usuarios(id),
    
    -- Fechas Clave
    fecha_recepcion_inicial DATE,
    fecha_aprobacion_definitiva DATE,
    fecha_vencimiento_aprobacion DATE,
    fecha_finalizacion_estudio DATE,
    
    -- Estado
    estado VARCHAR(50) NOT NULL DEFAULT 'BORRADOR',
    
    -- Configuración Seguimiento
    periodicidad_informe_dias INTEGER,
    requiere_informe_inicio BOOLEAN DEFAULT TRUE,
    requiere_informe_final BOOLEAN DEFAULT TRUE,
    
    -- Metadatos PET
    duracion_estudio_meses INTEGER,
    poblacion_vulnerable BOOLEAN DEFAULT FALSE,
    utiliza_muestras_biologicas BOOLEAN DEFAULT FALSE,
    multicentrico BOOLEAN DEFAULT FALSE,
    
    version_actual INTEGER DEFAULT 1,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 Versiones del Protocolo (Historial v1, v2, v3... - PET 4.5)
CREATE TABLE public.versiones_protocolo (
    id SERIAL PRIMARY KEY,
    protocolo_id INTEGER REFERENCES public.protocolos(id) ON DELETE CASCADE,
    numero_version INTEGER NOT NULL,
    estado VARCHAR(50) NOT NULL,
    fecha_envio TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_validacion_secretaria TIMESTAMPTZ,
    fecha_resolucion TIMESTAMPTZ,
    tipo_resolucion VARCHAR(50),
    observaciones TEXT,
    plazo_subsanacion_dias INTEGER DEFAULT 30,
    fecha_limite_subsanacion DATE,
    validado_por INTEGER REFERENCES public.usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 Documentos (Anexos - PET 4.1.2)
CREATE TABLE public.documentos (
    id SERIAL PRIMARY KEY,
    protocolo_id INTEGER REFERENCES public.protocolos(id) ON DELETE CASCADE,
    version_protocolo_id INTEGER REFERENCES public.versiones_protocolo(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(100) NOT NULL,
    nombre_descriptivo VARCHAR(200),
    nombre_archivo_almacenado VARCHAR(255),
    ruta_archivo VARCHAR(500),
    tamaño_bytes BIGINT,
    hash_checksum VARCHAR(64), -- Generado por aplicación (SHA256)
    numero_hojas INTEGER,
    validado_secretaria BOOLEAN DEFAULT FALSE,
    observaciones_validacion TEXT,
    es_confidencial BOOLEAN DEFAULT TRUE,
    subido_por INTEGER REFERENCES public.usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3.4 Checklist de Requisitos (Validación Secretaria - PET 4.1.3)
CREATE TABLE public.checklist_requisitos (
    id SERIAL PRIMARY KEY,
    tipo_estudio_id INTEGER REFERENCES public.tipos_estudio(id),
    nombre_documento VARCHAR(200) NOT NULL,
    anexo_referencia VARCHAR(20),
    es_obligatorio BOOLEAN DEFAULT TRUE,
    es_condicional BOOLEAN DEFAULT FALSE,
    condicion_json JSONB,
    activo BOOLEAN DEFAULT TRUE
);

-- 3.5 Validación de Documentos por Secretaria
CREATE TABLE public.validaciones_documento (
    id SERIAL PRIMARY KEY,
    version_protocolo_id INTEGER REFERENCES public.versiones_protocolo(id) ON DELETE CASCADE,
    documento_id INTEGER REFERENCES public.documentos(id) ON DELETE CASCADE,
    estado_validacion VARCHAR(50) NOT NULL,
    observaciones TEXT,
    numero_hojas_revisado INTEGER,
    validado_por INTEGER REFERENCES public.usuarios(id),
    fecha_validacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(version_protocolo_id, documento_id)
);

-- 4. TABLAS DE EVALUACIÓN Y SEGUIMIENTO
-- ============================================================================

-- 4.1 Asignaciones de Evaluadores (PET 4.2.2.1)
CREATE TABLE public.asignaciones_evaluacion (
    id SERIAL PRIMARY KEY,
    version_protocolo_id INTEGER REFERENCES public.versiones_protocolo(id) ON DELETE CASCADE,
    evaluador_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    perfil_requerido_id INTEGER REFERENCES public.perfiles_evaluador(id),
    modalidad_revision VARCHAR(50) NOT NULL,
    fecha_asignacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_limite_entrega DATE NOT NULL,
    fecha_entrega_real TIMESTAMPTZ,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    informe_evaluacion TEXT,
    recomendacion VARCHAR(50),
    asignado_por INTEGER REFERENCES public.usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4.2 Seguimientos Programados (Automático - PET 4.4.1)
CREATE TABLE public.seguimientos_programados (
    id SERIAL PRIMARY KEY,
    protocolo_id INTEGER REFERENCES public.protocolos(id) ON DELETE CASCADE,
    tipo_seguimiento VARCHAR(50) NOT NULL,
    fecha_programada DATE NOT NULL,
    fecha_recordatorio_1 DATE,
    fecha_recordatorio_2 DATE,
    fecha_vencimiento DATE,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    informe_recibido BOOLEAN DEFAULT FALSE,
    fecha_recepcion_informe TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(protocolo_id, tipo_seguimiento, fecha_programada)
);

-- 4.3 Informes de Seguimiento
CREATE TABLE public.informes_seguimiento (
    id SERIAL PRIMARY KEY,
    seguimiento_id INTEGER REFERENCES public.seguimientos_programados(id) ON DELETE CASCADE,
    protocolo_id INTEGER REFERENCES public.protocolos(id) ON DELETE CASCADE,
    tipo_informe VARCHAR(50) NOT NULL,
    contenido_informe TEXT,
    fecha_envio TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    enviado_por INTEGER REFERENCES public.usuarios(id),
    estado_evaluacion VARCHAR(50) DEFAULT 'PENDIENTE',
    observaciones TEXT,
    aprobado BOOLEAN,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4.4 Enmiendas (PET 4.5)
CREATE TABLE public.enmiendas (
    id SERIAL PRIMARY KEY,
    protocolo_id INTEGER REFERENCES public.protocolos(id) ON DELETE CASCADE,
    numero_enmienda INTEGER NOT NULL,
    justificacion TEXT NOT NULL,
    tipo_enmienda VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    fecha_solicitud TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMPTZ,
    solicitado_por INTEGER REFERENCES public.usuarios(id)
);

-- 4.5 Renovaciones (PET 4.6)
CREATE TABLE public.renovaciones (
    id SERIAL PRIMARY KEY,
    protocolo_id INTEGER REFERENCES public.protocolos(id) ON DELETE CASCADE,
    numero_renovacion INTEGER NOT NULL,
    periodo_solicitado_desde DATE,
    periodo_solicitado_hasta DATE,
    justificacion TEXT,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    fecha_solicitud TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    solicitado_por INTEGER REFERENCES public.usuarios(id)
);

-- 4.6 Eventos Adversos (EAG/RAGI - PET 4.4.2)
CREATE TABLE public.eventos_adversos (
    id SERIAL PRIMARY KEY,
    protocolo_id INTEGER REFERENCES public.protocolos(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL,
    codigo_sujeto VARCHAR(50),
    fecha_inicio_evento DATE,
    descripcion TEXT,
    gravedad VARCHAR(50),
    fecha_reporte_inicial TIMESTAMPTZ,
    informe_completo_recibido BOOLEAN DEFAULT FALSE,
    fecha_informe_completo TIMESTAMPTZ,
    causalidad_naranjo INTEGER,
    notificado_arcsa BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLAS DE SISTEMA, NOTIFICACIONES Y AUDITORÍA
-- ============================================================================

-- 5.1 Notificaciones (Email/Sistema)
CREATE TABLE public.notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_notificacion VARCHAR(50) NOT NULL,
    asunto VARCHAR(200),
    cuerpo_mensaje TEXT,
    enviar_email BOOLEAN DEFAULT TRUE,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    fecha_programada TIMESTAMPTZ,
    fecha_envio TIMESTAMPTZ,
    protocolo_id INTEGER REFERENCES public.protocolos(id),
    metadata_json JSONB,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5.2 Parámetros del Sistema (Configurable sin código)
CREATE TABLE public.parametros_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo_dato VARCHAR(20),
    descripcion TEXT,
    modificado_por INTEGER REFERENCES public.usuarios(id),
    fecha_modificacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5.3 Auditoría (PET 5.1 - Trazabilidad 7 años)
CREATE TABLE public.audit_log (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES public.usuarios(id),
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id INTEGER,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_origen VARCHAR(50),
    fecha_accion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5.4 Plantillas de Comunicación
CREATE TABLE public.plantillas_comunicacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    cuerpo_html TEXT NOT NULL,
    cuerpo_texto TEXT,
    variables_disponibles JSONB,
    tipo_destinatario VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE
);

-- 5.5 Asistencia a Sesiones
CREATE TABLE public.asistencia_sesiones (
    id SERIAL PRIMARY KEY,
    sesion_id INTEGER NOT NULL,
    fecha_sesion DATE NOT NULL,
    tipo_sesion VARCHAR(50),
    usuario_id INTEGER REFERENCES public.usuarios(id),
    asistio BOOLEAN NOT NULL,
    participo_en_votacion BOOLEAN,
    conflicto_interes BOOLEAN DEFAULT FALSE,
    registro_por INTEGER REFERENCES public.usuarios(id),
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5.6 Actas de Sesión
CREATE TABLE public.actas_sesion (
    id SERIAL PRIMARY KEY,
    numero_sesion INTEGER NOT NULL,
    fecha_sesion DATE NOT NULL,
    tipo_sesion VARCHAR(50) NOT NULL,
    quorum_alcanzado BOOLEAN NOT NULL,
    asistentes INTEGER NOT NULL,
    protocolos_evaluados JSONB,
    decisiones_tomadas JSONB,
    archivo_acta_pdf VARCHAR(500),
    firmada_por_presidente BOOLEAN DEFAULT FALSE,
    firmada_por_secretario BOOLEAN DEFAULT FALSE,
    fecha_archivo TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(numero_sesion, EXTRACT(YEAR FROM fecha_sesion))
);

-- 6. TABLAS DEL SCHEMA ML_FEATURES (Microservicio Python)
-- ============================================================================

-- 6.1 Protocolo Features (Datos extraídos para ML)
CREATE TABLE ml_features.protocolo_features (
    id SERIAL PRIMARY KEY,
    protocolo_id INTEGER UNIQUE REFERENCES public.protocolos(id),
    texto_completo TEXT,
    resumen_ejecutivo TEXT,
    palabras_clave JSONB,
    longitud_documento INTEGER,
    secciones_detectadas JSONB,
    riesgo_predicho VARCHAR(50),
    confianza_prediccion DECIMAL(5,4),
    factores_riesgo JSONB,
    fecha_extraccion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version_modelo VARCHAR(20)
);

-- 6.2 Predicciones Log (Auditoría de ML)
CREATE TABLE ml_features.predicciones_log (
    id SERIAL PRIMARY KEY,
    protocolo_id INTEGER REFERENCES public.protocolos(id),
    tipo_prediccion VARCHAR(50),
    entrada_json JSONB,
    salida_json JSONB,
    modelo_version VARCHAR(20),
    tiempo_procesamiento_ms INTEGER,
    confidence_score DECIMAL(5,4),
    fecha_prediccion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6.3 Modelos Versiones
CREATE TABLE ml_features.modelos_versiones (
    id SERIAL PRIMARY KEY,
    nombre_modelo VARCHAR(100),
    version VARCHAR(20),
    metricas_evaluacion JSONB,
    fecha_entrenamiento TIMESTAMPTZ,
    ruta_archivo VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE,
    creado_por INTEGER REFERENCES public.usuarios(id)
);

-- 6.4 Configuración ML
CREATE TABLE ml_features.configuracion_ml (
    clave VARCHAR(100) PRIMARY KEY,
    valor DECIMAL(10,4),
    descripcion TEXT,
    actualizado_por INTEGER REFERENCES public.usuarios(id),
    fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6.5 Análisis de Documentos (NLP)
CREATE TABLE ml_features.analisis_documentos (
    id SERIAL PRIMARY KEY,
    documento_id INTEGER UNIQUE REFERENCES public.documentos(id),
    tipo_documento VARCHAR(100),
    texto_extraido TEXT,
    secciones_encontradas JSONB,
    errores_detectados JSONB,
    recomendaciones JSONB,
    puntaje_calidad DECIMAL(5,4),
    fecha_analisis TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version_modelo VARCHAR(20)
);

-- 6.6 Balanceo de Evaluadores (Algoritmo)
CREATE TABLE ml_features.balanceo_evaluadores (
    id SERIAL PRIMARY KEY,
    fecha_calculo DATE NOT NULL,
    evaluador_id INTEGER REFERENCES public.usuarios(id),
    carga_actual INTEGER,
    carga_promedio INTEGER,
    desviacion DECIMAL(5,4),
    sugerido_para_asignar BOOLEAN,
    factores_considerados JSONB,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6.7 Predicción de Incumplimientos
CREATE TABLE ml_features.prediccion_incumplimientos (
    id SERIAL PRIMARY KEY,
    protocolo_id INTEGER REFERENCES public.protocolos(id),
    seguimiento_id INTEGER REFERENCES public.seguimientos_programados(id),
    probabilidad_incumplimiento DECIMAL(5,4),
    factores_riesgo JSONB,
    fecha_prediccion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    modelo_version VARCHAR(20),
    accion_recomendada TEXT
);

-- 6.8 Chatbot Conversaciones (RAG)
CREATE TABLE ml_features.chatbot_conversaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES public.usuarios(id),
    pregunta TEXT,
    respuesta TEXT,
    fuentes_consultadas JSONB,
    confianza_respuesta DECIMAL(5,4),
    feedback_util BOOLEAN,
    fecha_conversacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6.9 Reportes MSP Generados
CREATE TABLE ml_features.reportes_msp (
    id SERIAL PRIMARY KEY,
    tipo_reporte VARCHAR(50),
    periodo_desde DATE,
    periodo_hasta DATE,
    datos_json JSONB,
    archivo_generado VARCHAR(500),
    fecha_generacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    generado_por INTEGER REFERENCES public.usuarios(id)
);

-- 7. ÍNDICES PARA RENDIMIENTO
-- ============================================================================
-- Schema Public
CREATE INDEX IF NOT EXISTS idx_protocolos_estado ON public.protocolos(estado);
CREATE INDEX IF NOT EXISTS idx_protocolos_fecha_vencimiento ON public.protocolos(fecha_vencimiento_aprobacion);
CREATE INDEX IF NOT EXISTS idx_asignaciones_evaluador_estado ON public.asignaciones_evaluacion(evaluador_id, estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_estado ON public.notificaciones(usuario_id, estado);
CREATE INDEX IF NOT EXISTS idx_documentos_protocolo ON public.documentos(protocolo_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_fecha ON public.audit_log(fecha_accion);

-- Schema ML Features
CREATE INDEX IF NOT EXISTS idx_protocolo_features_protocolo ON ml_features.protocolo_features(protocolo_id);
CREATE INDEX IF NOT EXISTS idx_predicciones_log_fecha ON ml_features.predicciones_log(fecha_prediccion);
CREATE INDEX IF NOT EXISTS idx_analisis_documentos_documento ON ml_features.analisis_documentos(documento_id);
CREATE INDEX IF NOT EXISTS idx_prediccion_incumplimientos_probabilidad ON ml_features.prediccion_incumplimientos(probabilidad_incumplimiento DESC);

-- 8. VISTAS PARA CONSUMO DEL MICROSERVICIO PYTHON
-- ============================================================================

-- Vista 1: Datos completos de protocolo para análisis ML
CREATE OR REPLACE VIEW ml_features.vista_protocolos_completos AS
SELECT 
    p.id,
    p.codigo_ceish,
    p.titulo,
    te.nombre as tipo_estudio,
    nr.nombre as nivel_riesgo,
    u.nombres_completos as investigador_principal,
    p.fecha_recepcion_inicial,
    p.fecha_aprobacion_definitiva,
    p.estado,
    p.poblacion_vulnerable,
    p.utiliza_muestras_biologicas,
    p.duracion_estudio_meses,
    json_agg(DISTINCT d.tipo_documento) as documentos_presentados,
    json_agg(DISTINCT ae.evaluador_id) as evaluadores_asignados
FROM public.protocolos p
JOIN public.tipos_estudio te ON p.tipo_estudio_id = te.id
JOIN public.niveles_riesgo nr ON p.nivel_riesgo_id = nr.id
JOIN public.usuarios u ON p.investigador_principal_id = u.id
LEFT JOIN public.documentos d ON p.id = d.protocolo_id
LEFT JOIN public.versiones_protocolo vp ON p.id = vp.protocolo_id
LEFT JOIN public.asignaciones_evaluacion ae ON vp.id = ae.version_protocolo_id
GROUP BY p.id, te.nombre, nr.nombre, u.nombres_completos;

-- Vista 2: Carga de trabajo de evaluadores para algoritmo de balanceo
CREATE OR REPLACE VIEW ml_features.vista_carga_evaluadores_ml AS
SELECT 
    u.id as evaluador_id,
    u.nombres_completos,
    u.email_institucional,
    STRING_AGG(DISTINCT pe.nombre, ', ') as perfiles,
    COUNT(DISTINCT ae.id) as total_asignaciones,
    COUNT(DISTINCT CASE WHEN ae.estado = 'PENDIENTE' THEN ae.id END) as pendientes,
    COUNT(DISTINCT CASE WHEN ae.estado = 'ENTREGADO' THEN ae.id END) as completados,
    COUNT(DISTINCT CASE WHEN ae.fecha_limite_entrega < CURRENT_DATE AND ae.estado != 'ENTREGADO' THEN 1 END) as vencidos,
    ROUND(AVG(EXTRACT(DAY FROM (ae.fecha_entrega_real - ae.fecha_asignacion))), 2) as promedio_dias_entrega,
    MAX(ae.fecha_limite_entrega) as proximo_vencimiento
FROM public.usuarios u
JOIN public.evaluadores_perfil ep ON u.id = ep.usuario_id AND ep.activo = TRUE
JOIN public.perfiles_evaluador pe ON ep.perfil_id = pe.id
LEFT JOIN public.asignaciones_evaluacion ae ON u.id = ae.evaluador_id
GROUP BY u.id, u.nombres_completos, u.email_institucional
ORDER BY pendientes DESC;

-- Vista 3: Seguimientos en riesgo para predicción de incumplimientos
CREATE OR REPLACE VIEW ml_features.vista_seguimientos_riesgo AS
SELECT 
    sp.id,
    sp.protocolo_id,
    p.codigo_ceish,
    sp.tipo_seguimiento,
    sp.fecha_programada,
    sp.fecha_vencimiento,
    sp.estado,
    u.nombres_completos as investigador,
    u.email_institucional,
    CURRENT_DATE - sp.fecha_vencimiento as dias_vencido,
    p.estado as estado_protocolo
FROM public.seguimientos_programados sp
JOIN public.protocolos p ON sp.protocolo_id = p.id
JOIN public.usuarios u ON p.investigador_principal_id = u.id
WHERE sp.estado IN ('PENDIENTE', 'NOTIFICADO')
ORDER BY sp.fecha_vencimiento ASC;

-- 9. FUNCIONES Y TRIGGERS
-- ============================================================================

-- Trigger 1: Actualizar fecha_actualización en protocolos
CREATE OR REPLACE FUNCTION public.actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_protocolos
    BEFORE UPDATE ON public.protocolos
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_fecha_actualizacion();

-- Trigger 2: Auditoría automática
CREATE OR REPLACE FUNCTION public.audit_cambio_critico()
RETURNS TRIGGER AS $$
DECLARE
    usuario_id INTEGER;
BEGIN
    -- Nota: El usuario debe setearse desde la aplicación mediante SET LOCAL
    usuario_id := current_setting('app.current_user_id', true)::INTEGER;
    
    INSERT INTO public.audit_log (
        usuario_id, accion, tabla_afectada, registro_id, 
        datos_anteriores, datos_nuevos, ip_origen, fecha_accion
    ) VALUES (
        usuario_id, 
        TG_OP, 
        TG_TABLE_NAME, 
        COALESCE(NEW.id, OLD.id),
        to_jsonb(OLD), 
        to_jsonb(NEW),
        current_setting('app.client_ip', true),
        CURRENT_TIMESTAMP
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_protocolos AFTER UPDATE OR DELETE ON public.protocolos FOR EACH ROW EXECUTE FUNCTION public.audit_cambio_critico();
CREATE TRIGGER trg_audit_documentos AFTER UPDATE OR DELETE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.audit_cambio_critico();
CREATE TRIGGER trg_audit_asignaciones AFTER UPDATE OR DELETE ON public.asignaciones_evaluacion FOR EACH ROW EXECUTE FUNCTION public.audit_cambio_critico();

-- Trigger 3: Cuando se aprueba un protocolo, registrar features para ML
CREATE OR REPLACE FUNCTION ml_features.registrar_features_aprobacion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'APROBADO_DEFINITIVO' AND OLD.estado != 'APROBADO_DEFINITIVO' THEN
        INSERT INTO ml_features.protocolo_features 
        (protocolo_id, riesgo_predicho, confianza_prediccion, fecha_extraccion)
        VALUES 
        (NEW.id, NULL, NULL, CURRENT_TIMESTAMP);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registrar_features_ml
    AFTER UPDATE ON public.protocolos
    FOR EACH ROW EXECUTE FUNCTION ml_features.registrar_features_aprobacion();

-- 10. USUARIOS DE BASE DE DATOS Y PERMISOS
-- ============================================================================

-- Usuario para NestJS (acceso completo a public, lectura a ml_features)
CREATE USER app_nestjs WITH PASSWORD 'nestjs_secure_password_2024';
GRANT CONNECT ON DATABASE current_database() TO app_nestjs;
GRANT USAGE ON SCHEMA public TO app_nestjs;
GRANT USAGE ON SCHEMA ml_features TO app_nestjs;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_nestjs;
GRANT SELECT ON ALL TABLES IN SCHEMA ml_features TO app_nestjs;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_nestjs;

-- Usuario para Python ML (lectura a public, escritura a ml_features)
CREATE USER app_python_ml WITH PASSWORD 'python_ml_secure_password_2024';
GRANT CONNECT ON DATABASE current_database() TO app_python_ml;
GRANT USAGE ON SCHEMA public TO app_python_ml;
GRANT USAGE ON SCHEMA ml_features TO app_python_ml;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_python_ml;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ml_features TO app_python_ml;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ml_features TO app_python_ml;

-- 11. DATOS INICIALES (SEEDERS)
-- ============================================================================

-- Roles
INSERT INTO public.roles (nombre, descripcion) VALUES 
('investigador', 'Usuario que envía protocolos'),
('secretaria', 'Validación inicial y gestión documental'),
('presidente', 'Asignación de evaluadores y resoluciones'),
('evaluador', 'Miembros del comité CEISH'),
('admin_ti', 'Administrador técnico del sistema')
ON CONFLICT (nombre) DO NOTHING;

-- Perfiles Evaluadores
INSERT INTO public.perfiles_evaluador (nombre, descripcion, obligatorio_para_tipo_estudio, orden_prioridad) VALUES
('juridico', 'Revisa aspectos legales y consentimiento', '{"IO": true, "EI": true, "EC": true}', 1),
('sociedad_civil', 'Representante sociedad civil', '{"IO": true, "EI": true, "EC": true}', 2),
('metodologia', 'Experto metodología investigación', '{"IO": true, "EI": true, "EC": true}', 3),
('salud', 'Profesional de la salud', '{"IO": false, "EI": true, "EC": true}', 4),
('bioetica', 'Experto en bioética', '{"IO": false, "EI": true, "EC": true}', 5)
ON CONFLICT (nombre) DO NOTHING;

-- Tipos de Estudio
INSERT INTO public.tipos_estudio (codigo, nombre, plazo_evaluacion_dias, requiere_arcsa) VALUES
('IO', 'Observacional', 45, FALSE),
('EI', 'Intervención', 45, FALSE),
('EC', 'Ensayo Clínico', 60, TRUE),
('EXENTO', 'Exento de Evaluación', 15, FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- Niveles de Riesgo
INSERT INTO public.niveles_riesgo (codigo, nombre, tipo_revision_requerida) VALUES
('SIN_RIESGO', 'Sin Riesgo', 'EXENCION'),
('MINIMO', 'Riesgo Mínimo', 'EXPEDITA'),
('MAYOR_MINIMO', 'Riesgo Mayor al Mínimo', 'PLENO')
ON CONFLICT (codigo) DO NOTHING;

-- Parámetros del Sistema
INSERT INTO public.parametros_sistema (clave, valor, tipo_dato, descripcion) VALUES
('plazo_subsanacion_dias', '30', 'INTEGER', 'Días para subsanar observaciones'),
('plazo_evaluacion_expedita_dias', '8', 'INTEGER', 'Días hábiles evaluación expedita'),
('vigencia_aprobacion_anios', '1', 'INTEGER', 'Vigencia de aprobación'),
('plazo_renovacion_antes_dias', '60', 'INTEGER', 'Días antes de vencimiento para renovar')
ON CONFLICT (clave) DO NOTHING;

-- Configuración ML
INSERT INTO ml_features.configuracion_ml (clave, valor, descripcion) VALUES
('umbral_riesgo_alto', 0.75, 'Probabilidad mínima para clasificar como riesgo mayor'),
('umbral_confianza_minima', 0.60, 'Confianza mínima para aceptar predicción automática'),
('peso_carga_evaluador', 0.40, 'Peso del factor carga en algoritmo de balanceo')
ON CONFLICT (clave) DO NOTHING;

-- Plantillas de Comunicación
INSERT INTO public.plantillas_comunicacion (codigo, asunto, tipo_destinatario, cuerpo_html) VALUES
('RECEPCION_PROTOCOL', 'Notificación de Recepción de Protocolo', 'INVESTIGADOR', '<p>Estimado investigador, su protocolo ha sido recibido...</p>'),
('APROBACION_DEFINITIVA', 'Aprobación Definitiva de Protocolo', 'INVESTIGADOR', '<p>Su protocolo ha sido aprobado definitivamente...</p>'),
('RECORDATORIO_INFORME', 'Recordatorio: Informe Pendiente', 'INVESTIGADOR', '<p>Le recordamos que debe presentar su informe...</p>'),
('ASIGNACION_EVALUADOR', 'Asignación de Protocolo para Evaluación', 'EVALUADOR', '<p>Se le ha asignado un protocolo para evaluación...</p>')
ON CONFLICT (codigo) DO NOTHING;

-- 12. COMENTARIOS FINALES DE SEGURIDAD
-- ============================================================================
COMMENT ON SCHEMA ml_features IS 'Schema exclusivo para microservicio Python ML - Innovación de tesis';
COMMENT ON TABLE ml_features.protocolo_features IS 'Features extraídas de protocolos para entrenamiento de modelos ML';
COMMENT ON TABLE ml_features.predicciones_log IS 'Auditoría completa de todas las predicciones del sistema ML';
COMMENT ON TABLE ml_features.analisis_documentos IS 'Resultados de análisis NLP de documentos (consentimientos, protocolos)';

-- ============================================================================
-- FIN DEL SCRIPT - BASE DE DATOS COMPLETA LISTA PARA PRODUCIÓN
-- ============================================================================


-- Verificar roles creados
SELECT * FROM public.roles;

-- Verificar perfiles de evaluador
SELECT * FROM public.perfiles_evaluador;

-- Verificar tipos de estudio
SELECT * FROM public.tipos_estudio;

-- Verificar niveles de riesgo
SELECT * FROM public.niveles_riesgo;

-- Verificar parámetros del sistema
SELECT * FROM public.parametros_sistema;

-- Verificar configuración ML
SELECT * FROM ml_features.configuracion_ml;