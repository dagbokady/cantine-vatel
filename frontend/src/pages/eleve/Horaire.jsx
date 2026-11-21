import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { getCreneaux } from "../../api/eleve";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { formatHeure } from "../../utils/format";

export default function Horaire() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { etat, choisirCreneau } = useReservation();
  const [creneaux, setCreneaux] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!etat.plat) {
      navigate("/reservation", { replace: true });
      return;
    }
    let alive = true;
    getCreneaux()
      .then((d) => alive && setCreneaux(d.creneaux))
      .catch((e) =>
        alive && setError(e.response?.data?.detail || "Impossible de charger."),
      );
    return () => {
      alive = false;
    };
  }, [etat.plat, navigate]);

  if (!etat.plat) return null;
  const choix = etat.creneau;
  const peutSuivre = choix !== null;

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
          {t("horaire")}
        </h1>
      </header>

      <main className="px-5 pt-2">
        <p className="text-[13px] text-[#616161]">{t("choisir_creneau")}</p>

        {error && (
          <p className="mt-4 rounded-xl bg-[#fff5f3] px-4 py-3 text-[13px] text-[#b30000]">
            {error}
          </p>
        )}

        {creneaux === null && !error && (
          <p className="mt-6 text-[13px] text-[#93939f]">Chargement…</p>
        )}

        {creneaux && creneaux.length === 0 && (
          <p className="mt-6 rounded-xl bg-[#eeece7] px-4 py-3 text-[13px] text-[#616161]">
            {t("aucun_creneau")}
          </p>
        )}

        <ul className="mt-5 space-y-2.5">
          {creneaux?.map((c) => {
            const complet = c.places_restantes <= 0;
            const actif = choix?.id === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={complet}
                  onClick={() => choisirCreneau(c)}
                  className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-4 text-left transition disabled:opacity-40 ${
                    actif
                      ? "border-[#003c33] bg-[#eeece7]"
                      : "border-[#f2f2f2] bg-white"
                  }`}
                >
                  <div>
                    <p
                      className="text-[18px] font-bold text-[#212121]"
                      style={{
                        fontFamily: "Space Grotesk, sans-serif",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatHeure(c.heure_debut)}
                      <span className="text-[14px] font-medium text-[#93939f]">
                        {" "}
                        – {formatHeure(c.heure_fin)}
                      </span>
                    </p>
                    <p
                      className={`mt-1 text-[12.5px] ${
                        complet ? "text-[#b30000]" : "text-[#616161]"
                      }`}
                    >
                      {complet
                        ? t("complet")
                        : `${c.places_restantes} ${t("places_restantes")}`}
                    </p>
                  </div>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      actif
                        ? "border-[#003c33] bg-[#003c33] text-white"
                        : "border-[#d9d9dd]"
                    }`}
                  >
                    {actif && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white via-white to-transparent px-5 pb-6 pt-6">
        <button
          type="button"
          disabled={!peutSuivre}
          onClick={() => navigate("/reservation/place")}
          className="w-full rounded-[32px] bg-[#17171c] px-6 py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {t("suivant")}
        </button>
      </div>
    </div>
  );
}
