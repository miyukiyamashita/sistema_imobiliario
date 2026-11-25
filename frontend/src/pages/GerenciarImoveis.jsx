/* eslint-disable react/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import { NavegacaoInterna } from "../components/Layout";
import { apiRequest } from "../services/api";
import FormularioImovel from "./FormularioImovel";

function Fotos({ imovel, token }) {
  const [fotos, setFotos] = useState([]);
  const [erro, setErro] = useState("");
  const carregar = useCallback(async () => {
    try { setFotos(await apiRequest(`/imoveis/${imovel.id}/fotos`, {}, token)); }
    catch (error) { setErro(error.message); }
  }, [imovel.id, token]);
  useEffect(() => { carregar(); }, [carregar]);

  async function enviar(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;
    const body = new FormData();
    body.append("arquivo", arquivo);
    try { await apiRequest(`/imoveis/${imovel.id}/fotos`, { method: "POST", body }, token); await carregar(); }
    catch (error) { setErro(error.message); }
  }

  async function excluir(id) {
    try { await apiRequest(`/imoveis/${imovel.id}/fotos/${id}`, { method: "DELETE" }, token); await carregar(); }
    catch (error) { setErro(error.message); }
  }

  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-4">
      <label className="btn-secondary inline-flex cursor-pointer text-xs">Adicionar foto
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={enviar} />
      </label>
      {erro && <p className="mt-2 text-xs text-red-700">{erro}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {fotos.map((foto) => <button key={foto.id} type="button" onClick={() => excluir(foto.id)} className="rounded-lg border bg-white px-3 py-2 text-xs text-slate-600">{foto.nome_arquivo} ×</button>)}
      </div>
    </div>
  );
}

export default function GerenciarImoveis({ token, onNavigate }) {
  const [imoveis, setImoveis] = useState([]);
  const [proprietarios, setProprietarios] = useState([]);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(null);
  const [novo, setNovo] = useState(false);
  const [buscaProprietario, setBuscaProprietario] = useState("");
  const carregar = useCallback(async () => {
    try { setImoveis(await apiRequest("/imoveis", {}, token)); }
    catch (error) { setErro(error.message); }
  }, [token]);
  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    apiRequest(`/usuarios/proprietarios${buscaProprietario ? `?busca=${encodeURIComponent(buscaProprietario)}` : ""}`, {}, token)
      .then(setProprietarios).catch((error) => setErro(error.message));
  }, [buscaProprietario, token]);

  async function acao(id, caminho, metodo = "PATCH") {
    try { await apiRequest(`/imoveis/${id}${caminho ? `/${caminho}` : ""}`, { method: metodo }, token); await carregar(); }
    catch (error) { setErro(error.message); }
  }

  function fecharFormulario() { setNovo(false); setEditando(null); }

  if (novo || editando) {
    return (
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-slate-900">{editando ? "Editar imóvel" : "Novo imóvel"}</h2>
        <FormularioImovel
          token={token}
          imovel={editando}
          proprietarios={proprietarios}
          buscaProprietario={buscaProprietario}
          onBuscaProprietario={setBuscaProprietario}
          mostrarRetorno
          onCancel={fecharFormulario}
          onSaved={() => { fecharFormulario(); carregar(); }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <NavegacaoInterna onNavigate={onNavigate} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold text-slate-900">Gerenciar imóveis</h2><p className="mt-1 text-sm text-slate-500">Cadastre, publique e mantenha os imóveis do catálogo.</p></div>
        <button className="btn-primary" type="button" onClick={() => setNovo(true)}>Novo imóvel</button>
      </div>
      {erro && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{erro}</p>}
      <div className="grid gap-4">
        {imoveis.map((imovel) => (
          <article key={imovel.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold text-slate-900">{imovel.tipo} · {imovel.cidade}</h3><p className="text-sm text-slate-500">{imovel.bairro} · R$ {Number(imovel.valor).toLocaleString("pt-BR")}</p><p className="mt-2 text-xs text-slate-500">{imovel.publicado ? "Publicado" : "Não publicado"} · {imovel.situacao_comercial}</p></div>
              <div className="flex flex-wrap gap-2"><button className="btn-secondary text-xs" type="button" onClick={() => setEditando(imovel)}>Editar</button>{imovel.publicado ? <button className="btn-secondary text-xs" type="button" onClick={() => acao(imovel.id, "inativar")}>Inativar</button> : <button className="btn-primary text-xs" type="button" onClick={() => acao(imovel.id, "publicar")}>Publicar</button>}<button className="btn-secondary text-xs" type="button" onClick={() => acao(imovel.id, "", "DELETE")}>Excluir</button></div>
            </div>
            <Fotos imovel={imovel} token={token} />
          </article>
        ))}
      </div>
      {!imoveis.length && <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">Nenhum imóvel cadastrado.</p>}
    </section>
  );
}
