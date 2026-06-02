import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import useChatStore from '../../store/chatStore';

export default function MessageThread() {
  const { messages, streaming, streamingContent } = useChatStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (!messages.length && !streaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🤖</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Qwen3-Coder</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Your local AI coding assistant. Ask anything — code, debugging, architecture, explanations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} isStreaming={false} />
      ))}
      {streaming && (
        <MessageBubble
          message={{ id: 'streaming', role: 'assistant', content: streamingContent }}
          isStreaming={true}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
