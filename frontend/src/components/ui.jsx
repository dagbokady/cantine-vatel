import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";

import { titreStyle } from "../utils/tokens";

export const NB_ETAPES = 4;

export function BackHeader({ titre, to = -1, etape, surtitre }) {
  const navigate = useNavigate();
  return (
    <header className="mx-auto max-w-[560px] px-5 pt-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(to)}
          aria-label="Retour"
          className="-ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#222222] transition-colors hover:bg-[#F7F7F7]"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        {etape && (
          <div
            className="flex flex-1 gap-1.5"
            role="progressbar"
            aria-label={`Étape ${etape} sur ${NB_ETAPES}`}
            aria-valuemin={1}
            aria-valuemax={NB_ETAPES}
            aria-valuenow={etape}
          >
            {Array.from({ length: NB_ETAPES }, (_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i < etape ? "bg-[#FF5A5F]" : "bg-[#EBEBEB]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      {(etape || surtitre) && titre && (
        <p className="mt-4 text-[13px] font-medium uppercase tracking-[0.08em] text-[#FF5A5F]">
          {surtitre || `Étape ${etape} sur ${NB_ETAPES}`}
        </p>
      )}
      {titre && (
        <h1
          className={`${etape || surtitre ? "mt-1" : "mt-2"} text-[32px] font-semibold text-[#222222]`}
          style={titreStyle}
        >
          {titre}
        </h1>
      )}
    </header>
  );
}

export function BottomCTA({ children, onClick, disabled, aside }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EBEBEB] bg-white px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto flex max-w-[520px] items-center gap-4">
        {aside && (
          <div className="min-w-0 flex-1" aria-live="polite">
            {aside}
          </div>
        )}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`h-[52px] rounded-full bg-[#222222] px-7 text-[16px] font-medium text-white transition-colors hover:bg-black disabled:bg-[#EBEBEB] disabled:text-[#B0B0B0] ${
            aside ? "shrink-0" : "w-full"
          }`}
        >
          {children}
        </button>
      </div>
    </div>
  );
}

export function SelectCard({ actif, disabled, onClick, children, className = "", pad = 16 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={actif}
      className={`relative w-full rounded-[18px] text-left transition-all duration-200 ${
        actif
          ? "border-2 border-[#FF5A5F] bg-white shadow-[0_6px_20px_rgba(255,90,95,0.12)]"
          : disabled
            ? "border border-[#EBEBEB] bg-[#F7F7F7]"
            : "border border-[#EBEBEB] bg-white hover:border-[#222222]"
      } ${className}`}
      style={{ padding: actif ? pad - 1 : pad }}
    >
      {children}
      {actif && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF5A5F] text-white">
          <Check size={14} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

export function Libelle({ children, className = "" }) {
  return (
    <p className={`text-[12px] uppercase tracking-[0.28px] text-[#B0B0B0] ${className}`}>
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
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F7F7F7] font-medium text-[#222222]"
      style={{ width: taille, height: taille, fontSize: taille * 0.36 }}
    >
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initiales}
    </span>
  );
}
