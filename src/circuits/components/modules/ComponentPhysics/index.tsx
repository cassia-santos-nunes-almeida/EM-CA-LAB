import { useState, useEffect } from 'react';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import {
  calculateResistance,
  calculateCapacitance,
  calculateInductance,
} from '@circuits/utils/componentMath';
import { ResistorSection } from '@circuits/components/modules/ComponentPhysics/ResistorSection';
import { CapacitorSection } from '@circuits/components/modules/ComponentPhysics/CapacitorSection';
import { InductorSection } from '@circuits/components/modules/ComponentPhysics/InductorSection';
import { SectionHook } from '@shared/components/common/SectionHook';
import { FigureImage } from '@shared/components/common/FigureImage';
import { GuidedChallenge } from '@shared/components/common/GuidedChallenge';
import { useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';

type ComponentType = 'resistor' | 'capacitor' | 'inductor';

const CHALLENGE = {
  title: `Geometry and Material Drive Every Component Value`,
  description: `Use the Resistor, Capacitor, and Inductor tabs to discover how each component's value (R, C, L) is set by its physical geometry and material — and notice which dependencies are linear, inverse, or squared. This grounds the s-domain impedances you'll meet later (Z_R = R, Z_C = 1/sC, Z_L = sL).`,
  instructions: [
    `On the 'Resistor' tab, drag the 'Area' slider from 0.1 mm² up to 10 mm² while watching the 'Calculated Resistance' readout and the Cross-Section A-A diagram; confirm resistance falls as area grows, matching R = ρL/A (area is in the denominator).`,
    `Still on 'Resistor', return Area to a mid value and increase the 'Length' slider toward 2 m; note that resistance rises in direct proportion to length, then click a 'Material Properties' preset to jump resistivity ρ and watch R scale with the material too.`,
    `Switch to the 'Capacitor' tab and reduce the 'Distance' slider from 5 mm toward 0.1 mm while watching the plate gap d shrink in the Side View; confirm 'Calculated Capacitance' increases, matching C = εA/d (distance is in the denominator).`,
    `Still on 'Capacitor', drag the 'Plate Area' slider up and click a higher 'Dielectric Materials' preset for permittivity; observe that both larger area and larger ε raise capacitance linearly, the opposite denominator role that area played for the resistor.`,
    `Switch to the 'Inductor' tab and move the 'Number of Turns' slider from 10 toward 500 while watching 'Calculated Inductance'; confirm L grows much faster than linearly because L = μN²A/l depends on N squared (doubling N roughly quadruples L).`,
    `Conclude: compare how each value is built — R from ρ, L, A; C from ε, A, d; L from μ, N², A, l. Note that capacitance rises as the gap d shrinks while resistance rises as length L grows, and that only the inductor has a squared (N²) dependence. These physical scalings are exactly what set the magnitudes of Z_R = R, Z_C = 1/sC, and Z_L = sL in s-domain analysis.`,
  ],
  hint: `Watch where each quantity sits in its formula — a variable in the denominator (area for R, distance for C) makes the value go the opposite way from one in the numerator, and the inductor's N is squared.`,
};

export function ComponentPhysics() {
  const markVisited = useProgressStore((s) => s.markVisited);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  useEffect(() => { markVisited('component-physics'); }, [markVisited]);

  const [activeComponent, setActiveComponent] = useState<ComponentType>('resistor');

  const [resistorLength, setResistorLength] = useState(1);
  const [resistorArea, setResistorArea] = useState(1e-6);
  const [resistorMaterial, setResistorMaterial] = useState(1.68e-8);

  const [capacitorArea, setCapacitorArea] = useState(0.01);
  const [capacitorDistance, setCapacitorDistance] = useState(0.001);
  const [capacitorPermittivity, setCapacitorPermittivity] = useState(8.854e-12);

  const [inductorTurns, setInductorTurns] = useState(100);
  const [inductorArea, setInductorArea] = useState(0.0001);
  const [inductorLength, setInductorLength] = useState(0.1);
  const [inductorPermeability, setInductorPermeability] = useState(1.257e-6);

  const resistance = calculateResistance(resistorMaterial, resistorLength, resistorArea);
  const capacitance = calculateCapacitance(capacitorPermittivity, capacitorArea, capacitorDistance);
  const inductance = calculateInductance(inductorPermeability, inductorTurns, inductorArea, inductorLength);

  return (
    <div className="space-y-8">
      <SectionHook text="A 100μF capacitor and a 100μH inductor are physically very different objects — one stores energy in an electric field, one in a magnetic field. Yet in circuit equations they appear as near-mirror images of each other. Understanding why requires going inside the physics." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('component-physics')}
          </span>
          Component Physics
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Understanding the physical foundations of circuit components
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <FigureImage
          src={`${import.meta.env.BASE_URL}figures/resistors.jpg`}
          alt="Assorted through-hole resistors with color-coded bands"
          caption="Real resistors: the colored bands encode resistance values. Physical dimensions relate to R = ρL/A."
          attribution="Evan-Amos, Public Domain — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Resistors.jpg"
        />
        <FigureImage
          src={`${import.meta.env.BASE_URL}figures/capacitors.jpg`}
          alt="Various types of capacitors including ceramic, electrolytic, and film"
          caption="Capacitor types: construction determines capacitance via C = εA/d."
          attribution="Eric Schrader, CC BY-SA 2.5 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Condensators.JPG"
        />
        <FigureImage
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Inductor_RF_choke.jpg/500px-Inductor_RF_choke.jpg"
          alt="Various inductors and RF chokes"
          caption="Inductors store energy in magnetic fields. Core material and turns determine L = μN²A/l."
          attribution="Honina, CC BY-SA 3.0 — Wikimedia Commons"
          sourceUrl="https://commons.wikimedia.org/wiki/File:Inductor_RF_choke.jpg"
        />
      </div>

      <div className="flex border-b-2 border-slate-200 dark:border-slate-700">
        {([
          { id: 'resistor' as const, label: 'Resistor', color: 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
          { id: 'capacitor' as const, label: 'Capacitor', color: 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
          { id: 'inductor' as const, label: 'Inductor', color: 'border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' },
        ]).map((component) => (
          <button
            key={component.id}
            onClick={() => setActiveComponent(component.id)}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-3 -mb-[2px] ${
              activeComponent === component.id
                ? component.color
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {component.label}
          </button>
        ))}
      </div>

      {activeComponent === 'resistor' && (
        <ResistorSection
          length={resistorLength}
          area={resistorArea}
          resistivity={resistorMaterial}
          resistance={resistance}
          onLengthChange={setResistorLength}
          onAreaChange={setResistorArea}
          onResistivityChange={setResistorMaterial}
          onConceptCheckComplete={() => incrementConceptChecks('component-physics')}
          onHint={() => incrementHints('component-physics')}
        />
      )}

      {activeComponent === 'capacitor' && (
        <CapacitorSection
          area={capacitorArea}
          distance={capacitorDistance}
          permittivity={capacitorPermittivity}
          capacitance={capacitance}
          onAreaChange={setCapacitorArea}
          onDistanceChange={setCapacitorDistance}
          onPermittivityChange={setCapacitorPermittivity}
          onConceptCheckComplete={() => incrementConceptChecks('component-physics')}
          onHint={() => incrementHints('component-physics')}
        />
      )}

      {activeComponent === 'inductor' && (
        <InductorSection
          turns={inductorTurns}
          area={inductorArea}
          length={inductorLength}
          permeability={inductorPermeability}
          inductance={inductance}
          onTurnsChange={setInductorTurns}
          onAreaChange={setInductorArea}
          onLengthChange={setInductorLength}
          onPermeabilityChange={setInductorPermeability}
          onConceptCheckComplete={() => incrementConceptChecks('component-physics')}
          onHint={() => incrementHints('component-physics')}
        />
      )}

      <GuidedChallenge challenge={CHALLENGE} />

      <CourseNavigation />
    </div>
  );
}
