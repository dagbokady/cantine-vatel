import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSalle, postReservation } from "../../api/eleve";
import PlanSalle, { ChaiseIcone } from "../../components/eleve/PlanSalle";
import { Shuffle } from "lucide-react";
import { BackHeader, BottomCTA } from "../../components/ui";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { decouperNomPlat, formatHeure } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";

const MSG_PLACE_PRISE = "Cette place vient d'être prise. Choisis-en une autre.";

export default function Place() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { etat, choisirPlace, confirmer } = useReservation();
  const [salle, setSalle] = useState(null);
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const fetchSalle = useCallback(async (creneauId) => {
    try {
      setSalle(await getSalle(creneauId));
    } catch (e) {
      setErreur(e.response?.data?.detail || "Impossible de charger le plan.");
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

  const places = salle ? salle.tables.flatMap((tb) => tb.places.map((p) => ({ ...p, table: tb.nom }))) : [];
  const libres = places.filter((p) => p.etat !== "prise").length;
  const placeSel = places.find((p) => p.id === etat.place?.id);
  const basculer = (p) => choisirPlace(p.id === etat.place?.id ? null : p);

  const valider = async () => {
    if (!etat.place || envoi) return;
    setErreur("");
    setEnvoi(true);
    try {
      const res = await postReservation({
        menu_jour_id: etat.plat.menu_jour_id,
        creneau_id: etat.creneau.id,
        place_id: etat.place.id,
        tiers: etat.tiers,
      });
      confirmer(res);
      navigate("/", { replace: true });
    } catch (e) {
      if (e.response?.status === 409) {
        const detail = e.response.data?.detail || "";
        setToast(/place/i.test(detail) ? MSG_PLACE_PRISE : detail || MSG_PLACE_PRISE);
        choisirPlace(null);
        fetchSalle(etat.creneau.id);
      } else {
        setErreur(e.response?.data?.detail || "Impossible de réserver.");
      }
    } finally {
      setEnvoi(false);
    }
  };

  // Placement auto : première chaise libre de la table la plus disponible.
  const auHasard = () => {
    const meilleure = [...(salle?.tables || [])].sort(
      (a, b) => b.places.filter((p) => p.etat !== "prise").length - a.places.filter((p) => p.etat !== "prise").length,
    )[0];
    const p = meilleure?.places.find((x) => x.etat !== "prise");
    if (p) choisirPlace({ ...p, table: meilleure.nom });
  };
  const aDesTables = salle && salle.tables.length > 0;

  return (
    <div className="min-h-screen bg-white pb-36">
      {toast && (
        <div
          role="alert"
          className="fixed inset-x-4 top-[calc(12px+env(safe-area-inset-top))] z-30 mx-auto max-w-[528px] rounded-[16px] bg-[#222222] px-4 py-3 text-[14px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        >
          {toast}
        </div>
      )}

      <BackHeader titre="Choisis ta place" etape={4} surtitre="Dernière étape" />

      <main className="mx-auto max-w-[560px] px-5">
        <div className="mt-3 flex items-center gap-2 text-[14px] text-[#717171]">
          {etat.plat.photo ? (
            <img src={etat.plat.photo} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="h-7 w-7 shrink-0 rounded-full bg-[#FFF0ED]" />
          )}
          <span className="min-w-0 truncate">
            <span className="font-medium text-[#222222]">{decouperNomPlat(etat.plat.nom).nom}</span>
            {" · "}
            {formatHeure(etat.creneau.heure_debut)}
          </span>
        </div>

        {aDesTables && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-[14px] leading-tight text-[#717171]">
              <span className="text-[22px] font-semibold text-[#222222]" style={titreStyle}>
                {libres}
              </span>{" "}
              place{libres > 1 ? "s" : ""} libre{libres > 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={auHasard}
              disabled={!libres}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#EBEBEB] px-4 text-[14px] font-medium text-[#222222] transition-colors hover:border-[#222222] disabled:opacity-40"
            >
              <Shuffle size={15} strokeWidth={2} /> Au hasard
            </button>
          </div>
        )}

        {aDesTables && (
          <div className="mt-3 flex items-center gap-4 text-[13px] text-[#717171]">
            <Legende etat="libre" label="Libre" />
            <Legende etat="prise" label="Occupée" />
            <Legende etat="sel" label="Ta place" />
          </div>
        )}

        <div className="mt-3 rounded-[22px] bg-[#F7F7F7] px-1.5 pb-3">
          {salle === null && !erreur && (
            <p className="py-16 text-center text-[14px] text-[#B0B0B0]">Chargement du plan…</p>
          )}
          {salle && salle.tables.length === 0 && (
            <p className="py-16 text-center text-[15px] text-[#717171]">{t("aucune_table")}</p>
          )}
          {aDesTables && <PlanSalle salle={salle} placeSelId={etat.place?.id ?? null} onSelect={basculer} />}
        </div>

        {erreur && <p className="mt-4 rounded-[14px] bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#B30000]">{erreur}</p>}
      </main>

      <BottomCTA
        onClick={valider}
        disabled={!etat.place || envoi}
        aside={
          placeSel ? (
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF0ED]">
                <ChaiseIcone etat="sel" size={26} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] text-[#717171]">Ta place</p>
                <p className="truncate text-[17px] font-semibold text-[#222222]" style={titreStyle}>
                  Table {placeSel.table.replace(/^T/, "")} · n°{placeSel.numero}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[14px] leading-snug text-[#717171]">Touche un siège libre sur le plan</p>
          )
        }
      >
        {envoi ? "Réservation…" : "Réserver"}
      </BottomCTA>
    </div>
  );
}

function Legende({ etat, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <ChaiseIcone etat={etat} size={16} />
      {label}
    </span>
  );
}
