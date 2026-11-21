import { useAuth } from "../../hooks/useAuth";

export default function Accueil() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white px-5 pt-12">
      <h1
        className="text-2xl font-bold tracking-tight text-[#212121]"
        style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}
      >
        Bonjour, {user?.nom?.split(" ")[0]} 👋
      </h1>
      <p className="mt-2 text-[#616161]">Bienvenue à la Cantine Vatel</p>
      <button
        onClick={logout}
        className="mt-8 w-full rounded-[32px] bg-[#17171c] px-6 py-3 text-sm font-medium text-white"
      >
        Se déconnecter
      </button>
    </div>
  );
}
