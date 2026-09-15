import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppSidebar from "./components/AppSidebar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AgendarCita from "./pages/AgendarCita";
import ListaCitas from "./pages/ListaCitas";
import Cobros from "./pages/Cobros";
import ListaPrecios from "./pages/ListaPrecios";
import ListaEspecialidad from "./pages/ListaEspecialidad";
import HistorialPagos from "./pages/HistorialPagos";
import ControlCaja from "./pages/ControlCaja";
import PacientesDia from "./pages/PacientesDia";
import Pacientes from "./pages/Pacientes";
import HistorialClinico from "./pages/HistorialClinico";
import GestionUsuarios from "./pages/GestionUsuarios";
import ListaPacientes from "./pages/ListaPacientes";
import NotFound from "./pages/NotFound";
import DoctorCalendar from "./pages/DoctorCalendar";

const queryClient = new QueryClient();

/* ─────────────────────────────────────────────
   Layout principal con Sidebar
   - Mobile: columna (header arriba + contenido abajo)
   - Desktop: fila (sidebar izquierda + contenido derecha)
   ───────────────────────────────────────────── */
const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col md:flex-row w-full bg-background">
    <AppSidebar />
    <main className="flex-1 min-w-0 transition-all duration-300 p-4 sm:p-6 md:p-8">
      {children}
    </main>
  </div>
);

/* ─────────────────────────────────────────────
   Ruta protegida
   ───────────────────────────────────────────── */
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/* ─────────────────────────────────────────────
   Helper: ruta protegida + layout
   ───────────────────────────────────────────── */
const Page = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

/* ─────────────────────────────────────────────
   Rutas
   ───────────────────────────────────────────── */
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Page><Index /></Page>} />

      <Route path="/agendar-cita" element={<Page><AgendarCita /></Page>} />

      <Route path="/lista-citas" element={<Page><ListaCitas /></Page>} />

      <Route path="/cobros" element={<Page><Cobros /></Page>} />

      <Route path="/historial-pagos" element={<Page><HistorialPagos /></Page>} />

      <Route path="/control-caja" element={<Page><ControlCaja /></Page>} />

      <Route path="/lista-precios" element={<Page><ListaPrecios /></Page>} />

      <Route path="/lista-pacientes" element={<Page><ListaPacientes /></Page>} />

      <Route path="/lista-especialidad" element={<Page><ListaEspecialidad /></Page>} />

      <Route path="/pacientes-dia" element={<Page><PacientesDia /></Page>} />

      <Route path="/pacientes" element={<Page><Pacientes /></Page>} />

      <Route path="/gestion-usuarios" element={<Page><GestionUsuarios /></Page>} />

      <Route
        path="/historial-clinico/:id"
        element={<Page><HistorialClinico isSidebarVisible={true} /></Page>}
      />

      <Route
        path="/agenda"
        element={<Page allowedRoles={["doctor"]}><DoctorCalendar /></Page>}
      />

      <Route
        path="/agenda-doctor"
        element={
          <Page allowedRoles={["administrador", "secretaria"]}>
            <DoctorCalendar />
          </Page>
        }
      />

      <Route path="*" element={<Page><NotFound /></Page>} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;