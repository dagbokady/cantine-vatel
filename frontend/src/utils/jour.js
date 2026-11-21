const iso = (d) => d.toLocaleDateString("sv-SE");

export const estAujourdhui = (date) => date === iso(new Date());

// « aujourd'hui », « demain » ou « lundi 23 novembre ».
export function libelleJour(date) {
  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  if (estAujourdhui(date)) return "aujourd'hui";
  if (date === iso(demain)) return "demain";
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// Mode borne : appareil partagé de l'école, déconnexion automatique après la commande.
const CLE_BORNE = "mode.borne";
export const estBorne = () => {
  try { return sessionStorage.getItem(CLE_BORNE) === "1"; } catch { return false; }
};
export const activerBorne = (actif) => {
  try { if (actif) sessionStorage.setItem(CLE_BORNE, "1"); else sessionStorage.removeItem(CLE_BORNE); } catch { /* sans stockage */ }
};
