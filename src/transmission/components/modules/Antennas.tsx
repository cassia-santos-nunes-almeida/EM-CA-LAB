import { useEffect } from 'react';
import { Radio, Wifi, Satellite, Smartphone, Tv, BookOpen, Activity, GraduationCap } from 'lucide-react';
import { getSectionNumber } from '@shared/constants/curriculum';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { YourTurnPanel } from '@shared/components/common/YourTurnPanel';
import { SectionHook } from '@shared/components/common/SectionHook';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { FigureImage } from '@shared/components/common/FigureImage';
import { TabSet } from '@transmission/components/common/TabSet';
import { TableOfContents } from '@shared/components/common/TableOfContents';
import { useProgressStore } from '@shared/store/progressStore';
import { useActiveSection } from '@transmission/hooks/useActiveSection';
import { RadiationPatternSim } from '@transmission/components/simulations/RadiationPatternSim';
import { MODULE_URLS } from '@transmission/constants/modules';

/** Antenna type card data. */
interface AntennaCard {
  /** Display name of the antenna type. */
  name: string;
  /** Typical applications. */
  applications: string;
  /** Typical frequency range. */
  freqRange: string;
  /** Key characteristic. */
  characteristic: string;
  /** Lucide icon component. */
  icon: React.ElementType;
}

const antennaCards: AntennaCard[] = [
  {
    name: '\u03BB/2 Dipole',
    applications: 'TV, FM radio',
    freqRange: '88\u2013108 MHz (FM), 470\u2013890 MHz (UHF TV)',
    characteristic: 'Omnidirectional in H-plane',
    icon: Tv,
  },
  {
    name: 'Patch Antenna',
    applications: 'Mobile phones, GPS',
    freqRange: '1\u20136 GHz',
    characteristic: 'Low profile, easy to manufacture',
    icon: Smartphone,
  },
  {
    name: 'Yagi-Uda',
    applications: 'WiFi directional, amateur radio',
    freqRange: '144 MHz \u2013 5 GHz',
    characteristic: 'High gain, narrow beam',
    icon: Wifi,
  },
  {
    name: 'Parabolic Dish',
    applications: 'Satellite, radar',
    freqRange: '1\u201340 GHz',
    characteristic: 'Very high gain, pencil beam',
    icon: Satellite,
  },
];

const CHALLENGE = {
  title: `Reading a Dipole's Radiation Pattern`,
  description: `Manipulate the dipole length and watch how the polar radiation pattern, directivity, radiation resistance, and beamwidth respond. This builds intuition for why the half-wave dipole is the practical sweet spot and why matching it to a 75 Ω coax feed is no accident.`,
  instructions: [
    `In the Simulations tab, pass or skip the prediction prompt to reveal the radiation-pattern simulation, then set the Dipole Length slider to its minimum, 0.10λ (a short dipole), and note the broad, nearly round lobe in the polar pattern plus the low Directivity and very small Radiation Resistance readout.`,
    `Drag the Dipole Length slider to 0.50λ (the half-wave dipole) and observe that the Radiation Resistance readout settles near 73 Ω — the value that nearly matches the 75 Ω coaxial standard discussed in the Theory tab.`,
    `Compare the Directivity readout between 0.10λ and 0.50λ: confirm it rises toward about 1.64 (≈2.15 dBi) and that the Half-Power Beamwidth readout shrinks as the pattern narrows in the broadside direction.`,
    `Continue increasing the Dipole Length slider past 1.00λ toward 1.50λ and watch the polar pattern develop extra side lobes splitting off the broadside main lobe, while the Half-Power Beamwidth readout changes accordingly.`,
    `Find the longest dipole length at which the main lobe is still single (no side lobes have split off yet) — around 1.00λ — and note that the Directivity readout is at its largest for a single-lobe pattern right at that boundary, just before extra lobes appear at the next step.`,
    `Conclude in your own words why ~0.50λ is the practical design choice: relate the 73 Ω Radiation Resistance to easy matching with Γ ≈ 0, and explain the trade-off between higher directivity and the unwanted side lobes that appear at longer lengths.`,
  ],
  hint: `Keep one eye on the Radiation Resistance readout near 0.50λ and watch the broadside lobe split as you push the slider toward 1.50λ.`,
};

/** Theory-tab sections for jump-to navigation (module-level for a stable scroll-spy ref). */
const THEORY_SECTIONS = [
  { id: 'antenna-fundamentals', label: 'Fundamentals' },
  { id: 'near-far-field', label: 'Near vs Far Field' },
  { id: 'practical-antennas', label: 'Practical Antennas' },
];
const THEORY_IDS = THEORY_SECTIONS.map((s) => s.id);

