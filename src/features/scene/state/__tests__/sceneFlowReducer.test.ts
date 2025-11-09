import { describe, expect, it } from 'vitest';
import type { Edge } from 'reactflow';

import type { SceneNode } from '../../../../types/scene';
import { initializeSceneFlowState, sceneFlowReducer } from '../sceneFlowReducer';

const createState = (nodes: SceneNode[], edges: Edge[] = []) =>
  initializeSceneFlowState({ nodes, edges });

describe('sceneFlowReducer', () => {
  it('adds a new node with an incremented id and default title', () => {
    const initialState = createState([]);
    const nextState = sceneFlowReducer(initialState, { type: 'NODE_ADDED' });

    expect(nextState.nodes).toHaveLength(1);
    expect(nextState.nodes[0].id).toBe('1');
    expect(nextState.nodes[0].data.title).toBe('シーン 1');
    expect(nextState.nodes[0].data.label).toBe('シーン 1');
    expect(nextState.nextNodeId).toBe(2);
  });

  it('removes node references from edges and selection when a node is deleted', () => {
    const nodes: SceneNode[] = [
      {
        id: '1',
        position: { x: 0, y: 0 },
        data: { title: 'One', summary: '' },
        type: 'scene',
      },
      {
        id: '2',
        position: { x: 100, y: 100 },
        data: { title: 'Two', summary: '' },
        type: 'scene',
      },
    ];
    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-1', source: '2', target: '1' },
    ];
    const initialState = {
      ...createState(nodes, edges),
      selectedNodeId: '2',
      editingNodeId: '2',
    };

    const nextState = sceneFlowReducer(initialState, { type: 'NODE_DELETED', nodeId: '2' });

    expect(nextState.nodes).toHaveLength(1);
    expect(nextState.nodes[0].id).toBe('1');
    expect(nextState.edges).toHaveLength(0);
    expect(nextState.selectedNodeId).toBeNull();
    expect(nextState.editingNodeId).toBeNull();
  });

  it('applies scene snapshot and resets ids and editing state', () => {
    const initialState = createState([
      {
        id: '1',
        position: { x: 0, y: 0 },
        data: { title: 'Old', summary: '' },
        type: 'scene',
      },
    ]);

    const snapshotNodes: SceneNode[] = [
      {
        id: '5',
        position: { x: 10, y: 20 },
        data: { title: 'Snapshot Title', summary: 'Summary', label: 'outdated' },
        type: 'scene',
      },
    ];
    const snapshotEdges: Edge[] = [{ id: 'e5-6', source: '5', target: '6' }];

    const nextState = sceneFlowReducer(initialState, {
      type: 'APPLY_SCENE_SNAPSHOT',
      nodes: snapshotNodes,
      edges: snapshotEdges,
    });

    expect(nextState.nodes).toHaveLength(1);
    expect(nextState.nodes[0].id).toBe('5');
    expect(nextState.nodes[0].data.label).toBe('Snapshot Title');
    expect(nextState.edges).toEqual(snapshotEdges);
    expect(nextState.selectedNodeId).toBeNull();
    expect(nextState.editingNodeId).toBeNull();
    expect(nextState.nextNodeId).toBe(6);
  });
});
