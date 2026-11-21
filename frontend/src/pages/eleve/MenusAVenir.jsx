
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShieldAlert,
    UtensilsCrossed,
    CalendarDays,
    ArrowRight,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

import { getMenus } from "../../api/eleve";
import { BackHeader } from "../../components/ui";
import { decouperNomPlat, fcfa } from "../../utils/format";
import { libelleJour } from "../../utils/jour";
import { titreStyle } from "../../utils/tokens";

const premiereMaj = (texte) =>
    texte.charAt(0).toUpperCase() + texte.slice(1);

function Plat({ o }) {
    const { nom, mention } = decouperNomPlat(o.nom);

    return (
        <li className="flex items-center gap-3 py-4">
            {o.photo ? (
                <img
                    src={o.photo}
                    alt=""
                    loading="lazy"
                    className="h-[68px] w-[68px] shrink-0 rounded-[16px] object-cover"
                />
            ) : (
                <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[16px] bg-[#F7F7F7] text-[#B0B0B0]">
                    <UtensilsCrossed size={23} strokeWidth={1.5} />
                </div>
            )}

            <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug text-[#222222]">
                    {nom}
                </p>

                {mention && (
                    <span className="mt-1.5 inline-block rounded-full bg-[#F7F7F7] px-2.5 py-1 text-[11px] text-[#717171]">
            {mention}
          </span>
                )}

                <p className="mt-1.5 text-[14px] font-medium text-[#717171]">
                    {fcfa(o.prix)}
                </p>
            </div>
        </li>
    );
}

function CarteMenu({ menu, navigate }) {
    const compatibles = menu.compatibles ?? [];
    const incompatibles = menu.incompatibles ?? [];

    return (
        <section className="mt-9 first:mt-7">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#B0B0B0]">
                        Menu du jour
                    </p>
                    <h2
                        className="mt-1 text-[25px] font-semibold leading-tight text-[#222222] sm:text-[28px]"
                        style={titreStyle}
                    >
                        {premiereMaj(libelleJour(menu.date))}
                    </h2>
                </div>

                {menu.commandable && (
                    <button
                        type="button"
                        onClick={() => navigate("/reservation")}
                        className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#222222] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#444444]"
                    >
                        Commander
                        <ArrowRight size={15} />
                    </button>
                )}
            </div>

            <div className="mt-4">
                {compatibles.length > 0 ? (
                    <ul className="divide-y divide-[#EBEBEB]">
                        {compatibles.map((o) => (
                            <Plat key={o.menu_jour_id} o={o} />
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-[18px] bg-[#F7F7F7] px-4 py-5">
                        <p className="text-[14px] text-[#717171]">
                            Aucun plat compatible ce jour-là.
                        </p>
                    </div>
                )}
            </div>

            {incompatibles.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-[14px] bg-[#FFF1F1] px-3.5 py-3">
                    <ShieldAlert
                        size={17}
                        className="mt-0.5 shrink-0 text-[#B30000]"
                    />
                    <p className="text-[12px] leading-relaxed text-[#B30000]">
                        {incompatibles.length} plat
                        {incompatibles.length > 1 ? "s" : ""} masqué
                        {incompatibles.length > 1 ? "s" : ""} en raison d'un allergène déclaré.
                    </p>
                </div>
            )}
        </section>
    );
}

export default function MenusAVenir() {
    const navigate = useNavigate();

    const [menus, setMenus] = useState(null);
    const [erreur, setErreur] = useState("");
    const [loading, setLoading] = useState(true);

    const chargerMenus = useCallback(async () => {
        setLoading(true);
        setErreur("");

        try {
            const data = await getMenus();
            setMenus(data);
        } catch (e) {
            setErreur(
                e.response?.data?.detail ||
                "Impossible de charger les menus."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        chargerMenus();
    }, [chargerMenus]);

    return (
        <div className="min-h-dvh bg-white pb-16">
            <BackHeader titre="Menus à venir" to="/" />

            <main className="mx-auto max-w-[760px] px-5 pt-5 sm:px-7">
                {/* Introduction */}
                <div>
                    <div className="flex items-center gap-2 text-[#717171]">
                        <CalendarDays size={16} />
                        <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
              À découvrir
            </span>
                    </div>

                    <h1
                        className="mt-3 text-[29px] font-semibold leading-tight text-[#222222] sm:text-[34px]"
                        style={titreStyle}
                    >
                        Les prochains repas.
                    </h1>

                    <p className="mt-2 max-w-[480px] text-[14px] leading-relaxed text-[#717171]">
                        Découvre les plats prévus pour les prochains jours.
                        Seuls les plats compatibles avec tes allergies sont affichés.
                    </p>
                </div>

                {/* Chargement */}
                {loading && (
                    <div className="mt-8 space-y-7" aria-busy="true">
                        {[0, 1, 2].map((i) => (
                            <div key={i}>
                                <div className="mb-4 h-7 w-40 animate-pulse rounded-lg bg-[#F7F7F7]" />
                                {[0, 1].map((j) => (
                                    <div
                                        key={j}
                                        className="mb-3 flex items-center gap-3"
                                    >
                                        <div className="h-[68px] w-[68px] animate-pulse rounded-[16px] bg-[#F7F7F7]" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 animate-pulse rounded bg-[#F7F7F7]" />
                                            <div className="h-3 w-1/3 animate-pulse rounded bg-[#F7F7F7]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Erreur */}
                {!loading && erreur && (
                    <div
                        role="alert"
                        className="mt-8 rounded-[20px] border border-[#EBEBEB] p-5"
                    >
                        <AlertCircle
                            size={24}
                            className="text-[#B30000]"
                        />
                        <p className="mt-3 text-[14px] leading-relaxed text-[#717171]">
                            {erreur}
                        </p>

                        <button
                            type="button"
                            onClick={chargerMenus}
                            className="mt-4 flex h-10 items-center gap-2 rounded-full bg-[#222222] px-4 text-[13px] font-medium text-white"
                        >
                            <RefreshCw size={14} />
                            Réessayer
                        </button>
                    </div>
                )}

                {/* Aucun menu */}
                {!loading && !erreur && menus?.length === 0 && (
                    <div className="mt-8 rounded-[22px] bg-[#F7F7F7] px-5 py-10 text-center">
                        <CalendarDays
                            size={30}
                            strokeWidth={1.5}
                            className="mx-auto text-[#B0B0B0]"
                        />
                        <h2
                            className="mt-4 text-[18px] font-semibold text-[#222222]"
                            style={titreStyle}
                        >
                            Pas encore de menu
                        </h2>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#717171]">
                            Aucun menu n'a été publié pour les prochains jours.
                            Reviens bientôt !
                        </p>
                    </div>
                )}

                {/* Liste des menus */}
                {!loading &&
                    !erreur &&
                    menus?.length > 0 && (
                        <div className="mt-2">
                            {menus.map((m) => (
                                <CarteMenu
                                    key={m.date}
                                    menu={m}
                                    navigate={navigate}
                                />
                            ))}
                        </div>
                    )}
            </main>
        </div>
    );
}
