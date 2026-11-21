import api from "./client";

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);
const put = (url, body) => api.put(url, body).then((r) => r.data);
const del = (url) => api.delete(url).then((r) => r.data);

// Comptoir
export const servirTicket = (ticket) => post("/agent/servir", { ticket });
export const getServiceDuJour = () => get("/agent/service-du-jour");

export { get, post, put, del };

// Parent
export const getEnfants = () => get("/parent/enfants");
export const verifierMatricule = (matricule) => get("/parent/enfants/verifier", { matricule });
export const rattacherEnfant = (matricule) => post("/parent/enfants", { matricule });
export const getAllergenes = () => get("/parent/allergenes");
export const majAllergies = (id, allergies, regime) => put(`/parent/enfants/${id}/allergies`, { allergies, regime });
export const activerAcces = (id) => post(`/parent/enfants/${id}/acces`);
export const recharger = (id, montant) => post(`/parent/enfants/${id}/recharge`, { montant });
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
export const getIngredients = () => get("/cuisine/ingredients");
export const creerIngredient = (body) => post("/cuisine/ingredients", body);
export const getAllergenesCuisine = () => get("/cuisine/allergenes");

// Admin
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

// Enseignant
export const getClassesEnseignant = () => get("/enseignant/classes");
export const getAppel = (id) => get(`/enseignant/classes/${id}/appel`);
export const envoyerAppel = (id, absents) => post(`/enseignant/classes/${id}/appel`, { absents });

export const erreurApi = (e, defaut = "Action impossible.") => {
  const d = e.response?.data?.detail;
  return typeof d === "string" ? d : defaut;
};
