
import { useNavigate } from "react-router-dom";
import {
    CalendarDays,
    User,
    UtensilsCrossed,
    AlertCircle,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";

import { estAujourdhui, libelleJour } from "../../utils/jour";
import { formatHeure, fcfa } from "../../utils/format";
import { useI18n } from "../../utils/i18n";

export default function EcranRepasDuJour({ me, menu }) {
    const { t } = useI18n();
    const navigate = useNavigate();

    const compatibles = menu.compatibles ?? [];
    const incompatibles = menu.incompatibles ?? [];

    const peutReserver =
        menu.commandes_ouvertes &&
        compatibles.some((o) => o.stock_restant >= 3);

    // Le plat principal est mis en avant, jamais un accompagnement.
    const plat =
        compatibles.find((o) => o.type !== "accompagnement") ||
        compatibles[0] ||
        incompatibles[0];

    const autres = compatibles.filter((o) => o !== plat);

    const titre = estAujourdhui(menu.date)
        ? "Repas du jour"
        : `Repas de ${libelleJour(menu.date)}`;

    return (
        <main className="min-h-dvh bg-white text-[#222222]">
            <div className="mx-auto w-full max-w-[1120px] px-5 pb-10 sm:px-8 lg:px-10">

                {/* En-tête */}
                <header className="flex items-center justify-between border-b border-[#EBEBEB] py-5">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#717171]">
                            Mon compte
                        </p>
                        <p className="mt-1 text-[19px] font-semibold tracking-tight">
                            {fcfa(me.solde)}
                        </p>
                        <p className="text-[12px] text-[#717171]">Mon crédit</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/profil")}
                        aria-label="Accéder à mon profil"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EBEBEB] bg-white transition hover:bg-[#F7F7F7]"
                    >
                        <User size={19} strokeWidth={1.8} />
                    </button>
                </header>

                {/* Titre de la page */}
                <section className="flex flex-col gap-4 py-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FF5A5F]">
                            À la cantine aujourd'hui
                        </p>

                        <h1
                            className="text-[32px] font-semibold tracking-tight sm:text-[42px]"
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                lineHeight: 1.08,
                            }}
                        >
                            {titre}
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/menus")}
                        className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-[#EBEBEB] px-4 text-[13px] font-medium transition hover:border-[#222222]"
                    >
                        <CalendarDays size={16} />
                        Menus à venir
                        <ArrowRight size={14} />
                    </button>
                </section>

                {plat && (
                    <>
                        {/* Plat principal */}
                        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">

                            {/* Photographie */}
                            <div className="relative overflow-hidden rounded-[24px] bg-[#F7F7F7]">
                                {plat.photo ? (
                                    <img
                                        src={plat.photo}
                                        alt={plat.nom}
                                        className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
                                    />
                                ) : (
                                    <div className="flex aspect-[4/3] w-full items-center justify-center lg:aspect-[5/4]">
                                        <UtensilsCrossed
                                            size={54}
                                            strokeWidth={1.2}
                                            className="text-[#B0B0B0]"
                                        />
                                    </div>
                                )}

                                <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 text-[11px] font-semibold tracking-wide text-[#222222] backdrop-blur">
                                    AU MENU
                                </div>
                            </div>

                            {/* Informations du plat */}
                            <div className="flex flex-col py-1 lg:py-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#717171]">
                                    Notre suggestion
                                </p>

                                <h2
                                    className="mt-3 text-[27px] font-semibold tracking-tight sm:text-[34px]"
                                    style={{
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        lineHeight: 1.12,
                                    }}
                                >
                                    {plat.nom}
                                </h2>

                                <p className="mt-3 text-[20px] font-medium text-[#222222]">
                                    {fcfa(plat.prix)}
                                </p>

                                {!compatibles.length && plat.raison && (
                                    <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#FFF0ED] p-4">
                                        <AlertCircle
                                            size={18}
                                            className="mt-0.5 shrink-0 text-[#B30000]"
                                        />
                                        <p className="text-[13px] leading-5 text-[#B30000]">
                                            {plat.raison}
                                        </p>
                                    </div>
                                )}

                                {plat.ingredients?.length > 0 && (
                                    <div className="mt-7 border-t border-[#EBEBEB] pt-5">
                                        <h3 className="text-[13px] font-semibold">
                                            Ce qu'il contient
                                        </h3>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {plat.ingredients.map((ing) => (
                                                <span
                                                    key={ing}
                                                    className="rounded-full bg-[#F7F7F7] px-3 py-2 text-[12px] text-[#616161]"
                                                >
                          {ing}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex items-center gap-2 text-[12px] text-[#717171]">
                                    <CheckCircle2
                                        size={15}
                                        className="shrink-0 text-[#717171]"
                                    />
                                    Consulte les ingrédients avant de réserver.
                                </div>
                            </div>
                        </section>

                        {/* Autres plats compatibles */}
                        {autres.length > 0 && (
                            <section className="mt-12 border-t border-[#EBEBEB] pt-8">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#717171]">
                                            À découvrir
                                        </p>
                                        <h2
                                            className="mt-2 text-[23px] font-semibold"
                                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                                        >
                                            Autres options
                                        </h2>
                                    </div>

                                    <span className="text-[12px] text-[#717171]">
                    {autres.length} plat{autres.length > 1 ? "s" : ""}
                  </span>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {autres.map((o) => {
                                        const disponible = o.stock_restant >= 3;

                                        return (
                                            <article
                                                key={o.menu_jour_id}
                                                className="overflow-hidden rounded-[20px] border border-[#EBEBEB] bg-white transition hover:border-[#D0D0D0]"
                                            >
                                                <div className="flex items-center gap-4 p-3">
                                                    <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[15px] bg-[#F7F7F7]">
                                                        {o.photo ? (
                                                            <img
                                                                src={o.photo}
                                                                alt={o.nom}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <UtensilsCrossed
                                                                    size={23}
                                                                    className="text-[#B0B0B0]"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-[14px] font-semibold leading-snug">
                                                            {o.nom}
                                                        </h3>

                                                        <p className="mt-1 text-[13px] text-[#717171]">
                                                            {fcfa(o.prix)}
                                                        </p>

                                                        {!disponible && (
                                                            <p className="mt-1 text-[11px] font-medium text-[#B30000]">
                                                                Stock insuffisant
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Plats incompatibles */}
                        {incompatibles.length > 0 && (
                            <section className="mt-12 border-t border-[#EBEBEB] pt-8">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#B30000]">
                                    Attention aux allergies
                                </p>

                                <h2
                                    className="mt-2 text-[23px] font-semibold"
                                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                                >
                                    Plats non compatibles
                                </h2>

                                <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#717171]">
                                    Ces plats ne correspondent pas aux allergies enregistrées
                                    sur ton profil. Ils ne sont pas proposés à la réservation.
                                </p>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    {incompatibles.map((o) => (
                                        <article
                                            key={o.menu_jour_id}
                                            className="rounded-[20px] border border-[#F2D5D2] bg-[#FFF8F7] p-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                                                    {o.photo ? (
                                                        <img
                                                            src={o.photo}
                                                            alt={o.nom}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <UtensilsCrossed
                                                                size={20}
                                                                className="text-[#B0B0B0]"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-[14px] font-semibold">
                                                        {o.nom}
                                                    </h3>
                                                    <p className="mt-1 text-[12px] text-[#717171]">
                                                        {fcfa(o.prix)}
                                                    </p>
                                                </div>

                                                <AlertCircle
                                                    size={18}
                                                    className="shrink-0 text-[#B30000]"
                                                />
                                            </div>

                                            {o.raison && (
                                                <p className="mt-3 border-t border-[#F2D5D2] pt-3 text-[12px] leading-5 text-[#B30000]">
                                                    {o.raison}
                                                </p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Réservation */}
                        <section className="mt-12 border-t border-[#EBEBEB] pt-7">
                            <div className="mx-auto max-w-[560px] text-center">
                                <button
                                    type="button"
                                    disabled={!peutReserver}
                                    onClick={() => navigate("/reservation")}
                                    className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-full bg-[#222222] px-6 text-[15px] font-semibold text-white transition hover:bg-[#383838] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#D9D9D9]"
                                >
                                    {t("reserver")}
                                    <ArrowRight size={17} />
                                </button>

                                {peutReserver && !menu.vague_ouverte && (
                                    <p className="mt-4 text-[12px] leading-5 text-[#717171]">
                                        Tu choisiras ta vague le jour même, à partir de{" "}
                                        {formatHeure(menu.heure_recreation ?? "10:00")}.
                                    </p>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
