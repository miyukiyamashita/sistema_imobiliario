import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

function Dashboard() {
  const { usuario, sair } = useAuth();
  const admin = usuario.perfil === "CORRETOR_ADMIN";
  const perfilLabel = { CLIENTE: "Cliente", PROPRIETARIO: "Proprietário", CORRETOR_ADMIN: "Corretor administrador" }[usuario.perfil] || usuario.perfil;

  return (
    <>
      <div className="page-intro"><div><h2>Olá, {usuario.nome.split(" ")[0]} 👋</h2><p>Acompanhe sua operação e acesse seus principais recursos.</p></div><Badge variant="success">Sessão ativa</Badge></div>
      <div className="dashboard-grid">
        <Card className="welcome-card"><h2>Bem-vindo ao seu painel</h2><p>Tenha uma visão organizada das ferramentas disponíveis para o seu perfil.</p></Card>
        <Card className="profile-card"><p className="eyebrow">SEU PERFIL</p><dl><dt>Nome</dt><dd>{usuario.nome}</dd><dt>E-mail</dt><dd>{usuario.email}</dd><dt>Tipo de acesso</dt><dd>{perfilLabel}</dd></dl></Card>
      </div>
      <Card className="shortcut-card"><p className="eyebrow">ACESSO RÁPIDO</p><h3>O que você deseja fazer?</h3><p>Selecione uma área para continuar.</p>
        <div className="feature-list">
          {admin && <Link className="feature-link" to="/imoveis">Gerenciar imóveis<span>Cadastro, publicação e fotos →</span></Link>}
          <div className="feature-link">Consultar imóveis<span>Catálogo imobiliário</span></div>
          <div className="feature-link">Minhas propostas<span>Em breve</span></div>
          <div className="feature-link">Minhas visitas<span>Em breve</span></div>
        </div>
      </Card>
      <div className="dashboard-logout"><Button variant="ghost" onClick={sair}>Sair da conta</Button></div>
    </>
  );
}

export default Dashboard;
