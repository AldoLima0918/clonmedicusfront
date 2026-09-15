import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Search,
  Edit2,
  CalendarPlus,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { fetchTransacciones, updateTransaccion } from "@/api/cobrosapi";
import { useAuth } from "@/contexts/AuthContext";

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO: "Efectivo",
  QR: "QR",
};

/** Card de una transacción para vista móvil */
const TransaccionCard = ({
  transaccion,
  onProcesarPago,
  onAgendarCita,
}: {
  transaccion: any;
  onProcesarPago: (t: any) => void;
  onAgendarCita: (t: any) => void;
}) => {
  const esPagado = transaccion.estado === 1;

  return (
    <Card className="shadow-sm border border-border/60">
      <CardContent className="p-4 space-y-3">
        {/* Encabezado: paciente + estado */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base leading-tight break-words">
              {transaccion.paciente}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(transaccion.fecha), "PP", { locale: es })}
            </p>
          </div>

          <Badge
            variant={esPagado ? "default" : "outline"}
            className={
              esPagado
                ? "bg-green-100 text-green-800 hover:bg-green-200 shrink-0"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 shrink-0"
            }
          >
            {esPagado ? "Pagado" : "Pendiente"}
          </Badge>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Concepto</span>
            <span className="font-medium text-right break-words">
              {Array.isArray(transaccion.concepto) ? (
                <ul className="list-none">
                  {transaccion.concepto.map((servicio: string, index: number) => (
                    <li key={index}>{servicio}</li>
                  ))}
                </ul>
              ) : (
                transaccion.concepto
              )}
            </span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Monto</span>
            <span className="font-semibold text-right">
              Bs.
              {parseFloat(transaccion.monto).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Método</span>
            <span className="font-medium text-right">
              {transaccion.metodoPago ? (
                metodoPagoLabel[transaccion.metodoPago]
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col xs:flex-row gap-2 pt-2 border-t">
          {!esPagado && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onProcesarPago(transaccion)}
              className="w-full xs:flex-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Procesar Pago
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAgendarCita(transaccion)}
            className="w-full xs:flex-1 text-green-600 hover:text-green-800 hover:bg-green-50"
            title="Agendar cita para este paciente"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Agendar Cita
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Cobros = () => {
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("0");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transaccionEditar, setTransaccionEditar] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [ordenarPor, setOrdenarPor] = useState<string | null>(null);
  const [ordenDireccion, setOrdenDireccion] = useState<"asc" | "desc">("asc");
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    document.title = "Cobros | Medicus";
    cargarTransacciones();
  }, []);

  const cargarTransacciones = async () => {
    try {
      const data = await fetchTransacciones();
      setTransacciones(data);
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las transacciones",
        variant: "destructive",
      });
    }
  };

  const filtrarTransacciones = () => {
    let resultado = [...transacciones];

    if (filtro !== "todos") {
      resultado = resultado.filter((t) => t.estado.toString() === filtro);
    }

    if (busqueda) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(
        (t) =>
          t.paciente.toLowerCase().includes(termino) ||
          t.concepto.toLowerCase().includes(termino) ||
          t.monto.toString().includes(busqueda)
      );
    }

    if (ordenarPor) {
      resultado.sort((a, b) => {
        const valorA = a[ordenarPor] || "";
        const valorB = b[ordenarPor] || "";

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

  const handleEditarTransaccion = (transaccion: any) => {
    setTransaccionEditar(transaccion);
    setEditDialogOpen(true);
    processingRef.current = false;
    setIsProcessing(false);
  };

  const handleAgendarCita = (transaccion: any) => {
    navigate("/agendar-cita", {
      state: { idpaciente: transaccion.idpaciente },
    });
  };

  const handleGuardarEdicion = async () => {
    if (!transaccionEditar?.metodoPago) {
      toast({
        title: "Método de pago requerido",
        description: "Por favor seleccione un método de pago",
        variant: "destructive",
      });
      return;
    }

    if (processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);

    const transaccionOriginal = transaccionEditar;
    setTransacciones((prev) =>
      prev.map((t) =>
        t.idpago === transaccionEditar.idpago
          ? {
              ...t,
              estado: 1,
              metodoPago: transaccionEditar.metodoPago,
              monto: transaccionEditar.monto,
            }
          : t
      )
    );
    setEditDialogOpen(false);

    try {
      await updateTransaccion(
        transaccionEditar.idpago,
        transaccionEditar.metodoPago,
        userId,
        transaccionEditar.monto
      );

      toast({
        title: "Pago procesado",
        description: `Se ha procesado el pago de ${transaccionEditar.paciente} por Bs${transaccionEditar.monto}`,
      });
    } catch (error) {
      setTransacciones((prev) =>
        prev.map((t) =>
          t.idpago === transaccionOriginal.idpago
            ? {
                ...t,
                estado: 0,
                metodoPago: null,
                monto: transaccionOriginal.monto,
              }
            : t
        )
      );

      setTransaccionEditar(transaccionOriginal);
      setEditDialogOpen(true);

      toast({
        title: "Error",
        description: "Hubo un error al procesar el pago",
        variant: "destructive",
      });
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const totalPendiente = filtrarTransacciones()
    .filter((t) => t.estado === 0)
    .reduce((sum, t) => sum + parseFloat(t.monto), 0);

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Cobros
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Gestione los pagos y transacciones en caja
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6 md:mb-8">
        <Card className="shadow-md border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendiente por Cobrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-medical-dark mr-2 shrink-0" />
              <div className="text-xl sm:text-2xl font-bold break-all">
                Bs.
                {totalPendiente.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-medical-light bg-opacity-30 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-medical-dark shrink-0" />
              <CardTitle className="text-lg sm:text-xl">
                Cobros Pendientes
              </CardTitle>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cobros..."
                  className="pl-8 w-full sm:w-[220px]"
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
            {filtrarTransacciones().length > 0 ? (
              filtrarTransacciones().map((transaccion) => (
                <TransaccionCard
                  key={transaccion.idpago}
                  transaccion={transaccion}
                  onProcesarPago={handleEditarTransaccion}
                  onAgendarCita={handleAgendarCita}
                />
              ))
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No se encontraron transacciones.
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
                      className="table-header-button"
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
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      className="table-header-button"
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
                  <TableHead className="hidden sm:table-cell">
                    <Button
                      variant="ghost"
                      className="table-header-button"
                      onClick={() => {
                        if (ordenarPor === "concepto") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("concepto");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Concepto
                      {ordenarPor === "concepto" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="table-header-button"
                      onClick={() => {
                        if (ordenarPor === "monto") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("monto");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Monto
                      {ordenarPor === "monto" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="table-header-button"
                      onClick={() => {
                        if (ordenarPor === "estado") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("estado");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Estado
                      {ordenarPor === "estado" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Button
                      variant="ghost"
                      className="table-header-button"
                      onClick={() => {
                        if (ordenarPor === "metodoPago") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("metodoPago");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Método
                      {ordenarPor === "metodoPago" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrarTransacciones().length > 0 ? (
                  filtrarTransacciones().map((transaccion) => (
                    <TableRow key={transaccion.idpago} className="group">
                      <TableCell className="font-medium">
                        {transaccion.paciente}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(transaccion.fecha), "PP", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                        {Array.isArray(transaccion.concepto) ? (
                          <ul>
                            {transaccion.concepto.map(
                              (servicio: string, index: number) => (
                                <li key={index}>{servicio}</li>
                              )
                            )}
                          </ul>
                        ) : (
                          <span>{transaccion.concepto}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        Bs.
                        {parseFloat(transaccion.monto).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaccion.estado === 1 ? "default" : "outline"
                          }
                          className={
                            transaccion.estado === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }
                        >
                          {transaccion.estado === 1 ? "Pagado" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {transaccion.metodoPago ? (
                          metodoPagoLabel[transaccion.metodoPago]
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {transaccion.estado !== 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleEditarTransaccion(transaccion)
                              }
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit2 className="h-4 w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">
                                Procesar Pago
                              </span>
                              <span className="sm:hidden">Pagar</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAgendarCita(transaccion)}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                            title="Agendar cita para este paciente"
                          >
                            <CalendarPlus className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">
                              Agendar Cita
                            </span>
                            <span className="sm:hidden">Cita</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron transacciones.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isProcessing) {
            setEditDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Registre el pago para completar la transacción.
            </DialogDescription>
          </DialogHeader>
          {transaccionEditar && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">
                    Paciente
                  </Label>
                  <p className="font-medium break-words">
                    {transaccionEditar.paciente}
                  </p>
                </div>
                <div>
                  <Label
                    htmlFor="monto"
                    className="text-muted-foreground text-sm"
                  >
                    Monto (Bs.)
                  </Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    value={transaccionEditar.monto}
                    onChange={(e) =>
                      setTransaccionEditar({
                        ...transaccionEditar,
                        monto: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={isProcessing}
                  />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">
                  Concepto
                </Label>
                <p className="font-medium break-words">
                  {Array.isArray(transaccionEditar.concepto)
                    ? transaccionEditar.concepto.join(", ")
                    : transaccionEditar.concepto}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metodoPagoEdit">Método de Pago</Label>
                <Select
                  value={transaccionEditar.metodoPago}
                  onValueChange={(value) =>
                    setTransaccionEditar({
                      ...transaccionEditar,
                      metodoPago: value,
                    })
                  }
                  disabled={isProcessing}
                >
                  <SelectTrigger id="metodoPagoEdit">
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="QR">QR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col xs:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => !isProcessing && setEditDialogOpen(false)}
              disabled={isProcessing}
              className="w-full xs:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarEdicion}
              className="bg-green-600 hover:bg-green-700 w-full xs:w-auto"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Confirmar Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cobros;