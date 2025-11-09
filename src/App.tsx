import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import SceneEditorLayout from './features/scene/SceneEditorLayout';
import { SceneFlowProvider } from './features/scene/SceneFlowProvider';

function App() {
  return (
    <ReactFlowProvider>
      <SceneFlowProvider>
        <SceneEditorLayout />
      </SceneFlowProvider>
    </ReactFlowProvider>
  );
}

export default App;
