-- Añadir columna numero_llegada a la tabla citas
ALTER TABLE public.citas
ADD COLUMN numero_llegada INTEGER;

-- (Opcional) Índice para acelerar el ordenamiento por día
CREATE INDEX idx_citas_fecha_numero_llegada
ON public.citas (fecha, numero_llegada);

-- (Opcional pero recomendado) Comentario para documentar
COMMENT ON COLUMN public.citas.numero_llegada IS
  'Número de orden de llegada del paciente para ese día. Se reinicia cada día.';


  -- ============================================================
-- 1. AGREGAR CAMPO "en_linea" A USUARIOS
-- ============================================================
ALTER TABLE public.usuarios
  ADD COLUMN en_linea boolean NOT NULL DEFAULT false;

CREATE INDEX idx_usuarios_en_linea ON public.usuarios (en_linea);

-- ============================================================
-- 2. NUEVAS TABLAS: conversaciones y mensajes
-- ============================================================

-- Conversaciones (sin fecha de creación ni última actividad)
CREATE TABLE public.conversaciones (
    idconversacion SERIAL PRIMARY KEY,
    idusuario1 integer NOT NULL,
    idusuario2 integer NOT NULL,
    CONSTRAINT chk_usuarios_distintos CHECK (idusuario1 <> idusuario2),
    CONSTRAINT uq_conversacion UNIQUE (idusuario1, idusuario2)
);

-- Mensajes
CREATE TABLE public.mensajes (
    idmensaje SERIAL PRIMARY KEY,
    idconversacion integer NOT NULL,
    idemisor integer NOT NULL,
    contenido text NOT NULL,
    fecha timestamp DEFAULT TIMEZONE('America/La_Paz', NOW()),
    leido boolean NOT NULL DEFAULT false,
    fecha_leido timestamp without time zone
);

-- ============================================================
-- 3. FOREIGN KEYS
-- ============================================================
ALTER TABLE public.conversaciones
  ADD CONSTRAINT fk_conversacion_usuario1
    FOREIGN KEY (idusuario1) REFERENCES public.usuarios(idusuario) ON DELETE CASCADE,
  ADD CONSTRAINT fk_conversacion_usuario2
    FOREIGN KEY (idusuario2) REFERENCES public.usuarios(idusuario) ON DELETE CASCADE;

ALTER TABLE public.mensajes
  ADD CONSTRAINT fk_mensaje_conversacion
    FOREIGN KEY (idconversacion) REFERENCES public.conversaciones(idconversacion) ON DELETE CASCADE,
  ADD CONSTRAINT fk_mensaje_emisor
    FOREIGN KEY (idemisor) REFERENCES public.usuarios(idusuario) ON DELETE CASCADE;

-- ============================================================
-- 4. ÍNDICES
-- ============================================================
CREATE INDEX idx_conversaciones_idusuario1 ON public.conversaciones (idusuario1);
CREATE INDEX idx_conversaciones_idusuario2 ON public.conversaciones (idusuario2);

CREATE INDEX idx_mensajes_idconversacion ON public.mensajes (idconversacion);
CREATE INDEX idx_mensajes_idemisor ON public.mensajes (idemisor);
CREATE INDEX idx_mensajes_fecha ON public.mensajes (fecha);
CREATE INDEX idx_mensajes_leido ON public.mensajes (leido);