import { useState, useId, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@shared/utils/cn';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  variant?: 'card' | 'inline';
  className?: string;
  id?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon,
  variant = 'card',
  className,
  id,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div
      id={id}
      className={cn(
        variant === 'card' && 'bg-white dark:bg-slate-800 rounded-lg shadow-md',
        className,
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3 text-left',
          'px-5 py-3 min-h-[44px]',
          'text-slate-900 dark:text-white font-semibold',
          'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors',
          variant === 'card' && 'rounded-lg',
        )}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown className={cn(
          'w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200',
          isOpen && 'rotate-180',
        )} />
      </button>
      <div
        id={contentId}
        role="region"
        className={cn(
          'overflow-hidden transition-[max-height] duration-200 ease-in-out',
          isOpen ? 'max-h-[5000px]' : 'max-h-0',
        )}
      >
        <div className={cn(variant === 'card' && 'px-5 pb-5')}>
          {children}
        </div>
      </div>
    </div>
  );
}
