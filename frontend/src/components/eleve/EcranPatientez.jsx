import { Clock, UtensilsCrossed } from "lucide-react";
import { useI18n } from "../../utils/i18n";
import { fcfa, formatHeure } from "../../utils/format";

export default function EcranPatientez({ me, menu, raison }) {
  const { t } = useI18n();
  const fermees = raison === "fermees";

  return (
    <div className="min-h-screen bg-white pb-28">
      <header className="bg-[#003c33] px-5 pb-6 pt-14 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-white/70">
              {t("bonjour")}, {me.nom.split(" ")[0]}
            </p>
            <h1
              className="mt-1 text-[26px] font-bold leading-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}
            >
              {t("repas_du_jour")}
            </h1>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1.5 text-right">
            <p className="text-[10.5px] uppercase tracking-wide text-white/60">
              {t("solde")}
            </p>
            <p className="text-[15px] font-semibold leading-tight">
              {fcfa(me.solde)}
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center px-8 pt-20 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#eeece7]">
          {fermees ? (
            <Clock size={48} strokeWidth={1.5} className="text-[#003c33]" />
          ) : (
            <UtensilsCrossed
              size={48}
              strokeWidth={1.5}
              className="text-[#003c33]"
            />
          )}
        </div>
        <h2
          className="mt-8 text-[24px] font-bold leading-tight text-[#212121]"
          style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
        >
          {fermees ? t("commandes_fermees") : t("pas_de_menu")}
        </h2>
        <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-[#616161]">
          {fermees
            ? `${t("cloture_rappel")} ${formatHeure(menu?.cloture_commandes)}. ${t("reviens_bientot")}`
            : t("reviens_bientot")}
        </p>
      </main>
    </div>
  );
}
