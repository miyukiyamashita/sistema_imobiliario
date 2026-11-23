import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PublicHeader from "../components/layout/PublicHeader";

const filtrosVazios = { busca: "", cidade: "", bairro: "", tipo: "", valor_min: "", valor_max: "", finalidade: "", quartos: "" };

function filtrosDaUrl(searchParams) {
  return Object.keys(filtrosVazios).reduce((resultado, campo) => ({ ...resultado, [campo]: searchParams.get(campo) || "" }), {});
}

function urlDosFiltros(filtros) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([campo, valor]) => { if (valor !== "") params.set(campo, valor); });
  return params;
}

function CatalogoPublico() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtros, setFiltros] = useState(() => filtrosDaUrl(searchParams));
  const [imoveis, setImoveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [validacao, setValidacao] = useState("");

  useEffect(() => {
    setFiltros(filtrosDaUrl(searchParams));
    async function carregarCatalogo() {
      setCarregando(true);
      setErro("");
      try {
        const query = searchParams.toString();
        setImoveis(await apiRequest(`/imoveis/publicos${query ? `?${query}` : ""}`));
      } catch (requestError) {
        setErro(requestError.message);
      } finally {
        setCarregando(false);
      }
    }
    carregarCatalogo();
  }, [searchParams]);

  function alterarFiltro(event) {
    const { name, value } = event.target;
    setFiltros((anterior) => ({ ...anterior, [name]: value }));
  }

  function buscar(event) {
    event.preventDefault();
    if (filtros.valor_min && filtros.valor_max && Number(filtros.valor_min) > Number(filtros.valor_max)) {
      setValidacao("O valor mínimo não pode ser maior que o valor máximo.");
      return;
    }
    setValidacao("");
    setSearchParams(urlDosFiltros(filtros));
  }

  function limparFiltros() {
    setValidacao("");
    setFiltros({ ...filtrosVazios });
    setSearchParams({}, { replace: true });
  }

  return (
    <main className="public-page">
      <PublicHeader />
      <section className="public-content">
        <div className="public-hero"><p className="eyebrow">ENCONTRE SEU PRÓXIMO ENDEREÇO</p><h1>Imóveis para chamar de seu</h1><p>Explore oportunidades disponíveis e encontre um espaço que combina com seus planos.</p></div>
        <Card className="filter-card"><div className="filter-heading"><div><h2>Encontre o imóvel ideal</h2><p>Combine os filtros para refinar sua busca.</p></div><span className="filter-label">Filtros de busca</span></div><form className="catalog-filters" onSubmit={buscar}><Input label="Buscar por palavra-chave" name="busca" value={filtros.busca} onChange={alterarFiltro} placeholder="Ex.: apartamento, centro..." /><Input label="Cidade" name="cidade" value={filtros.cidade} onChange={alterarFiltro} placeholder="Ex.: São Paulo" /><Input label="Bairro" name="bairro" value={filtros.bairro} onChange={alterarFiltro} placeholder="Ex.: Centro" /><Input label="Tipo de imóvel" name="tipo" value={filtros.tipo} onChange={alterarFiltro} placeholder="Ex.: Casa" /><Input label="Valor mínimo" name="valor_min" type="number" min="0.01" step="0.01" value={filtros.valor_min} onChange={alterarFiltro} placeholder="R$ 0,00" /><Input label="Valor máximo" name="valor_max" type="number" min="0.01" step="0.01" value={filtros.valor_max} onChange={alterarFiltro} placeholder="R$ 0,00" /><div className="field"><label htmlFor="finalidade">Finalidade</label><select id="finalidade" name="finalidade" value={filtros.finalidade} onChange={alterarFiltro}><option value="">Todas</option><option value="VENDA">Venda</option><option value="LOCACAO">Locação</option></select></div><div className="field"><label htmlFor="quartos">Quartos</label><select id="quartos" name="quartos" value={filtros.quartos} onChange={alterarFiltro}><option value="">Qualquer quantidade</option><option value="1">1 ou mais</option><option value="2">2 ou mais</option><option value="3">3 ou mais</option><option value="4">4 ou mais</option></select></div><div className="filter-actions"><Button type="submit">Buscar imóveis</Button><Button type="button" variant="ghost" onClick={limparFiltros}>Limpar filtros</Button></div></form>{validacao && <p className="inline-message inline-error" role="alert">{validacao}</p>}</Card>
        <div className="catalog-results-heading"><div><h2>Imóveis disponíveis</h2><p>{!carregando && !erro ? `${imoveis.length} ${imoveis.length === 1 ? "resultado encontrado" : "resultados encontrados"}` : "Consulte as oportunidades disponíveis"}</p></div></div>
        {carregando && <div className="catalog-feedback"><LoadingSpinner label="Buscando imóveis..." /></div>}
        {!carregando && erro && <Card><div className="catalog-feedback"><p className="inline-message inline-error" role="alert">{erro}</p></div></Card>}
        {!carregando && !erro && imoveis.length === 0 && <Card><EmptyState title="Nenhum imóvel encontrado" description="Tente remover alguns filtros ou buscar por outra localização." /></Card>}
        {!carregando && !erro && imoveis.length > 0 && <div className="property-grid">{imoveis.map((imovel) => <PropertyCard key={imovel.id} imovel={imovel} />)}</div>}
      </section>
      <footer className="public-footer">Futura Imóveis · Catálogo público</footer>
    </main>
  );
}

function PropertyCard({ imovel }) {
  const foto = imovel.fotos?.[0];
  return <Card className="public-property-card"><div className="property-cover">{foto ? <img src={foto.url} alt={`Imagem de ${imovel.tipo} em ${imovel.cidade}`} /> : <div className="cover-placeholder"><span>⌂</span><small>Sem fotografias</small></div>}<Badge variant="success">Disponível</Badge></div><div className="property-card-body"><div className="property-card-top"><Badge variant="info">{imovel.finalidade === "VENDA" ? "Venda" : "Locação"}</Badge><span className="property-card-type">{imovel.tipo}</span></div><h3>{imovel.cidade} · {imovel.bairro}</h3><p className="property-card-address">{imovel.logradouro}, {imovel.numero}</p><div className="property-meta"><span>{imovel.quartos} {imovel.quartos === 1 ? "quarto" : "quartos"}</span><span>{imovel.area} m²</span><span>{imovel.vagas_garagem} vagas</span></div><div className="property-card-footer"><strong>{Number(imovel.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong><Link className="button button-primary button-sm" to={`/imoveis/catalogo/${imovel.id}`}>Ver detalhes</Link></div></div></Card>;
}

export default CatalogoPublico;
