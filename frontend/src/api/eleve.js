import api from "./client";

export const getMe = () => api.get("/eleve/me").then((r) => r.data);

export const getMenuDuJour = () =>
  api.get("/eleve/menu-du-jour").then((r) => r.data);

export const getReservationDuJour = () =>
  api.get("/eleve/reservation-du-jour").then((r) => r.data);

export const getHistorique = () =>
  api.get("/eleve/historique").then((r) => r.data);
