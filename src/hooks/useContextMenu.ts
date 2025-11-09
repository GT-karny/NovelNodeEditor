import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import type { NodeMouseHandler, XYPosition } from 'reactflow';

import type { SceneNode } from '../types/scene';

type Position = { x: number; y: number };

type NodeContextMenuState = {
  type: 'node';
  nodeId: string;
  position: Position;
};

type CanvasContextMenuState = {
  type: 'canvas';
  position: Position;
  flowPosition: XYPosition;
};

type ContextMenuState = NodeContextMenuState | CanvasContextMenuState | null;

interface UseContextMenuParams {
  screenToFlowPosition: (position: Position) => XYPosition;
}

interface UseContextMenuReturn {
  contextMenu: ContextMenuState;
  closeContextMenu: () => void;
  onNodeContextMenu: NodeMouseHandler;
  onPaneContextMenu: (event: MouseEvent) => void;
}

const useContextMenu = ({ screenToFlowPosition }: UseContextMenuParams): UseContextMenuReturn => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const onNodeContextMenu = useCallback<NodeMouseHandler>((event, node: SceneNode) => {
    event.preventDefault();
    setContextMenu({
      type: 'node',
      nodeId: node.id,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

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

  return {
    contextMenu,
    closeContextMenu,
    onNodeContextMenu,
    onPaneContextMenu,
  };
};

export type { ContextMenuState, NodeContextMenuState, CanvasContextMenuState };
export default useContextMenu;
