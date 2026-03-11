import { Menu, Sparkles, ShieldCheck, Wrench, Home, Paintbrush, Clock3, CheckCircle2, Send, Facebook, Instagram, Twitter } from 'lucide-react';
import { Page } from '../App';

interface LandingProps {
  onNavigate: (page: Page) => void;
}

const brandPills = ['AURORA', 'LUMENA', 'VALTI', 'ZENITH', 'PRISM'];

const featuredCategories = [
  {
    title: 'Elite Cleaning',
    description: 'Spotless home management and deep sanitation cycles.',
    icon: Home,
    accent: 'from-cyan-500 to-blue-600',
    bg: 'from-slate-700 via-slate-600 to-slate-800'
  },
  {
    title: 'Precision Repairs',
    description: 'Trained technicians for heavy workloads and smart fixes.',
    icon: Wrench,
    accent: 'from-blue-500 to-indigo-600',
    bg: 'from-slate-800 via-slate-700 to-slate-900'
  },
  {
    title: 'Holistic Wellness',
    description: 'Personalized spa treatment and wellness programs at home.',
    icon: Sparkles,
    accent: 'from-emerald-500 to-teal-600',
    bg: 'from-emerald-900 via-slate-900 to-black'
  }
];

const processSteps = [
  {
    id: '1',
    title: 'Select & Customize',
    description: 'Browse our curated list of services and tailor every request.',
    icon: Sparkles
  },
  {
    id: '2',
    title: 'Secure Scheduling',
    description: 'Book instantly through secure payment flows and live timing.',
    icon: Clock3
  },
  {
    id: '3',
    title: 'Premium Execution',
    description: 'Certified professionals deliver with strict quality controls.',
    icon: ShieldCheck
  }
];

export default function LandingModern({ onNavigate }: LandingProps) {
  return (
    <div
      className="min-h-screen bg-[#eef0f2] text-slate-900"
      style={{ fontFamily: "'Sora', 'Manrope', 'Segoe UI', sans-serif" }}
    >
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#eef0f2]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0a2a59]">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            EliteSphere
          </button>
          <button
            aria-label="menu"
            className="rounded-md border border-slate-300 bg-white p-2 text-slate-700 shadow-sm"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-0 pt-5 md:px-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-700/80 bg-[#0f1218] p-3 shadow-[0_12px_40px_rgba(2,10,28,0.45)] md:p-5">
          <div className="rounded-[22px] border border-slate-600/70 bg-gradient-to-b from-[#21242c] to-[#0b0d12] p-5 md:p-8">
            <p className="mb-4 inline-flex items-center rounded-full border border-slate-500/60 bg-slate-800/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-100">
              Premium Service Network
            </p>
            <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div>
                <h1 className="text-4xl font-extrabold leading-[0.95] text-white sm:text-5xl md:text-6xl">
                  Elite
                  <br />
                  Services at
                  <br />
                  Your
                  <br />
                  <span className="text-cyan-400">Command</span>
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300 md:text-base">
                  Experience curated home and lifestyle services with trusted experts, structured workflows, and premium support.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => onNavigate('login')}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,131,200,0.35)] transition hover:brightness-110"
                  >
                    Explore Services
                  </button>
                  <button
                    onClick={() => onNavigate('role')}
                    className="rounded-lg border border-slate-500 bg-transparent px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/60"
                  >
                    Partner With Us
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Average Fulfillment</p>
                  <p className="mt-2 text-2xl font-bold text-white">23 min</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Client Satisfaction</p>
                  <p className="mt-2 text-2xl font-bold text-white">98.7%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-1 py-10 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Trusted by global luxury brands
          </p>
          <div className="mx-auto mt-5 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {brandPills.map((brand) => (
              <div key={brand} className="rounded-md border border-slate-200 bg-slate-100 py-2 text-[10px] font-semibold tracking-[0.12em] text-slate-500">
                {brand}
              </div>
            ))}
          </div>
        </section>

        <section className="pb-12">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700">Curated experiences</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-[#0f172a]">Featured Categories</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {featuredCategories.map((item) => (
              <button
                key={item.title}
                onClick={() => onNavigate('login')}
                className={`group overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-br ${item.bg} text-left shadow-[0_12px_24px_rgba(2,10,28,0.28)] transition hover:-translate-y-1`}
              >
                <div className="h-28 w-full bg-gradient-to-r from-white/10 to-transparent" />
                <div className="p-4">
                  <div className={`mb-3 inline-flex rounded-md bg-gradient-to-r ${item.accent} p-2`}>
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white px-5 py-12 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-700">Simple elegance</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0f172a]">Redefining Service Delivery</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Our process is designed for your convenience, ensuring a seamless journey from request to completion.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
            {processSteps.map((step) => (
              <div key={step.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-full border border-slate-200 bg-white p-2">
                    <step.icon className="h-4 w-4 text-slate-700" />
                  </div>
                  <span className="rounded-full bg-cyan-600 px-2 py-1 text-[10px] font-semibold text-white">{step.id}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-14 bg-[#091734] text-slate-200">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr] md:px-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <Sparkles className="h-4 w-4" />
              EliteSphere
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              The world's leading marketplace for premium household services, delivered with uncompromising quality.
            </p>
            <div className="mt-4 flex items-center gap-3 text-slate-300">
              <Facebook className="h-4 w-4" />
              <Instagram className="h-4 w-4" />
              <Twitter className="h-4 w-4" />
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Find a Service</li>
              <li>Member Benefits</li>
              <li>Partner Program</li>
              <li>Success Stories</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Support</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Concierge Desk</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Safety Center</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Newsletter</h4>
            <p className="text-sm text-slate-300">Subscribe for exclusive insights and premium offers.</p>
            <div className="mt-3 flex overflow-hidden rounded-lg border border-slate-600 bg-[#0f2349]">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              <button className="grid w-11 place-items-center bg-cyan-600 text-white">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700/60 px-4 py-4 text-center text-[11px] uppercase tracking-[0.14em] text-slate-400 md:px-6">
          © 2026 EliteSphere Global. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

