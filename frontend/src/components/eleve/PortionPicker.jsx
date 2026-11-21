import { useRef } from "react";
import { prixPortion, fcfa, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";

const TIERS = [1, 2, 3];
const TAILLE = 220;
const C = TAILLE / 2;
const R_ASSIETTE = C - 1; // liseré 2 px
const R_PLEIN = R_ASSIETTE - 10; // 3/3 : couvre l’assiette sans déborder
// Forme organique de rayon moyen ≈ 100 centrée en 0,0.
const BLOB =
  "M0,-100 C42,-102 84,-74 96,-32 C108,10 90,62 52,86 C16,108 -42,102 -72,74 C-104,44 -106,-8 -88,-46 C-70,-84 -42,-98 0,-100 Z";

export default function PortionPicker({ plat, tiers, onChange }) {
  const piste = useRef(null);
  const glisse = useRef(false);
  const echelle = (R_PLEIN / 100) * Math.sqrt(tiers / 3);
  const prix = plat ? prixPortion(plat.prix, tiers) : 0;
  const pos = ((tiers - 1) / 2) * 100;

  const versCran = (clientX) => {
    const r = piste.current.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    const v = Math.round(ratio * 2) + 1;
    if (v !== tiers) onChange(v);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <svg
        viewBox={`0 0 ${TAILLE} ${TAILLE}`}
        width={TAILLE}
        height={TAILLE}
        role="img"
        aria-label={`Assiette remplie à ${tiersEnFraction(tiers)}`}
      >
        <circle cx={C} cy={C} r={R_ASSIETTE} fill="#ffffff" stroke="#d9d9dd" strokeWidth="2" />
        <g
          style={{
            transform: `translate(${C}px, ${C}px) scale(${echelle})`,
            transition: "transform 0.3s ease",
          }}
        >
          <path d={BLOB} fill="#f5e6c8" />
        </g>
      </svg>

      <p className="mt-4 text-[32px] font-medium text-[#212121]" style={titreStyle}>
        {fcfa(prix)}
      </p>

      <div className="mt-8 w-full px-3.5">
        <div
          ref={piste}
          className="relative h-12 touch-none select-none"
          onPointerDown={(e) => {
            glisse.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            versCran(e.clientX);
          }}
          onPointerMove={(e) => glisse.current && versCran(e.clientX)}
          onPointerUp={() => (glisse.current = false)}
          onPointerCancel={() => (glisse.current = false)}
          role="slider"
          tabIndex={0}
          aria-label="Portion"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={tiers}
          aria-valuetext={tiersEnFraction(tiers)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(tiers + 1, 3));
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(tiers - 1, 1));
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-[2px] bg-[#eeece7]" />
          {TIERS.map((v) => (
            <span
              key={v}
              className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
                v <= tiers ? "bg-[#003c33]" : "bg-[#d9d9dd]"
              }`}
              style={{ left: `${((v - 1) / 2) * 100}%` }}
            />
          ))}
          <span
            className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#17171c] shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
            style={{ left: `${pos}%`, transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        </div>
        <div className="relative h-5">
          {TIERS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className="absolute top-0 -translate-x-1/2 text-[14px] text-[#616161]"
              style={{ left: `${((v - 1) / 2) * 100}%` }}
            >
              {tiersEnFraction(v)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
