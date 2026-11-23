import { useEffect, useState } from "react";
import { Logo } from "../components/Layout";
import { Icon } from "../components/Icon";
import { propertyImages } from "../components/mockImoveis";
import { apiRequest } from "../services/api";
import AgendaVisitas from "./AgendaVisitas";
import Propostas from "./Propostas";

const recent = [
  {
    type: "Visita",
    item: "Casa contemporânea no Alphaville",
    date: "18 Jun · 14:00",
    status: "Confirmada",
  },
  {
    type: "Proposta enviada",
    item: "Apartamento com vista panorâmica",
    date: "16 Jun · 10:42",
    status: "Em análise",
  },
  {
    type: "Visita",
    item: "Residência moderna e iluminada",
    date: "20 Jun · 11:30",
    status: "Pendente",
  },
  {
    type: "Proposta recebida",
    item: "Apartamento premium mobiliado",
    date: "14 Jun · 16:18",
    status: "Aprovada",
  },
];

function Status({ value }) {
  const color = value === "Aprovada" || value === "Confirmada" ? "green" : "amber";
  return (
    <span className={`status ${color}`}>
      <span />
      {value}
    </span>
  );
}

function Dashboard({ usuario, token, onSair, onNavigate }) {
  const [active, setActive] = useState("Visão Geral");
  const [mobile, setMobile] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [erroNotificacoes, setErroNotificacoes] = useState("");

  useEffect(() => {
    if (!token || token === "demo-token") return;
    apiRequest("/notificacoes", {}, token)
      .then(setNotificacoes)
      .catch((error) => setErroNotificacoes(error.message));
  }, [token]);

  async function marcarNotificacaoComoLida(notificacao) {
    if (notificacao.lida) return;
    try {
      const atualizada = await apiRequest(
        `/notificacoes/${notificacao.id}/ler`,
        { method: "PATCH" },
        token
      );
      setNotificacoes((anteriores) =>
        anteriores.map((item) => item.id === atualizada.id ? atualizada : item)
      );
    } catch (error) {
      setErroNotificacoes(error.message);
    }
  }

  const labelsPerfil = {
    CLIENTE: "Cliente",
    PROPRIETARIO: "Proprietário",
    CORRETOR_ADMIN: "Corretor / Admin",
  };

  const menusPorPerfil = {
    CLIENTE: [
      { icon: "home", label: "Visão Geral" },
      { icon: "calendar", label: "Minhas Visitas" },
      { icon: "proposal", label: "Minhas Propostas" },
      { icon: "contract", label: "Contratos" },
      { icon: "user", label: "Meu Perfil" },
    ],
    PROPRIETARIO: [
      { icon: "home", label: "Visão Geral" },
      { icon: "building", label: "Meus Imóveis" },
      { icon: "plus", label: "Cadastrar Imóvel" },
      { icon: "proposal", label: "Propostas Recebidas" },
      { icon: "user", label: "Meu Perfil" },
    ],
    CORRETOR_ADMIN: [
      { icon: "home", label: "Visão Geral" },
      { icon: "building", label: "Gerenciar Imóveis" },
      { icon: "calendar", label: "Agenda de Visitas" },
      { icon: "proposal", label: "Gerenciar Propostas" },
      { icon: "contract", label: "Contratos" },
    ],
  };

  const navItems = menusPorPerfil[usuario.perfil] || menusPorPerfil.CLIENTE;
  const perfilFormatado = labelsPerfil[usuario.perfil] || usuario.perfil;
  const iniciais = usuario.nome
    ? usuario.nome
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "FI";

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-[260px]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-blue-950 px-4 py-6 transition-transform lg:translate-x-0 ${
          mobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-3">
          <Logo light onClick={() => onNavigate("catalogo")} />
        </div>
        <div className="my-8 h-px bg-white/10" />
        <p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-blue-300/60">
          Menu principal
        </p>

        <nav className="mt-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setActive(item.label);
                setMobile(false);
              }}
              className={`side-link ${
                active === item.label ? "side-active" : ""
              }`}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {iniciais}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-xs text-white">
                {usuario.nome}
              </b>
              <small className="text-[10px] text-blue-200/60">
                {perfilFormatado}
              </small>
            </span>
            <button
              type="button"
              onClick={onSair}
              title="Sair da conta"
              className="text-blue-200/70 hover:text-white"
            >
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobile && (
        <button
          type="button"
          onClick={() => setMobile(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          aria-label="Fechar menu"
        />
      )}

      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-9">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobile(true)}
            className="icon-button lg:hidden"
          >
            <Icon name="menu" />
          </button>
          <div>
            <p className="text-xs text-slate-400">
              Painel · {perfilFormatado}
            </p>
            <h1 className="text-lg font-bold text-slate-900">{active}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificacoesAbertas(!notificacoesAbertas)}
              className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600"
              aria-label="Notificações"
            >
              <Icon name="bell" size={19} />
              {notificacoes.some((item) => !item.lida) && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-600 px-1 text-[9px] font-bold text-white">
                  {notificacoes.filter((item) => !item.lida).length}
                </span>
              )}
            </button>
            {notificacoesAbertas && (
              <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <h2 className="px-2 py-1 text-sm font-bold text-slate-900">Notificações</h2>
                {erroNotificacoes && (
                  <p role="alert" className="px-2 py-2 text-xs text-red-700">{erroNotificacoes}</p>
                )}
                {!notificacoes.length && !erroNotificacoes ? (
                  <p className="px-2 py-3 text-xs text-slate-500">Nenhuma notificação.</p>
                ) : (
                  <ul className="max-h-80 space-y-1 overflow-y-auto">
                    {notificacoes.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => marcarNotificacaoComoLida(item)}
                          className={`w-full rounded-lg p-2 text-left ${item.lida ? "bg-white" : "bg-blue-50"}`}
                        >
                          <b className="block text-xs text-slate-800">{item.titulo}</b>
                          <span className="mt-1 block text-xs text-slate-500">{item.mensagem}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />
          <div className="hidden items-center gap-2.5 sm:flex">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
              {iniciais}
            </span>
            <div>
              <b className="block text-xs text-slate-800">{usuario.nome}</b>
              <small className="text-[10px] text-slate-400">
                {usuario.email}
              </small>
            </div>
          </div>
          <button
            type="button"
            onClick={onSair}
            className="btn-secondary !px-3.5 !py-2 text-xs"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="px-5 py-7 lg:px-9 lg:py-9">
        {active === "Visão Geral" ? (
          <>
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Olá, {usuario.nome.split(" ")[0]}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Acompanhe aqui suas atividades mais recentes na Futura Imóveis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("catalogo")}
                className="btn-primary"
              >
                <Icon name="search" size={18} /> Explorar imóveis
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["calendar", "2", "Visitas agendadas", "1 esta semana"],
                ["proposal", "3", "Propostas ativas", "1 atualização hoje"],
                ["heart", "12", "Imóveis favoritos", "2 novos"],
                [
                  "contract",
                  "1",
                  "Contrato em andamento",
                  "Aguardando assinatura",
                ],
              ].map(([icon, number, label, note]) => (
                <div key={label} className="summary-card">
                  <div className="flex items-start justify-between">
                    <span className="summary-icon">
                      <Icon name={icon} />
                    </span>
                    <Icon
                      name="chevron"
                      size={18}
                      className="text-slate-300"
                    />
                  </div>
                  <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
                    {number}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {label}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{note}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Solicitações recentes
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Visitas e propostas atualizadas recentemente
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-blue-700"
                >
                  Ver todas
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                      <th>Solicitação</th>
                      <th>Imóvel</th>
                      <th>Data</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((row) => (
                      <tr
                        key={row.item}
                        className="border-t border-slate-100 text-sm"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                              <Icon
                                name={
                                  row.type === "Visita"
                                    ? "calendar"
                                    : "proposal"
                                }
                                size={17}
                              />
                            </span>
                            <b className="font-semibold text-slate-700">
                              {row.type}
                            </b>
                          </div>
                        </td>
                        <td className="font-medium text-slate-700">
                          {row.item}
                        </td>
                        <td className="text-slate-500">{row.date}</td>
                        <td>
                          <Status value={row.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="icon-button !h-8 !w-8"
                          >
                            <Icon name="chevron" size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Próxima visita</h3>
                  <span className="status green">
                    <span />
                    Confirmada
                  </span>
                </div>
                <div className="mt-5 flex flex-col gap-5 sm:flex-row">
                  <img
                    src={propertyImages[2]}
                    className="h-28 w-full rounded-xl object-cover sm:w-40"
                    alt=""
                  />
                  <div className="flex-1">
                    <b className="text-sm text-slate-800">
                      Residência moderna e iluminada
                    </b>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Icon name="pin" size={13} />
                      Jardins · São Paulo, SP
                    </p>
                    <div className="mt-4 flex gap-5 text-xs font-semibold text-slate-600">
                      <span className="flex gap-1.5">
                        <Icon
                          name="calendar"
                          size={15}
                          className="text-blue-700"
                        />
                        20 de junho
                      </span>
                      <span className="flex gap-1.5">
                        <Icon
                          name="clock"
                          size={15}
                          className="text-blue-700"
                        />
                        11:30
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-blue-900 p-6 text-white">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                  <Icon name="bell" />
                </span>
                <h3 className="mt-5 font-bold">
                  Você tem 3 novas notificações
                </h3>
                <p className="mt-2 text-xs leading-5 text-blue-100/70">
                  Uma proposta foi atualizada e sua próxima visita foi confirmada.
                </p>
                <button
                  type="button"
                  className="mt-5 text-xs font-bold text-white"
                >
                  Ver notificações →
                </button>
              </div>
            </div>
          </>
        ) : active === "Agenda de Visitas" || active === "Minhas Visitas" ? (
          <AgendaVisitas token={token} perfil={usuario.perfil} />
        ) : ["Minhas Propostas", "Propostas Recebidas", "Gerenciar Propostas"].includes(active) ? (
          <Propostas token={token} perfil={usuario.perfil} />
        ) : (
          <div className="grid min-h-[60vh] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon
                  name={
                    navItems.find((n) => n.label === active)?.icon || "home"
                  }
                  size={26}
                />
              </span>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {active}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Módulo preparado para integração com os endpoints de {active.toLowerCase()}.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
