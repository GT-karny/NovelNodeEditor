import { useEffect, useRef } from 'react';

import FlowContextMenu from '../../components/ContextMenu';
import FlowCanvas from './components/FlowCanvas';
import FlowSidebar from './components/FlowSidebar';
import FlowToolbar from './components/FlowToolbar';
import { useSceneFlowContext } from './SceneFlowProvider';

const SceneEditorLayout = () => {
  const { contextMenuConfig, selectedNode, isSidebarOpen } = useSceneFlowContext();

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedNode || !isSidebarOpen) return undefined;

    const frame = requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedNode?.id, isSidebarOpen]);

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 text-slate-100">
      <FlowToolbar />
      <div className="flex flex-1 gap-4">
        <FlowCanvas />
        <FlowSidebar titleInputRef={titleInputRef} />
      </div>
      <FlowContextMenu menu={contextMenuConfig} />
    </div>
  );
};

export default SceneEditorLayout;
