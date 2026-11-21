import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import { getEnfants, getNotifications } from "../../api/pro";
import EspaceLayout, { Alerte } from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";
import { fcfa } from "../../utils/format";
import { ONGLETS_PARENT } from "./onglets";

export default function ParentAccueil() {
  const [enfants, setEnfants] = useState(null);
  const [nonLues, setNonLues] = useState(0);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    getEnfants().then(setEnfants).catch(() => setErreur("Impossible de charger tes enfants."));
    getNotifications().then((n) => setNonLues(n.filter((x) => !x.lue).length)).catch(() => {});
  }, []);

  return (
    <EspaceLayout titre="Mes enfants" onglets={ONGLETS_PARENT}>
      {nonLues > 0 && (
        <Link to="/parent/notifications" className="mb-4 flex min-h-12 items-center justify-between rounded-[16px] bg-[#eeece7] px-4 text-[15px] text-[#212121]">
          <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#ff7759]" />{nonLues} nouvelle{nonLues > 1 ? "s" : ""} notification{nonLues > 1 ? "s" : ""}</span>
          <ChevronRight size={18} />
        </Link>
      )}
      <Alerte>{erreur}</Alerte>
      {enfants === null && !erreur && <p className="text-[14px] text-[#93939f]">Chargement…</p>}
      {enfants?.length === 0 && (
        <p className="text-[15px] text-[#616161]">Aucun enfant rattaché. Ajoute ton enfant avec son matricule.</p>
      )}
      <ul className="space-y-3">
        {enfants?.map((e) => (
          <li key={e.id}>
            <Link to={`/parent/enfant/${e.id}`} className="flex items-center gap-4 rounded-[16px] border border-[#d9d9dd] p-4">
              <Avatar nom={e.nom} photo={e.photo} taille={56} />
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-medium text-[#212121]">{e.nom}</p>
                <p className="text-[14px] text-[#616161]">{e.classe} · {e.matricule}</p>
                {e.allergies.length > 0 && (
                  <p className="mt-1 text-[13px] text-[#b30000]">Allergie : {e.allergies.join(", ")}</p>
                )}
              </div>
              <div className="text-right">
                <p className={`text-[16px] font-medium ${e.solde < 0 ? "text-[#b30000]" : "text-[#212121]"}`}>{fcfa(e.solde)}</p>
                <p className="text-[12px] text-[#93939f]">solde</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/parent/ajouter" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-[32px] bg-[#17171c] text-[15px] font-medium text-white">
        <Plus size={18} /> Ajouter un enfant
      </Link>
    </EspaceLayout>
  );
}
