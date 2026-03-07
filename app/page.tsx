"use client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background: "radial-gradient(ellipse at center, #0a1628 0%, #050d1a 50%, #020810 100%)"}}>

      <div className="w-full max-w-md relative z-10">

        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Axioma"
            width={300}
            height={110}
            className="object-contain"
          />
        </div>

        <div className="rounded-2xl p-8" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.2)", backdropFilter: "blur(20px)"}}>

          <h2 className="text-xl font-bold mb-1" style={{color: "#c8d8f0"}}>Bem-vindo de volta</h2>
          <p className="text-sm mb-7" style={{color: "#4a6a94"}}>Entre com suas credenciais para acessar</p>

          <div className="mb-5">
            <label className="text-xs font-semibold mb-2 block tracking-widest uppercase" style={{color: "#5a8fd4"}}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full rounded-xl px-4 py-3.5 focus:outline-none" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}} />
          </div>

          <div className="mb-7">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold tracking-widest uppercase" style={{color: "#5a8fd4"}}>Senha</label>
              <span className="text-xs cursor-pointer" style={{color: "#4a90d9"}}>Esqueceu a senha?</span>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl px-4 py-3.5 focus:outline-none" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}} />
          </div>

          <button onClick={handleLogin} className="w-full font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02]" style={{background: "linear-gradient(135deg, #1a3a8f 0%, #2a5fd4 50%, #1a3a8f 100%)", color: "#c8d8f0", border: "1px solid rgba(100,160,255,0.3)"}}>
            {loading ? "Entrando..." : "Entrar na plataforma"}
          </button>

          <p className="text-center text-sm mt-5" style={{color: "#4a6a94"}}>
            Não tem conta?{" "}
            <span className="cursor-pointer font-semibold" style={{color: "#4a90d9"}}>Criar conta grátis</span>
          </p>

        </div>

        <p className="text-center text-xs mt-4" style={{color: "#1a2a3a"}}>© 2026 Axioma. Todos os direitos reservados.</p>

      </div>
    </div>
  );
}