import { NavLink } from 'react-router-dom';
import { Home, Compass, Bell, Cpu, Plus } from 'lucide-react';

interface NavigationDockProps {
  onOpenCreate: () => void;
}

const DockItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => `
      relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 group
      ${isActive ? 'text-neon' : 'text-content-muted hover:text-content'}
    `}
  >
    {({ isActive }) => (
      <>
        <div className={`
          absolute inset-0 bg-surface opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 border border-line
          ${isActive ? 'opacity-100 border-neon/30 bg-neon/5' : ''}
        `} />
        
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
        
        {isActive && (
          <div 
            className="absolute -bottom-2 w-1 h-1 bg-neon rounded-full shadow-[0_0_8px_var(--color-neon)]"
          />
        )}
        
        <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black/80 text-white text-xs px-2 py-1 rounded border border-white/10 backdrop-blur-md whitespace-nowrap z-50">
          {label}
        </span>
      </>
    )}
  </NavLink>
);

export const NavigationDock = ({ onOpenCreate }: NavigationDockProps) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
      <div className="flex items-center justify-between p-2 bg-surface/80 backdrop-blur-xl border border-line rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        
        {/* ✅ الأيقونات الأربعة المتبقية */}
        <DockItem to="/" icon={Home} label="Home" />
        <DockItem to="/explore" icon={Compass} label="Explore" />
        
        {/* ✅ زر الإنشاء في المنتصف */}
        <button 
          onClick={onOpenCreate}
          className="relative group -translate-y-4 mx-2"
        >
          <div className="absolute inset-0 bg-neon rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-background border-2 border-neon text-neon rounded-full shadow-lg group-active:scale-95 transition-transform">
            <Plus size={28} strokeWidth={3} />
          </div>
        </button>

        <DockItem to="/notifications" icon={Bell} label="Alerts" />
        <DockItem to="/ai-insights" icon={Cpu} label="AI Node" />

        {/* ❌ تم إخفاء أيقونة Profile */}
        {/* ❌ تم إخفاء أيقونة تغيير الوضع (Theme Toggle) */}
        {/* ❌ تم إخفاء الفاصل (Divider) */}
      </div>
    </div>
  );
};