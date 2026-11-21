import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ReservationContext = createContext(null);

const ETAT_VIDE = {
  plat: null,
  tiers: 2,
  creneau: null,
  place: null,
  confirmation: null,
};

export function ReservationProvider({ children }) {
  const [etat, setEtat] = useState(ETAT_VIDE);

  const choisirPlat = useCallback((plat) => {
    setEtat((e) => ({ ...e, plat, tiers: e.plat?.plat_id === plat.plat_id ? e.tiers : 2 }));
  }, []);
  const choisirTiers = useCallback((tiers) => {
    setEtat((e) => ({ ...e, tiers }));
  }, []);
  const choisirCreneau = useCallback((creneau) => {
    setEtat((e) => ({ ...e, creneau }));
  }, []);
  const choisirPlace = useCallback((place) => {
    setEtat((e) => ({ ...e, place }));
  }, []);
  const confirmer = useCallback((confirmation) => {
    setEtat((e) => ({ ...e, confirmation }));
  }, []);
  const reset = useCallback(() => setEtat(ETAT_VIDE), []);

  const value = useMemo(
    () => ({
      etat,
      choisirPlat,
      choisirTiers,
      choisirCreneau,
      choisirPlace,
      confirmer,
      reset,
    }),
    [etat, choisirPlat, choisirTiers, choisirCreneau, choisirPlace, confirmer, reset],
  );
  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservation() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservation must be used within ReservationProvider");
  return ctx;
}
