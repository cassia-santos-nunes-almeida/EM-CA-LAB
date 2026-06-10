import { describe, it, expect } from 'vitest';
import {
  buildEquationLine,
  nodeBuilderReducer,
  initialNodeBuilderState,
  NODE_KCL_A_TERMS,
  NODE_KCL_B_TERMS,
  NODE_SOLVE_LINES,
  meshAssignerReducer,
  initialMeshAssignerState,
  MESH_KVL_1_TERMS,
  MESH_KVL_2_TERMS,
  MESH_SOLVE_LINES,
  type NodeBuilderAction,
  type NodeBuilderState,
  type MeshAssignerAction,
  type MeshAssignerState,
  type TermStep,
} from '@circuits/components/modules/NodalMesh/nodalMeshData';

function runNode(actions: NodeBuilderAction[], from: NodeBuilderState = initialNodeBuilderState): NodeBuilderState {
  return actions.reduce(nodeBuilderReducer, from);
}

function runMesh(actions: MeshAssignerAction[], from: MeshAssignerState = initialMeshAssignerState): MeshAssignerState {
  return actions.reduce(meshAssignerReducer, from);
}

function correctId(steps: TermStep[], index: number): string {
  const choice = steps[index].choices.find((c) => c.correct);
  if (!choice) throw new Error(`no correct choice at term ${index}`);
  return choice.id;
}

describe('nodeBuilderReducer', () => {
  const toKclA: NodeBuilderAction[] = [
    { type: 'pickNode', node: 'bottom' },
    { type: 'continue' },
  ];

  it('walks the full happy path from pick-reference to done', () => {
    let state = runNode([{ type: 'pickNode', node: 'bottom' }]);
    expect(state.phase).toBe('label');

    state = runNode([{ type: 'continue' }], state);
    expect(state.phase).toBe('kcl-A');
    expect(state.termIndex).toBe(0);

    state = runNode([
      { type: 'pickTerm', choiceId: correctId(NODE_KCL_A_TERMS, 0) },
      { type: 'pickTerm', choiceId: correctId(NODE_KCL_A_TERMS, 1) },
    ], state);
    expect(state.phase).toBe('kcl-A');
    expect(state.termIndex).toBe(2);

    state = runNode([{ type: 'pickTerm', choiceId: correctId(NODE_KCL_A_TERMS, 2) }], state);
    expect(state.phase).toBe('tidy-A');

    state = runNode([{ type: 'continue' }], state);
    expect(state.phase).toBe('kcl-B');
    expect(state.termIndex).toBe(0);

    state = runNode([
      { type: 'pickTerm', choiceId: correctId(NODE_KCL_B_TERMS, 0) },
      { type: 'pickTerm', choiceId: correctId(NODE_KCL_B_TERMS, 1) },
    ], state);
    expect(state.phase).toBe('tidy-B');

    state = runNode([{ type: 'continue' }], state);
    expect(state.phase).toBe('solve');
    expect(state.revealIndex).toBe(0);

    state = runNode([{ type: 'revealNext' }, { type: 'revealNext' }], state);
    expect(state.phase).toBe('solve');
    expect(state.revealIndex).toBe(2);

    state = runNode([{ type: 'revealNext' }], state);
    expect(state.phase).toBe('done');
    expect(state.revealIndex).toBe(NODE_SOLVE_LINES.length - 1);
  });

  it('stays in pick-reference with coaching feedback when node A is picked', () => {
    const state = runNode([{ type: 'pickNode', node: 'A' }]);
    expect(state.phase).toBe('pick-reference');
    expect(state.feedback).toMatch(/busiest node/);
  });

  it('keeps termIndex and sets sign-convention feedback on the into-the-node distractor', () => {
    const state = runNode([...toKclA, { type: 'pickTerm', choiceId: 'into' }]);
    expect(state.phase).toBe('kcl-A');
    expect(state.termIndex).toBe(0);
    expect(state.feedback).toMatch(/LEAVING the node/);
  });

  it('keeps termIndex and sets multiply-vs-divide feedback on the multiply distractor', () => {
    const state = runNode([...toKclA, { type: 'pickTerm', choiceId: 'mult' }]);
    expect(state.phase).toBe('kcl-A');
    expect(state.termIndex).toBe(0);
    expect(state.feedback).toMatch(/divide by R/);
  });

  it('clears feedback when a correct term follows a wrong one', () => {
    const state = runNode([
      ...toKclA,
      { type: 'pickTerm', choiceId: 'into' },
      { type: 'pickTerm', choiceId: correctId(NODE_KCL_A_TERMS, 0) },
    ]);
    expect(state.termIndex).toBe(1);
    expect(state.feedback).toBeNull();
  });

  it('ships 4 solve lines containing the verified bridge numbers 7.2 and 0.6', () => {
    expect(NODE_SOLVE_LINES).toHaveLength(4);
    const joined = NODE_SOLVE_LINES.join(' ');
    expect(joined).toContain('7.2');
    expect(joined).toContain('0.6');
  });
});

