--
-- PostgreSQL database dump
--

-- Dumped from database version 15.17
-- Dumped by pg_dump version 17.0

-- Started on 2026-06-09 02:55:03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 23772)
-- Name: catalogos; Type: SCHEMA; Schema: -; Owner: ceish_user
--

CREATE SCHEMA catalogos;


ALTER SCHEMA catalogos OWNER TO ceish_user;

--
-- TOC entry 4289 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA catalogos; Type: COMMENT; Schema: -; Owner: ceish_user
--

COMMENT ON SCHEMA catalogos IS 'Catálogos maestros reutilizables';


--
-- TOC entry 7 (class 2615 OID 23774)
-- Name: evaluacion; Type: SCHEMA; Schema: -; Owner: ceish_user
--

CREATE SCHEMA evaluacion;


ALTER SCHEMA evaluacion OWNER TO ceish_user;

--
-- TOC entry 4290 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA evaluacion; Type: COMMENT; Schema: -; Owner: ceish_user
--

COMMENT ON SCHEMA evaluacion IS 'Proceso PET 4.2: Evaluación ética/metodológica/jurídica';


--
-- TOC entry 10 (class 2615 OID 23777)
-- Name: gestion; Type: SCHEMA; Schema: -; Owner: ceish_user
--

CREATE SCHEMA gestion;


ALTER SCHEMA gestion OWNER TO ceish_user;

--
-- TOC entry 4291 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA gestion; Type: COMMENT; Schema: -; Owner: ceish_user
--

COMMENT ON SCHEMA gestion IS 'Procesos PET 4.5-4.7: Enmiendas, renovaciones, suspensiones';


--
-- TOC entry 12 (class 2615 OID 23779)
-- Name: ml_features; Type: SCHEMA; Schema: -; Owner: ceish_user
--

CREATE SCHEMA ml_features;


ALTER SCHEMA ml_features OWNER TO ceish_user;

--
-- TOC entry 4292 (class 0 OID 0)
-- Dependencies: 12
-- Name: SCHEMA ml_features; Type: COMMENT; Schema: -; Owner: ceish_user
--

COMMENT ON SCHEMA ml_features IS 'Microservicio Python ML - Innovación de tesis';


--
-- TOC entry 13 (class 2615 OID 23780)
-- Name: public; Type: SCHEMA; Schema: -; Owner: ceish_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO ceish_user;

--
-- TOC entry 4293 (class 0 OID 0)
-- Dependencies: 13
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: ceish_user
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 6 (class 2615 OID 23773)
-- Name: recepcion; Type: SCHEMA; Schema: -; Owner: ceish_user
--

CREATE SCHEMA recepcion;


ALTER SCHEMA recepcion OWNER TO ceish_user;

--
-- TOC entry 4295 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA recepcion; Type: COMMENT; Schema: -; Owner: ceish_user
--

COMMENT ON SCHEMA recepcion IS 'Proceso PET 4.1: Recepción de protocolos';


--
-- TOC entry 8 (class 2615 OID 23775)
-- Name: resolucion; Type: SCHEMA; Schema: -; Owner: ceish_user
--

CREATE SCHEMA resolucion;


ALTER SCHEMA resolucion OWNER TO ceish_user;

--
-- TOC entry 4296 (class 0 OID 0)
-- Dependencies: 8
-- Name: SCHEMA resolucion; Type: COMMENT; Schema: -; Owner: ceish_user
--

COMMENT ON SCHEMA resolucion IS 'Proceso PET 4.3: Emisión de resoluciones';


--
-- TOC entry 9 (class 2615 OID 23776)
-- Name: seguimiento; Type: SCHEMA; Schema: -; Owner: ceish_user
--

CREATE SCHEMA seguimiento;


ALTER SCHEMA seguimiento OWNER TO ceish_user;

--
-- TOC entry 4297 (class 0 OID 0)
-- Dependencies: 9
-- Name: SCHEMA seguimiento; Type: COMMENT; Schema: -; Owner: ceish_user
--

COMMENT ON SCHEMA seguimiento IS 'Proceso PET 4.4: Seguimiento de estudios aprobados';


--
-- TOC entry 11 (class 2615 OID 23778)
-- Name: sistema; Type: SCHEMA; Schema: -; Owner: ceish_user
--

CREATE SCHEMA sistema;


ALTER SCHEMA sistema OWNER TO ceish_user;

--
-- TOC entry 4298 (class 0 OID 0)
-- Dependencies: 11
-- Name: SCHEMA sistema; Type: COMMENT; Schema: -; Owner: ceish_user
--

COMMENT ON SCHEMA sistema IS 'Normas de funcionamiento PET 5.1: Auditoría, parámetros';


--
-- TOC entry 1125 (class 1247 OID 44923)
-- Name: protocolo_instituciones_tipo_enum; Type: TYPE; Schema: public; Owner: ceish_user
--

CREATE TYPE public.protocolo_instituciones_tipo_enum AS ENUM (
    'PUBLIC',
    'PRIVATE'
);


ALTER TYPE public.protocolo_instituciones_tipo_enum OWNER TO ceish_user;

--
-- TOC entry 1134 (class 1247 OID 44961)
-- Name: protocolo_investigadores_rol_enum; Type: TYPE; Schema: public; Owner: ceish_user
--

CREATE TYPE public.protocolo_investigadores_rol_enum AS ENUM (
    'PRINCIPAL',
    'CO_INVESTIGADOR',
    'PATROCINADOR'
);


ALTER TYPE public.protocolo_investigadores_rol_enum OWNER TO ceish_user;

--
-- TOC entry 1161 (class 1247 OID 106565)
-- Name: protocolo_requisitos_estado_enum; Type: TYPE; Schema: public; Owner: ceish_user
--

CREATE TYPE public.protocolo_requisitos_estado_enum AS ENUM (
    'PENDIENTE',
    'PRESENTADO',
    'APROBADO',
    'RECHAZADO',
    'NO_APLICA',
    'NO_PRESENTADO'
);


ALTER TYPE public.protocolo_requisitos_estado_enum OWNER TO ceish_user;

--
-- TOC entry 1140 (class 1247 OID 45008)
-- Name: protocolos_cobertura_geografica_enum; Type: TYPE; Schema: public; Owner: ceish_user
--

CREATE TYPE public.protocolos_cobertura_geografica_enum AS ENUM (
    'NACIONAL',
    'ZONAL',
    'PROVINCIAL',
    'LOCAL'
);


ALTER TYPE public.protocolos_cobertura_geografica_enum OWNER TO ceish_user;

--
-- TOC entry 1155 (class 1247 OID 57493)
-- Name: protocolos_estado_recepcion_enum; Type: TYPE; Schema: public; Owner: ceish_user
--

CREATE TYPE public.protocolos_estado_recepcion_enum AS ENUM (
    'COMPLETO',
    'INCOMPLETO',
    'PENDIENTE_SUBSANACION',
    'EN_REVISION_SECRETARIA'
);


ALTER TYPE public.protocolos_estado_recepcion_enum OWNER TO ceish_user;

--
-- TOC entry 1149 (class 1247 OID 45081)
-- Name: protocolos_tipo_revision_enum; Type: TYPE; Schema: public; Owner: ceish_user
--

CREATE TYPE public.protocolos_tipo_revision_enum AS ENUM (
    'EXPEDITA',
    'PLENO',
    'ENSAYO_CLINICO'
);


ALTER TYPE public.protocolos_tipo_revision_enum OWNER TO ceish_user;

--
-- TOC entry 348 (class 1255 OID 57366)
-- Name: generate_codigo_ceish(integer, integer); Type: FUNCTION; Schema: catalogos; Owner: ceish_user
--

CREATE FUNCTION catalogos.generate_codigo_ceish(p_tipo_id integer, p_year integer) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
                  DECLARE
                      v_tipo_sigla varchar;
                      v_secuencial int;
                      v_nuevo_codigo varchar;
                  BEGIN
                      -- Obtener sigla según tipo_estudio_id
                      SELECT CASE 
                          WHEN codigo = 'IO' THEN 'IO'
                          WHEN codigo = 'EI' THEN 'EI'
                          WHEN codigo = 'EC' THEN 'EC'
                          ELSE 'EX'
                      END INTO v_tipo_sigla
                      FROM catalogos.tipos_estudio WHERE id = p_tipo_id;

                      -- Calcular secuencial
                      SELECT COALESCE(MAX(CAST(split_part(codigo_ceish, '-', 4) AS INTEGER)), 0) + 1 
                      INTO v_secuencial
                      FROM public.protocolos 
                      WHERE codigo_ceish LIKE 'CEISH-ESPOCH-' || v_tipo_sigla || '-%-' || p_year;

                      v_nuevo_codigo := 'CEISH-ESPOCH-' || v_tipo_sigla || '-' || LPAD(v_secuencial::text, 3, '0') || '-' || p_year;
                      
                      RETURN v_nuevo_codigo;
                  END;
                  $$;


ALTER FUNCTION catalogos.generate_codigo_ceish(p_tipo_id integer, p_year integer) OWNER TO ceish_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 251 (class 1259 OID 23982)
-- Name: causales_suspension; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.causales_suspension (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL
);


ALTER TABLE catalogos.causales_suspension OWNER TO ceish_user;

--
-- TOC entry 250 (class 1259 OID 23981)
-- Name: causales_suspension_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.causales_suspension_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.causales_suspension_id_seq OWNER TO ceish_user;

--
-- TOC entry 4299 (class 0 OID 0)
-- Dependencies: 250
-- Name: causales_suspension_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.causales_suspension_id_seq OWNED BY catalogos.causales_suspension.id;


--
-- TOC entry 249 (class 1259 OID 23971)
-- Name: criterios_evaluacion; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.criterios_evaluacion (
    id integer NOT NULL,
    tipo character varying(50),
    descripcion text
);


ALTER TABLE catalogos.criterios_evaluacion OWNER TO ceish_user;

--
-- TOC entry 248 (class 1259 OID 23970)
-- Name: criterios_evaluacion_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.criterios_evaluacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.criterios_evaluacion_id_seq OWNER TO ceish_user;

--
-- TOC entry 4300 (class 0 OID 0)
-- Dependencies: 248
-- Name: criterios_evaluacion_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.criterios_evaluacion_id_seq OWNED BY catalogos.criterios_evaluacion.id;


--
-- TOC entry 235 (class 1259 OID 23875)
-- Name: estados; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.estados (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    categoria character varying(50),
    codigo character varying(30) NOT NULL
);


ALTER TABLE catalogos.estados OWNER TO ceish_user;

--
-- TOC entry 234 (class 1259 OID 23874)
-- Name: estados_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.estados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.estados_id_seq OWNER TO ceish_user;

--
-- TOC entry 4301 (class 0 OID 0)
-- Dependencies: 234
-- Name: estados_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.estados_id_seq OWNED BY catalogos.estados.id;


--
-- TOC entry 241 (class 1259 OID 23924)
-- Name: evaluadores_perfil; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.evaluadores_perfil (
    usuario_id integer NOT NULL,
    perfil_id integer NOT NULL,
    fecha_asignacion timestamp without time zone DEFAULT now() NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE catalogos.evaluadores_perfil OWNER TO ceish_user;

--
-- TOC entry 243 (class 1259 OID 23942)
-- Name: modalidades_revision; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.modalidades_revision (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE catalogos.modalidades_revision OWNER TO ceish_user;

--
-- TOC entry 242 (class 1259 OID 23941)
-- Name: modalidades_revision_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.modalidades_revision_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.modalidades_revision_id_seq OWNER TO ceish_user;

--
-- TOC entry 4302 (class 0 OID 0)
-- Dependencies: 242
-- Name: modalidades_revision_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.modalidades_revision_id_seq OWNED BY catalogos.modalidades_revision.id;


--
-- TOC entry 334 (class 1259 OID 65617)
-- Name: modulos; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.modulos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo character varying(50) NOT NULL,
    icono character varying(50),
    orden integer DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone
);


ALTER TABLE catalogos.modulos OWNER TO ceish_user;

--
-- TOC entry 333 (class 1259 OID 65616)
-- Name: modulos_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.modulos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.modulos_id_seq OWNER TO ceish_user;

--
-- TOC entry 4303 (class 0 OID 0)
-- Dependencies: 333
-- Name: modulos_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.modulos_id_seq OWNED BY catalogos.modulos.id;


--
-- TOC entry 233 (class 1259 OID 23865)
-- Name: niveles_riesgo; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.niveles_riesgo (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(100),
    tipo_revision character varying(50),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone
);


ALTER TABLE catalogos.niveles_riesgo OWNER TO ceish_user;

--
-- TOC entry 232 (class 1259 OID 23864)
-- Name: niveles_riesgo_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.niveles_riesgo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.niveles_riesgo_id_seq OWNER TO ceish_user;

--
-- TOC entry 4304 (class 0 OID 0)
-- Dependencies: 232
-- Name: niveles_riesgo_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.niveles_riesgo_id_seq OWNED BY catalogos.niveles_riesgo.id;


--
-- TOC entry 240 (class 1259 OID 23912)
-- Name: perfiles_evaluador; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.perfiles_evaluador (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    obligatorio_para_tipo_estudio jsonb,
    orden_prioridad integer DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE catalogos.perfiles_evaluador OWNER TO ceish_user;

--
-- TOC entry 239 (class 1259 OID 23911)
-- Name: perfiles_evaluador_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.perfiles_evaluador_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.perfiles_evaluador_id_seq OWNER TO ceish_user;

--
-- TOC entry 4305 (class 0 OID 0)
-- Dependencies: 239
-- Name: perfiles_evaluador_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.perfiles_evaluador_id_seq OWNED BY catalogos.perfiles_evaluador.id;


--
-- TOC entry 332 (class 1259 OID 49246)
-- Name: perfiles_investigador; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.perfiles_investigador (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    email_personal character varying(255),
    telefono character varying(255),
    institucion_pertenece character varying(200),
    cargo character varying(100),
    registro_senescyt character varying(50),
    tipo_documento character varying(50),
    primer_nombre character varying(100),
    segundo_nombre character varying(100),
    primer_apellido character varying(100),
    segundo_apellido character varying(100),
    nacionalidad character varying(100),
    acepta_terminos boolean DEFAULT false NOT NULL,
    acepta_reglamento boolean DEFAULT false NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone
);


ALTER TABLE catalogos.perfiles_investigador OWNER TO ceish_user;

--
-- TOC entry 331 (class 1259 OID 49245)
-- Name: perfiles_investigador_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.perfiles_investigador_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.perfiles_investigador_id_seq OWNER TO ceish_user;

--
-- TOC entry 4306 (class 0 OID 0)
-- Dependencies: 331
-- Name: perfiles_investigador_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.perfiles_investigador_id_seq OWNED BY catalogos.perfiles_investigador.id;


--
-- TOC entry 228 (class 1259 OID 23831)
-- Name: permisos; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.permisos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone,
    codigo character varying(50) NOT NULL,
    modulo_id integer
);


ALTER TABLE catalogos.permisos OWNER TO ceish_user;

--
-- TOC entry 227 (class 1259 OID 23830)
-- Name: permisos_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.permisos_id_seq OWNER TO ceish_user;

--
-- TOC entry 4307 (class 0 OID 0)
-- Dependencies: 227
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.permisos_id_seq OWNED BY catalogos.permisos.id;


--
-- TOC entry 229 (class 1259 OID 23839)
-- Name: rol_permisos; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.rol_permisos (
    rol_id integer NOT NULL,
    permiso_id integer NOT NULL
);


ALTER TABLE catalogos.rol_permisos OWNER TO ceish_user;

--
-- TOC entry 223 (class 1259 OID 23782)
-- Name: roles; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone,
    activo boolean DEFAULT true NOT NULL,
    descripcion character varying(255),
    codigo character varying(20) NOT NULL
);


ALTER TABLE catalogos.roles OWNER TO ceish_user;

--
-- TOC entry 222 (class 1259 OID 23781)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.roles_id_seq OWNER TO ceish_user;

--
-- TOC entry 4308 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.roles_id_seq OWNED BY catalogos.roles.id;


--
-- TOC entry 238 (class 1259 OID 23896)
-- Name: tipo_documento_estudio; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.tipo_documento_estudio (
    tipo_documento_id integer NOT NULL,
    tipo_estudio_id integer NOT NULL,
    obligatorio boolean DEFAULT true NOT NULL
);


ALTER TABLE catalogos.tipo_documento_estudio OWNER TO ceish_user;

--
-- TOC entry 237 (class 1259 OID 23884)
-- Name: tipos_documento; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.tipos_documento (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    es_obligatorio boolean DEFAULT true NOT NULL,
    es_condicional boolean DEFAULT false NOT NULL,
    condicion_json jsonb,
    tipo_estudio_aplica jsonb,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone,
    codigo_anexo character varying(20)
);


ALTER TABLE catalogos.tipos_documento OWNER TO ceish_user;

--
-- TOC entry 236 (class 1259 OID 23883)
-- Name: tipos_documento_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.tipos_documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.tipos_documento_id_seq OWNER TO ceish_user;

--
-- TOC entry 4309 (class 0 OID 0)
-- Dependencies: 236
-- Name: tipos_documento_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.tipos_documento_id_seq OWNED BY catalogos.tipos_documento.id;


--
-- TOC entry 231 (class 1259 OID 23855)
-- Name: tipos_estudio; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.tipos_estudio (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    plazo_evaluacion_dias integer,
    requiere_arcsa boolean DEFAULT false,
    periodicidad_informe_dias integer,
    requiere_informe_inicio boolean,
    requiere_informe_final boolean,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone,
    codigo character varying(20) NOT NULL
);


ALTER TABLE catalogos.tipos_estudio OWNER TO ceish_user;

--
-- TOC entry 230 (class 1259 OID 23854)
-- Name: tipos_estudio_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.tipos_estudio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.tipos_estudio_id_seq OWNER TO ceish_user;

--
-- TOC entry 4310 (class 0 OID 0)
-- Dependencies: 230
-- Name: tipos_estudio_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.tipos_estudio_id_seq OWNED BY catalogos.tipos_estudio.id;


--
-- TOC entry 247 (class 1259 OID 23962)
-- Name: tipos_resolucion; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.tipos_resolucion (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE catalogos.tipos_resolucion OWNER TO ceish_user;

--
-- TOC entry 246 (class 1259 OID 23961)
-- Name: tipos_resolucion_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.tipos_resolucion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.tipos_resolucion_id_seq OWNER TO ceish_user;

--
-- TOC entry 4311 (class 0 OID 0)
-- Dependencies: 246
-- Name: tipos_resolucion_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.tipos_resolucion_id_seq OWNED BY catalogos.tipos_resolucion.id;


--
-- TOC entry 245 (class 1259 OID 23951)
-- Name: tipos_seguimiento; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.tipos_seguimiento (
    id integer NOT NULL,
    nombre character varying(100),
    codigo character varying(50),
    plazo_dias_desde_aprobacion integer,
    plazo_dias_desde_finalizacion integer,
    requiere_evaluacion boolean DEFAULT true,
    activo boolean DEFAULT true
);


ALTER TABLE catalogos.tipos_seguimiento OWNER TO ceish_user;

--
-- TOC entry 244 (class 1259 OID 23950)
-- Name: tipos_seguimiento_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.tipos_seguimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.tipos_seguimiento_id_seq OWNER TO ceish_user;

--
-- TOC entry 4312 (class 0 OID 0)
-- Dependencies: 244
-- Name: tipos_seguimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.tipos_seguimiento_id_seq OWNED BY catalogos.tipos_seguimiento.id;


--
-- TOC entry 225 (class 1259 OID 23795)
-- Name: usuarios; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.usuarios (
    id integer NOT NULL,
    cedula character varying(20) NOT NULL,
    nombres_completos character varying(200) NOT NULL,
    email_institucional character varying(100) NOT NULL,
    password_hash character varying(255),
    activo boolean DEFAULT true NOT NULL,
    intentos_fallidos integer DEFAULT 0 NOT NULL,
    bloqueado_hasta timestamp with time zone,
    refresh_token_hash character varying(255),
    ultimo_acceso timestamp with time zone,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone,
    email_verificado boolean DEFAULT false NOT NULL,
    token_confirmacion_hash character varying(255),
    token_recuperacion_hash character varying(255),
    token_recuperacion_expira timestamp with time zone
);


ALTER TABLE catalogos.usuarios OWNER TO ceish_user;

--
-- TOC entry 224 (class 1259 OID 23794)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: catalogos; Owner: ceish_user
--

CREATE SEQUENCE catalogos.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE catalogos.usuarios_id_seq OWNER TO ceish_user;

--
-- TOC entry 4313 (class 0 OID 0)
-- Dependencies: 224
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: catalogos; Owner: ceish_user
--

ALTER SEQUENCE catalogos.usuarios_id_seq OWNED BY catalogos.usuarios.id;


--
-- TOC entry 226 (class 1259 OID 23809)
-- Name: usuarios_roles; Type: TABLE; Schema: catalogos; Owner: ceish_user
--

CREATE TABLE catalogos.usuarios_roles (
    usuario_id integer NOT NULL,
    rol_id integer NOT NULL
);


ALTER TABLE catalogos.usuarios_roles OWNER TO ceish_user;

--
-- TOC entry 272 (class 1259 OID 24282)
-- Name: acta_asistente; Type: TABLE; Schema: evaluacion; Owner: ceish_user
--

CREATE TABLE evaluacion.acta_asistente (
    acta_id integer NOT NULL,
    usuario_id integer NOT NULL
);


ALTER TABLE evaluacion.acta_asistente OWNER TO ceish_user;

--
-- TOC entry 271 (class 1259 OID 24267)
-- Name: acta_protocolo; Type: TABLE; Schema: evaluacion; Owner: ceish_user
--

CREATE TABLE evaluacion.acta_protocolo (
    acta_id integer NOT NULL,
    protocolo_id integer NOT NULL
);


ALTER TABLE evaluacion.acta_protocolo OWNER TO ceish_user;

--
-- TOC entry 270 (class 1259 OID 24246)
-- Name: actas; Type: TABLE; Schema: evaluacion; Owner: ceish_user
--

CREATE TABLE evaluacion.actas (
    id integer NOT NULL,
    sesion_id integer NOT NULL,
    numero_acta integer,
    resumen_agenda text,
    decisiones_tomadas jsonb,
    lista_asistentes jsonb,
    conflictos_interes_registrados jsonb,
    consultores_externos jsonb,
    archivo_acta_pdf character varying(500),
    firmada_por_presidente boolean DEFAULT false NOT NULL,
    firmada_por_secretario boolean DEFAULT false NOT NULL,
    fecha_elaboracion timestamp without time zone DEFAULT now() NOT NULL,
    creado_por integer,
    summary text,
    deliberations text,
    voting jsonb
);


ALTER TABLE evaluacion.actas OWNER TO ceish_user;

--
-- TOC entry 269 (class 1259 OID 24245)
-- Name: actas_id_seq; Type: SEQUENCE; Schema: evaluacion; Owner: ceish_user
--

CREATE SEQUENCE evaluacion.actas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE evaluacion.actas_id_seq OWNER TO ceish_user;

--
-- TOC entry 4314 (class 0 OID 0)
-- Dependencies: 269
-- Name: actas_id_seq; Type: SEQUENCE OWNED BY; Schema: evaluacion; Owner: ceish_user
--

ALTER SEQUENCE evaluacion.actas_id_seq OWNED BY evaluacion.actas.id;


--
-- TOC entry 263 (class 1259 OID 24149)
-- Name: asignaciones_evaluacion; Type: TABLE; Schema: evaluacion; Owner: ceish_user
--

CREATE TABLE evaluacion.asignaciones_evaluacion (
    id integer NOT NULL,
    version_id integer NOT NULL,
    evaluador_id integer NOT NULL,
    perfil_id integer,
    modalidad_id integer,
    estado_id integer DEFAULT 5 NOT NULL,
    fecha_limite date,
    fecha_asignacion timestamp without time zone DEFAULT now() NOT NULL,
    fecha_entrega_real timestamp without time zone,
    informe_evaluacion text,
    recomendacion character varying(50),
    asignado_por integer,
    aprobado_asignacion_por integer,
    fecha_sugerencia timestamp without time zone DEFAULT now() NOT NULL,
    fecha_confirmacion timestamp without time zone,
    sugerido_por integer,
    confirmado_por integer,
    ruta_informe_pdf character varying(500)
);


ALTER TABLE evaluacion.asignaciones_evaluacion OWNER TO ceish_user;

--
-- TOC entry 262 (class 1259 OID 24148)
-- Name: asignaciones_evaluacion_id_seq; Type: SEQUENCE; Schema: evaluacion; Owner: ceish_user
--

CREATE SEQUENCE evaluacion.asignaciones_evaluacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE evaluacion.asignaciones_evaluacion_id_seq OWNER TO ceish_user;

--
-- TOC entry 4315 (class 0 OID 0)
-- Dependencies: 262
-- Name: asignaciones_evaluacion_id_seq; Type: SEQUENCE OWNED BY; Schema: evaluacion; Owner: ceish_user
--

ALTER SEQUENCE evaluacion.asignaciones_evaluacion_id_seq OWNED BY evaluacion.asignaciones_evaluacion.id;


--
-- TOC entry 336 (class 1259 OID 139785)
-- Name: asignaciones_pares_riesgo; Type: TABLE; Schema: evaluacion; Owner: ceish_user
--

CREATE TABLE evaluacion.asignaciones_pares_riesgo (
    id integer NOT NULL,
    protocolo_id integer NOT NULL,
    evaluador_id integer NOT NULL,
    nivel_riesgo_propuesto_id integer,
    observaciones text,
    fecha_asignacion timestamp without time zone DEFAULT now() NOT NULL,
    fecha_envio timestamp without time zone,
    ruta_informe_pdf character varying(500)
);


ALTER TABLE evaluacion.asignaciones_pares_riesgo OWNER TO ceish_user;

--
-- TOC entry 335 (class 1259 OID 139784)
-- Name: asignaciones_pares_riesgo_id_seq; Type: SEQUENCE; Schema: evaluacion; Owner: ceish_user
--

CREATE SEQUENCE evaluacion.asignaciones_pares_riesgo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE evaluacion.asignaciones_pares_riesgo_id_seq OWNER TO ceish_user;

--
-- TOC entry 4316 (class 0 OID 0)
-- Dependencies: 335
-- Name: asignaciones_pares_riesgo_id_seq; Type: SEQUENCE OWNED BY; Schema: evaluacion; Owner: ceish_user
--

ALTER SEQUENCE evaluacion.asignaciones_pares_riesgo_id_seq OWNED BY evaluacion.asignaciones_pares_riesgo.id;


--
-- TOC entry 274 (class 1259 OID 24298)
-- Name: asistencia_sesiones; Type: TABLE; Schema: evaluacion; Owner: ceish_user
--

CREATE TABLE evaluacion.asistencia_sesiones (
    id integer NOT NULL,
    sesion_id integer,
    usuario_id integer,
    asistio boolean NOT NULL,
    participo_en_votacion boolean,
    conflicto_interes boolean DEFAULT false,
    excusa_presentada boolean DEFAULT false,
    registro_por integer,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE evaluacion.asistencia_sesiones OWNER TO ceish_user;

--
-- TOC entry 273 (class 1259 OID 24297)
-- Name: asistencia_sesiones_id_seq; Type: SEQUENCE; Schema: evaluacion; Owner: ceish_user
--

CREATE SEQUENCE evaluacion.asistencia_sesiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE evaluacion.asistencia_sesiones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 273
-- Name: asistencia_sesiones_id_seq; Type: SEQUENCE OWNED BY; Schema: evaluacion; Owner: ceish_user
--

ALTER SEQUENCE evaluacion.asistencia_sesiones_id_seq OWNED BY evaluacion.asistencia_sesiones.id;


--
-- TOC entry 266 (class 1259 OID 24213)
-- Name: evaluacion_criterio; Type: TABLE; Schema: evaluacion; Owner: ceish_user
--

CREATE TABLE evaluacion.evaluacion_criterio (
    evaluacion_id integer NOT NULL,
    criterio_id integer NOT NULL,
    valor boolean
);


ALTER TABLE evaluacion.evaluacion_criterio OWNER TO ceish_user;

--
-- TOC entry 265 (class 1259 OID 24194)
-- Name: evaluaciones; Type: TABLE; Schema: evaluacion; Owner: ceish_user
--

CREATE TABLE evaluacion.evaluaciones (
    id integer NOT NULL,
    asignacion_id integer NOT NULL,
    aspectos_eticos jsonb,
    aspectos_metodologicos jsonb,
    aspectos_juridicos jsonb,
    resultado character varying(50),
    observaciones text,
    fecha_evaluacion timestamp without time zone DEFAULT now() NOT NULL,
    evaluado_por integer,
    ruta_informe_pdf character varying(500)
);


ALTER TABLE evaluacion.evaluaciones OWNER TO ceish_user;

--
-- TOC entry 264 (class 1259 OID 24193)
-- Name: evaluaciones_id_seq; Type: SEQUENCE; Schema: evaluacion; Owner: ceish_user
--

CREATE SEQUENCE evaluacion.evaluaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE evaluacion.evaluaciones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4318 (class 0 OID 0)
-- Dependencies: 264
-- Name: evaluaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: evaluacion; Owner: ceish_user
--

ALTER SEQUENCE evaluacion.evaluaciones_id_seq OWNED BY evaluacion.evaluaciones.id;


--
-- TOC entry 268 (class 1259 OID 24229)
-- Name: sesiones; Type: TABLE; Schema: evaluacion; Owner: ceish_user
--

CREATE TABLE evaluacion.sesiones (
    id integer NOT NULL,
    tipo_sesion character varying(50),
    quorum_alcanzado boolean DEFAULT false NOT NULL,
    estado_id integer,
    creado_por integer,
    date date NOT NULL,
    "attendeesCount" integer
);


ALTER TABLE evaluacion.sesiones OWNER TO ceish_user;

--
-- TOC entry 267 (class 1259 OID 24228)
-- Name: sesiones_id_seq; Type: SEQUENCE; Schema: evaluacion; Owner: ceish_user
--

CREATE SEQUENCE evaluacion.sesiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE evaluacion.sesiones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4319 (class 0 OID 0)
-- Dependencies: 267
-- Name: sesiones_id_seq; Type: SEQUENCE OWNED BY; Schema: evaluacion; Owner: ceish_user
--

ALTER SEQUENCE evaluacion.sesiones_id_seq OWNED BY evaluacion.sesiones.id;


--
-- TOC entry 287 (class 1259 OID 24465)
-- Name: enmiendas; Type: TABLE; Schema: gestion; Owner: ceish_user
--

CREATE TABLE gestion.enmiendas (
    id integer NOT NULL,
    protocolo_id integer,
    numero_enmienda integer,
    version_anterior_id integer,
    descripcion text,
    fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado_id integer,
    tipo_enmienda character varying(50),
    afecta_seguridad_sujetos boolean DEFAULT false,
    modalidad_evaluacion character varying(50),
    evaluado_por integer,
    solicitado_por integer
);


ALTER TABLE gestion.enmiendas OWNER TO ceish_user;

--
-- TOC entry 286 (class 1259 OID 24464)
-- Name: enmiendas_id_seq; Type: SEQUENCE; Schema: gestion; Owner: ceish_user
--

CREATE SEQUENCE gestion.enmiendas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.enmiendas_id_seq OWNER TO ceish_user;

--
-- TOC entry 4320 (class 0 OID 0)
-- Dependencies: 286
-- Name: enmiendas_id_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: ceish_user
--

ALTER SEQUENCE gestion.enmiendas_id_seq OWNED BY gestion.enmiendas.id;


--
-- TOC entry 289 (class 1259 OID 24501)
-- Name: renovaciones; Type: TABLE; Schema: gestion; Owner: ceish_user
--

CREATE TABLE gestion.renovaciones (
    id integer NOT NULL,
    protocolo_id integer,
    numero_renovacion integer,
    fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion timestamp without time zone,
    estado_id integer,
    periodo_anterior_desde date,
    periodo_anterior_hasta date,
    periodo_solicitado_desde date,
    periodo_solicitado_hasta date,
    tiene_protocolo_aprobado boolean DEFAULT false,
    tiene_enmiendas_aprobadas boolean DEFAULT false,
    tiene_informes_avance boolean DEFAULT false,
    tiene_aprobacion_arcsa boolean DEFAULT false,
    evaluado_por integer,
    solicitado_por integer
);


ALTER TABLE gestion.renovaciones OWNER TO ceish_user;

--
-- TOC entry 288 (class 1259 OID 24500)
-- Name: renovaciones_id_seq; Type: SEQUENCE; Schema: gestion; Owner: ceish_user
--

CREATE SEQUENCE gestion.renovaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.renovaciones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4321 (class 0 OID 0)
-- Dependencies: 288
-- Name: renovaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: ceish_user
--

ALTER SEQUENCE gestion.renovaciones_id_seq OWNED BY gestion.renovaciones.id;


--
-- TOC entry 292 (class 1259 OID 24556)
-- Name: suspension_causal; Type: TABLE; Schema: gestion; Owner: ceish_user
--

CREATE TABLE gestion.suspension_causal (
    suspension_id integer NOT NULL,
    causal_id integer NOT NULL
);


ALTER TABLE gestion.suspension_causal OWNER TO ceish_user;

--
-- TOC entry 291 (class 1259 OID 24533)
-- Name: suspensiones; Type: TABLE; Schema: gestion; Owner: ceish_user
--

CREATE TABLE gestion.suspensiones (
    id integer NOT NULL,
    protocolo_id integer,
    tipo character varying(50),
    motivo text,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    informe_motivacion text,
    fecha_notificacion_investigador timestamp without time zone,
    plazo_justificacion_dias integer DEFAULT 15,
    fecha_limite_justificacion date,
    justificacion_recibida boolean DEFAULT false,
    fecha_justificacion timestamp without time zone,
    justificacion_aceptada boolean,
    notificado_dis boolean DEFAULT false,
    notificado_arcsa boolean DEFAULT false,
    creado_por integer
);


ALTER TABLE gestion.suspensiones OWNER TO ceish_user;

--
-- TOC entry 290 (class 1259 OID 24532)
-- Name: suspensiones_id_seq; Type: SEQUENCE; Schema: gestion; Owner: ceish_user
--

CREATE SEQUENCE gestion.suspensiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE gestion.suspensiones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4322 (class 0 OID 0)
-- Dependencies: 290
-- Name: suspensiones_id_seq; Type: SEQUENCE OWNED BY; Schema: gestion; Owner: ceish_user
--

ALTER SEQUENCE gestion.suspensiones_id_seq OWNED BY gestion.suspensiones.id;


--
-- TOC entry 313 (class 1259 OID 24740)
-- Name: analisis_documentos; Type: TABLE; Schema: ml_features; Owner: ceish_user
--

CREATE TABLE ml_features.analisis_documentos (
    id integer NOT NULL,
    documento_id integer,
    tipo_documento character varying(100),
    texto_extraido text,
    secciones_encontradas jsonb,
    errores_detectados jsonb,
    recomendaciones jsonb,
    puntaje_calidad numeric(5,4),
    fecha_analisis timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    version_modelo character varying(20)
);


ALTER TABLE ml_features.analisis_documentos OWNER TO ceish_user;

--
-- TOC entry 312 (class 1259 OID 24739)
-- Name: analisis_documentos_id_seq; Type: SEQUENCE; Schema: ml_features; Owner: ceish_user
--

CREATE SEQUENCE ml_features.analisis_documentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE ml_features.analisis_documentos_id_seq OWNER TO ceish_user;

--
-- TOC entry 4323 (class 0 OID 0)
-- Dependencies: 312
-- Name: analisis_documentos_id_seq; Type: SEQUENCE OWNED BY; Schema: ml_features; Owner: ceish_user
--

ALTER SEQUENCE ml_features.analisis_documentos_id_seq OWNED BY ml_features.analisis_documentos.id;


--
-- TOC entry 315 (class 1259 OID 24757)
-- Name: balanceo_evaluadores; Type: TABLE; Schema: ml_features; Owner: ceish_user
--

CREATE TABLE ml_features.balanceo_evaluadores (
    id integer NOT NULL,
    fecha_calculo date NOT NULL,
    evaluador_id integer,
    carga_actual integer,
    carga_promedio integer,
    desviacion numeric(5,4),
    sugerido_para_asignar boolean,
    factores_considerados jsonb,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE ml_features.balanceo_evaluadores OWNER TO ceish_user;

--
-- TOC entry 314 (class 1259 OID 24756)
-- Name: balanceo_evaluadores_id_seq; Type: SEQUENCE; Schema: ml_features; Owner: ceish_user
--

CREATE SEQUENCE ml_features.balanceo_evaluadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE ml_features.balanceo_evaluadores_id_seq OWNER TO ceish_user;

--
-- TOC entry 4324 (class 0 OID 0)
-- Dependencies: 314
-- Name: balanceo_evaluadores_id_seq; Type: SEQUENCE OWNED BY; Schema: ml_features; Owner: ceish_user
--

ALTER SEQUENCE ml_features.balanceo_evaluadores_id_seq OWNED BY ml_features.balanceo_evaluadores.id;


--
-- TOC entry 319 (class 1259 OID 24792)
-- Name: chatbot_conversaciones; Type: TABLE; Schema: ml_features; Owner: ceish_user
--

CREATE TABLE ml_features.chatbot_conversaciones (
    id integer NOT NULL,
    usuario_id integer,
    pregunta text,
    respuesta text,
    fuentes_consultadas jsonb,
    confianza_respuesta numeric(5,4),
    feedback_util boolean,
    fecha_conversacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE ml_features.chatbot_conversaciones OWNER TO ceish_user;

--
-- TOC entry 318 (class 1259 OID 24791)
-- Name: chatbot_conversaciones_id_seq; Type: SEQUENCE; Schema: ml_features; Owner: ceish_user
--

CREATE SEQUENCE ml_features.chatbot_conversaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE ml_features.chatbot_conversaciones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4325 (class 0 OID 0)
-- Dependencies: 318
-- Name: chatbot_conversaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: ml_features; Owner: ceish_user
--

ALTER SEQUENCE ml_features.chatbot_conversaciones_id_seq OWNED BY ml_features.chatbot_conversaciones.id;


--
-- TOC entry 311 (class 1259 OID 24726)
-- Name: configuracion_ml; Type: TABLE; Schema: ml_features; Owner: ceish_user
--

CREATE TABLE ml_features.configuracion_ml (
    clave character varying(100) NOT NULL,
    valor numeric(10,4),
    descripcion text,
    actualizado_por integer,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE ml_features.configuracion_ml OWNER TO ceish_user;

--
-- TOC entry 310 (class 1259 OID 24712)
-- Name: modelos_versiones; Type: TABLE; Schema: ml_features; Owner: ceish_user
--

CREATE TABLE ml_features.modelos_versiones (
    id integer NOT NULL,
    nombre_modelo character varying(100),
    version character varying(20),
    metricas_evaluacion jsonb,
    fecha_entrenamiento timestamp without time zone,
    ruta_archivo character varying(500),
    activo boolean DEFAULT true,
    creado_por integer
);


ALTER TABLE ml_features.modelos_versiones OWNER TO ceish_user;

--
-- TOC entry 309 (class 1259 OID 24711)
-- Name: modelos_versiones_id_seq; Type: SEQUENCE; Schema: ml_features; Owner: ceish_user
--

CREATE SEQUENCE ml_features.modelos_versiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE ml_features.modelos_versiones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4326 (class 0 OID 0)
-- Dependencies: 309
-- Name: modelos_versiones_id_seq; Type: SEQUENCE OWNED BY; Schema: ml_features; Owner: ceish_user
--

ALTER SEQUENCE ml_features.modelos_versiones_id_seq OWNED BY ml_features.modelos_versiones.id;


--
-- TOC entry 317 (class 1259 OID 24772)
-- Name: prediccion_incumplimientos; Type: TABLE; Schema: ml_features; Owner: ceish_user
--

CREATE TABLE ml_features.prediccion_incumplimientos (
    id integer NOT NULL,
    protocolo_id integer,
    seguimiento_id integer,
    probabilidad_incumplimiento numeric(5,4),
    factores_riesgo jsonb,
    fecha_prediccion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    modelo_version character varying(20),
    accion_recomendada text
);


ALTER TABLE ml_features.prediccion_incumplimientos OWNER TO ceish_user;

--
-- TOC entry 316 (class 1259 OID 24771)
-- Name: prediccion_incumplimientos_id_seq; Type: SEQUENCE; Schema: ml_features; Owner: ceish_user
--

CREATE SEQUENCE ml_features.prediccion_incumplimientos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE ml_features.prediccion_incumplimientos_id_seq OWNER TO ceish_user;

--
-- TOC entry 4327 (class 0 OID 0)
-- Dependencies: 316
-- Name: prediccion_incumplimientos_id_seq; Type: SEQUENCE OWNED BY; Schema: ml_features; Owner: ceish_user
--

ALTER SEQUENCE ml_features.prediccion_incumplimientos_id_seq OWNED BY ml_features.prediccion_incumplimientos.id;


--
-- TOC entry 308 (class 1259 OID 24697)
-- Name: predicciones_log; Type: TABLE; Schema: ml_features; Owner: ceish_user
--

CREATE TABLE ml_features.predicciones_log (
    id integer NOT NULL,
    protocolo_id integer,
    tipo_prediccion character varying(50),
    entrada_json jsonb,
    salida_json jsonb,
    modelo_version character varying(20),
    tiempo_procesamiento_ms integer,
    confidence_score numeric(5,4),
    fecha_prediccion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE ml_features.predicciones_log OWNER TO ceish_user;

--
-- TOC entry 307 (class 1259 OID 24696)
-- Name: predicciones_log_id_seq; Type: SEQUENCE; Schema: ml_features; Owner: ceish_user
--

CREATE SEQUENCE ml_features.predicciones_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE ml_features.predicciones_log_id_seq OWNER TO ceish_user;

--
-- TOC entry 4328 (class 0 OID 0)
-- Dependencies: 307
-- Name: predicciones_log_id_seq; Type: SEQUENCE OWNED BY; Schema: ml_features; Owner: ceish_user
--

ALTER SEQUENCE ml_features.predicciones_log_id_seq OWNED BY ml_features.predicciones_log.id;


--
-- TOC entry 306 (class 1259 OID 24680)
-- Name: protocolo_features; Type: TABLE; Schema: ml_features; Owner: ceish_user
--

CREATE TABLE ml_features.protocolo_features (
    id integer NOT NULL,
    protocolo_id integer,
    texto text,
    longitud integer,
    riesgo character varying(50),
    confianza numeric(5,4),
    palabras_clave jsonb,
    secciones_detectadas jsonb,
    factores_riesgo jsonb,
    fecha_extraccion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    version_modelo character varying(20)
);


ALTER TABLE ml_features.protocolo_features OWNER TO ceish_user;

--
-- TOC entry 305 (class 1259 OID 24679)
-- Name: protocolo_features_id_seq; Type: SEQUENCE; Schema: ml_features; Owner: ceish_user
--

CREATE SEQUENCE ml_features.protocolo_features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE ml_features.protocolo_features_id_seq OWNER TO ceish_user;

--
-- TOC entry 4329 (class 0 OID 0)
-- Dependencies: 305
-- Name: protocolo_features_id_seq; Type: SEQUENCE OWNED BY; Schema: ml_features; Owner: ceish_user
--

ALTER SEQUENCE ml_features.protocolo_features_id_seq OWNED BY ml_features.protocolo_features.id;


--
-- TOC entry 321 (class 1259 OID 24807)
-- Name: reportes_msp; Type: TABLE; Schema: ml_features; Owner: ceish_user
--

CREATE TABLE ml_features.reportes_msp (
    id integer NOT NULL,
    tipo_reporte character varying(50),
    periodo_desde date,
    periodo_hasta date,
    datos_json jsonb,
    archivo_generado character varying(500),
    fecha_generacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    generado_por integer
);


ALTER TABLE ml_features.reportes_msp OWNER TO ceish_user;

--
-- TOC entry 320 (class 1259 OID 24806)
-- Name: reportes_msp_id_seq; Type: SEQUENCE; Schema: ml_features; Owner: ceish_user
--

CREATE SEQUENCE ml_features.reportes_msp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE ml_features.reportes_msp_id_seq OWNER TO ceish_user;

--
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 320
-- Name: reportes_msp_id_seq; Type: SEQUENCE OWNED BY; Schema: ml_features; Owner: ceish_user
--

ALTER SEQUENCE ml_features.reportes_msp_id_seq OWNED BY ml_features.reportes_msp.id;


--
-- TOC entry 330 (class 1259 OID 45065)
-- Name: migrations; Type: TABLE; Schema: public; Owner: ceish_user
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO ceish_user;

--
-- TOC entry 329 (class 1259 OID 45064)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: ceish_user
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO ceish_user;

--
-- TOC entry 4331 (class 0 OID 0)
-- Dependencies: 329
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceish_user
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 323 (class 1259 OID 44928)
-- Name: protocolo_instituciones; Type: TABLE; Schema: public; Owner: ceish_user
--

CREATE TABLE public.protocolo_instituciones (
    id integer NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone,
    nombre character varying(255) NOT NULL,
    tipo public.protocolo_instituciones_tipo_enum NOT NULL,
    direccion character varying(500) NOT NULL,
    persona_contacto character varying(255) NOT NULL,
    email_contacto character varying(100),
    telefono_contacto character varying(20),
    tiene_carta_interes boolean DEFAULT false NOT NULL,
    protocolo_id integer NOT NULL
);


ALTER TABLE public.protocolo_instituciones OWNER TO ceish_user;

--
-- TOC entry 322 (class 1259 OID 44927)
-- Name: protocolo_instituciones_id_seq; Type: SEQUENCE; Schema: public; Owner: ceish_user
--

CREATE SEQUENCE public.protocolo_instituciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.protocolo_instituciones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4332 (class 0 OID 0)
-- Dependencies: 322
-- Name: protocolo_instituciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceish_user
--

ALTER SEQUENCE public.protocolo_instituciones_id_seq OWNED BY public.protocolo_instituciones.id;


--
-- TOC entry 327 (class 1259 OID 44968)
-- Name: protocolo_investigadores; Type: TABLE; Schema: public; Owner: ceish_user
--

CREATE TABLE public.protocolo_investigadores (
    id integer NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone,
    nombre_completo character varying(255) NOT NULL,
    identificacion character varying(20) NOT NULL,
    cargo character varying(100) NOT NULL,
    institucion character varying(255) NOT NULL,
    email character varying(100) NOT NULL,
    telefono character varying(20) NOT NULL,
    formacion_academica text NOT NULL,
    rol public.protocolo_investigadores_rol_enum DEFAULT 'CO_INVESTIGADOR'::public.protocolo_investigadores_rol_enum NOT NULL,
    protocolo_id integer NOT NULL,
    usuario_id integer
);


ALTER TABLE public.protocolo_investigadores OWNER TO ceish_user;

--
-- TOC entry 326 (class 1259 OID 44967)
-- Name: protocolo_investigadores_id_seq; Type: SEQUENCE; Schema: public; Owner: ceish_user
--

CREATE SEQUENCE public.protocolo_investigadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.protocolo_investigadores_id_seq OWNER TO ceish_user;

--
-- TOC entry 4333 (class 0 OID 0)
-- Dependencies: 326
-- Name: protocolo_investigadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceish_user
--

ALTER SEQUENCE public.protocolo_investigadores_id_seq OWNED BY public.protocolo_investigadores.id;


--
-- TOC entry 325 (class 1259 OID 44948)
-- Name: protocolo_requisitos; Type: TABLE; Schema: public; Owner: ceish_user
--

CREATE TABLE public.protocolo_requisitos (
    id integer NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone,
    codigo_requisito character varying(50) NOT NULL,
    nombre_requisito character varying(255) NOT NULL,
    estado public.protocolo_requisitos_estado_enum DEFAULT 'NO_PRESENTADO'::public.protocolo_requisitos_estado_enum NOT NULL,
    numero_paginas integer DEFAULT 0 NOT NULL,
    observaciones text,
    protocolo_id integer NOT NULL
);


ALTER TABLE public.protocolo_requisitos OWNER TO ceish_user;

--
-- TOC entry 324 (class 1259 OID 44947)
-- Name: protocolo_requisitos_id_seq; Type: SEQUENCE; Schema: public; Owner: ceish_user
--

CREATE SEQUENCE public.protocolo_requisitos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.protocolo_requisitos_id_seq OWNER TO ceish_user;

--
-- TOC entry 4334 (class 0 OID 0)
-- Dependencies: 324
-- Name: protocolo_requisitos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceish_user
--

ALTER SEQUENCE public.protocolo_requisitos_id_seq OWNED BY public.protocolo_requisitos.id;


--
-- TOC entry 253 (class 1259 OID 23991)
-- Name: protocolos; Type: TABLE; Schema: public; Owner: ceish_user
--

CREATE TABLE public.protocolos (
    id integer NOT NULL,
    tipo_estudio_id integer,
    nivel_riesgo_id integer,
    investigador_principal_id integer NOT NULL,
    estado_id integer,
    fecha_aprobacion date,
    fecha_vencimiento date,
    fecha_finalizacion date,
    duracion_estudio_meses integer,
    poblacion_vulnerable boolean DEFAULT false NOT NULL,
    utiliza_muestras_biologicas boolean DEFAULT false NOT NULL,
    multicentrico boolean DEFAULT false NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL,
    eliminado_en timestamp without time zone,
    monto_financiamiento numeric(12,2),
    fuentes_financiamiento text,
    fecha_estimada_inicio date,
    fecha_estimada_fin date,
    fecha_limite_renovacion date,
    cobertura_geografica public.protocolos_cobertura_geografica_enum,
    titulo character varying(1000),
    tipo_revision public.protocolos_tipo_revision_enum,
    declaracion_no_iniciado boolean DEFAULT false NOT NULL,
    fecha_declaracion_no_iniciado timestamp without time zone,
    ip_declaracion_no_iniciado character varying(45),
    patrocinador_ruc character varying(20),
    patrocinador_telefono_institucional character varying(30),
    patrocinador_direccion character varying(500),
    patrocinador_pagina_web character varying(200),
    patrocinador_organo_ejecutor character varying(200),
    tiene_instituciones_externas boolean DEFAULT false NOT NULL,
    poblacion_indigena boolean DEFAULT false NOT NULL,
    nivel_riesgo_confirmado boolean DEFAULT false NOT NULL,
    sometimiento_tiempos_aceptado boolean DEFAULT false NOT NULL,
    fecha_sometimiento_tiempos timestamp without time zone,
    ip_sometimiento_tiempos character varying(45),
    codigo_ceish character varying(50)
);


ALTER TABLE public.protocolos OWNER TO ceish_user;

--
-- TOC entry 328 (class 1259 OID 45059)
-- Name: protocolos_backup; Type: TABLE; Schema: public; Owner: ceish_user
--

CREATE TABLE public.protocolos_backup (
    id integer,
    tipo_estudio_id integer,
    nivel_riesgo_id integer,
    investigador_principal_id integer,
    estado_id integer,
    fecha_aprobacion date,
    fecha_vencimiento date,
    fecha_finalizacion date,
    duracion_estudio_meses integer,
    poblacion_vulnerable boolean,
    utiliza_muestras_biologicas boolean,
    multicentrico boolean,
    version_actual integer,
    creado_en timestamp without time zone,
    actualizado_en timestamp without time zone,
    eliminado_en timestamp without time zone,
    version character varying(20),
    monto_financiamiento numeric(12,2),
    fuentes_financiamiento text,
    fecha_estimada_inicio date,
    fecha_estimada_fin date,
    fecha_limite_renovacion date,
    cobertura_geografica public.protocolos_cobertura_geografica_enum,
    codigo_ceish character varying(100),
    titulo character varying(1000),
    fecha_recepcion timestamp without time zone
);


ALTER TABLE public.protocolos_backup OWNER TO ceish_user;

--
-- TOC entry 252 (class 1259 OID 23990)
-- Name: protocolos_id_seq; Type: SEQUENCE; Schema: public; Owner: ceish_user
--

CREATE SEQUENCE public.protocolos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.protocolos_id_seq OWNER TO ceish_user;

--
-- TOC entry 4335 (class 0 OID 0)
-- Dependencies: 252
-- Name: protocolos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceish_user
--

ALTER SEQUENCE public.protocolos_id_seq OWNED BY public.protocolos.id;


--
-- TOC entry 255 (class 1259 OID 24028)
-- Name: versiones_protocolo; Type: TABLE; Schema: public; Owner: ceish_user
--

CREATE TABLE public.versiones_protocolo (
    id integer NOT NULL,
    protocolo_id integer NOT NULL,
    numero_version integer,
    estado_id integer,
    fecha_envio timestamp without time zone,
    fecha_resolucion timestamp without time zone,
    observaciones text,
    plazo_subsanacion_dias integer DEFAULT 30 NOT NULL,
    fecha_limite_subsanacion date,
    validado_por integer,
    tipo_resolucion_id integer
);


ALTER TABLE public.versiones_protocolo OWNER TO ceish_user;

--
-- TOC entry 254 (class 1259 OID 24027)
-- Name: versiones_protocolo_id_seq; Type: SEQUENCE; Schema: public; Owner: ceish_user
--

CREATE SEQUENCE public.versiones_protocolo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.versiones_protocolo_id_seq OWNER TO ceish_user;

--
-- TOC entry 4336 (class 0 OID 0)
-- Dependencies: 254
-- Name: versiones_protocolo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceish_user
--

ALTER SEQUENCE public.versiones_protocolo_id_seq OWNED BY public.versiones_protocolo.id;


--
-- TOC entry 257 (class 1259 OID 24055)
-- Name: documentos; Type: TABLE; Schema: recepcion; Owner: ceish_user
--

CREATE TABLE recepcion.documentos (
    id integer NOT NULL,
    protocolo_id integer NOT NULL,
    numero_hojas integer,
    hash_checksum character varying(64),
    "tamaño_bytes" bigint,
    es_confidencial boolean DEFAULT true NOT NULL,
    validado_secretaria boolean DEFAULT false NOT NULL,
    subido_por integer,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    ruta character varying(500) NOT NULL,
    nombre_archivo character varying(200) NOT NULL,
    tipo_documento_id integer,
    requisito_id integer
);


ALTER TABLE recepcion.documentos OWNER TO ceish_user;

--
-- TOC entry 256 (class 1259 OID 24054)
-- Name: documentos_id_seq; Type: SEQUENCE; Schema: recepcion; Owner: ceish_user
--

CREATE SEQUENCE recepcion.documentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE recepcion.documentos_id_seq OWNER TO ceish_user;

--
-- TOC entry 4337 (class 0 OID 0)
-- Dependencies: 256
-- Name: documentos_id_seq; Type: SEQUENCE OWNED BY; Schema: recepcion; Owner: ceish_user
--

ALTER SEQUENCE recepcion.documentos_id_seq OWNED BY recepcion.documentos.id;


--
-- TOC entry 261 (class 1259 OID 24119)
-- Name: recepciones; Type: TABLE; Schema: recepcion; Owner: ceish_user
--

CREATE TABLE recepcion.recepciones (
    id integer NOT NULL,
    protocolo_id integer NOT NULL,
    fecha_recepcion timestamp without time zone DEFAULT now() NOT NULL,
    estado_id integer,
    tiene_faltantes boolean DEFAULT false NOT NULL,
    lista_faltantes text,
    fecha_notificacion_faltantes timestamp without time zone,
    plazo_completar_dias integer DEFAULT 15 NOT NULL,
    fecha_limite_completar date,
    constancia_emitida boolean DEFAULT false NOT NULL,
    fecha_constancia timestamp without time zone,
    plazo_respuesta_dias integer,
    observaciones text,
    creado_por integer
);


ALTER TABLE recepcion.recepciones OWNER TO ceish_user;

--
-- TOC entry 260 (class 1259 OID 24118)
-- Name: recepciones_id_seq; Type: SEQUENCE; Schema: recepcion; Owner: ceish_user
--

CREATE SEQUENCE recepcion.recepciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE recepcion.recepciones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4338 (class 0 OID 0)
-- Dependencies: 260
-- Name: recepciones_id_seq; Type: SEQUENCE OWNED BY; Schema: recepcion; Owner: ceish_user
--

ALTER SEQUENCE recepcion.recepciones_id_seq OWNED BY recepcion.recepciones.id;


--
-- TOC entry 259 (class 1259 OID 24092)
-- Name: validaciones_documento; Type: TABLE; Schema: recepcion; Owner: ceish_user
--

CREATE TABLE recepcion.validaciones_documento (
    id integer NOT NULL,
    documento_id integer NOT NULL,
    estado_id integer,
    observaciones text,
    validado_por integer,
    fecha_validacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE recepcion.validaciones_documento OWNER TO ceish_user;

--
-- TOC entry 258 (class 1259 OID 24091)
-- Name: validaciones_documento_id_seq; Type: SEQUENCE; Schema: recepcion; Owner: ceish_user
--

CREATE SEQUENCE recepcion.validaciones_documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE recepcion.validaciones_documento_id_seq OWNER TO ceish_user;

--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 258
-- Name: validaciones_documento_id_seq; Type: SEQUENCE OWNED BY; Schema: recepcion; Owner: ceish_user
--

ALTER SEQUENCE recepcion.validaciones_documento_id_seq OWNED BY recepcion.validaciones_documento.id;


--
-- TOC entry 278 (class 1259 OID 24357)
-- Name: notificaciones_resolucion; Type: TABLE; Schema: resolucion; Owner: ceish_user
--

CREATE TABLE resolucion.notificaciones_resolucion (
    id integer NOT NULL,
    resolucion_id integer,
    destinatario_id integer,
    canal character varying(50),
    asunto character varying(200),
    cuerpo_mensaje text,
    fecha_programada timestamp without time zone,
    fecha_envio timestamp without time zone,
    fecha_lectura timestamp without time zone,
    estado character varying(50) DEFAULT 'PENDIENTE'::character varying
);


ALTER TABLE resolucion.notificaciones_resolucion OWNER TO ceish_user;

--
-- TOC entry 277 (class 1259 OID 24356)
-- Name: notificaciones_resolucion_id_seq; Type: SEQUENCE; Schema: resolucion; Owner: ceish_user
--

CREATE SEQUENCE resolucion.notificaciones_resolucion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE resolucion.notificaciones_resolucion_id_seq OWNER TO ceish_user;

--
-- TOC entry 4340 (class 0 OID 0)
-- Dependencies: 277
-- Name: notificaciones_resolucion_id_seq; Type: SEQUENCE OWNED BY; Schema: resolucion; Owner: ceish_user
--

ALTER SEQUENCE resolucion.notificaciones_resolucion_id_seq OWNED BY resolucion.notificaciones_resolucion.id;


--
-- TOC entry 276 (class 1259 OID 24323)
-- Name: resoluciones; Type: TABLE; Schema: resolucion; Owner: ceish_user
--

CREATE TABLE resolucion.resoluciones (
    id integer NOT NULL,
    protocolo_id integer NOT NULL,
    version_id integer NOT NULL,
    tipo_resolucion_id integer,
    fecha_emision timestamp without time zone DEFAULT now() NOT NULL,
    fecha_notificacion_investigador timestamp without time zone,
    vigencia_aprobacion_anios integer DEFAULT 1 NOT NULL,
    periodo_seguimiento_dias integer,
    observaciones_mayores text,
    observaciones_menores text,
    procedimiento_subsanacion text,
    firmada_por_presidente boolean DEFAULT false NOT NULL,
    firmada_por_secretario boolean DEFAULT false NOT NULL,
    firma_electronica_valida boolean DEFAULT false NOT NULL,
    archivo_carta_pdf character varying(500),
    creado_por integer
);


ALTER TABLE resolucion.resoluciones OWNER TO ceish_user;

--
-- TOC entry 275 (class 1259 OID 24322)
-- Name: resoluciones_id_seq; Type: SEQUENCE; Schema: resolucion; Owner: ceish_user
--

CREATE SEQUENCE resolucion.resoluciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE resolucion.resoluciones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 275
-- Name: resoluciones_id_seq; Type: SEQUENCE OWNED BY; Schema: resolucion; Owner: ceish_user
--

ALTER SEQUENCE resolucion.resoluciones_id_seq OWNED BY resolucion.resoluciones.id;


--
-- TOC entry 285 (class 1259 OID 24442)
-- Name: eventos_adversos; Type: TABLE; Schema: seguimiento; Owner: ceish_user
--

CREATE TABLE seguimiento.eventos_adversos (
    id integer NOT NULL,
    protocolo_id integer,
    tipo_evento character varying(50) NOT NULL,
    codigo_sujeto character varying(50),
    fecha_inicio_evento date,
    fecha_fin_evento date,
    descripcion text,
    gravedad character varying(50),
    fecha_reporte_inicial timestamp without time zone,
    reportado_por integer,
    informe_completo_recibido boolean DEFAULT false,
    fecha_informe_completo timestamp without time zone,
    causalidad_naranjo integer,
    grado_causalidad character varying(50),
    notificado_arcsa boolean DEFAULT false,
    fecha_notificacion_arcsa timestamp without time zone,
    notificado_dis boolean DEFAULT false,
    fecha_notificacion_dis timestamp without time zone,
    estado_sujeto character varying(50),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE seguimiento.eventos_adversos OWNER TO ceish_user;

--
-- TOC entry 284 (class 1259 OID 24441)
-- Name: eventos_adversos_id_seq; Type: SEQUENCE; Schema: seguimiento; Owner: ceish_user
--

CREATE SEQUENCE seguimiento.eventos_adversos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE seguimiento.eventos_adversos_id_seq OWNER TO ceish_user;

--
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 284
-- Name: eventos_adversos_id_seq; Type: SEQUENCE OWNED BY; Schema: seguimiento; Owner: ceish_user
--

ALTER SEQUENCE seguimiento.eventos_adversos_id_seq OWNED BY seguimiento.eventos_adversos.id;


--
-- TOC entry 283 (class 1259 OID 24426)
-- Name: informe_documento; Type: TABLE; Schema: seguimiento; Owner: ceish_user
--

CREATE TABLE seguimiento.informe_documento (
    informe_id integer NOT NULL,
    documento_id integer NOT NULL
);


ALTER TABLE seguimiento.informe_documento OWNER TO ceish_user;

--
-- TOC entry 282 (class 1259 OID 24408)
-- Name: informes_seguimiento; Type: TABLE; Schema: seguimiento; Owner: ceish_user
--

CREATE TABLE seguimiento.informes_seguimiento (
    id integer NOT NULL,
    seguimiento_id integer,
    contenido text,
    enviado_por integer
);


ALTER TABLE seguimiento.informes_seguimiento OWNER TO ceish_user;

--
-- TOC entry 281 (class 1259 OID 24407)
-- Name: informes_seguimiento_id_seq; Type: SEQUENCE; Schema: seguimiento; Owner: ceish_user
--

CREATE SEQUENCE seguimiento.informes_seguimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE seguimiento.informes_seguimiento_id_seq OWNER TO ceish_user;

--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 281
-- Name: informes_seguimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: seguimiento; Owner: ceish_user
--

ALTER SEQUENCE seguimiento.informes_seguimiento_id_seq OWNED BY seguimiento.informes_seguimiento.id;


--
-- TOC entry 280 (class 1259 OID 24377)
-- Name: seguimientos; Type: TABLE; Schema: seguimiento; Owner: ceish_user
--

CREATE TABLE seguimiento.seguimientos (
    id integer NOT NULL,
    protocolo_id integer,
    tipo_seguimiento_id integer,
    fecha_programada date,
    fecha_vencimiento date,
    fecha_recordatorio_1 date,
    fecha_recordatorio_2 date,
    estado_id integer,
    fue_notificado boolean DEFAULT false,
    fecha_notificacion timestamp without time zone,
    informe_recibido boolean DEFAULT false,
    fecha_recepcion_informe timestamp without time zone,
    evaluado_por integer,
    observaciones_evaluacion text,
    aprobado boolean
);


ALTER TABLE seguimiento.seguimientos OWNER TO ceish_user;

--
-- TOC entry 279 (class 1259 OID 24376)
-- Name: seguimientos_id_seq; Type: SEQUENCE; Schema: seguimiento; Owner: ceish_user
--

CREATE SEQUENCE seguimiento.seguimientos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE seguimiento.seguimientos_id_seq OWNER TO ceish_user;

--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 279
-- Name: seguimientos_id_seq; Type: SEQUENCE OWNED BY; Schema: seguimiento; Owner: ceish_user
--

ALTER SEQUENCE seguimiento.seguimientos_id_seq OWNED BY seguimiento.seguimientos.id;


--
-- TOC entry 300 (class 1259 OID 24627)
-- Name: audit_log; Type: TABLE; Schema: sistema; Owner: ceish_user
--

CREATE TABLE sistema.audit_log (
    id integer NOT NULL,
    usuario_id integer,
    accion character varying(50) NOT NULL,
    tabla character varying(100),
    registro_id integer,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    ip_origen character varying(50),
    protocolo_codigo character varying(50),
    fecha timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE sistema.audit_log OWNER TO ceish_user;

--
-- TOC entry 299 (class 1259 OID 24626)
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: sistema; Owner: ceish_user
--

CREATE SEQUENCE sistema.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sistema.audit_log_id_seq OWNER TO ceish_user;

--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 299
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: sistema; Owner: ceish_user
--

ALTER SEQUENCE sistema.audit_log_id_seq OWNED BY sistema.audit_log.id;


--
-- TOC entry 302 (class 1259 OID 24642)
-- Name: declaracion_confidencialidad; Type: TABLE; Schema: sistema; Owner: ceish_user
--

CREATE TABLE sistema.declaracion_confidencialidad (
    id integer NOT NULL,
    protocolo_id integer,
    investigador_id integer,
    fecha_firma date,
    archivo_firmado character varying(500)
);


ALTER TABLE sistema.declaracion_confidencialidad OWNER TO ceish_user;

--
-- TOC entry 301 (class 1259 OID 24641)
-- Name: declaracion_confidencialidad_id_seq; Type: SEQUENCE; Schema: sistema; Owner: ceish_user
--

CREATE SEQUENCE sistema.declaracion_confidencialidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sistema.declaracion_confidencialidad_id_seq OWNER TO ceish_user;

--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 301
-- Name: declaracion_confidencialidad_id_seq; Type: SEQUENCE OWNED BY; Schema: sistema; Owner: ceish_user
--

ALTER SEQUENCE sistema.declaracion_confidencialidad_id_seq OWNED BY sistema.declaracion_confidencialidad.id;


--
-- TOC entry 304 (class 1259 OID 24661)
-- Name: declaracion_conflicto_interes; Type: TABLE; Schema: sistema; Owner: ceish_user
--

CREATE TABLE sistema.declaracion_conflicto_interes (
    id integer NOT NULL,
    protocolo_id integer,
    investigador_id integer,
    tiene_conflicto boolean,
    descripcion_conflicto text,
    fecha_firma date
);


ALTER TABLE sistema.declaracion_conflicto_interes OWNER TO ceish_user;

--
-- TOC entry 303 (class 1259 OID 24660)
-- Name: declaracion_conflicto_interes_id_seq; Type: SEQUENCE; Schema: sistema; Owner: ceish_user
--

CREATE SEQUENCE sistema.declaracion_conflicto_interes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sistema.declaracion_conflicto_interes_id_seq OWNER TO ceish_user;

--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 303
-- Name: declaracion_conflicto_interes_id_seq; Type: SEQUENCE OWNED BY; Schema: sistema; Owner: ceish_user
--

ALTER SEQUENCE sistema.declaracion_conflicto_interes_id_seq OWNED BY sistema.declaracion_conflicto_interes.id;


--
-- TOC entry 296 (class 1259 OID 24584)
-- Name: notificaciones; Type: TABLE; Schema: sistema; Owner: ceish_user
--

CREATE TABLE sistema.notificaciones (
    id integer NOT NULL,
    usuario_id integer,
    plantilla_id integer,
    asunto character varying(200),
    cuerpo_mensaje text,
    enviar_email boolean DEFAULT true,
    estado character varying(50) DEFAULT 'PENDIENTE'::character varying,
    fecha_programada timestamp without time zone,
    fecha_envio timestamp without time zone,
    fecha_lectura timestamp without time zone,
    protocolo_id integer,
    metadata_json jsonb
);


ALTER TABLE sistema.notificaciones OWNER TO ceish_user;

--
-- TOC entry 295 (class 1259 OID 24583)
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: sistema; Owner: ceish_user
--

CREATE SEQUENCE sistema.notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sistema.notificaciones_id_seq OWNER TO ceish_user;

--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 295
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: sistema; Owner: ceish_user
--

ALTER SEQUENCE sistema.notificaciones_id_seq OWNED BY sistema.notificaciones.id;


--
-- TOC entry 298 (class 1259 OID 24610)
-- Name: parametros_sistema; Type: TABLE; Schema: sistema; Owner: ceish_user
--

CREATE TABLE sistema.parametros_sistema (
    id integer NOT NULL,
    clave character varying(100) NOT NULL,
    valor text NOT NULL,
    tipo_dato character varying(20),
    descripcion text,
    actualizado_por integer,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE sistema.parametros_sistema OWNER TO ceish_user;

--
-- TOC entry 297 (class 1259 OID 24609)
-- Name: parametros_sistema_id_seq; Type: SEQUENCE; Schema: sistema; Owner: ceish_user
--

CREATE SEQUENCE sistema.parametros_sistema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sistema.parametros_sistema_id_seq OWNER TO ceish_user;

--
-- TOC entry 4349 (class 0 OID 0)
-- Dependencies: 297
-- Name: parametros_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: sistema; Owner: ceish_user
--

ALTER SEQUENCE sistema.parametros_sistema_id_seq OWNED BY sistema.parametros_sistema.id;


--
-- TOC entry 294 (class 1259 OID 24572)
-- Name: plantillas_comunicacion; Type: TABLE; Schema: sistema; Owner: ceish_user
--

CREATE TABLE sistema.plantillas_comunicacion (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    asunto character varying(200),
    cuerpo_html text,
    variables_disponibles jsonb,
    tipo_destinatario character varying(50),
    activo boolean DEFAULT true
);


ALTER TABLE sistema.plantillas_comunicacion OWNER TO ceish_user;

--
-- TOC entry 293 (class 1259 OID 24571)
-- Name: plantillas_comunicacion_id_seq; Type: SEQUENCE; Schema: sistema; Owner: ceish_user
--

CREATE SEQUENCE sistema.plantillas_comunicacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sistema.plantillas_comunicacion_id_seq OWNER TO ceish_user;

--
-- TOC entry 4350 (class 0 OID 0)
-- Dependencies: 293
-- Name: plantillas_comunicacion_id_seq; Type: SEQUENCE OWNED BY; Schema: sistema; Owner: ceish_user
--

ALTER SEQUENCE sistema.plantillas_comunicacion_id_seq OWNED BY sistema.plantillas_comunicacion.id;


--
-- TOC entry 3626 (class 2604 OID 23985)
-- Name: causales_suspension id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.causales_suspension ALTER COLUMN id SET DEFAULT nextval('catalogos.causales_suspension_id_seq'::regclass);


--
-- TOC entry 3625 (class 2604 OID 23974)
-- Name: criterios_evaluacion id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.criterios_evaluacion ALTER COLUMN id SET DEFAULT nextval('catalogos.criterios_evaluacion_id_seq'::regclass);


--
-- TOC entry 3608 (class 2604 OID 23878)
-- Name: estados id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.estados ALTER COLUMN id SET DEFAULT nextval('catalogos.estados_id_seq'::regclass);


--
-- TOC entry 3620 (class 2604 OID 23945)
-- Name: modalidades_revision id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.modalidades_revision ALTER COLUMN id SET DEFAULT nextval('catalogos.modalidades_revision_id_seq'::regclass);


--
-- TOC entry 3746 (class 2604 OID 65620)
-- Name: modulos id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.modulos ALTER COLUMN id SET DEFAULT nextval('catalogos.modulos_id_seq'::regclass);


--
-- TOC entry 3604 (class 2604 OID 23868)
-- Name: niveles_riesgo id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.niveles_riesgo ALTER COLUMN id SET DEFAULT nextval('catalogos.niveles_riesgo_id_seq'::regclass);


--
-- TOC entry 3615 (class 2604 OID 23915)
-- Name: perfiles_evaluador id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.perfiles_evaluador ALTER COLUMN id SET DEFAULT nextval('catalogos.perfiles_evaluador_id_seq'::regclass);


--
-- TOC entry 3741 (class 2604 OID 49249)
-- Name: perfiles_investigador id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.perfiles_investigador ALTER COLUMN id SET DEFAULT nextval('catalogos.perfiles_investigador_id_seq'::regclass);


--
-- TOC entry 3596 (class 2604 OID 23834)
-- Name: permisos id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.permisos ALTER COLUMN id SET DEFAULT nextval('catalogos.permisos_id_seq'::regclass);


--
-- TOC entry 3586 (class 2604 OID 23785)
-- Name: roles id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.roles ALTER COLUMN id SET DEFAULT nextval('catalogos.roles_id_seq'::regclass);


--
-- TOC entry 3609 (class 2604 OID 23887)
-- Name: tipos_documento id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_documento ALTER COLUMN id SET DEFAULT nextval('catalogos.tipos_documento_id_seq'::regclass);


--
-- TOC entry 3599 (class 2604 OID 23858)
-- Name: tipos_estudio id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_estudio ALTER COLUMN id SET DEFAULT nextval('catalogos.tipos_estudio_id_seq'::regclass);


--
-- TOC entry 3624 (class 2604 OID 23965)
-- Name: tipos_resolucion id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_resolucion ALTER COLUMN id SET DEFAULT nextval('catalogos.tipos_resolucion_id_seq'::regclass);


--
-- TOC entry 3621 (class 2604 OID 23954)
-- Name: tipos_seguimiento id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_seguimiento ALTER COLUMN id SET DEFAULT nextval('catalogos.tipos_seguimiento_id_seq'::regclass);


--
-- TOC entry 3590 (class 2604 OID 23798)
-- Name: usuarios id; Type: DEFAULT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.usuarios ALTER COLUMN id SET DEFAULT nextval('catalogos.usuarios_id_seq'::regclass);


--
-- TOC entry 3659 (class 2604 OID 24249)
-- Name: actas id; Type: DEFAULT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.actas ALTER COLUMN id SET DEFAULT nextval('evaluacion.actas_id_seq'::regclass);


--
-- TOC entry 3651 (class 2604 OID 24152)
-- Name: asignaciones_evaluacion id; Type: DEFAULT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion ALTER COLUMN id SET DEFAULT nextval('evaluacion.asignaciones_evaluacion_id_seq'::regclass);


--
-- TOC entry 3751 (class 2604 OID 139788)
-- Name: asignaciones_pares_riesgo id; Type: DEFAULT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_pares_riesgo ALTER COLUMN id SET DEFAULT nextval('evaluacion.asignaciones_pares_riesgo_id_seq'::regclass);


--
-- TOC entry 3663 (class 2604 OID 24301)
-- Name: asistencia_sesiones id; Type: DEFAULT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asistencia_sesiones ALTER COLUMN id SET DEFAULT nextval('evaluacion.asistencia_sesiones_id_seq'::regclass);


--
-- TOC entry 3655 (class 2604 OID 24197)
-- Name: evaluaciones id; Type: DEFAULT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.evaluaciones ALTER COLUMN id SET DEFAULT nextval('evaluacion.evaluaciones_id_seq'::regclass);


--
-- TOC entry 3657 (class 2604 OID 24232)
-- Name: sesiones id; Type: DEFAULT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.sesiones ALTER COLUMN id SET DEFAULT nextval('evaluacion.sesiones_id_seq'::regclass);


--
-- TOC entry 3684 (class 2604 OID 24468)
-- Name: enmiendas id; Type: DEFAULT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.enmiendas ALTER COLUMN id SET DEFAULT nextval('gestion.enmiendas_id_seq'::regclass);


--
-- TOC entry 3687 (class 2604 OID 24504)
-- Name: renovaciones id; Type: DEFAULT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.renovaciones ALTER COLUMN id SET DEFAULT nextval('gestion.renovaciones_id_seq'::regclass);


--
-- TOC entry 3693 (class 2604 OID 24536)
-- Name: suspensiones id; Type: DEFAULT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.suspensiones ALTER COLUMN id SET DEFAULT nextval('gestion.suspensiones_id_seq'::regclass);


--
-- TOC entry 3717 (class 2604 OID 24743)
-- Name: analisis_documentos id; Type: DEFAULT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.analisis_documentos ALTER COLUMN id SET DEFAULT nextval('ml_features.analisis_documentos_id_seq'::regclass);


--
-- TOC entry 3719 (class 2604 OID 24760)
-- Name: balanceo_evaluadores id; Type: DEFAULT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.balanceo_evaluadores ALTER COLUMN id SET DEFAULT nextval('ml_features.balanceo_evaluadores_id_seq'::regclass);


--
-- TOC entry 3723 (class 2604 OID 24795)
-- Name: chatbot_conversaciones id; Type: DEFAULT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.chatbot_conversaciones ALTER COLUMN id SET DEFAULT nextval('ml_features.chatbot_conversaciones_id_seq'::regclass);


--
-- TOC entry 3714 (class 2604 OID 24715)
-- Name: modelos_versiones id; Type: DEFAULT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.modelos_versiones ALTER COLUMN id SET DEFAULT nextval('ml_features.modelos_versiones_id_seq'::regclass);


--
-- TOC entry 3721 (class 2604 OID 24775)
-- Name: prediccion_incumplimientos id; Type: DEFAULT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.prediccion_incumplimientos ALTER COLUMN id SET DEFAULT nextval('ml_features.prediccion_incumplimientos_id_seq'::regclass);


--
-- TOC entry 3712 (class 2604 OID 24700)
-- Name: predicciones_log id; Type: DEFAULT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.predicciones_log ALTER COLUMN id SET DEFAULT nextval('ml_features.predicciones_log_id_seq'::regclass);


--
-- TOC entry 3710 (class 2604 OID 24683)
-- Name: protocolo_features id; Type: DEFAULT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.protocolo_features ALTER COLUMN id SET DEFAULT nextval('ml_features.protocolo_features_id_seq'::regclass);


--
-- TOC entry 3725 (class 2604 OID 24810)
-- Name: reportes_msp id; Type: DEFAULT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.reportes_msp ALTER COLUMN id SET DEFAULT nextval('ml_features.reportes_msp_id_seq'::regclass);


--
-- TOC entry 3740 (class 2604 OID 45068)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 3727 (class 2604 OID 44931)
-- Name: protocolo_instituciones id; Type: DEFAULT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_instituciones ALTER COLUMN id SET DEFAULT nextval('public.protocolo_instituciones_id_seq'::regclass);


--
-- TOC entry 3736 (class 2604 OID 44971)
-- Name: protocolo_investigadores id; Type: DEFAULT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_investigadores ALTER COLUMN id SET DEFAULT nextval('public.protocolo_investigadores_id_seq'::regclass);


--
-- TOC entry 3731 (class 2604 OID 44951)
-- Name: protocolo_requisitos id; Type: DEFAULT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_requisitos ALTER COLUMN id SET DEFAULT nextval('public.protocolo_requisitos_id_seq'::regclass);


--
-- TOC entry 3627 (class 2604 OID 23994)
-- Name: protocolos id; Type: DEFAULT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolos ALTER COLUMN id SET DEFAULT nextval('public.protocolos_id_seq'::regclass);


--
-- TOC entry 3638 (class 2604 OID 24031)
-- Name: versiones_protocolo id; Type: DEFAULT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.versiones_protocolo ALTER COLUMN id SET DEFAULT nextval('public.versiones_protocolo_id_seq'::regclass);


--
-- TOC entry 3640 (class 2604 OID 24058)
-- Name: documentos id; Type: DEFAULT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.documentos ALTER COLUMN id SET DEFAULT nextval('recepcion.documentos_id_seq'::regclass);


--
-- TOC entry 3646 (class 2604 OID 24122)
-- Name: recepciones id; Type: DEFAULT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.recepciones ALTER COLUMN id SET DEFAULT nextval('recepcion.recepciones_id_seq'::regclass);


--
-- TOC entry 3644 (class 2604 OID 24095)
-- Name: validaciones_documento id; Type: DEFAULT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.validaciones_documento ALTER COLUMN id SET DEFAULT nextval('recepcion.validaciones_documento_id_seq'::regclass);


--
-- TOC entry 3673 (class 2604 OID 24360)
-- Name: notificaciones_resolucion id; Type: DEFAULT; Schema: resolucion; Owner: ceish_user
--

ALTER TABLE ONLY resolucion.notificaciones_resolucion ALTER COLUMN id SET DEFAULT nextval('resolucion.notificaciones_resolucion_id_seq'::regclass);


--
-- TOC entry 3667 (class 2604 OID 24326)
-- Name: resoluciones id; Type: DEFAULT; Schema: resolucion; Owner: ceish_user
--

ALTER TABLE ONLY resolucion.resoluciones ALTER COLUMN id SET DEFAULT nextval('resolucion.resoluciones_id_seq'::regclass);


--
-- TOC entry 3679 (class 2604 OID 24445)
-- Name: eventos_adversos id; Type: DEFAULT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.eventos_adversos ALTER COLUMN id SET DEFAULT nextval('seguimiento.eventos_adversos_id_seq'::regclass);


--
-- TOC entry 3678 (class 2604 OID 24411)
-- Name: informes_seguimiento id; Type: DEFAULT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.informes_seguimiento ALTER COLUMN id SET DEFAULT nextval('seguimiento.informes_seguimiento_id_seq'::regclass);


--
-- TOC entry 3675 (class 2604 OID 24380)
-- Name: seguimientos id; Type: DEFAULT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.seguimientos ALTER COLUMN id SET DEFAULT nextval('seguimiento.seguimientos_id_seq'::regclass);


--
-- TOC entry 3706 (class 2604 OID 24630)
-- Name: audit_log id; Type: DEFAULT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.audit_log ALTER COLUMN id SET DEFAULT nextval('sistema.audit_log_id_seq'::regclass);


--
-- TOC entry 3708 (class 2604 OID 24645)
-- Name: declaracion_confidencialidad id; Type: DEFAULT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.declaracion_confidencialidad ALTER COLUMN id SET DEFAULT nextval('sistema.declaracion_confidencialidad_id_seq'::regclass);


--
-- TOC entry 3709 (class 2604 OID 24664)
-- Name: declaracion_conflicto_interes id; Type: DEFAULT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.declaracion_conflicto_interes ALTER COLUMN id SET DEFAULT nextval('sistema.declaracion_conflicto_interes_id_seq'::regclass);


--
-- TOC entry 3701 (class 2604 OID 24587)
-- Name: notificaciones id; Type: DEFAULT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.notificaciones ALTER COLUMN id SET DEFAULT nextval('sistema.notificaciones_id_seq'::regclass);


--
-- TOC entry 3704 (class 2604 OID 24613)
-- Name: parametros_sistema id; Type: DEFAULT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.parametros_sistema ALTER COLUMN id SET DEFAULT nextval('sistema.parametros_sistema_id_seq'::regclass);


--
-- TOC entry 3699 (class 2604 OID 24575)
-- Name: plantillas_comunicacion id; Type: DEFAULT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.plantillas_comunicacion ALTER COLUMN id SET DEFAULT nextval('sistema.plantillas_comunicacion_id_seq'::regclass);


--
-- TOC entry 4198 (class 0 OID 23982)
-- Dependencies: 251
-- Data for Name: causales_suspension; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.causales_suspension (id, nombre) FROM stdin;
\.


--
-- TOC entry 4196 (class 0 OID 23971)
-- Dependencies: 249
-- Data for Name: criterios_evaluacion; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.criterios_evaluacion (id, tipo, descripcion) FROM stdin;
\.


--
-- TOC entry 4182 (class 0 OID 23875)
-- Dependencies: 235
-- Data for Name: estados; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.estados (id, nombre, categoria, codigo) FROM stdin;
1	APROBADO	DOCUMENTO	APROBADO
2	RECHAZADO	DOCUMENTO	RECHAZADO
3	OBSERVADO	DOCUMENTO	OBSERVADO
4	PENDIENTE	DOCUMENTO	PENDIENTE
5	SUGERIDO	EVALUACION	SUGERIDO
6	ASIGNADO	EVALUACION	ASIGNADO
7	COMPLETADO	EVALUACION	COMPLETADO
8	ARCHIVADO	EVALUACION	ARCHIVADO
9	INICIADO	RECEPCION	INICIADO
10	COMPLETO	RECEPCION	COMPLETO
11	INCOMPLETO	RECEPCION	INCOMPLETO
12	ARCHIVADO POR VENCIMIENTO	RECEPCION	ARCHIVADO_VENCIMIENTO
13	EN EVALUACION	PROTOCOLO	EN_EVALUACION
14	EVALUADO	PROTOCOLO	EVALUADO
\.


--
-- TOC entry 4188 (class 0 OID 23924)
-- Dependencies: 241
-- Data for Name: evaluadores_perfil; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.evaluadores_perfil (usuario_id, perfil_id, fecha_asignacion, activo) FROM stdin;
36	9	2026-06-01 16:10:42.126634	t
36	7	2026-06-01 16:10:42.126634	t
37	9	2026-06-01 16:10:42.126634	t
37	7	2026-06-01 16:10:42.126634	t
38	9	2026-06-01 16:10:42.126634	t
38	6	2026-06-01 16:10:42.126634	t
39	6	2026-06-01 16:10:42.126634	t
39	7	2026-06-01 16:10:42.126634	t
40	6	2026-06-01 16:10:42.126634	t
40	7	2026-06-01 16:10:42.126634	t
41	8	2026-06-01 16:10:42.126634	t
42	10	2026-06-01 16:10:42.126634	t
43	10	2026-06-01 16:10:42.126634	t
\.


--
-- TOC entry 4190 (class 0 OID 23942)
-- Dependencies: 243
-- Data for Name: modalidades_revision; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.modalidades_revision (id, nombre) FROM stdin;
\.


--
-- TOC entry 4281 (class 0 OID 65617)
-- Dependencies: 334
-- Data for Name: modulos; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.modulos (id, nombre, codigo, icono, orden, activo, creado_en, actualizado_en, eliminado_en) FROM stdin;
8	DASHBOARD	MOD_DASHBOARD	home-outline	1	t	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N
9	RECEPCIÓN DE PROTOCOLOS	MOD_RECEPCION	download-outline	2	t	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N
10	EVALUACIÓN ÉTICA	MOD_EVALUACION	shield-checkmark-outline	3	t	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N
11	RESOLUCIONES	MOD_RESOLUCION	document-text-outline	4	t	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N
12	CICLO DE VIDA	MOD_SEGUIMIENTO	sync-outline	5	t	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N
13	GESTIÓN DE USUARIOS	MOD_USUARIOS	people-outline	6	t	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N
14	REPORTES	MOD_REPORTES	bar-chart-outline	7	t	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N
15	CONFIGURACIÓN	MOD_CONFIG	settings-outline	8	t	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N
\.


--
-- TOC entry 4180 (class 0 OID 23865)
-- Dependencies: 233
-- Data for Name: niveles_riesgo; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.niveles_riesgo (id, codigo, nombre, tipo_revision, activo, creado_en, actualizado_en, eliminado_en) FROM stdin;
5	RIESGO_MINIMO	Investigación con riesgo mínimo	EXPEDITA	t	2026-05-06 05:41:30.59653	2026-05-06 05:41:30.59653	\N
6	RIESGO_MODERADO	Investigación con riesgo moderado	PLENO	t	2026-05-06 05:41:30.59653	2026-05-06 05:41:30.59653	\N
7	RIESGO_MAYOR	Investigación con riesgo mayor	PLENO	t	2026-05-06 05:41:30.59653	2026-05-06 05:41:30.59653	\N
8	ENSAYO_CLINICO	Ensayo clínico con intervención en humanoss	PLENO	f	2026-05-06 05:41:30.59653	2026-05-06 05:41:30.59653	\N
4	SIN_RIESG	Investigación sin riesgo	EXPEDITA	t	2026-05-06 05:41:30.59653	2026-05-06 05:41:30.59653	\N
\.


--
-- TOC entry 4187 (class 0 OID 23912)
-- Dependencies: 240
-- Data for Name: perfiles_evaluador; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.perfiles_evaluador (id, nombre, descripcion, obligatorio_para_tipo_estudio, orden_prioridad, activo) FROM stdin;
6	Metodológico	Evalúa el diseño, rigor científico y validez metodológica del estudio	["TODOS"]	1	t
7	Ético	Analiza principios éticos, consentimiento informado y protección de participantes	["TODOS"]	2	t
8	Jurídico	Verifica cumplimiento de normativas legales y regulatorias vigentes	["PLENO"]	3	t
9	Salud	Evalúa riesgos clínicos, seguridad del paciente y aspectos biomédicos	["ENSAYO_CLINICO"]	4	t
10	Sociedad Civil	Representa la perspectiva social y comunitaria de los participantes	["PLENO"]	5	t
\.


--
-- TOC entry 4279 (class 0 OID 49246)
-- Dependencies: 332
-- Data for Name: perfiles_investigador; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.perfiles_investigador (id, usuario_id, email_personal, telefono, institucion_pertenece, cargo, registro_senescyt, tipo_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, nacionalidad, acepta_terminos, acepta_reglamento, creado_en, actualizado_en, eliminado_en) FROM stdin;
1	19	jkhkjh	pxqw0iUEDgeodFxPM7SIHQ==:qHUZH15uop7iRcR/EWFF5Q==	ESPOCH	Investigador Principal	REG-INV-2024-001	\N	\N	\N	\N	\N	\N	f	f	2026-05-05 04:41:49.052833	2026-05-05 04:41:49.052833	\N
2	17	ghjjkgjg	B3mk2pe5fk7zS9bUeUkrkg==:tLNa1rRsO2c/1t+2M6WoMg==	ESPOCH	Investigador	1234-56-7890	\N	\N	\N	\N	\N	\N	f	f	2026-05-05 04:41:49.052833	2026-05-05 04:41:49.052833	\N
3	20	IBq54Lp/BJ8P9vHuGzMYiA==:jhNLGmrCtLZ6U0RSSPSuynMkezp6Gos7Bq7ClaSNTw8=	FwSgb49FwONuFFOzOCsVgQ==:nmf3fcZa5H05xQYmafSqvg==	\N	\N	\N	Cédula	Kevin	Alexander	Quilligana	Perez	Ecuatoriana	t	t	2026-05-05 06:00:26.189543	2026-05-05 06:00:26.189543	\N
4	21	IU8wSqgiSwDDIjb7Conj9w==:s0sE3MnN3VyV5e/iV0KECehj/BGvDKQELHSYj3DEb9U=	szQ2nirzv/qkBQN0LHqrmQ==:ipTjRQG2qH2Hgk1Z1OXAnw==	\N	\N	\N	Cédula	eqwe	weewe	sdfdsf	dsfsdf	Ecuatoriana	t	t	2026-05-05 06:47:06.259962	2026-05-05 06:47:06.259962	\N
5	22	NAx3PsyK5VLJcdk2SCGujA==:SPJ/NuZR/HxTkRcCrWFpuknyy4Ec3igqLgyEqhQWgK4=	Qqg11vYpoUG7NLA7ic9Sqg==:rWV2DnEHP/2mzRb3QBHGjg==	\N	\N	\N	Cédula	Kevin	Gerardo	Quilligana	Vivas	Ecuatoriana	t	t	2026-05-05 07:10:03.05534	2026-05-05 07:10:03.05534	\N
6	23	TfQFqL2PtnlvNt5gKp7/qQ==:VsrQcsm2GcZk3N2joVKvzWtHRMdh0Zat/3cqUq5L+og=	zXUW2WXctTUzDums16y73A==:S3yJUaSIgxo+cFhWnA+CUw==	\N	\N	\N	Cédula	ewew	ddd	ewew	aefew	Ecuatoriana	t	t	2026-05-05 07:16:37.855651	2026-05-05 07:16:37.855651	\N
7	24	RxpRY9D/LYvgg8BuGn07tg==:3MLtr5C/ipXvv6AKhELzDQL+5uD0st8qcCX38tnUNw0=	82oZL2v0OCyfkiT8FARctA==:ccnBlkgi3xAFfST8qLV3QA==	\N	\N	\N	Cédula	as	dad	ad	sad	Ecuatoriana	t	t	2026-05-05 07:26:32.599626	2026-05-05 07:26:32.599626	\N
9	26	wJ6Zedfgssd	TITRuQxvpC9g/8qMUOJ68w==:rE9EjEZbmUd4AC664srBFw==	\N	\N	\N	Cédula	adasd	asdasd	dasd	sadas	Extranjera	t	t	2026-05-05 08:04:28.602641	2026-05-05 08:04:28.602641	\N
8	25	lsPT2dhj8f5khHF7ZLhq5A==:/owKq9bisdsdasdu3a4usscVS8Hq6KzWvUutj+EGxooFSRLp9o=	iPiPqtSxZzMc3kJOErVTtA==:4U55eQ9TiSZT9q0FmVI1Eg==	\N	\N	\N	Cédula	sadsad	sadasda	dasd	dsad	Ecuatoriana	t	t	2026-05-05 07:38:03.591148	2026-05-05 07:38:03.591148	\N
10	28	7d/QWUz/ehnreYVVuKjYZA==:zhYQiDk2E9PHrz2t9Iw9E6k2v5BJe3Qqz1tNMY8qD4A=	3Id0GjUvT7Z/SWBNGsPTbA==:Q7WZW62DowEnaRFw/ioLVQ==	\N	\N	\N	Pasaporte	wdsd	asd	asd	asdasd	Extranjera	t	t	2026-05-05 08:39:24.567458	2026-05-05 08:39:24.567458	\N
11	34	no30X3nrY16hk3IeTDuVcg==:hJ5+uMZ4oYcStS2pxjO8K5zWZNbe/+t00OOEtLLlpz0=	n8mhB5fw9E5TPYvG4AUAhQ==:LrROrU3F5Y7iyMF1DojZRg==	\N	\N	\N	Cédula	liliana 	berzabet	paguay	carrillo	Ecuatoriana	t	t	2026-05-26 20:42:04.338599	2026-05-26 20:42:04.338599	\N
\.


--
-- TOC entry 4175 (class 0 OID 23831)
-- Dependencies: 228
-- Data for Name: permisos; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.permisos (id, nombre, creado_en, actualizado_en, eliminado_en, codigo, modulo_id) FROM stdin;
1	Resumen ejecutivo	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	DASHBOARD_RESUMEN	8
2	Notificaciones pendientes	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	DASHBOARD_NOTIF	8
3	Próximos vencimientos	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	DASHBOARD_VENCIMIENTOS	8
4	Indicadores SLA	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	DASHBOARD_SLA	8
5	Nuevo protocolo	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RECEPCION_NUEVO	9
6	Lista de ingresos	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RECEPCION_LISTA	9
7	Validación documental	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RECEPCION_VALIDAR	9
8	Búsqueda avanzada	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RECEPCION_BUSCAR	9
9	Constancias de recepción	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RECEPCION_CONSTANCIAS	9
10	Estratificación de riesgo	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	EVALUACION_RIESGO	10
11	Asignación de evaluadores	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	EVALUACION_ASIGNAR	10
12	Evaluación expedita	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	EVALUACION_EXPEDITA	10
13	Evaluación en pleno	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	EVALUACION_PLENO	10
14	Subsanaciones	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	EVALUACION_SUBSANACIONES	10
15	Consolidación de informes	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	EVALUACION_INFORMES	10
16	Generar dictamen	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RESOLUCION_CREAR	11
17	Firma electrónica	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RESOLUCION_FIRMAR	11
18	Notificaciones a investigadores	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RESOLUCION_NOTIF	11
19	Historial de resoluciones	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RESOLUCION_HISTORIAL	11
20	Urgencias sanitarias	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	RESOLUCION_URGENCIAS	11
21	Informes de avance	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	SEGUIMIENTO_AVANCE	12
22	Informes finales	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	SEGUIMIENTO_FINAL	12
23	Enmiendas	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	SEGUIMIENTO_ENMIENDAS	12
24	Renovaciones	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	SEGUIMIENTO_RENOVACIONES	12
25	Eventos adversos	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	SEGUIMIENTO_EVENTOS	12
26	Suspensión/Revocatoria	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	SEGUIMIENTO_SUSPENSION	12
27	Usuarios y roles	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	USUARIOS_VER	13
28	Permisos y accesos	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	PERMISOS_GESTIONAR	13
29	Conflictos de interés	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	USUARIOS_CONFLICTOS	13
30	Perfiles de evaluadores	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	EVALUADORES_PERFILES	13
31	Auditoría de accesos	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	AUDITORIA_ACCESOS	13
32	KPIs de gestión	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	REPORTES_KPIS	14
33	Tiempos de respuesta	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	REPORTES_TIEMPOS	14
34	Carga por evaluador	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	REPORTES_CARGA	14
35	Exportar Excel/PDF	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	REPORTES_EXPORTAR	14
36	Auditoría integral	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	REPORTES_AUDITORIA	14
37	Catálogos	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	CONFIG_CATALOGOS	15
38	Plantillas de anexos	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	CONFIG_PLANTILLAS	15
39	Reglas de notificación	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	CONFIG_NOTIF	15
40	Integraciones	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	CONFIG_INTEGRACIONES	15
41	Parámetros del sistema	2026-05-13 02:24:15.494306	2026-05-13 02:24:15.494306	\N	CONFIG_PARAMETROS	15
42	Traducción a idiomas ancestrales	2026-05-13 03:19:27.986716	2026-05-13 03:19:27.986716	\N	TRADUCCION_ANCESTRAL	9
\.


--
-- TOC entry 4176 (class 0 OID 23839)
-- Dependencies: 229
-- Data for Name: rol_permisos; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.rol_permisos (rol_id, permiso_id) FROM stdin;
10	1
10	2
10	3
10	4
10	5
10	6
10	7
10	8
10	9
10	10
10	11
10	12
10	13
10	14
10	15
10	16
10	17
10	18
10	19
10	20
10	21
10	22
10	23
10	24
10	25
10	26
10	27
10	28
10	29
10	30
10	31
10	32
10	33
10	34
10	35
10	36
10	37
10	38
10	39
10	40
10	41
8	1
8	2
8	3
8	4
8	5
8	6
8	7
8	8
8	9
8	10
8	11
8	12
8	13
8	14
8	15
8	16
8	17
8	18
8	19
8	20
8	21
8	22
8	23
8	24
8	25
8	26
8	27
8	28
8	29
8	30
8	31
8	32
8	33
8	34
8	35
8	36
7	1
7	2
7	3
7	4
7	5
7	6
7	7
7	8
7	9
7	10
7	11
7	12
7	13
7	14
7	15
7	16
7	17
7	18
7	19
7	20
7	21
7	22
7	23
7	24
7	25
7	26
7	32
7	33
7	34
7	35
7	36
9	1
9	2
9	3
9	4
9	10
9	11
9	12
9	13
9	14
9	15
9	21
9	22
9	23
9	24
9	25
9	26
9	32
9	33
9	34
9	35
9	36
6	1
6	2
6	3
6	4
6	21
6	22
6	23
6	24
6	25
6	26
6	32
6	33
6	34
6	35
6	36
\.


--
-- TOC entry 4170 (class 0 OID 23782)
-- Dependencies: 223
-- Data for Name: roles; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.roles (id, nombre, creado_en, actualizado_en, eliminado_en, activo, descripcion, codigo) FROM stdin;
6	investigador	2026-04-16 08:44:47.171275	2026-05-03 15:50:17.144782	\N	t	\N	INVESTIGADOR
7	secretaria	2026-04-16 08:44:47.171275	2026-05-03 15:50:17.144782	\N	t	\N	SECRETARIA
8	presidente	2026-04-16 08:44:47.171275	2026-05-03 15:50:17.144782	\N	t	\N	PRESIDENTE
9	evaluador	2026-04-16 08:44:47.171275	2026-05-03 15:50:17.144782	\N	t	\N	EVALUADOR
10	admin_ti	2026-04-16 08:44:47.171275	2026-05-03 15:50:17.144782	\N	t	\N	ADMIN_TI
\.


--
-- TOC entry 4185 (class 0 OID 23896)
-- Dependencies: 238
-- Data for Name: tipo_documento_estudio; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.tipo_documento_estudio (tipo_documento_id, tipo_estudio_id, obligatorio) FROM stdin;
21	5	t
21	6	t
21	7	t
22	5	t
22	6	t
23	5	t
23	6	t
24	5	t
24	6	t
24	7	t
25	5	t
25	6	t
25	7	t
26	5	t
26	6	t
27	5	t
27	6	t
28	5	t
28	6	t
29	5	t
29	6	t
29	7	t
30	6	t
31	6	t
31	7	t
32	6	t
33	7	t
34	7	t
35	7	t
36	7	t
37	7	t
38	7	t
39	7	t
40	7	t
41	7	t
42	7	t
43	7	t
44	7	t
20	5	t
20	6	t
45	7	t
19	5	t
19	6	t
\.


--
-- TOC entry 4184 (class 0 OID 23884)
-- Dependencies: 237
-- Data for Name: tipos_documento; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.tipos_documento (id, nombre, es_obligatorio, es_condicional, condicion_json, tipo_estudio_aplica, creado_en, actualizado_en, eliminado_en, codigo_anexo) FROM stdin;
34	Hoja de Vida del IP e Investigadores	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	CV_IP
38	Procedimientos e Instrumentos de Reclutamiento y Recolección	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	PROCEDIMIENTOS_REC
39	Certificados de Capacitación y Experiencia (Bioética)	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	CERT_BIOETICA
40	Registro SENESCYT del Investigador Principal	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	REG_SENESCYT
41	Información sobre Seguridad del Fármaco Experimental	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	SEG_FARMACO
19	Anexo 1: Solicitud de Evaluación	t	f	{"condiciones_por_tipo": {"EI": [], "IO": []}}	["IO", "EI"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	ANEXO_1
20	Anexo 2: Formulario de Protocolo	t	f	{"condiciones_por_tipo": {"EI": [], "IO": []}}	["IO", "EI"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	ANEXO_2
21	Formulario de Consentimiento Informado	t	f	{"condiciones_por_tipo": {"EC": [], "EI": [], "IO": []}}	["IO", "EI", "EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	CONSENTIMIENTO
22	Instrumentos de Investigación (Fichas, encuestas, manuales)	t	f	{"condiciones_por_tipo": {"EI": [], "IO": []}}	["IO", "EI"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	INSTRUMENTOS
23	Currículos Vitae de Investigadores	t	f	{"condiciones_por_tipo": {"EI": [], "IO": []}}	["IO", "EI"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	CV_INVESTIGADORES
24	Declaración de Responsabilidad (Anexo 4)	t	f	{"condiciones_por_tipo": {"EC": [], "EI": [], "IO": []}}	["IO", "EI", "EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	ANEXO_4
25	Traducción a idiomas ancestrales	t	f	{"condiciones_por_tipo": {"EC": ["poblacionIndigena"], "EI": ["poblacionIndigena"], "IO": ["poblacionIndigena"]}}	["IO", "EI", "EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	TRADUCCION_ANCESTRAL
42	Copia del Contrato entre Promotor e Investigadores	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	CONTRATO_PROMOTOR
43	Plan de Monitoreo del Ensayo Clínico	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	PLAN_MONITOREO
44	Plan de Seguridad del Participante	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	PLAN_SEGURIDAD
45	Carta de Aprobación del Comité de Ética del País de Origen	t	f	{"condiciones_por_tipo": {"EC": ["multicentrico"]}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	APROB_ORIGEN
1	Protocolo de investigación	t	f	\N	["TODOS"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	PROTOCOLO_GEN
2	Consentimiento informado	t	f	\N	["TODOS"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	CONSENTIMIENTO_GEN
3	Instrumentos de recolección de datos	t	f	\N	["TODOS"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	INSTRUMENTOS_GEN
4	Hoja de vida del investigador	t	f	\N	["TODOS"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	CV_GEN
5	Formulario evaluación expedita	t	f	\N	["EXPEDITA"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	FORM_EXPEDITA
6	Carta solicitud evaluación expedita	t	f	\N	["EXPEDITA"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	CARTA_EXPEDITA
7	Formulario evaluación pleno	t	f	\N	["PLENO"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	FORM_PLENO
8	Carta solicitud evaluación pleno	t	f	\N	["PLENO"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	CARTA_PLENO
9	Formulario ensayo clínico	t	f	\N	["ENSAYO_CLINICO"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	FORM_EC
10	Manual del investigador	t	f	\N	["ENSAYO_CLINICO"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	MANUAL_INV_GEN
11	Póliza de seguro	t	f	\N	["ENSAYO_CLINICO"]	2026-05-12 01:24:12.235993	2026-05-18 22:17:03.041671	\N	POLIZA_GEN
26	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	t	f	{"condiciones_por_tipo": {"EI": ["poblacionIndigena"], "IO": ["poblacionIndigena"]}}	["IO", "EI"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	CONSENTIMIENTO_COM
27	Declaratoria de Compromiso de Confidencialidad	t	f	{"condiciones_por_tipo": {"EI": ["muestras", "vulnerable"], "IO": ["muestras", "vulnerable"]}}	["IO", "EI"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	CONFIDENCIALIDAD
28	Declaración de Conflicto de Interés	t	f	{"condiciones_por_tipo": {"EI": ["muestras", "vulnerable"], "IO": ["muestras", "vulnerable"]}}	["IO", "EI"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	CONFLICTO_INTERES
29	Carta de Interés Institucional (Anexo 5)	t	f	{"condiciones_por_tipo": {"EC": [], "EI": ["institucionesPublicas"], "IO": ["institucionesPublicas"]}}	["IO", "EI", "EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	ANEXO_5
30	Ficha Descriptiva de la Intervención y Riesgos	t	f	{"condiciones_por_tipo": {"EI": []}}	["EI"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	FICHA_INTERVENCION
31	Copia de Póliza de Seguro de Responsabilidad Civil	t	f	{"condiciones_por_tipo": {"EC": [], "EI": ["riesgoMayor"]}}	["EI", "EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	POLIZA_RC
32	Documentos de Idoneidad de Instalaciones	t	f	{"condiciones_por_tipo": {"EI": ["riesgoMayor"]}}	["EI"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	IDONEIDAD_INST
33	Anexo 6: Carta de Solicitud de Evaluación	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	ANEXO_6
35	Protocolo de Investigación (Original y Castellano)	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	PROTOCOLO_EC
36	Ficha Descriptiva de Ensayos Clínicos	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	FICHA_EC
37	Manual del Investigador (Buenas Prácticas Clínicas)	t	f	{"condiciones_por_tipo": {"EC": []}}	["EC"]	2026-05-17 05:47:21.302782	2026-05-18 22:17:03.041671	\N	MANUAL_BPC
\.


--
-- TOC entry 4178 (class 0 OID 23855)
-- Dependencies: 231
-- Data for Name: tipos_estudio; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.tipos_estudio (id, nombre, plazo_evaluacion_dias, requiere_arcsa, periodicidad_informe_dias, requiere_informe_inicio, requiere_informe_final, activo, creado_en, actualizado_en, eliminado_en, codigo) FROM stdin;
5	Observacional	30	f	180	t	t	t	2026-05-06 04:54:31.601716	2026-05-06 04:54:31.601716	\N	IO
6	Intervención	45	f	90	t	t	t	2026-05-06 04:54:31.601716	2026-05-06 04:54:31.601716	\N	EI
7	Ensayo Clínico	60	t	90	t	t	t	2026-05-06 04:54:31.601716	2026-05-06 04:54:31.601716	\N	EC
8	Exento de Revisión	15	f	0	f	t	f	2026-05-06 04:54:31.601716	2026-05-06 04:54:31.601716	\N	EX
\.


--
-- TOC entry 4194 (class 0 OID 23962)
-- Dependencies: 247
-- Data for Name: tipos_resolucion; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.tipos_resolucion (id, nombre) FROM stdin;
1	APROBADO
2	APROBADO_CON_OBSERVACIONES
3	RECHAZADO
4	PENDIENTE_SUBSANACION
\.


--
-- TOC entry 4192 (class 0 OID 23951)
-- Dependencies: 245
-- Data for Name: tipos_seguimiento; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.tipos_seguimiento (id, nombre, codigo, plazo_dias_desde_aprobacion, plazo_dias_desde_finalizacion, requiere_evaluacion, activo) FROM stdin;
\.


--
-- TOC entry 4172 (class 0 OID 23795)
-- Dependencies: 225
-- Data for Name: usuarios; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.usuarios (id, cedula, nombres_completos, email_institucional, password_hash, activo, intentos_fallidos, bloqueado_hasta, refresh_token_hash, ultimo_acceso, creado_en, actualizado_en, eliminado_en, email_verificado, token_confirmacion_hash, token_recuperacion_hash, token_recuperacion_expira) FROM stdin;
2	0607654321	Verónica Delgado	veronica.delgado@espoch.edu.ec	hash	t	0	\N	\N	\N	2026-05-03 15:50:17.144782	2026-05-03 15:50:17.144782	\N	f	\N	\N	\N
3	0609876543	Juan Evaluador	juan.evaluador@espoch.edu.ec	hash	t	0	\N	\N	\N	2026-05-03 15:50:17.144782	2026-05-03 15:50:17.144782	\N	f	\N	\N	\N
1	0601234567	Karina Albuja	karina.albuja@espoch.edu.ec	hash	t	0	\N	\N	\N	2026-05-03 15:50:17.144782	2026-05-04 17:14:20.732587	\N	f	$2b$10$PHDUET/nrJypZAOx.hbYouskcT8TmuYDMfuS3/KDGx632ikltbv.u	\N	\N
19	0605987654	Dr. Investigador CEISH	2	$2b$10$lzfPEDZrxlsbqlrJeLz52OEbw/KgNdckRTvbq0L1R7MSGhODKLmLq	t	0	\N	\N	\N	2026-05-05 02:37:31.097539	2026-05-05 02:37:31.097539	\N	f	$2b$10$Sl43h3AYqMoCnYa8flJHBeL82YpUazPQPL2Zmp.Thf43nc9wjpStG	\N	\N
4	0999999999	Usuario Encriptado	testencrypt@espoch.edu.ec	$2b$10$Tv1T0c/siQEAs04JzBfVQOauHKCCd98ebun00NSgrWZgMDVebWp1a	t	0	\N	$2b$10$hJd6qTtgUHAak.nY.MRWt.pq/jsoDVFHW7GJk1NjubqQu4JuMHBWm	\N	2026-05-03 15:50:17.144782	2026-05-03 15:50:17.144782	\N	f	\N	\N	\N
25	1850868999	sadsad sadasda dasd dsad	keuilligana309@gmail.com	$2b$10$0.AXZvmo1HgEl.U2LQHTo.z/PNmzRkoZrNXRJlF3jOxL6g8VXnlCm	t	0	\N	\N	\N	2026-05-05 07:38:03.591148	2026-05-05 07:38:03.591148	\N	f	$2b$10$qvj7dd9qj6UlBxy1xudtT.79KXlvkEyJkQN9LQ3IgwkS4dJSox/jG	\N	\N
20	1850463392	Kevin Alexander Quilligana Perez	kevinquilliganahhh@gmail.com	$2b$10$fYLx7MAN1Ax0BMXjlH7GMOP17wgHjJh1j..DNGeSun3Sf9cPRN9M.	t	0	\N	\N	\N	2026-05-05 06:00:26.189543	2026-05-05 06:00:26.189543	\N	f	$2b$10$gLONYnkiHa5kYpE3Dl0Jb.ASwE3fBnMGNqyIEm4Mj29xSXfiYH09y	\N	\N
17	1851867399	Kevin Quilligana	gerardovivas851@gmail.com	$2b$10$n5lU8hvYpTTZrME.o2Wi0eKgEsC9nUzxFZYympSvhJk7kCyREq8tS	t	0	\N	\N	\N	2026-05-04 17:22:30.301046	2026-05-04 18:07:40.652545	\N	f	$2b$10$x1hav794KDFivIOk1RsIB..J3i0HRX.wjxLaMpSiDBo5CbX.IksOS	\N	\N
6	1876847299	Usuario Prueba	kevinquilligana09@gmail.com	$2b$10$n5lU8hvYpTTZrME.o2Wi0eKgEsC9nUzxFZYympSvhJk7kCyREq8tS	t	0	\N	$2b$10$NeuFLCIFoz4SY5OubgV9weylhY0hFx970bov68GR2PXzuFH4aUQRS	\N	2026-05-03 15:50:17.144782	2026-05-04 18:39:41.029269	\N	t	\N	\N	\N
21	1850837329	eqwe weewe sdfdsf dsfsdf	kevinquil@gmail.com	$2b$10$g8EokpRzf12b8X3THZBYAeIP010IuJ9wqRvbBLlHhhI3G4BcXRRJi	t	0	\N	\N	\N	2026-05-05 06:47:06.259962	2026-05-05 06:47:06.259962	\N	f	$2b$10$QrIjQqdrfG99IqHhgUCFqeFPmwrc/ZgxmOimqekUCNNsjQPMcRSfm	\N	\N
22	1823867399	Kevin Gerardo Quilligana Vivas	kevinquillig@gmail.com	$2b$10$jlu8OzmmAmhSgQSwYEioguLSl7FmpKk1DuowFVblcq5y0t0VNs2j2	t	0	\N	\N	\N	2026-05-05 07:10:03.05534	2026-05-05 07:10:03.05534	\N	f	$2b$10$T8guQUERiOfiCB4n7C0Asuakxoye4DOB7qtvspFAFapKgytVVc6US	\N	\N
23	1234567890	ewew ddd ewew aefew	kevinqbgna309@gmail.com	$2b$10$Hva2JK/FbxOwFV7r29MkQOd78xgSGFMPuFTy6Y7l3IIRZZNXRNNLm	t	0	\N	\N	\N	2026-05-05 07:16:37.855651	2026-05-05 07:16:37.855651	\N	f	$2b$10$PC1fmJBy1v8r1EqeL35rUOT8l/pYkOjzGn0VXG0VWpX9x7/ugVCo2	\N	\N
24	9876543321	as dad ad sad	kevinqui23dssslligana309@gmail.com	$2b$10$0qr.tMPJujUNsdrDOiWXueXWTXGr50uVh93WSKq2nRp0J7IKPkXBm	t	0	\N	\N	\N	2026-05-05 07:26:32.599626	2026-05-05 07:26:32.599626	\N	f	$2b$10$0hd1y2XXkbWG3IzQ7PSwjeubK7nBy4C65tOoReouGa0t9JVSdRCPO	\N	\N
26	1850897999	adasd asdasd dasd sadas	uilligana309@gmail.com	$2b$10$33BqzPBHy5bTrp3Ec4xf.uavgBe5m.8fGTkq3vMM1jGhmlmMTxQFC	t	0	\N	\N	\N	2026-05-05 08:04:28.602641	2026-05-05 08:04:28.602641	\N	f	$2b$10$STWCj1mkCPXQByKuIpI0M.lyyhvbCn3/BAy8YOHkVVhWy5jGcCrbK	\N	\N
30	9999999992	Test Secretaria	secretaria@test.com	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$7NIKwlRFawpWMtTeGiF0v.6j./yqANcJuOM3RGkOpZmzxsDwWKHH2	\N	2026-05-05 21:54:15.000179	2026-06-08 18:31:15.521148	\N	t	\N	\N	\N
29	9999999991	Test Investigador	investigador@test.com	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$V1I9l31T6HD8KwU67oK2SeEHRNv17GuBAm/n4muWGhTgrYDwMcvnW	\N	2026-05-05 21:54:15.000179	2026-05-26 18:42:34.142913	\N	t	\N	\N	\N
38	0600000003	Patricio David Ramos Padilla	patricio.ramos@espoch.edu.ec	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$kVIwZDZD/WX1wCRvTRePk.xPIjuQlHmlmXyb8J9Om7D5zG2.9HSfG	\N	2026-06-01 16:10:42.126634	2026-06-06 09:08:13.002004	\N	t	\N	\N	\N
28	1850867399	wdsd asd asd asdasd	kevinquilligana309@gmail.com	$2b$10$bfLg9i7Yyb8.7kLu6biurOeLTPyA7doFl2Wyt/HIU73XH2m0Elrd.	t	0	\N	$2b$10$ahII0M1McPYiFZ4Q5bxFP.BAPmzYXhys.9KFKRqlWrh59jmqepnc6	\N	2026-05-05 08:39:24.567458	2026-06-06 08:27:49.993688	\N	t	\N	\N	\N
33	9999999995	Test Admin TI	admin@test.com	$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	\N	\N	2026-05-05 21:54:15.000179	2026-05-05 21:54:15.000179	\N	t	\N	\N	\N
40	0600000005	Veronica Mercedes Cando Brito	veronica.cando@espoch.edu.ec	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$qeXxkxqRuHhV8ij0A5Usveq1qxWItkTzAe8tB/L4oKo1MtOi2vyki	\N	2026-06-01 16:10:42.126634	2026-06-09 07:27:43.537304	\N	t	\N	\N	\N
34	0606097335	liliana  berzabet paguay carrillo	lilianapaguay15@gmail.com	$2b$10$bco5ZdNva5PxJOWRQGb/.eb9CRqk2.yp5T5gy.VS4WlBnjr6znAKi	t	0	\N	$2b$10$ftIhdynLqiTeUKphd0KCpOXwfV8Y2YFQlrAJUE6bo9FTWAl06Q3UK	\N	2026-05-26 20:42:04.338599	2026-06-08 15:42:56.231724	\N	t	\N	\N	\N
8	1850327239	Usuario Prueba	kevin@espoch.edu.ec	$2b$10$89.v9XpL8.7t7Xv2Y8Y0O.S6I6L0L0L0L0L0L0L0L0L0L0L0L0L0	t	1	\N	$2b$10$kaw0/pllbpXMHSdYp8DEnuNBf5ygR0pvyJFLYxh3fnhqZZTRTb8kG	\N	2026-05-03 15:50:17.144782	2026-05-05 10:38:15.616234	\N	t	\N	\N	\N
100	0000000000	Super Administrador	admin@ceish.com	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$7Z.GiWgKR2IGz6ehDJllF.59bCr8/53OG.jhwnUUSsw4zYCtyZnEe	\N	2026-05-05 05:40:26.034114	2026-06-01 15:29:16.00969	\N	t	\N	\N	\N
36	0600000001	Rolando Teruel Ginés	rolando.teruel@espoch.edu.ec	\N	t	0	\N	\N	\N	2026-06-01 16:10:42.126634	2026-06-01 16:10:42.126634	\N	t	\N	\N	\N
31	9999999993	Test Presidente	presidente@test.com	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$EZeW3OLOtxVmw.IhVegBiuNStFo4NVrdZzgTwyheD9cpCVzG1CQky	\N	2026-05-05 21:54:15.000179	2026-05-28 20:36:12.849727	\N	t	\N	\N	\N
37	0600000002	Patricia Alejandra Ríos Guarango	patricia.rios@espoch.edu.ec	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$TiIQreaAzOZS2NdrUy/DbuoPdgt/r.ZBSgf7kuMryiFsBTIeBzswC	\N	2026-06-01 16:10:42.126634	2026-06-06 09:08:56.474482	\N	t	\N	\N	\N
42	0600000007	Nelly Margarita Padilla Padilla	nelly.padilla@espoch.edu.ec	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$Kude7G8z7YQnZBrL93Wv/ep18I.V3dm.SJtSZiJdisODVi4tYPPFK	\N	2026-06-01 16:10:42.126634	2026-06-06 09:06:39.078637	\N	t	\N	\N	\N
39	0600000004	Ana Karina Albuja Landi	ana.albuja@espoch.edu.ec	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$KTPTI33zAo1znY5tP32g/eHBQ4RPyPXZH8YT0feADsvpvnlHUc16S	\N	2026-06-01 16:10:42.126634	2026-06-06 09:15:46.405439	\N	t	\N	\N	\N
41	0600000006	Gabriel Alejandro Tamayo Becerra	gabriel.tamayo@espoch.edu.ec	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$vElNi.tJ8J0j5Q.GHGdy4.mIxVG13C1gvuZgIUCBKKwO/9DZrw/JW	\N	2026-06-01 16:10:42.126634	2026-06-06 09:07:46.616066	\N	t	\N	\N	\N
32	9999999994	Test Evaluador	evaluador@test.com	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$nsPVwd4b.0t1Eg6eKFkvlO/8pXHTpJpZuEUBcC3eKehgY3dnvJv2K	\N	2026-05-05 21:54:15.000179	2026-06-08 06:36:21.257018	\N	t	\N	\N	\N
43	0600000008	Jaime David Camacho Castillo	jaime.camacho@espoch.edu.ec	$2b$10$3SnIjux4BKsLHEG7Fj6NkuNMVA/.piXzOlTAkc/S7AklEOcp7jewm	t	0	\N	$2b$10$d0FcVKTyPmUEkLsN0JUCqu4g8CZF8W3ue4X90Qpn8Td8by1xhw1TS	\N	2026-06-01 16:10:42.126634	2026-06-06 09:07:59.411719	\N	t	\N	\N	\N
\.


--
-- TOC entry 4173 (class 0 OID 23809)
-- Dependencies: 226
-- Data for Name: usuarios_roles; Type: TABLE DATA; Schema: catalogos; Owner: ceish_user
--

COPY catalogos.usuarios_roles (usuario_id, rol_id) FROM stdin;
1	7
26	10
30	7
31	8
32	9
33	10
34	6
2	9
8	9
100	10
36	9
37	9
38	9
39	9
40	9
41	9
42	9
43	9
\.


--
-- TOC entry 4219 (class 0 OID 24282)
-- Dependencies: 272
-- Data for Name: acta_asistente; Type: TABLE DATA; Schema: evaluacion; Owner: ceish_user
--

COPY evaluacion.acta_asistente (acta_id, usuario_id) FROM stdin;
\.


--
-- TOC entry 4218 (class 0 OID 24267)
-- Dependencies: 271
-- Data for Name: acta_protocolo; Type: TABLE DATA; Schema: evaluacion; Owner: ceish_user
--

COPY evaluacion.acta_protocolo (acta_id, protocolo_id) FROM stdin;
\.


--
-- TOC entry 4217 (class 0 OID 24246)
-- Dependencies: 270
-- Data for Name: actas; Type: TABLE DATA; Schema: evaluacion; Owner: ceish_user
--

COPY evaluacion.actas (id, sesion_id, numero_acta, resumen_agenda, decisiones_tomadas, lista_asistentes, conflictos_interes_registrados, consultores_externos, archivo_acta_pdf, firmada_por_presidente, firmada_por_secretario, fecha_elaboracion, creado_por, summary, deliberations, voting) FROM stdin;
\.


--
-- TOC entry 4210 (class 0 OID 24149)
-- Dependencies: 263
-- Data for Name: asignaciones_evaluacion; Type: TABLE DATA; Schema: evaluacion; Owner: ceish_user
--

COPY evaluacion.asignaciones_evaluacion (id, version_id, evaluador_id, perfil_id, modalidad_id, estado_id, fecha_limite, fecha_asignacion, fecha_entrega_real, informe_evaluacion, recomendacion, asignado_por, aprobado_asignacion_por, fecha_sugerencia, fecha_confirmacion, sugerido_por, confirmado_por, ruta_informe_pdf) FROM stdin;
1	5	32	\N	\N	6	2026-06-23	2026-06-02 23:57:25.434898	\N	\N	\N	30	\N	2026-06-02 23:57:25.434898	\N	\N	\N	\N
2	5	8	\N	\N	6	2026-06-23	2026-06-02 23:57:25.45176	\N	\N	\N	30	\N	2026-06-02 23:57:25.45176	\N	\N	\N	\N
3	5	41	8	\N	6	2026-06-23	2026-06-02 23:57:25.491499	\N	\N	\N	30	\N	2026-06-02 23:57:25.491499	\N	\N	\N	\N
4	5	42	10	\N	6	2026-06-23	2026-06-02 23:57:25.533754	\N	\N	\N	30	\N	2026-06-02 23:57:25.533754	\N	\N	\N	\N
5	5	43	10	\N	6	2026-06-23	2026-06-02 23:57:25.547456	\N	\N	\N	30	\N	2026-06-02 23:57:25.547456	\N	\N	\N	\N
6	2	39	6	\N	6	2026-06-23	2026-06-03 00:19:06.698011	\N	\N	\N	30	\N	2026-06-03 00:19:06.698011	\N	\N	\N	\N
7	2	40	6	\N	6	2026-06-23	2026-06-03 00:19:06.70888	\N	\N	\N	30	\N	2026-06-03 00:19:06.70888	\N	\N	\N	\N
8	2	41	8	\N	6	2026-06-23	2026-06-03 00:19:06.719141	\N	\N	\N	30	\N	2026-06-03 00:19:06.719141	\N	\N	\N	\N
9	2	42	10	\N	6	2026-06-23	2026-06-03 00:19:06.73296	\N	\N	\N	30	\N	2026-06-03 00:19:06.73296	\N	\N	\N	\N
10	2	43	10	\N	6	2026-06-23	2026-06-03 00:19:06.743298	\N	\N	\N	30	\N	2026-06-03 00:19:06.743298	\N	\N	\N	\N
11	95	37	9	\N	6	2026-06-29	2026-06-08 06:21:36.713096	\N	\N	\N	30	\N	2026-06-08 06:21:36.713096	\N	\N	\N	\N
12	95	40	6	\N	6	2026-06-29	2026-06-08 06:21:36.725708	\N	\N	\N	30	\N	2026-06-08 06:21:36.725708	\N	\N	\N	\N
13	95	8	\N	\N	6	2026-06-29	2026-06-08 06:21:36.735259	\N	\N	\N	30	\N	2026-06-08 06:21:36.735259	\N	\N	\N	\N
14	95	41	8	\N	6	2026-06-29	2026-06-08 06:21:36.746146	\N	\N	\N	30	\N	2026-06-08 06:21:36.746146	\N	\N	\N	\N
\.


--
-- TOC entry 4283 (class 0 OID 139785)
-- Dependencies: 336
-- Data for Name: asignaciones_pares_riesgo; Type: TABLE DATA; Schema: evaluacion; Owner: ceish_user
--

COPY evaluacion.asignaciones_pares_riesgo (id, protocolo_id, evaluador_id, nivel_riesgo_propuesto_id, observaciones, fecha_asignacion, fecha_envio, ruta_informe_pdf) FROM stdin;
13	126	32	\N	\N	2026-06-02 23:57:25.394272	\N	\N
14	126	8	\N	\N	2026-06-02 23:57:25.394272	\N	\N
15	119	41	\N	\N	2026-06-03 00:19:06.683289	\N	\N
16	119	42	\N	\N	2026-06-03 00:19:06.683289	\N	\N
17	146	40	\N	\N	2026-06-08 06:21:36.695341	\N	\N
18	146	41	\N	\N	2026-06-08 06:21:36.695341	\N	\N
\.


--
-- TOC entry 4221 (class 0 OID 24298)
-- Dependencies: 274
-- Data for Name: asistencia_sesiones; Type: TABLE DATA; Schema: evaluacion; Owner: ceish_user
--

COPY evaluacion.asistencia_sesiones (id, sesion_id, usuario_id, asistio, participo_en_votacion, conflicto_interes, excusa_presentada, registro_por, fecha_registro) FROM stdin;
\.


--
-- TOC entry 4213 (class 0 OID 24213)
-- Dependencies: 266
-- Data for Name: evaluacion_criterio; Type: TABLE DATA; Schema: evaluacion; Owner: ceish_user
--

COPY evaluacion.evaluacion_criterio (evaluacion_id, criterio_id, valor) FROM stdin;
\.


--
-- TOC entry 4212 (class 0 OID 24194)
-- Dependencies: 265
-- Data for Name: evaluaciones; Type: TABLE DATA; Schema: evaluacion; Owner: ceish_user
--

COPY evaluacion.evaluaciones (id, asignacion_id, aspectos_eticos, aspectos_metodologicos, aspectos_juridicos, resultado, observaciones, fecha_evaluacion, evaluado_por, ruta_informe_pdf) FROM stdin;
\.


--
-- TOC entry 4215 (class 0 OID 24229)
-- Dependencies: 268
-- Data for Name: sesiones; Type: TABLE DATA; Schema: evaluacion; Owner: ceish_user
--

COPY evaluacion.sesiones (id, tipo_sesion, quorum_alcanzado, estado_id, creado_por, date, "attendeesCount") FROM stdin;
\.


--
-- TOC entry 4234 (class 0 OID 24465)
-- Dependencies: 287
-- Data for Name: enmiendas; Type: TABLE DATA; Schema: gestion; Owner: ceish_user
--

COPY gestion.enmiendas (id, protocolo_id, numero_enmienda, version_anterior_id, descripcion, fecha_solicitud, estado_id, tipo_enmienda, afecta_seguridad_sujetos, modalidad_evaluacion, evaluado_por, solicitado_por) FROM stdin;
\.


--
-- TOC entry 4236 (class 0 OID 24501)
-- Dependencies: 289
-- Data for Name: renovaciones; Type: TABLE DATA; Schema: gestion; Owner: ceish_user
--

COPY gestion.renovaciones (id, protocolo_id, numero_renovacion, fecha_solicitud, fecha_aprobacion, estado_id, periodo_anterior_desde, periodo_anterior_hasta, periodo_solicitado_desde, periodo_solicitado_hasta, tiene_protocolo_aprobado, tiene_enmiendas_aprobadas, tiene_informes_avance, tiene_aprobacion_arcsa, evaluado_por, solicitado_por) FROM stdin;
\.


--
-- TOC entry 4239 (class 0 OID 24556)
-- Dependencies: 292
-- Data for Name: suspension_causal; Type: TABLE DATA; Schema: gestion; Owner: ceish_user
--

COPY gestion.suspension_causal (suspension_id, causal_id) FROM stdin;
\.


--
-- TOC entry 4238 (class 0 OID 24533)
-- Dependencies: 291
-- Data for Name: suspensiones; Type: TABLE DATA; Schema: gestion; Owner: ceish_user
--

COPY gestion.suspensiones (id, protocolo_id, tipo, motivo, fecha, informe_motivacion, fecha_notificacion_investigador, plazo_justificacion_dias, fecha_limite_justificacion, justificacion_recibida, fecha_justificacion, justificacion_aceptada, notificado_dis, notificado_arcsa, creado_por) FROM stdin;
\.


--
-- TOC entry 4260 (class 0 OID 24740)
-- Dependencies: 313
-- Data for Name: analisis_documentos; Type: TABLE DATA; Schema: ml_features; Owner: ceish_user
--

COPY ml_features.analisis_documentos (id, documento_id, tipo_documento, texto_extraido, secciones_encontradas, errores_detectados, recomendaciones, puntaje_calidad, fecha_analisis, version_modelo) FROM stdin;
\.


--
-- TOC entry 4262 (class 0 OID 24757)
-- Dependencies: 315
-- Data for Name: balanceo_evaluadores; Type: TABLE DATA; Schema: ml_features; Owner: ceish_user
--

COPY ml_features.balanceo_evaluadores (id, fecha_calculo, evaluador_id, carga_actual, carga_promedio, desviacion, sugerido_para_asignar, factores_considerados, creado_en) FROM stdin;
\.


--
-- TOC entry 4266 (class 0 OID 24792)
-- Dependencies: 319
-- Data for Name: chatbot_conversaciones; Type: TABLE DATA; Schema: ml_features; Owner: ceish_user
--

COPY ml_features.chatbot_conversaciones (id, usuario_id, pregunta, respuesta, fuentes_consultadas, confianza_respuesta, feedback_util, fecha_conversacion) FROM stdin;
\.


--
-- TOC entry 4258 (class 0 OID 24726)
-- Dependencies: 311
-- Data for Name: configuracion_ml; Type: TABLE DATA; Schema: ml_features; Owner: ceish_user
--

COPY ml_features.configuracion_ml (clave, valor, descripcion, actualizado_por, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 4257 (class 0 OID 24712)
-- Dependencies: 310
-- Data for Name: modelos_versiones; Type: TABLE DATA; Schema: ml_features; Owner: ceish_user
--

COPY ml_features.modelos_versiones (id, nombre_modelo, version, metricas_evaluacion, fecha_entrenamiento, ruta_archivo, activo, creado_por) FROM stdin;
\.


--
-- TOC entry 4264 (class 0 OID 24772)
-- Dependencies: 317
-- Data for Name: prediccion_incumplimientos; Type: TABLE DATA; Schema: ml_features; Owner: ceish_user
--

COPY ml_features.prediccion_incumplimientos (id, protocolo_id, seguimiento_id, probabilidad_incumplimiento, factores_riesgo, fecha_prediccion, modelo_version, accion_recomendada) FROM stdin;
\.


--
-- TOC entry 4255 (class 0 OID 24697)
-- Dependencies: 308
-- Data for Name: predicciones_log; Type: TABLE DATA; Schema: ml_features; Owner: ceish_user
--

COPY ml_features.predicciones_log (id, protocolo_id, tipo_prediccion, entrada_json, salida_json, modelo_version, tiempo_procesamiento_ms, confidence_score, fecha_prediccion) FROM stdin;
\.


--
-- TOC entry 4253 (class 0 OID 24680)
-- Dependencies: 306
-- Data for Name: protocolo_features; Type: TABLE DATA; Schema: ml_features; Owner: ceish_user
--

COPY ml_features.protocolo_features (id, protocolo_id, texto, longitud, riesgo, confianza, palabras_clave, secciones_detectadas, factores_riesgo, fecha_extraccion, version_modelo) FROM stdin;
\.


--
-- TOC entry 4268 (class 0 OID 24807)
-- Dependencies: 321
-- Data for Name: reportes_msp; Type: TABLE DATA; Schema: ml_features; Owner: ceish_user
--

COPY ml_features.reportes_msp (id, tipo_reporte, periodo_desde, periodo_hasta, datos_json, archivo_generado, fecha_generacion, generado_por) FROM stdin;
\.


--
-- TOC entry 4277 (class 0 OID 45065)
-- Dependencies: 330
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: ceish_user
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1777833911802	FixReceptionData1777833911802
2	1714752000000	AddEmailVerificationAndResetFields1714752000000
3	1714852000000	SeparateInvestigatorProfile1714852000000
4	1714853000000	ExpandInvestigatorProfile1714853000000
5	1714854000000	RemovePhotoPathFromInvestigatorProfile1714854000000
9	1778055836405	ProtocolsCoreRefactor1778055836405
10	1778055855774	CeishCodeAutomation1778055855774
11	1778055894119	PrincipalInvestigatorSourceRefactor1778055894119
12	1778055910089	DocumentTableUnification1778055910089
13	1778063185040	EvaluationAssignmentFlowRefactor1778063185040
14	1778535605589	AddSystemCodesToCatalogos1778535605589
15	1778536000000	HierarchicalPermissionsRefactor1778536000000
16	1778537000000	FinalMenuStructureAlignment1778537000000
17	1778538000000	AddIndigenousPopulationFlag1778538000000
18	1778539000000	SeedEvaluatorProfilesPET511778539000000
19	1778784132273	NormalizeEvaluatorProfileNames1778784132273
20	1778800000000	SeedTiposDocumento1778800000000
21	1778810000000	RefactorTipoDocumentoRelational1778810000000
22	1778820000000	FixDocumentDataAndNames1778820000000
23	1778830000000	FinalSanityCheckDocuments1778830000000
24	1778840000000	AggressiveFixDocumentCodes1778840000000
25	1778850000000	ForceDocumentCodesById1778850000000
26	1778860000000	NormalizeValidationHistory1778860000000
27	1778870000000	FixAllDocumentCodes1778870000000
28	1778900000000	SeedEstadosCatalog1778900000000
29	1778910000000	DropPublicDocumentosTable1778910000000
30	1778920000000	EnsureEvaluatorProfileFKAndSeeds1778920000000
31	1778930000000	ConsolidateDatabaseStructure1778930000000
32	1779000000000	AddPeerRiskEvaluation1779000000000
33	1780000000000	SeedRealEvaluators1780000000000
34	1781000000000	DatabaseNormalizationOptionA1781000000000
35	1782000000000	RemoveRedundantVersionColumn1782000000000
36	1783000000000	DatabaseNormalizationOptionAVersions1783000000000
37	1784000000000	RemovePrincipalInvestigatorRecordLink1784000000000
38	1785000000000	AddReportPathToAssignments1785000000000
39	1786000000000	DatabaseRefactoringAndNormalizations1786000000000
\.


--
-- TOC entry 4270 (class 0 OID 44928)
-- Dependencies: 323
-- Data for Name: protocolo_instituciones; Type: TABLE DATA; Schema: public; Owner: ceish_user
--

COPY public.protocolo_instituciones (id, creado_en, actualizado_en, eliminado_en, nombre, tipo, direccion, persona_contacto, email_contacto, telefono_contacto, tiene_carta_interes, protocolo_id) FROM stdin;
1	2026-05-06 11:55:08.114402	2026-05-06 11:55:08.114402	\N	zxczdfsdfsdf	PUBLIC	sdfsdfsdfs	sdfsdfasdfa	\N	\N	f	3
2	2026-05-06 12:00:55.322289	2026-05-06 12:00:55.322289	\N	ghjfghjh	PUBLIC	gfjhjfg	jfghjfghj	\N	\N	f	4
3	2026-05-06 12:02:16.248247	2026-05-06 12:02:16.248247	\N	ghjfghjh	PUBLIC	gfjhjfg	jfghjfghj	\N	\N	f	5
4	2026-05-06 12:12:45.108597	2026-05-06 12:12:45.108597	\N	fdfgdgsdfg	PUBLIC	dsfgsdfg	dsfgsdg	\N	\N	f	6
5	2026-05-06 12:31:59.474612	2026-05-06 12:31:59.474612	\N	hkgyukgyu	PUBLIC	kyukytu	ytukytku	\N	\N	f	7
6	2026-05-06 12:40:09.337039	2026-05-06 12:40:09.337039	\N	xcvxcvxvc	PUBLIC	xcvxcvxcv	xcvxcvxcv	\N	\N	f	8
7	2026-05-06 12:47:03.335427	2026-05-06 12:47:03.335427	\N	zxczdfsdf	PUBLIC	dsfdsf	dsfds	\N	\N	f	9
8	2026-05-06 13:13:32.030034	2026-05-06 13:13:32.030034	\N	fgdfgdfgdfg	PUBLIC	dfdfsgfgd	dfgdfgdfgdf	\N	\N	f	10
9	2026-05-13 03:49:03.56273	2026-05-13 03:49:03.56273	\N	fghfghg	PRIVATE	657567	657567	\N	\N	f	11
10	2026-05-13 14:12:48.218769	2026-05-13 14:12:48.218769	\N	p{ñ{lñ{	PUBLIC	lñ{lñ{	lñ{lñ{ñl	\N	\N	f	12
11	2026-05-15 05:53:41.815441	2026-05-15 05:53:41.815441	\N	sadasdasdasdasd	PUBLIC	sadasdsad	asdasdasd	\N	\N	f	13
12	2026-05-15 09:03:27.004278	2026-05-15 09:03:27.004278	\N	errrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr	PUBLIC	retertretert	ertertertert	\N	\N	f	14
13	2026-05-15 09:14:58.307972	2026-05-15 09:14:58.307972	\N	dfgdfgdf	PUBLIC	dfgdfg	fdgdfg	\N	\N	f	15
14	2026-05-15 09:28:14.64166	2026-05-15 09:28:14.64166	\N	tttttttttttttttttttttttt	PUBLIC	erterrrrrrrrrrrrrrrr	rerrrrrrrrrrrrrrrr	\N	\N	f	16
15	2026-05-15 09:38:19.560421	2026-05-15 09:38:19.560421	\N	gfhfffff	PUBLIC	rttrttt	rtyrtyt	\N	\N	f	17
16	2026-05-15 10:17:32.907358	2026-05-15 10:17:32.907358	\N	dffffff	PUBLIC	fdddddddddd	fddddddddd	\N	\N	f	18
17	2026-05-15 10:27:31.106028	2026-05-15 10:27:31.106028	\N	fffffffffffffffffff	PRIVATE	dddddddddddd	ddddddddddddd	\N	\N	f	19
18	2026-05-15 10:43:55.013016	2026-05-15 10:43:55.013016	\N	rrrrrrrrrrrrrrrrrrrrrrrrr	PUBLIC	rrrrrrrrrrrrrrrr	rrrrrrrrrrrrr	\N	\N	f	20
19	2026-05-15 10:52:12.777915	2026-05-15 10:52:12.777915	\N	777777777	PRIVATE	uuuuuuuuuuuuuuu	uuuuuuuuuuuuuuuu	\N	\N	f	21
20	2026-05-15 11:29:02.757937	2026-05-15 11:29:02.757937	\N	ccccccccc	PUBLIC	ccccccccccc	ccccccccccc	\N	\N	f	22
21	2026-05-15 11:37:09.534864	2026-05-15 11:37:09.534864	\N	rrrrrrrrrrr	PUBLIC	rrrrrrrrrrrr	rrrrrrrrrrrr	\N	\N	f	23
22	2026-05-15 11:38:57.706243	2026-05-15 11:38:57.706243	\N	rrrrrrrrrrr	PUBLIC	rrrrrrrrrrrr	rrrrrrrrrrrr	\N	\N	f	24
23	2026-05-15 11:40:10.820459	2026-05-15 11:40:10.820459	\N	ssssssssssssssss	PUBLIC	ssssssssssss	sssssssssssssssss	\N	\N	f	25
24	2026-05-16 02:11:39.115591	2026-05-16 02:11:39.115591	\N	fffffffffff	PUBLIC	dddddddddddddd	dfffffffffff	\N	\N	f	26
25	2026-05-16 02:17:55.248674	2026-05-16 02:17:55.248674	\N	dddddddddddd	PRIVATE	ddddddd	ddddddddd	\N	\N	f	27
26	2026-05-16 02:19:07.243826	2026-05-16 02:19:07.243826	\N	dddddddddddd	PRIVATE	ddddddd	ddddddddd	\N	\N	f	28
27	2026-05-16 02:23:40.921882	2026-05-16 02:23:40.921882	\N	jjjjjjjjjjj	PUBLIC	jjjjjjjjjjjjjg	ggggggggggg	\N	\N	f	29
28	2026-05-16 07:08:06.479889	2026-05-16 07:08:06.479889	\N	4444444444f	PUBLIC	fffffffffffffffff	fffffffffffffffffffff	\N	\N	f	30
29	2026-05-16 07:30:42.634216	2026-05-16 07:30:42.634216	\N	ddddddddddddd	PUBLIC	ddddddddddddddddddddddddd	dddddddddddddddddddd	\N	\N	f	31
30	2026-05-16 07:38:16.476088	2026-05-16 07:38:16.476088	\N	ddddddddddddd	PUBLIC	ddddddddddddddddddddddddd	dddddddddddddddddddd	\N	\N	f	32
31	2026-05-16 08:15:54.301561	2026-05-16 08:15:54.301561	\N	dddddddddddddddddd	PUBLIC	ddddddddddddd	ddddddddddddddd	\N	\N	f	33
64	2026-05-16 19:33:56.618401	2026-05-16 19:33:56.618401	\N	hhhhhhhhhhhhhhhhhhhhhh	PUBLIC	ddddddddddddddddddd	dddddddddddddddddddd	\N	\N	f	66
65	2026-05-16 19:34:35.741902	2026-05-16 19:34:35.741902	\N	hhhhhhhhhhhhhhhhhhhhhh	PUBLIC	ddddddddddddddddddd	dddddddddddddddddddd	\N	\N	f	67
66	2026-05-16 19:41:07.291559	2026-05-16 19:41:07.291559	\N	hhhhhhhhhhhhhhhhhhhhhh	PUBLIC	ddddddddddddddddddd	dddddddddddddddddddd	\N	\N	f	68
67	2026-05-17 06:04:23.216192	2026-05-17 06:04:23.216192	\N	22222222222222	PUBLIC	2222222222222	dddddddddddddddd	\N	\N	f	69
68	2026-05-17 06:24:21.048081	2026-05-17 06:24:21.048081	\N	dddddddddddddddd	PUBLIC	dddddddddddddddddd	dddddddddddddddd	\N	\N	f	70
69	2026-05-17 06:27:10.918514	2026-05-17 06:27:10.918514	\N	dddddddddddddddd	PUBLIC	dddddddddddddddddd	dddddddddddddddd	\N	\N	f	71
70	2026-05-17 06:27:45.134237	2026-05-17 06:27:45.134237	\N	dddddddddddddddd	PUBLIC	dddddddddddddddddd	dddddddddddddddd	\N	\N	f	72
71	2026-05-17 06:35:20.347818	2026-05-17 06:35:20.347818	\N	ddddddddddd	PUBLIC	ddddddddddddddd	ddddddddddddddddd	\N	\N	f	73
72	2026-05-17 06:35:56.891176	2026-05-17 06:35:56.891176	\N	ddddddddddd	PUBLIC	ddddddddddddddd	ddddddddddddddddd	\N	\N	f	74
73	2026-05-17 15:05:52.668568	2026-05-17 15:05:52.668568	\N	333333333333333	PUBLIC	44444444444444444	rrrrrrrrrrrrrrrrrrrrrrrr	\N	\N	f	75
74	2026-05-17 15:06:44.895834	2026-05-17 15:06:44.895834	\N	333333333333333	PUBLIC	44444444444444444	rrrrrrrrrrrrrrrrrrrrrrrr	\N	\N	f	76
75	2026-05-17 15:08:29.259095	2026-05-17 15:08:29.259095	\N	ffffffffffffffffff	PUBLIC	fffffffffffffffffffffff	fffffffffffffffffffffffffff	\N	\N	f	77
76	2026-05-17 15:13:47.047249	2026-05-17 15:13:47.047249	\N	ccccccccccccccccccccccccccccccccccc	PUBLIC	ccccccccccccccccccccccccccccccccccccc	ccccccccccccccccccccccccccccccccccc	\N	\N	f	78
77	2026-05-17 16:02:02.901517	2026-05-17 16:02:02.901517	\N	ijjjjjjjjjjjjjjjjjjjjjj	PUBLIC	mmmmmmmmmmmmmmmmm	kkkkkkkkkkkkkkk	\N	\N	f	79
78	2026-05-17 17:09:42.036272	2026-05-17 17:09:42.036272	\N	ggggggggggggggggg	PUBLIC	gggggggggggggggggggg	ggggggggggggggggggggggggg	\N	\N	f	80
79	2026-05-17 17:36:51.246052	2026-05-17 17:36:51.246052	\N	kkkkkkkkkkkkkkkkk	PUBLIC	jjjjjjjjjjjjjjjjjjjjjjjjjjjjj	llllllllllllllllllllllllllllllll	\N	\N	f	81
80	2026-05-17 17:48:52.873746	2026-05-17 17:48:52.873746	\N	ggggggggggggggggggg	PUBLIC	ggggggggggg	gggggggggggggggg	\N	\N	f	82
81	2026-05-17 18:02:31.65987	2026-05-17 18:02:31.65987	\N	hhhhhhhhhhhhhhh	PUBLIC	yyyyyyyyyyyy	yyyyyyyyyyyyy	\N	\N	f	83
82	2026-05-18 15:17:17.458441	2026-05-18 15:17:17.458441	\N	rrrrrrrrrrrrrrrrrrr	PUBLIC	rrrrrrrrrrrrrrrrrrrrrrrrr	rrrrrrrrrrrrrrrrrrrrrr	\N	\N	f	84
83	2026-05-18 15:26:50.249811	2026-05-18 15:26:50.249811	\N	tttttttttttttttttt	PUBLIC	tttttttttttttttttt	tttttttttttttttttttttt	\N	\N	f	85
84	2026-05-18 18:44:01.214756	2026-05-18 18:44:01.214756	\N	iiiiiiiiiiiiii	PUBLIC	yyyyyyyyyyyyyyyyyyy	iiiiiiiiiiiiiiiiiiiiiiiiiiiiii	\N	\N	f	86
85	2026-05-18 18:52:42.94594	2026-05-18 18:52:42.94594	\N	jjjjjjjjjjjjjjjjjjjjjj	PUBLIC	kkkkkkkkkkkkkkkkk	kkkkkkkkkkkkkkkkkk	\N	\N	f	87
86	2026-05-18 19:02:52.423811	2026-05-18 19:02:52.423811	\N	ñlllllllllllllllllll	PUBLIC	hhhhhhhhhhhhhhh	hhhhhhhhhhhhhhhhhhhh	\N	\N	f	88
87	2026-05-18 19:16:47.420259	2026-05-18 19:16:47.420259	\N	ggggggggggggggggg	PRIVATE	ggggggggggggggg	gggggggggggggggggggg	\N	\N	f	89
88	2026-05-18 19:39:15.628504	2026-05-18 19:39:15.628504	\N	rrrrrrrrrrrrrrrrrrrrrrrrrr	PUBLIC	rrrrrrrrrrrrrrrrrrrr	rrrrrrrrrrrrrrrrr	\N	\N	f	90
89	2026-05-18 19:47:28.595953	2026-05-18 19:47:28.595953	\N	4444444444444444	PUBLIC	rrrrrrrrrrrrrr	rrrrrrrrrrrrrr	\N	\N	f	91
90	2026-05-18 20:14:40.615333	2026-05-18 20:14:40.615333	\N	77777777777777	PUBLIC	6666666	6666666666	\N	\N	f	92
91	2026-05-18 20:37:36.125225	2026-05-18 20:37:36.125225	\N	oooooooooooooo	PUBLIC	pppppppppppppp	oooooooo	\N	\N	f	93
92	2026-05-18 21:00:43.30585	2026-05-18 21:00:43.30585	\N	gggggggggggggggg	PUBLIC	ggggggggggggggg	gggggggggggggggg	\N	\N	f	94
93	2026-05-18 21:07:11.240697	2026-05-18 21:07:11.240697	\N	yyyyyyyyyyyyy	PUBLIC	yyyyyyyyyyyyyy	yyyyyyyyyyy	\N	\N	f	95
94	2026-05-18 21:23:14.751586	2026-05-18 21:23:14.751586	\N	rrrrrrrrrrrrr	PUBLIC	rrrrrrrrrrrr	fffffffff	\N	\N	f	96
95	2026-05-18 22:29:30.311268	2026-05-18 22:29:30.311268	\N	jjjjjjjjjjjjjjjjj	PUBLIC	jjjjjjjjjjjjjjj	jjjjjjjjjjjjjjj	\N	\N	f	97
96	2026-05-18 22:39:36.701099	2026-05-18 22:39:36.701099	\N	jjjjjjjjjjjjjjjjj	PUBLIC	jjjjjjjjjjjjjjj	jjjjjjjjjjjjjjj	\N	\N	f	98
97	2026-05-18 22:49:03.089687	2026-05-18 22:49:03.089687	\N	iiiiiiiii	PUBLIC	iiiiiiiii	iiiiiiiiiiii	\N	\N	f	99
98	2026-05-18 22:57:15.562296	2026-05-18 22:57:15.562296	\N	yyyyyyyyyyyyyy	PUBLIC	yyyyyyyyyyyyy	yyyyyyyyyyyyy	\N	\N	f	100
99	2026-05-18 23:07:26.712009	2026-05-18 23:07:26.712009	\N	tttttttttttt	PUBLIC	tttttttttttt	tttttttttttt	\N	\N	f	101
100	2026-05-19 08:42:31.636412	2026-05-19 08:42:31.636412	\N	bryuyrn	PRIVATE	tervwcbuihctrv	hjvjghvhjvjh	\N	\N	f	102
101	2026-05-19 09:01:44.279714	2026-05-19 09:01:44.279714	\N	rgftgbgfb	PUBLIC	onrevrttvvr	rvgfvrjnjrenvornvor	\N	\N	f	103
102	2026-05-22 09:11:21.506424	2026-05-22 09:11:21.506424	\N	rrrrrrrrrrrrrrrrrrrrrrr	PUBLIC	ffffffffffffffff	ffffffffffffffffffffff	\N	\N	f	104
103	2026-05-22 09:13:22.896012	2026-05-22 09:13:22.896012	\N	eeeeeeeeeeeee	PUBLIC	eeeeeeeeeeeeeeee	eeeeeeeeeeeeee	\N	\N	f	105
104	2026-05-22 09:42:23.573019	2026-05-22 09:42:23.573019	\N	ddddddddddddddddddddd	PUBLIC	dddddddddddddddd	dddddddddddddd	\N	\N	f	106
105	2026-05-22 09:58:19.071167	2026-05-22 09:58:19.071167	\N	eeeeeeeeeeeeeeeeee	PUBLIC	dddddddddddd	dddddddddd	\N	\N	f	107
106	2026-05-22 10:13:45.722895	2026-05-22 10:13:45.722895	\N	rrrrrrrrrrrrrrrrrr	PUBLIC	rrrrrrrrrrrrrrrrr	rrrrrrrrrrrrrrrrrr	\N	\N	f	108
107	2026-05-23 19:18:00.422322	2026-05-23 19:18:00.422322	\N	fggggggggggggggggggggggggggggg	PUBLIC	gggggggggggggggggggggggggg	gggggggggggggggggggggggggggggggg	\N	\N	f	109
108	2026-05-23 19:44:27.258202	2026-05-23 19:44:27.258202	\N	dddddddddddddd	PUBLIC	ddddddddddddddddddddd	ddddddddddddddd	\N	\N	f	110
109	2026-05-26 19:25:22.116988	2026-05-26 19:25:22.116988	\N	dddddddddddddddddddddddddddddddddddd	PUBLIC	dddddddddddddddd	fffffffffffffffffffff	\N	\N	f	111
110	2026-05-26 20:08:11.978388	2026-05-26 20:08:11.978388	\N	holaaaaaaaaaaaaaaaaaaaaaaa	PUBLIC	holaaaaaaaaaaaaaaaa	holaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa	\N	\N	f	112
111	2026-05-26 20:31:28.957008	2026-05-26 20:31:28.957008	\N	4555555555555555555	PRIVATE	yyyyyyyyyyyyyyy	yyyyyyyyyyyyyyyyyyyy	\N	\N	f	113
\.


--
-- TOC entry 4274 (class 0 OID 44968)
-- Dependencies: 327
-- Data for Name: protocolo_investigadores; Type: TABLE DATA; Schema: public; Owner: ceish_user
--

COPY public.protocolo_investigadores (id, creado_en, actualizado_en, eliminado_en, nombre_completo, identificacion, cargo, institucion, email, telefono, formacion_academica, rol, protocolo_id, usuario_id) FROM stdin;
1	2026-05-06 11:55:07.978433	2026-05-06 11:55:07.978433	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	3	28
2	2026-05-06 12:00:55.298529	2026-05-06 12:00:55.298529	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	4	28
3	2026-05-06 12:02:16.224947	2026-05-06 12:02:16.224947	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	5	28
4	2026-05-06 12:12:45.083824	2026-05-06 12:12:45.083824	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	6	28
5	2026-05-06 12:31:59.456	2026-05-06 12:31:59.456	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	7	28
6	2026-05-06 12:40:09.313884	2026-05-06 12:40:09.313884	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	8	28
7	2026-05-06 12:47:03.280758	2026-05-06 12:47:03.280758	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	9	28
8	2026-05-06 13:13:32.011841	2026-05-06 13:13:32.011841	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	10	28
9	2026-05-13 03:49:03.446251	2026-05-13 03:49:03.446251	\N	Test Investigador	9999999991	Investigador	ESPOCH	investigador@test.com		Información en perfil	PRINCIPAL	11	29
10	2026-05-13 14:12:48.109998	2026-05-13 14:12:48.109998	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	12	28
11	2026-05-15 05:53:41.785585	2026-05-15 05:53:41.785585	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	13	28
12	2026-05-15 09:03:26.972101	2026-05-15 09:03:26.972101	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	14	28
13	2026-05-15 09:14:58.286417	2026-05-15 09:14:58.286417	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	15	28
14	2026-05-15 09:28:14.613706	2026-05-15 09:28:14.613706	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	16	28
15	2026-05-15 09:38:19.538393	2026-05-15 09:38:19.538393	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	17	28
16	2026-05-15 10:17:32.881477	2026-05-15 10:17:32.881477	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	18	28
17	2026-05-15 10:27:31.084358	2026-05-15 10:27:31.084358	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	19	28
18	2026-05-15 10:43:54.994166	2026-05-15 10:43:54.994166	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	20	28
19	2026-05-15 10:52:12.757935	2026-05-15 10:52:12.757935	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	21	28
20	2026-05-15 11:29:02.728365	2026-05-15 11:29:02.728365	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	22	28
21	2026-05-15 11:37:09.444546	2026-05-15 11:37:09.444546	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	23	28
22	2026-05-15 11:38:57.687062	2026-05-15 11:38:57.687062	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	24	28
23	2026-05-15 11:40:10.801309	2026-05-15 11:40:10.801309	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	25	28
24	2026-05-16 02:11:38.8595	2026-05-16 02:11:38.8595	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	26	28
25	2026-05-16 02:17:55.210297	2026-05-16 02:17:55.210297	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	27	28
26	2026-05-16 02:19:07.226905	2026-05-16 02:19:07.226905	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	28	28
27	2026-05-16 02:23:40.88354	2026-05-16 02:23:40.88354	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	29	28
28	2026-05-16 07:08:06.356255	2026-05-16 07:08:06.356255	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	30	28
29	2026-05-16 07:30:42.61331	2026-05-16 07:30:42.61331	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	31	28
30	2026-05-16 07:38:16.45714	2026-05-16 07:38:16.45714	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	32	28
31	2026-05-16 08:15:54.180739	2026-05-16 08:15:54.180739	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	33	28
64	2026-05-16 19:33:56.594359	2026-05-16 19:33:56.594359	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	66	28
65	2026-05-16 19:34:35.724717	2026-05-16 19:34:35.724717	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	67	28
66	2026-05-16 19:41:07.274439	2026-05-16 19:41:07.274439	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	68	28
67	2026-05-17 06:04:23.189775	2026-05-17 06:04:23.189775	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	69	28
68	2026-05-17 06:24:21.027625	2026-05-17 06:24:21.027625	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	70	28
69	2026-05-17 06:27:10.901743	2026-05-17 06:27:10.901743	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	71	28
70	2026-05-17 06:27:45.119179	2026-05-17 06:27:45.119179	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	72	28
71	2026-05-17 06:35:20.33042	2026-05-17 06:35:20.33042	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	73	28
72	2026-05-17 06:35:56.866429	2026-05-17 06:35:56.866429	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	74	28
73	2026-05-17 15:05:52.647215	2026-05-17 15:05:52.647215	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	75	28
74	2026-05-17 15:06:44.879655	2026-05-17 15:06:44.879655	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	76	28
75	2026-05-17 15:08:29.241679	2026-05-17 15:08:29.241679	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	77	28
76	2026-05-17 15:13:47.028875	2026-05-17 15:13:47.028875	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	78	28
77	2026-05-17 16:02:02.876537	2026-05-17 16:02:02.876537	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	79	28
78	2026-05-17 17:09:42.017197	2026-05-17 17:09:42.017197	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	80	28
79	2026-05-17 17:36:51.227811	2026-05-17 17:36:51.227811	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	81	28
80	2026-05-17 17:48:52.850603	2026-05-17 17:48:52.850603	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	82	28
81	2026-05-17 18:02:31.642136	2026-05-17 18:02:31.642136	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	83	28
82	2026-05-18 15:17:17.434523	2026-05-18 15:17:17.434523	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	84	28
83	2026-05-18 15:26:50.234668	2026-05-18 15:26:50.234668	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	85	28
84	2026-05-18 18:44:01.196114	2026-05-18 18:44:01.196114	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	86	28
85	2026-05-18 18:52:42.928836	2026-05-18 18:52:42.928836	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	87	28
86	2026-05-18 19:02:52.411617	2026-05-18 19:02:52.411617	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	88	28
87	2026-05-18 19:16:47.40549	2026-05-18 19:16:47.40549	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	89	28
88	2026-05-18 19:39:15.616086	2026-05-18 19:39:15.616086	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	90	28
89	2026-05-18 19:47:28.583204	2026-05-18 19:47:28.583204	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	91	28
90	2026-05-18 20:14:40.598963	2026-05-18 20:14:40.598963	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	92	28
91	2026-05-18 20:37:36.112174	2026-05-18 20:37:36.112174	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	93	28
92	2026-05-18 21:00:43.290393	2026-05-18 21:00:43.290393	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	94	28
93	2026-05-18 21:07:11.212348	2026-05-18 21:07:11.212348	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	95	28
94	2026-05-18 21:23:14.736004	2026-05-18 21:23:14.736004	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	96	28
95	2026-05-18 22:29:30.285286	2026-05-18 22:29:30.285286	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	97	28
96	2026-05-18 22:39:36.680665	2026-05-18 22:39:36.680665	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	98	28
97	2026-05-18 22:49:03.073176	2026-05-18 22:49:03.073176	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	99	28
98	2026-05-18 22:57:15.545366	2026-05-18 22:57:15.545366	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	100	28
99	2026-05-18 23:07:26.699154	2026-05-18 23:07:26.699154	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	101	28
100	2026-05-19 08:42:31.378378	2026-05-19 08:42:31.378378	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	102	28
101	2026-05-19 09:01:44.255627	2026-05-19 09:01:44.255627	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	103	28
102	2026-05-22 09:11:21.050281	2026-05-22 09:11:21.050281	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	104	28
103	2026-05-22 09:13:22.856655	2026-05-22 09:13:22.856655	\N	Test Investigador	9999999991	Investigador	ESPOCH	investigador@test.com		Información en perfil	PRINCIPAL	105	29
104	2026-05-22 09:42:23.556684	2026-05-22 09:42:23.556684	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	106	28
105	2026-05-22 09:58:19.0533	2026-05-22 09:58:19.0533	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	107	28
106	2026-05-22 10:13:45.705771	2026-05-22 10:13:45.705771	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	108	28
107	2026-05-23 19:18:00.399762	2026-05-23 19:18:00.399762	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	109	28
108	2026-05-23 19:44:27.232005	2026-05-23 19:44:27.232005	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	110	28
109	2026-05-26 19:25:22.06481	2026-05-26 19:25:22.06481	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	111	28
110	2026-05-26 20:08:11.942807	2026-05-26 20:08:11.942807	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	112	28
111	2026-05-26 20:31:28.923015	2026-05-26 20:31:28.923015	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	113	28
112	2026-05-26 21:15:43.311739	2026-05-26 21:15:43.311739	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	114	28
113	2026-05-26 21:22:47.616498	2026-05-26 21:22:47.616498	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	115	34
114	2026-05-26 21:45:06.248683	2026-05-26 21:45:06.248683	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	116	28
115	2026-05-26 21:59:12.357338	2026-05-26 21:59:12.357338	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	117	28
116	2026-05-27 07:20:58.552564	2026-05-27 07:20:58.552564	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	118	28
117	2026-05-27 13:46:41.378669	2026-05-27 13:46:41.378669	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	119	34
118	2026-05-27 14:14:13.303164	2026-05-27 14:14:13.303164	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	120	34
119	2026-05-27 14:52:05.144874	2026-05-27 14:52:05.144874	\N	wdsd asd asd asdasd	1850867399	Investigador	ESPOCH	kevinquilligana309@gmail.com	0923424234	Información en perfil	PRINCIPAL	121	28
120	2026-05-28 16:23:57.815786	2026-05-28 16:23:57.815786	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	122	34
121	2026-05-28 16:27:48.350052	2026-05-28 16:27:48.350052	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	123	34
122	2026-05-28 16:31:47.564894	2026-05-28 16:31:47.564894	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	124	34
123	2026-05-28 20:24:14.062738	2026-05-28 20:24:14.062738	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	125	34
124	2026-05-28 20:28:07.197529	2026-05-28 20:28:07.197529	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	126	34
125	2026-05-28 20:57:51.181957	2026-05-28 20:57:51.181957	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	127	34
126	2026-06-07 19:45:27.579601	2026-06-07 19:45:27.579601	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	128	34
127	2026-06-07 19:47:48.86819	2026-06-07 19:47:48.86819	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	129	34
128	2026-06-07 19:53:22.707169	2026-06-07 19:53:22.707169	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	130	34
129	2026-06-07 19:58:03.849466	2026-06-07 19:58:03.849466	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	131	34
130	2026-06-07 20:12:27.55296	2026-06-07 20:12:27.55296	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	132	34
131	2026-06-07 20:16:43.352628	2026-06-07 20:16:43.352628	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	133	34
132	2026-06-07 20:37:45.178933	2026-06-07 20:37:45.178933	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	134	34
133	2026-06-07 20:41:08.437217	2026-06-07 20:41:08.437217	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	135	34
134	2026-06-08 03:38:36.17404	2026-06-08 03:38:36.17404	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	136	34
135	2026-06-08 03:46:24.387943	2026-06-08 03:46:24.387943	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	137	34
136	2026-06-08 04:11:51.049379	2026-06-08 04:11:51.049379	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	138	34
137	2026-06-08 04:34:56.676825	2026-06-08 04:34:56.676825	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	139	34
138	2026-06-08 05:20:43.908953	2026-06-08 05:20:43.908953	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	140	34
139	2026-06-08 05:38:42.40881	2026-06-08 05:38:42.40881	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	141	34
140	2026-06-08 05:45:40.985268	2026-06-08 05:45:40.985268	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	142	34
141	2026-06-08 05:49:22.382164	2026-06-08 05:49:22.382164	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	143	34
142	2026-06-08 05:56:37.011451	2026-06-08 05:56:37.011451	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	144	34
143	2026-06-08 06:04:58.857924	2026-06-08 06:04:58.857924	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	145	34
144	2026-06-08 06:13:35.694392	2026-06-08 06:13:35.694392	\N	liliana  berzabet paguay carrillo	0606097335	Investigador	ESPOCH	lilianapaguay15@gmail.com	0986491708	Información en perfil	PRINCIPAL	146	34
\.


--
-- TOC entry 4272 (class 0 OID 44948)
-- Dependencies: 325
-- Data for Name: protocolo_requisitos; Type: TABLE DATA; Schema: public; Owner: ceish_user
--

COPY public.protocolo_requisitos (id, creado_en, actualizado_en, eliminado_en, codigo_requisito, nombre_requisito, estado, numero_paginas, observaciones, protocolo_id) FROM stdin;
1	2026-05-06 11:55:08.20947	2026-05-06 11:55:08.20947	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	3
2	2026-05-06 11:55:08.20947	2026-05-06 11:55:08.20947	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	3
3	2026-05-06 11:55:08.20947	2026-05-06 11:55:08.20947	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	3
4	2026-05-06 11:55:08.20947	2026-05-06 11:55:08.20947	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	3
5	2026-05-06 11:55:08.20947	2026-05-06 11:55:08.20947	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	3
6	2026-05-06 11:55:08.20947	2026-05-06 11:55:08.20947	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	3
7	2026-05-06 11:55:08.20947	2026-05-06 11:55:08.20947	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	3
8	2026-05-06 12:00:55.341195	2026-05-06 12:00:55.341195	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	4
9	2026-05-06 12:00:55.341195	2026-05-06 12:00:55.341195	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	4
10	2026-05-06 12:00:55.341195	2026-05-06 12:00:55.341195	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	4
11	2026-05-06 12:00:55.341195	2026-05-06 12:00:55.341195	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	4
12	2026-05-06 12:00:55.341195	2026-05-06 12:00:55.341195	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	4
13	2026-05-06 12:00:55.341195	2026-05-06 12:00:55.341195	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	4
14	2026-05-06 12:00:55.341195	2026-05-06 12:00:55.341195	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	4
15	2026-05-06 12:00:55.341195	2026-05-06 12:00:55.341195	\N	CARTA_INTERES	Carta de Interés Institucional	NO_PRESENTADO	0	\N	4
16	2026-05-06 12:02:16.259435	2026-05-06 12:02:16.259435	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	5
17	2026-05-06 12:02:16.259435	2026-05-06 12:02:16.259435	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	5
18	2026-05-06 12:02:16.259435	2026-05-06 12:02:16.259435	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	5
19	2026-05-06 12:02:16.259435	2026-05-06 12:02:16.259435	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	5
20	2026-05-06 12:02:16.259435	2026-05-06 12:02:16.259435	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	5
21	2026-05-06 12:02:16.259435	2026-05-06 12:02:16.259435	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	5
22	2026-05-06 12:02:16.259435	2026-05-06 12:02:16.259435	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	5
23	2026-05-06 12:02:16.259435	2026-05-06 12:02:16.259435	\N	CARTA_INTERES	Carta de Interés Institucional	NO_PRESENTADO	0	\N	5
24	2026-05-06 12:02:16.259435	2026-05-06 12:02:16.259435	\N	FICHA_INTERVENCION	Ficha de Intervención	NO_PRESENTADO	0	\N	5
25	2026-05-06 12:02:16.285493	2026-05-06 12:02:16.285493	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	5
26	2026-05-06 12:02:16.285493	2026-05-06 12:02:16.285493	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	5
27	2026-05-06 12:02:16.285493	2026-05-06 12:02:16.285493	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	5
28	2026-05-06 12:02:16.285493	2026-05-06 12:02:16.285493	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	5
29	2026-05-06 12:02:16.285493	2026-05-06 12:02:16.285493	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	5
30	2026-05-06 12:02:16.285493	2026-05-06 12:02:16.285493	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	5
31	2026-05-06 12:02:16.285493	2026-05-06 12:02:16.285493	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	5
32	2026-05-06 12:02:16.285493	2026-05-06 12:02:16.285493	\N	CARTA_INTERES	Carta de Interés Institucional	NO_PRESENTADO	0	\N	5
33	2026-05-06 12:12:45.1164	2026-05-06 12:12:45.1164	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	6
34	2026-05-06 12:12:45.1164	2026-05-06 12:12:45.1164	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	6
35	2026-05-06 12:12:45.1164	2026-05-06 12:12:45.1164	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	6
36	2026-05-06 12:12:45.1164	2026-05-06 12:12:45.1164	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	6
37	2026-05-06 12:12:45.1164	2026-05-06 12:12:45.1164	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	6
38	2026-05-06 12:12:45.1164	2026-05-06 12:12:45.1164	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	6
39	2026-05-06 12:12:45.1164	2026-05-06 12:12:45.1164	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	6
40	2026-05-06 12:12:45.1164	2026-05-06 12:12:45.1164	\N	FICHA_INTERVENCION	Ficha de Intervención	NO_PRESENTADO	0	\N	6
41	2026-05-06 12:12:45.140149	2026-05-06 12:12:45.140149	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	6
42	2026-05-06 12:12:45.140149	2026-05-06 12:12:45.140149	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	6
43	2026-05-06 12:12:45.140149	2026-05-06 12:12:45.140149	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	6
44	2026-05-06 12:12:45.140149	2026-05-06 12:12:45.140149	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	6
45	2026-05-06 12:12:45.140149	2026-05-06 12:12:45.140149	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	6
46	2026-05-06 12:12:45.140149	2026-05-06 12:12:45.140149	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	6
47	2026-05-06 12:12:45.140149	2026-05-06 12:12:45.140149	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	6
48	2026-05-06 12:31:59.483559	2026-05-06 12:31:59.483559	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	7
49	2026-05-06 12:31:59.483559	2026-05-06 12:31:59.483559	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	7
50	2026-05-06 12:31:59.483559	2026-05-06 12:31:59.483559	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	7
51	2026-05-06 12:31:59.483559	2026-05-06 12:31:59.483559	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	7
52	2026-05-06 12:31:59.483559	2026-05-06 12:31:59.483559	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	7
53	2026-05-06 12:31:59.483559	2026-05-06 12:31:59.483559	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	7
54	2026-05-06 12:31:59.483559	2026-05-06 12:31:59.483559	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	7
55	2026-05-06 12:31:59.483559	2026-05-06 12:31:59.483559	\N	FICHA_INTERVENCION	Ficha de Intervención	NO_PRESENTADO	0	\N	7
56	2026-05-06 12:31:59.50473	2026-05-06 12:31:59.50473	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	7
57	2026-05-06 12:31:59.50473	2026-05-06 12:31:59.50473	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	7
58	2026-05-06 12:31:59.50473	2026-05-06 12:31:59.50473	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	7
59	2026-05-06 12:31:59.50473	2026-05-06 12:31:59.50473	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	7
60	2026-05-06 12:31:59.50473	2026-05-06 12:31:59.50473	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	7
61	2026-05-06 12:31:59.50473	2026-05-06 12:31:59.50473	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	7
62	2026-05-06 12:31:59.50473	2026-05-06 12:31:59.50473	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	7
63	2026-05-06 12:40:09.343712	2026-05-06 12:40:09.343712	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	8
64	2026-05-06 12:40:09.343712	2026-05-06 12:40:09.343712	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	8
65	2026-05-06 12:40:09.343712	2026-05-06 12:40:09.343712	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	8
66	2026-05-06 12:40:09.343712	2026-05-06 12:40:09.343712	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	8
67	2026-05-06 12:40:09.343712	2026-05-06 12:40:09.343712	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	8
68	2026-05-06 12:40:09.343712	2026-05-06 12:40:09.343712	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	8
69	2026-05-06 12:40:09.343712	2026-05-06 12:40:09.343712	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	8
70	2026-05-06 12:40:09.370087	2026-05-06 12:40:09.370087	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	8
71	2026-05-06 12:40:09.370087	2026-05-06 12:40:09.370087	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	8
72	2026-05-06 12:40:09.370087	2026-05-06 12:40:09.370087	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	8
73	2026-05-06 12:40:09.370087	2026-05-06 12:40:09.370087	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	8
74	2026-05-06 12:40:09.370087	2026-05-06 12:40:09.370087	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	8
75	2026-05-06 12:40:09.370087	2026-05-06 12:40:09.370087	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	8
76	2026-05-06 12:40:09.370087	2026-05-06 12:40:09.370087	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	8
77	2026-05-06 12:47:03.399877	2026-05-06 12:47:03.399877	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	9
78	2026-05-06 12:47:03.399877	2026-05-06 12:47:03.399877	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	9
79	2026-05-06 12:47:03.399877	2026-05-06 12:47:03.399877	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	9
80	2026-05-06 12:47:03.399877	2026-05-06 12:47:03.399877	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	9
81	2026-05-06 12:47:03.399877	2026-05-06 12:47:03.399877	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	9
82	2026-05-06 12:47:03.399877	2026-05-06 12:47:03.399877	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	9
83	2026-05-06 12:47:03.399877	2026-05-06 12:47:03.399877	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	9
84	2026-05-06 12:47:03.399877	2026-05-06 12:47:03.399877	\N	CARTA_INTERES	Carta de Interés Institucional	NO_PRESENTADO	0	\N	9
85	2026-05-06 12:47:03.399877	2026-05-06 12:47:03.399877	\N	FICHA_INTERVENCION	Ficha de Intervención	NO_PRESENTADO	0	\N	9
86	2026-05-06 12:47:03.437027	2026-05-06 12:47:03.437027	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	9
87	2026-05-06 12:47:03.437027	2026-05-06 12:47:03.437027	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	9
88	2026-05-06 12:47:03.437027	2026-05-06 12:47:03.437027	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	9
89	2026-05-06 12:47:03.437027	2026-05-06 12:47:03.437027	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	9
90	2026-05-06 12:47:03.437027	2026-05-06 12:47:03.437027	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	9
91	2026-05-06 12:47:03.437027	2026-05-06 12:47:03.437027	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	9
92	2026-05-06 12:47:03.437027	2026-05-06 12:47:03.437027	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	9
93	2026-05-06 12:47:03.437027	2026-05-06 12:47:03.437027	\N	CARTA_INTERES	Carta de Interés Institucional	NO_PRESENTADO	0	\N	9
94	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	ANEXO_6	Anexo 6: Formulario para Ensayo Clínico	NO_PRESENTADO	0	\N	10
95	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	10
96	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	10
97	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	CARTA_INTERES	Carta de Interés	NO_PRESENTADO	0	\N	10
98	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	CV_IP	Hoja de Vida del IP	NO_PRESENTADO	0	\N	10
99	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	PROTOCOLO_COMPLETO	Protocolo Completo de Investigación	NO_PRESENTADO	0	\N	10
100	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva del Medicamento/Dispositivo	NO_PRESENTADO	0	\N	10
101	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	MANUAL_INV	Manual del Investigador	NO_PRESENTADO	0	\N	10
102	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	MATERIAL_RECLUTAMIENTO	Material de Reclutamiento	NO_PRESENTADO	0	\N	10
103	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	INSTRUMENTOS_REC	Instrumentos de Recolección de Datos	NO_PRESENTADO	0	\N	10
104	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	POLIZA_SEGURO	Póliza de Seguro	NO_PRESENTADO	0	\N	10
105	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	CERT_CAPACITACION	Certificados de Capacitación (GCP)	NO_PRESENTADO	0	\N	10
106	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	REGISTRO_SENESCYT	Registro SENESCYT del IP	NO_PRESENTADO	0	\N	10
107	2026-05-06 13:13:32.041425	2026-05-06 13:13:32.041425	\N	INFO_SEG_FARMACO	Información de Seguridad del Fármaco	NO_PRESENTADO	0	\N	10
108	2026-05-06 13:13:32.06092	2026-05-06 13:13:32.06092	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	10
109	2026-05-06 13:13:32.06092	2026-05-06 13:13:32.06092	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	10
110	2026-05-06 13:13:32.06092	2026-05-06 13:13:32.06092	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	10
111	2026-05-06 13:13:32.06092	2026-05-06 13:13:32.06092	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	10
112	2026-05-06 13:13:32.06092	2026-05-06 13:13:32.06092	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	10
113	2026-05-06 13:13:32.06092	2026-05-06 13:13:32.06092	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	10
114	2026-05-06 13:13:32.06092	2026-05-06 13:13:32.06092	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	10
115	2026-05-13 03:49:03.57084	2026-05-13 03:49:03.57084	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	11
116	2026-05-13 03:49:03.57084	2026-05-13 03:49:03.57084	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	11
117	2026-05-13 03:49:03.57084	2026-05-13 03:49:03.57084	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	11
118	2026-05-13 03:49:03.57084	2026-05-13 03:49:03.57084	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	11
119	2026-05-13 03:49:03.57084	2026-05-13 03:49:03.57084	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	11
120	2026-05-13 03:49:03.57084	2026-05-13 03:49:03.57084	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	11
121	2026-05-13 03:49:03.57084	2026-05-13 03:49:03.57084	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	11
122	2026-05-13 03:49:03.57084	2026-05-13 03:49:03.57084	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	11
123	2026-05-13 03:49:03.57084	2026-05-13 03:49:03.57084	\N	FICHA_INTERVENCION	Ficha de Intervención	NO_PRESENTADO	0	\N	11
124	2026-05-13 03:49:03.592029	2026-05-13 03:49:03.592029	\N	ANEXO_1	Anexo 1: Formulario de Solicitud	NO_PRESENTADO	0	\N	11
125	2026-05-13 03:49:03.592029	2026-05-13 03:49:03.592029	\N	ANEXO_2	Anexo 2: Resumen del Protocolo	NO_PRESENTADO	0	\N	11
126	2026-05-13 03:49:03.592029	2026-05-13 03:49:03.592029	\N	CONSENTIMIENTO	Consentimiento Informado	NO_PRESENTADO	0	\N	11
127	2026-05-13 03:49:03.592029	2026-05-13 03:49:03.592029	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	11
128	2026-05-13 03:49:03.592029	2026-05-13 03:49:03.592029	\N	DECLARACION_RESP	Declaración de Responsabilidad	NO_PRESENTADO	0	\N	11
129	2026-05-13 03:49:03.592029	2026-05-13 03:49:03.592029	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	11
130	2026-05-13 03:49:03.592029	2026-05-13 03:49:03.592029	\N	DECLARATORIA_CONF	Declaratoria de Confidencialidad	NO_PRESENTADO	0	\N	11
131	2026-05-13 03:49:03.592029	2026-05-13 03:49:03.592029	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	11
132	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	12
133	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	12
134	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	12
135	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	12
136	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	12
137	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	12
138	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	12
139	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	12
140	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	12
141	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	POLIZA_SEGURO	Copia de Póliza de Seguro (Vigente en Ecuador)	NO_PRESENTADO	0	\N	12
142	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	12
143	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	12
144	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	12
145	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	12
146	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	12
147	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	12
148	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	APROBACION_PAIS_ORIGEN	Carta de Aprobación del Comité de Ética del País de Origen	NO_PRESENTADO	0	\N	12
149	2026-05-13 14:12:48.227514	2026-05-13 14:12:48.227514	\N	TRADUCCION_ANCESTRAL	Traducción de Consentimiento a Idiomas Ancestrales	NO_PRESENTADO	0	\N	12
150	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	12
151	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	12
152	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	12
153	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	12
154	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	12
155	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	12
156	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	12
157	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	12
158	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	12
159	2026-05-13 14:12:48.253895	2026-05-13 14:12:48.253895	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	12
160	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	13
161	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	13
162	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	13
163	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	13
164	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	13
165	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	13
166	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	13
167	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	13
168	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	13
169	2026-05-15 05:53:41.836874	2026-05-15 05:53:41.836874	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	13
170	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	14
171	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	14
172	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	14
173	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	14
174	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	14
175	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	14
176	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	14
177	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	14
178	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	14
179	2026-05-15 09:03:27.352689	2026-05-15 09:03:27.352689	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	14
180	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	15
181	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	15
182	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	15
183	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	15
184	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	15
185	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	15
186	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	15
187	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	15
188	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	15
189	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	15
190	2026-05-15 09:14:58.315831	2026-05-15 09:14:58.315831	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	15
191	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	15
192	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	15
193	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	15
194	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	15
195	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	15
196	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	15
197	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	15
198	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	15
199	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	15
200	2026-05-15 09:14:58.410427	2026-05-15 09:14:58.410427	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	15
201	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	16
202	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	16
203	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	16
204	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	16
205	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	16
206	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	16
207	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	16
208	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	16
209	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	16
210	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	16
211	2026-05-15 09:28:14.654515	2026-05-15 09:28:14.654515	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	16
212	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	16
213	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	16
214	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	16
215	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	16
216	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	16
217	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	16
218	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	16
219	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	16
220	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	16
221	2026-05-15 09:28:14.678322	2026-05-15 09:28:14.678322	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	16
222	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	17
223	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	17
224	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	17
225	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	17
226	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	17
227	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	17
228	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	17
229	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	17
230	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	17
231	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	POLIZA_SEGURO	Copia de Póliza de Seguro (Vigente en Ecuador)	NO_PRESENTADO	0	\N	17
232	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	17
233	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	17
234	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	17
235	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	17
236	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	17
237	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	17
238	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	APROBACION_PAIS_ORIGEN	Carta de Aprobación del Comité de Ética del País de Origen	NO_PRESENTADO	0	\N	17
239	2026-05-15 09:38:19.570103	2026-05-15 09:38:19.570103	\N	TRADUCCION_ANCESTRAL	Traducción de Consentimiento a Idiomas Ancestrales	NO_PRESENTADO	0	\N	17
240	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	17
241	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	17
242	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	17
243	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	17
244	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	17
245	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	17
246	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	17
247	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	17
248	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	17
249	2026-05-15 09:38:19.597616	2026-05-15 09:38:19.597616	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	17
250	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	18
251	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	18
252	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	18
253	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	18
254	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	18
255	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	18
256	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	18
257	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	18
258	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	18
259	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	POLIZA_SEGURO	Copia de Póliza de Seguro (Vigente en Ecuador)	NO_PRESENTADO	0	\N	18
260	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	18
261	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	18
262	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	18
263	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	18
264	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	18
265	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	18
266	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	APROBACION_PAIS_ORIGEN	Carta de Aprobación del Comité de Ética del País de Origen	NO_PRESENTADO	0	\N	18
267	2026-05-15 10:17:32.919474	2026-05-15 10:17:32.919474	\N	TRADUCCION_ANCESTRAL	Traducción de Consentimiento a Idiomas Ancestrales	NO_PRESENTADO	0	\N	18
268	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	18
269	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	18
270	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	18
271	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	18
272	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	18
273	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	18
274	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	18
275	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	18
276	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	18
277	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	18
278	2026-05-15 10:17:32.955444	2026-05-15 10:17:32.955444	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	18
279	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	19
280	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	19
281	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	19
282	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	19
283	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	19
284	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	19
285	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	19
286	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	19
287	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	19
288	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	POLIZA_SEGURO	Copia de Póliza de Seguro (Vigente en Ecuador)	NO_PRESENTADO	0	\N	19
289	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	19
290	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	19
291	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	19
292	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	19
293	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	19
294	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	19
295	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	APROBACION_PAIS_ORIGEN	Carta de Aprobación del Comité de Ética del País de Origen	NO_PRESENTADO	0	\N	19
296	2026-05-15 10:27:31.116935	2026-05-15 10:27:31.116935	\N	TRADUCCION_ANCESTRAL	Traducción de Consentimiento a Idiomas Ancestrales	NO_PRESENTADO	0	\N	19
297	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	19
298	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	19
299	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	19
300	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	19
301	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	19
302	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	19
303	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	19
304	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	19
305	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	19
306	2026-05-15 10:27:31.147102	2026-05-15 10:27:31.147102	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	19
307	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	20
308	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	20
309	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	20
310	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	20
311	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	20
312	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	20
313	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	20
314	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	20
315	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	20
316	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	POLIZA_SEGURO	Copia de Póliza de Seguro (Vigente en Ecuador)	NO_PRESENTADO	0	\N	20
317	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	20
318	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	20
319	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	20
320	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	20
321	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	20
322	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	20
323	2026-05-15 10:43:55.022692	2026-05-15 10:43:55.022692	\N	TRADUCCION_ANCESTRAL	Traducción de Consentimiento a Idiomas Ancestrales	NO_PRESENTADO	0	\N	20
324	2026-05-15 10:43:55.047583	2026-05-15 10:43:55.047583	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	20
325	2026-05-15 10:43:55.047583	2026-05-15 10:43:55.047583	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	20
326	2026-05-15 10:43:55.047583	2026-05-15 10:43:55.047583	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	20
327	2026-05-15 10:43:55.047583	2026-05-15 10:43:55.047583	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	20
328	2026-05-15 10:43:55.047583	2026-05-15 10:43:55.047583	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	20
329	2026-05-15 10:43:55.047583	2026-05-15 10:43:55.047583	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	20
330	2026-05-15 10:43:55.047583	2026-05-15 10:43:55.047583	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	20
331	2026-05-15 10:43:55.047583	2026-05-15 10:43:55.047583	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	20
332	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	21
333	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	21
334	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	21
335	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	21
336	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	21
337	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	21
338	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	21
339	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	21
340	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	21
341	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	POLIZA_SEGURO	Copia de Póliza de Seguro (Vigente en Ecuador)	NO_PRESENTADO	0	\N	21
342	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	21
343	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	21
344	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	21
345	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	21
346	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	21
347	2026-05-15 10:52:12.786057	2026-05-15 10:52:12.786057	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	21
348	2026-05-15 10:52:12.809175	2026-05-15 10:52:12.809175	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	21
349	2026-05-15 10:52:12.809175	2026-05-15 10:52:12.809175	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	21
350	2026-05-15 10:52:12.809175	2026-05-15 10:52:12.809175	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	21
351	2026-05-15 10:52:12.809175	2026-05-15 10:52:12.809175	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	21
352	2026-05-15 10:52:12.809175	2026-05-15 10:52:12.809175	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	21
353	2026-05-15 10:52:12.809175	2026-05-15 10:52:12.809175	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	21
354	2026-05-15 10:52:12.809175	2026-05-15 10:52:12.809175	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	21
355	2026-05-15 10:52:12.809175	2026-05-15 10:52:12.809175	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	21
356	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	22
357	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	22
358	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	22
359	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	22
360	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	22
361	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	22
362	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	22
363	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	22
364	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	22
365	2026-05-15 11:29:02.786693	2026-05-15 11:29:02.786693	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	22
366	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	23
367	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	23
368	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	23
369	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	23
429	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	25
370	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	23
371	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	23
372	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	23
373	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	23
374	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	23
375	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	POLIZA_SEGURO	Copia de Póliza de Seguro (Vigente en Ecuador)	NO_PRESENTADO	0	\N	23
376	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	23
377	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	23
378	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	23
379	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	23
380	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	23
381	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	23
382	2026-05-15 11:37:09.545493	2026-05-15 11:37:09.545493	\N	TRADUCCION_ANCESTRAL	Traducción de Consentimiento a Idiomas Ancestrales	NO_PRESENTADO	0	\N	23
383	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	23
384	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	23
385	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	23
386	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	23
387	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	23
388	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	23
389	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	23
390	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	23
391	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	23
392	2026-05-15 11:37:09.589933	2026-05-15 11:37:09.589933	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	23
393	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	24
394	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	24
395	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	24
396	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	24
397	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	24
398	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	24
399	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	24
400	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	24
401	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	24
402	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	POLIZA_SEGURO	Copia de Póliza de Seguro (Vigente en Ecuador)	NO_PRESENTADO	0	\N	24
403	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	24
404	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	24
405	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	24
406	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	24
407	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	24
408	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	24
409	2026-05-15 11:38:57.721077	2026-05-15 11:38:57.721077	\N	TRADUCCION_ANCESTRAL	Traducción de Consentimiento a Idiomas Ancestrales	NO_PRESENTADO	0	\N	24
410	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	24
411	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	24
412	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	24
413	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	24
414	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	24
415	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	24
416	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	24
417	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	24
418	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	24
419	2026-05-15 11:38:57.760374	2026-05-15 11:38:57.760374	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	24
420	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	25
421	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	25
422	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	25
423	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	25
424	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	25
425	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	25
426	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	25
427	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	25
428	2026-05-15 11:40:10.84458	2026-05-15 11:40:10.84458	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	25
430	2026-05-16 02:11:39.145216	2026-05-16 02:11:39.145216	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	26
431	2026-05-16 02:11:39.145216	2026-05-16 02:11:39.145216	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	26
432	2026-05-16 02:11:39.145216	2026-05-16 02:11:39.145216	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	26
433	2026-05-16 02:11:39.145216	2026-05-16 02:11:39.145216	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	26
434	2026-05-16 02:11:39.145216	2026-05-16 02:11:39.145216	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	26
435	2026-05-16 02:11:39.145216	2026-05-16 02:11:39.145216	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	26
436	2026-05-16 02:11:39.145216	2026-05-16 02:11:39.145216	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	26
437	2026-05-16 02:11:39.145216	2026-05-16 02:11:39.145216	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	26
438	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	27
439	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	27
440	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	27
441	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	27
442	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	27
443	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	27
444	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	27
445	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	27
446	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	27
447	2026-05-16 02:17:55.289598	2026-05-16 02:17:55.289598	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	27
448	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	28
449	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	28
450	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	28
451	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	28
452	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	28
453	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	28
454	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	28
455	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	28
456	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	28
457	2026-05-16 02:19:07.259782	2026-05-16 02:19:07.259782	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	28
458	2026-05-16 02:23:40.933211	2026-05-16 02:23:40.933211	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	29
459	2026-05-16 02:23:40.933211	2026-05-16 02:23:40.933211	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	29
460	2026-05-16 02:23:40.933211	2026-05-16 02:23:40.933211	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	29
461	2026-05-16 02:23:40.933211	2026-05-16 02:23:40.933211	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	29
463	2026-05-16 02:23:40.933211	2026-05-16 02:23:40.933211	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	29
464	2026-05-16 02:23:40.933211	2026-05-16 02:23:40.933211	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	29
465	2026-05-16 02:23:40.933211	2026-05-16 02:23:40.933211	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	29
466	2026-05-16 02:23:40.933211	2026-05-16 02:23:40.933211	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	29
467	2026-05-16 02:23:40.980308	2026-05-16 02:23:40.980308	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	29
468	2026-05-16 02:23:40.980308	2026-05-16 02:23:40.980308	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	29
469	2026-05-16 02:23:40.980308	2026-05-16 02:23:40.980308	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	29
470	2026-05-16 02:23:40.980308	2026-05-16 02:23:40.980308	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	29
471	2026-05-16 02:23:40.980308	2026-05-16 02:23:40.980308	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	29
472	2026-05-16 02:23:40.980308	2026-05-16 02:23:40.980308	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	29
473	2026-05-16 02:23:40.980308	2026-05-16 02:23:40.980308	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	29
474	2026-05-16 02:23:40.980308	2026-05-16 02:23:40.980308	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	29
462	2026-05-16 02:23:40.933211	2026-05-16 02:23:44.132058	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	29
475	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	30
476	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	30
477	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	30
478	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	30
480	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	30
481	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	30
482	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	30
483	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	30
484	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	30
485	2026-05-16 07:08:06.488572	2026-05-16 07:08:06.488572	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	30
486	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	30
487	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	30
488	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	30
479	2026-05-16 07:08:06.488572	2026-05-16 07:08:09.593101	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	30
628	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	70
633	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	71
489	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	30
490	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	30
491	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	30
492	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	30
493	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	30
494	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	30
495	2026-05-16 07:08:06.513094	2026-05-16 07:08:06.513094	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	30
496	2026-05-16 07:30:42.654973	2026-05-16 07:30:42.654973	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	31
497	2026-05-16 07:30:42.654973	2026-05-16 07:30:42.654973	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	31
498	2026-05-16 07:30:42.654973	2026-05-16 07:30:42.654973	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	31
499	2026-05-16 07:30:42.654973	2026-05-16 07:30:42.654973	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	31
501	2026-05-16 07:30:42.654973	2026-05-16 07:30:42.654973	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	31
502	2026-05-16 07:30:42.654973	2026-05-16 07:30:42.654973	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	31
503	2026-05-16 07:30:42.654973	2026-05-16 07:30:42.654973	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	31
504	2026-05-16 07:30:42.654973	2026-05-16 07:30:42.654973	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	31
505	2026-05-16 07:30:42.654973	2026-05-16 07:30:42.654973	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	31
500	2026-05-16 07:30:42.654973	2026-05-16 07:30:45.797351	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	31
506	2026-05-16 07:38:16.499203	2026-05-16 07:38:16.499203	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	32
507	2026-05-16 07:38:16.499203	2026-05-16 07:38:16.499203	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	32
508	2026-05-16 07:38:16.499203	2026-05-16 07:38:16.499203	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	32
509	2026-05-16 07:38:16.499203	2026-05-16 07:38:16.499203	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	32
511	2026-05-16 07:38:16.499203	2026-05-16 07:38:16.499203	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	32
512	2026-05-16 07:38:16.499203	2026-05-16 07:38:16.499203	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	32
513	2026-05-16 07:38:16.499203	2026-05-16 07:38:16.499203	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	32
514	2026-05-16 07:38:16.499203	2026-05-16 07:38:16.499203	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	32
515	2026-05-16 07:38:16.499203	2026-05-16 07:38:16.499203	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	32
510	2026-05-16 07:38:16.499203	2026-05-16 07:38:19.599614	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	32
516	2026-05-16 08:15:54.325298	2026-05-16 08:15:54.325298	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	33
517	2026-05-16 08:15:54.325298	2026-05-16 08:15:54.325298	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	33
518	2026-05-16 08:15:54.325298	2026-05-16 08:15:54.325298	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	33
519	2026-05-16 08:15:54.325298	2026-05-16 08:15:54.325298	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	33
521	2026-05-16 08:15:54.325298	2026-05-16 08:15:54.325298	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	33
522	2026-05-16 08:15:54.325298	2026-05-16 08:15:54.325298	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	33
523	2026-05-16 08:15:54.325298	2026-05-16 08:15:54.325298	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	33
520	2026-05-16 08:15:54.325298	2026-05-16 08:15:57.515568	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	33
549	2026-05-16 19:33:56.663234	2026-05-16 19:33:56.663234	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	66
550	2026-05-16 19:33:56.663234	2026-05-16 19:33:56.663234	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	66
551	2026-05-16 19:33:56.663234	2026-05-16 19:33:56.663234	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	66
552	2026-05-16 19:33:56.663234	2026-05-16 19:33:56.663234	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	66
554	2026-05-16 19:33:56.663234	2026-05-16 19:33:56.663234	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	66
555	2026-05-16 19:33:56.663234	2026-05-16 19:33:56.663234	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	66
556	2026-05-16 19:33:56.663234	2026-05-16 19:33:56.663234	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	66
553	2026-05-16 19:33:56.663234	2026-05-16 19:33:59.773987	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	66
557	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	67
558	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	67
559	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	67
560	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	67
561	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	67
562	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	67
563	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	67
564	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	67
565	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	67
566	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	POLIZA_SEGURO	Copia de Póliza de Seguro (Vigente en Ecuador)	NO_PRESENTADO	0	\N	67
567	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	67
568	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	67
569	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	67
570	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	67
571	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	67
572	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	67
573	2026-05-16 19:34:35.750659	2026-05-16 19:34:35.750659	\N	APROBACION_PAIS_ORIGEN	Carta de Aprobación del Comité de Ética del País de Origen	NO_PRESENTADO	0	\N	67
574	2026-05-16 19:34:35.798831	2026-05-16 19:34:35.798831	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	67
575	2026-05-16 19:34:35.798831	2026-05-16 19:34:35.798831	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	67
576	2026-05-16 19:34:35.798831	2026-05-16 19:34:35.798831	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	67
577	2026-05-16 19:34:35.798831	2026-05-16 19:34:35.798831	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	67
579	2026-05-16 19:34:35.798831	2026-05-16 19:34:35.798831	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	67
580	2026-05-16 19:34:35.798831	2026-05-16 19:34:35.798831	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	67
581	2026-05-16 19:34:35.798831	2026-05-16 19:34:35.798831	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	67
578	2026-05-16 19:34:35.798831	2026-05-16 19:34:38.868248	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	67
582	2026-05-16 19:41:07.30065	2026-05-16 19:41:07.30065	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	68
583	2026-05-16 19:41:07.30065	2026-05-16 19:41:07.30065	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	68
584	2026-05-16 19:41:07.30065	2026-05-16 19:41:07.30065	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	68
585	2026-05-16 19:41:07.30065	2026-05-16 19:41:07.30065	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	68
587	2026-05-16 19:41:07.30065	2026-05-16 19:41:07.30065	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	68
588	2026-05-16 19:41:07.30065	2026-05-16 19:41:07.30065	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	68
589	2026-05-16 19:41:07.30065	2026-05-16 19:41:07.30065	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	68
590	2026-05-16 19:41:07.324295	2026-05-16 19:41:07.324295	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	68
591	2026-05-16 19:41:07.324295	2026-05-16 19:41:07.324295	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	68
592	2026-05-16 19:41:07.324295	2026-05-16 19:41:07.324295	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	68
593	2026-05-16 19:41:07.324295	2026-05-16 19:41:07.324295	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	68
594	2026-05-16 19:41:07.324295	2026-05-16 19:41:07.324295	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	68
595	2026-05-16 19:41:07.324295	2026-05-16 19:41:07.324295	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	68
596	2026-05-16 19:41:07.324295	2026-05-16 19:41:07.324295	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	68
597	2026-05-16 19:41:07.324295	2026-05-16 19:41:07.324295	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	68
586	2026-05-16 19:41:07.30065	2026-05-16 19:41:10.390238	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	68
598	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	69
599	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	69
600	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	69
601	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	69
603	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	69
604	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	69
605	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	69
606	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	69
607	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	69
608	2026-05-17 06:04:23.224279	2026-05-17 06:04:23.224279	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	69
609	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	69
610	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	69
611	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	CONSENTIMIENTO	Consentimiento/Asentimiento Informado (Anexo 3)	NO_PRESENTADO	0	\N	69
612	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	INSTRUMENTOS_INV	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	69
613	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	69
614	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	69
615	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	69
616	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	CONSENTIMIENTO_COMUNITARIO	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	69
617	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	DECLARATORIA_CONF	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	69
618	2026-05-17 06:04:23.256321	2026-05-17 06:04:23.256321	\N	DECLARACION_CI	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	69
602	2026-05-17 06:04:23.224279	2026-05-17 06:04:26.433189	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	69
619	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	70
620	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	70
621	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	70
622	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	70
623	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	70
624	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	70
625	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	70
626	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	70
627	2026-05-17 06:24:21.083507	2026-05-17 06:24:21.083507	\N		Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	70
629	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	71
630	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	71
631	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	71
632	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	71
634	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	71
635	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	71
636	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	71
637	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	71
638	2026-05-17 06:27:10.94369	2026-05-17 06:27:10.94369	\N		Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	71
639	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	72
640	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	72
641	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	72
642	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	72
643	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	72
644	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	72
645	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	72
646	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	72
647	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	72
648	2026-05-17 06:27:45.160546	2026-05-17 06:27:45.160546	\N		Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	72
649	2026-05-17 06:35:20.37318	2026-05-17 06:35:20.37318	\N		Anexo 1:: Solicitud de Evaluación	NO_PRESENTADO	0	\N	73
650	2026-05-17 06:35:20.37318	2026-05-17 06:35:20.37318	\N		Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	73
651	2026-05-17 06:35:20.37318	2026-05-17 06:35:20.37318	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	73
652	2026-05-17 06:35:20.37318	2026-05-17 06:35:20.37318	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	73
653	2026-05-17 06:35:20.37318	2026-05-17 06:35:20.37318	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	73
654	2026-05-17 06:35:20.37318	2026-05-17 06:35:20.37318	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	73
655	2026-05-17 06:35:20.37318	2026-05-17 06:35:20.37318	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	73
656	2026-05-17 06:35:20.37318	2026-05-17 06:35:20.37318	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	73
657	2026-05-17 06:35:20.37318	2026-05-17 06:35:20.37318	\N		Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	73
658	2026-05-17 06:35:56.932593	2026-05-17 06:35:56.932593	\N		Anexo 1:: Solicitud de Evaluación	NO_PRESENTADO	0	\N	74
659	2026-05-17 06:35:56.932593	2026-05-17 06:35:56.932593	\N		Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	74
660	2026-05-17 06:35:56.932593	2026-05-17 06:35:56.932593	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	74
661	2026-05-17 06:35:56.932593	2026-05-17 06:35:56.932593	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	74
662	2026-05-17 06:35:56.932593	2026-05-17 06:35:56.932593	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	74
663	2026-05-17 06:35:56.932593	2026-05-17 06:35:56.932593	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	74
664	2026-05-17 06:35:56.932593	2026-05-17 06:35:56.932593	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	74
665	2026-05-17 06:35:56.932593	2026-05-17 06:35:56.932593	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	74
666	2026-05-17 06:35:56.932593	2026-05-17 06:35:56.932593	\N		Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	74
667	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Anexo 1:: Solicitud de Evaluación	NO_PRESENTADO	0	\N	75
668	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	75
669	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	75
670	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	75
671	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	75
672	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	75
673	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	75
674	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	75
675	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	75
676	2026-05-17 15:05:52.694433	2026-05-17 15:05:52.694433	\N		Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	75
677	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Anexo 1:: Solicitud de Evaluación	NO_PRESENTADO	0	\N	76
678	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	76
679	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	76
680	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	76
681	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	76
682	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	76
683	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	76
684	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	76
685	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	76
686	2026-05-17 15:06:44.926855	2026-05-17 15:06:44.926855	\N		Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	76
687	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Anexo 1:: Solicitud de Evaluación	NO_PRESENTADO	0	\N	77
688	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	77
689	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	77
690	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	77
691	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	77
692	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	77
693	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	77
694	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	77
695	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	77
696	2026-05-17 15:08:29.284123	2026-05-17 15:08:29.284123	\N		Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	77
697	2026-05-17 15:13:47.074652	2026-05-17 15:13:47.074652	\N		Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	78
698	2026-05-17 15:13:47.074652	2026-05-17 15:13:47.074652	\N		Anexo 2:: Formulario de Protocolo	NO_PRESENTADO	0	\N	78
699	2026-05-17 15:13:47.074652	2026-05-17 15:13:47.074652	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	78
700	2026-05-17 15:13:47.074652	2026-05-17 15:13:47.074652	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	78
701	2026-05-17 15:13:47.074652	2026-05-17 15:13:47.074652	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	78
702	2026-05-17 15:13:47.074652	2026-05-17 15:13:47.074652	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	78
703	2026-05-17 15:13:47.074652	2026-05-17 15:13:47.074652	\N		Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	78
704	2026-05-17 15:13:47.074652	2026-05-17 15:13:47.074652	\N		Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	78
705	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	79
706	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Anexo 2:: Formulario de Protocolo	NO_PRESENTADO	0	\N	79
707	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	79
708	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	79
709	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	79
710	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	79
711	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	79
712	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	79
713	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	79
714	2026-05-17 16:02:02.930955	2026-05-17 16:02:02.930955	\N		Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	79
715	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	80
716	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	80
717	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	80
718	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	80
719	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	80
720	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	80
721	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	80
722	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	80
723	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	80
724	2026-05-17 17:09:42.062409	2026-05-17 17:09:42.062409	\N		Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	80
725	2026-05-17 18:02:31.691543	2026-05-17 18:02:56.470445	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	83
726	2026-05-17 18:02:31.691543	2026-05-17 18:03:00.999293	\N	DECLARACION_RESP	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	83
727	2026-05-17 18:02:31.691543	2026-05-17 18:03:11.205106	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	PRESENTADO	0	\N	83
728	2026-05-17 18:02:31.691543	2026-05-17 18:03:16.517126	\N	CARTA_INTERES	Carta de Interés Institucional (Anexo 5)	PRESENTADO	0	\N	83
729	2026-05-17 18:02:31.691543	2026-05-17 18:03:26.363514	\N	POLIZA_SEGURO	Copia de Póliza de Seguro de Responsabilidad Civil	PRESENTADO	0	\N	83
730	2026-05-17 18:02:31.691543	2026-05-17 18:03:30.923768	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	PRESENTADO	0	\N	83
731	2026-05-17 18:02:31.691543	2026-05-17 18:03:44.575553	\N	CV_IP	Hoja de Vida del IP e Investigadores	PRESENTADO	0	\N	83
732	2026-05-17 18:02:31.691543	2026-05-17 18:03:49.990704	\N	PROTOCOLO_COMPLETO	Protocolo de Investigación (Original y Castellano)	PRESENTADO	0	\N	83
741	2026-05-17 18:02:31.691543	2026-05-17 18:03:58.979287	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	PRESENTADO	0	\N	83
740	2026-05-17 18:02:31.691543	2026-05-17 18:04:04.748161	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	PRESENTADO	0	\N	83
733	2026-05-17 18:02:31.691543	2026-05-17 18:04:16.897616	\N	FICHA_DESCRIPTIVA	Ficha Descriptiva de Ensayos Clínicos	PRESENTADO	0	\N	83
734	2026-05-17 18:02:31.691543	2026-05-17 18:04:22.238262	\N	MANUAL_INV	Manual del Investigador (Buenas Prácticas Clínicas)	PRESENTADO	0	\N	83
735	2026-05-17 18:02:31.691543	2026-05-17 18:04:30.066308	\N	INSTRUMENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	PRESENTADO	0	\N	83
736	2026-05-17 18:02:31.691543	2026-05-17 18:05:11.252938	\N	CERT_CAPACITACION	Certificados de Capacitación y Experiencia (Bioética)	PRESENTADO	0	\N	83
737	2026-05-17 18:02:31.691543	2026-05-17 18:05:18.365957	\N	REGISTRO_SENESCYT	Registro SENESCYT del Investigador Principal	PRESENTADO	0	\N	83
738	2026-05-17 18:02:31.691543	2026-05-17 18:05:23.692927	\N	INFO_SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	PRESENTADO	0	\N	83
739	2026-05-17 18:02:31.691543	2026-05-17 18:05:30.246438	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	PRESENTADO	0	\N	83
742	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	97
743	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	97
744	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	97
745	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	97
746	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	97
747	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	97
748	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	97
749	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	97
750	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	97
751	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	97
752	2026-05-18 22:29:30.344066	2026-05-18 22:29:30.344066	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	97
753	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	98
754	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	98
755	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	98
756	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	98
757	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	POLIZA_RC	Copia de Póliza de Seguro de Responsabilidad Civil	NO_PRESENTADO	0	\N	98
758	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	98
759	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	98
760	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	PROTOCOLO_EC	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	98
761	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	FICHA_EC	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	98
762	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	MANUAL_BPC	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	98
763	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	PROCEDIMIENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	98
764	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	CERT_BIOETICA	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	98
765	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	REG_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	98
766	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	98
767	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	98
768	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	98
769	2026-05-18 22:39:36.734648	2026-05-18 22:39:36.734648	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	98
774	2026-05-18 22:49:03.122626	2026-05-18 22:49:03.281468	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	99
770	2026-05-18 22:49:03.122626	2026-05-18 22:49:11.201647	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	99
771	2026-05-18 22:49:03.122626	2026-05-18 22:49:20.55682	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	PRESENTADO	0	\N	99
772	2026-05-18 22:49:03.122626	2026-05-18 22:49:25.805727	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	99
773	2026-05-18 22:49:03.122626	2026-05-18 22:49:32.137294	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	PRESENTADO	0	\N	99
775	2026-05-18 22:49:03.122626	2026-05-18 22:49:37.341971	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	99
776	2026-05-18 22:49:03.122626	2026-05-18 22:49:43.333611	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	PRESENTADO	0	\N	99
777	2026-05-18 22:49:03.122626	2026-05-18 22:49:49.298335	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	PRESENTADO	0	\N	99
778	2026-05-18 22:49:03.122626	2026-05-18 22:49:54.64617	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	PRESENTADO	0	\N	99
783	2026-05-18 22:57:15.598047	2026-05-18 22:57:15.790913	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	100
779	2026-05-18 22:57:15.598047	2026-05-18 22:57:21.948124	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	100
780	2026-05-18 22:57:15.598047	2026-05-18 22:57:26.492761	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	PRESENTADO	0	\N	100
781	2026-05-18 22:57:15.598047	2026-05-18 22:57:31.136	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	100
782	2026-05-18 22:57:15.598047	2026-05-18 22:57:36.04758	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	PRESENTADO	0	\N	100
784	2026-05-18 22:57:15.598047	2026-05-18 22:57:40.867782	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	100
785	2026-05-18 22:57:15.598047	2026-05-18 22:57:47.540958	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	PRESENTADO	0	\N	100
786	2026-05-18 22:57:15.598047	2026-05-18 22:57:52.419333	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	PRESENTADO	0	\N	100
787	2026-05-18 22:57:15.598047	2026-05-18 22:57:57.171273	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	PRESENTADO	0	\N	100
788	2026-05-18 22:57:15.598047	2026-05-18 22:58:01.894121	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	PRESENTADO	0	\N	100
789	2026-05-18 22:57:15.598047	2026-05-18 22:58:06.395302	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	PRESENTADO	0	\N	100
794	2026-05-18 23:07:26.740065	2026-05-18 23:07:26.850505	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	101
798	2026-05-18 23:07:26.740065	2026-05-18 23:07:47.527019	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	PRESENTADO	0	\N	101
797	2026-05-18 23:07:26.740065	2026-05-18 23:07:53.781873	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	PRESENTADO	0	\N	101
796	2026-05-18 23:07:26.740065	2026-05-18 23:07:58.729583	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	PRESENTADO	0	\N	101
795	2026-05-18 23:07:26.740065	2026-05-18 23:08:03.34785	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	101
792	2026-05-18 23:07:26.740065	2026-05-18 23:08:10.18212	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	101
790	2026-05-18 23:07:26.740065	2026-05-18 23:08:16.081957	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	101
791	2026-05-18 23:07:26.740065	2026-05-18 23:08:21.095938	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	PRESENTADO	0	\N	101
793	2026-05-18 23:07:26.740065	2026-05-18 23:08:26.208361	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	PRESENTADO	0	\N	101
799	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	102
800	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	102
801	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	102
802	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	POLIZA_RC	Copia de Póliza de Seguro de Responsabilidad Civil	NO_PRESENTADO	0	\N	102
803	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	102
804	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	102
805	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	PROTOCOLO_EC	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	102
806	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	FICHA_EC	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	102
807	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	MANUAL_BPC	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	102
808	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	PROCEDIMIENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	102
809	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	CERT_BIOETICA	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	102
810	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	REG_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	102
811	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	102
812	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	102
813	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	102
814	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	102
815	2026-05-19 08:42:31.732672	2026-05-19 08:42:31.732672	\N	APROB_ORIGEN	Carta de Aprobación del Comité de Ética del País de Origen	NO_PRESENTADO	0	\N	102
816	2026-05-19 09:01:44.319919	2026-05-19 09:01:44.319919	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	103
817	2026-05-19 09:01:44.319919	2026-05-19 09:01:44.319919	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	103
818	2026-05-19 09:01:44.319919	2026-05-19 09:01:44.319919	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	103
819	2026-05-19 09:01:44.319919	2026-05-19 09:01:44.319919	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	103
820	2026-05-19 09:01:44.319919	2026-05-19 09:01:44.319919	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	103
821	2026-05-19 09:01:44.319919	2026-05-19 09:01:44.319919	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	103
822	2026-05-19 09:01:44.319919	2026-05-19 09:01:44.319919	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	103
823	2026-05-19 09:01:44.319919	2026-05-19 09:01:44.319919	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	103
824	2026-05-19 09:01:44.319919	2026-05-19 09:01:44.319919	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	103
825	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	104
826	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	104
827	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	104
828	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	POLIZA_RC	Copia de Póliza de Seguro de Responsabilidad Civil	NO_PRESENTADO	0	\N	104
829	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	NO_PRESENTADO	0	\N	104
830	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	CV_IP	Hoja de Vida del IP e Investigadores	NO_PRESENTADO	0	\N	104
831	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	PROTOCOLO_EC	Protocolo de Investigación (Original y Castellano)	NO_PRESENTADO	0	\N	104
832	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	FICHA_EC	Ficha Descriptiva de Ensayos Clínicos	NO_PRESENTADO	0	\N	104
833	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	MANUAL_BPC	Manual del Investigador (Buenas Prácticas Clínicas)	NO_PRESENTADO	0	\N	104
834	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	PROCEDIMIENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	NO_PRESENTADO	0	\N	104
835	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	CERT_BIOETICA	Certificados de Capacitación y Experiencia (Bioética)	NO_PRESENTADO	0	\N	104
836	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	REG_SENESCYT	Registro SENESCYT del Investigador Principal	NO_PRESENTADO	0	\N	104
837	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	NO_PRESENTADO	0	\N	104
838	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	NO_PRESENTADO	0	\N	104
839	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	NO_PRESENTADO	0	\N	104
840	2026-05-22 09:11:21.552111	2026-05-22 09:11:21.552111	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	NO_PRESENTADO	0	\N	104
841	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	105
842	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	105
843	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	105
844	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	105
845	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	105
846	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	105
847	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	105
848	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	105
849	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	105
850	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	105
851	2026-05-22 09:13:22.960696	2026-05-22 09:13:22.960696	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	105
852	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	106
853	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	106
854	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	106
855	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	106
856	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	106
857	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	106
858	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	106
859	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	106
860	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	106
861	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	106
862	2026-05-22 09:42:23.602437	2026-05-22 09:42:23.602437	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	106
867	2026-05-22 09:58:19.106131	2026-05-22 09:58:24.014368	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	107
863	2026-05-22 09:58:19.106131	2026-05-22 09:58:29.755904	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	107
864	2026-05-22 09:58:19.106131	2026-05-22 09:58:46.572167	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	PRESENTADO	0	\N	107
866	2026-05-22 09:58:19.106131	2026-05-22 09:58:50.265353	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	PRESENTADO	0	\N	107
865	2026-05-22 09:58:19.106131	2026-05-22 09:58:54.275838	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	107
869	2026-05-22 09:58:19.106131	2026-05-22 09:59:01.228182	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	PRESENTADO	0	\N	107
868	2026-05-22 09:58:19.106131	2026-05-22 09:59:05.56404	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	107
871	2026-05-22 09:58:19.106131	2026-05-22 09:59:08.918125	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	PRESENTADO	0	\N	107
870	2026-05-22 09:58:19.106131	2026-05-22 09:59:17.910251	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	PRESENTADO	0	\N	107
872	2026-05-22 10:13:45.755652	2026-05-22 10:14:00.121737	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	108
873	2026-05-22 10:13:45.755652	2026-05-22 10:14:05.042653	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	PRESENTADO	0	\N	108
875	2026-05-22 10:13:45.755652	2026-05-22 10:14:15.990103	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	PRESENTADO	0	\N	108
874	2026-05-22 10:13:45.755652	2026-05-22 10:14:22.118463	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	108
877	2026-05-22 10:13:45.755652	2026-05-22 10:14:30.929284	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	108
878	2026-05-22 10:13:45.755652	2026-05-22 10:14:38.35167	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	PRESENTADO	0	\N	108
879	2026-05-22 10:13:45.755652	2026-05-22 10:14:46.888415	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	PRESENTADO	0	\N	108
880	2026-05-22 10:13:45.755652	2026-05-22 10:14:54.023426	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	PRESENTADO	0	\N	108
876	2026-05-22 10:13:45.755652	2026-05-22 10:16:21.517105	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	0		108
881	2026-05-22 10:13:45.755652	2026-05-22 10:15:01.441293	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	PRESENTADO	0	\N	108
882	2026-05-22 10:13:45.755652	2026-05-22 10:15:07.147862	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	PRESENTADO	0	\N	108
899	2026-05-23 19:44:27.30356	2026-05-23 19:46:21.217119	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	0		110
897	2026-05-23 19:44:27.30356	2026-05-23 19:46:21.869344	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	0		110
896	2026-05-23 19:44:27.30356	2026-05-23 19:46:22.60439	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	0		110
895	2026-05-23 19:44:27.30356	2026-05-23 19:46:24.709017	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	0		110
894	2026-05-23 19:44:27.30356	2026-05-23 19:46:25.34064	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	0		110
898	2026-05-23 19:44:27.30356	2026-05-23 19:46:26.060275	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	0		110
887	2026-05-23 19:18:00.467336	2026-05-23 19:20:17.082672	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	0		109
883	2026-05-23 19:18:00.467336	2026-05-23 19:20:17.855223	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	0		109
884	2026-05-23 19:18:00.467336	2026-05-23 19:20:19.829998	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	0		109
885	2026-05-23 19:18:00.467336	2026-05-23 19:20:25.630204	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	0		109
886	2026-05-23 19:18:00.467336	2026-05-23 19:20:26.488889	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	0		109
893	2026-05-23 19:18:00.467336	2026-05-23 19:20:27.94093	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	APROBADO	0		109
892	2026-05-23 19:18:00.467336	2026-05-23 19:20:28.65751	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	APROBADO	0		109
891	2026-05-23 19:18:00.467336	2026-05-23 19:20:29.200995	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	APROBADO	0		109
890	2026-05-23 19:18:00.467336	2026-05-23 19:20:30.205221	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	APROBADO	0		109
904	2026-05-23 19:44:27.30356	2026-05-23 19:46:30.328644	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	RECHAZADO	0	ddddddddddddddddd	110
889	2026-05-23 19:18:00.467336	2026-05-23 19:20:36.499978	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	RECHAZADO	0	fgfffffffffffff	109
888	2026-05-23 19:18:00.467336	2026-05-23 19:20:38.102571	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	0		109
907	2026-05-26 19:25:22.173987	2026-05-26 19:28:17.652828	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	0		111
905	2026-05-26 19:25:22.173987	2026-05-26 19:28:18.184602	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	0		111
909	2026-05-26 19:25:22.173987	2026-05-26 19:28:19.049019	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	0		111
903	2026-05-23 19:44:27.30356	2026-05-23 19:46:33.468144	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	RECHAZADO	0	dddddddddddddddd	110
902	2026-05-23 19:44:27.30356	2026-05-23 19:46:34.61734	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	APROBADO	0		110
901	2026-05-23 19:44:27.30356	2026-05-23 19:46:35.417529	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	APROBADO	0		110
900	2026-05-23 19:44:27.30356	2026-05-23 19:46:36.12785	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	APROBADO	0		110
916	2026-05-26 20:08:12.057659	2026-05-26 20:11:52.935888	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	0		112
915	2026-05-26 19:25:22.173987	2026-05-26 19:28:21.081617	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	APROBADO	0		111
914	2026-05-26 19:25:22.173987	2026-05-26 19:28:21.48982	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	APROBADO	0		111
913	2026-05-26 19:25:22.173987	2026-05-26 19:28:21.912582	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	APROBADO	0		111
906	2026-05-26 19:25:22.173987	2026-05-26 19:28:23.10757	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	0		111
908	2026-05-26 19:25:22.173987	2026-05-26 19:28:23.537033	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	0		111
910	2026-05-26 19:25:22.173987	2026-05-26 19:28:23.959812	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	0		111
911	2026-05-26 19:25:22.173987	2026-05-26 19:28:24.468501	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	APROBADO	0		111
912	2026-05-26 19:25:22.173987	2026-05-26 19:28:25.279222	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	APROBADO	0		111
920	2026-05-26 20:08:12.057659	2026-05-26 20:11:52.253419	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	0		112
924	2026-05-26 20:08:12.057659	2026-05-26 20:11:54.33105	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	APROBADO	0		112
923	2026-05-26 20:08:12.057659	2026-05-26 20:11:54.930341	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	APROBADO	0		112
921	2026-05-26 20:08:12.057659	2026-05-26 20:11:55.645048	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	0		112
922	2026-05-26 20:08:12.057659	2026-05-26 20:11:56.049909	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	APROBADO	0		112
918	2026-05-26 20:08:12.057659	2026-05-26 20:11:56.659641	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	0		112
917	2026-05-26 20:08:12.057659	2026-05-26 20:11:57.960887	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	0		112
919	2026-05-26 20:08:12.057659	2026-05-26 20:11:58.609192	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	0		112
925	2026-05-26 20:31:29.017158	2026-05-26 20:33:12.733501	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	113
929	2026-05-26 20:31:29.017158	2026-05-26 20:33:05.649657	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	113
926	2026-05-26 20:31:29.017158	2026-05-26 20:33:18.360868	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	PRESENTADO	0	\N	113
927	2026-05-26 20:31:29.017158	2026-05-26 20:33:24.049448	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	113
928	2026-05-26 20:31:29.017158	2026-05-26 20:33:28.790701	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	PRESENTADO	0	\N	113
930	2026-05-26 20:31:29.017158	2026-05-26 20:33:34.405634	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	113
931	2026-05-26 20:31:29.017158	2026-05-26 20:33:39.395464	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	PRESENTADO	0	\N	113
932	2026-05-26 20:31:29.017158	2026-05-26 20:33:44.93361	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	PRESENTADO	0	\N	113
933	2026-05-26 20:31:29.017158	2026-05-26 20:33:53.485835	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	PRESENTADO	0	\N	113
935	2026-05-26 21:15:43.385379	2026-05-26 21:16:21.699906	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	PRESENTADO	0	\N	114
936	2026-05-26 21:15:43.385379	2026-05-26 21:16:26.900214	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	114
938	2026-05-26 21:15:43.385379	2026-05-26 21:16:34.889276	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	114
937	2026-05-26 21:15:43.385379	2026-05-26 21:16:35.046266	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	PRESENTADO	0	\N	114
934	2026-05-26 21:15:43.385379	2026-05-26 21:16:18.076115	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	114
939	2026-05-26 21:15:43.385379	2026-05-26 21:16:43.420544	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	114
941	2026-05-26 21:15:43.385379	2026-05-26 21:16:50.835974	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	PRESENTADO	0	\N	114
940	2026-05-26 21:15:43.385379	2026-05-26 21:16:58.504778	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	PRESENTADO	0	\N	114
943	2026-05-26 21:15:43.385379	2026-05-26 21:17:02.966135	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	PRESENTADO	0	\N	114
944	2026-05-26 21:15:43.385379	2026-05-26 21:17:08.164732	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	PRESENTADO	0	\N	114
945	2026-05-26 21:15:43.385379	2026-05-26 21:17:11.10747	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	PRESENTADO	0	\N	114
942	2026-05-26 21:15:43.385379	2026-05-26 21:17:14.168786	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	PRESENTADO	0	\N	114
965	2026-05-26 21:45:06.294441	2026-05-26 21:47:21.621142	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	0		116
951	2026-05-26 21:22:47.658699	2026-05-26 21:26:38.932823	\N	ANEXO_6	Anexo 6: Carta de Solicitud de Evaluación	APROBADO	0		115
952	2026-05-26 21:22:47.658699	2026-05-26 21:26:39.343876	\N	CV_IP	Hoja de Vida del IP e Investigadores	APROBADO	0		115
953	2026-05-26 21:22:47.658699	2026-05-26 21:26:41.09339	\N	PROTOCOLO_EC	Protocolo de Investigación (Original y Castellano)	APROBADO	0		115
955	2026-05-26 21:22:47.658699	2026-05-26 21:26:41.355545	\N	MANUAL_BPC	Manual del Investigador (Buenas Prácticas Clínicas)	APROBADO	0		115
967	2026-05-26 21:45:06.294441	2026-05-26 21:47:22.518499	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	0		116
966	2026-05-26 21:45:06.294441	2026-05-26 21:47:00.887554	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	0		116
968	2026-05-26 21:45:06.294441	2026-05-26 21:47:02.295468	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	0		116
969	2026-05-26 21:45:06.294441	2026-05-26 21:47:11.430455	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	RECHAZADO	0	falta 	116
970	2026-05-26 21:45:06.294441	2026-05-26 21:47:14.936845	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	RECHAZADO	0	falta	116
971	2026-05-26 21:45:06.294441	2026-05-26 21:47:16.596128	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	APROBADO	0		116
972	2026-05-26 21:45:06.294441	2026-05-26 21:47:17.535778	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	APROBADO	0		116
948	2026-05-26 21:22:47.658699	2026-05-26 21:26:36.439085	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	APROBADO	0		115
949	2026-05-26 21:22:47.658699	2026-05-26 21:26:37.249586	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	APROBADO	0		115
950	2026-05-26 21:22:47.658699	2026-05-26 21:26:38.018874	\N	POLIZA_RC	Copia de Póliza de Seguro de Responsabilidad Civil	APROBADO	0		115
947	2026-05-26 21:22:47.658699	2026-05-26 21:26:38.715687	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	0		115
954	2026-05-26 21:22:47.658699	2026-05-26 21:26:42.008185	\N	FICHA_EC	Ficha Descriptiva de Ensayos Clínicos	APROBADO	0		115
957	2026-05-26 21:22:47.658699	2026-05-26 21:26:42.891134	\N	CERT_BIOETICA	Certificados de Capacitación y Experiencia (Bioética)	APROBADO	0		115
956	2026-05-26 21:22:47.658699	2026-05-26 21:26:44.189637	\N	PROCEDIMIENTOS_REC	Procedimientos e Instrumentos de Reclutamiento y Recolección	APROBADO	0		115
958	2026-05-26 21:22:47.658699	2026-05-26 21:26:44.849345	\N	REG_SENESCYT	Registro SENESCYT del Investigador Principal	APROBADO	0		115
959	2026-05-26 21:22:47.658699	2026-05-26 21:26:45.423094	\N	SEG_FARMACO	Información sobre Seguridad del Fármaco Experimental	APROBADO	0		115
960	2026-05-26 21:22:47.658699	2026-05-26 21:26:46.873271	\N	CONTRATO_PROMOTOR	Copia del Contrato entre Promotor e Investigadores	APROBADO	0		115
961	2026-05-26 21:22:47.658699	2026-05-26 21:26:47.498015	\N	PLAN_MONITOREO	Plan de Monitoreo del Ensayo Clínico	APROBADO	0		115
963	2026-05-26 21:22:47.658699	2026-05-26 21:26:48.011424	\N	APROB_ORIGEN	Carta de Aprobación del Comité de Ética del País de Origen	APROBADO	0		115
962	2026-05-26 21:22:47.658699	2026-05-26 21:26:48.539632	\N	PLAN_SEGURIDAD	Plan de Seguridad del Participante	APROBADO	0		115
946	2026-05-26 21:22:47.658699	2026-05-26 21:27:07.237571	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	0		115
979	2026-05-26 21:59:12.462337	2026-05-27 08:51:44.501133	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	2		117
973	2026-05-26 21:45:06.294441	2026-05-26 21:47:18.734565	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	APROBADO	0		116
974	2026-05-26 21:45:06.294441	2026-05-26 21:47:19.644868	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	APROBADO	0		116
964	2026-05-26 21:45:06.294441	2026-05-26 21:47:20.783468	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	0		116
980	2026-05-26 21:59:12.462337	2026-05-27 08:51:53.147358	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	1		117
981	2026-05-26 21:59:12.462337	2026-05-27 08:51:59.698003	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	APROBADO	92	FALTA DC	117
978	2026-05-26 21:59:12.462337	2026-05-27 08:51:32.802407	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	1		117
985	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	118
986	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	118
987	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	118
988	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	118
989	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	118
975	2026-05-26 21:59:12.462337	2026-05-26 22:00:44.4963	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	0		117
977	2026-05-26 21:59:12.462337	2026-05-26 22:00:45.341138	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	0		117
983	2026-05-26 21:59:12.462337	2026-05-26 22:00:50.232416	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	APROBADO	0		117
984	2026-05-27 07:20:58.883558	2026-05-27 07:21:13.735385	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	118
982	2026-05-26 21:59:12.462337	2026-05-27 04:55:32.104092	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	APROBADO	0	FALTA DOCUMENTACION ESTA MAL 	117
990	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	118
991	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	118
992	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	118
993	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	118
994	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	118
976	2026-05-26 21:59:12.462337	2026-05-27 08:13:19.792378	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	-15		117
995	2026-05-27 07:20:58.883558	2026-05-27 07:20:58.883558	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	118
1011	2026-05-27 14:14:13.379982	2026-05-27 14:24:03.062563	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	6		120
1012	2026-05-27 14:14:13.379982	2026-05-27 14:24:06.130096	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	9		120
1013	2026-05-27 14:14:13.379982	2026-05-27 14:24:09.804839	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	APROBADO	3		120
1014	2026-05-27 14:14:13.379982	2026-05-27 14:24:12.032819	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	APROBADO	7		120
1015	2026-05-27 14:14:13.379982	2026-05-27 14:24:14.294581	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	APROBADO	8		120
996	2026-05-27 13:46:41.8635	2026-05-27 13:58:45.070955	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	4		119
997	2026-05-27 13:46:41.8635	2026-05-27 13:58:58.866411	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	5		119
998	2026-05-27 13:46:41.8635	2026-05-27 13:59:07.04442	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	5		119
999	2026-05-27 13:46:41.8635	2026-05-27 13:59:09.229346	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	5		119
1000	2026-05-27 13:46:41.8635	2026-05-27 13:59:12.648499	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	8		119
1001	2026-05-27 13:46:41.8635	2026-05-27 13:59:16.941703	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	9		119
1002	2026-05-27 13:46:41.8635	2026-05-27 13:59:23.65776	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	APROBADO	4		119
1003	2026-05-27 13:46:41.8635	2026-05-27 13:59:27.13245	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	APROBADO	7		119
1005	2026-05-27 13:46:41.8635	2026-05-27 13:59:30.872173	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	APROBADO	8		119
1004	2026-05-27 13:46:41.8635	2026-05-27 13:59:36.305199	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	APROBADO	7		119
1006	2026-05-27 13:46:41.8635	2026-05-27 13:59:41.30397	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	APROBADO	7		119
1025	2026-05-28 16:23:57.878175	2026-05-28 16:24:54.385581	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	122
1026	2026-05-28 16:23:57.878175	2026-05-28 16:24:59.526498	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	PRESENTADO	0	\N	122
1027	2026-05-28 16:23:57.878175	2026-05-28 16:25:07.543728	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	122
1028	2026-05-28 16:23:57.878175	2026-05-28 16:25:17.130388	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	PRESENTADO	0	\N	122
1029	2026-05-28 16:23:57.878175	2026-05-28 16:25:26.554054	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	122
1030	2026-05-28 16:23:57.878175	2026-05-28 16:25:36.715334	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	122
1007	2026-05-27 14:14:13.379982	2026-05-27 14:23:41.574501	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	1		120
1008	2026-05-27 14:14:13.379982	2026-05-27 14:23:55.351064	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	RECHAZADO	2	FALTA DOCUMENTACION	120
1009	2026-05-27 14:14:13.379982	2026-05-27 14:23:58.670465	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	2		120
1010	2026-05-27 14:14:13.379982	2026-05-27 14:24:00.705725	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	4		120
1092	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	129
1093	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	129
1094	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	129
1095	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	129
1096	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	129
1097	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	129
1098	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	129
1099	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	130
1016	2026-05-27 14:52:05.204321	2026-05-27 14:53:27.900234	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	1		121
1017	2026-05-27 14:52:05.204321	2026-05-27 14:53:31.659829	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	22		121
1018	2026-05-27 14:52:05.204321	2026-05-27 14:53:34.006543	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	2		121
1020	2026-05-27 14:52:05.204321	2026-05-27 14:53:35.598657	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	2		121
1019	2026-05-27 14:52:05.204321	2026-05-27 14:53:37.948738	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	2		121
1021	2026-05-27 14:52:05.204321	2026-05-27 14:53:41.494081	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	2		121
1022	2026-05-27 14:52:05.204321	2026-05-27 14:54:12.364741	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	APROBADO	5		121
1023	2026-05-27 14:52:05.204321	2026-05-27 14:54:15.042097	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	APROBADO	2		121
1024	2026-05-27 14:52:05.204321	2026-05-27 14:54:19.342264	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	APROBADO	1		121
1100	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	130
1101	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	130
1102	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	130
1103	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	130
1104	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	130
1105	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	130
1106	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	130
1107	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	130
1108	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	130
1032	2026-05-28 16:23:57.878175	2026-05-28 16:25:58.262948	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	PRESENTADO	0	\N	122
1031	2026-05-28 16:23:57.878175	2026-05-28 16:26:20.329447	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	PRESENTADO	0	\N	122
1041	2026-05-28 16:27:48.389377	2026-05-28 16:28:02.349672	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	PRESENTADO	0	\N	123
1033	2026-05-28 16:27:48.389377	2026-05-28 16:28:08.693691	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	PRESENTADO	0	\N	123
1034	2026-05-28 16:27:48.389377	2026-05-28 16:28:13.454938	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	PRESENTADO	0	\N	123
1040	2026-05-28 16:27:48.389377	2026-05-28 16:28:21.799096	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	PRESENTADO	0	\N	123
1039	2026-05-28 16:27:48.389377	2026-05-28 16:28:27.261889	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	PRESENTADO	0	\N	123
1038	2026-05-28 16:27:48.389377	2026-05-28 16:28:33.570228	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	PRESENTADO	0	\N	123
1037	2026-05-28 16:27:48.389377	2026-05-28 16:28:41.561652	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	PRESENTADO	0	\N	123
1035	2026-05-28 16:27:48.389377	2026-05-28 16:28:48.020425	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	PRESENTADO	0	\N	123
1036	2026-05-28 16:27:48.389377	2026-05-28 16:28:52.413665	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	PRESENTADO	0	\N	123
1042	2026-05-28 16:31:47.601085	2026-05-28 16:33:39.760011	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	2		124
1043	2026-05-28 16:31:47.601085	2026-05-28 16:33:47.834687	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	17		124
1044	2026-05-28 16:31:47.601085	2026-05-28 16:35:46.003836	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	3		124
1069	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	127
1070	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	127
1071	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	127
1045	2026-05-28 16:31:47.601085	2026-05-28 16:37:16.305297	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	3		124
1072	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	127
1046	2026-05-28 16:31:47.601085	2026-05-28 16:37:33.328525	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	5		124
1047	2026-05-28 16:31:47.601085	2026-05-28 16:38:06.55974	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	2		124
1050	2026-05-28 16:31:47.601085	2026-05-28 16:38:29.781111	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	APROBADO	2		124
1049	2026-05-28 16:31:47.601085	2026-05-28 16:38:59.427078	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	APROBADO	2		124
1048	2026-05-28 16:31:47.601085	2026-05-28 16:39:13.863633	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	APROBADO	1		124
1051	2026-05-28 20:24:14.110267	2026-05-28 20:24:14.110267	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	125
1052	2026-05-28 20:24:14.110267	2026-05-28 20:24:14.110267	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	125
1053	2026-05-28 20:24:14.110267	2026-05-28 20:24:14.110267	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	125
1054	2026-05-28 20:24:14.110267	2026-05-28 20:24:14.110267	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	125
1055	2026-05-28 20:24:14.110267	2026-05-28 20:24:14.110267	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	125
1056	2026-05-28 20:24:14.110267	2026-05-28 20:24:14.110267	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	125
1057	2026-05-28 20:24:14.110267	2026-05-28 20:24:14.110267	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	125
1058	2026-05-28 20:24:14.110267	2026-05-28 20:24:14.110267	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	125
1059	2026-05-28 20:24:14.110267	2026-05-28 20:24:14.110267	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	125
1073	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	127
1074	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	127
1075	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	127
1076	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	127
1077	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	127
1060	2026-05-28 20:28:07.273593	2026-05-28 20:29:50.384386	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	1		126
1061	2026-05-28 20:28:07.273593	2026-05-28 20:29:54.590236	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	5		126
1062	2026-05-28 20:28:07.273593	2026-05-28 20:30:22.336239	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	3		126
1063	2026-05-28 20:28:07.273593	2026-05-28 20:30:26.179852	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	3		126
1064	2026-05-28 20:28:07.273593	2026-05-28 20:30:27.955631	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	2		126
1065	2026-05-28 20:28:07.273593	2026-05-28 20:30:30.410314	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	2		126
1066	2026-05-28 20:28:07.273593	2026-05-28 20:30:33.821131	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	APROBADO	4		126
1067	2026-05-28 20:28:07.273593	2026-05-28 20:30:36.191487	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	APROBADO	3		126
1068	2026-05-28 20:28:07.273593	2026-05-28 20:30:56.26201	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	APROBADO	1		126
1078	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	127
1079	2026-05-28 20:57:51.218886	2026-05-28 20:57:51.218886	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	127
1080	2026-06-07 19:45:27.700399	2026-06-07 19:45:27.700399	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	128
1081	2026-06-07 19:45:27.700399	2026-06-07 19:45:27.700399	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	128
1082	2026-06-07 19:45:27.700399	2026-06-07 19:45:27.700399	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	128
1083	2026-06-07 19:45:27.700399	2026-06-07 19:45:27.700399	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	128
1084	2026-06-07 19:45:27.700399	2026-06-07 19:45:27.700399	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	128
1085	2026-06-07 19:45:27.700399	2026-06-07 19:45:27.700399	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	128
1086	2026-06-07 19:45:27.700399	2026-06-07 19:45:27.700399	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	128
1087	2026-06-07 19:45:27.700399	2026-06-07 19:45:27.700399	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	128
1088	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	129
1089	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	129
1090	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	129
1091	2026-06-07 19:47:48.911207	2026-06-07 19:47:48.911207	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	129
1109	2026-06-07 19:53:22.7479	2026-06-07 19:53:22.7479	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	130
1110	2026-06-07 19:58:03.885972	2026-06-07 19:58:03.885972	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	131
1111	2026-06-07 19:58:03.885972	2026-06-07 19:58:03.885972	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	131
1112	2026-06-07 19:58:03.885972	2026-06-07 19:58:03.885972	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	131
1113	2026-06-07 19:58:03.885972	2026-06-07 19:58:03.885972	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	131
1114	2026-06-07 19:58:03.885972	2026-06-07 19:58:03.885972	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	131
1115	2026-06-07 19:58:03.885972	2026-06-07 19:58:03.885972	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	131
1116	2026-06-07 19:58:03.885972	2026-06-07 19:58:03.885972	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	131
1117	2026-06-07 19:58:03.885972	2026-06-07 19:58:03.885972	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	131
1118	2026-06-07 19:58:03.885972	2026-06-07 19:58:03.885972	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	131
1119	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	132
1120	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	132
1121	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	132
1122	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	132
1123	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	132
1124	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	132
1125	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	132
1126	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	132
1127	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	132
1128	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	132
1129	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	132
1130	2026-06-07 20:12:27.600015	2026-06-07 20:12:27.600015	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	132
1131	2026-06-07 20:16:43.406741	2026-06-07 20:16:43.406741	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	133
1132	2026-06-07 20:16:43.406741	2026-06-07 20:16:43.406741	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	133
1133	2026-06-07 20:16:43.406741	2026-06-07 20:16:43.406741	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	133
1134	2026-06-07 20:16:43.406741	2026-06-07 20:16:43.406741	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	133
1135	2026-06-07 20:16:43.406741	2026-06-07 20:16:43.406741	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	133
1136	2026-06-07 20:16:43.406741	2026-06-07 20:16:43.406741	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	133
1137	2026-06-07 20:16:43.406741	2026-06-07 20:16:43.406741	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	133
1138	2026-06-07 20:16:43.406741	2026-06-07 20:16:43.406741	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	133
1139	2026-06-07 20:16:43.406741	2026-06-07 20:16:43.406741	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	133
1140	2026-06-07 20:37:45.222523	2026-06-07 20:37:45.222523	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	134
1141	2026-06-07 20:37:45.222523	2026-06-07 20:37:45.222523	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	134
1142	2026-06-07 20:37:45.222523	2026-06-07 20:37:45.222523	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	134
1143	2026-06-07 20:37:45.222523	2026-06-07 20:37:45.222523	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	134
1144	2026-06-07 20:37:45.222523	2026-06-07 20:37:45.222523	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	134
1145	2026-06-07 20:37:45.222523	2026-06-07 20:37:45.222523	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	134
1146	2026-06-07 20:37:45.222523	2026-06-07 20:37:45.222523	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	134
1147	2026-06-07 20:37:45.222523	2026-06-07 20:37:45.222523	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	134
1148	2026-06-07 20:37:45.222523	2026-06-07 20:37:45.222523	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	134
1149	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	135
1150	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	135
1151	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	135
1152	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	135
1153	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	135
1154	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	135
1155	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	135
1156	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	135
1157	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	135
1158	2026-06-07 20:41:08.482908	2026-06-07 20:41:08.482908	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	135
1159	2026-06-08 03:38:36.223659	2026-06-08 03:38:36.223659	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	136
1160	2026-06-08 03:38:36.223659	2026-06-08 03:38:36.223659	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	136
1161	2026-06-08 03:38:36.223659	2026-06-08 03:38:36.223659	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	136
1162	2026-06-08 03:38:36.223659	2026-06-08 03:38:36.223659	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	136
1163	2026-06-08 03:38:36.223659	2026-06-08 03:38:36.223659	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	136
1164	2026-06-08 03:38:36.223659	2026-06-08 03:38:36.223659	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	136
1165	2026-06-08 03:38:36.223659	2026-06-08 03:38:36.223659	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	136
1166	2026-06-08 03:38:36.223659	2026-06-08 03:38:36.223659	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	136
1167	2026-06-08 03:38:36.223659	2026-06-08 03:38:36.223659	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	136
1168	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	137
1169	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	137
1170	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	137
1171	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	137
1172	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	137
1173	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	137
1174	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	137
1175	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	137
1176	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	137
1177	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	137
1178	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	137
1179	2026-06-08 03:46:24.436135	2026-06-08 03:46:24.436135	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	137
1180	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	138
1181	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	138
1182	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	138
1183	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	138
1184	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	138
1185	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	138
1186	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	138
1187	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	138
1188	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	138
1189	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	138
1190	2026-06-08 04:11:51.097272	2026-06-08 04:11:51.097272	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	138
1191	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	139
1192	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	139
1193	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	139
1194	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	139
1195	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	139
1196	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	139
1197	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	139
1198	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	139
1199	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	139
1200	2026-06-08 04:34:56.708296	2026-06-08 04:34:56.708296	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	139
1201	2026-06-08 05:20:43.963468	2026-06-08 05:20:43.963468	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	140
1202	2026-06-08 05:20:43.963468	2026-06-08 05:20:43.963468	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	140
1203	2026-06-08 05:20:43.963468	2026-06-08 05:20:43.963468	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	140
1204	2026-06-08 05:20:43.963468	2026-06-08 05:20:43.963468	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	140
1205	2026-06-08 05:20:43.963468	2026-06-08 05:20:43.963468	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	140
1206	2026-06-08 05:20:43.963468	2026-06-08 05:20:43.963468	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	140
1207	2026-06-08 05:20:43.963468	2026-06-08 05:20:43.963468	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	140
1208	2026-06-08 05:20:43.963468	2026-06-08 05:20:43.963468	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	140
1209	2026-06-08 05:20:43.963468	2026-06-08 05:20:43.963468	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	140
1210	2026-06-08 05:38:42.469939	2026-06-08 05:38:42.469939	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	141
1211	2026-06-08 05:38:42.469939	2026-06-08 05:38:42.469939	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	141
1212	2026-06-08 05:38:42.469939	2026-06-08 05:38:42.469939	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	141
1213	2026-06-08 05:38:42.469939	2026-06-08 05:38:42.469939	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	141
1214	2026-06-08 05:38:42.469939	2026-06-08 05:38:42.469939	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	141
1215	2026-06-08 05:38:42.469939	2026-06-08 05:38:42.469939	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	141
1216	2026-06-08 05:38:42.469939	2026-06-08 05:38:42.469939	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	141
1217	2026-06-08 05:38:42.469939	2026-06-08 05:38:42.469939	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	141
1218	2026-06-08 05:38:42.469939	2026-06-08 05:38:42.469939	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	141
1219	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	142
1220	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	142
1221	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	142
1222	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	142
1223	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	142
1224	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	142
1225	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	142
1226	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	142
1227	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	142
1228	2026-06-08 05:45:41.022277	2026-06-08 05:45:41.022277	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	142
1229	2026-06-08 05:49:22.44443	2026-06-08 05:49:22.44443	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	143
1230	2026-06-08 05:49:22.44443	2026-06-08 05:49:22.44443	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	143
1231	2026-06-08 05:49:22.44443	2026-06-08 05:49:22.44443	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	143
1232	2026-06-08 05:49:22.44443	2026-06-08 05:49:22.44443	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	143
1233	2026-06-08 05:49:22.44443	2026-06-08 05:49:22.44443	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	143
1234	2026-06-08 05:49:22.44443	2026-06-08 05:49:22.44443	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	143
1235	2026-06-08 05:49:22.44443	2026-06-08 05:49:22.44443	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	143
1236	2026-06-08 05:49:22.44443	2026-06-08 05:49:22.44443	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	143
1237	2026-06-08 05:49:22.44443	2026-06-08 05:49:22.44443	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	143
1238	2026-06-08 05:56:37.071594	2026-06-08 05:56:37.071594	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	144
1239	2026-06-08 05:56:37.071594	2026-06-08 05:56:37.071594	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	144
1240	2026-06-08 05:56:37.071594	2026-06-08 05:56:37.071594	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	144
1241	2026-06-08 05:56:37.071594	2026-06-08 05:56:37.071594	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	144
1242	2026-06-08 05:56:37.071594	2026-06-08 05:56:37.071594	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	144
1243	2026-06-08 05:56:37.071594	2026-06-08 05:56:37.071594	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	144
1244	2026-06-08 05:56:37.071594	2026-06-08 05:56:37.071594	\N	CONFIDENCIALIDAD	Declaratoria de Compromiso de Confidencialidad	NO_PRESENTADO	0	\N	144
1245	2026-06-08 05:56:37.071594	2026-06-08 05:56:37.071594	\N	CONFLICTO_INTERES	Declaración de Conflicto de Interés	NO_PRESENTADO	0	\N	144
1246	2026-06-08 05:56:37.071594	2026-06-08 05:56:37.071594	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	144
1247	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	NO_PRESENTADO	0	\N	145
1248	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	NO_PRESENTADO	0	\N	145
1249	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	NO_PRESENTADO	0	\N	145
1250	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	NO_PRESENTADO	0	\N	145
1251	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	NO_PRESENTADO	0	\N	145
1252	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	NO_PRESENTADO	0	\N	145
1253	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	NO_PRESENTADO	0	\N	145
1254	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	NO_PRESENTADO	0	\N	145
1255	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	ANEXO_5	Carta de Interés Institucional (Anexo 5)	NO_PRESENTADO	0	\N	145
1256	2026-06-08 06:04:58.90608	2026-06-08 06:04:58.90608	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	NO_PRESENTADO	0	\N	145
1257	2026-06-08 06:13:35.733328	2026-06-08 06:18:27.638838	\N	ANEXO_1	Anexo 1: Solicitud de Evaluación	APROBADO	1		146
1265	2026-06-08 06:13:35.733328	2026-06-08 06:18:29.630473	\N	FICHA_INTERVENCION	Ficha Descriptiva de la Intervención y Riesgos	APROBADO	1		146
1264	2026-06-08 06:13:35.733328	2026-06-08 06:18:31.258634	\N	CONSENTIMIENTO_COM	Consentimiento Colectivo o Comunitario (Líder/Asamblea)	APROBADO	1		146
1258	2026-06-08 06:13:35.733328	2026-06-08 06:18:33.127062	\N	ANEXO_2	Anexo 2: Formulario de Protocolo	APROBADO	1		146
1259	2026-06-08 06:13:35.733328	2026-06-08 06:18:36.666384	\N	CONSENTIMIENTO	Formulario de Consentimiento Informado	APROBADO	1		146
1261	2026-06-08 06:13:35.733328	2026-06-08 06:18:38.851878	\N	CV_INVESTIGADORES	Currículos Vitae de Investigadores	APROBADO	1		146
1260	2026-06-08 06:13:35.733328	2026-06-08 06:18:40.429194	\N	INSTRUMENTOS	Instrumentos de Investigación (Fichas, encuestas, manuales)	APROBADO	1		146
1262	2026-06-08 06:13:35.733328	2026-06-08 06:18:43.381977	\N	ANEXO_4	Declaración de Responsabilidad (Anexo 4)	APROBADO	1		146
1263	2026-06-08 06:13:35.733328	2026-06-08 06:18:46.500597	\N	TRADUCCION_ANCESTRAL	Traducción a idiomas ancestrales	APROBADO	1		146
\.


--
-- TOC entry 4200 (class 0 OID 23991)
-- Dependencies: 253
-- Data for Name: protocolos; Type: TABLE DATA; Schema: public; Owner: ceish_user
--

COPY public.protocolos (id, tipo_estudio_id, nivel_riesgo_id, investigador_principal_id, estado_id, fecha_aprobacion, fecha_vencimiento, fecha_finalizacion, duracion_estudio_meses, poblacion_vulnerable, utiliza_muestras_biologicas, multicentrico, creado_en, actualizado_en, eliminado_en, monto_financiamiento, fuentes_financiamiento, fecha_estimada_inicio, fecha_estimada_fin, fecha_limite_renovacion, cobertura_geografica, titulo, tipo_revision, declaracion_no_iniciado, fecha_declaracion_no_iniciado, ip_declaracion_no_iniciado, patrocinador_ruc, patrocinador_telefono_institucional, patrocinador_direccion, patrocinador_pagina_web, patrocinador_organo_ejecutor, tiene_instituciones_externas, poblacion_indigena, nivel_riesgo_confirmado, sometimiento_tiempos_aceptado, fecha_sometimiento_tiempos, ip_sometimiento_tiempos, codigo_ceish) FROM stdin;
128	5	\N	34	\N	\N	\N	\N	\N	f	t	t	2026-06-07 19:45:27.465282	2026-06-07 19:45:27.465282	\N	0.00	\N	\N	\N	\N	\N	Cloudflare Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \nde hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-06-07 14:45:27.461	::1	\N	\N	\N		\N	f	f	f	f	\N	\N	\N
133	6	\N	34	\N	\N	\N	\N	\N	t	t	t	2026-06-07 20:16:43.326656	2026-06-07 20:16:43.326656	\N	0.00	\N	\N	\N	\N	\N	 sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \nde hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-06-07 15:16:43.319	::1	\N	\N	\N		\N	f	f	f	f	\N	\N	\N
136	6	\N	34	\N	\N	\N	\N	\N	f	t	t	2026-06-08 03:38:36.152758	2026-06-08 03:38:36.152758	\N	0.00	\N	\N	\N	\N	\N	ceish-espoch-frontendceish-espoch-frontend  p1	\N	t	2026-06-07 22:38:36.155	::1	\N	\N	\N		\N	f	f	f	f	\N	\N	\N
141	6	\N	34	\N	\N	\N	\N	\N	t	t	f	2026-06-08 05:38:42.375857	2026-06-08 05:38:42.375857	\N	0.00	\N	\N	\N	\N	\N	y_eliminado_en", "StudyTypeOrmEntity"."	\N	t	2026-06-08 00:38:42.348	::1	\N	\N	\N		\N	f	f	f	f	\N	\N	\N
146	6	\N	34	13	\N	\N	\N	\N	f	f	f	2026-06-08 06:13:35.674423	2026-06-08 06:21:37.8815	\N	0.00	\N	\N	\N	\N	\N	Nuevo Protocolo\nComplete la información básica y cargue la documentación requerida por el CEISH.\n\n1\nInforma	\N	t	2026-06-08 01:13:35.663	::1	\N	\N	\N		\N	f	t	f	t	2026-06-08 01:20:37.531	::1	CEISH-ESPOCH-EI-009-2026
1	\N	\N	6	\N	\N	\N	\N	\N	f	f	f	2026-04-16 09:29:59.477376	2026-04-16 09:29:59.477376	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	\N	\N	TEMP-001
4	8	5	28	\N	\N	\N	\N	1	t	t	t	2026-05-06 12:00:55.287199	2026-05-06 12:00:55.307824	\N	0.00	\N	\N	\N	\N	PROVINCIAL	fdgdsfgsdfgdsfgsdfgdfgd	\N	t	2026-05-06 07:00:55.303	::ffff:192.168.1.103	5464536546546	0975765456	ghjghjh		ghjghjghj	t	f	f	f	\N	\N	\N
129	6	\N	34	\N	\N	\N	\N	\N	t	f	t	2026-06-07 19:47:48.857209	2026-06-07 19:47:48.857209	\N	0.00	\N	\N	\N	\N	\N	Claudflare Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-06-07 14:47:48.849	::1	\N	\N	\N		\N	f	t	f	f	\N	\N	\N
134	6	\N	34	\N	\N	\N	\N	\N	f	f	t	2026-06-07 20:37:45.165061	2026-06-07 20:37:45.165061	\N	0.00	\N	\N	\N	\N	\N	sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \nde hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-06-07 15:37:45.159	::1	\N	\N	\N		\N	f	t	f	f	\N	\N	\N
137	6	\N	34	\N	\N	\N	\N	\N	t	f	f	2026-06-08 03:46:24.375289	2026-06-08 03:46:24.375289	\N	0.00	\N	\N	\N	\N	\N	dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd	\N	t	2026-06-07 22:46:24.366	::1	\N	\N	\N		\N	t	t	f	f	\N	\N	\N
142	6	\N	34	\N	\N	\N	\N	\N	f	f	f	2026-06-08 05:45:40.968753	2026-06-08 05:45:40.968753	\N	0.00	\N	\N	\N	\N	\N	 Para solucionar esto, necesitas actualizar las llaves de la   \n  API de R2:	\N	t	2026-06-08 00:45:40.947	::1	\N	\N	\N		\N	t	t	f	f	\N	\N	\N
33	8	7	28	\N	\N	\N	\N	1	t	f	f	2026-05-16 08:15:54.168264	2026-05-16 08:15:54.191574	\N	0.00	\N	\N	\N	\N	ZONAL	frrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr	\N	t	2026-05-16 03:15:54.174	::ffff:192.168.1.104	3333333333333	0933333333	dddddddddddd		dddddddddd	f	f	f	f	\N	\N	\N
120	6	\N	34	\N	\N	\N	\N	\N	f	f	f	2026-05-27 14:14:13.280069	2026-05-27 14:24:29.376918	\N	0.00	\N	\N	\N	\N	\N	NUEVO PROTOCOLO DE PRUEBA FILTRO CORRECTO	\N	t	2026-05-27 09:14:13.064	::ffff:192.168.1.104	\N	\N	\N		\N	f	t	f	f	\N	\N	\N
130	6	\N	34	\N	\N	\N	\N	\N	t	f	t	2026-06-07 19:53:22.691948	2026-06-07 19:53:22.691948	\N	0.00	\N	\N	\N	\N	\N	Clould Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-06-07 14:53:22.685	::1	\N	\N	\N		\N	f	t	f	f	\N	\N	\N
135	6	\N	34	\N	\N	\N	\N	\N	f	t	f	2026-06-07 20:41:08.423637	2026-06-07 20:41:08.423637	\N	0.00	\N	\N	\N	\N	\N	Error al subir documento técnico.jjjjjjjjjjjj	\N	t	2026-06-07 15:41:08.423	::1	\N	\N	\N		\N	t	f	f	f	\N	\N	\N
138	6	\N	34	\N	\N	\N	\N	\N	f	t	f	2026-06-08 04:11:51.03011	2026-06-08 04:11:51.03011	\N	0.00	\N	\N	\N	\N	\N	06060973350606097335 km	\N	t	2026-06-07 23:11:51.02	::1	\N	\N	\N		\N	f	t	f	f	\N	\N	\N
143	6	\N	34	\N	\N	\N	\N	\N	f	f	f	2026-06-08 05:49:22.350498	2026-06-08 05:49:22.350498	\N	0.00	\N	\N	\N	\N	\N	 Para solucionar esto, necesitas actualizar las llaves de la   \n  API de R2:	\N	t	2026-06-08 00:49:22.363	::1	\N	\N	\N		\N	f	t	f	f	\N	\N	\N
7	6	5	28	\N	\N	\N	\N	1	t	t	t	2026-05-06 12:31:59.437915	2026-05-06 12:31:59.465477	\N	0.00	\N	\N	\N	\N	LOCAL	adfsdfsferadfsdfsferadfsdfsferadfsdfsferadfsdfsferadfsdfsferadfsdfsferadfsdfsferadfsdfsferadfsdfsferadfsdfsfer	\N	t	2026-05-06 07:31:59.431	::ffff:192.168.1.103	5647456456466	0986767765	hfghjghj		ghjghjfgh	f	f	f	f	\N	\N	\N
8	5	5	28	\N	\N	\N	\N	1	t	t	f	2026-05-06 12:40:09.300255	2026-05-06 12:40:09.325966	\N	0.00	\N	\N	\N	\N	PROVINCIAL	sdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdf	\N	t	2026-05-06 07:40:09.299	::ffff:192.168.1.103	3454353434534	0964564564	fghfghfyh		jhghnf	f	f	f	f	\N	\N	\N
9	6	4	28	\N	\N	\N	\N	1	t	t	t	2026-05-06 12:47:03.262095	2026-05-06 12:47:03.289719	\N	0.00	\N	\N	\N	\N	PROVINCIAL	fdgdsfgdfgfdgdsfgdfgfdgdsfgdfgfdgdsfgdfgfdgdsfgdfgfdgdsfgdfgfdgdsfgdfgfdgdsfgdfgfdgdsfgdfg	\N	t	2026-05-06 07:47:03.222	::ffff:192.168.1.103	6754436456346	0956754675	ghjfghj		ghjfghj	t	f	f	f	\N	\N	\N
10	7	4	28	\N	\N	\N	\N	1	t	t	t	2026-05-06 13:13:31.998307	2026-05-06 13:13:32.022551	\N	0.00	\N	\N	\N	\N	PROVINCIAL	sdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdf	\N	t	2026-05-06 08:13:31.952	::ffff:192.168.1.103	8966454634564	0965756756	jkljklhjk		ljklhjkljkl	f	f	f	f	\N	\N	\N
131	5	\N	34	\N	\N	\N	\N	\N	f	f	t	2026-06-07 19:58:03.835435	2026-06-07 19:58:03.835435	\N	0.00	\N	\N	\N	\N	\N	Clould Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \nde hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-06-07 14:58:03.834	::1	\N	\N	\N		\N	t	t	f	f	\N	\N	\N
139	6	\N	34	\N	\N	\N	\N	\N	f	t	f	2026-06-08 04:34:56.666059	2026-06-08 04:34:56.666059	\N	0.00	\N	\N	\N	\N	\N	sssssssssssssssssssssssssssssssssssssssssssssssssss	\N	t	2026-06-07 23:34:56.601	::1	\N	\N	\N		\N	t	f	f	f	\N	\N	\N
144	6	\N	34	\N	\N	\N	\N	\N	f	t	f	2026-06-08 05:56:36.984861	2026-06-08 05:56:36.984861	\N	0.00	\N	\N	\N	\N	\N	Utiliza endpoints específicos de la jurisdicción para clientes S3:\nDefaultUnión Europea (UE)	\N	t	2026-06-08 00:56:36.977	::1	\N	\N	\N		\N	f	f	f	f	\N	\N	\N
106	6	5	28	\N	\N	\N	\N	1	t	f	f	2026-05-22 09:42:23.546219	2026-05-26 19:02:33.908676	\N	0.00	\N	\N	\N	\N	NACIONAL	ddddddddddddddddddddddddddddddddddfffffff	\N	t	2026-05-22 04:42:23.549	::ffff:192.168.1.102	4444444444444	0944444444	fffffffffffffffffffff		fffffffffffffff	f	t	f	f	\N	\N	\N
5	6	5	28	\N	\N	\N	\N	1	t	t	t	2026-05-06 12:02:16.208318	2026-05-06 12:02:16.237865	\N	0.00	\N	\N	\N	\N	PROVINCIAL	fdgdsfgsdfgdsfgsdfgdfgd	\N	t	2026-05-06 07:02:16.22	::ffff:192.168.1.103	5464536546546	0975765456	ghjghjh		ghjghjghj	t	f	f	f	\N	\N	\N
6	6	6	28	\N	\N	\N	\N	1	t	t	f	2026-05-06 12:12:45.070971	2026-05-06 12:12:45.095655	\N	0.00	\N	\N	\N	\N	PROVINCIAL	dsfdffggsgdsfdsfdffggsgdsfdsfdffggsgdsfdsfdffggsgdsfdsfdffggsgdsf	\N	t	2026-05-06 07:12:45.08	::ffff:192.168.1.103	3423141234234	0967567654	fhjjfhfgjhj		hgjfgjfh	f	f	f	f	\N	\N	\N
11	6	5	29	\N	\N	\N	\N	12	t	t	f	2026-05-13 03:49:03.427155	2026-05-13 03:49:03.455146	\N	100.00	\N	\N	\N	\N	PROVINCIAL	hgfghfdghhgfghfdghhgfghfdghhgfghfdghhgfghfdghhgfghfdghhgfghfdghhgfghfdgh	\N	t	2026-05-12 22:49:00.481	::ffff:192.168.1.103	0879786775675	0978567567	456fghfgh		hfghfhg	f	t	f	f	\N	\N	\N
12	7	6	28	\N	\N	\N	\N	1	t	t	t	2026-05-13 14:12:47.986396	2026-05-13 14:12:48.119754	\N	0.00	\N	\N	\N	\N	PROVINCIAL	dgfhrthrthrtheertyhertyret	\N	t	2026-05-13 09:12:46.098	::ffff:192.168.1.103	8797567546456	0988888888	56gvhbn		hjgfj	f	t	f	f	\N	\N	\N
13	8	6	28	\N	\N	\N	\N	2	t	f	t	2026-05-15 05:53:41.721676	2026-05-15 05:53:41.79971	\N	1000.00	\N	\N	\N	\N	PROVINCIAL	dssfsdfsdfsdfsdssfsdfsdfsdfsdssfsdfsdfsdfsdssfsdfsdfsdfsdssfsdfsdfsdfs	\N	t	2026-05-15 00:53:42.032	::ffff:192.168.1.104	0920420343892	0923423423	amabato		sadasdasdasdasd	f	t	f	f	\N	\N	\N
14	8	5	28	\N	\N	\N	\N	10	t	t	f	2026-05-15 09:03:26.953649	2026-05-15 09:03:26.985679	\N	100.00	\N	\N	\N	\N	PROVINCIAL	eyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrr	\N	t	2026-05-15 04:03:26.7	::ffff:192.168.1.104	4534534534534	0945345345	dfgdffgdfgdfgdfgdf		gdrggggggggggggggggggggg	f	t	f	f	\N	\N	\N
15	6	7	28	\N	\N	\N	\N	10	t	t	f	2026-05-15 09:14:58.262589	2026-05-15 09:14:58.296912	\N	100.00	\N	\N	\N	\N	PROVINCIAL	aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa	\N	t	2026-05-15 04:14:59.101	::ffff:192.168.1.104	4350345345345	0943543534	dsfsdfds		sdfdsf	f	t	f	f	\N	\N	\N
16	6	7	28	\N	\N	\N	\N	99	t	t	f	2026-05-15 09:28:14.595807	2026-05-15 09:28:14.626697	\N	100.00	\N	\N	\N	\N	PROVINCIAL	ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss	\N	t	2026-05-15 04:28:14.819	::ffff:192.168.1.104	6544444444444	0999999999	ytutyut		utyutu	f	t	f	f	\N	\N	\N
17	7	7	28	\N	\N	\N	\N	12	t	t	t	2026-05-15 09:38:18.823678	2026-05-15 09:38:19.551582	\N	10.00	\N	\N	\N	\N	NACIONAL	dffffffffffffffffffffffffffdffffffffffffffffffffffffffdffffffffffffffffffffffffff	\N	t	2026-05-15 04:38:18.198	::ffff:192.168.1.104	4566666666666	0999999999	ggdffffffffff		vvvvvvvv	f	t	f	f	\N	\N	\N
18	7	8	28	\N	\N	\N	\N	1	t	t	t	2026-05-15 10:17:32.768478	2026-05-15 10:17:32.890604	\N	100.00	\N	\N	\N	\N	NACIONAL	drrrrrrrrrrrssssssssss	\N	t	2026-05-15 05:17:31.882	::ffff:192.168.1.104	0943333333333	0943333333	fdggggg		fddddddddd	t	t	f	f	\N	\N	\N
19	7	6	28	\N	\N	\N	\N	1	t	t	t	2026-05-15 10:27:31.071912	2026-05-15 10:27:31.095652	\N	100.00	\N	\N	\N	\N	PROVINCIAL	dffffffffffffffffffffffdffffffffffffffffffffffdffffffffffffffffffffff	\N	t	2026-05-15 05:27:31.614	::ffff:192.168.1.104	4533333333333	0999999999	eeeeeeeeeeeeeeeeeeeeee		errrrrrrrr	f	t	f	f	\N	\N	\N
20	7	8	28	\N	\N	\N	\N	1	f	f	f	2026-05-15 10:43:54.975287	2026-05-15 10:43:55.005528	\N	220.00	\N	\N	\N	\N	PROVINCIAL	saaaaaaassssssssssssssssssssssss	\N	t	2026-05-15 05:43:54.207	::ffff:192.168.1.104	4355555555555	0955555555	fggggd		gfgh	f	t	f	f	\N	\N	\N
21	7	6	28	\N	\N	\N	\N	1	f	t	f	2026-05-15 10:52:12.747857	2026-05-15 10:52:12.768837	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ddddddddddddddddddzzzzzss	\N	t	2026-05-15 05:52:13.143	::ffff:192.168.1.104	3455555555555	0999999999	dfdddddddddddd		ffffffffff	f	f	f	f	\N	\N	\N
22	8	8	28	\N	\N	\N	\N	1	t	t	f	2026-05-15 11:29:02.705187	2026-05-15 11:29:02.738839	\N	0.00	\N	\N	\N	\N	PROVINCIAL	wwwwwwwwwwwwwwwwwwwwwwwww	\N	t	2026-05-15 06:29:01.657	::ffff:192.168.1.104	5666666666666	0988888888	55555		tttttttttttt	f	t	f	f	\N	\N	\N
23	7	8	28	\N	\N	\N	\N	1	t	t	f	2026-05-15 11:37:09.418638	2026-05-15 11:37:09.5098	\N	0.00	\N	\N	\N	\N	NACIONAL	ssssssssssssssssssssssssssssssssssss	\N	t	2026-05-15 06:37:08.558	::ffff:192.168.1.104	3333333333333	0944444444	4444444444		4444444	f	t	f	f	\N	\N	\N
24	7	8	28	\N	\N	\N	\N	1	t	t	f	2026-05-15 11:38:57.672821	2026-05-15 11:38:57.696553	\N	0.00	\N	\N	\N	\N	NACIONAL	ssssssssssssssssssssssssssssssssssss	\N	t	2026-05-15 06:38:57.784	::ffff:192.168.1.104	3333333333333	0944444444	fdddddddddddddddddddd		fddddddddddddddd	f	t	f	f	\N	\N	\N
25	8	7	28	\N	\N	\N	\N	1	t	t	f	2026-05-15 11:40:10.785714	2026-05-15 11:40:10.813121	\N	0.00	\N	\N	\N	\N	ZONAL	xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx	\N	t	2026-05-15 06:40:11.439	::ffff:192.168.1.104	4444444444455	0977777777	drfffffffffffffffffff		ffffffffffffffffffffffffffffff	f	t	f	f	\N	\N	\N
26	8	7	28	\N	\N	\N	\N	1	f	t	f	2026-05-16 02:11:38.413906	2026-05-16 02:11:38.873177	\N	0.00	\N	\N	\N	\N	ZONAL	assssssssssssssssssssssss	\N	t	2026-05-15 21:11:38.406	::ffff:192.168.1.104	2333333333333	0932222222	fffffffff		vffffffff	f	f	f	f	\N	\N	\N
27	8	7	28	\N	\N	\N	\N	1	t	t	f	2026-05-16 02:17:55.187936	2026-05-16 02:17:55.226644	\N	0.00	\N	\N	\N	\N	ZONAL	dffffffffffffffffffffffffffffffffffffff	\N	t	2026-05-15 21:17:55.203	::ffff:192.168.1.104	3333333333333	0944444444	ddddddddddddddddddddddd		ddddddddddd	f	t	f	f	\N	\N	\N
28	8	7	28	\N	\N	\N	\N	1	t	t	f	2026-05-16 02:19:07.210451	2026-05-16 02:19:07.236192	\N	0.00	\N	\N	\N	\N	ZONAL	dffffffffffffffffffffffffffffffffffffff	\N	t	2026-05-15 21:19:07.201	::ffff:192.168.1.104	3333333333333	0944444444	ddddddddddddddddddddddd		ddddddddddd	f	t	f	f	\N	\N	\N
29	6	8	28	\N	\N	\N	\N	1	f	t	f	2026-05-16 02:23:40.851817	2026-05-16 02:23:40.902955	\N	0.00	\N	\N	\N	\N	NACIONAL	eeeeeeeeeeeeeeeeeeeeeeee	\N	t	2026-05-15 21:23:40.847	::ffff:192.168.1.104	4555555555555	0966666666	hhhhhhhh		hhhh	f	f	f	f	\N	\N	\N
30	6	7	28	\N	\N	\N	\N	1	t	f	f	2026-05-16 07:08:06.344182	2026-05-16 07:08:06.468994	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ddddddddddddddddddddddddd	\N	t	2026-05-16 02:08:06.326	::ffff:192.168.1.104	3333333333333	0944444444	dddddddddd		dddddddddd	f	t	f	f	\N	\N	\N
31	8	6	28	\N	\N	\N	\N	1	f	t	f	2026-05-16 07:30:42.598408	2026-05-16 07:30:42.624558	\N	0.00	\N	\N	\N	\N	PROVINCIAL	gggggggggggggggggddddddddd	\N	t	2026-05-16 02:30:42.608	::ffff:192.168.1.104	4344444444444	0944444444	dddddd		ddddddddd	f	t	f	f	\N	\N	\N
32	8	6	28	\N	\N	\N	\N	1	f	t	f	2026-05-16 07:38:16.43987	2026-05-16 07:38:16.468408	\N	0.00	\N	\N	\N	\N	PROVINCIAL	gggggggggggggggggddddddddd	\N	t	2026-05-16 02:38:16.455	::ffff:192.168.1.104	4344444444444	0944444444	dddddd		ddddddddd	f	t	f	f	\N	\N	\N
66	8	4	28	\N	\N	\N	\N	1	t	f	t	2026-05-16 19:33:56.566454	2026-05-16 19:33:56.604484	\N	0.00	\N	\N	\N	\N	PROVINCIAL	kjllllllllllllllllllllllllllllllllllllllllllllllllllljjjjj	\N	t	2026-05-16 14:33:56.475	::ffff:192.168.1.26	5555555555555	0999999999	ggggggggggggggggggggggggggggggg		gggggggggggggggggggggggggggggggggggggggg	f	f	f	f	\N	\N	\N
67	7	4	28	\N	\N	\N	\N	1	t	f	t	2026-05-16 19:34:35.710648	2026-05-16 19:34:35.73498	\N	0.00	\N	\N	\N	\N	PROVINCIAL	kjllllllllllllllllllllllllllllllllllllllllllllllllllljjjjj	\N	t	2026-05-16 14:34:35.717	::ffff:192.168.1.26	5555555555555	0999999999	ggggggggggggggggggggggggggggggg		gggggggggggggggggggggggggggggggggggggggg	f	f	f	f	\N	\N	\N
68	5	4	28	\N	\N	\N	\N	1	t	f	t	2026-05-16 19:41:07.260075	2026-05-16 19:41:07.284622	\N	0.00	\N	\N	\N	\N	PROVINCIAL	kjllllllllllllllllllllllllllllllllllllllllllllllllllljjjjj	\N	t	2026-05-16 14:41:07.275	::ffff:192.168.1.26	5555555555555	0999999999	ggggggggggggggggggggggggggggggg		gggggggggggggggggggggggggggggggggggggggg	f	f	f	f	\N	\N	\N
69	6	7	28	\N	\N	\N	\N	1	f	t	t	2026-05-17 06:04:23.172921	2026-05-17 06:04:23.200762	\N	0.00	\N	\N	\N	\N	LOCAL	sssssssssssssssssssssssssssssssssssssssss	\N	t	2026-05-17 01:04:23.173	::ffff:192.168.1.9	2222222222222	0922222222	eeeeeeeeeeeeee		eeeeeeeeeeeeeee	f	t	f	f	\N	\N	\N
70	6	7	28	\N	\N	\N	\N	1	t	f	f	2026-05-17 06:24:20.998307	2026-05-17 06:24:21.039031	\N	0.00	\N	\N	\N	\N	ZONAL	ddddddddddddddddddddddddddddddddd	\N	t	2026-05-17 01:24:20.995	::ffff:192.168.1.9	3333333333333	0933333333	ffffffffffffff		ffffffffffffff	f	t	f	f	\N	\N	\N
71	5	7	28	\N	\N	\N	\N	1	t	f	f	2026-05-17 06:27:10.888949	2026-05-17 06:27:10.910754	\N	0.00	\N	\N	\N	\N	ZONAL	ddddddddddddddddddddddddddddddddd	\N	t	2026-05-17 01:27:10.885	::ffff:192.168.1.9	3333333333333	0933333333	ffffffffffffff		ffffffffffffff	f	t	f	f	\N	\N	\N
72	7	7	28	\N	\N	\N	\N	1	t	f	f	2026-05-17 06:27:45.108799	2026-05-17 06:27:45.127562	\N	0.00	\N	\N	\N	\N	ZONAL	ddddddddddddddddddddddddddddddddd	\N	t	2026-05-17 01:27:45.101	::ffff:192.168.1.9	3333333333333	0933333333	ffffffffffffff		ffffffffffffff	f	t	f	f	\N	\N	\N
73	7	6	28	\N	\N	\N	\N	1	f	f	f	2026-05-17 06:35:20.317446	2026-05-17 06:35:20.339823	\N	0.00	\N	\N	\N	\N	LOCAL	dssssssssssssssssddddddddddddddd	\N	t	2026-05-17 01:35:20.316	::ffff:192.168.1.9	2222222222222	0944444444	fffffffffffffffffffff		ffffffffffffffffffffffff	t	t	f	f	\N	\N	\N
74	6	6	28	\N	\N	\N	\N	1	f	f	f	2026-05-17 06:35:56.847205	2026-05-17 06:35:56.878912	\N	0.00	\N	\N	\N	\N	LOCAL	dssssssssssssssssddddddddddddddd	\N	t	2026-05-17 01:35:56.85	::ffff:192.168.1.9	2222222222222	0944444444	fffffffffffffffffffff		ffffffffffffffffffffffff	t	t	f	f	\N	\N	\N
75	6	7	28	\N	\N	\N	\N	1	f	t	f	2026-05-17 15:05:52.629566	2026-05-17 15:05:52.657116	\N	0.00	\N	\N	\N	\N	PROVINCIAL	kkkkkkkkkkkkkkkrrrrrrrrrrrrrrrrrrrk	\N	t	2026-05-17 10:05:52.623	::ffff:192.168.1.9	3333333333333	0933333333	rrrrrrrrrrrrrrrr		rrrrrrrrrrrrrrrrrrrr	f	t	f	f	\N	\N	\N
76	7	7	28	\N	\N	\N	\N	1	f	t	f	2026-05-17 15:06:44.866339	2026-05-17 15:06:44.888296	\N	0.00	\N	\N	\N	\N	PROVINCIAL	kkkkkkkkkkkkkkkrrrrrrrrrrrrrrrrrrrk	\N	t	2026-05-17 10:06:44.751	::ffff:192.168.1.9	3333333333333	0933333333	rrrrrrrrrrrrrrrr		rrrrrrrrrrrrrrrrrrrr	f	t	f	f	\N	\N	\N
77	7	6	28	\N	\N	\N	\N	1	t	t	f	2026-05-17 15:08:29.221661	2026-05-17 15:08:29.250499	\N	0.00	\N	\N	\N	\N	ZONAL	llllllllllllllllllllllll	\N	t	2026-05-17 10:08:29.358	::ffff:192.168.1.9	9888888888888	0999999999	jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj		jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj	f	t	f	f	\N	\N	\N
107	6	5	28	\N	\N	\N	\N	1	t	f	t	2026-05-22 09:58:19.038623	2026-05-26 14:54:44.129733	\N	0.00	\N	\N	\N	\N	PROVINCIAL	hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh	\N	t	2026-05-22 04:58:19.036	::ffff:192.168.1.102	0999999999999	0999999999	ddddddddddddddd		ddddddddddddd	f	f	f	f	\N	\N	CEISH-ESPOCH-EI-002-2026
78	7	8	28	\N	\N	\N	\N	1	t	t	t	2026-05-17 15:13:47.016236	2026-05-17 15:13:47.039485	\N	0.00	\N	\N	\N	\N	ZONAL	rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr	\N	t	2026-05-17 10:13:46.972	::ffff:192.168.1.9	4444444444444	0944444444	fffffffffffffffffffffffffff		ffffffffffffffffffffffffffffffffffffffffffff	f	f	f	f	\N	\N	\N
79	7	8	28	\N	\N	\N	\N	1	f	t	f	2026-05-17 16:02:02.862707	2026-05-17 16:02:02.886481	\N	0.00	\N	\N	\N	\N	PROVINCIAL	hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh	\N	t	2026-05-17 11:02:03.175	::ffff:192.168.1.9	0999999999999	0988888888	jjjjjjjjjjjjjjjjjjjj		jjjjjjjjjjjjjj	f	t	f	f	\N	\N	\N
80	7	6	28	\N	\N	\N	\N	1	t	f	f	2026-05-17 17:09:42.000148	2026-05-17 17:09:42.026936	\N	0.00	\N	\N	\N	\N	PROVINCIAL	eeeeeeeeeeeweeeeeeeeeeeeeeeeeeeeeeeeeeeeeee	\N	t	2026-05-17 12:09:42.28	::ffff:192.168.1.9	5555555555555	0955555555	gggggggggggggggggg		gggggggggggggggggg	f	t	f	f	\N	\N	\N
81	7	7	28	\N	\N	\N	\N	1	t	f	t	2026-05-17 17:36:51.209124	2026-05-17 17:36:51.237148	\N	0.00	\N	\N	\N	\N	ZONAL	jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj	\N	t	2026-05-17 12:36:50.866	::ffff:192.168.1.9	0999999999999	0944444444	fffffffffffffffffffffffffffff		ffffffffffffffffffffffffff	f	f	f	f	\N	\N	\N
82	7	5	28	\N	\N	\N	\N	1	t	f	f	2026-05-17 17:48:52.823697	2026-05-17 17:48:52.864079	\N	0.00	\N	\N	\N	\N	PROVINCIAL	fggggggggggggggggggggggggggggggf	\N	t	2026-05-17 12:48:51.999	::ffff:192.168.1.9	4444444444444	0955555555	gggggggggggg		ggggggggggggggggg	f	t	f	f	\N	\N	\N
83	7	7	28	\N	\N	\N	\N	1	f	t	f	2026-05-17 18:02:31.627362	2026-05-17 18:02:31.652774	\N	0.00	\N	\N	\N	\N	ZONAL	fffffffffffffffffffffffffffffffffffffffffff	\N	t	2026-05-17 13:02:32.267	::ffff:192.168.1.9	5555555555555	0988888888	uuuuuuuuuuuuuuu		uuuuuuuuuuuuuuu	f	t	f	f	\N	\N	\N
84	6	5	28	\N	\N	\N	\N	1	t	f	t	2026-05-18 15:17:17.413303	2026-05-18 15:17:17.443533	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ffffffffffrrrrrrrrrrrr	\N	t	2026-05-18 10:17:17.499	::ffff:192.168.1.100	0999999999999	0999999999	jjjjjjjjjjjjjjjjjj		jjjjjjjjjjj	f	f	f	f	\N	\N	\N
85	7	6	28	\N	\N	\N	\N	1	f	f	f	2026-05-18 15:26:50.221621	2026-05-18 15:26:50.242228	\N	0.00	\N	\N	\N	\N	PROVINCIAL	eeeeeeeeeeeeeeeeeeeeee	\N	t	2026-05-18 10:26:51.095	::ffff:192.168.1.100	4444444444444	0966666666	hhhhhhhhhhhhhhhh		hhhhhhhhhhhhhhhhhhhhh	f	t	f	f	\N	\N	\N
86	7	8	28	\N	\N	\N	\N	1	t	t	t	2026-05-18 18:44:01.182665	2026-05-18 18:44:01.204614	\N	0.00	\N	\N	\N	\N	ZONAL	ffffffffffffffffffffffffff	\N	t	2026-05-18 13:43:58.938	::ffff:192.168.1.100	6666666666666	0977777777	nnnnnnnnnnnn		nnnnnnnnnnnn	f	f	f	f	\N	\N	\N
87	6	8	28	\N	\N	\N	\N	1	t	f	f	2026-05-18 18:52:42.913531	2026-05-18 18:52:42.937443	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ddddddddddddddddddddddddddddd	\N	t	2026-05-18 13:52:40.728	::ffff:192.168.1.100	4444444444444	0944444444	ffffffffffffffffffff		fffffffffffffffffffffff	f	t	f	f	\N	\N	\N
88	7	6	28	\N	\N	\N	\N	1	f	f	f	2026-05-18 19:02:52.401567	2026-05-18 19:02:52.418168	\N	6.00	\N	\N	\N	\N	PROVINCIAL	dddddddddddddddddddddddddddddddddddddddddddddddddddddddd	\N	t	2026-05-18 14:02:52.245	::ffff:192.168.1.100	5555555555555	0955555555	gggggggggggggggggggg		gggggggggggggggggggggg	f	t	f	f	\N	\N	\N
89	6	5	28	\N	\N	\N	\N	1	t	f	t	2026-05-18 19:16:47.390819	2026-05-18 19:16:47.413747	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ddddddddddddddddddddddddddddddddddddddddddddddddddddd	\N	t	2026-05-18 14:16:46.146	::ffff:192.168.1.100	7777777777777	0999999888	ggggggggggggg		ggggggggggggggg	f	f	f	f	\N	\N	\N
90	6	4	28	\N	\N	\N	\N	1	f	f	t	2026-05-18 19:39:15.604874	2026-05-18 19:39:15.621788	\N	0.00	\N	\N	\N	\N	ZONAL	ffffffffffffffffffffffffffffffff	\N	t	2026-05-18 14:39:15.604	::ffff:192.168.1.100	4444444444444	0944444444	444444444444444444444		rrrrrrrrrrrrrrrrrrrrrr	f	t	f	f	\N	\N	\N
91	6	8	28	\N	\N	\N	\N	11	f	f	f	2026-05-18 19:47:28.570771	2026-05-18 19:47:28.589055	\N	0.00	\N	\N	\N	\N	PROVINCIAL	fffffffffffffffffffffffffffffffff	\N	t	2026-05-18 14:47:28.166	::ffff:192.168.1.100	3333333333333	0933333333	eeeeeeeeeee		eeeeeeeeeeeee	f	f	f	f	\N	\N	\N
92	6	6	28	\N	\N	\N	\N	1	f	f	t	2026-05-18 20:14:40.564002	2026-05-18 20:14:40.608215	\N	0.00	\N	\N	\N	\N	PROVINCIAL	gggggggggggggggggggggggggggg	\N	t	2026-05-18 15:14:40.559	::ffff:192.168.1.100	5555555555555	0999999999	hhhhhhhhhhhhh		ggggggggggggg	t	f	f	f	\N	\N	\N
93	7	5	28	\N	\N	\N	\N	1	t	f	f	2026-05-18 20:37:36.093831	2026-05-18 20:37:36.119121	\N	0.00	\N	\N	\N	\N	PROVINCIAL	hjhgggggggggggggggggggggggggggggggg	\N	t	2026-05-18 15:37:36.091	::ffff:192.168.1.100	8999999999999	0999999999	nnnnnnnnnnnnnnnnnnnnnnnn		jjjjjjjjjjjjjjjjjjjjjjjjj	f	f	f	f	\N	\N	\N
94	7	4	28	\N	\N	\N	\N	1	f	f	t	2026-05-18 21:00:43.278751	2026-05-18 21:00:43.29938	\N	0.00	\N	\N	\N	\N	LOCAL	eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee	\N	t	2026-05-18 16:00:43.279	::ffff:192.168.1.100	5555555555555	0955555555	5555555		ttttttt	f	f	f	f	\N	\N	\N
95	7	5	28	\N	\N	\N	\N	1	f	t	f	2026-05-18 21:07:11.1959	2026-05-18 21:07:11.221499	\N	0.00	\N	\N	\N	\N	PROVINCIAL	hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh	\N	t	2026-05-18 16:07:11.196	::ffff:192.168.1.100	0966666666666	0966666666	0966666666666666666		66666666666	t	f	f	f	\N	\N	\N
96	6	4	28	\N	\N	\N	\N	1	t	f	f	2026-05-18 21:23:14.716309	2026-05-18 21:23:14.743509	\N	0.00	\N	\N	\N	\N	ZONAL	ttttttttttttttgggggggggggggggtttt	\N	t	2026-05-18 16:23:14.715	::ffff:192.168.1.100	6666666666666	0966666666	yyyyyyyyyyyyyyy		yyyyyyyyyyyyyyyyyyyyyyyyyyy	f	t	f	f	\N	\N	\N
97	6	5	28	\N	\N	\N	\N	1	t	f	f	2026-05-18 22:29:30.251864	2026-05-18 22:29:30.296547	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ggggggggggggggggggffffffffffffffffffffffffg	\N	t	2026-05-18 17:29:30.259	::ffff:192.168.1.100	0989999999999	0999999999	jjjjjjjjjjjjjjjjj		jjjjjjjjjjjjjjj	f	t	f	f	\N	\N	\N
98	7	5	28	\N	\N	\N	\N	1	t	f	f	2026-05-18 22:39:36.665222	2026-05-18 22:39:36.691946	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ggggggggggggggggggffffffffffffffffffffffffg	\N	t	2026-05-18 17:39:36.666	::ffff:192.168.1.100	0989999999999	0999999999	jjjjjjjjjjjjjjjjj		jjjjjjjjjjjjjjj	f	t	f	f	\N	\N	\N
99	6	4	28	\N	\N	\N	\N	1	f	f	t	2026-05-18 22:49:03.055436	2026-05-18 22:49:03.081191	\N	0.00	\N	\N	\N	\N	LOCAL	fffffffffffffffffffffffffff	\N	t	2026-05-18 17:49:03.046	::ffff:192.168.1.100	0999999999999	0999999999	8777777777777		777777777777	f	t	f	f	\N	\N	\N
3	8	5	28	\N	\N	\N	\N	12	t	t	t	2026-05-06 11:55:07.826495	2026-05-18 23:19:57.06116	\N	0.00	\N	\N	\N	\N	PROVINCIAL	zxfsdfsadfzxfsdfsadfzxfsdfsadfzxfsdfsadfzxfsdfsadfzxfsdfsadfzxfsdfsadfzxfsdfsadf	\N	t	2026-05-06 06:55:07.79	::ffff:192.168.1.103	8967536456456	0975676457	hjkghfgkk		jkfhkjkj	f	f	f	f	\N	\N	\N
102	7	5	28	\N	\N	\N	\N	1	f	f	t	2026-05-19 08:42:31.177232	2026-05-19 08:42:31.398822	\N	34.00	\N	\N	\N	\N	ZONAL	knklnklvfonjdsvovfdnvjkfnjvkfnjkvnfjkndfjkjfdnvjfnvjfnvjdfnjvndfjvndfjvnjfnknklnklvfonjdsvovfdnvjkfnjvkfnjkvnfjkndfjkjfdnvjfnvjfnvjdfnjvndfjvndfjvnjfnknklnklvfonjdsvovfdnvjkfnjvkfnjkvnfjkndfjkjfdnv	\N	t	2026-05-19 03:42:31.131	::ffff:192.168.1.100	0606097335	0935554544	tnhnuyrnur	xhdfjgcvhkhjbhvhjbknl	nrynynuy	f	f	f	f	\N	\N	\N
103	6	7	28	\N	\N	\N	\N	1	f	t	f	2026-05-19 09:01:44.24213	2026-05-19 09:01:44.267046	\N	0.00	\N	\N	\N	\N	ZONAL	nhjmiyujhtgrffrgtnhjmiyujhtgrffrgtnhjmiyujhtgrffrgtnhjmiyujhtgrffrgtnhjmiyujhtgrffrgt	\N	t	2026-05-19 04:01:44.2	::ffff:192.168.1.103	0609854938754	0934738473	frgoitjoigtj		rijnfernijrnfijner	f	f	f	f	\N	\N	\N
104	7	6	28	\N	\N	\N	\N	1	t	f	f	2026-05-22 09:11:21.026338	2026-05-22 09:11:21.058773	\N	0.00	\N	\N	\N	\N	ZONAL	hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh	\N	t	2026-05-22 04:11:21.019	::ffff:192.168.1.102	3333333333333	0933333333	dddddddddddd		dddddddddddd	f	f	f	f	\N	\N	\N
105	6	5	29	\N	\N	\N	\N	1	t	f	f	2026-05-22 09:13:22.812176	2026-05-22 09:13:22.870936	\N	0.00	\N	\N	\N	\N	LOCAL	dddddddddddddddddddddddddddddddddddddd	\N	t	2026-05-22 04:13:22.798	::ffff:192.168.1.103	4444444444444	0944444444	fffffffffffffffffff		ffffffffffffff	f	t	f	f	\N	\N	\N
119	6	\N	34	13	\N	\N	\N	\N	t	t	f	2026-05-27 13:46:41.141399	2026-06-03 00:19:08.607457	\N	0.00	\N	\N	\N	\N	\N	frecuencia de anemia en menores de 6 años en riobamba 	\N	t	2026-05-27 08:46:38.835	::ffff:192.168.1.104	\N	\N	\N		\N	f	t	f	t	2026-06-02 19:18:28.697	::1	CEISH-ESPOCH-EI-007-2026
100	6	5	28	\N	\N	\N	\N	1	f	t	f	2026-05-18 22:57:15.532772	2026-05-23 06:11:38.49721	\N	0.00	\N	\N	\N	\N	PROVINCIAL	gggggggggggggggggggggggggggggggggggg	\N	t	2026-05-18 17:57:15.531	::ffff:192.168.1.100	6666666666666	0966666666	hhhhhhhhh		hhhhhhhhhhh	f	t	f	f	\N	\N	CEISH-ESPOCH-EI-001-2026
111	6	5	28	\N	\N	\N	\N	12	t	f	f	2026-05-26 19:25:22.025343	2026-05-26 21:35:51.680209	\N	0.00	\N	\N	\N	\N	PROVINCIAL	eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee	\N	t	2026-05-26 14:25:22.551	::ffff:192.168.1.102	0999999999999	0977777777	hhhhhhhhhhhhhhh		hhhhhhhhhhhhhhhhhhhhhhhhhhhhh	f	t	f	f	\N	\N	CEISH-ESPOCH-EI-004-2026
108	6	5	28	\N	\N	\N	\N	1	t	f	f	2026-05-22 10:13:45.693327	2026-05-26 19:14:01.395248	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ggggggggggggggggggggggggggggggggggggggggggggg	\N	t	2026-05-22 05:13:45.694	::ffff:192.168.1.102	4444444444444	0944444444	rrrrrrrrrrrrrrr		rrrrrrrrrrrrrrrrr	f	t	f	f	\N	\N	CEISH-ESPOCH-EI-003-2026
109	6	8	28	\N	\N	\N	\N	1	t	f	f	2026-05-23 19:18:00.3792	2026-05-23 19:20:50.38792	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ccccccccccccccccccccccccccccccccccccccccccccccccccc	\N	t	2026-05-23 14:18:00.505	::ffff:192.168.1.10	0999999999999	0999999999	ddddddddddddddddddd		ddddddddddddddddddddddd	f	t	f	f	\N	\N	\N
110	6	7	28	\N	\N	\N	\N	1	t	f	f	2026-05-23 19:44:27.182065	2026-05-23 19:46:49.249298	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ssssssssssssssssssssssssssssssssssssss	\N	t	2026-05-23 14:44:28.211	::ffff:192.168.1.10	3333333333333	0999999999	fffffffffffffff		fffffffffffffffff	f	t	f	f	\N	\N	\N
101	6	4	28	\N	\N	\N	\N	1	t	f	t	2026-05-18 23:07:26.674695	2026-05-23 20:02:20.562071	\N	0.00	\N	\N	\N	\N	PROVINCIAL	ffffffffffffffffffffffffffffff	\N	t	2026-05-18 18:07:26.665	::ffff:192.168.1.100	5555555555555	0955555555	hhhhhhhhhhhhhhhhhhhhhh		5555555555555	f	f	f	f	\N	\N	\N
116	6	\N	28	\N	\N	\N	\N	\N	t	f	t	2026-05-26 21:45:06.237028	2026-05-26 21:48:11.29793	\N	0.00	\N	\N	\N	\N	\N	el pepe de la salida de tu mami 	\N	t	2026-05-26 16:45:06.127	::ffff:192.168.1.102	\N	\N	\N		\N	f	t	f	f	\N	\N	\N
112	6	5	28	\N	\N	\N	\N	1	f	t	f	2026-05-26 20:08:11.921808	2026-05-26 20:12:34.431253	\N	777.00	\N	\N	\N	\N	PROVINCIAL	holajjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj	\N	t	2026-05-26 15:08:11.624	::ffff:192.168.1.104	5841861616516	0985616541	njnikm	,,l,kmkmkl	kmkmkknk	f	f	f	f	\N	\N	CEISH-ESPOCH-EI-005-2026
113	6	7	28	\N	\N	\N	\N	12	f	f	t	2026-05-26 20:31:28.888919	2026-05-26 20:33:58.648661	\N	0.00	\N	\N	\N	\N	PROVINCIAL	gdffffffffffffffffffffffffffffffffffffffffffffffffff	\N	t	2026-05-26 15:31:28.998	::ffff:192.168.1.102	1000000000000	0999999999	ddddddddddddddddddddddddddddd		dddddddddd	f	t	f	f	\N	\N	\N
114	6	\N	28	\N	\N	\N	\N	\N	t	t	t	2026-05-26 21:15:43.289704	2026-05-26 21:15:43.326717	\N	0.00	\N	\N	\N	\N	\N	los niños de la casa de tomas armando	\N	t	2026-05-26 16:15:43.542	::ffff:192.168.1.104	\N	\N	\N		\N	t	t	f	f	\N	\N	\N
115	7	\N	34	\N	\N	\N	\N	\N	t	f	t	2026-05-26 21:22:47.60237	2026-05-26 21:27:57.399409	\N	0.00	\N	\N	\N	\N	\N	la la nuevpo aifvnfk nuevo rotoclo lilicita 	\N	t	2026-05-26 16:22:46.895	::ffff:192.168.1.104	\N	\N	\N		\N	f	t	f	f	\N	\N	CEISH-ESPOCH-EC-001-2026
118	6	\N	28	\N	\N	\N	\N	\N	t	t	f	2026-05-27 07:20:58.461944	2026-05-27 07:20:58.588486	\N	0.00	\N	\N	\N	\N	\N	DDDDDDDDDDDDDDDDDDDDDDDDDDDD	\N	t	2026-05-27 02:20:57.575	::ffff:192.168.1.102	\N	\N	\N		\N	t	t	f	f	\N	\N	\N
117	6	\N	28	\N	\N	\N	\N	\N	f	f	t	2026-05-26 21:59:12.300092	2026-05-27 08:52:23.999876	\N	0.00	\N	\N	\N	\N	\N	los pasos de la sanitación de tomassss	\N	t	2026-05-26 16:59:11.699	::ffff:192.168.1.102	\N	\N	\N		\N	f	t	f	f	\N	\N	CEISH-ESPOCH-EI-006-2026
121	6	\N	28	\N	\N	\N	\N	\N	f	f	f	2026-05-27 14:52:05.132239	2026-05-27 14:54:29.618401	\N	0.00	\N	\N	\N	\N	\N	prueva d knksdnkjf  sdfsdfdfsdfsdfsdf	\N	t	2026-05-27 09:52:05.39	::ffff:192.168.1.102	\N	\N	\N		\N	f	t	f	f	\N	\N	CEISH-ESPOCH-EI-008-2026
122	5	\N	34	\N	\N	\N	\N	\N	t	t	t	2026-05-28 16:23:57.803324	2026-05-28 16:23:57.823633	\N	0.00	\N	\N	\N	\N	\N	Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \nde hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-05-28 11:23:56.95	::ffff:192.168.1.102	\N	\N	\N		\N	f	f	f	f	\N	\N	\N
123	5	\N	34	\N	\N	\N	\N	\N	t	t	t	2026-05-28 16:27:48.34045	2026-05-28 16:28:54.664042	\N	0.00	\N	\N	\N	\N	\N	Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \nde hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-05-28 11:27:48.117	::ffff:192.168.1.102	\N	\N	\N		\N	t	f	f	f	\N	\N	\N
124	5	\N	34	\N	\N	\N	\N	\N	t	t	t	2026-05-28 16:31:47.547884	2026-06-03 01:01:02.725072	\N	0.00	\N	\N	\N	\N	\N	“ P2 Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \nde hemoglobina y hematocrito en estudiantes universitarios”	\N	t	2026-05-28 11:31:48.222	::ffff:192.168.1.102	\N	\N	\N		\N	t	f	f	t	2026-06-02 20:01:02.722	::1	CEISH-ESPOCH-IO-001-2026
125	5	\N	34	\N	\N	\N	\N	\N	t	t	t	2026-05-28 20:24:14.045606	2026-05-28 20:24:14.072442	\N	0.00	\N	\N	\N	\N	\N	P3 Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-05-28 15:24:14.182	::ffff:172.26.235.109	\N	\N	\N		\N	t	f	f	f	\N	\N	\N
126	5	\N	34	13	\N	\N	\N	\N	t	t	t	2026-05-28 20:28:07.177756	2026-06-02 23:57:26.957551	\N	0.00	\N	\N	\N	\N	\N	P3 Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-05-28 15:28:05.405	::ffff:172.26.235.109	\N	\N	\N		\N	t	f	f	t	2026-05-31 15:02:05.167	::ffff:192.168.1.8	CEISH-ESPOCH-IO-002-2026
127	6	\N	34	\N	\N	\N	\N	\N	t	t	t	2026-05-28 20:57:51.170288	2026-05-28 20:57:51.189687	\N	0.00	\N	\N	\N	\N	\N	P4 Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios	\N	t	2026-05-28 15:57:50.349	::ffff:172.26.235.109	\N	\N	\N		\N	f	t	f	f	\N	\N	\N
132	6	\N	34	\N	\N	\N	\N	\N	f	t	f	2026-06-07 20:12:27.539751	2026-06-07 20:12:27.539751	\N	0.00	\N	\N	\N	\N	\N	Error al subir documento técnico.	\N	t	2026-06-07 15:12:27.54	::1	\N	\N	\N		\N	t	t	f	f	\N	\N	\N
140	6	\N	34	\N	\N	\N	\N	\N	t	f	t	2026-06-08 05:20:43.864709	2026-06-08 05:20:43.864709	\N	0.00	\N	\N	\N	\N	\N	la hipótesis del checksum es la más fuerte de todas las que hemos visto hasta ahora.	\N	t	2026-06-08 00:20:43.823	::1	\N	\N	\N		\N	f	f	f	f	\N	\N	\N
145	6	\N	34	\N	\N	\N	\N	\N	f	f	f	2026-06-08 06:04:58.8364	2026-06-08 06:04:58.8364	\N	0.00	\N	\N	\N	\N	\N	p1 de la muestra y la carga en la nube	\N	t	2026-06-08 01:04:58.865	::1	\N	\N	\N		\N	t	t	f	f	\N	\N	\N
\.


--
-- TOC entry 4275 (class 0 OID 45059)
-- Dependencies: 328
-- Data for Name: protocolos_backup; Type: TABLE DATA; Schema: public; Owner: ceish_user
--

COPY public.protocolos_backup (id, tipo_estudio_id, nivel_riesgo_id, investigador_principal_id, estado_id, fecha_aprobacion, fecha_vencimiento, fecha_finalizacion, duracion_estudio_meses, poblacion_vulnerable, utiliza_muestras_biologicas, multicentrico, version_actual, creado_en, actualizado_en, eliminado_en, version, monto_financiamiento, fuentes_financiamiento, fecha_estimada_inicio, fecha_estimada_fin, fecha_limite_renovacion, cobertura_geografica, codigo_ceish, titulo, fecha_recepcion) FROM stdin;
1	\N	\N	6	\N	\N	\N	\N	\N	f	f	f	1	2026-04-16 09:29:59.477376	2026-04-16 09:29:59.477376	\N	1.0	\N	\N	\N	\N	\N	\N	TEMP-001	\N	\N
\.


--
-- TOC entry 4202 (class 0 OID 24028)
-- Dependencies: 255
-- Data for Name: versiones_protocolo; Type: TABLE DATA; Schema: public; Owner: ceish_user
--

COPY public.versiones_protocolo (id, protocolo_id, numero_version, estado_id, fecha_envio, fecha_resolucion, observaciones, plazo_subsanacion_dias, fecha_limite_subsanacion, validado_por, tipo_resolucion_id) FROM stdin;
1	117	1	1	2026-05-27 03:52:19.96	\N	\N	30	\N	\N	\N
2	119	1	1	2026-05-27 08:59:58.071	\N	\N	30	\N	\N	\N
3	121	1	1	2026-05-27 09:54:27.138	\N	\N	30	\N	\N	\N
4	124	1	1	2026-05-28 14:46:13.47	\N	\N	30	\N	\N	\N
5	126	1	1	2026-05-28 15:31:09.646	\N	\N	30	\N	\N	\N
6	106	1	1	2026-05-22 09:42:23.546219	\N	\N	30	\N	\N	\N
7	120	1	1	2026-05-27 14:14:13.280069	\N	\N	30	\N	\N	\N
8	101	1	1	2026-05-18 23:07:26.674695	\N	\N	30	\N	\N	\N
9	20	1	1	2026-05-15 10:43:54.975287	\N	\N	30	\N	\N	\N
10	82	1	1	2026-05-17 17:48:52.823697	\N	\N	30	\N	\N	\N
11	25	1	1	2026-05-15 11:40:10.785714	\N	\N	30	\N	\N	\N
12	26	1	1	2026-05-16 02:11:38.413906	\N	\N	30	\N	\N	\N
13	27	1	1	2026-05-16 02:17:55.187936	\N	\N	30	\N	\N	\N
14	93	1	1	2026-05-18 20:37:36.093831	\N	\N	30	\N	\N	\N
15	11	1	1	2026-05-13 03:49:03.427155	\N	\N	30	\N	\N	\N
16	17	1	1	2026-05-15 09:38:18.823678	\N	\N	30	\N	\N	\N
17	66	1	1	2026-05-16 19:33:56.566454	\N	\N	30	\N	\N	\N
18	89	1	1	2026-05-18 19:16:47.390819	\N	\N	30	\N	\N	\N
19	33	1	1	2026-05-16 08:15:54.168264	\N	\N	30	\N	\N	\N
20	109	1	1	2026-05-23 19:18:00.3792	\N	\N	30	\N	\N	\N
21	31	1	1	2026-05-16 07:30:42.598408	\N	\N	30	\N	\N	\N
22	12	1	1	2026-05-13 14:12:47.986396	\N	\N	30	\N	\N	\N
23	10	1	1	2026-05-06 13:13:31.998307	\N	\N	30	\N	\N	\N
24	18	1	1	2026-05-15 10:17:32.768478	\N	\N	30	\N	\N	\N
25	98	1	1	2026-05-18 22:39:36.665222	\N	\N	30	\N	\N	\N
26	104	1	1	2026-05-22 09:11:21.026338	\N	\N	30	\N	\N	\N
27	102	1	1	2026-05-19 08:42:31.177232	\N	\N	30	\N	\N	\N
28	71	1	1	2026-05-17 06:27:10.888949	\N	\N	30	\N	\N	\N
29	72	1	1	2026-05-17 06:27:45.108799	\N	\N	30	\N	\N	\N
30	83	1	1	2026-05-17 18:02:31.627362	\N	\N	30	\N	\N	\N
31	15	1	1	2026-05-15 09:14:58.262589	\N	\N	30	\N	\N	\N
32	125	1	1	2026-05-28 20:24:14.045606	\N	\N	30	\N	\N	\N
33	77	1	1	2026-05-17 15:08:29.221661	\N	\N	30	\N	\N	\N
34	73	1	1	2026-05-17 06:35:20.317446	\N	\N	30	\N	\N	\N
35	123	1	1	2026-05-28 16:27:48.34045	\N	\N	30	\N	\N	\N
36	13	1	1	2026-05-15 05:53:41.721676	\N	\N	30	\N	\N	\N
37	91	1	1	2026-05-18 19:47:28.570771	\N	\N	30	\N	\N	\N
38	21	1	1	2026-05-15 10:52:12.747857	\N	\N	30	\N	\N	\N
39	5	1	1	2026-05-06 12:02:16.208318	\N	\N	30	\N	\N	\N
40	112	1	1	2026-05-26 20:08:11.921808	\N	\N	30	\N	\N	\N
41	96	1	1	2026-05-18 21:23:14.716309	\N	\N	30	\N	\N	\N
42	107	1	1	2026-05-22 09:58:19.038623	\N	\N	30	\N	\N	\N
43	108	1	1	2026-05-22 10:13:45.693327	\N	\N	30	\N	\N	\N
44	19	1	1	2026-05-15 10:27:31.071912	\N	\N	30	\N	\N	\N
45	85	1	1	2026-05-18 15:26:50.221621	\N	\N	30	\N	\N	\N
46	32	1	1	2026-05-16 07:38:16.43987	\N	\N	30	\N	\N	\N
47	78	1	1	2026-05-17 15:13:47.016236	\N	\N	30	\N	\N	\N
48	100	1	1	2026-05-18 22:57:15.532772	\N	\N	30	\N	\N	\N
49	113	1	1	2026-05-26 20:31:28.888919	\N	\N	30	\N	\N	\N
50	24	1	1	2026-05-15 11:38:57.672821	\N	\N	30	\N	\N	\N
51	68	1	1	2026-05-16 19:41:07.260075	\N	\N	30	\N	\N	\N
52	8	1	1	2026-05-06 12:40:09.300255	\N	\N	30	\N	\N	\N
53	80	1	1	2026-05-17 17:09:42.000148	\N	\N	30	\N	\N	\N
54	110	1	1	2026-05-23 19:44:27.182065	\N	\N	30	\N	\N	\N
55	99	1	1	2026-05-18 22:49:03.055436	\N	\N	30	\N	\N	\N
56	28	1	1	2026-05-16 02:19:07.210451	\N	\N	30	\N	\N	\N
57	94	1	1	2026-05-18 21:00:43.278751	\N	\N	30	\N	\N	\N
58	30	1	1	2026-05-16 07:08:06.344182	\N	\N	30	\N	\N	\N
59	95	1	1	2026-05-18 21:07:11.1959	\N	\N	30	\N	\N	\N
60	122	1	1	2026-05-28 16:23:57.803324	\N	\N	30	\N	\N	\N
61	127	1	1	2026-05-28 20:57:51.170288	\N	\N	30	\N	\N	\N
62	97	1	1	2026-05-18 22:29:30.251864	\N	\N	30	\N	\N	\N
63	114	1	1	2026-05-26 21:15:43.289704	\N	\N	30	\N	\N	\N
64	67	1	1	2026-05-16 19:34:35.710648	\N	\N	30	\N	\N	\N
65	76	1	1	2026-05-17 15:06:44.866339	\N	\N	30	\N	\N	\N
66	69	1	1	2026-05-17 06:04:23.172921	\N	\N	30	\N	\N	\N
67	81	1	1	2026-05-17 17:36:51.209124	\N	\N	30	\N	\N	\N
68	79	1	1	2026-05-17 16:02:02.862707	\N	\N	30	\N	\N	\N
69	90	1	1	2026-05-18 19:39:15.604874	\N	\N	30	\N	\N	\N
70	116	1	1	2026-05-26 21:45:06.237028	\N	\N	30	\N	\N	\N
71	84	1	1	2026-05-18 15:17:17.413303	\N	\N	30	\N	\N	\N
72	74	1	1	2026-05-17 06:35:56.847205	\N	\N	30	\N	\N	\N
73	6	1	1	2026-05-06 12:12:45.070971	\N	\N	30	\N	\N	\N
74	29	1	1	2026-05-16 02:23:40.851817	\N	\N	30	\N	\N	\N
75	16	1	1	2026-05-15 09:28:14.595807	\N	\N	30	\N	\N	\N
76	103	1	1	2026-05-19 09:01:44.24213	\N	\N	30	\N	\N	\N
77	115	1	1	2026-05-26 21:22:47.60237	\N	\N	30	\N	\N	\N
78	4	1	1	2026-05-06 12:00:55.287199	\N	\N	30	\N	\N	\N
79	92	1	1	2026-05-18 20:14:40.564002	\N	\N	30	\N	\N	\N
80	23	1	1	2026-05-15 11:37:09.418638	\N	\N	30	\N	\N	\N
81	1	1	1	2026-04-16 09:29:59.477376	\N	\N	30	\N	\N	\N
82	111	1	1	2026-05-26 19:25:22.025343	\N	\N	30	\N	\N	\N
83	86	1	1	2026-05-18 18:44:01.182665	\N	\N	30	\N	\N	\N
84	22	1	1	2026-05-15 11:29:02.705187	\N	\N	30	\N	\N	\N
85	70	1	1	2026-05-17 06:24:20.998307	\N	\N	30	\N	\N	\N
86	105	1	1	2026-05-22 09:13:22.812176	\N	\N	30	\N	\N	\N
87	75	1	1	2026-05-17 15:05:52.629566	\N	\N	30	\N	\N	\N
88	3	1	1	2026-05-06 11:55:07.826495	\N	\N	30	\N	\N	\N
89	87	1	1	2026-05-18 18:52:42.913531	\N	\N	30	\N	\N	\N
90	14	1	1	2026-05-15 09:03:26.953649	\N	\N	30	\N	\N	\N
91	9	1	1	2026-05-06 12:47:03.262095	\N	\N	30	\N	\N	\N
92	118	1	1	2026-05-27 07:20:58.461944	\N	\N	30	\N	\N	\N
93	88	1	1	2026-05-18 19:02:52.401567	\N	\N	30	\N	\N	\N
94	7	1	1	2026-05-06 12:31:59.437915	\N	\N	30	\N	\N	\N
95	146	1	1	2026-06-08 01:18:51.452	\N	\N	30	\N	\N	\N
\.


--
-- TOC entry 4204 (class 0 OID 24055)
-- Dependencies: 257
-- Data for Name: documentos; Type: TABLE DATA; Schema: recepcion; Owner: ceish_user
--

COPY recepcion.documentos (id, protocolo_id, numero_hojas, hash_checksum, "tamaño_bytes", es_confidencial, validado_secretaria, subido_por, creado_en, ruta, nombre_archivo, tipo_documento_id, requisito_id) FROM stdin;
8	9	\N	\N	155132	t	f	\N	2026-05-06 12:47:03.483817	/uploads/protocols/9/cv_0_PROF SOIEL 0304 NAS SR CARLOS.pdf	PROF SOIEL 0304 NAS SR CARLOS.pdf	\N	\N
9	10	\N	\N	4823736	t	f	\N	2026-05-06 13:13:32.09872	/uploads/protocols/10/cv_0_content.pdf	content.pdf	\N	\N
10	10	\N	\N	423332	t	f	\N	2026-05-06 13:13:42.487998	/uploads/protocols/10/COTIZACIÓN.pdf	COTIZACIÓN.pdf	\N	\N
11	10	\N	\N	485289	t	f	\N	2026-05-06 13:13:48.903073	/uploads/protocols/10/COTIZACIÓN 2.pdf	COTIZACIÓN 2.pdf	\N	\N
12	10	\N	\N	4823736	t	f	\N	2026-05-06 13:13:54.239952	/uploads/protocols/10/content.pdf	content.pdf	\N	\N
13	10	\N	\N	1113981	t	f	\N	2026-05-06 13:14:01.159135	/uploads/protocols/10/Actividad autónoma colaborativa. Diseño arquitectónico de la aplicación (1).pdf	Actividad autónoma colaborativa. Diseño arquitectónico de la aplicación (1).pdf	\N	\N
14	10	\N	\N	9139024	t	f	\N	2026-05-06 13:14:07.715196	/uploads/protocols/10/futureinternet-14-00167.pdf	futureinternet-14-00167.pdf	\N	\N
15	10	\N	\N	3079	t	f	\N	2026-05-06 13:14:13.990194	/uploads/protocols/10/CE-Historias de Usuario-070426-081558.pdf	CE-Historias de Usuario-070426-081558.pdf	\N	\N
16	10	\N	\N	280773	t	f	\N	2026-05-06 13:14:23.630286	/uploads/protocols/10/Diagrama en blanco.pdf	Diagrama en blanco.pdf	\N	\N
17	10	\N	\N	25906	t	f	\N	2026-05-06 13:14:30.04481	/uploads/protocols/10/Plantilla Factibildad y Riesgos.pdf	Plantilla Factibildad y Riesgos.pdf	\N	\N
18	10	\N	\N	1466839	t	f	\N	2026-05-06 13:14:34.979913	/uploads/protocols/10/s12910-026-01379-6 (1).pdf	s12910-026-01379-6 (1).pdf	\N	\N
19	10	\N	\N	1472722	t	f	\N	2026-05-06 13:14:39.902338	/uploads/protocols/10/Requisitos del proyecto.pdf	Requisitos del proyecto.pdf	\N	\N
20	10	\N	\N	82172	t	f	\N	2026-05-06 13:14:46.057201	/uploads/protocols/10/Seguridad_Informática_ Tarea_Ivestigación en clase.pdf	Seguridad_Informática_ Tarea_Ivestigación en clase.pdf	\N	\N
21	10	\N	\N	199610	t	f	\N	2026-05-06 13:14:51.930467	/uploads/protocols/10/LECTURA COMPLEMENTARIA_7462.pdf	LECTURA COMPLEMENTARIA_7462.pdf	\N	\N
22	10	\N	\N	3016107	t	f	\N	2026-05-06 13:14:57.26734	/uploads/protocols/10/s12911-016-0293-4.pdf	s12911-016-0293-4.pdf	\N	\N
23	10	\N	\N	1492750	t	f	\N	2026-05-06 13:15:02.586158	/uploads/protocols/10/10T00214.pdf	10T00214.pdf	\N	\N
24	10	\N	\N	196745	t	f	\N	2026-05-06 13:15:10.475201	/uploads/protocols/10/Writing effective test oracle.pdf	Writing effective test oracle.pdf	\N	\N
25	10	\N	\N	651719	t	f	\N	2026-05-06 13:15:16.679836	/uploads/protocols/10/CE-Historia de usuario de CEISH-150426-141322.pdf	CE-Historia de usuario de CEISH-150426-141322.pdf	\N	\N
26	10	\N	\N	289574	t	f	\N	2026-05-06 13:15:23.189284	/uploads/protocols/10/9. Anexo_D_FC_Kevin_Quilligana_7462.pdf	9. Anexo_D_FC_Kevin_Quilligana_7462.pdf	\N	\N
27	11	\N	\N	187463	t	f	\N	2026-05-13 03:49:03.624111	/uploads/protocols/11/cv_0_Oficio 01.pdf	Oficio 01.pdf	4	\N
28	12	\N	\N	254124	t	f	\N	2026-05-13 14:12:48.314615	/uploads/protocols/12/cv_0_Actividad autónoma colaborativa. Alcance del proyecto 1.pdf	Actividad autónoma colaborativa. Alcance del proyecto 1.pdf	4	\N
29	13	\N	\N	342929	t	f	\N	2026-05-15 05:53:41.893882	/uploads/protocols/13/cv_0_Leyes_de la evolución Del software (1).pdf	Leyes_de la evolución Del software (1).pdf	4	\N
30	29	\N	\N	259872	t	f	28	2026-05-16 02:23:44.107612	/uploads/protocols/29/cv_0_detailed-report_es_it-an-1a-anteproyecto_trabajo_de_titulacion_proyecto_tecnico_fie-4txt (1).pdf	detailed-report_es_it-an-1a-anteproyecto_trabajo_de_titulacion_proyecto_tecnico_fie-4txt (1).pdf	\N	\N
31	30	\N	\N	254124	t	f	28	2026-05-16 07:08:09.57121	/uploads/protocols/30/cv_0_Actividad autónoma colaborativa. Alcance del proyecto 1.pdf	Actividad autónoma colaborativa. Alcance del proyecto 1.pdf	\N	\N
32	31	\N	\N	212805	t	f	28	2026-05-16 07:30:45.73898	/uploads/protocols/31/cv_0_LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	\N
33	32	\N	\N	212805	t	f	28	2026-05-16 07:38:19.573328	/uploads/protocols/32/cv_0_LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	\N
34	33	\N	\N	187463	t	f	28	2026-05-16 08:15:57.491618	/uploads/protocols/33/cv_0_Oficio 001.pdf	Oficio 001.pdf	\N	\N
67	66	\N	\N	1194864	t	f	28	2026-05-16 19:33:59.74835	/uploads/protocols/66/cv_0_Especificación de Casos de Uso.pdf	Especificación de Casos de Uso.pdf	\N	\N
68	67	\N	\N	1194864	t	f	28	2026-05-16 19:34:38.851086	/uploads/protocols/67/cv_0_Especificación de Casos de Uso.pdf	Especificación de Casos de Uso.pdf	\N	\N
69	68	\N	\N	1194864	t	f	28	2026-05-16 19:41:10.372938	/uploads/protocols/68/cv_0_Especificación de Casos de Uso.pdf	Especificación de Casos de Uso.pdf	\N	\N
70	69	\N	\N	115123	t	f	28	2026-05-17 06:04:26.390192	/uploads/protocols/69/cv_0_GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf	GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf	\N	\N
71	70	\N	\N	393477	t	f	28	2026-05-17 06:24:24.176231	/uploads/protocols/70/cv_0_Ejecución de pruebas simbólicas (1).pdf	Ejecución de pruebas simbólicas (1).pdf	\N	\N
72	71	\N	\N	393477	t	f	28	2026-05-17 06:27:14.015291	/uploads/protocols/71/cv_0_Ejecución de pruebas simbólicas (1).pdf	Ejecución de pruebas simbólicas (1).pdf	\N	\N
73	72	\N	\N	393477	t	f	28	2026-05-17 06:27:49.288375	/uploads/protocols/72/cv_0_Ejecución de pruebas simbólicas (1).pdf	Ejecución de pruebas simbólicas (1).pdf	\N	\N
74	73	\N	\N	115123	t	f	28	2026-05-17 06:35:23.508216	/uploads/protocols/73/cv_0_GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf	GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf	\N	\N
75	74	\N	\N	115123	t	f	28	2026-05-17 06:36:00.028419	/uploads/protocols/74/cv_0_GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf	GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf	\N	\N
82	81	\N	\N	284472	t	f	28	2026-05-17 17:36:54.196218	/uploads/protocols/81/cv_0_Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
83	82	\N	\N	1178000	t	f	28	2026-05-17 17:48:55.839817	/uploads/protocols/82/cv_0_7c1c09b4db636a3e278d46175d12c99158c0.pdf	7c1c09b4db636a3e278d46175d12c99158c0.pdf	\N	\N
84	83	\N	\N	284472	t	f	28	2026-05-17 18:02:36.473733	/uploads/protocols/83/cv_0_Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
85	83	\N	\N	393477	t	f	28	2026-05-17 18:02:56.449356	/uploads/protocols/83/Ejecución de pruebas simbólicas.pdf	Ejecución de pruebas simbólicas.pdf	\N	\N
86	83	\N	\N	342929	t	f	28	2026-05-17 18:03:00.981541	/uploads/protocols/83/Leyes_de la evolución Del software (1).pdf	Leyes_de la evolución Del software (1).pdf	\N	\N
87	83	\N	\N	393477	t	f	28	2026-05-17 18:03:11.189806	/uploads/protocols/83/Ejecución de pruebas simbólicas (1).pdf	Ejecución de pruebas simbólicas (1).pdf	\N	\N
88	83	\N	\N	393477	t	f	28	2026-05-17 18:03:16.501033	/uploads/protocols/83/Ejecución de pruebas simbólicas.pdf	Ejecución de pruebas simbólicas.pdf	\N	\N
89	83	\N	\N	655880	t	f	28	2026-05-17 18:03:26.329996	/uploads/protocols/83/Costos - Metodo Montecarlo (3).pdf	Costos - Metodo Montecarlo (3).pdf	\N	\N
90	83	\N	\N	342929	t	f	28	2026-05-17 18:03:30.910521	/uploads/protocols/83/Leyes_de la evolución Del software (1).pdf	Leyes_de la evolución Del software (1).pdf	\N	\N
91	83	\N	\N	268968	t	f	28	2026-05-17 18:03:44.553884	/uploads/protocols/83/detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf	detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf	\N	\N
92	83	\N	\N	284472	t	f	28	2026-05-17 18:03:49.97842	/uploads/protocols/83/Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
93	83	\N	\N	238994	t	f	28	2026-05-17 18:03:58.96498	/uploads/protocols/83/PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	\N	\N
94	83	\N	\N	284472	t	f	28	2026-05-17 18:04:04.733556	/uploads/protocols/83/Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
95	83	\N	\N	284472	t	f	28	2026-05-17 18:04:16.854396	/uploads/protocols/83/Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
96	83	\N	\N	284472	t	f	28	2026-05-17 18:04:22.225123	/uploads/protocols/83/Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
97	83	\N	\N	284472	t	f	28	2026-05-17 18:04:30.052372	/uploads/protocols/83/Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
98	83	\N	\N	940997	t	f	28	2026-05-17 18:05:11.231799	/uploads/protocols/83/Informe_Equipo1 (2).pdf	Informe_Equipo1 (2).pdf	\N	\N
99	83	\N	\N	284472	t	f	28	2026-05-17 18:05:18.34525	/uploads/protocols/83/Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
100	83	\N	\N	284472	t	f	28	2026-05-17 18:05:23.677683	/uploads/protocols/83/Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
101	83	\N	\N	284472	t	f	28	2026-05-17 18:05:30.222555	/uploads/protocols/83/Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
76	75	\N	\N	187463	t	f	28	2026-05-17 15:05:55.715132	/uploads/protocols/75/cv_0_Oficio 01.pdf	Oficio 01.pdf	\N	\N
77	76	\N	\N	187463	t	f	28	2026-05-17 15:06:47.992817	/uploads/protocols/76/cv_0_Oficio 01.pdf	Oficio 01.pdf	\N	\N
78	77	\N	\N	238994	t	f	28	2026-05-17 15:08:32.322569	/uploads/protocols/77/cv_0_PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	\N	\N
79	78	\N	\N	393477	t	f	28	2026-05-17 15:13:50.275847	/uploads/protocols/78/cv_0_Ejecución de pruebas simbólicas.pdf	Ejecución de pruebas simbólicas.pdf	\N	\N
80	79	\N	\N	652952	t	f	28	2026-05-17 16:02:06.577196	/uploads/protocols/79/cv_0_Version 2 Historias de Usuario Historias Técnicas 1.pdf	Version 2 Historias de Usuario Historias Técnicas 1.pdf	\N	\N
81	80	\N	\N	115123	t	f	28	2026-05-17 17:09:46.416249	/uploads/protocols/80/cv_0_GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf	GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf	\N	\N
102	99	\N	\N	\N	t	f	28	2026-05-18 22:49:03.233741	Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
103	99	\N	\N	\N	t	f	28	2026-05-18 22:49:11.192716	Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
104	99	\N	\N	\N	t	f	28	2026-05-18 22:49:20.547236	document_pdf.pdf	document_pdf.pdf	\N	\N
105	99	\N	\N	\N	t	f	28	2026-05-18 22:49:25.793582	Paper_VV.pdf	Paper_VV.pdf	\N	\N
106	99	\N	\N	\N	t	f	28	2026-05-18 22:49:32.127476	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	\N	\N
107	99	\N	\N	\N	t	f	28	2026-05-18 22:49:37.265271	AnÃ¡lisis de SLAM en 2 Diapositivas.pdf	Análisis de SLAM en 2 Diapositivas.pdf	\N	\N
108	99	\N	\N	\N	t	f	28	2026-05-18 22:49:43.316524	AnÃ¡lisis de SLAM en 2 Diapositivas.pdf	Análisis de SLAM en 2 Diapositivas.pdf	\N	\N
109	99	\N	\N	\N	t	f	28	2026-05-18 22:49:49.291029	AnÃ¡lisis de SLAM en 2 Diapositivas.pdf	Análisis de SLAM en 2 Diapositivas.pdf	\N	\N
110	99	\N	\N	\N	t	f	28	2026-05-18 22:49:54.635197	Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
122	101	\N	\N	\N	t	t	28	2026-05-18 23:07:26.839767	Oficio 01.pdf	Oficio 01.pdf	\N	\N
123	101	\N	\N	\N	t	t	28	2026-05-18 23:07:47.515322	document_pdf.pdf	document_pdf.pdf	\N	\N
124	101	\N	\N	\N	t	t	28	2026-05-18 23:07:53.770896	document_pdf.pdf	document_pdf.pdf	\N	\N
112	100	9	\N	\N	t	t	28	2026-05-18 22:57:21.941166	Actividad autÃ³noma colaborativa. Alcance del proyecto 1.pdf	Actividad autónoma colaborativa. Alcance del proyecto 1.pdf	\N	\N
111	100	8	\N	\N	t	t	28	2026-05-18 22:57:15.745467	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	\N	\N
113	100	\N	\N	\N	t	t	28	2026-05-18 22:57:26.48091	AnÃ¡lisis de SLAM en 2 Diapositivas.pdf	Análisis de SLAM en 2 Diapositivas.pdf	\N	\N
114	100	\N	\N	\N	t	t	28	2026-05-18 22:57:31.07212	AnÃ¡lisis de SLAM en 2 Diapositivas.pdf	Análisis de SLAM en 2 Diapositivas.pdf	\N	\N
115	100	\N	\N	\N	t	t	28	2026-05-18 22:57:36.039478	Paper_DEVOPS.pdf	Paper_DEVOPS.pdf	\N	\N
116	100	\N	\N	\N	t	t	28	2026-05-18 22:57:40.860353	EspecificaciÃ³n de Casos de Uso.pdf	Especificación de Casos de Uso.pdf	\N	\N
117	100	\N	\N	\N	t	t	28	2026-05-18 22:57:47.533186	Oficio 01.pdf	Oficio 01.pdf	\N	\N
118	100	\N	\N	\N	t	t	28	2026-05-18 22:57:52.409796	document_pdf.pdf	document_pdf.pdf	\N	\N
119	100	\N	\N	\N	t	t	28	2026-05-18 22:57:57.162511	EjecuciÃ³n de pruebas simbÃ³licas (1).pdf	Ejecución de pruebas simbólicas (1).pdf	\N	\N
120	100	\N	\N	\N	t	t	28	2026-05-18 22:58:01.883863	Actividad autÃ³noma colaborativa. Alcance del proyecto 1.pdf	Actividad autónoma colaborativa. Alcance del proyecto 1.pdf	\N	\N
121	100	\N	\N	\N	t	t	28	2026-05-18 22:58:06.383066	EspecificaciÃ³n de Casos de Uso.pdf	Especificación de Casos de Uso.pdf	\N	\N
127	101	\N	\N	\N	t	t	28	2026-05-18 23:08:10.171379	document_pdf.pdf	document_pdf.pdf	\N	\N
125	101	\N	\N	\N	t	t	28	2026-05-18 23:07:58.721732	document_pdf.pdf	document_pdf.pdf	\N	\N
126	101	\N	\N	\N	t	t	28	2026-05-18 23:08:03.33482	detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf	detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf	\N	\N
129	101	\N	\N	\N	t	t	28	2026-05-18 23:08:21.087456	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	\N	\N
131	107	\N	\N	4542635	t	t	28	2026-05-22 09:58:23.998616	1779443902249-995262794.pdf	Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf	\N	\N
140	108	\N	\N	478946	t	t	28	2026-05-22 10:13:49.053066	1779444828892-244947655.pdf	Simulation_and_the_simulation_language_SLAM_II_as_.pdf	\N	\N
150	108	\N	\N	9230019	t	t	28	2026-05-22 10:15:07.137966	1779444905413-894079664.pdf	PLA6_IntroducciÃ³n a la simulaciÃ³n.pdf	\N	\N
148	108	\N	\N	9230019	t	t	28	2026-05-22 10:14:54.013084	1779444891360-470634773.pdf	PLA6_IntroducciÃ³n a la simulaciÃ³n.pdf	\N	\N
147	108	\N	\N	2912276	t	t	28	2026-05-22 10:14:46.875285	1779444885912-169220333.pdf	SLAM - Lenguaje de SimulaciÃ³n - Grupo 3.pdf	\N	\N
141	108	\N	\N	478946	t	t	28	2026-05-22 10:14:00.112042	1779444839882-546906146.pdf	Simulation_and_the_simulation_language_SLAM_II_as_.pdf	\N	\N
142	108	\N	\N	4542635	t	t	28	2026-05-22 10:14:05.029392	1779444843682-781830726.pdf	Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf	\N	\N
143	108	\N	\N	9230019	t	t	28	2026-05-22 10:14:15.977703	1779444852224-853575780.pdf	PLA6_IntroducciÃ³n a la simulaciÃ³n.pdf	\N	\N
144	108	\N	\N	9230019	t	t	28	2026-05-22 10:14:22.109963	1779444859397-220104834.pdf	PLA6_IntroducciÃ³n a la simulaciÃ³n.pdf	\N	\N
145	108	\N	\N	4542635	t	t	28	2026-05-22 10:14:30.913546	1779444869484-922122605.pdf	Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf	\N	\N
146	108	\N	\N	2912276	t	t	28	2026-05-22 10:14:38.34355	1779444877596-801193488.pdf	SLAM - Lenguaje de SimulaciÃ³n - Grupo 3.pdf	\N	\N
128	101	\N	\N	\N	t	t	28	2026-05-18 23:08:16.072561	EspecificaciÃ³n de Casos de Uso.pdf	Especificación de Casos de Uso.pdf	\N	\N
130	101	\N	\N	\N	t	t	28	2026-05-18 23:08:26.184092	detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf	detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf	\N	\N
151	109	\N	\N	415525	t	t	28	2026-05-23 19:18:03.420224	1779563883856-353746041.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
152	109	\N	\N	238994	t	t	28	2026-05-23 19:18:09.167936	1779563890146-892065302.pdf	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	\N	\N
153	109	\N	\N	423332	t	t	28	2026-05-23 19:18:16.020251	1779563894409-465466117.pdf	COTIZACIÃN.pdf	\N	\N
154	109	\N	\N	187463	t	t	28	2026-05-23 19:18:24.95993	1779563904153-11897154.pdf	Oficio 01.pdf	\N	\N
155	109	\N	\N	415525	t	t	28	2026-05-23 19:18:30.707659	1779563910516-310178904.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
161	109	\N	\N	415525	t	t	28	2026-05-23 19:19:10.303775	1779563950738-991274264.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
160	109	\N	\N	415525	t	t	28	2026-05-23 19:19:03.273375	1779563942994-648368527.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
159	109	\N	\N	1113981	t	t	28	2026-05-23 19:18:56.182209	1779563935259-436745256.pdf	document_pdf.pdf	\N	\N
158	109	\N	\N	655880	t	t	28	2026-05-23 19:18:49.616338	1779563928097-626929961.pdf	Costos - Metodo Montecarlo (2).pdf	\N	\N
157	109	\N	\N	415525	t	t	28	2026-05-23 19:18:42.414506	1779563923294-443016812.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
156	109	\N	\N	10606508	t	t	28	2026-05-23 19:18:36.670024	1779563916960-381071112.pdf	SLAM_Simulation_Language.pdf	\N	\N
167	110	\N	\N	1113981	t	t	28	2026-05-23 19:45:13.536634	1779565512636-279619941.pdf	document_pdf.pdf	\N	\N
166	110	\N	\N	1113981	t	t	28	2026-05-23 19:45:00.005366	1779565500905-575905221.pdf	document_pdf.pdf	\N	\N
165	110	\N	\N	277513	t	t	28	2026-05-23 19:44:50.528283	1779565490578-776163914.pdf	Paper_VV.pdf	\N	\N
164	110	\N	\N	1113981	t	t	28	2026-05-23 19:44:44.81336	1779565484175-438424294.pdf	document_pdf.pdf	\N	\N
163	110	\N	\N	268968	t	t	28	2026-05-23 19:44:40.299599	1779565479303-394468544.pdf	detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (1).pdf	\N	\N
162	110	\N	\N	415525	t	t	28	2026-05-23 19:44:33.102027	1779565471489-613771290.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
172	110	\N	\N	1113981	t	t	28	2026-05-23 19:45:54.715052	1779565554712-405890958.pdf	document_pdf.pdf	\N	\N
171	110	\N	\N	1113981	t	t	28	2026-05-23 19:45:48.796202	1779565548103-623260762.pdf	document_pdf.pdf	\N	\N
170	110	\N	\N	1194864	t	t	28	2026-05-23 19:45:43.151479	1779565541901-855713435.pdf	EspecificaciÃ³n de Casos de Uso.pdf	\N	\N
169	110	\N	\N	1113981	t	t	28	2026-05-23 19:45:27.006464	1779565527096-445667512.pdf	document_pdf.pdf	\N	\N
168	110	\N	\N	415525	t	t	28	2026-05-23 19:45:20.236853	1779565519995-219969502.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
132	107	\N	\N	4542635	t	t	28	2026-05-22 09:58:29.712687	1779443908176-161790208.pdf	Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf	\N	\N
133	107	\N	\N	9230019	t	t	28	2026-05-22 09:58:46.558988	1779443922819-804338825.pdf	PLA6_IntroducciÃ³n a la simulaciÃ³n.pdf	\N	\N
134	107	\N	\N	478946	t	t	28	2026-05-22 09:58:50.258312	1779443930085-526999400.pdf	Simulation_and_the_simulation_language_SLAM_II_as_.pdf	\N	\N
135	107	\N	\N	2912276	t	t	28	2026-05-22 09:58:54.267791	1779443933398-939669220.pdf	SLAM - Lenguaje de SimulaciÃ³n - Grupo 3.pdf	\N	\N
136	107	\N	\N	9230019	t	t	28	2026-05-22 09:59:01.219056	1779443938787-772529447.pdf	PLA6_IntroducciÃ³n a la simulaciÃ³n.pdf	\N	\N
139	107	\N	\N	4542635	t	t	28	2026-05-22 09:59:17.900195	1779443956602-955577044.pdf	Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf	\N	\N
138	107	\N	\N	478946	t	t	28	2026-05-22 09:59:08.911441	1779443948698-66630488.pdf	Simulation_and_the_simulation_language_SLAM_II_as_.pdf	\N	\N
137	107	\N	\N	2912276	t	t	28	2026-05-22 09:59:05.55011	1779443944540-868208279.pdf	SLAM - Lenguaje de SimulaciÃ³n - Grupo 3.pdf	\N	\N
149	108	\N	\N	9230019	t	t	28	2026-05-22 10:15:01.433	1779444899093-307734384.pdf	PLA6_IntroducciÃ³n a la simulaciÃ³n.pdf	\N	\N
175	111	\N	\N	655880	t	t	28	2026-05-26 19:25:50.434358	1779823550770-743848871.pdf	Costos - Metodo Montecarlo (3).pdf	\N	\N
174	111	\N	\N	268968	t	t	28	2026-05-26 19:25:46.067862	1779823546100-801536868.pdf	detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (1).pdf	\N	\N
173	111	\N	\N	212805	t	t	28	2026-05-26 19:25:27.034512	1779823526159-892398259.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	\N
181	111	\N	\N	415525	t	t	28	2026-05-26 19:26:24.982027	1779823585491-183070448.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
176	111	\N	\N	187463	t	t	28	2026-05-26 19:25:58.018578	1779823556953-595183720.pdf	Oficio 001.pdf	\N	\N
177	111	\N	\N	238994	t	t	28	2026-05-26 19:26:04.026744	1779823563409-58920283.pdf	PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf	\N	\N
178	111	\N	\N	187463	t	t	28	2026-05-26 19:26:09.965184	1779823569555-491263737.pdf	Oficio 001.pdf	\N	\N
262	119	8	\N	170369	t	t	34	2026-05-27 13:47:49.508031	1779889667392-640398000.pdf	Temas para trabajos grupales fin de ciclo.pdf	\N	1005
263	119	7	\N	4179645	t	t	34	2026-05-27 13:47:56.51547	1779889673125-278225270.pdf	PROMO MAYO.pdf	\N	1004
295	123	\N	\N	415525	t	f	34	2026-05-28 16:28:27.251987	1779985707460-299582259.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	1039
183	111	\N	\N	212805	t	t	28	2026-05-26 19:26:40.088118	1779823599683-85840474.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	\N
182	111	\N	\N	393477	t	t	28	2026-05-26 19:26:32.969399	1779823592273-176342617.pdf	EjecuciÃ³n de pruebas simbÃ³licas.pdf	\N	\N
179	111	\N	\N	268968	t	t	28	2026-05-26 19:26:15.044776	1779823574883-1494699.pdf	detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt.pdf	\N	\N
180	111	\N	\N	415525	t	t	28	2026-05-26 19:26:19.882412	1779823580141-81413914.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
184	112	\N	\N	622068	t	t	28	2026-05-26 20:08:18.443056	1779826095958-493807706.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	\N
185	112	\N	\N	622068	t	t	28	2026-05-26 20:08:35.451073	1779826112037-434873583.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	\N
188	112	\N	\N	622068	t	t	28	2026-05-26 20:09:02.108256	1779826142110-191196926.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	\N
189	112	\N	\N	622068	t	t	28	2026-05-26 20:09:09.342372	1779826147148-857477716.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	\N
190	112	\N	\N	50256	t	t	28	2026-05-26 20:09:17.323421	1779826157062-35360799.pdf	ORTIZ GUSÃAY JOSE BALTAZAR.pdf	\N	\N
191	112	\N	\N	170369	t	t	28	2026-05-26 20:09:26.258576	1779826165983-198808059.pdf	Temas para trabajos grupales fin de ciclo (1).pdf	\N	\N
192	112	\N	\N	12409898	t	t	28	2026-05-26 20:09:39.917262	1779826170365-593928533.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf	\N	\N
186	112	\N	\N	622068	t	t	28	2026-05-26 20:08:47.832756	1779826127103-649863805.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	\N
187	112	\N	\N	239648	t	t	28	2026-05-26 20:08:53.970635	1779826133049-526855506.pdf	Version 3 - PRODUCT BACKLOG (1).pdf	\N	\N
193	113	\N	\N	102	t	f	28	2026-05-26 20:31:32.160848	1779827492325-279776247.pdf	Anexo_7_Constancia_TRÃMITE EN PROCESO.pdf	\N	\N
194	113	\N	\N	10606508	t	f	28	2026-05-26 20:33:05.636042	1779827585670-576801101.pdf	SLAM_Simulation_Language.pdf	\N	\N
195	113	\N	\N	187463	t	f	28	2026-05-26 20:33:12.686988	1779827593170-720012238.pdf	Oficio 001.pdf	\N	\N
196	113	\N	\N	187463	t	f	28	2026-05-26 20:33:18.306815	1779827597441-526919684.pdf	Oficio 001.pdf	\N	\N
197	113	\N	\N	277513	t	f	28	2026-05-26 20:33:24.032987	1779827603422-54920815.pdf	Paper_VV.pdf	\N	\N
198	113	\N	\N	187463	t	f	28	2026-05-26 20:33:28.724319	1779827608357-84655597.pdf	Oficio 01.pdf	\N	\N
199	113	\N	\N	187463	t	f	28	2026-05-26 20:33:34.384412	1779827614245-381068763.pdf	Oficio 01.pdf	\N	\N
200	113	\N	\N	415525	t	f	28	2026-05-26 20:33:39.387111	1779827619702-687106950.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
201	113	\N	\N	415525	t	f	28	2026-05-26 20:33:44.92322	1779827625538-523299372.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
202	113	\N	\N	10606508	t	f	28	2026-05-26 20:33:53.476865	1779827632709-431672367.pdf	SLAM_Simulation_Language.pdf	\N	\N
203	114	\N	\N	239648	t	f	28	2026-05-26 21:16:18.066723	1779830178369-142613999.pdf	Version 3 - PRODUCT BACKLOG (1).pdf	\N	\N
204	114	\N	\N	622068	t	f	28	2026-05-26 21:16:21.693066	1779830182103-421481479.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	\N
205	114	\N	\N	622068	t	f	28	2026-05-26 21:16:26.894167	1779830185909-740270728.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	\N
206	114	\N	\N	170369	t	f	28	2026-05-26 21:16:34.880873	1779830194308-670224165.pdf	Temas para trabajos grupales fin de ciclo (1).pdf	\N	\N
207	114	\N	\N	12409898	t	f	28	2026-05-26 21:16:35.038195	1779830190491-865476495.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf	\N	\N
208	114	\N	\N	12409898	t	f	28	2026-05-26 21:16:43.412276	1779830200731-919427587.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf	\N	\N
209	114	\N	\N	4179645	t	f	28	2026-05-26 21:16:50.829781	1779830209919-265865924.pdf	PROMO MAYO.pdf	\N	\N
210	114	\N	\N	170369	t	f	28	2026-05-26 21:16:58.499409	1779830217617-726491104.pdf	Temas para trabajos grupales fin de ciclo (1).pdf	\N	\N
211	114	\N	\N	3754556	t	f	28	2026-05-26 21:17:02.955955	1779830221008-574266128.pdf	LEVEL_A2_CERTIFICADO (2).pdf	\N	\N
212	114	\N	\N	170369	t	f	28	2026-05-26 21:17:08.156796	1779830227769-112666871.pdf	Temas para trabajos grupales fin de ciclo (1).pdf	\N	\N
213	114	\N	\N	50256	t	f	28	2026-05-26 21:17:11.10103	1779830230935-552144767.pdf	ORTIZ GUSÃAY JOSE BALTAZAR.pdf	\N	\N
214	114	\N	\N	50256	t	f	28	2026-05-26 21:17:14.159981	1779830234128-942783162.pdf	ORTIZ GUSÃAY JOSE BALTAZAR.pdf	\N	\N
216	115	\N	\N	3754556	t	t	34	2026-05-26 21:23:18.943529	1779830597846-474168647.pdf	LEVEL_A2_CERTIFICADO (2).pdf	\N	\N
217	115	\N	\N	12409898	t	t	34	2026-05-26 21:23:27.506128	1779830604544-693267066.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf	\N	\N
215	115	\N	\N	3754556	t	t	34	2026-05-26 21:23:13.361775	1779830592664-434704670.pdf	LEVEL_A2_CERTIFICADO (2).pdf	\N	\N
218	115	\N	\N	622068	t	t	34	2026-05-26 21:23:38.003968	1779830617151-299851837.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	\N
219	115	\N	\N	239648	t	t	34	2026-05-26 21:23:41.741571	1779830620992-898630870.pdf	Version 3 - PRODUCT BACKLOG (1).pdf	\N	\N
220	115	\N	\N	239648	t	t	34	2026-05-26 21:23:45.925568	1779830625567-781033090.pdf	Version 3 - PRODUCT BACKLOG (1).pdf	\N	\N
221	115	\N	\N	3754556	t	t	34	2026-05-26 21:23:52.113396	1779830630302-960221628.pdf	LEVEL_A2_CERTIFICADO (2).pdf	\N	\N
222	115	\N	\N	4179645	t	t	34	2026-05-26 21:24:00.066178	1779830637018-222846394.pdf	PROMO MAYO.pdf	\N	\N
223	115	\N	\N	622068	t	t	34	2026-05-26 21:24:06.106308	1779830645933-481944051.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	\N
224	115	\N	\N	12409898	t	t	34	2026-05-26 21:24:13.38867	1779830649871-816259452.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf	\N	\N
225	115	\N	\N	170369	t	t	34	2026-05-26 21:24:19.941384	1779830659039-148838586.pdf	Temas para trabajos grupales fin de ciclo (1).pdf	\N	\N
226	115	\N	\N	12409898	t	t	34	2026-05-26 21:24:26.500302	1779830662944-104045978.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf	\N	\N
227	115	\N	\N	50256	t	t	34	2026-05-26 21:24:33.177431	1779830672982-355253744.pdf	ORTIZ GUSÃAY JOSE BALTAZAR.pdf	\N	\N
228	115	\N	\N	170369	t	t	34	2026-05-26 21:24:36.751357	1779830676727-349896562.pdf	Temas para trabajos grupales fin de ciclo (1).pdf	\N	\N
229	115	\N	\N	170369	t	t	34	2026-05-26 21:24:40.294042	1779830680405-216885711.pdf	Temas para trabajos grupales fin de ciclo.pdf	\N	\N
230	115	\N	\N	18766237	t	t	34	2026-05-26 21:24:49.524228	1779830684050-456282151.pdf	Catalogo Ecuaceramica (1).pdf	\N	\N
231	115	\N	\N	18766237	t	t	34	2026-05-26 21:25:04.493378	1779830694914-524014088.pdf	Catalogo Ecuaceramica (1).pdf	\N	\N
232	115	\N	\N	507135	t	t	34	2026-05-26 21:25:13.58887	1779830713716-958218936.pdf	boletines_pedagogicos_no_10.pdf	\N	\N
236	116	\N	\N	187463	t	t	28	2026-05-26 21:45:28.175085	1779831927480-800445988.pdf	Oficio 001.pdf	\N	\N
237	116	\N	\N	212805	t	t	28	2026-05-26 21:45:32.614852	1779831932168-156232976.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	\N
238	116	\N	\N	415525	t	t	28	2026-05-26 21:45:36.819082	1779831936605-580074131.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
239	116	\N	\N	415525	t	t	28	2026-05-26 21:45:41.690821	1779831941766-408523900.pdf	EspecificaciÃ³n de requisitos de.pdf	\N	\N
240	116	\N	\N	1113981	t	t	28	2026-05-26 21:45:47.405248	1779831947781-703514133.pdf	document_pdf.pdf	\N	\N
241	116	\N	\N	10606508	t	t	28	2026-05-26 21:45:54.163551	1779831954817-344300093.pdf	SLAM_Simulation_Language.pdf	\N	\N
242	116	\N	\N	655880	t	t	28	2026-05-26 21:45:59.911369	1779831959242-20042409.pdf	Costos - Metodo Montecarlo (3).pdf	\N	\N
243	116	\N	\N	187463	t	t	28	2026-05-26 21:46:06.274616	1779831965950-619083853.pdf	Oficio 001.pdf	\N	\N
233	116	\N	\N	212805	t	t	28	2026-05-26 21:45:14.784434	1779831915068-792480674.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	\N
234	116	\N	\N	187463	t	t	28	2026-05-26 21:45:18.516602	1779831918978-537060227.pdf	Oficio 001.pdf	\N	\N
235	116	\N	\N	268968	t	t	28	2026-05-26 21:45:22.042273	1779831922672-854666304.pdf	detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (1).pdf	\N	\N
255	119	5	\N	622068	t	t	34	2026-05-27 13:46:55.005023	1779889612916-479117621.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	997
251	117	\N	\N	682859	t	t	28	2026-05-26 21:59:47.778612	1779832787280-615556561.pdf	Actividad AsÃ­ncrona (Auditoria informÃ¡tica al FrontEnd con herramienta ZAP)Actividad AsÃ­ncrona (Auditoria informÃ¡tica al FrontEnd con herramienta ZAP).pdf	\N	982
244	117	\N	\N	652952	t	t	28	2026-05-26 21:59:17.125716	1779832756765-164536582.pdf	Version 2 - Historias de Usuario - Historias TÃ©cnicas.pdf	\N	975
245	117	\N	\N	187463	t	t	28	2026-05-26 21:59:20.787362	1779832760604-996879327.pdf	Oficio 001.pdf	\N	977
254	119	4	\N	622068	t	t	34	2026-05-27 13:46:47.851964	1779889605774-955420546.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	996
258	119	8	\N	622068	t	t	34	2026-05-27 13:47:18.229694	1779889635941-980066936.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	1000
256	119	5	\N	12409898	t	t	34	2026-05-27 13:47:03.605407	1779889619020-823321982.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf	\N	998
257	119	5	\N	102	t	t	34	2026-05-27 13:47:13.16877	1779889630792-497902613.pdf	Anexo_7_Constancia_CEISH-ESPOCH-EI-004-2026.pdf	\N	999
252	117	\N	\N	187463	t	t	28	2026-05-26 21:59:52.829542	1779832792621-608972256.pdf	Oficio 001.pdf	\N	983
253	118	\N	\N	10606508	t	f	28	2026-05-27 07:21:13.605509	1779866472514-4677934.pdf	SLAM_Simulation_Language.pdf	\N	984
246	117	-15	\N	212805	t	t	28	2026-05-26 21:59:26.017879	1779832766100-464272695.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	976
259	119	9	\N	12409898	t	t	34	2026-05-27 13:47:27.669553	1779889640373-981139242.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf	\N	1001
260	119	4	\N	12409898	t	t	34	2026-05-27 13:47:35.508344	1779889651798-213307883.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf	\N	1002
250	117	92	\N	393477	t	t	28	2026-05-26 21:59:43.303099	1779832782480-557297786.pdf	EjecuciÃ³n de pruebas simbÃ³licas.pdf	\N	981
247	117	1	\N	277513	t	t	28	2026-05-26 21:59:29.677757	1779832769995-121671389.pdf	Paper_VV.pdf	\N	978
248	117	2	\N	655880	t	t	28	2026-05-26 21:59:33.667601	1779832774214-525700085.pdf	Costos - Metodo Montecarlo (3).pdf	\N	979
249	117	1	\N	1178000	t	t	28	2026-05-26 21:59:37.378482	1779832778129-638635067.pdf	7c1c09b4db636a3e278d46175d12c99158c0.pdf	\N	980
261	119	7	\N	3754556	t	t	34	2026-05-27 13:47:45.479539	1779889660494-360288926.pdf	LEVEL_A2_CERTIFICADO (2).pdf	\N	1003
264	119	7	\N	12409898	t	t	34	2026-05-27 13:48:06.953833	1779889680507-912473804.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf	\N	1006
265	120	1	\N	622068	t	t	34	2026-05-27 14:14:23.495463	1779891259673-48775153.pdf	VersiÃ³n 3 - Historia de usuario - Historias TÃ©cnicas (1).pdf	\N	1007
266	120	2	\N	12409898	t	t	34	2026-05-27 14:14:32.281668	1779891265507-575802858.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf	\N	1008
267	120	2	\N	12409898	t	t	34	2026-05-27 14:14:39.844994	1779891276017-685910367.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf	\N	1009
268	120	4	\N	3754556	t	t	34	2026-05-27 14:14:45.780345	1779891284352-102895516.pdf	LEVEL_A2_CERTIFICADO (2).pdf	\N	1010
269	120	6	\N	3754556	t	t	34	2026-05-27 14:14:51.284478	1779891290225-220673031.pdf	LEVEL_A2_CERTIFICADO (2).pdf	\N	1011
270	120	9	\N	239648	t	t	34	2026-05-27 14:14:59.720335	1779891296766-270786930.pdf	Version 3 - PRODUCT BACKLOG (1).pdf	\N	1012
271	120	3	\N	12409898	t	t	34	2026-05-27 14:15:07.412829	1779891301887-553569667.pdf	Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf	\N	1013
272	120	7	\N	170369	t	t	34	2026-05-27 14:15:11.768629	1779891310499-428281146.pdf	Temas para trabajos grupales fin de ciclo (1).pdf	\N	1014
273	120	8	\N	170369	t	t	34	2026-05-27 14:15:16.004837	1779891315249-881714106.pdf	Temas para trabajos grupales fin de ciclo (1).pdf	\N	1015
274	121	1	\N	212805	t	t	28	2026-05-27 14:52:14.111681	1779893531648-728539611.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	1016
275	121	22	\N	655880	t	t	28	2026-05-27 14:52:17.906442	1779893535818-772283986.pdf	Costos - Metodo Montecarlo (3).pdf	\N	1017
276	121	2	\N	187463	t	t	28	2026-05-27 14:52:22.02617	1779893540263-991880478.pdf	Oficio 01.pdf	\N	1018
277	121	2	\N	212805	t	t	28	2026-05-27 14:52:26.533112	1779893545402-693448727.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	1020
278	121	2	\N	212805	t	t	28	2026-05-27 14:52:32.392073	1779893551931-210167822.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	1019
279	121	2	\N	212805	t	t	28	2026-05-27 14:52:37.213839	1779893557279-359859925.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	1021
280	121	5	\N	159352	t	t	28	2026-05-27 14:52:44.342194	1779893561444-209093614.pdf	Actividad AsÃ­ncrona_uso_ZAP.pdf	\N	1022
281	121	2	\N	393477	t	t	28	2026-05-27 14:52:49.860578	1779893567503-600060098.pdf	EjecuciÃ³n de pruebas simbÃ³licas (1).pdf	\N	1023
282	121	1	\N	655880	t	t	28	2026-05-27 14:52:54.527548	1779893572760-415571067.pdf	Costos - Metodo Montecarlo (3).pdf	\N	1024
283	122	\N	\N	180446	t	f	34	2026-05-28 16:24:54.375632	1779985493038-716649621.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1025
284	122	\N	\N	187463	t	f	34	2026-05-28 16:24:59.509227	1779985498483-760453525.pdf	Oficio 001.pdf	\N	1026
285	122	\N	\N	10606508	t	f	34	2026-05-28 16:25:07.521559	1779985506874-852153502.pdf	SLAM_Simulation_Language.pdf	\N	1027
286	122	\N	\N	111119	t	f	34	2026-05-28 16:25:17.121626	1779985517436-371463928.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1028
287	122	\N	\N	111119	t	f	34	2026-05-28 16:25:26.546104	1779985525223-654572026.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1029
288	122	\N	\N	111119	t	f	34	2026-05-28 16:25:36.707768	1779985536021-148140772.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1030
289	122	\N	\N	111119	t	f	34	2026-05-28 16:25:58.249293	1779985556887-47228760.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1032
290	122	\N	\N	111119	t	f	34	2026-05-28 16:26:20.312891	1779985580553-534531907.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1031
291	123	\N	\N	187463	t	f	34	2026-05-28 16:28:02.3362	1779985682961-160840354.pdf	Oficio 001.pdf	\N	1041
292	123	\N	\N	254124	t	f	34	2026-05-28 16:28:08.688318	1779985687461-428924536.pdf	Actividad autÃ³noma colaborativa. Alcance del proyecto 1.pdf	\N	1033
293	123	\N	\N	180446	t	f	34	2026-05-28 16:28:13.443967	1779985692482-974756210.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1034
294	123	\N	\N	655880	t	f	34	2026-05-28 16:28:21.788175	1779985701618-592519643.pdf	Costos - Metodo Montecarlo (3).pdf	\N	1040
296	123	\N	\N	180446	t	f	34	2026-05-28 16:28:33.563773	1779985714173-330790229.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1038
297	123	\N	\N	385999	t	f	34	2026-05-28 16:28:41.555544	1779985720385-492715883.pdf	AnÃ¡lisis de SLAM en 2 Diapositivas.pdf	\N	1037
298	123	\N	\N	180446	t	f	34	2026-05-28 16:28:48.01216	1779985727274-586661784.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1035
299	123	\N	\N	212805	t	f	34	2026-05-28 16:28:52.402709	1779985731985-656138100.pdf	LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf	\N	1036
300	124	2	\N	180446	t	t	34	2026-05-28 16:31:55.271895	1779985914178-880210497.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1042
301	124	17	\N	111119	t	t	34	2026-05-28 16:32:02.157268	1779985921563-229549347.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1043
302	124	3	\N	111119	t	t	34	2026-05-28 16:32:06.776976	1779985926561-918335460.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1044
318	146	1	\N	75024	t	t	34	2026-06-08 06:13:51.121936	protocols/146/requirements/1257/Datap1.pdf	Datap1.pdf	\N	1257
319	146	1	\N	75024	t	t	34	2026-06-08 06:14:06.636673	protocols/146/requirements/1265/Datap1.pdf	Datap1.pdf	\N	1265
320	146	1	\N	331804	t	t	34	2026-06-08 06:14:12.342963	protocols/146/requirements/1264/Ejercicios_Propuestos_Simulacion.pdf	Ejercicios_Propuestos_Simulacion.pdf	\N	1264
303	124	3	\N	111119	t	t	34	2026-05-28 16:32:11.796384	1779985931891-529268305.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1045
321	146	1	\N	75024	t	t	34	2026-06-08 06:14:18.385228	protocols/146/requirements/1258/Datap1.pdf	Datap1.pdf	\N	1258
304	124	5	\N	111119	t	t	34	2026-05-28 16:32:17.200964	1779985937709-837821093.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1046
305	124	2	\N	111119	t	t	34	2026-05-28 16:32:24.492151	1779985943179-623193599.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1047
308	124	2	\N	3590175	t	t	34	2026-05-28 16:32:42.422923	1779985962413-196730439.pdf	Proyecto de.pdf	\N	1050
307	124	2	\N	10606508	t	t	34	2026-05-28 16:32:36.585582	1779985956131-411556381.pdf	SLAM_Simulation_Language.pdf	\N	1049
322	146	1	\N	75024	t	t	34	2026-06-08 06:14:23.461282	protocols/146/requirements/1259/Datap1.pdf	Datap1.pdf	\N	1259
306	124	1	\N	10606508	t	t	34	2026-05-28 16:32:31.310245	1779985950330-826778245.pdf	SLAM_Simulation_Language.pdf	\N	1048
309	126	1	\N	180446	t	t	34	2026-05-28 20:28:12.548025	1780000090822-140747119.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1060
310	126	5	\N	180446	t	t	34	2026-05-28 20:28:18.579945	1780000097435-273541699.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1061
311	126	3	\N	414330	t	t	34	2026-05-28 20:28:23.9593	1780000103299-300677917.pdf	recepcion IO-34-CEISH-ESPOCH-2026-signed.pdf	\N	1062
312	126	3	\N	3313	t	t	34	2026-05-28 20:28:28.45983	1780000108187-993482584.pdf	Constancia_Recepcion_CEISH-ESPOCH-EI-008-2026.pdf	\N	1063
313	126	2	\N	180446	t	t	34	2026-05-28 20:28:33.47288	1780000113656-235660262.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1064
314	126	2	\N	111119	t	t	34	2026-05-28 20:28:40.925142	1780000119153-414807279.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1065
315	126	4	\N	180446	t	t	34	2026-05-28 20:28:48.060606	1780000126565-39311571.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1066
316	126	3	\N	180446	t	t	34	2026-05-28 20:28:52.307931	1780000131203-277021307.pdf	ingenieria_inversa_mantenimiento.pdf	\N	1067
317	126	1	\N	111119	t	t	34	2026-05-28 20:28:56.868357	1780000136170-888693414.pdf	Lenguajes de SimulaciÃ³n asignados.pdf	\N	1068
323	146	1	\N	75024	t	t	34	2026-06-08 06:14:29.390552	protocols/146/requirements/1261/Datap1.pdf	Datap1.pdf	\N	1261
324	146	1	\N	75024	t	t	34	2026-06-08 06:14:47.91314	protocols/146/requirements/1260/Datap1.pdf	Datap1.pdf	\N	1260
325	146	1	\N	331804	t	t	34	2026-06-08 06:14:54.479757	protocols/146/requirements/1262/Ejercicios_Propuestos_Simulacion.pdf	Ejercicios_Propuestos_Simulacion.pdf	\N	1262
326	146	1	\N	75024	t	t	34	2026-06-08 06:14:59.641217	protocols/146/requirements/1263/Datap1.pdf	Datap1.pdf	\N	1263
\.


--
-- TOC entry 4208 (class 0 OID 24119)
-- Dependencies: 261
-- Data for Name: recepciones; Type: TABLE DATA; Schema: recepcion; Owner: ceish_user
--

COPY recepcion.recepciones (id, protocolo_id, fecha_recepcion, estado_id, tiene_faltantes, lista_faltantes, fecha_notificacion_faltantes, plazo_completar_dias, fecha_limite_completar, constancia_emitida, fecha_constancia, plazo_respuesta_dias, observaciones, creado_por) FROM stdin;
130	128	2026-06-07 14:45:27.714	1	f	\N	\N	15	\N	f	\N	\N	\N	34
132	130	2026-06-07 14:53:22.754	1	f	\N	\N	15	\N	f	\N	\N	\N	34
134	132	2026-06-07 15:12:27.616	1	f	\N	\N	15	\N	f	\N	\N	\N	34
136	134	2026-06-07 15:37:45.232	1	f	\N	\N	15	\N	f	\N	\N	\N	34
138	136	2026-06-07 22:38:36.246	1	f	\N	\N	15	\N	f	\N	\N	\N	34
140	138	2026-06-07 23:11:51.106	1	f	\N	\N	15	\N	f	\N	\N	\N	34
141	139	2026-06-07 23:34:56.652	1	f	\N	\N	15	\N	f	\N	\N	\N	34
142	140	2026-06-08 00:20:43.957	1	f	\N	\N	15	\N	f	\N	\N	\N	34
143	141	2026-06-08 00:38:42.463	1	f	\N	\N	15	\N	f	\N	\N	\N	34
144	142	2026-06-08 00:45:41.015	1	f	\N	\N	15	\N	f	\N	\N	\N	34
145	143	2026-06-08 00:49:22.48	1	f	\N	\N	15	\N	f	\N	\N	\N	34
146	144	2026-06-08 00:56:37.079	1	f	\N	\N	15	\N	f	\N	\N	\N	34
147	145	2026-06-08 01:04:58.951	1	f	\N	\N	15	\N	f	\N	\N	\N	34
148	146	2026-06-08 01:18:53.367	2	f	\N	\N	15	\N	f	\N	\N	\N	34
108	106	2026-05-22 04:42:23.616	3	t		2026-05-26 14:02:33.735	15	2026-06-16	f	\N	\N	\N	28
4	1	2026-05-03 13:48:38.192261	\N	f	\N	\N	15	\N	f	\N	\N	\N	\N
6	4	2026-05-06 07:00:55.368	1	f	\N	\N	15	\N	f	\N	\N	\N	28
7	5	2026-05-06 07:02:16.307	1	f	\N	\N	15	\N	f	\N	\N	\N	28
8	6	2026-05-06 07:12:45.16	1	f	\N	\N	15	\N	f	\N	\N	\N	28
9	7	2026-05-06 07:31:59.508	1	f	\N	\N	15	\N	f	\N	\N	\N	28
10	8	2026-05-06 07:40:09.377	1	f	\N	\N	15	\N	f	\N	\N	\N	28
11	9	2026-05-06 07:47:03.419	1	f	\N	\N	15	\N	f	\N	\N	\N	28
12	10	2026-05-06 08:13:32.026	1	f	\N	\N	15	\N	f	\N	\N	\N	28
13	11	2026-05-12 22:49:00.671	1	f	\N	\N	15	\N	f	\N	\N	\N	29
14	12	2026-05-13 09:12:46.402	1	f	\N	\N	15	\N	f	\N	\N	\N	28
15	13	2026-05-15 00:53:42.176	1	f	\N	\N	15	\N	f	\N	\N	\N	28
16	14	2026-05-15 04:03:27.146	1	f	\N	\N	15	\N	f	\N	\N	\N	28
17	15	2026-05-15 04:14:59.278	1	f	\N	\N	15	\N	f	\N	\N	\N	28
18	16	2026-05-15 04:28:14.922	1	f	\N	\N	15	\N	f	\N	\N	\N	28
19	17	2026-05-15 04:38:19.052	1	f	\N	\N	15	\N	f	\N	\N	\N	28
20	18	2026-05-15 05:17:32.097	1	f	\N	\N	15	\N	f	\N	\N	\N	28
21	19	2026-05-15 05:27:31.705	1	f	\N	\N	15	\N	f	\N	\N	\N	28
22	20	2026-05-15 05:43:54.296	1	f	\N	\N	15	\N	f	\N	\N	\N	28
23	21	2026-05-15 05:52:13.219	1	f	\N	\N	15	\N	f	\N	\N	\N	28
24	22	2026-05-15 06:29:01.776	1	f	\N	\N	15	\N	f	\N	\N	\N	28
25	23	2026-05-15 06:37:08.759	1	f	\N	\N	15	\N	f	\N	\N	\N	28
26	24	2026-05-15 06:38:57.892	1	f	\N	\N	15	\N	f	\N	\N	\N	28
27	25	2026-05-15 06:40:11.514	1	f	\N	\N	15	\N	f	\N	\N	\N	28
28	26	2026-05-15 21:11:39.16	1	f	\N	\N	15	\N	f	\N	\N	\N	28
29	27	2026-05-15 21:17:55.328	1	f	\N	\N	15	\N	f	\N	\N	\N	28
30	28	2026-05-15 21:19:07.264	1	f	\N	\N	15	\N	f	\N	\N	\N	28
31	29	2026-05-15 21:23:40.993	1	f	\N	\N	15	\N	f	\N	\N	\N	28
32	30	2026-05-16 02:08:06.504	1	f	\N	\N	15	\N	f	\N	\N	\N	28
33	31	2026-05-16 02:30:42.678	1	f	\N	\N	15	\N	f	\N	\N	\N	28
34	32	2026-05-16 02:38:16.522	1	f	\N	\N	15	\N	f	\N	\N	\N	28
35	33	2026-05-16 03:15:54.341	1	f	\N	\N	15	\N	f	\N	\N	\N	28
68	66	2026-05-16 14:33:56.59	1	f	\N	\N	15	\N	f	\N	\N	\N	28
69	67	2026-05-16 14:34:35.827	1	f	\N	\N	15	\N	f	\N	\N	\N	28
70	68	2026-05-16 14:41:07.351	1	f	\N	\N	15	\N	f	\N	\N	\N	28
71	69	2026-05-17 01:04:23.284	1	f	\N	\N	15	\N	f	\N	\N	\N	28
72	70	2026-05-17 01:24:21.097	1	f	\N	\N	15	\N	f	\N	\N	\N	28
73	71	2026-05-17 01:27:10.949	1	f	\N	\N	15	\N	f	\N	\N	\N	28
74	72	2026-05-17 01:27:45.163	1	f	\N	\N	15	\N	f	\N	\N	\N	28
75	73	2026-05-17 01:35:20.381	1	f	\N	\N	15	\N	f	\N	\N	\N	28
76	74	2026-05-17 01:35:56.948	1	f	\N	\N	15	\N	f	\N	\N	\N	28
77	75	2026-05-17 10:05:52.699	1	f	\N	\N	15	\N	f	\N	\N	\N	28
78	76	2026-05-17 10:06:44.823	1	f	\N	\N	15	\N	f	\N	\N	\N	28
79	77	2026-05-17 10:08:29.431	1	f	\N	\N	15	\N	f	\N	\N	\N	28
80	78	2026-05-17 10:13:47.04	1	f	\N	\N	15	\N	f	\N	\N	\N	28
81	79	2026-05-17 11:02:03.256	1	f	\N	\N	15	\N	f	\N	\N	\N	28
82	80	2026-05-17 12:09:42.354	1	f	\N	\N	15	\N	f	\N	\N	\N	28
83	81	2026-05-17 12:36:50.947	1	f	\N	\N	15	\N	f	\N	\N	\N	28
84	82	2026-05-17 12:48:52.107	1	f	\N	\N	15	\N	f	\N	\N	\N	28
85	83	2026-05-17 13:02:32.359	1	f	\N	\N	15	\N	f	\N	\N	\N	28
86	84	2026-05-18 10:17:17.59	1	f	\N	\N	15	\N	f	\N	\N	\N	28
87	85	2026-05-18 10:26:51.158	1	f	\N	\N	15	\N	f	\N	\N	\N	28
88	86	2026-05-18 13:43:59.014	1	f	\N	\N	15	\N	f	\N	\N	\N	28
89	87	2026-05-18 13:52:40.801	1	f	\N	\N	15	\N	f	\N	\N	\N	28
90	88	2026-05-18 14:02:52.302	1	f	\N	\N	15	\N	f	\N	\N	\N	28
91	89	2026-05-18 14:16:46.21	1	f	\N	\N	15	\N	f	\N	\N	\N	28
92	90	2026-05-18 14:39:15.659	1	f	\N	\N	15	\N	f	\N	\N	\N	28
93	91	2026-05-18 14:47:28.223	1	f	\N	\N	15	\N	f	\N	\N	\N	28
94	92	2026-05-18 15:14:40.768	1	f	\N	\N	15	\N	f	\N	\N	\N	28
95	93	2026-05-18 15:37:36.187	1	f	\N	\N	15	\N	f	\N	\N	\N	28
96	94	2026-05-18 16:00:43.337	1	f	\N	\N	15	\N	f	\N	\N	\N	28
97	95	2026-05-18 16:07:11.275	1	f	\N	\N	15	\N	f	\N	\N	\N	28
98	96	2026-05-18 16:23:14.791	1	f	\N	\N	15	\N	f	\N	\N	\N	28
99	97	2026-05-18 17:29:30.528	1	f	\N	\N	15	\N	f	\N	\N	\N	28
100	98	2026-05-18 17:39:36.748	1	f	\N	\N	15	\N	f	\N	\N	\N	28
101	99	2026-05-18 17:49:03.125	1	f	\N	\N	15	\N	f	\N	\N	\N	28
5	3	2026-05-06 06:55:08.19	3	t		2026-05-18 18:19:57.055	15	2026-06-08	f	\N	\N	\N	28
104	102	2026-05-19 03:42:31.906	1	f	\N	\N	15	\N	f	\N	\N	\N	28
105	103	2026-05-19 04:01:44.291	1	f	\N	\N	15	\N	f	\N	\N	\N	28
106	104	2026-05-22 04:11:21.566	1	f	\N	\N	15	\N	f	\N	\N	\N	28
107	105	2026-05-22 04:13:22.974	1	f	\N	\N	15	\N	f	\N	\N	\N	29
121	119	2026-05-27 08:46:39.762	2	f	\N	\N	15	\N	f	\N	\N	\N	34
102	100	2026-05-18 17:57:15.609	2	f	\N	\N	15	\N	f	\N	\N	\N	28
113	111	2026-05-26 14:25:22.806	2	t	cualquier comentario	2026-05-26 16:35:51.607	15	2026-06-16	t	2026-05-26 16:41:05.514	\N	\N	28
110	108	2026-05-22 05:13:45.77	3	t	prueba 1	2026-05-26 14:14:00.945	15	2026-06-16	t	2026-05-26 14:17:11.065	\N	\N	28
111	109	2026-05-23 14:18:00.636	3	t	fffffffffffffffffffffffdfdf	2026-05-23 14:20:50.976	15	2026-06-12	f	\N	\N	\N	28
112	110	2026-05-23 14:44:28.377	3	t	kevincin	2026-05-23 14:46:47.924	15	2026-06-12	f	\N	\N	\N	28
103	101	2026-05-18 18:07:26.744	3	t	kevin  y	2026-05-23 15:02:20.482	15	2026-06-12	f	\N	\N	\N	28
118	116	2026-05-26 16:45:06.2	3	t	kevin kevin f	2026-05-26 16:48:11.454	15	2026-06-16	f	\N	\N	\N	28
109	107	2026-05-22 04:58:19.112	3	f	kevin pruebas 	2026-05-23 14:54:58.939	15	2026-06-16	f	\N	\N	\N	28
122	120	2026-05-27 09:14:13.191	3	t	FALTA DOCUMENTACION 	2026-05-27 09:24:27.001	15	2026-06-17	f	\N	\N	\N	34
114	112	2026-05-26 15:08:11.789	3	f	- Falta documento obligatorio: Anexo 1: Solicitud de Evaluación\n- Falta documento obligatorio: Anexo 2: Formulario de Protocolo\n- Falta documento obligatorio: Formulario de Consentimiento Informado\n- Falta documento obligatorio: Instrumentos de Investigación (Fichas, encuestas, manuales)\n- Falta documento obligatorio: Currículos Vitae de Investigadores\n- Falta documento obligatorio: Declaración de Responsabilidad (Anexo 4)\n- Falta documento obligatorio: Declaratoria de Compromiso de Confidencialidad\n- Falta documento obligatorio: Declaración de Conflicto de Interés\n- Falta documento obligatorio: Ficha Descriptiva de la Intervención y Riesgos	\N	15	2026-06-16	t	2026-05-26 15:12:38.951	\N	\N	28
115	113	2026-05-26 15:31:29.157	1	f	\N	\N	15	\N	f	\N	\N	\N	28
116	114	2026-05-26 16:15:43.668	1	f	\N	\N	15	\N	f	\N	\N	\N	28
117	115	2026-05-26 16:22:46.974	2	f	\N	\N	15	\N	f	\N	\N	\N	34
120	118	2026-05-27 02:20:58.082	1	f	\N	\N	15	\N	f	\N	\N	\N	28
119	117	2026-05-26 16:59:11.903	2	f	HOLAS 	2026-05-26 17:02:23.356	15	2026-06-16	f	\N	\N	\N	28
123	121	2026-05-27 09:52:05.486	2	f	\N	\N	15	\N	f	\N	\N	\N	28
124	122	2026-05-28 11:23:57.042	1	f	\N	\N	15	\N	f	\N	\N	\N	34
125	123	2026-05-28 11:27:48.187	1	f	\N	\N	15	\N	f	\N	\N	\N	34
126	124	2026-05-28 11:31:48.291	2	f	\N	\N	15	\N	f	\N	\N	\N	34
127	125	2026-05-28 15:24:14.266	1	f	\N	\N	15	\N	f	\N	\N	\N	34
128	126	2026-05-28 15:28:05.52	2	f	\N	\N	15	\N	f	\N	\N	\N	34
129	127	2026-05-28 15:57:50.414	1	f	\N	\N	15	\N	f	\N	\N	\N	34
131	129	2026-06-07 14:47:48.916	1	f	\N	\N	15	\N	f	\N	\N	\N	34
133	131	2026-06-07 14:58:03.897	1	f	\N	\N	15	\N	f	\N	\N	\N	34
135	133	2026-06-07 15:16:43.416	1	f	\N	\N	15	\N	f	\N	\N	\N	34
137	135	2026-06-07 15:41:08.494	1	f	\N	\N	15	\N	f	\N	\N	\N	34
139	137	2026-06-07 22:46:24.443	1	f	\N	\N	15	\N	f	\N	\N	\N	34
\.


--
-- TOC entry 4206 (class 0 OID 24092)
-- Dependencies: 259
-- Data for Name: validaciones_documento; Type: TABLE DATA; Schema: recepcion; Owner: ceish_user
--

COPY recepcion.validaciones_documento (id, documento_id, estado_id, observaciones, validado_por, fecha_validacion) FROM stdin;
1	122	1		30	2026-05-19 06:54:40.87
2	123	1		30	2026-05-19 06:55:23.694
3	124	1		30	2026-05-19 06:55:24.836
4	111	1		30	2026-05-19 07:45:04.641
5	112	1		30	2026-05-19 07:45:06.109
6	113	1		30	2026-05-19 07:45:08.079
7	114	1		30	2026-05-19 07:45:08.804
8	115	1		30	2026-05-19 07:45:12.265
9	116	1		30	2026-05-19 07:45:13.324
10	117	1		30	2026-05-19 07:45:14.271
11	118	1		30	2026-05-19 07:45:16.543
12	119	2	nnnn kghjj jhjhgh khkjh kjhkjh	30	2026-05-19 07:45:36.836
13	120	1		30	2026-05-19 07:45:39.981
14	121	1		30	2026-05-19 07:45:41.166
15	111	1		30	2026-05-19 15:57:16.101
16	112	1		30	2026-05-19 15:57:19.029
17	124	1		30	2026-05-21 11:49:56.788
18	140	1		30	2026-05-22 05:16:21.485
19	121	2	tttttttttttttttttttttttt	30	2026-05-22 23:57:33.376
20	120	1		30	2026-05-22 23:57:37.654
21	140	1		30	2026-05-22 23:58:51.342
22	150	1		30	2026-05-23 01:08:03.709
23	140	1		30	2026-05-23 01:08:04.925
24	148	1		30	2026-05-23 01:08:09.409
25	147	1		30	2026-05-23 01:08:10.183
26	141	1		30	2026-05-23 01:08:16.929
27	142	1		30	2026-05-23 01:08:23.454
28	143	1		30	2026-05-23 01:08:24.175
29	144	1		30	2026-05-23 01:08:25.056
30	145	1		30	2026-05-23 01:08:25.917
31	146	1		30	2026-05-23 01:08:26.868
32	111	1		30	2026-05-23 01:08:59.642
33	121	1		30	2026-05-23 01:09:04.523
34	120	1		30	2026-05-23 01:09:05.558
35	119	1		30	2026-05-23 01:09:06.4
36	118	1		30	2026-05-23 01:09:07.218
37	117	1		30	2026-05-23 01:09:08.581
38	116	1		30	2026-05-23 01:09:09.174
39	115	1		30	2026-05-23 01:09:09.927
40	114	1		30	2026-05-23 01:09:11.15
41	113	1		30	2026-05-23 01:09:11.829
42	112	1		30	2026-05-23 01:09:12.616
43	121	1		30	2026-05-23 01:09:20.505
44	121	1		30	2026-05-23 01:09:23.205
45	121	1		30	2026-05-23 01:10:06.182
46	120	1		30	2026-05-23 01:10:06.847
47	119	1		30	2026-05-23 01:10:07.961
48	118	1		30	2026-05-23 01:10:09.079
49	117	1		30	2026-05-23 01:10:10.064
50	116	1		30	2026-05-23 01:10:11.013
51	115	1		30	2026-05-23 01:10:11.769
52	114	1		30	2026-05-23 01:10:13.191
53	113	1		30	2026-05-23 01:10:13.803
54	111	1		30	2026-05-23 01:10:15.077
55	112	1		30	2026-05-23 01:10:15.815
56	121	1		30	2026-05-23 01:10:27.269
57	128	1		30	2026-05-23 13:36:37.048
58	127	1		30	2026-05-23 13:36:39.133
59	130	1		30	2026-05-23 13:36:46.721
60	122	1		30	2026-05-23 13:36:47.595
61	123	1		30	2026-05-23 13:36:49.209
62	124	1		30	2026-05-23 13:36:50.781
63	125	1		30	2026-05-23 13:37:00.339
64	126	1		30	2026-05-23 13:37:01.409
65	129	1		30	2026-05-23 13:46:47.67
66	122	1		30	2026-05-23 13:46:51.303
67	130	1		30	2026-05-23 13:47:05.085
68	128	1		30	2026-05-23 13:47:05.859
69	126	1		30	2026-05-23 13:47:06.69
70	125	2	dssssssssssssssss	30	2026-05-23 13:47:18.468
71	127	1		30	2026-05-23 13:47:19.456
72	124	1		30	2026-05-23 13:47:20.482
73	123	1		30	2026-05-23 13:47:21.3
74	122	1		30	2026-05-23 13:53:38.414
75	123	1		30	2026-05-23 13:53:39.027
76	124	1		30	2026-05-23 13:53:39.817
77	127	1		30	2026-05-23 13:53:41.451
78	130	1		30	2026-05-23 13:53:44.497
79	128	1		30	2026-05-23 13:53:45.202
80	129	1		30	2026-05-23 13:53:45.843
81	126	1		30	2026-05-23 13:53:46.797
82	125	2	dddddddddddddddddddddddd	30	2026-05-23 13:53:51.738
83	122	1		30	2026-05-23 13:55:27.173
84	130	1		30	2026-05-23 13:55:28.785
85	128	1		30	2026-05-23 13:55:29.466
86	129	1		30	2026-05-23 13:55:30.152
87	126	1		30	2026-05-23 13:55:30.921
88	125	1		30	2026-05-23 13:55:31.694
89	124	1		30	2026-05-23 13:55:34.008
90	127	2	ddddddddddddddddddddddddddddddddd	30	2026-05-23 13:55:39.612
91	123	1		30	2026-05-23 13:55:41.422
92	122	1		30	2026-05-23 13:59:23.635
93	123	1		30	2026-05-23 13:59:27.252
94	124	1		30	2026-05-23 13:59:28.878
95	130	1		30	2026-05-23 13:59:33.914
96	128	1		30	2026-05-23 13:59:35.041
97	129	1		30	2026-05-23 13:59:35.948
98	125	1		30	2026-05-23 13:59:37.034
99	127	1		30	2026-05-23 13:59:37.745
100	126	2	kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk	30	2026-05-23 13:59:42.328
101	151	1		30	2026-05-23 14:20:17.737
102	152	1		30	2026-05-23 14:20:18.574
103	153	1		30	2026-05-23 14:20:20.719
104	154	1		30	2026-05-23 14:20:23.938
105	155	1		30	2026-05-23 14:20:24.864
106	161	1		30	2026-05-23 14:20:26.442
107	160	1		30	2026-05-23 14:20:27.215
108	159	1		30	2026-05-23 14:20:27.811
109	158	1		30	2026-05-23 14:20:28.88
110	157	1	fgfffffffffffff	30	2026-05-23 14:20:33.606
111	157	2	fgfffffffffffff	30	2026-05-23 14:20:35.769
112	156	1		30	2026-05-23 14:20:37.531
113	167	1		30	2026-05-23 14:46:20.472
114	166	1		30	2026-05-23 14:46:21.179
115	165	1		30	2026-05-23 14:46:22.003
116	164	1		30	2026-05-23 14:46:24.335
117	163	1		30	2026-05-23 14:46:25.039
118	162	1		30	2026-05-23 14:46:25.845
119	172	2	ddddddddddddddddd	30	2026-05-23 14:46:30.582
120	171	2	dddddddddddddddd	30	2026-05-23 14:46:34.068
121	170	1		30	2026-05-23 14:46:35.335
122	169	1		30	2026-05-23 14:46:36.136
123	168	1		30	2026-05-23 14:46:37.015
124	131	1		30	2026-05-23 14:54:38.716
125	132	1		30	2026-05-23 14:54:39.348
126	133	1		30	2026-05-23 14:54:40.102
127	134	1		30	2026-05-23 14:54:40.848
128	135	1		30	2026-05-23 14:54:42.1
129	136	1		30	2026-05-23 14:54:42.927
130	139	1		30	2026-05-23 14:54:44.864
131	138	1		30	2026-05-23 14:54:45.758
132	137	2	ccccccccccccccccccccccccc	30	2026-05-23 14:54:51.169
133	122	1		30	2026-05-23 15:02:00.674
134	123	1		30	2026-05-23 15:02:01.449
135	124	1		30	2026-05-23 15:02:02.269
136	127	1		30	2026-05-23 15:02:03.367
137	125	1		30	2026-05-23 15:02:04.528
138	126	1		30	2026-05-23 15:02:05.265
139	129	1		30	2026-05-23 15:02:06.115
140	128	1		30	2026-05-23 15:02:07.383
141	130	2	ddddddddddddddd	30	2026-05-23 15:02:11.21
142	146	1		30	2026-05-25 12:54:20.186
143	137	1		30	2026-05-25 12:55:10.22
144	137	1		30	2026-05-25 12:55:12.166
145	136	1		30	2026-05-26 06:39:13.08
146	137	1		30	2026-05-26 06:39:16.597
147	138	1		30	2026-05-26 06:39:17.364
148	132	1		30	2026-05-26 09:53:53.814
149	133	1		30	2026-05-26 09:53:54.457
150	134	1		30	2026-05-26 09:53:55.112
151	135	1		30	2026-05-26 09:53:55.819
152	136	1		30	2026-05-26 09:53:57.489
153	139	1		30	2026-05-26 09:53:58.362
154	138	1		30	2026-05-26 09:53:59.361
155	137	1		30	2026-05-26 09:54:00.272
156	131	1		30	2026-05-26 09:54:10.29
157	149	1		30	2026-05-26 13:54:59.031
158	140	1		30	2026-05-26 13:54:59.803
159	150	1		30	2026-05-26 13:55:00.558
160	148	1		30	2026-05-26 13:55:01.338
161	147	1		30	2026-05-26 13:55:02.98
162	141	1		30	2026-05-26 13:55:03.635
163	142	1		30	2026-05-26 13:55:04.375
164	143	1		30	2026-05-26 13:55:05.086
165	145	1		30	2026-05-26 13:55:06.581
166	146	1		30	2026-05-26 13:55:07.235
167	149	1		30	2026-05-26 14:12:12.551
168	146	1		30	2026-05-26 14:12:13.289
169	144	1		30	2026-05-26 14:12:14.917
170	142	1		30	2026-05-26 14:12:16.741
171	143	1		30	2026-05-26 14:12:17.99
172	140	1		30	2026-05-26 14:12:20.181
173	150	1		30	2026-05-26 14:12:20.71
174	148	1		30	2026-05-26 14:12:21.5
175	147	1		30	2026-05-26 14:12:22.304
176	141	1		30	2026-05-26 14:12:23.163
177	140	1		30	2026-05-26 14:12:33.922
178	140	2	ffffffffffffffff	30	2026-05-26 14:12:42.274
179	149	1		30	2026-05-26 14:13:35.53
180	146	1		30	2026-05-26 14:13:37.017
181	144	1		30	2026-05-26 14:13:38.474
182	143	1		30	2026-05-26 14:13:39.807
183	142	1		30	2026-05-26 14:13:40.448
184	141	1		30	2026-05-26 14:13:41.684
185	147	1		30	2026-05-26 14:13:42.341
186	148	1		30	2026-05-26 14:13:43.821
187	150	1		30	2026-05-26 14:13:44.535
188	140	1		30	2026-05-26 14:13:45.701
189	149	2	ddddddddddddddddddd	30	2026-05-26 14:13:54.072
190	175	1		30	2026-05-26 14:28:17.504
191	174	1		30	2026-05-26 14:28:18.064
192	173	1		30	2026-05-26 14:28:18.951
193	183	1		30	2026-05-26 14:28:21.115
194	182	1		30	2026-05-26 14:28:21.543
195	181	1		30	2026-05-26 14:28:21.992
196	176	1		30	2026-05-26 14:28:23.244
197	177	1		30	2026-05-26 14:28:23.702
198	178	1		30	2026-05-26 14:28:24.134
199	179	1		30	2026-05-26 14:28:24.671
200	180	1		30	2026-05-26 14:28:25.508
201	184	1		30	2026-05-26 15:11:51.858
202	185	1		30	2026-05-26 15:11:52.614
203	188	1		30	2026-05-26 15:11:54.08
204	189	1		30	2026-05-26 15:11:54.459
205	189	1		30	2026-05-26 15:11:54.738
206	190	1		30	2026-05-26 15:11:55.437
207	191	1		30	2026-05-26 15:11:55.912
208	192	1		30	2026-05-26 15:11:56.55
209	186	1		30	2026-05-26 15:11:57.943
210	187	1		30	2026-05-26 15:11:58.633
211	216	1		30	2026-05-26 16:26:36.089
212	217	1		30	2026-05-26 16:26:36.959
213	218	1		30	2026-05-26 16:26:37.762
214	219	1		30	2026-05-26 16:26:38.508
215	220	1		30	2026-05-26 16:26:38.723
216	221	1		30	2026-05-26 16:26:39.167
217	222	1		30	2026-05-26 16:26:40.859
218	223	1		30	2026-05-26 16:26:41.291
219	224	1		30	2026-05-26 16:26:41.963
220	225	1		30	2026-05-26 16:26:42.917
221	226	1		30	2026-05-26 16:26:44.259
222	227	1		30	2026-05-26 16:26:44.864
223	228	1		30	2026-05-26 16:26:45.573
224	229	1		30	2026-05-26 16:26:47.118
225	230	1		30	2026-05-26 16:26:47.787
226	231	1		30	2026-05-26 16:26:48.301
227	232	1		30	2026-05-26 16:26:48.891
228	215	1		30	2026-05-26 16:27:06.857
229	175	2	falta este doc de consentimiento	30	2026-05-26 16:35:37.355
230	236	1		30	2026-05-26 16:47:00.112
231	237	1		30	2026-05-26 16:47:01.569
232	238	2	falta 	30	2026-05-26 16:47:11.236
233	239	2	falta	30	2026-05-26 16:47:14.947
234	240	1		30	2026-05-26 16:47:16.7
235	241	1		30	2026-05-26 16:47:17.688
236	242	1		30	2026-05-26 16:47:18.963
237	243	1		30	2026-05-26 16:47:19.917
238	233	1		30	2026-05-26 16:47:21.103
239	234	1		30	2026-05-26 16:47:22.012
240	235	1		30	2026-05-26 16:47:22.959
241	250	2	FALTA DC	30	2026-05-26 17:00:34.567
242	251	2	FALTA DOCUMENTACION ESTA MAL 	30	2026-05-26 17:00:41.322
243	244	1		30	2026-05-26 17:00:43.741
244	245	1		30	2026-05-26 17:00:44.627
245	246	1		30	2026-05-26 17:00:46
246	247	1		30	2026-05-26 17:00:46.973
247	248	1		30	2026-05-26 17:00:48.048
248	249	1		30	2026-05-26 17:00:48.828
249	252	1		30	2026-05-26 17:00:49.782
250	250	1	FALTA DC	30	2026-05-26 17:02:15.231
251	251	1	FALTA DOCUMENTACION ESTA MAL 	30	2026-05-26 23:55:30.591
252	250	2	FALTA DC	30	2026-05-26 23:56:17.039
253	246	1		30	2026-05-27 03:13:19.668
254	247	1		30	2026-05-27 03:13:25.42
255	247	1		30	2026-05-27 03:18:08.241
256	247	1		30	2026-05-27 03:18:19.067
257	248	1		30	2026-05-27 03:18:32.033
258	247	1		30	2026-05-27 03:21:02.2
259	250	2	FALTA DC	30	2026-05-27 03:51:29.08
260	247	1		30	2026-05-27 03:51:33.306
261	248	1		30	2026-05-27 03:51:42.552
262	249	1		30	2026-05-27 03:51:52.179
263	250	1	FALTA DC	30	2026-05-27 03:51:59.363
264	254	1		30	2026-05-27 08:58:11.307
265	254	1		30	2026-05-27 08:58:31.645
266	254	1		30	2026-05-27 08:58:36.874
267	254	1		30	2026-05-27 08:58:45.058
268	255	1		30	2026-05-27 08:58:51.352
269	255	1		30	2026-05-27 08:58:57.1
270	256	1		30	2026-05-27 08:59:06.199
271	257	1		30	2026-05-27 08:59:08.621
272	258	1		30	2026-05-27 08:59:12.265
273	259	1		30	2026-05-27 08:59:17.195
274	260	1		30	2026-05-27 08:59:20.94
275	261	1		30	2026-05-27 08:59:24.802
276	262	1		30	2026-05-27 08:59:28.957
277	263	1		30	2026-05-27 08:59:34.993
278	264	1		30	2026-05-27 08:59:40.548
279	265	1		30	2026-05-27 09:23:41.434
280	266	2	FALTA DOCUMENTACION	30	2026-05-27 09:23:53.099
281	267	1		30	2026-05-27 09:23:56.788
282	268	1		30	2026-05-27 09:23:59.033
283	269	1		30	2026-05-27 09:24:01.669
284	270	1		30	2026-05-27 09:24:05.078
285	271	1		30	2026-05-27 09:24:09.153
286	272	1		30	2026-05-27 09:24:11.627
287	273	1		30	2026-05-27 09:24:14.127
288	274	1		30	2026-05-27 09:53:26.2
289	275	1		30	2026-05-27 09:53:30.395
290	276	1		30	2026-05-27 09:53:32.998
291	277	1		30	2026-05-27 09:53:34.744
292	278	1		30	2026-05-27 09:53:37.382
293	279	1		30	2026-05-27 09:53:41.311
294	280	1		30	2026-05-27 09:54:11.891
295	281	1		30	2026-05-27 09:54:14.895
296	282	1		30	2026-05-27 09:54:19.672
297	111	1		30	2026-05-28 10:43:13.851
298	111	1		30	2026-05-28 10:43:19.194
299	112	1		30	2026-05-28 10:43:24.934
300	112	1		30	2026-05-28 10:43:29.278
301	111	1		30	2026-05-28 10:43:42.447
302	300	1		30	2026-05-28 11:33:39.222
303	301	1		30	2026-05-28 11:33:47.926
304	302	1		30	2026-05-28 11:35:45.317
305	304	1		30	2026-05-28 11:36:04.688
306	305	1		30	2026-05-28 11:36:54.901
307	303	1		30	2026-05-28 11:37:04.036
308	303	1		30	2026-05-28 11:37:14.441
309	303	1		30	2026-05-28 11:37:15.212
310	304	1		30	2026-05-28 11:37:33.033
311	304	1		30	2026-05-28 11:37:33.565
312	305	1		30	2026-05-28 11:38:06.751
313	308	1		30	2026-05-28 11:38:29.358
314	307	1		30	2026-05-28 11:38:58.797
315	306	1		30	2026-05-28 11:39:10.765
316	306	1		30	2026-05-28 11:39:14.34
317	309	1		30	2026-05-28 15:29:48.876
318	310	1		30	2026-05-28 15:29:53.457
319	311	1		30	2026-05-28 15:30:20.547
320	312	1		30	2026-05-28 15:30:24.75
321	313	1		30	2026-05-28 15:30:26.683
322	314	1		30	2026-05-28 15:30:29.366
323	315	1		30	2026-05-28 15:30:33.085
324	316	1		30	2026-05-28 15:30:35.656
325	317	1		30	2026-05-28 15:30:54.693
326	318	1		30	2026-06-08 01:18:23.062
327	318	1		30	2026-06-08 01:18:27.508
328	319	1		30	2026-06-08 01:18:29.628
329	320	1		30	2026-06-08 01:18:31.254
330	321	1		30	2026-06-08 01:18:33.112
331	322	1		30	2026-06-08 01:18:36.631
332	323	1		30	2026-06-08 01:18:38.803
333	324	1		30	2026-06-08 01:18:40.369
334	325	1		30	2026-06-08 01:18:43.304
335	326	1		30	2026-06-08 01:18:46.482
\.


--
-- TOC entry 4225 (class 0 OID 24357)
-- Dependencies: 278
-- Data for Name: notificaciones_resolucion; Type: TABLE DATA; Schema: resolucion; Owner: ceish_user
--

COPY resolucion.notificaciones_resolucion (id, resolucion_id, destinatario_id, canal, asunto, cuerpo_mensaje, fecha_programada, fecha_envio, fecha_lectura, estado) FROM stdin;
\.


--
-- TOC entry 4223 (class 0 OID 24323)
-- Dependencies: 276
-- Data for Name: resoluciones; Type: TABLE DATA; Schema: resolucion; Owner: ceish_user
--

COPY resolucion.resoluciones (id, protocolo_id, version_id, tipo_resolucion_id, fecha_emision, fecha_notificacion_investigador, vigencia_aprobacion_anios, periodo_seguimiento_dias, observaciones_mayores, observaciones_menores, procedimiento_subsanacion, firmada_por_presidente, firmada_por_secretario, firma_electronica_valida, archivo_carta_pdf, creado_por) FROM stdin;
\.


--
-- TOC entry 4232 (class 0 OID 24442)
-- Dependencies: 285
-- Data for Name: eventos_adversos; Type: TABLE DATA; Schema: seguimiento; Owner: ceish_user
--

COPY seguimiento.eventos_adversos (id, protocolo_id, tipo_evento, codigo_sujeto, fecha_inicio_evento, fecha_fin_evento, descripcion, gravedad, fecha_reporte_inicial, reportado_por, informe_completo_recibido, fecha_informe_completo, causalidad_naranjo, grado_causalidad, notificado_arcsa, fecha_notificacion_arcsa, notificado_dis, fecha_notificacion_dis, estado_sujeto, creado_en) FROM stdin;
\.


--
-- TOC entry 4230 (class 0 OID 24426)
-- Dependencies: 283
-- Data for Name: informe_documento; Type: TABLE DATA; Schema: seguimiento; Owner: ceish_user
--

COPY seguimiento.informe_documento (informe_id, documento_id) FROM stdin;
\.


--
-- TOC entry 4229 (class 0 OID 24408)
-- Dependencies: 282
-- Data for Name: informes_seguimiento; Type: TABLE DATA; Schema: seguimiento; Owner: ceish_user
--

COPY seguimiento.informes_seguimiento (id, seguimiento_id, contenido, enviado_por) FROM stdin;
\.


--
-- TOC entry 4227 (class 0 OID 24377)
-- Dependencies: 280
-- Data for Name: seguimientos; Type: TABLE DATA; Schema: seguimiento; Owner: ceish_user
--

COPY seguimiento.seguimientos (id, protocolo_id, tipo_seguimiento_id, fecha_programada, fecha_vencimiento, fecha_recordatorio_1, fecha_recordatorio_2, estado_id, fue_notificado, fecha_notificacion, informe_recibido, fecha_recepcion_informe, evaluado_por, observaciones_evaluacion, aprobado) FROM stdin;
\.


--
-- TOC entry 4247 (class 0 OID 24627)
-- Dependencies: 300
-- Data for Name: audit_log; Type: TABLE DATA; Schema: sistema; Owner: ceish_user
--

COPY sistema.audit_log (id, usuario_id, accion, tabla, registro_id, datos_anteriores, datos_nuevos, ip_origen, protocolo_codigo, fecha) FROM stdin;
1	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "dgfhrthrthrtheertyhertyret", "sponsorRuc": "8797567546456", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 7, "institutions": [{"name": "p{ñ{lñ{", "type": "PUBLIC", "address": "lñ{lñ{", "contactPerson": "lñ{lñ{ñl"}], "sponsorPhone": "0988888888", "investigators": [], "isMulticentric": true, "sponsorAddress": "56gvhbn", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "hjgfj", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.103	\N	2026-05-13 14:12:48.275336
2	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "dssfsdfsdfsdfsdssfsdfsdfsdfsdssfsdfsdfsdfsdssfsdfsdfsdfsdssfsdfsdfsdfs", "sponsorRuc": "0920420343892", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 8, "institutions": [{"name": "sadasdasdasdasd", "type": "PUBLIC", "address": "sadasdsad", "contactPerson": "asdasdasd"}], "sponsorPhone": "0923423423", "investigators": [], "isMulticentric": true, "sponsorAddress": "amabato", "financingAmount": 1000, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 2, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "sadasdasdasdasd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 05:53:41.862597
3	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "eyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrreyetreterterrrrrrrrrrrrr", "sponsorRuc": "4534534534534", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 8, "institutions": [{"name": "errrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "type": "PUBLIC", "address": "retertretert", "contactPerson": "ertertertert"}], "sponsorPhone": "0945345345", "investigators": [], "isMulticentric": false, "sponsorAddress": "dfgdffgdfgdfgdfgdf", "financingAmount": 100, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 10, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "gdrggggggggggggggggggggg", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 09:03:27.382699
4	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "sponsorRuc": "4350345345345", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 6, "institutions": [{"name": "dfgdfgdf", "type": "PUBLIC", "address": "dfgdfg", "contactPerson": "fdgdfg"}], "sponsorPhone": "0943543534", "investigators": [], "isMulticentric": false, "sponsorAddress": "dsfsdfds", "financingAmount": 100, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 10, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "sdfdsf", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 09:14:58.449609
5	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss", "sponsorRuc": "6544444444444", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 6, "institutions": [{"name": "tttttttttttttttttttttttt", "type": "PUBLIC", "address": "erterrrrrrrrrrrrrrrr", "contactPerson": "rerrrrrrrrrrrrrrrr"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": false, "sponsorAddress": "ytutyut", "financingAmount": 100, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 99, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "utyutu", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 09:28:14.721972
6	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "dffffffffffffffffffffffffffdffffffffffffffffffffffffffdffffffffffffffffffffffffff", "sponsorRuc": "4566666666666", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 7, "institutions": [{"name": "gfhfffff", "type": "PUBLIC", "address": "rttrttt", "contactPerson": "rtyrtyt"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "ggdffffffffff", "financingAmount": 10, "geographicCoverage": "NACIONAL", "isAffidavitAccepted": true, "studyDurationMonths": 12, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "vvvvvvvv", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 09:38:19.619009
7	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "drrrrrrrrrrrssssssssss", "sponsorRuc": "0943333333333", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 7, "institutions": [{"name": "dffffff", "type": "PUBLIC", "address": "fdddddddddd", "contactPerson": "fddddddddd"}], "sponsorPhone": "0943333333", "investigators": [], "isMulticentric": true, "sponsorAddress": "fdggggg", "financingAmount": 100, "geographicCoverage": "NACIONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "fddddddddd", "hasExternalInstitutions": true, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 10:17:32.985051
8	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "dffffffffffffffffffffffdffffffffffffffffffffffdffffffffffffffffffffff", "sponsorRuc": "4533333333333", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 7, "institutions": [{"name": "fffffffffffffffffff", "type": "PRIVATE", "address": "dddddddddddd", "contactPerson": "ddddddddddddd"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "eeeeeeeeeeeeeeeeeeeeee", "financingAmount": 100, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "errrrrrrrr", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 10:27:31.173478
9	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "saaaaaaassssssssssssssssssssssss", "sponsorRuc": "4355555555555", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 7, "institutions": [{"name": "rrrrrrrrrrrrrrrrrrrrrrrrr", "type": "PUBLIC", "address": "rrrrrrrrrrrrrrrr", "contactPerson": "rrrrrrrrrrrrr"}], "sponsorPhone": "0955555555", "investigators": [], "isMulticentric": false, "sponsorAddress": "fggggd", "financingAmount": 220, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "gfgh", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 10:43:55.071798
165	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 11:55:24.91979
10	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ddddddddddddddddddzzzzzss", "sponsorRuc": "3455555555555", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 7, "institutions": [{"name": "777777777", "type": "PRIVATE", "address": "uuuuuuuuuuuuuuu", "contactPerson": "uuuuuuuuuuuuuuuu"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": false, "sponsorAddress": "dfdddddddddddd", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "ffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 10:52:12.832097
11	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "wwwwwwwwwwwwwwwwwwwwwwwww", "sponsorRuc": "5666666666666", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 8, "institutions": [{"name": "ccccccccc", "type": "PUBLIC", "address": "ccccccccccc", "contactPerson": "ccccccccccc"}], "sponsorPhone": "0988888888", "investigators": [], "isMulticentric": false, "sponsorAddress": "55555", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "tttttttttttt", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 11:29:02.842494
12	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ssssssssssssssssssssssssssssssssssss", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 7, "institutions": [{"name": "rrrrrrrrrrr", "type": "PUBLIC", "address": "rrrrrrrrrrrr", "contactPerson": "rrrrrrrrrrrr"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "4444444444", "financingAmount": 0, "geographicCoverage": "NACIONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "4444444", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 11:37:09.621793
13	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ssssssssssssssssssssssssssssssssssss", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 7, "institutions": [{"name": "rrrrrrrrrrr", "type": "PUBLIC", "address": "rrrrrrrrrrrr", "contactPerson": "rrrrrrrrrrrr"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "fdddddddddddddddddddd", "financingAmount": 0, "geographicCoverage": "NACIONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "fddddddddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 11:38:57.786325
14	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "sponsorRuc": "4444444444455", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 8, "institutions": [{"name": "ssssssssssssssss", "type": "PUBLIC", "address": "ssssssssssss", "contactPerson": "sssssssssssssssss"}], "sponsorPhone": "0977777777", "investigators": [], "isMulticentric": false, "sponsorAddress": "drfffffffffffffffffff", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ffffffffffffffffffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-15 11:40:10.877546
15	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "assssssssssssssssssssssss", "sponsorRuc": "2333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 8, "institutions": [{"name": "fffffffffff", "type": "PUBLIC", "address": "dddddddddddddd", "contactPerson": "dfffffffffff"}], "sponsorPhone": "0932222222", "investigators": [], "isMulticentric": false, "sponsorAddress": "fffffffff", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "vffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-16 02:11:39.190099
16	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "dffffffffffffffffffffffffffffffffffffff", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 8, "institutions": [{"name": "dddddddddddd", "type": "PRIVATE", "address": "ddddddd", "contactPerson": "ddddddddd"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "ddddddddddddddddddddddd", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ddddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-16 02:17:55.331519
17	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "dffffffffffffffffffffffffffffffffffffff", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 8, "institutions": [{"name": "dddddddddddd", "type": "PRIVATE", "address": "ddddddd", "contactPerson": "ddddddddd"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "ddddddddddddddddddddddd", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ddddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-16 02:19:07.288056
18	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "eeeeeeeeeeeeeeeeeeeeeeee", "sponsorRuc": "4555555555555", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 6, "institutions": [{"name": "jjjjjjjjjjj", "type": "PUBLIC", "address": "jjjjjjjjjjjjjg", "contactPerson": "ggggggggggg"}], "sponsorPhone": "0966666666", "investigators": [], "isMulticentric": false, "sponsorAddress": "hhhhhhhh", "financingAmount": 0, "geographicCoverage": "NACIONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "hhhh", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-16 02:23:41.02883
19	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/29/cv_0_detailed-report_es_it-an-1a-anteproyecto_trabajo_de_titulacion_proyecto_tecnico_fie-4txt (1).pdf", "fileName": "detailed-report_es_it-an-1a-anteproyecto_trabajo_de_titulacion_proyecto_tecnico_fie-4txt (1).pdf", "sizeBytes": "259872", "protocolId": 29, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.104	\N	2026-05-16 02:23:44.145775
166	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:04.682436
20	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ddddddddddddddddddddddddd", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 6, "institutions": [{"name": "4444444444f", "type": "PUBLIC", "address": "fffffffffffffffff", "contactPerson": "fffffffffffffffffffff"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "dddddddddd", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "dddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-16 07:08:06.545631
21	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/30/cv_0_Actividad autónoma colaborativa. Alcance del proyecto 1.pdf", "fileName": "Actividad autónoma colaborativa. Alcance del proyecto 1.pdf", "sizeBytes": "254124", "protocolId": 30, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.104	\N	2026-05-16 07:08:09.606122
22	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "gggggggggggggggggddddddddd", "sponsorRuc": "4344444444444", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 8, "institutions": [{"name": "ddddddddddddd", "type": "PUBLIC", "address": "ddddddddddddddddddddddddd", "contactPerson": "dddddddddddddddddddd"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "dddddd", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "ddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-16 07:30:42.683
23	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/31/cv_0_LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": 31, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.104	\N	2026-05-16 07:30:45.809118
24	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "gggggggggggggggggddddddddd", "sponsorRuc": "4344444444444", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 8, "institutions": [{"name": "ddddddddddddd", "type": "PUBLIC", "address": "ddddddddddddddddddddddddd", "contactPerson": "dddddddddddddddddddd"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "dddddd", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "ddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-16 07:38:16.529677
25	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/32/cv_0_LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": 32, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.104	\N	2026-05-16 07:38:19.611118
26	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "frrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 8, "institutions": [{"name": "dddddddddddddddddd", "type": "PUBLIC", "address": "ddddddddddddd", "contactPerson": "ddddddddddddddd"}], "sponsorPhone": "0933333333", "investigators": [], "isMulticentric": false, "sponsorAddress": "dddddddddddd", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "dddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-16 08:15:54.351445
27	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/33/cv_0_Oficio 001.pdf", "fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": 33, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.104	\N	2026-05-16 08:15:57.532358
59	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "kjllllllllllllllllllllllllllllllllllllllllllllllllllljjjjj", "sponsorRuc": "5555555555555", "sponsorWeb": "", "riskLevelId": 4, "studyTypeId": 8, "institutions": [{"name": "hhhhhhhhhhhhhhhhhhhhhh", "type": "PUBLIC", "address": "ddddddddddddddddddd", "contactPerson": "dddddddddddddddddddd"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "ggggggggggggggggggggggggggggggg", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "gggggggggggggggggggggggggggggggggggggggg", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.26	\N	2026-05-16 19:33:56.700729
60	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/66/cv_0_Especificación de Casos de Uso.pdf", "fileName": "Especificación de Casos de Uso.pdf", "sizeBytes": "1194864", "protocolId": 66, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.26	\N	2026-05-16 19:33:59.786517
61	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "kjllllllllllllllllllllllllllllllllllllllllllllllllllljjjjj", "sponsorRuc": "5555555555555", "sponsorWeb": "", "riskLevelId": 4, "studyTypeId": 7, "institutions": [{"name": "hhhhhhhhhhhhhhhhhhhhhh", "type": "PUBLIC", "address": "ddddddddddddddddddd", "contactPerson": "dddddddddddddddddddd"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "ggggggggggggggggggggggggggggggg", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "gggggggggggggggggggggggggggggggggggggggg", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.26	\N	2026-05-16 19:34:35.841086
62	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/67/cv_0_Especificación de Casos de Uso.pdf", "fileName": "Especificación de Casos de Uso.pdf", "sizeBytes": "1194864", "protocolId": 67, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.26	\N	2026-05-16 19:34:38.879523
63	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "kjllllllllllllllllllllllllllllllllllllllllllllllllllljjjjj", "sponsorRuc": "5555555555555", "sponsorWeb": "", "riskLevelId": 4, "studyTypeId": 5, "institutions": [{"name": "hhhhhhhhhhhhhhhhhhhhhh", "type": "PUBLIC", "address": "ddddddddddddddddddd", "contactPerson": "dddddddddddddddddddd"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "ggggggggggggggggggggggggggggggg", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "gggggggggggggggggggggggggggggggggggggggg", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.26	\N	2026-05-16 19:41:07.358628
64	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/68/cv_0_Especificación de Casos de Uso.pdf", "fileName": "Especificación de Casos de Uso.pdf", "sizeBytes": "1194864", "protocolId": 68, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.26	\N	2026-05-16 19:41:10.402251
65	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "sssssssssssssssssssssssssssssssssssssssss", "sponsorRuc": "2222222222222", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 6, "institutions": [{"name": "22222222222222", "type": "PUBLIC", "address": "2222222222222", "contactPerson": "dddddddddddddddd"}], "sponsorPhone": "0922222222", "investigators": [], "isMulticentric": true, "sponsorAddress": "eeeeeeeeeeeeee", "financingAmount": 0, "geographicCoverage": "LOCAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "eeeeeeeeeeeeeee", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 06:04:23.320406
66	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/69/cv_0_GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf", "fileName": "GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf", "sizeBytes": "115123", "protocolId": 69, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 06:04:26.449
67	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ddddddddddddddddddddddddddddddddd", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 6, "institutions": [{"name": "dddddddddddddddd", "type": "PUBLIC", "address": "dddddddddddddddddd", "contactPerson": "dddddddddddddddd"}], "sponsorPhone": "0933333333", "investigators": [], "isMulticentric": false, "sponsorAddress": "ffffffffffffff", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 06:24:21.120885
68	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/70/cv_0_Ejecución de pruebas simbólicas (1).pdf", "fileName": "Ejecución de pruebas simbólicas (1).pdf", "sizeBytes": "393477", "protocolId": 70, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 06:24:24.192422
69	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ddddddddddddddddddddddddddddddddd", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 5, "institutions": [{"name": "dddddddddddddddd", "type": "PUBLIC", "address": "dddddddddddddddddd", "contactPerson": "dddddddddddddddd"}], "sponsorPhone": "0933333333", "investigators": [], "isMulticentric": false, "sponsorAddress": "ffffffffffffff", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 06:27:10.971349
70	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/71/cv_0_Ejecución de pruebas simbólicas (1).pdf", "fileName": "Ejecución de pruebas simbólicas (1).pdf", "sizeBytes": "393477", "protocolId": 71, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 06:27:14.028354
71	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ddddddddddddddddddddddddddddddddd", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 7, "institutions": [{"name": "dddddddddddddddd", "type": "PUBLIC", "address": "dddddddddddddddddd", "contactPerson": "dddddddddddddddd"}], "sponsorPhone": "0933333333", "investigators": [], "isMulticentric": false, "sponsorAddress": "ffffffffffffff", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 06:27:45.191345
72	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/72/cv_0_Ejecución de pruebas simbólicas (1).pdf", "fileName": "Ejecución de pruebas simbólicas (1).pdf", "sizeBytes": "393477", "protocolId": 72, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 06:27:49.303791
73	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "dssssssssssssssssddddddddddddddd", "sponsorRuc": "2222222222222", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 7, "institutions": [{"name": "ddddddddddd", "type": "PUBLIC", "address": "ddddddddddddddd", "contactPerson": "ddddddddddddddddd"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "fffffffffffffffffffff", "financingAmount": 0, "geographicCoverage": "LOCAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "ffffffffffffffffffffffff", "hasExternalInstitutions": true, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 06:35:20.397521
74	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/73/cv_0_GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf", "fileName": "GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf", "sizeBytes": "115123", "protocolId": 73, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 06:35:23.523395
75	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "dssssssssssssssssddddddddddddddd", "sponsorRuc": "2222222222222", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 6, "institutions": [{"name": "ddddddddddd", "type": "PUBLIC", "address": "ddddddddddddddd", "contactPerson": "ddddddddddddddddd"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "fffffffffffffffffffff", "financingAmount": 0, "geographicCoverage": "LOCAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "ffffffffffffffffffffffff", "hasExternalInstitutions": true, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 06:35:56.972733
76	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/74/cv_0_GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf", "fileName": "GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf", "sizeBytes": "115123", "protocolId": 74, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 06:36:00.053888
90	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/81/cv_0_Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 81, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 17:36:54.212109
167	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:06.124764
168	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:08.123284
169	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:10.029551
77	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "kkkkkkkkkkkkkkkrrrrrrrrrrrrrrrrrrrk", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 6, "institutions": [{"name": "333333333333333", "type": "PUBLIC", "address": "44444444444444444", "contactPerson": "rrrrrrrrrrrrrrrrrrrrrrrr"}], "sponsorPhone": "0933333333", "investigators": [], "isMulticentric": false, "sponsorAddress": "rrrrrrrrrrrrrrrr", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "rrrrrrrrrrrrrrrrrrrr", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 15:05:52.720698
78	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/75/cv_0_Oficio 01.pdf", "fileName": "Oficio 01.pdf", "sizeBytes": "187463", "protocolId": 75, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 15:05:55.730265
79	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "kkkkkkkkkkkkkkkrrrrrrrrrrrrrrrrrrrk", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 7, "institutions": [{"name": "333333333333333", "type": "PUBLIC", "address": "44444444444444444", "contactPerson": "rrrrrrrrrrrrrrrrrrrrrrrr"}], "sponsorPhone": "0933333333", "investigators": [], "isMulticentric": false, "sponsorAddress": "rrrrrrrrrrrrrrrr", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "rrrrrrrrrrrrrrrrrrrr", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 15:06:44.955775
80	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/76/cv_0_Oficio 01.pdf", "fileName": "Oficio 01.pdf", "sizeBytes": "187463", "protocolId": 76, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 15:06:48.018573
81	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "llllllllllllllllllllllll", "sponsorRuc": "9888888888888", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 7, "institutions": [{"name": "ffffffffffffffffff", "type": "PUBLIC", "address": "fffffffffffffffffffffff", "contactPerson": "fffffffffffffffffffffffffff"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": false, "sponsorAddress": "jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 15:08:29.308869
82	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/77/cv_0_PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf", "fileName": "PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf", "sizeBytes": "238994", "protocolId": 77, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 15:08:32.335484
83	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", "sponsorRuc": "4444444444444", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 7, "institutions": [{"name": "ccccccccccccccccccccccccccccccccccc", "type": "PUBLIC", "address": "ccccccccccccccccccccccccccccccccccccc", "contactPerson": "ccccccccccccccccccccccccccccccccccc"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": true, "sponsorAddress": "fffffffffffffffffffffffffff", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ffffffffffffffffffffffffffffffffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 15:13:47.114885
84	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/78/cv_0_Ejecución de pruebas simbólicas.pdf", "fileName": "Ejecución de pruebas simbólicas.pdf", "sizeBytes": "393477", "protocolId": 78, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 15:13:50.287478
85	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh", "sponsorRuc": "0999999999999", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 7, "institutions": [{"name": "ijjjjjjjjjjjjjjjjjjjjjj", "type": "PUBLIC", "address": "mmmmmmmmmmmmmmmmm", "contactPerson": "kkkkkkkkkkkkkkk"}], "sponsorPhone": "0988888888", "investigators": [], "isMulticentric": false, "sponsorAddress": "jjjjjjjjjjjjjjjjjjjj", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "jjjjjjjjjjjjjj", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 16:02:02.961757
86	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/79/cv_0_Version 2 Historias de Usuario Historias Técnicas 1.pdf", "fileName": "Version 2 Historias de Usuario Historias Técnicas 1.pdf", "sizeBytes": "652952", "protocolId": 79, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 16:02:06.591927
87	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "eeeeeeeeeeeweeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "sponsorRuc": "5555555555555", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 7, "institutions": [{"name": "ggggggggggggggggg", "type": "PUBLIC", "address": "gggggggggggggggggggg", "contactPerson": "ggggggggggggggggggggggggg"}], "sponsorPhone": "0955555555", "investigators": [], "isMulticentric": false, "sponsorAddress": "gggggggggggggggggg", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "gggggggggggggggggg", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 17:09:42.091658
88	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/80/cv_0_GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf", "fileName": "GUÍA DE PRÁCTICAS CARRERA GPSOFTWARE (1).pdf", "sizeBytes": "115123", "protocolId": 80, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 17:09:46.435541
89	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj", "sponsorRuc": "0999999999999", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 7, "institutions": [{"name": "kkkkkkkkkkkkkkkkk", "type": "PUBLIC", "address": "jjjjjjjjjjjjjjjjjjjjjjjjjjjjj", "contactPerson": "llllllllllllllllllllllllllllllll"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": true, "sponsorAddress": "fffffffffffffffffffffffffffff", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ffffffffffffffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 17:36:51.300889
91	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "fggggggggggggggggggggggggggggggf", "sponsorRuc": "4444444444444", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 7, "institutions": [{"name": "ggggggggggggggggggg", "type": "PUBLIC", "address": "ggggggggggg", "contactPerson": "gggggggggggggggg"}], "sponsorPhone": "0955555555", "investigators": [], "isMulticentric": false, "sponsorAddress": "gggggggggggg", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ggggggggggggggggg", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 17:48:52.943618
92	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/82/cv_0_7c1c09b4db636a3e278d46175d12c99158c0.pdf", "fileName": "7c1c09b4db636a3e278d46175d12c99158c0.pdf", "sizeBytes": "1178000", "protocolId": 82, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 17:48:55.85494
93	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "fffffffffffffffffffffffffffffffffffffffffff", "sponsorRuc": "5555555555555", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 7, "institutions": [{"name": "hhhhhhhhhhhhhhh", "type": "PUBLIC", "address": "yyyyyyyyyyyy", "contactPerson": "yyyyyyyyyyyyy"}], "sponsorPhone": "0988888888", "investigators": [], "isMulticentric": false, "sponsorAddress": "uuuuuuuuuuuuuuu", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "uuuuuuuuuuuuuuu", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.9	\N	2026-05-17 18:02:31.735187
94	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/cv_0_Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 83, "requirementCode": "CV_INVESTIGADORES"}	::ffff:192.168.1.9	\N	2026-05-17 18:02:36.486563
95	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Ejecución de pruebas simbólicas.pdf", "fileName": "Ejecución de pruebas simbólicas.pdf", "sizeBytes": "393477", "protocolId": 83, "requirementCode": "CONSENTIMIENTO"}	::ffff:192.168.1.9	\N	2026-05-17 18:02:56.53384
96	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Leyes_de la evolución Del software (1).pdf", "fileName": "Leyes_de la evolución Del software (1).pdf", "sizeBytes": "342929", "protocolId": 83, "requirementCode": "DECLARACION_RESP"}	::ffff:192.168.1.9	\N	2026-05-17 18:03:01.007537
97	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Ejecución de pruebas simbólicas (1).pdf", "fileName": "Ejecución de pruebas simbólicas (1).pdf", "sizeBytes": "393477", "protocolId": 83, "requirementCode": "TRADUCCION_ANCESTRAL"}	::ffff:192.168.1.9	\N	2026-05-17 18:03:11.211498
98	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Ejecución de pruebas simbólicas.pdf", "fileName": "Ejecución de pruebas simbólicas.pdf", "sizeBytes": "393477", "protocolId": 83, "requirementCode": "CARTA_INTERES"}	::ffff:192.168.1.9	\N	2026-05-17 18:03:16.524546
99	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Costos - Metodo Montecarlo (3).pdf", "fileName": "Costos - Metodo Montecarlo (3).pdf", "sizeBytes": "655880", "protocolId": 83, "requirementCode": "POLIZA_SEGURO"}	::ffff:192.168.1.9	\N	2026-05-17 18:03:26.376159
100	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Leyes_de la evolución Del software (1).pdf", "fileName": "Leyes_de la evolución Del software (1).pdf", "sizeBytes": "342929", "protocolId": 83, "requirementCode": "ANEXO_6"}	::ffff:192.168.1.9	\N	2026-05-17 18:03:30.929999
101	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf", "fileName": "detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf", "sizeBytes": "268968", "protocolId": 83, "requirementCode": "CV_IP"}	::ffff:192.168.1.9	\N	2026-05-17 18:03:44.58361
102	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 83, "requirementCode": "PROTOCOLO_COMPLETO"}	::ffff:192.168.1.9	\N	2026-05-17 18:03:49.995818
103	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf", "fileName": "PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf", "sizeBytes": "238994", "protocolId": 83, "requirementCode": "PLAN_SEGURIDAD"}	::ffff:192.168.1.9	\N	2026-05-17 18:03:58.986375
104	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 83, "requirementCode": "PLAN_MONITOREO"}	::ffff:192.168.1.9	\N	2026-05-17 18:04:04.756106
105	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 83, "requirementCode": "FICHA_DESCRIPTIVA"}	::ffff:192.168.1.9	\N	2026-05-17 18:04:16.908196
106	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 83, "requirementCode": "MANUAL_INV"}	::ffff:192.168.1.9	\N	2026-05-17 18:04:22.24504
107	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 83, "requirementCode": "INSTRUMENTOS_REC"}	::ffff:192.168.1.9	\N	2026-05-17 18:04:30.071933
108	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Informe_Equipo1 (2).pdf", "fileName": "Informe_Equipo1 (2).pdf", "sizeBytes": "940997", "protocolId": 83, "requirementCode": "CERT_CAPACITACION"}	::ffff:192.168.1.9	\N	2026-05-17 18:05:11.260653
109	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 83, "requirementCode": "REGISTRO_SENESCYT"}	::ffff:192.168.1.9	\N	2026-05-17 18:05:18.375837
110	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 83, "requirementCode": "INFO_SEG_FARMACO"}	::ffff:192.168.1.9	\N	2026-05-17 18:05:23.701035
111	28	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "/uploads/protocols/83/Paper_DEVOPS.pdf", "fileName": "Paper_DEVOPS.pdf", "sizeBytes": "284472", "protocolId": 83, "requirementCode": "CONTRATO_PROMOTOR"}	::ffff:192.168.1.9	\N	2026-05-17 18:05:30.260829
170	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:12.306383
171	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:13.380772
172	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:14.316355
173	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:16.607607
177	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 20:57:17.436505
112	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ffffffffffrrrrrrrrrrrr", "sponsorRuc": "0999999999999", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "rrrrrrrrrrrrrrrrrrr", "type": "PUBLIC", "address": "rrrrrrrrrrrrrrrrrrrrrrrrr", "contactPerson": "rrrrrrrrrrrrrrrrrrrrrr"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "jjjjjjjjjjjjjjjjjj", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "jjjjjjjjjjj", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 15:17:17.516975
113	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "eeeeeeeeeeeeeeeeeeeeee", "sponsorRuc": "4444444444444", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 7, "institutions": [{"name": "tttttttttttttttttt", "type": "PUBLIC", "address": "tttttttttttttttttt", "contactPerson": "tttttttttttttttttttttt"}], "sponsorPhone": "0966666666", "investigators": [], "isMulticentric": false, "sponsorAddress": "hhhhhhhhhhhhhhhh", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "hhhhhhhhhhhhhhhhhhhhh", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 15:26:50.296512
114	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ffffffffffffffffffffffffff", "sponsorRuc": "6666666666666", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 7, "institutions": [{"name": "iiiiiiiiiiiiii", "type": "PUBLIC", "address": "yyyyyyyyyyyyyyyyyyy", "contactPerson": "iiiiiiiiiiiiiiiiiiiiiiiiiiiiii"}], "sponsorPhone": "0977777777", "investigators": [], "isMulticentric": true, "sponsorAddress": "nnnnnnnnnnnn", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "nnnnnnnnnnnn", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 18:44:01.273181
115	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ddddddddddddddddddddddddddddd", "sponsorRuc": "4444444444444", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 6, "institutions": [{"name": "jjjjjjjjjjjjjjjjjjjjjj", "type": "PUBLIC", "address": "kkkkkkkkkkkkkkkkk", "contactPerson": "kkkkkkkkkkkkkkkkkk"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "ffffffffffffffffffff", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "fffffffffffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 18:52:42.994897
116	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddd", "sponsorRuc": "5555555555555", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 7, "institutions": [{"name": "ñlllllllllllllllllll", "type": "PUBLIC", "address": "hhhhhhhhhhhhhhh", "contactPerson": "hhhhhhhhhhhhhhhhhhhh"}], "sponsorPhone": "0955555555", "investigators": [], "isMulticentric": false, "sponsorAddress": "gggggggggggggggggggg", "financingAmount": 6, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "gggggggggggggggggggggg", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 19:02:52.470006
117	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ddddddddddddddddddddddddddddddddddddddddddddddddddddd", "sponsorRuc": "7777777777777", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "ggggggggggggggggg", "type": "PRIVATE", "address": "ggggggggggggggg", "contactPerson": "gggggggggggggggggggg"}], "sponsorPhone": "0999999888", "investigators": [], "isMulticentric": true, "sponsorAddress": "ggggggggggggg", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ggggggggggggggg", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 19:16:47.463997
118	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ffffffffffffffffffffffffffffffff", "sponsorRuc": "4444444444444", "sponsorWeb": "", "riskLevelId": 4, "studyTypeId": 6, "institutions": [{"name": "rrrrrrrrrrrrrrrrrrrrrrrrrr", "type": "PUBLIC", "address": "rrrrrrrrrrrrrrrrrrrr", "contactPerson": "rrrrrrrrrrrrrrrrr"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": true, "sponsorAddress": "444444444444444444444", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "rrrrrrrrrrrrrrrrrrrrrr", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 19:39:15.672593
119	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "fffffffffffffffffffffffffffffffff", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 6, "institutions": [{"name": "4444444444444444", "type": "PUBLIC", "address": "rrrrrrrrrrrrrr", "contactPerson": "rrrrrrrrrrrrrr"}], "sponsorPhone": "0933333333", "investigators": [], "isMulticentric": false, "sponsorAddress": "eeeeeeeeeee", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 11, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "eeeeeeeeeeeee", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 19:47:28.636285
120	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "gggggggggggggggggggggggggggg", "sponsorRuc": "5555555555555", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 6, "institutions": [{"name": "77777777777777", "type": "PUBLIC", "address": "6666666", "contactPerson": "6666666666"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "hhhhhhhhhhhhh", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "ggggggggggggg", "hasExternalInstitutions": true, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 20:14:40.892295
174	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "nnnn kghjj jhjhgh khkjh kjhkjh"}	::ffff:192.168.1.100	\N	2026-05-19 12:45:36.852431
175	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:39.997905
121	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "hjhgggggggggggggggggggggggggggggggg", "sponsorRuc": "8999999999999", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 7, "institutions": [{"name": "oooooooooooooo", "type": "PUBLIC", "address": "pppppppppppppp", "contactPerson": "oooooooo"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": false, "sponsorAddress": "nnnnnnnnnnnnnnnnnnnnnnnn", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "jjjjjjjjjjjjjjjjjjjjjjjjj", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 20:37:36.209952
122	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "sponsorRuc": "5555555555555", "sponsorWeb": "", "riskLevelId": 4, "studyTypeId": 7, "institutions": [{"name": "gggggggggggggggg", "type": "PUBLIC", "address": "ggggggggggggggg", "contactPerson": "gggggggggggggggg"}], "sponsorPhone": "0955555555", "investigators": [], "isMulticentric": true, "sponsorAddress": "5555555", "financingAmount": 0, "geographicCoverage": "LOCAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "ttttttt", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 21:00:43.450262
123	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh", "sponsorRuc": "0966666666666", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 7, "institutions": [{"name": "yyyyyyyyyyyyy", "type": "PUBLIC", "address": "yyyyyyyyyyyyyy", "contactPerson": "yyyyyyyyyyy"}], "sponsorPhone": "0966666666", "investigators": [], "isMulticentric": false, "sponsorAddress": "0966666666666666666", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "66666666666", "hasExternalInstitutions": true, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 21:07:11.303075
124	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ttttttttttttttgggggggggggggggtttt", "sponsorRuc": "6666666666666", "sponsorWeb": "", "riskLevelId": 4, "studyTypeId": 6, "institutions": [{"name": "rrrrrrrrrrrrr", "type": "PUBLIC", "address": "rrrrrrrrrrrr", "contactPerson": "fffffffff"}], "sponsorPhone": "0966666666", "investigators": [], "isMulticentric": false, "sponsorAddress": "yyyyyyyyyyyyyyy", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "yyyyyyyyyyyyyyyyyyyyyyyyyyy", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 21:23:14.808915
125	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ggggggggggggggggggffffffffffffffffffffffffg", "sponsorRuc": "0989999999999", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "jjjjjjjjjjjjjjjjj", "type": "PUBLIC", "address": "jjjjjjjjjjjjjjj", "contactPerson": "jjjjjjjjjjjjjjj"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": false, "sponsorAddress": "jjjjjjjjjjjjjjjjj", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "jjjjjjjjjjjjjjj", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 22:29:30.54043
126	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ggggggggggggggggggffffffffffffffffffffffffg", "sponsorRuc": "0989999999999", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 7, "institutions": [{"name": "jjjjjjjjjjjjjjjjj", "type": "PUBLIC", "address": "jjjjjjjjjjjjjjj", "contactPerson": "jjjjjjjjjjjjjjj"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": false, "sponsorAddress": "jjjjjjjjjjjjjjjjj", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "jjjjjjjjjjjjjjj", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 22:39:36.765404
127	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "fffffffffffffffffffffffffff", "sponsorRuc": "0999999999999", "sponsorWeb": "", "riskLevelId": 4, "studyTypeId": 6, "institutions": [{"name": "iiiiiiiii", "type": "PUBLIC", "address": "iiiiiiiii", "contactPerson": "iiiiiiiiiiii"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "8777777777777", "financingAmount": 0, "geographicCoverage": "LOCAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "777777777777", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 22:49:03.153649
128	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Paper_DEVOPS.pdf", "protocolId": "99", "requirementId": "774"}	::ffff:192.168.1.100	\N	2026-05-18 22:49:03.286669
129	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Paper_DEVOPS.pdf", "protocolId": "99", "requirementId": "770"}	::ffff:192.168.1.100	\N	2026-05-18 22:49:11.206264
130	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "protocolId": "99", "requirementId": "771"}	::ffff:192.168.1.100	\N	2026-05-18 22:49:20.561488
131	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Paper_VV.pdf", "protocolId": "99", "requirementId": "772"}	::ffff:192.168.1.100	\N	2026-05-18 22:49:25.810441
132	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf", "protocolId": "99", "requirementId": "773"}	::ffff:192.168.1.100	\N	2026-05-18 22:49:32.140711
133	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Análisis de SLAM en 2 Diapositivas.pdf", "protocolId": "99", "requirementId": "775"}	::ffff:192.168.1.100	\N	2026-05-18 22:49:37.354517
134	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Análisis de SLAM en 2 Diapositivas.pdf", "protocolId": "99", "requirementId": "776"}	::ffff:192.168.1.100	\N	2026-05-18 22:49:43.342104
135	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Análisis de SLAM en 2 Diapositivas.pdf", "protocolId": "99", "requirementId": "777"}	::ffff:192.168.1.100	\N	2026-05-18 22:49:49.300836
136	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Paper_DEVOPS.pdf", "protocolId": "99", "requirementId": "778"}	::ffff:192.168.1.100	\N	2026-05-18 22:49:54.649959
176	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 12:45:41.190588
178	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 20:57:19.945719
179	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.101	\N	2026-05-21 16:49:59.698841
137	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "gggggggggggggggggggggggggggggggggggg", "sponsorRuc": "6666666666666", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "yyyyyyyyyyyyyy", "type": "PUBLIC", "address": "yyyyyyyyyyyyy", "contactPerson": "yyyyyyyyyyyyy"}], "sponsorPhone": "0966666666", "investigators": [], "isMulticentric": false, "sponsorAddress": "hhhhhhhhh", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "hhhhhhhhhhh", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 22:57:15.636791
138	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf", "protocolId": "100", "requirementId": "783"}	::ffff:192.168.1.100	\N	2026-05-18 22:57:15.795185
139	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Actividad autónoma colaborativa. Alcance del proyecto 1.pdf", "protocolId": "100", "requirementId": "779"}	::ffff:192.168.1.100	\N	2026-05-18 22:57:21.953058
140	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Análisis de SLAM en 2 Diapositivas.pdf", "protocolId": "100", "requirementId": "780"}	::ffff:192.168.1.100	\N	2026-05-18 22:57:26.505707
141	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Análisis de SLAM en 2 Diapositivas.pdf", "protocolId": "100", "requirementId": "781"}	::ffff:192.168.1.100	\N	2026-05-18 22:57:31.163093
142	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Paper_DEVOPS.pdf", "protocolId": "100", "requirementId": "782"}	::ffff:192.168.1.100	\N	2026-05-18 22:57:36.050252
143	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de Casos de Uso.pdf", "protocolId": "100", "requirementId": "784"}	::ffff:192.168.1.100	\N	2026-05-18 22:57:40.870925
144	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 01.pdf", "protocolId": "100", "requirementId": "785"}	::ffff:192.168.1.100	\N	2026-05-18 22:57:47.543586
145	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "protocolId": "100", "requirementId": "786"}	::ffff:192.168.1.100	\N	2026-05-18 22:57:52.422331
146	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Ejecución de pruebas simbólicas (1).pdf", "protocolId": "100", "requirementId": "787"}	::ffff:192.168.1.100	\N	2026-05-18 22:57:57.175387
147	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Actividad autónoma colaborativa. Alcance del proyecto 1.pdf", "protocolId": "100", "requirementId": "788"}	::ffff:192.168.1.100	\N	2026-05-18 22:58:01.897394
148	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de Casos de Uso.pdf", "protocolId": "100", "requirementId": "789"}	::ffff:192.168.1.100	\N	2026-05-18 22:58:06.398918
149	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ffffffffffffffffffffffffffffff", "sponsorRuc": "5555555555555", "sponsorWeb": "", "riskLevelId": 4, "studyTypeId": 6, "institutions": [{"name": "tttttttttttt", "type": "PUBLIC", "address": "tttttttttttt", "contactPerson": "tttttttttttt"}], "sponsorPhone": "0955555555", "investigators": [], "isMulticentric": true, "sponsorAddress": "hhhhhhhhhhhhhhhhhhhhhh", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "5555555555555", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-18 23:07:26.766804
150	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 01.pdf", "protocolId": "101", "requirementId": "794"}	::ffff:192.168.1.100	\N	2026-05-18 23:07:26.854043
151	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "protocolId": "101", "requirementId": "798"}	::ffff:192.168.1.100	\N	2026-05-18 23:07:47.53022
152	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "protocolId": "101", "requirementId": "797"}	::ffff:192.168.1.100	\N	2026-05-18 23:07:53.785433
153	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "protocolId": "101", "requirementId": "796"}	::ffff:192.168.1.100	\N	2026-05-18 23:07:58.733492
154	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf", "protocolId": "101", "requirementId": "795"}	::ffff:192.168.1.100	\N	2026-05-18 23:08:03.35589
155	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "protocolId": "101", "requirementId": "792"}	::ffff:192.168.1.100	\N	2026-05-18 23:08:10.19088
156	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de Casos de Uso.pdf", "protocolId": "101", "requirementId": "790"}	::ffff:192.168.1.100	\N	2026-05-18 23:08:16.086564
157	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf", "protocolId": "101", "requirementId": "791"}	::ffff:192.168.1.100	\N	2026-05-18 23:08:21.101264
158	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (2).pdf", "protocolId": "101", "requirementId": "793"}	::ffff:192.168.1.100	\N	2026-05-18 23:08:26.21634
159	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.100	\N	2026-05-18 23:08:32.757068
160	31	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": ""}	::ffff:192.168.1.100	\N	2026-05-18 23:19:57.084624
161	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "knklnklvfonjdsvovfdnvjkfnjvkfnjkvnfjkndfjkjfdnvjfnvjfnvjdfnjvndfjvndfjvnjfnknklnklvfonjdsvovfdnvjkfnjvkfnjkvnfjkndfjkjfdnvjfnvjfnvjdfnjvndfjvndfjvnjfnknklnklvfonjdsvovfdnvjkfnjvkfnjkvnfjkndfjkjfdnv", "sponsorRuc": "0606097335", "sponsorWeb": "xhdfjgcvhkhjbhvhjbknl", "riskLevelId": 5, "studyTypeId": 7, "institutions": [{"name": "bryuyrn", "type": "PRIVATE", "address": "tervwcbuihctrv", "contactPerson": "hjvjghvhjvjh"}], "sponsorPhone": "0935554544", "investigators": [], "isMulticentric": true, "sponsorAddress": "tnhnuyrnur", "financingAmount": 34, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "nrynynuy", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.100	\N	2026-05-19 08:42:31.937614
162	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "nhjmiyujhtgrffrgtnhjmiyujhtgrffrgtnhjmiyujhtgrffrgtnhjmiyujhtgrffrgtnhjmiyujhtgrffrgt", "sponsorRuc": "0609854938754", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 6, "institutions": [{"name": "rgftgbgfb", "type": "PUBLIC", "address": "onrevrttvvr", "contactPerson": "rvgfvrjnjrenvornvor"}], "sponsorPhone": "0934738473", "investigators": [], "isMulticentric": false, "sponsorAddress": "frgoitjoigtj", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "rijnfernijrnfijner", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.103	\N	2026-05-19 09:01:44.353451
163	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 11:54:41.047326
164	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.100	\N	2026-05-19 11:55:23.766042
180	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 6, "studyTypeId": 7, "institutions": [{"name": "rrrrrrrrrrrrrrrrrrrrrrr", "type": "PUBLIC", "address": "ffffffffffffffff", "contactPerson": "ffffffffffffffffffffff"}], "sponsorPhone": "0933333333", "investigators": [], "isMulticentric": false, "sponsorAddress": "dddddddddddd", "financingAmount": 0, "geographicCoverage": "ZONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "dddddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-22 09:11:21.586503
181	29	PROTOCOL_CREATED	\N	\N	\N	{"title": "dddddddddddddddddddddddddddddddddddddd", "sponsorRuc": "4444444444444", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "eeeeeeeeeeeee", "type": "PUBLIC", "address": "eeeeeeeeeeeeeeee", "contactPerson": "eeeeeeeeeeeeee"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "fffffffffffffffffff", "financingAmount": 0, "geographicCoverage": "LOCAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 29}	::ffff:192.168.1.103	\N	2026-05-22 09:13:23.010923
182	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ddddddddddddddddddddddddddddddddddfffffff", "sponsorRuc": "4444444444444", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "ddddddddddddddddddddd", "type": "PUBLIC", "address": "dddddddddddddddd", "contactPerson": "dddddddddddddd"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "fffffffffffffffffffff", "financingAmount": 0, "geographicCoverage": "NACIONAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "fffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-22 09:42:23.628012
183	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh", "sponsorRuc": "0999999999999", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "eeeeeeeeeeeeeeeeee", "type": "PUBLIC", "address": "dddddddddddd", "contactPerson": "dddddddddd"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "ddddddddddddddd", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ddddddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-22 09:58:19.132807
184	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf", "sizeBytes": "4542635", "protocolId": "107", "requirementId": "867"}	::ffff:192.168.1.102	\N	2026-05-22 09:58:24.018968
185	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf", "sizeBytes": "4542635", "protocolId": "107", "requirementId": "863"}	::ffff:192.168.1.102	\N	2026-05-22 09:58:29.771316
186	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PLA6_Introducción a la simulación.pdf", "sizeBytes": "9230019", "protocolId": "107", "requirementId": "864"}	::ffff:192.168.1.102	\N	2026-05-22 09:58:46.575656
187	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation_and_the_simulation_language_SLAM_II_as_.pdf", "sizeBytes": "478946", "protocolId": "107", "requirementId": "866"}	::ffff:192.168.1.102	\N	2026-05-22 09:58:50.268505
188	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM - Lenguaje de Simulación - Grupo 3.pdf", "sizeBytes": "2912276", "protocolId": "107", "requirementId": "865"}	::ffff:192.168.1.102	\N	2026-05-22 09:58:54.279241
189	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PLA6_Introducción a la simulación.pdf", "sizeBytes": "9230019", "protocolId": "107", "requirementId": "869"}	::ffff:192.168.1.102	\N	2026-05-22 09:59:01.232443
190	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM - Lenguaje de Simulación - Grupo 3.pdf", "sizeBytes": "2912276", "protocolId": "107", "requirementId": "868"}	::ffff:192.168.1.102	\N	2026-05-22 09:59:05.572076
191	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation_and_the_simulation_language_SLAM_II_as_.pdf", "sizeBytes": "478946", "protocolId": "107", "requirementId": "871"}	::ffff:192.168.1.102	\N	2026-05-22 09:59:08.922369
192	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf", "sizeBytes": "4542635", "protocolId": "107", "requirementId": "870"}	::ffff:192.168.1.102	\N	2026-05-22 09:59:17.914751
193	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ggggggggggggggggggggggggggggggggggggggggggggg", "sponsorRuc": "4444444444444", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "rrrrrrrrrrrrrrrrrr", "type": "PUBLIC", "address": "rrrrrrrrrrrrrrrrr", "contactPerson": "rrrrrrrrrrrrrrrrrr"}], "sponsorPhone": "0944444444", "investigators": [], "isMulticentric": false, "sponsorAddress": "rrrrrrrrrrrrrrr", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "rrrrrrrrrrrrrrrrr", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-22 10:13:45.788665
194	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation_and_the_simulation_language_SLAM_II_as_.pdf", "sizeBytes": "478946", "protocolId": "108", "requirementId": "876"}	::ffff:192.168.1.102	\N	2026-05-22 10:13:49.112384
195	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation_and_the_simulation_language_SLAM_II_as_.pdf", "sizeBytes": "478946", "protocolId": "108", "requirementId": "872"}	::ffff:192.168.1.102	\N	2026-05-22 10:14:00.125713
196	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf", "sizeBytes": "4542635", "protocolId": "108", "requirementId": "873"}	::ffff:192.168.1.102	\N	2026-05-22 10:14:05.051013
197	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PLA6_Introducción a la simulación.pdf", "sizeBytes": "9230019", "protocolId": "108", "requirementId": "875"}	::ffff:192.168.1.102	\N	2026-05-22 10:14:15.994555
198	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PLA6_Introducción a la simulación.pdf", "sizeBytes": "9230019", "protocolId": "108", "requirementId": "874"}	::ffff:192.168.1.102	\N	2026-05-22 10:14:22.121797
199	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Dialnet-DisenoYEvolucionDeUnSistemaDeManufacturaMedianteSi-5678811.pdf", "sizeBytes": "4542635", "protocolId": "108", "requirementId": "877"}	::ffff:192.168.1.102	\N	2026-05-22 10:14:30.935855
254	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:37:01.045845
200	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM - Lenguaje de Simulación - Grupo 3.pdf", "sizeBytes": "2912276", "protocolId": "108", "requirementId": "878"}	::ffff:192.168.1.102	\N	2026-05-22 10:14:38.355812
201	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM - Lenguaje de Simulación - Grupo 3.pdf", "sizeBytes": "2912276", "protocolId": "108", "requirementId": "879"}	::ffff:192.168.1.102	\N	2026-05-22 10:14:46.892504
202	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PLA6_Introducción a la simulación.pdf", "sizeBytes": "9230019", "protocolId": "108", "requirementId": "880"}	::ffff:192.168.1.102	\N	2026-05-22 10:14:54.026462
203	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PLA6_Introducción a la simulación.pdf", "sizeBytes": "9230019", "protocolId": "108", "requirementId": "881"}	::ffff:192.168.1.102	\N	2026-05-22 10:15:01.444454
204	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PLA6_Introducción a la simulación.pdf", "sizeBytes": "9230019", "protocolId": "108", "requirementId": "882"}	::ffff:192.168.1.102	\N	2026-05-22 10:15:07.151141
205	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-22 10:15:18.905993
206	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-22 10:16:21.534399
207	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "tttttttttttttttttttttttt"}	::ffff:192.168.1.10	\N	2026-05-23 04:57:35.27529
208	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 04:57:39.184504
209	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 04:58:52.433431
210	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:03.809207
211	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:04.879599
212	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:08.923865
213	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:09.612933
214	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:18.887821
215	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:24.792439
216	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:25.442166
217	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:26.237118
218	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:27.017926
219	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:27.868236
220	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:08:39.718954
221	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:00.74764
222	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:05.121017
223	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:06.055844
224	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:06.815304
225	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:07.548568
226	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:08.788565
227	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:09.313788
228	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:10.001192
229	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:11.111286
230	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:11.703585
231	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:12.419708
232	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:19.507211
233	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:09:25.175516
234	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:07.366001
235	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:07.97989
236	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:08.970666
237	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:09.974802
238	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:10.878058
239	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:11.713508
240	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:12.394236
241	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:13.670983
242	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:14.225241
243	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:15.370914
244	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:16.035569
245	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 06:10:26.351149
246	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "kkllkkkkkkkkkkkkkkkkkkkkkkklll"}	::ffff:192.168.1.10	\N	2026-05-23 06:11:38.643144
247	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:36:38.562758
248	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:36:40.445529
249	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:36:47.342844
250	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:36:48.134684
251	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:36:49.601354
252	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:36:51.039807
253	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:36:59.716821
255	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:46:47.467105
256	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:46:50.770881
257	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:47:06.451666
258	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:47:07.070139
259	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:47:07.812604
260	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "dssssssssssssssss"}	::ffff:192.168.1.10	\N	2026-05-23 18:47:18.486174
261	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:47:19.379184
262	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:47:20.29959
263	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:47:21.043414
264	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:53:39.73911
265	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:53:40.297199
266	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:53:41.029087
267	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:53:42.53576
268	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:53:45.290286
269	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:53:45.906999
270	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:53:46.481987
271	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:53:47.339093
272	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "dddddddddddddddddddddddd"}	::ffff:192.168.1.10	\N	2026-05-23 18:53:51.797327
273	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:55:27.66018
274	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:55:29.118339
275	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:55:29.760544
276	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:55:30.343969
277	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:55:31.03283
278	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:55:31.73187
279	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:55:33.814375
280	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "ddddddddddddddddddddddddddddddddd"}	::ffff:192.168.1.10	\N	2026-05-23 18:55:38.917875
281	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:55:40.57424
282	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:59:23.544622
283	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:59:26.779083
284	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:59:28.266468
285	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:59:32.881785
286	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:59:36.748923
287	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:59:37.586371
288	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:59:38.60255
289	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 18:59:39.269556
290	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk"}	::ffff:192.168.1.10	\N	2026-05-23 18:59:43.534469
291	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "kevin "}	::ffff:192.168.1.10	\N	2026-05-23 19:00:05.029458
292	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "kevin "}	::ffff:192.168.1.10	\N	2026-05-23 19:00:10.270983
293	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "kevin "}	::ffff:192.168.1.10	\N	2026-05-23 19:00:45.236412
294	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ccccccccccccccccccccccccccccccccccccccccccccccccccc", "sponsorRuc": "0999999999999", "sponsorWeb": "", "riskLevelId": 8, "studyTypeId": 6, "institutions": [{"name": "fggggggggggggggggggggggggggggg", "type": "PUBLIC", "address": "gggggggggggggggggggggggggg", "contactPerson": "gggggggggggggggggggggggggggggggg"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": false, "sponsorAddress": "ddddddddddddddddddd", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "ddddddddddddddddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.10	\N	2026-05-23 19:18:00.531857
295	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "109", "requirementId": "887"}	::ffff:192.168.1.10	\N	2026-05-23 19:18:03.433396
296	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf", "sizeBytes": "238994", "protocolId": "109", "requirementId": "883"}	::ffff:192.168.1.10	\N	2026-05-23 19:18:09.179937
297	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "COTIZACIÓN.pdf", "sizeBytes": "423332", "protocolId": "109", "requirementId": "884"}	::ffff:192.168.1.10	\N	2026-05-23 19:18:16.037582
298	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 01.pdf", "sizeBytes": "187463", "protocolId": "109", "requirementId": "885"}	::ffff:192.168.1.10	\N	2026-05-23 19:18:24.977993
299	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "109", "requirementId": "886"}	::ffff:192.168.1.10	\N	2026-05-23 19:18:30.732323
300	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM_Simulation_Language.pdf", "sizeBytes": "10606508", "protocolId": "109", "requirementId": "888"}	::ffff:192.168.1.10	\N	2026-05-23 19:18:36.684925
301	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "109", "requirementId": "889"}	::ffff:192.168.1.10	\N	2026-05-23 19:18:42.454525
302	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Costos - Metodo Montecarlo (2).pdf", "sizeBytes": "655880", "protocolId": "109", "requirementId": "890"}	::ffff:192.168.1.10	\N	2026-05-23 19:18:49.633744
303	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "sizeBytes": "1113981", "protocolId": "109", "requirementId": "891"}	::ffff:192.168.1.10	\N	2026-05-23 19:18:56.200558
304	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "109", "requirementId": "892"}	::ffff:192.168.1.10	\N	2026-05-23 19:19:03.310094
305	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "109", "requirementId": "893"}	::ffff:192.168.1.10	\N	2026-05-23 19:19:10.31416
306	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.10	\N	2026-05-23 19:19:24.789282
307	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:17.096484
308	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:17.874173
309	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:19.85242
310	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:25.64441
311	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:26.507783
312	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:27.95955
313	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:28.681735
314	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:29.245335
315	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:30.230048
316	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": "fgfffffffffffff"}	::ffff:192.168.1.10	\N	2026-05-23 19:20:34.528578
317	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "fgfffffffffffff"}	::ffff:192.168.1.10	\N	2026-05-23 19:20:36.515554
318	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:20:38.115669
319	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "fffffffffffffffffffffffdfdf"}	::ffff:192.168.1.10	\N	2026-05-23 19:20:50.336372
320	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.10	\N	2026-05-23 19:20:52.303533
321	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "ssssssssssssssssssssssssssssssssssssss", "sponsorRuc": "3333333333333", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 6, "institutions": [{"name": "dddddddddddddd", "type": "PUBLIC", "address": "ddddddddddddddddddddd", "contactPerson": "ddddddddddddddd"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": false, "sponsorAddress": "fffffffffffffff", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "fffffffffffffffff", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.10	\N	2026-05-23 19:44:27.336845
322	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "110", "requirementId": "898"}	::ffff:192.168.1.10	\N	2026-05-23 19:44:33.117119
323	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (1).pdf", "sizeBytes": "268968", "protocolId": "110", "requirementId": "894"}	::ffff:192.168.1.10	\N	2026-05-23 19:44:40.324525
324	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "sizeBytes": "1113981", "protocolId": "110", "requirementId": "895"}	::ffff:192.168.1.10	\N	2026-05-23 19:44:44.857681
325	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Paper_VV.pdf", "sizeBytes": "277513", "protocolId": "110", "requirementId": "896"}	::ffff:192.168.1.10	\N	2026-05-23 19:44:50.541947
326	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "sizeBytes": "1113981", "protocolId": "110", "requirementId": "897"}	::ffff:192.168.1.10	\N	2026-05-23 19:45:00.036614
327	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "sizeBytes": "1113981", "protocolId": "110", "requirementId": "899"}	::ffff:192.168.1.10	\N	2026-05-23 19:45:13.550459
328	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "110", "requirementId": "900"}	::ffff:192.168.1.10	\N	2026-05-23 19:45:20.259637
329	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "sizeBytes": "1113981", "protocolId": "110", "requirementId": "901"}	::ffff:192.168.1.10	\N	2026-05-23 19:45:27.034785
330	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de Casos de Uso.pdf", "sizeBytes": "1194864", "protocolId": "110", "requirementId": "902"}	::ffff:192.168.1.10	\N	2026-05-23 19:45:43.169026
331	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "sizeBytes": "1113981", "protocolId": "110", "requirementId": "903"}	::ffff:192.168.1.10	\N	2026-05-23 19:45:48.863405
332	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "sizeBytes": "1113981", "protocolId": "110", "requirementId": "904"}	::ffff:192.168.1.10	\N	2026-05-23 19:45:54.733497
333	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.10	\N	2026-05-23 19:45:59.580919
334	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:46:21.229988
335	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:46:21.881172
336	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:46:22.616244
337	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:46:24.735423
338	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:46:25.352386
339	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:46:26.072263
340	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "ddddddddddddddddd"}	::ffff:192.168.1.10	\N	2026-05-23 19:46:30.340054
341	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "dddddddddddddddd"}	::ffff:192.168.1.10	\N	2026-05-23 19:46:33.481244
342	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:46:34.631676
343	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:46:35.451276
344	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:46:36.148191
345	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "kevincin"}	::ffff:192.168.1.10	\N	2026-05-23 19:46:49.157582
346	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.10	\N	2026-05-23 19:46:50.281138
347	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:54:38.925849
348	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:54:39.489857
349	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:54:40.172699
350	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:54:40.830629
351	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:54:41.965975
352	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:54:42.716405
353	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:54:44.491085
354	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 19:54:45.284276
355	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "ccccccccccccccccccccccccc"}	::ffff:192.168.1.10	\N	2026-05-23 19:54:50.204027
356	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "kevin pruebas "}	::ffff:192.168.1.10	\N	2026-05-23 19:55:00.313316
357	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.10	\N	2026-05-23 19:55:00.946385
358	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 20:01:59.687893
359	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 20:02:00.342443
360	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 20:02:03.962511
361	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 20:02:04.960594
362	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 20:02:06.015314
363	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 20:02:06.705453
364	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 20:02:07.471399
365	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-23 20:02:08.650791
366	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "ddddddddddddddd"}	::ffff:192.168.1.10	\N	2026-05-23 20:02:12.156223
367	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "kevin  y"}	::ffff:192.168.1.10	\N	2026-05-23 20:02:20.512096
368	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.10	\N	2026-05-23 20:02:22.378554
369	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-25 17:54:23.935458
370	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-25 17:55:12.506578
371	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.10	\N	2026-05-25 17:55:14.293579
372	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 11:39:13.112504
373	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 11:39:16.608328
374	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 11:39:17.359308
375	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 14:53:53.852604
376	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 14:53:54.491737
377	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 14:53:55.147701
378	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 14:53:55.857564
379	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 14:53:57.528835
380	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 14:53:58.409612
381	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 14:53:59.399552
382	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 14:54:00.288097
383	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 14:54:10.076451
384	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "kevin pruebas "}	::ffff:192.168.1.102	\N	2026-05-26 14:54:44.014606
385	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 14:54:45.727642
386	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:54:59.753847
387	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:55:00.485032
388	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:55:01.415286
389	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:55:01.950146
390	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:55:03.550317
391	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:55:04.138496
392	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:55:04.87637
393	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:55:05.540555
394	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:55:06.965705
395	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 18:55:07.730406
396	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "prueba 1.2"}	::ffff:192.168.1.102	\N	2026-05-26 18:55:16.997561
397	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 18:55:22.125634
398	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:02:33.797291
399	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 19:02:34.418609
400	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:12.028225
401	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:12.70703
402	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:14.256076
403	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:17.552429
404	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:18.85408
405	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:20.833849
406	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:21.332362
407	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:22.082209
408	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:22.856129
409	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:23.677143
410	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:12:33.907979
411	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "ffffffffffffffff"}	::ffff:192.168.1.102	\N	2026-05-26 19:12:41.865917
412	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:35.618756
413	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:37.033473
414	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:38.421464
415	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:39.69385
416	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:40.299413
417	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:41.478095
418	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:42.093917
419	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:43.504876
420	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:44.177442
421	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:13:45.312141
422	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "ddddddddddddddddddd"}	::ffff:192.168.1.102	\N	2026-05-26 19:13:54.811591
423	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "prueba 1"}	::ffff:192.168.1.102	\N	2026-05-26 19:14:01.348154
424	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 19:14:01.980642
425	30	RECEPTION_CERTIFICATE_ISSUED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 19:14:47.358109
426	30	RECEPTION_CERTIFICATE_ISSUED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 19:17:12.317099
427	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "sponsorRuc": "0999999999999", "sponsorWeb": "", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "dddddddddddddddddddddddddddddddddddd", "type": "PUBLIC", "address": "dddddddddddddddd", "contactPerson": "fffffffffffffffffffff"}], "sponsorPhone": "0977777777", "investigators": [], "isMulticentric": false, "sponsorAddress": "hhhhhhhhhhhhhhh", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 12, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": "hhhhhhhhhhhhhhhhhhhhhhhhhhhhh", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-26 19:25:22.347194
428	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "111", "requirementId": "909"}	::ffff:192.168.1.102	\N	2026-05-26 19:25:27.050881
429	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (1).pdf", "sizeBytes": "268968", "protocolId": "111", "requirementId": "905"}	::ffff:192.168.1.102	\N	2026-05-26 19:25:46.091325
430	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Costos - Metodo Montecarlo (3).pdf", "sizeBytes": "655880", "protocolId": "111", "requirementId": "907"}	::ffff:192.168.1.102	\N	2026-05-26 19:25:50.450848
431	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "111", "requirementId": "906"}	::ffff:192.168.1.102	\N	2026-05-26 19:25:58.189309
432	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PRODUCT BACKLOG COMPLETO - CEISH-ESPOCH.pdf", "sizeBytes": "238994", "protocolId": "111", "requirementId": "908"}	::ffff:192.168.1.102	\N	2026-05-26 19:26:04.060177
433	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "111", "requirementId": "910"}	::ffff:192.168.1.102	\N	2026-05-26 19:26:10.029548
434	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt.pdf", "sizeBytes": "268968", "protocolId": "111", "requirementId": "911"}	::ffff:192.168.1.102	\N	2026-05-26 19:26:15.132816
435	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "111", "requirementId": "912"}	::ffff:192.168.1.102	\N	2026-05-26 19:26:19.89648
436	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "111", "requirementId": "913"}	::ffff:192.168.1.102	\N	2026-05-26 19:26:26.632572
437	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Ejecución de pruebas simbólicas.pdf", "sizeBytes": "393477", "protocolId": "111", "requirementId": "914"}	::ffff:192.168.1.102	\N	2026-05-26 19:26:33.000891
438	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "111", "requirementId": "915"}	::ffff:192.168.1.102	\N	2026-05-26 19:26:40.133439
439	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 19:27:17.579025
440	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:17.669228
441	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:18.208506
442	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:19.070752
443	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:21.098698
444	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:21.505937
445	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:21.927186
446	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:23.126704
447	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:23.548714
448	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:23.97884
449	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:24.483824
450	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 19:28:25.313657
451	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "prueba q"}	::ffff:192.168.1.102	\N	2026-05-26 19:28:31.266903
452	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 19:28:31.89149
453	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "holajjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj", "sponsorRuc": "5841861616516", "sponsorWeb": ",,l,kmkmkl", "riskLevelId": 5, "studyTypeId": 6, "institutions": [{"name": "holaaaaaaaaaaaaaaaaaaaaaaa", "type": "PUBLIC", "address": "holaaaaaaaaaaaaaaaa", "contactPerson": "holaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}], "sponsorPhone": "0985616541", "investigators": [], "isMulticentric": false, "sponsorAddress": "njnikm", "financingAmount": 777, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 1, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": "kmkmkknk", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-26 20:08:12.099776
454	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "112", "requirementId": "920"}	::ffff:192.168.1.104	\N	2026-05-26 20:08:18.466124
455	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "112", "requirementId": "916"}	::ffff:192.168.1.104	\N	2026-05-26 20:08:35.466643
456	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "112", "requirementId": "917"}	::ffff:192.168.1.104	\N	2026-05-26 20:08:47.846028
457	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Version 3 - PRODUCT BACKLOG (1).pdf", "sizeBytes": "239648", "protocolId": "112", "requirementId": "919"}	::ffff:192.168.1.104	\N	2026-05-26 20:08:53.981592
458	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "112", "requirementId": "924"}	::ffff:192.168.1.104	\N	2026-05-26 20:09:02.122356
459	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "112", "requirementId": "923"}	::ffff:192.168.1.104	\N	2026-05-26 20:09:09.357301
460	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ORTIZ GUSÑAY JOSE BALTAZAR.pdf", "sizeBytes": "50256", "protocolId": "112", "requirementId": "921"}	::ffff:192.168.1.104	\N	2026-05-26 20:09:17.335743
461	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo (1).pdf", "sizeBytes": "170369", "protocolId": "112", "requirementId": "922"}	::ffff:192.168.1.104	\N	2026-05-26 20:09:26.272965
462	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf", "sizeBytes": "12409898", "protocolId": "112", "requirementId": "918"}	::ffff:192.168.1.104	\N	2026-05-26 20:09:39.93296
463	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-26 20:10:11.119297
464	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:52.299278
465	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:52.986879
466	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:54.405225
467	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:54.747067
468	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:54.976953
469	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:55.739966
470	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:56.070545
471	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:56.698002
472	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:57.978482
473	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 20:11:58.62221
474	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "dddddddddddd"}	::ffff:192.168.1.102	\N	2026-05-26 20:12:34.362769
475	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 20:12:34.997282
476	30	RECEPTION_CERTIFICATE_ISSUED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 20:12:38.874983
477	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "gdffffffffffffffffffffffffffffffffffffffffffffffffff", "sponsorRuc": "1000000000000", "sponsorWeb": "", "riskLevelId": 7, "studyTypeId": 6, "institutions": [{"name": "4555555555555555555", "type": "PRIVATE", "address": "yyyyyyyyyyyyyyy", "contactPerson": "yyyyyyyyyyyyyyyyyyyy"}], "sponsorPhone": "0999999999", "investigators": [], "isMulticentric": true, "sponsorAddress": "ddddddddddddddddddddddddddddd", "financingAmount": 0, "geographicCoverage": "PROVINCIAL", "isAffidavitAccepted": true, "studyDurationMonths": 12, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": "dddddddddd", "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-26 20:31:29.067565
478	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Anexo_7_Constancia_TRÁMITE EN PROCESO.pdf", "sizeBytes": "102", "protocolId": "113", "requirementId": "929"}	::ffff:192.168.1.102	\N	2026-05-26 20:31:32.240259
479	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM_Simulation_Language.pdf", "sizeBytes": "10606508", "protocolId": "113", "requirementId": "929"}	::ffff:192.168.1.102	\N	2026-05-26 20:33:05.652646
480	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "113", "requirementId": "925"}	::ffff:192.168.1.102	\N	2026-05-26 20:33:12.761524
481	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "113", "requirementId": "926"}	::ffff:192.168.1.102	\N	2026-05-26 20:33:18.385791
482	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Paper_VV.pdf", "sizeBytes": "277513", "protocolId": "113", "requirementId": "927"}	::ffff:192.168.1.102	\N	2026-05-26 20:33:24.057032
483	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 01.pdf", "sizeBytes": "187463", "protocolId": "113", "requirementId": "928"}	::ffff:192.168.1.102	\N	2026-05-26 20:33:28.84683
484	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 01.pdf", "sizeBytes": "187463", "protocolId": "113", "requirementId": "930"}	::ffff:192.168.1.102	\N	2026-05-26 20:33:34.411322
485	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "113", "requirementId": "931"}	::ffff:192.168.1.102	\N	2026-05-26 20:33:39.402383
486	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "113", "requirementId": "932"}	::ffff:192.168.1.102	\N	2026-05-26 20:33:44.936944
487	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM_Simulation_Language.pdf", "sizeBytes": "10606508", "protocolId": "113", "requirementId": "933"}	::ffff:192.168.1.102	\N	2026-05-26 20:33:53.490325
488	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 20:33:58.658913
489	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "los niños de la casa de tomas armando", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 28}	::ffff:192.168.1.104	\N	2026-05-26 21:15:43.439511
490	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Version 3 - PRODUCT BACKLOG (1).pdf", "sizeBytes": "239648", "protocolId": "114", "requirementId": "934"}	::ffff:192.168.1.104	\N	2026-05-26 21:16:18.078944
491	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "114", "requirementId": "935"}	::ffff:192.168.1.104	\N	2026-05-26 21:16:21.703009
492	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "114", "requirementId": "936"}	::ffff:192.168.1.104	\N	2026-05-26 21:16:26.902556
493	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo (1).pdf", "sizeBytes": "170369", "protocolId": "114", "requirementId": "938"}	::ffff:192.168.1.104	\N	2026-05-26 21:16:34.892095
494	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf", "sizeBytes": "12409898", "protocolId": "114", "requirementId": "937"}	::ffff:192.168.1.104	\N	2026-05-26 21:16:35.049527
495	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf", "sizeBytes": "12409898", "protocolId": "114", "requirementId": "939"}	::ffff:192.168.1.104	\N	2026-05-26 21:16:43.423436
496	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PROMO MAYO.pdf", "sizeBytes": "4179645", "protocolId": "114", "requirementId": "941"}	::ffff:192.168.1.104	\N	2026-05-26 21:16:50.838815
497	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo (1).pdf", "sizeBytes": "170369", "protocolId": "114", "requirementId": "940"}	::ffff:192.168.1.104	\N	2026-05-26 21:16:58.507215
498	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LEVEL_A2_CERTIFICADO (2).pdf", "sizeBytes": "3754556", "protocolId": "114", "requirementId": "943"}	::ffff:192.168.1.104	\N	2026-05-26 21:17:02.969556
499	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo (1).pdf", "sizeBytes": "170369", "protocolId": "114", "requirementId": "944"}	::ffff:192.168.1.104	\N	2026-05-26 21:17:08.16744
500	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ORTIZ GUSÑAY JOSE BALTAZAR.pdf", "sizeBytes": "50256", "protocolId": "114", "requirementId": "945"}	::ffff:192.168.1.104	\N	2026-05-26 21:17:11.110674
501	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ORTIZ GUSÑAY JOSE BALTAZAR.pdf", "sizeBytes": "50256", "protocolId": "114", "requirementId": "942"}	::ffff:192.168.1.104	\N	2026-05-26 21:17:14.171233
502	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "la la nuevpo aifvnfk nuevo rotoclo lilicita ", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 7, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::ffff:192.168.1.104	\N	2026-05-26 21:22:47.695346
503	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LEVEL_A2_CERTIFICADO (2).pdf", "sizeBytes": "3754556", "protocolId": "115", "requirementId": "946"}	::ffff:192.168.1.104	\N	2026-05-26 21:23:13.372334
504	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LEVEL_A2_CERTIFICADO (2).pdf", "sizeBytes": "3754556", "protocolId": "115", "requirementId": "948"}	::ffff:192.168.1.104	\N	2026-05-26 21:23:18.957802
505	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf", "sizeBytes": "12409898", "protocolId": "115", "requirementId": "949"}	::ffff:192.168.1.104	\N	2026-05-26 21:23:27.51749
506	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "115", "requirementId": "950"}	::ffff:192.168.1.104	\N	2026-05-26 21:23:38.015654
507	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Version 3 - PRODUCT BACKLOG (1).pdf", "sizeBytes": "239648", "protocolId": "115", "requirementId": "947"}	::ffff:192.168.1.104	\N	2026-05-26 21:23:41.762051
508	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Version 3 - PRODUCT BACKLOG (1).pdf", "sizeBytes": "239648", "protocolId": "115", "requirementId": "951"}	::ffff:192.168.1.104	\N	2026-05-26 21:23:45.93622
509	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LEVEL_A2_CERTIFICADO (2).pdf", "sizeBytes": "3754556", "protocolId": "115", "requirementId": "952"}	::ffff:192.168.1.104	\N	2026-05-26 21:23:52.124793
510	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PROMO MAYO.pdf", "sizeBytes": "4179645", "protocolId": "115", "requirementId": "953"}	::ffff:192.168.1.104	\N	2026-05-26 21:24:00.077087
511	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "115", "requirementId": "955"}	::ffff:192.168.1.104	\N	2026-05-26 21:24:06.115011
512	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf", "sizeBytes": "12409898", "protocolId": "115", "requirementId": "954"}	::ffff:192.168.1.104	\N	2026-05-26 21:24:13.400065
513	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo (1).pdf", "sizeBytes": "170369", "protocolId": "115", "requirementId": "957"}	::ffff:192.168.1.104	\N	2026-05-26 21:24:19.95238
514	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf", "sizeBytes": "12409898", "protocolId": "115", "requirementId": "956"}	::ffff:192.168.1.104	\N	2026-05-26 21:24:26.527753
515	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ORTIZ GUSÑAY JOSE BALTAZAR.pdf", "sizeBytes": "50256", "protocolId": "115", "requirementId": "958"}	::ffff:192.168.1.104	\N	2026-05-26 21:24:33.189387
516	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo (1).pdf", "sizeBytes": "170369", "protocolId": "115", "requirementId": "959"}	::ffff:192.168.1.104	\N	2026-05-26 21:24:36.764731
517	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo.pdf", "sizeBytes": "170369", "protocolId": "115", "requirementId": "960"}	::ffff:192.168.1.104	\N	2026-05-26 21:24:40.30959
518	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Catalogo Ecuaceramica (1).pdf", "sizeBytes": "18766237", "protocolId": "115", "requirementId": "961"}	::ffff:192.168.1.104	\N	2026-05-26 21:24:49.536505
519	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Catalogo Ecuaceramica (1).pdf", "sizeBytes": "18766237", "protocolId": "115", "requirementId": "963"}	::ffff:192.168.1.104	\N	2026-05-26 21:25:04.51111
520	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "boletines_pedagogicos_no_10.pdf", "sizeBytes": "507135", "protocolId": "115", "requirementId": "962"}	::ffff:192.168.1.104	\N	2026-05-26 21:25:13.599492
521	34	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-26 21:25:28.124744
522	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:36.47391
523	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:37.268847
524	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:38.04596
525	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:38.732612
526	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:38.958733
527	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:39.362222
528	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:41.198145
529	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:41.372422
530	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:42.029484
531	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:42.908241
532	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:44.243328
533	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:44.934682
534	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:45.456838
535	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:46.8975
536	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:47.511459
537	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:48.035029
538	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:26:48.555148
539	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-26 21:27:07.267392
540	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "prueba lili "}	::ffff:192.168.1.102	\N	2026-05-26 21:27:57.28431
541	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 21:27:58.494538
542	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "falta este doc de consentimiento"}	::ffff:192.168.1.104	\N	2026-05-26 21:35:37.465571
543	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "cualquier comentario"}	::ffff:192.168.1.104	\N	2026-05-26 21:35:50.982813
544	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-26 21:35:52.676739
545	30	RECEPTION_CERTIFICATE_ISSUED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-26 21:41:05.602321
546	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "el pepe de la salida de tu mami ", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-26 21:45:06.323626
547	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "116", "requirementId": "964"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:14.806196
548	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "116", "requirementId": "965"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:18.548254
549	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "detailed-report_es_it-an-1a-anteproyecto_trabajo_k_ltxt (1).pdf", "sizeBytes": "268968", "protocolId": "116", "requirementId": "967"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:22.113405
550	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "116", "requirementId": "966"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:28.197099
551	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "116", "requirementId": "968"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:32.645003
552	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "116", "requirementId": "969"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:36.866689
553	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "116", "requirementId": "970"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:41.702177
554	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "document_pdf.pdf", "sizeBytes": "1113981", "protocolId": "116", "requirementId": "971"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:47.423556
555	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM_Simulation_Language.pdf", "sizeBytes": "10606508", "protocolId": "116", "requirementId": "972"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:54.18053
556	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Costos - Metodo Montecarlo (3).pdf", "sizeBytes": "655880", "protocolId": "116", "requirementId": "973"}	::ffff:192.168.1.102	\N	2026-05-26 21:45:59.926042
557	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "116", "requirementId": "974"}	::ffff:192.168.1.102	\N	2026-05-26 21:46:06.288432
558	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 21:46:11.550277
559	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 21:47:00.901744
560	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 21:47:02.319737
561	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "falta "}	::ffff:192.168.1.104	\N	2026-05-26 21:47:11.456993
562	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "falta"}	::ffff:192.168.1.104	\N	2026-05-26 21:47:14.952543
563	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 21:47:16.608002
564	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 21:47:17.551807
565	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 21:47:18.748387
566	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 21:47:19.662009
567	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 21:47:20.811743
568	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 21:47:21.646381
569	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 21:47:22.53411
570	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "kevin kevin f"}	::ffff:192.168.1.104	\N	2026-05-26 21:48:10.989296
571	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-26 21:48:11.948519
572	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "los pasos de la sanitación de tomassss", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-26 21:59:12.592927
573	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Version 2 - Historias de Usuario - Historias Técnicas.pdf", "sizeBytes": "652952", "protocolId": "117", "requirementId": "975"}	::ffff:192.168.1.102	\N	2026-05-26 21:59:17.138105
574	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "117", "requirementId": "977"}	::ffff:192.168.1.102	\N	2026-05-26 21:59:20.805855
575	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "117", "requirementId": "976"}	::ffff:192.168.1.102	\N	2026-05-26 21:59:26.050963
576	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Paper_VV.pdf", "sizeBytes": "277513", "protocolId": "117", "requirementId": "978"}	::ffff:192.168.1.102	\N	2026-05-26 21:59:29.694137
577	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Costos - Metodo Montecarlo (3).pdf", "sizeBytes": "655880", "protocolId": "117", "requirementId": "979"}	::ffff:192.168.1.102	\N	2026-05-26 21:59:33.683302
578	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "7c1c09b4db636a3e278d46175d12c99158c0.pdf", "sizeBytes": "1178000", "protocolId": "117", "requirementId": "980"}	::ffff:192.168.1.102	\N	2026-05-26 21:59:37.389538
579	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Ejecución de pruebas simbólicas.pdf", "sizeBytes": "393477", "protocolId": "117", "requirementId": "981"}	::ffff:192.168.1.102	\N	2026-05-26 21:59:43.380692
580	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Actividad Asíncrona (Auditoria informática al FrontEnd con herramienta ZAP)Actividad Asíncrona (Auditoria informática al FrontEnd con herramienta ZAP).pdf", "sizeBytes": "682859", "protocolId": "117", "requirementId": "982"}	::ffff:192.168.1.102	\N	2026-05-26 21:59:47.808602
581	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "117", "requirementId": "983"}	::ffff:192.168.1.102	\N	2026-05-26 21:59:52.868361
582	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-26 21:59:54.154957
583	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "FALTA DC"}	::ffff:192.168.1.104	\N	2026-05-26 22:00:34.183637
584	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "FALTA DOCUMENTACION ESTA MAL "}	::ffff:192.168.1.104	\N	2026-05-26 22:00:40.574173
585	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 22:00:44.513061
586	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 22:00:45.361243
587	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 22:00:46.67646
588	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 22:00:47.576977
589	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 22:00:48.605772
590	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 22:00:49.354679
591	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-26 22:00:50.251883
592	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "HOLAS "}	::ffff:192.168.1.104	\N	2026-05-26 22:01:08.040828
593	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-26 22:01:09.764252
594	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": "FALTA DC"}	::ffff:192.168.1.104	\N	2026-05-26 22:02:14.570849
595	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "HOLAS "}	::ffff:192.168.1.104	\N	2026-05-26 22:02:23.897927
596	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-26 22:02:24.435592
597	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "observations": "FALTA DOCUMENTACION ESTA MAL "}	::ffff:192.168.1.102	\N	2026-05-27 04:55:32.492363
598	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "observations": "FALTA DC"}	::ffff:192.168.1.102	\N	2026-05-27 04:56:17.57175
599	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "DDDDDDDDDDDDDDDDDDDDDDDDDDDD", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-27 07:20:58.947953
600	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM_Simulation_Language.pdf", "sizeBytes": "10606508", "protocolId": "118", "requirementId": "984"}	::ffff:192.168.1.102	\N	2026-05-27 07:21:13.773683
601	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": -15, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 08:13:19.968325
602	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 14, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 08:13:24.976916
603	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 25, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 08:18:18.59757
604	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 8, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 08:21:01.786915
605	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "pageCount": 92, "observations": "FALTA DC"}	::ffff:192.168.1.104	\N	2026-05-27 08:51:29.15059
606	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 08:51:32.822023
607	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 08:51:44.538484
608	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 08:51:53.192518
609	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 92, "observations": "FALTA DC"}	::ffff:192.168.1.104	\N	2026-05-27 08:51:59.760386
610	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "HOLAS  lili"}	::ffff:192.168.1.104	\N	2026-05-27 08:52:23.910413
611	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-27 08:52:25.919652
612	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "frecuencia de anemia en menores de 6 años en riobamba ", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::ffff:192.168.1.104	\N	2026-05-27 13:46:41.920989
613	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "119", "requirementId": "996"}	::ffff:192.168.1.104	\N	2026-05-27 13:46:48.110493
614	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "119", "requirementId": "997"}	::ffff:192.168.1.104	\N	2026-05-27 13:46:55.016684
615	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf", "sizeBytes": "12409898", "protocolId": "119", "requirementId": "998"}	::ffff:192.168.1.104	\N	2026-05-27 13:47:03.617989
616	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Anexo_7_Constancia_CEISH-ESPOCH-EI-004-2026.pdf", "sizeBytes": "102", "protocolId": "119", "requirementId": "999"}	::ffff:192.168.1.104	\N	2026-05-27 13:47:13.176757
617	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "119", "requirementId": "1000"}	::ffff:192.168.1.104	\N	2026-05-27 13:47:18.238492
618	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf", "sizeBytes": "12409898", "protocolId": "119", "requirementId": "1001"}	::ffff:192.168.1.104	\N	2026-05-27 13:47:27.68107
619	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf", "sizeBytes": "12409898", "protocolId": "119", "requirementId": "1002"}	::ffff:192.168.1.104	\N	2026-05-27 13:47:35.519521
620	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LEVEL_A2_CERTIFICADO (2).pdf", "sizeBytes": "3754556", "protocolId": "119", "requirementId": "1003"}	::ffff:192.168.1.104	\N	2026-05-27 13:47:45.488815
621	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo.pdf", "sizeBytes": "170369", "protocolId": "119", "requirementId": "1005"}	::ffff:192.168.1.104	\N	2026-05-27 13:47:49.518267
622	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "PROMO MAYO.pdf", "sizeBytes": "4179645", "protocolId": "119", "requirementId": "1004"}	::ffff:192.168.1.104	\N	2026-05-27 13:47:56.527681
623	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf", "sizeBytes": "12409898", "protocolId": "119", "requirementId": "1006"}	::ffff:192.168.1.104	\N	2026-05-27 13:48:06.964596
624	34	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-27 13:48:10.238968
625	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 4, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:58:45.082098
626	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 5, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:58:58.878608
627	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 5, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:59:07.05682
628	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 5, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:59:09.249605
629	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 8, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:59:12.666964
630	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 9, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:59:16.954005
631	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 4, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:59:23.671081
632	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 7, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:59:27.147977
633	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 8, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:59:30.887127
634	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 7, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:59:36.316496
635	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 7, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 13:59:41.315539
636	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "listo completado documentacion "}	::ffff:192.168.1.104	\N	2026-05-27 14:00:00.750531
637	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-27 14:00:04.408365
638	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "NUEVO PROTOCOLO DE PRUEBA FILTRO CORRECTO", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::ffff:192.168.1.104	\N	2026-05-27 14:14:13.425798
639	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Versión 3 - Historia de usuario - Historias Técnicas (1).pdf", "sizeBytes": "622068", "protocolId": "120", "requirementId": "1007"}	::ffff:192.168.1.104	\N	2026-05-27 14:14:23.507403
640	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf", "sizeBytes": "12409898", "protocolId": "120", "requirementId": "1008"}	::ffff:192.168.1.104	\N	2026-05-27 14:14:32.294495
641	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org).pdf", "sizeBytes": "12409898", "protocolId": "120", "requirementId": "1009"}	::ffff:192.168.1.104	\N	2026-05-27 14:14:39.864345
642	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LEVEL_A2_CERTIFICADO (2).pdf", "sizeBytes": "3754556", "protocolId": "120", "requirementId": "1010"}	::ffff:192.168.1.104	\N	2026-05-27 14:14:45.791716
643	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LEVEL_A2_CERTIFICADO (2).pdf", "sizeBytes": "3754556", "protocolId": "120", "requirementId": "1011"}	::ffff:192.168.1.104	\N	2026-05-27 14:14:51.295371
644	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Version 3 - PRODUCT BACKLOG (1).pdf", "sizeBytes": "239648", "protocolId": "120", "requirementId": "1012"}	::ffff:192.168.1.104	\N	2026-05-27 14:14:59.748397
645	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Simulation Modeling and Analysis by Averill M Law (z-lib.org) (1).pdf", "sizeBytes": "12409898", "protocolId": "120", "requirementId": "1013"}	::ffff:192.168.1.104	\N	2026-05-27 14:15:07.428635
646	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo (1).pdf", "sizeBytes": "170369", "protocolId": "120", "requirementId": "1014"}	::ffff:192.168.1.104	\N	2026-05-27 14:15:11.78249
647	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Temas para trabajos grupales fin de ciclo (1).pdf", "sizeBytes": "170369", "protocolId": "120", "requirementId": "1015"}	::ffff:192.168.1.104	\N	2026-05-27 14:15:16.088175
648	34	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-27 14:15:17.938428
649	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 14:23:41.589927
650	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 2, "pageCount": 2, "observations": "FALTA DOCUMENTACION"}	::ffff:192.168.1.104	\N	2026-05-27 14:23:55.37343
651	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 14:23:58.86014
652	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 4, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 14:24:00.726384
653	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 6, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 14:24:03.072234
654	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 9, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 14:24:06.139858
655	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 3, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 14:24:09.819989
656	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 7, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 14:24:12.04936
657	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 8, "observations": ""}	::ffff:192.168.1.104	\N	2026-05-27 14:24:14.322348
658	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": false, "missingItemsList": "FALTA DOCUMENTACION "}	::ffff:192.168.1.104	\N	2026-05-27 14:24:29.259095
659	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.104	\N	2026-05-27 14:24:29.926687
660	28	PROTOCOL_CREATED	\N	\N	\N	{"title": "prueva d knksdnkjf  sdfsdfdfsdfsdfsdf", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 28}	::ffff:192.168.1.102	\N	2026-05-27 14:52:05.23867
661	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "121", "requirementId": "1016"}	::ffff:192.168.1.102	\N	2026-05-27 14:52:14.126517
662	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Costos - Metodo Montecarlo (3).pdf", "sizeBytes": "655880", "protocolId": "121", "requirementId": "1017"}	::ffff:192.168.1.102	\N	2026-05-27 14:52:17.943997
663	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 01.pdf", "sizeBytes": "187463", "protocolId": "121", "requirementId": "1018"}	::ffff:192.168.1.102	\N	2026-05-27 14:52:22.259691
664	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "121", "requirementId": "1020"}	::ffff:192.168.1.102	\N	2026-05-27 14:52:26.557129
665	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "121", "requirementId": "1019"}	::ffff:192.168.1.102	\N	2026-05-27 14:52:32.407529
666	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "121", "requirementId": "1021"}	::ffff:192.168.1.102	\N	2026-05-27 14:52:37.226688
667	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Actividad Asíncrona_uso_ZAP.pdf", "sizeBytes": "159352", "protocolId": "121", "requirementId": "1022"}	::ffff:192.168.1.102	\N	2026-05-27 14:52:44.406207
668	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Ejecución de pruebas simbólicas (1).pdf", "sizeBytes": "393477", "protocolId": "121", "requirementId": "1023"}	::ffff:192.168.1.102	\N	2026-05-27 14:52:49.925898
669	28	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Costos - Metodo Montecarlo (3).pdf", "sizeBytes": "655880", "protocolId": "121", "requirementId": "1024"}	::ffff:192.168.1.102	\N	2026-05-27 14:52:54.557766
670	28	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-27 14:52:57.467485
671	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-27 14:53:27.920131
672	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 22, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-27 14:53:31.674715
673	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-27 14:53:34.025385
674	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-27 14:53:35.632046
675	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-27 14:53:37.964936
676	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-27 14:53:41.512508
677	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 5, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-27 14:54:12.40576
678	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-27 14:54:15.057208
679	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-27 14:54:19.364237
680	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "prueba"}	::ffff:192.168.1.102	\N	2026-05-27 14:54:29.519797
681	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-27 14:54:30.95598
682	31	USER_UPDATED	\N	\N	\N	{"email": "veronica.delgado@espoch.edu.ec", "fullName": "Verónica Delgado", "isActive": true}	::ffff:192.168.1.102	\N	2026-05-27 16:59:03.234754
683	31	USER_UPDATED	\N	\N	\N	{"email": "veronica.delgado@espoch.edu.ec", "fullName": "Verónica Delgado", "isActive": true}	::ffff:192.168.1.102	\N	2026-05-27 17:00:12.396616
684	30	PEER_EVALUATORS_ASSIGNED	\N	\N	\N	{"evaluatorIds": [100, 32]}	::ffff:192.168.1.102	\N	2026-05-27 17:02:26.032017
685	30	PEER_EVALUATORS_ASSIGNED	\N	\N	\N	{"evaluatorIds": [100, 32]}	::ffff:192.168.1.102	\N	2026-05-27 17:02:53.854797
686	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": null, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 15:43:13.655413
687	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 88, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 15:43:18.598249
688	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": null, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 15:43:25.714734
689	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 9, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 15:43:29.848736
690	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 8, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 15:43:42.311161
691	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \\nde hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 5, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::ffff:192.168.1.102	\N	2026-05-28 16:23:57.908045
692	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "122", "requirementId": "1025"}	::ffff:192.168.1.102	\N	2026-05-28 16:24:54.388766
693	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "122", "requirementId": "1026"}	::ffff:192.168.1.102	\N	2026-05-28 16:24:59.542079
694	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM_Simulation_Language.pdf", "sizeBytes": "10606508", "protocolId": "122", "requirementId": "1027"}	::ffff:192.168.1.102	\N	2026-05-28 16:25:07.549603
695	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "122", "requirementId": "1028"}	::ffff:192.168.1.102	\N	2026-05-28 16:25:17.133476
696	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "122", "requirementId": "1029"}	::ffff:192.168.1.102	\N	2026-05-28 16:25:26.560086
697	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "122", "requirementId": "1030"}	::ffff:192.168.1.102	\N	2026-05-28 16:25:36.71873
698	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "122", "requirementId": "1032"}	::ffff:192.168.1.102	\N	2026-05-28 16:25:58.268863
699	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "122", "requirementId": "1031"}	::ffff:192.168.1.102	\N	2026-05-28 16:26:20.333255
700	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \\nde hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 5, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::ffff:192.168.1.102	\N	2026-05-28 16:27:48.418865
701	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Oficio 001.pdf", "sizeBytes": "187463", "protocolId": "123", "requirementId": "1041"}	::ffff:192.168.1.102	\N	2026-05-28 16:28:02.354525
702	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Actividad autónoma colaborativa. Alcance del proyecto 1.pdf", "sizeBytes": "254124", "protocolId": "123", "requirementId": "1033"}	::ffff:192.168.1.102	\N	2026-05-28 16:28:08.696134
703	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "123", "requirementId": "1034"}	::ffff:192.168.1.102	\N	2026-05-28 16:28:13.459346
704	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Costos - Metodo Montecarlo (3).pdf", "sizeBytes": "655880", "protocolId": "123", "requirementId": "1040"}	::ffff:192.168.1.102	\N	2026-05-28 16:28:21.80561
705	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Especificación de requisitos de.pdf", "sizeBytes": "415525", "protocolId": "123", "requirementId": "1039"}	::ffff:192.168.1.102	\N	2026-05-28 16:28:27.265296
706	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "123", "requirementId": "1038"}	::ffff:192.168.1.102	\N	2026-05-28 16:28:33.573953
707	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Análisis de SLAM en 2 Diapositivas.pdf", "sizeBytes": "385999", "protocolId": "123", "requirementId": "1037"}	::ffff:192.168.1.102	\N	2026-05-28 16:28:41.565335
708	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "123", "requirementId": "1035"}	::ffff:192.168.1.102	\N	2026-05-28 16:28:48.024903
709	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "LECTURA COMPLEMENTARIA - Kevin Quilligana - 7462.pdf", "sizeBytes": "212805", "protocolId": "123", "requirementId": "1036"}	::ffff:192.168.1.102	\N	2026-05-28 16:28:52.423483
710	34	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-28 16:28:54.673921
711	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "“ P2 Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \\nde hemoglobina y hematocrito en estudiantes universitarios”", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 5, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::ffff:192.168.1.102	\N	2026-05-28 16:31:47.625868
712	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "124", "requirementId": "1042"}	::ffff:192.168.1.102	\N	2026-05-28 16:31:55.285073
713	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "124", "requirementId": "1043"}	::ffff:192.168.1.102	\N	2026-05-28 16:32:02.168752
714	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "124", "requirementId": "1044"}	::ffff:192.168.1.102	\N	2026-05-28 16:32:06.786555
715	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "124", "requirementId": "1045"}	::ffff:192.168.1.102	\N	2026-05-28 16:32:11.819555
716	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "124", "requirementId": "1046"}	::ffff:192.168.1.102	\N	2026-05-28 16:32:17.218384
717	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "124", "requirementId": "1047"}	::ffff:192.168.1.102	\N	2026-05-28 16:32:24.504105
718	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM_Simulation_Language.pdf", "sizeBytes": "10606508", "protocolId": "124", "requirementId": "1048"}	::ffff:192.168.1.102	\N	2026-05-28 16:32:31.321546
719	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "SLAM_Simulation_Language.pdf", "sizeBytes": "10606508", "protocolId": "124", "requirementId": "1049"}	::ffff:192.168.1.102	\N	2026-05-28 16:32:36.593888
720	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Proyecto de.pdf", "sizeBytes": "3590175", "protocolId": "124", "requirementId": "1050"}	::ffff:192.168.1.102	\N	2026-05-28 16:32:42.435244
721	34	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-28 16:32:46.214941
722	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:33:39.782862
723	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 17, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:33:47.851183
724	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 3, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:35:46.020488
725	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 3, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:36:04.090903
726	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:37:03.704089
727	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:37:15.595409
728	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 3, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:37:16.31586
729	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 4, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:37:32.8454
730	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 5, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:37:33.340203
731	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:38:06.589333
732	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:38:29.796551
733	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:38:59.441056
734	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::ffff:192.168.1.102	\N	2026-05-28 16:39:13.883879
735	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "prueba 0.1"}	::ffff:192.168.1.102	\N	2026-05-28 19:46:13.635599
736	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:192.168.1.102	\N	2026-05-28 19:46:19.050287
737	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "P3 Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 5, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::ffff:172.26.235.109	\N	2026-05-28 20:24:14.142884
738	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "P3 Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 5, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::ffff:172.26.235.109	\N	2026-05-28 20:28:07.321227
739	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "126", "requirementId": "1060"}	::ffff:172.26.235.109	\N	2026-05-28 20:28:12.577356
740	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "126", "requirementId": "1061"}	::ffff:172.26.235.109	\N	2026-05-28 20:28:18.593282
741	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "recepcion IO-34-CEISH-ESPOCH-2026-signed.pdf", "sizeBytes": "414330", "protocolId": "126", "requirementId": "1062"}	::ffff:172.26.235.109	\N	2026-05-28 20:28:23.974601
742	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Constancia_Recepcion_CEISH-ESPOCH-EI-008-2026.pdf", "sizeBytes": "3313", "protocolId": "126", "requirementId": "1063"}	::ffff:172.26.235.109	\N	2026-05-28 20:28:28.479226
743	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "126", "requirementId": "1064"}	::ffff:172.26.235.109	\N	2026-05-28 20:28:33.505486
744	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "126", "requirementId": "1065"}	::ffff:172.26.235.109	\N	2026-05-28 20:28:40.948082
745	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "126", "requirementId": "1066"}	::ffff:172.26.235.109	\N	2026-05-28 20:28:48.075811
746	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "ingenieria_inversa_mantenimiento.pdf", "sizeBytes": "180446", "protocolId": "126", "requirementId": "1067"}	::ffff:172.26.235.109	\N	2026-05-28 20:28:52.320843
747	34	DOCUMENT_UPLOADED	\N	\N	\N	{"fileName": "Lenguajes de Simulación asignados.pdf", "sizeBytes": "111119", "protocolId": "126", "requirementId": "1068"}	::ffff:172.26.235.109	\N	2026-05-28 20:28:56.88044
748	34	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::ffff:172.26.235.109	\N	2026-05-28 20:29:06.20165
749	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::ffff:172.26.235.109	\N	2026-05-28 20:29:50.40227
750	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 5, "observations": ""}	::ffff:172.26.235.109	\N	2026-05-28 20:29:54.608677
751	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 3, "observations": ""}	::ffff:172.26.235.109	\N	2026-05-28 20:30:22.359626
752	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 3, "observations": ""}	::ffff:172.26.235.109	\N	2026-05-28 20:30:26.193768
753	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:172.26.235.109	\N	2026-05-28 20:30:27.97164
754	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 2, "observations": ""}	::ffff:172.26.235.109	\N	2026-05-28 20:30:30.424188
755	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 4, "observations": ""}	::ffff:172.26.235.109	\N	2026-05-28 20:30:33.842222
756	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 3, "observations": ""}	::ffff:172.26.235.109	\N	2026-05-28 20:30:36.213838
757	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::ffff:172.26.235.109	\N	2026-05-28 20:30:56.277275
758	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "prir"}	::ffff:172.26.235.109	\N	2026-05-28 20:31:10.007909
759	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::ffff:172.26.235.109	\N	2026-05-28 20:31:15.245211
760	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "P4 Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::ffff:172.26.235.109	\N	2026-05-28 20:57:51.244103
761	34	PROTOCOL_TIMELINE_ACCEPTED	\N	\N	\N	{}	::ffff:192.168.1.8	\N	2026-05-31 20:02:05.823159
762	30	PEER_EVALUATORS_ASSIGNED	\N	\N	\N	{"evaluatorIds": [2, 100, 8, 32]}	::ffff:192.168.1.8	\N	2026-05-31 21:51:24.605461
763	30	PEER_EVALUATORS_ASSIGNED	\N	\N	\N	{"evaluatorIds": [2, 32, 8, 40, 41, 42]}	::1	\N	2026-06-02 13:37:05.855373
764	30	PEER_EVALUATORS_ASSIGNED	\N	\N	\N	{"evaluatorIds": [39, 32, 8, 36, 38]}	::1	\N	2026-06-02 14:01:34.598778
765	30	PEER_EVALUATORS_ASSIGNED	\N	\N	\N	{"evaluatorIds": [2, 37, 32, 39, 8]}	::1	\N	2026-06-02 14:26:40.935212
766	30	PEER_EVALUATORS_ASSIGNED	\N	\N	\N	{"evaluatorIds": [32, 8, 41, 42, 43]}	::1	\N	2026-06-02 23:57:26.996084
767	34	PROTOCOL_TIMELINE_ACCEPTED	\N	\N	\N	{}	::1	\N	2026-06-03 00:18:28.838486
768	30	PEER_EVALUATORS_ASSIGNED	\N	\N	\N	{"evaluatorIds": [39, 40, 41, 42, 43]}	::1	\N	2026-06-03 00:19:08.61783
769	34	PROTOCOL_TIMELINE_ACCEPTED	\N	\N	\N	{}	::1	\N	2026-06-03 01:01:02.749603
779	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.914964
774	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.50971
775	\N	IP_AUTO_BLOCKED	dos_defense	\N	\N	{"path": "/", "reason": "Superó 3 infracciones de rate limiting", "violations": 3, "blockedUntil": "2026-06-04T11:06:59.183Z", "durationMinutes": 5}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.439738
772	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "POST", "violation": 1, "autoBlocked": false, "maxViolations": 3, "requestsInWindow": 60}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.417991
777	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.868941
773	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.771135
776	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.468656
778	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "POST", "violation": 3, "autoBlocked": true, "maxViolations": 3, "requestsInWindow": 60}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.91443
771	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "POST", "violation": 2, "autoBlocked": false, "maxViolations": 3, "requestsInWindow": 60}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.439655
770	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:01:59.439723
780	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.128194
781	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.12951
782	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.130364
783	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.131147
784	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.131875
785	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.132693
786	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.133589
787	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.136164
788	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.136914
798	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.332918
799	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.33895
800	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.34591
801	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.352214
802	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.359289
803	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.366345
804	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.375665
805	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.387111
806	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.394337
807	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.400971
808	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.412847
819	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.503502
829	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.530254
839	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.567571
849	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.601381
859	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.63775
869	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.671181
879	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.715685
889	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.744197
897	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.782205
904	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.819121
913	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.864965
923	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.898531
933	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.935045
943	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.981198
953	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.018005
966	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.089536
976	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.280408
986	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.339806
994	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.405587
789	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.141495
813	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.418004
822	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.505113
831	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.532309
840	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.568205
853	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.602205
864	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.642811
872	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.677282
883	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.717886
892	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.747435
901	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.786687
910	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.823703
919	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.878762
929	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.918568
939	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.961465
949	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.001229
960	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.057241
970	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.227896
980	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.309269
990	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.371857
1000	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.426056
1001	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.469671
1020	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.594871
1021	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.671018
1040	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.805778
1050	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.927447
1051	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.97089
1068	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.083776
1073	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.177608
1088	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.313352
1093	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.37494
791	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.231843
809	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.414229
820	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.504088
832	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.530928
841	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.568664
850	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.60278
860	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.638372
873	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.672083
881	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.716799
893	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.745419
899	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.785492
906	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.820211
916	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.86497
926	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.902849
936	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.939394
946	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.982927
954	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.024146
964	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.085233
971	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.239078
981	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.335253
991	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.392572
1010	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.49335
1011	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.570221
1030	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.702853
1031	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.771689
1042	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.922901
1059	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.984082
1061	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.071204
1080	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.2013
1081	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.292697
1100	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.389098
792	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.232199
812	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.416303
823	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.505642
833	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.532817
843	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.570594
852	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.608363
862	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.640419
871	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.673351
884	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.719449
894	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.74936
898	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.783028
905	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.819605
914	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.864955
924	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.900159
934	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.935672
944	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.981789
956	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.032228
962	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.08057
972	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.241934
984	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.33792
996	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.409288
1006	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.476667
1015	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.57851
1026	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.680406
1035	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.779299
1046	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.92459
1055	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.977205
1066	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.080197
1075	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.1835
1086	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.309212
1095	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.377508
793	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.232809
811	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.415635
824	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.506065
834	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.534635
844	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.576015
854	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.611379
863	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.640932
870	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.673899
880	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.716037
890	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.744756
911	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.832978
921	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.880652
931	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.921873
941	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.973855
951	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.01029
959	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.052838
969	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.170775
979	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.308649
989	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.370666
999	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.416107
1002	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.471016
1019	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.586753
1022	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.672813
1039	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.790943
1045	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.924191
1056	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.978594
1063	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.074817
1078	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.189697
1083	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.30038
1097	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.379755
1104	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.481472
794	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.233323
814	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.420099
821	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.504555
830	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.531499
842	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.569152
851	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.606646
861	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.640091
874	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.672412
882	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.717391
891	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.746687
900	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.785972
907	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.821622
917	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.874013
927	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.917335
937	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.957843
947	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.997762
957	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.035103
961	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.077475
975	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.250451
985	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.338818
995	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.407273
1008	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.48174
1013	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.574471
1028	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.687915
1033	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.776011
1043	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.923342
1058	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.982316
1064	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.077168
1077	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.187864
1084	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.30367
1098	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.380865
795	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.233789
817	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.502333
827	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.529146
837	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.566037
847	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.600304
856	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.635904
866	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.668972
877	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.713285
887	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.742213
909	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.822868
920	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.879339
930	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.919212
940	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.965142
950	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.003576
958	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.044187
968	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.097076
978	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.283706
988	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.344936
993	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.40379
1007	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.4782
1014	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.576847
1027	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.684293
1034	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.777886
1048	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.925463
1053	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.973901
1070	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.095015
1071	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.173011
1090	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.324271
1091	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.372219
1106	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.485331
1115	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.578955
796	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.234153
815	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.501338
825	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.527912
835	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.561513
845	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.594827
857	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.636595
867	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.669629
875	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.712209
885	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.740677
896	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.781318
903	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.8186
915	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.864947
925	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.902521
935	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.938412
945	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.982353
955	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.030653
963	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.082829
974	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.24827
983	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.337116
997	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.410971
1003	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.472396
1018	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.585142
1023	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.674723
1038	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.786745
1049	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.926018
1052	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.972385
1067	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.081858
1074	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.18019
1087	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.311371
1094	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.37603
1109	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.491578
797	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.234655
816	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.501732
826	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.528471
836	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.565545
846	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.599195
855	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.63527
865	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.667787
876	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.712675
886	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.741879
895	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.780838
902	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.818185
912	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.864857
922	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.89451
932	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.934243
942	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.980778
952	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.017329
965	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.087451
973	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.245463
982	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.336296
998	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.412826
1004	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.473932
1017	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.583278
1024	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.676704
1037	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.783966
1047	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.925072
1054	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.975675
1069	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.085044
1072	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.175269
1089	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.31506
1092	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.373706
1110	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.499509
1005	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.475341
1016	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.580873
1025	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.67852
1036	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.781364
1044	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.923697
1057	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.980084
1065	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.078861
1076	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.186045
1085	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.3067
1096	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.378568
1107	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.488088
1114	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.577738
1124	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.695755
1137	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.840308
1147	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.936442
1155	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.001243
1166	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.13009
1169	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.176591
1172	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.210144
1190	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.327344
1191	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.407272
1208	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.52096
1213	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.614389
1228	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.721837
1233	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.809413
1249	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.921212
1252	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.010884
1279	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.223048
1282	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.316925
1298	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.41983
1308	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.516111
1101	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.474888
1120	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.591382
1121	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.690997
1140	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.858688
1141	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.910243
1160	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.021863
1161	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.108593
1177	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.218598
1184	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.311652
1196	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.416142
1204	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.513428
1217	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.619724
1225	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.716773
1236	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.814178
1242	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.909611
1259	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.022206
1262	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.119861
1276	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.218036
1285	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.321051
1296	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.416883
1306	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.519764
1315	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.632582
1325	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.719581
1338	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.824795
1343	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.918148
1359	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.026832
1362	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.116474
1379	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.231951
1382	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.317016
1392	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.46066
1409	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.529967
1103	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.479877
1118	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.582624
1123	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.693893
1138	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.843855
1142	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.915322
1159	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.010903
1162	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.112148
1175	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.215689
1186	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.314428
1195	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.414303
1206	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.516996
1215	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.617186
1229	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.723893
1232	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.807913
1248	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.919553
1253	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.012367
1278	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.22131
1283	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.318154
1299	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.421607
1302	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.514493
1330	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.737385
1331	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.813158
1350	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.940874
1351	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.013652
1370	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.133921
1371	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.216356
1390	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.336478
1400	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.467721
1401	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.516188
1420	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.658338
1421	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.719679
1105	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.48322
1116	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.580025
1125	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.697933
1136	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.834935
1144	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.926174
1157	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.006402
1164	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.122437
1174	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.21413
1185	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.313185
1197	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.41807
1205	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.515282
1216	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.618486
1224	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.715439
1237	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.816438
1247	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.917887
1254	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.013908
1267	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.141165
1268	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.182664
1273	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.213437
1288	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.325388
1293	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.412483
1309	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.524858
1313	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.624037
1328	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.724623
1333	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.81615
1347	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.928857
1354	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.01891
1367	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.123518
1374	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.222575
1387	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.325663
1397	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.463094
1108	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.489738
1113	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.576374
1129	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.705409
1132	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.816193
1146	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.933517
1154	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.99994
1167	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.133379
1168	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.174263
1173	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.211876
1188	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.317465
1193	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.410698
1209	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.523436
1212	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.613117
1226	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.718373
1235	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.812741
1246	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.916273
1255	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.015525
1266	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.137566
1269	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.184511
1272	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.210974
1289	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.327298
1292	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.411294
1303	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.526834
1318	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.63905
1322	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.713771
1339	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.82636
1342	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.916322
1357	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.024055
1364	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.119026
1377	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.228235
1384	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.321204
1111	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.57186
1130	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.713685
1131	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.812253
1149	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.943003
1152	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.996968
1179	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.221706
1183	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.309756
1198	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.419907
1203	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.511581
1218	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.62097
1223	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.713674
1239	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.819268
1244	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.912957
1257	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.018661
1264	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.129391
1274	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.215279
1287	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.323584
1294	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.413706
1305	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.523329
1314	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.629309
1326	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.721311
1337	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.823098
1344	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.920889
1358	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.02549
1363	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.117762
1378	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.230141
1383	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.319498
1393	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.461054
1408	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.528388
1412	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.620502
1427	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.73056
1112	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.574666
1128	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.703284
1133	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.821654
1148	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.939377
1153	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.998561
1178	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.220249
1182	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.308062
1199	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.422113
1202	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.509828
1219	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.623312
1222	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.712068
1238	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.817713
1245	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.914723
1256	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.016974
1265	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.133411
1270	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.186184
1271	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.20892
1290	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.334637
1291	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.410182
1310	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.538602
1311	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.615898
1329	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.726041
1332	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.814744
1348	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.930566
1353	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.017344
1369	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.126508
1372	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.219038
1389	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.328542
1399	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.465222
1402	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.517848
1419	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.643566
1117	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.581174
1127	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.701482
1134	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.825999
1150	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.953471
1151	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.995008
1180	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.229085
1181	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.306632
1200	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.433757
1201	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.508112
1220	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.631697
1221	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.710461
1240	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.827548
1241	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.908144
1260	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.031259
1261	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.115984
1277	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.219533
1284	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.319645
1297	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.418552
1304	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.51777
1317	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.637393
1323	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.716331
1334	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.817956
1346	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.926601
1355	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.020444
1366	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.12225
1375	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.224059
1386	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.324165
1396	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.462651
1405	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.523593
1416	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.637933
1425	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.72677
1122	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.692373
1139	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.846752
1143	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.920817
1158	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.008858
1163	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.117297
1176	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.217099
1187	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.315708
1194	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.412232
1210	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.533602
1211	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.612163
1230	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.731445
1231	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.806214
1250	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.931063
1251	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.009193
1280	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.232824
1281	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.315248
1300	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.431293
1301	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.512792
1319	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.640914
1320	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.685993
1321	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.711526
1340	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.836347
1341	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.914618
1360	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.035796
1361	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.114946
1380	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.240125
1381	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.315372
1391	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.46006
1410	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.537783
1411	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.618449
1430	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.742148
1126	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.699691
1135	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.830457
1145	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.930037
1156	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.003845
1165	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.126836
1170	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.178711
1171	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.20852
1189	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.319325
1192	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.408957
1207	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.518681
1214	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.615874
1227	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.720007
1234	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.811117
1243	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:03.911256
1258	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.020817
1263	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 296}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.124071
1275	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.216829
1286	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.322365
1295	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.415422
1307	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.521564
1316	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.635038
1324	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.717938
1335	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.819824
1349	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.924218
1352	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.015577
1368	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.12502
1373	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.220827
1388	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.326929
1398	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.463393
1403	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.519921
1418	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.641865
1312	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.619736
1327	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.722924
1336	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.821252
1345	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:04.922774
1356	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.022308
1365	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 295}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.120447
1376	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.226019
1385	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.322797
1394	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.461599
1407	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.526656
1415	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.635245
1426	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.728232
1434	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.821717
1444	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.0249
1451	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.077736
1458	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.246651
1468	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.297708
1478	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.333258
1486	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.381585
1495	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.42832
1506	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.529615
1518	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.634444
1523	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.731266
1534	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.831739
1547	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.939107
1556	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.040497
1565	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.14022
1580	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.257614
1581	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.330135
1599	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.445991
1602	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.533521
1395	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.462213
1406	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.525067
1413	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.62304
1428	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.732515
1433	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.820048
1443	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.02348
1452	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.081996
1463	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.256521
1473	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.303248
1483	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.369234
1498	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.432114
1503	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.525424
1515	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.630573
1527	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.738378
1533	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.830316
1548	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.941973
1552	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.032307
1569	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.15004
1573	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.234288
1588	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.34064
1594	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.436275
1607	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.540144
1614	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.651565
1624	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.738013
1637	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.848897
1644	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.937662
1657	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.043643
1668	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.142869
1673	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.24781
1689	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.353497
1692	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.437007
1404	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.521919
1417	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.639785
1424	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.724548
1437	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.829651
1445	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.031751
1455	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.244612
1465	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.293288
1475	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.328235
1485	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.377012
1496	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.429643
1505	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.52821
1519	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.63624
1522	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.729726
1537	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.836161
1544	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.93206
1554	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.036269
1567	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.145548
1579	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.248845
1582	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.331481
1600	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.456328
1604	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.536801
1617	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.666971
1618	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.714291
1623	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.736381
1638	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.850582
1643	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.936047
1658	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.045351
1662	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.135767
1674	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.273577
1683	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.341408
1697	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.457821
1414	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.627356
1429	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.735062
1432	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.818226
1442	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.022912
1450	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.075661
1461	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.250614
1471	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.302394
1481	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.33963
1487	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.386976
1493	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.42556
1508	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.532714
1512	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.625722
1529	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.742486
1532	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.82866
1549	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.944723
1553	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.034288
1568	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.14929
1574	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.237557
1587	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.338749
1593	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.434337
1608	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.541846
1612	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.642038
1626	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.740879
1635	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.844845
1646	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.940632
1655	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.040806
1665	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.13953
1677	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.259189
1685	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.346343
1695	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.451086
1708	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.551722
1422	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.721175
1440	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.955542
1453	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.056489
1462	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.254917
1472	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.302922
1484	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.372098
1497	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.430731
1504	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.526789
1516	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.63186
1525	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.734433
1536	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.834743
1545	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.934508
1555	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.038556
1566	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.142775
1575	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.242562
1586	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.337297
1596	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.439595
1605	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.537897
1616	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.661998
1619	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.716272
1622	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.735041
1639	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.852308
1642	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.934952
1659	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.046997
1663	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.136899
1679	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.271051
1682	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.3398
1699	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.459467
1701	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.537145
1423	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.722602
1438	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.864841
1447	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.04385
1459	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.247233
1469	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.300192
1479	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.333749
1489	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.390124
1492	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.424055
1509	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.534223
1513	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.627328
1528	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.740309
1538	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.837985
1543	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.930583
1558	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.045551
1563	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.135957
1578	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.247189
1583	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.33293
1598	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.4443
1601	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.532139
1630	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.761094
1631	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.83539
1650	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.952223
1651	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.034857
1670	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.150295
1671	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.239816
1690	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.361324
1691	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.435659
1709	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.556169
1431	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.816779
1441	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.020838
1454	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.223307
1464	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.264637
1474	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.308682
1482	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.35716
1499	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.433674
1502	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.524076
1517	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.633104
1524	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.732662
1539	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.839563
1542	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.929088
1560	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.063339
1561	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.131082
1577	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.245445
1584	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.334517
1597	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.442308
1603	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.535094
1628	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.744898
1633	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.839956
1648	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.943355
1653	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.037351
1667	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.141799
1678	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.251586
1688	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.351484
1693	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.439258
1704	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.543856
1435	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.824153
1449	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.0536
1460	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.247865
1470	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.301418
1480	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.338304
1488	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.388667
1494	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.426936
1507	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.531017
1514	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.629135
1526	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.736082
1535	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.833212
1546	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.936199
1559	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.050138
1562	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.13301
1576	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.242653
1585	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.336009
1595	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.438141
1606	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.53906
1613	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.647231
1625	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.739591
1636	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.846765
1645	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.939452
1656	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.042036
1666	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.140764
1675	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.255701
1686	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.34799
1696	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.453415
1706	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.548022
1436	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.82661
1448	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.048895
1456	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.2449
1466	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.294226
1476	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.330626
1500	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.443455
1501	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.522818
1520	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.644635
1521	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.728415
1540	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.850104
1541	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.927468
1557	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.042913
1564	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.137784
1572	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.235763
1589	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.342667
1592	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.432759
1609	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.543329
1615	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.656587
1620	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.717683
1621	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.733568
1640	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.865046
1641	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.933688
1660	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.061472
1661	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.134758
1680	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.300864
1681	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.337993
1700	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.469558
1702	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.540242
1439	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:05.931274
1446	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.039919
1457	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.245635
1467	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 294}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.296004
1477	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.331702
1490	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.39157
1491	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.422628
1510	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.543851
1511	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.624429
1530	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.753009
1531	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.827265
1550	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:06.975157
1551	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.030152
1570	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 293}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.184136
1571	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.233144
1590	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.349923
1591	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.431206
1610	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.549056
1611	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.637334
1627	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.742748
1634	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.842849
1647	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.941665
1654	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.039108
1669	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.144634
1672	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.243183
1687	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.349907
1694	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.444324
1707	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.550138
1629	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.747167
1632	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.837188
1649	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:07.9449
1652	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.036106
1664	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 292}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.138022
1676	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.266225
1684	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.34394
1698	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.454812
1703	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.541422
1705	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.546834
1710	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 291}	::ffff:127.0.0.1	\N	2026-06-04 11:02:08.567629
1711	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "POST", "violation": 2, "autoBlocked": false, "maxViolations": 3, "requestsInWindow": 60}	::ffff:127.0.0.1	\N	2026-06-04 11:21:28.228565
1719	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Cloudflare Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \\nde hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 5, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-07 19:45:27.742557
1727	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "ceish-espoch-frontendceish-espoch-frontend  p1", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-08 03:38:36.261551
1712	\N	IP_AUTO_BLOCKED	dos_defense	\N	\N	{"path": "/", "reason": "Superó 3 infracciones de rate limiting", "violations": 3, "blockedUntil": "2026-06-04T11:26:28.160Z", "durationMinutes": 5}	::ffff:127.0.0.1	\N	2026-06-04 11:21:28.229544
1720	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Claudflare Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-07 19:47:48.974297
1728	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::1	\N	2026-06-08 03:46:24.484725
1713	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "POST", "violation": 3, "autoBlocked": true, "maxViolations": 3, "requestsInWindow": 60}	::ffff:127.0.0.1	\N	2026-06-04 11:21:28.230409
1721	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Clould Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles de hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-07 19:53:22.790723
1729	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "06060973350606097335 km", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-08 04:11:51.146518
1714	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "POST", "violation": 1, "autoBlocked": false, "maxViolations": 3, "requestsInWindow": 60}	::ffff:127.0.0.1	\N	2026-06-04 11:21:28.237475
1722	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Clould Factores sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \\nde hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 5, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::1	\N	2026-06-07 19:58:03.920302
1730	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "sssssssssssssssssssssssssssssssssssssssssssssssssss", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::1	\N	2026-06-08 04:34:56.736556
1715	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:26:28.160Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:21:28.26469
1723	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Error al subir documento técnico.", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::1	\N	2026-06-07 20:12:27.645671
1731	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "la hipótesis del checksum es la más fuerte de todas las que hemos visto hasta ahora.", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-08 05:20:44.003916
1717	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "POST", "violation": 4, "autoBlocked": true, "maxViolations": 3, "requestsInWindow": 60}	::ffff:127.0.0.1	\N	2026-06-04 11:31:30.422254
1724	34	PROTOCOL_CREATED	\N	\N	\N	{"title": " sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \\nde hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-07 20:16:43.445692
1732	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "y_eliminado_en\\", \\"StudyTypeOrmEntity\\".\\"", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": true, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-08 05:38:42.523819
1716	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:36:30.249Z", "totalViolations": 4, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:31:30.423147
1725	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "sociodemográficos, nutricionales y de estilo de vida asociados a los niveles \\nde hemoglobina y hematocrito en estudiantes universitarios", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": true, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-07 20:37:45.269465
1733	34	PROTOCOL_CREATED	\N	\N	\N	{"title": " Para solucionar esto, necesitas actualizar las llaves de la   \\n  API de R2:", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::1	\N	2026-06-08 05:45:41.05839
1718	\N	IP_AUTO_BLOCKED	dos_defense	\N	\N	{"path": "/", "reason": "Superó 3 infracciones de rate limiting", "violations": 4, "blockedUntil": "2026-06-04T11:36:30.249Z", "durationMinutes": 5}	::ffff:127.0.0.1	\N	2026-06-04 11:31:30.430269
1726	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Error al subir documento técnico.jjjjjjjjjjjj", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::1	\N	2026-06-07 20:41:08.517872
1734	34	PROTOCOL_CREATED	\N	\N	\N	{"title": " Para solucionar esto, necesitas actualizar las llaves de la   \\n  API de R2:", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-08 05:49:22.496785
1735	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Utiliza endpoints específicos de la jurisdicción para clientes S3:\\nDefaultUnión Europea (UE)", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": true, "isIndigenousPopulation": false, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-08 05:56:37.102388
1736	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "p1 de la muestra y la carga en la nube", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": true, "principalInvestigatorId": 34}	::1	\N	2026-06-08 06:04:58.942005
1737	34	PROTOCOL_CREATED	\N	\N	\N	{"title": "Nuevo Protocolo\\nComplete la información básica y cargue la documentación requerida por el CEISH.\\n\\n1\\nInforma", "sponsorRuc": null, "sponsorWeb": "", "riskLevelId": null, "studyTypeId": 6, "institutions": [], "sponsorPhone": null, "investigators": [], "isMulticentric": false, "sponsorAddress": null, "financingAmount": 0, "geographicCoverage": null, "isAffidavitAccepted": true, "studyDurationMonths": null, "usesBiologicalSamples": false, "isIndigenousPopulation": true, "isVulnerablePopulation": false, "sponsorExecutingAgency": null, "hasExternalInstitutions": false, "principalInvestigatorId": 34}	::1	\N	2026-06-08 06:13:35.821116
1738	34	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "protocols/146/requirements/1257/Datap1.pdf", "fileName": "Datap1.pdf", "sizeBytes": 75024, "requirementId": 1257}	::1	\N	2026-06-08 06:13:51.250069
1739	34	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "protocols/146/requirements/1265/Datap1.pdf", "fileName": "Datap1.pdf", "sizeBytes": 75024, "requirementId": 1265}	::1	\N	2026-06-08 06:14:06.667614
1741	34	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "protocols/146/requirements/1258/Datap1.pdf", "fileName": "Datap1.pdf", "sizeBytes": 75024, "requirementId": 1258}	::1	\N	2026-06-08 06:14:18.403945
1742	34	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "protocols/146/requirements/1259/Datap1.pdf", "fileName": "Datap1.pdf", "sizeBytes": 75024, "requirementId": 1259}	::1	\N	2026-06-08 06:14:23.480857
1743	34	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "protocols/146/requirements/1261/Datap1.pdf", "fileName": "Datap1.pdf", "sizeBytes": 75024, "requirementId": 1261}	::1	\N	2026-06-08 06:14:29.408383
1740	34	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "protocols/146/requirements/1264/Ejercicios_Propuestos_Simulacion.pdf", "fileName": "Ejercicios_Propuestos_Simulacion.pdf", "sizeBytes": 331804, "requirementId": 1264}	::1	\N	2026-06-08 06:14:12.363167
1744	34	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "protocols/146/requirements/1260/Datap1.pdf", "fileName": "Datap1.pdf", "sizeBytes": 75024, "requirementId": 1260}	::1	\N	2026-06-08 06:14:47.935131
1745	34	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "protocols/146/requirements/1262/Ejercicios_Propuestos_Simulacion.pdf", "fileName": "Ejercicios_Propuestos_Simulacion.pdf", "sizeBytes": 331804, "requirementId": 1262}	::1	\N	2026-06-08 06:14:54.497316
1746	34	DOCUMENT_UPLOADED	\N	\N	\N	{"path": "protocols/146/requirements/1263/Datap1.pdf", "fileName": "Datap1.pdf", "sizeBytes": 75024, "requirementId": 1263}	::1	\N	2026-06-08 06:14:59.65759
1747	34	PROTOCOL_SUBMITTED	\N	\N	\N	{}	::1	\N	2026-06-08 06:15:06.579105
1748	30	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:18:10.597053
1749	30	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:18:17.480128
1750	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::1	\N	2026-06-08 06:18:27.650139
1751	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::1	\N	2026-06-08 06:18:29.640245
1752	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::1	\N	2026-06-08 06:18:31.266759
1753	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::1	\N	2026-06-08 06:18:33.134991
1754	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::1	\N	2026-06-08 06:18:36.674845
1755	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::1	\N	2026-06-08 06:18:38.859315
1756	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::1	\N	2026-06-08 06:18:40.436133
1757	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::1	\N	2026-06-08 06:18:43.389362
1758	30	DOCUMENT_VALIDATED	\N	\N	\N	{"statusId": 1, "pageCount": 1, "observations": ""}	::1	\N	2026-06-08 06:18:46.50908
1759	30	REQUIREMENTS_VERIFIED	\N	\N	\N	{"isComplete": true, "missingItemsList": "p1"}	::1	\N	2026-06-08 06:18:53.266341
1760	30	RECEPTION_FINALIZED	\N	\N	\N	{}	::1	\N	2026-06-08 06:18:58.105601
1761	34	PROTOCOL_TIMELINE_ACCEPTED	\N	\N	\N	{}	::1	\N	2026-06-08 06:20:37.565244
1762	30	PEER_EVALUATORS_ASSIGNED	\N	\N	\N	{"evaluatorIds": [37, 40, 8, 41]}	::1	\N	2026-06-08 06:21:37.887132
1763	40	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:24:23.25646
1764	40	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:24:28.705769
1765	40	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:24:42.22708
1766	40	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:24:46.577568
1767	40	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:26:53.691667
1768	40	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:27:00.948443
1769	40	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:29:08.567169
1770	32	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:36:34.638712
1771	32	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:36:34.970762
1772	32	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 06:37:10.512117
1775	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "GET", "violation": 2, "autoBlocked": false, "maxViolations": 3, "requestsInWindow": 60}	::1	\N	2026-06-08 15:35:41.092053
1776	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "GET", "violation": 3, "autoBlocked": true, "maxViolations": 3, "requestsInWindow": 60}	::1	\N	2026-06-08 15:35:41.135224
1774	\N	IP_AUTO_BLOCKED	dos_defense	\N	\N	{"path": "/", "reason": "Superó 3 infracciones de rate limiting", "violations": 3, "blockedUntil": "2026-06-08T15:40:41.042Z", "durationMinutes": 5}	::1	\N	2026-06-08 15:35:41.094435
1773	\N	RATE_LIMIT_EXCEEDED	dos_defense	\N	\N	{"path": "/", "limit": 60, "method": "GET", "violation": 1, "autoBlocked": false, "maxViolations": 3, "requestsInWindow": 60}	::1	\N	2026-06-08 15:35:41.093021
1777	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "GET", "blockedUntil": "2026-06-08T15:40:41.042Z", "totalViolations": 3, "secondsRemaining": 300}	::1	\N	2026-06-08 15:35:41.160349
1778	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-08T15:40:41.042Z", "totalViolations": 3, "secondsRemaining": 205}	::1	\N	2026-06-08 15:37:16.757804
1779	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-08T15:40:41.042Z", "totalViolations": 3, "secondsRemaining": 173}	::1	\N	2026-06-08 15:37:48.798952
1780	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-08T15:40:41.042Z", "totalViolations": 3, "secondsRemaining": 115}	::1	\N	2026-06-08 15:38:46.625653
1781	40	DOCUMENT_DOWNLOAD_URL_GENERATED	\N	\N	\N	\N	::1	\N	2026-06-08 16:23:51.836611
790	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.161805
810	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.415075
818	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.502947
828	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.529753
838	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.567239
848	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.600801
858	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.637191
868	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 300}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.670168
878	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.713848
888	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.743398
908	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.822156
918	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.876976
928	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.917958
938	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:00.958852
948	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.00072
967	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 299}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.091684
977	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.281698
987	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.340731
992	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.397626
1009	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.484811
1012	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.572497
1029	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.690029
1032	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.773605
1041	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.922295
1060	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:01.995132
1062	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 298}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.072997
1079	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.191535
1082	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.297317
1099	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.382282
1102	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.477314
1119	\N	IP_BLOCKED_ACCESS_ATTEMPT	dos_defense	\N	\N	{"path": "/", "method": "POST", "blockedUntil": "2026-06-04T11:06:59.183Z", "totalViolations": 3, "secondsRemaining": 297}	::ffff:127.0.0.1	\N	2026-06-04 11:02:02.584623
\.


--
-- TOC entry 4249 (class 0 OID 24642)
-- Dependencies: 302
-- Data for Name: declaracion_confidencialidad; Type: TABLE DATA; Schema: sistema; Owner: ceish_user
--

COPY sistema.declaracion_confidencialidad (id, protocolo_id, investigador_id, fecha_firma, archivo_firmado) FROM stdin;
\.


--
-- TOC entry 4251 (class 0 OID 24661)
-- Dependencies: 304
-- Data for Name: declaracion_conflicto_interes; Type: TABLE DATA; Schema: sistema; Owner: ceish_user
--

COPY sistema.declaracion_conflicto_interes (id, protocolo_id, investigador_id, tiene_conflicto, descripcion_conflicto, fecha_firma) FROM stdin;
\.


--
-- TOC entry 4243 (class 0 OID 24584)
-- Dependencies: 296
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: sistema; Owner: ceish_user
--

COPY sistema.notificaciones (id, usuario_id, plantilla_id, asunto, cuerpo_mensaje, enviar_email, estado, fecha_programada, fecha_envio, fecha_lectura, protocolo_id, metadata_json) FROM stdin;
\.


--
-- TOC entry 4245 (class 0 OID 24610)
-- Dependencies: 298
-- Data for Name: parametros_sistema; Type: TABLE DATA; Schema: sistema; Owner: ceish_user
--

COPY sistema.parametros_sistema (id, clave, valor, tipo_dato, descripcion, actualizado_por, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 4241 (class 0 OID 24572)
-- Dependencies: 294
-- Data for Name: plantillas_comunicacion; Type: TABLE DATA; Schema: sistema; Owner: ceish_user
--

COPY sistema.plantillas_comunicacion (id, codigo, asunto, cuerpo_html, variables_disponibles, tipo_destinatario, activo) FROM stdin;
\.


--
-- TOC entry 4351 (class 0 OID 0)
-- Dependencies: 250
-- Name: causales_suspension_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.causales_suspension_id_seq', 1, false);


--
-- TOC entry 4352 (class 0 OID 0)
-- Dependencies: 248
-- Name: criterios_evaluacion_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.criterios_evaluacion_id_seq', 1, false);


--
-- TOC entry 4353 (class 0 OID 0)
-- Dependencies: 234
-- Name: estados_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.estados_id_seq', 14, true);


--
-- TOC entry 4354 (class 0 OID 0)
-- Dependencies: 242
-- Name: modalidades_revision_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.modalidades_revision_id_seq', 3, true);


--
-- TOC entry 4355 (class 0 OID 0)
-- Dependencies: 333
-- Name: modulos_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.modulos_id_seq', 15, true);


--
-- TOC entry 4356 (class 0 OID 0)
-- Dependencies: 232
-- Name: niveles_riesgo_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.niveles_riesgo_id_seq', 8, true);


--
-- TOC entry 4357 (class 0 OID 0)
-- Dependencies: 239
-- Name: perfiles_evaluador_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.perfiles_evaluador_id_seq', 15, true);


--
-- TOC entry 4358 (class 0 OID 0)
-- Dependencies: 331
-- Name: perfiles_investigador_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.perfiles_investigador_id_seq', 11, true);


--
-- TOC entry 4359 (class 0 OID 0)
-- Dependencies: 227
-- Name: permisos_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.permisos_id_seq', 42, true);


--
-- TOC entry 4360 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.roles_id_seq', 15, true);


--
-- TOC entry 4361 (class 0 OID 0)
-- Dependencies: 236
-- Name: tipos_documento_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.tipos_documento_id_seq', 45, true);


--
-- TOC entry 4362 (class 0 OID 0)
-- Dependencies: 230
-- Name: tipos_estudio_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.tipos_estudio_id_seq', 8, true);


--
-- TOC entry 4363 (class 0 OID 0)
-- Dependencies: 246
-- Name: tipos_resolucion_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.tipos_resolucion_id_seq', 4, true);


--
-- TOC entry 4364 (class 0 OID 0)
-- Dependencies: 244
-- Name: tipos_seguimiento_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.tipos_seguimiento_id_seq', 1, false);


--
-- TOC entry 4365 (class 0 OID 0)
-- Dependencies: 224
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: catalogos; Owner: ceish_user
--

SELECT pg_catalog.setval('catalogos.usuarios_id_seq', 100, true);


--
-- TOC entry 4366 (class 0 OID 0)
-- Dependencies: 269
-- Name: actas_id_seq; Type: SEQUENCE SET; Schema: evaluacion; Owner: ceish_user
--

SELECT pg_catalog.setval('evaluacion.actas_id_seq', 1, false);


--
-- TOC entry 4367 (class 0 OID 0)
-- Dependencies: 262
-- Name: asignaciones_evaluacion_id_seq; Type: SEQUENCE SET; Schema: evaluacion; Owner: ceish_user
--

SELECT pg_catalog.setval('evaluacion.asignaciones_evaluacion_id_seq', 14, true);


--
-- TOC entry 4368 (class 0 OID 0)
-- Dependencies: 335
-- Name: asignaciones_pares_riesgo_id_seq; Type: SEQUENCE SET; Schema: evaluacion; Owner: ceish_user
--

SELECT pg_catalog.setval('evaluacion.asignaciones_pares_riesgo_id_seq', 18, true);


--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 273
-- Name: asistencia_sesiones_id_seq; Type: SEQUENCE SET; Schema: evaluacion; Owner: ceish_user
--

SELECT pg_catalog.setval('evaluacion.asistencia_sesiones_id_seq', 1, false);


--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 264
-- Name: evaluaciones_id_seq; Type: SEQUENCE SET; Schema: evaluacion; Owner: ceish_user
--

SELECT pg_catalog.setval('evaluacion.evaluaciones_id_seq', 1, false);


--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 267
-- Name: sesiones_id_seq; Type: SEQUENCE SET; Schema: evaluacion; Owner: ceish_user
--

SELECT pg_catalog.setval('evaluacion.sesiones_id_seq', 1, false);


--
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 286
-- Name: enmiendas_id_seq; Type: SEQUENCE SET; Schema: gestion; Owner: ceish_user
--

SELECT pg_catalog.setval('gestion.enmiendas_id_seq', 1, false);


--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 288
-- Name: renovaciones_id_seq; Type: SEQUENCE SET; Schema: gestion; Owner: ceish_user
--

SELECT pg_catalog.setval('gestion.renovaciones_id_seq', 1, false);


--
-- TOC entry 4374 (class 0 OID 0)
-- Dependencies: 290
-- Name: suspensiones_id_seq; Type: SEQUENCE SET; Schema: gestion; Owner: ceish_user
--

SELECT pg_catalog.setval('gestion.suspensiones_id_seq', 1, false);


--
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 312
-- Name: analisis_documentos_id_seq; Type: SEQUENCE SET; Schema: ml_features; Owner: ceish_user
--

SELECT pg_catalog.setval('ml_features.analisis_documentos_id_seq', 1, false);


--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 314
-- Name: balanceo_evaluadores_id_seq; Type: SEQUENCE SET; Schema: ml_features; Owner: ceish_user
--

SELECT pg_catalog.setval('ml_features.balanceo_evaluadores_id_seq', 1, false);


--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 318
-- Name: chatbot_conversaciones_id_seq; Type: SEQUENCE SET; Schema: ml_features; Owner: ceish_user
--

SELECT pg_catalog.setval('ml_features.chatbot_conversaciones_id_seq', 1, false);


--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 309
-- Name: modelos_versiones_id_seq; Type: SEQUENCE SET; Schema: ml_features; Owner: ceish_user
--

SELECT pg_catalog.setval('ml_features.modelos_versiones_id_seq', 1, false);


--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 316
-- Name: prediccion_incumplimientos_id_seq; Type: SEQUENCE SET; Schema: ml_features; Owner: ceish_user
--

SELECT pg_catalog.setval('ml_features.prediccion_incumplimientos_id_seq', 1, false);


--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 307
-- Name: predicciones_log_id_seq; Type: SEQUENCE SET; Schema: ml_features; Owner: ceish_user
--

SELECT pg_catalog.setval('ml_features.predicciones_log_id_seq', 1, false);


--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 305
-- Name: protocolo_features_id_seq; Type: SEQUENCE SET; Schema: ml_features; Owner: ceish_user
--

SELECT pg_catalog.setval('ml_features.protocolo_features_id_seq', 1, false);


--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 320
-- Name: reportes_msp_id_seq; Type: SEQUENCE SET; Schema: ml_features; Owner: ceish_user
--

SELECT pg_catalog.setval('ml_features.reportes_msp_id_seq', 1, false);


--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 329
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceish_user
--

SELECT pg_catalog.setval('public.migrations_id_seq', 39, true);


--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 322
-- Name: protocolo_instituciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceish_user
--

SELECT pg_catalog.setval('public.protocolo_instituciones_id_seq', 111, true);


--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 326
-- Name: protocolo_investigadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceish_user
--

SELECT pg_catalog.setval('public.protocolo_investigadores_id_seq', 144, true);


--
-- TOC entry 4386 (class 0 OID 0)
-- Dependencies: 324
-- Name: protocolo_requisitos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceish_user
--

SELECT pg_catalog.setval('public.protocolo_requisitos_id_seq', 1265, true);


--
-- TOC entry 4387 (class 0 OID 0)
-- Dependencies: 252
-- Name: protocolos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceish_user
--

SELECT pg_catalog.setval('public.protocolos_id_seq', 146, true);


--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 254
-- Name: versiones_protocolo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceish_user
--

SELECT pg_catalog.setval('public.versiones_protocolo_id_seq', 95, true);


--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 256
-- Name: documentos_id_seq; Type: SEQUENCE SET; Schema: recepcion; Owner: ceish_user
--

SELECT pg_catalog.setval('recepcion.documentos_id_seq', 326, true);


--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 260
-- Name: recepciones_id_seq; Type: SEQUENCE SET; Schema: recepcion; Owner: ceish_user
--

SELECT pg_catalog.setval('recepcion.recepciones_id_seq', 148, true);


--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 258
-- Name: validaciones_documento_id_seq; Type: SEQUENCE SET; Schema: recepcion; Owner: ceish_user
--

SELECT pg_catalog.setval('recepcion.validaciones_documento_id_seq', 335, true);


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 277
-- Name: notificaciones_resolucion_id_seq; Type: SEQUENCE SET; Schema: resolucion; Owner: ceish_user
--

SELECT pg_catalog.setval('resolucion.notificaciones_resolucion_id_seq', 1, false);


--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 275
-- Name: resoluciones_id_seq; Type: SEQUENCE SET; Schema: resolucion; Owner: ceish_user
--

SELECT pg_catalog.setval('resolucion.resoluciones_id_seq', 1, false);


--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 284
-- Name: eventos_adversos_id_seq; Type: SEQUENCE SET; Schema: seguimiento; Owner: ceish_user
--

SELECT pg_catalog.setval('seguimiento.eventos_adversos_id_seq', 1, false);


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 281
-- Name: informes_seguimiento_id_seq; Type: SEQUENCE SET; Schema: seguimiento; Owner: ceish_user
--

SELECT pg_catalog.setval('seguimiento.informes_seguimiento_id_seq', 1, false);


--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 279
-- Name: seguimientos_id_seq; Type: SEQUENCE SET; Schema: seguimiento; Owner: ceish_user
--

SELECT pg_catalog.setval('seguimiento.seguimientos_id_seq', 1, false);


--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 299
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: sistema; Owner: ceish_user
--

SELECT pg_catalog.setval('sistema.audit_log_id_seq', 1781, true);


--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 301
-- Name: declaracion_confidencialidad_id_seq; Type: SEQUENCE SET; Schema: sistema; Owner: ceish_user
--

SELECT pg_catalog.setval('sistema.declaracion_confidencialidad_id_seq', 1, false);


--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 303
-- Name: declaracion_conflicto_interes_id_seq; Type: SEQUENCE SET; Schema: sistema; Owner: ceish_user
--

SELECT pg_catalog.setval('sistema.declaracion_conflicto_interes_id_seq', 1, false);


--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 295
-- Name: notificaciones_id_seq; Type: SEQUENCE SET; Schema: sistema; Owner: ceish_user
--

SELECT pg_catalog.setval('sistema.notificaciones_id_seq', 1, false);


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 297
-- Name: parametros_sistema_id_seq; Type: SEQUENCE SET; Schema: sistema; Owner: ceish_user
--

SELECT pg_catalog.setval('sistema.parametros_sistema_id_seq', 1, false);


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 293
-- Name: plantillas_comunicacion_id_seq; Type: SEQUENCE SET; Schema: sistema; Owner: ceish_user
--

SELECT pg_catalog.setval('sistema.plantillas_comunicacion_id_seq', 1, false);


--
-- TOC entry 3776 (class 2606 OID 45030)
-- Name: tipos_estudio UQ_3e2048c9190821eb0c00d6a18fd; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_estudio
    ADD CONSTRAINT "UQ_3e2048c9190821eb0c00d6a18fd" UNIQUE (codigo);


--
-- TOC entry 3768 (class 2606 OID 57487)
-- Name: permisos UQ_40d964f2742b2f4e3f379d3f460; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.permisos
    ADD CONSTRAINT "UQ_40d964f2742b2f4e3f379d3f460" UNIQUE (codigo);


--
-- TOC entry 3754 (class 2606 OID 57489)
-- Name: roles UQ_5def9cb8b6a53b45e58ab82e37e; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.roles
    ADD CONSTRAINT "UQ_5def9cb8b6a53b45e58ab82e37e" UNIQUE (codigo);


--
-- TOC entry 3812 (class 2606 OID 23989)
-- Name: causales_suspension causales_suspension_nombre_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.causales_suspension
    ADD CONSTRAINT causales_suspension_nombre_key UNIQUE (nombre);


--
-- TOC entry 3814 (class 2606 OID 23987)
-- Name: causales_suspension causales_suspension_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.causales_suspension
    ADD CONSTRAINT causales_suspension_pkey PRIMARY KEY (id);


--
-- TOC entry 3808 (class 2606 OID 23978)
-- Name: criterios_evaluacion criterios_evaluacion_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.criterios_evaluacion
    ADD CONSTRAINT criterios_evaluacion_pkey PRIMARY KEY (id);


--
-- TOC entry 3810 (class 2606 OID 23980)
-- Name: criterios_evaluacion criterios_evaluacion_tipo_descripcion_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.criterios_evaluacion
    ADD CONSTRAINT criterios_evaluacion_tipo_descripcion_key UNIQUE (tipo, descripcion);


--
-- TOC entry 3784 (class 2606 OID 65615)
-- Name: estados estados_codigo_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.estados
    ADD CONSTRAINT estados_codigo_key UNIQUE (codigo);


--
-- TOC entry 3786 (class 2606 OID 23882)
-- Name: estados estados_nombre_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.estados
    ADD CONSTRAINT estados_nombre_key UNIQUE (nombre);


--
-- TOC entry 3788 (class 2606 OID 23880)
-- Name: estados estados_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.estados
    ADD CONSTRAINT estados_pkey PRIMARY KEY (id);


--
-- TOC entry 3798 (class 2606 OID 23930)
-- Name: evaluadores_perfil evaluadores_perfil_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.evaluadores_perfil
    ADD CONSTRAINT evaluadores_perfil_pkey PRIMARY KEY (usuario_id, perfil_id);


--
-- TOC entry 3800 (class 2606 OID 23947)
-- Name: modalidades_revision modalidades_revision_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.modalidades_revision
    ADD CONSTRAINT modalidades_revision_pkey PRIMARY KEY (id);


--
-- TOC entry 3923 (class 2606 OID 65628)
-- Name: modulos modulos_codigo_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.modulos
    ADD CONSTRAINT modulos_codigo_key UNIQUE (codigo);


--
-- TOC entry 3925 (class 2606 OID 65626)
-- Name: modulos modulos_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.modulos
    ADD CONSTRAINT modulos_pkey PRIMARY KEY (id);


--
-- TOC entry 3780 (class 2606 OID 23873)
-- Name: niveles_riesgo niveles_riesgo_codigo_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.niveles_riesgo
    ADD CONSTRAINT niveles_riesgo_codigo_key UNIQUE (codigo);


--
-- TOC entry 3782 (class 2606 OID 23871)
-- Name: niveles_riesgo niveles_riesgo_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.niveles_riesgo
    ADD CONSTRAINT niveles_riesgo_pkey PRIMARY KEY (id);


--
-- TOC entry 3794 (class 2606 OID 23923)
-- Name: perfiles_evaluador perfiles_evaluador_nombre_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.perfiles_evaluador
    ADD CONSTRAINT perfiles_evaluador_nombre_key UNIQUE (nombre);


--
-- TOC entry 3796 (class 2606 OID 23921)
-- Name: perfiles_evaluador perfiles_evaluador_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.perfiles_evaluador
    ADD CONSTRAINT perfiles_evaluador_pkey PRIMARY KEY (id);


--
-- TOC entry 3919 (class 2606 OID 49255)
-- Name: perfiles_investigador perfiles_investigador_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.perfiles_investigador
    ADD CONSTRAINT perfiles_investigador_pkey PRIMARY KEY (id);


--
-- TOC entry 3921 (class 2606 OID 49257)
-- Name: perfiles_investigador perfiles_investigador_usuario_id_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.perfiles_investigador
    ADD CONSTRAINT perfiles_investigador_usuario_id_key UNIQUE (usuario_id);


--
-- TOC entry 3770 (class 2606 OID 23836)
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 3774 (class 2606 OID 23843)
-- Name: rol_permisos rol_permisos_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.rol_permisos
    ADD CONSTRAINT rol_permisos_pkey PRIMARY KEY (rol_id, permiso_id);


--
-- TOC entry 3756 (class 2606 OID 23791)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3792 (class 2606 OID 23900)
-- Name: tipo_documento_estudio tipo_documento_estudio_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipo_documento_estudio
    ADD CONSTRAINT tipo_documento_estudio_pkey PRIMARY KEY (tipo_documento_id, tipo_estudio_id);


--
-- TOC entry 3790 (class 2606 OID 23893)
-- Name: tipos_documento tipos_documento_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_documento
    ADD CONSTRAINT tipos_documento_pkey PRIMARY KEY (id);


--
-- TOC entry 3778 (class 2606 OID 23861)
-- Name: tipos_estudio tipos_estudio_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_estudio
    ADD CONSTRAINT tipos_estudio_pkey PRIMARY KEY (id);


--
-- TOC entry 3806 (class 2606 OID 23967)
-- Name: tipos_resolucion tipos_resolucion_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_resolucion
    ADD CONSTRAINT tipos_resolucion_pkey PRIMARY KEY (id);


--
-- TOC entry 3802 (class 2606 OID 23960)
-- Name: tipos_seguimiento tipos_seguimiento_codigo_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_seguimiento
    ADD CONSTRAINT tipos_seguimiento_codigo_key UNIQUE (codigo);


--
-- TOC entry 3804 (class 2606 OID 23958)
-- Name: tipos_seguimiento tipos_seguimiento_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipos_seguimiento
    ADD CONSTRAINT tipos_seguimiento_pkey PRIMARY KEY (id);


--
-- TOC entry 3758 (class 2606 OID 23806)
-- Name: usuarios usuarios_cedula_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.usuarios
    ADD CONSTRAINT usuarios_cedula_key UNIQUE (cedula);


--
-- TOC entry 3760 (class 2606 OID 23808)
-- Name: usuarios usuarios_email_institucional_key; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.usuarios
    ADD CONSTRAINT usuarios_email_institucional_key UNIQUE (email_institucional);


--
-- TOC entry 3762 (class 2606 OID 23804)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 3766 (class 2606 OID 23814)
-- Name: usuarios_roles usuarios_roles_pkey; Type: CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.usuarios_roles
    ADD CONSTRAINT usuarios_roles_pkey PRIMARY KEY (usuario_id, rol_id);


--
-- TOC entry 3844 (class 2606 OID 24286)
-- Name: acta_asistente acta_asistente_pkey; Type: CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.acta_asistente
    ADD CONSTRAINT acta_asistente_pkey PRIMARY KEY (acta_id, usuario_id);


--
-- TOC entry 3842 (class 2606 OID 24271)
-- Name: acta_protocolo acta_protocolo_pkey; Type: CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.acta_protocolo
    ADD CONSTRAINT acta_protocolo_pkey PRIMARY KEY (acta_id, protocolo_id);


--
-- TOC entry 3840 (class 2606 OID 24256)
-- Name: actas actas_pkey; Type: CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.actas
    ADD CONSTRAINT actas_pkey PRIMARY KEY (id);


--
-- TOC entry 3832 (class 2606 OID 24157)
-- Name: asignaciones_evaluacion asignaciones_evaluacion_pkey; Type: CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion
    ADD CONSTRAINT asignaciones_evaluacion_pkey PRIMARY KEY (id);


--
-- TOC entry 3927 (class 2606 OID 139793)
-- Name: asignaciones_pares_riesgo asignaciones_pares_riesgo_pkey; Type: CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_pares_riesgo
    ADD CONSTRAINT asignaciones_pares_riesgo_pkey PRIMARY KEY (id);


--
-- TOC entry 3846 (class 2606 OID 24306)
-- Name: asistencia_sesiones asistencia_sesiones_pkey; Type: CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asistencia_sesiones
    ADD CONSTRAINT asistencia_sesiones_pkey PRIMARY KEY (id);


--
-- TOC entry 3836 (class 2606 OID 24217)
-- Name: evaluacion_criterio evaluacion_criterio_pkey; Type: CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.evaluacion_criterio
    ADD CONSTRAINT evaluacion_criterio_pkey PRIMARY KEY (evaluacion_id, criterio_id);


--
-- TOC entry 3834 (class 2606 OID 24202)
-- Name: evaluaciones evaluaciones_pkey; Type: CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.evaluaciones
    ADD CONSTRAINT evaluaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 3838 (class 2606 OID 24234)
-- Name: sesiones sesiones_pkey; Type: CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.sesiones
    ADD CONSTRAINT sesiones_pkey PRIMARY KEY (id);


--
-- TOC entry 3861 (class 2606 OID 24474)
-- Name: enmiendas enmiendas_pkey; Type: CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.enmiendas
    ADD CONSTRAINT enmiendas_pkey PRIMARY KEY (id);


--
-- TOC entry 3863 (class 2606 OID 24511)
-- Name: renovaciones renovaciones_pkey; Type: CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.renovaciones
    ADD CONSTRAINT renovaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 3867 (class 2606 OID 24560)
-- Name: suspension_causal suspension_causal_pkey; Type: CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.suspension_causal
    ADD CONSTRAINT suspension_causal_pkey PRIMARY KEY (suspension_id, causal_id);


--
-- TOC entry 3865 (class 2606 OID 24545)
-- Name: suspensiones suspensiones_pkey; Type: CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.suspensiones
    ADD CONSTRAINT suspensiones_pkey PRIMARY KEY (id);


--
-- TOC entry 3897 (class 2606 OID 24750)
-- Name: analisis_documentos analisis_documentos_documento_id_key; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.analisis_documentos
    ADD CONSTRAINT analisis_documentos_documento_id_key UNIQUE (documento_id);


--
-- TOC entry 3899 (class 2606 OID 24748)
-- Name: analisis_documentos analisis_documentos_pkey; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.analisis_documentos
    ADD CONSTRAINT analisis_documentos_pkey PRIMARY KEY (id);


--
-- TOC entry 3902 (class 2606 OID 24765)
-- Name: balanceo_evaluadores balanceo_evaluadores_pkey; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.balanceo_evaluadores
    ADD CONSTRAINT balanceo_evaluadores_pkey PRIMARY KEY (id);


--
-- TOC entry 3907 (class 2606 OID 24800)
-- Name: chatbot_conversaciones chatbot_conversaciones_pkey; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.chatbot_conversaciones
    ADD CONSTRAINT chatbot_conversaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 3895 (class 2606 OID 24733)
-- Name: configuracion_ml configuracion_ml_pkey; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.configuracion_ml
    ADD CONSTRAINT configuracion_ml_pkey PRIMARY KEY (clave);


--
-- TOC entry 3893 (class 2606 OID 24720)
-- Name: modelos_versiones modelos_versiones_pkey; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.modelos_versiones
    ADD CONSTRAINT modelos_versiones_pkey PRIMARY KEY (id);


--
-- TOC entry 3905 (class 2606 OID 24780)
-- Name: prediccion_incumplimientos prediccion_incumplimientos_pkey; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.prediccion_incumplimientos
    ADD CONSTRAINT prediccion_incumplimientos_pkey PRIMARY KEY (id);


--
-- TOC entry 3891 (class 2606 OID 24705)
-- Name: predicciones_log predicciones_log_pkey; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.predicciones_log
    ADD CONSTRAINT predicciones_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3886 (class 2606 OID 24688)
-- Name: protocolo_features protocolo_features_pkey; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.protocolo_features
    ADD CONSTRAINT protocolo_features_pkey PRIMARY KEY (id);


--
-- TOC entry 3888 (class 2606 OID 24690)
-- Name: protocolo_features protocolo_features_protocolo_id_key; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.protocolo_features
    ADD CONSTRAINT protocolo_features_protocolo_id_key UNIQUE (protocolo_id);


--
-- TOC entry 3909 (class 2606 OID 24815)
-- Name: reportes_msp reportes_msp_pkey; Type: CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.reportes_msp
    ADD CONSTRAINT reportes_msp_pkey PRIMARY KEY (id);


--
-- TOC entry 3911 (class 2606 OID 44938)
-- Name: protocolo_instituciones PK_3bbe389f2dcf25d26449613ee0c; Type: CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_instituciones
    ADD CONSTRAINT "PK_3bbe389f2dcf25d26449613ee0c" PRIMARY KEY (id);


--
-- TOC entry 3913 (class 2606 OID 44959)
-- Name: protocolo_requisitos PK_5ee791cce168ec54a4ab0f1fa73; Type: CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_requisitos
    ADD CONSTRAINT "PK_5ee791cce168ec54a4ab0f1fa73" PRIMARY KEY (id);


--
-- TOC entry 3917 (class 2606 OID 45072)
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- TOC entry 3915 (class 2606 OID 44978)
-- Name: protocolo_investigadores PK_c1cacd7fbc19ea445f3a9fa8fcc; Type: CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_investigadores
    ADD CONSTRAINT "PK_c1cacd7fbc19ea445f3a9fa8fcc" PRIMARY KEY (id);


--
-- TOC entry 3816 (class 2606 OID 156235)
-- Name: protocolos UQ_195f6a548c5943a7fa3940ce41c; Type: CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolos
    ADD CONSTRAINT "UQ_195f6a548c5943a7fa3940ce41c" UNIQUE (codigo_ceish);


--
-- TOC entry 3818 (class 2606 OID 24004)
-- Name: protocolos protocolos_pkey; Type: CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolos
    ADD CONSTRAINT protocolos_pkey PRIMARY KEY (id);


--
-- TOC entry 3820 (class 2606 OID 24036)
-- Name: versiones_protocolo versiones_protocolo_pkey; Type: CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.versiones_protocolo
    ADD CONSTRAINT versiones_protocolo_pkey PRIMARY KEY (id);


--
-- TOC entry 3822 (class 2606 OID 24065)
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- TOC entry 3826 (class 2606 OID 24130)
-- Name: recepciones recepciones_pkey; Type: CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.recepciones
    ADD CONSTRAINT recepciones_pkey PRIMARY KEY (id);


--
-- TOC entry 3828 (class 2606 OID 24132)
-- Name: recepciones recepciones_protocolo_id_key; Type: CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.recepciones
    ADD CONSTRAINT recepciones_protocolo_id_key UNIQUE (protocolo_id);


--
-- TOC entry 3830 (class 2606 OID 45074)
-- Name: recepciones unique_protocolo_id; Type: CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.recepciones
    ADD CONSTRAINT unique_protocolo_id UNIQUE (protocolo_id);


--
-- TOC entry 3824 (class 2606 OID 24100)
-- Name: validaciones_documento validaciones_documento_pkey; Type: CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.validaciones_documento
    ADD CONSTRAINT validaciones_documento_pkey PRIMARY KEY (id);


--
-- TOC entry 3850 (class 2606 OID 24365)
-- Name: notificaciones_resolucion notificaciones_resolucion_pkey; Type: CONSTRAINT; Schema: resolucion; Owner: ceish_user
--

ALTER TABLE ONLY resolucion.notificaciones_resolucion
    ADD CONSTRAINT notificaciones_resolucion_pkey PRIMARY KEY (id);


--
-- TOC entry 3848 (class 2606 OID 24335)
-- Name: resoluciones resoluciones_pkey; Type: CONSTRAINT; Schema: resolucion; Owner: ceish_user
--

ALTER TABLE ONLY resolucion.resoluciones
    ADD CONSTRAINT resoluciones_pkey PRIMARY KEY (id);


--
-- TOC entry 3859 (class 2606 OID 24453)
-- Name: eventos_adversos eventos_adversos_pkey; Type: CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.eventos_adversos
    ADD CONSTRAINT eventos_adversos_pkey PRIMARY KEY (id);


--
-- TOC entry 3857 (class 2606 OID 24430)
-- Name: informe_documento informe_documento_pkey; Type: CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.informe_documento
    ADD CONSTRAINT informe_documento_pkey PRIMARY KEY (informe_id, documento_id);


--
-- TOC entry 3855 (class 2606 OID 24415)
-- Name: informes_seguimiento informes_seguimiento_pkey; Type: CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.informes_seguimiento
    ADD CONSTRAINT informes_seguimiento_pkey PRIMARY KEY (id);


--
-- TOC entry 3853 (class 2606 OID 24386)
-- Name: seguimientos seguimientos_pkey; Type: CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.seguimientos
    ADD CONSTRAINT seguimientos_pkey PRIMARY KEY (id);


--
-- TOC entry 3879 (class 2606 OID 24635)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3881 (class 2606 OID 24649)
-- Name: declaracion_confidencialidad declaracion_confidencialidad_pkey; Type: CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.declaracion_confidencialidad
    ADD CONSTRAINT declaracion_confidencialidad_pkey PRIMARY KEY (id);


--
-- TOC entry 3883 (class 2606 OID 24668)
-- Name: declaracion_conflicto_interes declaracion_conflicto_interes_pkey; Type: CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.declaracion_conflicto_interes
    ADD CONSTRAINT declaracion_conflicto_interes_pkey PRIMARY KEY (id);


--
-- TOC entry 3873 (class 2606 OID 24593)
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 3875 (class 2606 OID 24620)
-- Name: parametros_sistema parametros_sistema_clave_key; Type: CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.parametros_sistema
    ADD CONSTRAINT parametros_sistema_clave_key UNIQUE (clave);


--
-- TOC entry 3877 (class 2606 OID 24618)
-- Name: parametros_sistema parametros_sistema_pkey; Type: CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.parametros_sistema
    ADD CONSTRAINT parametros_sistema_pkey PRIMARY KEY (id);


--
-- TOC entry 3869 (class 2606 OID 24582)
-- Name: plantillas_comunicacion plantillas_comunicacion_codigo_key; Type: CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.plantillas_comunicacion
    ADD CONSTRAINT plantillas_comunicacion_codigo_key UNIQUE (codigo);


--
-- TOC entry 3871 (class 2606 OID 24580)
-- Name: plantillas_comunicacion plantillas_comunicacion_pkey; Type: CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.plantillas_comunicacion
    ADD CONSTRAINT plantillas_comunicacion_pkey PRIMARY KEY (id);


--
-- TOC entry 3771 (class 1259 OID 57511)
-- Name: IDX_25e38115872406619b03e46cce; Type: INDEX; Schema: catalogos; Owner: ceish_user
--

CREATE INDEX "IDX_25e38115872406619b03e46cce" ON catalogos.rol_permisos USING btree (permiso_id);


--
-- TOC entry 3763 (class 1259 OID 24838)
-- Name: IDX_2c14b9e5e2d0cf077fa4dd3350; Type: INDEX; Schema: catalogos; Owner: ceish_user
--

CREATE INDEX "IDX_2c14b9e5e2d0cf077fa4dd3350" ON catalogos.usuarios_roles USING btree (usuario_id);


--
-- TOC entry 3764 (class 1259 OID 24839)
-- Name: IDX_425dfd009aeeee0c08af9a67a3; Type: INDEX; Schema: catalogos; Owner: ceish_user
--

CREATE INDEX "IDX_425dfd009aeeee0c08af9a67a3" ON catalogos.usuarios_roles USING btree (rol_id);


--
-- TOC entry 3772 (class 1259 OID 57510)
-- Name: IDX_4d6354d8c6fecd074abd3183f4; Type: INDEX; Schema: catalogos; Owner: ceish_user
--

CREATE INDEX "IDX_4d6354d8c6fecd074abd3183f4" ON catalogos.rol_permisos USING btree (rol_id);


--
-- TOC entry 3900 (class 1259 OID 24830)
-- Name: idx_analisis_documentos_documento; Type: INDEX; Schema: ml_features; Owner: ceish_user
--

CREATE INDEX idx_analisis_documentos_documento ON ml_features.analisis_documentos USING btree (documento_id);


--
-- TOC entry 3903 (class 1259 OID 24831)
-- Name: idx_prediccion_incumplimientos_probabilidad; Type: INDEX; Schema: ml_features; Owner: ceish_user
--

CREATE INDEX idx_prediccion_incumplimientos_probabilidad ON ml_features.prediccion_incumplimientos USING btree (probabilidad_incumplimiento DESC);


--
-- TOC entry 3889 (class 1259 OID 24829)
-- Name: idx_predicciones_log_fecha; Type: INDEX; Schema: ml_features; Owner: ceish_user
--

CREATE INDEX idx_predicciones_log_fecha ON ml_features.predicciones_log USING btree (fecha_prediccion);


--
-- TOC entry 3884 (class 1259 OID 24828)
-- Name: idx_protocolo_features_protocolo; Type: INDEX; Schema: ml_features; Owner: ceish_user
--

CREATE INDEX idx_protocolo_features_protocolo ON ml_features.protocolo_features USING btree (protocolo_id);


--
-- TOC entry 3851 (class 1259 OID 24825)
-- Name: idx_seguimientos_vencimiento; Type: INDEX; Schema: seguimiento; Owner: ceish_user
--

CREATE INDEX idx_seguimientos_vencimiento ON seguimiento.seguimientos USING btree (fecha_vencimiento);


--
-- TOC entry 3931 (class 2606 OID 57532)
-- Name: rol_permisos FK_25e38115872406619b03e46cced; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.rol_permisos
    ADD CONSTRAINT "FK_25e38115872406619b03e46cced" FOREIGN KEY (permiso_id) REFERENCES catalogos.permisos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3928 (class 2606 OID 24855)
-- Name: usuarios_roles FK_2c14b9e5e2d0cf077fa4dd33502; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.usuarios_roles
    ADD CONSTRAINT "FK_2c14b9e5e2d0cf077fa4dd33502" FOREIGN KEY (usuario_id) REFERENCES catalogos.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4023 (class 2606 OID 49267)
-- Name: perfiles_investigador FK_3b775261e8d57dad23a3579efbc; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.perfiles_investigador
    ADD CONSTRAINT "FK_3b775261e8d57dad23a3579efbc" FOREIGN KEY (usuario_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3929 (class 2606 OID 24860)
-- Name: usuarios_roles FK_425dfd009aeeee0c08af9a67a37; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.usuarios_roles
    ADD CONSTRAINT "FK_425dfd009aeeee0c08af9a67a37" FOREIGN KEY (rol_id) REFERENCES catalogos.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3930 (class 2606 OID 65634)
-- Name: permisos FK_440171be66cfbd4eb361436fb83; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.permisos
    ADD CONSTRAINT "FK_440171be66cfbd4eb361436fb83" FOREIGN KEY (modulo_id) REFERENCES catalogos.modulos(id);


--
-- TOC entry 3933 (class 2606 OID 57512)
-- Name: tipo_documento_estudio FK_4c1919729b2b113198ffe6ee25b; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipo_documento_estudio
    ADD CONSTRAINT "FK_4c1919729b2b113198ffe6ee25b" FOREIGN KEY (tipo_documento_id) REFERENCES catalogos.tipos_documento(id);


--
-- TOC entry 3932 (class 2606 OID 57527)
-- Name: rol_permisos FK_4d6354d8c6fecd074abd3183f40; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.rol_permisos
    ADD CONSTRAINT "FK_4d6354d8c6fecd074abd3183f40" FOREIGN KEY (rol_id) REFERENCES catalogos.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3934 (class 2606 OID 57517)
-- Name: tipo_documento_estudio FK_72c5ad48d848ba3a52381548ca5; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.tipo_documento_estudio
    ADD CONSTRAINT "FK_72c5ad48d848ba3a52381548ca5" FOREIGN KEY (tipo_estudio_id) REFERENCES catalogos.tipos_estudio(id);


--
-- TOC entry 3935 (class 2606 OID 49195)
-- Name: evaluadores_perfil FK_8ce5bd513b3ebee9e913a3d7dbb; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.evaluadores_perfil
    ADD CONSTRAINT "FK_8ce5bd513b3ebee9e913a3d7dbb" FOREIGN KEY (usuario_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3936 (class 2606 OID 49200)
-- Name: evaluadores_perfil FK_f30f34ae8003b33bac053ba487b; Type: FK CONSTRAINT; Schema: catalogos; Owner: ceish_user
--

ALTER TABLE ONLY catalogos.evaluadores_perfil
    ADD CONSTRAINT "FK_f30f34ae8003b33bac053ba487b" FOREIGN KEY (perfil_id) REFERENCES catalogos.perfiles_evaluador(id);


--
-- TOC entry 3951 (class 2606 OID 156246)
-- Name: asignaciones_evaluacion FK_0ab58095ca0c95e49d6b79971f3; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion
    ADD CONSTRAINT "FK_0ab58095ca0c95e49d6b79971f3" FOREIGN KEY (asignado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3959 (class 2606 OID 49205)
-- Name: evaluaciones FK_133a4e799f9d8dbca43a919c4a5; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.evaluaciones
    ADD CONSTRAINT "FK_133a4e799f9d8dbca43a919c4a5" FOREIGN KEY (asignacion_id) REFERENCES evaluacion.asignaciones_evaluacion(id);


--
-- TOC entry 3952 (class 2606 OID 49175)
-- Name: asignaciones_evaluacion FK_18535309d04cd138b5501e78243; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion
    ADD CONSTRAINT "FK_18535309d04cd138b5501e78243" FOREIGN KEY (evaluador_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4024 (class 2606 OID 139818)
-- Name: asignaciones_pares_riesgo FK_2466c48d4a9253e97949320c64c; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_pares_riesgo
    ADD CONSTRAINT "FK_2466c48d4a9253e97949320c64c" FOREIGN KEY (evaluador_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4025 (class 2606 OID 139813)
-- Name: asignaciones_pares_riesgo FK_376ba22fc806eacd71f18280e9c; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_pares_riesgo
    ADD CONSTRAINT "FK_376ba22fc806eacd71f18280e9c" FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3963 (class 2606 OID 49215)
-- Name: sesiones FK_37fa2cf4b2c57abf908d3379568; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.sesiones
    ADD CONSTRAINT "FK_37fa2cf4b2c57abf908d3379568" FOREIGN KEY (creado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4026 (class 2606 OID 139823)
-- Name: asignaciones_pares_riesgo FK_40721c38a287b4e3917cc4aa3cc; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_pares_riesgo
    ADD CONSTRAINT "FK_40721c38a287b4e3917cc4aa3cc" FOREIGN KEY (nivel_riesgo_propuesto_id) REFERENCES catalogos.niveles_riesgo(id);


--
-- TOC entry 3953 (class 2606 OID 156241)
-- Name: asignaciones_evaluacion FK_5764e2c83a3b9a40020313a60ac; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion
    ADD CONSTRAINT "FK_5764e2c83a3b9a40020313a60ac" FOREIGN KEY (modalidad_id) REFERENCES catalogos.modalidades_revision(id);


--
-- TOC entry 3954 (class 2606 OID 49170)
-- Name: asignaciones_evaluacion FK_5a2560dbca3bf36c2553c241fe6; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion
    ADD CONSTRAINT "FK_5a2560dbca3bf36c2553c241fe6" FOREIGN KEY (version_id) REFERENCES public.versiones_protocolo(id);


--
-- TOC entry 3955 (class 2606 OID 57407)
-- Name: asignaciones_evaluacion FK_5ff86cf6dca0a440b2046e0cb78; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion
    ADD CONSTRAINT "FK_5ff86cf6dca0a440b2046e0cb78" FOREIGN KEY (confirmado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3956 (class 2606 OID 156251)
-- Name: asignaciones_evaluacion FK_8251b0bd0639f69aabb482f339d; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion
    ADD CONSTRAINT "FK_8251b0bd0639f69aabb482f339d" FOREIGN KEY (aprobado_asignacion_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3957 (class 2606 OID 49180)
-- Name: asignaciones_evaluacion FK_8955594d470d5b496fbf0afae95; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion
    ADD CONSTRAINT "FK_8955594d470d5b496fbf0afae95" FOREIGN KEY (perfil_id) REFERENCES catalogos.perfiles_evaluador(id);


--
-- TOC entry 3960 (class 2606 OID 49210)
-- Name: evaluaciones FK_9a302b75f1a992bffa998909da0; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.evaluaciones
    ADD CONSTRAINT "FK_9a302b75f1a992bffa998909da0" FOREIGN KEY (evaluado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3958 (class 2606 OID 57402)
-- Name: asignaciones_evaluacion FK_b84c1f3d4245bd6aa14e3f5e4e6; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asignaciones_evaluacion
    ADD CONSTRAINT "FK_b84c1f3d4245bd6aa14e3f5e4e6" FOREIGN KEY (sugerido_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3964 (class 2606 OID 49220)
-- Name: actas FK_e58a7a9ca03d52092b653d47c32; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.actas
    ADD CONSTRAINT "FK_e58a7a9ca03d52092b653d47c32" FOREIGN KEY (sesion_id) REFERENCES evaluacion.sesiones(id);


--
-- TOC entry 3965 (class 2606 OID 49225)
-- Name: actas FK_f112db31c9b8f864dcb4498a99a; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.actas
    ADD CONSTRAINT "FK_f112db31c9b8f864dcb4498a99a" FOREIGN KEY (creado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3968 (class 2606 OID 24287)
-- Name: acta_asistente acta_asistente_acta_id_fkey; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.acta_asistente
    ADD CONSTRAINT acta_asistente_acta_id_fkey FOREIGN KEY (acta_id) REFERENCES evaluacion.actas(id);


--
-- TOC entry 3969 (class 2606 OID 24292)
-- Name: acta_asistente acta_asistente_usuario_id_fkey; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.acta_asistente
    ADD CONSTRAINT acta_asistente_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3966 (class 2606 OID 24272)
-- Name: acta_protocolo acta_protocolo_acta_id_fkey; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.acta_protocolo
    ADD CONSTRAINT acta_protocolo_acta_id_fkey FOREIGN KEY (acta_id) REFERENCES evaluacion.actas(id);


--
-- TOC entry 3967 (class 2606 OID 24277)
-- Name: acta_protocolo acta_protocolo_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.acta_protocolo
    ADD CONSTRAINT acta_protocolo_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3970 (class 2606 OID 24317)
-- Name: asistencia_sesiones asistencia_sesiones_registro_por_fkey; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asistencia_sesiones
    ADD CONSTRAINT asistencia_sesiones_registro_por_fkey FOREIGN KEY (registro_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3971 (class 2606 OID 24307)
-- Name: asistencia_sesiones asistencia_sesiones_sesion_id_fkey; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asistencia_sesiones
    ADD CONSTRAINT asistencia_sesiones_sesion_id_fkey FOREIGN KEY (sesion_id) REFERENCES evaluacion.sesiones(id);


--
-- TOC entry 3972 (class 2606 OID 24312)
-- Name: asistencia_sesiones asistencia_sesiones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.asistencia_sesiones
    ADD CONSTRAINT asistencia_sesiones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3961 (class 2606 OID 24223)
-- Name: evaluacion_criterio evaluacion_criterio_criterio_id_fkey; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.evaluacion_criterio
    ADD CONSTRAINT evaluacion_criterio_criterio_id_fkey FOREIGN KEY (criterio_id) REFERENCES catalogos.criterios_evaluacion(id);


--
-- TOC entry 3962 (class 2606 OID 24218)
-- Name: evaluacion_criterio evaluacion_criterio_evaluacion_id_fkey; Type: FK CONSTRAINT; Schema: evaluacion; Owner: ceish_user
--

ALTER TABLE ONLY evaluacion.evaluacion_criterio
    ADD CONSTRAINT evaluacion_criterio_evaluacion_id_fkey FOREIGN KEY (evaluacion_id) REFERENCES evaluacion.evaluaciones(id) ON DELETE CASCADE;


--
-- TOC entry 3988 (class 2606 OID 24485)
-- Name: enmiendas enmiendas_estado_id_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.enmiendas
    ADD CONSTRAINT enmiendas_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES catalogos.estados(id);


--
-- TOC entry 3989 (class 2606 OID 24490)
-- Name: enmiendas enmiendas_evaluado_por_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.enmiendas
    ADD CONSTRAINT enmiendas_evaluado_por_fkey FOREIGN KEY (evaluado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3990 (class 2606 OID 24475)
-- Name: enmiendas enmiendas_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.enmiendas
    ADD CONSTRAINT enmiendas_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3991 (class 2606 OID 24495)
-- Name: enmiendas enmiendas_solicitado_por_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.enmiendas
    ADD CONSTRAINT enmiendas_solicitado_por_fkey FOREIGN KEY (solicitado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3992 (class 2606 OID 24480)
-- Name: enmiendas enmiendas_version_anterior_id_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.enmiendas
    ADD CONSTRAINT enmiendas_version_anterior_id_fkey FOREIGN KEY (version_anterior_id) REFERENCES public.versiones_protocolo(id);


--
-- TOC entry 3993 (class 2606 OID 24517)
-- Name: renovaciones renovaciones_estado_id_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.renovaciones
    ADD CONSTRAINT renovaciones_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES catalogos.estados(id);


--
-- TOC entry 3994 (class 2606 OID 24522)
-- Name: renovaciones renovaciones_evaluado_por_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.renovaciones
    ADD CONSTRAINT renovaciones_evaluado_por_fkey FOREIGN KEY (evaluado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3995 (class 2606 OID 24512)
-- Name: renovaciones renovaciones_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.renovaciones
    ADD CONSTRAINT renovaciones_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3996 (class 2606 OID 24527)
-- Name: renovaciones renovaciones_solicitado_por_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.renovaciones
    ADD CONSTRAINT renovaciones_solicitado_por_fkey FOREIGN KEY (solicitado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3999 (class 2606 OID 24566)
-- Name: suspension_causal suspension_causal_causal_id_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.suspension_causal
    ADD CONSTRAINT suspension_causal_causal_id_fkey FOREIGN KEY (causal_id) REFERENCES catalogos.causales_suspension(id);


--
-- TOC entry 4000 (class 2606 OID 24561)
-- Name: suspension_causal suspension_causal_suspension_id_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.suspension_causal
    ADD CONSTRAINT suspension_causal_suspension_id_fkey FOREIGN KEY (suspension_id) REFERENCES gestion.suspensiones(id) ON DELETE CASCADE;


--
-- TOC entry 3997 (class 2606 OID 24551)
-- Name: suspensiones suspensiones_creado_por_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.suspensiones
    ADD CONSTRAINT suspensiones_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3998 (class 2606 OID 24546)
-- Name: suspensiones suspensiones_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: gestion; Owner: ceish_user
--

ALTER TABLE ONLY gestion.suspensiones
    ADD CONSTRAINT suspensiones_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 4013 (class 2606 OID 24751)
-- Name: analisis_documentos analisis_documentos_documento_id_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.analisis_documentos
    ADD CONSTRAINT analisis_documentos_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES recepcion.documentos(id);


--
-- TOC entry 4014 (class 2606 OID 24766)
-- Name: balanceo_evaluadores balanceo_evaluadores_evaluador_id_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.balanceo_evaluadores
    ADD CONSTRAINT balanceo_evaluadores_evaluador_id_fkey FOREIGN KEY (evaluador_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4017 (class 2606 OID 24801)
-- Name: chatbot_conversaciones chatbot_conversaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.chatbot_conversaciones
    ADD CONSTRAINT chatbot_conversaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4012 (class 2606 OID 24734)
-- Name: configuracion_ml configuracion_ml_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.configuracion_ml
    ADD CONSTRAINT configuracion_ml_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4011 (class 2606 OID 24721)
-- Name: modelos_versiones modelos_versiones_creado_por_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.modelos_versiones
    ADD CONSTRAINT modelos_versiones_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4015 (class 2606 OID 24781)
-- Name: prediccion_incumplimientos prediccion_incumplimientos_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.prediccion_incumplimientos
    ADD CONSTRAINT prediccion_incumplimientos_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 4016 (class 2606 OID 24786)
-- Name: prediccion_incumplimientos prediccion_incumplimientos_seguimiento_id_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.prediccion_incumplimientos
    ADD CONSTRAINT prediccion_incumplimientos_seguimiento_id_fkey FOREIGN KEY (seguimiento_id) REFERENCES seguimiento.seguimientos(id);


--
-- TOC entry 4010 (class 2606 OID 24706)
-- Name: predicciones_log predicciones_log_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.predicciones_log
    ADD CONSTRAINT predicciones_log_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 4009 (class 2606 OID 24691)
-- Name: protocolo_features protocolo_features_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.protocolo_features
    ADD CONSTRAINT protocolo_features_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 4018 (class 2606 OID 24816)
-- Name: reportes_msp reportes_msp_generado_por_fkey; Type: FK CONSTRAINT; Schema: ml_features; Owner: ceish_user
--

ALTER TABLE ONLY ml_features.reportes_msp
    ADD CONSTRAINT reportes_msp_generado_por_fkey FOREIGN KEY (generado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3940 (class 2606 OID 49160)
-- Name: versiones_protocolo FK_2afb08e18286c5a2d7744813255; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.versiones_protocolo
    ADD CONSTRAINT "FK_2afb08e18286c5a2d7744813255" FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 4019 (class 2606 OID 45034)
-- Name: protocolo_instituciones FK_4d7a047ee28f29b123bf18ba518; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_instituciones
    ADD CONSTRAINT "FK_4d7a047ee28f29b123bf18ba518" FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3941 (class 2606 OID 156236)
-- Name: versiones_protocolo FK_56973aae770f80239084f2b0c02; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.versiones_protocolo
    ADD CONSTRAINT "FK_56973aae770f80239084f2b0c02" FOREIGN KEY (tipo_resolucion_id) REFERENCES catalogos.tipos_resolucion(id);


--
-- TOC entry 3937 (class 2606 OID 24845)
-- Name: protocolos FK_5f8112d76d3a04d6bcac104fdde; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolos
    ADD CONSTRAINT "FK_5f8112d76d3a04d6bcac104fdde" FOREIGN KEY (nivel_riesgo_id) REFERENCES catalogos.niveles_riesgo(id);


--
-- TOC entry 4021 (class 2606 OID 45049)
-- Name: protocolo_investigadores FK_6c174cf47ac6cf520c870fa238e; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_investigadores
    ADD CONSTRAINT "FK_6c174cf47ac6cf520c870fa238e" FOREIGN KEY (usuario_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3938 (class 2606 OID 24840)
-- Name: protocolos FK_6cb010d7990210b182f002450d5; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolos
    ADD CONSTRAINT "FK_6cb010d7990210b182f002450d5" FOREIGN KEY (tipo_estudio_id) REFERENCES catalogos.tipos_estudio(id);


--
-- TOC entry 3939 (class 2606 OID 57379)
-- Name: protocolos FK_7c47b6e2c72c21288ba5b0ce6f2; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolos
    ADD CONSTRAINT "FK_7c47b6e2c72c21288ba5b0ce6f2" FOREIGN KEY (investigador_principal_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4020 (class 2606 OID 45039)
-- Name: protocolo_requisitos FK_a16dd59dc278c9f98f3206b3975; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_requisitos
    ADD CONSTRAINT "FK_a16dd59dc278c9f98f3206b3975" FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3942 (class 2606 OID 49165)
-- Name: versiones_protocolo FK_b0ee4dfcf52464b61cdc42ed4d2; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.versiones_protocolo
    ADD CONSTRAINT "FK_b0ee4dfcf52464b61cdc42ed4d2" FOREIGN KEY (validado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4022 (class 2606 OID 45044)
-- Name: protocolo_investigadores FK_c878b23f7bce56a39665a94ab22; Type: FK CONSTRAINT; Schema: public; Owner: ceish_user
--

ALTER TABLE ONLY public.protocolo_investigadores
    ADD CONSTRAINT "FK_c878b23f7bce56a39665a94ab22" FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3943 (class 2606 OID 139759)
-- Name: documentos FK_1691686ad166886050c720cb896; Type: FK CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.documentos
    ADD CONSTRAINT "FK_1691686ad166886050c720cb896" FOREIGN KEY (requisito_id) REFERENCES public.protocolo_requisitos(id);


--
-- TOC entry 3944 (class 2606 OID 24866)
-- Name: documentos FK_4c1d2b8ccaac28917c6f974055c; Type: FK CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.documentos
    ADD CONSTRAINT "FK_4c1d2b8ccaac28917c6f974055c" FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3949 (class 2606 OID 45106)
-- Name: recepciones FK_706472f437ab9bf2faea360fede; Type: FK CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.recepciones
    ADD CONSTRAINT "FK_706472f437ab9bf2faea360fede" FOREIGN KEY (creado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3950 (class 2606 OID 45101)
-- Name: recepciones FK_a12c8f8360913923c95ebe93209; Type: FK CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.recepciones
    ADD CONSTRAINT "FK_a12c8f8360913923c95ebe93209" FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3947 (class 2606 OID 45111)
-- Name: validaciones_documento FK_a8b1ca6c01f13f54dc8106c7fd8; Type: FK CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.validaciones_documento
    ADD CONSTRAINT "FK_a8b1ca6c01f13f54dc8106c7fd8" FOREIGN KEY (documento_id) REFERENCES recepcion.documentos(id);


--
-- TOC entry 3945 (class 2606 OID 24871)
-- Name: documentos FK_ac6d3b5b23c5e2a9464af46dcf0; Type: FK CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.documentos
    ADD CONSTRAINT "FK_ac6d3b5b23c5e2a9464af46dcf0" FOREIGN KEY (subido_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3948 (class 2606 OID 45116)
-- Name: validaciones_documento FK_d056bd38aa4d07c2ed716f174f1; Type: FK CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.validaciones_documento
    ADD CONSTRAINT "FK_d056bd38aa4d07c2ed716f174f1" FOREIGN KEY (validado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3946 (class 2606 OID 139764)
-- Name: documentos FK_f7a68903c28bc63dc0e0858f04f; Type: FK CONSTRAINT; Schema: recepcion; Owner: ceish_user
--

ALTER TABLE ONLY recepcion.documentos
    ADD CONSTRAINT "FK_f7a68903c28bc63dc0e0858f04f" FOREIGN KEY (tipo_documento_id) REFERENCES catalogos.tipos_documento(id);


--
-- TOC entry 3973 (class 2606 OID 49230)
-- Name: resoluciones FK_2939194e945edc98b240f88cf5f; Type: FK CONSTRAINT; Schema: resolucion; Owner: ceish_user
--

ALTER TABLE ONLY resolucion.resoluciones
    ADD CONSTRAINT "FK_2939194e945edc98b240f88cf5f" FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3974 (class 2606 OID 49235)
-- Name: resoluciones FK_33ca0391923f19f3edfef9b652d; Type: FK CONSTRAINT; Schema: resolucion; Owner: ceish_user
--

ALTER TABLE ONLY resolucion.resoluciones
    ADD CONSTRAINT "FK_33ca0391923f19f3edfef9b652d" FOREIGN KEY (version_id) REFERENCES public.versiones_protocolo(id);


--
-- TOC entry 3975 (class 2606 OID 49240)
-- Name: resoluciones FK_efa65b7a0ecf240579c6e95bc0d; Type: FK CONSTRAINT; Schema: resolucion; Owner: ceish_user
--

ALTER TABLE ONLY resolucion.resoluciones
    ADD CONSTRAINT "FK_efa65b7a0ecf240579c6e95bc0d" FOREIGN KEY (creado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3976 (class 2606 OID 24371)
-- Name: notificaciones_resolucion notificaciones_resolucion_destinatario_id_fkey; Type: FK CONSTRAINT; Schema: resolucion; Owner: ceish_user
--

ALTER TABLE ONLY resolucion.notificaciones_resolucion
    ADD CONSTRAINT notificaciones_resolucion_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3977 (class 2606 OID 24366)
-- Name: notificaciones_resolucion notificaciones_resolucion_resolucion_id_fkey; Type: FK CONSTRAINT; Schema: resolucion; Owner: ceish_user
--

ALTER TABLE ONLY resolucion.notificaciones_resolucion
    ADD CONSTRAINT notificaciones_resolucion_resolucion_id_fkey FOREIGN KEY (resolucion_id) REFERENCES resolucion.resoluciones(id) ON DELETE CASCADE;


--
-- TOC entry 3986 (class 2606 OID 24454)
-- Name: eventos_adversos eventos_adversos_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.eventos_adversos
    ADD CONSTRAINT eventos_adversos_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3987 (class 2606 OID 24459)
-- Name: eventos_adversos eventos_adversos_reportado_por_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.eventos_adversos
    ADD CONSTRAINT eventos_adversos_reportado_por_fkey FOREIGN KEY (reportado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3984 (class 2606 OID 24436)
-- Name: informe_documento informe_documento_documento_id_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.informe_documento
    ADD CONSTRAINT informe_documento_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES recepcion.documentos(id);


--
-- TOC entry 3985 (class 2606 OID 24431)
-- Name: informe_documento informe_documento_informe_id_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.informe_documento
    ADD CONSTRAINT informe_documento_informe_id_fkey FOREIGN KEY (informe_id) REFERENCES seguimiento.informes_seguimiento(id);


--
-- TOC entry 3982 (class 2606 OID 24421)
-- Name: informes_seguimiento informes_seguimiento_enviado_por_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.informes_seguimiento
    ADD CONSTRAINT informes_seguimiento_enviado_por_fkey FOREIGN KEY (enviado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3983 (class 2606 OID 24416)
-- Name: informes_seguimiento informes_seguimiento_seguimiento_id_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.informes_seguimiento
    ADD CONSTRAINT informes_seguimiento_seguimiento_id_fkey FOREIGN KEY (seguimiento_id) REFERENCES seguimiento.seguimientos(id);


--
-- TOC entry 3978 (class 2606 OID 24397)
-- Name: seguimientos seguimientos_estado_id_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.seguimientos
    ADD CONSTRAINT seguimientos_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES catalogos.estados(id);


--
-- TOC entry 3979 (class 2606 OID 24402)
-- Name: seguimientos seguimientos_evaluado_por_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.seguimientos
    ADD CONSTRAINT seguimientos_evaluado_por_fkey FOREIGN KEY (evaluado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 3980 (class 2606 OID 24387)
-- Name: seguimientos seguimientos_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.seguimientos
    ADD CONSTRAINT seguimientos_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 3981 (class 2606 OID 24392)
-- Name: seguimientos seguimientos_tipo_seguimiento_id_fkey; Type: FK CONSTRAINT; Schema: seguimiento; Owner: ceish_user
--

ALTER TABLE ONLY seguimiento.seguimientos
    ADD CONSTRAINT seguimientos_tipo_seguimiento_id_fkey FOREIGN KEY (tipo_seguimiento_id) REFERENCES catalogos.tipos_seguimiento(id);


--
-- TOC entry 4005 (class 2606 OID 24655)
-- Name: declaracion_confidencialidad declaracion_confidencialidad_investigador_id_fkey; Type: FK CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.declaracion_confidencialidad
    ADD CONSTRAINT declaracion_confidencialidad_investigador_id_fkey FOREIGN KEY (investigador_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4006 (class 2606 OID 24650)
-- Name: declaracion_confidencialidad declaracion_confidencialidad_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.declaracion_confidencialidad
    ADD CONSTRAINT declaracion_confidencialidad_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 4007 (class 2606 OID 24674)
-- Name: declaracion_conflicto_interes declaracion_conflicto_interes_investigador_id_fkey; Type: FK CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.declaracion_conflicto_interes
    ADD CONSTRAINT declaracion_conflicto_interes_investigador_id_fkey FOREIGN KEY (investigador_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4008 (class 2606 OID 24669)
-- Name: declaracion_conflicto_interes declaracion_conflicto_interes_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.declaracion_conflicto_interes
    ADD CONSTRAINT declaracion_conflicto_interes_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 4001 (class 2606 OID 24599)
-- Name: notificaciones notificaciones_plantilla_id_fkey; Type: FK CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.notificaciones
    ADD CONSTRAINT notificaciones_plantilla_id_fkey FOREIGN KEY (plantilla_id) REFERENCES sistema.plantillas_comunicacion(id);


--
-- TOC entry 4002 (class 2606 OID 24604)
-- Name: notificaciones notificaciones_protocolo_id_fkey; Type: FK CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.notificaciones
    ADD CONSTRAINT notificaciones_protocolo_id_fkey FOREIGN KEY (protocolo_id) REFERENCES public.protocolos(id);


--
-- TOC entry 4003 (class 2606 OID 24594)
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4004 (class 2606 OID 24621)
-- Name: parametros_sistema parametros_sistema_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: sistema; Owner: ceish_user
--

ALTER TABLE ONLY sistema.parametros_sistema
    ADD CONSTRAINT parametros_sistema_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES catalogos.usuarios(id);


--
-- TOC entry 4294 (class 0 OID 0)
-- Dependencies: 13
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: ceish_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2026-06-09 02:55:03

--
-- PostgreSQL database dump complete
--

