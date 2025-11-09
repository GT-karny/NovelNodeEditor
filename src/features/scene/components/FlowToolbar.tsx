import { useRef, type ChangeEvent } from 'react';

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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const [file] = input.files ?? [];
    if (!file) {
      input.value = '';
      return;
    }

    try {
      await handleLoadFromFile(file);
    } catch (error) {
      console.error('Failed to load scene from file', error);
    } finally {
      // Allow selecting the same file multiple times by resetting the input.
      input.value = '';
    }
  };

  const handleSaveClick = () => {
    const { blob, filename } = handleSaveToFile();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="flex flex-wrap items-center gap-2">
      <h1 className="text-lg font-semibold">Novel Node Editor</h1>
      <div className="ml-auto flex flex-wrap gap-2">
        <button type="button" onClick={handleNew}>
          新規
        </button>
        <button type="button" onClick={handleSaveClick}>
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
        onChange={handleFileChange}
      />
    </header>
  );
};

export default FlowToolbar;
