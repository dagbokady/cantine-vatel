import { NavLink } from "react-router-dom";
import { Home, User } from "lucide-react";
import { useI18n } from "../utils/i18n";

export default function BottomNav() {
  const { t } = useI18n();

  const item = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${
      isActive ? "text-[#17171c]" : "text-[#93939f]"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t border-[#f2f2f2] bg-white pb-[env(safe-area-inset-bottom)]"
      style={{ height: "64px" }}
    >
      <NavLink to="/" end className={item}>
        <Home size={22} strokeWidth={1.75} />
        <span>{t("accueil")}</span>
      </NavLink>
      <NavLink to="/profil" className={item}>
        <User size={22} strokeWidth={1.75} />
        <span>{t("profil")}</span>
      </NavLink>
    </nav>
  );
}
