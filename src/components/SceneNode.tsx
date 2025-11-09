import { FormEvent, memo, useEffect, useMemo, useRef, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

import type { SceneNodeData } from '../types/scene';

const SceneNode = ({ id, data }: NodeProps<SceneNodeData>) => {
  const [titleInput, setTitleInput] = useState(data.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data.isEditing) {
      setTitleInput(data.title);
    }
  }, [data.isEditing, data.title]);

  useEffect(() => {
    if (data.isEditing) {
      const frame = requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [data.isEditing]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = titleInput.trim();
    if (trimmed.length > 0) {
      data.onSubmit?.(id, trimmed);
    }
  };

  const handleCancel = () => {
    setTitleInput(data.title);
    data.onCancel?.();
  };

  const summaryContent = useMemo(() => {
    const trimmed = data.summary.trim();
    if (trimmed.length === 0) {
      return '';
    }

    const lines = trimmed.split('\n');
    if (lines.length <= 2) {
      return trimmed;
    }

    const truncatedLines = lines.slice(0, 2);
    truncatedLines[1] = `${truncatedLines[1]}…`;
    return truncatedLines.join('\n');
  }, [data.summary]);

  const containerClassName = useMemo(() => {
    const classes = ['scene-node'];
    if (data.isEditing) {
      classes.push('scene-node--editing');
    } else {
      classes.push('scene-node--view');
      if (data.isSelected) {
        classes.push('scene-node--selected');
      }
    }
    return classes.join(' ');
  }, [data.isEditing, data.isSelected]);

  return (
    <div className={containerClassName}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      {data.isEditing ? (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-200" htmlFor={`scene-title-${id}`}>
            タイトル
            <input
              id={`scene-title-${id}`}
              ref={inputRef}
              className="w-full rounded border border-slate-500 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
              value={titleInput}
              onChange={(event) => setTitleInput(event.target.value)}
              placeholder="シーンのタイトル"
            />
          </label>
          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              className="rounded border border-transparent bg-slate-600 px-3 py-1 hover:bg-slate-500"
              onClick={handleCancel}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded border border-sky-400 bg-sky-500 px-3 py-1 text-slate-900 hover:bg-sky-400"
            >
              保存
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{data.title}</h3>
          {summaryContent.length > 0 ? (
            <p className="whitespace-pre-line text-xs text-slate-300">{summaryContent}</p>
          ) : (
            <p className="text-[11px] italic text-slate-400">概要は未設定です</p>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(SceneNode);
