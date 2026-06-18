"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../lib/LanguageContext";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Bell, AlertTriangle, Zap, Shield, Target, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// NEURAL BRAIN — Cérebro 3D com sinapses em Three.js
// ============================================================
function NeuralBrain() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h); renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.set(0, 0, 4);

    // Neurônios
    const neuronGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const neurons: THREE.Mesh[] = [];
    const positions: THREE.Vector3[] = [];
    const colors = [0x6ab0ff, 0x34d399, 0xa78bfa, 0xf472b6, 0xfbbf24, 0xf97316];

    for (let i = 0; i < 80; i++) {
      const mat = new THREE.MeshPhongMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        emissive: colors[Math.floor(Math.random() * colors.length)],
        emissiveIntensity: 0.8,
        transparent: true, opacity: 0.9,
      });
      const mesh = new THREE.Mesh(neuronGeo, mat);
      // Formato de cérebro elipsoide
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + Math.random() * 0.6;
      mesh.position.set(
        r * 1.4 * Math.sin(phi) * Math.cos(theta),
        r * 0.9 * Math.sin(phi) * Math.sin(theta),
        r * 0.8 * Math.cos(phi)
      );
      positions.push(mesh.position.clone());
      scene.add(mesh);
      neurons.push(mesh);
    }

    // Sinapses (linhas entre neurônios próximos)
    const synapseGroup = new THREE.Group();
    for (let i = 0; i < neurons.length; i++) {
      for (let j = i + 1; j < neurons.length; j++) {
        if (positions[i].distanceTo(positions[j]) < 0.8 && Math.random() > 0.6) {
          const geo = new THREE.BufferGeometry().setFromPoints([positions[i], positions[j]]);
          const mat = new THREE.LineBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true, opacity: 0.15,
          });
          synapseGroup.add(new THREE.Line(geo, mat));
        }
      }
    }
    scene.add(synapseGroup);

    // Luzes
    scene.add(new THREE.AmbientLight(0x6ab0ff, 0.3));
    const light1 = new THREE.PointLight(0x6ab0ff, 2, 10);
    light1.position.set(3, 3, 3); scene.add(light1);
    const light2 = new THREE.PointLight(0xa78bfa, 2, 10);
    light2.position.set(-3, -3, 3); scene.add(light2);
    const light3 = new THREE.PointLight(0x34d399, 1.5, 10);
    light3.position.set(0, 3, -3); scene.add(light3);

    // Partículas de dados subindo
    const particleGeo = new THREE.BufferGeometry();
    const pPositions: number[] = [];
    for (let i = 0; i < 200; i++) {
      pPositions.push((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x6ab0ff, size: 0.03, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(particleGeo, pMat);
    scene.add(particles);

    // Animação de pulso nos neurônios via GSAP
    neurons.forEach((n, i) => {
      gsap.to(n.scale, {
        x: 1.5, y: 1.5, z: 1.5,
        duration: 0.5 + Math.random() * 1.5,
        repeat: -1, yoyo: true,
        delay: Math.random() * 2,
        ease: "sine.inOut"
      });
    });

    let frame = 0;
    const animate = () => {
      frame++;
      requestAnimationFrame(animate);
      synapseGroup.rotation.y += 0.003;
      synapseGroup.rotation.x += 0.001;
      particles.rotation.y += 0.001;
      // Pulso das sinapses
      if (frame % 60 === 0) {
        synapseGroup.children.forEach(line => {
          const mat = (line as THREE.Line).material as THREE.LineBasicMaterial;
          gsap.to(mat, { opacity: 0.6, duration: 0.3, yoyo: true, repeat: 1 });
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse parallax
    const onMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 0.5;
      const y = (e.clientY / window.innerHeight - 0.5) * 0.5;
      gsap.to(synapseGroup.rotation, { y: x, x: -y, duration: 1.5, ease: "power2.out" });
    };
    window.addEventListener('mousemove', onMouse);

    return () => {
      window.removeEventListener('mousemove', onMouse);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={mountRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.85 }} />;
}

// ============================================================
// CYBER EYE — Olho cibernético com scan
// ============================================================
function CyberEye() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let animId: number;
    let angle = 0;
    let scanLine = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) * 0.42;
      ctx.clearRect(0, 0, w, h);

      // Fundo do olho
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      grad.addColorStop(0, 'rgba(10,22,40,0.95)');
      grad.addColorStop(0.6, 'rgba(4,10,22,0.9)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();

      // Íris — anéis concêntricos
      for (let i = 5; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * (i / 5), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(106,176,255,${0.05 * i})`;
        ctx.lineWidth = 1; ctx.stroke();
      }

      // Linhas radiais da íris
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const inner = R * 0.3, outer = R * 0.85;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
        ctx.strokeStyle = `rgba(106,176,255,${0.08 + 0.04 * (i % 3)})`;
        ctx.lineWidth = 0.5; ctx.stroke();
      }

      // Anéis de circuito girando
      for (let ring = 0; ring < 3; ring++) {
        const r = R * (0.5 + ring * 0.15);
        const segments = 12 + ring * 4;
        for (let i = 0; i < segments; i++) {
          if (i % 3 === 0) continue;
          const a1 = (i / segments) * Math.PI * 2 + angle * (ring % 2 === 0 ? 1 : -1);
          const a2 = ((i + 0.7) / segments) * Math.PI * 2 + angle * (ring % 2 === 0 ? 1 : -1);
          ctx.beginPath();
          ctx.arc(cx, cy, r, a1, a2);
          const ringColors = ['#6ab0ff', '#34d399', '#a78bfa'];
          ctx.strokeStyle = ringColors[ring];
          ctx.lineWidth = 1.5;
          ctx.shadowColor = ringColors[ring];
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Pupila central
      const pupilGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.25);
      pupilGrad.addColorStop(0, 'rgba(106,176,255,0.3)');
      pupilGrad.addColorStop(0.5, 'rgba(4,10,22,0.95)');
      pupilGrad.addColorStop(1, 'rgba(4,10,22,0.99)');
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = pupilGrad; ctx.fill();

      // Cruz de mira na pupila
      ctx.strokeStyle = 'rgba(106,176,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.12, cy); ctx.lineTo(cx + R * 0.12, cy);
      ctx.moveTo(cx, cy - R * 0.12); ctx.lineTo(cx, cy + R * 0.12);
      ctx.stroke();

      // Linha de scan horizontal
      const scanY = cy - R * 0.8 + (scanLine % (R * 1.6));
      if (scanY > cy - R * 0.8 && scanY < cy + R * 0.8) {
        const scanGrad = ctx.createLinearGradient(cx - R, scanY, cx + R, scanY);
        scanGrad.addColorStop(0, 'rgba(106,176,255,0)');
        scanGrad.addColorStop(0.3, 'rgba(106,176,255,0.4)');
        scanGrad.addColorStop(0.5, 'rgba(52,211,153,0.8)');
        scanGrad.addColorStop(0.7, 'rgba(106,176,255,0.4)');
        scanGrad.addColorStop(1, 'rgba(106,176,255,0)');
        ctx.beginPath();
        ctx.rect(cx - R, scanY - 1, R * 2, 2);
        ctx.fillStyle = scanGrad; ctx.fill();
      }

      // Dados emergindo do olho
      ctx.font = `bold ${Math.floor(R * 0.07)}px monospace`;
      const dataStrings = ['R$', '%', 'AI', 'MEI', 'DRE', 'ROI', '∑', 'Δ', 'π', '∞'];
      dataStrings.forEach((str, i) => {
        const a = (i / dataStrings.length) * Math.PI * 2 + angle * 0.5;
        const dist = R * (0.95 + 0.15 * Math.sin(angle * 3 + i));
        const x = cx + Math.cos(a) * dist;
        const y = cy + Math.sin(a) * dist;
        const dataColors = ['#6ab0ff', '#34d399', '#a78bfa', '#fbbf24', '#f472b6'];
        ctx.fillStyle = dataColors[i % dataColors.length];
        ctx.globalAlpha = 0.7;
        ctx.fillText(str, x - 8, y + 4);
        ctx.globalAlpha = 1;
      });

      // Borda externa do olho (forma de amêndoa)
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.98, R * 0.6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(106,176,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#6ab0ff';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      angle += 0.008;
      scanLine = (scanLine + 1.5) % (R * 1.6);
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ============================================================
// VOLCANO — Vulcão de dados
// ============================================================
function DataVolcano() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener('resize', resize);

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; size: number;
      color: string; text: string; isText: boolean;
    }

    const particles: Particle[] = [];
    const moduleNames = ['RECEITAS', 'DRE', 'MEI', 'IRPF', 'CUSTOS', 'CLIENTES', 'FLUXO', 'IA', 'METAS', 'R$', '%', '∑', 'ROI', 'PME'];
    const volcanoColors = ['#f97316', '#fbbf24', '#f87171', '#fb923c', '#fcd34d', '#6ab0ff', '#34d399', '#a78bfa'];

    const spawnParticle = () => {
      const isText = Math.random() > 0.4;
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 40,
        y: canvas.height * 0.85,
        vx: (Math.random() - 0.5) * 3,
        vy: -(2 + Math.random() * 5),
        life: 1, maxLife: 60 + Math.random() * 80,
        size: 2 + Math.random() * 4,
        color: volcanoColors[Math.floor(Math.random() * volcanoColors.length)],
        text: moduleNames[Math.floor(Math.random() * moduleNames.length)],
        isText,
      });
    };

    let frame = 0;
    const draw = () => {
      frame++;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Spawn partículas
      if (frame % 3 === 0) { spawnParticle(); spawnParticle(); }

      // Vulcão base
      const cx = w / 2;
      const volcGrad = ctx.createLinearGradient(cx - 80, h * 0.7, cx + 80, h);
      volcGrad.addColorStop(0, 'rgba(249,115,22,0.6)');
      volcGrad.addColorStop(0.5, 'rgba(251,191,36,0.4)');
      volcGrad.addColorStop(1, 'rgba(4,10,22,0)');
      ctx.beginPath();
      ctx.moveTo(cx - 90, h);
      ctx.lineTo(cx - 30, h * 0.75);
      ctx.lineTo(cx, h * 0.72);
      ctx.lineTo(cx + 30, h * 0.75);
      ctx.lineTo(cx + 90, h);
      ctx.closePath();
      ctx.fillStyle = volcGrad; ctx.fill();

      // Magma pulsante no topo
      const magmaGrad = ctx.createRadialGradient(cx, h * 0.75, 0, cx, h * 0.75, 35);
      magmaGrad.addColorStop(0, 'rgba(251,191,36,0.9)');
      magmaGrad.addColorStop(0.4, 'rgba(249,115,22,0.7)');
      magmaGrad.addColorStop(1, 'rgba(248,113,113,0)');
      ctx.beginPath();
      ctx.arc(cx, h * 0.75, 30 + Math.sin(frame * 0.1) * 5, 0, Math.PI * 2);
      ctx.fillStyle = magmaGrad; ctx.fill();

      // Partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.04; // gravidade leve
        p.vx *= 0.99;
        p.life--;
        const alpha = p.life / p.maxLife;

        if (p.isText) {
          ctx.save();
          ctx.font = `bold ${8 + p.size}px monospace`;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillText(p.text, p.x - 20, p.y);
          ctx.restore();
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        }

        if (p.life <= 0) particles.splice(i, 1);
      }

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ============================================================
// CANVAS NEURAL — fundo de partículas
// ============================================================
function CanvasNeural({ cor = "#6ab0ff" }: { cor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener('resize', resize);
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.3, opacity: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 80) * 0.08;
            ctx.strokeStyle = cor; ctx.lineWidth = 0.4;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
          }
        });
        ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = cor;
        ctx.shadowColor = cor; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} />;
}

// ============================================================
// CANVAS BOX com bordas neon
// ============================================================
function CanvasBox({ children, cor = "#6ab0ff", corB = "#34d399", corC = "#a78bfa", corD = "#f472b6", className = "" }: {
  children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string; className?: string;
}) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{
      background: "rgba(4,10,22,0.97)", border: `1px solid ${cor}30`, boxShadow: `0 0 40px ${cor}08`,
    }}>
      <CanvasNeural cor={cor} />
      {[
        { pos: "top-0 left-0", w: "w-16 h-[2px]", bg: `linear-gradient(90deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 left-0", w: "w-[2px] h-16", bg: `linear-gradient(180deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 right-0", w: "w-16 h-[2px]", bg: `linear-gradient(270deg, ${corB}, transparent)`, glow: corB },
        { pos: "top-0 right-0", w: "w-[2px] h-16", bg: `linear-gradient(180deg, ${corB}, transparent)`, glow: corB },
        { pos: "bottom-0 left-0", w: "w-16 h-[2px]", bg: `linear-gradient(90deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 left-0", w: "w-[2px] h-16", bg: `linear-gradient(0deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 right-0", w: "w-16 h-[2px]", bg: `linear-gradient(270deg, ${corD}, transparent)`, glow: corD },
        { pos: "bottom-0 right-0", w: "w-[2px] h-16", bg: `linear-gradient(0deg, ${corD}, transparent)`, glow: corD },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 12px ${b.glow}`, borderRadius: "999px" }} />
      ))}
      <motion.div animate={{ left: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-[2px] w-20 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, #fff, ${cor}, transparent)`, boxShadow: `0 0 16px #fff, 0 0 32px ${cor}`, borderRadius: "999px" }} />
      <motion.div animate={{ right: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute bottom-0 h-[2px] w-20 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${corB}, #fff, transparent)`, boxShadow: `0 0 16px ${corB}`, borderRadius: "999px", position: "absolute" }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Score circular
function ScoreCircular({ score }: { score: number }) {
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cor = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="rotate-[-90deg]">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(59,111,212,0.1)" strokeWidth="8" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke={cor} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${cor})` }} />
      </svg>
      <div className="absolute text-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-xl font-black" style={{ color: cor, textShadow: `0 0 20px ${cor}` }}>{score}</motion.p>
        <p className="text-xs" style={{ color: "#3a5a8a" }}>/100</p>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD PRINCIPAL
// ============================================================
export default function Dashboard() {
  const router = useRouter();
  const { t, idioma } = useLanguage();
  const d = t.dashboard;

  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [inicialUsuario, setInicialUsuario] = useState("U");
  const [receitas, setReceitas] = useState(0);
  const [custosFixos, setCustosFixos] = useState(0);
  const [custosVariaveis, setCustosVariaveis] = useState(0);
  const [dividas, setDividas] = useState(0);
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [hora, setHora] = useState(new Date());
  const [showVolcano, setShowVolcano] = useState(false);

  useEffect(() => {
    carregarDados();
    const timer = setInterval(() => setHora(new Date()), 1000);
    setTimeout(() => setShowVolcano(true), 2000);
    return () => clearInterval(timer);
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nomeCompleto = user.user_metadata?.nome || user.user_metadata?.full_name || "";
    const emailPrefix = user.email?.split("@")[0] || "";
    const nome = nomeCompleto || emailPrefix;
    const primeiroNome = nome.split(" ")[0] || nome;
    setNomeUsuario(primeiroNome);
    setInicialUsuario(primeiroNome.charAt(0).toUpperCase() || "U");

    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();
    const inicioMes = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-01`;
    const fimMes = `${anoAtual}-${String(mesAtual).padStart(2, "0")}-31`;

    const [{ data: rec }, { data: cf }, { data: cv }, { data: div }] = await Promise.all([
      supabase.from("receitas").select("valor").eq("user_id", user.id).gte("data", inicioMes).lte("data", fimMes),
      supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id),
      supabase.from("custos_variaveis").select("valor").eq("user_id", user.id).gte("data", inicioMes).lte("data", fimMes),
      supabase.from("dividas").select("valor_total").eq("user_id", user.id),
    ]);

    const totalReceitas = rec?.reduce((s, r) => s + (r.valor || 0), 0) || 0;
    const totalFixos = cf?.reduce((s, r) => s + (r.valor_mensal || 0), 0) || 0;
    const totalVariaveis = cv?.reduce((s, r) => s + (r.valor || 0), 0) || 0;
    const totalDividas = div?.reduce((s, r) => s + (r.valor_total || 0), 0) || 0;

    setReceitas(totalReceitas);
    setCustosFixos(totalFixos);
    setCustosVariaveis(totalVariaveis);
    setDividas(totalDividas);

    const nomesMeses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const meses = await Promise.all(Array.from({ length: 6 }, async (_, i) => {
      const dt = new Date(); dt.setMonth(dt.getMonth() - (5 - i));
      const m = dt.getMonth() + 1; const a = dt.getFullYear();
      const inicio = `${a}-${String(m).padStart(2, "0")}-01`;
      const fim = `${a}-${String(m).padStart(2, "0")}-31`;
      const [{ data: rMes }, { data: cMes }] = await Promise.all([
        supabase.from("receitas").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim),
        supabase.from("custos_variaveis").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim),
      ]);
      const rTotal = rMes?.reduce((s, r) => s + (r.valor || 0), 0) || 0;
      const cTotal = (cMes?.reduce((s, r) => s + (r.valor || 0), 0) || 0) + totalFixos;
      return { mes: nomesMeses[m - 1], receita: rTotal, custos: cTotal, lucro: rTotal - cTotal };
    }));
    setDadosGrafico(meses);
    setLoading(false);
  }

  const lucro = receitas - custosFixos - custosVariaveis;
  const margemContribuicao = receitas - custosVariaveis;
  const margemPerc = receitas > 0 ? ((margemContribuicao / receitas) * 100).toFixed(1) : "0";
  const pontoEquilibrio = margemContribuicao > 0 ? (custosFixos / (margemContribuicao / (receitas || 1))) : 0;
  const capitalGiro = receitas - custosFixos - custosVariaveis;
  const indiceEndividamento = receitas > 0 ? ((dividas / receitas) * 100).toFixed(1) : "0";
  const score = Math.min(100, Math.max(0, Math.round(50 + (lucro / (receitas || 1)) * 100)));
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const saudacao = () => {
    const h = hora.getHours();
    if (h < 12) return idioma === "pt" ? "Bom dia" : idioma === "en" ? "Good morning" : "Buenos días";
    if (h < 18) return idioma === "pt" ? "Boa tarde" : idioma === "en" ? "Good afternoon" : "Buenas tardes";
    return idioma === "pt" ? "Boa noite" : idioma === "en" ? "Good evening" : "Buenas noches";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#020810" }}>
      <div className="absolute inset-0"><NeuralBrain /></div>
      <div className="relative z-10 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-2 mx-auto mb-4"
          style={{ borderColor: "#6ab0ff", borderTopColor: "transparent", borderRightColor: "#34d399" }} />
        <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: "#6ab0ff" }}>
          AXIOMA NEURAL UNIVERSE
        </motion.p>
        <motion.p animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="text-xs mt-2" style={{ color: "#3a5a8a" }}>
          {idioma === "pt" ? "Carregando inteligência..." : "Loading intelligence..."}
        </motion.p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-6 overflow-auto space-y-4" style={{ background: "#020810" }}>

      {/* ============ HERO — NEURAL BRAIN + CYBER EYE ============ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{ height: 280, background: "rgba(4,10,22,0.98)", border: "1px solid rgba(106,176,255,0.2)", boxShadow: "0 0 80px rgba(106,176,255,0.1), 0 0 40px rgba(167,139,250,0.08)" }}>

        {/* Fundo Neural Brain */}
        <div className="absolute inset-0">
          <NeuralBrain />
        </div>

        {/* Cyber Eye à direita */}
        <div className="absolute right-4 top-4 bottom-4 w-56 md:w-72">
          <CyberEye />
        </div>

        {/* Vulcão de dados */}
        <AnimatePresence>
          {showVolcano && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute left-0 bottom-0 w-48 h-48">
              <DataVolcano />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conteúdo do header */}
        <div className="absolute inset-0 z-20 flex items-center px-6 md:px-8">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }}
              style={{ filter: "drop-shadow(0 0 30px rgba(106,176,255,0.8))" }}>
              <Image src="/logo-aitech.png" alt="Axioma" width={54} height={54} className="object-contain" />
            </motion.div>
            <div>
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.4em] uppercase mb-1"
                style={{ color: "#6ab0ff", textShadow: "0 0 30px #6ab0ff" }}>
                AXIOMA NEURAL UNIVERSE
              </motion.p>
              <h2 className="text-2xl md:text-3xl font-black mb-1" style={{ color: "#c8d8f0" }}>
                {saudacao()}, <span style={{ color: "#6ab0ff", textShadow: "0 0 30px rgba(106,176,255,0.8)" }}>{nomeUsuario}</span> 👋
              </h2>
              <p className="text-xs" style={{ color: "#3a5a8a" }}>
                {hora.toLocaleDateString(idioma === "en" ? "en-US" : "pt-BR", { weekday: "long", day: "numeric", month: "long" })} · {hora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              {/* Badge de status */}
              <div className="flex items-center gap-2 mt-2">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
                <span className="text-xs font-semibold" style={{ color: "#34d399" }}>
                  {idioma === "pt" ? "Sistema Neural Ativo" : "Neural System Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Notificação + Avatar */}
          <div className="ml-auto flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.1 }} className="relative cursor-pointer p-2.5 rounded-xl"
              style={{ background: "rgba(106,176,255,0.1)", border: "1px solid rgba(106,176,255,0.2)" }}>
              <Bell size={18} style={{ color: "#6ab0ff" }} />
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#f87171", boxShadow: "0 0 8px #f87171" }} />
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black cursor-pointer"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff", boxShadow: "0 0 20px rgba(106,176,255,0.5)", border: "2px solid rgba(106,176,255,0.3)" }}>
              {inicialUsuario}
            </motion.div>
          </div>
        </div>

        {/* Bordas neon animadas */}
        <motion.div animate={{ left: ["-5%", "105%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 h-[2px] w-32 z-30 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, #6ab0ff, #34d399, transparent)", boxShadow: "0 0 20px #6ab0ff", borderRadius: "999px" }} />
        <motion.div animate={{ right: ["-5%", "105%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 h-[2px] w-32 z-30 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, #a78bfa, #f472b6, transparent)", boxShadow: "0 0 20px #a78bfa", borderRadius: "999px", position: "absolute" }} />
      </motion.div>

      {/* ============ BANNER IA TRIBUTÁRIA ============ */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        onClick={() => router.push("/ia-tributaria")}
        whileHover={{ scale: 1.01 }}>
        <CanvasNeural cor="#fbbf24" />
        <div className="relative z-10 flex items-center gap-3 px-5 py-3"
          style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.1), rgba(251,146,60,0.1))", border: "1px solid rgba(234,179,8,0.3)" }}>
          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-xl">⭐</motion.span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: "#fbbf24", textShadow: "0 0 20px #fbbf24" }}>
              {idioma === "pt" ? "IA Tributária Premium" : idioma === "en" ? "Tax AI Premium" : "IA Tributaria Premium"}
            </p>
            <p className="text-xs hidden md:block truncate" style={{ color: "#f97316" }}>
              {idioma === "pt" ? "Reduza impostos com inteligência artificial — clique para ativar" : "Reduce taxes with AI — click to activate"}
            </p>
          </div>
          <motion.span whileHover={{ scale: 1.05 }}
            className="text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #ca8a04, #ea580c)", color: "#fff", boxShadow: "0 0 20px rgba(234,179,8,0.4)" }}>
            PREMIUM
          </motion.span>
        </div>
      </motion.div>

      {/* ============ KPIs PRINCIPAIS ============ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: d.faturamento, value: fmt(receitas), change: d.mesAtual, icon: TrendingUp, cor: "#6ab0ff" },
          { label: d.custos, value: fmt(custosFixos + custosVariaveis), change: d.fixosVariaveis, icon: TrendingDown, cor: "#f87171" },
          { label: d.lucro, value: fmt(lucro), change: lucro >= 0 ? d.positivo : d.negativo, icon: DollarSign, cor: lucro >= 0 ? "#34d399" : "#f87171" },
          { label: d.score, value: `${score}/100`, change: score >= 70 ? d.bomScore : d.atencao, icon: BarChart2, cor: score >= 70 ? "#34d399" : "#fbbf24" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <CanvasBox cor={card.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
              <div className="p-4 md:p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#3a5a8a" }}>{card.label}</p>
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    className="p-1.5 rounded-lg" style={{ background: `${card.cor}15` }}>
                    <card.icon size={14} style={{ color: card.cor }} />
                  </motion.div>
                </div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-lg md:text-xl font-black mb-2" style={{ color: "#c8d8f0", textShadow: `0 0 20px ${card.cor}30` }}>
                  {card.value}
                </motion.p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${card.cor}15`, color: card.cor, border: `1px solid ${card.cor}30` }}>
                  {card.change}
                </span>
              </div>
            </CanvasBox>
          </motion.div>
        ))}
      </div>

      {/* ============ SCORE + KPIs AVANÇADOS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Score com olho cibernético */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <CanvasBox cor={score >= 70 ? "#34d399" : "#fbbf24"} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
            <div className="p-5 flex flex-col items-center text-center">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-3" style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
                AXIOMA AI.TECH
              </motion.p>
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#3a5a8a" }}>{d.score}</p>
              <ScoreCircular score={score} />
              <p className="text-xs mt-3 font-semibold" style={{ color: score >= 70 ? "#34d399" : "#fbbf24" }}>
                {score >= 70 ? "🏆 Excelente saúde financeira" : "⚡ Atenção necessária"}
              </p>
              <div className="w-full mt-4 space-y-2">
                {[
                  { label: idioma === "pt" ? "Liquidez" : "Liquidity", val: Math.min(100, (receitas / (custosFixos + custosVariaveis + 1)) * 50), cor: "#6ab0ff" },
                  { label: idioma === "pt" ? "Lucratividade" : "Profitability", val: Math.max(0, Math.min(100, 50 + (lucro / (receitas || 1)) * 100)), cor: "#34d399" },
                  { label: idioma === "pt" ? "Eficiência" : "Efficiency", val: Math.max(0, Math.min(100, 100 - Number(indiceEndividamento))), cor: "#a78bfa" },
                ].map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: "#3a5a8a" }}>
                      <span>{bar.label}</span><span>{bar.val.toFixed(0)}%</span>
                    </div>
                    <div className="rounded-full h-1.5" style={{ background: "rgba(59,111,212,0.1)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${bar.val}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 + i * 0.2 }}
                        className="h-1.5 rounded-full" style={{ background: bar.cor, boxShadow: `0 0 6px ${bar.cor}` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CanvasBox>
        </motion.div>

        {/* KPIs avançados */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: d.margemContribuicao, value: fmt(margemContribuicao), sub: `${margemPerc}% ${d.daReceita}`, cor: margemContribuicao >= 0 ? "#34d399" : "#f87171", icon: Activity },
            { label: d.pontoEquilibrio, value: fmt(pontoEquilibrio), sub: receitas >= pontoEquilibrio ? d.acimaPonto : d.abaixoPonto, cor: receitas >= pontoEquilibrio ? "#34d399" : "#f87171", icon: Target },
            { label: d.capitalGiro, value: fmt(capitalGiro), sub: capitalGiro >= 0 ? d.situacaoSaudavel : d.atencaoNecessaria, cor: capitalGiro >= 0 ? "#34d399" : "#f87171", icon: Zap },
            { label: d.indiceEndividamento, value: `${indiceEndividamento}%`, sub: Number(indiceEndividamento) <= 30 ? d.nivelSaudavel : d.nivelElevado, cor: Number(indiceEndividamento) <= 30 ? "#34d399" : "#f87171", icon: Shield },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
              <CanvasBox cor={kpi.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                      className="p-1.5 rounded-lg" style={{ background: `${kpi.cor}15` }}>
                      <kpi.icon size={14} style={{ color: kpi.cor }} />
                    </motion.div>
                    <p className="text-xs font-semibold truncate" style={{ color: "#3a5a8a" }}>{kpi.label}</p>
                  </div>
                  <p className="text-base md:text-lg font-black mb-1" style={{ color: kpi.cor, textShadow: `0 0 15px ${kpi.cor}40` }}>{kpi.value}</p>
                  <p className="text-xs" style={{ color: "#3a5a8a" }}>{kpi.sub}</p>
                </div>
              </CanvasBox>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ============ GRÁFICO ÉPICO ============ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#fbbf24">
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <div>
                <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                  className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
                  AXIOMA NEURAL UNIVERSE
                </motion.p>
                <h3 className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{d.grafico}</h3>
              </div>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border opacity-40"
                style={{ borderColor: "#6ab0ff", borderTopColor: "transparent", borderRightColor: "#34d399" }} />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dadosGrafico}>
                <defs>
                  <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ab0ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6ab0ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(106,176,255,0.06)" />
                <XAxis dataKey="mes" stroke="#3a5a8a" tick={{ fontSize: 11, fill: "#3a5a8a" }} />
                <YAxis stroke="#3a5a8a" tick={{ fontSize: 11, fill: "#3a5a8a" }} width={50} />
                <Tooltip contentStyle={{ background: "#040a16", border: "1px solid rgba(106,176,255,0.3)", borderRadius: "12px", color: "#c8d8f0" }} />
                <Area type="monotone" dataKey="receita" stroke="#6ab0ff" fill="url(#gradR)" strokeWidth={2} name={d.receitas} />
                <Area type="monotone" dataKey="custos" stroke="#34d399" fill="url(#gradC)" strokeWidth={2} name={d.custos} />
                <Area type="monotone" dataKey="lucro" stroke="#a78bfa" fill="url(#gradL)" strokeWidth={2} name={d.lucro} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CanvasBox>
      </motion.div>

      {/* ============ PREVISÃO + INSIGHTS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
          <CanvasBox cor="#fbbf24" corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
            <div className="p-4 md:p-5">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#fbbf24", textShadow: "0 0 20px #fbbf24" }}>
                AXIOMA AI.TECH
              </motion.p>
              <p className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>📈 {d.previsaoCaixa}</p>
              <div className="space-y-3">
                {[
                  { label: d.trintaDias, valor: receitas },
                  { label: d.sessentaDias, valor: receitas * 1.8 },
                  { label: d.noventaDias, valor: receitas * 2.7 },
                ].map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.2 }}
                    className="flex justify-between items-center p-3 rounded-xl"
                    style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    <span className="text-xs" style={{ color: "#3a5a8a" }}>{p.label}</span>
                    <span className="text-sm font-black" style={{ color: "#fbbf24", textShadow: "0 0 10px rgba(251,191,36,0.4)" }}>{fmt(p.valor)}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </CanvasBox>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
          <CanvasBox cor="#a78bfa" corB="#6ab0ff" corC="#34d399" corD="#f472b6">
            <div className="p-4 md:p-5">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#a78bfa", textShadow: "0 0 20px #a78bfa" }}>
                AXIOMA AI.TECH
              </motion.p>
              <p className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>🤖 {d.insights}</p>
              <div className="space-y-3">
                {[
                  { tipo: lucro >= 0 ? "pos" : "neg", texto: lucro >= 0 ? `${d.lucro}: ${fmt(lucro)}. ${d.bom}!` : `${d.lucro}: ${fmt(lucro)}. ${d.atencaoNecessaria}.` },
                  { tipo: Number(indiceEndividamento) <= 30 ? "pos" : "neg", texto: `${d.indiceEndividamento}: ${indiceEndividamento}%. ${Number(indiceEndividamento) <= 30 ? d.situacaoControlada : d.recomendadoReduzir}` },
                  { tipo: margemContribuicao >= custosFixos ? "pos" : "neg", texto: `${d.margemContribuicao}: ${fmt(margemContribuicao)}. ${margemContribuicao >= custosFixos ? d.cobrindoFixos : d.insuficienteFixos}` },
                ].map((insight, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.15 }}
                    className="flex items-start gap-2 p-3 rounded-xl"
                    style={{ background: insight.tipo === "neg" ? "rgba(248,113,113,0.05)" : "rgba(52,211,153,0.05)", border: `1px solid ${insight.tipo === "neg" ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)"}` }}>
                    <AlertTriangle size={12} style={{ color: insight.tipo === "neg" ? "#f87171" : "#34d399", marginTop: 2, flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "#8aaad4" }}>{insight.texto}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </CanvasBox>
        </motion.div>
      </div>

      {/* ============ ACESSO RÁPIDO ============ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
          <div className="p-4 md:p-5">
            <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#34d399", textShadow: "0 0 20px #34d399" }}>
              AXIOMA NEURAL UNIVERSE
            </motion.p>
            <p className="text-sm font-bold mb-4" style={{ color: "#c8d8f0" }}>
              ⚡ {idioma === "pt" ? "Acesso Rápido" : idioma === "en" ? "Quick Access" : "Acceso Rápido"}
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { label: idioma === "pt" ? "Receitas" : "Revenue", icon: "💰", path: "/receitas", cor: "#6ab0ff" },
                { label: "DRE", icon: "📈", path: "/dre", cor: "#34d399" },
                { label: idioma === "pt" ? "Fluxo" : "Cash Flow", icon: "💧", path: "/fluxo-caixa", cor: "#a78bfa" },
                { label: idioma === "pt" ? "Clientes" : "Clients", icon: "👥", path: "/clientes", cor: "#fbbf24" },
                { label: "IA Fin.", icon: "🤖", path: "/ia-financeira", cor: "#f472b6" },
                { label: "MEI", icon: "🧾", path: "/mei", cor: "#f97316" },
              ].map((item, i) => (
                <motion.button key={i}
                  whileHover={{ scale: 1.08, boxShadow: `0 0 20px ${item.cor}40` }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(item.path)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl"
                  style={{ background: `${item.cor}10`, border: `1px solid ${item.cor}25` }}>
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    className="text-xl">{item.icon}</motion.span>
                  <span className="text-xs font-semibold text-center" style={{ color: item.cor }}>{item.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </CanvasBox>
      </motion.div>

    </div>
  );
}