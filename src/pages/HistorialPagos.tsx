import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  History,
  Receipt,
  Search,
  User,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getHistorialPagos, getDoctores } from "@/api/historialPagosApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const metodoPagoLabel: Record<string, string> = {
  Efectivo: "Efectivo",
  QR: "QR",
};

interface Pago {
  idpago: number;
  paciente: string;
  doctor: string;
  fecha: string;
  concepto: string[];
  monto: string;
  metodo_pago: string;
}

interface Doctor {
  idusuario: number;
  nombre_completo: string;
}

/** Card de un pago para vista móvil */
const PagoCard = ({ pago }: { pago: Pago }) => (
  <Card className="shadow-sm border border-border/60">
    <CardContent className="p-4 space-y-3">
      {/* Encabezado: paciente + badge método */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-tight break-words">
            {pago.paciente}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">
            {pago.doctor}
          </p>
        </div>

        <Badge
          variant="outline"
          className={
            pago.metodo_pago === "Efectivo"
              ? "border-green-100 bg-green-50 text-green-800 shrink-0"
              : "border-blue-100 bg-blue-50 text-blue-800 shrink-0"
          }
        >
          {metodoPagoLabel[pago.metodo_pago] || pago.metodo_pago}
        </Badge>
      </div>

      {/* Detalles */}
      <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Fecha</span>
          <span className="font-medium text-right">
            {format(new Date(pago.fecha), "PP", { locale: es })}
          </span>
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Concepto</span>
          <span className="font-medium text-right break-words">
            {Array.isArray(pago.concepto) ? (
              <ul className="list-none">
                {pago.concepto.map((servicio, index) => (
                  <li key={index}>{servicio}</li>
                ))}
              </ul>
            ) : (
              pago.concepto
            )}
          </span>
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Monto</span>
          <span className="font-semibold text-right">
            Bs.{parseFloat(pago.monto).toLocaleString()}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const HistorialPagos = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);
  const [ordenarPor, setOrdenarPor] = useState<string | null>(null);
  const [ordenDireccion, setOrdenDireccion] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    document.title = "Historial de Pagos | Sistema de Gestión Médica";
    cargarDoctores();
    cargarPagos();
  }, []);

  useEffect(() => {
    cargarPagos();
  }, [busqueda, fechaInicio, fechaFin, doctorSeleccionado]);

  const cargarDoctores = async () => {
    try {
      const datos = await getDoctores();
      setDoctores(datos);
    } catch (error) {
      console.error("Error al cargar los doctores:", error);
    }
  };

  const cargarPagos = async () => {
    try {
      const filtros = {
        busqueda,
        fechaInicio,
        fechaFin,
        iddoctor:
          doctorSeleccionado !== "0" ? parseInt(doctorSeleccionado) : undefined,
      };
      const datos = await getHistorialPagos(filtros);
      setPagos(datos);
      setError(null);
    } catch (error) {
      console.error("Error al cargar los pagos:", error);
      setError(
        "No se pudieron cargar los pagos. Verifica la conexión al servidor."
      );
    }
  };

  const filtrarPagos = () => {
    let resultado = pagos;

    if (busqueda) {
      resultado = resultado.filter(
        (p) =>
          p.paciente.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.doctor.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.concepto.some((c) =>
            c.toLowerCase().includes(busqueda.toLowerCase())
          ) ||
          p.monto.includes(busqueda)
      );
    }

    if (fechaInicio) {
      resultado = resultado.filter((p) => new Date(p.fecha) >= fechaInicio);
    }

    if (fechaFin) {
      const finDelDia = new Date(fechaFin);
      finDelDia.setHours(23, 59, 59, 999);
      resultado = resultado.filter((p) => new Date(p.fecha) <= finDelDia);
    }

    if (ordenarPor) {
      resultado.sort((a, b) => {
        const valorA = a[ordenarPor as keyof Pago] || "";
        const valorB = b[ordenarPor as keyof Pago] || "";

        if (valorA < valorB) {
          return ordenDireccion === "asc" ? -1 : 1;
        }
        if (valorA > valorB) {
          return ordenDireccion === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return resultado;
  };

  const totalRecaudado = filtrarPagos().reduce(
    (sum, p) => sum + parseFloat(p.monto),
    0
  );

  const totalEfectivo = filtrarPagos()
    .filter((p) => p.metodo_pago === "Efectivo")
    .reduce((sum, p) => sum + parseFloat(p.monto), 0);

  const totalQR = filtrarPagos()
    .filter((p) => p.metodo_pago === "QR")
    .reduce((sum, p) => sum + parseFloat(p.monto), 0);

  const pagosFiltrados = filtrarPagos();

  const exportToPDF = () => {
    try {
      const doc = new jsPDF("landscape");

      const title = "Historial de Pagos";
      const fechaExportacion = format(new Date(), "dd/MM/yyyy HH:mm", {
        locale: es,
      });

      let fechaSubtitle = "";
      if (fechaInicio && fechaFin) {
        fechaSubtitle = `Desde ${format(fechaInicio, "dd/MM/yyyy", {
          locale: es,
        })} hasta ${format(fechaFin, "dd/MM/yyyy", { locale: es })}`;
      } else if (fechaInicio) {
        fechaSubtitle = `Desde ${format(fechaInicio, "dd/MM/yyyy", {
          locale: es,
        })}`;
      } else if (fechaFin) {
        fechaSubtitle = `Hasta ${format(fechaFin, "dd/MM/yyyy", {
          locale: es,
        })}`;
      }

      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text(title, 14, 20);

      doc.setFontSize(12);
      doc.text(`Generado el: ${fechaExportacion}`, 14, 27);

      if (fechaSubtitle) {
        doc.text(`Rango de fechas: ${fechaSubtitle}`, 14, 32);
      }

      const tableData = pagosFiltrados.map((pago) => [
        pago.paciente,
        pago.doctor,
        format(new Date(pago.fecha), "dd/MM/yyyy", { locale: es }),
        Array.isArray(pago.concepto)
          ? pago.concepto.join(", ")
          : pago.concepto,
        `Bs. ${parseFloat(pago.monto).toLocaleString("es-ES", {
          minimumFractionDigits: 2,
        })}`,
        metodoPagoLabel[pago.metodo_pago] || pago.metodo_pago,
      ]);

      tableData.push([
        "TOTAL",
        "",
        "",
        "",
        `Bs. ${totalRecaudado.toLocaleString("es-ES", {
          minimumFractionDigits: 2,
        })}`,
        "",
      ]);

      const headers = [
        "Paciente",
        "Doctor",
        "Fecha",
        "Concepto",
        "Monto",
        "Método de Pago",
      ];

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 10,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 },
          4: { cellWidth: 25, halign: "right" },
          5: { cellWidth: 25 },
        },
        margin: { left: 14 },
      });

      const fileName = `Historial_Pagos_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert(
        "Ocurrió un error al generar el PDF. Por favor intenta nuevamente."
      );
    }
  };

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Historial de Pagos
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Consulte todos los pagos registrados en el sistema
          </p>
        </div>
      </div>

      {/* Tarjetas de totales: 1 col en móvil, 3 en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
        <Card className="shadow-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recaudado (Filtrado)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Receipt className="h-5 w-5 text-medical-dark mr-2 shrink-0" />
              <div className="text-xl sm:text-2xl font-bold break-all">
                Bs.{totalRecaudado.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total en Efectivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Receipt className="h-5 w-5 text-green-600 mr-2 shrink-0" />
              <div className="text-xl sm:text-2xl font-bold break-all">
                Bs.{totalEfectivo.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total en QR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Receipt className="h-5 w-5 text-blue-600 mr-2 shrink-0" />
              <div className="text-xl sm:text-2xl font-bold break-all">
                Bs.{totalQR.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-medical-light bg-opacity-30 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center">
              <History className="h-5 w-5 mr-2 text-medical-dark shrink-0" />
              <CardTitle className="text-lg sm:text-xl">
                Historial de Pagos Registrados
              </CardTitle>
            </div>

            {/* Filtros: se apilan en móvil, se alinean en desktop */}
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pagos..."
                  className="pl-8 w-full sm:w-[220px]"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:flex sm:flex-row gap-2">
                <Select
                  value={doctorSeleccionado}
                  onValueChange={setDoctorSeleccionado}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 shrink-0" />
                      <SelectValue placeholder="Todos los doctores" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos los doctores</SelectItem>
                    {doctores.map((doctor) => (
                      <SelectItem
                        key={doctor.idusuario}
                        value={doctor.idusuario.toString()}
                      >
                        {doctor.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal sm:w-[140px]",
                          !fechaInicio && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {fechaInicio ? (
                          format(fechaInicio, "PP", { locale: es })
                        ) : (
                          <span>Desde</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fechaInicio}
                        onSelect={setFechaInicio}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal sm:w-[140px]",
                          !fechaFin && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {fechaFin ? (
                          format(fechaFin, "PP", { locale: es })
                        ) : (
                          <span>Hasta</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={fechaFin}
                        onSelect={setFechaFin}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Botón Exportar PDF: visible también en móvil, ancho completo */}
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* ====== VISTA MÓVIL (cards) ====== */}
          <div className="md:hidden p-3 sm:p-4 space-y-3">
            {pagosFiltrados.length > 0 ? (
              pagosFiltrados.map((pago) => (
                <PagoCard key={pago.idpago} pago={pago} />
              ))
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No se encontraron pagos con los filtros aplicados.
              </div>
            )}
          </div>

          {/* ====== VISTA DESKTOP (tabla) ====== */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método de Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosFiltrados.length > 0 ? (
                  pagosFiltrados.map((pago) => (
                    <TableRow key={pago.idpago}>
                      <TableCell className="font-medium">
                        {pago.paciente}
                      </TableCell>
                      <TableCell>{pago.doctor}</TableCell>
                      <TableCell>
                        {format(new Date(pago.fecha), "PP", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {Array.isArray(pago.concepto) ? (
                          <ul>
                            {pago.concepto.map((servicio, index) => (
                              <li key={index}>{servicio}</li>
                            ))}
                          </ul>
                        ) : (
                          <span>{pago.concepto}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        Bs.{parseFloat(pago.monto).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            pago.metodo_pago === "Efectivo"
                              ? "border-green-100 bg-green-50 text-green-800"
                              : "border-blue-100 bg-blue-50 text-blue-800"
                          }
                        >
                          {metodoPagoLabel[pago.metodo_pago] ||
                            pago.metodo_pago}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron pagos con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorialPagos;