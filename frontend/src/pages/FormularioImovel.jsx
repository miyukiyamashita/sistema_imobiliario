import { useState } from "react";
import { Field } from "../components/Layout";
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

export default function FormularioImovel({ token, imovel, proprietario, onCancel, onSaved, onSubmitOverride, onDraftSave, onDataChange, extra, submitLabel }) {
  const [formulario, setFormulario] = useState({ ...vazio, ...imovel, proprietario_id: imovel?.proprietario_id || "" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function alterar(event) {
    const proximo = { ...formulario, [event.target.name]: event.target.value };
    setFormulario(proximo);
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
        await onSubmitOverride(dados);
        return;
      }
      const resposta = await apiRequest(
        imovel ? `/imoveis/${imovel.id}` : proprietario ? "/imoveis/meus" : "/imoveis",
        { method: imovel ? "PATCH" : "POST", body: dados },
        token
      );
      onSaved(resposta);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
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
          <Field label="ID do proprietário">
            <input className="input" name="proprietario_id" type="number" min="1" value={formulario.proprietario_id} onChange={alterar} required />
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
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        {onDraftSave && <button type="button" className="btn-secondary" disabled={salvando} onClick={() => onDraftSave(prepararDados())}>{salvando ? "Salvando..." : "Salvar rascunho"}</button>}
        <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? "Enviando..." : submitLabel || "Salvar imóvel"}</button>
      </div>
    </form>
  );
}
