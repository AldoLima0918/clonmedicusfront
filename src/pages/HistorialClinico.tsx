import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  UserRound,
  CalendarDays,
  Phone,
  FileText,
  Edit,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  getHistorialClinico,
  getServicios,
  updatePaciente,
  getDoctorInfo,
  updateAntecedente,
} from "@/api/historialclinicoapi";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import NuevaConsulta from "./NuevaConsulta";
import Receta from "./Receta";
import draftToHtml from "draftjs-to-html";

interface HistorialClinicoProps {
  isSidebarVisible: boolean;
}

interface Antecedente {
  idhistoria: number;
  antecedente: string;
  fecha_historia: string;
}

// Helper: convierte contenido (Draft.js JSON o texto plano) a texto plano
const extraerTextoPlano = (content: string): string => {
  if (!content) return "";
  try {
    const parsed = JSON.parse(content);
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      return parsed.blocks.map((block: any) => block.text).join("\n");
    }
  } catch (e) {
    // No es JSON
  }
  if (content.trim().startsWith("<")) {
    const temp = document.createElement("div");
    temp.innerHTML = content;
    return temp.textContent || temp.innerText || "";
  }
  return content;
};

// Helper: convierte texto plano a formato Draft.js
const textoADraftJs = (texto: string): string => {
  const blocks = texto.split("\n").map((line, index) => ({
    key: `block-${index}-${Date.now()}`,
    text: line,
    type: "unstyled",
    depth: 0,
    inlineStyleRanges: [],
    entityRanges: [],
    data: {},
  }));
  return JSON.stringify({ blocks, entityMap: {} });
};

const AntecedenteContent = ({ content }: { content: string }) => {
  try {
    const parsed = JSON.parse(content);
    if (parsed.blocks) {
      const html = draftToHtml(parsed);
      return (
        <div
          className="text-muted-foreground whitespace-pre-line text-sm break-words"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ lineHeight: "1.4", fontFamily: "inherit" }}
        />
      );
    }
  } catch (e) {
    const lines = content.split("\n");
    return (
      <div
        className="text-muted-foreground whitespace-pre-line text-sm break-words"
        style={{ lineHeight: "1.3" }}
      >
        {lines.map((line, index) => {
          if (/^\s*(\d+\.|\-|\*)\s/.test(line)) {
            return (
              <div key={index} className="ml-4 pl-2">
                {line}
              </div>
            );
          }
          return <div key={index}>{line}</div>;
        })}
      </div>
    );
  }
  return (
    <div
      className="text-muted-foreground whitespace-pre-line text-sm break-words"
      style={{ lineHeight: "1.3" }}
    >
      {content.split("\n").map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  );
};

const esFechaDeHoy = (fechaString: string): boolean => {
  if (!fechaString) return false;
  const fecha = new Date(fechaString);
  const hoy = new Date();
  return (
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  );
};

