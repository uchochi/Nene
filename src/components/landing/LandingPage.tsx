import { useEffect, useRef, type ReactNode } from 'react'
import { ArrowRight, Workflow, Bot, FileJson, Zap, Database, Languages, Tags, Sparkles, ChevronRight } from 'lucide-react'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el) } },
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useReveal()
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>
}

const features = [
  { icon: Database, color: 'node-input', title: 'Import Any Data', desc: 'Paste raw text, JSON, or CSV. The AI auto-analyzes and structures your content into training-ready rows.' },
  { icon: Workflow, color: 'node-format', title: 'Visual Workflow Editor', desc: 'Drag-and-drop nodes to build data pipelines — input, format, tag, translate, AI-transform, and output.' },
  { icon: Bot, color: 'node-ai', title: 'AI-Powered Transform', desc: 'Generate Chain-of-Thought explanations, categorize entries, and enrich metadata using any OpenRouter model.' },
  { icon: Languages, color: 'node-translate', title: 'Multi-Language', desc: 'Translate datasets across languages with configurable tone, formality, and regional variants.' },
  { icon: Tags, color: 'node-tag', title: 'Smart Tagging', desc: 'Auto-extract language, region, and domain tags — or define your own custom tagging schema.' },
  { icon: FileJson, color: 'node-output', title: 'JSONL Export', desc: 'Download industry-standard JSONL files ready for fine-tuning GPT, LLaMA, Mistral, and other LLMs.' },
]

const steps = [
  { num: '01', title: 'Import', desc: 'Paste or upload your raw dataset — text, JSON, or CSV.', color: '#4CAF50' },
  { num: '02', title: 'Build', desc: 'Connect nodes on a visual canvas to define your pipeline.', color: '#2196F3' },
  { num: '03', title: 'Transform', desc: 'AI enriches every row with tags, translations, and reasoning.', color: '#E91E63' },
  { num: '04', title: 'Export', desc: 'Download a clean JSONL file ready for model fine-tuning.', color: '#F44336' },
]

