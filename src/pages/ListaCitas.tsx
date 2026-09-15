import { useEffect, useState } from "react";
import {
  CalendarClock,
  CreditCard,
  MoreVertical,
  Search,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import {
  fetchCitas,
  updateEstadoCita,
  deleteCita,
  procesarPago,
  fetchCitasCompletadas,
  fetchServicios,
  ExportarCitasParams,
  CitaExportacion,
} from "@/api/listacitasapi";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { exportarPDF } from "./pdfcitas";

interface Cita {
  idcita: number;
  paciente: string;
  doctor: string;
  servicio: string;
  telefono: string;
  fecha: string;
  hora: string;
  precio: number;
  estado: EstadoCita;
  fechaSimple?: string;
  fechaOriginal?: string;
  fechaObjeto?: Date;
}

type EstadoCita =
  | "pendiente"
  | "en consulta"
  | "completada"
  | "En sala"
  | "cancelada";

const estadoVariantes: Record<EstadoCita, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  "en consulta": "bg-blue-100 text-blue-800 hover:bg-blue-200",
  completada: "bg-green-100 text-green-800 hover:bg-green-200",
  "En sala": "bg-purple-100 text-purple-800 hover:bg-purple-200",
  cancelada: "bg-red-100 text-red-800 hover:bg-red-200",
};

const estadoLabel: Record<EstadoCita, string> = {
  pendiente: "Pendiente",
  "en consulta": "En Consulta",
  completada: "Completada",
  "En sala": "En sala",
  cancelada: "Cancelada",
};

const estadoANumero: Record<EstadoCita, number> = {
  pendiente: 0,
  "en consulta": 1,
  completada: 2,
  "En sala": 4,
  cancelada: 3,
};

const mapearEstado = (estadoNumerico: number): EstadoCita => {
  switch (estadoNumerico) {
    case 0:
      return "pendiente";
    case 1:
      return "en consulta";
    case 2:
      return "completada";
    case 3:
      return "cancelada";
    case 4:
      return "En sala";
    default:
      return "pendiente";
  }
};

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

interface Servicio {
  idservicio: number;
  nombre: string;
  precio: number;
}

