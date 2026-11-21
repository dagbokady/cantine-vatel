
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

import {
    getMe,
    getMenuDuJour,
    getReservationDuJour,
} from "../../api/eleve";

import EcranRepasDuJour from "../../components/eleve/EcranRepasDuJour";
import EcranPatientez from "../../components/eleve/EcranPatientez";
import EcranReservationEnCours from "../../components/eleve/EcranReservationEnCours";

export default function Accueil() {
    const [data, setData] = useState({
        me: null,
        menu: null,
        reservation: null,
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [version, setVersion] = useState(0);

    const chargerDonnees = useCallback(async (signal) => {
        setLoading(true);
        setError("");

        try {
            const [me, menu, reservation] = await Promise.all([
                getMe(),
                getMenuDuJour(),
                getReservationDuJour(),
            ]);

            if (signal.aborted) return;

            setData({
                me,
                menu,
                reservation,
            });
        } catch (err) {
            if (signal.aborted) return;

            setError(
                err.response?.data?.detail ||
                "Impossible de charger les informations. Vérifie ta connexion."
            );
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        chargerDonnees(controller.signal);

        return () => controller.abort();
    }, [version, chargerDonnees]);

    const actualiser = () => {
        setVersion((v) => v + 1);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-canvas)]">
                <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-[#FF5A5F]/10" />
                    <img
                        src="/logo.svg"
                        alt="Cantine Vatel"
                        className="relative h-14 w-14 animate-pulse"
                    />
                </div>

                <p className="mt-5 text-sm font-medium text-[var(--color-muted-soft)]">
                    Préparation de ton espace...
                </p>

                <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-[#EBEBEB]">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-[#FF5A5F]" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-canvas)] px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0ED] text-[#B30000]">
                    <AlertCircle size={30} />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-[#222222]">
                    Oups, une erreur est survenue
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted-soft)]">
                    {error}
                </p>

                <button
                    onClick={actualiser}
                    className="mt-7 flex h-12 items-center justify-center gap-2 rounded-full bg-[#222222] px-7 text-sm font-medium text-white transition-colors hover:bg-[#FF5A5F]"
                >
                    <RefreshCw size={16} />
                    Réessayer
                </button>
            </div>
        );
    }

    const { me, menu, reservation } = data;

    // Vérification de la disponibilité des données
    if (!me || !menu) {
        return null;
    }

    // Une réservation existe déjà
    if (reservation) {
        return (
            <EcranReservationEnCours
                me={me}
                reservation={reservation}
                onAnnulee={actualiser}
            />
        );
    }

    // Aucun plat disponible
    const menuVide =
        menu.compatibles.length === 0 &&
        menu.incompatibles.length === 0;

    if (menuVide) {
        return (
            <EcranPatientez
                me={me}
                menu={menu}
                raison="vide"
            />
        );
    }

    // Les commandes sont fermées
    if (!menu.commandes_ouvertes) {
        return (
            <EcranPatientez
                me={me}
                menu={menu}
                raison="fermees"
            />
        );
    }

    // Stock insuffisant
    const epuise =
        menu.compatibles.length > 0 &&
        menu.compatibles.every((o) => o.stock_restant < 3);

    if (epuise) {
        return (
            <EcranPatientez
                me={me}
                menu={menu}
                raison="epuise"
            />
        );
    }

    return (
        <EcranRepasDuJour
            me={me}
            menu={menu}
        />
    );
}
