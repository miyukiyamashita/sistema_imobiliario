import { useEffect, useState } from "react";
import { Header, Field } from "../components/Layout";
import { Icon } from "../components/Icon";
import { mockProperties, propertyImages } from "../components/mockImoveis";
import { apiRequest } from "../services/api";

const agora = new Date();
const dataMinimaVisita = new Date(
  agora.getTime() - agora.getTimezoneOffset() * 60_000
).toISOString().slice(0, 10);

export default function DetalhesImovel({ imovel, onNavigate, usuario, token }) {
  const atual = imovel || mockProperties[0];
  const [mode, setMode] = useState("visit");
  const [dataVisita, setDataVisita] = useState("");
  const [horarioVisita, setHorarioVisita] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [valorProposto, setValorProposto] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("FINANCIAMENTO");
  const [observacoes, setObservacoes] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (mode !== "visit" || !dataVisita || !atual.id) return;

    let active = true;
    apiRequest(
      `/imoveis/${atual.id}/horarios-disponiveis?data=${dataVisita}`
    )
      .then((response) => {
        if (active) {
          setHorariosDisponiveis(response.horarios.filter((item) => item.disponivel));
          setHorarioVisita("");
          setMensagem("");
        }
      })
      .catch((error) => {
        if (active) {
          setHorariosDisponiveis([]);
          setMensagem(error.message);
        }
      });

    return () => {
      active = false;
    };
  }, [atual.id, dataVisita, mode]);

  async function submit(e) {
    e.preventDefault();
    if (!usuario) {
      onNavigate("login");
      return;
    }

    if (usuario.perfil !== "CLIENTE") {
      setMensagem("Somente contas de cliente podem enviar solicitações de visita e propostas.");
      return;
    }

    if (!token || token === "demo-token") {
      setMensagem("Entre com sua conta para enviar a solicitação ao sistema.");
      return;
    }

    setMensagem("");
    setCarregando(true);
    try {
      if (mode === "visit") {
        await apiRequest(
          "/solicitacoes-visita",
          {
            method: "POST",
            body: JSON.stringify({
              imovel_id: atual.id,
              data_visita: dataVisita,
              horario_visita: horarioVisita,
              observacoes: observacoes || null,
            }),
          },
          token
        );
        setMensagem("Solicitação de visita enviada para confirmação.");
      } else {
        await apiRequest(
          "/propostas",
          {
            method: "POST",
            body: JSON.stringify({
              imovel_id: atual.id,
              tipo_proposta: atual.finalidade === "VENDA" ? "COMPRA" : "ALUGUEL",
              valor_proposto: Number(valorProposto.replace(",", ".")),
              condicao_pagamento: condicaoPagamento,
              mensagem: observacoes || null,
            }),
          },
          token
        );
        setMensagem("Proposta submetida com sucesso. Você pode acompanhar o status no painel.");
      }
      setEnviado(true);
    } catch (error) {
      setMensagem(error.message || "Não foi possível enviar a solicitação.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onNavigate={onNavigate} active="detalhes" usuario={usuario} />

      <main className="mx-auto max-w-[1320px] px-5 py-8 lg:px-8 lg:py-10">
        <button
          type="button"
          onClick={() => onNavigate("catalogo")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-800"
        >
          <span className="rotate-180">
            <Icon name="arrow" size={17} />
          </span>{" "}
          Voltar para imóveis
        </button>

        <div className="grid gap-3 md:h-[510px] md:grid-cols-[1.65fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl bg-slate-200">
            <img
              src={atual.image}
              alt={atual.title}
              className="h-full w-full object-cover"
            />
            <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-900 shadow">
              {atual.purpose}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:grid-rows-2">
            <img
              src={atual.fotos?.[1]?.url || propertyImages[3]}
              alt="Sala de estar"
              className="h-full min-h-40 w-full rounded-2xl object-cover"
            />
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={atual.fotos?.[2]?.url || propertyImages[5]}
                alt="Interior do imóvel"
                className="h-full min-h-40 w-full object-cover"
              />
              <button
                type="button"
                className="absolute bottom-4 right-4 rounded-lg bg-slate-950/80 px-4 py-2 text-xs font-bold text-white backdrop-blur"
              >
                Ver todas as 18 fotos
              </button>
            </div>
          </div>
        </div>

        <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <div>
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-7 sm:flex-row sm:items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  {atual.title}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-slate-500">
                  <Icon name="pin" size={18} />
                  {atual.address || atual.place}
                </p>
              </div>
              <button type="button" className="icon-button shrink-0">
                <Icon name="heart" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200 py-7 sm:grid-cols-4">
              {[
                ["bed", atual.beds, "Quartos"],
                ["bath", atual.baths, "Banheiros"],
                ["car", atual.cars, "Vagas"],
                ["area", atual.area, "m² de área"],
              ].map(([icon, value, label]) => (
                <div key={label} className="rounded-xl bg-white p-4">
                  <Icon name={icon} className="text-blue-700" />
                  <p className="mt-3 text-lg font-bold text-slate-900">
                    {value}
                  </p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <section className="py-8">
              <span className="eyebrow">Sobre o imóvel</span>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {atual.title}
              </h2>
              <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600">
                <p>
                  {atual.descricao || "Entre em contato para saber mais detalhes sobre este imóvel."}
                </p>
                <p>
                  Consulte a equipe da Futura Imóveis para obter informações adicionais e agendar sua visita.
                </p>
              </div>
            </section>

            <section className="border-t border-slate-200 py-8">
              <h2 className="text-xl font-bold text-slate-900">Diferenciais</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  "Piscina aquecida",
                  "Espaço gourmet",
                  "Ar-condicionado",
                  "Sistema de segurança",
                  "Closet",
                  "Energia solar",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-slate-600"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-green-50 text-green-600">
                      <Icon name="check" size={14} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/7">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Valor do imóvel
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-blue-900">
              {atual.price}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {atual.purpose === "Aluguel" ? "Valor mensal" : "Consulte condições de pagamento"}
            </p>

            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("visit");
                  setEnviado(false);
                  setMensagem("");
                }}
                className={`tab-button ${mode === "visit" ? "tab-active" : ""}`}
              >
                Agendar visita
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("proposal");
                  setEnviado(false);
                  setMensagem("");
                }}
                className={`tab-button ${
                  mode === "proposal" ? "tab-active" : ""
                }`}
              >
                Proposta
              </button>
            </div>

            {enviado ? (
              <div className="mt-6 rounded-xl bg-green-50 p-5 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-green-600 text-white">
                  <Icon name="check" />
                </span>
                <p className="mt-3 font-bold text-green-900">
                  Envio realizado
                </p>
                <p className="mt-1 text-xs leading-5 text-green-700">
                  {mensagem}
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-4">
                {mode === "visit" ? (
                  <>
                    <Field label="Escolha uma data">
                      <input
                        required
                        type="date"
                        value={dataVisita}
                        onChange={(event) => setDataVisita(event.target.value)}
                        min={dataMinimaVisita}
                        className="input"
                      />
                    </Field>
                    <Field label="Horário disponível">
                      {!dataVisita ? (
                        <p className="text-sm text-slate-500">
                          Selecione uma data para consultar os horários.
                        </p>
                      ) : !horariosDisponiveis.length ? (
                        <p className="text-sm text-slate-500">
                          Não há horários disponíveis para esta data.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                        {horariosDisponiveis.map(({ horario }) => (
                            <label key={horario}>
                              <input
                                type="radio"
                                name="time"
                                value={horario.slice(0, 5)}
                                checked={horarioVisita === horario.slice(0, 5)}
                                onChange={() => setHorarioVisita(horario.slice(0, 5))}
                                className="peer sr-only"
                                required
                              />
                              <span className="block cursor-pointer rounded-lg border border-slate-200 py-2 text-center text-xs font-semibold text-slate-600 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700">
                                {horario.slice(0, 5)}
                              </span>
                            </label>
                        ))}
                        </div>
                      )}
                    </Field>
                    <Field label="Observações">
                      <textarea
                        value={observacoes}
                        onChange={(event) => setObservacoes(event.target.value)}
                        className="input min-h-20 resize-none"
                        placeholder="Informações adicionais (opcional)"
                      />
                    </Field>
                    <button type="submit" disabled={carregando} className="btn-primary w-full">
                      <Icon name="calendar" size={18} />
                      {carregando ? "Enviando..." : usuario ? "Agendar visita" : "Entrar para agendar"}
                    </button>
                  </>
                ) : (
                  <>
                    <Field label="Tipo da proposta">
                      <input
                        readOnly
                        value={atual.finalidade === "VENDA" ? "Compra" : "Aluguel"}
                        className="input"
                      />
                    </Field>
                    <Field label="Valor proposto">
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={valorProposto}
                        onChange={(event) => setValorProposto(event.target.value)}
                        className="input"
                        placeholder="R$ 0,00"
                      />
                    </Field>
                    <Field label="Forma de pagamento">
                      <select
                        value={condicaoPagamento}
                        onChange={(event) => setCondicaoPagamento(event.target.value)}
                        className="input"
                      >
                        <option value="A_VISTA">À vista</option>
                        <option value="FINANCIAMENTO">Financiamento</option>
                        <option value="FIADOR">Fiador</option>
                      </select>
                    </Field>
                    <Field label="Observações">
                      <textarea
                        value={observacoes}
                        onChange={(event) => setObservacoes(event.target.value)}
                        className="input min-h-20 resize-none"
                        placeholder="Mensagem ou observações (opcional)"
                      />
                    </Field>
                    <button type="submit" disabled={carregando} className="btn-primary w-full">
                      <Icon name="proposal" size={18} />
                      {carregando ? "Enviando..." : usuario ? "Submeter proposta" : "Entrar para enviar"}
                    </button>
                  </>
                )}
              </form>
            )}

            {!enviado && mensagem && (
              <p role="alert" className="mt-3 text-sm text-red-700">{mensagem}</p>
            )}
            <p className="mt-4 text-center text-[11px] leading-4 text-slate-400">
              Ao enviar, você concorda em ser contatado pela Futura Imóveis.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
