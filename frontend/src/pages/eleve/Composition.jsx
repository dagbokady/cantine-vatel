import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, Check, ChevronRight, Lock, Plus, UtensilsCrossed } from "lucide-react";
import { BackHeader, BottomCTA } from "../../components/ui";
import { useReservation } from "../../hooks/useReservation";
import { decouperNomPlat, fcfa, prixTotal, supplementsChoisis, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";

function Interrupteur({ actif }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${actif ? "bg-[#FF5A5F]" : "bg-[#EBEBEB]"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${actif ? "translate-x-6" : "translate-x-1"}`}
      />
    </span>
  );
}

function Option({ e, actif, onToggle }) {
  const indispo = !!e.bloque || !e.disponible;
  return (
    <li>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={`${e.nom}${e.supplement ? `, supplément ${fcfa(e.supplement)}` : ""}${e.bloque ? `, ${e.bloque}` : ""}`}
        disabled={indispo}
        onClick={onToggle}
        className={`flex min-h-[68px] w-full items-center gap-4 rounded-[22px] border px-4 py-3 text-left transition ${
          actif ? "border-[#222222] bg-white" : "border-[#EBEBEB] bg-white"
        } disabled:cursor-not-allowed disabled:bg-[#F7F7F7]`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            indispo ? "bg-white text-[#B0B0B0]" : actif ? "bg-[#FFF0ED] text-[#FF5A5F]" : "bg-[#F7F7F7] text-[#717171]"
          }`}
        >
          {indispo ? <Ban size={17} /> : actif ? <Check size={18} /> : <Plus size={18} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-[15px] font-semibold ${indispo ? "text-[#B0B0B0]" : "text-[#222222]"}`}>{e.nom}</span>
          <span className={`block text-[13px] ${e.bloque ? "text-[#B30000]" : "text-[#717171]"}`}>
            {e.bloque ? `${e.bloque} : retiré pour toi` : !e.disponible ? "Épuisé pour aujourd'hui" : e.supplement ? `+${fcfa(e.supplement)}` : "Sans supplément"}
          </span>
        </span>
        {!indispo && <Interrupteur actif={actif} />}
      </button>
    </li>
  );
}

// Étape 2 : présentation de la composition puis personnalisation des éléments facultatifs.
export default function Composition() {
  const navigate = useNavigate();
  const { etat, basculerElement } = useReservation();
  const plat = etat.plat;

  useEffect(() => {
    if (!plat) navigate("/reservation", { replace: true });
  }, [plat, navigate]);
  if (!plat) return null;

  const { nom, mention } = decouperNomPlat(plat.nom);
  const elements = plat.elements ?? [];
  const inclus = elements.filter((e) => e.obligatoire);
  const options = elements.filter((e) => !e.obligatoire);
  const supplements = supplementsChoisis(plat, etat.elements);
  const total = prixTotal(plat, etat.tiers, etat.elements);

  return (
    <div className="min-h-dvh bg-white pb-[calc(var(--cta-h,150px)+24px)]">
      <BackHeader titre="Compose ton assiette" etape={2} />

      <main className="mx-auto max-w-[720px] px-4 pt-5 sm:px-7">
        <section className="grid gap-5 sm:grid-cols-[1fr_1.1fr] sm:items-end">
          <div className="relative overflow-hidden rounded-[22px] bg-[#F7F7F7]">
            <div className="aspect-[4/3]">
              {plat.photo ? (
                <img src={plat.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[#B0B0B0]">
                  <UtensilsCrossed size={44} strokeWidth={1.25} />
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF5A5F]">Ton plat</p>
            <h1 className="mt-2 text-[30px] font-semibold text-[#222222] sm:text-[36px]" style={titreStyle}>
              {nom}
            </h1>
            {mention && <p className="mt-1 text-[13px] text-[#717171]">{mention}</p>}
            {plat.ingredients?.length > 0 && (
              <p className="mt-3 text-[13px] leading-5 text-[#717171]">
                Préparé avec {plat.ingredients.join(", ")}.
              </p>
            )}
          </div>
        </section>

        {inclus.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[19px] font-semibold text-[#222222]" style={titreStyle}>
              Dans ton assiette
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {inclus.map((e) => (
                <li
                  key={e.id}
                  className="flex min-h-11 items-center gap-2 rounded-full bg-[#F7F7F7] px-4 text-[14px] font-medium text-[#222222]"
                >
                  <Lock size={14} className="text-[#717171]" aria-hidden="true" />
                  {e.nom}
                  <span className="text-[12px] font-normal text-[#717171]">inclus</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-[19px] font-semibold text-[#222222]" style={titreStyle}>
            {options.length ? "Personnalise ton plat" : "Ton plat est prêt"}
          </h2>
          <p className="mt-1 text-[13px] text-[#717171]">
            {options.length
              ? "Ajoute ou retire les accompagnements. Le prix s'actualise."
              : "La cuisine ne propose pas d'option pour ce plat aujourd'hui."}
          </p>
          {options.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {options.map((e) => (
                <Option key={e.id} e={e} actif={etat.elements.includes(e.id)} onToggle={() => basculerElement(e.id)} />
              ))}
            </ul>
          )}
          {elements.some((e) => e.bloque) && (
            <p className="mt-4 rounded-[16px] bg-[#FFF0ED] px-4 py-3 text-[13px] leading-5 text-[#222222]">
              Les éléments incompatibles avec tes allergies sont retirés et ne peuvent pas être ajoutés.
            </p>
          )}
        </section>
      </main>

      <BottomCTA
        onClick={() => navigate("/reservation/quantite")}
        aside={
          <span>
            Portion {tiersEnFraction(etat.tiers)}
            {supplements > 0 && ` · suppléments +${fcfa(supplements)}`} ·{" "}
            <span className="font-semibold text-[#222222]">{fcfa(total)}</span>
          </span>
        }
      >
        <span className="flex items-center justify-center gap-2">
          Choisir ma portion <ChevronRight size={18} />
        </span>
      </BottomCTA>
    </div>
  );
}
