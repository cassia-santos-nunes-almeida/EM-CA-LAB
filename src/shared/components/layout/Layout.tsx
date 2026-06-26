import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Menu, WifiOff } from 'lucide-react';
import { Sidebar } from '@shared/components/layout/Sidebar';
import { MobileTabBar } from '@shared/components/layout/MobileTabBar';
import { AiTutor, type TutorMode } from '@shared/components/common/AiTutor';
import { useOnlineStatus } from '@shared/hooks/useOnlineStatus';
import { ScrollSpyProvider } from '@shared/components/scrollspy/ScrollSpyProvider';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [tutorMode, setTutorMode] = useState<TutorMode>('closed');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-chassis">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-engineering-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - always visible on md+, overlay on mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-slate-900 dark:text-white text-sm">EM&AC Lab</span>
        </header>

        {!isOnline && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-medium shrink-0">
            <WifiOff className="w-4 h-4 shrink-0" />
            You are offline — some features may be unavailable.
          </div>
        )}
        {/* pb-20 on mobile (56px bar + buffer) so content clears the tab-bar */}
        <main id="main-content" ref={mainRef} className="flex-1 overflow-auto relative">
          <ScrollSpyProvider rootRef={mainRef}>
            <div key={pathname} className="max-w-7xl mx-auto p-4 pb-20 md:p-8 md:pb-8 animate-fade-in">
              {children}
            </div>
          </ScrollSpyProvider>
        </main>
      </div>

      {/* Mobile bottom tab-bar + Part bottom-sheet (md:hidden inside the component) */}
      <MobileTabBar onNavigate={() => setSidebarOpen(false)} />

      {tutorMode === 'closed' && (
        <>
          {/* Desktop: vertical tab on right edge */}
          <button
            onClick={() => setTutorMode('docked')}
            className="hidden md:flex items-center gap-2 px-3 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-engineering-blue-300 hover:bg-engineering-blue-50 dark:hover:bg-engineering-blue-900/30 text-engineering-blue-700 dark:text-engineering-blue-300 writing-mode-vertical rounded-l-lg shadow-md transition-all z-50 shrink-0 self-center hover:shadow-lg"
            style={{ writingMode: 'vertical-rl' }}
            aria-label="Open Think it Through"
          >
            <MessageSquare className="w-5 h-5 text-engineering-blue-600 dark:text-engineering-blue-400" />
            <span className="text-sm font-semibold tracking-wide">Think it Through</span>
          </button>
          {/* Mobile: floating action button — raised above the 56px tab-bar */}
          <button
            onClick={() => setTutorMode('floating')}
            className="md:hidden fixed bottom-[72px] right-5 z-50 w-14 h-14 rounded-full bg-engineering-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-engineering-blue-700 active:scale-95 transition-all"
            aria-label="Open Think it Through"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </>
      )}
      <AiTutor
        mode={tutorMode}
        onModeChange={setTutorMode}
      />
    </div>
  );
}
