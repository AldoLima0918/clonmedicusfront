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
import type { DateRange } from "react-day-picker";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
            {fechaPago(pago.fecha, "PP")}
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
const fechaBolivia = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit"
}).formatToParts(new Date()).filter(p => p.type !== "literal").reduce((a, p) => ({ ...a, [p.type]: p.value }), {} as Record<string, string>);
const hoyBolivia = () => {
  const p = fechaBolivia();
  return `${p.year}-${p.month}-${p.day}`;
};
const fechaLocal = (valor: string) => {
  const [y, m, d] = valor.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
const fechaPago = (valor: string, patron: string) => format(fechaLocal(valor), patron, { locale: es });
const opciones = [
  ["hoy", "Hoy"], ["ayer", "Ayer"], ["semana", "Esta semana"],
  ["mes", "Este mes"], ["mes_pasado", "Mes pasado"],
  ["fecha", "Fecha específica"], ["rango", "Rango de fechas"], ["anio", "Año"]
];

const HistorialPagos = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState("hoy");
  const [diaActual, setDiaActual] = useState(hoyBolivia);
  const [fecha, setFecha] = useState<Date | undefined>(() => fechaLocal(hoyBolivia()));
  const [rango, setRango] = useState<DateRange | undefined>();
  const [anio, setAnio] = useState(() => hoyBolivia().slice(0, 4));
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [mesVisible, setMesVisible] = useState(() => fechaLocal(hoyBolivia()));
  const fechaInicio = periodo === "fecha" ? fecha : periodo === "rango" ? rango?.from : undefined;
  const fechaFin = periodo === "fecha" ? fecha : periodo === "rango" ? rango?.to : undefined;
  const incompleto = !busqueda.trim() && ((periodo === "fecha" && !fecha) || (periodo === "rango" && (!rango?.from || !rango?.to)));
  useEffect(() => {
    const timer = window.setInterval(() => setDiaActual(hoyBolivia()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [paginaEscrita, setPaginaEscrita] = useState("1");

  useEffect(() => {
    setPaginaEscrita(String(pagina));
  }, [pagina]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totales, setTotales] = useState({ recaudado: "0", efectivo: "0", qr: "0" });
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const filtros = () => ({
    busqueda, fechaInicio, fechaFin, periodo, anio: Number(anio),
    iddoctor: doctorSeleccionado !== "0" ? parseInt(doctorSeleccionado) : undefined,
  });
  useEffect(() => {
    document.title = "Historial de Pagos | Sistema de Gestión Médica";
    cargarDoctores();
  }, []);
  useEffect(() => {
    if (incompleto) {
      setPagos([]); setTotal(0); setTotalPaginas(1);
      setTotales({ recaudado: "0", efectivo: "0", qr: "0" });
      setCargando(false); setError(null); return;
    }
    const controller = new AbortController();
    setCargando(true);
    setError(null);
    getHistorialPagos({ ...filtros(), pagina }, controller.signal)
      .then((datos) => {
        if (controller.signal.aborted) return;
        setPagos(datos.pagos);
        setTotal(datos.total);
        setTotalPaginas(datos.totalPaginas);
        setTotales(datos.totales);
        if (datos.pagina !== pagina) setPagina(datos.pagina);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Error al cargar los pagos:", error);
        setPagos([]);
        setTotal(0);
        setTotalPaginas(1);
        setTotales({ recaudado: "0", efectivo: "0", qr: "0" });
        setError("No se pudieron cargar los pagos. Verifica la conexión al servidor.");
      })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [busqueda, fechaInicio, fechaFin, doctorSeleccionado, pagina, periodo, anio, diaActual, incompleto]);
  const cargarDoctores = async () => {
    try { setDoctores(await getDoctores()); }
    catch (error) { console.error("Error al cargar los doctores:", error); }
  };
  const totalRecaudado = Number(totales.recaudado);
  const totalEfectivo = Number(totales.efectivo);
  const totalQR = Number(totales.qr);
  const pagosFiltrados = pagos;
  const exportToPDF = async () => {
    setExportando(true);
    try {
      const reporte = await getHistorialPagos({ ...filtros(), exportar: true });
      const pagosFiltrados: Pago[] = reporte.pagos;
      const totalRecaudado = Number(reporte.totales.recaudado);
      const doc = new jsPDF("landscape");
      const title = "Historial de Pagos";
      const fechaExportacion = new Intl.DateTimeFormat("es-BO", { timeZone: "America/La_Paz", dateStyle: "short", timeStyle: "short" }).format(new Date());
      const fechaSubtitle = busqueda.trim() ? "Todo el historial" : reporte.fechaInicio && reporte.fechaFin ? `${fechaPago(reporte.fechaInicio, "dd/MM/yyyy")} - ${fechaPago(reporte.fechaFin, "dd/MM/yyyy")}` : "";
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
        fechaPago(pago.fecha, "dd/MM/yyyy"),
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
      const fileName = `Historial_Pagos_${hoyBolivia()}_${Date.now()}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert(
        "Ocurrió un error al generar el PDF. Por favor intenta nuevamente."
      );
    } finally {
      setExportando(false);
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
                Bs.{cargando ? "…" : totalRecaudado.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                Bs.{cargando ? "…" : totalEfectivo.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                Bs.{cargando ? "…" : totalQR.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  placeholder="Buscar pagos por nombre/ci de paciente...."
                  title="Buscar por nombre o CI en todo el historial"
                  className="pl-8 w-full sm:w-[400px]"
                  value={busqueda}
                  onChange={(e) => {
                    setPagina(1);
                    setBusqueda(e.target.value);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:flex sm:flex-row gap-2">
                <Select
                  value={doctorSeleccionado}
                  onValueChange={(valor) => { setPagina(1); setDoctorSeleccionado(valor); }}
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
                <Select value={periodo} onValueChange={(v) => { setPagina(1); setPeriodo(v); setCalendarioAbierto(v === "fecha" || v === "rango"); }}>
                  <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{opciones.map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}</SelectContent>
                </Select>
                {periodo === "anio" && <Select value={anio} onValueChange={v => { setPagina(1); setAnio(v); }}>
                  <SelectTrigger className="w-full sm:w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 101 }, (_, i) => Number(diaActual.slice(0, 4)) - i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>}
                {(periodo === "fecha" || periodo === "rango") && <Popover open={calendarioAbierto} onOpenChange={setCalendarioAbierto}>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full sm:w-auto"><CalendarIcon className="mr-2 h-4 w-4" />{periodo === "fecha" ? fecha ? format(fecha, "dd/MM/yyyy") : "Seleccionar fecha" : rango?.from ? `${format(rango.from, "dd/MM/yyyy")} - ${rango.to ? format(rango.to, "dd/MM/yyyy") : "Hasta"}` : "Seleccionar rango"}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="flex gap-2 mb-2">
                      <select aria-label="Mes" className="border rounded p-2" value={mesVisible.getMonth()} onChange={e => setMesVisible(new Date(mesVisible.getFullYear(), Number(e.target.value), 1, 12))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{format(new Date(2026, i, 1), "MMMM", { locale: es })}</option>)}</select>
                      <select aria-label="Año" className="border rounded p-2" value={mesVisible.getFullYear()} onChange={e => setMesVisible(new Date(Number(e.target.value), mesVisible.getMonth(), 1, 12))}>{Array.from({ length: 111 }, (_, i) => Number(diaActual.slice(0, 4)) + 10 - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                    {periodo === "fecha" ? <Calendar mode="single" locale={es} month={mesVisible} onMonthChange={setMesVisible} today={fechaLocal(diaActual)} selected={fecha} onSelect={v => { setPagina(1); setFecha(v); if (v) setCalendarioAbierto(false); }} /> : <>
                      <Calendar mode="range" locale={es} month={mesVisible} onMonthChange={setMesVisible} today={fechaLocal(diaActual)} selected={rango} onSelect={v => { setPagina(1); setRango(v); }} numberOfMonths={1} />
                      <Button variant="outline" onClick={() => { setPagina(1); setRango(undefined); }}>Limpiar</Button>
                      <Button className="ml-2" disabled={!rango?.from || !rango?.to} onClick={() => setCalendarioAbierto(false)}>Aplicar</Button>
                    </>}
                  </PopoverContent>
                </Popover>}
                {/* Botón Exportar PDF: visible también en móvil, ancho completo */}
                <Button
                  onClick={exportToPDF}
                  disabled={exportando || cargando || !!error || incompleto}
                  variant="outline"
                  className="w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Download className="h-4 w-4" />
                  <span>{exportando ? "Exportando..." : "Exportar PDF"}</span>
                </Button>
              </div>
            </div>
          </div>
          {busqueda.trim() && <p className="text-sm text-muted-foreground">Buscando en todo el historial, sin filtro de fechas.</p>}
        </CardHeader>
        <CardContent className="p-0">
          {/* ====== VISTA MÓVIL (cards) ====== */}
          <div className="md:hidden p-3 sm:p-4 space-y-3">
            {cargando ? (
              <div className="p-6 text-center text-muted-foreground">Cargando pagos...</div>
            ) : pagosFiltrados.length > 0 ? (
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
                {cargando ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando pagos...</TableCell></TableRow>
                ) : pagosFiltrados.length > 0 ? (
                  pagosFiltrados.map((pago) => (
                    <TableRow key={pago.idpago}>
                      <TableCell className="font-medium">
                        {pago.paciente}
                      </TableCell>
                      <TableCell>{pago.doctor}</TableCell>
                      <TableCell>
                        {fechaPago(pago.fecha, "PP")}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t p-4">
            <span className="text-sm text-muted-foreground">
              {cargando ? "Cargando..." : total === 0 ? "0 registros" : `Mostrando ${(pagina - 1) * 30 + 1}–${Math.min(pagina * 30, total)} de ${total} pagos`}
            </span>
            <div className="flex flex-wrap justify-center items-center gap-2">
              <Button variant="outline" size="sm" disabled={cargando || pagina <= 1} onClick={() => setPagina(1)}>Primera</Button>
              <Button variant="outline" size="sm" disabled={cargando || pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</Button>
              <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                <Input
                  type="text"
                  inputMode="numeric"
                  aria-label="Ir a la página"
                  className="h-8 w-16 px-1 text-center"
                  value={paginaEscrita}
                  disabled={cargando}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) setPaginaEscrita(e.target.value);
                  }}
                  onBlur={() => {
                    const numero = Number(paginaEscrita);
                    const destino = paginaEscrita.trim() !== "" && Number.isSafeInteger(numero)
                      ? Math.min(totalPaginas, Math.max(1, numero))
                      : pagina;
                    setPaginaEscrita(String(destino));
                    setPagina(destino);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                />
                <span>/ {totalPaginas}</span>
              </div>
              <Button variant="outline" size="sm" disabled={cargando || pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</Button>
              <Button variant="outline" size="sm" disabled={cargando || pagina >= totalPaginas} onClick={() => setPagina(totalPaginas)}>Última</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default HistorialPagos;
