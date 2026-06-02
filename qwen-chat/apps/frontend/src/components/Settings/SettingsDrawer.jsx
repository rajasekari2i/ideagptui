import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ModelParams from './ModelParams';
import useChatStore from '../../store/chatStore';

const DEFAULT_SETTINGS = { temperature: 0.7, maxTokens: 2048, topP: 0.9, topK: 40 };

export default function SettingsDrawer({ open, onClose }) {
  const { session, updateSessionSettings } = useChatStore();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setSettings({ ...DEFAULT_SETTINGS, ...session.settings });
      setSystemPrompt(session.systemPrompt || '');
    }
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSessionSettings({ settings, systemPrompt });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-80 bg-gray-900 border-l border-gray-700 flex flex-col h-full shadow-2xl">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-100">Chat Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <label className="block text-sm text-gray-300 mb-2 font-medium">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful coding assistant..."
              rows={5}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-300 mb-3">Model Parameters</p>
            <ModelParams settings={settings} onChange={setSettings} />
          </div>
        </div>

        <div className="p-5 border-t border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