/** Card de una cita para vista móvil */
const CitaCard = ({
  cita,
  onWhatsApp,
  onCambiarEstado,
  onCancelar,
}: {
  cita: Cita;
  onWhatsApp: (cita: Cita) => void;
  onCambiarEstado: (id: number, estado: EstadoCita) => void;
  onCancelar: (cita: Cita) => void;
}) => (
  <Card className="shadow-sm border border-border/60">
    <CardContent className="p-4 space-y-3">
      {/* Encabezado: paciente + estado + acciones */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-tight break-words">
            {cita.paciente}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">
            {cita.servicio}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className={estadoVariantes[cita.estado]}>
            {estadoLabel[cita.estado]}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#25D366] hover:text-[#128C7E] hover:bg-[#25D366]/10"
            onClick={() => onWhatsApp(cita)}
            aria-label="WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onCambiarEstado(cita.idcita, "pendiente")}
              >
                Marcar como pendiente
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onCambiarEstado(cita.idcita, "En sala")}
              >
                Marcar como en sala
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onCambiarEstado(cita.idcita, "en consulta")}
              >
                Marcar como en consulta
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={() => onCancelar(cita)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Cancelar Cita
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Detalles */}
      <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Doctor</span>
          <span className="font-medium text-right break-words">
            {cita.doctor}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Fecha</span>
          <span className="font-medium text-right">{cita.fechaSimple}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Hora</span>
          <span className="font-medium text-right">{cita.hora}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Teléfono</span>
          <span className="font-medium text-right break-all">
            {cita.telefono}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Precio</span>
          <span className="font-semibold text-right">Bs.{cita.precio}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ListaCitas = () => {
  const [todasLasCitas, setTodasLasCitas] = useState<Cita[]>([]);
  const [citasFiltradas, setCitasFiltradas] = useState<Cita[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [citaActual, setCitaActual] = useState<Cita | null>(null);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [citaToDelete, setCitaToDelete] = useState<Cita | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ordenarPor, setOrdenarPor] = useState<string | null>(null);
  const [ordenDireccion, setOrdenDireccion] = useState<"asc" | "desc">("asc");
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfDay(new Date()));
  const [fechaFin, setFechaFin] = useState<Date>(endOfDay(new Date()));
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<string>("todos");
  const [doctores, setDoctores] = useState<string[]>([]);

  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [exportFechaInicio, setExportFechaInicio] = useState<Date>(
    startOfDay(new Date())
  );
  const [exportFechaFin, setExportFechaFin] = useState<Date>(
    endOfDay(new Date())
  );
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    number[]
  >([]);
  const [exportTipoReporte, setExportTipoReporte] = useState<string>("todos");
  const [exportEstadoCitas, setExportEstadoCitas] = useState<string[]>([]);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const formatFechaSimple = (fechaISO: string) => {
    return fechaISO.split("T")[0];
  };

  const formatFechaLegible = (fechaISO: string) => {
    try {
      const fechaSimple = formatFechaSimple(fechaISO);
      const [year, month, day] = fechaSimple.split("-");
      const fechaObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      return format(fechaObj, "PPPP", { locale: es });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return fechaISO.split("T")[0];
    }
  };

  useEffect(() => {
    const obtenerCitas = async () => {
      try {
        const [citasBackend, serviciosData] = await Promise.all([
          fetchCitas(),
          fetchServicios(),
        ]);

        const citasMapeadas: Cita[] = citasBackend.map((cita: any) => ({
          ...cita,
          estado: mapearEstado(cita.estado),
          hora: cita.hora.slice(0, 5),
          fechaSimple: formatFechaSimple(cita.fecha),
          fechaOriginal: cita.fecha,
          fechaObjeto: parseISO(cita.fecha.split("T")[0]),
        }));

        const citasFuturas = citasMapeadas.filter(
          (cita) =>
            cita.fechaObjeto && cita.fechaObjeto >= startOfDay(new Date())
        );

        setTodasLasCitas(citasFuturas);

        const doctoresUnicos = Array.from(
          new Set(
            citasFuturas
              .map((cita) => cita.doctor)
              .filter(
                (doctor): doctor is string =>
                  doctor !== undefined && doctor !== null
              )
          )
        );

        setDoctores(doctoresUnicos);
        setServicios(serviciosData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Hubo un error al obtener los datos",
          variant: "destructive",
        });
      }
    };
    obtenerCitas();
  }, []);

  useEffect(() => {
    const filtrarYOrdenarCitas = () => {
      let citasFiltradas = [...todasLasCitas];

      if (busqueda) {
        citasFiltradas = citasFiltradas.filter(
          (cita) =>
            cita.paciente.toLowerCase().includes(busqueda.toLowerCase()) ||
            cita.servicio.toLowerCase().includes(busqueda.toLowerCase()) ||
            cita.telefono.includes(busqueda)
        );
      } else {
        citasFiltradas = citasFiltradas.filter((cita) => {
          const fechaCita = cita.fechaObjeto;
          return isWithinInterval(fechaCita!, {
            start: startOfDay(fechaInicio),
            end: endOfDay(fechaFin),
          });
        });

        if (doctorSeleccionado !== "todos") {
          citasFiltradas = citasFiltradas.filter(
            (cita) => cita.doctor === doctorSeleccionado
          );
        }
      }

      if (ordenarPor) {
        citasFiltradas.sort((a, b) => {
          if (ordenarPor === "fecha") {
            return ordenDireccion === "asc"
              ? (a.fechaObjeto?.getTime() || 0) -
                  (b.fechaObjeto?.getTime() || 0)
              : (b.fechaObjeto?.getTime() || 0) -
                  (a.fechaObjeto?.getTime() || 0);
          }
          if (ordenarPor === "hora") {
            return ordenDireccion === "asc"
              ? a.hora.localeCompare(b.hora)
              : b.hora.localeCompare(a.hora);
          }
          const aValue = a[ordenarPor as keyof Cita];
          const bValue = b[ordenarPor as keyof Cita];
          if (aValue! < bValue!) {
            return ordenDireccion === "asc" ? -1 : 1;
          }
          if (aValue! > bValue!) {
            return ordenDireccion === "asc" ? 1 : -1;
          }
          return 0;
        });
      }

      setCitasFiltradas(citasFiltradas);
    };

    filtrarYOrdenarCitas();
  }, [
    todasLasCitas,
    busqueda,
    fechaInicio,
    fechaFin,
    doctorSeleccionado,
    ordenarPor,
    ordenDireccion,
  ]);

  const handleEliminarCita = async (id: number) => {
    try {
      await deleteCita(id, motivoCancelacion);
      setTodasLasCitas(todasLasCitas.filter((cita) => cita.idcita !== id));
      toast({
        title: "Cita eliminada",
        description: `La cita ha sido cancelada${
          motivoCancelacion ? ` - Motivo: ${motivoCancelacion}` : ""
        }`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al eliminar la cita",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setMotivoCancelacion("");
    }
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: EstadoCita) => {
    try {
      await updateEstadoCita(id, estadoANumero[nuevoEstado]);
      setTodasLasCitas(
        todasLasCitas.map((cita) =>
          cita.idcita === id ? { ...cita, estado: nuevoEstado } : cita
        )
      );
      toast({
        title: "Estado actualizado",
        description: `La cita ahora está ${estadoLabel[nuevoEstado]}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al actualizar el estado de la cita",
        variant: "destructive",
      });
    }
  };

  const handleCompletarPago = async () => {
    if (!citaActual) return;

    try {
      await procesarPago(citaActual.idcita, metodoPago);
      setTodasLasCitas(
        todasLasCitas.map((cita) =>
          cita.idcita === citaActual.idcita
            ? { ...cita, estado: "completada" }
            : cita
        )
      );
      toast({
        title: "Pago procesado",
        description: `Se ha registrado el pago de Bs.${citaActual.precio} por ${citaActual.servicio}`,
      });
      setPagoDialogOpen(false);
      setCitaActual(null);
      setMetodoPago("efectivo");
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al procesar el pago",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppClick = (
    telefono: string,
    paciente: string,
    fecha: string,
    hora: string
  ) => {
    const fechaFormateada = formatFechaLegible(fecha);
    const mensaje = `Hola ${paciente}, te enviamos este mensaje para recordarte que tienes una cita el ${fechaFormateada} a las ${hora}. ¡Ten un buen día!`;
    const mensajeCodificado = encodeURIComponent(mensaje);
    const numeroLimpio = telefono.replace(/[\s-]/g, "");
    window.open(
      `https://wa.me/${numeroLimpio}?text=${mensajeCodificado}`,
      "_blank"
    );
  };

  const navigateToAgendarCita = () => navigate("/agendar-cita");

  const openDeleteDialog = (cita: Cita) => {
    setCitaToDelete(cita);
    setIsDeleteDialogOpen(true);
  };

  const handleExportarPDF = async () => {
    setGenerandoPDF(true);
    try {
      const params: ExportarCitasParams = {
        fechaInicio: exportFechaInicio.toISOString().split("T")[0],
        fechaFin: exportFechaFin.toISOString().split("T")[0],
        servicios:
          serviciosSeleccionados.length > 0 ? serviciosSeleccionados : null,
        tipoReporte: exportTipoReporte,
        estados: exportEstadoCitas.length > 0 ? exportEstadoCitas : null,
      };

      const citasCompletadas: CitaExportacion[] = await fetchCitasCompletadas(
        params
      );

      if (citasCompletadas.length === 0) {
        toast({
          title: "Sin datos",
          description:
            "No hay citas para exportar con los filtros seleccionados",
          variant: "destructive",
        });
        setGenerandoPDF(false);
        return;
      }

      await exportarPDF({
        citasCompletadas,
        exportFechaInicio,
        exportFechaFin,
        tipoReporte: exportTipoReporte,
        onSuccess: () => {
          toast({
            title: "✓ Reporte generado",
            description: "El PDF se ha descargado correctamente",
          });
          setExportSheetOpen(false);
        },
        onError: (error) => {
          console.error("Error al generar PDF:", error);
          toast({
            title: "Error",
            description: "Hubo un error al generar el reporte PDF",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error("Error en exportación:", error);
      toast({
        title: "Error",
        description: "Hubo un error al obtener los datos para el reporte",
        variant: "destructive",
      });
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Lista de Citas
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Gestione todas las citas programadas
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative w-full md:w-64 md:shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar citas..."
              className="pl-8 w-full"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="hidden md:block md:flex-1" />

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Sheet open={exportSheetOpen} onOpenChange={setExportSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Exportar Historial</span>
                  <span className="sm:hidden">Exportar</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-xl overflow-y-auto w-[95vw] sm:w-auto">
                <SheetHeader>
                  <SheetTitle>Exportar Historial de Citas</SheetTitle>
                  <SheetDescription>
                    Configure los filtros para generar el reporte en PDF
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Rango de Fechas</h3>
                    <div className="flex flex-col xs:flex-row items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="justify-start text-left font-normal w-full"
                          >
                            <CalendarClock className="mr-2 h-4 w-4" />
                            {format(exportFechaInicio, "dd/MM/yyyy", {
                              locale: es,
                            })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={exportFechaInicio}
                            onSelect={(date) =>
                              date && setExportFechaInicio(startOfDay(date))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <span className="text-muted-foreground">a</span>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="justify-start text-left font-normal w-full"
                          >
                            <CalendarClock className="mr-2 h-4 w-4" />
                            {format(exportFechaFin, "dd/MM/yyyy", {
                              locale: es,
                            })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={exportFechaFin}
                            onSelect={(date) =>
                              date && setExportFechaFin(endOfDay(date))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Tipo de Reporte</h3>
                    <RadioGroup
                      value={exportTipoReporte}
                      onValueChange={setExportTipoReporte}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="todos" id="todos" />
                        <Label htmlFor="todos" className="cursor-pointer">
                          Todas las citas
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="completadas"
                          id="completadas"
                        />
                        <Label
                          htmlFor="completadas"
                          className="cursor-pointer"
                        >
                          Solo citas completadas
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="canceladas" id="canceladas" />
                        <Label htmlFor="canceladas" className="cursor-pointer">
                          Solo citas canceladas
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">
                      Filtrar por Servicios
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {servicios.map((servicio) => (
                        <div
                          key={servicio.idservicio}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`servicio-${servicio.idservicio}`}
                            checked={serviciosSeleccionados.includes(
                              servicio.idservicio
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setServiciosSeleccionados([
                                  ...serviciosSeleccionados,
                                  servicio.idservicio,
                                ]);
                              } else {
                                setServiciosSeleccionados(
                                  serviciosSeleccionados.filter(
                                    (id) => id !== servicio.idservicio
                                  )
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`servicio-${servicio.idservicio}`}
                            className="cursor-pointer text-sm flex-1"
                          >
                            {servicio.nombre} (Bs.{servicio.precio})
                          </Label>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setServiciosSeleccionados([])}
                      className="text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Limpiar selección
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Estados de Citas</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(estadoLabel).map(([key, label]) => (
                        <div
                          key={key}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`estado-${key}`}
                            checked={exportEstadoCitas.includes(key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setExportEstadoCitas([
                                  ...exportEstadoCitas,
                                  key,
                                ]);
                              } else {
                                setExportEstadoCitas(
                                  exportEstadoCitas.filter(
                                    (estado) => estado !== key
                                  )
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`estado-${key}`}
                            className="cursor-pointer text-sm flex-1"
                          >
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <SheetFooter className="mt-6 flex-col xs:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setExportSheetOpen(false)}
                    className="w-full xs:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleExportarPDF}
                    className="bg-medical-dark hover:bg-medical-dark/90 w-full xs:w-auto"
                    disabled={generandoPDF}
                  >
                    {generandoPDF ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generar PDF
                      </>
                    )}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Button
              onClick={navigateToAgendarCita}
              className="w-full md:w-auto"
            >
              Nueva Cita
            </Button>
          </div>
        </div>
      </div>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-medical-light bg-opacity-30 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <CalendarClock className="h-5 w-5 mr-2 text-medical-dark shrink-0" />
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Citas Programadas
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {busqueda
                    ? `Mostrando resultados para "${busqueda}"`
                    : doctorSeleccionado === "todos"
                    ? "Mostrando todas las citas futuras"
                    : `Mostrando citas del Dr. ${doctorSeleccionado}`}
                  {!busqueda &&
                    ` - ${format(fechaInicio, "dd/MM/yyyy", {
                      locale: es,
                    })} a ${format(fechaFin, "dd/MM/yyyy", { locale: es })}`}
                  {!busqueda && isSameDay(fechaInicio, fechaFin) && " (Hoy)"}
                </CardDescription>
              </div>
            </div>

            {!busqueda && (
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="justify-start text-left font-normal text-sm flex-1 md:flex-none"
                      >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        {format(fechaInicio, "dd/MM", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fechaInicio}
                        onSelect={(date) => {
                          if (date) {
                            setFechaInicio(startOfDay(date));
                            if (date > fechaFin) {
                              setFechaFin(endOfDay(date));
                            }
                          }
                        }}
                        initialFocus
                        disabled={(date) => date < startOfDay(new Date())}
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-muted-foreground">-</span>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="justify-start text-left font-normal text-sm flex-1 md:flex-none"
                      >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        {format(fechaFin, "dd/MM", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fechaFin}
                        onSelect={(date) =>
                          date && setFechaFin(endOfDay(date))
                        }
                        initialFocus
                        disabled={(date) =>
                          date < startOfDay(fechaInicio) ||
                          date < startOfDay(new Date())
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Select
                  value={doctorSeleccionado}
                  onValueChange={setDoctorSeleccionado}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Todos los doctores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los doctores</SelectItem>
                    {doctores.map((doctor) => (
                      <SelectItem key={doctor} value={doctor}>
                        {doctor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* ====== VISTA MÓVIL (cards) ====== */}
          <div className="md:hidden p-3 sm:p-4 space-y-3">
            {citasFiltradas.length > 0 ? (
              citasFiltradas.map((cita) => (
                <CitaCard
                  key={cita.idcita}
                  cita={cita}
                  onWhatsApp={(c) =>
                    handleWhatsAppClick(
                      c.telefono,
                      c.paciente,
                      c.fechaOriginal || c.fecha,
                      c.hora
                    )
                  }
                  onCambiarEstado={handleCambiarEstado}
                  onCancelar={openDeleteDialog}
                />
              ))
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No se encontraron citas con los filtros aplicados.
              </div>
            )}
          </div>

          {/* ====== VISTA DESKTOP (tabla) ====== */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (ordenarPor === "paciente") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("paciente");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Paciente
                      {ordenarPor === "paciente" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (ordenarPor === "doctor") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("doctor");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Doctor
                      {ordenarPor === "doctor" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (ordenarPor === "fecha") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("fecha");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Fecha
                      {ordenarPor === "fecha" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (ordenarPor === "hora") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("hora");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Hora
                      {ordenarPor === "hora" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (ordenarPor === "servicio") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("servicio");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Servicio
                      {ordenarPor === "servicio" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (ordenarPor === "precio") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("precio");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Precio
                      {ordenarPor === "precio" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citasFiltradas.length > 0 ? (
                  citasFiltradas.map((cita) => (
                    <TableRow key={cita.idcita} className="group">
                      <TableCell className="font-medium">
                        {cita.paciente}
                      </TableCell>
                      <TableCell>{cita.doctor}</TableCell>
                      <TableCell>{cita.fechaSimple}</TableCell>
                      <TableCell>{cita.hora}</TableCell>
                      <TableCell>{cita.telefono}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#25D366] hover:text-[#128C7E] hover:bg-[#25D366]/10"
                          onClick={() =>
                            handleWhatsAppClick(
                              cita.telefono,
                              cita.paciente,
                              cita.fechaOriginal || cita.fecha,
                              cita.hora
                            )
                          }
                          aria-label="Enviar recordatorio por WhatsApp"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                        </Button>
                      </TableCell>
                      <TableCell>{cita.servicio}</TableCell>
                      <TableCell>Bs.{cita.precio}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={estadoVariantes[cita.estado]}
                        >
                          {estadoLabel[cita.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                handleCambiarEstado(cita.idcita, "pendiente")
                              }
                            >
                              Marcar como pendiente
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                handleCambiarEstado(cita.idcita, "En sala")
                              }
                            >
                              Marcar como en sala
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                handleCambiarEstado(cita.idcita, "en consulta")
                              }
                            >
                              Marcar como en consulta
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={() => openDeleteDialog(cita)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Cancelar Cita
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      No se encontraron citas con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar/cancelar cita */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setMotivoCancelacion("");
          }
        }}
      >
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Cita</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea cancelar esta cita? Esta acción cambiará el
              estado a "Cancelada".
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Paciente:</p>
                  <p className="text-base sm:text-lg font-semibold break-words">
                    {citaToDelete?.paciente}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Fecha y Hora:</p>
                  <p className="text-base sm:text-lg font-semibold">
                    {citaToDelete?.fechaSimple} {citaToDelete?.hora}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Doctor:</p>
                  <p className="text-base sm:text-lg font-semibold break-words">
                    {citaToDelete?.doctor}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Servicio:</p>
                  <p className="text-base sm:text-lg font-semibold break-words">
                    {citaToDelete?.servicio}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivoCancelacion">Motivo de cancelación</Label>
              <Textarea
                id="motivoCancelacion"
                placeholder="Ej: Paciente no se presentó, Paciente reprogramó, etc."
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <AlertDialogFooter className="flex-col xs:flex-row gap-2">
            <AlertDialogCancel className="w-full xs:w-auto">
              Mantener cita
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                citaToDelete && handleEliminarCita(citaToDelete.idcita)
              }
              className="bg-red-500 text-white hover:bg-red-600 w-full xs:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cancelar Cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Complete el pago para marcar la cita como completada
            </DialogDescription>
          </DialogHeader>
          {citaActual && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Paciente:</p>
                    <p className="text-base sm:text-lg font-semibold break-words">
                      {citaActual.paciente}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Servicio:</p>
                    <p className="text-base sm:text-lg font-semibold break-words">
                      {citaActual.servicio}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-medium">
                    Total a pagar:
                  </span>
                  <span className="text-lg sm:text-xl font-bold">
                    Bs.{citaActual.precio}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metodoPago">Método de pago</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={metodoPago === "efectivo" ? "default" : "outline"}
                    className={
                      metodoPago === "efectivo" ? "bg-medical-dark" : ""
                    }
                    onClick={() => setMetodoPago("efectivo")}
                  >
                    Efectivo
                  </Button>
                  <Button
                    type="button"
                    variant={metodoPago === "tarjeta" ? "default" : "outline"}
                    className={
                      metodoPago === "tarjeta" ? "bg-medical-dark" : ""
                    }
                    onClick={() => setMetodoPago("tarjeta")}
                  >
                    Tarjeta
                  </Button>
                  <Button
                    type="button"
                    variant={
                      metodoPago === "transferencia" ? "default" : "outline"
                    }
                    className={
                      metodoPago === "transferencia" ? "bg-medical-dark" : ""
                    }
                    onClick={() => setMetodoPago("transferencia")}
                  >
                    Transferencia
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col xs:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setPagoDialogOpen(false)}
              className="w-full xs:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompletarPago}
              className="bg-medical-dark hover:bg-medical-dark/90 w-full xs:w-auto"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Procesar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListaCitas;