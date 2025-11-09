import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import FlowCanvas from './components/FlowCanvas';
import FlowContextMenu from './components/ContextMenu';
import FlowSidebar from './components/FlowSidebar';
import FlowToolbar from './components/FlowToolbar';
import SceneNodeComponent from './components/SceneNode';
import useContextMenu from './hooks/useContextMenu';
import useSceneStorage from './hooks/useSceneStorage';
import {
  SceneFlowProvider,
  useSceneFlowContext,
} from './features/scene/context/SceneFlowProvider';
import type { SceneNode, SceneNodeData } from './types/scene';
import { syncSceneNodes } from './features/scene/domain';

const initialNodes: SceneNode[] = syncSceneNodes([
  {
    id: '1',
    position: { x: 250, y: 50 },
    data: { title: 'はじめのノード', summary: '' },
    type: 'scene',
  },
]);

const initialEdges: Edge[] = [];

function FlowEditor() {
  const {
    nodes,
    edges,
    flowNodes,
    selectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddNode,
    handleDeleteNode,
    handleTitleChange: updateSelectedNodeTitle,
    handleSummaryChange: updateSelectedNodeSummary,
    selectNode,
    beginEditing,
    removeEdge,
    applySceneSnapshot,
  } = useSceneFlowContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const nodeTypes = useMemo<NodeTypes>(() => ({ scene: SceneNodeComponent }), []);
  const { screenToFlowPosition } = useReactFlow<SceneNodeData>();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const onNodeDoubleClick = useCallback(
    (_event: MouseEvent, node: SceneNode) => {
      beginEditing(node.id);
      selectNode(node.id);
      closeContextMenu();
    },
    [beginEditing, closeContextMenu, selectNode]
  );

  const selectedContextNode = useMemo(
    () =>
      contextMenu?.type === 'node'
        ? nodes.find((node) => node.id === contextMenu.nodeId) ?? null
        : null,
    [contextMenu, nodes]
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  const handleTitleInputChange = useCallback(
    (nextTitle: string) => {
      updateSelectedNodeTitle(nextTitle);
    },
    [updateSelectedNodeTitle]
  );

  const handleSummaryInputChange = useCallback(
    (nextSummary: string) => {
      updateSelectedNodeSummary(nextSummary);
    },
    [updateSelectedNodeSummary]
  );

  useEffect(() => {
    if (!selectedNode || !isSidebarOpen) return undefined;
    const frame = requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedNode?.id, isSidebarOpen]);

  const handlePaneClick = useCallback(() => {
    closeContextMenu();
    selectNode(null);
  }, [closeContextMenu, selectNode]);

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_event, node) => {
      selectNode(node.id);
      closeContextMenu();
    },
    [closeContextMenu, selectNode]
  );

  const handleSelectionChange = useCallback<OnSelectionChangeFunc>(
    ({ nodes: selectedNodes }) => {
      const primary = selectedNodes[0];
      selectNode(primary ? primary.id : null);
    },
    [selectNode]
  );

  const contextMenuConfig = useMemo(() => {
    if (contextMenu?.type === 'node' && selectedContextNode) {
      return {
        type: 'node' as const,
        position: contextMenu.position,
        title: selectedContextNode.data.title,
        onOpen: () => {
          beginEditing(selectedContextNode.id);
          closeContextMenu();
        },
        onDelete: () => handleDeleteNodeWithMenu(selectedContextNode.id),
      };
    }

    if (contextMenu?.type === 'canvas') {
      return {
        type: 'canvas' as const,
        position: contextMenu.position,
        onAddNode: () => {
          handleAddNode(contextMenu.flowPosition);
          closeContextMenu();
        },
      };
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

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 text-slate-100">
      <FlowToolbar
        onNew={handleNew}
        onSave={handleSaveToFile}
        onLoad={handleLoadButtonClick}
        onFileSelected={handleLoadFromFile}
        fileInputRef={fileInputRef}
        onAddNode={() => handleAddNode()}
      />
      <div className="flex flex-1 gap-4">
        <FlowCanvas
          proOptions={proOptions}
          nodes={flowNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeClick={handleNodeClick}
          onSelectionChange={handleSelectionChange}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((value) => !value)}
        />
        <FlowSidebar
          isSidebarOpen={isSidebarOpen}
          selectedNode={selectedNode}
          titleInputRef={titleInputRef}
          onTitleChange={handleTitleInputChange}
          onSummaryChange={handleSummaryInputChange}
        />
      </div>
      <FlowContextMenu menu={contextMenuConfig} />
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <SceneFlowProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <FlowEditor />
      </SceneFlowProvider>
    </ReactFlowProvider>
  );
}

export default App;
