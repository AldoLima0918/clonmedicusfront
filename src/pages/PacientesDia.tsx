import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  FileText,
  Calendar,
  User,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPacientesDelDia } from "@/api/pacientesdiaapi";

type EstadoCita =
  | "pendiente"
  | "en consulta"
  | "cancelada"
  | "En sala"
  | "Completada";

const PacientesDia = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [currentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Pacientes del Día";
    fetchPacientesDelDia();
  }, [userId]);

  const fetchPacientesDelDia = async () => {
    try {
      if (!userId) {
        console.error("Usuario no autenticado");
        return;
      }
      const data = await getPacientesDelDia(userId.toString());
      setPatients(data);
      setError("");
    } catch (error) {
      console.error("Error fetching pacientes del día:", error);
      setError(
        "No se pudieron cargar los pacientes. Inténtalo de nuevo más tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.motivo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Hora no disponible";
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const mapearEstado = (estadoNumerico: number): EstadoCita => {
    switch (estadoNumerico) {
      case 0:
        return "pendiente";
      case 1:
        return "en consulta";
      case 2:
        return "Completada";
      case 3:
        return "cancelada";
      case 4:
        return "En sala";
      default:
        return "pendiente";
    }
  };

  const getStatusBadge = (status: number) => {
    const estado = mapearEstado(status);
    switch (estado) {
      case "pendiente":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Pendiente
          </Badge>
        );
      case "en consulta":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            En Consulta
          </Badge>
        );
      case "Completada":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Completado
          </Badge>
        );
      case "cancelada":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Cancelada
          </Badge>
        );
      case "En sala":
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 hover:bg-purple-200"
          >
            En Sala
          </Badge>
        );
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  /** Card de un paciente para vista móvil */
  const PacienteDiaCard = ({ patient }: { patient: any }) => {
    const edad =
      new Date().getFullYear() -
      new Date(patient.fecha_nacimiento).getFullYear();

    return (
      <Card className="shadow-sm border border-border/60">
        <CardContent className="p-4 space-y-3">
          {/* Encabezado: nombre + estado */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base leading-tight break-words flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                {patient.nombre}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {edad} años
              </p>
            </div>

            <div className="shrink-0">{getStatusBadge(patient.estado)}</div>
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Hora</span>
              <span className="font-medium text-right">
                {formatTime(patient.hora)}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Motivo</span>
              <span
                className="font-medium text-right break-words"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {patient.motivo}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Precio</span>
              <span className="font-semibold text-right">
                Bs. {patient.price}
              </span>
            </div>
          </div>

          {/* Acción */}
          <Button
            size="sm"
            variant="outline"
            className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            onClick={() =>
              navigate(`/historial-clinico/${patient.idpaciente}`, {
                state: {
                  idcita: patient.idcita,
                  idpaciente: patient.idpaciente,
                },
              })
            }
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Historial
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="page-transition w-full p-4 sm:p-6 md:p-8">
        <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
          Cargando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-transition w-full p-4 sm:p-6 md:p-8">
        <div className="text-center py-8 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-transition w-full p-4 sm:p-6 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            Pacientes del Día
          </h1>
          <p className="text-sm md:text-base text-muted-foreground flex items-center">
            <Calendar className="mr-2 h-4 w-4 shrink-0" />
            {formatDate(currentDate)}
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar paciente..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <Card className="mb-6 md:mb-8 shadow-md border-none overflow-hidden">
        <CardHeader className="bg-medical-light bg-opacity-30 p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 shrink-0 text-medical-dark" />
            Lista de Pacientes Agendados Hoy
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground px-4">
              No hay pacientes agendados para hoy o que coincidan con su
              búsqueda.
            </div>
          ) : (
            <>
              {/* ====== VISTA MÓVIL (cards) ====== */}
              <div className="md:hidden p-3 sm:p-4 space-y-3">
                {filteredPatients.map((patient) => (
                  <PacienteDiaCard
                    key={patient.idcita}
                    patient={patient}
                  />
                ))}
              </div>

              {/* ====== VISTA DESKTOP (tabla) ====== */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4">Nombre</th>
                      <th className="text-left py-4 px-4">Edad</th>
                      <th className="text-left py-4 px-4">Estado</th>
                      <th className="text-left py-4 px-4">Hora</th>
                      <th className="text-left py-4 px-4">Motivo</th>
                      <th className="text-left py-4 px-4">Precio</th>
                      <th className="text-left py-4 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.idcita}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          navigate(
                            `/historial-clinico/${patient.idpaciente}`,
                            {
                              state: {
                                idcita: patient.idcita,
                                idpaciente: patient.idpaciente,
                              },
                            }
                          );
                        }}
                      >
                        <td className="py-5 px-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {patient.nombre}
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          {new Date().getFullYear() -
                            new Date(
                              patient.fecha_nacimiento
                            ).getFullYear()}{" "}
                          años
                        </td>
                        <td className="py-5 px-4">
                          {getStatusBadge(patient.estado)}
                        </td>
                        <td className="py-5 px-4">
                          {formatTime(patient.hora)}
                        </td>
                        <td
                          className="py-5 px-4"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {patient.motivo}
                        </td>
                        <td
                          className="py-5 px-4"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          Bs. {patient.price}
                        </td>
                        <td className="py-5 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-800 h-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/historial-clinico/${patient.idpaciente}`,
                                  {
                                    state: {
                                      idcita: patient.idcita,
                                      idpaciente: patient.idpaciente,
                                    },
                                  }
                                );
                              }}
                            >
                              <FileText className="h-4 w-4 mr-0" />
                              Historial
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PacientesDia;