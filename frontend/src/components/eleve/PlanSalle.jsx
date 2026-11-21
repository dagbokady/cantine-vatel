// Plan de la cantine vu de dessus : tables rondes, chaises individuelles autour.
const LARGEUR = 340;
const COLONNES = 2;
const HAUTEUR_RANGEE = 156;
const MARGE = 14;
const R_TABLE = 30;
const DIST_CHAISE = R_TABLE + 16;
const R_TACTILE = 20;

const COULEURS_CHAISE = {
  libre: { fill: "#FBE3A1", stroke: "#D4A43C" },
  prise: { fill: "#EBEBEB", stroke: "#B0B0B0" },
  sel: { fill: "#FF5A5F", stroke: "#D94449" },
};

// Chaise vue de dessus, dossier vers -y, assise vers +y (centrée en 0,0).
export function Chaise({ etat = "libre" }) {
  const c = COULEURS_CHAISE[etat];
  return (
    <g fill={c.fill} stroke={c.stroke} strokeWidth="1.5" strokeLinejoin="round">
      <rect x="-9" y="-10" width="18" height="6" rx="3" />
      <rect x="-7.5" y="-5" width="15" height="12" rx="3.5" />
    </g>
  );
}

export function ChaiseIcone({ etat, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="-11 -12 22 22" aria-hidden="true">
      <Chaise etat={etat} />
    </svg>
  );
}

export default function PlanSalle({ salle, placeSelId, onSelect }) {
  if (!salle || !salle.tables.length) return null;
  const rangees = Math.ceil(salle.tables.length / COLONNES);
  const hauteur = rangees * HAUTEUR_RANGEE + MARGE * 2;
  const largeurCol = LARGEUR / COLONNES;

  return (
    <svg
      viewBox={`0 0 ${LARGEUR} ${hauteur}`}
      width="100%"
      role="group"
      aria-label="Plan de la cantine"
      style={{ display: "block" }}
    >
      {salle.tables.map((t, i) => {
        const rangee = Math.floor(i / COLONNES);
        // quinconce légère : rangées impaires décalées pour un plan moins rigide
        const decal = rangee % 2 ? 10 : -10;
        const tx = largeurCol * (i % COLONNES) + largeurCol / 2 + decal;
        const ty = MARGE + HAUTEUR_RANGEE * rangee + HAUTEUR_RANGEE / 2;
        const n = t.places.length || 1;
        return (
          <g key={t.id}>
            <circle cx={tx} cy={ty + 2} r={R_TABLE} fill="#222222" opacity="0.06" />
            <circle cx={tx} cy={ty} r={R_TABLE} fill="#FFFFFF" stroke="#EBEBEB" strokeWidth="1.5" />
            <text
              x={tx}
              y={ty + 5}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fontFamily="'Space Grotesk', sans-serif"
              fill="#222222"
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
              const etat = sel ? "sel" : prise ? "prise" : "libre";
              return (
                <g
                  key={p.id}
                  role={prise ? undefined : "button"}
                  tabIndex={prise ? undefined : 0}
                  aria-label={`${t.nom} place ${p.numero}${prise ? " (occupée)" : ""}`}
                  aria-pressed={prise ? undefined : sel}
                  aria-disabled={prise || undefined}
                  style={{ cursor: prise ? "not-allowed" : "pointer", outline: "none" }}
                  onClick={prise ? undefined : () => onSelect(p)}
                  onKeyDown={
                    prise
                      ? undefined
                      : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelect(p);
                          }
                        }
                  }
                >
                  <circle cx={cx} cy={cy} r={R_TACTILE} fill="transparent" />
                  {sel && <circle cx={cx} cy={cy} r={15} fill="#FF5A5F" opacity="0.16" />}
                  <g
                    transform={`translate(${cx} ${cy}) rotate(${deg + 90}) scale(${sel ? 1.12 : 1})`}
                    style={{ transition: "transform 160ms ease" }}
                  >
                    <Chaise etat={etat} />
                  </g>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
