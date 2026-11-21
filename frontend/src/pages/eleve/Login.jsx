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
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header band */}
      <div className="bg-[#003c33] px-5 pb-8 pt-14">
        <h1
          className="text-[28px] font-bold leading-tight text-white"
          style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}
        >
          Cantine Vatel
        </h1>
        <p className="mt-1 text-sm text-white/70">Connecte-toi pour commander</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 pt-8">
        <label className="text-sm font-medium text-[#212121]">
          Matricule
          <input
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            placeholder="LYC-2026-001"
            autoComplete="username"
            className="mt-1.5 block w-full rounded-xl border border-[#d9d9dd] bg-[#eeece7]/40 px-4 py-3 text-base text-[#212121] placeholder:text-[#93939f] focus:border-[#003c33] focus:outline-none"
          />
        </label>

        <label className="mt-5 text-sm font-medium text-[#212121]">
          Code PIN
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            autoComplete="current-password"
            className="mt-1.5 block w-full rounded-xl border border-[#d9d9dd] bg-[#eeece7]/40 px-4 py-3 text-base text-[#212121] placeholder:text-[#93939f] focus:border-[#003c33] focus:outline-none"
          />
        </label>

        {error && (
          <p className="mt-4 text-sm font-medium text-[#b30000]">{error}</p>
        )}

        <div className="mt-auto pb-8 pt-8">
          <button
            type="submit"
            disabled={loading || !matricule || pin.length < 4}
            className="w-full rounded-[32px] bg-[#17171c] px-6 py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </div>
      </form>
    </div>
  );
}
