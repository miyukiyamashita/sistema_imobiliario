import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Catalogo from "../pages/Catalogo";
import Cadastro from "../pages/cadastro";
import DetalhesImovel from "../pages/DetalhesImovel";
import Login from "../pages/Login";
import Dashboard from "../pages/dashboard";
import RotaProtegida from "./RotaProtegida";

function navegarPara(navigate, destino) {
  const destinos = {
    catalogo: "/imoveis/catalogo",
    login: "/login",
    cadastro: "/cadastro",
    dashboard: "/dashboard",
    agenda: "/agenda-visitas",
    propostas: "/propostas",
  };
  navigate(destinos[destino] || destino);
}

function CatalogoRota() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  return (
    <Catalogo
      usuario={usuario}
      onNavigate={(destino) => navegarPara(navigate, destino)}
      onSelectImovel={(imovel) =>
        navigate(`/imoveis/${imovel.id}`, { state: { imovel } })
      }
    />
  );
}

function DetalhesRota() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { token, usuario } = useAuth();
  return (
    <DetalhesImovel
      imovel={location.state?.imovel || null}
      imovelId={id}
      token={token}
      usuario={usuario}
      onNavigate={(destino) => navegarPara(navigate, destino)}
    />
  );
}

function LoginRota() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const destino = location.state?.from;
  const caminhoSeguro = destino?.pathname?.startsWith("/")
    ? `${destino.pathname}${destino.search || ""}${destino.hash || ""}`
    : "/dashboard";

  async function realizarLogin(accessToken) {
    await login(accessToken);
    navigate(caminhoSeguro, { replace: true });
  }

  return (
    <Login
      onLogin={realizarLogin}
      onNavigate={(destinoAtual) => navegarPara(navigate, destinoAtual)}
    />
  );
}

function CadastroRota() {
  const navigate = useNavigate();
  return <Cadastro onNavigate={(destino) => navegarPara(navigate, destino)} />;
}

function DashboardRota({ active }) {
  const navigate = useNavigate();
  const { usuario, token, logout } = useAuth();
  return (
    <Dashboard
      usuario={usuario}
      token={token}
      activeInicial={active}
      onSair={() => {
        logout();
        navigate("/imoveis/catalogo", { replace: true });
      }}
      onNavigate={(destino) => navegarPara(navigate, destino)}
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/imoveis/catalogo" replace />} />
      <Route path="/imoveis/catalogo" element={<CatalogoRota />} />
      <Route path="/imoveis/catalogo/:id" element={<DetalhesRota />} />
      <Route path="/imoveis/:id" element={<DetalhesRota />} />
      <Route path="/login" element={<LoginRota />} />
      <Route path="/cadastro" element={<CadastroRota />} />
      <Route element={<RotaProtegida perfis={["CLIENTE", "PROPRIETARIO", "CORRETOR_ADMIN"]} />}>
        <Route path="/dashboard" element={<DashboardRota active="Visão Geral" />} />
      </Route>
      <Route element={<RotaProtegida perfis={["CLIENTE", "CORRETOR_ADMIN"]} />}>
        <Route path="/agenda-visitas" element={<DashboardRota active="Agenda de Visitas" />} />
      </Route>
      <Route element={<RotaProtegida perfis={["CLIENTE", "PROPRIETARIO", "CORRETOR_ADMIN"]} />}>
        <Route path="/propostas" element={<DashboardRota active="Gerenciar Propostas" />} />
      </Route>
      <Route path="*" element={<Navigate to="/imoveis/catalogo" replace />} />
    </Routes>
  );
}
