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
  const [scrollY, setScrollY] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const { createPost } = usePosts();
  const { theme, toggleTheme, showTextures } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isExplorePage = location.pathname.includes('explore');

  useEffect(() => {
    const handler = () => {
      if (!user) return navigate('/login');
      setIsModalOpen(true);
    };
    window.addEventListener('open-create', handler as EventListener);
    return () => window.removeEventListener('open-create', handler as EventListener);
  }, [user, navigate]);

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
    if (path.includes('explore')) return 'AI Chat';
    if (path.includes('notifications')) return 'Alerts';
    if (path.includes('profile')) return 'Profile';
    return 'Vibe';
  };

  const headerOpacity = Math.min(scrollY / 100, 0.95);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-content font-sans selection:bg-neon/30">

      {/* === Ambient Background System === */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.01]"
          style={{
            background: 'var(--color-content)',
            top: '15%',
            right: '5%',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.008]"
          style={{
            background: 'var(--color-content)',
            bottom: '10%',
            left: '2%',
          }}
        />
      </div>

      {/* Texture Spots */}
      {showTextures && (
        <>
          <div className="fixed top-16 right-8 w-72 h-44 z-10 texture-spot floating text-content/10 pointer-events-none" aria-hidden>
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

          <div className="fixed left-6 bottom-20 w-80 h-52 z-10 texture-spot floating text-content/10 pointer-events-none" aria-hidden>
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

      {/* Top Navigation - Hidden on mobile if on Explore page */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isExplorePage ? 'max-md:hidden' : ''
          } ${scrollY > 20 ? 'h-14 bg-background/80 backdrop-blur-xl border-b border-line shadow-sm' : 'h-16 bg-transparent'
          }`}
      >
        <div className="h-[1px] bg-gradient-to-r from-transparent via-neon/30 to-transparent" />

        <div
          className="px-4 md:px-6 transition-all duration-300 h-full flex items-center"
          style={{
            backgroundColor: `rgba(var(--color-surface-rgb, 0,0,0), ${headerOpacity})`,
          }}
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">

              {/* Left: Brand */}
              <div className="flex items-center gap-3">
                <a href="/" className="flex items-center gap-2 group shrink-0">
                  <div className="relative w-9 h-9">
                    <div className="absolute inset-0 rounded-lg bg-content/5 group-hover:bg-content/10 transition-colors" />
                    <div className="absolute inset-[2px] rounded-[6px] bg-background flex items-center justify-center">
                      <span className="text-content font-black text-lg leading-none group-hover:scale-110 transition-all">V</span>
                    </div>
                  </div>
                  <div className="hidden xs:block">
                    <span className="text-sm sm:text-lg font-black tracking-tight text-content">Vibe</span>
                  </div>
                </a>
                <div className="hidden md:block w-[1px] h-8 bg-line" />
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-content/5 border border-line">
                  <div className="w-1.5 h-1.5 rounded-full bg-content-muted" />
                  <span className="text-xs font-bold text-content-muted tracking-wide uppercase">{getPageTitle()}</span>
                </div>
              </div>

              {/* Center Search */}
              <div className="hidden md:flex items-center flex-1 justify-center px-8">
                <div
                  className="w-full max-w-xl flex items-center gap-3 px-4 py-2.5 rounded-xl border border-line bg-surface/50 transition-all group pointer-events-none"
                >
                  <svg className="w-4 h-4 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm text-content-muted flex-1 text-left">Search anything...</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl hover:bg-content/5 transition-all text-content-muted hover:text-content"
                  title="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        ref={mainRef}
        className={`relative z-10 w-full h-[100vh] overflow-y-auto overflow-x-hidden pt-16 pb-32 scroll-smooth transition-all duration-500 ${isExplorePage ? 'md:pl-28' : ''
          }`}
      >
        <div className="max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>

      <NavigationDock onOpenCreate={handleOpenCreate} vertical={isExplorePage} />

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      <ProfileSetupModal />
    </div>
  );
}