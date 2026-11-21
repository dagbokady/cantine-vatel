import api from "./client";

export const getMe = () => api.get("/eleve/me").then((r) => r.data);

export const getMenuDuJour = () =>
  api.get("/eleve/menu-du-jour").then((r) => r.data);

export const getReservationDuJour = () =>
  api.get("/eleve/reservation-du-jour").then((r) => r.data);

export const getHistorique = () =>
  api.get("/eleve/historique").then((r) => r.data);

export const getCreneaux = (date) =>
  api
    .get("/eleve/creneaux", { params: date ? { date } : undefined })
    .then((r) => r.data);

export const getSalle = (creneau_id) =>
  api
    .get("/eleve/salle", { params: { creneau_id } })
    .then((r) => r.data);

export const postReservation = (payload) =>
  api.post("/eleve/reservations", payload).then((r) => r.data);

export const annulerReservation = (id) => api.delete(`/eleve/reservations/${id}`);

// Menus communiqués à l'avance (consultation), filtrés selon les allergies.
export const getMenus = () => api.get("/eleve/menus").then((r) => r.data);

// Le jour même, à partir de la récréation : rattacher la commande à une vague et une place.
export const choisirVague = (id, payload) =>
  api.put(`/eleve/reservations/${id}/vague`, payload).then((r) => r.data);
