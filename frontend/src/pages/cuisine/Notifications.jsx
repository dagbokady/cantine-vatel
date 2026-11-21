import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, X } from "lucide-react";
import { getService } from "../../api/pro";
import Panneau from "../../components/Panneau";
import { tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { TableauPortions } from "./portions";

const INTERVALLE_MS = 20_000;
const CLE = "cuisine.notifications";
const aujourdhui = () => new Date().toLocaleDateString("sv-SE");

// Photo du service : quantités par plat et par portion (une entrée par plat, jamais par portion).
function instantane(s) {
  const plats = {};
  for (const p of [...s.classiques, ...s.speciaux]) {
    if (p.type === "accompagnement") continue;
    plats[p.menu_id] = {
      menu_id: p.menu_id,
      plat_nom: p.plat_nom,
      special: p.type === "sans_allergene",
      evite: p.evite ?? [],
      particularites: p.particularites ?? [],
      couverts: p.couverts,
      par_portion: { 1: 0, 2: 0, 3: 0, ...p.par_portion },
    };
  }
  return plats;
}

function differences(avant, apres) {
  const out = [];
  for (const p of Object.values(apres)) {
    const a = avant[p.menu_id];
    const ajout = {};
    for (const t of ["1", "2", "3"]) {
      const d = (p.par_portion[t] ?? 0) - (a?.par_portion[t] ?? 0);
      if (d > 0) ajout[t] = d;
    }
    const n = Object.values(ajout).reduce((x, y) => x + y, 0);
    if (n > 0) out.push({ ...p, ajout, n });
  }
  return out;
}

function lire() {
  try { return JSON.parse(sessionStorage.getItem(CLE)) || null; } catch { return null; }
}
function ecrire(v) {
  try { sessionStorage.setItem(CLE, JSON.stringify(v)); } catch { /* stockage indisponible */ }
}

function Detail({ p }) {
  return (
    <>
      <p className="text-[15px] font-semibold text-[#222222]">{p.plat_nom}</p>
      {p.special && p.evite.length > 0 && (
        <p className="mt-1 flex flex-wrap items-center gap-1 text-[13px] font-medium text-[#B30000]">
          <AlertTriangle size={13} aria-hidden="true" /> Sans {p.evite.join(", ")}
        </p>
      )}
    </>
  );
}

// Cloche de la cuisine : nouvelles commandes du jour, regroupées par plat et par portion.
export default function NotificationsCommandes() {
  const [etat, setEtat] = useState(() => lire()?.date === aujourdhui() ? lire() : { date: aujourdhui(), plats: null, journal: [], nonLues: 0 });
  const [toast, setToast] = useState(null);
  const [ouvert, setOuvert] = useState(false);
  const minuteur = useRef(null);

  const verifier = useCallback(() => {
    const jour = aujourdhui();
    getService(jour)
      .then((s) => {
        const plats = instantane(s);
        setEtat((prec) => {
          const base = prec.date === jour ? prec : { date: jour, plats: null, journal: [], nonLues: 0 };
          // Premier passage : référence silencieuse, pas de rafale de notifications.
          const nouvelles = base.plats ? differences(base.plats, plats) : [];
          const suivant = {
            date: jour,
            plats,
            journal: [...nouvelles.map((x) => ({ ...x, a: new Date().toISOString() })), ...base.journal].slice(0, 30),
            nonLues: base.nonLues + nouvelles.length,
          };
          ecrire(suivant);
          if (nouvelles.length) {
            clearTimeout(minuteur.current);
            setToast(nouvelles);
            minuteur.current = setTimeout(() => setToast(null), 7000);
          }
          return suivant;
        });
      })
      .catch(() => { /* réessai au prochain passage */ });
  }, []);

  useEffect(() => {
    const premier = setTimeout(verifier, 0);
    const t = setInterval(verifier, INTERVALLE_MS);
    return () => { clearTimeout(premier); clearInterval(t); clearTimeout(minuteur.current); };
  }, [verifier]);

  const ouvrir = () => {
    setOuvert(true);
    setToast(null);
    setEtat((e) => { const s = { ...e, nonLues: 0 }; ecrire(s); return s; });
  };

  const plats = Object.values(etat.plats ?? {});
  const classiques = plats.filter((p) => !p.special);
  const speciaux = plats.filter((p) => p.special);

  return (
    <>
      <button type="button" onClick={ouvrir} aria-label={`Commandes du jour${etat.nonLues ? `, ${etat.nonLues} nouvelles` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:bg-[#F7F7F7]">
        <Bell size={19} strokeWidth={1.75} />
        {etat.nonLues > 0 && (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF5A5F] px-1 text-[11px] font-semibold text-white">
            {etat.nonLues > 9 ? "9+" : etat.nonLues}
          </span>
        )}
      </button>

      {toast && (
        <div role="status" aria-live="polite"
          className="fixed inset-x-4 top-[calc(64px+env(safe-area-inset-top))] z-40 mx-auto max-w-[420px] animate-[monte_260ms_cubic-bezier(0.2,0.8,0.2,1)] rounded-[22px] bg-[#222222] p-4 text-white shadow-[0_12px_40px_rgba(34,34,34,0.28)] md:left-auto md:right-6 md:mx-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF5A5F]">Nouvelles commandes</p>
            <button type="button" onClick={() => setToast(null)} aria-label="Fermer" className="-m-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10">
              <X size={16} />
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {toast.slice(0, 3).map((x) => (
              <li key={x.menu_id} className="text-[14px]">
                <span className="font-semibold">{x.plat_nom}</span>
                {x.special && x.evite.length > 0 && <span className="text-[#FF5A5F]"> · sans {x.evite.join(", ")}</span>}
                <span className="block text-[13px] text-white/70">
                  +{x.n} : {Object.entries(x.ajout).map(([t, n]) => `${tiersEnFraction(Number(t))} × ${n}`).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={ouvrir} className="mt-3 text-[13px] font-medium text-white underline underline-offset-4">Voir les quantités</button>
        </div>
      )}

      <Panneau ouvert={ouvert} onClose={() => setOuvert(false)} titre="Commandes du jour" surTitre="À préparer" cote>
        {!etat.plats && <p className="text-[14px] text-[#717171]">Chargement…</p>}
        {etat.plats && plats.length === 0 && <p className="text-[14px] text-[#717171]">Aucune commande pour l'instant.</p>}
        <div className="space-y-6">
          {classiques.map((p) => (
            <section key={p.menu_id}>
              <div className="flex items-baseline justify-between gap-3">
                <Detail p={p} />
                <p className="shrink-0 text-[26px] font-semibold text-[#222222]" style={titreStyle}>{p.couverts}</p>
              </div>
              <TableauPortions par={p.par_portion} className="mt-2" />
            </section>
          ))}
          {speciaux.length > 0 && (
            <section className="rounded-[22px] bg-[#FFF0ED] p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#717171]">Plats spéciaux</p>
              <ul className="mt-2 divide-y divide-[#222222]/10">
                {speciaux.map((p) => (
                  <li key={p.menu_id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0"><Detail p={p} /></div>
                    <p className="shrink-0 text-right">
                      <span className="block text-[22px] font-semibold leading-none" style={titreStyle}>{p.couverts}</span>
                      <span className="text-[12px] text-[#717171]">portion{p.couverts > 1 ? "s" : ""}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {etat.journal.length > 0 && (
            <section>
              <p className="text-[12px] uppercase tracking-[0.28px] text-[#B0B0B0]">Arrivées récentes</p>
              <ul className="mt-2 divide-y divide-[#EBEBEB]">
                {etat.journal.slice(0, 12).map((x) => (
                  <li key={`${x.menu_id}-${x.a}`} className="flex justify-between gap-3 py-2.5 text-[13px]">
                    <span className="min-w-0 truncate text-[#222222]">+{x.n} {x.plat_nom}</span>
                    <span className="shrink-0 tabular-nums text-[#717171]">
                      {new Date(x.a).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Panneau>
    </>
  );
}
