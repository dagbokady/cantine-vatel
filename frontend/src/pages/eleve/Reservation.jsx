import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { getMenuDuJour } from "../../api/eleve";
import { useReservation } from "../../hooks/useReservation";
import { useI18n } from "../../utils/i18n";
import { decouperNomPlat, fcfa } from "../../utils/format";
import { BackHeader, BottomCTA, SelectCard } from "../../components/ui";

const LIBELLE_TYPE = {
  principal: "Plat du jour",
  sans_allergene: "Sans allergène",
  accompagnement: "Accompagnement",
};

function OptionCarte({ option, actif, onClick }) {
  const { nom, mention } = decouperNomPlat(option.nom);
  return (
    <SelectCard actif={actif} onClick={onClick}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[16px] font-medium text-[#212121]">{nom}</span>
        {mention && (
          <span className="rounded-full bg-[#eeece7] px-2.5 py-0.5 text-[12px] text-[#212121]">
            {mention}
          </span>
        )}
      </div>
      <p className="mt-1 text-[14px] text-[#616161]">
        {fcfa(option.prix)} · {LIBELLE_TYPE[option.type] || "Plat"}
      </p>
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
        onClick={() => choisirPlat(o)}
      />
    </li>
  );

  return (
    <div className="min-h-screen bg-white pb-28">
      <BackHeader titre="Choisir mon repas" to="/" />

      <main className="px-5 pt-6">
        <div className="overflow-hidden rounded-[22px] bg-[#eeece7]" style={{ aspectRatio: "4/3" }}>
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <UtensilsCrossed size={48} strokeWidth={1.25} className="text-[#93939f]" />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-5 bg-[#fff1f1] px-4 py-3 text-[14px] text-[#b30000]">{error}</p>
        )}
        {!menu && !error && <p className="mt-5 text-[14px] text-[#93939f]">Chargement…</p>}
        {menu && options.length === 0 && !error && (
          <p className="mt-5 text-[15px] text-[#616161]">Aucun plat disponible pour le moment.</p>
        )}

        <ul className="mt-5 space-y-3">{plats.map(carte)}</ul>

        {accompagnements.length > 0 && (
          <>
            {plats.length > 0 && <hr className="my-5 border-0 border-t border-[#d9d9dd]" />}
            <ul className="space-y-3">{accompagnements.map(carte)}</ul>
          </>
        )}
      </main>

      <BottomCTA disabled={!choix} onClick={() => navigate("/reservation/quantite")}>
        {t("suivant")}
      </BottomCTA>
    </div>
  );
}