const stats = [
  { value: '7+', label: 'Node Types' },
  { value: '∞', label: 'Pipeline Combos' },
  { value: '100+', label: 'Languages' },
  { value: 'JSONL', label: 'Export Format' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-n8n-dark text-white overflow-hidden">

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-n8n-dark/80 border-b border-n8n-dark-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ooguy" className="h-9" />
          </div>
          <a
            href="https://t.me/ooguybot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2"
          >
            Open in Telegram
            <ArrowRight size={14} />
          </a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 px-6">
        {/* glow orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-n8n-dark-4 bg-n8n-dark-2/60 text-xs text-n8n-gray-light reveal-up">
            <Sparkles size={13} className="text-n8n-orange" />
            AI-Powered Dataset Engineering
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 reveal-up" style={{ animationDelay: '.1s' }}>
            Build LLM Training Data{' '}
            <span className="bg-gradient-to-r from-n8n-orange via-n8n-red to-n8n-orange bg-clip-text text-transparent">
              Without Writing Code
            </span>
          </h1>

          <p className="text-base md:text-lg text-n8n-gray-light max-w-2xl mx-auto mb-10 reveal-up" style={{ animationDelay: '.2s' }}>
            A visual workflow editor inside Telegram. Import raw data, connect AI-powered nodes,
            and export production-ready JSONL datasets for fine-tuning any model.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 reveal-up" style={{ animationDelay: '.3s' }}>
            <a
              href="https://t.me/ooguybot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2.5"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Launch in Telegram
              <ArrowRight size={16} />
            </a>
            <a href="#features" className="btn-secondary text-base px-8 py-3 inline-flex items-center gap-2">
              See Features
              <ChevronRight size={16} />
            </a>
          </div>
        </div>

        {/* ─── WORKFLOW PREVIEW ─── */}
        <div className="max-w-5xl mx-auto mt-16 md:mt-24 relative z-10 reveal-up" style={{ animationDelay: '.45s' }}>
          <div className="workflow-preview rounded-2xl border border-n8n-dark-4 bg-n8n-dark-2/80 backdrop-blur p-6 md:p-8 overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-n8n-red/80" />
              <div className="w-3 h-3 rounded-full bg-n8n-orange-bright/80" />
              <div className="w-3 h-3 rounded-full bg-node-input/80" />
              <span className="ml-3 text-xs text-n8n-gray font-mono">ooguy — workflow canvas</span>
            </div>
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2">
              <FakeNode icon="📥" label="Input" sub="JSON / CSV" color="#4CAF50" delay={0} />
              <Connector delay={0.6} />
              <FakeNode icon="🤖" label="AI Transform" sub="CoT Generation" color="#E91E63" delay={0.15} />
              <Connector delay={0.75} />
              <FakeNode icon="🔧" label="Format" sub="JSON Wrapper" color="#2196F3" delay={0.3} />
              <Connector delay={0.9} />
              <FakeNode icon="🏷️" label="Tag" sub="Auto-Extract" color="#FF9800" delay={0.45} />
              <Connector delay={1.05} />
              <FakeNode icon="📤" label="Output" sub="JSONL Export" color="#F44336" delay={0.6} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="border-y border-n8n-dark-4 bg-n8n-dark-2/40">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-n8n-dark-4">
          {stats.map((s, i) => (
            <Section key={i}>
              <div className="py-8 md:py-10 text-center px-4">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-n8n-orange to-n8n-red bg-clip-text text-transparent mb-1">{s.value}</div>
                <div className="text-xs text-n8n-gray uppercase tracking-wider">{s.label}</div>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Section>
            <div className="text-center mb-14">
              <span className="text-xs text-n8n-orange uppercase tracking-widest font-semibold">Features</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Everything You Need to Shape Training Data</h2>
              <p className="text-n8n-gray-light max-w-xl mx-auto">
                From raw input to fine-tuning-ready JSONL — every step runs inside a visual workflow powered by AI.
              </p>
            </div>
          </Section>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Section key={i}>
                <div className="feature-card group relative p-6 rounded-2xl border border-n8n-dark-4 bg-n8n-dark-2/60 hover:border-n8n-dark-5 transition-all duration-300 h-full">
                  <div className={`w-11 h-11 rounded-xl bg-${f.color}/10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                    <f.icon size={22} className={`text-${f.color}`} />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-n8n-gray-light leading-relaxed">{f.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 md:py-28 px-6 bg-n8n-dark-2/30">
        <div className="max-w-5xl mx-auto">
          <Section>
            <div className="text-center mb-16">
              <span className="text-xs text-n8n-orange uppercase tracking-widest font-semibold">How It Works</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">Four Steps to a Perfect Dataset</h2>
            </div>
          </Section>

          <div className="relative">
            {/* vertical line */}
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-node-input via-node-ai to-node-output" />

            <div className="space-y-12 md:space-y-16">
              {steps.map((s, i) => (
                <Section key={i}>
                  <div className="flex items-start gap-6 md:gap-8 relative">
                    <div className="step-num flex-shrink-0 w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-bold text-lg relative z-10 bg-n8n-dark"
                         style={{ borderColor: s.color, color: s.color }}>
                      {s.num}
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-bold mb-2" style={{ color: s.color }}>{s.title}</h3>
                      <p className="text-n8n-gray-light text-sm md:text-base max-w-md">{s.desc}</p>
                    </div>
                  </div>
                </Section>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── EXAMPLE OUTPUT ─── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <Section>
            <div className="text-center mb-12">
              <span className="text-xs text-n8n-orange uppercase tracking-widest font-semibold">Example Output</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Rich, Structured, Model-Ready</h2>
              <p className="text-n8n-gray-light max-w-lg mx-auto">
                Every row is enriched with metadata, cultural context, and Chain-of-Thought explanations.
              </p>
            </div>
          </Section>

          <Section>
            <div className="code-block rounded-2xl border border-n8n-dark-4 bg-n8n-dark-2/80 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-n8n-dark-4 bg-n8n-dark-3/60">
                <Zap size={14} className="text-n8n-orange" />
                <span className="text-xs text-n8n-gray font-mono">humor_dataset.jsonl</span>
              </div>
              <pre className="p-5 text-xs md:text-sm leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-node-ai">{'{'}</span>{'\n'}
                  {'  '}<span className="text-n8n-orange">"setup"</span>: <span className="text-node-input">"¿Qué hace una abeja en el gimnasio?"</span>,{'\n'}
                  {'  '}<span className="text-n8n-orange">"punchline"</span>: <span className="text-node-input">"¡Zum-ba!"</span>,{'\n'}
                  {'  '}<span className="text-n8n-orange">"language"</span>: <span className="text-node-input">"es"</span>,{'\n'}
                  {'  '}<span className="text-n8n-orange">"region"</span>: <span className="text-node-input">"Latin America"</span>,{'\n'}
                  {'  '}<span className="text-n8n-orange">"humor_mechanics"</span>: [<span className="text-node-input">"pun"</span>, <span className="text-node-input">"phonetic_ambiguity"</span>],{'\n'}
                  {'  '}<span className="text-n8n-orange">"cultural_context"</span>: <span className="text-node-input">"Zumba is a dance fitness program"</span>,{'\n'}
                  {'  '}<span className="text-n8n-orange">"explanation_for_ai"</span>: <span className="text-node-input">"The humor arises from the double meaning of 'zumba'..."</span>{'\n'}
                  <span className="text-node-ai">{'}'}</span>
                </code>
              </pre>
            </div>
          </Section>
        </div>
      </section>

      {/* ─── CREDIT SYSTEM ─── */}
      <section className="py-20 md:py-28 px-6 bg-n8n-dark-2/30">
        <div className="max-w-4xl mx-auto">
          <Section>
            <div className="credit-card rounded-3xl border border-n8n-dark-4 bg-gradient-to-br from-n8n-dark-3 via-n8n-dark-2 to-n8n-dark-3 p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-n8n-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-n8n-orange/30 bg-n8n-orange/10 text-xs text-n8n-orange font-semibold">
                  <Zap size={13} />
                  Credit System
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Pay As You Go, Scale When Ready</h2>
                <p className="text-n8n-gray-light max-w-lg mx-auto mb-8">
                  Start with 75% off your first top-up. Each AI operation uses credits — you only pay for what you process.
                  Secure payments via Paystack.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="bg-n8n-dark-4/60 rounded-xl p-4 border border-n8n-dark-5">
                    <div className="text-xl font-bold text-n8n-orange mb-1">75%</div>
                    <div className="text-xs text-n8n-gray">First-Time Bonus</div>
                  </div>
                  <div className="bg-n8n-dark-4/60 rounded-xl p-4 border border-n8n-dark-5">
                    <div className="text-xl font-bold text-n8n-orange mb-1">$10</div>
                    <div className="text-xs text-n8n-gray">Base Top-Up</div>
                  </div>
                  <div className="bg-n8n-dark-4/60 rounded-xl p-4 border border-n8n-dark-5">
                    <div className="text-xl font-bold text-n8n-orange mb-1">1250</div>
                    <div className="text-xs text-n8n-gray">Credits Included</div>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 md:py-32 px-6 relative">
        <div className="hero-orb hero-orb-1" style={{ top: '0', left: '20%' }} />
        <div className="hero-orb hero-orb-2" style={{ top: '20%', right: '10%' }} />
        <Section>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <img src="/logo.png" alt="ooguy" className="w-[74px] h-[74px] mx-auto mb-6 reveal-up" />
            <h2 className="text-3xl md:text-5xl font-bold mb-6 reveal-up" style={{ animationDelay: '.1s' }}>
              Ready to Build Your Dataset?
            </h2>
            <p className="text-n8n-gray-light text-base md:text-lg max-w-xl mx-auto mb-10 reveal-up" style={{ animationDelay: '.2s' }}>
              Open ooguy in Telegram and start building production-quality training data in minutes.
            </p>
            <a
              href="https://t.me/ooguybot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-base px-10 py-3.5 inline-flex items-center gap-2.5 reveal-up"
              style={{ animationDelay: '.3s' }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Get Started Free
              <ArrowRight size={16} />
            </a>
          </div>
        </Section>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-n8n-dark-4 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ooguy" className="h-6" />
          </div>
          <p className="text-xs text-n8n-gray">
            Built for AI trainers, linguists, and dataset creators. Powered by{' '}
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-n8n-orange hover:underline">OpenRouter</a>,
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-n8n-orange hover:underline"> Supabase</a>, and{' '}
            <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" className="text-n8n-orange hover:underline">Paystack</a>.
          </p>
          <a href="https://github.com/uchochi/Nene" target="_blank" rel="noopener noreferrer" className="text-xs text-n8n-gray hover:text-n8n-orange transition-colors">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

/* ─── Sub-components ─── */

function FakeNode({ icon, label, sub, color, delay }: { icon: string; label: string; sub: string; color: string; delay: number }) {
  return (
    <div className="fake-node flex flex-col items-center gap-2 min-w-[90px]" style={{ animationDelay: `${delay}s` }}>
      <div className="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl bg-n8n-dark-3/80 transition-transform duration-300 hover:scale-110"
           style={{ borderColor: color }}>
        {icon}
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
      <span className="text-[10px] text-n8n-gray">{sub}</span>
    </div>
  )
}

function Connector({ delay }: { delay: number }) {
  return (
    <div className="connector flex-shrink-0 w-8 h-px relative" style={{ animationDelay: `${delay}s` }}>
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-n8n-gray-dark to-n8n-gray" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-n8n-orange" />
    </div>
  )
}
