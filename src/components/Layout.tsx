import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NavigationDock } from './NavigationDock';
import { CreatePostModal } from './CreatePostModal';
import { ProfileSetupModal } from './ProfileSetupModal';
import { usePosts } from '../context/PostContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const { createPost } = usePosts();
  const { showTextures } = useTheme();
  const location = useLocation();
  const messageCount = 3;

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handler = () => {
      if (!user) return navigate('/login');
      setIsModalOpen(true);
    };
    window.addEventListener('open-create', handler as EventListener);
    return () => window.removeEventListener('open-create', handler as EventListener);
  }, [user]);

  const handleOpenCreate = () => {
    if (!user) return navigate('/login');
    setIsModalOpen(true);
  };

  // Scroll tracking
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const handler = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    window.dispatchEvent(new CustomEvent('vibe-search', { detail: value }));
  };

  const handleCreatePost = async (content: string, hasCode: boolean, attachedImage?: string | null, codeLanguage?: string, code?: string) => {
    try {
      const payload = {
        content: hasCode ? content.split('Code:')[0].trim() : content,
        image_url: attachedImage || null,
        code_language: hasCode ? codeLanguage || 'javascript' : null,
        code_snippet: hasCode ? code || content.split('Code:')[1]?.trim() || '' : null,
      };
      await createPost(payload);
    } catch (err) {
      console.error('Failed to create post', err);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Feed';
    if (path.includes('explore')) return 'Explore';
    if (path.includes('notifications')) return 'Alerts';
    if (path.includes('ai-insights')) return 'AI Lab';
    if (path.includes('profile')) return 'Profile';
    return 'Vibe';
  };

  const headerOpacity = Math.min(scrollY / 100, 0.95);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-content font-sans selection:bg-neon/30">

      {/* === Ambient Background System === */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        {/* Static Orbs (Animations removed) */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.04]"
          style={{
            background: 'var(--color-neon)',
            top: '20%',
            right: '10%',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.03]"
          style={{
            background: 'var(--color-neon)',
            bottom: '15%',
            left: '5%',
          }}
        />
      </div>

      {/* Texture Spots */}
      {showTextures && (
        <>
          <div className="fixed top-16 right-8 w-72 h-44 z-10 texture-spot floating text-neon pointer-events-none" aria-hidden>
            <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
              <defs>
                <filter id="noise-spot-1">
                  <feTurbulence baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <radialGradient id="soft-1" cx="30%" cy="25%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#soft-1)" filter="url(#noise-spot-1)" />
            </svg>
          </div>

          <div className="fixed left-6 bottom-20 w-80 h-52 z-10 texture-spot floating text-neon-secondary pointer-events-none" aria-hidden>
            <svg viewBox="0 0 700 360" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
              <defs>
                <filter id="noise-spot-2">
                  <feTurbulence baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <radialGradient id="soft-2" cx="70%" cy="70%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#soft-2)" filter="url(#noise-spot-2)" />
            </svg>
          </div>
        </>
      )}

      {/* === HEADER - HUD Style === */}
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
        style={{
          backdropFilter: `blur(${Math.min(scrollY / 5, 20)}px)`,
        }}
      >
        {/* Top Edge Line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-neon/30 to-transparent" />

        <div
          className="px-4 md:px-6 transition-all duration-300"
          style={{
            backgroundColor: `rgba(var(--color-surface-rgb, 0,0,0), ${headerOpacity})`,
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between h-16">

              {/* Left: Brand + Status */}
              <div className="flex items-center gap-3">
                <a href="/" className="flex items-center gap-2 group shrink-0">
                  {/* Animated Logo Mark */}
                  <div className="relative w-9 h-9">
                    <div className="absolute inset-0 rounded-lg bg-neon/20 group-hover:bg-neon/30 transition-colors" />
                    <div className="absolute inset-[2px] rounded-[6px] bg-background flex items-center justify-center">
                      <span className="text-neon font-black text-lg leading-none group-hover:scale-110 transition-transform">
                        V
                      </span>
                    </div>
                  </div>

                  <div className="hidden xs:block">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-lg font-black tracking-tight text-content">
                        Vibe
                      </span>
                      <span className="text-neon text-lg font-black">.</span>
                    </div>
                  </div>
                </a>

                {/* Separator */}
                <div className="hidden md:block w-[1px] h-8 bg-line" />

                {/* Current Page Indicator */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon/5 border border-neon/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon" />
                    <span className="text-xs font-bold text-neon tracking-wide uppercase">
                      {getPageTitle()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Search */}
              <div className="hidden md:flex items-center flex-1 justify-center px-8 max-w-xl mx-auto">
                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-line bg-surface/50 hover:border-neon/20 hover:bg-surface transition-all group cursor-text"
                >
                  <svg className="w-4 h-4 text-content-muted group-hover:text-neon transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm text-content-muted flex-1 text-left">Search anything...</span>
                  <kbd className="hidden lg:flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-line text-[10px] text-content-muted font-mono">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Mobile Search */}
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="md:hidden p-2 rounded-xl hover:bg-neon/5 transition-all text-content-muted hover:text-neon"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Messages */}
                <button
                  className="relative p-2 rounded-xl hover:bg-neon/5 transition-all text-content-muted hover:text-neon shrink-0"
                  aria-label="Messages"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {messageCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-neon text-black text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-background">
                      {messageCount}
                    </span>
                  )}
                </button>

                {/* Avatar */}
                <a href={user ? `/profile/${user.handle.replace('@','')}` : '/login'} className="relative group shrink-0" aria-label="Profile">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden ring-2 ring-line lg:group-hover:ring-neon/40 transition-all">
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.handle || 'guest'}`}
                      alt={user?.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Edge Line */}
        <div
          className="h-[1px] transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to right, transparent, var(--color-neon), transparent)',
            opacity: Math.min(scrollY / 50, 0.3),
          }}
        />
      </header>

      {/* === Mobile Search Dropdown === */}
      {searchOpen && (
        <div className="fixed top-16 left-0 right-0 z-50 p-4 md:hidden">
          <div className="rounded-2xl border border-line bg-surface/95 backdrop-blur-xl p-4 shadow-2xl">
            <div className="flex items-center gap-3 bg-background rounded-xl border border-line px-4 py-3">
              <svg className="w-5 h-5 text-content-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search posts, people, hashtags..."
                className="bg-transparent outline-none w-full text-sm text-content placeholder:text-content-muted"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); handleSearch(''); }}
                className="text-content-muted hover:text-content"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Command Palette (⌘K) === */}
      {commandPaletteOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <div className="rounded-2xl border border-line bg-surface shadow-2xl shadow-neon/10 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
                <svg className="w-5 h-5 text-neon shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
                  placeholder="Type a command or search..."
                  className="bg-transparent outline-none w-full text-base text-content placeholder:text-content-muted"
                />
                <kbd className="px-2 py-0.5 rounded-md bg-line text-[10px] text-content-muted font-mono">ESC</kbd>
              </div>

              {/* Quick Actions */}
              <div className="p-3">
                <div className="text-[10px] text-content-muted uppercase tracking-wider font-bold px-3 py-2">
                  Quick Actions
                </div>
                {[
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    ),
                    label: 'Create New Post',
                    shortcut: 'N',
                    action: () => { setCommandPaletteOpen(false); setIsModalOpen(true); }
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    ),
                    label: 'Search Posts',
                    shortcut: 'S',
                    action: () => {}
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ),
                    label: 'Go to Profile',
                    shortcut: 'P',
                    action: () => { setCommandPaletteOpen(false); window.location.hash = '#/profile'; }
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ),
                    label: 'AI Insights Dashboard',
                    shortcut: 'A',
                    action: () => { setCommandPaletteOpen(false); }
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                    label: 'Settings',
                    shortcut: ',',
                    action: () => { setCommandPaletteOpen(false); }
                  },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-content hover:bg-neon/5 hover:text-neon transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center text-neon shrink-0 group-hover:bg-neon/20 transition-colors">
                      {item.icon}
                    </div>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-line text-[10px] text-content-muted font-mono">
                      {item.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-line flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-content-muted">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-line font-mono">↑↓</kbd> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-line font-mono">↵</kbd> Select
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-neon" />
                  <span className="text-[10px] text-content-muted font-mono">Vibe Command</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === Scroll Progress Indicator === */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px]">
        <div
          className="h-full bg-gradient-to-r from-neon via-neon to-neon/50 transition-all duration-150 ease-out shadow-[0_0_10px_var(--color-neon-glow)]"
          style={{
            width: `${Math.min(
              (scrollY / ((mainRef.current?.scrollHeight || 1) - (mainRef.current?.clientHeight || 1))) * 100,
              100
            )}%`,
          }}
        />
      </div>

      {/* === Main Content === */}
      <main
        ref={mainRef}
        className="relative h-screen overflow-y-auto pb-32 pt-20 px-4 scroll-smooth"
      >
        <Outlet />
      </main>

      {/* === Navigation Dock === */}
      <NavigationDock onOpenCreate={handleOpenCreate} />

      {/* === Create Post Modal === */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      <ProfileSetupModal />
    </div>
  );
}