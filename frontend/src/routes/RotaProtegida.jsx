import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RotaProtegida({ perfisPermitidos }) {
  const { usuario, carregando } = useAuth();
  const localizacao = useLocation();

  if (carregando) return <p>Restaurando sessão...</p>;
  if (!usuario) return <Navigate to="/login" replace state={{ de: localizacao }} />;
  if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default RotaProtegida;
