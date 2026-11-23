import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

function AppLayout() {
  const { usuario, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const titulos = { "/dashboard": "Visão geral", "/imoveis": "Gerenciamento de imóveis", "/imoveis/novo": "Novo imóvel", "/meus-imoveis": "Meus imóveis", "/anunciar-imovel": "Anunciar imóvel", "/minhas-solicitacoes": "Minhas solicitações", "/solicitacoes-imoveis": "Solicitações pendentes", "/minhas-visitas": "Minhas visitas", "/solicitacoes-visita": "Solicitações de visitas" };
  const titulo = location.pathname.includes("/editar") ? "Editar imóvel" : (titulos[location.pathname] || "Sistema imobiliário");
  const iniciais = usuario?.nome?.split(" ").map((parte) => parte[0]).slice(0, 2).join("").toUpperCase();

  function logout() {
    sair();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <button className="mobile-menu-button" type="button" onClick={() => setMenuAberto(!menuAberto)} aria-label="Abrir menu">☰</button>
      <aside className={`sidebar ${menuAberto ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark">F</span><span>Futura <small>Imóveis</small></span></div>
        <nav aria-label="Navegação principal">
          <NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/dashboard"><span>⌂</span> Dashboard</NavLink>
          {usuario?.perfil === "CORRETOR_ADMIN" && <NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/imoveis"><span>▦</span> Gerenciar imóveis</NavLink>}
          {usuario?.perfil === "CORRETOR_ADMIN" && <NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/solicitacoes-imoveis"><span>✓</span> Solicitações pendentes</NavLink>}
          {usuario?.perfil === "CORRETOR_ADMIN" && <NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/solicitacoes-visita"><span>◷</span> Solicitações de visitas</NavLink>}
          {usuario?.perfil === "PROPRIETARIO" && <><NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/meus-imoveis"><span>⌂</span> Meus imóveis</NavLink><NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/anunciar-imovel"><span>+</span> Anunciar meu imóvel</NavLink><NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/minhas-solicitacoes"><span>◷</span> Minhas solicitações</NavLink></>}
          {usuario?.perfil === "CLIENTE" && <NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/minhas-visitas"><span>◷</span> Minhas visitas</NavLink>}
          <NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/imoveis/catalogo"><span>⌕</span> Catálogo público</NavLink>
          <NavLink onClick={() => setMenuAberto(false)} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} to="/notificacoes"><span>●</span> Notificações</NavLink>
        </nav>
        <div className="sidebar-footer"><p>Operação segura</p><span className="status-dot" /> Sessão ativa</div>
      </aside>
      {menuAberto && <button className="sidebar-overlay" type="button" onClick={() => setMenuAberto(false)} aria-label="Fechar menu" />}
      <div className="main-shell">
        <header className="app-header"><div><p className="eyebrow">PAINEL ADMINISTRATIVO</p><h1>{titulo}</h1></div><div className="header-user"><span className="avatar">{iniciais}</span><div><strong>{usuario?.nome}</strong><small>{usuario?.perfil}</small></div><Button variant="ghost" size="sm" onClick={logout}>Sair</Button></div></header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}

export default AppLayout;