export function Antennas() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const activeTheoryId = useActiveSection(THEORY_IDS);
  useEffect(() => { markVisited('antennas'); }, [markVisited]);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-engineering-blue-100 dark:bg-engineering-blue-900/30 rounded-lg flex items-center justify-center">
          <Radio className="w-5 h-5 text-engineering-blue-600 dark:text-engineering-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            <span className="font-mono text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
              {getSectionNumber('antennas')}
            </span>
            Antennas
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            From Transmission Line to Antenna
          </p>
        </div>
      </div>

      <SectionHook text="Every wireless device you use — phone, WiFi router, satellite dish — relies on antennas. An antenna is simply a transmission line that has been opened up to let energy escape into free space." />

      <TabSet tabs={[
        {
          label: 'Theory',
          icon: <BookOpen className="w-4 h-4" />,
          content: (
            <div className="space-y-10">
        <TableOfContents items={THEORY_SECTIONS} activeId={activeTheoryId} />
        <FigureImage
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Dipole_antenna_ft_en.svg/500px-Dipole_antenna_ft_en.svg.png"
          alt="Diagram of a half-wave dipole antenna showing the two conductor elements and feed point"
          caption="A half-wave dipole antenna: the simplest practical antenna. Two conductor elements, each λ/4 long, are fed at the center — directly derived from 'opening up' a transmission line."
          attribution="Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Dipole_antenna_ft_en.svg"
          className="sm:max-w-md"
        />

        <div id="antenna-fundamentals" className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-4 scroll-mt-20">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Imagine taking a transmission line and flaring its conductors apart. Instead of guiding
            the wave between two conductors, the fields now radiate outward into space. This is
            the fundamental transition from a transmission line to a <strong>dipole antenna</strong>.
          </p>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            On a terminated transmission line, an open circuit produces a reflection coefficient{' '}
            <MathWrapper formula="\Gamma = +1" />. But when the line is flared into an antenna,
            the energy that would have been reflected is instead <em>radiated</em>. The antenna
            converts guided-wave energy into free-space radiation.
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Radiation Resistance
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              From the transmission line's perspective, the antenna looks like a resistor. The
              power "consumed" by this resistor is actually the power radiated into space. This
              equivalent resistance is called the <strong>radiation resistance</strong>{' '}
              <MathWrapper formula="R_{\text{rad}}" />.
            </p>
            <MathWrapper
              formula="P_{\text{rad}} = \frac{1}{2} |I_0|^2 R_{\text{rad}}"
              block
            />
          </div>

          <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 rounded-lg p-4 border-l-4 border-engineering-blue-500 space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Key insight:</strong> The feed-point impedance of a{' '}
              <MathWrapper formula="\lambda/2" /> dipole is approximately{' '}
              <MathWrapper formula="73\,\Omega" />. This is remarkably close to the{' '}
              <MathWrapper formula="75\,\Omega" /> standard for coaxial cable — and that is
              not a coincidence. The 75{'\u2009'}{'\u03A9'} coaxial standard was chosen specifically
              because it provides a near-perfect impedance match to a half-wave dipole.
            </p>
            <MathWrapper
              formula="Z_{\text{in}}(\lambda/2 \text{ dipole}) \approx 73 + j42.5\,\Omega \approx 73\,\Omega \text{ (at resonance)}"
              block
            />
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Impedance matching for antennas</strong> follows the same reflection
              coefficient logic from Section 3: matching the antenna's radiation resistance to{' '}
              <MathWrapper formula="Z_0" /> of the feed line maximizes power transfer. When{' '}
              <MathWrapper formula="R_{\text{rad}} = Z_0" />, then{' '}
              <MathWrapper formula="\Gamma = 0" /> and all power is radiated — none is
              reflected back along the transmission line.
            </p>
          </div>

          <CollapsibleSection title="Derivation: Radiation Resistance" variant="inline">
            <div className="space-y-3 py-2">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                The radiation resistance is found by integrating the radiated power over all
                directions and equating it to <MathWrapper formula="\frac{1}{2}|I_0|^2 R_{\text{rad}}" />:
              </p>
              <MathWrapper
                formula="R_{\text{rad}} = \frac{2\pi}{\eta_0 |I_0|^2} \int_0^\pi |E_\theta(r,\theta)|^2 r^2 \sin\theta \, d\theta"
                block
              />
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                For a <MathWrapper formula="\lambda/2" /> dipole, evaluating this integral
                gives <MathWrapper formula="R_{\text{rad}} \approx 73.1\,\Omega" />. For a short
                dipole (<MathWrapper formula="L \ll \lambda" />), <MathWrapper formula="R_{\text{rad}} = 20\pi^2(L/\lambda)^2 \approx 2\,\Omega" />,
                which makes matching difficult.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Note on the pattern simulation below: its radiation-resistance readout uses the
                sinusoidal (center-fed) current model, which is accurate near{' '}
                <MathWrapper formula="L = \lambda/2" /> (the 73-ohm result above). The short-dipole
                formula <MathWrapper formula="20\pi^2(L/\lambda)^2" /> assumes a different
                short-element current distribution, so at very small{' '}
                <MathWrapper formula="L/\lambda" /> the simulated value and this formula do not match.
              </p>
            </div>
          </CollapsibleSection>
        </div>


      {/* ═══════════════════════════════════════════════════════════════
          Near field vs far field
          ═══════════════════════════════════════════════════════════════ */}
      <section id="near-far-field" className="space-y-5 scroll-mt-20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Near Field vs. Far Field
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            The space around an antenna is divided into two distinct regions based on how the
            electromagnetic fields behave:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                Near Field (Reactive)
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Energy is stored and exchanged between electric and magnetic fields, oscillating
                back and forth. The fields are complex, non-radiating, and decay rapidly
                (as 1/r{'\u00B2'} or 1/r{'\u00B3'}).
              </p>
            </div>
            <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/10 rounded-lg p-4 border border-engineering-blue-200 dark:border-engineering-blue-800">
              <h3 className="text-sm font-semibold text-engineering-blue-800 dark:text-engineering-blue-300 mb-2">
                Far Field (Radiative)
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Energy propagates outward as a true electromagnetic wave. E and H fields are
                in phase, perpendicular to each other, and decay as 1/r. This is where the
                radiation pattern applies.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
              The boundary between these regions is approximately at the{' '}
              <strong>Fraunhofer distance</strong>:
            </p>
            <MathWrapper
              formula="r_{\text{far}} = \frac{2D^2}{\lambda}"
              block
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              where <MathWrapper formula="D" /> is the largest dimension of the antenna and{' '}
              <MathWrapper formula="\lambda" /> is the operating wavelength.
            </p>
          </div>

          {/* Near field / far field diagram */}
          <div className="flex justify-center py-4">
            <div className="relative w-80 h-80">
              {/* Far field zone */}
              <div className="absolute inset-0 rounded-full bg-engineering-blue-100/50 dark:bg-engineering-blue-900/20 border-2 border-dashed border-engineering-blue-300 dark:border-engineering-blue-700 flex items-start justify-center pt-4">
                <span className="text-xs font-semibold text-engineering-blue-600 dark:text-engineering-blue-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded">
                  Far Field (radiating)
                </span>
              </div>
              {/* Near field zone */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-amber-100/70 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 flex items-start justify-center pt-3">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded">
                  Near Field (reactive)
                </span>
              </div>
              {/* Antenna dot at center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 dark:bg-white rounded-full" />
              <span className="absolute top-1/2 left-1/2 translate-x-3 -translate-y-1 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                Antenna
              </span>
              {/* Boundary label */}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                r = 2D{'\u00B2'}/{'\u03BB'}
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          Practical antennas (concept cards)
          ═══════════════════════════════════════════════════════════════ */}
      <section id="practical-antennas" className="space-y-5 scroll-mt-20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Practical Antennas
          </h2>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          While the dipole is the fundamental antenna, real-world applications use a variety of
          antenna designs optimized for specific frequency ranges, gain requirements, and physical
          constraints.
        </p>

        {/* Real-world antenna photos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FigureImage
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/GSM_base_station_4.JPG/500px-GSM_base_station_4.JPG"
            alt="Cellular base station tower with multiple panel antenna arrays"
            caption="Cellular base station with panel antenna arrays: each panel contains multiple patch antennas arranged to cover a specific sector, using the same impedance matching principles from Section 3."
            attribution="Korax1214, CC BY-SA 4.0 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:GSM_base_station_4.JPG"
          />
          <FigureImage
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Erdfunkstelle_Raisting_2.jpg/500px-Erdfunkstelle_Raisting_2.jpg"
            alt="Large parabolic satellite dish antenna at Raisting earth station"
            caption="A parabolic dish antenna at the Raisting earth station: the parabolic reflector focuses incoming radio waves onto a feed horn at the focal point, achieving very high directivity (narrow beam)."
            attribution="Richard Bartz, CC BY-SA 2.5 — Wikimedia Commons"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Erdfunkstelle_Raisting_2.jpg"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {antennaCards.map((card) => (
            <div
              key={card.name}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5 space-y-3 border border-slate-200 dark:border-slate-700 hover:border-engineering-blue-300 dark:hover:border-engineering-blue-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-engineering-blue-100 dark:bg-engineering-blue-900/30 rounded-lg flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-engineering-blue-600 dark:text-engineering-blue-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{card.name}</h3>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Applications:</span>{' '}
                  {card.applications}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Frequency:</span>{' '}
                  {card.freqRange}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Pattern:</span>{' '}
                  {card.characteristic}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

            </div>
          ),
        },
        {
          label: 'Simulations',
          icon: <Activity className="w-4 h-4" />,
          content: (
            <div className="space-y-10">
      {/* ═══════════════════════════════════════════════════════════════
          Radiation pattern simulation
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Radiation Pattern Simulation
          </h2>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The <strong>radiation pattern</strong> describes how an antenna distributes energy
          as a function of direction. For a dipole aligned along the z-axis, the pattern depends
          on the dipole length relative to the wavelength. Use the simulation below to explore
          how the pattern changes.
        </p>

        <FigureImage
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Anechoic_chamber.jpg/500px-Anechoic_chamber.jpg"
          alt="Interior of an anechoic chamber with RF absorbing foam pyramids on walls, ceiling, and floor, used for antenna radiation pattern measurements"
          caption="An anechoic chamber: the walls are covered with RF-absorbing foam pyramids to eliminate reflections, allowing precise measurement of antenna radiation patterns in a controlled environment."
          attribution="Eton College, CC BY-SA 3.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Anechoic_chamber.jpg"
        />

        <PredictionGate
          question="If you double the dipole length from \u03BB/4 to \u03BB/2, does the directivity increase, decrease, or stay the same?"
          options={[
            { id: 'increases', label: 'Increases' },
            { id: 'decreases', label: 'Decreases' },
            { id: 'same', label: 'Stays the same' },
          ]}
          getCorrectAnswer={() => 'increases'}
          onPredict={(correct) => markPredictionGate('antennas', correct)}
          explanation={
            <p>
              A longer dipole has more current elements, each radiating individually. Their
              fields add constructively in the broadside direction but destructively at other
              angles — the same wave interference principle from Module 1. The {'\u03BB'}/2
              dipole therefore has a narrower beam and higher directivity (D {'\u2248'} 1.64
              = 2.15 dBi) compared to a short dipole (D = 1.5 = 1.76 dBi).
            </p>
          }
        >
          <RadiationPatternSim className="mt-4" />
        </PredictionGate>
      </section>

            </div>
          ),
        },
        {
          label: 'Practice',
          icon: <GraduationCap className="w-4 h-4" />,
          content: (
            <div className="space-y-10">
        <ConceptCheck
          onComplete={() => incrementConceptChecks('antennas')}
          onHint={() => incrementHints('antennas')}
          data={{
            mode: 'multiple-choice',
            question: 'A half-wave dipole has nulls at \u03B8 = 0\u00B0 and \u03B8 = 180\u00B0 (along the antenna axis). Why?',
            options: [
              { text: 'The current elements along the dipole radiate in opposite directions that cancel on-axis', correct: true, explanation: 'Correct. Along the dipole axis, radiation from each infinitesimal current element arrives at the observation point at different phases. For a half-wave dipole, these contributions cancel perfectly along the axis, producing nulls at \u03B8 = 0\u00B0 and 180\u00B0.' },
              { text: 'There is no current at the tips of the dipole', correct: false, explanation: 'While the current is indeed zero at the tips, the null along the axis is caused by destructive interference of radiation from all current elements, not just the tip current.' },
              { text: 'The ground plane reflects and cancels the signal', correct: false, explanation: 'The nulls exist even without a ground plane. They are inherent to the dipole\u2019s radiation pattern due to current distribution along the antenna.' },
            ],
            hints: [
              'Think about how radiation from different parts of the dipole adds up. Along the axis, do the path lengths differ?',
              'Each infinitesimal segment of the dipole acts as a Hertzian dipole. Along the axis (\u03B8 = 0), each segment\u2019s contribution has sin(\u03B8) = 0.',
            ],
          }}
        />

      <ConceptCheck
        onComplete={() => incrementConceptChecks('antennas')}
        onHint={() => incrementHints('antennas')}
        data={{
          mode: 'multiple-choice',
          question: 'If an antenna has directivity D = 1.64, what does this mean physically?',
          options: [
            { text: 'It radiates 1.64\u00D7 more power in its peak direction than an isotropic radiator', correct: true, explanation: 'Correct. Directivity D = 1.64 (= 2.15 dBi) means the antenna concentrates power so that its peak radiation intensity is 1.64 times that of an isotropic antenna radiating the same total power. This is the directivity of a \u03BB/2 dipole.' },
            { text: 'It is 64% efficient', correct: false, explanation: 'Efficiency and directivity are different concepts. Efficiency measures how much input power becomes radiated power. Directivity measures how concentrated the radiation pattern is.' },
            { text: 'It has a gain of 1.64 dB', correct: false, explanation: 'D = 1.64 is a linear ratio, not in dB. In decibels, D = 10\u00B7log\u2081\u2080(1.64) = 2.15 dBi.' },
          ],
          hints: [
            'Directivity compares the antenna to an isotropic (uniform) radiator. What does "1.64 times" mean in that comparison?',
          ],
        }}
      />

      {/* ── Your Turn: far-field boundary ──────────────────────────── */}
      <YourTurnPanel
        scenario="A parabolic dish antenna has a diameter D = 1 m and operates at f = 10 GHz (\u03BB = 3 cm = 0.03 m)."
        question="How far away is the far-field boundary?"
        options={[
          {
            text: 'r = 66.7 m',
            correct: true,
            explanation: 'r = 2D\u00B2/\u03BB = 2 \u00D7 1\u00B2 / 0.03 = 66.7 m. The radiation pattern is only valid beyond this distance.',
          },
          {
            text: 'r = 33.3 m',
            correct: false,
            explanation: 'That would be D\u00B2/\u03BB. The Fraunhofer distance uses 2D\u00B2/\u03BB.',
          },
          {
            text: 'r = 2 m',
            correct: false,
            explanation: 'That would be 2D, not 2D\u00B2/\u03BB. For high-frequency antennas the far-field boundary can be surprisingly far.',
          },
        ]}
        correctReveal={
          <div className="space-y-1">
            <MathWrapper
              formula="r_{\text{far}} = \frac{2D^2}{\lambda} = \frac{2 \times 1^2}{0.03} = 66.7\,\text{m}"
              block
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              At 10 GHz, even a modest 1 m dish requires measurements 67 m away for a valid pattern.
            </p>
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════
          "Does this make sense?" callout
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-engineering-blue-50 to-slate-50 dark:from-engineering-blue-900/15 dark:to-slate-800 rounded-xl p-6 border border-engineering-blue-200 dark:border-engineering-blue-800">
        <p className="text-xs font-semibold text-engineering-blue-700 dark:text-engineering-blue-400 uppercase tracking-wide mb-2">
          Does this make sense?
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          A {'\u03BB'}/2 dipole has{' '}
          <MathWrapper formula="R_{\text{rad}} \approx 73\,\Omega" /> and a coaxial feed
          line has <MathWrapper formula="Z_0 = 75\,\Omega" />. Is this a coincidence, or was
          the coaxial standard chosen with dipole antennas in mind?
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Module Close: "The loop closes"
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Module Close: The Loop Closes
          </h2>
        </div>

        <div className="bg-gradient-to-br from-engineering-blue-600 to-engineering-blue-800 rounded-2xl p-8 text-white space-y-4">
          <p className="text-engineering-blue-100 leading-relaxed">
            In Module 1 you learned that changing magnetic fields induce electric fields
            (Faraday's Law), and that electric and magnetic fields propagate together as waves.
            In Module 2 you learned to analyze lumped circuits using Kirchhoff's laws and Laplace
            transforms. In this module, you applied Kirchhoff's laws to an infinitesimal
            segment — and the wave equation appeared. The transmission line is not a new theory.
            It is Modules 1 and 2, applied to the same conductor at the same time.
          </p>
          <p className="text-engineering-blue-100 leading-relaxed">
            The antenna is where the circuit ends and free space begins. The impedance matching
            problem — <span className="font-mono font-semibold text-white">Z{'\u2080'} = R<sub>rad</sub></span> — is
            the same reflection coefficient calculation you did on transmission lines. Everything
            is connected.
          </p>
        </div>

        {/* Bottom navigation links */}
        <div className="flex items-center justify-between pt-4">
          <a
            href={MODULE_URLS.module2}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-engineering-blue-600 dark:hover:text-engineering-blue-400 transition-colors"
          >
            <span aria-hidden="true">{'\u2190'}</span> Back to Module 2
          </a>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold">
            Course complete {'\u2713'}
          </div>
        </div>
      </section>
            </div>
          ),
        },
      ]} />

      <GuidedChallenge challenge={CHALLENGE} />

      <CourseNavigation currentSectionId="antennas" />
    </div>
  );
}
