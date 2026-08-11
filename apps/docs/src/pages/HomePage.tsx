import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GitBranch, Activity, Shield, Cpu, Layers, Zap,
  ArrowRight, Terminal, Github, Copy, Check,
  Database, Radio, Server, Workflow,
} from 'lucide-react';

/* ── Floating chip component ──────────────────────────────── */
const FloatingChip: React.FC<{
  label: string;
  icon: React.ReactNode;
  style: React.CSSProperties;
  delay?: number;
}> = ({ label, icon, style, delay = 0 }) => (
  <div
    className="tech-chip absolute hidden lg:flex"
    style={{
      ...style,
      animationDelay: `${delay}s`,
      animation: `floatY ${3.5 + delay * 0.5}s ${delay}s ease-in-out infinite`,
    }}
  >
    {icon}
    <span>{label}</span>
  </div>
);

/* ── Feature card ──────────────────────────────────────────── */
interface FeatureDef {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}

const FEATURES: FeatureDef[] = [
  {
    icon: <GitBranch size={20} />,
    title: 'DAG Workflow Engine',
    desc: "Define dependency-aware pipelines as Directed Acyclic Graphs with Tarjan's cycle detection and topological scheduling.",
    delay: 0,
  },
  {
    icon: <Zap size={20} />,
    title: 'Distributed Workers',
    desc: 'Specialized runtimes for build, test, docker, deploy, and script jobs — each with isolated execution environments.',
    delay: 0.05,
  },
  {
    icon: <Activity size={20} />,
    title: 'Real-Time Monitoring',
    desc: 'Live execution state streamed over WebSockets to a React + React Flow dashboard with < 50ms latency.',
    delay: 0.1,
  },
  {
    icon: <Shield size={20} />,
    title: 'Secret Redaction',
    desc: 'Automated masking of Bearer tokens, AWS keys, and API secrets from all log streams before persistence or streaming.',
    delay: 0.15,
  },
  {
    icon: <Cpu size={20} />,
    title: 'AI Failure Analysis',
    desc: 'Event Bus consumer that parses failure logs to produce root-cause analysis and automated fix recommendations.',
    delay: 0.2,
  },
  {
    icon: <Layers size={20} />,
    title: 'Fault-Tolerant Recovery',
    desc: 'Heartbeat-based dead worker detection with automatic job re-enqueuing via Redis Streams claim-timeout mechanism.',
    delay: 0.25,
  },
];

const FeatureCard: React.FC<FeatureDef & { inView: boolean }> = ({
  icon, title, desc, delay, inView
}) => (
  <div
    className="feature-card group"
    style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.4s ${delay + 0.1}s, transform 0.4s ${delay + 0.1}s ease-out`,
    }}
  >
    <div className="feature-icon">
      {icon}
    </div>
    <h3 className="font-bold text-[0.95rem] mb-2" style={{ color: 'var(--text)' }}>{title}</h3>
    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
  </div>
);

/* ── Stat pill ──────────────────────────────────────────────── */
const StatPill: React.FC<{ metric: string; label: string; inView: boolean; delay: number }> = ({
  metric, label, inView, delay
}) => (
  <div
    className="text-center p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)]"
    style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.4s ${delay}s, transform 0.4s ${delay}s ease-out`,
    }}
  >
    <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>{metric}</p>
    <p className="text-xs font-medium mt-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
  </div>
);

