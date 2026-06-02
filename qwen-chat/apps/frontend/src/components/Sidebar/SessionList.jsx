import { groupByDate } from '../../utils/timeAgo';
import SessionItem from './SessionItem';

export default function SessionList({ sessions, activeSessionId, onSelect, onRename, onDelete }) {
  const groups = groupByDate(sessions);

  const nonEmpty = Object.entries(groups).filter(([, items]) => items.length > 0);

  if (!nonEmpty.length) {
    return <p className="px-4 py-6 text-sm text-gray-500 text-center">No chats yet</p>;
  }

  return (
    <div>
      {nonEmpty.map(([label, items]) => (
        <div key={label} className="mb-2">
          <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
          {items.map((s) => (
            <SessionItem
              key={s.id}
              session={s}
              isActive={s.id === activeSessionId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
