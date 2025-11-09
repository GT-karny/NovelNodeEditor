import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { Edge } from 'reactflow';

import type { SceneNode } from '../types/scene';
import type { SceneSnapshot } from '../types/storage';
import { createSceneSnapshot, parseSceneSnapshot } from '../utils/sceneData';

const STORAGE_KEY = 'novel-node-editor-flow';

const safeAlert = (message: string) => {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
  }
};

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
  handleSaveToFile: () => void;
  handleLoadFromFile: (event: ChangeEvent<HTMLInputElement>) => void;
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

  const handleSaveToFile = useCallback(() => {
    try {
      const snapshot: SceneSnapshot = createSceneSnapshot(nodes, edges);
      const serializedSnapshot = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([serializedSnapshot], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'novel-node-editor-scene.json';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 0);
      closeContextMenu();
    } catch (error) {
      console.error('Failed to save flow to file', error);
      safeAlert('保存に失敗しました。もう一度お試しください。');
    }
  }, [closeContextMenu, edges, nodes]);

  const handleLoadFromFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const [file] = input.files ?? [];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const text = reader.result;

          if (typeof text !== 'string') {
            throw new Error('Unexpected file reader result.');
          }

          const rawSnapshot = JSON.parse(text) as SceneSnapshot;
          const parsedSnapshot = parseSceneSnapshot(rawSnapshot);

          if (!parsedSnapshot) {
            console.warn('Loaded scene snapshot is invalid or incompatible.');
            safeAlert('保存データの形式が古いか壊れています。ファイルを確認してください。');
            return;
          }

          applySceneSnapshot(parsedSnapshot.nodes, parsedSnapshot.edges);
        } catch (error) {
          console.error('Failed to load flow from file', error);
          safeAlert('保存データの読み込み中にエラーが発生しました。コンソールを確認してください。');
        } finally {
          input.value = '';
          closeContextMenu();
        }
      };

      reader.onerror = () => {
        console.error('Failed to read file', reader.error);
        safeAlert('ファイルの読み込み中にエラーが発生しました。別のファイルをお試しください。');
        input.value = '';
        closeContextMenu();
      };

      reader.readAsText(file);
    },
    [applySceneSnapshot, closeContextMenu]
  );

  return { handleNew, handleSaveToFile, handleLoadFromFile };
};

export default useSceneStorage;
