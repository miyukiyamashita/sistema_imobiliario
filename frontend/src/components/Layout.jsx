import React, { useState } from "react";
import houseImage from "../assets/futura-house.png";
import { Icon } from "./Icon";

export function Logo({ light = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 text-left"
      aria-label="Futura Imóveis - início"
    >
      <span
        className={`grid h-10 w-10 place-items-center rounded-xl ${
          light ? "bg-white/12 text-white" : "bg-blue-900 text-white"
        }`}
      >
        <Icon name="building" size={22} />
      </span>
      <span>
        <span
          className={`block text-[17px] font-bold leading-none tracking-tight ${
            light ? "text-white" : "text-slate-900"
          }`}
        >
          Futura
        </span>
        <span
          className={`mt-1 block text-[10px] font-semibold uppercase tracking-[.22em] ${
            light ? "text-blue-200" : "text-blue-700"
          }`}
        >
          Imóveis
        </span>
      </span>
    </button>
  );
}

export function Header({ onNavigate, active = "catalogo", usuario }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-5 lg:px-8">
        <Logo onClick={() => onNavigate("catalogo")} />

        <nav className="hidden items-center gap-8 md:flex">
          <button
            type="button"
            onClick={() => onNavigate("catalogo")}
            className={`nav-link ${active === "catalogo" ? "nav-active" : ""}`}
          >
            Imóveis
          </button>
          <button
            type="button"
            onClick={() => onNavigate(usuario ? "dashboard" : "cadastro")}
            className="nav-link"
          >
            Anunciar imóvel
          </button>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {usuario ? (
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="btn-primary !px-5"
            >
              Meu Painel ({usuario.nome.split(" ")[0]})
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="btn-secondary !px-5"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => onNavigate("cadastro")}
                className="btn-primary !px-5"
              >
                Criar conta
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="icon-button md:hidden"
          aria-label="Abrir menu"
        >
          <Icon name={open ? "x" : "menu"} />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white p-5 md:hidden">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                onNavigate("catalogo");
                setOpen(false);
              }}
              className="btn-secondary"
            >
              Imóveis
            </button>
            {usuario ? (
              <button
                type="button"
                onClick={() => {
                  onNavigate("dashboard");
                  setOpen(false);
                }}
                className="btn-primary"
              >
                Meu Painel
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("cadastro");
                    setOpen(false);
                  }}
                  className="btn-secondary"
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("login");
                    setOpen(false);
                  }}
                  className="btn-primary"
                >
                  Entrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[13px] font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

export function NavegacaoInterna({ onNavigate, destino = "dashboard", rotulo = "Voltar ao painel" }) {
  return (
    <button type="button" className="text-sm font-semibold text-blue-800 hover:text-blue-950" onClick={() => onNavigate(destino)}>
      ← {rotulo}
    </button>
  );
}

export function AuthShell({ children, onNavigate, title, subtitle }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-blue-950 lg:block">
        <img
          src={houseImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/55 to-blue-900/20" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Logo light onClick={() => onNavigate("catalogo")} />
          <div className="max-w-lg">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur">
              Seu próximo capítulo começa aqui
            </span>
            <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white">
              Boas escolhas constroem grandes futuros.
            </h2>
            <p className="mt-4 text-sm leading-6 text-blue-100/80">
              Tecnologia e atendimento humano para tornar sua experiência imobiliária mais simples e segura.
            </p>
          </div>
          <p className="text-xs text-white/50">
            © 2026 Futura Imóveis. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 lg:hidden">
            <Logo onClick={() => onNavigate("catalogo")} />
          </div>
          <span className="eyebrow">Futura Imóveis</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
