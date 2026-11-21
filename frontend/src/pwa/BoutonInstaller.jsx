import { Download } from "lucide-react";
import { installer } from "./etat";
import usePwa from "./usePwa";

// Affiché uniquement quand le navigateur propose réellement l'installation (beforeinstallprompt).
export default function BoutonInstaller({ className = "", variante = "contour", children = "Installer l'application" }) {
  const { installable } = usePwa();
  if (!installable) return null;
  const styles = {
    contour: "border border-[#222222] bg-white text-[#222222] hover:bg-[#F7F7F7]",
    plein: "bg-[#222222] text-white hover:bg-black",
  };
  return (
    <button
      type="button"
      onClick={installer}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-medium transition-colors ${styles[variante]} ${className}`}
    >
      <Download size={17} aria-hidden="true" />
      {children}
    </button>
  );
}
