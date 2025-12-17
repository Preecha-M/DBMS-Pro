import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import api from "../api/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  function hasAccessTokenCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith("accessToken="));
}

  async function fetchMe() {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data.user);
    } catch (err) {
      if (err?.response?.status === 401) {
        setUser(null);
        return;
      }
      console.error(err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  if (!hasAccessTokenCookie()) {
    setUser(null);
    setLoading(false);
    return;
  }
  fetchMe();
}, []);


  const login = async (username, password) => {
    const res = await api.post("/api/auth/login", { username, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
