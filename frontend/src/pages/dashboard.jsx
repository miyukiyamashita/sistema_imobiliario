
function Dashboard({ usuario, onSair }) {
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
          <li key={opcao}>{opcao}</li>
        ))}
      </ul>

      <button onClick={onSair}>
        Sair da conta
      </button>
    </main>
  );
}

export default Dashboard;
