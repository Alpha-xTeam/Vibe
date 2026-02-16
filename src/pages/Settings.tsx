import React from 'react';
import { useTheme } from '../context/ThemeContext';

export function Settings() {
  const {
    theme,
    toggleTheme,
    showTextures,
    toggleTextures,
    reduceMotion,
    toggleReduceMotion,
  } = useTheme();

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8">
      {/* Header Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-neon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neon tracking-tight">
            Settings
          </h1>
        </div>
        <p className="text-content-muted text-base leading-relaxed mr-13">
          Configure your experience on Vibe. Personalize the appearance and
          behavior to suit your preferences.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {/* Appearance Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-content-muted mb-4 px-1">
            Appearance
          </h2>
          <div className="space-y-3">
            {/* Theme Toggle */}
            <div className="group rounded-2xl border border-line bg-surface p-5 flex items-center justify-between gap-4 transition-all duration-200 hover:border-neon/30 hover:shadow-[0_0_20px_-8px] hover:shadow-neon/20">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-neon/5 border border-neon/10 flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-neon/10">
                  {theme === 'dark' ? (
                    <svg
                      className="w-5 h-5 text-neon"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-neon"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-content text-[15px]">
                    Theme
                  </div>
                  <div className="text-sm text-content-muted mt-0.5">
                    Switch between light and dark mode
                  </div>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="relative px-4 py-2 rounded-xl bg-neon/10 text-neon font-medium text-sm border border-neon/20 transition-all duration-200 hover:bg-neon/20 hover:scale-105 active:scale-95 flex items-center gap-2 flex-shrink-0"
              >
                {theme === 'dark' ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
                <span className="capitalize">{theme}</span>
              </button>
            </div>

            {/* Background Textures */}
            <div className="group rounded-2xl border border-line bg-surface p-5 flex items-center justify-between gap-4 transition-all duration-200 hover:border-neon/30 hover:shadow-[0_0_20px_-8px] hover:shadow-neon/20">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-neon/5 border border-neon/10 flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-neon/10">
                  <svg
                    className="w-5 h-5 text-neon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-content text-[15px]">
                    Background Textures
                  </div>
                  <div className="text-sm text-content-muted mt-0.5">
                    Toggle subtle decorative textures
                  </div>
                </div>
              </div>
              {/* Custom Toggle Switch */}
              <button
                onClick={toggleTextures}
                aria-pressed={showTextures}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  showTextures
                    ? 'bg-neon shadow-[0_0_12px_-2px] shadow-neon/40'
                    : 'bg-content/10'
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                    showTextures ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Accessibility Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-content-muted mb-4 px-1">
            Accessibility
          </h2>
          <div className="space-y-3">
            {/* Reduce Motion */}
            <div className="group rounded-2xl border border-line bg-surface p-5 flex items-center justify-between gap-4 transition-all duration-200 hover:border-neon/30 hover:shadow-[0_0_20px_-8px] hover:shadow-neon/20">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-neon/5 border border-neon/10 flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-neon/10">
                  <svg
                    className="w-5 h-5 text-neon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-content text-[15px]">
                    Reduce Motion
                  </div>
                  <div className="text-sm text-content-muted mt-0.5">
                    Disable non-essential animations for comfort
                  </div>
                </div>
              </div>
              {/* Custom Toggle Switch */}
              <button
                onClick={toggleReduceMotion}
                aria-pressed={reduceMotion}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  reduceMotion
                    ? 'bg-neon shadow-[0_0_12px_-2px] shadow-neon/40'
                    : 'bg-content/10'
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                    reduceMotion ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Hint */}
      <div className="mt-10 pt-6 border-t border-line">
        <p className="text-xs text-content-muted text-center">
          Settings are saved automatically and synced across your devices.
        </p>
      </div>
    </div>
  );
}