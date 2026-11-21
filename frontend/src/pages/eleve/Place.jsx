import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getSalle, postReservation } from "../../api/eleve";
import PlanSalle from "../../components/eleve/PlanSalle";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { fcfa, formatHeure, prixPortion, tiersEnFraction } from "../../utils/format";
import { colors, fontCereal } from "../../utils/tokens";

export default function Place() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { etat, choisirPlace, confirmer } = useReservation();
  const [salle, setSalle] = useState(null);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const fetchSalle = async (creneauId) => {
    try {
      const d = await getSalle(creneauId);
      setSalle(d);
    } catch (e) {
      setErreur(e.response?.data?.detail || "Impossible de charger le plan.");
    }
  };

  useEffect(() => {
    if (!etat.plat || !etat.creneau) {
      navigate("/reservation", { replace: true });
      return;
    }
    fetchSalle(etat.creneau.id);
  }, [etat.plat, etat.creneau, navigate]);

  if (!etat.plat || !etat.creneau) return null;

  const prix = prixPortion(etat.plat.prix, etat.tiers);

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
      const detail = e.response?.data?.detail || "Impossible de réserver.";
      setErreur(detail);
      if (e.response?.status === 409) {
        // la place vient d'être prise ou le créneau est plein → rafraîchir
        choisirPlace(null);
        fetchSalle(etat.creneau.id);
      }
    } finally {
      setEnvoi(false);
    }
  };

  const titre = {
    fontFamily: fontCereal,
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: "-0.44px",
    color: colors.ink,
  };

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: colors.canvas, fontFamily: fontCereal }}
    >
      <header className="flex items-center gap-3 px-5 pb-2 pt-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: colors.surfaceStrong, color: colors.ink }}
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={titre}>{t("place")}</h1>
      </header>

      <main className="px-5 pt-2">
        <p style={{ fontSize: 14, color: colors.muted }}>
          {t("choisir_place")} ·{" "}
          {formatHeure(etat.creneau.heure_debut)}–
          {formatHeure(etat.creneau.heure_fin)}
        </p>

        <div className="mt-4 overflow-hidden rounded-[14px] border"
          style={{ borderColor: colors.hairline, background: colors.canvas }}
        >
          {salle === null && !erreur && (
            <p className="px-4 py-10 text-center text-[13px]"
              style={{ color: colors.mutedSoft }}
            >
              Chargement du plan…
            </p>
          )}
          {salle && salle.tables.length === 0 && (
            <p className="px-4 py-10 text-center text-[13px]"
              style={{ color: colors.muted }}
            >
              {t("aucune_table")}
            </p>
          )}
          {salle && salle.tables.length > 0 && (
            <div className="p-3">
              <PlanSalle
                salle={salle}
                placeSelId={etat.place?.id ?? null}
                onSelect={choisirPlace}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 text-[12.5px]"
          style={{ color: colors.muted }}
        >
          <Legende couleur={colors.canvas} border={colors.ink} label={t("libre")} />
          <Legende couleur={colors.surfaceStrong} border={colors.borderStrong} label={t("prise")} />
          <Legende couleur={colors.primary} border={colors.primary} label="sélection" />
        </div>

        {erreur && (
          <p
            className="mt-4 rounded-[8px] px-4 py-3 text-[14px]"
            style={{
              background: "#fdecea",
              color: colors.errorText,
              border: `1px solid ${colors.errorText}22`,
            }}
          >
            {erreur}
          </p>
        )}

        <div className="mt-5 rounded-[14px] border p-4"
          style={{ borderColor: colors.hairlineSoft, background: colors.surfaceSoft }}
        >
          <Ligne label={etat.plat.nom} value={tiersEnFraction(etat.tiers)} />
          <Ligne
            label={`${formatHeure(etat.creneau.heure_debut)} – ${formatHeure(etat.creneau.heure_fin)}`}
            value={etat.place ? `Place ${etat.place.numero}` : "—"}
          />
          <div className="mt-2 flex items-end justify-between border-t pt-2"
            style={{ borderColor: colors.hairlineSoft }}
          >
            <span style={{ fontSize: 13, color: colors.muted }}>À payer</span>
            <span
              style={{
                fontFamily: fontCereal,
                fontSize: 20,
                fontWeight: 600,
                color: colors.ink,
              }}
            >
              {fcfa(prix)}
            </span>
          </div>
        </div>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-10 px-5 pb-6 pt-6"
        style={{
          background: `linear-gradient(to top, ${colors.canvas} 70%, transparent)`,
        }}
      >
        <button
          type="button"
          onClick={valider}
          disabled={!etat.place || envoi}
          style={{
            background: !etat.place || envoi ? colors.primaryDisabled : colors.primary,
            color: colors.onPrimary,
            fontFamily: fontCereal,
            fontSize: 16,
            fontWeight: 500,
            borderRadius: 8,
            height: 48,
            width: "100%",
            cursor: !etat.place || envoi ? "not-allowed" : "pointer",
          }}
        >
          {envoi ? "…" : t("valider")}
        </button>
      </div>
    </div>
  );
}

function Legende({ couleur, border, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-3.5 w-3.5 rounded-full"
        style={{ background: couleur, border: `1.5px solid ${border}` }}
      />
      {label}
    </div>
  );
}

function Ligne({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span style={{ fontSize: 14, color: colors.body }}>{label}</span>
      <span style={{ fontSize: 14, color: colors.ink, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
