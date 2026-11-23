import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
function Notificacoes() { const { token } = useAuth(); const [items, setItems] = useState(null); useEffect(() => { apiRequest("/notificacoes", {}, token).then(setItems).catch(() => setItems([])); }, [token]); async function ler(item) { if (!item.lida) { await apiRequest(`/notificacoes/${item.id}/ler`, { method: "PATCH" }, token); setItems((lista) => lista.map((x) => x.id === item.id ? { ...x, lida: true } : x)); } } if (!items) return <LoadingSpinner label="Carregando notificações..." />; return <><div className="page-intro"><div><p className="eyebrow">CENTRAL DE AVISOS</p><h2>Notificações</h2><p>Acompanhe as atualizações das suas solicitações.</p></div></div><Card>{items.length === 0 ? <EmptyState title="Nenhuma notificação" description="Você será avisado sobre novos eventos." /> : <div className="request-list">{items.map((item) => <button className={`notification-item ${item.lida ? "" : "notification-unread"}`} key={item.id} type="button" onClick={() => ler(item)}><strong>{item.titulo}</strong><span>{item.mensagem}</span><small>{new Date(item.criada_em).toLocaleString("pt-BR")}</small></button>)}</div>}</Card></>; }
export default Notificacoes;
