
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, ChevronRight } from "lucide-react";
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
};

function OptionCarte({ option, actif, onClick }) {
    const { nom, mention } = decouperNomPlat(option.nom);

    return (
        <SelectCard actif={actif} onClick={onClick} pad={10}>
            <div className="flex items-center gap-3.5">
                {option.photo ? (
                    <img
                        src={option.photo}
                        alt=""
                        loading="lazy"
                        className="h-[88px] w-[88px] shrink-0 rounded-[16px] object-cover"
                    />
                ) : (
                    <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[16px] bg-[#FFF0ED] text-[#FF5A5F]">
                        <UtensilsCrossed size={25} strokeWidth={1.5} />
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#717171]">
                        {LIBELLE_TYPE[option.type] || "Plat"}
                    </p>

                    <p className="mt-1 text-[15px] font-semibold leading-snug text-[#222222]">
                        {nom}
                    </p>

                    {mention && (
                        <p className="mt-1 text-[12px] text-[#717171]">
                            {mention}
                        </p>
                    )}

                    {option.elements?.some((e) => !e.obligatoire) && (
                        <p className="mt-1 text-[12px] text-[#FF5A5F]">
                            Personnalisable
                        </p>
                    )}

                    <p className="mt-2 text-[15px] font-semibold text-[#222222]">
                        {fcfa(option.prix)}
                    </p>
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
    const [chargement, setChargement] = useState(true);

    useEffect(() => {
        let alive = true;

        getMenuDuJour()
            .then((m) => {
                if (alive) setMenu(m);
            })
            .catch((e) => {
                if (alive) {
                    setError(
                        e.response?.data?.detail || "Impossible de charger le menu."
                    );
                }
            })
            .finally(() => {
                if (alive) setChargement(false);
            });

        return () => {
            alive = false;
        };
    }, []);

    // Les options incompatibles avec les allergies ne sont jamais affichées.
    const compatibles = menu?.compatibles ?? [];
    const options = compatibles.filter((o) => o.stock_restant >= 3);

    // Les accompagnements se choisissent dans la composition du plat, jamais seuls.
    const plats = options.filter((o) => o.type !== "accompagnement");

    const photo =
        compatibles.find((o) => o.type === "principal")?.photo ||
        plats[0]?.photo;

    const choix = etat.plat;

    const selectionner = (o) => {
        choisirPlat({
            ...o,
            date: menu.date,
            vague_ouverte: menu.vague_ouverte,
            heure_recreation: menu.heure_recreation,
        });
    };

    const carte = (o) => (
        <li key={o.menu_jour_id}>
            <OptionCarte
                option={o}
                actif={choix?.menu_jour_id === o.menu_jour_id}
                onClick={() => selectionner(o)}
            />
        </li>
    );

    return (
        <div className="min-h-dvh bg-white pb-[calc(var(--cta-h,150px)+24px)]">
            <BackHeader titre="Choisis ton repas" etape={1} to="/" />

            <main className="mx-auto max-w-[720px] px-5 pt-5 sm:px-7">
                {/* Introduction */}
                <div className="mb-6">
                    <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#717171]">
                        {menu ? `MENU ${libelleJour(menu.date)}` : "MENU DU JOUR"}
                    </p>

                    <h1
                        className="mt-2 text-[28px] font-semibold leading-tight text-[#222222] sm:text-[34px]"
                        style={titreStyle}
                    >
                        Qu'est-ce qui te ferait plaisir ?
                    </h1>

                    <p className="mt-2 text-[14px] leading-relaxed text-[#717171]">
                        Choisis ce que tu souhaites manger aujourd'hui.
                    </p>
                </div>

                {/* Image du menu */}
                <div className="relative mb-8 overflow-hidden rounded-[24px] bg-[#F7F7F7]">
                    <div className="aspect-[16/10] sm:aspect-[16/9]">
                        {photo ? (
                            <img
                                src={photo}
                                alt="Repas du jour"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#B0B0B0]">
                                <UtensilsCrossed size={48} strokeWidth={1.25} />
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-3 left-3">
            <span className="rounded-full bg-white px-3 py-2 text-[12px] font-medium text-[#222222] shadow-sm">
              {menu ? `Au menu ${libelleJour(menu.date)}` : "Cantine Vatel"}
            </span>
                    </div>
                </div>

                {/* Erreur */}
                {error && (
                    <div className="mb-5 rounded-[16px] bg-[#FFF1F1] p-4 text-[14px] text-[#B30000]">
                        {error}
                    </div>
                )}

                {/* Chargement */}
                {chargement && (
                    <div className="space-y-3">
                        <div className="h-5 w-36 animate-pulse rounded bg-[#F7F7F7]" />
                        <div className="h-[108px] animate-pulse rounded-[20px] bg-[#F7F7F7]" />
                        <div className="h-[108px] animate-pulse rounded-[20px] bg-[#F7F7F7]" />
                    </div>
                )}

                {/* Menu vide */}
                {!chargement && !error && plats.length === 0 && (
                    <div className="rounded-[20px] border border-[#EBEBEB] px-5 py-8 text-center">
                        <UtensilsCrossed
                            size={30}
                            strokeWidth={1.5}
                            className="mx-auto text-[#B0B0B0]"
                        />

                        <p className="mt-3 font-medium text-[#222222]">
                            Aucun plat disponible
                        </p>

                        <p className="mt-1 text-[14px] text-[#717171]">
                            Il n'y a pas de repas disponible à réserver pour le moment.
                        </p>
                    </div>
                )}

                {/* Plats */}
                {plats.length > 0 && (
                    <section className="mb-8">
                        <div className="mb-3 flex items-end justify-between">
                            <div>
                                <h2
                                    className="text-[20px] font-semibold text-[#222222]"
                                    style={titreStyle}
                                >
                                    Les plats
                                </h2>

                                <p className="mt-1 text-[13px] text-[#717171]">
                                    {plats.length} choix disponible{plats.length > 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>

                        <ul className="space-y-3">{plats.map(carte)}</ul>
                    </section>
                )}

            </main>

            {/* Barre de sélection */}
            <BottomCTA
                disabled={!choix}
                onClick={() => navigate("/reservation/composition")}
                aside={
                    choix ? (
                        <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wide text-[#717171]">
                                Ton choix
                            </p>

                            <p
                                className="truncate text-[15px] font-semibold text-[#222222]"
                                style={titreStyle}
                            >
                                {decouperNomPlat(choix.nom).nom}
                            </p>
                        </div>
                    ) : (
                        <p className="text-[14px] text-[#717171]">
                            Sélectionne un repas
                        </p>
                    )
                }
            >
        <span className="flex items-center justify-center gap-2">
          {t("suivant")}
            <ChevronRight size={18} />
        </span>
            </BottomCTA>
        </div>
    );
}
