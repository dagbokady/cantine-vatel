import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { getMenuDuJour } from "../../api/eleve";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { decouperNomPlat, fcfa } from "../../utils/format";
import { BackHeader, BottomCTA, SelectCard } from "../../components/ui";
import { titreStyle } from "../../utils/tokens";
import { libelleJour } from "../../utils/jour";

const LIBELLE_TYPE = {
  principal: "Plat du jour",
  sans_allergene: "Sans allergène",
  accompagnement: "Accompagnement",
};

function OptionCarte({ option, actif, onClick }) {
  const { nom, mention } = decouperNomPlat(option.nom);
  return (
    <SelectCard actif={actif} onClick={onClick} pad={10}>
      <div className="flex items-center gap-3.5 pr-8">
        {option.photo ? (
          <img src={option.photo} alt="" className="h-16 w-16 shrink-0 rounded-[14px] object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] bg-[#FFF0ED] text-[#FF5A5F]">
            <UtensilsCrossed size={22} strokeWidth={1.75} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-[#717171]">{LIBELLE_TYPE[option.type] || "Plat"}</p>
          <p className="truncate text-[16px] font-medium text-[#222222]">{nom}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-[#222222]">{fcfa(option.prix)}</span>
            {mention && (
              <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[12px] text-[#717171]">{mention}</span>
            )}
          </div>
        </div>
      </div>
    </SelectCard>
  );
}

export default function Reservation() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { etat, choisirPlat } = useReservation();
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getMenuDuJour()
      .then((m) => alive && setMenu(m))
      .catch((e) =>
        alive && setError(e.response?.data?.detail || "Impossible de charger."),
      );
    return () => {
      alive = false;
    };
  }, []);

  // Les options incompatibles avec les allergies ne sont jamais affichées.
  const options = menu ? menu.compatibles.filter((o) => o.stock_restant >= 3) : [];
  const plats = options.filter((o) => o.type !== "accompagnement");
  const accompagnements = options.filter((o) => o.type === "accompagnement");
  const photo = (menu?.compatibles.find((o) => o.type === "principal") || plats[0])?.photo;
  const choix = etat.plat;

  const carte = (o) => (
    <li key={o.menu_jour_id}>
      <OptionCarte
        option={o}
        actif={choix?.menu_jour_id === o.menu_jour_id}
        onClick={() => choisirPlat({ ...o, date: menu.date, vague_ouverte: menu.vague_ouverte, heure_recreation: menu.heure_recreation })}
      />
    </li>
  );

  return (
    <div className="min-h-screen bg-white pb-32">
      <BackHeader titre="Choisis ton repas" etape={1} to="/" />

      <main className="mx-auto max-w-[560px] px-5 pt-5">
        <div className="relative overflow-hidden rounded-[22px] bg-[#F7F7F7]" style={{ aspectRatio: "16/11" }}>
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <UtensilsCrossed size={48} strokeWidth={1.25} className="text-[#B0B0B0]" />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[#222222] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            Au menu {menu ? libelleJour(menu.date) : ""}
          </span>
        </div>

        {error && (
          <p className="mt-5 rounded-[14px] bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#B30000]">{error}</p>
        )}
        {!menu && !error && <p className="mt-5 text-[14px] text-[#B0B0B0]">Chargement…</p>}
        {menu && options.length === 0 && !error && (
          <p className="mt-5 text-[15px] text-[#717171]">Aucun plat disponible pour le moment.</p>
        )}

        {plats.length > 0 && (
          <>
            <h2 className="mt-7 text-[18px] font-semibold text-[#222222]" style={titreStyle}>Plats</h2>
            <ul className="mt-3 space-y-3">{plats.map(carte)}</ul>
          </>
        )}

        {accompagnements.length > 0 && (
          <>
            <h2 className="mt-7 text-[18px] font-semibold text-[#222222]" style={titreStyle}>Ou juste un accompagnement</h2>
            <ul className="mt-3 space-y-3">{accompagnements.map(carte)}</ul>
          </>
        )}
      </main>

      <BottomCTA
        disabled={!choix}
        onClick={() => navigate("/reservation/quantite")}
        aside={
          choix ? (
            <>
              <p className="text-[12px] text-[#717171]">Ton choix</p>
              <p className="truncate text-[16px] font-semibold text-[#222222]" style={titreStyle}>
                {decouperNomPlat(choix.nom).nom}
              </p>
            </>
          ) : (
            <p className="text-[14px] leading-snug text-[#717171]">Choisis un plat</p>
          )
        }
      >
        {t("suivant")}
      </BottomCTA>
    </div>
  );
}
