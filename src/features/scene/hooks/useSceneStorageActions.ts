import type { Edge } from 'reactflow';

import useSceneStorage from '../../../hooks/useSceneStorage';
import type { SceneNode } from '../../../types/scene';

interface UseSceneStorageActionsParams {
  nodes: SceneNode[];
  edges: Edge[];
  initialNodes: SceneNode[];
  initialEdges: Edge[];
  applySceneSnapshot: (nodes: SceneNode[], edges: Edge[]) => void;
}

const useSceneStorageActions = ({
  nodes,
  edges,
  initialNodes,
  initialEdges,
  applySceneSnapshot,
}: UseSceneStorageActionsParams) =>
  useSceneStorage({
    nodes,
    edges,
    initialNodes,
    initialEdges,
    applySceneSnapshot,
  });

export default useSceneStorageActions;
