import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PortionPicker from "../../components/eleve/PortionPicker";
import { BackHeader, BottomCTA } from "../../components/ui";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";

export default function Quantite() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { etat, choisirTiers } = useReservation();

  useEffect(() => {
    if (!etat.plat) navigate("/reservation", { replace: true });
  }, [etat.plat, navigate]);

  if (!etat.plat) return null;

  return (
    <div className="min-h-screen bg-white pb-28">
      <BackHeader titre="Quelle quantité ?" />
      <main className="px-5 pt-8 pb-10">
        <PortionPicker plat={etat.plat} tiers={etat.tiers} onChange={choisirTiers} />
      </main>
      <BottomCTA onClick={() => navigate("/reservation/horaire")}>{t("suivant")}</BottomCTA>
    </div>
  );
}
