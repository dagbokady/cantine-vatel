
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  UserRound,
  Mail,
  LockKeyhole,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { ACCUEIL_ROLE } from "../../utils/roles";
import { titreStyle } from "../../utils/tokens";
import { APP_LOGO, APP_NAME } from "../../config/app";
import { Alerte, Bouton, Champ } from "../../components/EspaceLayout";

export default function Connexion() {
  const { loginUser, inscrireParent } = useAuth();
  const navigate = useNavigate();
  const info = useLocation().state?.message;

  const [inscription, setInscription] = useState(false);
  const [f, setF] = useState({
    nom: "",
    identifiant: "",
    mdp: "",
  });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const maj = (k) => (e) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    setErreur("");
  };

  async function valider(e) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);

    try {
      const data = inscription
          ? await inscrireParent(f.nom.trim(), f.identifiant.trim(), f.mdp)
          : await loginUser(f.identifiant.trim(), f.mdp);

      navigate(ACCUEIL_ROLE[data.role] || "/", { replace: true });
    } catch (err) {
      const d = err.response?.data?.detail;

      setErreur(
          typeof d === "string"
              ? d
              : inscription
                  ? "Vérifie les champs. Le mot de passe doit contenir au moins 6 caractères."
                  : "Adresse e-mail ou mot de passe incorrect."
      );
    } finally {
      setEnvoi(false);
    }
  }

  function changerMode() {
    setInscription((v) => !v);
    setErreur("");
  }

  return (
      <main className="min-h-dvh bg-white lg:grid lg:grid-cols-2">

        {/* PANNEAU VISUEL DESKTOP */}
        <section className="relative hidden min-h-dvh overflow-hidden bg-[#FFF0ED] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">

          <div className="relative z-10 flex items-center gap-3">
            <img src={APP_LOGO} alt="" className="h-11 w-11" />
            <span className="text-xl font-semibold text-[#222222]">
            {APP_NAME}
          </span>
          </div>

          <div className="relative z-10 max-w-lg">
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#FF5A5F]">
            Espace professionnel
          </span>

            <h2
                className="mt-7 text-5xl font-semibold leading-[1.12] tracking-tight text-[#222222] xl:text-6xl"
                style={titreStyle}
            >
              Une cantine
              <br />
              mieux organisée.
            </h2>

            <p className="mt-6 max-w-md text-lg leading-8 text-[#717171]">
              Retrouvez tous vos outils pour accompagner les élèves,
              suivre les repas et simplifier la gestion quotidienne.
            </p>

            <div className="mt-12 rounded-[28px] bg-white p-7 shadow-xl shadow-[#222222]/5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0ED] text-[#FF5A5F]">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="font-semibold text-[#222222]">
                    Un espace sécurisé
                  </p>
                  <p className="mt-1 text-sm text-[#717171]">
                    Vos informations restent protégées.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-[#717171]">
            © 2026 {APP_NAME} · Tous droits réservés
          </p>

          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[50px] border-white/40" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#FF5A5F]/10" />
        </section>

        {/* FORMULAIRE */}
        <section className="flex min-h-dvh items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[420px]">

            {/* LOGO MOBILE */}
            <div className="mb-12 lg:hidden">
              <img src={APP_LOGO} alt="" className="mx-auto h-16 w-16" />

              <h1
                  className="mt-4 text-center text-3xl font-semibold text-[#222222]"
                  style={titreStyle}
              >
                {APP_NAME}
              </h1>
            </div>

            <div className="mb-9">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5A5F]">
              {inscription ? "Nouvel espace parent" : "Espace parents & personnel"}
            </span>

              <h1
                  className="mt-3 text-3xl font-semibold tracking-tight text-[#222222] sm:text-4xl"
                  style={titreStyle}
              >
                {inscription ? "Bienvenue !" : "Ravi de vous revoir."}
              </h1>

              <p className="mt-3 text-[15px] leading-6 text-[#717171]">
                {inscription
                    ? "Créez votre compte pour suivre les repas et accompagner vos enfants."
                    : "Connectez-vous pour accéder à votre espace personnel."}
              </p>
            </div>

            <form onSubmit={valider} className="space-y-5">

              {inscription && (
                  <div>
                    <Champ
                        label="Nom complet"
                        value={f.nom}
                        onChange={maj("nom")}
                        autoComplete="name"
                        placeholder="Votre nom et prénom"
                    />
                  </div>
              )}

              <div>
                <Champ
                    label="Adresse e-mail"
                    type="email"
                    value={f.identifiant}
                    onChange={maj("identifiant")}
                    autoComplete="username"
                    placeholder="nom@exemple.ci"
                />
              </div>

              <div>
                <Champ
                    label="Mot de passe"
                    type="password"
                    value={f.mdp}
                    onChange={maj("mdp")}
                    autoComplete={inscription ? "new-password" : "current-password"}
                    placeholder="Votre mot de passe"
                />

                {inscription ? (
                    <p className="mt-2 text-xs text-[#B0B0B0]">
                      6 caractères minimum.
                    </p>
                ) : (
                    <Link to="/pro/mot-de-passe" className="mt-2 inline-block py-1 text-[13px] font-medium text-[#717171] underline-offset-4 hover:text-[#222222] hover:underline">
                      Mot de passe oublié ?
                    </Link>
                )}
              </div>

              {info && !erreur && (
                  <p role="status" className="rounded-2xl bg-[#F7F7F7] p-4 text-sm text-[#222222]">{info}</p>
              )}

              {erreur && (
                  <div className="flex items-start gap-3 rounded-2xl border border-[#B30000]/10 bg-[#FFF0ED] p-4 text-sm text-[#B30000]">
                    <AlertCircle size={19} className="mt-0.5 shrink-0" />
                    <p>{erreur}</p>
                  </div>
              )}

              <Bouton
                  type="submit"
                  className="group mt-3 flex h-[54px] w-full items-center justify-center gap-3 rounded-full"
                  disabled={
                      envoi ||
                      !f.identifiant.trim() ||
                      !f.mdp ||
                      (inscription && !f.nom.trim())
                  }
              >
                {envoi
                    ? "Veuillez patienter..."
                    : inscription
                        ? "Créer mon compte"
                        : "Se connecter"}

                {!envoi && <ArrowRight size={19} />}
              </Bouton>

              <button
                  type="button"
                  onClick={changerMode}
                  className="w-full py-3 text-sm font-medium text-[#717171] transition-colors hover:text-[#FF5A5F]"
              >
                {inscription
                    ? "J'ai déjà un compte ? Me connecter"
                    : "Parent ? Créer un compte"}
              </button>
            </form>

            <div className="my-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#EBEBEB]" />
              <span className="text-xs text-[#B0B0B0]">OU</span>
              <div className="h-px flex-1 bg-[#EBEBEB]" />
            </div>

            <Link
                to="/login"
                className="flex min-h-14 items-center justify-center gap-3 rounded-full border border-[#EBEBEB] text-sm font-medium text-[#222222] transition-all hover:border-[#222222] hover:bg-[#F7F7F7]"
            >
              <UserRound size={18} />
              Je suis élève
              <ArrowRight size={17} className="text-[#FF5A5F]" />
            </Link>

            <p className="mt-8 text-center text-xs text-[#B0B0B0]">
              Un accès sécurisé à votre espace {APP_NAME}.
            </p>
          </div>
        </section>
      </main>
  );
}
