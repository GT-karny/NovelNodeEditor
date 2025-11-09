import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import type { SceneNode, SceneNodeData } from '../types/scene';
import { syncSceneNodeData, syncSceneNodes } from '../utils/sceneData';

const getHighestNodeId = (nodesList: SceneNode[]): number =>
  nodesList.reduce((max, node) => {
    const parsedId = Number.parseInt(node.id, 10);
    return Number.isNaN(parsedId) ? max : Math.max(max, parsedId);
  }, 0);

const getNextNodeIdValue = (nodesList: SceneNode[]): number => getHighestNodeId(nodesList) + 1;

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
  const [nodes, setNodes] = useState<SceneNode[]>(() => syncSceneNodes(initialNodes));
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nextNodeIdRef = useRef<number>(getNextNodeIdValue(syncSceneNodes(initialNodes)));

  useEffect(() => {
    if (!selectedNodeId) return;
    const exists = nodes.some((node) => node.id === selectedNodeId);
    if (!exists) {
      setSelectedNodeId(null);
    }
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    if (!editingNodeId) return;
    const exists = nodes.some((node) => node.id === editingNodeId);
    if (!exists) {
      setEditingNodeId(null);
    }
  }, [nodes, editingNodeId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((current) => syncSceneNodes(applyNodeChanges<SceneNodeData>(changes, current))),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((current) => applyEdgeChanges(changes, current)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) => addEdge({ ...connection, animated: true }, current)),
    []
  );

  const handleAddNode = useCallback(
    (position?: XYPosition) => {
      const nextIdNumber = nextNodeIdRef.current;
      nextNodeIdRef.current += 1;
      const nextId = `${nextIdNumber}`;
      setNodes((currentNodes) => {
        const unsyncedNode: SceneNode = {
          id: nextId,
          position: {
            x: position?.x ?? 100 + currentNodes.length * 80,
            y: position?.y ?? 100 + (currentNodes.length % 4) * 80,
          },
          data: { title: `シーン ${nextId}`, summary: '' },
          type: 'scene',
        };
        return [...currentNodes, syncSceneNodeData(unsyncedNode)];
      });
    },
    []
  );

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setEditingNodeId((current) => (current === nodeId ? null : current));
    setSelectedNodeId((current) => (current === nodeId ? null : current));
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setEdges((current) => current.filter((edge) => edge.id !== edgeId));
  }, []);

  const handleSubmitTitle = useCallback((nodeId: string, nextTitle: string) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                title: nextTitle,
                label: nextTitle,
              },
            }
          : node
      )
    );
    setEditingNodeId(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      if (!selectedNodeId) return;
      setNodes((current) =>
        current.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  title: nextTitle,
                  label: nextTitle,
                },
              }
            : node
        )
      );
    },
    [selectedNodeId]
  );

  const handleSummaryChange = useCallback(
    (nextSummary: string) => {
      if (!selectedNodeId) return;
      setNodes((current) =>
        current.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  summary: nextSummary,
                },
              }
            : node
        )
      );
    },
    [selectedNodeId]
  );

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const beginEditing = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
  }, []);

  const applySceneSnapshot = useCallback((nextNodes: SceneNode[], nextEdges: Edge[]) => {
    const sanitizedNodes = syncSceneNodes(nextNodes);
    setNodes(sanitizedNodes);
    setEdges(nextEdges);
    setSelectedNodeId(null);
    setEditingNodeId(null);
    nextNodeIdRef.current = getNextNodeIdValue(sanitizedNodes);
  }, []);

  const flowNodes = useMemo(
    () =>
      syncSceneNodes(nodes).map((node) => ({
        ...node,
        type: 'scene',
        data: {
          ...node.data,
          isEditing: node.id === editingNodeId,
          isSelected: node.id === selectedNodeId,
          onSubmit: handleSubmitTitle,
          onCancel: handleCancelEdit,
        },
      })),
    [nodes, editingNodeId, selectedNodeId, handleSubmitTitle, handleCancelEdit]
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId]
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
