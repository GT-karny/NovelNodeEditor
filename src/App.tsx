import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Edge,
  ReactFlowProvider,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
  type OnSelectionChangeFunc,
  type XYPosition,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import FlowCanvas from './components/FlowCanvas';
import FlowContextMenu from './components/ContextMenu';
import FlowSidebar from './components/FlowSidebar';
import FlowToolbar from './components/FlowToolbar';
import SceneNodeComponent from './components/SceneNode';
import useSceneFlow from './hooks/useSceneFlow';
import type { SceneNode, SceneNodeData } from './types/scene';
import { normalizeToSceneNode, syncSceneNodes } from './utils/sceneData';

const STORAGE_KEY = 'novel-node-editor-flow';

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
  } = useSceneFlow({ initialNodes, initialEdges });
  const [contextMenu, setContextMenu] = useState<
    | {
        type: 'node';
        nodeId: string;
        position: { x: number; y: number };
      }
    | {
        type: 'canvas';
        position: { x: number; y: number };
        flowPosition: XYPosition;
      }
    | null
  >(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const nodeTypes = useMemo<NodeTypes>(() => ({ scene: SceneNodeComponent }), []);
  const { screenToFlowPosition } = useReactFlow<SceneNodeData>();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleNew = useCallback(() => {
    applySceneSnapshot(initialNodes, initialEdges);
    localStorage.removeItem(STORAGE_KEY);
    setContextMenu(null);
  }, [applySceneSnapshot]);

  const handleSave = useCallback(() => {
    const snapshot = JSON.stringify({ nodes: syncSceneNodes(nodes), edges });
    localStorage.setItem(STORAGE_KEY, snapshot);
  }, [nodes, edges]);

  const handleLoad = useCallback(() => {
    const snapshot = localStorage.getItem(STORAGE_KEY);
    if (!snapshot) return;
    try {
      const parsed = JSON.parse(snapshot) as Partial<{ nodes: Node[]; edges: Edge[] }>;
      const parsedNodes = Array.isArray(parsed.nodes)
        ? parsed.nodes.map((node) => normalizeToSceneNode(node))
        : syncSceneNodes(initialNodes);
      const parsedEdges = Array.isArray(parsed.edges) ? parsed.edges : initialEdges;

      applySceneSnapshot(parsedNodes, parsedEdges);
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to load flow from storage', error);
    }
  }, [applySceneSnapshot]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleDeleteNodeWithMenu = useCallback(
    (nodeId: string) => {
      handleDeleteNode(nodeId);
      closeContextMenu();
    },
    [closeContextMenu, handleDeleteNode]
  );

  const onNodeContextMenu = useCallback(
    (event: MouseEvent, node: SceneNode) => {
      event.preventDefault();
      setContextMenu({
        type: 'node',
        nodeId: node.id,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    []
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setContextMenu({
        type: 'canvas',
        position: { x: event.clientX, y: event.clientY },
        flowPosition,
      });
    },
    [screenToFlowPosition]
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

  useEffect(() => {
    if (!contextMenu) return undefined;
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu]);

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
        onSave={handleSave}
        onLoad={handleLoad}
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
      <FlowEditor />
    </ReactFlowProvider>
  );
}

export default App;
