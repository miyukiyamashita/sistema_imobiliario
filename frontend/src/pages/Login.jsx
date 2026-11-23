import { useState } from "react";
import { apiRequest } from "../services/api";
import { AuthShell, Field } from "../components/Layout";
import { Icon } from "../components/Icon";

function Login({ onLogin, onDemoLogin, onNavigate }) {
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
      const resposta = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });

      await onLogin(resposta.access_token);
    } catch (erro) {
      setMensagem(erro.message || "Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell
      onNavigate={onNavigate}
      title="Bem-vindo de volta"
      subtitle="Entre para acompanhar seus imóveis, visitas e propostas."
    >
      <form onSubmit={realizarLogin} className="mt-8 space-y-5">
        <Field label="E-mail">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="voce@email.com"
            required
          />
        </Field>

        <Field label="Senha">
          <div className="relative">
            <input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input pr-16"
              placeholder="Sua senha"
              required
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-700"
            >
              {mostrarSenha ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </Field>

        {mensagem && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
          >
            {mensagem}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="btn-primary h-12 w-full"
        >
          {carregando ? "Entrando..." : "Entrar"} <Icon name="arrow" size={18} />
        </button>
      </form>

      {onDemoLogin && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onDemoLogin}
            className="btn-secondary h-11 w-full text-xs"
          >
            Entrar em modo demonstração (sem backend)
          </button>
        </div>
      )}

      <p className="mt-7 text-center text-sm text-slate-500">
        Ainda não tem uma conta?{" "}
        <button
          type="button"
          onClick={() => onNavigate("cadastro")}
          className="font-bold text-blue-700"
        >
          Criar conta
        </button>
      </p>
    </AuthShell>
  );
}

export default Login;
