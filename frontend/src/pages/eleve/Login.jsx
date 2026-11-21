import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [matricule, setMatricule] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(matricule.trim(), pin);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-canvas)]">
      {/* Left panel: brand — hidden on mobile */}
      <div
        className="relative hidden md:flex md:w-1/2 flex-col items-center justify-center"
        style={{ background: "linear-gradient(135deg, var(--color-surface-soft) 0%, #fff0ed 100%)" }}
      >
        <img src="/logo.svg" alt="Cantine Vatel" className="h-32 w-32" />
        <p
          className="mt-6 text-[22px] font-medium text-[var(--color-ink)]"
          style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.44px" }}
        >
          Cantine Vatel
        </p>
      </div>

      {/* Right / main: form */}
      <div className="flex w-full flex-col md:w-1/2">
        {/* Mobile brand header */}
        <div className="flex flex-col items-center pt-16 pb-6 md:hidden">
          <img src="/logo.svg" alt="Cantine Vatel" className="h-20 w-20" />
          <p
            className="mt-3 text-[18px] font-medium text-[var(--color-ink)]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}
          >
            Cantine Vatel
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 pb-10 md:px-16 lg:px-24">
          <h1
            className="text-[28px] font-bold text-[var(--color-ink)]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.14, letterSpacing: "-0.02em" }}
          >
            Bienvenue
          </h1>
          <p className="mt-2 text-[16px] text-[var(--color-muted)]" style={{ lineHeight: 1.5 }}>
            Connecte-toi pour commander.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <div>
              <label className="text-[14px] font-medium text-[var(--color-muted)]">
                Matricule
              </label>
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="LYC-2026-001"
                autoComplete="username"
                className="mt-1.5 block w-full border-b-2 border-[var(--color-hairline)] bg-transparent px-0 py-3 text-[16px] text-[var(--color-ink)] placeholder:text-[var(--color-muted-soft)] focus:border-[var(--color-ink)] focus:outline-none transition-colors"
              />
            </div>

            <div className="mt-6">
              <label className="text-[14px] font-medium text-[var(--color-muted)]">
                Code PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                autoComplete="current-password"
                className="mt-1.5 block w-full border-b-2 border-[var(--color-hairline)] bg-transparent px-0 py-3 text-[16px] text-[var(--color-ink)] placeholder:text-[var(--color-muted-soft)] focus:border-[var(--color-ink)] focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="mt-4 text-[14px] text-[var(--color-error)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !matricule || pin.length < 4}
              className="mt-8 w-full py-3.5 text-[16px] font-medium text-[var(--color-on-primary)] disabled:opacity-40 active:brightness-90 transition-all"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--rounded-sm)",
              }}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