/* ── Intersection observer hook ────────────────────────────── */
const useInView = (threshold = 0.15): [React.RefObject<HTMLDivElement>, boolean] => {
  const ref = useRef<HTMLDivElement>(null!);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

/* ══════════════════════════════════════════════════════════════
   Main HomePage Component (Black & White Theme)
══════════════════════════════════════════════════════════════ */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const [heroRef, heroInView] = useInView(0.05);
  const [featRef, featInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.2);
  const [archRef, archInView] = useInView(0.15);
  const [quickRef, quickInView] = useInView(0.15);

  useEffect(() => { document.title = 'DevFlow — Distributed CI/CD Workflow Engine'; }, []);

  const copy = async () => {
    await navigator.clipboard.writeText('git clone https://github.com/Neet2516/DevFlow.git && cd DevFlow && npm install && npm run build');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-14 overflow-x-hidden">

      {/* ╔══ HERO ═══════════════════════════════════════════════╗ */}
      <section className="hero-gradient relative overflow-hidden py-24 md:py-32 px-6 min-h-[85vh] flex items-center">

        {/* Floating monochrome tech chips */}
        <FloatingChip label="BullMQ" icon={<Workflow size={12} />} style={{ top: '14%', left: '6%' }} delay={0} />
        <FloatingChip label="Redis Streams" icon={<Database size={12} />} style={{ top: '22%', right: '7%' }} delay={0.8} />
        <FloatingChip label="TypeScript" icon={<Server size={12} />} style={{ bottom: '30%', left: '4%' }} delay={0.4} />
        <FloatingChip label="React Flow" icon={<Activity size={12} />} style={{ bottom: '22%', right: '5%' }} delay={1.2} />
        <FloatingChip label="PostgreSQL" icon={<Database size={12} />} style={{ top: '48%', left: '2%' }} delay={1.6} />
        <FloatingChip label="WebSocket" icon={<Radio size={12} />} style={{ top: '38%', right: '3%' }} delay={2} />

        <div className="max-w-4xl mx-auto text-center w-full" ref={heroRef}>

          {/* Title */}
          <h1
            className="text-[clamp(3rem,9vw,6.5rem)] font-black tracking-tight leading-[1.0] mb-6"
            style={{
              color: 'var(--text)',
              opacity: heroInView ? 1 : 0,
              transform: heroInView ? 'translateY(0)' : 'translateY(32px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            DevFlow
          </h1>

          <p
            className="text-[clamp(1.05rem,2.2vw,1.35rem)] max-w-2xl mx-auto leading-relaxed mb-4 font-normal"
            style={{
              color: 'var(--text-muted)',
              opacity: heroInView ? 1 : 0,
              transform: heroInView ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.6s 0.1s ease-out, transform 0.6s 0.1s ease-out',
            }}
          >
            A high-throughput, fault-tolerant{' '}
            <strong style={{ color: 'var(--text)' }}>distributed DAG workflow</strong> and{' '}
            <strong style={{ color: 'var(--text)' }}>CI/CD engine</strong> built with Node.js, TypeScript, BullMQ, Redis Streams, PostgreSQL, and React.
          </p>

          {/* CTA buttons */}
          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            style={{
              opacity: heroInView ? 1 : 0,
              transform: heroInView ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.6s 0.2s ease-out, transform 0.6s 0.2s ease-out',
            }}
          >
            <button
              onClick={() => navigate('/docs/introduction')}
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background: 'var(--text)',
                color: 'var(--bg)',
                border: '1px solid var(--text)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              Get Started
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => navigate('/docs/api')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm border transition-colors duration-200"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                background: 'var(--bg)',
              }}
            >
              API Reference
            </button>

            <a
              href="https://github.com/Neet2516/DevFlow"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
            >
              <Github size={17} />
              GitHub
            </a>
          </div>

          {/* Terminal quick-install */}
          <div
            className="mt-10 flex items-center justify-center"
            style={{
              opacity: heroInView ? 1 : 0,
              transition: 'opacity 0.6s 0.3s ease-out',
            }}
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border max-w-lg w-full font-mono text-xs"
              style={{
                background: '#000000',
                borderColor: '#333333',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}>
              <Terminal size={14} className="text-neutral-400 shrink-0" />
              <span className="flex-1 text-left truncate">
                npm install &amp;&amp; npm run build
              </span>
              <button onClick={copy} className="shrink-0 text-neutral-400 hover:text-white transition-colors">
                {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══ KEY FEATURES ════════════════════════════════════════╗ */}
      <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14" ref={featRef}>
            <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1 rounded-full text-xs font-mono font-semibold border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--code-bg)' }}>
              CORE PLATFORM
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--text)' }}>
              Key Features
            </h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              Everything required for high-volume, resilient workflow execution.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <FeatureCard key={f.title} {...f} inView={featInView} />
            ))}
          </div>
        </div>
      </section>

      {/* ╔══ STATS ═══════════════════════════════════════════════╗ */}
      <section className="py-16 px-6 border-t" style={{ borderColor: 'var(--border)', background: 'var(--code-bg)' }} ref={statsRef}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl font-bold mb-10 tracking-tight" style={{ color: 'var(--text)' }}>
            Performance Targets
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { metric: '< 50ms', label: 'WebSocket latency', delay: 0 },
              { metric: '10K+/min', label: 'Events processed', delay: 0.1 },
              { metric: '500+', label: 'Concurrent pipelines', delay: 0.2 },
              { metric: '100+', label: 'Worker nodes', delay: 0.3 },
            ].map(s => <StatPill key={s.label} {...s} inView={statsInView} />)}
          </div>
        </div>
      </section>

      {/* ╔══ ARCHITECTURE DIAGRAM ════════════════════════════════╗ */}
      <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }} ref={archRef}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10"
            style={{
              opacity: archInView ? 1 : 0,
              transform: archInView ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
            }}>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
              System Architecture
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Distributed microservices communicating through a durable Event Bus
            </p>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{
              borderColor: 'var(--border)',
              opacity: archInView ? 1 : 0,
              transform: archInView ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.6s 0.1s ease-out, transform 0.6s 0.1s ease-out',
            }}>
            <div className="p-3 flex items-center justify-between border-b"
              style={{ background: 'var(--code-bg)', borderColor: 'var(--border)' }}>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                <span className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="w-3 h-3 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                System Architecture Flowchart
              </span>
            </div>
            <div style={{ background: '#000000' }} className="p-4 md:p-6 flex justify-center">
              <img
                src="/flowchart.png"
                alt="DevFlow system architecture flowchart"
                className="w-full object-contain max-h-[500px] invert dark:invert-0"
                style={{ borderRadius: '0.25rem' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ╔══ QUICK START ═════════════════════════════════════════╗ */}
      <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }} ref={quickRef}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div style={{
              opacity: quickInView ? 1 : 0,
              transform: quickInView ? 'translateX(0)' : 'translateX(-24px)',
              transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
            }}>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--text)' }}>
                Quick Start
              </h2>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                DevFlow runs locally using Docker Compose. Spin up the entire infrastructure in minutes.
              </p>
              <div className="space-y-4">
                {[
                  { step: '01', label: 'Prerequisites', desc: 'Node.js v18+, Docker & Docker Compose' },
                  { step: '02', label: 'Install & Build', desc: 'npm install && npm run build' },
                  { step: '03', label: 'Infrastructure', desc: 'docker-compose up -d (PostgreSQL + Redis)' },
                  { step: '04', label: 'Dev Stack', desc: 'npm run dev — launches all 14 services' },
                ].map((s, i) => (
                  <div key={s.step} className="flex gap-4 items-start" style={{
                    opacity: quickInView ? 1 : 0,
                    transition: `opacity 0.4s ${0.1 * i}s ease-out`,
                  }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border border-[var(--border)] bg-[var(--code-bg)]"
                      style={{ color: 'var(--text)' }}>
                      {s.step}
                    </div>
                    <div className="pt-0.5">
                      <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text)' }}>{s.label}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/docs/quickstart"
                  className="inline-flex items-center gap-2 text-sm font-semibold group underline underline-offset-4"
                  style={{ color: 'var(--text)' }}>
                  Full Quick Start guide
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div style={{
              opacity: quickInView ? 1 : 0,
              transform: quickInView ? 'translateX(0)' : 'translateX(24px)',
              transition: 'opacity 0.5s 0.1s ease-out, transform 0.5s 0.1s ease-out',
            }}>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b"
                  style={{ background: 'var(--code-bg)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>terminal</span>
                </div>
                <pre className="p-5 text-xs leading-relaxed overflow-x-auto font-mono" style={{ background: '#000000', color: '#f5f5f5' }}>
{`# 1. Clone and install
git clone https://github.com/Neet2516/DevFlow.git
cd DevFlow && npm install

# 2. Start infrastructure
docker-compose up -d

# 3. Build all workspaces
npm run build

# 4. Launch dev stack
npm run dev`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══ FOOTER ══════════════════════════════════════════════╗ */}
      <footer className="border-t py-10 px-6" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              DevFlow — MIT License
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            {[
              { label: 'Docs',         to: '/docs/introduction' },
              { label: 'API',          to: '/docs/api' },
              { label: 'Contributing', to: '/docs/contributing' },
            ].map(l => (
              <Link key={l.label} to={l.to}
                className="transition-colors hover:underline"
                style={{ color: 'var(--text-muted)' }}>
                {l.label}
              </Link>
            ))}
            <a href="https://github.com/Neet2516/DevFlow" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:underline"
              style={{ color: 'var(--text-muted)' }}>
              <Github size={13} /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
