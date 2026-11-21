import { BarChart3, CalendarClock, LayoutGrid, Settings, SlidersHorizontal, Sun, Users } from "lucide-react";

// `court` : libellé de la barre du bas ; `mobile: false` : rangé dans « Plus » sur téléphone.
export const ONGLETS_ADMIN = [
  { to: "/admin", label: "Aujourd'hui", court: "Aujourd'hui", end: true, icon: Sun },
  { to: "/admin/statistiques", label: "Statistiques", court: "Stats", icon: BarChart3 },
  { to: "/admin/eleves", label: "Élèves et classes", court: "Élèves", icon: Users },
  { to: "/admin/salle", label: "Plan de salle", court: "Salle", icon: LayoutGrid },
  { to: "/admin/creneaux", label: "Créneaux", icon: CalendarClock, mobile: false },
  { to: "/admin/portions", label: "Portions", icon: SlidersHorizontal, mobile: false },
  { to: "/admin/parametres", label: "Paramètres", icon: Settings, mobile: false },
];
