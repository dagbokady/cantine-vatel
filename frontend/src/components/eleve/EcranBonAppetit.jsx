import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp, UtensilsCrossed } from "lucide-react";

import { noterRepas } from "../../api/eleve";
import { titreStyle } from "../../utils/tokens";

const DUREE_INTRO = 2400;

function Assiette({ photo, nom, taille }) {
  return (
      <div className="relative mx-auto" style={{ width: taille, height: taille }}>
        <span className="onde absolute inset-0 rounded-full border-2 border-[#FF5A5F]" />
        <span className="onde absolute inset-0 rounded-full border border-[#FF5A5F]" style={{ animationDelay: "500ms" }} />
        <div className="eclot relative h-full w-full overflow-hidden rounded-full bg-[#F7F7F7] ring-8 ring-white">
          {photo ? (
              <img src={photo} alt={nom} className="h-full w-full object-cover" />
          ) : (
              <div className="flex h-full items-center justify-center">
                <UtensilsCrossed size={48} strokeWidth={1.2} className="text-[#B0B0B0]" />
              </div>
          )}
        </div>
      </div>
  );
}

// Après le scan au comptoir : « Bon appétit », puis l'élève note son plat.
export default function EcranBonAppetit({ reservation, onTermine, onPlusTard }) {
  const [etape, setEtape] = useState("intro");
  const [envoi, setEnvoi] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setEtape("note"), DUREE_INTRO);
    return () => clearTimeout(id);
  }, []);

  const noter = async (avis) => {
    setEnvoi(avis);
    setErreur("");
    try {
      await noterRepas(reservation.id, avis);
      onTermine(avis);
    } catch (e) {
      setErreur(e.response?.data?.detail || "Avis non enregistré. Réessaie.");
      setEnvoi(null);
    }
  };

  const choix = (avis, Icone, label, sous) => (
      <button
          type="button"
          onClick={() => noter(avis)}
          disabled={envoi !== null}
          className={`group flex min-h-[132px] flex-col items-start justify-between rounded-[22px] border p-5 text-left transition active:scale-[0.98] disabled:opacity-60 ${
              envoi === avis ? "border-[#FF5A5F] bg-[#FFF0ED]" : "border-[#EBEBEB] bg-white hover:border-[#222222]"
          }`}
      >
        <span className={`flex h-11 w-11 items-center justify-center rounded-full ${avis === 1 ? "bg-[#FF5A5F] text-white" : "bg-[#F7F7F7] text-[#222222]"}`}>
          <Icone size={20} strokeWidth={1.8} />
        </span>
        <span>
          <span className="block text-[17px] font-semibold text-[#222222]" style={titreStyle}>{label}</span>
          <span className="mt-0.5 block text-[12px] text-[#717171]">{sous}</span>
        </span>
      </button>
  );

  return (
      <div role="dialog" aria-modal="true" aria-label="Bon appétit" className="fixed inset-0 z-50 overflow-y-auto bg-white text-[#222222]" style={{ animation: "fondu 300ms ease both" }}>
        {etape === "intro" ? (
            <button
                type="button"
                onClick={() => setEtape("note")}
                className="flex min-h-dvh w-full flex-col items-center justify-center px-6 text-center"
                aria-label="Passer à la notation"
            >
              <Assiette photo={reservation.plat_photo} nom={reservation.plat_nom} taille={196} />
              <p className="monte mt-10 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF5A5F]" style={{ animationDelay: "350ms" }}>
                Repas servi
              </p>
              <h1 className="monte mt-2 text-[46px] font-semibold leading-none sm:text-[60px]" style={{ ...titreStyle, animationDelay: "500ms" }}>
                Bon appétit
              </h1>
              <p className="monte mt-4 max-w-[260px] text-[15px] leading-6 text-[#717171]" style={{ animationDelay: "650ms" }}>
                {reservation.plat_nom}
              </p>
            </button>
        ) : (
            <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(40px+env(safe-area-inset-top))]">
              <div className="monte flex items-center gap-4">
                <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[22px] bg-[#F7F7F7]">
                  {reservation.plat_photo && <img src={reservation.plat_photo} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#717171]">Ton avis compte</p>
                  <p className="mt-1 truncate text-[15px] font-medium">{reservation.plat_nom}</p>
                </div>
              </div>

              <h1 className="monte mt-10 text-[38px] font-semibold leading-[1.05] sm:text-[44px]" style={{ ...titreStyle, animationDelay: "80ms" }}>
                Alors,<br />c'était <span className="text-[#FF5A5F]">bon</span> ?
              </h1>
              <p className="monte mt-3 text-[14px] leading-6 text-[#717171]" style={{ animationDelay: "140ms" }}>
                La cuisine lit chaque avis pour ajuster les prochains menus.
              </p>

              <div className="monte mt-8 grid grid-cols-2 gap-3" style={{ animationDelay: "200ms" }}>
                {choix(1, ThumbsUp, "J'ai aimé", "Je le reprendrais")}
                {choix(-1, ThumbsDown, "Pas trop", "À améliorer")}
              </div>

              {erreur && <p role="alert" className="mt-4 text-[14px] text-[#B30000]">{erreur}</p>}

              <button type="button" onClick={onPlusTard} className="mt-auto pt-8 text-[13px] font-medium text-[#717171] underline-offset-4 hover:underline">
                Plus tard
              </button>
            </div>
        )}
      </div>
  );
}
