import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { titreStyle } from "../utils/tokens";

// Mise en page des espaces parent / personnel : bandeau vert, onglets, contenu centré.
export default function EspaceLayout({ titre, onglets = [], children, large = false }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#003c33] px-5 pb-4 pt-[calc(16px+env(safe-area-inset-top))] text-white">
        <div className={`mx-auto flex items-center justify-between gap-3 ${large ? "max-w-[1100px]" : "max-w-[720px]"}`}>
          <div className="min-w-0">
            <p className="text-[13px] text-white/70">Cantine Vatel · {user?.nom}</p>
            <h1 className="truncate text-[24px] font-medium" style={titreStyle}>{titre}</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="min-h-12 shrink-0 px-2 text-[14px] text-white underline underline-offset-2"
          >
            Se déconnecter
          </button>
        </div>
        {onglets.length > 0 && (
          <nav className={`mx-auto mt-3 flex gap-2 overflow-x-auto ${large ? "max-w-[1100px]" : "max-w-[720px]"}`}>
            {onglets.map((o) => (
              <NavLink
                key={o.to}
                to={o.to}
                end={o.end}
                className={({ isActive }) =>
                  `flex h-10 shrink-0 items-center rounded-full px-4 text-[14px] ${
                    isActive ? "bg-white font-medium text-[#003c33]" : "bg-white/10 text-white"
                  }`
                }
              >
                {o.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className={`mx-auto px-5 pb-[calc(32px+env(safe-area-inset-bottom))] pt-6 ${large ? "max-w-[1100px]" : "max-w-[720px]"}`}>
        {children}
      </main>
    </div>
  );
}

export function Champ({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-[13px] text-[#93939f]">{label}</span>
      <input
        {...props}
        className="mt-1.5 h-12 w-full rounded-[12px] border border-[#d9d9dd] bg-white px-4 text-[16px] text-[#212121] outline-none transition-colors placeholder:text-[#93939f] focus:border-[#003c33]"
      />
    </label>
  );
}

export function Bouton({ children, variante = "noir", className = "", ...props }) {
  const styles = {
    noir: "bg-[#17171c] text-white",
    vert: "bg-[#003c33] text-white",
    doux: "bg-[#eeece7] text-[#212121]",
    danger: "bg-white border border-[#b30000] text-[#b30000]",
  };
  return (
    <button
      type="button"
      {...props}
      className={`h-12 rounded-[32px] px-6 text-[15px] font-medium transition-colors disabled:bg-[#eeece7] disabled:text-[#93939f] ${styles[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Alerte({ children, ok = false }) {
  if (!children) return null;
  return (
    <p role="alert" className={`px-4 py-3 text-[14px] ${ok ? "bg-[#eeece7] text-[#003c33]" : "bg-[#fff1f1] text-[#b30000]"}`}>
      {children}
    </p>
  );
}

export function Carte({ children, className = "" }) {
  return <div className={`rounded-[16px] border border-[#d9d9dd] p-4 ${className}`}>{children}</div>;
}
