import type { FC, FormEvent, MutableRefObject } from 'react';

import { useSceneFlowContext } from '../SceneFlowProvider';

type FlowSidebarProps = {
  titleInputRef: MutableRefObject<HTMLInputElement | null>;
};

const FlowSidebar: FC<FlowSidebarProps> = ({ titleInputRef }) => {
  const { isSidebarOpen, selectedNode, handleTitleChange, handleSummaryChange } = useSceneFlowContext();

  return (
    <aside
      className={`flex min-w-0 flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-[flex-basis,width,opacity,padding] duration-300 ease-in-out ${
        isSidebarOpen
          ? 'w-full basis-1/3 opacity-100'
          : 'w-0 basis-0 overflow-hidden p-0 opacity-0 pointer-events-none'
      }`}
    >
      <h2 className="text-sm font-semibold text-slate-200">シーン編集</h2>
      {selectedNode ? (
        <form className="flex flex-1 flex-col gap-4" onSubmit={(event: FormEvent) => event.preventDefault()}>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-300" htmlFor="scene-editor-title">
            タイトル
            <input
              id="scene-editor-title"
              ref={titleInputRef}
              className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow focus:border-sky-400 focus:outline-none"
              value={selectedNode.data.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="シーンのタイトル"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-300" htmlFor="scene-editor-summary">
            概要
            <textarea
              id="scene-editor-summary"
              className="min-h-[160px] rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow focus:border-sky-400 focus:outline-none"
              value={selectedNode.data.summary}
              onChange={(event) => handleSummaryChange(event.target.value)}
              placeholder="シーンの概要やメモを入力"
            />
          </label>
          <p className="text-[11px] text-slate-400">入力内容はノードに即時反映されます。</p>
        </form>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
          <p>編集したいノードを選択してください。</p>
          <p className="text-xs">選択するとタイトル入力欄に自動でフォーカスします。</p>
        </div>
      )}
    </aside>
  );
};

export default FlowSidebar;
