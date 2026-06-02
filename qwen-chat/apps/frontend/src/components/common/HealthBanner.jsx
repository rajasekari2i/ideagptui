import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { getHealth } from '../../api/client';

export default function HealthBanner() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const data = await getHealth();
        const isOffline = data.ollama !== 'connected';
        setOffline(isOffline);
        if (!isOffline) setDismissed(false);
      } catch {
        setOffline(true);
      }
    }
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!offline || dismissed) return null;

  return (
    <div className="flex items-center gap-2 bg-yellow-900/80 border border-yellow-600 text-yellow-200 px-4 py-2 text-sm">
      <AlertTriangle size={16} className="shrink-0" />
      <span>Model offline — please start Ollama</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-auto hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
