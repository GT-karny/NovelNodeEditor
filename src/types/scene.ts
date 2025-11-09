import type { Node } from 'reactflow';

export interface SceneNodeData {
  /** Persisted: display title for the scene. */
  title: string;
  /** Persisted: free-form summary or memo of the scene. */
  summary: string;
  /** Derived from {@link title}; excluded from persistence. */
  label?: string;
  /** Ephemeral UI state; excluded from persistence. */
  isEditing?: boolean;
  /** Ephemeral UI state; excluded from persistence. */
  isSelected?: boolean;
  /** Event handler; excluded from persistence. */
  onSubmit?: (nodeId: string, nextTitle: string) => void;
  /** Event handler; excluded from persistence. */
  onCancel?: () => void;
}

export type SceneNode = Node<SceneNodeData>;
