import { useEffect, useState } from "react";
import { FileText, Plus, Search, Trash2, Edit } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  obtenerServicios,
  crearServicio,
  eliminarServicio,
  obtenerEspecialidades,
  actualizarServicio,
} from "@/api/listapreciosapi";
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

interface Servicio {
  idservicio: number;
  nombre: string;
  precio: number;
  especialidad: string;
  idespecialidad: number;
}

interface Especialidad {
  idespecialidad: number;
  nombre: string;
}

/** Card de un servicio para vista móvil */
const ServicioCard = ({
  servicio,
  onEdit,
  onDelete,
  deleteDialogOpen,
  serviceToDelete,
  setDeleteDialogOpen,
  isLoading,
}: {
  servicio: Servicio;
  onEdit: (s: Servicio) => void;
  onDelete: (s: Servicio) => void;
  deleteDialogOpen: boolean;
  serviceToDelete: Servicio | null;
  setDeleteDialogOpen: (open: boolean) => void;
  isLoading: boolean;
}) => (
  <Card className="shadow-sm border border-border/60">
    <CardContent className="p-4 space-y-3">
      {/* Encabezado: nombre + acciones */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-tight break-words">
            {servicio.nombre}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">
            {servicio.especialidad}
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            onClick={() => onEdit(servicio)}
            disabled={isLoading}
            aria-label="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <AlertDialog
            open={
              deleteDialogOpen &&
              serviceToDelete?.idservicio === servicio.idservicio
            }
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-100"
                onClick={() => onDelete(servicio)}
                disabled={isLoading}
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[95vw] max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Está seguro que desea eliminar este servicio?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El servicio{" "}
                  {serviceToDelete?.nombre} será eliminado permanentemente del
                  sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                <AlertDialogCancel
                  disabled={isLoading}
                  className="w-full xs:w-auto"
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 text-white hover:bg-red-600 w-full xs:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Precio destacado */}
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">Precio</p>
        <p className="text-lg font-bold text-medical-dark">
          Bs.{servicio.precio.toLocaleString()}
        </p>
      </div>
    </CardContent>
  </Card>
);

