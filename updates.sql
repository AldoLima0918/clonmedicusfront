-- Añadir columna numero_llegada a la tabla citas
ALTER TABLE public.citas
ADD COLUMN numero_llegada INTEGER;

-- (Opcional) Índice para acelerar el ordenamiento por día
CREATE INDEX idx_citas_fecha_numero_llegada
ON public.citas (fecha, numero_llegada);

-- (Opcional pero recomendado) Comentario para documentar
COMMENT ON COLUMN public.citas.numero_llegada IS
  'Número de orden de llegada del paciente para ese día. Se reinicia cada día.';