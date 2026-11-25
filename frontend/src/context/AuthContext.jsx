import { useEffect, useMemo, useState } from "react";
import { apiRequest, setUnauthorizedHandler } from "../services/api";
import { AuthContext } from "./AuthContext";

const TOKEN_KEY = "futura_imoveis_access_token";
function limparSessao(setToken, setUsuario) {
  sessionStorage.removeItem(TOKEN_KEY);
  setToken(null);
  setUsuario(null);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [inicializando, setInicializando] = useState(() =>
    Boolean(sessionStorage.getItem(TOKEN_KEY))
  );

  useEffect(() => {
    const tokenArmazenado = sessionStorage.getItem(TOKEN_KEY);
    if (!tokenArmazenado) return undefined;

    let ativo = true;
    apiRequest("/usuarios/me", {}, tokenArmazenado)
      .then((dados) => {
        if (!ativo) return;
        setToken(tokenArmazenado);
        setUsuario(dados);
      })
      .catch(() => {
        if (ativo) limparSessao(setToken, setUsuario);
      })
      .finally(() => {
        if (ativo) setInicializando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => limparSessao(setToken, setUsuario));
    return () => setUnauthorizedHandler(null);
  }, []);

  async function login(accessToken) {
    const dadosUsuario = await apiRequest("/usuarios/me", {}, accessToken);
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUsuario(dadosUsuario);
    return dadosUsuario;
  }

  function logout() {
    limparSessao(setToken, setUsuario);
  }

  const valor = useMemo(
    () => ({
      token,
      usuario,
      perfil: usuario?.perfil || null,
      autenticado: Boolean(token && usuario),
      inicializando,
      login,
      logout,
    }),
    [token, usuario, inicializando]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
