import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { titreStyle } from "../utils/tokens";
import { ROLE_LIBELLE } from "../utils/roles";

// Mise en page des espaces parent / personnel : en-tête éditorial blanc, onglets soulignés corail.
export default function EspaceLayout({ titre, surTitre, onglets = [], children, large = false, action }) {
  const { user, logout } = useAuth();
  const largeur = large ? "max-w-[1100px]" : "max-w-[720px]";
  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <header className="sticky top-0 z-20 border-b border-[#EBEBEB] bg-white/95 backdrop-blur">
        <div className={`mx-auto flex h-14 items-center justify-between gap-3 px-5 pt-[env(safe-area-inset-top)] ${largeur}`}>
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF5A5F]" />
            <span className="text-[15px] font-semibold tracking-[-0.01em]" style={titreStyle}>Cantine Vatel</span>
            {user?.role && ROLE_LIBELLE[user.role] && (
              <span className="truncate rounded-full bg-[#F7F7F7] px-2.5 py-1 text-[12px] text-[#717171]">
                {ROLE_LIBELLE[user.role]}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Se déconnecter"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-[14px] text-[#717171] transition-colors hover:bg-[#F7F7F7] hover:text-[#222222]"
          >
            <LogOut size={17} strokeWidth={1.75} />
            <span className="hidden sm:inline">Se déconnecter</span>
          </button>
        </div>
        {onglets.length > 0 && (
          <nav className={`mx-auto -mb-px flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] ${largeur}`}>
            {onglets.map((o) => (
              <NavLink
                key={o.to}
                to={o.to}
                end={o.end}
                className={({ isActive }) =>
                  `flex h-11 shrink-0 items-center border-b-2 text-[14px] transition-colors ${
                    isActive ? "border-[#FF5A5F] font-medium text-[#222222]" : "border-transparent text-[#717171] hover:text-[#222222]"
                  }`
                }
              >
                {o.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className={`mx-auto px-5 pb-[calc(40px+env(safe-area-inset-bottom))] pt-7 ${largeur}`}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-[#717171]">{surTitre ?? `Bonjour ${user?.nom?.split(" ")[0] ?? ""}`}</p>
            <h1 className="mt-1 text-[32px] font-semibold leading-none sm:text-[40px]" style={titreStyle}>{titre}</h1>
          </div>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}

export function Champ({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-[#222222]">{label}</span>
      <input
        {...props}
        className="mt-1.5 h-12 w-full rounded-[12px] border border-[#EBEBEB] bg-white px-4 text-[16px] text-[#222222] outline-none transition-colors placeholder:text-[#B0B0B0] focus:border-[#222222]"
      />
    </label>
  );
}

// "vert" est conservé comme alias historique : il rend désormais le corail signature.
export function Bouton({ children, variante = "noir", className = "", ...props }) {
  const styles = {
    noir: "bg-[#222222] text-white hover:bg-black",
    vert: "bg-[#FF5A5F] text-white hover:bg-[#E94E53]",
    corail: "bg-[#FF5A5F] text-white hover:bg-[#E94E53]",
    doux: "bg-[#F7F7F7] text-[#222222] hover:bg-[#EBEBEB]",
    contour: "border border-[#222222] bg-white text-[#222222]",
    danger: "bg-white border border-[#B30000] text-[#B30000]",
  };
  return (
    <button
      type="button"
      {...props}
      className={`h-12 rounded-full px-6 text-[15px] font-medium transition-colors disabled:border-transparent disabled:bg-[#EBEBEB] disabled:text-[#B0B0B0] ${styles[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Alerte({ children, ok = false }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={`rounded-[14px] px-4 py-3 text-[14px] ${ok ? "bg-[#FFF0ED] text-[#222222]" : "bg-[#FFF0ED] text-[#B30000]"}`}
    >
      {children}
    </p>
  );
}

export function Carte({ children, className = "" }) {
  return <div className={`rounded-[22px] border border-[#EBEBEB] bg-white p-5 ${className}`}>{children}</div>;
}
