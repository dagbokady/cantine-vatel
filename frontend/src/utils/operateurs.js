// Opérateurs Mobile Money proposés. Paiement entièrement simulé : aucun opérateur n'est contacté.
export const OPERATEURS = [
  { id: "wave", nom: "Wave", fond: "#1DC8FF", texte: "#FFFFFF" },
  { id: "mtn", nom: "MTN MoMo", fond: "#FFCB05", texte: "#1A1A1A" },
  { id: "orange", nom: "Orange Money", fond: "#FF7900", texte: "#FFFFFF" },
  { id: "moov", nom: "Moov Money", fond: "#0057A8", texte: "#FFFFFF" },
];

export const operateur = (id) => OPERATEURS.find((o) => o.id === id) ?? OPERATEURS[0];

// "0708124567" -> "07 08 12 45 67"
export const formaterTel = (v) =>
  v.replace(/\D/g, "").slice(0, 10).replace(/(\d{2})(?=\d)/g, "$1 ");
