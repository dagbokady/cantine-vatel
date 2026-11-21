import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { rattacherEnfant, verifierMatricule } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte, Champ } from "../../components/EspaceLayout";
import { ONGLETS_PARENT } from "./onglets";

export default function AjouterEnfant() {
  const navigate = useNavigate();
  const [matricule, setMatricule] = useState("");
  const [trouve, setTrouve] = useState(null);
  const [erreur, setErreur] = useState("");

  const chercher = async (e) => {
    e.preventDefault();
    setErreur("");
    try {
      setTrouve(await verifierMatricule(matricule.trim().toUpperCase()));
    } catch (err) {
      setErreur(err.response?.data?.detail || "Matricule introuvable.");
    }
  };

  const confirmer = async () => {
    try {
      const e = await rattacherEnfant(matricule.trim().toUpperCase());
      navigate(`/parent/enfant/${e.id}`, { replace: true });
    } catch (err) {
      setErreur(err.response?.data?.detail || "Rattachement impossible.");
    }
  };

  return (
    <EspaceLayout titre="Ajouter un enfant" onglets={ONGLETS_PARENT}>
      <form onSubmit={chercher} className="space-y-3">
        <Champ label="Matricule de l'enfant" value={matricule} placeholder="LYC-2026-002"
          onChange={(e) => { setMatricule(e.target.value.toUpperCase()); setTrouve(null); }} />
        {!trouve && <Bouton type="submit" className="w-full" disabled={matricule.trim().length < 3}>Rechercher</Bouton>}
      </form>
      {trouve && (
        <Carte className="mt-4">
          <p className="text-[14px] text-[#616161]">Est-ce bien ton enfant ?</p>
          <p className="mt-1 text-[18px] font-medium text-[#212121]">{trouve.nom}</p>
          <p className="text-[15px] text-[#616161]">{trouve.classe}</p>
          <div className="mt-4 flex gap-2">
            <Bouton variante="vert" className="flex-1" onClick={confirmer}>Oui, rattacher</Bouton>
            <Bouton variante="doux" className="flex-1" onClick={() => setTrouve(null)}>Non</Bouton>
          </div>
        </Carte>
      )}
      <div className="mt-4"><Alerte>{erreur}</Alerte></div>
    </EspaceLayout>
  );
}
