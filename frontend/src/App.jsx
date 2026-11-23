import { useState } from "react";
import { apiRequest } from "./services/api";
import Catalogo from "./pages/Catalogo";
import DetalhesImovel from "./pages/DetalhesImovel";
import Login from "./pages/Login";
import Cadastro from "./pages/cadastro";
import Dashboard from "./pages/dashboard";

function App() {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [pagina, setPagina] = useState("catalogo");
  const [imovelSelecionado, setImovelSelecionado] = useState(null);

  function navegar(destino) {
    setPagina(destino);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function entrar(novoToken) {
    const dadosUsuario = await apiRequest("/usuarios/me", {}, novoToken);
    setToken(novoToken);
    setUsuario(dadosUsuario);
    navegar("dashboard");
  }

  function entrarDemo() {
    setToken("demo-token");
    setUsuario({
      nome: "Mariana Alves",
      email: "mariana@futuraimoveis.com.br",
      perfil: "CLIENTE",
    });
    navegar("dashboard");
  }

  function sair() {
    setToken(null);
    setUsuario(null);
    navegar("catalogo");
  }

  function abrirDetalhes(imovel) {
    setImovelSelecionado(imovel);
    navegar("detalhes");
  }

  if (pagina === "detalhes") {
    return (
      <DetalhesImovel
        imovel={imovelSelecionado}
        onNavigate={navegar}
        usuario={usuario}
        token={token}
      />
    );
  }

  if (pagina === "cadastro") {
    return <Cadastro onNavigate={navegar} />;
  }

  if (pagina === "login") {
    return (
      <Login
        onLogin={entrar}
        onDemoLogin={entrarDemo}
        onNavigate={navegar}
      />
    );
  }

  if (pagina === "dashboard" && token && usuario) {
    return (
      <Dashboard
        usuario={usuario}
        token={token}
        onSair={sair}
        onNavigate={navegar}
      />
    );
  }

  return (
    <Catalogo
      onNavigate={navegar}
      onSelectImovel={abrirDetalhes}
      usuario={usuario}
    />
  );
}

export default App;
