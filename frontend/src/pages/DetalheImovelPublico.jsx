import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";

function DetalheImovelPublico() {
  const { id } = useParams();
  const [imovel, setImovel] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDetalhe() {
      setCarregando(true);
      setErro("");
      try { setImovel(await apiRequest(`/imoveis/publicos/${id}`)); }
      catch (requestError) { setErro(requestError.message); }
      finally { setCarregando(false); }
    }
    carregarDetalhe();
  }, [id]);

  if (carregando) return <main className="public-page"><PublicHeader /><div className="catalog-feedback"><LoadingSpinner label="Carregando imóvel..." /></div></main>;
  if (erro || !imovel) return <main className="public-page"><PublicHeader /><section className="public-content"><Card><EmptyState title="Imóvel não encontrado" description={erro || "Este imóvel não está mais disponível no catálogo."} action={<Link to="/imoveis/catalogo" className="button button-primary button-md">Voltar ao catálogo</Link>} /></Card></section></main>;

  return <main className="public-page"><PublicHeader /><section className="public-content"><Link className="back-link" to="/imoveis/catalogo">← Voltar para o catálogo</Link><div className="detail-heading"><div><div className="property-card-top"><Badge variant="info">{imovel.finalidade === "VENDA" ? "Venda" : "Locação"}</Badge><span>{imovel.tipo}</span></div><h1>{imovel.tipo} em {imovel.bairro}, {imovel.cidade}</h1><p>{imovel.logradouro}, {imovel.numero} · {imovel.cidade}/{imovel.estado}</p></div><div className="detail-price"><span>Valor</span><strong>{Number(imovel.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div></div><Card className="detail-gallery">{imovel.fotos?.length > 0 ? <div className="detail-photo-grid">{imovel.fotos.map((foto, index) => <img key={foto.id} className={index === 0 ? "detail-photo-featured" : ""} src={foto.url} alt={`Fotografia ${index + 1} de ${imovel.tipo}`} />)}</div> : <div className="detail-no-photo">⌂<span>Este imóvel ainda não possui fotografias.</span></div>}</Card><div className="detail-columns"><Card className="detail-info"><h2>Sobre este imóvel</h2><p>{imovel.descricao || "Este imóvel não possui uma descrição cadastrada."}</p><div className="detail-specs"><div><strong>{imovel.area} m²</strong><span>Área</span></div><div><strong>{imovel.quartos}</strong><span>Quartos</span></div><div><strong>{imovel.banheiros}</strong><span>Banheiros</span></div><div><strong>{imovel.vagas_garagem}</strong><span>Vagas</span></div></div></Card><Card className="detail-location"><h2>Localização</h2><p>{imovel.logradouro}, {imovel.numero}{imovel.complemento ? `, ${imovel.complemento}` : ""}</p><p>{imovel.bairro}<br />{imovel.cidade} - {imovel.estado}<br />CEP {imovel.cep}</p></Card></div></section></main>;
}

function PublicHeader() { return <header className="public-header"><Link className="public-brand" to="/imoveis/catalogo"><span className="brand-mark">F</span><span>Futura <small>Imóveis</small></span></Link><Link className="public-header-link" to="/login">Acessar conta</Link></header>; }

export default DetalheImovelPublico;
