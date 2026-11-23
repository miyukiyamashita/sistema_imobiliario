import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/ToastProvider";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";

function SolicitacoesImoveis() {
  const { token } = useAuth();
  const { success, error } = useToast();
  const [items, setItems] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [operando, setOperando] = useState(false);

  const carregar = useCallback(async (estaAtivo = () => true) => {
    try {
      const dados = await apiRequest("/solicitacoes-imoveis", {}, token);
      if (estaAtivo()) setItems(dados);
    } catch (requestError) {
      if (estaAtivo()) {
        setItems([]);
        error(requestError.message);
      }
    }
  }, [token, error]);

  const cancelarRevisao = useCallback(() => {
    if (!operando) {
      setConfirm(null);
      setMotivo("");
    }
  }, [operando]);

  useEffect(() => {
    let ativo = true;
    carregar(() => ativo);
    return () => { ativo = false; };
  }, [carregar]);

  async function revisar() {
    if (confirm?.tipo === "rejeitar" && !motivo.trim()) {
      error("Informe a justificativa da rejeição.");
      return;
    }
    setOperando(true);
    try {
      const acao = confirm.tipo === "aprovar" ? "aprovar" : "rejeitar";
      const body = confirm.tipo === "rejeitar" ? { justificativa: motivo } : undefined;
      await apiRequest(`/solicitacoes-imoveis/${confirm.item.id}/${acao}`, { method: "PATCH", body }, token);
      success("Solicitação revisada com sucesso.");
      setConfirm(null);
      setMotivo("");
      await carregar();
    } catch (requestError) {
      error(requestError.message);
    } finally {
      setOperando(false);
    }
  }

  async function abrirDocumento(item, documento) {
    try {
      const resposta = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/solicitacoes-imoveis/${item.id}/documentos/${documento.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resposta.ok) throw new Error("Não foi possível acessar o documento.");
      const url = URL.createObjectURL(await resposta.blob());
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      error(requestError.message);
    }
  }

  if (!items) return <LoadingSpinner label="Carregando solicitações pendentes..." />;

  return <>
    <div className="page-intro"><div><p className="eyebrow">REVISÃO ADMINISTRATIVA</p><h2>Solicitações pendentes</h2><p>Analise os documentos antes de aprovar ou rejeitar um anúncio.</p></div></div>
    <Card>{items.length === 0 ? <EmptyState title="Nenhuma solicitação pendente" description="Novos envios de proprietários aparecerão aqui." /> : <div className="request-list">{items.map((item) => <article className="request-item" key={item.id}><div><Badge variant="warning">EM ANÁLISE</Badge><h3>{item.imovel.tipo} · {item.imovel.cidade}</h3><p>{item.imovel.bairro} · {item.imovel.finalidade === "VENDA" ? "Venda" : "Locação"} · {Number(item.imovel.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><p>{item.documentos.length} documento(s) anexado(s)</p><div className="actions">{item.documentos.map((documento) => <Button key={documento.id} size="sm" variant="ghost" onClick={() => abrirDocumento(item, documento)}>Ver {documento.nome_original}</Button>)}</div></div><div className="actions"><Button size="sm" onClick={() => setConfirm({ tipo: "aprovar", item })}>Aprovar</Button><Button size="sm" variant="danger" onClick={() => setConfirm({ tipo: "rejeitar", item })}>Rejeitar</Button></div></article>)}</div>}</Card>
    <ConfirmModal open={Boolean(confirm)} title={confirm?.tipo === "aprovar" ? "Aprovar solicitação?" : "Rejeitar solicitação?"} description={confirm?.tipo === "aprovar" ? "O imóvel será publicado conforme as regras comerciais atuais." : "Informe o motivo que será comunicado ao proprietário."} confirmLabel={confirm?.tipo === "aprovar" ? "Aprovar" : "Rejeitar"} destructive={confirm?.tipo === "rejeitar"} loading={operando} onConfirm={revisar} onCancel={cancelarRevisao}>{confirm?.tipo === "rejeitar" && <textarea className="textarea" aria-label="Justificativa obrigatória da rejeição" value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Justificativa obrigatória" rows="4" />}</ConfirmModal>
  </>;
}

export default SolicitacoesImoveis;
