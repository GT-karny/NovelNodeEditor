import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Edge } from 'reactflow';

import useSceneFlow from '../../../hooks/useSceneFlow';
import type { SceneNode } from '../../../types/scene';

const SceneFlowContext = createContext<ReturnType<typeof useSceneFlow> | null>(null);

interface SceneFlowProviderProps {
  initialNodes: SceneNode[];
  initialEdges: Edge[];
  children: ReactNode;
}

export const SceneFlowProvider = ({
  initialNodes,
  initialEdges,
  children,
}: SceneFlowProviderProps) => {
  const value = useSceneFlow({ initialNodes, initialEdges });
  const memoizedValue = useMemo(() => value, [value]);

  return <SceneFlowContext.Provider value={memoizedValue}>{children}</SceneFlowContext.Provider>;
};

export const useSceneFlowContext = () => {
  const context = useContext(SceneFlowContext);
  if (!context) {
    throw new Error('useSceneFlowContext must be used within a SceneFlowProvider');
  }
  return context;
};
