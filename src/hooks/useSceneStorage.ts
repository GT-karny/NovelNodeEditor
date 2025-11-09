import { useCallback } from 'react';
import type { Edge, Node } from 'reactflow';

import type { SceneNode } from '../types/scene';
import { normalizeToSceneNode, syncSceneNodes } from '../utils/sceneData';

const STORAGE_KEY = 'novel-node-editor-flow';

interface UseSceneStorageParams {
  nodes: SceneNode[];
  edges: Edge[];
  initialNodes: SceneNode[];
  initialEdges: Edge[];
  applySceneSnapshot: (nodes: SceneNode[], edges: Edge[]) => void;
  closeContextMenu: () => void;
}

interface UseSceneStorageReturn {
  handleNew: () => void;
  handleSave: () => void;
  handleLoad: () => void;
}

const useSceneStorage = ({
  nodes,
  edges,
  initialNodes,
  initialEdges,
  applySceneSnapshot,
  closeContextMenu,
}: UseSceneStorageParams): UseSceneStorageReturn => {
  const handleNew = useCallback(() => {
    applySceneSnapshot(initialNodes, initialEdges);
    localStorage.removeItem(STORAGE_KEY);
    closeContextMenu();
  }, [applySceneSnapshot, closeContextMenu, initialEdges, initialNodes]);

  const handleSave = useCallback(() => {
    const snapshot = JSON.stringify({ nodes: syncSceneNodes(nodes), edges });
    localStorage.setItem(STORAGE_KEY, snapshot);
  }, [edges, nodes]);

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
      closeContextMenu();
    } catch (error) {
      console.error('Failed to load flow from storage', error);
    }
  }, [applySceneSnapshot, closeContextMenu, initialEdges, initialNodes]);

  return { handleNew, handleSave, handleLoad };
};

export default useSceneStorage;
