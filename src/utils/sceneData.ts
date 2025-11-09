import type { Node } from 'reactflow';

import type { SceneNode, SceneNodeData } from '../types/scene';

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
