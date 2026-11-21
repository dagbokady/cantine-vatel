import { RefreshCw } from "lucide-react";
import { mettreAJour } from "./etat";
import usePwa from "./usePwa";

// Nouvelle version téléchargée : l'utilisateur choisit le moment du rechargement.
export default function MiseAJour() {
  const { majDisponible } = usePwa();
  if (!majDisponible) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-[440px] items-center gap-3 rounded-[22px] bg-[#222222] p-3 pl-5 text-white shadow-[0_12px_40px_rgba(34,34,34,0.28)]">
      <p className="min-w-0 flex-1 text-[14px]">Une nouvelle version de Cantine Vatel est prête.</p>
      <button type="button" onClick={mettreAJour}
        className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[#FF5A5F] px-4 text-[14px] font-semibold">
        <RefreshCw size={16} aria-hidden="true" /> Mettre à jour
      </button>
    </div>
  );
}
