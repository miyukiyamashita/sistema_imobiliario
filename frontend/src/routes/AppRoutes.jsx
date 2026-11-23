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
