import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MiniMap,
  Node,
  NodeChange,
  Panel,
  ReactFlowProvider,
  type XYPosition,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { SceneNode, SceneNodeData } from './types/scene';
import SceneNodeComponent from './components/SceneNode';

const STORAGE_KEY = 'novel-node-editor-flow';

const getHighestNodeId = (nodesList: Node[]): number =>
  nodesList.reduce((max, node) => {
    const parsedId = Number.parseInt(node.id, 10);
    return Number.isNaN(parsedId) ? max : Math.max(max, parsedId);
  }, 0);

const syncSceneNodeData = (node: SceneNode): SceneNode => {
  const { onSubmit, onCancel, isEditing, isSelected, ...restData } = node.data ?? {};
  return {
    ...node,
    data: {
      ...restData,
      label: restData?.title ?? '',
    } as SceneNodeData,
  };
};

const syncSceneNodes = (nodesList: SceneNode[]): SceneNode[] =>
  nodesList.map((node) => syncSceneNodeData(node));

const normalizeToSceneNode = (node: Node): SceneNode => {
  const rawData = (node.data ?? {}) as Partial<SceneNodeData> & Record<string, unknown>;
  const titleSource =
    typeof rawData.title === 'string' && rawData.title.length > 0
      ? rawData.title
      : typeof rawData.label === 'string' && rawData.label.length > 0
        ? rawData.label
        : `シーン ${node.id}`;
  const summarySource =
    typeof rawData.summary === 'string' ? rawData.summary : '';

  return syncSceneNodeData({
    ...node,
    data: {
      ...rawData,
      title: titleSource,
      summary: summarySource,
    },
    type: 'scene',
  });
};

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
  const [nodes, setNodes] = useState<SceneNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [nodeCount, setNodeCount] = useState(() => getHighestNodeId(initialNodes));
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
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

  useEffect(() => {
    setNodeCount((currentCount) => {
      const highestId = getHighestNodeId(nodes);
      return highestId > currentCount ? highestId : currentCount;
    });
  }, [nodes]);

  useEffect(() => {
    if (!selectedNodeId) return;
    const exists = nodes.some((node) => node.id === selectedNodeId);
    if (!exists) {
      setSelectedNodeId(null);
    }
  }, [nodes, selectedNodeId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => syncSceneNodes(applyNodeChanges<SceneNodeData>(changes, nds))),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  );

  const handleAddNode = useCallback((position?: XYPosition) => {
    setNodeCount((count) => {
      const nextIdNumber = count + 1;
      const nextId = `${nextIdNumber}`;
      setNodes((nds) => {
        const unsyncedNode: SceneNode = {
          id: nextId,
          position: {
            x: position?.x ?? 100 + nds.length * 80,
            y: position?.y ?? 100 + (nds.length % 4) * 80,
          },
          data: { title: `シーン ${nextId}`, summary: '' },
          type: 'scene',
        };
        return [...nds, syncSceneNodeData(unsyncedNode)];
      });
      return nextIdNumber;
    });
  }, []);

  const handleNew = useCallback(() => {
    setNodes(syncSceneNodes(initialNodes));
    setEdges(initialEdges);
    setNodeCount(getHighestNodeId(initialNodes));
    localStorage.removeItem(STORAGE_KEY);
    setEditingNodeId(null);
    setSelectedNodeId(null);
    setContextMenu(null);
  }, []);

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

      setNodes(parsedNodes);
      setEdges(parsedEdges);
      setNodeCount(getHighestNodeId(parsedNodes));
      setEditingNodeId(null);
      setSelectedNodeId(null);
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to load flow from storage', error);
    }
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setEditingNodeId((current) => (current === nodeId ? null : current));
      setSelectedNodeId((current) => (current === nodeId ? null : current));
      closeContextMenu();
    },
    [closeContextMenu]
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
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    []
  );

  const onNodeDoubleClick = useCallback(
    (_event: MouseEvent, node: SceneNode) => {
      setEditingNodeId(node.id);
      setSelectedNodeId(node.id);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleSubmitTitle = useCallback((nodeId: string, nextTitle: string) => {
    setNodes((nds) =>
      nds.map((node) =>
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

  const flowNodes = useMemo(() => {
    const synced = syncSceneNodes(nodes);
    return synced.map((node) => ({
      ...node,
      type: 'scene',
      data: {
        ...node.data,
        isEditing: node.id === editingNodeId,
        isSelected: node.id === selectedNodeId,
        onSubmit: handleSubmitTitle,
        onCancel: handleCancelEdit,
      },
    }));
  }, [nodes, editingNodeId, selectedNodeId, handleSubmitTitle, handleCancelEdit]);

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

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId]
  );

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((node) =>
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
      setNodes((nds) =>
        nds.map((node) =>
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
                setSelectedNodeId(null);
              }}
              onPaneContextMenu={onPaneContextMenu}
              onSelectionChange={({ nodes: selectedNodes }) => {
                const primary = selectedNodes[0];
                setSelectedNodeId(primary ? primary.id : null);
              }}
              onNodeClick={(_event, node) => {
                setSelectedNodeId(node.id);
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
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="シーンのタイトル"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-300" htmlFor="scene-editor-summary">
                概要
                <textarea
                  id="scene-editor-summary"
                  className="min-h-[160px] rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow focus:border-sky-400 focus:outline-none"
                  value={selectedNode.data.summary}
                  onChange={(event) => handleSummaryChange(event.target.value)}
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
              setEditingNodeId(selectedContextNode.id);
              closeContextMenu();
            }}
          >
            シーン内容
          </button>
          <button
            type="button"
            className="block w-full px-4 py-1 text-left text-rose-300 hover:bg-rose-900/50"
            onClick={() => handleDeleteNode(selectedContextNode.id)}
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
