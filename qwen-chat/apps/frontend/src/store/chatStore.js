import { create } from 'zustand';
import { getSession, updateSession } from '../api/client';

const useChatStore = create((set, get) => ({
  activeSessionId: null,
  session: null,
  messages: [],
  streaming: false,
  streamingContent: '',
  theme: 'dark',

  setActiveSession: async (id) => {
    if (!id) {
      set({ activeSessionId: null, session: null, messages: [] });
      return;
    }
    set({ activeSessionId: id, messages: [], streaming: false, streamingContent: '' });
    try {
      const session = await getSession(id);
      set({ session, messages: session.messages || [] });
    } catch (err) {
      set({ session: null, messages: [] });
    }
  },

  appendMessage: (message) => {
    set((s) => ({ messages: [...s.messages, message] }));
  },

  startStream: () => {
    set({ streaming: true, streamingContent: '' });
  },

  appendToken: (token) => {
    set((s) => ({ streamingContent: s.streamingContent + token }));
  },

  finalizeStream: (assistantMsg) => {
    set((s) => ({
      streaming: false,
      streamingContent: '',
      messages: [...s.messages, assistantMsg],
    }));
  },

  stopStream: () => {
    set({ streaming: false });
  },

  removeMessagesFrom: (messageId) => {
    set((s) => {
      const idx = s.messages.findIndex((m) => m.id === messageId);
      return { messages: idx >= 0 ? s.messages.slice(0, idx) : s.messages };
    });
  },

  updateSessionSettings: async (patch) => {
    const { activeSessionId, session } = get();
    if (!activeSessionId) return;
    const updated = await updateSession(activeSessionId, patch);
    set({ session: { ...session, ...updated } });
  },

  toggleTheme: () => {
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    });
  },
}));

export default useChatStore;
