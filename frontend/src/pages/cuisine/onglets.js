import { BarChart3, Carrot, ChefHat, ClipboardCheck, LayoutGrid, CalendarDays, UtensilsCrossed } from "lucide-react";

// `court` : libellé de la barre du bas ; `mobile: false` : rangé dans « Plus » sur téléphone.
export const ONGLETS_CUISINE = [
  { to: "/cuisine", label: "Service", end: true, icon: ChefHat },
  { to: "/cuisine/salle", label: "Salle", icon: LayoutGrid },
  { to: "/cuisine/retours", label: "Retour assiettes", court: "Retours", icon: ClipboardCheck },
  { to: "/cuisine/statistiques", label: "Statistiques", court: "Stats", icon: BarChart3 },
  { to: "/cuisine/menus", label: "Menus", icon: CalendarDays, mobile: false },
  { to: "/cuisine/plats", label: "Plats", icon: UtensilsCrossed, mobile: false },
  { to: "/cuisine/ingredients", label: "Ingrédients", icon: Carrot, mobile: false },
];
