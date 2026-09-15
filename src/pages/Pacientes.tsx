import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  FileText,
  UserPlus,
  MessageCircle,
  Users,
  Filter,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import NuevoPacienteForm from "@/components/NuevoPacienteForm";
import { getPacientes, addPaciente } from "@/api/pacientesApi";

const Pacientes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [filterGender, setFilterGender] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const pageSize = 100;

  const searchTimeoutRef = useRef(null);

  // Debounce para la búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchLoading(true);

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Resetear a primera página al buscar
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    document.title = "Pacientes";
  }, []);

  // Función para obtener pacientes con búsqueda
  const fetchPacientes = useCallback(async (page = 1, search = debouncedSearch) => {
    try {
      if (!userId) {
        console.error("Usuario no autenticado");
        return;
      }
      setIsLoading(true);
      const data = await getPacientes(userId, page, pageSize, search);
      console.log("Datos recibidos del backend:", data);

      setPatients(data.patients || []);
      setTotalPages(data.totalPages || 1);
      setTotalPatients(data.total || 0);
      setCurrentPage(data.currentPage || page);
      setSearchLoading(false);
    } catch (error) {
      console.error("Error fetching pacientes:", error);
      setSearchLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId, debouncedSearch]);

  // Efecto para cargar cuando cambia la búsqueda o página
  useEffect(() => {
    if (userId) {
      fetchPacientes(currentPage, debouncedSearch);
    }
  }, [userId, currentPage, debouncedSearch, fetchPacientes]);

  // Aplicar filtro de género en frontend (ya que el backend no filtra por género)
  useEffect(() => {
    if (filterGender) {
      const filtered = patients.filter((patient) => patient.gender === filterGender);
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [filterGender, patients]);

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";

    const date = new Date(dateString + 'T00:00:00');

    if (isNaN(date.getTime())) {
      return "Fecha no disponible";
    }

    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: 'UTC'
    });
  };

  const calculateAge = (dateString) => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleAddPatient = () => {
    setDialogOpen(true);
  };

  const handlePatientAdded = async (newPatient) => {
    try {
      const addedPatient = await addPaciente({
        ...newPatient,
        doctorId: userId
      });

      // Refrescar la lista después de agregar
      fetchPacientes(1, debouncedSearch);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error adding paciente:", error);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Funciones de paginación
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  // Calcular pacientes mostrados
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + filteredPatients.length - 1, totalPatients);

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Pacientes
          </h1>
        </div>
        <Button onClick={handleAddPatient}>
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar Paciente
        </Button>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Directorio de Pacientes
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({totalPatients} pacientes totales)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre..."
                className="pl-8 pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {searchLoading && (
                <div className="absolute right-8 top-2.5">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtro
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    <h4 className="font-medium">Género</h4>
                    <div className="space-y-1">
                      <Button
                        variant={filterGender === null ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFilterGender(null)}
                      >
                        Todos
                      </Button>
                      <Button
                        variant={filterGender === "Masculino" ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFilterGender("Masculino")}
                      >
                        Masculino
                      </Button>
                      <Button
                        variant={filterGender === "Femenino" ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFilterGender("Femenino")}
                      >
                        Femenino
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Indicador de paginación */}
          {!isLoading && filteredPatients.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredPatients.length} pacientes
                {debouncedSearch && ` que coinciden con "${debouncedSearch}"`}
                {filterGender && ` de género ${filterGender}`}
              </div>
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Cargando pacientes...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">
                {debouncedSearch
                  ? `No se encontraron pacientes que coincidan con "${debouncedSearch}".`
                  : "No hay pacientes registrados."}
              </p>
              {debouncedSearch && (
                <Button variant="outline" onClick={handleClearSearch}>
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="relative bg-white bg-opacity-75 hover:bg-opacity-90 backdrop-blur-sm border border-slate-200 hover:border-primary rounded-lg p-5 shadow-sm transition-all duration-300 cursor-pointer group w-full"
                    onClick={() => navigate(`/historial-clinico/${patient.id}`)}
                  >
                    <div className="flex items-start mb-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{patient.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="bg-gray-50">
                            {calculateAge(patient.birthdate)} años
                          </Badge>
                          <Badge variant="outline" className="bg-gray-50">
                            {patient.bloodType}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2 mt-0.5" />
                      <span>
                        Última visita: {formatDate(patient.lastvisit)}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 flex justify-between items-center border-t border-dashed border-gray-200">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-800 p-1 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/historial-clinico/${patient.id}`);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Historial</span>
                      </Button>
                    </div>

                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles de paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    {pageSize} pacientes por página
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToFirstPage}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevPage}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center space-x-1">
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                        if (endPage - startPage + 1 < maxVisible) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(i)}
                              disabled={isLoading}
                              className="min-w-[40px]"
                            >
                              {i}
                            </Button>
                          );
                        }
                        return pages;
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (!isNaN(page)) {
                          goToPage(Math.min(Math.max(1, page), totalPages));
                        }
                      }}
                      className="w-20 h-8 text-center"
                      disabled={isLoading}
                    />
                    <span className="ml-2">/ {totalPages}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
            <DialogDescription>
              Complete el formulario con los datos del nuevo paciente. Todos los
              campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <NuevoPacienteForm
            onPatientAdded={handlePatientAdded}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pacientes;