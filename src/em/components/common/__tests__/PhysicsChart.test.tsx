import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PhysicsChart } from '@em/components/common/PhysicsChart';

const data = [ { r: 0.1, F: 100, Flux: 5 }, { r: 0.2, F: 25, Flux: 5 }, { r: 0.4, F: 6.25, Flux: 5 } ];

describe('PhysicsChart new axis options', () => {
  it('renders with numeric x + log y without throwing', () => {
    render(<PhysicsChart title="Force" data={data} xKey="r" xType="number" xLabel="r" yLabel="F" yScale="log"
      lines={[{ dataKey: 'F', color: '#dc2626', name: 'F' }]} />);
    expect(screen.getByText('Force')).toBeInTheDocument();
  });
  it('renders a dual-axis chart (y2Label + per-line axis) without throwing', () => {
    render(<PhysicsChart title="Flux & Field" data={data} xKey="r" xType="number" xLabel="r"
      yLabel="E" yScale="log" y2Label="Flux"
      lines={[{ dataKey: 'F', color: '#dc2626', name: 'E', axis: 'left' }, { dataKey: 'Flux', color: '#9333ea', name: 'Flux', axis: 'right' }]} />);
    expect(screen.getByText('Flux & Field')).toBeInTheDocument();
  });
  it('still renders the default (category x, single linear y) chart', () => {
    render(<PhysicsChart title="Default" data={data} xKey="r" xLabel="r" yLabel="F"
      lines={[{ dataKey: 'F', color: '#000', name: 'F' }]} />);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });
});
