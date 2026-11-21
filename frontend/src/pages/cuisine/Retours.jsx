import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Check, CheckCheck, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { envoyerRetours, erreurApi, getService, getVague } from "../../api/pro";
import EspaceLayout, { Alerte } from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";
import { tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { BarreProgression, ChoixVague, FicheEleve, Reglages } from "./commun";
import { dateLongue, useReglages } from "./reglages";
import { ONGLETS_CUISINE } from "./onglets";

const ETAPES = {
  avis: { champ: "avis", label: "Avis", oui: 1, non: -1, Oui: ThumbsUp, Non: ThumbsDown, txtOui: "Aimé", txtNon: "Pas aimé", ariaOui: "Repas apprécié", ariaNon: "Repas pas apprécié" },
  assiettes: { champ: "consommation", label: "Assiettes", oui: "termine", non: "non_termine", Oui: Check, Non: X, txtOui: "Terminé", txtNon: "Pas fini", ariaOui: "Assiette terminée", ariaNon: "Assiette pas terminée" },
};

function Choix({ actif, ton, onClick, Icone, texte, aria, grand }) {
  const styles = actif
    ? ton === "oui" ? "border-[#FF5A5F] bg-[#FF5A5F] text-white" : "border-[#222222] bg-[#222222] text-white"
    : "border-[#EBEBEB] bg-white text-[#222222] hover:border-[#222222]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      aria-label={aria}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[16px] border-2 transition-colors active:scale-[0.97] ${grand ? "h-[68px]" : "h-12 flex-row gap-1.5"} ${styles}`}
    >
      <Icone size={grand ? 26 : 18} strokeWidth={2.2} aria-hidden="true" />
      <span className={grand ? "text-[11px] font-medium" : "text-[13px] font-medium"}>{texte}</span>
    </button>
  );
}

function Marqueurs({ e }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 text-[12px]">
      {e.allergies.length > 0 && <span className="font-semibold text-[#B30000]">⚠ {e.allergies.join(", ")}</span>}
      {e.menu_type === "sans_allergene" && <span className="text-[#FF5A5F]">Spécial</span>}
      <span className="text-[#717171]">{tiersEnFraction(e.tiers)}</span>
    </span>
  );
}

