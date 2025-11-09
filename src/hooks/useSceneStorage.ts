import { useCallback } from 'react';
import type { Edge } from 'reactflow';

import type { SceneNode } from '../types/scene';
import { createSceneSnapshot, parseSceneSnapshot, syncSceneNodes } from '../utils/sceneData';
import type { SceneSnapshot } from '../types/storage';

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
    const snapshot = createSceneSnapshot(nodes, edges);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [edges, nodes]);

  const handleLoad = useCallback(() => {
    const serializedSnapshot = localStorage.getItem(STORAGE_KEY);

    if (!serializedSnapshot) {
      console.info('No saved scene snapshot found in storage.');
      return;
    }

    try {
      const rawSnapshot = JSON.parse(serializedSnapshot) as SceneSnapshot;
      const parsedSnapshot = parseSceneSnapshot(rawSnapshot);

      if (!parsedSnapshot) {
        console.warn('Stored scene snapshot is invalid or incompatible. Resetting to initial state.');
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('保存データの形式が古いか壊れています。初期状態に戻しました。');
        }
        applySceneSnapshot(syncSceneNodes(initialNodes), initialEdges);
        closeContextMenu();
        return;
      }

      applySceneSnapshot(parsedSnapshot.nodes, parsedSnapshot.edges);
      closeContextMenu();
    } catch (error) {
      console.error('Failed to load flow from storage', error);
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('保存データの読み込み中にエラーが発生しました。コンソールを確認してください。');
      }
    }
  }, [applySceneSnapshot, closeContextMenu, initialEdges, initialNodes]);

  return { handleNew, handleSave, handleLoad };
};

export default useSceneStorage;
