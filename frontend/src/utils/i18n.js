import { createContext, useCallback, useContext, useEffect, useState } from "react";

const DICT = {
  fr: {
    bonjour: "Bonjour",
    solde: "Solde",
    repas_du_jour: "Repas du jour",
    non_compatible: "Non compatible avec tes allergies",
    reserver: "Réserver",
    ingredients: "Ingrédients",
    commandes_fermees: "Commandes fermées",
    pas_de_menu: "Pas encore de menu",
    patientez: "Patientez encore un peu",
    reviens_bientot: "Reviens un peu plus tard pour voir le menu.",
    cloture_rappel: "Les commandes ferment chaque jour à",
    accueil: "Accueil",
    profil: "Profil",
    ma_reservation: "Ma réservation",
    creneau: "Créneau",
    place: "Place",
    annuler_reservation: "Annuler la réservation",
    bientot: "Bientôt",
    deconnexion: "Déconnexion",
    classe: "Classe",
    matricule: "Matricule",
    langue: "Langue",
    allergies: "Allergies",
    aucune_allergie: "Aucune allergie enregistrée",
    allergies_info: "Lecture seule. Demande à ton parent pour modifier.",
    historique: "Historique",
    aucun_historique: "Aucun historique pour le moment.",
    reservations_passees: "Réservations",
    transactions: "Transactions",
    portion: "Portion",
    francais: "Français",
    anglais: "English",
    stock_restant: "restants",
    rupture: "Épuisé",
    cout_estime: "À payer",
  },
  en: {
    bonjour: "Hello",
    solde: "Balance",
    repas_du_jour: "Today's meal",
    non_compatible: "Not safe for your allergies",
    reserver: "Reserve",
    ingredients: "Ingredients",
    commandes_fermees: "Orders closed",
    pas_de_menu: "No menu yet",
    patientez: "Hang on a moment",
    reviens_bientot: "Come back later to see the menu.",
    cloture_rappel: "Orders close every day at",
    accueil: "Home",
    profil: "Profile",
    ma_reservation: "My reservation",
    creneau: "Slot",
    place: "Seat",
    annuler_reservation: "Cancel reservation",
    bientot: "Soon",
    deconnexion: "Sign out",
    classe: "Class",
    matricule: "Student ID",
    langue: "Language",
    allergies: "Allergies",
    aucune_allergie: "No allergy on file",
    allergies_info: "Read-only. Ask your parent to update.",
    historique: "History",
    aucun_historique: "Nothing to show yet.",
    reservations_passees: "Reservations",
    transactions: "Transactions",
    portion: "Portion",
    francais: "Français",
    anglais: "English",
    stock_restant: "left",
    rupture: "Sold out",
    cout_estime: "To pay",
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "fr");

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key) => (DICT[lang] && DICT[lang][key]) || DICT.fr[key] || key,
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