describe('meshAssignerReducer', () => {
  it('advances directly to kvl-1 when both arrows are clockwise', () => {
    const state = runMesh([{ type: 'checkConvention' }]);
    expect(state.phase).toBe('kvl-1');
    expect(state.termIndex).toBe(0);
  });

  it('shows the convention info for CCW/CW, then normalizes to all-clockwise and advances', () => {
    let state = runMesh([
      { type: 'toggleMesh', mesh: 1 },
      { type: 'checkConvention' },
    ]);
    expect(state.phase).toBe('assign');
    expect(state.mesh1CW).toBe(false);
    expect(state.conventionInfo).toBe(true);

    state = runMesh([{ type: 'normalize' }], state);
    expect(state.phase).toBe('kvl-1');
    expect(state.mesh1CW).toBe(true);
    expect(state.mesh2CW).toBe(true);
    expect(state.conventionInfo).toBe(false);
  });

  it('stays on the shared term with feedback when 4i_1 is picked', () => {
    const wrongShared = MESH_KVL_1_TERMS[2].choices.find((c) => c.katex === '4i_1');
    expect(wrongShared).toBeDefined();
    const state = runMesh([
      { type: 'checkConvention' },
      { type: 'pickTerm', choiceId: correctId(MESH_KVL_1_TERMS, 0) },
      { type: 'pickTerm', choiceId: correctId(MESH_KVL_1_TERMS, 1) },
      { type: 'pickTerm', choiceId: wrongShared!.id },
    ]);
    expect(state.phase).toBe('kvl-1');
    expect(state.termIndex).toBe(2);
    expect(state.feedback).toMatch(/also carries/);
  });

  it('reaches done with the verified solution i1=4, i2=1, shared=3', () => {
    const state = runMesh([
      { type: 'checkConvention' },
      { type: 'pickTerm', choiceId: correctId(MESH_KVL_1_TERMS, 0) },
      { type: 'pickTerm', choiceId: correctId(MESH_KVL_1_TERMS, 1) },
      { type: 'pickTerm', choiceId: correctId(MESH_KVL_1_TERMS, 2) },
      { type: 'continue' },
      { type: 'pickTerm', choiceId: correctId(MESH_KVL_2_TERMS, 0) },
      { type: 'continue' },
      { type: 'revealNext' },
      { type: 'revealNext' },
    ]);
    expect(state.phase).toBe('done');
    expect(state.solution).toMatchObject({ i1: 4, i2: 1, shared: 3 });
  });

  it('ships 3 mesh solve lines', () => {
    expect(MESH_SOLVE_LINES).toHaveLength(3);
    expect(MESH_SOLVE_LINES.join(' ')).toContain('i_2 = 1');
  });
});

describe('buildEquationLine', () => {
  it('pads the unpicked slots with placeholder squares and ends in = 0', () => {
    expect(buildEquationLine([], 3)).toBe('\\square + \\square + \\square = 0');
    expect(buildEquationLine(['\\frac{V_A - 12}{2}'], 3)).toBe('\\frac{V_A - 12}{2} + \\square + \\square = 0');
    expect(buildEquationLine(['-20', '2i_1', '4(i_1 - i_2)'], 3)).toBe('-20 + 2i_1 + 4(i_1 - i_2) = 0');
  });
});
