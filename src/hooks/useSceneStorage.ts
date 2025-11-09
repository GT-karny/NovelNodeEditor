import { useCallback } from 'react';
import type { Edge } from 'reactflow';

import type { SceneNode } from '../types/scene';
import type { SceneSnapshot } from '../types/storage';
import { createSceneSnapshot, parseSceneSnapshot } from '../features/scene/domain';

const STORAGE_KEY = 'novel-node-editor-flow';

interface UseSceneStorageParams {
  nodes: SceneNode[];
  edges: Edge[];
  initialNodes: SceneNode[];
  initialEdges: Edge[];
  applySceneSnapshot: (nodes: SceneNode[], edges: Edge[]) => void;
}

interface SceneSnapshotDownloadPayload {
  blob: Blob;
  filename: string;
}

interface UseSceneStorageReturn {
  handleNew: () => void;
  handleSaveToFile: () => SceneSnapshotDownloadPayload;
  handleLoadFromFile: (file: File) => Promise<void>;
}

const useSceneStorage = ({
  nodes,
  edges,
  initialNodes,
  initialEdges,
  applySceneSnapshot,
}: UseSceneStorageParams): UseSceneStorageReturn => {
  const handleNew = useCallback(() => {
    applySceneSnapshot(initialNodes, initialEdges);
    localStorage.removeItem(STORAGE_KEY);
  }, [applySceneSnapshot, initialEdges, initialNodes]);

  const handleSaveToFile = useCallback(() => {
    const blob = saveSnapshotToBlob(nodes, edges);

    return {
      blob,
      filename: SCENE_SNAPSHOT_DOWNLOAD_FILENAME,
    };
  }, [edges, nodes]);

  const handleLoadFromFile = useCallback(
    async (file: File) => {
      const snapshot = await parseSnapshotFile(file);
      applySceneSnapshot(snapshot.nodes, snapshot.edges);
    },
    [applySceneSnapshot],
  );

  return { handleNew, handleSaveToFile, handleLoadFromFile };
};

export default useSceneStorage;
