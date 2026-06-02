import { create } from 'zustand';
import { getSessions, createSession, deleteSession, updateSession } from '../api/client';

const useSessionStore = create((set, get) => ({
  sessions: [],
  loading: false,
  error: null,

  fetchSessions: async (q) => {
    set({ loading: true, error: null });
    try {
      const sessions = await getSessions(q);
      set({ sessions, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addSession: async (title) => {
    const session = await createSession(title);
    set((s) => ({ sessions: [session, ...s.sessions] }));
    return session;
  },

  removeSession: async (id) => {
    await deleteSession(id);
    set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }));
  },

  renameSession: async (id, title) => {
    const updated = await updateSession(id, { title });
    set((s) => ({
      sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, title: updated.title } : sess)),
    }));
    return updated;
  },

  refreshSession: (id, patch) => {
    set((s) => ({
      sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, ...patch } : sess)),
    }));
  },
}));

export default useSessionStore;
