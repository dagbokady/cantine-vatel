import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postReservation } from "../../api/eleve";
import PortionPicker from "../../components/eleve/PortionPicker";
import { BackHeader, BottomCTA } from "../../components/ui";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { decouperNomPlat, fcfa, formatHeure, prixPortion } from "../../utils/format";
import { libelleJour } from "../../utils/jour";

export default function Quantite() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { etat, choisirTiers, confirmer } = useReservation();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!etat.plat) navigate("/reservation", { replace: true });
  }, [etat.plat, navigate]);

  if (!etat.plat) return null;
  // Avant la récréation (ou la veille), la commande part sans vague : elle se choisira le jour même.
  const sansVague = !etat.plat.vague_ouverte;

  const commander = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      confirmer(await postReservation({ menu_jour_id: etat.plat.menu_jour_id, tiers: etat.tiers }));
      navigate("/", { replace: true });
    } catch (e) {
      setErreur(e.response?.data?.detail || "Commande impossible. Réessaie.");
      setEnvoi(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <BackHeader titre="Quelle portion ?" etape={2} />
      <main className="mx-auto max-w-[560px] px-5 pb-10 pt-2">
        <p className="mb-6 text-[15px] text-[#717171]">
          Glisse pour ajuster ton assiette de <span className="font-medium text-[#222222]">{decouperNomPlat(etat.plat.nom).nom}</span>.
        </p>
        <PortionPicker plat={etat.plat} tiers={etat.tiers} onChange={choisirTiers} />
        {sansVague && (
          <p className="mt-8 rounded-[16px] bg-[#FFF0ED] px-4 py-3 text-[14px] leading-relaxed text-[#222222]">
            Repas de <span className="font-medium">{libelleJour(etat.plat.date)}</span>. Tu choisiras ta vague et ta place le jour même,
            à partir de la récréation{etat.plat.heure_recreation ? ` (${formatHeure(etat.plat.heure_recreation)})` : ""}.
          </p>
        )}
        {erreur && <p role="alert" className="mt-4 rounded-[14px] bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#B30000]">{erreur}</p>}
      </main>
      {sansVague ? (
        <BottomCTA disabled={envoi} onClick={commander}
          aside={<p className="text-[15px] font-semibold text-[#222222]">{fcfa(prixPortion(etat.plat.prix, etat.tiers))}</p>}>
          {envoi ? "Commande…" : "Commander"}
        </BottomCTA>
      ) : (
        <BottomCTA onClick={() => navigate("/reservation/horaire")}>{t("suivant")}</BottomCTA>
      )}
    </div>
  );
}
