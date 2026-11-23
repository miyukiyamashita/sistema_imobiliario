import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/ToastProvider";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const dadosIniciais = { proprietario_id: "", tipo: "", finalidade: "VENDA", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "", area: "", valor: "", quartos: "0", banheiros: "0", vagas_garagem: "0", descricao: "" };
const camposNumericos = ["proprietario_id", "area", "valor", "quartos", "banheiros", "vagas_garagem"];

function prepararDadosFormulario(imovel) {
  if (!imovel) return { ...dadosIniciais };
  const dados = {};
  for (const campo of Object.keys(dadosIniciais)) dados[campo] = String(imovel[campo] ?? "");
  dados.finalidade = imovel.finalidade;
  return dados;
}

function FormularioImovel() {
  const { token } = useAuth();
  const { success, error: notificarErro } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const modoEdicao = Boolean(id);
  const [imovel, setImovel] = useState(null);
  const [formulario, setFormulario] = useState(() => prepararDadosFormulario(null));
  const [carregandoImovel, setCarregandoImovel] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) return;
    async function carregarImovel() {
      try {
        const dados = await apiRequest(`/imoveis/${id}`, {}, token);
        setImovel(dados);
        setFormulario(prepararDadosFormulario(dados));
      } catch (requestError) {
        setErro(requestError.message);
      } finally {
        setCarregandoImovel(false);
      }
    }
    carregarImovel();
  }, [id, token]);

  function alterarCampo(event) {
    const { name, value } = event.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  }

  async function salvarImovel(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const dados = { ...formulario, proprietario_id: Number(formulario.proprietario_id), area: Number(formulario.area), valor: Number(formulario.valor), quartos: Number(formulario.quartos), banheiros: Number(formulario.banheiros), vagas_garagem: Number(formulario.vagas_garagem), estado: formulario.estado.trim().toUpperCase(), complemento: formulario.complemento.trim() || null, descricao: formulario.descricao.trim() || null };
      const dadosEnvio = modoEdicao ? Object.fromEntries(Object.entries(dados).filter(([campo, valor]) => camposNumericos.includes(campo) ? Number(valor) !== Number(imovel[campo]) : String(valor ?? "") !== String(imovel[campo] ?? ""))) : dados;
      if (modoEdicao && Object.keys(dadosEnvio).length === 0) {
        success("Nenhuma alteração foi realizada.");
        return;
      }
      const endpoint = modoEdicao ? `/imoveis/${id}` : "/imoveis";
      const resultado = await apiRequest(endpoint, { method: modoEdicao ? "PATCH" : "POST", body: dadosEnvio }, token);
      success(modoEdicao ? `Imóvel #${resultado.id} atualizado com sucesso.` : `Imóvel #${resultado.id} cadastrado com sucesso.`);
      if (modoEdicao) navigate("/imoveis");
      else setFormulario({ ...dadosIniciais });
    } catch (requestError) {
      setErro(requestError.message);
      notificarErro(requestError.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregandoImovel) return <div className="card form-card"><LoadingSpinner label="Carregando imóvel..." /></div>;
  if (modoEdicao && !imovel) return <div className="card empty-state"><h3>Não foi possível carregar este imóvel</h3><p>{erro}</p><Link to="/imoveis">Voltar à listagem</Link></div>;

  return (
    <div>
      <div className="page-intro"><div><p className="eyebrow">{modoEdicao ? `IMÓVEL #${id}` : "NOVO CADASTRO"}</p><h2>{modoEdicao ? "Editar imóvel" : "Cadastrar imóvel"}</h2><p>{modoEdicao ? "Atualize os dados e salve as alterações." : "Preencha os dados para adicionar um imóvel à sua carteira."}</p></div><Link to="/imoveis" className="button button-secondary button-md">Cancelar</Link></div>
      <form className="card form-card" onSubmit={salvarImovel}>
        {erro && <p className="inline-message inline-error" role="alert">{erro}</p>}
        <fieldset className="form-section" disabled={salvando}><legend>Informações do imóvel</legend><div className="form-grid"><Input label="ID do proprietário" name="proprietario_id" type="number" min="1" step="1" value={formulario.proprietario_id} onChange={alterarCampo} required /><Input label="Tipo de imóvel" name="tipo" value={formulario.tipo} onChange={alterarCampo} minLength={2} maxLength={50} required /><div className="field"><label htmlFor="finalidade">Finalidade <span className="required-mark">*</span></label><select id="finalidade" name="finalidade" value={formulario.finalidade} onChange={alterarCampo} required><option value="VENDA">Venda</option><option value="LOCACAO">Locação</option></select></div></div></fieldset>
        <fieldset className="form-section" disabled={salvando}><legend>Endereço</legend><div className="form-grid"><Input label="Logradouro" name="logradouro" value={formulario.logradouro} onChange={alterarCampo} minLength={3} maxLength={200} required /><Input label="Número" name="numero" value={formulario.numero} onChange={alterarCampo} maxLength={20} required /><Input label="Complemento" name="complemento" value={formulario.complemento} onChange={alterarCampo} maxLength={100} /><Input label="Bairro" name="bairro" value={formulario.bairro} onChange={alterarCampo} minLength={2} maxLength={100} required /><Input label="Cidade" name="cidade" value={formulario.cidade} onChange={alterarCampo} minLength={2} maxLength={100} required /><Input label="Estado (UF)" name="estado" value={formulario.estado} onChange={alterarCampo} maxLength={2} required /><Input label="CEP" name="cep" value={formulario.cep} onChange={alterarCampo} inputMode="numeric" required /></div></fieldset>
        <fieldset className="form-section" disabled={salvando}><legend>Valores e características</legend><div className="form-grid-three"><Input label="Valor (R$)" name="valor" type="number" min="0.01" step="0.01" value={formulario.valor} onChange={alterarCampo} required /><Input label="Área (m²)" name="area" type="number" min="0.01" step="0.01" value={formulario.area} onChange={alterarCampo} required /><Input label="Quartos" name="quartos" type="number" min="0" step="1" value={formulario.quartos} onChange={alterarCampo} required /><Input label="Banheiros" name="banheiros" type="number" min="0" step="1" value={formulario.banheiros} onChange={alterarCampo} required /><Input label="Vagas de garagem" name="vagas_garagem" type="number" min="0" step="1" value={formulario.vagas_garagem} onChange={alterarCampo} required /></div></fieldset>
        <fieldset className="form-section" disabled={salvando}><legend>Descrição</legend><div className="field"><label htmlFor="descricao">Detalhes do imóvel</label><textarea id="descricao" name="descricao" value={formulario.descricao} onChange={alterarCampo} placeholder="Adicione informações relevantes sobre o imóvel..." /></div></fieldset>
        <div className="form-actions"><Link to="/imoveis" className="button button-secondary button-md">Cancelar</Link><Button type="submit" loading={salvando}>{salvando ? "Salvando" : modoEdicao ? "Salvar alterações" : "Cadastrar imóvel"}</Button></div>
      </form>
    </div>
  );
}

export default FormularioImovel;
