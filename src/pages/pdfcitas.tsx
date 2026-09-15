import { format } from "date-fns";
import { es } from "date-fns/locale";
import autoTable from "jspdf-autotable";
import type { CitaExportacion } from "@/api/listacitasapi";

// Definir interfaces locales para evitar dependencias
const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente",
  "en consulta": "En Consulta",
  completada: "Completada",
  "En sala": "En sala",
  cancelada: "Cancelada",
};

const mapearEstado = (estadoNumerico: number): string => {
  switch (estadoNumerico) {
    case 0:
      return "pendiente";
    case 1:
      return "en consulta";
    case 2:
      return "completada";
    case 3:
      return "cancelada";
    case 4:
      return "En sala";
    default:
      return "pendiente";
  }
};

const formatFechaSimple = (fechaISO: string) => {
  try {
    const [year, month, day] = fechaISO.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  } catch {
    return fechaISO;
  }
};

interface GenerarPDFProps {
  citasCompletadas: CitaExportacion[];
  exportFechaInicio: Date;
  exportFechaFin: Date;
  tipoReporte: string;
}

export const generarReportePDF = async ({
  citasCompletadas,
  exportFechaInicio,
  exportFechaFin,
  tipoReporte
}: GenerarPDFProps): Promise<void> => {
  try {
    const { jsPDF } = await import("jspdf");
    
    // Crear documento PDF con orientación horizontal
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm para A4 landscape
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm para A4 landscape
    
    // ==============================================
    // CONFIGURACIÓN DE MÁRGENES
    // ==============================================
    
    // Márgenes reducidos para que la tabla ocupe más ancho
    const MARGIN_LEFT = 8;  // Reducido para más ancho
    const MARGIN_RIGHT = 8; // Reducido para más ancho
    
    // ==============================================
    // CONFIGURACIÓN DE DIMENSIONES DEL CUADRO AZUL
    // ==============================================
    
    // ALTURA del cuadro azul
    const CUADRO_ALTURA = 45;
    
    // POSICIÓN VERTICAL del cuadro azul
    const CUADRO_POSICION_Y = 65;
    
    // MARGEN INTERNO del cuadro azul
    const CUADRO_PADDING_INTERNO = 10;
    
    // ESPACIADO entre líneas de texto dentro del cuadro
    const CUADRO_ESPACIADO_LINEAS = 6;
    
    // ==============================================
    
    // Usar fuente standard
    doc.setFont("helvetica", "normal");
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE CITAS MÉDICAS", pageWidth / 2, 25, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Período: ${format(exportFechaInicio, "dd/MM/yyyy", { locale: es })} - ${format(exportFechaFin, "dd/MM/yyyy", { locale: es })}`,
      pageWidth / 2,
      35,
      { align: 'center' }
    );
    
    // Información del tipo de reporte
    let tipoReporteTexto = "Todas las citas";
    if (tipoReporte === 'completadas') tipoReporteTexto = "Solo citas completadas";
    if (tipoReporte === 'canceladas') tipoReporteTexto = "Solo citas canceladas";
    
    doc.setFontSize(10);
    doc.text(`Filtro aplicado: ${tipoReporteTexto}`, MARGIN_LEFT, 45);
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, MARGIN_LEFT, 52);
    doc.text(`Total registros: ${citasCompletadas.length}`, pageWidth - MARGIN_RIGHT, 52, { align: 'right' });
    
    // Línea divisoria
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN_LEFT, 58, pageWidth - MARGIN_RIGHT, 58);
    
    // Estadísticas del período
    const completadas = citasCompletadas.filter(c => c.estado === 2).length;
    const canceladas = citasCompletadas.filter(c => c.estado === 3).length;
    const pendientes = citasCompletadas.filter(c => c.estado === 0).length;
    const enConsulta = citasCompletadas.filter(c => c.estado === 1).length;
    const enSala = citasCompletadas.filter(c => c.estado === 4).length;
    const ingresos = citasCompletadas
      .filter(c => c.estado === 2)
      .reduce((sum, cita) => sum + parseFloat(cita.precio.toString()), 0);
    
    // CALCULAR POSICIÓN DEL CUADRO DE ESTADÍSTICAS
    const statsX = MARGIN_LEFT;
    const statsY = CUADRO_POSICION_Y;
    const statsWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;
    const statsHeight = CUADRO_ALTURA;
    
    // Dibujar fondo del cuadro de estadísticas
    doc.setFillColor(240, 248, 255); // Azul claro
    doc.roundedRect(statsX, statsY, statsWidth, statsHeight, 3, 3, 'F');
    doc.setDrawColor(200, 220, 240); // Borde azul más claro
    doc.setLineWidth(0.5);
    doc.roundedRect(statsX, statsY, statsWidth, statsHeight, 3, 3, 'S');
    
    // Título dentro del cuadro
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 100, 200); // Azul más oscuro
    doc.text("ESTADÍSTICAS DEL PERÍODO", statsX + CUADRO_PADDING_INTERNO, statsY + 10);
    
    // Dibujar línea divisoria dentro del cuadro
    doc.setDrawColor(180, 200, 230);
    doc.line(statsX + 10, statsY + 15, statsX + statsWidth - 10, statsY + 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 80);
    
    // Organizar estadísticas en 2 columnas
    const statsLeft = [
      `• Total: ${citasCompletadas.length}`,
      `• Completadas: ${completadas}`,
      `• Canceladas: ${canceladas}`,
      `• Pendientes: ${pendientes}`
    ];
    
    const statsRight = [
      `• En consulta: ${enConsulta}`,
      `• En sala: ${enSala}`,
      `• Ingresos: Bs. ${ingresos.toFixed(2)}`
    ];
    
    // Calcular posiciones internas del cuadro
    const startXLeft = statsX + CUADRO_PADDING_INTERNO;
    const startXRight = statsX + (statsWidth / 2) + 10;
    const startY = statsY + 22; // Posición Y después del título y línea
    
    // Dibujar estadísticas columna izquierda
    for (let i = 0; i < statsLeft.length; i++) {
      const yPos = startY + (i * CUADRO_ESPACIADO_LINEAS);
      doc.text(statsLeft[i], startXLeft, yPos);
    }
    
    // Dibujar estadísticas columna derecha
    for (let i = 0; i < statsRight.length; i++) {
      const yPos = startY + (i * CUADRO_ESPACIADO_LINEAS);
      doc.text(statsRight[i], startXRight, yPos);
    }
    
    // ==============================================
    // CONFIGURACIÓN DE LA TABLA QUE OCUPA TODO EL ANCHO
    // ==============================================
    
    // Margen entre el cuadro azul y la tabla
    const MARGEN_CUADRO_TABLA = 10;
    
    // Calcular posición Y de inicio de la tabla
    const tableStartY = statsY + statsHeight + MARGEN_CUADRO_TABLA;
    
    // Ancho total disponible para la tabla (menos márgenes)
    const tableAvailableWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;
    
    // Preparar datos para la tabla principal
    const tableData = citasCompletadas.map(cita => {
      const estado = mapearEstado(cita.estado);
      
      // Formatear datos para evitar problemas de longitud
      const paciente = cita.paciente.length > 35 ? cita.paciente.substring(0, 32) + '...' : cita.paciente;
      const doctor = cita.doctor.length > 35 ? cita.doctor.substring(0, 32) + '...' : cita.doctor;
      const servicio = cita.servicio.length > 50 ? cita.servicio.substring(0, 47) + '...' : cita.servicio;
      
      return [
        paciente,
        doctor,
        formatFechaSimple(cita.fecha),
        cita.hora.slice(0, 5),
        servicio,
        `Bs. ${parseFloat(cita.precio.toString()).toFixed(2)}`,
        estadoLabel[estado]
      ];
    });
    
    // Configuración de la tabla
    const tableHeaders = [
      "Paciente",
      "Doctor",
      "Fecha",
      "Hora",
      "Servicio",
      "Precio",
      "Estado"
    ];
    
    // Calcular anchos proporcionales y crear objeto columnStyles con tipos correctos
    const columnStyles: Record<string, any> = {
      0: { cellWidth: tableAvailableWidth * 0.20 }, // 20% para Paciente
      1: { cellWidth: tableAvailableWidth * 0.20 }, // 20% para Doctor
      2: { cellWidth: tableAvailableWidth * 0.10 }, // 10% para Fecha
      3: { cellWidth: tableAvailableWidth * 0.08 }, // 8% para Hora
      4: { cellWidth: tableAvailableWidth * 0.25 }, // 25% para Servicio
      5: { cellWidth: tableAvailableWidth * 0.09 }, // 9% para Precio
      6: { cellWidth: tableAvailableWidth * 0.08 }, // 8% para Estado
    };
    
    // Añadir tabla principal con configuración para ocupar todo el ancho
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: tableStartY,
      margin: { 
        left: MARGIN_LEFT, 
        right: MARGIN_RIGHT,
        top: 5
      },
      styles: {
        fontSize: 8,  // Reducido para caber más texto
        cellPadding: 3,
        overflow: 'linebreak',
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
        valign: 'middle',
        halign: 'left',
        minCellHeight: 7
      },
      headStyles: {
        fillColor: [30, 100, 200],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 4,
        lineWidth: 0.5
      },
      bodyStyles: {
        textColor: [40, 40, 40],
        fontSize: 8,
        cellPadding: 3,
        lineWidth: 0.1,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [248, 252, 255]
      },
      columnStyles: columnStyles,
      tableWidth: 'auto',
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      theme: 'striped',
      didParseCell: (data: any) => {
        // Centrar texto en columnas específicas
        if (data.column.index === 2 || data.column.index === 3 || data.column.index === 6) {
          data.cell.styles.halign = 'center';
        }
        if (data.column.index === 5) { // Precio
          data.cell.styles.halign = 'right';
        }
      },
      didDrawPage: (data: any) => {
        // Número de página
        const pageCount = doc.getNumberOfPages();
        const currentPage = data.pageNumber;
        
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        
        // Footer
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(
          "Sistema de Gestión Médica - Reporte generado automáticamente",
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }
    });
    
    // Información final después de la tabla (solo si hay espacio)
    const finalY = (doc as any).lastAutoTable?.finalY || pageHeight - 30;
    
    if (finalY < pageHeight - 40) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      
      // Resumen final
      const summaryY = finalY + 8;
      doc.text("Resumen del reporte:", MARGIN_LEFT, summaryY);
      
      doc.setFont("helvetica", "normal");
      const summaryText = `• Este reporte incluye ${citasCompletadas.length} citas del período especificado.`;
      doc.text(summaryText, MARGIN_LEFT + 5, summaryY + 6);
      
      if (ingresos > 0) {
        doc.text(`• Ingresos totales por citas completadas: Bs. ${ingresos.toFixed(2)}`, MARGIN_LEFT + 5, summaryY + 12);
      }
      
      // Información de confidencialidad
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(
        "Documento confidencial - Uso interno",
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
    }
    
    // Guardar PDF
    const fechaGeneracion = format(new Date(), 'dd-MM-yyyy_HHmm');
    doc.save(`reporte-citas-${fechaGeneracion}.pdf`);
    
  } catch (error) {
    console.error("Error al generar PDF:", error);
    throw new Error(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Función principal para exportar PDF
interface ExportarPDFProps extends GenerarPDFProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const exportarPDF = async ({
  citasCompletadas,
  exportFechaInicio,
  exportFechaFin,
  tipoReporte,
  onSuccess,
  onError,
}: ExportarPDFProps) => {
  try {
    if (citasCompletadas.length === 0) {
      throw new Error("No hay citas para exportar con los filtros seleccionados");
    }

    // Generar el PDF con el nuevo diseño
    await generarReportePDF({
      citasCompletadas,
      exportFechaInicio,
      exportFechaFin,
      tipoReporte
    });
    
    if (onSuccess) {
      onSuccess();
    }
    
  } catch (error) {
    console.error("Error al generar PDF:", error);
    
    if (onError) {
      onError(error as Error);
    }
    
    throw error;
  }
};

// Componente React para la generación de PDF
import { FC } from "react";

interface PdfCitasProps {
  citas: CitaExportacion[];
  fechaInicio: Date;
  fechaFin: Date;
  tipoReporte?: string;
  titulo?: string;
  onGenerando?: (generando: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const PdfCitas: FC<PdfCitasProps> = ({
  citas,
  fechaInicio,
  fechaFin,
  tipoReporte = "todos",
  titulo = "Generar PDF",
  onGenerando,
  onSuccess,
  onError,
}) => {
  const handleGenerarPDF = async () => {
    if (onGenerando) {
      onGenerando(true);
    }
    
    try {
      await exportarPDF({
        citasCompletadas: citas,
        exportFechaInicio: fechaInicio,
        exportFechaFin: fechaFin,
        tipoReporte,
        onSuccess: () => {
          if (onSuccess) {
            onSuccess();
          }
        },
        onError,
      });
    } finally {
      if (onGenerando) {
        onGenerando(false);
      }
    }
  };

  return (
    <button 
      onClick={handleGenerarPDF}
      className="inline-flex items-center justify-center"
      type="button"
    >
      {titulo}
    </button>
  );
};

export default PdfCitas;