
import { useNavigate } from "react-router-dom";
import {
    CalendarDays,
    UtensilsCrossed,
    ArrowRight,
    Clock3,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import { Avatar } from "../ui";
import { titreStyle } from "../../utils/tokens";

const MESSAGES = {
    vide: {
        titre: "Le menu du jour n'est pas encore prêt",
        description: "Le menu sera affiché dès qu'il sera publié.",
        label: "Bientôt disponible",
        icon: CalendarDays,
    },
    fermees: {
        titre: "Les commandes sont fermées",
        description: "Le menu est visible. Les commandes ouvrent la veille au soir.",
        label: "En attente d'ouverture",
        icon: Clock3,
    },
    epuise: {
        titre: "Toutes les portions ont été réservées",
        description: "Il n'y a malheureusement plus de portions disponibles.",
        label: "Stock épuisé",
        icon: AlertCircle,
    },
};

export default function EcranPatientez({ me, raison }) {
    const navigate = useNavigate();
    const message = MESSAGES[raison] || MESSAGES.vide;
    const Icone = message.icon;

    return (
        <main className="flex min-h-screen flex-col bg-white px-5">
            {/* En-tête */}
            <header className="mx-auto flex w-full max-w-[760px] items-center justify-between py-5">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#717171]">
                        Cantine Vatel
                    </p>
                    <p className="mt-1 text-[14px] text-[#222222]">
                        Ton espace repas
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/profil")}
                    aria-label="Accéder à mon profil"
                    className="rounded-full transition hover:opacity-80"
                >
                    <Avatar nom={me.nom} photo={me.photo} taille={44} />
                </button>
            </header>

            {/* Contenu principal */}
            <section className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center py-12 text-center">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#F7F7F7]">
                    <div className="absolute inset-3 rounded-full border border-[#EBEBEB]" />
                    <div className="absolute inset-6 rounded-full border border-[#EBEBEB]" />

                    <UtensilsCrossed
                        size={46}
                        strokeWidth={1.3}
                        className="text-[#222222]"
                    />

                    <div className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full border-[4px] border-white bg-[#FFF0ED]">
                        <Icone
                            size={19}
                            strokeWidth={1.8}
                            className="text-[#FF5A5F]"
                        />
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-2 rounded-full bg-[#F7F7F7] px-3.5 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A5F]" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#717171]">
                        {message.label}
                    </p>
                </div>

                <h1
                    className="mt-5 max-w-[390px] text-[27px] font-semibold leading-tight text-[#222222] sm:text-[34px]"
                    style={titreStyle}
                >
                    {message.titre}
                </h1>

                <p className="mt-4 max-w-[340px] text-[14px] leading-7 text-[#717171]">
                    {message.description}
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/menus")}
                    className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#222222] px-6 text-[14px] font-medium text-white transition hover:bg-[#444444] active:scale-[0.98]"
                >
                    <CalendarDays size={17} />
                    Consulter les menus à venir
                    <ArrowRight size={15} />
                </button>
            </section>

            {/* Pied de page */}
            <footer className="mx-auto w-full max-w-[760px] pb-6 text-center">
                <div className="mx-auto mb-4 h-px w-full bg-[#EBEBEB]" />
                <p className="text-[11px] tracking-wide text-[#B0B0B0]">
                    Cantine Vatel · Bien manger, chaque jour.
                </p>
            </footer>
        </main>
    );
}
