// Identité de l'application : point unique à modifier quand le nom définitif sera choisi.
export const APP_NAME = "Cantine Vatel";
export const APP_LOGO = "/logo.svg";
// Page Découvrir déjà vue pendant cette visite (onglet du navigateur).
export const CLE_DECOUVERTE = "decouverte.vue";
export const decouverteVue = () => {
  try { return sessionStorage.getItem(CLE_DECOUVERTE) === "1"; } catch { return true; }
};
export const marquerDecouverte = () => {
  try { sessionStorage.setItem(CLE_DECOUVERTE, "1"); } catch { /* sans stockage */ }
};
