import { useEffect, useState } from "react";
import { getMe, getHistorique } from "../../api/eleve";
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../utils/i18n";
import { fcfa, tiersEnFraction } from "../../utils/format";
import { Avatar, BackHeader, Libelle } from "../../components/ui";
import { titreStyle } from "../../utils/tokens";

function dateCourte(iso, lang) {
  const [y, m, d] = iso.split("-").map(Number);
  const s = new Date(y, m - 1, d).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ChoixLangue() {
  const { lang, setLang, t } = useI18n();
  const bouton = (code, label) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      aria-pressed={lang === code}
      className={`h-10 flex-1 rounded-full text-[14px] transition-colors ${
        lang === code ? "bg-[#222222] font-medium text-white" : "bg-[#F7F7F7] text-[#222222]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="mt-2 flex gap-2">
      {bouton("fr", t("francais"))}
      {bouton("en", t("anglais"))}
    </div>
  );
}

export default function Profil() {
  const { t, lang } = useI18n();
  const { logout } = useAuth();
  const [me, setMe] = useState(null);
  const [hist, setHist] = useState({ reservations: [] });
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
      <div className="flex min-h-screen items-center justify-center bg-white text-[14px] text-[#B0B0B0]">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-[calc(32px+env(safe-area-inset-bottom))]">
      <BackHeader to="/" />

      <main className="px-5 pt-4">
        <section className="flex flex-col items-center text-center">
          <Avatar nom={me.nom} photo={me.photo} taille={80} />
          <h1 className="mt-3 text-[24px] font-medium text-[#222222]" style={titreStyle}>
            {me.nom}
          </h1>
          <p className="mt-1 text-[15px] text-[#717171]">{me.classe}</p>
          <p className="mt-0.5 text-[13px] text-[#B0B0B0]">{me.matricule}</p>
        </section>

        <section className="mt-8">
          <Libelle>{t("langue")}</Libelle>
          <ChoixLangue />
        </section>

        <section className="mt-6">
          <Libelle>{t("allergies")}</Libelle>
          {me.allergies.length === 0 ? (
            <p className="mt-2 text-[14px] text-[#717171]">{t("aucune_allergie")}</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {me.allergies.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-[#FF5A5F] bg-[#F7F7F7] px-3 py-1 text-[14px] text-[#222222]"
                >
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-[13px] text-[#B0B0B0]">Gérées par ton parent</p>
        </section>

        <section className="mt-6">
          <Libelle>{t("historique")}</Libelle>
          {hist.reservations.length === 0 ? (
            <p className="mt-2 text-[14px] text-[#717171]">{t("aucun_historique")}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {hist.reservations.map((r) => (
                <li key={r.id} className="rounded-[12px] border border-[#EBEBEB] p-3">
                  <p className="text-[13px] text-[#B0B0B0]">{dateCourte(r.date, lang)}</p>
                  <p className="mt-0.5 text-[15px] font-medium text-[#222222]">{r.plat_nom}</p>
                  <p className="mt-0.5 text-[14px] text-[#717171]">
                    {tiersEnFraction(r.tiers)} · {fcfa(r.prix)}
                    {r.statut === "annulee" && " · annulée"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={logout}
            className="min-h-12 px-4 text-[15px] text-[#b30000] underline underline-offset-2"
          >
            Se déconnecter
          </button>
        </div>
      </main>
    </div>
  );
}
