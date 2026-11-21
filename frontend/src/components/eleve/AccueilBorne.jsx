import { ArrowRight, KeyRound, QrCode, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_LOGO, APP_NAME } from "../../config/app";
import { titreStyle } from "../../utils/tokens";

const ETAPES = [
  { icone: KeyRound, titre: "Identifie-toi", texte: "Ton matricule et ton code PIN." },
  { icone: UtensilsCrossed, titre: "Compose ton assiette", texte: "Plat, accompagnements, portion." },
  { icone: QrCode, titre: "Récupère ton code", texte: "Un code à 6 caractères pour l'agent." },
];

// Écran d'attente de la borne partagée : commander sans téléphone.
export default function AccueilBorne({ onCommander }) {
  return (
    <main className="min-h-dvh bg-white text-[#222222]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-6 sm:px-10">
        <header className="flex items-center gap-3">
          <img src={APP_LOGO} alt="" className="h-10 w-10" />
          <span className="text-[17px] font-semibold tracking-tight">{APP_NAME}</span>
          <span className="ml-auto rounded-full border border-[#EBEBEB] px-3 py-1.5 text-[12px] font-medium text-[#717171]">
            Borne de commande
          </span>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div style={{ animation: "monte 500ms ease both" }}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#FF5A5F]">
              Pas de téléphone ? Aucun souci.
            </p>
            <h1 className="mt-4 text-[44px] font-semibold sm:text-[64px] lg:text-[76px]" style={titreStyle}>
              Ton repas,
              <br />
              commandé <span className="text-[#FF5A5F]">ici.</span>
            </h1>
            <p className="mt-5 max-w-[460px] text-[16px] leading-7 text-[#717171] sm:text-[18px]">
              Choisis ton plat, personnalise-le et réserve ta portion directement sur la borne.
            </p>

            <button
              type="button"
              onClick={onCommander}
              className="group mt-9 flex h-[72px] w-full max-w-[420px] items-center justify-between rounded-full bg-[#222222] pl-8 pr-3 text-[20px] font-semibold text-white transition hover:bg-[#000000] active:scale-[0.99]"
            >
              Commander
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#FF5A5F] transition-transform group-hover:translate-x-1">
                <ArrowRight size={24} aria-hidden="true" />
              </span>
            </button>
            <button
              type="button"
              onClick={onCommander}
              className="mt-4 min-h-12 text-[15px] font-medium text-[#717171] underline-offset-4 hover:text-[#222222] hover:underline"
            >
              Déjà commandé ? Retrouve ton ticket
            </button>
          </div>

          <ol className="grid gap-3">
            {ETAPES.map(({ icone: Icone, titre, texte }, i) => (
              <li
                key={titre}
                className={`flex items-center gap-4 rounded-[22px] p-5 ${i === 1 ? "bg-[#FFF0ED] lg:-ml-10" : "border border-[#EBEBEB]"}`}
                style={{ animation: `monte 500ms ${120 + i * 90}ms ease both` }}
              >
                <span className="text-[34px] font-semibold text-[#B0B0B0]" style={titreStyle}>
                  0{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-semibold">{titre}</p>
                  <p className="mt-0.5 text-[14px] text-[#717171]">{texte}</p>
                </div>
                <Icone size={22} className="shrink-0 text-[#FF5A5F]" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EBEBEB] pt-4 text-[13px] text-[#B0B0B0]">
          <span>Déconnexion automatique après chaque commande.</span>
          <Link to="/pro" className="min-h-10 py-2 font-medium text-[#717171] hover:text-[#222222]">
            Espace personnel
          </Link>
        </footer>
      </div>
    </main>
  );
}
