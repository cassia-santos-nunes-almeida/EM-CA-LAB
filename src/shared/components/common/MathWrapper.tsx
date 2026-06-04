import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathWrapperProps {
  formula: string;
  block?: boolean;
  className?: string;
}

export function MathWrapper({ formula, block = false, className = '' }: MathWrapperProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerRef = block ? divRef : spanRef;
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          trust: true,
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = formula;
        }
      }
    }
  }, [formula, block]);

  if (block) {
    return <div ref={divRef} className={`my-4 overflow-x-auto ${className}`} />;
  }

  return <span ref={spanRef} className={className} />;
}
