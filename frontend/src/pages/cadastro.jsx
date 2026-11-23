import { useState } from "react";
import { apiRequest } from "../services/api";
import { AuthShell, Field } from "../components/Layout";
import { Icon } from "../components/Icon";

function Cadastro({ onNavigate }) {
  const [formulario, setFormulario] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    senha: "",
    perfil: "CLIENTE",
  });

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function realizarCadastro(event) {
    event.preventDefault();
    setMensagem("");
    setCarregando(true);

    try {
      await apiRequest("/usuarios/cadastro", {
        method: "POST",
        body: JSON.stringify({
          nome: formulario.nome,
          email: formulario.email,
          cpf: formulario.cpf,
          senha: formulario.senha,
          perfil: formulario.perfil,
        }),
      });

      setSucesso(true);
      setMensagem("Cadastro realizado com sucesso!");
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell
      onNavigate={onNavigate}
      title="Crie sua conta"
      subtitle="Escolha seu perfil e preencha os dados para começar."
    >
      {!sucesso ? (
        <form onSubmit={realizarCadastro} className="mt-7">
          <Field label="Como você deseja usar a plataforma?">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormulario((f) => ({ ...f, perfil: "CLIENTE" }))
                }
                className={`profile-card ${
                  formulario.perfil === "CLIENTE" ? "profile-active" : ""
                }`}
              >
                <span className="profile-icon">
                  <Icon name="search" />
                </span>
                <span>
                  <b>Sou Cliente</b>
                  <small>Quero encontrar um imóvel</small>
                </span>
                {formulario.perfil === "CLIENTE" && (
                  <span className="profile-check">
                    <Icon name="check" size={13} />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormulario((f) => ({ ...f, perfil: "PROPRIETARIO" }))
                }
                className={`profile-card ${
                  formulario.perfil === "PROPRIETARIO" ? "profile-active" : ""
                }`}
              >
                <span className="profile-icon">
                  <Icon name="key" />
                </span>
                <span>
                  <b>Sou Proprietário</b>
                  <small>Quero anunciar um imóvel</small>
                </span>
                {formulario.perfil === "PROPRIETARIO" && (
                  <span className="profile-check">
                    <Icon name="check" size={13} />
                  </span>
                )}
              </button>
            </div>
          </Field>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" className="sm:col-span-2">
              <input
                id="nome"
                name="nome"
                value={formulario.nome}
                onChange={atualizarCampo}
                minLength={3}
                className="input"
                placeholder="Seu nome completo"
                required
              />
            </Field>

            <Field label="CPF">
              <input
                id="cpf"
                name="cpf"
                value={formulario.cpf}
                onChange={atualizarCampo}
                inputMode="numeric"
                maxLength={14}
                className="input"
                placeholder="000.000.000-00"
                required
              />
            </Field>

            <Field label="Telefone">
              <input
                id="telefone"
                name="telefone"
                type="tel"
                value={formulario.telefone}
                onChange={atualizarCampo}
                className="input"
                placeholder="(00) 00000-0000"
              />
            </Field>

            <Field label="E-mail" className="sm:col-span-2">
              <input
                id="email"
                name="email"
                type="email"
                value={formulario.email}
                onChange={atualizarCampo}
                className="input"
                placeholder="voce@email.com"
                required
              />
            </Field>

            <Field label="Senha" className="sm:col-span-2">
              <input
                id="senha"
                name="senha"
                type="password"
                value={formulario.senha}
                onChange={atualizarCampo}
                minLength={8}
                maxLength={128}
                className="input"
                placeholder="Mínimo de 8 caracteres"
                required
              />
            </Field>
          </div>

          {mensagem && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
            >
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="btn-primary mt-5 h-12 w-full"
          >
            {carregando ? "Cadastrando..." : "Finalizar cadastro"}{" "}
            <Icon name="arrow" size={18} />
          </button>
        </form>
      ) : (
        <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-600 text-white">
            <Icon name="check" />
          </span>
          <p role="status" className="mt-3 font-bold text-green-900">
            {mensagem}
          </p>
          <button
            type="button"
            onClick={() => onNavigate("login")}
            className="btn-primary mt-5 w-full"
          >
            Ir para o login
          </button>
        </div>
      )}

      <p className="mt-5 text-center text-sm text-slate-500">
        Já possui uma conta?{" "}
        <button
          type="button"
          onClick={() => onNavigate("login")}
          className="font-bold text-blue-700"
        >
          Entrar
        </button>
      </p>
    </AuthShell>
  );
}

export default Cadastro;
