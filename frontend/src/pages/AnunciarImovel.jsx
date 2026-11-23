import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/ToastProvider";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const TAMANHO_FOTO = 5 * 1024 * 1024;
const TAMANHO_DOCUMENTO = 10 * 1024 * 1024;
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];
const TIPOS_DOCUMENTO = ["application/pdf", "image/jpeg", "image/png"];
const inicial = { tipo: "", finalidade: "VENDA", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "", area: "", valor: "", quartos: 0, banheiros: 0, vagas_garagem: 0, descricao: "" };

function chaveArquivo(arquivo) { return `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`; }

function AnunciarImovel() {
  const { token, usuario } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const formularioRef = useRef(null);
  const fotosSelecionadasRef = useRef([]);
  const [form, setForm] = useState(inicial);
  const [id, setId] = useState(params.get("imovel"));
  const [docs, setDocs] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [_fotos, setFotos] = useState([]);
  const [fotosSelecionadas, setFotosSelecionadas] = useState([]);
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(Boolean(params.get("imovel")));
  const [mensagemOperacao, setMensagemOperacao] = useState("");
  const chaveRecuperacao = useMemo(() => usuario?.id ? `rf04-draft-${usuario.id}` : null, [usuario?.id]);

  useEffect(() => {
    if (!chaveRecuperacao || id) return;
    const draftId = sessionStorage.getItem(chaveRecuperacao);
    if (draftId) { setId(draftId); setCarregando(true); }
  }, [chaveRecuperacao, id]);

  useEffect(() => {
    if (!id) { setCarregando(false); return undefined; }
    let ativo = true;
    Promise.all([apiRequest("/imoveis/meus", {}, token), apiRequest(`/imoveis/meus/${id}/documentos`, {}, token), apiRequest(`/imoveis/meus/${id}/fotos`, {}, token), apiRequest("/minhas-solicitacoes", {}, token)])
      .then(([lista, documentos, imagens, todasSolicitacoes]) => {
        if (!ativo) return;
        const item = lista.find((imovel) => String(imovel.id) === String(id));
        if (!item) throw new Error("Imóvel não encontrado.");
        setForm(Object.fromEntries(Object.keys(inicial).map((campo) => [campo, item[campo] ?? ""])));
        setDocs(documentos); setFotos(imagens); setSolicitacoes(todasSolicitacoes.filter((solicitacao) => String(solicitacao.imovel_id) === String(id)));
      }).catch((requestError) => { if (ativo) error(requestError.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [id, token, error]);

  useEffect(() => { fotosSelecionadasRef.current = fotosSelecionadas; }, [fotosSelecionadas]);
  useEffect(() => () => { fotosSelecionadasRef.current.forEach((foto) => URL.revokeObjectURL(foto.preview)); }, []);

  function alterar(event) { setForm((anterior) => ({ ...anterior, [event.target.name]: event.target.value })); }
  function validarFormulario() { if (!formularioRef.current?.reportValidity()) { error("Revise os campos obrigatórios do imóvel."); return false; } return true; }
  function validarArquivo(arquivo, tipos, tamanho, mensagem) { if (!tipos.includes(arquivo.type)) { error(`Formato inválido. ${mensagem}`); return false; } if (arquivo.size > tamanho) { error(`O arquivo deve ter no máximo ${tamanho / (1024 * 1024)} MB.`); return false; } return true; }

  function selecionarFotos(event) {
    const arquivos = Array.from(event.target.files || []); event.target.value = "";
    const validos = arquivos.filter((arquivo) => validarArquivo(arquivo, TIPOS_FOTO, TAMANHO_FOTO, "Utilize JPG, PNG ou WEBP."));
    setFotosSelecionadas((anteriores) => { const chaves = new Set(anteriores.map((foto) => foto.chave)); const novos = validos.filter((arquivo) => !chaves.has(chaveArquivo(arquivo))).map((arquivo) => ({ arquivo, chave: chaveArquivo(arquivo), preview: URL.createObjectURL(arquivo), enviado: false })); return [...anteriores, ...novos]; });
  }

  function selecionarDocumento(event) { const arquivo = event.target.files?.[0]; event.target.value = ""; if (arquivo && validarArquivo(arquivo, TIPOS_DOCUMENTO, TAMANHO_DOCUMENTO, "Utilize PDF, JPG ou PNG.")) setDocumentoSelecionado({ arquivo, chave: chaveArquivo(arquivo) }); }
  function removerFotoSelecionada(foto) { URL.revokeObjectURL(foto.preview); setFotosSelecionadas((anteriores) => anteriores.filter((item) => item.chave !== foto.chave)); }
  function salvarIdRecuperacao(imovelId) { setId(imovelId); if (chaveRecuperacao) sessionStorage.setItem(chaveRecuperacao, String(imovelId)); }
  function montarPayload() { return { ...form, area: Number(form.area), valor: Number(form.valor), quartos: Number(form.quartos), banheiros: Number(form.banheiros), vagas_garagem: Number(form.vagas_garagem) }; }

  async function criarOuAtualizarDraft(notificar = true) {
    const item = id ? await apiRequest(`/imoveis/meus/${id}`, { method: "PATCH", body: montarPayload() }, token) : await apiRequest("/imoveis/meus", { method: "POST", body: montarPayload() }, token);
    salvarIdRecuperacao(item.id); if (notificar) success("Rascunho salvo. Você pode continuar o envio quando quiser."); return item.id;
  }

  async function salvarDraft(event) { event.preventDefault(); if (!validarFormulario()) return; setSalvando(true); try { await criarOuAtualizarDraft(); } catch (requestError) { error(requestError.message); } finally { setSalvando(false); } }

  async function enviarFotos(imovelId) {
    for (const foto of fotosSelecionadas) {
      if (foto.enviado) continue;
      setMensagemOperacao(`Enviando fotografia ${fotosSelecionadas.indexOf(foto) + 1} de ${fotosSelecionadas.length}...`);
      const dados = new FormData(); dados.append("arquivo", foto.arquivo);
      const resultado = await apiRequest(`/imoveis/meus/${imovelId}/fotos`, { method: "POST", body: dados }, token);
      setFotos((anteriores) => [...anteriores, resultado]);
      setFotosSelecionadas((anteriores) => anteriores.map((item) => item.chave === foto.chave ? { ...item, enviado: true } : item));
    }
  }

  async function enviarDocumento(imovelId) {
    if (!documentoSelecionado) return;
    setMensagemOperacao("Enviando comprovante de propriedade...");
    const dados = new FormData(); dados.append("arquivo", documentoSelecionado.arquivo);
    const resultado = await apiRequest(`/imoveis/meus/${imovelId}/documentos`, { method: "POST", body: dados }, token);
    setDocs((anteriores) => [...anteriores, resultado]); setDocumentoSelecionado(null);
  }

  async function submeter(event) {
    event.preventDefault(); if (!validarFormulario()) return;
    const ultimaSolicitacao = solicitacoes[0];
    const precisaDocumento = docs.length === 0 || ultimaSolicitacao?.status === "REJEITADO";
    if (precisaDocumento && !documentoSelecionado) { error("Selecione um comprovante de propriedade antes de enviar para análise."); return; }
    setSalvando(true); setMensagemOperacao("Preparando sua solicitação...");
    try {
      const imovelId = await criarOuAtualizarDraft(false);
      await enviarFotos(imovelId); await enviarDocumento(imovelId);
      setMensagemOperacao("Registrando solicitação para análise...");
      await apiRequest(`/imoveis/meus/${imovelId}/solicitacoes`, { method: "POST" }, token);
      if (chaveRecuperacao) sessionStorage.removeItem(chaveRecuperacao);
      success("Imóvel enviado para análise com sucesso. Status: EM ANÁLISE."); navigate("/minhas-solicitacoes");
    } catch (requestError) { error(`O envio foi interrompido. ${requestError.message} Seus dados e arquivos selecionados foram preservados para tentar novamente.`); }
    finally { setMensagemOperacao(""); setSalvando(false); }
  }

  if (carregando) return <LoadingSpinner label="Carregando imóvel..." />;
  return <form className="owner-form" ref={formularioRef} onSubmit={salvarDraft}>
    <div className="page-intro"><div><p className="eyebrow">ENVIO PARA ANÁLISE</p><h2>Anunciar meu imóvel</h2><p>Preencha os dados e selecione os arquivos. Nada será enviado até clicar em “Enviar para análise”.</p></div><Button type="submit" loading={salvando && !mensagemOperacao}>Salvar rascunho</Button></div>
    {mensagemOperacao && <p className="inline-message inline-info" role="status">{mensagemOperacao}</p>}
    <Card className="form-card"><div className="form-section"><h3>Informações do imóvel</h3><div className="form-grid"><Input label="Tipo" name="tipo" value={form.tipo} onChange={alterar} required placeholder="Apartamento, casa..." /><div className="field"><label htmlFor="finalidade">Finalidade *</label><select id="finalidade" name="finalidade" value={form.finalidade} onChange={alterar}><option value="VENDA">Venda</option><option value="LOCACAO">Locação</option></select></div><Input label="Área (m²)" name="area" type="number" min="0.01" step="0.01" value={form.area} onChange={alterar} required /><Input label="Valor (R$)" name="valor" type="number" min="0.01" step="0.01" value={form.valor} onChange={alterar} required /><Input label="Quartos" name="quartos" type="number" min="0" value={form.quartos} onChange={alterar} /><Input label="Banheiros" name="banheiros" type="number" min="0" value={form.banheiros} onChange={alterar} /><Input label="Vagas" name="vagas_garagem" type="number" min="0" value={form.vagas_garagem} onChange={alterar} /></div></div><div className="form-section"><h3>Endereço</h3><div className="form-grid"><Input label="Logradouro" name="logradouro" value={form.logradouro} onChange={alterar} required /><Input label="Número" name="numero" value={form.numero} onChange={alterar} required /><Input label="Complemento" name="complemento" value={form.complemento} onChange={alterar} /><Input label="Bairro" name="bairro" value={form.bairro} onChange={alterar} required /><Input label="Cidade" name="cidade" value={form.cidade} onChange={alterar} required /><Input label="UF" name="estado" maxLength="2" value={form.estado} onChange={alterar} required /><Input label="CEP" name="cep" value={form.cep} onChange={alterar} required /></div></div><div className="form-section"><h3>Descrição</h3><textarea className="textarea" name="descricao" value={form.descricao} onChange={alterar} rows="4" placeholder="Descreva o imóvel" /></div></Card>
    <Card className="submission-files"><h3>Arquivos da solicitação</h3><p className="field-hint">A seleção é local até a submissão. Fotografias são opcionais; o comprovante de propriedade é obrigatório.</p><div className="file-actions"><label className="button button-secondary button-md">Selecionar fotografias<input hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selecionarFotos} disabled={salvando} /></label><label className="button button-secondary button-md">Selecionar comprovante<input hidden type="file" accept="application/pdf,image/jpeg,image/png" onChange={selecionarDocumento} disabled={salvando} /></label></div>{fotosSelecionadas.length > 0 && <div className="photo-gallery">{fotosSelecionadas.map((foto) => <figure className="photo-item" key={foto.chave}><img src={foto.preview} alt={`Pré-visualização de ${foto.arquivo.name}`} /><figcaption>{foto.arquivo.name}{foto.enviado ? " · enviado" : " · aguardando envio"}</figcaption><button type="button" onClick={() => removerFotoSelecionada(foto)} disabled={salvando}>Remover</button></figure>)}</div>}{documentoSelecionado && <p className="selected-file">Comprovante selecionado: <strong>{documentoSelecionado.arquivo.name}</strong> <button type="button" onClick={() => setDocumentoSelecionado(null)} disabled={salvando}>Remover</button></p>}{docs.length > 0 && <p className="selected-file">Comprovante já enviado: <strong>{docs.map((doc) => doc.nome_original).join(", ")}</strong></p>}<div className="form-actions"><Button type="button" variant="ghost" onClick={() => navigate("/meus-imoveis")} disabled={salvando}>Cancelar</Button><Button type="button" onClick={submeter} loading={salvando}>Enviar para análise</Button></div></Card>
  </form>;
}

export default AnunciarImovel;
