import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, MailCheck } from "lucide-react";

import api from "../../api/client";
import { APP_LOGO } from "../../config/app";
import { titreStyle } from "../../utils/tokens";
import { Bouton, Champ } from "../../components/EspaceLayout";

function Cadre({ surTitre, titre, texte, children }) {
  return (
      <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <Link to="/pro" className="inline-flex h-10 items-center gap-2 rounded-full pr-3 text-[14px] font-medium text-[#717171] hover:text-[#222222]">
            <ArrowLeft size={17} /> Connexion
          </Link>
          <Link to="/decouvrir" aria-label="Découvrir Cantine Vatel" className="mt-8 block w-fit rounded-full transition-transform duration-300 hover:scale-105"><img src={APP_LOGO} alt="" className="h-12 w-12" /></Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5A5F]">{surTitre}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#222222] sm:text-4xl" style={titreStyle}>{titre}</h1>
          <p className="mt-3 text-[15px] leading-6 text-[#717171]">{texte}</p>
          <div className="mt-9">{children}</div>
        </div>
      </main>
  );
}

const Erreur = ({ children }) => (
    <div role="alert" className="flex items-start gap-3 rounded-2xl bg-[#FFF0ED] p-4 text-sm text-[#B30000]">
      <AlertCircle size={19} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
);

// Demande du lien : admin, chef cuisinier, parents.
export function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function valider(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      await api.post("/auth/mot-de-passe/oubli", { identifiant: email.trim() });
      setEnvoye(true);
    } catch {
      setErreur("Envoi impossible. Vérifiez votre connexion et réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
        <Cadre surTitre="E-mail envoyé" titre="Regardez votre boîte mail."
               texte={`Si un compte existe pour ${email.trim()}, vous allez recevoir un lien valable 30 minutes. Pensez aux courriers indésirables.`}>
          <div className="flex items-center gap-4 rounded-[22px] bg-[#FFF0ED] p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#FF5A5F]"><MailCheck size={22} /></span>
            <p className="text-[14px] leading-5 text-[#222222]">Le lien ne sert qu'une fois. Vous pouvez refaire une demande dans une minute.</p>
          </div>
          <button type="button" onClick={() => setEnvoye(false)} className="mt-6 w-full py-3 text-sm font-medium text-[#717171] hover:text-[#FF5A5F]">
            Utiliser une autre adresse
          </button>
        </Cadre>
    );
  }

  return (
      <Cadre surTitre="Mot de passe oublié" titre="Pas de panique."
             texte="Saisissez l'adresse e-mail de votre compte : nous vous envoyons un lien pour en choisir un nouveau.">
        <form onSubmit={valider} className="space-y-5">
          <Champ label="Adresse e-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="username" placeholder="nom@exemple.ci" required />
          {erreur && <Erreur>{erreur}</Erreur>}
          <Bouton type="submit" className="flex h-[54px] w-full items-center justify-center gap-3 rounded-full" disabled={envoi || !email.includes("@")}>
            {envoi ? "Envoi..." : "Recevoir le lien"} {!envoi && <ArrowRight size={19} />}
          </Bouton>
        </form>
      </Cadre>
  );
}

// Choix du nouveau mot de passe depuis le lien reçu.
export function Reinitialiser() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(token ? "" : "Lien incomplet. Refaites une demande.");

  const different = confirmation && mdp !== confirmation;

  async function valider(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      await api.post("/auth/mot-de-passe/reinitialiser", { token, mot_de_passe: mdp });
      navigate("/pro", { replace: true, state: { message: "Mot de passe modifié. Connectez-vous." } });
    } catch (err) {
      const d = err.response?.data?.detail;
      setErreur(typeof d === "string" ? d : "Le mot de passe doit contenir au moins 8 caractères.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
      <Cadre surTitre="Nouveau mot de passe" titre="Choisissez-le bien."
             texte="8 caractères minimum. Évitez un mot de passe déjà utilisé ailleurs.">
        <form onSubmit={valider} className="space-y-5">
          <Champ label="Nouveau mot de passe" type="password" value={mdp} onChange={(e) => setMdp(e.target.value)}
                 autoComplete="new-password" minLength={8} required />
          <Champ label="Confirmation" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
                 autoComplete="new-password" required />
          {different && <p className="text-[13px] text-[#B30000]">Les deux mots de passe ne correspondent pas.</p>}
          {erreur && (
              <Erreur>
                {erreur} <Link to="/pro/mot-de-passe" className="font-semibold underline">Nouvelle demande</Link>
              </Erreur>
          )}
          <Bouton type="submit" className="flex h-[54px] w-full items-center justify-center rounded-full"
                  disabled={envoi || !token || mdp.length < 8 || mdp !== confirmation}>
            {envoi ? "Enregistrement..." : "Enregistrer"}
          </Bouton>
        </form>
      </Cadre>
  );
}
