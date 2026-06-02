import { useState } from 'react';
import { Plus } from 'lucide-react';
import SearchBar from './SearchBar';
import RecentChats from './RecentChats';
import SessionList from './SessionList';
import useSessionStore from '../../store/sessionStore';
import { useSessions } from '../../hooks/useSessions';

export default function Sidebar() {
  const [search, setSearch] = useState('');
  const { sessions, activeSessionId, handleNewChat, handleSelectSession, handleDeleteSession, handleRenameSession, fetchSessions } = useSessions();

  const handleSearch = (q) => {
    setSearch(q);
    fetchSessions(q || undefined);
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 flex flex-col h-full border-r border-gray-700">
      <div className="p-3 border-b border-gray-700">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <SearchBar value={search} onChange={handleSearch} />

      <div className="flex-1 overflow-y-auto py-2">
        {!search && (
          <RecentChats
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={handleSelectSession}
            onRename={handleRenameSession}
            onDelete={handleDeleteSession}
          />
        )}
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onRename={handleRenameSession}
          onDelete={handleDeleteSession}
        />
      </div>
    </aside>
  );
}
