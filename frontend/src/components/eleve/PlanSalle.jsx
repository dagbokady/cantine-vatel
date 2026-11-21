import { colors } from "../../utils/tokens";

const RAYON_TABLE = 36;
const RAYON_CHAISE = 13;
const DISTANCE_CHAISE = 26;

export default function PlanSalle({ salle, placeSelId, onSelect }) {
  if (!salle || !salle.tables.length) return null;
  const vb = `0 0 ${salle.largeur} ${salle.hauteur}`;
  return (
    <svg
      viewBox={vb}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Plan de la salle"
      style={{ display: "block", maxHeight: "60vh" }}
    >
      {salle.tables.map((t) => (
        <g key={t.id}>
          <circle
            cx={t.x}
            cy={t.y}
            r={RAYON_TABLE}
            fill={colors.surfaceSoft}
            stroke={colors.hairline}
            strokeWidth={1}
          />
          <text
            x={t.x}
            y={t.y + 4}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill={colors.muted}
          >
            {t.nom}
          </text>
          {t.places.map((p) => {
            const theta = (p.angle * Math.PI) / 180;
            const cx = t.x + (RAYON_TABLE + DISTANCE_CHAISE) * Math.cos(theta);
            const cy = t.y + (RAYON_TABLE + DISTANCE_CHAISE) * Math.sin(theta);
            const selectionnee = p.id === placeSelId;
            const prise = p.etat === "prise";
            let fill = colors.canvas;
            let stroke = colors.ink;
            let strokeWidth = 1.5;
            if (prise) {
              fill = colors.surfaceStrong;
              stroke = colors.borderStrong;
            }
            if (selectionnee) {
              fill = colors.primary;
              stroke = colors.primary;
              strokeWidth = 2;
            }
            return (
              <g key={p.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={RAYON_CHAISE}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  style={{
                    cursor: prise ? "not-allowed" : "pointer",
                    transition: "fill 180ms ease, stroke 180ms ease",
                  }}
                  onClick={() => {
                    if (!prise) onSelect(p);
                  }}
                />
                {selectionnee && (
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={colors.onPrimary}
                    style={{ pointerEvents: "none" }}
                  >
                    {p.numero}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
