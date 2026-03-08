"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage, SeletorIdioma } from "../lib/LanguageContext";

export default function Login() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = () => {
    setCarregando(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: "radial-gradient(ellipse at center, #0a1628 0%, #020810 70%)"}}>
      <div className="absolute top-6 right-6">
        <SeletorIdioma/>
      </div>
      <div className="w-full max-w-md px-8 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6" style={{filter: "drop-shadow(0 0 40px rgba(106,176,255,0.4))"}}>
            <Image src="/logo-aitech.png" alt="Axioma AI" width={160} height={160} className="object-contain" style={{filter: "drop-shadow(0 0 20px rgba(59,111,212,0.6))"}}/>
          </div>
          <h1 className="text-4xl font-black tracking-wider mb-1" style={{background: "linear-gradient(135deg, #6ab0ff, #ffffff, #3b6fd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>AXIOMA</h1>
          <p className="text-sm font-medium tracking-widest uppercase" style={{color: "#3a5a8a"}}>Inteligência Financeira</p>
        </div>
        <div className="rounded-2xl p-8" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.2)"}}>
          <h2 className="text-xl font-bold mb-6 text-center" style={{color: "#c8d8f0"}}>{t.login.bemvindo}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.login.email}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.login.placeholder_email} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.login.senha}</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}} onKeyDown={(e) => e.key === "Enter" && handleLogin()}/>
            </div>
            <div className="flex justify-end">
              <span className="text-xs cursor-pointer" style={{color: "#6ab0ff"}}>{t.login.esqueceu}</span>
            </div>
            <button onClick={handleLogin} disabled={carregando} className="w-full py-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
              {carregando ? t.login.entrando : t.login.entrar}
            </button>
          </div>
          <div className="mt-6 text-center">
            <span className="text-xs" style={{color: "#3a5a8a"}}>{t.login.semConta} </span>
            <span className="text-xs cursor-pointer font-semibold" style={{color: "#6ab0ff"}}>{t.login.criarConta}</span>
          </div>
        </div>
        <p className="text-center text-xs mt-6" style={{color: "#1a3a5a"}}>{t.login.rodape}</p>
      </div>
    </div>
  );
}