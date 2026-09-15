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
  obtenerEspecialidades,
  crearEspecialidad,
  eliminarEspecialidad,
  actualizarEspecialidad,
} from "@/api/listaespecialidadapi";
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

const ListaEspecialidades = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [formEspecialidad, setFormEspecialidad] = useState({
    nombre: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [especialidadToDelete, setEspecialidadToDelete] = useState(null);
  const [especialidadToEdit, setEspecialidadToEdit] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Lista de Especialidades | Medicus";
    cargarEspecialidades();
  }, []);

  const cargarEspecialidades = async () => {
    try {
      const especialidades = await obtenerEspecialidades();
      setEspecialidades(especialidades);
    } catch (error) {
      console.error("Error al cargar especialidades:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormEspecialidad((prev) => ({ ...prev, [name]: value }));
  };

  const filtrarEspecialidades = () => {
    if (!busqueda) return especialidades;

    return especialidades.filter((especialidad) =>
      especialidad.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  const handleSubmitEspecialidad = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formEspecialidad.nombre) {
      toast({
        title: "Información incompleta",
        description: "Por favor ingrese el nombre de la especialidad",
        variant: "destructive",
      });
      return;
    }

    if (especialidadToEdit) {
      await actualizarEspecialidad(
        especialidadToEdit.idespecialidad,
        formEspecialidad.nombre
      );
      toast({
        title: "Especialidad actualizada",
        description: `Se ha actualizado "${formEspecialidad.nombre}"`,
      });
    } else {
      await crearEspecialidad(formEspecialidad.nombre);
      toast({
        title: "Especialidad agregada",
        description: `Se ha agregado "${formEspecialidad.nombre}" a la lista de especialidades`,
      });
    }

    setDialogOpen(false);
    setFormEspecialidad({
      nombre: "",
    });
    setEspecialidadToEdit(null);
    cargarEspecialidades();
  };

  const handleOpenDeleteDialog = (especialidad) => {
    setEspecialidadToDelete(especialidad);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (especialidadToDelete) {
      await eliminarEspecialidad(especialidadToDelete.idespecialidad);
      toast({
        title: "Especialidad eliminada",
        description: "La especialidad ha sido eliminada de la lista",
      });
      cargarEspecialidades();
      setDeleteDialogOpen(false);
      setEspecialidadToDelete(null);
    }
  };

  const handleOpenEditDialog = (especialidad) => {
    setEspecialidadToEdit(especialidad);
    setFormEspecialidad({
      nombre: especialidad.nombre,
    });
    setDialogOpen(true);
  };

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Lista de Especialidades
          </h1>
          <p className="text-muted-foreground mt-2">
            Catálogo de especialidades médicas
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar especialidades..."
              className="pl-8 w-full sm:w-[250px]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Agregar Especialidad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmitEspecialidad}>
                <DialogHeader>
                  <DialogTitle>
                    {especialidadToEdit
                      ? "Editar Especialidad"
                      : "Agregar Nueva Especialidad"}
                  </DialogTitle>
                  <DialogDescription>
                    Ingrese la información de la especialidad médica.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre de la Especialidad</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      placeholder="Ej. Cardiología"
                      value={formEspecialidad.nombre}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {especialidadToEdit ? "Actualizar" : "Agregar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-medical-light bg-opacity-30">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-medical-dark" />
            <CardTitle>Catálogo de Especialidades</CardTitle>
          </div>
          <CardDescription>
            Lista completa de especialidades médicas disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Especialidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrarEspecialidades().length > 0 ? (
                  filtrarEspecialidades().map((especialidad) => (
                    <TableRow
                      key={especialidad.idespecialidad}
                      className="group"
                    >
                      <TableCell className="font-medium">
                        {especialidad.nombre}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(especialidad)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={
                              deleteDialogOpen &&
                              especialidadToDelete?.idespecialidad ===
                                especialidad.idespecialidad
                            }
                            onOpenChange={setDeleteDialogOpen}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleOpenDeleteDialog(especialidad)
                                }
                                className="text-red-600 hover:text-red-800 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Está seguro que desea eliminar esta
                                  especialidad?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. La
                                  especialidad {especialidadToDelete?.nombre}{" "}
                                  será eliminada permanentemente del sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleConfirmDelete}
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
                    <TableCell colSpan={2} className="h-24 text-center">
                      No se encontraron especialidades.
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

export default ListaEspecialidades;