const HistorialClinico = ({ isSidebarVisible }: HistorialClinicoProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("antecedentes");
  const [servicios, setServicios] = useState<any[]>([]);
  const [editingPatient, setEditingPatient] = useState(false);
  const [editedPatient, setEditedPatient] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const [idCita, setIdCita] = useState<string | null>(null);
  const [doctorInfo, setDoctorInfo] = useState({
    nombre_completo: "",
    especialidad: "",
    genero: "",
  });
  const [expandedEspecialidades, setExpandedEspecialidades] = useState<
    Record<string, boolean>
  >({});
  const [especialidadesDisponibles, setEspecialidadesDisponibles] = useState<
    { nombre: string }[]
  >([]);
  const [especialidadActiva, setEspecialidadActiva] = useState<string | null>(
    null
  );

  // Estado para colapsar info del paciente en móvil
  const [expandedInfoMobile, setExpandedInfoMobile] = useState(false);

  // Estados para edición de antecedentes
  const [editingAntecedenteId, setEditingAntecedenteId] = useState<
    number | null
  >(null);
  const [editedAntecedenteText, setEditedAntecedenteText] =
    useState<string>("");
  const [savingAntecedente, setSavingAntecedente] = useState(false);

  useEffect(() => {
    if (location.state) {
      const { idcita } = location.state;
      setIdCita(idcita);
    }
  }, [location.state]);

  const fetchPatientData = async () => {
    try {
      if (!userId) throw new Error("No hay usuario autenticado");
      if (!id) throw new Error("ID de paciente no proporcionado");

      const data = await getHistorialClinico(id, userId.toString());
      if (!data.historialPorEspecialidad) {
        data.historialPorEspecialidad = {};
      }

      const especialidades = Object.keys(data.historialPorEspecialidad);
      setEspecialidadesDisponibles(
        especialidades.map((nombre) => ({ nombre }))
      );

      setPatient(data);
      setEditedPatient(data);

      if (data.especialidadDefault) {
        setEspecialidadActiva(data.especialidadDefault);
        setExpandedEspecialidades({ [data.especialidadDefault]: true });
      } else if (especialidades.length > 0) {
        setEspecialidadActiva(especialidades[0]);
        setExpandedEspecialidades({ [especialidades[0]]: true });
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial clínico",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        if (!userId) return;
        const data = await getServicios(userId.toString());
        setServicios(data);
      } catch (error) {
        console.error("Error fetching servicios:", error);
      }
    };

    const fetchDoctorInfo = async () => {
      if (userId) {
        try {
          const data = await getDoctorInfo(userId.toString());
          setDoctorInfo(data);
        } catch (error) {
          console.error("Error fetching doctor info:", error);
        }
      }
    };

    fetchPatientData();
    if (userId) {
      fetchServicios();
      fetchDoctorInfo();
    }
  }, [userId, id, toast]);

  const toggleEspecialidad = (especialidad: string) => {
    setExpandedEspecialidades((prev) => ({
      ...prev,
      [especialidad]: !prev[especialidad],
    }));
  };

  const handleEspecialidadChange = (especialidad: string) => {
    setEspecialidadActiva(especialidad);
  };

  const handleSavePatientInfo = async () => {
    try {
      if (!id) {
        toast({
          title: "Error",
          description: "ID de paciente no válido",
          variant: "destructive",
        });
        return;
      }
      const pacienteActualizado = await updatePaciente(id, editedPatient);
      const pacienteConHistorial = {
        ...pacienteActualizado,
        historialPorEspecialidad: patient.historialPorEspecialidad,
        especialidadDefault: patient.especialidadDefault,
      };
      setPatient(pacienteConHistorial);
      setEditingPatient(false);
      toast({
        title: "Información actualizada",
        description:
          "La información del paciente se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error("Error updating patient info:", error);
      toast({
        title: "Error",
        description: "Hubo un error al actualizar la información del paciente.",
        variant: "destructive",
      });
    }
  };

  const handleStartEditAntecedente = (antecedente: Antecedente) => {
    setEditingAntecedenteId(antecedente.idhistoria);
    setEditedAntecedenteText(extraerTextoPlano(antecedente.antecedente));
  };

  const handleCancelEditAntecedente = () => {
    setEditingAntecedenteId(null);
    setEditedAntecedenteText("");
  };

  const handleSaveAntecedente = async (idhistoria: number) => {
    if (!editedAntecedenteText.trim()) {
      toast({
        title: "Error",
        description: "El texto del antecedente no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    setSavingAntecedente(true);
    try {
      const contenidoDraftJs = textoADraftJs(editedAntecedenteText);
      await updateAntecedente(idhistoria.toString(), contenidoDraftJs);

      const nuevoHistorialPorEspecialidad = {
        ...patient.historialPorEspecialidad,
      };

      Object.keys(nuevoHistorialPorEspecialidad).forEach((esp) => {
        nuevoHistorialPorEspecialidad[esp].historiales =
          nuevoHistorialPorEspecialidad[esp].historiales.map(
            (h: Antecedente) => {
              if (h.idhistoria === idhistoria) {
                return { ...h, antecedente: contenidoDraftJs };
              }
              return h;
            }
          );
      });

      setPatient({
        ...patient,
        historialPorEspecialidad: nuevoHistorialPorEspecialidad,
      });

      setEditingAntecedenteId(null);
      setEditedAntecedenteText("");

      toast({
        title: "Antecedente actualizado",
        description:
          "El texto del antecedente se ha actualizado correctamente.",
      });
    } catch (error: any) {
      console.error("Error updating antecedente:", error);
      toast({
        title: "Error",
        description:
          error.message || "Hubo un error al actualizar el antecedente.",
        variant: "destructive",
      });
    } finally {
      setSavingAntecedente(false);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "Edad no especificada";
    const [year, month, day] = dob.split("T")[0].split("-");
    const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(birthDate.getTime())) return "Fecha inválida";
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Fecha no especificada";
    const [year, month, day] = dateString.split("T")[0].split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(date.getTime())) return "Fecha inválida";
    return date.toLocaleDateString("es-BO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!patient) {
    return (
      <div className="page-transition w-full p-4 sm:p-6 md:p-8">
        <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8 print:p-0">
      <header className="flex items-center gap-3 sm:gap-4 mb-6 md:mb-8 print:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1 break-words">
            Registro de Consultas
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Expediente médico completo del paciente
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Info del paciente */}
        <Card className="lg:col-span-1 print:hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center">
              <UserRound className="mr-2 h-5 w-5 shrink-0" />
              Información del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent
            className="space-y-4 p-4 sm:p-6"
            style={{ lineHeight: "1.3" }}
          >
            {!editingPatient ? (
              <>
                {/* Avatar + nombre + edad/género: SIEMPRE VISIBLE */}
                <div className="text-center mb-4">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 bg-medical-light rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-10 w-10 sm:h-12 sm:w-12 text-medical-dark" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold break-words">
                    {patient.nombre_completo}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {calculateAge(patient.fecha_nacimiento)} años •{" "}
                    {patient.genero}
                  </p>
                </div>

                {/* Botón Ver más / Ver menos: solo en móvil */}
                <Button
                  variant="outline"
                  className="w-full lg:hidden"
                  onClick={() => setExpandedInfoMobile((prev) => !prev)}
                >
                  {expandedInfoMobile ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Ver menos información
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Ver más información
                    </>
                  )}
                </Button>

                {/* Detalles: en móvil solo si expandedInfoMobile; en desktop siempre */}
                <div
                  className={`space-y-3 ${
                    expandedInfoMobile ? "block" : "hidden"
                  } lg:block`}
                >
                  <div className="flex items-start">
                    <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm">
                        Fecha de Nacimiento
                      </h3>
                      <p className="text-sm break-words">
                        {formatDate(patient.fecha_nacimiento)} (
                        {calculateAge(patient.fecha_nacimiento)} años)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm">Teléfono</h3>
                      <p className="text-sm break-all">{patient.telefono}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Badge className="mr-3 mt-0.5 shrink-0">
                      {patient.tipo_sangre}
                    </Badge>
                    <div>
                      <h3 className="font-medium text-sm">Tipo de Sangre</h3>
                      <p className="text-sm">{patient.tipo_sangre}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm mb-1">Alergias</h3>
                    <div
                      className="bg-red-50 border border-red-200 rounded-md p-2 text-red-700 text-sm break-words"
                      style={{ lineHeight: "1.3" }}
                    >
                      {patient.alergias || "No se han registrado alergias"}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm mb-1">
                      Enfermedad de base
                    </h3>
                    <div
                      className="bg-red-50 border border-red-200 rounded-md p-2 text-red-700 text-sm break-words"
                      style={{ lineHeight: "1.3" }}
                    >
                      {patient.enfermedad_base ||
                        "No se han registrado enfermedades de base"}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm mb-1">Dirección</h3>
                    <p
                      className="text-muted-foreground text-sm break-words"
                      style={{ lineHeight: "1.3" }}
                    >
                      {patient.direccion}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setEditingPatient(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Información
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3" style={{ lineHeight: "1.3" }}>
                <div>
                  <Label htmlFor="patient-name">Nombre Completo</Label>
                  <Input
                    id="patient-name"
                    value={editedPatient.nombre_completo}
                    onChange={(e) =>
                      setEditedPatient({
                        ...editedPatient,
                        nombre_completo: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="patient-dob">Fecha de Nacimiento</Label>
                  <Input
                    id="patient-dob"
                    type="date"
                    value={editedPatient.fecha_nacimiento}
                    onChange={(e) =>
                      setEditedPatient({
                        ...editedPatient,
                        fecha_nacimiento: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="patient-gender">Género</Label>
                  <select
                    id="patient-gender"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={editedPatient.genero}
                    onChange={(e) =>
                      setEditedPatient({
                        ...editedPatient,
                        genero: e.target.value,
                      })
                    }
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="patient-phone">Teléfono</Label>
                  <Input
                    id="patient-phone"
                    value={editedPatient.telefono}
                    onChange={(e) =>
                      setEditedPatient({
                        ...editedPatient,
                        telefono: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="patient-blood">Tipo de Sangre</Label>
                  <Input
                    id="patient-blood"
                    value={editedPatient.tipo_sangre}
                    onChange={(e) =>
                      setEditedPatient({
                        ...editedPatient,
                        tipo_sangre: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="patient-allergies">Alergias</Label>
                  <Textarea
                    id="patient-allergies"
                    value={editedPatient.alergias}
                    onChange={(e) =>
                      setEditedPatient({
                        ...editedPatient,
                        alergias: e.target.value,
                      })
                    }
                    style={{ lineHeight: "1.3" }}
                  />
                </div>
                <div>
                  <Label htmlFor="patient-enfermedadbase">
                    Enfermedad de base
                  </Label>
                  <Textarea
                    id="patient-enfermedadbase"
                    value={editedPatient.enfermedad_base}
                    onChange={(e) =>
                      setEditedPatient({
                        ...editedPatient,
                        enfermedad_base: e.target.value,
                      })
                    }
                    style={{ lineHeight: "1.3" }}
                  />
                </div>
                <div>
                  <Label htmlFor="patient-address">Dirección</Label>
                  <Textarea
                    id="patient-address"
                    value={editedPatient.direccion}
                    onChange={(e) =>
                      setEditedPatient({
                        ...editedPatient,
                        direccion: e.target.value,
                      })
                    }
                    style={{ lineHeight: "1.3" }}
                  />
                </div>
                <div className="flex flex-col xs:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full xs:flex-1"
                    onClick={() => setEditingPatient(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="w-full xs:flex-1"
                    onClick={handleSavePatientInfo}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contenido principal */}
        <Card className="lg:col-span-3 print:shadow-none print:border-none">
          <CardHeader
            className={`p-4 sm:p-6 ${
              activeTab !== "receta" ? "print:hidden" : ""
            }`}
          >
            <div className="flex flex-col gap-3">
              <CardTitle className="text-lg sm:text-xl flex items-center">
                <FileText className="mr-2 h-5 w-5 shrink-0" />
                <span className="break-words">
                  {activeTab === "antecedentes"
                    ? "Antecedentes Médicos"
                    : activeTab === "nueva"
                    ? "Nueva Consulta"
                    : "RECETA MÉDICA"}
                </span>
              </CardTitle>

              {/* Tabs: scroll horizontal en móvil */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 print:hidden">
                <Button
                  onClick={() => setActiveTab("antecedentes")}
                  variant={
                    activeTab === "antecedentes" ? "default" : "outline"
                  }
                  size="sm"
                  className="shrink-0"
                >
                  Historial
                </Button>
                <Button
                  onClick={() => setActiveTab("nueva")}
                  variant={activeTab === "nueva" ? "default" : "outline"}
                  disabled={!idCita}
                  size="sm"
                  className="shrink-0"
                >
                  Nueva Consulta
                </Button>
                <Button
                  onClick={() => setActiveTab("receta")}
                  variant={activeTab === "receta" ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                >
                  Receta
                </Button>
              </div>
            </div>

            {activeTab === "antecedentes" && (
              <div className="mt-3">
                <div className="flex items-start gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {especialidadesDisponibles.map((especialidad) => (
                      <Button
                        key={especialidad.nombre}
                        variant={
                          especialidadActiva === especialidad.nombre
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleEspecialidadChange(especialidad.nombre)
                        }
                      >
                        {especialidad.nombre}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-4 sm:p-6" style={{ lineHeight: "1.3" }}>
            {activeTab === "antecedentes" && (
              <div className="space-y-3 sm:space-y-4">
                {especialidadActiva &&
                patient.historialPorEspecialidad[especialidadActiva] ? (
                  <div className="space-y-3">
                    {patient.historialPorEspecialidad[
                      especialidadActiva
                    ].historiales.map((antecedente: Antecedente) => {
                      const esDeHoy = esFechaDeHoy(
                        antecedente.fecha_historia
                      );
                      const estaEditando =
                        editingAntecedenteId === antecedente.idhistoria;

                      return (
                        <Card
                          key={antecedente.idhistoria}
                          className="overflow-hidden"
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                              <h3 className="font-medium text-sm sm:text-base break-words">
                                {formatDate(antecedente.fecha_historia)}
                                {esDeHoy && (
                                  <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    Hoy
                                  </Badge>
                                )}
                              </h3>
                              {esDeHoy && !estaEditando && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleStartEditAntecedente(antecedente)
                                  }
                                  className="h-8 px-2 text-muted-foreground hover:text-foreground shrink-0"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              )}
                            </div>

                            {estaEditando ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editedAntecedenteText}
                                  onChange={(e) =>
                                    setEditedAntecedenteText(e.target.value)
                                  }
                                  className="min-h-[100px] text-sm"
                                  style={{ lineHeight: "1.4" }}
                                  disabled={savingAntecedente}
                                />
                                <div className="flex flex-col xs:flex-row gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEditAntecedente}
                                    disabled={savingAntecedente}
                                    className="w-full xs:w-auto"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSaveAntecedente(
                                        antecedente.idhistoria
                                      )
                                    }
                                    disabled={savingAntecedente}
                                    className="w-full xs:w-auto"
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    {savingAntecedente
                                      ? "Guardando..."
                                      : "Guardar"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <AntecedenteContent
                                content={antecedente.antecedente}
                              />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay antecedentes médicos registrados para esta
                    especialidad.
                  </div>
                )}
              </div>
            )}

            {activeTab === "nueva" && (
              <NuevaConsulta
                id={id || ""}
                idCita={idCita}
                servicios={servicios}
                patient={patient}
              />
            )}

            {activeTab === "receta" && (
              <Receta patient={patient} doctorInfo={doctorInfo} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistorialClinico;