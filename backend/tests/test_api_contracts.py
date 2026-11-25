"""Testes de contrato que não acessam nem alteram o banco de desenvolvimento."""

from main import app


def test_rotas_publicas_nao_exigem_autenticacao():
    schema = app.openapi()

    for caminho in ("/imoveis/publicos", "/imoveis/publicos/{imovel_id}"):
        operacao = schema["paths"][caminho]["get"]
        assert "security" not in operacao


def test_fluxos_rf01_rf07_estao_registrados_no_openapi():
    caminhos = app.openapi()["paths"]

    esperados = {
        ("/usuarios/cadastro", "post"),
        ("/usuarios/me", "get"),
        ("/imoveis", "get"),
        ("/imoveis/meus", "post"),
        ("/solicitacoes-visita", "post"),
        ("/solicitacoes-visita/minhas", "get"),
        ("/propostas", "post"),
        ("/propostas/minhas", "get"),
    }

    assert all(metodo in caminhos[caminho] for caminho, metodo in esperados)


def test_endpoint_de_proprietarios_e_administrativo_e_limitado():
    operacao = app.openapi()["paths"]["/usuarios/proprietarios"]["get"]

    assert operacao["parameters"][0]["name"] == "busca"
    assert operacao["responses"]["200"]["content"]["application/json"]
    assert operacao["security"] == [{"HTTPBearer": []}]
