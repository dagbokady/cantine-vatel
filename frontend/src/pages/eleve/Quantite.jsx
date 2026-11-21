
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, UtensilsCrossed } from "lucide-react";
import { postReservation } from "../../api/eleve";
import PortionPicker from "../../components/eleve/PortionPicker";
import { BackHeader, BottomCTA } from "../../components/ui";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import {
  decouperNomPlat,
  fcfa,
  formatHeure,
  prixTotal,
  supplementsChoisis,
} from "../../utils/format";
import { libelleJour } from "../../utils/jour";
import { titreStyle } from "../../utils/tokens";

export default function Quantite() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { etat, choisirTiers, confirmer } = useReservation();

  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!etat.plat) {
      navigate("/reservation", { replace: true });
    }
  }, [etat.plat, navigate]);

  if (!etat.plat) return null;

  // Avant la récréation (ou la veille), la commande part sans vague.
  // La vague et la place seront choisies le jour même.
  const sansVague = !etat.plat.vague_ouverte;

  const nomPlat = decouperNomPlat(etat.plat.nom).nom;
  const supplements = supplementsChoisis(etat.plat, etat.elements);
  const prix = prixTotal(etat.plat, etat.tiers, etat.elements);

  const commander = async () => {
    if (envoi) return;

    setEnvoi(true);
    setErreur("");

    try {
      const reservation = await postReservation({
        menu_jour_id: etat.plat.menu_jour_id,
        tiers: etat.tiers,
        elements: etat.elements,
      });

      confirmer(reservation);
      navigate("/", { replace: true });
    } catch (e) {
      setErreur(
          e.response?.data?.detail || "Commande impossible. Réessaie."
      );
      setEnvoi(false);
    }
  };

  return (
      <div className="min-h-dvh bg-white pb-[calc(var(--cta-h,150px)+24px)]">
        <BackHeader titre="Ta portion" etape={3} />

        <main className="mx-auto max-w-[720px] px-5 pb-8 pt-5 sm:px-7">
          {/* Introduction */}
          <div className="mb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#717171]">
              ÉTAPE 03 · TA PORTION
            </p>

            <h1
                className="mt-2 text-[28px] font-semibold leading-tight text-[#222222] sm:text-[34px]"
                style={titreStyle}
            >
              Quelle quantité souhaites-tu ?
            </h1>

            <p className="mt-2 text-[14px] leading-relaxed text-[#717171]">
              Ajuste la quantité selon ton appétit. Tu peux choisir un tiers,
              deux tiers ou une assiette complète.
            </p>
          </div>

          {/* Plat sélectionné */}
          <div className="mb-6 flex items-center gap-3 rounded-[20px] border border-[#EBEBEB] p-3">
            {etat.plat.photo ? (
                <img
                    src={etat.plat.photo}
                    alt=""
                    className="h-[68px] w-[68px] shrink-0 rounded-[14px] object-cover"
                />
            ) : (
                <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[14px] bg-[#FFF0ED] text-[#FF5A5F]">
                  <UtensilsCrossed size={24} strokeWidth={1.5} />
                </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#717171]">
                Ton repas
              </p>

              <p
                  className="mt-1 truncate text-[16px] font-semibold text-[#222222]"
                  style={titreStyle}
              >
                {nomPlat}
              </p>

              <p className="mt-1 text-[13px] text-[#717171]">
                Assiette complète : {fcfa(etat.plat.prix)}
                {supplements > 0 && ` · suppléments +${fcfa(supplements)}`}
              </p>
            </div>
          </div>

          {/* Sélecteur de portion */}
          <section className="rounded-[24px] bg-[#F7F7F7] px-3 py-5 sm:px-6 sm:py-7">
            <div className="mb-3 text-center">
              <h2
                  className="text-[18px] font-semibold text-[#222222]"
                  style={titreStyle}
              >
                Ton assiette
              </h2>

              <p className="mt-1 text-[13px] text-[#717171]">
                Fais glisser pour choisir ta portion
              </p>
            </div>

            <PortionPicker
                plat={etat.plat}
                tiers={etat.tiers}
                supplements={supplements}
                onChange={choisirTiers}
            />
          </section>

          {/* Récapitulatif du prix */}
          <div className="mt-5 flex items-center justify-between gap-4 border-b border-[#EBEBEB] pb-5">
            <div>
              <p className="text-[12px] text-[#717171]">
                {supplements > 0 ? "Portion et suppléments" : "Prix de ta portion"}
              </p>

              <p
                  className="mt-1 text-[25px] font-semibold text-[#222222]"
                  style={titreStyle}
              >
                {fcfa(prix)}
              </p>
            </div>

            <div className="rounded-full bg-[#FFF0ED] px-3 py-2 text-[12px] font-medium text-[#B34A4E]">
              {etat.tiers}/3 de l'assiette
            </div>
          </div>

          {/* Information sur le choix de la vague */}
          {sansVague && (
              <div className="mt-5 flex gap-3 rounded-[18px] bg-[#FFF0ED] p-4">
                <Clock3
                    size={20}
                    className="mt-0.5 shrink-0 text-[#FF5A5F]"
                />

                <div>
                  <p className="text-[14px] font-semibold text-[#222222]">
                    Le choix de ta vague viendra plus tard
                  </p>

                  <p className="mt-1 text-[13px] leading-relaxed text-[#717171]">
                    Ton repas est prévu pour le{" "}
                    <span className="font-medium text-[#222222]">
                  {libelleJour(etat.plat.date)}
                </span>
                    . Tu choisiras ta vague et ta place le jour même, à partir
                    de la récréation
                    {etat.plat.heure_recreation
                        ? ` (${formatHeure(etat.plat.heure_recreation)})`
                        : ""}
                    .
                  </p>
                </div>
              </div>
          )}

          {/* Erreur */}
          {erreur && (
              <p
                  role="alert"
                  className="mt-5 rounded-[14px] bg-[#FFF1F1] px-4 py-3 text-[14px] leading-relaxed text-[#B30000]"
              >
                {erreur}
              </p>
          )}
        </main>

        {/* Action principale */}
        {sansVague ? (
            <BottomCTA
                disabled={envoi}
                onClick={commander}
                aside={
                  <div>
                    <p className="text-[11px] text-[#717171]">À payer</p>
                    <p className="text-[16px] font-semibold text-[#222222]">
                      {fcfa(prix)}
                    </p>
                  </div>
                }
            >
              {envoi ? "Commande en cours…" : "Confirmer ma commande"}
            </BottomCTA>
        ) : (
            <BottomCTA
                onClick={() => navigate("/reservation/horaire")}
                aside={
                  <div>
                    <p className="text-[11px] text-[#717171]">Total</p>
                    <p className="text-[16px] font-semibold text-[#222222]">
                      {fcfa(prix)}
                    </p>
                  </div>
                }
            >
          <span className="flex items-center justify-center gap-2">
            {t("suivant")}
            <ArrowRight size={17} />
          </span>
            </BottomCTA>
        )}
      </div>
  );
}
