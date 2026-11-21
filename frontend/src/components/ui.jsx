import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { titreStyle } from "../utils/tokens";

export function BackHeader({ titre, to = -1 }) {
  const navigate = useNavigate();
  return (
    <header className="px-5 pt-3">
      <button
        type="button"
        onClick={() => navigate(to)}
        aria-label="Retour"
        className="-ml-3 flex h-12 w-12 items-center justify-center text-[#212121]"
      >
        <ArrowLeft size={24} strokeWidth={1.75} />
      </button>
      {titre && (
        <h1 className="mt-1 text-[28px] font-medium text-[#212121]" style={titreStyle}>
          {titre}
        </h1>
      )}
    </header>
  );
}

export function BottomCTA({ children, onClick, disabled, variante = "noir" }) {
  const fond = variante === "vert" ? "bg-[#003c33]" : "bg-[#17171c]";
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 bg-white px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`h-[52px] w-full rounded-[32px] px-6 text-[16px] font-medium text-white transition-colors ${fond} disabled:bg-[#eeece7] disabled:text-[#93939f]`}
      >
        {children}
      </button>
    </div>
  );
}

export function SelectCard({ actif, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={actif}
      className={`w-full rounded-[16px] text-left transition-colors ${
        actif
          ? "border-2 border-[#003c33] bg-[#f7f7f5]"
          : disabled
            ? "border border-[#d9d9dd] bg-[#f7f7f5]"
            : "border border-[#d9d9dd] bg-white"
      }`}
      style={{ padding: actif ? 15 : 16 }}
    >
      {children}
    </button>
  );
}

export function Libelle({ children, className = "" }) {
  return (
    <p className={`text-[12px] uppercase tracking-[0.28px] text-[#93939f] ${className}`}>
      {children}
    </p>
  );
}

export function Avatar({ nom = "", photo, taille = 40 }) {
  const initiales = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0].toUpperCase())
    .join("");
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eeece7] font-medium text-[#212121]"
      style={{ width: taille, height: taille, fontSize: taille * 0.36 }}
    >
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initiales}
    </span>
  );
}
