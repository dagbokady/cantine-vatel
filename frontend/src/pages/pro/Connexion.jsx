import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ACCUEIL_ROLE } from "../../utils/roles";
import { titreStyle } from "../../utils/tokens";
import { Alerte, Bouton, Champ } from "../../components/EspaceLayout";

export default function Connexion() {
  const { loginUser, inscrireParent } = useAuth();
  const navigate = useNavigate();
  const [inscription, setInscription] = useState(false);
  const [f, setF] = useState({ nom: "", identifiant: "", mdp: "" });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });

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
      setErreur(typeof d === "string" ? d : inscription ? "Vérifie les champs (mot de passe : 6 caractères min.)." : "Connexion impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-white px-5 py-10">
      <form onSubmit={valider} className="mx-auto w-full max-w-[400px] space-y-4">
        <h1 className="text-center text-[32px] font-medium text-[#003c33]" style={titreStyle}>Cantine Vatel</h1>
        <p className="pb-6 text-center text-[15px] text-[#616161]">
          {inscription ? "Crée ton compte parent" : "Espace parents et personnel"}
        </p>
        {inscription && <Champ label="Nom complet" value={f.nom} onChange={maj("nom")} autoComplete="name" />}
        <Champ label="E-mail" type="email" value={f.identifiant} onChange={maj("identifiant")} autoComplete="username" placeholder="nom@exemple.ci" />
        <Champ label="Mot de passe" type="password" value={f.mdp} onChange={maj("mdp")} autoComplete={inscription ? "new-password" : "current-password"} />
        <Bouton type="submit" className="mt-2 h-[52px] w-full" disabled={envoi || !f.identifiant || !f.mdp || (inscription && !f.nom)}>
          {envoi ? "…" : inscription ? "Créer mon compte" : "Se connecter"}
        </Bouton>
        <Alerte>{erreur}</Alerte>
        <div className="flex flex-col items-center gap-1 pt-2">
          <button type="button" onClick={() => { setInscription(!inscription); setErreur(""); }} className="min-h-12 text-[13px] text-[#003c33] underline underline-offset-2">
            {inscription ? "J'ai déjà un compte" : "Parent ? Crée ton compte"}
          </button>
          <Link to="/login" className="min-h-12 py-3 text-[13px] text-[#616161] underline underline-offset-2">Je suis élève</Link>
        </div>
      </form>
    </div>
  );
}
