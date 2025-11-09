import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { type Edge, type NodeTypes, useReactFlow } from 'reactflow';

import SceneNodeComponent from '../../components/SceneNode';
import useSceneFlow from '../../hooks/useSceneFlow';
import type { SceneNode, SceneNodeData } from '../../types/scene';
import useSceneSidebarState from './hooks/useSceneSidebarState';
import useSceneContextMenu, {
  type UseSceneContextMenuReturn,
} from './hooks/useSceneContextMenu';
import useSceneStorageActions from './hooks/useSceneStorageActions';

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
  onPaneClick: UseSceneContextMenuReturn['onPaneClick'];
  onPaneContextMenu: UseSceneContextMenuReturn['onPaneContextMenu'];
  onNodeContextMenu: UseSceneContextMenuReturn['onNodeContextMenu'];
  onEdgeContextMenu: UseSceneContextMenuReturn['onEdgeContextMenu'];
  onNodeDoubleClick: UseSceneContextMenuReturn['onNodeDoubleClick'];
  onNodeClick: UseSceneContextMenuReturn['onNodeClick'];
  onSelectionChange: UseSceneContextMenuReturn['onSelectionChange'];
  handleAddNode: ReturnType<typeof useSceneFlow>['handleAddNode'];
  handleDeleteNode: ReturnType<typeof useSceneFlow>['handleDeleteNode'];
  removeEdge: ReturnType<typeof useSceneFlow>['removeEdge'];
  handleTitleChange: ReturnType<typeof useSceneFlow>['handleTitleChange'];
  handleSummaryChange: ReturnType<typeof useSceneFlow>['handleSummaryChange'];
  selectNode: ReturnType<typeof useSceneFlow>['selectNode'];
  beginEditing: ReturnType<typeof useSceneFlow>['beginEditing'];
  handleNew: ReturnType<typeof useSceneStorageActions>['handleNew'];
  handleSaveToFile: ReturnType<typeof useSceneStorageActions>['handleSaveToFile'];
  handleLoadFromFile: ReturnType<typeof useSceneStorageActions>['handleLoadFromFile'];
  handleLoadButtonClick: UseSceneContextMenuReturn['handleLoadButtonClick'];
  contextMenuConfig: UseSceneContextMenuReturn['contextMenuConfig'];
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
  const { isSidebarOpen, toggleSidebar } = useSceneSidebarState();

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

  const {
    onPaneClick,
    onPaneContextMenu,
    onNodeContextMenu,
    onEdgeContextMenu,
    onNodeDoubleClick,
    onNodeClick,
    onSelectionChange,
    handleLoadButtonClick,
    contextMenuConfig,
  } = useSceneContextMenu({
    screenToFlowPosition,
    nodes,
    beginEditing,
    selectNode,
    handleAddNode,
    handleDeleteNode,
    removeEdge,
  });

  const { handleNew, handleSaveToFile, handleLoadFromFile } = useSceneStorageActions({
    nodes,
    edges,
    initialNodes,
    initialEdges,
    applySceneSnapshot,
  });

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
