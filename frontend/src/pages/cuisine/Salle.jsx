import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Check } from "lucide-react";
import { CALQUES, useCalques } from "./calques";
import { erreurApi, getSalleCuisine } from "../../api/pro";
import EspaceLayout, { Alerte } from "../../components/EspaceLayout";
import { tiersEnFraction } from "../../utils/format";
import { ChoixVague, FicheEleve, Reglages } from "./commun";
import { dateLongue, useReglages } from "./reglages";
import { ONGLETS_CUISINE } from "./onglets";
import NotificationsCommandes from "./Notifications";

const R_TABLE = 30;
const R_SIEGE = 14;
const DIST = R_TABLE + 22;
const CELLULE = 170;

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

// Anneau de portion : 3 arcs autour du siège, autant d'arcs pleins que de tiers commandés.
function arc(r, debut, fin) {
  const p = (d) => [r * Math.sin((d * Math.PI) / 180), -r * Math.cos((d * Math.PI) / 180)];
  const [x1, y1] = p(debut);
  const [x2, y2] = p(fin);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

function Badge({ x, y, r = 6.5, fond, contour = "#FFFFFF", texte, couleur = "#FFFFFF", taille = 9 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fond} stroke={contour} strokeWidth="1.5" />
      <text y={taille * 0.36} textAnchor="middle" fontSize={taille} fontWeight="800" fill={couleur} fontFamily="Inter, sans-serif">{texte}</text>
    </g>
  );
}

// Un siège vu de dessus. Chaque calque ajoute un signe distinct (lettre, arcs, badge) : jamais la couleur seule.
export function SiegeService({ e, calques, rot = 0, retour = false }) {
  const on = (id) => calques.has(id);
  const R = R_SIEGE;
  const dossier = (couleur) => {
    const r = R + 4;
    const a = (34 * Math.PI) / 180;
    return (
      <path transform={`rotate(${rot})`} d={`M ${-r * Math.sin(a)} ${-r * Math.cos(a)} A ${r} ${r} 0 0 1 ${r * Math.sin(a)} ${-r * Math.cos(a)}`}
        fill="none" stroke={couleur} strokeWidth="2.4" strokeLinecap="round" />
    );
  };
  if (!e) {
    return (
      <g>
        {dossier("#EBEBEB")}
        <circle r={R} fill="#F7F7F7" stroke="#EBEBEB" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>
    );
  }
  const allergique = e.allergies.length > 0;
  const special = e.menu_type === "sans_allergene";
  const pleinRouge = on("allergies") && allergique && !on("plats");
  const fond = pleinRouge ? ROUGE : on("plats") && special ? CORAIL : "#FFFFFF";
  const texte = (t, couleur, taille) => (
    <text y={taille * 0.36} textAnchor="middle" fontSize={taille} fontWeight="700" fill={couleur} fontFamily="Inter, sans-serif">{t}</text>
  );
  const fait = retour && e.consommation;
  return (
    <g opacity={fait ? 0.55 : 1}>
      {dossier(allergique && on("allergies") ? ROUGE : NOIR)}
      {on("allergies") && allergique && !pleinRouge && <circle r={R + 4.5} fill="none" stroke={ROUGE} strokeWidth="2.5" />}
      <circle r={R} fill={fond} stroke={on("portions") ? "#EBEBEB" : fond === "#FFFFFF" ? NOIR : fond} strokeWidth={on("portions") ? 3.5 : 1.5} />
      {on("portions") && [0, 1, 2].map((k) => (
        k < e.tiers && <path key={k} d={arc(R, k * 120 + 6, (k + 1) * 120 - 6)} fill="none" stroke={NOIR} strokeWidth="3.5" strokeLinecap="round" />
      ))}
      {pleinRouge && texte("!", "#FFFFFF", 15)}
      {on("plats") && texte(e.code, special ? "#FFFFFF" : NOIR, 13)}
      {allergique && !pleinRouge && (
        on("allergies")
          ? <Badge x={R - 1} y={-R + 1} r={7.5} fond={ROUGE} texte="!" taille={11} />
          : <Badge x={R - 2} y={-R + 2} fond={ROUGE} texte="!" />
      )}
      {on("particularites") && e.regime && <Badge x={-R + 2} y={R - 2} fond="#FFFFFF" contour={CORAIL} texte="R" couleur={CORAIL} />}
      {retour && e.consommation === "termine" && <Badge x={R - 1} y={R - 1} r={7.5} fond={NOIR} texte="✓" taille={10} />}
      {retour && e.consommation === "non_termine" && <Badge x={R - 1} y={R - 1} r={7.5} fond={CORAIL} texte="✕" taille={10} />}
    </g>
  );
}

