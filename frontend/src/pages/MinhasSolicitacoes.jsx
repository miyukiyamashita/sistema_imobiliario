import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
function MinhasSolicitacoes() { const { token } = useAuth(); const [items, setItems] = useState(null); useEffect(() => { apiRequest("/minhas-solicitacoes", {}, token).then(setItems).catch(() => setItems([])); }, [token]); if (!items) return <LoadingSpinner label="Carregando solicitações..." />; return <><div className="page-intro"><div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Minhas solicitações</h2><p>Veja o andamento das análises dos seus imóveis.</p></div></div><Card>{items.length === 0 ? <EmptyState title="Nenhuma solicitação" description="Seus envios aparecerão aqui." /> : <div className="request-list">{items.map((item) => <article className="request-item" key={item.id}><div><Badge variant={item.status === "APROVADO" ? "success" : item.status === "REJEITADO" ? "danger" : "warning"}>{item.status.replace("_", " ")}</Badge><h3>{item.imovel.tipo} · {item.imovel.cidade}</h3><p>Enviada em {new Date(item.submetida_em).toLocaleDateString("pt-BR")}</p>{item.justificativa_rejeicao && <p className="inline-message inline-error"><strong>Motivo:</strong> {item.justificativa_rejeicao}</p>}</div>{item.status === "REJEITADO" && <Link className="button button-secondary button-sm" to={`/anunciar-imovel?imovel=${item.imovel_id}`}>Corrigir e reenviar</Link>}</article>)}</div>}</Card></>; }
export default MinhasSolicitacoes;
