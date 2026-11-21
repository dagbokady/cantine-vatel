import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, MoreHorizontal } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { titreStyle } from "../utils/tokens";
import { ROLE_LIBELLE } from "../utils/roles";
import Marque from "./Marque";
import Panneau from "./Panneau";

// Barre de navigation fixe en bas, sous 768 px. Les onglets `mobile: false` passent dans « Plus ».
function NavigationBas({ onglets }) {
  const [plus, setPlus] = useState(false);
  const { pathname } = useLocation();
  const principaux = onglets.filter((o) => o.mobile !== false);
  const autres = onglets.filter((o) => o.mobile === false);
  const actif = (o) => (o.end ? pathname === o.to : pathname === o.to || pathname.startsWith(`${o.to}/`));
  const plusActif = autres.some(actif);
  const item = (on) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${on ? "text-[#FF5A5F]" : "text-[#717171]"}`;
  return (
    <>
      <nav aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EBEBEB] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex h-16 max-w-[560px] items-stretch">
          {principaux.map(({ to, end, court, label, icon: Icone }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => item(isActive)}>
              {({ isActive }) => (
                <>
                  <Icone size={22} strokeWidth={isActive ? 2.2 : 1.75} aria-hidden="true" />
                  <span className="max-w-full truncate px-1">{court ?? label}</span>
                </>
              )}
            </NavLink>
          ))}
          {autres.length > 0 && (
            <button type="button" onClick={() => setPlus(true)} className={item(plusActif)} aria-haspopup="dialog">
              <MoreHorizontal size={22} strokeWidth={plusActif ? 2.2 : 1.75} aria-hidden="true" />
              <span>Plus</span>
            </button>
          )}
        </div>
      </nav>
      <Panneau ouvert={plus} onClose={() => setPlus(false)} titre="Plus" surTitre="Navigation">
        <div className="divide-y divide-[#EBEBEB]">
          {autres.map(({ to, end, label, icon: Icone }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setPlus(false)}
              className={({ isActive }) => `flex h-14 items-center gap-4 text-[16px] ${isActive ? "font-medium text-[#FF5A5F]" : "text-[#222222]"}`}>
              <Icone size={20} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      </Panneau>
    </>
  );
}

// Mise en page des espaces parent / personnel : en-tête éditorial blanc, onglets soulignés corail.
export default function EspaceLayout({ titre, surTitre, onglets = [], children, large = false, action, outils }) {
  const { user, logout } = useAuth();
  const largeur = large ? "max-w-[1100px]" : "max-w-[720px]";
  // Onglets avec icônes : navigation du haut dès 768 px, barre du bas en dessous.
  const responsive = onglets.length > 0 && onglets.every((o) => o.icon);
  return (
    <div className="min-h-dvh bg-white text-[#222222]">
      <header className="sticky top-0 z-20 border-b border-[#EBEBEB] bg-white/95 backdrop-blur">
        <div className={`mx-auto flex h-14 items-center justify-between gap-3 px-5 pt-[env(safe-area-inset-top)] ${largeur}`}>
          <div className="flex min-w-0 items-center gap-2">
            <Marque taille={26} className="shrink" />
            {user?.role && ROLE_LIBELLE[user.role] && (
              <span className="truncate rounded-full bg-[#F7F7F7] px-2.5 py-1 text-[12px] text-[#717171]">
                {ROLE_LIBELLE[user.role]}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
          {outils}
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
        </div>
        {onglets.length > 0 && (
          <nav className={`mx-auto -mb-px gap-6 overflow-x-auto px-5 [scrollbar-width:none] ${responsive ? "hidden md:flex" : "flex"} ${largeur}`}>
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
      <main className={`mx-auto px-5 pt-7 ${responsive ? "pb-[calc(104px+env(safe-area-inset-bottom))] md:pb-10" : "pb-[calc(40px+env(safe-area-inset-bottom))]"} ${largeur}`}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-[#717171]">{surTitre ?? `Bonjour ${user?.nom?.split(" ")[0] ?? ""}`}</p>
            <h1 className="mt-1 text-[32px] font-semibold leading-none sm:text-[40px]" style={titreStyle}>{titre}</h1>
          </div>
          {action}
        </div>
        {children}
      </main>
      {responsive && <NavigationBas onglets={onglets} />}
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
