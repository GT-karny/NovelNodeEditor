import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { SceneNode, SceneNodeData } from './types/scene';

const STORAGE_KEY = 'novel-node-editor-flow';

const getHighestNodeId = (nodesList: Node[]): number =>
  nodesList.reduce((max, node) => {
    const parsedId = Number.parseInt(node.id, 10);
    return Number.isNaN(parsedId) ? max : Math.max(max, parsedId);
  }, 0);

const syncSceneNodeData = (node: SceneNode): SceneNode => ({
  ...node,
  data: {
    ...node.data,
    label: node.data.title,
  },
});

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
  });
};

const initialNodes: SceneNode[] = syncSceneNodes([
  {
    id: '1',
    position: { x: 250, y: 50 },
    data: { title: 'はじめのノード', summary: '' },
    type: 'default',
  },
]);

const initialEdges: Edge[] = [];

function App() {
  const [nodes, setNodes] = useState<SceneNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [nodeCount, setNodeCount] = useState(() => getHighestNodeId(initialNodes));

  useEffect(() => {
    setNodeCount((currentCount) => {
      const highestId = getHighestNodeId(nodes);
      return highestId > currentCount ? highestId : currentCount;
    });
  }, [nodes]);

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

  const handleAddNode = useCallback(() => {
    setNodeCount((count) => {
      const nextIdNumber = count + 1;
      const nextId = `${nextIdNumber}`;
      setNodes((nds) => {
        const unsyncedNode: SceneNode = {
          id: nextId,
          position: {
            x: 100 + nds.length * 80,
            y: 100 + (nds.length % 4) * 80,
          },
          data: { title: `シーン ${nextId}`, summary: '' },
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
    } catch (error) {
      console.error('Failed to load flow from storage', error);
    }
  }, []);

  const onNodeContextMenu = useCallback(
    (event: MouseEvent, node: SceneNode) => {
      event.preventDefault();
      if (window.confirm(`ノード "${node.data?.title ?? node.id}" を削除しますか？`)) {
        setNodes((nds) => nds.filter((n) => n.id !== node.id));
        setEdges((eds) => eds.filter((edge) => edge.source !== node.id && edge.target !== node.id));
      }
    },
    []
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

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

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
          <button type="button" onClick={handleAddNode}>
            ノード追加
          </button>
        </div>
      </header>
      <div
        className="flex-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-800"
        style={{ height: '600px' }}
      >
        <div style={{ width: '100%', height: '100%' }}>
          <ReactFlow
            style={{ width: '100%', height: '100%', minHeight: 600 }}
            fitView
            proOptions={proOptions}
            nodes={syncSceneNodes(nodes)}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
          >
          <MiniMap pannable zoomable />
          <Controls />
          <Background gap={24} size={2} color="#1f2937" />
          <Panel position="top-left">
            <p className="text-xs text-slate-300">
              ノードをドラッグで移動し、接続ハンドルをドラッグして線を作成できます。
            </p>
          </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default App;
