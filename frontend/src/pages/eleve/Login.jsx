
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { titreStyle } from "../../utils/tokens";

const NB_CHIFFRES = 4;

function PinInput({ value, onChange }) {
  const refs = useRef([]);

  const chiffres = Array.from(
      { length: NB_CHIFFRES },
      (_, i) => value[i] || ""
  );

  const saisir = (i, v) => {
    const c = v.replace(/\D/g, "");

    if (!c) {
      onChange(value.slice(0, i) + value.slice(i + 1));
      return;
    }

    const next = (
        value.slice(0, i) + c + value.slice(i + c.length)
    ).slice(0, NB_CHIFFRES);

    onChange(next);

    const nextIndex = Math.min(i + c.length, NB_CHIFFRES - 1);
    refs.current[nextIndex]?.focus();
  };

  const touche = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      const cible = chiffres[i] ? i : Math.max(i - 1, 0);
      const next = value.slice(0, cible) + value.slice(cible + 1);

      onChange(next);
      refs.current[cible]?.focus();
    }

    if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    }

    if (e.key === "ArrowRight" && i < NB_CHIFFRES - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  return (
      <div className="mt-3 flex justify-center gap-3">
        {chiffres.map((c, i) => (
            <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete={i === 0 ? "current-password" : "off"}
                aria-label={`Chiffre ${i + 1} du PIN`}
                value={c}
                onChange={(e) => saisir(i, e.target.value)}
                onKeyDown={(e) => touche(i, e)}
                onFocus={(e) => e.target.select()}
                className="h-14 w-14 rounded-2xl border border-[#EBEBEB] bg-[#F7F7F7] text-center text-2xl font-semibold text-[#222222] outline-none transition-all focus:border-[#FF5A5F] focus:bg-white focus:ring-4 focus:ring-[#FF5A5F]/10"
            />
        ))}
      </div>
  );
}

