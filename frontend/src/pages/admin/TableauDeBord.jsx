import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { erreurApi, getAujourdhui } from "../../api/pro";
import EspaceLayout from "../../components/EspaceLayout";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_ADMIN } from "./onglets";
import { AvisPlats, Etat, ResumeService } from "./stats";
import { nombre } from "./statsFormat";

const ACTUALISATION_MS = 60_000;

const dateLongue = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

// Accueil admin : la journée réelle en cours uniquement, fixée par le serveur (aucun sélecteur de date).
export default function TableauDeBord() {
  const [d, setD] = useState(null);
  const [erreur, setErreur] = useState("");
  const [maj, setMaj] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(() => {
    getAujourdhui()
      .then((x) => { setD(x); setErreur(""); setMaj(new Date()); })
      .catch((e) => setErreur(erreurApi(e, "Impossible de charger la journée.")))
      .finally(() => setEnCours(false));
  }, []);

  useEffect(() => {
    charger();
    const t = setInterval(charger, ACTUALISATION_MS);
    return () => clearInterval(t);
  }, [charger]);

  const r = d?.resume;
  const votes = r ? r.likes + r.dislikes : 0;

  return (
    <EspaceLayout
      large
      onglets={ONGLETS_ADMIN}
      surTitre={d ? dateLongue(d.date) : "Suivi de la journée"}
      titre="AUJOURD'HUI"
      action={
        <button type="button" onClick={() => { setEnCours(true); charger(); }} disabled={enCours}
          className="flex h-11 items-center gap-2 rounded-full border border-[#EBEBEB] px-4 text-[13px] text-[#717171] transition-colors hover:border-[#222222] hover:text-[#222222] disabled:opacity-60">
          <RefreshCw size={15} className={enCours ? "animate-spin" : ""} aria-hidden="true" />
          {maj ? `Mis à jour à ${maj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Actualiser"}
        </button>
      }
    >
      <Etat chargement={!d && !erreur} erreur={!d ? erreur : ""} onRetry={() => { setErreur(""); charger(); }} />
      {d && (
        <>
          {erreur && <p role="alert" className="mb-4 text-[13px] text-[#B30000]">{erreur} Données affichées : dernière mise à jour.</p>}
          {r.commandes === 0 ? (
            <section className="rounded-[22px] bg-[#FFF0ED] px-6 py-10 sm:px-10">
              <p className="text-[28px] font-semibold leading-tight text-[#222222]" style={titreStyle}>Aucune commande aujourd'hui.</p>
              <p className="mt-2 max-w-[460px] text-[14px] text-[#717171]">Les indicateurs apparaîtront dès les premières commandes et les premiers retours d'assiettes.</p>
            </section>
          ) : (
            <ResumeService resume={r} />
          )}

          <section className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF5A5F]">Avis du jour</p>
              <h2 className="mt-2 text-[28px] font-semibold leading-tight text-[#222222]" style={titreStyle}>
                Ce que les élèves ont pensé des plats
              </h2>
              {votes > 0 && (
                <p className="mt-3 text-[14px] text-[#717171]">
                  {nombre(r.likes)} j'aime et {nombre(r.dislikes)} je n'aime pas, sur {nombre(votes)} avis.
                </p>
              )}
            </div>
            <AvisPlats avis={d.avis} vide="Aucun plat servi pour l'instant." />
          </section>
        </>
      )}
    </EspaceLayout>
  );
}
