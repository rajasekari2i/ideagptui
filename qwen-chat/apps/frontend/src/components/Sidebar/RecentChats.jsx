import SessionItem from './SessionItem';

export default function RecentChats({ sessions, activeSessionId, onSelect, onRename, onDelete }) {
  const recent = sessions.slice(0, 5);
  if (!recent.length) return null;

  return (
    <div className="mb-2">
      <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Recent</p>
      {recent.map((s) => (
        <SessionItem
          key={s.id}
          session={s}
          isActive={s.id === activeSessionId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
      <div className="mx-4 mt-2 border-t border-gray-700" />
    </div>
  );
}
