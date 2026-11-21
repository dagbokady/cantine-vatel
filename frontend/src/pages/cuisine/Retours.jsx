import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowRight, Check, CheckCheck, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { envoyerRetours, erreurApi, getSalleCuisine, getVague } from "../../api/pro";
import EspaceLayout, { Alerte } from "../../components/EspaceLayout";
import Panneau from "../../components/Panneau";
import { Avatar } from "../../components/ui";
import { tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { BarreProgression, ChoixVague, Reglages } from "./commun";
import { CALQUES, useCalques } from "./calques";
import { dateLongue, useReglages } from "./reglages";
import { ChoixCalques, Plan } from "./Salle";
import { ONGLETS_CUISINE } from "./onglets";
import NotificationsCommandes from "./Notifications";

const CALQUES_RETOURS = CALQUES.filter((c) => c.id !== "classes");

// Fiche rapide ouverte depuis une place : deux gestes, repas terminé ou non terminé.
function FicheRetour({ e, vague, onChoisir, onClose }) {
  if (!e) return null;
  const choix = (valeur) => onChoisir(e, { consommation: e.consommation === valeur ? null : valeur }, true);
  return (
    <Panneau ouvert onClose={onClose} titre={e.nom} surTitre={e.place ? `Place ${e.place}` : "Sans place"}
      pied={
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => choix("termine")} aria-pressed={e.consommation === "termine"}
            className={`flex h-16 flex-col items-center justify-center rounded-[18px] border-2 text-[14px] font-semibold transition-colors active:scale-[0.98] ${
              e.consommation === "termine" ? "border-[#222222] bg-[#222222] text-white" : "border-[#222222] bg-white text-[#222222]"}`}>
            <Check size={22} strokeWidth={2.5} aria-hidden="true" /> Repas terminé
          </button>
          <button type="button" onClick={() => choix("non_termine")} aria-pressed={e.consommation === "non_termine"}
            className={`flex h-16 flex-col items-center justify-center rounded-[18px] border-2 text-[14px] font-semibold transition-colors active:scale-[0.98] ${
              e.consommation === "non_termine" ? "border-[#FF5A5F] bg-[#FF5A5F] text-white" : "border-[#FF5A5F] bg-white text-[#222222]"}`}>
            <X size={22} strokeWidth={2.5} aria-hidden="true" /> Non terminé
          </button>
        </div>
      }>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar nom={e.nom} photo={e.photo} taille={56} />
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-[#222222]">{e.classe}</p>
            {vague && <p className="text-[14px] text-[#717171]">{vague}</p>}
          </div>
        </div>
        {e.allergies.length > 0 && (
          <p className="flex items-center gap-2 rounded-[14px] border-2 border-[#B30000] px-4 py-3 text-[14px] font-semibold text-[#B30000]">
            <AlertTriangle size={17} aria-hidden="true" /> Allergie : <span className="capitalize">{e.allergies.join(", ")}</span>
          </p>
        )}
        <dl className="grid grid-cols-[1fr_auto] gap-3">
          <div className="rounded-[18px] bg-[#F7F7F7] p-4">
            <dt className="text-[12px] text-[#717171]">{e.menu_type === "sans_allergene" ? "Plat spécial" : "Plat commandé"}</dt>
            <dd className="mt-0.5 text-[15px] font-medium text-[#222222]">{e.plat_nom}</dd>
          </div>
          <div className="rounded-[18px] bg-[#F7F7F7] p-4 text-center">
            <dt className="text-[12px] text-[#717171]">Portion</dt>
            <dd className="mt-0.5 text-[22px] font-semibold text-[#222222]" style={titreStyle}>{tiersEnFraction(e.tiers)}</dd>
          </div>
          {e.regime && (
            <div className="col-span-2 rounded-[18px] bg-[#FFF0ED] p-4">
              <dt className="text-[12px] text-[#717171]">Particularité</dt>
              <dd className="mt-0.5 text-[15px] font-medium text-[#222222]">{e.regime}</dd>
            </div>
          )}
        </dl>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#717171]">Avis</span>
          {[[1, ThumbsUp, "Aimé"], [-1, ThumbsDown, "Pas aimé"]].map(([v, Icone, l]) => (
            <button key={v} type="button" aria-pressed={e.avis === v} onClick={() => onChoisir(e, { avis: e.avis === v ? null : v }, false)}
              className={`flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium ${
                e.avis === v ? "border-[#222222] bg-[#222222] text-white" : "border-[#EBEBEB] text-[#222222]"}`}>
              <Icone size={15} aria-hidden="true" /> {l}
            </button>
          ))}
        </div>
      </div>
    </Panneau>
  );
}

export default function Retours() {
  const { date, setDate, mode } = useReglages();
  const [params, setParams] = useSearchParams();
  const [donnees, setDonnees] = useState(null); // { cle, salle, vague }
  const [erreur, setErreur] = useState("");
  const [fiche, setFiche] = useState(null);
  const [confirmer, setConfirmer] = useState(false);
  const [calques, basculer] = useCalques("cuisine.calques.retours", ["allergies"]);
  const demande = params.get("vague") || undefined;

  const charger = useCallback((cle) => {
    getSalleCuisine(date, cle, mode)
      .then((salle) => salle.vague
        ? getVague(salle.vague, date, mode).then((v) => setDonnees({ salle, vague: v }))
        : setDonnees({ salle, vague: null }))
      .then(() => setErreur(""))
      .catch((e) => setErreur(erreurApi(e, "Plan indisponible.")));
  }, [date, mode]);
  useEffect(() => { charger(demande); }, [charger, demande]);

  const salle = donnees?.salle;
  const eleves = useMemo(() => donnees?.vague?.eleves ?? [], [donnees]);
  const sansPlace = eleves.filter((e) => !e.place);
  const faits = eleves.filter((e) => e.consommation).length;
  const vagueCourante = salle?.vagues.find((v) => v.cle === salle.vague);
  const idx = salle?.vagues.findIndex((v) => v.cle === salle.vague) ?? -1;
  const suivante = idx >= 0 ? salle.vagues[idx + 1] : null;
  const libelleVague = vagueCourante ? (mode === "classe" || donnees?.vague?.sous_titre === "Classe" ? vagueCourante.nom : `Vague de ${vagueCourante.nom}`) : "";

  // Mise à jour immédiate sur le plan, annulée si le serveur refuse.
  const appliquer = (maj) => setDonnees((d) => d && ({
    ...d,
    vague: { ...d.vague, eleves: d.vague.eleves.map((e) => (maj[e.id] ? { ...e, ...maj[e.id] } : e)) },
    salle: { ...d.salle, tables: d.salle.tables.map((t) => ({
      ...t, places: t.places.map((p) => (p.eleve && maj[p.eleve.id] ? { ...p, eleve: { ...p.eleve, ...maj[p.eleve.id] } } : p)),
    })) },
  }));

  const enregistrer = async (lignes) => {
    const avant = donnees;
    appliquer(Object.fromEntries(lignes.map(({ eleve_id, ...champs }) => [eleve_id, champs])));
    try {
      await envoyerRetours(date, lignes, mode);
      setErreur("");
    } catch (e) {
      setDonnees(avant);
      setErreur(erreurApi(e, "Enregistrement impossible."));
    }
  };

  const choisir = (e, champs, fermer) => {
    enregistrer([{ eleve_id: e.id, ...champs }]);
    if (fermer) setFiche(null); else setFiche((f) => f && { ...f, ...champs });
  };
  const toutTermine = () => {
    const restants = eleves.filter((e) => !e.consommation);
    if (restants.length) enregistrer(restants.map((e) => ({ eleve_id: e.id, consommation: "termine" })));
    setConfirmer(false);
  };
  const allerA = (cle) => { setParams({ vague: cle }, { replace: true }); window.scrollTo({ top: 0 }); };
  const ouvrir = (e) => setFiche(eleves.find((x) => x.id === e.id) ?? e);

  return (
    <EspaceLayout titre="Retour assiettes" surTitre={dateLongue(date)} onglets={ONGLETS_CUISINE} large
      outils={<NotificationsCommandes />}
      action={<Reglages date={date} setDate={setDate} modes={[]} />}>
      <Alerte>{erreur}</Alerte>
      {!salle && !erreur && <div className="h-64 animate-pulse rounded-[28px] bg-[#F7F7F7]" aria-busy="true" />}
      {salle && (
        <>
          <ChoixVague vagues={salle.vagues} valeur={salle.vague} onChange={allerA} />
          {!salle.vague && <p className="mt-6 rounded-[22px] bg-[#F7F7F7] p-6 text-[14px] text-[#717171]">Aucune vague pour cette date.</p>}

          {salle.vague && (
            <>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[26px] font-semibold text-[#222222]" style={titreStyle}>{libelleVague}</h2>
                  <p className="text-[14px] text-[#717171]">Touchez une place, puis indiquez si le repas est terminé.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {faits < eleves.length && eleves.length > 0 && (
                    <button type="button" onClick={() => (confirmer ? toutTermine() : setConfirmer(true))} onBlur={() => setConfirmer(false)}
                      className={`flex h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium ${confirmer ? "border-[#222222] bg-[#222222] text-white" : "border-[#222222] text-[#222222]"}`}>
                      <CheckCheck size={16} aria-hidden="true" />
                      {confirmer ? `Confirmer : ${eleves.length - faits} terminés` : "Restants terminés"}
                    </button>
                  )}
                  {suivante && (
                    <button type="button" onClick={() => allerA(suivante.cle)}
                      className={`flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-medium text-white ${faits === eleves.length ? "bg-[#FF5A5F]" : "bg-[#222222]"}`}>
                      {suivante.nom} <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4" aria-live="polite">
                <BarreProgression valeur={faits} total={eleves.length} libelle="Retours saisis" />
              </div>

              <div className="mt-5"><ChoixCalques calques={calques} onToggle={basculer} liste={CALQUES_RETOURS} /></div>

              <div className="mt-5 rounded-[28px] border border-[#EBEBEB] bg-white px-2 py-4 sm:p-6">
                {salle.tables.length ? (
                  <Plan salle={salle} calques={calques} onSelect={ouvrir} retour />
                ) : (
                  <p className="p-6 text-[14px] text-[#717171]">Aucune table pour cette vague.</p>
                )}
                <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 px-4 text-[13px] text-[#717171]">
                  <span className="flex items-center gap-2"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#222222] text-[10px] font-bold text-white">✓</span>Terminé</span>
                  <span className="flex items-center gap-2"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5A5F] text-[10px] font-bold text-white">✕</span>Non terminé</span>
                  <span>Sans badge : à saisir</span>
                </div>
              </div>

              {sansPlace.length > 0 && (
                <section className="mt-6">
                  <p className="text-[12px] uppercase tracking-[0.28px] text-[#B0B0B0]">Élèves sans place attribuée</p>
                  <ul className="mt-2 divide-y divide-[#EBEBEB]">
                    {sansPlace.map((e) => (
                      <li key={e.id}>
                        <button type="button" onClick={() => setFiche(e)} className="flex w-full items-center gap-3 py-3 text-left">
                          <span className="min-w-0 flex-1 truncate text-[15px] text-[#222222]">{e.nom}</span>
                          {e.consommation && (
                            <span className={`text-[13px] font-medium ${e.consommation === "termine" ? "text-[#222222]" : "text-[#FF5A5F]"}`}>
                              {e.consommation === "termine" ? "✓ Terminé" : "✕ Non terminé"}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </>
      )}
      <FicheRetour e={fiche} vague={libelleVague} onChoisir={choisir} onClose={() => setFiche(null)} />
    </EspaceLayout>
  );
}