export default function Retours() {
  const { date, setDate, mode } = useReglages();
  const [params, setParams] = useSearchParams();
  const [service, setService] = useState(null);
  const [vague, setVague] = useState(null);
  const [etape, setEtape] = useState(null);
  const [erreur, setErreur] = useState("");
  const [fiche, setFiche] = useState(null);

  const chargerService = useCallback(() => getService(date, mode).then(setService).catch((e) => setErreur(erreurApi(e))), [date, mode]);
  useEffect(() => { chargerService(); }, [chargerService]);

  const cle = params.get("vague")
    || service?.vagues.find((v) => v.evalues < v.eleves)?.cle
    || service?.vagues[0]?.cle;

  useEffect(() => {
    if (!cle) return;
    let actif = true;
    getVague(cle, date, mode)
      .then((v) => { if (!actif) return; setVague(v); setEtape((e) => e ?? (v.primaire ? "avis" : "assiettes")); })
      .catch((e) => actif && setErreur(erreurApi(e)));
    return () => { actif = false; };
  }, [cle, date, mode]);

  const E = ETAPES[etape || "assiettes"];

  const enregistrer = async (lignes) => {
    const avant = vague;
    setVague((v) => ({
      ...v,
      eleves: v.eleves.map((e) => {
        const l = lignes.find((x) => x.eleve_id === e.id);
        return l ? { ...e, ...("avis" in l ? { avis: l.avis } : {}), ...("consommation" in l ? { consommation: l.consommation } : {}) } : e;
      }),
    }));
    try {
      await envoyerRetours(date, lignes, mode);
      setErreur("");
    } catch (e) {
      setVague(avant);
      setErreur(erreurApi(e, "Enregistrement impossible."));
    }
  };

  const choisir = (e, valeur) => enregistrer([{ eleve_id: e.id, [E.champ]: e[E.champ] === valeur ? null : valeur }]);
  const toutTermine = () => {
    const restants = vague.eleves.filter((e) => !e.consommation);
    if (restants.length) enregistrer(restants.map((e) => ({ eleve_id: e.id, consommation: "termine" })));
  };

  const faits = vague?.eleves.filter((e) => e[E.champ] != null).length ?? 0;
  const total = vague?.eleves.length ?? 0;
  const fini = total > 0 && faits === total;
  const suivante = service?.vagues.find((v) => v.cle === vague?.suivante);
  const allerA = (c) => { setParams({ vague: c }, { replace: true }); chargerService(); window.scrollTo({ top: 0 }); };

  return (
    <EspaceLayout
      titre="Retour assiettes"
      surTitre={dateLongue(date)}
      onglets={ONGLETS_CUISINE}
      large
      action={<Reglages date={date} setDate={setDate} modes={[]} />}
    >
      <Alerte>{erreur}</Alerte>
      {service && (
        <ChoixVague
          vagues={service.vagues}
          valeur={cle}
          onChange={allerA}
          compteur={(v) => (v.eleves && v.evalues >= v.eleves ? "✓" : `${v.evalues}/${v.eleves}`)}
        />
      )}

      {vague && (
        <>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[26px] font-semibold text-[#222222]" style={titreStyle}>{vague.sous_titre === "Classe" ? vague.nom : `Vague de ${vague.nom}`}</h2>
              <p className="text-[14px] text-[#717171]">
                {etape === "avis" ? "Le repas a-t-il plu ? Un geste par élève." : "L'assiette est-elle terminée ? Rien n'est déduit de la commande."}
              </p>
            </div>
            <div role="radiogroup" aria-label="Étape" className="grid grid-cols-2 gap-1 rounded-full bg-[#F7F7F7] p-1">
              {Object.entries(ETAPES).map(([id, x]) => (
                <button key={id} type="button" role="radio" aria-checked={etape === id} onClick={() => setEtape(id)}
                  className={`flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-[14px] font-medium ${etape === id ? "bg-white text-[#222222] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-[#717171]"}`}>
                  <x.Oui size={15} /> {x.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4"><BarreProgression valeur={faits} total={total} libelle="Élèves saisis" /></div>

          {total === 0 && <p className="mt-8 text-[14px] text-[#717171]">Aucun élève dans cette vague.</p>}

          {vague.primaire ? (
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {vague.eleves.map((e) => (
                <li key={e.id} className={`rounded-[22px] border p-3 transition-colors ${e[E.champ] != null ? "border-[#EBEBEB] bg-[#F7F7F7]" : "border-[#EBEBEB] bg-white"}`}>
                  <button type="button" onClick={() => setFiche(e)} className="flex w-full flex-col items-center gap-1.5 pb-3 pt-1 text-center">
                    <Avatar nom={e.nom} photo={e.photo} taille={52} />
                    <span className="w-full truncate text-[15px] font-semibold text-[#222222]">{e.nom.split(" ")[0]}</span>
                    <span className="-mt-1 w-full truncate text-[12px] text-[#717171]">{e.nom.split(" ").slice(1).join(" ")}</span>
                    <Marqueurs e={e} />
                  </button>
                  <div className="flex gap-2">
                    <Choix grand actif={e[E.champ] === E.oui} ton="oui" onClick={() => choisir(e, E.oui)} Icone={E.Oui} texte={E.txtOui} aria={`${e.nom} : ${E.ariaOui}`} />
                    <Choix grand actif={e[E.champ] === E.non} ton="non" onClick={() => choisir(e, E.non)} Icone={E.Non} texte={E.txtNon} aria={`${e.nom} : ${E.ariaNon}`} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-6 divide-y divide-[#EBEBEB] rounded-[22px] border border-[#EBEBEB]">
              {vague.eleves.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <button type="button" onClick={() => setFiche(e)} className="flex min-w-[180px] flex-1 items-center gap-3 text-left">
                    <Avatar nom={e.nom} photo={e.photo} taille={40} />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-[#222222]">{e.nom}</span>
                      <Marqueurs e={e} />
                    </span>
                  </button>
                  <div className="flex w-full gap-2 sm:w-[300px]">
                    <Choix actif={e[E.champ] === E.oui} ton="oui" onClick={() => choisir(e, E.oui)} Icone={E.Oui} texte={E.txtOui} aria={`${e.nom} : ${E.ariaOui}`} />
                    <Choix actif={e[E.champ] === E.non} ton="non" onClick={() => choisir(e, E.non)} Icone={E.Non} texte={E.txtNon} aria={`${e.nom} : ${E.ariaNon}`} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="h-28" />
          <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EBEBEB] bg-white/95 px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <div className="mx-auto flex max-w-[1100px] items-center gap-3">
              <p className="min-w-0 flex-1 text-[14px] text-[#222222]" aria-live="polite">
                {fini ? <span className="font-medium">{vague.sous_titre === "Classe" ? "Classe" : "Vague"} terminée</span> : <><span className="font-semibold tabular-nums">{total - faits}</span> à saisir</>}
              </p>
              {etape === "assiettes" && !fini && total > 0 && (
                <button type="button" onClick={toutTermine}
                  className="flex h-12 shrink-0 items-center gap-2 rounded-full border border-[#222222] px-4 text-[14px] font-medium text-[#222222]">
                  <CheckCheck size={17} /> Tout fini
                </button>
              )}
              {suivante && (
                <button type="button" onClick={() => allerA(suivante.cle)}
                  className={`flex h-12 shrink-0 items-center gap-2 rounded-full px-5 text-[14px] font-medium ${fini ? "bg-[#FF5A5F] text-white" : "bg-[#222222] text-white"}`}>
                  {suivante.nom} <ArrowRight size={17} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
      <FicheEleve eleve={fiche} vague={vague?.nom} onClose={() => setFiche(null)} />
    </EspaceLayout>
  );
}