const ListaPrecios = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [formServicio, setFormServicio] = useState({
    nombre: "",
    precio: "",
    idespecialidad: "",
  });
  const [editFormServicio, setEditFormServicio] = useState({
    idservicio: 0,
    nombre: "",
    precio: "",
    idespecialidad: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Servicio | null>(null);
  const { toast } = useToast();
  const [ordenarPor, setOrdenarPor] = useState<string | null>(null);
  const [ordenDireccion, setOrdenDireccion] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Lista de Precios | Medicus";
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      await Promise.all([cargarServicios(), cargarEspecialidades()]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cargarServicios = async () => {
    try {
      const servicios = await obtenerServicios();
      setServicios(servicios);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
      throw error;
    }
  };

  const cargarEspecialidades = async () => {
    try {
      const especialidades = await obtenerEspecialidades();
      setEspecialidades(especialidades);
    } catch (error) {
      console.error("Error al cargar especialidades:", error);
      throw error;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormServicio((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormServicio((prev) => ({ ...prev, [name]: value }));
  };

  const filtrarServicios = () => {
    let resultado = [...servicios];

    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      resultado = resultado.filter(
        (servicio) =>
          servicio.nombre.toLowerCase().includes(busquedaLower) ||
          servicio.precio.toString().includes(busqueda) ||
          servicio.especialidad.toLowerCase().includes(busquedaLower)
      );
    }

    if (ordenarPor) {
      resultado.sort((a, b) => {
        // @ts-ignore
        const valorA = a[ordenarPor]?.toString().toLowerCase() || "";
        // @ts-ignore
        const valorB = b[ordenarPor]?.toString().toLowerCase() || "";

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

  const handleSubmitServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      !formServicio.nombre ||
      !formServicio.precio ||
      !formServicio.idespecialidad
    ) {
      toast({
        title: "Información incompleta",
        description:
          "Por favor ingrese nombre, precio y especialidad del servicio",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await crearServicio({
        nombre: formServicio.nombre,
        precio: parseFloat(formServicio.precio),
        idespecialidad: parseInt(formServicio.idespecialidad),
      });

      toast({
        title: "Servicio agregado",
        description: `Se ha agregado "${formServicio.nombre}" a la lista de precios`,
      });

      setDialogOpen(false);
      setFormServicio({
        nombre: "",
        precio: "",
        idespecialidad: "",
      });
      await cargarServicios();
    } catch (error) {
      console.error("Error al crear servicio:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el servicio. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditDialog = (servicio: Servicio) => {
    setEditFormServicio({
      idservicio: servicio.idservicio,
      nombre: servicio.nombre,
      precio: servicio.precio.toString(),
      idespecialidad: servicio.idespecialidad.toString(),
    });
    setEditDialogOpen(true);
  };

  const handleSubmitEditServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      !editFormServicio.nombre ||
      !editFormServicio.precio ||
      !editFormServicio.idespecialidad
    ) {
      toast({
        title: "Información incompleta",
        description:
          "Por favor ingrese nombre, precio y especialidad del servicio",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await actualizarServicio(editFormServicio.idservicio, {
        nombre: editFormServicio.nombre,
        precio: parseFloat(editFormServicio.precio),
        idespecialidad: parseInt(editFormServicio.idespecialidad),
      });

      toast({
        title: "Servicio actualizado",
        description: `Se ha actualizado "${editFormServicio.nombre}" en la lista de precios`,
      });

      setEditDialogOpen(false);
      setEditFormServicio({
        idservicio: 0,
        nombre: "",
        precio: "",
        idespecialidad: "",
      });
      await cargarServicios();
    } catch (error) {
      console.error("Error al actualizar servicio:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeleteDialog = (servicio: Servicio) => {
    setServiceToDelete(servicio);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setIsLoading(true);

    try {
      await eliminarServicio(serviceToDelete.idservicio);
      toast({
        title: "Servicio eliminado",
        description: "El servicio ha sido eliminado de la lista de precios",
      });
      await cargarServicios();
    } catch (error) {
      console.error("Error al eliminar servicio:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Lista de Precios
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Catálogo de servicios médicos y sus costos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar servicios..."
              className="pl-8 w-full sm:w-[250px]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setDialogOpen(true)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmitServicio}>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Servicio</DialogTitle>
                  <DialogDescription>
                    Ingrese la información del nuevo servicio médico.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Servicio</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      placeholder="Ej. Consulta General"
                      value={formServicio.nombre}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio</Label>
                    <Input
                      id="precio"
                      name="precio"
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formServicio.precio}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idespecialidad">Especialidad</Label>
                    <select
                      id="idespecialidad"
                      name="idespecialidad"
                      value={formServicio.idespecialidad}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      disabled={isLoading}
                    >
                      <option value="">Seleccione una especialidad</option>
                      {especialidades.map((especialidad) => (
                        <option
                          key={especialidad.idespecialidad}
                          value={especialidad.idespecialidad}
                        >
                          {especialidad.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? "Agregando..." : "Agregar Servicio"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-medical-light bg-opacity-30 p-4 sm:p-6">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-medical-dark shrink-0" />
            <CardTitle className="text-lg sm:text-xl">
              Catálogo de Servicios
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Lista completa de servicios médicos disponibles y sus precios
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {/* ====== VISTA MÓVIL (cards) ====== */}
          <div className="md:hidden p-3 sm:p-4 space-y-3">
            {isLoading ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                Cargando servicios...
              </div>
            ) : filtrarServicios().length > 0 ? (
              filtrarServicios().map((servicio) => (
                <ServicioCard
                  key={servicio.idservicio}
                  servicio={servicio}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleOpenDeleteDialog}
                  deleteDialogOpen={deleteDialogOpen}
                  serviceToDelete={serviceToDelete}
                  setDeleteDialogOpen={setDeleteDialogOpen}
                  isLoading={isLoading}
                />
              ))
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No se encontraron servicios.
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
                        if (ordenarPor === "nombre") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("nombre");
                          setOrdenDireccion("asc");
                        }
                      }}
                      disabled={isLoading}
                    >
                      Servicio
                      {ordenarPor === "nombre" && (
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
                        if (ordenarPor === "especialidad") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("especialidad");
                          setOrdenDireccion("asc");
                        }
                      }}
                      disabled={isLoading}
                    >
                      Especialidad
                      {ordenarPor === "especialidad" && (
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
                        if (ordenarPor === "precio") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("precio");
                          setOrdenDireccion("asc");
                        }
                      }}
                      disabled={isLoading}
                    >
                      Precio
                      {ordenarPor === "precio" && (
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Cargando servicios...
                    </TableCell>
                  </TableRow>
                ) : filtrarServicios().length > 0 ? (
                  filtrarServicios().map((servicio) => (
                    <TableRow key={servicio.idservicio} className="group">
                      <TableCell className="font-medium">
                        {servicio.nombre}
                      </TableCell>
                      <TableCell>{servicio.especialidad}</TableCell>
                      <TableCell>
                        Bs.{servicio.precio.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(servicio)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            disabled={isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog
                            open={
                              deleteDialogOpen &&
                              serviceToDelete?.idservicio ===
                                servicio.idservicio
                            }
                            onOpenChange={setDeleteDialogOpen}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleOpenDeleteDialog(servicio)
                                }
                                className="text-red-600 hover:text-red-800 hover:bg-red-100"
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[95vw] max-w-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Está seguro que desea eliminar este
                                  servicio?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El servicio{" "}
                                  {serviceToDelete?.nombre} será eliminado
                                  permanentemente del sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                                <AlertDialogCancel
                                  disabled={isLoading}
                                  className="w-full xs:w-auto"
                                >
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleConfirmDelete}
                                  className="bg-red-500 text-white hover:bg-red-600 w-full xs:w-auto"
                                  disabled={isLoading}
                                >
                                  {isLoading ? "Eliminando..." : "Eliminar"}
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
                    <TableCell colSpan={4} className="h-24 text-center">
                      No se encontraron servicios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar servicio */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmitEditServicio}>
            <DialogHeader>
              <DialogTitle>Editar Servicio</DialogTitle>
              <DialogDescription>
                Modifique la información del servicio médico.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre del Servicio</Label>
                <Input
                  id="edit-nombre"
                  name="nombre"
                  placeholder="Ej. Consulta General"
                  value={editFormServicio.nombre}
                  onChange={handleEditInputChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-precio">Precio</Label>
                <Input
                  id="edit-precio"
                  name="precio"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFormServicio.precio}
                  onChange={handleEditInputChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-idespecialidad">Especialidad</Label>
                <select
                  id="edit-idespecialidad"
                  name="idespecialidad"
                  value={editFormServicio.idespecialidad}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                >
                  <option value="">Seleccione una especialidad</option>
                  {especialidades.map((especialidad) => (
                    <option
                      key={especialidad.idespecialidad}
                      value={especialidad.idespecialidad}
                    >
                      {especialidad.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListaPrecios;