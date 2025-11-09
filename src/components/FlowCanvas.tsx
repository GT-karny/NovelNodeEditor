import type { FC, MouseEvent as ReactMouseEvent } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  type Edge,
  type NodeMouseHandler,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeTypes,
  type OnSelectionChangeFunc,
  type ProOptions,
} from 'reactflow';

import type { SceneNode, SceneNodeData } from '../types/scene';

type FlowCanvasProps = {
  proOptions: ProOptions;
  nodes: SceneNode[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onPaneClick: () => void;
  onPaneContextMenu: (event: ReactMouseEvent) => void;
  onNodeContextMenu: NodeMouseHandler;
  onEdgeContextMenu: (event: ReactMouseEvent, edge: Edge) => void;
  onNodeDoubleClick: NodeMouseHandler;
  onNodeClick: NodeMouseHandler;
  onSelectionChange: OnSelectionChangeFunc;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

const FlowCanvas: FC<FlowCanvasProps> = ({
  proOptions,
  nodes,
  edges,
  nodeTypes,
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
  isSidebarOpen,
  onToggleSidebar,
}) => (
  <div
    className="flex-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-800"
    style={{ height: '600px' }}
  >
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        style={{ width: '100%', height: '100%', minHeight: 600 }}
        fitView
        proOptions={proOptions}
        nodes={nodes}
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
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onSelectionChange={onSelectionChange}
        onNodeClick={onNodeClick}
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
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'サイドパネルを閉じる' : 'サイドパネルを開く'}
            title={isSidebarOpen ? 'サイドパネルを閉じる' : 'サイドパネルを開く'}
          >
            {isSidebarOpen ? '➡' : '⬅'}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  </div>
);

export default FlowCanvas;
