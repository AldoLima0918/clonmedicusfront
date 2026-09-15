import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  ClipboardList,
  FileText,
  List,
  Wallet,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Medicus - Sistema de Gestión Médica";
  }, []);

  // Define cards based on user role
  const getCards = () => {
    if (user?.role === "doctor") {
      return [
        {
          title: "Pacientes del Día",
          description:
            "Consulte los pacientes agendados para hoy y acceda a su historial clínico.",
          icon: ClipboardList,
          path: "/pacientes-dia",
          color: "bg-blue-50",
          iconColor: "text-blue-500",
        },
        {
          title: "Pacientes",
          description:
            "Gestione la base de datos de pacientes y acceda a su historial médico completo.",
          icon: Users,
          path: "/pacientes",
          color: "bg-green-50",
          iconColor: "text-green-500",
        },
      ];
    } else if (user?.role === "secretaria") {
      return [
        {
          title: "Agendar Cita",
          description:
            "Agende nuevas citas y gestione el calendario de atención médica.",
          icon: Calendar,
          path: "/agendar-cita",
          color: "bg-medical-light",
          iconColor: "text-medical-dark",
        },
        {
          title: "Lista de Citas",
          description:
            "Vea y gestione todas las citas programadas en el sistema.",
          icon: List,
          path: "/lista-citas",
          color: "bg-purple-50",
          iconColor: "text-purple-500",
        },
        {
          title: "Cobros en Caja",
          description:
            "Registre pagos y gestione las transacciones financieras diarias.",
          icon: DollarSign,
          path: "/cobros",
          color: "bg-amber-50",
          iconColor: "text-amber-500",
        },
        {
          title: "Control de Caja",
          description: "Gestione los ingresos y egresos diarios de la caja.",
          icon: Wallet,
          path: "/control-caja",
          color: "bg-red-50",
          iconColor: "text-red-500",
        },
        {
          title: "Historial de Pagos",
          description:
            "Consulte el historial de pagos realizados por los pacientes.",
          icon: FileText,
          path: "/historial-pagos",
          color: "bg-teal-50",
          iconColor: "text-teal-500",
        },
      ];
    } else {
      // Administrador - todos los módulos
      return [
        {
          title: "Gestión de Citas",
          description:
            "Agende nuevas citas y gestione el calendario de atención médica.",
          icon: Calendar,
          path: "/agendar-cita",
          color: "bg-medical-light",
          iconColor: "text-medical-dark",
        },
        {
          title: "Gestión de Pagos",
          description:
            "Registre pagos, vea el historial de transacciones y gestione la caja.",
          icon: DollarSign,
          path: "/cobros",
          color: "bg-amber-50",
          iconColor: "text-amber-500",
        },
        {
          title: "Lista de Precios",
          description:
            "Consulte y actualice los precios de los servicios médicos.",
          icon: FileText,
          path: "/lista-precios",
          color: "bg-purple-50",
          iconColor: "text-purple-500",
        },
        {
          title: "Gestión de Usuarios",
          description: "Administre doctores y secretarias en el sistema.",
          icon: UserPlus,
          path: "/gestion-usuarios",
          color: "bg-pink-50",
          iconColor: "text-pink-500",
        },
      ];
    }
  };

  const cards = getCards();

  return (
    <div className="page-transition w-full p-3 sm:p-6 md:p-8">
      <header className="mb-6 sm:mb-10 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 sm:mb-4">
          Bienvenido a Medicus
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Administre pacientes, citas, historiales clínicos y pagos de forma
          rápida e intuitiva.
        </p>
      </header>

      {/* 
        Grid responsivo:
        - Móvil: 2 columnas
        - sm (640px+): 2 columnas
        - md (768px+): 3 columnas
        - lg (1024px+): 3 columnas
        - xl (1280px+): 4 columnas
      */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
        {cards.map((card, index) => (
          <Card
            key={index}
            className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
          >
            <CardContent className="p-3 sm:p-4 md:p-6 flex flex-col flex-1">
              <div
                className={`aspect-[3/2] ${card.color} rounded-lg flex items-center justify-center mb-3 sm:mb-4 md:mb-6`}
              >
                <card.icon
                  className={`h-10 w-10 sm:h-14 sm:w-14 md:h-20 md:w-20 ${card.iconColor} opacity-70`}
                />
              </div>

              <h2 className="text-sm sm:text-lg md:text-2xl font-semibold mb-1 sm:mb-2 leading-tight">
                {card.title}
              </h2>

              <p className="text-[11px] sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4 line-clamp-3 flex-1">
                {card.description}
              </p>

              <Button
                onClick={() => navigate(card.path)}
                className="w-full group text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10 px-2 sm:px-4"
              >
                <span className="truncate">Ir a {card.title}</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;