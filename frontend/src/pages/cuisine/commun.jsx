import { useEffect, useState } from "react";
import { AlertTriangle, ThumbsDown, ThumbsUp } from "lucide-react";
import { getStatsEleve } from "../../api/pro";
import Panneau from "../../components/Panneau";
import { Avatar } from "../../components/ui";
import { formatHeure, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { MODE_LIBELLE } from "./reglages";

// Barre de réglages : date du service, et choix du mode uniquement s'il y en a plusieurs.
export function Reglages({ date, setDate, mode, modes = [], setMode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => e.target.value && setDate(e.target.value)}
        aria-label="Date du service"
        className="h-11 rounded-full border border-[#EBEBEB] bg-white px-4 text-[14px] text-[#222222] outline-none focus:border-[#222222]"
      />
      {modes.length > 1 && (
        <div role="radiogroup" aria-label="Mode de fonctionnement" className="flex h-11 rounded-full bg-[#F7F7F7] p-1">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 text-[13px] font-medium transition-colors ${mode === m ? "bg-white text-[#222222] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-[#717171]"}`}
            >
              {MODE_LIBELLE[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Sélecteur horizontal de vagues (créneaux ou classes).
export function ChoixVague({ vagues = [], valeur, onChange, compteur }) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Vagues">
      {vagues.map((v) => {
        const actif = v.cle === valeur;
        return (
          <button
            key={v.cle}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => onChange(v.cle)}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] transition-colors ${
              actif ? "border-[#222222] bg-[#222222] text-white" : "border-[#EBEBEB] bg-white text-[#222222] hover:border-[#222222]"
            }`}
          >
            <span className="font-medium">{v.nom}</span>
            {v.sous_titre === "Classe" && v.heure_debut && (
              <span className={actif ? "text-white/70" : "text-[#717171]"}>{formatHeure(v.heure_debut)}</span>
            )}
            {compteur && <span className={actif ? "text-white/70" : "text-[#717171]"}>{compteur(v)}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function PuceAllergie({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#B30000] px-2.5 py-1 text-[12px] font-medium text-white">
      <AlertTriangle size={12} strokeWidth={2.5} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Puce({ children, ton = "gris" }) {
  const tons = {
    gris: "bg-[#F7F7F7] text-[#222222]",
    rose: "bg-[#FFF0ED] text-[#222222]",
    contour: "border border-[#EBEBEB] bg-white text-[#717171]",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] ${tons[ton]}`}>{children}</span>;
}

export function BarreProgression({ valeur, total, libelle }) {
  const pct = total ? Math.round((100 * valeur) / total) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EBEBEB]"
        role="progressbar"
        aria-label={libelle}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={valeur}
      >
        <div className="h-full rounded-full bg-[#FF5A5F] transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-[12px] tabular-nums text-[#717171]">{valeur}/{total}</span>
    </div>
  );
}

// Fiche élève : identité, repas du jour, particularités et historique de consommation.
export function FicheEleve({ eleve, vague, onClose }) {
  const [charge, setCharge] = useState({ id: null, stats: null });
  useEffect(() => {
    if (!eleve) return;
    let actif = true;
    getStatsEleve(eleve.id)
      .then((d) => actif && setCharge({ id: eleve.id, stats: d }))
      .catch(() => actif && setCharge({ id: eleve.id, stats: false }));
    return () => { actif = false; };
  }, [eleve]);
  const stats = charge.id === eleve?.id ? charge.stats : null;

  return (
    <Panneau ouvert={!!eleve} onClose={onClose} titre={eleve?.nom ?? ""} surTitre={eleve?.place ? `Place ${eleve.place}` : "Fiche élève"} cote>
      {eleve && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar nom={eleve.nom} photo={eleve.photo} taille={64} />
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-[#222222]">{eleve.classe}</p>
              {vague && vague !== eleve.classe && <p className="text-[14px] text-[#717171]">{vague}</p>}
            </div>
          </div>

          {eleve.allergies?.length > 0 && (
            <div className="rounded-[18px] border-2 border-[#B30000] p-4">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-[#B30000]">
                <AlertTriangle size={18} aria-hidden="true" /> Allergies
              </p>
              <p className="mt-1 text-[16px] font-medium capitalize text-[#222222]">{eleve.allergies.join(", ")}</p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-[18px] bg-[#F7F7F7] p-4">
              <dt className="text-[12px] text-[#717171]">Plat {eleve.menu_type === "sans_allergene" ? "spécial" : ""}</dt>
              <dd className="mt-0.5 text-[16px] font-medium text-[#222222]">{eleve.plat_nom}</dd>
            </div>
            <div className="rounded-[18px] bg-[#F7F7F7] p-4">
              <dt className="text-[12px] text-[#717171]">Portion</dt>
              <dd className="mt-0.5 text-[22px] font-semibold text-[#222222]" style={titreStyle}>{tiersEnFraction(eleve.tiers)}</dd>
            </div>
            <div className="rounded-[18px] bg-[#F7F7F7] p-4">
              <dt className="text-[12px] text-[#717171]">Régime</dt>
              <dd className="mt-0.5 text-[15px] font-medium text-[#222222]">{eleve.regime || "Aucun"}</dd>
            </div>
            {(eleve.avis != null || eleve.consommation) && (
              <div className="col-span-2 flex flex-wrap gap-2">
                {eleve.avis === 1 && <Puce ton="rose"><ThumbsUp size={13} className="mr-1" /> Apprécié</Puce>}
                {eleve.avis === -1 && <Puce><ThumbsDown size={13} className="mr-1" /> Pas apprécié</Puce>}
                {eleve.consommation && <Puce>{eleve.consommation === "termine" ? "Assiette terminée" : "Assiette non terminée"}</Puce>}
              </div>
            )}
          </dl>

          <section>
            <p className="text-[12px] uppercase tracking-[0.28px] text-[#B0B0B0]">Consommation réelle</p>
            {stats === null && <p className="mt-2 text-[14px] text-[#717171]">Chargement…</p>}
            {stats === false && <p className="mt-2 text-[14px] text-[#717171]">Historique indisponible.</p>}
            {stats && <Historique stats={stats} />}
          </section>
        </div>
      )}
    </Panneau>
  );
}

function Historique({ stats }) {
  const taux = stats.taux == null ? null : Math.round(stats.taux * 100);
  return (
    <div className="mt-2">
      <div className="flex items-end gap-3">
        <p className="text-[44px] font-semibold leading-none text-[#222222]" style={titreStyle}>{taux == null ? "–" : `${taux} %`}</p>
        <p className="pb-1 text-[14px] text-[#717171]">de repas terminés</p>
      </div>
      <p className="mt-2 text-[14px] text-[#717171]">
        {stats.commandes} repas commandés · {stats.termines} terminés · {stats.non_termines} non terminés
        {stats.observes < stats.commandes && ` · ${stats.commandes - stats.observes} sans retour`}
      </p>
      {stats.evolution.length > 0 && (
        <div className="mt-4 flex items-end gap-2" aria-label="Évolution par semaine">
          {stats.evolution.map((s) => (
            <div key={s.semaine} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[11px] tabular-nums text-[#717171]">{Math.round(s.taux * 100)} %</span>
              <div className="relative h-16 w-full overflow-hidden rounded-[8px] bg-[#F7F7F7]">
                <div className="absolute inset-x-0 bottom-0 rounded-[8px] bg-[#FF5A5F]" style={{ height: `${Math.max(4, s.taux * 100)}%` }} />
              </div>
              <span className="text-[10px] text-[#B0B0B0]">
                {new Date(`${s.semaine}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
      {stats.suggestion ? (
        <p className="mt-4 rounded-[14px] bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#222222]">
          Suggestion : passer de {tiersEnFraction(stats.suggestion.portion_actuelle)} à <strong>{tiersEnFraction(stats.suggestion.portion_suggeree)}</strong>,
          sur {stats.suggestion.observations} repas observés. En attente de validation par l'administration.
        </p>
      ) : (
        stats.observes < stats.min_observations && (
          <p className="mt-4 text-[13px] text-[#B0B0B0]">
            Aucune adaptation de portion avant {stats.min_observations} repas observés ({stats.observes} pour l'instant).
          </p>
        )
      )}
    </div>
  );
}
