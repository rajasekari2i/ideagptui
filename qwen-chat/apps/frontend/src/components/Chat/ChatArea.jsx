import { Settings, Sun, Moon } from 'lucide-react';
import MessageThread from './MessageThread';
import Composer from './Composer';
import useChatStore from '../../store/chatStore';

export default function ChatArea({ onOpenSettings }) {
  const { session, activeSessionId, theme, toggleTheme } = useChatStore();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-700 bg-gray-800 shrink-0">
        <h1 className="text-base font-semibold text-gray-100 truncate">
          {session?.title || (activeSessionId ? 'Loading...' : 'Qwen3-Coder Chat')}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {activeSessionId && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </header>

      <MessageThread />
      <Composer />
    </div>
  );
}
