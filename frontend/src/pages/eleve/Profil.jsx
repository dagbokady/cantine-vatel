import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import { getMe, getHistorique } from "../../api/eleve";
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../utils/i18n";
import { fcfa, formatHeure, tiersEnFraction } from "../../utils/format";

function SectionTitre({ children }) {
  return (
    <h2 className="mt-7 text-[12px] font-semibold uppercase tracking-wider text-[#93939f]">
      {children}
    </h2>
  );
}

function ChoixLangue() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="mt-2 inline-flex rounded-full border border-[#d9d9dd] p-1">
      <button
        type="button"
        onClick={() => setLang("fr")}
        className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
          lang === "fr" ? "bg-[#17171c] text-white" : "text-[#616161]"
        }`}
      >
        {t("francais")}
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
          lang === "en" ? "bg-[#17171c] text-white" : "text-[#616161]"
        }`}
      >
        {t("anglais")}
      </button>
    </div>
  );
}

export default function Profil() {
  const { t } = useI18n();
  const { logout } = useAuth();
  const [me, setMe] = useState(null);
  const [hist, setHist] = useState({ reservations: [], transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [m, h] = await Promise.all([getMe(), getHistorique()]);
        if (alive) {
          setMe(m);
          setHist(h);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-[#93939f]">
        Chargement…
      </div>
    );
  }

  const aucunHist =
    hist.reservations.length === 0 && hist.transactions.length === 0;

  return (
    <div className="min-h-screen bg-white pb-28">
      <header className="bg-[#003c33] px-5 pb-8 pt-14 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/15">
            {me.photo ? (
              <img src={me.photo} alt="" className="h-16 w-16 object-cover" />
            ) : (
              <User size={28} strokeWidth={1.75} className="text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-[22px] font-bold leading-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
            >
              {me.nom}
            </h1>
            <p className="mt-0.5 text-[13px] text-white/70">
              {me.classe} · {me.matricule}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-white/60">
            {t("solde")}
          </p>
          <p className="mt-0.5 text-[20px] font-semibold">{fcfa(me.solde)}</p>
        </div>
      </header>

      <main className="px-5">
        <SectionTitre>{t("langue")}</SectionTitre>
        <ChoixLangue />

        <SectionTitre>{t("allergies")}</SectionTitre>
        {me.allergies.length === 0 ? (
          <p className="mt-2 text-[14px] text-[#616161]">{t("aucune_allergie")}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {me.allergies.map((a) => (
              <span
                key={a}
                className="rounded-full bg-[#fff0ec] px-3 py-1.5 text-[13px] font-medium text-[#b30000]"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-[12px] text-[#93939f]">{t("allergies_info")}</p>

        <SectionTitre>{t("historique")}</SectionTitre>
        {aucunHist ? (
          <p className="mt-2 text-[14px] text-[#616161]">{t("aucun_historique")}</p>
        ) : (
          <>
            {hist.reservations.length > 0 && (
              <>
                <p className="mt-3 text-[12px] font-medium text-[#616161]">
                  {t("reservations_passees")}
                </p>
                <ul className="mt-1 divide-y divide-[#f2f2f2]">
                  {hist.reservations.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-[#212121]">
                          {r.plat_nom}
                        </p>
                        <p className="text-[12px] text-[#93939f]">
                          {r.date} · {t("portion")} {tiersEnFraction(r.tiers)}
                          {r.statut === "annulee" && " · annulée"}
                        </p>
                      </div>
                      <span className="shrink-0 text-[13px] font-semibold text-[#212121]">
                        {fcfa(r.prix)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {hist.transactions.length > 0 && (
              <>
                <p className="mt-5 text-[12px] font-medium text-[#616161]">
                  {t("transactions")}
                </p>
                <ul className="mt-1 divide-y divide-[#f2f2f2]">
                  {hist.transactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[14px] text-[#212121]">
                          {tx.libelle}
                        </p>
                        <p className="text-[12px] text-[#93939f]">
                          {new Date(tx.created_at).toLocaleDateString()}{" "}
                          {formatHeure(
                            new Date(tx.created_at)
                              .toTimeString()
                              .slice(0, 5)
                              .replace(":", ":"),
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[13px] font-semibold ${
                          tx.montant >= 0 ? "text-[#003c33]" : "text-[#212121]"
                        }`}
                      >
                        {tx.montant >= 0 ? "+" : ""}
                        {fcfa(tx.montant)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        <button
          type="button"
          onClick={logout}
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#d9d9dd] px-4 py-2.5 text-[13px] font-medium text-[#212121]"
        >
          <LogOut size={16} />
          {t("deconnexion")}
        </button>
      </main>
    </div>
  );
}
