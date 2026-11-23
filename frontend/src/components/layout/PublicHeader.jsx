import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function PublicHeader() {
  const { token, usuario, carregando, sair } = useAuth();
  const navigate = useNavigate();
  const sessaoEmRestauracao = Boolean(token && carregando);

  function logout() {
    sair();
    navigate("/login", { replace: true });
  }

  return (
    <header className="public-header">
      <Link className="public-brand" to="/imoveis/catalogo">
        <span className="brand-mark">F</span>
        <span>Futura <small>Imóveis</small></span>
      </Link>

      {sessaoEmRestauracao && <span className="public-session-loading" role="status">Restaurando sessão...</span>}

      {!sessaoEmRestauracao && usuario && (
        <div className="public-auth-navigation">
          <nav aria-label="Navegação da conta">
            <Link to="/dashboard">Dashboard</Link>
            {usuario.perfil === "CLIENTE" && <Link to="/minhas-visitas">Minhas visitas</Link>}
            {usuario.perfil === "PROPRIETARIO" && <Link to="/meus-imoveis">Meus imóveis</Link>}
            {usuario.perfil === "CORRETOR_ADMIN" && <Link to="/imoveis">Gerenciar imóveis</Link>}
          </nav>
          <span className="public-user-name">{usuario.nome}</span>
          <button className="public-header-action" type="button" onClick={logout}>Sair</button>
        </div>
      )}

      {!sessaoEmRestauracao && !usuario && (
        <div className="public-guest-navigation">
          <Link className="public-header-link" to="/login">Acessar conta</Link>
          <Link className="public-header-link public-header-register" to="/cadastro">Criar conta</Link>
        </div>
      )}
    </header>
  );
}

export default PublicHeader;
