import { useState } from "react";
import { AlertTriangle, PieChart, Sparkles, Users, Utensils } from "lucide-react";

// Calques superposables : chacun s'active indépendamment des autres.
export const CALQUES = [
  { id: "allergies", label: "Allergies", icone: AlertTriangle },
  { id: "portions", label: "Portions", icone: PieChart },
  { id: "plats", label: "Plats", icone: Utensils },
  { id: "classes", label: "Classes", icone: Users },
  { id: "particularites", label: "Particularités", icone: Sparkles },
];

export function useCalques(cle, defaut) {
  const [calques, setCalques] = useState(() => {
    try { const v = JSON.parse(localStorage.getItem(cle)); return new Set(Array.isArray(v) ? v : defaut); } catch { return new Set(defaut); }
  });
  const basculer = (id) => setCalques((c) => {
    const n = new Set(c);
    if (n.has(id)) n.delete(id); else n.add(id);
    try { localStorage.setItem(cle, JSON.stringify([...n])); } catch { /* sans stockage */ }
    return n;
  });
  return [calques, basculer];
}

