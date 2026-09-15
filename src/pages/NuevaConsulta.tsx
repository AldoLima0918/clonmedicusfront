import { useState, useEffect } from "react";
import { Plus, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  addConsulta,
  addPago,
  updatePacienteNotas,
  updateCitaEstado,
} from "@/api/historialclinicoapi";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertToRaw, convertFromRaw } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Servicio {
  idservicio: number;
  nombre: string;
  precio: string;
}

interface NuevaConsultaProps {
  id: string | undefined;
  idCita: string | null;
  servicios: Servicio[];
  patient: any;
}

const NuevaConsulta = ({
  id,
  idCita,
  servicios = [],
  patient,
}: NuevaConsultaProps) => {
  const storageKey = `consultaData_${id}_notes`;
  const [editorState, setEditorState] = useState(() => {
    if (typeof window !== "undefined") {
      const savedNotes = localStorage.getItem(storageKey);
      if (savedNotes) {
        try {
          return EditorState.createWithContent(
            convertFromRaw(JSON.parse(savedNotes))
          );
        } catch (e) {
          console.error("Error parsing saved notes", e);
        }
      }
    }
    return EditorState.createEmpty();
  });
  const [patientNotes, setPatientNotes] = useState(patient?.notas || "");
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    Servicio[]
  >([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const contentState = editorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      localStorage.setItem(storageKey, JSON.stringify(rawContent));
    }
  }, [editorState, storageKey]);

  const filteredServices = servicios.filter((servicio) =>
    servicio.nombre.toLowerCase().includes(searchValue.toLowerCase())
  );

  const calcularPrecioTotal = () => {
    return serviciosSeleccionados.reduce((total, servicio) => {
      return total + parseFloat(servicio.precio);
    }, 0);
  };

  const handleServiceSelect = (service: Servicio) => {
    const servicioExistente = serviciosSeleccionados.find(
      (s) => s.idservicio === service.idservicio
    );
    if (!servicioExistente) {
      setServiciosSeleccionados([...serviciosSeleccionados, service]);
    }
    setOpen(false);
    setSearchValue("");
  };

  const handlePrecioChange = (idservicio: number, precio: number) => {
    setServiciosSeleccionados(
      serviciosSeleccionados.map((s) => {
        if (s.idservicio === idservicio) {
          return { ...s, precio: precio.toString() };
        }
        return s;
      })
    );
  };

  const eliminarServicio = (idservicio: number) => {
    setServiciosSeleccionados(
      serviciosSeleccionados.filter((s) => s.idservicio !== idservicio)
    );
  };

  const handleAddRecord = async () => {
    if (!idCita) {
      toast({
        title: "Error",
        description: "Primero se debe agendar una cita.",
        variant: "destructive",
      });
      return;
    }

    if (
      serviciosSeleccionados.length === 0 ||
      editorState.getCurrentContent().getPlainText().trim() === ""
    ) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    setDialogOpen(true);
  };

  const handleFinalizarConsulta = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const precioTotal = calcularPrecioTotal();
      const pagoData = { idcita: idCita, monto: precioTotal.toString() };
      await addPago(pagoData);

      const contentState = editorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);

      const serviciosData = serviciosSeleccionados.map((s) => ({
        idservicio: s.idservicio,
        precio_unitario: s.precio,
      }));

      const consultaData = {
        idpaciente: id,
        idcita: idCita,
        antecedente: JSON.stringify(rawContent),
        notas_paciente: patientNotes,
        servicios: serviciosData,
      };

      await addConsulta(id, consultaData);

      if (patientNotes) {
        await updatePacienteNotas(id, patientNotes);
      }

      await updateCitaEstado(idCita, 2);

      setEditorState(EditorState.createEmpty());
      setPatientNotes("");
      setServiciosSeleccionados([]);

      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }

      toast({
        title: "Consulta finalizada",
        description: "La consulta ha sido finalizada exitosamente.",
      });
      setDialogOpen(false);
    } catch (error) {
      console.error("Error finalizando consulta:", error);
      toast({
        title: "Error",
        description: "Hubo un error al finalizar la consulta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const precioTotal = calcularPrecioTotal();

  return (
    <div className="space-y-4 print:hidden">
      <div className="grid grid-cols-1 gap-4">
        {/* Registro de consulta */}
        <div className="space-y-2">
          <Label htmlFor="notes">Registro de Consulta</Label>
          <div className="border rounded-md overflow-hidden">
            <Editor
              editorState={editorState}
              onEditorStateChange={setEditorState}
              toolbar={{
                options: ["inline", "list", "textAlign", "history"],
                inline: {
                  options: ["bold", "italic", "underline", "strikethrough"],
                },
                list: { options: ["unordered", "ordered"] },
              }}
              toolbarClassName="toolbarClassName"
              wrapperClassName="wrapperClassName"
              editorClassName="editorClassName px-3 min-h-[200px] sm:min-h-[300px]"
              placeholder="Observaciones y recomendaciones..."
              editorStyle={{
                minHeight: "200px",
                padding: "0.75rem",
              }}
            />
          </div>
        </div>

        {/* Servicios */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Servicios realizados</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  Agregar servicio...
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px]"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar servicios..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron servicios.</CommandEmpty>
                    <CommandGroup>
                      {filteredServices.map((servicio) => (
                        <CommandItem
                          key={servicio.idservicio}
                          value={servicio.nombre}
                          onSelect={() => handleServiceSelect(servicio)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              serviciosSeleccionados.some(
                                (s) => s.idservicio === servicio.idservicio
                              )
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex justify-between w-full gap-2">
                            <span className="truncate">{servicio.nombre}</span>
                            <span className="text-muted-foreground shrink-0">
                              Bs. {servicio.precio}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Servicios seleccionados: cards en móvil, tabla en desktop */}
          {serviciosSeleccionados.length > 0 && (
            <>
              {/* Móvil */}
              <div className="md:hidden space-y-2">
                {serviciosSeleccionados.map((servicio) => (
                  <div
                    key={servicio.idservicio}
                    className="border rounded-md p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm break-words flex-1">
                        {servicio.nombre}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarServicio(servicio.idservicio)}
                        className="h-7 w-7 p-0 shrink-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Precio (Bs.)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={Number(servicio.precio).toFixed(0)}
                        onChange={(e) =>
                          handlePrecioChange(
                            servicio.idservicio,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-24 text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead className="w-24 text-right">
                        Subtotal
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviciosSeleccionados.map((servicio) => (
                      <TableRow key={servicio.idservicio}>
                        <TableCell>{servicio.nombre}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            value={Number(servicio.precio).toFixed(0)}
                            onChange={(e) =>
                              handlePrecioChange(
                                servicio.idservicio,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 text-center mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              eliminarServicio(servicio.idservicio)
                            }
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        {/* Notas del paciente */}
        <div className="space-y-2">
          <Label htmlFor="patient-notes">Notas del Paciente</Label>
          <Textarea
            id="patient-notes"
            value={patientNotes}
            onChange={(e) => setPatientNotes(e.target.value)}
            placeholder="Escriba aquí cualquier observación importante sobre el paciente..."
            className="min-h-[100px]"
          />
        </div>
      </div>

      {/* Total + botón: apilado en móvil */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t">
        <div>
          <p className="text-sm text-muted-foreground">Total a pagar</p>
          <p className="text-xl sm:text-2xl font-semibold">Bs. {precioTotal}</p>
          <p className="text-xs text-muted-foreground">
            {serviciosSeleccionados.length} servicio(s) seleccionado(s)
          </p>
        </div>
        <Button
          onClick={handleAddRecord}
          disabled={
            serviciosSeleccionados.length === 0 ||
            editorState.getCurrentContent().getPlainText().trim() === ""
          }
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Finalizar Consulta
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>Finalizar Consulta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas finalizar la consulta? Esta acción no
              puede deshacerse.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col xs:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="w-full xs:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinalizarConsulta}
              disabled={isSubmitting}
              className="w-full xs:w-auto"
            >
              {isSubmitting ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NuevaConsulta;