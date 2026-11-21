import { useNavigate } from "react-router-dom";
import { CalendarDays, User, UtensilsCrossed, AlertCircle } from "lucide-react";
import { estAujourdhui, libelleJour } from "../../utils/jour";
import { formatHeure } from "../../utils/format";
import { useI18n } from "../../utils/i18n";
import { fcfa } from "../../utils/format";

export default function EcranRepasDuJour({ me, menu }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const peutReserver =
    menu.commandes_ouvertes && menu.compatibles.some((o) => o.stock_restant >= 3);

  // Plat mis en avant : le plat principal (ou sa version sans allergène), jamais l'accompagnement.
  const plat =
    menu.compatibles.find((o) => o.type !== "accompagnement") ||
    menu.compatibles[0] ||
    menu.incompatibles[0];
  const autres = menu.compatibles.filter((o) => o !== plat);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-2">
        <div>
          <p
            className="text-[22px] font-medium text-[var(--color-ink)]"
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.44px", lineHeight: 1.18 }}
          >
            Crédit : {fcfa(me.solde)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/profil")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-strong)]"
        >
          <User size={20} strokeWidth={1.75} className="text-[var(--color-ink)]" />
        </button>
      </header>

      {/* Section title */}
      <section className="px-6 pt-6 pb-4">
        <h1
          className="text-[28px] font-bold text-[var(--color-ink)]"
          style={{ fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.14, letterSpacing: "-0.02em" }}
        >
          {estAujourdhui(menu.date) ? "Repas du jour" : `Repas de ${libelleJour(menu.date)}`}
        </h1>
        <button type="button" onClick={() => navigate("/menus")}
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-[#EBEBEB] px-4 text-[14px] font-medium text-[#222222] hover:border-[#222222]">
          <CalendarDays size={16} aria-hidden="true" /> Menus à venir
        </button>
      </section>

      {/* Meal photo */}
      {plat && (
        <div className="px-6">
          <div className="overflow-hidden rounded-[var(--rounded-md)]" style={{ borderRadius: "22px" }}>
            {plat.photo ? (
              <img
                src={plat.photo}
                alt={plat.nom}
                className="w-full object-cover"
                style={{ aspectRatio: "4/3" }}
              />
            ) : (
              <div
                className="flex w-full items-center justify-center bg-[var(--color-surface-soft)]"
                style={{ aspectRatio: "4/3" }}
              >
                <UtensilsCrossed size={48} strokeWidth={1.25} className="text-[var(--color-muted-soft)]" />
              </div>
            )}
          </div>

          {/* Meal name */}
          <h2
            className="mt-4 text-[22px] font-medium text-[var(--color-ink)]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.18, letterSpacing: "-0.44px" }}
          >
            {plat.nom}
          </h2>

          {/* Price */}
          <p className="mt-1 text-[16px] text-[var(--color-muted)]" style={{ lineHeight: 1.5 }}>
            {fcfa(plat.prix)}
          </p>

          {/* Allergen warning if incompatible */}
          {!menu.compatibles.length && plat.raison && (
            <div className="mt-3 flex items-start gap-2 rounded-[var(--rounded-sm)] bg-[#fff5f3] px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-error)]" />
              <p className="text-[14px] leading-snug text-[var(--color-error)]">{plat.raison}</p>
            </div>
          )}

          {/* Ingredients */}
          {plat.ingredients?.length > 0 && (
            <div className="mt-5">
              <h3
                className="text-[16px] font-semibold text-[var(--color-ink)]"
                style={{ lineHeight: 1.25 }}
              >
                Ingrédients
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {plat.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="rounded-full border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3 py-1.5 text-[14px] text-[var(--color-body)]"
                    style={{ lineHeight: 1.43 }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Other options */}
          {autres.length > 0 && (
            <div className="mt-8">
              <h3
                className="text-[16px] font-semibold text-[var(--color-ink)]"
                style={{ lineHeight: 1.25 }}
              >
                Autres options
              </h3>
              {autres.map((o) => (
                <div
                  key={o.menu_jour_id}
                  className="mt-3 flex items-center gap-4 rounded-[var(--rounded-md)] bg-[var(--color-surface-soft)] p-4"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white">
                    {o.photo ? (
                      <img src={o.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <UtensilsCrossed size={22} strokeWidth={1.5} className="text-[var(--color-muted-soft)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-medium text-[var(--color-ink)]" style={{ lineHeight: 1.25 }}>
                      {o.nom}
                    </p>
                    <p className="mt-0.5 text-[14px] text-[var(--color-muted)]">{fcfa(o.prix)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Incompatible dishes */}
          {menu.incompatibles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted-soft)]">
                {t("non_compatible")}
              </h3>
              {menu.incompatibles.map((o) => (
                <div
                  key={o.menu_jour_id}
                  className="mt-3 rounded-[var(--rounded-md)] bg-[#fff5f3] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/70">
                      {o.photo ? (
                        <img src={o.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
                      ) : (
                        <UtensilsCrossed size={22} strokeWidth={1.5} className="text-[var(--color-muted-soft)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-medium text-[var(--color-ink)]" style={{ lineHeight: 1.25 }}>
                        {o.nom}
                      </p>
                      <p className="mt-0.5 text-[14px] text-[var(--color-muted)]">{fcfa(o.prix)}</p>
                    </div>
                  </div>
                  {o.raison && (
                    <div className="mt-2 flex items-start gap-2">
                      <AlertCircle size={14} className="mt-0.5 shrink-0 text-[var(--color-error)]" />
                      <p className="text-[13px] leading-snug text-[var(--color-error)]">{o.raison}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reserve button — Airbnb primary CTA style */}
      <div className="px-6 pb-10 pt-8">
        <button
          type="button"
          disabled={!peutReserver}
          onClick={() => navigate("/reservation")}
          className="w-full py-3.5 text-[16px] font-medium text-[var(--color-on-primary)] disabled:opacity-40"
          style={{
            backgroundColor: peutReserver ? "var(--color-primary)" : "var(--color-primary)",
            borderRadius: "var(--rounded-xl)",
            lineHeight: 1.25,
          }}
        >
          {t("reserver")}
        </button>
        {peutReserver && !menu.vague_ouverte && (
          <p className="mt-3 text-center text-[13px] text-[#717171]">
            Tu choisiras ta vague le jour même, à partir de {formatHeure(menu.heure_recreation ?? "10:00")}.
          </p>
        )}
      </div>
    </div>
  );
}
