import { useState, useRef, useId, type ReactNode } from 'react';

interface Tab {
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  /** Initial tab in uncontrolled mode (ignored when `activeIndex` is set). */
  defaultIndex?: number;
  /** Controlled mode: the active tab. Pair with `onActiveIndexChange`. */
  activeIndex?: number;
  /** Called on every tab change (click or keyboard), in both modes. */
  onActiveIndexChange?: (index: number) => void;
  className?: string;
}

/**
 * The app-wide tab strip (ARIA tablist with roving tabindex; Arrow keys wrap,
 * Home/End jump). Unifies the former circuits `Tabs` and transmission
 * `TabSet` twins. Ids are scoped with useId so multiple instances on one page
 * can't collide (the twins both emitted bare `tab-0`/`tabpanel-0`).
 *
 * The active panel renders with `key={activeIndex}`, so switching tabs
 * REMOUNTS panel content — anything stateful inside (e.g. a PredictionGate)
 * must lift its state to the parent (initialPassed/onPassed pattern).
 */
export function Tabs({
  tabs,
  defaultIndex = 0,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  className,
}: TabsProps) {
  const isControlled = controlledIndex !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = useState(defaultIndex);
  const activeIndex = isControlled ? controlledIndex : uncontrolledIndex;
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setActive = (index: number) => {
    if (!isControlled) setUncontrolledIndex(index);
    onActiveIndexChange?.(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={index}
            ref={(el) => { tabRefs.current[index] = el; }}
            role="tab"
            aria-selected={index === activeIndex}
            aria-controls={`${baseId}-tabpanel-${index}`}
            id={`${baseId}-tab-${index}`}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              index === activeIndex
                ? 'bg-white dark:bg-slate-800 text-engineering-blue-600 dark:text-engineering-blue-400 border border-slate-200 dark:border-slate-700 border-b-white dark:border-b-slate-800 -mb-px'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div
        key={activeIndex}
        role="tabpanel"
        id={`${baseId}-tabpanel-${activeIndex}`}
        aria-labelledby={`${baseId}-tab-${activeIndex}`}
        className="animate-fade-in"
      >
        {tabs[activeIndex].content}
      </div>
    </div>
  );
}
