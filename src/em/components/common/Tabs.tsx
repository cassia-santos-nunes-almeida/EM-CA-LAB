import { useState, useRef, useCallback, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@shared/utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

/**
 * ARIA-compliant tablist with arrow key navigation.
 * Follows WAI-ARIA Tabs pattern.
 */
export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIdx, setFocusIdx] = useState(() =>
    Math.max(0, tabs.findIndex((t) => t.id === activeTab))
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      let newIdx = focusIdx;

      if (e.key === 'ArrowRight') {
        newIdx = (focusIdx + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        newIdx = (focusIdx - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        newIdx = 0;
      } else if (e.key === 'End') {
        newIdx = tabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      setFocusIdx(newIdx);
      tabRefs.current[newIdx]?.focus();
      onTabChange(tabs[newIdx].id);
    },
    [focusIdx, tabs, onTabChange]
  );

  return (
    <div
      role="tablist"
      aria-label="Module navigation"
      className={cn(
        'flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto border border-slate-200 dark:border-slate-700 scrollbar-hide',
        className
      )}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={(el) => { tabRefs.current[i] = el; }}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onKeyDown={handleKeyDown}
          onClick={() => {
            setFocusIdx(i);
            onTabChange(tab.id);
          }}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
