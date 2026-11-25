import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "../pages/dashboard";

vi.mock("../services/api", () => ({
  apiRequest: vi.fn().mockResolvedValue([]),
}));

describe("sincronização entre rota e dashboard", () => {
  it("volta a renderizar a visão geral quando a rota muda para o painel", async () => {
    const props = {
      usuario: { nome: "Ana Cliente", email: "ana@example.com", perfil: "CLIENTE" },
      token: "token-de-teste",
      onNavigate: vi.fn(),
      onSair: vi.fn(),
    };
    const { rerender } = render(<Dashboard {...props} activeInicial="Minhas Propostas" />);

    expect(screen.getByRole("heading", { name: "Minhas Propostas" })).toBeInTheDocument();
    rerender(<Dashboard {...props} activeInicial="Visão Geral" />);

    await waitFor(() => expect(screen.getByText(/Olá, Ana/i)).toBeInTheDocument());
    expect(screen.queryByRole("heading", { name: "Minhas Propostas" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /explorar imóveis/i })).toBeInTheDocument();
  });
});
