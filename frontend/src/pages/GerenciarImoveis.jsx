import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

function GerenciarImoveis() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState([]);
  const [fotos, setFotos] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [carregandoFotos, setCarregandoFotos] = useState({});
  const [operacao, setOperacao] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregarImoveis = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      setImoveis(await apiRequest("/imoveis", {}, token));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => { carregarImoveis(); }, [carregarImoveis]);

  async function carregarFotos(imovelId) {
    setFotos((anterior) => ({ ...anterior, [imovelId]: [] }));
    setCarregandoFotos((anterior) => ({ ...anterior, [imovelId]: true }));
    setErro("");
    try {
      const dados = await apiRequest(`/imoveis/${imovelId}/fotos`, {}, token);
      setFotos((anterior) => ({ ...anterior, [imovelId]: dados }));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregandoFotos((anterior) => ({ ...anterior, [imovelId]: false }));
    }
  }

  function alternarFotos(imovel) {
    if (fotos[imovel.id]) {
      setFotos((anterior) => {
        const atualizado = { ...anterior };
        delete atualizado[imovel.id];
        return atualizado;
      });
    } else {
      carregarFotos(imovel.id);
    }
  }

  async function publicar(imovel) {
    setOperacao(`publicar-${imovel.id}`);
    setErro("");
    setMensagem("");
    try {
      await apiRequest(`/imoveis/${imovel.id}/publicar`, { method: "PATCH" }, token);
      setMensagem(`Imóvel #${imovel.id} publicado com sucesso.`);
      await carregarImoveis();
    } catch (error) {
      setErro(error.message);
    } finally {
      setOperacao("");
    }
  }

  async function inativar(imovel) {
    if (!window.confirm(`Deseja inativar o imóvel #${imovel.id}?`)) return;
    setOperacao(`inativar-${imovel.id}`);
    setErro("");
    setMensagem("");
    try {
      await apiRequest(`/imoveis/${imovel.id}/inativar`, { method: "PATCH" }, token);
      setMensagem(`Imóvel #${imovel.id} inativado com sucesso.`);
      await carregarImoveis();
    } catch (error) {
      setErro(error.message);
    } finally {
      setOperacao("");
    }
  }

  async function excluir(imovel) {
    if (!window.confirm(`A exclusão do imóvel #${imovel.id} é permanente. Confirmar?`)) return;
    setOperacao(`excluir-${imovel.id}`);
    setErro("");
    setMensagem("");
    try {
      await apiRequest(`/imoveis/${imovel.id}`, { method: "DELETE" }, token);
      setMensagem(`Imóvel #${imovel.id} excluído com sucesso.`);
      await carregarImoveis();
      setFotos((anterior) => {
        const atualizado = { ...anterior };
        delete atualizado[imovel.id];
        return atualizado;
      });
    } catch (error) {
      setErro(error.message);
    } finally {
      setOperacao("");
    }
  }

  async function enviarFoto(event, imovel) {
    const arquivo = event.target.files[0];
    event.target.value = "";
    if (!arquivo) return;
    const dados = new FormData();
    dados.append("arquivo", arquivo);
    setOperacao(`foto-${imovel.id}`);
    setErro("");
    setMensagem("");
    try {
      await apiRequest(`/imoveis/${imovel.id}/fotos`, { method: "POST", body: dados }, token);
      setMensagem("Fotografia adicionada com sucesso.");
      await carregarFotos(imovel.id);
      await carregarImoveis();
    } catch (error) {
      setErro(error.message);
    } finally {
      setOperacao("");
    }
  }

  async function excluirFoto(imovel, foto) {
    if (!window.confirm("Deseja excluir esta fotografia?")) return;
    setOperacao(`excluir-foto-${foto.id}`);
    setErro("");
    setMensagem("");
    try {
      await apiRequest(`/imoveis/${imovel.id}/fotos/${foto.id}`, { method: "DELETE" }, token);
      setMensagem("Fotografia excluída com sucesso.");
      await carregarFotos(imovel.id);
      await carregarImoveis();
    } catch (error) {
      setErro(error.message);
    } finally {
      setOperacao("");
    }
  }

  function formatarValor(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function urlFoto(imovel, foto) {
    return `${API_URL}/imoveis/publicos/${imovel.id}/fotos/${foto.id}`;
  }

  return (
    <main>
      <h1>Gerenciamento de Imóveis</h1>
      <p>Consulte e administre os imóveis cadastrados no sistema.</p>
      <p><Link to="/dashboard">Voltar ao painel</Link>{" | "}<Link to="/imoveis/novo">Cadastrar novo imóvel</Link></p>
      <button onClick={carregarImoveis} disabled={carregando || Boolean(operacao)}>Atualizar listagem</button>

      {mensagem && <p role="status" style={{ color: "green" }}>{mensagem}</p>}
      {erro && <p role="alert" style={{ color: "red" }}>Erro: {erro}</p>}
      {carregando && <p>Carregando imóveis...</p>}
      {!carregando && !erro && imoveis.length === 0 && <p>Nenhum imóvel cadastrado.</p>}

      {!carregando && imoveis.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>ID</th><th>Tipo</th><th>Finalidade</th><th>Endereço</th><th>Valor</th><th>Situação</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {imoveis.map((imovel) => {
                const ocupado = Boolean(operacao && operacao.endsWith(`-${imovel.id}`));
                const podePublicar = imovel.ativo && !imovel.publicado;
                const podeInativar = imovel.ativo;
                const podeExcluir = !imovel.ativo && !imovel.publicado;
                return (
                  <tr key={imovel.id}>
                    <td>{imovel.id}</td>
                    <td>{imovel.tipo}</td>
                    <td>{imovel.finalidade}</td>
                    <td>{imovel.logradouro}, {imovel.numero} - {imovel.bairro} - {imovel.cidade}/{imovel.estado}</td>
                    <td>{formatarValor(imovel.valor)}</td>
                    <td>{imovel.situacao_comercial}</td>
                    <td>{imovel.ativo ? (imovel.publicado ? "Publicado" : "Ativo") : "Inativo"}</td>
                    <td>
                      <button onClick={() => navigate(`/imoveis/${imovel.id}/editar`)} disabled={!imovel.ativo || Boolean(operacao)}>Editar</button>{" "}
                      {podePublicar && <button onClick={() => publicar(imovel)} disabled={ocupado || Boolean(operacao)}>{ocupado ? "Publicando..." : "Publicar"}</button>}{" "}
                      {podeInativar && <button onClick={() => inativar(imovel)} disabled={ocupado || Boolean(operacao)}>{ocupado ? "Processando..." : "Inativar"}</button>}{" "}
                      {podeExcluir && <button onClick={() => excluir(imovel)} disabled={ocupado || Boolean(operacao)}>{ocupado ? "Excluindo..." : "Excluir"}</button>}{" "}
                      <button onClick={() => alternarFotos(imovel)} disabled={Boolean(operacao)}>{fotos[imovel.id] ? "Ocultar fotos" : "Gerenciar fotos"}</button>

                      {fotos[imovel.id] && <section aria-label={`Fotos do imóvel ${imovel.id}`}>
                        <h4>Fotografias</h4>
                        <label>Adicionar fotografia (JPG, PNG ou WEBP, até 5 MB)
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => enviarFoto(event, imovel)} disabled={Boolean(operacao) || !imovel.ativo} />
                        </label>
                        {carregandoFotos[imovel.id] && <p>Carregando fotografias...</p>}
                        {!carregandoFotos[imovel.id] && fotos[imovel.id].length === 0 && <p>Nenhuma fotografia cadastrada.</p>}
                        <div>{fotos[imovel.id].map((foto) => <figure key={foto.id}>
                          {imovel.ativo && imovel.publicado ? <img src={urlFoto(imovel, foto)} alt={`Fotografia do imóvel ${imovel.id}`} width="160" /> : <figcaption>Prévia disponível após a publicação.</figcaption>}
                          <figcaption>{foto.nome_arquivo}</figcaption>
                          <button onClick={() => excluirFoto(imovel, foto)} disabled={Boolean(operacao)}>{operacao === `excluir-foto-${foto.id}` ? "Excluindo..." : "Excluir fotografia"}</button>
                        </figure>)}</div>
                      </section>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default GerenciarImoveis;
