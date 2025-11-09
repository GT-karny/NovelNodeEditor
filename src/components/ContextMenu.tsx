import type { FC } from 'react';

type Position = { x: number; y: number };

type NodeMenuConfig = {
  type: 'node';
  position: Position;
  title: string;
  onOpen: () => void;
  onDelete: () => void;
};

type CanvasMenuConfig = {
  type: 'canvas';
  position: Position;
  onAddNode: () => void;
};

type FlowContextMenuProps = {
  menu: NodeMenuConfig | CanvasMenuConfig | null;
};

const FlowContextMenu: FC<FlowContextMenuProps> = ({ menu }) => {
  if (!menu) return null;

  if (menu.type === 'node') {
    return (
      <div
        className="fixed z-50 min-w-[160px] rounded border border-slate-600 bg-slate-800 py-2 text-sm text-slate-100 shadow-xl"
        style={{ top: menu.position.y, left: menu.position.x }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 pb-2 text-xs text-slate-400">{menu.title}</div>
        <button
          type="button"
          className="block w-full px-4 py-1 text-left hover:bg-slate-700"
          onClick={menu.onOpen}
        >
          シーン内容
        </button>
        <button
          type="button"
          className="block w-full px-4 py-1 text-left text-rose-300 hover:bg-rose-900/50"
          onClick={menu.onDelete}
        >
          削除
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 min-w-[160px] rounded border border-slate-600 bg-slate-800 py-2 text-sm text-slate-100 shadow-xl"
      style={{ top: menu.position.y, left: menu.position.x }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="block w-full px-4 py-1 text-left hover:bg-slate-700"
        onClick={menu.onAddNode}
      >
        ノードを追加
      </button>
    </div>
  );
};

export type { NodeMenuConfig, CanvasMenuConfig };
export default FlowContextMenu;
