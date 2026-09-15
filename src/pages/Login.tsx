// Login.tsx - solo se agregan las líneas necesarias
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CaptchaCompact from "@/pages/CaptchaCompact"; // <-- Agregar esta línea
import { User, Key, Eye, EyeOff, AlertCircle } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false); // <-- Agregar esta línea
  const [captchaResetTrigger, setCaptchaResetTrigger] = useState(false); // <-- Agregar esta línea
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCaptchaVerify = (isValid: boolean) => { // <-- Agregar esta función
    setIsCaptchaVerified(isValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError("Por favor, complete todos los campos");
      return;
    }

    // Validar CAPTCHA <-- Agregar esta validación
    if (!isCaptchaVerified) {
      setError("Por favor, complete la verificación de seguridad");
      setCaptchaResetTrigger(prev => !prev);
      return;
    }

    setIsLoading(true);

    const success = await login(username, password);

    if (success) {
      navigate("/");
    } else {
      setError("Credenciales incorrectas. Por favor, intente nuevamente.");
      // Resetear CAPTCHA en error <-- Agregar esta línea
      setIsCaptchaVerified(false);
      setCaptchaResetTrigger(prev => !prev);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-medical-light/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <img
            src="/mlogo.jpg"
            alt="Medicus Logo"
            className="mx-auto w-50 h-50 mb-4"
          />
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/15 border border-destructive/50 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* CAPTCHA Compacto - Agregar este bloque */}
            <CaptchaCompact
              onVerify={handleCaptchaVerify}
              resetTrigger={captchaResetTrigger}
            />

          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isCaptchaVerified} // <-- Modificar aquí
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-6 text-sm text-center text-muted-foreground">
        <a
          href="https://wa.me/+59167461937"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-medical-dark"
        >
          Contactar con soporte
        </a>
      </div>
    </div>
  );
};

export default Login;