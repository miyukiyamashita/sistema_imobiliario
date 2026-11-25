import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FormularioImovel from "../pages/FormularioImovel";

const dadosValidos = {
  tipo: "Casa",
  finalidade: "VENDA",
  logradouro: "Rua A",
  numero: "10",
  bairro: "Centro",
  cidade: "Juiz de Fora",
  estado: "MG",
  cep: "36000000",
  area: 100,
  valor: 300000,
  quartos: 2,
  banheiros: 1,
  vagas_garagem: 1,
};

describe("regressões de navegação e proteção de formulário", () => {
  it("renderiza exatamente um retorno ao painel no formulário do proprietário", () => {
    render(
      <FormularioImovel
        proprietario
        mostrarRetorno
        onCancel={vi.fn()}
        onSubmitOverride={vi.fn()}
      />
    );

    expect(screen.getAllByRole("button", { name: /voltar ao painel/i })).toHaveLength(1);
  });

  it("não pede confirmação para formulário inalterado", () => {
    const onCancel = vi.fn();
    render(<FormularioImovel proprietario mostrarRetorno onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /voltar ao painel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("preserva os dados ao cancelar a saída de um formulário alterado", () => {
    const onCancel = vi.fn();
    render(<FormularioImovel proprietario mostrarRetorno onCancel={onCancel} />);

    const tipo = screen.getByRole("textbox", { name: /tipo de imóvel/i });
    fireEvent.change(tipo, { target: { value: "Apartamento" } });
    fireEvent.click(screen.getByRole("button", { name: /voltar ao painel/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Existem alterações não salvas");
    fireEvent.click(screen.getByRole("button", { name: /continuar editando/i }));

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /tipo de imóvel/i })).toHaveValue("Apartamento");
  });

  it("navega após confirmar a saída e preserva o estado quando o salvamento falha", async () => {
    const onCancel = vi.fn();
    const onDraftSave = vi.fn().mockResolvedValue(false);
    render(<FormularioImovel proprietario mostrarRetorno onCancel={onCancel} onDraftSave={onDraftSave} />);

    fireEvent.change(screen.getByRole("textbox", { name: /tipo de imóvel/i }), { target: { value: "Apartamento" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() => expect(onDraftSave).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /voltar ao painel/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^sair$/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("limpa a proteção após salvar o rascunho com sucesso", async () => {
    const onCancel = vi.fn();
    const onDraftSave = vi.fn().mockResolvedValue(true);
    render(<FormularioImovel proprietario mostrarRetorno onCancel={onCancel} onDraftSave={onDraftSave} />);

    fireEvent.change(screen.getByRole("textbox", { name: /tipo de imóvel/i }), { target: { value: "Apartamento" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar rascunho/i }));
    await waitFor(() => expect(onDraftSave).toHaveBeenCalledWith(expect.objectContaining({ tipo: "Apartamento", finalidade: dadosValidos.finalidade })));
    fireEvent.click(screen.getByRole("button", { name: /voltar ao painel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
