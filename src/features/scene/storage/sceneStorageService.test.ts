import { describe, expect, it } from 'vitest';
import type { Edge } from 'reactflow';

import type { SceneNode } from '../../../types/scene';
import { createSceneSnapshot } from '../../../utils/sceneData';
import {
  SceneSnapshotInvalidFormatError,
  SceneSnapshotVersionMismatchError,
  parseSnapshotFile,
  saveSnapshotToBlob,
} from './sceneStorageService';

const createSampleNodes = (): SceneNode[] => [
  {
    id: '1',
    position: { x: 0, y: 0 },
    type: 'scene',
    data: { title: 'Scene 1', summary: 'Summary 1' },
  },
];

const createSampleEdges = (): Edge[] => [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
  },
];

describe('sceneStorageService', () => {
  it('creates a blob that contains the serialized snapshot', async () => {
    const nodes = createSampleNodes();
    const edges = createSampleEdges();

    const blob = saveSnapshotToBlob(nodes, edges);
    const text = await blob.text();
    const parsed = JSON.parse(text);

    expect(parsed).toEqual(createSceneSnapshot(nodes, edges));
  });

  it('parses a valid snapshot file', async () => {
    const nodes = createSampleNodes();
    const edges = createSampleEdges();
    const snapshot = createSceneSnapshot(nodes, edges);
    const file = new File([JSON.stringify(snapshot, null, 2)], 'scene.json', {
      type: 'application/json',
    });

    const parsed = await parseSnapshotFile(file);

    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.edges).toHaveLength(1);
    expect(parsed.nodes[0].data.title).toBe('Scene 1');
  });

  it('rejects when the snapshot file is invalid JSON', async () => {
    const file = new File(['{invalid json'], 'scene.json', { type: 'application/json' });

    await expect(parseSnapshotFile(file)).rejects.toBeInstanceOf(
      SceneSnapshotInvalidFormatError,
    );
  });

  it('rejects when the snapshot version does not match', async () => {
    const nodes = createSampleNodes();
    const edges = createSampleEdges();
    const snapshot = {
      ...createSceneSnapshot(nodes, edges),
      version: -1,
    };
    const file = new File([JSON.stringify(snapshot)], 'scene.json', {
      type: 'application/json',
    });

    await expect(parseSnapshotFile(file)).rejects.toBeInstanceOf(
      SceneSnapshotVersionMismatchError,
    );
  });
});
