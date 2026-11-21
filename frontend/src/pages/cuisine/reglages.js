import { useCallback, useState } from "react";

const aujourdhui = () => new Date().toLocaleDateString("sv-SE");

function lire(cle, defaut) {
  try { return sessionStorage.getItem(cle) || defaut; } catch { return defaut; }
}
function ecrire(cle, v) {
  try { v ? sessionStorage.setItem(cle, v) : sessionStorage.removeItem(cle); } catch { /* stockage indisponible */ }
}

// Date et mode partagés entre Service, Salle et Retours (le mode n'est choisi que si le cuisinier n'est pas affecté).
export function useReglages() {
  const [date, setD] = useState(() => lire("cuisine.date", aujourdhui()));
  const [mode, setM] = useState(() => lire("cuisine.mode", ""));
  const setDate = useCallback((v) => { ecrire("cuisine.date", v); setD(v); }, []);
  const setMode = useCallback((v) => { ecrire("cuisine.mode", v); setM(v); }, []);
  return { date, setDate, mode: mode || undefined, setMode };
}

export const portions = (x) => (x ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 });

export const dateLongue = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export const MODE_LIBELLE = { classe: "Par classe", commande: "Par commande" };

export function heureVague(v) {
  return v?.heure_debut ? v.heure_debut.slice(0, 5) : "Heure libre";
}

