import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function MinhasSolicitacoes({ token }) {
  const [itens, setItens] = useState([]); const [erro, setErro] = useState("");
  useEffect(() => { let ativo = true; apiRequest("/minhas-solicitacoes", {}, token).then((dados) => ativo && setItens(dados)).catch((error) => ativo && setErro(error.message)); return () => { ativo = false; }; }, [token]);
  return <section className="space-y-5"><div><h2 className="text-xl font-bold text-slate-900">Minhas solicitações</h2><p className="mt-1 text-sm text-slate-500">Acompanhe o resultado da análise dos seus imóveis.</p></div>{erro && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{erro}</p>}<div className="grid gap-4">{itens.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-slate-900">{item.imovel.tipo} · {item.imovel.cidade}</h3><p className="text-xs text-slate-500">Enviada em {new Date(item.submetida_em).toLocaleDateString("pt-BR")}</p></div><span className="status amber">{item.status}</span></div>{item.justificativa_rejeicao && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{item.justificativa_rejeicao}</p>}</article>)}</div>{!itens.length && !erro && <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">Nenhuma solicitação encontrada.</p>}</section>;
}
