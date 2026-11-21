import { operateur } from "../../utils/operateurs";

// Représentation stylisée de chaque opérateur (aux couleurs de la marque, sans reproduire les logos officiels).
export default function OperateurLogo({ id, taille = 44 }) {
  const o = operateur(id);
  const r = Math.round(taille * 0.28);
  const marque = {
    wave: (
      <svg viewBox="0 0 40 40" width="70%" aria-hidden="true">
        <path d="M5 22c4-8 8-8 10 0s6 8 10 0 8-8 10 0" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
      </svg>
    ),
    mtn: (
      <svg viewBox="0 0 40 40" width="86%" aria-hidden="true">
        <ellipse cx="20" cy="20" rx="17" ry="11" fill="none" stroke="#1A1A1A" strokeWidth="2.6" />
        <text x="20" y="24.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1A1A1A" fontFamily="Inter, sans-serif">MTN</text>
      </svg>
    ),
    orange: (
      <svg viewBox="0 0 40 40" width="100%" aria-hidden="true">
        <rect x="7" y="24" width="20" height="3" rx="1" fill="#FFFFFF" />
        <text x="7" y="20" fontSize="7.5" fontWeight="800" fill="#FFFFFF" fontFamily="Inter, sans-serif">orange</text>
      </svg>
    ),
    moov: (
      <svg viewBox="0 0 40 40" width="100%" aria-hidden="true">
        <text x="20" y="24" textAnchor="middle" fontSize="12" fontWeight="800" fill="#FFFFFF" fontFamily="Inter, sans-serif">moov</text>
        <circle cx="31" cy="12" r="3.2" fill="#FF8A00" />
      </svg>
    ),
  }[o.id];
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: taille, height: taille, borderRadius: r, background: o.fond }}
    >
      {marque}
    </span>
  );
}
