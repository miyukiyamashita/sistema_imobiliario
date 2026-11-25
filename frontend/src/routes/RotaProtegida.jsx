import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function RotaProtegida({ perfis = [], children }) {
  const { autenticado, inicializando, perfil } = useAuth();
  const location = useLocation();

  if (inicializando) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <p role="status" className="text-sm text-slate-500">
          Restaurando sua sessão...
        </p>
      </main>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (perfis.length && !perfis.includes(perfil)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}
