import type { Node } from 'reactflow';

import type { SceneNode, SceneNodeData } from '../../../types/scene';

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

export const normalizeToSceneNode = (
  node: Node<Partial<SceneNodeData> & Record<string, unknown>>
): SceneNode => {
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
  } as SceneNode);
};
