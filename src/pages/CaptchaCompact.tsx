// components/ui/captcha-compact.tsx
import { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CaptchaCompactProps {
  onVerify: (isValid: boolean) => void;
  resetTrigger?: boolean;
}

const CaptchaCompact = ({ onVerify, resetTrigger }: CaptchaCompactProps) => {
  const [captchaText, setCaptchaText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generar texto aleatorio para el CAPTCHA
  const generateCaptchaText = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Dibujar el CAPTCHA en el canvas
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ruido de fondo
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(100, 100, 100, ${Math.random() * 0.1})`;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        1
      );
    }

    // Líneas de ruido
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * canvas.height);
      ctx.lineTo(canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random() * 0.2})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Dibujar texto
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(15 + i * 22, 22);
      ctx.rotate((Math.random() - 0.5) * 0.3);
      
      ctx.fillStyle = `rgb(${Math.random() * 100 + 50}, ${
        Math.random() * 100 + 50
      }, ${Math.random() * 100 + 50})`;
      
      ctx.font = `bold ${Math.random() * 4 + 20}px Arial`;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // Línea ondulada
    ctx.beginPath();
    ctx.moveTo(5, 15);
    for (let i = 0; i < canvas.width - 10; i += 5) {
      ctx.lineTo(i + 5, 15 + Math.sin(i * 0.1) * 3);
    }
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // Generar nuevo CAPTCHA
  const generateNewCaptcha = () => {
    const newText = generateCaptchaText();
    setCaptchaText(newText);
    setUserInput("");
    setIsValid(null);
    drawCaptcha(newText);
    onVerify(false);
  };

  // Verificar el input del usuario
  const verifyCaptcha = () => {
    const correct = userInput.toUpperCase() === captchaText;
    setIsValid(correct);
    onVerify(correct);
    return correct;
  };

  // Efecto inicial
  useEffect(() => {
    generateNewCaptcha();
  }, []);

  // Resetear cuando cambie el trigger
  useEffect(() => {
    if (resetTrigger) {
      generateNewCaptcha();
    }
  }, [resetTrigger]);

  // Manejar cambio en el input
  const handleInputChange = (value: string) => {
    // Solo permitir letras y números, máximo 5 caracteres
    const filtered = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5);
    setUserInput(filtered);
    setIsValid(null);
    onVerify(false);
  };

  // Verificar automáticamente cuando se complete
  useEffect(() => {
    if (userInput.length === 5) {
      verifyCaptcha();
    }
  }, [userInput]);

  return (
    <div className="space-y-3 p-3 border rounded-md bg-gray-50">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">
          Código de seguridad
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={generateNewCaptcha}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {/* Canvas del CAPTCHA */}
        <div 
          className="border rounded-sm overflow-hidden bg-white cursor-pointer hover:opacity-90 transition-opacity"
          onClick={generateNewCaptcha}
          title="Haz clic para nuevo código"
        >
          <canvas
            ref={canvasRef}
            width={130}
            height={40}
          />
        </div>

        {/* Input y estado */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={userInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Ingrese código"
              className="h-8 text-sm text-center uppercase tracking-widest font-mono"
              maxLength={5}
            />
            {isValid !== null && (
              <div className={`text-xs font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {isValid ? '✓' : '✗'}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Ingrese los 5 caracteres
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaptchaCompact;