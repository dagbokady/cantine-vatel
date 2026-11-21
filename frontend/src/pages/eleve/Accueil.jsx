import { useEffect, useState } from "react";
import { getMe, getMenuDuJour, getReservationDuJour } from "../../api/eleve";
import EcranRepasDuJour from "../../components/eleve/EcranRepasDuJour";
import EcranPatientez from "../../components/eleve/EcranPatientez";
import EcranReservationEnCours from "../../components/eleve/EcranReservationEnCours";

export default function Accueil() {
  const [data, setData] = useState({ me: null, menu: null, reservation: null });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, menu, reservation] = await Promise.all([
          getMe(),
          getMenuDuJour(),
          getReservationDuJour(),
        ]);
        if (alive) setData({ me, menu, reservation });
      } catch (err) {
        if (alive) setError(err.response?.data?.detail || "Impossible de charger.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [version]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-canvas)]">
        <img src="/logo.svg" alt="" className="h-16 w-16 animate-pulse" />
        <p className="mt-4 text-[14px] text-[var(--color-muted-soft)]">Chargement…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-canvas)] px-6 text-center">
        <img src="/logo.svg" alt="" className="h-16 w-16 opacity-40" />
        <p className="mt-4 text-[14px] text-[var(--color-error)]">{error}</p>
      </div>
    );
  }

  const { me, menu, reservation } = data;

  if (reservation) {
    return (
      <EcranReservationEnCours
        me={me}
        reservation={reservation}
        onAnnulee={() => setVersion((v) => v + 1)}
      />
    );
  }

  const menuVide = menu.compatibles.length === 0 && menu.incompatibles.length === 0;
  if (menuVide) {
    return <EcranPatientez me={me} menu={menu} raison="vide" />;
  }
  if (!menu.commandes_ouvertes) {
    return <EcranPatientez me={me} menu={menu} raison="fermees" />;
  }
  const epuise =
    menu.compatibles.length > 0 && menu.compatibles.every((o) => o.stock_restant < 3);
  if (epuise) {
    return <EcranPatientez me={me} menu={menu} raison="epuise" />;
  }
  return <EcranRepasDuJour me={me} menu={menu} />;
}
