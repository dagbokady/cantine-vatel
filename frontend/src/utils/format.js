export const fcfa = (n) =>
  `${(n || 0).toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;

export const formatHeure = (hhmmss) => {
  if (!hhmmss) return "";
  const [h, m] = hhmmss.split(":");
  return `${h}h${m}`;
};

export const tiersEnFraction = (t) =>
  t === 1 ? "1/3" : t === 2 ? "2/3" : "3/3";

export const prixPortion = (prixPlat, tiers) => {
  const brut = (prixPlat * tiers) / 3;
  return Math.ceil(brut / 25) * 25;
};
