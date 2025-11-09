import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MiniMap,
  Panel,
  ReactFlowProvider,
  type Node,
  type XYPosition,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { SceneNode, SceneNodeData } from './types/scene';
import SceneNodeComponent from './components/SceneNode';
import { normalizeToSceneNode, syncSceneNodes } from './utils/sceneData';
import useSceneFlow from './hooks/useSceneFlow';

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
  const nodeTypes = useMemo(() => ({ scene: SceneNodeComponent }), []);
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

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 text-slate-100">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Novel Node Editor</h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={handleNew}>
            新規
          </button>
          <button type="button" onClick={handleSave}>
            保存
          </button>
          <button type="button" onClick={handleLoad}>
            読み込み
          </button>
          <button type="button" onClick={() => handleAddNode()}>
            ノード追加
          </button>
        </div>
      </header>
      <div className="flex flex-1 gap-4">
        <div
          className="flex-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-800"
          style={{ height: '600px' }}
        >
          <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
              style={{ width: '100%', height: '100%', minHeight: 600 }}
              fitView
              proOptions={proOptions}
              nodes={flowNodes}
              edges={edges}
              selectionOnDrag
              panOnDrag={[2]}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeContextMenu={onEdgeContextMenu}
              onNodeDoubleClick={onNodeDoubleClick}
              nodeTypes={nodeTypes}
              onPaneClick={() => {
                closeContextMenu();
                selectNode(null);
              }}
              onPaneContextMenu={onPaneContextMenu}
              onSelectionChange={({ nodes: selectedNodes }) => {
                const primary = selectedNodes[0];
                selectNode(primary ? primary.id : null);
              }}
              onNodeClick={(_event, node) => {
                selectNode(node.id);
                closeContextMenu();
              }}
            >
            <MiniMap pannable zoomable />
            <Controls />
            <Background gap={24} size={2} color="#1f2937" />
            <Panel position="top-left">
              <p className="text-xs text-slate-300">
                ノードをドラッグで移動し、接続ハンドルをドラッグして線を作成できます。
              </p>
            </Panel>
            <Panel position="top-right">
              <button
                type="button"
                className="rounded border border-slate-600 bg-slate-800/80 p-2 text-xs text-slate-200 shadow transition hover:bg-slate-700"
                onClick={() => setIsSidebarOpen((v) => !v)}
                aria-label={isSidebarOpen ? 'サイドパネルを閉じる' : 'サイドパネルを開く'}
                title={isSidebarOpen ? 'サイドパネルを閉じる' : 'サイドパネルを開く'}
              >
                {isSidebarOpen ? '➡' : '⬅'}
              </button>
            </Panel>
            </ReactFlow>
          </div>
        </div>
        <aside
          className={`flex min-w-0 flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-[flex-basis,width,opacity,padding] duration-300 ease-in-out ${
            isSidebarOpen
              ? 'w-full basis-1/3 opacity-100'
              : 'w-0 basis-0 overflow-hidden p-0 opacity-0 pointer-events-none'
          }`}
        >
          <h2 className="text-sm font-semibold text-slate-200">シーン編集</h2>
          {selectedNode ? (
            <form className="flex flex-1 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-300" htmlFor="scene-editor-title">
                タイトル
                <input
                  id="scene-editor-title"
                  ref={titleInputRef}
                  className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow focus:border-sky-400 focus:outline-none"
                  value={selectedNode.data.title}
                  onChange={(event) => handleTitleInputChange(event.target.value)}
                  placeholder="シーンのタイトル"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-300" htmlFor="scene-editor-summary">
                概要
                <textarea
                  id="scene-editor-summary"
                  className="min-h-[160px] rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow focus:border-sky-400 focus:outline-none"
                  value={selectedNode.data.summary}
                  onChange={(event) => handleSummaryInputChange(event.target.value)}
                  placeholder="シーンの概要やメモを入力"
                />
              </label>
              <p className="text-[11px] text-slate-400">
                入力内容はノードに即時反映されます。
              </p>
            </form>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
              <p>編集したいノードを選択してください。</p>
              <p className="text-xs">選択するとタイトル入力欄に自動でフォーカスします。</p>
            </div>
          )}
        </aside>
      </div>
      {contextMenu?.type === 'node' && selectedContextNode ? (
        <div
          className="fixed z-50 min-w-[160px] rounded border border-slate-600 bg-slate-800 py-2 text-sm text-slate-100 shadow-xl"
          style={{ top: contextMenu.position.y, left: contextMenu.position.x }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-4 pb-2 text-xs text-slate-400">{selectedContextNode.data.title}</div>
          <button
            type="button"
            className="block w-full px-4 py-1 text-left hover:bg-slate-700"
            onClick={() => {
              beginEditing(selectedContextNode.id);
              closeContextMenu();
            }}
          >
            シーン内容
          </button>
          <button
            type="button"
            className="block w-full px-4 py-1 text-left text-rose-300 hover:bg-rose-900/50"
            onClick={() => handleDeleteNodeWithMenu(selectedContextNode.id)}
          >
            削除
          </button>
        </div>
      ) : null}
      {contextMenu?.type === 'canvas' ? (
        <div
          className="fixed z-50 min-w-[160px] rounded border border-slate-600 bg-slate-800 py-2 text-sm text-slate-100 shadow-xl"
          style={{ top: contextMenu.position.y, left: contextMenu.position.x }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="block w-full px-4 py-1 text-left hover:bg-slate-700"
            onClick={() => {
              handleAddNode(contextMenu.flowPosition);
              closeContextMenu();
            }}
          >
            ノードを追加
          </button>
        </div>
      ) : null}
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
