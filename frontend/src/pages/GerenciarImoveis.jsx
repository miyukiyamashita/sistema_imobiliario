import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/ToastProvider";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";

function statusDoImovel(imovel) {
  if (!imovel.ativo) return { label: "Inativo", variant: "danger" };
  if (imovel.publicado) return { label: "Publicado", variant: "success" };
  return { label: "Rascunho", variant: "warning" };
}

function GerenciarImoveis() {
  const { token } = useAuth();
  const { success, error: notificarErro } = useToast();
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState([]);
  const [fotos, setFotos] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [carregandoFotos, setCarregandoFotos] = useState({});
  const [operacao, setOperacao] = useState("");
  const [erro, setErro] = useState("");
  const [confirmacao, setConfirmacao] = useState(null);

  const carregarImoveis = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try { setImoveis(await apiRequest("/imoveis", {}, token)); }
    catch (requestError) { setErro(requestError.message); }
    finally { setCarregando(false); }
  }, [token]);

  useEffect(() => { carregarImoveis(); }, [carregarImoveis]);

  async function carregarFotos(imovelId) {
    setFotos((anterior) => ({ ...anterior, [imovelId]: [] }));
    setCarregandoFotos((anterior) => ({ ...anterior, [imovelId]: true }));
    try {
      const dados = await apiRequest(`/imoveis/${imovelId}/fotos`, {}, token);
      setFotos((anterior) => ({ ...anterior, [imovelId]: dados }));
    } catch (requestError) { notificarErro(requestError.message); }
    finally { setCarregandoFotos((anterior) => ({ ...anterior, [imovelId]: false })); }
  }

  function alternarFotos(imovel) {
    if (fotos[imovel.id]) {
      setFotos((anterior) => { const atualizado = { ...anterior }; delete atualizado[imovel.id]; return atualizado; });
    } else carregarFotos(imovel.id);
  }

  async function publicar(imovel) {
    setOperacao(`publicar-${imovel.id}`);
    try { await apiRequest(`/imoveis/${imovel.id}/publicar`, { method: "PATCH" }, token); success(`Imóvel #${imovel.id} publicado com sucesso.`); await carregarImoveis(); }
    catch (requestError) { notificarErro(requestError.message); }
    finally { setOperacao(""); }
  }

  async function inativar(imovel) {
    setOperacao(`inativar-${imovel.id}`);
    try { await apiRequest(`/imoveis/${imovel.id}/inativar`, { method: "PATCH" }, token); success(`Imóvel #${imovel.id} inativado com sucesso.`); await carregarImoveis(); }
    catch (requestError) { notificarErro(requestError.message); }
    finally { setOperacao(""); }
  }

  async function excluir(imovel) {
    setOperacao(`excluir-${imovel.id}`);
    try {
      await apiRequest(`/imoveis/${imovel.id}`, { method: "DELETE" }, token);
      success(`Imóvel #${imovel.id} excluído com sucesso.`);
      await carregarImoveis();
      setFotos((anterior) => { const atualizado = { ...anterior }; delete atualizado[imovel.id]; return atualizado; });
    } catch (requestError) { notificarErro(requestError.message); }
    finally { setOperacao(""); }
  }

  async function enviarFoto(event, imovel) {
    const arquivo = event.target.files[0];
    event.target.value = "";
    if (!arquivo) return;
    const dados = new FormData();
    dados.append("arquivo", arquivo);
    setOperacao(`foto-${imovel.id}`);
    try {
      await apiRequest(`/imoveis/${imovel.id}/fotos`, { method: "POST", body: dados }, token);
      success("Fotografia adicionada com sucesso.");
      await carregarFotos(imovel.id);
      await carregarImoveis();
    } catch (requestError) { notificarErro(requestError.message); }
    finally { setOperacao(""); }
  }

  async function excluirFoto(imovel, foto) {
    setOperacao(`excluir-foto-${foto.id}`);
    try {
      await apiRequest(`/imoveis/${imovel.id}/fotos/${foto.id}`, { method: "DELETE" }, token);
      success("Fotografia excluída com sucesso.");
      await carregarFotos(imovel.id);
      await carregarImoveis();
    } catch (requestError) { notificarErro(requestError.message); }
    finally { setOperacao(""); }
  }

  function pedirConfirmacao(tipo, imovel, foto = null) { setConfirmacao({ tipo, imovel, foto }); }
  function fecharConfirmacao() { if (!operacao) setConfirmacao(null); }
  async function confirmar() {
    const { tipo, imovel, foto } = confirmacao;
    try {
      if (tipo === "publicar") await publicar(imovel);
      if (tipo === "inativar") await inativar(imovel);
      if (tipo === "excluir") await excluir(imovel);
      if (tipo === "excluir-foto") await excluirFoto(imovel, foto);
    } finally {
      setConfirmacao(null);
    }
  }

  function formatarValor(valor) { return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function textoConfirmacao() {
    if (!confirmacao) return null;
    const { tipo, imovel, foto } = confirmacao;
    if (tipo === "publicar") return { title: "Publicar imóvel?", description: `O imóvel #${imovel.id} ficará disponível no catálogo público.`, confirmLabel: "Publicar", destructive: false };
    if (tipo === "inativar") return { title: "Inativar imóvel?", description: `O imóvel #${imovel.id} será retirado do catálogo. Esta ação também permite sua exclusão posterior.`, confirmLabel: "Inativar", destructive: true };
    if (tipo === "excluir") return { title: "Excluir imóvel permanentemente?", description: `O imóvel #${imovel.id} e suas fotografias serão removidos. Esta ação não pode ser desfeita.`, confirmLabel: "Excluir imóvel", destructive: true };
    return { title: "Excluir fotografia?", description: `A fotografia ${foto.nome_arquivo} será removida permanentemente.`, confirmLabel: "Excluir fotografia", destructive: true };
  }

  const detalhesConfirmacao = textoConfirmacao();

  return (
    <>
      <div className="page-intro"><div><p className="eyebrow">CARTEIRA DE IMÓVEIS</p><h2>Gerenciar imóveis</h2><p>Publique, atualize e organize os imóveis da sua operação.</p></div><Link to="/imoveis/novo" className="button button-primary button-md">+ Novo imóvel</Link></div>
      {erro && <p className="inline-message inline-error" role="alert">{erro}</p>}
      <Card className="table-card">
        {carregando ? <div className="empty-state"><LoadingSpinner label="Carregando imóveis..." /></div> : imoveis.length === 0 ? <EmptyState title="Nenhum imóvel cadastrado" description="Comece adicionando o primeiro imóvel à sua carteira." action={<Link to="/imoveis/novo" className="button button-primary button-md">Cadastrar imóvel</Link>} /> : <div className="table-wrap"><table className="property-table"><thead><tr><th>Imóvel</th><th>Localização</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>{imoveis.map((imovel) => {
          const status = statusDoImovel(imovel);
          const ocupado = Boolean(operacao && operacao.includes(`-${imovel.id}`));
          const publicavel = imovel.ativo && !imovel.publicado;
          return <tr key={imovel.id}><td><strong>{imovel.tipo}</strong><div className="property-id">#{imovel.id} · {imovel.finalidade === "VENDA" ? "Venda" : "Locação"}</div></td><td className="property-address">{imovel.logradouro}, {imovel.numero}<br />{imovel.bairro} · {imovel.cidade}/{imovel.estado}</td><td><strong>{formatarValor(imovel.valor)}</strong><br /><span className="property-id">{imovel.area} m²</span></td><td><Badge variant={status.variant}>{status.label}</Badge><div className="property-id">{imovel.situacao_comercial}</div></td><td><div className="actions"><Button size="sm" variant="secondary" onClick={() => navigate(`/imoveis/${imovel.id}/editar`)} disabled={!imovel.ativo || Boolean(operacao)}>Editar</Button>{publicavel && <Button size="sm" onClick={() => pedirConfirmacao("publicar", imovel)} disabled={Boolean(operacao)}>{ocupado ? "Publicando..." : "Publicar"}</Button>}{imovel.ativo && <Button size="sm" variant="ghost" onClick={() => pedirConfirmacao("inativar", imovel)} disabled={Boolean(operacao)}>{ocupado ? "Processando..." : "Inativar"}</Button>}{!imovel.ativo && !imovel.publicado && <Button size="sm" variant="danger" onClick={() => pedirConfirmacao("excluir", imovel)} disabled={Boolean(operacao)}>{ocupado ? "Excluindo..." : "Excluir"}</Button>}<Button size="sm" variant="ghost" onClick={() => alternarFotos(imovel)} disabled={Boolean(operacao)}>{fotos[imovel.id] ? "Ocultar fotos" : "Fotos"}</Button></div>{fotos[imovel.id] && <div className="photo-panel"><h4>Galeria de fotografias</h4><label className="photo-upload">Adicionar JPG, PNG ou WEBP (até 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => enviarFoto(event, imovel)} disabled={Boolean(operacao) || !imovel.ativo} /></label>{carregandoFotos[imovel.id] ? <LoadingSpinner label="Carregando fotos..." /> : fotos[imovel.id].length === 0 ? <p>Nenhuma fotografia cadastrada.</p> : <div className="photo-gallery">{fotos[imovel.id].map((foto) => <figure className="photo-item" key={foto.id}>{imovel.ativo && imovel.publicado ? <img src={`${API_URL}/imoveis/publicos/${imovel.id}/fotos/${foto.id}`} alt={`Fotografia do imóvel ${imovel.id}`} /> : <div className="photo-placeholder">Disponível após publicar</div>}<figcaption title={foto.nome_arquivo}>{foto.nome_arquivo}</figcaption><button type="button" onClick={() => pedirConfirmacao("excluir-foto", imovel, foto)} disabled={Boolean(operacao)}>{operacao === `excluir-foto-${foto.id}` ? "Excluindo..." : "Excluir foto"}</button></figure>)}</div>}</div>}</td></tr>;
        })}</tbody></table></div>}
      </Card>
      <ConfirmModal open={Boolean(confirmacao)} {...(detalhesConfirmacao || {})} loading={Boolean(operacao)} onConfirm={confirmar} onCancel={fecharConfirmacao} />
    </>
  );
}

export default GerenciarImoveis;
