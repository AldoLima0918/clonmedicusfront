// DoctorCalendar.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  format,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getHours,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyCalendarGrid } from "@/components/WeeklyCalendarGrid";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchDoctorAppointments, Appointment } from "@/api/DoctorCalendarApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDoctors } from "@/hooks/useDoctors";
import { useNavigate } from "react-router-dom";

interface DoctorCalendarProps {
  doctorId?: number | null;
}

const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7);

const DoctorCalendar = ({ doctorId: propDoctorId }: DoctorCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { user } = useAuth();
  const [view, setView] = useState<"day" | "week">("day");
  const [loading, setLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(
    propDoctorId || null
  );
  const navigate = useNavigate();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

  const { doctors, loading: loadingDoctors } = useDoctors(
    user?.role === "administrador" || user?.role === "secretaria"
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDoctorId, selectedDate, view]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let idToFetch = selectedDoctorId;
      if (!idToFetch && user?.role === "doctor") {
        idToFetch = Number(user.id);
      }

      if (!idToFetch) {
        setAppointments([]);
        return;
      }

      let data: Appointment[] = [];

      if (view === "day") {
        data = await fetchDoctorAppointments(
          idToFetch,
          format(selectedDate, "yyyy-MM-dd")
        );
      } else {
        const weekEnd = addDays(weekStart, 6);
        data = await fetchDoctorAppointments(
          idToFetch,
          format(weekStart, "yyyy-MM-dd"),
          format(weekEnd, "yyyy-MM-dd")
        );
      }

      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setSelectedDate((prev) =>
      view === "day" ? subDays(prev, 1) : subWeeks(prev, 1)
    );
  };

  const handleNext = () => {
    setSelectedDate((prev) =>
      view === "day" ? addDays(prev, 1) : addWeeks(prev, 1)
    );
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const redirectToClinicHistory = (appointment: Appointment) => {
    if (user.role != "doctor") return;
    navigate(`/historial-clinico/${appointment.patientId}`, {
      state: { idcita: appointment.id, idpaciente: appointment.patientId },
    });
  };

  const scrollToCurrentTime = () => {
    if (view === "day") {
      const currentHour = getHours(currentTime);
      const timeSlotIndex = timeSlots.findIndex((slot) => slot >= currentHour);
      if (timeSlotIndex >= 0) {
        const scrollContainer = document.querySelector(".scroll-area");
        const timeSlotElement =
          document.querySelectorAll(".time-slot")[timeSlotIndex];
        if (scrollContainer && timeSlotElement) {
          const scrollPosition =
            timeSlotElement.getBoundingClientRect().top -
            scrollContainer.getBoundingClientRect().top +
            scrollContainer.scrollTop -
            100;
          scrollContainer.scrollTo({ top: scrollPosition, behavior: "smooth" });
        }
      }
    }
  };

  useEffect(() => {
    scrollToCurrentTime();
  }, [view, currentTime]);

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen text-muted-foreground">
        Cargando...
      </div>
    );
  }

  const showDoctorSelect =
    user?.role === "administrador" || user?.role === "secretaria";

  return (
    <div className="page-transition w-full h-screen flex flex-col">
      {/* ===== HEADER ===== */}
      <div className="px-4 sm:px-6 py-4 border-b bg-gradient-to-b from-background to-muted/40 space-y-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold leading-tight">
                Agenda de Citas
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Gestiona y visualiza las citas médicas
              </p>
            </div>
          </div>

          {showDoctorSelect && (
            <Select
              value={selectedDoctorId?.toString() || ""}
              onValueChange={(value) => setSelectedDoctorId(Number(value))}
              disabled={loadingDoctors}
            >
              <SelectTrigger className="w-full sm:w-[240px] h-9 text-sm">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Seleccionar doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              className="h-9 w-9 shrink-0"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 sm:flex-initial min-w-[160px] sm:min-w-[220px] px-3 py-1.5 rounded-md bg-background border text-center">
              <div className="text-sm font-semibold capitalize leading-tight">
                {view === "day"
                  ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
                  : format(selectedDate, "MMMM yyyy", { locale: es })}
              </div>
              {view === "week" && (
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {format(weekStart, "d MMM", { locale: es })} al{" "}
                  {format(addDays(weekStart, 6), "d MMM", { locale: es })}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-9 w-9 shrink-0"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "day" | "week")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-2 h-9 w-full sm:w-auto">
              <TabsTrigger
                value="day"
                className="text-xs sm:text-sm h-8 px-3 gap-1.5"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Día
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="text-xs sm:text-sm h-8 px-3 gap-1.5"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Semana
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* ===== CONTENIDO ===== */}
      <div className="flex-1 min-h-0 p-2 sm:p-4">
        <Tabs value={view} className="w-full h-full flex flex-col">
          {/* ===== VISTA DÍA ===== */}
          <TabsContent value="day" className="mt-0 flex-1 min-h-0">
            <ScrollArea className="h-full scroll-area">
              {/* min-w-0 en el grid para que la columna 1fr pueda encogerse */}
              <div className="grid grid-cols-[2.5rem_1fr] sm:grid-cols-[4rem_1fr] gap-2 sm:gap-4 pr-2 min-w-0">
                {timeSlots.map((hour) => {
                  const hourAppointments = appointments.filter(
                    (apt) => parseInt(apt.time.split(":")[0]) === hour
                  );
                  const isCurrentHour =
                    getHours(currentTime) === hour &&
                    isSameDay(currentTime, selectedDate);

                  return (
                    <div key={hour} className="contents">
                      {/* Columna de hora */}
                      <div
                        className={`time-slot flex items-start justify-end pt-1 text-[10px] sm:text-xs select-none ${
                          isCurrentHour
                            ? "font-bold text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {`${hour}:00`}
                      </div>

                      {/* Columna de citas - min-w-0 para permitir truncate */}
                      <div
                        className={`min-h-[4rem] sm:min-h-[5rem] border-b pb-1 sm:pb-2 min-w-0 ${
                          isCurrentHour ? "border-primary border-t-2" : ""
                        }`}
                      >
                        {hourAppointments.length === 0 ? (
                          <div className="h-full" />
                        ) : (
                          <div className="space-y-1 sm:space-y-2 min-w-0">
                            {hourAppointments.map((appointment) => (
                              <Card
                                key={appointment.id}
                                className={`p-2.5 sm:p-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] w-full overflow-hidden ${
                                  isCurrentHour ? "border-primary" : ""
                                }`}
                                onClick={() =>
                                  redirectToClinicHistory(appointment)
                                }
                              >
                                <div className="flex flex-col gap-1 w-full min-w-0">
                                  {/* Nombre */}
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Clock className="h-3 w-3 text-primary shrink-0" />
                                    <h4 className="font-semibold text-sm sm:text-base truncate min-w-0">
                                      {appointment.patientName}
                                    </h4>
                                  </div>

                                  {/* Servicios */}
                                  <div className="space-y-0.5 min-w-0">
                                    {appointment.services.map(
                                      (service, idx) => (
                                        <p
                                          key={idx}
                                          className="text-xs text-muted-foreground truncate"
                                        >
                                          • {service.nombre}
                                        </p>
                                      )
                                    )}
                                  </div>

                                  {/* Hora y precio */}
                                  <div className="flex items-center justify-between gap-2 mt-1.5 pt-2 border-t min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-primary shrink-0">
                                      {appointment.time} hrs
                                    </p>
                                    <p className="text-xs sm:text-sm font-semibold shrink-0">
                                      Bs.{" "}
                                      {Number(appointment.price).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ===== VISTA SEMANA ===== */}
          <TabsContent value="week" className="m-0 mt-0 flex-1 min-h-0">
            <ScrollArea className="h-full scroll-area-week">
              <WeeklyCalendarGrid
                selectedDate={selectedDate}
                currentTime={currentTime}
                appointments={appointments}
                onAppointmentClick={redirectToClinicHistory}
                onDayClick={(day) => {
                  setSelectedDate(day);
                  setView("day");
                }}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorCalendar;