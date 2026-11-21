import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSalle, postReservation } from "../../api/eleve";
import PlanSalle from "../../components/eleve/PlanSalle";
import { BackHeader, BottomCTA } from "../../components/ui";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";

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

  return (
    <div className="min-h-screen bg-white pb-28">
      {toast && (
        <div
          role="alert"
          className="fixed inset-x-0 top-0 z-30 bg-[#fff1f1] px-5 pb-3 pt-[calc(12px+env(safe-area-inset-top))] text-[14px] text-[#b30000]"
        >
          {toast}
        </div>
      )}

      <BackHeader titre="Choisis ta place" />

      <main className="px-5 pt-4">
        <div className="flex items-center gap-4 text-[12px] text-[#616161]">
          <Legende couleur="#eeece7" label="Libre" />
          <Legende couleur="#93939f" label="Prise" />
          <Legende couleur="#003c33" label="Ta place" />
        </div>

        <div className="mt-5">
          {salle === null && !erreur && (
            <p className="py-10 text-center text-[14px] text-[#93939f]">Chargement du plan…</p>
          )}
          {salle && salle.tables.length === 0 && (
            <p className="py-10 text-center text-[15px] text-[#616161]">{t("aucune_table")}</p>
          )}
          {salle && salle.tables.length > 0 && (
            <PlanSalle salle={salle} placeSelId={etat.place?.id ?? null} onSelect={choisirPlace} />
          )}
        </div>

        {erreur && (
          <p className="mt-4 bg-[#fff1f1] px-4 py-3 text-[14px] text-[#b30000]">{erreur}</p>
        )}
      </main>

      <BottomCTA variante="vert" onClick={valider} disabled={!etat.place || envoi}>
        {envoi ? "Réservation…" : "Valider ma réservation"}
      </BottomCTA>
    </div>
  );
}

function Legende({ couleur, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full" style={{ background: couleur }} />
      {label}
    </span>
  );
}
