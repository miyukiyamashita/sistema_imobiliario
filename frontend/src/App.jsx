
import { useState } from "react";
import Login from "./pages/Login";
import Cadastro from "./pages/cadastro";
import { apiRequest } from "./services/api";
import Dashboard from "./pages/dashboard";

function App() {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [pagina, setPagina] = useState("login");

  async function entrar(novoToken) {
    const dadosUsuario = await apiRequest(
      "/usuarios/me",
      {},
      novoToken
    );

    setToken(novoToken);
    setUsuario(dadosUsuario);
  }

  function sair() {
    setToken(null);
    setUsuario(null);
    setPagina("login");
  }

  if (!token || !usuario) {
    if (pagina === "cadastro") {
      return (
        <Cadastro
          onVoltar={() => setPagina("login")}
        />
      );
    }

    return (
      <Login
        onLogin={entrar}
        onCadastro={() => setPagina("cadastro")}
      />
    );
  }


return (
  <Dashboard
    usuario={usuario}
    onSair={sair}
  />
);
}

export default App;
