import { useState, useEffect, useCallback, useRef } from "react";
import {
  UserPlus,
  Edit,
  Trash,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import NuevoPacienteForm from "@/components/NuevoPacienteForm";
import {
  getPacientes as fetchPacientesApi,
  updatePaciente as updatePacienteApi,
  deletePaciente as deletePacienteApi,
  checkCiExists as checkCiExistsApi,
  FormPaciente,
  PaginationInfo,
} from "@/api/listapacientesapi";

const WhatsAppIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const LIMIT = 20;

/** Card de un paciente para vista móvil */
const PacienteCard = ({
  paciente,
  calcularDiasTranscurridos,
  onEdit,
  onDelete,
  onWhatsApp,
}: {
  paciente: FormPaciente;
  calcularDiasTranscurridos: (fecha?: string) => string;
  onEdit: (p: FormPaciente) => void;
  onDelete: (id: number) => void;
  onWhatsApp: (tel: string) => void;
}) => (
  <Card className="shadow-sm border border-border/60">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-tight break-words">
            {paciente.nombre_completo}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            CI: {paciente.ci || "—"}
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#25D366] hover:text-[#128C7E] hover:bg-[#25D366]/10"
            onClick={() => onWhatsApp(paciente.telefono)}
            aria-label="WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(paciente)}
            aria-label="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                aria-label="Eliminar"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-lg rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Está seguro que desea eliminar este paciente?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El paciente{" "}
                  <span className="font-semibold">
                    {paciente.nombre_completo}
                  </span>{" "}
                  será eliminado permanentemente del sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(paciente.idpaciente)}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm pt-1 border-t">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Teléfono</span>
          <span className="font-medium text-right break-all">
            {paciente.telefono}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Última consulta</span>
          <span className="font-medium text-right">
            {calcularDiasTranscurridos(paciente.ultima_consulta)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Nacimiento</span>
          <span className="font-medium text-right">
            {paciente.fecha_nacimiento
              ? new Date(paciente.fecha_nacimiento).toLocaleDateString()
              : "Sin fecha"}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Dirección</span>
          <span className="font-medium text-right break-words">
            {paciente.direccion || "Sin dirección"}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ListaPacientes = () => {
  const [pacientes, setPacientes] = useState<FormPaciente[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: LIMIT,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formPaciente, setFormPaciente] = useState<FormPaciente>({
    idpaciente: 0,
    nombre_completo: "",
    telefono: "",
    correo: "",
    fecha_nacimiento: "",
    tipo_sangre: "",
    genero: "",
    direccion: "",
    alergias: "",
    enfermedad_base: "",
    ci: "",
  });

  // ✅ Estados para la verificación de CI en edición
  const [ciChecking, setCiChecking] = useState(false);
  const [ciExists, setCiExists] = useState(false);
  const [ciExistingPatient, setCiExistingPatient] = useState<{
    idpaciente: number;
    nombre_completo: string;
  } | null>(null);
  const [ciError, setCiError] = useState<string | null>(null);

  const ciCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalCiRef = useRef<string>("");

  const { toast } = useToast();

  // Debounce del buscador
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ✅ Efecto: verificar CI cuando cambia en el formulario de edición
  useEffect(() => {
    // Solo verificar si el diálogo de edición está abierto
    if (!editDialogOpen) return;

    // Si el CI es igual al original, no verificar (no ha cambiado)
    if (formPaciente.ci === originalCiRef.current) {
      setCiExists(false);
      setCiExistingPatient(null);
      setCiChecking(false);
      return;
    }

    if (ciCheckTimeoutRef.current) {
      clearTimeout(ciCheckTimeoutRef.current);
    }

    setCiExists(false);
    setCiExistingPatient(null);

    // Validar longitud: entre 7 y 10
    if (formPaciente.ci.length < 7 || formPaciente.ci.length > 10) {
      setCiChecking(false);
      if (formPaciente.ci.length > 0 && formPaciente.ci.length < 7) {
        setCiError("El CI debe tener entre 7 y 10 caracteres");
      } else {
        setCiError(null);
      }
      return;
    }

    setCiError(null);
    setCiChecking(true);

    ciCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await checkCiExistsApi(
          formPaciente.ci,
          formPaciente.idpaciente // ✅ Excluir al propio paciente
        );
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
  }, [formPaciente.ci, formPaciente.idpaciente, editDialogOpen]);

  const cargarPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchPacientesApi({
        page: currentPage,
        limit: LIMIT,
        search: debouncedSearch,
      });
      setPacientes(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pacientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, toast]);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  const calcularDiasTranscurridos = (fechaConsulta?: string) => {
    if (!fechaConsulta) return "Sin registros";

    const ahora = new Date();
    const offsetBolivia = -4 * 60;
    const ahoraBolivia = new Date(
      ahora.getTime() + (offsetBolivia + ahora.getTimezoneOffset()) * 60000
    );

    const fechaConsultaObj = new Date(fechaConsulta);
    const fechaConsultaBolivia = new Date(
      fechaConsultaObj.getTime() +
        (offsetBolivia + fechaConsultaObj.getTimezoneOffset()) * 60000
    );

    const diffTiempo = ahoraBolivia.getTime() - fechaConsultaBolivia.getTime();
    const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

    if (diffDias === 0) {
      const diffHoras = Math.floor(diffTiempo / (1000 * 60 * 60));
      if (diffHoras === 0) {
        const diffMinutos = Math.floor(diffTiempo / (1000 * 60));
        if (diffMinutos === 0) return "Hace unos momentos";
        return `Hace ${diffMinutos} minuto${diffMinutos !== 1 ? "s" : ""}`;
      }
      return `Hace ${diffHoras} hora${diffHoras !== 1 ? "s" : ""}`;
    } else if (diffDias === 1) return "Hace 1 día";
    else if (diffDias < 7) return `Hace ${diffDias} días`;
    else if (diffDias < 30) {
      const semanas = Math.floor(diffDias / 7);
      return semanas === 1 ? "Hace 1 semana" : `Hace ${semanas} semanas`;
    } else if (diffDias < 365) {
      const meses = Math.floor(diffDias / 30);
      return meses === 1 ? "Hace 1 mes" : `Hace ${meses} meses`;
    } else {
      const años = Math.floor(diffDias / 365);
      return años === 1 ? "Hace 1 año" : `Hace ${años} años`;
    }
  };

  const handleOpenAddDialog = () => setAddDialogOpen(true);

  const handleOpenEditDialog = (paciente: FormPaciente) => {
    const formattedPaciente = {
      ...paciente,
      fecha_nacimiento: paciente.fecha_nacimiento
        ? new Date(paciente.fecha_nacimiento).toISOString().split("T")[0]
        : "",
    };
    setFormPaciente(formattedPaciente);
    // ✅ Guardar el CI original para no verificar contra él mismo
    originalCiRef.current = paciente.ci;
    // Resetear estados de verificación
    setCiExists(false);
    setCiExistingPatient(null);
    setCiChecking(false);
    setCiError(null);
    setEditDialogOpen(true);
  };

  const handlePatientAdded = (newPatient: FormPaciente) => {
    setAddDialogOpen(false);
    toast({
      title: "Paciente creado",
      description: `Se ha creado el paciente ${newPatient.nombre_completo}`,
    });
    cargarPacientes();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formPaciente.nombre_completo ||
      !formPaciente.ci ||
      !formPaciente.telefono
    ) {
      toast({
        title: "Error",
        description: "Nombre, cédula y teléfono son campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Validar CI
    if (formPaciente.ci.length < 7 || formPaciente.ci.length > 10) {
      setCiError("El CI debe tener entre 7 y 10 caracteres");
      toast({
        title: "Error",
        description: "El CI debe tener entre 7 y 10 caracteres",
        variant: "destructive",
      });
      return;
    }

    // ✅ Bloquear si el CI ya existe (y no es el mismo paciente)
    if (ciExists) {
      toast({
        title: "Error",
        description: "El CI ya está registrado para otro paciente",
        variant: "destructive",
      });
      return;
    }

    try {
      if (formPaciente.idpaciente) {
        const updatedPaciente: FormPaciente = await updatePacienteApi(
          formPaciente.idpaciente,
          formPaciente
        );
        setPacientes((prev) =>
          prev.map((p) =>
            p.idpaciente === updatedPaciente.idpaciente ? updatedPaciente : p
          )
        );
        toast({
          title: "Paciente actualizado",
          description: `Se ha actualizado el paciente ${updatedPaciente.nombre_completo}`,
        });
      }
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al guardar el paciente",
        variant: "destructive",
      });
    }
  };

  const handleDeletePaciente = async (idpaciente: number) => {
    try {
      await deletePacienteApi(idpaciente);
      toast({
        title: "Paciente eliminado",
        description: "El paciente ha sido eliminado correctamente",
      });
      if (pacientes.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        cargarPacientes();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al eliminar el paciente",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppClick = (telefono: string) => {
    const numeroLimpio = telefono.replace(/[\s-]/g, "");
    window.open(`https://wa.me/${numeroLimpio}`, "_blank");
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const total = pagination.totalPages;
    const current = pagination.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push("...");
    pages.push(total);

    return pages;
  };

  // ✅ Clase visual del input CI en edición
  const getCiInputClass = () => {
    if (ciChecking) return "border-yellow-400 focus-visible:ring-yellow-400";
    if (ciExists) return "border-red-500 focus-visible:ring-red-500";
    if (
      formPaciente.ci.length >= 7 &&
      formPaciente.ci.length <= 10 &&
      !ciExists
    )
      return "border-green-500 focus-visible:ring-green-500";
    return "";
  };

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Gestión de Pacientes
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Administre los pacientes del sistema
          </p>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog} className="w-full md:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Añadir Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw] rounded-lg">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Paciente</DialogTitle>
              <DialogDescription>
                Complete el formulario para añadir un nuevo paciente al sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <NuevoPacienteForm
                onPatientAdded={(patient) => {
                  const newPaciente: FormPaciente = {
                    idpaciente: 0,
                    nombre_completo: patient.nombreCompleto,
                    telefono: patient.telefono,
                    correo: patient.email,
                    fecha_nacimiento: patient.fechaNacimiento,
                    tipo_sangre: patient.tipoSangre,
                    genero: patient.genero,
                    direccion: patient.direccion,
                    alergias: patient.alergias,
                    enfermedad_base: patient.enfermedadbase,
                    ci: patient.ci,
                  };
                  handlePatientAdded(newPaciente);
                }}
                onCancel={() => setAddDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Editar Paciente</DialogTitle>
                <DialogDescription>
                  Actualice la información del paciente seleccionado.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre completo *</Label>
                  <Input
                    id="nombre_completo"
                    value={formPaciente.nombre_completo}
                    onChange={(e) =>
                      setFormPaciente({
                        ...formPaciente,
                        nombre_completo: e.target.value,
                      })
                    }
                    placeholder="Nombre del paciente"
                    required
                  />
                </div>

                {/* ✅ CI con verificación en tiempo real */}
                <div className="space-y-2">
                  <Label htmlFor="ci">Cédula de Identidad *</Label>
                  <div className="relative">
                    <Input
                      id="ci"
                      value={formPaciente.ci}
                      onChange={(e) => {
                        const soloAlfanumerico = e.target.value.replace(
                          /[^a-zA-Z0-9]/g,
                          ""
                        );
                        const limitado = soloAlfanumerico.slice(0, 10);
                        setFormPaciente({ ...formPaciente, ci: limitado });

                        if (limitado.length > 0 && limitado.length < 7) {
                          setCiError(
                            "El CI debe tener entre 7 y 10 caracteres"
                          );
                        } else {
                          setCiError(null);
                        }
                      }}
                      placeholder="Entre 7 y 10 caracteres"
                      maxLength={10}
                      required
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
                      formPaciente.ci.length >= 7 &&
                      formPaciente.ci.length <= 10 && (
                        <div className="absolute right-3 top-2.5">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                  </div>

                  {ciError && (
                    <p className="text-sm text-red-500">{ciError}</p>
                  )}

                  {ciExists && ciExistingPatient && (
                    <p className="text-sm text-red-500">
                      El CI ya está registrado para:{" "}
                      <strong>{ciExistingPatient.nombre_completo}</strong>
                    </p>
                  )}

                  {!ciExists &&
                    formPaciente.ci.length >= 7 &&
                    formPaciente.ci.length <= 10 &&
                    !ciChecking &&
                    formPaciente.ci !== originalCiRef.current && (
                      <p className="text-sm text-green-600">CI disponible</p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={formPaciente.telefono}
                    onChange={(e) => {
                      const numero = e.target.value.replace(/[^\d+]/g, "");
                      setFormPaciente({
                        ...formPaciente,
                        telefono: numero,
                      });
                    }}
                    placeholder="+59175991320"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    value={formPaciente.correo}
                    onChange={(e) =>
                      setFormPaciente({
                        ...formPaciente,
                        correo: e.target.value,
                      })
                    }
                    placeholder="Correo del paciente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={formPaciente.fecha_nacimiento}
                    onChange={(e) =>
                      setFormPaciente({
                        ...formPaciente,
                        fecha_nacimiento: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formPaciente.direccion}
                    onChange={(e) =>
                      setFormPaciente({
                        ...formPaciente,
                        direccion: e.target.value,
                      })
                    }
                    placeholder="Dirección del paciente"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={ciExists || ciChecking}
                >
                  Actualizar Paciente
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-medical-light bg-opacity-30 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-medical-dark" />
              <CardTitle className="text-lg sm:text-xl">
                Pacientes del Sistema
              </CardTitle>
            </div>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* ====== VISTA MÓVIL (cards) ====== */}
          <div className="md:hidden p-3 sm:p-4 space-y-3">
            {loading ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                Cargando pacientes...
              </div>
            ) : pacientes.length > 0 ? (
              pacientes.map((paciente) => (
                <PacienteCard
                  key={paciente.idpaciente}
                  paciente={paciente}
                  calcularDiasTranscurridos={calcularDiasTranscurridos}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleDeletePaciente}
                  onWhatsApp={handleWhatsAppClick}
                />
              ))
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No se encontraron pacientes con los filtros aplicados.
              </div>
            )}
          </div>

          {/* ====== VISTA DESKTOP (tabla) ====== */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Última Consulta</TableHead>
                  <TableHead>Fecha de Nacimiento</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Cargando pacientes...
                    </TableCell>
                  </TableRow>
                ) : pacientes.length > 0 ? (
                  pacientes.map((paciente) => (
                    <TableRow key={paciente.idpaciente}>
                      <TableCell className="font-medium">
                        {paciente.nombre_completo}
                      </TableCell>
                      <TableCell>{paciente.ci}</TableCell>
                      <TableCell>{paciente.telefono}</TableCell>
                      <TableCell>
                        {calcularDiasTranscurridos(paciente.ultima_consulta)}
                      </TableCell>
                      <TableCell>
                        {paciente.fecha_nacimiento
                          ? new Date(
                              paciente.fecha_nacimiento
                            ).toLocaleDateString()
                          : "Sin fecha"}
                      </TableCell>
                      <TableCell>
                        {paciente.direccion || "Sin dirección"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#25D366] hover:text-[#128C7E] hover:bg-[#25D366]/10"
                          onClick={() => handleWhatsAppClick(paciente.telefono)}
                          aria-label="Contactar por WhatsApp"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(paciente)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Está seguro que desea eliminar este paciente?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El paciente{" "}
                                  <span className="font-semibold">
                                    {paciente.nombre_completo}
                                  </span>{" "}
                                  será eliminado permanentemente del sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeletePaciente(paciente.idpaciente)
                                  }
                                  className="bg-red-500 text-white hover:bg-red-600"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No se encontraron pacientes con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ====== PAGINACIÓN ====== */}
          {pagination.totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-4 border-t">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Mostrando{" "}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * pagination.limit + 1}
                </span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                de <span className="font-medium">{pagination.total}</span>{" "}
                pacientes
              </div>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1">
                    Anterior
                  </span>
                </Button>

                <div className="hidden sm:flex items-center gap-1">
                  {getPageNumbers().map((pageNum, idx) =>
                    typeof pageNum === "number" ? (
                      <Button
                        key={idx}
                        variant={
                          pageNum === pagination.currentPage
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        disabled={loading}
                        className="min-w-[36px]"
                      >
                        {pageNum}
                      </Button>
                    ) : (
                      <span key={idx} className="px-2 text-muted-foreground">
                        {pageNum}
                      </span>
                    )
                  )}
                </div>

                <div className="sm:hidden text-sm text-muted-foreground px-2">
                  Página{" "}
                  <span className="font-medium">
                    {pagination.currentPage}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium">{pagination.totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  <span className="sr-only sm:not-sr-only sm:mr-1">
                    Siguiente
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ListaPacientes;