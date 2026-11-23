import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./ui/ToastProvider";
import Button from "./ui/Button";
import LoadingSpinner from "./ui/LoadingSpinner";

function hojeEmSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function AgendamentoVisita({ imovel }) {
  const { token, usuario } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [horario, setHorario] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!aberto || !data) { setHorarios([]); setHorario(""); return undefined; }
    let ativo = true;
    setCarregandoHorarios(true); setHorario("");
    apiRequest(`/imoveis/${imovel.id}/horarios-disponiveis?data=${encodeURIComponent(data)}`, {}, token)
      .then((resposta) => { if (ativo) setHorarios(resposta.horarios); })
      .catch((requestError) => { if (ativo) { setHorarios([]); error(requestError.message); } })
      .finally(() => { if (ativo) setCarregandoHorarios(false); });
    return () => { ativo = false; };
  }, [aberto, data, imovel.id, token, error]);

  function abrir() {
    if (!usuario) {
      navigate("/login", { state: { de: { pathname: location.pathname, search: location.search } } });
      return;
    }
    if (usuario.perfil === "CLIENTE") setAberto(true);
  }

  async function solicitar(event) {
    event.preventDefault();
    if (!data || !horario) { error("Selecione uma data e um horário disponível."); return; }
    setEnviando(true);
    try {
      await apiRequest("/solicitacoes-visita", { method: "POST", body: { imovel_id: imovel.id, data_visita: data, horario_visita: horario, observacoes: observacoes || null } }, token);
      success("Solicitação criada. A visita está PENDENTE de confirmação administrativa.");
      setAberto(false); setData(""); setHorario(""); setObservacoes("");
    } catch (requestError) {
      if (requestError.message.toLowerCase().includes("ocupado") || requestError.message.toLowerCase().includes("solicitado")) {
        error("Esse horário acabou de ser ocupado. Atualizamos a lista de horários disponíveis.");
        if (data) {
          const resposta = await apiRequest(`/imoveis/${imovel.id}/horarios-disponiveis?data=${encodeURIComponent(data)}`, {}, token).catch(() => null);
          if (resposta) setHorarios(resposta.horarios);
        }
      } else error(requestError.message);
    } finally { setEnviando(false); }
  }

  return <div className="visit-scheduling"><div className="visit-heading"><div><h2>Visitar este imóvel</h2><p>Escolha um horário para enviar sua solicitação.</p></div>{usuario?.perfil === "CLIENTE" || !usuario ? <Button size="sm" onClick={abrir}>{usuario ? "Agendar visita" : "Entrar para agendar"}</Button> : null}</div>{usuario && usuario.perfil !== "CLIENTE" && <p className="field-hint">O agendamento de visitas está disponível somente para clientes.</p>}{aberto && <form className="visit-form" onSubmit={solicitar}><div className="field"><label htmlFor="data-visita">Data da visita</label><input id="data-visita" type="date" min={hojeEmSaoPaulo()} value={data} onChange={(event) => setData(event.target.value)} required /><small className="field-hint">Atendimento de segunda a sexta-feira.</small></div>{data && (carregandoHorarios ? <LoadingSpinner label="Consultando horários..." /> : <fieldset className="time-slots"><legend>Horário disponível</legend>{horarios.map((item) => <label className={`time-slot ${item.disponivel ? "" : "time-slot-occupied"}`} key={item.horario}><input type="radio" name="horario-visita" value={item.horario} checked={horario === item.horario} onChange={() => setHorario(item.horario)} disabled={!item.disponivel || enviando} />{item.horario.slice(0, 5)}{!item.disponivel && <span>Indisponível</span>}</label>)}</fieldset>)}<div className="field"><label htmlFor="observacoes-visita">Observações (opcional)</label><textarea id="observacoes-visita" className="textarea" rows="3" maxLength="2000" value={observacoes} onChange={(event) => setObservacoes(event.target.value)} /></div><div className="form-actions"><Button type="button" variant="ghost" onClick={() => setAberto(false)} disabled={enviando}>Cancelar</Button><Button type="submit" loading={enviando}>Solicitar visita</Button></div></form>}</div>;
}

export default AgendamentoVisita;
