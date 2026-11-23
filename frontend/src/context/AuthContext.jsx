import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

const TOKEN_KEY = "sistema_imobiliario_token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function restaurarSessao() {
      if (!token) {
        if (ativo) setCarregando(false);
        return;
      }

      try {
        const dadosUsuario = await apiRequest("/usuarios/me", {}, token);
        if (ativo) setUsuario(dadosUsuario);
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);
        if (ativo) {
          setToken(null);
          setUsuario(null);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    restaurarSessao();
    return () => { ativo = false; };
  }, [token]);

  async function entrar(novoToken) {
    const dadosUsuario = await apiRequest("/usuarios/me", {}, novoToken);
    sessionStorage.setItem(TOKEN_KEY, novoToken);
    setUsuario(dadosUsuario);
    setToken(novoToken);
  }

  function sair() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  }

  const valor = useMemo(() => ({
    token,
    usuario,
    carregando,
    autenticado: Boolean(token && usuario),
    entrar,
    sair,
  }), [token, usuario, carregando]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return contexto;
}
