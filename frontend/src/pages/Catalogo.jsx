import { useMemo, useState } from "react";
import { Header, Field } from "../components/Layout";
import { Icon } from "../components/Icon";
import { mockProperties } from "../components/mockImoveis";

function Feature({ icon, value, label }) {
  return (
    <div className="flex items-center gap-2.5 text-slate-600">
      <Icon name={icon} size={18} className="text-slate-400" />
      <span className="text-sm">
        <b className="font-semibold text-slate-800">{value}</b> {label}
      </span>
    </div>
  );
}

function PropertyCard({ property, onSelect }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/8">
      <div className="relative h-60 overflow-hidden bg-slate-100">
        <img
          src={property.image}
          alt={property.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-blue-900 shadow-sm">
          {property.purpose}
        </span>
        <button
          type="button"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-500 shadow-sm transition hover:text-red-500"
          aria-label="Favoritar"
        >
          <Icon name="heart" size={18} />
        </button>
      </div>

      <div className="p-5">
        <p className="text-xl font-bold tracking-tight text-blue-900">
          {property.price}
        </p>
        <h3 className="mt-3 text-[17px] font-bold text-slate-900">
          {property.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
          <Icon name="pin" size={15} />
          {property.place}
        </p>

        <div className="my-5 grid grid-cols-2 gap-x-3 gap-y-3 border-y border-slate-100 py-4">
          <Feature icon="bed" value={property.beds} label="quartos" />
          <Feature icon="bath" value={property.baths} label="banhos" />
          <Feature icon="car" value={property.cars} label="vagas" />
          <Feature icon="area" value={property.area} label="m²" />
        </div>

        <button
          type="button"
          onClick={() => onSelect(property)}
          className="btn-card"
        >
          Ver detalhes <Icon name="arrow" size={17} />
        </button>
      </div>
    </article>
  );
}

export default function Catalogo({ onNavigate, onSelectImovel, usuario }) {
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [purpose, setPurpose] = useState("");
  const [quartos, setQuartos] = useState("");

  const filtered = useMemo(
    () =>
      mockProperties.filter(
        (p) =>
          (!search ||
            `${p.title} ${p.place}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (!tipo || p.type === tipo) &&
          (!purpose || p.purpose === purpose) &&
          (!quartos || p.beds >= Number(quartos))
      ),
    [search, tipo, purpose, quartos]
  );

  function limparFiltros() {
    setSearch("");
    setTipo("");
    setPurpose("");
    setQuartos("");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onNavigate={onNavigate} active="catalogo" usuario={usuario} />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1320px] px-5 pb-8 pt-12 lg:px-8">
            <div className="max-w-2xl">
              <span className="eyebrow">Encontre seu próximo endereço</span>
              <h1 className="mt-3 text-4xl font-bold tracking-[-.035em] text-slate-950 md:text-5xl">
                Imóveis que combinam
                <br className="hidden sm:block" /> com o seu futuro.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">
                Curadoria de imóveis exclusivos para comprar ou alugar, com atendimento próximo em cada etapa.
              </p>
            </div>

            <div className="mt-9 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
              <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr_.8fr_auto]">
                <Field label="Onde você quer morar?">
                  <div className="input-wrap">
                    <Icon name="search" size={18} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cidade ou bairro"
                    />
                  </div>
                </Field>

                <Field label="Tipo de imóvel">
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="input"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="Casa">Casa</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </Field>

                <Field label="Finalidade">
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="input"
                  >
                    <option value="">Venda ou aluguel</option>
                    <option value="Venda">Venda</option>
                    <option value="Aluguel">Aluguel</option>
                  </select>
                </Field>

                <Field label="Faixa de preço">
                  <div className="flex gap-2">
                    <input className="input min-w-0" placeholder="Mín." />
                    <input className="input min-w-0" placeholder="Máx." />
                  </div>
                </Field>

                <Field label="Quartos">
                  <select
                    value={quartos}
                    onChange={(e) => setQuartos(e.target.value)}
                    className="input"
                  >
                    <option value="">Qualquer</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </Field>

                <div className="flex items-end gap-2">
                  <button type="button" className="btn-primary h-11">
                    <Icon name="search" size={18} /> Buscar
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={limparFiltros}
                className="mt-3 text-xs font-semibold text-slate-500 transition hover:text-blue-700"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-5 py-10 lg:px-8 lg:py-14">
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Imóveis em destaque
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filtered.length} oportunidades selecionadas para você
              </p>
            </div>
            <select className="input max-w-48">
              <option>Mais relevantes</option>
              <option>Menor preço</option>
              <option>Maior preço</option>
            </select>
          </div>

          {filtered.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onSelect={onSelectImovel}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center text-slate-500">
              Nenhum imóvel encontrado com esses filtros.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
