import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";

function MinhasVisitas() {
  const { token } = useAuth();
  const [visitas, setVisitas] = useState(null);
  const [erro, setErro] = useState("");
  useEffect(() => { let ativo = true; apiRequest("/solicitacoes-visita/minhas", {}, token).then((dados) => { if (ativo) setVisitas(dados); }).catch((requestError) => { if (ativo) { setVisitas([]); setErro(requestError.message); } }); return () => { ativo = false; }; }, [token]);
  if (!visitas) return <LoadingSpinner label="Carregando minhas visitas..." />;
  const statusLabels = { PENDENTE: "Pendente", CONFIRMADA: "Confirmada", RECUSADA: "Recusada", CANCELADA: "Cancelada" };
  const statusVariants = { PENDENTE: "warning", CONFIRMADA: "success", RECUSADA: "danger", CANCELADA: "neutral" };
  return <><div className="page-intro"><div><p className="eyebrow">AGENDA DO CLIENTE</p><h2>Minhas visitas</h2><p>Acompanhe suas solicitações de visita aos imóveis.</p></div></div>{erro && <p className="inline-message inline-error" role="alert">{erro}</p>}<Card>{visitas.length === 0 ? <EmptyState title="Nenhuma visita solicitada" description="As solicitações feitas no catálogo aparecerão aqui." /> : <div className="request-list">{visitas.map((visita) => <article className="request-item" key={visita.id}><div><Badge variant={statusVariants[visita.status]}>{statusLabels[visita.status]}</Badge><h3>{visita.imovel.tipo} · {visita.imovel.cidade}</h3><p>{new Date(`${visita.data_visita}T12:00:00`).toLocaleDateString("pt-BR")} às {visita.horario_visita.slice(0, 5)}</p>{visita.observacoes && <p><strong>Observações:</strong> {visita.observacoes}</p>}{visita.decidido_em && <p><strong>Decidida em:</strong> {new Date(visita.decidido_em).toLocaleString("pt-BR")}</p>}{visita.justificativa_decisao && <p className="inline-message inline-error"><strong>Justificativa administrativa:</strong> {visita.justificativa_decisao}</p>}</div></article>)}</div>}</Card></>;
}

export default MinhasVisitas;
