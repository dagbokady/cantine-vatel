import { useNavigate } from "react-router-dom";
import { Clock, UtensilsCrossed, User } from "lucide-react";
import { useI18n } from "../../utils/i18n";
import { fcfa, formatHeure } from "../../utils/format";

export default function EcranPatientez({ me, menu, raison }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const fermees = raison === "fermees";

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      {/* Header — same as accueil */}
      <header className="flex items-center justify-between px-6 pt-14 pb-2">
        <p
          className="text-[22px] font-medium text-[var(--color-ink)]"
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.44px", lineHeight: 1.18 }}
        >
          Crédit : {fcfa(me.solde)}
        </p>
        <button
          type="button"
          onClick={() => navigate("/profil")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-strong)]"
        >
          <User size={20} strokeWidth={1.75} className="text-[var(--color-ink)]" />
        </button>
      </header>

      <section className="px-6 pt-6 pb-4">
        <h1
          className="text-[28px] font-bold text-[var(--color-ink)]"
          style={{ fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.14, letterSpacing: "-0.02em" }}
        >
          Repas du jour
        </h1>
      </section>

      <main className="flex flex-col items-center px-8 pt-16 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-surface-soft)]">
          {fermees ? (
            <Clock size={40} strokeWidth={1.25} className="text-[var(--color-muted)]" />
          ) : (
            <UtensilsCrossed size={40} strokeWidth={1.25} className="text-[var(--color-muted)]" />
          )}
        </div>
        <h2
          className="mt-6 text-[22px] font-medium text-[var(--color-ink)]"
          style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.44px", lineHeight: 1.18 }}
        >
          {fermees ? t("commandes_fermees") : t("pas_de_menu")}
        </h2>
        <p className="mt-3 max-w-xs text-[16px] text-[var(--color-muted)]" style={{ lineHeight: 1.5 }}>
          {fermees
            ? `${t("cloture_rappel")} ${formatHeure(menu?.cloture_commandes)}. ${t("reviens_bientot")}`
            : t("reviens_bientot")}
        </p>
      </main>
    </div>
  );
}
