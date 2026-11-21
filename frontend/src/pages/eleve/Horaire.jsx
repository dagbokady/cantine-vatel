import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCreneaux } from "../../api/eleve";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { formatHeure } from "../../utils/format";
import { BackHeader, BottomCTA, SelectCard } from "../../components/ui";
import { titreStyle } from "../../utils/tokens";

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
    <div className="min-h-screen bg-white pb-32">
      <BackHeader titre="À quelle heure ?" etape={3} />

      <main className="mx-auto max-w-[560px] px-5 pt-5">
        {error && (
          <p className="rounded-[14px] bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#B30000]">{error}</p>
        )}
        {creneaux === null && !error && <p className="text-[14px] text-[#B0B0B0]">Chargement…</p>}
        {creneaux && creneaux.length === 0 && (
          <p className="text-[15px] text-[#717171]">{t("aucun_creneau")}</p>
        )}

        <ul className="space-y-3">
          {creneaux?.map((c) => {
            const complet = c.places_restantes <= 0;
            const occupation = c.capacite ? Math.min(1, (c.capacite - c.places_restantes) / c.capacite) : 1;
            const presque = !complet && c.capacite && c.places_restantes / c.capacite <= 0.2;
            return (
              <li key={c.id}>
                <SelectCard actif={choix?.id === c.id} disabled={complet} onClick={() => choisirCreneau(c)} pad={18}>
                  <div className="flex items-baseline gap-2 pr-8">
                    <span
                      className={`text-[24px] font-semibold ${complet ? "text-[#B0B0B0]" : "text-[#222222]"}`}
                      style={titreStyle}
                    >
                      {formatHeure(c.heure_debut)}
                    </span>
                    <span className={`text-[14px] ${complet ? "text-[#B0B0B0]" : "text-[#717171]"}`}>
                      → {formatHeure(c.heure_fin)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F7F7F7]">
                      <div
                        className={`h-full rounded-full ${complet ? "bg-[#B0B0B0]" : "bg-[#FF5A5F]"}`}
                        style={{ width: `${Math.max(occupation * 100, 4)}%` }}
                      />
                    </div>
                    <span
                      className={`shrink-0 text-[13px] ${
                        complet ? "text-[#B0B0B0]" : presque ? "font-medium text-[#B30000]" : "text-[#717171]"
                      }`}
                    >
                      {complet
                        ? "Complet"
                        : `${c.places_restantes} place${c.places_restantes > 1 ? "s" : ""} libre${c.places_restantes > 1 ? "s" : ""}`}
                    </span>
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
