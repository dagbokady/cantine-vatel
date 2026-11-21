import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useReservation } from "../../hooks/useReservation";
import { estBorne } from "../../utils/jour";

const INACTIVITE_MS = 120000;
const EVENEMENTS = ["pointerdown", "keydown", "scroll", "touchstart"];

// Borne partagée : un élève parti sans terminer ne laisse pas sa session ouverte.
export default function VeilleBorne() {
  const { user, logout } = useAuth();
  const { reset } = useReservation();
  const navigate = useNavigate();
  const actif = !!user && user.role === "eleve" && estBorne();

  useEffect(() => {
    if (!actif) return;
    let t;
    const relancer = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        reset();
        logout();
        navigate("/borne", { replace: true });
      }, INACTIVITE_MS);
    };
    relancer();
    EVENEMENTS.forEach((e) => window.addEventListener(e, relancer, { passive: true }));
    return () => {
      clearTimeout(t);
      EVENEMENTS.forEach((e) => window.removeEventListener(e, relancer));
    };
  }, [actif, logout, navigate, reset]);

  return null;
}
