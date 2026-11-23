import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
function MeusImoveis() { const { token } = useAuth(); const [items, setItems] = useState(null); const [erro, setErro] = useState(""); useEffect(() => { apiRequest("/imoveis/meus", {}, token).then(setItems).catch((e) => setErro(e.message)); }, [token]); if (!items) return <LoadingSpinner label="Carregando meus imóveis..." />; return <><div className="page-intro"><div><p className="eyebrow">ÁREA DO PROPRIETÁRIO</p><h2>Meus imóveis</h2><p>Acompanhe seus rascunhos e envios para análise.</p></div><Link className="button button-primary button-md" to="/anunciar-imovel">Anunciar meu imóvel</Link></div>{erro && <p className="inline-message inline-error">{erro}</p>}<Card className="table-card">{items.length === 0 ? <EmptyState title="Nenhum imóvel cadastrado" description="Comece enviando seu primeiro imóvel para análise." /> : <div className="property-grid">{items.map((item) => <article className="property-card" key={item.id}><div><Badge variant={item.publicado ? "success" : "warning"}>{item.publicado ? "Publicado" : item.situacao_comercial}</Badge><h3>{item.tipo}</h3><p>{item.bairro} · {item.cidade}</p><strong>{Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div><Link className="button button-secondary button-sm" to={`/anunciar-imovel?imovel=${item.id}`}>Editar envio</Link></article>)}</div>}</Card></>; }
export default MeusImoveis;
