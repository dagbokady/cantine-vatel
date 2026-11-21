import { useRef } from "react";
import { prixDePortion, fcfa, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import AssietteRiz from "./AssietteRiz";

const TIERS = [1, 2, 3];

export default function PortionPicker({ plat, tiers, supplements = 0, onChange }) {
  const piste = useRef(null);
  const glisse = useRef(false);
  const prix = plat ? prixDePortion(plat, tiers) + supplements : 0;
  const pos = ((tiers - 1) / 2) * 100;

  const versCran = (clientX) => {
    const r = piste.current.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    const v = Math.round(ratio * 2) + 1;
    if (v !== tiers) onChange(v);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div role="img" aria-label={`Assiette remplie à ${tiersEnFraction(tiers)}`}>
        <AssietteRiz fraction={tiers / 3} />
      </div>

      <p className="mt-4 text-[32px] font-medium text-[#222222]" style={titreStyle}>
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
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-[2px] bg-[#F7F7F7]" />
          {TIERS.map((v) => (
            <span
              key={v}
              className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
                v <= tiers ? "bg-[#FF5A5F]" : "bg-[#EBEBEB]"
              }`}
              style={{ left: `${((v - 1) / 2) * 100}%` }}
            />
          ))}
          <span
            className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#222222] shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
            style={{ left: `${pos}%`, transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        </div>
        <div className="relative h-5">
          {TIERS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className="absolute top-0 -translate-x-1/2 text-[14px] text-[#717171]"
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
