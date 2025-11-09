import type { Edge, Node } from 'reactflow';

import type { SceneNodeData } from './scene';

/**
 * Fields from {@link SceneNodeData} that should be persisted.
 *
 * These are the authoring values required to reconstruct a scene node.
 * The following fields are intentionally excluded from persistence because
 * they represent derived or ephemeral UI state:
 *   - {@link SceneNodeData.label} (always derived from the title on load)
 *   - {@link SceneNodeData.isEditing}
 *   - {@link SceneNodeData.isSelected}
 *   - {@link SceneNodeData.onSubmit}
 *   - {@link SceneNodeData.onCancel}
 */
export interface SceneNodeSnapshotData extends Pick<SceneNodeData, 'title' | 'summary'> {}

/**
 * Persistable subset of a scene node used when saving to storage.
 */
export type SceneNodeSnapshot = Node<SceneNodeSnapshotData>;

export interface SceneSnapshot {
  /** Storage schema version for compatibility checks. */
  version: number;
  nodes: SceneNodeSnapshot[];
  edges: Edge[];
}

export const SCENE_SNAPSHOT_VERSION = 1 as const;
