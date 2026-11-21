import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PortionPicker from "../../components/eleve/PortionPicker";
import { BackHeader, BottomCTA } from "../../components/ui";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { decouperNomPlat } from "../../utils/format";

export default function Quantite() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { etat, choisirTiers } = useReservation();

  useEffect(() => {
    if (!etat.plat) navigate("/reservation", { replace: true });
  }, [etat.plat, navigate]);

  if (!etat.plat) return null;

  return (
    <div className="min-h-screen bg-white pb-32">
      <BackHeader titre="Quelle portion ?" etape={2} />
      <main className="mx-auto max-w-[560px] px-5 pb-10 pt-2">
        <p className="mb-6 text-[15px] text-[#717171]">
          Glisse pour ajuster ton assiette de <span className="font-medium text-[#222222]">{decouperNomPlat(etat.plat.nom).nom}</span>.
        </p>
        <PortionPicker plat={etat.plat} tiers={etat.tiers} onChange={choisirTiers} />
      </main>
      <BottomCTA onClick={() => navigate("/reservation/horaire")}>{t("suivant")}</BottomCTA>
    </div>
  );
}
