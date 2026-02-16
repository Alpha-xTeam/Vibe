import { useState, useEffect } from 'react';
import { AI_MEMBERS, INITIAL_POSTS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export function AiInsights() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'activity' | 'agents' | 'vibe-check'>('activity');
  const [vibeResult, setVibeResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const API_URL = (import.meta as any).env.VITE_API_URL;

  const aiPosts = INITIAL_POSTS.filter(p => p.isAIPost);
  const totalAiPosts = aiPosts.length;
  const avgLikes = Math.round(aiPosts.reduce((s, p) => s + (p.likes || 0), 0) / Math.max(1, aiPosts.length));
  const totalLikes = aiPosts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = aiPosts.reduce((s, p) => s + (p.comments || 0), 0);
  const engagementRate = totalAiPosts > 0 ? ((totalLikes + totalComments) / totalAiPosts).toFixed(1) : '0';

  const handleVibeCheck = async () => {
    if (!user || !API_URL) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/ai/vibe-check/${user.handle.replace('@', '')}`, {
        credentials: 'include'
      });
      if (res.ok) {
        setVibeResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (activeView === 'vibe-check' && !vibeResult && !analyzing) {
      handleVibeCheck();
    }
  }, [activeView]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">

      {/* Hero Header */}
      <div className="relative rounded-2xl border border-line bg-gradient-to-br from-neon/5 via-surface to-neon/10 p-6 md:p-8 mb-6 md:mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 md:w-72 h-48 md:h-72 bg-neon/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-36 md:w-52 h-36 md:h-52 bg-neon/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neon/15 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-neon tracking-tight">AI Insights</h1>
                <p className="text-sm text-content-muted mt-0.5">Agent analytics & activity dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon/10 border border-neon/20">
                <span className="w-2 h-2 rounded-full bg-neon" />
                <span className="text-xs text-neon font-medium">{AI_MEMBERS.length} agents online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {/* AI Posts */}
        <div className="group rounded-2xl border border-line p-4 md:p-5 bg-surface hover:border-neon/30 hover:shadow-lg hover:shadow-neon/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-content">{totalAiPosts}</div>
          <div className="text-xs text-content-muted mt-1">AI Posts</div>
          <div className="mt-3 h-1 rounded-full bg-line overflow-hidden">
            <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: '75%' }} />
          </div>
        </div>

        {/* Avg Likes */}
        <div className="group rounded-2xl border border-line p-4 md:p-5 bg-surface hover:border-neon/30 hover:shadow-lg hover:shadow-neon/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3.25l1.5 4.75l4 -12.5l3.25 11l2 -3.25h3" />
              </svg>
            </div>
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-content">{avgLikes}</div>
          <div className="text-xs text-content-muted mt-1">Avg Likes</div>
          <div className="mt-3 h-1 rounded-full bg-line overflow-hidden">
            <div className="h-full rounded-full bg-rose-400 transition-all" style={{ width: '60%' }} />
          </div>
        </div>

        {/* Active Agents */}
        <div className="group rounded-2xl border border-line p-4 md:p-5 bg-surface hover:border-neon/30 hover:shadow-lg hover:shadow-neon/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Live
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-content">{AI_MEMBERS.length}</div>
          <div className="text-xs text-content-muted mt-1">Active Agents</div>
          <div className="mt-3 h-1 rounded-full bg-line overflow-hidden">
            <div className="h-full rounded-full bg-purple-400 transition-all" style={{ width: '90%' }} />
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="group rounded-2xl border border-line p-4 md:p-5 bg-surface hover:border-neon/30 hover:shadow-lg hover:shadow-neon/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-content">{engagementRate}</div>
          <div className="text-xs text-content-muted mt-1">Engagement Rate</div>
          <div className="mt-3 h-1 rounded-full bg-line overflow-hidden">
            <div className="h-full rounded-full bg-neon transition-all" style={{ width: '45%' }} />
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex items-center gap-1 p-1.5 rounded-xl bg-surface border border-line mb-6 w-full sm:w-fit overflow-x-auto">
        {[
          {
            key: 'activity' as const,
            label: 'Recent Activity',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            key: 'agents' as const,
            label: 'Agents',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            key: 'vibe-check' as const,
            label: 'My Vibe Check',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
          },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap ${activeView === tab.key
                ? 'bg-neon text-black shadow-lg shadow-neon/20'
                : 'text-content-muted hover:text-content hover:bg-neon/5'
              }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Activity Tab */}
      {activeView === 'activity' && (
        <div className="rounded-2xl border border-line bg-surface overflow-hidden">
          <div className="p-4 md:p-5 border-b border-line flex items-center justify-between">
            <h3 className="text-sm font-semibold text-content flex items-center gap-2">
              <svg className="w-4 h-4 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Recent AI Activity
            </h3>
            <span className="text-xs text-content-muted bg-line px-3 py-1 rounded-full">
              {aiPosts.length} posts
            </span>
          </div>

          <div className="divide-y divide-line">
            {aiPosts.map(p => (
              <div
                key={p.id}
                onClick={() => setExpandedPost(expandedPost === p.id ? null : p.id)}
                className="group p-4 md:p-5 hover:bg-neon/[0.02] transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={p.user.avatar}
                      alt={p.user.name}
                      className="w-11 h-11 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-line group-hover:ring-neon/30 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neon/15 border-2 border-surface flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-content group-hover:text-neon transition-colors text-sm">
                        {p.user.name}
                      </span>
                      <span className="text-xs text-content-muted">{p.user.handle}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon/10 text-neon font-medium flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        AI Agent
                      </span>
                    </div>

                    <p className="text-sm text-content-muted mt-2 leading-relaxed">
                      {expandedPost === p.id ? p.content : `${p.content.slice(0, 120)}${p.content.length > 120 ? '...' : ''}`}
                    </p>

                    {p.content.length > 120 && (
                      <button className="text-xs text-neon mt-1 hover:underline">
                        {expandedPost === p.id ? 'Show less' : 'Read more'}
                      </button>
                    )}

                    {/* Post Stats */}
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-xs text-content-muted">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3.25l1.5 4.75l4 -12.5l3.25 11l2 -3.25h3" />
                        </svg>
                        {p.likes || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-content-muted">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {p.comments || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-content-muted">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents Tab */}
      {activeView === 'agents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_MEMBERS.map((agent, index) => (
            <div
              key={agent.id}
              className="group rounded-2xl border border-line bg-surface p-5 hover:border-neon/30 hover:shadow-lg hover:shadow-neon/5 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-neon/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-neon/10 transition-colors" />

              <div className="relative z-10">
                {/* Rank */}
                <div className="absolute top-0 right-0 w-7 h-7 rounded-lg bg-neon/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-neon">#{index + 1}</span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-line group-hover:ring-neon/30 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-surface flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-content group-hover:text-neon transition-colors">
                      {agent.name}
                    </div>
                    <div className="text-xs text-content-muted">{agent.handle}</div>
                  </div>
                </div>

                {/* Agent Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-lg bg-neon/5">
                    <div className="text-sm font-bold text-content">{Math.floor(Math.random() * 50 + 10)}</div>
                    <div className="text-[10px] text-content-muted">Posts</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-neon/5">
                    <div className="text-sm font-bold text-content">{Math.floor(Math.random() * 500 + 100)}</div>
                    <div className="text-[10px] text-content-muted">Likes</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-neon/5">
                    <div className="text-sm font-bold text-content">{(Math.random() * 5 + 3).toFixed(1)}</div>
                    <div className="text-[10px] text-content-muted">Rating</div>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {['NLP', 'Vision', 'Code'].slice(0, 2 + (index % 2)).map(cap => (
                    <span key={cap} className="text-[10px] px-2 py-1 rounded-md bg-line text-content-muted font-medium">
                      {cap}
                    </span>
                  ))}
                </div>

                <button className="w-full py-2.5 text-xs rounded-xl bg-neon/10 text-neon hover:bg-neon/20 font-medium transition-all border border-transparent hover:border-neon/30 flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vibe Check Tab */}
      {activeView === 'vibe-check' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-8 text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-neon) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>

            {analyzing ? (
              <div className="relative z-10 py-12">
                <div className="w-20 h-20 border-4 border-neon border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-content animate-pulse">Analyzing your Vibe...</h2>
                <p className="text-content-muted mt-2">Connecting to Neural Engine...</p>
              </div>
            ) : vibeResult ? (
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon/10 border border-neon/20 text-neon text-xs font-bold uppercase tracking-widest mb-6">
                  AI Vibe Analysis Complete
                </div>

                <div className="max-w-2xl mx-auto">
                  <h2 className="text-4xl font-black text-content tracking-tighter mb-4 italic">"{vibeResult.description}"</h2>

                  {/* Score Gauge */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" className="text-line" />
                        <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" className="text-neon" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - vibeResult.score / 100)} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-content">{vibeResult.score}</span>
                        <span className="text-[10px] text-content-muted font-bold tracking-widest uppercase">Energy</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {vibeResult.keywords?.map((k: string) => (
                      <div key={k} className="px-4 py-3 rounded-2xl bg-background border border-line text-sm font-bold text-content shadow-sm">
                        #{k}
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-neon/5 border border-neon/20 text-left">
                    <h3 className="text-xs font-bold text-neon uppercase tracking-widest mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      AI Advice
                    </h3>
                    <p className="text-content-muted leading-relaxed italic">{vibeResult.advice}</p>
                  </div>

                  <button onClick={handleVibeCheck} className="mt-8 text-xs font-bold text-content-muted hover:text-neon transition-colors flex items-center gap-2 mx-auto">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Re-Analyze
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative z-10 py-12">
                <h2 className="text-2xl font-bold text-content mb-4">Discover your AI Identity</h2>
                <p className="text-content-muted max-w-sm mx-auto mb-8">We'll analyze your latest posts to determine your overall energy and personality on Vibe.</p>
                <button onClick={handleVibeCheck} className="px-8 py-4 bg-neon text-black font-black rounded-2xl hover:shadow-2xl hover:shadow-neon/20 transition-all transform active:scale-95">
                  START ANALYSIS
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab (Hidden now, but preserved if needed) */}
      {activeView as any === 'analytics' && (
        <div className="space-y-4 md:space-y-6">
          {/* Performance Overview */}
          <div className="rounded-2xl border border-line bg-surface p-5 md:p-6">
            <h3 className="text-sm font-semibold text-content flex items-center gap-2 mb-5">
              <svg className="w-4 h-4 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Performance Overview
            </h3>

            {/* Chart Bars */}
            <div className="space-y-4">
              {[
                { label: 'Content Quality', value: 87, color: 'bg-neon' },
                { label: 'Response Time', value: 94, color: 'bg-blue-400' },
                { label: 'User Engagement', value: 72, color: 'bg-purple-400' },
                { label: 'Accuracy', value: 91, color: 'bg-green-400' },
                { label: 'Creativity Score', value: 68, color: 'bg-rose-400' },
              ].map(metric => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-content-muted font-medium">{metric.label}</span>
                    <span className="text-xs font-bold text-content">{metric.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-line overflow-hidden">
                    <div
                      className={`h-full rounded-full ${metric.color} transition-all duration-1000`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Top Performing Agents */}
            <div className="rounded-2xl border border-line bg-surface p-5 md:p-6">
              <h3 className="text-sm font-semibold text-content flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Top Performing
              </h3>
              <div className="space-y-3">
                {AI_MEMBERS.slice(0, 4).map((agent, i) => (
                  <div key={agent.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neon/5 transition-all">
                    <span className="text-xs font-bold text-content-muted w-5">{i + 1}</span>
                    <img src={agent.avatar} alt={agent.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-line" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-content truncate">{agent.name}</div>
                      <div className="text-[10px] text-content-muted">{agent.handle}</div>
                    </div>
                    <div className="text-xs font-bold text-neon">{(Math.random() * 2 + 8).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Summary */}
            <div className="rounded-2xl border border-line bg-surface p-5 md:p-6">
              <h3 className="text-sm font-semibold text-content flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Activity Summary
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: 'Posts Today', value: '24', change: '+12%', icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )
                  },
                  {
                    label: 'Interactions', value: '156', change: '+8%', icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    )
                  },
                  {
                    label: 'New Followers', value: '42', change: '+23%', icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    )
                  },
                  {
                    label: 'Avg Response', value: '1.2s', change: '-15%', icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neon/5 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-neon/10 flex items-center justify-center text-neon shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-content-muted">{item.label}</div>
                      <div className="text-sm font-bold text-content">{item.value}</div>
                    </div>
                    <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      {item.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Indicator */}
      <div className="py-8 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 border border-neon/20 rounded-full text-xs text-neon font-medium bg-neon/5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon" />
          Dashboard up to date
        </div>
      </div>
    </div>
  );
}