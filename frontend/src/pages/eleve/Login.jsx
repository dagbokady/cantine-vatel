import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { titreStyle } from "../../utils/tokens";

const NB_CHIFFRES = 4;

function PinInput({ value, onChange }) {
  const refs = useRef([]);
  const chiffres = Array.from({ length: NB_CHIFFRES }, (_, i) => value[i] || "");

  const saisir = (i, v) => {
    const c = v.replace(/\D/g, "");
    if (!c) return;
    // collage de plusieurs chiffres d'un coup
    const next = (value.slice(0, i) + c).slice(0, NB_CHIFFRES);
    onChange(next);
    refs.current[Math.min(next.length, NB_CHIFFRES - 1)]?.focus();
  };

  const touche = (i, e) => {
    if (e.key !== "Backspace") return;
    e.preventDefault();
    const cible = chiffres[i] ? i : Math.max(i - 1, 0);
    onChange(value.slice(0, cible));
    refs.current[cible]?.focus();
  };

  return (
    <div className="mt-1.5 flex justify-center gap-3">
      {chiffres.map((c, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="password"
          inputMode="numeric"
          autoComplete={i === 0 ? "current-password" : "off"}
          aria-label={`Chiffre ${i + 1} du PIN`}
          value={c}
          onChange={(e) => saisir(i, e.target.value)}
          onKeyDown={(e) => touche(i, e)}
          onFocus={(e) => e.target.select()}
          className="h-12 w-12 rounded-[12px] border border-[#EBEBEB] bg-white text-center text-[24px] text-[#222222] outline-none transition-colors focus:border-[#222222]"
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
      if (premiere) await choisirPin(matricule.trim(), pin);
      else await login(matricule.trim(), pin);
      navigate("/", { replace: true });
    } catch (err) {
      const st = err.response?.status;
      setError(
        st === 409
          ? err.response.data.detail
          : st === 401 || st === 404
          ? premiere
            ? "Matricule inconnu"
            : "Matricule ou PIN incorrect"
          : "Connexion impossible. Réessaie.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-white px-5 py-10">
      <div className="mx-auto w-full max-w-[400px]">
        <h1 className="text-center text-[32px] font-medium text-[#222222]" style={titreStyle}>
          Cantine Vatel
        </h1>
        <p className="mt-2 text-center text-[15px] text-[#717171]">
          {premiere ? "Choisis ton code PIN à 4 chiffres" : "Connecte-toi avec ton matricule"}
        </p>

        <form onSubmit={handleSubmit} className="mt-10">
          <label className="block text-[13px] text-[#B0B0B0]" htmlFor="matricule">
            Matricule
          </label>
          <input
            id="matricule"
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value.toUpperCase())}
            placeholder="LYC-2026-001"
            autoComplete="username"
            autoCapitalize="characters"
            className="mt-1.5 h-12 w-full rounded-[12px] border border-[#EBEBEB] bg-white px-4 text-[16px] text-[#222222] outline-none transition-colors placeholder:text-[#B0B0B0] focus:border-[#222222]"
          />

          <p className="mt-4 text-[13px] text-[#B0B0B0]">
            {premiere ? "Nouveau code PIN" : "Code PIN"}
          </p>
          <PinInput value={pin} onChange={setPin} />

          <button
            type="button"
            onClick={() => {
              setPremiere((p) => !p);
              setPin("");
              setError("");
            }}
            className="mt-2 min-h-12 text-[13px] text-[#222222] underline underline-offset-2"
          >
            {premiere ? "J'ai déjà un PIN, me connecter" : "Première connexion ? Choisis ton PIN"}
          </button>

          <button
            type="submit"
            disabled={loading || !matricule.trim() || pin.length < NB_CHIFFRES}
            className="mt-2 h-[52px] w-full rounded-[32px] bg-[#222222] text-[16px] font-medium text-white transition-colors disabled:bg-[#F7F7F7] disabled:text-[#B0B0B0]"
          >
            {loading ? "Connexion…" : premiere ? "Enregistrer mon PIN" : "Se connecter"}
          </button>

          <div className="mt-8 min-h-[44px]">
            {error && (
              <p role="alert" className="w-full bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#b30000]">
                {error}
              </p>
            )}
          </div>
        </form>
        <p className="text-center">
          <Link to="/pro" className="inline-block min-h-12 py-3 text-[13px] text-[#717171] underline underline-offset-2">
            Parent ou personnel ? Connecte-toi ici
          </Link>
        </p>
      </div>
    </div>
  );
}
