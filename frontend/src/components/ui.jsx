import {useEffect, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {ArrowLeft, Check} from "lucide-react";

import {titreStyle} from "../utils/tokens";

export const NB_ETAPES = 5;


export function BackHeader({
                               titre,
                               to = -1,
                               etape,
                               surtitre,
                           }) {
    const navigate = useNavigate();

    const retour = () => {
        if (typeof to === "number") {
            navigate(to);
        } else {
            navigate(to);
        }
    };

    const progression = etape
        ? Math.min(100, Math.max(0, (etape / NB_ETAPES) * 100))
        : 0;

    return (
        <header className="mx-auto w-full max-w-[560px] px-5 pt-5 sm:px-6 sm:pt-7">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={retour}
                    aria-label="Retour"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EBEBEB] bg-white text-[#222222] transition hover:bg-[#F7F7F7] active:scale-95"
                >
                    <ArrowLeft size={19} strokeWidth={1.8}/>
                </button>

                {etape && (
                    <span className="text-[11px] font-semibold tracking-[0.12em] text-[#717171]">
            ÉTAPE {etape} / {NB_ETAPES}
          </span>
                )}
            </div>

            {etape && (
                <div
                    className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-[#EBEBEB]"
                    role="progressbar"
                    aria-label="Progression de la réservation"
                    aria-valuemin={1}
                    aria-valuemax={NB_ETAPES}
                    aria-valuenow={etape}
                >
                    <div
                        className="h-full rounded-full bg-[#FF5A5F] transition-all duration-500"
                        style={{width: `${progression}%`}}
                    />
                </div>
            )}

            <div className="mt-6">
                {surtitre && (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#717171]">
                        {surtitre}
                    </p>
                )}

                <h1
                    className="text-[27px] font-semibold text-[#222222] sm:text-[32px]"
                    style={titreStyle}
                >
                    {titre}
                </h1>
            </div>
        </header>
    );
}


export function BottomCTA({
                              children,
                              onClick,
                              disabled = false,
                              aside,
                          }) {
    // Hauteur réelle publiée en variable CSS : les pages réservent exactement cet espace.
    const barre = useRef(null);
    useEffect(() => {
        const el = barre.current;
        if (!el) return undefined;
        const racine = document.documentElement;
        const publier = () => racine.style.setProperty("--cta-h", `${el.offsetHeight}px`);
        publier();
        const obs = new ResizeObserver(publier);
        obs.observe(el);
        return () => {
            obs.disconnect();
            racine.style.removeProperty("--cta-h");
        };
    }, []);

    return (
        <div ref={barre} className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EBEBEB] bg-white/95 backdrop-blur-md">
            <div
                className="mx-auto flex w-full max-w-[560px] flex-col gap-3 px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:px-6">
                {aside && (
                    <div className="text-center text-[12px] text-[#717171]">
                        {aside}
                    </div>
                )}

                <button
                    type="button"
                    onClick={onClick}
                    disabled={disabled}
                    className="flex min-h-[54px] w-full items-center justify-center rounded-full bg-[#222222] px-6 text-[15px] font-semibold text-white transition hover:bg-[#383838] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#D9D9D9] disabled:text-white"
                >
                    {children}
                </button>
            </div>
        </div>
    );
}



export function SelectCard({
                               actif = false,
                               disabled = false,
                               onClick,
                               children,
                               className = "",
                               pad = 16,
                           }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={actif}
            className={`
        relative flex w-full items-center gap-3 rounded-[20px]
        border text-left transition-all duration-200
        ${actif
                ? "border-[#FF5A5F] bg-[#FFF0ED]"
                : "border-[#EBEBEB] bg-white hover:border-[#D0D0D0]"}
        ${disabled
                ? "cursor-not-allowed opacity-45"
                : "cursor-pointer active:scale-[0.99]"}
        ${className}
      `}
            style={{ padding: pad }}
        >
            <span className="min-w-0 flex-1">{children}</span>

            <span
                className={`
          flex h-5 w-5 shrink-0 items-center justify-center
          rounded-full border transition-colors
          ${actif
                    ? "border-[#FF5A5F] bg-[#FF5A5F] text-white"
                    : "border-[#D9D9D9] bg-white"}
        `}
                aria-hidden="true"
            >
        {actif && <Check size={12} strokeWidth={3} />}
      </span>
        </button>
    );
}


export function Libelle({ children, className = "" }) {
    return (
        <span
            className={`
        block text-[10px] font-semibold uppercase
        tracking-[0.14em] text-[#717171]
        ${className}
      `}
        >
      {children}
    </span>
    );
}



export function Avatar({ nom = "", photo, taille = 40 }) {
    const initiales = nom
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((mot) => mot.charAt(0).toUpperCase())
        .join("");

    const style = {
        width: taille,
        height: taille,
        minWidth: taille,
    };

    if (photo) {
        return (
            <img
                src={photo}
                alt={nom ? `Photo de ${nom}` : "Photo de profil"}
                className="shrink-0 rounded-full border border-[#EBEBEB] object-cover"
                style={style}
            />
        );
    }

    return (
        <div
            role="img"
            aria-label={nom ? `Avatar de ${nom}` : "Avatar"}
            className="flex shrink-0 items-center justify-center rounded-full bg-[#FFF0ED] font-semibold text-[#222222]"
            style={{
                ...style,
                fontSize: Math.max(11, taille * 0.32),
            }}
        >
            {initiales || "?"}
        </div>
    );
}
