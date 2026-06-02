import { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import useChatStore from '../../store/chatStore';
import { useStream } from '../../hooks/useStream';

export default function Composer() {
  const [text, setText] = useState('');
  const { streaming, activeSessionId } = useChatStore();
  const { send, abort } = useStream();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSend = () => {
    const content = text.trim();
    if (!content || streaming || !activeSessionId) return;
    setText('');
    send({ id: `user-${Date.now()}`, content });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-700 p-4">
      <div className="max-w-[720px] mx-auto flex items-end gap-3 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeSessionId ? 'Type a message... (Enter to send, Shift+Enter for newline)' : 'Select or create a chat to start'}
          disabled={!activeSessionId || streaming}
          rows={1}
          className="flex-1 bg-transparent text-gray-100 text-sm placeholder-gray-500 resize-none outline-none leading-relaxed disabled:opacity-50"
        />
        {streaming ? (
          <button
            onClick={abort}
            className="shrink-0 p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
            title="Stop generation"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() || !activeSessionId}
            className="shrink-0 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send size={16} />
          </button>
        )}
      </div>
      <p className="text-center text-xs text-gray-600 mt-2">Powered by Qwen3-Coder:30b · 100% local</p>
    </div>
  );
}
