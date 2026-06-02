import { useEffect } from 'react';
import useSessionStore from '../store/sessionStore';
import useChatStore from '../store/chatStore';

export function useSessions() {
  const { sessions, loading, fetchSessions, addSession, removeSession, renameSession } = useSessionStore();
  const { activeSessionId, setActiveSession } = useChatStore();

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleNewChat = async () => {
    const session = await addSession('New Chat');
    setActiveSession(session.id);
  };

  const handleSelectSession = (id) => {
    if (id !== activeSessionId) setActiveSession(id);
  };

  const handleDeleteSession = async (id) => {
    await removeSession(id);
    if (id === activeSessionId) {
      const remaining = sessions.filter((s) => s.id !== id);
      setActiveSession(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRenameSession = async (id, title) => {
    await renameSession(id, title);
  };

  return {
    sessions,
    loading,
    activeSessionId,
    handleNewChat,
    handleSelectSession,
    handleDeleteSession,
    handleRenameSession,
    fetchSessions,
  };
}
