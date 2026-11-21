const LARGEUR = 335;
const COLONNES = 2;
const HAUTEUR_RANGEE = 128;
const R_TABLE = 24;
const R_CHAISE = 10;
const DIST_CHAISE = R_TABLE + 8 + R_CHAISE;
const R_TACTILE = 22;

export default function PlanSalle({ salle, placeSelId, onSelect }) {
  if (!salle || !salle.tables.length) return null;
  const rangees = Math.ceil(salle.tables.length / COLONNES);
  const hauteur = rangees * HAUTEUR_RANGEE;
  const largeurCol = LARGEUR / COLONNES;

  return (
    <svg
      viewBox={`0 0 ${LARGEUR} ${hauteur}`}
      width="100%"
      role="group"
      aria-label="Plan de la salle"
      style={{ display: "block", background: "#ffffff" }}
    >
      {salle.tables.map((t, i) => {
        const tx = largeurCol * (i % COLONNES) + largeurCol / 2;
        const ty = HAUTEUR_RANGEE * Math.floor(i / COLONNES) + HAUTEUR_RANGEE / 2;
        const n = t.places.length || 1;
        return (
          <g key={t.id}>
            <circle cx={tx} cy={ty} r={R_TABLE} fill="#eeece7" />
            <text
              x={tx}
              y={ty + 4}
              textAnchor="middle"
              fontSize="12"
              fontFamily="Inter, sans-serif"
              fill="#93939f"
            >
              {t.nom}
            </text>
            {t.places.map((p, j) => {
              // angle fourni par le serveur, sinon répartition régulière (360° / n)
              const deg = Number.isFinite(p.angle) ? p.angle : (360 / n) * j - 90;
              const a = (deg * Math.PI) / 180;
              const cx = tx + DIST_CHAISE * Math.cos(a);
              const cy = ty + DIST_CHAISE * Math.sin(a);
              const prise = p.etat === "prise";
              const sel = p.id === placeSelId;
              const fill = sel ? "#003c33" : prise ? "#93939f" : "#ffffff";
              const stroke = sel ? "#ffffff" : prise ? "none" : "#d9d9dd";
              return (
                <g
                  key={p.id}
                  role={prise ? undefined : "button"}
                  aria-label={`${t.nom} place ${p.numero}${prise ? " (prise)" : ""}`}
                  aria-pressed={prise ? undefined : sel}
                  style={{ cursor: prise ? "default" : "pointer" }}
                  onClick={prise ? undefined : () => onSelect(p)}
                >
                  {!prise && <circle cx={cx} cy={cy} r={R_TACTILE} fill="transparent" />}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={R_CHAISE}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sel ? 2 : 1.5}
                    style={{ transition: "fill 150ms ease" }}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
