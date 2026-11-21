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

// Prix d'une portion d'un menu : prix réglés par le chef, sinon proportionnels au prix entier.
export const prixDePortion = (plat, tiers) =>
  plat?.prix_portions?.[tiers] ?? prixPortion(plat?.prix ?? 0, tiers);

// Suppléments des éléments facultatifs retenus (les obligatoires sont inclus).
export const supplementsChoisis = (plat, elements = []) =>
  (plat?.elements ?? [])
    .filter((e) => !e.obligatoire && elements.includes(e.id))
    .reduce((t, e) => t + e.supplement, 0);

export const prixTotal = (plat, tiers, elements) => prixDePortion(plat, tiers) + supplementsChoisis(plat, elements);

export const elementsParDefaut = (plat) =>
  (plat?.elements ?? []).filter((e) => !e.obligatoire && e.inclus_defaut && !e.bloque && e.disponible).map((e) => e.id);
