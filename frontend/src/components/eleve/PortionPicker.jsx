import { useId } from "react";
import { prixPortion, fcfa, tiersEnFraction } from "../../utils/format";

const TIERS = [1, 2, 3];
const PLATE_R = 84;
const FOOD_R_MAX = 70;

export default function PortionPicker({ plat, tiers, onChange }) {
  const clipId = useId();
  const foodR = FOOD_R_MAX * Math.sqrt(tiers / 3);
  const prix = plat ? prixPortion(plat.prix, tiers) : 0;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 200"
        width="220"
        height="220"
        role="img"
        aria-label={`Assiette remplie à ${tiersEnFraction(tiers)}`}
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="100" cy="100" r={PLATE_R - 4} />
          </clipPath>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={PLATE_R}
          fill="#ffffff"
          stroke="#d9d9dd"
          strokeWidth="1.5"
        />
        <circle
          cx="100"
          cy="100"
          r={PLATE_R - 10}
          fill="none"
          stroke="#eeece7"
          strokeWidth="1"
        />
        <g clipPath={`url(#${clipId})`}>
          <circle
            cx="100"
            cy="100"
            r={foodR}
            fill="#efe3c3"
            style={{ transition: "r 420ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
          <circle
            cx="100"
            cy="100"
            r={foodR}
            fill="none"
            stroke="#d9c89a"
            strokeWidth="1"
            style={{ transition: "r 420ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </g>
      </svg>

      <div className="mt-6 w-full max-w-[320px]">
        <div className="relative h-12 rounded-full bg-[#eeece7] p-1.5">
          <div
            className="absolute top-1.5 bottom-1.5 w-[calc(33.333%-6px)] rounded-full bg-[#17171c] transition-transform duration-300 ease-out"
            style={{
              left: "6px",
              transform: `translateX(${(tiers - 1) * 100}%)`,
            }}
          />
          <div className="relative grid h-full grid-cols-3">
            {TIERS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                aria-pressed={tiers === v}
                className={`z-10 flex items-center justify-center text-[14px] font-semibold transition-colors ${
                  tiers === v ? "text-white" : "text-[#616161]"
                }`}
              >
                {tiersEnFraction(v)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-[11.5px] uppercase tracking-wide text-[#93939f]">
              Portion
            </p>
            <p
              className="text-[22px] font-bold text-[#212121]"
              style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
            >
              {tiersEnFraction(tiers)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11.5px] uppercase tracking-wide text-[#93939f]">
              À payer
            </p>
            <p
              className="text-[22px] font-bold text-[#003c33]"
              style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
            >
              {fcfa(prix)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
