import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

function Cadastro() {
  const [formulario, setFormulario] = useState({ nome: "", email: "", cpf: "", senha: "", perfil: "CLIENTE" });
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  }

  async function realizarCadastro(event) {
    event.preventDefault();
    setMensagem("");
    setCarregando(true);
    try {
      await apiRequest("/usuarios/cadastro", { method: "POST", body: formulario });
      setSucesso(true);
      setMensagem("Cadastro realizado com sucesso! Agora você já pode acessar sua conta.");
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual"><div className="brand"><span className="brand-mark">F</span><span>Futura <small>Imóveis</small></span></div><div><h1>Seu próximo passo começa <span className="auth-accent">aqui.</span></h1><p>Crie seu acesso e faça parte de uma gestão imobiliária mais simples.</p></div><small>© 2026 Futura Imóveis</small></section>
      <section className="auth-form-area"><div className="card auth-card">
        <p className="eyebrow">NOVO ACESSO</p><h2>Criar conta</h2><p>Preencha seus dados para começar.</p>
        {mensagem && <p className={`inline-message ${sucesso ? "inline-success" : "inline-error"}`} role={sucesso ? "status" : "alert"}>{mensagem}</p>}
        {!sucesso && <form className="auth-form" onSubmit={realizarCadastro}>
          <Input label="Nome completo" name="nome" value={formulario.nome} onChange={atualizarCampo} minLength={3} required autoComplete="name" />
          <Input label="E-mail" name="email" type="email" value={formulario.email} onChange={atualizarCampo} required autoComplete="email" />
          <Input label="CPF" name="cpf" value={formulario.cpf} onChange={atualizarCampo} inputMode="numeric" maxLength={14} placeholder="000.000.000-00" required />
          <Input label="Senha" name="senha" type="password" value={formulario.senha} onChange={atualizarCampo} minLength={8} maxLength={128} required autoComplete="new-password" />
          <div className="field"><label htmlFor="perfil">Tipo de conta</label><select id="perfil" name="perfil" value={formulario.perfil} onChange={atualizarCampo}><option value="CLIENTE">Cliente</option><option value="PROPRIETARIO">Proprietário</option></select></div>
          <Button type="submit" loading={carregando}>{carregando ? "Criando conta" : "Criar conta"}</Button>
        </form>}
        <p className="auth-footer"><Link to="/login">Voltar para o login</Link></p><p className="auth-footer"><Link to="/imoveis/catalogo">Explorar catálogo público</Link></p>
      </div></section>
    </main>
  );
}

export default Cadastro;
