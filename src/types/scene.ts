import type { Node } from 'reactflow';

export interface SceneNodeData {
  title: string;
  summary: string;
  label?: string;
  isEditing?: boolean;
  onSubmit?: (nodeId: string, nextTitle: string) => void;
  onCancel?: () => void;
}

export type SceneNode = Node<SceneNodeData>;
