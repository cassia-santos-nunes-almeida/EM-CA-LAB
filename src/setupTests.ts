import '@testing-library/jest-dom/vitest';

// Mock canvas getContext for all canvas-based modules
HTMLCanvasElement.prototype.getContext = (() => {
  const noop = () => {};
  const ctx = {
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    ellipse: noop,
    stroke: noop,
    fill: noop,
    fillText: noop,
    strokeText: noop,
    measureText: () => ({ width: 0 }),
    setLineDash: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    save: noop,
    restore: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    drawImage: noop,
    getImageData: () => ({ data: new Uint8ClampedArray(0) }),
    putImageData: noop,
    canvas: { width: 800, height: 600 },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    setTransform: noop,
    resetTransform: noop,
    quadraticCurveTo: noop,
    bezierCurveTo: noop,
    clip: noop,
    isPointInPath: () => false,
    roundRect: noop,
  };
  return () => ctx;
})() as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock requestAnimationFrame
let rafId = 0;
globalThis.requestAnimationFrame = () => {
  rafId += 1;
  return rafId;
};
globalThis.cancelAnimationFrame = () => {};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock scrollTo (jsdom implements neither the window nor the element variant)
window.scrollTo = () => {};
Element.prototype.scrollTo = () => {};

// Mock ResizeObserver (jsdom lacks it; needed by recharts ResponsiveContainer + canvas sims)
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
