import type { CircuitType } from '@circuits/types/circuit';

export function CircuitDiagram({ type, R, L, C, voltage }: { type: CircuitType; R: number; L: number; C: number; voltage: number }) {
  const wireColor = 'var(--circuit-wire)';
  const textColor = 'var(--circuit-text)';

  return (
    <svg
      viewBox="0 0 360 220"
      className="w-full h-auto [--circuit-wire:#334155] dark:[--circuit-wire:#94a3b8] [--circuit-text:#475569] dark:[--circuit-text:#94a3b8]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Voltage source */}
      <line x1="40" y1="40" x2="40" y2="70" stroke={wireColor} strokeWidth="2" />
      <circle cx="40" cy="90" r="20" stroke="#3b82f6" strokeWidth="2" fill="#eff6ff" className="dark:fill-blue-900/30" />
      <text x="40" y="87" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">+</text>
      <text x="40" y="98" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">-</text>
      <text x="40" y="120" textAnchor="middle" fontSize="9" fill={textColor}>{voltage}V</text>
      <line x1="40" y1="110" x2="40" y2="190" stroke={wireColor} strokeWidth="2" />

      {/* Top wire */}
      <line x1="40" y1="40" x2="100" y2="40" stroke={wireColor} strokeWidth="2" />

      {/* Resistor */}
      <polyline
        points="100,40 108,30 116,50 124,30 132,50 140,30 148,50 156,40 170,40"
        stroke="#ef4444" strokeWidth="2" fill="none"
      />
      <text x="135" y="25" textAnchor="middle" fontSize="9" fill={textColor}>R={R >= 1000 ? `${(R/1000).toFixed(1)}k` : R}&#937;</text>

      {type === 'RC' && (
        <>
          <line x1="170" y1="40" x2="250" y2="40" stroke={wireColor} strokeWidth="2" />
          <line x1="250" y1="40" x2="250" y2="75" stroke={wireColor} strokeWidth="2" />
          <line x1="235" y1="75" x2="265" y2="75" stroke="#22c55e" strokeWidth="3" />
          <line x1="235" y1="85" x2="265" y2="85" stroke="#22c55e" strokeWidth="3" />
          <line x1="250" y1="85" x2="250" y2="190" stroke={wireColor} strokeWidth="2" />
          <text x="280" y="83" textAnchor="start" fontSize="9" fill={textColor}>C={C >= 0.001 ? `${(C*1000).toFixed(1)}mF` : `${(C*1e6).toFixed(1)}\u00B5F`}</text>
          <line x1="40" y1="190" x2="250" y2="190" stroke={wireColor} strokeWidth="2" />
          <line x1="135" y1="190" x2="135" y2="200" stroke={wireColor} strokeWidth="2" />
          <line x1="120" y1="200" x2="150" y2="200" stroke={wireColor} strokeWidth="2" />
          <line x1="125" y1="205" x2="145" y2="205" stroke={wireColor} strokeWidth="1.5" />
          <line x1="130" y1="210" x2="140" y2="210" stroke={wireColor} strokeWidth="1" />
        </>
      )}

      {type === 'RL' && (
        <>
          <line x1="170" y1="40" x2="190" y2="40" stroke={wireColor} strokeWidth="2" />
          <path d="M190,40 Q200,20 210,40 Q220,20 230,40 Q240,20 250,40 Q260,20 270,40" stroke="#a855f7" strokeWidth="2" fill="none" />
          <text x="230" y="25" textAnchor="middle" fontSize="9" fill={textColor}>L={L >= 1 ? `${L.toFixed(1)}H` : `${(L*1000).toFixed(1)}mH`}</text>
          <line x1="270" y1="40" x2="300" y2="40" stroke={wireColor} strokeWidth="2" />
          <line x1="300" y1="40" x2="300" y2="190" stroke={wireColor} strokeWidth="2" />
          <line x1="40" y1="190" x2="300" y2="190" stroke={wireColor} strokeWidth="2" />
          <line x1="160" y1="190" x2="160" y2="200" stroke={wireColor} strokeWidth="2" />
          <line x1="145" y1="200" x2="175" y2="200" stroke={wireColor} strokeWidth="2" />
          <line x1="150" y1="205" x2="170" y2="205" stroke={wireColor} strokeWidth="1.5" />
          <line x1="155" y1="210" x2="165" y2="210" stroke={wireColor} strokeWidth="1" />
        </>
      )}

      {type === 'RLC' && (
        <>
          <line x1="170" y1="40" x2="185" y2="40" stroke={wireColor} strokeWidth="2" />
          <path d="M185,40 Q193,22 201,40 Q209,22 217,40 Q225,22 233,40 Q241,22 249,40" stroke="#a855f7" strokeWidth="2" fill="none" />
          <text x="217" y="25" textAnchor="middle" fontSize="9" fill={textColor}>L={L >= 1 ? `${L.toFixed(1)}H` : `${(L*1000).toFixed(1)}mH`}</text>
          <line x1="249" y1="40" x2="310" y2="40" stroke={wireColor} strokeWidth="2" />
          <line x1="310" y1="40" x2="310" y2="75" stroke={wireColor} strokeWidth="2" />
          <line x1="295" y1="75" x2="325" y2="75" stroke="#22c55e" strokeWidth="3" />
          <line x1="295" y1="85" x2="325" y2="85" stroke="#22c55e" strokeWidth="3" />
          <line x1="310" y1="85" x2="310" y2="190" stroke={wireColor} strokeWidth="2" />
          <text x="333" y="83" textAnchor="start" fontSize="9" fill={textColor}>C={C >= 0.001 ? `${(C*1000).toFixed(1)}mF` : `${(C*1e6).toFixed(1)}\u00B5F`}</text>
          <line x1="40" y1="190" x2="310" y2="190" stroke={wireColor} strokeWidth="2" />
          <line x1="170" y1="190" x2="170" y2="200" stroke={wireColor} strokeWidth="2" />
          <line x1="155" y1="200" x2="185" y2="200" stroke={wireColor} strokeWidth="2" />
          <line x1="160" y1="205" x2="180" y2="205" stroke={wireColor} strokeWidth="1.5" />
          <line x1="165" y1="210" x2="175" y2="210" stroke={wireColor} strokeWidth="1" />
        </>
      )}

      {/* Current arrow */}
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
        </marker>
      </defs>
      <line x1="60" y1="35" x2="85" y2="35" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
      <text x="72" y="30" textAnchor="middle" fontSize="8" fontStyle="italic" fill="#f59e0b">i(t)</text>
    </svg>
  );
}
