import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  CreditCard,
  FolderKanban,
  LifeBuoy,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { blogService } from '../../services/contentService';
import { formatDate, truncate } from '../../utils/format';

const FEATURES = [
  {
    icon: Users,
    title: 'Client management',
    text: 'Rich client profiles with companies, contacts, status, notes and a complete activity history.',
  },
  {
    icon: FolderKanban,
    title: 'Projects & Kanban',
    text: 'Plan with milestones, then drag tasks across a Kanban board with comments and attachments.',
  },
  {
    icon: CreditCard,
    title: 'Invoicing',
    text: 'Line items, tax, discounts and currencies — then export a polished PDF your client will trust.',
  },
  {
    icon: LifeBuoy,
    title: 'Support desk',
    text: 'Tickets with categories, priorities, internal notes and near-real-time threaded replies.',
  },
  {
    icon: Bot,
    title: 'AI assistant',
    text: 'Summarize project activity, draft client emails and break goals into tasks in one click.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    text: 'Revenue, task throughput, client growth and ticket volume — all on live charts.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'We replaced three separate tools with NexClient. Invoicing and project delivery finally live in the same place.',
    name: 'Amelia Rivera',
    role: 'Founder, Northlight Studio',
  },
  {
    quote:
      'The AI status updates save me an hour every Friday. Clients think we hired a full-time PM.',
    name: 'Daniel Okafor',
    role: 'Director, Kite Digital',
  },
  {
    quote:
      'Onboarding a new client takes two minutes. The support portal alone paid for the subscription.',
    name: 'Sophie Marchand',
    role: 'COO, Atelier Nord',
  },
];

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes. Every plan starts with a 14-day free trial — no credit card required. You can cancel any time from your settings.',
  },
  {
    q: 'Can my clients log in?',
    a: 'Absolutely. Clients get their own portal where they can track project progress, download invoices, and open support tickets.',
  },
  {
    q: 'How does the AI assistant work?',
    a: 'NexClient ships with a provider-agnostic AI service. Add an API key and it unlocks summaries and drafting; without one it runs in a helpful offline mode.',
  },
  {
    q: 'Do you support multiple currencies and tax rates?',
    a: 'Yes. Set a default currency and tax rate per workspace, and override both on individual invoices.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: 0,
    tagline: 'For freelancers finding their feet',
    features: ['1 workspace', 'Up to 5 clients', 'Projects & tasks', 'Basic invoicing'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Agency Pro',
    price: 49,
    tagline: 'For growing digital agencies',
    features: [
      'Unlimited clients',
      'Kanban & milestones',
      'AI assistant included',
      'Invoices + PDF export',
      'Support desk',
      'Analytics dashboard',
    ],
    cta: 'Start 14-day trial',
    highlight: true,
  },
  {
    name: 'Scale',
    price: 129,
    tagline: 'For multi-team operations',
    features: ['Everything in Pro', 'Manager roles', 'Activity audit log', 'Blog & site settings', 'Priority support'],
    cta: 'Talk to us',
    highlight: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function Landing() {
  const [posts, setPosts] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    blogService
      .getAll({ per_page: 3 })
      .then(({ data }) => setPosts(data.data ?? []))
      .catch(() => setPosts([]));
  }, []);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid opacity-60" />
        <div className="absolute -left-40 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-900/30" />
        <div className="absolute -right-40 top-20 -z-10 h-[24rem] w-[24rem] rounded-full bg-accent-400/25 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand-700 backdrop-blur dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
              >
                <Sparkles size={13} /> AI-powered client &amp; project management
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
              >
                Run your agency from <span className="text-gradient">one intelligent</span> workspace
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400"
              >
                NexClient brings clients, projects, tasks, invoices and support together — with an AI copilot
                that writes your updates and keeps delivery on track.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
                <Button to="/register" variant="gradient" size="lg">
                  Start free trial <ArrowRight size={17} />
                </Button>
                <Button to="/showcase" variant="secondary" size="lg">
                  <Play size={16} /> See it in action
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                {[
                  { icon: CheckCircle2, label: 'No credit card required' },
                  { icon: Zap, label: 'Set up in 2 minutes' },
                  { icon: ShieldCheck, label: 'Your data stays yours' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Icon size={15} className="text-emerald-500" /> {label}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Dashboard mock */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/20 to-accent-500/20 blur-2xl" />
              <Card padded={false} className="overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-medium text-slate-400">nexclient.app/admin/dashboard</span>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Revenue', value: '$248k', tone: 'from-brand-500 to-accent-500' },
                      { label: 'Projects', value: '18', tone: 'from-emerald-500 to-teal-500' },
                      { label: 'Tickets', value: '4', tone: 'from-amber-500 to-orange-500' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                        <p className="text-[11px] font-medium text-slate-400">{stat.label}</p>
                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        <div className={`mt-2 h-1.5 rounded-full bg-gradient-to-r ${stat.tone}`} />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                    <div className="flex items-end justify-between gap-1.5">
                      {[42, 58, 36, 72, 64, 88, 76, 95, 68, 84, 92, 78].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}px` }}
                          className="w-full rounded-t-md bg-gradient-to-t from-brand-500/30 to-brand-500"
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-slate-400">Monthly revenue</p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { title: 'Website Redesign', progress: 45, tone: 'bg-brand-500' },
                      { title: 'Mobile App Development', progress: 30, tone: 'bg-accent-500' },
                      { title: 'Brand Identity Package', progress: 100, tone: 'bg-emerald-500' },
                    ].map((project) => (
                      <div
                        key={project.title}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800"
                      >
                        <span className={`h-2 w-2 rounded-full ${project.tone}`} />
                        <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                          {project.title}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{project.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-5 -left-5 hidden items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-card sm:flex dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white">
                  <Bot size={17} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">AI drafted a status update</p>
                  <p className="text-[11px] text-slate-400">Ready to send to the client</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Trust bar */}
          <div className="mt-20 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-slate-200 pt-10 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Trusted by modern studios
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {['Northlight', 'Kite Digital', 'Atelier Nord', 'Bright & Co', 'Studio Nine'].map((brand) => (
                <span key={brand} className="text-lg font-bold tracking-tight text-slate-300 dark:text-slate-700">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Everything included
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            One platform for the whole client lifecycle
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            From first enquiry to final invoice — every step has a home, and the AI copilot helps at each one.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <motion.div key={title} variants={fadeUp}>
              <Card hover className="h-full">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-soft">
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* -------------------------------------------------------- Testimonials */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Loved by agencies of every size
            </h2>
            <div className="mt-4 flex items-center justify-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={18} fill="currentColor" />
              ))}
              <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                4.9 / 5 from 240+ reviews
              </span>
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card hover className="flex h-full flex-col">
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    “{testimonial.quote}”
                  </p>
                  <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
                      {testimonial.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-xs text-slate-400">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Pricing */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Start free, upgrade when your agency grows. Cancel any time.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? 'border-brand-500 bg-white shadow-card dark:bg-slate-900'
                  : 'border-slate-200 bg-white shadow-soft hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900/70'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.tagline}</p>
              <p className="mt-6">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  ${plan.price}
                </span>
                <span className="text-sm text-slate-400"> /month</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                to="/register"
                variant={plan.highlight ? 'gradient' : 'secondary'}
                className="mt-7 w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- FAQ */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Frequently asked questions
          </h2>
          <div className="mt-12 space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  aria-expanded={openFaq === i}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{faq.q}</span>
                  <span className="text-xl font-light text-brand-500">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                  >
                    {faq.a}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Blog */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                From the blog
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Playbooks and product updates from the NexClient team.
              </p>
            </div>
            <Button to="/blog" variant="ghost" size="sm">
              All articles <ArrowRight size={15} />
            </Button>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.id}`} className="group">
                <Card hover className="flex h-full flex-col">
                  <div className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 transition-transform duration-500 group-hover:scale-[1.02] dark:from-brand-950 dark:to-slate-800">
                    <Sparkles className="text-brand-500/60" size={30} />
                  </div>
                  <p className="text-xs font-medium text-slate-400">{formatDate(post.published_at)}</p>
                  <h3 className="mt-2 font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {truncate(post.excerpt ?? post.content, 110)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                    Read more <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 px-8 py-16 text-center sm:px-16">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to run a calmer agency?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Join hundreds of freelancers and studios delivering better work with less admin overhead.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button to="/register" size="lg" className="bg-white text-brand-700 hover:bg-slate-100">
                Start your free trial <ArrowRight size={17} />
              </Button>
              <Button
                to="/contact"
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                Talk to sales
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
