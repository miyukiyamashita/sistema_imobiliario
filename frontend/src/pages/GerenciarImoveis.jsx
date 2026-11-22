
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

function GerenciarImoveis() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarImoveis = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const dados = await apiRequest(
        "/imoveis",
        {},
        token
    );

      setImoveis(dados);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregarImoveis();
  }, [carregarImoveis]);

  function formatarValor(valor) {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <main>
      <h1>Gerenciamento de Imóveis</h1>

      <p>
        Consulte os imóveis cadastrados no sistema.
      </p>

      <Link to="/dashboard">Voltar ao painel</Link>

      <Link to="/imoveis/novo">
        Cadastrar novo imóvel
      </Link>

      <button
        onClick={carregarImoveis}
        disabled={carregando}
      >
        Atualizar listagem
      </button>

      {carregando && (
        <p>Carregando imóveis...</p>
      )}

      {erro && (
        <p role="alert" style={{ color: "red" }}>
          Erro: {erro}
        </p>
      )}

      {!carregando && !erro && imoveis.length === 0 && (
        <p>Nenhum imóvel cadastrado.</p>
      )}

      {!carregando && !erro && imoveis.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Finalidade</th>
                <th>Endereço</th>
                <th>Valor</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {imoveis.map((imovel) => (
                <tr key={imovel.id}>
                  <td>{imovel.id}</td>
                  <td>{imovel.tipo}</td>
                  <td>{imovel.finalidade}</td>

                  <td>
                    {imovel.logradouro}, {imovel.numero}
                    {" - "}
                    {imovel.bairro}
                    {" - "}
                    {imovel.cidade}/{imovel.estado}
                  </td>

                  <td>
                    {formatarValor(imovel.valor)}
                  </td>

                  <td>
                    {imovel.situacao_comercial}
                  </td>

                  <td>
                    <button
                      onClick={() => navigate(`/imoveis/${imovel.id}/editar`)}
                    >
                      Editar
                    </button>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default GerenciarImoveis;
