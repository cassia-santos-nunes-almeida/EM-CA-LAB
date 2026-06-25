/** Props for the shared transmission-sim ReadoutCard. */
interface ReadoutCardProps {
  /** Label describing the quantity. */
  label: string;
  /** Formatted value string. */
  value: string;
}

/**
 * A small slate readout card (label over a mono value), shared by the transmission
 * simulations (A.5 #9). Previously copied byte-for-byte in CoupledCoilsSim,
 * SmithChartSim, TransmissionLineSim and WalkTheLineSim. The richer highlight
 * variant (LadderAnimation) and unit/sublabel variant (RadiationPatternSim) are
 * intentionally distinct and stay local.
 */
export function ReadoutCard({ label, value }: ReadoutCardProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
        {value}
      </p>
    </div>
  );
}
