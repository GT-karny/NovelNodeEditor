import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from 'reactflow';

import type { SceneNode, SceneNodeData } from '../../../types/scene';
import { getNextNodeIdValue, syncSceneNodeData, syncSceneNodes } from '../domain';

export interface SceneFlowState {
  nodes: SceneNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  editingNodeId: string | null;
  nextNodeId: number;
}

export type SceneFlowAction =
  | { type: 'NODE_CHANGES_APPLIED'; changes: NodeChange[] }
  | { type: 'EDGE_CHANGES_APPLIED'; changes: EdgeChange[] }
  | { type: 'EDGE_CONNECTED'; connection: Connection }
  | { type: 'NODE_ADDED'; position?: XYPosition }
  | { type: 'NODE_DELETED'; nodeId: string }
  | { type: 'EDGE_REMOVED'; edgeId: string }
  | { type: 'NODE_TITLE_SUBMITTED'; nodeId: string; nextTitle: string }
  | { type: 'NODE_TITLE_CHANGED'; nodeId: string; nextTitle: string }
  | { type: 'NODE_SUMMARY_CHANGED'; nodeId: string; nextSummary: string }
  | { type: 'SELECT_NODE'; nodeId: string | null }
  | { type: 'BEGIN_EDITING'; nodeId: string }
  | { type: 'CANCEL_EDITING' }
  | { type: 'APPLY_SCENE_SNAPSHOT'; nodes: SceneNode[]; edges: Edge[] };

const ensureValidNodeReferences = (
  nodes: SceneNode[],
  selectedNodeId: string | null,
  editingNodeId: string | null
): { selectedNodeId: string | null; editingNodeId: string | null } => {
  if (nodes.length === 0) {
    return { selectedNodeId: null, editingNodeId: null };
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  return {
    selectedNodeId: selectedNodeId && nodeIds.has(selectedNodeId) ? selectedNodeId : null,
    editingNodeId: editingNodeId && nodeIds.has(editingNodeId) ? editingNodeId : null,
  };
};

const getDefaultNodePosition = (nodes: SceneNode[], position?: XYPosition): XYPosition => ({
  x: position?.x ?? 100 + nodes.length * 80,
  y: position?.y ?? 100 + (nodes.length % 4) * 80,
});

export interface InitializeSceneFlowStateParams {
  nodes: SceneNode[];
  edges: Edge[];
}

export const initializeSceneFlowState = ({
  nodes,
  edges,
}: InitializeSceneFlowStateParams): SceneFlowState => {
  const sanitizedNodes = syncSceneNodes(nodes);
  return {
    nodes: sanitizedNodes,
    edges,
    selectedNodeId: null,
    editingNodeId: null,
    nextNodeId: getNextNodeIdValue(sanitizedNodes),
  };
};

export const sceneFlowReducer = (
  state: SceneFlowState,
  action: SceneFlowAction
): SceneFlowState => {
  switch (action.type) {
    case 'NODE_CHANGES_APPLIED': {
      const updatedNodes = syncSceneNodes(
        applyNodeChanges<SceneNodeData>(action.changes, state.nodes)
      );
      const { selectedNodeId, editingNodeId } = ensureValidNodeReferences(
        updatedNodes,
        state.selectedNodeId,
        state.editingNodeId
      );
      return {
        ...state,
        nodes: updatedNodes,
        selectedNodeId,
        editingNodeId,
      };
    }
    case 'EDGE_CHANGES_APPLIED': {
      return {
        ...state,
        edges: applyEdgeChanges(action.changes, state.edges),
      };
    }
    case 'EDGE_CONNECTED': {
      return {
        ...state,
        edges: addEdge({ ...action.connection, animated: true }, state.edges),
      };
    }
    case 'NODE_ADDED': {
      const nodeId = `${state.nextNodeId}`;
      const baseNode: SceneNode = {
        id: nodeId,
        position: getDefaultNodePosition(state.nodes, action.position),
        data: { title: `シーン ${nodeId}`, summary: '' },
        type: 'scene',
      };
      const nextNodes = [...state.nodes, syncSceneNodeData(baseNode)];
      return {
        ...state,
        nodes: nextNodes,
        nextNodeId: state.nextNodeId + 1,
      };
    }
    case 'NODE_DELETED': {
      const filteredNodes = state.nodes.filter((node) => node.id !== action.nodeId);
      const filteredEdges = state.edges.filter(
        (edge) => edge.source !== action.nodeId && edge.target !== action.nodeId
      );
      const { selectedNodeId, editingNodeId } = ensureValidNodeReferences(
        filteredNodes,
        state.selectedNodeId === action.nodeId ? null : state.selectedNodeId,
        state.editingNodeId === action.nodeId ? null : state.editingNodeId
      );
      return {
        ...state,
        nodes: filteredNodes,
        edges: filteredEdges,
        selectedNodeId,
        editingNodeId,
      };
    }
    case 'EDGE_REMOVED': {
      return {
        ...state,
        edges: state.edges.filter((edge) => edge.id !== action.edgeId),
      };
    }
    case 'NODE_TITLE_SUBMITTED': {
      const updatedNodes = state.nodes.map((node) =>
        node.id === action.nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                title: action.nextTitle,
                label: action.nextTitle,
              },
            }
          : node
      );
      const sanitizedNodes = syncSceneNodes(updatedNodes);
      return {
        ...state,
        nodes: sanitizedNodes,
        editingNodeId: null,
      };
    }
    case 'NODE_TITLE_CHANGED': {
      if (!state.nodes.some((node) => node.id === action.nodeId)) {
        return state;
      }
      const updatedNodes = state.nodes.map((node) =>
        node.id === action.nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                title: action.nextTitle,
                label: action.nextTitle,
              },
            }
          : node
      );
      return {
        ...state,
        nodes: updatedNodes,
      };
    }
    case 'NODE_SUMMARY_CHANGED': {
      if (!state.nodes.some((node) => node.id === action.nodeId)) {
        return state;
      }
      const updatedNodes = state.nodes.map((node) =>
        node.id === action.nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                summary: action.nextSummary,
              },
            }
          : node
      );
      return {
        ...state,
        nodes: updatedNodes,
      };
    }
    case 'SELECT_NODE': {
      if (action.nodeId === null) {
        return {
          ...state,
          selectedNodeId: null,
        };
      }
      const exists = state.nodes.some((node) => node.id === action.nodeId);
      return {
        ...state,
        selectedNodeId: exists ? action.nodeId : null,
      };
    }
    case 'BEGIN_EDITING': {
      const exists = state.nodes.some((node) => node.id === action.nodeId);
      return {
        ...state,
        editingNodeId: exists ? action.nodeId : state.editingNodeId,
      };
    }
    case 'CANCEL_EDITING': {
      return {
        ...state,
        editingNodeId: null,
      };
    }
    case 'APPLY_SCENE_SNAPSHOT': {
      const sanitizedNodes = syncSceneNodes(action.nodes);
      return {
        nodes: sanitizedNodes,
        edges: action.edges,
        selectedNodeId: null,
        editingNodeId: null,
        nextNodeId: getNextNodeIdValue(sanitizedNodes),
      };
    }
    default:
      return state;
  }
};
