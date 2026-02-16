import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface NavigationDockProps {
  onOpenCreate: () => void;
  vertical?: boolean;
}

export const NavigationDock = ({ onOpenCreate, vertical = false }: NavigationDockProps) => {
  const location = useLocation();
  const { unreadCount, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      to: '/',
      label: 'الرئيسية',
      icon: (active: boolean) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
          {active ? (
            <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 01.53 1.28l-.97.97a.75.75 0 01-1.06 0L12 7.06l-7.72 7.72a.75.75 0 01-1.06 0l-.97-.97a.75.75 0 01.53-1.28l8.69-8.69zM12 5.432l8.25 8.25v6.568a1.5 1.5 0 01-1.5 1.5h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75h-4.5a1.5 1.5 0 01-1.5-1.5v-6.568L12 5.432z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          )}
        </svg>
      ),
    },
    {
      to: '/explore',
      label: 'الذكاء الاصطناعي',
      icon: (active: boolean) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
          {active ? (
            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a4.5 4.5 0 003.09 3.09L16.5 11.79a.75.75 0 010 1.42l-2.846.813a4.5 4.5 0 00-3.09 3.09l-.813 2.846a.75.75 0 01-1.422 0l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.5 13.21a.75.75 0 010-1.42l2.846-.813a4.5 4.5 0 003.09-3.09l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.257 1.03a3.375 3.375 0 002.454 2.455l1.03.257a.75.75 0 110 1.455l-1.03.257a3.375 3.375 0 00-2.454 2.454L18.728 11.2a.75.75 0 11-1.455 0l-.257-1.03a3.375 3.375 0 00-2.454-2.454l-1.03-.257a.75.75 0 110-1.455l1.03-.257a3.375 3.375 0 002.454-2.455l.257-1.03a.75.75 0 01.727-.568zM16.5 18a.75.75 0 01.712.513l.394 1.182c.225.676.747 1.198 1.423 1.423l1.182.394a.75.75 0 11-.474 1.422l-1.182-.394a3.75 3.75 0 00-2.37-2.37l-1.182-.394a.75.75 0 11.474-1.422l1.182.394c.325.108.623.284.876.513l.03-.09z" clipRule="evenodd" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.454L18 2.25l.259 1.035a3.375 3.375 0 002.454 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          )}
        </svg>
      ),
    },
    {
      to: '/notifications',
      label: 'الإشعارات',
      icon: (active: boolean) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
          {active ? (
            <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.266 2.5zM12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3.696m13.416 0A8.969 8.969 0 0 1 20.876 7.5" />
          )}
        </svg>
      ),
      badge: unreadCount,
    },
    {
      to: `/profile/${user?.handle?.replace('@', '') || 'guest'}`,
      label: 'الملف الشخصي',
      icon: (active: boolean) => (
        <div className={`relative w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${active ? 'border-neon ring-1 ring-neon/40' : 'border-content-muted/30 group-hover:border-content-muted/60'}`}>
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.handle || 'guest'}`}
            className="w-full h-full object-cover"
            alt="Profile"
          />
        </div>
      ),
    },
  ];

  const finalNavItems = user?.isAdmin
    ? [...navItems, {
      to: '/admin',
      label: 'الإدارة',
      icon: (active: boolean) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
          {active ? (
            <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          )}
          {!active && <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      ),
    }]
    : navItems;

  return (
    <>
      {!vertical && (
        <div className="fixed bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none z-20" />
      )}

      {/* Desktop Vertical Sidebar - HIDDEN ON MOBILE */}
      {vertical && (
        <nav
          className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 w-20 z-30"
          role="navigation"
        >
          <div className="relative w-full">
            <div className="absolute -inset-2 rounded-[32px] bg-neon/[0.03] blur-2xl" />
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="relative flex flex-col items-center py-6 gap-2 bg-surface/90 backdrop-blur-3xl border border-line/80 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.16)]"
            >
              {finalNavItems.slice(0, 2).map(item => (
                <DockLink key={item.to} item={item} currentPath={location.pathname} vertical={true} />
              ))}
              <div className="relative my-2">
                <CreateButton onClick={onOpenCreate} />
              </div>
              {finalNavItems.slice(2).map(item => (
                <DockLink key={item.to} item={item} currentPath={location.pathname} vertical={true} />
              ))}
            </motion.div>
          </div>
        </nav>
      )}

      {/* Standard Bottom Dock - HIDDEN ON MOBILE IF VERTICAL */}
      {!vertical && (
        <nav
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[400px]"
          role="navigation"
        >
          <div className="relative">
            <div className="absolute -inset-2 rounded-[32px] bg-neon/[0.03] blur-2xl" />
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative flex items-center justify-around px-1.5 py-1.5 bg-surface/90 backdrop-blur-3xl border border-line/80 rounded-[22px] shadow-[0_8px_32px_rgba(0,0,0,0.16)]"
            >
              {finalNavItems.slice(0, 2).map(item => (
                <DockLink key={item.to} item={item} currentPath={location.pathname} />
              ))}
              <div className="mx-0.5">
                <CreateButton onClick={onOpenCreate} />
              </div>
              {finalNavItems.slice(2).map(item => (
                <DockLink key={item.to} item={item} currentPath={location.pathname} />
              ))}
            </motion.div>
          </div>
        </nav>
      )}

      {/* Mobile Hamburger Button - ONLY ON MOBILE FOR VERTICAL PAGES */}
      {vertical && (
        <>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden fixed bottom-6 left-6 z-[100] w-14 h-14 rounded-2xl bg-surface/90 backdrop-blur-xl border border-line shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center text-content active:scale-95 transition-transform"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface">
                {unreadCount}
              </span>
            )}
          </motion.button>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-md md:hidden"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 left-0 bottom-0 z-[120] w-[280px] bg-surface border-r border-line shadow-2xl md:hidden flex flex-col p-6"
                >
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center text-neon border border-neon/20">
                        <span className="font-black text-xl">V</span>
                      </div>
                      <span className="text-xl font-black">القائمة</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-content/5">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-1 flex-1">
                    {finalNavItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-neon/10 text-neon' : 'hover:bg-content/5 text-content-muted hover:text-content'
                          }`
                        }
                      >
                        <div className="shrink-0">{item.icon(location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to)))}</div>
                        <span className="font-bold text-[16px]">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="mr-auto px-2 py-0.5 rounded-full bg-neon text-black text-[10px] font-black">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCreate();
                    }}
                    className="mt-4 p-5 rounded-2xl bg-content text-background font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>إنشاء منشور جديد</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
};

const CreateButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    onClick={onClick}
    className="group relative outline-none focus:outline-none"
    whileTap={{ scale: 0.85 }}
    whileHover={{ scale: 1.05 }}
  >
    <div className="absolute -inset-1.5 rounded-[20px] bg-content/[0.06] group-hover:bg-neon/[0.12] blur-lg transition-all duration-500" />
    <div className="absolute -inset-[1px] rounded-[18px] bg-gradient-to-tr from-content/20 via-transparent to-content/10 group-hover:from-neon/30 group-hover:to-neon/10 transition-all duration-500" />
    <div className="relative w-[46px] h-[46px] rounded-[17px] bg-content flex items-center justify-center overflow-hidden">
      <motion.svg
        className="w-5 h-5 text-background relative z-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </motion.svg>
    </div>
  </motion.button>
);

interface DockLinkProps {
  item: {
    to: string;
    label: string;
    icon: (active: boolean) => React.ReactNode;
    badge?: number;
  };
  currentPath: string;
  vertical?: boolean;
}

function DockLink({ item, currentPath, vertical }: DockLinkProps) {
  const isActive = item.to === '/'
    ? currentPath === '/'
    : currentPath.startsWith(item.to);

  return (
    <NavLink
      to={item.to}
      className="relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 group outline-none focus:outline-none"
      aria-label={item.label}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="dock-active-bg"
            className="absolute inset-1.5 rounded-[14px] bg-content/[0.07]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
      </AnimatePresence>

      <motion.span
        className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-content' : 'text-content-muted group-hover:text-content'}`}
        whileTap={{ scale: 0.8 }}
      >
        {item.icon(isActive)}
      </motion.span>

      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="dock-active-indicator"
            className={`absolute rounded-full bg-content transition-all ${vertical
              ? '-left-0.5 top-1/2 -translate-y-1/2 w-[3px] h-6'
              : '-bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px]'
              }`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
        )}
      </AnimatePresence>

      <div className={`absolute px-3 py-1.5 rounded-xl bg-content text-background text-[11px] font-semibold whitespace-nowrap opacity-0 scale-90 transition-all duration-250 pointer-events-none shadow-[0_4px_16px_rgba(0,0,0,0.2)] group-hover:opacity-100 group-hover:scale-100 ${vertical
        ? 'left-[120%] top-1/2 -translate-y-1/2'
        : 'bottom-[120%] left-1/2 -translate-x-1/2'
        }`}>
        {item.label}
      </div>
    </NavLink>
  );
}