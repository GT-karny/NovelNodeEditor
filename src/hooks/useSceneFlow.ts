import { useCallback, useMemo, useReducer } from 'react';
import {
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from 'reactflow';

import type { SceneNode } from '../types/scene';
import {
  initializeSceneFlowState,
  sceneFlowReducer,
} from '../features/scene/state/sceneFlowReducer';
import {
  selectEdges,
  selectEditingNodeId,
  selectFlowNodes,
  selectNodes,
  selectSelectedNode,
  selectSelectedNodeId,
} from '../features/scene/state/sceneFlowSelectors';

interface UseSceneFlowParams {
  initialNodes: SceneNode[];
  initialEdges: Edge[];
}

interface SceneFlowHandlers {
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  handleAddNode: (position?: XYPosition) => void;
  handleDeleteNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  handleSubmitTitle: (nodeId: string, nextTitle: string) => void;
  handleCancelEdit: () => void;
  handleTitleChange: (nextTitle: string) => void;
  handleSummaryChange: (nextSummary: string) => void;
  selectNode: (nodeId: string | null) => void;
  beginEditing: (nodeId: string) => void;
  applySceneSnapshot: (nextNodes: SceneNode[], nextEdges: Edge[]) => void;
}

interface UseSceneFlowReturn extends SceneFlowHandlers {
  nodes: SceneNode[];
  edges: Edge[];
  flowNodes: SceneNode[];
  selectedNodeId: string | null;
  editingNodeId: string | null;
  selectedNode: SceneNode | null;
}

const useSceneFlow = ({ initialNodes, initialEdges }: UseSceneFlowParams): UseSceneFlowReturn => {
  const [state, dispatch] = useReducer(
    sceneFlowReducer,
    { nodes: initialNodes, edges: initialEdges },
    initializeSceneFlowState
  );

  const nodes = selectNodes(state);
  const edges = selectEdges(state);
  const selectedNodeId = selectSelectedNodeId(state);
  const editingNodeId = selectEditingNodeId(state);

  const selectedNode = useMemo(
    () => selectSelectedNode(nodes, selectedNodeId),
    [nodes, selectedNodeId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => dispatch({ type: 'NODE_CHANGES_APPLIED', changes }),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => dispatch({ type: 'EDGE_CHANGES_APPLIED', changes }),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => dispatch({ type: 'EDGE_CONNECTED', connection }),
    []
  );

  const handleAddNode = useCallback(
    (position?: XYPosition) => dispatch({ type: 'NODE_ADDED', position }),
    []
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => dispatch({ type: 'NODE_DELETED', nodeId }),
    []
  );

  const removeEdge = useCallback(
    (edgeId: string) => dispatch({ type: 'EDGE_REMOVED', edgeId }),
    []
  );

  const handleSubmitTitle = useCallback(
    (nodeId: string, nextTitle: string) =>
      dispatch({ type: 'NODE_TITLE_SUBMITTED', nodeId, nextTitle }),
    []
  );

  const handleCancelEdit = useCallback(
    () => dispatch({ type: 'CANCEL_EDITING' }),
    []
  );

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      if (!selectedNodeId) return;
      dispatch({ type: 'NODE_TITLE_CHANGED', nodeId: selectedNodeId, nextTitle });
    },
    [selectedNodeId]
  );

  const handleSummaryChange = useCallback(
    (nextSummary: string) => {
      if (!selectedNodeId) return;
      dispatch({ type: 'NODE_SUMMARY_CHANGED', nodeId: selectedNodeId, nextSummary });
    },
    [selectedNodeId]
  );

  const selectNode = useCallback(
    (nodeId: string | null) => dispatch({ type: 'SELECT_NODE', nodeId }),
    []
  );

  const beginEditing = useCallback(
    (nodeId: string) => dispatch({ type: 'BEGIN_EDITING', nodeId }),
    []
  );

  const applySceneSnapshot = useCallback(
    (nextNodes: SceneNode[], nextEdges: Edge[]) =>
      dispatch({ type: 'APPLY_SCENE_SNAPSHOT', nodes: nextNodes, edges: nextEdges }),
    []
  );

  const flowNodes = useMemo(
    () =>
      selectFlowNodes(nodes, selectedNodeId, editingNodeId, {
        onSubmit: handleSubmitTitle,
        onCancel: handleCancelEdit,
      }),
    [nodes, selectedNodeId, editingNodeId, handleSubmitTitle, handleCancelEdit]
  );

  return {
    nodes,
    edges,
    flowNodes,
    selectedNodeId,
    editingNodeId,
    selectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddNode,
    handleDeleteNode,
    removeEdge,
    handleSubmitTitle,
    handleCancelEdit,
    handleTitleChange,
    handleSummaryChange,
    selectNode,
    beginEditing,
    applySceneSnapshot,
  };
};

export default useSceneFlow;
