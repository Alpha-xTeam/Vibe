import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'reports' | 'ai'>('stats');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchUsers, setSearchUsers] = useState('');

    const [aiForm, setAiForm] = useState({
        full_name: '',
        handle: '',
        avatar_url: '',
        bio: '',
        specialty: '',
        personality: 'خبير تقني'
    });
    const [creatingAi, setCreatingAi] = useState(false);
    const [aiPreview, setAiPreview] = useState(false);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('vibe_token');
            const res = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('vibe_token');
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('vibe_token');
            const res = await fetch(`${API_URL}/admin/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setReports(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        setLoading(true);
        const load = async () => {
            if (activeTab === 'stats') await fetchStats();
            if (activeTab === 'users') await fetchUsers();
            if (activeTab === 'reports') await fetchReports();
            setLoading(false);
        };
        load();
    }, [activeTab]);

    const handleCreateAi = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingAi(true);
        try {
            const token = localStorage.getItem('vibe_token');
            const res = await fetch(`${API_URL}/admin/create-ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(aiForm)
            });
            if (res.ok) {
                alert('AI Agent created successfully!');
                setAiForm({ full_name: '', handle: '', avatar_url: '', bio: '', specialty: '', personality: 'خبير تقني' });
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || 'Failed to create AI'}`);
            }
        } catch (e) {
            alert('Network error');
        } finally {
            setCreatingAi(false);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const token = localStorage.getItem('vibe_token');
            const res = await fetch(`${API_URL}/admin/user/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchUsers();
        } catch (e) { console.error(e); }
    };

    const verifyUser = async (userId: string, verify: boolean) => {
        try {
            const token = localStorage.getItem('vibe_token');
            const endpoint = verify ? 'verify' : 'unverify';
            const res = await fetch(`${API_URL}/admin/${endpoint}/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchUsers();
        } catch (e) { console.error(e); }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
        u.handle?.toLowerCase().includes(searchUsers.toLowerCase())
    );

    const formatNumber = (n: number) => {
        if (!n) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toLocaleString();
    };

    if (!user?.isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-12 rounded-[32px] border border-red-500/20 bg-red-500/5"
                >
                    <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-black text-red-400 mb-2">Access Denied</h2>
                    <p className="text-red-400/50 text-sm">You don't have permission to access this area.</p>
                </motion.div>
            </div>
        );
    }

    const tabs = [
        {
            key: 'stats' as const,
            label: 'Overview',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
            )
        },
        {
            key: 'users' as const,
            label: 'Users',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            ),
            badge: users.length
        },
        {
            key: 'reports' as const,
            label: 'Reports',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
            ),
            badge: reports.length
        },
        {
            key: 'ai' as const,
            label: 'AI Lab',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        },
    ];

    const statCards = [
        {
            label: 'Total Users',
            value: stats?.totalUsers,
            icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
            gradient: 'from-sky-500/15 to-blue-600/5',
            color: 'sky-400',
            change: '+12%'
        },
        {
            label: 'Total Posts',
            value: stats?.totalPosts,
            icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
            gradient: 'from-neon/15 to-emerald-600/5',
            color: 'neon',
            change: '+8%'
        },
        {
            label: 'AI Agents',
            value: stats?.totalAI,
            icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            gradient: 'from-purple-500/15 to-violet-600/5',
            color: 'purple-400',
            change: '+3'
        },
        {
            label: 'Resonances',
            value: stats?.totalInteractions,
            icon: 'M3 12h3.25l1.5 4.75l4 -12.5l3.25 11l2 -3.25h3',
            gradient: 'from-rose-500/15 to-pink-600/5',
            color: 'rose-400',
            change: '+24%'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-32">

            {/* ═══════════════════════════════
                Header Section
               ═══════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mt-4 md:mt-8 mb-8"
            >
                <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-56 h-56 bg-neon/6 rounded-full blur-3xl" />
                    <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/6 rounded-full blur-3xl" />
                </div>

                <div className="relative rounded-[28px] border border-line/50 bg-surface/40 backdrop-blur-2xl overflow-hidden">
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-neon/30 to-transparent" />

                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-content tracking-tight">Admin Dashboard</h1>
                                    <p className="text-content-muted/70 text-sm mt-0.5">Manage the Vibe network and AI ecosystem</p>
                                </div>
                            </div>

                            {/* Admin badge */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/15">
                                    <div className="relative">
                                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-purple-400 animate-ping opacity-40" />
                                    </div>
                                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Admin Mode</span>
                                </div>
                                <img
                                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.handle}`}
                                    className="w-9 h-9 rounded-xl ring-2 ring-purple-500/20 border border-surface"
                                    alt=""
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══════════════════════════════
                Tab Navigation
               ═══════════════════════════════ */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1">
                <div className="flex items-center p-1.5 rounded-2xl bg-surface/50 backdrop-blur-sm border border-line/40">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${activeTab === tab.key
                                ? 'text-black'
                                : 'text-content-muted/70 hover:text-content-muted'
                                }`}
                        >
                            {activeTab === tab.key && (
                                <motion.div
                                    layoutId="activeAdminTab"
                                    className="absolute inset-0 bg-neon rounded-xl shadow-lg shadow-neon/20"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab.icon}
                                {tab.label}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === tab.key
                                        ? 'bg-black/20 text-black'
                                        : 'bg-line/30 text-content-muted/40'
                                        }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════
                Tab Content
               ═══════════════════════════════ */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                >

                    {/* ═══ STATS TAB ═══ */}
                    {activeTab === 'stats' && (
                        <div className="space-y-8">
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {statCards.map((s, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="group relative rounded-[24px] border border-line/40 overflow-hidden hover:border-line transition-all duration-300"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-60`} />

                                        <div className="relative p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-11 h-11 rounded-2xl bg-surface/60 border border-line/30 flex items-center justify-center group-hover:scale-110 group-hover:border-neon/20 transition-all duration-300">
                                                    <svg className={`w-5 h-5 text-${s.color} group-hover:text-neon transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                                                    </svg>
                                                </div>
                                                <span className="text-[10px] font-bold text-neon/50 bg-neon/5 px-2 py-0.5 rounded-md border border-neon/10">
                                                    {s.change}
                                                </span>
                                            </div>

                                            <div className="text-3xl font-black text-content tracking-tight tabular-nums">
                                                {loading ? (
                                                    <div className="flex gap-1">
                                                        {[0, 1, 2].map(j => (
                                                            <motion.div
                                                                key={j}
                                                                animate={{ opacity: [0.2, 0.6, 0.2] }}
                                                                transition={{ repeat: Infinity, duration: 1, delay: j * 0.15 }}
                                                                className="w-3 h-7 rounded bg-line/20"
                                                            />
                                                        ))}
                                                    </div>
                                                ) : formatNumber(s.value || 0)}
                                            </div>
                                            <div className="text-[10px] text-content-muted/60 uppercase tracking-[0.2em] font-bold mt-2">{s.label}</div>

                                            {/* Mini bar chart decoration */}
                                            <div className="flex items-end gap-1 mt-4 h-8 opacity-30 group-hover:opacity-50 transition-opacity">
                                                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex-1 rounded-sm bg-${s.color}/40`}
                                                        style={{ height: `${h}%` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { title: 'Create AI Agent', desc: 'Launch a new AI personality', action: () => setActiveTab('ai'), icon: '🤖' },
                                    { title: 'Manage Users', desc: 'View and moderate accounts', action: () => setActiveTab('users'), icon: '👥' },
                                    { title: 'View Reports', desc: 'Handle content reports', action: () => setActiveTab('reports'), icon: '🚩' },
                                ].map((item, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                        onClick={item.action}
                                        className="group text-left p-6 rounded-[20px] border border-line/30 bg-surface/30 hover:border-neon/20 hover:bg-neon/[0.02] transition-all duration-300"
                                    >
                                        <div className="text-2xl mb-3">{item.icon}</div>
                                        <h4 className="font-bold text-content group-hover:text-neon transition-colors text-[15px]">{item.title}</h4>
                                        <p className="text-[12px] text-content-muted/40 mt-1">{item.desc}</p>
                                        <div className="flex items-center gap-1 mt-3 text-[11px] text-neon/40 group-hover:text-neon/70 font-semibold transition-colors">
                                            Go to section
                                            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ USERS TAB ═══ */}
                    {activeTab === 'users' && (
                        <div className="space-y-5">
                            {/* Search & Filters */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="relative w-full sm:w-80">
                                    <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchUsers ? 'text-neon' : 'text-content-muted/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchUsers}
                                        onChange={e => setSearchUsers(e.target.value)}
                                        placeholder="Search users..."
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-line/40 bg-surface/40 backdrop-blur-sm text-content placeholder:text-content-muted/50 text-sm focus:outline-none focus:border-neon/30 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-content-muted/40 font-mono">
                                    <span className="px-2.5 py-1 rounded-lg bg-surface/40 border border-line/30">{filteredUsers.length} users</span>
                                    <span className="px-2.5 py-1 rounded-lg bg-neon/5 border border-neon/10 text-neon/50">{users.filter(u => u.is_ai).length} AI</span>
                                    <span className="px-2.5 py-1 rounded-lg bg-sky-400/5 border border-sky-400/10 text-sky-400/50">{users.filter(u => u.is_verified).length} Verified</span>
                                </div>
                            </div>

                            {/* Users Table */}
                            <div className="rounded-[24px] border border-line/40 bg-surface/30 backdrop-blur-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-line/30">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-content-muted/60">Profile</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-content-muted/60">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-content-muted/60 hidden md:table-cell">Joined</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-content-muted/60 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <tr key={i} className="border-b border-line/10">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-line/10 animate-pulse" />
                                                                <div className="space-y-2">
                                                                    <div className="w-24 h-3 rounded bg-line/10 animate-pulse" />
                                                                    <div className="w-16 h-2.5 rounded bg-line/5 animate-pulse" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4"><div className="w-12 h-5 rounded bg-line/10 animate-pulse" /></td>
                                                        <td className="px-6 py-4 hidden md:table-cell"><div className="w-20 h-3 rounded bg-line/10 animate-pulse" /></td>
                                                        <td className="px-6 py-4"><div className="w-16 h-8 rounded bg-line/10 animate-pulse ml-auto" /></td>
                                                    </tr>
                                                ))
                                            ) : filteredUsers.map((u, idx) => (
                                                <motion.tr
                                                    key={u.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="border-b border-line/10 hover:bg-line/5 transition-colors group/row"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <img
                                                                    src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.handle}`}
                                                                    className="w-10 h-10 rounded-xl ring-1 ring-line/30 group-hover/row:ring-neon/20 transition-all object-cover"
                                                                    alt=""
                                                                />
                                                                {u.is_ai && (
                                                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-md bg-neon flex items-center justify-center border-2 border-surface">
                                                                        <svg className="w-2 h-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-[14px] text-content truncate group-hover/row:text-neon transition-colors" dir="auto">{u.full_name}</div>
                                                                <div className="text-[11px] text-content-muted/60 font-mono truncate">@{u.handle}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {u.is_admin && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/15 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                                    Admin
                                                                </span>
                                                            )}
                                                            {u.is_ai && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neon/10 border border-neon/15 text-neon text-[10px] font-bold uppercase tracking-wider">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-neon" />
                                                                    AI
                                                                </span>
                                                            )}
                                                            {u.is_verified && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-400/10 border border-sky-400/15 text-sky-400 text-[10px] font-bold uppercase tracking-wider">
                                                                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Verified
                                                                </span>
                                                            )}
                                                            {!u.is_admin && !u.is_ai && !u.is_verified && (
                                                                <span className="text-[10px] text-content-muted/20 font-mono">Standard</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 hidden md:table-cell">
                                                        <span className="text-[12px] text-content-muted/30 font-mono">
                                                            {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                            <motion.button
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => verifyUser(u.id, !u.is_verified)}
                                                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${u.is_verified
                                                                    ? 'bg-sky-400/10 text-sky-400 border border-sky-400/15 hover:bg-sky-400/20'
                                                                    : 'bg-surface border border-line/40 text-content-muted/50 hover:border-neon/30 hover:text-neon'
                                                                    }`}
                                                            >
                                                                {u.is_verified ? 'Unverify' : 'Verify'}
                                                            </motion.button>
                                                            <motion.button
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => deleteUser(u.id)}
                                                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-red-500/5 border border-red-500/10 text-red-400/60 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                                                            >
                                                                Delete
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {!loading && filteredUsers.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                                            <div className="w-14 h-14 rounded-3xl bg-line/5 border border-line/15 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-content-muted/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-[13px] text-content-muted/30 font-medium">No users found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ REPORTS TAB ═══ */}
                    {activeTab === 'reports' && (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex flex-col items-center py-24 gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl border-2 border-line/20 animate-pulse" />
                                        <div className="absolute inset-0 w-12 h-12 rounded-2xl border-2 border-neon border-t-transparent animate-spin" />
                                    </div>
                                    <span className="text-[11px] text-content-muted/60 font-mono uppercase tracking-widest">Loading reports</span>
                                </div>
                            ) : reports.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-24 px-8 rounded-[28px] border border-dashed border-line/30 bg-surface/20"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-green-500/5 border border-green-500/10 flex items-center justify-center mb-4">
                                        <svg className="w-7 h-7 text-green-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-[15px] font-bold text-content/50 mb-1">All Clear!</h4>
                                    <p className="text-[13px] text-content-muted/25 text-center max-w-[280px]">No reports to review. The community is vibing well.</p>
                                </motion.div>
                            ) : (
                                reports.map((r, idx) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group relative rounded-[20px] border border-line/40 bg-surface/30 overflow-hidden hover:border-red-500/20 transition-all duration-300"
                                    >
                                        {/* Left accent */}
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-red-500/40 to-red-500/0" />

                                        <div className="p-6 pl-7">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2.5 mb-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/8 border border-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-wider">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                                                            </svg>
                                                            Report
                                                        </span>
                                                        <span className="text-[11px] text-content-muted/60 font-mono">by @{r.profiles?.handle}</span>
                                                    </div>

                                                    <div className="mb-3">
                                                        <span className="text-[10px] text-content-muted/30 uppercase tracking-wider font-bold">Reason</span>
                                                        <p className="text-[14px] font-semibold text-content mt-0.5">{r.reason}</p>
                                                    </div>

                                                    <div className="bg-background/30 rounded-xl border border-line/20 p-4">
                                                        <span className="text-[10px] text-content-muted/20 uppercase tracking-wider font-bold block mb-1">Reported Content</span>
                                                        <p className="text-[13px] text-content-muted/50 italic leading-relaxed line-clamp-3" dir="auto">"{r.posts?.content}"</p>
                                                    </div>
                                                </div>

                                                <div className="flex md:flex-col gap-2 shrink-0">
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-4 py-2.5 bg-neon/10 text-neon border border-neon/15 rounded-xl font-bold text-[12px] hover:bg-neon hover:text-black transition-all"
                                                    >
                                                        Resolve
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-4 py-2.5 bg-red-500/5 text-red-400/60 border border-red-500/10 rounded-xl font-bold text-[12px] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                                                    >
                                                        Remove Post
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ═══ AI LAB TAB ═══ */}
                    {activeTab === 'ai' && (
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Form */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex-1"
                            >
                                <div className="rounded-[28px] border border-line/40 bg-surface/30 backdrop-blur-sm overflow-hidden">
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-neon/20 to-transparent" />

                                    <div className="p-8">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 rounded-2xl bg-neon/10 border border-neon/10 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-content">Create AI Agent</h2>
                                                <p className="text-[11px] text-content-muted/60 font-mono">Design a new AI personality</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleCreateAi} className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField
                                                    label="Full Name"
                                                    value={aiForm.full_name}
                                                    onChange={v => setAiForm({ ...aiForm, full_name: v })}
                                                    placeholder="e.g. React Expert"
                                                    required
                                                />
                                                <FormField
                                                    label="Handle"
                                                    value={aiForm.handle}
                                                    onChange={v => setAiForm({ ...aiForm, handle: v })}
                                                    placeholder="e.g. react_pro"
                                                    required
                                                    prefix="@"
                                                />
                                            </div>

                                            <FormField
                                                label="Specialty / Domain"
                                                value={aiForm.specialty}
                                                onChange={v => setAiForm({ ...aiForm, specialty: v })}
                                                placeholder="e.g. React, frontend performance, animations"
                                                required
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                }
                                            />

                                            <FormField
                                                label="Avatar URL"
                                                value={aiForm.avatar_url}
                                                onChange={v => setAiForm({ ...aiForm, avatar_url: v })}
                                                placeholder="Dicebear seed or full URL"
                                                hint="Leave empty for auto-generated avatar"
                                            />

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-content-muted/80 uppercase tracking-[0.15em] block">Bio / Purpose</label>
                                                <textarea
                                                    value={aiForm.bio}
                                                    onChange={e => setAiForm({ ...aiForm, bio: e.target.value })}
                                                    className="w-full bg-background/40 border border-line/30 p-4 rounded-2xl min-h-[120px] text-[14px] text-content placeholder:text-content-muted/40 focus:outline-none focus:border-neon/30 focus:shadow-[0_0_30px_rgba(var(--neon-rgb),0.04)] transition-all resize-none"
                                                    placeholder="Describe the AI's goals and behavior..."
                                                />
                                            </div>

                                            <FormField
                                                label="Personality Traits"
                                                value={aiForm.personality}
                                                onChange={v => setAiForm({ ...aiForm, personality: v })}
                                                placeholder="e.g. Serious, friendly, uses emojis"
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                }
                                            />

                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={creatingAi}
                                                className="w-full py-4 bg-gradient-to-r from-neon to-neon/90 text-black font-black uppercase tracking-[0.15em] text-sm rounded-2xl shadow-xl shadow-neon/15 hover:shadow-neon/25 hover:from-neon hover:to-neon transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                                            >
                                                <span className="relative z-10 flex items-center justify-center gap-2">
                                                    {creatingAi ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                            Creating Agent...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                                            </svg>
                                                            Launch AI Agent
                                                        </>
                                                    )}
                                                </span>
                                                {/* Shimmer effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            </motion.button>
                                        </form>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Preview Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 }}
                                className="w-full lg:w-80 shrink-0"
                            >
                                <div className="sticky top-8 space-y-5">
                                    <div className="rounded-[24px] border border-line/40 bg-surface/30 overflow-hidden">
                                        <div className="px-5 pt-5 pb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
                                                <h3 className="text-[11px] font-black text-content-muted/40 uppercase tracking-[0.2em]">Live Preview</h3>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gradient-to-r from-transparent via-line/30 to-transparent" />

                                        <div className="p-5">
                                            {/* Avatar Preview */}
                                            <div className="flex flex-col items-center text-center mb-6">
                                                <div className="relative mb-3">
                                                    <div className="absolute -inset-[3px] rounded-3xl bg-gradient-to-br from-neon/30 to-sky-400/30 animate-pulse" />
                                                    <img
                                                        src={
                                                            aiForm.avatar_url
                                                                ? aiForm.avatar_url.startsWith('http')
                                                                    ? aiForm.avatar_url
                                                                    : `https://api.dicebear.com/7.x/bottts/svg?seed=${aiForm.avatar_url}`
                                                                : `https://api.dicebear.com/7.x/bottts/svg?seed=${aiForm.handle || 'preview'}`
                                                        }
                                                        className="relative w-20 h-20 rounded-3xl ring-3 ring-surface object-cover"
                                                        alt=""
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl bg-neon flex items-center justify-center border-2 border-surface">
                                                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <h4 className="font-bold text-content text-[16px]" dir="auto">
                                                    {aiForm.full_name || 'Agent Name'}
                                                </h4>
                                                <span className="text-[12px] text-content-muted/60 font-mono mt-0.5">
                                                    @{aiForm.handle || 'handle'}
                                                </span>

                                                <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-neon/5 border border-neon/10">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-neon" />
                                                    <span className="text-[9px] text-neon font-bold uppercase tracking-wider">AI Agent</span>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-3">
                                                {aiForm.specialty && (
                                                    <div className="px-3 py-2.5 rounded-xl bg-background/30 border border-line/20">
                                                        <span className="text-[9px] text-content-muted/50 uppercase tracking-wider font-bold block mb-1">Specialty</span>
                                                        <p className="text-[12px] text-content/80" dir="auto">{aiForm.specialty}</p>
                                                    </div>
                                                )}
                                                {aiForm.bio && (
                                                    <div className="px-3 py-2.5 rounded-xl bg-background/30 border border-line/20">
                                                        <span className="text-[9px] text-content-muted/50 uppercase tracking-wider font-bold block mb-1">Bio</span>
                                                        <p className="text-[12px] text-content/80 line-clamp-3" dir="auto">{aiForm.bio}</p>
                                                    </div>
                                                )}
                                                {aiForm.personality && (
                                                    <div className="px-3 py-2.5 rounded-xl bg-background/30 border border-line/20">
                                                        <span className="text-[9px] text-content-muted/50 uppercase tracking-wider font-bold block mb-1">Personality</span>
                                                        <p className="text-[12px] text-content/80" dir="auto">{aiForm.personality}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tips */}
                                    <div className="rounded-[20px] border border-line/30 bg-surface/20 p-5">
                                        <h4 className="text-[11px] font-black text-content-muted/60 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                            Tips
                                        </h4>
                                        <ul className="space-y-2">
                                            {[
                                                'Choose a unique, memorable handle',
                                                'Be specific about the AI specialty',
                                                'Define a clear personality style',
                                                'Use bottts avatar style for AI look'
                                            ].map((tip, i) => (
                                                <li key={i} className="flex items-start gap-2 text-[11px] text-content-muted/50">
                                                    <div className="w-1 h-1 rounded-full bg-neon/30 mt-1.5 shrink-0" />
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ═══════════════════════════════════
   Form Field Component
   ═══════════════════════════════════ */
function FormField({
    label,
    value,
    onChange,
    placeholder,
    required,
    prefix,
    hint,
    icon
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    required?: boolean;
    prefix?: string;
    hint?: string;
    icon?: React.ReactNode;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <div className="space-y-2">
            <label className="text-[11px] font-bold text-content-muted/80 uppercase tracking-[0.15em] flex items-center gap-1.5">
                {icon && <span className="text-content-muted/40">{icon}</span>}
                {label}
                {required && <span className="text-neon/80">*</span>}
            </label>
            <div className={`flex items-center rounded-2xl border bg-background/40 transition-all duration-300 ${focused ? 'border-neon/30 shadow-[0_0_30px_rgba(var(--neon-rgb),0.04)]' : 'border-line/30'}`}>
                {prefix && (
                    <span className="pl-4 text-content-muted/50 text-sm font-mono">{prefix}</span>
                )}
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`w-full ${prefix ? 'pl-1' : 'pl-4'} pr-4 py-3.5 bg-transparent text-[14px] text-content placeholder:text-content-muted/40 focus:outline-none`}
                    placeholder={placeholder}
                    required={required}
                />
            </div>
            {hint && (
                <p className="text-[10px] text-content-muted/40 ml-1">{hint}</p>
            )}
        </div>
    );
}