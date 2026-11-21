import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { UtensilsCrossed } from "lucide-react";
import { annulerReservation } from "../../api/eleve";
import { useReservation } from "../../hooks/useReservation";
import { fcfa, formatHeure, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { Avatar, Libelle } from "../ui";

function secondesJusquA(hhmmss) {
  const [h, m] = hhmmss.split(":").map(Number);
  const cible = new Date();
  cible.setHours(h, m, 0, 0);
  return Math.max(0, Math.floor((cible - Date.now()) / 1000));
}

const mmss = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

function Ligne({ label, valeur }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[14px] text-[#717171]">{label}</span>
      <span className="text-[15px] font-medium text-[#222222]">{valeur}</span>
    </div>
  );
}

export default function EcranReservationEnCours({ me, reservation, onAnnulee }) {
  const navigate = useNavigate();
  const { reset } = useReservation();
  const debut = reservation.creneau.heure_debut;
  const [sec, setSec] = useState(() => secondesJusquA(debut));
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const id = setInterval(() => setSec(secondesJusquA(debut)), 1000);
    return () => clearInterval(id);
  }, [debut]);

  const servie = reservation.statut === "servie";
  const cloture = formatHeure(reservation.cloture_commandes);

  const annuler = async () => {
    if (!confirmer) return setConfirmer(true);
    setEnvoi(true);
    setErreur("");
    try {
      await annulerReservation(reservation.id);
      reset();
      onAnnulee();
    } catch (e) {
      setErreur(e.response?.data?.detail || "Annulation impossible.");
      setConfirmer(false);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-5 pb-[calc(32px+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between pt-3">
        <p className="text-[16px] text-[#717171]">
          Crédit : <span className="font-medium text-[#222222]">{fcfa(me.solde)}</span>
        </p>
        <button
          type="button"
          onClick={() => navigate("/profil")}
          aria-label="Profil"
          className="-mr-1 flex h-12 w-12 items-center justify-center"
        >
          <Avatar nom={me.nom} photo={me.photo} />
        </button>
      </header>

      <h1 className="mt-4 text-[28px] font-medium text-[#222222]" style={titreStyle}>
        Ma réservation
      </h1>

      {!servie && (
        <section className="mt-5 flex flex-col items-center">
          <Libelle>Ton ticket</Libelle>
          <div className="mt-3 rounded-[16px] border border-[#EBEBEB] bg-white p-4">
            <QRCodeSVG value={reservation.ticket} size={220} level="M" />
          </div>
          <p className="mt-2 text-[13px] text-[#B0B0B0]">Montre-le au comptoir</p>
        </section>
      )}

      <div className="mt-6 overflow-hidden rounded-[22px] bg-[#F7F7F7]" style={{ aspectRatio: "4/3" }}>
        {reservation.plat_photo ? (
          <img src={reservation.plat_photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed size={48} strokeWidth={1.25} className="text-[#B0B0B0]" />
          </div>
        )}
      </div>

      <p className="mt-4 text-[18px] font-medium text-[#222222]">{reservation.plat_nom}</p>

      <section className="mt-2 divide-y divide-[#EBEBEB]">
        <Ligne label="Portion" valeur={`${tiersEnFraction(reservation.tiers)} · ${fcfa(reservation.prix)}`} />
        <Ligne
          label="Créneau"
          valeur={`${formatHeure(debut)} – ${formatHeure(reservation.creneau.heure_fin)}`}
        />
        <Ligne
          label="Place"
          valeur={`Table ${reservation.place.table_nom.replace(/^T/, "")} · place ${reservation.place.numero}`}
        />
      </section>

      <section className="mt-6 rounded-[16px] bg-[#222222] px-5 py-6 text-center text-white">
        {servie ? (
          <p className="text-[24px] font-medium" style={titreStyle}>Bon appétit !</p>
        ) : sec > 0 ? (
          <>
            <p className="text-[13px] text-white/70">Ton créneau commence dans</p>
            <p className="mt-1 text-[44px] font-medium tabular-nums" style={titreStyle}>
              {mmss(sec)}
            </p>
          </>
        ) : (
          <p className="text-[28px] font-medium" style={titreStyle}>C'est l'heure</p>
        )}
      </section>


      {erreur && (
        <p role="alert" className="mt-6 bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#b30000]">
          {erreur}
        </p>
      )}

      {!servie && (
        <div className="mt-8">
          <button
            type="button"
            onClick={annuler}
            disabled={!reservation.annulable || envoi}
            className={`h-[52px] w-full rounded-[32px] text-[16px] font-medium transition-colors disabled:bg-[#F7F7F7] disabled:text-[#B0B0B0] ${
              confirmer ? "bg-[#b30000] text-white" : "border border-[#EBEBEB] bg-white text-[#222222]"
            }`}
          >
            {envoi
              ? "Annulation…"
              : confirmer
                ? `Confirmer : remboursement de ${fcfa(reservation.prix)}`
                : "Annuler la réservation"}
          </button>
          <p className="mt-2 text-center text-[13px] text-[#B0B0B0]">
            {reservation.annulable
              ? `Annulation remboursée jusqu'à ${cloture}.`
              : `Annulation impossible après ${cloture} : la cuisine prépare déjà ton repas.`}
          </p>
        </div>
      )}
    </div>
  );
}
