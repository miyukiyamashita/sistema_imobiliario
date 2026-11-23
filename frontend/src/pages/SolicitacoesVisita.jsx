import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/ToastProvider";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/ui/ConfirmModal";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const STATUS_LABELS = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  RECUSADA: "Recusada",
  CANCELADA: "Cancelada",
};

const STATUS_VARIANTS = {
  PENDENTE: "warning",
  CONFIRMADA: "success",
  RECUSADA: "danger",
  CANCELADA: "neutral",
};

function formatarData(data) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function SolicitacoesVisita() {
  const { token } = useAuth();
  const { success, error } = useToast();
  const [visitas, setVisitas] = useState(null);
  const [statusFiltro, setStatusFiltro] = useState("");
  const [acao, setAcao] = useState(null);
  const [justificativa, setJustificativa] = useState("");
  const [processando, setProcessando] = useState(false);
  const justificativaRef = useRef(null);

  const carregar = useCallback(async (estaAtivo = () => true) => {
    try {
      const query = statusFiltro ? `?status=${encodeURIComponent(statusFiltro)}` : "";
      const dados = await apiRequest(`/solicitacoes-visita${query}`, {}, token);
      if (estaAtivo()) setVisitas(dados);
    } catch (requestError) {
      if (estaAtivo()) {
        setVisitas([]);
        error(requestError.message);
      }
    }
  }, [error, statusFiltro, token]);

  useEffect(() => {
    let ativo = true;
    setVisitas(null);
    carregar(() => ativo);
    return () => { ativo = false; };
  }, [carregar]);

  const fecharAcao = useCallback(() => {
    if (!processando) {
      setAcao(null);
      setJustificativa("");
    }
  }, [processando]);

  function abrirAcao(tipo, visita) {
    setJustificativa("");
    setAcao({ tipo, visita });
  }

  async function executarAcao() {
    const exigeJustificativa = acao?.tipo === "recusar" || acao?.tipo === "cancelar";
    if (exigeJustificativa && !justificativa.trim()) {
      error("Informe uma justificativa para esta ação.");
      return;
    }

    const endpoint = `/solicitacoes-visita/${acao.visita.id}/${acao.tipo}`;
    setProcessando(true);
    try {
      await apiRequest(endpoint, {
        method: "PATCH",
        body: exigeJustificativa ? { justificativa: justificativa.trim() } : undefined,
      }, token);
      success(`Solicitação ${STATUS_LABELS[acao.tipo === "confirmar" ? "CONFIRMADA" : acao.tipo === "recusar" ? "RECUSADA" : "CANCELADA"].toLowerCase()} com sucesso.`);
      setAcao(null);
      setJustificativa("");
      await carregar();
    } catch (requestError) {
      error(requestError.message);
    } finally {
      setProcessando(false);
    }
  }

  if (!visitas) return <LoadingSpinner label="Carregando solicitações de visitas..." />;

  return <>
    <div className="page-intro">
      <div><p className="eyebrow">REVISÃO ADMINISTRATIVA</p><h2>Solicitações de visitas</h2><p>Confirme, recuse ou cancele solicitações de clientes.</p></div>
      <div className="field filter-status"><label htmlFor="filtro-status-visita">Filtrar por status</label><select id="filtro-status-visita" value={statusFiltro} onChange={(event) => setStatusFiltro(event.target.value)}><option value="">Todos</option><option value="PENDENTE">Pendentes</option><option value="CONFIRMADA">Confirmadas</option><option value="RECUSADA">Recusadas</option><option value="CANCELADA">Canceladas</option></select></div>
    </div>
    <Card>{visitas.length === 0 ? <EmptyState title="Nenhuma solicitação encontrada" description="Não há solicitações para o filtro selecionado." /> : <div className="request-list">{visitas.map((visita) => {
      const podeConfirmar = visita.status === "PENDENTE";
      const podeRecusar = visita.status === "PENDENTE";
      const podeCancelar = visita.status === "PENDENTE" || visita.status === "CONFIRMADA";
      return <article className="request-item" key={visita.id}><div><Badge variant={STATUS_VARIANTS[visita.status]}>{STATUS_LABELS[visita.status]}</Badge><h3>{visita.imovel.tipo} · {visita.imovel.cidade}</h3><p><strong>Cliente:</strong> {visita.cliente?.nome} · {visita.cliente?.email}</p><p><strong>Data:</strong> {formatarData(visita.data_visita)} às {visita.horario_visita.slice(0, 5)}</p>{visita.observacoes && <p><strong>Observações:</strong> {visita.observacoes}</p>}{visita.decidido_em && <p><strong>Decidida em:</strong> {new Date(visita.decidido_em).toLocaleString("pt-BR")}</p>}{visita.justificativa_decisao && <p className="inline-message inline-error"><strong>Justificativa:</strong> {visita.justificativa_decisao}</p>}</div><div className="actions">{podeConfirmar && <Button size="sm" onClick={() => abrirAcao("confirmar", visita)}>Confirmar</Button>}{podeRecusar && <Button size="sm" variant="danger" onClick={() => abrirAcao("recusar", visita)}>Recusar</Button>}{podeCancelar && <Button size="sm" variant="secondary" onClick={() => abrirAcao("cancelar", visita)}>Cancelar visita</Button>}</div></article>;
    })}</div>}</Card>
    <ConfirmModal open={Boolean(acao)} title={acao?.tipo === "confirmar" ? "Confirmar visita?" : acao?.tipo === "recusar" ? "Recusar visita?" : "Cancelar visita?"} description={acao?.tipo === "confirmar" ? "O horário continuará bloqueado para este imóvel." : "Informe a justificativa que ficará registrada para o cliente."} confirmLabel={acao?.tipo === "confirmar" ? "Confirmar visita" : acao?.tipo === "recusar" ? "Recusar visita" : "Cancelar visita"} destructive={acao?.tipo !== "confirmar"} loading={processando} initialFocusRef={acao?.tipo !== "confirmar" ? justificativaRef : undefined} onConfirm={executarAcao} onCancel={fecharAcao}>{acao?.tipo !== "confirmar" && <textarea ref={justificativaRef} className="textarea" aria-label="Justificativa obrigatória" value={justificativa} onChange={(event) => setJustificativa(event.target.value)} placeholder="Justificativa obrigatória" maxLength="2000" rows="4" />}</ConfirmModal>
  </>;
}

export default SolicitacoesVisita;
