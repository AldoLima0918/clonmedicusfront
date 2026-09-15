import { useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Wallet,
  Plus,
  Calculator,
  Eye,
  Search,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import {
  getMovimientosCaja,
  addMovimientoCaja,
  getUltimoSaldoCaja,
} from "@/api/controlcajaapi";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Movimiento {
  idmovimiento: number;
  idcaja: number;
  tipo_movimiento: number;
  monto: string;
  concepto: string;
  justificacion: string | null;
  fecha: string;
}

/** Card de un movimiento para vista móvil */
const MovimientoCard = ({ movimiento }: { movimiento: Movimiento }) => {
  const esIngreso = movimiento.tipo_movimiento === 1;

  return (
    <Card className="shadow-sm border border-border/60">
      <CardContent className="p-4 space-y-3">
        {/* Encabezado: concepto + badge tipo */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base leading-tight break-words">
              {movimiento.concepto}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(movimiento.fecha), "PPp", { locale: es })}
            </p>
          </div>

          <Badge
            variant="outline"
            className={
              esIngreso
                ? "bg-green-100 text-green-800 hover:bg-green-200 shrink-0"
                : "bg-red-100 text-red-800 hover:bg-red-200 shrink-0"
            }
          >
            {esIngreso ? "Ingreso" : "Egreso"}
          </Badge>
        </div>

        {/* Monto destacado */}
        <div
          className={`text-lg font-bold ${
            esIngreso ? "text-green-600" : "text-red-600"
          }`}
        >
          {esIngreso ? "+" : "-"}Bs.
          {parseFloat(movimiento.monto).toFixed(2)}
        </div>

        {/* Justificación */}
        <div className="pt-2 border-t space-y-1">
          <p className="text-xs text-muted-foreground">Justificación</p>
          <p className="text-sm break-words">
            {movimiento.justificacion || "Sin justificación"}
          </p>
        </div>

        {/* Botón ver detalle */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver detalle
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="break-words">
                {movimiento.concepto}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <p className="text-sm font-medium mb-1">Fecha y hora:</p>
                <p>
                  {format(new Date(movimiento.fecha), "PPpp", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">
                  Tipo de movimiento:
                </p>
                <Badge
                  className={
                    esIngreso
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {esIngreso ? "Ingreso" : "Egreso"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Monto:</p>
                <p
                  className={
                    esIngreso
                      ? "text-green-600 font-bold"
                      : "text-red-600 font-bold"
                  }
                >
                  {esIngreso ? "+" : "-"}Bs.
                  {parseFloat(movimiento.monto).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Justificación:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {movimiento.justificacion || "Sin justificación"}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

const ControlCaja = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [movimientosFiltrados, setMovimientosFiltrados] = useState<
    Movimiento[]
  >([]);
  const [busqueda, setBusqueda] = useState("");
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: "ingreso",
    monto: "",
    concepto: "",
    justificacion: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [ultimoSaldo, setUltimoSaldo] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMovimientosCaja();
        setMovimientos(data);
        filtrarMovimientos(data, new Date(), new Date());

        const saldo = await getUltimoSaldoCaja();
        setUltimoSaldo(Math.max(0, parseFloat(saldo.monto_cierre)));
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los movimientos de caja",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    document.title = "Control de Caja | Sistema de Gestión Médica";
  }, []);

  const filtrarMovimientos = (movs: Movimiento[], start: Date, end: Date) => {
    let filtered = movs.filter((m) => {
      const fechaMovimiento = new Date(m.fecha);
      return (
        fechaMovimiento >= startOfDay(start) && fechaMovimiento <= endOfDay(end)
      );
    });

    if (busqueda) {
      filtered = filtered.filter(
        (m) =>
          m.concepto.toLowerCase().includes(busqueda.toLowerCase()) ||
          (m.justificacion &&
            m.justificacion.toLowerCase().includes(busqueda.toLowerCase())) ||
          m.monto.includes(busqueda)
      );
    }

    setMovimientosFiltrados(filtered);
  };

  useEffect(() => {
    filtrarMovimientos(movimientos, startDate, endDate);
  }, [startDate, endDate, busqueda, movimientos]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNuevoMovimiento((prev) => ({ ...prev, [name]: value }));
  };

  const handleTipoChange = (tipo: "ingreso" | "egreso") => {
    setNuevoMovimiento((prev) => ({ ...prev, tipo }));
  };

  const handleSubmitMovimiento = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    if (
      !nuevoMovimiento.monto ||
      !nuevoMovimiento.concepto ||
      !nuevoMovimiento.justificacion
    ) {
      toast({
        title: "Información incompleta",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const monto = parseFloat(nuevoMovimiento.monto);
    if (monto <= 0) {
      toast({
        title: "Monto inválido",
        description: "El monto debe ser mayor a cero",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (nuevoMovimiento.tipo === "egreso" && monto > ultimoSaldo) {
      toast({
        title: "Saldo insuficiente",
        description: `No puede realizar un egreso mayor al saldo disponible (Bs.${ultimoSaldo.toFixed(
          2
        )})`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const movimiento = {
        idcaja: 1,
        tipo_movimiento: nuevoMovimiento.tipo === "ingreso" ? 1 : 2,
        monto: monto,
        concepto: nuevoMovimiento.concepto,
        justificacion: nuevoMovimiento.justificacion,
        idempleado: userId,
      };

      const addedMovimiento = await addMovimientoCaja(movimiento);
      setMovimientos([addedMovimiento, ...movimientos]);
      setDialogOpen(false);
      setNuevoMovimiento({
        tipo: "ingreso",
        monto: "",
        concepto: "",
        justificacion: "",
      });

      const saldo = await getUltimoSaldoCaja();
      setUltimoSaldo(Math.max(0, parseFloat(saldo.monto_cierre)));

      toast({
        title: `${
          nuevoMovimiento.tipo === "ingreso" ? "Ingreso" : "Egreso"
        } registrado`,
        description: `Se ha registrado un ${
          nuevoMovimiento.tipo
        } de Bs.${movimiento.monto.toFixed(2)} por concepto de ${
          movimiento.concepto
        }`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalIngresos = movimientosFiltrados
    .filter((m) => m.tipo_movimiento === 1)
    .reduce((sum, m) => sum + parseFloat(m.monto), 0);

  const totalEgresos = movimientosFiltrados
    .filter((m) => m.tipo_movimiento === 2)
    .reduce((sum, m) => sum + parseFloat(m.monto), 0);

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Control de Caja
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Gestión de ingresos y egresos de efectivo en caja
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Registrar Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmitMovimiento}>
              <DialogHeader>
                <DialogTitle>Registrar Movimiento en Caja</DialogTitle>
                <DialogDescription>
                  Complete la información para registrar un ingreso o egreso
                  de caja.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => handleTipoChange("ingreso")}
                    className={`flex-1 ${
                      nuevoMovimiento.tipo === "ingreso"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <ArrowUpIcon className="mr-2 h-4 w-4" />
                    Ingreso
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleTipoChange("egreso")}
                    className={`flex-1 ${
                      nuevoMovimiento.tipo === "egreso"
                        ? "bg-destructive hover:bg-destructive/90"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <ArrowDownIcon className="mr-2 h-4 w-4" />
                    Egreso
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto (Bs.)</Label>
                  <Input
                    id="monto"
                    name="monto"
                    placeholder="0.00"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={nuevoMovimiento.monto}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="concepto">Concepto</Label>
                  <Input
                    id="concepto"
                    name="concepto"
                    placeholder="Ej: Depósito inicial, Compra de materiales, etc."
                    value={nuevoMovimiento.concepto}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="justificacion">Justificación o notas</Label>
                  <Textarea
                    id="justificacion"
                    name="justificacion"
                    placeholder="Describa el motivo del movimiento..."
                    value={nuevoMovimiento.justificacion}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                {nuevoMovimiento.tipo === "egreso" && (
                  <div className="text-sm text-muted-foreground">
                    Saldo disponible: Bs.{ultimoSaldo.toFixed(2)}
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col xs:flex-row gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      className={`w-full xs:w-auto ${
                        nuevoMovimiento.tipo === "ingreso"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-destructive hover:bg-destructive/90"
                      }`}
                      disabled={
                        !nuevoMovimiento.monto ||
                        !nuevoMovimiento.concepto ||
                        !nuevoMovimiento.justificacion ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        "Procesando..."
                      ) : nuevoMovimiento.tipo === "ingreso" ? (
                        <>
                          <ArrowUpIcon className="mr-2 h-4 w-4" />
                          Registrar Ingreso
                        </>
                      ) : (
                        <>
                          <ArrowDownIcon className="mr-2 h-4 w-4" />
                          Registrar Egreso
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[95vw] max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ¿Está seguro que desea registrar este{" "}
                        {nuevoMovimiento.tipo}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {nuevoMovimiento.tipo === "egreso" && (
                          <span className="block mb-2">
                            Saldo disponible: Bs.{ultimoSaldo.toFixed(2)}
                          </span>
                        )}
                        Se registrará un {nuevoMovimiento.tipo} de Bs.{" "}
                        {parseFloat(nuevoMovimiento.monto).toFixed(2)} por
                        concepto de{" "}
                        <span className="font-semibold">
                          {nuevoMovimiento.concepto}
                        </span>
                        .
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                      <AlertDialogCancel
                        disabled={isSubmitting}
                        className="w-full xs:w-auto"
                      >
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSubmitMovimiento}
                        className={`w-full xs:w-auto ${
                          nuevoMovimiento.tipo === "ingreso"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-destructive hover:bg-destructive/90"
                        }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Procesando..." : "Confirmar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tarjetas de resumen: 1 col en móvil, 3 en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
        <Card className="shadow-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Actual en Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wallet className="h-5 w-5 text-medical-dark mr-2 shrink-0" />
              <div className="text-xl sm:text-2xl font-bold text-green-600 break-all">
                Bs.{ultimoSaldo.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ingresos
            </CardTitle>
            <CardDescription className="text-xs">
              {format(startDate, "PPP", { locale: es })} -{" "}
              {format(endDate, "PPP", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowUpIcon className="h-5 w-5 text-green-600 mr-2 shrink-0" />
              <div className="text-xl sm:text-2xl font-bold text-green-600 break-all">
                Bs.{totalIngresos.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Egresos
            </CardTitle>
            <CardDescription className="text-xs">
              {format(startDate, "PPP", { locale: es })} -{" "}
              {format(endDate, "PPP", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowDownIcon className="h-5 w-5 text-red-600 mr-2 shrink-0" />
              <div className="text-xl sm:text-2xl font-bold text-red-600 break-all">
                Bs.{totalEgresos.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-medical-light bg-opacity-30 p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-medical-dark shrink-0" />
              <CardTitle className="text-lg sm:text-xl">
                Movimientos de Caja
              </CardTitle>
            </div>

            {/* Filtros: apilados en móvil, en fila en desktop */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <div className="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center">
                <div className="flex gap-2 items-center flex-1">
                  <Label
                    htmlFor="start-date"
                    className="text-sm shrink-0 w-14"
                  >
                    Desde:
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="flex-1 justify-start text-left font-normal text-sm"
                      >
                        {startDate ? (
                          format(startDate, "PPP", { locale: es })
                        ) : (
                          <span>Seleccione fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2 items-center flex-1">
                  <Label
                    htmlFor="end-date"
                    className="text-sm shrink-0 w-14"
                  >
                    Hasta:
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="flex-1 justify-start text-left font-normal text-sm"
                      >
                        {endDate ? (
                          format(endDate, "PPP", { locale: es })
                        ) : (
                          <span>Seleccione fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                        locale={es}
                        fromDate={startDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="relative w-full sm:w-[250px] sm:ml-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar movimientos..."
                  className="pl-8 w-full"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* ====== VISTA MÓVIL (cards) ====== */}
          <div className="md:hidden p-3 sm:p-4 space-y-3">
            {movimientosFiltrados.length > 0 ? (
              movimientosFiltrados.map((movimiento) => (
                <MovimientoCard
                  key={movimiento.idmovimiento}
                  movimiento={movimiento}
                />
              ))
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No se encontraron movimientos.
              </div>
            )}
          </div>

          {/* ====== VISTA DESKTOP (tabla) ====== */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Justificación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosFiltrados.length > 0 ? (
                  movimientosFiltrados.map((movimiento) => (
                    <TableRow key={movimiento.idmovimiento} className="group">
                      <TableCell>
                        {format(new Date(movimiento.fecha), "PPp", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            movimiento.tipo_movimiento === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                        >
                          {movimiento.tipo_movimiento === 1
                            ? "Ingreso"
                            : "Egreso"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movimiento.concepto}
                      </TableCell>
                      <TableCell
                        className={
                          movimiento.tipo_movimiento === 1
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {movimiento.tipo_movimiento === 1 ? "+" : "-"}Bs.
                        {parseFloat(movimiento.monto).toFixed(2)}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        <div className="flex items-center justify-between">
                          <span className="truncate">
                            {movimiento.justificacion || "Sin justificación"}
                          </span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="break-words">
                                  {movimiento.concepto}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div>
                                  <p className="text-sm font-medium mb-1">
                                    Fecha y hora:
                                  </p>
                                  <p>
                                    {format(
                                      new Date(movimiento.fecha),
                                      "PPpp",
                                      { locale: es }
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">
                                    Tipo de movimiento:
                                  </p>
                                  <Badge
                                    className={
                                      movimiento.tipo_movimiento === 1
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {movimiento.tipo_movimiento === 1
                                      ? "Ingreso"
                                      : "Egreso"}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">
                                    Monto:
                                  </p>
                                  <p
                                    className={
                                      movimiento.tipo_movimiento === 1
                                        ? "text-green-600 font-bold"
                                        : "text-red-600 font-bold"
                                    }
                                  >
                                    {movimiento.tipo_movimiento === 1
                                      ? "+"
                                      : "-"}
                                    Bs.
                                    {parseFloat(movimiento.monto).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">
                                    Justificación:
                                  </p>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                    {movimiento.justificacion ||
                                      "Sin justificación"}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No se encontraron movimientos.
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

export default ControlCaja;