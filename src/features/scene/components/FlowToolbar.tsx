import { useRef } from 'react';

import { useSceneFlowContext } from '../SceneFlowProvider';

const FlowToolbar = () => {
  const {
    handleNew,
    handleSaveToFile,
    handleLoadFromFile,
    handleAddNode,
    handleLoadButtonClick,
  } = useSceneFlowContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadClick = () => {
    handleLoadButtonClick();
    fileInputRef.current?.click();
  };

  return (
    <header className="flex flex-wrap items-center gap-2">
      <h1 className="text-lg font-semibold">Novel Node Editor</h1>
      <div className="ml-auto flex flex-wrap gap-2">
        <button type="button" onClick={handleNew}>
          新規
        </button>
        <button type="button" onClick={handleSaveToFile}>
          保存
        </button>
        <button type="button" onClick={handleLoadClick}>
          読み込み
        </button>
        <button type="button" onClick={() => handleAddNode()}>
          ノード追加
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="sr-only"
        onChange={handleLoadFromFile}
      />
    </header>
  );
};

export default FlowToolbar;
