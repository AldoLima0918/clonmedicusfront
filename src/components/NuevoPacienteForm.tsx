import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplet,
  AlertCircle,
  Save,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { addPaciente, checkCiExists, ApiError } from "@/api/pacientesApi";
import { toast } from "sonner";

interface PatientFormData {
  nombreCompleto: string;
  fechaNacimiento: string;
  genero: string;
  telefono: string;
  email: string;
  direccion: string;
  tipoSangre: string;
  alergias: string;
  enfermedadbase: string;
  ci: string;
}

interface NuevoPacienteFormProps {
  onPatientAdded: (patient: PatientFormData) => void;
  onCancel: () => void;
}

const PAISES = [
  { codigo: "591", abrev: "BO", pais: "Bolivia", longitud: 8, placeholder: "75991320" },
  { codigo: "54", abrev: "AR", pais: "Argentina", longitud: 10, placeholder: "1123456789" },
  { codigo: "55", abrev: "BR", pais: "Brasil", longitud: 11, placeholder: "11987654321" },
  { codigo: "56", abrev: "CL", pais: "Chile", longitud: 9, placeholder: "912345678" },
  { codigo: "57", abrev: "CO", pais: "Colombia", longitud: 10, placeholder: "3001234567" },
  { codigo: "506", abrev: "CR", pais: "Costa Rica", longitud: 8, placeholder: "81234567" },
  { codigo: "53", abrev: "CU", pais: "Cuba", longitud: 8, placeholder: "51234567" },
  { codigo: "593", abrev: "EC", pais: "Ecuador", longitud: 9, placeholder: "991234567" },
  { codigo: "503", abrev: "SV", pais: "El Salvador", longitud: 8, placeholder: "71234567" },
  { codigo: "502", abrev: "GT", pais: "Guatemala", longitud: 8, placeholder: "51234567" },
  { codigo: "504", abrev: "HN", pais: "Honduras", longitud: 8, placeholder: "91234567" },
  { codigo: "52", abrev: "MX", pais: "México", longitud: 10, placeholder: "5512345678" },
  { codigo: "505", abrev: "NI", pais: "Nicaragua", longitud: 8, placeholder: "81234567" },
  { codigo: "507", abrev: "PA", pais: "Panamá", longitud: 8, placeholder: "61234567" },
  { codigo: "595", abrev: "PY", pais: "Paraguay", longitud: 9, placeholder: "981123456" },
  { codigo: "51", abrev: "PE", pais: "Perú", longitud: 9, placeholder: "912345678" },
  { codigo: "1", abrev: "DO", pais: "República Dominicana", longitud: 10, placeholder: "8091234567" },
  { codigo: "598", abrev: "UY", pais: "Uruguay", longitud: 8, placeholder: "91234567" },
  { codigo: "58", abrev: "VE", pais: "Venezuela", longitud: 10, placeholder: "4121234567" },
  { codigo: "34", abrev: "ES", pais: "España", longitud: 9, placeholder: "612345678" },
  { codigo: "1", abrev: "US", pais: "Estados Unidos", longitud: 10, placeholder: "2021234567" },
];

// ✅ Longitud máxima del CI
const CI_MAX_LENGTH = 10;

