import { useCallback } from 'react';
import type { Edge } from 'reactflow';

import type { SceneNode } from '../types/scene';
import type { SceneSnapshot } from '../types/storage';
import { createSceneSnapshot, parseSceneSnapshot, syncSceneNodes } from '../utils/sceneData';

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
    try {
      const snapshot: SceneSnapshot = createSceneSnapshot(nodes, edges);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      closeContextMenu();
    } catch (error) {
      console.error('Failed to save flow to storage', error);
      window.alert('保存に失敗しました。もう一度お試しください。');
    }
  }, [closeContextMenu, edges, nodes]);

  const handleLoad = useCallback(() => {
    const snapshot = localStorage.getItem(STORAGE_KEY);
    if (!snapshot) return;

    try {
      const parsed = parseSceneSnapshot(JSON.parse(snapshot));
      if (parsed) {
        applySceneSnapshot(parsed.nodes, parsed.edges);
      } else {
        applySceneSnapshot(syncSceneNodes(initialNodes), initialEdges);
      }
      closeContextMenu();
    } catch (error) {
      console.error('Failed to load flow from storage', error);
    }
  }, [applySceneSnapshot, closeContextMenu, initialEdges, initialNodes]);

  return { handleNew, handleSave, handleLoad };
};

export default useSceneStorage;
