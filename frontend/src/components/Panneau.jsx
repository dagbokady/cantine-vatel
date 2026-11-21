import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { titreStyle } from "../utils/tokens";

// Panneau unique de l'application pour tout ajout, modification ou détail :
// feuille du bas sur téléphone, fenêtre centrée (ou panneau latéral) dès 768 px.
export default function Panneau({ ouvert, onClose, titre, surTitre, children, pied, cote = false, large = false }) {
  const id = useId();
  const ref = useRef(null);
  const fermer = useRef(onClose);
  useEffect(() => { fermer.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!ouvert) return undefined;
    const avant = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const clavier = (e) => {
      if (e.key === "Escape") fermer.current();
      if (e.key !== "Tab" || !ref.current) return;
      const f = ref.current.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const [premier, dernier] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    };
    document.addEventListener("keydown", clavier);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", clavier);
      avant?.focus?.();
    };
  }, [ouvert]);

  if (!ouvert) return null;
  const position = cote
    ? "md:inset-y-0 md:right-0 md:left-auto md:top-0 md:h-full md:max-h-none md:w-[480px] md:rounded-none md:rounded-l-[28px]"
    : `md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[86vh] md:rounded-[28px] ${large ? "md:w-[640px]" : "md:w-[480px]"}`;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#222222]/40 animate-[fondu_200ms_ease]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-[28px] bg-white outline-none shadow-[0_-12px_40px_rgba(34,34,34,0.18)] animate-[monte_260ms_cubic-bezier(0.2,0.8,0.2,1)] md:animate-[fondu_200ms_ease] ${position}`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[#EBEBEB] md:hidden" aria-hidden="true" />
        <header className="flex shrink-0 items-start justify-between gap-4 px-6 pb-3 pt-4 md:pt-6">
          <div className="min-w-0">
            {surTitre && <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#FF5A5F]">{surTitre}</p>}
            <h2 id={id} className="mt-0.5 text-[24px] font-semibold text-[#222222]" style={titreStyle}>{titre}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#222222] transition-colors hover:bg-[#F7F7F7]"
          >
            <X size={20} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">{children}</div>
        {pied && (
          <footer className="shrink-0 border-t border-[#EBEBEB] px-6 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3">{pied}</footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

// Bouton d'action standard qui ouvre un Panneau (« + Ajouter », « Modifier »).
export function BoutonAction({ children, onClick, icone: Icone, variante = "noir", className = "", label }) {
  const styles = {
    noir: "bg-[#222222] text-white hover:bg-black",
    doux: "border border-[#EBEBEB] bg-white text-[#222222] hover:border-[#222222]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-medium transition-colors ${styles[variante]} ${className}`}
    >
      {Icone && <Icone size={17} strokeWidth={2} />}
      {children}
    </button>
  );
}
