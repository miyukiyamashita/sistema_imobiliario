import React, { useEffect, useState } from "react";
import { Field } from "../components/Layout";
import { apiRequest } from "../services/api";

const condicoes = {
  A_VISTA: "À vista",
  FINANCIAMENTO: "Financiamento",
  FIADOR: "Fiador",
};

const status = {
  EM_ANALISE: "Em análise",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  AGUARDANDO_RESPOSTA_CLIENTE: "Aguardando resposta do cliente",
};

const dinheiro = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function Propostas({ token, perfil }) {
  const cliente = perfil === "CLIENTE";
  const [propostas, setPropostas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [formularios, setFormularios] = useState({});
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(null);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    let active = true;
    apiRequest(
      cliente ? "/propostas/minhas" : "/propostas/recebidas",
      {},
      token
    )
      .then((resultado) => {
        if (active) setPropostas(resultado);
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

  async function responder(proposta, acao) {
    const formulario = formularios[proposta.id] || {};
    const endpoint = cliente
      ? `/propostas/${proposta.id}/responder-cliente`
      : `/propostas/${proposta.id}/responder`;
    const dados = { acao };
    if (acao === "CONTRAPROPOSTA") {
      const valor = Number(formulario.valor);
      if (!Number.isFinite(valor) || valor <= 0) {
        setErro("Informe um valor de contraproposta maior que zero.");
        return;
      }
      dados.valor_contraproposta = valor;
      dados.condicao_pagamento = formulario.condicao || "FINANCIAMENTO";
    }

    setAcaoEmAndamento(proposta.id);
    setErro("");
    try {
      await apiRequest(endpoint, { method: "PATCH", body: JSON.stringify(dados) }, token);
      setCarregando(true);
      setAtualizacao((valor) => valor + 1);
    } catch (error) {
      setErro(error.message);
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          {cliente ? "Minhas propostas" : "Propostas recebidas"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {cliente
            ? "Acompanhe a análise e responda às contrapropostas."
            : "Analise as propostas e aceite, recuse ou envie uma contraproposta."}
        </p>
      </div>

      {erro && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </p>
      )}

      {carregando ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Carregando propostas...
        </p>
      ) : propostas.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Não há propostas para exibir.
        </p>
      ) : (
        propostas.map((proposta) => {
          const formulario = formularios[proposta.id] || {};
          const podeResponder = cliente
            ? proposta.status === "AGUARDANDO_RESPOSTA_CLIENTE"
            : proposta.status === "EM_ANALISE";
          return (
            <article key={proposta.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {proposta.imovel.tipo} · {proposta.imovel.bairro}, {proposta.imovel.cidade}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {proposta.tipo_proposta === "COMPRA" ? "Compra" : "Aluguel"} ·
                    {" "}{dinheiro.format(Number(proposta.valor_proposto))} ·
                    {" "}{condicoes[proposta.condicao_pagamento]}
                  </p>
                  {!cliente && (
                    <p className="mt-1 text-sm text-slate-500">
                      Cliente: {proposta.cliente.nome} ({proposta.cliente.email})
                    </p>
                  )}
                  {proposta.mensagem && (
                    <p className="mt-2 text-sm text-slate-500">{proposta.mensagem}</p>
                  )}
                  {proposta.contraproposta_valor && (
                    <p className="mt-2 text-sm font-medium text-blue-800">
                      Contraproposta: {dinheiro.format(Number(proposta.contraproposta_valor))}
                      {" "}· {condicoes[proposta.contraproposta_condicao_pagamento]}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-blue-800">
                    Status: {status[proposta.status] || proposta.status}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(proposta.criada_em).toLocaleDateString("pt-BR")}
                </p>
              </div>

              {podeResponder && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Valor da contraproposta">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formulario.valor || ""}
                        onChange={(event) => atualizarFormulario(proposta.id, "valor", event.target.value)}
                        className="input"
                      />
                    </Field>
                    <Field label="Condição de pagamento">
                      <select
                        value={formulario.condicao || "FINANCIAMENTO"}
                        onChange={(event) => atualizarFormulario(proposta.id, "condicao", event.target.value)}
                        className="input"
                      >
                        <option value="A_VISTA">À vista</option>
                        <option value="FINANCIAMENTO">Financiamento</option>
                        <option value="FIADOR">Fiador</option>
                      </select>
                    </Field>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={acaoEmAndamento === proposta.id}
                      onClick={() => responder(proposta, "ACEITAR")}
                      className="btn-primary"
                    >
                      {cliente ? "Aceitar contraproposta" : "Aceitar proposta"}
                    </button>
                    <button
                      type="button"
                      disabled={acaoEmAndamento === proposta.id}
                      onClick={() => responder(proposta, "RECUSAR")}
                      className="btn-secondary"
                    >
                      Recusar
                    </button>
                    <button
                      type="button"
                      disabled={acaoEmAndamento === proposta.id}
                      onClick={() => responder(proposta, "CONTRAPROPOSTA")}
                      className="btn-secondary"
                    >
                      Enviar contraproposta
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
    </section>
  );
}
