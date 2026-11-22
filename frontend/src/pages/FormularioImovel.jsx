
import { useState } from "react";
import { apiRequest } from "../services/api";

const dadosIniciais = {
  proprietario_id: "",
  tipo: "",
  finalidade: "VENDA",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  area: "",
  valor: "",
  quartos: "0",
  banheiros: "0",
  vagas_garagem: "0",
  descricao: "",
};

const camposNumericos = [
  "proprietario_id",
  "area",
  "valor",
  "quartos",
  "banheiros",
  "vagas_garagem",
];

function prepararDadosFormulario(imovel) {
  if (!imovel) {
    return { ...dadosIniciais };
  }

  const dados = {};

  for (const campo of Object.keys(dadosIniciais)) {
    dados[campo] = String(imovel[campo] ?? "");
  }

  dados.finalidade = imovel.finalidade;
  dados.complemento = imovel.complemento ?? "";
  dados.descricao = imovel.descricao ?? "";

  return dados;
}

function FormularioImovel({
  token,
  onVoltar,
  imovel = null,
}) {
  const modoEdicao = imovel !== null;

  const [formulario, setFormulario] = useState(() =>
    prepararDadosFormulario(imovel)
  );

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function alterarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function salvarImovel(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");
    setSalvando(true);

    try {
      const dados = {
        ...formulario,

        proprietario_id: Number(
          formulario.proprietario_id
        ),

        area: Number(formulario.area),
        valor: Number(formulario.valor),

        quartos: Number(formulario.quartos),
        banheiros: Number(formulario.banheiros),

        vagas_garagem: Number(
          formulario.vagas_garagem
        ),

        estado: formulario.estado.trim().toUpperCase(),

        complemento:
          formulario.complemento.trim() || null,

        descricao:
          formulario.descricao.trim() || null,
      };

      const endpoint = modoEdicao
        ? `/imoveis/${imovel.id}`
        : "/imoveis";

      const metodo = modoEdicao
        ? "PATCH"
        : "POST";

      // Na edição, enviar somente os campos alterados.
      const dadosEnvio = modoEdicao
        ? Object.fromEntries(
            Object.entries(dados).filter(
              ([campo, valor]) => {
                const valorOriginal = imovel[campo];

                if (camposNumericos.includes(campo)) {
                  return (
                    Number(valor) !== Number(valorOriginal)
                  );
                }

                return (
                  String(valor ?? "") !==
                  String(valorOriginal ?? "")
                );
              }
            )
          )
        : dados;

      if (
        modoEdicao &&
        Object.keys(dadosEnvio).length === 0
      ) {
        setSucesso(
          "Nenhuma alteração foi realizada."
        );
        return;
      }

      const resultado = await apiRequest(
        endpoint,
        {
          method: metodo,
          body: JSON.stringify(dadosEnvio),
        },
        token
      );

      if (modoEdicao) {
        setSucesso(
          `Imóvel #${resultado.id} atualizado com sucesso!`
        );

        // Retornar à listagem após a edição.
        onVoltar();
      } else {
        setSucesso(
          `Imóvel #${resultado.id} cadastrado com sucesso!`
        );

        setFormulario({ ...dadosIniciais });
      }
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main>
      <h1>
        {modoEdicao
          ? `Editar Imóvel #${imovel.id}`
          : "Cadastrar Imóvel"}
      </h1>

      <p>
        {modoEdicao
          ? "Altere os dados do imóvel e salve as modificações."
          : "Preencha os dados abaixo para cadastrar um novo imóvel."}
      </p>

      {erro && (
        <p role="alert" style={{ color: "red" }}>
          Erro: {erro}
        </p>
      )}

      {sucesso && (
        <p role="status" style={{ color: "green" }}>
          {sucesso}
        </p>
      )}

      <form onSubmit={salvarImovel}>
        <fieldset disabled={salvando}>
          <legend>Identificação</legend>

          <div>
            <label htmlFor="proprietario_id">
              ID do proprietário
            </label>

            <input
              id="proprietario_id"
              name="proprietario_id"
              type="number"
              min="1"
              step="1"
              required
              value={formulario.proprietario_id}
              onChange={alterarCampo}
            />
          </div>

          <div>
            <label htmlFor="tipo">
              Tipo de imóvel
            </label>

            <input
              id="tipo"
              name="tipo"
              type="text"
              minLength={2}
              maxLength={50}
              required
              value={formulario.tipo}
              onChange={alterarCampo}
            />
          </div>

          <div>
            <label htmlFor="finalidade">
              Finalidade
            </label>

            <select
              id="finalidade"
              name="finalidade"
              value={formulario.finalidade}
              onChange={alterarCampo}
            >
              <option value="VENDA">
                Venda
              </option>

              <option value="LOCACAO">
                Locação
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="valor">
              Valor (R$)
            </label>

            <input
              id="valor"
              name="valor"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={formulario.valor}
              onChange={alterarCampo}
            />
          </div>

          <div>
            <label htmlFor="area">
              Área (m²)
            </label>

            <input
              id="area"
              name="area"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={formulario.area}
              onChange={alterarCampo}
            />
          </div>
        </fieldset>

        <fieldset disabled={salvando}>
          <legend>Endereço</legend>

          {[
            ["logradouro", "Logradouro"],
            ["numero", "Número"],
            ["complemento", "Complemento"],
            ["bairro", "Bairro"],
            ["cidade", "Cidade"],
            ["estado", "Estado (UF)"],
            ["cep", "CEP"],
          ].map(([campo, rotulo]) => (
            <div key={campo}>
              <label htmlFor={campo}>
                {rotulo}
              </label>

              <input
                id={campo}
                name={campo}
                type="text"
                value={formulario[campo]}
                onChange={alterarCampo}
                required={campo !== "complemento"}
                minLength={
                  campo === "logradouro" ? 3 :
                  campo === "bairro" ||
                  campo === "cidade" ? 2 :
                  undefined
                }
                maxLength={
                  campo === "estado" ? 2 :
                  campo === "numero" ? 20 :
                  campo === "complemento" ? 100 :
                  campo === "logradouro" ? 200 :
                  campo === "bairro" ||
                  campo === "cidade" ? 100 :
                  undefined
                }
              />
            </div>
          ))}
        </fieldset>

        <fieldset disabled={salvando}>
          <legend>Características</legend>

          {[
            ["quartos", "Quartos"],
            ["banheiros", "Banheiros"],
            ["vagas_garagem", "Vagas de garagem"],
          ].map(([campo, rotulo]) => (
            <div key={campo}>
              <label htmlFor={campo}>
                {rotulo}
              </label>

              <input
                id={campo}
                name={campo}
                type="number"
                min="0"
                step="1"
                required
                value={formulario[campo]}
                onChange={alterarCampo}
              />
            </div>
          ))}

          <div>
            <label htmlFor="descricao">
              Descrição
            </label>

            <textarea
              id="descricao"
              name="descricao"
              value={formulario.descricao}
              onChange={alterarCampo}
            />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={salvando}
        >
          {salvando
            ? "Salvando..."
            : modoEdicao
              ? "Salvar alterações"
              : "Cadastrar imóvel"}
        </button>

        <button
          type="button"
          onClick={onVoltar}
          disabled={salvando}
        >
          Voltar à listagem
        </button>
      </form>
    </main>
  );
}

export default FormularioImovel;
