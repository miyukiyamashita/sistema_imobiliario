
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { usuario, sair } = useAuth();
  const funcionalidades = {
    CLIENTE: [
      "Consultar imóveis",
      "Minhas visitas",
      "Minhas propostas",
    ],
    PROPRIETARIO: [
      "Meus imóveis",
      "Cadastrar imóvel",
      "Acompanhar propostas",
    ],
    CORRETOR_ADMIN: [
      "Gerenciar imóveis",
      "Gerenciar visitas",
      "Gerenciar propostas",
      "Gerenciar contratos",
    ],
  };

  const opcoes = funcionalidades[usuario.perfil] || [];

  return (
    <main>
      <h1>Sistema Imobiliário</h1>

      <h2>Bem-vindo(a), {usuario.nome}!</h2>

      <p>
        <strong>E-mail:</strong> {usuario.email}
      </p>

      <p>
        <strong>Perfil:</strong> {usuario.perfil}
      </p>

      <h3>Funcionalidades disponíveis</h3>

      <ul>
        {opcoes.map((opcao) => (
          <li key={opcao}>
            {opcao === "Gerenciar imóveis" ? (
              <Link to="/imoveis">
                {opcao}
              </Link>
            ) : (
              opcao
            )}
          </li>
        ))}
      </ul>

      <button onClick={sair}>
        Sair da conta
      </button>
    </main>
  );
}

export default Dashboard;
