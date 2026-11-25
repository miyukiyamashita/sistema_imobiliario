import React, { useEffect, useState } from "react";
import { Field, NavegacaoInterna } from "../components/Layout";
import { apiRequest } from "../services/api";

const vazio = {
  proprietario_id: "",
  tipo: "",
  finalidade: "VENDA",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "MG",
  cep: "",
  area: "",
  valor: "",
  quartos: "0",
  banheiros: "0",
  vagas_garagem: "0",
  descricao: "",
};

export default function FormularioImovel({ token, imovel, proprietario, proprietarios = [], buscaProprietario = "", onBuscaProprietario, onCancel, onSaved, onSubmitOverride, onDraftSave, onDataChange, extra, submitLabel, mostrarRetorno = false }) {
  const [formulario, setFormulario] = useState({ ...vazio, ...imovel, proprietario_id: imovel?.proprietario_id || "" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  useEffect(() => {
    function prevenirSaida(event) {
      if (!alterado) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", prevenirSaida);
    return () => window.removeEventListener("beforeunload", prevenirSaida);
  }, [alterado]);

  function alterar(event) {
    const proximo = { ...formulario, [event.target.name]: event.target.value };
    setFormulario(proximo);
    setAlterado(true);
    onDataChange?.(proximo);
  }

  function prepararDados() {
    return {
      ...formulario,
      proprietario_id: formulario.proprietario_id ? Number(formulario.proprietario_id) : undefined,
      area: Number(formulario.area),
      valor: Number(formulario.valor),
      quartos: Number(formulario.quartos),
      banheiros: Number(formulario.banheiros),
      vagas_garagem: Number(formulario.vagas_garagem),
    };
  }

  async function salvar(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);
    const dados = prepararDados();
    try {
      if (onSubmitOverride) {
        const sucesso = await onSubmitOverride(dados);
        if (sucesso !== false) setAlterado(false);
        return;
      }
      const resposta = await apiRequest(
        imovel ? `/imoveis/${imovel.id}` : proprietario ? "/imoveis/meus" : "/imoveis",
        { method: imovel ? "PATCH" : "POST", body: dados },
        token
      );
      onSaved(resposta);
      setAlterado(false);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function salvarRascunho() {
    setSalvando(true);
    try {
      const sucesso = await onDraftSave(prepararDados());
      if (sucesso !== false) setAlterado(false);
    } finally {
      setSalvando(false);
    }
  }

  function sair() {
    if (alterado) setConfirmarSaida(true);
    else onCancel();
  }

  return (
    <form onSubmit={salvar} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      {mostrarRetorno && <NavegacaoInterna onNavigate={sair} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo de imóvel">
          <input className="input" name="tipo" value={formulario.tipo} onChange={alterar} required />
        </Field>
        <Field label="Finalidade">
          <select className="input" name="finalidade" value={formulario.finalidade} onChange={alterar}>
            <option value="VENDA">Venda</option>
            <option value="LOCACAO">Locação</option>
          </select>
        </Field>
        {!proprietario && (
          <Field label="Proprietário">
            {onBuscaProprietario && <input className="input mb-2" value={buscaProprietario} onChange={(event) => onBuscaProprietario(event.target.value)} placeholder="Buscar por nome ou e-mail" />}
            <select className="input" name="proprietario_id" value={formulario.proprietario_id} onChange={alterar} required>
              <option value="">Selecione um proprietário</option>
              {proprietarios.map((item) => <option key={item.id} value={item.id}>{item.nome} · {item.email}</option>)}
            </select>
          </Field>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["logradouro", "Logradouro"], ["numero", "Número"], ["bairro", "Bairro"], ["cidade", "Cidade"], ["estado", "UF"], ["cep", "CEP"], ["area", "Área (m²)"], ["valor", "Valor"]].map(([name, label]) => (
          <Field key={name} label={label}>
            <input className="input" name={name} value={formulario[name]} onChange={alterar} type={["area", "valor"].includes(name) ? "number" : "text"} required={!['complemento'].includes(name)} />
          </Field>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["quartos", "Quartos"], ["banheiros", "Banheiros"], ["vagas_garagem", "Vagas"]].map(([name, label]) => (
          <Field key={name} label={label}><input className="input" name={name} type="number" min="0" value={formulario[name]} onChange={alterar} /></Field>
        ))}
      </div>
      <Field label="Descrição"><textarea className="input min-h-28" name="descricao" value={formulario.descricao} onChange={alterar} /></Field>
      {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      {extra}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={sair}>Cancelar</button>
        {onDraftSave && <button type="button" className="btn-secondary" disabled={salvando} onClick={salvarRascunho}>{salvando ? "Salvando..." : "Salvar rascunho"}</button>}
        <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? "Enviando..." : submitLabel || "Salvar imóvel"}</button>
      </div>
      {confirmarSaida && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5" role="dialog" aria-modal="true" aria-labelledby="titulo-saida"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="titulo-saida" className="text-lg font-bold text-slate-900">Alterações não salvas</h2><p className="mt-2 text-sm text-slate-600">Existem alterações não salvas. Deseja sair desta página mesmo assim?</p><div className="mt-5 flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setConfirmarSaida(false)}>Continuar editando</button><button type="button" className="btn-primary" onClick={onCancel}>Sair</button></div></div></div>}
    </form>
  );
}
