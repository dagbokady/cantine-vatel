import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PortionPicker from "../../components/eleve/PortionPicker";
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
      <header className="flex items-center gap-3 px-5 pb-2 pt-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eeece7] text-[#212121]"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="text-[22px] font-bold leading-tight text-[#212121]"
          style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
        >
          {t("quantite")}
        </h1>
      </header>

      <main className="px-5 pt-2">
        <p className="text-[13px] text-[#616161]">{etat.plat.nom}</p>

        <div className="mt-6 flex justify-center">
          <PortionPicker
            plat={etat.plat}
            tiers={etat.tiers}
            onChange={choisirTiers}
          />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white via-white to-transparent px-5 pb-6 pt-6">
        <button
          type="button"
          onClick={() => navigate("/reservation/horaire")}
          className="w-full rounded-[32px] bg-[#17171c] px-6 py-3.5 text-[15px] font-semibold text-white"
        >
          {t("suivant")}
        </button>
      </div>
    </div>
  );
}