const NuevoPacienteForm = ({
  onPatientAdded,
  onCancel,
}: NuevoPacienteFormProps) => {
  const [formData, setFormData] = useState<PatientFormData>({
    nombreCompleto: "",
    fechaNacimiento: "",
    genero: "Masculino",
    telefono: "",
    email: "",
    direccion: "",
    tipoSangre: "",
    alergias: "",
    enfermedadbase: "",
    ci: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [ciError, setCiError] = useState<string | null>(null);
  const [telefonoError, setTelefonoError] = useState<string | null>(null);
  const [codigoPais, setCodigoPais] = useState("591");

  const [ciChecking, setCiChecking] = useState(false);
  const [ciExists, setCiExists] = useState(false);
  const [ciExistingPatient, setCiExistingPatient] = useState<{
    idpaciente: number;
    nombre_completo: string;
  } | null>(null);

  const paisSeleccionado =
    PAISES.find((p) => p.codigo === codigoPais) || PAISES[0];
  const ciCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Efecto para verificar CI con debounce
  useEffect(() => {
    if (ciCheckTimeoutRef.current) {
      clearTimeout(ciCheckTimeoutRef.current);
    }

    setCiExists(false);
    setCiExistingPatient(null);

    // ✅ Solo verificar si tiene al menos 7 caracteres (mínimo) y hasta 10
    if (formData.ci.length < 7) {
      setCiChecking(false);
      return;
    }

    setCiChecking(true);

    ciCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await checkCiExists(formData.ci);
        if (result.exists && result.paciente) {
          setCiExists(true);
          setCiExistingPatient(result.paciente);
        } else {
          setCiExists(false);
          setCiExistingPatient(null);
        }
      } catch (err) {
        console.error("Error verificando CI:", err);
      } finally {
        setCiChecking(false);
      }
    }, 500);

    return () => {
      if (ciCheckTimeoutRef.current) {
        clearTimeout(ciCheckTimeoutRef.current);
      }
    };
  }, [formData.ci]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "ci") {
      const soloAlfanumerico = value.replace(/[^a-zA-Z0-9]/g, "");
      // ✅ Ahora permite hasta 10 caracteres
      const limitado = soloAlfanumerico.slice(0, CI_MAX_LENGTH);
      setFormData((prev) => ({ ...prev, ci: limitado }));

      // ✅ Validación: mínimo 7, máximo 10
      if (limitado.length > 0 && limitado.length < 7) {
        setCiError("El CI debe tener entre 7 y 10 caracteres");
      } else {
        setCiError(null);
      }
      return;
    }

    if (name === "telefono") {
      const soloDigitos = value.replace(/\D/g, "");
      const limitado = soloDigitos.slice(0, paisSeleccionado.longitud);
      setFormData((prev) => ({ ...prev, telefono: limitado }));

      if (limitado.length > 0 && limitado.length < paisSeleccionado.longitud) {
        setTelefonoError(
          `El teléfono para ${paisSeleccionado.pais} debe tener ${paisSeleccionado.longitud} dígitos`
        );
      } else {
        setTelefonoError(null);
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoCodigo = e.target.value;
    setCodigoPais(nuevoCodigo);

    const nuevoPais = PAISES.find((p) => p.codigo === nuevoCodigo) || PAISES[0];
    const telefonoRecortado = formData.telefono.slice(0, nuevoPais.longitud);

    setFormData((prev) => ({ ...prev, telefono: telefonoRecortado }));

    if (
      telefonoRecortado.length > 0 &&
      telefonoRecortado.length < nuevoPais.longitud
    ) {
      setTelefonoError(
        `El teléfono para ${nuevoPais.pais} debe tener ${nuevoPais.longitud} dígitos`
      );
    } else {
      setTelefonoError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ✅ Validación: CI entre 7 y 10 caracteres
    if (formData.ci.length < 7 || formData.ci.length > CI_MAX_LENGTH) {
      setCiError("El CI debe tener entre 7 y 10 caracteres");
      toast.error("El CI debe tener entre 7 y 10 caracteres");
      return;
    }

    if (ciExists) {
      setError("El CI ya existe");
      toast.error("El CI ya existe");
      return;
    }

    if (formData.telefono.length !== paisSeleccionado.longitud) {
      setTelefonoError(
        `El teléfono para ${paisSeleccionado.pais} debe tener ${paisSeleccionado.longitud} dígitos`
      );
      toast.error(
        `El teléfono para ${paisSeleccionado.pais} debe tener ${paisSeleccionado.longitud} dígitos`
      );
      return;
    }

    try {
      const paciente = {
        nombre_Completo: formData.nombreCompleto,
        telefono: `+${codigoPais}${formData.telefono}`,
        correo: formData.email,
        fecha_Nacimiento: formData.fechaNacimiento,
        tipo_Sangre: formData.tipoSangre,
        genero: formData.genero,
        direccion: formData.direccion,
        alergias: formData.alergias,
        enfermedad_base: formData.enfermedadbase,
        ci: formData.ci,
      };
      console.log("Datos enviados al backend:", paciente);

      const response = await addPaciente(paciente);
      console.log("Respuesta del backend:", response);

      onPatientAdded(formData);
    } catch (error: unknown) {
      console.error("Error adding paciente:", error);

      if (
        error instanceof ApiError &&
        error.response?.data?.error === "El CI ya existe"
      ) {
        setError("El CI ya existe");
        toast.error("El CI ya existe");
      } else if (error instanceof ApiError) {
        const msg =
          error.response?.data?.error || "Error al agregar el paciente";
        setError(msg);
        toast.error(msg);
      } else {
        setError("Error al agregar el paciente");
        toast.error("Error al agregar el paciente");
      }
    }
  };

  const getCiInputClass = () => {
    if (ciChecking) return "border-yellow-400 focus-visible:ring-yellow-400";
    if (ciExists) return "border-red-500 focus-visible:ring-red-500";
    // ✅ Verde si tiene entre 7 y 10 caracteres y no existe
    if (formData.ci.length >= 7 && formData.ci.length <= CI_MAX_LENGTH && !ciExists)
      return "border-green-500 focus-visible:ring-green-500";
    return "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Información Personal */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="ci" className="font-medium">
              CI<span className="text-red-500">*</span>
            </Label>
          </div>
          <div className="relative">
            <Input
              id="ci"
              name="ci"
              value={formData.ci || ""}
              onChange={handleChange}
              required
              maxLength={CI_MAX_LENGTH}
              placeholder="Entre 7 y 10 caracteres"
              className={`pr-10 ${getCiInputClass()}`}
            />
            {ciChecking && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
              </div>
            )}
            {!ciChecking && ciExists && (
              <div className="absolute right-3 top-2.5">
                <X className="h-4 w-4 text-red-500" />
              </div>
            )}
            {!ciChecking &&
              !ciExists &&
              formData.ci.length >= 7 &&
              formData.ci.length <= CI_MAX_LENGTH && (
                <div className="absolute right-3 top-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              )}
          </div>

          {ciError && <p className="text-sm text-red-500">{ciError}</p>}

          {ciExists && ciExistingPatient && (
            <p className="text-sm text-red-500">
              El CI ya está registrado para:{" "}
              <strong>{ciExistingPatient.nombre_completo}</strong>
            </p>
          )}

          {!ciExists &&
            formData.ci.length >= 7 &&
            formData.ci.length <= CI_MAX_LENGTH &&
            !ciChecking && <p className="text-sm text-green-600">CI disponible</p>}

          {error && !ciExists && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="nombreCompleto" className="font-medium">
              Nombre Completo<span className="text-red-500">*</span>
            </Label>
          </div>
          <Input
            id="nombreCompleto"
            name="nombreCompleto"
            value={formData.nombreCompleto || ""}
            onChange={handleChange}
            required
            placeholder="Nombre completo del paciente"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="fechaNacimiento" className="font-medium">
              Fecha de Nacimiento<span className="text-red-500">*</span>
            </Label>
          </div>
          <Input
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            value={formData.fechaNacimiento || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="genero" className="font-medium">
              Género<span className="text-red-500">*</span>
            </Label>
          </div>
          <select
            id="genero"
            name="genero"
            value={formData.genero || "Masculino"}
            onChange={handleChange}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {/* Información de Contacto */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="telefono" className="font-medium">
              Teléfono<span className="text-red-500">*</span>
            </Label>
          </div>
          <div className="flex gap-2">
            <select
              value={codigoPais}
              onChange={handlePaisChange}
              className="flex h-10 w-[95px] shrink-0 rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {PAISES.map((p, index) => (
                <option key={`${p.codigo}-${p.abrev}-${index}`} value={p.codigo}>
                  +{p.codigo} {p.abrev}
                  {" — "}
                  {p.pais}
                </option>
              ))}
            </select>

            <Input
              id="telefono"
              name="telefono"
              value={formData.telefono || ""}
              onChange={handleChange}
              required
              maxLength={paisSeleccionado.longitud}
              placeholder={paisSeleccionado.placeholder}
              className="flex-1"
            />
          </div>
          {telefonoError && (
            <p className="text-sm text-red-500">{telefonoError}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="email" className="font-medium">
              Correo Electrónico
            </Label>
          </div>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="direccion" className="font-medium">
              Dirección
            </Label>
          </div>
          <Input
            id="direccion"
            name="direccion"
            value={formData.direccion || ""}
            onChange={handleChange}
            placeholder="Dirección completa"
          />
        </div>

        {/* Información Médica */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="tipoSangre" className="font-medium">
              Tipo de Sangre
            </Label>
          </div>
          <Input
            id="tipoSangre"
            name="tipoSangre"
            value={formData.tipoSangre || ""}
            onChange={handleChange}
            placeholder="Ej: O+, A-, etc."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="alergias" className="font-medium">
              Alergias
            </Label>
          </div>
          <Textarea
            id="alergias"
            name="alergias"
            value={formData.alergias || ""}
            onChange={handleChange}
            placeholder="Alergias conocidas del paciente"
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="enfermedadbase" className="font-medium">
              Enfermedad de base
            </Label>
          </div>
          <Textarea
            id="enfermedadbase"
            name="enfermedadbase"
            value={formData.enfermedadbase || ""}
            onChange={handleChange}
            placeholder="Enfermedad de base conocidas del paciente"
            className="min-h-[80px]"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={ciExists || ciChecking}>
          <Save className="mr-2 h-4 w-4" />
          Guardar Paciente
        </Button>
      </div>
    </form>
  );
};

export default NuevoPacienteForm;