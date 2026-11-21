import { useEffect, useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { useI18n } from "../../utils/i18n";
import { fcfa, formatHeure, tiersEnFraction } from "../../utils/format";

function secondesJusquA(creneauHeureDebut) {
  const [h, m] = creneauHeureDebut.split(":").map(Number);
  const now = new Date();
  const cible = new Date();
  cible.setHours(h, m, 0, 0);
  return Math.max(0, Math.floor((cible - now) / 1000));
}

function formatCompte(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function EcranReservationEnCours({ me, reservation }) {
  const { t } = useI18n();
  const [sec, setSec] = useState(() =>
    secondesJusquA(reservation.creneau.heure_debut),
  );

  useEffect(() => {
    const id = setInterval(
      () => setSec(secondesJusquA(reservation.creneau.heure_debut)),
      1000,
    );
    return () => clearInterval(id);
  }, [reservation.creneau.heure_debut]);

  return (
    <div className="min-h-screen bg-white pb-28">
      <header className="bg-[#003c33] px-5 pb-6 pt-14 text-white">
        <p className="text-[13px] text-white/70">
          {t("bonjour")}, {me.nom.split(" ")[0]}
        </p>
        <h1
          className="mt-1 text-[26px] font-bold leading-tight"
          style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}
        >
          {t("ma_reservation")}
        </h1>
      </header>

      <main className="px-5 pt-6">
        <section className="rounded-[22px] bg-[#eeece7] p-6 text-center">
          <p className="text-[12px] uppercase tracking-wide text-[#616161]">
            {t("creneau")} {formatHeure(reservation.creneau.heure_debut)}
          </p>
          <p
            className="mt-2 text-[44px] font-bold leading-none text-[#17171c] tabular-nums"
            style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}
          >
            {formatCompte(sec)}
          </p>
          <p className="mt-2 text-[12px] text-[#93939f]">
            {sec > 0 ? "Avant ton créneau" : "C'est l'heure !"}
          </p>
        </section>

        <section className="mt-5 rounded-[22px] border border-[#f2f2f2] p-5">
          <h2
            className="text-[18px] font-semibold text-[#212121]"
            style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
          >
            {reservation.plat_nom}
          </h2>
          <div className="mt-3 flex items-center justify-between text-[13px] text-[#616161]">
            <span>
              {t("portion")} {tiersEnFraction(reservation.tiers)}
            </span>
            <span className="font-semibold text-[#212121]">
              {fcfa(reservation.prix)}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4 border-t border-[#f2f2f2] pt-4 text-[13px] text-[#616161]">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} />
              {formatHeure(reservation.creneau.heure_debut)}–
              {formatHeure(reservation.creneau.heure_fin)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} />
              {reservation.place.table_nom} · n°{reservation.place.numero}
            </span>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-[64px] z-10 bg-gradient-to-t from-white via-white to-transparent px-5 pb-4 pt-6">
        <button
          type="button"
          disabled
          className="w-full rounded-[32px] bg-[#eeece7] px-6 py-3.5 text-[15px] font-semibold text-[#93939f]"
        >
          {t("annuler_reservation")} · {t("bientot")}
        </button>
      </div>
    </div>
  );
}
