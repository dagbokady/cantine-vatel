import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, UtensilsCrossed } from "lucide-react";
import { getMenuDuJour } from "../../api/eleve";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { fcfa } from "../../utils/format";

export default function Reservation() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { etat, choisirPlat } = useReservation();
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getMenuDuJour()
      .then((m) => alive && setMenu(m))
      .catch((e) =>
        alive && setError(e.response?.data?.detail || "Impossible de charger."),
      );
    return () => {
      alive = false;
    };
  }, []);

  const options = menu
    ? menu.compatibles.filter((o) => o.stock_restant >= 3)
    : [];
  const choix = etat.plat;
  const peutSuivre = choix !== null;

  return (
    <div className="min-h-screen bg-white pb-28">
      <header className="flex items-center gap-3 px-5 pb-2 pt-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eeece7] text-[#212121]"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="text-[22px] font-bold leading-tight text-[#212121]"
          style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
        >
          {t("reservation")}
        </h1>
      </header>

      <main className="px-5 pt-4">
        <p className="text-[13px] text-[#616161]">{t("choisir_plat")}</p>

        {error && (
          <p className="mt-4 rounded-xl bg-[#fff5f3] px-4 py-3 text-[13px] text-[#b30000]">
            {error}
          </p>
        )}

        {!menu && !error && (
          <p className="mt-6 text-[13px] text-[#93939f]">Chargement…</p>
        )}

        {menu && options.length === 0 && !error && (
          <p className="mt-6 rounded-xl bg-[#eeece7] px-4 py-3 text-[13px] text-[#616161]">
            Aucun plat disponible pour le moment.
          </p>
        )}

        <ul className="mt-4 space-y-2.5">
          {options.map((o) => {
            const actif = choix?.menu_jour_id === o.menu_jour_id;
            return (
              <li key={o.menu_jour_id}>
                <button
                  type="button"
                  onClick={() => choisirPlat(o)}
                  className={`flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition ${
                    actif
                      ? "border-[#003c33] bg-[#eeece7]"
                      : "border-[#f2f2f2] bg-white"
                  }`}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eeece7]">
                    {o.photo ? (
                      <img src={o.photo} alt="" className="h-14 w-14 object-cover" />
                    ) : (
                      <UtensilsCrossed size={22} className="text-[#93939f]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[15px] font-semibold text-[#212121]"
                      style={{ fontFamily: "Space Grotesk, sans-serif" }}
                    >
                      {o.nom}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-[#616161]">
                      {fcfa(o.prix)}
                    </p>
                  </div>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      actif
                        ? "border-[#003c33] bg-[#003c33] text-white"
                        : "border-[#d9d9dd]"
                    }`}
                  >
                    {actif && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white via-white to-transparent px-5 pb-6 pt-6">
        <button
          type="button"
          disabled={!peutSuivre}
          onClick={() => navigate("/reservation/quantite")}
          className="w-full rounded-[32px] bg-[#17171c] px-6 py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {t("suivant")}
        </button>
      </div>
    </div>
  );
}
