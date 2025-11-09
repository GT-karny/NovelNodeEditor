import type { Node } from 'reactflow';

export interface SceneNodeData {
  title: string;
  summary: string;
  label?: string;
}

export type SceneNode = Node<SceneNodeData>;
