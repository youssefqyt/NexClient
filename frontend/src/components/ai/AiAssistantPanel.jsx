import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Bot, Loader2, Send, Sparkles, Wand2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { setAiPanelOpen } from '../../store/slices/uiSlice';
import { aiService } from '../../services/aiService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getErrorMessage } from '../../utils/errors';

const QUICK_ACTIONS = [
  { key: 'chat', label: 'Ask the assistant', icon: Bot, placeholder: 'How do I chase an overdue invoice politely?' },
  { key: 'taskBreakdown', label: 'Break down a goal', icon: Wand2, placeholder: 'Ship the client portal by next month' },
  { key: 'draftMessage', label: 'Draft a client message', icon: Send, placeholder: 'Explain a two-week delay on the project' },
];

/**
 * Slide-over AI assistant. Works even without an API key — the backend returns
 * an offline-mode response so the UI never breaks.
 */
export default function AiAssistantPanel() {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.ui.aiPanelOpen);
  const [mode, setMode] = useState('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerInfo, setProviderInfo] = useState({ enabled: false, provider: 'groq', model: '' });
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I’m your NexClient assistant. Ask me about your projects, invoices, how to pay, or project tasks.',
    },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    aiService
      .status()
      .then(({ data }) => {
        setProviderInfo({
          enabled: Boolean(data.enabled),
          provider: data.provider || 'groq',
          model: data.model || '',
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const active = QUICK_ACTIONS.find((a) => a.key === mode) ?? QUICK_ACTIONS[0];

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      let result;
      if (mode === 'taskBreakdown') {
        ({ data: result } = await aiService.taskBreakdown(text));
      } else if (mode === 'draftMessage') {
        ({ data: result } = await aiService.draftMessage(text, 'professional'));
      } else {
        const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
        ({ data: result } = await aiService.chat(text, history));
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: result.result }]);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not process that request. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setAiPanelOpen(false))}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            aria-label="AI assistant"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white">
                  <Sparkles size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Assistant</p>
                  <p className="text-[11px] text-slate-400">
                    {providerInfo.enabled
                      ? `Connected to ${providerInfo.provider === 'groq' ? 'Groq' : providerInfo.provider}${providerInfo.model ? ` (${providerInfo.model.split('/').pop()})` : ''}`
                      : 'Workspace Data Mode (Active)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dispatch(setAiPanelOpen(false))}
                aria-label="Close assistant"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => setMode(action.key)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === action.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <action.icon size={13} />
                  {action.label}
                </button>
              ))}
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 size={15} className="animate-spin" /> Thinking…
                </div>
              )}
            </div>

            <form
              onSubmit={send}
              className="flex items-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={active.placeholder}
                containerClassName="flex-1"
                aria-label="Message the AI assistant"
              />
              <Button type="submit" size="icon" loading={loading} aria-label="Send message">
                {!loading && <Send size={17} />}
              </Button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
