import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, PieChart, Utensils } from "lucide-react";
import { erreurApi, getSalleCuisine } from "../../api/pro";
import EspaceLayout, { Alerte } from "../../components/EspaceLayout";
import { tiersEnFraction } from "../../utils/format";
import { ChoixVague, FicheEleve, Reglages } from "./commun";
import { dateLongue, useReglages } from "./reglages";
import { ONGLETS_CUISINE } from "./onglets";

const R_TABLE = 30;
const R_SIEGE = 14;
const DIST = R_TABLE + 22;
const CELLULE = 170;

const LENTILLES = [
  { id: "allergies", label: "Allergies", icone: AlertTriangle },
  { id: "portions", label: "Portions", icone: PieChart },
  { id: "plats", label: "Plats", icone: Utensils },
];

function useLarge() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 768px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
  );
}

const ROUGE = "#B30000";
const CORAIL = "#FF5A5F";
const NOIR = "#222222";

function secteur(tiers) {
  if (tiers >= 3) return null;
  const a = (tiers / 3) * 2 * Math.PI;
  const r = R_SIEGE - 3;
  return `M 0 0 L 0 ${-r} A ${r} ${r} 0 ${tiers / 3 > 0.5 ? 1 : 0} 1 ${r * Math.sin(a)} ${-r * Math.cos(a)} Z`;
}

// Un siège vu de dessus. L'information n'est jamais portée par la seule couleur : symbole, lettre ou remplissage.
export function SiegeService({ e, lentille, rot = 0 }) {
  const dossier = (couleur) => {
    const r = R_SIEGE + 4;
    const a = (34 * Math.PI) / 180;
    return (
      <path transform={`rotate(${rot})`} d={`M ${-r * Math.sin(a)} ${-r * Math.cos(a)} A ${r} ${r} 0 0 1 ${r * Math.sin(a)} ${-r * Math.cos(a)}`}
        fill="none" stroke={couleur} strokeWidth="2.4" strokeLinecap="round" />
    );
  };
  const texte = (t, couleur, taille = 12) => (
    <text y={taille * 0.36} textAnchor="middle" fontSize={taille} fontWeight="700" fill={couleur} fontFamily="Inter, sans-serif">{t}</text>
  );

  if (!e) {
    return (
      <g>
        {dossier("#EBEBEB")}
        <circle r={R_SIEGE} fill="#F7F7F7" stroke="#EBEBEB" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
    );
  }
  const allergique = e.allergies.length > 0;
  let corps;
  if (lentille === "allergies") {
    corps = allergique ? (
      <><circle r={R_SIEGE} fill={ROUGE} />{texte("!", "#FFFFFF", 15)}</>
    ) : e.regime ? (
      <><circle r={R_SIEGE} fill="#FFF0ED" stroke={CORAIL} strokeWidth="2" />{texte("R", CORAIL)}</>
    ) : (
      <circle r={R_SIEGE} fill="#FFFFFF" stroke={NOIR} strokeWidth="1.5" />
    );
  } else if (lentille === "portions") {
    const d = secteur(e.tiers);
    corps = (
      <>
        <circle r={R_SIEGE} fill="#FFFFFF" stroke={NOIR} strokeWidth="1.5" />
        {d ? <path d={d} fill={NOIR} /> : <circle r={R_SIEGE - 3} fill={NOIR} />}
      </>
    );
  } else {
    const special = e.menu_type === "sans_allergene";
    corps = (
      <>
        <circle r={R_SIEGE} fill={special ? CORAIL : "#FFFFFF"} stroke={special ? CORAIL : NOIR} strokeWidth="1.5" />
        {texte(e.code, special ? "#FFFFFF" : NOIR, 13)}
      </>
    );
  }
  return (
    <g>
      {dossier(lentille === "allergies" && allergique ? ROUGE : NOIR)}
      {corps}
      {lentille !== "allergies" && allergique && (
        <g transform={`translate(${R_SIEGE - 2} ${-R_SIEGE + 2})`}>
          <circle r="6.5" fill={ROUGE} stroke="#FFFFFF" strokeWidth="1.5" />
          <text y="3" textAnchor="middle" fontSize="9" fontWeight="800" fill="#FFFFFF" fontFamily="Inter, sans-serif">!</text>
        </g>
      )}
    </g>
  );
}

