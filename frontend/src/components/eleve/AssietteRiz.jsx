import { useEffect, useId, useRef, useState } from "react";

// Assiette plate en vue trois-quarts. Le riz garde toujours la même taille :
// un masque à bord « croqué » le fait disparaître de droite à gauche.
const X_MIN = 54; // bord gauche du riz
const X_MAX = 228; // bord droit du riz (+ marge pour le bord irrégulier)
const DUREE = 450;

// Grains : positions déterministes dans le dôme de riz.
const GRAINS = (() => {
  const g = [];
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  while (g.length < 120) {
    const x = 66 + rnd() * 148;
    const y = 50 + rnd() * 74;
    const dx = (x - 140) / 80;
    const haut = 120 - 74 * Math.sqrt(Math.max(0, 1 - dx * dx)); // sommet du dôme à cette abscisse
    if (y < haut + 3 || y > 126) continue;
    g.push({ x, y, r: rnd() * 180, o: 0.55 + rnd() * 0.45 });
  }
  return g;
})();

const BORD = "M6,0 C-14,14 14,30 -2,46 C-16,60 12,74 -4,90 C-18,104 10,120 -6,150";
const DOME = "M56,122 C52,90 86,48 140,44 C194,48 228,90 224,122 C204,138 76,138 56,122 Z";

// Miettes laissées sur l'assiette côté « mangé ».
const MIETTES = [
  [196, 124, 20], [208, 116, 70], [186, 131, 120], [214, 128, 160], [176, 122, 40],
];

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export default function AssietteRiz({ fraction }) {
  const id = useId().replace(/:/g, "");
  const [f, setF] = useState(fraction);
  const courant = useRef(fraction);

  useEffect(() => {
    const depart = courant.current;
    if (depart === fraction) return;
    const t0 = performance.now();
    let raf;
    const pas = (t) => {
      const k = Math.min(1, (t - t0) / DUREE);
      courant.current = depart + (fraction - depart) * ease(k);
      setF(courant.current);
      if (k < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [fraction]);

  const coupe = X_MIN + (X_MAX - X_MIN) * f + (f >= 0.999 ? 20 : 0);
  const miettes = Math.max(0, Math.min(1, (1 - f) * 2.5));

  return (
    <svg viewBox="0 0 280 190" width="280" height="190" aria-hidden="true">
      <defs>
        <radialGradient id={`plat-${id}`} cx="45%" cy="35%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1efea" />
        </radialGradient>
        <radialGradient id={`riz-${id}`} cx="40%" cy="25%" r="80%">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.65" stopColor="#f3e6c8" />
          <stop offset="1" stopColor="#dfcca3" />
        </radialGradient>
        <filter id={`flou-${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {/* Masque à bord irrégulier (traces de cuillère), translaté horizontalement. */}
        <clipPath id={`mange-${id}`}>
          <path transform={`translate(${coupe} 0)`} d={`M-300,0 L6,0 ${BORD.slice(5)} L-300,150 Z`} />
        </clipPath>
        <clipPath id={`dome-${id}`}>
          <path d={DOME} />
        </clipPath>
      </defs>

      {/* Ombre portée de l'assiette */}
      <ellipse cx="142" cy="146" rx="118" ry="30" fill="#000" opacity="0.10" filter={`url(#flou-${id})`} />

      {/* Assiette plate : tranche, dessus, cuvette peu profonde, reflet du rebord */}
      <ellipse cx="140" cy="122" rx="124" ry="50" fill="#dcd9d2" />
      <ellipse cx="140" cy="117" rx="124" ry="50" fill={`url(#plat-${id})`} stroke="#d9d9dd" strokeWidth="1" />
      <ellipse cx="140" cy="119" rx="92" ry="35" fill="#f4f2ee" />
      <ellipse cx="140" cy="118" rx="92" ry="35" fill="none" stroke="#e6e3dc" strokeWidth="1.5" />
      <path d="M44,104 C70,78 120,70 170,71" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />

      {/* Miettes de riz du côté mangé */}
      <g opacity={miettes}>
        {MIETTES.map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="2.6" ry="1.2" transform={`rotate(${r} ${x} ${y})`} fill="#fbf6ea" stroke="#e2d7bd" strokeWidth="0.5" />
        ))}
      </g>

      {/* Riz (taille fixe), découpé par le masque */}
      <g clipPath={`url(#mange-${id})`}>
        <ellipse cx="140" cy="124" rx="84" ry="15" fill="#000" opacity="0.09" />
        <path d={DOME} fill={`url(#riz-${id})`} stroke="#dcc9a0" strokeWidth="1" />
        {GRAINS.map((g, i) => (
          <ellipse
            key={i}
            cx={g.x}
            cy={g.y}
            rx="3"
            ry="1.3"
            transform={`rotate(${g.r} ${g.x} ${g.y})`}
            fill="#fffdf8"
            stroke="#d9c69c"
            strokeWidth="0.5"
            opacity={g.o}
          />
        ))}
        {/* Ombre douce côté droit pour le volume */}
        <path d="M164,50 C202,60 226,92 224,122 C214,128 200,132 186,134 C202,108 194,74 164,50 Z" fill="#cdb78a" opacity="0.35" />
      </g>
      {/* Tranche visible là où le riz a été mangé */}
      {f < 0.999 && (
        <g clipPath={`url(#dome-${id})`}>
          <path
            transform={`translate(${coupe - 3} 0)`}
            d={BORD}
            fill="none"
            stroke="#cdb78a"
            strokeWidth="5"
            opacity="0.55"
          />
        </g>
      )}
    </svg>
  );
}
