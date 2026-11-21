
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Clock3,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";

import { annulerReservation, getReservationDuJour } from "../../api/eleve";
import { useReservation } from "../../hooks/useReservation";
import { fcfa, formatHeure, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { Avatar, Libelle } from "../ui";
import { estAujourdhui, estBorne, libelleJour } from "../../utils/jour";
import FinBorne from "./FinBorne";
import CartePlace from "./CartePlace";
import EcranBonAppetit from "./EcranBonAppetit";

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
                                                  reservation: initiale,
                                                  onAnnulee,
                                                }) {
  const [reservation, setReservation] = useState(initiale);
  const [precedente, setPrecedente] = useState(initiale);
  if (precedente !== initiale) {
    setPrecedente(initiale);
    setReservation(initiale);
  }
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
  const cleReport = `avis-plus-tard-${reservation.id}`;
  const [reporte, setReporte] = useState(() => {
    try { return sessionStorage.getItem(cleReport) === "1"; } catch { return false; }
  });
  const noter = !estBorne() && servie && reservation.avis == null && !reporte;

  // Le scan au comptoir passe la commande à « servie » : on surveille pour lancer « Bon appétit ».
  useEffect(() => {
    if (servie) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      getReservationDuJour().then((r) => r && r.id === reservation.id && setReservation(r)).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [servie, reservation.id]);
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
      <main className="min-h-dvh bg-white text-[#222222]">
        {noter && (
            <EcranBonAppetit
                reservation={reservation}
                onTermine={(avis) => setReservation((r) => ({ ...r, avis }))}
                onPlusTard={() => {
                  try { sessionStorage.setItem(cleReport, "1"); } catch { /* navigation privée */ }
                  setReporte(true);
                }}
            />
        )}
        <div className="mx-auto w-full max-w-[760px] px-4 pb-[calc(32px+env(safe-area-inset-bottom))] sm:px-8">

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

          {/* Ticket : QR code puis code de secours */}
          {!servie && !aChoisir && reservation.ticket && (
              <section className="mt-6 rounded-[24px] border border-[#EBEBEB] px-4 py-6 sm:p-7">
                <div className="text-center">
                  <Libelle>Ton ticket de cantine</Libelle>
                  <p className="mt-2 text-[14px] text-[#717171]">
                    Présente ce QR code au comptoir.
                  </p>
                </div>

                <div className="mx-auto mt-5 w-full max-w-[236px] rounded-[20px] bg-white p-2">
                  <QRCodeSVG
                      value={reservation.ticket}
                      size={220}
                      level="M"
                      style={{ width: "100%", height: "auto" }}
                  />
                </div>

                {reservation.code && (
                    <div className="mx-auto mt-5 max-w-[320px] rounded-[20px] bg-[#F7F7F7] px-4 py-4 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#717171]">
                        Code de secours
                      </p>
                      <p
                          className="mt-1 select-all font-mono text-[34px] font-semibold tracking-[0.18em] text-[#222222] sm:text-[38px]"
                          aria-label={`Code de secours : ${reservation.code.split("").join(" ")}`}
                      >
                        {reservation.code}
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-[#717171]">
                        Si tu ne peux pas présenter ton QR code, communique ce code à l'agent.
                      </p>
                    </div>
                )}

                <p className="mt-4 text-center text-[11px] text-[#B0B0B0]">
                  Ticket personnel · Ne partage pas ces codes
                </p>
              </section>
          )}

          {/* Repas et place */}
          <section className={`mt-6 grid gap-3 ${reservation.place ? "min-[360px]:grid-cols-[1.15fr_1fr]" : ""}`}>
            <div className="overflow-hidden rounded-[22px] border border-[#EBEBEB]">
              <div className={`bg-[#F7F7F7] ${reservation.place ? "aspect-square" : "aspect-[16/9]"}`}>
                {reservation.plat_photo ? (
                    <img
                        src={reservation.plat_photo}
                        alt={reservation.plat_nom}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                      <UtensilsCrossed size={44} strokeWidth={1.2} className="text-[#B0B0B0]" />
                    </div>
                )}
              </div>
              <div className="p-4">
                <Libelle>Repas réservé</Libelle>
                <h2 className="mt-1 text-[19px] font-semibold" style={titreStyle}>
                  {reservation.plat_nom}
                </h2>
                {reservation.composition?.length > 0 && (
                    <p className="mt-1 text-[13px] leading-5 text-[#717171]">
                      {reservation.composition.join(" · ")}
                    </p>
                )}
              </div>
            </div>
            {reservation.place && <CartePlace place={reservation.place} />}
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

            <Ligne label="Statut" valeur={servie ? "Servi" : aChoisir ? "Vague à choisir" : "Confirmée"} />
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
                      {reservation.avis != null ? (
                          <p className="mt-3 text-[13px] text-white/65">
                            Merci pour ton avis : {reservation.avis === 1 ? "tu as aimé" : "à améliorer"}.
                          </p>
                      ) : !estBorne() && (
                          <button
                              type="button"
                              onClick={() => setReporte(false)}
                              className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-6 text-[14px] font-semibold text-[#222222]"
                          >
                            Noter mon plat
                          </button>
                      )}
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
