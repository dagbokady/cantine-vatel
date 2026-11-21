import api from "./client";

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);
const put = (url, body) => api.put(url, body).then((r) => r.data);
const del = (url) => api.delete(url).then((r) => r.data);

// Comptoir
export const servirTicket = (ticket) => post("/agent/servir", { ticket });
export const servirCode = (code) => post("/agent/servir-code", { code });
export const getServiceDuJour = () => get("/agent/service-du-jour");

export { get, post, put, del };

// Parent
export const getEnfants = () => get("/parent/enfants");
export const verifierMatricule = (matricule) => get("/parent/enfants/verifier", { matricule });
export const rattacherEnfant = (matricule) => post("/parent/enfants", { matricule });
export const getAllergenes = () => get("/parent/allergenes");
export const majAllergies = (id, allergies, regime) => put(`/parent/enfants/${id}/allergies`, { allergies, regime });
export const activerAcces = (id) => post(`/parent/enfants/${id}/acces`);
export const creerRecharge = (body) => post("/parent/recharges", body);
export const traiterRecharge = (ref) => post(`/parent/recharges/${ref}/traiter`);
export const getRecharges = () => get("/parent/recharges");
export const getHistoriqueEnfant = (id) => get(`/parent/enfants/${id}/historique`);
export const getMenuSemaine = () => get("/parent/menu");
export const getNotifications = () => get("/parent/notifications");
export const marquerLues = () => post("/parent/notifications/lues");

// Cuisine
export const getFiche = (date) => get("/cuisine/fiche", date ? { date } : undefined);
export const getMenusCuisine = () => get("/cuisine/menus");
export const publierMenu = (body) => post("/cuisine/menus", body);
export const majMenu = (id, portions) => put(`/cuisine/menus/${id}`, { portions });
export const supprimerMenu = (id) => del(`/cuisine/menus/${id}`);
export const getPlats = () => get("/cuisine/plats");
export const creerPlat = (body) => post("/cuisine/plats", body);
export const majElementsPlat = (id, elements) => put(`/cuisine/plats/${id}/elements`, elements);
export const majPrixPlat = (id, body) => put(`/cuisine/plats/${id}/prix`, body);
export const majPrixMenu = (id, body) => put(`/cuisine/menus/${id}/prix`, body);
export const getIngredients = () => get("/cuisine/ingredients");
export const creerIngredient = (body) => post("/cuisine/ingredients", body);
export const getAllergenesCuisine = () => get("/cuisine/allergenes");
export const getService = (date, mode) => get("/cuisine/service", { date, mode });
export const getVague = (cle, date, mode) => get(`/cuisine/vagues/${cle}`, { date, mode });
export const getSalleCuisine = (date, vague, mode) => get("/cuisine/salle", { date, vague, mode });
export const envoyerRetours = (date, retours, mode) => put("/cuisine/retours", { date, retours, mode });
export const getStatsEleve = (id) => get(`/cuisine/eleves/${id}/stats`);
export const getReglagesCuisine = () => get("/cuisine/reglages");
export const majReglagesCuisine = (delai_preparation_min) => put("/cuisine/reglages", { delai_preparation_min });
export const getStatsCuisine = (params) => get("/cuisine/statistiques", params);

// Admin
export const getAujourdhui = () => get("/admin/aujourdhui");
export const getStatistiques = (params) => get("/admin/statistiques", params);
export const getClassesScolarite = () => get("/admin/scolarite/classes");
export const creerClasse = (body) => post("/admin/scolarite/classes", body);
export const majClasse = (id, body) => put(`/admin/scolarite/classes/${id}`, body);
export const getElevesScolarite = (params) => get("/admin/scolarite/eleves", params);
export const creerEleve = (body) => post("/admin/scolarite/eleves", body);
export const majEleve = (id, body) => put(`/admin/scolarite/eleves/${id}`, body);
export const getDashboard = (date) => get("/admin/dashboard", date ? { date } : undefined);
export const getParametres = () => get("/admin/parametres");
export const putParametres = (body) => put("/admin/parametres", body);
export const getNiveaux = () => get("/admin/niveaux");
export const putNiveau = (id, mode) => put(`/admin/niveaux/${id}`, { mode });
export const getCreneauxAdmin = (date) => get("/admin/creneaux", date ? { date } : undefined);
export const creerCreneau = (body) => post("/admin/creneaux", body);
export const majCreneau = (id, body) => put(`/admin/creneaux/${id}`, body);
export const supprimerCreneau = (id) => del(`/admin/creneaux/${id}`);
export const getSalleAdmin = () => get("/admin/salle");
export const creerTable = (body) => post("/admin/tables", body);
export const supprimerTable = (id) => del(`/admin/tables/${id}`);
export const majPlace = (id, pmr) => put(`/admin/places/${id}`, { pmr });
export const getCuisiniers = () => get("/admin/cuisiniers");
export const affecterCuisinier = (id, niveau_ids) => put(`/admin/cuisiniers/${id}`, { niveau_ids });
export const creerChef = (body) => post("/admin/chefs", body);
export const modifierChef = (id, body) => put(`/admin/chefs/${id}`, body);
export const getClassesModeClasse = () => get("/admin/classes");
export const placerClasse = (id, body) => put(`/admin/classes/${id}`, body);
export const getSuggestionsPortion = () => get("/admin/suggestions-portion");
export const deciderSuggestion = (id, decision) => post(`/admin/suggestions-portion/${id}`, { decision });

// Enseignant
export const getClassesEnseignant = () => get("/enseignant/classes");
export const getAppel = (id) => get(`/enseignant/classes/${id}/appel`);
export const envoyerAppel = (id, absents) => post(`/enseignant/classes/${id}/appel`, { absents });

export const erreurApi = (e, defaut = "Action impossible.") => {
  const d = e.response?.data?.detail;
  return typeof d === "string" ? d : defaut;
};
