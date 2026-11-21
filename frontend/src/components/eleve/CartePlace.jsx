import { Siege } from "./PlanSalle";

// Même langage que le plan de salle : table ronde, chaises numérotées, la sienne en corail.
const R_TABLE = 31;
const DIST = R_TABLE + 21;

export default function CartePlace({ place }) {
  // Angles réels du plan de salle ; à défaut, répartition régulière comme sur le plan.
  const n = Math.max(place.nb_places || place.numero, place.numero);
  const sieges = place.sieges?.length
    ? place.sieges
    : Array.from({ length: n }, (_, j) => [j + 1, (360 / n) * j - 90]);
  const nomTable = place.table_nom;
  return (
    <div className="flex h-full flex-col rounded-[22px] border border-[#EBEBEB] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#717171]">Ta place</p>
      <svg viewBox="-80 -80 160 160" className="mx-auto my-2 w-full max-w-[150px] flex-1" role="img"
        aria-label={`Table ${nomTable}, place ${place.numero}`}>
        <circle r={R_TABLE} fill="#FFF0ED" stroke="#FF5A5F" strokeWidth="1.5" />
        <text y="6" textAnchor="middle" fontSize="17" fontWeight="700" fill="#222222"
          fontFamily="'Space Grotesk', sans-serif" letterSpacing="-0.4">
          {nomTable}
        </text>
        {sieges.map(([numero, deg]) => {
          const a = (deg * Math.PI) / 180;
          const sel = numero === place.numero;
          return (
            <g key={numero} transform={`translate(${DIST * Math.cos(a)} ${DIST * Math.sin(a)}) scale(${sel ? 1.1 : 1})`}>
              {sel && <circle r="21" fill="#FF5A5F" opacity="0.15" />}
              <Siege etat={sel ? "sel" : "prise"} rot={deg + 90} />
            </g>
          );
        })}
      </svg>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-[14px] bg-[#F7F7F7] py-2">
          <p className="text-[11px] text-[#717171]">Table</p>
          <p className="text-[20px] font-semibold leading-tight text-[#222222]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {nomTable}
          </p>
        </div>
        <div className="rounded-[14px] bg-[#FFF0ED] py-2">
          <p className="text-[11px] text-[#717171]">Place</p>
          <p className="text-[20px] font-semibold leading-tight text-[#FF5A5F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {String(place.numero).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
