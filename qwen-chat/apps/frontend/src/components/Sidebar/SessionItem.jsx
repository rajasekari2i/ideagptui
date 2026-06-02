import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { timeAgo } from '../../utils/timeAgo';
import ConfirmDialog from '../common/ConfirmDialog';

export default function SessionItem({ session, isActive, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== session.title) onRename(session.id, trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') { setEditValue(session.title); setEditing(false); }
  };

  return (
    <>
      <div
        onClick={() => !editing && onSelect(session.id)}
        onDoubleClick={() => setEditing(true)}
        className={`group relative flex flex-col px-3 py-2 cursor-pointer rounded-md mx-2 transition-colors ${
          isActive
            ? 'bg-gray-700 border-l-4 border-blue-500 pl-2'
            : 'hover:bg-gray-800 border-l-4 border-transparent pl-2'
        }`}
      >
        <div className="flex items-center justify-between">
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 text-gray-100 text-sm px-1 rounded w-full outline-none border border-blue-500"
            />
          ) : (
            <span className={`text-sm truncate max-w-[160px] ${isActive ? 'font-semibold text-gray-100' : 'text-gray-200'}`}>
              {session.title}
            </span>
          )}

          {!editing && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-600 text-gray-400 hover:text-gray-200 transition-opacity"
              >
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-20 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 w-32"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setEditing(true); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700"
                  >
                    <Pencil size={13} /> Rename
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setConfirmDelete(true); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-gray-400 truncate max-w-[160px]">
            {session.lastMessage ? session.lastMessage.slice(0, 60) : 'No messages yet'}
          </span>
          <span className="text-xs text-gray-500 shrink-0 ml-1">{timeAgo(session.updatedAt)}</span>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Chat"
          message={`Delete "${session.title}"? This cannot be undone.`}
          onConfirm={() => { setConfirmDelete(false); onDelete(session.id); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
