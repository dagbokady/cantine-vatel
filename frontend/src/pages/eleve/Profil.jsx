
import { useCallback, useEffect, useState } from "react";
import {
  LogOut,
  Languages,
  ShieldAlert,
  Clock3,
  RefreshCw,
  AlertCircle,
  Utensils,
} from "lucide-react";

import { getMe, getHistorique } from "../../api/eleve";
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../utils/i18n";
import { fcfa, tiersEnFraction } from "../../utils/format";
import { Avatar, BackHeader, Libelle } from "../../components/ui";
import { titreStyle } from "../../utils/tokens";

function dateCourte(iso, lang) {
  const [y, m, d] = iso.split("-").map(Number);

  const s = new Date(y, m - 1, d).toLocaleDateString(
      lang === "en" ? "en-GB" : "fr-FR",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
      }
  );

  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ChoixLangue() {
  const { lang, setLang, t } = useI18n();

  const bouton = (code, label) => (
      <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`h-11 flex-1 rounded-full text-[14px] transition-colors ${
              lang === code
                  ? "bg-[#222222] font-medium text-white"
                  : "bg-[#F7F7F7] text-[#222222] hover:bg-[#EBEBEB]"
          }`}
      >
        {label}
      </button>
  );

  return (
      <div className="mt-4 flex gap-2">
        {bouton("fr", t("francais"))}
        {bouton("en", t("anglais"))}
      </div>
  );
}

function SectionProfil({ icon: Icon, titre, children }) {
  return (
      <section className="border-b border-[#EBEBEB] py-6 last:border-b-0">
        <div className="flex items-center gap-2">
          <Icon size={17} strokeWidth={1.7} className="text-[#717171]" />
          <Libelle>{titre}</Libelle>
        </div>
        {children}
      </section>
  );
}

