
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shuffle,
  Users,
  Armchair,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import {
  choisirVague,
  getSalle,
  postReservation,
} from "../../api/eleve";

import PlanSalle, { ChaiseIcone } from "../../components/eleve/PlanSalle";
import { BackHeader, BottomCTA } from "../../components/ui";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { decouperNomPlat, formatHeure } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";

const MSG_PLACE_PRISE =
    "Cette place vient d'être prise. Choisis-en une autre.";

export default function Place() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const { etat, choisirPlace, confirmer } = useReservation();

  const [salle, setSalle] = useState(null);
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const fetchSalle = useCallback(async (creneauId) => {
    setErreur("");

    try {
      const data = await getSalle(creneauId);
      setSalle(data);
    } catch (e) {
      setErreur(
          e.response?.data?.detail ||
          "Impossible de charger le plan de salle."
      );
    }
  }, []);

  useEffect(() => {
    if (!etat.plat || !etat.creneau) {
      navigate("/reservation", { replace: true });
      return;
    }

    fetchSalle(etat.creneau.id);
  }, [etat.plat, etat.creneau, navigate, fetchSalle]);

  useEffect(() => {
    if (!toast) return;

    const id = setTimeout(() => setToast(""), 4000);

    return () => clearTimeout(id);
  }, [toast]);

  if (!etat.plat || !etat.creneau) return null;

  const places = salle
      ? salle.tables.flatMap((tb) =>
          tb.places.map((p) => ({ ...p, table: tb.nom }))
      )
      : [];

  const libres = places.filter((p) => p.etat !== "prise").length;

  const placeSel = places.find((p) => p.id === etat.place?.id);

  const basculer = (p) => {
    choisirPlace(p.id === etat.place?.id ? null : p);
  };

  const valider = async () => {
    if (!etat.place || envoi) return;

    setErreur("");
    setEnvoi(true);

    try {
      const res = etat.reservationId
          ? await choisirVague(etat.reservationId, {
            creneau_id: etat.creneau.id,
            place_id: etat.place.id,
          })
          : await postReservation({
            menu_jour_id: etat.plat.menu_jour_id,
            creneau_id: etat.creneau.id,
            place_id: etat.place.id,
            tiers: etat.tiers,
            elements: etat.elements,
          });

      confirmer(res);
      navigate("/", { replace: true });
    } catch (e) {
      if (e.response?.status === 409) {
        const detail = e.response.data?.detail || "";

        setToast(
            /place/i.test(detail)
                ? MSG_PLACE_PRISE
                : detail || MSG_PLACE_PRISE
        );

        choisirPlace(null);
        fetchSalle(etat.creneau.id);
      } else {
        setErreur(
            e.response?.data?.detail || "Impossible de réserver."
        );
      }
    } finally {
      setEnvoi(false);
    }
  };

  // Placement automatique : première chaise libre de la table
  // qui possède le plus grand nombre de places disponibles.
  const auHasard = () => {
    const meilleure = [...(salle?.tables || [])].sort(
        (a, b) =>
            b.places.filter((p) => p.etat !== "prise").length -
            a.places.filter((p) => p.etat !== "prise").length
    )[0];

    const p = meilleure?.places.find((x) => x.etat !== "prise");

    if (p) {
      choisirPlace({ ...p, table: meilleure.nom });
    }
  };

  const aDesTables = salle && salle.tables.length > 0;

  return (
      <div className="min-h-dvh bg-white pb-[calc(var(--cta-h,150px)+24px)]">
        {/* Notification de conflit */}
        {toast && (
            <div
                role="alert"
                className="fixed inset-x-4 top-[calc(12px+env(safe-area-inset-top))] z-30 mx-auto max-w-[528px] rounded-[16px] bg-[#222222] px-4 py-3 text-[14px] leading-relaxed text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            >
              {toast}
            </div>
        )}

        <BackHeader
            titre="Choisis ta place"
            etape={5}
            surtitre="Dernière étape"
        />

        <main className="mx-auto max-w-[760px] px-5 pt-4 sm:px-7">
          {/* Récapitulatif du repas */}
          <div className="flex items-center gap-3 rounded-[18px] border border-[#EBEBEB] p-3">
            {etat.plat.photo ? (
                <img
                    src={etat.plat.photo}
                    alt=""
                    className="h-[58px] w-[58px] shrink-0 rounded-[14px] object-cover"
                />
            ) : (
                <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[14px] bg-[#FFF0ED] text-[#FF5A5F]">
                  <Armchair size={22} strokeWidth={1.5} />
                </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#717171]">
                Ton repas
              </p>

              <p
                  className="mt-1 truncate text-[15px] font-semibold text-[#222222]"
                  style={titreStyle}
              >
                {decouperNomPlat(etat.plat.nom).nom}
              </p>

              <p className="mt-1 text-[12px] text-[#717171]">
                Passage à {formatHeure(etat.creneau.heure_debut)}
              </p>
            </div>
          </div>

          {/* Introduction */}
          <div className="mb-5 mt-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#717171]">
              TA PLACE À TABLE
            </p>

            <h1
                className="mt-2 text-[27px] font-semibold leading-tight text-[#222222] sm:text-[32px]"
                style={titreStyle}
            >
              Où souhaites-tu t'installer ?
            </h1>

            <p className="mt-2 text-[14px] leading-relaxed text-[#717171]">
              Choisis une chaise libre sur le plan de la salle.
            </p>
          </div>

          {/* Informations sur les places */}
          {aDesTables && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] text-[#717171]">
                      Places encore disponibles
                    </p>

                    <div className="mt-1 flex items-baseline gap-2">
                  <span
                      className="text-[30px] font-semibold text-[#222222]"
                      style={titreStyle}
                  >
                    {libres}
                  </span>

                      <span className="text-[13px] text-[#717171]">
                    sur {places.length}
                  </span>
                    </div>
                  </div>

                  <button
                      type="button"
                      onClick={auHasard}
                      disabled={!libres}
                      className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#EBEBEB] px-4 text-[13px] font-medium text-[#222222] transition-colors hover:border-[#222222] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Shuffle size={15} />
                    Me placer
                  </button>
                </div>

                {/* Légende */}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-[#EBEBEB] py-3">
                  <Legende etat="libre" label="Libre" />
                  <Legende etat="prise" label="Occupée" />
                  <Legende etat="sel" label="Ma place" />
                </div>
              </>
          )}

          {/* Plan de salle */}
          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2
                  className="text-[17px] font-semibold text-[#222222]"
                  style={titreStyle}
              >
                Plan de la salle
              </h2>

              {aDesTables && (
                  <span className="text-[11px] text-[#717171]">
                Vue de dessus
              </span>
              )}
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#EBEBEB] bg-[#F7F7F7] px-1.5 py-3 sm:px-3">
              {salle === null && !erreur && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw
                        size={23}
                        className="animate-spin text-[#B0B0B0]"
                    />

                    <p className="mt-3 text-[13px] text-[#717171]">
                      Chargement du plan…
                    </p>
                  </div>
              )}

              {salle && salle.tables.length === 0 && (
                  <div className="px-4 py-16 text-center">
                    <Users
                        size={30}
                        strokeWidth={1.5}
                        className="mx-auto text-[#B0B0B0]"
                    />

                    <p className="mt-3 text-[15px] font-medium text-[#222222]">
                      Aucune table disponible
                    </p>

                    <p className="mt-1 text-[13px] text-[#717171]">
                      Le plan de salle n'est pas encore configuré.
                    </p>
                  </div>
              )}

              {aDesTables && (
                  <PlanSalle
                      salle={salle}
                      placeSelId={etat.place?.id ?? null}
                      onSelect={basculer}
                  />
              )}
            </div>
          </section>

          {/* Erreur et possibilité de réessayer */}
          {erreur && (
              <div
                  role="alert"
                  className="mt-5 rounded-[18px] bg-[#FFF1F1] p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-[#B30000]"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-relaxed text-[#B30000]">
                      {erreur}
                    </p>

                    <button
                        type="button"
                        onClick={() => fetchSalle(etat.creneau.id)}
                        className="mt-3 text-[13px] font-semibold text-[#222222] underline underline-offset-4"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Place sélectionnée */}
          {placeSel && (
              <div className="mt-5 flex items-center gap-3 rounded-[18px] bg-[#FFF0ED] p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
                  <ChaiseIcone etat="sel" size={25} />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#717171]">
                    Ta place sélectionnée
                  </p>

                  <p
                      className="mt-1 truncate text-[16px] font-semibold text-[#222222]"
                      style={titreStyle}
                  >
                    Table {placeSel.table.replace(/^T/, "")} · N°{placeSel.numero}
                  </p>
                </div>
              </div>
          )}
        </main>

        {/* Confirmation */}
        <BottomCTA
            onClick={valider}
            disabled={!etat.place || envoi}
            aside={
              placeSel ? (
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#717171]">
                      Ta place
                    </p>

                    <p className="truncate text-[15px] font-semibold text-[#222222]">
                      Table {placeSel.table.replace(/^T/, "")} · N°{placeSel.numero}
                    </p>
                  </div>
              ) : (
                  <p className="text-[13px] leading-snug text-[#717171]">
                    Sélectionne une chaise libre
                  </p>
              )
            }
        >
          {envoi ? "Réservation…" : "Confirmer ma place"}
        </BottomCTA>
      </div>
  );
}

function Legende({ etat, label }) {
  return (
      <span className="flex items-center gap-1.5">
      <ChaiseIcone etat={etat} size={16} />
      <span className="text-[12px] text-[#717171]">{label}</span>
    </span>
  );
}
