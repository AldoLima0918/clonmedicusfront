// WeeklyCalendarGrid.tsx
import {
  startOfWeek,
  addDays,
  format,
  isSameDay,
  getHours,
  isSameHour,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Appointment } from "@/api/DoctorCalendarApi";

interface WeeklyCalendarGridProps {
  selectedDate: Date;
  currentTime: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onDayClick?: (day: Date) => void;
}

const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7);

const cardColors = [
  "bg-blue-100 border-blue-500 text-blue-900",
  "bg-emerald-100 border-emerald-500 text-emerald-900",
  "bg-purple-100 border-purple-500 text-purple-900",
  "bg-amber-100 border-amber-500 text-amber-900",
  "bg-cyan-100 border-cyan-500 text-cyan-900",
  "bg-pink-100 border-pink-500 text-pink-900",
];

export const WeeklyCalendarGrid = ({
  selectedDate,
  currentTime,
  appointments,
  onAppointmentClick,
  onDayClick,
}: WeeklyCalendarGridProps) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  const getAppointmentsForTimeAndDay = (time: number, date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    return appointments.filter((appointment) => {
      const aptDate = normalizeDate(appointment.date);
      const aptHour = parseInt(appointment.time.split(":")[0], 10);
      return aptDate === formattedDate && aptHour === time;
    });
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-background">
      <table className="border-separate border-spacing-0 w-full min-w-[820px]">
        <thead className="sticky top-0 z-20">
          <tr>
            <th className="w-16 sm:w-20 sticky top-0 left-0 z-30 bg-background border-b border-r p-2 text-xs font-medium text-muted-foreground">
              Hora
            </th>
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              return (
                <th
                  key={day.toString()}
                  onClick={() => onDayClick?.(day)}
                  className={`text-center sticky top-0 z-20 border-b p-2 cursor-pointer transition-colors hover:bg-muted/60 ${
                    isSelected
                      ? "bg-primary/10"
                      : isToday
                      ? "bg-accent/40"
                      : "bg-background"
                  }`}
                >
                  <div className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div
                    className={`text-base sm:text-lg font-bold mt-0.5 inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full ${
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : isSelected
                        ? "bg-primary/20 text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((hour) => {
            const isCurrentHourRow =
              isSameHour(currentTime, new Date().setHours(hour)) &&
              isSameDay(currentTime, selectedDate);
            return (
              <tr key={hour}>
                <td
                  className={`font-medium w-16 sm:w-20 sticky left-0 bg-background z-10 border-b border-r p-2 text-[11px] sm:text-xs text-center align-top ${
                    isCurrentHourRow
                      ? "font-bold text-primary bg-primary/5"
                      : "text-muted-foreground"
                  }`}
                >
                  {`${hour}:00`}
                </td>
                {weekDays.map((day) => {
                  const dayAppointments = getAppointmentsForTimeAndDay(
                    hour,
                    day
                  );
                  const isCurrentTimeSlot =
                    isSameDay(day, currentTime) &&
                    getHours(currentTime) === hour;
                  const isSelectedDay = isSameDay(day, selectedDate);

                  return (
                    <td
                      key={day.toString()}
                      className={`align-top border-b border-r p-1.5 sm:p-2 h-24 sm:h-28 ${
                        isSelectedDay ? "bg-primary/5" : ""
                      } ${
                        isCurrentTimeSlot
                          ? "ring-2 ring-inset ring-primary/60"
                          : ""
                      }`}
                    >
                      <div className="space-y-1.5 h-full">
                        {dayAppointments.map((appointment, index) => (
                          <div
                            key={appointment.id}
                            className={`p-2 text-xs rounded-md border-l-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${
                              cardColors[index % cardColors.length]
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick(appointment);
                            }}
                          >
                            <div className="font-semibold truncate leading-tight">
                              {appointment.patientName}
                            </div>
                            {appointment.services?.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {appointment.services
                                  .slice(0, 2)
                                  .map((service, idx) => (
                                    <div
                                      key={idx}
                                      className="text-[10px] opacity-80 leading-tight truncate"
                                    >
                                      {service.nombre}
                                    </div>
                                  ))}
                                {appointment.services.length > 2 && (
                                  <div className="text-[10px] opacity-70 italic">
                                    +{appointment.services.length - 2} más
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-current/10">
                              <span className="text-[10px] font-medium">
                                {appointment.time}
                              </span>
                              <span className="text-[10px] font-bold">
                                Bs. {Number(appointment.price).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};