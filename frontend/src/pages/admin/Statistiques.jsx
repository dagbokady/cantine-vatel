import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays } from "lucide-react";
import { erreurApi, getStatistiques } from "../../api/pro";
import EspaceLayout from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";
import { titreStyle } from "../../utils/tokens";
import ChampDate from "./ChampDate";
import { ONGLETS_ADMIN } from "./onglets";
import { AvisPlats, Barres, Etat, LigneAvis, ResumeService } from "./stats";
import { nombre, pct } from "./statsFormat";

const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const nomMois = (m) => new Date(`${m}-15T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
const ratio = (r) => (r.likes + r.dislikes ? (100 * r.likes) / (r.likes + r.dislikes) : null);

function Titre({ sur, children, aside }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF5A5F]">{sur}</p>
        <h2 className="mt-1.5 text-[24px] font-semibold leading-tight text-[#222222]" style={titreStyle}>{children}</h2>
      </div>
      {aside}
    </div>
  );
}

// Écart avec la période précédente. `inverse` : une hausse est une mauvaise nouvelle (gaspillage).
function Ecart({ label, actuel, precedent, unite = "", uniteEcart = unite, inverse = false }) {
  const delta = actuel != null && precedent != null ? actuel - precedent : null;
  const mauvais = delta != null && delta !== 0 && (delta > 0) === inverse;
  const Fleche = delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="min-w-0 py-4">
      <p className="text-[13px] text-[#717171]">{label}</p>
      <p className="mt-1.5 text-[26px] font-semibold leading-none text-[#222222]" style={titreStyle}>
        {actuel == null ? "–" : `${nombre(actuel)}${unite}`}
      </p>
      <p className={`mt-2 flex items-center gap-1 text-[12px] ${mauvais ? "text-[#B30000]" : "text-[#717171]"}`}>
        {delta == null ? "Pas de comparaison" : delta === 0 ? "Stable" : (
          <>
            <Fleche size={14} aria-hidden="true" />
            {delta > 0 ? "+" : ""}{nombre(delta)}{uniteEcart} <span className="text-[#B0B0B0]">vs mois précédent</span>
          </>
        )}
      </p>
    </div>
  );
}

function Mois({ d }) {
  const r = d.resume;
  const p = d.precedent.resume;
  return (
    <>
      <ResumeService resume={r} libelle={`Repas commandés en ${nomMois(d.mois)}`} />

      <section className="mt-10">
        <Titre sur="Comparaison">Par rapport à {nomMois(d.precedent.mois)}</Titre>
        <div className="grid grid-cols-2 gap-x-6 border-y border-[#EBEBEB] sm:grid-cols-4">
          <Ecart label="Commandes" actuel={r.commandes} precedent={p.commandes || null} />
          <Ecart label="Plats servis" actuel={r.servis} precedent={p.servis || null} />
          <Ecart label="Gaspillage" actuel={r.taux_gaspillage} precedent={p.taux_gaspillage} unite=" %" uniteEcart=" pts" inverse />
          <Ecart label="Appréciation" actuel={ratio(r) == null ? null : Math.round(ratio(r))}
            precedent={ratio(p) == null ? null : Math.round(ratio(p))} unite=" %" uniteEcart=" pts" />
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[22px] border border-[#EBEBEB] p-6">
          <Titre sur="Évolution">Gaspillage par jour</Titre>
          <Barres points={d.evolution} valeur={(x) => x.taux_gaspillage} libelle="Gaspillage par jour" />
        </div>
        <div className="rounded-[22px] bg-[#FFF0ED] p-6">
          <Titre sur="Évolution">Appréciation par jour</Titre>
          <Barres points={d.evolution} valeur={(x) => x.appreciation} couleur="bg-[#222222]" libelle="Appréciation par jour"
            vide="Aucun avis sur la période." />
        </div>
      </section>

      <section className="mt-12">
        <Titre sur="Classement" aside={<p className="text-[12px] text-[#B0B0B0]">Au moins {d.min_repas_classement} repas commandés</p>}>
          Élèves qui gaspillent le plus
        </Titre>
        {d.eleves_gaspillage.length === 0 ? (
          <p className="rounded-[22px] bg-[#F7F7F7] p-6 text-[14px] text-[#717171]">
            Pas assez d'observations pour établir un classement sur ce mois.
          </p>
        ) : (
          <ol className="divide-y divide-[#EBEBEB] border-y border-[#EBEBEB]">
            {d.eleves_gaspillage.map((e, i) => (
              <li key={e.eleve_id} className="flex items-center gap-3 py-3.5 sm:gap-4">
                <span className="w-5 shrink-0 text-[15px] font-semibold text-[#B0B0B0]" style={titreStyle}>{i + 1}</span>
                <Avatar nom={e.nom} photo={e.photo} taille={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-[#222222]">{e.nom}</p>
                  <p className="truncate text-[13px] text-[#717171]">{e.classe} · {e.matricule}</p>
                </div>
                <div className="hidden text-right text-[13px] text-[#717171] sm:block">
                  <p>{e.non_termines} non terminés</p>
                  <p className="text-[#B0B0B0]">sur {e.commandes} repas</p>
                </div>
                <div className="w-[68px] shrink-0 text-right">
                  <p className="text-[18px] font-semibold text-[#222222]" style={titreStyle}>{pct(e.taux)}</p>
                  <p className="text-[11px] text-[#B0B0B0] sm:hidden">{e.non_termines}/{e.commandes}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-[12px] leading-relaxed text-[#B0B0B0]">
          Taux = repas non terminés / repas commandés. Une tendance à confirmer, pas un jugement sur un seul repas.
        </p>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <Titre sur="Les plus aimés">Plats favoris</Titre>
          {d.plats_aimes.length ? (
            <ol className="divide-y divide-[#EBEBEB]">{d.plats_aimes.map((a, i) => <LigneAvis key={a.plat_id} a={a} rang={i + 1} />)}</ol>
          ) : <p className="text-[14px] text-[#717171]">Pas assez d'avis (au moins {d.min_avis_classement} par plat).</p>}
        </div>
        <div>
          <Titre sur="Les moins aimés">Plats à retravailler</Titre>
          {d.plats_moins_aimes.length ? (
            <ol className="divide-y divide-[#EBEBEB]">{d.plats_moins_aimes.map((a, i) => <LigneAvis key={a.plat_id} a={a} rang={i + 1} />)}</ol>
          ) : <p className="text-[14px] text-[#717171]">Pas assez d'avis (au moins {d.min_avis_classement} par plat).</p>}
        </div>
      </section>
    </>
  );
}

function Jour({ d }) {
  return (
    <>
      {d.resume.commandes === 0 ? (
        <p className="rounded-[22px] bg-[#F7F7F7] p-8 text-[15px] text-[#717171]">Aucun repas commandé ce jour-là.</p>
      ) : (
        <ResumeService resume={d.resume} />
      )}
      <section className="mt-12">
        <Titre sur="Avis">Appréciation des plats</Titre>
        <AvisPlats avis={d.avis} vide="Aucun avis ce jour-là." />
      </section>
    </>
  );
}

export default function Statistiques() {
  const aujourdhui = isoLocal(new Date());
  const [periode, setPeriode] = useState("mois");
  const [mois, setMois] = useState(aujourdhui.slice(0, 7));
  const [date, setDate] = useState(aujourdhui);
  const [res, setRes] = useState({ cle: null, d: null, erreur: "" });
  const [essai, setEssai] = useState(0);
  const cle = periode === "mois" ? `mois:${mois}` : `jour:${date}`;

  useEffect(() => {
    if (!cle.split(":")[1]) return undefined;
    let actif = true;
    const params = periode === "mois" ? { periode, mois } : { periode, date };
    getStatistiques(params)
      .then((d) => actif && setRes({ cle, d, erreur: "" }))
      .catch((e) => actif && setRes({ cle, d: null, erreur: erreurApi(e, "Impossible de charger les statistiques.") }));
    return () => { actif = false; };
  }, [cle, periode, mois, date, essai]);

  const aJour = res.cle === cle;
  const d = aJour ? res.d : null;
  const erreur = aJour ? res.erreur : "";
  const charger = () => { setRes((r) => ({ ...r, cle: null })); setEssai((n) => n + 1); };
  const bon = !!d;

  return (
    <EspaceLayout large onglets={ONGLETS_ADMIN} surTitre="Historique du service" titre="Statistiques">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Période" className="flex h-11 rounded-full bg-[#F7F7F7] p-1">
          {[["mois", "Mensuel"], ["jour", "Journalier"]].map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={periode === v} onClick={() => setPeriode(v)}
              className={`h-9 rounded-full px-4 text-[14px] font-medium transition-colors ${periode === v ? "bg-white text-[#222222] shadow-[0_1px_4px_rgba(34,34,34,0.12)]" : "text-[#717171]"}`}>
              {l}
            </button>
          ))}
        </div>
        {periode === "mois" ? (
          <label className="flex h-11 items-center gap-2 rounded-full border border-[#EBEBEB] bg-white pl-4 pr-2 text-[14px] text-[#222222] transition-colors focus-within:border-[#222222] hover:border-[#222222]">
            <CalendarDays size={16} strokeWidth={1.75} className="text-[#717171]" aria-hidden="true" />
            <input type="month" value={mois} max={aujourdhui.slice(0, 7)} onChange={(e) => setMois(e.target.value)} aria-label="Mois"
              className="bg-transparent pr-1 outline-none" />
          </label>
        ) : (
          <ChampDate value={date} onChange={setDate} />
        )}
      </div>

      <Etat chargement={!bon && !erreur} erreur={erreur} onRetry={charger} />
      {bon && (periode === "mois" ? <Mois d={d} /> : <Jour d={d} />)}
    </EspaceLayout>
  );
}
