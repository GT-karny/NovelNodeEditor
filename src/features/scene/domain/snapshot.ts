import { z } from 'zod';
import type { Edge } from 'reactflow';

import type { SceneNode } from '../../../types/scene';
import type { SceneNodeSnapshot, SceneSnapshot } from '../../../types/storage';
import { SCENE_SNAPSHOT_VERSION } from '../../../types/storage';
import { normalizeToSceneNode, syncSceneNodeData } from './nodeSync';

const cloneEdge = (edge: Edge): Edge => ({ ...edge });

const sceneNodeSnapshotDataSchema = z.object({
  title: z.string(),
  summary: z.string(),
});

const xyPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const sceneNodeSnapshotSchema = z
  .object({
    id: z.string(),
    position: xyPositionSchema,
    data: sceneNodeSnapshotDataSchema,
  })
  .passthrough();

const edgeSnapshotSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
  })
  .passthrough();

const nodesArraySchema = z.array(z.unknown()).transform((candidates) =>
  candidates.reduce<SceneNodeSnapshot[]>((validNodes, candidate) => {
    const parsed = sceneNodeSnapshotSchema.safeParse(candidate);
    if (parsed.success) {
      validNodes.push(parsed.data as SceneNodeSnapshot);
    }
    return validNodes;
  }, [])
);

const edgesArraySchema = z.array(z.unknown()).transform((candidates) =>
  candidates.reduce<Edge[]>((validEdges, candidate) => {
    const parsed = edgeSnapshotSchema.safeParse(candidate);
    if (parsed.success) {
      validEdges.push(parsed.data as Edge);
    }
    return validEdges;
  }, [])
);

const sceneSnapshotSchema = z.object({
  version: z.literal(SCENE_SNAPSHOT_VERSION),
  nodes: nodesArraySchema,
  edges: edgesArraySchema,
});

const toSceneNodeSnapshot = (node: SceneNode): SceneNodeSnapshot => {
  const synced = syncSceneNodeData(node);
  return {
    ...synced,
    data: {
      title: synced.data?.title ?? '',
      summary: synced.data?.summary ?? '',
    },
  };
};

export interface ParsedSceneSnapshot {
  version: number;
  nodes: SceneNode[];
  edges: Edge[];
}

export const createSceneSnapshot = (nodes: SceneNode[], edges: Edge[]): SceneSnapshot => ({
  version: SCENE_SNAPSHOT_VERSION,
  nodes: nodes.map((node) => toSceneNodeSnapshot(node)),
  edges: edges.map((edge) => cloneEdge(edge)),
});

export const parseSceneSnapshot = (snapshot: unknown): ParsedSceneSnapshot | null => {
  const parsed = sceneSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    return null;
  }

  const { nodes, edges } = parsed.data;

  if (nodes.length === 0 && edges.length === 0) {
    return {
      version: SCENE_SNAPSHOT_VERSION,
      nodes: [],
      edges: [],
    };
  }

  return {
    version: SCENE_SNAPSHOT_VERSION,
    nodes: nodes.map((node) => normalizeToSceneNode(node)),
    edges: edges.map((edge) => cloneEdge(edge)),
  };
};
