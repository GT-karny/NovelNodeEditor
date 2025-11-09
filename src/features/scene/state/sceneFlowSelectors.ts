import type { SceneNode } from '../../../types/scene';
import type { SceneFlowState } from './sceneFlowReducer';

export const selectNodes = (state: SceneFlowState): SceneNode[] => state.nodes;

export const selectEdges = (state: SceneFlowState) => state.edges;

export const selectSelectedNodeId = (state: SceneFlowState): string | null => state.selectedNodeId;

export const selectEditingNodeId = (state: SceneFlowState): string | null => state.editingNodeId;

export const selectSelectedNode = (
  nodes: SceneNode[],
  selectedNodeId: string | null
): SceneNode | null => {
  if (!selectedNodeId) {
    return null;
  }
  return nodes.find((node) => node.id === selectedNodeId) ?? null;
};

interface FlowNodeHandlers {
  onSubmit: (nodeId: string, nextTitle: string) => void;
  onCancel: () => void;
}

export const selectFlowNodes = (
  nodes: SceneNode[],
  selectedNodeId: string | null,
  editingNodeId: string | null,
  handlers: FlowNodeHandlers
): SceneNode[] =>
  nodes.map((node) => ({
    ...node,
    type: 'scene',
    data: {
      ...node.data,
      isEditing: node.id === editingNodeId,
      isSelected: node.id === selectedNodeId,
      onSubmit: handlers.onSubmit,
      onCancel: handlers.onCancel,
    },
  }));
