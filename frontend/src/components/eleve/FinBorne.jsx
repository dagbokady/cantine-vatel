import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useReservation } from "../../hooks/useReservation";

const DUREE = 30;

// Borne de l'école : la session se ferme seule après la commande, pour l'élève suivant.
export default function FinBorne() {
  const { reset } = useReservation();
  const navigate = useNavigate();
  const [reste, setReste] = useState(DUREE);

  const terminer = useCallback(() => {
    reset();
    // La page /borne ferme elle-même la session : appareil partagé.
    navigate("/borne", { replace: true });
  }, [navigate, reset]);

  useEffect(() => {
    const t = setInterval(() => setReste((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (reste <= 0) terminer(); }, [reste, terminer]);

  return (
    <div role="status" className="mt-5 flex items-center gap-3 rounded-[22px] border border-[#EBEBEB] p-4">
      <p className="min-w-0 flex-1 text-[14px] text-[#717171]">
        Borne de l'école : déconnexion automatique dans <span className="font-semibold tabular-nums text-[#222222]">{Math.max(reste, 0)} s</span>.
      </p>
      <button type="button" onClick={terminer}
        className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#222222] px-5 text-[15px] font-medium text-white">
        <LogOut size={17} aria-hidden="true" /> Terminer
      </button>
    </div>
  );
}
