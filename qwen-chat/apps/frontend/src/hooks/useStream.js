import { useRef, useCallback } from 'react';
import useChatStore from '../store/chatStore';
import useSessionStore from '../store/sessionStore';
import { stopStream as apiStopStream } from '../api/client';

export function useStream() {
  const abortRef = useRef(null);
  const { appendMessage, startStream, appendToken, finalizeStream, stopStream, activeSessionId } = useChatStore();
  const { refreshSession } = useSessionStore();

  const send = useCallback(
    async (userMessage) => {
      if (!activeSessionId) return;

      appendMessage({ id: userMessage.id, role: 'user', content: userMessage.content, createdAt: new Date().toISOString() });
      startStream();

      abortRef.current = new AbortController();

      try {
        const res = await fetch(`/api/sessions/${activeSessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: userMessage.content }),
          signal: abortRef.current.signal,
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalMsg = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') break;

            try {
              const event = JSON.parse(raw);
              if (event.type === 'token') appendToken(event.content);
              if (event.type === 'done') {
                finalMsg = {
                  id: event.messageId,
                  role: 'assistant',
                  content: useChatStore.getState().streamingContent,
                  tokensUsed: event.tokensUsed,
                  createdAt: new Date().toISOString(),
                };
              }
              if (event.type === 'error') {
                console.error('Stream error:', event.message);
              }
            } catch {
              // incomplete JSON line
            }
          }
        }

        if (finalMsg) {
          finalizeStream(finalMsg);
          refreshSession(activeSessionId, { lastMessage: finalMsg.content.slice(0, 60), updatedAt: finalMsg.createdAt });
        } else {
          stopStream();
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Fetch error:', err);
        stopStream();
      }
    },
    [activeSessionId, appendMessage, startStream, appendToken, finalizeStream, stopStream, refreshSession]
  );

  const abort = useCallback(async () => {
    abortRef.current?.abort();
    if (activeSessionId) {
      try {
        await apiStopStream(activeSessionId);
      } catch {}
    }
    stopStream();
  }, [activeSessionId, stopStream]);

  return { send, abort };
}
