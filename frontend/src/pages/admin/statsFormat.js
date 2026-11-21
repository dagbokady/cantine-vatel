export const nombre = (x) => (x ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
export const pct = (x) => (x == null ? "–" : `${nombre(x)} %`);
export const SEUIL_GASPI = 20;
