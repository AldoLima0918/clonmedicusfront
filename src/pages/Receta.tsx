import { useState } from "react";
import { Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecetaProps {
  patient: any;
  doctorInfo: {
    nombre_completo: string;
    especialidad: string;
    genero: string;
  };
}

const Receta = ({ patient, doctorInfo }: RecetaProps) => {
  const [prescription, setPrescription] = useState({
    medications: [{ name: "", dosage: "", duration: "", instructions: "" }],
    generalInstructions: "",
    nextAppointment: "",
  });

  const updateMedication = (index: number, field: string, value: string) => {
    const newMedications = [...prescription.medications];
    newMedications[index] = { ...newMedications[index], [field]: value };
    setPrescription({ ...prescription, medications: newMedications });
  };

  const handleAddMedication = () => {
    setPrescription({
      ...prescription,
      medications: [
        ...prescription.medications,
        { name: "", dosage: "", duration: "", instructions: "" },
      ],
    });
  };

  const handleRemoveMedication = (index: number) => {
    const newMedications = [...prescription.medications];
    newMedications.splice(index, 1);
    setPrescription({ ...prescription, medications: newMedications });
  };

  const getSpecialtyWithGender = () => {
    if (!doctorInfo.especialidad) return "";
    const isFemale = doctorInfo.genero === "Femenino";
    const speciality = doctorInfo.especialidad.toLowerCase();

    if (speciality.includes("cardiolog"))
      return isFemale ? "Cardióloga" : "Cardiólogo";
    if (speciality.includes("dermatolog")) return "Dermatóloga";
    if (speciality.includes("pediatr")) return "Pediatra";
    if (speciality.includes("ginecolog"))
      return isFemale ? "Ginecóloga" : "Ginecólogo";
    if (speciality.includes("oftalmolog"))
      return isFemale ? "Oftalmóloga" : "Oftalmólogo";
    if (speciality.includes("neurolog"))
      return isFemale ? "Neuróloga" : "Neurólogo";
    if (speciality.includes("psiquiatr")) return "Psiquiatra";
    if (speciality.includes("traumatolog"))
      return isFemale ? "Traumatóloga" : "Traumatólogo";
    if (speciality.includes("endocrinolog"))
      return isFemale ? "Endocrinóloga" : "Endocrinólogo";
    if (speciality.includes("nefrolog"))
      return isFemale ? "Nefróloga" : "Nefrólogo";
    if (speciality.includes("neumolog"))
      return isFemale ? "Neumóloga" : "Neumólogo e Intensivista";
    if (speciality.includes("intensivismo"))
      return isFemale
        ? "Neumóloga e Intensivista"
        : "Neumólogo e Intensivista";

    return doctorInfo.especialidad;
  };

  const handlePrintPrescription = () => {
    const printContents = document.getElementById("printable-prescription");
    if (printContents) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receta Médica</title>
              <style>
                @page { size: 5.5in 8.5in; margin: 0; }
                @font-face {
                  font-family: 'Breul Grotesk B Light';
                  src: local('Breul Grotesk B Light'), url('https://your-font-url.com/BreulGroteskBLight.woff2') format('woff2');
                  font-weight: normal;
                  font-style: normal;
                }
                html, body {
                  margin: 0; padding: 0; width: 5.5in; height: 8.5in;
                  font-family: 'Breul Grotesk B Light', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  font-size: 12px;
                }
                .printable-receta-container { position: relative; width: 100%; height: 100%; }
                .printable-receta-background {
                  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                  object-fit: fill; object-position: center; z-index: -1;
                  -webkit-print-color-adjust: exact; print-color-adjust: exact;
                }
                .printable-receta-content {
                  position: relative; z-index: 1; width: 100%; height: 100%; box-sizing: border-box;
                }
                .doctor-info { position: absolute; top: calc(2.5cm); left: calc(20px + 0.6cm); text-align: left; }
                .doctor-name { font-weight: bold; font-size: 18px; text-transform: uppercase; }
                .doctor-specialty {
                  font-size: 16px; color: #008fc7; font-weight: bold;
                  letter-spacing: 0.5px; text-transform: uppercase;
                  -webkit-print-color-adjust: exact; print-color-adjust: exact;
                }
                .patient-name {
                  position: absolute; top: calc(15px + 4.25cm); left: calc(50% - 0.5cm);
                  transform: translateX(-50%); font-size: 14px; font-weight: bold; text-transform: uppercase;
                }
                .medication-container { position: absolute; top: calc(200px + 0.55cm); left: calc(20px + 1.5cm); }
                .medication-item { margin-bottom: 14px; }
                .medication-name { font-weight: bold; margin-bottom: 4px; font-size: 16px; }
                .medication-details { margin-left: 15px; font-size: 14px; }
                .general-instructions { margin-top: 20px; margin-left: 20px; }
                .instructions-title { font-weight: bold; margin-bottom: 5px; }
                .footer {
                  position: absolute; bottom: calc(0.3in - 1mm); width: 100%; text-align: center;
                  font-size: 12px; color: #ffffff;
                  -webkit-print-color-adjust: exact; print-color-adjust: exact;
                }
              </style>
            </head>
            <body>
              <div class="printable-receta-container">${printContents.innerHTML}</div>
              <script>
                window.onload = function() {
                  setTimeout(function() { window.print(); window.close(); }, 200);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const formatCurrentDate = () => {
    return new Date().toLocaleDateString("es-BO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="receta-container">
        <Card className="border-2 border-dashed print:border-none print:shadow-none h-full relative">
          <div className="absolute inset-0 z-0">
            <img
              src="/formato.jpg"
              alt="Fondo de receta médica"
              className="w-full h-full object-cover opacity-20"
            />
          </div>

          <CardHeader className="text-center border-b relative z-10 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">
              RECETA MÉDICA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 receta-content relative z-10 p-4 sm:p-6">
            {prescription.medications.map((medication, index) => (
              <div
                key={index}
                className="mb-5 sm:mb-6 pb-4 border-b border-dashed last:border-b-0"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Medicamento</Label>
                    <Input
                      value={medication.name}
                      onChange={(e) =>
                        updateMedication(index, "name", e.target.value)
                      }
                      placeholder="Nombre del medicamento"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Dosis</Label>
                    <Input
                      value={medication.dosage}
                      onChange={(e) =>
                        updateMedication(index, "dosage", e.target.value)
                      }
                      placeholder="Ej: 1 tableta cada 8 horas"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Duración</Label>
                    <Input
                      value={medication.duration}
                      onChange={(e) =>
                        updateMedication(index, "duration", e.target.value)
                      }
                      placeholder="Ej: Por 7 días"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Instrucciones</Label>
                    <Input
                      value={medication.instructions}
                      onChange={(e) =>
                        updateMedication(index, "instructions", e.target.value)
                      }
                      placeholder="Ej: Tomar con alimentos"
                    />
                  </div>
                </div>
                {index > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => handleRemoveMedication(index)}
                    className="w-full sm:w-auto"
                    size="sm"
                  >
                    Eliminar medicamento
                  </Button>
                )}
              </div>
            ))}

            <div className="mt-6">
              <Label>Instrucciones Generales</Label>
              <Textarea
                value={prescription.generalInstructions}
                onChange={(e) =>
                  setPrescription({
                    ...prescription,
                    generalInstructions: e.target.value,
                  })
                }
                placeholder="Ej: Reposo relativo por 3 días"
                rows={3}
              />
            </div>

            <div className="mt-6 print:hidden flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleAddMedication}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Medicamento
              </Button>
              <Button
                onClick={handlePrintPrescription}
                className="w-full sm:w-auto"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Receta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido imprimible (oculto en pantalla) */}
      <div id="printable-prescription" className="hidden">
        <div className="printable-receta-container">
          <img
            src="/formato.jpg"
            alt="Fondo de receta médica"
            className="printable-receta-background"
          />
          <div className="printable-receta-content">
            <div className="doctor-info">
              <div className="doctor-name">
                DR(A). {doctorInfo.nombre_completo}
              </div>
              <div className="doctor-specialty">{getSpecialtyWithGender()}</div>
            </div>

            <div className="patient-name">{patient?.nombre_completo}</div>

            <div className="medication-container">
              {prescription.medications.map((med, index) => (
                <div key={index} className="medication-item">
                  <div className="medication-name">{med.name}</div>
                  <div className="medication-details">
                    <div>Dosis: {med.dosage}</div>
                    <div>Duración: {med.duration}</div>
                    {med.instructions && (
                      <div>Instrucciones: {med.instructions}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {prescription.generalInstructions && (
              <div className="general-instructions">
                <div className="instructions-title">
                  Indicaciones Generales:
                </div>
                <div>{prescription.generalInstructions}</div>
              </div>
            )}

            <div className="footer">Cochabamba, {formatCurrentDate()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receta;