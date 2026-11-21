import { useEffect, useState } from "react";
import { getMe, getMenuDuJour, getReservationDuJour } from "../../api/eleve";
import EcranRepasDuJour from "../../components/eleve/EcranRepasDuJour";
import EcranPatientez from "../../components/eleve/EcranPatientez";
import EcranReservationEnCours from "../../components/eleve/EcranReservationEnCours";

export default function Accueil() {
  const [data, setData] = useState({ me: null, menu: null, reservation: null });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-[#93939f]">
        Chargement…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-sm text-[#b30000]">
        {error}
      </div>
    );
  }

  const { me, menu, reservation } = data;

  if (reservation) {
    return <EcranReservationEnCours me={me} reservation={reservation} />;
  }

  const menuVide = menu.compatibles.length === 0 && menu.incompatibles.length === 0;
  if (menuVide) {
    return <EcranPatientez me={me} menu={menu} raison="vide" />;
  }
  if (!menu.commandes_ouvertes) {
    return <EcranPatientez me={me} menu={menu} raison="fermees" />;
  }
  return <EcranRepasDuJour me={me} menu={menu} />;
}