function MiniSiege({ e, calques }) {
  return (
    <svg width="30" height="30" viewBox="-22 -22 44 44" aria-hidden="true" className="shrink-0">
      <SiegeService e={e} calques={calques} />
    </svg>
  );
}

// « Terminale A » devient « Ter A » : court et sans ambiguïté sur le plan.
const abreger = (c = "") => {
  const m = c.trim().split(/\s+/);
  return m.length > 1 ? `${m[0].slice(0, 3)} ${m[m.length - 1]}` : c.slice(0, 5);
};

export function Plan({ salle, calques, onSelect, retour = false }) {
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
                ? `${t.nom} place ${p.numero}, ${e.nom}, ${e.classe}, ${e.plat_nom}, ${tiersEnFraction(e.tiers)}${e.allergies.length ? `, allergie ${e.allergies.join(", ")}` : ""}${e.regime ? `, ${e.regime}` : ""}${retour && e.consommation ? `, ${e.consommation === "termine" ? "repas terminé" : "repas non terminé"}` : ""}`
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
                    <SiegeService e={e} calques={calques} rot={deg + 90} retour={retour} />
                  </g>
                  {e && calques.has("classes") && (
                    <text x={tx + (DIST + R_SIEGE + 11) * Math.cos(a)} y={ty + (DIST + R_SIEGE + 11) * Math.sin(a) + 3} textAnchor="middle"
                      fontSize="8.5" fontWeight="600" fill="#717171" fontFamily="Inter, sans-serif">{abreger(e.classe)}</text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export function Legende({ salle, calques }) {
  const eleves = salle.tables.flatMap((t) => t.places.map((p) => p.eleve).filter(Boolean));
  const n = (f) => eleves.filter(f).length;
  const ex = { allergies: [], regime: null, tiers: 3, menu_type: "principal", code: "A", classe: "" };
  const seul = (id) => new Set([id]);
  const groupes = [];
  if (calques.has("allergies")) groupes.push({ titre: "Allergies", lignes: [
    { e: { ...ex, allergies: ["x"] }, c: seul("allergies"), label: "Allergie déclarée", nb: n((e) => e.allergies.length), rouge: true },
  ] });
  if (calques.has("portions")) groupes.push({ titre: "Portions", lignes: [1, 2, 3].map((t) => (
    { e: { ...ex, tiers: t }, c: seul("portions"), label: `Portion ${tiersEnFraction(t)}`, nb: n((e) => e.tiers === t) }
  )) });
  if (calques.has("plats")) groupes.push({ titre: "Plats commandés", lignes: salle.plats.map((p) => (
    { e: { ...ex, code: p.code, menu_type: p.type }, c: seul("plats"), label: p.plat_nom, nb: n((e) => e.menu_id === p.menu_id) }
  )) });
  if (calques.has("classes")) {
    const classes = [...new Set(eleves.map((e) => e.classe))].sort();
    groupes.push({ titre: "Classes", texte: classes.map((c) => `${abreger(c)} = ${c} (${n((e) => e.classe === c)})`) });
  }
  if (calques.has("particularites")) groupes.push({ titre: "Particularités", lignes: [
    { e: { ...ex, regime: "x" }, c: seul("particularites"), label: "Régime particulier", nb: n((e) => e.regime) },
  ] });
  if (!groupes.length) return <p className="text-[14px] text-[#717171]">Activez un calque pour afficher ses informations.</p>;
  return (
    <div className="space-y-5">
      {groupes.map((g) => (
        <div key={g.titre}>
          <p className="text-[12px] uppercase tracking-[0.28px] text-[#B0B0B0]">{g.titre}</p>
          {g.lignes && (
            <ul className="mt-2 space-y-1.5">
              {g.lignes.map((l) => (
                <li key={l.label} className={`flex items-center gap-3 text-[14px] ${l.rouge ? "font-medium text-[#B30000]" : "text-[#222222]"}`}>
                  <MiniSiege e={l.e} calques={l.c} />
                  <span className="min-w-0 flex-1 truncate">{l.label}</span>
                  <span className="tabular-nums text-[#717171]">{l.nb}</span>
                </li>
              ))}
            </ul>
          )}
          {g.texte && <p className="mt-2 text-[13px] leading-relaxed text-[#717171]">{g.texte.join(" · ") || "Aucune"}</p>}
        </div>
      ))}
      <p className="flex items-center gap-3 text-[13px] text-[#717171]">
        <MiniSiege e={null} calques={new Set()} /> Place libre
      </p>
    </div>
  );
}

// Interrupteurs indépendants : plusieurs calques visibles en même temps.
export function ChoixCalques({ calques, onToggle, liste = CALQUES }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Calques affichés sur le plan">
      {liste.map(({ id, label, icone: Icone }) => {
        const actif = calques.has(id);
        return (
          <button key={id} type="button" aria-pressed={actif} onClick={() => onToggle(id)}
            className={`flex h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors ${
              actif ? "border-[#FF5A5F] bg-[#FFF0ED] text-[#222222]" : "border-[#EBEBEB] bg-white text-[#717171] hover:border-[#222222]"
            }`}>
            <Icone size={16} strokeWidth={2} className={actif && id === "allergies" ? "text-[#B30000]" : ""} aria-hidden="true" />
            {label}
            <span className={`ml-0.5 flex h-4 w-4 items-center justify-center rounded-[5px] border ${actif ? "border-[#FF5A5F] bg-[#FF5A5F] text-white" : "border-[#B0B0B0]"}`} aria-hidden="true">
              {actif && <Check size={11} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function SalleCuisine() {
  const { date, setDate, mode, setMode } = useReglages();
  const [params, setParams] = useSearchParams();
  const vague = params.get("vague") || undefined;
  const [salle, setSalle] = useState(null);
  const [erreur, setErreur] = useState("");
  const [calques, basculer] = useCalques("cuisine.calques", ["allergies", "plats"]);
  const [eleve, setEleve] = useState(null);

  useEffect(() => {
    getSalleCuisine(date, vague, mode)
      .then((d) => { setSalle(d); setErreur(""); })
      .catch((e) => setErreur(erreurApi(e, "Plan indisponible.")));
  }, [date, vague, mode]);

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
      outils={<NotificationsCommandes />}
      large
      action={<Reglages date={date} setDate={setDate} mode={salle?.mode} modes={[]} setMode={setMode} />}
    >
      <Alerte>{erreur}</Alerte>
      {salle && (
        <>
          <ChoixVague vagues={salle.vagues} valeur={salle.vague} onChange={(cle) => setParams({ vague: cle }, { replace: true })} />

          <div className="mt-5"><ChoixCalques calques={calques} onToggle={basculer} /></div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            <div className="rounded-[28px] border border-[#EBEBEB] bg-white px-2 py-4 sm:p-6">
              {salle.tables.length ? (
                <Plan salle={salle} calques={calques} onSelect={setEleve} />
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
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF5A5F]">Légende</p>
                <div className="mt-3"><Legende salle={salle} calques={calques} /></div>
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
