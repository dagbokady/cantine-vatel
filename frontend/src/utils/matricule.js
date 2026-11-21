// Matricule Côte d'Ivoire : 8 chiffres puis 1 lettre majuscule (ex. 15079766N). Même règle côté serveur.
export const MATRICULE_RE = /^[0-9]{8}[A-Z]$/;
export const MATRICULE_ERREUR = "8 chiffres suivis d'une lettre majuscule, par exemple 15079766N.";
export const normaliserMatricule = (m = "") => m.replace(/[^0-9A-Za-z]/g, "").toUpperCase().slice(0, 9);
export const matriculeValide = (m) => MATRICULE_RE.test(normaliserMatricule(m));
