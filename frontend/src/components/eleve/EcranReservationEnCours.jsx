
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Clock3,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";

import { annulerReservation } from "../../api/eleve";
import { useReservation } from "../../hooks/useReservation";
import { fcfa, formatHeure, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { Avatar, Libelle } from "../ui";
import { estAujourdhui, estBorne, libelleJour } from "../../utils/jour";
import FinBorne from "./FinBorne";

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
      <div className="flex items-center justify-between gap-4 py-3">
        <span className="text-[13px] text-[#717171]">{label}</span>
        <span className="text-right text-[14px] font-medium text-[#222222]">
        {valeur}
      </span>
      </div>
  );
}

export default function EcranReservationEnCours({
                                                  me,
                                                  reservation,
                                                  onAnnulee,
                                                }) {
  const navigate = useNavigate();
  const { reset, choisirVaguePour } = useReservation();

  const aChoisir = reservation.vague_a_choisir;
  const debut = reservation.creneau?.heure_debut ?? "00:00:00";

  const [sec, setSec] = useState(() => secondesJusquA(debut));
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const id = setInterval(
        () => setSec(secondesJusquA(debut)),
        1000
    );

    return () => clearInterval(id);
  }, [debut]);

  const servie = reservation.statut === "servie";
  const cloture = formatHeure(reservation.cloture_commandes);

  const annuler = async () => {
    if (!confirmer) {
      setConfirmer(true);
      return;
    }

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
      <main className="min-h-screen bg-white text-[#222222]">
        <div className="mx-auto w-full max-w-[760px] px-5 pb-[calc(32px+env(safe-area-inset-bottom))] sm:px-8">

          {/* En-tête */}
          <header className="flex items-center justify-between border-b border-[#EBEBEB] py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#717171]">
                Mon compte
              </p>

              <p className="mt-1 text-[18px] font-semibold">
                {fcfa(me.solde)}
              </p>

              <p className="text-[12px] text-[#717171]">Mon crédit</p>
            </div>

            <button
                type="button"
                onClick={() => navigate("/profil")}
                aria-label="Accéder à mon profil"
                className="rounded-full transition hover:opacity-80"
            >
              <Avatar nom={me.nom} photo={me.photo} taille={44} />
            </button>
          </header>

          {/* Titre */}
          <section className="py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#FF5A5F]">
              {servie ? "Repas servi" : "C'est réservé"}
            </p>

            <h1
                className="mt-2 text-[30px] font-semibold sm:text-[36px]"
                style={titreStyle}
            >
              Ma réservation
            </h1>

            {!estAujourdhui(reservation.date) && (
                <p className="mt-2 text-[14px] text-[#717171]">
                  Repas de{" "}
                  <span className="font-medium text-[#222222]">
                {libelleJour(reservation.date)}
              </span>
                </p>
            )}
          </section>

          {estBorne() && <FinBorne />}

          {/* Choix de vague */}
          {aChoisir && (
              <section className="mt-2 rounded-[24px] border border-[#F2D5D2] bg-[#FFF0ED] p-5 sm:p-6">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF5A5F]">
                  <Clock3 size={16} />
                  Vague à choisir
                </p>

                <p className="mt-3 text-[14px] leading-6 text-[#222222]">
                  {reservation.choix_vague_ouvert
                      ? "C'est la récréation : choisis ta vague et ta place pour obtenir ton ticket."
                      : `Ton repas est commandé. Tu choisiras ta vague ${estAujourdhui(reservation.date) ? "" : `${libelleJour(reservation.date)}`} à partir de ${formatHeure(reservation.heure_recreation ?? "10:00")}.`}
                </p>

                {reservation.choix_vague_ouvert && (
                    <button
                        type="button"
                        onClick={() => {
                          choisirVaguePour(reservation);
                          navigate("/reservation/horaire");
                        }}
                        className="mt-5 flex min-h-[54px] w-full items-center justify-center rounded-full bg-[#222222] px-6 text-[15px] font-semibold text-white transition hover:bg-[#383838] active:scale-[0.99]"
                    >
                      Choisir ma vague
                    </button>
                )}
              </section>
          )}

          {/* Ticket QR */}
          {!servie && !aChoisir && reservation.ticket && (
              <section className="mt-6 rounded-[24px] border border-[#EBEBEB] p-5 sm:p-6">
                <div className="text-center">
                  <Libelle>Ton ticket de cantine</Libelle>

                  <p className="mt-2 text-[14px] text-[#717171]">
                    Présente ce QR code au comptoir.
                  </p>
                </div>

                <div className="mx-auto mt-5 flex w-fit items-center justify-center rounded-[20px] bg-white p-4">
                  <QRCodeSVG
                      value={reservation.ticket}
                      size={220}
                      level="M"
                  />
                </div>

                <p className="mt-4 text-center text-[11px] text-[#B0B0B0]">
                  Ticket personnel · Ne partage pas ce code
                </p>
              </section>
          )}

          {/* Plat */}
          <section className="mt-6 overflow-hidden rounded-[24px] border border-[#EBEBEB]">
            <div className="aspect-[4/3] bg-[#F7F7F7] sm:aspect-[16/9]">
              {reservation.plat_photo ? (
                  <img
                      src={reservation.plat_photo}
                      alt={reservation.plat_nom}
                      className="h-full w-full object-cover"
                  />
              ) : (
                  <div className="flex h-full items-center justify-center">
                    <UtensilsCrossed
                        size={48}
                        strokeWidth={1.2}
                        className="text-[#B0B0B0]"
                    />
                  </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <Libelle>Repas réservé</Libelle>

              <h2
                  className="mt-2 text-[24px] font-semibold"
                  style={titreStyle}
              >
                {reservation.plat_nom}
              </h2>

              <p className="mt-2 text-[15px] text-[#717171]">
                {fcfa(reservation.prix)}
              </p>
            </div>
          </section>

          {/* Détails */}
          <section className="mt-6 rounded-[24px] border border-[#EBEBEB] px-5 sm:px-6">
            <div className="border-b border-[#EBEBEB] py-4">
              <Libelle>Détails de la réservation</Libelle>
            </div>

            <Ligne
                label="Portion"
                valeur={`${tiersEnFraction(reservation.tiers)} · ${fcfa(reservation.prix)}`}
            />

            {reservation.creneau && (
                <Ligne
                    label="Créneau"
                    valeur={`${formatHeure(debut)} – ${formatHeure(reservation.creneau.heure_fin)}`}
                />
            )}

            {reservation.place && (
                <Ligne
                    label="Place"
                    valeur={`Table ${reservation.place.table_nom.replace(/^T/, "")} · place ${reservation.place.numero}`}
                />
            )}
          </section>

          {/* Compte à rebours */}
          {!aChoisir && (
              <section className="mt-6 rounded-[24px] bg-[#222222] px-5 py-7 text-center text-white">
                {servie ? (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/60">
                        Bon appétit
                      </p>

                      <p
                          className="mt-2 text-[28px] font-semibold"
                          style={titreStyle}
                      >
                        Ton repas a été servi.
                      </p>
                    </>
                ) : sec > 0 ? (
                    <>
                      <p className="text-[13px] text-white/65">
                        Ton créneau commence dans
                      </p>

                      <p
                          className="mt-2 text-[46px] font-semibold tabular-nums sm:text-[54px]"
                          style={titreStyle}
                      >
                        {mmss(sec)}
                      </p>
                    </>
                ) : (
                    <p
                        className="text-[30px] font-semibold"
                        style={titreStyle}
                    >
                      C'est l'heure !
                    </p>
                )}
              </section>
          )}

          {/* Erreur */}
          {erreur && (
              <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-2xl bg-[#FFF0ED] p-4 text-[14px] leading-5 text-[#B30000]"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{erreur}</p>
              </div>
          )}

          {/* Annulation */}
          {!servie && (
              <section className="mt-8">
                <button
                    type="button"
                    onClick={annuler}
                    disabled={!reservation.annulable || envoi}
                    className={`flex min-h-[54px] w-full items-center justify-center rounded-full text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:bg-[#F7F7F7] disabled:text-[#B0B0B0] ${
                        confirmer
                            ? "bg-[#B30000] text-white"
                            : "border border-[#EBEBEB] bg-white text-[#222222] hover:border-[#222222]"
                    }`}
                >
                  {envoi
                      ? "Annulation en cours..."
                      : confirmer
                          ? `Confirmer : remboursement de ${fcfa(reservation.prix)}`
                          : "Annuler la réservation"}
                </button>

                <p className="mt-3 text-center text-[12px] leading-5 text-[#717171]">
                  {reservation.annulable
                      ? estAujourdhui(reservation.date)
                          ? `Annulation remboursée jusqu'à ${cloture}.`
                          : `Annulation remboursée jusqu'à ${cloture}, ${libelleJour(reservation.date)}.`
                      : `Annulation impossible après ${cloture} : la cuisine prépare déjà ton repas.`}
                </p>

                {confirmer && !envoi && (
                    <button
                        type="button"
                        onClick={() => setConfirmer(false)}
                        className="mt-3 w-full py-3 text-[13px] font-medium text-[#717171]"
                    >
                      Ne plus annuler
                    </button>
                )}
              </section>
          )}
        </div>
      </main>
  );
}
