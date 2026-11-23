import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Cadastro from "../pages/cadastro";
import Dashboard from "../pages/dashboard";
import GerenciarImoveis from "../pages/GerenciarImoveis";
import FormularioImovel from "../pages/FormularioImovel";
import RotaProtegida from "./RotaProtegida";
import AppLayout from "../components/layout/AppLayout";
import CatalogoPublico from "../pages/CatalogoPublico";
import DetalheImovelPublico from "../pages/DetalheImovelPublico";
import AnunciarImovel from "../pages/AnunciarImovel";
import MeusImoveis from "../pages/MeusImoveis";
import MinhasSolicitacoes from "../pages/MinhasSolicitacoes";
import SolicitacoesImoveis from "../pages/SolicitacoesImoveis";
import Notificacoes from "../pages/Notificacoes";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/imoveis/catalogo" element={<CatalogoPublico />} />
      <Route path="/imoveis/catalogo/:id" element={<DetalheImovelPublico />} />
      <Route element={<RotaProtegida />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route element={<RotaProtegida perfisPermitidos={["PROPRIETARIO"]} />}>
            <Route path="/meus-imoveis" element={<MeusImoveis />} />
            <Route path="/anunciar-imovel" element={<AnunciarImovel />} />
            <Route path="/minhas-solicitacoes" element={<MinhasSolicitacoes />} />
          </Route>
          <Route element={<RotaProtegida perfisPermitidos={["CORRETOR_ADMIN"]} />}>
            <Route path="/solicitacoes-imoveis" element={<SolicitacoesImoveis />} />
          </Route>
          <Route element={<RotaProtegida perfisPermitidos={["CORRETOR_ADMIN"]} />}>
            <Route path="/imoveis" element={<GerenciarImoveis />} />
            <Route path="/imoveis/novo" element={<FormularioImovel />} />
            <Route path="/imoveis/:id/editar" element={<FormularioImovel />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
