
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

function Cadastro() {
  const [formulario, setFormulario] = useState({
    nome: "",
    email: "",
    cpf: "",
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
        body: JSON.stringify(formulario),
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
    <main>
      <h1>Sistema Imobiliário</h1>
      <h2>Criar conta</h2>

      {!sucesso && (
        <form onSubmit={realizarCadastro}>
          <div>
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              name="nome"
              value={formulario.nome}
              onChange={atualizarCampo}
              minLength={3}
              required
            />
          </div>

          <div>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formulario.email}
              onChange={atualizarCampo}
              required
            />
          </div>

          <div>
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              name="cpf"
              value={formulario.cpf}
              onChange={atualizarCampo}
              inputMode="numeric"
              maxLength={14}
              placeholder="000.000.000-00"
              required
            />
          </div>

          <div>
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              value={formulario.senha}
              onChange={atualizarCampo}
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <div>
            <label htmlFor="perfil">Tipo de conta</label>
            <select
              id="perfil"
              name="perfil"
              value={formulario.perfil}
              onChange={atualizarCampo}
            >
              <option value="CLIENTE">Cliente</option>
              <option value="PROPRIETARIO">
                Proprietário
              </option>
            </select>
          </div>

          <button type="submit" disabled={carregando}>
            {carregando ? "Cadastrando..." : "Criar conta"}
          </button>
        </form>
      )}

      <p role="status">{mensagem}</p>

      <Link to="/login">Voltar para o login</Link>
    </main>
  );
}

export default Cadastro;
