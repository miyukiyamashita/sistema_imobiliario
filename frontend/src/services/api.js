
const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest(
  endpoint,
  options = {},
  token = null
) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    let mensagem = "Erro ao realizar requisição.";

    if (typeof data.detail === "string") {
      mensagem = data.detail;
    } else if (Array.isArray(data.detail)) {
      mensagem = data.detail
        .map((erro) => {
          const campo = erro.loc?.at(-1);

          const nomesCampos = {
            nome: "Nome",
            email: "E-mail",
            cpf: "CPF",
            senha: "Senha",
            perfil: "Perfil",
          };

          const nomeCampo =
            nomesCampos[campo] || "Campo";

          return `${nomeCampo}: ${erro.msg}`;
        })
        .join(" | ");
    }

    throw new Error(mensagem);
  }

  return data;
}
