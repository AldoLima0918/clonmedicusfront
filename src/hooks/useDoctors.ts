import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Doctor {
  id: number;
  name: string;
}

export const useDoctors = (enabled: boolean = true) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled) return;

    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/doctors`);
        if (!response.ok) {
          throw new Error("Error al obtener la lista de doctores");
        }
        const data = await response.json();
        setDoctors(data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [enabled, user]);

  return { doctors, loading };
};
