import { describe, expect, it, vi } from 'vitest';

import type { SceneNode } from '../../../../types/scene';
import { selectFlowNodes, selectSelectedNode } from '../sceneFlowSelectors';

describe('sceneFlowSelectors', () => {
  const baseNodes: SceneNode[] = [
    {
      id: '1',
      position: { x: 0, y: 0 },
      data: { title: 'First', summary: '' },
      type: 'scene',
    },
    {
      id: '2',
      position: { x: 50, y: 50 },
      data: { title: 'Second', summary: 'details' },
      type: 'scene',
    },
  ];

  it('returns flow nodes enriched with editing and selection flags', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    const flowNodes = selectFlowNodes(baseNodes, '2', '1', { onSubmit, onCancel });

    expect(flowNodes).toHaveLength(2);
    expect(flowNodes[0].data.isEditing).toBe(true);
    expect(flowNodes[0].data.isSelected).toBe(false);
    expect(flowNodes[0].data.onSubmit).toBe(onSubmit);
    expect(flowNodes[1].data.isSelected).toBe(true);
    expect(flowNodes[1].data.isEditing).toBe(false);
  });

  it('returns selected node matching id', () => {
    const selected = selectSelectedNode(baseNodes, '2');
    expect(selected?.id).toBe('2');
    expect(selected?.data.title).toBe('Second');
  });

  it('returns null when selected node id is missing', () => {
    const selected = selectSelectedNode(baseNodes, '3');
    expect(selected).toBeNull();
  });
});
