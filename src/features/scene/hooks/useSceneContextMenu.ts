import { useCallback, useMemo } from 'react';
import type { MouseEvent } from 'react';
import type {
  Edge,
  NodeMouseHandler,
  OnSelectionChangeFunc,
  XYPosition,
} from 'reactflow';

import type { CanvasMenuConfig, NodeMenuConfig } from '../../../components/ContextMenu';
import useContextMenu from '../../../hooks/useContextMenu';
import type { SceneNode } from '../../../types/scene';

interface UseSceneContextMenuParams {
  screenToFlowPosition: (position: { x: number; y: number }) => XYPosition;
  nodes: SceneNode[];
  beginEditing: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  handleAddNode: (position?: XYPosition) => void;
  handleDeleteNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
}

interface UseSceneContextMenuReturn {
  onPaneClick: () => void;
  onPaneContextMenu: (event: MouseEvent) => void;
  onNodeContextMenu: NodeMouseHandler;
  onEdgeContextMenu: (event: MouseEvent, edge: Edge) => void;
  onNodeDoubleClick: NodeMouseHandler;
  onNodeClick: NodeMouseHandler;
  onSelectionChange: OnSelectionChangeFunc;
  handleLoadButtonClick: () => void;
  contextMenuConfig: NodeMenuConfig | CanvasMenuConfig | null;
}

const useSceneContextMenu = ({
  screenToFlowPosition,
  nodes,
  beginEditing,
  selectNode,
  handleAddNode,
  handleDeleteNode,
  removeEdge,
}: UseSceneContextMenuParams): UseSceneContextMenuReturn => {
  const { contextMenu, closeContextMenu, onNodeContextMenu, onPaneContextMenu } = useContextMenu({
    screenToFlowPosition,
  });

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

  const handleLoadButtonClick = useCallback(() => {
    closeContextMenu();
  }, [closeContextMenu]);

  return {
    onPaneClick,
    onPaneContextMenu,
    onNodeContextMenu,
    onEdgeContextMenu,
    onNodeDoubleClick,
    onNodeClick,
    onSelectionChange,
    handleLoadButtonClick,
    contextMenuConfig,
  };
};

export type { UseSceneContextMenuReturn };
export default useSceneContextMenu;
