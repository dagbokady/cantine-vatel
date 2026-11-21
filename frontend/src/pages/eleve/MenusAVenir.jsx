import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, UtensilsCrossed } from "lucide-react";
import { getMenus } from "../../api/eleve";
import { BackHeader } from "../../components/ui";
import { decouperNomPlat, fcfa } from "../../utils/format";
import { libelleJour } from "../../utils/jour";
import { titreStyle } from "../../utils/tokens";

const premiereMaj = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function Plat({ o }) {
  const { nom, mention } = decouperNomPlat(o.nom);
  return (
    <li className="flex items-center gap-4 py-3">
      {o.photo ? (
        <img src={o.photo} alt="" className="h-16 w-16 shrink-0 rounded-[22px] object-cover" />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#F7F7F7] text-[#B0B0B0]">
          <UtensilsCrossed size={22} strokeWidth={1.5} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium text-[#222222]">{nom}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[14px] text-[#717171]">
          {fcfa(o.prix)}
          {mention && <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[12px]">{mention}</span>}
        </p>
      </div>
    </li>
  );
}

// Menus communiqués à l'avance : on consulte, la commande suit les règles d'ouverture.
export default function MenusAVenir() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let actif = true;
    getMenus()
      .then((m) => actif && setMenus(m))
      .catch((e) => actif && setErreur(e.response?.data?.detail || "Impossible de charger les menus."));
    return () => { actif = false; };
  }, []);

  return (
    <div className="min-h-screen bg-white pb-16">
      <BackHeader titre="Menus à venir" to="/" />
      <main className="mx-auto max-w-[560px] px-5 pt-3">
        <p className="text-[15px] text-[#717171]">Seuls les plats compatibles avec tes allergies sont affichés.</p>
        {erreur && <p role="alert" className="mt-5 rounded-[14px] bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#B30000]">{erreur}</p>}
        {!menus && !erreur && (
          <div className="mt-6 space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-[22px] bg-[#F7F7F7]" />)}
          </div>
        )}
        {menus?.length === 0 && (
          <p className="mt-6 rounded-[22px] bg-[#F7F7F7] p-6 text-[15px] text-[#717171]">Aucun menu publié pour les prochains jours.</p>
        )}
        {menus?.map((m) => (
          <section key={m.date} className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-[24px] font-semibold text-[#222222]" style={titreStyle}>{premiereMaj(libelleJour(m.date))}</h2>
              {m.commandable && (
                <button type="button" onClick={() => navigate("/reservation")}
                  className="h-10 shrink-0 rounded-full bg-[#222222] px-4 text-[14px] font-medium text-white">
                  Commander
                </button>
              )}
            </div>
            {m.compatibles.length > 0 ? (
              <ul className="mt-2 divide-y divide-[#EBEBEB]">{m.compatibles.map((o) => <Plat key={o.menu_jour_id} o={o} />)}</ul>
            ) : (
              <p className="mt-3 text-[14px] text-[#717171]">Aucun plat compatible ce jour-là.</p>
            )}
            {m.incompatibles.length > 0 && (
              <p className="mt-2 flex items-center gap-2 text-[13px] text-[#B30000]">
                <ShieldAlert size={14} aria-hidden="true" />
                {m.incompatibles.length} plat{m.incompatibles.length > 1 ? "s" : ""} masqué{m.incompatibles.length > 1 ? "s" : ""} : allergène déclaré
              </p>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
