import { useNavigate } from "react-router-dom";
import { AlertCircle, UtensilsCrossed } from "lucide-react";
import { useI18n } from "../../utils/i18n";
import { fcfa, formatHeure } from "../../utils/format";

function CarteOption({ option, compatible }) {
  const { t } = useI18n();
  return (
    <article
      className={`mt-3 overflow-hidden rounded-[22px] ${
        compatible ? "bg-[#eeece7]" : "bg-[#fff5f3] ring-1 ring-[#ffd5cc]"
      }`}
    >
      <div className="relative flex items-center gap-4 p-4">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full ${
            compatible ? "bg-white" : "bg-white/70"
          }`}
        >
          {option.photo ? (
            <img
              src={option.photo}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <UtensilsCrossed
              size={28}
              strokeWidth={1.5}
              className="text-[#93939f]"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="text-[17px] font-semibold leading-tight text-[#212121]"
            style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.01em" }}
          >
            {option.nom}
          </h3>
          <p className="mt-1 text-[13px] text-[#616161]">{fcfa(option.prix)}</p>
          {option.stock_restant <= 0 ? (
            <p className="mt-1 text-[12px] font-medium text-[#b30000]">
              {t("rupture")}
            </p>
          ) : (
            <p className="mt-1 text-[12px] text-[#93939f]">
              {Math.floor(option.stock_restant / 3)} {t("stock_restant")}
            </p>
          )}
        </div>
      </div>

      {!compatible && option.raison && (
        <div className="flex items-start gap-2 border-t border-[#ffd5cc] bg-[#fff0ec] px-4 py-2.5">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#b30000]" />
          <p className="text-[12.5px] leading-snug text-[#b30000]">
            {option.raison}
          </p>
        </div>
      )}

      {option.ingredients?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#f2f2f2] px-4 py-3">
          {option.ingredients.map((ing) => (
            <span
              key={ing}
              className="rounded-full border border-[#d9d9dd] bg-white px-2.5 py-1 text-[11.5px] text-[#616161]"
            >
              {ing}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default function EcranRepasDuJour({ me, menu }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const peutReserver =
    menu.commandes_ouvertes && menu.compatibles.some((o) => o.stock_restant >= 3);

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
        <p className="mt-4 text-[12px] text-white/60">
          {t("cloture_rappel")} {formatHeure(menu.cloture_commandes)}
        </p>
      </header>

      <main className="px-5 pt-5">
        {menu.compatibles.length === 0 && menu.incompatibles.length > 0 && (
          <p className="rounded-xl bg-[#fff5f3] px-4 py-3 text-[13px] text-[#b30000]">
            Aucun plat n'est compatible avec tes allergies aujourd'hui.
          </p>
        )}

        {menu.compatibles.map((o) => (
          <CarteOption key={o.menu_jour_id} option={o} compatible />
        ))}

        {menu.incompatibles.length > 0 && (
          <h2
            className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-[#93939f]"
          >
            {t("non_compatible")}
          </h2>
        )}
        {menu.incompatibles.map((o) => (
          <CarteOption key={o.menu_jour_id} option={o} compatible={false} />
        ))}
      </main>

      <div className="fixed inset-x-0 bottom-[64px] z-10 bg-gradient-to-t from-white via-white to-transparent px-5 pb-4 pt-6">
        <button
          type="button"
          disabled={!peutReserver}
          onClick={() => navigate("/reservation")}
          className="w-full rounded-[32px] bg-[#17171c] px-6 py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {t("reserver")}
        </button>
      </div>
    </div>
  );
}
