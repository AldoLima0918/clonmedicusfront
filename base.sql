-- ============================================================
-- CREACIÓN DE TABLAS
-- ============================================================

CREATE TABLE public.caja (
    idcaja SERIAL PRIMARY KEY,
    monto_apertura numeric(10,2) NOT NULL,
    monto_cierre numeric(10,2),
    fecha date NOT NULL
);

CREATE TABLE public.cita_servicio (
    idcita integer NOT NULL,
    idservicio integer NOT NULL,
    PRIMARY KEY (idcita, idservicio)
);

CREATE TABLE public.citas (
    idcita SERIAL PRIMARY KEY,
    idpaciente integer NOT NULL,
    iddoctor integer NOT NULL,
    fecha date NOT NULL,
    hora time without time zone NOT NULL,
    numero_llegada INTEGER,
    estado integer NOT NULL
);

CREATE TABLE public.doctor_especialidad (
    iddoctor integer NOT NULL,
    idespecialidad integer NOT NULL,
    PRIMARY KEY (iddoctor, idespecialidad)
);

CREATE TABLE public.especialidades (
    idespecialidad SERIAL PRIMARY KEY,
    nombre character varying(100) NOT NULL,
    estado integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.historia_clinico (
    idhistoria SERIAL PRIMARY KEY,
    idpaciente integer NOT NULL,
    idcita integer NOT NULL,
    antecedente text NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.movimiento_caja (
    idmovimiento SERIAL PRIMARY KEY,
    idcaja integer NOT NULL,
    tipo_movimiento integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    concepto text NOT NULL,
    justificacion text,
    idpago integer,
    idempleado integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.paciente_doctor (
    idpaciente integer NOT NULL,
    iddoctor integer NOT NULL,
    PRIMARY KEY (idpaciente, iddoctor)
);

CREATE TABLE public.pacientes (
    idpaciente SERIAL PRIMARY KEY,
    nombre_completo character varying(200) NOT NULL,
    telefono character varying(20) NOT NULL,
    correo character varying(100),
    fecha_nacimiento date NOT NULL,
    tipo_sangre character varying(10),
    genero character varying(50),
    direccion text,
    alergias text,
    enfermedad_base text DEFAULT 'Ninguna'::text,
    notas character varying(300),
    ci character varying(20) NOT NULL,
    estado integer DEFAULT 0 NOT NULL CHECK (estado IN (0, 1))
);

CREATE TABLE public.pagos (
    idpago SERIAL PRIMARY KEY,
    idcita integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    metodo_pago character varying(50),
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado integer DEFAULT 0
);

CREATE TABLE public.servicios (
    idservicio SERIAL PRIMARY KEY,
    nombre character varying(100) NOT NULL,
    precio numeric(10,2) NOT NULL,
    idespecialidad integer,
    estado integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.usuarios (
    idusuario SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100) UNIQUE,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasenia VARCHAR(255) NOT NULL,
    rol INT NOT NULL,
    estado INT NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- ---------- caja ----------
CREATE INDEX idx_caja_fecha ON public.caja (fecha);

-- ---------- cita_servicio ----------
-- PK compuesta ya crea índice (idcita, idservicio)
CREATE INDEX idx_cita_servicio_idservicio ON public.cita_servicio (idservicio);

-- ---------- citas ----------
CREATE INDEX idx_citas_fecha_numero_llegada ON public.citas (fecha, numero_llegada);
CREATE INDEX idx_citas_idpaciente ON public.citas (idpaciente);
CREATE INDEX idx_citas_iddoctor ON public.citas (iddoctor);
CREATE INDEX idx_citas_fecha ON public.citas (fecha);
CREATE INDEX idx_citas_estado ON public.citas (estado);
CREATE INDEX idx_citas_iddoctor_fecha ON public.citas (iddoctor, fecha);

-- ---------- doctor_especialidad ----------
-- PK compuesta ya crea índice (iddoctor, idespecialidad)
CREATE INDEX idx_doctor_especialidad_idespecialidad ON public.doctor_especialidad (idespecialidad);

-- ---------- especialidades ----------
CREATE INDEX idx_especialidades_nombre ON public.especialidades (nombre);
CREATE INDEX idx_especialidades_estado ON public.especialidades (estado);

-- ---------- historia_clinico ----------
CREATE INDEX idx_historia_clinico_idpaciente ON public.historia_clinico (idpaciente);
CREATE INDEX idx_historia_clinico_idcita ON public.historia_clinico (idcita);
CREATE INDEX idx_historia_clinico_fecha ON public.historia_clinico (fecha);

-- ---------- movimiento_caja ----------
CREATE INDEX idx_movimiento_caja_idcaja ON public.movimiento_caja (idcaja);
CREATE INDEX idx_movimiento_caja_idpago ON public.movimiento_caja (idpago);
CREATE INDEX idx_movimiento_caja_idempleado ON public.movimiento_caja (idempleado);
CREATE INDEX idx_movimiento_caja_fecha ON public.movimiento_caja (fecha);
CREATE INDEX idx_movimiento_caja_tipo ON public.movimiento_caja (tipo_movimiento);

-- ---------- paciente_doctor ----------
-- PK compuesta ya crea índice (idpaciente, iddoctor)
CREATE INDEX idx_paciente_doctor_iddoctor ON public.paciente_doctor (iddoctor);

-- ---------- pacientes ----------
CREATE INDEX idx_pacientes_ci ON public.pacientes (ci);
CREATE INDEX idx_pacientes_nombre_completo ON public.pacientes (nombre_completo);
CREATE INDEX idx_pacientes_telefono ON public.pacientes (telefono);
CREATE INDEX idx_pacientes_correo ON public.pacientes (correo);
CREATE INDEX idx_pacientes_estado ON public.pacientes (estado);

-- ---------- pagos ----------
CREATE INDEX idx_pagos_idcita ON public.pagos (idcita);
CREATE INDEX idx_pagos_fecha ON public.pagos (fecha);
CREATE INDEX idx_pagos_estado ON public.pagos (estado);
CREATE INDEX idx_pagos_metodo_pago ON public.pagos (metodo_pago);

-- ---------- servicios ----------
CREATE INDEX idx_servicios_idespecialidad ON public.servicios (idespecialidad);
CREATE INDEX idx_servicios_nombre ON public.servicios (nombre);
CREATE INDEX idx_servicios_estado ON public.servicios (estado);

-- ---------- usuarios ----------
-- UNIQUE en correo y usuario ya crean índices automáticamente
CREATE INDEX idx_usuarios_rol ON public.usuarios (rol);
CREATE INDEX idx_usuarios_estado ON public.usuarios (estado);
CREATE INDEX idx_usuarios_nombre_completo ON public.usuarios (nombre_completo);