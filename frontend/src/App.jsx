
import { useState } from "react";
import Login from "./pages/Login";
import Cadastro from "./pages/cadastro";
import Dashboard from "./pages/dashboard";
import GerenciarImoveis from "./pages/GerenciarImoveis";
import { apiRequest } from "./services/api";
import FormularioImovel from "./pages/FormularioImovel";

function App() {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [pagina, setPagina] = useState("login");
  const [imovelSelecionado, setImovelSelecionado] = useState(null);

  async function entrar(novoToken) {
    const dadosUsuario = await apiRequest(
      "/usuarios/me",
      {},
      novoToken
    );

    setToken(novoToken);
    setUsuario(dadosUsuario);
    setPagina("dashboard");
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

  if (
    (pagina === "cadastrar-imovel" ||
      pagina === "editar-imovel") &&
    usuario.perfil === "CORRETOR_ADMIN"
  ) {
    return (
      <FormularioImovel
        token={token}
        imovel={imovelSelecionado}
        onVoltar={() => setPagina("gerenciar-imoveis")}
      />
    );
  }


  if (
    pagina === "gerenciar-imoveis" &&
    usuario.perfil === "CORRETOR_ADMIN"
  ) {
    return (
      <GerenciarImoveis
        token={token}
        onVoltar={() => setPagina("dashboard")}
        onCadastrar={() => {
          setImovelSelecionado(null);
          setPagina("cadastrar-imovel");
        }}
        onEditar={(imovel) => {
          setImovelSelecionado(imovel);
          setPagina("editar-imovel");
        }}

      />
    );
  }

  return (
    <Dashboard
      usuario={usuario}
      token={token}
      onSair={sair}
      onGerenciarImoveis={() => {
        if (usuario.perfil === "CORRETOR_ADMIN") {
          setPagina("gerenciar-imoveis");
        }
      }}
    />
  );
}

export default App;