export default function Login() {
  const { login, choisirPin } = useAuth();
  const navigate = useNavigate();

  const [matricule, setMatricule] = useState("");
  const [pin, setPin] = useState("");
  const [premiere, setPremiere] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (premiere) {
        await choisirPin(matricule.trim(), pin);
      } else {
        await login(matricule.trim(), pin);
      }

      navigate("/", { replace: true });
    } catch (err) {
      const st = err.response?.status;

      setError(
          st === 409
              ? err.response.data.detail
              : st === 401 || st === 404
                  ? premiere
                      ? "Matricule inconnu."
                      : "Matricule ou code PIN incorrect."
                  : "Connexion impossible. Réessaie."
      );
    } finally {
      setLoading(false);
    }
  }

  function changerMode() {
    setPremiere((p) => !p);
    setPin("");
    setError("");
  }

  return (
      <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">

        {/* Partie visuelle */}
        <section className="relative hidden min-h-screen overflow-hidden bg-[#FFF0ED] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5A5F] text-white">
              <UtensilsCrossed size={23} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-[#222222]">
            Cantine Vatel
          </span>
          </div>

          <div className="relative z-10 max-w-lg">
          <span className="mb-5 inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#FF5A5F]">
            Bienvenue à la cantine
          </span>

            <h2
                className="text-5xl font-semibold leading-[1.12] tracking-tight text-[#222222] xl:text-6xl"
                style={titreStyle}
            >
              Bien manger,
              <br />
              bien grandir.
            </h2>

            <p className="mt-6 max-w-md text-lg leading-8 text-[#717171]">
              Une cantine mieux organisée, des repas adaptés et une expérience
              pensée pour chaque élève.
            </p>

            <div className="mt-12 overflow-hidden rounded-[32px] bg-white p-3 shadow-xl shadow-[#222222]/5">
              <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[24px] bg-[#F7F7F7]">
                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FFF0ED]">
                    <UtensilsCrossed size={42} className="text-[#FF5A5F]" />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-[#222222]">
                    Des repas avec attention
                  </p>
                  <p className="mt-1 text-sm text-[#717171]">
                    Chaque repas compte.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-[#717171]">
            © 2026 Cantine Vatel · Tous droits réservés
          </p>

          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[50px] border-white/40" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#FF5A5F]/10" />
        </section>

        {/* Formulaire */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[420px]">

            <div className="mb-12 lg:hidden">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF5A5F] text-white">
                <UtensilsCrossed size={28} />
              </div>
              <h1
                  className="mt-4 text-center text-3xl font-semibold text-[#222222]"
                  style={titreStyle}
              >
                Cantine Vatel
              </h1>
            </div>

            <div className="mb-9">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5A5F]">
              Espace élève
            </span>

              <h1
                  className="mt-3 text-3xl font-semibold tracking-tight text-[#222222] sm:text-4xl"
                  style={titreStyle}
              >
                {premiere ? "Bienvenue !" : "Content de te revoir."}
              </h1>

              <p className="mt-3 text-[15px] leading-6 text-[#717171]">
                {premiere
                    ? "Définis ton code PIN personnel pour sécuriser ton compte."
                    : "Connecte-toi pour retrouver tes repas et ton espace personnel."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">

              <div>
                <label
                    htmlFor="matricule"
                    className="mb-2 block text-sm font-medium text-[#222222]"
                >
                  Ton matricule
                </label>

                <input
                    id="matricule"
                    type="text"
                    value={matricule}
                    onChange={(e) => {
                      setMatricule(e.target.value.toUpperCase());
                      setError("");
                    }}
                    placeholder="Ex : LYC-2026-001"
                    autoComplete="username"
                    autoCapitalize="characters"
                    required
                    className="h-14 w-full rounded-2xl border border-[#EBEBEB] bg-[#F7F7F7] px-4 text-base text-[#222222] outline-none transition-all placeholder:text-[#B0B0B0] focus:border-[#FF5A5F] focus:bg-white focus:ring-4 focus:ring-[#FF5A5F]/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#222222]">
                    {premiere ? "Choisis ton code PIN" : "Ton code PIN"}
                  </label>
                  <span className="text-xs text-[#B0B0B0]">
                  4 chiffres
                </span>
                </div>

                <PinInput value={pin} onChange={setPin} />
              </div>

              {error && (
                  <div
                      role="alert"
                      className="flex items-start gap-3 rounded-2xl border border-[#B30000]/10 bg-[#FFF0ED] p-4 text-sm text-[#B30000]"
                  >
                    <AlertCircle size={19} className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
              )}

              <button
                  type="submit"
                  disabled={loading || !matricule.trim() || pin.length !== NB_CHIFFRES}
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#222222] text-base font-semibold text-white transition-all hover:bg-[#FF5A5F] disabled:cursor-not-allowed disabled:bg-[#EBEBEB] disabled:text-[#B0B0B0]"
              >
                {loading
                    ? "Connexion en cours..."
                    : premiere
                        ? "Enregistrer mon PIN"
                        : "Se connecter"}

                {!loading && <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />}
              </button>

              <button
                  type="button"
                  onClick={changerMode}
                  className="w-full py-2 text-sm font-medium text-[#717171] transition-colors hover:text-[#FF5A5F]"
              >
                {premiere
                    ? "J'ai déjà un PIN, me connecter"
                    : "Première connexion ? Choisis ton PIN"}
              </button>
            </form>

            <div className="my-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#EBEBEB]" />
              <span className="text-xs text-[#B0B0B0]">OU</span>
              <div className="h-px flex-1 bg-[#EBEBEB]" />
            </div>

            <Link
                to="/pro"
                className="flex min-h-14 items-center justify-center gap-2 rounded-full border border-[#EBEBEB] text-sm font-medium text-[#222222] transition-all hover:border-[#222222] hover:bg-[#F7F7F7]"
            >
              <ShieldCheck size={18} />
              Parent ou personnel ?
              <span className="text-[#FF5A5F]">Accéder à l'espace pro</span>
            </Link>

            <p className="mt-8 text-center text-xs text-[#B0B0B0]">
              Ton espace personnel est sécurisé.
            </p>
          </div>
        </section>
      </main>
  );
}