export default function Profil() {
  const { t, lang } = useI18n();
  const { logout } = useAuth();

  const [me, setMe] = useState(null);
  const [hist, setHist] = useState({ reservations: [] });
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const chargerProfil = useCallback(async () => {
    setLoading(true);
    setErreur("");

    try {
      const [m, h] = await Promise.all([
        getMe(),
        getHistorique(),
      ]);

      setMe(m);
      setHist(h);
    } catch (e) {
      setErreur(
          e.response?.data?.detail ||
          "Impossible de charger ton profil. Vérifie ta connexion."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerProfil();
  }, [chargerProfil]);

  if (loading) {
    return (
        <div className="min-h-screen bg-white">
          <BackHeader to="/" />
          <div className="mx-auto flex max-w-[720px] flex-col items-center px-5 pt-28">
            <RefreshCw
                size={24}
                className="animate-spin text-[#B0B0B0]"
            />
            <p className="mt-4 text-[14px] text-[#717171]">
              Chargement de ton profil…
            </p>
          </div>
        </div>
    );
  }

  if (erreur || !me) {
    return (
        <div className="min-h-screen bg-white">
          <BackHeader to="/" />
          <main className="mx-auto max-w-[560px] px-5 pt-16">
            <div className="rounded-[22px] border border-[#EBEBEB] p-6 text-center">
              <AlertCircle
                  size={30}
                  className="mx-auto text-[#B30000]"
              />
              <h1
                  className="mt-4 text-[21px] font-semibold text-[#222222]"
                  style={titreStyle}
              >
                Profil indisponible
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[#717171]">
                {erreur || "Une erreur est survenue."}
              </p>
              <button
                  type="button"
                  onClick={chargerProfil}
                  className="mt-5 h-11 rounded-full bg-[#222222] px-6 text-[14px] font-medium text-white"
              >
                Réessayer
              </button>
            </div>
          </main>
        </div>
    );
  }

  const allergies = me.allergies ?? [];
  const reservations = hist.reservations ?? [];

  return (
      <div className="min-h-screen bg-white pb-[calc(40px+env(safe-area-inset-bottom))]">
        <BackHeader to="/" />

        <main className="mx-auto max-w-[720px] px-5 pt-5 sm:px-7">
          {/* En-tête du profil */}
          <section className="flex flex-col items-center border-b border-[#EBEBEB] pb-8 text-center">
            <div className="rounded-full p-1.5 ring-1 ring-[#EBEBEB]">
              <Avatar
                  nom={me.nom}
                  photo={me.photo}
                  taille={88}
              />
            </div>

            <h1
                className="mt-4 text-[27px] font-semibold tracking-tight text-[#222222] sm:text-[30px]"
                style={titreStyle}
            >
              {me.nom}
            </h1>

            <p className="mt-1 text-[15px] text-[#717171]">
              {me.classe}
            </p>

            <span className="mt-3 rounded-full bg-[#F7F7F7] px-4 py-1.5 text-[12px] font-medium tracking-wide text-[#717171]">
            {me.matricule}
          </span>
          </section>

          {/* Préférences */}
          <SectionProfil icon={Languages} titre={t("langue")}>
            <p className="mt-2 text-[13px] text-[#717171]">
              Choisis la langue de ton application.
            </p>
            <ChoixLangue />
          </SectionProfil>

          {/* Allergies */}
          <SectionProfil icon={ShieldAlert} titre={t("allergies")}>
            {allergies.length === 0 ? (
                <div className="mt-4 rounded-[16px] bg-[#F7F7F7] px-4 py-4">
                  <p className="text-[14px] font-medium text-[#222222]">
                    {t("aucune_allergie")}
                  </p>
                </div>
            ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {allergies.map((a) => (
                      <span
                          key={a}
                          className="rounded-full border border-[#FF5A5F]/30 bg-[#FFF0ED] px-3.5 py-2 text-[13px] font-medium text-[#222222]"
                      >
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </span>
                  ))}
                </div>
            )}

            <p className="mt-3 text-[12px] leading-relaxed text-[#B0B0B0]">
              Ces informations sont gérées par ton parent pour
              garantir des repas adaptés.
            </p>
          </SectionProfil>

          {/* Historique */}
          <SectionProfil icon={Clock3} titre={t("historique")}>
            {reservations.length === 0 ? (
                <div className="mt-4 rounded-[18px] bg-[#F7F7F7] px-5 py-8 text-center">
                  <Utensils
                      size={27}
                      strokeWidth={1.5}
                      className="mx-auto text-[#B0B0B0]"
                  />
                  <p className="mt-3 text-[14px] font-medium text-[#222222]">
                    {t("aucun_historique")}
                  </p>
                  <p className="mt-1 text-[12px] text-[#717171]">
                    Tes repas passés apparaîtront ici.
                  </p>
                </div>
            ) : (
                <ul className="mt-4 divide-y divide-[#EBEBEB]">
                  {reservations.map((r) => (
                      <li
                          key={r.id}
                          className="flex items-center gap-3 py-4 first:pt-1"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#F7F7F7]">
                          <Utensils
                              size={19}
                              strokeWidth={1.5}
                              className="text-[#717171]"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-[#B0B0B0]">
                            {dateCourte(r.date, lang)}
                          </p>

                          <p className="mt-1 truncate text-[14px] font-semibold text-[#222222]">
                            {r.plat_nom}
                          </p>

                          <p className="mt-1 text-[12px] text-[#717171]">
                            {tiersEnFraction(r.tiers)}
                            {" · "}
                            {fcfa(r.prix)}
                          </p>
                        </div>

                        {r.statut === "annulee" && (
                            <span className="shrink-0 rounded-full bg-[#FFF1F1] px-2.5 py-1 text-[11px] font-medium text-[#B30000]">
                      Annulée
                    </span>
                        )}
                      </li>
                  ))}
                </ul>
            )}
          </SectionProfil>

          {/* Déconnexion */}
          <section className="pt-6">
            <button
                type="button"
                onClick={logout}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-[#EBEBEB] text-[14px] font-medium text-[#B30000] transition-colors hover:bg-[#FFF1F1]"
            >
              <LogOut size={17} />
              Se déconnecter
            </button>

            <p className="mt-4 text-center text-[11px] text-[#B0B0B0]">
              Cantine Vatel
            </p>
          </section>
        </main>
      </div>
  );
}
