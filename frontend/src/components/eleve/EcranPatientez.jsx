
import { useNavigate } from "react-router-dom";
import {
    CalendarDays,
    UtensilsCrossed,
    ArrowRight,
} from "lucide-react";

import { Avatar } from "../ui";
import { titreStyle } from "../../utils/tokens";

const MESSAGES = {
    vide: [
        "Le menu du jour n'est pas encore prêt",
        "Le menu sera affiché dès qu'il sera publié.",
    ],
    fermees: [
        "Les commandes sont fermées",
        "Le menu est visible. Les commandes ouvrent la veille au soir.",
    ],
    epuise: [
        "Toutes les portions ont été réservées",
        "Il n'y a malheureusement plus de portions disponibles.",
    ],
};

export default function EcranPatientez({ me, raison }) {
    const navigate = useNavigate();
    const [titre, sous] = MESSAGES[raison] || MESSAGES.vide;

    return (
        <main className="flex min-h-screen flex-col bg-white px-5">
            {/* En-tête */}
            <header className="flex items-center justify-between py-5">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#717171]">
                        Cantine Vatel
                    </p>
                    <p className="mt-1 text-sm text-[#222222]">
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

            {/* Contenu */}
            <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#F7F7F7]">
                    <div className="absolute inset-3 rounded-full border border-[#EBEBEB]" />

                    <UtensilsCrossed
                        size={48}
                        strokeWidth={1.3}
                        className="text-[#B0B0B0]"
                    />
                </div>

                <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FF5A5F]">
                    Information
                </p>

                <h1
                    className="mt-3 max-w-[360px] text-[26px] font-semibold text-[#222222] sm:text-[32px]"
                    style={titreStyle}
                >
                    {titre}
                </h1>

                <p className="mt-3 max-w-[340px] text-[14px] leading-6 text-[#717171]">
                    {sous}
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/menus")}
                    className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#EBEBEB] px-5 text-[14px] font-medium text-[#222222] transition hover:border-[#222222] active:scale-[0.98]"
                >
                    <CalendarDays size={17} />
                    Consulter les menus à venir
                    <ArrowRight size={15} />
                </button>
            </section>

            {/* Pied */}
            <footer className="pb-6 text-center">
                <p className="text-[11px] text-[#B0B0B0]">
                    Cantine Vatel · Bien manger, chaque jour.
                </p>
            </footer>
        </main>
    );
}
