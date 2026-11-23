import { useEffect, useState } from "react";
import { Field } from "../components/Layout";
import { apiRequest } from "../services/api";

const horarios = Array.from({ length: 9 }, (_, index) =>
  `${String(index + 9).padStart(2, "0")}:00`
);
const agora = new Date();
const dataMinimaVisita = new Date(
  agora.getTime() - agora.getTimezoneOffset() * 60_000
).toISOString().slice(0, 10);

const statusVisita = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  RECUSADA: "Recusada",
  CANCELADA: "Cancelada",
};

function dataFormatada(data) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function AgendaVisitas({ token, perfil }) {
  const cliente = perfil === "CLIENTE";
  const [visitas, setVisitas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [formAberto, setFormAberto] = useState(null);
  const [cancelamentoAberto, setCancelamentoAberto] = useState(null);
  const [formularios, setFormularios] = useState({});
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest(
      cliente ? "/solicitacoes-visita/minhas" : "/solicitacoes-visita",
      {},
      token
    )
      .then((resultado) => {
        if (active) setVisitas(resultado);
      })
      .catch((error) => {
        if (active) setErro(error.message);
      })
      .finally(() => {
        if (active) setCarregando(false);
      });

    return () => {
      active = false;
    };
  }, [atualizacao, cliente, token]);

  function atualizarFormulario(id, campo, valor) {
    setFormularios((anteriores) => ({
      ...anteriores,
      [id]: { ...anteriores[id], [campo]: valor },
    }));
  }

  async function executarAcao(id, caminho, dados) {
    setAcaoEmAndamento(id);
    setErro("");
    try {
      await apiRequest(
        `/solicitacoes-visita/${id}/${caminho}`,
        {
          method: "PATCH",
          ...(dados ? { body: JSON.stringify(dados) } : {}),
        },
        token
      );
      setFormAberto(null);
      setCancelamentoAberto(null);
      setCarregando(true);
      setAtualizacao((valor) => valor + 1);
    } catch (error) {
      setErro(error.message);
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  async function reagendar(visita) {
    const form = formularios[visita.id] || {};
    if (!form.data || !form.horario || !form.justificativa?.trim()) {
      setErro("Informe a nova data, o horário e a justificativa do reagendamento.");
      return;
    }
    await executarAcao(visita.id, "reagendar", {
      data_visita: form.data,
      horario_visita: form.horario,
      justificativa: form.justificativa,
    });
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          {cliente ? "Minhas visitas" : "Agenda de visitas"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {cliente
            ? "Acompanhe as visitas e responda às sugestões de novo horário."
            : "Confirme, reagende ou cancele os agendamentos dos clientes."}
        </p>
      </div>

      {erro && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </p>
      )}

      {carregando ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Carregando visitas...
        </p>
      ) : visitas.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Não há visitas para exibir.
        </p>
      ) : (
        visitas.map((visita) => {
          const form = formularios[visita.id] || {};
          const podeGerenciar = !cliente && ["PENDENTE", "CONFIRMADA"].includes(visita.status);
          return (
            <article key={visita.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {visita.imovel.tipo} · {visita.imovel.bairro}, {visita.imovel.cidade}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {dataFormatada(visita.data_visita)} às {visita.horario_visita.slice(0, 5)}
                  </p>
                  {visita.cliente && (
                    <p className="mt-1 text-sm text-slate-500">
                      Cliente: {visita.cliente.nome} ({visita.cliente.email})
                    </p>
                  )}
                  {visita.observacoes && (
                    <p className="mt-2 text-sm text-slate-500">{visita.observacoes}</p>
                  )}
                  {visita.justificativa_decisao && (
                    <p className="mt-2 text-sm text-slate-500">
                      Justificativa: {visita.justificativa_decisao}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-blue-800">
                    Status: {visita.reagendamento_pendente
                      ? "Aguardando resposta do cliente ao reagendamento"
                      : statusVisita[visita.status] || visita.status}
                  </p>
                  {visita.reagendamento_pendente && (
                    <p className="mt-1 text-sm text-slate-600">
                      Novo horário sugerido: {dataFormatada(visita.nova_data_visita)} às {visita.novo_horario_visita.slice(0, 5)}
                    </p>
                  )}
                </div>

                {cliente && visita.reagendamento_pendente && (
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      disabled={acaoEmAndamento === visita.id}
                      onClick={() => executarAcao(visita.id, "responder-reagendamento", { aceitar: true })}
                      className="btn-primary"
                    >
                      Confirmar novo horário
                    </button>
                    <button
                      type="button"
                      disabled={acaoEmAndamento === visita.id}
                      onClick={() => executarAcao(visita.id, "responder-reagendamento", { aceitar: false })}
                      className="btn-secondary"
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>

              {podeGerenciar && !visita.reagendamento_pendente && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {visita.status === "PENDENTE" && (
                    <button
                      type="button"
                      disabled={acaoEmAndamento === visita.id}
                      onClick={() => executarAcao(visita.id, "confirmar")}
                      className="btn-primary"
                    >
                      Confirmar visita
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={acaoEmAndamento === visita.id}
                    onClick={() => setFormAberto(formAberto === visita.id ? null : visita.id)}
                    className="btn-secondary"
                  >
                    Reagendar
                  </button>
                  <button
                    type="button"
                    disabled={acaoEmAndamento === visita.id}
                    onClick={() => setCancelamentoAberto(
                      cancelamentoAberto === visita.id ? null : visita.id
                    )}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {cancelamentoAberto === visita.id && (
                <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-end">
                  <Field label="Justificativa do cancelamento" className="flex-1">
                    <input
                      value={form.justificativaCancelamento || ""}
                      onChange={(event) => atualizarFormulario(visita.id, "justificativaCancelamento", event.target.value)}
                      className="input"
                      maxLength={2000}
                    />
                  </Field>
                  <button
                    type="button"
                    disabled={acaoEmAndamento === visita.id}
                    onClick={() => {
                      if (!form.justificativaCancelamento?.trim()) {
                        setErro("Informe a justificativa do cancelamento.");
                        return;
                      }
                      executarAcao(visita.id, "cancelar", {
                        justificativa: form.justificativaCancelamento,
                      });
                    }}
                    className="btn-primary"
                  >
                    Confirmar cancelamento
                  </button>
                </div>
              )}

              {formAberto === visita.id && (
                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                  <Field label="Nova data">
                    <input
                      type="date"
                      min={dataMinimaVisita}
                      value={form.data || ""}
                      onChange={(event) => atualizarFormulario(visita.id, "data", event.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field label="Novo horário">
                    <select
                      value={form.horario || ""}
                      onChange={(event) => atualizarFormulario(visita.id, "horario", event.target.value)}
                      className="input"
                    >
                      <option value="">Selecione</option>
                      {horarios.map((horario) => (
                        <option key={horario} value={`${horario}:00`}>{horario}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Justificativa">
                    <input
                      value={form.justificativa || ""}
                      onChange={(event) => atualizarFormulario(visita.id, "justificativa", event.target.value)}
                      className="input"
                      maxLength={2000}
                    />
                  </Field>
                  <button
                    type="button"
                    disabled={acaoEmAndamento === visita.id}
                    onClick={() => reagendar(visita)}
                    className="btn-primary sm:col-span-3"
                  >
                    Enviar novo horário para validação do cliente
                  </button>
                </div>
              )}
            </article>
          );
        })
      )}
    </section>
  );
}
