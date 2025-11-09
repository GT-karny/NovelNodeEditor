import type { SceneNode } from '../../../types/scene';

export const getHighestNodeId = (nodesList: SceneNode[]): number =>
  nodesList.reduce((max, node) => {
    const parsedId = Number.parseInt(node.id, 10);
    return Number.isNaN(parsedId) ? max : Math.max(max, parsedId);
  }, 0);

export const getNextNodeIdValue = (nodesList: SceneNode[]): number => getHighestNodeId(nodesList) + 1;
