"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Building2, User, Bell, Shield, CreditCard } from "lucide-react";

export default function Empresa() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState("empresa");
  const [salvo, setSalvo] = useState(false);

  const [empresa, setEmpresa] = useState({
    nome: "Minha Empresa Ltda",
    cnpj: "12.345.678/0001-90",
    setor: "Comércio",
    telefone: "(11) 99999-0000",
    email: "contato@minhaempresa.com.br",
    endereco: "Rua das Flores, 123",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01310-100",
  });

  const [usuario, setUsuario] = useState({
    nome: "Elias Tavares",
    email: "elias@minhaempresa.com.br",
    cargo: "CEO / Fundador",
    telefone: "(11) 99999-1111",
  });

  const [notificacoes, setNotificacoes] = useState({
    alertas_caixa: true,
    vencimentos: true,
    relatorio_semanal: true,
    insights_ia: true,
    novidades: false,
  });

  const salvar = () => {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  const abas = [
    { id: "empresa", label: "Empresa", icone: Building2 },
    { id: "usuario", label: "Meu Perfil", icone: User },
    { id: "notificacoes", label: "Notificações", icone: Bell },
    { id: "plano", label: "Plano", icone: CreditCard },
  ];

  return (
    <div className="min-h-screen flex" style={{background: "#020810"}}>
      <div className="w-64 min-h-screen flex flex-col" style={{background: "rgba(10,22,40,0.95)", borderRight: "1px solid rgba(59,111,212,0.15)"}}>
        <div className="p-6 border-b" style={{borderColor: "rgba(59,111,212,0.15)"}}>
          <Image src="/logo.png" alt="Axioma" width={140} height={50} className="object-contain"/>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { label: "Dashboard", path: "/dashboard" },
            { label: "Receitas", path: "/receitas" },
            { label: "Custos Fixos", path: "/custos-fixos" },
            { label: "Custos Variáveis", path: "/custos-variaveis" },
            { label: "Fornecedores", path: "/fornecedores" },
            { label: "Endividamento", path: "/endividamento" },
            { label: "Fluxo de Caixa", path: "/fluxo-caixa" },
            { label: "IA Financeira", path: "/ia-financeira" },
            { label: "Empresa", path: "/empresa", active: true },
            { label: "Relatórios", path: "/relatorios" },
          ].map((item) => (
            <div key={item.label} onClick={() => router.push(item.path)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all" style={{background: item.active ? "rgba(59,111,212,0.15)" : "transparent", color: item.active ? "#6ab0ff" : "#3a5a8a"}}>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
              <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>Configurações</h2>
            </div>
            <p className="text-sm" style={{color: "#3a5a8a"}}>Gerencie sua empresa e preferências</p>
          </div>
          <button onClick={salvar} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: salvo ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: salvo ? "#34d399" : "#fff", border: salvo ? "1px solid rgba(52,211,153,0.4)" : "none"}}>
            <Save size={18}/>
            {salvo ? "✓ Salvo!" : "Salvar"}
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-8">
          {abas.map((aba) => (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{background: abaAtiva === aba.id ? "rgba(59,111,212,0.2)" : "rgba(10,22,40,0.8)", color: abaAtiva === aba.id ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${abaAtiva === aba.id ? "rgba(59,111,212,0.4)" : "rgba(59,111,212,0.15)"}`}}>
              <aba.icone size={15}/>
              {aba.label}
            </button>
          ))}
        </div>

        {/* Empresa */}
        {abaAtiva === "empresa" && (
          <div className="rounded-2xl p-8" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <h3 className="font-bold mb-6" style={{color: "#c8d8f0"}}>Dados da Empresa</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Nome da Empresa", key: "nome" },
                { label: "CNPJ", key: "cnpj" },
                { label: "Setor", key: "setor" },
                { label: "Telefone", key: "telefone" },
                { label: "E-mail", key: "email" },
                { label: "Endereço", key: "endereco" },
                { label: "Cidade", key: "cidade" },
                { label: "Estado", key: "estado" },
                { label: "CEP", key: "cep" },
              ].map((campo) => (
                <div key={campo.key} className={campo.key === "email" || campo.key === "endereco" ? "col-span-2" : ""}>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{campo.label}</label>
                  <input value={empresa[campo.key as keyof typeof empresa]} onChange={(e) => setEmpresa({...empresa, [campo.key]: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perfil */}
        {abaAtiva === "usuario" && (
          <div className="rounded-2xl p-8" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                {usuario.nome.charAt(0)}
              </div>
              <div>
                <p className="font-bold" style={{color: "#c8d8f0"}}>{usuario.nome}</p>
                <p className="text-sm" style={{color: "#3a5a8a"}}>{usuario.cargo}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Nome Completo", key: "nome" },
                { label: "Cargo", key: "cargo" },
                { label: "E-mail", key: "email" },
                { label: "Telefone", key: "telefone" },
              ].map((campo) => (
                <div key={campo.key}>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{campo.label}</label>
                  <input value={usuario[campo.key as keyof typeof usuario]} onChange={(e) => setUsuario({...usuario, [campo.key]: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notificações */}
        {abaAtiva === "notificacoes" && (
          <div className="rounded-2xl p-8" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <h3 className="font-bold mb-6" style={{color: "#c8d8f0"}}>Preferências de Notificação</h3>
            <div className="space-y-4">
              {[
                { key: "alertas_caixa", label: "Alertas de caixa", desc: "Receba alertas quando o caixa estiver em risco" },
                { key: "vencimentos", label: "Vencimentos", desc: "Notificações de contas a pagar e receber" },
                { key: "relatorio_semanal", label: "Relatório semanal", desc: "Resumo financeiro toda segunda-feira" },
                { key: "insights_ia", label: "Insights da IA", desc: "Recomendações automáticas da IA financeira" },
                { key: "novidades", label: "Novidades do Axioma", desc: "Novos recursos e atualizações da plataforma" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{background: "rgba(59,111,212,0.05)", border: "1px solid rgba(59,111,212,0.1)"}}>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{color: "#c8d8f0"}}>{item.label}</p>
                    <p className="text-xs" style={{color: "#3a5a8a"}}>{item.desc}</p>
                  </div>
                  <button onClick={() => setNotificacoes({...notificacoes, [item.key]: !notificacoes[item.key as keyof typeof notificacoes]})} className="w-12 h-6 rounded-full transition-all relative" style={{background: notificacoes[item.key as keyof typeof notificacoes] ? "linear-gradient(135deg, #1a3a8f, #2a5fd4)" : "rgba(59,111,212,0.1)"}}>
                    <div className="w-5 h-5 rounded-full absolute top-0.5 transition-all" style={{background: "#fff", left: notificacoes[item.key as keyof typeof notificacoes] ? "26px" : "2px"}}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plano */}
        {abaAtiva === "plano" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-8" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.3)"}}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs px-3 py-1 rounded-full font-bold mb-3 inline-block" style={{background: "rgba(59,111,212,0.2)", color: "#6ab0ff"}}>PLANO ATUAL</span>
                  <h3 className="text-2xl font-bold mt-2" style={{color: "#c8d8f0"}}>Professional</h3>
                  <p className="text-sm" style={{color: "#3a5a8a"}}>Renovação em 15/04/2026</p>
                </div>
                <p className="text-3xl font-bold" style={{color: "#6ab0ff"}}>R$ 197<span className="text-sm font-normal">/mês</span></p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {["✓ 5 usuários", "✓ IA Financeira", "✓ Relatórios PDF", "✓ Suporte prioritário", "✓ Todos os módulos", "✓ Previsão 90 dias"].map((item) => (
                  <p key={item} className="text-sm" style={{color: "#34d399"}}>{item}</p>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { nome: "Starter", preco: "R$ 97", desc: "1 usuário • Módulos básicos" },
                { nome: "Enterprise", preco: "R$ 497", desc: "Ilimitado • API • Personalização" },
              ].map((plano) => (
                <div key={plano.nome} className="rounded-2xl p-6" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
                  <h4 className="font-bold mb-1" style={{color: "#c8d8f0"}}>{plano.nome}</h4>
                  <p className="text-2xl font-bold mb-2" style={{color: "#6ab0ff"}}>{plano.preco}<span className="text-sm font-normal">/mês</span></p>
                  <p className="text-xs mb-4" style={{color: "#3a5a8a"}}>{plano.desc}</p>
                  <button className="w-full py-2 rounded-xl text-sm font-medium" style={{background: "rgba(59,111,212,0.1)", color: "#6ab0ff", border: "1px solid rgba(59,111,212,0.2)"}}>Ver detalhes</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}