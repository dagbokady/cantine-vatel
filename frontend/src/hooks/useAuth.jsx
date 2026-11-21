import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const ouvrirSession = useCallback((data) => {
    localStorage.setItem("token", data.access_token);
    const u = { nom: data.nom, matricule: data.matricule };
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    return data;
  }, []);

  const login = useCallback(
    async (matricule, pin) =>
      ouvrirSession((await api.post("/auth/login", { matricule, pin })).data),
    [ouvrirSession],
  );

  const choisirPin = useCallback(
    async (matricule, nouveau_pin) =>
      ouvrirSession((await api.post("/auth/pin", { matricule, nouveau_pin })).data),
    [ouvrirSession],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, choisirPin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