function MiniSiege({ e, lentille }) {
  return (
    <svg width="26" height="26" viewBox="-20 -20 40 40" aria-hidden="true" className="shrink-0">
      <SiegeService e={e} lentille={lentille} />
    </svg>
  );
}

function Plan({ salle, lentille, onSelect }) {
  const large = useLarge();
  const cols = Math.min(large ? 4 : 2, Math.max(1, salle.tables.length));
  const rangs = Math.ceil(salle.tables.length / cols);
  const L = cols * CELLULE;
  const H = rangs * CELLULE;
  return (
    <svg viewBox={`0 0 ${L} ${H}`} width="100%" style={{ display: "block", maxWidth: cols * 210 }} className="mx-auto" role="group" aria-label="Plan de la salle">
      {salle.tables.map((t, i) => {
        const tx = (i % cols) * CELLULE + CELLULE / 2;
        const ty = Math.floor(i / cols) * CELLULE + CELLULE / 2;
        const occupes = t.places.filter((p) => p.eleve).length;
        return (
          <g key={t.id}>
            <circle cx={tx} cy={ty} r={R_TABLE} fill={occupes ? "#FFFFFF" : "#F7F7F7"} stroke="#EBEBEB" strokeWidth="1.5" />
            <text x={tx} y={ty + 2} textAnchor="middle" fontSize="16" fontWeight="700" fill={NOIR} fontFamily="'Space Grotesk', sans-serif">{t.nom}</text>
            <text x={tx} y={ty + 15} textAnchor="middle" fontSize="9" fill="#717171" fontFamily="Inter, sans-serif">{occupes}/{t.places.length}</text>
            {t.places.map((p, j) => {
              const deg = Number.isFinite(p.angle) ? p.angle : (360 / t.places.length) * j - 90;
              const a = (deg * Math.PI) / 180;
              const cx = tx + DIST * Math.cos(a);
              const cy = ty + DIST * Math.sin(a);
              const e = p.eleve;
              const label = e
                ? `${t.nom} place ${p.numero}, ${e.nom}, ${e.plat_nom}, ${tiersEnFraction(e.tiers)}${e.allergies.length ? `, allergie ${e.allergies.join(", ")}` : ""}`
                : `${t.nom} place ${p.numero}, libre`;
              return (
                <g
                  key={p.id}
                  role={e ? "button" : "img"}
                  tabIndex={e ? 0 : undefined}
                  aria-label={label}
                  style={{ cursor: e ? "pointer" : "default", outline: "none" }}
                  onClick={e ? () => onSelect(e) : undefined}
                  onKeyDown={e ? (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect(e); } } : undefined}
                >
                  <circle cx={cx} cy={cy} r={22} fill="transparent" />
                  <g transform={`translate(${cx} ${cy})`}>
                    <SiegeService e={e} lentille={lentille} rot={deg + 90} />
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

function Legende({ salle, lentille }) {
  const eleves = salle.tables.flatMap((t) => t.places.map((p) => p.eleve).filter(Boolean));
  const n = (f) => eleves.filter(f).length;
  const exemple = { allergies: [], regime: null, tiers: 3, menu_type: "principal", code: "A" };
  let lignes;
  if (lentille === "allergies") {
    lignes = [
      { e: { ...exemple, allergies: ["x"] }, label: "Allergie", nb: n((e) => e.allergies.length) },
      { e: { ...exemple, regime: "x" }, label: "Régime particulier", nb: n((e) => !e.allergies.length && e.regime) },
      { e: exemple, label: "Sans contrainte", nb: n((e) => !e.allergies.length && !e.regime) },
    ];
  } else if (lentille === "portions") {
    lignes = [1, 2, 3].map((t) => ({ e: { ...exemple, tiers: t }, label: `Portion ${tiersEnFraction(t)}`, nb: n((e) => e.tiers === t) }));
  } else {
    lignes = salle.plats.map((p) => ({ e: { ...exemple, code: p.code, menu_type: p.type }, label: p.plat_nom, nb: n((e) => e.menu_id === p.menu_id) }));
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {lignes.map((l) => (
        <li key={l.label} className="flex items-center gap-3 text-[14px]">
          <MiniSiege e={l.e} lentille={lentille} />
          <span className="min-w-0 flex-1 truncate text-[#222222]">{l.label}</span>
          <span className="tabular-nums text-[#717171]">{l.nb}</span>
        </li>
      ))}
      <li className="flex items-center gap-3 text-[14px]">
        <MiniSiege e={null} lentille={lentille} />
        <span className="flex-1 text-[#717171]">Place libre</span>
      </li>
      {lentille !== "allergies" && (
        <li className="flex items-center gap-3 text-[13px] text-[#B30000]">
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#B30000] text-[9px] font-extrabold text-white">!</span>
          </span>
          Allergie toujours signalée
        </li>
      )}
    </ul>
  );
}

export default function SalleCuisine() {
  const { date, setDate, mode, setMode } = useReglages();
  const [params, setParams] = useSearchParams();
  const vague = params.get("vague") || undefined;
  const [salle, setSalle] = useState(null);
  const [erreur, setErreur] = useState("");
  const [lentille, setLentille] = useState(() => {
    try { return localStorage.getItem("cuisine.lentille") || "allergies"; } catch { return "allergies"; }
  });
  const [eleve, setEleve] = useState(null);

  useEffect(() => {
    getSalleCuisine(date, vague, mode)
      .then((d) => { setSalle(d); setErreur(""); })
      .catch((e) => setErreur(erreurApi(e, "Plan indisponible.")));
  }, [date, vague, mode]);

  const choisirLentille = (id) => {
    setLentille(id);
    try { localStorage.setItem("cuisine.lentille", id); } catch { /* sans stockage */ }
  };
  const allergiques = useMemo(
    () => salle?.tables.flatMap((t) => t.places.map((p) => p.eleve).filter((e) => e?.allergies.length)) ?? [],
    [salle],
  );
  const vagueCourante = salle?.vagues.find((v) => v.cle === salle.vague);

  return (
    <EspaceLayout
      titre="La salle"
      surTitre={dateLongue(date)}
      onglets={ONGLETS_CUISINE}
      large
      action={<Reglages date={date} setDate={setDate} mode={salle?.mode} modes={[]} setMode={setMode} />}
    >
      <Alerte>{erreur}</Alerte>
      {salle && (
        <>
          <ChoixVague vagues={salle.vagues} valeur={salle.vague} onChange={(cle) => setParams({ vague: cle }, { replace: true })} />

          <div role="radiogroup" aria-label="Que visualiser ?" className="mt-5 grid grid-cols-3 gap-1 rounded-full bg-[#F7F7F7] p-1 sm:inline-grid">
            {LENTILLES.map(({ id, label, icone: Icone }) => (
              <button key={id} type="button" role="radio" aria-checked={lentille === id} onClick={() => choisirLentille(id)}
                className={`flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors ${
                  lentille === id ? "bg-white text-[#222222] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-[#717171]"
                }`}>
                <Icone size={16} strokeWidth={2} className={lentille === id && id === "allergies" ? "text-[#B30000]" : ""} />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="rounded-[28px] border border-[#EBEBEB] bg-white px-2 py-4 sm:p-6">
              {salle.tables.length ? (
                <Plan salle={salle} lentille={lentille} onSelect={setEleve} />
              ) : (
                <p className="p-6 text-[14px] text-[#717171]">
                  Aucune table pour cette vague. L'administration peut réserver des tables à chaque classe dans le plan de salle.
                </p>
              )}
              {salle.sans_place > 0 && (
                <p className="mt-3 px-4 text-[13px] text-[#717171]">{salle.sans_place} élève(s) sans place attribuée.</p>
              )}
            </div>
            <aside className="space-y-6">
              <div>
                <p className="text-[12px] uppercase tracking-[0.28px] text-[#B0B0B0]">Légende</p>
                <div className="mt-3"><Legende salle={salle} lentille={lentille} /></div>
              </div>
              {allergiques.length > 0 && (
                <div className="rounded-[22px] border-2 border-[#B30000] p-4">
                  <p className="flex items-center gap-2 text-[14px] font-semibold text-[#B30000]"><AlertTriangle size={16} /> À surveiller</p>
                  <ul className="mt-2 space-y-1.5">
                    {allergiques.map((e) => (
                      <li key={e.id}>
                        <button type="button" onClick={() => setEleve(e)} className="w-full text-left text-[14px] text-[#222222]">
                          <span className="font-medium">{e.place}</span> {e.nom} <span className="text-[#B30000]">· {e.allergies.join(", ")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
      <FicheEleve eleve={eleve} vague={vagueCourante ? `${vagueCourante.nom}` : null} onClose={() => setEleve(null)} />
    </EspaceLayout>
  );
}
