// Plan de la cantine vu de dessus : tables rondes, sièges numérotés autour.
const LARGEUR = 340;
const COLONNES = 2;
const HAUTEUR_RANGEE = 164;
const MARGE = 16;
const BANDEAU = 40; // comptoir de service, repère d'orientation
const R_TABLE = 31;
const R_SIEGE = 13;
const DIST_SIEGE = R_TABLE + 21;
const R_TACTILE = 21;

const COULEURS = {
  libre: { fond: "#FFFFFF", trait: "#222222", texte: "#222222", dossier: "#222222" },
  prise: { fond: "#EBEBEB", trait: "#EBEBEB", texte: "#B0B0B0", dossier: "#DDDDDD" },
  sel: { fond: "#FF5A5F", trait: "#FF5A5F", texte: "#FFFFFF", dossier: "#FF5A5F" },
};

// Siège centré en (0,0) ; dossier orienté vers -y puis tourné de `rot` (vers l'extérieur).
export function Siege({ etat = "libre", numero, rot = 0 }) {
  const c = COULEURS[etat];
  const r = R_SIEGE + 4;
  const a = (34 * Math.PI) / 180;
  return (
    <g>
      <path
        transform={`rotate(${rot})`}
        d={`M ${-r * Math.sin(a)} ${-r * Math.cos(a)} A ${r} ${r} 0 0 1 ${r * Math.sin(a)} ${-r * Math.cos(a)}`}
        fill="none"
        stroke={c.dossier}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle r={R_SIEGE} fill={c.fond} stroke={c.trait} strokeWidth="1.5" />
      {etat === "sel" ? (
        <path d="M -4.5 0.5 L -1.5 3.5 L 4.5 -3" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : etat === "libre" && numero != null ? (
        <text y="4" textAnchor="middle" fontSize="11" fontWeight="600" fill={c.texte} fontFamily="Inter, sans-serif">
          {numero}
        </text>
      ) : null}
    </g>
  );
}

export function ChaiseIcone({ etat, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="-19 -19 38 38" aria-hidden="true">
      <Siege etat={etat} />
    </svg>
  );
}

export default function PlanSalle({ salle, placeSelId, onSelect }) {
  if (!salle || !salle.tables.length) return null;
  const rangees = Math.ceil(salle.tables.length / COLONNES);
  const hauteur = rangees * HAUTEUR_RANGEE + MARGE + BANDEAU;
  const largeurCol = LARGEUR / COLONNES;

  return (
    <svg
      viewBox={`0 0 ${LARGEUR} ${hauteur}`}
      width="100%"
      role="group"
      aria-label="Plan de la cantine"
      style={{ display: "block" }}
    >
      <rect x={24} y={MARGE} width={LARGEUR - 48} height="24" rx="12" fill="#222222" />
      <text
        x={LARGEUR / 2}
        y={MARGE + 16}
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        letterSpacing="2"
        fill="#FFFFFF"
        fontFamily="Inter, sans-serif"
      >
        COMPTOIR
      </text>
      {salle.tables.map((t, i) => {
        const rangee = Math.floor(i / COLONNES);
        const seul = i === salle.tables.length - 1 && i % COLONNES === 0;
        const tx = seul ? LARGEUR / 2 : largeurCol * (i % COLONNES) + largeurCol / 2;
        const ty = MARGE + BANDEAU + HAUTEUR_RANGEE * rangee + HAUTEUR_RANGEE / 2;
        const n = t.places.length || 1;
        const libres = t.places.filter((p) => p.etat !== "prise").length;
        const aMaPlace = t.places.some((p) => p.id === placeSelId);
        return (
          <g key={t.id} opacity={libres === 0 ? 0.5 : 1}>
            <circle
              cx={tx}
              cy={ty}
              r={R_TABLE}
              fill={aMaPlace ? "#FFF0ED" : "#FFFFFF"}
              stroke={aMaPlace ? "#FF5A5F" : "#EBEBEB"}
              strokeWidth="1.5"
              style={{ transition: "fill 200ms ease, stroke 200ms ease" }}
            />
            <text
              x={tx}
              y={ty + 2}
              textAnchor="middle"
              fontSize="16"
              fontWeight="700"
              fontFamily="'Space Grotesk', sans-serif"
              letterSpacing="-0.4"
              fill="#222222"
            >
              {t.nom}
            </text>
            <text
              x={tx}
              y={ty + 15}
              textAnchor="middle"
              fontSize="9"
              fontWeight="500"
              fill={aMaPlace ? "#FF5A5F" : libres ? "#717171" : "#B0B0B0"}
              fontFamily="Inter, sans-serif"
            >
              {aMaPlace ? "ta table" : libres ? `${libres} libre${libres > 1 ? "s" : ""}` : "complète"}
            </text>
            {t.places.map((p, j) => {
              // angle fourni par le serveur, sinon répartition régulière (360° / n)
              const deg = Number.isFinite(p.angle) ? p.angle : (360 / n) * j - 90;
              const a = (deg * Math.PI) / 180;
              const cx = tx + DIST_SIEGE * Math.cos(a);
              const cy = ty + DIST_SIEGE * Math.sin(a);
              const prise = p.etat === "prise";
              const sel = p.id === placeSelId;
              const etat = sel ? "sel" : prise ? "prise" : "libre";
              const choisir = () => onSelect({ ...p, table: t.nom });
              return (
                <g
                  key={p.id}
                  role={prise ? undefined : "button"}
                  tabIndex={prise ? undefined : 0}
                  aria-label={`Table ${t.nom}, place ${p.numero}${prise ? " (occupée)" : ""}`}
                  aria-pressed={prise ? undefined : sel}
                  aria-disabled={prise || undefined}
                  style={{ cursor: prise ? "not-allowed" : "pointer", outline: "none" }}
                  onClick={prise ? undefined : choisir}
                  onKeyDown={
                    prise
                      ? undefined
                      : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            choisir();
                          }
                        }
                  }
                >
                  <circle cx={cx} cy={cy} r={R_TACTILE} fill="transparent" />
                  {sel && <circle cx={cx} cy={cy} r={R_SIEGE + 8} fill="#FF5A5F" opacity="0.15" />}
                  <g
                    transform={`translate(${cx} ${cy}) scale(${sel ? 1.1 : 1})`}
                    style={{ transition: "transform 180ms ease" }}
                  >
                    <Siege etat={etat} numero={p.numero} rot={deg + 90} />
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
