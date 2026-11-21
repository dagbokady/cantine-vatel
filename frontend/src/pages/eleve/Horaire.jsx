
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, Users, AlertCircle } from "lucide-react";
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
        .then((d) => {
          if (alive) setCreneaux(d.creneaux);
        })
        .catch((e) => {
          if (alive) {
            setError(
                e.response?.data?.detail || "Impossible de charger les créneaux."
            );
          }
        });

    return () => {
      alive = false;
    };
  }, [etat.plat, navigate]);

  if (!etat.plat) return null;

  const choix = etat.creneau;

  return (
      <div className="min-h-screen bg-white pb-36">
        <BackHeader
            titre={etat.reservationId ? "Choisis ta vague" : "Ton heure de passage"}
            etape={3}
        />

        <main className="mx-auto max-w-[720px] px-5 pt-6 sm:px-7">
          {/* Introduction */}
          <div className="mb-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#717171]">
              ÉTAPE 03 · ORGANISATION
            </p>

            <h1
                className="mt-2 text-[28px] font-semibold leading-tight text-[#222222] sm:text-[34px]"
                style={titreStyle}
            >
              À quelle heure veux-tu manger ?
            </h1>

            <p className="mt-2 text-[14px] leading-relaxed text-[#717171]">
              Choisis une vague de passage à la cantine. Pense à sélectionner
              un horaire qui te convient.
            </p>
          </div>

          {/* Erreur */}
          {error && (
              <div
                  role="alert"
                  className="mb-5 flex gap-3 rounded-[16px] bg-[#FFF1F1] p-4 text-[14px] text-[#B30000]"
              >
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
          )}

          {/* Chargement */}
          {creneaux === null && !error && (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                    <div
                        key={n}
                        className="h-[116px] animate-pulse rounded-[20px] bg-[#F7F7F7]"
                    />
                ))}
              </div>
          )}

          {/* Aucun créneau */}
          {creneaux && creneaux.length === 0 && (
              <div className="rounded-[20px] border border-[#EBEBEB] px-5 py-9 text-center">
                <Clock3
                    size={32}
                    strokeWidth={1.5}
                    className="mx-auto text-[#B0B0B0]"
                />

                <p className="mt-3 font-semibold text-[#222222]">
                  Aucun horaire disponible
                </p>

                <p className="mt-1 text-[14px] text-[#717171]">
                  {t("aucun_creneau")}
                </p>
              </div>
          )}

          {/* Liste des créneaux */}
          {creneaux && creneaux.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2
                      className="text-[17px] font-semibold text-[#222222]"
                      style={titreStyle}
                  >
                    Les vagues disponibles
                  </h2>

                  <span className="text-[12px] text-[#717171]">
                {creneaux.length} créneau{creneaux.length > 1 ? "x" : ""}
              </span>
                </div>

                <ul className="space-y-3">
                  {creneaux.map((c, index) => {
                    const complet = c.places_restantes <= 0;

                    const occupation = c.capacite
                        ? Math.min(
                            1,
                            Math.max(
                                0,
                                (c.capacite - c.places_restantes) / c.capacite
                            )
                        )
                        : 1;

                    const presque =
                        !complet &&
                        c.capacite &&
                        c.places_restantes / c.capacite <= 0.2;

                    return (
                        <li key={c.id}>
                          <SelectCard
                              actif={choix?.id === c.id}
                              disabled={complet}
                              onClick={() => choisirCreneau(c)}
                              pad={17}
                          >
                            <div className="pr-7">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div
                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                          complet
                                              ? "bg-[#F7F7F7] text-[#B0B0B0]"
                                              : "bg-[#FFF0ED] text-[#FF5A5F]"
                                      }`}
                                  >
                                    <Clock3 size={19} strokeWidth={1.7} />
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#717171]">
                                      Vague {index + 1}
                                    </p>

                                    <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                                <span
                                    className={`text-[23px] font-semibold ${
                                        complet
                                            ? "text-[#B0B0B0]"
                                            : "text-[#222222]"
                                    }`}
                                    style={titreStyle}
                                >
                                  {formatHeure(c.heure_debut)}
                                </span>

                                      <span
                                          className={`text-[13px] ${
                                              complet
                                                  ? "text-[#B0B0B0]"
                                                  : "text-[#717171]"
                                          }`}
                                      >
                                  jusqu'à {formatHeure(c.heure_fin)}
                                </span>
                                    </div>
                                  </div>
                                </div>

                                {choix?.id === c.id && !complet && (
                                    <span className="rounded-full bg-[#FFF0ED] px-2.5 py-1 text-[11px] font-medium text-[#B34A4E]">
                              Sélectionnée
                            </span>
                                )}
                              </div>

                              {/* Disponibilité */}
                              <div className="mt-5">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-1.5 text-[#717171]">
                                    <Users size={14} />
                                    <span className="text-[12px]">
                                Disponibilité
                              </span>
                                  </div>

                                  <span
                                      className={`text-[12px] font-medium ${
                                          complet
                                              ? "text-[#B0B0B0]"
                                              : presque
                                                  ? "text-[#B30000]"
                                                  : "text-[#717171]"
                                      }`}
                                  >
                              {complet
                                  ? "Complet"
                                  : `${c.places_restantes} place${
                                      c.places_restantes > 1 ? "s" : ""
                                  } disponible${
                                      c.places_restantes > 1 ? "s" : ""
                                  }`}
                            </span>
                                </div>

                                <div className="h-1.5 overflow-hidden rounded-full bg-[#F7F7F7]">
                                  <div
                                      className={`h-full rounded-full transition-all duration-300 ${
                                          complet ? "bg-[#B0B0B0]" : "bg-[#FF5A5F]"
                                      }`}
                                      style={{
                                        width: `${Math.max(occupation * 100, 4)}%`,
                                      }}
                                  />
                                </div>
                              </div>
                            </div>
                          </SelectCard>
                        </li>
                    );
                  })}
                </ul>
              </section>
          )}
        </main>

        <BottomCTA
            disabled={!choix}
            onClick={() => navigate("/reservation/place")}
            aside={
              choix ? (
                  <div>
                    <p className="text-[11px] text-[#717171]">Ta vague</p>
                    <p className="text-[15px] font-semibold text-[#222222]">
                      {formatHeure(choix.heure_debut)}
                    </p>
                  </div>
              ) : (
                  <p className="text-[13px] text-[#717171]">
                    Choisis un horaire
                  </p>
              )
            }
        >
          {t("suivant")}
        </BottomCTA>
      </div>
  );
}
