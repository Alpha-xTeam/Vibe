import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/* ═══════════════════════════════════
   Code Block — GitHub-inspired
   ═══════════════════════════════════ */
const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0d1117] shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] ml-2">{language || 'code'}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-white/40 hover:text-neon hover:bg-white/[0.05] transition-all duration-200"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              تم النسخ!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
              نسخ
            </>
          )}
        </motion.button>
      </div>
      {/* Code */}
      <div className="relative">
        <pre className="p-5 overflow-x-auto text-[13px] leading-[1.7] font-mono" style={{ tabSize: 2 }}>
          <code className="text-[#c9d1d9] block whitespace-pre">{code}</code>
        </pre>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════
   Formatted Message Parser
   ═══════════════════════════════════ */
const FormattedMessage = ({ content }: { content: string }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5">
      {parts.map((part, i) => {
        // Code blocks
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match?.[1] || '';
          const code = match?.[2]?.trim() || '';
          return <CodeBlock key={i} code={code} language={lang} />;
        }

        // Inline code: `code`
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={i} className="whitespace-pre-wrap">
            {inlineParts.map((t, j) => {
              if (t.startsWith('`') && t.endsWith('`')) {
                return (
                  <code key={j} className="px-1.5 py-0.5 rounded-md bg-neon/10 text-neon text-[13px] font-mono border border-neon/10">
                    {t.slice(1, -1)}
                  </code>
                );
              }
              // Bold: **text**
              const boldParts = t.split(/(\*\*.*?\*\*)/g);
              return boldParts.map((b, k) => {
                if (b.startsWith('**') && b.endsWith('**')) {
                  return <strong key={`${j}-${k}`} className="font-bold text-content">{b.slice(2, -2)}</strong>;
                }
                return <span key={`${j}-${k}`}>{b}</span>;
              });
            })}
          </span>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════
   Quick Suggestions
   ═══════════════════════════════════ */
const suggestions = [
  { icon: '💻', text: 'اكتب لي كود React' },
  { icon: '🎨', text: 'صمم لي واجهة حديثة' },
  { icon: '🔧', text: 'ساعدني في حل مشكلة برمجية' },
  { icon: '💡', text: 'أعطني أفكار مشاريع' },
];

/* ═══════════════════════════════════
   Main Explore Component
   ═══════════════════════════════════ */
export function Explore() {
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isEmptyChat = messages.length === 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    if (!import.meta.env.VITE_GROQ_API_KEY) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'عذراً، خدمة الذكاء الاصطناعي غير متوفرة حالياً (API Key missing).',
        timestamp: new Date()
      }]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'moonshotai/kimi-k2-instruct-0905',
          messages: [
            {
              role: 'system',
              content: 'أنت Vibe AI، المساعد الذكي الرسمي لمنصة Vibe. أجب على أسئلة المستخدم بأسلوب ذكي، مرتب، ودقيق جداً. استخدم اللغة العربية الفصحى البسيطة والمهذبة. عند كتابة الأكواد البرمجية، استخدم دائماً code blocks مع تحديد اللغة.'
            },
            ...messages.map(msg => ({
              role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
              content: msg.content
            })),
            { role: 'user' as const, content: text }
          ],
          temperature: 0.6,
          max_completion_tokens: 4096,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Groq API Error:', errorData);
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      const assistantResponse = data.choices[0].message.content;

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-3xl mx-auto px-4 relative">

      {/* ═══ Empty State ═══ */}
      <AnimatePresence>
        {isEmptyChat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 pb-20"
          >
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
              className="relative"
            >
              <div className="absolute -inset-8 rounded-full bg-neon/[0.04] blur-3xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-neon/20 via-neon/5 to-transparent border border-neon/10 flex items-center justify-center shadow-[0_0_40px_rgba(var(--neon-rgb,100,200,100),0.08)]">
                <svg className="w-10 h-10 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.454L18 2.25l.259 1.035a3.375 3.375 0 002.454 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl font-black text-content tracking-tight">
                مرحباً{user?.name ? ` ${user.name}` : ''}
              </h1>
              <p className="text-sm text-content-muted max-w-xs mx-auto leading-relaxed">
                كيف يمكنني مساعدتك اليوم؟ اسألني أي شيء عن البرمجة، التصميم، أو أي موضوع آخر.
              </p>
            </motion.div>

            {/* Suggestion Cards */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="grid grid-cols-2 gap-3 w-full max-w-sm"
            >
              {suggestions.map((s, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendMessage(s.text)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-surface/60 border border-line/50 hover:border-neon/20 hover:bg-surface transition-all duration-300 text-right group"
                >
                  <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{s.icon}</span>
                  <span className="text-[13px] text-content-muted group-hover:text-content transition-colors leading-snug">{s.text}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Messages ═══ */}
      {!isEmptyChat && (
        <>
          {/* Mini header */}
          <div className="flex items-center gap-3 py-4 border-b border-line/30 mb-4">
            <div className="w-9 h-9 rounded-xl bg-neon/10 border border-neon/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-content">Vibe AI</h2>
              <p className="text-[10px] text-neon/60 font-medium">متصل الآن</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMessages([])}
              className="p-2 rounded-xl text-content-muted hover:text-content hover:bg-surface transition-all"
              title="محادثة جديدة"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </motion.button>
          </div>

          {/* Chat area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-5 pb-4 pr-1"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className="shrink-0 mt-1">
                    {msg.role === 'assistant' ? (
                      <div className="w-8 h-8 rounded-xl bg-neon/10 border border-neon/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-content/5 border border-line/50 flex items-center justify-center overflow-hidden">
                        {user?.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-xs font-bold text-content-muted">{user?.name?.[0] || '?'}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] min-w-0 px-4 py-3 rounded-2xl ${msg.role === 'user'
                      ? 'bg-surface/80 border border-line/40 rounded-tl-md'
                      : 'bg-white/[0.02] border border-white/[0.06] rounded-tr-md'
                      }`}
                    dir="auto"
                  >
                    <div className={`text-[14.5px] leading-[1.8] ${msg.role === 'assistant' ? 'text-content/90' : 'text-content/80'}`}>
                      <FormattedMessage content={msg.content} />
                    </div>
                    <div className="text-[10px] mt-2 opacity-20 font-mono select-none">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 flex-row-reverse"
                >
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-xl bg-neon/10 border border-neon/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-neon animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] px-5 py-3.5 rounded-2xl rounded-tr-md flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-neon/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-neon/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[11px] text-content-muted/50 ml-2">يفكر...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ═══ Input ═══ */}
      <div className="relative mt-auto pt-3 pb-2">
        <div className="absolute -inset-2 bg-gradient-to-r from-neon/10 via-transparent to-neon/5 blur-2xl opacity-30 pointer-events-none" />
        <div className="relative bg-surface/70 backdrop-blur-2xl border border-line/50 rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)] focus-within:border-neon/20 transition-all duration-300">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اسألني أي شيء..."
            rows={1}
            className="w-full bg-transparent px-5 pt-4 pb-2 text-[15px] focus:outline-none placeholder:text-content-muted/25 resize-none max-h-40 leading-relaxed"
            dir="auto"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <span className="text-[10px] text-content-muted/25 px-2 select-none">Shift + Enter للسطر الجديد</span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-neon text-black flex items-center justify-center disabled:opacity-20 disabled:hover:scale-100 transition-all duration-200 shadow-[0_2px_12px_rgba(var(--neon-rgb,100,200,100),0.25)]"
            >
              <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}