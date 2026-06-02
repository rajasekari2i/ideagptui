import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Bot, User } from 'lucide-react';
import CodeBlock from './CodeBlock';

export default function MessageBubble({ message, isStreaming }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`flex gap-3 group max-w-[720px] mx-auto px-4 py-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className={`relative flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-700 text-gray-100 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-invert prose-sm max-w-none"
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (!inline && match) {
                    return <CodeBlock language={match[1]}>{String(children).replace(/\n$/, '')}</CodeBlock>;
                  }
                  return (
                    <code className="bg-gray-900 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {isStreaming && !isUser && (
            <span className="cursor-blink inline-block w-2 h-4 bg-gray-300 ml-0.5 align-middle">▋</span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="mt-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-all"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
