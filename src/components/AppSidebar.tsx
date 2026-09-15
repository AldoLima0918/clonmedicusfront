import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  List,
  DollarSign,
  FileText,
  Menu,
  X,
  History,
  Wallet,
  Users,
  ClipboardList,
  LogOut,
  UserPlus,
  Key,
  ChevronLeft,
  ChevronDown,
  Headphones,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { updateUserPassword } from "@/api/users";

type NavItem = {
  name: string;
  path: string;
  icon: React.ElementType;
  group?: string;
  roles: string[];
};

const navItems: NavItem[] = [
  {
    name: "Pacientes del Día",
    path: "/pacientes-dia",
    icon: ClipboardList,
    group: "pacientes",
    roles: ["doctor"],
  },
  {
    name: "Agenda",
    path: "/agenda",
    icon: Calendar,
    group: "pacientes",
    roles: ["doctor"],
  },
  {
    name: "Pacientes",
    path: "/pacientes",
    icon: Users,
    group: "pacientes",
    roles: ["doctor"],
  },
  {
    name: "Agendar Cita",
    path: "/agendar-cita",
    icon: Calendar,
    group: "citas",
    roles: ["administrador", "secretaria"],
  },
  {
    name: "Lista de Citas",
    path: "/lista-citas",
    icon: List,
    group: "citas",
    roles: ["administrador", "secretaria"],
  },
  {
    name: "Cobros en Caja",
    path: "/cobros",
    icon: DollarSign,
    group: "finanzas",
    roles: ["administrador", "secretaria"],
  },
  {
    name: "Historial de Pagos",
    path: "/historial-pagos",
    icon: History,
    group: "finanzas",
    roles: ["administrador", "secretaria"],
  },
  {
    name: "Control de Caja",
    path: "/control-caja",
    icon: Wallet,
    group: "finanzas",
    roles: ["administrador", "secretaria"],
  },
  {
    name: "Lista de Precios",
    path: "/lista-precios",
    icon: FileText,
    group: "finanzas",
    roles: ["administrador", "secretaria"],
  },
  {
    name: "Lista de Especialidades",
    path: "/lista-especialidad",
    icon: FileText,
    group: "finanzas",
    roles: ["administrador"],
  },
  {
    name: "Gestión de Usuarios",
    path: "/gestion-usuarios",
    icon: UserPlus,
    group: "administracion",
    roles: ["administrador"],
  },
  {
    name: "Lista de Pacientes",
    path: "/lista-pacientes",
    icon: List,
    group: "citas",
    roles: ["administrador", "secretaria"],
  },
  {
    name: "Agenda Doctores",
    path: "/agenda-doctor",
    icon: Calendar,
    group: "citas",
    roles: ["administrador", "secretaria"],
  },
];

const AppSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const storedUserStr = localStorage.getItem("currentUser");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  const user = storedUser || authUser;

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cerrar sidebar al cambiar de ruta en mobile
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Bloquear scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobile, isMobileOpen]);

  if (authLoading && !storedUser) {
    return (
      <>
        <div className="md:hidden h-14 w-full bg-background border-b border-border/40 flex items-center px-4 shrink-0">
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-border items-center justify-center hidden md:flex">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) return null;

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const groupedItems = filteredNavItems.reduce((groups, item) => {
    const group = item.group || "other";
    return {
      ...groups,
      [group]: [...(groups[group] || []), item],
    };
  }, {} as Record<string, NavItem[]>);

  const groupLabels: Record<string, string> = {
    pacientes: "Pacientes",
    citas: "Citas",
    finanzas: "Finanzas",
    administracion: "Administración",
    other: "Otros",
  };

  const handleLogout = () => {
    closeMobileSidebar();
    logout();
    navigate("/login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Ambos campos de contraseña son requeridos",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las nuevas contraseñas no coinciden",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await updateUserPassword(user.id, newPassword);

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente",
      });

      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      administrador: "Administrador",
      secretaria: "Secretaria",
      doctor: "Doctor",
    };
    return roleMap[role] || role;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // En mobile, el sidebar siempre se muestra expandido (w-64) cuando está abierto
  const effectiveCollapsed = isMobile ? false : isCollapsed;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          MOBILE: Header que forma parte del flujo (flex-col).
      ═══════════════════════════════════════════════════════════ */}
      <div className="md:hidden w-full h-14 shrink-0 bg-background border-b border-border/40 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "h-9 w-9 rounded-lg",
            "text-foreground",
            "hover:bg-accent/60",
            "focus:outline-none focus-visible:outline-none",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "border-0 ring-0 outline-none",
            "active:scale-95 transition-transform"
          )}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </Button>

        <span className="ml-3 text-sm font-semibold text-foreground truncate">
          Medicus
        </span>
      </div>

      {/* ── Overlay mobile ───────────────────────────── */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside
        className={cn(
          "z-40 print:hidden",
          "bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95",
          "border-r border-border/60 backdrop-blur-xl",
          "shadow-[4px_0_24px_-8px_rgba(0,0,0,0.08)]",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",

          // ── DESKTOP: sticky, colapsable ──────────
          !isMobile && [
            "sticky top-0 h-screen shrink-0",
            isCollapsed ? "w-20" : "w-64",
          ],

          // ── MOBILE: fixed, deslizable, dvh + safe area ────────────
          isMobile && [
            "fixed left-0 top-0 w-64",
            // dvh en vez de vh para respetar la barra del navegador (iPhone)
            "h-[100dvh]",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
          ]
        )}
        style={
          isMobile
            ? {
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }
            : undefined
        }
        data-sidebar
      >
        <div className="flex h-full flex-col">
          {/* ── Header / Logo ───────────────────────────── */}
          <div
            className={cn(
              "relative flex items-center gap-2 px-4 pt-5 pb-4",
              effectiveCollapsed && "justify-center px-2"
            )}
          >
            {!effectiveCollapsed && (
              <div className="flex-1 flex items-center justify-center py-3 px-3">
                <img
                  src="/mlogo.jpg"
                  alt="Medicus Logo"
                  className="w-full h-auto object-contain transition-all duration-300"
                />
              </div>
            )}

            {/* Botón colapsar solo en desktop */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={cn(
                  "h-9 w-9 shrink-0 rounded-xl",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-accent/80 transition-all duration-200",
                  "focus:outline-none focus-visible:outline-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "active:scale-95",
                  isCollapsed && "mx-auto"
                )}
                aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
              </Button>
            )}
          </div>

          {/* ── Tarjeta de usuario ──────────────────────── */}
          {!effectiveCollapsed ? (
            <div className="px-4 pb-4">
              {/* ── MÓVIL: card clickeable con DropdownMenu ── */}
              {isMobile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "relative w-full overflow-hidden rounded-2xl p-3 text-left",
                        "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
                        "border border-primary/15",
                        "shadow-sm",
                        "transition-all duration-200",
                        "hover:border-primary/30 hover:shadow-md",
                        "active:scale-[0.98]",
                        "focus:outline-none focus-visible:outline-none"
                      )}
                    >
                      <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />

                      <div className="relative flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            "bg-gradient-to-br from-primary to-primary/70",
                            "text-primary-foreground font-semibold text-sm",
                            "shadow-md shadow-primary/20"
                          )}
                        >
                          {getInitials(user.name || "U")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground leading-tight">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground mt-0.5">
                            {formatRoleName(user.role)}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-[calc(100%-2rem)] max-w-[240px]"
                  >
                    <DropdownMenuItem
                      onSelect={() => {
                        setTimeout(() => setPasswordDialogOpen(true), 50);
                      }}
                      className="cursor-pointer gap-2"
                    >
                      <Key className="h-4 w-4 text-primary" />
                      Cambiar Contraseña
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="cursor-pointer gap-2">
                      <a
                        href="https://wa.me/+59167461937"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Headphones className="h-4 w-4 text-primary" />
                        Soporte técnico
                      </a>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onSelect={handleLogout}
                      className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* ── DESKTOP: card normal (sin dropdown) ── */
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-3",
                    "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
                    "border border-primary/15",
                    "shadow-sm"
                  )}
                >
                  <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-primary/20 blur-2xl" />

                  <div className="relative flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        "bg-gradient-to-br from-primary to-primary/70",
                        "text-primary-foreground font-semibold text-sm",
                        "shadow-md shadow-primary/20"
                      )}
                    >
                      {getInitials(user.name || "U")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground leading-tight">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground mt-0.5">
                        {formatRoleName(user.role)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center pb-4">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer",
                        "bg-gradient-to-br from-primary to-primary/70",
                        "text-primary-foreground font-semibold text-xs",
                        "shadow-md shadow-primary/20",
                        "transition-transform hover:scale-105"
                      )}
                    >
                      {getInitials(user.name || "U")}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRoleName(user.role)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Separador */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* ── Navegación ──────────────────────────────── */}
          <nav
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sidebar-scroll",
              // En móvil agregamos padding extra abajo para que las últimas
              // opciones no queden pegadas a la barra del navegador
              isMobile && "pb-6"
            )}
          >
            <TooltipProvider delayDuration={100}>
              <div className="flex flex-col gap-5">
                {Object.entries(groupedItems).map(
                  ([groupKey, items], groupIndex) => (
                    <div key={groupKey} className="space-y-1.5">
                      {!effectiveCollapsed && (
                        <div className="flex items-center gap-2 px-3 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-[0.12em] text-muted-foreground/70">
                            {groupLabels[groupKey]}
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                        </div>
                      )}

                      {effectiveCollapsed && groupIndex > 0 && (
                        <div className="mx-auto mb-2 h-px w-6 bg-border/60" />
                      )}

                      <div className="space-y-1">
                        {items.map((item) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <Tooltip key={item.path}>
                              <TooltipTrigger asChild>
                                <Link
                                  to={item.path}
                                  onClick={closeMobileSidebar}
                                  className={cn(
                                    "group relative flex items-center rounded-xl",
                                    "transition-all duration-200 ease-out",
                                    "active:scale-[0.98]",
                                    effectiveCollapsed
                                      ? "justify-center h-11 w-11 mx-auto"
                                      : "gap-3 px-3 py-2.5",
                                    isActive
                                      ? [
                                          "bg-gradient-to-r from-primary to-primary/90",
                                          "text-primary-foreground",
                                          "shadow-md shadow-primary/25",
                                          "font-semibold",
                                        ]
                                      : [
                                          "text-muted-foreground",
                                          "hover:bg-accent/70 hover:text-foreground",
                                          "hover:translate-x-0.5",
                                        ]
                                  )}
                                >
                                  <item.icon
                                    className={cn(
                                      "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                                      !isActive && "group-hover:scale-110"
                                    )}
                                  />

                                  {!effectiveCollapsed && (
                                    <span className="truncate text-sm">
                                      {item.name}
                                    </span>
                                  )}

                                  {isActive && !effectiveCollapsed && (
                                    <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-primary-foreground/90 shadow-sm" />
                                  )}

                                  {!isActive && (
                                    <span className="pointer-events-none absolute inset-0 rounded-xl bg-primary/0 transition-colors duration-200 group-hover:bg-primary/[0.04]" />
                                  )}
                                </Link>
                              </TooltipTrigger>

                              {effectiveCollapsed && (
                                <TooltipContent
                                  side="right"
                                  sideOffset={8}
                                  className="font-medium"
                                >
                                  {item.name}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </TooltipProvider>
          </nav>

          {/* ── Footer ──────────────────────────────────── */}
          <div
            className={cn(
              "mt-auto p-3 pt-2",
              // En móvil más padding abajo por si la barra del navegador
              // aún tapa un poco
              isMobile && "pb-5"
            )}
          >
            <div className="mb-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="space-y-1.5">
              {/* ── Cambiar contraseña ── (oculto en móvil) */}
              <div className="hidden md:block">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setPasswordDialogOpen(true)}
                        className={cn(
                          "group flex items-center rounded-xl w-full",
                          "text-muted-foreground",
                          "transition-all duration-200",
                          "hover:bg-accent/70 hover:text-foreground",
                          "focus:outline-none focus-visible:outline-none",
                          "active:scale-[0.98]",
                          effectiveCollapsed
                            ? "justify-center h-11 w-11 mx-auto"
                            : "gap-3 px-3 py-2.5"
                        )}
                      >
                        <Key className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:rotate-12" />
                        {!effectiveCollapsed && (
                          <span className="text-sm font-medium">
                            Cambiar Contraseña
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {effectiveCollapsed && (
                      <TooltipContent side="right" sideOffset={8}>
                        Cambiar Contraseña
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* ── Soporte técnico ── (oculto en móvil) */}
              <div className="hidden md:block">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href="https://wa.me/+59167461937"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeMobileSidebar}
                        className={cn(
                          "group relative flex items-center overflow-hidden rounded-xl",
                          "border border-primary/15",
                          "bg-gradient-to-br from-primary/[0.08] to-primary/[0.02]",
                          "text-muted-foreground",
                          "transition-all duration-200",
                          "hover:border-primary/30 hover:from-primary/15 hover:to-primary/5",
                          "hover:text-foreground active:scale-[0.98]",
                          effectiveCollapsed
                            ? "justify-center h-11 w-11 mx-auto"
                            : "gap-3 px-3 py-2.5"
                        )}
                      >
                        <Headphones className="h-[18px] w-[18px] shrink-0 text-primary transition-transform group-hover:scale-110" />
                        {!effectiveCollapsed && (
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">
                              Soporte técnico
                            </p>
                            <p className="text-[11px] text-muted-foreground/80 leading-tight mt-0.5">
                              Estamos para ayudarte
                            </p>
                          </div>
                        )}
                        {!effectiveCollapsed && (
                          <Sparkles className="h-3.5 w-3.5 text-primary/60 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </a>
                    </TooltipTrigger>
                    {effectiveCollapsed && (
                      <TooltipContent side="right" sideOffset={8}>
                        Contactar soporte técnico
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* ── Cerrar sesión ── (oculto en móvil) */}
              <div className="hidden md:block">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleLogout}
                        className={cn(
                          "group flex items-center rounded-xl w-full",
                          "text-muted-foreground",
                          "transition-all duration-200",
                          "hover:bg-destructive/10 hover:text-destructive",
                          "focus:outline-none focus-visible:outline-none",
                          "active:scale-[0.98]",
                          effectiveCollapsed
                            ? "justify-center h-11 w-11 mx-auto"
                            : "gap-3 px-3 py-2.5"
                        )}
                      >
                        <LogOut className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:-translate-x-0.5" />
                        {!effectiveCollapsed && (
                          <span className="text-sm font-medium">
                            Cerrar Sesión
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {effectiveCollapsed && (
                      <TooltipContent side="right" sideOffset={8}>
                        Cerrar Sesión
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Estilos scrollbar */}
        <style>{`
          .sidebar-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: hsl(var(--border));
            border-radius: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
          }
        `}</style>
      </aside>

      {/* ── Dialog para cambiar contraseña ── */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <form onSubmit={handleChangePassword}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Cambiar Contraseña
              </DialogTitle>
              <DialogDescription>
                Establezca una nueva contraseña para su cuenta. La contraseña
                debe tener al menos 6 caracteres.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                />
                {newPassword && newPassword.length < 6 && (
                  <p className="text-sm text-red-500">
                    La contraseña debe tener al menos 6 caracteres
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                  disabled={isLoading}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-500">
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="flex-col xs:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                disabled={isLoading}
                className="w-full xs:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                className="w-full xs:w-auto"
              >
                {isLoading ? "Actualizando..." : "Cambiar Contraseña"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppSidebar;