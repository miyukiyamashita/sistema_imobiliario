import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function realizarLogin(event) {
    event.preventDefault();
    setMensagem("");
    setCarregando(true);
    try {
      const resposta = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) });
      await entrar(resposta.access_token);
      navigate("/dashboard", { replace: true });
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual"><div className="brand"><span className="brand-mark">F</span><span>Futura <small>Imóveis</small></span></div><div><h1>Gestão imobiliária <span className="auth-accent">mais inteligente.</span></h1><p>Centralize seus imóveis, mantenha sua operação organizada e tome decisões com mais agilidade.</p></div><small>© 2026 Futura Imóveis</small></section>
      <section className="auth-form-area"><div className="card auth-card">
        <p className="eyebrow">BEM-VINDO DE VOLTA</p><h2>Entre na sua conta</h2><p>Acesse o painel para continuar sua operação.</p>
        {mensagem && <p className="inline-message inline-error" role="alert">{mensagem}</p>}
        <form className="auth-form" onSubmit={realizarLogin}>
          <Input label="E-mail" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          <div className="field"><label htmlFor="senha">Senha</label><div className="password-wrap"><input id="senha" name="senha" type={mostrarSenha ? "text" : "password"} value={senha} onChange={(event) => setSenha(event.target.value)} required autoComplete="current-password" /><button className="password-toggle" type="button" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}>{mostrarSenha ? "Ocultar" : "Mostrar"}</button></div></div>
          <Button type="submit" loading={carregando}>{carregando ? "Entrando" : "Entrar no painel"}</Button>
        </form>
        <p className="auth-footer">Ainda não possui uma conta? <Link to="/cadastro">Criar conta</Link></p>
      </div></section>
    </main>
  );
}

export default Login;
