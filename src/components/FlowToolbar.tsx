import type { FC } from 'react';

type FlowToolbarProps = {
  onNew: () => void;
  onSave: () => void;
  onLoad: () => void;
  onAddNode: () => void;
};

const FlowToolbar: FC<FlowToolbarProps> = ({ onNew, onSave, onLoad, onAddNode }) => (
  <header className="flex flex-wrap items-center gap-2">
    <h1 className="text-lg font-semibold">Novel Node Editor</h1>
    <div className="ml-auto flex flex-wrap gap-2">
      <button type="button" onClick={onNew}>
        新規
      </button>
      <button type="button" onClick={onSave}>
        保存
      </button>
      <button type="button" onClick={onLoad}>
        読み込み
      </button>
      <button type="button" onClick={onAddNode}>
        ノード追加
      </button>
    </div>
  </header>
);

export default FlowToolbar;
