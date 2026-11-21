import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCreneaux } from "../../api/eleve";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { formatHeure } from "../../utils/format";
import { BackHeader, BottomCTA, SelectCard } from "../../components/ui";

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

  return (
    <div className="min-h-screen bg-white pb-28">
      <BackHeader titre="À quelle heure ?" />

      <main className="px-5 pt-6">
        {error && (
          <p className="bg-[#fff1f1] px-4 py-3 text-[14px] text-[#b30000]">{error}</p>
        )}
        {creneaux === null && !error && (
          <p className="text-[14px] text-[#93939f]">Chargement…</p>
        )}
        {creneaux && creneaux.length === 0 && (
          <p className="text-[15px] text-[#616161]">{t("aucun_creneau")}</p>
        )}

        <ul className="space-y-3">
          {creneaux?.map((c) => {
            const complet = c.places_restantes <= 0;
            const occupation = c.capacite
              ? Math.min(1, (c.capacite - c.places_restantes) / c.capacite)
              : 1;
            return (
              <li key={c.id}>
                <SelectCard
                  actif={choix?.id === c.id}
                  disabled={complet}
                  onClick={() => choisirCreneau(c)}
                >
                  <p
                    className={`text-[18px] font-medium ${complet ? "text-[#93939f]" : "text-[#212121]"}`}
                  >
                    {formatHeure(c.heure_debut)} – {formatHeure(c.heure_fin)}
                  </p>
                  <p className={`mt-0.5 text-[14px] ${complet ? "text-[#93939f]" : "text-[#616161]"}`}>
                    {complet
                      ? "Complet"
                      : `${c.places_restantes} place${c.places_restantes > 1 ? "s" : ""} restante${c.places_restantes > 1 ? "s" : ""}`}
                  </p>
                  <div className="mt-3 h-1 overflow-hidden rounded-[2px] bg-[#eeece7]">
                    <div
                      className={`h-full rounded-[2px] ${complet ? "bg-[#93939f]" : "bg-[#003c33]"}`}
                      style={{ width: `${occupation * 100}%` }}
                    />
                  </div>
                </SelectCard>
              </li>
            );
          })}
        </ul>
      </main>

      <BottomCTA disabled={!choix} onClick={() => navigate("/reservation/place")}>
        {t("suivant")}
      </BottomCTA>
    </div>
  );
}
