export default function ModelParams({ settings, onChange }) {
  const set = (key, value) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-5">
      <div>
        <label className="flex justify-between text-sm text-gray-300 mb-1">
          <span>Temperature</span>
          <span className="text-gray-400">{settings.temperature}</span>
        </label>
        <input
          type="range" min="0" max="2" step="0.05"
          value={settings.temperature}
          onChange={(e) => set('temperature', parseFloat(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      <div>
        <label className="flex justify-between text-sm text-gray-300 mb-1">
          <span>Top-P</span>
          <span className="text-gray-400">{settings.topP}</span>
        </label>
        <input
          type="range" min="0" max="1" step="0.05"
          value={settings.topP}
          onChange={(e) => set('topP', parseFloat(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Max Tokens</label>
        <input
          type="number" min="128" max="8192" step="128"
          value={settings.maxTokens}
          onChange={(e) => set('maxTokens', parseInt(e.target.value, 10))}
          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Top-K</label>
        <input
          type="number" min="1" max="100"
          value={settings.topK}
          onChange={(e) => set('topK', parseInt(e.target.value, 10))}
          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
