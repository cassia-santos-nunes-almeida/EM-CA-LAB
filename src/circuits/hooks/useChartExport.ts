import { useCallback, type RefObject } from 'react';

/**
 * Hook that provides a download-as-PNG function for a Recharts chart container.
 *
 * @param chartRef - Ref to the container element wrapping the Recharts component
 * @param filename - Base filename (without extension) for the downloaded PNG
 * @returns handleDownloadChart callback
 */
export function useChartExport(
  chartRef: RefObject<HTMLDivElement | null>,
  filename: string,
) {
  return useCallback(() => {
    const container = chartRef.current;
    if (!container) return;
    const svg = container.querySelector('svg.recharts-surface');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const rect = svg.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      const a = document.createElement('a');
      a.download = `${filename}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
  }, [chartRef, filename]);
}
