const NBSP = " ";

export const fcfa = (n) =>
  `${(n || 0).toLocaleString("fr-FR").replace(/[\s\u202f]/g, NBSP)}${NBSP}F`;

export const formatHeure = (hhmmss) => {
  if (!hhmmss) return "";
  const [h, m] = hhmmss.split(":");
  return `${h}${NBSP}h${NBSP}${m}`;
};

export const tiersEnFraction = (t) =>
  t === 1 ? "1/3" : t === 2 ? "2/3" : "3/3";

export const prixPortion = (prixPlat, tiers) => {
  const brut = (prixPlat * tiers) / 3;
  return Math.ceil(brut / 25) * 25;
};

// "Attiéké poulet braisé (sans poisson)" → { nom: "Attiéké poulet braisé", mention: "Sans poisson" }
export const decouperNomPlat = (nom = "") => {
  const m = nom.match(/^(.*?)\s*\((sans [^)]+)\)\s*$/i);
  if (!m) return { nom, mention: null };
  return { nom: m[1], mention: m[2].charAt(0).toUpperCase() + m[2].slice(1) };
};
