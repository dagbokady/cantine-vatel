import { useNavigate } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { Avatar } from "../ui";
import { titreStyle } from "../../utils/tokens";

const MESSAGES = {
  vide: ["Le menu du jour n'est pas encore prêt", "Reviens un peu plus tard."],
  fermees: ["Les commandes ouvrent ce soir", "Les commandes ouvrent la veille au soir."],
  epuise: ["Toutes les portions ont été réservées", "Reviens un peu plus tard."],
};

function IconeAssiette() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-[1.5px] border-[#EBEBEB]"
    >
      <UtensilsCrossed size={52} strokeWidth={1.25} color="#EBEBEB" />
    </span>
  );
}

export default function EcranPatientez({ me, raison }) {
  const navigate = useNavigate();
  const [titre, sous] = MESSAGES[raison] || MESSAGES.vide;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
      <button
        type="button"
        onClick={() => navigate("/profil")}
        aria-label="Profil"
        className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center"
      >
        <Avatar nom={me.nom} photo={me.photo} />
      </button>

      <IconeAssiette />
      <h1 className="mt-6 text-[24px] font-medium text-[#222222]" style={titreStyle}>
        {titre}
      </h1>
      <p className="mt-2 text-[15px] text-[#717171]">{sous}</p>
    </div>
  );
}
