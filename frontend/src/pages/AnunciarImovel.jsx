import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FormularioImovel from "./FormularioImovel";
import { apiRequest } from "../services/api";

export default function AnunciarImovel({ token, onNavigate }) {
  const [searchParams] = useSearchParams();
  const imovelId = searchParams.get("imovel_id");
  const [imovel, setImovel] = useState(null);
  const [carregandoImovel, setCarregandoImovel] = useState(Boolean(imovelId));
  const [documentoExistente, setDocumentoExistente] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [documento, setDocumento] = useState(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const recoveryKey = "futura_rascunho_submissao";

  useEffect(() => {
    if (!imovelId) return undefined;
    let ativo = true;
    Promise.all([
      apiRequest("/imoveis/meus", {}, token),
      apiRequest(`/imoveis/meus/${imovelId}/documentos`, {}, token),
    ])
      .then(([imoveis, documentos]) => {
        if (!ativo) return;
        const encontrado = imoveis.find((item) => String(item.id) === String(imovelId));
        if (!encontrado) {
          throw new Error("Imóvel não encontrado ou não pertence ao usuário autenticado.");
        }
        setImovel(encontrado);
        setDocumentoExistente(documentos.length > 0);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregandoImovel(false);
      });
    return () => {
      ativo = false;
    };
  }, [imovelId, token]);

  async function enviar(dados) {
    if (!documento && !documentoExistente) {
      setErro("Selecione o comprovante de propriedade antes de enviar.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const recoverySalvo = JSON.parse(sessionStorage.getItem(recoveryKey) || "null");
      const recovery = recoverySalvo && (!imovel || String(recoverySalvo.imovelId) === String(imovel.id))
        ? recoverySalvo
        : null;
      let imovelAtual = imovel || (recovery?.imovelId ? { id: recovery.imovelId } : null);
      if (!imovelAtual) {
        imovelAtual = await apiRequest("/imoveis/meus", { method: "POST", body: dados }, token);
        sessionStorage.setItem(recoveryKey, JSON.stringify({ imovelId: imovelAtual.id, fotos: [] }));
      } else {
        imovelAtual = await apiRequest(`/imoveis/meus/${imovelAtual.id}`, { method: "PATCH", body: dados }, token);
      }
      const enviados = new Set(recovery?.fotos || []);
      for (const arquivo of fotos) {
        const chave = `${arquivo.name}:${arquivo.size}:${arquivo.lastModified}`;
        if (enviados.has(chave)) continue;
        const body = new FormData();
        body.append("arquivo", arquivo);
        await apiRequest(`/imoveis/meus/${imovelAtual.id}/fotos`, { method: "POST", body }, token);
        enviados.add(chave);
        sessionStorage.setItem(recoveryKey, JSON.stringify({ imovelId: imovelAtual.id, fotos: [...enviados] }));
      }
      const documentoChave = documento
        ? `${documento.name}:${documento.size}:${documento.lastModified}`
        : null;
      if (documento && recovery?.documento !== documentoChave && !documentoExistente) {
        const body = new FormData();
        body.append("arquivo", documento);
        await apiRequest(`/imoveis/meus/${imovelAtual.id}/documentos`, { method: "POST", body }, token);
        sessionStorage.setItem(recoveryKey, JSON.stringify({ imovelId: imovelAtual.id, fotos: [...enviados], documento: documentoChave }));
      }
      await apiRequest(`/imoveis/meus/${imovelAtual.id}/solicitacoes`, { method: "POST" }, token);
      sessionStorage.removeItem(recoveryKey);
      onNavigate("solicitacoes");
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  async function salvarRascunho(dados) {
    setEnviando(true);
    setErro("");
    try {
      const resposta = imovel
        ? await apiRequest(`/imoveis/meus/${imovel.id}`, { method: "PATCH", body: dados }, token)
        : await apiRequest("/imoveis/meus", { method: "POST", body: dados }, token);
      setImovel(resposta);
      sessionStorage.setItem(recoveryKey, JSON.stringify({ imovelId: resposta.id, fotos: [] }));
      setErro("Rascunho salvo. Você ainda precisa enviar os arquivos e clicar em \"Enviar para análise\".");
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  const arquivos = (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">Arquivos da submissão</p>
      <p className="mt-1 text-xs text-slate-500">A seleção acontece antes do envio; nada é enviado até confirmar.</p>
      <label className="btn-secondary mt-4 inline-flex cursor-pointer text-xs">Selecionar fotografias
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => setFotos(Array.from(event.target.files || []))} />
      </label>
      <p className="mt-2 text-xs text-slate-500">{fotos.length} fotografia(s) selecionada(s)</p>
      <label className="btn-secondary mt-3 inline-flex cursor-pointer text-xs">Selecionar comprovante
        <input type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(event) => { setDocumento(event.target.files?.[0] || null); setDocumentoExistente(false); }} />
      </label>
      <p className="mt-2 text-xs text-slate-500">
        {documento?.name || (documentoExistente ? "Comprovante já anexado" : "Nenhum documento selecionado")}
      </p>
      {erro && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      {enviando && <p role="status" className="mt-3 text-xs text-slate-500">Criando o imóvel e enviando os arquivos...</p>}
    </div>
  );

  if (carregandoImovel) {
    return <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando imóvel...</p>;
  }

  return (
    <section className="space-y-5">
      <div><h2 className="text-xl font-bold text-slate-900">Anunciar meu imóvel</h2><p className="mt-1 text-sm text-slate-500">Preencha os dados e envie a solicitação para análise em uma única ação.</p></div>
      <FormularioImovel token={token} proprietario imovel={imovel} onCancel={() => onNavigate("meus-imoveis")} onSubmitOverride={enviar} onDraftSave={salvarRascunho} submitLabel="Enviar para análise" extra={arquivos} />
    </section>
  );
}
