import type { Edge, Node, XYPosition } from 'reactflow';

import type { SceneNode, SceneNodeData } from '../types/scene';
import type { SceneSnapshot, SceneNodeSnapshot, SceneNodeSnapshotData } from '../types/storage';
import { SCENE_SNAPSHOT_VERSION } from '../types/storage';

export const syncSceneNodeData = (node: SceneNode): SceneNode => {
  const { onSubmit, onCancel, isEditing, isSelected, ...restData } = node.data ?? {};
  return {
    ...node,
    data: {
      ...restData,
      label: restData?.title ?? '',
    } as SceneNodeData,
  };
};

export const syncSceneNodes = (nodesList: SceneNode[]): SceneNode[] =>
  nodesList.map((node) => syncSceneNodeData(node));

export const normalizeToSceneNode = (node: Node): SceneNode => {
  const rawData = (node.data ?? {}) as Partial<SceneNodeData> & Record<string, unknown>;
  const titleSource =
    typeof rawData.title === 'string' && rawData.title.length > 0
      ? rawData.title
      : typeof rawData.label === 'string' && rawData.label.length > 0
        ? rawData.label
        : `シーン ${node.id}`;
  const summarySource = typeof rawData.summary === 'string' ? rawData.summary : '';

  return syncSceneNodeData({
    ...node,
    data: {
      ...rawData,
      title: titleSource,
      summary: summarySource,
    },
    type: 'scene',
  });
};

export const formatSceneSummary = (summary: string): string => {
  const trimmed = summary.trim();
  if (trimmed.length === 0) {
    return '';
  }

  const MAX_LINE_LENGTH = 20;
  const MAX_DISPLAY_LINES = 2;

  const wrappedLines: string[] = [];
  trimmed.split('\n').forEach((line) => {
    if (line.length === 0) {
      wrappedLines.push('');
      return;
    }

    const characters = Array.from(line);
    for (let index = 0; index < characters.length; index += MAX_LINE_LENGTH) {
      wrappedLines.push(characters.slice(index, index + MAX_LINE_LENGTH).join(''));
    }
  });

  if (wrappedLines.length <= MAX_DISPLAY_LINES) {
    return wrappedLines.join('\n');
  }

  const truncatedLines = wrappedLines.slice(0, MAX_DISPLAY_LINES);
  const lastLineIndex = truncatedLines.length - 1;
  truncatedLines[lastLineIndex] = `${truncatedLines[lastLineIndex]}…`;
  return truncatedLines.join('\n');
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isXYPosition = (value: unknown): value is XYPosition =>
  isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';

const isSceneNodeSnapshotData = (value: unknown): value is SceneNodeSnapshotData =>
  isRecord(value) && typeof value.title === 'string' && typeof value.summary === 'string';

const isSceneNodeSnapshot = (value: unknown): value is SceneNodeSnapshot => {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string') return false;
  if (!isXYPosition(value.position)) return false;
  if (!isSceneNodeSnapshotData(value.data)) return false;
  return true;
};

const isEdgeSnapshot = (value: unknown): value is Edge => {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string') return false;
  if (typeof value.source !== 'string') return false;
  if (typeof value.target !== 'string') return false;
  return true;
};

const cloneEdge = (edge: Edge): Edge => ({ ...edge });

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
  if (!isRecord(snapshot)) return null;
  if (snapshot.version !== SCENE_SNAPSHOT_VERSION) return null;
  if (!Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) return null;

  const parsedNodes = snapshot.nodes.filter(isSceneNodeSnapshot).map((node) => normalizeToSceneNode(node));
  const parsedEdges = snapshot.edges.filter(isEdgeSnapshot).map((edge) => cloneEdge(edge));

  if (parsedNodes.length === 0 && parsedEdges.length === 0) {
    return {
      version: SCENE_SNAPSHOT_VERSION,
      nodes: [],
      edges: [],
    };
  }

  return {
    version: SCENE_SNAPSHOT_VERSION,
    nodes: parsedNodes,
    edges: parsedEdges,
  };
};
