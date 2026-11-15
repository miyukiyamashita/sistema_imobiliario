
import { useState } from "react";
import { apiRequest } from "../services/api";

function Login({ onLogin, onCadastro }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function realizarLogin(event) {
    event.preventDefault();
    setMensagem("");
    setCarregando(true);

    try {
      const resposta = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });

      await onLogin(resposta.access_token);
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main>
      <h1>Sistema Imobiliário</h1>
      <h2>Entrar na minha conta</h2>

      <form onSubmit={realizarLogin}>
        <div>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p>Ainda não possui uma conta?</p>

      <button type="button" onClick={onCadastro}>
        Criar conta
      </button>

      <p role="alert">{mensagem}</p>
    </main>
  );
}

export default Login;
