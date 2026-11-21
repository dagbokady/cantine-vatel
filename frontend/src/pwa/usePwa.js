import { useSyncExternalStore } from "react";
import { abonner, etatPwa } from "./etat";

let cache = etatPwa();
const lire = () => {
  const e = etatPwa();
  if (e.installable !== cache.installable || e.majDisponible !== cache.majDisponible) cache = e;
  return cache;
};

export default function usePwa() {
  return useSyncExternalStore(abonner, lire, lire);
}
