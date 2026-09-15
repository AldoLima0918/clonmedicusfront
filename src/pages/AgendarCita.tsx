import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isToday, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NuevoPacienteForm from "@/components/NuevoPacienteForm";
import {
  getPacientes,
  getServicios,
  getDoctoresByServicio,
  agendarCita,
  getHorariosDisponibles,
  verificarCitaExistente,
} from "@/api/agendarcita";
import { Textarea } from "@/components/ui/textarea";

const horarios = [
  "07:00", "07:15", "07:30", "07:45", "08:00", "08:15", "08:30", "08:45",
  "09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45", "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45", "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45", "18:00", "18:15", "18:30", "18:45",
  "19:00", "19:15", "19:30", "19:45", "20:00",
];

const AgendarCita = () => {
  const [date, setDate] = useState<Date>();
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<number | null>(null);
  const [pacienteNuevo, setPacienteNuevo] = useState({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [paciente, setPaciente] = useState({
    nombre: "",
    telefono: "",
    ci: "",
    notas: "",
  });
  const [horario, setHorario] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [busquedaPaciente, setBusquedaPaciente] = useState("");
  const [busquedaServicio, setBusquedaServicio] = useState("");
  const [dialogPacienteOpen, setDialogPacienteOpen] = useState(false);
  const [doctoresDisponibles, setDoctoresDisponibles] = useState<any[]>([]);
  const [pacientesRegistrados, setPacientesRegistrados] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectServicioOpen, setSelectServicioOpen] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [doctorNombre, setDoctorNombre] = useState("");
  const [showPacienteResults, setShowPacienteResults] = useState(false);
  const [pacientesCargados, setPacientesCargados] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.title = "Agendar Cita | Medicus";
    fetchPacientes("");
    fetchServicios();
  }, []);

  const fetchPacientes = async (searchTerm: string) => {
    try {
      const pacientes = await getPacientes(searchTerm);
      setPacientesRegistrados(pacientes);
      setPacientesCargados(true);
      return pacientes;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pacientes",
        variant: "destructive",
      });
      setPacientesCargados(true);
      return [];
    }
  };

  const fetchServicios = async () => {
    try {
      const servicios = await getServicios();
      setServicios(servicios);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (servicioId) {
      const fetchDoctores = async () => {
        try {
          const doctores = await getDoctoresByServicio(parseInt(servicioId));
          setDoctoresDisponibles(doctores);
        } catch (error) {
          toast({
            title: "Error",
            description: "No se pudieron cargar los doctores",
            variant: "destructive",
          });
          setDoctoresDisponibles([]);
        }
      };
      fetchDoctores();
    } else {
      setDoctoresDisponibles([]);
    }
  }, [servicioId]);

  useEffect(() => {
    if (doctorId && date) {
      const fetchHorariosDisponibles = async () => {
        try {
          const horariosDisponibles = await getHorariosDisponibles(
            doctorId,
            format(date, "yyyy-MM-dd")
          );

          let horariosFiltrados = horariosDisponibles;
          if (isToday(date)) {
            const horaActual = new Date();
            const horaActualFormateada = `${String(horaActual.getHours()).padStart(2, '0')}:${String(horaActual.getMinutes()).padStart(2, '0')}`;

            horariosFiltrados = horariosDisponibles.filter(hora => {
              return hora > horaActualFormateada;
            });
          }

          setHorariosDisponibles(horariosFiltrados);
        } catch (error) {
          toast({
            title: "Error",
            description: "No se pudieron cargar los horarios disponibles",
            variant: "destructive",
          });
          setHorariosDisponibles([]);
        }
      };
      fetchHorariosDisponibles();
    } else {
      setHorariosDisponibles([]);
    }
  }, [doctorId, date]);

  useEffect(() => {
    const idPaciente = (location.state as any)?.idpaciente;
    if (!idPaciente || !pacientesCargados) return;

    const encontrado = pacientesRegistrados.find(
      (p) => Number(p.idpaciente) === Number(idPaciente)
    );

    if (encontrado) {
      setPaciente({
        nombre: encontrado.nombre_completo,
        telefono: encontrado.telefono,
        ci: encontrado.ci || "",
        notas: encontrado.notas || "",
      });
      setPacienteSeleccionado(Number(encontrado.idpaciente));
      setBusquedaPaciente("");
      setShowPacienteResults(false);
    } else {
      (async () => {
        try {
          const lista = await getPacientes("");
          const match = lista.find(
            (p: any) => Number(p.idpaciente) === Number(idPaciente)
          );
          if (match) {
            setPacientesRegistrados(lista);
            setPaciente({
              nombre: match.nombre_completo,
              telefono: match.telefono,
              ci: match.ci || "",
              notas: match.notas || "",
            });
            setPacienteSeleccionado(Number(match.idpaciente));
          }
        } catch (e) {
          // silencioso
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, pacientesCargados, pacientesRegistrados]);

  const filtrarPacientes = () => {
    if (!busquedaPaciente) return pacientesRegistrados;

    return pacientesRegistrados.filter(
      (p) =>
        p.nombre_completo
          .toLowerCase()
          .includes(busquedaPaciente.toLowerCase()) ||
        p.ci.toLowerCase().includes(busquedaPaciente.toLowerCase())
    );
  };

  const filtrarServicios = () => {
    if (!busquedaServicio) return servicios;

    return servicios.filter((s) =>
      s.nombre.toLowerCase().includes(busquedaServicio.toLowerCase())
    );
  };

  const seleccionarPaciente = (id: number) => {
    const pacienteSeleccionado = pacientesRegistrados.find(
      (p) => p.idpaciente === id
    );
    if (pacienteSeleccionado) {
      setPaciente({
        nombre: pacienteSeleccionado.nombre_completo,
        telefono: pacienteSeleccionado.telefono,
        ci: pacienteSeleccionado.ci || "",
        notas: pacienteSeleccionado.notas || "",
      });
      setPacienteSeleccionado(id);
      setBusquedaPaciente("");
      setShowPacienteResults(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaciente((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotasChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPaciente((prev) => ({ ...prev, notas: e.target.value }));
  };

  const handleNuevoPacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPacienteNuevo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePatientAdded = async (newPatient: any) => {
    try {
      const pacientesActualizados = await fetchPacientes("");

      const nuevoPaciente =
        pacientesActualizados.find(
          (p) => p.idpaciente === newPatient.idpaciente
        ) ||
        pacientesActualizados.find(
          (p) =>
            p.nombre_completo ===
            (newPatient.nombreCompleto || newPatient.nombre_completo)
        );

      if (nuevoPaciente) {
        setPaciente({
          nombre: nuevoPaciente.nombre_completo,
          telefono: nuevoPaciente.telefono,
          ci: nuevoPaciente.ci || "",
          notas: nuevoPaciente.notas || "",
        });
        setPacienteSeleccionado(nuevoPaciente.idpaciente);
      }

      setDialogPacienteOpen(false);

      toast({
        title: "Paciente creado",
        description: `Se ha creado al paciente "${newPatient.nombreCompleto}" correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al actualizar la lista de pacientes",
        variant: "destructive",
      });
    }
  };

  const reiniciarFormulario = () => {
    setDate(undefined);
    setPacienteSeleccionado(null);
    setPaciente({ nombre: "", telefono: "", ci: "", notas: "" });
    setHorario("");
    setDoctorId("");
    setServicioId("");
    setBusquedaPaciente("");
    setBusquedaServicio("");
    setDoctorNombre("");
  };

  const enviarWhatsApp = () => {
    if (!paciente.telefono) {
      toast({
        title: "Error",
        description: "El paciente no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    const doctorSeleccionado = doctoresDisponibles.find(
      (d) => d.idusuario.toString() === doctorId
    );
    const nombreDoctor = doctorSeleccionado?.nombre_completo || "el doctor";

    const mensaje = `Hola ${paciente.nombre.split(" ")[0]
      } , agendamos tu cita el día ${format(date!, "PPPP", {
        locale: es,
      })} a las ${horario} con el Doctor(a)${nombreDoctor}. ¡Te esperamos!`;

    const numero = paciente.telefono.replace(/\D/g, "");
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");

    reiniciarFormulario();
    setShowWhatsAppDialog(false);
  };

  const verificarCitaDuplicada = async (): Promise<boolean> => {
    if (!pacienteSeleccionado || !doctorId || !date) return false;

    try {
      const citaExistente = await verificarCitaExistente(
        pacienteSeleccionado,
        parseInt(doctorId),
        format(date, "yyyy-MM-dd")
      );
      return citaExistente;
    } catch (error) {
      console.error("Error al verificar cita duplicada:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!date || !horario) {
      toast({
        title: "Información incompleta",
        description: "Por favor seleccione fecha y horario para la cita",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!paciente.nombre || !paciente.telefono || !paciente.ci) {
      toast({
        title: "Información incompleta",
        description: "Por favor complete los datos del paciente",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!doctorId) {
      toast({
        title: "Información incompleta",
        description: "Por favor seleccione un doctor para la cita",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!servicioId) {
      toast({
        title: "Información incompleta",
        description: "Por favor seleccione el tipo de servicio",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (isToday(date)) {
      const horaActual = new Date();
      const [horaSeleccionada, minutosSeleccionados] = horario.split(':').map(Number);
      const horaSeleccionadaDate = new Date();
      horaSeleccionadaDate.setHours(horaSeleccionada, minutosSeleccionados, 0, 0);

      if (horaSeleccionadaDate < horaActual) {
        toast({
          title: "Horario no válido",
          description: "No se puede agendar una cita en un horario pasado",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    const citaDuplicada = await verificarCitaDuplicada();
    if (citaDuplicada) {
      toast({
        title: "Cita duplicada",
        description: "El paciente ya tiene una cita agendada con este doctor para hoy",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const citaData = {
      idpaciente: pacienteSeleccionado,
      iddoctor: parseInt(doctorId),
      idservicio: parseInt(servicioId),
      fecha: date.toISOString().split("T")[0],
      hora: horario,
    };

    try {
      const nuevaCita = await agendarCita(citaData);

      const doctorSeleccionado = doctoresDisponibles.find(
        (d) => d.idusuario.toString() === doctorId
      );
      setDoctorNombre(doctorSeleccionado?.nombre_completo || "");

      toast({
        title: "Cita agendada con éxito",
        description: `Se ha agendado una cita para ${paciente.nombre
          } el día ${format(date, "PPP", { locale: es })} a las ${horario}`,
      });

      setShowWhatsAppDialog(true);
    } catch (error: any) {
      toast({
        title: "Error al agendar cita",
        description: error.message || "Ocurrió un error al agendar la cita",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-3 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
            Agendar Cita
          </h1>
          <p className="text-xs md:text-base text-muted-foreground mt-1 sm:mt-2">
            Complete el formulario para agendar una nueva cita médica
          </p>
        </div>

        {/* Diálogo de WhatsApp */}
        <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-message-circle-more text-green-500"
                >
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                  <path d="M8 12h.01" />
                  <path d="M12 12h.01" />
                  <path d="M16 12h.01" />
                </svg>
                <span>¿Enviar confirmación por WhatsApp?</span>
              </DialogTitle>
              <DialogDescription asChild>
                <div className="pt-2">
                  ¿Deseas enviar un mensaje de confirmación a{" "}
                  {paciente.nombre.split(" ")[0]} con los detalles de la cita?
                  <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-800">
                      "Hola {paciente.nombre.split(" ")[0]}, agendamos tu cita el
                      día {date && format(date, "PPPP", { locale: es })} a las{" "}
                      {horario} con el doctor(a) {doctorNombre}. ¡Te esperamos!"
                    </p>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-start gap-2">
              <Button
                type="button"
                onClick={enviarWhatsApp}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-send"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                Enviar WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reiniciarFormulario();
                  setShowWhatsAppDialog(false);
                }}
              >
                No enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 gap-3 sm:gap-6">
          {/* Sección de Paciente */}
          <Card className="form-transition shadow-md border-none">
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                <CardTitle className="text-base sm:text-xl flex items-center">
                  <User className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Paciente
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1 sm:mt-0">
                Seleccione un paciente existente o ingrese uno nuevo
              </CardDescription>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente por nombre o CI..."
                    className="pl-8 text-xs sm:text-sm h-10 sm:h-11"
                    value={busquedaPaciente}
                    onChange={(e) => {
                      setBusquedaPaciente(e.target.value);
                      fetchPacientes(e.target.value);
                      setShowPacienteResults(true);
                    }}
                    onFocus={() => setShowPacienteResults(true)}
                    onBlur={() => {
                      setTimeout(() => setShowPacienteResults(false), 200);
                    }}
                  />
                  {showPacienteResults && busquedaPaciente && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-[250px] overflow-y-auto">
                      {filtrarPacientes().length > 0 ? (
                        filtrarPacientes().map((p) => (
                          <div
                            key={p.idpaciente}
                            className="cursor-pointer px-3 py-2 hover:bg-accent text-xs sm:text-sm"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              seleccionarPaciente(p.idpaciente);
                            }}
                          >
                            <div className="font-medium">
                              {p.nombre_completo}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {p.ci}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-2 text-xs sm:text-sm text-muted-foreground">
                          No hay resultados
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Dialog
                  open={dialogPacienteOpen}
                  onOpenChange={setDialogPacienteOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="text-xs h-10 sm:h-11 px-6 sm:px-10 shrink-0">
                      <Plus className="mr-1 h-4 w-4" />
                      <span className="hidden xs:inline">Nuevo Paciente</span>
                      <span className="xs:hidden">Nuevo</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
                      <DialogDescription>
                        Complete el formulario con los datos del nuevo paciente.
                        Todos los campos marcados con{" "}
                        <span className="text-red-500 font-bold">*</span> son
                        obligatorios.
                      </DialogDescription>
                    </DialogHeader>
                    <NuevoPacienteForm
                      onPatientAdded={handlePatientAdded}
                      onCancel={() => setDialogPacienteOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label
                    htmlFor="nombre"
                    className={cn(
                      "text-xs sm:text-sm transition-colors",
                      pacienteSeleccionado
                        ? "font-bold !text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    Nombre completo
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Nombre y apellidos"
                    value={paciente.nombre}
                    onChange={handleInputChange}
                    readOnly
                    className={cn(
                      "h-7 sm:h-9 text-xs sm:text-sm transition-colors cursor-default focus-visible:ring-0",
                      pacienteSeleccionado
                        ? "font-semibold !text-foreground !opacity-100 bg-muted/40"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label
                    htmlFor="telefono"
                    className={cn(
                      "text-xs sm:text-sm transition-colors",
                      pacienteSeleccionado
                        ? "font-bold !text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    placeholder="Número de contacto"
                    value={paciente.telefono}
                    onChange={handleInputChange}
                    readOnly
                    className={cn(
                      "h-7 sm:h-9 text-xs sm:text-sm transition-colors cursor-default focus-visible:ring-0",
                      pacienteSeleccionado
                        ? "font-semibold !text-foreground !opacity-100 bg-muted/40"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label
                    htmlFor="ci"
                    className={cn(
                      "text-xs sm:text-sm transition-colors",
                      pacienteSeleccionado
                        ? "font-bold !text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    Carnet de Identidad
                  </Label>
                  <Input
                    id="ci"
                    name="ci"
                    placeholder="3760765"
                    value={paciente.ci || ""}
                    onChange={handleInputChange}
                    readOnly
                    className={cn(
                      "h-7 sm:h-9 text-xs sm:text-sm transition-colors cursor-default focus-visible:ring-0",
                      pacienteSeleccionado
                        ? "font-semibold !text-foreground !opacity-100 bg-muted/40"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
              </div>

              {pacienteSeleccionado && (
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="notas" className="text-xs sm:text-sm">
                    Notas del paciente (solo lectura)
                  </Label>
                  <Textarea
                    id="notas"
                    name="notas"
                    placeholder="Este paciente no tiene notas registradas"
                    value={paciente.notas || ""}
                    onChange={handleNotasChange}
                    className="text-xs sm:text-sm min-h-[80px] bg-muted/50"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    Notas informativas del paciente (no se incluirán en la cita)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="servicio" className="text-xs sm:text-sm">
                    Tipo de Servicio
                  </Label>
                  <Select
                    value={servicioId}
                    onValueChange={setServicioId}
                    open={selectServicioOpen}
                    onOpenChange={setSelectServicioOpen}
                  >
                    <SelectTrigger
                      id="servicio"
                      className="h-7 sm:h-9 text-xs sm:text-sm"
                    >
                      <SelectValue placeholder="Seleccione servicio" />
                    </SelectTrigger>
                    <SelectContent className="p-0">
                      <div className="p-2">
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar servicio..."
                            className="pl-8 text-xs sm:text-sm h-9"
                            value={busquedaServicio}
                            onChange={(e) => {
                              setBusquedaServicio(e.target.value);
                              setSelectServicioOpen(true);
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {filtrarServicios().length > 0 ? (
                            filtrarServicios().map((servicio) => (
                              <SelectItem
                                key={servicio.idservicio}
                                value={servicio.idservicio.toString()}
                                className="text-xs sm:text-sm"
                                onClick={() => {
                                  setBusquedaServicio("");
                                  setSelectServicioOpen(false);
                                }}
                              >
                                {servicio.nombre} - Bs.{servicio.precio}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="text-center py-2 text-xs sm:text-sm text-muted-foreground">
                              No hay servicios disponibles
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="doctor" className="text-xs sm:text-sm">
                    Doctor
                  </Label>
                  <Select
                    value={doctorId}
                    onValueChange={setDoctorId}
                    disabled={!servicioId}
                  >
                    <SelectTrigger
                      id="doctor"
                      className="h-7 sm:h-9 text-xs sm:text-sm"
                    >
                      <SelectValue
                        placeholder={
                          servicioId
                            ? "Seleccione doctor"
                            : "Seleccione servicio"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {doctoresDisponibles && doctoresDisponibles.length > 0 ? (
                        doctoresDisponibles.map((doctor) => (
                          <SelectItem
                            key={doctor.idusuario}
                            value={doctor.idusuario.toString()}
                            className="text-xs sm:text-sm"
                          >
                            {doctor.nombre_completo} - {doctor.especialidad}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="text-xs sm:text-sm text-muted-foreground p-2">
                          No hay doctores disponibles
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección de Fecha y Horario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            {/* ====== CARD DE FECHA CON CALENDARIO MEJORADO ====== */}
            <Card className="form-transition shadow-lg border border-border/60 bg-gradient-to-br from-card to-muted/20 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="text-base sm:text-xl flex items-center">
                  <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Fecha
                </CardTitle>
                {date && (
                  <CardDescription className="text-xs text-primary font-medium pt-1">
                    {format(date, "PPPP", { locale: es })}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-4 px-2 sm:px-4 flex justify-center">
                <div className="w-full max-w-[360px]">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={es}
                    disabled={{ before: startOfToday() }}
                    className="rounded-2xl bg-card/50 backdrop-blur-sm p-3 w-full"
                    classNames={{
                      months:
                        "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                      month: "space-y-4 w-full",
                      caption:
                        "flex justify-center pt-1 relative items-center mb-3",
                      caption_label: "text-base font-semibold",
                      nav: "space-x-1 flex items-center",
                      nav_button:
                        "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 inline-flex items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex w-full mb-1",
                      head_cell:
                        "text-muted-foreground rounded-md w-10 font-medium text-[0.7rem] uppercase tracking-wide flex-1 text-center",
                      row: "flex w-full mt-1",
                      cell: "text-center text-sm p-0 relative flex-1 flex items-center justify-center",
                      day: "h-10 w-10 p-0 font-normal rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/40",
                      day_selected:
                        "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/30 hover:bg-primary hover:text-primary-foreground hover:scale-105",
                      day_today:
                        "bg-primary/10 text-primary font-semibold rounded-xl ring-1 ring-primary/30",
                      day_outside: "text-muted-foreground/30 opacity-50",
                      day_disabled:
                        "text-muted-foreground/40 opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground/40 hover:scale-100",
                      day_hidden: "invisible",
                    }}
                    components={{
                      IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                      IconRight: () => <ChevronRight className="h-4 w-4" />,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ====== CARD DE HORARIO ====== */}
            <Card className="form-transition shadow-md border-none">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-xl flex items-center">
                  <Clock className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Horario
                </CardTitle>
                {isToday(date) && (
                  <CardDescription className="text-xs text-amber-600">
                    Solo se muestran horarios disponibles a partir de la hora actual
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <Select
                  value={horario}
                  onValueChange={setHorario}
                  disabled={!doctorId || !date}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione horario" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {horariosDisponibles.length > 0 ? (
                      horariosDisponibles.map((hora) => (
                        <SelectItem key={hora} value={hora}>
                          {hora}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="text-xs sm:text-sm text-muted-foreground p-2">
                        {!doctorId || !date
                          ? "Seleccione doctor y fecha primero"
                          : "No hay horarios disponibles"
                        }
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Botón de Agendar Cita */}
          <Card className="form-transition shadow-md border-none">
            <CardContent className="pt-4 pb-2">
              <form onSubmit={handleSubmit}>
                <Button
                  type="submit"
                  className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Agendando..." : "Agendar Cita"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgendarCita;