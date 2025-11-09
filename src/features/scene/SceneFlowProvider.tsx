import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MouseEvent } from 'react';
import {
  type Edge,
  type NodeMouseHandler,
  type NodeTypes,
  type OnSelectionChangeFunc,
  useReactFlow,
} from 'reactflow';

import type { CanvasMenuConfig, NodeMenuConfig } from '../../components/ContextMenu';
import SceneNodeComponent from '../../components/SceneNode';
import useContextMenu from '../../hooks/useContextMenu';
import useSceneFlow from '../../hooks/useSceneFlow';
import useSceneStorage from '../../hooks/useSceneStorage';
import type { SceneNode, SceneNodeData } from '../../types/scene';

interface SceneFlowContextValue {
  nodes: SceneNode[];
  edges: Edge[];
  flowNodes: SceneNode[];
  selectedNode: SceneNode | null;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  nodeTypes: NodeTypes;
  proOptions: { hideAttribution: boolean };
  onNodesChange: ReturnType<typeof useSceneFlow>['onNodesChange'];
  onEdgesChange: ReturnType<typeof useSceneFlow>['onEdgesChange'];
  onConnect: ReturnType<typeof useSceneFlow>['onConnect'];
  onPaneClick: () => void;
  onPaneContextMenu: (event: MouseEvent) => void;
  onNodeContextMenu: NodeMouseHandler;
  onEdgeContextMenu: (event: MouseEvent, edge: Edge) => void;
  onNodeDoubleClick: NodeMouseHandler;
  onNodeClick: NodeMouseHandler;
  onSelectionChange: OnSelectionChangeFunc;
  handleAddNode: ReturnType<typeof useSceneFlow>['handleAddNode'];
  handleDeleteNode: ReturnType<typeof useSceneFlow>['handleDeleteNode'];
  removeEdge: ReturnType<typeof useSceneFlow>['removeEdge'];
  handleTitleChange: ReturnType<typeof useSceneFlow>['handleTitleChange'];
  handleSummaryChange: ReturnType<typeof useSceneFlow>['handleSummaryChange'];
  selectNode: ReturnType<typeof useSceneFlow>['selectNode'];
  beginEditing: ReturnType<typeof useSceneFlow>['beginEditing'];
  handleNew: ReturnType<typeof useSceneStorage>['handleNew'];
  handleSaveToFile: ReturnType<typeof useSceneStorage>['handleSaveToFile'];
  handleLoadFromFile: ReturnType<typeof useSceneStorage>['handleLoadFromFile'];
  handleLoadButtonClick: () => void;
  contextMenuConfig: NodeMenuConfig | CanvasMenuConfig | null;
}

const SceneFlowContext = createContext<SceneFlowContextValue | null>(null);

const initialNodes: SceneNode[] = [
  {
    id: '1',
    position: { x: 250, y: 50 },
    data: { title: 'はじめのノード', summary: '' },
    type: 'scene',
  },
];

const initialEdges: Edge[] = [];

const SceneFlowProvider = ({ children }: { children: ReactNode }) => {
  const { screenToFlowPosition } = useReactFlow<SceneNodeData>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);

  const {
    nodes,
    edges,
    flowNodes,
    selectedNode,
    selectedNodeId,
    editingNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddNode,
    handleDeleteNode,
    removeEdge,
    handleTitleChange,
    handleSummaryChange,
    selectNode,
    beginEditing,
    applySceneSnapshot,
  } = useSceneFlow({ initialNodes, initialEdges });

  const { contextMenu, closeContextMenu, onNodeContextMenu, onPaneContextMenu } = useContextMenu({
    screenToFlowPosition,
  });

  const { handleNew, handleSaveToFile, handleLoadFromFile } = useSceneStorage({
    nodes,
    edges,
    initialNodes,
    initialEdges,
    applySceneSnapshot,
    closeContextMenu,
  });

  const handleLoadButtonClick = useCallback(() => {
    closeContextMenu();
  }, [closeContextMenu]);

  const handleDeleteNodeWithMenu = useCallback(
    (nodeId: string) => {
      handleDeleteNode(nodeId);
      closeContextMenu();
    },
    [closeContextMenu, handleDeleteNode]
  );

  const onEdgeContextMenu = useCallback(
    (event: MouseEvent, edge: Edge) => {
      event.preventDefault();
      if (window.confirm('この接続線を削除しますか？')) {
        removeEdge(edge.id);
      }
    },
    [removeEdge]
  );

  const onNodeDoubleClick = useCallback<NodeMouseHandler>(
    (_event, node) => {
      beginEditing(node.id);
      selectNode(node.id);
      closeContextMenu();
    },
    [beginEditing, closeContextMenu, selectNode]
  );

  const onPaneClick = useCallback(() => {
    closeContextMenu();
    selectNode(null);
  }, [closeContextMenu, selectNode]);

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_event, node) => {
      selectNode(node.id);
      closeContextMenu();
    },
    [closeContextMenu, selectNode]
  );

  const onSelectionChange = useCallback<OnSelectionChangeFunc>(
    ({ nodes: selectedNodes }) => {
      const primary = selectedNodes[0];
      selectNode(primary ? primary.id : null);
    },
    [selectNode]
  );

  const selectedContextNode = useMemo(
    () =>
      contextMenu?.type === 'node'
        ? nodes.find((node) => node.id === contextMenu.nodeId) ?? null
        : null,
    [contextMenu, nodes]
  );

  const contextMenuConfig = useMemo<NodeMenuConfig | CanvasMenuConfig | null>(() => {
    if (contextMenu?.type === 'node' && selectedContextNode) {
      return {
        type: 'node',
        position: contextMenu.position,
        title: selectedContextNode.data.title,
        onOpen: () => {
          beginEditing(selectedContextNode.id);
          closeContextMenu();
        },
        onDelete: () => handleDeleteNodeWithMenu(selectedContextNode.id),
      } satisfies NodeMenuConfig;
    }

    if (contextMenu?.type === 'canvas') {
      return {
        type: 'canvas',
        position: contextMenu.position,
        onAddNode: () => {
          handleAddNode(contextMenu.flowPosition);
          closeContextMenu();
        },
      } satisfies CanvasMenuConfig;
    }

    return null;
  }, [
    beginEditing,
    closeContextMenu,
    contextMenu,
    handleAddNode,
    handleDeleteNodeWithMenu,
    selectedContextNode,
  ]);

  const nodeTypes = useMemo<NodeTypes>(() => ({ scene: SceneNodeComponent }), []);
  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  const value = useMemo<SceneFlowContextValue>(
    () => ({
      nodes,
      edges,
      flowNodes,
      selectedNode,
      selectedNodeId,
      editingNodeId,
      isSidebarOpen,
      toggleSidebar,
      nodeTypes,
      proOptions,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onPaneClick,
      onPaneContextMenu,
      onNodeContextMenu,
      onEdgeContextMenu,
      onNodeDoubleClick,
      onNodeClick,
      onSelectionChange,
      handleAddNode,
      handleDeleteNode,
      removeEdge,
      handleTitleChange,
      handleSummaryChange,
      selectNode,
      beginEditing,
      handleNew,
      handleSaveToFile,
      handleLoadFromFile,
      handleLoadButtonClick,
      contextMenuConfig,
    }),
    [
      beginEditing,
      contextMenuConfig,
      edges,
      flowNodes,
      handleAddNode,
      handleDeleteNode,
      handleLoadButtonClick,
      handleLoadFromFile,
      handleNew,
      handleSaveToFile,
      handleSummaryChange,
      handleTitleChange,
      isSidebarOpen,
      nodes,
      onConnect,
      onEdgesChange,
      onNodeClick,
      onNodeContextMenu,
      onNodeDoubleClick,
      onNodesChange,
      onPaneClick,
      onPaneContextMenu,
      onSelectionChange,
      onEdgeContextMenu,
      proOptions,
      removeEdge,
      selectedNode,
      selectedNodeId,
      editingNodeId,
      selectNode,
      toggleSidebar,
      nodeTypes,
    ]
  );

  return <SceneFlowContext.Provider value={value}>{children}</SceneFlowContext.Provider>;
};

const useSceneFlowContext = () => {
  const context = useContext(SceneFlowContext);
  if (!context) {
    throw new Error('useSceneFlowContext must be used within a SceneFlowProvider');
  }
  return context;
};

export type { SceneFlowContextValue };
export { SceneFlowProvider, useSceneFlowContext };
