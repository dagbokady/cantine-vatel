import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { rattacherEnfant, verifierMatricule } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Champ } from "../../components/EspaceLayout";
import { titreStyle } from "../../utils/tokens";
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
    <EspaceLayout titre="Ajouter un enfant" surTitre="Rattachement" onglets={ONGLETS_PARENT}>
      <div className="max-w-[440px]">
        <p className="mb-6 text-[15px] leading-relaxed text-[#717171]">Saisis le matricule indiqué sur la carte scolaire. Nous te montrerons l'élève pour confirmation.</p>
        <form onSubmit={chercher} className="space-y-4">
          <Champ label="Matricule" value={matricule} placeholder="LYC-2026-002"
            onChange={(e) => { setMatricule(e.target.value.toUpperCase()); setTrouve(null); }} />
          {!trouve && <Bouton type="submit" className="h-[52px] w-full" disabled={matricule.trim().length < 3}>Rechercher</Bouton>}
        </form>
        {trouve && (
          <div className="mt-6 rounded-[22px] bg-[#FFF0ED] p-6">
            <p className="text-[13px] text-[#717171]">Est-ce bien ton enfant ?</p>
            <p className="mt-2 text-[26px] font-semibold leading-tight" style={titreStyle}>{trouve.nom}</p>
            <p className="text-[15px] text-[#717171]">{trouve.classe}</p>
            <div className="mt-5 flex gap-2">
              <Bouton variante="corail" className="flex-1" onClick={confirmer}>Oui, rattacher</Bouton>
              <Bouton variante="contour" className="flex-1" onClick={() => setTrouve(null)}>Non</Bouton>
            </div>
          </div>
        )}
        <div className="mt-4"><Alerte>{erreur}</Alerte></div>
      </div>
    </EspaceLayout>
  );
}
