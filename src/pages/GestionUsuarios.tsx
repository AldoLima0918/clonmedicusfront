import { useState, useEffect } from "react";
import { UserPlus, Edit, Trash, Search } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/ui/use-toast";
import {
  User,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getEspecialidades,
} from "@/api/users";
import { Checkbox } from "@/components/ui/checkbox";

type FormUser = {
  id?: number;
  usuario: string;
  password?: string;
  nombre_completo: string;
  telefono: string;
  correo: string;
  rol: number;
  estado: number;
  especialidades?: number[];
};

type Especialidad = {
  idespecialidad: number;
  nombre: string;
};

/** Card de un usuario para vista móvil */
const UsuarioCard = ({
  user,
  onToggleStatus,
  onEdit,
  onDelete,
  deleteDialogOpen,
  userToDelete,
  setDeleteDialogOpen,
  onConfirmDelete,
}: {
  user: User;
  onToggleStatus: (u: User) => void;
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
  deleteDialogOpen: boolean;
  userToDelete: User | null;
  setDeleteDialogOpen: (open: boolean) => void;
  onConfirmDelete: () => void;
}) => (
  <Card className="shadow-sm border border-border/60">
    <CardContent className="p-4 space-y-3">
      {/* Encabezado: nombre + acciones */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-tight break-words">
            {user.nombre_completo}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">
            @{user.usuario}
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(user)}
            aria-label="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <AlertDialog
            open={
              deleteDialogOpen && userToDelete?.idusuario === user.idusuario
            }
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(user)}
                aria-label="Eliminar"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[95vw] max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Está seguro que desea eliminar este usuario?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El usuario{" "}
                  {userToDelete?.nombre_completo} será eliminado permanentemente
                  del sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                <AlertDialogCancel className="w-full xs:w-auto">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirmDelete}
                  className="bg-red-500 text-white hover:bg-red-600 w-full xs:w-auto"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Badge de rol + botón estado */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t">
        <Badge
          className={
            user.rol === 1
              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
              : user.rol === 0
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : "bg-purple-100 text-purple-800 hover:bg-purple-200"
          }
        >
          {user.rol === 1
            ? "Doctor"
            : user.rol === 0
            ? "Secretaria"
            : "Administrador"}
        </Badge>

        <Button
          variant={user.estado === 1 ? "default" : "destructive"}
          size="sm"
          onClick={() => onToggleStatus(user)}
        >
          {user.estado === 1 ? "Activo" : "Inactivo"}
        </Button>
      </div>

      {/* Detalles de contacto */}
      <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Teléfono</span>
          <span className="font-medium text-right break-all">
            {user.telefono}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Correo</span>
          <span className="font-medium text-right break-all">
            {user.correo}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const GestionUsuarios = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formUser, setFormUser] = useState<FormUser>({
    usuario: "",
    password: "",
    nombre_completo: "",
    telefono: "",
    correo: "",
    rol: 1,
    estado: 1,
    especialidades: [],
  });
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const { toast } = useToast();
  const [ordenarPor, setOrdenarPor] = useState<string | null>(null);
  const [ordenDireccion, setOrdenDireccion] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getUsers();
        setUsers(users);
        setFilteredUsers(users);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
      }
    };

    const fetchEspecialidades = async () => {
      try {
        const especialidades = await getEspecialidades();
        setEspecialidades(especialidades);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las especialidades",
          variant: "destructive",
        });
      }
    };

    fetchUsers();
    fetchEspecialidades();
  }, []);

  useEffect(() => {
    let resultado = users;

    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      resultado = resultado.filter((user) => {
        return (
          user.nombre_completo.toLowerCase().includes(lowercasedFilter) ||
          user.usuario.toLowerCase().includes(lowercasedFilter) ||
          user.rol.toString().includes(lowercasedFilter)
        );
      });
    }

    if (ordenarPor) {
      resultado.sort((a, b) => {
        const valorA = a[ordenarPor as keyof User] || "";
        const valorB = b[ordenarPor as keyof User] || "";

        if (valorA < valorB) {
          return ordenDireccion === "asc" ? -1 : 1;
        }
        if (valorA > valorB) {
          return ordenDireccion === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredUsers(resultado);
  }, [searchTerm, users, ordenarPor, ordenDireccion]);

  const handleOpenAddDialog = () => {
    setIsEditing(false);
    setFormUser({
      usuario: "",
      password: "",
      nombre_completo: "",
      telefono: "",
      correo: "",
      rol: 1,
      estado: 1,
      especialidades: [],
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setIsEditing(true);
    setFormUser({
      id: user.idusuario,
      usuario: user.usuario,
      password: "",
      nombre_completo: user.nombre_completo,
      telefono: user.telefono,
      correo: user.correo,
      rol: user.rol,
      estado: user.estado,
      especialidades: user.especialidades || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formUser.nombre_completo ||
      !formUser.telefono ||
      !formUser.correo ||
      !formUser.usuario ||
      (formUser.rol === 1 &&
        (!formUser.especialidades || formUser.especialidades.length === 0))
    ) {
      toast({
        title: "Error",
        description:
          "Todos los campos son requeridos y si es doctor, debe seleccionar al menos una especialidad.",
        variant: "destructive",
      });
      return;
    }

    if (!isEditing && (!formUser.password || formUser.password.length < 6)) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && formUser.id) {
        const updatedUser = await updateUser({
          idusuario: formUser.id,
          usuario: formUser.usuario,
          nombre_completo: formUser.nombre_completo,
          rol: formUser.rol,
          telefono: formUser.telefono,
          correo: formUser.correo,
          estado: formUser.estado,
          especialidades: formUser.especialidades,
        });
        setUsers(
          users.map((user) =>
            user.idusuario === updatedUser.idusuario ? updatedUser : user
          )
        );
        toast({
          title: "Usuario actualizado",
          description: `Se ha actualizado el usuario ${updatedUser.nombre_completo}`,
        });
      } else {
        const newUser = await createUser({
          usuario: formUser.usuario,
          nombre_completo: formUser.nombre_completo,
          rol: formUser.rol,
          telefono: formUser.telefono,
          correo: formUser.correo,
          password: formUser.password!,
          estado: formUser.estado,
          especialidades: formUser.especialidades,
        });
        setUsers([...users, newUser]);
        toast({
          title: "Usuario creado",
          description: `Se ha creado el usuario ${newUser.nombre_completo}`,
        });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await updateUserStatus(userToDelete.idusuario, 3);
        setUsers(
          users.filter((user) => user.idusuario !== userToDelete.idusuario)
        );
        toast({
          title: "Usuario eliminado",
          description: `El usuario ${userToDelete.nombre_completo} ha sido eliminado`,
        });
        setUserToDelete(null);
        setDeleteDialogOpen(false);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleEspecialidadChange = (especialidadId: number) => {
    setFormUser((prev) => {
      const especialidades = prev.especialidades || [];
      const updatedEspecialidades = especialidades.includes(especialidadId)
        ? especialidades.filter((id) => id !== especialidadId)
        : [...especialidades, especialidadId];
      return { ...prev, especialidades: updatedEspecialidades };
    });
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.estado === 1 ? 0 : 1;
      await updateUserStatus(user.idusuario, newStatus);
      setUsers(
        users.map((u) =>
          u.idusuario === user.idusuario ? { ...u, estado: newStatus } : u
        )
      );
      toast({
        title: "Estado actualizado",
        description: `El estado del usuario ${user.nombre_completo} ha sido actualizado`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Administre doctores y secretarias del sistema
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleOpenAddDialog}
              className="w-full md:w-auto"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Añadir Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Actualice la información del usuario seleccionado."
                    : "Complete el formulario para añadir un nuevo usuario al sistema. La contraseña debe tener al menos 6 caracteres."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre completo</Label>
                  <Input
                    id="nombre_completo"
                    value={formUser.nombre_completo}
                    onChange={(e) =>
                      setFormUser({
                        ...formUser,
                        nombre_completo: e.target.value,
                      })
                    }
                    placeholder="Nombre del usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +591
                    </span>
                    <Input
                      id="telefono"
                      type="tel"
                      value={formUser.telefono.replace("+591", "")}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setFormUser({
                          ...formUser,
                          telefono: `+591${value}`,
                        });
                      }}
                      placeholder="Número de teléfono"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    value={formUser.correo}
                    onChange={(e) =>
                      setFormUser({ ...formUser, correo: e.target.value })
                    }
                    placeholder="Correo del usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usuario">Nombre de usuario</Label>
                  <Input
                    id="usuario"
                    value={formUser.usuario}
                    onChange={(e) =>
                      setFormUser({ ...formUser, usuario: e.target.value })
                    }
                    placeholder="Nombre de usuario para iniciar sesión"
                  />
                </div>
                {!isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formUser.password}
                      onChange={(e) =>
                        setFormUser({ ...formUser, password: e.target.value })
                      }
                      placeholder="Mínimo 6 caracteres"
                    />
                    {formUser.password && formUser.password.length < 6 && (
                      <p className="text-sm text-red-500">
                        La contraseña debe tener al menos 6 caracteres
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="rol">Rol en el sistema</Label>
                  <Select
                    value={formUser.rol.toString()}
                    onValueChange={(value: string) =>
                      setFormUser({ ...formUser, rol: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="rol">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Secretaria</SelectItem>
                      <SelectItem value="1">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formUser.rol === 1 && (
                  <div className="space-y-2">
                    <Label>Especialidades</Label>
                    <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                      {especialidades.map((especialidad) => (
                        <div
                          key={especialidad.idespecialidad}
                          className="flex items-center space-x-2 py-1"
                        >
                          <Checkbox
                            id={`especialidad-${especialidad.idespecialidad}`}
                            checked={formUser.especialidades?.includes(
                              especialidad.idespecialidad
                            )}
                            onCheckedChange={() =>
                              handleEspecialidadChange(
                                especialidad.idespecialidad
                              )
                            }
                          />
                          <label
                            htmlFor={`especialidad-${especialidad.idespecialidad}`}
                            className="text-sm cursor-pointer"
                          >
                            {especialidad.nombre}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    !isEditing &&
                    formUser.password &&
                    formUser.password.length < 6
                  }
                  className="w-full sm:w-auto"
                >
                  {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
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
              <UserPlus className="h-5 w-5 mr-2 text-medical-dark shrink-0" />
              <CardTitle className="text-lg sm:text-xl">
                Usuarios del Sistema
              </CardTitle>
            </div>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UsuarioCard
                  key={user.idusuario}
                  user={user}
                  onToggleStatus={handleToggleStatus}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleOpenDeleteDialog}
                  deleteDialogOpen={deleteDialogOpen}
                  userToDelete={userToDelete}
                  setDeleteDialogOpen={setDeleteDialogOpen}
                  onConfirmDelete={handleConfirmDelete}
                />
              ))
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                No se encontraron usuarios con los filtros aplicados.
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
                        if (ordenarPor === "nombre_completo") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("nombre_completo");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Nombre
                      {ordenarPor === "nombre_completo" && (
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
                        if (ordenarPor === "usuario") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("usuario");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Usuario
                      {ordenarPor === "usuario" && (
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
                        if (ordenarPor === "telefono") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("telefono");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Teléfono
                      {ordenarPor === "telefono" && (
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
                        if (ordenarPor === "correo") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("correo");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Correo
                      {ordenarPor === "correo" && (
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
                        if (ordenarPor === "rol") {
                          setOrdenDireccion(
                            ordenDireccion === "asc" ? "desc" : "asc"
                          );
                        } else {
                          setOrdenarPor("rol");
                          setOrdenDireccion("asc");
                        }
                      }}
                    >
                      Rol
                      {ordenarPor === "rol" && (
                        <span className="ml-2">
                          {ordenDireccion === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Habilitado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.idusuario} className="group">
                      <TableCell className="font-medium">
                        {user.nombre_completo}
                      </TableCell>
                      <TableCell>{user.usuario}</TableCell>
                      <TableCell>{user.telefono}</TableCell>
                      <TableCell>{user.correo}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.rol === 1
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : user.rol === 0
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                          }
                        >
                          {user.rol === 1
                            ? "Doctor"
                            : user.rol === 0
                            ? "Secretaria"
                            : "Administrador"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={
                            user.estado === 1 ? "default" : "destructive"
                          }
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.estado === 1 ? "Activo" : "Inactivo"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>

                          <AlertDialog
                            open={
                              deleteDialogOpen &&
                              userToDelete?.idusuario === user.idusuario
                            }
                            onOpenChange={setDeleteDialogOpen}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleOpenDeleteDialog(user)}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[95vw] max-w-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Está seguro que desea eliminar este
                                  usuario?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El usuario{" "}
                                  {userToDelete?.nombre_completo} será
                                  eliminado permanentemente del sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                                <AlertDialogCancel className="w-full xs:w-auto">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleConfirmDelete}
                                  className="bg-red-500 text-white hover:bg-red-600 w-full xs:w-auto"
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
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron usuarios con los filtros aplicados.
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

export default GestionUsuarios;