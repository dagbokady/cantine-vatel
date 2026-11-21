import { APP_LOGO, APP_NAME } from "../config/app";
import { Link } from "react-router-dom";
import { titreStyle } from "../utils/tokens";
import { estBorne } from "../utils/jour";

// Logo + nom de l'application. Le nom se masque sous `masquerNom` (ex. "hidden sm:inline").
export default function Marque({ taille = 28, className = "", classeNom = "text-[15px]", masquerNom = "" }) {
  const Racine = estBorne() ? "span" : Link;
  return (
    <Racine to="/decouvrir" aria-label={`${APP_NAME}, découvrir`} className={`flex min-w-0 items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-[#FF5A5F] ${className}`}>
      <img src={APP_LOGO} alt={APP_NAME} width={taille} height={taille} className="shrink-0" style={{ width: taille, height: taille }} />
      <span className={`truncate font-semibold tracking-[-0.01em] text-[#222222] ${classeNom} ${masquerNom}`} style={titreStyle}>
        {APP_NAME}
      </span>
    </Racine>
  );
}
